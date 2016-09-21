var socket = io();
var growing = []
var history = null
console.log(socket)
socket.on("s2c", function(data) {
    console.log("Got data: " + data)
    socket.emit("c2s", "Roger " + data)
})
socket.on("latest", function(rec) {
    growing.push(rec)
    d3.select("#ppl").text(rec.in - rec.out)
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
  .attr("width", width + padding.left + padding.right)
  .attr("height", height + padding.top + padding.bottom)
  .attr("calss", "dbg-vis-border")
var vis = svg_node.append("g")
  .attr("transform", "translate(" + padding.left + "," + padding.right + ")")

var x_scale // created in d3.csv()'s callback, and
var y_scale // will be used in filter_selection() outside that callback

d3.csv("State-GPA.csv", function(error, demo_data) {
  x_scale = d3.scale.ordinal()
    .domain(demo_data.map(function(d) { return d["state"] }))
    .rangeRoundBands([0, width])
  var x_axis = d3.svg.axis().orient("bottom").scale(x_scale)
    .tickSize(3, 2, 0)
  vis.append("g").attr("class", "x-axis").call(x_axis)
    .attr("transform", "translate(0," + height + ")")
  y_scale = d3.scale.linear()
    .domain([0, 4])
    .range([height, 0])
  var y_axis = d3.svg.axis().orient("left").scale(y_scale)
  vis.append("g").attr("class", "y-axis").call(y_axis)
  var color_scale = d3.scale.category10().domain(x_scale.domain())

  var circle_container = vis.append("g").attr("id", "vis_content")

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

  groups.append("text")
    .attr("class", "value")
    .attr("x", 0)
    .attr("y", function(d) { return y_scale(d["Average-GPA"]) - 15 })
    .text(function(d) { return (+d["Average-GPA"]).toFixed(2) })
})

function filter_selection() {
  // Getting the value from the <input> with id "cut_off"
  // Refer to HTML to find it:)
  var lower_limit = d3.select("#cut_off").node().value
  // Find circle container by id vis_content
  var g_to_keep = d3.select("#vis_content").selectAll("g").filter(function(d) {
    return d["Average-GPA"] >= lower_limit
  })
  var g_to_hide = d3.select("#vis_content").selectAll("g").filter(function(d) {
    return d["Average-GPA"] < lower_limit
  })
  g_to_keep.selectAll("circle")
    .transition().duration(300).delay(function(d, i, n) { return n * 100 })
      .attr("r", 30)
    .transition().delay(function(d, i, n) { console.log(n); return n * 100 + 300 })
      .attr("cy", function(d) { return y_scale(d["Average-GPA"]) })
  // Animate radius to 0 for those states
  g_to_hide.selectAll("circle")
    .transition().duration(300)
      .attr("cy", height)
    .transition().delay(300) // Start shrink r after it reaches the x axis
      .attr("r",0)
  // Animate lines to grow up from the x-axis
  g_to_keep.selectAll("line")
    .transition().duration(300).delay(function(d, i, n) { return n * 100 + 300 })
      .attr("y1", function(d) { return y_scale(d["Average-GPA"]) })
  // Animate lines to shrink down to the x-axis
  g_to_hide.selectAll("line")
    .transition().duration(300)
      .attr("y1", height)
  
  // Animate opacity to 1 for the GPA text needed
  g_to_keep.selectAll("text")
    .transition().duration(300).delay(function(d, i, n) { return n * 100 + 400 })
      .attr("y", function(d) { return y_scale(d["Average-GPA"]) + 5 })
      .style("opacity", 1)
  // Animate on opacity to 0 for the GPA text not needed
  g_to_hide.selectAll("text")
    .transition().duration(300)
      .style("opacity", 0)
}
