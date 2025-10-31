sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/PalleteQueuesManager",
    "ibc/dm/plugins/wcPodToolsProvider/ComponentIssueV2",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcComponentsReader",
    "ibc/dm/plugins/wcPodToolsProvider/BomRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler"
], function (ObjectUI5, PalleteQueuesManager, ComponentIssueV2, SfcRepository, SfcComponentsReader, BomRepository, OrderRepository, ErrorHandler) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.IssuesManager", {
        constructor: function(oController, parameters){
            this._controller = oController;
            this._parameters = parameters;
            this._checkParameters();
            this._componentsForIssue = [];
            this._palleteQueuesManager = new PalleteQueuesManager(this._controller);
            this._errorHandler = new ErrorHandler(this._controller);
        },

        _checkParameters: function(){
            if(!this._parameters){

            }
        },

        _checkConstrutorPamateres: function(){
            this._initialized = false;
        },

        initializeManager: async function(){
            this._initialized = true;
            await this._getBomComponentsForIssue();
            await this._getQueues();
        },

        _getBomComponentsForIssue: async function(){
            let oSfc = await SfcRepository.ReadSfcBypassBuffer(this._controller, this._parameters.plant, this._parameters.sfcNumber);
            this._sfcQuantity = oSfc.getQuantity();
            let oSfcComponents = await SfcComponentsReader.readComponents(this._controller, this._parameters.sfcNumber, this._parameters.operation );
            let oBom = await BomRepository.getInstance(this._controller, this._parameters.plant, oSfc.getBom().bom, oSfc.getBom().type);
            let oBomComponents = oBom.getComponents();
            let orderInstance = await OrderRepository.readOrder(this._controller, this._parameters.plant, this._parameters.orderNumber);
            let q2SplittedComponents = orderInstance.getSplittedComponents();

            for(const sfcComponent of oSfcComponents){
                let segmentSalesRequired = false;
                let backFlushValue = "";
                let isSplittedComponent = false;

                let oBomComponent = oBomComponents.find(bomComponent => { return bomComponent.sequence === sfcComponent.componentSequence });
                if(oBomComponent){
                    if(!oBomComponent.customValues){
                        oBomComponent.customValues = [];
                    }
                    let customValueBackflush = oBomComponent.customValues.find(value=>{return value.attribute==="BACKFLUSH"});
                    if(customValueBackflush){
                        backFlushValue = customValueBackflush.value;
                    }

                    let customValueSalesSegment = oBomComponent.customValues.find(value=>{return value.attribute==="STOCK_SEGMENT"});
                    if(customValueSalesSegment){
                        segmentSalesRequired = customValueSalesSegment.value === "E";
                    }

                    let splittedComponent = q2SplittedComponents.find(component=>{return component===oBomComponent.reservationItemNumber});
                    if(splittedComponent){
                        isSplittedComponent = true;
                    }



                    if(oBomComponent&&oBomComponent.backflushEnabled === false&&backFlushValue!=="X"){
                        this._componentsForIssue.push({
                            material: oBomComponent.material.material,
                            sequence: oBomComponent.sequence,
                            bomRef: sfcComponent.bomComponentRef,   
                            uom: oBomComponent.unitOfMeasure,
                            salesSegmentRequired: segmentSalesRequired,
                            splittedComponent: isSplittedComponent,
                            requiredQuantity: sfcComponent.requiredQuantity,
                            storageLocation: oBomComponent.storageLocation
                        });
                    }

                }else{
                    
                }
            }
        },
        _getQueues: async function(){
            for(const componentForIssue of this._componentsForIssue){
                    await this._palleteQueuesManager.readPalleteQueue(this._parameters.plant, this._parameters.workCenter, this._parameters.resource, componentForIssue.material, componentForIssue.storageLocation, 
                                                                      this._parameters.salesOrder, this._parameters.salesOrderItem, componentForIssue.uom, componentForIssue.salesSegmentRequired );
                }
        },

        checkQuantityAvailable:  function(quantity){
            for(const componentForIssue of this._componentsForIssue){
                let receiptQuantity = this._getReceiptQuantity(quantity, componentForIssue.splittedComponent);
                let issueQuantity = this._calculateIssueQuantity(receiptQuantity, componentForIssue.uom, componentForIssue.requiredQuantity);

                let palletes = this._palleteQueuesManager.getPalletesForIssue(  this._parameters.plant, 
                                                                                this._parameters.workCenter, 
                                                                                this._parameters.resource, 
                                                                                componentForIssue.material,
                                                                                issueQuantity,
                                                                                this._parameters.orderNumber,
                                                                                componentForIssue.sequence );
                let availableQuantity = 0;
                for(const pallete of palletes){
                    availableQuantity = availableQuantity + pallete.quantity;
                }

                if(issueQuantity>availableQuantity){
                    this._errorHandler.throwErrorPopup("error.issue.notEnoughStock", componentForIssue.material, this._parameters.workCenter, this._parameters.resource);
                }
            }

            
        },
        _getReceiptQuantity: function(receiptQuantity, splittedComponent){
            if(this._parameters.mode==="Q2"&&splittedComponent){
                if(receiptQuantity%2 !== 0){
                    if(this._parameters.q2Quantity%2===0){
                        return receiptQuantity + 1;
                    }else{
                        return receiptQuantity - 1;
                    }
                }
            }
            return receiptQuantity;
        },

        _calculateIssueQuantity: function(receiptQuantity, uom, requiredQuantity){
            let result = 0;
            if(this._sfcQuantity!==0){
                if(uom === 'ST'){
                    result = Math.ceil( (requiredQuantity * ( receiptQuantity / this._sfcQuantity )).toFixed(3) );
                }else{
                    result = requiredQuantity * ( receiptQuantity / this._sfcQuantity );
                    result = Math.round( result * 1000 ) / 1000;
                }
            }
            return result;
        },

        executeIssues: async function(quantity, sfcNumber){
            this._createdIssues = [];
            this._errors = [];

            for(const componentForIssue of this._componentsForIssue){
                let receiptQuantity = this._getReceiptQuantity(quantity, componentForIssue.splittedComponent);
                let issueQuantity = this._calculateIssueQuantity(receiptQuantity, componentForIssue.uom, componentForIssue.requiredQuantity);
                let palletes = this._palleteQueuesManager.getPalletesForIssue(  this._parameters.plant, 
                                                                                this._parameters.workCenter, 
                                                                                this._parameters.resource, 
                                                                                componentForIssue.material,
                                                                                issueQuantity,
                                                                                this._parameters.orderNumber,
                                                                                componentForIssue.sequence );
                let palletesAvailable = palletes.filter( pallete => { return pallete.quantity > 0 });

                for(const pallete of palletesAvailable){
                    let quantityToIssueFromPallete = 0;
                    if(pallete.quantity<issueQuantity){
                        quantityToIssueFromPallete = pallete.quantity;
                        issueQuantity = issueQuantity - pallete.quantity;
                        pallete.quantity = 0;
                    }else{
                        quantityToIssueFromPallete = issueQuantity;
                        pallete.quantity = pallete.quantity - issueQuantity;
                        issueQuantity = 0
                    }

                    if(quantityToIssueFromPallete>0){
                        let componentIssue = new ComponentIssueV2( this._controller, {  plant: this._parameters.plant,
                                                                                        orderNumber: this._parameters.orderNumber,
                                                                                        sfc: sfcNumber, 
                                                                                        operation: this._parameters.operation,
                                                                                        bomRef: componentForIssue.bomRef,
                                                                                        material: componentForIssue.material,
                                                                                        workCenter: this._parameters.workCenter,
                                                                                        quantity: quantityToIssueFromPallete,
                                                                                        sequence: componentForIssue.sequence,
                                                                                        palleteDetails: pallete });
                        await componentIssue.executeIssue();
                        let error = componentIssue.getError();
                        let createdIssueDetails = componentIssue.getCreatedIssue();
                        if(error){
                            this._errors.push(createdIssueDetails);
                        }
                        if(createdIssueDetails){
                            this._createdIssues.push(createdIssueDetails);
                        }
                    }

                    if(issueQuantity<=0){
                        break;
                    }
                }

            }

        },

        getCreatedIssues: function(){
            return this._createdIssues;
        },
        getErrors: function(){
            return this._errors;
        }
    });
});