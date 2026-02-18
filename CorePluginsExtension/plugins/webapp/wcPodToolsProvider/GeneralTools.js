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


    return generalTools;

});