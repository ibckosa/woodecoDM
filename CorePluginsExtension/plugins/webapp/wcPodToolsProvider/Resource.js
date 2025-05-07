sap.ui.define([
    "sap/ui/base/Object"
], function (Object) {
    "use strict";
    return Object.extend("ibc.dm.plugins.wcPodToolsProvider.Resource", {
        constructor: function(oController, oPlant, oResourceNumber){
            this._oController = oController;
            this._oResourceNumber = oResourceNumber;
            this._oPlant = oPlant;
        },
        readResourceData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "resource/v2/resources";

            let oParameters = { plant: this._oPlant,
                                resource: this._oResourceNumber};
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
        getResourceErpId: function(){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "WM_BIN_TYPE"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getNcCodeType: function(){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "NC_CODE_TYPE"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getFunctionalLocation(){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "FUNCTIONAL_LOCATION"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getQ1Scheme(){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "Q1_SCHEME"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getPrinterId(){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "PRINTER_ID"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        }
    });
});