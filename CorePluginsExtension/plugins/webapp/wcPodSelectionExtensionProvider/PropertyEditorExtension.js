sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginPropertyEditorExtension"
], function (PluginPropertyEditorExtension) {
    "use strict";

    return PluginPropertyEditorExtension.extend("ibc.dm.plugins.wcPodSelectionExtensionProvider.PropertyEditorExtension", {
        constructor: function (oExtensionUtilities) {
            this._oExtensionUtilities = oExtensionUtilities;
        },

        /*
         * Function to override to add content before core properties
         *
         * @param {sap.ui.layout.form.SimpleForm} oPropertyFormContainer Form to add controls to
         * @param {object} oPropertyData Defined Property Data
         * @override
         */
        addPropertyEditorContentBefore: function (oPropertyFormContainer, oPropertyData) {
            let oPropertyEditor = this.getController();
            if (oPropertyEditor) {
                let oSwitch = oPropertyEditor.addSwitch(oPropertyFormContainer, "logToConsole", oPropertyData);
                let iIndex = oPropertyFormContainer.indexOfContent(oSwitch);
                let aContent = oPropertyFormContainer.getContent();
                let oLabel = null;
                if (aContent[iIndex-1].setText) {
                    oLabel = aContent[iIndex-1];
                    oLabel.setText("Log to console");
                }

                oSwitch = oPropertyEditor.addSwitch(oPropertyFormContainer, "showHelp", oPropertyData);
                iIndex = oPropertyFormContainer.indexOfContent(oSwitch);
                aContent = oPropertyFormContainer.getContent();
                if (aContent[iIndex-1].setText) {
                    oLabel = aContent[iIndex-1];
                    oLabel.setText("Show Help");
                }

                oSwitch = oPropertyEditor.addSwitch(oPropertyFormContainer, "showFilter", oPropertyData);
                iIndex = oPropertyFormContainer.indexOfContent(oSwitch);
                aContent = oPropertyFormContainer.getContent();
                if (aContent[iIndex-1].setText) {
                    oLabel = aContent[iIndex-1];
                    oLabel.setText("Show Filter");
                }

                let oInput = oPropertyEditor.addInputField(oPropertyFormContainer, "zweiURL", oPropertyData);
                iIndex = oPropertyFormContainer.indexOfContent(oInput);
                aContent = oPropertyFormContainer.getContent();
                if (aContent[iIndex-1].setText) {
                    oLabel = aContent[iIndex-1];
                    oLabel.setText("URL endpoit to ZWEI integration");
                }

                oInput = oPropertyEditor.addInputField(oPropertyFormContainer, "dummyOrder", oPropertyData);
                iIndex = oPropertyFormContainer.indexOfContent(oInput);
                aContent = oPropertyFormContainer.getContent();
                if (aContent[iIndex-1].setText) {
                    oLabel = aContent[iIndex-1];
                    oLabel.setText("Dummy order number");
                }
                oInput = oPropertyEditor.addInputField(oPropertyFormContainer, "dummySfc", oPropertyData);
                iIndex = oPropertyFormContainer.indexOfContent(oInput);
                aContent = oPropertyFormContainer.getContent();
                if (aContent[iIndex-1].setText) {
                    oLabel = aContent[iIndex-1];
                    oLabel.setText("Dummy sfc number");
                }
                oInput = oPropertyEditor.addInputField(oPropertyFormContainer, "printerEndPoint", oPropertyData);
                iIndex = oPropertyFormContainer.indexOfContent(oInput);
                aContent = oPropertyFormContainer.getContent();
                if (aContent[iIndex-1].setText) {
                    oLabel = aContent[iIndex-1];
                    oLabel.setText("Endpoint for printing");
                }


            }
        },

        /*
         * Function to override to add content after core properties
         *
         * @param {sap.ui.layout.form.SimpleForm} oPropertyFormContainer Form to add controls to
         * @param {object} oPropertyData Defined Property Data
         * @override
         */
        addPropertyEditorContentAfter: function (oPropertyFormContainer, oPropertyData) {
            this._oExtensionUtilities.logMessage("PropertyEditorExtension.addPropertyEditorContentAfter: WC POD Selection extension");
        },

        /*
         * Function to override to add custom default property values to core property data
         *
         * @param {object} oPropertyData Defined Property Data
         * @returns {object} Updated Property Data
         * @override
         */
        getPropertyData: function (oPropertyData) {
            if (!oPropertyData) {
                oPropertyData = {};
            }
            if (typeof oPropertyData.logToConsole === "undefined") {
                oPropertyData.logToConsole = false;
            }
            if (typeof oPropertyData.showHelp === "undefined") {
                oPropertyData.showHelp = true;
            }
            if (typeof oPropertyData.showFilter === "undefined") {
                oPropertyData.showFilter = true;
            }
            if (typeof oPropertyData.zweiUrl === "undefined") {
                oPropertyData.zweiUrl = "";
            }
            if (typeof oPropertyData.dummyOrder === "undefined") {
                oPropertyData.dummyOrder = "";
            }
            if (typeof oPropertyData.dummySfc === "undefined") {
                oPropertyData.dummySfc = "";
            }
            if (typeof oPropertyData.printerEndPoint === "undefined") {
                oPropertyData.printerEndPoint = "";
            }


            return oPropertyData;
        },

        /*
         * Function to override to add custom default property values to core property data
         *
         * @param {object} oPropertyData Defined Property Data
         * @returns {object} Updated Property Data
         * @override
         */
        setPropertyData: function (oPropertyData) {
            this._oExtensionUtilities.logMessage("PropertyEditorExtension.setPropertyData: WC POD Selection extension");
            if (typeof oPropertyData.logToConsole === "undefined") {
                oPropertyData.logToConsole = false;
            }
            if (typeof oPropertyData.showHelp === "undefined") {
                oPropertyData.showHelp = true;
            }
            if (typeof oPropertyData.showFilter === "undefined") {
                oPropertyData.showFilter = true;
            }
            if (typeof oPropertyData.zweiUrl === "undefined") {
                oPropertyData.zweiUrl = "";
            }
            if (typeof oPropertyData.dummyOrder === "undefined") {
                oPropertyData.dummyOrder = "";
            }
            if (typeof oPropertyData.dummySfc === "undefined") {
                oPropertyData.dummySfc = "";
            }
            if (typeof oPropertyData.printerEndPoint === "undefined") {
                oPropertyData.printerEndPoint = "";
            }
            return oPropertyData;
        },

        /*
         * Function to override to add custom default property values
         *
         * @param {object} oPropertyData Defined Property Data
         * @returns {object} Updated Property Data
         * @override
         */
        getDefaultPropertyData: function (oPropertyData) {
            oPropertyData.logToConsole = false;
            oPropertyData.showHelp = true;
            oPropertyData.showFilter = true;
            oPropertyData.zweiUrl = "";
            oPropertyData.dummyOrder = "";
            oPropertyData.dummySfc = "";
            oPropertyData.printerEndPoint = "";
            return oPropertyData;
        }
    })
});