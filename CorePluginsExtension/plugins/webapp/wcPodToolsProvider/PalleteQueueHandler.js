sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/Pallete",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/PalleteQueue",
    "ibc/dm/plugins/wcPodToolsProvider/ReturnNpwDialog",
    "ibc/dm/plugins/wcPodToolsProvider/AdditionalIssueDialog",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcReceiptPrint",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/library",
    "sap/m/TextArea",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/CheckBox",
    "sap/m/HBox",
    "sap/m/DateTimePicker",
    "sap/m/VBox",
    "sap/ui/core/date/UI5Date",
    "sap/m/Panel",
    "sap/m/OverflowToolbar",
    "sap/f/DynamicPage",
    "sap/m/Label"
], function (ObjectUI5,TextHandler, Palette, ResourceRepository, ErrorHandler, PalleteQueue, ReturnNpwDialog, AdditionalIssueDialog, MaterialRepository, SfcReceiptPrint, JSONModel, Dialog, Button, Text, mobileLibrary, TextArea, Table, Column, ColumnListItem, CheckBox, HBox, DateTimePicker, VBox, UI5Date, Panel, Toolbar, DynamicPage, Label){
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.PalleteQueueHandler", {
        constructor: function(){
            //ManagedObject.prototype.constructor.apply(this, arguments);
            this._textHandler = new TextHandler();
        },

        setHandlerData: function(oHandlerData){
            this._oHandlerData = oHandlerData;
        },

        displayPaletteQueue: async function(oPluginViewController, oMode){
            try {
                this._oMode = oMode;
                this._oPluginViewController = oPluginViewController;
                this._oErrorHandler = new ErrorHandler(this._oPluginViewController);
                await this._displayDialogLog();
            } catch (oError) {

            }
        },
        _displayDialogLog: async function () {
            
            
            return await new Promise( async (resolve, reject) => {
                debugger;
                this._resolveLogDialog = resolve;
                this._rejectLogDialog = reject;
                
                if (!this._oDialogLog) {
                    let oVBox = new VBox({ alignItems: "Center", height: "45rem", width: "100rem" });
                    let oTableLog = this._getTableLog();
                    let oActionButtons = this._getActionButtons();
                    oVBox.addItem(oTableLog);
                    oVBox.addItem(oActionButtons);
                    this._oDialogLog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        verticalScrolling: false,
                        content: [oVBox],
                        buttons: [
                            new Button({
                                text: this._textHandler.getText("labels.loghu.button.close"),
                                press: function () {
                                    this._oDialogLog.close();
                                    this._resolveLogDialog();
                                }.bind(this)
                            })
                        ]
                    });
                }
                let oLogModel = await this._getDialogData();
                let oTitle = this._getDialogTitle();
                this._oDialogLog.setTitle(oTitle);
                this._oDialogLog.open();


            });
        },
        _getColumns: function(){
            let oReturn = [];
            if(this._oMode === "RESOURCE"){
                oReturn.push(new Column({ header: new Text({ text: "" }) }));
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.material") }) }));
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.materialDesc") }) }));
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.handlingUnit") }) }));
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.quantity") }) }));

            }else{
                oReturn.push(new Column({ header: new Text({ text: "" }) }));
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.handlingUnit") }) }));
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.quantity") }) }));
                //oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("Materiał") }) }));
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.reservation") }) }));
            }
            return oReturn;
        },
        _getCells: function(){
            let oReturn = [];
            if(this._oMode === "RESOURCE"){
                oReturn.push( new CheckBox({ selected: "{lineSelected}" }) );
                oReturn.push( new Text({ text: "{materialId}" }) );
                oReturn.push( new Text({ text: "{materialDesc}" }) )
                oReturn.push( new Text({ text: "{handlingUnit}" }) )
                oReturn.push( new Text({ text: "{quantity}" }) )
            }else{
                oReturn.push( new CheckBox({ selected: "{lineSelected}" }) );
                oReturn.push( new Text({ text: "{handlingUnit}" }) );
                oReturn.push( new Text({ text: "{quantity}" }) )
                //oReturn.push( new Text({ text: "{materialId}" }) )
                oReturn.push( new Text({ text: "{reservation}" }) )
            }
            return oReturn;
        },

        _getTableLog: function () {
            let oPanel = new Panel({ height: "38rem", width: "100rem" });
            let oColumns = this._getColumns();


            let oTable = new Table({
                growing: false,
                sticky: ["ColumnHeaders", "HeaderToolbar"],
                width: "112rem",
                inset: false,
                columns: oColumns,
                items: {
                    path: "/items",
                    factory: (sId, oContext) => {

                        let isRowToHighlight = oContext.getProperty("consumptionStarted");;
                        return new ColumnListItem({
                            cells: this._getCells()
                        }).addStyleClass(isRowToHighlight ? "redBoldedRow" : "");
                    }
                    // template: new ColumnListItem({
                    //     cells: oCells
                    // })
                }
            });

            let oDynamicPage = new DynamicPage({ height: "40rem", width: "112rem", content: [oTable], fitContent: true });
            // oPanel.addStyleClass("sapUiTinyMargin");
            oDynamicPage.addStyleClass("sapUiNoContentPadding");
            //oTable.addStyleClass("sapUiTinyMargin");
            oPanel.addContent(oDynamicPage);

            return oPanel;
        },
        _getActionButtons: function () {
            debugger;
            let oButtonsVisible = { reservation: true,
                                    endReservation: true,
                                    return: true,
                                    returnNpw: true,
                                    additionIssue: true  };
            if(this._oMode === "RESOURCE"){
                oButtonsVisible.reservation = false;
                oButtonsVisible.endReservation = false;
                oButtonsVisible.additionIssue = false;
            }


            let oHBoxBtn = new HBox({});
            let oButtonReservation = new Button({
                text: this._textHandler.getText("labels.loghu.button.reservation"),
                width: "15rem",
                press: this.onButtonReservation.bind(this),
                visible: oButtonsVisible.reservation
            });

            let oButtonEndReservation = new Button({
                text: this._textHandler.getText("labels.loghu.button.endReservation"),
                width: "15rem",
                press: this.onButtonEndReservation.bind(this),
                visible: oButtonsVisible.endReservation
            });

            let oButtonReturn = new Button({
                text: this._textHandler.getText("labels.loghu.button.return"),
                width: "15rem",
                press: this.onButtonReturn.bind(this),
                visible: oButtonsVisible.return
            });

            let oButtonReturnNpw = new Button({
                text: this._textHandler.getText("labels.loghu.button.returnNpw"),
                width: "15rem",
                press: this.onButtonReturnNpw.bind(this),
                visible: oButtonsVisible.returnNpw
            });

            let oButtonAdditionIssue = new Button({
                text: this._textHandler.getText("labels.loghu.button.additionalIssue"),
                width: "15rem",
                press: this.onButtonAdditionIssue.bind(this),
                visible: oButtonsVisible.additionIssue
            });

            let oButtonAdditionMHuIssue = new Button({
                text: this._textHandler.getText("labels.loghu.button.additionalMHuIssue"),
                width: "15rem",
                press: this.onButtonAdditionMHuIssue.bind(this),
                visible: oButtonsVisible.additionIssue
            });
            oButtonReservation.addStyleClass("bigButtonLHU sapUiMediumMarginEnd");
            oButtonEndReservation.addStyleClass("bigButtonLHU sapUiMediumMarginEnd");
            oButtonReturn.addStyleClass("bigButtonLHU sapUiMediumMarginEnd");
            oButtonReturnNpw.addStyleClass("bigButtonLHU sapUiMediumMarginEnd");
            oButtonAdditionIssue.addStyleClass("bigButtonLHU sapUiMediumMarginEnd");
            oButtonAdditionMHuIssue.addStyleClass("bigButtonLHU sapUiMediumMarginEnd");
            oHBoxBtn.addItem(oButtonReservation);
            oHBoxBtn.addItem(oButtonEndReservation);
            oHBoxBtn.addItem(oButtonReturn);
            oHBoxBtn.addItem(oButtonReturnNpw);
            oHBoxBtn.addItem(oButtonAdditionIssue);
            oHBoxBtn.addItem(oButtonAdditionMHuIssue);
            return oHBoxBtn;
        },
        _getDialogData: async function () {

            let oPalleteQueue = new PalleteQueue(this._oPluginViewController,this._oHandlerData.plant, this._oHandlerData.resource, this._oHandlerData.workCenter);
            if(this._oMode === "COMPONENT"){
                oPalleteQueue.setReadForOrderPosition(this._oHandlerData.order, this._oHandlerData.sequence,this._oHandlerData.material, this._oHandlerData.storageLocation);
            }

            let oLogData = { items: [] };

            oLogData.items = await oPalleteQueue.readPalletesQueue();

            let oLogModel = new JSONModel();
            oLogModel.setData(oLogData);
            this._oDialogLog.setModel(oLogModel);
        },

        onButtonReservation: async function(){
            try{
                let oSelectedItems = this._getSelectedItems();
                try{
                    for(const item of oSelectedItems){
                        let oPallete  = new Palette(this._oPluginViewController);
                        await oPallete.palleteReservation(item.palleteDetails, item.plant, item.orderNumber, item.sequence );
                        this._oPluginViewController.showSuccessMessage( this._textHandler.getText("success.logHu.paletteReservation", item.handlingUnit),true,true);
                    }
                }catch(oError){this._oErrorHandler.handleError(oError);}
                await this._getDialogData();
            }catch(oError){
                this._oErrorHandler.handleError(oError);
            }

        },
        onButtonEndReservation: async function(){
            try{
                let oSelectedItems = this._getSelectedItems();
                try{
                    for(const item of oSelectedItems){
                        let oPallete  = new Palette(this._oPluginViewController);
                        await oPallete.palleteEndReservation(item.palleteDetails, item.plant);
                        this._oPluginViewController.showSuccessMessage( this._textHandler.getText("success.logHu.paletteEndReservation", item.handlingUnit),true,true);
                    }
                }catch(oError){this._oErrorHandler.handleError(oError);}
                await this._getDialogData();
            }catch(oError){
                this._oErrorHandler.handleError(oError);
            }
        },
        onButtonReturn: async function(){
            try{
                this._oDialogLog.setBusy(true);
                let oDummyOrderSfc = this._getDummyOrderSfc();
                let oResource = await ResourceRepository.getResourceInstance(this._oPluginViewController,this._oHandlerData.plant, this._oHandlerData.resource);
                let oSelectedItems = this._getSelectedItems();
                let oZweiEndpoint = this._getZweiEndpoint();
                let oPrintingEndpoint = this._getPrintingEndpoint();
                let oPrinter = await this._getPrinter();
                try{
                    for(const item of oSelectedItems){
                        let oPallete  = new Palette(this._oPluginViewController);
                        item.erpResourceId = oResource.getResourceErpId();
                        await oPallete.palleteReturn(item, oZweiEndpoint);
                        await oPallete.reducePalleteQuan(item, item.quantity, oDummyOrderSfc.dummyOrder, oDummyOrderSfc.dummySfc);
                        await this._executeLabelPrint(item, oPrintingEndpoint, oPrinter);
                        this._oPluginViewController.showSuccessMessage( this._textHandler.getText("success.logHu.palleteReturn", item.handlingUnit),true,true);
                    }
                }catch(oError){this._oErrorHandler.handleError(oError);}
                setTimeout( async ()=> {    await this._getDialogData();
                                            this._oDialogLog.setBusy(false);},1500);
            }catch(oError){
                this._oDialogLog.setBusy(false);
                this._oErrorHandler.handleError(oError);
            }
        },

        onButtonReturnNpw: async function(){
            try{
                this._oDialogLog.setBusy(true)
                let oDummyOrderSfc = this._getDummyOrderSfc();
                let oZweiEndpoint = this._getZweiEndpoint();
                let oItem = this._getSelectedItem();
                let oMaterial = await MaterialRepository.getMaterialInstance(this._oPluginViewController, oItem.plant, oItem.materialId);
                oItem.scrapingMaterial = oMaterial.getScrapingMaterial();

                let oResource = await ResourceRepository.getResourceInstance(this._oPluginViewController,this._oHandlerData.plant, this._oHandlerData.resource);
                let oPrinter = await this._getPrinter();
                let oPallete  = new Palette(this._oPluginViewController);
                let oDialogReturn = await ReturnNpwDialog.showDialog(oItem, this._oPluginViewController);
                let oPrintingEndpoint = this._getPrintingEndpoint();
                if(oDialogReturn.quantity>0){ 
                    oItem.erpResourceId = oResource.getResourceErpId();
                    await oPallete.palleteReturnNpw(oItem, oZweiEndpoint, oDialogReturn.quantity);
                    this._oPluginViewController.showSuccessMessage( this._textHandler.getText("success.logHu.palleteReturnNpw"),true,true);
                    await oPallete.reducePalleteQuan(oItem, oDialogReturn.quantity, oDummyOrderSfc.dummyOrder, oDummyOrderSfc.dummySfc );
                    await this._executeLabelPrint(oItem, oPrintingEndpoint, oPrinter);
                    setTimeout( async ()=> {                    await this._getDialogData();
                        this._oDialogLog.setBusy(false);},1500);
                }else{
                    this._oDialogLog.setBusy(false);
                }
            }catch(oError){
                this._oDialogLog.setBusy(false);
                this._oErrorHandler.handleError(oError);
            }
        },

        onButtonAdditionIssue: async function(){
            try{
                let oPallete  = new Palette(this._oPluginViewController);
                let oItem = this._getSelectedItem();
                let oQuanAdditional = await AdditionalIssueDialog.showDialog(oItem);
                if(oQuanAdditional>0){
                    this._oDialogLog.setBusy(true)
                    await oPallete.additionalIssue(oItem, oQuanAdditional, this._oHandlerData.sfc, this._oHandlerData.bomComponentRef, this._oHandlerData.operationActivity, this._oHandlerData.sequence);
                    this._oPluginViewController.showSuccessMessage( this._textHandler.getText("success.logHu.palleteAdditionalIssue"),true,true);
                    setTimeout( async ()=> {  await this._getDialogData();
                                            this._oDialogLog.setBusy(false);},1500);
                }
            }catch(oError){
                this._oDialogLog.setBusy(false);
                this._oErrorHandler.handleError(oError);
            }
        },

        onButtonAdditionMHuIssue: async function(){
            try{
                this._oDialogLog.setBusy(true);
                this._checkSelectedReservedItem();
                let oSelectedItems = this._getSelectedItems();
                for(const item of oSelectedItems){
                    try{
                        let oPallete  = new Palette(this._oPluginViewController);
                        await oPallete.additionalIssue(item, item.quantity, this._oHandlerData.sfc, this._oHandlerData.bomComponentRef, this._oHandlerData.operationActivity);
                        this._oPluginViewController.showSuccessMessage( this._textHandler.getText("success.logHu.palleteAdditionalIssue"),true,true);

                    }catch(oError){
                        this._oErrorHandler.handleError(oError);
                    }
                }
                setTimeout( async ()=> {    await this._getDialogData();
                                            this._oDialogLog.setBusy(false);},1500);
            }catch(oError){
                this._oDialogLog.setBusy(false);
                this._oErrorHandler.handleError(oError);
            }


            // try{
            //     let oPallete  = new Palette(this._oPluginViewController);
            //     let oItem = this._getSelectedItem();
            //     let oQuanAdditional = await AdditionalIssueDialog.showDialog(oItem);
            //     if(oQuanAdditional>0){
            //         //await this._additionalIssue();
            //         this._oDialogLog.setBusy(true)
            //         await oPallete.additionalIssue(oItem, oQuanAdditional, this._oHandlerData.sfc, this._oHandlerData.bomComponentRef, this._oHandlerData.operationActivity);
            //         this._oPluginViewController.showSuccessMessage( this._textHandler.getText("success.logHu.palleteAdditionalIssue"),true,true);
            //         setTimeout( async ()=> {  await this._getDialogData();
            //                                 this._oDialogLog.setBusy(false);},1500);
            //     }
            // }catch(oError){
            //     this._oDialogLog.setBusy(false);
            //     this._oErrorHandler.handleError(oError);
            // }
        },

        _getSelectedItems: function(){
            let oItems = this._oDialogLog.getModel().getData().items;

            let oSelectedItems = oItems.filter( oItem => {
                return oItem.lineSelected === true;
            });
            return oSelectedItems;
        },

        _getSelectedItem: function(){
            let oSelectedItems = this._getSelectedItems();
            if(oSelectedItems.length === 1){
                return oSelectedItems[0];
            }else{
                this._oErrorHandler.throwError("error.logHu.notOneLineSelected");
            }
        },

        _checkSelectedReservedItem: function(){
            let oItems = this._oDialogLog.getModel().getData().items;

            let reservedItem = oItems.find(item => { return item.lineSelected === true && item.reservation !== "" });

            if(reservedItem){
                this._oErrorHandler.throwErrorPopup("error.logHU.issuePalleteReserver");
            }
        },

        _getZweiEndpoint: function(){
            let oZweiEndpoint = this._oPluginViewController.getConfigurationValue("zweiURL");
            if(!oZweiEndpoint||oZweiEndpoint===""){
                this._oErrorHandler.throwError("error.logHu.notConfiguredEndpoint");
            }

            return oZweiEndpoint;
        },
        _getPrintingEndpoint: function(){
            let oPrintingEndpoint = this._oPluginViewController.getConfigurationValue("printerEndPoint");
            if(!oPrintingEndpoint||oPrintingEndpoint===""){
                this._oErrorHandler.throwError("error.printing.noEndpoint");
            }

            return oPrintingEndpoint;
        },
        _getDialogTitle: function(){
            let oReturn = "";

            if(this._oMode==="COMPONENT"){
                oReturn = `${this._oHandlerData.material} ${this._oHandlerData.materialDescription}`;
            }else{
                oReturn = this._textHandler.getText("labels.logHu.dialogTitleResource", this._oHandlerData.workCenter, this._oHandlerData.resource);
            }
            return oReturn;
        },
        _getDummyOrderSfc: function(){
            let oConfiguration = this._oPluginViewController.getConfiguration();
            if(!oConfiguration){this._oErrorHandler.throwError("error.readConfiguration")};

            if(!oConfiguration.dummyOrder||oConfiguration.dummyOrder===""){this._oErrorHandler.throwError("error.logHU.noDummyOrder")}
            if(!oConfiguration.dummySfc||oConfiguration.dummySfc===""){this._oErrorHandler.throwError("error.logHU.noDummySfc")}

            return { dummyOrder: oConfiguration.dummyOrder,
                     dummySfc:   oConfiguration.dummySfc };
        },
        _logNonconformance: async function(oQuantity, oLine, oCode, sfc){
            let sUrl = this._oPluginViewController.getPublicApiRestDataSourceUri() + "nonconformance/v1/log";

            debugger;
            let oRequestParameters = {
                code: oCode,
                plant: oLine.plant,
                workCenter: oLine.workCenter,
                resource: oLine.resource,
                sfcs: [sfc],
                quantity: oQuantity };

                return await new Promise((resolve,reject)=>{
                    this._oPluginViewController.ajaxPostRequest(sUrl, oRequestParameters,
                        oResponseData => {
                            if(oResponseData.ids !== undefined){
                                resolve(oResponseData.ids[0].ids[0]);
                            }else{
                                resolve ();
                            }
                        },
                       (oError, sHttpErrorMessage) => {
                            reject(oError);
                        }
                    );
                });
        },
        _closeNonconformance: async function(oPlant , oNonconformanceId){
            let sUrl = this._oPluginViewController.getPublicApiRestDataSourceUri() + "nonconformance/v1/close";
            
            let oParameters = { plant: oPlant,
                                id: oNonconformanceId };
            return await new Promise((resolve,reject)=>{
                this._oPluginViewController.ajaxPostRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    oError=>{
                        resolve();
                    }   
                );

            });
        },
        _executeLabelPrint: async function(oItem, oEndpoint, oPrinter){
            let oPrintingDetails = {};
            
            if(oItem.scrapingMaterial){
                oPrintingDetails.material = oItem.scrapingMaterial;
            }else{
                oPrintingDetails.material = oItem.materialId;
            }

            let oMaterial = await MaterialRepository.getMaterialInstance(this._oPluginViewController, oItem.plant, oPrintingDetails.material);
            oPrintingDetails.endpoint = oEndpoint;
            oPrintingDetails.plant  = oItem.plant;
            oPrintingDetails.order = undefined;
            oPrintingDetails.workCenter = oItem.workCenter;
            oPrintingDetails.resource = oItem.resource;
            oPrintingDetails.sfc = undefined;
            
            oPrintingDetails.HU = oItem.handlingUnit;
            oPrintingDetails.orderLineCustomValues = [];
            oPrintingDetails.orderCustomValues = [];
            oPrintingDetails.materialCustomValues = oMaterial.getCustomValues();
            oPrintingDetails.quantity = oItem.quantity;
            oPrintingDetails.printer = oPrinter;
            oPrintingDetails.operation = "";
            oPrintingDetails.document = 'DM_INFO';
            oPrintingDetails.printingCopies = 1;
            
            let oSfcReceiptPrint = new SfcReceiptPrint(this._oPluginViewController, oPrintingDetails);
            await oSfcReceiptPrint.print();
        },
        _getPrinter: async function(){
            let oResource = await ResourceRepository.getResourceInstance(this._oPluginViewController,this._oHandlerData.plant, this._oHandlerData.resource);
            let oPrinter = oResource.getPrinterId();

            if(oPrinter==="")
            {
                this._oErrorHandler.throwError("error.printing.noPrinter");
            }
            return oPrinter;
        }

    })

});