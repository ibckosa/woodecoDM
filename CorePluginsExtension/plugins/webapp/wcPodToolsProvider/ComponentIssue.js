sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/Pallete"
    
], function (ObjectUI5, ErrorHandler, Pallete) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.ComponentIssue", {
        constructor: function(oIssueData){
            this._oIssueData = oIssueData;
            this._createdIssues = [];
            this._executeControllerChecks();
            //controller
            //sfc
            //plant
            //orderNumber
            //sfc
            //operation
            //sequence
            //bomRef
            //quantity
            //material
            //workCenter
            //resource
            //uom
            //storageLocation
            //salesOrder
            //salesOrderItem
            //salesSegmentRequired
            //palleteQueuesManager
            this._oErrorHandler = new ErrorHandler(this._oIssueData.controller);
        },


        prepareIssue: async function(){
            await this._oIssueData.palleteQueuesManager.readPalleteQueue(this._oIssueData.plant, this._oIssueData.workCenter, this._oIssueData.resource, this._oIssueData.material, this._oIssueData.storageLocation, 
                                                                         this._oIssueData.salesOrder, this._oIssueData.salesOrderItem, this._oIssueData.uom, this._oIssueData.salesSegmentRequired );
            this._oPalletes = await this._oIssueData.palleteQueuesManager.getPalletesForIssue( this._oIssueData.plant, 
                                                                                              this._oIssueData.workCenter, 
                                                                                              this._oIssueData.resource, 
                                                                                              this._oIssueData.material,
                                                                                              this._oIssueData.quantity,
                                                                                              this._oIssueData.orderNumber,
                                                                                              this._oIssueData.sequence );
            let oQuanToIssue = this._oIssueData.quantity;

            for(const pallete of this._oPalletes){
                oQuanToIssue = oQuanToIssue - pallete.quantity;
            }

            if(oQuanToIssue>0){this._oErrorHandler.throwError("error.issue.notEnoughStock", this._oIssueData.material, this._oIssueData.workCenter, this._oIssueData.resource)};
        },
        executeIssue: async function(){
           
            let oPalletesToIssue = this._oPalletes.filter( pallete => { return pallete.quantity > 0 });
            for(const pallete of oPalletesToIssue){
                let oPallete = new Pallete(this._oIssueData.controller);
                let oQuanToIssueFromPallete = 0;
                if(pallete.quantity<this._oIssueData.quantity){
                    oQuanToIssueFromPallete = pallete.quantity;
                    this._oIssueData.quantity = this._oIssueData.quantity - pallete.quantity;
                    pallete.quantity = 0;
                }else{
                    oQuanToIssueFromPallete = this._oIssueData.quantity;
                    this._oIssueData.quantity = 0
                    pallete.quantity = pallete.quantity  - this._oIssueData.quantity;
                }
                if(pallete.isNewReservation===true){
                    await oPallete.palleteReservationAndConsumption(pallete, this._oIssueData.plant, this._oIssueData.orderNumber, this._oIssueData.sequence, true, true);
                }else if(pallete.consumptionStarted === false){
                    await oPallete.palleteReservationAndConsumption(pallete, this._oIssueData.plant, this._oIssueData.orderNumber, this._oIssueData.sequence, false, true);
                }
                let oIssueResponse = await this._issue(pallete, oQuanToIssueFromPallete);
                this._createdIssues.push({  
                    txnId: oIssueResponse.txnId,
                    stepId: oIssueResponse.stepId,
                    order: this._oIssueData.orderNumber,
                    operation: this._oIssueData.operation,
                    quantity: oQuanToIssueFromPallete,
                    uom: pallete.uom,
                    handlingUnit: pallete.handlingUnit,
                    storageLocation: pallete.storageLocation,
                    material: this._oIssueData.material,
                    sfc: this._oIssueData.sfc
                });

                if(this._oIssueData.quantity<=0){
                    break;
                }        
            }
        },
        _issue: async function(oLine, oQuantity ){
            if(oLine.uom==='ST'){
                oQuantity = Math.ceil(oQuantity);
            }else{
                oQuantity = Math.round( oQuantity * 1000 ) / 1000;  
            }
            let oRequestParameters = {
                "shopOrder": this._oIssueData.orderNumber,///numer zlecenia
                "batchId": this._oIssueData.sfc, ///SFC
                "operationActivity": this._oIssueData.operation,//operation activity
                "bomComponentRef": this._oIssueData.bomRef,
                "material": this._oIssueData.material,
                "batchNumber": null,
                "shopOrderLocationRef": null,
                "workCenter": this._oIssueData.workCenter,
                "inventory": oLine.inventoryId, //inventory id
                "isBomComponent": true, //true or false
                "quantity": {
                    "value": oQuantity,
                    "unitOfMeasure": {
                        "uom": oLine.uom,
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
                "userId": this._oIssueData.controller.getUserId(),
                "dateTime": this._getIssueDt(),
                "comments": `${this._oIssueData.componentSequence}`,
                "calculatedData": null,
                "customFieldData":  null
            };

            let sUrl = this._oIssueData.controller.getAssemblyDataSourceUri() + "order/goodsIssue";
            return await new Promise((resolve,reject)=>{
                this._oIssueData.controller.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );
            });
        },
        _getIssueDt: function(){
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
        _executeControllerChecks: function(){

        },
        changeSfc: function(oSfcNumber){
            this._oIssueData.sfc = oSfcNumber;
        },
        getCreatedIssues: function(){
            return this._createdIssues;
        }
    });
});