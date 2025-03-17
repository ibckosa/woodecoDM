sap.ui.define([
    "sap/ui/base/ManagedObject"
], function (ManagedObject) {
    "use strict";
    return ManagedObject.extend("ibc.dm.plugins.wcPodToolsProvider.TextHandler", {
        constructor: function(){
            ManagedObject.prototype.constructor.apply(this, arguments);
            let oResourceModel = new sap.ui.model.resource.ResourceModel({
                bundleName : "ibc.dm.plugins.wcPodToolsProvider.i18n.i18n"
            });
            this.setModel(oResourceModel);
        },

        getText: function(oTextId){

            let oReturn = "";
            try{
                 oReturn = this.getModel().getResourceBundle().getText(oTextId);
            }catch(oError){
                oReturn = oTextId;
            }
            return oReturn;
            
        }

    })

});