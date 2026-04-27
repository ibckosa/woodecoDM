sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/core/date/UI5Date",
    "ibc/dm/plugins/wcPodToolsProvider/GeneralTools",
], function (ObjectUI5, UI5Date, GeneralTools) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.vPlgProductionReport.vPlgProductionReport.controller.ProductionReportDowntimeData", {
        constructor: function(controller, parameters){
            this._controller = controller;
            this._parameters = parameters;
            ///parameters:
            ///plant
            ///workCenter
            ///resource
            ///date
            ///orderNumber
            ///shiftNumber
        },

        getData: async function(){
            let result = [];
            
            if(!this._parameters.date||this._parameters.oderNumber){
                return result;
            }
           result = await this._getDownTimes();
           return result;
        },
        _getDownTimes: async function(){
            let result = [];
            let apiCalls = [];
            let dateNow = UI5Date.getInstance();
            dateNow.setSeconds(dateNow.getSeconds()-180);
            let startDateTime = UI5Date.getInstance(this._parameters.date);
            let endDateTime= UI5Date.getInstance(this._parameters.date);
            debugger;
            startDateTime.setDate(startDateTime.getDate()- 3);
            endDateTime.setDate(endDateTime.getDate()+ 3)
            
            if(endDateTime > dateNow){
                endDateTime = dateNow;
            }
            let startDateTimeIso = GeneralTools.convertDateToIsoFormat(startDateTime);
            let endDateTimeIso = GeneralTools.convertDateToIsoFormat(endDateTime);
            apiCalls.push(this._getDownTimesApi(startDateTimeIso, endDateTimeIso, "UNSCHEDULED_DOWN"));
            apiCalls.push(this._getDownTimesApi(startDateTimeIso, endDateTimeIso, "SCHEDULED_DOWN"));
            let resultApis = await Promise.all(apiCalls);
            for(const resultApi of resultApis){
                result = result.concat(resultApi);
            }
            return result;
        },
        _getDownTimesApi: async function(startDateTimeIso, endDateTimeIso, timeElementType){
            let sUrl = this._controller.getPublicApiRestDataSourceUri() + "oee/v1/availabilityLosses";
            var oParameters = { startDateTime: startDateTimeIso,
                                endDateTime: endDateTimeIso,
                                timeElementType: timeElementType,
                                resources: [ this._parameters.resource ],
                                plant: this._parameters.plant };
            return await new Promise((resolve,reject)=>{
                this._controller.ajaxGetRequest(sUrl, oParameters,
                     (oResponseData) => {
                        if(oResponseData.items){
                            resolve(oResponseData.items);
                        }else{
                            resolve([]);
                        } 
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        }
    });
});