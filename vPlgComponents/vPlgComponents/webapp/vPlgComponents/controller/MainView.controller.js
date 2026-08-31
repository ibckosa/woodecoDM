sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/BomRepository",
    "ibc/dm/plugins/wcPodToolsProvider/IssueReader",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/PalleteQueueHandler",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository"
], function (jQuery, PluginViewController, JSONModel, ErrorHandler, TextHandler, BomRepository, IssueReader, OrderRepository, PalleteQueueHandler, MaterialRepository) {
	"use strict";

	return PluginViewController.extend("ibc.dm.vPlgComponents.vPlgComponents.controller.MainView", {
		onInit: function () {
			PluginViewController.prototype.onInit.apply(this, arguments);
			this._oTextHandler = new TextHandler();
            this._oErrorHandler = new ErrorHandler(this); 
		},
        onAfterRendering: function(){
        },

        onBeforeRendering: async function(){
            this._loadData();
        },
		onBeforeRenderingPlugin: function () {
            this.subscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.subscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
		},

        onPodSelectionChangeEvent: async function (sChannelId, sEventId, oData) {
            await this._loadData();
        },

        onWorkListSelectEvent: async function (sChannelId, sEventId, oData) {
            await this._loadData();
        },

        isSubscribingToNotifications: function() {
            
            var bNotificationsEnabled = true;
           
            return bNotificationsEnabled;
        },


        getCustomNotificationEvents: function(sTopic) {
        },


        getNotificationMessageHandler: function(sTopic) {

            return null;
        },

        _handleNotificationMessage: function(oMsg) {
        },
        

		onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);
		},

        _loadData: async function(){
            try{
                this.getView().setBusyIndicatorDelay(0);
                this.getView().setBusy(true);
                this._setInternalVariables();
                let bomSfcComponents = await BomRepository.readBomSfcInternalApi(this, this._oPlant, this._oSfc, this._operation);
                bomSfcComponents = await this._modifySfcComponents(bomSfcComponents);
                // for(let component of bomSfcComponents){
                //     component.consumeButtonVisible = true;
                // }
                const oModel = new JSONModel({ items: bomSfcComponents });
                this.getView().setModel(oModel, "componentsModel");
                this._sortTable();

                this.getView().setBusy(false);
            }catch(oError){
                this.getView().setBusy(false);
                this._oErrorHandler.handleError(oError);
            } 
        },

        _sortTable: function(){
            try {
                let oTable = this.byId("componentsTable");
                let sorter = oTable.getBinding("items").aSorters[0];
                if(sorter){
                    if(oTable.getBinding("items").aSorters){
                        oTable.getBinding("items").sort(oTable.getBinding("items").aSorters);
                        oTable.getBinding("items").applySort();
                    }
                }else{
                    var oNewSorter = [new sap.ui.model.Sorter("consumeButtonVisible",true),
                                      new sap.ui.model.Sorter("componentSequence",false)];
                    oTable.getBinding("items").sort(oNewSorter);
                    oTable.getBinding("items").applySort();
                }
            } catch (error) {
            }  
        },

        _modifySfcComponents: async function(sfcComponents){
            let result = [];

            let orderInstance = await OrderRepository.readOrder(this, this._oPlant, this._oOrderNumber);
            let bomInstance = await BomRepository.getInstance(this, this._oPlant, orderInstance.getBomNumber(), orderInstance.getBomType() );

            for(let sfcComponent of sfcComponents){
                let materialInstance = await MaterialRepository.getMaterialInstance(this, this._oPlant, sfcComponent.component.material);
                let componentType = bomInstance.getComponentType(sfcComponent.componentSequence);

                if(componentType==="NORMAL"){
                    let issuedQuantity = 0;
                    sfcComponent.zuom = bomInstance.getComponentUom(sfcComponent.componentSequence);
                    let materialIssues = await IssueReader.readIssues(this, this._oPlant, this._oOrderNumber, sfcComponent.component.material, sfcComponent.component.version);
                    for(const materialIssue of materialIssues){
                        if(materialIssue.comments.includes("//")){
                            materialIssue.comments = materialIssue.comments.split('//')[0].trim();
                        }
                    }

                    let materialIssuesForSeq = materialIssues.filter( issue=>{return issue.comments === sfcComponent.componentSequence.toString() && issue.cancellationTriggered === false});
                    for(let issue of materialIssuesForSeq){

                        if(sfcComponent.zuom===issue.quantityInBaseUnit.internalUnitOfMeasure){
                            issuedQuantity = Math.round((issuedQuantity + issue.quantityInBaseUnit.value) * 1000)/1000;
                        }else{
                            let quantityConverted = materialInstance.convertUom(issue.quantityInBaseUnit.value, issue.quantityInBaseUnit.internalUnitOfMeasure, sfcComponent.zuom);
                            issuedQuantity = Math.round((issuedQuantity + quantityConverted) * 1000)/1000;
                        }
                        
                    }
                    sfcComponent.consumeButtonVisible = bomInstance.getComponentBackflush(sfcComponent.componentSequence) === false;
                    
                    sfcComponent.salesSegmentRequired = bomInstance.getSalesSegmentRequired(sfcComponent.componentSequence);
                    sfcComponent.issuedQuantity = issuedQuantity;
                    sfcComponent.requiredQuantity = bomInstance.getComponentQuantity(sfcComponent.componentSequence);
                    sfcComponent.zstorageLocation = bomInstance.getComponentStoragelication(sfcComponent.componentSequence);
                    result.push(sfcComponent);
                }
            }

            return result;
        },

        _setInternalVariables: function(){
            try{
                let oPodSelectionModel = this.getPodSelectionModel();
                let oSelections = oPodSelectionModel.getSelections(); 
                let oFirstSelection = oSelections[0]; 
                this._oPlant = this.getPodController().getUserPlant();
                this._oOrderNumber = oFirstSelection.getShopOrder().getShopOrder();
                this._oWorkCenter = oPodSelectionModel.workCenter;
                this._oResource = oPodSelectionModel.resource.resource;
                this._oSfc = oFirstSelection.getSfc().getSfc();
                this._operation = oFirstSelection.getSfcData().getOperation();
                this._routing = oFirstSelection.getSfcData().getRouting();
                this._routingVersion = oFirstSelection.getSfcData().getRoutingVersion();
            }catch(error){
                this._oErrorHandler.throwErrorNoDisplay("");
            }
        },

        onConsume: async function(oEvent){
            let oLine = oEvent.getSource().getBindingContext("componentsModel").getObject();
            try{
                let order = await OrderRepository.readOrder(this, this._oPlant, this._oOrderNumber);
                let oHandlerData = { plant: this._oPlant,
                                     workCenter: this._oWorkCenter,
                                     resource: this._oResource,
                                     storageLocation: oLine.zstorageLocation,
                                     material: oLine.component.material,
                                     materialDescription: oLine.componentDescription,
                                     version: "",
                                     sfc: this._oSfc,
                                     operationActivity: this._operation,
                                     bomComponentRef: oLine.bomComponentRef,
                                     sequence: oLine.componentSequence,
                                     order: this._oOrderNumber,
                                     salesOrder: order.getCustomerOrder(),
                                     salesOrderItem: order.getCustomerOrderItem(),
                                     salesSegmentRequired: oLine.salesSegmentRequired,
                                     uom: oLine.zuom };
                let oPalleteQueueHandler = new PalleteQueueHandler();
                oPalleteQueueHandler.setHandlerData(oHandlerData);
                oPalleteQueueHandler.displayPaletteQueue(this,"COMPONENT");
                
            }catch(oError){}
    }
	});
});