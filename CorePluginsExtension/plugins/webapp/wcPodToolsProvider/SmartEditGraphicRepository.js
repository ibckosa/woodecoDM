sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/SmartEditGraphic"
], function (Object, SmartEditGraphic) {
    "use strict";
    let oSmartEditGraphicRepository =  Object.extend("ibc.dm.plugins.wcPodToolsProvider.SmartEditGraphicRepository", {

    });
    oSmartEditGraphicRepository._oGraphic = [];

    oSmartEditGraphicRepository.getGraphic = async function(oController, oGraphicId){
        let oGraphic;

        let oGraphicBuffer = this._getGraphicBuffer(oGraphicId);

        if(!oGraphicBuffer){
            oGraphic = new SmartEditGraphic(oController, oGraphicId);
            await oGraphic.readData();
            this._oGraphic.push({   graphicId: oPlant,
                                    instance: oGraphic });
        }else{
            oGraphic = oGraphicBuffer.instance;
        }

        return oGraphic;
    };
    oSmartEditGraphicRepository._getGraphicBuffer =  function(oGraphicId){
        return this._oGraphic.find(graphics=>{ return graphics.graphicId === oGraphicId });
    };


    return oSmartEditGraphicRepository;
});