sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/MessageToast",
    "sap/ui/layout/VerticalLayout",
    "sap/m/MessageBox",
    "sap/m/ProgressIndicator",
    
], function (BaseObject, Button, Label, MessageToast, VerticalLayout, MessageBox, ProgressIndicator) {
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
        //    let oInformationControl = new VerticalLayout();
        //    oInformationControl.addStyleClass("sapUiNoContentPadding");
        //    oInformationControl.addStyleClass("sapUiMediumMarginEnd");
        //    oInformationControl.addStyleClass("sapUiSmallMarginBottom");
        //    let oLabel = new Label({
        //        text: "Adam Test",
        //        tooltip: "Selected Supplier"
        //    });
        //    let oLabelData = new Label({
        //        text: "Adam Test",
        //        tooltip: "Selected Supplier"
        //    });
        //    oInformationControl.addContent(oLabel);
        //    oInformationControl.addContent(oLabelData);
        //    oInformationContainer.addItem(oInformationControl);
        //    this.oChildControls[oInformationContainer.getId()] = oInformationControl;
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
                visible: "{customData>/sfcCardCustomVisibility/"+fieldName+"}"
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
                visible: "{= ${customData>/sfcCardCustomVisibility/"+fieldName+"}}"
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
        onDekorButton: function(oEvent){
            let oModelData = this.getController().getView().getModel("customData").getData();
            let oGraphicToDisplay = oModelData.sfcCardCustom.decors;
            if(oGraphicToDisplay.length < 1) return;

            // oGraphicToDisplay.push({ graphicName: "Dekor przód",
            //                         graphicType: "decorFront",
            //                         graphicUrl: "https://smartedit.clk0j02460-pfleidere1-s1-public.model-t.cc.commerce.ondemand.com/occ/v2/medias/PK9000-Terrazo-Nero-6.jpg?context=bWFzdGVyfHJvb3R8ODU2MzcyfGltYWdlL2pwZWd8YUdRekwyZzRaUzg0T0RFd01UQTNNVGMwT1RReUwxTTJPREF5T1Y5VVpYSnlZWHB2WDA1bGNtOWZOaTVxY0djfDk5NzJhNjQxNDA5YTJiZDI4OTAyN2UyZDZkMDZhNmMwYTdjYTE2NDA0YmI0MWYzMzdlN2I4MzVkNWVlZjEyZDEmJmZhbHNlJiY5Njg1YmYwMTU2MmU4YTA0YzQxODEwY2E1OGIzZmIyNDk4YmIyN2NkNDllMTkwZjIzMTQ3YTUwYzQzMTczZmNl" });
        
            //                         oGraphicToDisplay.push({ graphicName: "Dekor tył",
            //                             graphicType: "decorBack",
            //                             graphicUrl: "https://smartedit.clk0j02460-pfleidere1-s1-public.model-t.cc.commerce.ondemand.com/occ/v2/medias/PD3000-D-b-Sonoma.jpg?context=bWFzdGVyfHJvb3R8MTQ5OTM5Mzd8aW1hZ2UvanBlZ3xhREF6TDJoaE1pODVOamcyT1RZek9UUTFOVEF5TDFCRU16QXdNRjlFeElWaVgxTnZibTl0WVM1cWNHY3wxNjYyODVkMDUwMDFlOTc3ZmE0MGEyNDg3ZTU5ZTQwYTBiZDI4MjgzZGFhMTdiODZkYTFjZjYxZjBhYTA5MDYwJiZmYWxzZSYmMmM4ZDg4YmMxYTcxY2E3ODdiNTY2YWVmOTAwMzgwZjE3YzE5MjhmY2I2ZjQ3ZmE1NzJhM2JkMDQzOTMzMDBmZQ" });
     
            //                       oGraphicToDisplay.push({ graphicName: "Stuktura przód",
            //                             graphicType: "structureFront",
            //                             graphicUrl: "https://smartedit.clk0j02460-pfleidere1-s1-public.model-t.cc.commerce.ondemand.com/occ/v2/medias/PD7023-big.jpg?context=bWFzdGVyfHJvb3R8NTc3Njk4NXxpbWFnZS9qcGVnfGFHUm1MMmd4WlM4NE9EQXhNREkxTlRnNU1qYzRMMUl5TnpBeU5GOWlhV2N1YW5Cbnw3YjEzNjBmNGUyY2YxYzk2MmU5MDg5YWFkNjIxM2Y2Nzk5ODViMGM5ODhhNDExYTU0MjcyYjQzYzRlYjE2ZWJkJiZmYWxzZSYmZTZmYTZmODVjZWUxYTRhNDM5ZGM5MjNiNDBiMzNlNjk0MDEwYmZmMjcxZWY1Zjk2MTIyYzVkZGNkM2RmN2U1ZA" });

            //                       oGraphicToDisplay.push({ graphicName: "Stuktura tył",
            //                             graphicType: "structureBack",
            //                             graphicUrl: "https://smartedit.clk0j02460-pfleidere1-s1-public.model-t.cc.commerce.ondemand.com/occ/v2/medias/PD3000-D-b-Sonoma.jpg?context=bWFzdGVyfHJvb3R8MTQ5OTM5Mzd8aW1hZ2UvanBlZ3xhREF6TDJoaE1pODVOamcyT1RZek9UUTFOVEF5TDFCRU16QXdNRjlFeElWaVgxTnZibTl0WVM1cWNHY3wxNjYyODVkMDUwMDFlOTc3ZmE0MGEyNDg3ZTU5ZTQwYTBiZDI4MjgzZGFhMTdiODZkYTFjZjYxZjBhYTA5MDYwJiZmYWxzZSYmMmM4ZDg4YmMxYTcxY2E3ODdiNTY2YWVmOTAwMzgwZjE3YzE5MjhmY2I2ZjQ3ZmE1NzJhM2JkMDQzOTMzMDBmZQ" });
        
            // Tworzenie obrazów
    const aImages = oGraphicToDisplay.map(oGraphic => {
        return new sap.m.VBox({
            items: [
                new sap.m.Image({
                    src: oGraphic.graphicUrl,
                    width: "400px",
                    height: "900px",
                    decorative: false,
                    alt: oGraphic.graphicName
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
        items: aImages,
        direction: "Row",
        wrap: "Wrap",
        alignItems: "Start",
        justifyContent: "Center"
    });

    const oDialog = new sap.m.Dialog({
        title: "Podgląd grafik",
        contentWidth: "80%",
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
                                    }
    })
});