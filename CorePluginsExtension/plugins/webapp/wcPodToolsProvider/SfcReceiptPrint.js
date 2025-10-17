sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/thirdparty/jquery"
   //"extlib/bwip"
], function (ObjectUI5, jQuery) {
"use strict";

    let printer = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.SfcReceiptPrint", {
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
            if(!this._oPrintDetails.printingCopies||this._oPrintDetails.printingCopies<1){
                return;
            }

            this._getPrintingInterface();

            

            // const today = new Date();
            // const day = String(today.getDate()).padStart(2, '0');
            // const month = String(today.getMonth() + 1).padStart(2, '0'); // Miesiące są indeksowane od 0
            // const year = today.getFullYear();
            // const prodDate = `${day}.${month}.${year}`;

            // if(this._oPrintDetails.printingCopies<1){
            //     return;
            // }

            // this._oPrintDetails.materialCustomValues.forEach(customValue => {
            //     if (this._oPrintingInterface.hasOwnProperty(customValue.attribute)) {
            //         this._oPrintingInterface[customValue.attribute] = customValue.value;
            //     }
            // });

            // this._oPrintDetails.orderLineCustomValues.forEach(customValue => {
            //     if (this._oPrintingInterface.hasOwnProperty(customValue.field_name)) {
            //         this._oPrintingInterface[customValue.field_name] = customValue.field_value;
            //     }
            // });

            // this._oPrintingInterface.PROD_DATE = prodDate;
            // this._oPrintingInterface.MATERIAL = this._oPrintDetails.material;
            // this._oPrintingInterface.HU = this._oPrintDetails.HU;
            // this._oPrintingInterface.plant = this._oPrintDetails.plant;
            // this._oPrintingInterface.order = this._oPrintDetails.order;
            // this._oPrintingInterface.resource = this._oPrintDetails.resource.replace(/^.*?_/, '');
            // this._oPrintingInterface.workCenter = this._oPrintDetails.workCenter;
            // this._oPrintingInterface.sfc = this._oPrintDetails.sfc;
            // this._oPrintingInterface.printer =  this._oPrintDetails.printer;
            // this._oPrintingInterface.document = this._getDocument(); //this._oPrintDetails.document;
            // this._oPrintingInterface.QUANTITY = parseInt(this._oPrintDetails.quantity);
            // this._oPrintingInterface.OPERATION = `${parseInt(this._oPrintDetails.operation)}`;
            // this._oPrintingInterface.INPUT_ORDER = this._oPrintDetails.inputOrder;
            // this._oPrintingInterface.INPUT_ORDER_DATE = this._oPrintDetails.inputOrderDate;

            // if(!this._oPrintingInterface.HU){
            //     this._oPrintingInterface.HU = this._oPrintingInterface.sfc;
            // }

            // if(this._oPrintingInterface.PEG_VBELN){
            //     try{
            //         this._oPrintingInterface.PEG_VBELN = `${parseInt(this._oPrintingInterface.PEG_VBELN)}`;
            //     }catch(error){}
            // }

            // if(this._oPrintingInterface.PEG_POSNR){
            //     try{
            //         this._oPrintingInterface.PEG_POSNR = `${parseInt(this._oPrintingInterface.PEG_POSNR)}`;
            //     }catch(error){}
            // }

            // if(this._oPrintingInterface.PEG_ZZMTO==="MTO2"){
            //     this._oPrintingInterface.PEG_VBELN = this._oPrintingInterface.PEG_POSNR = this._oPrintingInterface.PEG_KDMAT = this._oPrintingInterface.PEG_NAME1 = this._oPrintingInterface.PEG_BSTNK = "";
            // }

            
            // this._getSalesText();
            // this._convertDescription();
            // this._oPrintingInterface.ZZVERP_TXT = this._convertMultipleLineText(this._oPrintingInterface.ZZVERP_TXT);

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
                ZERT: "",
                PEG_SPRAS: "",
                ZZVERP_TXT: "",
                ZZVERP: "",
                NORM: "",
                PRDCLS: "",
                ORDER: "",
                PROD_DATE: "",
                DESCRIPTION: "",
                INPUT_ORDER: "",
                INPUT_ORDER_DATE: "",
                EWU_BARCODE: "",
                EWU_TEXT: "",
                sync: true
            };

            switch(this._oPrintDetails.printType) {
                case ibc.dm.plugins.wcPodToolsProvider.SfcReceiptPrint.PRINT_Q2_RETURN:
                    this._getInterfaceQ2Return();
                    break;
                case ibc.dm.plugins.wcPodToolsProvider.SfcReceiptPrint.PRINT_Q1:
                    this._getInterfaceQ1();
                    break;
                case ibc.dm.plugins.wcPodToolsProvider.SfcReceiptPrint.PRINT_INPUT_RETURN:
                    this._getInterfaceInputReturn();
                    break;
                case ibc.dm.plugins.wcPodToolsProvider.SfcReceiptPrint.PRINT_INPUT_RETURN_NPW:
                    this._getInterfaceInputReturnNpw();
                    break;
                default: 
                    this._getInterfaceQ1();
            }


        },
        _getProdDate: function(){
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0'); 
            const year = today.getFullYear();
            const prodDate = `${day}.${month}.${year}`;

            return prodDate;
        },

        _getInterfaceQ2Return: function(){
            const prodDate = this._getProdDate();

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



            this._oPrintingInterface.THICKNESS = "";
            if(this._oPrintDetails.oldMaterialCustomValues){
                let oldMaterialDI = this._oPrintDetails.oldMaterialCustomValues.find(value=>{return value.attribute === "THICKNESS"});
                if(oldMaterialDI){
                    this._oPrintingInterface.THICKNESS = oldMaterialDI.value;
                }

            }

            this._oPrintingInterface.PEG_VBELN = this._oPrintingInterface.PEG_POSNR = this._oPrintingInterface.PEG_NAME1 = this._oPrintingInterface.PEG_BSTNK = "";
            this._oPrintingInterface.PEG_KDMAT = this._oPrintDetails.oldMaterial;

            this._oPrintingInterface.PROD_DATE = prodDate;
            this._oPrintingInterface.MATERIAL = this._oPrintDetails.material;
            this._oPrintingInterface.HU = this._oPrintDetails.HU;
            this._oPrintingInterface.plant = this._oPrintDetails.plant;
            this._oPrintingInterface.order = this._oPrintDetails.order;
            this._oPrintingInterface.resource = this._oPrintDetails.resource.replace(/^.*?_/, '');
            this._oPrintingInterface.workCenter = this._oPrintDetails.workCenter;
            this._oPrintingInterface.sfc = this._oPrintDetails.sfc;
            this._oPrintingInterface.printer =  this._oPrintDetails.printer;
            this._oPrintingInterface.document = this._getDocument(); 
            this._oPrintingInterface.QUANTITY = parseInt(this._oPrintDetails.quantity);
            this._oPrintingInterface.OPERATION = `${parseInt(this._oPrintDetails.operation)}`;
            this._oPrintingInterface.INPUT_ORDER = this._oPrintDetails.inputOrder;
            this._oPrintingInterface.INPUT_ORDER_DATE = this._oPrintDetails.inputOrderDate;

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


            
            this._getSalesText();
            this._convertDescription();
            this._oPrintingInterface.ZZVERP_TXT = this._convertMultipleLineText(this._oPrintingInterface.ZZVERP_TXT);
        },

        _getInterfaceQ1: function(){
            const prodDate = this._getProdDate();

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
            this._oPrintingInterface.document = this._getDocument(); 
            this._oPrintingInterface.QUANTITY = parseInt(this._oPrintDetails.quantity);
            this._oPrintingInterface.OPERATION = `${parseInt(this._oPrintDetails.operation)}`;
            this._oPrintingInterface.INPUT_ORDER = this._oPrintDetails.inputOrder;
            this._oPrintingInterface.INPUT_ORDER_DATE = this._oPrintDetails.inputOrderDate;

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
        },

        _getInterfaceInputReturn: function(){
            const prodDate = this._getProdDate();

            this._oPrintDetails.materialCustomValues.forEach(customValue => {
                if (this._oPrintingInterface.hasOwnProperty(customValue.attribute)) {
                    this._oPrintingInterface[customValue.attribute] = customValue.value;
                }
            });

            // this._oPrintDetails.orderLineCustomValues.forEach(customValue => {
            //     if (this._oPrintingInterface.hasOwnProperty(customValue.field_name)) {
            //         this._oPrintingInterface[customValue.field_name] = customValue.field_value;
            //     }
            // });

            this._oPrintingInterface.PROD_DATE = prodDate;
            this._oPrintingInterface.MATERIAL = this._oPrintDetails.material;
            this._oPrintingInterface.HU = this._oPrintDetails.HU;
            this._oPrintingInterface.plant = this._oPrintDetails.plant;
            //this._oPrintingInterface.order = this._oPrintDetails.order;
            this._oPrintingInterface.resource = this._oPrintDetails.resource.replace(/^.*?_/, '');
            this._oPrintingInterface.workCenter = this._oPrintDetails.workCenter;
            this._oPrintingInterface.sfc = this._oPrintDetails.sfc;
            this._oPrintingInterface.printer =  this._oPrintDetails.printer;
            this._oPrintingInterface.document = this._getDocument(); 
            this._oPrintingInterface.QUANTITY = parseInt(this._oPrintDetails.quantity);
            //this._oPrintingInterface.OPERATION = `${parseInt(this._oPrintDetails.operation)}`;
            this._oPrintingInterface.INPUT_ORDER = this._oPrintDetails.inputOrder;
            this._oPrintingInterface.INPUT_ORDER_DATE = this._oPrintDetails.inputOrderDate;
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
        },

        _getInterfaceInputReturnNpw: function(){
            const prodDate = this._getProdDate();

            this._oPrintDetails.materialCustomValues.forEach(customValue => {
                if (this._oPrintingInterface.hasOwnProperty(customValue.attribute)) {
                    this._oPrintingInterface[customValue.attribute] = customValue.value;
                }
            });
            

            // this._oPrintDetails.orderLineCustomValues.forEach(customValue => {
            //     if (this._oPrintingInterface.hasOwnProperty(customValue.field_name)) {
            //         this._oPrintingInterface[customValue.field_name] = customValue.field_value;
            //     }
            // });

            this._oPrintingInterface.PROD_DATE = prodDate;
            this._oPrintingInterface.MATERIAL = this._oPrintDetails.material;
            this._oPrintingInterface.HU = this._oPrintDetails.HU;
            this._oPrintingInterface.plant = this._oPrintDetails.plant;
            //this._oPrintingInterface.order = this._oPrintDetails.order;
            this._oPrintingInterface.resource = this._oPrintDetails.resource.replace(/^.*?_/, '');
            this._oPrintingInterface.workCenter = this._oPrintDetails.workCenter;
            this._oPrintingInterface.sfc = this._oPrintDetails.sfc;
            this._oPrintingInterface.printer =  this._oPrintDetails.printer;
            this._oPrintingInterface.document = this._getDocument(); 
            this._oPrintingInterface.QUANTITY = parseInt(this._oPrintDetails.quantity);
            this._oPrintingInterface.OPERATION = `${parseInt(this._oPrintDetails.operation)}`;
            this._oPrintingInterface.INPUT_ORDER = this._oPrintDetails.inputOrder;
            this._oPrintingInterface.INPUT_ORDER_DATE = this._oPrintDetails.inputOrderDate;
            this._oPrintingInterface.PEG_KDMAT = this._oPrintDetails.oldMaterial;
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
                        oError.apiName = "print/v1/print";
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
                                                                "ZERT": this._oPrintingInterface.ZERT,
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
                                                                "EAN11": this._oPrintingInterface.EAN11 ? parseInt(this._oPrintingInterface.EAN11).toString() : this._oPrintingInterface.EAN11,
                                                                "SALES_TEXT": this._oPrintingInterface.SALES_TEXT,
                                                                "BR": this._oPrintingInterface.BR,
                                                                "OPERATION": this._oPrintingInterface.OPERATION,
                                                                "DESCRIPTION": this._oPrintingInterface.DESCRIPTION,
                                                                "ZZVERP": this._oPrintingInterface.ZZVERP,
                                                                "GS1_BARCODE": this._getGS1Barcode(),
                                                                "EWU_BARCODE": this._oPrintingInterface.EWU_BARCODE,
                                                                "EWU_TEXT": this._oPrintingInterface.EWU_TEXT,
                                                             }  },
                "document": this._oPrintingInterface.document,
                "formatParameters": { "fileName": fileName },
                "printer": this._oPrintingInterface.printer,
                "sync": true,
                "transportParameters": { "numberOfCopies": this._oPrintDetails.printingCopies,
                                          "profile": "Defaults"  }
            };
            result.dataAcquisitionParameters.custom_data.GS1_TEXT = this._gs1Text;
            //this._getGS1Barcode();
            return result;
        },
        

        _getGS1Barcode: function () {
            var result = "";

            let fieldsToAdd = this._getGsFields();

            for(const field of fieldsToAdd){
                let functionName = `_GET_${field}`;
                if( typeof this[functionName] === "function"){
                    let gsSegment = this[functionName]();
                    result = result + gsSegment;
                }
            }

            return result;
        },
        _getGsFields: function(){
            let result = [];

            if(this._oPrintDetails.orderLineCustomValues){
                let gsCodesConfiguration = this._oPrintDetails.orderLineCustomValues.find(value=>{ return value.field_name === "GS1_BARCODE"; });
                if(gsCodesConfiguration){
                    result = gsCodesConfiguration.field_value.split("$&");
                }
            }

            return result;
        },
        _GET_GS1_3115: function(){
            let result = "";
            try{
                let laFormatted = this._formatLaBr(this._oPrintingInterface.LA);
                result = `(3115)${laFormatted}`
                this._addToGs1Text(`LENGTH (m) (3115) ${laFormatted}`);
            }catch(error){

            }
            return result;
        },  
        _GET_GS1_3125: function(){
            let result = "";
            try{
                let brFormatted = this._formatLaBr(this._oPrintingInterface.BR);
                result = `(3125)${brFormatted}`
                this._addToGs1Text(`WIDTH (m) (3125) ${brFormatted}`);
            }catch(error){}
            return result;
        }, 
        _GET_GS1_91: function(){
            //paleta 1 z 10
            let result = `(91)${this._oPrintDetails.receiptCount}/${this._oPrintDetails.plannedPalletes}`;
            this._addToGs1Text(`INTERNAL (91) ${this._oPrintDetails.receiptCount}/${this._oPrintDetails.plannedPalletes}`);
            //this._addToGs1Text();
            return result;
        }, 
        _GET_GS1_92: function(){
            //Data z inputu zlecenia
            let result = `(92)${this._oPrintingInterface.INPUT_ORDER_DATE}`;
            this._addToGs1Text(`INTERNAL (92) ${this._oPrintingInterface.INPUT_ORDER_DATE}`);
            return result;
        }, 
        _GET_GS1_251: function(){
            let result = "";
            try{
                result = `(251)${this._oPrintingInterface.INPUT_ORDER}`;
                this._addToGs1Text(`REF. TO SOURCE (251) ${this._oPrintingInterface.INPUT_ORDER}`);
            }catch(oError){}
            return result;
        }, 
        _GET_GS1_01: function(){
            if(this._oPrintingInterface.EAN11){
                let result = `(01)${this._oPrintingInterface.EAN11}`;
                this._addToGs1Text(`GTIN (01) ${this._oPrintingInterface.EAN11}`);
                return result;
            }
            return '';

        }, 
        _GET_GS1_240: function(){
            let result = `(240)${this._oPrintingInterface.MATERIAL}`;
            this._addToGs1Text(`ADDITIONAL ID (240) ${this._oPrintingInterface.MATERIAL}`);
            return result;
        }, 
        _GET_GS1_400: function(){
            let result = "";
            try{
                if(this._oPrintingInterface.PEG_BSTNK){
                    result = `(400)${this._oPrintingInterface.PEG_BSTNK}`;
                    this._addToGs1Text(`ORDER NO.(400) zam ${this._oPrintingInterface.PEG_BSTNK}`);
                }
            }catch(oError){}
            return result;
        }, 
        _GET_GS1_00: function(){
            let result = "";
            const prefixMap = {
                "4100": "1",
                "4200": "2",
                "4300": "3"
            };
            try{
                const huTrimmed = this._oPrintingInterface.HU.slice(5);
                const plantDigit = prefixMap[this._oPrintingInterface.plant] || "9";
                let gs00 = `${plantDigit}5906709${plantDigit}${huTrimmed}`;
                let checkDigit = this._generateCheckDigit(gs00);
                result = `(00)${gs00}${checkDigit}`;
                this._addToGs1Text(`SSCC (00) ${gs00}${checkDigit}`);
            }catch(error){}
            return result;
        }, 
        _GET_GS1_11: function(){
            let result = "";
            try{
                let [day, month, year] = this._oPrintingInterface.PROD_DATE.split(".");
                year = year.slice(-2);
                result = `(11)${year}${month}${day}`;
                this._addToGs1Text(`PROD DATE (11) ${year}${month}${day}`);
            }catch(oError){}
            
            return result;
        }, 
        _GET_GS1_22: function(){
            if(this._oPrintingInterface.PEG_VBELN){
                let result = `(22)${this._oPrintingInterface.PEG_VBELN}/${this._oPrintingInterface.PEG_POSNR}`;
                this._addToGs1Text(`CPV (22) ${this._oPrintingInterface.PEG_VBELN}/${this._oPrintingInterface.PEG_POSNR}`);
                return result;
            }
            return '';

        }, 
        _GET_GS1_10: function(){
            let result = "";
            try{
                result = `(10)${this._oPrintingInterface.order}/${this._oPrintingInterface.OPERATION}`;
                this._addToGs1Text(`BATCH/LOT (10) ${this._oPrintingInterface.order}/${this._oPrintingInterface.OPERATION}`);
            }catch(error){}
            return result;
        }, 
        _GET_GS1_21: function(){
            let result = `(21)${this._oPrintingInterface.HU}`;
            this._addToGs1Text(`SERIAL (21) ${this._oPrintingInterface.HU}`);
            return result;
        }, 
        _GET_GS1_30: function(){
            let result = `(30)${this._oPrintingInterface.QUANTITY}`;
            this._addToGs1Text(`VAR. COUNT (30) ${this._oPrintingInterface.QUANTITY}`);
            return result;
        }, 
        _GET_GS1_241: function(){
            if(this._oPrintingInterface.PEG_KDMAT){
                let result = `(241)${this._oPrintingInterface.PEG_KDMAT}`;
                this._addToGs1Text(`CUST. PART NO. (241)\n${this._oPrintingInterface.PEG_KDMAT}`);
                return result;
            }

            return '';

        },
        _addToGs1Text: function(text){
            if(!this._gs1Text){
                this._gs1Text = text;
            }else{
                this._gs1Text = `${this._gs1Text}\n${text}`;
            }

        },
        _generateCheckDigit: function(input){
            let array = input.split('').reverse();

            let total = 0;
            let i = 1;
            array.forEach(number => {
                number = parseInt(number);
                if (i % 2 === 0) {
                    total = total + number;
                }
                else
                {
                    total = total + (number * 3);
                }
                i++;
            });
            return (Math.ceil(total / 10) * 10) - total;   
        },
        _formatLaBr: function(input){
            let result = input.padStart(4, '0');
            result = result.padEnd(6, '0');

            return result;
        }
        
    });
        printer.PRINT_Q2_RETURN = "Q2_RETURN";
        printer.PRINT_Q1 = "Q1_PRINT";
        printer.PRINT_INPUT_RETURN = "INPUT_RETURN";
        printer.PRINT_INPUT_RETURN_NPW = "INPUT_RETURN_NPW";
    

    return printer;
});