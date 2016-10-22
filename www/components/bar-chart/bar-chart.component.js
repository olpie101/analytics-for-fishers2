(function() {
    'use strict';

    var bcController = function BarChartController($element){
        var ctrl = this;
        ctrl.$onInit = function() {

            var data = new Map();
            var ytitle = "";
            var xtitle = "";

            Object.defineProperty(ctrl, 'data', {
                get: function(){
                    return data;
                },

                set: function(newVal){
                    data = newVal;
                    display();
                }
            })

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
            display();
        }

        function display() {
            var margin = {top: 20, right: 20, bottom: 100, left: 60},
                width = 600,
                height = 450;

            var xAxisTitleYPosition = height+70;

            var x = d3.scaleBand()
                        .range([0, width])
                        .round(true)
                        .padding(0.1);

            var y = d3.scaleLinear().range([height, 0]);


            var xValues = {};
            var yValues = {};
            Rx.Observable.from(ctrl.data.entries())
                .map(e => e[0])
                .toArray()
                .subscribe(k => xValues = k);

            Rx.Observable.from(ctrl.data.entries())
                .map(e => e[1])
                .toArray()
                .subscribe(k => yValues = k);

            var data = d3.zip(xValues, yValues);

            var xAxis = d3.axisBottom()
                .scale(x)
                .tickValues(xValues);

            var yAxis = d3.axisLeft()
                .scale(y)
                .ticks(10);

            x.domain(xValues);
            y.domain([0, d3.max(yValues)]);

            //Get the graph container
            var container = $element.find("div")[1];

            d3.select(container).selectAll("*").remove();
            var svg = d3.select(container).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                      "translate(" + margin.left + "," + margin.top + ")");
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "middle")
                .attr("transform", "translate(-15, 22) rotate(-65)");

            svg.append("g")
                .attr("class", "y-axis")
                .call(yAxis);

            svg.append("text")
                .attr("y", 0+xAxisTitleYPosition)
                .attr("x", width/2)
                .style("text-anchor", "middle")
                .text(ctrl.xtitle);

            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0-margin.left/1.8)
                .attr("x", 0-(height/2))
                .style("text-anchor", "middle")
                .text(ctrl.ytitle);

            svg.selectAll("bar")
                .data(data)
                .enter().append("rect")
                .style("fill", "steelblue")
                .attr("x", function(d) { return x(d[0]); })
                .attr("width", x.bandwidth)
                .attr("y", function(d) { return y(d[1]); })
                .attr("height", function(d) { return height - y(d[1]); });
        }
    }


    angular.module('barChartModule')
        .component('barChart', {
            templateUrl: 'js/bar-chart/bar-chart.template.html',
            controller: bcController,
            bindings: {
                data: '=?',
                xtitle: '=',
                ytitle: '='
            }
        });
})();
