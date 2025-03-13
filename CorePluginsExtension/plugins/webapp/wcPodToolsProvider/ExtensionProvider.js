sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginExtensionProvider",
    "ibc/dm/plugins/wcPodToolsProvider/LifecycleExtension",
    "ibc/dm/plugins/wcPodToolsProvider/PluginEventExtension",
    "ibc/dm/plugins/wcPodToolsProvider/PropertyEditorExtension",
    "ibc/dm/plugins/wcPodToolsProvider/PalleteQueueHandler"
    // "ibc/dm/plugins/utils/ExtensionUtilities",
    // "ibc/dm/plugins/utils/PodSelectionExtensionUtility"
], function (PluginExtensionProvider, LifecycleExtension, PluginEventExtension, 
             PropertyEditorExtension, PalleteQueueHandler) {
    "use strict";
    return PluginExtensionProvider.extend("ibc.dm.plugins.wcPodToolsProvider.ExtensionProvider", {
        constructor: function () {
            // this.oExtensionUtilities = new ExtensionUtilities();
            // this.oExtensionUtility = new ExtensionUtility();
        },
        getExtensions: function () {
            let oLifecycleExtension = new LifecycleExtension();
            let oPluginEventExtension = new PluginEventExtension();
            let oPropertyEditorExtension = new PropertyEditorExtension();

            return [oLifecycleExtension, oPluginEventExtension, oPropertyEditorExtension];
        }
    })
});