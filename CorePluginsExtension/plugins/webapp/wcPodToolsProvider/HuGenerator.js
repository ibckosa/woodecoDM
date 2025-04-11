sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let oHuGenerator = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.HuGenerator", {
    });

    oHuGenerator.generate = async function(oController ,oMaterial, oMaterialVersion, oPlant){
        let sUrl = oController.getPublicApiRestDataSourceUri() + "/numbering/v1/identifiers";
        let oRequestParameters = { plant: oPlant,
                                   eventName: "PACKING_UNIT_NUMBER",
            objectsToMatch: {    MATERIAL_NAME: oMaterial,
                                 MATERIAL_VERSION : oMaterialVersion,
                                 ORDER_TYPE: "Production" } };

            return await new Promise((resolve,reject)=>{
                oController.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve(oResponseData.identifiers[0]);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
    };
    return oHuGenerator;

});