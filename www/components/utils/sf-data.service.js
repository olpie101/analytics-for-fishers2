(function() {
    'use strict';

    angular.module('utilsModule')
        .factory('sfdata', function(force, userservice){
            const TIME_INTERVALS = ["Yearly", "Monthly", "Weekly"];
            const QUANTITY_AGGREGATION_TYPES = ["Items", "Weight", "Crates"];
            const BASE_FISHER_LIST = [{
                lkup_main_fisher_id__c:"All",
                lkup_main_fisher_id__r: {
                    Name: "All"
                }
            }];
            var fisherList = null;

            const intervalQuerySelectSection = function (interval, parentPrefix = "") {
                switch (interval) {
                    case 'yearly':
                        return 'CALENDAR_YEAR('+parentPrefix+'trip_date__c) year ';
                        break;
                    case 'monthly':
                        return 'CALENDAR_YEAR('+parentPrefix+'trip_date__c) year, '+
                        'CALENDAR_MONTH('+parentPrefix+'trip_date__c) month ';
                        break;
                    case 'weekly':
                        return 'CALENDAR_YEAR('+parentPrefix+'trip_date__c) year, '+
                        'CALENDAR_MONTH('+parentPrefix+'trip_date__c) month, '+
                        'WEEK_IN_YEAR('+parentPrefix+'trip_date__c) week ';
                        break;
                    default: return;
                }
            }

            const intervalQueryGroupBySection = function(interval, parentPrefix = "") {
                switch (interval) {
                    case 'yearly':
                        return 'GROUP BY CALENDAR_YEAR('+parentPrefix+'trip_date__c) ';
                        break;
                    case 'monthly':
                        return 'GROUP BY CALENDAR_YEAR('+parentPrefix+'trip_date__c), '+
                            'CALENDAR_MONTH('+parentPrefix+'trip_date__c) ';
                        break;
                    case 'weekly':
                        return 'GROUP BY CALENDAR_YEAR('+parentPrefix+'trip_date__c), '+
                            'CALENDAR_MONTH('+parentPrefix+'trip_date__c), '+
                            'WEEK_IN_YEAR('+parentPrefix+'trip_date__c) ';
                        break;
                    default: return "";
                }
            }

            const intervalQueryOrderBySection = function(interval, parentPrefix = "") {
                switch (interval) {
                    case 'yearly':
                        return 'ORDER BY CALENDAR_YEAR('+parentPrefix+'trip_date__c) ';
                        break;
                    case 'monthly':
                        return 'ORDER BY CALENDAR_YEAR('+parentPrefix+'trip_date__c), '+
                            'CALENDAR_MONTH('+parentPrefix+'trip_date__c) ';
                        break;
                    case 'weekly':
                        return 'ORDER BY CALENDAR_YEAR('+parentPrefix+'trip_date__c), '+
                            'CALENDAR_MONTH('+parentPrefix+'trip_date__c), '+
                            'WEEK_IN_YEAR('+parentPrefix+'trip_date__c) ';
                        break;
                    default: return "";
                }
            }

            const queryCatchByTimePeriod = function(interval, forFisher){
                interval = interval.toLowerCase();
                var query = 'SELECT '

                query += intervalQuerySelectSection(interval, "parent_trip__r.");

                query += ', lkup_species__r.name_eng__c species, '+
                        'SUM(num_items__c) items, '+
                        'SUM(weight_kg__c) weight, '+
                        'SUM(num_crates__c) crates '+
                        'FROM Ablb_Fisher_Catch__c ';

                if(userservice.userType() == "fisher_manager" &&
                    forFisher && forFisher != null && forFisher != "All"){
                    query += "WHERE parent_trip__r.lkup_main_fisher_id__c = '"+forFisher+"' ";
                }

                query += intervalQueryGroupBySection(interval, "parent_trip__r.");

                query += ', lkup_species__r.name_eng__c';

                console.log("Interval Query:\n"+query);

                var queryTrans = force.query(query).then(result => Rx.Observable
                    .from(result.records)
                );

                return Promise.all([queryTrans, queryFisherListPastYear()]);
            }

            const lastNTripDates = function (nummberOfDays) {
                var query = 'SELECT id FROM Ablb_Fisher_Trip__c ORDER BY trip_date__c DESC LIMIT '+nummberOfDays;
                return force.query(query);
            }

            const lastNTripCatches = function(nummberOfDays){
                return lastNTripDates(nummberOfDays)
                    .then(handleDateResponses);

                 function handleDateResponses(result){
                     var queryList = result.records.map(record => "'"+record.Id+"'").join(',');
                     var query = "SELECT parent_trip__r.trip_date__c date, "+
                     "parent_trip__r.lkup_landing_site__r.name_eng__c site, "+ //site doesn't alias but is needed to remove abiguity
                     "lkup_species__r.name_eng__c species, SUM(num_items__c) items, "+
                     "SUM(weight_kg__c) weight, SUM(num_crates__c) crates "+
                     "FROM Ablb_Fisher_Catch__c "+
                     "WHERE parent_trip__c IN ("+queryList+") "+
                     "GROUP BY parent_trip__r.trip_date__c, "+
                     "parent_trip__r.lkup_landing_site__r.name_eng__c, lkup_species__r.name_eng__c "+
                     "ORDER BY parent_trip__r.trip_date__c DESC NULLS LAST";

                     return force.query(query);
                 }
            }

            const queryTripExpenses = function(interval, forFisher){
                interval = interval.toLowerCase();
                var timeThreshold;
                switch(interval){
                    case 'monthly':
                        timeThreshold = "LAST_YEAR";
                    case 'weekly':
                        timeThreshold = 'LAST_N_MONTHS:3';
                    default:
                        timeThreshold = "LAST_YEAR";
                }

                var query = 'SELECT '

                query += intervalQuerySelectSection(interval);

                query += ", SUM(cost_bait__c) cost_bait, SUM(cost_food__c) cost_food, "+
                        "SUM(cost_fuel__c) cost_fuel, SUM(cost_harbour_fee__c) "+
                        "cost_harbour_fee, SUM(cost_oil__c) cost_oil, "+
                        "SUM(cost_other_amount__c) cost_other, "+
                        "SUM(cost_transport__c) cost_transport, SUM(displayed_profit__c) displayed_profit "+
                        "FROM Ablb_Fisher_Trip__c "+
                        "WHERE cost_has__c ='yes' AND trip_date__c > "+timeThreshold+" ";

                if(userservice.userType() == "fisher_manager" &&
                    forFisher && forFisher != null && forFisher != "All"){
                    query += "AND lkup_main_fisher_id__c = '"+forFisher+"' ";
                }

                query += intervalQueryGroupBySection(interval)+
                        intervalQueryOrderBySection(interval)+"DESC";
                console.log("expenses query \n "+query);
                return force.query(query).then(result => {
                    return Rx.Observable.from(result.records);
                });
            }

            const queryTripIncome = function (interval, forFisher) {
                interval = interval.toLowerCase();
                var timeThreshold;
                switch(interval){
                    case 'monthly':
                        timeThreshold = "LAST_YEAR";
                    case 'weekly':
                        timeThreshold = 'LAST_N_MONTHS:3';
                    default:
                        timeThreshold = "LAST_YEAR";
                }

                var query = "SELECT parent_trip__r.trip_date__c , "+
                        "lkup_species__r.name_eng__c, alloc_sold_crates__c, "+
                        "alloc_sold_number__c, alloc_sold_weight_kg__c, "+
                        "num_crates__c, num_items__c, weight_kg__c, "+
                        "other_price_for_total_batch__c, other_price_per_crate__c, "+
                        "other_price_per_item__c, other_price_per_kg__c "+
                        "FROM Ablb_Fisher_Catch__c WHERE parent_trip__r.trip_date__c > LAST_YEAR ";

                if(userservice.userType() == "fisher_manager" &&
                    forFisher && forFisher != null && forFisher != "All"){
                    query += "AND parent_trip__r.lkup_main_fisher_id__c = '"+forFisher+"' ";
                }

                query += "ORDER BY parent_trip__r.trip_date__c DESC"
                return force.query(query)
                        .then(result => processIncome(interval, result.records));
            }

            const queryCatchDays = function (){
                return queryFishingCatchDays();
            }

            const queryFishingCatchDays = function() {
                var interval = "monthly";
                var query = "SELECT ";
                query += intervalQuerySelectSection(interval);
                query += ", COUNT (catch_has__c) fishing_days FROM Ablb_Fisher_Trip__c "+
                            "WHERE catch_has__c = 'yes' AND trip_date__c > LAST_YEAR ";

                query += intervalQueryGroupBySection(interval);
                query += intervalQueryOrderBySection(interval)+" DESC";
                return force.query(query).then(result => Rx.Observable.from(result.records)
                            .doOnNext(rec => {rec['non_fishing_days'] = daysInMonth(rec.month, rec.year)-rec.fishing_days})
                            .toArray()
                        );
            }

            const queryNoCatchReasons = function() {
                var interval = "monthly";
                var query = "SELECT ";
                query += intervalQuerySelectSection(interval);
                query += " COUNT (catch_has__c) FROM Ablb_Fisher_Trip__c "+
                            "WHERE catch_has__c = '' ";

                query += intervalQueryGroupBySection(interval);
                query += intervalQueryOrderBySection(interval)+" DESC";
                return force.query(query).then(result => Observable.just(result.records));
            }

            const queryFisherListPastYear = function () {
                var query = "SELECT lkup_main_fisher_id__c, "+
                "lkup_main_fisher_id__r.Name "+
                "FROM Ablb_Fisher_Trip__c "+
                "WHERE trip_date__c > LAST_YEAR "+
                "AND lkup_main_fisher_id__c != ''";
                if(userservice.userType() == "fisher_manager") {
                    if(fisherList == null){
                        return Promise.resolve(force.query(query).then(result => {
                            fisherList = result.records;
                            return distinctFisherList();
                        }));
                    }else{
                        return Promise.resolve(distinctFisherList());
                    }
                }else {
                    return Promise.resolve([]); //User is not manager return empty list
                }

                function distinctFisherList(){
                    return Rx.Observable
                            .from(fisherList)
                            .distinct(rec => rec.lkup_main_fisher_id__c)
                }
            }

            const processIncome = function (interval, records) {
                return Rx.Observable.from(records)
                    .doOnNext(record => record.month = parseInt(record
                                            .parent_trip__r
                                            .trip_date__c.split('-')[1]))
                    .doOnNext(record => record.year = parseInt(record
                                            .parent_trip__r
                                            .trip_date__c.split('-')[0]))
                    .groupBy(record => groupByInterval(interval, record))
                    .flatMap(calculateMonthlyIncome);
            }

            const calculateMonthlyIncome = function (monthObs) {
                var record = new Object();
                record['key'] = monthObs.key;
                record['summaries'] = [];
                record['total'] = 0.0;
                return monthObs.groupBy(rec => ((rec.lkup_species__r || "Unknown").name_eng__c || "Unknown")) //Handle missing october entry for david
                            .flatMap(speciesObs => calculateIndividualSpeciesTotals(speciesObs, monthObs.key))
                            .reduce(calculateMonth, record);
            }

            const calculateIndividualSpeciesTotals = function(speciesObs, monthKey) {
                // console.log("species calc => "+speciesObs.key);
                var records = new Object();
                records['key'] = speciesObs.key;
                records['batch'] = 0;
                records['crates'] = 0;
                records['items'] = 0;
                records['weight'] = 0;
                records['total'] = 0;
                return speciesObs.reduce(aggSpecies, records);
            }

            const calculateMonth = function (acc, entry) {
                //Only add if entry contains actual information
                if(entry.batch+entry.crates+entry.items+entry.weight > 0){
                    acc.summaries.push(entry);
                }
                acc.total += entry.total;
                return acc;
            }

            const aggSpecies = function (acc, entry) {
                var batch = (entry.other_price_for_total_batch__c || 0);
                var crateCount = (entry.alloc_sold_crates__c || 0);
                var crateValue = crateCount * (entry.other_price_per_crate__c|| 0);
                var itemCount = (entry.alloc_sold_number__c || 0);
                var itemValue = itemCount * (entry.other_price_per_item__c);
                var weightCount = (entry.alloc_sold_weight_kg__c || 0);
                var weightValue = weightCount * (entry.other_price_per_kg__c);

                if(batch > 0){
                    acc.batch += 1;
                }
                acc.crates += crateCount;
                acc.items += itemCount;
                acc.weight += weightCount;

                acc.total += crateValue+itemValue+weightValue+batch;
                return acc;
            }

            const queryExpensesIncomeByTimePeriod = function (interval, forFisher) {
                interval = interval.toLowerCase();
                return Promise.all([queryTripExpenses(interval, forFisher),
                    queryTripIncome(interval, forFisher),
                    queryFisherListPastYear()]);
            }

            const groupByInterval = function (method, record) {
                switch (method.toLowerCase()) {
                    case "yearly":
                        return record.year;
                    case "monthly":
                        return record.year+"-"+record.month;
                    case "weekly":
                        return record.year+"-w"+record.week;
                    default: break;

                }
            }

            const daysInMonth = function (month, year) {
                return new Date(year, month, 0).getDate();
            }

            return {
                TIME_INTERVALS: TIME_INTERVALS,
                QUANTITY_AGGREGATION_TYPES: QUANTITY_AGGREGATION_TYPES,
                BASE_FISHER_LIST: BASE_FISHER_LIST,
                queryCatchByTimePeriod: queryCatchByTimePeriod,
                queryExpensesIncomeByTimePeriod: queryExpensesIncomeByTimePeriod,
                lastNTripCatches: lastNTripCatches,
                groupByInterval: groupByInterval,
                queryCatchDays: queryCatchDays,
                queryFisherListPastYear: queryFisherListPastYear,
            };
        });
})();
