sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginControllerExtension",
    "sap/ui/core/mvc/OverrideExecution",
    "sap/dm/dme/assyplugins/componentListPlugin/controller/extensions/PluginEventExtensionConstants",
    "sap/dm/dme/podfoundation/util/PodUtility",
    "sap/m/Column",
    "sap/m/Text",
    "ibc/dm/plugins/wcPodToolsProvider/PalleteQueueHandler",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/BomRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository"
], function (PluginControllerExtension, OverrideExecution, PluginEventConstants, PodUtility, Column, Text, PalleteQueueHandler, TextHandler, BomRepository, OrderRepository, MaterialRepository) {
    "use strict";

    return PluginControllerExtension.extend("ibc.dm.plugins.componentListExtensionProvider.PluginEventExtension", {
        constructor: function (oExtensionUtilities) {
            this._oExtensionUtilities = oExtensionUtilities;
            this._oPalleteQueueHandler = new PalleteQueueHandler();
            this._oTextHandler = new TextHandler();
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
            debugger;
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
            debugger;
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

        createAndRefreshTable: async function(oPluginConfiguration, oListConfiguration){
            this._oExtensionUtilities.logMessage("PluginEventExtension.createAndRefreshTable: hi");
            debugger;
            try {
                this.getController().byId("componentList").attachEvent( "updateFinished", await this.onUpdateFinished.bind(this) );
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
        onUpdateFinished: async function(oEvent){
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
                var oTable;
                if(oEvent){
                    oTable = oEvent.getSource();
                }else if(this._oTable){
                    oTable = this._oTable;
                }
                

                if(!oTable || oTable.getItems().length == 0){
                    return;
                }  
                this._oTable =  oTable;
                var oMdl = oTable.getModel();
                var oMdlData = oTable.getModel().getData();
                
                var iItemsLength = oTable.getItems().length;


            } catch (error) {
                debugger;
                bError = true;
            }

            var oShopOrder = oMdl.getProperty("/shopOrder");

            if(!oShopOrder || 
                oShopOrder.shopOrder != oPodContr.getPodSelectionModel().getSelections()[0].shopOrder.shopOrder || 
                !oPodContr._bomReader || 
                typeof oShopOrder.itemsLength === "undefined" || 
                iItemsLength != oShopOrder.itemsLength){
                    
                    if(typeof oParams != "undefined" && typeof oMdl != "undefined" && typeof oPodContr != "undefined"){
                        oPodContr._bomReader = await fnReadComponents(oParams,oMdl,oPodContr); 
                        try {
                            var oController = this.getController();
                            await this._fnUpdateTableItems(oTable, oPodContr._bomReader, oPodContr, oController, this, oMdl.getProperty("/shopOrder").shopOrder);
                            // oPodContr._bomReader.then(result=>{
                            //     await fnUpdateTableItems(oTable,result,oPodContr, oController, this, oMdl.getProperty("/shopOrder").shopOrder);
                            // });
                        } catch (error) {
                            debugger;
                        }
                    }
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
            async function fnUpdateTableItems(oTable,bomComponents, oPodController, oController, that, shopOrder){
                let materialIssuesTab = [];
                var bSort = false;
                var oCompQuanFromOrder = false;

                var oConfiguration = oController.getConfiguration();
                let orderInstance = await OrderRepository.readOrder(oController, that.getController().getPodController().getUserPlant(), shopOrder);
                let bomInstance = await BomRepository.getInstance(oController, that.getController().getPodController().getUserPlant(), orderInstance.getBomNumber(), orderInstance.getBomType() );
                
                

                if(oConfiguration&& typeof oConfiguration.compQuanFromOrder !== "undefined"){
                    oCompQuanFromOrder = oConfiguration.compQuanFromOrder;
                }

                var bColumnExists = oTable.getColumns().some(function (oColumn) {
                    return oColumn.getId() === "uomCol";
                  });
                if (!bColumnExists){
                    let oNewColumn = new Column({ header: new Text({ text: that._oTextHandler.getText("labels.components.uomColumn")}), id: "uomCol" });
                    let oIssuedColumn = new Column({ header: new Text({ text: that._oTextHandler.getText("labels.components.issuedQuanColumn")}), id: "issuedCol" });
                    oTable.insertColumn(oNewColumn, oTable.getColumns().length );  
                    oTable.insertColumn(oIssuedColumn, oTable.getColumns().length - 1 );  
                }
                debugger;
                for(const item of oTable.getItems()){
                    try {
                        let issuedQuantity = 0;
                        let itemData = item.getBindingContext().getObject();
                        let materialIssues = materialIssuesTab.find(tab=>{ return filter.material === itemData.component.material });
                        if(!materialIssues){
                            let issues = await that._getIssueForMaterial(that.getController().getPodController().getUserPlant(), itemData.component.material, itemData.component.version, shopOrder);
 
                            materialIssues = { material: itemData.component.material,
                                               issues: issues
                            };

                            materialIssuesTab.push(materialIssues);
                        }
                        if(materialIssues.issues){
                            let materialIssuesForSeq = materialIssues.issues.filter( issue=>{return issue.comment === itemData.componentSequence && issue.cancellationTriggered === false});
                            for(issue of materialIssuesForSeq){
                                issuedQuantity = Math.round((issuedQuantity + issue.quantityInBaseUnit.value)*1000)/1000;
                            }
                        }
                        


                        var itemCompSeq = item.getBindingContext().getObject().componentSequence;
                        var oBomComponent = bomComponents.find((line) => line.sequence == itemCompSeq );
                        if(oTable.getColumns().length > item.getCells().length&&oBomComponent){
                            item.insertCell(new Text({ text: oBomComponent.componentQuantityCommercialUom }), item.getCells().length - 1);
                            item.insertCell(new Text({ text:issuedQuantity }), item.getCells().length - 1);
                        }
                        if(oBomComponent){
                            oMdl.setProperty(item.getBindingContextPath()+"/zstorageLocation", oBomComponent.storageLocation);
                        }
                        
                        if( typeof item.getBindingContext().getObject().erpBackflushing !== "boolean"  ){
                            bSort = true;
                            if(bomComponents.find((line) => line.sequence == itemCompSeq && line.erpBackflushing) || bomInstance.getComponentBackflush(itemCompSeq)){
                                oMdl.setProperty(item.getBindingContextPath()+"/erpBackflushing",true);
                                oMdl.setProperty(item.getBindingContextPath()+"/buttonVisible",false);
                            }else{
                                oMdl.setProperty(item.getBindingContextPath()+"/erpBackflushing",false);
                                oMdl.setProperty(item.getBindingContextPath()+"/buttonVisible",true);
                            }
                        }

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
                                                    return buttonVisible;
                                                }
                                            }
                                        );
                                        cell.getContent()[1].setText(that._oTextHandler.getText("labels.component.buttonConsume"));
                                        cell.getContent()[1].attachPress(that._onPaletteQueuePress.bind(that));
                                        cell.getContent()[0].setVisible(false);
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
                };
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


            async function fnReadComponents(oParameters,oModel,oPodController){
                return await new Promise((resolve,reject)=>{
                    var oShopOrder = oModel.getProperty("/shopOrder");
                    if(oShopOrder && oShopOrder.shopOrder === oParameters.shopOrder && oShopOrder.bomComponents.length > 0 && oShopOrder.itemsLength === iItemsLength ){
                        resolve(oShopOrder.bomComponents);
                    }else{
                        oModel.setProperty("/shopOrder",{shopOrder: oParameters.shopOrder, bomComponents: [], itemsLength: iItemsLength });
                        oPodController.ajaxGetRequest("../sapdmdmepod/dme/demand-ms/shopOrders", oParameters,
                            function (oResponseData) {
                                var sUrlTemp =  "../sapdmdmepod/dme/demand-ms/shopOrders/" + oResponseData._embedded.shopOrders[0].id + "/bomComponents?pageSize=20&page=";
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
        _onPaletteQueuePress: async function(oEvent){
            let oLine = oEvent.getSource().getBindingContext().getObject();
            debugger;
            try{
                
                let oPodSelectionModel = this.getController().getPodSelectionModel();
                let oSelection = oPodSelectionModel.getSelections()[0];
                let order = await OrderRepository.readOrder(this.getController(), this.getController().getPodController().getUserPlant(), oSelection.shopOrder.shopOrder);
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
                                     order: oSelection.shopOrder.shopOrder,
                                     salesOrder: order.getCustomerOrder(),
                                     salesOrderItem: order.getCustomerOrderItem(),
                                     salesSegmentRequired: oLine.salesSegmentRequired,
                                     uom: oLine.zuom };
                
                this._oPalleteQueueHandler.setHandlerData(oHandlerData);
                this._oPalleteQueueHandler.displayPaletteQueue(this.getController(),"COMPONENT");
                
            }catch(oError){

            }


        },
        _getIssueForMaterial: async function(plant, material, materialVersion, orderNumber){
            let results = [];
            let additionalApiCalls = [];
            

            let firstApiCallResults = await this._callApiGetIssue(plant, material, materialVersion, orderNumber);
            if(firstApiCallResults.totalPages&&firstApiCallResults.totalPages>1){
                for(let i=1;i++;i<firstApiCallResults.totalPages){
                    additionalApiCalls.push(this._callApiGetIssue(plant, material, materialVersion, orderNumber,i));
                }
            }

            if(firstApiCallResults.content){
                results =  firstApiCallResults.content;
            }

            if(additionalApiCalls.length>0){
                let additionalResults = await Promise.all(additionalApiCalls);
                for(const additionalResult of additionalResults){
                    if(additionalResult.content){
                        results = results.concat(additionalResult.content);
                    }
                }
            }

            return results;
        },
        _callApiGetIssue: async function(plant, material, materialVersion, orderNumber, page=0){
            let controller = this.getController();
            let sUrl = controller.getPublicApiRestDataSourceUri() + "inventory/v1/inventory/goodsIssues";

            let parameters = {  plant: plant,
                                material: material,
                                materialVersion: materialVersion,
                                order: orderNumber,
                                size:50,
                                page: page };
            return await new Promise((resolve,reject)=>{
                controller.ajaxGetRequest(sUrl, parameters,
                    (oResponseData) => {
                        debugger;
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        debugger;
                        resolve();
                    }   
                );

            });
        },
        _fnUpdateTableItems: async function(oTable, bomComponents, oPodController, oController, that, shopOrder){
            let materialIssuesTab = [];
            var bSort = false;
            var oCompQuanFromOrder = false;

            var oMdl = oTable.getModel();

            var oConfiguration = oController.getConfiguration();
            let orderInstance = await OrderRepository.readOrder(oController, that.getController().getPodController().getUserPlant(), shopOrder);
            let bomInstance = await BomRepository.getInstance(oController, that.getController().getPodController().getUserPlant(), orderInstance.getBomNumber(), orderInstance.getBomType() );
            
            

            if(oConfiguration&& typeof oConfiguration.compQuanFromOrder !== "undefined"){
                oCompQuanFromOrder = oConfiguration.compQuanFromOrder;
            }

            var bColumnExists = oTable.getColumns().some(function (oColumn) {
                return oColumn.getId() === "uomCol";
              });
            if (!bColumnExists){
                let oNewColumn = new Column({ header: new Text({ text: this._oTextHandler.getText("labels.components.uomColumn")}), id: "uomCol" });
                let oIssuedColumn = new Column({ header: new Text({ text: this._oTextHandler.getText("labels.components.issuedQuanColumn")}), id: "issuedCol" });
                oTable.insertColumn(oNewColumn, oTable.getColumns().length - 1 );  
                oTable.insertColumn(oIssuedColumn, oTable.getColumns().length - 1 );  
            }
            for(const item of oTable.getItems()){
                try {
                    let issuedQuantity = 0;
                    let itemData = item.getBindingContext().getObject();
                    let materialIssues = materialIssuesTab.find(tab=>{ return tab.material === itemData.component.material });
                    if(!materialIssues){
                        let issues = await that._getIssueForMaterial(that.getController().getPodController().getUserPlant(), itemData.component.material, itemData.component.version, shopOrder);

                        materialIssues = { material: itemData.component.material,
                                           issues: issues
                        };

                        materialIssuesTab.push(materialIssues);
                    }
                    if(materialIssues.issues){
                        let materialIssuesForSeq = materialIssues.issues.filter( issue=>{return issue.comments === itemData.componentSequence.toString() && issue.cancellationTriggered === false});
                        for(const issue of materialIssuesForSeq){
                            issuedQuantity = Math.round((issuedQuantity + issue.quantityInBaseUnit.value)*1000)/1000;
                        }
                    }
                    var itemCompSeq = item.getBindingContext().getObject().componentSequence;
                    let materialInstance = await MaterialRepository.getMaterialInstance(that.getController(), that.getController().getPodController().getUserPlant(), itemData.component.material );
                    issuedQuantity = materialInstance.convertUom(issuedQuantity, materialInstance.getBaseUom() , bomInstance.getComponentUom(itemCompSeq));

                    oMdl.setProperty(item.getBindingContextPath()+"/zIssuedQuantity", issuedQuantity);
                    


                    
                    

                    var oBomComponent = bomComponents.find((line) => line.sequence == itemCompSeq );

                    if(oTable.getColumns().length > item.getCells().length&&oBomComponent){
                        //item.insertCell(new Text({ text: oBomComponent.componentQuantityCommercialUom }), item.getCells().length - 1);
                        item.insertCell(new Text({ text: "{zuom}" }), item.getCells().length - 1);
                        item.insertCell(new Text({ text: "{zIssuedQuantity}" }), item.getCells().length - 1);
                    }
                    if(oBomComponent){
                        oMdl.setProperty(item.getBindingContextPath()+"/zstorageLocation", oBomComponent.storageLocation);
                        oMdl.setProperty(item.getBindingContextPath()+"/zuom", bomInstance.getComponentUom(itemCompSeq) );//oBomComponent.componentQuantityCommercialUom
                        oMdl.setProperty(item.getBindingContextPath()+"/salesSegmentRequired", bomInstance.getSalesSegmentRequired(itemCompSeq) );
                    }
                    
                    if( typeof item.getBindingContext().getObject().erpBackflushing !== "boolean"  ){
                        bSort = true;
                        if(bomComponents.find((line) => line.sequence == itemCompSeq && line.erpBackflushing) || bomInstance.getComponentBackflush(itemCompSeq)){
                            oMdl.setProperty(item.getBindingContextPath()+"/erpBackflushing",true);
                            oMdl.setProperty(item.getBindingContextPath()+"/buttonVisible",false);
                        }else{
                            oMdl.setProperty(item.getBindingContextPath()+"/erpBackflushing",false);
                            oMdl.setProperty(item.getBindingContextPath()+"/buttonVisible",true);
                        }
                    }

                    if(oBomComponent&&oBomComponent.componentType.toUpperCase() !== "NORMAL"){
                        item.setVisible(false);
                    }
                    
                    for(const cell of item.getCells()){
                        if(cell.getContent){
                            try {
                                if( cell.getContent()[1].getBindingPath("visible") !== "buttonVisible" ){
                                    cell.getContent()[1].bindProperty( 
                                        "visible",{
                                            parts: [
                                            "buttonVisible", 
                                            "remainingQuantity"],
                                            formatter: function(buttonVisible,remainingQuantity){
                                                return buttonVisible;
                                            }
                                        }
                                    );
                                    cell.getContent()[1].setText(that._oTextHandler.getText("labels.component.buttonConsume"));
                                    cell.getContent()[1].attachPress(that._onPaletteQueuePress.bind(that));
                                    cell.getContent()[0].setVisible(false);
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
                    };
                } catch (error) {
                    debugger;
                }
            };
            if(bSort){ this.fnSortTable(oTable); 

            }
        },
        fnSortTable: function(oTable){
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
            } catch (error) {}  
        },
        clearModelOrder(){
            try{
                if(this._oTable){
                    let oModel = this._oTable.getModel();
                    oModel.setProperty("/shopOrder", undefined);
                }
            }catch(error){ }   
        }
    })
});