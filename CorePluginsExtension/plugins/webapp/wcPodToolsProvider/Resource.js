sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler"
], function (Object, ErrorHandler) {
    "use strict";
    return Object.extend("ibc.dm.plugins.wcPodToolsProvider.Resource", {
        constructor: function(oController, oPlant, oResourceNumber){
            this._oController = oController;
            this._oResourceNumber = oResourceNumber;
            this._oPlant = oPlant;
            this._oErrorHandler = new ErrorHandler(this._oController);
        },
        readResourceData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "resource/v3/resource";

            let oParameters = { plant: this._oPlant,
                                resource: this._oResourceNumber};
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
        getResourceErpId: function(errorWhenEmpty = false){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "WM_BIN_TYPE"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getNcCodeType: function(errorWhenEmpty = false){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "NC_CODE_TYPE"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getFunctionalLocation(errorWhenEmpty = false){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "FUNCTIONAL_LOCATION"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getQ1Scheme(){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "Q1_SCHEME"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getMOSelectionMode(){
            let result = "";

            try{
                let moSelectionMode = this._oDetails.customValues.find(customValue => { return customValue.attribute === "MO_SELECTION_MODE"});
                result = moSelectionMode.value;
            }catch(error){}
            return result;
        },
        getPrinterId(errorWhenEmpty = false){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "PRINTER_ID"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },
        getPrinterComponentsId(errorWhenEmpty = false){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "PRINTER_ID_COMPONENTS"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}
            return oReturn;
        },

        getConsumptionMode(errorWhenEmpty = false){
            let oReturn = "";

            try{
                let oBinCustomValue = this._oDetails.customValues.find(customValue => { return customValue.attribute === "CONSUMPTION_MODE"});
                oReturn = oBinCustomValue.value;
            }catch(oError){}

            if(errorWhenEmpty&&oReturn===""){
                this._oErrorHandler.throwErrorPopup("error.resource.noConsumptionMode");
            }
            return oReturn.toUpperCase();
        },
        getParametersHu(){
            let result = false;

            try{
                let parametersHu = this._oDetails.customValues.find(customValue => { return customValue.attribute === "PARAMETERS_HU"});
                result = parametersHu.value === 'X';
            }catch(oError){}

            return result;
        },
        getAdditionalQrPrint(){
            let result = false;

            try{
                let additionalQrPrint = this._oDetails.customValues.find(customValue => { return customValue.attribute === "ADDITIONAL_QR_PRINT"});
                result = additionalQrPrint.value === 'X';
            }catch(oError){}

            return result;
        },
        getConsumptionButtons: function(){
            let result = "";
            try{
                let consumptionButtons = this._oDetails.customValues.find(customValue => { return customValue.attribute === "CONSUMPTION_BUTTONS"});
                if(consumptionButtons){
                    result = consumptionButtons.value;
                }
            }catch(oError){}
            return result;
        },
        getQ2Scheme: function(){
            let result = "";
            try{
                let q2Scheme = this._oDetails.customValues.find(customValue => { return customValue.attribute === "Q2_SCHEME"});
                if(q2Scheme){
                    result = q2Scheme.value;
                }
            }catch(oError){}
            return result;
        },
        getWorkListScheme: function(){
            let result = "1,2,3";
            try{
                let workList = this._oDetails.customValues.find(customValue => { return customValue.attribute === "WORKLIST_SCHEME"});
                if(workList){
                    result = workList.value;
                }
            }catch(oError){}
            if(result === ""){
                result = "1,2,3";
            }
            return result;
        }, 
        getQ1LabelCopies: function(){
            let result = 0;
            try{
                let q1LabelCopies = this._oDetails.customValues.find(customValue => { return customValue.attribute === "Q1_LABEL_COPIES"});
                result = parseInt(q1LabelCopies.value);
                if(result>5){
                    result = 5;
                }
            }catch(oError){}

            return result;
        },
        getQ2LabelCopies: function(){
            let result = 1;
            try{
                let q2LabelCopies = this._oDetails.customValues.find(customValue => { return customValue.attribute === "Q2_LABEL_COPIES"});
                result = parseInt(q2LabelCopies.value);
                if(result>5){
                    result = 5;
                }
                if(result < 0){
                    result = 1;
                }
            }catch(oError){}

            return result;
        },
        getComponentLabelCopies: function(){
            let result = 1;
            try{
                let compLabelCopies = this._oDetails.customValues.find(customValue => { return customValue.attribute === "COMP_LABEL_COPIES"});
                result = parseInt(compLabelCopies.value);
                if(result>5){
                    result = 5;
                }
                if(result < 0){
                    result = 1;
                }
            }catch(oError){}

            return result;
        },
        getMaxPalletesPerReceipt: function(){
            let result = 1;
            try{
                let q1MaxPalletes = this._oDetails.customValues.find(customValue => { return customValue.attribute === "Q1_MAX_PALLETS"});
                result = parseInt(q1MaxPalletes.value);
            }catch(oError){}

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
                if(uom==="M3"||uom==="KG"||uom==="ST"){
                    result = uom;
                }

            }catch(oError){}
            return result;
        },
        getAvailabilityPlanPercentage: function(){
            let result = 100;
            try{
                let plan = this._oDetails.customValues.find(customValue => { return customValue.attribute === "AVAILABILITY_PLAN_PERCENTAGE"});
                result = parseFloat(plan.value);
                if(result>100||result<=0)
                {
                    result = 100;
                }

            }catch(oError){}
            return result;
        }
    });
});