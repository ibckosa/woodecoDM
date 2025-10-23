sap.ui.define([
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/library",
    "sap/m/TextArea",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "ibc/dm/plugins/wcPodToolsProvider/IssuesManagerV2",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository",
    "ibc/dm/plugins/wcPodToolsProvider/NcCodesReader",
    "ibc/dm/plugins/wcPodToolsProvider/Sfc",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/NonconformanceReader",
    "ibc/dm/plugins/wcPodToolsProvider/PiqQ23",
    "ibc/dm/plugins/wcPodToolsProvider/ConfirmDialog",
    "ibc/dm/plugins/wcPodToolsProvider/DataCollectionSaver"
], function (PluginViewController, JSONModel, Dialog, Button, mobileLibrary, TextArea, ErrorHandler, SfcRepository, IssuesManagerV2, ResourceRepository, NcCodesReader, Sfc, TextHandler, 
             OrderRepository, NonconformanceReader, PiqQ23, ConfirmDialog, DataCollectionSaver) {
	"use strict";

	return PluginViewController.extend("ibc.dm.vPlgReceiptSfcQ23.vPlgReceiptSfcQ23.controller.MainView", {
		onInit: function () {
			PluginViewController.prototype.onInit.apply(this, arguments);
            this._oErrorHandler = new ErrorHandler(this);
            this._oTextHandler = new TextHandler();
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
            // this.loadData();
            // return;
        },

        onWorkListSelectEvent: function (sChannelId, sEventId, oData) {
            this.loadData();
            return;
        },

        loadData: async function(){
            var oView = this.getView();
            var oPodSelectionModel = this.getPodSelectionModel();

            try{
                let aSelection = this.getPodSelectionModel().getSelections()[0];
                if(oPodSelectionModel.workCenter === undefined || oPodSelectionModel.workCenter === ""){
                    return;
                }
                if(oPodSelectionModel.resource === null ||oPodSelectionModel.resource === undefined || oPodSelectionModel.resource.resource === undefined){
                    return;
                }
                this._oWorkCenter = oPodSelectionModel.workCenter;
                this._oResource = oPodSelectionModel.resource.resource;
                let resourceInstance = await ResourceRepository.getResourceInstance(this, this.getPodController().getUserPlant(), this._oResource);

                //var aSelection = this.getPodSelectionModel().getSelections()[0];
                let oCodesTab = await NcCodesReader.readCodes(this, this.getPodController().getUserPlant(), this._oWorkCenter, this._oResource);

                let nonConformancesCodeReader = new NonconformanceReader(this, { plant: this.getPodController().getUserPlant(),
                                                                                 operation_activity: aSelection.getSfcData().getOperation(),
                                                                                 resource: this._oResource,
                                                                                 excludeStorned: true  } );

                let nonconformances  = await nonConformancesCodeReader.readNonconformances();
                for(const codeLine of oCodesTab){
                    codeLine.conconformanceQuantity = 0;
                    codeLine.quantity = '';
                    let nonconformancesFiltered = nonconformances.filter(nonconformance=>{ return nonconformance.code === codeLine.code });
                    for(const nonconformance of nonconformancesFiltered){
                        codeLine.conconformanceQuantity = codeLine.conconformanceQuantity + nonconformance.quantity;
                    }
                }
                //var oCodesTab = await this._getCodes(aSelection.getSfcData().getWorkCenter());
                var oModelData = { items: oCodesTab };
                var oModel = new JSONModel(oModelData);
                oView.setModel(oModel);

                let q2Scheme = resourceInstance.getQ2Scheme();
                this._setAvailableQ23(q2Scheme==="PIQ");
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
                    dataType: oCodeDetails.dataType,
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
                           oeeCode: "",
                           dataType: ""
            };

            let sUrl = this.getPublicApiRestDataSourceUri() + "nonconformancecode/v1/nonconformancecodes";
            let oRequestParameters = { plant: oCode.plant,
                                        code: oCode.code, };

           return await new Promise((resolve,reject)=>{
                this.ajaxGetRequest(sUrl, oRequestParameters,
                    function (oResponseData) {
                        if(oResponseData.length>0){
                            try{
                                oReturn.description = oResponseData[0].description;
                                oReturn.dataType = oResponseData[0].dataType;
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
                let aSelection = this.getPodSelectionModel().getSelections()[0];
                this._oOrder = await OrderRepository.readOrder(this, this.getPodController().getUserPlant(), aSelection.getShopOrder().getShopOrder());
                let oSfcFirst = aSelection.getSfc().getSfc();
                let oSelectedItem = oEvent.getSource().getBindingContext().getObject();
                let oSfcDetails = await this._getSfcDetails();
                let oResource = await ResourceRepository.getResourceInstance(this, this.getPodController().getUserPlant(), this._oResource);
                let oExecuteIssue =  oResource.getConsumptionMode(true)==="AUTOMATIC";
                oSelectedItem.quantity = parseInt(oSelectedItem.quantity);
                await this._executeChecksBeforeScrap(oSelectedItem, oSfcDetails, oResource);
                let oScrapQuantity = parseInt(oSelectedItem.quantity);
                let oComment = await this._getComment(oSelectedItem.dataType);

                let issueManager;
                if(oExecuteIssue){
                    issueManager = new IssuesManagerV2(this, {  sfcNumber: aSelection.getSfc().getSfc(),
                                                                orderNumber: aSelection.getShopOrder().getShopOrder(),
                                                                operation: aSelection.getSfcData().getOperation(),
                                                                plant: this.getPodController().getUserPlant(),
                                                                workCenter: this._oWorkCenter,
                                                                resource: this._oResource,
                                                                salesOrder: this._oOrder.getCustomerOrder(),
                                                                salesOrderItem: this._oOrder.getCustomerOrderItem(),
                                                                mode: "Q2",
                                                                q2Quantity: this._getRegisteredQ23()});
                    await issueManager.initializeManager();
                    await issueManager.checkQuantityAvailable(oScrapQuantity);
                }




                if(oSfcDetails.sfcLeftQuantity>oScrapQuantity || !oSfcDetails.multiOperation || !oSfcDetails.lastOperation){
                    let oNewSfc = await this._executeSfcSplit(oScrapQuantity, oSfcDetails, (!oSfcDetails.multiOperation || !oSfcDetails.lastOperation));
                    oSfcDetails.sfc = oNewSfc;
                }
                let oNonconformanceId = await this._logNonconformance(oScrapQuantity,oSfcDetails, oSelectedItem.code, oComment);
                if(oResource.getNcCodeType() === "Q3"){
                    await this._closeNonconformance(this.getPodController().getUserPlant() , oNonconformanceId);
                }
                await this._executeSfcScrap(oScrapQuantity,oSfcDetails, oSelectedItem.resourceReasonCode);
                if(oExecuteIssue){
                    await issueManager.executeIssues(oScrapQuantity, oSfcDetails.sfc);
                }

                await this._saveDataCollection(oScrapQuantity, oSfcDetails, oSelectedItem.oeeCode, issueManager, oSelectedItem.code, oSelectedItem.codeDescription);
                this._showMessageSuccess("success.ProccessFinished");
                //oEvent.getSource().getBindingContext().setProperty("/quantity", "0");
                if(oSfcDetails.sfcLeftQuantity>oScrapQuantity){
                    await this.loadData();
                }else{
                    if(oSfcDetails.multiOperation&&oSfcDetails.lastOperation){
                        this.getPodSelectionModel().setInputValue("");
                        this.getPodSelectionModel().clearSelections();
        
                        this.publish("PodSelectionChangeEvent", { sendToAllPages: true });
                        this.onClosePress();
                        this.navigateToMainPage();
                    }else{
                        await this.loadData()
                    }
                }
            }catch(error){ 
                if(!error.displayType){
                    error.displayType = "POPUP";
                }
                this._oErrorHandler.handleError(error)}
        },
        _getSelectedItems: function(){
            return this.getView().getModel().getData().items.filter((item)=>parseInt(item.quantity) > 0);
        },
        _getSfcDetails: async function(){
            let aSelection = this.getPodSelectionModel().getSelections()[0];
            let oSfcNumber = aSelection.getSfc().getSfc();
            let oShopOrder = aSelection.getShopOrder().getShopOrder();
            let routing = aSelection.getSfcData().getRouting();
            let routingVersion = aSelection.getSfcData().getRoutingVersion();
            let oSfc = await SfcRepository.ReadSfcBypassBuffer(this, this.getPodController().getUserPlant(), oSfcNumber, routing, routingVersion );
            let oStep = oSfc.getStepByOperation(aSelection.getSfcData().getOperation());
            let oSteps = oSfc.getSteps();
            let oLastStep = oSfc.getLastStep();
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
                        oReturn.step = oStep;
                        oReturn.sfcQuantityInWork = oStep.quantityInWork;
                        oReturn.multiOperation = oSteps.length > 1;
                        oReturn.lastOperation = oStep === oLastStep;

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
                      sfcLeftQuantity: 0,
                      sfcQuantityInWork: 0,
                      multiOperation: false,
                      lastOperation: false };
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
        _executeChecksBeforeScrap: async function(oSelectedItem, oSfcDetails, resourceInstance){
            if(oSelectedItem.quantity>oSfcDetails.sfcLeftQuantity && oSfcDetails.multiOperation && oSfcDetails.lastOperation){
                this._oErrorHandler.throwError("error.q23.sfcNotEnoughQuantity");
            }

            if(oSfcDetails.sfcQuantityInWork<1 && (!oSfcDetails.multiOperation || !oSfcDetails.lastOperation)){
                this._oErrorHandler.throwError("error.q23.sfcNotInWork");
            }

            // if(oSelectedItem.quantity>oSfcDetails.sfcQuantityInWork && (!oSfcDetails.multiOperation || !oSfcDetails.lastOperation)){
            //     this._oErrorHandler.throwError("error.q23.sfcNotInWork");
            // }
            else if(oSfcDetails.multiOperation && oSfcDetails.lastOperation && oSelectedItem.quantity>oSfcDetails.sfcQuantityInWork){
                await Sfc.startSfcs(this, oSfcDetails.plant, [oSfcDetails.sfc], oSfcDetails.operation, this._oResource );
            }

            if(resourceInstance.getQ2Scheme() === "PIQ"){
                let availableQuantity = this.byId("availableQ23").getValue();
                if(oSelectedItem.quantity > availableQuantity){
                    let confirmDialog = new ConfirmDialog();
                    confirmDialog.setContentText("labels.q23.confrimPiqNotEnoughQuan");
                    //confirmDialog.setTitleText();
                    await confirmDialog.show();
                }
            }

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
        _executeSfcSplit: async function(oScrapQuantity, oSfcDetails, allowOverProduction){
            var sUrl = this.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/split";
            var oRequestParameters = {
                plant: oSfcDetails.plant,
                sfc: oSfcDetails.sfc,
                allowOverproduction: allowOverProduction,
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
        _logNonconformance: async function(oScrapQuantity, oSfcDetails, oCode, oComment){
            let sUrl = this.getPublicApiRestDataSourceUri() + "nonconformance/v1/log";

            debugger;
            let oRequestParameters = {
                code: oCode,
                dataFields: [
                    {
                       key: "COMMENTS",
                       value: oComment
                    },
                    {
                        key: "ITEM_NUMBER",
                        value: "1"
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
                                resolve(oResponseData.ids[0].ids[0]);
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

        _getComment: async function (oDataType) {
            return await new Promise((resolve, reject) => {
                this._resolveComment = resolve;
                this._oDataType = oDataType;
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._oTextHandler.getText("labels.q23.commentTitleDialog"),
                        content: new TextArea({ width: "30rem", rows: 12, id: "commentTextArea" }),
                        beginButton: new Button({
                            type: mobileLibrary.ButtonType.Emphasized,
                            text: this._oTextHandler.getText("labels.q23.dialogAcceptButton"),
                            press: async function () {
                                let oReturn = "";
                                debugger;
                                try {
                                    let oTextArea = this.oApproveDialog.getContent()[0];
                                    oReturn = oTextArea.getValue();
                                    if(oReturn.length === 0 && this._oDataType ==="NC_DATA_COMMENT_REQUIERED"){
                                        this._oErrorHandler.throwError("error.q23.emptyComment");
                                    }
                                    oTextArea.setValue("");
                                    this.oApproveDialog.close();
                                    this.oApproveDialog.destroy();
                                    this.oApproveDialog = undefined;
                                    this._resolveComment(oReturn);
                                } catch (oError) { this._oErrorHandler.handleError(oError) }
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
        },
        _closeNonconformance: async function( oPlant , oNonconformanceId){
            let sUrl = this.getPublicApiRestDataSourceUri() + "nonconformance/v1/close";

            let oParameters = { plant: oPlant,
                                id: oNonconformanceId };
            return await new Promise((resolve,reject)=>{
                this.ajaxPostRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    oError=>{
                        reject(oError);
                    }   
                );

            });
        },
        _saveDataCollection: async function(quantity, sfcDetails, code, issueManager, ncCode, ncCodeDescription){
            let guid = crypto.randomUUID();
            let date = new Date();

            let issuesAsString = [];
            if(issueManager){
                let issuesCreated = issueManager.getCreatedIssues();
                for(const issue of issuesCreated){
                    let issueAsString = Object.entries(issue)
                                            .map(([key, value]) => `${key}:${value}`)
                                            .join('||');
                    issuesAsString.push(issueAsString);
                }

            }



            await DataCollectionSaver.saveProductionDC(
                this,
                {
                    plant: sfcDetails.plant,
                    sfc: sfcDetails.sfc,
                    resource: sfcDetails.resource,
                    operation: sfcDetails.step.operation.operation,
                    productionProcessType: "Q3",
                    q3Code: code,
                    quantity: `${quantity}`,
                    uom: this._oOrder.getInternalUom(),
                    material: this._oOrder.getHeaderMaterial(),
                    itemNo: "0001",
                    salesOrder: "", 
                    saledOrderItem: "",
                    hu: "",
                    cancelled: false,
                    user: this.getUserId(),
                    consumption: issuesAsString,
                    dateCreated: date.toJSON(),
                    processStart: "",
                    processStop: "",
                    ncCode: ncCode,
                    ncCodeDescription: ncCodeDescription,
                    guid: guid
                }

            );

        },
        _setAvailableQ23: async function(visible){
            try{
                let availableQ23Input = this.byId("availableQ23");

                availableQ23Input.setVisible(visible);
                availableQ23Input.setValue("Dostępne: 0");

                if(visible){
                    let aSelection = this.getPodSelectionModel().getSelections()[0];
                    let piqQ23 = new PiqQ23(this, {  plant: this.getPodController().getUserPlant(),
                                                     order: aSelection.getShopOrder().getShopOrder()
                     });
                    let q23FromPiq = await piqQ23.getQ23Available();
                    let q23Registered = this._getRegisteredQ23();
                    let quantityAvailable = q23FromPiq - q23Registered;
                    availableQ23Input.setValue(`Dostępne: ${quantityAvailable}`);
                    
                }
        
            }catch(error){
            }
        },
        _getRegisteredQ23: function(){
            let result = 0;
            let modelData = this.getView().getModel().getData();
            if(modelData.items){
                for(const item of modelData.items){
                        result = result + item.conconformanceQuantity;
                }
            }
            return result;  
        }
	});
});