sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
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

        return Number(value.toFixed(3));
    }

    return generalTools;

});