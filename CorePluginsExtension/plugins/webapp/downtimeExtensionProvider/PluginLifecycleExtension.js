sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginControllerExtension",
    "sap/ui/core/mvc/OverrideExecution",
    "sap/dm/dme/podfoundation/controller/extensions/LifecycleExtensionConstants",
    "sap/dm/dme/oeetransactionplugins/downtimePlugin/utils/Formatter",
    "sap/dm/dme/util/PlantSettings",
    "sap/dm/dme/oeetransactionplugins/downtimePlugin/utils/AjaxUtil"
], function (PluginControllerExtension, OverrideExecution, LifecycleConstants, formatter, PlantSettings, AjaxUtil) {
    "use strict";

    const oOverrideExecution = {};
    oOverrideExecution[LifecycleConstants.ON_BEFORE_RENDERING] = OverrideExecution.After;
    oOverrideExecution[LifecycleConstants.ON_BEFORE_RENDERING_PLUGIN] = OverrideExecution.After;
    oOverrideExecution[LifecycleConstants.ON_AFTER_RENDERING] = OverrideExecution.After;
    oOverrideExecution[LifecycleConstants.ON_EXIT] = OverrideExecution.After;

    return PluginControllerExtension.extend("ibc.dm.plugins.downtimeExtensionProvider.LifecycleExtension", {
        constructor: function (oExtensionUtilities) {
            this._oExtensionUtilities = oExtensionUtilities;
            let controller = this.getController();

        },

        getOverrideExecution: function(sOverrideMember) {
            if (oOverrideExecution.hasOwnProperty(sOverrideMember)) {
                return oOverrideExecution[sOverrideMember];
            }
            return null;
        },

        /**
         * Returns the name of the core extension this overrides
         *
         * @returns {string} core extension name
         * @public
         */
        getExtensionName: function () {
            return LifecycleConstants.EXTENSION_NAME;
        },

        onBeforeRendering: function(oEvent){
            if (!this._bInitialized) {
                let oConfiguration = this.getController().getConfiguration();
                if (oConfiguration && oConfiguration.hasOwnProperty("logToConsole")) {
                    this._oExtensionUtilities.setLogToConsole(oConfiguration.logToConsole);
                } else {
                    this._oExtensionUtilities.setLogToConsole(false);
                }
                this._bInitialized = true;
            }
            this._oExtensionUtilities.logMessage("LifecycleExtension.onBeforeRendering: Downtime extension");
            let controller = this.getController();
            let hoursFromConfiguration = this.getHoursRangeFromConfiguration();
            controller.getHoursRangeFromConfiguration = function(){
                let result = 24;
                var oController = this;
                try{
                    let configuration = oController.getConfiguration();
                    if(configuration.downTimeHoursRange){
                        result = parseInt(configuration.downTimeHoursRange);

                        if(result>120){
                            result = 120;
                        }
                        if(result<=0){
                            result = 24;
                        }
                    }

                }catch(error){}

                return result;
            }

            controller.getDownTimes = function (oEvent) {
                var sQueryString = "";
                var oController = this;
                var url = this.oeeTransactionUrl + "downtimes";
                var startTime, endTime;
                if (oController.defaultWorkcenterBO) {
                    endTime = formatter.dmcDateToUTCFormat(oController.shiftEndTimestamp, PlantSettings.getTimeZone());
                    startTime = formatter.dmcDateToUTCFormat(oController.shiftStartTimestamp, PlantSettings.getTimeZone());
                    const originalDate = new Date(startTime);
                    originalDate.setUTCHours(originalDate.getUTCHours() - oController.getHoursRangeFromConfiguration());
                    startTime = originalDate.toISOString();
                    url = oController.oeeTransactionUrl + "downtimes?workcenter=" + jQuery.sap.encodeURL(oController.defaultWorkcenterBO) + "&startDateTime=" + startTime + "&endDateTime=" + endTime + "&includeNotifications=true";
                    AjaxUtil.get(url, sQueryString, function (data) {
                        try{
                            data.sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime));
                        }catch(error){}
                        
                        oController.downtimeFromGet = data;
                        oController.setDetailInDowntimes();
                        oController.oDownTimeModel.setData(oController.downtime);
                        oController.oDownTimeModel.refresh(true);
                        oController.handleTypeFilter(null, "All");
                        oController.onCancelAddEditDownTime(oEvent);
                        oController.entirePage.setBusy(false);
                    }, function (oError, sHttpErrorMessage) {
                        oController.entirePage.setBusy(false);
                        oController.onCancelAddEditDownTime(oEvent);
                        Messagebox.error(oError.error.message || sHttpErrorMessage);
                    });
                } else {
                    oController.onCancelAddEditDownTime(oEvent);
                    oController.entirePage.setBusy(false);
                }
            };
            controller.onSearch = function () {
                var url;
                var sQueryString = "";
                var oController = this;
                if (this.getView().byId("selectFromDateForDowntime").getValue() === "" || this.getView().byId("workcenterValueForDowntime").getValue() === "") {
                    this.handleFilterError(this.oBundle.getText("pod.filterWarning.TEXT"));
                    //Check if the selected from and to dates are within 30 days range.
                } else if (this.getView().byId("selectToDateForDowntime").getValue() !== "" && ((this.shiftEndTimestamp - this.shiftStartTimestamp) > (30 * 24 * 60 * 60 * 1000))) {
                    this.handleFilterError(this.oBundle.getText("pod.dateRangeExceed.TEXT"));
                    //Check if to date is earlier than from date.
                } else if (this.shiftEndTimestamp < this.shiftStartTimestamp) {
                    this.handleFilterError(this.oBundle.getText("pod.toDateEarlierThanFromDate.TEXT"));
                } else {
                    let endTime = formatter.dmcDateToUTCFormat(this.shiftEndTimestamp, PlantSettings.getTimeZone());
                    let startTime = formatter.dmcDateToUTCFormat(this.shiftStartTimestamp, PlantSettings.getTimeZone());
                    const originalDate = new Date(startTime);
                    originalDate.setUTCHours(originalDate.getUTCHours() - oController.getHoursRangeFromConfiguration());
                    startTime = originalDate.toISOString();

                    url = this.oeeTransactionUrl + "downtimes?workcenter=" + jQuery.sap.encodeURL(this.defaultWorkcenterBO) + "&startDateTime=" + startTime + "&endDateTime=" + endTime + "&includeNotifications=true";
                    AjaxUtil.get(url, sQueryString, function (data) {
                        try{
                            data.sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime));
                        }catch(error){}
                        oController.downtimeFromGet = data;
                        oController.setDetailInDowntimes();
                        oController.oDownTimeModel = new sap.ui.model.json.JSONModel();
                        oController.oDownTimeModel.setSizeLimit(10000);
                        oController.oDownTimeModel.setData(oController.downtime);
                        var downtimeTable = oController.getView().byId("downtimeTable");
                        downtimeTable.setModel(oController.oDownTimeModel);
                        oController.onSearchDT(undefined);
                        oController.getView().byId("searchDT").setValue("");
                        if (oController.aSorters.length > 0) {
                            let sortEvent = { mParameters: { reason: "Ok" } };
                            oController.onClose(sortEvent);
                        }
                        oController.handleTypeFilter(null, "All");
                        oController.entirePage.setBusy(false);
                        oController.bCollectAllDataPending = false;
                    }, this.handleErrorDuringCollectAllData.bind(this));
                }
            };

            //controller.getDownTimes();
            

            
        },

        onBeforeRenderingPlugin: function(oEvent){
            // let oTable = this.getController().getDowntimeTable();
            // this._oExtensionUtilities.extendDowntimesTable(oTable, this.getController());
            // this._oExtensionUtilities.logMessage("LifecycleExtension.onAfterRendering: Downtime extension");
            // let sHeight = "";
            // let oConfiguration = this.getController().getConfiguration();
            // if (oConfiguration && oConfiguration.hasOwnProperty("downtimeListButtonHeight")) {
            //     sHeight = oConfiguration.downtimeListButtonHeight;
            // }

            // let oTable = this.getController().getDowntimeTable();
            //this._oExtensionUtilities.replaceDowntimeListButtons(oTable, sHeight, this.getController());

            //this._oExtensionUtilities.logMessage("LifecycleExtension.onBeforeRenderingPlugin: Downtime extension");
            //this._oExtensionUtilities.extendDowntimesTable(oTable, this.getController());

        },

        onInit: function(oEvent){
        },

        onAfterRendering: function(oEvent){
            let oTable = this.getController().getDowntimeTable();
            oTable.attachEvent( "updateFinished", this.onUpdateFinished.bind(this) );
        },
        onUpdateFinished: function(oEvent){
            let oTable = this.getController().getDowntimeTable();
            this._oExtensionUtilities.extendDowntimesTable(oTable, this.getController());
        },

        onExit: function(oEvent){
            this._oExtensionUtilities.logMessage("LifecycleExtension.onExit: Downtime extension");
        },
        changeDateTime: function(dateTime){
            const originalDate = new Date(dateTime);
            originalDate.setUTCDate(originalDate.getUTCDate() - 1);

            // Wynik jako ISO string
            const newDateISO = originalDate.toISOString();
            return newDateISO;
        },
        getHoursRangeFromConfiguration: function(){
            let result = 24;
            try{
                let configuration = this.getController().getConfiguration();
                if(configuration.downTimeHoursRange){
                    result = parseInt(configuration.downTimeHoursRange);

                    if(result>120){
                        result = 120;
                    }
                    if(result<=0){
                        result = 24;
                    }
                }

            }catch(error){}

            return result;
        }

    })
});