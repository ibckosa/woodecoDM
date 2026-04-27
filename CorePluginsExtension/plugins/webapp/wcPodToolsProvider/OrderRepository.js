sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/Order"
], function (ObjectUI5, order) {
    "use strict";
    let oOrderRepository =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.OrderRepository", {
        constructor: function(){
        }
    });
    oOrderRepository._oOrders = [];

    oOrderRepository.readOrder =  async function(oController, oPlant, oOrderNumber){
        let oOrder;
        
        let oOrderRepo = oOrderRepository._oOrders.find(order=>{ return order.plant === oPlant && order.orderNumber === oOrderNumber });
        if(!oOrderRepo){
            oOrder = await this.readOrderApi(oController, oPlant, oOrderNumber);
            oOrderRepository._oOrders.push({
             plant: oPlant,
             orderNumber: oOrderNumber,
             instance: oOrder
            });
        }else{
            oOrder = oOrderRepo.instance;
        }

        return oOrder;
    };

    oOrderRepository.readOrderApi = async function(oController, oPlant, oOrderNumber){
        let oOrder = new order(oController, oPlant, oOrderNumber);
        await oOrder.readData();
        return oOrder;
    };

    oOrderRepository.readOrderByPassBuffer = async function(oController, oPlant, oOrderNumber ){
        return await this.readOrderApi(oController, oPlant, oOrderNumber);
    };


    oOrderRepository.massOrderRead = async function(controller, plant, orderNumbers){
        let result = [];
        let orderInstances = orderNumbers.map(orderNumber => this.readOrderByPassBuffer(controller, plant, orderNumber));

        if(orderInstances.length>0){
            let promiseResult = await Promise.all(orderInstances);
            result = promiseResult.map(result=>{ return { instance: result,
                                                          orderNumber: result.getOrderNumber() } });
        }


        return result;

    }


    return oOrderRepository;
});