export function vReports(ctx) {
  var ks = Object.keys(ctx.S.reports).sort().reverse();
  return (
    '<div class="add" style="justify-content:space-between;align-items:center"><button class="btn alt" data-a="wview" data-i="week">Back to week</button><b>Saved reports</b></div>' +
    (ks.length
      ? '<div class="box">' +
        ks
          .map(function (ws) {
            var r = ctx.S.reports[ws];
            return (
              '<button class="drow" data-a="oprep" data-i="' +
              ws +
              '" style="grid-template-columns:1fr 16px"><span><b>' +
              ctx.wlabel(ws) +
              '</b><small class="mut" style="display:block">' +
              ctx.esc(r.head) +
              ", effort " +
              r.eff +
              "%, focus " +
              ctx.dur(r.focus) +
              ", prayers " +
              r.pr +
              " of " +
              r.n * 5 +
              '</small></span><span class="mut">›</span></button>'
            );
          })
          .join("") +
        "</div>"
      : '<div class="box"><div class="pad mut">No reports yet. A report saves by itself when a week ends.</div></div>')
  );
}
