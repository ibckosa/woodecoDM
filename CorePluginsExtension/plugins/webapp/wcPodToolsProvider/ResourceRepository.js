sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/Resource"
], function (Object, Resource) {
    "use strict";
    let oResourceReposity =  Object.extend("ibc.dm.plugins.wcPodToolsProvider.ResourceRepository", {

    });


    oResourceReposity.getResourceInstance = async function(oController, oPlant, oResourceNumber){
        let oResource = new Resource(oController, oPlant, oResourceNumber);
        await oResource.readResourceData();
        return oResource;
    }
    return oResourceReposity;
});