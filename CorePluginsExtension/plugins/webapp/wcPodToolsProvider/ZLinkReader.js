sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/OrderRepository",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
], function (ObjectUI5, OrderRepository, TextHandler) {
    "use strict";
    let oLinkReader =  ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.ZLinkReader", {

    });


    oLinkReader.readLinks = async function (oController, oOrderNumber, oItemNumber = "1") {
        let oReturn = [];
        try{
            let oPlant = oController.getPodController().getUserPlant();
            let oOrder = await OrderRepository.readOrder(oController, oPlant, oOrderNumber);
            let oOrderDetails = oOrder.getDetails();

            if(oItemNumber.length<2){
                oItemNumber = `0${oItemNumber}`
            }


            let oLine = oOrderDetails.customValues.find( customValue => { return customValue.attribute === `ITEM_${oItemNumber}` } );
            if(oLine){
                let oSplittedLine = oLine.value.split("||");
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
                                                                                value.field_name === "ZZVERP_SCH" ||
                                                                                value.field_name === "KUNWE_SPEC" ||
                                                                                value.field_name === "MKM_OBERFL_VS" ||
                                                                                value.field_name === "MKM_OBERFL_RS" ||
                                                                                value.field_name === "MKM_CYL_V1" ||
                                                                                value.field_name === "MKM_CYL_V2" ||
                                                                                value.field_name === "MKM_CYL_V3" ||
                                                                                value.field_name === "MKM_CYL_V4" ||
                                                                                value.field_name === "MKM_CYL_R1" ||
                                                                                value.field_name === "MKM_CYL_R2" ||
                                                                                value.field_name === "MKM_CYL_R3" ||
                                                                                value.field_name === "MKM_CYL_R4" ||
                                                                                value.field_name === "MKM_ELE_LK1" ||
                                                                                value.field_name === "MKM_ELE_LK2" ||
                                                                                value.field_name === "MKM_ELE_LK1_LK2"; });
    
                for(const lineValue of oLineValuesFiltered){
                    oReturn.push({
                        fileName: lineValue.field_name,
                        fileDescription: this._getFileDescription(lineValue.field_name),
                        fileLink: lineValue.field_value
                    });
                }
            }
            let oHEADER_OPTIMCUT = oOrderDetails.customValues.find( customValue => { return customValue.attribute === "HEADER_OPTIMCUT" } );
            if(oHEADER_OPTIMCUT && oHEADER_OPTIMCUT.value){
                oReturn.push({
                    fileName: oHEADER_OPTIMCUT.attribute,
                    fileDescription: this._getFileDescription(oHEADER_OPTIMCUT.attribute),
                    fileLink: oHEADER_OPTIMCUT.value
                });
            }
            
        }catch(oError){}

        return oReturn;
    };

    oLinkReader._getFileDescription = function(oFileName){
        let _oTextHandler = new TextHandler();
        let oReturn = "";
        try{
            oReturn = _oTextHandler.getText(`label.graphic.${ oFileName }`);
        }catch(oError){}
        
        return oReturn;
    };


    return oLinkReader;
});