sap.ui.define([
  'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
  "sap/ui/core/date/UI5Date",
  "ibc/dm/plugins/wcPodToolsProvider/ProductionReport/ProductionReportModel",
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


                let downTimesCategories = [ { categoryName: "PRODUCTION",
                                              categoryDescription: "Produkcyjne",
                                              value: "0" },
                                            { categoryName: "INDEPENDENT",
                                              categoryDescription: "Niezależne",
                                              value: "0" },
                                            { categoryName: "CHANGEOVER",
                                              categoryDescription: "Przezbrojenie",
                                              value: "0" },
                                            { categoryName: "ECONOMIC_DOWN",
                                              categoryDescription: "Ekonomiczne",
                                              value: "0" },
                                            { categoryName: "REPAIRS",
                                              categoryDescription: "Naprawa",
                                              value: "0" },
                                            { categoryName: "TECHNICAL",
                                              categoryDescription: "Techniczne",
                                              value: "0" },
                                            { categoryName: "TECHNOLOGICAL",
                                              categoryDescription: "Technologiczne",
                                              value: "0" },
                                            { categoryName: "LOGISTICS",
                                              categoryDescription: "Logistyczne",
                                              value: "0" },
                                            { categoryName: "TOTAL",
                                              categoryDescription: "<strong>Łącznie</strong>",
                                              value: "<strong>0</strong>" },
                 ];
                let productionItems = [ { productionDate: "2026-02-20",
                                        shift: "",
                                         q1Quantity: "6000 SZT\n6000 M2\n3600 M3",
                                         q23Quantity: "150SZT/144M2/240M3 - Q3 - Wady cięcia\n400SZT/400M2/500M3 - Q2 - Zsiwienia / Niezamknięta powierzchnia",
                                         material: "34800573\nD_S 434 P2 CARB2-fsc 2xPB0021MT R4 16x56",
                                         kpiQ1: "",
                                         kpiQ1Visible: false,
                                         kpiM23: "",
                                         kpiM23Visible: true,
                                         itemNumber: "1",
                                         orderNumber: "3664551"},
                                        { productionDate: "2026-02-20",
                                         shift: "1",
                                         q1Quantity: "2000 SZT\n2000 M2\n1200 M3",
                                         q23Quantity: "75SZT/72M2/120M3 - Q3 - Wady cięcia\n200SZT/200M2/250M3 - Q2 - Zsiwienia / Niezamknięta powierzchnia - zwrot NPW",
                                         material: "34800573\nD_S 434 P2 CARB2-fsc 2xPB0021MT R4 16x56",
                                         kpiQ1: "",
                                         kpiQ1Visible: false,
                                         kpiM23: "",
                                         kpiM23Visible: false,
                                         itemNumber: "1",
                                         orderNumber: "3664551"},
                                         { productionDate: "2026-02-20",
                                         shift: "2",
                                         q1Quantity: "2000 SZT\n2000 M2\n1200 M3",
                                         q23Quantity: "200SZT/100M2/120M3 - Q2 - Wady szlifowania - Zwrot\n200SZT/100M2/120M3 - Q3 - Zsiwienia / Niezamknięta powierzchnia",
                                         material: "34800573\nD_S 434 P2 CARB2-fsc 2xPB0021MT R4 16x56",
                                         kpiQ1: "",
                                         kpiQ1Visible: false,
                                         kpiM23: "",
                                         kpiM23Visible: true,
                                         itemNumber: "1",
                                         orderNumber: "3664551"},
                                         { productionDate: "2026-02-20",
                                        shift: "3",
                                         q1Quantity: "2000 SZT\n2000 M2\n1200 M3",
                                         q23Quantity: "",
                                         material: "34800573\nD_S 434 P2 CARB2-fsc 2xPB0021MT R4 16x56",
                                         kpiQ1: "",
                                         kpiQ1Visible: false,
                                         kpiM23: "",
                                         kpiM23Visible: true,
                                         itemNumber: "1",
                                         orderNumber: "3664551"},
                                        
                                        
                                        
                                        
                                        ];
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
        onAfterRendering: function(){
           

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
           
            var sMessage = "Message not found in payload 'message' property";
            if (oMsg && oMsg.parameters && oMsg.parameters.length > 0) {
                for (var i = 0; i < oMsg.parameters.length; i++) {

                    switch (oMsg.parameters[i].name){
                        case "template":
                            
                            break;
                        case "template2":
                            
                        
                        }        
          

                    
                }
            }

        },
        

		onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);


		},
    onStart: async function(){
      try{
        PodTools.setCustomBusyIndicator(true);
        let date  = this.byId("datePicker").getDateValue();
        let oPodSelectionModel = this.getPodSelectionModel();
        let oPodController = this.getPodController();

        let selectedShift = this.byId("shiftCb").getSelectedKey();

        let productionReportModel = new ProductionReportModel(this, {
              plant: oPodController.getUserPlant(),
              workCenter: oPodSelectionModel.workCenter,
              resource: oPodSelectionModel.resource.resource,
              date: date,
              orderNumber: "",
              shiftNumber: selectedShift
        });
        let reportData = await productionReportModel.getReportData();
        //reportData.shiftDates.viewKey

        let oDate = new Date(reportData.shiftDates.startDate.getTime());
        debugger;
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
      debugger;
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
                                            
                // if (!isNaN(sQuery)) {
                //     searchFilters.push(new sap.ui.model.Filter("quantity", sap.ui.model.FilterOperator.EQ, Number(sQuery)));
                // } 

                
                const aFilters = [];
                aFilters.push(new sap.ui.model.Filter({ filters: searchFilters, and: false }));
                oBinding.filter(aFilters);
            }catch(error){
                debugger;
            }
    },
    handleDTSelect: function(oEvent){
				var selectedDownTime = oEvent.getParameter("appointment");
        var oView = this.getView();
        debugger;
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