sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginExtensionProvider",
    "ibc/dm/plugins/wcPodToolsProvider/LifecycleExtension",
    "ibc/dm/plugins/wcPodToolsProvider/PluginEventExtension",
    "ibc/dm/plugins/wcPodToolsProvider/PropertyEditorExtension",
    "ibc/dm/plugins/wcPodToolsProvider/PalleteQueueHandler"
    // "ibc/dm/plugins/utils/ExtensionUtilities",
    // "ibc/dm/plugins/utils/PodSelectionExtensionUtility"
], function (PluginExtensionProvider, LifecycleExtension, PluginEventExtension, 
             PropertyEditorExtension, PalleteQueueHandler) {
    "use strict";
    return PluginExtensionProvider.extend("ibc.dm.plugins.wcPodToolsProvider.ExtensionProvider", {
        constructor: function () {
            // this.oExtensionUtilities = new ExtensionUtilities();
            // this.oExtensionUtility = new ExtensionUtility();
        },
        getExtensions: function () {
            let oLifecycleExtension = new LifecycleExtension();
            let oPluginEventExtension = new PluginEventExtension();
            let oPropertyEditorExtension = new PropertyEditorExtension();
            this._addCustomStyle();
            return [oLifecycleExtension, oPluginEventExtension, oPropertyEditorExtension];

        },
        _addCustomStyle: function(){
            try{

            debugger;
                let oHead = document.getElementsByTagName("head")[0];
                let oStyle = document.createElement("style");
                oStyle.type = "text/css";
                oStyle.innerHTML = `
                    .sapMBtn.bigButtonNC .sapMBtnInner {
                    padding-top: 1rem;
                    padding-left: 0.5rem;
                    padding-right: 0.5rem;
                    padding-bottom: 0.5rem;
                    text-align: center;
                    font-size: 2rem;
                    height: 4rem;
                    background-color: #107E3E;
                    color: white;
                    }

                    .sapMBtn.bigButtonLHU .sapMBtnInner {
                        font-size: 2rem;
                        height: 4.5rem;
                        padding-top: 0rem;
                        text-align: center;
                        background-color: #107E3E;
                        color: white;
                    }

                    .bigButtonLHU .sapMBtnInner {
                        height: 4rem;
                    }

                    .sapMBtn.bigButtonLHU {
                        height: 3rem;
                        padding: 0rem;
                    }




                    `;
                oHead.appendChild(oStyle);
            }catch(error){}
        }
    })
});