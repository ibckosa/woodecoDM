sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (ObjectUI5, TextHandler) {
    "use strict";
    let oNcCodesReader =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.NcCodesReader", {

    });
    oNcCodesReader._oCodes = [];

    oNcCodesReader.readCodes = async function (oController, oPlant, oWorkCenter, oResource) {
        let oCodeReturn = [];

        let oCodesFromBuffer = this._oCodes.find(code=>{ return code.plant === oPlant &&
                                                                code.workCenter === oWorkCenter && 
                                                                code.resource === oResource;  });

        if(!oCodesFromBuffer){
            oCodeReturn = this._readCodesApi(oController, oPlant, oWorkCenter, oResource);
            this._oCodes.push({ plant: oPlant,
                                workCenter: oWorkCenter,
                                resource: oResource,
                                codes: oCodeReturn
            });
        }else{
            oCodeReturn = oCodesFromBuffer.codes;
        }
        return oCodeReturn;
    };

    oNcCodesReader._readCodesApi = async function(oController, oPlant, oWorkCenter, oResource){
        let oReturn = [];
        this._oController = oController;
        this._oPlant = oPlant;
        this._oWorkCenter = oWorkCenter;
        this._oResource = oResource;
        let oCodes = await this._getCodesOfGroup(oResource);
        let oCodesDetail = await this._getCodeDetailsParallel(oCodes);
        let oReasonCodes = await this._getResourceReasonCodeParallel(oCodesDetail);

        for(var i = 0; i < oCodes.length; i++){
            let oCode = oCodes[i];
            let oCodeDetails = oCodesDetail.find( code=>{ return code.code === oCode.code });
            let oReasonCode = oReasonCodes.find( reasonCode => {return reasonCode.oeeCode === oCodeDetails.oeeCode } );
            //let oCodeDetails = await this._getCodeDetails(oCode);

            if(oCodeDetails&&oReasonCode){
                //let oResourceReasonCode = await this._getResourceReasonCode(oCodeDetails.oeeCode, oCode.plant, oResource );
                oReturn.push({
                    lineChecked: false,
                    group: oResource,
                    code: oCode.code,
                    dataType: oCodeDetails.dataType,
                    codeDescription: oCodeDetails.description,
                    quantity: 0,
                    resourceReasonCode: oReasonCode.reasonCode
                });
            }
        }
        return oReturn;
    };

    oNcCodesReader._getCodeDetailsParallel = async function(oCodes){
        
        let oCodePromises = oCodes.map( code => this._getCodeDetails(code) );
        let oReturn = await Promise.all(oCodePromises);
        debugger;
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
                           dataType: "",
                           code: "" };

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
                                oReturn.code = oResponseData[0].code;
                            }catch(error){}
                        }
                        resolve(oReturn);
                    }.bind(this),
                    function (oError, sHttpErrorMessage) {
                        resolve(oReturn);
                        //resolve(oReturn);
                    }.bind(this)
                );
            });
    };
    oNcCodesReader._getResourceReasonCode = async function(oeeCode, oPlant, oResource){
        let oReturn = { oeeCode: "", 
                        reasonCode: "" };

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
                            oReturn.oeeCode = oeeCode;
                            oReturn.reasonCode = oResponseData[0].keyId;
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
    oNcCodesReader._getResourceReasonCodeParallel = async function(oCodes, oPlant, oResource){
        let oReasonCodePromises = oCodes.map( code => this._getResourceReasonCode(code.oeeCode, this._oPlant, this._oResource) );
        let oReturn = await Promise.all(oReasonCodePromises);
        debugger;
        return oReturn;
    };



    return oNcCodesReader;
});