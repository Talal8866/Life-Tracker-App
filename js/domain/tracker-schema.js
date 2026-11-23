/** Default daily record and state migration rules. */
export function createTrackerSchema({ defaults, iso, seedWorkTasks }) {
  const DS = defaults;
  function blank() {
    return {
      wake: "",
      meds: 0,
      ex: 0,
      pt: 0,
      p: [0, 0, 0, 0, 0],
      fs: [],
      water: 0,
      sp: 0,
      spm: 0,
      br: 0,
      sleep: 0,
      mood: 0,
      nv: 0,
      pain: 0,
      jn: "",
      phone: 0,
      leis: 0,
      pz: 0,
      q: 0,
      qp: 0,
      bed: "",
      ad: [0, 0],
      plan: [],
      jm: 0,
      rc: 0,
      sn: [0, 0, 0, 0, 0, 0, 0],
    };
  }
  function fix(o) {
    o = o || {};
    var hj = !!(o.set && o.set.job && o.set.job.days);
    o.days = o.days || {};
    o.set = Object.assign({}, DS, o.set || {});
    o.set.mods = Object.assign({}, DS.mods, o.set.mods || {});
    delete o.set.mods.control;
    Object.keys(o.days).forEach(function (k) {
      if (o.days[k]) delete o.days[k].uc;
    });
    o.set.po = o.set.po || [0, 0, 0, 0, 0];
    o.set.sn = o.set.sn && o.set.sn.length === 7 ? o.set.sn : DS.sn.slice();
    if (!hj) {
      o.set.job = JSON.parse(JSON.stringify(DS.job));
      if (!o.set.rest) o.set.rest = 5;
    } else o.set.job = Object.assign({}, DS.job, o.set.job);
    o.wt = o.wt || { t: [], seq: 1, seed: 0 };
    if (!o.wt.seed) {
      o.wt.seed = 1;
      seedWorkTasks().forEach(function (x) {
        o.wt.t.push({
          id: o.wt.seq++,
          x: x[0],
          due: x[1],
          p: x[2],
          cr: iso(new Date()),
          st: 0,
          dd: "",
        });
      });
    }
    o.tasks = o.tasks || [];
    o.weeks = o.weeks || {};
    o.conn = o.conn || {};
    o.tops = o.tops || {};
    o.money = Object.assign(
      { cur: "USD", budget: 0, target: 0, goal: 0, anc: null, log: [] },
      o.money || {},
    );
    o.money.log = o.money.log || [];
    delete o.money.fx;
    o.money.tgm = o.money.tgm || {};
    if (o.money.target > 0 && !Object.keys(o.money.tgm).length)
      o.money.tgm["0000-00"] = o.money.target;
    o.learn = Object.assign({ w: 0, d: {}, n: {}, sr: {} }, o.learn || {});
    o.learn.sr = o.learn.sr || {};
    o.learn.n = o.learn.n || {};
    o.learn.d = o.learn.d || {};
    delete o.timer;
    delete o.gt;
    o.dis = o.dis || {};
    o.adp = o.adp || {};
    o.hide = o.hide || {};
    o.lbl = o.lbl || {};
    o.born = o.born || {};
    o.cx = o.cx || [];
    if (!o.mg2) {
      o.mg2 = 1;
      var fd = function (f) {
        var r = iso(new Date());
        Object.keys(o.days)
          .sort()
          .some(function (k) {
            if (f(o.days[k])) {
              r = k;
              return true;
            }
          });
        return r;
      };
      if (!o.born.bed)
        o.born.bed = fd(function (d) {
          return d.bed;
        });
      if (
        o.cx.some(function (c) {
          return c.id === "cfam";
        }) &&
        !o.born.cxcfam
      )
        o.born.cxcfam = fd(function (d) {
          return d.cx && d.cx.cfam;
        });
    }
    if (!o.mg1) {
      o.mg1 = 1;
      o.hide.games = 1;
      if (
        !o.cx.some(function (c) {
          return c.id === "cfam";
        })
      )
        o.cx.push({
          id: "cfam",
          sec: "mind",
          l: "Family time",
          k: "y",
          tg: 0,
          sc: 1,
        });
    }
    o.ui = o.ui || {};
    o.od = o.od || [];
    o.reports = o.reports || {};
    Object.keys(o.reports).forEach(function (w) {
      var r = o.reports[w];
      if (r) {
        delete r.uc;
        if (r.rec) delete r.rec.uc;
        if (Array.isArray(r.rk))
          r.rk = r.rk.filter(function (x) {
            return !(x && x[0] === "uc");
          });
      }
    });
    o.set.nt = Object.assign({}, DS.nt, o.set.nt || {});
    o.start = o.start || iso(new Date());
    delete o.chores;
    delete o.top;
    delete o.trig;
    [o.hide, o.lbl, o.born, o.dis, o.adp, o.tops].forEach(function (x) {
      if (x) delete x.uc;
    });
    return o;
  }

  return { blank, fix };
}
