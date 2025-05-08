sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ZLinkReader"
], function (ObjectUI5, LinkReader) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.Order", {
        constructor: function(oController, oPlant, oOrderNumber){
            this._oController = oController;
            this._oPlant = oPlant;
            this._oOrderNumber = oOrderNumber;
        },
        readData: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri() + "/order/v1/orders";
            var oParameters = { order: this._oOrderNumber,
                                plant: this._oPlant };
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxGetRequest(sUrl, oParameters,
                     (oResponseData) => {
                        this._oDetails = oResponseData;
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        },
        getPutawayStorageLocation(){
            return this._oDetails.putawayStorageLocation;
        },
        getUom: function(){
            return this._oDetails.baseUnitOfMeasureObject.uom;
        },
        getDetails: function(){
            return this._oDetails;
        },
        getOrderLineCustomValues: function(oLineNumber){
            let oLineNumberString = `${ oLineNumber }`
            let oValues = [];
            if(oLineNumberString.length===1){
                oLineNumberString = `0${ oLineNumberString }`
            }
            try{
                let oLine = this._oDetails.customValues.find(customValues => {return customValues.attribute === `ITEM_${ oLineNumberString }`; })
                let oSplittedLine = oLine.value.split("||");
                oValues = oSplittedLine
                .filter(item => item.includes(":")) 
                .map(item => {
                  const colonIndex = item.indexOf(":");
                  const field_name = item.substring(0, colonIndex).trim();
                  const field_value = item.substring(colonIndex + 1).trim();
                  return { field_name, field_value };
                });
            }catch(oError){}
            

            return oValues;
        },
        getHeaderCustomValues: function(){
            return this._oDetails.customValues.filter(customValue => { return  !customValue.attribute.startsWith("ITEM") });
        },
        getOrderPositions: async function(){
            let oReturn = [];
            let oLines = this._oDetails.customValues.filter(customValue=>{ return customValue.attribute.startsWith("ITEM") });


            for(const line of oLines){
                if(!line.value||line.value===""){continue;}
                let oItemNumber = line.attribute.replace("ITEM_0", "");
                oItemNumber = oItemNumber.replace("ITEM_", "");
                let oLineAttributes = this.getOrderLineCustomValues(oItemNumber);
                oReturn.push(
                    {
                        orderNumber: this._oOrderNumber,
                        itemNumber: oItemNumber,
                        itemPosnr: parseInt(oItemNumber) * 10,
                        materialNumber: `Material${oItemNumber}`,
                        quantity: 120,
                        deliveredQuantity: 60,
                        salesOrder: `SalesOrder${oItemNumber}`,
                        salesOrderItem: `SalesOrderItem${oItemNumber}`,
                        length: 100,
                        thickness: 100,
                        width: 100,
                        decors: [],
                        files: await LinkReader.readLinks(this._oController,this._oPlant, this._oOrderNumber, oItemNumber)
                    });
            }

        },
        getSfcs: function(){
            return this._oDetails.sfcs;
        }
    });
});