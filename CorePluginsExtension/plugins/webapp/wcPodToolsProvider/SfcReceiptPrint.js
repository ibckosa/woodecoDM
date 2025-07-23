const { toCanvas } = require("./bwip");

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

            if(this._oPrintDetails.printingCopies<1){
                return;
            }

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
            this._oPrintingInterface.resource = this._oPrintDetails.resource.replace(/^.*?_/, '');
            this._oPrintingInterface.workCenter = this._oPrintDetails.workCenter;
            this._oPrintingInterface.sfc = this._oPrintDetails.sfc;
            this._oPrintingInterface.printer =  this._oPrintDetails.printer;
            this._oPrintingInterface.document = this._getDocument(); //this._oPrintDetails.document;
            this._oPrintingInterface.QUANTITY = parseInt(this._oPrintDetails.quantity);
            this._oPrintingInterface.OPERATION = `${parseInt(this._oPrintDetails.operation)}`;

            if(!this._oPrintingInterface.HU){
                this._oPrintingInterface.HU = this._oPrintingInterface.sfc;
            }

            if(this._oPrintingInterface.PEG_VBELN){
                try{
                    this._oPrintingInterface.PEG_VBELN = `${parseInt(this._oPrintingInterface.PEG_VBELN)}`;
                }catch(error){}
            }

            if(this._oPrintingInterface.PEG_POSNR){
                try{
                    this._oPrintingInterface.PEG_POSNR = `${parseInt(this._oPrintingInterface.PEG_POSNR)}`;
                }catch(error){}
            }

            if(this._oPrintingInterface.PEG_ZZMTO==="MTO2"){
                this._oPrintingInterface.PEG_VBELN = this._oPrintingInterface.PEG_POSNR = this._oPrintingInterface.PEG_KDMAT = this._oPrintingInterface.PEG_NAME1 = this._oPrintingInterface.PEG_BSTNK = "";
            }

            
            this._getSalesText();
            this._convertDescription();
            this._oPrintingInterface.ZZVERP_TXT = this._convertMultipleLineText(this._oPrintingInterface.ZZVERP_TXT);

            // let oPromises=[];
            // for(let i=0; i<this._oPrintDetails.printingCopies; i++){
                
            //     oPromises.push( this._executePrint() );

            // }
            // await Promise.all(oPromises);
            await this._executePrint()

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
                ZZVERP: "",
                NORM: "",
                PRDCLS: "",
                ORDER: "",
                PROD_DATE: "",
                DESCRIPTION: "",
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
            let sUrl = this._oController.getPublicApiRestDataSourceUri()  + "print/v1/print"; //this._oPrintDetails.endpoint;

            let printingParameters = this._getPrintingParameters();
            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, printingParameters,
                    (oResponseData) => {
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }
                );
            });
        },

        _convertMultipleLineText(text){
            return text.replaceAll("$&", "\n");
        },
        _convertDescription: function(){
            this._oPrintingInterface.DESCRIPTION = this._oPrintingInterface.DESCRIPTION.replaceAll("$&", "\n");
        },
        _getDocument: function(){
            let result = 'DM_A4';
            let infoLabel = this._oPrintDetails.orderLineCustomValues.find(line => { return line.field_name === "INFO_LBL" });
            if(infoLabel){
                if(infoLabel.field_value === "A4_INFO_LABEL"){
                    result = "DM_INFO";
                }else if(infoLabel.field_value === "A6_LABEL"){
                    result = "DM_A6";
                }
            }
            return result;
        },
        _getPrintingParameters: function(){
            let fileName = '';
            if(this._oPrintingInterface.order){
                fileName = `${this._oPrintingInterface.order}_${this._oPrintingInterface.HU}`;
            }else{
                fileName = `${this._oPrintingInterface.HU}`;
            }
            let result = { 
                "dataAcquisitionParameters": { "plant": this._oPrintingInterface.plant,
                                                "sfc": this._oPrintingInterface.sfc,
                                                "order": this._oPrintingInterface.order,
                                                "workCenter" : this._oPrintingInterface.workCenter,
                                                "resource": this._oPrintingInterface.resource,
                                                "custom_data":{ "OBERFL_VS": this._oPrintingInterface.OBERFL_VS,
                                                                "OBERFL_RS": this._oPrintingInterface.OBERFL_RS,
                                                                "HU": this._oPrintingInterface.HU,
                                                                "DI": this._oPrintingInterface.THICKNESS,
                                                                "DEKOR_VS": this._oPrintingInterface.DEKOR_VS,
                                                                "DEKOR_RS": this._oPrintingInterface.DEKOR_RS,
                                                                "MATERIAL": this._oPrintingInterface.MATERIAL,
                                                                "LA": this._oPrintingInterface.LA,
                                                                "PEG_ZZMTO": this._oPrintingInterface.PEG_ZZMTO,
                                                                "PEG_VBELN": this._oPrintingInterface.PEG_VBELN,
                                                                "PEG_POSNR": this._oPrintingInterface.PEG_POSNR,
                                                                "PEG_NAME1": this._oPrintingInterface.PEG_NAME1,
                                                                "PEG_BSTNK": this._oPrintingInterface.PEG_BSTNK,
                                                                "PEG_KDMAT": this._oPrintingInterface.PEG_KDMAT,
                                                                "ZERT_TXT": this._oPrintingInterface.ZERT_TXT,
                                                                "PEG_SPRAS": this._oPrintingInterface.PEG_SPRAS,
                                                                "ZZVERP_TXT": this._oPrintingInterface.ZZVERP_TXT,
                                                                "NORM": this._oPrintingInterface.NORM,
                                                                "PRDCLS": this._oPrintingInterface.PRDCLS,
                                                                "PROD_DATE": this._oPrintingInterface.PROD_DATE,
                                                                "plant": this._oPrintingInterface.plant,
                                                                "sfc": this._oPrintingInterface.sfc,
                                                                "order": this._oPrintingInterface.order,
                                                                "workCenter" : this._oPrintingInterface.workCenter,
                                                                "resource": this._oPrintingInterface.resource,
                                                                "QUANTITY": this._oPrintingInterface.QUANTITY,
                                                                "EAN11": this._oPrintingInterface.EAN11,
                                                                "SALES_TEXT": this._oPrintingInterface.SALES_TEXT,
                                                                "BR": this._oPrintingInterface.BR,
                                                                "OPERATION": this._oPrintingInterface.OPERATION,
                                                                "DESCRIPTION": this._oPrintingInterface.DESCRIPTION,
                                                                "ZZVERP": this._oPrintingInterface.ZZVERP,
                                                                "GS1_BARCODE": this._getGS1Barcode()
                                                             }  },
                "document": this._oPrintingInterface.document,
                "formatParameters": { "fileName": fileName },
                "printer": this._oPrintingInterface.printer,
                "sync": true,
                "transportParameters": { "numberOfCopies": this._oPrintDetails.printingCopies,
                                          "profile": "Defaults"  }
            };
            return result;
        },
        _getGS1Barcode: function(){
            debugger;
            function loadScript(url, callback) {
                let script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = url;
                script.onload = callback;
                document.head.appendChild(script);
            }
            

            loadScript('bwip.js', function() {

      const oCanvas = document.createElement("canvas");
 
      try {
  
        bwipjs.toCanvas(oCanvas, {
          bcid: "gs1datamatrix",
          text: "(01)01234567890128(11)250716",
          parsefnc: true,
          scale: 6,
          includetext: false
        });
        
        const sDataUrl = oCanvas.toDataURL("image/png");
        const sBase64 = sDataUrl.split(",")[1];

        return sBase64;          
 
      } catch (e) {
        console.error("Błąd generowania kodu:", e);
      }
    });
        }
    });

    return oSfc;
});