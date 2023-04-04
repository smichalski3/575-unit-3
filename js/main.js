//begin script when window loads
window.onload = setMap();

//Example 1.3 line 4...set up choropleth map
function setMap() {
    //use Promise.all to parallelize asynchronous data loading
    var promises = [
        d3.csv("data/stateberries.csv"),
        d3.json("data/northamerica.topojson"),
        d3.json("data/states.topojson"),
    ];
    Promise.all(promises).then(callback);
}

function callback(data) {
    var csvData = data[0],
        northamerica = data[1],
        states = data[2];

    //translate europe TopoJSON
    var americanCountries = topojson.feature(northamerica, northamerica.objects.northamerica),
        unitedStates = topojson.feature(states, states.objects.states);

    //examine the results
    console.log(americanCountries);
    console.log(unitedStates);
}