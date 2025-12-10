sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/HuGenerator",
    "ibc/dm/plugins/wcPodToolsProvider/IssuesManagerV2",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/Sfc",
    "sap/m/Dialog",
    "sap/m/library",
    "ibc/dm/plugins/wcPodToolsProvider/SfcReceiptPrint",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderReceiptsFromProgressIndicator",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository",
    "ibc/dm/plugins/wcPodToolsProvider/DataCollectionSaver",
    "ibc/dm/plugins/wcPodToolsProvider/ConfirmDialog",
], function (ObjectUI5, ErrorHandler, SfcRepository, OrderRepository, HuGenerator, IssuesManagerV2, TextHandler, Sfc, Dialog, mobileLibrary, SfcReceiptPrint, MaterialRepository, 
    OrderReceiptsFromProgressIndicator, ResourceRepository, DataCollectionSaver, ConfirmDialog) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.SfcMOReceipt", {
        constructor: function(oController, oReceiptParameters){
            this._oController = oController;
            this._oReceiptParameters = oReceiptParameters;
            this._oErrorHandler = new ErrorHandler(this._oController);
            this._oTextHandler = new TextHandler();


            
            // var oReceiptParameters = { plant : oPodController.getUserPlant(),
            //     order: aSelectionFirstRow.getShopOrder().getShopOrder(),
            //     material: aSelectionFirstRow.getSfcData().getMaterial() ,
            //     materialVersion: aSelectionFirstRow.getSfcData().getMaterialVersion(),
            //     quantity: parseInt(this.byId("inputReceiptQuantity").getValue()),
            //     unitOfMeasure: isOrderEwm.unitOfMeasure,		
            //     sfc: aSelectionFirstRow.getSfc().getSfc(),
            //     storageLocation: isOrderEwm.storageLocation,
            //     resource: aSelectionFirstRow.getSfcData().getResource(),
            //     sfcQuantity: aSelectionFirstRow.getSfcData().getQuantity(),
            //     operationActivity: aSelectionFirstRow.getSfcData().getOperation(),
            //     workCenter: aSelectionFirstRow.getSfcData().getWorkCenter() };
            //     sales_item: "",
            //     sales_item_position ""
            //     itemNumberErp
            //     routing
            //     routingVersion
            
            //     plant: plant
            //     automaticIssues: false/true
        },

        executeReceipt: async function(){

            this._oOrder = await OrderRepository.readOrderByPassBuffer(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.order);
            this._oSfc = await SfcRepository.ReadSfcBypassBuffer(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.sfc, this._oReceiptParameters.routing, this._oReceiptParameters.routingVersion  );
            this._oMaterial = await MaterialRepository.getMaterialInstance(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.material);
            this._oResource = await ResourceRepository.getResourceInstance(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.resource);


            this._oReceiptParameters.totalQuantity = this._oReceiptParameters.quantity * this._oReceiptParameters.packageNumber * this._oReceiptParameters.palletesNumber;
            this._oReceiptParameters.quantity  = this._oReceiptParameters.quantity * this._oReceiptParameters.packageNumber;
            this._oReceiptParameters.packageNumber = 1;


            let automaticIssues = this._oResource.getConsumptionMode()==="AUTOMATIC";            

            this._fillMissingParameters();
            await this._generalChecks();
            let oStorageLocation = await this._getStorageLocation();
            let oCurrentStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            this._oReceiptParameters.stepId = oCurrentStep.stepId;

            if(!oStorageLocation.isEWMManagedStorageLocation){
                await this._checkRequiredParams();
                await this._checkConfirmMm(); }

            let sourceSfc = this._oReceiptParameters.sfc;

            let issueManager;
            if(automaticIssues){
                issueManager = new IssuesManagerV2(this._oController, { sfcNumber: this._oReceiptParameters.sfc,
                                                                        orderNumber: this._oReceiptParameters.order,
                                                                        operation: this._oReceiptParameters.operationActivity,
                                                                        plant: this._oReceiptParameters.plant,
                                                                        workCenter: this._oReceiptParameters.workCenter,
                                                                        resource: this._oReceiptParameters.resource,
                                                                        salesOrder: this._oOrder.getCustomerOrder(),
                                                                        salesOrderItem: this._oOrder.getCustomerOrderItem(),
                                                                        mode: "Q1" });
                await issueManager.initializeManager();
                await issueManager.checkQuantityAvailable(this._oReceiptParameters.totalQuantity);
            }


            for(let i=0; i<this._oReceiptParameters.palletesNumber;i++){
                this._oReceiptParameters.sfc = await Sfc.splitSfc(this._oController, this._oReceiptParameters.plant, sourceSfc , this._oReceiptParameters.quantity, true);
                let sfc = await SfcRepository.ReadSfcBypassBuffer(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.sfc, this._oReceiptParameters.routing, this._oReceiptParameters.routingVersion );
                await sfc.complete(this._oReceiptParameters.operationActivity, this._oReceiptParameters.resource);
                //await this._executeQuantityConfirmation();
                if(oStorageLocation.isEWMManagedStorageLocation === true){
                    await this._executeEwmReceipt();
                }else{
                    await this._executeMmReceipt();
                }

                if(automaticIssues){
                    await issueManager.executeIssues(this._oReceiptParameters.quantity,this._oReceiptParameters.sfc );
                }
                OrderReceiptsFromProgressIndicator.addQuantityToProgress(this._oReceiptParameters.order, this._oReceiptParameters.quantity);
                this._oReceiptParameters.receiptCount = this._oReceiptParameters.receiptCount + 1;
                await this._saveDataCollection(new Date().toISOString().slice(0, 19) + 'Z', issueManager);                        
                await this._printLabel();

                if(automaticIssues){
                    await this.sleep(4000);
                }
            }

            this._refreshPod();
        },

        _generalChecks: async function(){
            if(this._oSfc.getStatusCode() !== "403"){
                this._oErrorHandler.throwError("errorSfcNotInWork");
            }

            let maxPalletesPerReceipt = this._oResource.getMaxPalletesPerReceipt();
            if(maxPalletesPerReceipt < this._oReceiptParameters.palletesNumber){
                this._oErrorHandler.throwErrorPopup("error.q1.maxPalleteQuan", maxPalletesPerReceipt);
            }

            if(this._oOrder.getOARequired()){
                let orderInput = this._oOrder.getInputOrder();
                let orderInputDate = this._oOrder.getInputOrderDate();
                if(!orderInput||!orderInputDate){
                    this._oErrorHandler.throwError("error.multiOrders.OAOrderNotAssigned");
                }
            }

            if(this._oReceiptParameters.quantity *  this._oReceiptParameters.palletesNumber > this._oReceiptParameters.maxLeftQuantity ){
                this._oErrorHandler.throwErrorPopup("error.q1.exceedMaxQuantity", this._oReceiptParameters.maxQuantity, this._oOrder.getInternalUom());
            }

            if(this._oReceiptParameters.quantity  > this._oReceiptParameters.quantityPerPalletMax || 
               this._oReceiptParameters.quantity  < this._oReceiptParameters.quantityPerPalletMin){
                await this._checkConfirmTolerance();
            }

            if(this._oResource.getMOSelectionMode().toUpperCase() === 'AUTOMATIC'){
                let leftPlannedPalletes = this._oReceiptParameters.plannedPalletes - this._oReceiptParameters.receiptCount;
                if(leftPlannedPalletes < 0){
                    leftPlannedPalletes = 0;
                }
                if(leftPlannedPalletes<this._oReceiptParameters.palletesNumber){
                        let confirmDialog = new ConfirmDialog();
                        confirmDialog.setContentText("information.q1.exceedPlannedReceipts", leftPlannedPalletes);
                        await confirmDialog.show();
                }
            }
        },
        _getStorageLocation: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "/inventory/v1/storageLocations";
            let oParameters = { plant: this._oReceiptParameters.plant,
                                storageLocation: this._oOrder.getPutawayStorageLocation() };


            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                    oResponseData => {
                        if(oResponseData.content.length > 0)
                        {
                            resolve(oResponseData.content[0])
                        }else{
                            //throw werror
                        }
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },

        _checkRequiredParams: async function(){
            var sUrl = this._oController.getPublicApiRestDataSourceUri() + "datacollection/v1/uncollectedParameters";
            var oRequestParameters = {
                plant: this._oReceiptParameters.plant,
                sfc: this._oReceiptParameters.sfc,
                operation: this._oReceiptParameters.operationActivity,
                resource: this._oReceiptParameters.resource };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oRequestParameters,
                    oResponseData => {
                        if(oResponseData.uncollectedParams.length>0){
                            reject({ message: this._oTextHandler.getText("errorCheckRequiredParams"),
                                     displayType: "POPUP" });
                        }
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }
                );
            });
        },
        _checkConfirmMm: async function(){
            return await new Promise((resolve,reject)=>{
                this._resolveConfirmMm = resolve;
                this._rejectConfirmMm = reject;
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._oTextHandler.getText("confirmTitle"),
                        content: new sap.m.Text({ text: this._oTextHandler.getText("confirmQuestion") }),
                        beginButton: new sap.m.Button({
                            type: mobileLibrary.ButtonType.Emphasized,
                            text: this._oTextHandler.getText("answerYes"),
                            press: async function () {
                                    this.oApproveDialog.close();
                                    this._resolveConfirmMm();
                            }.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: this._oTextHandler.getText("answerNo"),
                            press: function () {
                                this.oApproveDialog.close();
                                this._rejectConfirmMm({ message: "",
                                                        displayType: "NO_DISPLAY" })
                                this._oErrorHandler.throwErrorNoDisplay("");
                            }.bind(this)
                        })
                    });
                }

               this.oApproveDialog.open();
            });
        },
        _executeQuantityConfirmation: async function(){
            let sUrl = this._oController.getSfcExecutionDataSourceUri() + "quantityConfirmation/v1/confirm";

            var oRequestParameters = {
                plant: this._oReceiptParameters.plant,
                shopOrder: this._oReceiptParameters.order,
                sfc: this._oReceiptParameters.sfc,
                operationActivity: this._oReceiptParameters.operationActivity,
                yieldQuantity: this._oReceiptParameters.quantity ,
                yieldQuantityUnit: this._oReceiptParameters.unitOfMeasure,
                workCenter: this._oReceiptParameters.workCenter
            }




            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oRequestParameters,
                    oResponseData => {
                        this._oController.showSuccessMessage(this._oTextHandler.getText("messageConfirmationSuccess"), true, true);
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {                        
                        reject(oError);
                    }
                );
            });
        },
        _executeEwmReceipt: async function(){
            let oHu = await HuGenerator.generate(this._oController, this._oReceiptParameters.material, this._oReceiptParameters.materialVersion, this._oReceiptParameters.plant);
            let sUrl = this._oController.getPublicApiRestDataSourceUri()  + "inventory/v1/inventory/ewmGoodsReceipts";
            this._oReceiptParameters.handlingUnit = oHu;

            let oParameters = { lineItems: [ { material: this._oReceiptParameters.material,
                                               materialVersion: this._oReceiptParameters.materialVersion,
                                               packingMaterial: "PALETA",
                                               handlingUnit: oHu,
                                               quantity: { unitOfMeasure: { commercialUnitOfMeasure: this._oReceiptParameters.unitOfMeasure }, value: this._oReceiptParameters.quantity },
                                               requireQuantityToleranceCheck: false,
                                               comments: `${this._oReceiptParameters.salesOrder}${this._oReceiptParameters.salesOrderItem}`,
                                               sfc: this._oReceiptParameters.sfc }],
                                order: this._oReceiptParameters.order,
                                plant: this._oReceiptParameters.plant,
                                additionalParameters: [ { parameterName: "SALES_ORDER",
                                                          parameterValue: this._oReceiptParameters.salesOrder },
                                                        { parameterName: "ITEM_NUMBER",
                                                          parameterValue: this._oReceiptParameters.itemNumberErp },
                                                        { parameterName: "SALES_ORDER_ITEM",
                                                          parameterValue: this._oReceiptParameters.salesOrderItem } ]
             };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oParameters,
                    (oResponseData) => {
                        this._oController.showSuccessMessage(this._oTextHandler.getText("messageReceiptSuccess"), true, true);
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }
                );

            });
        },
        _executeMmReceipt: async function(){
            ///no implementation needed
        },
        _refreshPod: function(){
            // let oPodSelectionModel = this._oController.getPodSelectionModel();
            // if(parseInt(this._oReceiptParameters.quantity * this._oReceiptParameters.packageNumber * this._oReceiptParameters.palletesNumber) >= parseInt(this._oReceiptParameters.sfcQuantity)){
            //     oPodSelectionModel.setInputValue("");
            //     oPodSelectionModel.clearSelections();

            //     this._oController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
            //     this._oController.onClosePress();
            //     this._oController.navigateToMainPage();
            // }else{    
            //     this._oController.publish("_onQuantityChangeIncomingEvent", { sendToAllPages: true });    
            //     this._oController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
            // }

            // this._oController.publish("_onQuantityChangeIncomingEvent", { sendToAllPages: true });    
            // this._oController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
        },
        _checkSfcQuantityInWork: function(){
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);

            if(oSfcStep.quantityInWork < this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber){
                this._oErrorHandler.throwError("errorSfcNotInWork");
            }

        },
        _fillMissingParameters: function(){
            this._oReceiptParameters.storageLocation = this._oOrder.getPutawayStorageLocation();
            this._oReceiptParameters.unitOfMeasure = this._oOrder.getInternalUom();
        },
        _printLabel: async function(){
            let oPrintingDetails = {};
            oPrintingDetails.plant  = this._oReceiptParameters.plant;
            oPrintingDetails.order = this._oReceiptParameters.order;
            oPrintingDetails.workCenter = this._oReceiptParameters.workCenter;
            oPrintingDetails.resource = this._oReceiptParameters.resource;
            oPrintingDetails.sfc = this._oReceiptParameters.sfc;
            oPrintingDetails.material = this._oReceiptParameters.material;
            oPrintingDetails.HU = this._oReceiptParameters.handlingUnit;
            oPrintingDetails.orderLineCustomValues = this._oOrder.getOrderLineCustomValues(this._oReceiptParameters.itemNumber);
            oPrintingDetails.orderCustomValues = this._oOrder.getHeaderCustomValues();
            oPrintingDetails.materialCustomValues = this._oMaterial.getCustomValues();
            oPrintingDetails.printer = this._oReceiptParameters.printer;
            oPrintingDetails.operation = this._oReceiptParameters.stepId;
            oPrintingDetails.document = 'DM_A4';
            oPrintingDetails.quantity = this._oReceiptParameters.quantity;
            oPrintingDetails.printingCopies = this._oReceiptParameters.printingCopies;
            oPrintingDetails.printType = SfcReceiptPrint.PRINT_Q1;
            oPrintingDetails.inputOrder = this._oOrder.getInputOrder();
            oPrintingDetails.inputOrderDate = this._oOrder.getInputOrderDate();
            oPrintingDetails.plannedPalletes = this._oReceiptParameters.plannedPalletes;
            oPrintingDetails.receiptCount = this._oReceiptParameters.receiptCount;
            
            let oSfcReceiptPrint = new SfcReceiptPrint(this._oController, oPrintingDetails);
            await oSfcReceiptPrint.print();
        },

        _checkConfirmTolerance: async function(){
            return await new Promise((resolve,reject)=>{
                this._resolveConfirmTolerance = resolve;
                this._rejectConfirmTolerance = reject;
                if (!this.oToleranceDialog) {
                    this.oToleranceDialog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._oTextHandler.getText("label.q1.confirmTitle"),
                        content: new sap.m.Text({ text: this._oTextHandler.getText("labels.q1.palleteTolerance",this._oReceiptParameters.quantityPerPalletMin, this._oReceiptParameters.quantityPerPalletMax) }),
                        beginButton: new sap.m.Button({
                            type: mobileLibrary.ButtonType.Emphasized,
                            text: this._oTextHandler.getText("answerYes"),
                            press: async function () {
                                    this.oToleranceDialog.close();
                                    this.oToleranceDialog.destroy();
                                    this._resolveConfirmTolerance();
                            }.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: this._oTextHandler.getText("answerNo"),
                            press: function () {
                                this.oToleranceDialog.close();
                                this.oToleranceDialog.destroy();
                                this._rejectConfirmTolerance({ message: "",
                                                                displayType: "NO_DISPLAY" })
                                this._oErrorHandler.throwErrorNoDisplay("");
                            }.bind(this)
                        })
                    });
                }

               this.oToleranceDialog.open();
            });
        },
        _saveDataCollection: async function(postingDate, issueManager){
            let parameterValues = [];

            let guid = crypto.randomUUID();
            let date = new Date();
            debugger;

            // parameterValues.push({ name: "GUID",
            //                        comment: guid,
            //                        value: guid });

            // parameterValues.push({ name: "DATE_CREATED",
            //                        comment: guid,
            //                        value: date.toJSON() });

            // parameterValues.push({ name: "Q1/Q3",
            //                        comment: guid,
            //                        value: "Q1" });

            // parameterValues.push({ name: "QUANTITY",
            //                        comment: guid,
            //                        value: `${this._oReceiptParameters.quantity}` });

            // parameterValues.push({ name: "UOM",
            //                        comment: guid,
            //                        value: this._oReceiptParameters.unitOfMeasure });

            // parameterValues.push({ name: "MATERIAL",
            //                        comment: guid,
            //                        value: this._oReceiptParameters.material });

            // parameterValues.push({ name: "ITEM_NO",
            //                        comment: guid,
            //                        value: `${this._oReceiptParameters.itemNumberErp}` });
                                   

            // if(this._oReceiptParameters.handlingUnit){
            //     parameterValues.push({
            //         name: "HU",
            //         comment: guid,
            //         value: this._oReceiptParameters.handlingUnit });
            // }else{
            //     parameterValues.push({ 
            //         name: "HU",
            //         comment: guid,
            //         value: "" });
            // }

                                   
            // parameterValues.push({ name: "SALES_ORDER",
            //                        comment: guid,
            //                        value: this._oReceiptParameters.salesOrder });

            // parameterValues.push({ name: "SALES_ORDER_ITEM",
            //                        comment: guid,
            //                        value: this._oReceiptParameters.salesOrderItem });

            // parameterValues.push({ name: "USER",
            //                        comment: guid,
            //                        value: this._oController.getUserId() });

            // parameterValues.push({ name: "Q3_CODE",
            //                        comment: guid,
            //                        value: "" });

            // parameterValues.push({ name: "NC_CODE",
            //                        comment: guid,
            //                        value: "" });

            // parameterValues.push({ name: "NC_CODE_DESCRIPTION",
            //                        comment: guid,
            //                        value: "" });

            // parameterValues.push({ name: "CANCELLED",
            //                        comment: guid,
            //                        value: false });

            
            //let issueAsString = "";
            let issuesAsString = [];
            if(issueManager){
                let issuesCreated = issueManager.getCreatedIssues();
                for(const issue of issuesCreated){
                    let issueAsString = Object.entries(issue)
                                            .map(([key, value]) => `${key}:${value}`)
                                            .join('||');
                    issuesAsString.push(issueAsString);

                    // parameterValues.push({ name: `CONSUMPTION`,
                    //                        comment: guid,
                    //                        value: issueAsString });
                }
            }

            
            // let sUrl = this._oController.getPublicApiRestDataSourceUri() + "datacollection/v1/log";
            // let oRequestParameters = {
            //     plant: this._oReceiptParameters.plant,
            //     group: { dcGroup: "WOODECO_PROD_ACTIVITY",
            //              version: "A" },
            //     operation: { operation: this._oReceiptParameters.operationActivity,
            //                   version: "ERP001" },
            //     parameterValues: parameterValues,
            //     stepId: this._oReceiptParameters.stepId,
            //     workCenter: this._oReceiptParameters.workCenter,
            //     resource: this._oReceiptParameters.resource,
            //     sfcs: [ this._oReceiptParameters.sfc ]
            // };

            // return await new Promise((resolve,reject)=>{
            //     this._oController.ajaxPostRequest(sUrl, oRequestParameters,
            //         oResponseData => {
            //             resolve();
            //         },
            //         (oError, sHttpErrorMessage) => {                        
            //             resolve();
            //         }
            //     );
            // });

            await DataCollectionSaver.saveProductionDC(
                this._oController,
                {
                    plant: this._oReceiptParameters.plant,
                    sfc: this._oReceiptParameters.sfc,
                    resource: this._oReceiptParameters.resource,
                    operation: this._oReceiptParameters.operationActivity,
                    productionProcessType: "Q1",
                    q3Code: "",
                    quantity: `${this._oReceiptParameters.quantity}`,
                    uom: this._oReceiptParameters.unitOfMeasure,
                    material: this._oReceiptParameters.material,
                    itemNo: `${this._oReceiptParameters.itemNumberErp}`,
                    salesOrder: this._oReceiptParameters.salesOrder, 
                    saledOrderItem: this._oReceiptParameters.salesOrderItem,
                    hu: this._oReceiptParameters.handlingUnit ? this._oReceiptParameters.handlingUnit : "",
                    cancelled: false,
                    user: this._oController.getUserId(),
                    consumption: issuesAsString,
                    dateCreated: date.toJSON(),
                    processStart: "",
                    processStop: "",
                    ncCode: "",
                    ncCodeDescription: "",
                    guid: guid
                }

            );
        },
        sleep: async function(ms){
        return new Promise(resolve => setTimeout(resolve, ms));
        }

    });
});