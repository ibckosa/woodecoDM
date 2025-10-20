sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "sap/dm/dme/model/AjaxUtil",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "sap/m/Dialog",
    "sap/m/library",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "ibc/dm/plugins/wcPodToolsProvider/Sfc",
    "ibc/dm/plugins/wcPodToolsProvider/DataCollectionSaver",
    "ibc/dm/plugins/wcPodToolsProvider/IssuesManagerV2"
], function (ObjectUI5, ErrorHandler, AjaxUtil, TextHandler, Dialog, mobileLibrary, ResourceRepository, OrderRepository, SfcRepository, Sfc, DataCollectionSaver, IssuesManagerV2
) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.SfcQ23", {
        constructor: function(oController, Q23Parameters){
            this._oController = oController;
            this._oParameters = Q23Parameters;
            this._oErrorHandler = new ErrorHandler(this._oController);
            this._oTextHandler = new TextHandler();

            //quantity <--- to Q2/Q3
            //leftQuantity
            //quantityInWork
            //plant
            //work center
            //resource
            //order
            //sfc
            //operationActivity
            //isMultiOrder
            //isLastOperation
            //isCommentRequired
            //nonconformanceCode
            //nonconformanceCodeDescription
            //resourceReasonCode
            //oeeCode
            //uom
            //routing
            //routingVersion
            //totalRegisteredQ23

        },

        executeSO: async function(){

        },
        executeMO: async function(){
            this._oResource = await ResourceRepository.getResourceInstance(this._oController, this._oParameters.plant, this._oParameters.resource);
            this._oOrder = await OrderRepository.readOrder(this._oController, this._oParameters.plant, this._oParameters.order);
            this._sfc = await SfcRepository.ReadSfcBypassBuffer(this._oController, this._oParameters.plant, this._oParameters.sfc, this._oParameters.routing, this._oParameters.routingVersion);
            let automaticIssues = this._oResource.getConsumptionMode()==="AUTOMATIC";

            this._executeCheksMO();
            
            let oComment = await this._getComment(this._oParameters.isCommentRequired);

            let issueManager;
            if(automaticIssues){
                issueManager = new IssuesManagerV2(this._oController, { sfcNumber: this._oParameters.sfc,
                                                                        orderNumber: this._oParameters.order,
                                                                        operation: this._oParameters.operationActivity,
                                                                        plant: this._oParameters.plant,
                                                                        workCenter: this._oParameters.workCenter,
                                                                        resource: this._oParameters.resource,
                                                                        salesOrder: this._oOrder.getCustomerOrder(),
                                                                        salesOrderItem: this._oOrder.getCustomerOrderItem(),
                                                                        mode: "Q2",
                                                                        q2Quantity: this._oParameters.totalRegisteredQ23 });
                await issueManager.initializeManager();
                await issueManager.checkQuantityAvailable(this._oParameters.quantity);
            }
            
            this._oParameters.sfc = await Sfc.splitSfc(this._oController, this._oParameters.plant, this._oParameters.sfc , this._oParameters.quantity, true);
            let oNonconformanceId =  await this._logNonconformance(oComment);

            if(this._oResource.getNcCodeType() === "Q3"){
                await this._closeNonconformance(oNonconformanceId);
            }

            
            await this._executeSfcScrap();
            if(automaticIssues){
                await issueManager.executeIssues(this._oParameters.quantity, this._oParameters.sfc);
            }
            await this._saveDataCollection(issueManager);


            this._oController.showSuccessMessage(this._oTextHandler.getText("success.q23.ProccessFinished"), true, true);
            // this._oController.getPodSelectionModel().setInputValue(this._oParameters.sfc);
            // this._oController.publish("_onQuantityChangeIncomingEvent", { sendToAllPages: true });    
            // this._oController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
        },
        

        _executeCheksMO: function(){
            if(this._oParameters.quantity>this._sfc.getQuantityInWork(this._oParameters.operationActivity)){
                this._oErrorHandler.throwError("error.q23.sfcNotInWork");
            }
        },

        _getComment: async function (isCommentRequired = false) {
            return await new Promise((resolve, reject) => {
                this._resolveComment = resolve;
                this._isCommentRequired = isCommentRequired;
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._oTextHandler.getText("labels.q23.commentTitleDialog"),
                        content: new sap.m.TextArea({ width: "30rem", rows: 12, id: "commentTextArea" }),
                        beginButton: new sap.m.Button({
                            type: mobileLibrary.ButtonType.Emphasized,
                            text: this._oTextHandler.getText("labels.q23.dialogAcceptButton"),
                            press: async function () {
                                let oReturn = "";
                                debugger;
                                try {
                                    let oTextArea = this.oApproveDialog.getContent()[0];
                                    oReturn = oTextArea.getValue();
                                    if(oReturn.length === 0 && this._isCommentRequired){
                                        this._oErrorHandler.throwError("error.q23.emptyComment");
                                    }
                                    oTextArea.setValue("");
                                    this.oApproveDialog.close();
                                    this.oApproveDialog.destroy();
                                    this._resolveComment(oReturn);
                                } catch (oError) { 
                                    this._oErrorHandler.handleError(oError) 
                                }
                            }.bind(this)
                        })
                    });
                }
                this.oApproveDialog.open();
            });
        },
        _executeSfcScrap: async function(){
            var sUrl = this._oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/scrap";
            // var oRequestParameters = {
            //     plant: this._oParameters.plant,
            //     shopOrder: this._oParameters.order,
            //     sfc: this._oParameters.sfc,
            //     operationActivity: this._oParameters.operationActivity,
            //     scrapQuantity: this._oParameters.quantity,
            //     scrapQuantityUnit: this._oOrder.getInternalUom(),
            //     workCenter: this._oParameters.workCenter,
            //     reasonCodeKey: this._oParameters.resourceReasonCode
            // }
            var oRequestParameters = {
                plant: this._oParameters.plant,
                operation: this._oParameters.operationActivity,
                quantity: this._oParameters.quantity,
                resource: this._oParameters.resource,
                sfcs: [ this._oParameters.sfc ],
                reasonCodeKey: this._oParameters.resourceReasonCode
            };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oRequestParameters,
                    oResponseData => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }
                );
            });
        },
        _closeNonconformance: async function(oNonconformanceId){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "nonconformance/v1/close";

            let oParameters = { plant: this._oParameters.plant,
                                id: oNonconformanceId };
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    oError=>{
                        reject(oError);
                    }   
                );

            });
        },
        _logNonconformance: async function(oComment){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "nonconformance/v1/log";

            let oRequestParameters = {
                code: this._oParameters.nonconformanceCode,
                dataFields: [
                    {
                       key: "COMMENTS",
                       value: oComment
                    },
                    {
                        key: "ITEM_NUMBER",
                        value: this._oParameters.itemNumber
                     }
                 ],
                plant: this._oParameters.plant,
                workCenter: this._oParameters.workCenter,
                resource: this._oParameters.resource,
                sfcs: [this._oParameters.sfc],
                quantity: this._oParameters.quantity };

                return await new Promise((resolve,reject)=>{
                    this._oController.ajaxPostRequest(sUrl, oRequestParameters,
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
        _saveDataCollection: async function(issueManager){
            let parameterValues = [];

            let guid = crypto.randomUUID();
            let date = new Date();
            debugger;
            parameterValues.push({ name: "GUID",
                                   comment: guid,
                                   value: guid });

            parameterValues.push({ name: "DATE_CREATED",
                                   comment: guid,
                                   value: date.toJSON() });

            parameterValues.push({ name: "Q1/Q3",
                                   comment: guid,
                                   value: "Q3" });

            parameterValues.push({ name: "QUANTITY",
                                   comment: guid,
                                   value: `${this._oParameters.quantity}` });

            parameterValues.push({ name: "UOM",
                                   comment: guid,
                                   value: this._oOrder.getInternalUom() });

            parameterValues.push({ name: "MATERIAL",
                                   comment: guid,
                                   value: this._oParameters.material });                                   
                                   
            parameterValues.push({ name: "Q3_CODE",
                                   comment: guid,
                                   value: this._oParameters.oeeCode });

            parameterValues.push({ name: "NC_CODE",
                                   comment: guid,
                                   value: this._oParameters.nonconformanceCode });

            parameterValues.push({ name: "NC_CODE_DESCRIPTION",
                                   comment: guid,
                                   value: this._oParameters.nonconformanceCodeDescription });

            parameterValues.push({ name: "USER",
                                   comment: guid,
                                   value: this._oController.getUserId() });

            parameterValues.push({ name: "CANCELLED",
                                   comment: guid,
                                   value: false });

            parameterValues.push({ name: "SALES_ORDER",
                                   comment: guid,
                                   value: this._oParameters.salesOrder });

            parameterValues.push({ name: "SALES_ORDER_ITEM",
                                   comment: guid,
                                   value: this._oParameters.salesOrderItem });

            parameterValues.push({ name: "ITEM_NO",
                                   comment: guid,
                                   value: `${this._oParameters.itemNumberErp}` });

            
            let issuesAsString  = [];
            //let issueAsString  = "";
            if(issueManager){
                let issuesCreated = issueManager.getCreatedIssues();
                for(const issue of issuesCreated){
                    let issueAsString = Object.entries(issue)
                                            .map(([key, value]) => `${key}:${value}`)
                                            .join('||');
                    issuesAsString.push(issueAsString);
                    parameterValues.push({ name: `CONSUMPTION`,
                                        comment: guid,
                                        value: issueAsString });
                } 
            }
                 

            await DataCollectionSaver.saveProductionDC(
                this._oController,
                {
                    plant: this._oParameters.plant,
                    sfc: this._oParameters.sfc,
                    resource: this._oParameters.resource,
                    operation: this._oParameters.operationActivity,
                    productionProcessType: "Q3",
                    q3Code: this._oParameters.oeeCode,
                    quantity: `${this._oParameters.quantity}`,
                    uom: this._oOrder.getInternalUom(),
                    material: this._oParameters.material,
                    itemNo: this._oParameters.itemNumberErp,
                    salesOrder: this._oParameters.salesOrder, 
                    saledOrderItem: this._oParameters.salesOrderItem ,
                    hu: "",
                    cancelled: false,
                    user: this._oController.getUserId(),
                    consumption: issuesAsString,
                    dateCreated: date.toJSON(),
                    processStart: "",
                    processStop: "",
                    ncCode: this._oParameters.nonconformanceCode,
                    ncCodeDescription: this._oParameters.nonconformanceCodeDescription,
                    guid: guid
                }

            );

        }

    });
});