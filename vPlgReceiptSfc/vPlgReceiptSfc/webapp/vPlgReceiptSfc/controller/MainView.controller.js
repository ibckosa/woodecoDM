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
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
], function (JSONModel, PluginViewController, Log, AjaxUtil, Dialog, Button, Text, mobileLibrary, ErrorHandler, SfcRepository, IssuesManager, SfcReceipt, ResourceRepository, TextHandler, OrderRepository) {
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
            //this.subscribe("OperationListSelectEvent", this.onOperationChangeEvent, this);
            this.subscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
            //var oConfig = this.getConfiguration();
            // check if close icon should be displayed
           // this.configureNavigationButtons(oConfig); 
            //this.getView().setBusy(true);
            //debugger;
        },

        onExit: function () {
            if (PluginViewController.prototype.onExit) {
                PluginViewController.prototype.onExit.apply(this, arguments);
            }
            // unsubscribe from POD events on exit
            this.unsubscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            //this.unsubscribe("OperationListSelectEvent", this.onOperationChangeEvent, this);
            this.unsubscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
        },

        onBeforeRendering: async function () {   
            await this.loadModel();
            debugger;
        },

        onAfterRendering: function () {
            debugger;
        },

        onPodSelectionChangeEvent: async function (sChannelId, sEventId, oData) {
            await this.loadModel();
            debugger;
        },

        onOperationChangeEvent: function (sChannelId, sEventId, oData) {
            //this.loadModel();
        },

        onWorkListSelectEvent: async function (sChannelId, sEventId, oData) {
            //await this.loadModel();
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
                    //await this._setVisibilityOfPalleteNumber();
                    let oCustomQuan = await this._getCustomQuan( oFirstSelection );
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
                    numberOfRolls: parseInt(this.byId("inputPalleteQuan").getValue()),
                    printingCopies: parseInt(this.byId("rbg1").getSelectedButton().getText()),
                    numberOfPalletes: parseInt(this.byId("inputPackageQuan").getValue()),
                    printer: oResource.getPrinterId(),
                    automaticIssues: oResource.getConsumptionMode(true)==="AUTOMATIC",
                    routing: aSelectionFirstRow.getSfcData().getRouting(),
                    routingVersion: aSelectionFirstRow.getSfcData().getRoutingVersion() };
                
                ///uruchamianie nowego kodu
                    let oSfcReceipt = new SfcReceipt(this, oReceiptParameters);
                    await oSfcReceipt.executeIssue();
                    //this._reloadQ1Plugin = true;
                    this.getView().setBusy(false);
                    
                    //await this.loadModel();

            }catch(oError){
                this.getView().setBusy(false);
                this._oErrorHandler.handleError(oError);
            }
            
        },
        _getCustomQuan: async function(oSelection){
            var oCustomquan = { isSetted: false,
                                value: 0 };
            

            let oOrderInstance = await OrderRepository.readOrder(this, this.getPodController().getUserPlant(), oSelection.getShopOrder().getShopOrder());
            let oPackingCode = oOrderInstance.getPackingCode();

            if(oPackingCode){
                let oPartOfPackingCode = oPackingCode.substring(6,10);
                if(!isNaN(oPartOfPackingCode)){
                    oCustomquan.isSetted = true;
                    oCustomquan.value = Number(oPartOfPackingCode); 
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
            let oOrderInstance = await OrderRepository.readOrder(this, oParameters.plant, oParameters.order);
            var oOrderDetails = oOrderInstance.getDetails();

            await this.ajaxGetRequest(sUrl, oParameters,
                function (oResponseData) {
                    debugger;
                    var modelData = { receiptQuan: 0,
                                      isCustomQuan: oCustomQuan.isSetted,
                                      uom: "" };
                    
                    var oSfcQuanDelivered = 0;

                    modelData.uom = oOrderDetails.productionUnitOfMeasureObject.uom;
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
                    that._oErrorHandler.throwError(oError);
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
        _setVisibilityOfPalleteNumber: async function(){
            this.byId("inputPalleteQuan").setValue("1");
        },
        _setFieldVisibility: async function(){
            try{
                let oPodSelectionModel = this.getPodSelectionModel();
                let oResourceNumber = oPodSelectionModel.resource.resource;


                debugger;
                let oResource = await ResourceRepository.getResourceInstance(this, this.getPodController().getUserPlant(), oResourceNumber);
                let oFunctionalLocation = oResource.getQ1Scheme();
                if(!this._resourceNumber||this._resourceNumber!==oResourceNumber){
                    this._setPrintQuantity(oResource.getQ1LabelCopies());
                    this._resourceNumber === oResourceNumber;
                }

                this.byId("inputReceiptQuantity").setEditable(true);
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
                    this.byId("inputReceiptQuantityLabel").setText(this._oTextHandler.getText("labels.q1.inputQuantityLabelRolls"));
                    this.byId("inputPackageQuanLabel").setText(this._oTextHandler.getText("labels.q1.inputPackageQuan"));
                }else if(oFunctionalLocation==="3"){
                    this.byId("inputPackageQuan").setVisible(true);
                    this.byId("inputPackageQuanLabel").setVisible(true);
                    this.byId("inputPackageQuanLabel").setText(this._oTextHandler.getText("labels.q1.inputQuantityOfPallet"));

                    this.byId("inputPalleteQuanLabel").setVisible(false);
                    this.byId("inputPalleteQuan").setVisible(false);
                }else if(oFunctionalLocation==="4"){

                    let oModelData = this.getView().getModel().getData();
                    this.byId("inputPackageQuan").setVisible(false);
                    this.byId("inputPackageQuanLabel").setVisible(false);

                    this.byId("inputPalleteQuanLabel").setVisible(false);
                    this.byId("inputPalleteQuan").setVisible(false);
                    this.byId("inputReceiptQuantity").setEditable(false);
                    if(oModelData.isCustomQuan){
                        this.byId("inputReceiptQuantityLabel").setText(this._oTextHandler.getText("labels.q1.inputQuantityLabelPallet"));
                    }else{
                        this.byId("inputReceiptQuantityLabel").setText(this._oTextHandler.getText("labels.q1.inputQuantityLabel"));
                    }
                }
                else{
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
        },
        _setPrintQuantity: function(printQuantity){
            this.byId("rbg1").setSelectedIndex(printQuantity);
        }
    });
    return oPluginViewController;
});


