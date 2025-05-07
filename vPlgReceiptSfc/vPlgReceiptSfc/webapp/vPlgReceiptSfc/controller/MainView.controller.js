sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/dm/dme/podfoundation/controller/PluginViewController",
    "sap/base/Log",
    "sap/dm/dme/model/AjaxUtil",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/library",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "ibc/dm/plugins/wcPodToolsProvider/IssuesManager",
    "ibc/dm/plugins/wcPodToolsProvider/SfcReceipt",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository",
        "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (JSONModel, PluginViewController, Log, AjaxUtil, Dialog, Button, Text, mobileLibrary, ErrorHandler, SfcRepository, IssuesManager, SfcReceipt, ResourceRepository, TextHandler) {
    "use strict";

    var oLogger = Log.getLogger("exampleExecutionPlugin", Log.Level.INFO);
    
    var oPluginViewController = PluginViewController.extend("ibc.dm.vPlgReceiptSfc.vPlgReceiptSfc.controller.MainView", {
        metadata: {
            properties: {
            }
        },

        onInit: function () {
            if (PluginViewController.prototype.onInit) {
                PluginViewController.prototype.onInit.apply(this, arguments); 
            } 
            this._oErrorHandler = new ErrorHandler(this);   
            this._reloadQ1Plugin = true;
            this._oCurrentSfc = "";
            this._oTextHandler = new TextHandler(); 
            //this.getView().setBusy(true);
        },

        /**
         * @see PluginViewController.onBeforeRenderingPlugin()
         */
        onBeforeRenderingPlugin: function () {
            // subscribe on POD events
            this.subscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.subscribe("OperationListSelectEvent", this.onOperationChangeEvent, this);
            this.subscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
            var oConfig = this.getConfiguration();
            // check if close icon should be displayed
            this.configureNavigationButtons(oConfig); 
            //this.getView().setBusy(true);
            //debugger;
        },

        onExit: function () {
            if (PluginViewController.prototype.onExit) {
                PluginViewController.prototype.onExit.apply(this, arguments);
            }
            // unsubscribe from POD events on exit
            this.unsubscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.unsubscribe("OperationListSelectEvent", this.onOperationChangeEvent, this);
            this.unsubscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
        },

        onBeforeRendering: function () {   
            this.loadModel();
        },

        onAfterRendering: function () {
        },

        onPodSelectionChangeEvent: function (sChannelId, sEventId, oData) {
            this.loadModel();
        },

        onOperationChangeEvent: function (sChannelId, sEventId, oData) {
            this.loadModel();
        },

        onWorkListSelectEvent: function (sChannelId, sEventId, oData) {
            this.loadModel();
        },

        loadModel: async function () {
            
            try{

                var oPodSelectionModel = this.getPodSelectionModel();
                if (!oPodSelectionModel) { }
                let aSelections = oPodSelectionModel.getSelections();
                if(!aSelections || aSelections.length < 1 ){ return; }
                let oFirstSelection = aSelections[0];

                if(oFirstSelection.getSfc().getSfc() !== this._oCurrentSfc||this._reloadQ1Plugin || true){
                    this.getView().setBusyIndicatorDelay(0);
                    this.getView().setBusy(true);
                    await this._setVisibilityOfPalleteNumber();
                    let oCustomQuan = this._getCustomQuan( oFirstSelection );
                    await this._setInputQuantity(oFirstSelection,oCustomQuan)
                    this._oCurrentSfc = oFirstSelection.getSfc().getSfc();
                    this._reloadQ1Plugin = false;
                    await this._setFieldVisibility();
                }
                this.getView().setBusy(false);   
            }catch(oError){
                this.getView().setBusy(false);
                this._oErrorHandler.handleError(oError); }            
        },

        /*
         * This enables receiving Notification messages in the plugin
         * @override
         */
        isSubscribingToNotifications: function () {
            var oConfiguration = this.getConfiguration();
            var bNotificationsEnabled = true;
            if (oConfiguration && typeof oConfiguration.notificationsEnabled !== "undefined") {
                bNotificationsEnabled = oConfiguration.notificationsEnabled;
            }
            return bNotificationsEnabled;
        },

        /*
         * Return the event name (i.e.;MEASUREMENT) being subscribed to by this plugin
         * @override
         */
        getCustomNotificationEvents: function () {
            return ["MEASUREMENT"];
        },

        /*
         * Return the function to be called when a MEASUREMENT notification message is received
         * @override
         */
        getNotificationMessageHandler: function (sTopic) {
            if (sTopic === "MEASUREMENT") {
                return this.handleNotificationMessage;
            }
            return null;
        },

        handleNotificationMessage: function (oMsg) {
            //oLogger.info("handleNotificationMessage oMsg:" + oMsg);
            var sMessage = "Message not found in payload 'message' property";
            if (oMsg && oMsg.parameters && oMsg.parameters.length > 0) {
                for (var i = 0; i < oMsg.parameters.length; i++) {
                    if (oMsg.parameters[i].name === "message") {
                        sMessage = oMsg.parameters[i].value;
                        break;
                    }
                }
            }
            this.getView().getModel().setProperty("/notificationMessage", sMessage);
        },

        addMaterialCustomFields: function (sPlant, sMaterial) {
            // Populate parameters with plant and material name 
            var oParameters = {
                plant: sPlant,
                material: sMaterial
            };
            var sUrl = this.getPublicApiRestDataSourceUri() + "/material/v1/materials";
            // Ajax GET request to read Material custom fields by using Public API 
            this.executeAjaxGetRequest(sUrl, oParameters);           
        },

        executeAjaxGetRequest: function (sUrl, oParameters) {
            var that = this;
            this.ajaxGetRequest(sUrl, oParameters,
                function (oResponseData) {
                    that.handleResponse(oResponseData);
                },
                function (oError, sHttpErrorMessage) {
                    that.handleError(oError, sHttpErrorMessage);
                }
            );
        },

        handleResponse: function (oResponseData) {            
            if (oResponseData && oResponseData.length > 0) {
                // set customValues data to model property "materialCustomFields"    
                this.getView().getModel().setProperty("/materialCustomFields", oResponseData[0].customValues);
            }
        },

        handleError: function (oError, sHttpErrorMessage) {
            var err = oError || sHttpErrorMessage;
            // show error in message toast   
            this.showErrorMessage(err, true, true);
        },
        
        configureNavigationButtons: function (oConfiguration) {
            if (!this.isPopup() && !this.isDefaultPlugin()) {
                this.byId("closeButton").setVisible(oConfiguration.closeButtonVisible);
            }
        },
        onButtonReceipt: async function(oEvent){
            try{
                let oPodController = this.getPodController();
                let oPodSelectionModel = this.getPodSelectionModel();
                let aSelections = oPodSelectionModel.getSelections();  
                if(aSelections.length < 1){ return; };
                this.getView().setBusyIndicatorDelay(0);
                this.getView().setBusy(true);
                debugger;   
                let aSelectionFirstRow = aSelections[0];
                let oResource = await ResourceRepository.getResourceInstance(this, oPodController.getUserPlant(), oPodSelectionModel.resource.resource);
                let oReceiptParameters = { plant : oPodController.getUserPlant(),
                    order: aSelectionFirstRow.getShopOrder().getShopOrder(),
                    material: aSelectionFirstRow.getSfcData().getMaterial() ,
                    materialVersion: aSelectionFirstRow.getSfcData().getMaterialVersion(),
                    quantity: parseInt(this.byId("inputReceiptQuantity").getValue()),
                    unitOfMeasure: "",		
                    sfc: aSelectionFirstRow.getSfc().getSfc(),
                    storageLocation: "",
                    resource: oPodSelectionModel.resource.resource,
                    sfcQuantity: parseInt(aSelectionFirstRow.getSfcData().getQuantity()),
                    operationActivity: aSelectionFirstRow.getSfcData().getOperation(),
                    workCenter: oPodSelectionModel.workCenter,
                    palletesNumber: parseInt(this.byId("inputPalleteQuan").getValue()),
                    printingCopies: parseInt(this.byId("rbg1").getSelectedButton().getText()),
                    packageNumber: parseInt(this.byId("inputPackageQuan").getValue()),
                    printer: oResource.getPrinterId() };
                
                oReceiptParameters.printer 
                ///uruchamianie nowego kodu
                    let oSfcReceipt = new SfcReceipt(this, oReceiptParameters);
                    await oSfcReceipt.executeIssue();
                    this._reloadQ1Plugin = true;
                    this.getView().setBusy(false);

            }catch(oError){
                this.getView().setBusy(false);
                this._oErrorHandler.handleError(oError);
            }
            
        },
        _getCustomQuan: function(oSelection){
            var oCustomquan = { isSetted: false,
                                value: 0 };

            var sInput = oSelection.getInput();
            if (sInput && sInput !== "") {
                var oCustomField = oSelection.getCustomFields();
                var oCustomFieldValue = oCustomField["SHOP_ORDER.ITEM_1"];
                if(oCustomFieldValue!=undefined){ var oCustomFieldValueSplitted = oCustomFieldValue.split("||"); }
                
                if(oCustomFieldValueSplitted != undefined && oCustomFieldValueSplitted.length>2){
                    var oValue = oCustomFieldValueSplitted[2].substring(7,10);
                    if(!isNaN(oValue)){
                        oCustomquan.isSetted = true;
                        oCustomquan.value = Number(oValue); 
                    }
                }
            }
            return oCustomquan;
        },
        _setInputQuantity: async function(oSelection, oCustomQuan){
            var sUrl = this.getPublicApiRestDataSourceUri() + "/inventory/v1/inventory/goodsReceipts/summarize";
            var that = this;
            var oParameters = {
                plant: this.getPodController().getUserPlant(),
                sfc: oSelection.getSfc().getSfc(),
                order: oSelection.getShopOrder().getShopOrder()   
            };

            var oOrderDetails = await this._getShopOrderDetails(oParameters.plant, oParameters.order );

            await this.ajaxGetRequest(sUrl, oParameters,
                function (oResponseData) {
                    debugger;
                    var modelData = { receiptQuan: 0,
                                      isCustomQuan: oCustomQuan.isSetted,
                                      uom: "" };
                    
                    var oSfcQuanDelivered = 0;

                    modelData.uom = oOrderDetails.oResponse.productionUnitOfMeasureObject.uom;
                    if(modelData.uom === "PC"){modelData.uom = "SZT"};

                    var oSfcReceipts = oResponseData.sfcs[0].items;
                    if(oSfcReceipts && oSfcReceipts.length > 0){
                        oSfcReceipts.forEach(SfcReceipt => {
                            oSfcQuanDelivered = oSfcQuanDelivered + SfcReceipt.quantityInBaseUnit.value;
                        });
                    }
                    var oSfcQuanLeft = oSelection.getSfcData().getQuantity() - oSfcQuanDelivered;

                    if(oCustomQuan.isSetted){
                        if(oSfcQuanLeft > oCustomQuan.value){
                            modelData.receiptQuan = oCustomQuan.value;
                            
                        }else{
                            modelData.receiptQuan = oSfcQuanLeft;
                        }
                    }else{
                        modelData.receiptQuan =  oSfcQuanLeft;
                    }
                    if(modelData.receiptQuan < 0){modelData.receiptQuan = 0}

                    that.getView().setModel(new JSONModel( modelData ));
                    that.getView().setBusy(false);
                },
                function (oError, sHttpErrorMessage) {
                    that.handleError(oError, sHttpErrorMessage);
                    that.getView().setBusy(false);
                }
            );
        },
        onReceiptInputLiveChange: function(oEvent) {
            var value = oEvent.getParameter("value");
            var newValue = value.replace(/[^0-9]/g, ''); 
            if (value !== newValue) {
                oEvent.getSource().setValue(newValue);
            }
        },
        _checkOrderIsEwm: async function(oPlant, oOrder){
            var oReturn = { isEwmOrder: null ,
                            storageLocation: "",
                            oErrorMessage: "",
                            unitOfMeasure: "",
                            isError: false };
            var sUrl = this.getPublicApiRestDataSourceUri() + "/inventory/v1/storageLocations";
            var that = this;
            var oOrderDetails = await this._getShopOrderDetails(oPlant, oOrder);

            if(oOrderDetails.isError === true){
                oReturn.isError = true;
                oReturn.oErrorMessage = oOrderDetails.oErrorMessage;
                return oReturn; }
            
            if(oOrderDetails.oResponse.putawayStorageLocation === undefined){
                this._oErrorHandler.throwError("");
                // oReturn.isError = true;
                // oReturn.oErrorMessage = this._getText("noStorageLocationError");
                // return oReturn; 
            }

            oReturn.storageLocation = oOrderDetails.oResponse.putawayStorageLocation;
            oReturn.unitOfMeasure = oOrderDetails.oResponse.baseUnitOfMeasureObject.uom;

            var oParameters = { plant: oPlant,
                                storageLocation: oOrderDetails.oResponse.putawayStorageLocation };


            return await new Promise((resolve,reject)=>{
                that.ajaxGetRequest(sUrl, oParameters,
                    function (oResponseData) {
                        if(oResponseData.content.length > 0)
                        {
                            oReturn.isEwmOrder =  oResponseData.content[0].isEWMManagedStorageLocation;
                        }else{
                            oReturn.isError = true;
                        }
                        resolve(oReturn);
                    },
                    function (oError, sHttpErrorMessage) {
                        reject(oError);
                    }   
                );

            });

        },
        _getShopOrderDetails: async function(oPlant, oOrder){ 
            var sUrl = this.getPublicApiRestDataSourceUri() + "/order/v1/orders";
            var that = this;
            var oReturn = { oResponse: null ,
                            oErrorMessage: "",
                            isError: false };


            var oParameters = { order: oOrder,
                                plant: oPlant };
            return await new Promise((resolve,reject)=>{
                that.ajaxGetRequest(sUrl, oParameters,
                    function (oResponseData) {
                        oReturn.oResponse = oResponseData;
                        resolve(oReturn);
                    },
                    function (oError, sHttpErrorMessage) {
                        oReturn.isError = true;
                        oReturn.oErrorMessage = oError.message;
                        reject(oError);
                    }   
                );

            });
        },
        
        _getNextHuNumber: async function(oNextHuNumberParameters){
            var oReturn = { isError: false,
                            oErrorMessage: "",
                            numberHu: ""
            };
            
            var sUrl = this.getPublicApiRestDataSourceUri() + "/numbering/v1/identifiers";
            var that = this;

            return await new Promise((resolve,reject)=>{
                that.ajaxPostRequest(sUrl, oNextHuNumberParameters,
                    function (oResponseData) {
                        if(oResponseData.identifiers.length>0){
                            oReturn.numberHu = oResponseData.identifiers[0];
                        }else{
                            oReturn.isError = true;
                            oReturn.oErrorMessage = this._getText("messageGenerateHuError");
                        }
                        oReturn.oResponse = oResponseData;
                        resolve(oReturn);
                    },
                    function (oError, sHttpErrorMessage) {
                        oReturn.isError = true;
                        oReturn.oErrorMessage = oError.message;
                        reject(oReturn);
                    }   
                );

            });

        },
        _createHU: async function(oCreateHuResponse){},
        _executeEwmReceipt: async function(oReceiptParameters){
            var oReturn = { isError: false,
                            returnMessage: "" };



            

            var oNextHuNumberParameters = { plant: oReceiptParameters.plant,
                                            eventName: "PACKING_UNIT_NUMBER",
                                            objectsToMatch: {    MATERIAL_NAME: oReceiptParameters.material,
                                                                 MATERIAL_VERSION : oReceiptParameters.materialVersion,
                                                                 ORDER_TYPE: "Production" } };
            var oNextNumberResponse = await this._getNextHuNumber(oNextHuNumberParameters);
            debugger;
            if(oNextNumberResponse.isError===true){
                oReturn.isError = true;
                oReturn.returnMessage = oNextHuNumberParameters.oErrorMessage;
                return oReturn;
            }
            var sUrl = this.getPackingRestDataSourceUri()  + "packingUnits";

            var oParameters = { carrier: null,
                                content: [{
                                    id: null,
                                    packingUnit: null,
                                    quantity: oReceiptParameters.quantity,
                                    sfc: {ref: "SFCBO:"+oReceiptParameters.plant+","+oReceiptParameters.sfc}
                                }],
                                currentLocation: null,
                                material: {ref: "ItemBO:"+oReceiptParameters.plant+",PALETA,A"},
                                number: oNextNumberResponse.numberHu,
                                packingType: null,
                                status: "CLOSED",
                                workCenterLocation: null };
            return await new Promise((resolve,reject)=>{

                AjaxUtil.post(sUrl, oParameters,
                    (oResponseData) => {
                        oReturn.returnMessage = this._getText("messageReceiptSuccess");
                        resolve(oReturn);

                    },
                    (oError, sHttpErrorMessage) => {
                        // oReturn.isError = true;
                        // oReturn.returnMessage = this._getText("messageReceiptError");
                        reject(oError);
                    }
                );

            });

        },
        _executeMmReceipt: async function(oReceiptParameters){
            var oReturn = { isError: false,
                            returnMessage: this._getText("messageReceiptSuccess") };

            return oReturn;
            var oParameters = {
                lineItems: [{ material: oReceiptParameters.material,
                              materialVersion: oReceiptParameters.materialVersion,
                              quantity: { unitOfMeasure: { commercialUnitOfMeasure: oReceiptParameters.unitOfMeasure,
                                                           internalUnitOfMeasure: null,
                                                           isoUnitOfMeasure: null },
                                        value: oReceiptParameters.quantity
                              },
                              requireQuantityToleranceCheck: false,
                              sfc: oReceiptParameters.sfc,
                              storageLocation: oReceiptParameters.storageLocation
                }],
                order: oReceiptParameters.order,
                plant: oReceiptParameters.plant
            };
            var sUrl = this.getPublicApiRestDataSourceUri() + "/inventory/v1/inventory/erpGoodsReceipts";
            
            return await new Promise((resolve,reject)=>{
                this.ajaxPostRequest(sUrl, oParameters,
                    function (oResponseData) {
                        if (typeof oResponseData.order !== 'undefined'){
                            oReturn.returnMessage = this.getView().getModel("i18n").getResourceBundle().getText("messageReceiptSuccess");
                        }else{
                            oReturn.isError = true;
                            oReturn.returnMessage = this.getView().getModel("i18n").getResourceBundle().getText("messageReceiptError");
                        }
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        // oReturn.isError = true;
                        // oReturn.returnMessage = oError.message;
                        reject(oError);
                        // this.handleError(oError, sHttpErrorMessage);
                    }.bind(this)
                );
            });

        },
        _executeConfirmation: async function(oReceiptParameters){
            var oReturn = { isError:       false,
                            returnMessage: "" };
            var sUrl = this.getPublicApiRestDataSourceUri() + "/quantityConfirmation/v1/confirm";
            var oRequestParameters = {
                plant: oReceiptParameters.plant,
                shopOrder: oReceiptParameters.order,
                sfc: oReceiptParameters.sfc,
                operationActivity: oReceiptParameters.operationActivity,
                yieldQuantity: oReceiptParameters.quantity,
                yieldQuantityUnit: oReceiptParameters.unitOfMeasure,
                workCenter: oReceiptParameters.workCenter
            }

            return await new Promise((resolve,reject)=>{
                this.ajaxPostRequest(sUrl, oRequestParameters,
                    function (oResponseData) {
                        debugger;
                        oReturn.returnMessage = this._getText("messageConfirmationSuccess");
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        // debugger;
                        // oReturn.isError = true;
                        // if(oError.message!==undefined){
                        //     oReturn.returnMessage = oError.message;
                        // }else if(oError.error.message!==undefined){
                        //     oReturn.returnMessage = oError.error.message;
                        // }                        
                        // else{
                        //     oReturn.returnMessage = this._getText("messageConfirmationError");
                        // }
                        
                        reject(oError);
                    }.bind(this)
                );
            });
        },
        _executeYieldConfirmation: async function(oReceiptParameters){
            var oReturn = { isError:       false,
                            returnMessage: "" };
            var sUrl = this.getSfcExecutionDataSourceUri() + "sfc/complete";
            var oRequestParameters = {
                operation: oReceiptParameters.operationActivity,
                quantity: oReceiptParameters.quantity,
                resource: oReceiptParameters.workCenter,
                sfcs: [ oReceiptParameters.sfc ]
            };

            return await new Promise((resolve,reject)=>{
                this.ajaxPostRequest(sUrl, oRequestParameters,
                    function (oResponseData) {
                        debugger;
                        oReturn.returnMessage = this._getText("messageConfirmationSuccess");
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        // debugger;
                        // oReturn.isError = true;
                        // if(oError.message!==undefined){
                        //     oReturn.returnMessage = oError.message;
                        // }else if(oError.error.message!==undefined){
                        //     oReturn.returnMessage = oError.error.message;
                        // }                        
                        // else{
                        //     oReturn.returnMessage = this._getText("messageConfirmationError");
                        // }
                        
                        reject(oError);
                    }.bind(this)
                );
            });

        },
        _getText:  function(oTextId){
            return this.getView().getModel("i18n").getResourceBundle().getText(oTextId);
        },
        _splitSfc: async function(oReceiptParameters){
            var oReturn = { isError:       false,
                            newSfc:      "",
                            returnMessage: "" };


            var sUrl = this.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/split";
            var oRequestParameters = {
                plant: oReceiptParameters.plant,
                sfc: oReceiptParameters.sfc,
                newSfcs: [{quantity: oReceiptParameters.quantity}] };

            return await new Promise((resolve,reject)=>{
                this.ajaxPostRequest(sUrl, oRequestParameters,
                    function (oResponseData) {
                        oReturn.newSfc = oResponseData.newSfcs[0];
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        debugger;
                        // oReturn.isError = true;
                        // if(oError.message!==undefined){
                        //     oReturn.returnMessage = oError.message;
                        // }else if(oError.error.message!==undefined){
                        //     oReturn.returnMessage = oError.error.message;
                        // }                        
                        // else{
                        //     oReturn.returnMessage = this._getText("messageConfirmationError");
                        // }
                        
                        reject(oError);
                    }.bind(this)
                );
            });

        },
        _checkRequiredParams: async function(oReceiptParameters){
            var oReturn = { isError:       false,
                            returnMessage: "" };
            var sUrl = this.getPublicApiRestDataSourceUri() + "datacollection/v1/uncollectedParameters";
            var oRequestParameters = {
                plant: oReceiptParameters.plant,
                sfc: oReceiptParameters.sfc,
                operation: oReceiptParameters.operationActivity,
                resource: oReceiptParameters.resource };

            return await new Promise((resolve,reject)=>{
                this.ajaxGetRequest(sUrl, oRequestParameters,
                    function (oResponseData) {
                        if(oResponseData.uncollectedParams.length>0){
                            oReturn.isError = true;
                            oReturn.returnMessage = this._getText("errorCheckRequiredParams");
                        }
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        // debugger;
                        // oReturn.isError = true;
                        // if(oError.message!==undefined){
                        //     oReturn.returnMessage = oError.message;
                        // }else if(oError.error.message!==undefined){
                        //     oReturn.returnMessage = oError.error.message;
                        // }
                        reject(oError);
                    }.bind(this)
                );
            });
        },
        _getSfcDetails: async function(oReceiptParameters){
            var oReturn = { isError: false,
                returnMessage: "",
                sfcDetails: {} };
            var sUrl = this.getPublicApiRestDataSourceUri() + "sfc/v1/sfcdetail";
            var oRequestParameters = {
                plant: oReceiptParameters.plant,
                sfc: oReceiptParameters.sfc };


            return await new Promise((resolve,reject)=>{
                this.ajaxGetRequest(sUrl, oRequestParameters,
                    function (oResponseData) {
                        oReturn.sfcDetails = oResponseData;
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        // debugger;
                        // oReturn.isError = true;
                        // if(oError.message!==undefined){
                        //     oReturn.returnMessage = oError.message;
                        // }else if(oError.error.message!==undefined){
                        //     oReturn.returnMessage = oError.error.message;
                        // }
                        reject(oError);
                    }.bind(this)
                );
            });


        },
        _checkConfirmMm: async function(oReceiptParameters){
            
            return await new Promise((resolve,reject)=>{
                this._resolveConfirmMm = resolve;
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._getText("confirmTitle"),
                        content: new Text({ text: this._getText("confirmQuestion") }),
                        beginButton: new Button({
                            type: mobileLibrary.ButtonType.Emphasized,
                            text: this._getText("answerYes"),
                            press: async function () {
                                    let oReturn = {approve: true};
                                    this.oApproveDialog.close();
                                    this._resolveConfirmMm(oReturn);
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: this._getText("answerNo"),
                            press: function () {
                                let oReturn = {approve: false};
                                this.oApproveDialog.close();
                                this._resolveConfirmMm(oReturn);
                            }.bind(this)
                        })
                    });
                }

               this.oApproveDialog.open();
            });
        },
        _setVisibilityOfPalleteNumber: async function(){
            this.byId("inputPalleteQuan").setValue("1");
        },
        _setFieldVisibility: async function(){
            try{
                let oPodSelectionModel = this.getPodSelectionModel();
                let oWorkCenter = oPodSelectionModel.workCenter;
                let oResourceNumber = oPodSelectionModel.resource.resource;
                debugger;
                let oResource = await ResourceRepository.getResourceInstance(this, this.getPodController().getUserPlant(), oResourceNumber);
                let oFunctionalLocation = oResource.getQ1Scheme();

                if(oFunctionalLocation==="1"){
                    this.byId("inputPackageQuan").setVisible(false);
                    this.byId("inputPackageQuanLabel").setVisible(false);

                    this.byId("inputPalleteQuanLabel").setVisible(true);
                    this.byId("inputPalleteQuan").setVisible(true);
                    this.byId("inputReceiptQuantityLabel").setText(this._oTextHandler.getText("labels.q1.inputQuantityLabelRolls"));

                }else if(oFunctionalLocation==="2"){
                    this.byId("inputPackageQuan").setVisible(true);
                    this.byId("inputPackageQuanLabel").setVisible(true);

                    this.byId("inputPalleteQuanLabel").setVisible(true);
                    this.byId("inputPalleteQuan").setVisible(true);
                    //wszystko
                    this.byId("inputReceiptQuantityLabel").setText(this._oTextHandler.getText("labels.q1.inputQuantityLabelRolls"));
                }else{
                    let oModelData = this.getView().getModel().getData();
                    this.byId("inputPackageQuan").setVisible(false);
                    this.byId("inputPackageQuanLabel").setVisible(false);

                    this.byId("inputPalleteQuanLabel").setVisible(false);
                    this.byId("inputPalleteQuan").setVisible(false);

                    if(oModelData.isCustomQuan){
                        this.byId("inputReceiptQuantityLabel").setText(this._oTextHandler.getText("labels.q1.inputQuantityLabelPallet"));
                    }else{
                        this.byId("inputReceiptQuantityLabel").setText(this._oTextHandler.getText("labels.q1.inputQuantityLabel"));
                    }
                }

            }catch(oError){
                debugger;
            }
        }
    });
    return oPluginViewController;
});


