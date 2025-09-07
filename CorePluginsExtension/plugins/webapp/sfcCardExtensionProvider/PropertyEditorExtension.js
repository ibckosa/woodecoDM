sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginPropertyEditorExtension"
], function (PluginPropertyEditorExtension) {
    "use strict";

    return PluginPropertyEditorExtension.extend("ibc.dm.plugins.sfcCardExtensionProvider.PropertyEditorExtension", {
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

                oSwitch = oPropertyEditor.addSwitch(oPropertyFormContainer, "showSupplier", oPropertyData);
                iIndex = oPropertyFormContainer.indexOfContent(oSwitch);
                aContent = oPropertyFormContainer.getContent();
                if (aContent[iIndex-1].setText) {
                    oLabel = aContent[iIndex-1];
                    oLabel.setText("Show Supplier");
                }



                this.addFieldConfiguration("FRPR", oPropertyFormContainer, oPropertyData);
                this.addFieldConfiguration("FRSL", oPropertyFormContainer, oPropertyData);
                this.addFieldConfiguration("FIMP", oPropertyFormContainer, oPropertyData);
                this.addFieldConfiguration("FDPR", oPropertyFormContainer, oPropertyData);
                this.addFieldConfiguration("FNUF", oPropertyFormContainer, oPropertyData);
                this.addFieldConfiguration("FHPR", oPropertyFormContainer, oPropertyData);
                this.addFieldConfiguration("FXKO", oPropertyFormContainer, oPropertyData);
                this.addFieldConfiguration("FDSA", oPropertyFormContainer, oPropertyData);       
                this.addFieldConfiguration("FPAK", oPropertyFormContainer, oPropertyData);   
                this.addFieldConfiguration("FRSA", oPropertyFormContainer, oPropertyData); 
                this.addFieldConfiguration("FDTS", oPropertyFormContainer, oPropertyData);  
                
                this.addSmartEditConfiguration(oPropertyFormContainer, oPropertyData);

            }
            return;
        },

        /*
         * Function to override to add content after core properties
         *
         * @param {sap.ui.layout.form.SimpleForm} oPropertyFormContainer Form to add controls to
         * @param {object} oPropertyData Defined Property Data
         * @override
         */
        addPropertyEditorContentAfter: function (oPropertyFormContainer, oPropertyData) {
            this._oExtensionUtilities.logMessage("PropertyEditorExtension.addPropertyEditorContentAfter: hi");
            return;
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
            if (typeof oPropertyData.showSupplier === "undefined") {
                oPropertyData.showSupplier = true;
            }


            if (typeof oPropertyData.fieldsFRPR === "undefined") {
                oPropertyData.fieldsFRPR = "";
            }

            if (typeof oPropertyData.fieldsFRSL === "undefined") {
                oPropertyData.fieldsFRSL = "";
            }

            if (typeof oPropertyData.fieldsFIMP === "undefined") {
                oPropertyData.fieldsFIMP = "";
            }

            if (typeof oPropertyData.fieldsFDPR === "undefined") {
                oPropertyData.fieldsFDPR = "";
            }

            if (typeof oPropertyData.fieldsFNUF === "undefined") {
                oPropertyData.fieldsFNUF = "";
            }

            if (typeof oPropertyData.fieldsFHPR === "undefined") {
                oPropertyData.fieldsFHPR = "";
            }

            if (typeof oPropertyData.fieldsFXKO === "undefined") {
                oPropertyData.fieldsFXKO = "";
            }

            if (typeof oPropertyData.fieldsFDSA === "undefined") {
                oPropertyData.fieldsFDSA = "";
            }

            if (typeof oPropertyData.fieldsFPAK === "undefined") {
                oPropertyData.fieldsFPAK = "";
            }

            if (typeof oPropertyData.fieldsFRSA === "undefined") {
                oPropertyData.fieldsFRSA = "";
            }

            if (typeof oPropertyData.fieldsFDTS === "undefined") {
                oPropertyData.fieldsFDTS = "";
            }


            if (typeof oPropertyData.smartEditUrl === "undefined") {
                oPropertyData.smartEditUrl = "";
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
            this._oExtensionUtilities.logMessage("PropertyEditorExtension.setPropertyData: hi");
            if (typeof oPropertyData.logToConsole === "undefined") {
                oPropertyData.logToConsole = false;
            }
            if (typeof oPropertyData.showHelp === "undefined") {
                oPropertyData.showHelp = true;
            }
            if (typeof oPropertyData.showSupplier === "undefined") {
                oPropertyData.showSupplier = true;
            }

            if (typeof oPropertyData.fieldsFRPR === "undefined") {
                oPropertyData.fieldsFRPR = "";
            }

            if (typeof oPropertyData.fieldsFRSL === "undefined") {
                oPropertyData.fieldsFRSL = "";
            }

            if (typeof oPropertyData.fieldsFIMP === "undefined") {
                oPropertyData.fieldsFIMP = "";
            }

            if (typeof oPropertyData.fieldsFDPR === "undefined") {
                oPropertyData.fieldsFDPR = "";
            }

            if (typeof oPropertyData.fieldsFNUF === "undefined") {
                oPropertyData.fieldsFNUF = "";
            }

            if (typeof oPropertyData.fieldsFHPR === "undefined") {
                oPropertyData.fieldsFHPR = "";
            }

            if (typeof oPropertyData.fieldsFXKO === "undefined") {
                oPropertyData.fieldsFXKO = "";
            }

            if (typeof oPropertyData.fieldsFDSA === "undefined") {
                oPropertyData.fieldsFDSA = "";
            }
            if (typeof oPropertyData.fieldsFPAK === "undefined") {
                oPropertyData.fieldsFPAK = "";
            }

            if (typeof oPropertyData.fieldsFRSA === "undefined") {
                oPropertyData.fieldsFRSA = "";
            }

            if (typeof oPropertyData.fieldsFDTS === "undefined") {
                oPropertyData.fieldsFDTS = "";
            }


            if (typeof oPropertyData.smartEditUrl === "undefined") {
                oPropertyData.smartEditUrl = "";
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
            oPropertyData.showSupplier = true;
            return oPropertyData;
        },
        addFieldConfiguration(sAuart, oPropertyFormContainer, oPropertyData ){
            let oPropertyEditor = this.getController();
            let oInput = oPropertyEditor.addInputField(oPropertyFormContainer, `fields${ sAuart }`, oPropertyData);
            let iIndex = oPropertyFormContainer.indexOfContent(oInput);
            let aContent = oPropertyFormContainer.getContent();
            if (aContent[iIndex-1].setText) {
                let oLabel = aContent[iIndex-1];
                oLabel.setText(`fields ${ sAuart }`);
            }
        },
        addSmartEditConfiguration(oPropertyFormContainer, oPropertyData){
            let oPropertyEditor = this.getController();
            let oInput = oPropertyEditor.addInputField(oPropertyFormContainer, 'smartEditUrl', oPropertyData);
            let iIndex = oPropertyFormContainer.indexOfContent(oInput);
            let aContent = oPropertyFormContainer.getContent();
            if (aContent[iIndex-1].setText) {
                let oLabel = aContent[iIndex-1];
                oLabel.setText("SmartEdit Url");
            }
        }
    })
});