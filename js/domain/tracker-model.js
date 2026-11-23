/** Tracker schema, scoring rules, day metrics, and weekly report calculations. */
export function createTrackerModel({
  getState,
  getUndo,
  blank,
  parse,
  iso,
  fmt,
  mins,
  PN,
  SUNN,
  SW,
  DN,
  areaOn,
  sectionOn,
  wkOn,
  wkV,
  cxF,
}) {
  function D(k) {
    return getState().days[k] || blank();
  }
  function E(k) {
    var d = getState().days[k];
    if (!d) d = getState().days[k] = blank();
    d.fs = d.fs || [];
    d.plan = d.plan || [];
    d.ad = d.ad || [0, 0];
    d.p = d.p || [0, 0, 0, 0, 0];
    d.sn = d.sn || [0, 0, 0, 0, 0, 0, 0];
    return d;
  }
  function fsum(d) {
    var m = 0;
    (d.fs || []).forEach(function (x) {
      m += x.m || 0;
    });
    if (!d.fs && d.w) m += ((d.w[0] || 0) + (d.w[1] || 0)) * 150;
    return m;
  }
  function isRest(k) {
    return parse(k).getDay() === getState().set.rest;
  }
  function jobDay(k) {
    var j = getState().set.job;
    return !!(
      j &&
      j.on &&
      k >= j.from &&
      j.days.indexOf(parse(k).getDay()) >= 0
    );
  }
  function fgoal(k) {
    return wkOn(k) ? +getState().set.job.jf || 120 : getState().set.focus;
  }
  function target(k) {
    if (getState().set.wkw && wkOn(k)) return mins(getState().set.wkw);
    if (getState().set.wku && !wkOn(k)) return mins(getState().set.wku);
    var j = getState().set.job,
      n = Math.round((parse(k) - parse(getState().start)) / 864e5);
    if (!(j && j.on)) {
      var st = Math.max(0, Math.floor(n / 4));
      return Math.max(480, 630 - 30 * st);
    }
    var goal = Math.max(300, mins(j.a) - (+j.c || 0) - 60),
      span = Math.round((parse(j.from) - parse(getState().start)) / 864e5);
    if (k >= j.from || span <= 0) return goal;
    return Math.max(
      goal,
      Math.round((630 + ((goal - 630) * Math.max(0, n)) / span) / 5) * 5,
    );
  }
  function qProg(d) {
    var s = getState().set,
      a = [];
    if (s.qm > 0) a.push((d.q || 0) / s.qm);
    if (s.qp > 0) a.push((d.qp || 0) / s.qp);
    if (!a.length) return d.q > 0 || d.qp > 0 ? 1 : 0;
    return Math.max.apply(null, a);
  }
  function qLab(d) {
    var s = getState().set,
      p = [];
    if (s.qm > 0 || !(s.qp > 0))
      p.push((d.q || 0) + (s.qm > 0 ? " of " + s.qm : "") + " min");
    if (s.qp > 0) p.push((d.qp || 0) + " of " + s.qp + " pages");
    return "Quran " + p.join(", ");
  }
  function bedT(k) {
    return (
      (((target(k) - Math.round(getState().set.sleep * 60)) % 1440) + 1440) %
      1440
    );
  }
  function bedLate(d, k) {
    var n = function (x) {
      return x < 720 ? x + 1440 : x;
    };
    return d.bed ? Math.max(0, n(mins(d.bed)) - n(bedT(k))) : 0;
  }
  function wakeOK(d, k) {
    return !!d.wake && mins(d.wake) <= target(k);
  }
  function ctx(k) {
    var d = D(k),
      s = getState().set,
      tg = target(k);
    return {
      k: k,
      d: d,
      s: s,
      m: s.mods,
      F: fgoal(k),
      ad: d.ad || [0, 0],
      fm: fsum(d),
      sn: d.sn || [],
      tg: tg,
      late: d.wake ? Math.max(0, mins(d.wake) - tg) : 0,
      rest: isRest(k),
      fri: parse(k).getDay() === 5,
      job: wkOn(k),
    };
  }
  /* One table drives the score (v, w), the section progress (pg) and the edit list (reg). id, sec, w=weight, t=e|w, b=bonus, h=hideable in progress, pon=progress applies, on=scored when, pt=progress total. */
  var INP = [
    {
      id: "wake",
      sec: "morning",
      w: 4,
      l: function (c) {
        return "Wake by " + fmt(c.tg);
      },
      v: function (c) {
        return c.d.wake ? 1 - c.late / 120 : 0;
      },
      pg: function (c) {
        return c.d.wake ? 1 : 0;
      },
    },
    {
      id: "meds",
      sec: "morning",
      cat: "Body",
      w: 4,
      reg: "Medication",
      h: 1,
      l: function () {
        return "Medication";
      },
      v: function (c) {
        return c.d.meds;
      },
      pg: function (c) {
        return c.d.meds ? 1 : 0;
      },
    },
    {
      id: "ex",
      sec: "morning",
      cat: "Body",
      w: 6,
      reg: "Home exercises",
      h: 1,
      l: function () {
        return "Home exercises";
      },
      v: function (c) {
        return c.d.ex;
      },
      pg: function (c) {
        return c.d.ex ? 1 : 0;
      },
    },
  ]
    .concat(
      [0, 1, 2, 3, 4].map(function (i) {
        return {
          id: "p" + i,
          sec: "faith",
          cat: "Faith",
          w: 10,
          l: function () {
            return PN[i];
          },
          v: function (c) {
            return c.d.p[i];
          },
          pg: function (c) {
            return c.d.p[i] ? 1 : 0;
          },
        };
      }),
    )
    .concat([
      {
        gen: function (c, A) {
          SUNN.forEach(function (u) {
            var n = c.s.sn[u.i];
            if (n > 0)
              A(
                PN[u.p] + " sunnah, " + u.pos.toLowerCase() + " (" + n + ")",
                c.sn[u.i],
                SW[u.i],
                "sn" + u.i,
                "e",
                true,
              );
          });
        },
      },
      {
        id: "focus",
        sec: "focus",
        w: 7,
        on: function (c) {
          return !c.rest;
        },
        l: function (c) {
          return "Focus " + c.fm + " of " + c.F + " min";
        },
        v: function (c) {
          return c.fm / c.F;
        },
        pg: function (c) {
          return Math.min(c.F, c.fm);
        },
        pt: function (c) {
          return c.F;
        },
      },
      {
        id: "sleep",
        sec: "morning",
        cat: "Body",
        w: 6,
        reg: "Sleep",
        h: 1,
        l: function (c) {
          return "Sleep " + (c.d.sleep || 0) + " of " + c.s.sleep + " h";
        },
        v: function (c) {
          return (c.d.sleep || 0) / c.s.sleep;
        },
        pg: function (c) {
          return (c.d.sleep || 0) / c.s.sleep;
        },
      },
      {
        id: "bed",
        sec: "morning",
        cat: "Body",
        w: 3,
        reg: "Bedtime",
        h: 1,
        l: function (c) {
          return "Bed by " + fmt(bedT(c.k));
        },
        v: function (c) {
          return c.d.bed ? 1 - bedLate(c.d, c.k) / 120 : 0;
        },
        pg: function (c) {
          return c.d.bed ? 1 : 0;
        },
      },
      {
        id: "work",
        sec: "work",
        w: 14,
        on: function (c) {
          return c.job;
        },
        l: function () {
          return "Work day";
        },
        v: function (c) {
          return wkV(c.k);
        },
        pg: function (c) {
          return wkV(c.k);
        },
      },
      {
        id: "water",
        sec: "body",
        cat: "Body",
        w: 4,
        l: function (c) {
          return "Water " + (c.d.water || 0) + " of " + c.s.water;
        },
        v: function (c) {
          return (c.d.water || 0) / c.s.water;
        },
        pg: function (c) {
          return (c.d.water || 0) / c.s.water;
        },
      },
      {
        id: "sp",
        sec: "body",
        cat: "Body",
        w: 5,
        reg: "Home workout",
        h: 1,
        l: function (c) {
          return (
            "Home workout" + (c.d.sp && c.d.spm ? ", " + c.d.spm + " min" : "")
          );
        },
        v: function (c) {
          return c.d.sp
            ? c.d.spm > 0 && c.s.wm > 0
              ? Math.min(1, c.d.spm / c.s.wm)
              : 1
            : 0;
        },
        pg: function (c) {
          return c.d.sp ? 1 : 0;
        },
      },
      {
        id: "br",
        sec: "body",
        cat: "Mind",
        w: 3,
        reg: "Breathing",
        h: 1,
        l: function (c) {
          return (
            "Breathing " + (c.d.br || 0) + (c.s.bn > 0 ? " of " + c.s.bn : "")
          );
        },
        v: function (c) {
          return c.s.bn > 0
            ? (c.d.br || 0) / c.s.bn
            : (c.d.br || 0) > 0
              ? 1
              : 0;
        },
        pg: function (c) {
          return (c.d.br || 0) >= 1 ? 1 : 0;
        },
      },
      {
        id: "jn",
        sec: "mind",
        cat: "Mind",
        w: 4,
        l: function () {
          return "Journal";
        },
        v: function (c) {
          return (c.d.jn || "").trim() ? 1 : 0;
        },
        pg: function (c) {
          return (c.d.jn || "").trim() ? 1 : 0;
        },
      },
      {
        id: "pt",
        sec: "morning",
        w: 4,
        b: 1,
        reg: "Physical therapy",
        l: function () {
          return "Physical therapy";
        },
        v: function (c) {
          return c.d.pt;
        },
      },
      {
        id: "q",
        sec: "faith",
        cat: "Faith",
        w: 8,
        reg: "Quran",
        h: 1,
        on: function (c) {
          return c.m.faith;
        },
        pon: function (c) {
          return c.m.faith;
        },
        l: function (c) {
          return qLab(c.d);
        },
        v: function (c) {
          return qProg(c.d);
        },
        pg: function (c) {
          return qProg(c.d);
        },
      },
      {
        id: "am",
        sec: "faith",
        cat: "Faith",
        w: 3,
        reg: "Morning adhkar",
        h: 1,
        on: function (c) {
          return c.m.faith;
        },
        pon: function (c) {
          return c.m.faith;
        },
        l: function () {
          return "Morning adhkar";
        },
        v: function (c) {
          return c.ad[0];
        },
        pg: function (c) {
          return c.ad[0] ? 1 : 0;
        },
      },
      {
        id: "pm",
        sec: "faith",
        cat: "Faith",
        w: 3,
        reg: "Evening adhkar",
        h: 1,
        on: function (c) {
          return c.m.faith;
        },
        pon: function (c) {
          return c.m.faith;
        },
        l: function () {
          return "Evening adhkar";
        },
        v: function (c) {
          return c.ad[1];
        },
        pg: function (c) {
          return c.ad[1] ? 1 : 0;
        },
      },
      {
        id: "jm",
        sec: "faith",
        w: 6,
        on: function (c) {
          return c.m.faith && c.fri;
        },
        l: function () {
          return "Jumu’ah and Al-Kahf";
        },
        v: function (c) {
          return c.d.jm;
        },
      },
      {
        id: "phone",
        sec: "screens",
        w: 4,
        reg: "Phone time",
        h: 1,
        on: function (c) {
          return c.m.digital;
        },
        l: function (c) {
          return "Phone " + (c.d.phone || 0) + " min, limit " + c.s.phone;
        },
        v: function (c) {
          var d = c.d,
            s = c.s;
          return d.phone
            ? d.phone <= s.phone
              ? 1
              : 1 - (d.phone - s.phone) / s.phone
            : 0;
        },
        pg: function (c) {
          return c.d.phone > 0 ? 1 : 0;
        },
      },
      {
        id: "games",
        sec: "screens",
        w: 3,
        reg: "Games",
        h: 1,
        on: function (c) {
          return c.m.digital;
        },
        l: function (c) {
          return "Games under " + c.s.games + " min";
        },
        v: function (c) {
          var d = c.d,
            s = c.s;
          return !d.leis || d.leis <= s.games
            ? 1
            : 1 - (d.leis - s.games) / s.games;
        },
        pg: function (c) {
          return c.d.leis > 0 ? 1 : 0;
        },
      },
      {
        id: "pz",
        sec: "screens",
        w: 2,
        reg: "Chess puzzles",
        on: function (c) {
          return c.m.digital;
        },
        l: function (c) {
          return (
            "Chess puzzles " +
            (c.d.pz || 0) +
            (c.s.pn > 0 ? " of " + c.s.pn : "")
          );
        },
        v: function (c) {
          return c.s.pn > 0
            ? (c.d.pz || 0) / c.s.pn
            : (c.d.pz || 0) > 0
              ? 1
              : 0;
        },
      },
      {
        id: "mood",
        sec: "mind",
        cat: "Mind",
        w: 1,
        t: "w",
        l: function (c) {
          return "Mood" + (c.d.mood ? " " + c.d.mood + " of 5" : "");
        },
        v: function (c) {
          return c.d.mood ? (c.d.mood - 1) / 4 : 0;
        },
        pg: function (c) {
          return c.d.mood ? 1 : 0;
        },
      },
      {
        id: "calm",
        sec: "mind",
        cat: "Mind",
        w: 1,
        t: "w",
        l: function (c) {
          return "Calm" + (c.d.nv ? " " + (6 - c.d.nv) + " of 5" : "");
        },
        v: function (c) {
          return c.d.nv ? (5 - c.d.nv) / 4 : 0;
        },
        pg: function (c) {
          return c.d.nv ? 1 : 0;
        },
      },
      {
        id: "pain",
        sec: "mind",
        cat: "Mind",
        w: 1,
        t: "w",
        l: function (c) {
          return "Low pain" + (c.d.pain ? " " + (6 - c.d.pain) + " of 5" : "");
        },
        v: function (c) {
          return c.d.pain ? (5 - c.d.pain) / 4 : 0;
        },
        pg: function (c) {
          return c.d.pain ? 1 : 0;
        },
      },
    ]);
  function regBuild() {
    var R = {};
    INP.forEach(function (e) {
      if (e.reg) (R[e.sec] = R[e.sec] || []).push([e.id, e.reg]);
    });
    return R;
  }
  function items(k) {
    var c = ctx(k),
      d = c.d,
      it = [];
    var A = function (l, v, w, id, t, b) {
      if ((getState().hide && getState().hide[id]) || !bornOK(id, k)) return;
      it.push({
        l: l,
        v: Math.max(0, Math.min(1, +v || 0)),
        w: w,
        t: t || "e",
        id: id,
        bonus: !!b,
      });
    };
    INP.forEach(function (e) {
      if (e.gen) {
        if (areaOn("faith")) e.gen(c, A);
        return;
      }
      if (e.sec && !sectionOn(e.sec)) return;
      if (e.on && !e.on(c)) return;
      A(e.l(c), e.v(c), e.w, e.id, e.t, e.b);
    });
    (getState().cx || []).forEach(function (x) {
      if (x.sc && sectionOn(x.sec)) A(x.l, cxF(x, k), 3, "cx" + x.id);
    });
    return it;
  }
  function pcOf(it) {
    var num = 0,
      den = 0,
      bn = 0,
      bd = 0;
    it.forEach(function (x) {
      if (x.bonus) {
        bn += x.v * x.w;
        bd += x.w;
      } else {
        num += x.v * x.w;
        den += x.w;
      }
    });
    if (!den) return 0;
    return Math.min(
      100,
      Math.round((100 * num) / den + (bd ? (10 * bn) / bd : 0)),
    );
  }
  function openDay(k) {
    return (
      k === iso(new Date()) && !(getState().days[k] && getState().days[k].fin)
    );
  }
  function pc(k) {
    return pcOf(
      items(k).filter(function (x) {
        return x.t === "e";
      }),
    );
  }
  function pcT(k, t) {
    return pcOf(
      items(k).filter(function (x) {
        return x.t === t;
      }),
    );
  }
  function openList(k) {
    return items(k)
      .filter(function (x) {
        return x.t === "e" && !x.bonus && x.v < 0.999;
      })
      .map(function (x) {
        return x.l;
      });
  }
  function tline(k) {
    var d = D(k),
      s = getState().set,
      t = [];
    if (d.wake) t.push([wakeOK(d, k), "Wake by " + fmt(target(k))]);
    if (d.sleep) t.push([d.sleep >= s.sleep, "Sleep " + s.sleep + " h"]);
    if (s.mods.digital) {
      if (d.phone)
        t.push([d.phone <= s.phone, "Phone under " + s.phone + " min"]);
      if (d.leis)
        t.push([d.leis <= s.games, "Games under " + s.games + " min"]);
    }
    return t
      .map(function (x) {
        return (x[0] ? "✓ " : "✗ ") + x[1];
      })
      .join("   ");
  }
  function streak() {
    var t = new Date(),
      n = 0,
      k = iso(t);
    if (openDay(k) || pc(k) < 80) t.setDate(t.getDate() - 1);
    for (var i = 0; i < 400; i++) {
      k = iso(t);
      if (getState().days[k] && pc(k) >= 80) {
        n++;
        t.setDate(t.getDate() - 1);
      } else break;
    }
    return n;
  }
  function weekDays(k) {
    var d = parse(k),
      off = (d.getDay() + 1) % 7,
      o = [];
    for (var i = 0; i < 7; i++)
      o.push(
        iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() - off + i)),
      );
    return o;
  }
  function gh(id, x) {
    return getState().hide && getState().hide[id] ? 0 : x ? 1 : 0;
  }
  var LIM = {
      sleep: 16,
      phone: 1440,
      leis: 1440,
      spm: 300,
      q: 600,
      qp: 200,
      br: 20,
      pz: 200,
    },
    IDL = {
      sleep: "Sleep, hours",
      phone: "Phone, min",
      leis: "Games, min",
      spm: "Workout, min",
      q: "Quran, min",
      qp: "Quran, pages",
      br: "Breathing",
      pz: "Puzzles",
    };

  function snapDay(k) {
    return JSON.stringify(getState().days[k] || null);
  }
  function undoPush(k, pre) {
    if (snapDay(k) !== pre) {
      getUndo().push([k, pre]);
      if (getUndo().length > 10) getUndo().shift();
    }
  }
  function gapDays() {
    var o = [],
      t = new Date(),
      i,
      x,
      k;
    for (i = 1; i <= 7; i++) {
      x = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i);
      k = iso(x);
      if (k < getState().start) continue;
      if (!getState().days[k]) o.push([k, "Not logged"]);
      else if (pc(k) < 30) o.push([k, "Only " + pc(k) + "% logged"]);
    }
    return o;
  }
  function gday(k) {
    var x = parse(k);
    return DN[x.getDay()] + " " + x.getDate() + "/" + (x.getMonth() + 1);
  }
  function bornOK(id, k) {
    var b = (getState().born || {})[id],
      m;
    if (!b && (m = /^cxc([0-9a-z]{7,})$/.exec(id))) {
      var t = parseInt(m[1], 36);
      if (t > 1e12 && t < 4e12) b = iso(new Date(t));
    }
    return !b || k >= b;
  }
  function gf(id, x) {
    return getState().hide && getState().hide[id]
      ? 0
      : Math.max(0, Math.min(1, +x || 0));
  }
  function nh(id) {
    return getState().hide && getState().hide[id] ? 0 : 1;
  }
  var CXCAT = { morning: "Body", body: "Body", mind: "Mind", faith: "Faith" };
  function cats(k) {
    var c = ctx(k),
      hid = getState().hide || {},
      acc = { Faith: [0, 0], Body: [0, 0], Mind: [0, 0] },
      o = {};
    INP.forEach(function (e) {
      if (!e.cat || hid[e.id] || !bornOK(e.id, k) || (e.on && !e.on(c))) return;
      acc[e.cat][0] += Math.max(0, Math.min(1, +e.v(c) || 0));
      acc[e.cat][1]++;
    });
    (getState().cx || []).forEach(function (x) {
      var q = CXCAT[x.sec];
      if (x.sc && q && bornOK("cx" + x.id, k)) {
        acc[q][0] += cxF(x, k);
        acc[q][1]++;
      }
    });
    ["Faith", "Body", "Mind"].forEach(function (n) {
      o[n] = acc[n][1] ? acc[n][0] / acc[n][1] : 0;
    });
    o.Focus = c.rest ? null : Math.min(1, c.fm / c.F);
    return o;
  }
  function wb(d) {
    var a = [];
    if (d.mood) a.push((d.mood - 1) / 4);
    if (d.nv) a.push((5 - d.nv) / 4);
    if (d.pain) a.push((5 - d.pain) / 4);
    return a.length
      ? a.reduce(function (p, q) {
          return p + q;
        }, 0) / a.length
      : null;
  }

  /* ---------- weekly reports ---------- */
  var IDN = {
    work: "Work day",
    wake: "Wake time",
    sleep: "Sleep",
    phone: "Phone limit",
    games: "Games limit",
    pz: "Chess puzzles",
    jm: "Jumu’ah",
    meds: "Medication",
    ex: "Home exercises",
    p0: "Fajr",
    p1: "Dhuhr",
    p2: "Asr",
    p3: "Maghrib",
    p4: "Isha",
    focus: "Focus time",
    water: "Water",
    sp: "Home workout",
    br: "Breathing",
    jn: "Journal",
    q: "Quran",
    am: "Morning adhkar",
    pm: "Evening adhkar",
    mood: "Mood",
    calm: "Calm",
    pain: "Low pain",
  };
  var ADVI = {
    wake: "Move your alarm 15 minutes earlier each day.",
    sleep: "Set a fixed bedtime and a wind-down alert.",
    phone: "Charge the phone outside the bedroom.",
    games: "Game after your focus session, with a timer.",
    pz: "Do your puzzles right after Maghrib.",
    jm: "Plan Friday around Jumu’ah.",
    meds: "Keep your medication next to your breakfast.",
    ex: "Do your exercises right after your medication.",
    p0: "Set an alert for Fajr.",
    p1: "Set an alert for Dhuhr.",
    p2: "Set an alert for Asr.",
    p3: "Set an alert for Maghrib.",
    p4: "Set an alert for Isha.",
    focus: "Book your focus slot the night before.",
    water: "Drink a glass after each prayer.",
    sp: "Pick one fixed time for your workout.",
    br: "Breathe for 5 minutes before your first focus session.",
    jn: "Write three lines at the close-out.",
    q: "Pin the Quran to one prayer.",
    am: "Do your morning adhkar right after waking.",
    pm: "Do your evening adhkar after Asr.",
    mood: "Check what lifts your mood in the Insights.",
    calm: "Do breathing before the first focus session.",
    pain: "Stand and stretch every 45 minutes.",
  };
  function idName(id) {
    var m = /^cx(.+)$/.exec(id),
      c;
    if (m) {
      c = (getState().cx || []).filter(function (x) {
        return x.id === m[1];
      })[0];
      return c ? c.l : "Custom input";
    }
    return (
      (getState().lbl && getState().lbl[id]) ||
      IDN[id] ||
      (id === "bed" ? "Bedtime" : id)
    );
  }
  function avgA(a) {
    return a.length
      ? Math.round(
          a.reduce(function (p, q) {
            return p + q;
          }, 0) / a.length,
        )
      : 0;
  }
  function weekStats(ws) {
    var td = iso(new Date()),
      o = {
        days: [],
        n: 0,
        has: 0,
        focus: 0,
        fgoal: 0,
        pr: 0,
        pt: 0,
        solid: 0,
        snr: 0,
        min: 0,
      },
      E1 = [],
      W1 = [],
      S1 = [],
      ids = {},
      ct = { Faith: [], Body: [], Mind: [], Focus: [] };
    weekDays(ws).forEach(function (k) {
      var d = D(k),
        fut = k > td,
        opn = openDay(k),
        row = {
          k: k,
          fut: fut,
          opn: opn,
          mn: d.min ? 1 : 0,
          has: !!getState().days[k],
          rest: isRest(k),
          fm: fsum(d),
          fg: isRest(k) ? 0 : fgoal(k),
          pr: d.p.reduce(function (a, b) {
            return a + b;
          }, 0),
          mood: d.mood || 0,
          sc: 0,
          wl: null,
        };
      if (!fut && !opn) {
        row.sc = pc(k);
        if (d.mood || d.nv || d.pain) row.wl = pcT(k, "w");
        o.n++;
        if (row.has) o.has++;
        o.focus += row.fm;
        o.fgoal += row.fg;
        o.pr += row.pr;
        o.pt += d.pt ? 1 : 0;
        SUNN.forEach(function (u) {
          if ((d.sn || [])[u.i]) o.snr += getState().set.sn[u.i];
        });
        if (row.sc >= 80) o.solid++;
        if (d.min && !fut) o.min++;
        else {
          E1.push(pcT(k, "e"));
          S1.push(row.sc);
        }
        if (row.wl !== null) W1.push(row.wl);
        items(k).forEach(function (x) {
          if (x.bonus) return;
          var q = (ids[x.id] = ids[x.id] || { s: 0, n: 0 });
          q.s += x.v;
          q.n++;
        });
        var c = cats(k);
        Object.keys(c).forEach(function (n) {
          if (c[n] !== null) ct[n].push(Math.round(c[n] * 100));
        });
      }
      o.days.push(row);
    });
    o.eff = avgA(E1);
    o.wel = W1.length ? avgA(W1) : null;
    o.score = avgA(S1);
    o.ids = ids;
    o.cats = {};
    Object.keys(ct).forEach(function (n) {
      o.cats[n] = avgA(ct[n]);
    });
    return o;
  }
  function buildReport(ws) {
    var st = weekStats(ws),
      wk = getState().weeks[ws] || { g: ["", "", ""], gd: [0, 0, 0] },
      rk = Object.keys(st.ids)
        .map(function (id) {
          return {
            id: id,
            l: idName(id),
            p: Math.round((100 * st.ids[id].s) / st.ids[id].n),
          };
        })
        .sort(function (a, b) {
          return b.p - a.p;
        }),
      wins = rk
        .filter(function (x) {
          return x.p >= 80;
        })
        .slice(0, 3),
      fixes = rk
        .slice()
        .reverse()
        .filter(function (x) {
          return x.p < 60;
        })
        .slice(0, 3),
      best = null,
      hard = null;
    st.days
      .filter(function (x) {
        return !x.fut && !x.opn && x.has && !x.mn;
      })
      .forEach(function (x) {
        if (!best || x.sc > best.sc) best = x;
        if (!hard || x.sc < hard.sc) hard = x;
      });
    var next = fixes.map(function (x) {
      return ADVI[x.id] || "Give " + x.l + " a fixed time.";
    });
    (wk.g || []).forEach(function (g, i) {
      if (g && !wk.gd[i]) next.push("Carry over: " + g);
    });
    return {
      ws: ws,
      gen: Date.now(),
      rec: weekRec(ws),
      eff: st.eff,
      wel: st.wel,
      score: st.score,
      sn: st.snr,
      focus: st.focus,
      fgoal: st.fgoal,
      pr: st.pr,
      pt: st.pt,
      min: st.min,
      solid: st.solid,
      n: st.n,
      has: st.has,
      days: st.days.map(function (x) {
        return {
          k: x.k,
          mn: x.mn,
          sc: x.sc,
          fm: x.fm,
          fg: x.fg,
          pr: x.pr,
          mood: x.mood,
          fut: x.fut,
          opn: x.opn,
          has: x.has,
        };
      }),
      rk: rk.map(function (x) {
        return [x.id, x.p];
      }),
      wins: wins,
      fixes: fixes,
      best: best ? best.k : null,
      hard: hard && hard !== best ? hard.k : null,
      cats: st.cats,
      next: next.slice(0, 5),
      head: !st.n
        ? "Week in progress"
        : st.eff >= 85
          ? "Excellent week"
          : st.eff >= 70
            ? "Strong week"
            : st.eff >= 50
              ? "Steady week"
              : "Tough week",
    };
  }
  function avgN(a) {
    return a.length
      ? a.reduce(function (p, q) {
          return p + q;
        }, 0) / a.length
      : null;
  }
  function r1(x) {
    return Math.round(x * 10) / 10;
  }
  function hidn(id) {
    return !!(getState().hide && getState().hide[id]);
  }
  function weekRec(ws) {
    var td = iso(new Date()),
      o = {
        n: 0,
        sl: [],
        slOk: 0,
        wa: [],
        waOk: 0,
        sp: 0,
        spm: 0,
        br: 0,
        ex: 0,
        jn: 0,
        q: 0,
        qd: 0,
        am: 0,
        pm: 0,
        jm: 0,
        ph: [],
        phOk: 0,
        gm: 0,
        pz: 0,
        mo: [],
        nv: [],
        pn: [],
        wk: [],
        wkOk: 0,
        cx: {},
      };
    weekDays(ws).forEach(function (k) {
      if (k > td || !getState().days[k] || openDay(k)) return;
      var d = D(k);
      o.n++;
      (getState().cx || []).forEach(function (c) {
        var v = +(d.cx && d.cx[c.id]) || 0,
          a = (o.cx[c.id] = o.cx[c.id] || { s: 0, dy: 0, hit: 0 });
        if (v > 0) {
          a.s += v;
          a.dy++;
          if (c.tg > 0 && c.k !== "y" && c.k !== "s") {
            if (v >= c.tg) a.hit++;
          } else a.hit++;
        }
      });
      if (d.sleep > 0) {
        o.sl.push(d.sleep);
        if (d.sleep >= getState().set.sleep) o.slOk++;
      }
      if (d.water > 0) {
        o.wa.push(d.water);
        if (d.water >= getState().set.water) o.waOk++;
      }
      if (d.sp) {
        o.sp++;
        o.spm += d.spm || 0;
      }
      if (d.br > 0) o.br++;
      if (d.ex) o.ex++;
      if ((d.jn || "").trim()) o.jn++;
      if (d.q > 0) {
        o.qd++;
        o.q += d.q;
      }
      var ad = d.ad || [0, 0];
      o.am += ad[0] ? 1 : 0;
      o.pm += ad[1] ? 1 : 0;
      if (d.jm) o.jm++;
      if (d.phone > 0 && d.phone <= 1440) {
        o.ph.push(d.phone);
        if (d.phone <= getState().set.phone) o.phOk++;
      }
      o.gm += d.leis || 0;
      o.pz += d.pz || 0;
      if (d.mood) o.mo.push(d.mood);
      if (d.nv) o.nv.push(6 - d.nv);
      if (d.pain) o.pn.push(6 - d.pain);
      if (d.wake) {
        var wm = mins(d.wake);
        o.wk.push(wm);
        if (wm <= target(k)) o.wkOk++;
      }
    });
    return o;
  }

  var REG = regBuild();
  return {
    D,
    E,
    fsum,
    isRest,
    jobDay,
    fgoal,
    target,
    qProg,
    qLab,
    bedT,
    bedLate,
    wakeOK,
    ctx,
    INP,
    regBuild,
    REG,
    items,
    pcOf,
    openDay,
    pc,
    pcT,
    openList,
    tline,
    streak,
    weekDays,
    gh,
    LIM,
    IDL,
    snapDay,
    undoPush,
    gapDays,
    gday,
    bornOK,
    gf,
    nh,
    CXCAT,
    cats,
    wb,
    IDN,
    ADVI,
    idName,
    avgA,
    weekStats,
    buildReport,
    avgN,
    r1,
    hidn,
    weekRec,
  };
}
