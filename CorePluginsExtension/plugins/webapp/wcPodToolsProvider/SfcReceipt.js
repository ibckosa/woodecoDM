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
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderReceiptsFromProgressIndicator",
    "ibc/dm/plugins/wcPodToolsProvider/CompleteOrder",
    "ibc/dm/plugins/wcPodToolsProvider/DataCollectionSaver"
], function (ObjectUI5, ErrorHandler, SfcRepository, OrderRepository, IssuesManager, HuGenerator, AjaxUtil, TextHandler, Sfc, Dialog, mobileLibrary, SfcReceiptPrint, MaterialRepository, OrderReceiptsFromProgressIndicator, CompleteOrder, DataCollectionSaver) {
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
            //     plant: plant
            //     automaticIssues: false/true
        },

        executeIssue: async function(){
            this._oReceiptParameters.quantity = this._oReceiptParameters.quantity * this._oReceiptParameters.numberOfRolls;
            this._oReceiptParameters.numberOfRolls = 1;
            this._oReceiptParameters.totalQuantity = this._oReceiptParameters.quantity * this._oReceiptParameters.numberOfPalletes;
            this._startProcessDate = new Date();

            let oSingleOperationSfc = true;
            let oLastOperation = false;
            let oMultiNumberPalletes = (this._oReceiptParameters.numberOfPalletes > 1);
            this._oSfc = await SfcRepository.ReadSfcBypassBuffer(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.sfc, this._oReceiptParameters.routing, this._oReceiptParameters.routingVersion);
            this._oOrder = await OrderRepository.readOrder(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.order);
            this._oMaterial = await MaterialRepository.getMaterialInstance(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.material);
            this._fillMissingParameters();
            let oSteps = this._oSfc.getSteps();
            let oLastStep = this._oSfc.getLastStep();
            let oCurrentStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let _oPrintingEndpoint = this._getPrintingEndPoint();
            this._oReceiptParameters.stepId = oCurrentStep.stepId;

            
            if(oSteps.length > 1){
                oSingleOperationSfc = false;
            }

            if(oLastStep.operation.operation === oCurrentStep.operation.operation){
                oLastOperation = true;
            }

            await this._generalChecks(oSingleOperationSfc, oLastOperation);
            this._oReceiptParameters.sfc = this._oSfc.getSfcNumber();
            if(oSingleOperationSfc){
                await this._issueSingleOper();
            }else if(oLastOperation&&!oMultiNumberPalletes){
                await this._issueMultiLastOper();
            }else if(!oMultiNumberPalletes){
                await this._issueMultiNotLastOper();
            }else if(oMultiNumberPalletes && oLastOperation){
                await this._issueMultiLastOperMutliPalletes();
            }else{
                await this._issueMultiNotLastOperMutliPalletes();
            }
            if(!oMultiNumberPalletes&&!oSingleOperationSfc){
                await this._printLabel(_oPrintingEndpoint);
            } 
            
            this._reloadQ1Plugin = true;
            this._refreshPod(oSingleOperationSfc, oLastOperation);
        },

        _issueSingleOper: async function(){
            this._checksIssueSigleOper();
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);

            if(this._oReceiptParameters.numberOfPalletes > 1 && this._oReceiptParameters.automaticIssues){
                let oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
                                                    this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, this._oReceiptParameters.totalQuantity, this._oOrder.getCustomerOrder(), this._oOrder.getCustomerOrderItem());
                await oIssuesManager.prepareIssues();
            }

            let oStorageLocation = await this._getStorageLocation();

            if(!oStorageLocation.isEWMManagedStorageLocation){            //only one receipt in MM scenario because of no SFC split
                this._oReceiptParameters.quantity = this._oReceiptParameters.quantity * this._oReceiptParameters.numberOfPalletes;
                this._oReceiptParameters.numberOfPalletes = 1;
                await this._checkRequiredParams();
                await this._checkConfirmMm();
            }

           
            for(let i=0;i<this._oReceiptParameters.numberOfPalletes;i++){
                this._oReceiptParameters.sfc = this._oSfc.getSfcNumber();
                let oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
                    this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, this._oReceiptParameters.quantity, this._oOrder.getCustomerOrder(), this._oOrder.getCustomerOrderItem());
                if(this._oReceiptParameters.automaticIssues){
                    await oIssuesManager.prepareIssues();
                } 

                if(oStorageLocation.isEWMManagedStorageLocation){
                    await this._splitSfc(oIssuesManager, true);
                }
    
                await this._executeYieldConfirmation();
                if(oStorageLocation.isEWMManagedStorageLocation === true){
                    await this._executeEwmReceipt();
                }else{
                    await this._executeMmReceipt();
                }
                if(this._oReceiptParameters.automaticIssues){
                    await oIssuesManager.executeIssues();
                }

                OrderReceiptsFromProgressIndicator.addQuantityToProgress(this._oReceiptParameters.order, this._oReceiptParameters.quantity);
                await this._printLabel();
                await this._saveDataCollection(new Date().toISOString().slice(0, 19) + 'Z', oIssuesManager, true); 
                
            }

        },

        _issueMultiNotLastOper: async function(){
            this._checksIssueSigleOper();
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
                                                   this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, this._oReceiptParameters.quantity, this._oOrder.getCustomerOrder(), this._oOrder.getCustomerOrderItem());
            if(this._oReceiptParameters.automaticIssues){
                await oIssuesManager.prepareIssues();
            }
            
            let oStorageLocation = await this._getStorageLocation();
            if(oStorageLocation.isEWMManagedStorageLocation){
                if(this._oReceiptParameters.quantity < oSfcStep.quantityInWork||1===1){
                    await this._splitSfc(oIssuesManager, true);
                }
            }else{
                await this._checkRequiredParams();
                await this._checkConfirmMm();
            }

            await this._executeYieldConfirmation();
            if(this._oReceiptParameters.automaticIssues){
                await oIssuesManager.executeIssues();
            }
            OrderReceiptsFromProgressIndicator.addQuantityToProgress(this._oReceiptParameters.order, this._oReceiptParameters.quantity);
            await this._saveDataCollection(new Date().toISOString().slice(0, 19) + 'Z', oIssuesManager);    
            

        },

        _issueMultiLastOper: async function(){
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let oSfcAvailQuan = oSfcStep.quantityInWork + oSfcStep.quantityInQueue;

            let oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
                                                   this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, this._oReceiptParameters.quantity, this._oOrder.getCustomerOrder(), this._oOrder.getCustomerOrderItem());
            if(this._oReceiptParameters.automaticIssues){
                await oIssuesManager.prepareIssues();
            }
            
            
            if(oSfcAvailQuan < this._oReceiptParameters.quantity){
                await this._executeSfcMerge();
            }else if(oSfcStep.quantityInWork < this._oReceiptParameters.quantity){
                await Sfc.startSfcs(this._oController, this._oReceiptParameters.plant, [this._oSfc.getSfcNumber()], this._oReceiptParameters.operationActivity, this._oReceiptParameters.resource );
                oSfcStep.quantityInWork = oSfcAvailQuan;
                oSfcStep.quantityInQueue = 0;
            }
            

            let oStorageLocation = await this._getStorageLocation();
            if(oStorageLocation.isEWMManagedStorageLocation){
                if(this._oReceiptParameters.quantity < oSfcStep.quantityInWork){
                    await this._splitSfc(oIssuesManager);
                }
            }else{
                await this._checkRequiredParams();
                let oReturnCheckConfirmMm = await this._checkConfirmMm();
                if(oReturnCheckConfirmMm.approve === false){
                    return;
                };
            }
            await this._executeYieldConfirmation();
            if(oStorageLocation.isEWMManagedStorageLocation === true){
                await this._executeEwmReceipt();
            }else{
                await this._executeMmReceipt();
            }
            if(this._oReceiptParameters.automaticIssues){
                await oIssuesManager.executeIssues();
            }
            OrderReceiptsFromProgressIndicator.addQuantityToProgress(this._oReceiptParameters.order, this._oReceiptParameters.quantity);  
            await this._saveDataCollection(new Date().toISOString().slice(0, 19) + 'Z', oIssuesManager);  
            
        },

        _getSfcStep: function(){
            let oSfcStep = this._oSfc.steps.find( step => { return step.operation.operation === this._oReceiptParameters.operationActivity }); 
            if(oSfcStep){
                //throw error
            }
            return oSfcStep;
        },
        _generalChecks: async function(isSingleOperation, isLastOperation){
            if(this._oSfc.getStatusCode() !== "403" && ( isSingleOperation || !isLastOperation )){
                this._oErrorHandler.throwError("errorSfcNotInWork");
            }

            let orderProgress = OrderReceiptsFromProgressIndicator.getOrderProgress(this._oReceiptParameters.order);
            if(!orderProgress || !orderProgress.model){
                this._oErrorHandler.throwError("Error, progress bar not ready");
            }
            let orderMaxQuantity = this._oOrder.getMaxOrderQuantitySO();

            if(orderMaxQuantity< ( orderProgress.quantityDone + this._oReceiptParameters.quantity * this._oReceiptParameters.numberOfPalletes )){
                this._oErrorHandler.throwErrorPopup("error.q1.exceedMaxQuantity", orderMaxQuantity, this._oReceiptParameters.unitOfMeasure);
            }

            let palleteQuanRange = this._oOrder.getPalleteMinMax(1);
            if(this._oReceiptParameters.quantity < palleteQuanRange.minPalleteQuantity || this._oReceiptParameters.quantity > palleteQuanRange.maxPalleteQuantity){
                await this._checkConfirmTolerance(palleteQuanRange);
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
                        oError.apiName = "/inventory/v1/storageLocations";
                        reject(oError);
                    }   
                );

            });
        },
        _splitSfc: async function(oIssuesManager, allowOverProduction = false){
            let oNewSfc = await this._execeuteSplitSfc(allowOverProduction);
            this._oReceiptParameters.sfc = oNewSfc;
            oIssuesManager.changeSfcNumber(this._oReceiptParameters.sfc);
        },
        _execeuteSplitSfc: async function(allowOverProduction){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/split";
            let oRequestParameters = {
                plant: this._oReceiptParameters.plant,
                sfc: this._oReceiptParameters.sfc,
                allowOverproduction: allowOverProduction,
                newSfcs: [{quantity: this._oReceiptParameters.quantity }] };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve(oResponseData.newSfcs[0]);
                    },
                    (oError, sHttpErrorMessage) => {
                        oError.apiName = "sfc/v1/sfcs/split";
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
                        oError.apiName = "datacollection/v1/uncollectedParameters";
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
        _checkMergeNotEnough: async function(oQuan){
            return await new Promise((resolve,reject)=>{
                this._resolveConfirmMerge = resolve;
                this._rejectConfirmMerge = reject;
                if (!this.oMergeDialog) {
                    this.oMergeDialog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._oTextHandler.getText("label.q1.mergeNotEnoughQuanTitle"),
                        content: new sap.m.Text({ text: this._oTextHandler.getText("label.q1.mergeNotEnoughQuan", oQuan) }),
                        beginButton: new sap.m.Button({
                            type: mobileLibrary.ButtonType.Emphasized,
                            text: this._oTextHandler.getText("answerYes"),
                            press: async function () {
                                    this.oMergeDialog.close();
                                    this._resolveConfirmMerge();
                            }.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: this._oTextHandler.getText("answerNo"),
                            press: function () {
                                this.oMergeDialog.close();
                                this._rejectConfirmMerge({ message: "",
                                                           displayType: "NO_DISPLAY" })
                            }.bind(this)
                        })
                    });
                }

               this.oMergeDialog.open();
            });
        },
        _executeYieldConfirmation: async function(){
            let sUrl = this._oController.getSfcExecutionDataSourceUri() + "sfc/complete?async=false";
            let oRequestParameters = {
                operation: this._oReceiptParameters.operationActivity,
                quantity: this._oReceiptParameters.quantity,
                resource: this._oReceiptParameters.resource,
                sfcs: [ this._oReceiptParameters.sfc ]
            };
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oRequestParameters,
                    oResponseData => {
                        //this._oController.showSuccessMessage(this._oTextHandler.getText("messageConfirmationSuccess"), true, true);
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {      
                        oError.apiName = "sfc/complete";                  
                        reject(oError);
                    }
                );
            });
        },
        _executeEwmReceipt: async function(){
            let oHu = await HuGenerator.generate(this._oController, this._oReceiptParameters.material, this._oReceiptParameters.materialVersion, this._oReceiptParameters.plant);
            let sUrl = this._oController.getPackingRestDataSourceUri()  + "packingUnits";
            this._oReceiptParameters.handlingUnit = oHu;
            let oParameters = { carrier: null,
                                content: [{
                                    id: null,
                                    packingUnit: null,
                                    quantity: this._oReceiptParameters.quantity,
                                    sfc: {ref: "SFCBO:"+ this._oReceiptParameters.plant +"," + this._oReceiptParameters.sfc}
                                }],
                                currentLocation: null,
                                material: {ref: "ItemBO:"+ this._oReceiptParameters.plant + ",PALETA,A"},
                                number: oHu,
                                packingType: null,
                                status: "CLOSED",
                                workCenterLocation: null };
            return await new Promise((resolve,reject)=>{
                AjaxUtil.post(sUrl, oParameters,
                    (oResponseData) => {
                        this._oController.showSuccessMessage(this._oTextHandler.getText("messageReceiptSuccess"), true, true);
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        oError.apiName = "packingUnits"; 
                        reject(oError);
                    }
                );

            });
        },
        _executeMmReceipt: async function(){
            ///not implementation needed
        },
        _refreshPod: function(isSingleOperation, isLastOperation){
            let oPodSelectionModel = this._oController.getPodSelectionModel();
            if(parseInt(this._oReceiptParameters.quantity) >= parseInt(this._oReceiptParameters.sfcQuantity)){
                if(!isSingleOperation && isLastOperation){
                    let completeOrder = new CompleteOrder(this._oController,
                        {
                            workCenter: this._oReceiptParameters.workCenter,
                            resource: this._oReceiptParameters.resource,
                            plant: this._oReceiptParameters.plant,
                            order: this._oReceiptParameters.order,
                            operation: this._oReceiptParameters.operationActivity,
                            sfc: this._oReceiptParameters.sfc,
                            routing: this._oReceiptParameters.routing,
                            routingVersion: this._oReceiptParameters.routingVersion
                        }
                    )
                    completeOrder.execute();
                    oPodSelectionModel.setInputValue("");
                    oPodSelectionModel.clearSelections();

                    this._oController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
                    this._oController.onClosePress();
                    this._oController.navigateToMainPage();
                }


            }else{    
                 //this._oController.publish("IbcCustomReceipt", { sendToAllPages: false });
                // this._oController.publish("_onQuantityChangeIncomingEvent", { sendToAllPages: true });    
                // this._oController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
            }
        },
        _executeSfcMerge: async function(askNotEnoughQuan = true){
            let oSfcsToMerge = [];
            let oSfcsToOff = [];
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let oSfcRemainingQuan = this._oReceiptParameters.quantity * this._oReceiptParameters.numberOfPalletes - (oSfcStep.quantityInWork + oSfcStep.quantityInQueue);
            if(oSfcRemainingQuan < 0){
                this._oErrorHandler.throwErrorPopup("");
            };

            let oSfcsOrder = await this._getSfcListForOperation();

            let oSfcsAvailToMerge = oSfcsOrder.filter( sfc=>{ return ( sfc.steps[0].resource === null || sfc.steps[0].resource === this._oReceiptParameters.resource ) && sfc.sfc !== this._oSfc.getSfcNumber() });

            for( const sfcMerge of oSfcsAvailToMerge){
                sfcMerge.steps = sfcMerge.steps.filter(step=>{return step.stepRouting.routing === this._oReceiptParameters.routing && step.stepRouting.version === this._oReceiptParameters.routingVersion;});
                let oSfcMergeStep = sfcMerge.steps.find( sfcMergeStep => { return sfcMergeStep.operation.operation === this._oReceiptParameters.operationActivity; } );
                if(!oSfcMergeStep){continue;}
                let oSfcMergeQuan = oSfcMergeStep.quantityInWork + oSfcMergeStep.quantityInQueue;
                if((oSfcMergeQuan) > oSfcRemainingQuan){
                    let oNewSfc = await Sfc.splitSfc(this._oController, this._oReceiptParameters.plant, sfcMerge.sfc, oSfcRemainingQuan);
                    this._oReceiptParameters.sfcQuantity = this._oReceiptParameters.sfcQuantity + oSfcRemainingQuan;
                    oSfcRemainingQuan = 0;
                    oSfcsToMerge.push(oNewSfc);
                    if(sfcMerge.status.code === "403"){oSfcsToOff.push(oNewSfc)};

                }else{
                    oSfcRemainingQuan = oSfcRemainingQuan - oSfcMergeQuan;
                    this._oReceiptParameters.sfcQuantity = this._oReceiptParameters.sfcQuantity + oSfcMergeQuan;
                    oSfcsToMerge.push(sfcMerge.sfc);
                    if(sfcMerge.status.code === "403"){oSfcsToOff.push(sfcMerge.sfc)};
                }
                if(oSfcRemainingQuan <= 0){break;}
            }

            if(oSfcRemainingQuan > 0 && askNotEnoughQuan){
                let oPossibleQuan = this._oReceiptParameters.quantity * this._oReceiptParameters.numberOfPalletes - oSfcRemainingQuan;
                await this._checkMergeNotEnough(oPossibleQuan);
                this._oReceiptParameters.quantity = oPossibleQuan;
                //this._oErrorHandler.throwErrorPopup("error.q1.mergeNotEnoughQuan");
            }else if(oSfcRemainingQuan > 0){
                this._oErrorHandler.throwErrorPopup("error.q1.mergeNotEnoughQuan2");
            }

            if(this._oSfc.getStatusCode() === '403'){
                oSfcsToOff.push(this._oSfc.getSfcNumber())
            ;}

            if(oSfcsToOff.length > 0){
                await Sfc.signOffSfcs(this._oController, this._oReceiptParameters.plant, oSfcsToOff, this._oReceiptParameters.operationActivity, this._oReceiptParameters.resource);
            }

            if(oSfcsToMerge.length > 0){
                await Sfc.mergeSfcs(this._oController, this._oReceiptParameters.plant, this._oSfc.getSfcNumber(), oSfcsToMerge);
            }   

            await Sfc.startSfcs(this._oController, this._oReceiptParameters.plant, [this._oSfc.getSfcNumber()], this._oReceiptParameters.operationActivity, this._oReceiptParameters.resource );
        },
        _getSfcListForOperation: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri()  + "sfc/v1/worklist/sfcs";

            let oParameters = { plant: this._oReceiptParameters.plant,
                                workCenter: this._oReceiptParameters.workCenter,
                                "filter.operation": this._oReceiptParameters.operationActivity,
                                "filter.order": this._oReceiptParameters.order 
                                };
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        oError.apiName = "sfc/v1/worklist/sfcs"; 
                        reject(oError);
                    }
                );
            });
        },
        _checkSfcQuantityInWork: function(){
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);

            if(oSfcStep.quantityInWork < this._oReceiptParameters.totalQuantity){
                this._oErrorHandler.throwError("errorSfcNotInWork");
            }

        },
        _fillMissingParameters: function(){
            this._oReceiptParameters.storageLocation = this._oOrder.getPutawayStorageLocation();
            this._oReceiptParameters.unitOfMeasure = this._oOrder.getUom();
        },
        _getPrintingEndPoint: function(){
            return '';
        },
        _printLabel: async function(){
            let orderProgress = OrderReceiptsFromProgressIndicator.getOrderProgress(this._oReceiptParameters.order);

            let oPrintingDetails = {};
            oPrintingDetails.plant  = this._oReceiptParameters.plant;
            oPrintingDetails.order = this._oReceiptParameters.order;
            oPrintingDetails.workCenter = this._oReceiptParameters.workCenter;
            oPrintingDetails.resource = this._oReceiptParameters.resource;
            oPrintingDetails.sfc = this._oReceiptParameters.sfc;
            oPrintingDetails.material = this._oReceiptParameters.material;
            oPrintingDetails.HU = this._oReceiptParameters.handlingUnit;
            oPrintingDetails.orderLineCustomValues = this._oOrder.getOrderLineCustomValues(1);
            oPrintingDetails.orderCustomValues = this._oOrder.getHeaderCustomValues();
            oPrintingDetails.materialCustomValues = this._oMaterial.getCustomValues();
            oPrintingDetails.quantity = this._oReceiptParameters.quantity;
            oPrintingDetails.printer = this._oReceiptParameters.printer;
            oPrintingDetails.operation = this._oReceiptParameters.stepId;
            oPrintingDetails.document = 'DM_INFO';
            oPrintingDetails.inputOrder = this._oOrder.getInputOrder();
            oPrintingDetails.inputOrderDate = this._oOrder.getInputOrderDate();
            oPrintingDetails.receiptCount = orderProgress.receiptCount;
            oPrintingDetails.printType = SfcReceiptPrint.PRINT_Q1;
            let plannedQuantity = this._oOrder.getProducationQuantity();
            if(plannedQuantity){
                let qantityFromPackingCode = this._oOrder.getQuantityFromPackingCode();
                if(qantityFromPackingCode){
                    oPrintingDetails.plannedPalletes = Math.ceil(plannedQuantity/qantityFromPackingCode);
                }
            }else{
                oPrintingDetails.plannedPalletes = 0;
            }


            //order from formatki
            //data from formatki
            oPrintingDetails.printingCopies = this._oReceiptParameters.printingCopies;
            
            let oSfcReceiptPrint = new SfcReceiptPrint(this._oController, oPrintingDetails);
            await oSfcReceiptPrint.print();
        },
        _issueMultiLastOperMutliPalletes: async function(){
            let oSfcsToProcess = [];
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let oSfcAvailQuan = oSfcStep.quantityInWork + oSfcStep.quantityInQueue;
            let _oPrintingEndpoint = this._getPrintingEndPoint();

            let oQuantity = this._oReceiptParameters.quantity * this._oReceiptParameters.numberOfPalletes;

            let oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
                this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, oQuantity, this._oOrder.getCustomerOrder(), this._oOrder.getCustomerOrderItem());
            if(this._oReceiptParameters.automaticIssues){
                await oIssuesManager.prepareIssues();
            }
            
            
            if(oQuantity>oSfcAvailQuan){
                await this._executeSfcMerge(false);
            }else if(oQuantity>oSfcStep.quantityInWork){
                await Sfc.startSfcs(this._oController, this._oReceiptParameters.plant, [this._oSfc.getSfcNumber()], this._oReceiptParameters.operationActivity, this._oReceiptParameters.resource );
            }

            if(this._oReceiptParameters.numberOfPalletes>1){
                let oNewSfcs = await this._multipleSfcSplit(this._oReceiptParameters.numberOfPalletes, this._oReceiptParameters.quantity);
                for(const newSfc of oNewSfcs){
                    this._oReceiptParameters.sfcQuantity = this._oReceiptParameters.sfcQuantity - this._oReceiptParameters.quantity;
                    oSfcsToProcess.push( {  sfc: newSfc,
                                            quantity: this._oReceiptParameters.quantity
                     });
                }
            }
            

            oSfcsToProcess.push( { sfc: this._oReceiptParameters.sfc,
                                   quantity: this._oReceiptParameters.sfcQuantity });

            for(const sfcToProcess of oSfcsToProcess){
                this._oReceiptParameters.sfc = sfcToProcess.sfc;
                this._oReceiptParameters.sfcQuantity = sfcToProcess.quantity;
                oSfcStep.quantityInWork = sfcToProcess.quantity;
                oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
                    this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, this._oReceiptParameters.quantity, this._oOrder.getCustomerOrder(), this._oOrder.getCustomerOrderItem());
                
                if(this._oReceiptParameters.automaticIssues){
                    await oIssuesManager.prepareIssues();
                }

                let oStorageLocation = await this._getStorageLocation();
                if(oStorageLocation.isEWMManagedStorageLocation){
                    if(this._oReceiptParameters.quantity < oSfcStep.quantityInWork){
                        await this._splitSfc(oIssuesManager);
                    }
                }else{
                    await this._checkRequiredParams();
                    await this._checkConfirmMm();
                }
                await this._executeYieldConfirmation();
                if(oStorageLocation.isEWMManagedStorageLocation === true){
                    await this._executeEwmReceipt();
                }else{
                    await this._executeMmReceipt();
                }
                if(this._oReceiptParameters.automaticIssues){
                    await oIssuesManager.executeIssues();
                }
                OrderReceiptsFromProgressIndicator.addQuantityToProgress(this._oReceiptParameters.order, this._oReceiptParameters.quantity);
                await this._printLabel(_oPrintingEndpoint);
                await this._saveDataCollection(new Date().toISOString().slice(0, 19) + 'Z', oIssuesManager);   
                
            }
        },
        _issueMultiNotLastOperMutliPalletes: async function(){
            let _oPrintingEndpoint = this._getPrintingEndPoint();
            this._oReceiptParameters.quantity;
            await this._issueMultiNotLastOper();
            await this._printLabel(_oPrintingEndpoint);
        },

        _multipleSfcSplit: async function(palletesNumber, quantity){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/split";
            let oRequestParameters = {
                plant: this._oReceiptParameters.plant,
                sfc: this._oReceiptParameters.sfc,
                newSfcs: [] };


            for(let i = 0;i<palletesNumber - 1;i++){
                oRequestParameters.newSfcs.push({quantity: quantity});
            }

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve(oResponseData.newSfcs);
                    },
                    (oError, sHttpErrorMessage) => {
                        oError.apiName = "sfc/v1/sfcs/split"; 
                        reject(oError);
                    }
                );
            });
        },
        _checksIssueSigleOper: function(){
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);

            if(oSfcStep.quantityInWork < 1){
                this._oErrorHandler.throwError("errorSfcNotInWork");
            }
        },
        _saveDataCollection: async function(postingDate, issueManager, repeatWrongSave=false){
            // let parameterValues = [];

            let guid = crypto.randomUUID();
            let date = new Date();
            let stopProcessDate = new Date();
            //let date = date.toJSON();
            // debugger;
            // parameterValues.push({ name: "GUID",
            //                        comment: guid,
            //                        value: guid });

            // parameterValues.push({ name: "DATE_CREATED",
            //                        comment: guid,
            //                        value: date.toJSON() });
            // parameterValues.push({ name: "PROCESS_START",
            //                        comment: guid,
            //                        value: this._startProcessDate.toJSON() });
            // parameterValues.push({ name: "PROCESS_STOP",
            //                        comment: guid,
            //                        value: stopProcessDate.toJSON() });

            // parameterValues.push({ name: "Q1/Q3",
            //                        comment: guid,
            //                        value: "Q1" });

            // parameterValues.push({ name: "QUANTITY",
            //                        comment: guid,
            //                        value: `${this._oReceiptParameters.quantity}` });

            // parameterValues.push({ name: "UOM",
            //                        comment: guid,
            //                        value: this._oOrder.getInternalUom() }); //value: this._oReceiptParameters.unitOfMeasure

            // parameterValues.push({ name: "MATERIAL",
            //                        comment: guid,
            //                        value: this._oReceiptParameters.material });

            // parameterValues.push({ name: "ITEM_NO",
            //                        comment: guid,
            //                        value: "0001" });
                                   

            // if(this._oReceiptParameters.handlingUnit){
            //     parameterValues.push({ name: "HU",
            //         comment: guid,
            //         value: this._oReceiptParameters.handlingUnit });
            // }else{
            //     parameterValues.push({ name: "HU",
            //         comment: guid,
            //         value: "" });
            // }
                                   
            // parameterValues.push({ name: "Q3_CODE",
            //                        comment: guid,
            //                        value: "" });

            // parameterValues.push({ name: "NC_CODE",
            //                        comment: guid,
            //                        value: "" });

            // parameterValues.push({ name: "NC_CODE_DESCRIPTION",
            //                        comment: guid,
            //                        value: "" });

            // parameterValues.push({ name: "USER",
            //                        comment: guid,
            //                        value: this._oController.getUserId() });

            // parameterValues.push({ name: "CANCELLED",
            //                        comment: guid,
            //                        value: false });

            let issuesCreated = issueManager.getCreatedIssues();
            let issuesAsString = [];
            for(const issue of issuesCreated){
                let issueAsString = Object.entries(issue)
                                        .map(([key, value]) => `${key}:${value}`)
                                        .join('||');
                issuesAsString.push(issueAsString);
                // parameterValues.push({ name: `CONSUMPTION`,
                //                        comment: guid,
                //                        value: issueAsString });
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

            // let that = this;

            // return await new Promise((resolve,reject)=>{
            //     this._oController.ajaxPostRequest(sUrl, oRequestParameters,
            //         async oResponseData => {
            //             if(!oResponseData||!oResponseData.success||(oResponseData.failedSfcs&&oResponseData.failedSfcs.length>0)){
            //                 await that._saveDataCollection('', issueManager);
            //             }

            //             resolve();
            //         },
            //         async (oError, sHttpErrorMessage) => {
            //             if(repeatWrongSave){
            //                 await that._saveDataCollection('', issueManager);
            //             }  
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
                    uom: this._oOrder.getInternalUom(),
                    material: this._oReceiptParameters.material,
                    itemNo: "0001",
                    salesOrder: "", 
                    saledOrderItem: "",
                    hu: this._oReceiptParameters.handlingUnit ? this._oReceiptParameters.handlingUnit : "",
                    cancelled: false,
                    user: this._oController.getUserId(),
                    consumption: issuesAsString,
                    dateCreated: date.toJSON(),
                    processStart: this._startProcessDate.toJSON(),
                    processStop: stopProcessDate.toJSON(),
                    ncCode: "",
                    ncCodeDescription: "",
                    guid: guid
                }

            );


        },
        _checkConfirmTolerance: async function(palleteQuanRange){
            return await new Promise((resolve,reject)=>{
                this._resolveConfirmTolerance = resolve;
                this._rejectConfirmTolerance = reject;
                if (!this.oToleranceDialog) {
                    this.oToleranceDialog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._oTextHandler.getText("label.q1.confirmTitle"),
                        content: new sap.m.Text({ text: this._oTextHandler.getText("labels.q1.palleteTolerance",palleteQuanRange.minPalleteQuantity, palleteQuanRange.maxPalleteQuantity) }),
                        beginButton: new sap.m.Button({
                            type: mobileLibrary.ButtonType.Emphasized,
                            text: this._oTextHandler.getText("answerYes"),
                            press: async function () {
                                    this.oToleranceDialog.close();
                                    this._resolveConfirmTolerance();
                            }.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: this._oTextHandler.getText("answerNo"),
                            press: function () {
                                this.oToleranceDialog.close();
                                this._rejectConfirmTolerance({ message: "",
                                                                displayType: "NO_DISPLAY" })
                                this._oErrorHandler.throwErrorNoDisplay("");
                            }.bind(this)
                        })
                    });
                }

               this.oToleranceDialog.open();
            });
        }
        
    });
});