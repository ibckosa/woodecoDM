sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let issueReader =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.IssueReader", {
    });

    issueReader.readIssues = async function(controller, plant, order, materialNumber, materialVersion){
        let results = [];
        let additionalApiCalls = [];

        let parameters = {
            plant: plant,
            order: order,
            materialNumber: materialNumber,
            materialVersion: materialVersion
        };

        let firstApiCallResults = await this._callApiGetIssue(controller, parameters);
        if(firstApiCallResults.totalPages&&firstApiCallResults.totalPages>1){
            for(let i=1;i<firstApiCallResults.totalPages; i++){
                additionalApiCalls.push(this._callApiGetIssue(controller, parameters, i));
            }
        }

        if(firstApiCallResults.content){
            results =  firstApiCallResults.content;
        }

        if(additionalApiCalls.length>0){
            let additionalResults = await Promise.all(additionalApiCalls);
            for(const additionalResult of additionalResults){
                if(additionalResult.content){
                        results = results.concat(additionalResult.content);
                }
            }
        }

        return results;  
    };

    issueReader._callApiGetIssue = async function(controller, parameters, page=0){
            let sUrl = controller.getPublicApiRestDataSourceUri() + "inventory/v2/inventory/goodsIssues";

            let requestParameters = {  plant: parameters.plant,
                                material: parameters.materialNumber,
                                materialVersion: parameters.materialVersion,
                                order: parameters.order,
                                sfc: parameters.sfc,
                                size: 50,
                                page: page };
            return await new Promise((resolve,reject)=>{
                controller.ajaxGetRequest(sUrl, requestParameters,
                    (oResponseData) => {
                        debugger;
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        debugger;
                        resolve();
                    }   
                );

            });

    }

    issueReader.readIssuesSfc = async function(controller, plant, sfc, materialNumber, materialVersion){
        let results = [];
        let additionalApiCalls = [];

        let parameters = {
            plant: plant,
            sfc: sfc,
            materialNumber: materialNumber,
            materialVersion: materialVersion
        };

        let firstApiCallResults = await this._callApiGetIssue(controller, parameters);
        if(firstApiCallResults.totalPages&&firstApiCallResults.totalPages>1){
            for(let i=1;i<firstApiCallResults.totalPages; i++){
                additionalApiCalls.push(this._callApiGetIssue(controller, parameters, i));
            }
        }

        if(firstApiCallResults.content){
            results =  firstApiCallResults.content;
        }

        if(additionalApiCalls.length>0){
            let additionalResults = await Promise.all(additionalApiCalls);
            for(const additionalResult of additionalResults){
                if(additionalResult.content){
                        results = results.concat(additionalResult.content);
                }
            }
        }

        return results;  
    };

    return issueReader;
});