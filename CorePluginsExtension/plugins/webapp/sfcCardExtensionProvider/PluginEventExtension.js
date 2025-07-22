sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginControllerExtension",
    "sap/ui/core/mvc/OverrideExecution",
    "sap/dm/dme/plugins/headerInformationPlugin/controller/extensions/PluginEventExtensionConstants",
    "sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/SmartEditGraphicRepository",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcDataCollectionReader",
    "ibc/dm/plugins/wcPodToolsProvider/OrderReceiptsFromProgressIndicator"
], function (PluginControllerExtension, OverrideExecution, PluginEventConstants, JSONModel, SmartEditGraphicRepository, MaterialRepository, OrderRepository, SfcRepository, SfcDataCollectionReader, OrderReceiptsFromProgressIndicator) {
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
            try{
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
                                                     sfcCardCustomVisibility: this._getVisibilityStructure()

                                                     
                    };
                }
                let oModel = new JSONModel(oPodSelectionModel.customData);
                oController.getPodController().getView().setModel(oModel, "customData");
                this.getCoreExtension().getPluginToolbar().setModel(oModel, "customData");
            }

            this._getCustomData(oController, oPodSelectionModel);
            }catch(oError){
                
            }
        },
        _getCustomData: async function(oController, oPodSelectionModel){            
            var oFirstSelection = oPodSelectionModel.getSelections()[0];
            if(!oFirstSelection){
                return;
            }
           // let oGraphic = SmartEditGraphicRepository.getGraphic(oController, "PD3000");
            let  sfcCardCustomVisibility = this._getVisibilityStructure();
            let oTotalOrderQuan = 0;
            let oDoneOrderQuan = 0;

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
                // let oSfcsInstances = await this._getSfcsInstances(oController, oPlant, oSfcs);


                let dataCollections = await SfcDataCollectionReader.readCollections(oController, oPlant, oSfcs, oFirstSelection.getSfcData().getOperation(), false, true, oFirstSelection.getSfcData().getRouting(), oFirstSelection.getSfcData().getRoutingVersion());
                oTotalOrderQuan = oOrderData.productionQuantity;
                
                // for(const sfcInstance of oSfcsInstances){
                //     oTotalOrderQuan = oTotalOrderQuan + sfcInstance.getTotalQuan(oFirstSelection.getSfcData().getOperation());
                //     //oDoneOrderQuan = oDoneOrderQuan + sfcInstance.getDoneQuanOfOperation(oFirstSelection.getSfcData().getOperation());
                // }
                // if(oFirstStep.operation.operation === oFirstSelection.getSfcData().getOperation()){
                //     oTotalOrderQuan = oOrderData.productionQuantity;
                // }
                for(const dataCollection of dataCollections){
                    if(dataCollection.QUANTITY&&dataCollection["Q1/Q3"] === "Q1"){
                        oDoneOrderQuan = oDoneOrderQuan + parseInt(dataCollection.QUANTITY);
                    }
                }
                
                oSfcCardCustom.decors = await oMaterialInstance.getCustomDataGraphics();

                if(oTotalOrderQuan>0){
                    oSfcCardCustom.progressIndicatorValue =  oDoneOrderQuan + " z " + oTotalOrderQuan;
                    oSfcCardCustom.percentProgress = parseInt( oDoneOrderQuan / oTotalOrderQuan * 100 ).toString();
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

                if(oMaterialData.customValues !== undefined){
                    for(var i = 0; i < oMaterialData.customValues.length; i++ ){
                        switch(oMaterialData.customValues[i].attribute) {
                            case "THICKNESS":
                                oSfcCardCustom.thickness = oMaterialData.customValues[i].value;
                                break;
                            case "RECIPE_IMPREGNATION":
                                oSfcCardCustom.recipeNumber = oMaterialData.customValues[i].value;
                                break;
                            case "ARTFAM_COM":
                                oSfcCardCustom.artfamCom = oMaterialData.customValues[i].value;
                                break;
                            case "ARTFAM_ELE":
                                oSfcCardCustom.artfamEle = oMaterialData.customValues[i].value;
                                break;
                            case "ARTFAM_GRP":
                                oSfcCardCustom.artfamGrp = oMaterialData.customValues[i].value;
                                break;
                            case "ARTFAM_ROHPL_E":
                                oSfcCardCustom.artfamRohlpE = oMaterialData.customValues[i].value;
                                break;
                            case "ARTFAM_ROHPLATTE":
                                oSfcCardCustom.artfamRohlpatte = oMaterialData.customValues[i].value;
                                break;
                            case "RU_TYPE":
                                oSfcCardCustom.ruType = oMaterialData.customValues[i].value;
                                if(oSfcCardCustom.ruType){sfcCardCustomVisibility.ruType = true;}
                                break;
                            case "SALES_TEXT_PL":
                                oSfcCardCustom.salesTextPL = oMaterialData.customValues[i].value;
                                break;
                            case "SALES_TEXT_EN":
                                oSfcCardCustom.salesTextEN = oMaterialData.customValues[i].value;
                                break;
                            case "SALES_TEXT_DE":
                                oSfcCardCustom.salesTextDE = oMaterialData.customValues[i].value;
                                break;
                            case "BLAT_MATERIAL_TOP":
                                oSfcCardCustom.blatMaterialTop = oMaterialData.customValues[i].value;
                                break;
                            case "BLAT_MATERIAL_DOWN":
                                oSfcCardCustom.blatMaterialDown = oMaterialData.customValues[i].value;
                                break;
                            case "BLAT_THICKNESS_TOP":
                                oSfcCardCustom.blatThicknessTop = oMaterialData.customValues[i].value;
                                break;
                            case "BLAT_THICKNESS_DOWN":
                                oSfcCardCustom.blatThicknessDown = oMaterialData.customValues[i].value;
                                break;
                        }
                    }
                }
                sfcCardCustomVisibility = this._getFieldConfiguration(oController, oOrderInstance);
                
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
                OrderReceiptsFromProgressIndicator.setOrderProgress(oOrder, oDoneOrderQuan, oTotalOrderQuan, oModel);
            }catch(oError){}

        },
        _getFieldConfiguration: function(oController, oOrderInstance){
            let oReturn = this._getVisibilityStructure();
            let orderType =  oOrderInstance.getOrderType();

            let fieldsConfiguration = oController.getConfigurationValue(`fields${orderType}`);

            if(fieldsConfiguration){
                let visibleFields = fieldsConfiguration.split(";");

                for(const field of visibleFields){
                    if (oReturn.hasOwnProperty(field)) {
                        oReturn[field] = true;
                    }

                }
            }
            return oReturn;

        },
        _getSfcsInstances: async function(oController, oPlant, oSfcs){
            let oPromises = oSfcs.map(sfc => SfcRepository.ReadSfcBypassBuffer(oController, oPlant, sfc) );
            return await Promise.all(oPromises);
        },
        _getVisibilityStructure: function(){
            return { optimizationNumber: false,
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
                   decors: false };
        }
    })
});