sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "sap/m/library"
], function (ObjectUI5, TextHandler, mobileLibrary) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.ConfirmDialog", {
        constructor: function(){
            this._textHandler = new TextHandler();
            this._content = "";
            this._title  = "";
        },
        setContentText: function(textid, ...args){
            this._content = this._textHandler.getText(textid, ...args);
        },
        setTitleText: function(textid, ...args){
            this._title = this._textHandler.getText(textid, ...args);
        },
        show: async function(){
            return await new Promise((resolve,reject)=>{
                this._resolveDialog = resolve;
                this._rejectDialog = reject;
                if (!this._dialog) {
                    this._dialog = new sap.m.Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._title,
                        content: new sap.m.Text({ text: this._content }),
                        beginButton: new sap.m.Button({
                            type: mobileLibrary.ButtonType.Emphasized,
                            text: this._textHandler.getText("answerYes"),
                            press: async function () {
                                    this._dialog.close();
                                    this._dialog.destroy();
                                    this._resolveDialog();
                            }.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: this._textHandler.getText("answerNo"),
                            press: function () {
                                this._dialog.close();
                                this._dialog.destroy();
                                this._rejectDialog({ message: "",
                                                     displayType: "NO_DISPLAY" })
                            }.bind(this)
                        })
                    });
                }

               this._dialog.open();
            });
        }
    });
});