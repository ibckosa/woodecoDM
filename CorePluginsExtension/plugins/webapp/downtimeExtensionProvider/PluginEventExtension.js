sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginControllerExtension",
    "sap/ui/core/mvc/OverrideExecution",
    "sap/dm/dme/oeetransactionplugins/downtimePlugin/controller/extensions/PluginEventExtensionConstants",
    "sap/ui/core/Fragment"
], function (PluginControllerExtension, OverrideExecution, PluginEventConstants, Fragment) {
    "use strict";

    const oOverrideExecution = {
        onGetReasonCodeDialogFragment: OverrideExecution.Instead,
        onReasonCodeDialogOpen: OverrideExecution.After,
        onReasonCodeDialogDataUpdate: OverrideExecution.After,
        onReasonCodeDialogSave: OverrideExecution.Instead,
        onReasonCodeDialogReset: OverrideExecution.Instead
    };

    const oTopLevelBreadcrumb = {
        description: "Top"
    };

    return PluginControllerExtension.extend("ibc.dm.plugins.downtimeExtensionProvider.PluginEventExtension", {
        constructor: function(oExtensionUtilities) {
            this._oExtensionUtilities = oExtensionUtilities;
        },

        getOverrideExecution: function(sOverrideMember) {
            return null;
            if (oOverrideExecution.hasOwnProperty(sOverrideMember)) {
                return oOverrideExecution[sOverrideMember];
            }
            
        },

        getExtensionName: function() {
            return PluginEventConstants.EXTENSION_NAME;
        },

        onGetReasonCodeDialogFragment: function(sId, sFragment, oContext) {
            return;
            // use the default id, but override the fragment and controller
            return Fragment.load({
                id: sId,
                name: "ibc.dm.plugins.downtimeExtensionProvider.fragment.CustomReasonCodeDialog",
                controller: this
            });
        },

        onReasonCodeDialogOpen: function(oDialog) {
            return;
            if (!this.mExtensionData) {
                this.mExtensionData = new sap.ui.model.json.JSONModel();
                oDialog.setModel(this.mExtensionData, "extensionData");
            }
            if (!this.mBreadcrumbs) {
                this.mBreadcrumbs = new sap.ui.model.json.JSONModel([ oTopLevelBreadcrumb ]);
                oDialog.setModel(this.mBreadcrumbs, "breadcrumbs");
            }
        },

        onReasonCodeDialogDataUpdate: function(oDataModel) {
            return;
            this.mData = oDataModel;
            let aReasonCodes = oDataModel.getProperty("/timeElementReasonCodeTree");
            this.mExtensionData.setData(aReasonCodes);
        },

        onReasonCodeDialogSave: function(oReasonCode) {
            return;
            let oPromise = this.getController().getReasonCodeDialogPromise();
            oPromise.resolve({
                description: oReasonCode.description,
                ref: oReasonCode.reasonCodeHandle
            });

            this.getController().getReasonCodeSelectionDialog().close();
            this.onReasonCodeDialogReset();
        },

        onReasonCodeDialogReset: function() {
            return;
            this.mExtensionData.setData([]);
            this.mBreadcrumbs.setData([ oTopLevelBreadcrumb ]);
        },

        /* -------------------------------- */
        /* Start - Fragment event listeners */
        /* -------------------------------- */

        onSelectBreadcrumb: function(oEvent) {
            return;
            let oListItem = oEvent.getParameter("listItem");
            oListItem.setSelected(false);
            let oContext = oListItem.getBindingContext("breadcrumbs");
            let mBreadcrumbs = oContext.getModel();
            let oReasonCode = mBreadcrumbs.getProperty(oContext.getPath());

            let mExtensionData = this.getController().getReasonCodeSelectionDialog().getModel("extensionData");
            if (oReasonCode === oTopLevelBreadcrumb) {
                mExtensionData.setData(this.mData.getProperty("/timeElementReasonCodeTree"));
                mBreadcrumbs.setData([ oTopLevelBreadcrumb ]);
            } else {
                // trim breadcrumbs to selected item
                let iIndex = Number(oContext.getPath().substr(1));
                mBreadcrumbs.getData().length = iIndex + 1;
                mBreadcrumbs.refresh();
                mExtensionData.setData(oReasonCode.timeElementReasonCodeTree);
            }
        },

        onSelectReasonCode: function(oEvent) {
            return;
            let oListItem = oEvent.getParameter("listItem");
            oListItem.setSelected(false);
            let oContext = oListItem.getBindingContext("extensionData");
            let mExtensionData = oContext.getModel();
            let oReasonCode = mExtensionData.getProperty(oContext.getPath());

            // if this isn't the end of a branch, navigate deeper
            if (oReasonCode.hasOwnProperty("timeElementReasonCodeTree")) {
                let mBreadcrumbs = this.getController().getReasonCodeSelectionDialog().getModel("breadcrumbs");
                mBreadcrumbs.getData().push(oReasonCode);
                mBreadcrumbs.refresh();
                mExtensionData.setData(oReasonCode.timeElementReasonCodeTree);
            } else {
                this.onReasonCodeDialogSave(oReasonCode);
            }
        },

        onClickCancel: function() {
            this.getController().onReasonCodeDialogCancel();
        }

        /* ------------------------------ */
        /* End - Fragment event listeners */
        /* ------------------------------ */
    })
});