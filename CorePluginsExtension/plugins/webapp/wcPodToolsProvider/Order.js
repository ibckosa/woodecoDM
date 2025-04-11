sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.Order", {
        constructor: function(oController, oPlant, oOrderNumber){
            this._oController = oController;
            this._oPlant = oPlant;
            this._oOrderNumber = oOrderNumber;
        },
        readData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "/order/v1/orders";
            var oParameters = { order: this._oOrderNumber,
                                plant: this._oPlant };
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
        getPutawayStorageLocation(){
            return this._oDetails.putawayStorageLocation;
        }

    });
});