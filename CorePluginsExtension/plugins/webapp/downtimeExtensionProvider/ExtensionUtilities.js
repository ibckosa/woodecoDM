sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/downtimeExtensionProvider/control/DowntimeListButton",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "sap/dm/dme/model/AjaxUtil",
], function (BaseObject, DowntimeListButton, TextHandler, ResourceRepository, ErrorHandler, AjaxUtil) {
    "use strict";

    /**
     * Get the object needed to instantiate a control with the same settings as oControl.
     *
     * Can be used to apply the properties of one control to a new instance of a
     * different control (such as making a custom DowntimeListButton with the same
     * properties, bindings, and events as the original sap.m.Button it replaced).
     */
    function getSettingsForControl(oControl, oController) {
        let oProperties = oControl.getMetadata().getAllProperties();

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

    return BaseObject.extend("ibc.dm.plugins.downtimeExtensionProvider.ExtensionUtilities", {
        constructor: function () {
            this.bLogToConsole = false;
            this._oTextHandler = new TextHandler();
        },

        extendDowntimesTable: function(oTable, oController){
            this._oErrorHandler = new ErrorHandler(oController);
            this._oController = oController;
            this._oTable = oTable;
                let oButtonParent = oController.getView().byId("editDT").getParent();
                if(!this._initialized){
                    this._initialized = true;
                    oButtonParent.insertContent( new sap.m.Button({ text: "Zgłoszenie DUR", type: "Emphasized", press: this._onSendpress.bind(this) }), 4);
                }
                this._oTableExtended = true;
                let oColumns = oTable.getColumns();
                let bColumnExists = oColumns.some(function (oColumn) { return oColumn.getId() === "textAreaCol";  });
                
                oColumns[15].setVisible(false);
                if(bColumnExists===false){
                    let oNewColumn = new sap.m.Column({ header: new sap.m.Label({ text: this._oTextHandler.getText("labels.notifications.comment") }), id: "textAreaCol", visible: true });
                    this._myColIndex = oColumns.length;
                    oTable.insertColumn(oNewColumn, this._myColIndex)
                    let omyCol = oTable.getColumns()[oTable.getColumns().length - 1];
                    let omycolhed = omyCol.getHeader();
                    debugger;
                }else if(this._myColIndex){
                    let omyCol = oTable.getColumns()[this._myColIndex];
                    let omyColid = omyCol.getId();
                    omyCol.setHeader(new sap.m.Label({ text: this._oTextHandler.getText("labels.notifications.comment") }));
                    omyCol.setVisible(true);
                }
                
                for(const item of oTable.getItems()){
                    if(oTable.getColumns().length > item.getCells().length)
                        item.insertCell(new sap.m.TextArea({ value: "{comments}" }), item.getCells().length);
                }

            // let oBinding2 = oController.dateModelForDowntime;
            // let oTable2 = oController.getView().byId("downtimeTable");
            // let oBindingInfo = oTable.getBindingInfo("items");
            // let oRowTemplate = oBindingInfo.template;
            // let oCells = oRowTemplate.getCells();
            // let oCellsCount = oCells.length;
            // let oData = oTable.getModel().getData();
            // let oItems = oTable.getItems();
            // let oBinding = oTable.getBinding();
            // for(const item of oItems){
            //     let oItemData = item.getBindingContext().getObject();
            // }

        },
        /**
         * Replace any sap.m.Button cells with our custom DowntimeListButton
         * while keeping the same properties, bindings, and event listeners
         */
        replaceDowntimeListButtons: function (oTable, sButtonHeight, oController) {
            let oBindingInfo = oTable.getBindingInfo("items");
            let oRowTemplate = oBindingInfo.template;
            let aCells = oRowTemplate.getCells();
            let aButtonCellIndices = [];
            let aLayoutCellIndices = [];

            // find all cells with buttons
            for (let i = 0; i < aCells.length; i++) {
                if (aCells[i].getMetadata().getElementName() === "sap.m.Button") {
                    aButtonCellIndices.push(i);
                }
            }

            // find all cells with buttons
            for (let i = 0; i < aCells.length; i++) {
                if (aCells[i].getMetadata().getElementName() === "sap.ui.layout.HorizontalLayout") {
                    aLayoutCellIndices.push(i);
                }
            }

            // for each button, replace it with a custom DowntimeListButton
            for (let i = 0; i < aButtonCellIndices.length; i++) {
                let iCellIndex = aButtonCellIndices[i];
                let oCellSettings = getSettingsForControl(aCells[iCellIndex], oController);

                let oNewButton = new DowntimeListButton(Object.assign(oCellSettings, {
                    height: sButtonHeight
                }));

                oRowTemplate.removeCell(aCells[iCellIndex]);
                oRowTemplate.insertCell(oNewButton, iCellIndex);
            }

            // for each layout, replace it with a custom DowntimeListButton
            for (let i = 0; i < aLayoutCellIndices.length; i++) {
                let iCellIndex = aLayoutCellIndices[i];
                let oCellSettings = getSettingsForControl(aCells[iCellIndex].getContent()[0], oController);

                let oNewButton = new DowntimeListButton(Object.assign(oCellSettings, {
                    height: sButtonHeight
                }));

                oRowTemplate.removeCell(aCells[iCellIndex]);
                var oHorizontalLayout = new sap.ui.layout.HorizontalLayout();
                oHorizontalLayout.setAllowWrapping(true);
                oHorizontalLayout.addContent(oNewButton);
                oHorizontalLayout.addContent(aCells[iCellIndex].getContent()[1])
                oRowTemplate.insertCell(oHorizontalLayout, iCellIndex);
            }

            // modifying the template in-place does nothing until rebound
            oTable.bindItems(oBindingInfo);
        },

        setLogToConsole: function (bLogToConsole) {
            this.bLogToConsole = bLogToConsole;
        },

        logMessage: function (sMessage, oData) {
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
        _onSendpress: async function(oEvent){
            if(this._oController && this._oTable){
                try{
                    let selectedItems = this._oTable.getSelectedItems();
                    for(const item of selectedItems){
                        await this._sendToErp(item.getBindingContext().getObject());
                        await this._editDownTime(item.getBindingContext().getObject());
                        debugger;                        
                    }
                }catch(oError){
                    this._oErrorHandler.handleError(oError);
                }
            }
        },
        _sendToErp: async function(oItem){
            debugger;
            let oEndPoint = this._getNotifEndpoint();
            let oPlant = this._oController.getPodController().getUserPlant();
            oItem.comments = `Wysłane do DUR\n${oItem.comments}`;
            let oDescription = oItem.comments.replaceAll("Wysłane do DUR\n", "");
            oDescription = oDescription.replaceAll("\n", "|@#|");
            let oDate = new Date(oItem.actualStart);
            const year = oDate.getFullYear();
            const month = String(oDate.getMonth() + 1).padStart(2, '0'); // miesiąc jest od 0, więc dodajemy 1
            const day = String(oDate.getDate()).padStart(2, '0');
            const hours = String(oDate.getHours()).padStart(2, '0');
            const minutes = String(oDate.getMinutes()).padStart(2, '0');
            const seconds = String(oDate.getSeconds()).padStart(2, '0');

            let oResource = await ResourceRepository.getResourceInstance(this._oController, oPlant, oItem.resource);

            let oParameters = {
                DESCRIPTION: oDescription,
                ORDER: oResource.getFunctionalLocation(),
                PLANT: oPlant,
                SHORTTEXT: oItem.reasonCodeDescription,
                STARTDATE: `${year}${month}${day}`,
                STARTTIME: `${hours}${minutes}${seconds}`
            };

            let sUrl = this._oController.getPublicApiRestDataSourceUri() + oEndPoint + "&async=false";
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        debugger;
                        reject(oError);
                    }   
                );

            });
        },
        _getNotifEndpoint: function(){
            let oReturn = "";
            try{
                let oEndPoint = this._oController.getConfigurationValue("notifEndpoint");
                if(oEndPoint){
                    oReturn = oEndPoint;
                }
            }catch(oError){}
            return oReturn;
        },
        _editDownTime: async function(oItem){
            let oUrl = this._oController.oeeTransactionUrl + "downtimes";
            let oPlant = this._oController.getPodController().getUserPlant();

            let oParameters = {
                plant: oPlant,
                resource: oItem.resource,
                startDateTime: oItem.actualStart,
                updateDowntimes: [{
                    plant: oPlant,
                    resource: oItem.resource,
                    startDateTime: oItem.actualStart,
                    endDateTime: oItem.endDateTime,
                    markParentDown: oItem.markParentDown,
                    comments: oItem.comments,
                    reasonCodeId: oItem.reasonCodeId,
                    status: oItem.status
                }]
            };

            return await new Promise((resolve,reject)=>{
                AjaxUtil.put(oUrl, oParameters,
                    (oResponseData) => {
                        this._oController.publish("DowntimeChangeEvent", this._oController);
                        this._oController.getDownTimes();
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });

        }

    })
});