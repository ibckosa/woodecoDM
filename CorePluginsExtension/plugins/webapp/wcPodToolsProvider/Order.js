sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/LinkReader",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository"
], function (ObjectUI5, LinkReader, MaterialRepository) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.Order", {
        constructor: function(oController, oPlant, oOrderNumber){
            this._oController = oController;
            this._oPlant = oPlant;
            this._oOrderNumber = oOrderNumber;
        },
        readData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "/order/v1/orders";
            var oParameters = { order: this._oOrderNumber,
                                plant: this._oPlant };
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                     (oResponseData) => {
                        this._oDetails = oResponseData;
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },
        getPutawayStorageLocation(){
            return this._oDetails.putawayStorageLocation;
        },
        getUom: function(){
            return this._oDetails.baseUnitOfMeasureObject.uom;
        },
        getInternalUom: function(){
            return this._oDetails.baseUnitOfMeasureObject.internalUom;
        },

        getDetails: function(){
            return this._oDetails;
        },
        getOrderLineCustomValues: function(oLineNumber){
            let oLineNumberString = `${ oLineNumber }`
            let oValues = [];
            if(oLineNumberString.length===1){
                oLineNumberString = `0${ oLineNumberString }`
            }
            try{
                let oLine = this._oDetails.customValues.find(customValues => {return customValues.attribute === `ITEM_${ oLineNumberString }`; })
                let oSplittedLine = oLine.value.split("||");
                oValues = oSplittedLine
                .filter(item => item.includes(":")) 
                .map(item => {
                  const colonIndex = item.indexOf(":");
                  const field_name = item.substring(0, colonIndex).trim();
                  const field_value = item.substring(colonIndex + 1).trim();
                  return { field_name, field_value };
                });
            }catch(oError){}
            

            return oValues;
        },
        getHeaderCustomValues: function(){
            return this._oDetails.customValues.filter(customValue => { return  !customValue.attribute.startsWith("ITEM") });
        },
        getOrderPositions: async function(){
            let oReturn = [];
            let oLines = this._oDetails.customValues.filter(customValue=>{ return customValue.attribute.startsWith("ITEM") &&
                                                                                   customValue.attribute !== "ITEM_1"  });

            let oReceipts = await this._getOrderReceipts();
            for(const line of oLines){
                if(!line.value||line.value===""){continue;}
                let oItemNumber = line.attribute.replace("ITEM_0", "");
                oItemNumber = oItemNumber.replace("ITEM_", "");
                let oLineAttributes = this.getOrderLineCustomValues(oItemNumber);
                let oMoStructure = this._getMultiOrdersStructure();
                for(const attribute of oLineAttributes){
                    switch(attribute.field_name){
                        case "LA":
                            oMoStructure.length = attribute.field_value;
                            break;
                        case "BR":
                            oMoStructure.width = attribute.field_value;
                            break;
                        case "SO":
                            oMoStructure.salesOrder = attribute.field_value;
                            break;
                        case "SOIT":
                            oMoStructure.salesOrderItem = attribute.field_value;
                            break;
                        case "MAT":
                            oMoStructure.materialNumber = attribute.field_value;
                            break;
                        case "PQ":
                            oMoStructure.quantity = parseInt(attribute.field_value);
                            break;
                        case "ZZVERP":
                            oMoStructure.packagingCode = attribute.field_value;
                            break;
                        case "AUFPS":
                            oMoStructure.itemNumberErp = attribute.field_value;
                            break;
                    }
                }
                oMoStructure.itemNumber = oItemNumber;
                oMoStructure.orderNumber =  this._oOrderNumber;
                oMoStructure.files = await LinkReader.readLinksFromInstance(this, oItemNumber);
                oMoStructure.itemPosnr = parseInt(oItemNumber) * 10;
                let filteredReceipts = oReceipts.filter(receipt=>{ return receipt.comments&&
                                                                          receipt.comments === `${oMoStructure.salesOrder}${oMoStructure.salesOrderItem}` &&
                                                                          receipt.material  === oMoStructure.materialNumber });

                for(const receipt of filteredReceipts){
                    oMoStructure.deliveredQuantity = oMoStructure.deliveredQuantity + receipt.quantityInBaseUnit.value;
                }

                oMoStructure.leftQuantity = oMoStructure.quantity - oMoStructure.deliveredQuantity;
                if(oMoStructure.materialNumber){
                   let oMaterial = await MaterialRepository.getMaterialInstance(this._oController, this._oPlant, oMoStructure.materialNumber);
                   oMoStructure.decors = await oMaterial.getGraphics();
                   oMoStructure.thickness = oMaterial.getThickness();
                   oMoStructure.salesText = oMaterial.getSalesText("PL");
                }
                oReturn.push(oMoStructure);
            }
            return oReturn;

        },
        getSfcs: function(){
            return this._oDetails.sfcs;
        },
        _getMultiOrdersStructure: function(){
            return {
                orderNumber: "",
                itemNumber: "",
                itemNumberErp: "",
                itemPosnr: "",
                materialNumber: "",
                quantity: 0,
                deliveredQuantity: 0,
                salesOrder: "",
                salesOrderItem: "",
                salesText: "",
                packagingCode: "",
                length: 0,
                thickness: 0,
                width: 0,
                decors: [],
                files: []
            }
        },
        getPackingCode: function(itemNumber = 1){
            let oReturn = "";
            try{
                let lineValues = this.getOrderLineCustomValues(itemNumber);
                let packingCode = lineValues.find(value=>{return value.field_name === "ZZVERP"});
                if(packingCode){
                    oReturn = packingCode.field_value;
                }
            }catch(oError){}
            return oReturn;
        },
        _getOrderReceipts: async function(){
            var oParameters = { order: this._oOrderNumber,
                                plant: this._oPlant,
                                size: 300,
                                page: 0 };

            let oFirstCall = await this._callGetOrderReceipts(oParameters);

            return oFirstCall.content;

        },
        _callGetOrderReceipts: async function(oParameters){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "inventory/v1/inventory/goodsReceipts";
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                     (oResponseData) => {
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },
        
        saveCustomData: async function(){
            if(this._oDetails.customValuesBuffered){
                let sUrl = this._oController.getPublicApiRestDataSourceUri() + "order/v1/orders/customValues";

                let parameters = { plant: this._oPlant,
                                   order: this._oOrderNumber,
                                   customValues: this._oDetails.customValuesBuffered };
    
                return await new Promise((resolve,reject)=>{
                    this._oController.ajaxPatchRequest(sUrl, parameters,
                         (oResponseData) => {
                            this._oDetails.customValues = this._oDetails.customValuesBuffered;
                            this._oDetails.customValuesBuffered = null;
                            resolve(oResponseData);
                        },
                        (oError) => {
                            this._oDetails.customValuesBuffered = null;
                            reject(oError);
                        }   
                    );
    
                });
            }

        },
        setOrderInput: function(orderInput){
            this._setBufferedCustomData();

            this._oDetails.customValuesBuffered = this._oDetails.customValuesBuffered.filter( buffer => { return buffer.attribute !== "INPUT_ORDER" && buffer.attribute !== "ITEM_1" });

            this._oDetails.customValuesBuffered.push({ attribute: "INPUT_ORDER",
                                                       value:      orderInput });
        },
        setOrderInputDate: function(orderInputDate){
            this._setBufferedCustomData();
            this._oDetails.customValuesBuffered = this._oDetails.customValuesBuffered.filter( buffer => { return buffer.attribute !== "INPUT_ORDER_DATE" && buffer.attribute !== "ITEM_1" });

            this._oDetails.customValuesBuffered.push({ attribute: "INPUT_ORDER_DATE",
                                                       value:     orderInputDate });

        },
        _setBufferedCustomData: function(){
            if(!this._oDetails.customValuesBuffered){
                this._oDetails.customValuesBuffered = this._oDetails.customValues;
            }
        },
        getStartDate: function(){
            return this._oDetails.actualStartDate;
        },
        getEndDate: function(){
            return this._oDetails.actualCompletionDate;
        },
        getInputOrder: function(){
            let oReturn = "";

            try{
                let inputOrder = this._oDetails.customValues.find(customValue => { return customValue.attribute === 'INPUT_ORDER' });
                oReturn = inputOrder.value;
            }catch(oError){}

            return oReturn;
        },
        getInputOrderDate: function(){
            let oReturn = "";

            try{
                let inputOrderDate = this._oDetails.customValues.find(customValue => { return customValue.attribute === 'INPUT_ORDER_DATE' });
                oReturn = inputOrderDate.value;
            }catch(oError){}

            return oReturn;
        },
        getOARequired: function(){
            let oReturn = false;

            try{
                let oLineAttributes = this.getOrderLineCustomValues(1);
                let gs251 = oLineAttributes.find(line => { return line.field_name === 'GS1_251' });
                if(gs251&&gs251.field_value==="ON"){
                    oReturn = true;
                }
            }catch(oError){}

            return oReturn;
        },
        getOrderType: function(){
            let oReturn = "";

            try{
                let orderType = this._oDetails.customValues.find(customValue => { return customValue.attribute === 'ORDER_TYPE' });
                oReturn = orderType.value;
            }catch(oError){}

            return oReturn;
        },
        getIsOrderMO: function(){
            let oReturn = false;

            let oLines = this._oDetails.customValues.filter(customValue=>{ return customValue.attribute.startsWith("ITEM") &&
                                                                                  customValue.attribute !== "ITEM_1" &&
                                                                                  customValue.value !== ""   });

            if(oLines.length>1){
                oReturn = true;
            }

            return oReturn;
        },
        getHeaderMaterial: function(){
            return this._oDetails.material.material;
        },
        getReceipts: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "inventory/v1/inventory/goodsReceipts";
            var oParameters = { order: this._oOrderNumber,
                                plant: this._oPlant,
                                size: 300 };
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                     (oResponseData) => {
                        resolve(oResponseData.content);
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve([]);
                    }   
                );
            });
        },
        getBomNumber: function(){
            return this._oDetails.bom.bom;
        },
        getBomType: function(){
            return this._oDetails.bom.type;
        }


        
    });
});