sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel"
], function (jQuery, PluginViewController, JSONModel) {
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

        },

        

		onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);


		}
	});
});