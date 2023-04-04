//begin script when window loads
window.onload = setMap();

//Example 1.3 line 4...set up choropleth map
function setMap() {
    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3
        .select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3
        .conicEqualArea()
        .parallels([29.5, 45.5])
        .scale(1070)
        .translate([480, 250])
        .rotate([96, 0])
        .center([-0.6, 38.7])
        .translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [
        d3.csv("data/statesberries.csv"),
        d3.json("data/northamerica.topojson"),
        d3.json("data/states.topojson"),
    ];
    Promise.all(promises).then(callback);

    function callback(data) {
        var csvData = data[0],
            northamerica = data[1],
            states = data[2];

    //translate europe TopoJSON
    var americanCountries = topojson.feature(northamerica, northamerica.objects.northamerica),
        unitedStates = topojson.feature(states, states.objects.states).feautures;

        var graticule = d3.geoGraticule().step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

        //create graticule background
        var gratBackground = map
            .append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path); //project graticule

        //create graticule lines
        var gratLines = map
            .selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines

        //add Europe countries to map
        var countries = map
            .append("path")
            .datum(americanCountries)
            .attr("class", "countries")
            .attr("d", path);

        //add France regions to map
        var regions = map
            .selectAll(".regions")
            .data(unitedStates)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "regions " + d.properties.name;
            })
            .attr("d", path);
    }
}