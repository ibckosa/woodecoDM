sap.ui.define([
    "sap/ui/base/Object"
], function (Object) {
    "use strict";
    return Object.extend("ibc.dm.plugins.wcPodToolsProvider.Material", {
        constructor: function(oController, oPlant, oMaterialNumber){
            this._oController = oController;
            this._oMaterialNumber = oMaterialNumber;
            this._oPlant = oPlant;
        },
        readData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "material/v1/materials";

            let oParameters = { plant: this._oPlant,
                                material: this._oMaterialNumber};
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        this._oDetails = oResponseData[0];
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },
        getPackagingMaterial: function(){
            let oReturn = "";

            try{
                let oPackagingMaterial = this._oDetails.customValues.find(customValue => { return customValue.attribute === `${this._oPlant}_RETURN_MATERIAL`});
                oReturn = oPackagingMaterial.value;
            }catch(oError){}
            return oReturn;
        },
        getDescription: function(){
            let oReturn = "";

            try{
                oReturn = this._oDetails.description;
            }catch(oError){}
            return oReturn;
        }
    });
});