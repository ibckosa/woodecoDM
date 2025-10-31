sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/CheckBox",
    "sap/m/Label",
    "sap/m/TextArea",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository",
    "sap/dm/dme/formatter/StatusFormatter",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler"
], function (BaseObject, CheckBox, Label, TextArea, TextHandler, ResourceRepository, StatusFormatter, ErrorHandler) {
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
                    let oText = new sap.m.Text({ text: this._oTextHandler.getText("labels.notifications.sendToErp")});
                    this._oChecbkox = new CheckBox();
                    this._oTextArea = new TextArea({ rows: 7});
                    let oLabel = new Label({ text: this._oTextHandler.getText("labels.notifications.comment")});
                    let oLabelEmpty = new Label({ text: ""});
                    oContentForm.addContent(oLabel);
                    oContentForm.addContent(this._oTextArea);
                    oContentForm.addContent(oLabelEmpty);
                    oContentForm.addContent(oText);
                    oContentForm.addContent(this._oChecbkox);
                    let oStatus = this._oPluginEventExt.getController().byId("inputStatus");
                    let oList = oStatus.getList();
                    oStatus.attachEvent("modelContextChange", this._onItemsLoad.bind(this));      
                    oList.attachEvent("modelContextChange", this._onItemsLoad.bind(this));      
                    oList.attachEvent("afterRendering", this._onItemsLoad.bind(this));   
                    oList.attachEvent("updateFinished", this._onAfterList.bind(this));
                    oStatus.attachEvent("updateFinished", this._onAfterList.bind(this));

                    oList.attachSelectionChange(this._listSelectionChange.bind(this));
                    oStatus.onAfterRendering(this._onAfterList.bind(this));       
                    oList.onAfterRendering(this._onAfterList.bind(this));    
        
                    debugger;
                    // let oStatusModel = this._oPluginEventExt.getController().byId("inputStatus").getModel();
                    // let oModel = this._oPluginEventExt.getController().byId("resourceStatusPanel").getModel();
                    // let oModelData = this._oPluginEventExt.getController().byId("resourceStatusPanel").getModel().getData();
                    
    
                }
            }catch(oError){
                debugger;
            }
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

        changeResourceStatus: async function(oUrl, oRequest, oController){
            let oErrorHandler = new ErrorHandler(oController);
            try{
                if(oRequest.status === "Przezbrojenie"){
                    oRequest.status = "SCHEDULED_DOWN";
                    oRequest.reasonCode.timeElement = "CHANGEOVER";
                }
                if(this._oTextArea){
                    let oComment = this._oTextArea.getValue();
                    if(this._oChecbkox.getSelected())
                    {
                        await this._createErpNotification(oRequest, oController, oComment, oErrorHandler)
                        oComment = "Wysłane do DUR\n" + oComment;
                    }
                    oRequest.comments = oComment;
                }
                oController.handleSaveResourceStatus(oUrl, oRequest);
            }
            catch(oError){
                oErrorHandler.handleError(oError);
            }


            
        },
        _createErpNotification: async function(oDurRequest, oController, oComment, oErrorHandler){

            debugger;
            let oEndPoint = this._getNotifEndpoint(oController, oErrorHandler);
            if(oEndPoint===""){
                oErrorHandler.throwErrorPopup("error.notifiaction.noEndpoint");
            }
            let oPlant = oController.getPodController().getUserPlant();
            let oPodSelectionModel = oController.getPodSelectionModel();
            let oDescription = oComment.replaceAll("\n", "|@#|");
            let oShortText = oController.oSelectedReasonCodeData.description;
            let oSapDateTime = this._getCurrentSapDateTime();
            let oResource = await ResourceRepository.getResourceInstance(oController, oPlant, oPodSelectionModel.resource.resource);
            let oFucntionalLocalization = oResource.getFunctionalLocation();
            if(oFucntionalLocalization===""){
                oErrorHandler.throwErrorPopup("error.notifiaction.noFunctionalLocalization");
            }
            let oParameters = {
                DESCRIPTION: oDescription,
                ORDER: oFucntionalLocalization,
                PLANT: oPlant,
                SHORTTEXT: oShortText,
                STARTDATE: oSapDateTime.sapDate,
                STARTTIME: oSapDateTime.sapTime
            };

            let sUrl = oController.getPublicApiRestDataSourceUri() + oEndPoint + "&async=false";

            return await new Promise((resolve,reject)=>{
                oController.ajaxPostRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        debugger;
                        reject(oError);
                    }   
                );

            });
            // let oSelectedCode = oController.oSelectedReasonCodeData;
            // let oResourceStatus = oController.oResourceStatus;
            // let oResourceStatusPanel = oController.byId("resourceStatusPanel")
            // debugger;
        },
        _onItemsLoad: function(oEvent){
            
            try{
                debugger;
                let oList = oEvent.getSource();
                let oListItems = oList.getItems();
                let oBinding = oList.getBinding();
                // var oBinding = oList.getBinding("items");
                // // var oFilter = new sap.ui.model.Filter("status", sap.ui.model.FilterOperator.EQ, "4");
                // oFilters.push(new sap.ui.model.Filter("status", sap.ui.model.FilterOperator.EQ, "4"));
                // oFilters.push(new sap.ui.model.Filter("status", sap.ui.model.FilterOperator.EQ, "5"));
                // oFilters.push(new sap.ui.model.Filter("status", sap.ui.model.FilterOperator.EQ, "301"));
                // oBinding.filter(oFilters);
                // oBinding.refresh();
                // let oStatusFormatter = StatusFormatter;
                // try{
                //     StatusFormatter.aResourceStatusKeys = [
                //         "ENABLED",
                //         "DISABLED",
                //         "PRODUCTIVE",
                //         "SCHEDULED_DOWN",
                //         "UNSCHEDULED_DOWN",
                //         "UNKNOWN",
                //         "Przezbrojenie"
                //     ];
                // }catch(oError){

                // }
                let oModel = oList.getModel();
                let oModelData = oModel.getData();
                oModelData = oModelData.filter(data=>{ return data.status === "4" || data.status === "5" || data.status === "301" });
                // let oStatus4 = { ...oModelData.find( data => { return data.status === "4" } ) };
                // if(oStatus4){
                //     oStatus4.statusDescription = "Przezbrojenie";
                //     oStatus4.status = "99";
                //     oModelData.push(oStatus4);
                // }
                oModel.setData(oModelData);


                this._oPluginEventExt.getController().statusList = this._oPluginEventExt.getController().statusList.filter( status => {return status.status === "4" || status.status === "5" || status.status === "301" } );
                let oStatusList4 =  { ...this._oPluginEventExt.getController().statusList.find( status => {return status.status === "4" } ) };
                // if(oStatusList4){
                //     oStatusList4.statusDescription = "Przezbrojenie";
                //     oStatusList4.status = "99";
                //     this._oPluginEventExt.getController().statusList.push(oStatusList4);
                // }

                this._oPluginEventExt.getController().oResourceStatus = {
                    0: "UNKNOWN",
                    1: "PRODUCTIVE",
                    301: "ENABLED",
                    302: "DISABLED",
                    4: "SCHEDULED_DOWN",
                    5: "UNSCHEDULED_DOWN"//,
                    //99: "Przezbrojenie" 
                
                }

                // oModel.setData(oModelData);
            }catch(oError){
                debugger;
            }
        },
        _getCurrentSapDateTime: function(){
            let today = new Date();
            let oYear = today.getFullYear().toString();
            let oMonth = (today.getMonth() + 1).toString();
            let oDay = today.getDate().toString();
            let oHour = today.getHours().toString();
            let oMinutes = today.getMinutes().toString();
            let oSeconds = today.getSeconds().toString();


            if (oMonth.length === 1) { oMonth = `0${oMonth}`; }
            if (oDay.length === 1) { oDay = `0${oDay}`; }
            if (oHour.length === 1) { oHour = `0${oHour}`; }
            if (oMinutes.length === 1) { oMinutes = `0${oMinutes}`; }
            if (oSeconds.length === 1) { oSeconds = `0${oSeconds}`; }

            return {
                sapDate: `${oYear}${oMonth}${oDay}`,
                sapTime: `${oHour}${oMinutes}${oSeconds}`
            };
        },
        _getNotifEndpoint: function(oController){
            let oReturn = "";
            try{
                let oEndPoint = oController.getConfigurationValue("notifEndpoint");
                if(oEndPoint){
                    oReturn = oEndPoint;
                }
            }catch(oError){}
            return oReturn;
        },
        _onAfterList: function(oEvent){
            debugger;
            try{
                
                let oList = oEvent.getSource();
                let oBinding = oList.getBinding("items");
                let oFormatter = oBinding.formatter;
            }catch(oError){
                debugger;
            }

        },
        _listSelectionChange: function(oEvent){
            let oController = this._oPluginEventExt.getController();
            try{
                let oSelectedKey = oEvent.getParameters().selectedItem.getKey();
                if(oSelectedKey==="99"){
                    let oxd = oController.oSelectedReasonCodeData;
                    oController.oSelectedReasonCodeData = {};
                    oController.oSelectedReasonCodeData.description = "Changeover - general";
                    oController.oSelectedReasonCodeData.plant = oController.getPodController().getUserPlant();
                    oController.oSelectedReasonCodeData.reasonCode1 = "P001";
                    oController.oSelectedReasonCodeData.fixed=false;

                    oController.oSelectedReasonCodeData.reasonCode2 = null;
                    oController.oSelectedReasonCodeData.reasonCode3 = null;
                    oController.oSelectedReasonCodeData.reasonCode4 = null;
                    oController.oSelectedReasonCodeData.reasonCode5 = null;
                    oController.oSelectedReasonCodeData.reasonCode6 = null;
                    oController.oSelectedReasonCodeData.reasonCode7 = null;
                    oController.oSelectedReasonCodeData.reasonCode8 = null;
                    oController.oSelectedReasonCodeData.reasonCode9 = null;
                    oController.oSelectedReasonCodeData.reasonCode10 = null;
                    oController.oSelectedReasonCodeData.resourceReasonCodeNodeCollection = null;
                    oController.oSelectedReasonCodeData.status= "ENABLED";
                    oController.oSelectedReasonCodeData.timeElement = null;
                    oController.oSelectedReasonCodeData.targetInMinutes = null;
                    oController.oSelectedReasonCodeData.keyId = "1745825298839000000700256";
                    oController.byId("inputReasonCode").setValue("Przezbrojenie - ogólne");
                    oController.byId("save").setEnabled(true);
                    oController.byId("cancel").setEnabled(true);
                }
                
            }catch(oError){

            }
            debugger;
        }

    })
});