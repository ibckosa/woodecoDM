sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/ListPluginViewController",//PluginViewController
	"sap/ui/model/json/JSONModel",
  "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
  "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
  "ibc/dm/plugins/wcPodToolsProvider/SfcRepository",
  "sap/dm/dme/podfoundation/model/Selection",
  "sap/dm/dme/podfoundation/model/SfcKeyData",
  "sap/dm/dme/podfoundation/model/ResourceKeyData",
  "sap/dm/dme/podfoundation/model/ShopOrderKeyData",
  "sap/dm/dme/podfoundation/model/SfcData",
  "sap/dm/dme/podfoundation/model/ItemKeyData",
  "sap/dm/dme/podfoundation/model/ProcessLotKeyData",
  "ibc/dm/plugins/wcPodToolsProvider/WorkCenterRepository",
  "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
  "sap/m/library"
], function (jQuery, PluginViewController, JSONModel, ErrorHandler, OrderRepository, SfcRepository, Selection, SfcKeyData, ResourceKeyData, ShopOrderKeyData, SfcData, ItemKeyData, ProcessLotKeyData, WorkCenterRepository, TextHandler,
  mobileLibrary) 
{
	"use strict";

	return PluginViewController.extend("ibc.dm.vPlgSelectOrder.vPlgSelectOrder.controller.MainView", {
		onInit: function () {
			PluginViewController.prototype.onInit.apply(this, arguments);
			this._errorHandler = new ErrorHandler(this);
      this._textHandler = new TextHandler();
            
		},




        onAfterRendering: function(){
           
            // this.getView().byId("backButton").setVisible(this.getConfiguration().backButtonVisible);
            // this.getView().byId("closeButton").setVisible(this.getConfiguration().closeButtonVisible);
            
            // this.getView().byId("headerTitle").setText(this.getConfiguration().title);
            // this.getView().byId("textPlugin").setText(this.getConfiguration().text); 

        },

		onBeforeRenderingPlugin: function () {

			
			
		},

        isSubscribingToNotifications: function() {
            
            var bNotificationsEnabled = true;
           
            return bNotificationsEnabled;
        },


        getCustomNotificationEvents: function(sTopic) {
            //return ["template"];
        },


        getNotificationMessageHandler: function(sTopic) {

            //if (sTopic === "template") {
            //    return this._handleNotificationMessage;
            //}
            return null;
        },

        _handleNotificationMessage: function(oMsg) {


        },

        onSelectPress: async function(){
          try{
            let plant = this.getPodController().getUserPlant();
            let order = this.byId("selectedOrderInput").getValue();
            this._orderInstance = await OrderRepository.readOrderByPassBuffer(this, plant, order);
            let orderRouting = this._orderInstance.getRouting();
            this._mainSfcInstance = await SfcRepository.getInstance(this, plant, `${order}_M0000`, orderRouting.routing, orderRouting.type);
            let steps = this._mainSfcInstance.getSteps();
            this._setOrderSelectModel(steps);
            debugger;
          }catch(error){
            this._setOrderSelectModel([]);
            this._errorHandler.handleError(error);
          }
        },
      
    _setOrderSelectModel: function(steps){
      let modelData = [];
      if(steps&&steps.length>0){
        let sfcDetails = this._mainSfcInstance.getDetails();
        for(const step of steps){
          modelData.push({
            step: step,
            operation: step.operation.operation,
            workCenter: step.plannedWorkCenter,
            material: sfcDetails.material.material,
            materialDescription: sfcDetails.material.description
          });
        }
      }
      const oModel = new JSONModel({ orderOperations: modelData });
      this.getView().setModel(oModel, "selectOrderModel");
    },

    onOperationSelect: async function(oEvent){
      try{
        let operationsTable = oEvent.getSource();
        let selectedItemData = operationsTable.getSelectedItem().getBindingContext("selectOrderModel").getObject();
        let workCenterInstance = await WorkCenterRepository.getInstance(this,this.getPodController().getUserPlant(), selectedItemData.workCenter);

        let resources = workCenterInstance.getResources();
        if(resources.length === 0){
          return;
        }else if(resources.length === 1){
          this._resource = resources[0];
        }else{
          await this._getResourceDialog(resources);
        }


        this._setPodSelectionModel(selectedItemData);
        operationsTable.removeSelections(true);
        this.navigateToPage("ACTIVITIES");
        
      }catch(error){
        this._errorHandler.handleError(error);
      }
    },    
    _getResourceDialog: async function(resources){
      return await new Promise((resolve,reject)=>{
        this._resolveDialog = resolve;
        this._rejectDialog = reject;
        if (!this._dialog) {
          this._dialog = new sap.m.Dialog({
            type: mobileLibrary.DialogType.Message,
            title: this._textHandler.getText("information.selectOrder.selectResourceTitle"),
            content: this._getDialogContent(resources),
              beginButton: new sap.m.Button({
              type: mobileLibrary.ButtonType.Emphasized,
              text: this._textHandler.getText("answerSelect"),
              press: async function () {
                this._resource = this._radioButtonGroup.getSelectedButton().getText();
                this._dialog.close();
                this._dialog.destroy();
                this._dialog = null;
                this._resolveDialog();
              }.bind(this)
            }),
            endButton: new sap.m.Button({
              text: this._textHandler.getText("answerCancel"),
              press: function () {
                this._dialog.close();
                this._dialog.destroy();
                this._dialog = null;
                this._rejectDialog({ message: "",
                                    displayType: "NO_DISPLAY" })
              }.bind(this)
            })
          });
        }

        this._dialog.open();
      });
    },
    _getDialogContent: function(resources){
      this._radioButtonGroup = new sap.m.RadioButtonGroup();

      for(const resource of resources){
        this._radioButtonGroup.addButton(new sap.m.RadioButton({ text: resource }));
      }
      return this._radioButtonGroup;
    },
    _setPodSelectionModel: function(itemData){
      let oPodSelectionModel = this.getPodSelectionModel();
      this.clearSelectionsInModel(oPodSelectionModel);
      let sfcDetails = this._mainSfcInstance.getDetails();


      let oSelection = new Selection();      
      let sfcKeyData = this._getSfcKeyData(itemData);
      let shopOrderKeyData = this._getShopOrderKeyData();
      let sfcData = this._getSfcData(itemData);
      let processKeyData = this._getProcessKeyData();
      let materialKeyData = this._getMaterialKeyData(sfcDetails);

      oPodSelectionModel.setResource(new ResourceKeyData(this._resource));
      oPodSelectionModel.setWorkCenter(itemData.workCenter);
      oSelection.setSfc(sfcKeyData);
      oSelection.setShopOrder(shopOrderKeyData);
      oSelection.setProcessLot(processKeyData);
      oSelection.setItem(materialKeyData);
      oSelection.setSfcData(sfcData);
      oSelection.setInput(this._mainSfcInstance.getSfcNumber());

      oPodSelectionModel.addDistinctSelection(oSelection);
      oPodSelectionModel.addSelection(oSelection);
    },
    _getSfcKeyData: function(){
      let sfcKeyData = new SfcKeyData();
      sfcKeyData.setSfc(this._mainSfcInstance.getSfcNumber());
      return sfcKeyData;
    },
    _getShopOrderKeyData: function(){
      let shopOrderKeyData =  new ShopOrderKeyData();
      shopOrderKeyData.setShopOrder(this._orderInstance.getOrderNumber());
      return shopOrderKeyData
    },
    _getSfcData: function(itemData){
      let sfcData = new SfcData();

      sfcData.setSfc(this._mainSfcInstance.getSfcNumber());
      sfcData.setMaterial(itemData.material);
      sfcData.setRouting(itemData.step.stepRouting.routing);
      sfcData.setRoutingVersion(itemData.step.stepRouting.version);
      sfcData.setOperation(itemData.step.operation.operation);
      sfcData.setResource(this._resource);

      return sfcData;
    },
    _getProcessKeyData: function(){
      let processKeyData = new ProcessLotKeyData();
      processKeyData.setProcessLot(null);

      return processKeyData;
    },

    _getMaterialKeyData: function(sfcDetails){
      let materialKeyData = new ItemKeyData();
      materialKeyData.setItem(sfcDetails.material.material);
      materialKeyData.setVersion(sfcDetails.material.version);
      return materialKeyData;
    },
    clearSelectionsInModel: function (oPodSelectionModel) {
            let oModel = oPodSelectionModel;
            if (!oPodSelectionModel) {
                oModel = this.getPodSelectionModel();
            }
            if (oModel) {
                oModel.clearSelections();
                oModel.clearDistinctSelections();
                oModel.clearSelectedRoutingSteps();
            }
    },

		onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);
		}
	});
});