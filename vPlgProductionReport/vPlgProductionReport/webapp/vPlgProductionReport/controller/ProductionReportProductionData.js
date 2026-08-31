sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/WorkCenterRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/GeneralTools",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (ObjectUI5, WorkCenterRepository, OrderRepository, GeneralTools, MaterialRepository, TextHandler) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.vPlgProductionReport.vPlgProductionReport.controller.ProductionReportProductionData", {
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

            if(!this._parameters.date&&!this._parameters.orderNumber){
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
            let dcTransformed = this._transformDC(productionDCParameters);


            dcTransformed = this._getLatestRecords(dcTransformed);
            dcTransformed = dcTransformed.filter(dc=>{return ( dc["Q1/Q3"] === "Q1" || dc["Q1/Q3"] === "Q3" ) && dc.MATERIAL && dc.CANCELLED === "false" });
            if(this._parameters.orderNumber){
                dcTransformed = dcTransformed.filter(dc=>{return dc.sfc.substring(0, this._parameters.orderNumber.length) === this._parameters.orderNumber});
            }
            if(dcTransformed.length>0){
                dcTransformed = await this._excludeStornedDC(dcTransformed);
            }
            
            await this._callMaterialInstances(dcTransformed);
            let orderInstances = await this._getOrderInstances(dcTransformed);
            for(const dc of dcTransformed){
                let materialInstance = await MaterialRepository.getMaterialInstance(this._controller, this._parameters.plant, dc.MATERIAL);
                dc.materialDescription = materialInstance.getDescription();
                dc.shift = GeneralTools.getProductionShift(dc.DATE_CREATED);
                dc.Q2_DESTINATION = "";
                dc.QUANTITIES = [];
                let materialUoms = materialInstance.getUomProductionReport();
                for(const materialUom of materialUoms){
                    if(materialUom.uom!=="M2"&&materialUom.uom!=="M3"){
                        dc.QUANTITIES.push({
                            quantity: dc.QUANTITY = GeneralTools.roundQuantity(materialInstance.convertUom(dc.QUANTITY, dc.UOM, materialUom.uom), materialUom.uom),
                            uom: materialUom.uom,
                            uomDesc: materialUom.uomDesc
                        })
                    }else{
                        let ITEM_NO = 1;
                        if(dc.ITEM_NO){
                            ITEM_NO = parseInt(dc.ITEM_NO);
                        }
                        let orderInstance = orderInstances.find(instance=>{return instance.orderNumber === dc.orderNumber});
                        if(orderInstance){
                            if(materialUom.uom==="M2"){
                                dc.QUANTITIES.push({
                                    quantity: dc.QUANTITY * orderInstance.instance.getConverterM2(ITEM_NO),
                                    uom: materialUom.uom,
                                    uomDesc: materialUom.uomDesc });
                            }else{
                                dc.QUANTITIES.push({
                                    quantity: dc.QUANTITY * orderInstance.instance.getConverterM2(ITEM_NO) * ( materialInstance.getThicknessAsInteger() / 1000 ),
                                    uom: materialUom.uom,
                                    uomDesc: materialUom.uomDesc });
                            }
                        }
                    }

                }

                //dc.orderNumber = dc.sfc.split("_")[0];
                dc.formattedDate = this._getReportDate(dc.DATE_CREATED);// new Date(dc.DATE_CREATED).toISOString().split("T")[0];
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

        _getReportDate: function(dateString) {
            const date = new Date(dateString);
            const hours = date.getHours();
            if (hours < 6) {
                date.setDate(date.getDate() - 1);
            }
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
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
            const dataCollectionsQ23 = dataCollections.filter(dc => dc["Q1/Q3"] === "Q3");
            const sfcs = dataCollectionsQ23.map(dc => dc.sfc);

            if (sfcs.length > 0) {
                const workCenter = await WorkCenterRepository.getInstance(
                    this._controller,
                    this._parameters.plant,
                    this._parameters.workCenter
                );

                const resources = workCenter.getResources();
                const MAX_SFCS_PER_REQUEST = 15;
                const MAX_CONCURRENT_REQUESTS = 20;
                const sfcChunks = this._chunkArray(sfcs, MAX_SFCS_PER_REQUEST);
                const tasks = [];

                for (const resource of resources) {
                    for (const sfcChunk of sfcChunks) {
                        tasks.push(async () => {
                            const requestParameters = this._getQ2RequestParameters(resource, sfcChunk);
                            const firstResult = await this._callApi(requestParameters);

                            let chunkResults = [];
                            chunkResults = chunkResults.concat(firstResult);

                            const numberOfPages = firstResult.numberOfPages || 1;

                            if (numberOfPages > 1) {
                                const pageNumbers = [];
                                for (let page = 1; page < numberOfPages; page++) {
                                    pageNumbers.push(page);
                                }

                                for (let i = 0; i < pageNumbers.length; i += MAX_CONCURRENT_REQUESTS) {
                                    const pageBatch = pageNumbers.slice(i, i + MAX_CONCURRENT_REQUESTS);

                                    const batchPromises = pageBatch.map((pageNumber) => {
                                        const pagedRequestParameters = this._getQ2RequestParameters(resource, sfcChunk);
                                        pagedRequestParameters.pageNumber = pageNumber;
                                        return this._callApi(pagedRequestParameters);
                                    });

                                    const batchResults = await Promise.all(batchPromises);
                                    chunkResults.push(...batchResults);
                                }
                            }
                            return chunkResults;
                        });
                    }
                }

                for (let i = 0; i < tasks.length; i += MAX_CONCURRENT_REQUESTS) {
                    const taskBatch = tasks.slice(i, i + MAX_CONCURRENT_REQUESTS);
                    const batchResults = await Promise.all(taskBatch.map(task => task()));

                    for (const partialResult of batchResults) {
                        result.push(...partialResult);
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
            const grouped = {};

            for (const item of productionDataCollections) {
                const key = `${item.sfc}__${item.dateCreated}`;

                if (!grouped[key]) {
                    grouped[key] = {
                        sfc: item.sfc,
                        dcDate: item.dateCreated
                    };
                    grouped[key]["orderNumber"] = item.sfc.split("_")[0];
                }

                grouped[key][item.measureName] = item.actual;
            }

            return Object.values(grouped);
        },





_getDataCollections: async function () {
    let result = [];

    const workCenter = await WorkCenterRepository.getInstance(
        this._controller,
        this._parameters.plant,
        this._parameters.workCenter
    );

    const resources = workCenter.getResources();

    let sfcs = null;

    if (this._parameters.orderNumber) {
        const orderInstance = await OrderRepository.readOrderByPassBuffer(
            this._controller,
            this._parameters.plant,
            this._parameters.orderNumber
        );
        sfcs = orderInstance.getSfcs() || [];
    }

    const maxConcurrentRequests = 20;
    const sfcBatchSize = 20;

    const chunkArray = (array, size) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    };

    const fetchAllPagesForRequest = async (resource, sfcsBatch) => {
        let localResult = [];

        const requestParameters = this._getRequestParameters(resource, sfcsBatch);
        const firstResult = await this._callApi(requestParameters);

        localResult = localResult.concat(firstResult);

        const numberOfPages = firstResult.numberOfPages || 1;

        if (numberOfPages > 1) {
            const remainingPages = [];
            for (let page = 1; page < numberOfPages; page++) {
                remainingPages.push(page);
            }

            for (let i = 0; i < remainingPages.length; i += maxConcurrentRequests) {
                const pageBatch = remainingPages.slice(i, i + maxConcurrentRequests);

                const batchPromises = pageBatch.map((pageNumber) => {
                    const pagedRequestParameters = this._getRequestParameters(resource, sfcsBatch);
                    pagedRequestParameters.pageNumber = pageNumber;
                    return this._callApi(pagedRequestParameters);
                });

                const batchResults = await Promise.all(batchPromises);

                for (const pageResult of batchResults) {
                    localResult = localResult.concat(pageResult);
                }
            }
        }

        return localResult;
    };

    for (const resource of resources) {
        if (sfcs && sfcs.length > 0) {
            const sfcBatches = chunkArray(sfcs, sfcBatchSize);

            for (const sfcBatch of sfcBatches) {
                const batchResult = await fetchAllPagesForRequest(resource, sfcBatch);
                result = result.concat(batchResult);
            }
        } else {
            const resourceResult = await fetchAllPagesForRequest(resource, sfcs);
            result = result.concat(resourceResult);
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
                "dcGroup.name": "Q2_DESTINATION",
                "dcGroup.version": "1",
                // dcGroup: { name: "Q2_DESTINATION",
                //            version: "1" },
                pageSize: 50,
                pageNumber: 0,
            };
            return result;
        },

        _getRequestParameters: function(resource, sfcs, addShiftTimes = true){
            let result = {
                plant: this._parameters.plant,
                resource: resource,
                "dcGroup.name": "WOODECO_PROD_ACTIVITY",
                "dcGroup.version": "A",
                // dcGroup: { name: "WOODECO_PROD_ACTIVITY",
                //            version: "A" },
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

        _excludeStornedDC: async function (dataCollections) {
            const result = [];
            const productionDCParameters = [];
            const sfcs = [...new Set(dataCollections.map(dc => dc.sfc))];

            const workCenter = await WorkCenterRepository.getInstance(
                this._controller,
                this._parameters.plant,
                this._parameters.workCenter
            );

            const resources = workCenter.getResources();

            const sfcBatchSize = 10;
            const maxConcurrentRequests = 15;

            const sfcChunks = this._chunkArray(sfcs, sfcBatchSize);

            const fetchAllPagesForRequest = async (resource, sfcChunk) => {
                let localResult = [];

                const requestParameters = this._getRequestParameters(resource, sfcChunk, false);
                const firstResult = await this._callApi(requestParameters);

                localResult = localResult.concat(firstResult);

                const numberOfPages = firstResult?.numberOfPages || 1;

                if (numberOfPages > 1) {
                    const remainingPages = [];

                    for (let page = 1; page < numberOfPages; page++) {
                        remainingPages.push(page);
                    }

                    const pageTasks = remainingPages.map(pageNumber => async () => {
                        const pagedRequestParameters = this._getRequestParameters(resource, sfcChunk, false);
                        pagedRequestParameters.pageNumber = pageNumber;

                        return await this._callApi(pagedRequestParameters);
                    });

                    const pageResults = await this._runWithConcurrencyLimit(
                        pageTasks,
                        maxConcurrentRequests
                    );

                    for (const pageResult of pageResults) {
                        localResult = localResult.concat(pageResult);
                    }
                }

                return localResult;
            };

            const tasks = resources.flatMap(resource =>
                sfcChunks.map(sfcChunk => async () => {
                    return await fetchAllPagesForRequest(resource, sfcChunk);
                })
            );

            const productionDataCollectionsNested = await this._runWithConcurrencyLimit(
                tasks,
                maxConcurrentRequests
            );

            const productionDataCollections = productionDataCollectionsNested.flat();

            for (const dataCollection of productionDataCollections) {
                if (!dataCollection?.data) {
                    continue;
                }

                for (const dataRow of dataCollection.data) {
                    dataRow.parameter.sfc = dataRow.sfc;
                    productionDCParameters.push(dataRow.parameter);
                }
            }

            let dcStornedTransformed = this._transformDC(productionDCParameters);

            dcStornedTransformed = dcStornedTransformed.filter(dc => {
                return dc.CANCELLED === "true";
            });

            for (const dataCollection of dataCollections) {
                const dcStorned = dcStornedTransformed.find(dc => {
                    return dc.GUID === dataCollection.GUID;
                });

                if (!dcStorned) {
                    result.push(dataCollection);
                }
            }

            return result;
        },

        _chunkArray: function (array, size) {
            const result = [];
            for (let i = 0; i < array.length; i += size) {
                result.push(array.slice(i, i + size));
            }
            return result;
        },

        _runWithConcurrencyLimit: async function (tasks, limit) {
            const results = [];

            for (let i = 0; i < tasks.length; i += limit) {
                const batch = tasks.slice(i, i + limit);
                const batchResults = await Promise.all(batch.map(task => task()));
                results.push(...batchResults);
            }

            return results;
        },
        _getOrderInstances: async function(dcTransformed){
            let orders = dcTransformed.map(dc => dc.orderNumber);


            return await OrderRepository.massOrderRead(this._controller, this._parameters.plant, orders);
        }
        

    });
});