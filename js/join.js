//wrap everything is immediately invoked anonymous function so nothing is in clobal scope
(function (){

	//pseudo-global variables
	var attrArray = ["Strawberries", "Raspberries", "Blackberries", "Blueberries", "Elderberries"]; //list of attributes
	var expressed = attrArray[0]; //initial attribute


	//begin script when window loads
	window.onload = setMap();

	//Example 1.3 line 4...set up choropleth map
	function setMap(){

	    //map frame dimensions
    	var width = window.innerWidth * 0.5,
        height = 460;

	    //create new svg container for the map
	    var map = d3.select("body")
	        .append("svg")
	        .attr("class", "map")
	        .attr("width", width)
	        .attr("height", height);

    //create Albers equal area conic projection centered on United States
    var projection = d3
        .geoAlbers()
        .parallels([29.5, 45.5])
        .scale(1070)
        .translate([480, 250])
        .rotate([96, 0])
        .center([-0.6, 38.7])

    var path = d3.geoPath().projection(projection);

	    //use Promise.all to parallelize asynchronous data loading
	    var promises = [d3.csv("data/stateberries.csv"),
	                    d3.json("data/northamerica.topojson"),
	                    d3.json("data/states.topojson")
	                   ];
	    Promise.all(promises).then(callback);

	    function callback(data){
			var csvData = data[0], northamerica = data[1], states = data[2];

	        setGraticule(map,path);

	        //translate europe TopoJSON
            var americanCountries = topojson.feature(northamerica, northamerica.objects.northamerica),
            unitedStates = topojson.feature(states, states.objects.states).features;

	        //add Europe countries to map
	        var countries = map.append("path")
	            .datum(americanCountries)
	            .attr("class", "countries")
	            .attr("d", path);

	        unitedStates = joinData(unitedStates, csvData);

	        var colorScale = makeColorScale(csvData);

	        setEnumerationUnits(unitedStates,map,path,colorScale);

	        //add coordinated visualization to the map
        	setChart(csvData, colorScale);

	    };

	};


	function setGraticule(map,path){
		var graticule = d3.geoGraticule()
	            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

	        //create graticule background
	        var gratBackground = map.append("path")
	            .datum(graticule.outline()) //bind graticule background
	            .attr("class", "gratBackground") //assign class for styling
	            .attr("d", path) //project graticule

	        //create graticule lines
	        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
	            .data(graticule.lines()) //bind graticule lines to each element to be created
	            .enter() //create an element for each datum
	            .append("path") //append each element to the svg as a path element
	            .attr("class", "gratLines") //assign class for styling
	            .attr("d", path); //project graticule lines
	}

	function joinData(unitedStates,csvData){
		//loop through csv to assign each set of csv attribute values to geojson region
	        for (var i=0; i<csvData.length; i++){
	            var csvState = csvData[i]; //the current region
	            var csvKey = csvState.name; //the CSV primary key

	            //loop through geojson regions to find correct region
	            for (var a=0; a<unitedStates.length; a++){

	                var geojsonProps = unitedStates[a].properties; //the current region geojson properties
	                var geojsonKey = geojsonProps.name; //the geojson primary key

	                //where primary keys match, transfer csv data to geojson properties object
	                if (geojsonKey == csvKey){

	                    //assign all attributes and values
	                    attrArray.forEach(function(attr){
	                        var val = parseFloat(csvState[attr]); //get csv attribute value
	                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
	                    });
	                };
	            };
	        };
	        return unitedStates;
	}

	function makeColorScale(data){
		var colorClasses = [

			"#d2f5ff",
			"#b3cde3",
			"#8c96c6",
			"#8856a7",
			"#810f7c"

	    ];

	    //create color scale generator
	    var colorScale = d3.scaleQuantile()
	        .range(colorClasses);

	    //build array of all values of the expressed attribute
	    var domainArray = [];
	    for (var i=0; i<data.length; i++){
	        var val = parseFloat(data[i][expressed]);
	        domainArray.push(val);
	    };

	    //assign array of expressed values as scale domain
	    colorScale.domain(domainArray);

	    return colorScale;
	}

function setEnumerationUnits(unitedStates,map,path,colorScale){
	//add France regions to map
    var states = map.selectAll(".states")
        .data(unitedStates)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "states " + d.properties.name;
        })
        .attr("d", path)
        .style("fill", function(d){
            var value = d.properties[expressed];
            if(value) {
            	return colorScale(d.properties[expressed]);
            } else {
            	return "#ccc";
            }
    });
}

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 900]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.name;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Acres " + expressed[3] + " in each state");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};

})();