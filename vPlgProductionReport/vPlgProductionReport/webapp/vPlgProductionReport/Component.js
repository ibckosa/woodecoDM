sap.ui.define([
	"sap/dm/dme/podfoundation/component/production/ProductionUIComponent",
	"sap/ui/Device"
], function (ProductionUIComponent, Device) {
	"use strict";

	return ProductionUIComponent.extend("ibc.dm.plugins.vPlgProductionReport.vPlgProductionReport.Component", {
		metadata: {
			manifest: "json"
		}
	});
});