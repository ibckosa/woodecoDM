sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.StorageLocation", {
        constructor: function(controller, plant, storageLocation){
            this._controller = controller;
            this._plant = plant;
            this._storageLocation = storageLocation;
        },
        readData: async function(){
            let url = this._controller.getPublicApiRestDataSourceUri() + "/inventory/v1/storageLocations";

            let parameters = { plant: this._plant,
                                storageLocation:  this._storageLocation};
            return await new Promise((resolve,reject)=>{
                this._controller.ajaxGetRequest(url, parameters,
                    (responseData) => {
                        this._details = responseData.content[0];
                        resolve();
                    },
                    (error, sHttpErrorMessage) => {
                        error.apiName = "/inventory/v1/storageLocations";
                        reject(error);
                    }   
                );

            });
        },
        getIsEwm: function(){
            return this._details.isEWMManagedStorageLocation;
        }
    });
});