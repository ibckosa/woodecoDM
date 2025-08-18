sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/NcCodesReader",
    "ibc/dm/plugins/wcPodToolsProvider/SfcMOReceipt",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository",
    "ibc/dm/plugins/wcPodToolsProvider/SfcQ23",
    "sap/ui/core/Fragment",
    "sap/m/library"
], function (jQuery, PluginViewController, JSONModel, ErrorHandler, TextHandler, OrderRepository, NcCodesReader, SfcMOReceipt, ResourceRepository, SfcQ23, Fragment, mobileLibrary) {
	"use strict";

	return PluginViewController.extend("ibc.dm.plugins.vPlgMultiOrders.vPlgMultiOrders.controller.MainView", {
		onInit: function () {
			PluginViewController.prototype.onInit.apply(this, arguments);
			this._oTextHandler = new TextHandler();
            this._oErrorHandler = new ErrorHandler(this);
            var oViewModel = new sap.ui.model.json.JSONModel({
                selectedOrder: {}
            });
            this.getView().setModel(oViewModel, "viewModel");   
            this._oErrorHandler = new ErrorHandler(this);        
		},


        onBeforeRendering:  async function () {   
            await this._loadData();
        },


        onAfterRendering: function(){
           
            // this.getView().byId("backButton").setVisible(this.getConfiguration().backButtonVisible);
            // this.getView().byId("closeButton").setVisible(this.getConfiguration().closeButtonVisible);
            
            // this.getView().byId("headerTitle").setText(this.getConfiguration().title);
            // this.getView().byId("textPlugin").setText(this.getConfiguration().text); 
        },

		onBeforeRenderingPlugin: async function () {
            this.subscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.subscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
			//await this._loadData();
			
		},

        isSubscribingToNotifications: function() {
            
            var bNotificationsEnabled = true;
           
            return bNotificationsEnabled;
        },


        getCustomNotificationEvents: function(sTopic) {
            //return ["template"];
        },

        onPodSelectionChangeEvent: async function (sChannelId, sEventId, oData) {
            //await this._loadData();
        },

        onOperationChangeEvent: function (sChannelId, sEventId, oData) {
            //this.loadModel();
        },

        onWorkListSelectEvent: async function (sChannelId, sEventId, oData) {
            await this._loadData();
        },


        getNotificationMessageHandler: function(sTopic) {

            //if (sTopic === "template") {
            //    return this._handleNotificationMessage;
            //}
            return null;
        },

        _handleNotificationMessage: function(oMsg) {
           
            var sMessage = "Message not found in payload 'message' property";
            if (oMsg && oMsg.parameters && oMsg.parameters.length > 0) {
                for (var i = 0; i < oMsg.parameters.length; i++) {

                    switch (oMsg.parameters[i].name){
                        case "template":
                            
                            break;
                        case "template2":
                            
                        
                        }        
          

                    
                }
            }

        },
        

		onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);

            this.unsubscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.unsubscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
		},
        _loadData: async function () {
            try {
                this.getView().setBusyIndicatorDelay(0);
                this.getView().setBusy(true);
                var oPodSelectionModel = this.getPodSelectionModel();
                var aSelections = oPodSelectionModel.getSelections(); 
                var oFirstSelection = aSelections[0]; 
                this._oPlant = this.getPodController().getUserPlant();
                this._oOrderNumber = oFirstSelection.getShopOrder().getShopOrder();
                this._oWorkCenter = oPodSelectionModel.workCenter;
                this._oResource = oPodSelectionModel.resource.resource;
                this._oResourceInstance = await ResourceRepository.getResourceInstance(this, this._oPlant, this._oResource);
                this._oOrder = await OrderRepository.readOrderByPassBuffer(this, this._oPlant, this._oOrderNumber);
                this._routing = oFirstSelection.getSfcData().getRouting(),
                this._routingVersion = oFirstSelection.getSfcData().getRoutingVersion() 
                let oPositions = await this._oOrder.getOrderPositions(this._routing, this._routingVersion);
                let oCodesTab = await NcCodesReader.readCodes(this, this._oPlant, this._oWorkCenter, this._oResource);
                const oModel = new JSONModel({ positions: oPositions, codes: oCodesTab });
                this.getView().setModel(oModel, "multiOrdersModel");
                if( ( !this._oOrderNumberPrevious || this._oOrderNumberPrevious !== this._oOrderNumber ) && oPositions.length > 0){
                    let oFirstPosition = oPositions[0];
                    let selectedPosition = this._selectPositionAfterLoad(oPositions);
                    let oViewModel = this.getView().getModel("viewModel");
                    oViewModel.setProperty("/selectedOrder", selectedPosition.selectedRow);
                    this._setSelectedFirstPosition(selectedPosition.index);
                    this._oOrderNumberPrevious = this._oOrderNumber;
                }else if(this._oOrderNumberPrevious && this._oOrderNumberPrevious === this._oOrderNumber   && oPositions.length > 0){
                    this._refreshSelectedOrder(oPositions);
                }else if(oPositions.length === 0){
                    let oViewModel = this.getView().getModel("viewModel");
                    oViewModel.setProperty("/selectedOrder", null);
                }
                await this._setFieldVisibility();
                this.getView().setBusy(false);
            } catch (error) {
                this.getView().setBusy(false);
                this._oErrorHandler.handleError(error);
            }
        },
        onQ1Press: function () {
            // Pokazuje sekcję Q1, ukrywa sekcję Q2/Q3
            this.getView().byId("q1Section").setVisible(true);
            this.getView().byId("q2q3Section").setVisible(false);
            var oButton = this.byId("btnQ1");
            oButton.addStyleClass("greenCircle--active");

            var oButtonQ2 = this.getView().byId("btnQ2Q3");
            oButtonQ2.removeStyleClass("redCircle--active");
        },
        onQ2Q3Press: function () {
            // Pokazuje sekcję Q2/Q3, ukrywa sekcję Q1
            this.getView().byId("q1Section").setVisible(false);
            this.getView().byId("q2q3Section").setVisible(true);

            var oButtonQ2 = this.getView().byId("btnQ2Q3");
            oButtonQ2.addStyleClass("redCircle--active");
            var oButtonQ1 = this.getView().byId("btnQ1");
            oButtonQ1.removeStyleClass("greenCircle--active");
        },
        onButtonReceipt: async function () {
            // Logika zatwierdzania dla Q1
            try{
                let selectedOrder = this.getView().getModel("viewModel").getData();
                let oPodController = this.getPodController();
                let oPodSelectionModel = this.getPodSelectionModel();
                let aSelections = oPodSelectionModel.getSelections();  
                if(aSelections.length < 1){ return; };
                this.getView().setBusyIndicatorDelay(0);
                this.getView().setBusy(true); 
                let aSelectionFirstRow = aSelections[0];
                let oResource = await ResourceRepository.getResourceInstance(this, oPodController.getUserPlant(), oPodSelectionModel.resource.resource);
                let oReceiptParameters = { plant : oPodController.getUserPlant(),
                    order: aSelectionFirstRow.getShopOrder().getShopOrder(),
                    material: selectedOrder.selectedOrder.materialNumber,
                    materialVersion: aSelectionFirstRow.getSfcData().getMaterialVersion(),
                    quantity: parseInt(this.byId("inputReceiptQuantity").getValue()),
                    palletesNumber: parseInt(this.byId("inputPalleteQuan").getValue()),
                    packageNumber: parseInt(this.byId("inputPackageQuan").getValue()),
                    maxQuantity: selectedOrder.selectedOrder.maxQuantity,
                    maxLeftQuantity: selectedOrder.selectedOrder.maxLeftQuantity,
                    unitOfMeasure: "",		
                    sfc: aSelectionFirstRow.getSfc().getSfc(),
                    storageLocation: "",
                    resource: oPodSelectionModel.resource.resource,
                    sfcQuantity: parseInt(aSelectionFirstRow.getSfcData().getQuantity()),
                    operationActivity: aSelectionFirstRow.getSfcData().getOperation(),
                    workCenter: oPodSelectionModel.workCenter,
                    printingCopies: parseInt(this.byId("rbg1").getSelectedButton().getText()),
                    printer: oResource.getPrinterId(),
                    salesOrder: selectedOrder.selectedOrder.salesOrder,
                    salesOrderItem: selectedOrder.selectedOrder.salesOrderItem,
                    itemNumber: selectedOrder.selectedOrder.itemNumber,
                    itemNumberErp: selectedOrder.selectedOrder.itemNumberErp,
                    quantityPerPalletMax: selectedOrder.selectedOrder.quantityPerPalletMax,
                    quantityPerPalletMin: selectedOrder.selectedOrder.quantityPerPalletMin,
                    routing: aSelectionFirstRow.getSfcData().getRouting(),
                    routingVersion: aSelectionFirstRow.getSfcData().getRoutingVersion() };
                
                ///uruchamianie nowego kodu
                    let oSfcReceipt = new SfcMOReceipt(this, oReceiptParameters);
                    await oSfcReceipt.executeReceipt();
                    selectedOrder.selectedOrder.deliveredQuantity = selectedOrder.selectedOrder.deliveredQuantity + oReceiptParameters.palletesNumber * oReceiptParameters.packageNumber * oReceiptParameters.quantity;
                    this.getView().getModel("viewModel").setData(selectedOrder);
                    this.getView().setBusy(false);
                    // setTimeout( async ()=> { 
                    //     if(this._oResourceInstance.getMOSelectionMode().toUpperCase()==="AUTOMATIC"){
                    //         this._oOrderNumberPrevious = "";
                    //     }
                    //     await this._loadData();
                    // },1500);
                    

            }catch(oError){
                this.getView().setBusy(false);
                this._oErrorHandler.handleError(oError);
            }
        },
        onButtonQ23: async function(oEvent){
            try{
                let selectedCode = this.getView().byId("q23ReasonsList").getSelectedItem().getBindingContext("multiOrdersModel").getObject();
                let selectedOrder = this.getView().getModel("viewModel").getData();
                let oPodController = this.getPodController();
                let oPodSelectionModel = this.getPodSelectionModel();
                let aSelections = oPodSelectionModel.getSelections();  
                if(aSelections.length < 1){ return; };
                let aSelectionFirstRow = aSelections[0];

                this.getView().setBusyIndicatorDelay(0);
                this.getView().setBusy(true);

    
                let q23Parameters = {   quantity: parseInt(this.byId("inputQ23").getValue()),
                                        leftQuantity: selectedOrder.selectedOrder.leftQuantity,
                                        plant: oPodController.getUserPlant(),
                                        workCenter: oPodSelectionModel.workCenter,
                                        resource: oPodSelectionModel.resource.resource,
                                        order: aSelectionFirstRow.getShopOrder().getShopOrder(),
                                        sfc: aSelectionFirstRow.getSfc().getSfc(),
                                        operationActivity: aSelectionFirstRow.getSfcData().getOperation(),
                                        isCommentRequired: selectedCode.dataType ==="NC_DATA_COMMENT_REQUIERED",
                                        nonconformanceCode: selectedCode.code,
                                        nonconformanceCodeDescription: selectedCode.codeDescription,
                                        resourceReasonCode: selectedCode.resourceReasonCode,
                                        oeeCode: selectedCode.oeeCode,
                                        salesOrder: selectedOrder.selectedOrder.salesOrder,
                                        salesOrderItem: selectedOrder.selectedOrder.salesOrderItem,
                                        itemNumber: selectedOrder.selectedOrder.itemNumber,
                                        itemNumberErp: selectedOrder.selectedOrder.itemNumberErp,
                                        material: selectedOrder.selectedOrder.materialNumber,
                                        routing: aSelectionFirstRow.getSfcData().getRouting(),
                                        routingVersion: aSelectionFirstRow.getSfcData().getRoutingVersion()  };


                let oSfcQ23 = new SfcQ23(this, q23Parameters);
                await oSfcQ23.executeMO();



                this.getView().setBusy(false);
            }catch(oError){
                this.getView().setBusy(false);
                this._oErrorHandler.handleError(oError);
            }            
        },

        onQ3SelectionChange: function (oEvent) {
            
        },
        onDekorPress: function() {
            // Pobierz dane decors z modelu viewModel
            let oViewModel = this.getView().getModel("viewModel");
            let oGraphicToDisplay = oViewModel.getProperty("/selectedOrder/decors");
        
            if (!oGraphicToDisplay || oGraphicToDisplay.length < 1) {
                sap.m.MessageToast.show("Brak grafik do wyświetlenia.");
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
                            src: oGraphic.graphicUrl, // Zakładamy, że obiekt zawiera pole graphicUrl
                            decorative: false,
                            alt: oGraphic.graphicName, // Zakładamy, że obiekt zawiera pole graphicName
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
        onReceiptInputLiveChange: function(oEvent) {
            var value = oEvent.getParameter("value");
            var newValue = value.replace(/[^0-9]/g, ''); 
            if (value !== newValue) {
                oEvent.getSource().setValue(newValue);
            }
        },
        onOrderSelect: function(oEvent) {
            var oTable = oEvent.getSource();
            var oSelectedItem = oTable.getSelectedItem();
            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext("multiOrdersModel");
                var oData = oContext.getObject();
        
                var oViewModel = this.getView().getModel("viewModel");
                oViewModel.setProperty("/selectedOrder", oData);
                oSelectedItem.addStyleClass("selectedRowBackground");

                if(this._oPreviousSelectedItem){
                    this._oPreviousSelectedItem.removeStyleClass("selectedRowBackground");
                }
                this._oPreviousSelectedItem = oSelectedItem;

            }
        },
        onOrdersTableUpdateFinished: function(oEvent) {
            var oTable = this.getView().byId("ordersTable");
            var aItems = oTable.getItems();
            if (aItems.length > 0) {
                oTable.setSelectedItem(aItems[0]);
                // Możesz od razu uzupełnić dane w modelu viewModel
                var oContext = aItems[0].getBindingContext("multiOrdersModel");
                var oData = oContext.getObject();
                this.getView().getModel("viewModel").setProperty("/selectedOrder", oData);
            }
        },
        onSalesTextPress: function () {
            let orderItemDetails = this.getView().getModel("viewModel").getData();

            let salesText = orderItemDetails.selectedOrder.salesText.replaceAll("$&","\n");
        
            // Wyświetl tekst sprzedażowy jako komunikat
            if (salesText) {
                sap.m.MessageBox.information(salesText);
            } else {
                sap.m.MessageBox.information("Brak tekstu sprzedażowego dla wybranej pozycji.");
            }
        },

        calculateProgress: function(deliveredQuantity, quantity) {
            if (!quantity || quantity === 0) {
                return 0; // Zapobiega dzieleniu przez zero
            }
            return (deliveredQuantity / quantity) * 100; // Oblicza procent
        },
        
        formatProgressText: function(deliveredQuantity, quantity) {
            return deliveredQuantity + " z " + quantity; // Tworzy tekst w formacie X / Y
        },
        onFileViewPress: function(oEvent){
            let oItem = oEvent.getSource().getParent().getBindingContext("viewModel").getObject();
            let sLink = oItem.fileLink;
        
            if (sLink) {
                window.open(sLink, "_blank");
            }
        },
        _setFieldVisibility: async function(){
            try{
                let oPodSelectionModel = this.getPodSelectionModel();
                let oWorkCenter = oPodSelectionModel.workCenter;
                let oResourceNumber = oPodSelectionModel.resource.resource;
                let oResource = await ResourceRepository.getResourceInstance(this, this.getPodController().getUserPlant(), oResourceNumber);
                let oFunctionalLocation = oResource.getQ1Scheme();


                if(!this._resourceNumber || this._resourceNumber !== oResourceNumber){
                    this._setPrintQuantity(oResource.getQ1LabelCopies());
                    this._resourceNumber === oResourceNumber;
                }
                if(oFunctionalLocation==="1"){
                    this.byId("inputPackageQuan").setVisible(true);
                    this.byId("inputPackageQuanLabel").setVisible(true);

                    this.byId("inputPalleteQuanLabel").setVisible(false);
                    this.byId("inputPalleteQuan").setVisible(false);

                }else if(oFunctionalLocation==="2"){
                    this.byId("inputPackageQuan").setVisible(true);
                    this.byId("inputPackageQuanLabel").setVisible(true);

                    this.byId("inputPalleteQuanLabel").setVisible(true);
                    this.byId("inputPalleteQuan").setVisible(true);
                    //wszystko

                }else if(oFunctionalLocation==="3"){
                    this.byId("inputPackageQuan").setVisible(false);
                    this.byId("inputPackageQuanLabel").setVisible(false);

                    this.byId("inputPalleteQuanLabel").setVisible(true);
                    this.byId("inputPalleteQuan").setVisible(true);
                }else{
                    let oModelData = this.getView().getModel().getData();
                    this.byId("inputPackageQuan").setVisible(false);
                    this.byId("inputPackageQuanLabel").setVisible(false);

                    this.byId("inputPalleteQuanLabel").setVisible(false);
                    this.byId("inputPalleteQuan").setVisible(false);

                    // if(oModelData.isCustomQuan){
                    //     this.byId("inputReceiptQuantityLabel").setText(this._oTextHandler.getText("labels.q1.inputQuantityLabelPallet"));
                    // }else{
                    //     this.byId("inputReceiptQuantityLabel").setText(this._oTextHandler.getText("labels.q1.inputQuantityLabel"));
                    // }
                }
                this.getView().byId("btnOrderAssign").setVisible(this._oOrder.getOARequired());

            }catch(oError){
            }
        },
        _setSelectedFirstPosition: function(index){
            try{
                let positionItems = this.getView().byId("ordersTable").getItems();
                for(let i=0;i<positionItems.length;i++){
                    let item = positionItems[i];
                    if(i===index){
                        item.addStyleClass("selectedRowBackground");
                        this._oPreviousSelectedItem = item;
                    }else{
                        item.removeStyleClass("selectedRowBackground");
                    }
                }
                
            }catch(oError){
                debugger;
            }


        },

        onOrderAssign: function(){
            if (!this._OADialog) {
                Fragment.load({
                    name: "ibc.dm.plugins.vPlgMultiOrders.vPlgMultiOrders.fragment.AssignOrderWindow",
                    controller: this
                }).then(oDialog => {
                    this._OADialog = oDialog;
                    this.getView().addDependent(oDialog);
                    this._setOADialogValues();
                    oDialog.open();
                });
            } else {
                this._setOADialogValues();
                this._OADialog.open();
            }
            
        },
        onCloseOADialog: function () {
            this._OADialog.close();
        },
        onOkOADialog: async function () {
            try{
                //this._oOrder
                let orderInput = sap.ui.getCore().byId("orderInput").getValue();
                let orderInputDate = sap.ui.getCore().byId("orderInputDate").getValue();
                await this._orderInputChecks(orderInput, orderInputDate);

                this._oOrder.setOrderInput(orderInput);
                this._oOrder.setOrderInputDate(orderInputDate);
                await this._oOrder.saveCustomData();

                this._OADialog.close();
            }catch(oError){
                this._oErrorHandler.handleError(oError);
            }

            
        },
        _orderInputChecks: async function(orderInput, orderInputDate){
            let orderInputInstance;
            if(!orderInput){
                this._oErrorHandler.throwErrorPopup("error.multiOrders.noOrderInput");
            }

            if(!orderInputDate){
                this._oErrorHandler.throwErrorPopup("error.multiOrders.noOrderInputDate");
            }

            var oRegExp = /^\d{4}-\d{2}-\d{2}$/;
            if (!oRegExp.test(orderInputDate)) {
                this._oErrorHandler.throwErrorPopup("error.multiOrders.OADateFormat");
            }

            try{
                orderInputInstance = await OrderRepository.readOrderByPassBuffer(this, this._oPlant, orderInput);

            }catch(oError){
                await this._dialogNoOAOrder(orderInput)
                //this._oErrorHandler.throwErrorPopup("Nie znaleziono zlecenia.");
            }

            if(orderInputInstance){
                let startOrderDate = orderInputInstance.getStartDate();
                let endOrderDate = orderInputInstance.getEndDate();

                if(!startOrderDate){
                    this._oErrorHandler.throwErrorPopup("error.multiOrders.OAOrderNotStarted")
                }
                let oRequestedDate = new Date(orderInputDate);
                let oStartOrderDate = new Date(startOrderDate);
                oStartOrderDate.setHours(0, 0, 0, 0);

                if(oStartOrderDate>oRequestedDate){
                    this._oErrorHandler.throwErrorPopup("error.multiOrders.OAWrongDate1")
                }

                if(endOrderDate){
                    let oEndOrderDate = new Date(startOrderDate);
                    if(oEndOrderDate<oRequestedDate){
                        this._oErrorHandler.throwErrorPopup("error.multiOrders.OAWrongDate2")
                    }

                }
            }

        },
        onChange: function (oEvent) {
            var oDatePicker = oEvent.getSource();
            var sValue = oDatePicker.getValue();
            
            // RegExp do walidacji formatu "yyyy-MM-dd"
            var oRegExp = /^\d{4}-\d{2}-\d{2}$/;
            
            if (!oRegExp.test(sValue)) {
                // Jeśli wartość nie pasuje do formatu, ustawienie błędu
                oDatePicker.setValueState(sap.ui.core.ValueState.Error);
                oDatePicker.setValueStateText("error.multiOrders.OADateFormat");
            } else {
                // Jeśli wartość jest poprawna, usuwamy błąd
                oDatePicker.setValueState(sap.ui.core.ValueState.None);
            }
        },
        _setOADialogValues: function(){
            let oInputOrderValue = this._oOrder.getInputOrder();
            let oInputOrderDateValue = this._oOrder.getInputOrderDate();
            let orderInput = sap.ui.getCore().byId("orderInput");
            let orderInputDate = sap.ui.getCore().byId("orderInputDate")

            orderInput.setValue(oInputOrderValue);
            orderInputDate.setValue(oInputOrderDateValue);
        },

        _dialogNoOAOrder: async function(orderInput){
            return await new Promise((resolve,reject)=>{
                this._resolveNoOrder = resolve;
                this._rejectNoOrder = reject;
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new sap.m.Dialog({
                        type: mobileLibrary.DialogType.Message,
                        title: this._oTextHandler.getText("error.multiOrders.noAOOrderTitle"),
                        content: new sap.m.Text({ text: this._oTextHandler.getText("error.multiOrders.noAOOrderQuestion") }),
                        beginButton: new sap.m.Button({
                            type: mobileLibrary.ButtonType.Emphasized,
                            text: this._oTextHandler.getText("error.multiOrders.noAOOrderYes"),
                            press: async function () {
                                    this.oApproveDialog.close();
                                    this._resolveNoOrder();
                            }.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: this._oTextHandler.getText("error.multiOrders.noAOOrderNo"),
                            press: function () {
                                this.oApproveDialog.close();
                                this._rejectNoOrder({ message: "",
                                                        displayType: "NO_DISPLAY" })
                                this._oErrorHandler.throwErrorNoDisplay("");
                            }.bind(this)
                        })
                    });
                }

               this.oApproveDialog.open();
            });
        },
        _refreshSelectedOrder: function(oPositions){
            try{
                let viewModel = this.getView().getModel("viewModel");
                let viewModelData = viewModel.getData();
                let selectedPosition = oPositions.find( position => { return position.itemNumber === viewModelData.selectedOrder.itemNumber });
                if(selectedPosition){
                    viewModelData.selectedOrder = selectedPosition;
                    viewModel.setData(viewModelData);
                }

            }catch(oError){

            }
        },
        _selectPositionAfterLoad: function(positions){
            debugger;
            let selectionMode = this._oResourceInstance.getMOSelectionMode();

            const result = positions.reduce((acc, row, index) => {
                if ( acc.selectedRow.plannedReceipts <= acc.selectedRow.executedReceipts && row.plannedReceipts > row.executedReceipts && selectionMode.toUpperCase() === "AUTOMATIC" ) {
                  return { selectedRow: row, index: index };
                }
                return acc;
              }, { selectedRow: positions[0], index: 0 });


            return result;
        },
        _setPrintQuantity: function(printQuantity){
            this.byId("rbg1").setSelectedIndex(printQuantity);
        }

	});
});