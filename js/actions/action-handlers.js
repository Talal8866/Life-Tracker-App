export function createActionHandlers(ctx) {
  function savePlanFields() {
    var p = ctx.currentPlan(), title = ctx.val("lp-title");
    if (!p || !title) {
      ctx.alertx("Enter a plan title", "", null);
      return false;
    }
    p.title = title.slice(0, 80);
    p.description = ctx.val("lp-description").slice(0, 500);
    p.level = ctx.val("lp-level").slice(0, 40) || "Beginner";
    p.dailyMinutes = Math.max(5, Math.min(240, parseInt(ctx.val("lp-minutes"), 10) || 30));
    p.phases.forEach(function (phase, index) {
      phase.title = (ctx.val("lp-phase-" + index) || phase.title || "Phase " + (index + 1)).slice(0, 80);
    });
    return true;
  }
  return {
    setupDone: function () {
      return ctx.finishSetup();
    },
    setupSkip: function () {
      return ctx.finishSetup();
    },
    fin: function () {
      var d = ctx.E(ctx.iso(new Date()));
      d.fin = d.fin ? 0 : 1;
    },
    pg: function (i) {
      ctx.pgNav(i);
    },
    pgopen: function () {
      var o = document.getElementById("pgo");
      if (o) o.classList.add("open");
      return false;
    },
    pgup: function (i) {
      ctx.pgMove(i, -1);
    },
    pgdn: function (i) {
      ctx.pgMove(i, 1);
    },
    pgedit: function () {
      ctx.PGED = !ctx.PGED;
      ctx.pgEdPaint();
    },
    pgx: function () {
      ctx.pgShut();
      return false;
    },
    pgstep: function (i) {
      var v = ctx.visiblePages();
      ctx.pgNav(v[(ctx.pgIdx() + +i + v.length) % v.length][0]);
    },
    tab: function (i) {
      if (i === "log" && ctx.tab !== "log") ctx.LAUTO = true;
      if (i !== ctx.tab) ctx.pushH();
      if (i === "more") ctx.sub = "home";
      ctx.tab = i;
      ctx.armed = false;
      window.scrollTo(0, 0);
    },
    sub: function (i) {
      if (i !== ctx.sub) ctx.pushH();
      ctx.sub = i;
      ctx.armed = false;
      window.scrollTo(0, 0);
    },
    pedit: function (i) {
      ctx.SH = { m: "p", i: i };
    },
    sgedit: function (i) {
      var s = ctx.SG[+i];
      if (!s) return false;
      ctx.SH = { m: "s", i: +i, key: s.key, t: s.t, x: s.x };
    },
    edit: function (i) {
      ctx.SH = { m: "e", i: +i };
    },
    addn: function () {
      ctx.SH = { m: "a" };
    },
    shx: function () {
      ctx.SH = null;
    },
    shsave: function () {
      var t = ctx.val("sht") || "09:00",
        x = ctx.val("shw");
      if (!x) return false;
      var f = ctx.shFind(),
        pe = document.getElementById("shpin"),
        isP = !!(pe && pe.checked);
      if (f) {
        var it = f.arr[f.i];
        if (isP === (ctx.SH.m === "p")) {
          it.t = t;
          it.x = x;
          delete it.s;
        } else {
          f.arr.splice(f.i, 1);
          ctx.shAdd(isP, t, x, it.k || it.sk);
        }
      } else {
        var dk = ctx.SH && ctx.SH.m === "a" ? ctx.val("shd") : "",
          tk = ctx.iso(new Date());
        if (/^\d{4}-\d{2}-\d{2}$/.test(dk) && dk !== tk) {
          if (dk < tk) ctx.E(dk).plan.push({ t: t, x: x, d: 1 });
          else {
            ctx.S.up = ctx.S.up || [];
            ctx.S.up.push({ k: dk, t: t, x: x });
            ctx.S.up.sort(function (a, b) {
              return a.k + a.t < b.k + b.t ? -1 : a.k + a.t > b.k + b.t ? 1 : 0;
            });
          }
        } else
          ctx.shAdd(isP, t, x, ctx.SH && ctx.SH.m === "s" ? ctx.SH.key : null);
      }
      ctx.SH = null;
    },
    shdel: function () {
      var f = ctx.shFind();
      if (f) f.arr.splice(f.i, 1);
      ctx.SH = null;
    },
    shp30: function () {
      var p = ctx.shItem();
      if (p && !p._s) {
        p.x = ctx.val("shw") || p.x;
        p.t = ctx.fmt(Math.min(1439, ctx.mins(ctx.val("sht") || p.t) + 30));
      }
    },
    theme: function (i) {
      ctx.S.ui = ctx.S.ui || {};
      ctx.S.ui.theme = i;
      ctx.applyTheme();
    },

    ledit: function () {
      ctx.LEDIT = !ctx.LEDIT;
      ctx.EDID = "";
    },
    undo: function () {
      var u = ctx.UNDO.pop();
      if (!u) return false;
      if (u[1] === "null") delete ctx.S.days[u[0]];
      else ctx.S.days[u[0]] = JSON.parse(u[1]);
      ctx.sel = u[0];
    },
    gaps: function () {
      ctx.GAPS = !ctx.GAPS;
    },
    ied: function (i) {
      ctx.EDID = ctx.EDID === i ? "" : i;
    },
    hide: function (i) {
      ctx.S.hide[i] = 1;
    },
    unhide: function (i) {
      delete ctx.S.hide[i];
    },
    cxadd: function (i) {
      var l = ctx.val("cxl-" + i);
      if (!l) return false;
      var g = parseFloat(ctx.val("cxg-" + i)) || 0,
        ck = document.getElementById("cxsc-" + i);
      ctx.S.born = ctx.S.born || {};
      var nid = "c" + Date.now().toString(36);
      ctx.S.born["cx" + nid] = ctx.iso(new Date());
      ctx.S.cx.push({
        id: nid,
        sec: i,
        l: l,
        k: ctx.val("cxk-" + i) || "y",
        tg: g > 0 ? g : 0,
        sc: ck && ck.checked ? 1 : 0,
      });
    },
    iesave: function (i) {
      var nm = ctx.val("ien");
      ctx.S.lbl = ctx.S.lbl || {};
      if (!ctx.NOREN[i]) {
        if (nm && nm !== ctx.regName(i)) ctx.S.lbl[i] = nm.slice(0, 40);
        else delete ctx.S.lbl[i];
      }
      if (i === "wake") {
        ctx.S.set.wku = ctx.val("iet");
        ctx.S.set.wkw = ctx.val("iet2");
      } else if (ctx.TK[i]) {
        var v = parseFloat(ctx.val("iet"));
        if (isNaN(v) || v < 0 || (ctx.TREQ[i] && v <= 0)) {
          ctx.alertx("Enter a valid target", "", null);
          return false;
        }
        ctx.S.set[ctx.TK[i]] = v;
      }
      if (i === "q") {
        ctx.S.set.qp = Math.max(0, parseInt(ctx.val("ieq"), 10) || 0);
      }
      ctx.EDID = "";
    },
    cxsave: function (i) {
      var c = (ctx.S.cx || []).filter(function (x) {
        return x.id === i;
      })[0];
      if (!c) return false;
      var nm = ctx.val("ien");
      if (!nm) {
        ctx.alertx("Enter a name", "", null);
        return false;
      }
      c.l = nm.slice(0, 40);
      if (c.k === "c" || c.k === "n") {
        var g = parseFloat(ctx.val("iet")) || 0;
        c.tg = g > 0 ? g : 0;
      }
      var ck = document.getElementById("iesc");
      c.sc = ck && ck.checked ? 1 : 0;
      ctx.EDID = "";
    },
    cxdel: function (i) {
      ctx.S.cx = ctx.S.cx.filter(function (c) {
        return c.id !== i;
      });
    },
    cxt: function (i, k) {
      var d = ctx.E(ctx.vd());
      d.cx = d.cx || {};
      d.cx[k] = d.cx[k] ? 0 : 1;
    },
    cxc: function (i, k) {
      var d = ctx.E(ctx.vd());
      d.cx = d.cx || {};
      d.cx[k] = Math.max(0, (+d.cx[k] || 0) + +i);
    },
    cxs: function (i, k) {
      var d = ctx.E(ctx.vd());
      d.cx = d.cx || {};
      d.cx[k] = d.cx[k] === +i ? 0 : +i;
    },
    aklist: function (i) {
      ctx.AKL = i;
    },
    akfs: function (i) {
      ctx.AKF = Math.max(18, Math.min(40, ctx.AKF + +i));
    },
    akc: function (i, k, t) {
      var d = ctx.E(ctx.iso(new Date())),
        L = ctx.ADK[k],
        a = (d.ak = d.ak || {}),
        c = (a[k] = a[k] || []),
        n = L[+i][2],
        st = +(t && t.dataset && t.dataset.s) || 1;
      c[+i] = Math.min(n, (c[+i] || 0) + st);
      if (
        L.every(function (x, j) {
          return (c[j] || 0) >= x[2];
        })
      )
        d.ad[k === "m" ? 0 : 1] = 1;
    },
    akr: function (i, k) {
      var d = ctx.E(ctx.iso(new Date())),
        a = (d.ak = d.ak || {}),
        c = (a[k] = a[k] || []);
      var L = ctx.ADK[k],
        was = L.every(function (x, j) {
          return (c[j] || 0) >= x[2];
        });
      c[+i] = 0;
      if (was) d.ad[k === "m" ? 0 : 1] = 0;
    },
    back: function () {
      var k = ctx.HS.pop();
      if (k) ctx.goto(k);
      ctx.armed = false;
      window.scrollTo(0, 0);
    },
    day: function (i) {
      ctx.sel = i;
    },
    tg: function (i, k) {
      var d = ctx.E(ctx.vd());
      d[k] = d[k] ? 0 : 1;
    },
    ctr: function (i, k) {
      var d = ctx.E(ctx.vd());
      d[k] = Math.max(0, (d[k] || 0) + +i);
    },
    sc: function (i, k) {
      var d = ctx.E(ctx.vd());
      d[k] = d[k] === +i ? 0 : +i;
    },
    pr: function (i) {
      var d = ctx.E(ctx.vd());
      d.p[+i] = d.p[+i] ? 0 : 1;
      if (d.p[+i]) ctx.SND = "p";
    },
    ad: function (i) {
      var d = ctx.E(ctx.vd());
      d.ad[+i] = d.ad[+i] ? 0 : 1;
    },
    nd: function (i) {
      var d = ctx.E(ctx.iso(new Date()));
      if (i === "m") {
        d.meds = 1;
        d.ex = 1;
      } else if (i[0] === "p" && i.length === 2) {
        d.p[+i[1]] = 1;
        ctx.SND = "p";
      } else if (i[0] === "u") {
        d.plan[+i.slice(1)].d = 1;
      }
    },
    fstart: function () {
      var t = ctx.TM;
      if (!t.on) {
        if (!t.x) t.x = ctx.topics()[0];
        t.on = 1;
        t.t0 = Date.now();
      }
    },
    fpause: function () {
      var t = ctx.TM;
      if (t.on) {
        t.acc += Date.now() - t.t0;
        t.on = 0;
      }
    },
    ffinish: function () {
      var t = ctx.TM,
        m = Math.round(ctx.telapsed(t) / 6e4);
      if (m >= 1) {
        var n = new Date(Date.now() + 108e5);
        ctx
          .E(ctx.iso(new Date()))
          .fs.push({
            t: ctx.z(n.getUTCHours()) + ":" + ctx.z(n.getUTCMinutes()),
            m: m,
            x: t.x || "Focus",
            w: ctx.S.learn.w,
            lp: ctx.S.learn.activePlanId,
          });
        ctx.SND = "w";
      }
      ctx.TM = { on: 0, t0: 0, acc: 0, x: t.x };
      ctx.NZ = 0;
    },
    delfs: function (i) {
      ctx.E(ctx.vd()).fs.splice(+i, 1);
    },
    addfs: function () {
      var m = +ctx.val("fsm");
      if (!(m > 0)) return false;
      ctx
        .E(ctx.vd())
        .fs.push({
          t: ctx.fmt(ctx.nowMin()),
          m: Math.round(m),
          x: ctx.val("fsx") || "Focus",
          w: ctx.S.learn.w,
          lp: ctx.S.learn.activePlanId,
        });
    },
    gstart: function () {
      if (!ctx.S.gt.on) {
        ctx.S.gt.on = 1;
        ctx.S.gt.t0 = Date.now();
      }
    },
    gstop: function () {
      var m = Math.round(ctx.telapsed(ctx.S.gt) / 6e4),
        k = ctx.iso(new Date());
      if (m >= 1) ctx.E(k).leis = (ctx.D(k).leis || 0) + m;
      ctx.S.gt = { on: 0, t0: 0, acc: 0 };
    },
    top: function (i) {
      var t = ctx.S.tops[ctx.iso(new Date())];
      if (t) t.x[+i] = t.x[+i] ? 0 : 1;
    },
    nq: function () {
      var tx = ctx.val("nqx");
      if (!tx) return false;
      ctx
        .E(ctx.iso(new Date()))
        .plan.push({ t: ctx.val("nqt") || "09:00", x: tx, d: 0 });
    },
    pl: function (i) {
      var d = ctx.E(ctx.iso(new Date())),
        p = d.plan[+i];
      if (p) {
        if (p.d) {
          p.d = 0;
          ctx.lgUndo(p, d);
        } else {
          p.d = 1;
          ctx.lgApply(p, d);
          if (p.s && p.k) ctx.adpAct("dn", p.k, ctx.iso(new Date()));
        }
      }
    },
    arct: function (i) {
      ctx.ARCT = i;
    },
    wtall: function () {
      ctx.WTALL = !ctx.WTALL;
    },
    pnt: function (i) {
      var d = ctx.E(ctx.iso(new Date()));
      d.pd = d.pd || {};
      d.pd[i] = d.pd[i] ? 0 : 1;
    },
    pnx: function (i) {
      ctx.S.pins = (ctx.S.pins || []).filter(function (q) {
        return String(q.id) !== String(i);
      });
    },
    delpl: function (i) {
      ctx.E(ctx.iso(new Date())).plan.splice(+i, 1);
    },
    sg: function (i) {
      var s = ctx.SG[+i];
      if (!s) return false;
      ctx
        .E(ctx.iso(new Date()))
        .plan.push({ t: s.t, x: s.x, d: 0, s: 1, k: s.key });
    },
    spn: function (i) {
      var s = ctx.SG[+i];
      if (!s) return false;
      ctx.S.pins = ctx.S.pins || [];
      if (
        !ctx.S.pins.some(function (q) {
          return q.sk === s.key;
        })
      )
        var id = Date.now();
      while (
        ctx.S.pins.some(function (q) {
          return q.id === id;
        })
      )
        id++;
      ctx.S.pins.push({ id: id, t: s.t, x: s.x, sk: s.key });
    },
    sgx: function (i) {
      var s = ctx.SG[+i];
      if (!s) return false;
      var k = ctx.iso(new Date());
      (ctx.S.dis[k] = ctx.S.dis[k] || []).push(s.key);
      ctx.adpAct("dx", s.key, k);
    },
    sgr: function () {
      ctx.S.dis[ctx.iso(new Date())] = [];
    },
    wkin: function (i, k) {
      var w = ctx.wkW(k || ctx.iso(new Date()));
      if (!w.i) w.i = ctx.fmt(ctx.nowMin());
      w.o = "";
    },
    wkout: function (i, k) {
      var w = ctx.wkW(k || ctx.iso(new Date()));
      if (!w.i) return false;
      w.o = ctx.fmt(ctx.nowMin());
    },
    wkm: function (i, k) {
      ctx.wkW(k || ctx.iso(new Date())).m = i;
    },
    wtadd: function () {
      var x = ctx.val("wtx") || ctx.val("wtq");
      if (!x) return false;
      var q = ctx.WT();
      q.t.push({
        id: q.seq++,
        x: x,
        due: ctx.val("wtd") || "",
        p: 0,
        cr: ctx.iso(new Date()),
        st: 0,
        dd: "",
      });
    },
    wtdn: function (i) {
      return ctx.wtToggle(i);
    },
    wtp: function (i) {
      var t = ctx.wtFind(i);
      if (t) t.p = t.p ? 0 : 1;
    },
    wtdel: function (i) {
      var q = ctx.WT();
      q.t = q.t.filter(function (x) {
        return x.id !== +i;
      });
    },
    wkgo: function (i) {
      ctx.sel = i;
      ctx.tab = "log";
      ctx.LGT = "lg-start";
      ctx.LAUTO = false;
      ctx.LSEC = "work";
      window.scrollTo(0, 0);
    },
    odn: function (i) {
      var o = (ctx.S.od || [])[+i];
      if (!o) return false;
      ctx.S.od.splice(+i, 1);
      var dd = ctx.E(ctx.iso(new Date())),
        it = {
          t: ctx.fmt(Math.floor(ctx.nowMin() / 5) * 5),
          x: o.x,
          d: 1,
          f: o.k,
        };
      dd.plan.push(it);
      ctx.lgApply(it, dd);
    },
    otd: function (i) {
      var o = (ctx.S.od || [])[+i];
      if (!o) return false;
      ctx.S.od.splice(+i, 1);
      ctx
        .E(ctx.iso(new Date()))
        .plan.push({ t: ctx.odT(0), x: o.x, d: 0, f: o.k });
    },
    otda: function () {
      var d = ctx.E(ctx.iso(new Date()));
      (ctx.S.od || []).forEach(function (o, j) {
        d.plan.push({ t: ctx.odT(j), x: o.x, d: 0, f: o.k });
      });
      ctx.S.od = [];
    },
    odx: function (i) {
      if (!(ctx.S.od || [])[+i]) return false;
      ctx.S.od.splice(+i, 1);
    },
    upt: function () {
      ctx.UP_OPEN = !ctx.UP_OPEN;
    },
    upx: function (i) {
      if (!(ctx.S.up || [])[+i]) return false;
      ctx.S.up.splice(+i, 1);
    },
    wkt: function () {
      ctx.WK_OPEN = !ctx.WK_OPEN;
    },
    tlt: function () {
      ctx.TL_OPEN = !ctx.TL_OPEN;
    },
    odt: function () {
      ctx.OD_OPEN = !ctx.OD_OPEN;
    },
    odm: function () {
      ctx.OD_ALL = !ctx.OD_ALL;
    },
    arm: function () {
      ctx.ARC_ALL = !ctx.ARC_ALL;
    },
    arr: function (i, k) {
      var d = ctx.S.days[k],
        p = d && d.plan[+i];
      if (!p) return false;
      p.d = 0;
      ctx.lgUndo(p, d);
    },
    lgtab: function (i) {
      ctx.LGT = ctx.LGT === i ? null : i;
    },
    lsec: function (i) {
      ctx.LSEC = i;
      ctx.LAUTO = false;
      if (i !== "over") setTimeout(ctx.lscroll, 30);
    },
    wnow: function () {
      var n = new Date();
      ctx.E(ctx.vd()).wake = ctx.z(n.getHours()) + ":" + ctx.z(n.getMinutes());
    },
    all5: function () {
      var d = ctx.E(ctx.vd());
      var allOn = d.p.every(function (x) {
        return x;
      });
      d.p = allOn ? [0, 0, 0, 0, 0] : [1, 1, 1, 1, 1];
      if (!allOn) ctx.SND = "p";
    },
    wset: function (i) {
      var d = ctx.E(ctx.vd());
      d.water = d.water === +i ? +i - 1 : +i;
    },
    ctrs: function (i, k) {
      var d = ctx.E(ctx.vd());
      d[k] = Math.min(
        ctx.LIM[k] || 1e9,
        Math.max(0, Math.round(((d[k] || 0) + +i) * 10) / 10),
      );
    },
    sn: function (i) {
      var d = ctx.E(ctx.vd());
      d.sn[+i] = d.sn[+i] ? 0 : 1;
      if (d.sn[+i]) ctx.SND = "p";
    },
    opfaith: function () {
      ctx.sel = ctx.iso(new Date());
      ctx.tab = "log";
      ctx.LGT = "lg-faith";
      ctx.LSEC = "faith";
      ctx.LAUTO = false;
      window.scrollTo(0, 0);
      setTimeout(ctx.lscroll, 30);
    },
    fq: function (i) {
      ctx
        .E(ctx.vd())
        .fs.push({
          t: ctx.fmt(ctx.nowMin()),
          m: +i,
          x: ctx.val("fsx") || "Focus",
          w: ctx.S.learn.w,
          lp: ctx.S.learn.activePlanId,
        });
      ctx.SND = "w";
    },
    dprev: function () {
      var d = ctx.parse(ctx.sel);
      d.setDate(d.getDate() - 1);
      ctx.sel = ctx.iso(d);
    },
    dnext: function () {
      var d = ctx.parse(ctx.sel);
      d.setDate(d.getDate() + 1);
      if (ctx.iso(d) <= ctx.iso(new Date())) ctx.sel = ctx.iso(d);
    },
    dtoday: function () {
      ctx.sel = ctx.iso(new Date());
    },
    wrtab: function (i) {
      ctx.WRT = ctx.WRT === i ? null : i;
    },
    wview: function (i) {
      ctx.WVIEW = i;
      window.scrollTo(0, 0);
    },
    wthis: function () {
      ctx.WS = ctx.iso(new Date());
    },
    oprep: function (i) {
      ctx.WS = i;
      ctx.WVIEW = "week";
      ctx.tab = "week";
      window.scrollTo(0, 0);
    },
    opday: function (i) {
      ctx.sel = i;
      ctx.tab = "log";
      ctx.LSEC = "over";
      window.scrollTo(0, 0);
    },
    rsave: function () {
      var ws = ctx.weekDays(ctx.WS)[0];
      ctx.S.reports[ws] = ctx.buildReport(ws);
    },
    rdl: function () {
      var ws = ctx.weekDays(ctx.WS)[0],
        cw = ctx.weekDays(ctx.iso(new Date()))[0],
        r = (ws < cw && ctx.S.reports[ws]) || ctx.buildReport(ws);
      ctx.dl("week-report-" + ws + ".md", ctx.reportMd(r));
      return false;
    },
    prn: function (i) {
      var d = ctx.E(ctx.iso(new Date()));
      d.p[+i] = 1;
      ctx.SND = "p";
    },
    wtr: function () {
      var d = ctx.E(ctx.iso(new Date()));
      d.water = (d.water || 0) + 1;
    },
    tx: function () {
      return false;
    },
    ntest: function () {
      ctx.alertx(
        "Test alert",
        "Alerts look like this. Tap Done to close.",
        { a: "tx", i: 0, l: "Done" },
        "w",
      );
      return false;
    },
    nperm: function () {
      var el = document.getElementById("ntst"),
        say = function (t) {
          if (el) el.textContent = t;
        };
      if (!window.Notification) {
        say(
          "This browser does not support phone notifications here. On-screen alerts still work while the page is open.",
        );
        return false;
      }
      Notification.requestPermission()
        .then(function (p) {
          say(
            p === "granted"
              ? "Phone notifications allowed. They work while this page is open."
              : "Not allowed. On-screen alerts still work.",
          );
        })
        .catch(function () {
          say("Could not ask for permission here.");
        });
      return false;
    },
    ics: function () {
      ctx.dl("timeline-" + ctx.iso(new Date()) + ".ics", ctx.icsToday());
      return false;
    },
    freset: function () {
      ctx.TM = { on: 0, t0: 0, acc: 0, x: ctx.TM.x };
      ctx.NZ = 0;
    },
    addpl: function () {
      var tx = ctx.val("plx");
      if (!tx) return false;
      ctx.E(ctx.sel).plan.push({ t: ctx.val("plt") || "09:00", x: tx, d: 0 });
    },
    tk: function (i) {
      ctx.S.tasks[+i].d = ctx.S.tasks[+i].d ? 0 : 1;
    },
    deltk: function (i) {
      ctx.S.tasks.splice(+i, 1);
    },
    addtk: function () {
      var tx = ctx.val("tkx");
      if (!tx) return false;
      ctx.S.tasks.push({ x: tx, d: 0 });
    },
    lt: function (i) {
      var entry = ctx.planWeeks()[ctx.S.learn.w];
      if (!entry) return false;
      entry.week.done[+i] = entry.week.done[+i] ? 0 : 1;
    },
    lw: function (i) {
      ctx.S.learn.w = Math.max(0, Math.min(ctx.planWeeks().length - 1, +i));
      var plan = ctx.currentPlan();
      if (plan) plan.currentWeek = ctx.S.learn.w;
      ctx.RC.show = false;
    },
    lpselect: function (i) {
      if (!ctx.S.learn.plans.some(function (p) { return p.id === i; })) return false;
      ctx.S.learn.activePlanId = i;
      var plan = ctx.currentPlan();
      ctx.S.learn.w = plan ? plan.currentWeek || 0 : 0;
      ctx.RC.show = false;
      ctx.LPMODE = "";
      ctx.LPWEDIT = "";
    },
    lpnew: function () {
      var p = ctx.createEmptyPlan("New learning plan");
      ctx.S.learn.plans.push(p);
      ctx.S.learn.activePlanId = p.id;
      ctx.S.learn.w = 0;
      ctx.LPMODE = "plan";
      ctx.LPWEDIT = "";
    },
    lpedit: function () { ctx.LPMODE = ctx.LPMODE === "plan" ? "" : "plan"; },
    lpcancel: function () { ctx.LPMODE = ""; ctx.LPWEDIT = ""; },
    lpsave: function () {
      return savePlanFields();
    },
    lpaddphase: function () {
      var p = ctx.currentPlan();
      if (!p || !savePlanFields()) return false;
      p.phases.push({ title: "New phase", weeks: [] });
      ctx.LPMODE = "plan";
    },
    lpphasedel: function (i) {
      var p = ctx.currentPlan(), phase = p && p.phases[+i];
      if (!phase || !window.confirm("Delete this phase and its weeks?")) return false;
      var firstWeek = p.phases.slice(0, +i).reduce(function (n, item) { return n + item.weeks.length; }, 0),
        removed = phase.weeks.length;
      p.phases.splice(+i, 1);
      ctx.LPWEDIT = "";
      if (ctx.S.learn.w >= firstWeek) ctx.S.learn.w = Math.max(firstWeek, ctx.S.learn.w - removed);
      ctx.S.learn.w = Math.min(ctx.S.learn.w, Math.max(0, ctx.planWeeks().length - 1));
      p.currentWeek = ctx.S.learn.w;
    },
    lpaddweek: function (i) {
      var p = ctx.currentPlan(), phase = p && p.phases[+i];
      if (!phase || !savePlanFields()) return false;
      phase.weeks.push(ctx.createWeek("Week " + (phase.weeks.length + 1)));
      ctx.S.learn.w = ctx.planWeeks().length - 1;
      p.currentWeek = ctx.S.learn.w;
      ctx.LPWEDIT = (+i) + ":" + (phase.weeks.length - 1);
      ctx.LPMODE = "plan";
    },
    lpweekedit: function (i) {
      var part = String(i).split(":"), p = ctx.currentPlan();
      if (!p || !p.phases[+part[0]] || !p.phases[+part[0]].weeks[+part[1]]) return false;
      ctx.S.learn.w = p.phases.slice(0, +part[0]).reduce(function (n, phase) { return n + phase.weeks.length; }, 0) + +part[1];
      p.currentWeek = ctx.S.learn.w;
      ctx.LPWEDIT = i;
      ctx.LPMODE = "plan";
    },
    lpweekcancel: function () { ctx.LPWEDIT = ""; },
    lpweeksave: function (i) {
      var part = String(i).split(":"), p = ctx.currentPlan(),
        week = p && p.phases[+part[0]] && p.phases[+part[0]].weeks[+part[1]];
      if (!week) return false;
      week.title = (ctx.val("lpw-title") || "New week").slice(0, 100);
      week.learn = ctx.val("lpw-learn").slice(0, 500);
      week.practice = ctx.val("lpw-practice").slice(0, 500);
      week.ship = ctx.val("lpw-ship").slice(0, 500);
      week.resource = { title: ctx.val("lpw-resource").slice(0, 120), url: ctx.val("lpw-url").slice(0, 500) };
      ctx.LPWEDIT = "";
    },
    lpweekdel: function (i) {
      var part = String(i).split(":"), p = ctx.currentPlan(),
        phase = p && p.phases[+part[0]],
        flatIndex = p ? p.phases.slice(0, +part[0]).reduce(function (n, item) { return n + item.weeks.length; }, 0) + +part[1] : -1;
      if (!phase || !phase.weeks[+part[1]] || !window.confirm("Delete this week and its progress?")) return false;
      phase.weeks.splice(+part[1], 1);
      ctx.LPWEDIT = "";
      if (flatIndex < ctx.S.learn.w) ctx.S.learn.w--;
      ctx.S.learn.w = Math.min(ctx.S.learn.w, Math.max(0, ctx.planWeeks().length - 1));
      p.currentWeek = ctx.S.learn.w;
      p.currentWeek = ctx.S.learn.w;
    },
    lpdelete: function () {
      var L = ctx.S.learn, p = ctx.currentPlan();
      if (!p || L.plans.length < 2 || !window.confirm("Delete this learning plan and its progress?")) return false;
      L.plans = L.plans.filter(function (plan) { return plan.id !== p.id; });
      L.activePlanId = L.plans[0].id;
      L.w = 0;
      ctx.LPMODE = "";
      ctx.LPWEDIT = "";
    },
    lrtab: function (i) {
      ctx.LRT = i;
    },
    lmv: function (i) {
      ctx.S.learn.w = Math.max(0, Math.min(ctx.planWeeks().length - 1, ctx.S.learn.w + +i));
      var plan = ctx.currentPlan();
      if (plan) plan.currentWeek = ctx.S.learn.w;
    },
    lfocus: function () {
      ctx.TM.x = ctx.topics()[0];
      setTimeout(function () {
        var e = document.getElementById("ftime");
        if (e) e.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 80);
    },
    rcshow: function () {
      ctx.RC.show = true;
    },
    rcgot: function () {
      return ctx.ansRc(true);
    },
    rcmiss: function () {
      return ctx.ansRc(false);
    },
    gd: function (i) {
      var w = ctx.W();
      w.gd[+i] = w.gd[+i] ? 0 : 1;
    },
    wnav: function (i) {
      var d = ctx.parse(ctx.WS);
      d.setDate(d.getDate() + +i);
      ctx.WS = ctx.iso(d);
    },
    mm: function (i) {
      ctx.MM = ctx
        .iso(new Date(+ctx.MM.slice(0, 4), +ctx.MM.slice(5, 7) - 1 + +i, 1))
        .slice(0, 7);
    },
    mkind: function (i) {
      ctx.keepDR();
      ctx.MK = i;
    },
    mcat: function (i) {
      ctx.keepDR();
      ctx.MCAT = i;
    },
    settgt: function () {
      var v = parseFloat(ctx.val("mtar"));
      if (isNaN(v) || v < 0) {
        ctx.alertx("Enter the save target", "", null);
        return false;
      }
      ctx.S.money.tgm[ctx.MM] = Math.round(v * 100) / 100;
    },
    setbal: function () {
      var v = parseFloat(ctx.val("mbal"));
      if (isNaN(v) || v < 0) {
        ctx.alertx("Enter your savings amount", "", null);
        return false;
      }
      ctx.S.money.anc = { a: Math.round(v * 100) / 100, at: Date.now() };
    },
    addm: function () {
      var a = parseFloat(ctx.val("mamt"));
      if (!(a > 0)) {
        ctx.alertx("Enter an amount", "", null);
        return false;
      }
      var d = ctx.val("mdate") || ctx.defD();
      if (d > ctx.iso(new Date())) d = ctx.iso(new Date());
      ctx.S.money.log.push({
        d: d,
        k: ctx.MK,
        a: Math.round(a * 100) / 100,
        c: ctx.MK === "out" ? ctx.MCAT : "",
        n: ctx.val("mnote"),
        t: Date.now(),
      });
      ctx.DR = { a: "", n: "", d: "" };
    },
    mfilter: function (i) {
      ctx.MF = i;
    },
    fillgap: function (i) {
      ctx.DR = { a: String(Math.abs(+i)), n: "", d: "" };
      ctx.MK = "wd";
    },
    delm: function (i) {
      ctx.S.money.log.splice(+i, 1);
    },
    setm: function () {
      var m = ctx.S.money;
      m.cur = ctx.val("mcur") || "USD";
      m.goal = parseFloat(ctx.val("mgoal")) || 0;
    },
    csv: function () {
      ctx.dl(
        "money.csv",
        "date,type,category,amount,note\n" +
          ctx.S.money.log
            .map(function (e) {
              return [
                e.d,
                e.k,
                e.c || "",
                e.a,
                '"' + String(e.n || "").replace(/"/g, '""') + '"',
              ].join(",");
            })
            .join("\n"),
      );
      return false;
    },

    sets: function () {
      (ctx.S.cx || []).forEach(function (c) {
        var e = document.getElementById("cxt-" + c.id);
        if (e) c.tg = Math.max(0, parseFloat(e.value) || 0);
      });
      var q = function (id) {
          return document.getElementById(id);
        },
        n = function (id, d) {
          return +ctx.val(id) || d;
        },
        o0 = ctx.S.set,
        fe = function (id, key, d, zr, r) {
          var e = q(id);
          if (!e) return o0[key];
          var v = +e.value || 0;
          if (r) v = Math.round(v);
          return zr ? Math.max(0, v) : v || d;
        };
      ctx.S.set = {
        water: fe("swa", "water", 8),
        sleep: fe("ssl", "sleep", 7),
        phone: fe("sph", "phone", 180),
        games: fe("sgm", "games", 90),
        focus: fe("sfc", "focus", 300),
        wm: fe("swm", "wm", 0, 1),
        qm: fe("sqm", "qm", 0, 1),
        qp: fe("sqp", "qp", 0, 1, 1),
        bn: fe("sbn", "bn", 0, 1, 1),
        pn: fe("spn", "pn", 0, 1, 1),
        wku: ctx.val("swk"),
        wkw: ctx.val("swkw"),
        rest: +ctx.val("srs"),
        snd: q("snd").checked ? 1 : 0,
        mods: {
          faith: q("mf").checked ? 1 : 0,
          digital: q("md").checked ? 1 : 0,
        },
        po: ["pf", "pd", "pa", "pm", "pi"].map(function (id) {
          return +ctx.val(id) || 0;
        }),
        job: {
          on: q("jon").checked ? 1 : 0,
          days: [0, 1, 2, 3, 4, 5, 6].filter(function (i) {
            return q("jd" + i).checked;
          }),
          a: ctx.val("jsa") || "08:30",
          b: ctx.val("jsb") || "16:00",
          c: +ctx.val("jsc") || 0,
          from: ctx.val("jfr") || "2026-11-01",
          jf: n("jfo", 120),
        },
        nt: {
          on: q("nton").checked ? 1 : 0,
          pl: q("ntpl")
            ? q("ntpl").checked
              ? 1
              : 0
            : (ctx.S.set.nt || {}).pl || 0,
          prayer: q("ntp").checked ? 1 : 0,
          focus: q("ntf").checked ? 1 : 0,
          evening: q("nte").checked ? 1 : 0,
          water: q("ntw")
            ? q("ntw").checked
              ? 1
              : 0
            : (ctx.S.set.nt || {}).water || 0,
          lead: +ctx.val("ntl") || 0,
        },
        sn: [0, 1, 2, 3, 4, 5, 6].map(function (i) {
          var e = document.getElementById("sn" + i),
            v = e ? e.value : "";
          return v === "" ? ctx.DS.sn[i] : Math.max(0, parseInt(v, 10) || 0);
        }),
      };
    },
    ca: function (i) {
      ctx.CERR = "";
      ctx
        .connAdd(i)
        .then(function (u) {
          ctx.LINK[i] = u;
          if (!u) ctx.CERR = "No sign-in link came back. Try again.";
          ctx.render();
        })
        .catch(function (er) {
          ctx.CERR = ctx.cerr(er);
          ctx.render();
        });
      return false;
    },
    cc: function (i) {
      ctx.checkConn(i);
      return false;
    },
    rf: function () {
      ctx.refreshExt();
      return false;
    },
    tsnd: function () {
      ctx.testSound();
      return false;
    },
    bk: function () {
      ctx.dl("tracker-backup.json", JSON.stringify(ctx.S));
      return false;
    },
    acin: function () {
      ctx.acGo(false);
      return false;
    },
    acup: function () {
      ctx.acGo(true);
      return false;
    },
    acrs: function () {
      ctx.acReset();
      return false;
    },
    acout: function () {
      ctx.pgClose();
      ctx.signOutLocal("");
      return false;
    },
    acsync: function () {
      ctx.syncNow();
      return false;
    },
    agin: function () {
      ctx.pgClose();
      ctx.agOpen("in");
      return false;
    },
    agup: function () {
      ctx.pgClose();
      ctx.agOpen("up");
      return false;
    },
    agsw: function (i) {
      ctx.agOpen(i, true);
      return false;
    },
    agskip: function () {
      ctx.agSkip();
      return false;
    },
    agpw: function () {
      ctx.agPw();
      return false;
    },
    reset: function () {
      if (ctx.armed) {
        ctx.S = ctx.fix({});
        ctx.armed = false;
        ctx.save();
      } else ctx.armed = true;
    },
  };
}
