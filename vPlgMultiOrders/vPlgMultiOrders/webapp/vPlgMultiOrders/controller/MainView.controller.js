sap.ui.define([
    'jquery.sap.global',
	"sap/dm/dme/podfoundation/controller/PluginViewController",
	"sap/ui/model/json/JSONModel",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/NcCodesReader"
], function (jQuery, PluginViewController, JSONModel, ErrorHandler, TextHandler, OrderRepository, NcCodesReader) {
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
		},




        onAfterRendering: function(){
           
            this.getView().byId("backButton").setVisible(this.getConfiguration().backButtonVisible);
            this.getView().byId("closeButton").setVisible(this.getConfiguration().closeButtonVisible);
            
            this.getView().byId("headerTitle").setText(this.getConfiguration().title);
            this.getView().byId("textPlugin").setText(this.getConfiguration().text); 
            //zaznaczenie Q1 i pierwszego wiersza 
            this.onQ1Press();
            var oTable = this.getView().byId("ordersTable");
    var aItems = oTable.getItems();
    if (aItems.length > 0) {
        var oFirstItem = aItems[0];
        oTable.setSelectedItem(oFirstItem); // Zaznacz pierwszy wiersz

        // Pobierz dane pierwszego wiersza i ustaw w modelu viewModel
        var oContext = oFirstItem.getBindingContext("multiOrdersModel");
        var oData = oContext.getObject();
        var oViewModel = this.getView().getModel("viewModel");
        oViewModel.setProperty("/selectedOrder", oData);
    }
        },

		onBeforeRenderingPlugin: async function () {

			await this._loadData();
			
		},

        isSubscribingToNotifications: function() {
            
            var bNotificationsEnabled = true;
           
            return bNotificationsEnabled;
        },


        getCustomNotificationEvents: function(sTopic) {
            //return ["template"];
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


		},
        _loadData: async function () {
            debugger;
            try {
                var oPodSelectionModel = this.getPodSelectionModel();
                var aSelections = oPodSelectionModel.getSelections(); 
                var oFirstSelection = aSelections[0]; // pierwszy element tablicy
                this._oPlant = this.getPodController().getUserPlant();
                this._oOrderNumber = oFirstSelection.getShopOrder().getShopOrder();
                this._oWorkCenter = oPodSelectionModel.workCenter;
                this._oResource = oPodSelectionModel.resource.resource;
                this._oOrder = await OrderRepository.readOrderByPassBuffer(this, this._oPlant, this._oOrderNumber);
                debugger;
                let oPositions = await this._oOrder.getOrderPositions();
                let oCodesTab = await NcCodesReader.readCodes(this, this._oPlant, this._oWorkCenter, this._oResource);
                // const aLinks = await LinkReader.readLinks(oController, oSfcNumber, oOrderNumber);
                const oModel = new JSONModel({ positions: oPositions, codes: oCodesTab });
                this.getView().setModel(oModel, "multiOrdersModel");
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
        onConfirmPress: function () {
            // Logika zatwierdzania dla Q1
            var numPallets = this.getView().byId("numPallets").getValue();
            var qtyInPallet = this.getView().byId("qtyInPallet").getValue();
            
            // Tu dodać logikę zatwierdzania
            sap.m.MessageToast.show("Zatwierdzono: " + numPallets + " palet, " + qtyInPallet + " sztuk na palecie");
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
            return deliveredQuantity + " / " + quantity; // Tworzy tekst w formacie X / Y
        },

	});
});