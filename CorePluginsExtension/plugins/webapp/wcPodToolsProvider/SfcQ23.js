sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "sap/dm/dme/model/AjaxUtil",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "sap/m/Dialog",
    "sap/m/library",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository"
], function (ObjectUI5, ErrorHandler, AjaxUtil, TextHandler, Dialog, mobileLibrary, ResourceRepository, OrderRepository
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
            //resourceReasonCode
            //uom

        },

        executeSO: async function(){

        },
        executeMO: async function(){
            this._oResource = await ResourceRepository.getResourceInstance(this._oController, this._oParameters.plant, this._oParameters.resource);
            this._oOrder = await OrderRepository.readOrder(this._oController, this._oParameters.plant, this._oParameters.order);

            this._executeCheksMO();
            let oComment = await this._getComment(this._oParameters.isCommentRequired);
            let oNonconformanceId =  await this._logNonconformance(oComment);

            if(this._oResource.getNcCodeType() === "Q3"){
                await this._closeNonconformance(oNonconformanceId);
            }

            await this._executeSfcScrap();
            this._oController.showSuccessMessage(this._oTextHandler.getText("success.q23.ProccessFinished"), true, true);
            this._oController.getPodSelectionModel().setInputValue(this._oParameters.sfc);
            this._oController.publish("_onQuantityChangeIncomingEvent", { sendToAllPages: true });    
            this._oController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
            // if(this._oParameters.leftQuantity>this._oParameters.quantity){
            //     this._oController.getPodSelectionModel().setInputValue(this._oParameters.sfc);
            //     this._oController.publish("_onQuantityChangeIncomingEvent", { sendToAllPages: true });    
            //     this._oController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
            // }else{
            //     this._oController.getPodSelectionModel().setInputValue("");
            //     this._oController.getPodSelectionModel().clearSelections();
            //     this._oController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
            //     this._oController.onClosePress();
            //     this._oController.navigateToMainPage();
            // }
        },
        

        _executeCheksMO: function(){
            // if(this._oParameters.quantity>this._oParameters.leftQuantity){
            //     this._oErrorHandler.throwError("error.q23.sfcNotEnoughQuantity");
            // }

            if(this._oParameters.quantity>this._oParameters.quantityInWork){
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
        _executeSfcScrap: async function(oScrapQuantity, oSfcDetails, oResourceReasonCode){
            var sUrl = this._oController.getPublicApiRestDataSourceUri() + "quantityConfirmation/v1/confirm";
            // var oRequestParameters = {
            //     plant: oSfcDetails.plant,
            //     operation: oSfcDetails.operation,
            //     quantity: oScrapQuantity,
            //     resource: oSfcDetails.resource,
            //     sfcs: [ oSfcDetails.sfc ],
            //     reasonCodeKey: oResourceReasonCode   
            // };

            var oRequestParameters = {
                plant: this._oParameters.plant,
                shopOrder: this._oParameters.order,
                sfc: this._oParameters.sfc,
                operationActivity: this._oParameters.operationActivity,
                scrapQuantity: this._oParameters.quantity,
                scrapQuantityUnit: this._oOrder.getInternalUom(),
                workCenter: this._oParameters.workCenter,
                reasonCodeKey: this._oParameters.resourceReasonCode
            }

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
        }

    });
});