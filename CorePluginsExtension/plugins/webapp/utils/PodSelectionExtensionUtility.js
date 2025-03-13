sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/Button",
    "sap/m/Input",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
    "sap/m/ToolbarSpacer",
    "sap/ui/comp/filterbar/FilterGroupItem",
	"sap/ui/model/json/JSONModel",
    "sap/dm/dme/podfoundation/util/PodUtility",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/m/library",
    "sap/m/TextArea",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/CheckBox",
    "sap/m/HBox",
    "sap/m/DateTimePicker",
    "sap/m/VBox",
    "sap/ui/core/date/UI5Date",
    "sap/m/Panel",
    "sap/m/OverflowToolbar",
    "sap/f/DynamicPage",
    "sap/m/Label"
], function (BaseObject, Button, Input, MessageBox, MessageToast, ToolbarSpacer, FilterGroupItem, JSONModel, PodUtility , Dialog, Text
    , mobileLibrary, TextArea, Table, Column, ColumnListItem, CheckBox, HBox, DateTimePicker, VBox, UI5Date, Panel, Toolbar, DynamicPage, Label) {
    "use strict";
    return BaseObject.extend("ibc.dm.plugins.utils.PodSelectionExtensionUtility", {
        constructor: function () {
            this.aCustomFilters = [];
            this._initialized = false;
        },

        setPluginEventExtension: function(oExtension){
            var oPluginMethods = this.getMethodsOf(oExtension);
            
            debugger;
            return this.oPluginEventExtension = oExtension
            
        },

        getCoreExtension: function(oExtension){
            return this.oPluginEventExtension.getCoreExtension();
        },

        loadOverflowToolbar: function(fnFunction, fnContext){
            // this.addActionButton(oOverflowToolbar, "Emphasized", "Help", fnFunction, fnContext);
            // let bShowHelp = this.getCoreExtension().getConfigurationValue("showHelp");
            // if (bShowHelp) {
                let oOverflowToolbar = this.getCoreExtension().getOverflowToolbar();
                oOverflowToolbar.setVisible(true);
                oOverflowToolbar.addContent(new ToolbarSpacer());
                this.addActionButton(oOverflowToolbar, "Emphasized", "Help", fnFunction, fnContext);
            // }
        },

        loadFilterBar: function(fnFunction, fnContext){
            let bShowFilter = this.getCoreExtension().getConfigurationValue("showFilter");
            if (bShowFilter) {
                let oFilterBar = this.getCoreExtension().getFilterBar();
                let sSuggestionPath = "suppliers>/SupplierCollection";
                let sItemTextBinding = "{suppliers>SupplierName}";
                let oInputFilter = this.createInputFilter("customSupplierFilter", "Text", "{/supplierName}", "Supplier", 0, "200px", sSuggestionPath, sItemTextBinding, fnFunction, fnContext);
                this.addFilter(oFilterBar, oInputFilter, "INTERNAL_GROUP", "SUPPLIER_NAME", "Supplier", "Supplier Name");
                this.aCustomFilters[this.aCustomFilters.length] = oInputFilter;
            }
        },

        loadShopOrderFilter: function(fnFunction, fnContext){
            let bShowOrderFilter = this.getCoreExtension().getConfigurationValue("showOrderFilter");
            if (bShowOrderFilter) {
                let oFilterBar = this.getCoreExtension().getFilterBar();
                let sSuggestionPath = null;
                let sItemTextBinding = null;
                let oInputFilter = this.createInputFilter("customOrderFilter", "Text", "{/shopOrder}", "Shop Order", 0, "200px", null, null, fnFunction, fnContext);
                this.addFilter(oFilterBar, oInputFilter, "INTERNAL_GROUP", "SHOP_ORDER", "Shop Order", "Shop Order");
                this.aCustomFilters[this.aCustomFilters.length] = oInputFilter;
            }
        },

        getMethodsOf: function(obj){
            var methods = {}
            Object.getOwnPropertyNames( Object.getPrototypeOf(obj) ).forEach(methodName => {
              methods[methodName] = obj[methodName]
            })
            return methods
        },

        addActionButton: function(oToolbar, sType, sText, fnFunction, fnContext) {
            let oActionButton = new Button({
                type: sType,
                text: sText,
                press: this.onLogButtonPress.bind(this)
            });
            oToolbar.addContent(oActionButton);
        },

        createInputFilter: function(sId, sType, sBinding, sPlaceHolder, sMaxLength, sWidth, sSuggestionPath, sItemTextBinding, fnFunction, fnContext) {
            let bShowSuggestion = false;
            if (PodUtility.isNotEmpty(sSuggestionPath)) {
                bShowSuggestion = true;
            }
            let oSuggestionItems = null;
            if (PodUtility.isNotEmpty(sItemTextBinding)) {
                oSuggestionItems = { 
                    path: sSuggestionPath, 
                    template: new sap.ui.core.Item({text: sItemTextBinding})
                }
            }
            return new Input(sId, {
                type: sType,
                value: sBinding,
                placeholder: sPlaceHolder,
                maxLength: sMaxLength,
                width: sWidth,
                showSuggestion: bShowSuggestion,
                showValueHelp: false,
                change: [fnFunction, fnContext],
                suggestionItems: oSuggestionItems 
            });
        },

        addFilter: function(oFilterBar, oFilterControl, sGroupName, sName, sLabel, sTooltip) {
            // let oFilterGroupItem = new FilterGroupItem({
            //     groupName: sGroupName,
            //     visibleInFilterBar: true,
            //     partOfCurrentVariant: false,
            //     mandatory: false,
            //     name: sName,
            //     label: sLabel,
            //     labelTooltip: sTooltip,
            //     visible: true
            // });
            // oFilterGroupItem.setControl(oFilterControl);
            // oFilterBar.addFilterGroupItem(oFilterGroupItem);
        },

        getCustomFilterControls: function() {
            return this.aCustomFilters;
        },

		showMessage: function (sTitle, sMessage, sDetails) {
			MessageBox.information(sMessage, {
				title: sTitle,
				id: "messageBoxId1",
				details: sDetails,
				contentWidth: "100px"
			});
		},

		showMessageToast: function (sMessage) {
            MessageToast.show(sMessage);
		},

        getJsonData: function(sPath) {
            let oModel = new JSONModel();
            oModel.loadData(sap.ui.require.toUrl(sPath), null, false);
            return oModel.getData();
        },
        onLogButtonPress: async function(oEvent){
            try{
                let oController = this.oPluginEventExtension.getController();
                if(this._initialized === false){
                    var oResourceModel = new sap.ui.model.resource.ResourceModel({ bundleName : "ibc.dm.plugins.utils.i18n.i18n" });
                    oController.getView().setModel(oResourceModel,"i18n_local_psel");
                    this._oSelController = oController;
                    this._initialized = true;
                }            

            
                let podSelectionModel =  oController.getPodSelectionModel()
                if(podSelectionModel.workCenter === undefined || podSelectionModel.workCenter === ""){
                    this._throwError("q23.error.emptyWorkCenter");
                }
                if(podSelectionModel.resource === null ||podSelectionModel.resource === undefined || podSelectionModel.resource.resource === undefined){
                    this._throwError("q23.error.emptyResource");
                }
                this._oWorkCenter = podSelectionModel.workCenter;
                this._oResource = podSelectionModel.resource.resource;

                await this._displayDialogQ23(oController);
                debugger;            
            }catch(oError){
                this._handleError(oError);
                debugger;}
        },
        _displayDialogQ23: async function(oController){
            return await new Promise(async (resolve, reject) => {
                this._resolveDialogQ23 = resolve;
                if (!this._oDialogQ23) {
                    this._setCustomButtonCssStyles();
                    let oVBox = new VBox({ alignItems: "Center", height: "50rem", width: "112rem" });
                    let oTableQ23 = this._getTableQ23();
                    let oActionButtons = this._getActionButtons();
                    oVBox.addItem(oTableQ23);
                    oVBox.addItem(oActionButtons);
                    this._oDialogQ23 = new Dialog({
                        type: mobileLibrary.DialogType.Message,
                        verticalScrolling: false,
                        title: this._geti18nText("q23.label.dialogTitle"),
                        content: [oVBox],
                        buttons: [
                            new Button({
                                text: this._geti18nText("q23.label.buttonClose"),
                                press: function () {
                                    this._oDialogQ23.close();
                                    this._resolveDialogQ23();
                                }.bind(this)
                            })
                        ]
                    });    
                }
                await this._loadDataQ23();
                this._oDialogQ23.open();
            });
        },
        _setCustomButtonCssStyles: function(){
            let oHead = document.getElementsByTagName("head")[0];
            let oStyle = document.createElement("style");
            oStyle.type = "text/css";
            oStyle.innerHTML = `
                .sapMBtn.bigButtonNC .sapMBtnInner {
                padding-top: 1rem;
                padding-left: 0.5rem;
                padding-right: 0.5rem;
                padding-bottom: 0.5rem;
                text-align: center;
                font-size: 2rem;
                height: 4rem;
                background-color: #107E3E;
                color: white;
                }
            `;
            oHead.appendChild(oStyle);
        },
        _getTableQ23: function () {
            let oPanel = new Panel({ height: "45rem", width: "110rem" });

            let oToolbar = this._getDateTimePickers();

            let oTable = new Table({
                growing: false,
                sticky: ["ColumnHeaders", "HeaderToolbar"],
                width: "110rem",
                //growingThreshold: 14,
                inset: false,
                headerToolbar: oToolbar,
                columns: [
                    new Column({
                        header: new Text({ text: "" })
                    }),
                    new Column({
                        header: new Text({ text: this._geti18nText("q23.label.orderNumberColumn") })
                    }),
                    new Column({
                        header: new Text({ text: this._geti18nText("q23.label.materialIdColumn") })
                    }),
                    new Column({
                        header: new Text({ text: this._geti18nText("q23.label.materialDescriptionColumn") })
                    }),
                    new Column({
                        header: new Text({ text: this._geti18nText("q23.label.quantityColumn") })
                    }),
                    new Column({
                        header: new Text({ text: this._geti18nText("q23.label.createdAtColumn") })
                    })
                ],
                items: {
                    path: "/items",
                    template: new ColumnListItem({
                        cells: [
                            new CheckBox({ selected: "{lineChecked}", class: "bigCheckbox" }),//checkbox - line selected
                            new Text({ text: "{orderNumber}", class: "fontText" }),// order number
                            new Text({ text: "{materialId}", class: "fontText" }),//material ID
                            new Text({ text: "{materialDesc}", class: "fontText" }),//material Description
                            new Text({ text: "{quantity}", class: "fontText" }),//quantity of nonconformance
                            new Text({ text: "{createdAt}", class: "fontText" })//created at
                        ]
                    })
                }
            });
            let oDynamicPage = new DynamicPage({ height: "40rem", width:"110rem" , content: [oTable] });
            
            oPanel.addContent(oDynamicPage);
            return oPanel;
        },
        _getActionButtons: function(){
            let oHBoxBtn = new HBox({});
            let oButtonPackaging = new Button({
                text: this._geti18nText("q23.label.buttonPackaging"),
                width: "15rem",
                class: "bigButtonNC",
                press: this.onButtonPackaging.bind(this)
            });

            let oButtonReturn = new Button({
                text: this._geti18nText("q23.label.buttonReturn"),
                width: "15rem",
                class: "bigButtonNC",
                press: this.onButtonReturn.bind(this)
            });

            let oButtonScrap = new Button({
                text: this._geti18nText("q23.label.buttonScrap"),
                width: "15rem",
                press: this.onButtonScrap.bind(this)
            });
            oButtonPackaging.addStyleClass("bigButtonNC sapUiSmallMarginEnd");
            oButtonReturn.addStyleClass("bigButtonNC");
            oButtonScrap.addStyleClass("bigButtonNC sapUiSmallMarginBegin");
            oHBoxBtn.addItem(oButtonPackaging);
            oHBoxBtn.addItem(oButtonReturn);
            oHBoxBtn.addItem(oButtonScrap);
            return oHBoxBtn;
        },

        _loadDataQ23: async function(){

            let oDialogModel = this._oDialogQ23.getModel();
            let oQ23Data = {};

            
            if(!oDialogModel){
                let dateTimeNow = new Date();
                oQ23Data = {
                    startDate: UI5Date.getInstance(dateTimeNow.getFullYear(), dateTimeNow.getMonth(), dateTimeNow.getDate(), 0, 0, 0),
                    endDate: UI5Date.getInstance(dateTimeNow.getFullYear(), dateTimeNow.getMonth(), dateTimeNow.getDate(), 23, 59, 59),
                    items: []
                };   
                oDialogModel = new JSONModel();
            }else{
                oQ23Data= oDialogModel.getData();
                
            }            
            oQ23Data.items = await this._getQ23TableItems(oQ23Data.startDate, oQ23Data.endDate);
            oDialogModel.setData(oQ23Data);

            this._oDialogQ23.setModel(oDialogModel);
        },
        _getDateTimePickers: function(){
            let oVBoxDtp1 = new VBox({});
            let oVBoxDtp2 = new VBox({});
            let oVBoxBtn = new VBox({});
            let oFilterButton = new Button({
                text: this._geti18nText("q23.label.buttonFilter"),
                width: "10rem",
                type: "Emphasized",
                press: this.onButtonFilter.bind(this)
            });
            let oLabelDtp1 = new Label({ text: this._geti18nText("q23.label.startDateTime"), design: "Bold" });
            let oLabelDtp2 = new Label({ text: this._geti18nText("q23.label.endDateTime"), design: "Bold" });
            let oLabelBtn = new Label({ text: "", design: "Bold" });

            let DateTimePicker1 = new DateTimePicker({
                value: {
                    path: "/startDate",
                    type: "sap.ui.model.type.DateTime",
                    formatOptions: {
                        'pattern': 'YYYY.MM.dd HH:mm:ss'
                    },
                }
                , width: "12rem"
            });
            let DateTimePicker2 = new DateTimePicker({
                value: {
                    path: "/endDate",
                    type: "sap.ui.model.type.DateTime",
                    formatOptions: {
                        'pattern': 'YYYY.MM.dd HH:mm:ss'
                    }
                },
                width: "12rem"
            });

            oVBoxDtp1.addItem(oLabelDtp1);
            oVBoxDtp1.addItem(DateTimePicker1);
            oVBoxDtp2.addItem(oLabelDtp2);
            oVBoxDtp2.addItem(DateTimePicker2);
            oVBoxBtn.addItem(oLabelBtn);
            oVBoxBtn.addItem(oFilterButton);

            let oToolbar = new Toolbar({ width: "100%", height: "auto", design: "Solid", content: [oVBoxDtp1, oVBoxDtp2, oVBoxBtn] });

            return oToolbar;
        },
        _geti18nText: function(oTextId){
            let oReturn = "";
            try{
                oReturn = this._oSelController.getView().getModel("i18n_local_psel").getResourceBundle().getText(oTextId);
            }catch(oError){
                oReturn = oTextId;
            }

            return oReturn;

        },
        _showError: function(oText){
            this._oSelController.showErrorMessage(oText);
        },
        _showSuccessMessage: function(oTextId){
            this._oSelController.showSuccessMessage(this._geti18nText(oTextId),true,true);
        },
        _getQ23TableItems: async function(oStartDate, oEndDate){
            let oReturnTab = [];

            if(oStartDate === null){this._throwError("q23.error.startDate");}
            if(oEndDate === null){this._throwError("q23.error.endDate");}

            let oNonconformances  = await this._getNonconformances(oStartDate, oEndDate);

            let oNonconformancesFiltered = oNonconformances.filter(
                nonconformance=> {
                    return nonconformance.state === "OPEN" &&
                            nonconformance.workCenter   &&
                            nonconformance.workCenter === this._oWorkCenter &&
                            nonconformance.resource &&
                            nonconformance.resource === this._oResource;
                });


            for(const nonconformance of oNonconformancesFiltered){
                let oSfc = await this._getSfcDetails(nonconformance.sfc);
                let oOrderDetails = await this._getOrderDetails(oSfc.order.order);
                let oStepId = this._getStepId(oSfc);
                //let oMaterial = await this._getMaterialDetails();
                let oItem = {
                    lineChecked: false,
                    orderNumber: oSfc.order.order,
                    materialId: nonconformance.material.material,
                    materialVersion: nonconformance.material.version,
                    materialDesc: oSfc.material.description,
                    quantity: nonconformance.quantity,
                    uom: oOrderDetails.productionUnitOfMeasure,
                    createdAt: nonconformance.createdDateTime,
                    nonconformanceId: nonconformance.id,
                    sfc: nonconformance.sfc,
                    stepId: oStepId,
                    storageLocation: oOrderDetails.putawayStorageLocation,
                    plant: oOrderDetails.plant,
                    packagingMaterial: ""
                };
                oReturnTab.push(oItem);
            }

            return oReturnTab;
        },
        _getNonconformances: async function(oStartDate, oEndDate){
            let sUrl = this._oSelController.getPublicApiRestDataSourceUri() + "nonconformance/v1/nonconformances";

            let oParameters = { plant: this._oSelController.getPodController().getUserPlant(),
                                resource: this._oResource,
                                fromDate: oStartDate.toJSON(),
                                toDate: oEndDate.toJSON()


             };
            return await new Promise((resolve,reject)=>{
                this._oSelController.ajaxGetRequest(sUrl, oParameters,
                    function (oResponseData) {
                        resolve(oResponseData);
                    },
                    function (oError, sHttpErrorMessage) {
                        reject(oError);
                    }   
                );

            });
        },
        _getSfcDetails: async function(oSfcNumber){
            let oSfc = this._getSfcDetailsBuffer(oSfcNumber);

            if(oSfc===undefined){
                oSfc = await this._getSfcDetailsApi(oSfcNumber);
            }

            if(oSfc===undefined){
                //throw exceptions;
            }

            return oSfc;
        },
        _getSfcDetailsBuffer:  function(oSfcNumber){
            if(!this._sfcDetails){return;}

            return this._sfcDetails.find( (sfcDetail) => sfcDetail.sfc === oSfcNumber );

        },
        _getSfcDetailsApi: async function(oSfcNumber){
            let sUrl = this._oSelController.getPublicApiRestDataSourceUri() + "sfc/v1/sfcdetail";

            let oParameters = { plant: this._oSelController.getPodController().getUserPlant(),
                                sfc: oSfcNumber
             };
            return await new Promise((resolve,reject)=>{
                this._oSelController.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        this._bufferSfcDetails(oResponseData);
                        //this._sfcDetails.push(oResponseData);
                        resolve(oResponseData);
                    },
                    function (oError, sHttpErrorMessage) {
                        reject(oError);
                    }   
                );

            });
        },
        _bufferSfcDetails: function(oSfcData){
            if(this._sfcDetails === undefined){
                this._sfcDetails = [];
            }
            this._sfcDetails.push(oSfcData);    
        },  

        // _getMaterialDetails: async function(){
        //     return {};
        // },
        // _getMaterialDetailsBuffer:  function(){
            
        // },
        // _getMaterialDetailsApi: async function(){
            
        // },
        onButtonScrap: async function(oEvent){ 
            try{
                let oSelectedLines = this._getSelectedQ23Lines();
                for(let oLine of oSelectedLines){
                    try{
                        await this._closeNonconformance(oLine);
                        this._showSuccessMessage("q23.success.closeNonconformance")
                    }catch(oError){this._handleError(oError);}
                }
                this._loadDataQ23();
            }catch(oError){this._handleError(oError);}
        },
        onButtonPackaging: async function(oEvent){
            try{
                this._oZweiEndpoint = this._getZweiEndpoint();
                let oSelectedLines = this._getSelectedQ23Lines();
                for(let oLine of oSelectedLines){
                    try{
                        await this._closeNonconformance(oLine);
                        this._showSuccessMessage("q23.success.closeNonconformance");
                        oLine.packagingMaterial = await this._getPackagingMaterial(oLine);
                        await this._callCustomApi("PACKAGE", oLine);
                        this._showSuccessMessage("q23.success.packageNonconformance");
                    }catch(oError){ this._handleError(oError); }
                }
                this._loadDataQ23();
                
            }catch(oError){
                this._handleError(oError);
            }
        },
        onButtonReturn: async function(oEvent){
            try{
                this._oZweiEndpoint = this._getZweiEndpoint();
                let oSelectedLines = this._getSelectedQ23Lines();
                for(let oLine of oSelectedLines){
                    try{
                        await this._closeNonconformance(oLine);
                        this._showSuccessMessage("q23.success.closeNonconformance");
                        await this._callCustomApi("RETURN", oLine);
                        this._showSuccessMessage("q23.success.returnNonconformance");
                    }catch(oError){ this._handleError(oError); }
                }
                this._loadDataQ23();
            }catch(oError){
                this._handleError(oError);
            }
            
        }, 
        _getSelectedQ23Lines: function(){
            let oItems = this._oDialogQ23.getModel().getData().items;

            let oSelectedItems = oItems.filter( oItem => {
                return oItem.lineChecked === true;
            });
            return oSelectedItems;
        },
        _closeNonconformance: async function(oNonconformanceLine){
            let sUrl = this._oSelController.getPublicApiRestDataSourceUri() + "nonconformance/v1/close";

            let oParameters = { plant: this._oSelController.getPodController().getUserPlant(),
                                id: oNonconformanceLine.nonconformanceId
             };
            return await new Promise((resolve,reject)=>{
                this._oSelController.ajaxPostRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    oError=>{
                        reject(oError);
                    }   
                );

            });
        },
        onButtonFilter: function(oEvent){
            try{
                this._loadDataQ23();
            }catch(oError){
                this._handleError(oError);
            }
        },
        _throwError: function(oErrorTextId){
            var oText = this._geti18nText(oErrorTextId);
            throw { errorMessage: oText };
        },
        _handleError: function(oError){
            const sText = this._getTextFromError(oError);
            this._showError(sText);
        },
        _getTextFromError: function(oError){
            let oReturn = "";

            if(oError===undefined){
                oReturn = this._geti18nText("errorGeneralMessage");
            }else if(oError.displayMessage !== undefined){
                oReturn = oError.displayMessage;
            }else if(oError.causeMessage !== undefined){
                oReturn = oError.causeMessage;
            }else if(oError.message !== undefined){
                oReturn = oError.message;
            }else if(oError.errorMessage !== undefined){
                oReturn = oError.errorMessage;
            }else{
                oReturn = oError;
            }

            if(oReturn===""){
                oReturn = this._geti18nText("q23.error.generalError");
            }
            return oReturn;
        },
        _getZweiEndpoint: function(){
            let oZweiEndpoint = this.getCoreExtension().getConfigurationValue("zweiURL");
            if(!oZweiEndpoint){
                this._throwError("q23.error.noZweiEndPoint");
            }

            return oZweiEndpoint;
        },
        _getOrderDetails: async function(oOrder){
            let oOrderDetails = this._getOrderDetailsBuffer(oOrder);

            if(oOrderDetails===undefined){
                oOrderDetails = await this._getOrderDetailsApi(oOrder);
            }

            if(oOrderDetails===undefined){
                this._throwError();
            }

            return oOrderDetails;
        },
        _bufferOrderDetails: function(oOrderDetails){
            if(this._orderDetails === undefined){
                this._orderDetails = [];
            }
            this._orderDetails.push(oOrderDetails);    
        },  
        _getOrderDetailsBuffer:  function(oOrder){
            if(!this._orderDetails){return;}

            return this._orderDetails.find( (orderDetail) =>  orderDetail.order === oOrder );

        },
        _getOrderDetailsApi: async function(oOrder){
            let sUrl = this._oSelController.getPublicApiRestDataSourceUri() + "order/v1/orders";

            let oParameters = { plant: this._oSelController.getPodController().getUserPlant(),
                                order: oOrder
             };
            return await new Promise((resolve,reject)=>{
                this._oSelController.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        this._bufferOrderDetails(oResponseData);
                        //this._sfcDetails.push(oResponseData);
                        resolve(oResponseData);
                    },
                    function (oError, sHttpErrorMessage) {
                        reject(oError);
                    }   
                );

            });
        },
        _callCustomApi: async function(oProcess, oLine){
            let sUrl = this._oSelController.getPublicApiRestDataSourceUri() + this._oZweiEndpoint;
            debugger;
            let oHuNumber = await this._generateHuNumber(oLine);
            let oSapDateTime = this._getCurrentSapDateTime();
            let oParameters = {};
            if(oProcess==="RETURN"){
                oParameters = { WERK: oLine.plant,
                    BEWART: "521",
                    ZLO: "STOCK",
                    LGORT: oLine.storageLocation,
                    HU: oHuNumber,
                    MATNR: oLine.materialId,
                    MATTYP: "SCRAP2SAP",
                    MENGE: oLine.quantity,
                    MENGE_EINH: oLine.uom,
                    AUFNR: oLine.orderNumber,
                    VORNR: oLine.stepId,
                    END_LIEF: "N",
                    ARBPL: this._oWorkCenter,
                    LOSHINWEIS: "2ND_TO_STOCK",
                    VVDAT: oSapDateTime.sapDate,
                    VVZEI: oSapDateTime.sapTime,
                    WDAT: "39991231",
                    WZEI: "235959",
                    VFDAT: "39991231",
                    VFZEI: "235959",
                    KLASSE: "A",
                    STATUS: "F",
                    QSTMANU: "I",
                    TST: "F" };
            }else{
                oParameters = { WERK: oLine.plant,
                    BEWART: "521",
                    ZLO: "STOCK",
                    LGORT: oLine.storageLocation,
                    HU: oHuNumber,
                    MATNR: oLine.packagingMaterial,
                    MATTYP: "SCRAP2SAP",
                    MENGE: oLine.quantity,
                    MENGE_EINH: oLine.uom,
                    AUFNR: oLine.orderNumber,
                    VORNR: oLine.stepId,
                    END_LIEF: "N",
                    ARBPL: this._oWorkCenter,
                    LOSHINWEIS: "SCRAP_TO_STOCK",
                    VVDAT: oSapDateTime.sapDate,
                    VVZEI: oSapDateTime.sapTime,
                    WDAT: "39991231",
                    WZEI: "235959",
                    VFDAT: "39991231",
                    VFZEI: "235959",
                    STATUS: "F",
                    MATST: "U",
                    QST: "O",
                    QSTMANU: "I",
                    TST: "F" };
            }

            return await new Promise((resolve,reject)=>{
                this._oSelController.ajaxPostRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                    },
                    oError=>{
                        reject(oError);
                    }   
                );

            });
        },
        _getStepId: function(oSfcDetails){
            let oStepId = "";
            try{
                oStepId = oSfcDetails.steps[0].stepId;      
            }catch(oError){}
            return oStepId;
        },
        _generateHuNumber: async function(oLineDetails){
            let sUrl = this._oSelController.getPublicApiRestDataSourceUri() + "numbering/v1/identifiers";

            let oNextHuNumberParameters = { plant: oLineDetails.plant,
                eventName: "PACKING_UNIT_NUMBER",
                objectsToMatch: {    MATERIAL_NAME: oLineDetails.materialId,
                                     MATERIAL_VERSION : oLineDetails.materialVersion,
                                     ORDER_TYPE: "Production" } };


            return await new Promise((resolve,reject)=>{
                this._oSelController.ajaxPostRequest(sUrl, oNextHuNumberParameters,
                    function (oResponseData) {
                        resolve(oResponseData.identifiers[0]);
                    },
                    function (oError, sHttpErrorMessage) {
                        reject(oError);
                    }   
                );

            });
        },
        _getPackagingMaterial: async function(oLineDetails){
            let oMaterialDetails = await this._getMaterialDetails(oLineDetails.materialId, oLineDetails.materialVersion);
            try{
                let oAttributeName = `${oLineDetails.plant}_RETURN_MATERIAL`;
                let oCustomValue = oMaterialDetails.customValues.find((customValues)=>customValues.attribute === oAttributeName);

                if(!oCustomValue||!oCustomValue.value||oCustomValue.value===""){throw "";}

                return oCustomValue.value;
            }catch(oError){
                this._throwError("q23.error.noPackagingMaterial");
            }

        },
        _getMaterialDetails: async function(oMaterialNumber, oMaterialVersion){
            let oMaterialDetails = await this._getMaterialDetailsBuffer(oMaterialNumber, oMaterialVersion);
            if(!oMaterialDetails){
                oMaterialDetails = await this._getMaterialDetailsApi(oMaterialNumber, oMaterialVersion);
            }

            if(!oMaterialDetails){
                //TODO THROW EXCEPTION
            }

            return oMaterialDetails;

        },
        _getMaterialDetailsBuffer: async function(oMaterialNumber, oMaterialVersion){
            if(!this._materialDetails){return;}

            return this._materialDetails.find( (materialDetail)=> materialDetail.material === oMaterialNumber && materialDetail.version === oMaterialVersion );

        },
        _getMaterialDetailsApi: async function(oMaterialNumber, oMaterialVersion){
            let sUrl = this._oSelController.getPublicApiRestDataSourceUri() + "material/v1/materials";

            let oParameters = { plant: this._oSelController.getPodController().getUserPlant(),
                                material: oMaterialNumber,
                                version: oMaterialVersion
             };
            return await new Promise((resolve,reject)=>{
                this._oSelController.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        this._bufferMaterialDetails(oResponseData);
                        //this._sfcDetails.push(oResponseData);
                        if(oResponseData.length>0){resolve(oResponseData[0]);}
                        //TODO throw exception
                    },
                    function (oError, sHttpErrorMessage) {
                        reject(oError);
                    }   
                );

            });
        },
        _bufferMaterialDetails: function(oMaterialDetails){
            if(!this._materialDetails){this._materialDetails = [];}

            this._materialDetails.push(oMaterialDetails);
        },
        _getCurrentSapDateTime: function(){
            let today = new Date();
            let oYear = today.getFullYear().toString();
            let oMonth = today.getMonth().toString();
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
        }   
    })
});