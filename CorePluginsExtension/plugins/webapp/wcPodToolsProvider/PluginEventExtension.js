sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginControllerExtension",
    "sap/ui/core/mvc/OverrideExecution",
    "sap/dm/dme/plugins/wcPodSelectionPlugin/controller/extensions/PluginEventExtensionConstants"
], function (PluginControllerExtension, OverrideExecution, PluginEventConstants) {
    "use strict";

    return PluginControllerExtension.extend("ibc.dm.plugins.wcPodToolsProvider.PluginEventExtension", {
        constructor: function () {
        },

        getOverrideExecution: function(sOverrideMember) {
            if (sOverrideMember === PluginEventConstants.ON_FILTER_CHANGE_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_OPERATION_CHANGE_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_WORKLIST_SELECTION_CHANGE_EVENT) {
                return OverrideExecution.After;
            } else if (sOverrideMember === PluginEventConstants.ON_CLEAR_FILTER_BAR) {
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
            return PluginEventConstants.EXTENSION_NAME;
        },

        onFilterChangeEvent: function(sEvent, oData){
        },

        onOperationChangeEvent: function(oEvent){
        },

        onWorklistSelectionChangeEvent: function(oData){
        },

        onClearFilterBar: function(oData){
        }
    })
});