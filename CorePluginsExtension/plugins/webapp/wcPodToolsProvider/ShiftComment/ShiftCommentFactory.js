sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/ShiftComment/ShiftComment",
    "ibc/dm/plugins/wcPodToolsProvider/GeneralTools"
], function (ObjectUI5, ShiftComment, GeneralTools) {
    "use strict";
    let ShiftCommentFactory = ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.ShiftComment.ShiftCommentFactory", {
    });

    ShiftCommentFactory.getInstance =  async function(controller, parameters){
        //parameters
        ///plant
        ///workCenter
        ///dummyOrder
        ///dummySfc
        ///startDate
        ///endDate
        ///commentDate
        //shift
        let shiftCommentInstance =  new ShiftComment(controller, parameters.plant, parameters.workCenter, 1, parameters.commentDate, parameters.shift, parameters.startDate, "", parameters.dummyOrder, parameters.dummySfc);
        
        let lastShiftComment = await this._getlastShiftComment(controller, parameters);
        if(lastShiftComment&&lastShiftComment.result&&lastShiftComment.result.REPORTED_AT_TIMESTAMP){
            shiftCommentInstance.setCommentDate(lastShiftComment.result.DATA);
            shiftCommentInstance.setComment(lastShiftComment.result.KOMENTARZ);
            shiftCommentInstance.setPostingDate(this._getNextPostingDate(lastShiftComment.result.REPORTED_AT_TIMESTAMP));
        }
        return shiftCommentInstance;

    };

    ShiftCommentFactory._getNextPostingDate = function(timestamp){
        let createdDate = new Date(timestamp);
        createdDate.setSeconds(createdDate.getSeconds() + 1);
        return createdDate;
    }

    ShiftCommentFactory._getlastShiftComment = async function(controller, parameters){
        let sUrl = controller.getPublicApiRestDataSourceUri()  +  "/pe/api/v1/process/processDefinitions/start?key=REG_ce1efbfa-0f00-4125-9400-8c045885d0ad" + "&async=false";

        let requestParameters = {
            plant: parameters.plant,
            workCenter: parameters.workCenter,
            order: parameters.dummyOrder,
            startDate: GeneralTools.convertDateToIsoFormat(parameters.startDate),
            endDate: GeneralTools.convertDateToIsoFormat(parameters.endDate),
            async: false
        };
        return await new Promise((resolve,reject)=>{
            controller.ajaxPostRequest(sUrl, requestParameters,
                (oResponseData) => {
                    resolve(oResponseData);
                },
                (oError, sHttpErrorMessage) => {
                    reject(oError);
                }
            );
        });

        // let apiData = await this._getApiData(controller, parameters);
        return null;
    };
    ShiftCommentFactory._getApiData = async function (controller, parameters) {
        const requestParameters = {
            dcGroup: {
                name: "RAPORT_KOMENTARZ",
                version: "A"
            },
            plant: parameters.plant,
            sfcs: [parameters.dummySfc],//parameters.dummySfc,
            operation: {
                operation: "DUMMY_OPERATION",
                version: "A"
            },
            resource: "DUMMY_RESOURCE",
            // startDateTime: GeneralTools.convertDateToIsoFormat(parameters.startDate),
            // endDateTime: GeneralTools.convertDateToIsoFormat(parameters.endDate),
            page: 0,
            size: 50
        };

        const firstResult = await this._callApi(controller, requestParameters);

        let result = firstResult?.content || [];

        const totalPages = firstResult?.totalPages || 0;

        if (totalPages <= 1) {
            return result;
        }

        const pageNumbers = [];

        for (let page = 1; page < totalPages; page++) {
            pageNumbers.push(page);
        }

        const chunkSize = 20;

        for (let i = 0; i < pageNumbers.length; i += chunkSize) {
            const pageChunk = pageNumbers.slice(i, i + chunkSize);

            const promises = pageChunk.map(page => {
                const nextRequestParameters = {
                    ...requestParameters,
                    page: page
                };

                return this._callApi(controller, nextRequestParameters);
            });

            const chunkResults = await Promise.all(promises);

            chunkResults.forEach(pageResult => {
                if (pageResult?.content?.length) {
                    result.push(...pageResult.content);
                }
            });
        }

        return result;
    };
    ShiftCommentFactory._callApi = async function(controller, requestParameters){
        let sUrl = controller.getPublicApiRestDataSourceUri() + "datacollection/v1/measurements";

        return await new Promise((resolve,reject)=>{
            controller.ajaxGetRequest(sUrl, requestParameters,
                (oResponseData) => {
                    if(!oResponseData.data){
                        oResponseData.data = [];
                    }
                    resolve(oResponseData);                  
                },
                (oError, sHttpErrorMessage) => {
                    reject(oError);
                }   
            );
        });
    };

    return ShiftCommentFactory;
});