sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/library",
    "sap/m/TextArea"
], function (jQuery, PluginViewController, JSONModel, Dialog, Button, mobileLibrary, TextArea) {
	"use strict";

	return PluginViewController.extend("ibc.dm.vPlgReceiptSfcQ23.vPlgReceiptSfcQ23.controller.MainView", {
		onInit: function () {
			PluginViewController.prototype.onInit.apply(this, arguments);
		},




        onAfterRendering: function(){
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
                if(oPodSelectionModel.workCenter === undefined || oPodSelectionModel.workCenter === ""){
                    return;
                }
                if(oPodSelectionModel.resource === null ||oPodSelectionModel.resource === undefined || oPodSelectionModel.resource.resource === undefined){
                    return
                }
                this._oWorkCenter = oPodSelectionModel.workCenter;
                this._oResource = oPodSelectionModel.resource.resource;

                var aSelection = this.getPodSelectionModel().getSelections()[0];
                var oCodesTab = await this._getCodes(aSelection.getSfcData().getWorkCenter());
                var oModelData = { items: oCodesTab };
                var oModel = new JSONModel(oModelData);
                oView.setModel(oModel);
            }catch(error){ return; }


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
            let oReturn = [];

            let oCodes = await this._getCodesOfGroup(oWorkCenter);

            for(var i = 0; i < oCodes.length; i++){
                let oCode = oCodes[i];
                let oCodeDetails = await this._getCodeDetails(oCode);
                let oResourceReasonCode = await this._getResourceReasonCode(oCodeDetails.oeeCode, oCode.plant, oWorkCenter );


                oReturn.push({
                    lineChecked: false,
                    group: oWorkCenter,
                    code: oCode.code,
                    codeDescription: oCodeDetails.description,
                    quantity: 0,
                    resourceReasonCode: oResourceReasonCode
                });
            }
            return oReturn;
        },
        _getCodesOfGroup: async function(oWorkCenter){
            let oReturn = [];

            let sUrl = this.getPublicApiRestDataSourceUri() + "nonconformancegroup/v1/nonconformancegroups";
            let oRequestParameters = { plant: this.getPodController().getUserPlant(),
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
                        reject(oError);
                    }.bind(this)
                );
            });
        },
        _getCodeDetails: async function(oCode){
            let oReturn = {description: "",
                           oeeCode: ""
            };

            let sUrl = this.getPublicApiRestDataSourceUri() + "nonconformancecode/v1/nonconformancecodes";
            let oRequestParameters = { plant: oCode.plant,
                                        code: oCode.code };

           return await new Promise((resolve,reject)=>{
                this.ajaxGetRequest(sUrl, oRequestParameters,
                    function (oResponseData) {
                        if(oResponseData.length>0){
                            try{
                                oReturn.description = oResponseData[0].description;
                                let oCustomField = oResponseData[0].customData.find((customField) => customField.attribute === "REASON_CODE");
                                oReturn.oeeCode = oCustomField.value;
                            }catch(error){}
                        }
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        resolve(oReturn);
                    }.bind(this)
                );
            });
        },
        _getResourceReasonCode: async function(oeeCode, oPlant, oResource){
            let oReturn = "";

            let sUrl = this.getPublicApiRestDataSourceUri() + "resourceReasonCode/v1/resourceReasonCodes";
            let oRequestParameters = { plant: oPlant,
                                       machineCode: oeeCode,
                                       resource: oResource };

            if(oeeCode===""){return oReturn;}

            return await new Promise((resolve,reject)=>{
                this.ajaxGetRequest(sUrl, oRequestParameters,
                    function (oResponseData) {
                        if(oResponseData.length>0){
                            try{
                                oReturn = oResponseData[0].keyId;
                            }catch(error){}
                        }
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        resolve(oReturn);
                    }.bind(this)
                );
            });
        },


        onWasteButton: async function(oEvent){
            try{
                let oSelectedItem = oEvent.getSource().getBindingContext().getObject();
                let oSfcDetails = await this._getSfcDetails();
                this._executeChecksBeforeScrap(oSelectedItem, oSfcDetails);
                let oScrapQuantity = parseInt(oSelectedItem.quantity);
                    
                if(oSfcDetails.sfcLeftQuantity>oScrapQuantity){
                    let oNewSfc = await this._executeSfcSplit(oScrapQuantity,oSfcDetails);
                    oSfcDetails.sfc = oNewSfc;
                }
                await this._logNonconformance(oScrapQuantity,oSfcDetails, oSelectedItem.code);
                await this._executeSfcScrap(oScrapQuantity,oSfcDetails, oSelectedItem.resourceReasonCode);
                this._showMessageSuccess("success.ProccessFinished");
                if(oSfcDetails.sfcLeftQuantity>oScrapQuantity){
                    this.publish("PodSelectionChangeEvent", { sendToAllPages: true });
                }else{
                    this.getPodSelectionModel().oPodSelectionModel.setInputValue("");
                    this.getPodSelectionModel().oPodSelectionModel.clearSelections();
    
                    this.publish("PodSelectionChangeEvent", { sendToAllPages: true });
                    this.onClosePress();
                    this.navigateToMainPage();
                }
            }catch(error){ this._HandleError(error)}
        },
        _getSelectedItems: function(){
            return this.getView().getModel().getData().items.filter((item)=>parseInt(item.quantity) > 0);
        },
        _getSfcDetails: async function(){
            let aSelection = this.getPodSelectionModel().getSelections()[0];
            let oSfcNumber = aSelection.getSfc().getSfc();
            let oShopOrder = aSelection.getShopOrder().getShopOrder() 
            let sUrl = this.getPublicApiRestDataSourceUri() + "/inventory/v1/inventory/goodsReceipts/summarize";
            let oRequestParameters = {
                plant: this.getPodController().getUserPlant(),
                sfc: oSfcNumber,
                order: oShopOrder
            };

            return await new Promise((resolve,reject)=>{
                this.ajaxGetRequest(sUrl, oRequestParameters,
                    oResponseData => {
                        let oReturn = this._getSfcDetailsReturnStructure();
                        oReturn.sfc = oSfcNumber;
                        oReturn.order = oShopOrder;
                        oReturn.plant = this.getPodController().getUserPlant();
                        oReturn.operation = aSelection.getSfcData().getOperation(),
                        oReturn.sfcQuantity = parseInt(aSelection.getSfcData().getQuantity());
                        oReturn.resource =  aSelection.getSfcData().getWorkCenter();
                        oReturn.workCenter =  aSelection.getSfcData().getWorkCenter();

                        let oSfcReceipts = oResponseData.sfcs[0].items;
                        if(oSfcReceipts && oSfcReceipts.length > 0){
                            oSfcReceipts.forEach(SfcReceipt => {
                                oReturn.sfcQuanDelivered = oReturn.sfcQuanDelivered + SfcReceipt.quantityInBaseUnit.value;
                            });
                        }
                        oReturn.sfcLeftQuantity = oReturn.sfcQuantity - oReturn.sfcDoneQuantity;
                        resolve(oReturn);
                    },
                    (oError, sHttpErrorMessage)=>{
                        reject(oError);
                    }
                );
            });


        },
        _getSfcDetailsReturnStructure: function(){
            return  { sfc: "",
                      plant: "",
                      order: "",
                      operation: "",
                      workCenter: "",
                      resource: "",
                      sfcQuantity: 0,
                      sfcDoneQuantity: 0,
                      sfcLeftQuantity: "" };
        },

        _throwError: function(oErrorTextId){
            var oText = this._geti18nText(oErrorTextId);
            throw { errorMessage: oText };
        },

        _getTextFromError: function(oError){
            let oReturn = "";

            if(oError===undefined){
                oReturn = this._geti18nText("errorGeneralMessage");
            }else if(oError.displayMessage !== undefined){
                oReturn = oError.displayMessage;
            }else if(oError.causeMessage !== undefined){
                oReturn = oError.causeMessage;
            }else if(oError.message !== undefined){
                oReturn = oError.message;
            }else if(oError.errorMessage !== undefined){
                oReturn = oError.errorMessage;
            }else{
                oReturn = oError;
            }

            if(oReturn===""){
                oReturn = this._geti18nText("errorGeneralMessage");
            }
            return oReturn;
        },

        _HandleError: function(oError){
            const sText = this._getTextFromError(oError);
            this.showErrorMessage(sText, true, true);
        },
        _executeChecksBeforeScrap: function(oScrapQuantity, oSfcDetails){

        },
        _executeSfcScrap: async function(oScrapQuantity, oSfcDetails, oResourceReasonCode){
            var sUrl = this.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/scrap";
            var oRequestParameters = {
                plant: oSfcDetails.plant,
                operation: oSfcDetails.operation,
                quantity: oScrapQuantity,
                resource: oSfcDetails.resource,
                sfcs: [ oSfcDetails.sfc ],
                reasonCodeKey: oResourceReasonCode   
            };

                return await new Promise((resolve,reject)=>{
                    this.ajaxPostRequest(sUrl, oRequestParameters,
                        oResponseData => {
                            resolve();
                        },
                       (oError, sHttpErrorMessage) => {
                            reject(oError);
                        }
                    );
                });
        },
        _executeSfcSplit: async function(oScrapQuantity, oSfcDetails){
            var sUrl = this.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/split";
            var oRequestParameters = {
                plant: oSfcDetails.plant,
                sfc: oSfcDetails.sfc,
                newSfcs: [{quantity: oScrapQuantity}] };

                return await new Promise((resolve,reject)=>{
                    this.ajaxPostRequest(sUrl, oRequestParameters,
                        oResponseData => {
                            resolve(oResponseData.newSfcs[0]);
                        },
                       (oError, sHttpErrorMessage) => {
                            reject(oError);
                        }
                    );
                });
        },
        _logNonconformance: async function(oScrapQuantity, oSfcDetails, oCode){
            let sUrl = this.getPublicApiRestDataSourceUri() + "nonconformance/v1/log";

            let oComment = await this._getComment();
            debugger;
            let oRequestParameters = {
                code: oCode,
                dataFields: [
                    {
                       key: "COMMENTS",
                       value: oComment
                    }
                 ],
                plant: oSfcDetails.plant,
                workCenter: oSfcDetails.workCenter,
                resource: this._oResource,
                sfcs: [oSfcDetails.sfc],
                quantity: oScrapQuantity };

                return await new Promise((resolve,reject)=>{
                    this.ajaxPostRequest(sUrl, oRequestParameters,
                        oResponseData => {
                            if(oResponseData.ids !== undefined){
                                resolve();
                            }else{
                                throw "błąd";
                            }
                        },
                       (oError, sHttpErrorMessage) => {
                            reject(oError);
                        }
                    );
                });
        },
        _showMessageSuccess: function(oTextId){

            let oText = this._geti18nText(oTextId);
            this.showSuccessMessage(oText,true, true);
        },

        _getComment: async function () {
            return await new Promise((resolve, reject) => {
                this._resolveComment = resolve;
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._geti18nText("dialogTitleLabel"),
                        content: new TextArea({ width: "30rem", rows: 12, id: "commentTextArea" }),
                        beginButton: new Button({
                            type: mobileLibrary.ButtonType.Emphasized,
                            text: this._geti18nText("dialogAcceptButtonLabel"),
                            press: async function () {
                                let oReturn = "";
                                debugger;
                                try {
                                    let oTextArea = this.oApproveDialog.getContent()[0];
                                    oReturn = oTextArea.getValue();
                                    oTextArea.setValue("");
                                } catch (error) { }

                                this.oApproveDialog.close();
                                this._resolveComment(oReturn);
                            }.bind(this)
                        })
                    });
                }

                this.oApproveDialog.open();
            });
        },
        _geti18nText: function(oTextId){
            let oReturn = '';

            try{
                oReturn = this.getView().getModel("i18n").getResourceBundle().getText(oTextId);
            }catch(error){
                oReturn = oTextId;
            }
            return oReturn;
        }

	});
});