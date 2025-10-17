sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.Bom", {
        constructor: function(oController, oPlant, oBomNumber, oBomType){
            this._oController = oController;
            this._oPlant = oPlant;
            this._oBomNumber = oBomNumber;
            this._oBomType = oBomType;
        },
        readData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "bom/v1/boms";

            let oParameters = { plant: this._oPlant,
                                type: "SHOP_ORDER",
                                bom:  this._oBomNumber};
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
        getComponents: function(){
            return this._oDetails.components;
        },
        getNonBackFlushComponents: function(){
            let result = [];

            for(let bomComponent of this._oDetails.components){
                let customValueBackflush = bomComponent.customValues.find( customValue=>{ return customValue.attribute==="BACKFLUSH"});
                if((!(bomComponent.backflushEnabled || (customValueBackflush&&customValueBackflush.value==="X")) && bomComponent.componentType === "NORMAL")){
                    result.push(bomComponent);
                }
            }

            return result;
        },
        getComponentBackflush: function(componentSequence){
            let result = false;
            try{
               let bomComponent = this._oDetails.components.find( component => {return component.sequence === componentSequence;});
               if(bomComponent){
                if(bomComponent.customValues){
                    let customValueBackflush = bomComponent.customValues.find( customValue=>{ return customValue.attribute==="BACKFLUSH"});
                    if(customValueBackflush&&customValueBackflush.value==="X"){
                        result = true;
                    }

                    if(bomComponent.backflushEnabled){
                        result = true;
                    }
                }
               }
            }catch(oError){}

            return result;
        },
        getComponentUom: function(componentSequence){
            let result = "";
            try{
               let bomComponent = this._oDetails.components.find( component => {return component.sequence === componentSequence;});
               if(bomComponent){
                    result = bomComponent.unitOfMeasure;
               }
            }catch(oError){}

            return result;
        },
        getSalesSegmentRequired: function(componentSequence){
            let result = false;
            try{
               let bomComponent = this._oDetails.components.find( component => {return component.sequence === componentSequence;});
               if(bomComponent&&bomComponent.customValues){
                    let stockSegment = bomComponent.customValues.find( customValue=>{ return customValue.attribute==="STOCK_SEGMENT"});
                    if(stockSegment&&stockSegment.value==="E"){
                        result = true;
                    }
               }
            }catch(oError){}

            return result;
        },
        getComponentQuantity: function(componentSequence){
            let result = 0;
            try{
               let bomComponent = this._oDetails.components.find( component => {return component.sequence === componentSequence;});
               result = bomComponent.totalQuantity;
            }catch(oError){}

            return result;
        },
        getComponentType: function(componentSequence){
            let result = "NORMAL";
            try{
               let bomComponent = this._oDetails.components.find( component => {return component.sequence === componentSequence;});
               result = bomComponent.componentType;
            }catch(oError){}

            return result;
        },
        getComponentStoragelication: function(componentSequence){
            let result = "";
            try{
               let bomComponent = this._oDetails.components.find( component => {return component.sequence === componentSequence;});
               result = bomComponent.storageLocation;
            }catch(oError){}

            return result;
        },
    });
});