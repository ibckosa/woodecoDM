sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5, SfcRepository) {
    "use strict";
    let orderReceiptsFromProgressIndicator = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.OrderReceiptsFromProgressIndicator", {
    });

    orderReceiptsFromProgressIndicator._orderProgress = []

    orderReceiptsFromProgressIndicator.getOrderProgress = function(orderNumber){
        let result = { orderNumber: orderNumber,
                       quantityDone: 0 };
        let orderProgress = orderReceiptsFromProgressIndicator._orderProgress.find(progress=>{return progress.orderNumber === orderNumber});
        if(orderProgress){
            result = orderProgress;
        }
        return result;
    };

    orderReceiptsFromProgressIndicator.setOrderProgress = function(orderNumber, quantityDone){
        orderReceiptsFromProgressIndicator._orderProgress = orderReceiptsFromProgressIndicator._orderProgress.filter( progress=>{ return progress.orderNumber !== orderNumber });
        orderReceiptsFromProgressIndicator._orderProgress.push({ orderNumber: orderNumber,
                                                                 quantityDone: quantityDone });
    };


    return orderReceiptsFromProgressIndicator;
});