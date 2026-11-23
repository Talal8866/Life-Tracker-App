export function vLog(ctx) {
  var k = ctx.sel,
    h = "",
    pr = ctx.secProg(k),
    list = ctx.secList(k),
    pe = ctx.pcT(k, "e"),
    pw = ctx.pcT(k, "w");
  var lft = list.filter(function (id) {
    return pr[id][1] && pr[id][0] < pr[id][1] - 0.001;
  }).length;
  h += ctx.pcard({
    nav: ctx.dayNav(),
    k: k === ctx.iso(new Date()) ? "Today’s log" : ctx.arcDay(k),
    t: lft
      ? lft + (lft === 1 ? " section left" : " sections left")
      : "All sections done",
    s: "Wellbeing " + pw + "%",
    r: pe,
    rl: "Effort",
  });
  h += ctx.lgStrip(list, pr);
  h +=
    '<div class="lsum"><div class="wk">' +
    ctx
      .weekDays(ctx.sel)
      .map(function (x) {
        var q = ctx.openDay(x) ? 0 : ctx.pc(x),
          n = ctx.DN[ctx.parse(x).getDay()];
        return (
          '<button data-a="day" data-i="' +
          x +
          '" aria-pressed="' +
          (x === ctx.sel ? "true" : "false") +
          '" aria-label="' +
          n +
          ", " +
          q +
          ' percent"><span>' +
          n +
          '</span><i style="height:' +
          Math.max(3, Math.round(q * 0.22)) +
          'px"></i></button>'
        );
      })
      .join("") +
    "</div></div>";
  var gp = ctx.gapDays().filter(function (g) {
    return g[0] !== k;
  });
  if (gp.length === 1)
    h +=
      '<button class="lmini" data-a="day" data-i="' +
      gp[0][0] +
      '">' +
      (gp[0][0] === ctx.iso(new Date(Date.now() - 864e5)) &&
      gp[0][1] === "Not logged"
        ? "Yesterday isn’t logged. Open it"
        : ctx.gday(gp[0][0]) + ": " + gp[0][1].toLowerCase() + ". Open it") +
      "</button>";
  else if (gp.length > 1) {
    h +=
      '<button class="lmini" data-a="gaps" aria-pressed="' +
      (ctx.GAPS ? "true" : "false") +
      '">' +
      gp.length +
      " days need filling" +
      (ctx.GAPS ? " ▴" : " ▾") +
      "</button>";
    if (ctx.GAPS)
      h +=
        '<div class="box">' +
        gp
          .map(function (g) {
            return ctx.row(
              ctx.gday(g[0]),
              g[1],
              '<button class="btn alt" data-a="day" data-i="' +
                g[0] +
                '">Open</button>',
            );
          })
          .join("") +
        "</div>";
  }
  if (ctx.UNDO.length)
    h += '<button class="lmini" data-a="undo">Undo last change</button>';
  ctx.LGRP.forEach(function (g) {
    var ids = g[1].filter(function (id) {
      return list.indexOf(id) >= 0;
    });
    if (!ids.length) return;
    var h0 = h;
    h = "";
    ids.forEach(function (id) {
      var p = pr[id],
        q = p[1] ? Math.round((100 * p[0]) / p[1]) : 100,
        dn = q >= 100,
        left = Math.max(1, Math.ceil(p[1] - p[0] - 0.001));
      h +=
        '<section class="lsx' +
        (dn ? " done" : "") +
        '"><div class="lsh"><span class="ls-star">' +
        (dn
          ? ctx.star(100, 28, 0, "var(--basalt)", "none")
          : ctx.star(q, 28, 2.6)) +
        '</span><span class="ln"><b>' +
        ctx.SECN[id] +
        "</b><small>" +
        (dn ? "Done" : (id === "focus" ? ctx.dur(left) : left) + " left") +
        '</small></span></div><div class="lb">' +
        ctx.secBody(id, k).replace("<h2>" + ctx.SECN[id] + "</h2>", "") +
        "</div></section>";
    });
    var nl = ids.filter(function (id) {
      var p = pr[id],
        q = p[1] ? Math.round((100 * p[0]) / p[1]) : 100;
      return q < 100;
    }).length;
    h =
      h0 +
      ctx.lgg(
        "lg-" + g[0].toLowerCase().replace(/\W+/g, "-"),
        g[0],
        nl ? nl + " left" : "Done",
        h,
      );
  });
  return (
    h +
    (k === ctx.iso(new Date())
      ? '<button class="lmini" data-a="fin" aria-pressed="' +
        (ctx.openDay(k) ? "false" : "true") +
        '">' +
        (ctx.openDay(k) ? "Finish today" : "Today finished. Reopen") +
        "</button>"
      : "") +
    '<button class="lmini" data-a="ledit" aria-pressed="' +
    (ctx.LEDIT ? "true" : "false") +
    '">' +
    (ctx.LEDIT ? "Done editing" : "Edit inputs") +
    "</button>"
  );
}
