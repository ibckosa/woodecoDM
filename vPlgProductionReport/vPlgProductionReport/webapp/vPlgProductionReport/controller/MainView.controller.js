sap.ui.define([
  'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
  "sap/ui/core/date/UI5Date",
  "ibc/dm/plugins/vPlgProductionReport/vPlgProductionReport/controller/ProductionReportModel",
  "ibc/dm/plugins/wcPodToolsProvider/PodTools",
  "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
  'sap/ui/core/Fragment',
  'sap/ui/core/format/DateFormat',
], function (jQuery, PluginViewController, JSONModel, UI5Date, ProductionReportModel, PodTools, ErrorHandler, Fragment, DateFormat) {
	"use strict";

	return PluginViewController.extend("ibc.dm.plugins.vPlgProductionReport.vPlgProductionReport.controller.MainView", {
		onInit: function () {
			PluginViewController.prototype.onInit.apply(this, arguments);
            var oModel = new JSONModel();
            //this.byId("PCLegend").setStandardItems([]);
            this._errorHandler = new ErrorHandler(this);
            this.byId("shiftCb").setSelectedKey("onlyDay");
            //this.byId("PC1").setShowViewSelection(false)
                let downtimesCalendarItems = [ ];

                let modelData = {   productionItems: [],
                                    downTimesCategories: [],
                                    downtimesCalendarItems: downtimesCalendarItems,
                                    productionAggregated: [],
                                    productionUnAggregated: [],
                                    availabilityPercentage: 0,
                                    targetPercentage: 95  };
                oModel.setData(modelData);
                this.getView().setModel(oModel);

		},      
    onBeforeRendering: async function () {   
      this.setWorkCenterText();
    },
		onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);
      this.unsubscribe("PodSelectionChangeEvent", this.setWorkCenterText, this);
      this.unsubscribe("WorklistSelectEvent", this.setWorkCenterText, this);
		},
    onBeforeRenderingPlugin: function () {
      this.subscribe("PodSelectionChangeEvent", this.setWorkCenterText, this);
      this.subscribe("WorklistSelectEvent", this.setWorkCenterText, this);
    },
    setWorkCenterText: function(){
      let oPodSelectionModel = this.getPodSelectionModel();
      this.byId("workCenterText").setHtmlText(`<h3><strong>${oPodSelectionModel.workCenter||''}</strong></h3>`);
    },
    onStart: async function(){
      try{
        PodTools.setCustomBusyIndicator(true);
        let date  = this.byId("datePicker").getDateValue();
        let oPodSelectionModel = this.getPodSelectionModel();
        let oPodController = this.getPodController();

        let selectedShift = this.byId("shiftCb").getSelectedKey();
        let selectedOrder = this.byId("orderNumber").getValue();

        let productionReportModel = new ProductionReportModel(this, {
              plant: oPodController.getUserPlant(),
              workCenter: oPodSelectionModel.workCenter,
              resource: oPodSelectionModel.resource.resource,
              date: date,
              orderNumber: selectedOrder,
              shiftNumber: selectedShift
        });
        let reportData = await productionReportModel.getReportData();
        //reportData.shiftDates.viewKey

        let oDate = new Date(reportData.shiftDates.startDate.getTime());
        this.byId("PC1").setMinDate(null); 
        this.byId("PC1").setMaxDate(null); 

        this.byId("PC1").setViewKey(reportData.shiftDates.viewKey);
        this.byId("PC1").setStartDate(oDate); 
        this.byId("PC1").setMinDate(oDate); 
        this.byId("PC1").setMaxDate(oDate); 
        console.log("viewKey:", this.byId("PC1").getViewKey());
        console.log("startDate:", this.byId("PC1").getStartDate());

        let model = this.getView().getModel();
        let modelData = model.getData();
        modelData.downTimesCategories = reportData.downtimesCategories;
        modelData.downtimesCalendarItems = reportData.dataModel;
        modelData.availabilityPercentage = reportData.availabilityPercentage;
        modelData.targetPercentage = reportData.targetPercentage;
        modelData.productionAggregated = reportData.productionAggregated;
        modelData.productionUnAggregated = reportData.productionUnAggregated;
        modelData.shiftComments = reportData.shiftComments;

        
        model.setData(modelData);
        this.getView().setModel(model);
        this.onAggregationChange();
        PodTools.setCustomBusyIndicator(false);
      }catch(error){
        PodTools.setCustomBusyIndicator(false);
        this._errorHandler.handleError(error);
      }

    },
    onAggregationChange: function(){
      let model = this.getView().getModel();
      let modelData = model.getData();
      let selectedKey = this.byId("aggregationFilter").getSelectedKey();
      if(selectedKey==="no"){
        modelData.productionItems = modelData.productionUnAggregated;
      }else{
        modelData.productionItems = modelData.productionAggregated;
      }
      model.setData(modelData);
      this.getView().setModel(model);
    },
    formatLegendBox: function (categoryName, color) {
      if (categoryName === "TOTAL") {
        return "";
      }

      return "<span style='display:inline-block;" +
        "width:12px;height:12px;" +
        "background:" + color + ";" +
        "border:1px solid rgba(0,0,0,.2);" +
        "border-radius:2px;" +
        "margin-right:8px;vertical-align:middle;'></span>";
    },
    onSearch: function(){
            try{
                const oBinding = this.byId("componentsTable").getBinding("items");

                let sQuery = this.byId("searchField").getValue();

                if (!sQuery) {
                    oBinding.filter([]);
                    return;
                }

                const searchFilters =   [ new sap.ui.model.Filter("productionDate", sap.ui.model.FilterOperator.Contains, sQuery),
                                          new sap.ui.model.Filter("shift", sap.ui.model.FilterOperator.Contains, sQuery),
                                          new sap.ui.model.Filter("orderNumber", sap.ui.model.FilterOperator.Contains, sQuery),
                                          new sap.ui.model.Filter("itemNumber", sap.ui.model.FilterOperator.Contains, sQuery),
                                          new sap.ui.model.Filter("material", sap.ui.model.FilterOperator.Contains, sQuery),
                                          new sap.ui.model.Filter("q1Quantity", sap.ui.model.FilterOperator.Contains, sQuery),
                                          new sap.ui.model.Filter("q23Quantity", sap.ui.model.FilterOperator.Contains, sQuery)];
                                      
                
                const aFilters = [];
                aFilters.push(new sap.ui.model.Filter({ filters: searchFilters, and: false }));
                oBinding.filter(aFilters);
            }catch(error){
            }
    },
    handleDTSelect: function(oEvent){
				var selectedDownTime = oEvent.getParameter("appointment");
        var oView = this.getView();
        if(!selectedDownTime){
          return;
        }

				if (!selectedDownTime.getSelected() && this._pDetailsPopover) {
					this._pDetailsPopover.then(function(oDetailsPopover){
						oDetailsPopover.close();
					});
					return;
				}

				if (!this._pDetailsPopover) {
					this._pDetailsPopover = Fragment.load({
						id: oView.getId(),
						name: "ibc.dm.plugins.vPlgProductionReport.vPlgProductionReport.view.Details",
						controller: this
					}).then(function(oDetailsPopover){
						oView.addDependent(oDetailsPopover);
						return oDetailsPopover;
					});
				}

				this._pDetailsPopover.then(function(oDetailsPopover){
					this._setDetailsDialogContent(selectedDownTime, oDetailsPopover);
				}.bind(this));
    },

    _setDetailsDialogContent: function(downTime, oDetailsPopover){
				oDetailsPopover.setBindingContext(downTime.getBindingContext());
				oDetailsPopover.openBy(downTime);
		},
    handleClosePopup: function(){
      var oDetailsPopover = this.byId("detailsPopover");
      oDetailsPopover.close();
    },
    formatDate: function(oDate){
				if(oDate) {
					var iHours = oDate.getHours(),
						iMinutes = oDate.getMinutes(),
						iSeconds = oDate.getSeconds();

					if (iHours !== 0 || iMinutes !== 0 || iSeconds !== 0) {
						return DateFormat.getDateTimeInstance({ style: "medium" }).format(oDate);
					} else  {
						return DateFormat.getDateInstance({ style: "medium" }).format(oDate);
					}
				}
    }
	});
});