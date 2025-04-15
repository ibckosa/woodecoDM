sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let oSmartEditGraphic =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.SmartEditGraphic", {
        constructor: function(oController, oGraphicId){
            this._oController = oController;
            this._oGraphicId = oGraphicId;
        },

        readData: async function(){
            let oEndPoint = this._getEndPoint();
            if(oEndPoint === ""){ return oEndPoint; }

            let sUrl = this._oController.getPublicApiRestDataSourceUri() + oEndPoint + "&async=false";

            let oParameters = { async: false,
                                decorId: this._oGraphicId };

            return await new Promise((resolve,reject)=>{
                this._oController.ajaxPostRequest(sUrl, oParameters,
                    (oResponseData) => {
                        debugger;
                        this._oDetails = oResponseData.responseData;
                        resolve();
                    },
                    (oError, sHttpErrorMessage) => {
                        debugger;
                        reject(oError);
                    }   
                );

            });
        },
        getGraphicLink: function(){
            let oReturn = "";
            try{
                let detailsLarge = this._oDetails.decorZoomOutPictureLinks.find(picture => { return picture.linkFormat === "detailsLarge";});
                oReturn = detailsLarge.linkValue;
            }catch(oError){}

            return oReturn;
        },
        _getEndPoint: function(){
            let oReturn = "";
            try{
                let oEndPoint = this._oController.getConfigurationValue("smartEditUrl");
                if(oEndPoint){
                    oReturn = oEndPoint;
                }
            }catch(oError){}
            return oReturn;
        }

    });


    return oSmartEditGraphic;
});