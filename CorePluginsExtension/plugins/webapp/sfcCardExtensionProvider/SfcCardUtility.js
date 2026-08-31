sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/MessageToast",
    "sap/ui/layout/VerticalLayout",
    "sap/m/MessageBox",
    "sap/m/ProgressIndicator",
    "ibc/dm/plugins/wcPodToolsProvider/Material",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (BaseObject, Button, Label, MessageToast, VerticalLayout, MessageBox, ProgressIndicator, Material, TextHandler) {
    "use strict";
    return BaseObject.extend("ibc.dm.plugins.sfcCardExtensionProvider.SfcCardUtility", {
        constructor: function () {
            this._textHandler = new TextHandler();
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
           // this.setLocalI18nModel();

            let oInformationContainer = this.getCoreExtension().getPluginInformationContainer();
            let oToolbarContainer = this.getCoreExtension().getPluginToolbar();

            if (!this.oChildControls) {
                this.oChildControls = {};
            }

            if (true) {
                let oActionButton = null;
                if (oToolbarContainer && this.oChildControls[oToolbarContainer.getId()]) {
                    oActionButton = this.oChildControls[oToolbarContainer.getId()];
                }
                if (oToolbarContainer && !oActionButton) {
                    this.addActionButton(oToolbarContainer);
                }
            }
            if (true) {
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
            let oInformationControl = new sap.ui.layout.HorizontalLayout({
                visible: true,
            });
            oInformationControl.addStyleClass("sapUiNoContentPadding");
            oInformationControl.addStyleClass("sapUiMediumMarginEnd");
            oInformationControl.addStyleClass("sapUiSmallMarginBottom");


            var oProgressIndicator = new ProgressIndicator({
                state : "Success",
                showValue: true,
                displayOnly: true,
                width: "15rem",
                visible: true,
                percentValue: "{customData>/sfcCardCustom/percentProgress}",
                displayValue: "{customData>/sfcCardCustom/progressIndicatorValue}"
            });

            oInformationControl.addContent(oProgressIndicator);
            let objectStatusWarning = new sap.m.ObjectStatus({
                text:"{customData>/sfcCardCustom/productionWarning}",
                visible: "{= ${customData>/sfcCardCustom/productionWarning} !== '' && ${customData>/sfcCardCustom/productionWarning} !== undefined }",
                icon:"sap-icon://warning"
            });
            objectStatusWarning.addStyleClass("blinking");
            objectStatusWarning.addStyleClass("sapUiMediumMarginBegin");
            objectStatusWarning.addStyleClass("sapUiTinyMarginTop");

            oInformationControl.addContent(objectStatusWarning);

            


            if (oToolbar.addContent) {
                oToolbar.addContent(oInformationControl);
            }
            this.oChildControls[oToolbar.getId()] = oInformationControl;

            this._checkContentAdded();

        },
		onHelpPress: function (evt) {
			MessageToast.show("Custom Help button pressed");
		},

        _checkContentAdded: function(i = 0){
            let that = this;
            if(i===5){
                return;
            }
            setTimeout(function() {
                // delay to allow core view to render before modifying
                i = i + 1;
                try{
                    let oToolbar = that.getCoreExtension().getPluginToolbar();
                    let content = oToolbar.getContent();
                    if(content.length < 1){
                        let progressBar = that.oChildControls[oToolbar.getId()];
                        if(progressBar){
                            oToolbar.addContent(progressBar);
                        }
                    }
                }catch(error){}


                that._checkContentAdded(i);
            }, 1000);
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

            this._addInformationTextField(oInformationContainer, "quantityPerPallet", true);

            this._addInformationButton(oInformationContainer, "remarksButton");
            this._addInformationButton(oInformationContainer, "salesTextPL");
            this._addInformationButton(oInformationContainer, "packagingDescription");
            this._addDekorButton(oInformationContainer);

            

        },
        _addInformationTextField: function(oInformationContainer, fieldName, asFormattedText=false){
            let oInformationControl = new VerticalLayout({
               // visible: "{customData>/sfcCardCustomVisibility/"+fieldName+"}"
                visible: "{= ${customData>/sfcCardCustom/"+fieldName+"} !== '' && ${customData>/sfcCardCustom/"+fieldName+"} !== undefined  && ${customData>/sfcCardCustomVisibility/"+fieldName+"} }"
            });
            oInformationControl.addStyleClass("sapUiNoContentPadding");
            oInformationControl.addStyleClass("sapUiMediumMarginEnd");
            oInformationControl.addStyleClass("sapUiSmallMarginBottom");

            var oText = this._textHandler.getText(`labels.sfcCard.${fieldName}`);  
            let oLabel = new Label({
                text: oText,
            });
            oInformationControl.addContent(oLabel);
            if(asFormattedText){
                let formattedText = new sap.m.FormattedText({ htmlText: "{customData>/sfcCardCustom/"+fieldName+"}" }); 
                oInformationControl.addContent(formattedText);
            }else{
                let oLabelData = new Label({
                    text: "{customData>/sfcCardCustom/"+fieldName+"}"
                });
                oInformationControl.addContent(oLabelData);
            }
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
                var oText = this._textHandler.getText(`labels.sfcCard.${fieldName}`);
           
            } catch (error) {
                oText = fieldName;
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
        checkPluginContent:  function(){
            let oToolbarContainer = this.getCoreExtension().getPluginToolbar();
            let content = oToolbarContainer.getContent();
            if(!content||content.length === 0){
                let oActionButton = null;
                if (this.oChildControls[oToolbarContainer.getId()]) {
                    oActionButton = this.oChildControls[oToolbarContainer.getId()];
                    oToolbarContainer.addContent(oActionButton);
                }
            }
        },
        onDekorButton: async function(oEvent){

            let oModelData = this.getController().getView().getModel("customData").getData();
            //let oGraphicToDisplay = oModelData.sfcCardCustom.decors;
            let oGraphicToDisplay = await Material.getGraphicLinkFromCustomData(oModelData.sfcCardCustom.decors, this.getController());
            if(oGraphicToDisplay.length < 1){
                MessageBox.information(this._textHandler.getText("labels.graphic.noDecors"));
                return;
            }

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

            const oFlexBox = new sap.m.FlexBox({
                items: aImageBoxes,
                direction: "Row",
                wrap: "Wrap",
                justifyContent: "Center"
            });

            const oDialog = new sap.m.Dialog({
                title: "Podgląd grafik",
                contentWidth: "50vw", 
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