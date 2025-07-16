sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/WorkCenter"
], function (ObjectUI5, WorkCenter) {
    "use strict";
    let oWorkCenterRepository =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.WorkCenterRepository", {
        constructor: function(){

        }
    });
    oWorkCenterRepository._oWorkCenters = [];

    oWorkCenterRepository.getInstance =  async function(oController, oPlant, oWorkCenterNumber ){f
        let oWorkCenter;
        
        let oWorkCenterRepo = this._oWorkCenters.find(workCenter=>{ return workCenter.plant === oPlant && workCenter.workCenterNumber === oWorkCenterNumber  });
        if(!oWorkCenterRepo){
            oWorkCenter = await this.readWorkCenterApi(oController, oPlant, oWorkCenterNumber);
            oWorkCenter._oWorkCenters.push({
             plant: oPlant,
             workCenterNumber: oWorkCenter,
             instance: oWorkCenter
            })
        }else{
            oWorkCenter = oWorkCenterRepo.instance;
        }

        return oWorkCenter;
    };

    oWorkCenterRepository.readWorkCenterApi = async function(oController, oPlant, oWorkCenterNumber){
        let oWorkCenter = new WorkCenter(oController, oPlant, oWorkCenterNumber);
        await oWorkCenter.readData();
        return oWorkCenter;
    };

    oWorkCenterRepository.ReadWcBypassBuffer = async function(oController, oPlant, oWorkCenterNumber ){
        return await this.readWorkCenterApi(oController, oPlant, oWorkCenterNumber);
    }

    return oWorkCenterRepository;
});