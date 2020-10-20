createCanvasMap()

//Function to draw the canvas based map
function createCanvasMap() {

	///////////////////////////////////////////////////////////////////////////
	//////////////////////////// Set up the canvas ////////////////////////////
	///////////////////////////////////////////////////////////////////////////

	var width = 1000
	//Mercator map ratio
	var mapRatio = 0.5078871
	var height = Math.round(mapRatio * width)

    const svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height)
    const g = svg.append("g")//.attr("transform", `translate(0,${-100})`)

	///////////////////////////////////////////////////////////////////////////
	///////////////////////// Create global variables /////////////////////////
	///////////////////////////////////////////////////////////////////////////

	//Will save the coordinate mapping
	var loc

	//The minimum and maximum values of the layer variable
	var maxL = 0.8,
		minL = 0;

	///////////////////////////////////////////////////////////////////////////
	/////////////////////////////// Create scales /////////////////////////////
	///////////////////////////////////////////////////////////////////////////

	var xScale = d3.scaleLinear()
		.domain([1, 500])
		.range([0, width])

	var yScale = d3.scaleLinear()
		.domain([1, 250])
		.range([height, 0])

	var radiusScale = d3.scaleSqrt()
		.domain([minL, maxL])
		.range([0, 2.5])
		.clamp(true)

	var opacityScale = d3.scaleLinear()
		.domain([minL, maxL])
		.range([1, 0.5])

	var greenColor = d3.scaleLinear()
		.domain([-0.08, 0.1, maxL])
		.range(["#FAECAB", "#f2ec82", "#0c750c"])

	///////////////////////////////////////////////////////////////////////////
	/////////////////////////// Read in a first map ///////////////////////////
	///////////////////////////////////////////////////////////////////////////

	d3.queue() 
		.defer(d3.csv, "../data/worldMap_coordinates.csv")
		.defer(d3.csv, "../data/VIIRS/mapData-week-" + 23 + ".csv")
		.await(drawFirstMap);

	function drawFirstMap(error, coordRaw, data) {

		///////////////////////////////////////////////////////////////////////////
		///////////////////////////// Final data prep /////////////////////////////
		///////////////////////////////////////////////////////////////////////////
		
		if (error) throw error

		coordRaw.forEach(function(d) {
			d.x = +d.x
			d.y = +d.y
		})
		loc = coordRaw
		
		data.forEach(function(d) {
			d.layer = +d.layer
		})

		///////////////////////////////////////////////////////////////////////////
		///////////////////////////// Create first map ////////////////////////////
		///////////////////////////////////////////////////////////////////////////

        g.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", (d,i) => xScale(loc[i].x))
            .attr("cy", (d,i) => yScale(loc[i].y))
            .attr("r", d => radiusScale(d.layer))
            .style("fill", d => greenColor(d.layer))
            .style("opacity", d => opacityScale(d.layer))
            .style("mix-blend-mode", "multiply")

	}//function drawFirstMap

}//function createCanvasMap