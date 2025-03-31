sap.ui.define([
	"sap/dm/dme/podfoundation/component/production/ProductionUIComponent",
	"sap/ui/Device"
], function (ProductionUIComponent, Device) {
	"use strict";

	return ProductionUIComponent.extend("ibc.dm.plugins.vPlgFileViewer.vPlgFileViewer.Component", {
		metadata: {
			manifest: "json"
		}
	});
});