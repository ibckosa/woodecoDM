sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.WorkCenter", {
        constructor: function(oController, oPlant, oWorkCenter){
            this._oController = oController;
            this._oPlant = oPlant;
            this.oWorkCenter = oWorkCenter;
        },
        readData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "workcenter/v3/workcenter";

            let oParameters = { plant: this._oPlant,
                                workCenter:  this.oWorkCenter};
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        this._oDetails = oResponseData;
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },
        getPsa: function(){
            return this._oDetails.productionSupplyArea;
        },
        getResources: function(){
            let result = [];

            try{
                for(const member of this._oDetails.members){
                    if(member.resource){
                        result.push(member.resource.resource);
                    }
                }
            }catch(error){}

            return result;
        },
        getQ1PercentagePlan: function(){
            let result = 100;
            try{
                let q1PercentagePlan = this._oDetails.customValues.find(customValue => { return customValue.attribute === "Q1_PERCENTAGE_PLAN"});
                result = parseFloat(q1PercentagePlan.value);
                if(result>100||result<=0)
                {
                    result = 100;
                }
            }catch(oError){}

            return result;
        },
        getDayPlanQuan: function(){
            let result = 0;
            try{
                let dayPlanQuan = this._oDetails.customValues.find(customValue => { return customValue.attribute === "DAY_PLAN_QUAN"});
                result = parseInt(dayPlanQuan.value);
                if(result<0)
                {
                    result = 0;
                }
            }catch(oError){}
            return result;
        },
        getDayPlanUom: function(){
            let result = "M2";
            try{
                let dayPlanUOM = this._oDetails.customValues.find(customValue => { return customValue.attribute === "DAY_PLAN_UOM"});
                let uom = dayPlanUOM.value.toUpperCase();
                if(uom==="M3" || uom==="KG" || uom==="ST"){
                    result = uom;
                }

            }catch(oError){}
            return result;
        },
        getQ3ImagesVisibility: function(){ 
            let result = false;
            try{
                let q3ImagesVisibility = this._oDetails.customValues.find(customValue => { return customValue.attribute === "Q3_IMAGES_VISIBILITY"});
                result = q3ImagesVisibility.value.toUpperCase() === "X";
            }catch(oError){}
            return result;
        }
    });
});