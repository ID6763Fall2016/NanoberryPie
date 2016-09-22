var socket = io();
var growing = []
var past_entries = null
var steps = 1
socket.on("pick", function(res) {
    past_entries = res["picked"]
    steps = res["steps"]
    console.log("picked " + past_entries.length + " cases, steps = " + steps)
    console.log("picked received! ")
    socket.emit("pick_ack", true)
    render()
})
socket.on("latest", function(rec) {
    growing.push(rec)
    if(rec["conc"] < 0) rec["conc"] += 65536 // convert negative int to unit
    d3.select("#ppl_out_tf").text(rec.out + " out")
    d3.select("#ppl_in_tf").text(rec.in + " in")
    //d3.select("#conc").text(rec.conc)
    d3.select("#conc_tf").text((rec.conc / 100).toFixed(0))
    d3.select("#conc_group").transition().attr("transform", "translate(0, " + bubble_y_scale(rec.conc) + ")")
    if(null == past_entries) return // thiere is no conc2color yet
    d3.select("#conc_bubble").transition().attr("stroke", function(d) { return conc2color(rec["conc"]) })
    d3.select("#conc_tf").transition().style("fill", function(d) { return conc2color(rec["conc"]) })
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
var tip = d3.tip().attr("class", "d3-tip").html(desc);
svg_node.call(tip)
var vis = svg_node.append("g")
  .attr("transform", "translate(" + padding.left + "," + padding.right + ")")
var r0 = Math.min(width / 2, height) * .75
var arc_layer = vis.append("g").attr("id", "arc_layer")
    .attr("transform", "translate(" + (width / 2) + ", " + height + ")")
arc_layer.append("path")
    .attr("d", "M" + (-r0) + " 0 A " + r0 + " " + r0 + " 0 0 1 " + r0 + " 0")
    .style("fill", "none")
    .attr("stroke", "#EEEEEE")
    .attr("stoke-width", 2)
var dyn_layer = vis.append("g").attr("id","dyn_layer")
    .attr("transform", "translate(" + (width / 2) + ", " + height + ")")
var conc_g = dyn_layer.append("g").attr("id", "conc_group")
var conc_bubble = conc_g.append("circle")
    .attr("id", "conc_bubble")
    .attr("r", r0 / 5)
    .attr("cy", -r0 / 5)
    .attr("fill", "none")
    .attr("stroke", "#DADADA")
var conc_text = conc_g.append("text")
    .attr("id", "conc_tf")
    .text("***")
    .attr("class", "")
    .attr("dy", -r0 / 5)
    .style("text-anchor", "middle")
    .style("alignment-baseline", "middle")
    .style("font-size", 20)
var ppl_group = dyn_layer.append("g")
ppl_group.append("text").attr("id", "ppl_in_tf")
    .attr("dx", -30)
ppl_group.append("text").attr("id", "ppl_out_tf")
    .attr("dx", 30)
var tick_layer = vis.append("g")
    .attr("transform", "translate(" + (width / 2) + ", " + height + ")")
var n = 120 // partitions of the half circle
var x_scale // created in d3.csv()'s callback, and
var y_scale // will be used in filter_selection() outside that callback
var bubble_y_scale = d3.scale.linear().domain([0, 65536 / 4]).range([0, -40])
var conc2color
var arc = d3.svg.arc()
        .startAngle(function(d, i) { return x_scale(d["ts"]) })
        .endAngle(function(d, i) { return x_scale(d["end"]) })
        .padAngle(0)
        .padRadius(r0 / 3)
        .innerRadius(0.9 * r0)
        .outerRadius(r0)
socket.emit("pick", { "start": new Date(0), "cases": n })

function desc(d) {
    return "<p> Poeple: " + d["di"] + "</p>" + 
        "<p> Odor concentration: " + (d["conc"] / 100) + "</p>"
}

function render() {
  var shaped = past_entries.map(function(d, i, elements) {
      var obj = {"di": +d["in"], "do": +d["out"], "conc": +d["conc"], "ts": new Date(d["ts"])}
      if(0 > obj["conc"]) obj["conc"] = 65536 + obj["conc"] // int to unit
      if(i < n) obj["end"] = new Date(elements[i + 1]["ts"])
      if(i > 0) obj["di"] -= elements[i - 1]["in"], obj["do"] -= elements[i - 1]["out"]
      if(obj["di"] < 0) obj["di"] = 0
      if(obj["do"] < 0) obj["do"] = 0
      return obj
  })
  shaped.splice(-1, 1)
  console.log("Number of cases: " + shaped.length)
  console.log(shaped)
  x_scale = d3.time.scale()
    .domain([
        d3.min(shaped, function(d) { return d["ts"] }), 
        d3.max(shaped, function(d) { return d["end"] })
    ])
    .range([-Math.PI / 2, Math.PI / 2])
  var rotate_scale = d3.time.scale()
    .domain(x_scale.domain())
    .range([-90, 90])
  var min_max = d3.extent(shaped, function(d) { return d["conc"] })
  min_max.splice(1, 0, (min_max[0] + min_max[1]) / 2)
  console.log(min_max)
  conc2color = d3.scale.linear()
    .domain(min_max)
    .range(["#11afea", "#EAEAEA", "#dc0f79"])
  console.log(x_scale.domain())
  y_scale = d3.scale.linear()
    .domain([0, d3.max(shaped, function(d) { return d["di"] })])
    .range([0, -32])
  var hours = []
  var ts = new Date(x_scale.domain()[0])
  ts.setMinutes(0), ts.setSeconds(0)
  for(;ts <= x_scale.domain()[1]; ts.setHours(ts.getHours() + 1)) {
      var ti = new Date(ts)
      //console.log(ti)
      hours.push(ti)
  }
  tick_layer.selectAll("line .tick").data(hours)
      .enter().append("line").attr("class", "tick")
    .attr("x1", 0).attr("y1", 0)
    .attr("x2", 0).attr("y2", -4)
    .attr("stroke", "#797979")
    .attr("stoke-width", 1)
    .attr("transform", function(d) {
        return "rotate(" + (rotate_scale(d)) + 
            ") translate(0," + (- r0 - 50) + ")"
    })
  tick_layer.selectAll("text .tick").data(hours)
      .enter().append("text").attr("class", "tick")
    .attr("fill", "#797979")
    .style("text-anchor", "middle")
    .style("alignment-baseline", "middle")
    .style("font-size", 7)
    .attr("transform", function(d) {
        return "rotate(" + (rotate_scale(d)) + 
            ") translate(0," + (- r0 - 60) + ")"
    })
    .text(date2hhmm)

  var groups = arc_layer.selectAll("g .slice").data(shaped)
  var entering_groups = groups.enter().append("g")
    .attr("class", "slice")
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide)
  //var paths = arc_layer.selectAll("path .slice").data(shaped)
  //paths.enter().append("path")
  entering_groups.append("path")
    .attr("d", arc)
    .style("fill", function(d, i) { return conc2color(d["conc"]) })
    .style("opacity", 1)
  entering_groups.append("line")
    .attr("x1", 0).attr("y1", 0)
    .attr("x2", 0).attr("y2", function(d) { return y_scale(d["di"]) })
    .attr("stroke", "#797979")
    .attr("stoke-width", 1)
    .attr("transform", function(d) {
        return "rotate(" + (rotate_scale(d["ts"]) / 2 + rotate_scale(d["end"]) / 2) + 
            ") translate(0," + (- r0 - 3) + ")"
    })

  entering_groups.append("circle")
    .attr("class", "head")
    .attr("r", function(d) { return d["di"] > 0? 2 : 0 })
    .attr("fill", "#797979")
    .attr("transform", function(d) {
        return "rotate(" + (rotate_scale(d["ts"]) / 2 + rotate_scale(d["end"]) / 2) + 
            ") translate(0," + (- r0 - 3 + y_scale(d["di"])) + ")"
    })
//  entering_groups.append("text")
//    .attr("class", "stamp")
//    .attr("transform", function(d) {
//        return "rotate(" + (rotate_scale(d["ts"])) + 
//            ") translate(0," + (- r0 - 60) + ") rotate(90)"
//    })
//    .text(date2hhmmss)
}

function date2hhmmss(d) {
    var ts = d["ts"]
    var h = ts.getHours()
    if(h < 10) h = "0" + h
    var m = ts.getMinutes()
    if(m < 10) m = "0" + m
    var s = ts.getSeconds()
    if(s < 10) s = "0" + s
    return [h, m, s].join(":")
}

function date2hhmm(d) {
    var ts = d
    var h = ts.getHours()
    if(h < 10) h = "0" + h
    var m = ts.getMinutes()
    if(m < 10) m = "0" + m
    return [h, m].join(":")
}

