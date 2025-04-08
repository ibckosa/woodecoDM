sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (Object, TextHandler) {
    "use strict";
    const decorFrontName =  "";
    return Object.extend("ibc.dm.plugins.wcPodToolsProvider.Material", {
        CONSTANTS: {
            DECOR_FRONT: "DEKOR_VS",
            DECOR_BACK: "DEKOR_RS",
            STRUCTURE_FRONT: "OBERFL_RS",
            STRUCTURE_BACK: "OBERFL_VS",
            DECOR_FRONT_TYPE: "decorFront",
            DECOR_BACK_TYPE: "decorBack",
            STRUCTURE_FRONT_TYPE: "structureFront",
            STRUCTURE_BACK_TYPE: "structureBack"
          },

        constructor: function(oController, oPlant, oMaterialNumber){
            this._oController = oController;
            this._oMaterialNumber = oMaterialNumber;
            this._oPlant = oPlant;
            this._oTextHandler = new TextHandler();
        },
        readData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "material/v1/materials";

            let oParameters = { plant: this._oPlant,
                                material: this._oMaterialNumber};
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
        getPackagingMaterial: function(){
            let oReturn = "";

            try{
                let oPackagingMaterial = this._oDetails.customValues.find(customValue => { return customValue.attribute === `${this._oPlant}_RETURN_MATERIAL`});
                oReturn = oPackagingMaterial.value;
            }catch(oError){}
            return oReturn;
        },
        getDescription: function(){
            let oReturn = "";

            try{
                oReturn = this._oDetails.description;
            }catch(oError){}
            return oReturn;
        },
        getGraphics: function(){
            let oReturn = [];
            let oReturnLine = { graphicName: "",
                                graphicType: "",
                                graphicUrl: "" };
            let oCustomDataGraphics = this._oDetails.customValues.filter( customValue => { return customValue.attribute === this.CONSTANTS.DECOR_FRONT ||
                                                                                                  customValue.attribute === this.CONSTANTS.DECOR_BACK ||
                                                                                                  customValue.attribute === this.CONSTANTS.STRUCTURE_FRONT ||
                                                                                                  customValue.attribute === this.CONSTANTS.STRUCTURE_BACK;
                                                                                                //   customValue.attribute === "CYLINDER_VS_1" ||
                                                                                                //   customValue.attribute === "CYLINDER_VS_2" ||
                                                                                                //   customValue.attribute === "CYLINDER_VS_3" ||
                                                                                                //   customValue.attribute === "CYLINDER_VS_4" ||
                                                                                                //   customValue.attribute === "CYLINDER_RS_1" ||
                                                                                                //   customValue.attribute === "CYLINDER_RS_2" ||
                                                                                                //   customValue.attribute === "CYLINDER_RS_3" ||
                                                                                                //   customValue.attribute === "CYLINDER_RS_4" 
                                                                                                
                                                                                                });


            for(const customGraphics of oCustomDataGraphics){
                oReturnLine.graphicUrl = "";
                switch(customValue.attribute){
                    case this.CONSTANTS.DECOR_FRONT:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.decorFront");
                        oReturnLine.graphicType = this.CONSTANTS.DECOR_FRONT_TYPE;
                        break;
                    case this.CONSTANTS.DECOR_BACK:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.decorBack");
                        oReturnLine.graphicType = this.CONSTANTS.DECOR_BACK_TYPE;
                        break;
                    case this.CONSTANTS.STRUCTURE_FRONT:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.structureFront");
                        oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_FRONT_TYPE;
                        break;
                    case this.CONSTANTS.STRUCTURE_BACK:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.structureBack");
                        oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
                        break;
                } 
                return oReturn;
            }
        }
    });
});