sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/core/BusyIndicator"
], function (ObjectUI5, BusyIndicator) {
    "use strict";
    let podTools = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.PodTools", {

    });

    podTools.setBusy = function(controller, busyValue){
      try{
        let oviewController = controller.getActiveViewController();
        oviewController.getView().setBusyIndicatorDelay(0);
        oviewController.getView().setBusy(busyValue);
      }catch(error){

      }
    },

    podTools.setCustomBusyIndicator = function(isBusy){
      if(isBusy){
        BusyIndicator.show(0);
      }else{
        BusyIndicator.hide();
      }

    }
    return podTools;

});