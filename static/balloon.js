var socket = io();
var growing = []
var past_entries = null
socket.on("history", function(list) {
    past_entries = list
    console.log("got history of " + list.length + " entries")
    socket.emit("history_ack", true)
    render_history()
})
socket.on("latest", function(rec) {
    growing.push(rec)
    d3.select("#ppl_out").text(rec.out)
    d3.select("#ppl_in").text(rec.in)
    d3.select("#conc").text(rec.conc)
})
var width = 640
var height = 360
var padding = {
  "top": 30,
  "left": 30,
  "bottom": 30,
  "right": 30
}
var svg_node = d3.select("#svg_container").append("svg")
  //.attr("width", width + padding.left + padding.right)
  //.attr("height", height + padding.top + padding.bottom)
  //.attr("calss", "dbg-vis-border")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 " + (width + padding.left + padding.right) + " " + (height + padding.top + padding.bottom))
  //class to make it responsive
  .classed("svg-content-responsive", true); 
var vis = svg_node.append("g")
  .attr("transform", "translate(" + padding.left + "," + padding.right + ")")

var x_scale // created in d3.csv()'s callback, and
var y_scale // will be used in filter_selection() outside that callback

function render_history() {
  x_scale = d3.time.scale()
    .domain(d3.extent(past_entries, function(d) { return new Date(d["ts"]) }))
    .range([0, 180])
  console.log(x_scale.domain())
//  var x_axis = d3.svg.axis().orient("bottom").scale(x_scale)
//    .tickSize(3, 2, 0)
//  vis.append("g").attr("class", "x-axis").call(x_axis)
//    .attr("transform", "translate(0," + height + ")")
  y_scale = d3.scale.linear()
    .domain([0, 4])
    .range([height, 0])
//  var y_axis = d3.svg.axis().orient("left").scale(y_scale)
//  vis.append("g").attr("class", "y-axis").call(y_axis)
  //var color_scale = d3.scale.category10().domain(x_scale.domain())

  var content_layer = vis.append("g").attr("id", "vis_content")
}
  /*
  var groups = circle_container.selectAll("g")
    .data(demo_data.filter(function(d) {
    // Try to convert string to int, parseInt() also works
      var gpa = +d["Average-GPA"]
      // Write filter conditions so that the gpa is a number and in [0, 4]
      return !isNaN(gpa) && 0 <= gpa && gpa <= 4
    })).enter()
    .append("g")
    .attr("transform", function(d) {
      return "translate(" + (x_scale(d["state"]) + x_scale.rangeBand() / 2 ) + ",0)" 
    })
  groups.append("line")
    .style("stroke-width", 1)
    .style("stroke", function(d) { return color_scale(d["state"]) })
    .attr("x1", 0).attr("y1", function(d) { return y_scale(d["Average-GPA"]) })
    .attr("x2", 0).attr("y2", height)

  groups.append("circle")
    .attr("cx", 0)
    .attr("cy", function(d) { return y_scale(d["Average-GPA"]) })
    .attr("r", 10)
    .style("fill", function(d) { return color_scale(d["state"]) })
    */

