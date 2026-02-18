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

    oSfcRepository.getInstance =  async function(oController, oPlant, oSfcNumber, routing, routingVersion){
        let oSfc;
        
        let oSfcRepo = oSfcRepository._oSfcs.find(sfc=>{ return sfc.plant === oPlant && sfc.sfcNumber === oSfcNumber && routing === routing &&  routingVersion === routingVersion });
        if(!oSfcRepo){
            oSfc = await this.readSfcApi(oController, oPlant, oSfcNumber, routing, routingVersion);
            oSfcRepository._oSfcs.push({
             plant: oPlant,
             sfcNumber: oSfcNumber,
             routing: routing,
             routingVersion: routingVersion,
             instance: oSfc
            });
        }else{
            oSfc = oSfcRepo.instance;
        }

        return oSfc;
    };

    oSfcRepository.readSfcApi = async function(oController, oPlant, oSfcNumber, routing, routingVersion){
        let oSfc = new Sfc(oController, oPlant, oSfcNumber, routing, routingVersion);
        await oSfc.readData();
        return oSfc;
    };

    oSfcRepository.ReadSfcBypassBuffer = async function(oController, oPlant, oSfcNumber, routing, routingVersion, raiseErrorNotFound){
        if(raiseErrorNotFound){
            return await this.readSfcApi(oController, oPlant, oSfcNumber, routing, routingVersion);
        }else{
            try{
                let sfcInstance = await this.readSfcApi(oController, oPlant, oSfcNumber, routing, routingVersion);
                return sfcInstance;
            }catch(error){}
        }
        
    };
// commented 22.01.2026 - to delete after 1 month
    // oSfcRepository.readSfcForOrderApi = async function(oController, oPlant, oOrderNumber, oWorkCenterNumber){
    //     let sUrl = this._oController.getPublicApiRestDataSourceUri() + "sfc/v1/worklist/sfcs";

    //     let oParameters = { plant: oPlant,
    //                         order:  oOrderNumber,
    //                         workCenter: oWorkCenterNumber,
    //                         allSfcSteps: true };
    //     return await new Promise((resolve,reject)=>{
    //         this._oController.ajaxGetRequest(sUrl, oParameters,
    //             (oResponseData) => {
    //                 resolve(oResponseData);
    //             },
    //             (oError, sHttpErrorMessage) => {
    //                 reject(oError);
    //             }   
    //         );
    //     });
    // };
    oSfcRepository.getSfcsInstances = async function(controller, plant, sfcs, routing, routingVersion){
        let sfcsDetailsPromises = [];
        for(const sfc of sfcs){
            sfcsDetailsPromises.push(this.ReadSfcBypassBuffer(controller, plant, sfc, routing, routingVersion)); 
        }

        let sfcsInstances = await Promise.all(sfcsDetailsPromises);
        return sfcsInstances;
    };


    return oSfcRepository;
});