sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let oSfc = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.Sfc", {
        constructor: function(oController, oPlant, oSfcNumber){
            this._oController = oController;
            this._oPlant = oPlant;
            this._oSfcNumber = oSfcNumber;
        },
        readData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcdetail";

            let oParameters = { plant: this._oPlant,
                                sfc:  this._oSfcNumber};
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        this._oDetails = oResponseData;
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
        getSfcNumber(){
            return this._oDetails.sfc;
        }
    });

    oSfc.splitSfc = async function(oController, oPlant, oSfc, oQuan){
        var sUrl = oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/split";
        var oRequestParameters = { plant: oPlant,
                                   sfc: oSfc,
                                   newSfcs: [{quantity: oQuan}] };

        return await new Promise((resolve,reject)=>{
            oController.ajaxPostRequest(sUrl, oRequestParameters,
                (oResponseData) => {resolve(oResponseData.newSfcs[0]);},
                (oError, sHttpErrorMessage) => { reject(oError); }
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
                                   sourceSfcs: oSfcs };

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

    return oSfc;
});