export function vArchive(ctx) {
  var W = ctx.wkDoneList(),
    L = ctx.arcList(),
    wk7 = ctx.iso(new Date(Date.now() - 6 * 864e5)),
    n7 =
      W.filter(function (o) {
        return o.k >= wk7;
      }).length +
      L.filter(function (o) {
        return o.k >= wk7;
      }).length,
    h =
      ctx.pcard({
        k: "Archive",
        t: W.length + L.length + " tasks completed",
        st: [
          [W.length, "Work"],
          [L.length, "Timeline"],
          [n7, "Last 7 days"],
        ],
      }) + ctx.archTabs(W.length, L.length);
  if (ctx.ARCT === "work") return h + ctx.archWork(W);
  if (!L.length)
    return (
      h +
      '<p class="note">Nothing yet. Tasks you add to the timeline and finish will collect here. Suggestions are not counted.</p>'
    );
  var sh = ctx.ARC_ALL ? L : L.slice(0, 40),
    cur = "";
  sh.forEach(function (o) {
    if (o.k !== cur) {
      cur = o.k;
      var n = L.filter(function (z) {
        return z.k === cur;
      }).length;
      h +=
        '<div class="arc-d"><b>' +
        ctx.arcDay(cur) +
        "</b><span>" +
        n +
        "</span></div>";
    }
    h +=
      '<div class="arc-r"><span class="arc-c">✓</span><div class="arc-t"><b>' +
      ctx.esc(o.x) +
      "</b><small>" +
      ctx.esc(o.t || "") +
      (o.lg ? " · Logged in Log" : "") +
      '</small></div><button class="od-mv arc-u" data-a="arr" data-k="' +
      o.k +
      '" data-i="' +
      o.i +
      '">Undo</button></div>';
  });
  if (L.length > 40)
    h +=
      '<button class="od-more" data-a="arm">' +
      (ctx.ARC_ALL ? "Show less" : "Show " + (L.length - 40) + " older") +
      "</button>";
  return h;
}
