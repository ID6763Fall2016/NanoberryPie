var socket = io();
var growing = []
var past_entries = null
socket.on("history", function(list) {
    past_entries = list
    console.log("got history of " + list.length + " entries")
    socket.emit("history_ack", true)
    console.log("history received! ")
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
var arc_layer = vis.append("g").attr("id", "arc_layer")
    .attr("transform", "translate(" + (width / 2) + ", " + (height / 2) + ")")
var r0 = Math.min(width, height) / 2
arc_layer.append("path")
    .attr("d", "M" + (-r0) + " 0 A " + r0 + " " + r0 + " 0 0 1 " + r0 + " 0")
    .style("fill", "none")
    .attr("stroke", "#EEEEEE")
    .attr("stoke-width", 2)
var n = 120 // partitions of the half circle
var x_scale // created in d3.csv()'s callback, and
var y_scale // will be used in filter_selection() outside that callback
var conc2color
var arc = d3.svg.arc()
        .startAngle(function(d, i) { return x_scale(d["ts"]) })
        .endAngle(function(d, i) { return x_scale(d["end"]) })
        .padAngle(0)
        .padRadius(r0 / 3)
        .innerRadius(0.9 * r0)
        .outerRadius(r0)

function render_history() {
  var step = Math.ceil(past_entries.length / (n + 1))
  var shaped = past_entries.filter(function(d, i, elements) {
      return (0 == i % step) 
  }).map(function(d, i, elements) {
      var obj = {"in": +d["in"], "out": +d["out"], "conc": +d["conc"], "ts": new Date(d["ts"])}
      if(0 > obj["conc"]) obj["conc"] = 65536 + obj["conc"] // int to unit
      if(i < n) obj["end"] = new Date(elements[i + 1]["ts"])
      return obj
  })
  shaped.splice(-1, 1)
  console.log("Number of cases: " + shaped.length)
  x_scale = d3.time.scale()
    .domain([
        d3.min(shaped, function(d) { return d["ts"] }), 
        d3.max(shaped, function(d) { return d["end"] })
    ])
    .range([-Math.PI / 2, Math.PI / 2])
  var min_max = d3.extent(shaped, function(d) { return d["conc"] })
  min_max.splice(1, 0, (min_max[0] + min_max[1]) / 2)
  conc2color = d3.scale.linear()
    .domain(min_max)
    .range(["#11afea", "#EAEAEA", "#dc0f79"])
  console.log(x_scale.domain())
  var paths = arc_layer.selectAll("path .slice").data(shaped)
  paths.enter().append("path")
    .attr("class", "slice")
    .attr("d", arc)
    .style("fill", function(d, i) { return conc2color(d["conc"]) })
    .style("opacity", 1)

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

