sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/PalleteQueue",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler"
], function (ObjectUI5, PalleteQueue, ErrorHandler) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.PalleteQueuesManager", {
        constructor: function(oController){
            this._oController = oController;
            this._oErrorHandler = new ErrorHandler(oController);
            this._oQueue = [];
        },
        readPalleteQueue: async function(oPlant, oWorkCenter, oResource, oMaterial, storageLocation){

            let oQueue = this._oQueue.find( queue => {return queue.plant === oPlant &&
                                                             queue.workCenter === oWorkCenter &&
                                                             queue.resource === oResource &&
                                                             queue.material === oMaterial });
            if(!oQueue){
                let oPalleteQueue = new PalleteQueue(this._oController, oPlant, oResource, oWorkCenter);
                oPalleteQueue.setReadForQueueManager(oMaterial, storageLocation);
    
                this._oQueue.push({
                    plant: oPlant,
                    workCenter: oWorkCenter,
                    resource: oResource,
                    material: oMaterial,
                    queue: await oPalleteQueue.readPalletesQueue()
                })
            }
        },
        getPalletesForIssue: function(oPlant, oWorkCenter, oResource, oMaterial, oQuantity, oOrder, oSequence){
            let oReservationNumber = `${oOrder}_${oSequence}`;
            let palletesSelected = [];

            let oQueue = this._oQueue.find( queue => {return queue.plant === oPlant &&
                                            queue.workCenter === oWorkCenter &&
                                            queue.resource === oResource &&
                                            queue.material === oMaterial  });

            if(!oQueue){this._oErrorHandler.throwError("error.issue.queueNotFound", oMaterial, oWorkCenter, oResource)};
            
            let oQuanLeft = oQuantity; 
            for(const pallete of oQueue.queue){
                if(pallete.reservation!==""){
                    if(pallete.reservation===oReservationNumber){
                        palletesSelected.push(pallete);
                        if(pallete.quantity >= oQuanLeft){
                            oQuanLeft = 0;
                        }else{
                            oQuanLeft = oQuanLeft - pallete.quantity;
                        }
                    }
                }else{
                    pallete.reservation = oReservationNumber;
                    pallete.isNewReseravtion = true;
                    palletesSelected.push(pallete);
                    if(pallete.quantity >= oQuanLeft){
                        oQuanLeft = 0;
                    }else{
                        oQuanLeft = oQuanLeft - pallete.quantity;
                    }
                }
                if(oQuanLeft === 0){ return palletesSelected; }           
            }

            return palletesSelected;
        }

    });
});