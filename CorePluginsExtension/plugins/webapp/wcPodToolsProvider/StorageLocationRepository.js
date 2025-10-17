sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/StorageLocation"
], function (ObjectUI5, StorageLocation) {
    "use strict";
    let storageLocationsRepository =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.StorageLocationRepository", {
        constructor: function(){
        }
    });
    storageLocationsRepository._storageLocation = [];

    storageLocationsRepository.getInstance =  async function(oController, oPlant, storageLocationNumber ){
        let storageLocation;
        
        let storageLocationRepo = this._storageLocation.find(storageLocation=>{ return storageLocation.plant === oPlant && storageLocation.storageLocationNumber === storageLocationNumber  });
        if(!storageLocationRepo){
            storageLocation = await this.readStorageLocationApi(oController, oPlant, storageLocationNumber);
            this._storageLocation.push({
             plant: oPlant,
             storageLocationNumber: storageLocationNumber,
             instance: storageLocation
            })
        }else{
            storageLocation = storageLocationRepo.instance;
        }

        return storageLocation;
    };

    storageLocationsRepository.readStorageLocationApi = async function(oController, oPlant, storageLocationNumber){
        let storageLocation = new StorageLocation(oController, oPlant, storageLocationNumber);
        await storageLocation.readData();
        return storageLocation;
    };

    storageLocationsRepository.ReadStorageLocationBypassBuffer = async function(oController, oPlant, storageLocationNumber ){
        return await this.readStorageLocationApi(oController, oPlant, storageLocationNumber);
    }

    return storageLocationsRepository;
});