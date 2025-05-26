sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/IssuesManager",
    "ibc/dm/plugins/wcPodToolsProvider/HuGenerator",
    "sap/dm/dme/model/AjaxUtil",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/Sfc",
    "sap/m/Dialog",
    "sap/m/library",
    "ibc/dm/plugins/wcPodToolsProvider/SfcReceiptPrint",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository"
], function (ObjectUI5, ErrorHandler, SfcRepository, OrderRepository, IssuesManager, HuGenerator, AjaxUtil, TextHandler, Sfc, Dialog, mobileLibrary, SfcReceiptPrint, MaterialRepository
    ,
) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.SfcReceipt", {
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
            
            //     plant: plant
            //     automaticIssues: false/true
        },

        executeReceipt: async function(){

            this._oOrder = await OrderRepository.readOrderByPassBuffer(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.order);
            this._oSfc = await SfcRepository.readSfcApi(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.sfc);
            this._oMaterial = await MaterialRepository.getMaterialInstance(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.material);
            let _oPrintingEndpoint = this._getPrintingEndPoint();

            this._fillMissingParameters();
            this._generalChecks();
            let oStorageLocation = await this._getStorageLocation();
            let oCurrentStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            this._oReceiptParameters.stepId = oCurrentStep.stepId;

            if(!oStorageLocation.isEWMManagedStorageLocation){
                await this._checkRequiredParams();
                await this._checkConfirmMm();
            }

            for(let i=0; i<this._oReceiptParameters.palletesNumber;i++){
                await this._executeQuantityConfirmation();
                if(oStorageLocation.isEWMManagedStorageLocation === true){
                    await this._executeEwmReceipt();
                }else{
                    await this._executeMmReceipt();
                }                        
                await this._printLabel(_oPrintingEndpoint);
            }

            this._refreshPod();
        },

        _getSfcStep: function(){
            let oSfcStep = this._oSfc.steps.find( step => { return step.operation.operation === this._oReceiptParameters.operationActivity }); 
            if(oSfcStep){
                //throw error
            }
            return oSfcStep;
        },
        _generalChecks: function(){
            if(this._oSfc.getStatusCode() !== "403"){
                this._oErrorHandler.throwError("errorSfcNotInWork");
            }

            if(this._oReceiptParameters.printer===""){
                this._oErrorHandler.throwError("error.printing.noPrinter");
            }


            if(this._oOrder.getOARequired()){
                let orderInput = this._oOrder.getInputOrder();
                let orderInputDate = this._oOrder.getInputOrderDate();
                if(!orderInput||!orderInputDate){
                    this._oErrorHandler.throwError("error.multiOrders.OAOrderNotAssigned");
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
                yieldQuantity: this._oReceiptParameters.quantity * this._oReceiptParameters.packageNumber,
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
                                               quantity: { unitOfMeasure: { commercialUnitOfMeasure: this._oReceiptParameters.unitOfMeasure }, value: this._oReceiptParameters.quantity * this._oReceiptParameters.packageNumber },
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
            ///not implementation needed
        },
        _refreshPod: function(){
            let oPodSelectionModel = this._oController.getPodSelectionModel();
            if(parseInt(this._oReceiptParameters.quantity * this._oReceiptParameters.packageNumber * this._oReceiptParameters.palletesNumber) >= parseInt(this._oReceiptParameters.sfcQuantity)){
                oPodSelectionModel.setInputValue("");
                oPodSelectionModel.clearSelections();

                this._oController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
                this._oController.onClosePress();
                this._oController.navigateToMainPage();
            }else{    
                this._oController.publish("_onQuantityChangeIncomingEvent", { sendToAllPages: true });    
                this._oController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
            }
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
        _getPrintingEndPoint: function(){
            let oReturn = this._oController.getConfigurationValue("printerEndPoint");

            if(!oReturn||oReturn===""){
                this._oErrorHandler.throwErrorPopup("error.printing.noEndpoint");
            }
            return oReturn;
        },
        _printLabel: async function(oEndpoint){
            let oPrintingDetails = {};
            oPrintingDetails.endpoint = oEndpoint;
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
            oPrintingDetails.quantity = this._oReceiptParameters.quantity * this._oReceiptParameters.packageNumber;
            oPrintingDetails.printer = this._oReceiptParameters.printer;
            oPrintingDetails.operation = this._oReceiptParameters.stepId;
            oPrintingDetails.document = 'WOODECO1';
            oPrintingDetails.quantity = this._oReceiptParameters.quantity * this._oReceiptParameters.packageNumber;
            oPrintingDetails.printingCopies = this._oReceiptParameters.printingCopies;
            
            let oSfcReceiptPrint = new SfcReceiptPrint(this._oController, oPrintingDetails);
            await oSfcReceiptPrint.print();
        }
    });
});