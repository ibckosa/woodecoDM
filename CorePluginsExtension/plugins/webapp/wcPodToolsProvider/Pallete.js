sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "ibc/dm/plugins/wcPodToolsProvider/DataCollectionSaver",
    "ibc/dm/plugins/wcPodToolsProvider/Issue"
], function (ManagedObject, ErrorHandler, SfcRepository, DataCollectionSaver, Issue) {
    "use strict";
    let Pallete = ManagedObject.extend("ibc.dm.plugins.wcPodToolsProvider.Pallete", {
        constructor: function(oContoller){
            this._oController = oContoller;
            this._oErrorHandler = new ErrorHandler(this._oController);
        },

        palleteReservation: async function(oPalleteDetails, oPlant, oOrder, oSequence){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "inventory/v2/inventories/"+`${oPalleteDetails.inventoryId}?plant=${oPlant}`;
            this._checkBeforeReservation(oPalleteDetails);

            let oAssemblyData = oPalleteDetails.dataFields.filter( assemblyData => { return assemblyData.dataField !== "RES_ITEM" } );
            

            oAssemblyData.push({ dataField: "RES_ITEM",
                                 dataAttribute: `${oOrder}_${oSequence}`  });

            let oParameters = { dataFields: oAssemblyData,
                lastModifiedDateTime: oPalleteDetails.modifiedDateTime
            };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPatchRequest(sUrl, oParameters,
                    (oResponseData) => {

                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },
        palleteEndReservation: async function(oPalleteDetails, oPlant){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "inventory/v2/inventories/"+`${oPalleteDetails.inventoryId}?plant=${oPlant}`;

            let oAssemblyData = oPalleteDetails.assemblyData.filter( assemblyData => { return assemblyData.dataField !== "RES_ITEM" && assemblyData.dataField !== "CONS_START" } );
            oAssemblyData.push({ dataField: "RES_ITEM",
                                 dataAttribute: null });
            oAssemblyData.push({ dataField: "CONS_START",
                                 dataAttribute: null });

            let oParameters = { dataFields: oAssemblyData,
                lastModifiedDateTime: oPalleteDetails.modifiedDateTime
            };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPatchRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },

        palleteReturn: async function(oLine, oEndPoint , quantity, dummyOrder, dummySfc){
            this._checkBeforeReturn(oLine , quantity);
            await this.reducePalleteQuan(oLine, quantity, dummyOrder, dummySfc);
            await this._palleteReturnZweiApi(oLine, oEndPoint , quantity);
        },

        _palleteReturnZweiApi: async function(oLine, oEndPoint , quantity){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + oEndPoint;
            let oSapDateTime = this._getCurrentSapDateTime();
            let oParameters = {};
            let oBatchNumber = '';
            let quantityToReturn = oLine.quantity;
            if(quantity<oLine.quantity){
                quantityToReturn = quantity;
                oLine.handlingUnit = oLine.palleteDetails.handlingUnit = await this.generateHuNumber(oLine.palleteDetails.material, oLine.palleteDetails.materialVersion, oLine.plant);
            }

            if(!oLine.palleteDetails.batchNumber){
                oBatchNumber = oLine.palleteDetails.handlingUnit;
            }else{
                oBatchNumber = oLine.palleteDetails.batchNumber;
            }


            oParameters = { WERK: oLine.plant,
                BEWART: "988",
                ZLO: "STOCK",
                LGORT: oLine.storageLocation,
                HU: oLine.palleteDetails.handlingUnit,
                CHARGE: oBatchNumber,
                MATNR: oLine.palleteDetails.material,
                MATTYP: "PACKAGES",
                MENGE: parseFloat(quantityToReturn),
                MENGE_EINH: oLine.uom,
                END_LIEF: "N",
                VVDAT: oSapDateTime.sapDate,
                VVZEI: oSapDateTime.sapTime,
                WDAT: "39991231",
                WZEI: "235959",
                VFDAT: "39991231",
                VFZEI: "235959",
                KLASSE: "A",
                MATST: "U",
                STATUS: "R",
                QST: "0",
                QSTMANU: "I",
                TST: "F",
                ATTR2: oLine.erpResourceId };

                return await new Promise((resolve,reject)=>{
                    this._oController.ajaxPostRequest(sUrl, oParameters,
                        (oResponseData) => {
                            resolve(oResponseData);
                        },
                        oError=>{
                            reject(oError);
                        }   
                    );
    
                });
        },
        palleteReturnNpw: async function(oLine, oEndPoint, oQuantity, dummyOrder, dummySfc){
            this._checkBeforeReturn(oLine , oQuantity);
            await this.reducePalleteQuan(oLine, oQuantity, dummyOrder, dummySfc);
            await this._palleteReturnNpwApiCall(oLine, oEndPoint, oQuantity);
            
        },
        _palleteReturnNpwApiCall: async function(oLine, oEndPoint, oQuantity){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + oEndPoint;
            let oSapDateTime = this._getCurrentSapDateTime();
            let oParameters = {};
            let oGeneratedHu = await this.generateHuNumber(oLine.palleteDetails.material, oLine.palleteDetails.materialVersion, oLine.plant);
            oLine.handlingUnit = oGeneratedHu;

            oParameters = { WERK: oLine.plant,
                BEWART: "551",
                ZLO: "STOCK",
                LGORT: oLine.storageLocation,
                HU: oGeneratedHu,
                CHARGE: oGeneratedHu,
                MATNR: oLine.palleteDetails.material,
                MATTYP: "PACKAGES",
                MENGE: parseFloat(oQuantity),
                MENGE_EINH: oLine.uom,
                END_LIEF: "N",
                VVDAT: oSapDateTime.sapDate,
                VVZEI: oSapDateTime.sapTime,
                MATST: "U",
                STATUS: "A",
                QST: "O",
                QSTMANU: "I",
                TST: "F",
                ATTR2: oLine.erpResourceId,
                FU_57: oLine.packingMaterial,
                EXTCNR: oLine.palleteDetails.handlingUnit };

                return await new Promise((resolve,reject)=>{
                    this._oController.ajaxPostRequest(sUrl, oParameters,
                        (oResponseData) => {
                            resolve(oResponseData);
                        },
                        oError=>{
                            reject(oError);
                        }   
                    );
    
                });
        },


        _getCurrentSapDateTime: function(){
            let today = new Date();
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

            return {
                sapDate: `${oYear}${oMonth}${oDay}`,
                sapTime: `${oHour}${oMinutes}${oSeconds}`
            };
        },
        _checkBeforeReservation: function(oPalleteDetails){
            let oReservation = oPalleteDetails.assemblyData.find( assemblyData => { return assemblyData.dataField === "RES_ITEM" } );
            if(oReservation&&oReservation.dataAttribute!==null&&oReservation.dataAttribute){
                this._oErrorHandler.throwError("error.logHu.ReservationPaletteReserved", oPalleteDetails.handlingUnit);
            }
        },
        _checkBeforeEndReservation: function(oPalleteDetails){
            let oReservation = oPalleteDetails.assemblyData.find( assemblyData => { return assemblyData.dataField === "RES_ITEM" } );
            let oConsumption = oPalleteDetails.assemblyData.find( assemblyData => { return assemblyData.dataField === "CONS_START" } );
            if(oReservation&&oReservation.dataAttribute!==null&&oReservation.dataAttribute
                &&oConsumption&&oConsumption.dataAttribute!==null&&oConsumption.dataAttribute){
                this._oErrorHandler.throwError("error.logHu.EndReservationConsumptionStarted", oPalleteDetails.handlingUnit);
            }
        },
        _checkBeforeReturn: function(oLine, oQuantity){
            let oReservation = oLine.palleteDetails.assemblyData.find( assemblyData => { return assemblyData.dataField === "RES_ITEM" } );
            if(oReservation&&oReservation.dataAttribute!==null&&oReservation.dataAttribute){
                this._oErrorHandler.throwError("error.logHu.ReturnPaletteReserved", oLine.palleteDetails.handlingUnit);
            }
            if(oLine.quantity < oQuantity){
                this._oErrorHandler.throwError("error.logHu.tooMuchQuantity");
            }

        },
        generateHuNumber: async function(oMaterial, oMaterialVersion, oPlant){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "/numbering/v1/identifiers";
            let oRequestParameters = { plant: oPlant,
                eventName: "PACKING_UNIT_NUMBER",
                objectsToMatch: {    MATERIAL_NAME: oMaterial,
                                     MATERIAL_VERSION : oMaterialVersion,
                                     ORDER_TYPE: "Production" } };
    
                return await new Promise((resolve,reject)=>{
                    this._oController.ajaxPostRequest(sUrl, oRequestParameters,
                        (oResponseData) => {
                            resolve(oResponseData.identifiers[0]);
                        },
                        (oError, sHttpErrorMessage) => {
                            reject(oError);
                        }   
                    );
    
                });
        },
        reducePalleteQuan: async function(oLine, oQuantityToReduce, oDummyOrder, oDummySfc){

            let issueResponse = await Issue.execute(this._oController,{    plant: oLine.plant,
                                                                           order: oDummyOrder,
                                                                           sfc: oDummySfc,
                                                                           operation: "DUMMY_OPERATION",
                                                                           workCenter: oLine.workCenter,
                                                                           material: oLine.materialId,
                                                                           materialVersion: oLine.palleteDetails.materialVersion,
                                                                           componentSequence: "",
                                                                           inventoryId: oLine.inventoryId,
                                                                           quantity: oQuantityToReduce,
                                                                           uom: oLine.uom,
                                                                           bom: "",
                                                                           bomVersion: "",
                                                                           isAI: true,
                                                                           isBomComponent: false });
        },
        additionalIssue: async function(oLine, oQuantity, oSfc, oBomRef, oOperation, componentSequence){
            this._additionalIssueChecks(oLine, oQuantity, oSfc, oBomRef, oOperation);
            let sfc = await SfcRepository.getInstance(this._oController, oLine.plant, oSfc);
            let step = sfc.getStepByOperation(oOperation);
            let bom = sfc.getBom();


            oQuantity = oQuantity.toFixed(3);
            let issueResponse = await Issue.execute(this._oController,{    plant: oLine.plant,
                                                                           order: oLine.orderNumber,
                                                                           sfc: oSfc,
                                                                           operation: oOperation,
                                                                           workCenter: oLine.workCenter,
                                                                           material: oLine.materialId,
                                                                           materialVersion: oLine.palleteDetails.materialVersion,
                                                                           componentSequence: componentSequence,
                                                                           inventoryId: oLine.inventoryId,
                                                                           quantity: oQuantity,
                                                                           uom: oLine.uom,
                                                                           bom: bom.bom,
                                                                           bomVersion: bom.version,
                                                                           isAI: true,
                                                                           isBomComponent: true });

            if(!issueResponse){
                this._oErrorHandler.throwErrorPopup("error.issue.aiFailed");
            }

            await this._saveDataCollection(oLine, oQuantity, oSfc, oOperation, issueResponse, step.stepId);
        },
        _getIssueDt(){
            let today = new Date();
            let oYear = today.getFullYear().toString();
            let oMonth = today.getMonth().toString();
            let oDay = today.getDate().toString();
            let oHour = today.getHours().toString();
            let oMinutes = today.getMinutes().toString();
            let oSeconds = today.getSeconds().toString();
            if (oMonth.length === 1) { oMonth = `0${oMonth}`; }
            if (oDay.length === 1) { oDay = `0${oDay}`; }
            if (oHour.length === 1) { oHour = `0${oHour}`; }
            if (oMinutes.length === 1) { oMinutes = `0${oMinutes}`; }
            if (oSeconds.length === 1) { oSeconds = `0${oSeconds}`; }

            let oReturn = `${oYear}-${oMonth}-${oDay} ${oHour}:${oMinutes}:${oSeconds}`;
            return oReturn;
        },
        _additionalIssueChecks: function(oLine, oQuantity, oSfc, oBomRef, oOperation){
            let oReservation = oLine.palleteDetails.assemblyData.find( assemblyData => { return assemblyData.dataField === "RES_ITEM" } );
            if(oReservation&&oReservation.dataAttribute!==null&&oReservation.dataAttribute){
                this._oErrorHandler.throwError("error.logHu.ReturnPaletteReserved", oLine.handlingUnit);
            }
            if(oLine.quantity < oQuantity){
                this._oErrorHandler.throwError("error.logHu.tooMuchQuantity");
            }

        },
        palleteReservationAndConsumption: async function(oPalleteDetails, oPlant, oOrder, oSequence, isReservation, isConsumption){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "inventory/v2/inventories/"+`${oPalleteDetails.inventoryId}?plant=${oPlant}`;

            let oAssemblyData = oPalleteDetails.palleteDetails.dataFields.filter( assemblyData => { return ! ( ( assemblyData.dataField === "RES_ITEM" && isReservation ) || ( assemblyData.dataField === "CONS_START" && isConsumption ) ) } );
            if(isConsumption){
                oAssemblyData.push({ dataField: "CONS_START",
                    dataAttribute: `X`  });
            }

            if(isReservation){
                oAssemblyData.push({ dataField: "RES_ITEM",
                    dataAttribute: `${oOrder}_${oSequence}`  });
            }


            let oParameters = { dataFields: oAssemblyData,
                lastModifiedDateTime: oPalleteDetails.modifiedDateTime
            };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPatchRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve();
                    }   
                );

            });
        },
        _saveDataCollection: async function(oLine, oQuantity, oSfc, oOperation, issueResponse, stepId){
            let guid = crypto.randomUUID();
            let date = new Date();

            let consumptionValue = `issueGuid:${issueResponse}||stepId:${stepId}||order:${oLine.orderNumber}||operation:${oOperation}||quantity:${oQuantity}||uom:${oLine.uom}`;
            consumptionValue = consumptionValue + `||handlingUnit:${oLine.handlingUnit}||storageLocation:${oLine.storageLocation}||material:${oLine.materialId}||sfc:${oSfc}||materialVersion:${oLine.palleteDetails.materialVersion}`;

            await DataCollectionSaver.saveProductionDC(
                this._oController,
                {
                    plant: oLine.plant,
                    sfc: oSfc,
                    resource: oLine.resource,
                    operation: oOperation,
                    productionProcessType: "AI",
                    q3Code: "",
                    quantity: `0`,
                    uom: '',
                    material: '',
                    itemNo: '',
                    salesOrder: "", 
                    saledOrderItem: "",
                    hu: "",
                    cancelled: false,
                    user: this._oController.getUserId(),
                    consumption: [ consumptionValue ],
                    dateCreated: date.toJSON(),
                    processStart: '',
                    processStop: '',
                    ncCode: "",
                    ncCodeDescription: "",
                    guid: guid
                }

            );

        }
    });

    return Pallete;

});