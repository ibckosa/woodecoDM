sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5, Bom) {
    "use strict";
    let oSfcComponentsReader =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.SfcComponentsReader", {
    });

    oSfcComponentsReader.readComponents = async function(oController, oSfc, oOperation){
        let sUrl = oController.getAssemblyDataSourceUri() + "sfc/components/find";
        let oParameters = { operations: [oOperation],
                            sfcs: [oSfc]  };
        return await new Promise( (resolve,reject)=>{
            oController.ajaxPostRequest(sUrl, oParameters,
                (oResponseData)=>{ resolve(oResponseData); },
                (oError, oErrorMessage)=>{ reject(oError); });
        });
    };
    return oSfcComponentsReader;
});