sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/GeneralTools"
], function (ObjectUI5, GeneralTools) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.wcPodToolsProvider.ShiftComment.ShiftComment", {
        constructor: function(controller, plant, workCenter, version, commentDate, shift, postingDate, comment, dummyOrder, dummySfc){
            this._controller = controller;
            this._plant = plant;
            this._workCenter = workCenter;
            this._version = version;
            this._comment = comment;
            this._dummyOrder = dummyOrder;
            this._dummySfc = dummySfc;
            this._commentDate = commentDate; 
            this._postingDate = postingDate;
            this._shift = shift;
        },

        getComment: function(){
            return this._comment;
        },

        setComment: function(comment){
            this._comment = comment;
        },
        getVersion: function(){
            return this._version;
        },
        setVersion: function(version){
            this._version = version;
        },
        getCommentDate: function(){
            return this._commentDate;
        },
        setCommentDate: function(date){
            this._commentDate = date;
        },
        getPostingDate: function(){
            return this._postingDate;
        },
        setPostingDate: function(postingDate){
            this._postingDate = postingDate;
        },
        save: async function(){
            let guid = crypto.randomUUID();
            let requestParameters = {
                group: {
                    name: "RAPORT_KOMENTARZ",
                    version: "A"
                },
                sfcs: [this._dummySfc],//,
                parameterValues: [  { comment: guid, name: "KOMENTARZ", value: this._comment },
                                    { comment: guid,  name: "STANOWISKO", value: this._workCenter },
                                    { comment: guid,  name: "WERSJA", value: this._version.toString() },
                                    { comment: guid,  name: "DATA", value: this._commentDate },
                                    { comment: guid,  name: "ZMIANA", value: this._shift } ],
                resource: "DUMMY_RESOURCE",
                operation: {
                    operation: "DUMMY_OPERATION",
                    version: "A"
                },
                plant: this._plant,
                postingDateTime: GeneralTools.convertDateToIsoFormat(this._postingDate) 
            };
            let sUrl = this._controller.getPublicApiRestDataSourceUri() + "datacollection/v1/log";

            return await new Promise((resolve,reject)=>{
                this._controller.ajaxPostRequest(sUrl, requestParameters,
                    (oResponseData) => {
                        resolve(oResponseData);
                        
                    },
                    (oError, sHttpErrorMessage) => {
                        reject(oError);
                    }   
                );

            });
        }

    });
});