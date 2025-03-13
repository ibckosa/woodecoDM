sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginControllerExtension",
    "sap/ui/core/mvc/OverrideExecution",
    "sap/dm/dme/podfoundation/controller/extensions/LifecycleExtensionConstants",
	"sap/ui/model/json/JSONModel",
    "sap/dm/dme/podfoundation/util/PodUtility"
], function (PluginControllerExtension, OverrideExecution, LifecycleConstants, JSONModel, PodUtility) {
    "use strict";

    return PluginControllerExtension.extend("ibc.dm.plugins.wcPodToolsProvider.LifecycleExtension", {
        constructor: function () {
        },
     
        getOverrideExecution: function(sOverrideMember) {
            if (sOverrideMember === LifecycleConstants.ON_BEFORE_RENDERING) {
                return OverrideExecution.After;
            } else if (sOverrideMember === LifecycleConstants.ON_BEFORE_RENDERING_PLUGIN) {
                return OverrideExecution.After;
            } else if (sOverrideMember === LifecycleConstants.ON_AFTER_RENDERING) {
                return OverrideExecution.After;
            } else if (sOverrideMember === LifecycleConstants.ON_EXIT) {
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
            return LifecycleConstants.EXTENSION_NAME;
        },

        onBeforeRendering: function(oEvent){
        },

        onBeforeRenderingPlugin: function(oEvent){
        },

        onAfterRendering: function(oEvent){
        },

        onExit: function(oEvent){
        },

		onHelpPress: function (oEvent) {
		},

		onCustomFilterPress: function (oEvent) {
		}
    })
});