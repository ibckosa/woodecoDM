sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/MessageToast",
    "sap/ui/layout/VerticalLayout",
    "sap/m/MessageBox",
    "sap/m/ProgressIndicator",
    "ibc/dm/plugins/wcPodToolsProvider/Material"
], function (BaseObject, Button, Label, MessageToast, VerticalLayout, MessageBox, ProgressIndicator, Material) {
    "use strict";
    return BaseObject.extend("ibc.dm.plugins.sfcCardExtensionProvider.SfcCardUtility", {
        constructor: function () {
        },

        setPluginEventExtension: function(oExtension){
            this.oPluginEventExtension = oExtension;
        },

        getPluginEventExtension: function(){
            return this.oPluginEventExtension;
        },

        getCoreExtension: function(){
            return this.oPluginEventExtension.getCoreExtension();
        },

        getController: function(){
            return this.getPluginEventExtension().getController();
        },

        getConfigurationValue: function(sProperty){
            let oController = this.getController();
            if (!oController) {
                return null;
            }
            return oController.getConfigurationValue(sProperty);
        },

        setLocalI18nModel: function(){

            // Create a resource bundle for language specific texts
            var oResourceModel = new sap.ui.model.resource.ResourceModel({
                bundleName : "ibc.dm.plugins.sfcCardExtensionProvider.i18n.i18n"
            });

            // Assign the model object to the SAPUI5 core using the name "i18n"

            this.getController().getPodController().getView().setModel(oResourceModel,"i18n_local");

        },
        getMethodsOf: function(obj){
            var methods = {}
            Object.getOwnPropertyNames( Object.getPrototypeOf(obj) ).forEach(methodName => {
              methods[methodName] = obj[methodName]
            })
            return methods
        },

        loadHeaderInformation: function(bShowHelp, bShowSupplier){
            this.setLocalI18nModel();

            let oInformationContainer = this.getCoreExtension().getPluginInformationContainer();
            let oToolbarContainer = this.getCoreExtension().getPluginToolbar();
            
            // Multiple SFC Card's can be defined, but only one extension, so
            // this will make sure new controls are created and added to the current displayed
            // SFC Card plugin
            if (!this.oChildControls) {
                this.oChildControls = {};
            }
            if (bShowHelp) {
                let oActionButton = null;
                if (oToolbarContainer && this.oChildControls[oToolbarContainer.getId()]) {
                    oActionButton = this.oChildControls[oToolbarContainer.getId()];
                }
                if (oToolbarContainer && !oActionButton) {
                    this.addActionButton(oToolbarContainer);
                }
            }
            if (bShowSupplier) {
                let oInformationControl = null;
                if (oInformationContainer && this.oChildControls[oInformationContainer.getId()]) {
                    oInformationControl = this.oChildControls[oInformationContainer.getId()];
                }
                if (oInformationContainer && !oInformationControl) {
                    this.addInformationControls(oInformationContainer);
                }
            }
        },

        addActionButton: function(oToolbar) {
            let that = this;
            let oActionButton = new Button({
                type: "Emphasized",
                text: "Help",
                press: [that.onHelpPress, that]
            });



            var oToolbarMethods = this.getMethodsOf(oToolbar);
            var oExtenisonMethods = this.getMethodsOf(this.getCoreExtension());


            var oProgressIndicator = new ProgressIndicator({
                state : "Success",
                showValue: true,
                displayOnly: true,
                width: "15rem",
                visible: "{customData>/sfcCardCustomVisibility/progressIndicatorValue}",
                percentValue: "{customData>/sfcCardCustom/percentProgress}",
                displayValue: "{customData>/sfcCardCustom/progressIndicatorValue}"
            });

            if (oToolbar.addAction&&1===2) {
                oToolbar.addAction(oActionButton);
            } else if (oToolbar.addContent) {
                oToolbar.addContent(oProgressIndicator);
            }
            this.oChildControls[oToolbar.getId()] = oProgressIndicator;
        },
		onHelpPress: function (evt) {
			MessageToast.show("Custom Help button pressed");
		},

        addInformationControls: function(oInformationContainer) {
            this._addInformationTextField(oInformationContainer, "optimizationNumber");
            this._addInformationTextField(oInformationContainer, "recipeNumber");
            this._addInformationTextField(oInformationContainer, "blockNumber");
            this._addInformationTextField(oInformationContainer, "customerName");
            this._addInformationTextField(oInformationContainer, "artFam");
            this._addInformationTextField(oInformationContainer, "thickness");
            this._addInformationTextField(oInformationContainer, "length");
            this._addInformationTextField(oInformationContainer, "width");
            this._addInformationTextField(oInformationContainer, "crossCompany");

            this._addInformationTextField(oInformationContainer, "blatMaterialTop");
            this._addInformationTextField(oInformationContainer, "blatMaterialDown");
            this._addInformationTextField(oInformationContainer, "blatThicknessTop");
            this._addInformationTextField(oInformationContainer, "blatThicknessDown");

            this._addInformationTextField(oInformationContainer, "artfamCom");
            this._addInformationTextField(oInformationContainer, "artfamEle");
            this._addInformationTextField(oInformationContainer, "artfamGrp");
            this._addInformationTextField(oInformationContainer, "artfamRohlpE");
            this._addInformationTextField(oInformationContainer, "artfamRohlpatte");
            this._addInformationTextField(oInformationContainer, "ruType");


            this._addInformationButton(oInformationContainer, "remarksButton");
            this._addInformationButton(oInformationContainer, "salesTextPL");

            this._addDekorButton(oInformationContainer);

        },
        _addInformationTextField: function(oInformationContainer, fieldName){
            let oInformationControl = new VerticalLayout({
               // visible: "{customData>/sfcCardCustomVisibility/"+fieldName+"}"
                visible: "{= ${customData>/sfcCardCustom/"+fieldName+"} !== '' && ${customData>/sfcCardCustom/"+fieldName+"} !== undefined  && ${customData>/sfcCardCustomVisibility/"+fieldName+"} }"
            });
            oInformationControl.addStyleClass("sapUiNoContentPadding");
            oInformationControl.addStyleClass("sapUiMediumMarginEnd");
            oInformationControl.addStyleClass("sapUiSmallMarginBottom");

            try {
                var oText = this.getController().getPodController().getView().getModel("i18n_local").getResourceBundle().getText(fieldName);
           
            } catch (error) {
                oText = sLabelId;
            }

           let oLabel = new Label({
               text: oText,
           });
           let oLabelData = new Label({
               text: "{customData>/sfcCardCustom/"+fieldName+"}"
           });
           oInformationControl.addContent(oLabel);
           oInformationControl.addContent(oLabelData);
           oInformationContainer.addItem(oInformationControl);

            this.oChildControls[oInformationContainer.getId()] = oInformationControl;

        },
        _addInformationButton(oInformationContainer, fieldName){
            let oInformationControl = new VerticalLayout({
                visible: "{= ${customData>/sfcCardCustom/"+fieldName+"} !== '' && ${customData>/sfcCardCustom/"+fieldName+"} !== undefined  && ${customData>/sfcCardCustomVisibility/"+fieldName+"} }"
                //visible: "{= ${customData>/sfcCardCustomVisibility/"+fieldName+"}}"
                //visible: "{= ${customData>/sfcCardCustom/"+fieldName+"} !== '' && ${customData>/sfcCardCustom/"+fieldName+"} !== undefined}"
            });
            oInformationControl.addStyleClass("sapUiNoContentPadding");
            oInformationControl.addStyleClass("sapUiMediumMarginEnd");
            oInformationControl.addStyleClass("sapUiSmallMarginBottom");

            try {
                var oText = this.getController().getPodController().getView().getModel("i18n_local").getResourceBundle().getText(fieldName);
           
            } catch (error) {
                oText = sLabelId;
            }
            var that = this;
            var oButton = new Button({
                     type: "Emphasized",
                     id: fieldName,
                     text: oText,
                     press: [that.onPopupButton, that]
                 });
            oInformationControl.addContent(oButton);
            oInformationContainer.addItem(oInformationControl);
            this.oChildControls[oInformationContainer.getId()] = oInformationControl;
        },
        onPopupButton: function(oEvent){
            var oButtonId = oEvent.getSource().getId();
            var sTextToDisplay = this.getController().getView().getModel("customData").getProperty("/sfcCardCustom/"+oButtonId);
            sTextToDisplay = sTextToDisplay.replaceAll("$&","\n");
            MessageBox.information(sTextToDisplay);
        },
        _addDekorButton: function(oInformationContainer){
            let oInformationControl = new VerticalLayout({
                visible: "{customData>/sfcCardCustomVisibility/decors}"
                //visible: "{= ${customData>/sfcCardCustom/"+fieldName+"} !== '' && ${customData>/sfcCardCustom/"+fieldName+"} !== undefined}"
            });
            oInformationControl.addStyleClass("sapUiNoContentPadding");
            oInformationControl.addStyleClass("sapUiMediumMarginEnd");
            oInformationControl.addStyleClass("sapUiSmallMarginBottom");

            var oButton = new Button({
                     type: "Emphasized",
                     id: "dekorButton",
                     text: "Dekor",
                     press: this.onDekorButton.bind(this)
                 });
            oInformationControl.addContent(oButton);
            oInformationContainer.addItem(oInformationControl);
            this.oChildControls[oInformationContainer.getId()] = oInformationControl;
        },
        onDekorButton: async function(oEvent){
            let oModelData = this.getController().getView().getModel("customData").getData();
            //let oGraphicToDisplay = oModelData.sfcCardCustom.decors;
            let oGraphicToDisplay = await Material.getGraphicLinkFromCustomData(oModelData.sfcCardCustom.decors, this.getController());
            if(oGraphicToDisplay.length < 1) return;

            const aImageBoxes = oGraphicToDisplay.map(oGraphic => {
                let Swidth;
                switch (oGraphicToDisplay.length) {
                    case 1:
                        Swidth = "50vw";
                        break;
                    case 2:
                        Swidth = "25vw";
                        break;
                    case 3:
                        Swidth = "16vw";
                        break;
                    case 4:
                        Swidth = "12vw";
                        break;
                    case 5:
                        Swidth = "18vw";
                        break;
                    case 6:
                        Swidth = "15vw";
                        break;
                    case 7:
                        Swidth = "12.75vw";
                        break;
                    case 8:
                        Swidth = "11vw";
                        break;
                    default:
                        Swidth = "20vw"; 
                }
                return new sap.m.VBox({
                    items: [
                        new sap.m.Image({
                            src: oGraphic.graphicUrl,
                            decorative: false,
                            alt: oGraphic.graphicName,
                            width: Swidth, 
                            height: "80vh", 
                    }),
                        new sap.m.Text({
                            text: oGraphic.graphicName,
                            textAlign: "Center"
                        })
                    ],
                    alignItems: "Center"
                });
            });

            // FlexBox jako kontener dla VBoxów z obrazkami i podpisami
            const oFlexBox = new sap.m.FlexBox({
                items: aImageBoxes,
                direction: "Row",
                wrap: "Wrap",
                justifyContent: "Center"
            });

            // Dialog (popup)
            const oDialog = new sap.m.Dialog({
                title: "Podgląd grafik",
                contentWidth: "50vw", // Szerokość okna dialogowego
                contentHeight: "auto",
                content: [oFlexBox],
                beginButton: new sap.m.Button({
                    text: "Zamknij",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
                    },

                });
        });