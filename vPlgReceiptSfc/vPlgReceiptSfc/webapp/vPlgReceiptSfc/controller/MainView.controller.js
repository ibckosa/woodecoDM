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
    "ibc/dm/plugins/wcPodToolsProvider/IssuesManager"
], function (JSONModel, PluginViewController, Log, AjaxUtil, Dialog, Button, Text, mobileLibrary, ErrorHandler, SfcRepository, IssuesManager) {
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
            return;
        },

        onOperationChangeEvent: function (sChannelId, sEventId, oData) {
            this.loadModel();
            return;
        },

        onWorkListSelectEvent: function (sChannelId, sEventId, oData) {
            this.loadModel();
            return;
        },

        loadModel: async function () {
            var oView = this.getView();
            var oConfiguration = this.getConfiguration();
            var bNotificationsEnabled = true;
            this.getView().setBusyIndicatorDelay(0);
            this.getView().setBusy(true);

            if (oConfiguration && typeof oConfiguration.notificationsEnabled !== "undefined") {
                bNotificationsEnabled = oConfiguration.notificationsEnabled;
            }

            var oPodSelectionModel = this.getPodSelectionModel();
            if (!oPodSelectionModel) {
                oView.setModel(new JSONModel());
                return;
            }
            var sPodType = oPodSelectionModel.getPodType();
            var aSelections = oPodSelectionModel.getSelections();
            
            if (aSelections && aSelections.length > 0) {
                var oFirstSelection = aSelections[0];
                var oCustomQuan = this._getCustomQuan( oFirstSelection );
                await this._setInputQuantity(oFirstSelection,oCustomQuan)
            }
            let oComponents = oPodSelectionModel.getComponents();
            let oComponent = oPodSelectionModel.getComponent();
            let oOrder = oPodSelectionModel.getShopOrder();
            debugger;


            var oModelData = {
                podType: sPodType
            };

            // this.addMaterialCustomFields(oPodController.getUserPlant(), sMaterial);
            //oLogger.info("oModel: " + JSON.stringify(oModelData));
            var oModel = new JSONModel(oModelData);
            this.getView().setBusy(false);
            //oView.setModel(oModel);
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
                var oReturnReceipt;
                var oPodController = this.getPodController();
                var oPodSelectionModel = this.getPodSelectionModel();
                var aSelections = oPodSelectionModel.getSelections();     

                if(aSelections.length < 1){ return; };
                var oOperation = oPodSelectionModel.getOperation();
                debugger;
                

                var aSelectionFirstRow = aSelections[0];
                var oShopOrderNumber = aSelectionFirstRow.getShopOrder().getShopOrder();
                var isOrderEwm = await this._checkOrderIsEwm(oPodController.getUserPlant(), oShopOrderNumber);
                // if(isOrderEwm.isError === true){
                //     this.showErrorMessage(isOrderEwm.oErrorMessage,true, true);
                //     return;
                // }

                
                var oReceiptParameters = { plant : oPodController.getUserPlant(),
                                        order: aSelectionFirstRow.getShopOrder().getShopOrder(),
                                        material: aSelectionFirstRow.getSfcData().getMaterial() ,
                                        materialVersion: aSelectionFirstRow.getSfcData().getMaterialVersion(),
                                        quantity: parseInt(this.byId("inputReceiptQuantity").getValue()),
                                        unitOfMeasure: isOrderEwm.unitOfMeasure,		
                                        sfc: aSelectionFirstRow.getSfc().getSfc(),
                                        storageLocation: isOrderEwm.storageLocation,
                                        resource: aSelectionFirstRow.getSfcData().getResource(),
                                        sfcQuantity: aSelectionFirstRow.getSfcData().getQuantity(),
                                        operationActivity: aSelectionFirstRow.getSfcData().getOperation(),
                                        workCenter: aSelectionFirstRow.getSfcData().getWorkCenter() };

                var oSfcReturn = await this._getSfcDetails(oReceiptParameters);
                let oSfcLastStep = oSfcReturn.sfcDetails.steps[oSfcReturn.sfcDetails.steps.length - 1];
                if(oSfcReturn.isError===true){
                    this.showErrorMessage(oSfcReturn.returnMessage,true, true);
                    return;
                }else{
                        let oSfcStep = oSfcReturn.sfcDetails.steps.find(step=>{ return step.operation.operation === oReceiptParameters.operationActivity; });
                        if(!oSfcStep||parseInt(oSfcStep.quantityInWork)<parseInt(oReceiptParameters.quantity)){
                            this._oErrorHandler.throwError("errorSfcNotInWork");
                            // this.showErrorMessage(this._getText("errorSfcNotInWork"),false, true);
                            // return;
                        }
                }
                
                let oIssuesManager = new IssuesManager(this, oReceiptParameters.plant, oReceiptParameters.workCenter, oReceiptParameters.resource, 
                    oReceiptParameters.order, oReceiptParameters.sfc, oReceiptParameters.operationActivity, oReceiptParameters.quantity);
                await oIssuesManager.prepareIssues();
                if (isOrderEwm.isEwmOrder === true){
                    if(parseInt(oReceiptParameters.quantity) !== parseInt(oReceiptParameters.sfcQuantity) ){
                        var oSplitReturn = await this._splitSfc(oReceiptParameters);    
                        if(oSplitReturn.isError === true){
                            this.showErrorMessage(oSplitReturn.returnMessage,true, true);
                            return;
                        };
                        oReceiptParameters.sfc = oSplitReturn.newSfc;
                        oIssuesManager.changeSfcNumber(oReceiptParameters.sfc);
                    }           
                }else{
                    var oReturnCheckRequiredParams = await this._checkRequiredParams(oReceiptParameters);
                    if(oReturnCheckRequiredParams.isError === true){
                        this.showErrorMessage(oReturnCheckRequiredParams.returnMessage,false, true);
                        return;
                    }

                    var oReturnCheckConfirmMm = await this._checkConfirmMm(oReceiptParameters);
                    if(oReturnCheckConfirmMm.approve === false){
                        return;
                    };
                }




                //var oReturnConfirmation = await this._executeConfirmation(oReceiptParameters);

                var oReturnConfirmation = await this._executeYieldConfirmation(oReceiptParameters);
                if(oReturnConfirmation.isError === true){
                    this.showErrorMessage(oReturnConfirmation.returnMessage,true, true);
                    return;
                }else{
                    this.showSuccessMessage(oReturnConfirmation.returnMessage,true, true);
                }

                if(oSfcLastStep.stepId === oSfcStep.stepId){
                    if(isOrderEwm.isEwmOrder === true){
                        oReturnReceipt = await this._executeEwmReceipt(oReceiptParameters);
                    }else{
                        oReturnReceipt = await this._executeMmReceipt(oReceiptParameters);
                    }
                    
                    if(oReturnReceipt.isError === true){
                        this.showErrorMessage(oReturnReceipt.returnMessage,true, true);
                        return;
                    }else{
                        this.showSuccessMessage(oReturnReceipt.returnMessage,true, true);
                    } 
                }

                await oIssuesManager.executeIssues();
                if(parseInt(oReceiptParameters.quantity) === parseInt(oReceiptParameters.sfcQuantity)){
                    oPodSelectionModel.setInputValue("");
                    oPodSelectionModel.clearSelections();

                    this.publish("PodSelectionChangeEvent", { sendToAllPages: true });
                    this.onClosePress();
                    this.navigateToMainPage();
                }else{    
                    this.publish("_onQuantityChangeIncomingEvent", { sendToAllPages: true });    
                    this.publish("PodSelectionChangeEvent", { sendToAllPages: true });
                }

            }catch(oError){this._oErrorHandler.handleError(oError);}
            
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
        }

    });

    return oPluginViewController;
});


