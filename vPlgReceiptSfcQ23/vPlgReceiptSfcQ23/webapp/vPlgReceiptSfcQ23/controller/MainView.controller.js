sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel"
], function (jQuery, PluginViewController, JSONModel) {
	"use strict";

	return PluginViewController.extend("ibc.dm.vPlgReceiptSfcQ23.vPlgReceiptSfcQ23.controller.MainView", {
		onInit: function () {
			PluginViewController.prototype.onInit.apply(this, arguments);
			
			           
            
		},




        onAfterRendering: function(){
           
            // this.getView().byId("backButton").setVisible(this.getConfiguration().backButtonVisible);
            // this.getView().byId("closeButton").setVisible(this.getConfiguration().closeButtonVisible);
            
            // this.getView().byId("headerTitle").setText(this.getConfiguration().title);
            // this.getView().byId("textPlugin").setText(this.getConfiguration().text); 

        },

		onBeforeRenderingPlugin: function () {
            this.subscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.subscribe("OperationListSelectEvent", this.onOperationChangeEvent, this);
            this.subscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);			
		},

        onBeforeRendering: function () {
            this.loadData();
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

        onPodSelectionChangeEvent: function (sChannelId, sEventId, oData) {
            this.loadData();
            return;
        },

        onOperationChangeEvent: function (sChannelId, sEventId, oData) {
            this.loadData();
            return;
        },

        onWorkListSelectEvent: function (sChannelId, sEventId, oData) {
            this.loadData();
            return;
        },

        loadData: async function(){
            var oView = this.getView();
            var oConfiguration = this.getConfiguration();
            var bNotificationsEnabled = true;
            var oPodSelectionModel = this.getPodSelectionModel();
            var sPodType = oPodSelectionModel.getPodType();

            try{
                var aSelection = this.getPodSelectionModel().getSelections()[0];
            }catch(error){
                return;
            }
            
        


            var oCodesTab = await this._getCodes(aSelection.getSfcData().getWorkCenter());

            var oModelData = { items: oCodesTab };


            var oModel = new JSONModel(oModelData);
            oView.setModel(oModel);
        },
        

		onExit: function () {
            if (PluginViewController.prototype.onExit) {
                PluginViewController.prototype.onExit.apply(this, arguments);
            }
            this.unsubscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.unsubscribe("OperationListSelectEvent", this.onOperationChangeEvent, this);
            this.unsubscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);

		},
        _getCodes: async function(oWorkCenter){
            var oReturn = [];

            var oCodes = await this._getCodesOfGroup(oWorkCenter);

            for(var i = 0; i < oCodes.length; i++){
                var oCode = oCodes[i];
                var oCodeDescription = await this._getCodeDescription(oCode);
                oReturn.push({
                    lineChecked: false,
                    group: oWorkCenter,
                    code: oCode.code,
                    codeDescription: oCodeDescription,
                    quantity: 0,
                });
            }
            return oReturn;
        },
        _getCodesOfGroup: async function(oWorkCenter){
            var oReturn = [];

            var sUrl = this.getPublicApiRestDataSourceUri() + "nonconformancegroup/v1/nonconformancegroups";
            var oRequestParameters = { plant: this.getPodController().getUserPlant(),
                                        group: oWorkCenter };
           return await new Promise((resolve,reject)=>{
                this.ajaxGetRequest(sUrl, oRequestParameters,
                    function (oResponseData) {
                        if(oResponseData.length>0){
                            oReturn = oResponseData[0].codes;
                        }
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        resolve(oReturn);
                    }.bind(this)
                );
            });
        },
        _getCodeDescription: async function(oCode){
            var oReturn = "";

            var sUrl = this.getPublicApiRestDataSourceUri() + "nonconformancecode/v1/nonconformancecodes";
            var oRequestParameters = { plant: oCode.plant,
                                        code: oCode.code };

           return await new Promise((resolve,reject)=>{
                this.ajaxGetRequest(sUrl, oRequestParameters,
                    function (oResponseData) {
                        if(oResponseData.length>0){
                            oReturn = oResponseData[0].description;
                        }
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        resolve(oReturn);
                    }.bind(this)
                );
            });

        },
        onPackagingButton: async function(oCode){
            let oTableItems = this.getView().getModel().getData().items;
            let iValue = 0;
            oTableItems.forEach( item => {
                if(item.lineChecked===true){iValue = iValue + 1;}
            });
            debugger;
        }
	});
});