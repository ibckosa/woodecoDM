sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "ibc/dm/plugins/wcPodToolsProvider/ConfirmDialog",
    "ibc/dm/plugins/wcPodToolsProvider/OrderReceiptsFromProgressIndicator",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler"
], function (ObjectUI5, OrderRepository, SfcRepository, ConfirmDialog, OrderReceiptsFromProgressIndicator, ResourceRepository, ErrorHandler) {
    "use strict";
    let CompleteOrder = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.CompleteOrder", {
        constructor: function(controller, parameters){
            this._controller = controller;
            this._parameters = parameters;
            this._errorHandler = new ErrorHandler(this._controller);
            //parameters:
            //workCenter
            //resource
            //plant
            //order
            //operation
            //sfc
            //routing
            //routingVersion
        },

        execute: async function(){
            this._order = await OrderRepository.readOrderByPassBuffer(this._controller, this._parameters.plant, this._parameters.order);
            this._sfc = await SfcRepository.getInstance(this._controller, this._parameters.plant, this._parameters.sfc, this._parameters.routing, this._parameters.routingVersion );
            this._resource = await ResourceRepository.getResourceInstance(this._controller, this._parameters.plant, this._parameters.resource);

            

            if( !this._resource.getParametersHu() &&
                (this._order.getIsOrderMO() || !this._sfc.getIsMultiOperation() || !this._sfc.checkIsLastOperation(this._parameters.operation)) ){
               await this._sfc.checkUncollectedParameters(this._parameters.operation, this._parameters.resource);
            }

            if(this._order.getIsOrderMO()){
                await this._completeMOOrder();
            
            }else{
                await this._completeSOOrder();
            }
        },
        _completeSOOrder: async function(){
            debugger;
            if(this._sfc.getIsMultiOperation()){
                if(!this._sfc.checkIsLastOperation(this._parameters.operation)){
                    await this._completeSONotLastOperation();
                }else{
                    await this._completeSOLastOperation();
                }
            }else{
                await this._completeSOSingleOperation();
            }
        },
        _completeMOOrder: async function(){
            let orderPositions = await this._order.getOrderPositions();
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
            await this._checkIssueForComponents();

            await this._signoff([this._parameters.sfc]);

            await this._invalidateSfc(this._parameters.sfc);
            await this._order.completeOrder();
        },
        _completeSOSingleOperation: async function(){
            let maxOrderQuantity = this._order.getMaxOrderQuantitySO();
            let minOrderQuantity = this._order.getMinOrderQuantitySO();
            let orderProgress = OrderReceiptsFromProgressIndicator.getOrderProgress(this._order.getOrderNumber());
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

            await this._checkIssueForComponents();


            await this._signoff([this._parameters.sfc]);
            // for(const sfc of sfcs){
            //     await this._invalidateSfc(sfc);
            // }
            await this._invalidateSfc(this._parameters.sfc);
            await this._order.completeOrder();
        },
        _completeSONotLastOperation: async function(){
            let maxOrderQuantity = this._order.getMaxOrderQuantitySO();
            let minOrderQuantity = this._order.getMinOrderQuantitySO();
            let orderProgress = OrderReceiptsFromProgressIndicator.getOrderProgress(this._order.getOrderNumber());

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

            let sfcs = this._order.getSfcs();

            let sfcsInstances = await SfcRepository.getSfcsInstances(this._controller, this._parameters.plant, sfcs);

            let lastStep = this._sfc.getLastStep();
            let sfcsSteps = [];

            for(const sfcInstance of sfcsInstances){
                let sfcSteps = sfcInstance.getSteps();
                sfcsSteps = sfcsSteps.concat(sfcSteps);
            }


            let sfcStepInWork = sfcsSteps.find( step => { return step.operation.operation === lastStep.operation.operation && ( step.quantityInQueue > 0 || step.quantityInWork > 0 )  } );
            await this._signoff([this._parameters.sfc]);
            //await this._completeOperation();
            await this._invalidateSfc(this._parameters.sfc);
            

            if(!sfcStepInWork){
                await this.order.completeOrder();
            }
        },
        _completeSOLastOperation: async function(){
            try{
                let sfcsSteps = [];
                let sfcs = this._order.getSfcs();
                let sfcsInstances = await SfcRepository.getSfcsInstances(this._controller, this._parameters.plant, sfcs);
                for(const sfcInstance of sfcsInstances){
                    let sfcSteps = sfcInstance.getSteps();
                    sfcsSteps = sfcsSteps.concat(sfcSteps);
                }
                
                let sfcStepInWork = sfcsSteps.find( step => { return ( step.quantityInQueue > 0 || step.quantityInWork > 0 )  } );

                if(!sfcStepInWork){
                    await this.order.completeOrder();
                }
            }catch(oError){debugger;}
        },
        _signoff: async function(sfcs){
            var sUrl = this._controller.getPublicApiRestDataSourceUri() + "sfc/v1/sfcs/signoff";
            var oRequestParameters = { plant: this._parameters.plant,
                                       sfcs: sfcs,
                                       operation: this._parameters.operation,
                                       resource: this._parameters.resource };
    
            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => { 
                        resolve();
                    }
                );
            });
        },
        _invalidateSfc: async function(sfc){
            var sUrl = this._controller.getPublicApiRestDataSourceUri() + `sfc/v1/sfcs/invalidate?plant=${this._parameters.plant}&sfc=${sfc}`;
            var oRequestParameters = { };

            debugger;
    
            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPatchRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );
            });
        },
        _completeOperation: async function(){
            var sUrl = this._controller.getPublicApiRestDataSourceUri() + "order/v1/operationActivity/start";
            var oRequestParameters = { plant: this._parameters.plant,
                                       order: this._parameters.order,
                                       operationActivity: this._parameters.operation,
                                       sfc: this._parameters.sfc,
                                       workCenter: this._parameters.workCenter };
    
            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPostRequest(sUrl, oRequestParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => { 
                        reject(oError);
                    }
                );
            });
        },
        _checkIssueForComponents: async function(){
            let sfcs = this._order.getSfcs();

            if(sfcs.length<2){
                return; }

            let componentIssues = await this._order.getIssuesNonBackflush();
            let componentNoIssue = componentIssues.find(component=>{ return component.issuedQuantity === 0});
            if(componentNoIssue){
                this._errorHandler.throwErrorPopup("error.completeOrder.noComponentIssues", componentNoIssue.componentSequence ,componentNoIssue.material);
            }
        }

    });

    return CompleteOrder;
});