sap.ui.define([
    "sap/ui/base/ManagedObject",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorAlert"
], function (ManagedObject, TextHandler, ErrorAlert) {
    "use strict";
    return ManagedObject.extend("ibc.dm.plugins.wcPodToolsProvider.ErrorHandler", {
        constructor: function(oController){
            //Object.prototype.constructor.apply(this, arguments);
            this._oController = oController;
            this._textHandler = new TextHandler();
        },

        setErrorContext: function(parameters){
          this._errorContext = parameters;
        },

        handleError: function(oError){
            let oErrorText = this.getTextFromError(oError);
            if(oError.apiName){
                oErrorText = `Error in API: ${oError.apiName}\n${oErrorText}`;
            }
            if(!oError.displayType){
                this.showError(oErrorText);
            }else if(oError.displayType === "POPUP"){ 
                this.showErrorAsPopup(oErrorText);
            }else{}

            if(oError.sendAlert){
              this._sendAlert(oErrorText);
            }
        },
        _sendAlert: function(errorText){
          if(this._errorContext){
            ErrorAlert.createAlert(this._oController, { PLANT: this._errorContext.plant,
                                                        SFC: this._errorContext.sfc,
                                                        ErrorDesc: errorText,
                                                        Resource: this._errorContext.resource });
          } 
        },
        showError: function(oErrorText){
            this._oController.showErrorMessage(oErrorText, true, true);
        },
        showErrorAsPopup: function(oErrorText){
            this._oController.showErrorMessage(oErrorText, false, true);
        },
        getTextFromError: function(oError){
            let oReturn = "";

            if(oError===undefined){
                oReturn = this._textHandler.getText("error.generalError");
            }else if(oError.displayMessage){
                oReturn = oError.displayMessage;
            }else if(oError.causeMessage){
                oReturn = oError.causeMessage;
            }else if(oError.message){
                oReturn = oError.message;
            }else if(oError.errorMessage){
                oReturn = oError.errorMessage;
            }else if(oError.error&&oError.error.message){
                oReturn = oError.error.message;
            }            
            else{
                oReturn = oError.toString();
            }

            if(oReturn===""){
                oReturn = this._textHandler.getText("error.generalError");
            }
            return oReturn;
        },
        throwError: function(oTextId, ...args){
            let oError = {errorMessage: this._textHandler.getText(oTextId, ...args)};
            throw oError;
        },
        throwErrorPopup: function(oTextId, ...args){
            let oError = { errorMessage: this._textHandler.getText(oTextId, ...args),
                           displayType: "POPUP" };
            throw oError;
        },
        throwErrorPopupWithAlert: function(oTextId, ...args){
            let oError = { errorMessage: this._textHandler.getText(oTextId, ...args),
                           displayType: "POPUP",
                           sendAlert: true };
            throw oError;
        },

        throwErrorNoDisplay: function(oTextId, ...args){
            let oError = { errorMessage: this._textHandler.getText(oTextId, ...args),
                           displayType: "NO_DISPLAY" };
            throw oError;
        },
        throwErrorWithApiName(apiName,oTextId, ...args){
            let oError = { 
                apiName: apiName,
                errorMessage: this._textHandler.getText(oTextId, ...args)};
            throw oError;
        }
    })
});