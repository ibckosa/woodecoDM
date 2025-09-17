sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let issueReader =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.IssueReader", {
    });

    issueReader.readIssues = async function(controller, plant, order, materialNumber, materialVersion){
        let results = [];
        let additionalApiCalls = [];

        let firstApiCallResults = await this._callApiGetIssue(controller, plant, order, materialNumber, materialVersion);
        if(firstApiCallResults.totalPages&&firstApiCallResults.totalPages>1){
            for(let i=1;i<firstApiCallResults.totalPages; i++){
                additionalApiCalls.push(this._callApiGetIssue(controller, plant, order, materialNumber, materialVersion, i));
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

    issueReader._callApiGetIssue = async function(controller, plant, order, materialNumber, materialVersion, page=0){
            let sUrl = controller.getPublicApiRestDataSourceUri() + "inventory/v1/inventory/goodsIssues";

            let parameters = {  plant: plant,
                                material: materialNumber,
                                materialVersion: materialVersion,
                                order: order,
                                size: 50,
                                page: page };
            return await new Promise((resolve,reject)=>{
                controller.ajaxGetRequest(sUrl, parameters,
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
    return issueReader;
});