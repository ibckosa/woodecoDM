sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let oLinkReader =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.LinkReader", {

    });


    oLinkReader.readLinks = async function (oController, oSfcNumber, oOrderNumber) {
        return [];
    };


    return oLinkReader;
});