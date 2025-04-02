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
            // Wywołanie metody readLinks
            const data = await oLinkReader.readLinks(oController, oSfcNumber, oOrderNumber);
            
            // Ustawienie modelu danych
            const oModel = new sap.ui.model.json.JSONModel({ files: data });
            this.getView().setModel(oModel);
        },

        onOpenLink: function (oEvent) {
            // Pobierz link z bieżącego elementu
            const sPath = oEvent.getSource().getBindingContext().getPath();
            const oItem = this.getView().getModel().getProperty(sPath);
            
            // Otwórz link w nowej karcie
            window.open(oItem.fileLink, "_blank");
        },
        

        

		onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);


		}
	});
});