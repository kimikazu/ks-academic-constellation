---
title: d3 concentric diagram
layout: default   # 既存の default.html など
---

<div id="chart" style="width:420px; height:420px; margin:auto;"></div>

<!-- d3本体をCDNから -->
<script src="https://d3js.org/d3.v7.min.js"></script>

<!-- ページ内に直接書く例（Jekyllでそのまま通る） -->
<script>
const box = document.getElementById("chart");
const w = box.clientWidth, h = box.clientHeight, r = Math.min(w,h)/2 - 20;

const svg = d3.select("#chart")
  .append("svg").attr("width", w).attr("height", h)
  .append("g").attr("transform", `translate(${w/2},${h/2})`);

// 同心円
[0.25,0.5,0.75,1.0].forEach(f => {
  svg.append("circle")
     .attr("r", r*f)
     .attr("fill","none")
     .attr("stroke","black");
});

// 象限の十字
svg.append("line").attr("x1",-r).attr("x2",r).attr("y1",0).attr("y2",0).attr("stroke","black");
svg.append("line").attr("x1",0).attr("x2",0).attr("y1",-r).attr("y2",r).attr("stroke","black");

// ラベル（位置はpxで微調整）
svg.append("text").text("PD").attr("text-anchor","middle").attr("dy","0.35em");
svg.append("text").text("OD").attr("x", r*0.3).attr("y", r*0.12);
svg.append("text").text("個人/教員").attr("x", r*0.55).attr("y", r*0.15);
svg.append("text").text("学部・学科/FD担当").attr("x", r*0.80).attr("y", r*0.15);
svg.append("text").text("全学/FD担当・経営層").attr("x", r*1.05).attr("y", r*0.15);

// 象限ラベル
svg.append("text").text("研究").attr("x",-r*0.9).attr("y",-r*0.9).attr("text-anchor","middle");
svg.append("text").text("教育").attr("x", r*0.9).attr("y",-r*0.9).attr("text-anchor","middle");
svg.append("text").text("リーダーシップ").attr("x",-r*0.9).attr("y", r*0.9).attr("text-anchor","middle");
svg.append("text").text("社会関与").attr("x", r*0.9).attr("y", r*0.9).attr("text-anchor","middle");
</script>
