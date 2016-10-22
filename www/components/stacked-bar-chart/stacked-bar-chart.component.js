(function() {
    'use strict';

    var sbcController = function StackedBarChartController($element, StringUtil){
        var ctrl = this;
        var legendSquareSize = 18;
        var DEFAULT_LEGEND_ITEMS_PER_ROW = 2;

        ctrl.$onInit = function() {
            var data = [];
            var ytitle = "";
            var xtitle = "";
            var itemsperrow = DEFAULT_LEGEND_ITEMS_PER_ROW;

            Object.defineProperty(ctrl, 'data', {
                get: function(){
                    return data;
                },
                set: function(newVal){
                    console.log("stacked bar graph new data");
                    data = newVal;
                    display();
                }
            });

            Object.defineProperty(ctrl, 'ytitle', {
                get: function(){
                    return ytitle;
                },
                set: function(newVal){
                    ytitle = newVal;
                    display();
                }
            });

            Object.defineProperty(ctrl, 'xtitle', {
                get: function(){
                    return xtitle;
                },
                set: function(newVal){
                    xtitle = newVal;
                    display();
                }
            });

            Object.defineProperty(ctrl, 'itemsperrow', {
                get: function(){
                    return itemsperrow;
                },
                set: function(newVal){
                    console.log("setting IPR");
                    itemsperrow = newVal;
                    display();
                }
            });

            display();
        }

        function getLegendSquareX(position, arr, itemsPerRow) {
            return (position > 0)? d3.sum(arr.slice(0, position%itemsPerRow).map(label => label.length))*20   : 0;
        }

        function getLegendSquareY(position, offset, itemsPerRow) {
            return offset+((2*legendSquareSize*Math.floor(position/itemsPerRow)));
        }

        function legendRowsNeeded(length, itemsPerRow) {
            return (length < itemsPerRow)? 2 : Math.ceil(length/itemsPerRow)+1;
        }

        function makeXAxis(scale, length){
            return d3.axisBottom()
                .scale(scale)
                .ticks(length);
        }

        function makeYAxis(scale, length){
            return d3.axisLeft()
                .scale(scale)
                .ticks(length);
        }

        function display() {
            var xValues = ctrl.data.map(record => record.key);
            var yValues = ctrl.data.map(record => d3.values(record).slice(1));

            // get all possible z values from all entries
            // for hetrogenous categories
            var zValues = ctrl.data.reduce((set, item) => {
                d3.keys(item).slice(1)
                    .forEach(property => set.add(property));
                return set;
            }, d3.set());

            zValues = zValues.values();

            var legendBuffer = legendRowsNeeded(zValues.length, ctrl.itemsperrow)*50;
            var margin = {top: 20, right: 20, bottom: legendBuffer, left: 80};
            var width = ctrl.width;
            var height = ctrl.height;
            console.log("SBchart width = "+width);
            console.log("SBchart height = "+height);

            var xAxisTitleYPosition = height+70;
            var legendYPostionStart = xAxisTitleYPosition+30;
            var legendYPostionOffset = 0;

            if(typeof ctrl.itemsperrow !== 'number'){
                ctrl.itemsperrow = DEFAULT_LEGEND_ITEMS_PER_ROW;
            }

            var x = d3.scaleBand()
                        .range([0, width])
                        .padding(0.1)
                        .align(0.1);

            var y = d3.scaleLinear()
                        .rangeRound([height, 0]);

            var z = null;
            if(zValues.length < 10 ){
                z = d3.scaleOrdinal(d3.schemeCategory10);
            } else {
                z = d3.scaleOrdinal(d3.schemeCategory20);
            }

            var stack = d3.stack();

            x.domain(xValues);
            y.domain([0, d3.max(yValues, function(d) { return d3.sum(d); })]).nice();
            z.domain(zValues);


            var xAxis = d3.axisBottom()
                .scale(x)
                .tickValues(xValues);

            var yAxis = d3.axisLeft()
                .scale(y)
                .ticks(10, ",f");

            var container = $element.find("div")[1];

            d3.select(container).selectAll("*").remove();
            var svg = d3.select(container).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom+50)
                .append("g")
                .attr("transform",
                      "translate(" + margin.left + "," + margin.top + ")");

            svg.append("g")
                .attr("class", "grid")
                .attr("transform", "translate(0,"+height+")")
                .call(makeXAxis(x).tickSize(-height, 0, 0).tickFormat(""))
                .selectAll("line")
                .style("stroke", "#aaa");

            svg.append("g")
                .attr("class", "grid")
                .call(makeYAxis(y).tickSize(-width, 0, 0).tickFormat(""))
                .selectAll("line")
                .style("stroke", "#aaa");

            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "middle")
                .attr("transform", "translate(-15, 22) rotate(-65)")


            svg.append("g")
                .attr("class", "y-axis")
                .call(yAxis);

            svg.append("text")
                .attr("y", xAxisTitleYPosition)
                .attr("x", width/2)
                .style("text-anchor", "middle")
                .text(ctrl.xtitle);

            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0-margin.left/1.8)
                .attr("x", 0-(height/2))
                .style("text-anchor", "middle")
                .text(ctrl.ytitle);

            svg.selectAll(".serie")
                .data(stack.keys(zValues)(ctrl.data))
                .enter().append("g")
                .attr("class", "serie")
                .attr("fill", d => z(d.key))
                .selectAll("rect")
                .data(d => d)
                .enter().append("rect")
                .attr("x", d => x(d.data.key))
                .attr("y", d => (isNaN(y(d[1])))? 0:y(d[1]))    //if value doesn't exist in y domain return 0
                .attr("height", d => (isNaN(y(d[0]) - y(d[1])))? 0: y(d[0]) - y(d[1]))
                .attr("width", x.bandwidth());

            var legend = svg.selectAll(".legend")
                .data(zValues)
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(0," + legendYPostionStart + ")"; })
                .style("font", "12pt sans-serif");

            legend.append("rect")
              .attr("x", (d,i) => getLegendSquareX(i, zValues, ctrl.itemsperrow))
              .attr("y", (d,i) => getLegendSquareY(i, legendYPostionOffset, ctrl.itemsperrow))
              .attr("width", legendSquareSize)
              .attr("height", legendSquareSize)
              .attr("fill", z);


            legend.append("text")
              .attr("x", (d,i) => getLegendSquareX(i, zValues, ctrl.itemsperrow)+24)
              .attr("y", (d,i) => getLegendSquareY(i, legendYPostionOffset, ctrl.itemsperrow))
              .attr("dy", "1em")
              .attr("text-anchor", "start")
              .text(StringUtil.cleanAndCapitalise);
        }
    }


    angular.module('stackedBarChartModule')
        .component('stackedBarChart', {
            templateUrl: 'components/stacked-bar-chart/stacked-bar-chart.template.html',
            controller: sbcController,
            bindings: {
                data: '=?',
                xtitle: '=',
                ytitle: '=',
                itemsperrow: '=?',
                height: '=',
                width: '='
            }
        });
    sbcController.$inject = ["$element", "StringUtil"];
})();
