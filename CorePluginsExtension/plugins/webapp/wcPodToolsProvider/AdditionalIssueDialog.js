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
            this._oInput.setValue("");
            this._oLabelHu.setText(`${oLine.handlingUnit}`);
            this._oLabelHuQuan.setText(`${oLine.quantity} ${oLine.uom}`);
            this._oUom = oLine.uom;
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
        let value = this._oInput.getValue();
        value = parseFloat(value.replace(",", ".")); 
        this._oDialogNpw.close();
        
        this._resolveQuanNpwDialog(value);
    };
    ReturnNpwDialog.onButtonCancel = function (oEvent) {
        this._oDialogNpw.close();
        this._resolveQuanNpwDialog(0);
    };
    ReturnNpwDialog.onInputLiveChange = function (oEvent) {
        if(this._oUom==='ST'){
            let value = oEvent.getParameter("value");
            let newValue = value.replace(/[^0-9]/g, '');
            if (value !== newValue) {
                oEvent.getSource().setValue(newValue);
            }
        }else{
            let oInput = oEvent.getSource();
            let sValue = oEvent.getParameter("value");

            sValue = sValue.replace(/[^\d,]/g, '');
            if (sValue.startsWith(",")) {
                sValue = "0" + sValue;  // ".5" -> "0.5"
            }
            let firstDot = sValue.indexOf(",");
            if (firstDot !== -1) {
                let secondDot = sValue.indexOf(",", firstDot + 1);
                if (secondDot !== -1) {
                    sValue = sValue.substring(0, secondDot) + sValue.substring(secondDot + 1);
                }
            }
            if (firstDot !== -1) {
                let decimalPart = sValue.slice(firstDot + 1);
                if (decimalPart.length > 3) {
                    sValue = sValue.slice(0, firstDot + 1 + 3); 
                }
            }
            if (sValue === "" || sValue === ",") {
                sValue = "0";
            }
            if (sValue !== oEvent.getParameter("value")) {
                oInput.setValue(sValue);
            }
        }
    }


    return ReturnNpwDialog;
});