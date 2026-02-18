sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.WorkCenter", {
        constructor: function(oController, oPlant, oWorkCenter){
            this._oController = oController;
            this._oPlant = oPlant;
            this.oWorkCenter = oWorkCenter;
        },
        readData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "workcenter/v3/workcenter";

            let oParameters = { plant: this._oPlant,
                                workCenter:  this.oWorkCenter};
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
        getPsa: function(){
            return this._oDetails.productionSupplyArea;
        },
        getResources: function(){
            let result = [];

            try{
                for(const member of this._oDetails.members){
                    if(member.resource){
                        result.push(member.resource.resource);
                    }
                }
            }catch(error){}

            return result;
        }
    });
});