sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.PiqQ23", {
        constructor: function(controller, parameters){
            this._controller = controller;
            this._parameters = parameters;
        },
        getQ23Available: async function(){
            let result = 0;
            let sfcDtDataCollections = await this._getDataCollections();

            if(!sfcDtDataCollections||sfcDtDataCollections.length === 0){
                return result
            }

            for(const collection of sfcDtDataCollections){
                result = result + parseInt(collection.quantity);
            }

            // let firstCollection = sfcDtDataCollections[0];
            // result = parseInt(firstCollection.Q3T);
            return result

        },
        _getDataCollections: async function(){
            let collectionsApi = await this._getDataCollectionsFromApi();
            collectionsApi = collectionsApi.filter(collection => {return collection!==null&&collection!==undefined });
            let result = [];
            for(let collectionFromApi of collectionsApi){
                if(!collectionFromApi.data){
                    collectionFromApi.data = [];
                }

                collectionFromApi.data = collectionFromApi.data.filter(lineData=>{return lineData.parameter.measureName === "Q3T" })
                const latestParams = {};

                collectionFromApi.data.forEach(item => {
                  const param = item.parameter;
                  const name = param.measureName;
                  const created = new Date(param.dateCreated);
                  
                  let splittedActualValues = param.actual.split("||");
                  let valuesConverted = splittedActualValues
                                        .filter(item => item.includes(":")) 
                                        .map(item => {
                                        const colonIndex = item.indexOf(":");
                                        const field_name = item.substring(0, colonIndex).trim();
                                        const field_value = item.substring(colonIndex + 1).trim();
                                        return { field_name, field_value };
                                        });

                  let q3Quan = valuesConverted.find(value=>{ return value.field_name === "Q3"});
                  let q3DT = valuesConverted.find(value=>{ return value.field_name === "DATATIMESTAMP_BEG"});

                  if(q3Quan&&q3DT){
                    let q3tParam =  result.find(resultLine=>{return resultLine.DATATIMESTAMP_BEG === q3DT.field_value});
                    if(!q3tParam){
                        result.push({ quantity: q3Quan.field_value,
                                      DATATIMESTAMP_BEG: q3DT.field_value,
                                      created: created
                         });
                    }else if(q3tParam.created < created ){
                        q3tParam.created = created;
                        q3tParam.quantity = q3Quan.field_value;
                    }

                  }
                
                //   if (!latestParams[name] || created > latestParams[name].created) {
                //     latestParams[name] = {
                //       created,
                //       actual: param.actual
                //     };
                //   }
                });

                // const myStructure = {};

                // for (const [name, { actual, created }] of Object.entries(latestParams)) {
                //     if (name === "READINGS") {
                //       const readings = {};
                //       actual.split("||").forEach(pair => {
                //         // const [key, value] = pair.split(":");
                //         // readings[key] = value === "null" ? null : value;
                //         const index = pair.indexOf(":");
                //         if (index !== -1) {
                //           const key = pair.substring(0, index);
                //           const value = pair.substring(index + 1);
                //           readings[key] = value === "null" ? null : value;
                //         }

                //       });
                //       myStructure[name] = readings;
                //       myStructure.created = created;
                //     } else {
                //       myStructure[name] = actual;
                //     }
                // }
                // if(myStructure.Q3T){
                //     myStructure.sfcNumber = collectionFromApi.sfcNumber;
                //     result.push(myStructure);
                // }
            }
            
            return result;
        },
        _getDataCollectionsFromApi: async function(){
            let calledPromises = [];
            let calledAdditionalPromises = [];

            calledPromises.push(this._getCollectionsPromise(`${this._parameters.order}_M0000`));

            let results = await Promise.all(calledPromises);
            for(const result of results){
                if(result.numberOfPages>1){
                    for(let i=1;i<result.numberOfPages;i++){
                        calledAdditionalPromises.push(this._getCollectionsPromise(result.sfcNumber, i))
                    }
                }
            }
            if(calledAdditionalPromises.length>0){
                let additionalResults = await Promise.all(calledAdditionalPromises);
    
                for(const additionalResult of additionalResults){
                    const result = results.find( result => {return result.sfcNumber === additionalResult.sfcNumber });
    
                    if(result){
                        for(let parameter of additionalResult.data){
                            result.data.push(parameter);
                        }
                    }
                }
            }
            return results;

        },

        _getCollectionsPromise: async function(sfc, pageNumber=0){
            let sUrl = this._controller.getPublicApiRestDataSourceUri() + "datacollection/v1/measurements";

            let oParameters = { plant: this._parameters.plant,
                                sfcs:  [sfc],
                                "dcGroup.name": "PIQ_ORDER_DATA",
                                "dcGroup.version": "1",
                                // dcGroup: { name: "PIQ_ORDER_DATA",
                                //            version: "1" },
                                pageNumber: pageNumber,
                                pageSize: 50 };
            return await new Promise((resolve,reject)=>{
                this._controller.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        oResponseData.sfcNumber = sfc;
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve();
                    }   
                );
    
            });
        },



    });
});