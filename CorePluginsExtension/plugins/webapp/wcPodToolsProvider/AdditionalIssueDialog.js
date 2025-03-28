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
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (Object, Dialog, Button, Text, mobileLibrary, HBox, VBox, Input, Label, TextHandler) {
    "use strict";
    let ReturnNpwDialog =  Object.extend("ibc.dm.plugins.wcPodToolsProvider.AdditionalIssueDialog", {

    });


    ReturnNpwDialog.showDialog = async function (oLine) {
        return await new Promise((resolve, reject) => {
            this._resolveQuanNpwDialog = resolve;
            this._rejectQuanNpwDialog = reject;

            if (!this._oDialogNpw) {
                this._oTextHandler = new TextHandler();
                let oVBox = new VBox({ alignItems: "Center", height: "14rem", width: "40rem" });
                let oInput = new Input({ width: "17rem", liveChange: this.onInputLiveChange.bind(this) });
                
                let oLabelHu = new Label({  }).addStyleClass("fontTextHuDialog");
                let oLabelHuQuan = new Label({ }).addStyleClass("fontTextQuanDialog ");
                this._oInput = oInput;
                this._oLabelHu = oLabelHu;
                this._oLabelHuQuan = oLabelHuQuan;

                oInput.addStyleClass("inputFontDialog sapUiMediumMarginTop");
                let oNpwButtons = this._getNpwButtons();
                oVBox.addItem(oLabelHu);
                oVBox.addItem(oLabelHuQuan);
                oVBox.addItem(oInput);
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
        this._oDialogNpw.close();
        this._resolveQuanNpwDialog(parseInt(this._oInput.getValue()));
    };
    ReturnNpwDialog.onButtonCancel = function (oEvent) {
        this._oDialogNpw.close();
        this._resolveQuanNpwDialog(0);
    };
    ReturnNpwDialog.onInputLiveChange = function (oEvent) {
        var value = oEvent.getParameter("value");
        var newValue = value.replace(/[^0-9]/g, '');
        if (value !== newValue) {
            oEvent.getSource().setValue(newValue);
        }
    }


    return ReturnNpwDialog;
});