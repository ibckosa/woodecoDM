sap.ui.define([
    "sap/ui/base/ManagedObject",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/Pallete",
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
], function (ManagedObject,TextHandler, Palette, JSONModel, Dialog, Button, Text, mobileLibrary, TextArea, Table, Column, ColumnListItem, CheckBox, HBox, DateTimePicker, VBox, UI5Date, Panel, Toolbar, DynamicPage, Label){
    "use strict";
    return ManagedObject.extend("ibc.dm.plugins.wcPodToolsProvider.PalleteQueueHandler", {
        constructor: function(){
            ManagedObject.prototype.constructor.apply(this, arguments);
            this._textHandler = new TextHandler();
        },

        setHandlerData: function(oHandlerData){
            this._oHandlerData = oHandlerData;
        },

        displayPaletteQueue: async function(oPluginViewController, oMode){
            try {
                this._oMode = oMode;
                this._oPluginViewController = oPluginViewController;
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
                    let oVBox = new VBox({ alignItems: "Center", height: "50rem", width: "112rem" });
                    let oTableLog = this._getTableLog();
                    let oActionButtons = this._getActionButtons();
                    oVBox.addItem(oTableLog);
                    oVBox.addItem(oActionButtons);
                    this._oDialogLog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        verticalScrolling: false,
                        title: this._textHandler.getText("Logowanie palet"),
                        content: [oVBox],
                        buttons: [
                            new Button({
                                text: this._textHandler.getText("Zamknij"),
                                press: function () {
                                    this._oDialogLog.close();
                                    this._resolveLogDialog();
                                }.bind(this)
                            })
                        ]
                    });
                }
                let oLogModel = await this._getLogModel();
                this._oDialogLog.setModel(oLogModel);
                this._oDialogLog.open();


            });
        },
        _getTableLog: function () {
            let oPanel = new Panel({ height: "45rem", width: "112rem" });
            let oTable = new Table({
                growing: false,
                sticky: ["ColumnHeaders", "HeaderToolbar"],
                width: "112rem",
                inset: false,
                columns: [
                    new Column({
                        header: new Text({ text: "" })
                    }),
                    new Column({
                        header: new Text({ text: this._textHandler.getText("Numer palety") })
                    }),
                    new Column({
                        header: new Text({ text: this._textHandler.getText("Ilość") })
                    }),
                    new Column({
                        header: new Text({ text: this._textHandler.getText("Materiał") })
                    }),
                    new Column({
                        header: new Text({ text: this._textHandler.getText("Rezerwacja") })
                    })
                ],
                items: {
                    path: "/items",
                    template: new ColumnListItem({
                        cells: [
                            new CheckBox({ selected: "{lineSelected}", class: "bigCheckbox" }),
                            new Text({ text: "{handlingUnit}", class: "fontText" }),
                            new Text({ text: "{quantity}", class: "fontText" }),
                            new Text({ text: "{materialId}", class: "fontText" }),
                            new Text({ text: "{reservation}", class: "fontText" })
                        ]
                    })
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
            let oHBoxBtn = new HBox({});
            let oButtonReservation = new Button({
                text: this._textHandler.getText("REZERWACJA"),
                width: "15rem",
                press: this.onButtonReservation.bind(this)
            });

            let oButtonEndReservation = new Button({
                text: this._textHandler.getText("ZWOLNIENIE REZERWACJI"),
                width: "15rem",
                press: this.onButtonEndReservation.bind(this)
            });

            let oButtonReturn = new Button({
                text: this._textHandler.getText("ZWROT"),
                width: "15rem",
                press: this.onButtonReturn.bind(this)
            });

            let oButtonReturnNpw = new Button({
                text: this._textHandler.getText("ZWROT NPW"),
                width: "15rem"
            });

            let oButtonAdditionIssue = new Button({
                text: this._textHandler.getText("WYDANIE DODATKOWE"),
                width: "15rem"
            });
            oButtonReservation.addStyleClass("bigButtonLHU sapUiMediumMarginEnd");
            oButtonEndReservation.addStyleClass("bigButtonLHU sapUiMediumMarginEnd");
            oButtonReturn.addStyleClass("bigButtonLHU sapUiMediumMarginEnd");
            oButtonReturnNpw.addStyleClass("bigButtonLHU sapUiMediumMarginEnd");
            oButtonAdditionIssue.addStyleClass("bigButtonLHU sapUiMediumMarginEnd");
            oHBoxBtn.addItem(oButtonReservation);
            oHBoxBtn.addItem(oButtonEndReservation);
            oHBoxBtn.addItem(oButtonReturn);
            oHBoxBtn.addItem(oButtonReturnNpw);
            oHBoxBtn.addItem(oButtonAdditionIssue);
            return oHBoxBtn;
        },
        _getLogModel: async function () {

            let oPallets = await this._getPalletsData();
            let oLogData = { items: [] };


            for(const Pallet of oPallets.content){
                let oItem = {
                    lineSelected: false,
                    handlingUnit: Pallet.handlingUnit,
                    inventoryId:  Pallet.inventoryId,
                    plant:  this._oHandlerData.plant,
                    orderNumber: this._oHandlerData.order,
                    sequence: this._oHandlerData.sequence,
                    materialId: Pallet.material,
                    materialDesc: "MaterialDesc",
                    quantity: Pallet.quantityOnHand.value,
                    uom: Pallet.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                    sfc: "SFC1",
                    reservation: "",
                    storageLocation: this._oHandlerData.storageLocation,
                    createdDateTime: Pallet.createdDateTime,
                    modifiedDateTime: Pallet.modifiedDateTime,
                    palleteDetails: Pallet
                };
                oLogData.items.push(oItem);
    
            }

            // oLogData.items.push(oItem);
            // oLogData.items.push(oItem);
            // oLogData.items.push(oItem);
            // oLogData.items.push(oItem);
            // oLogData.items.push(oItem);
            // oLogData.items.push(oItem);
            // oLogData.items.push(oItem);
            // oLogData.items.push(oItem);
            // oLogData.items.push(oItem);
            // oLogData.items.push(oItem);

            let oLegModel = new JSONModel();
            oLegModel.setData(oLogData);

            return oLegModel;
        },
        _getPalletsData: async function(){
            let sUrl = this._oPluginViewController.getPublicApiRestDataSourceUri() + "inventory/v1/inventories";

            let oParameters = { plant: this._oHandlerData.plant,
                                productionSupplyArea: this._oHandlerData.resource,
                                material: this._oHandlerData.material };
            return await new Promise((resolve,reject)=>{
                this._oPluginViewController.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },
        onButtonReservation: async function(){
            try{
                let oSelectedItems = this._getSelectedItems();
                try{
                    for(const item of oSelectedItems){
                        let oPallete  = new Palette(this._oPluginViewController);
                        await oPallete.palleteReservation(item.palleteDetails, item.plant, item.orderNumber, item.sequence );
                    }
                }catch(oError){}
            }catch(oError){

            }

        },
        onButtonEndReservation: async function(){
            try{
                let oSelectedItems = this._getSelectedItems();
                try{
                    for(const item of oSelectedItems){
                        let oPallete  = new Palette(this._oPluginViewController);
                        await oPallete.palleteEndReservation(item.palleteDetails, item.plant);
                    }
                }catch(oError){}
            }catch(oError){

            }
        },
        onButtonReturn: async function(){
            try{
                let oSelectedItems = this._getSelectedItems();
                let oZweiEndpoint = this._getZweiEndpoint();
                try{
                    for(const item of oSelectedItems){
                        let oPallete  = new Palette(this._oPluginViewController);
                        await oPallete.palleteReturn(item, oZweiEndpoint);
                    }
                }catch(oError){}
            }catch(oError){

            }
        },

        _getSelectedItems: function(){
            let oItems = this._oDialogLog.getModel().getData().items;

            let oSelectedItems = oItems.filter( oItem => {
                return oItem.lineSelected === true;
            });
            return oSelectedItems;
        },

        _getZweiEndpoint: function(){
            let oZweiEndpoint = this._oPluginViewController.getConfigurationValue("zweiURL");
            if(!oZweiEndpoint){
                return "";
            }

            return oZweiEndpoint;
        }

    })

});