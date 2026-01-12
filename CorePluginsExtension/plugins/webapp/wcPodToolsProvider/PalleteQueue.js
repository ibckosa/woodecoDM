sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository",
    "ibc/dm/plugins/wcPodToolsProvider/WorkCenter"
], function (Object,MaterialRepository, WorkCenter) {
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
        setReadForOrderPosition: function(oOrder, oSequence, oMaterial, oStorageLocation){
            this._isReadForOrderPosition = true;

            this._oAdditionalData = { order : oOrder,
                                      sequence: oSequence,
                                      material: oMaterial,
                                      storageMaterial: oStorageLocation
            };

        },
        setQueueUom: function(uom){
            this._queueUom = uom;
        },
        setSalesOrderSegment: function(salesOrderNumber, salesOrderItemNumber){
            this._salesOrderNumber = salesOrderNumber;
            this._salesOrderItemNumber = salesOrderItemNumber;

        },
        setSalesSegment: function(salesOrderNumber, salesOrderItemNumber){
            this._salesSegmentSetted = true;
            this._salesOrderNumber = salesOrderNumber;
            this._salesOrderItemNumber = salesOrderItemNumber;

        },
        setReadForQueueManager: function(oMaterial, storageLocation){
            this._isReadForQueueManager = true;

            this._oAdditionalData = { order : "",
                                      sequence: "",
                                      material: oMaterial,
                                      storageMaterial: storageLocation
            };

        },


        readPalletesQueue: async function(){
            let oReturnQueue = [];

            let oRequestParameters = await this._getRequestParameters();
            let oPalletes = await this._readPalletesApiCalls(oRequestParameters);

            if(this._isReadForOrderPosition){
                oReturnQueue = await this._getQueueForPosition(oPalletes);
            }else if(this._isReadForQueueManager){
                oReturnQueue = await this._getQueueForQueueManager(oPalletes);
            }else{
                oReturnQueue = await this._getQueueForResource(oPalletes);
            }

            if(this._oAdditionalData && this._oAdditionalData.material){
                oReturnQueue = await this._convertToQueueUom(oReturnQueue);
                oReturnQueue = await this._filterSalesSegment(oReturnQueue);
            }

            return oReturnQueue;
        },
        _filterSalesSegment: async function(queue){
            if(this._salesSegmentSetted){
                queue = queue.filter(line=>{return line.salesOrderNumber === this._salesOrderNumber &&
                                                   line.salesOrderItemNumber === this._salesOrderItemNumber });
            }
            return queue;
        },

        _convertToQueueUom: async function(queue){

            if(this._queueUom){
                let materialInstance = await MaterialRepository.getMaterialInstance(this._oController, this._oPlant, this._oAdditionalData.material);
                let alternatesUom = materialInstance.getAlternatesUom();
                if(alternatesUom){
                    for(const queueLine of queue){
                        if(queueLine.uom !== this._queueUom){

                            let huUomConverter = alternatesUom.find( alternateUom => { return queueLine.uom === alternateUom.uom });
                            if(huUomConverter){
                                queueLine.quantity = queueLine.quantity * huUomConverter.denominator / huUomConverter.numerator;
                                queueLine.uom = this._queueUom;
                            }

                            let alternateConverter = alternatesUom.find( alternateUom => { return alternateUom.uom === this._queueUom});
                            if(alternateConverter){
                                queueLine.uom = this._queueUom;
                                queueLine.quantity = queueLine.quantity * alternateConverter.denominator / alternateConverter.numerator;
                            }
                        }
                    }
                }
            }
            return queue;
        },
        _readPalletesApiCalls: async function(oRequestParamteres){
          let result = [];
          let additionalApiCalls = [];
          oRequestParamteres.page = 0;
          let firstResults = await this._readPalletesApiCall(oRequestParamteres);
          result = result.concat(firstResults.content);


          if(firstResults.totalPages>0){
            for(let i=1;i<firstResults.totalPages;i++){
              oRequestParamteres.page = i;
              additionalApiCalls.push(this._readPalletesApiCall(oRequestParamteres));
            }
          }

          if(additionalApiCalls.length>0){
            let additionalResults = await Promise.all(additionalApiCalls);
            for(const additionalResult of additionalResults){
              result = result.concat(additionalResult.content);
            }
          }

          return result;
        },
        _readPalletesApiCall: async function(oRequestParamteres){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "inventory/v1/inventories";

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oRequestParamteres,
                    (oResponseData) => {
                        resolve(oResponseData);
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
            oParameters.size = 50;
            oParameters.productionSupplyArea = oWorkCenter.getPsa();

            if(this._isReadForOrderPosition === true || this._isReadForQueueManager === true ){
                oParameters.material = this._oAdditionalData.material;
                oParameters.storageLocation = this._oAdditionalData.storageMaterial;
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
                            packingMaterial: oMaterial.getPackagingMaterial(),
                            salesOrderNumber: this._getSalesOrderNumber(pallete),
                            salesOrderItemNumber: this._getSalesOrderItemNumber(pallete)
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
                                    packingMaterial: oMaterial.getPackagingMaterial(),
                                    salesOrderNumber: this._getSalesOrderNumber(pallete),
                                    salesOrderItemNumber: this._getSalesOrderItemNumber(pallete)
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
                                    packingMaterial: oMaterial.getPackagingMaterial(),
                                    salesOrderNumber: this._getSalesOrderNumber(pallete),
                                    salesOrderItemNumber: this._getSalesOrderItemNumber(pallete)
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
                let reservationValue = ""
                let consumptionStarted = false;
                try{     
                    let oReservation = pallete.assemblyData.find(oData=>{ return oData.dataField === "RES_ITEM"});
                    if(!oReservation ||oReservation.dataAttribute===null||!oReservation.dataAttribute){
                        
                    }
                    else{
                        reservationValue = oReservation.dataAttribute;
                        consumptionStarted = true;
                    }
                    throw '';
                }catch(oErr){
                    oReturn.push({
                        lineSelected: false,
                        consumptionStarted: consumptionStarted,
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
                        reservation: reservationValue,
                        storageLocation: pallete.storageLocation,
                        createdDateTime: pallete.createdDateTime,
                        modifiedDateTime: pallete.modifiedDateTime,
                        palleteDetails: pallete,
                        erpResourceId: "",
                        generatedHu: "",
                        packingMaterial: oMaterial.getPackagingMaterial(),
                        salesOrderNumber: this._getSalesOrderNumber(pallete),
                        salesOrderItemNumber: this._getSalesOrderItemNumber(pallete),
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
                            packingMaterial: oMaterial.getPackagingMaterial(),
                            salesOrderNumber: this._getSalesOrderNumber(pallete),
                            salesOrderItemNumber: this._getSalesOrderItemNumber(pallete)
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
                                    packingMaterial: oMaterial.getPackagingMaterial(),
                                    salesOrderNumber: this._getSalesOrderNumber(pallete),
                                    salesOrderItemNumber: this._getSalesOrderItemNumber(pallete)
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
                                    packingMaterial: oMaterial.getPackagingMaterial(),
                                    salesOrderNumber: this._getSalesOrderNumber(pallete),
                                    salesOrderItemNumber: this._getSalesOrderItemNumber(pallete)
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
        },
        _getSalesOrderNumber: function(pallete){
            let result = "";
            let palleteOrderNumber = pallete.assemblyData.find(oData=>{ return oData.dataField === "SALES_ORDER"});
            if(palleteOrderNumber&&palleteOrderNumber.dataAttribute){
                result = palleteOrderNumber.dataAttribute;
            }
            return result;
        },
        _getSalesOrderItemNumber: function(pallete){
            let result = "";
            let palleteOrderItemNumber = pallete.assemblyData.find(oData=>{ return oData.dataField === "SALES_ORDER_ITEM"});
            if(palleteOrderItemNumber&&palleteOrderItemNumber.dataAttribute){
                result = palleteOrderItemNumber.dataAttribute;
            }
            return result;
        },

                
    });
});