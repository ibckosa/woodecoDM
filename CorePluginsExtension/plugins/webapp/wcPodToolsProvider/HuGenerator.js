sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (ObjectUI5, TextHandler) {
    "use strict";
    let oHuGenerator = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.HuGenerator", {
    });

    oHuGenerator.generate = async function(oController ,oMaterial, oMaterialVersion, oPlant){
        let oTextHandler = new TextHandler();
        let sUrl = oController.getPublicApiRestDataSourceUri() + "/numbering/v1/identifiers";
        let oRequestParameters = { plant: oPlant,
                                   eventName: "PACKING_UNIT_NUMBER",
            objectsToMatch: {    MATERIAL_NAME: oMaterial,
                                 MATERIAL_VERSION : oMaterialVersion,
                                 ORDER_TYPE: "Production" } };

            return await new Promise((resolve,reject)=>{
                oController.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        if(!oResponseData.identifiers||!oResponseData.identifiers[0]){
                            reject({ errorMessage: oTextHandler.getText("error.q1.generateHu"),
                                     apiName: "numbering/v1/identifiers",
                                     sendAlert: true });
                            return;
                        }
                        resolve(oResponseData.identifiers[0]);
                    },
                    (oError, sHttpErrorMessage) => {
                        oError.sendAlert = true; 
                        reject(oError);
                    }   
                );

            });
    };
    return oHuGenerator;

});