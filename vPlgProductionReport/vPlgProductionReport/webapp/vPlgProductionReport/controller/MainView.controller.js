sap.ui.define([
  'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
  "sap/ui/core/date/UI5Date",
  "ibc/dm/plugins/wcPodToolsProvider/ProductionReport/ProductionReportProductionData"
], function (jQuery, PluginViewController, JSONModel, UI5Date) {
	"use strict";

	return PluginViewController.extend("ibc.dm.plugins.vPlgProductionReport.vPlgProductionReport.controller.MainView", {
		onInit: function () {
			PluginViewController.prototype.onInit.apply(this, arguments);
            this.byId("PC1").setStartDate(new Date(2026, 1, 18, 22, 0, 0)); 
            this.byId("PC1").setMinDate(new Date(2026, 1, 18, 22, 0, 0)); 
            this.byId("PC1").setMaxDate(new Date(2026, 1, 18, 22, 0, 0)); 
            var oModel = new JSONModel();
            this.byId("PCLegend").setStandardItems([]); 
	// oModel.setData({
	// 				people: [{
	// 					pic: "",
	// 					name: "P2_KT11",
	// 					role: "",
	// 					appointments: [
	// 						{
	// 							start: UI5Date.getInstance("2026", "1", "19", "08", "30"),
	// 							end: UI5Date.getInstance("2026", "1", "19", "09", "30"),
	// 							title: "Przestój planowany",
	// 							type: "Type02",
	// 							tentative: true
	// 						}
	// 					],
	// 					headers: []
	// 				}
	// 				]
	// 			});
				


                let downTimesCategories = [ { categoryName: "PRODUCTION",
                                              categoryDescription: "Produkcyjne",
                                              value: "10" },
                                            { categoryName: "INDEPENDENT",
                                              categoryDescription: "Niezależne",
                                              value: "20" },
                                            { categoryName: "CHANGEOVER",
                                              categoryDescription: "Przezbrojenie",
                                              value: "30" },
                                            { categoryName: "ECONOMIC_DOWN",
                                              categoryDescription: "Ekonomiczne",
                                              value: "40" },
                                            { categoryName: "REPAIRS",
                                              categoryDescription: "Naprawa",
                                              value: "50" },
                                            { categoryName: "TECHNICAL",
                                              categoryDescription: "Techniczne",
                                              value: "60" },
                                            { categoryName: "TECHNOLOGICAL",
                                              categoryDescription: "Technologiczne",
                                              value: "70" },
                                            { categoryName: "LOGISTICS",
                                              categoryDescription: "Logistyczne",
                                              value: "80" },
                                            { categoryName: "TOTAL",
                                              categoryDescription: "<strong>Łącznie</strong>",
                                              value: "<strong>255</strong>" },
                 ];
                let productionItems = [ { productionDateTime: "2026-02-20",
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
                                        { productionDateTime: "2026-02-20",
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
                                         { productionDateTime: "2026-02-20",
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
                                         { productionDateTime: "2026-02-20",
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
                let downtimesCalendarItems = [ { pic: "",
                                                 name: "P2_KT11",
                                                 role: "",
                                                 items: [{ start: UI5Date.getInstance("2026", "1", "19", "08", "30"),
                                                           end: UI5Date.getInstance("2026", "1", "19", "09", "30"),
                                                           categoryName: "TECHNOLOGICAL",
                                                           categoryDescription: "",
                                                           type: "Type01",
                                                           tentative: false },
                                                          { start: UI5Date.getInstance("2026", "1", "19", "10", "31"),
                                                           end: UI5Date.getInstance("2026", "1", "19", "11", "30"),
                                                           categoryName: "TECHNOLOGICAL",
                                                           categoryDescription: "",
                                                           type: "Type18",
                                                           tentative: false },
                                                          { start: UI5Date.getInstance("2026", "1", "19", "12", "31"),
                                                           end: UI5Date.getInstance("2026", "1", "19", "13", "29"),
                                                           categoryName: "TECHNOLOGICAL",
                                                           type: "Type02",
                                                           tentative: false },
                                                          { start: UI5Date.getInstance("2026", "1", "19", "16", "31"),
                                                           end: UI5Date.getInstance("2026", "1", "19", "17", "29"),
                                                           categoryName: "TECHNOLOGICAL",
                                                           categoryDescription: "",
                                                           type: "Type10",
                                                           tentative: false },
                                                          { start: UI5Date.getInstance("2026", "1", "19", "18", "31"),
                                                           end: UI5Date.getInstance("2026", "1", "19", "19", "29"),
                                                           categoryName: "TECHNOLOGICAL",
                                                           categoryDescription: "",
                                                           type: "Type07",
                                                           tentative: false },
                                                          { start: UI5Date.getInstance("2026", "1", "19", "19", "31"),
                                                           end: UI5Date.getInstance("2026", "1", "19", "20", "29"),
                                                           categoryName: "TECHNOLOGICAL",
                                                           categoryDescription: "",
                                                           type: "Type06",
                                                           tentative: false },
                                                          { start: UI5Date.getInstance("2026", "1", "19", "20", "31"),
                                                           end: UI5Date.getInstance("2026", "1", "19", "21", "29"),
                                                           categoryName: "TECHNOLOGICAL",
                                                           categoryDescription: "",
                                                           type: "Type05",
                                                           tentative: false },
                                                          { start: UI5Date.getInstance("2026", "1", "19", "1", "31"),
                                                           end: UI5Date.getInstance("2026", "1", "19", "2", "29"),
                                                           categoryName: "TECHNOLOGICAL",
                                                           categoryDescription: "",
                                                           type: "Type19",
                                                           tentative: false }
                                                             ]}];

                let modelData = {   productionItems: productionItems,
                                    downTimesCategories: downTimesCategories,
                                    downtimesCalendarItems: downtimesCalendarItems };
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


		}
	});
});