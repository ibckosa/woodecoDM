sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginExtensionProvider",
    "ibc/dm/plugins/wcPodSelectionExtensionProvider/LifecycleExtension",
    "ibc/dm/plugins/wcPodSelectionExtensionProvider/PluginEventExtension",
    "ibc/dm/plugins/wcPodSelectionExtensionProvider/PropertyEditorExtension",
    "ibc/dm/plugins/utils/ExtensionUtilities",
    "ibc/dm/plugins/utils/PodSelectionExtensionUtility",
    "ibc/dm/plugins/wcPodToolsProvider/PalleteQueueHandler"
], function (PluginExtensionProvider, LifecycleExtension, PluginEventExtension, 
             PropertyEditorExtension, ExtensionUtilities, ExtensionUtility, PalleteQueueHandler) {
    "use strict";
    return PluginExtensionProvider.extend("ibc.dm.plugins.wcPodSelectionExtensionProvider.ExtensionProvider", {
        constructor: function () {
            this.oExtensionUtilities = new ExtensionUtilities();
            this.oExtensionUtility = new ExtensionUtility();
        },
        getExtensions: function () {
            let oLifecycleExtension = new LifecycleExtension(this.oExtensionUtilities, this.oExtensionUtility);
            let oPluginEventExtension = new PluginEventExtension(this.oExtensionUtilities, this.oExtensionUtility);
            this.oExtensionUtility.setPluginEventExtension(oPluginEventExtension);
            let oPropertyEditorExtension = new PropertyEditorExtension(this.oExtensionUtilities);
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

                    .bigButtonLHU .sapMBtnContent {
                        white-space: wrap;
                        padding-inline: 0.2rem;
                        line-height: 1.70rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    `;
                oHead.appendChild(oStyle);
            }catch(error){}
        }
    })
});