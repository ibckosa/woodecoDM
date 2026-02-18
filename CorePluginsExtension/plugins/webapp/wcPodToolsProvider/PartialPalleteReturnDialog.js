sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/library",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/Input",
    "sap/m/Label",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler"
], function (Object, Dialog, Button, mobileLibrary, HBox, VBox, Input, Label, TextHandler, ErrorHandler) {
    "use strict";
    let ReturnDialog =  Object.extend("ibc.dm.plugins.wcPodToolsProvider.PartialPalleteReturnDialog", {
    });

    ReturnDialog.showDialog = async function (oLine, oController) {
        return await new Promise((resolve, reject) => {
            this._resolveDialog = resolve;
            this._rejectDialog = reject;
            this._oController = oController;
            this._oErrorHandler = new ErrorHandler(oController);
            if (!this._oDialogNpw) {
                this._textHandler = new TextHandler();
                let oVBox = new VBox({ alignItems: "Center", height: "18rem", width: "40rem" });
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
            this._oUom = oLine.uom;
            this._oLabelHuQuan.setText(`${oLine.quantity} ${oLine.uom}`);
            this._oDialogNpw.open();
        });
    };
    ReturnDialog._getNpwButtons = function () {
        let oHBoxBtn = new HBox({});
        let oButtonOK = new Button({
            text: this._textHandler.getText("OK"),
            width: "15rem",
            press: this.onButtonOk.bind(this)
        });

        let oButtonCancel = new Button({
            text: this._textHandler.getText("ANULUJ"),
            width: "15rem",
            press: this.onButtonCancel.bind(this)
        });

        oButtonOK.addStyleClass("bigButtonDialogHu sapUiMediumMarginEnd");
        oButtonCancel.addStyleClass("bigButtonDialogHu sapUiMediumMarginEnd");
        oHBoxBtn.addItem(oButtonOK);
        oHBoxBtn.addItem(oButtonCancel).addStyleClass("sapUiSmallMarginTop");
        return oHBoxBtn;
    };
    ReturnDialog.onButtonOk = function (oEvent) {
        try{
            this._oDialogNpw.close();
            this._resolveDialog( { quantity: this._oInput.getValue() });
        }catch(oError){this._oErrorHandler.handleError(oError);}
    };
    ReturnDialog.onButtonCancel = function (oEvent) {
        this._oDialogNpw.close();
        this._resolveDialog({ quantity: 0 });
    };
    ReturnDialog.onInputLiveChange = function (oEvent) {
        if(this._oUom==='ST'){
            let value = oEvent.getParameter("value");
            let newValue = value.replace(/[^0-9]/g, '');
            if (value !== newValue) {
                oEvent.getSource().setValue(newValue);
            }
        }else{
            let oInput = oEvent.getSource();
            let sValue = oEvent.getParameter("value");

            sValue = sValue.replace(/[^\d.]/g, '');
            if (sValue.startsWith(".")) {
                sValue = "0" + sValue;  // ".5" -> "0.5"
            }
            let firstDot = sValue.indexOf(".");
            if (firstDot !== -1) {
                let secondDot = sValue.indexOf(".", firstDot + 1);
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
            if (sValue === "" || sValue === ".") {
                sValue = "0";
            }

            if (sValue !== oEvent.getParameter("value")) {
                oInput.setValue(sValue);
            }
        }

    };
    return ReturnDialog;
});