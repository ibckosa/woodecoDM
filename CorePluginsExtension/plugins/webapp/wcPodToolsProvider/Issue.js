sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let issue =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.Issue", {
    });
    issue.execute = async function(controller, parameters){
            let sUrl = controller.getPublicApiRestDataSourceUri() + "/pe/api/v1/process/processDefinitions/start?key=REG_4628ba8b-6431-4c61-a36b-e75601786139";// "processorder/v1/goodsissue";
            let issueGuid = crypto.randomUUID();



            let requestParameters = {  
                                plant: parameters.plant,
                                order: parameters.order,
                                phase: parameters.operation,
                                charge: parameters.sfc,
                                workCenter: parameters.workCenter,
                                component: {
                                    material: {
                                        material: parameters.material,
                                        version: parameters.materialVersion
                                    },
                                    sequence: parameters.componentSequence
                                },
                                isBomComponent: true,
                                bom: {
                                    bom: parameters.bom,
                                    version: parameters.bomVersion
                                },
                                inventoryId: parameters.inventoryId,
                                quantity: parameters.quantity,
                                unitOfMeasure: parameters.uom,
                                postedBy: controller.getUserId(),
                                postingDateTime: this._getIssueDt(),
                                comments: `${parameters.componentSequence}//${issueGuid}`,
                                isAI: false };

            if(parameters.isAI){
                requestParameters.isAI = true;
                requestParameters.async = false;
                sUrl = sUrl + "&async=false";
            }
            return await new Promise((resolve,reject)=>{
                controller.ajaxPostRequest(sUrl, requestParameters,
                    (oResponseData) => {
                        if(requestParameters.isAI&&!oResponseData.ev_material){
                            resolve(undefined);
                        }
                        resolve(requestParameters.comments);
                    },
                    (oError, sHttpErrorMessage) => {
                        if(requestParameters.isAI){
                            reject(oError);
                        }
                        resolve(requestParameters.comments);
                    }   
                );

            });
    };
    issue._getIssueDt = function(){
        let today  = new Date();
        today.setSeconds(today.getSeconds() - 60);
        let oYear = today.getFullYear().toString();
        let oMonth = (today.getMonth()+1).toString();
        let oDay = today.getDate().toString();
        let oHour = today.getHours().toString();
        let oMinutes = today.getMinutes().toString();
        let oSeconds = today.getSeconds().toString();
        if (oMonth.length === 1) { oMonth = `0${oMonth}`; }
        if (oDay.length === 1) { oDay = `0${oDay}`; }
        if (oHour.length === 1) { oHour = `0${oHour}`; }
        if (oMinutes.length === 1) { oMinutes = `0${oMinutes}`; }
        if (oSeconds.length === 1) { oSeconds = `0${oSeconds}`; }

        let result = `${oYear}-${oMonth}-${oDay} ${oHour}:${oMinutes}:${oSeconds}`;
        return result;
    }
    return issue;
});