sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginExtensionProvider",
    "ibc/dm/plugins/changeEquipmentStatusExtensionProvider/PluginEventExtension",
    "ibc/dm/plugins/changeEquipmentStatusExtensionProvider/PluginLifecycleExtension",
    "ibc/dm/plugins/changeEquipmentStatusExtensionProvider/PropertyEditorExtension",
    "ibc/dm/plugins/changeEquipmentStatusExtensionProvider/ExtensionUtilities"
], function (PluginExtensionProvider, PluginEventExtension, PluginLifecycleExtension, PropertyEditorExtension, ExtensionUtilities) {
    "use strict";

    return PluginExtensionProvider.extend("ibc.dm.plugins.changeEquipmentStatusExtensionProvider.ExtensionProvider", {
        constructor: function () {
            this.oExtensionUtilities = new ExtensionUtilities();
        },

        getExtensions: function () {
           return [
               new PluginEventExtension(this.oExtensionUtilities),
               new PluginLifecycleExtension(this.oExtensionUtilities),
               new PropertyEditorExtension(this.oExtensionUtilities)
           ];
        }
    })
});