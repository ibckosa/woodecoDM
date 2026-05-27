sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/core/date/UI5Date"
], function (ObjectUI5, UI5Date) {
    "use strict";
    let generalTools = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.GeneralTools", {
    });

    generalTools.convertPrintingDetailsStuctureToString = function(stucture){
        if(stucture.orderLineCustomValues){
            delete stucture.orderLineCustomValues;
        }
        if(stucture.orderCustomValues){
            delete stucture.orderCustomValues;
        }
        if(stucture.materialCustomValues){
            delete stucture.materialCustomValues;
        }

        if(stucture.oldMaterialCustomValues){
            delete stucture.oldMaterialCustomValues;
        }

       return JSON.stringify(stucture);
    };

    generalTools.convertStringToPrintingDetailsStucture = function(str){
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }

    };


    generalTools.convertDateToIsoFormat = function(date){
        let isoDate = date.toISOString().split('.')[0] + 'Z';
        return isoDate;
    };

    generalTools.getProductionShift = function(dateString) {
        const date = new Date(dateString);
        const hour = date.getHours();

        if (hour >= 6 && hour < 14) {
            return 1; 
        } else if (hour >= 14 && hour < 22) {
            return 2;
        } else {
            return 3; 
        }
    };
    generalTools.roundQuantity = function(quantity, unit) {
        const value = Number(quantity);

        if (Number.isNaN(value)) return null;

        if (unit === "ST") {
            return Math.round(value);
        }

        if (unit === "M3") {
            return value.toFixed(3)*1000/1000;
        }

        return Number(value.toFixed(3));
    };

    generalTools.getShiftRangeFromDate = function(shift, date){
        let result = {  startDate: UI5Date.getInstance(date),
                        endDate: UI5Date.getInstance(date) };

        if(shift === "1"){
            result.startDate.setHours(6,0,0);
            result.endDate.setHours(13,59,59);
        }else if(shift === "2"){
            result.startDate.setHours(14,0,0);
            result.endDate.setHours(21,59,59);
        }else{
            result.startDate.setHours(22,0,0);
            result.endDate.setDate(result.endDate.getDate() + 1);
            result.endDate.setHours(5,59,59);
        }
        return result;
    };

    return generalTools;

});