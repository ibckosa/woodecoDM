sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/BomRepository"
], function (jQuery, PluginViewController, JSONModel, ErrorHandler, TextHandler, OrderRepository, BomRepository) {
	"use strict";

	return PluginViewController.extend("ibc.dm.vPlgReverse.vPlgReverse.controller.MainView", {
		onInit: function () {
			PluginViewController.prototype.onInit.apply(this, arguments);
			this._oTextHandler = new TextHandler();
            this._oErrorHandler = new ErrorHandler(this);
			           
            
		},




        onAfterRendering: function(){
        

        },

        onBeforeRendering:  async function () {   
            await this._loadData();
        },

		onBeforeRenderingPlugin: function () {
            this.subscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.subscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
		},

        onPodSelectionChangeEvent: async function (sChannelId, sEventId, oData) {
            await this._loadData();
        },

        onWorkListSelectEvent: async function (sChannelId, sEventId, oData) {
            await this._loadData();
        },


        isSubscribingToNotifications: function() {
            
            var bNotificationsEnabled = true;
           
            return bNotificationsEnabled;
        },


        getCustomNotificationEvents: function(sTopic) {
        },


        getNotificationMessageHandler: function(sTopic) {
            return null;
        },

        _handleNotificationMessage: function(oMsg) {
        },

        _loadData: async function(){
            try{
                let returnTab = [];
                this.getView().setBusyIndicatorDelay(0);
                this.getView().setBusy(true);
                this._setInternalVariables();
                this._oOrder = await OrderRepository.readOrderByPassBuffer(this, this._oPlant, this._oOrderNumber);
                if(this._oOrder.getIsOrderMO()){
                    returnTab = await this._loadDataMO();
                }else{
                    returnTab = await this._loadDataSO();
                }
                const oModel = new JSONModel({ items: returnTab });
                this.getView().setModel(oModel, "stornoModel");


                this.getView().setBusy(false);
            }catch(oError){
                this.getView().setBusy(false);
                this._oErrorHandler.handleError(oError);
            }
        },
        

		onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);


		},
        _setInternalVariables: function(){
            let oPodSelectionModel = this.getPodSelectionModel();
            let oSelections = oPodSelectionModel.getSelections(); 
            let oFirstSelection = oSelections[0]; 
            this._oPlant = this.getPodController().getUserPlant();
            this._oOrderNumber = oFirstSelection.getShopOrder().getShopOrder();
            this._oWorkCenter = oPodSelectionModel.workCenter;
            this._oResource = oPodSelectionModel.resource.resource;
            this._oSfc = oFirstSelection.getSfc().getSfc();
        },
        _loadDataSO: async function(){
            let oReturn = [];
            let oSfcs = this._oOrder.getSfcs();
            let oSfcsStepDetails = await this._getSfcsStepDetails(oSfcs);
            let orderIssues = await this._getOrderIssues();
            

            for(const sfcStep of oSfcsStepDetails){
                if(sfcStep.lastCompleteTime){
                    let confText = "";
                    let issueText = "";


                    let stepIssues = orderIssues.filter( issue => {return issue.sfc === sfcStep.sfc &&
                                                                          issue.stepId === sfcStep.stepId &&
                                                                          issue.comments !== "ADDITIONAL_ISSUE";});
                    let stepAdditionalIssues = orderIssues.filter( issue => {return issue.sfc === sfcStep.sfc &&
                                                                             issue.stepId === sfcStep.stepId &&
                                                                            issue.comments === "ADDITIONAL_ISSUE";});

                    confText = `${this._oOrder.getHeaderMaterial()}: ${sfcStep.sfc} - ${sfcStep.quantityCompleted} ${this._oOrder.getUom()}`;
                    for(const issue of stepIssues){
                        if(issueText === ""){
                            issueText =  `${issue.material}: ${issue.handlingUnit} - ${issue.quantityInBaseUnit.value} ${issue.quantityInBaseUnit.unitOfMeasure}`;
                        }else{
                            issueText =  issueText + `\n${issue.material}: ${issue.handlingUnit} - ${issue.quantityInBaseUnit.value} ${issue.quantityInBaseUnit.unitOfMeasure}`;
                        }
                    }
                    confText = 
                    oReturn.push(
                        {
                            dateTime: sfcStep.lastCompleteTime,
                            confText: confText,
                            issueText: issueText,
                            sfc: sfcStep.sfc,
                            user: "",
                            stepId: sfcStep.stepId,
                            stepDetails: sfcStep,
                            issues: stepIssues
                        }
                    );

                    for(const stepIssue of stepAdditionalIssues){
                        oReturn.push(
                            {
                                dateTime: stepIssue.postingDateTime,
                                confText: "",
                                issueText: `${stepIssue.material}: ${stepIssue.handlingUnit} - ${stepIssue.quantityInBaseUnit.value} ${stepIssue.quantityInBaseUnit.unitOfMeasure}`,
                                sfc: stepIssue.sfc,
                                user: stepIssue.postedBy,
                                stepId: sfcStep.stepId,
                                stepDetails: sfcStep,
                                issues: [stepIssue],
                            }
                        );
                    }
                }
            }


            return oReturn;
        },
        _loadDataMO: async function(){
            debugger;
            let oReturn = [];
            let orderReceipts = await this._oOrder.getReceipts();
            let orderIssues = await this._getOrderIssues();

            let oSfcsStepDetails = await this._getSfcsStepDetails([this._oSfc]);

            for(const sfcStep of oSfcsStepDetails){
                    let stepOrderReceipts = orderReceipts.filter( receipt=>{return receipt.sfc === sfcStep.sfc;});

                    for(const receipt of stepOrderReceipts){
                        oReturn.push(
                            {
                                dateTime: receipt.postingDateTime,
                                confText: `${receipt.material}: ${receipt.handlingUnit} - ${receipt.quantityInBaseUnit.value} ${receipt.quantityInBaseUnit.unitOfMeasure}`,
                                issueText: "",
                                user: receipt.postedBy,
                                sfc: receipt.sfc,
                                stepId: sfcStep.stepId,
                                stepDetails: sfcStep,
                                issues: [],
                            }
                        );
                    }

                   for(const stepIssue of orderIssues){
                    oReturn.push(
                        {
                            dateTime: stepIssue.postingDateTime,
                            confText: "",
                            issueText: `${stepIssue.material}: ${stepIssue.handlingUnit} - ${stepIssue.quantityInBaseUnit.value} ${stepIssue.quantityInBaseUnit.unitOfMeasure}`,
                            user: stepIssue.postedBy,
                            sfc: stepIssue.sfc,
                            stepId: sfcStep.stepId,
                            stepDetails: sfcStep,
                            issues: [stepIssue],
                        }
                    );
                }
            }

            debugger;
            return oReturn;
        },
        _getOrderIssues: async function(){
            let promiesesIssues = [];

            let bomNumber = this._oOrder.getBomNumber();
            let bomType = this._oOrder.getBomType();
            let bomInstance = await BomRepository.getInstance(this, this._oPlant, bomNumber, bomType);
            let bomComponents = bomInstance.getComponents();

            for(const component of bomComponents){
                promiesesIssues.push(this._getOrderIssuesForMaterial(component.material.material, component.material.version));
            }
            let orderIssus = await Promise.all(promiesesIssues); 

            return [].concat(...orderIssus);
        },

        _getOrderIssuesForMaterial: async function(material, materialVersion){
            let sUrl = this.getPublicApiRestDataSourceUri() + "inventory/v1/inventory/goodsIssues";

            let oParameters = { plant: this._oPlant,
                                material: material,
                                materialVersion: materialVersion,
                                order: this._oOrderNumber,
                                size: 300,
                                page: 0 };

            return await new Promise((resolve,reject)=>{
                this.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve(oResponseData.content);
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve([]);
                    }   
                );

            });
        },
        _getSfcsStepDetails: async function(sfcs){
            let promisesSfcs = [];
            for(const sfc of sfcs){
                promisesSfcs.push(this._getSfcStepDetails(sfc))
            }
            let sfcsSteps = await Promise.all(promisesSfcs);

            return [].concat(...sfcsSteps);

        },
        _getSfcStepDetails: async function(sfc){
            let sUrl = this.getPublicApiRestDataSourceUri() + "sfc/v1/stepActivity";
            
            let oParameters = { plant: this._oPlant,
                                sfc: sfc };

            return await new Promise((resolve,reject)=>{
                this.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        if(oResponseData.steps){
                            for(const step of oResponseData.steps){
                                step.sfc = sfc;
                            }
                            resolve(oResponseData.steps);
                        }else
                        {
                            resolve([]);
                        }
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve([]);
                    }   
                );

            });
        }
	});
});