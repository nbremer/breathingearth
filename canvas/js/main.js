///////////////////////////////////////////////////////////////////////////
////////////////////////////// Mobile or not //////////////////////////////
///////////////////////////////////////////////////////////////////////////


//If it's too small, thus most likely mobile, tell them to watch on pc
var md = new MobileDetect(window.navigator.userAgent);
var isMobile = (md.mobile() !== null || md.phone() !== null || md.tablet() !== null);

if(isMobile) {
	//Show the hidden image
	d3.selectAll(".mobile").style("display", "block");
	d3.select("canvas").style("display", "none");
	//Change text in the "stop/start" button
	d3.select("#stopstart")
		.text("for the animation through all 52 weeks, please go to a desktop. I promise it looks mesmerizing!")
	//Adjust the title above the map
	d3.select("#week").text("Week 23, June, 2016");
} else {
	//Call the function
	createCanvasMap();
}//else

//Function to draw the canvas based map
function createCanvasMap() {

	///////////////////////////////////////////////////////////////////////////
	//////////////////////////// Set up the canvas ////////////////////////////
	///////////////////////////////////////////////////////////////////////////

	var width = 1000;
	//Mercator map ratio
	var mapRatio = 0.5078871;
	var height = Math.round(mapRatio * width);

	//Create the canvas
	var canvas = document.getElementById("canvas");
	canvas.width = width;
	canvas.height = height;
	var ctx = canvas.getContext("2d");

	//From https://www.html5rocks.com/en/tutorials/canvas/hidpi/#toc-1
	var devicePixelRatio = window.devicePixelRatio || 1;
	var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
							ctx.mozBackingStorePixelRatio ||
							ctx.msBackingStorePixelRatio ||
							ctx.oBackingStorePixelRatio ||
							ctx.backingStorePixelRatio || 1;
	var ratio = devicePixelRatio / backingStoreRatio;

	//Upscale the canvas if the two ratios don't match
	if (devicePixelRatio !== backingStoreRatio) {
		canvas.width = width * ratio;
		canvas.height = height * ratio;
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
		// now scale the context to counter
		// the fact that we've manually scaled our canvas element
		ctx.scale(ratio, ratio);
	}//if

	///////////////////////////////////////////////////////////////////////////
	///////////////////////// Create global variables /////////////////////////
	///////////////////////////////////////////////////////////////////////////

	//Color blend mode for all
	ctx.globalCompositeOperation = "multiply";

	var nWeeks = 52;					//Number of weeks in the year :)
	var startMap = isMobile ? 22 : 12;	//The week of the first map to be drawn

	//Will save the coordinate mapping
	var loc;

	//The minimum and maximum values of the layer variable
	var maxL = 0.8,
		minL = 0; //-0.06;

	//Timer variables
	var animate,
		stopAnimation = false;

	//Months during those weeks
	var months = [
		"January", //1
		"January", //2
		"January", //3
		"January", //4
		"February", //5
		"February", //6
		"February", //7
		"February", //8
		"February & March", //9
		"March", //10
		"March", //11
		"March", //12
		"March & April", //13
		"April", //14
		"April", //15
		"April", //16
		"April & May", //17
		"May", //18
		"May", //19
		"May", //20
		"May", //21
		"May & June", //22
		"June", //23
		"June", //24
		"June", //25
		"June & July", //26
		"July", //27
		"July", //28
		"July", //29
		"July", //30
		"August", //31
		"August", //32
		"August", //33
		"August", //34
		"August & September", //35
		"September", //36
		"September", //37
		"September", //38
		"September & October", //39
		"October", //40
		"October", //41
		"October", //42
		"October", //43
		"October & November", //44
		"November", //45
		"November", //46
		"November", //47
		"November & December", //48
		"December", //49
		"December", //50
		"December", //51
		"December & January", //52
	];

	var saveToImage = false;

	///////////////////////////////////////////////////////////////////////////
	/////////////////////////////// Create scales /////////////////////////////
	///////////////////////////////////////////////////////////////////////////

	var xScale = d3.scaleLinear()
		.domain([1, 500])
		.range([0, width]);

	var yScale = d3.scaleLinear()
		.domain([1, 250])
		.range([height, 0]);

	var radiusScale = d3.scaleSqrt()
		.domain([minL, maxL])
		.range([0, 2.5])
		.clamp(true);

	var opacityScale = d3.scaleLinear()
		.domain([minL, maxL])
		.range([1, 0.5]);

	var greenColor = d3.scaleLinear()
		.domain([-0.08, 0.1, maxL])
		.range(["#FAECAB", "#f2ec82", "#0c750c"]);

	///////////////////////////////////////////////////////////////////////////
	/////////////////////////// Read in a first map ///////////////////////////
	///////////////////////////////////////////////////////////////////////////

	d3.queue() 
		.defer(d3.csv, "../data/worldMap_coordinates.csv")
		.defer(d3.csv, "../data/VIIRS/mapData-week-" + startMap + ".csv")
		.await(drawFirstMap);

	function drawFirstMap(error, coordRaw, data) {

		///////////////////////////////////////////////////////////////////////////
		///////////////////////////// Final data prep /////////////////////////////
		///////////////////////////////////////////////////////////////////////////
		
		if (error) throw error;

		coordRaw.forEach(function(d) {
			d.x = +d.x;
			d.y = +d.y;
		});
		loc = coordRaw;
		
		data.forEach(function(d) {
			d.layer = +d.layer;
		});

		///////////////////////////////////////////////////////////////////////////
		///////////////////////////// Create first map ////////////////////////////
		///////////////////////////////////////////////////////////////////////////

		//Set the title
		d3.select("#week").text("Week " + (startMap+1) + ", " + months[startMap] + ", 2016");

		//Draw each circle
		data.forEach(function(d,i) {
			//Create each circle
			ctx.fillStyle = greenColor(d.layer);
			ctx.globalAlpha = opacityScale(d.layer);
			ctx.beginPath();
			ctx.arc(xScale(loc[i].x), yScale(loc[i].y), radiusScale(d.layer), 0, 2*Math.PI, 1);
			ctx.closePath();
			ctx.fill();
		});

		///////////////////////////////////////////////////////////////////////////
		////////////////////////// Read in the other maps /////////////////////////
		///////////////////////////////////////////////////////////////////////////
		
		if(!isMobile) {
			setTimeout(function() {
				//Create a queue that loads in all the files first, before calling the draw function
				var q = d3.queue();

				for(var i = 0; i < nWeeks; i++) {
					//Add each predefined file to the queue
					q = q.defer(d3.csv, "../data/VIIRS/mapData-week-" + (i+1) + ".csv");
				}//for i
				q.await(drawAllMaps);
			}, 1000);
		}//if

	}//function drawFirstMap

	///////////////////////////////////////////////////////////////////////////
	/////////////////////// Animate through all the maps //////////////////////
	///////////////////////////////////////////////////////////////////////////
	function drawAllMaps(error) {

		if (error) throw error;

		///////////////////////////////////////////////////////////////////////////
		////////////////////////// Final data preparation /////////////////////////
		///////////////////////////////////////////////////////////////////////////

		console.log("preparing map data");

		//Create array that will hold all data
		var rawMaps = arguments;
		var nCircles;
		maps = new Array(nWeeks);

		//From: https://github.com/tungs/breathe
		breathe.times(nWeeks+1, function(i) {
			if(i !== 0) {
				var data = rawMaps[i];
				data.forEach(function(d) {
					d.layer = +d.layer;
					d.color = d3.rgb(greenColor(d.layer));
					d.opacity = opacityScale(d.layer);
					d.size = radiusScale(d.layer);
				});
				//And save in a new array
				maps[(i-1)] = data;
			}//if
		})
		.then(function() {
			//Run after the map data loop above is finished
			console.log("prepared all maps, starting animation");

			//Delete the arguments since we now have all the data in a new variable
			delete arguments;
			delete rawMaps;

			d3.select("#stopstart")
				.style("cursor", "pointer")
				.text("stop the animation (yes it's very slow, but it's really going trough all 52 weeks)");
			//Function attached to the stop/start button
			d3.select("#stopstart").on("click", function() { 
				if(!stopAnimation) {
					stopAnimation = true;
					d3.select(this).text("restart the animation");
				} else {
					stopAnimation = false;
					d3.select(this).text("stop the animation");
					animate();
				}//else 
			});

			nCircles = maps[0].length;
			//Start the animation
			animate();
		});


		// //Old standard loop function
		// //Save each map in a variable, loop over it to make all variables numeric
		// for (var i = 1; i < arguments.length; i++) {
		// 	var data = arguments[i];
		// 	data.forEach(function(d) {
		// 		d.layer = +d.layer;
		// 		d.color = d3.rgb(greenColor(d.layer));
		// 		d.opacity = opacityScale(d.layer);
		// 		d.size = radiusScale(d.layer);
		// 	});
		// 	//And save in a new array
		// 	maps[(i-1)] = data;
		// }//for i
		// //Delete the arguments since we now have all the data in a new variable
		// delete arguments;

		//I could not have done the part below without this great block 
		//https://bl.ocks.org/rflow/55bc49a1b8f36df1e369124c53509bb9
		//to make it performant, by Alastair Dant (@ajdant)

		//Animate the changes between states over time
		const fps = 1;
		const tweenTime = 1;
		const tweenFrames = fps * tweenTime;

		var counter = startMap-1, 
			frame = 0, 
			progress = 0;

		var extraText;

		//Called every requestanimationframe
		animate = function() {

			// track circles, states and scales
			var currValue, nextValue, value, i;
			var currColor, nextColor, r, g, b, color;
			var currSize, nextSize, size;
			var currOpacity, nextOpacity, opacity;

			//Track progress as proportion of frames completed
			frame = ++frame % tweenFrames;
			progress = (frame / tweenFrames) || 0;

			//console.log(counter, frame, progress);

			//Increment state counter once we've looped back around
			if (frame === 0) {
				counter = ++counter % nWeeks;
				extraText = counter < 4 ? " | missing data in the North" : "";
				//Adjust the title
				d3.select("#week").text("Week " + (counter+1) + ", " + months[counter] + ", 2016" + extraText);
			};

			var currMap = maps[counter],
				nextMap = maps[(counter+1) % nWeeks];

			//Clear the previous map
			ctx.clearRect(0, 0, width, height);

			//Update scale and color of all circles by
			//Interpolating current state and next state
			for (i = 0; i < nCircles; i++) {

				//Trial and testing has taught me that it's best to 
				//do all of these values separately
				currSize = currMap[i].size;
				nextSize = nextMap[i].size;
				//Interpolate between them
				size = currSize + ((nextSize - currSize) * progress);

				currOpacity = currMap[i].opacity;
				nextOpacity = nextMap[i].opacity;
				//Interpolate between them
				opacity = currOpacity + ((nextOpacity - currOpacity) * progress);

				currColor = currMap[i].color;
				nextColor = nextMap[i].color;
				//Interpolate between them
				r = currColor.r + ((nextColor.r - currColor.r) * progress);
				g = currColor.g + ((nextColor.g - currColor.g) * progress);
				b = currColor.b + ((nextColor.b - currColor.b) * progress);
				color = d3.rgb(r,g,b);

				//Finally set the new values on the circle and draw
				ctx.fillStyle = color;
				ctx.globalAlpha = opacity;
				ctx.beginPath();
				ctx.arc(xScale(loc[i].x), yScale(loc[i].y), size, 0, 2*Math.PI, 1);
				ctx.closePath();
				ctx.fill();

			}//for i

			//Cue up next frame then render the updates
			if(!stopAnimation) requestAnimationFrame(animate);

			// if(saveToImage) {
			// 	//Save canvas image as data url (png format by default)
			// 	var dataURL = canvas.toDataURL();
			// 	document.getElementById('canvasImg').src = dataURL;
			// }//if

		}//function animate

		//animate();

	}//function drawAllMaps

}//function createCanvasMap