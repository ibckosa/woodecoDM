sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/LinkReader",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcDataCollectionReader",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/BomRepository",
    "ibc/dm/plugins/wcPodToolsProvider/IssueReader"
], function (ObjectUI5, LinkReader, MaterialRepository, SfcDataCollectionReader, ErrorHandler, BomRepository, IssueReader) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.Order", {
        constructor: function(oController, oPlant, oOrderNumber){
            this._oController = oController;
            this._oPlant = oPlant;
            this._oOrderNumber = oOrderNumber;
            this._errorHandler = new ErrorHandler(this._oController);
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
        getOrderPositions: async function(routing, routingVersion){
            let oReturn = [];
            let oLines = this._oDetails.customValues.filter(customValue=>{ return customValue.attribute.startsWith("ITEM") &&
                                                                                   customValue.attribute !== "ITEM_1"  });

            
            

            // let oReceipts = await this._getOrderReceipts();
            let dataCollections = await SfcDataCollectionReader.readCollections(this._oController, this._oPlant, this.getSfcs(), "", true, true, routing, routingVersion);
            for(const line of oLines){
                if(!line.value||line.value===""){continue;}
                let oItemNumber = line.attribute.replace("ITEM_0", "");
                oItemNumber = oItemNumber.replace("ITEM_", "");
                let oLineAttributes = this.getOrderLineCustomValues(oItemNumber);
                let oMoStructure = this._getMultiOrdersStructure();
                let palleteTolerancePlus = "", palleteToleranceMinus = "", itemTolerancePlus="", itemToleranceMinus="";
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
                            let oPartOfPackingCode = attribute.field_value.substring(6,10);
                            if(!isNaN(oPartOfPackingCode)){
                                oMoStructure.quantityPerPallet = Number(oPartOfPackingCode); 
                            }
                            break;
                        case "ZZVERP_TXT":
                            oMoStructure.packagingDescription = attribute.field_value;
                            break;
                        case "AUFPS":
                            oMoStructure.itemNumberErp = attribute.field_value;
                            break;
                        case "ZZVERP_TOL-":
                            palleteToleranceMinus = attribute.field_value;
                            break;
                        case "ZZVERP_TOL+":
                            palleteTolerancePlus = attribute.field_value;
                            break;
                        case "PEG_KWMENG":
                            oMoStructure.salesOrderItemQuantity = parseInt(attribute.field_value);
                            break;
                        case "ITEM_TOL+":
                            itemTolerancePlus = attribute.field_value;
                            break;
                        case "ITEM_TOL-":
                            itemToleranceMinus = attribute.field_value;
                            break;
                        case "PEG_ZDELMON":
                            oMoStructure.pegZdelmon = attribute.field_value;

                    }
                }
                oMoStructure.itemNumber = oItemNumber;
                oMoStructure.orderNumber =  this._oOrderNumber;
                oMoStructure.files = await LinkReader.readLinksFromInstance(this, oItemNumber);
                oMoStructure.itemPosnr = parseInt(oItemNumber) * 10;


                let filteredCollection = dataCollections.filter(collection=>{return collection["Q1/Q3"] === "Q1" &&
                                                                                    collection.ITEM_NO === oMoStructure.itemNumberErp &&
                                                                                    collection.QUANTITY });

                for(const collection of filteredCollection){
                    oMoStructure.executedReceipts = oMoStructure.executedReceipts + 1;
                    if(collection.CANCELLED === "false"){
                        oMoStructure.deliveredQuantity = oMoStructure.deliveredQuantity + parseInt(collection.QUANTITY);
                    }        
                }

                // let filteredReceipts = oReceipts.filter(receipt=>{ return receipt.comments&&
                //                                                           receipt.comments === `${oMoStructure.salesOrder}${oMoStructure.salesOrderItem}` &&
                //                                                           receipt.material  === oMoStructure.materialNumber });

                // for(const receipt of filteredReceipts){
                //     oMoStructure.deliveredQuantity = oMoStructure.deliveredQuantity + receipt.quantityInBaseUnit.value;
                // }

                oMoStructure.leftQuantity = oMoStructure.quantity - oMoStructure.deliveredQuantity;
                if(oMoStructure.leftQuantity < 0){
                    oMoStructure.leftQuantity = 0;
                }
                oMoStructure.maxQuantity = oMoStructure.minQuantity = oMoStructure.quantity;
                if(itemTolerancePlus){
                    oMoStructure.maxQuantity = Math.ceil(oMoStructure.maxQuantity + this._converTolerance(itemTolerancePlus)*oMoStructure.maxQuantity);
                }
                if(itemToleranceMinus){
                    oMoStructure.minQuantity = Math.ceil(oMoStructure.minQuantity - this._converTolerance(itemToleranceMinus)*oMoStructure.minQuantity);
                }
                oMoStructure.maxLeftQuantity = oMoStructure.maxQuantity - oMoStructure.deliveredQuantity;

                if(oMoStructure.quantityPerPallet>0){
                    oMoStructure.plannedReceipts = Math.ceil(oMoStructure.quantity / oMoStructure.quantityPerPallet);
                }
                if(oMoStructure.quantityPerPallet === 0 || oMoStructure.quantityPerPallet >= oMoStructure.leftQuantity){
                    oMoStructure.quantityPerPallet = oMoStructure.leftQuantity;
                    oMoStructure.quantityPerPalletMax = 99999999;
                    oMoStructure.quantityPerPalletMin = 1;
                }else{
                    oMoStructure.quantityPerPalletMax = oMoStructure.quantityPerPalletMin = oMoStructure.quantityPerPallet;
                    if(palleteTolerancePlus){
                        oMoStructure.quantityPerPalletMax = oMoStructure.quantityPerPalletMax + this._converTolerance(palleteTolerancePlus)*100;
                    }

                    if(palleteToleranceMinus){
                        oMoStructure.quantityPerPalletMin = oMoStructure.quantityPerPalletMin - this._converTolerance(palleteToleranceMinus)*100; 
                    }
                }
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
            if(!this._oDetails.sfcs){
              return [];
            }
            let mainSfc = this._oDetails.sfcs.find(sfc=>{return sfc === `${this._oOrderNumber}_M0000`});
            if(!mainSfc){
              this._oDetails.sfcs.push(`${this._oOrderNumber}_M0000`);
            }
            return this._oDetails.sfcs;
        },
        getProducationQuantity: function(){
            return this._oDetails.productionQuantity;
        },
        _getMultiOrdersStructure: function(){
            return {
                orderNumber: "",
                itemNumber: "",
                itemNumberErp: "",
                itemPosnr: "",
                materialNumber: "",
                quantity: 0,
                maxQuantity: 0,
                minQuantity: 0,
                leftQuantity: 0,
                maxleftQuantity: 0,
                deliveredQuantity: 0,
                totalQ23: 0,
                salesOrder: "",
                salesOrderItem: "",
                salesText: "",
                packagingCode: "",
                packagingDescription: "",
                pegZdelmon: "",
                quantityPerPallet: 0,
                quantityPerPalletMax: 0,
                quantityPerPalletMin: 0,
                plannedReceipts: 0,
                executedReceipts: 0,
                salesOrderItemQuantity: 0,
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
        getQuantityFromPackingCode(itemNumber = 1){
            let result = 0;

            let packingCode = this.getPackingCode(itemNumber);
            if(packingCode){
                let partOfPackingCode = packingCode.substring(6,10);
                if(!isNaN(partOfPackingCode)){
                    result = Number(partOfPackingCode); 
                }
            }

            return result;
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
        getRouting: function(){
          return this._oDetails.routing;
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
        },
        _converTolerance: function(toleranceText){
            let returnTolerance = 0;
            try{
                toleranceText = toleranceText.replaceAll("%","");
                let toleranceNumber = Number(toleranceText);
                returnTolerance = toleranceNumber / 100;
            }catch(oError){

            }

            return returnTolerance;
        },
        getPalleteMinMax: function(itemNumber=1){
            let result = {
                minPalleteQuantity: 1,
                maxPalleteQuantity: 999999999
            };

            try{
                let packingCode = this.getPackingCode(itemNumber);
                if(packingCode){
                    let partOfPackingCode = packingCode.substring(6,10);
                    if(!isNaN(partOfPackingCode)){
                        result.minPalleteQuantity = result.maxPalleteQuantity = parseInt(partOfPackingCode);
                        let tollerancePlus = this.getTollerancePlus(itemNumber);
                        let tolleranceMinus = this.getTolleranceMinus(itemNumber);
                        result.maxPalleteQuantity = result.maxPalleteQuantity + tollerancePlus;
                        result.minPalleteQuantity = result.minPalleteQuantity - tolleranceMinus;
                    }
                }
            }catch(oError){}

            return result;
        },
        getTollerancePlus: function(itemNumber){
            let result = 0;
            let lineValues = this.getOrderLineCustomValues(itemNumber);
            let tollerancePlus = lineValues.find(line=>{ return line.field_name === "ZZVERP_TOL+" });
            if(tollerancePlus){
                result = this._converTolerance(tollerancePlus.field_value) * 100;
            }
            return result; 

        },
        getTolleranceMinus: function(itemNumber){
            let result = 0;
            let lineValues = this.getOrderLineCustomValues(itemNumber);
            let tolleranceMinus = lineValues.find(line=>{ return line.field_name === "ZZVERP_TOL-" });
            if(tolleranceMinus){
                result = this._converTolerance(tolleranceMinus.field_value) * 100;
            }
            return result; 
        },
        getMaxOrderQuantitySO: function(){
            let orderQuantity = this._oDetails.productionQuantity;
            let lineValues = this.getOrderLineCustomValues(1);
            let itemTollerancePlus = lineValues.find(line=>{ return line.field_name === "ITEM_TOL+" });
            if(itemTollerancePlus){
                orderQuantity = orderQuantity + orderQuantity * this._converTolerance(itemTollerancePlus.field_value);
            }

            return orderQuantity;
        },
        getMinOrderQuantitySO: function(){
            let orderQuantity = this._oDetails.productionQuantity;
            let lineValues = this.getOrderLineCustomValues(1);
            let itemTolleranceMinus = lineValues.find(line=>{ return line.field_name === "ITEM_TOL-" });
            if(itemTolleranceMinus){
                orderQuantity = orderQuantity - orderQuantity * this._converTolerance(itemTolleranceMinus.field_value);
            }

            return orderQuantity;
        },
        completeOrder: async function(){
            var sUrl = this._oController.getPublicApiRestDataSourceUri() + `order/v1/orders/complete?plant=${this._oPlant}&order=${this._oOrderNumber}`;
            var oRequestParameters = {  };
    
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => { 
                        reject(oError);
                    }
                );
            });
        },
        getOrderNumber: function(){
            return this._oDetails.order;
        },
        getScrapingMaterial: function(itemNumber){
            let lineValues = this.getOrderLineCustomValues(itemNumber);
            let scrapingMaterial = lineValues.find(line=>{ return line.field_name === "SCRAP_INTERIM" });

            if(!scrapingMaterial){
                this._errorHandler.throwErrorPopup("error.q23.noScrapingMaterial");
            }else{

                return parseInt(scrapingMaterial.field_value).toString(); 
            }           
        },
        getPackagingMaterial: function(itemNumber){
            let lineValues = this.getOrderLineCustomValues(itemNumber);
            let packagingMaterial = lineValues.find(line=>{ return line.field_name === "SCRAP_PACKAGING" });

            if(!packagingMaterial){
                this._errorHandler.throwErrorPopup("error.q23.noPackagingMaterial");
            }else{

                return parseInt(packagingMaterial.field_value); 
            }           
        },
        getPegZdelmonHeader: function(){
            let result = "";

            try{
                let pegZdelmon = this._oDetails.customValues.find(customValues => {return customValues.attribute === `PEG_ZDELMON`; })
                result = pegZdelmon.value;
            }catch(error){

            }
            
            return result;        
        },
        getIssuesNonBackflush: async function(){
            let result = [];
            let materialsUniqe = [];
            let bom = await BomRepository.getInstance(this._oController, this._oPlant, this._oDetails.bom.bom, this._oDetails.bom.type );
            let components = bom.getNonBackFlushComponents();

            
            for(const component of components){
                const materialUniqe = materialsUniqe.find(material=>{return material.material === component.material.material && 
                                                                            material.version === component.material.version                     
                });
                result.push({
                    material: component.material.material, 
                    version: component.material.version,
                    componentSequence: component.sequence.toString(),
                    issuedQuantity: 0
                })
                if(!materialUniqe){
                    materialsUniqe.push({
                        material: component.material.material,
                        version: component.material.version
                    });
                }
            }

            for(const materialUniqe of materialsUniqe){
                let materialIssues =  await IssueReader.readIssues(this._oController, this._oPlant, this._oOrderNumber, materialUniqe.material, materialUniqe.version)
                for(const materialIssue of materialIssues){
                    if(materialIssue.cancellationTriggered === false){
                        if(materialIssue.comments.includes("//")){
                            materialIssue.comments = materialIssue.comments.split('//')[0].trim();
                        }
                        let resultLine = result.find(line=>{return materialIssue.comments === line.componentSequence });
                        if(resultLine){
                            resultLine.issuedQuantity = resultLine.issuedQuantity + materialIssue.quantityInBaseUnit.value;
                        }
                    }
                }
            }
            return result;
        },
        getCustomerOrder: function(){
            let result = "";
            if(this._oDetails.customerOrder){
                result = this._oDetails.customerOrder;
            }
            return result;
        },
        getCustomerOrderItem: function(){
            let result = "";
            if(this._oDetails.customerOrderItem){
                result = this._oDetails.customerOrderItem;
            }
            return result;
        },
        getSplittedComponents: function(){
            let result = [];

            try{
                let customValueSplittedComponents = this._oDetails.customValues.find(customValues => {return customValues.attribute === `COMPONENTS_PC_SPLITTED`; })
                let reservationItemNumbers = customValueSplittedComponents.value.split("$&")
                for(const reservationItemNuber of reservationItemNumbers){
                    result.push(reservationItemNuber);
                }
            }catch(error){

            }
            
            return result;
        },
        getOpenSfcs: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + 'sfc/v2/worklist/sfcs';
            var oParameters = { orders: this._oOrderNumber,
                                size: 20,
                                plant: this._oPlant };
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                     (oResponseData) => {
                        resolve(oResponseData.content);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },
        getConverterM2: function(itemNumber = 1){
            let result = 0;

            try{
                let lineValues = this.getOrderLineCustomValues(itemNumber);
                let fieldLA = lineValues.find(line=>{ return line.field_name === "LA" });
                let fieldBR = lineValues.find(line=>{ return line.field_name === "BR" });
                if(fieldLA&&fieldBR){
                    result = parseFloat(fieldLA.field_value) * parseFloat(fieldBR.field_value) / 1000000;
                }              
            }catch(error){}

            return result;
        },
        getDimensions: function(itemNumber = 1){
            let result = {
                LA: 0,
                BR: 0
            }
            try{
                let lineValues = this.getOrderLineCustomValues(itemNumber);
                let fieldLA = lineValues.find(line=>{ return line.field_name === "LA" });
                let fieldBR = lineValues.find(line=>{ return line.field_name === "BR" });
                if(fieldLA){
                    result.LA = fieldLA.field_value;
                }
                if(fieldBR){
                    result.BR = fieldBR.field_value;
                }
            }catch(error){

            }


            return result;
        }

        
    });
});