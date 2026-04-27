sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/SmartEditGraphicRepository",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler"
], function (Object, TextHandler, SmartEditGraphicRepository, ErrorHandler) {
    "use strict";
    const decorFrontName =  "";
    let material =  Object.extend("ibc.dm.plugins.wcPodToolsProvider.Material", {
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
            this._errorHandler = new ErrorHandler(this._oController);
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
        getCustomDataGraphics: function(){
            let oCustomDataGraphics = this._oDetails.customValues.filter( customValue => { return ( customValue.attribute === this.CONSTANTS.DECOR_FRONT ||
                                                                                                    customValue.attribute === this.CONSTANTS.DECOR_BACK ||
                                                                                                    customValue.attribute === this.CONSTANTS.STRUCTURE_FRONT ||
                                                                                                    customValue.attribute === this.CONSTANTS.STRUCTURE_BACK ) &&
                                                                                                    customValue.value && customValue.value !== "" });
            return oCustomDataGraphics;
        },
        getGraphics: async function(){
            let oCustomDataGraphics = this._oDetails.customValues.filter( customValue => { return ( customValue.attribute === this.CONSTANTS.DECOR_FRONT ||
                                                                                                  customValue.attribute === this.CONSTANTS.DECOR_BACK ||
                                                                                                  customValue.attribute === this.CONSTANTS.STRUCTURE_FRONT ||
                                                                                                  customValue.attribute === this.CONSTANTS.STRUCTURE_BACK ) &&
                                                                                                  customValue.value && customValue.value !== "" });
            let oResult = await this.getGraphicLinkFromCustomData(oCustomDataGraphics);

            // for(const customGraphics of oCustomDataGraphics){
            //     let oReturnLine = { graphicName: "",
            //         graphicType: "",
            //         graphicUrl: "" };
            //     let oSmartEditGraphic = await SmartEditGraphicRepository.getGraphic(this._oController, customGraphics.value);
            //     oReturnLine.graphicUrl = oSmartEditGraphic.getGraphicLink();
            //     switch(customGraphics.attribute){
            //         case this.CONSTANTS.DECOR_FRONT:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.decorFront");
            //             oReturnLine.graphicType = this.CONSTANTS.DECOR_FRONT_TYPE;
            //             break;
            //         case this.CONSTANTS.DECOR_BACK:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.decorBack");
            //             oReturnLine.graphicType = this.CONSTANTS.DECOR_BACK_TYPE;
            //             break;
            //         case this.CONSTANTS.STRUCTURE_FRONT:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.structureFront");
            //             oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_FRONT_TYPE;
            //             break;
            //         case this.CONSTANTS.STRUCTURE_BACK:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.structureBack");
            //             oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
            //             break;
            //         case this.CONSTANTS.CYLINDER_FRONT_1:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderFront1");
            //             oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
            //             break;
            //         case this.CONSTANTS.CYLINDER_FRONT_2:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderFront2");
            //             oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
            //             break;
            //         case this.CONSTANTS.CYLINDER_FRONT_3:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderFront3");
            //             oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
            //             break;
            //         case this.CONSTANTS.CYLINDER_FRONT_4:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderFront4");
            //             oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
            //             break;
            //         case this.CONSTANTS.CYLINDER_BACK_1:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderBack1");
            //             oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
            //             break;
            //         case this.CONSTANTS.CYLINDER_BACK_2:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderBack2");
            //             oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
            //             break;
            //         case this.CONSTANTS.CYLINDER_BACK_3:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderBack3");
            //             oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
            //             break;
            //         case this.CONSTANTS.CYLINDER_BACK_4:
            //             oReturnLine.graphicName = this._oTextHandler.getText("graphic.label.cylinderBack4");
            //             oReturnLine.graphicType = this.CONSTANTS.STRUCTURE_BACK_TYPE;
            //             break;
            //     } 
            //     if(oReturnLine.graphicUrl!==""){
            //         oReturn.push(oReturnLine);
            //     }
            // }
            return oResult;
        },
        getGraphicLinkFromCustomData: async function(customData){
            let oReturn = [];
            for(const customGraphics of customData){
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
        },
        getCustomValues(){
            return this._oDetails.customValues;
        },
        getThickness(){
            let oReturn = "";

            try{
                let oPackagingMaterial = this._oDetails.customValues.find(customValue => { return customValue.attribute === 'THICKNESS' });
                oReturn = oPackagingMaterial.value;
            }catch(oError){}

            return oReturn;
        },
        getThicknessAsInteger(){
            let oReturn = 0;

            try{
                let oPackagingMaterial = this._oDetails.customValues.find(customValue => { return customValue.attribute === 'THICKNESS' });
                oReturn = parseInt(oPackagingMaterial.value);
            }catch(oError){}

            return oReturn;
        },
        getSalesText(langugage="PL"){
            let oReturn = "";

            try{
                let oPackagingMaterial = this._oDetails.customValues.find(customValue => { return customValue.attribute === `SALES_TEXT_${langugage}` });
                oReturn = oPackagingMaterial.value;
            }catch(oError){}

            return oReturn;
        },
        getScrapingMaterial(){
           // this._oPlant = oPlant;
            let fieldName = '';

            switch(this._oPlant){
                case '4100':
                    fieldName = 'SCRAP_INTERIM_GR1';
                    break;
                case '4200':
                    fieldName = 'SCRAP_INTERIM_GR';
                    break;
                case '4300':
                    fieldName = 'SCRAP_INTERIM_WI';
                    break;
            }

            let scrapMaterial = this._oDetails.customValues.find(customValue => { return customValue.attribute === fieldName });
            if(!scrapMaterial||!scrapMaterial.value){
                this._errorHandler.throwErrorPopup("error.q23.noScrapingMaterial");
            }
            return (parseInt(scrapMaterial.value)).toString();
        },
        getBaseUom: function(){
            return this._oDetails.unitOfMeasure;
        },
        getAlternatesUom: function(){
            return this._oDetails.alternateUnitsOfMeasure;
        },
        convertUom: function(quantityIn, uomIn, uomOut){
            let result = quantityIn;
            if(quantityIn&&uomIn&&uomOut){
                if(uomIn !== uomOut){
                    let huUomConverter = this._oDetails.alternateUnitsOfMeasure.find( alternateUom => { return uomIn === alternateUom.uom });
                    if(huUomConverter){
                        result = result * huUomConverter.denominator / huUomConverter.numerator;
                        uomIn = uomOut;
                    }

                    let alternateConverter = this._oDetails.alternateUnitsOfMeasure.find( alternateUom => { return alternateUom.uom === uomOut});
                    if(alternateConverter){
                        uomIn = uomOut;
                        result = result * alternateConverter.denominator / alternateConverter.numerator;
                    }
                }
            }

            return result;
        },
        getIndividualReq: function(){
            let result = false;
            
            try{
                let individualReq = this._oDetails.customValues.find(customValue => { return customValue.attribute === "INDIVIDUAL_REQ" });
                if(individualReq){
                    result = individualReq.value === "X";
                }
            }catch(error){}

            return result;
        },
        getUomProductionReport: function(){
            let result = [];

            if(this.getBaseUom()==='ST'){
                result.push({uom: 'ST', uomDesc:"SZT"});
            }else if(this.getBaseUom()==='KG'){
                result.push({uom: 'KG', uomDesc:"KG"});
            }

            // let huUomConverterST = this._oDetails.alternateUnitsOfMeasure.find( alternateUom => { return alternateUom.uom === "ST" });
            // if(huUomConverterST){
            //     result.push({uom: 'ST', uomDesc:"SZT"});
            // }

            // let huUomConverterKG = this._oDetails.alternateUnitsOfMeasure.find( alternateUom => { return alternateUom.uom === "KG" });
            // if(huUomConverterKG){
            //     result.push({uom: 'KG', uomDesc:"KG"});
            // }

            let huUomConverterM2 = this._oDetails.alternateUnitsOfMeasure.find( alternateUom => { return alternateUom.uom === "M2" });
            if(huUomConverterM2){
                result.push({uom: 'M2', uomDesc:"M2"});
            }

            let huUomConverterM3 = this._oDetails.alternateUnitsOfMeasure.find( alternateUom => { return alternateUom.uom === "M3" });
            if(huUomConverterM3){
                result.push({uom: 'M3', uomDesc:"M3"});
            }
            return result;
        }
    });

    material.CONSTANTS = {
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
    }
    material._oTextHandler = new TextHandler();

    material.getGraphicLinkFromCustomData = async function(customData, controller){
        let oReturn = [];
        for(const customGraphics of customData){
            let oReturnLine = { graphicName: "",
                graphicType: "",
                graphicUrl: "" };
            let oSmartEditGraphic = await SmartEditGraphicRepository.getGraphic(controller, customGraphics.value);
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
    }

    return material;
});
