sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/LinkReader"
], function (jQuery, PluginViewController, JSONModel, LinkReader) {
	"use strict";

	return PluginViewController.extend("ibc.dm.plugins.vPlgFileViewer.vPlgFileViewer.controller.MainView", {
		onInit: function () {
			PluginViewController.prototype.onInit.apply(this, arguments);
		},

        onAfterRendering: function(){  
        },

		onBeforeRenderingPlugin: function () {
            this._loadData();			
		},

        isSubscribingToNotifications: function() {
            
            var bNotificationsEnabled = true;
           
            return bNotificationsEnabled;
        },


        getCustomNotificationEvents: function(sTopic) {
            //return ["template"];
        },


        getNotificationMessageHandler: function(sTopic) {

            //if (sTopic === "template") {
            //    return this._handleNotificationMessage;
            //}
            return null;
        },
        _loadData: async function () {
            debugger;
            var oView = this.getView();
            var oPodSelectionModel = this.getPodSelectionModel();
            var aSelections = oPodSelectionModel.getSelections();  
            const oController = this;
            var oFirstSelection = aSelections[0]; // pierwszy element tablicy
            var oSfcNumber = oFirstSelection.getSfc().getSfc();
            var oOrderNumber = oFirstSelection.getShopOrder().getShopOrder();
        
            try {
                const aLinks = await LinkReader.readLinks(oController, oSfcNumber, oOrderNumber);
                const oModel = new JSONModel({ links: aLinks });
                this.getView().setModel(oModel, "linkModel");
            } catch (error) {
                console.error("Błąd podczas ładowania linków:", error);
            }
        },
        
        onOpenLink: function (oEvent) {
            const oItem = oEvent.getSource().getParent().getBindingContext("linkModel").getObject();
            const sLink = oItem.fileLink;
        
            if (sLink) {
                const oHTML = new sap.ui.core.HTML({
                    content: `
                        <div style="width:100%; height:100%;">
                            <iframe src="${sLink}" style="width:100%; height:100%; border:none;"></iframe>
                        </div>`
                });
        
                const oDialog = new sap.m.Dialog({
                    title: oItem.fileName || "Podgląd PDF",
                    contentWidth: "90%",
                    contentHeight: "90%",
                    resizable: true,
                    draggable: true,
                    verticalScrolling: false,
                    horizontalScrolling: false,
                    content: [oHTML],
                    beginButton: new sap.m.Button({
                        text: "Zamknij",
                        press: function () {
                            oDialog.close();
                        }
                    }),
                    afterClose: function () {
                        oDialog.destroy();
                    }
                });
        
                oDialog.open();
            }
        },
        
        
        
        
        

		onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);


		}
	});
});