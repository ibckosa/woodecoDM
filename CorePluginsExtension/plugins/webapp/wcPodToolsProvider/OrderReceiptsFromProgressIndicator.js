sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5, SfcRepository) {
    "use strict";
    let orderReceiptsFromProgressIndicator = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.OrderReceiptsFromProgressIndicator", {
    });

    orderReceiptsFromProgressIndicator._orderProgress = []

    orderReceiptsFromProgressIndicator.getOrderProgress = function(orderNumber){
        let result = { orderNumber: orderNumber,
                       quantityDone: 0,
                       totalOrderQuantity:0,
                       model: undefined };
        let orderProgress = orderReceiptsFromProgressIndicator._orderProgress.find(progress=>{return progress.orderNumber === orderNumber});
        if(orderProgress){
            result = orderProgress;
        }
        return result;
    };

    orderReceiptsFromProgressIndicator.setOrderProgress = function(orderNumber, quantityDone, totalOrderQuan, model){
        orderReceiptsFromProgressIndicator._orderProgress = orderReceiptsFromProgressIndicator._orderProgress.filter( progress=>{ return progress.orderNumber !== orderNumber });
        orderReceiptsFromProgressIndicator._orderProgress.push({ orderNumber: orderNumber,
                                                                 quantityDone: quantityDone,
                                                                 totalOrderQuantity: totalOrderQuan,
                                                                 model: model });
    };

    orderReceiptsFromProgressIndicator.addQuantityToProgress = function(orderNumber, quantityRecipted){
        let orderProgress = orderReceiptsFromProgressIndicator._orderProgress.find(progress=>{return progress.orderNumber === orderNumber});
        if(orderProgress){
            orderProgress.quantityDone = orderProgress.quantityDone + quantityRecipted;

            let progressData = orderProgress.model.getData();
            progressData.sfcCardCustom.percentProgress = "";

            if(orderProgress.totalOrderQuantity>0){
                progressData.sfcCardCustom.progressIndicatorValue =  orderProgress.quantityDone + " z " + orderProgress.totalOrderQuantity;
                progressData.sfcCardCustom.percentProgress = parseInt( orderProgress.quantityDone / orderProgress.totalOrderQuantity * 100 ).toString();
                orderProgress.model.setData(progressData);
                orderProgress.model.refresh();
            }
        }
    }


    return orderReceiptsFromProgressIndicator;
});