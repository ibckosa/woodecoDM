sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/SfcReceiptPrint",
    "ibc/dm/plugins/wcPodToolsProvider/GeneralTools",
    "ibc/dm/plugins/wcPodToolsProvider/MaterialRepository",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository"
], function (ObjectUI5, ErrorHandler, TextHandler, SfcReceiptPrint, GeneralTools, MaterialRepository, OrderRepository) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.Reprinter", {
        constructor: function(controller, productionDataCollection){
            this._controller = controller;
            this._productionDataCollection = productionDataCollection;
            this._oErrorHandler = new ErrorHandler(controller);
            this._oTextHandler = new TextHandler();
        },
        execute: async function(){
            let printingParameters = undefined;

            if(this._productionDataCollection["Q1/Q3"]==="Q3"){
                let q2DestinationDataCollection = await this._getQ2DesinationDataCollection();
                if(!q2DestinationDataCollection||!q2DestinationDataCollection.data){
                    this._oErrorHandler.throwErrorPopup("error.reprint.q2GeneralError");
                }
                let q2Destination = q2DestinationDataCollection.data.find(collection=>{ return collection.parameter.measureName === "DESTINATION"});
                let printingParametersQ2 = q2DestinationDataCollection.data.find(collection=>{ return collection.parameter.measureName === "PRINTING_PARAMETERS"});

                if(q2Destination.parameter.actual === "RETURN"){
                    if(printingParametersQ2){
                        printingParameters = GeneralTools.convertStringToPrintingDetailsStucture(printingParametersQ2.parameter.actual);
                    }else{
                        this._oErrorHandler.throwErrorPopup("error.reprint.q2GeneralError");
                    }
                }else{
                    this._oErrorHandler.throwErrorPopup("error.reprint.q2GeneralError");
                }

            }else{
                if(!this._productionDataCollection.PRINTING_PARAMETERS){
                    this._oErrorHandler.throwErrorPopup("error.reprint.q2GeneralError");
                }
                printingParameters = GeneralTools.convertStringToPrintingDetailsStucture(this._productionDataCollection.PRINTING_PARAMETERS);
            }
            
            
            

            if(printingParameters.material){
                let materiaInstance = await MaterialRepository.getMaterialInstance(this._controller, printingParameters.plant, printingParameters.material);
                printingParameters.materialCustomValues = materiaInstance.getCustomValues();
            }

            if(printingParameters.oldMaterial){
                let oldMateriaInstance = await MaterialRepository.getMaterialInstance(this._controller, printingParameters.plant, printingParameters.oldMaterial);
                printingParameters.oldMaterialCustomValues = oldMateriaInstance.getCustomValues();
            }

            if(printingParameters.order){
                let orderItemNumber = 1;
                if(this._productionDataCollection.ITEM_NO){
                    orderItemNumber = parseInt(this._productionDataCollection.ITEM_NO);
                }

                let orderInstance = await OrderRepository.readOrder(this._controller, printingParameters.plant, printingParameters.order);
                printingParameters.orderLineCustomValues = orderInstance.getOrderLineCustomValues(orderItemNumber);
                printingParameters.orderCustomValues = orderInstance.getHeaderCustomValues();
            }


            printingParameters.printingCopies = 1;
            let oSfcReceiptPrint = new SfcReceiptPrint(this._controller, printingParameters);
            await oSfcReceiptPrint.print();

            this._controller.showSuccessMessage(this._oTextHandler.getText("success.reprint.finishedWithSuccess"), true, true);
        },
        _getQ2DesinationDataCollection: async function(){
            let sUrl = this._controller.getPublicApiRestDataSourceUri() + "datacollection/v1/measurements";

            let oParameters = { plant: this._productionDataCollection.PLANT,
                                sfcs:  [this._productionDataCollection.SFC_NUMBER],
                                dcGroup: { name: "Q2_DESTINATION",
                                           version: "1" },
                                pageSize: 50 };
            return await new Promise((resolve,reject)=>{
                this._controller.ajaxGetRequest(sUrl, oParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        }

    });
});