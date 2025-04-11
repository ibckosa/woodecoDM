sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/IssuesManager",
    "ibc/dm/plugins/wcPodToolsProvider/HuGenerator",
    "sap/dm/dme/model/AjaxUtil",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/Sfc"
], function (ObjectUI5, ErrorHandler, SfcRepository, OrderRepository, IssuesManager, HuGenerator, AjaxUtil, TextHandler, Sfc) {
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
        },

        executeIssue: async function(){
            this._oSfc = await SfcRepository.readSfcApi(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.sfc);
            this._oOrder = await OrderRepository.readOrder(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.order);
            let oSingleOperationSfc = false;
            let oLastOperation = true;

            debugger;

            if(oSingleOperationSfc){
                await this._issueMultiLastOper();
            }else if(oLastOperation){
                await this._issueMultiLastOper();
            }else{
                await this._issueMultiNotLastOper();
            }


            
        },

        _issueSingleOper: async function(){
            this._generalSfcChecks();
        },

        _issueMultiNotLastOper: async function(){
            this._generalSfcChecks();
        },

        _issueMultiLastOper: async function(){
            this._generalSfcChecks();
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let oSfcAvailQuan = oSfcStep.quantityInWork + oSfcStep.quantityInQueue;
            if(oSfcAvailQuan < this._oReceiptParameters.quantity){
                await this._executeSfcMerge();
            }else if(oSfcStep.quantityInWork < oSfcStep.quantityInWork){
                this._oErrorHandler.throwError("errorSfcNotInWork");
            }
            
            let oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
                                                   this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, this._oReceiptParameters.quantity);
            await oIssuesManager.prepareIssues();
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

            await oIssuesManager.executeIssues();
            this._refreshPod();

        },

        _getSfcStep: function(){
            let oSfcStep = this._oSfc.steps.find( step => { return step.operation.operation === this._oReceiptParameters.operationActivity }); 
            if(oSfcStep){
                //throw error
            }
            return oSfcStep;
        },
        _generalSfcChecks: function(){
            if(this._oSfc.getStatusCode() !== "403"){
                this._oErrorHandler.throwError("errorSfcNotInWork");
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
        _splitSfc: async function(oIssuesManager){
            let oNewSfc = await this._execeuteSplitSfc();
            this._oReceiptParameters.sfc = oSplitReturn.newSfc;
            oIssuesManager.changeSfcNumber(oReceiptParameters.sfc);
        },
        _execeuteSplitSfc: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/split";
            let oRequestParameters = {
                plant: this._oReceiptParameters.plant,
                sfc: this._oReceiptParameters.sfc,
                newSfcs: [{quantity: this._oReceiptParameters.quantity}] };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve(oResponseData.newSfcs[0]);
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
                            this._oErrorHandler.throwErrorPopup(this._oTextHandler.getText("errorCheckRequiredParams"));
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
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._oTextHandler.getText("confirmTitle"),
                        content: new Text({ text: this._oTextHandler.getText("confirmQuestion") }),
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
                                this._oErrorHandler.throwErrorNoDisplay("");
                            }.bind(this)
                        })
                    });
                }

               this.oApproveDialog.open();
            });
        },
        _executeYieldConfirmation: async function(){
            let sUrl = this._oController.getSfcExecutionDataSourceUri() + "sfc/complete";
            let oRequestParameters = {
                operation: this._oReceiptParameters.operationActivity,
                quantity: this._oReceiptParameters.quantity,
                resource: this._oReceiptParameters.workCenter,
                sfcs: [ this._oReceiptParameters.sfc ]
            };
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
            let sUrl = this._oController.getPackingRestDataSourceUri()  + "packingUnits";

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
            if(parseInt(this._oReceiptParameters.quantity) >= parseInt(this._oReceiptParameters.sfcQuantity)){
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
        _executeSfcMerge: async function(){
            let oSfcsToMerge = [];
            let oSfcsToOff = [];
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let oSfcRemainingQuan = this._oReceiptParameters.quantity - (oSfcStep.quantityInWork + oSfcStep.quantityInQueue);
            if(oSfcRemainingQuan < 0){
                this._oErrorHandler.throwErrorPopup("");
            };

            let oSfcsOrder = await this._getSfcListForOperation();

            let oSfcsAvailToMerge = oSfcsOrder.filter( sfc=>{ return ( sfc.steps[0].resource === null || sfc.steps[0].resource === this._oReceiptParameters.resource ) && sfc.sfc !== this._oSfc.getSfcNumber() });

            for( const sfcMerge of oSfcsAvailToMerge){
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

            if(oSfcRemainingQuan > 0){
                this._oErrorHandler.throwErrorPopup("error.q1.mergeNotEnoughQuan");
            }

            if(this._oSfc.getStatusCode() === '403'){
                oSfcsToOff.push(this._oSfc.getSfcNumber())
            ;}

            await Sfc.signOffSfcs(this._oController, this._oReceiptParameters.plant, oSfcsToOff, this._oReceiptParameters.operationActivity, "P3_BL1");
            await Sfc.mergeSfcs(this._oController, this._oReceiptParameters.plant, this._oSfc.getSfcNumber(), oSfcsToMerge);
            await Sfc.startSfcs(this._oController, this._oReceiptParameters.plant, [this._oSfc.getSfcNumber()], this._oReceiptParameters.operationActivity, "P3_BL1" );
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
                        reject(oError);
                    }
                );

            });
        }

    });
});