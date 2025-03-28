sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (ObjectUI5, TextHandler) {
    "use strict";
    let oNcCodesReader =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.NcCodesReader", {

    });


    oNcCodesReader.readCodes = async function (oController, oPlant, oWorkCenter, oResource) {
        let oReturn = [];
        this._oController = oController;
        this._oPlant = oPlant;
        this._oWorkCenter = oWorkCenter;
        this._oResource = oResource;
        let oCodes = await this._getCodesOfGroup(oResource);

        for(var i = 0; i < oCodes.length; i++){
            let oCode = oCodes[i];
            let oCodeDetails = await this._getCodeDetails(oCode);
            let oResourceReasonCode = await this._getResourceReasonCode(oCodeDetails.oeeCode, oCode.plant, oResource );


            oReturn.push({
                lineChecked: false,
                group: oResource,
                code: oCode.code,
                dataType: oCodeDetails.dataType,
                codeDescription: oCodeDetails.description,
                quantity: 0,
                resourceReasonCode: oResourceReasonCode
            });
        }
        return oReturn;

    };
    oNcCodesReader._getCodesOfGroup = async function () {
        let oReturn = [];

        let sUrl = this._oController.getPublicApiRestDataSourceUri() + "nonconformancegroup/v1/nonconformancegroups";
        let oRequestParameters = { plant: this._oController.getPodController().getUserPlant(),
                                    group: this._oResource };
       return await new Promise((resolve,reject)=>{
        this._oController.ajaxGetRequest(sUrl, oRequestParameters,
                (oResponseData)=>{
                    if(oResponseData.length>0){
                        oReturn = oResponseData[0].codes;
                    }
                    resolve(oReturn);
                },
                (oError, sHttpErrorMessage) => {
                    reject(oError);
                }
            );
        });
    };
    oNcCodesReader._getCodeDetails = async function(oCode) {
            let oReturn = {description: "",
                           oeeCode: "",
                           dataType: ""
            };

            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "nonconformancecode/v1/nonconformancecodes";
            let oRequestParameters = { plant: oCode.plant,
                                        code: oCode.code, };

           return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oRequestParameters,
                    function (oResponseData) {
                        if(oResponseData.length>0){
                            try{
                                oReturn.description = oResponseData[0].description;
                                oReturn.dataType = oResponseData[0].dataType;
                                let oCustomField = oResponseData[0].customData.find((customField) => customField.attribute === "REASON_CODE");
                                oReturn.oeeCode = oCustomField.value;
                            }catch(error){}
                        }
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        resolve(oReturn);
                    }.bind(this)
                );
            });
    };
    oNcCodesReader._getResourceReasonCode = async function(oeeCode, oPlant, oResource){
        let oReturn = "";

        let sUrl = this._oController.getPublicApiRestDataSourceUri() + "resourceReasonCode/v1/resourceReasonCodes";
        let oRequestParameters = { plant: oPlant,
                                   machineCode: oeeCode,
                                   resource: oResource };

        if(oeeCode===""){return oReturn;}

        return await new Promise((resolve,reject)=>{
            this._oController.ajaxGetRequest(sUrl, oRequestParameters,
                function (oResponseData) {
                    if(oResponseData.length>0){
                        try{
                            oReturn = oResponseData[0].keyId;
                        }catch(error){}
                    }
                    resolve(oReturn);
                }.bind(this),
                function (oError, sHttpErrorMessage) {
                    resolve(oReturn);
                }.bind(this)
            );
        });
    };


    return oNcCodesReader;
});