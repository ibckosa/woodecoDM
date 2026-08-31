sap.ui.define([
    "sap/ui/base/Object",
    "ibc/dm/plugins/vPlgProductionReport/vPlgProductionReport/controller/ProductionReportProductionData",
    "ibc/dm/plugins/vPlgProductionReport/vPlgProductionReport/controller/ProductionReportDowntimeData",
    "sap/ui/core/date/UI5Date",
    "ibc/dm/plugins/wcPodToolsProvider/TextHandler",
    "ibc/dm/plugins/wcPodToolsProvider/ResourceRepository",
    "ibc/dm/plugins/wcPodToolsProvider/WorkCenterRepository",
    "ibc/dm/plugins/wcPodToolsProvider/ShiftComment/ShiftCommentFactory",
    "ibc/dm/plugins/wcPodToolsProvider/GeneralTools"
], function (ObjectUI5, ProductionReportProductionData, ProductionReportDowntimeData, UI5Date, TextHandler, ResourceRepository, WorkCenterRepository, ShiftCommentFactory, GeneralTools) {
    "use strict";
    return ObjectUI5.extend("ibc.dm.plugins.vPlgProductionReport.vPlgProductionReport.controller.ProductionReportModel", {

        EVENT_TYPES: {
            Q1: "Q1",
            Q2: "Q2",
            Q3: "Q3",
            Q23: "Q3"
        },

        constructor: function(controller, parameters){
            this._controller = controller;
            this._parameters = parameters;
            this._textHandler = new TextHandler();
        },
        getReportData: async function(){
            await this._getPlanQuantities();
            let productionResults = await this._getProductionData();
            let downTimesResults = await this._getDownTimes();
            let shiftComments = await this._getShiftComments();
            return { dataModel: downTimesResults.dataModel,
                     shiftDates: downTimesResults.shiftDates,
                     downtimesCategories: downTimesResults.downtimesCategories,
                     availabilityPercentage: downTimesResults.availabilityPercentage,
                     targetPercentage: this._availabilityPlanPercentage,
                     productionAggregated: productionResults.dataAggregated,
                     productionUnAggregated: productionResults.dataUnAggregated,
                     shiftComments: shiftComments };
            
        },
        _getPlanQuantities: async function(){
            let resource = await ResourceRepository.getResourceInstance(this._controller, this._parameters.plant,  this._parameters.resource);
            let workCenter = await WorkCenterRepository.getInstance(this._controller, this._parameters.plant,  this._parameters.workCenter);

            this._planQ1Percentage = workCenter.getQ1PercentagePlan();
            this._dayPlanQuan = workCenter.getDayPlanQuan();
            this._planUom = workCenter.getDayPlanUom();
            this._availabilityPlanPercentage = resource.getAvailabilityPlanPercentage();
        },
        _getProductionData: async function(){
            let shiftDates = this._getShiftDates();
            let parameters = this._parameters;
            if(this._parameters.date){
                parameters.shiftStart = shiftDates.startDate;
                parameters.shiftStop = shiftDates.endDate;
            }

            let productionReportProductionData = new ProductionReportProductionData(this._controller, this._parameters);
            let productionData = await productionReportProductionData.getData();

            let productionTables = this._buildProductionTables(productionData);

            if(this._parameters.shiftNumber === 'onlyDay'){
                productionTables.dataUnAggregated = productionTables.dataUnAggregated.filter(data=>{return data.shift===""});
                productionTables.dataAggregated = productionTables.dataAggregated.filter(data=>{return data.shift===""});
            }else if(this._parameters.shiftNumber){
                productionTables.dataUnAggregated = productionTables.dataUnAggregated.filter(data=>{return data.shift===this._parameters.shiftNumber});
                productionTables.dataAggregated = productionTables.dataAggregated.filter(data=>{return data.shift===this._parameters.shiftNumber});
            }

            return { dataUnAggregated: productionTables.dataUnAggregated,
                     dataAggregated: productionTables.dataAggregated };
            

        },
        _getDownTimes: async function(){
            let downTimesAdjusted = [];
            let calendarItems = [];
            let productionReportDowntimeData = new ProductionReportDowntimeData(this._controller, this._parameters);
            
            let downTimeData = await productionReportDowntimeData.getData();
            let shiftDates = this._getShiftDates();

            for(const downTimeRecord of downTimeData){
                if(downTimeRecord.shifts){
                    for(const shift of downTimeRecord.shifts){
                        if(shift.downtimes){
                            for(const downTime of shift.downtimes){
                                downTimesAdjusted.push(this._adjustDownTimeRecordToFilter(downTime,shiftDates.startDate,shiftDates.endDate));

                            }
                        }
                    }
                }
            }
            downTimesAdjusted = downTimesAdjusted.filter(downTime=>{return downTime.toSkip===false&&downTime.timeElement;});

            await this._getCodeDescription(downTimesAdjusted);

            let downTimesCategories = [ { categoryName: "PRODUCTION", color: "#43A047", categoryDescription: this._textHandler.getText("labels.productionReport.production"), valueInt: 0 ,value: 0 },
                { categoryName: "INDEPENDENT", color: "#1E88E5", categoryDescription: this._textHandler.getText("labels.productionReport.independent"), valueInt: 0, value: "0" },
                { categoryName: "CHANGEOVER", color: "#8E24AA", categoryDescription: this._textHandler.getText("labels.productionReport.changeover"), valueInt: 0, value: "0" },
                { categoryName: "ECONOMIC_DOWN", color: "#FB8C00", categoryDescription: this._textHandler.getText("labels.productionReport.economicDown"), valueInt: 0, value: "0" },
                { categoryName: "REPAIRS", color: "#00ACC1", categoryDescription: this._textHandler.getText("labels.productionReport.repairs"), valueInt: 0, value: "0" },
                { categoryName: "TECHNICAL", color: "#E53935", categoryDescription: this._textHandler.getText("labels.productionReport.technical"), valueInt: 0, value: "0" },
                { categoryName: "TECHNOLOGICAL", color: "#FDD835", categoryDescription: this._textHandler.getText("labels.productionReport.technological"), valueInt: 0, value: "0" },
                { categoryName: "LOGISTICS", color: "#212121", categoryDescription: this._textHandler.getText("labels.productionReport.logistics"), valueInt: 0, value: "0" }
            ];

            for(const downTime of downTimesAdjusted){
                calendarItems.push({ start: downTime.startDateTime,
                                     end: downTime.endDateTime,
                                     categoryName: "DOWNTIME",
                                     categoryDescription: "",
                                     type: this._getCalendarItemType(downTime.timeElement),
                                     color: this._getCalendarItemColor(downTime.timeElement),
                                     description: downTime.description,
                                     timeInMinutes: Math.round(downTime.downTimeSeconds/60),
                                     tentative: false }); 
                                     
                let categoryRow = downTimesCategories.find(category=>{return category.categoryName === downTime.timeElement;});
                if(categoryRow){
                    categoryRow.valueInt = categoryRow.valueInt + downTime.downTimeSeconds;
                }
            }

            let totalSeconds = 0
            for(const categoryRow of downTimesCategories){
                categoryRow.value = `${ Math.round( categoryRow.valueInt / 60 ) }`;
                totalSeconds = totalSeconds + categoryRow.valueInt;
            }
            downTimesCategories.push({ categoryName: "TOTAL", categoryDescription: this._textHandler.getText("labels.productionReport.total"), valueInt: totalSeconds, value: `<strong>${Math.floor(totalSeconds/60)}</strong>` });


            let returnDataModel = [{ pic: "",
                                     name: this._parameters.resource,
                                     role: "",
                                     items: calendarItems }];
            return { dataModel: returnDataModel,
                     shiftDates: shiftDates,
                     downtimesCategories: downTimesCategories,
                     availabilityPercentage: parseInt((shiftDates.totalSeconds - totalSeconds)*100/shiftDates.totalSeconds) };
        },

        _getCodeDescription: async function(downTimes){
            let reasonCodes = [];

            for(const downTime of downTimes){
                downTime.reasonCodeSelected =
                    downTime.reasonCode10 ||
                    downTime.reasonCode9 ||
                    downTime.reasonCode8 ||
                    downTime.reasonCode7 ||
                    downTime.reasonCode6 ||
                    downTime.reasonCode5 ||
                    downTime.reasonCode4 ||
                    downTime.reasonCode3 ||
                    downTime.reasonCode2 ||
                    downTime.reasonCode1 ||
                    downTime.reasonCode;

                if(downTime.reasonCodeSelected){
                    let reasonCodePushed = reasonCodes.find(code=>{return code === downTime.reasonCodeSelected });
                    if(!reasonCodePushed){
                        reasonCodes.push(downTime.reasonCodeSelected);
                    }
                }

            }

            let reasonCodesDescription = await this._getReasonCodeDescriptions(reasonCodes);

            for(const downTime of downTimes){
                let reasonCodeDescription = reasonCodesDescription.find(code=>{ return code.code === downTime.reasonCodeSelected });
                if(reasonCodeDescription){
                    downTime.description = reasonCodeDescription.description;
                }else{
                    downTime.description = "";
                }
            }
        },
        _getReasonCodeDescriptions: async function(reasonCodes){
            let result = [];
            let calls = [];
            for(const reasonCode of reasonCodes){
                calls.push(this._getReasonCodeDetails(reasonCode));
            }
            if(calls.length>0){
                result = await Promise.all(calls);
            }
            
            return result;
        },

        _getReasonCodeDetails: async function(code){
            let sUrl = this._controller.getPublicApiRestDataSourceUri() + "resourceReasonCode/v1/resourceReasonCodes";
            var oParameters = { resource: this._parameters.resource,
                                plant: this._parameters.plant,
                                machineCode: code };
            return await new Promise((resolve,reject)=>{
                this._controller.ajaxGetRequest(sUrl, oParameters,
                     (responseData) => {
                        resolve({ code: code,
                                  description: responseData[0].description })
                    },
                    (oError, sHttpErrorMessage) => {
                        resolve({ code: code,
                                  description: "" })
                    }   
                );

            });
        },

        _getShiftDates: function(){
            let result = {startDate: UI5Date.getInstance(),
                          endDate: UI5Date.getInstance() };

            result.endDate.setDate(result.endDate.getDate() + 1);
            result.endDate.setHours(6,0,0);
            result.startDate.setHours(5,59,59);
            result.viewKey = 'A';
            result.totalSeconds = 86400;

            if(this._parameters.date){
                let startDate = UI5Date.getInstance(this._parameters.date);
                let endDate = UI5Date.getInstance(this._parameters.date);
                if(this._parameters.shiftNumber && this._parameters.shiftNumber === "1"){
                    result.viewKey = 'B';
                    result.totalSeconds = 28800;
                    startDate.setHours(6,0,0);
                    endDate.setHours(13,59,59);
                }else if(this._parameters.shiftNumber && this._parameters.shiftNumber === "2"){
                    result.viewKey = 'B';
                    result.totalSeconds = 28800;
                    startDate.setHours(14,0,0);
                    endDate.setHours(21,59,59);
                }
                else if(this._parameters.shiftNumber && this._parameters.shiftNumber === "3"){
                    result.viewKey = 'B';
                    result.totalSeconds = 28800;
                    startDate.setHours(22,0,0);
                    endDate.setDate(endDate.getDate() + 1);
                    endDate.setHours(5,59,59);
                }else{
                    result.viewKey = 'A';
                    startDate.setHours(6,0,0);
                    endDate.setDate(endDate.getDate() + 1);
                    endDate.setHours(5,59,59);
                }
                result.startDate = startDate;
                result.endDate = endDate;
            }
            return result;
        },
        _adjustDownTimeRecordToFilter: function(myRecord, startDateFilter, endDateFilter) {
            if (!myRecord || !myRecord.eventStartDateTime || !myRecord.eventEndDateTime || startDateFilter > endDateFilter) {
                myRecord.toSkip = true;
                return myRecord;
            } 
            if (!(startDateFilter instanceof Date) || !(endDateFilter instanceof Date)) {
                myRecord.toSkip = true;
                return myRecord;
            }

            const recordStart = new Date(myRecord.eventStartDateTime);
            const recordEnd = new Date(myRecord.eventEndDateTime);

            if (isNaN(recordStart.getTime()) || isNaN(recordEnd.getTime())) {
                myRecord.toSkip = true;
                return myRecord;
            }

            if (recordStart > recordEnd) {
                myRecord.toSkip = true;
                return myRecord;
            }


            if (recordEnd < startDateFilter || recordStart > endDateFilter) {
                myRecord.toSkip = true;
                return myRecord;
            }
            myRecord.toSkip = false;

            const adjustedStart = recordStart < startDateFilter ? new Date(startDateFilter) : recordStart;
            const adjustedEnd = recordEnd > endDateFilter ? new Date(endDateFilter) : recordEnd;

            const diffMs = adjustedEnd.getTime() - adjustedStart.getTime();
            myRecord.downTimeSeconds = Math.floor(diffMs / 1000);

            myRecord.eventStartDateTime = adjustedStart.toISOString().split(".")[0] + "Z";
            myRecord.eventEndDateTime = adjustedEnd.toISOString().split(".")[0] + "Z";
            myRecord.startDateTime = adjustedStart;
            myRecord.endDateTime = adjustedEnd;

            return myRecord;
        },
        _getCalendarItemColor: function(timeElement){
            let result = "#E53935";

            if(timeElement === "INDEPENDENT"){
                result = "#1E88E5";
            }
            else if(timeElement === "PRODUCTION"){
                result = "#43A047";
            }
            else if(timeElement === "CHANGEOVER"){
                result = "#8E24AA";
            }
            else if(timeElement === "ECONOMIC_DOWN"){
                result = "#FB8C00";
            }
            else if(timeElement === "REPAIRS"){
                result = "#00ACC1";
            }
            else if(timeElement === "TECHNICAL"){
                result = "#E53935";
            }
            else if(timeElement === "TECHNOLOGICAL"){
                result = "#FDD835";
            }
            else if(timeElement === "LOGISTICS"){
                result = "#212121";
            }
            return result;
        },
        _getCalendarItemType: function(timeElement){
            let result = "Type01";

            if(timeElement === "INDEPENDENT"){
                result = "Type18";
            }
            else if(timeElement === "PRODUCTION"){
                result = "Type01";
            }
            else if(timeElement === "CHANGEOVER"){
                result = "Type02";
            }
            else if(timeElement === "ECONOMIC_DOWN"){
                result = "Type10";
            }
            else if(timeElement === "REPAIRS"){
                result = "Type07";
            }
            else if(timeElement === "TECHNICAL"){
                result = "Type06";
            }
            else if(timeElement === "TECHNOLOGICAL"){
                result = "Type05";
            }
            else if(timeElement === "LOGISTICS"){
                result = "Type19";
            }
            return result;
        },



        
_buildProductionTables: function (productionData) {
    const sourceRows = this._ensureArray(productionData);

    return {
        dataUnAggregated: this._buildUnAggregatedTable(sourceRows),
        dataAggregated: this._buildAggregatedTable(sourceRows)
    };
},

_buildUnAggregatedTable: function (sourceRows) {
    const summaryMap = this._aggregateRows(sourceRows, {
        mode: "UNAGGREGATED_SUMMARY"
    });

    const shiftMap = this._aggregateRows(sourceRows, {
        mode: "UNAGGREGATED_SHIFT"
    });

    const rows = [
        ...this._finalizeAccumulatorMap(summaryMap),
        ...this._finalizeAccumulatorMap(shiftMap)
    ];

    return this._sortUnAggregatedRows(rows);
},

_buildAggregatedTable: function (sourceRows) {
    const summaryMap = this._aggregateRows(sourceRows, {
        mode: "AGGREGATED_SUMMARY"
    });

    const shiftMap = this._aggregateRows(sourceRows, {
        mode: "AGGREGATED_SHIFT"
    });

    const rows = [
        ...this._finalizeAccumulatorMap(summaryMap),
        ...this._finalizeAccumulatorMap(shiftMap)
    ];

    return this._sortAggregatedRows(rows);
},

_aggregateRows: function (sourceRows, options) {
    const resultMap = new Map();

    for (const row of sourceRows) {
        const key = this._buildAggregationKey(row, options);

        if (!resultMap.has(key)) {
            resultMap.set(key, this._createAccumulator(row, options));
        }

        this._addSourceRowToAccumulator(resultMap.get(key), row);
    }

    return resultMap;
},

_buildAggregationKey: function (row, options) {
    switch (options.mode) {
        case "UNAGGREGATED_SUMMARY":
            return this._buildKey([
                this._getOrderNumber(row),
                this._getItemNumber(row),
                this._getProductionDate(row),
                this._getOperation(row)
            ]);

        case "UNAGGREGATED_SHIFT":
            return this._buildKey([
                this._getOrderNumber(row),
                this._getItemNumber(row),
                this._getProductionDate(row),
                this._getOperation(row),
                this._getShift(row)
            ]);

        case "AGGREGATED_SUMMARY":
            return this._buildKey([
                this._getProductionDate(row)
            ]);

        case "AGGREGATED_SHIFT":
            return this._buildKey([
                this._getProductionDate(row),
                this._getShift(row)
            ]);

        default:
            return this._buildKey([]);
    }
},

_createAccumulator: function (row, options) {
    switch (options.mode) {
        case "UNAGGREGATED_SUMMARY":
            return {
                productionDate: this._getProductionDate(row),
                operation: this._getOperation(row),
                shift: "",
                orderNumber: this._getOrderNumber(row),
                itemNumber: this._getItemNumber(row),
                material: this._buildMaterialField(row),
                q1Units: new Map(),
                q23Groups: new Map(),
                quantityQ1BaseUom: 0,
                quantityQ23BaseUom: 0,
                quantityQ1M2: 0,
                quantityQ1M3: 0,
                quantityQ23M2: 0,
                quantityQ23M3: 0
            };

        case "UNAGGREGATED_SHIFT":
            return {
                productionDate: this._getProductionDate(row),
                operation: this._getOperation(row),
                shift: this._getShift(row),
                orderNumber: this._getOrderNumber(row),
                itemNumber: this._getItemNumber(row),
                material: this._buildMaterialField(row),
                q1Units: new Map(),
                q23Groups: new Map(),
                quantityQ1BaseUom: 0,
                quantityQ23BaseUom: 0,
                quantityQ1M2: 0,
                quantityQ1M3: 0,
                quantityQ23M2: 0,
                quantityQ23M3: 0
            };

        case "AGGREGATED_SUMMARY":
            return {
                productionDate: this._getProductionDate(row),
                operation: "",
                shift: "",
                orderNumber: "",
                itemNumber: "",
                material: "",
                q1Units: new Map(),
                q23Groups: new Map(),
                quantityQ1BaseUom: 0,
                quantityQ23BaseUom: 0,
                quantityQ1M2: 0,
                quantityQ1M3: 0,
                quantityQ23M2: 0,
                quantityQ23M3: 0
            };

        case "AGGREGATED_SHIFT":
            return {
                productionDate: this._getProductionDate(row),
                operation: "",
                shift: this._getShift(row),
                orderNumber: "",
                itemNumber: "",
                material: "",
                q1Units: new Map(),
                q23Groups: new Map(),
                quantityQ1BaseUom: 0,
                quantityQ23BaseUom: 0,
                quantityQ1M2: 0,
                quantityQ1M3: 0,
                quantityQ23M2: 0,
                quantityQ23M3: 0
            };

        default:
            return {
                productionDate: "",
                operation: "",
                shift: "",
                orderNumber: "",
                itemNumber: "",
                material: "",
                q1Units: new Map(),
                q23Groups: new Map(),
                quantityQ1BaseUom: 0,
                quantityQ23BaseUom: 0,
                quantityQ1M2: 0,
                quantityQ1M3: 0,
                quantityQ23M2: 0,
                quantityQ23M3: 0
            };
    }
},

_addSourceRowToAccumulator: function (accumulator, row) {
    const eventType = this._getEventType(row);
    const quantities = this._getQuantities(row);

    if (eventType === this.EVENT_TYPES.Q1) {
        this._addQ1Quantities(accumulator.q1Units, quantities);

        accumulator.quantityQ1BaseUom += this._getBaseUomQuantity(quantities);
        accumulator.quantityQ1M2 += this._getQuantityByUom(quantities, "M2");
        accumulator.quantityQ1M3 += this._getQuantityByUom(quantities, "M3");
        return;
    }

    if (this._isQ23Type(eventType)) {
        this._addQ23Entry(accumulator.q23Groups, row);
    }

    if (eventType === this.EVENT_TYPES.Q3) {
        accumulator.quantityQ23BaseUom += this._getBaseUomQuantity(quantities);
        accumulator.quantityQ23M2 += this._getQuantityByUom(quantities, "M2");
        accumulator.quantityQ23M3 += this._getQuantityByUom(quantities, "M3");
    }
},

_finalizeAccumulatorMap: function (accumulatorMap) {
    return Array.from(accumulatorMap.values()).map((accumulator) => {
        return this._finalizeAccumulator(accumulator);
    });
},

_finalizeAccumulator: function (accumulator) {
    let result = {
        productionDate: accumulator.productionDate,
        operation: accumulator.operation,
        shift: accumulator.shift,
        q1Quantity: this._formatQ1Quantity(accumulator.q1Units),
        q23Quantity: this._formatQ23Quantity(accumulator.q23Groups),
        material: accumulator.material,
        itemNumber: accumulator.itemNumber,
        orderNumber: accumulator.orderNumber,
        quantityQ1BaseUom: accumulator.quantityQ1BaseUom,
        quantityQ23BaseUom: accumulator.quantityQ23BaseUom,
        quantityQ1M2: parseFloat(accumulator.quantityQ1M2.toFixed(3)),
        quantityQ1M3: parseFloat(accumulator.quantityQ1M3.toFixed(3)),
        quantityQ23M2: accumulator.quantityQ23M2,
        quantityQ23M3: accumulator.quantityQ23M3,
        totalQuantityBaseUom: accumulator.quantityQ1BaseUom + accumulator.quantityQ23BaseUom,
        totalQuantityM2: parseFloat((accumulator.quantityQ1M2 + accumulator.quantityQ23M2).toFixed(2)),
        totalQuantityM3: parseFloat((accumulator.quantityQ1M3 + accumulator.quantityQ23M3).toFixed(3)),
        isQ1PercentageIndicatorVisible: false,
        isPlanIndicatorVisible: false,
        q1Percentage: 0,
        q1PercentagePlan: this._planQ1Percentage,
        planExecution: 0,
        planDay: this._dayPlanQuan,
        planShift: parseInt(this._dayPlanQuan/3),
        planForRow: 0,
        planUOM: this._planUom

    };
    
    if(result.orderNumber){
        result.isQ1PercentageIndicatorVisible = true;
    }else{
        result.isQ1PercentageIndicatorVisible = true;
        result.isPlanIndicatorVisible = true;
    }

    if(result.totalQuantityBaseUom>0){
        result.q1Percentage = parseFloat((result.quantityQ1BaseUom*100/result.totalQuantityBaseUom).toFixed(1));
    }

    if(!result.orderNumber){
        if(result.shift){
            result.planForRow = result.planShift;
        }else{
            result.planForRow = result.planDay;
        }
        if(result.planUOM==="M2"){
            result.planExecution = result.totalQuantityM2;
        }else if(result.planUOM==="M3"){
            result.planExecution = result.totalQuantityM3;
        }
        else{
            result.planExecution = result.totalQuantityBaseUom;
        }
    }

    return result;
},

_addQ1Quantities: function (unitMap, quantities) {
    this._addQuantitiesToUnitMap(unitMap, quantities);
},

_addQ23Entry: function (q23Groups, row) {
    const ncCodeDescription = this._getNcCodeDescription(row);
    const q2Destination = this._getQ2Destination(row);
    const groupKey = this._buildKey([ncCodeDescription, q2Destination]);

    if (!q23Groups.has(groupKey)) {
        q23Groups.set(groupKey, {
            ncCodeDescription: ncCodeDescription,
            q2Destination: q2Destination,
            units: new Map()
        });
    }

    this._addQuantitiesToUnitMap(
        q23Groups.get(groupKey).units,
        this._getQuantities(row)
    );
},

_addQuantitiesToUnitMap: function (unitMap, quantities) {
    for (const quantityRow of this._ensureArray(quantities)) {
        const uom = this._normalizeString(quantityRow.uom);
        const uomDesc = this._normalizeString(quantityRow.uomDesc || quantityRow.uom);
        const quantity = this._normalizeNumber(quantityRow.quantity);

        const unitKey = this._buildKey([uom, uomDesc]);

        if (!unitMap.has(unitKey)) {
            unitMap.set(unitKey, {
                uom: uom,
                uomDesc: uomDesc,
                quantity: 0
            });
        }

        unitMap.get(unitKey).quantity += quantity;
    }
},

_getBaseUomQuantity: function (quantities) {
    const normalizedQuantities = this._ensureArray(quantities);

    const stQuantity = this._getQuantityByUom(normalizedQuantities, "ST");
    if (stQuantity !== 0) {
        return stQuantity;
    }

    const hasSt = normalizedQuantities.some((quantityRow) => {
        return this._normalizeString(quantityRow.uom).toUpperCase() === "ST";
    });

    if (hasSt) {
        return 0;
    }

    return this._getQuantityByUom(normalizedQuantities, "KG");
},

_getQuantityByUom: function (quantities, expectedUom) {
    const normalizedExpectedUom = this._normalizeString(expectedUom).toUpperCase();

    return this._ensureArray(quantities)
        .filter((quantityRow) => {
            return this._normalizeString(quantityRow.uom).toUpperCase() === normalizedExpectedUom;
        })
        .reduce((sum, quantityRow) => {
            return sum + this._normalizeNumber(quantityRow.quantity);
        }, 0);
},

_formatQ1Quantity: function (unitMap) {
    if (!unitMap || unitMap.size === 0) {
        return "";
    }

    return Array.from(unitMap.values())
        .map((unit) => {
            return (this._formatNumber(unit.quantity, unit.uom) + " " + this._normalizeString(unit.uomDesc || unit.uom)).trim();
        })
        .join("\n");
},

_formatQ23Quantity: function (q23Groups) {
    if (!q23Groups || q23Groups.size === 0) {
        return "";
    }

    const totalUnits = this._buildQ23TotalUnits(q23Groups);

    const totalLine = Array.from(totalUnits.values())
        .map((unit) => {
            return (this._formatNumber(unit.quantity, unit.uom) + " " + this._normalizeString(unit.uomDesc || unit.uom)).trim();
        })
        .join("/");

    const detailLines = Array.from(q23Groups.values())
        .sort((a, b) => {
            return this._compareQ23Groups(a, b);
        })
        .map((group) => {
            return this._formatQ23Group(group);
        });

    return ["<h5><strong>" + totalLine + "</strong></h5>", ...detailLines].join("");
},

_compareQ23Groups: function (a, b) {
    const priorityA = this._getQ2DestinationSortPriority(a.q2Destination);
    const priorityB = this._getQ2DestinationSortPriority(b.q2Destination);

    return (
        priorityA - priorityB ||
        this._compareStrings(a.q2Destination, b.q2Destination) ||
        this._compareStrings(a.ncCodeDescription, b.ncCodeDescription)
    );
},

_getQ2DestinationSortPriority: function (q2Destination) {
    const destination = this._normalizeString(q2Destination).trim().toUpperCase();

    if (!destination) {
        return 1;
    }

    if (destination === "RETURN") {
        return 2;
    }

    if (destination === "PACKAGING") {
        return 3;
    }

    return 4;
},



_buildQ23TotalUnits: function (q23Groups) {
    const totalUnits = new Map();

    for (const group of q23Groups.values()) {
        for (const unit of group.units.values()) {
            const unitKey = this._buildKey([unit.uom, unit.uomDesc]);

            if (!totalUnits.has(unitKey)) {
                totalUnits.set(unitKey, {
                    uom: unit.uom,
                    uomDesc: unit.uomDesc,
                    quantity: 0
                });
            }

            totalUnits.get(unitKey).quantity += this._normalizeNumber(unit.quantity);
        }
    }

    return totalUnits;
},

_formatQ23Group: function (group) {
    const quantitiesPart = Array.from(group.units.values())
        .map((unit) => {
            return (this._formatNumber(unit.quantity, unit.uom) + " " + this._normalizeString(unit.uomDesc || unit.uom)).trim();
        })
        .join("/");

    if (group.q2Destination) {
        return "<p>" +  quantitiesPart + " - " + group.ncCodeDescription + " - " + group.q2Destination + "</p>";
    }

    return "<p>" +  quantitiesPart + " - " + group.ncCodeDescription + "</p>";
},

_sortUnAggregatedRows: function (rows) {
    return [...rows].sort((a, b) => {
        return (
            this._compareStrings(a.productionDate, b.productionDate) ||
            this._compareSummaryFirst(a.shift, b.shift) ||
            this._compareStrings(a.orderNumber, b.orderNumber) ||
            this._compareStrings(a.itemNumber, b.itemNumber) ||
            this._compareStrings(a.operation, b.operation) ||
            this._compareStrings(a.shift, b.shift)
        );
    });
},

_sortAggregatedRows: function (rows) {
    return [...rows].sort((a, b) => {
        return (
            this._compareStrings(a.productionDate, b.productionDate) ||
            this._compareSummaryFirst(a.shift, b.shift) ||
            this._compareStrings(a.shift, b.shift)
        );
    });
},

_compareSummaryFirst: function (shiftA, shiftB) {
    const aIsSummary = !this._normalizeString(shiftA);
    const bIsSummary = !this._normalizeString(shiftB);

    if (aIsSummary && !bIsSummary) {
        return -1;
    }

    if (!aIsSummary && bIsSummary) {
        return 1;
    }

    return 0;
},

_getEventType: function (row) {
    return this._normalizeString(row["Q1/Q3"]);
},

_isQ23Type: function (eventType) {
    return (
        eventType === this.EVENT_TYPES.Q2 ||
        eventType === this.EVENT_TYPES.Q3 ||
        eventType === this.EVENT_TYPES.Q23
    );
},

_getQuantities: function (row) {
    return this._ensureArray(row.QUANTITIES);
},

_getItemNumber: function (row) {
    return this._normalizeString(row.ITEM_NO);
},

_getOrderNumber: function (row) {
    return this._normalizeString(row.orderNumber);
},

_getProductionDate: function (row) {
    return this._normalizeString(row.formattedDate);
},

_getOperation: function (row) {
    return this._normalizeString(row.OPERATION);
},

_getShift: function (row) {
    return this._normalizeString(row.shift);
},

_getNcCodeDescription: function (row) {
    return this._normalizeString(row.NC_CODE_DESCRIPTION);
},

_getQ2Destination: function (row) {
    return this._normalizeString(row.Q2_DESTINATION);
},

_buildMaterialField: function (row) {
    const material = this._normalizeString(row.MATERIAL);
    const description = this._normalizeString(row.materialDescription);

    if (description) {
        return material + "\n" + description;
    }

    return material;
},

_ensureArray: function (value) {
    return Array.isArray(value) ? value : [];
},

_normalizeString: function (value) {
    return value == null ? "" : String(value);
},

_normalizeNumber: function (value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
},

_formatNumber: function (value, uom) {
    if (Number.isInteger(value)) {
        return String(value);
    }

    if (!isNaN(value)) {
        if(uom==="M3"){
            return value.toFixed(3);
        }
        return value.toFixed(2);
    }

    return String(value).replace(/\.0+$/, "");
},

_compareStrings: function (a, b) {
    return this._normalizeString(a).localeCompare(this._normalizeString(b));
},

_buildKey: function (parts) {
    return JSON.stringify(parts.map((part) => this._normalizeString(part)));
},
_getShiftComments: async function () {
    const aResult = [];

    if (!this._parameters.date) {
        return aResult;
    }

    const sShiftNumber = String(this._parameters.shiftNumber || "");
    const aValidShifts = ["1", "2", "3"];

    const aShiftsToLoad = aValidShifts.includes(sShiftNumber)
        ? [sShiftNumber]
        : aValidShifts;

    for (const sShift of aShiftsToLoad) {
        const oDateRange = GeneralTools.getShiftRangeFromDate(
            sShift,
            this._parameters.date
        );

        const oShiftComment = await ShiftCommentFactory.getInstance(
            this._controller,
            {
                workCenter: this._parameters.workCenter,
                plant: this._parameters.plant,
                dummyOrder: "",
                dummySfc: "",
                startDate: oDateRange.startDate,
                endDate: oDateRange.endDate,
                commentDate: this._parameters.date,
                shift: sShift
            }
        );

        const sComment = oShiftComment.getComment();

        aResult.push({
            shift: sShift,
            comment: sComment || ""
        });
    }
    return aResult;
}

    });
});