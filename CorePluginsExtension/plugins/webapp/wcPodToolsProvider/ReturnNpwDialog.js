sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/library",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/Input",
    "sap/m/Label",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/NcCodesReader",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler"
], function (Object, Dialog, Button, Text, mobileLibrary, HBox, VBox, Input, Label, TextHandler, NcCodesReader, ErrorHandler) {
    "use strict";
    let ReturnNpwDialog =  Object.extend("ibc.dm.plugins.wcPodToolsProvider.ReturnNpwDialog", {

    });


    ReturnNpwDialog.showDialog = async function (oLine, oController) {
        let oCodes = await NcCodesReader.readCodes(oController, oLine.plant, oLine.workCenter, oLine.resource);
        return await new Promise((resolve, reject) => {
            this._resolveQuanNpwDialog = resolve;
            this._rejectQuanNpwDialog = reject;
            this._oController = oController;
            this._oErrorHandler = new ErrorHandler(oController);
            if (!this._oDialogNpw) {
                this._oTextHandler = new TextHandler();
                let oVBox = new VBox({ alignItems: "Center", height: "18rem", width: "40rem" });
                let oInput = new Input({ width: "17rem", liveChange: this.onInputLiveChange.bind(this) });
                
                let oLabelHu = new Label({  }).addStyleClass("fontTextHuDialog");
                let oLabelHuQuan = new Label({ }).addStyleClass("fontTextQuanDialog ");
                this._oInput = oInput;
                this._oLabelHu = oLabelHu;
                this._oLabelHuQuan = oLabelHuQuan;

                oInput.addStyleClass("inputFontDialog sapUiMediumMarginTop");
                let oNpwButtons = this._getNpwButtons();
                let oComboBox = this._getComboBox();
                oVBox.addItem(oLabelHu);
                oVBox.addItem(oLabelHuQuan);
                oVBox.addItem(oInput);
                oVBox.addItem(oComboBox);
                oVBox.addItem(oNpwButtons);
                this._oDialogNpw = new Dialog({
                    type: mobileLibrary.DialogType.Message,
                    showHeader: false,
                    verticalScrolling: false,
                    content: [oVBox]
                });
            }
            this._oInput.setValue("0");
            this._oLabelHu.setText(`${oLine.handlingUnit}`);
            this._oLabelHuQuan.setText(`${oLine.quantity} ${oLine.uom}`);
            
            //let oCodes = [];
            this._oComboBox.removeAllItems();
            this._oComboBox.clearSelection();
            for(const code of oCodes){
                this._oComboBox.addItem( new sap.ui.core.Item({key: code.code, text: code.codeDescription}) );
            }
            this._oDialogNpw.open();
        });
    };
    ReturnNpwDialog._getNpwButtons = function () {
        let oHBoxBtn = new HBox({});
        let oButtonOK = new Button({
            text: this._oTextHandler.getText("OK"),
            width: "15rem",
            press: this.onButtonOk.bind(this)
        });

        let oButtonCancel = new Button({
            text: this._oTextHandler.getText("ANULUJ"),
            width: "15rem",
            press: this.onButtonCancel.bind(this)
        });

        oButtonOK.addStyleClass("bigButtonDialogHu sapUiMediumMarginEnd");
        oButtonCancel.addStyleClass("bigButtonDialogHu sapUiMediumMarginEnd");
        oHBoxBtn.addItem(oButtonOK);
        oHBoxBtn.addItem(oButtonCancel).addStyleClass("sapUiSmallMarginTop");
        return oHBoxBtn;
    };
    ReturnNpwDialog.onButtonOk = function (oEvent) {
        try{
            let oCode = this._oComboBox.getSelectedKey();
            if(!oCode||oCode===""){ this._oErrorHandler.throwError("error.logHU.ncCodeNotSelected");}
            this._oDialogNpw.close();
            this._resolveQuanNpwDialog( { quantity: parseInt(this._oInput.getValue()),
                                          code: oCode
             });
        }catch(oError){this._oErrorHandler.handleError(oError);}
    };
    ReturnNpwDialog.onButtonCancel = function (oEvent) {
        this._oDialogNpw.close();
        this._resolveQuanNpwDialog({ quantity: 0,
                                     ncCode: ""  });
    };
    ReturnNpwDialog.onInputLiveChange = function (oEvent) {
        var value = oEvent.getParameter("value");
        var newValue = value.replace(/[^0-9]/g, '');
        if (value !== newValue) {
            oEvent.getSource().setValue(newValue);
        }
    };
    ReturnNpwDialog._getComboBox = function () {
        this._oComboBox = new sap.m.ComboBox();
        return this._oComboBox;
    };

    ReturnNpwDialog._setComboBoxModel = async function (oLine) {
        let oCodes = await NcCodesReader.readCodes(this._oController, oLine.plant, oLine.workCenter, oLine.resource);

        this._oComboBox.removeAllItems();
        for(const code of oCodes){
            _oComboBox.additem( sap.ui.core.Item({key: code.code, text: code.codeDescription}) );
        }
    };


    return ReturnNpwDialog;
});