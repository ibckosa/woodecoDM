sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let oSmartEditGraphic =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.SmartEditGraphic", {
        constructor: function(oController, oGraphicId){
            this._oController = oController;
            this._oGraphicId = oGraphicId;
        },

        readData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "/pe/api/v1/process/processDefinitions/start?key=REG_2458f8f9-fb5e-46a1-b47d-5f43e606a2ee";

            let oParameters = { decorId: this._oGraphicId };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        debugger;
                        this._oDetails = oResponseData;
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        debugger;
                        reject(oError);
                    }   
                );

            });
        }
    });


    return oSmartEditGraphic;
});