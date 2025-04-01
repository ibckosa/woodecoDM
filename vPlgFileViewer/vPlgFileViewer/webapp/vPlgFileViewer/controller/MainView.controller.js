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
        _loadData: function(){
            /// odczyt linków z LinkReader metoda readLinks(oController, oSfcNumber, oOrderNumber)
        },

        

		onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);


		}
	});
});