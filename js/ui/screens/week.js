export function vWeek(ctx) {
  if (ctx.WVIEW === "reports") return ctx.vReports();
  var td = ctx.iso(new Date()),
    cw = ctx.weekDays(td)[0],
    ws = ctx.weekDays(ctx.WS)[0],
    pd = ctx.parse(ws);
  pd.setDate(pd.getDate() - 7);
  var pw = ctx.iso(pd),
    saved = ctx.S.reports[ws],
    r = ws < cw && saved ? saved : ctx.buildReport(ws),
    pv = ctx.S.reports[pw] || ctx.buildReport(pw),
    h = "",
    chip =
      ws === cw
        ? "In progress"
        : saved
          ? "Report saved"
          : r.has
            ? "Not saved yet"
            : "No data";

  if (!r.has)
    return (
      h +
      ctx.pcard({
        nav: ctx.wkNav(ws, cw, chip, saved && ws < cw),
        k: "This week",
        t: "Nothing logged",
        s: "Nothing was logged this week.",
      }) +
      '<div class="add"><button class="btn alt" data-a="wview" data-i="reports">All reports</button></div>'
    );
  var pe = pv.has ? pv : null,
    R = r.rec || ctx.weekRec(ws),
    cur = ws === cw,
    wbx =
      r.wel !== null
        ? '<div class="pc-wb"><div><span>Wellbeing</span><span><b>' +
          r.wel +
          "%</b>" +
          (pe && pe.wel != null && Math.round(r.wel - pe.wel) !== 0
            ? "<em>" +
              (r.wel > pe.wel ? "+" : "−") +
              Math.abs(Math.round(r.wel - pe.wel)) +
              " vs last week</em>"
            : "") +
          '</span></div><i><u style="width:' +
          r.wel +
          '%"></u></i></div>'
        : "";
  h += ctx
    .pcard({
      nav: ctx.wkNav(ws, cw, chip, saved && ws < cw),
      k: "This week · " + chip,
      t: ctx.esc(r.head),
      s: cur
        ? "Day " +
          r.days.filter(function (x) {
            return !x.fut;
          }).length +
          " of 7 · " +
          r.days.filter(function (x) {
            return x.fut;
          }).length +
          " left"
        : "",
      r: r.n ? r.eff : null,
      rl: "Effort",
    })
    .replace(/<\/section>$/, wbx + "</section>");
  var bd = r.best
      ? ctx
          .parse(r.best)
          .toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "short",
          })
      : "",
    hd = r.hard
      ? ctx
          .parse(r.hard)
          .toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "short",
          })
      : "",
    dg = "";
  if (r.hard) {
    var ws2 = ctx
      .items(r.hard)
      .filter(function (x) {
        return !x.bonus && x.v < 0.6;
      })
      .sort(function (p, q) {
        return p.v - q.v;
      })
      .slice(0, 3)
      .map(function (x) {
        return ctx.idName(x.id);
      });
    if (ws2.length)
      dg =
        '<p class="wk-drag"><b>' +
        ctx.parse(r.hard).toLocaleDateString("en-GB", { weekday: "long" }) +
        " dragged by:</b> " +
        ws2.join(", ") +
        "</p>";
  }
  h += ctx.box(
    "Week",
    '<div class="cols">' +
      r.days
        .map(function (x) {
          return (
            '<button class="col' +
            (x.fut ? " fut" : x.k === td ? " cur" : "") +
            (x.mn ? " mn" : "") +
            '" data-a="opday" data-i="' +
            x.k +
            '"' +
            (x.fut ? " disabled" : "") +
            ' aria-label="Open ' +
            x.k +
            '"><small>' +
            (x.fut || !x.has ? "" : x.opn ? "open" : x.mn ? "min" : x.sc) +
            '</small><i style="height:' +
            (x.fut || x.opn || !x.has
              ? 4
              : Math.max(4, Math.round(x.sc * 0.8))) +
            "px;" +
            (x.sc >= 80 ? "background:var(--ok)" : "") +
            '"></i><span>' +
            ctx.DN[ctx.parse(x.k).getDay()] +
            "</span></button>"
          );
        })
        .join("") +
      "</div>" +
      (bd
        ? '<p class="sx-v">Best day: ' +
          bd +
          (hd ? ". Hardest: " + hd : "") +
          ".</p>"
        : "") +
      dg,
    r.solid + " of " + r.n + " solid days",
  );
  var H = [
    [
      "sleep at target",
      function (d) {
        return d.sleep >= ctx.S.set.sleep;
      },
    ],
    [
      "a home workout",
      function (d) {
        return d.sp;
      },
    ],
    [
      "breathing",
      function (d) {
        return d.br >= 1;
      },
    ],
    [
      "the water goal",
      function (d) {
        return d.water >= ctx.S.set.water;
      },
    ],
    [
      "journaling",
      function (d) {
        return (d.jn || "").trim();
      },
    ],
    [
      "phone under the limit",
      function (d) {
        return d.phone > 0 && d.phone <= ctx.S.set.phone;
      },
    ],
    [
      "Quran reading",
      function (d) {
        return d.q > 0 || d.qp > 0;
      },
    ],
    [
      "all 5 prayers",
      function (d) {
        return d.p.every(function (x) {
          return x;
        });
      },
    ],
    [
      "full focus time",
      function (d, k) {
        return ctx.fsum(d) >= ctx.fgoal(k);
      },
    ],
  ];
  H = H.filter(function (x) {
    var m = {
      "sleep at target": "sleep",
      "a home workout": "sp",
      breathing: "br",
      "phone under the limit": "phone",
      "Quran reading": "q",
      journaling: "jn",
    };
    return !(m[x[0]] && ctx.S.hide[m[x[0]]]);
  });
  (ctx.S.cx || []).forEach(function (c) {
    if (c.k !== "s")
      H.push([
        c.l,
        function (d) {
          var v = +(d.cx && d.cx[c.id]) || 0;
          return c.k === "y" ? v > 0 : c.tg > 0 ? v >= c.tg : v > 0;
        },
      ]);
  });
  var dd = Object.keys(ctx.S.days)
      .filter(function (k) {
        return !ctx.openDay(k) && ctx.wb(ctx.S.days[k]) !== null;
      })
      .map(function (k) {
        return { d: ctx.S.days[k], k: k };
      }),
    rows = [],
    mn = function (a) {
      return (
        a.reduce(function (p, q) {
          return p + q;
        }, 0) / a.length
      );
    };
  H.forEach(function (x) {
    var a = [],
      b = [];
    dd.forEach(function (o) {
      (x[1](o.d, o.k) ? a : b).push(ctx.wb(o.d));
    });
    if (a.length >= 3 && b.length >= 3)
      rows.push({ n: x[0], df: mn(a) - mn(b), a: mn(a), b: mn(b) });
  });
  rows.sort(function (p, q) {
    return Math.abs(q.df) - Math.abs(p.df);
  });
  var wbH =
    "<h2>Wellbeing patterns</h2>" +
    (rows.length
      ? '<div class="box">' +
        rows
          .slice(0, 3)
          .map(function (x) {
            return ctx.row(
              "With " +
                x.n +
                ": " +
                Math.round(x.a * 100) +
                "% vs " +
                Math.round(x.b * 100) +
                "% without",
              (x.df >= 0 ? "Higher" : "Lower") +
                " by " +
                Math.round(Math.abs(x.df) * 100) +
                " points. A pattern, not proof.",
            );
          })
          .join("") +
        "</div>"
      : '<div class="box"><div class="pad mut">Needs 3 or more days both with and without a habit. You have ' +
        dd.length +
        " check-in days.</div></div>");
  var wrk = ctx.wkWeekRows(ws),
    wbH =
      "<h2>Patterns</h2>" +
      (rows.length
        ? '<div class="box">' +
          rows
            .slice(0, 3)
            .map(function (x) {
              return ctx.row(
                "With " +
                  x.n +
                  ": " +
                  Math.round(x.a * 100) +
                  "% vs " +
                  Math.round(x.b * 100) +
                  "% without",
                (x.df >= 0 ? "Higher" : "Lower") +
                  " by " +
                  Math.round(Math.abs(x.df) * 100) +
                  " points. A pattern, not proof.",
              );
            })
            .join("") +
          "</div>"
        : '<div class="box"><div class="pad mut">Needs 3 or more days both with and without a habit. You have ' +
          dd.length +
          " check-in days.</div></div>");
  h += ctx.secPil(r, pe, R, ws, td);
  if (wrk)
    h +=
      '<div class="lgbody" style="margin-top:14px">' +
      ctx.secWork(ws) +
      (cur && ctx.S.od && ctx.S.od.length
        ? '<p class="wk-drag">Overdue carried over: ' + ctx.S.od.length + "</p>"
        : "") +
      "</div>";
  h += ctx.secNxt(r, R) + wbH;
  h +=
    '<div class="add sx-foot"><button class="btn" data-a="rsave">' +
    (saved ? "Regenerate report" : "Save report now") +
    '</button><button class="btn alt" data-a="rdl">Download report</button><button class="btn alt" data-a="wview" data-i="reports">All reports</button></div>';
  return h;
}
