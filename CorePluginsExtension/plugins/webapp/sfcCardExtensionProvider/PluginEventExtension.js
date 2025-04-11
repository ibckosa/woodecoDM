sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginControllerExtension",
    "sap/ui/core/mvc/OverrideExecution",
    "sap/dm/dme/plugins/headerInformationPlugin/controller/extensions/PluginEventExtensionConstants",
    "sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/SmartEditGraphicRepository"
], function (PluginControllerExtension, OverrideExecution, PluginEventConstants, JSONModel, SmartEditGraphicRepository) {
    "use strict";

    return PluginControllerExtension.extend("ibc.dm.plugins.sfcCardExtensionProvider.PluginEventExtension", {
        constructor: function (oExtensionUtilities) {
            this._oExtensionUtilities = oExtensionUtilities;
        },

        getOverrideExecution: function(sOverrideMember) {
            if (sOverrideMember === PluginEventConstants.ON_SELECTION_CHANGE_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_QUANTITY_CHANGE_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_PAGE_CHANGE_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.REFRESH_HEADER_INFORMATION) {
                return OverrideExecution.After;
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

        onSelectionChangeEvent: function(oEvent){
            this.updateCustomData();
            this._oExtensionUtilities.logMessage("PluginEventExtension.onSelectionChangeEvent: hi");
        },

        onQuantityChangeEvent: function(oEvent){
            this._oExtensionUtilities.logMessage("PluginEventExtension.onQuantityChangeEvent: hi");
        },

        onPageChangeEvent: function(oEvent){
            this.updateCustomData();
            this._oExtensionUtilities.logMessage("PluginEventExtension.onPageChangeEvent: hi");
        },

        refreshHeaderInformation: function(bInitialLoading){
            this.updateCustomData();
            this._oExtensionUtilities.logMessage("PluginEventExtension.refreshHeaderInformation: bInitialLoading = " + bInitialLoading);
            let oConfigurationData, oData;
            let oConfigurationModel = this.getCoreExtension().getInformationConfigurationModel();
            if (oConfigurationModel) {
                oConfigurationData = oConfigurationModel.getData();
            }
            let oDataModel = this.getCoreExtension().getInformationDataModel();
            if (oDataModel) {
                oData = oDataModel.getData();
            }
        },

        updateCustomData: function(){
            let oController = this.getController();
            if (!oController) {
                return;
            }
            
            let oPodSelectionModel = oController.getPodSelectionModel();
            if (oPodSelectionModel) {
                if (!oPodSelectionModel.customData) {
                    oPodSelectionModel.customData = { supplier: "",
                                                      sfcCardCustom: { optimizationNumber: "",
                                                        recipeNumber: "",
                                                        blockNumber: "",
                                                        customerName: "",
                                                        artFam: "",
                                                        thickness: "",
                                                        length: "",
                                                        width: "",
                                                        remarksButton: "",
                                                        crossCompany: "",
                                                        blatMaterialTop: "",
                                                        blatMaterialDown: "",
                                                        blatThicknessTop: "",
                                                        blatThicknessDown: "",
                                                        salesTextPL: "",
                                                        salesTextEN: "",
                                                        salesTextDE: "",
                                                        artfamCom: "",
                                                        artfamEle: "",
                                                        artfamGrp: "",
                                                        artfamRohlpE: "",
                                                        artfamRohlpatte: "",
                                                        ruType: "",
                                                        progressIndicatorValue: "",
                                                        percentProgress: "0"
                                                     }
                    };
                }
                let oModel = new JSONModel(oPodSelectionModel.customData);
                oController.getPodController().getView().setModel(oModel, "customData");
                this.getCoreExtension().getPluginToolbar().setModel(oModel, "customData");
            }

            this._getCustomData(oController, oPodSelectionModel);
        },
        _getCustomData: async function(oController, oPodSelectionModel){

            
            var oFirstSelection = oPodSelectionModel.getSelections()[0];
            if(!oFirstSelection){
                return;
            }
            let oGraphic = SmartEditGraphicRepository.getGraphic(oController, "PD3000");

            try{
                var oSfcCardCustom =  { optimizationNumber: "",
                                        recipeNumber: "",
                                        blockNumber: "",
                                        customerName: "",
                                        artFam: "",
                                        thickness: "",
                                        length: "",
                                        width: "",
                                        remarksButton: "",
                                        crossCompany: "",
                                        blatMaterialTop: "",
                                        blatMaterialDown: "",
                                        blatThicknessTop: "",
                                        blatThicknessDown: "",
                                        salesTextPL: "",
                                        salesTextEN: "",
                                        salesTextDE: "",
                                        artfamCom: "",
                                        artfamEle: "",
                                        artfamGrp: "",
                                        artfamRohlpE: "",
                                        artfamRohlpatte: "",
                                        ruType: "",
                                        progressIndicatorValue: "",
                                        percentProgress: "0"
                                     };

                var oPodController = oController.getPodController();

                var oOrder = oFirstSelection.getShopOrder().getShopOrder();
                var oPlant = oPodController.getUserPlant();
                var oMaterial = oFirstSelection.getSfcData().getMaterial();
                var oMaterialVersion = oFirstSelection.getSfcData().getMaterialVersion();

                var oMaterialData = await this._getMaterialData(oController, oPlant, oMaterial, oMaterialVersion);
                var oOrderData = await this._getOrderData(oController,oOrder, oPlant);
                
                if(oOrderData.productionQuantity>0){
                    oSfcCardCustom.progressIndicatorValue =  oOrderData.doneQuantityInProductionUom + " z " + oOrderData.productionQuantity;
                    if(oOrderData.productionQuantity>0){
                        oSfcCardCustom.percentProgress = parseInt( oOrderData.doneQuantityInProductionUom / oOrderData.productionQuantity * 100 ).toString();
                    }
                }

                if(oOrderData.customValues !== undefined){
                    for(var i = 0; i < oOrderData.customValues.length; i++ ){
                        if(oOrderData.customValues[i].attribute === "HEADER_OPTIMNO"){
                            oSfcCardCustom.optimizationNumber = oOrderData.customValues[i].value;
                        }else if(oOrderData.customValues[i].attribute === "HEADER_BLOCKNO"){
                            oSfcCardCustom.blockNumber = oOrderData.customValues[i].value;
                        }else if(oOrderData.customValues[i].attribute === "CUSTOMER_NAME"){
                            oSfcCardCustom.customerName = oOrderData.customValues[i].value;
                        }else if(oOrderData.customValues[i].attribute === "HEADER_REMARKS"){
                            oSfcCardCustom.remarksButton = oOrderData.customValues[i].value;
                        }else if(oOrderData.customValues[i].attribute === "HEADER_THICKNESS"){
                            oSfcCardCustom.thickness = oOrderData.customValues[i].value;
                        }else if(oOrderData.customValues[i].attribute === "HEADER_LENGTH"){
                            oSfcCardCustom.length = oOrderData.customValues[i].value;
                        }else if(oOrderData.customValues[i].attribute === "HEADER_WIDTH"){
                            oSfcCardCustom.width = oOrderData.customValues[i].value;
                        }else if(oOrderData.customValues[i].attribute === "HEADER_ARTFAM"){
                            oSfcCardCustom.artFam = oOrderData.customValues[i].value;
                        }else if(oOrderData.customValues[i].attribute === "HEADER_RECIPE"){
                            oSfcCardCustom.recipeNumber = oOrderData.customValues[i].value;
                        }else if(oOrderData.customValues[i].attribute === "HEADER_CROSS_COMPANY"){
                            oSfcCardCustom.crossCompany = oOrderData.customValues[i].value;
                        }
                        
                    }
                }

                if(oMaterialData[0].customValues !== undefined){
                    for(var i = 0; i < oMaterialData[0].customValues.length; i++ ){
                        switch(oMaterialData[0].customValues[i].attribute) {
                            case "THICKNESS":
                                oSfcCardCustom.thickness = oMaterialData[0].customValues[i].value;
                                break;
                            case "RECIPE_IMPREGNATION":
                                oSfcCardCustom.recipeNumber = oMaterialData[0].customValues[i].value;
                                break;
                            case "ARTFAM_COM":
                                oSfcCardCustom.artfamCom = oMaterialData[0].customValues[i].value;
                                break;
                            case "ARTFAM_ELE":
                                oSfcCardCustom.artfamEle = oMaterialData[0].customValues[i].value;
                                break;
                            case "ARTFAM_GRP":
                                oSfcCardCustom.artfamGrp = oMaterialData[0].customValues[i].value;
                                break;
                            case "ARTFAM_ROHPL_E":
                                oSfcCardCustom.artfamRohlpE = oMaterialData[0].customValues[i].value;
                                break;
                            case "ARTFAM_ROHPLATTE":
                                oSfcCardCustom.artfamRohlpatte = oMaterialData[0].customValues[i].value;
                                break;
                            case "RU_TYPE":
                                oSfcCardCustom.ruType = oMaterialData[0].customValues[i].value;
                                break;
                            case "SALES_TEXT_PL":
                                oSfcCardCustom.salesTextPL = oMaterialData[0].customValues[i].value;
                                break;
                            case "SALES_TEXT_EN":
                                oSfcCardCustom.salesTextEN = oMaterialData[0].customValues[i].value;
                                break;
                            case "SALES_TEXT_DE":
                                oSfcCardCustom.salesTextDE = oMaterialData[0].customValues[i].value;
                                break;
                            case "BLAT_MATERIAL_TOP":
                                oSfcCardCustom.blatMaterialTop = oMaterialData[0].customValues[i].value;
                                break;
                            case "BLAT_MATERIAL_DOWN":
                                oSfcCardCustom.blatMaterialDown = oMaterialData[0].customValues[i].value;
                                break;
                            case "BLAT_THICKNESS_TOP":
                                oSfcCardCustom.blatThicknessTop = oMaterialData[0].customValues[i].value;
                                break;
                            case "BLAT_THICKNESS_DOWN":
                                oSfcCardCustom.blatThicknessDown = oMaterialData[0].customValues[i].value;
                                break;
                        }
                    }
                }

                
            }catch(e){
                //oPodSelectionModel.customData.sfcCardCustom = {};
            }
            oPodSelectionModel.customData.sfcCardCustom = oSfcCardCustom;
            


            let oModel = new JSONModel(oPodSelectionModel.customData);
            oController.getView().setModel(oModel, "customData");
            oController.getPodController().getView().setModel(oModel, "customData");
            this.getCoreExtension().getPluginToolbar().setModel(oModel, "customData");
        },
        _getOrderData: async function(oController ,oOrder, oPlant){
            var sUrl = oController.getPublicApiRestDataSourceUri() + "order/v1/orders";

            var oParameters = { order: oOrder,
                                plant: oPlant };
            return await new Promise((resolve,reject)=>{
                oController.ajaxGetRequest(sUrl, oParameters,
                    function (oResponseData) {
                        resolve(oResponseData);
                    },
                    function (oError, sHttpErrorMessage) {
                        reject(oError);
                    }   
                );

            });

        },
        _getMaterialData: async function(oController, OPlant, oMaterial, oMaterialVersion){
            var sUrl = oController.getPublicApiRestDataSourceUri() + "material/v1/materials";

            var oParameters = { plant: OPlant,
                                material: oMaterial,
                                materialVersion: oMaterialVersion
             };
            return await new Promise((resolve,reject)=>{
                oController.ajaxGetRequest(sUrl, oParameters,
                    function (oResponseData) {
                        resolve(oResponseData);
                    },
                    function (oError, sHttpErrorMessage) {
                        reject(oError);
                    }   
                );

            });
        }
    })
});