sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/Bom"
], function (ObjectUI5, Bom) {
    "use strict";
    let oBomRepository =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.BomRepository", {
        constructor: function(){

        }
    });
    oBomRepository._oBoms = [];

    oBomRepository.getInstance =  async function(oController, oPlant, oBomNumber, oBomType){
        let oBom;
        
        let oBomRepo = oBomRepository._oBoms.find(bom=>{ return bom.plant === oPlant && bom.bomNumber === oBomNumber && bom.bomType === oBomType });
        if(!oBomRepo){
            oBom = await this.readBomApi(oController, oPlant, oBomNumber, oBomType);
            oBomRepository._oBoms.push({
             plant: oPlant,
             bomNumber: oBomNumber,
             instance: oBom,
             bomType: oBomType
            })
        }else{
            oBom = oBomRepo.instance;
        }

        return oBom;
    };

    oBomRepository.readBomApi = async function(oController, oPlant, oBomNumber, oBomType){
        let oBom = new Bom(oController, oPlant, oBomNumber, oBomType);
        await oBom.readData();
        return oBom;
    };
    oBomRepository.readBomSfcInternalApi = async function(controller, plant, sfc, operation){
        let url = controller.getAssemblyDataSourceUri() + "sfc/components/find";
        let parameters = { sfcs: [sfc],
                           operations: [operation] }
            return await new Promise((resolve,reject)=>{
        controller.ajaxPostRequest(url, parameters,
            (oResponseData) => {
                resolve(oResponseData);
            },
            (oError, sHttpErrorMessage) => {
                resolve([]);
            }   
            );
        });
    };


    return oBomRepository;
});