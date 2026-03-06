sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ProductionReport/ProductionReportProductionData",
    "ibc/dm/plugins/wcPodToolsProvider/ProductionReport/ProductionReportDowntimeData"
], function (ObjectUI5, ProductionReportProductionData, ProductionReportDowntimeData) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.ProductionReport.ProductionReportModel", {
        constructor: function(controller, parameters){
            this._controller = controller;
            this._parameters = parameters;
        },
        getReportData: async function(){
            
        }
    });
});