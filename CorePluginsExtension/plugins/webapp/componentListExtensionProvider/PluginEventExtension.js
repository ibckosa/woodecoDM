sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginControllerExtension",
    "sap/ui/core/mvc/OverrideExecution",
    "sap/dm/dme/assyplugins/componentListPlugin/controller/extensions/PluginEventExtensionConstants",
    "sap/dm/dme/podfoundation/util/PodUtility",
    "sap/m/Column",
    "sap/m/Text",
    "ibc/dm/plugins/wcPodToolsProvider/PalleteQueueHandler"
], function (PluginControllerExtension, OverrideExecution, PluginEventConstants, PodUtility, Column, Text, PalleteQueueHandler) {
    "use strict";

    return PluginControllerExtension.extend("ibc.dm.plugins.componentListExtensionProvider.PluginEventExtension", {
        constructor: function (oExtensionUtilities) {
            this._oExtensionUtilities = oExtensionUtilities;
            this._oPalleteQueueHandler = new PalleteQueueHandler();
        },

        getOverrideExecution: function(sOverrideMember) {
            if (sOverrideMember === PluginEventConstants.ON_WORKLIST_SELECT_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_INPUT_CHANGE_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_OPERATION_CHANGE_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_POD_SELECTION_CHANGE_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_ASSEMBLE_COMPONENT_CHANGE_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_COMPONENT_ASSEMBLED_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_PRODUCTION_PROCESS_SUCCESS_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_AUTO_ASSEMBLY_SFC_STATE_CHANGE_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.LOAD_COMPONENTS) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_ASSEMBLE_BUTTON_PRESSED_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_REMOVE_BUTTON_PRESSED_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_ERROR_REMOVING_COMPONENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.CREATE_AND_REFRESH_TABLE) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.UPDATE_LIST_CONFIGURATION) {
                return OverrideExecution.Before;
            } else if (sOverrideMember === PluginEventConstants.UPDATE_TABLE_CONFIGURATION) {
                return OverrideExecution.Before;
            } else if (sOverrideMember === PluginEventConstants.UPDATE_COLUMN_CONFIGURATION) {
                return OverrideExecution.Before;
            };
            return null;
        },
        
        /**
         * Returns the name of the core extension this overrides
         *
         * @returns {string} core extension name
         * @public
         */
        getExtensionName: function () {
            return PluginEventConstants.EXTENSION_NAME;
        },

        onWorklistSelectEvent: function(oEvent){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onWorklistSelectEvent: hi");
        },

        onInputChangeEvent: function(oEvent){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onInputChangeEvent: hi");
        },

        onOperationChangeEvent: function(oEvent){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onOperationChangeEvent: hi");
        },

        onPodSelectionChangeEvent: function(oEvent){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onPodSelectionChangeEvent: hi");
        },

        onAssemblyPointComponentChangeEvent: function(oEvent){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onAssemblyPointComponentChangeEvent: hi");
        },

        onComponentAssembledEvent: function(oEvent){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onComponentAssembledEvent: hi");
        },

        onProductionProcessSuccessEvent: function(oEvent){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onProductionProcessSuccessEvent: hi");
        },

        onAutoAssembledSfcStateChangedEvent: function(oEvent){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onAutoAssembledSfcStateChangedEvent: hi");
        },
    
        loadComponent: function(oComponentList){
            this._oExtensionUtilities.logMessage("PluginEventExtension.loadComponent: oComponentList = ", oComponentList);
        },

        onAssembleButtonPressedEvent: function(oSelectionData){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onAssembleButtonPressedEvent: oSelectionData = ", oSelectionData);
        },

        onRemoveButtonPressedEvent: function(oPayload, oSelectionData){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onRemoveButtonPressedEvent: oPayload = ", oPayload);
            this._oExtensionUtilities.logMessage("PluginEventExtension.onRemoveButtonPressedEvent: oSelectionData = ", oSelectionData);
        },

        onErrorRemovingComponent: function(sError){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onErrorRemovingComponent: oError = " + sError);
        },

        createAndRefreshTable: function(oPluginConfiguration, oListConfiguration){
            this._oExtensionUtilities.logMessage("PluginEventExtension.createAndRefreshTable: hi");
            
            try {
                this.getController().byId("componentList").attachEvent( "updateFinished", this.onUpdateFinished.bind(this) );
                var oList = this.getController().byId("componentList");
            } catch (error) {
                
            }
        },

        updateListConfiguration: function(oListConfiguration){
            this._oExtensionUtilities.logMessage("PluginEventExtension.updateListConfiguration: oListConfiguration hi");
        },

        updateTableConfiguration: function(oTableConfiguration){
            this._oExtensionUtilities.logMessage("PluginEventExtension.updateTableConfiguration: oTableConfiguration hi");
        },

        updateColumnConfiguration: function(aColumnConfiguration){
            this._oExtensionUtilities.logMessage("PluginEventExtension.updateColumnConfiguration: hi");
        },
        onUpdateFinished: function(oEvent){

            try {

            // Create a resource bundle for language specific texts
            var oResourceModel = new sap.ui.model.resource.ResourceModel({
                bundleName : "ibc.dm.plugins.componentListExtensionProvider.i18n.i18n"
            });

            // Assign the model object to the SAPUI5 core using the name "i18n"

            this.getController().getPodController().getView().setModel(oResourceModel,"i18n_local");
                
            var bError = false;

            var oPodContr = this.getController().getPodController();

            try {
                var oParams = {
                    shopOrder: oPodContr.getPodSelectionModel().getSelections()[0].shopOrder.shopOrder,
                    plant: oPodContr.getUserPlant()
                    };
                var oTable = oEvent.getSource();
                

                if(!oTable || oTable.getItems().length == 0){
                    return;
                }  
        
                var oMdl = oTable.getModel();
                var oMdlData = oTable.getModel().getData();
                debugger;
                
                var iItemsLength = oTable.getItems().length;


            } catch (error) {
                bError = true;
            }

            var oShopOrder = oMdl.getProperty("/shopOrder");

            if(!oShopOrder || 
                oShopOrder.shopOrder != oPodContr.getPodSelectionModel().getSelections()[0].shopOrder.shopOrder || 
                !oPodContr._bomReader || 
                typeof oShopOrder.itemsLength === "undefined" || 
                iItemsLength != oShopOrder.itemsLength){
                    
                    if(typeof oParams != "undefined" && typeof oMdl != "undefined" && typeof oPodContr != "undefined"){
                        oPodContr._bomReader = fnReadComponents(oParams,oMdl,oPodContr); 
                    }
                }

            try {
                var oController = this.getController();;
                oPodContr._bomReader.then(result=>{
                    fnUpdateTableItems(oTable,result,oPodContr, oController, this);
                });
            } catch (error) {
                
            }


            //
            //  SORTOWANIE TABELI
            //            
            function fnSortTable(){
                // erpBackflushing
                try {
                    if( oTable.getBinding("items").aSorters[0].sPath === "erpBackflushing" ){
                        if(oTable.getBinding("items").aSorters){
                            oTable.getBinding("items").sort(oTable.getBinding("items").aSorters);
                            oTable.getBinding("items").applySort();
                        }
                    }else{
                        var oNewSorter = [new sap.ui.model.Sorter("erpBackflushing",false)];
                        oTable.getBinding("items").aSorters.forEach(sorter=>{oNewSorter.push(sorter)});
                        oTable.getBinding("items").sort(oNewSorter);
                        oTable.getBinding("items").applySort();
                    }
                } catch (error) {
                    
                }
                
            };

            if(bError){

                fnSortTable();
                return;
            }
            
            // 
            // AKTUALIZACJA MODELU I BINDINGU 
            //             
            function fnUpdateTableItems(oTable,bomComponents, oPodController, oController,that ){

                var bSort = false;
                var oCompQuanFromOrder = false;

                var oConfiguration = oController.getConfiguration();

                if(oConfiguration&& typeof oConfiguration.compQuanFromOrder !== "undefined"){
                    oCompQuanFromOrder = oConfiguration.compQuanFromOrder;
                }

                var bColumnExists = oTable.getColumns().some(function (oColumn) {
                    return oColumn.getId() === "uomCol";
                  });
                if (!bColumnExists){
                    var oNewColumn = new Column({ header: new Text({ text: _getText("uomColumnLabel", oPodController)}), id: "uomCol" });
                    oTable.insertColumn(oNewColumn, oTable.getColumns().length - 1 );  }
                
                oTable.getItems().forEach(item=>{
                    try {

                        var itemCompSeq = item.getBindingContext().getObject().componentSequence;
                        var oBomComponent = bomComponents.find((line) => line.sequence == itemCompSeq );
                        if(oTable.getColumns().length > item.getCells().length&&oBomComponent){
                            //oMdl.setProperty(item.getBindingContextPath()+"/ComponentUom", oBomComponent.componentQuantityCommercialUom);
                            item.insertCell(new Text({ text: oBomComponent.componentQuantityCommercialUom }), item.getCells().length - 1);
                        }
                        if(oBomComponent){
                            oMdl.setProperty(item.getBindingContextPath()+"/zstorageLocation", oBomComponent.storageLocation);
                        }
                        
                        if( typeof item.getBindingContext().getObject().erpBackflushing !== "boolean"  ){
                            bSort = true;
                            if(bomComponents.find((line) => line.sequence == itemCompSeq && line.erpBackflushing)){
                                oMdl.setProperty(item.getBindingContextPath()+"/erpBackflushing",true);
                                oMdl.setProperty(item.getBindingContextPath()+"/buttonVisible",false);
                            }else{
                                oMdl.setProperty(item.getBindingContextPath()+"/erpBackflushing",false);
                                oMdl.setProperty(item.getBindingContextPath()+"/buttonVisible",true);
                            }
                        }
                        
                        var oCell = item.getCells();
                        try{
                            
                            debugger;
                        }catch(oErr){debugger;}

                        if(oBomComponent&&oBomComponent.componentType.toUpperCase() !== "NORMAL"){
                            item.setVisible(false);
                        }
                        
                        
                        item.getCells().forEach(cell=>{
                            if(cell.getContent){
                                try {
                                    if( cell.getContent()[1].getBindingPath("visible") !== "buttonVisible" ){
                                        cell.getContent()[1].bindProperty( 
                                            "visible",{
                                                parts: [
                                                "buttonVisible", 
                                                "remainingQuantity"],
                                                formatter: function(buttonVisible,remainingQuantity){
                                                    return buttonVisible && remainingQuantity > 0;
                                                }
                                            }
                                        );
                                        cell.getContent()[1].setText(_getText("buttonAssembleLabel",oPodController));
                                        cell.getContent()[1].attachPress(that._onPaletteQueuePress.bind(that));
                                    }
                                } catch (error) {
                                        
                                }        
                            }else if(cell.getText){
                                if(oBomComponent&&oCompQuanFromOrder===true){
                                    try{
                                        let oItemValues =  item.getBindingContext().getObject();
                                        let oPath = cell.getBindingPath("text");
                                        if(oPath==="requiredQty"){
                                            cell.setText(oBomComponent.componentQuantity);
                                        }else if(oPath==="remainingQty"){
                                            let oRemainingQuantity = oBomComponent.componentQuantity - oItemValues.requiredQuantity + oItemValues.remainingQuantity;
                                            cell.setText(oRemainingQuantity);
                                        }
                                    }catch(oErr){}
                                }
                            }
                        });
                    } catch (error) {}
                });
                if(bSort){ fnSortTable(); }
            };

            function getMethodsOf (obj){
                var methods = {}
                Object.getOwnPropertyNames( Object.getPrototypeOf(obj) ).forEach(methodName => {
                  methods[methodName] = obj[methodName]
                })
                return methods
            };  

            function _getText(oTextId, oPodController){             
                try {
                    var oText = oPodController.getView().getModel("i18n_local").getResourceBundle().getText(oTextId);
               
                } catch (error) {
                    oText = oTextId;
                }
                return oText;
            };


            function fnReadComponents(oParameters,oModel,oPodController){
                return new Promise((resolve,reject)=>{
                    var oShopOrder = oModel.getProperty("/shopOrder");
                    if(oShopOrder && oShopOrder.shopOrder === oParameters.shopOrder && oShopOrder.bomComponents.length > 0 && oShopOrder.itemsLength === iItemsLength ){
                        resolve(oShopOrder.bomComponents);
                    }else{
                        oModel.setProperty("/shopOrder",{shopOrder: oParameters.shopOrder, bomComponents: [], itemsLength: iItemsLength });
                        debugger;
                        oPodController.ajaxGetRequest("../sapdmdmepod/dme/demand-ms/shopOrders", oParameters,
                            function (oResponseData) {
                                var sUrlTemp =  "../sapdmdmepod/dme/demand-ms/shopOrders/" + oResponseData._embedded.shopOrders[0].id + "/bomComponents?pageSize=20&page=";
                                debugger;
                                var oRequest = new Promise((resolve,reject)=>{
                                    var iCurrentPage = 0;
                                    var aBomComponents = [];
                                    var sUrl2 = sUrlTemp + iCurrentPage.toString();

                                    var fResponseFunct = function(oResponseData2){
                                        oResponseData2.content.forEach(elem=>{
                                            aBomComponents.push(elem);
                                        });


                                        if(oResponseData2.last){
                                            resolve(aBomComponents);
                                        }else{
                                            iCurrentPage++;
                                            sUrl2 = sUrlTemp + iCurrentPage.toString();
                                            oPodController.ajaxGetRequest(sUrl2, {}, fResponseFunct );
                                        }
                                    }

                                    oPodController.ajaxGetRequest(sUrl2, {}, fResponseFunct );

                                    });


                                oRequest.then(bomComponents=>{
                                    var aBomComponents = bomComponents;
                                    if(aBomComponents.length == 0){
                                        aBomComponents.push(null);
                                    } 
                                    oModel.setProperty("/shopOrder",{shopOrder: oParameters.shopOrder, bomComponents: aBomComponents, itemsLength: iItemsLength });
                                    
                                    try {
                                        if(!oShopOrder || typeof oShopOrder.itemsLength === "undefined" || iItemsLength != oShopOrder.itemsLength){
                                            fnSortTable();
                                        }
                                    } catch (error) {
                                            
                                    }
                                    debugger;
                                    resolve(bomComponents);
                                });
                            }
                        );
                    }
                });
            };


            

        } catch (error) {      
        }            
        },
        _onPaletteQueuePress: function(oEvent){
            debugger;
            let oLine = oEvent.getSource().getBindingContext().getObject();
            try{
                let oPodSelectionModel = this.getController().getPodSelectionModel();
                let oSelection = oPodSelectionModel.getSelections()[0];
                let oHandlerData = { plant: this.getController().getPodController().getUserPlant(),
                                     workCenter: oPodSelectionModel.workCenter,
                                     resource: oPodSelectionModel.resource.resource,
                                     storageLocation: oLine.zstorageLocation,
                                     material: oLine.component.material,
                                     materialDescription: oLine.componentDescription,
                                     version: "",
                                     sfc: oSelection.getSfc().getSfc(),
                                     operationActivity: oSelection.getSfcData().getOperation(),
                                     bomComponentRef: oLine.bomComponentRef,
                                     sequence: oLine.componentSequence,
                                     order: oSelection.shopOrder.shopOrder };
                
                this._oPalleteQueueHandler.setHandlerData(oHandlerData);
                this._oPalleteQueueHandler.displayPaletteQueue(this.getController(),"COMPONENT");
                
            }catch(oError){

            }


        }


        
    })
});