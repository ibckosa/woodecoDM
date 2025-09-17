sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/SfcDataCollectionReader",
    "ibc/dm/plugins/wcPodToolsProvider/NcCodesReader"
], function (ObjectUI5, SfcDataCollectionReader, NcCodesReader) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.NonconformanceReader", {
        constructor: function(controller, parameters){
            this._controller = controller;
            this._parameters = parameters;
            /// parameters:
            /// plant:string
            /// start_date:dateTime
            /// end_date:dateTime
            /// operation_activity:string
            /// sfc:string
            /// resource:string
            /// workCenter: string
            /// routing:string
            /// routingStepId:string
            /// excludeStorned:boolean
        },
        readNonconformances: async function(){
            let nonConformances = await this._getNonconformancesFromApi();            
            if(this._parameters.excludeStorned){
                nonConformances = await this._filterStornedNonconformances(nonConformances);
            }
            let codesForResource = await NcCodesReader.readCodes(this._controller, this._parameters.plant, this._parameters.workCenter, this._parameters.resource);
            for(const nonConformance of nonConformances){
                let codeDetails = codesForResource.find( code => { return code.code === nonConformance.code });
                if(codeDetails){
                    nonConformance.codeDescription = codeDetails.codeDescription;
                }
            }
            return nonConformances;
        },
        _getNonconformancesFromApi: async function(){
            let result = [];
            let additionalApiCalls = [];
            let requestData = this._getRequestData();
            let firstApiCallResults = await this._callApi(requestData);
            if(firstApiCallResults.totalPages&&firstApiCallResults.totalPages>1){
                for(let i=1;i++;i<firstApiCallResults.totalPages){
                    requestData.page = i;
                    additionalApiCalls.push(this._callApi(requestData));
                }
            }
            if(firstApiCallResults.content){
                result =  firstApiCallResults.content;
            }

            if(additionalApiCalls.length>0){
                let additionalResults = await Promise.all(additionalApiCalls);
                for(const additionalResult of additionalResults){
                    if(additionalResult.content){
                            result = result.concat(additionalResult.content);
                    }
                }
            }

            return result;  

        },
        _callApi: async function(requestData){
            let url = this._controller.getPublicApiRestDataSourceUri() + "nonconformance/v2/nonconformances";

            return await new Promise((resolve,reject)=>{
                this._controller.ajaxGetRequest(url, requestData,
                    function (oResponseData) {
                        resolve(oResponseData);
                    },
                    function (oError, sHttpErrorMessage) {
                        reject(oError);
                    }   
                );

            });
        },
        _getRequestData: function(){
            let result = {};

            result.page = 0;
            result.size = 50;
            result.plant = this._parameters.plant;
            if(this._parameters.start_date){
                result.fromDate = this._parameters.start_date;
            }
            if(this._parameters.end_date){
                result.toDate = this._parameters.end_date;
            }
            if(this._parameters.operation_activity){
                result.operationActivity = this._parameters.operation_activity;
            }
            if(this._parameters.sfc){
                result.sfc = this._parameters.sfc;
            }
            if(this._parameters.resource){
                result.resource = this._parameters.resource;
            }
            if(this._parameters.routing){
                result.routing = this._parameters.routing;
            }
            if(this._parameters.routingStepId){
                result.routingStepId = this._parameters.routingStepId;
            }

            return result;
        },
        _filterStornedNonconformances: async function(nonConformances){
            let sfcs = [];
            for(const nonConformance of nonConformances){
                let sfc = sfcs.find( line=> { line === nonConformance.sfc } );
                if(!sfc){
                    sfcs.push(nonConformance.sfc);
                }
            }
            if(sfcs.length === 0){return nonConformances;}

            let collections = await SfcDataCollectionReader.readCollections(this._controller, this._parameters.plant, sfcs, this._parameters.operation_activity, true, true);
            let collectionsQ3 = collections.filter(collection=>{return collection["Q1/Q3"] === "Q3" && collection.CANCELLED === "true"});
            for(const collection of collectionsQ3){
                nonConformances = nonConformances.filter(nonConformance=>{return nonConformance.sfc !== collection.SFC_NUMBER})
            }

            return nonConformances;
        }

    });
});