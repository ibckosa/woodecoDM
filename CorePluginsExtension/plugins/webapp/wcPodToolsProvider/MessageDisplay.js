sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "sap/m/library"
], function (ManagedObject, JSONModel, TextHandler, mobileLibrary) {
    "use strict";
    return ManagedObject.extend("ibc.dm.plugins.wcPodToolsProvider.MessageDisplay", {
        constructor: function(messages){
            ManagedObject.prototype.constructor.apply(this, arguments);
            // let oResourceModel = new sap.ui.model.resource.ResourceModel({
            //     bundleName : "ibc.dm.plugins.wcPodToolsProvider.i18n.i18n"
            // });
            // this.setModel(oResourceModel);
            this._messages = messages;
            this._textHandler = new TextHandler();
        },

        displayAsPopup: async function(){
            return await new Promise( async (resolve, reject) => {
                debugger;
                this._resolveLogDialog = resolve;
                this._rejectLogDialog = reject;
                
                if (!this._oDialogLog) {
                    let oVBox = new sap.m.VBox({ alignItems: "Center", height: "37rem", width: "72rem" });
                    let oTableLog = this._getMessagesAsTable();
                    oVBox.addItem(oTableLog);
                    this._oDialogLog = new sap.m.Dialog({
                        type: mobileLibrary.DialogType.Message,
                        verticalScrolling: false,
                        content: [oVBox],
                        buttons: [
                            new sap.m.Button({
                                text: this._textHandler.getText("labels.loghu.button.close"),
                                press: function () {
                                    this._oDialogLog.destroy();
                                    this._oDialogLog.close();
                                    this._resolveLogDialog();
                                }.bind(this)
                            })
                        ]
                    });
                }
                // let oTitle = this._getDialogTitle();
                // this._oDialogLog.setTitle(oTitle)
                this._setModelForTable();
                this._oDialogLog.open();


            });
        },
        _getMessagesAsTable: function(){
            let oPanel = new sap.m.Panel({ height: "35rem", width: "70rem" });
            let oColumns = this._getColumns();


            let oTable = new sap.m.Table({
                growing: false,
                sticky: ["ColumnHeaders", "HeaderToolbar"],
                width: "70rem",
                inset: false,
                columns: oColumns,
                items: {
                    path: "/items",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.ui.core.Icon({
                                src: {
                                  path: "messageType",
                                  formatter: function (sType) {
                                    return {
                                      "E": "sap-icon://message-error",
                                      "I": "sap-icon://message-information",
                                      "S": "sap-icon://message-success"
                                    }[sType] || "sap-icon://question-mark";
                                  }
                                },
                                color:{
                                    path: "messageType",
                                    formatter: function (sType) {
                                        return {
                                          "E": sap.ui.core.IconColor.Negative,
                                          "I": sap.ui.core.IconColor.Neutral,
                                          "S": sap.ui.core.IconColor.Positive
                                        }[sType] || sap.ui.core.IconColor.Neutral;

                                    }
                                },
                                decorative: false,
                                width: "auto",
                                size: "2rem"
                              }) ,
                            new sap.m.Text({ text: "{messageValue}", width: "60rem"})
                        ]
                    })
                }
            });
            

            let oDynamicPage = new sap.f.DynamicPage({ height: "40rem", width: "70rem", content: [oTable], fitContent: true });
            oDynamicPage.addStyleClass("sapUiNoContentPadding");
            oPanel.addContent(oDynamicPage);

            return oPanel;
        },
        _getColumns: function(){
            let oReturn = [];
            oReturn.push(new sap.m.Column({header: new sap.m.Text({ text: this._textHandler.getText("labels.MessageDisplay.column.messageType"), width: "auto" }), width: "10rem" }));
            oReturn.push(new sap.m.Column({header: new sap.m.Text({ text: this._textHandler.getText("labels.MessageDisplay.column.messageValue"), width: "60rem" }) }));
            return oReturn;
        },
        _setModelForTable: function(){
            let oLogModel = new JSONModel();
            let modelData = { items: this._messages };
            oLogModel.setData(modelData);
            this._oDialogLog.setModel(oLogModel);
        }

    })

});