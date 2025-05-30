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
            //     plant: plant
            //     automaticIssues: false/true
        },

        executeIssue: async function(){
            let oSingleOperationSfc = true;
            let oLastOperation = false;
            let oMultiNumberPalletes = (this._oReceiptParameters.palletesNumber > 1 || this._oReceiptParameters.packageNumber > 1);
            this._oSfc = await SfcRepository.readSfcApi(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.sfc);
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

            this._generalChecks(oSingleOperationSfc, oLastOperation);
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
            if(!oMultiNumberPalletes){
                await this._printLabel(_oPrintingEndpoint);
            }
            
            
            this._reloadQ1Plugin = true;
            this._refreshPod();

            
        },

        _issueSingleOper: async function(){
            this._checksIssueSigleOper();
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
                                                   this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, this._oReceiptParameters.quantity);
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

            await this._saveDataCollection(new Date().toISOString().slice(0, 19) + 'Z', oIssuesManager);            
        },

        _issueMultiNotLastOper: async function(){
            this._checkSfcQuantityInWork();
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
                                                   this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, this._oReceiptParameters.quantity);
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
            if(this._oReceiptParameters.automaticIssues){
                await oIssuesManager.executeIssues();
            }

            await this._saveDataCollection(new Date().toISOString().slice(0, 19) + 'Z', oIssuesManager);    

        },

        _issueMultiLastOper: async function(){
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let oSfcAvailQuan = oSfcStep.quantityInWork + oSfcStep.quantityInQueue;

            let oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
                                                   this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, this._oReceiptParameters.quantity);
            if(this._oReceiptParameters.automaticIssues){
                await oIssuesManager.prepareIssues();
            }
            
            
            if(oSfcAvailQuan < this._oReceiptParameters.quantity){
                await this._executeSfcMerge();
            }else if(oSfcStep.quantityInWork < this._oReceiptParameters.quantity){
                await Sfc.startSfcs(this._oController, this._oReceiptParameters.plant, [this._oSfc.getSfcNumber()], this._oReceiptParameters.operationActivity, this._oReceiptParameters.resource );
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

            await this._saveDataCollection(new Date().toISOString().slice(0, 19) + 'Z', oIssuesManager);    
        },

        _getSfcStep: function(){
            let oSfcStep = this._oSfc.steps.find( step => { return step.operation.operation === this._oReceiptParameters.operationActivity }); 
            if(oSfcStep){
                //throw error
            }
            return oSfcStep;
        },
        _generalChecks: function(isSingleOperation, isLastOperation){
            if(this._oSfc.getStatusCode() !== "403" && ( isSingleOperation || !isLastOperation )){
                this._oErrorHandler.throwError("errorSfcNotInWork");
            }

            if(this._oReceiptParameters.printer===""){
                this._oErrorHandler.throwError("error.printing.noPrinter");
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
            this._oReceiptParameters.sfc = oNewSfc;
            oIssuesManager.changeSfcNumber(this._oReceiptParameters.sfc);
        },
        _execeuteSplitSfc: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/split";
            let oRequestParameters = {
                plant: this._oReceiptParameters.plant,
                sfc: this._oReceiptParameters.sfc,
                newSfcs: [{quantity: this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber }] };

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
                quantity: this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber,
                resource: this._oReceiptParameters.resource,
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
            this._oReceiptParameters.handlingUnit = oHu;
            let oParameters = { carrier: null,
                                content: [{
                                    id: null,
                                    packingUnit: null,
                                    quantity: this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber,
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
            if(parseInt(this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber) >= parseInt(this._oReceiptParameters.sfcQuantity)){
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
        _executeSfcMerge: async function(askNotEnoughQuan = true){
            let oSfcsToMerge = [];
            let oSfcsToOff = [];
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let oSfcRemainingQuan = this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber * this._oReceiptParameters.packageNumber - (oSfcStep.quantityInWork + oSfcStep.quantityInQueue);
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

            if(oSfcRemainingQuan > 0 && askNotEnoughQuan){
                let oPossibleQuan = this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber * this._oReceiptParameters.packageNumber - oSfcRemainingQuan;
                await this._checkMergeNotEnough(oPossibleQuan);
                this._oReceiptParameters.quantity = oPossibleQuan;
                this._oReceiptParameters.palletesNumber = 1;
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
                        reject(oError);
                    }
                );
            });
        },
        _checkSfcQuantityInWork: function(){
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);

            if(oSfcStep.quantityInWork < this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber){
                this._oErrorHandler.throwError("errorSfcNotInWork");
            }

        },
        _fillMissingParameters: function(){
            this._oReceiptParameters.storageLocation = this._oOrder.getPutawayStorageLocation();
            this._oReceiptParameters.unitOfMeasure = this._oOrder.getUom();
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
            oPrintingDetails.orderLineCustomValues = this._oOrder.getOrderLineCustomValues(1);
            oPrintingDetails.orderCustomValues = this._oOrder.getHeaderCustomValues();
            oPrintingDetails.materialCustomValues = this._oMaterial.getCustomValues();
            oPrintingDetails.quantity = this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber;
            oPrintingDetails.printer = this._oReceiptParameters.printer;
            oPrintingDetails.operation = this._oReceiptParameters.stepId;
            oPrintingDetails.document = 'WOODECO1';
            oPrintingDetails.quantity = this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber;
            oPrintingDetails.printingCopies = this._oReceiptParameters.printingCopies;
            
            let oSfcReceiptPrint = new SfcReceiptPrint(this._oController, oPrintingDetails);
            await oSfcReceiptPrint.print();
        },
        _issueMultiLastOperMutliPalletes: async function(){
            let oSfcsToProcess = [];
            let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            let oSfcAvailQuan = oSfcStep.quantityInWork + oSfcStep.quantityInQueue;
            let _oPrintingEndpoint = this._getPrintingEndPoint();

            let oQuantity = this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber * this._oReceiptParameters.packageNumber;

            let oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
                this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, oQuantity);
            if(this._oReceiptParameters.automaticIssues){
                await oIssuesManager.prepareIssues();
            }
            
            
            if(oQuantity>oSfcAvailQuan){
                await this._executeSfcMerge(false);
            }else{
                await Sfc.startSfcs(this._oController, this._oReceiptParameters.plant, [this._oSfc.getSfcNumber()], this._oReceiptParameters.operationActivity, this._oReceiptParameters.resource );
            }

            if(this._oReceiptParameters.packageNumber>1){
                let oNewSfcs = await this._multipleSfcSplit(this._oReceiptParameters.packageNumber, this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber);
                for(const newSfc of oNewSfcs){
                    this._oReceiptParameters.sfcQuantity = this._oReceiptParameters.sfcQuantity - this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber;
                    oSfcsToProcess.push( {  sfc: newSfc,
                                            quantity: this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber
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
                    this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber);
                
                if(this._oReceiptParameters.automaticIssues){
                    await oIssuesManager.prepareIssues();
                }

                let oStorageLocation = await this._getStorageLocation();
                if(oStorageLocation.isEWMManagedStorageLocation){
                    if(this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber < oSfcStep.quantityInWork){
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
               
                await this._printLabel(_oPrintingEndpoint);
                await this._saveDataCollection(new Date().toISOString().slice(0, 19) + 'Z', oIssuesManager);   
            }
        },
        _issueMultiNotLastOperMutliPalletes: async function(){
            let _oPrintingEndpoint = this._getPrintingEndPoint();
            this._oReceiptParameters.quantity = this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber;
            this._oReceiptParameters.palletesNumber = 1;
            await this._issueMultiNotLastOper();
            await this._printLabel(_oPrintingEndpoint);
            // let oSfcsToProcess = [];
            // let oSfcStep = this._oSfc.getStepByOperation(this._oReceiptParameters.operationActivity);
            // let oSfcAvailQuan = oSfcStep.quantityInWork + oSfcStep.quantityInQueue;
            // let _oPrintingEndpoint = this._getPrintingEndPoint();

            // let oQuantity = this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber;

            // let oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
            //     this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, oQuantity);
            // await oIssuesManager.prepareIssues();
            
            // this.__checkSfcQuantityInWork();

            // let oNewSfcs = this._multipleSfcSplit(this._oReceiptParameters.palletesNumber, this._oReceiptParameters.quantity);
            // for(const newSfc of oNewSfcs){
            //     oSfcsToProcess.push(newSfc);
            // }
            // oSfcsToProcess.push(this.oReceiptParameters.sfc);

            // for(const sfcToProcess of oSfcsToProcess){
            //     this.oReceiptParameters.sfc = sfcToProcess;
            //     oIssuesManager = new IssuesManager(this._oController, this._oReceiptParameters.plant, this._oReceiptParameters.workCenter, this._oReceiptParameters.resource, 
            //         this._oReceiptParameters.order, this._oReceiptParameters.sfc, this._oReceiptParameters.operationActivity, this._oReceiptParameters.quantity);
                
            //     await oIssuesManager.prepareIssues();

            //     let oStorageLocation = await this._getStorageLocation();
            //     if(oStorageLocation.isEWMManagedStorageLocation){
            //         if(this._oReceiptParameters.quantity < oSfcStep.quantityInWork){
            //             await this._splitSfc(oIssuesManager);
            //         }
            //     }else{
            //         await this._checkRequiredParams();
            //         await this._checkConfirmMm();
            //     }
            //     await this._executeYieldConfirmation();
            //     await oIssuesManager.executeIssues();
            //     await this._printLabel(_oPrintingEndpoint);
            // }

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
                        reject(oError);
                    }
                );
            });
        },
        _checksIssueSigleOper: function(){
            if(this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber > this._oReceiptParameters.sfcQuantity){
                this._oErrorHandler.throwErrorPopup("error.q1.notEnoughSfcQuan");
            }
            this._checkSfcQuantityInWork();
        },
        _saveDataCollection: async function(postingDate, issueManager){
            let parameterValues = [];

            let guid = crypto.randomUUID();
            debugger;

            parameterValues.push({ comment: guid,
                                   name: "Q1/Q3",
                                   value: "Q1" });

            parameterValues.push({ comment: guid,
                                   name: "QUANTITY",
                                   value: `${this._oReceiptParameters.quantity * this._oReceiptParameters.palletesNumber}` });

            parameterValues.push({ comment: guid,
                                   name: "UOM",
                                   value: this._oReceiptParameters.unitOfMeasure });

            parameterValues.push({ comment: guid,
                                   name: "MATERIAL",
                                   value: this._oReceiptParameters.material });

            parameterValues.push({ comment: guid,
                                   name: "ITEM_NO",
                                   value: "0001" });
                                   

            if(this._oReceiptParameters.handlingUnit){
                parameterValues.push({ comment: guid,
                    name: "HU",
                    value: this._oReceiptParameters.handlingUnit });
            }else{
                parameterValues.push({ comment: guid,
                    name: "HU",
                    value: "" });
            }

                                   
            parameterValues.push({ comment: guid,
                                   name: "Q3_CODE",
                                   value: "" });

            parameterValues.push({ comment: guid,
                                   name: "SALES_ORDER",
                                   value: "" });

            parameterValues.push({ comment: guid,
                                   name: "SALES_ORDER_ITEM",
                                   value: "" });

            parameterValues.push({ comment: guid,
                                   name: "USER",
                                   value: this._oController.getUserId() });

            parameterValues.push({ comment: guid,
                                   name: "CANCELLED",
                                   value: false });

            let issuesCreated = issueManager.getCreatedIssues();
            for(const issue of issuesCreated){
                let issueAsString = Object.entries(issue)
                                        .map(([key, value]) => `${key}:${value}`)
                                        .join('||');

                parameterValues.push({ comment: guid,
                                       name: `CONSUMPTION`,
                                       value: issueAsString });
            }

            


            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "datacollection/v1/log";
            let oRequestParameters = {
                plant: this._oReceiptParameters.plant,
                group: { dcGroup: "WOODECO_PROD_ACTIVITY",
                         version: "A" },
                operation: { operation: this._oReceiptParameters.operationActivity,
                              version: "ERP001" },
                parameterValues: parameterValues,
                stepId: this._oReceiptParameters.stepId,
                workCenter: this._oReceiptParameters.workCenter,
                resource: this._oReceiptParameters.resource,
                sfcs: [ this._oReceiptParameters.sfc ]
            };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oRequestParameters,
                    oResponseData => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {                        
                        resolve();
                    }
                );
            });
        },
        
    });
});