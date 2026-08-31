sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (ObjectUI5, TextHandler) {
    "use strict";
    let oSfc = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.Sfc", {
        constructor: function(oController, oPlant, oSfcNumber, routing, routingVersion){
            this._oController = oController;
            this._oPlant = oPlant;
            this._oSfcNumber = oSfcNumber;
            this._routing = routing;
            this._routingVersion = routingVersion;
        },
        readData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "sfc/v2/sfcdetail";

            let oParameters = { plant: this._oPlant,
                                sfc:  this._oSfcNumber, 
                                includeSfcSteps: true };
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        this._oDetails = oResponseData;
                        if(this._routing && this._routingVersion){
                            let routingExist = this._oDetails.steps.find(step=>{return step.stepRouting.routing === this._routing && step.stepRouting.version === this._routingVersion;});
                            if(routingExist){
                                this._oDetails.steps = this._oDetails.steps.filter(step=>{return step.stepRouting.routing === this._routing && step.stepRouting.version === this._routingVersion;});
                            }
                        }
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },
        getDetails: function(){
            return this._oDetails;
        },
        getSteps: function(){
            return this._oDetails.steps;
        },
        getLastStep: function(){
            return this._oDetails.steps[this._oDetails.steps.length - 1];
        },
        getStepByOperation: function(oOperation){
            return this._oDetails.steps.find(step=>{ return step.operation.operation === oOperation });
        },
        getSfcNumber(){
            return this._oDetails.sfc;
        },
        getBom: function(){
            return this._oDetails.bom;
        },
        getQuantity: function(){
            return this._oDetails.quantity;
        },
        getStatusCode(){
            return this._oDetails.status.code;
        },
        getQuantityInQueue: function(oOperation){
            let oStep = this.getStepByOperation(oOperation);
            return oStep.quantityInQueue;
        },
        getQuantityInWork: function(oOperation){
            let oStep = this.getStepByOperation(oOperation);
            return oStep.quantityInWork;
        },
        getTotalQuan: function(oOperation){
            let oReturn = 0;
            let oStep = this.getStepByOperation(oOperation);
            if(oStep){
                oReturn = oStep.quantityDone + oStep.quantityInQueue + oStep.quantityInWork + oStep.quantityRejected + oStep.quantityScrapped;
            }

            return oReturn;
        },

        getDoneQuanOfOperation: function(oOperation){
            let oReturn = 0;
            let oStep = this.getStepByOperation(oOperation);
            if(oStep){
                oReturn = oStep.quantityDone;
            }

            return oReturn;
        },
        getIsMultiOperation: function(){
            return this._oDetails.steps.length > 1;
        },
        checkIsLastOperation(operation){
            let lastOperation = this._oDetails.steps[this._oDetails.steps.length - 1];
            return lastOperation.operation.operation === operation;
        },
        invalidate: async function(){
            var sUrl = this._oController.getPublicApiRestDataSourceUri() + `sfc/v1/sfcs/invalidate?plant=${this._oPlant}&sfc=${this._oSfcNumber}`;
            var oRequestParameters = { };

    
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPatchRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );
            });
        },
        complete: async function(operationActivity, resource, quantity){
            var url = this._oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/complete";
            var paramteres = { plant: this._oPlant,
                               sfcs: [this._oSfcNumber],
                               operation: operationActivity,
                               resource: resource };
            if(quantity){
                paramteres.quantity = quantity;
            }
            return await new Promise((resolve,reject)=>{
                url = this._oController.ajaxPostRequest(url, paramteres,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError) => { 
                        oError.sendAlert = true;
                        reject(oError);
                    }
                );
            });
        },
        getStatus: function(){  
            return this._oDetails.status.code;
        },
        checkUncollectedParameters: async function(operationActivity, resource){
            var sUrl = this._oController.getPublicApiRestDataSourceUri() + "datacollection/v1/uncollectedParameters";
            var oRequestParameters = {
                plant: this._oPlant,
                sfc: this._oSfcNumber,
                operation: operationActivity,
                resource: resource };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oRequestParameters,
                    oResponseData => {
                        if(oResponseData.uncollectedParams.length>0){
                            let textHandler = new TextHandler();
                            reject({ message: textHandler.getText("error.completeOrder.uncollectedParameters"),
                                     displayType: "POPUP" });
                        }
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }
                );
            });
        }
    
    });

    oSfc.splitSfc = async function(oController, oPlant, oSfc, oQuan, allowOverproduction=false){
        var sUrl = oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/split";
        var oRequestParameters = { plant: oPlant,
                                   sfc: oSfc,
                                   newSfcs: [{quantity: oQuan}],
                                   allowOverproduction: allowOverproduction };

        return await new Promise((resolve,reject)=>{
            oController.ajaxPostRequest(sUrl, oRequestParameters,
                (oResponseData) => {resolve(oResponseData.newSfcs[0]);},
                (oError) => { 
                    reject(oError); 
                }
            );
        });
    };

    oSfc.signOffSfcs = async function(oController, oPlant, oSfcs, oOperation, oResource){
        var sUrl = oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/signoff";
        var oRequestParameters = { plant: oPlant,
                                   sfcs: oSfcs,
                                   operation: oOperation,
                                   resource: oResource };

        return await new Promise((resolve,reject)=>{
            oController.ajaxPostRequest(sUrl, oRequestParameters,
                (oResponseData) => {
                    resolve();
                },
                (oError, sHttpErrorMessage) => { 
                    reject(oError);
                }
            );
        });
    };

    oSfc.mergeSfcs = async function(oController, oPlant, oSfcParent, oSfcs){
        var sUrl = oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/merge";
        var oRequestParameters = { plant: oPlant,
                                   parentSfc: oSfcParent,
                                   sourceSfcs: oSfcs,
                                   copyDataCollectionData: true };

        return await new Promise((resolve,reject)=>{
            oController.ajaxPostRequest(sUrl, oRequestParameters,
                (oResponseData) => {resolve();},
                (oError, sHttpErrorMessage) => { reject(oError); }
            );
        });
    };

    oSfc.startSfcs = async function(oController, oPlant, oSfcs, oOperation, oResource){
        var sUrl = oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/start";
        var oRequestParameters = { plant: oPlant,
                                   sfcs: oSfcs,
                                   resource: oResource,
                                   operation: oOperation };

        return await new Promise((resolve,reject)=>{
            oController.ajaxPostRequest(sUrl, oRequestParameters,
                (oResponseData) => {resolve();},
                (oError, sHttpErrorMessage) => { reject(oError); }
            );
        });
    };

    oSfc.getSfcsList = async function(oController, oParams){
        let oRequest = { plant: this._oReceiptParameters.plant,
                         workCenter: this._oReceiptParameters.workCenter,
                         "filter.operation": this._oReceiptParameters.operationActivity,
                         "filter.order": this._oReceiptParameters.order };
        let oSfcs = this.getSfcsListApi(oController, oRequest);
    }
// commented 22.01.2026 - to delete after 22.02.2026
    // oSfc.getSfcsListApi = async function(oController, oRequest, oPage = 0){
    //     let sUrl = oController.getPublicApiRestDataSourceUri()  + "sfc/v1/worklist/sfcs";

    //     let oParameters = { plant: this._oReceiptParameters.plant,
    //                         workCenter: this._oReceiptParameters.workCenter,
    //                         "filter.operation": this._oReceiptParameters.operationActivity,
    //                         "filter.order": this._oReceiptParameters.order 
    //                         };
    //     return await  new Promise((resolve,reject)=>{
    //         oController.ajaxGetRequest(sUrl, oParameters,
    //             (oResponseData) => {
    //                 resolve(oResponseData);
    //             },
    //             (oError, sHttpErrorMessage) => {
    //                 reject(oError);
    //             }
    //         );
    //     });
    // }
    return oSfc;
});