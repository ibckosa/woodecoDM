sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/BomRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcDataCollectionReader",
    "ibc/dm/plugins/wcPodToolsProvider/SfcMovementReverse"
], function (jQuery, PluginViewController, JSONModel, ErrorHandler, TextHandler, OrderRepository, BomRepository, SfcDataCollectionReader, SfcMovementReverse) {
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
            this._operation = oFirstSelection.getSfcData().getOperation();
        },
        _loadDataSO: async function(){
            let oReturn = [];
            let oSfcs = this._oOrder.getSfcs();
            debugger;
            let sfcCollectionData = await SfcDataCollectionReader.readCollections(this, this._oPlant, oSfcs);

            sfcCollectionData = sfcCollectionData.filter(collection => { 
                
                let sfcStepQuan = collection.SFC_STEP.quantityDone + collection.SFC_STEP.quantityScrapped + collection.SFC_STEP.quantityInQueue + collection.SFC_STEP.quantityInWork;
                return collection.SFC_STEP.operation.operation === this._operation && 
               ( sfcStepQuan  === parseInt(collection.QUANTITY) || collection["Q1/Q3"] !== "Q1" ) });

            for(const collection of sfcCollectionData){
                collection.confText = "";
                collection.issueText = "";
                if(collection.QUANTITY&&collection.QUANTITY>0){
                    if(collection.HU){
                        collection.confText = `${collection["Q1/Q3"]}: ${collection.MATERIAL}: ${collection.HU} - ${collection.QUANTITY} ${collection.UOM}`
                    }else{
                        collection.confText = `${collection["Q1/Q3"]}: ${collection.MATERIAL}: ${collection.SFC_NUMBER} - ${collection.QUANTITY} ${collection.UOM}`
                    }
                }

                if(collection.CONSUMPTION&&collection.CONSUMPTION.length>0){
                    for(const issue of collection.CONSUMPTION){
                        if(collection.issueText === ""){
                            collection.issueText =  `${issue.material}: ${issue.handlingUnit} - ${issue.quantity} ${issue.uom}`;
                        }else{
                            collection.issueText =  collection.issueText + `\n${issue.material}: ${issue.handlingUnit} - ${issue.quantity} ${issue.uom}`;
                        }
                    }
                }
            }
            return sfcCollectionData;


            // let oSfcsStepDetails = await this._getSfcsStepDetails(oSfcs);
            // let orderIssues = await this._getOrderIssues();
            

            // for(const sfcStep of oSfcsStepDetails){
            //     if(sfcStep.lastCompleteTime){
            //         let confText = "";
            //         let issueText = "";


            //         let stepIssues = orderIssues.filter( issue => {return issue.sfc === sfcStep.sfc &&
            //                                                               issue.stepId === sfcStep.stepId &&
            //                                                               issue.comments !== "ADDITIONAL_ISSUE";});
            //         let stepAdditionalIssues = orderIssues.filter( issue => {return issue.sfc === sfcStep.sfc &&
            //                                                                  issue.stepId === sfcStep.stepId &&
            //                                                                 issue.comments === "ADDITIONAL_ISSUE";});

            //         confText = `${this._oOrder.getHeaderMaterial()}: ${sfcStep.sfc} - ${sfcStep.quantityCompleted} ${this._oOrder.getUom()}`;
            //         for(const issue of stepIssues){
            //             if(issueText === ""){
            //                 issueText =  `${issue.material}: ${issue.handlingUnit} - ${issue.quantityInBaseUnit.value} ${issue.quantityInBaseUnit.unitOfMeasure}`;
            //             }else{
            //                 issueText =  issueText + `\n${issue.material}: ${issue.handlingUnit} - ${issue.quantityInBaseUnit.value} ${issue.quantityInBaseUnit.unitOfMeasure}`;
            //             }
            //         }
            //         confText = 
            //         oReturn.push(
            //             {
            //                 dateTime: sfcStep.lastCompleteTime,
            //                 confText: confText,
            //                 issueText: issueText,
            //                 sfc: sfcStep.sfc,
            //                 user: "",
            //                 stepId: sfcStep.stepId,
            //                 stepDetails: sfcStep,
            //                 issues: stepIssues
            //             }
            //         );

            //         for(const stepIssue of stepAdditionalIssues){
            //             oReturn.push(
            //                 {
            //                     dateTime: stepIssue.postingDateTime,
            //                     confText: "",
            //                     issueText: `${stepIssue.material}: ${stepIssue.handlingUnit} - ${stepIssue.quantityInBaseUnit.value} ${stepIssue.quantityInBaseUnit.unitOfMeasure}`,
            //                     sfc: stepIssue.sfc,
            //                     user: stepIssue.postedBy,
            //                     stepId: sfcStep.stepId,
            //                     stepDetails: sfcStep,
            //                     issues: [stepIssue],
            //                 }
            //             );
            //         }
            //     }
            // }


            return oReturn;
        },
        _loadDataMO: async function(){
            debugger;
            let oReturn = [];
            // let orderReceipts = await this._oOrder.getReceipts();
            // let orderIssues = await this._getOrderIssues();

            // let oSfcsStepDetails = await this._getSfcsStepDetails([this._oSfc]);

            // let sfcsDataCollections = await this._getSfcsDataCollections([this._oSfc]);


            // for(const sfcStep of oSfcsStepDetails){
            //         let stepOrderReceipts = orderReceipts.filter( receipt=>{return receipt.sfc === sfcStep.sfc;});

            //         for(const receipt of stepOrderReceipts){
            //             oReturn.push(
            //                 {
            //                     dateTime: receipt.postingDateTime,
            //                     confText: `${receipt.material}: ${receipt.handlingUnit} - ${receipt.quantityInBaseUnit.value} ${receipt.quantityInBaseUnit.unitOfMeasure}`,
            //                     issueText: "",
            //                     user: receipt.postedBy,
            //                     sfc: receipt.sfc,
            //                     stepId: sfcStep.stepId,
            //                     stepDetails: sfcStep,
            //                     issues: [],
            //                 }
            //             );
            //         }

            //        for(const stepIssue of orderIssues){
            //         oReturn.push(
            //             {
            //                 dateTime: stepIssue.postingDateTime,
            //                 confText: "",
            //                 issueText: `${stepIssue.material}: ${stepIssue.handlingUnit} - ${stepIssue.quantityInBaseUnit.value} ${stepIssue.quantityInBaseUnit.unitOfMeasure}`,
            //                 user: stepIssue.postedBy,
            //                 sfc: stepIssue.sfc,
            //                 stepId: sfcStep.stepId,
            //                 stepDetails: sfcStep,
            //                 issues: [stepIssue],
            //             }
            //         );
            //     }
            // }
            debugger;
            let sfcCollectionData = await SfcDataCollectionReader.readCollections(this, this._oPlant, [this._oSfc]);

            for(const collection of sfcCollectionData){
                collection.confText = "";
                collection.issueText = "";
                if(collection.QUANTITY&&collection.QUANTITY>0){
                    if(collection.HU){
                        collection.confText = `${collection["Q1/Q3"]}: ${collection.MATERIAL}: ${collection.HU} - ${collection.QUANTITY} ${collection.UOM}`
                    }else{
                        collection.confText = `${collection["Q1/Q3"]}: ${collection.MATERIAL}: ${collection.SFC_NUMBER} - ${collection.QUANTITY} ${collection.UOM}`
                    }
                }

                if(collection.CONSUMPTION&&collection.CONSUMPTION.length>0){
                    for(const issue of collection.CONSUMPTION){
                        if(collection.issueText === ""){
                            collection.issueText =  `${issue.material}: ${issue.handlingUnit} - ${issue.quantity} ${issue.uom}`;
                        }else{
                            collection.issueText =  collection.issueText + `\n${issue.material}: ${issue.handlingUnit} - ${issue.quantity} ${issue.uom}`;
                        }
                    }
                }
            }
            return sfcCollectionData;
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
        },
        formatDateTime: function (sDateTime) {
            if (!sDateTime) return "";

            // Konwersja do obiektu Date
            var oDate = new Date(sDateTime);
            if (isNaN(oDate)) return "";

            // Pobranie składników
            var year = oDate.getFullYear();
            var month = String(oDate.getMonth() + 1).padStart(2, '0');
            var day = String(oDate.getDate()).padStart(2, '0');
            var hours = String(oDate.getHours()).padStart(2, '0');
            var minutes = String(oDate.getMinutes()).padStart(2, '0');
            var seconds = String(oDate.getSeconds()).padStart(2, '0');

            // Formatowanie
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        },
        createRow: function(sId, oContext){
            let isRowToModify = oContext.getProperty("CANCELLED") === 'true';
            return new sap.m.ColumnListItem({
                cells: this._getCells()
            }).addStyleClass(isRowToModify ? "stornedRow" : "");
        },
        _getCells: function(){
            let result = [];
            
            result.push( new sap.m.Text({ text: { path: "stornoModel>DATE_CREATED", formatter: this.formatDateTime } }) );
            result.push( new sap.m.Text({ text: "{stornoModel>confText}" }) );
            result.push( new sap.m.Text({ text: "{stornoModel>issueText}" }) );
            result.push( new sap.m.Text({ text: "{stornoModel>USER}"}) );
            result.push( new sap.m.Button({ text: "Storno", press: this.onReverseButton.bind(this), visible: "{= ${stornoModel>CANCELLED} !== 'true' }" }) );

            return result;
        },
        onReverseButton: async function(event){
            try{
                debugger;
                const selectedItem = event.getSource().getParent().getBindingContext("stornoModel").getObject();
                let sfcMovementReverse = new SfcMovementReverse(this, this._oPlant, this._oWorkCenter, this._oResource, selectedItem, this._oOrderNumber, this._oSfc);
                await sfcMovementReverse.execute();
                await this._loadData();
            }catch(error){
                this._oErrorHandler.handleError(error);
            }
        }

	});
});