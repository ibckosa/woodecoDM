sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginExtensionProvider",
    "ibc/dm/plugins/componentListExtensionProvider/LifecycleExtension",
    "ibc/dm/plugins/componentListExtensionProvider/PluginEventExtension",
    "ibc/dm/plugins/componentListExtensionProvider/PropertyEditorExtension",
    "ibc/dm/plugins/utils/ExtensionUtilities"
], function (PluginExtensionProvider, LifecycleExtension, PluginEventExtension, 
             PropertyEditorExtension, ExtensionUtilities) {
    "use strict";
    return PluginExtensionProvider.extend("ibc.dm.plugins.componentListExtensionProvider.ExtensionProvider", {
        constructor: function () {
            this.oExtensionUtilities = new ExtensionUtilities();
        },
        getExtensions: function () {
            let pluginEventExtension =  new PluginEventExtension(this.oExtensionUtilities);
            let lifeCycleExtension = new LifecycleExtension(this.oExtensionUtilities, pluginEventExtension);


           return [
               lifeCycleExtension,
               pluginEventExtension,
               new PropertyEditorExtension(this.oExtensionUtilities)
           ];
           
        }
    })
});