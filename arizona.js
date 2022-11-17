// Defines magin, width, and height
var margin = {left: 80, right: 80, top: 0, bottom: 0 }, 
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Defines map projection
// Scales by 4000 to make projection bigger
var projection = d3.geoAlbersUsa().scale([4000]);

// Defines and calls path generator on projection
var path = d3.geoPath().projection(projection);

// Creates SVG element
// Translates by provided x and y to be roughly in center
var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + 875 + "," + -250 + ")");

// Defines red color scheme (default)
// Range is ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000']
var color1 = d3.scaleThreshold()
    .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
    .range(d3.schemeOrRd[9]);

// Defines blue color scheme (will update if button selected)
// Range is ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b']
var color2 = d3.scaleThreshold()
    .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
    .range(d3.schemeBlues[9]);

// Sets scale for legend
var x = d3.scaleSqrt()
    .domain([0, 4500])
    .rangeRound([440, 950]);

// Creates new SVG for legend
// Translates by provided x and y to be below projection
var g = d3.select("body")
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .append("g")
          .attr("class", "key")
           .attr("transform", "translate(-150, 50)");

// Adds text to legend SVG with specified style and positions it
g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Population per square mile");

// Adds rectangle to legend SVG
// Calculates length and color of each interval 
// Sets dimensions (height and width) of legend
g.selectAll("rect")
    .data(color1.range().map(function(d) {
        d = color1.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
    }))
    .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color1(d[0]); });

// Creates axis along edge of legend
// Specifies ticks and values
// Removes domain line (would have been on other end of legend)
g.call(d3.axisBottom(x)
       .tickSize(13)
       .tickValues(color1.domain()))
       .select(".domain")
       .remove();

// Initializes empty arrays for storing info from csv
// colors arrays store each county's intensity by color
var county_colors_red = [];
    county_colors_blue = [];
    county_names = [];
    densities = [];

// Helper function to specify data from csv file
// Converts strings to numbers
function rowConverter(d) {
    return {
        label : d.label,
        density : +d.density
    }
};

// Loads data from csv and converts necessary info
d3.csv("arizona-density.csv", rowConverter, function(data) {
    
    // Iterates for each of the 15 counties
    // Determines intensity of county's density
    // Stores intensities, name, and density in arrays
    for (let i = 0; i < data.length; i++){
        
        county_colors_red.push(color1(data[i].density));
        county_colors_blue.push(color2(data[i].density));
        county_names.push(data[i].label);
        densities.push(data[i].density);
    }
});

// Outputs array info to console
console.log("red intensities", county_colors_red);
console.log("blue intensities", county_colors_blue);
console.log("county names", county_names);
console.log("county densities", densities);

// Loads data from json
d3.json("arizona-counties.json", function(json){
    
    // Creates and adds paths to SVG
    // Default color is set to red
    svg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", function(d, i){
            return county_colors_red[i];
        });
    
    // Defines mouse-over function for tooltips
    svg.selectAll("path").on("mouseover", function(d){
       
        // Positions tooltip based on mouse location
        d3.select("#tooltip")
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY + "px");

        // Displays county name in tooltip for hovered over county
        d3.select("#tooltip")
            .select("#county")
            .text(d.properties.NAME);
        
        // Finds index of hovered over county in list of names
        // Index is used to determine county's density below
        const index = county_names.indexOf(d.properties.NAME + " County");
        
        // Displays county density in tooltip for hovered over county
        d3.select("#tooltip")
          .select("#density")
          .text(densities[index]);
        
        // Outputs hovered over county's name and density to console
        console.log(d.properties.NAME);
        console.log(densities[index]);

        // Displays entire tooltip
        d3.select("#tooltip").classed("hidden", false);

    })

    // Defines mouse-out function for tooltips
    .on("mouseout", function() {

         // Hides entire tooltip
         d3.select("#tooltip").classed("hidden", true);	
     }); 
});


// Button Functionality (takes input provided by user)
d3.selectAll("input")

    // Expects click to trigger new input
    .on("click", function() {
    
        // Gets provided input (1 (display), 0 (no display), Blue, or Red)
        var threshold = d3.select(this).node().value;
    
        // Outputs provided input to console
        console.log("input", threshold);
    
        // Checks if user wants to display county boundary lines
        if (threshold == "1"){
            
            // Fills stroke with white, essentially highlighting boundaries
            svg.selectAll("path")
                .style('stroke', 'white')
                .style('stroke-width', 1.5);
              
        }
    
        // Checks if user does not want to display county boundary lines
        else if (threshold == "0"){
            
            // Fills stroke with no color, essentially removing boundaries
            svg.selectAll("path")
                .style('stroke', 'none')
                .style('stroke-width', 1);
        }
    
        // Checks if user wants to display blue scheme
        else if (threshold == "Blue"){
            
            // Fills paths will blue scheme
            svg.selectAll("path")
                .style("fill", function(d, i){
                    return county_colors_blue[i];
                });
            
            // Removes everything displayed on legend
            g.selectAll("*").remove();
            
            // Adds text back to SVG with specified style and positions it
            g.append("text")
                .attr("class", "caption")
                .attr("x", x.range()[0])
                .attr("y", -6)
                .attr("fill", "#000")
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text("Population per square mile");

            // Adds rectangle back onto SVG
            // Calculates length and blue color of each interval 
            // Sets dimensions (height and width) of legend
            g.selectAll("rect")
                .data(color2.range().map(function(d) {
                    d = color2.invertExtent(d);
                    if (d[0] == null) d[0] = x.domain()[0];
                    if (d[1] == null) d[1] = x.domain()[1];
                    return d;
                }))
                .enter().append("rect")
                .attr("height", 8)
                .attr("x", function(d) { return x(d[0]); })
                .attr("width", function(d) { return x(d[1]) - x(d[0]); })
                .attr("fill", function(d) { return color2(d[0]); });

            // Creates axis along edge of legend
            // Specifies ticks and values
            // Removes domain line (would have been on other end of legend)
            g.call(d3.axisBottom(x)
                   .tickSize(13)
                   .tickValues(color2.domain()))
                   .select(".domain")
                   .remove();
            
        }
    
        // Checks if user wants to display red scheme
        else if (threshold == "Red"){
            
            // Fills paths will red scheme
            svg.selectAll("path")
                .style("fill", function(d, i){
                    return county_colors_red[i];
                });
            
            // Removes everything displayed on legend
            g.selectAll("*").remove();
            
            // Adds text back to SVG with specified style and positions it
            g.append("text")
                .attr("class", "caption")
                .attr("x", x.range()[0])
                .attr("y", -6)
                .attr("fill", "#000")
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text("Population per square mile");

            // Adds rectangle to SVG
            // Calculates length and red color of each interval 
            // Sets dimensions (height and width) of legend
            g.selectAll("rect")
                .data(color1.range().map(function(d) {
                    d = color1.invertExtent(d);
                    if (d[0] == null) d[0] = x.domain()[0];
                    if (d[1] == null) d[1] = x.domain()[1];
                    return d;
                }))
                .enter().append("rect")
                .attr("height", 8)
                .attr("x", function(d) { return x(d[0]); })
                .attr("width", function(d) { return x(d[1]) - x(d[0]); })
                .attr("fill", function(d) { return color1(d[0]); });

            // Creates axis along edge of legend
            // Specifies ticks and values
            // Removes domain line (would have been on other end of legend)
            g.call(d3.axisBottom(x)
                   .tickSize(13)
                   .tickValues(color1.domain()))
                   .select(".domain")
                   .remove();
        }
    });