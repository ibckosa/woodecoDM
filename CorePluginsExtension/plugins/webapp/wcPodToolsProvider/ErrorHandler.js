sap.ui.define([
    "sap/ui/base/ManagedObject",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler"
], function (ManagedObject, TextHandler) {
    "use strict";
    return ManagedObject.extend("ibc.dm.plugins.wcPodToolsProvider.ErrorHandler", {
        constructor: function(oController){
            //Object.prototype.constructor.apply(this, arguments);
            this._oController = oController;
            this._textHandler = new TextHandler();
        },

        handleError: function(oError){
            let oErrorText = this.getTextFromError(oError);
            if(!oError.displayType){
                this.showError(oErrorText);
            }else if(oError.displayType === "POPUP"){ 
                this.showErrorAsPopup(oErrorText);
            }else{}
            
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
            }else{
                oReturn = oError;
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
        throwErrorNoDisplay: function(oTextId, ...args){
            let oError = { errorMessage: this._textHandler.getText(oTextId, ...args),
                           displayType: "NO_DISPLAY" };
            throw oError;
        }
    })
});