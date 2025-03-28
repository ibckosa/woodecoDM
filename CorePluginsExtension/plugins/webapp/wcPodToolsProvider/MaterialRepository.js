sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/Material"
], function (Object, Material) {
    "use strict";
    let oMaterialRepository =  Object.extend("ibc.dm.plugins.wcPodToolsProvider.MaterialRepository", {

    });
    oMaterialRepository._oMaterials = [];

    oMaterialRepository.getMaterialInstance = async function(oController, oPlant, oMaterialNumber){
        let oMaterial;

        let oMaterialBuffer = this._getMaterialBuffer(oPlant, oMaterialNumber);

        if(!oMaterialBuffer){
            oMaterial = new Material(oController, oPlant, oMaterialNumber);
            await oMaterial.readData();
            this._oMaterials.push({ plant: oPlant,
                                     materialNumber: oMaterialNumber,
                                     instance: oMaterial });
        }else{
            oMaterial = oMaterialBuffer.instance;
        }

        return oMaterial;
    };
    oMaterialRepository._getMaterialBuffer =  function(oPlant, oMaterialNumber){
        return this._oMaterials.find(oMaterial=>{ return oMaterial.plant === oPlant && oMaterial.materialNumber===oMaterialNumber});
    };


    return oMaterialRepository;
});