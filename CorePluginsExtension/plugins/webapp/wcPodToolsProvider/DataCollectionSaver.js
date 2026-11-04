sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/GeneralTools"
], function (ObjectUI5, GeneralTools) {
    "use strict";
    let saver = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.DataCollectionSaver", {

    });

// paramteres expected values
// plant
// sfc
// resource
// operation
// productionProcessType ["Q1","Q3","AI"]
// q3Code
// quantity
// uom
// material
// itemNo
// salesOrder    
// saledOrderItem
// hu
// cancelled true/false
// user
// consumption
// dateCreated
// processStart
// processStop  
// ncCode
// ncCodeDescription
// guid

    saver.saveProductionDC = async function(controller, parameters){
        let url = controller.getPublicApiRestDataSourceUri() + "/pe/api/v1/process/processDefinitions/start?key=REG_9c42ba95-612a-4f66-8e91-2b6096409699";

        let requestParameters = { 
            PROCESS_START: parameters.processStart,
            PROCESS_STOP: parameters.processStop,
            DATE_CREATED: parameters.dateCreated,
            NC_CODE: parameters.ncCode,
            ITEM_NO: parameters.itemNo,
            QUANTITY: parameters.quantity,
            NC_CODE_DESCRIPTION: parameters.ncCodeDescription,
            Resource: parameters.resource,
            GUID: parameters.guid,
            SALES_ORDER_ITEM: parameters.saledOrderItem,
            Operation: parameters.operation,
            Q1_Q3: parameters.productionProcessType,
            USER: parameters.user,
            HU: parameters.hu,
            Q3_CODE: parameters.q3Code,
            CANCELLED: parameters.cancelled,
            SFC: parameters.sfc,
            Plant: parameters.plant,
            UOM: parameters.uom,
            SALES_ORDER: parameters.salesOrder,
            MATERIAL: parameters.material,
            CONSUMPTION: parameters.consumption,
            ERRORS: parameters.errors
        };

        if(parameters.printingParameters){
            requestParameters.PRINTING_PARAMETERS = GeneralTools.convertPrintingDetailsStuctureToString(parameters.printingParameters);
        }

        try{
            await this._callApi(controller, url, requestParameters);
        }catch(oFirstError){
            await this._sleep(1500);
            await this._callApi(controller, url, requestParameters);
        }
    },

    saver._sleep = function(ms){
        return new Promise(resolve => setTimeout(resolve, ms));
    },



    saver._callApi = async function(controller, url, requestparameters){
            return await new Promise((resolve,reject)=>{
                controller.ajaxPostRequest(url, requestparameters,
                    async oResponseData => {
                        resolve();
                    },
                    async (oError, sHttpErrorMessage) => {
                        oError.apiName = "DataCollectionSaver.saveProductionDC";
                        oError.sendAlert = true;
                        reject(oError);
                    }
                );
            });
    }

    return saver;

});