sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository",
    "ibc/dm/plugins/wcPodToolsProvider/WorkCenter"
], function (Object,MaterialRepository,WorkCenter) {
    "use strict";
    return Object.extend("ibc.dm.plugins.wcPodToolsProvider.PalleteQueue", {
        constructor: function(oController, oPlant, oResourceNumber, oWorkCenter ){
            this._oController = oController;
            this._isReadForOrderPosition = false;
            this._isReadForQueueManager = false;
            this._oPlant = oPlant;
            this._oResourceNumber = oResourceNumber;
            this._oWorkCenter = oWorkCenter;
        },
        setReadForOrderPosition: function(oOrder,oSequence,oMaterial,oStorageLocation){
            this._isReadForOrderPosition = true;

            this._oAdditionalData = { order : oOrder,
                                      sequence: oSequence,
                                      material: oMaterial,
                                      storageMaterial: oStorageLocation
            };

        },
        setReadForQueueManager: function(oMaterial){
            this._isReadForQueueManager = true;

            this._oAdditionalData = { order : "",
                                      sequence: "",
                                      material: oMaterial,
                                      storageMaterial: ""
            };

        },


        readPalletesQueue: async function(){
            let oReturnQueue = [];

            let oRequestParameters = await this._getRequestParameters();
            let oPalletes = await this._readPalletesApiCall(oRequestParameters);


            if(this._isReadForOrderPosition){
                oReturnQueue = await this._getQueueForPosition(oPalletes);
            }else if(this._isReadForQueueManager){
                oReturnQueue = await this._getQueueForQueueManager(oPalletes);
            }else{
                oReturnQueue = await this._getQueueForResource(oPalletes);
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
        _getRequestParameters: async function(){
            let oParameters = {};

            let oWorkCenter = new WorkCenter(this._oController, this._oPlant, this._oWorkCenter);
            await oWorkCenter.readData();
            oParameters.plant = this._oPlant;
            oParameters.size = 150;
            oParameters.productionSupplyArea = oWorkCenter.getPsa();;

            if(this._isReadForOrderPosition === true || this._isReadForQueueManager === true ){
                oParameters.material = this._oAdditionalData.material;
            }

            return oParameters;
            
        },
        _getQueueForPosition: async function(oPalletes){ 
            let oReturn = [];
            let oReservedPalletes = [];
            let oNonReservedPalletes = [];
            let oConsumedPalletes = [];
            let oResevationNumber = `${ this._oAdditionalData.order }_${ this._oAdditionalData.sequence }`;

            for(const pallete of oPalletes){
                let oMaterial = await MaterialRepository.getMaterialInstance(this._oController, this._oPlant, pallete.material);
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
                            resource: this._oResourceNumber,
                            workCenter: this._oWorkCenter,
                            orderNumber: this._oAdditionalData.order,
                            sequence: this._oAdditionalData.sequence,
                            materialId: pallete.material,
                            materialDesc: oMaterial.getDescription(),
                            quantity: pallete.quantityOnHand.value,
                            uom: pallete.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                            reservation: "",
                            storageLocation: pallete.storageLocation,
                            createdDateTime: pallete.createdDateTime,
                            modifiedDateTime: pallete.modifiedDateTime,
                            palleteDetails: pallete,
                            erpResourceId: "",
                            generatedHu: "",
                            packingMaterial: oMaterial.getPackagingMaterial()
                            //ak komentarz
                            // edycja komenatarza
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
                                    resource: this._oResourceNumber,
                                    workCenter: this._oWorkCenter,
                                    orderNumber: this._oAdditionalData.order,
                                    sequence: this._oAdditionalData.sequence,
                                    materialId: pallete.material,
                                    materialDesc: oMaterial.getDescription(),
                                    quantity: pallete.quantityOnHand.value,
                                    uom: pallete.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                                    reservation: oResevationNumber,
                                    storageLocation: pallete.storageLocation,
                                    createdDateTime: pallete.createdDateTime,
                                    modifiedDateTime: pallete.modifiedDateTime,
                                    palleteDetails: pallete,
                                    erpResourceId: "",
                                    generatedHu: "",
                                    packingMaterial: oMaterial.getPackagingMaterial()
                                });
                            }else{
                                oConsumedPalletes.push({
                                    lineSelected: false,
                                    consumptionStarted: true,
                                    handlingUnit: pallete.handlingUnit,
                                    inventoryId:  pallete.inventoryId,
                                    plant:  this._oPlant,
                                    resource: this._oResourceNumber,
                                    workCenter: this._oWorkCenter,
                                    orderNumber: this._oAdditionalData.order,
                                    sequence: this._oAdditionalData.sequence,
                                    materialId: pallete.material,
                                    materialDesc: oMaterial.getDescription(),
                                    quantity: pallete.quantityOnHand.value,
                                    uom: pallete.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                                    reservation: oResevationNumber,
                                    storageLocation: pallete.storageLocation,
                                    createdDateTime: pallete.createdDateTime,
                                    modifiedDateTime: pallete.modifiedDateTime,
                                    palleteDetails: pallete,
                                    erpResourceId: "",
                                    generatedHu: "",
                                    packingMaterial: oMaterial.getPackagingMaterial()
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
        _getQueueForResource: async function(oPalletes){ 
            let oReturn = [];
            for(const pallete of oPalletes){
                let oMaterial = await MaterialRepository.getMaterialInstance(this._oController, this._oPlant, pallete.material);
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
                        resource: this._oResourceNumber,
                        workCenter: this._oWorkCenter,
                        orderNumber: "",
                        sequence: "",
                        materialId: pallete.material,
                        materialDesc: oMaterial.getDescription(),
                        quantity: pallete.quantityOnHand.value,
                        uom: pallete.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                        reservation: "",
                        storageLocation: pallete.storageLocation,
                        createdDateTime: pallete.createdDateTime,
                        modifiedDateTime: pallete.modifiedDateTime,
                        palleteDetails: pallete,
                        erpResourceId: "",
                        generatedHu: "",
                        packingMaterial: oMaterial.getPackagingMaterial()
                    });
                }
            }

            oReturn.sort((a,b) => (a.createdDateTime > b.createdDateTime) ? 1 : -1 );


            return oReturn;
        },

        _getQueueForQueueManager:  async function(oPalletes){ 
            let oReturn = [];
            let oReservedPalletes = [];
            let oNonReservedPalletes = [];
            let oConsumedPalletes = [];

            for(const pallete of oPalletes){
                let oMaterial = await MaterialRepository.getMaterialInstance(this._oController, this._oPlant, pallete.material);
                try{
                    let oReservation = pallete.assemblyData.find(oData=>{ return oData.dataField === "RES_ITEM"});
                    let oConsumed = pallete.assemblyData.find(oData=>{ return oData.dataField === "CONS_START"});
                    if(!oReservation||oReservation.dataAttribute===null||!oReservation.dataAttribute){
                        oNonReservedPalletes.push({
                            lineSelected: false,
                            consumptionStarted: false,
                            isNewReservation: true,
                            handlingUnit: pallete.handlingUnit,
                            inventoryId:  pallete.inventoryId,
                            plant:  this._oPlant,
                            resource: this._oResourceNumber,
                            workCenter: this._oWorkCenter,
                            orderNumber: this._oAdditionalData.order,
                            sequence: this._oAdditionalData.sequence,
                            materialId: pallete.material,
                            materialDesc: oMaterial.getDescription(),
                            quantity: pallete.quantityOnHand.value,
                            uom: pallete.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                            reservation: "",
                            storageLocation: pallete.storageLocation,
                            createdDateTime: pallete.createdDateTime,
                            modifiedDateTime: pallete.modifiedDateTime,
                            palleteDetails: pallete,
                            erpResourceId: "",
                            generatedHu: "",
                            packingMaterial: oMaterial.getPackagingMaterial()
                        });
                    }else{
                            if(!oConsumed||oConsumed.dataAttribute===null||!oConsumed.dataAttribute)
                            {
                                oReservedPalletes.push({
                                    lineSelected: false,
                                    consumptionStarted: false,
                                    isNewReservation: false,
                                    handlingUnit: pallete.handlingUnit,
                                    inventoryId:  pallete.inventoryId,
                                    plant:  this._oPlant,
                                    resource: this._oResourceNumber,
                                    workCenter: this._oWorkCenter,
                                    orderNumber: this._oAdditionalData.order,
                                    sequence: this._oAdditionalData.sequence,
                                    materialId: pallete.material,
                                    materialDesc: oMaterial.getDescription(),
                                    quantity: pallete.quantityOnHand.value,
                                    uom: pallete.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                                    reservation: oReservation.dataAttribute,
                                    storageLocation: pallete.storageLocation,
                                    createdDateTime: pallete.createdDateTime,
                                    modifiedDateTime: pallete.modifiedDateTime,
                                    palleteDetails: pallete,
                                    erpResourceId: "",
                                    generatedHu: "",
                                    packingMaterial: oMaterial.getPackagingMaterial()
                                });
                            }else{
                                oConsumedPalletes.push({
                                    lineSelected: false,
                                    consumptionStarted: true,
                                    isNewReservation: false,
                                    handlingUnit: pallete.handlingUnit,
                                    inventoryId:  pallete.inventoryId,
                                    plant:  this._oPlant,
                                    resource: this._oResourceNumber,
                                    workCenter: this._oWorkCenter,
                                    orderNumber: this._oAdditionalData.order,
                                    sequence: this._oAdditionalData.sequence,
                                    materialId: pallete.material,
                                    materialDesc: oMaterial.getDescription(),
                                    quantity: pallete.quantityOnHand.value,
                                    uom: pallete.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                                    reservation: oReservation.dataAttribute,
                                    storageLocation: pallete.storageLocation,
                                    createdDateTime: pallete.createdDateTime,
                                    modifiedDateTime: pallete.modifiedDateTime,
                                    palleteDetails: pallete,
                                    erpResourceId: "",
                                    generatedHu: "",
                                    packingMaterial: oMaterial.getPackagingMaterial()
                                });
                            }
                    }
 
                }catch(oError){}
            }

            oNonReservedPalletes.sort((a,b) => (a.createdDateTime > b.createdDateTime) ? 1 : -1 );
            oReservedPalletes.sort((a,b) => (a.createdDateTime > b.createdDateTime) ? 1 : -1 );
            oConsumedPalletes.sort((a,b) => (a.createdDateTime > b.createdDateTime) ? 1 : -1 );

            oReturn = [...oConsumedPalletes,...oReservedPalletes,...oNonReservedPalletes];

            return oReturn;
        }
        
    });
});