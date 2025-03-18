sap.ui.define([
    "sap/ui/base/Object"
], function (Object) {
    "use strict";
    return Object.extend("ibc.dm.plugins.wcPodToolsProvider.PalleteQueue", {
        constructor: function(oController, oPlant, oResourceNumber ){
            this._oController = oController;
            this._isReadForOrderPosition = false;
            this._oPlant = oPlant;
            this._oResourceNumber = oResourceNumber;
        },
        setReadForOrderPosition: function(oOrder,oSequence,oMaterial,oStorageLocation){
            this._isReadForOrderPosition = true;

            this._oAdditionalData = { order : oOrder,
                                      sequence: oSequence,
                                      material: oMaterial,
                                      storageMaterial: oStorageLocation
            };

        },

        readPalletesQueue: async function(){
            let oReturnQueue = [];

            let oRequestParameters = this._getRequestParameters();
            let oPalletes = await this._readPalletesApiCall(oRequestParameters);

            
            switch(this._isReadForOrderPosition) {
                case true:
                    oReturnQueue =  this._getQueueForPosition(oPalletes);
                    break;
                case false:
                    oReturnQueue = this._getQueueForResource(oPalletes);
                    break;
            }

            return oReturnQueue;

        },
        _readPalletesApiCall: async function(oRequestParamteres){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "inventory/v1/inventories";

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oRequestParamteres,
                    (oResponseData) => {
                        resolve(oResponseData.content);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );
            });
        },
        _getRequestParameters: function(){
            let oParameters = {};

            oParameters.plant = this._oPlant;
            oParameters.productionSupplyArea = this._oResourceNumber;

            if(this._isReadForOrderPosition === true){
                oParameters.material = this._oAdditionalData.material;
            }

            return oParameters;
            
        },
        _getQueueForPosition: function(oPalletes){ 
            let oReturn = [];
            let oReservedPalletes = [];
            let oNonReservedPalletes = [];
            let oConsumedPalletes = [];
            let oResevationNumber = `${ this._oAdditionalData.order }_${ this._oAdditionalData.sequence }`;

            for(const pallete of oPalletes){
                try{
                    let oReservation = pallete.assemblyData.find(oData=>{ return oData.dataField === "RES_ITEM"});
                    let oConsumed = pallete.assemblyData.find(oData=>{ return oData.dataField === "CONS_START"});
                    if(!oReservation||oReservation.dataAttribute===null||!oReservation.dataAttribute){
                        oNonReservedPalletes.push({
                            lineSelected: false,
                            consumptionStarted: false,
                            handlingUnit: pallete.handlingUnit,
                            inventoryId:  pallete.inventoryId,
                            plant:  this._oPlant,
                            orderNumber: this._oAdditionalData.order,
                            sequence: this._oAdditionalData.sequence,
                            materialId: pallete.material,
                            materialDesc: "MaterialDesc",
                            quantity: pallete.quantityOnHand.value,
                            uom: pallete.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                            reservation: "",
                            storageLocation: pallete.storageLocation,
                            createdDateTime: pallete.createdDateTime,
                            modifiedDateTime: pallete.modifiedDateTime,
                            palleteDetails: pallete,
                            erpResourceId: "",
                        });
                    }else{
                        if(oReservation.dataAttribute === oResevationNumber){
                            if(!oConsumed||oConsumed.dataAttribute===null||!oConsumed.dataAttribute)
                            {
                                oReservedPalletes.push({
                                    lineSelected: false,
                                    consumptionStarted: false,
                                    handlingUnit: pallete.handlingUnit,
                                    inventoryId:  pallete.inventoryId,
                                    plant:  this._oPlant,
                                    orderNumber: this._oAdditionalData.order,
                                    sequence: this._oAdditionalData.sequence,
                                    materialId: pallete.material,
                                    materialDesc: "MaterialDesc",
                                    quantity: pallete.quantityOnHand.value,
                                    uom: pallete.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                                    reservation: oResevationNumber,
                                    storageLocation: pallete.storageLocation,
                                    createdDateTime: pallete.createdDateTime,
                                    modifiedDateTime: pallete.modifiedDateTime,
                                    palleteDetails: pallete,
                                    erpResourceId: "",
                                });
                            }else{
                                oConsumedPalletes.push({
                                    lineSelected: false,
                                    consumptionStarted: true,
                                    handlingUnit: pallete.handlingUnit,
                                    inventoryId:  pallete.inventoryId,
                                    plant:  this._oPlant,
                                    orderNumber: this._oAdditionalData.order,
                                    sequence: this._oAdditionalData.sequence,
                                    materialId: pallete.material,
                                    materialDesc: "MaterialDesc",
                                    quantity: pallete.quantityOnHand.value,
                                    uom: pallete.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                                    reservation: oResevationNumber,
                                    storageLocation: pallete.storageLocation,
                                    createdDateTime: pallete.createdDateTime,
                                    modifiedDateTime: pallete.modifiedDateTime,
                                    palleteDetails: pallete,
                                    erpResourceId: "",
                                });
                            }
                        }
                    }
 
                }catch(oError){}
            }

            oNonReservedPalletes.sort((a,b) => (a.createdDateTime > b.createdDateTime) ? 1 : -1 );
            oReservedPalletes.sort((a,b) => (a.createdDateTime > b.createdDateTime) ? 1 : -1 );
            oConsumedPalletes.sort((a,b) => (a.createdDateTime > b.createdDateTime) ? 1 : -1 );

            oReturn = [...oConsumedPalletes,...oReservedPalletes,...oNonReservedPalletes];

            return oReturn;
        },
        _getQueueForResource: function(oPalletes){ 
            let oReturn = [];
            for(const pallete of oPalletes){
                try{
                    let oReservation = pallete.assemblyData.find(oData=>{ return oData.dataField === "RES_ITEM"});
                    if(!oReservation ||oReservation.dataAttribute===null||!oReservation.dataAttribute){
                        throw '';
                    }
                }catch(oErr){
                    oReturn.push({
                        lineSelected: false,
                        consumptionStarted: false,
                        handlingUnit: pallete.handlingUnit,
                        inventoryId:  pallete.inventoryId,
                        plant:  this._oPlant,
                        orderNumber: "",
                        sequence: "",
                        materialId: pallete.material,
                        materialDesc: "MaterialDesc",
                        quantity: pallete.quantityOnHand.value,
                        uom: pallete.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                        reservation: "",
                        storageLocation: "",
                        createdDateTime: pallete.createdDateTime,
                        modifiedDateTime: pallete.modifiedDateTime,
                        palleteDetails: pallete,
                        erpResourceId: "",
                    });
                }
            }

            oReturn.sort((a,b) => (a.createdDateTime > b.createdDateTime) ? 1 : -1 );


            return oReturn;
        }
        
    });
});