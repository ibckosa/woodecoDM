sap.ui.define([
    "sap/ui/base/ManagedObject"
], function (ManagedObject) {
    "use strict";
    return ManagedObject.extend("ibc.dm.plugins.wcPodToolsProvider.Pallete", {
        constructor: function(oContoller){
            ManagedObject.prototype.constructor.apply(this, arguments);
            this._oController = oContoller;
        },

        palleteReservation: async function(oPalleteDetails, oPlant, oOrder, oSequence){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "inventory/v1/inventories/"+`${oPalleteDetails.inventoryId}?plant=${oPlant}`;
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
            let oAssemblyData = oPalleteDetails.assemblyData.filter( assemblyData => { return assemblyData.dataField !== "RES_ITEM" } );
            oAssemblyData.push({ dataField: "RES_ITEM",
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

            oParameters = { WERK: oLine.plant,
                BEWART: "988",
                ZLO: "STOCK",
                LGORT: oLine.storageLocation,
                HU: oLine.palleteDetails.handlingUnit,
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
                TST: "F" };

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
        }   
    })

});