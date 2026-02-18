sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/GeneralTools"
], function (ObjectUI5, GeneralTools) {
    "use strict";
    let saver = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.DataCollectionQ2DestinationSaver", {

    });

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

        if(parameters.printingDetails){
            let PRINTING_PARAMETERS = GeneralTools.convertPrintingDetailsStuctureToString(parameters.printingDetails);

            requestParameters.parameterValues.push({
                name: "PRINTING_PARAMETERS",
                value: PRINTING_PARAMETERS,
                comment: parameters.guid });
        }

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