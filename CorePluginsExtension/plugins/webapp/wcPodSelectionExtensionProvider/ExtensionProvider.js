sap.ui.define([
    "sap/dm/dme/podfoundation/extension/PluginExtensionProvider",
    "ibc/dm/plugins/wcPodSelectionExtensionProvider/LifecycleExtension",
    "ibc/dm/plugins/wcPodSelectionExtensionProvider/PluginEventExtension",
    "ibc/dm/plugins/wcPodSelectionExtensionProvider/PropertyEditorExtension",
    "ibc/dm/plugins/utils/ExtensionUtilities",
    "ibc/dm/plugins/utils/PodSelectionExtensionUtility",
    "ibc/dm/plugins/wcPodToolsProvider/ReturnNpwDialog",
    "ibc/dm/plugins/wcPodToolsProvider/PalleteQueueHandler",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/IssuesManager",
    "ibc/dm/plugins/wcPodToolsProvider/LinkReader",
    "ibc/dm/plugins/wcPodToolsProvider/SfcReceipt",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository"

], function (PluginExtensionProvider, LifecycleExtension, PluginEventExtension, 
             PropertyEditorExtension, ExtensionUtilities, ExtensionUtility, ReturnNpwDialog, PalleteQueueHandler, ErrorHandler, IssuesManager, OrderRepository, LinkReader ) {
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
                        font-size: 1.5rem;
                        height: 3.5rem;
                        padding-top: 0rem;
                        text-align: center;
                        background-color: #107E3E;
                        color: white;
                    }

                    .bigButtonLHU .sapMBtnInner {
                        height: 3rem;
                    }

                    .sapMBtn.bigButtonLHU {
                        height: 2.5rem;
                        padding: 0rem;
                    }

                    .bigButtonLHU .sapMBtnContent {
                        white-space: wrap;
                        padding-inline: 0.15rem;
                        line-height: 1.6rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .redBoldedRow .sapMText {
                        color: red !important;
                        font-weight: bold !important;
                    }

                    .fontTextHuDialog {
                        font-size: 2rem;
                        font-weight: bold !important;
                        color: black !important;
                    }

                    .fontTextQuanDialog {
                        font-size: 1.7rem;
                    }


                    .sapMBtn.bigButtonDialogHu .sapMBtnInner {
                        font-size: 2rem;
                        height: 3.3rem;
                        text-align: center;
                        background-color: #107E3E;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        /* transform: scale(2); */
                    }

                    .sapMInputBase.inputFontDialog {
                        height: 2.5rem;
                    }

                    .sapMInputBase.inputFontDialog .sapMInputBaseContentWrapper {
                        height: 2.5rem;
                    }

                    .sapMInputBase.inputFontDialog .sapMInputBaseContentWrapper .sapMInputBaseInner {
                        font-size: 2rem;
                    }


                    .sapMInputBase.inputFont{
                        height: 3rem;
                    }
                    .sapMInputBase.inputFont .sapMInputBaseContentWrapper{
                        height: 3rem;
                    }
                    .sapMInputBase.inputFont .sapMInputBaseContentWrapper .sapMInputBaseInner{
                        font-size: 2.5rem;
                    }
                    .printRadioButtonGroup .sapMLabel {
                        font-size: 2rem;
                    }

                    .fontText{
                        font-size: 2.5rem;
                    }


                    @keyframes blink {
                        0% {
                            color: red;
                        }

                        50% {
                            color: black;
                        }


                        100% {
                            color: red;
                        }
                    }

                    .blinking .sapMObjStatusIcon {
                        animation: blink 1s infinite;
                        font-weight: bold;
                        width: 2rem;
                        height: auto;
                    }

                    .blinking .sapMObjStatusText {
                        animation: blink 1s infinite;
                        font-weight: bold;
                        font-size: 1.5rem;

                    }

                    .blinking .sapUiIcon {
                        font-size: 1.5rem;
                    }

                    .blinking .sapMObjStatus {
                        width: 2rem;
                        height: 2rem;
                    }

                    `;
                oHead.appendChild(oStyle);
            }catch(error){}
        }
    })
});


