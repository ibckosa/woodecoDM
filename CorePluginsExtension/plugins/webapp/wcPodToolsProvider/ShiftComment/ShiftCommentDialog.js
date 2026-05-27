sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/ErrorHandler",
    "ibc/dm/plugins/wcPodToolsProvider/ShiftComment/ShiftCommentFactory",
    "ibc/dm/plugins/wcPodToolsProvider/GeneralTools"
], function (Object, TextHandler, ErrorHandler, ShiftCommentFactory, GeneralTools) {
    "use strict";
    let ReturnNpwDialog =  Object.extend("ibc.dm.plugins.wcPodToolsProvider.ShiftComment.ShiftCommentDialog", {
        constructor: function(controller, workCenter, plant){
            this._controller = controller;
            this._workCenter = workCenter;  
            this._plant = plant;
            this._errorHandler = new ErrorHandler(this._controller);
            this._textHandler = new TextHandler();

        },
        show: async function(){
            this._checkDummyOrderAndSfc();
            return await new Promise((resolve, reject) => {
                this._resolveDialog = resolve;
                this._rejectDialog = reject;

                if(!this._dialog){
                    this._createDialog();
                }   
                this._dialog.open();
            });
        },
        _checkDummyOrderAndSfc: function(){
            let oConfiguration = this._controller.getConfiguration();
            if(!oConfiguration){this._errorHandler.throwError("error.readConfiguration")};

            if(!oConfiguration.dummySfcSC||oConfiguration.dummySfcSC===""||!oConfiguration.dummyOrderSC||oConfiguration.dummyOrderSC===""){
                this._errorHandler.throwError("error.shiftComment.missingDummyData");
            }else{
                this._dummySfc = oConfiguration.dummySfcSC;
                this._dummyOrder = oConfiguration.dummyOrderSC;
            }
        },
        _createDialog: function () {
            this._shiftComboBox = new sap.m.ComboBox({
                selectedKey: this._calculateCurrentShift(),
                width: "100%",
                selectionChange: this._onCommentCriteriaChanged.bind(this),
                items: [
                    new sap.ui.core.Item({ key: "1", text: "1" }),
                    new sap.ui.core.Item({ key: "2", text: "2" }),
                    new sap.ui.core.Item({ key: "3", text: "3" })
                ]
            });

            this._commentDatePicker = new sap.m.DatePicker({
                displayFormat: "yyyy-MM-dd",
                valueFormat: "yyyy-MM-dd",
                width: "100%",
                change: this._onCommentCriteriaChanged.bind(this),
                value: this._calculateCurrentDate() // (new Date()).toISOString().split("T")[0]
            });

            this._commentTextArea = new sap.m.TextArea({
                width: "100%",
                rows: 10,
                growing: true,
                growingMaxLines: 12,
                placeholder: this._textHandler.getText("labels.shiftComment.enterCommentPlaceholder")
            });

            const form = new sap.ui.layout.form.SimpleForm({
                editable: true,
                layout: "ResponsiveGridLayout",
                labelSpanXL: 3,
                labelSpanL: 3,
                labelSpanM: 4,
                labelSpanS: 12,
                adjustLabelSpan: false,
                emptySpanXL: 1,
                emptySpanL: 1,
                emptySpanM: 0,
                emptySpanS: 0,
                columnsXL: 1,
                columnsL: 1,
                columnsM: 1,
                singleContainerFullSize: false,
                width: "100%",
                content: [
                    new sap.m.Label({
                        text: this._textHandler.getText("labels.shiftComment.workCenter")
                    }),
                    new sap.m.Input({
                        editable: false,
                        value: this._workCenter,
                        width: "100%"
                    }),

                    new sap.m.Label({
                        text: this._textHandler.getText("labels.shiftComment.shift")
                    }),
                    this._shiftComboBox,

                    new sap.m.Label({
                        text: this._textHandler.getText("labels.shiftComment.commentDate")
                    }),
                    this._commentDatePicker,

                    new sap.m.Label({
                        text: ""
                    }),
                    this._commentTextArea
                ]
            });

            const saveButton = new sap.m.Button({
                text: this._textHandler.getText("labels.shiftComment.saveButton"),
                type: "Emphasized",
                press: this._onSaveButton.bind(this)
            });

            const cancelButton = new sap.m.Button({
                text: this._textHandler.getText("labels.shiftComment.cancelButton"),
                type: "Emphasized",
                press: this._onCancelButton.bind(this)
            });

            this._dialog = new sap.m.Dialog({
                contentWidth: "42rem",
                contentHeight: "auto",
                resizable: true,
                draggable: true,
                verticalScrolling: true,
                content: [
                    new sap.m.VBox({
                        width: "100%",
                        class: "sapUiMediumMargin",
                        items: [form]
                    })
                ],
                beginButton: saveButton,
                endButton: cancelButton
            });

            this._onCommentCriteriaChanged();
        },
        _calculateCurrentDate: function(){
            const now = new Date();
            const currentHour = now.getHours();
            if (currentHour >= 0 && currentHour < 6) {
                now.setDate(now.getDate() - 1);
            }
            return now.toISOString().split("T")[0];
        },
        _calculateCurrentShift: function(){
            const currentHour = new Date().getHours();
            if(currentHour >= 6 && currentHour < 14){
                return "1";
            }else if(currentHour >= 14 && currentHour < 22){
                return "2";
            }else{
                return "3";
            }
        },
        _onCancelButton: function(){
            this._dialog.close();
            this._dialog.destroy();
            this._dialog = null;
            this._shiftComboBox = null;
            this._commentDatePicker = null;
            this._commentTextArea = null;
            this._resolveDialog();
        },
        _onSaveButton: async function(){
            debugger;
            try{
                const sShift = this._shiftComboBox.getSelectedKey();
                const sCommentDate = this._commentDatePicker.getValue();
                const sComment = this._commentTextArea.getValue();
                const dateRange = GeneralTools.getShiftRangeFromDate(sShift, sCommentDate);

                let shiftComment = await ShiftCommentFactory.getInstance(this._controller, {
                    workCenter: this._workCenter,
                    plant: this._plant,
                    dummyOrder: this._dummyOrder,
                    dummySfc: this._dummySfc,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    commentDate: sCommentDate,
                    shift: sShift,
                });
                shiftComment.setComment(sComment);
                await shiftComment.save();
                
                this._onCancelButton();
            }catch(error){
                this._errorHandler.handleError(error);
            }
        },
        _onCommentCriteriaChanged: async function () {
            const shift = this._shiftComboBox.getSelectedKey();
            const commentDate = this._commentDatePicker.getValue();

            if (!shift || !commentDate) {
                this._commentTextArea.setValue("");
                return;
            }

            try {
                this._dialog.setBusy(true);
                this._dialog.setBusyIndicatorDelay(0);
                const comment = await this._getCommentForShiftAndDate(shift, commentDate);

                this._commentTextArea.setValue(comment || "");
                this._dialog.setBusy(false);
            } catch (error) {
                this._dialog.setBusy(false);
                this._commentTextArea.setValue("");
            }
        },
        _getCommentForShiftAndDate: async function(shift, commentDate){
            const dateRange = GeneralTools.getShiftRangeFromDate(shift, commentDate);
            let shiftComment = await ShiftCommentFactory.getInstance(this._controller, {
                workCenter: this._workCenter,
                plant: this._plant,
                dummyOrder: this._dummyOrder,
                dummySfc: this._dummySfc,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                commentDate: commentDate,
                shift: shift,
            });
            return shiftComment.getComment();
        }

    });

    return ReturnNpwDialog;
});