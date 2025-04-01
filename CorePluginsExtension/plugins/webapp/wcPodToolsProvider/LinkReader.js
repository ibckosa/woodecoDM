sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let oLinkReader =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.LinkReader", {

    });


    oLinkReader.readLinks = async function (oController, oSfcNumber, oOrderNumber) {
        return [{ fileName: "testowy_plik",
                  fileDescription: "Plik na potrzeby testów",
                  fileLink: "https://hazidesaratcollege.ac.in/library/uploads/85jkr_harrypotter_1.pdf"
         }, { fileName: "testowy_plik2",
            fileDescription: "Przykładowy plik PDF",
            fileLink: "https://muzeummw.pl/wp-content/uploads/2019/10/przykladowy-plik.pdf" }];
    };


    return oLinkReader;
});