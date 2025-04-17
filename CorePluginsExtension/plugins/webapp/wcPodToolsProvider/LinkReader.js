sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository", 
    "ibc/dm/plugins/wcPodToolsProvider/SfcRepository"
], function (ObjectUI5, OrderRepository, SfcRepository) {
    "use strict";
    let oLinkReader =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.LinkReader", {

    });


    oLinkReader.readLinks = async function (oController, oSfcNumber, oOrderNumber) {
        let oReturn = [];
        debugger;
        try{
            let oPlant = oController.getPodController().getUserPlant();
            let oOrder = await OrderRepository.readOrder(oController, oPlant, oOrderNumber);
            let oOrderDetails = oOrder.getDetails();


            let oFirstLineFields = oOrderDetails.customValues.find( customValue => { return customValue.attribute === "ITEM_01" } );
            if(oFirstLineFields){
                let oSplittedLine = oFirstLineFields.value.split("||");
                const oLineValues = oSplittedLine
                .filter(item => item.includes(":")) 
                .map(item => {
                  const colonIndex = item.indexOf(":");
                  const field_name = item.substring(0, colonIndex).trim();
                  const field_value = item.substring(colonIndex + 1).trim();
                  return { field_name, field_value };
                });
    
                let oLineValuesFiltered = oLineValues.filter( value => { return value.field_name === "EWU_LBL" ||
                                                                                value.field_name === "KUNWE_SPEC" ||
                                                                                value.field_name === "ZZVERP_SCH"; });
    
                for(const lineValue of oLineValuesFiltered){
                    oReturn.push({
                        fileName: lineValue.field_name,
                        fileDescription: lineValue.field_name,
                        fileLink: lineValue.field_value
                    });
                }
            }
            let oHEADER_OPTIMCUT = oOrderDetails.customValues.find( customValue => { return customValue.attribute === "HEADER_OPTIMCUT" } );
            if(oHEADER_OPTIMCUT && oHEADER_OPTIMCUT.value){
                oReturn.push({
                    fileName: oHEADER_OPTIMCUT.attribute,
                    fileDescription: oHEADER_OPTIMCUT.attribute,
                    fileLink: oHEADER_OPTIMCUT.value
                });
            }
            
        }catch(oError){}

        return oReturn;
    };


    return oLinkReader;
});