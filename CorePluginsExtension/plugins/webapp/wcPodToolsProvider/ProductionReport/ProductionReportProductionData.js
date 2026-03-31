sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/WorkCenterRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/GeneralTools",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (ObjectUI5, WorkCenterRepository, OrderRepository, GeneralTools, MaterialRepository, TextHandler) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.ProductionReport.ProductionReportProductionData", {
        constructor: function(controller, parameters){
            this._controller = controller;
            this._parameters = parameters;
            this._textHandler = new TextHandler();
            ///parameters:
            ///plant
            ///workCenter
            ///resource
            ///date
            ///orderNumber
            ///shiftNumber
            ///shiftStart
            ///shiftStop
            ///
        },
        getData: async function(){
            let result = [];

            if(!this._parameters.date&&!this._parameters.oderNumber){
                return result;
            }

            let productionDataCollections = await this._getDataCollections();
            let productionDCParameters = [];

            for(const dataCollection of productionDataCollections){
                for(const dataRow of dataCollection.data){
                    dataRow.parameter.sfc = dataRow.sfc;
                    productionDCParameters.push(dataRow.parameter);
                }
            }
            debugger;
            let dcTransformed = this._transformDC(productionDCParameters);
            //dcTransformed = this._getLatestRecords(dcTransformed);
            dcTransformed = dcTransformed.filter(dc=>{return ( dc["Q1/Q3"] === "Q1" || dc["Q1/Q3"] === "Q3" ) && dc.MATERIAL && dc.CANCELLED === "false" });
            if(dcTransformed.length>0){
                dcTransformed = await this._excludeStornedDC(dcTransformed);
            }
            
            await this._callMaterialInstances(dcTransformed);
            for(const dc of dcTransformed){
                let materialInstance = await MaterialRepository.getMaterialInstance(this._controller, this._parameters.plant, dc.MATERIAL);
                dc.materialDescription = materialInstance.getDescription();
                dc.shift = GeneralTools.getProductionShift(dc.DATE_CREATED);
                dc.Q2_DESTINATION = "";
                dc.QUANTITIES = [];
                let materialUoms = materialInstance.getUomProductionReport();
                for(const materialUom of materialUoms){
                    dc.QUANTITIES.push({
                        quantity: dc.QUANTITY = GeneralTools.roundQuantity(materialInstance.convertUom(dc.QUANTITY, dc.UOM, materialUom.uom), materialUom.uom),
                        uom: materialUom.uom,
                        uomDesc: materialUom.uomDesc
                    })
                }

                dc.orderNumber = dc.sfc.split("_")[0];
                dc.formattedDate = new Date(dc.DATE_CREATED).toISOString().split("T")[0];
            }
            let q2Destinations = await this._getQ2Destination(dcTransformed);
            for(const q2Destination of q2Destinations){
                let q2Dc = dcTransformed.find(dc=>{return dc.sfc === q2Destination.sfc && dc["Q1/Q3"] === "Q3"});
                if(q2Dc){
                    q2Dc.Q2_DESTINATION = q2Destination.q2Destination;
                }
            }


            return dcTransformed;

        },
        _getQ2Destination: async function(dataCollections){
            let result = [];
            let q2DataCollections = await this._getQ2DestinationDc(dataCollections);

            for(const dataCollection of q2DataCollections){
                let parametersDestination = dataCollection.data.filter(parameter=>{return parameter.parameter.measureName === "DESTINATION"});
                for(const parameterDestination of parametersDestination){
                    result.push({
                        sfc: parameterDestination.sfc,
                        q2Destination: this._getq2DestinationDescription(parameterDestination.parameter.actual)
                    })
                }
            }
            return result;

        },

        _getq2DestinationDescription: function(q2Destination){
            let result = "";
            if(q2Destination==="SCRAP"){
                result = this._textHandler.getText("labels.q23.buttonScrap");
            }else if(q2Destination==="RETURN"){
                result = this._textHandler.getText("labels.q23.buttonReturn");
            }else if(q2Destination==="PACKAGING"){
                result = this._textHandler.getText("labels.q23.buttonPackaging");
            }

            return result;
        },

        _getQ2DestinationDc: async function(dataCollections){
            let result = [];
            let dataCollectionsQ23 = dataCollections.filter(dc=>{return dc["Q1/Q3"] === "Q3" });
            let sfcs = [];

            for(const dc of dataCollectionsQ23){
                sfcs.push(dc.sfc);
            }

            if(sfcs.length>0){
                let workCenter = await WorkCenterRepository.getInstance(this._controller ,this._parameters.plant, this._parameters.workCenter);
                let resources = workCenter.getResources();
                for(const resource of resources){
                    let requestParameters = this._getQ2RequestParameters(resource, sfcs);
                    let firstResult = await this._callApi(requestParameters);
                    result = result.concat(firstResult);

                    const numberOfPages = firstResult.numberOfPages || 1;

                    if(numberOfPages>1){
                        const maxConcurrentRequests = 20;
                        const remainingPages = [];
                        for (let page = 1; page < numberOfPages; page++) {
                            remainingPages.push(page);
                        }
                        for (let i = 0; i < remainingPages.length; i += maxConcurrentRequests) {
                            const pageBatch = remainingPages.slice(i, i + maxConcurrentRequests);

                            const batchPromises = pageBatch.map((pageNumber) => {
                                let requestParameters = this._getRequestParameters(resource, sfcs);
                                requestParameters.pageNumber = pageNumber;
                                return this._callApi(requestParameters);
                            });

                            const batchResults = await Promise.all(batchPromises);
                            result.push(...batchResults);
                        }
                    }
                }


            }



            return result;
        },
        _callMaterialInstances: async function(dataCollections){
          let materialInstancePromises = [];
          let calledMaterials = [];
          for(const dataCollection of dataCollections){
            let materialCalled = calledMaterials.find(calledMaterial => {return calledMaterial === dataCollection.MATERIAL});
            if(!materialCalled){
              calledMaterials.push(dataCollection.MATERIAL);
              materialInstancePromises.push(MaterialRepository.getMaterialInstance(this._controller, this._parameters.plant, dataCollection.MATERIAL));
            }
          }

          if(materialInstancePromises.length>0){
            await Promise.all(materialInstancePromises);
          }
        },
        _getLatestRecords: function(data) {
            const grouped = {};

            for (const item of data) {
                const key = `${item.sfc}__${item.OPERATION}`;
                const currentDate = new Date(item.dataDC);

                if (!grouped[key]) {
                grouped[key] = item;
                } else {
                const existingDate = new Date(grouped[key].dataDC);

                if (currentDate > existingDate) {
                    grouped[key] = item;
                }
                }
            }

            return Object.values(grouped);
        },

        _transformDC: function(productionDataCollections){
            // const latestBySfcAndMeasure = new Map();
            // for (const row of productionDataCollections) {
            //     const { sfc, measureName, actual, dateCreated } = row;
            //     const key = `${sfc}__${measureName}`;

            //     const existing = latestBySfcAndMeasure.get(key);

            //     if (!existing || new Date(dateCreated) > new Date(existing.dateCreated)) {
            //         latestBySfcAndMeasure.set(key, {
            //             sfc,
            //             measureName,
            //             actual,
            //             dateCreated
            //         });
            //     }
            // }

            // const resultBySfc = new Map();

            // for (const row of latestBySfcAndMeasure.values()) {
            //     if (!resultBySfc.has(row.sfc)) {
            //         resultBySfc.set(row.sfc, { sfc: row.sfc });
            //     }

            //     const sfcObject = resultBySfc.get(row.sfc);
            //     let value = row.actual;
            //     if (row.measureName === "QUANTITY") {
            //         value = parseInt(row.actual)||0;
            //     }
            //     sfcObject[row.measureName] = value;
            // }

            // return Array.from(resultBySfc.values());
        const grouped = {};

        for (const item of productionDataCollections) {
            const key = `${item.sfc}__${item.dateCreated}`;

            if (!grouped[key]) {
            grouped[key] = {
                sfc: item.sfc,
                dcDate: item.dateCreated
            };
            }

            grouped[key][item.measureName] = item.actual;
        }

        return Object.values(grouped);


        },

        _getDataCollections: async function(){
            let result = [];

            let sfcs;
            let workCenter = await WorkCenterRepository.getInstance(this._controller ,this._parameters.plant, this._parameters.workCenter);
            let resources = workCenter.getResources();
            if(this._parameters.orderNumber){
                let orderInstance = await OrderRepository.readOrderByPassBuffer(this._controller, this._parameters.plant, this._parameters.orderNumber);
                sfcs = orderInstance.getSfcs();
            }
            for(const resource of resources){
                let requestParameters = this._getRequestParameters(resource, sfcs);
                let firstResult = await this._callApi(requestParameters);
                result = result.concat(firstResult);

                const numberOfPages = firstResult.numberOfPages || 1;

                if(numberOfPages>1){
                    const maxConcurrentRequests = 20;
                    const remainingPages = [];
                    for (let page = 1; page < numberOfPages; page++) {
                        remainingPages.push(page);
                    }
                    for (let i = 0; i < remainingPages.length; i += maxConcurrentRequests) {
                        const pageBatch = remainingPages.slice(i, i + maxConcurrentRequests);

                        const batchPromises = pageBatch.map((pageNumber) => {
                            let requestParameters = this._getRequestParameters(resource, sfcs);
                            requestParameters.pageNumber = pageNumber;
                            return this._callApi(requestParameters);
                        });

                        const batchResults = await Promise.all(batchPromises);
                        result.push(...batchResults);
                    }
                }
            }
            return result;
        },
        _callApi: async function(request){
            let sUrl = this._controller.getPublicApiRestDataSourceUri() + "datacollection/v1/measurements";

            return await new Promise((resolve,reject)=>{
                this._controller.ajaxGetRequest(sUrl, request,
                    (oResponseData) => {
                        if(!oResponseData.data){
                            oResponseData.data = [];
                        }
                        resolve(oResponseData);
                        
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },
        _getQ2RequestParameters: function(resource, sfcs){
            let result = {
                plant: this._parameters.plant,
                sfcs: sfcs,
                resource: resource,
                dcGroup: { name: "Q2_DESTINATION",
                           version: "1" },
                pageSize: 50,
                pageNumber: 0,
            };
            return result;
        },

        _getRequestParameters: function(resource, sfcs, addShiftTimes = true){
            let result = {
                plant: this._parameters.plant,
                resource: resource,
                dcGroup: { name: "WOODECO_PROD_ACTIVITY",
                           version: "A" },
                pageSize: 50,
                pageNumber: 0,
            };

            if(addShiftTimes){
                if(this._parameters.shiftStart){
                    result.startDateTime = GeneralTools.convertDateToIsoFormat(this._parameters.shiftStart);
                }

                if(this._parameters.shiftStop){
                    result.endDateTime = GeneralTools.convertDateToIsoFormat(this._parameters.shiftStop);
                }
            }

            if(sfcs){
                result.sfcs = sfcs;
            }

            return result;
        },

        _excludeStornedDC: async function(dataCollections){
            let result = [];
            let sfcs = [];
            let productionDataCollections = [];
            let productionDCParameters = [];

            for(const dc of dataCollections){
                let sfc = sfcs.find(row=>{return row === dc.sfc});
                if(!sfc){
                    sfcs.push(dc.sfc);
                }
            }
            let workCenter = await WorkCenterRepository.getInstance(this._controller ,this._parameters.plant, this._parameters.workCenter);
            let resources = workCenter.getResources();
            for(const resource of resources){
                let requestParameters = this._getRequestParameters(resource, sfcs, false);
                let firstResult = await this._callApi(requestParameters);
                productionDataCollections.push(firstResult);
                debugger;
            }

            for(const dataCollection of productionDataCollections){
                for(const dataRow of dataCollection.data){
                    dataRow.parameter.sfc = dataRow.sfc;
                    productionDCParameters.push(dataRow.parameter);
                }
            }
            debugger;
            let dcStornedTransformed = this._transformDC(productionDCParameters);
            dcStornedTransformed = dcStornedTransformed.filter(dc=>{return dc.CANCELLED === "true"});
            for(const dataCollection of dataCollections){
                let dcStorned = dcStornedTransformed.find(dc=>{ return dc.GUID === dataCollection.GUID });
                if(!dcStorned){
                    result.push(dataCollection);
                }
            }

            return result;
        }
        

    });
});