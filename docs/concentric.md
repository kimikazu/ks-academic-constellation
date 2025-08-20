---
title: Concentric (d3)
layout: default
---

<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600&display=swap" rel="stylesheet">
<style>
  #chart svg { overflow: visible; display:block; width:100%; height:auto; }
  #chart { max-width: 680px; margin: 0 auto; }
  #chart text { font-family: "Noto Sans JP", system-ui, -apple-system, "Segoe UI", sans-serif; fill:#111; }
  .caption { font-size: 12px; fill:#333; }
  .ringLabel { font-size: 14px; }
  .quadLabel { font-size: 14px; }
  .centerSmall { font-size: 12px; }
</style>

<div id="chart"></div>

<script src="https://d3js.org/d3.v7.min.js"></script>
<script>
(function(){
  // 全体サイズと余白（右に広めの余白をとる）
  const M = {top:40, right:190, bottom:48, left:190};
  const W = 760, H = 760;
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const R = Math.min(innerW, innerH) / 2;

  const svg = d3.select("#chart").append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("aria-label","Concentric diagram");

  const g = svg.append("g")
    .attr("transform", `translate(${M.left + innerW/2}, ${M.top + innerH/2})`);

  // 円（4リング）
  const fracs = [0.26, 0.50, 0.74, 0.98];
  fracs.forEach(f=>{
    g.append("circle")
      .attr("r", R*f)
      .attr("fill","none")
      .attr("stroke","#222");
  });

  // 十字（点線）
  g.append("line").attr("x1",-R).attr("x2", R).attr("y1",0).attr("y2",0)
    .attr("stroke","#222").attr("stroke-dasharray","5,6");
  g.append("line").attr("x1",0).attr("x2",0).attr("y1",-R).attr("y2",R)
    .attr("stroke","#222").attr("stroke-dasharray","5,6");

  // 便利関数
  const polar = (rho, deg) => {
    const t = deg*Math.PI/180;
    return [rho*Math.cos(t), rho*Math.sin(t)];
  };
  const addTextLines = (x, y, lines, cls, anchor="start", baseline="middle") => {
    const t = g.append("text")
      .attr("class", cls)
      .attr("x", x).attr("y", y)
      .attr("text-anchor", anchor)
      .attr("dominant-baseline", baseline);
    lines.forEach((s,i)=>{
      t.append("tspan")
        .attr("x", x)
        .attr("dy", i===0 ? "0" : "1.15em")
        .text(s);
    });
    return t;
  };

  // 中央：PD / OD（２行）
  addTextLines(0, 0, ["PD", "OD"], "ringLabel", "middle", "middle");

  // 右上（各リングの小見出し＋本体ラベル）
  // 画像に合わせ、水平より少し上（-10°）の位置に寄せます
  const theta = -10; // 右方向より少し上
  // 最外周
  let [x4,y4] = polar(R*0.98, theta);
  addTextLines(x4, y4-20, ["マクロ"], "caption", "start", "baseline");
  addTextLines(x4, y4, ["全学", "FD担当者・管理職"], "ringLabel", "start");
  // 3番目
  let [x3,y3] = polar(R*0.74, theta);
  addTextLines(x3, y3-20, ["ミドル"], "caption", "start", "baseline");
  addTextLines(x3, y3, ["学部・学科", "FD担当者・管理職"], "ringLabel", "start");
  // 2番目
  let [x2,y2] = polar(R*0.50, theta);
  addTextLines(x2, y2-20, ["ミクロ"], "caption", "start", "baseline");
  addTextLines(x2, y2, ["個人", "教員"], "ringLabel", "start");
  // 最内周（中央の少し上に OD/PD の説明を小さめで）
  let [x1,y1] = polar(R*0.30, theta);
  addTextLines(x1, y1, ["OD（組織の改善）", "＋", "PD（個人の成長）"], "centerSmall", "start");

  // 外側の象限ラベル（45°ずらし）
  const q = 0.93*R;
  const quads = [
    {txt:"研究", deg:-135, anchor:"end"},
    {txt:"教育", deg:-45,  anchor:"start"},
    {txt:"リーダーシップ", deg:135, anchor:"end"},
    {txt:"社会関与", deg:45, anchor:"start"},
  ];
  quads.forEach(d=>{
    const [qx,qy]=polar(q, d.deg);
    addTextLines(qx, qy, [d.txt], "quadLabel", d.anchor);
  });

  // 見た目の微調整：フォントロード後の再配置（必要に応じて）
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(()=>{ /* さらに詰めたければここで getBBox 調整 */ });
  }
})();
</script>
