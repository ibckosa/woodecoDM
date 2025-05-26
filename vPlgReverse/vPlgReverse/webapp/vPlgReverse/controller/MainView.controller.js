sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository"
], function (jQuery, PluginViewController, JSONModel, ErrorHandler, TextHandler, OrderRepository) {
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
                this.getView().setBusyIndicatorDelay(0);
                this.getView().setBusy(true);
                this._setInternalVariables();
                this._oOrder = await OrderRepository.readOrderByPassBuffer(this, this._oPlant, this._oOrderNumber);
                if(this._oOrder.getIsOrderMO()){
                    //await this._loadDataMO();
                }else{
                    await this._loadDataSO();
                }



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
            let oSfcsStepDetails = await this._getSfcStepDetails(oSfcs);
            let oSfcsIssues = await this._getSfcsIssues(oSfcs);
            

            for(const sfcStep of oSfcsStepDetails){
                if(sfcStep.lastCompleteTime){
                    let confText = "";
                    let issueText = "";


                    let stepIssues = oSfcsIssues.filter( issue => {return issue.sfc === sfcStep.sfc &&
                                                                          issue.stepId === sfcStep.stepId &&
                                                                          issue.comments !== "ADDITIONAL_ISSUE";});
                    let stepAdditionalIssues = oSfcsIssues.filter( issue => {return issue.sfc === sfcStep.sfc &&
                                                                             issue.stepId === sfcStep.stepId &&
                                                                            issue.comments === "ADDITIONAL_ISSUE";});

                    confText = `${this._oOrder.getHeaderMaterial()}: ${sfcStep.sfc} - ${sfcStep.quantityCompleted} ${this._oOrder.getUom()}`;
                    for(const issue of stepAdditionalIssues){
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
                            sfc: issue.sfc,
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
                                sfc: issue.sfc,
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
            let orderReceipts = await this._oOrder.getReceipts();
            let orderIssues = await this._getSfcsIssues([this._oSfc]);

            let oSfcsStepDetails = await this._getSfcStepDetails([this._oSfc]);

            for(const sfcStep of oSfcsStepDetails){
                let stepAdditionalIssues = oSfcsIssues.filter( issue => {return issue.sfc === sfcStep.sfc &&
                                                                                issue.stepId === sfcStep.stepId &&
                                                                                issue.comments === "ADDITIONAL_ISSUE";});

                    let stepOrderReceipts = orderReceipts.filter( receipt=>{return receipt.sfc === sfcStep.sfc;});

                    for(const receipt of stepOrderReceipts){
                        oReturn.push(
                            {
                                dateTime: receipt.postingDateTime,
                                confText: `${receipt.material}: ${receipt.handlingUnit} - ${receipt.quantityInBaseUnit.value} ${receipt.quantityInBaseUnit.unitOfMeasure}`,
                                issueText: "",
                                sfc: issue.sfc,
                                stepId: sfcStep.stepId,
                                stepDetails: sfcStep,
                                issues: [stepIssue],
                            }
                        );
                    }

                   for(const stepIssue of orderIssues){
                    oReturn.push(
                        {
                            dateTime: stepIssue.postingDateTime,
                            confText: "",
                            issueText: `${stepIssue.material}: ${stepIssue.handlingUnit} - ${stepIssue.quantityInBaseUnit.value} ${stepIssue.quantityInBaseUnit.unitOfMeasure}`,
                            sfc: issue.sfc,
                            stepId: sfcStep.stepId,
                            stepDetails: sfcStep,
                            issues: [stepIssue],
                        }
                    );
                }
            }
        },
        _getSfcsIssues: async function(sfcs){
            for(const sfc of sfcs){
                
            }
        }
	});
});