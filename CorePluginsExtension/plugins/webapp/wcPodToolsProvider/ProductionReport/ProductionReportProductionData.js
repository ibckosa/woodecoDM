sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.ProductionReport.ProductionReportProductionData", {
        constructor: function(controller, parameters){
            this._controller = controller;
        }
    });
});