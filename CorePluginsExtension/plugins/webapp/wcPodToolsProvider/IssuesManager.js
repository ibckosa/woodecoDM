sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/PalleteQueuesManager",
    "ibc/dm/plugins/wcPodToolsProvider/ComponentIssue",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcComponentsReader",
    "ibc/dm/plugins/wcPodToolsProvider/BomRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository"
], function (ObjectUI5, PalleteQueuesManager, ComponentIssue, SfcRepository, SfcComponentsReader, BomRepository, OrderRepository) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.IssuesManager", {
        constructor: function(oController, oPlant, oWorkCenter, oResource, oOrderNumber, oSfc, oOperationActivity, oQuantity, salesOrder, salesOrderItem, mode="Q1", q2Quantity=0){
            this._checkConstrutorPamateres(oController, oPlant, oWorkCenter, oResource, oOrderNumber, oSfc, oOperationActivity, oQuantity);
            this._createdIssues = [];
            this._componentsIssue = [];
            this._sfcComponents = [];
            this._sfcPlannedComponents = [];
            this._oController = oController;
            this._oPlant = oPlant;
            this._oResource = oResource;
            this._oWorkCenter = oWorkCenter;
            this._oOrderNumber = oOrderNumber;
            this._oSfc = oSfc;
            this._oOperationActivity = oOperationActivity;
            this._oQuantity = oQuantity;
            this._salesOrder = salesOrder;
            this._salesOrderItem = salesOrderItem;
            this._mode = mode;
            this._q2Quantity = q2Quantity;
            this._oPalleteQueuesManager = new PalleteQueuesManager(this._oController);
        },

        _checkConstrutorPamateres: function(oController,oWorkCenter, oResource, oOrderNumber, oSfc, oOperationActivity, oQuantity){

        },

        prepareIssues: async function(){
            await this._readIssueComponents();

            for(const componentIssue of this._componentsIssue){
                await componentIssue.prepareIssue();
            }
        },
        executeIssues: async function(){
            for(const componentIssue of this._componentsIssue){
                await componentIssue.executeIssue();
                let createdIssues = componentIssue.getCreatedIssues();
                for(const issue of createdIssues){
                    this._createdIssues.push(issue);
                }

                //this._createdIssues.concat(componentIssue.getCreatedIssues());
            }
        },
        _readIssueComponents: async function(){
            let segmentSalesRequired = false
            let oSfcComponents = await SfcComponentsReader.readComponents(this._oController, this._oSfc, this._oOperationActivity );
            let oSfc = await SfcRepository.ReadSfcBypassBuffer(this._oController, this._oPlant, this._oSfc);
            let oBom = await BomRepository.getInstance(this._oController, this._oPlant, oSfc.getBom().bom, oSfc.getBom().type);
            let orderInstance = await OrderRepository.readOrder(this._oController, this._oPlant, this._oOrderNumber)
            //await oSfc.readData();
            let oBomComponents = oBom.getComponents();
            let q2SplittedComponents = orderInstance.getSplittedComponents();

            for(const sfcComponent of oSfcComponents){
                let backFlushValue = "";
                let isSplittedComponent = false;

                let oBomComponent = oBomComponents.find(bomComponent => { return bomComponent.sequence === sfcComponent.componentSequence });
                if(oBomComponent&&oBomComponent.customValues){
                    let customValueBackflush = oBomComponent.customValues.find(value=>{return value.attribute==="BACKFLUSH"});
                    if(customValueBackflush){
                        backFlushValue = customValueBackflush.value;
                    }

                    let customValueSalesSegment = oBomComponent.customValues.find(value=>{return value.attribute==="STOCK_SEGMENT"});
                    if(customValueSalesSegment){
                        segmentSalesRequired = customValueSalesSegment.value === "E";
                    }
                }

                
                
                if(oBomComponent&&oBomComponent.backflushEnabled === false&&backFlushValue!=="X"){
                    let splittedComponent = q2SplittedComponents.find(component=>{return component===oBomComponent.reservationItemNumber});
                    if(splittedComponent){
                        isSplittedComponent = true;
                    }

                    let receiptQuantity = this._oQuantity;
                    if(this._mode==="Q2"&&isSplittedComponent){
                        if(receiptQuantity%2 !== 0){
                            if(this._q2Quantity%2===0){
                                receiptQuantity = receiptQuantity + 1;
                            }else{
                                receiptQuantity = receiptQuantity - 1;
                            }
                        }
                        
                    }
                    
                    let oIssueQuan;
                    if(oBomComponent.unitOfMeasure === 'ST'){
                        oIssueQuan = Math.ceil(sfcComponent.requiredQuantity * ( receiptQuantity / oSfc.getQuantity() ));
                    }else{
                        oIssueQuan = sfcComponent.requiredQuantity * ( receiptQuantity / oSfc.getQuantity() );
                        oIssueQuan = Math.round( oIssueQuan * 1000 ) / 1000;
                    }
                   
                    if(oIssueQuan>0){
                        let oComponentIssue = new ComponentIssue({  controller: this._oController,
                                                                    sfc: this._oSfc,
                                                                    plant: this._oPlant,
                                                                    orderNumber: this._oOrderNumber,
                                                                    operation: this._oOperationActivity,
                                                                    sequence: oBomComponent.sequence,
                                                                    bomRef: sfcComponent.bomComponentRef                                                                ,
                                                                    quantity: oIssueQuan,
                                                                    material: oBomComponent.material.material,
                                                                    workCenter: this._oWorkCenter,
                                                                    resource: this._oResource,
                                                                    uom: oBomComponent.unitOfMeasure,
                                                                    storageLocation: oBomComponent.storageLocation,
                                                                    componentSequence: oBomComponent.sequence,
                                                                    salesOrder: this._salesOrder,
                                                                    salesOrderItem: this._salesOrderItem,
                                                                    salesSegmentRequired: segmentSalesRequired,
                                                                    palleteQueuesManager: this._oPalleteQueuesManager });
                        this._componentsIssue.push(oComponentIssue);
                    }
                }
            }


        },
        changeSfcNumber: function(oSfcNumber){
            this._oSfc = oSfcNumber;
            for(const componentIssue of this._componentsIssue){
                componentIssue.changeSfc(oSfcNumber);
            }
        },
        getCreatedIssues: function(){
            return this._createdIssues;
        }


    });
});