sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginControllerExtension",
    "sap/ui/core/mvc/OverrideExecution",
    "sap/dm/dme/podfoundation/controller/extensions/LifecycleExtensionConstants",
    "sap/base/util/uid"
], function (PluginControllerExtension, OverrideExecution, LifecycleConstants, uid) {
    "use strict";

    return PluginControllerExtension.extend("ibc.dm.plugins.sfcCardExtensionProvider.LifecycleExtension", {
        constructor: function (oExtensionUtilities, oSfcCardUtility) {
            this._oExtensionUtilities = oExtensionUtilities;
            this._oSfcCardUtility = oSfcCardUtility;
            this._bInitialized = false;
            this._bRendered = false;
            this._sInstanceId = uid();
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
            if (!this._bInitialized) {
                debugger;
                this._oSfcCardUtility.getPluginEventExtension().updateCustomData();
                this._bInitialized = true;
            }
            let sPluginId = "";
            if (this.getController()) {
                sPluginId = this.getController().getPluginId();
            }
        },

        onBeforeRenderingPlugin: function(oEvent){
        },

        onAfterRendering: function(oEvent){
            if (this._bRendered) {
                // already rendered, exit
                this._oSfcCardUtility.checkPluginContent();
                return;
            }
            this._bRendered = true;
            debugger;
            var that = this;
            // that._oSfcCardUtility.loadHeaderInformation(true, true);
            // that._oSfcCardUtility.loadHeaderInformation(true, true);
            setTimeout(function() {
                // delay to allow core view to render before modifying
                that._oSfcCardUtility.loadHeaderInformation(true, true);
            }, 2500);
        },

        onExit: function(oEvent){
        },
    })
});