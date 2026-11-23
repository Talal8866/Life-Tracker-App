export function vMoney(ctx) {
  var m = ctx.S.money,
    c = m.cur,
    ym = ctx.MM,
    s = ctx.mStats(ym),
    y = +ym.slice(0, 4),
    mo = +ym.slice(5, 7) - 1,
    dim = new Date(y, mo + 1, 0).getDate(),
    isNow = ym === ctx.iso(new Date()).slice(0, 7),
    dl = isNow ? dim - new Date().getDate() + 1 : dim,
    h = "",
    LB = { out: "Spent", in: "Income", sv: "To savings", wd: "From savings" };
  var f = function (n) {
    return ctx.mf(n) + " " + c;
  };
  var mn = new Date(y, mo, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  if (ctx.mBal() === null)
    h +=
      '<div class="add" style="justify-content:space-between;align-items:center"><button class="btn alt" data-a="mm" data-i="-1">Earlier</button><b>' +
      mn +
      '</b><button class="btn alt" data-a="mm" data-i="1">Later</button></div>';
  var left = s.bud === null ? null : Math.round((s.bud - s.o) * 100) / 100,
    sx = "",
    cls = "",
    big;
  if (s.bud === null) {
    big = "Not set";
    sx = "Log this month's income to set your budget";
  } else if (s.bud <= 0) {
    big = "−" + f(-s.bud);
    cls = " late";
    sx = "Income does not cover your save target";
  } else if (left >= 0) {
    big = ctx.mf(left) + " <small>" + ctx.esc(c) + " left</small>";
    sx =
      "of " +
      f(s.bud) +
      " budget" +
      (isNow && dl > 0 && left > 0
        ? " · about " + f(left / dl) + " a day for " + dl + " days"
        : "");
  } else {
    big = "−" + ctx.mf(-left) + " <small>" + ctx.esc(c) + " over</small>";
    cls = " late";
    sx = "Budget was " + f(s.bud);
  }
  var bar =
    s.bud > 0
      ? '<div class="bar"><i style="width:' +
        Math.min(100, Math.round((s.o / s.bud) * 100)) +
        '%"></i></div>'
      : "";
  h +=
    '<div class="box mny-bud" style="margin-top:12px"><div class="mny-bh"><span>Budget</span><span>' +
    (s.bud === null
      ? ""
      : "Income " + ctx.mf(s.i) + " − save " + ctx.mf(s.plan)) +
    '</span></div><div class="mny-bv' +
    cls +
    '">' +
    big +
    "</div>" +
    bar +
    '<small class="mut">' +
    ctx.esc(sx) +
    '</small><div class="mny-in mny-tg"><span class="mut" style="flex:1">Save target</span><input type="number" id="mtar" class="num" inputmode="decimal" min="0" value="' +
    (s.plan || "") +
    '" aria-label="Save target this month"><button class="btn alt" data-a="settgt">Set</button></div></div>';
  var nt = [];
  if (s.w) nt.push("took " + ctx.mf(s.w) + " out of savings");
  if (nt.length)
    h +=
      '<p class="note" style="margin-top:8px">' +
      ctx.esc(nt.join(", ")) +
      "</p>";
  h +=
    '<div class="kpi k4"><div><b>' +
    ctx.mf(s.i) +
    "</b><span>Income</span></div><div><b>" +
    ctx.mf(s.o) +
    "</b><span>Spent</span></div><div><b>" +
    ctx.mf(s.v) +
    '</b><span>Saved</span></div><div><b class="' +
    (s.free < 0 ? "late" : "") +
    '">' +
    ctx.mf(s.free) +
    "</b><span>Free</span></div></div>";
  if (s.free < 0)
    h +=
      '<div class="mny-warn"><div><b>Gap of ' +
      f(-s.free) +
      "</b><small>Spending went beyond income and savings you logged. If the money came from savings, log it as a Withdraw." +
      (s.i === 0 ? " No income is logged this month yet." : "") +
      '</small></div><button class="btn" data-a="fillgap" data-i="' +
      -s.free +
      '">Log as Withdraw</button></div>';
  var ck = Object.keys(s.cat).sort(function (a, b) {
    return s.cat[b] - s.cat[a];
  });
  if (ck.length)
    h += ctx.box(
      "Where it went",
      ck
        .map(function (n) {
          var p = s.spent ? Math.round((s.cat[n] / s.spent) * 100) : 0;
          return ctx.row(
            ctx.esc(n),
            p + "%",
            '<div style="flex:1;max-width:45%;margin-left:auto"><div class="bar" style="margin:0"><i style="width:' +
              p +
              '%"></i></div></div><b style="min-width:70px;text-align:right">' +
              ctx.mf(s.cat[n]) +
              "</b>",
          );
        })
        .join(""),
    );
  h += ctx.mAdd();
  var TL = { out: "Spent", in: "Income", sv: "To savings", wd: "From savings" },
    TS = { out: "−", in: "+", sv: "↓", wd: "↑" };
  var rec = m.log
    .map(function (e, i) {
      return { e: e, i: i };
    })
    .filter(function (o) {
      var k = o.e.k;
      return (
        o.e.d.slice(0, 7) === ym &&
        (ctx.MF === "all" ||
          (ctx.MF === "out" && k === "out") ||
          (ctx.MF === "in" && k === "in") ||
          (ctx.MF === "sv" && (k === "sv" || k === "wd")))
      );
    })
    .sort(function (a, b) {
      return a.e.d < b.e.d ? 1 : a.e.d > b.e.d ? -1 : b.i - a.i;
    });
  var net = {};
  rec.forEach(function (o) {
    var e = o.e,
      sg =
        e.k === "in" || e.k === "wd"
          ? 1
          : e.k === "out" || e.k === "sv"
            ? -1
            : 0;
    net[e.d] = (net[e.d] || 0) + sg * e.a;
  });
  var fl = [
    ["all", "All"],
    ["out", "Spent"],
    ["in", "Income"],
    ["sv", "Savings"],
  ];
  var list =
    '<div class="mny-filter" role="group" aria-label="Filter entries">' +
    fl
      .map(function (x) {
        return (
          '<button data-a="mfilter" data-i="' +
          x[0] +
          '" aria-pressed="' +
          (ctx.MF === x[0] ? "true" : "false") +
          '">' +
          x[1] +
          "</button>"
        );
      })
      .join("") +
    "</div>";
  var day = "";
  rec.slice(0, 80).forEach(function (o) {
    var e = o.e;
    if (e.d !== day) {
      day = e.d;
      var dn = net[e.d],
        dp = ctx.parse(e.d);
      list +=
        '<div class="mny-day"><span>' +
        dp.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }) +
        '</span><span class="' +
        (dn < 0 ? "late" : "ok") +
        '">' +
        (dn > 0 ? "+" : dn < 0 ? "−" : "") +
        ctx.mf(Math.abs(dn)) +
        "</span></div>";
    }
    list +=
      '<div class="mny-ent ' +
      e.k +
      '"><div class="mny-tx"><b>' +
      ctx.esc(e.n || (e.k === "out" ? e.c || "Spent" : TL[e.k])) +
      "</b><small>" +
      TL[e.k] +
      (e.k === "out" && e.c && e.n ? " · " + ctx.esc(e.c) : "") +
      '</small></div><div class="mny-am">' +
      TS[e.k] +
      " " +
      ctx.mf(e.a) +
      "</div>" +
      ctx.del("delm", o.i, "Delete") +
      "</div>";
  });
  if (!rec.length)
    list += '<p class="note">Nothing here for this month yet.</p>';
  h += '<h2>Entries</h2><div class="mny-list">' + list + "</div>";
  var bal = ctx.mBal();
  h += ctx.sbox(
    "Settings",
    ctx.row(
      "Currency",
      "",
      '<input type="text" id="mcur" class="num" value="' +
        ctx.esc(c) +
        '" maxlength="5" aria-label="Currency">',
    ) +
      ctx.row(
        "Savings goal",
        "Total you are aiming for",
        '<input type="number" id="mgoal" class="num" inputmode="decimal" value="' +
          (m.goal || "") +
          '" aria-label="Savings goal">',
      ) +
      (bal === null
        ? ""
        : ctx.row(
            "Savings balance",
            "Changing it restarts the count from now",
            '<input type="number" id="mbal" class="num" inputmode="decimal" value="' +
              bal +
              '" aria-label="Savings balance">',
          )) +
      '<div class="add"><button class="btn" data-a="setm">Save</button>' +
      (bal === null
        ? ""
        : '<button class="btn alt" data-a="setbal">Update balance</button>') +
      '<button class="btn alt" data-a="csv">Export CSV</button></div>',
  );
  return h;
}
