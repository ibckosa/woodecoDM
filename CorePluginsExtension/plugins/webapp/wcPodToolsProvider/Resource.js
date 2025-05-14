sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler"
], function (Object, ErrorHandler) {
    "use strict";
    return Object.extend("ibc.dm.plugins.wcPodToolsProvider.Resource", {
        constructor: function(oController, oPlant, oResourceNumber){
            this._oController = oController;
            this._oResourceNumber = oResourceNumber;
            this._oPlant = oPlant;
            this._oErrorHandler = new ErrorHandler(this._oController);
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
        getResourceErpId: function(errorWhenEmpty = false){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "WM_BIN_TYPE"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getNcCodeType: function(errorWhenEmpty = false){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "NC_CODE_TYPE"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getFunctionalLocation(errorWhenEmpty = false){
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
        getPrinterId(errorWhenEmpty = false){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "PRINTER_ID"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getConsumptionMode(errorWhenEmpty = false){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "CONSUMPTION_MODE"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}

            if(errorWhenEmpty&&oReturn===""){
                this._oErrorHandler.throwErrorPopup("error.resource.noConsumptionMode");
            }
            return oReturn.toUpperCase();
        }
    });
});