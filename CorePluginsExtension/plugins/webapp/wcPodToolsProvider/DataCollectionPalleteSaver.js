sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5, GeneralTools) {
    "use strict";
    let saver = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.DataCollectionPalleteSaver", {

    });

    saver.savePalleteDestinationDC = async function(controller, parameters){
        let url = controller.getPublicApiRestDataSourceUri() + "/pe/api/v1/process/processDefinitions/start?key=REG_755e2b1c-9465-452d-8a99-6fa09a1fc0ab";
        let date = new Date();
        let requestParameters = { 
            resource: parameters.resource,
            operation: { operation: "DUMMY_OPERATION",
                         version: "A" },
            sfcs: [parameters.sfc],
            plant: parameters.plant,
            parameterValues: [{ name: "ACTION_TYPE",
                                value: parameters.actionType },
                              { name: "MATERIAL",
                                value: parameters.material },
                              { name: "HU_SOURCE",
                                value: parameters.sourceHu },
                              { name: "HU",
                                value: parameters.hu },
                              { name: "QUANTITY",
                                value: `${ parameters.quantity }` },
                              { name: "ACTION_DATE",
                                value: date.toJSON() },
                              { name: "USER",
                                value: controller.getUserId() },
                              { name: "WORK_CENTER",
                                value: parameters.workCenter },
                              { name: "RESOURCE",
                                value: parameters.resource }],
            group: { dcGroup: "PALLETE_ACTION",
                     version: "A" }
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