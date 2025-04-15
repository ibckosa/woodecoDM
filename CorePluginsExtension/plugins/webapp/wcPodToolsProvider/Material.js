sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/SmartEditGraphicRepository"
], function (Object, TextHandler, SmartEditGraphicRepository) {
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
            STRUCTURE_BACK_TYPE: "structureBack",
            CYLINDER_FRONT_1: "CYLINDER_VS_1",
            CYLINDER_FRONT_1_TYPE: "cylinderFront1",
            CYLINDER_FRONT_2: "CYLINDER_VS_2",
            CYLINDER_FRONT_2_TYPE: "cylinderFront2",
            CYLINDER_FRONT_3: "CYLINDER_VS_3",
            CYLINDER_FRONT_3_TYPE: "cylinderFront3",
            CYLINDER_FRONT_4: "CYLINDER_VS_4",
            CYLINDER_FRONT_4_TYPE: "cylinderFront4",
            CYLINDER_BACK_1: "CYLINDER_RS_1",
            CYLINDER_BACK_1_TYPE: "cylinderBack1",
            CYLINDER_BACK_2: "CYLINDER_RS_2",
            CYLINDER_BACK_2_TYPE: "cylinderBack2",
            CYLINDER_BACK_3: "CYLINDER_RS_3",
            CYLINDER_BACK_3_TYPE: "cylinderBack3",
            CYLINDER_BACK_4: "CYLINDER_RS_4",
            CYLINDER_BACK_4_TYPE: "cylinderBack4"
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
        getGraphics: async function(){
            let oReturn = [];

            let oCustomDataGraphics = this._oDetails.customValues.filter( customValue => { return customValue.attribute === this.CONSTANTS.DECOR_FRONT ||
                                                                                                  customValue.attribute === this.CONSTANTS.DECOR_BACK ||
                                                                                                  customValue.attribute === this.CONSTANTS.STRUCTURE_FRONT ||
                                                                                                  customValue.attribute === this.CONSTANTS.STRUCTURE_BACK ||
                                                                                                  customValue.attribute === this.CONSTANTS.CYLINDER_FRONT_1  ||
                                                                                                  customValue.attribute === this.CONSTANTS.CYLINDER_FRONT_2 ||
                                                                                                  customValue.attribute === this.CONSTANTS.CYLINDER_FRONT_3||
                                                                                                  customValue.attribute === this.CONSTANTS.CYLINDER_FRONT_4 ||
                                                                                                  customValue.attribute === this.CONSTANTS.CYLINDER_BACK_1||
                                                                                                  customValue.attribute === this.CONSTANTS.CYLINDER_BACK_1 ||
                                                                                                  customValue.attribute === this.CONSTANTS.CYLINDER_BACK_1 ||
                                                                                                  customValue.attribute === this.CONSTANTS.CYLINDER_BACK_1 });


            for(const customGraphics of oCustomDataGraphics){
                let oReturnLine = { graphicName: "",
                    graphicType: "",
                    graphicUrl: "" };
                let oSmartEditGraphic = await SmartEditGraphicRepository.getGraphic(this._oController, customGraphics.value);
                oReturnLine.graphicUrl = oSmartEditGraphic.getGraphicLink();
                switch(customGraphics.attribute){
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
                    case this.CONSTANTS.CYLINDER_FRONT_1:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderFront1");
                        oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
                        break;
                    case this.CONSTANTS.CYLINDER_FRONT_2:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderFront2");
                        oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
                        break;
                    case this.CONSTANTS.CYLINDER_FRONT_3:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderFront3");
                        oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
                        break;
                    case this.CONSTANTS.CYLINDER_FRONT_4:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderFront4");
                        oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
                        break;
                    case this.CONSTANTS.CYLINDER_BACK_1:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderBack1");
                        oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
                        break;
                    case this.CONSTANTS.CYLINDER_BACK_2:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderBack2");
                        oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
                        break;
                    case this.CONSTANTS.CYLINDER_BACK_3:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderBack3");
                        oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
                        break;
                    case this.CONSTANTS.CYLINDER_BACK_4:
                        oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderBack4");
                        oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
                        break;
                } 
                if(oReturnLine.graphicUrl!==""){
                    oReturn.push(oReturnLine);
                }
            }
            return oReturn;
        },
        getDetails: function(){
            return this._oDetails;
        }
    });
});