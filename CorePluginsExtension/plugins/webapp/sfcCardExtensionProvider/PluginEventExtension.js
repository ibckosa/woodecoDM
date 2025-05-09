sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginControllerExtension",
    "sap/ui/core/mvc/OverrideExecution",
    "sap/dm/dme/plugins/headerInformationPlugin/controller/extensions/PluginEventExtensionConstants",
    "sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/SmartEditGraphicRepository",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository"
], function (PluginControllerExtension, OverrideExecution, PluginEventConstants, JSONModel, SmartEditGraphicRepository, MaterialRepository, OrderRepository, SfcRepository) {
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
                                                        percentProgress: "0",
                                                        decors: []
                                                     },
                                                     sfcCardCustomVisibility: { optimizationNumber: false,
                                                        recipeNumber: false,
                                                        blockNumber: false,
                                                        customerName: false,
                                                        artFam: false,
                                                        thickness: false,
                                                        length: false,
                                                        width: false,
                                                        remarksButton: false,
                                                        crossCompany: false,
                                                        blatMaterialTop: false,
                                                        blatMaterialDown: false,
                                                        blatThicknessTop: false,
                                                        blatThicknessDown: false,
                                                        salesTextPL: false,
                                                        salesTextEN: false,
                                                        salesTextDE: false,
                                                        artfamCom: false,
                                                        artfamEle: false,
                                                        artfamGrp: false,
                                                        artfamRohlpE: false,
                                                        artfamRohlpatte: false,
                                                        ruType: false,
                                                        progressIndicatorValue: false,
                                                        decor: false }

                                                     
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
           // let oGraphic = SmartEditGraphicRepository.getGraphic(oController, "PD3000");

            let  sfcCardCustomVisibility = { optimizationNumber: false,
                                             recipeNumber: false,
                                                blockNumber: false,
                                                customerName: false,
                                                artFam: false,
                                                thickness: false,
                                                length: false,
                                                width: false,
                                                remarksButton: false,
                                                crossCompany: false,
                                                blatMaterialTop: false,
                                                blatMaterialDown: false,
                                                blatThicknessTop: false,
                                                blatThicknessDown: false,
                                                salesTextPL: false,
                                                salesTextEN: false,
                                                salesTextDE: false,
                                                artfamCom: false,
                                                artfamEle: false,
                                                artfamGrp: false,
                                                artfamRohlpE: false,
                                                artfamRohlpatte: false,
                                                ruType: false,
                                                progressIndicatorValue: false };


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
                                        percentProgress: "0",
                                        decors: []
                                     };



                var oPodController = oController.getPodController();                   
                var oOrder = oFirstSelection.getShopOrder().getShopOrder();
                var oSfcNumber = oFirstSelection.getSfc().getSfc();
                var oPlant = oPodController.getUserPlant();
                var oMaterial = oFirstSelection.getSfcData().getMaterial();
                let oOrderInstance = await OrderRepository.readOrderByPassBuffer(oController, oPlant, oOrder);
                let oMaterialInstance =  await MaterialRepository.getMaterialInstance(oController, oPlant, oMaterial);
                var oMaterialData = oMaterialInstance.getDetails();
                var oOrderData = oOrderInstance.getDetails();
                let oSfcs = oOrderInstance.getSfcs();

                let oSfc = await SfcRepository.getInstance(oController, oPlant, oSfcNumber);
                let oSteps  = oSfc.getSteps();
                let oFirstStep = oSteps[0];
                let oSfcsInstances = await this._getSfcsInstances(oController, oPlant, oSfcs);
                let oTotalOrderQuan = 0;
                let oDoneOrderQuan = 0;

                for(const sfcInstance of oSfcsInstances){
                    oTotalOrderQuan = oTotalOrderQuan + sfcInstance.getTotalQuan(oFirstSelection.getSfcData().getOperation());
                    oDoneOrderQuan = oDoneOrderQuan + sfcInstance.getDoneQuanOfOperation(oFirstSelection.getSfcData().getOperation());
                }
                if(oFirstStep.operation.operation === oFirstSelection.getSfcData().getOperation()){
                    oTotalOrderQuan = oOrderData.productionQuantity;
                }
                debugger;

                //let oFieldConfiguration = this._getFieldConfiguration(oController, );
                oSfcCardCustom.decors = await oMaterialInstance.getGraphics();

                

                
                if(oTotalOrderQuan>0){
                    oSfcCardCustom.progressIndicatorValue =  oDoneOrderQuan + " z " + oTotalOrderQuan;
                    oSfcCardCustom.percentProgress = parseInt( oDoneOrderQuan / oTotalOrderQuan * 100 ).toString();
                }
                
                // if(oOrderData.productionQuantity>0){
                //     oSfcCardCustom.progressIndicatorValue =  oOrderData.doneQuantityInProductionUom + " z " + oOrderData.productionQuantity;
                //     if(oOrderData.productionQuantity>0){
                //         oSfcCardCustom.percentProgress = parseInt( oOrderData.doneQuantityInProductionUom / oOrderData.productionQuantity * 100 ).toString();
                //     }
                // }

                if(oOrderData.customValues !== undefined){
                    for(var i = 0; i < oOrderData.customValues.length; i++ ){
                        if(oOrderData.customValues[i].attribute === "HEADER_OPTIMNO"){
                            oSfcCardCustom.optimizationNumber = oOrderData.customValues[i].value;
                            if(oSfcCardCustom.optimizationNumber){sfcCardCustomVisibility.optimizationNumber = true;}
                        }else if(oOrderData.customValues[i].attribute === "HEADER_BLOCKNO"){
                            oSfcCardCustom.blockNumber = oOrderData.customValues[i].value;
                            if(oSfcCardCustom.blockNumber){sfcCardCustomVisibility.blockNumber = true;}
                        }else if(oOrderData.customValues[i].attribute === "CUSTOMER_NAME"){
                            oSfcCardCustom.customerName = oOrderData.customValues[i].value;
                            if(oSfcCardCustom.customerName){sfcCardCustomVisibility.customerName = true;}
                        }else if(oOrderData.customValues[i].attribute === "HEADER_REMARKS"){
                            oSfcCardCustom.remarksButton = oOrderData.customValues[i].value;
                            if(oSfcCardCustom.remarksButton){sfcCardCustomVisibility.remarksButton = true;}
                        }else if(oOrderData.customValues[i].attribute === "HEADER_THICKNESS"){
                            oSfcCardCustom.thickness = oOrderData.customValues[i].value;
                            if(oSfcCardCustom.thickness){sfcCardCustomVisibility.thickness = true;}
                        }else if(oOrderData.customValues[i].attribute === "HEADER_LENGTH"){
                            oSfcCardCustom.length = oOrderData.customValues[i].value;
                            if(oSfcCardCustom.length){sfcCardCustomVisibility.length = true;}
                        }else if(oOrderData.customValues[i].attribute === "HEADER_WIDTH"){
                            oSfcCardCustom.width = oOrderData.customValues[i].value;
                            if(oSfcCardCustom.width){sfcCardCustomVisibility.width = true;}
                        }else if(oOrderData.customValues[i].attribute === "HEADER_ARTFAM"){
                            oSfcCardCustom.artFam = oOrderData.customValues[i].value;
                            if(oSfcCardCustom.artFam){sfcCardCustomVisibility.artFam = true;}
                        }else if(oOrderData.customValues[i].attribute === "HEADER_RECIPE"){
                            oSfcCardCustom.recipeNumber = oOrderData.customValues[i].value;
                            if(oSfcCardCustom.recipeNumber){sfcCardCustomVisibility.thickness = true;}
                        }else if(oOrderData.customValues[i].attribute === "HEADER_CROSS_COMPANY"){
                            oSfcCardCustom.crossCompany = oOrderData.customValues[i].value;
                            if(oSfcCardCustom.crossCompany){sfcCardCustomVisibility.thickness = true;}
                        }
                        
                    }
                }

                if(oMaterialData.customValues !== undefined){
                    for(var i = 0; i < oMaterialData.customValues.length; i++ ){
                        switch(oMaterialData.customValues[i].attribute) {
                            case "THICKNESS":
                                oSfcCardCustom.thickness = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.thickness){sfcCardCustomVisibility.thickness = true;}
                                break;
                            case "RECIPE_IMPREGNATION":
                                oSfcCardCustom.recipeNumber = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.recipeNumber){sfcCardCustomVisibility.recipeNumber = true;}
                                break;
                            case "ARTFAM_COM":
                                oSfcCardCustom.artfamCom = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.artfamCom){sfcCardCustomVisibility.artfamCom = true;}
                                break;
                            case "ARTFAM_ELE":
                                oSfcCardCustom.artfamEle = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.artfamEle){sfcCardCustomVisibility.artfamEle = true;}
                                break;
                            case "ARTFAM_GRP":
                                oSfcCardCustom.artfamGrp = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.artfamGrp){sfcCardCustomVisibility.artfamGrp = true;}
                                break;
                            case "ARTFAM_ROHPL_E":
                                oSfcCardCustom.artfamRohlpE = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.artfamRohlpE){sfcCardCustomVisibility.artfamRohlpE = true;}
                                break;
                            case "ARTFAM_ROHPLATTE":
                                oSfcCardCustom.artfamRohlpatte = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.artfamRohlpatte){sfcCardCustomVisibility.artfamRohlpatte = true;}
                                break;
                            case "RU_TYPE":
                                oSfcCardCustom.ruType = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.ruType){sfcCardCustomVisibility.ruType = true;}
                                break;
                            case "SALES_TEXT_PL":
                                oSfcCardCustom.salesTextPL = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.salesTextPL){sfcCardCustomVisibility.salesTextPL = true;}
                                break;
                            case "SALES_TEXT_EN":
                                oSfcCardCustom.salesTextEN = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.salesTextEN){sfcCardCustomVisibility.salesTextEN = true;}
                                break;
                            case "SALES_TEXT_DE":
                                oSfcCardCustom.salesTextDE = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.salesTextDE){sfcCardCustomVisibility.salesTextDE = true;}
                                break;
                            case "BLAT_MATERIAL_TOP":
                                oSfcCardCustom.blatMaterialTop = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.blatMaterialTop){sfcCardCustomVisibility.blatMaterialTop = true;}
                                break;
                            case "BLAT_MATERIAL_DOWN":
                                oSfcCardCustom.blatMaterialDown = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.blatMaterialDown){sfcCardCustomVisibility.blatMaterialDown = true;}
                                break;
                            case "BLAT_THICKNESS_TOP":
                                oSfcCardCustom.blatThicknessTop = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.blatThicknessTop){sfcCardCustomVisibility.blatThicknessTop = true;}
                                break;
                            case "BLAT_THICKNESS_DOWN":
                                oSfcCardCustom.blatThicknessDown = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.blatThicknessDown){sfcCardCustomVisibility.blatThicknessDown = true;}
                                break;
                        }
                    }
                }

                
            }catch(e){
                //oPodSelectionModel.customData.sfcCardCustom = {};
            }
            oPodSelectionModel.customData.sfcCardCustom = oSfcCardCustom;
            oPodSelectionModel.customData.sfcCardCustomVisibility = sfcCardCustomVisibility;

            let oModel = new JSONModel(oPodSelectionModel.customData);
            try{
                oController.getView().setModel(oModel, "customData");
                oController.getPodController().getView().setModel(oModel, "customData");
                this.getCoreExtension().getPluginToolbar().setModel(oModel, "customData");
            }catch(oError){}

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
        },
        _getFieldConfiguration: function(oController){

        },
        _getSfcsInstances: async function(oController, oPlant, oSfcs){
            let oPromises = oSfcs.map(sfc => SfcRepository.ReadSfcBypassBuffer(oController, oPlant, sfc) );
            return await Promise.all(oPromises);
        }
    })
});