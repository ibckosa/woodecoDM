sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let saver = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.DataCollectionQ2DestinationSaver", {

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

    saver.saveQ2DestinationDC = async function(controller, parameters){
        let url = controller.getPublicApiRestDataSourceUri() + "/pe/api/v1/process/processDefinitions/start?key=REG_dfa24a23-2ada-42a8-89ae-e3835822fa76";

        let requestParameters = { 
            resource: parameters.resource,
            operation: { operation: parameters.operation,
                         version: parameters.operationVersion },
            sfcs: [parameters.sfc],
            plant: parameters.plant,
            parameterValues: [{ name: "DESTINATION",
                                value: parameters.q2Destination,
                                comment: parameters.guid }],
            group: { dcGroup: "Q2_DESTINATION",
                     version: "1" }
        };

        await this._callApi(controller, url, requestParameters);
    },

    saver._callApi = async function(controller, url, requestparameters){
            return await new Promise((resolve,reject)=>{
                controller.ajaxPostRequest(url, requestparameters,
                    async oResponseData => {
                        resolve();
                    },
                    async (oError, sHttpErrorMessage) => {
                        resolve();                         
                    }
                );
            });
    }

    return saver;

});