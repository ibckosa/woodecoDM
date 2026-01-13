sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
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
    }
    return podTools;

});