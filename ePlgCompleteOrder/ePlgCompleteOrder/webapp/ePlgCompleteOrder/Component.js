sap.ui.define([
    "sap/m/MessageToast",
    "sap/dm/dme/podfoundation/component/production/ProductionComponent",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/Sfc",
    "ibc/dm/plugins/wcPodToolsProvider/ConfirmDialog",
    "ibc/dm/plugins/wcPodToolsProvider/OrderReceiptsFromProgressIndicator"
], function (MessageToast, ProductionComponent, OrderRepository, ErrorHandler, Sfc, ConfirmDialog, OrderReceiptsFromProgressIndicator) {
    "use strict";

    /**
     * This plugin is a template for POD Execution Plugin implementation. 
     * Implement business logic inside execute() method. 
     * 
     */

    var oExecutionPluginTemplate = ProductionComponent.extend("ibc.dm.ePlgCompleteOrder.ePlgCompleteOrder.Component", {
        metadata: {
            manifest: "json"
        },

        isSynchronousExecution: function () {
            // Synchronous execution
            return true;
        },

        execute: async function () {
            this._oErrorHandler = new ErrorHandler(this);
            try{
                this.clearMessages();
                let podSelectionModel = this.getPodSelectionModel();
                let selection = podSelectionModel.getSelections();
                let firstSelection = selection[0];
                this._oWorkCenter = podSelectionModel.workCenter;
                this._oResource = podSelectionModel.resource.resource;
                this._plant = this.getPodController().getUserPlant();
                this.order = await OrderRepository.readOrderByPassBuffer(this, this._plant, firstSelection.getShopOrder().getShopOrder());
                this._operation =  firstSelection.getSfcData().getOperation();
                this._sfcNumber = firstSelection.getSfc().getSfc();

                if(this.order.getIsOrderMO()){
                    await this._completeMOOrder();
                
                }else{
                    await this._completeSOOrder();
                }
                this._refreshPod();        
            }catch(error){
                this._oErrorHandler.handleError(error);
            }


            return true;
        },
        _completeMOOrder: async function(){
            let orderPositions = await this.order.getOrderPositions();
            for(const position of orderPositions){
                if(position.deliveredQuantity < position.minQuantity){
                    const confirmDialog = new ConfirmDialog();
                    confirmDialog.setTitleText("error.q1.quantityPositionText");
                    confirmDialog.setContentText("error.q1.lessMinQuantityPosition", position.itemNumberErp);
                    await confirmDialog.show();
                }

                if(position.deliveredQuantity > position.maxQuantity){
                    const confirmDialog = new ConfirmDialog();
                    confirmDialog.setTitleText("error.q1.quantityPositionText");
                    confirmDialog.setContentText("error.q1.exceedMaxQuantityPosition", position.itemNumberErp);
                    await confirmDialog.show();
                }
            }

            let sfcs = this.order.getSfcs();
            await this._signoff([this._sfcNumber]);
            //await Sfc.signOffSfcs(this, this._plant, sfcs, this._operation, this._oResource);
            // for(const sfc of sfcs){
            //     await this._invalidateSfc(sfc);
            // }
            await this._invalidateSfc(this._sfcNumber);
            await this.order.completeOrder();

            
        },
        _completeSOOrder: async function(){
            let maxOrderQuantity = this.order.getMaxOrderQuantitySO();
            let minOrderQuantity = this.order.getMinOrderQuantitySO();
            let orderProgress = OrderReceiptsFromProgressIndicator.getOrderProgress(this.order.getOrderNumber());
            if(orderProgress.quantityDone < minOrderQuantity){
                const confirmDialog = new ConfirmDialog();
                confirmDialog.setTitleText("error.q1.quantityPositionText");
                confirmDialog.setContentText("error.q1.lessMinQuantity");
                await confirmDialog.show();
            }

            if(orderProgress.quantityDone > maxOrderQuantity){
                const confirmDialog = new ConfirmDialog();
                confirmDialog.setTitleText("error.q1.quantityPositionText");
                confirmDialog.setContentText("error.q1.greaterMaxQuantity");
                await confirmDialog.show();
            }

            let sfcs = this.order.getSfcs();
            await this._signoff([this._sfcNumber]);
            // for(const sfc of sfcs){
            //     await this._invalidateSfc(sfc);
            // }
            await this._invalidateSfc(this._sfcNumber);
            await this.order.completeOrder();

        },
        _invalidateSfc: async function(sfc){
            var sUrl = this.getPublicApiRestDataSourceUri() + `sfc/v1/sfcs/invalidate?plant=${this._plant}&sfc=${sfc}`;
            var oRequestParameters = { };

            debugger;
    
            return await new Promise((resolve,reject)=>{
                this.ajaxPatchRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );
            });
        },
        _signoff: async function(sfcs){
            var sUrl = this.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/signoff";
            var oRequestParameters = { plant: this._plant,
                                       sfcs: sfcs,
                                       operation: this._operation,
                                       resource: this._oResource };
    
            return await new Promise((resolve,reject)=>{
                this.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => { 
                        resolve();
                    }
                );
            });
        },
        _refreshPod: function(){
            let component = this.getPodOwnerComponent();
            let mainPodController = component.getMainPodController();
            let podSelectionModel = mainPodController.getPodSelectionModel();
            podSelectionModel.setInputValue("");
            podSelectionModel.clearSelections();

            mainPodController.publish("PodSelectionChangeEvent", { sendToAllPages: true });
            mainPodController.closePlugin(this);
            mainPodController.navigateToMainPage();
        },
        
    });

    return oExecutionPluginTemplate;
});