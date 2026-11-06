sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/BomRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcDataCollectionReader",
    "ibc/dm/plugins/wcPodToolsProvider/SfcMovementReverse",
    "ibc/dm/plugins/wcPodToolsProvider/Reprinter"
], function (jQuery, PluginViewController, JSONModel, ErrorHandler, TextHandler, OrderRepository, BomRepository, SfcDataCollectionReader, SfcMovementReverse, Reprinter) {
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
                let stornoFunctionAvailable = this._getStornoButtonVisibleConfiguration();
                this.getView().setBusyIndicatorDelay(0);
                this.getView().setBusy(true);
                this._setInternalVariables();
                this._oOrder = await OrderRepository.readOrderByPassBuffer(this, this._oPlant, this._oOrderNumber);
                if(this._oOrder.getIsOrderMO()){
                    returnTab = await this._loadDataMO();
                }else{
                    returnTab = await this._loadDataSO();
                }
                for(const returnLine of returnTab){
                    returnLine.stornoFunctionAvailable = stornoFunctionAvailable;
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
            try{
                let oPodSelectionModel = this.getPodSelectionModel();
                let oSelections = oPodSelectionModel.getSelections(); 
                let oFirstSelection = oSelections[0]; 
                this._oPlant = this.getPodController().getUserPlant();
                this._oOrderNumber = oFirstSelection.getShopOrder().getShopOrder();
                this._oWorkCenter = oPodSelectionModel.workCenter;
                this._oResource = oPodSelectionModel.resource.resource;
                this._oSfc = oFirstSelection.getSfc().getSfc();
                this._operation = oFirstSelection.getSfcData().getOperation();
                this._routing = oFirstSelection.getSfcData().getRouting();
                this._routingVersion = oFirstSelection.getSfcData().getRoutingVersion();
            }catch(error){
                this._oErrorHandler.throwErrorNoDisplay("");
            }
        },
        _loadDataSO: async function(){
            let oReturn = [];
            let oSfcs = this._oOrder.getSfcs();
            let sfcCollectionData = await SfcDataCollectionReader.readCollections(this, this._oPlant, oSfcs, this._operation, true, false, this._routing, this._routingVersion );

            sfcCollectionData = sfcCollectionData.filter(collection => { 
                
                let sfcStepQuan = collection.SFC_STEP.quantityDone + collection.SFC_STEP.quantityScrapped + collection.SFC_STEP.quantityInQueue + collection.SFC_STEP.quantityInWork;
                return collection.SFC_STEP.operation.operation === this._operation && 
               ( sfcStepQuan  === parseInt(collection.QUANTITY) || collection["Q1/Q3"] !== "Q1" ) });

            for(const collection of sfcCollectionData){
                collection.confText = "";
                collection.issueText = "";
                collection.Q1_Q3 = collection["Q1/Q3"];
                if(collection.QUANTITY&&collection.QUANTITY>0){
                    if(collection.HU){
                        collection.confText = `${collection["Q1/Q3"]}: ${collection.MATERIAL}: ${collection.HU} - ${collection.QUANTITY} ${collection.UOM}`
                    }else{
                        collection.confText = `${collection["Q1/Q3"]}: ${collection.MATERIAL}: ${collection.SFC_NUMBER} - ${collection.QUANTITY} ${collection.UOM}`
                    }
                    if(collection.NC_CODE_DESCRIPTION){
                        collection.confText = collection.confText + `\n${collection.NC_CODE_DESCRIPTION}`;
                    }
                    let positionDimensions = this._oOrder.getDimensions(parseInt(collection.ITEM_NO));
                    if(positionDimensions.LA > 0 && positionDimensions.BR > 0){
                        collection.confText = collection.confText + `\n${positionDimensions.LA}x${positionDimensions.BR}`;
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




            return oReturn;
        },
        _loadDataMO: async function(){
            let oReturn = [];
            let oSfcs = this._oOrder.getSfcs();
            let sfcCollectionData = await SfcDataCollectionReader.readCollections(this, this._oPlant, oSfcs, this._operation, true, false, this._routing, this._routingVersion);

            for(const collection of sfcCollectionData){
                collection.confText = "";
                collection.issueText = "";
                collection.Q1_Q3 = collection["Q1/Q3"];
                if(collection.QUANTITY&&collection.QUANTITY>0){
                    if(collection.HU){
                        collection.confText = `${collection["Q1/Q3"]}: ${collection.MATERIAL}: ${collection.HU} - ${collection.QUANTITY} ${collection.UOM}`
                    }else{
                        collection.confText = `${collection["Q1/Q3"]}: ${collection.MATERIAL}: ${collection.SFC_NUMBER} - ${collection.QUANTITY} ${collection.UOM}`
                    }
                    if(collection.NC_CODE_DESCRIPTION){
                        collection.confText = collection.confText + `\n${collection.NC_CODE_DESCRIPTION}`;
                    }
                    let positionDimensions = this._oOrder.getDimensions(parseInt(collection.ITEM_NO));
                    if(positionDimensions.LA > 0 && positionDimensions.BR > 0){
                        collection.confText = collection.confText + `\n${positionDimensions.LA}x${positionDimensions.BR}`;
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
            result.push( new sap.m.Button({ text: "{i18n>cancel}", press: this.onReverseButton.bind(this), visible: "{= ${stornoModel>CANCELLED} !== 'true' && ${stornoModel>stornoFunctionAvailable} }" }) );
            result.push( new sap.m.Button({ text: "{i18n>reprint}", icon: "sap-icon://print", press: this.onPrint.bind(this), visible: "{= ${stornoModel>Q1_Q3} !== 'AI' && ${stornoModel>PRINTING_PARAMETERS} !== undefined && ${stornoModel>PRINTING_PARAMETERS} !== null && ${stornoModel>PRINTING_PARAMETERS} !== '' || ${stornoModel>Q1_Q3} === 'Q3' }" }) );
            return result;
        },
        onReverseButton: async function(event){
            try{
                this.getView().setBusyIndicatorDelay(0);
                this.getView().setBusy(true);
                const selectedItem = event.getSource().getParent().getBindingContext("stornoModel").getObject();
                let sfcMovementReverse = new SfcMovementReverse(this, this._oPlant, this._oWorkCenter, this._oResource, selectedItem, this._oOrderNumber, this._oSfc, this._routing, this._routingVersion);
                await sfcMovementReverse.execute();
                await this._loadData();
                this.getView().setBusy(false);
            }catch(error){
                if(!error.displayType){
                    error.displayType = "POPUP";
                }
                this.getView().setBusy(false);
                this._oErrorHandler.handleError(error);
            }
        },
        _getStornoButtonVisibleConfiguration: function(){
            let result = false;

            var oConfiguration = this.getConfiguration();
            if (oConfiguration && typeof oConfiguration.stornoButtonVisible !== "undefined") {
                result = oConfiguration.stornoButtonVisible;
            }
            return result;
        },
        onPrint: async function(event){
            try{
                this.getView().setBusyIndicatorDelay(0);
                this.getView().setBusy(true);
                const selectedItem = event.getSource().getParent().getBindingContext("stornoModel").getObject();
                let reprinter = new Reprinter(this, selectedItem);
                await reprinter.execute();
                this.getView().setBusy(false);
            }catch(error){
                if(!error.displayType){
                    error.displayType = "POPUP";
                }
                this.getView().setBusy(false);
                this._oErrorHandler.handleError(error);
            }
        }

	});
});