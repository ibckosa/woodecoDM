sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository"
], function (ObjectUI5, SfcRepository) {
    "use strict";
    let dataCollectionReader = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.SfcDataCollectionReader", {
    });


    dataCollectionReader.readCollections = async function(controller, plant, sfcs, operation="", getStornedCollections=true, getAllCollections=false, routing, routingVersion){
        let result = [];
        // this._controller = controller;
        // this._sfcs = sfcs;
        // this._plant = plant;
        // this._operation = operation;
        // this._getStornedCollections = getStornedCollections;
        // this._getAllCollections = getAllCollections;

        let dataCollectionsFromApi = await this._getCollectionsFromApi(controller, plant, sfcs, operation, getAllCollections, routing, routingVersion);

        for(let collectionFromApi of dataCollectionsFromApi){
            if(!collectionFromApi.data){
                collectionFromApi.data = [];
            }
            let groupedTable = collectionFromApi.data.reduce((acc, { plant, parameter: { measureName, actual, dateCreated } }) => {
                if (!acc[dateCreated]) {
                  const structure = this._getStructure()
                  acc[dateCreated] = structure.reduce((obj, param) => {
                    obj[param] = null; 
                    return obj;
                  }, { PLANT: plant, CREATED_DATETIME: dateCreated }); 
                }
                acc[dateCreated].CREATED_DATETIME = dateCreated;
                acc[dateCreated].SFC_NUMBER = collectionFromApi.sfcNumber;
                acc[dateCreated].SFC_STEP = collectionFromApi.sfcStep;
                if (measureName === 'CONSUMPTION') {
                  if(actual){
                    let consumptionConverted = this._convertConsumption(actual);
                    if (!acc[dateCreated].CONSUMPTION) {
                      acc[dateCreated].CONSUMPTION = [];
                    }
                    acc[dateCreated].CONSUMPTION.push(consumptionConverted); 
                  }
                } else {
                  acc[dateCreated][measureName] = actual;
                }

                return acc;
            }, {});

            groupedTable = Object.values(groupedTable);
            let latestEntries = groupedTable.reduce((acc, { GUID, CREATED_DATETIME, ...otherFields }) => {
                if (!acc[GUID] || new Date(CREATED_DATETIME) > new Date(acc[GUID].CREATED_DATETIME)) {
                  acc[GUID] = { GUID, CREATED_DATETIME, ...otherFields };
                }
                return acc;
              }, {});


            
            for (const [key, record] of Object.entries(latestEntries)) {
                if(!record.DATE_CREATED){
                    record.DATE_CREATED = record.CREATED_DATETIME;
                }
                result.push(record);
            }

            if(getStornedCollections === false){
                result = result.filter( row => {return row.GUID && row.CANCELLED !== "true"});
            }
            
            
        }

        result.sort((a, b) => new Date(b.DATE_CREATED) - new Date(a.DATE_CREATED));

        return result;
    };

    dataCollectionReader._getCollectionsFromApi = async function(controller, plant, sfcs, operation, getAllCollections, routing, routingVersion){
        let calledPromises = [];
        let calledAdditionalPromises = [];
        

        let sfcsInstances = await this._getSfcsInstances(controller, plant, sfcs, routing, routingVersion);
        for(const sfcInstance of sfcsInstances){
            let lastStep = sfcInstance.getLastStep();
            let sfcSteps = sfcInstance.getSteps();
            for(const sfcStep of sfcSteps){
                if( getAllCollections ||
                    sfcInstance.checkIsLastOperation(sfcStep.operation.operation) || 
                    !sfcInstance.getIsMultiOperation() ||
                    (sfcStep.quantityScrapped > 0) ||
                    ( lastStep.quantityDone === 0 && lastStep.quantityScrapped === 0 )
                ){
                    if(operation){
                        if(operation === sfcStep.operation.operation){
                            calledPromises.push(this._getCollectionsPromiseForSfcStep(sfcInstance.getSfcNumber(), sfcStep, plant, controller ));
                        }
                    }else{
                        calledPromises.push(this._getCollectionsPromiseForSfcStep(sfcInstance.getSfcNumber(), sfcStep, plant, controller ));
                    }
                }                
            }
        }
        let results = await Promise.all(calledPromises);

        for(const result of results){
            if(result.numberOfPages>1){
                for(let i=1;i<result.numberOfPages;i++){
                    calledAdditionalPromises.push(this._getCollectionsPromiseForSfcStep(result.sfcNumber, result.sfcStep,  plant, controller, i))
                }
            }
        }
        if(calledAdditionalPromises.length>0){
            let additionalResults = await Promise.all(calledAdditionalPromises);

            for(const additionalResult of additionalResults){
                const result = results.find( result => {return result.sfcNumber === additionalResult.sfcNumber && 
                                                               result.sfcStep.stepId === additionalResult.sfcStep.stepId });

                if(result){
                    for(let parameter of additionalResult.data){
                        result.data.push(parameter);
                    }
                }
            }
        }
        return results;
    };

    dataCollectionReader._getSfcsInstances = async function(controller, plant, sfcs, routing, routingVersion){
        let sfcsDetailsPromises = [];
        for(const sfc of sfcs){
            sfcsDetailsPromises.push(SfcRepository.ReadSfcBypassBuffer(controller, plant, sfc, routing, routingVersion, false)); 
        }

        let sfcsInstances = await Promise.all(sfcsDetailsPromises);
        sfcsInstances = sfcsInstances.filter( instance => {return instance });
        return sfcsInstances;
    };
    dataCollectionReader._getCollectionsPromiseForSfcStep = async function(sfcNumber, sfcStep, plant, controller, pageNumber=0){
        let sUrl = controller.getPublicApiRestDataSourceUri() + "datacollection/v1/measurements";

        let oParameters = { plant: plant,
                            sfcs:  [sfcNumber],
                            dcGroup: { name: "WOODECO_PROD_ACTIVITY",
                                       version: "A" },
                            operation: { name: sfcStep.operation.operation,
                                         version: sfcStep.operation.version },
                            pageNumber: pageNumber,
                            pageSize: 50 };
        return await new Promise((resolve,reject)=>{
            controller.ajaxGetRequest(sUrl, oParameters,
                (oResponseData) => {
                    oResponseData.sfcNumber = sfcNumber;
                                        oResponseData.sfcStep = sfcStep;
                    resolve(oResponseData);
                },
                (oError, sHttpErrorMessage) => {
                    reject(oError);
                }   
            );

        });

    };
    dataCollectionReader._getStructure = function(){
        return ['GUID', "CREATED_DATETIME", "DATE_CREATED", "SFC_NUMBER", "SFC_STEP", "Q1/Q3", "Q3_CODE", "QUANTITY", "UOM", "MATERIAL", "ITEM_NO", "SALES_ORDER", "SALES_ORDER_ITEM", "HU", "CANCELLED", "USER", "CONSUMPTION", "NC_CODE", "NC_CODE_DESCRIPTION"];
    };
    dataCollectionReader._convertConsumption = function(consumptionValue){
        let consumptionStructure = {
            txnId: "",
            issueGuid: "",
            stepId: "",
            order: "",
            operation: "",
            quantity: 0,
            uom: "",
            handlingUnit: "",
            storageLocation: "",
            material: "",
            materialVersion: "",
            sfc: ""
        };

        let oSplittedLine = consumptionValue.split("||");

        let values = oSplittedLine
        .filter(item => item.includes(":")) 
        .map(item => {
          const colonIndex = item.indexOf(":");
          const field_name = item.substring(0, colonIndex).trim();
          const field_value = item.substring(colonIndex + 1).trim();
          return { field_name, field_value };
        });


        for(const value of values){
            switch(value.field_name){
                case "txnId":
                    consumptionStructure.txnId = value.field_value;
                    break;
                case "issueGuid":
                    consumptionStructure.issueGuid = value.field_value;
                    break;
                case "stepId":
                    consumptionStructure.stepId = value.stepId;
                    break;
                case "order":
                    consumptionStructure.order = value.field_value;
                    break;
                case "operation":
                    consumptionStructure.operation = value.field_value;
                    break;
                case "quantity":
                    consumptionStructure.quantity = value.field_value;
                    break;
                case "uom":
                    consumptionStructure.uom = value.field_value;
                    break;
                case "handlingUnit":
                    consumptionStructure.handlingUnit = value.field_value;
                    break;
                case "storageLocation":
                    consumptionStructure.storageLocation = value.field_value;
                    break;
                case "material":
                    consumptionStructure.material = value.field_value;
                    break;
                case "materialVersion":
                    consumptionStructure.materialVersion = value.field_value;
                    break;
                case "sfc":
                    consumptionStructure.sfc = value.field_value;
                    break;
            }
        }
        return consumptionStructure;
    }

    return dataCollectionReader;
});