sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let oSfc = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.SfcReceiptPrint", {
        constructor: function(oController, oPrintDetails){
            this._oController = oController;
            this._oPrintDetails = oPrintDetails;
            ///oPrintDetails: { 
            // print type
            // HU
            // workCenter
            // orderLineCustomValues
            // orderCustomValues
            // materialCustomValues
            //}
        },

        print: async function(){
            let oPrintingInterface = this._getPrintingInterface();
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0'); // Miesiące są indeksowane od 0
            const year = today.getFullYear();
            const prodDate = `${day}.${month}.${year}`;

            this._oPrintDetails.materialCustomValues.forEach(customValue => {
                if (this._oPrintingInterface.hasOwnProperty(customValue.attribute)) {
                    this._oPrintingInterface[customValue.attribute] = customValue.value;
                }
            });

            this._oPrintDetails.orderLineCustomValues.forEach(customValue => {
                if (this._oPrintingInterface.hasOwnProperty(customValue.field_name)) {
                    this._oPrintingInterface[customValue.field_name] = customValue.field_value;
                }
            });

            this._oPrintingInterface.PROD_DATE = prodDate;
            this._oPrintingInterface.MATERIAL = this._oPrintDetails.material;
            this._oPrintingInterface.HU = this._oPrintDetails.HU;
            this._oPrintingInterface.plant = this._oPrintDetails.plant;
            this._oPrintingInterface.order = this._oPrintDetails.order;
            this._oPrintingInterface.resource = this._oPrintDetails.resource;
            this._oPrintingInterface.workCenter = this._oPrintDetails.workCenter;
            this._oPrintingInterface.sfc = this._oPrintDetails.sfc;
            this._oPrintingInterface.printer =  this._oPrintDetails.printer;
            this._oPrintingInterface.document =  this._oPrintDetails.document;
            this._oPrintingInterface.QUANTITY = this._oPrintDetails.quantity;
            this._oPrintingInterface.OPERATION = this._oPrintDetails.operation;

            this._getSalesText();

            let oPromises=[];
            for(let i=0; i<this._oPrintDetails.printingCopies; i++){
                
                oPromises.push( this._executePrint() );

            }
            await Promise.all(oPromises);

            // return await new Promise((resolve,reject)=>{
            //     this._oController.ajaxPostRequest(sUrl, this._oPrintingInterface,
            //         (oResponseData) => {
            //             resolve();
            //         },
            //         (oError, sHttpErrorMessage) => {
            //             reject(oError);
            //         }
            //     );
            // });

        },

        _getPrintingInterface: function(){

            this._oPrintingInterface =  {
                printer: "",
                document: "",
                plant:"",
                order:"",
                resource:"",
                workCenter:"",
                sfc: "",
                QUANTITY: 0,
                OPERATION: "",
                THICKNESS: "",
                SALES_TEXT: "",
                EAN11: "",
                MATERIAL: "",
                PROD_DATE: "",
                OBERFL_VS: "",
                OBERFL_RS: "",
                HU: "",
                DI: "",
                DEKOR_VS: "",
                DEKOR_RS: "",
                MATERIAL: "",
                LA: "",
                BR: "",
                PEG_ZZMTO: "",
                PEG_VBELN: "",
                PEG_POSNR: "",
                PEG_NAME1: "",
                PEG_BSTNK: "",
                PEG_KDMAT: "",
                ZERT_TXT: "",
                PEG_SPRAS: "",
                ZZVERP_TXT: "",
                NORM: "",
                PRDCLS: "",
                ORDER: "",
                PROD_DATE: "",
                sync: true
            };

        },
        _getSalesText: function(){
            let _oSalesTextName = "SALES_TEXT";

            switch(this._oPrintingInterface.PEG_SPRAS){
                case "L":
                    _oSalesTextName = `${_oSalesTextName}_PL`;
                    break;
                case "E":
                    _oSalesTextName = `${_oSalesTextName}_EN`;
                    break;
                case "G":
                    _oSalesTextName = `${_oSalesTextName}_DE`;
                    break;
            }


            let oSalesText = this._oPrintDetails.materialCustomValues.find(customValue=>{ return customValue.attribute === _oSalesTextName });
            if(oSalesText){
                this._oPrintingInterface.SALES_TEXT = oSalesText.value;
                this._oPrintingInterface.SALES_TEXT = this._oPrintingInterface.SALES_TEXT.replaceAll("$&", "\n")
            }

        },
        _executePrint: async function(){
            let sUrl = this._oController.getPublicApiRestDataSourceUri()  + this._oPrintDetails.endpoint;
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, this._oPrintingInterface,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }
                );
            });
        }
    });

    return oSfc;
});