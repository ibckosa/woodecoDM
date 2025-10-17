sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/Pallete"
    
], function (ObjectUI5, ErrorHandler, Pallete) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.ComponentIssue", {
        constructor: function(controller, parameters){
            this._controller = controller;
            this._parameters = parameters;
            //this._executeControllerChecks();
            this._errorHandler = new ErrorHandler(this._controller);
        },

        executeIssue: async function(){
            
            let palleteInstance = new Pallete(this._controller);
            if(this._parameters.palleteDetails.isNewReservation===true){
                await palleteInstance.palleteReservationAndConsumption(this._parameters.palleteDetails, this._parameters.plant, this._parameters.orderNumber, this._parameters.sequence, true, true);
            }else if(this._parameters.palleteDetails.consumptionStarted === false){
                await palleteInstance.palleteReservationAndConsumption(this._parameters.palleteDetails, this._parameters.plant, this._parameters.orderNumber, this._parameters.sequence, false, true);
            }

            let issueResponse = await this._issue();
            if(issueResponse&&issueResponse.txnId){
                this._createdIssue = {  
                    txnId: issueResponse.txnId,
                    stepId: issueResponse.stepId,
                    order: this._parameters.orderNumber,
                    operation: this._parameters.operation,
                    quantity: this._parameters.quantity,
                    uom: this._parameters.palleteDetails.uom,
                    handlingUnit: this._parameters.palleteDetails.handlingUnit,
                    storageLocation: this._parameters.palleteDetails.storageLocation,
                    material: this._parameters.material,
                    sfc: this._parameters.sfc};
            }
        },
        _issue: async function( ){
            if(this._parameters.palleteDetails.uom==='ST'){
                this._parameters.quantity = Math.ceil(this._parameters.quantity);
            }else{
                this._parameters.quantity = Math.round( this._parameters.quantity * 1000 ) / 1000; 
            }
            let oRequestParameters = {
                "shopOrder": this._parameters.orderNumber,
                "batchId": this._parameters.sfc,
                "operationActivity": this._parameters.operation,
                "bomComponentRef": this._parameters.bomRef,
                "material": this._parameters.material,
                "batchNumber": null,
                "shopOrderLocationRef": null,
                "workCenter": this._parameters.workCenter,
                "inventory": this._parameters.palleteDetails.inventoryId, 
                "isBomComponent": true,
                "quantity": {
                    "value": this._parameters.quantity,
                    "unitOfMeasure": {
                        "uom": this._parameters.palleteDetails.uom,
                        "internalUom": this._parameters.palleteDetails.uom,
                        "shortText": null,
                        "longText": null,
                        "numerator": null,
                        "denominator": null,
                    }
                },
                "useFullHandlingUnit": false,
                "handlingUnitNumber": this._parameters.palleteDetails.handlingUnit,
                "storageLocation": this._parameters.palleteDetails.storageLocation,
                "isInventoryManaged": true,
                "userId": this._controller.getUserId(),
                "dateTime": this._getIssueDt(),
                "comments": `${this._parameters.sequence}`,
                "calculatedData": null,
                "customFieldData":  null
            };

            let sUrl = this._controller.getAssemblyDataSourceUri() + "order/goodsIssue";
            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        if(!oResponseData.txnId){
                            this._error = {errorMessage: "Nie zwrócono txnID"};
                        }
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        this._error = {errorMessage: `${oRequestParameters.handlingUnitNumber}${this._errorHandler.getTextFromError(oError)}`};
                        resolve();
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
        getCreatedIssue: function(){   
            if(this._createdIssue){
                return this._createdIssue;
            }
            return undefined;
            
        },
        getError: function(){
            if(this._error){
                return this._error;
            }
            return undefined;
        }
    });
});