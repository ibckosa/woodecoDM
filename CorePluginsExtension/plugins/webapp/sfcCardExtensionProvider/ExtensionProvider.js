sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginExtensionProvider",
    "ibc/dm/plugins/sfcCardExtensionProvider/LifecycleExtension",
    "ibc/dm/plugins/sfcCardExtensionProvider/PluginEventExtension",
    "ibc/dm/plugins/sfcCardExtensionProvider/PropertyEditorExtension",
    "ibc/dm/plugins/utils/ExtensionUtilities",
    "ibc/dm/plugins/sfcCardExtensionProvider/SfcCardUtility"
], function (PluginExtensionProvider, LifecycleExtension, PluginEventExtension, 
             PropertyEditorExtension, ExtensionUtilities, SfcCardUtility) {
    "use strict";
    return PluginExtensionProvider.extend("ibc.dm.plugins.sfcCardExtensionProvider.ExtensionProvider", {
        constructor: function () {
            this.oExtensionUtilities = new ExtensionUtilities();
            this.oSfcCardUtility = new SfcCardUtility();
        },
        getExtensions: function () {
            let oLifecycleExtension = new LifecycleExtension(this.oExtensionUtilities, this.oSfcCardUtility);
            let oPluginEventExtension = new PluginEventExtension(this.oExtensionUtilities);
            this.oSfcCardUtility.setPluginEventExtension(oPluginEventExtension);
            let oPropertyEditorExtension = new PropertyEditorExtension(this.oExtensionUtilities);
            return [oLifecycleExtension, oPluginEventExtension, oPropertyEditorExtension];
        }
    })
});