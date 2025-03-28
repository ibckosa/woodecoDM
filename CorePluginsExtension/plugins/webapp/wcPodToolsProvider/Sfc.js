sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.Sfc", {
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
        getStepByOperation: function(oOperation){
            return this._oDetails.steps.find(step=>{ return step.operation.operation === oOperation });
        },
        getBom: function(){
            return this._oDetails.bom;
        },
        getQuantity: function(){
            return this._oDetails.quantity;
        }
    });
});