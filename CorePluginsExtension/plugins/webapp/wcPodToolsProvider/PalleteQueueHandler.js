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
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/CheckBox",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/Panel",
    "sap/f/DynamicPage",
    "ibc/dm/plugins/wcPodToolsProvider/PartialPalleteReturnDialog"
], function (ObjectUI5,TextHandler, Palette, ResourceRepository, ErrorHandler, PalleteQueue, ReturnNpwDialog, AdditionalIssueDialog, MaterialRepository, SfcReceiptPrint, JSONModel, Dialog, Button, Text,
     mobileLibrary, Table, Column, ColumnListItem, CheckBox, HBox, VBox, Panel, DynamicPage, PartialPalleteReturnDialog){
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.PalleteQueueHandler", {
        constructor: function(){
            //ManagedObject.prototype.constructor.apply(this, arguments);
            this._textHandler = new TextHandler();
        },

        setHandlerData: function(oHandlerData){
            this._issuedQuantity = undefined;
            this._oHandlerData = oHandlerData;
        },

        displayPaletteQueue: async function(oPluginViewController, oMode){
            try {
                this._oMode = oMode;
                this._oPluginViewController = oPluginViewController;
                this._oErrorHandler = new ErrorHandler(this._oPluginViewController);
                this._resourceInstance = await ResourceRepository.getResourceInstance(this._oPluginViewController,this._oHandlerData.plant, this._oHandlerData.resource);
                await this._displayDialogLog();
            } catch (oError) {

            }
        },
        _displayDialogLog: async function () {
            return await new Promise( async (resolve, reject) => {
                this._resolveLogDialog = resolve;
                this._rejectLogDialog = reject;
                
                if (!this._oDialogLog) {
                    let oVBox = new VBox({ alignItems: "Center", height: "45rem", width: "100rem" });
                    let oTableLog = this._getTableLog();
                    let oActionButtons = await this._getActionButtons();
                    let printCountGrounp = this._getPrintCountGroup();
            
                    oVBox.addItem(oTableLog);
                    oVBox.addItem(oActionButtons);
                    oVBox.addItem(printCountGrounp);
                    
                    this._oDialogLog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        verticalScrolling: false,
                        content: [oVBox],
                        buttons: [
                            new Button({
                                text: this._textHandler.getText("labels.loghu.button.close"),
                                press: function () {
                                    this._oDialogLog.close();
                                    this._oDialogLog.destroy();
                                        try{
                                            let model = this._oPluginViewController.byId("componentList").getModel();
                                            let modelData = this._oPluginViewController.byId("componentList").getModel().getData();
                                            let component = modelData.Components.find( line=>{ return line.componentSequence === this._oHandlerData.sequence } );
                                            component.zIssuedQuantity = Math.round( (component.zIssuedQuantity + this._getIssuedQuantity() ) * 1000)/1000;
                                            model.setData(modelData);
                                            this._oPluginViewController.byId("componentList").setModel(model)
                                        }catch(error){
                                            debugger;
                                        }

                                        try{
                                            let model = this._oPluginViewController.getView().getModel("componentsModel");
                                            let modelData = this._oPluginViewController.getView().getModel("componentsModel").getData();
                                            let component = modelData.items.find( line=>{ return line.componentSequence === this._oHandlerData.sequence } );
                                            component.issuedQuantity = Math.round( (component.issuedQuantity + this._getIssuedQuantity() ) * 1000)/1000;
                                            model.setData(modelData);
                                            this._oPluginViewController.getView().setModel(model, "componentsModel")
                                        }catch(error){
                                            debugger;
                                        }
                                    this._resolveLogDialog();
                                }.bind(this)
                            })
                        ]
                    });
                }
                await this._getDialogData();
                let oTitle = this._getDialogTitle();
                this._oDialogLog.setTitle(oTitle);
                this._oDialogLog.open();
            });
        },
        _getColumns: function(){
            let oReturn = [];

            this._columnQuantity = new Column();
            if(this._oMode === "RESOURCE"){
                oReturn.push(new Column({ header: new Text({ text: "" }), width: "3rem" }));
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.material") }) }));
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.materialDesc") }) }));
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.handlingUnit") }) }));
                oReturn.push(this._columnQuantity);
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.reservation") }) }));

            }else{
                oReturn.push(new Column({ header: new Text({ text: "" }) , width: "3rem"  }));
                oReturn.push(new Column({header: new Text({ text: this._textHandler.getText("labels.loghu.column.handlingUnit") }) }));
                oReturn.push(this._columnQuantity);
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
                oReturn.push( new Text({ text: "{reservation}" }) )
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

            this._searchMaterialField = new sap.m.SearchField({placeholder: "Wyszukaj", search: this.onMaterialSearch.bind(this) });

            let oTable = new Table({
                growing: true,
                sticky: ["ColumnHeaders", "HeaderToolbar"],
                width: "100rem",
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
            this._table = oTable;
            let oVBox = new VBox();

            oVBox.addItem(this._searchMaterialField);

            oVBox.addItem(oTable);
            let oDynamicPage = new DynamicPage({ height: "40rem", width: "112rem", content: [oVBox], fitContent: true });
            //let oDynamicPage = new DynamicPage({ height: "40rem", width: "112rem", content: [oTable], fitContent: true });
            // oPanel.addStyleClass("sapUiTinyMargin");
            oDynamicPage.addStyleClass("sapUiNoContentPadding");
            //oTable.addStyleClass("sapUiTinyMargin");
            oPanel.addContent(oDynamicPage);

            return oPanel;
        },
        _getActionButtons: async function () {
            let oButtonsVisible = { reservation: true,
                                    endReservation: true,
                                    return: true,
                                    returnNpw: true,
                                    additionIssue: true,
                                    partialReturn: true };

            let oResource = await ResourceRepository.getResourceInstance(this._oPluginViewController,this._oHandlerData.plant, this._oHandlerData.resource);
            let consumptionButtons = oResource.getConsumptionButtons();
            if(consumptionButtons){
                oButtonsVisible = { reservation: false,
                                    endReservation: false,
                                    return: false,
                                    returnNpw: false,
                                    additionIssue: false,
                                    issue: false,
                                    partialReturn: false  };
                let consumptionButtonsSplitted = consumptionButtons.split(",");

                for(const button of consumptionButtonsSplitted){
                    switch(button){
                        case '1':
                            oButtonsVisible.reservation = true;
                            break;
                        case '2':
                            oButtonsVisible.endReservation = true;
                            break;
                        case '3':
                            oButtonsVisible.return = true;
                            break;
                        case '4':
                            oButtonsVisible.returnNpw = true;
                            break;
                        case '5':
                            oButtonsVisible.additionIssue = true;
                            break;
                        case '6':
                            oButtonsVisible.issue = true;
                            break;
                        case '7':
                            oButtonsVisible.partialReturn = true;
                            break;
                    }
                }
            }

            if(this._oMode === "RESOURCE"){
                oButtonsVisible.reservation = false;
                //oButtonsVisible.endReservation = false;
                oButtonsVisible.additionIssue = false;
                oButtonsVisible.issue = false;
            }

            let oHBoxBtn = new HBox({});
            let oButtonReservation = new Button({
                text: this._textHandler.getText("labels.loghu.button.reservation"),
                width: "12rem",
                press: this.onButtonReservation.bind(this),
                visible: oButtonsVisible.reservation
            });

            let oButtonEndReservation = new Button({
                text: this._textHandler.getText("labels.loghu.button.endReservation"),
                width: "12rem",
                press: this.onButtonEndReservation.bind(this),
                visible: oButtonsVisible.endReservation
            });

            let oButtonReturn = new Button({
                text: this._textHandler.getText("labels.loghu.button.return"),
                width: "12rem",
                press: this.onButtonReturn.bind(this),
                visible: oButtonsVisible.return
            });

            let oButtonReturnNpw = new Button({
                text: this._textHandler.getText("labels.loghu.button.returnNpw"),
                width: "12rem",
                press: this.onButtonReturnNpw.bind(this),
                visible: oButtonsVisible.returnNpw
            });

            let oButtonPartialReturn = new Button({
                text: this._textHandler.getText("labels.loghu.button.partialReturn"),
                width: "12rem",
                press: this.onButtonPartialReturn.bind(this),
                visible: oButtonsVisible.partialReturn
            });

            let oButtonAdditionIssue = new Button({
                text: this._textHandler.getText("labels.loghu.button.additionalIssue"),
                width: "12rem",
                press: this.onButtonAdditionIssue.bind(this),
                visible: oButtonsVisible.additionIssue
            });

            let oButtonAdditionMHuIssue = new Button({
                text: this._textHandler.getText("labels.loghu.button.additionalMHuIssue"),
                width: "15rem",
                press: this.onButtonAdditionMHuIssue.bind(this),
                visible: oButtonsVisible.issue
            });
            oButtonReservation.addStyleClass("bigButtonLHU sapUiSmallMarginEnd sapUiSmallMarginBegin");
            oButtonEndReservation.addStyleClass("bigButtonLHU sapUiSmallMarginEnd");
            oButtonReturn.addStyleClass("bigButtonLHU sapUiSmallMarginEnd");
            oButtonReturnNpw.addStyleClass("bigButtonLHU sapUiSmallMarginEnd");
            oButtonAdditionIssue.addStyleClass("bigButtonLHU sapUiSmallMarginEnd");
            oButtonAdditionMHuIssue.addStyleClass("bigButtonLHU sapUiSmallMarginEnd");
            oButtonPartialReturn.addStyleClass("bigButtonLHU sapUiSmallMarginEnd");
            oHBoxBtn.addItem(oButtonReservation);
            oHBoxBtn.addItem(oButtonEndReservation);
            oHBoxBtn.addItem(oButtonReturn);
            oHBoxBtn.addItem(oButtonPartialReturn);
            oHBoxBtn.addItem(oButtonReturnNpw);
            oHBoxBtn.addItem(oButtonAdditionIssue);
            oHBoxBtn.addItem(oButtonAdditionMHuIssue);
            return oHBoxBtn;
        },
        _getDialogData: async function () {
            let oPalleteQueue = new PalleteQueue(this._oPluginViewController, this._oHandlerData.plant, this._oHandlerData.resource, this._oHandlerData.workCenter);
            if(this._oMode === "COMPONENT"){
                oPalleteQueue.setReadForOrderPosition(this._oHandlerData.order, this._oHandlerData.sequence, this._oHandlerData.material, this._oHandlerData.storageLocation);
                if(this._oHandlerData.salesSegmentRequired){
                    oPalleteQueue.setSalesSegment(this._oHandlerData.salesOrder, this._oHandlerData.salesOrderItem);
                }
                
                oPalleteQueue.setQueueUom(this._oHandlerData.uom);
            }

            let oLogData = { items: [] };

            oLogData.items = await oPalleteQueue.readPalletesQueue();

            let palletesQuantitySum = 0;
            for(const item of oLogData.items){
                palletesQuantitySum = palletesQuantitySum + item.quantity;
            }
            this._columnQuantity.setHeader(new Text({ text: this._textHandler.getText("labels.loghu.column.quantity", palletesQuantitySum) }) );

            let oLogModel = new JSONModel();
            oLogModel.setData(oLogData);
            this._oDialogLog.setModel(oLogModel);
            this.onMaterialSearch();
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
                this._oDialogLog.setBusyIndicatorDelay(0);
                this._oDialogLog.setBusy(true);
                let oDummyOrderSfc = this._getDummyOrderSfc();
                let oResource = await ResourceRepository.getResourceInstance(this._oPluginViewController,this._oHandlerData.plant, this._oHandlerData.resource);
                let oSelectedItems = this._getSelectedItems();
                let oZweiEndpoint = this._getZweiEndpoint();
                let oPrinter = await this._getPrinter();
                try{
                    for(const item of oSelectedItems){
                        let oPallete  = new Palette(this._oPluginViewController);
                        item.erpResourceId = oResource.getResourceErpId();
                        await oPallete.reducePalleteQuan(item, item.quantity, oDummyOrderSfc.dummyOrder, oDummyOrderSfc.dummySfc);
                        await oPallete.palleteReturn(item, oZweiEndpoint);
                        await this._executeLabelPrint(item, oPrinter, item.quantity, SfcReceiptPrint.PRINT_INPUT_RETURN);
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

        onButtonPartialReturn: async function(){
            try{
                this._oDialogLog.setBusyIndicatorDelay(0);
                this._oDialogLog.setBusy(true);
                let oDummyOrderSfc = this._getDummyOrderSfc();
                let oResource = await ResourceRepository.getResourceInstance(this._oPluginViewController,this._oHandlerData.plant, this._oHandlerData.resource);
                let oZweiEndpoint = this._getZweiEndpoint();
                let oPrinter = await this._getPrinter();
                let item = this._getSelectedItem();
                let oDialogReturn = await PartialPalleteReturnDialog.showDialog(item, this._oPluginViewController);

                if(oDialogReturn.quantity > 0){
                    let oPallete  = new Palette(this._oPluginViewController);
                    item.erpResourceId = oResource.getResourceErpId();
                    await oPallete.reducePalleteQuan(item, oDialogReturn.quantity, oDummyOrderSfc.dummyOrder, oDummyOrderSfc.dummySfc);
                    await oPallete.palleteReturn(item, oZweiEndpoint, oDialogReturn.quantity);
                    await this._executeLabelPrint(item, oPrinter, oDialogReturn.quantity, SfcReceiptPrint.PRINT_INPUT_RETURN);
                    this._oPluginViewController.showSuccessMessage( this._textHandler.getText("success.logHu.palleteReturn", item.handlingUnit),true,true);
                    setTimeout( async ()=> {    await this._getDialogData();
                                                this._oDialogLog.setBusy(false);},1500);
                }else{
                    this._oDialogLog.setBusy(false);
                }
            }catch(oError){
                this._oDialogLog.setBusy(false);
                this._oErrorHandler.handleError(oError);
            }
        },

        onButtonReturnNpw: async function(){
            try{
                this._oDialogLog.setBusyIndicatorDelay(0);
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
            
                if(oDialogReturn.quantity>0){ 
                    oItem.erpResourceId = oResource.getResourceErpId();
                    await oPallete.reducePalleteQuan(oItem, oDialogReturn.quantity, oDummyOrderSfc.dummyOrder, oDummyOrderSfc.dummySfc );
                    await oPallete.palleteReturnNpw(oItem, oZweiEndpoint, oDialogReturn.quantity);
                    this._oPluginViewController.showSuccessMessage( this._textHandler.getText("success.logHu.palleteReturnNpw"),true,true);
                    await this._executeLabelPrint(oItem, oPrinter, oDialogReturn.quantity, SfcReceiptPrint.PRINT_INPUT_RETURN_NPW);
                    setTimeout( async ()=> {    await this._getDialogData();
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
                this._oDialogLog.setBusyIndicatorDelay(0);
                this._oDialogLog.setBusy(true)
                let oPallete  = new Palette(this._oPluginViewController);
                let oItem = this._getSelectedItem();
                let oQuanAdditional = await AdditionalIssueDialog.showDialog(oItem);
                if(oQuanAdditional>0){
                    await oPallete.additionalIssue(oItem, oQuanAdditional, this._oHandlerData.sfc, this._oHandlerData.bomComponentRef, this._oHandlerData.operationActivity, this._oHandlerData.sequence);
                    this._addIssuedQuantity(oQuanAdditional);
                    this._oPluginViewController.showSuccessMessage( this._textHandler.getText("success.logHu.palleteAdditionalIssue"),true,true);
                    setTimeout( async ()=> {  await this._getDialogData();
                                            this._oDialogLog.setBusy(false);},1500);
                }
                this._oDialogLog.setBusy(false)
            }catch(oError){
                this._oDialogLog.setBusy(false);
                this._oErrorHandler.handleError(oError);
            }
        },

        onButtonAdditionMHuIssue: async function(){
            try{
                this._oDialogLog.setBusyIndicatorDelay(0);
                this._oDialogLog.setBusy(true);
                this._checkSelectedReservedItem();
                let oSelectedItems = this._getSelectedItems();
                for(const item of oSelectedItems){
                    try{
                        let oPallete  = new Palette(this._oPluginViewController);
                        await oPallete.additionalIssue(item, item.quantity, this._oHandlerData.sfc, this._oHandlerData.bomComponentRef, this._oHandlerData.operationActivity, this._oHandlerData.sequence);
                        this._addIssuedQuantity(item.quantity);
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
        _executeLabelPrint: async function(oItem, printer, quantity, printType){
            let oPrintingDetails = {};
            
            if(oItem.scrapingMaterial){
                oPrintingDetails.material = oItem.scrapingMaterial;
                oPrintingDetails.oldMaterial = oItem.materialId;
                let oldMaterial = await MaterialRepository.getMaterialInstance(this._oPluginViewController, oItem.plant, oItem.materialId);
                oPrintingDetails.oldMaterialCustomValues = oldMaterial.getCustomValues();
            }else{
                oPrintingDetails.material = oItem.materialId;
            }

            let oMaterial = await MaterialRepository.getMaterialInstance(this._oPluginViewController, oItem.plant, oPrintingDetails.material);
            oPrintingDetails.plant  = oItem.plant;
            oPrintingDetails.order = "";
            oPrintingDetails.workCenter = oItem.workCenter;
            oPrintingDetails.resource = oItem.resource;
            oPrintingDetails.sfc = "";
            
            oPrintingDetails.HU = oItem.handlingUnit;
            oPrintingDetails.orderLineCustomValues = [];
            oPrintingDetails.orderCustomValues = [];
            oPrintingDetails.materialCustomValues = oMaterial.getCustomValues();
            oPrintingDetails.quantity = quantity;
            oPrintingDetails.printer = printer;
            oPrintingDetails.operation = "";
            oPrintingDetails.document = 'DM_INFO';
            oPrintingDetails.printingCopies = this._getPrintingCopies();
            oPrintingDetails.printType = printType;
            
            let oSfcReceiptPrint = new SfcReceiptPrint(this._oPluginViewController, oPrintingDetails);
            await oSfcReceiptPrint.print();
        },
        _getPrinter: async function(){
            let oResource = await ResourceRepository.getResourceInstance(this._oPluginViewController,this._oHandlerData.plant, this._oHandlerData.resource);
            let oPrinter = oResource.getPrinterComponentsId();

            if(oPrinter==="")
            {
                this._oErrorHandler.throwError("error.printing.noPrinter");
            }
            return oPrinter;
        },
        _addIssuedQuantity: function(oQuan){
            if(!this._issuedQuantity){
                this._issuedQuantity = 0;
            }
            this._issuedQuantity = this._issuedQuantity + parseFloat(oQuan);
        },
        _getIssuedQuantity: function(){
            if(!this._issuedQuantity){
                this._issuedQuantity = 0;
            }

            return this._issuedQuantity;
        },
        onMaterialSearch: function(oEvent){
            try{
                const oBinding = this._table.getBinding("items");

                let sQuery = this._searchMaterialField.getValue();

                if (!sQuery) {
                    oBinding.filter([]);
                    return;
                }

                const searchFilters =   [   new sap.ui.model.Filter("handlingUnit", sap.ui.model.FilterOperator.Contains, sQuery),
                                            new sap.ui.model.Filter("reservation", sap.ui.model.FilterOperator.Contains, sQuery)];
                                            
                if (!isNaN(sQuery)) {
                    searchFilters.push(new sap.ui.model.Filter("quantity", sap.ui.model.FilterOperator.EQ, Number(sQuery)));
                } 
                if(this._oMode ==="RESOURCE"){
                    searchFilters.push(new sap.ui.model.Filter("materialId", sap.ui.model.FilterOperator.Contains, sQuery));
                    searchFilters.push(new sap.ui.model.Filter("materialDesc", sap.ui.model.FilterOperator.Contains, sQuery));
                }             
                const aFilters = [];
                aFilters.push(new sap.ui.model.Filter({ filters: searchFilters, and: false }));
                oBinding.filter(aFilters);

                const lengthAfterFiltering = oBinding.getLength();
                const bindingContextAfterFiltering = oBinding.getContexts(0, lengthAfterFiltering);

                const itemsAfterFiltering = bindingContextAfterFiltering.map(c => c.getObject());
                let quantityColumnAfterFiltering = 0;
                for(const item of itemsAfterFiltering){
                    quantityColumnAfterFiltering = quantityColumnAfterFiltering + item.quantity;
                }
                this._columnQuantity.setHeader(new Text({ text: this._textHandler.getText("labels.loghu.column.quantity", quantityColumnAfterFiltering) }) );
            }catch(error){
                debugger;
            }
        },
        _getPrintCountGroup: function(){
            let label = new sap.m.Label({
                id: "sdasd",
                text: "Liczba wydruków",
                labelFor: "rbg1"
            });

            label.addStyleClass("sapUiSmallMarginEnd fontText");

            let radioButton0 = new sap.m.RadioButton({ id: "rg0", text: "0" });
            radioButton0.addStyleClass("myRadioButtonGroup");

            let radioButton1 = new sap.m.RadioButton({ id: "rg1", text: "1" });
            radioButton1.addStyleClass("myRadioButtonGroup");

            let radioButton2 = new sap.m.RadioButton({ id: "rg2", text: "2" });
            radioButton2.addStyleClass("myRadioButtonGroup");

            let radioButton3 = new sap.m.RadioButton({ id: "rg3", text: "3" });
            radioButton3.addStyleClass("myRadioButtonGroup");

            let radioButton4 = new sap.m.RadioButton({ id: "rg4", text: "4" });
            radioButton4.addStyleClass("myRadioButtonGroup");

            let radioButton5 = new sap.m.RadioButton({ id: "rg5", text: "5" });
            radioButton5.addStyleClass("myRadioButtonGroup");

            this._radioButtonGroup = new sap.m.RadioButtonGroup({
                id: "rbg1",
                columns: 6,
                buttons: [
                    radioButton0,
                    radioButton1,
                    radioButton2,
                    radioButton3,
                    radioButton4,
                    radioButton5
                ]
            });
            this._radioButtonGroup.addStyleClass("printRadioButtonGroup");
            let componentLabelCopies = this._resourceInstance.getComponentLabelCopies();
            this._radioButtonGroup.setSelectedIndex(componentLabelCopies);

            let oHBox = new sap.m.HBox({
                justifyContent: "Center",
                alignItems: "Center",
                width: "100%",
                items: [ label, this._radioButtonGroup ]
            });

            oHBox.addStyleClass("sapUiSmallMarginTop");
            return oHBox;
        },
        _getPrintingCopies: function(){
            let result = 1;
            try{
                result = parseInt(this._radioButtonGroup.getSelectedButton().getText());
            }catch(oError){
            }

            return result;
        }
    })

});