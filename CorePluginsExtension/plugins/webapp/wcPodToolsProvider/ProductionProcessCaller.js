sap.ui.define([
    "sap/ui/base/Object"
], function (ObjectUI5) {
    "use strict";
    let productionProcessCaller = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.ProductionProcessCaller", {

    });

    // REG_<guid> keys of DM "Production Process" definitions (DM admin > Production Process),
    // each invoked through the generic Process Engine endpoint below.
    // Add every new process here instead of inlining its REG_ key at the call site.
    productionProcessCaller.PROCESS_KEYS = {
        COMPLETE_ORDER: "REG_ddb75e26-256f-4685-9dc3-4ab8654d42e4"
    };

    // Starts a DM Production Process by its REG_ key.
    // controller: the plugin/component controller (must expose getPublicApiRestDataSourceUri/ajaxPostRequest)
    // sProcessKey: one of productionProcessCaller.PROCESS_KEYS, or a raw "REG_<guid>" string
    // oParameters: request body, as defined by the process's own Service Definition
    // bAsync: defaults to true, matching the DM-side default for every Production Process's "async" parameter
    productionProcessCaller.start = async function(controller, sProcessKey, oParameters, bAsync){
        if(typeof bAsync === "undefined" || bAsync === null){
            bAsync = true;
        }

        let sUrl = controller.getPublicApiRestDataSourceUri() + `/pe/api/v1/process/processDefinitions/start?key=${sProcessKey}&async=${bAsync}`;

        return await new Promise((resolve, reject) => {
            controller.ajaxPostRequest(sUrl, oParameters,
                (oResponseData) => {
                    resolve(oResponseData);
                },
                (oError, sHttpErrorMessage) => {
                    reject(oError);
                }
            );
        });
    };

    return productionProcessCaller;
});
