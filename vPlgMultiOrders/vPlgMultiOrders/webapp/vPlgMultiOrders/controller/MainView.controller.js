sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/NcCodesReader"
], function (jQuery, PluginViewController, JSONModel, ErrorHandler, TextHandler, OrderRepository, NcCodesReader) {
	"use strict";

	return PluginViewController.extend("ibc.dm.plugins.vPlgMultiOrders.vPlgMultiOrders.controller.MainView", {
		onInit: function () {
			PluginViewController.prototype.onInit.apply(this, arguments);
			this._oTextHandler = new TextHandler();
            this._oErrorHandler = new ErrorHandler(this);
			           
            
		},




        onAfterRendering: function(){
           
            this.getView().byId("backButton").setVisible(this.getConfiguration().backButtonVisible);
            this.getView().byId("closeButton").setVisible(this.getConfiguration().closeButtonVisible);
            
            this.getView().byId("headerTitle").setText(this.getConfiguration().title);
            this.getView().byId("textPlugin").setText(this.getConfiguration().text); 

        },

		onBeforeRenderingPlugin: function () {

			
			
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

        _handleNotificationMessage: function(oMsg) {
           
            var sMessage = "Message not found in payload 'message' property";
            if (oMsg && oMsg.parameters && oMsg.parameters.length > 0) {
                for (var i = 0; i < oMsg.parameters.length; i++) {

                    switch (oMsg.parameters[i].name){
                        case "template":
                            
                            break;
                        case "template2":
                            
                        
                        }        
          

                    
                }
            }

        },
        

		onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);


		},
        _loadData: async function () {
            debugger;
            try {
                var oPodSelectionModel = this.getPodSelectionModel();
                var aSelections = oPodSelectionModel.getSelections();  
                const oController = this;
                var oFirstSelection = aSelections[0]; // pierwszy element tablicy
                this._oPlant = this.getPodController().getUserPlant();
                this._oOrderNumber = oFirstSelection.getShopOrder().getShopOrder();
                this._oWorkCenter = oPodSelectionModel.workCenter;
                this._oResource = oPodSelectionModel.resource.resource;
                this._oOrder = await OrderRepository.readOrderByPassBuffer(this, this._oPlant, this._oOrderNumber);
                let oPositions = await this._oOrder.getOrderPositions();
                let oCodesTab = await NcCodesReader.readCodes(this, this._oPlant, this._oWorkCenter, this._oResource);
                // const aLinks = await LinkReader.readLinks(oController, oSfcNumber, oOrderNumber);
                const oModel = new JSONModel({ positions: oPositions, codes: oCodesTab });
                this.getView().setModel(oModel, "multiOrdersModel");
            } catch (error) {
                this._oErrorHandler.handleError(error);
            }
        }
	});
});