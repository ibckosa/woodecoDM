sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "sap/dm/dme/model/AjaxUtil",
    "ibc/dm/plugins/wcPodToolsProvider/WorkCenterRepository",
    "ibc/dm/plugins/wcPodToolsProvider/MessageDisplay",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (ObjectUI5, ErrorHandler,  OrderRepository, SfcRepository, AjaxUtil, WorkCenterRepository, MessageDisplay, TextHandler) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.PiqDtUpdate", {
        constructor: function(controller, parameters){
            this._controller = controller;
            this._parameters = parameters;
            this._errorHandler = new ErrorHandler(this._controller);
            this._textHandler = new TextHandler();
        },
        execute: async function(){
            let messages = []
            
            let codes = [];
            try{
                this._getDummyOrder();
                await this._getResources();
                await this._getSfcs();
                
                let sfcDtDataCollections = await this._getDataCollections();

                if(!sfcDtDataCollections||sfcDtDataCollections.length === 0){
                    this._throwError("error.piq.anyDtToUpdate");
                }


                for(const dataCollection of sfcDtDataCollections){
                    if(dataCollection.READINGS.CODE){
                        codes.push({ code: dataCollection.READINGS.CODE,
                                     resource: dataCollection.READINGS.RESOURCE });
                    }
                }
                // if(!codes||codes.length === 0){
                //     this._throwError("error.piq.anyDtToUpdate");
                //     return };

                let oeeCodes = await this._getOeeCodes(codes);
                // if(!oeeCodes||oeeCodes.length === 0){return};


                try{
                    for(const dataCollection of sfcDtDataCollections){
                        messages.push({ messageType: "I",
                                        messageValue: this._textHandler.getText(information.piq.dtUpdateAttempt) });

                        if(!dataCollection.READINGS.CODE){ this._throwError("error.piq.noCodeDt"); }

                        let oeeCode = oeeCodes.find(code => {return code.resource === dataCollection.READINGS.RESOURCE && code.code === dataCollection.READINGS.CODE });

                        if(!oeeCode){
                            this._throwError("error.piq.noOeeCodeDt");
                        }else if(!oeeCode.reasonCodeId || oeeCode.reasonCodeId ===""){
                            this._throwError("error.piq.noReasonCode");
                        }

                        let sfc = await SfcRepository.getInstance(this._controller, this._parameters.plant, dataCollection.sfcNumber);
                        await this._updateDt(dataCollection, oeeCode&&oeeCode.reasonCodeId);
                        await this._saveNewStartTime(dataCollection);
                        messages.push({ messageType: "S",
                                        messageValue: this._textHandler.getTExt("success.piq.downTimeUpdated",dataCollection.sfcNumber) });
        
                        let days = this._calculateDaysSince(dataCollection.created);
                        if(days>=3){
                            await sfc.invalidate(); 
                            messages.push({ messageType: "S",
                                            messageValue: this._textHandler.getTExt("success.piq.downTimeClosed",dataCollection.sfcNumber) });
                        }
                    }
                }catch(error){
                    if(!error.displayType){
                        let errorMessage = this._errorHandler.getTextFromError(error);
                        messages.push({ messageType: "E",
                                        messageValue: errorMessage  });
                    }
                    
                }
            }catch(error){
                let errorMessage = this._errorHandler.getTextFromError(error);
                messages.push({messageType: "E",
                messageValue: errorMessage  });
            }
            if(messages.length>0){
                let messageDisplay = new MessageDisplay(messages);
                await messageDisplay.displayAsPopup();
            }




        },
        _getDummyOrder: function(){
            this._dummyOrder = this._controller.getConfigurationValue("dummyOrder");

            if(!this._dummyOrder||this._dummyOrder===""){
                this._errorHandler.throwErrorPopup("error.logHU.noDummyOrder");
            }
        }, 
        _getResources: async function(){
            // this._workCenter = await WorkCenterRepository.getInstance(this._controller, this._parameters.plant, this._parameters.workCenter );
            // this._resources = this._workCenter.getResources();
            
        },
        _getSfcs: async function(){
            this._order = await OrderRepository.readOrderByPassBuffer(this._controller, this._parameters.plant, this._dummyOrder);
            this._sfcs = this._order.getSfcs();
        },
        _getDataCollections: async function(){
            let collectionsApi = await this._getDataCollectionsFromApi();
            collectionsApi = collectionsApi.filter(collection => {return collection!==null&&collection!==undefined });
            let result = [];
            for(let collectionFromApi of collectionsApi){
                if(!collectionFromApi.data){
                    collectionFromApi.data = [];
                }
                const latestParams = {};

                collectionFromApi.data.forEach(item => {
                  const param = item.parameter;
                  const name = param.measureName;
                  const created = new Date(param.dateCreated);
                
                  if (!latestParams[name] || created > latestParams[name].created) {
                    latestParams[name] = {
                      created,
                      actual: param.actual
                    };
                  }
                });

                const myStructure = {};

                for (const [name, { actual, created }] of Object.entries(latestParams)) {
                    if (name === "READINGS") {
                      const readings = {};
                      actual.split("||").forEach(pair => {
                        // const [key, value] = pair.split(":");
                        // readings[key] = value === "null" ? null : value;
                        const index = pair.indexOf(":");
                        if (index !== -1) {
                          const key = pair.substring(0, index);
                          const value = pair.substring(index + 1);
                          readings[key] = value === "null" ? null : value;
                        }

                      });
                      myStructure[name] = readings;
                      myStructure.created = created;
                    } else {
                      myStructure[name] = actual;
                    }
                }
                if(myStructure.READINGS && myStructure.ACTUAL_TIMESTAMP&&myStructure.READINGS.RESOURCE === this._parameters.resource){
                    myStructure.sfcNumber = collectionFromApi.sfcNumber;
                    result.push(myStructure);
                }
            }
            
            return result;
        },
        _updateDt: async function(dataCollection, reasonCodeId){
            let url = this._controller.getOeeTransactionRestDataSourceUri() + "downtimes";

            let parameters = { plant: this._parameters.plant,
                               resource: dataCollection.READINGS.RESOURCE,
                               startDateTime: this._convertToApiFormat(dataCollection.ACTUAL_TIMESTAMP),
                               updateDowntimes: [{
                                    comments: "",
                                    endDateTime: this._convertToApiFormat(dataCollection.READINGS.FINISH),
                                    markParentDown: false,
                                    plant: this._parameters.plant,
                                    reasonCodeId: reasonCodeId,
                                    resource: dataCollection.READINGS.RESOURCE,
                                    startDateTime: this._convertToApiFormat(dataCollection.READINGS.BEGIN),
                                    status: 5
                               }]
            };
            

            return await new Promise((resolve,reject)=>{
                AjaxUtil.put(url, parameters,
                     (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }
                );
            });         

        },
        _saveNewStartTime: async function(dataCollection){
            let parameterValues = [];
            if(dataCollection.ACTUAL_TIMESTAMP === dataCollection.READINGS.BEGIN ){ return };
            parameterValues.push({ name: 'ACTUAL_TIMESTAMP',
                                    value: dataCollection.READINGS.BEGIN });

            let sUrl = this._controller.getPublicApiRestDataSourceUri() + "datacollection/v1/log";
            let oRequestParameters = {
                plant: this._parameters.plant,
                group: { dcGroup: "DOWNTIMES",
                         version: "1" },
                operation: { operation: "DUMMY_OPERATION",
                              version: "A" },
                parameterValues: parameterValues,
                resource: "DUMMY_RESOURCE",
                sfcs: [ dataCollection.sfcNumber ]
            };

            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPostRequest(sUrl, oRequestParameters,
                    oResponseData => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {                        
                        resolve();
                    }
                );
            });

        },
        _getDataCollectionsFromApi: async function(){
            let calledPromises = [];
            let calledAdditionalPromises = [];

            for(const sfc of this._sfcs){
                calledPromises.push(this._getCollectionsPromise(sfc));
            }

            let results = await Promise.all(calledPromises);
            for(const result of results){
                if(result.numberOfPages>1){
                    for(let i=1;i<result.numberOfPages;i++){
                        calledAdditionalPromises.push(this._getCollectionsPromiseForSfcStep(result.sfcNumber, i))
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
                                dcGroup: { name: "DOWNTIMES",
                                           version: "1" },
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
        _getOeeCodes: async function(codes){
            let calledPromises = [];
            let results = [];
            for(const code of codes){
                calledPromises.push(this._getOeeCodeApi(code));
            }
            if(calledPromises.length>0){
                results = await Promise.all(calledPromises);
            }

            return results;

        },
        _getOeeCodeApi: async function(code){
            let oReturn = { code: code.code,
                resource: code.resource,
                reasonCodeId: "" };
                
            let sUrl = this._controller.getPublicApiRestDataSourceUri() + "resourceReasonCode/v1/resourceReasonCodes";
            let oRequestParameters = { plant: this._parameters.plant,
                                       machineCode: code.code,
                                       resource: code.resource };


            return new Promise((resolve,reject)=>{
                this._controller.ajaxGetRequest(sUrl, oRequestParameters,
                     (oResponseData) => {
                        if(oResponseData.length>0){
                            try{
                                oReturn.reasonCodeId = oResponseData[0].keyId;
                            }catch(error){}
                        }
                        resolve(oReturn);
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve(oReturn);
                    }
                );
            });
        },

        _convertToApiFormat: function(isoString) {
            const date = new Date(isoString);
            return date.toISOString(); 
          },
        _calculateDaysSince: function(inputDate){
            const today = new Date();
            inputDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
          
            const diffMs = today - inputDate;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          
            return diffDays;
        }


    });
});