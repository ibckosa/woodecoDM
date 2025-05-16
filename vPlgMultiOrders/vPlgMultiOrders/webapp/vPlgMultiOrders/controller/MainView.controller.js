sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/NcCodesReader",
    "ibc/dm/plugins/wcPodToolsProvider/SfcMOReceipt",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository"
], function (jQuery, PluginViewController, JSONModel, ErrorHandler, TextHandler, OrderRepository, NcCodesReader, SfcMOReceipt, ResourceRepository) {
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




        onAfterRendering: function(){
           
            // this.getView().byId("backButton").setVisible(this.getConfiguration().backButtonVisible);
            // this.getView().byId("closeButton").setVisible(this.getConfiguration().closeButtonVisible);
            
            // this.getView().byId("headerTitle").setText(this.getConfiguration().title);
            // this.getView().byId("textPlugin").setText(this.getConfiguration().text); 
        },

		onBeforeRenderingPlugin: async function () {
            this.subscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.subscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
			await this._loadData();
			
		},

        isSubscribingToNotifications: function() {
            
            var bNotificationsEnabled = true;
           
            return bNotificationsEnabled;
        },


        getCustomNotificationEvents: function(sTopic) {
            //return ["template"];
        },

        onPodSelectionChangeEvent: function (sChannelId, sEventId, oData) {
            this.loadModel();
        },

        onOperationChangeEvent: function (sChannelId, sEventId, oData) {
            //this.loadModel();
        },

        onWorkListSelectEvent: function (sChannelId, sEventId, oData) {
            this.loadModel();
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
            debugger;
            try {
                var oPodSelectionModel = this.getPodSelectionModel();
                var aSelections = oPodSelectionModel.getSelections(); 
                var oFirstSelection = aSelections[0]; 
                this._oPlant = this.getPodController().getUserPlant();
                this._oOrderNumber = oFirstSelection.getShopOrder().getShopOrder();
                this._oWorkCenter = oPodSelectionModel.workCenter;
                this._oResource = oPodSelectionModel.resource.resource;
                this._oOrder = await OrderRepository.readOrderByPassBuffer(this, this._oPlant, this._oOrderNumber);
                debugger;
                let oPositions = await this._oOrder.getOrderPositions();
                let oCodesTab = await NcCodesReader.readCodes(this, this._oPlant, this._oWorkCenter, this._oResource);
                const oModel = new JSONModel({ positions: oPositions, codes: oCodesTab });
                this.getView().setModel(oModel, "multiOrdersModel");
                if(oPositions.length > 0){
                    let oFirstPosition = oPositions[0];
                    var oViewModel = this.getView().getModel("viewModel");
                    oViewModel.setProperty("/selectedOrder", oFirstPosition);
                    
                }
            } catch (error) {
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
                debugger;   
                let aSelectionFirstRow = aSelections[0];
                let oResource = await ResourceRepository.getResourceInstance(this, oPodController.getUserPlant(), oPodSelectionModel.resource.resource);
                let oReceiptParameters = { plant : oPodController.getUserPlant(),
                    order: aSelectionFirstRow.getShopOrder().getShopOrder(),
                    material: aSelectionFirstRow.getSfcData().getMaterial() ,
                    materialVersion: aSelectionFirstRow.getSfcData().getMaterialVersion(),
                    quantity: parseInt(this.byId("inputReceiptQuantity").getValue()),
                    unitOfMeasure: "",		
                    sfc: aSelectionFirstRow.getSfc().getSfc(),
                    storageLocation: "",
                    resource: oPodSelectionModel.resource.resource,
                    sfcQuantity: parseInt(aSelectionFirstRow.getSfcData().getQuantity()),
                    operationActivity: aSelectionFirstRow.getSfcData().getOperation(),
                    workCenter: oPodSelectionModel.workCenter,
                    palletesNumber: parseInt(this.byId("inputPackageQuan").getValue()),
                    printingCopies: parseInt(this.byId("rbg1").getSelectedButton().getText()),
                    packageNumber: parseInt(this.byId("inputPalleteQuan").getValue()),
                    printer: oResource.getPrinterId(),
                    salesOrder: selectedOrder.selectedOrder.salesOrder,
                    salesOrderItem: selectedOrder.selectedOrder.salesOrderItem                };
                
                ///uruchamianie nowego kodu
                    let oSfcReceipt = new SfcMOReceipt(this, oReceiptParameters);
                    await oSfcReceipt.executeReceipt();
                    this._reloadQ1Plugin = true;
                    this.getView().setBusy(false);

            }catch(oError){
                this.getView().setBusy(false);
                this._oErrorHandler.handleError(oError);
            }
        },
        onWadyAcceptPress: function () {
            // zatwierdzania dla wad 
            var wadyCiecia = this.getView().byId("wadyCiecia").getValue();
            
            // logika zatwierdzania wad
            sap.m.MessageToast.show("Zatwierdzono wady cięcia: " + wadyCiecia + " sztuk");
        },
        onQ3SelectionChange: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var selectedCode = oSelectedItem.getKey();
                var selectedDescription = oSelectedItem.getText();
        
                // Wyświetl komunikat lub wykonaj inne działania z wybraną wartością
                sap.m.MessageToast.show("Wybrana przyczyna: " + selectedDescription + " (Kod: " + selectedCode + ")");
        
                // Zamknięcie listy rozwijanej
                var oComboBox = this.byId("q3ReasonsList");
                oComboBox.close();
        
                // Opcjonalnie: ustawienie danych w modelu
                var oViewModel = this.getView().getModel("viewModel");
                oViewModel.setProperty("/selectedReason", {
                    code: selectedCode,
                    description: selectedDescription
                });
            }
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
            // Pobierz dane wybranej pozycji z modelu viewModel
            var oViewModel = this.getView().getModel("viewModel");
            var sSalesText = oViewModel.getProperty("/selectedOrder/salesText");
        
            // Wyświetl tekst sprzedażowy jako komunikat
            if (sSalesText) {
                sap.m.MessageToast.show("Tekst sprzedażowy: " + sSalesText);
            } else {
                sap.m.MessageToast.show("Brak tekstu sprzedażowego dla wybranej pozycji.");
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

	});
});