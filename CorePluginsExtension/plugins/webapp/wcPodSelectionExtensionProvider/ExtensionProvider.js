sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginExtensionProvider",
    "ibc/dm/plugins/wcPodSelectionExtensionProvider/LifecycleExtension",
    "ibc/dm/plugins/wcPodSelectionExtensionProvider/PluginEventExtension",
    "ibc/dm/plugins/wcPodSelectionExtensionProvider/PropertyEditorExtension",
    "ibc/dm/plugins/utils/ExtensionUtilities",
    "ibc/dm/plugins/utils/PodSelectionExtensionUtility"
], function (PluginExtensionProvider, LifecycleExtension, PluginEventExtension, 
             PropertyEditorExtension, ExtensionUtilities, ExtensionUtility) {
    "use strict";
    return PluginExtensionProvider.extend("ibc.dm.plugins.wcPodSelectionExtensionProvider.ExtensionProvider", {
        constructor: function () {
            this.oExtensionUtilities = new ExtensionUtilities();
            this.oExtensionUtility = new ExtensionUtility();
        },
        getExtensions: function () {
            let oLifecycleExtension = new LifecycleExtension(this.oExtensionUtilities, this.oExtensionUtility);
            let oPluginEventExtension = new PluginEventExtension(this.oExtensionUtilities, this.oExtensionUtility);
            this.oExtensionUtility.setPluginEventExtension(oPluginEventExtension);
            let oPropertyEditorExtension = new PropertyEditorExtension(this.oExtensionUtilities);
            return [oLifecycleExtension, oPluginEventExtension, oPropertyEditorExtension];
        }
    })
});