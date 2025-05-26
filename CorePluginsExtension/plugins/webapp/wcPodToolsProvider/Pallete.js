sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler"
], function (ManagedObject, ErrorHandler) {
    "use strict";
    let Pallete = ManagedObject.extend("ibc.dm.plugins.wcPodToolsProvider.Pallete", {
        constructor: function(oContoller){
            //ManagedObject.prototype.constructor.apply(this, arguments);
            this._oController = oContoller;
            this._oErrorHandler = new ErrorHandler(this._oController);
        },

        palleteReservation: async function(oPalleteDetails, oPlant, oOrder, oSequence){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "inventory/v1/inventories/"+`${oPalleteDetails.inventoryId}?plant=${oPlant}`;
            this._checkBeforeReservation(oPalleteDetails);

            let oAssemblyData = oPalleteDetails.assemblyData.filter( assemblyData => { return assemblyData.dataField !== "RES_ITEM" } );
            

            oAssemblyData.push({ dataField: "RES_ITEM",
                                 dataAttribute: `${oOrder}_${oSequence}`  });

            let oParameters = { assemblyData: oAssemblyData,
                lastModifiedDateTime: oPalleteDetails.modifiedDateTime
            };
            debugger;

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPatchRequest(sUrl, oParameters,
                    (oResponseData) => {
                        debugger;
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        debugger;
                        reject(oError);
                    }   
                );

            });
        },
        palleteEndReservation: async function(oPalleteDetails, oPlant){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "inventory/v1/inventories/"+`${oPalleteDetails.inventoryId}?plant=${oPlant}`;

           // this._checkBeforeEndReservation(oPalleteDetails);
            let oAssemblyData = oPalleteDetails.assemblyData.filter( assemblyData => { return assemblyData.dataField !== "RES_ITEM" && assemblyData.dataField !== "CONS_START" } );
            oAssemblyData.push({ dataField: "RES_ITEM",
                                 dataAttribute: null });
            oAssemblyData.push({ dataField: "CONS_START",
                                 dataAttribute: null });

            let oParameters = { assemblyData: oAssemblyData,
                lastModifiedDateTime: oPalleteDetails.modifiedDateTime
            };
            debugger;

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPatchRequest(sUrl, oParameters,
                    (oResponseData) => {
                        debugger;
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        debugger;
                        reject(oError);
                    }   
                );

            });
        },
        palleteReturn: async function(oLine, oEndPoint){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + oEndPoint;
            let oSapDateTime = this._getCurrentSapDateTime();
            let oParameters = {};
            this._checkBeforeReturn(oLine.palleteDetails);
            let oBatchNumber = '';
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
                MENGE: oLine.quantity,
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

        palleteReturnNpw: async function(oLine, oEndPoint, oQuantity){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + oEndPoint;
            let oSapDateTime = this._getCurrentSapDateTime();
            let oParameters = {};
            this._checkBeforeReturnNpw(oLine ,oEndPoint, oQuantity);
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
                MENGE: oQuantity,
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
        _checkBeforeReturn: function(oPalleteDetails){
            let oReservation = oPalleteDetails.assemblyData.find( assemblyData => { return assemblyData.dataField === "RES_ITEM" } );
            if(oReservation&&oReservation.dataAttribute!==null&&oReservation.dataAttribute){
                this._oErrorHandler.throwError("error.logHu.ReturnPaletteReserved", oPalleteDetails.handlingUnit);
            }
        },
        _checkBeforeReturnNpw: function(oLine, oEndPoint, oQuantity){
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
            debugger;
            let oRequestParameters = {
                "shopOrder": oDummyOrder,///numer zlecenia
                "batchId": oDummySfc, ///SFC
                "operationActivity": "DUMMY_OPERATION",//operation activity
                // "bomComponentRef": this.consumeData.bomComponentRef,
                "material": oLine.materialId,
                "batchNumber": null,
                "shopOrderLocationRef": null,
                "workCenter": oLine.workCenter,
                "inventory": oLine.inventoryId, //inventory id
                "isBomComponent": false, //true or false
                "quantity": {
                    "value": oQuantityToReduce,
                    "unitOfMeasure": {
                        "uom": oLine.uom,//As the API does not support UoM yet
                        "internalUom": oLine.uom,
                        "shortText": null,
                        "longText": null,
                        "numerator": null,
                        "denominator": null,
                    }
                },
                "useFullHandlingUnit": false, //true or false
                "handlingUnitNumber": oLine.palleteDetails.handlingUnit,
                "storageLocation": oLine.storageLocation,
                "isInventoryManaged": true,
                "userId": this._oController.getUserId(),
                "dateTime": this._getIssueDt(),
                "comments": "",
                "calculatedData": null,
                "customFieldData":  null
            };

            let sUrl = this._oController.getAssemblyDataSourceUri() + "order/goodsIssue";
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );
            });
        },
        additionalIssue: async function(oLine, oQuantity, oSfc, oBomRef, oOperation){
            this._additionalIssueChecks(oLine, oQuantity, oSfc, oBomRef, oOperation);
            let oRequestParameters = {
                "shopOrder": oLine.orderNumber,///numer zlecenia
                "batchId": oSfc, ///SFC
                "operationActivity": oOperation,//operation activity
                "bomComponentRef": oBomRef,
                "material": oLine.materialId,
                "batchNumber": null,
                "shopOrderLocationRef": null,
                "workCenter": oLine.workCenter,
                "inventory": oLine.inventoryId, //inventory id
                "isBomComponent": true, //true or false
                "quantity": {
                    "value": oQuantity,
                    "unitOfMeasure": {
                        "uom": oLine.uom,//As the API does not support UoM yet
                        "internalUom": oLine.uom,
                        "shortText": null,
                        "longText": null,
                        "numerator": null,
                        "denominator": null,
                    }
                },
                "useFullHandlingUnit": false, //true or false
                "handlingUnitNumber": oLine.handlingUnit,
                "storageLocation": oLine.storageLocation,
                "isInventoryManaged": true,
                "userId": this._oController.getUserId(),
                "dateTime": this._getIssueDt(),
                "comments": "ADDITIONAL_ISSUE",
                "calculatedData": null,
                "customFieldData":  null
            };

            let sUrl = this._oController.getAssemblyDataSourceUri() + "order/goodsIssue";
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );
            });
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
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "inventory/v1/inventories/"+`${oPalleteDetails.inventoryId}?plant=${oPlant}`;

            let oAssemblyData = oPalleteDetails.palleteDetails.assemblyData.filter( assemblyData => { return ! ( ( assemblyData.dataField === "RES_ITEM" && isReservation ) || ( assemblyData.dataField === "CONS_START" && isConsumption ) ) } );
            if(isConsumption){
                oAssemblyData.push({ dataField: "CONS_START",
                    dataAttribute: `X`  });
            }

            if(isReservation){
                oAssemblyData.push({ dataField: "RES_ITEM",
                    dataAttribute: `${oOrder}_${oSequence}`  });
            }


            let oParameters = { assemblyData: oAssemblyData,
                lastModifiedDateTime: oPalleteDetails.modifiedDateTime
            };
            debugger;

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
    });

    return Pallete;

});