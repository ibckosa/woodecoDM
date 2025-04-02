sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/CheckBox",
    "sap/m/Label",
    "sap/m/TextArea",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (BaseObject, CheckBox, Label, TextArea, TextHandler) {
    "use strict";

    /**
     * Get the object needed to instantiate a control with the same settings as oControl.
     *
     * Can be used to apply the properties of one control to a new instance of a
     * different control (such as making a custom ConfigurableListButton with the same
     * properties, bindings, and events as the original sap.m.Button it replaced).
     */
    function getSettingsForControl(oControl, oController) {
        let oProperties = oControl.getMetadata().getAllProperties();
        debugger;

        let oValues = {};
        for (let sProp in oProperties) {
            // if the property has an associated binding, keep it
            if (oControl.getBindingInfo(sProp)) {
                oValues[sProp] = oControl.getBindingInfo(sProp);
            } else {
                // no binding, use the literal value
                oValues[sProp] = oControl.getProperty(sProp);
            }
        }

        // keep event handlers
        let oEvents = oControl.getMetadata().getAllEvents();
        for (let sEvent in oEvents) {
            if (oControl.mEventRegistry[sEvent]) {
                oValues[sEvent] = oControl.mEventRegistry[sEvent].map(oEvent => oEvent.fFunction.bind(oController));
            }
        }

        return oValues;
    };

    return BaseObject.extend("ibc.dm.plugins.changeEquipmentStatusExtensionProvider.ExtensionUtilities", {
        constructor: function () {
            this.bLogToConsole = false;
            this._oTextHandler = new TextHandler();
        },

        setLogToConsole: function(bLogToConsole) {
            this.bLogToConsole = bLogToConsole;
        },

        logMessage: function(sMessage, oData) {
            if (!this.bLogToConsole) {
                return;
            }
            let vDataOutput = null;
            if (typeof oData !== "undefined") {
                if (typeof oData === "string" || typeof oData === "boolean" || typeof oData === "number") {
                    vDataOutput = oData;
                } else {
                    vDataOutput = JSON.stringify(oData);
                }
            }
            if (!vDataOutput) {
                console.debug(sMessage);
            } else {
                console.debug(sMessage + vDataOutput);
            }
        },
        setPluginEventExtension(oPluginEventExt){
            this._oPluginEventExt = oPluginEventExt;
           
        },
        editDialog(){
            try{
                if(!this._oChecbkox && !this._oTextArea){
                    //let oView = this._oPluginEventExt.getController().getView();
                    let oContentForm = this._oPluginEventExt.getController().getView().getContent()[0].getContent()[0];
                    let oText = new sap.m.Text({ text: this._oTextArea.getText("labels.notifications.sendToErp")});
                    this._oChecbkox = new CheckBox();
                    this._oTextArea = new TextArea({ rows: 7});
                    let oLabel = new Label({ text: "Komentarz"});
                    let oLabelEmpty = new Label({ text: this._oTextArea.getText("labels.notifications.comment")});
                    oContentForm.addContent(oLabel);
                    oContentForm.addContent(this._oTextArea);
                    oContentForm.addContent(oLabelEmpty);
                    oContentForm.addContent(oText);
                    oContentForm.addContent(this._oChecbkox);
    
                }
            }catch(oError){}
        },

        test: function(){
            let coreExt = this._oPluginEventExt.getCoreExtension();
            let oPluginController = this._oPluginEventExt.getController();
            let oView = this._oPluginEventExt.getController().getView();
            let oItems = oView.findAggregatedObjects(true);
            let oContent = oView.getContent();
            let oContent2 = oContent[0].getContent();
            let oContentForm = oContent2[0];
            let a1 = oContentForm.getBreakpointL();
            let a2 = oContentForm.getBreakpointM();
            let a3 = oContentForm.getBreakpointXL();
            let a4 = oContentForm.getColumnsL();
            let a5 = oContentForm.getColumnsM();
            let a6 = oContentForm.getColumnsXL();
            let a7 = oContentForm.getEmptySpanL();
            let a8 = oContentForm.getEmptySpanM();
            let a9 = oContentForm.getEmptySpanS();
            let a10 = oContentForm.getEmptySpanXL();
            let a11 = oContentForm.getLabelMinWidth();
            let a12 = oContentForm.getLabelSpanL();
            let a13 = oContentForm.getLabelSpanM();
            let a14 = oContentForm.getLabelSpanS();
            let a15 = oContentForm.getLabelSpanXL();
            let maxContainerCols = oContentForm.getMaxContainerCols();
            let oLayout = oContentForm.getLayout();
            let oid = oContentForm.getId();
            let oFormById = this._oPluginEventExt.getController().getView().byId("__form2");//
            if(!this._oChecbkox){
                let oText = new sap.m.Text({ text: "Wyślij do erp:"});
                this._oChecbkox = new CheckBox();
                this._oTextArea = new TextArea({ rows: 7});
                let oLabel = new Label({ text: "Komentarz"});
                let oLabelEmpty = new Label({ text: ""});
                oContent2[0].addContent(oLabel);
                oContent2[0].addContent(this._oTextArea);
                oContent2[0].addContent(oLabelEmpty);
                oContent2[0].addContent(oText);
                oContent2[0].addContent(this._oChecbkox);

            }
            
            debugger;
        },

        changeResourceStatus: function(oUrl, oRequest){

            if(this._oTextArea){
                let oComment = this._oTextArea.getValue();
                oRequest.comments = oComment;
            }
            debugger;
        }
    })
});