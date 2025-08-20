---
title: d3 concentric
layout: default 
---

<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600&display=swap" rel="stylesheet">
<style>
  #chart text{ font-family:"Noto Sans JP",sans-serif; }
  /* SVGのクリッピング防止 */
  #chart svg { overflow: visible; display: block; width: 100%; height: auto; }
  /* コンテナの最大幅（必要に応じて調整） */
  #chart { max-width: 640px; margin: 0 auto; }
</style>

<div id="chart" style="width:420px; height:420px; margin:auto;"></div>

<!-- d3本体をCDNから -->
<script src="https://d3js.org/d3.v7.min.js"></script>

<!-- ページ内に直接書く例（Jekyllでそのまま通る） -->
<script>
const M = {top:32,right:180,bottom:40,left:180};
const W = 640, H = 640;
const innerW = W - M.left - M.right;
const innerH = H - M.top - M.bottom;
const r = Math.min(innerW, innerH)/2;

const svg = d3.select("#chart").append("svg")
  .attr("viewBox", `0 0 ${W} ${H}`);

const g = svg.append("g")
  .attr("transform", `translate(${M.left + innerW/2},${M.top + innerH/2})`);

// 同心円
[0.25,0.5,0.75,1.0].forEach(f =>
  g.append("circle").attr("r", r*f).attr("fill","none").attr("stroke","black")
);

// 十字
g.append("line").attr("x1",-r).attr("x2", r).attr("y1",0).attr("y2",0).attr("stroke","black");
g.append("line").attr("x1",0).attr("x2",0).attr("y1",-r).attr("y2", r).attr("stroke","black");

// ==== 便利関数（角度は度数）====
const polar = (rho, thetaDeg) => {
  const t = thetaDeg * Math.PI/180;
  return [rho * Math.cos(t), rho * Math.sin(t)];
};
const addLabel = (txt, rho, theta, opt={}) => {
  const [x,y] = polar(rho, theta);
  const anchor =
    (theta > -90 && theta < 90) ? "start" :
    (theta === 90 || theta === -90) ? "middle" : "end";
  g.append("text")
    .text(txt)
    .attr("x", x + (opt.dx || 0))
    .attr("y", y + (opt.dyAbs || 0))  // ← ここで絶対オフセット
    .attr("text-anchor", opt.anchor || anchor)
    .attr("dominant-baseline", opt.baseline || "middle");
    // .attr("dy", opt.dy || "0");    // 相対移動はオフ
};

// 中央ラベル
addLabel("PD", 0, 0, {anchor:"middle"});

// 右方向に並べる内側ラベル（角度0°、左詰め＝start）
addLabel("OD",                r*0.30, 0, {anchor:"start", dyAbs:-18});
addLabel("個人／教員",        r*0.55, 0, {anchor:"start", dyAbs:  0});
addLabel("学部・学科／FD担当", r*0.80, 0, {anchor:"start", dyAbs: 18});
addLabel("全学／FD担当・経営層", r*1.05, 0, {anchor:"start", dyAbs: 36});

// 象限ラベル（45°ずらすと円と干渉しにくい）
addLabel("研究",         r*0.93, 135);
addLabel("教育",         r*0.93,  45);
addLabel("リーダーシップ", r*0.93, -135);
addLabel("社会関与",     r*0.93,  -45);
</script>
