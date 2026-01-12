sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let errorAlert = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.ErrorAlert", {

    });

// paramteres expected values
// PLANT
// SFC
// ErrorDesc
// Resource


    errorAlert.createAlert = async function(controller, parameters){
        let url = controller.getPublicApiRestDataSourceUri() + "/pe/api/v1/process/processDefinitions/start?key=REG_fda081a7-416e-40a5-bae1-a572c13a4308";
        let date = new Date();

        let requestParameters = { 
            PLANT: parameters.PLANT,
            SFC: parameters.SFC,
            ErrorDesc: parameters.ErrorDesc,
            Resource: parameters.Resource,
            DateTime: date.toJSON() };

        await this._callApi(controller, url, requestParameters);
    },





    errorAlert._callApi = async function(controller, url, requestparameters){
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

    return errorAlert;

});