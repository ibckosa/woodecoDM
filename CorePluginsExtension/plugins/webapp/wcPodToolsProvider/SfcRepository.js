sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/Sfc"
], function (ObjectUI5, Sfc) {
    "use strict";
    let oSfcRepository =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.SfcRepository", {
        constructor: function(){
        }
    });
    oSfcRepository._oSfcs = [];

    oSfcRepository.getInstance =  async function(oController, oPlant, oSfcNumber ){
        let oSfc;
        
        let oSfcRepo = oSfcRepository._oSfcs.find(sfc=>{ return sfc.plant === oPlant && sfc.sfcNumber === oSfcNumber  });
        if(!oSfcRepo){
            oSfc = await this.readSfcApi(oController, oPlant, oSfcNumber);
            oSfcRepository._oSfcs.push({
             plant: oPlant,
             sfcNumber: oSfcNumber,
             instance: oSfc
            });
        }else{
            oSfc = oSfcRepo.instance;
        }

        return oSfc;
    };

    oSfcRepository.readSfcApi = async function(oController, oPlant, oSfcNumber){
        let oSfc = new Sfc(oController, oPlant, oSfcNumber);
        await oSfc.readData();
        return oSfc;
    };

    oSfcRepository.ReadSfcBypassBuffer = async function(oController, oPlant, oSfcNumber ){
        return await this.readSfcApi(oController, oPlant, oSfcNumber);
    };

    oSfcRepository.readSfcForOrderApi = async function(oController, oPlant, oOrderNumber, oWorkCenterNumber){
        let sUrl = this._oController.getPublicApiRestDataSourceUri() + "sfc/v1/worklist/sfcs";

        let oParameters = { plant: oPlant,
                            order:  oOrderNumber,
                            workCenter: oWorkCenterNumber,
                            allSfcSteps: true };
        return await new Promise((resolve,reject)=>{
            this._oController.ajaxGetRequest(sUrl, oParameters,
                (oResponseData) => {
                    resolve(oResponseData);
                },
                (oError, sHttpErrorMessage) => {
                    reject(oError);
                }   
            );
        });
    };


    return oSfcRepository;
});