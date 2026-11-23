export function vNow(ctx) {
  if (ctx.rollover()) ctx.save();
  var T = ctx.times(),
    n = ctx.nowMin(),
    k = ctx.iso(new Date()),
    d = ctx.D(k),
    h = "",
    ni = -1,
    i,
    F = ctx.fgoal(k),
    fm = ctx.fsum(d),
    te = ctx.telapsed(ctx.TM);
  for (i = 0; i < 5; i++)
    if (T[i] > n) {
      ni = i;
      break;
    }
  h += ctx.odBanner();
  h += ctx.upBanner();
  if (ctx.areaOn("work")) h += ctx.workCard(k, n);
  var pl = (d.plan || []).map(function (x, j) {
    return { x: x, i: j, a: ctx.mins(x.t) };
  });
  ctx.SG = ctx.suggest(k, n);
  var nd = (ctx.S.dis[k] || []).length,
    ev = [],
    cur = null,
    pend = function (j) {
      return Math.min(j < 4 ? T[j + 1] : T[j] + 120, T[j] + 120);
    };
  if (ctx.areaOn("faith") && ctx.S.set.mods.faith)
    ctx.PN.forEach(function (nm, j) {
      var tt = 0,
        dn = 0;
      ctx.SUNN.forEach(function (u) {
        var c = ctx.S.set.sn[u.i];
        if (u.p === j && c > 0) {
          tt += c;
          if ((d.sn || [])[u.i]) dn += c;
        }
      });
      ev.push({
        g: "p",
        i: j,
        a: T[j],
        nm: nm,
        sn: tt ? "Sunnah " + dn + " of " + tt : "",
        dn: d.p[j],
      });
    });
  pl.forEach(function (o) {
    ev.push({
      g: "u",
      i: o.i,
      a: o.a,
      x: o.x.x,
      t: o.x.t,
      dn: o.x.d,
      f: o.x.f,
      lg: o.x.lg,
    });
  });
  (ctx.S.pins || []).forEach(function (q) {
    ev.push({
      g: "pn",
      i: q.id,
      a: ctx.mins(q.t),
      t: q.t,
      x: q.x,
      dn: (d.pd || {})[q.id],
    });
  });
  ctx.SG.slice(0, 4).forEach(function (g, j) {
    ev.push({ g: "s", i: j, a: ctx.mins(g.t), t: g.t, x: g.x, why: g.why });
  });
  if (ctx.wkOn(k))
    ev.push({
      g: "w",
      a: ctx.mins(ctx.S.set.job.a),
      b: ctx.mins(ctx.S.set.job.b),
      m: ctx.wkR(k).m,
    });
  ev.sort(function (a, b) {
    return a.a - b.a || (a.g === "s") - (b.g === "s");
  });
  ev.forEach(function (e) {
    if (cur || e.g === "s" || e.g === "w" || e.dn) return;
    if (
      e.g === "u" || e.g === "pn"
        ? e.a + 30 > n
        : e.a <= n
          ? n < pend(e.i)
          : true
    )
      cur = e;
  });
  ctx.heroSet(cur, n, pend, F, fm);
  var mk = '<div class="nowm"><span>Now ' + ctx.fmt(n) + "</span></div>",
    put = false,
    rows = ev
      .map(function (e) {
        var o = "";
        if (!put && e.a > n) {
          put = true;
          o += mk;
        }
        if (e.g === "w") {
          var wo = n >= e.a && n < e.b;
          return (
            o +
            '<div class="tli wb' +
            (wo ? " s-cur" : n >= e.b ? " s-past" : "") +
            '"><span class="tt">' +
            ctx.fmt(e.a) +
            '</span><span class="dt"><i class="wdot"></i></span><span class="tn" dir="auto">Work<small class="mut" style="display:block;font-weight:400">' +
            ctx.fmt(e.a) +
            "–" +
            ctx.fmt(e.b) +
            " · " +
            ctx.wMode(e.m) +
            "</small></span><span></span></div>"
          );
        }
        if (e.g === "p") {
          var pa = !e.dn && e.a < n;
          return (
            o +
            '<div class="tli pt ' +
            (e.dn ? "s-done" : pa ? "s-past" : "") +
            '"><span class="tt">' +
            ctx.fmt(e.a) +
            '</span><span class="dt"><button data-a="pr" data-i="' +
            e.i +
            '" aria-pressed="' +
            (e.dn ? "true" : "false") +
            '" aria-label="Mark ' +
            e.nm +
            ' prayed">' +
            (e.dn ? "✓" : "") +
            '</button></span><button class="tn" dir="auto" data-a="opfaith">' +
            e.nm +
            (e.sn
              ? '<small class="mut" style="display:block;font-weight:400">' +
                e.sn +
                "</small>"
              : "") +
            "</button><span></span></div>"
          );
        }
        if (e.g === "pn") {
          var dn = e.dn,
            cu = !dn && e.a <= n && n < e.a + 30,
            pp = !dn && e.a + 30 <= n;
          return (
            o +
            '<div class="tli pinned ' +
            (dn ? "s-done" : cu ? "s-cur" : pp ? "s-past" : "") +
            '"><span class="tt">' +
            e.t +
            '</span><span class="dt"><button data-a="pnt" data-i="' +
            e.i +
            '" aria-pressed="' +
            (dn ? "true" : "false") +
            '" aria-label="Toggle done">' +
            (dn ? "✓" : "") +
            '</button></span><button class="tn" dir="auto" data-a="pedit" data-i="' +
            e.i +
            '">' +
            ctx.esc(e.x) +
            '</button><button class="xd" data-a="pnx" data-i="' +
            e.i +
            '" aria-label="Unpin">×</button></div>'
          );
        }
        if (e.g === "u") {
          var dn = e.dn,
            cu = !dn && e.a <= n && n < e.a + 30,
            pp = !dn && e.a + 30 <= n;
          return (
            o +
            '<div class="tli ' +
            (dn ? "s-done" : cu ? "s-cur" : pp ? "s-past" : "") +
            '"><span class="tt">' +
            e.t +
            '</span><span class="dt"><button data-a="pl" data-i="' +
            e.i +
            '" aria-pressed="' +
            (dn ? "true" : "false") +
            '" aria-label="Toggle done">' +
            (dn ? "✓" : "") +
            '</button></span><button class="tn" dir="auto" data-a="edit" data-i="' +
            e.i +
            '">' +
            ctx.esc(e.x) +
            (e.f
              ? '<small class="mut" style="display:block;font-weight:400">From ' +
                ctx
                  .parse(e.f)
                  .toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }) +
                "</small>"
              : "") +
            (e.lg && e.lg.length && e.dn
              ? '<small class="lgd">Logged in Log ✓</small>'
              : "") +
            '</button><button class="xd" data-a="delpl" data-i="' +
            e.i +
            '" aria-label="Delete">×</button></div>'
          );
        }
        return (
          o +
          '<div class="tli gh"><span class="tt">' +
          e.t +
          '</span><span class="dt"><button data-a="sg" data-i="' +
          e.i +
          '" aria-label="Add to timeline">+</button></span><button class="tn" dir="auto" data-a="sgedit" data-i="' +
          e.i +
          '">' +
          ctx.esc(e.x) +
          '<small class="mut" style="display:block;font-weight:400">' +
          ctx.esc(e.why || "") +
          '</small></button><span class="acts-s"><button class="spb" data-a="spn" data-i="' +
          e.i +
          '" aria-label="Pin every day" title="Pin every day"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5M9 3h6l-1 6 3 3H7l3-3-1-6z"/></svg></button><button class="xd" data-a="sgx" data-i="' +
          e.i +
          '" aria-label="Hide suggestion">×</button></span></div>'
        );
      })
      .join("");
  if (!put) rows += mk;
  var tlo = ev.filter(function (e) {
      return e.g !== "w" && e.g !== "s" && !e.dn;
    }).length,
    tlb =
      '<div class="tl">' +
      rows +
      '</div><div class="add" style="justify-content:space-between"><button class="btn" data-a="addn">+ Add to timeline</button>' +
      (nd
        ? '<button class="btn alt" data-a="sgr">Restore ' +
          nd +
          " hidden</button>"
        : "") +
      "</div>";
  h += ctx.fdSec(
    "var(--ochre)",
    "tlt",
    ctx.TL_OPEN,
    "Today’s timeline",
    tlo + " open",
    tlb,
  );

  return h;
}
