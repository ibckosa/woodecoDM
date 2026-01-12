sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "sap/m/library",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderReceiptsFromProgressIndicator",
    "ibc/dm/plugins/wcPodToolsProvider/IssueReader",
    "ibc/dm/plugins/wcPodToolsProvider/DataCollectionSaver"
], function (ObjectUI5, ErrorHandler, OrderRepository, SfcRepository, mobileLibrary, TextHandler, OrderReceiptsFromProgressIndicator, IssueReader, DataCollectionSaver) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.SfcMovementReverse", {
        constructor: function(controller, plant, workCenter, resource, parameters, orderNumber, currentSfcNumber, routing, routingVersion){
            this._controller = controller;
            this._plant = plant;
            this._parameters = parameters;
            this._resource = resource;
            this._workCenter = workCenter;
            this._orderNumber = orderNumber;
            this._oErrorHandler = new ErrorHandler(controller);
            this._currentSfcNumber = currentSfcNumber;
            this._routing = routing;
            this._routingVersion = routingVersion;
            this._oTextHandler = new TextHandler();
        },
        execute: async function(){
            
            this._getZweiEndpoint();
            this._getDummyOrder();
            this._getStornoEndpoint();
            this._Order = await OrderRepository.readOrder(this._controller, this._plant, this._orderNumber);
            this._sfc = await SfcRepository.ReadSfcBypassBuffer(this._controller, this._plant, this._parameters.SFC_NUMBER, this._routing, this._routingVersion);

            await this._checkConfirmAction();
            await this._fillMissingTxnid();

            switch(this._parameters["Q1/Q3"]){
                case "AI":
                    await this._executeAI();
                    break;
                case "Q1":
                    await this._executeQ1();
                    break;
                case "Q3":
                    await this._executeQ3();
                    break;
            }

            // this._controller.publish("_onQuantityChangeIncomingEvent", { sendToAllPages: true });    
            // this._controller.publish("PodSelectionChangeEvent", { sendToAllPages: true });
        },
        _executeAI: async function(){
            if(this._parameters.CONSUMPTION){
                for(const consumption of this._parameters.CONSUMPTION){
                    await this._executeConsumptionReverse(consumption);
                }
            }

            await this._saveReversedDataCollection();

        },
        _executeQ1: async function(){
            if(this._sfc.getIsMultiOperation() && this._sfc.checkIsLastOperation(this._parameters.SFC_STEP.operation.operation)){
                await this._createNewSfc();
            }else if(this._sfc.getIsMultiOperation()){
                await this._sfc.invalidate();
            }

            if(this._parameters.HU){
                await this._executeReceiptStorno();
                await this._executeHuReductionInDM();
            }

            await this._stornoConfirmation();

            if(this._parameters.CONSUMPTION){
                for(const consumption of this._parameters.CONSUMPTION){
                    await this._executeConsumptionReverse(consumption);
                }
            }

            await this._saveReversedDataCollection();
            await this._callGrCancellactionAlert();

            this._updateProgressBar();
        },
        _executeQ3: async function(){
            if(this._sfc.getIsMultiOperation() && this._sfc.checkIsLastOperation(this._parameters.SFC_STEP.operation.operation)){
                await this._createNewSfc();
            }
            await this._stornoConfirmation();

            if(this._parameters.CONSUMPTION){
                for(const consumption of this._parameters.CONSUMPTION){
                    await this._executeConsumptionReverse(consumption);
                }
            }

            await this._saveReversedDataCollection();


        },
        _executeConsumptionReverse: async function(consumption){
            let request = { plant: this._plant, 
                            transactionId: consumption.txnId,
                            material: consumption.material,
                            sfc: this._parameters.SFC_NUMBER  };
            


            let url = this._controller.getPublicApiRestDataSourceUri() +  "/pe/api/v1/process/processDefinitions/start?key=REG_b19ac9f7-f8c3-43c9-b326-3e5800bec9d3"; //"processorder/v1/goodsissue/cancellations";

            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPostRequest(url, request,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve();
                    }
                );
            });
        },
        _saveReversedDataCollection: async function(){
            let parameterValues = [];

            debugger;

            

            // parameterValues.push({ name: "GUID",
            //                        comment: this._parameters.GUID,
            //                        value: this._parameters.GUID });

            // parameterValues.push({ name: "Q1/Q3",
            //                        comment: this._parameters.GUID,
            //                        value: this._parameters["Q1/Q3"] });

            // parameterValues.push({ name: "CANCELLED",
            //                        comment: this._parameters.GUID,
            //                        value: true });


            // if(this._parameters.QUANTITY){
            //     parameterValues.push({ name: "QUANTITY",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.QUANTITY });
            // }

            // if(this._parameters.Q3_CODE){
            //     parameterValues.push({ name: "Q3_CODE",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.Q3_CODE });
            // }

            // if(this._parameters.NC_CODE){
            //     parameterValues.push({ name: "NC_CODE",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.NC_CODE });
            // }

            // if(this._parameters.NC_CODE_DESCRIPTION){
            //     parameterValues.push({ name: "NC_CODE_DESCRIPTION",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.NC_CODE_DESCRIPTION });
            // }

            // if(this._parameters.UOM){
            //     parameterValues.push({ name: "UOM",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.UOM });
            // }

            // if(this._parameters.MATERIAL){
            //     parameterValues.push({ name: "MATERIAL",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.MATERIAL });
            // }

            // if(this._parameters.ITEM_NO){
            //     parameterValues.push({ name: "ITEM_NO",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.ITEM_NO });
            // }

            // if(this._parameters.SALES_ORDER){
            //     parameterValues.push({ name: "SALES_ORDER",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.SALES_ORDER });
            // }

            // if(this._parameters.SALES_ORDER_ITEM){
            //     parameterValues.push({ name: "SALES_ORDER_ITEM",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.SALES_ORDER_ITEM });
            // }


            // if(this._parameters.HU){
            //     parameterValues.push({ name: "HU",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.HU });
            // }

            // if(this._parameters.USER){
            //     parameterValues.push({ name: "USER",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.USER });
            // }


            // if(this._parameters.QUANTITY){
            //     parameterValues.push({ name: "QUANTITY",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.QUANTITY });
            // }

            // if(this._parameters.DATE_CREATED){
            //     parameterValues.push({ name: "DATE_CREATED",
            //         comment: this._parameters.GUID,
            //         value: this._parameters.DATE_CREATED });
            // }
            let issuesAsString = [];
            if(this._parameters.CONSUMPTION){
                for(const consumption of this._parameters.CONSUMPTION){
                    let issueAsString = Object.entries(consumption)
                    .map(([key, value]) => `${key}:${value}`)
                    .join('||');
                    issuesAsString.push(issueAsString);
                    // parameterValues.push({ name: "CONSUMPTION",
                    //     comment: this._parameters.GUID,
                    //     value: issueAsString });
                }
            }

            await DataCollectionSaver.saveProductionDC(
                this._controller,
                {
                    plant: this._plant,
                    sfc: this._parameters.SFC_NUMBER,
                    resource: this._resource,
                    operation: this._parameters.SFC_STEP.operation.operation,
                    productionProcessType: this._parameters["Q1/Q3"],
                    q3Code: this._parameters.Q3_CODE,
                    quantity: this._parameters.QUANTITY?`${this._parameters.QUANTITY}`:undefined,
                    uom: this._parameters.UOM,
                    material: this._parameters.MATERIAL,
                    itemNo: this._parameters.ITEM_NO,
                    salesOrder: this._parameters.SALES_ORDER, 
                    saledOrderItem: this._parameters.SALES_ORDER_ITEM,
                    hu: this._parameters.HU,
                    cancelled: true,
                    user: this._parameters.USER,
                    consumption: issuesAsString,
                    dateCreated: this._parameters.DATE_CREATED,
                    // processStart: this._startProcessDate.toJSON(),
                    // processStop: stopProcessDate.toJSON(),
                    ncCode: this._parameters.NC_CODE,
                    ncCodeDescription: this._parameters.NC_CODE_DESCRIPTION,
                    guid: this._parameters.GUID,
                    errors: ""
                }

            );


            // let url = this._controller.getPublicApiRestDataSourceUri() + "datacollection/v1/log";
            // let request = {
            //     plant: this._plant,
            //     group: { dcGroup: "WOODECO_PROD_ACTIVITY",
            //              version: "A" },
            //     operation: { operation: this._parameters.SFC_STEP.operation.operation,
            //                   version: this._parameters.SFC_STEP.operation.version },
            //     parameterValues: parameterValues,
            //     stepId: this._parameters.SFC_STEP.stepId,
            //     resource: this._resource,
            //     workCenter: this._workCenter,
            //     sfcs: [ this._parameters.SFC_NUMBER ]
            // };

            // return await new Promise((resolve,reject)=>{
            //     this._controller.ajaxPostRequest(url, request,
            //         oResponseData => {
            //             resolve();
            //         },
            //         (oError, sHttpErrorMessage) => {                        
            //             resolve();
            //         }
            //     );
            // });
        
        },
        _executeReceiptStorno: async function(){
            let url = this._controller.getPublicApiRestDataSourceUri() + this._zweiEndpoint;
            let request = {};

            

            if(this._Order.getIsOrderMO()){
                request = this._getMORequest();
            }else{
                request = this._getSORequest();

            }

            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPostRequest(url, request,
                    (oResponseData) => {
                        resolve();
                    },
                    oError=>{
                        reject(oError);
                    }   
                );
            });
        },
        _getMORequest: function(){
            return { WERK: this._plant,
                BEWART: "102",
                HU: this._parameters.HU,
                LGORT: this._Order.getPutawayStorageLocation(),
                CHARGE: this._parameters.HU,
                VORNR: this._parameters.SFC_STEP.stepId,
                MATNR: this._parameters.MATERIAL,
                MATTYP: " ",
                ZLO: " ",
                MENGE: this._parameters.QUANTITY,
                MENGE_EINH: this._parameters.UOM,
                AUFNR: this._orderNumber,
                HY_LOSNR:  this._parameters.HU,
                VVDAT: this._getSapDate(this._parameters.CREATED_DATETIME),
                WDAT: "99991231",
                VFDAT: "99991231",
                KLASSE: "G",
                STATUS: "F",
                TST: "F",
                FU_7: this._parameters.SALES_ORDER_ITEM,
                FU_13: this._parameters.ITEM_NO,
                FU_45: this._parameters.SALES_ORDER,
                FU_54: `${this._parameters.SALES_ORDER}${this._parameters.SALES_ORDER_ITEM}`
             };
        },
        _getZweiEndpoint: function(){
            this._zweiEndpoint = this._controller.getConfigurationValue("zweiURL");
            if(!this._zweiEndpoint||this._zweiEndpoint===""){
                this._oErrorHandler.throwError("error.logHu.notConfiguredEndpoint");
            }
        },
        _getSapDate: function(sDateTime){
            if (!sDateTime) return "";
            var oDate = new Date(sDateTime);
            oDate.setHours(oDate.getHours() - 6);
            if (isNaN(oDate)) return "";
            var year = oDate.getFullYear();
            var month = String(oDate.getMonth() + 1).padStart(2, '0');
            var day = String(oDate.getDate()).padStart(2, '0');
            return `${year}${month}${day}`;
        },
        _executeHuReductionInDM: async function(){
            let inventories = await this._findInventories();

            for(const inventory of inventories){
                await this._consumeInventory(inventory);
            }
        },
        _findInventories: async function(){
            let request = { plant: this._plant,
                            handlingUnit: this._parameters.HU,
                            material: this._parameters.MATERIAL };

            let url = this._controller.getPublicApiRestDataSourceUri() + "inventory/v1/inventories";

            return await new Promise((resolve,reject)=>{
                this._controller.ajaxGetRequest(url, request,
                    (oResponseData) => {
                        resolve(oResponseData.content);
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve();
                    }   
                );
            });
        },
        _consumeInventory: async function(inventory){
            let request = {
                "shopOrder": this._dummyOrder,///numer zlecenia
                "batchId": this._dummySfc, ///SFC
                "operationActivity": "DUMMY_OPERATION",//operation activity
                // "bomComponentRef": this.consumeData.bomComponentRef,
                "material": inventory.material,
                "batchNumber": null,
                "shopOrderLocationRef": null,
                "workCenter": this._workCenter,
                "inventory": inventory.inventoryId, //inventory id
                "isBomComponent": false, //true or false
                "quantity": {
                    "value": inventory.quantityOnHand.value,
                    "unitOfMeasure": {
                        "uom": inventory.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,//As the API does not support UoM yet
                        "internalUom": inventory.quantityOnHand.unitOfMeasure.internalUnitOfMeasure,
                        "shortText": null,
                        "longText": null,
                        "numerator": null,
                        "denominator": null,
                    }
                },
                "useFullHandlingUnit": false, //true or false
                "handlingUnitNumber": inventory.handlingUnit,
                "storageLocation":inventory.storageLocation,
                "isInventoryManaged": true,
                "userId": this._controller.getUserId(),
                "dateTime": this._getIssueDt(),
                "comments": "",
                "calculatedData": null,
                "customFieldData":  null
            };
            
            let url = this._controller.getAssemblyDataSourceUri() + "order/goodsIssue";
            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPostRequest(url, request,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve();
                    }   
                );
            });
        },
        _getIssueDt(){
            let today = new Date();
            let oYear = today.getFullYear().toString();
            let oMonth = (today.getMonth()+1).toString();
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
        _getSORequest(){
            return { WERK: this._plant,
                BEWART: "102",
                HU: this._parameters.HU,
                LGORT: this._Order.getPutawayStorageLocation(),
                CHARGE: this._parameters.HU,
                VORNR: this._parameters.SFC_STEP.stepId,
                MATNR: this._parameters.MATERIAL,
                MATTYP: " ",
                ZLO: " ",
                MENGE: this._parameters.QUANTITY,
                MENGE_EINH: this._parameters.UOM,
                AUFNR: this._orderNumber,
                HY_LOSNR:  this._parameters.HU,
                VVDAT: this._getSapDate(this._parameters.CREATED_DATETIME),
                WDAT: "99991231",
                VFDAT: "99991231",
                KLASSE: "G",
                STATUS: "F",
                TST: "F",
             };
        },
        _getDummyOrder: function(){
            let oConfiguration = this._controller.getConfiguration();
            if(!oConfiguration){this._oErrorHandler.throwError("error.readConfiguration")};

            if(!oConfiguration.dummyOrder||oConfiguration.dummyOrder===""){this._oErrorHandler.throwError("error.logHU.noDummyOrder")}
            if(!oConfiguration.dummySfc||oConfiguration.dummySfc===""){this._oErrorHandler.throwError("error.logHU.noDummySfc")}

            this._dummyOrder = oConfiguration.dummyOrder;
            this._dummySfc =  oConfiguration.dummySfc;
        },
        _getStornoEndpoint: function(){
            let oConfiguration = this._controller.getConfiguration();
            if(!oConfiguration){this._oErrorHandler.throwError("error.readConfiguration")};

            if(!oConfiguration.stornoURL||oConfiguration.stornoURL===""){this._oErrorHandler.throwError("Brak skonfigurowanego endpointa dla storno.")}

            this._stornoEndpoint = oConfiguration.stornoURL;
        },
        _createNewSfc: async function(){
            //this._currentSfcNumber
            let request = {
                plant: this._plant,
                sfc: this._currentSfcNumber,
                newSfcs: [{
                    sfc: `${this._parameters.SFC_NUMBER}R`,
                    quantity: this._parameters.QUANTITY
                }],
                allowOverproduction: true,
                routingStepId: this._parameters.SFC_STEP.stepId

            };

            let url = this._controller.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/split";
            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPostRequest(url, request,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve();
                    }   
                );
            });
        },

        _stornoConfirmation: async function(){
            let url = this._controller.getPublicApiRestDataSourceUri() + this._stornoEndpoint;
            let request = { IV_AUFNR: this._orderNumber,
                IV_SFC: this._parameters.SFC_NUMBER,
                IV_DATE: this._getSapDate(this._parameters.CREATED_DATETIME),
                IV_QUAN: this._parameters.QUANTITY,
                IV_VORNR: this._parameters.SFC_STEP.stepId,
                IV_GRUND: this._parameters.Q3_CODE };


            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPostRequest(url, request,
                    (oResponseData) => {
                        resolve();
                    },
                    oError=>{
                        reject(oError);
                    }   
                );
            });
        },
        _checkConfirmAction: async function(){
            return await new Promise((resolve,reject)=>{
                this._resolveConfirm = resolve;
                this._rejectConfirm = reject;
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new sap.m.Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._oTextHandler.getText("labels.reverse.confirmationWarning"),
                        content: new sap.m.Text({ text: this._oTextHandler.getText("labels.reverse.confimrationQuestion") }),
                        beginButton: new sap.m.Button({
                            type: mobileLibrary.ButtonType.Emphasized,
                            text: this._oTextHandler.getText("labels.reverse.confimrationYes"),
                            press: async function () {
                                    this.oApproveDialog.close();
                                    this._resolveConfirm();
                            }.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: this._oTextHandler.getText("labels.reverse.confimrationNo"),
                            press: function () {
                                this.oApproveDialog.close();
                                this._rejectConfirm({ message: "",
                                                        displayType: "NO_DISPLAY" })
                                this._oErrorHandler.throwErrorNoDisplay("");
                            }.bind(this)
                        })
                    });
                }

               this.oApproveDialog.open();
            });
        },
        _updateProgressBar: function(){
            OrderReceiptsFromProgressIndicator.addQuantityToProgress(this._orderNumber, - this._parameters.QUANTITY);
        },
        _callGrCancellactionAlert: async function(){
            let request = { plant: this._plant, 
                            hu: this._parameters.HU,
                            material: this._parameters.MATERIAL,
                            order: this._orderNumber,
                            resource: this._resource,
                            sfc: this._parameters.SFC_NUMBER,
                            user: this._controller.getUserId() };
            


            let url = this._controller.getPublicApiRestDataSourceUri() + "/pe/api/v1/process/processDefinitions/start?key=REG_e30a5451-87c2-4c0f-9611-4d1eb072a13b";

            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPostRequest(url, request,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve();
                    }
                );
            });
        },
        _fillMissingTxnid: async function(){
           if(this._parameters.CONSUMPTION){
                for(const consumption of this._parameters.CONSUMPTION){
                    if(!consumption.txnId&&consumption.issueGuid){
                        consumption.txnId = await this._getTxnIdForIssue(consumption);
                    }
                }
            }
        },
        _getTxnIdForIssue: async function(consumption){
            let result = "";
            let issuesForConsumption = await IssueReader.readIssuesSfc(this._controller, this._plant, this._parameters.SFC_NUMBER, consumption.material, consumption.materialVersion)

            let issueForConsumption = issuesForConsumption.find(issue=>{ return issue.comments === consumption.issueGuid });
            if(issueForConsumption){
                result = issueForConsumption.transactionId;
            }
            return result;
        }
    });
});