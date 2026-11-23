import {
  KEY,
  PN,
  DN,
  CATS,
  SUNN,
  SW,
  DS,
  TMK,
  AKEY,
  OKEY,
} from "./core/config.js";
import { z, iso, parse, esc, fmt, mins, dur, mmss } from "./core/date-time.js";
import { createLocalPersistence } from "./core/local-persistence.js";
import { createAppState } from "./core/app-state.js";
import { createTrackerModel } from "./domain/tracker-model.js";
import { createTrackerSchema } from "./domain/tracker-schema.js";
import { createFirebaseClient } from "./services/firebase-client.js";
import { createFirebaseSync } from "./services/firebase-sync.js";
import { createComposioClient } from "./services/composio-client.js";
import { createScreenRegistry, renderScreen } from "./ui/screen-registry.js";
import { createAppContext } from "./core/app-context.js";
import { createActionHandlers } from "./actions/action-handlers.js";
import { createChangeHandlers } from "./actions/change-handlers.js";
import { bindActionEvents } from "./actions/bind-events.js";
import { vNow as render_vNow } from "./ui/screens/now.js";
import { vLog as render_vLog } from "./ui/screens/log.js";
import { vWeek as render_vWeek } from "./ui/screens/week.js";
import { vMore as render_vMore } from "./ui/screens/more.js";
import { vArchive as render_vArchive } from "./ui/screens/archive.js";
import { vLearn as render_vLearn } from "./ui/screens/learn.js";
import { vReports as render_vReports } from "./ui/screens/reports.js";
import { vMoney as render_vMoney } from "./ui/screens/money.js";
import { vSet as render_vSet } from "./ui/screens/settings.js";
import { vAdhkar as render_vAdhkar } from "./ui/screens/adhkar.js";

export function startApp() {
  const { blank, fix } = createTrackerSchema({
    defaults: DS,
    iso: iso,
    seedWorkTasks: wseed,
  });
  const persistence = createLocalPersistence({
    storage: localStorage,
    key: KEY,
    timerKey: TMK,
    authKey: AKEY,
    ownerKey: OKEY,
    normalize: fix,
  });
  function load() {
    return persistence.loadState();
  }
  const appState = createAppState(load());
  var FIRST_RUN = !(appState.state.ui && appState.state.ui.setupDone);
  function areaOn(id) {
    var a = appState.state.ui && appState.state.ui.areas;
    return !a || !Object.prototype.hasOwnProperty.call(a, id) ? true : !!a[id];
  }
  function sectionOn(id) {
    var key = id === "screens" ? "digital" : id;
    if (!areaOn(key)) return false;
    if (id === "faith" && !appState.state.set.mods.faith) return false;
    if (id === "screens" && !appState.state.set.mods.digital) return false;
    return true;
  }
  function areaPageOn(id) {
    return id === "learn"
      ? areaOn("learn")
      : id === "adhkar"
        ? areaOn("faith")
        : id === "money"
          ? areaOn("money")
          : id === "archive" ||
            id === "set" ||
            id === "now" ||
            id === "log" ||
            id === "week" ||
            id === "more" ||
            id === "home";
  }
  function visiblePages() {
    return PG.filter(function (p) {
      return areaPageOn(p[0]);
    });
  }
  function setArea(id, on) {
    appState.state.ui = appState.state.ui || {};
    appState.state.ui.areas = appState.state.ui.areas || {};
    appState.state.ui.areas[id] = !!on;
    appState.state.set = appState.state.set || {};
    appState.state.set.mods = appState.state.set.mods || {};
    if (id === "faith") {
      appState.state.set.mods.faith = on ? 1 : 0;
      if (appState.state.set.nt) appState.state.set.nt.prayer = on ? 1 : 0;
    }
    if (id === "digital") appState.state.set.mods.digital = on ? 1 : 0;
    if (id === "work") {
      appState.state.set.job = appState.state.set.job || {};
      appState.state.set.job.on = on ? 1 : 0;
    }
    if (
      !on &&
      tab === "more" &&
      ((id === "learn" && sub === "learn") ||
        (id === "faith" && sub === "adhkar") ||
        (id === "money" && sub === "money"))
    )
      sub = "home";
  }
  function finishSetup() {
    var areas = {
      morning: true,
      focus: true,
      body: false,
      mind: false,
      faith: false,
      work: false,
      learn: false,
      money: false,
      digital: false,
    };
    document.querySelectorAll("[data-setup-area]").forEach(function (e) {
      areas[e.dataset.setupArea] = !!e.checked;
    });
    Object.keys(areas).forEach(function (id) {
      setArea(id, areas[id]);
    });
    appState.state.ui.setupDone = 1;
    FIRST_RUN = false;
    agMark();
    var d = document.getElementById("setupx");
    if (d && d.open) d.close();
    save();
    render();
    return false;
  }
  function setupBoot() {
    var d = document.getElementById("setupx");
    if (FIRST_RUN && d && !d.open) d.showModal();
  }
  var THEMES = [
    ["zaytun", "Zaytun", "#EDF0E4", "#5E6B2A"],
    ["rumman", "Rumman", "#F1EAE5", "#9B3A3F"],
    ["fayrouz", "Fayrouz", "#E8F1EF", "#138A86"],
    ["lazuward", "Lazuward", "#EBEEF6", "#2F4F9E"],
  ];
  function applyTheme() {
    var t = appState.state.ui && appState.state.ui.theme;
    if (
      !THEMES.some(function (x) {
        return x[0] === t;
      })
    )
      t = "zaytun";
    document.documentElement.setAttribute("data-theme", t);
  }
  applyTheme();
  var D,
    E,
    fsum,
    isRest,
    jobDay,
    fgoal,
    target,
    bedT,
    bedLate,
    wakeOK,
    ctx,
    INP,
    regBuild,
    items,
    openDay,
    pc,
    pcT,
    streak,
    weekDays,
    LIM,
    IDL,
    snapDay,
    undoPush,
    gapDays,
    gday,
    bornOK,
    gf,
    nh,
    wb,
    ADVI,
    idName,
    buildReport,
    avgN,
    r1,
    hidn,
    weekRec,
    UNDO = [],
    GAPS = false;
  var trackerModel = createTrackerModel({
    getState: function () {
      return appState.state;
    },
    getUndo: function () {
      return UNDO;
    },
    blank: blank,
    parse: parse,
    iso: iso,
    fmt: fmt,
    mins: mins,
    PN: PN,
    SUNN: SUNN,
    SW: SW,
    DN: DN,
    areaOn: areaOn,
    sectionOn: sectionOn,
    wkOn: wkOn,
    wkV: wkV,
    cxF: cxF,
  });
  D = trackerModel.D;
  E = trackerModel.E;
  fsum = trackerModel.fsum;
  isRest = trackerModel.isRest;
  jobDay = trackerModel.jobDay;
  fgoal = trackerModel.fgoal;
  target = trackerModel.target;
  bedT = trackerModel.bedT;
  bedLate = trackerModel.bedLate;
  wakeOK = trackerModel.wakeOK;
  ctx = trackerModel.ctx;
  INP = trackerModel.INP;
  regBuild = trackerModel.regBuild;
  items = trackerModel.items;
  openDay = trackerModel.openDay;
  pc = trackerModel.pc;
  pcT = trackerModel.pcT;
  streak = trackerModel.streak;
  weekDays = trackerModel.weekDays;
  LIM = trackerModel.LIM;
  IDL = trackerModel.IDL;
  snapDay = trackerModel.snapDay;
  undoPush = trackerModel.undoPush;
  gapDays = trackerModel.gapDays;
  gday = trackerModel.gday;
  bornOK = trackerModel.bornOK;
  gf = trackerModel.gf;
  nh = trackerModel.nh;
  wb = trackerModel.wb;
  ADVI = trackerModel.ADVI;
  idName = trackerModel.idName;
  buildReport = trackerModel.buildReport;
  avgN = trackerModel.avgN;
  r1 = trackerModel.r1;
  hidn = trackerModel.hidn;
  weekRec = trackerModel.weekRec;
  REG = trackerModel.REG;
  function wtl(v, l, sub, c) {
    return (
      '<div class="wk2t' +
      (c ? " " + c : "") +
      '"><b>' +
      v +
      "</b><span>" +
      l +
      "</span>" +
      (sub ? "<small>" + sub + "</small>" : "") +
      "</div>"
    );
  }
  function wgr(a, c4) {
    return a.length
      ? '<div class="wk2g' + (c4 ? " c4" : "") + '">' + a.join("") + "</div>"
      : "";
  }
  function wcard(p, t, meta, inner) {
    p = Math.max(0, Math.min(100, Math.round(p || 0)));
    return (
      '<section class="wk2"><div class="wk2h"><span class="ls-star">' +
      (p >= 100
        ? star(100, 28, 0, "var(--basalt)", "none")
        : star(p, 28, 2.6)) +
      "</span><span><b>" +
      t +
      "</b><small>" +
      meta +
      "</small></span></div>" +
      inner +
      "</section>"
    );
  }
  function secWork(ws) {
    var ds = weekDays(ws).filter(function (k) {
        return jobDay(k);
      }),
      on = ds.filter(function (k) {
        return wkOn(k);
      }),
      w = on.filter(function (k) {
        return wkR(k).i;
      }),
      m = 0,
      tk = 0,
      h = 0,
      o = 0,
      a = [],
      b = [],
      T = [];
    on.forEach(function (k) {
      var q = wkR(k);
      m += wkMin(k);
      tk += q.dn.length;
      if (q.i) {
        a.push(mins(q.i));
        if (q.o) b.push(mins(q.o));
        if (q.m === "h") h++;
        else o++;
      }
    });
    T.push(
      wtl(
        w.length + "/" + on.length,
        "Days worked",
        on.length < ds.length ? ds.length - on.length + " off" : "",
      ),
    );
    T.push(wtl(dshort(m), "Hours"));
    T.push(wtl(tk, "Tasks done"));
    if (h || o) T.push(wtl(h + "/" + o, "Home / Office"));
    if (a.length) T.push(wtl(fmt(avgN(a)), "Avg start"));
    if (b.length) T.push(wtl(fmt(avgN(b)), "Avg finish"));
    return wcard(
      on.length ? (100 * w.length) / on.length : 0,
      "Work",
      on.length ? w.length + " of " + on.length + " days" : "No work days",
      wgr(T),
    );
  }
  function ensureReports() {
    var cw = weekDays(iso(new Date()))[0],
      ks = Object.keys(appState.state.days).sort(),
      made = [];
    if (!ks.length) return made;
    var ws = weekDays(ks[0])[0],
      g = 0;
    while (ws < cw && g++ < 400) {
      if (
        !appState.state.reports[ws] &&
        weekDays(ws).some(function (k) {
          return appState.state.days[k];
        })
      ) {
        appState.state.reports[ws] = buildReport(ws);
        made.push(ws);
      }
      var d = parse(ws);
      d.setDate(d.getDate() + 7);
      ws = iso(d);
    }
    return made;
  }

  /* ---------- storage and live sync ---------- */
  var SYNC = "Saved on this device only",
    PENDING = false;
  function stat(t) {
    SYNC = t;
    var e = document.getElementById("syncs");
    if (e) e.textContent = t;
    var h = document.getElementById("hsync");
    if (h) h.textContent = t === "Synced across your devices" ? "" : t;
  }
  function lsave() {
    persistence.saveState(appState.state);
  }

  function loadTm() {
    return persistence.loadTimer();
  }
  var TM = loadTm();
  function saveTm() {
    persistence.saveTimer(TM);
  }
  function save() {
    lsave();
    saveTm();
    push();
  }

  /* ---------- account and sync (Firebase REST, no SDK) ---------- */
  var AUTH = null;
  const firebaseClient = createFirebaseClient({
    readAuth: function () {
      return AUTH;
    },
    saveAuth: asave,
    onAuthExpired: function () {
      signOutLocal("Signed out. Please sign in again.");
    },
  });
  function aload() {
    return persistence.loadAuth();
  }
  function asave() {
    persistence.saveAuth(AUTH);
  }
  const firebaseSync = createFirebaseSync({
    client: firebaseClient,
    getAuth: function () {
      return AUTH;
    },
    getState: function () {
      return appState.state;
    },
    setState: function (value) {
      appState.state = value;
    },
    normalize: fix,
    saveLocal: lsave,
    setStatus: stat,
    afterLoad: afterLoad,
    render: render,
    isEditing: function () {
      var a = document.activeElement;
      return !!(
        a &&
        /INPUT|TEXTAREA|SELECT/.test(a.tagName) &&
        a.closest("#view")
      );
    },
    setPending: function () {
      PENDING = true;
    },
  });
  function push() {
    return firebaseSync.push();
  }
  function syncNow() {
    return firebaseSync.syncNow();
  }

  function setAuth(j, em, nm) {
    AUTH = {
      uid: j.localId,
      em: em,
      rt: j.refreshToken,
      dn: String(j.displayName || nm || "").slice(0, 60),
    };
    firebaseClient.setSession(j);
    asave();
    acNav();
  }

  function signOutLocal(msg) {
    AUTH = null;
    firebaseClient.clearSession();
    firebaseSync.reset();
    asave();
    stat("Saved on this device only");
    acNav();
    render();
    if (msg) alertx(msg, "", null);
  }
  function acMsg(t) {
    var e = document.getElementById("acmsg");
    if (e) e.textContent = t;
  }
  function acErr(e) {
    var c = (e && e.code) || "";
    if (!c) return "Could not reach the server. Check your connection or VPN.";
    if (/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND/.test(c))
      return "Wrong email or password.";
    if (/EMAIL_EXISTS/.test(c))
      return "This email already has an account. Sign in instead.";
    if (/WEAK_PASSWORD/.test(c))
      return "Password too weak. Use 8 or more characters.";
    if (/TOO_MANY_ATTEMPTS/.test(c))
      return "Too many attempts. Try again later.";
    if (/OPERATION_NOT_ALLOWED/.test(c))
      return "Email sign-in is not enabled on the server.";
    if (/INVALID_EMAIL/.test(c)) return "Enter a valid email.";
    return "Something went wrong (" + c.slice(0, 40) + ").";
  }
  function acGo(isNew) {
    var em = val("acm").toLowerCase(),
      pe = document.getElementById("acp"),
      pw = pe ? pe.value : "",
      nm = isNew ? val("acn").replace(/\s+/g, " ").trim().slice(0, 40) : "";
    if (AGB) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      agErr("Enter a valid email.");
      return;
    }
    if (pw.length < (isNew ? 8 : 6)) {
      agErr(isNew ? "Use at least 8 characters." : "Enter your password.");
      return;
    }
    AGB = true;
    var bt = document.getElementById("agg");
    if (bt) {
      bt.disabled = true;
      bt.textContent = isNew ? "Creating\u2026" : "Signing in\u2026";
    }
    acMsg("");
    firebaseClient
      .identity(isNew ? "accounts:signUp" : "accounts:signInWithPassword", {
        email: em,
        password: pw,
        returnSecureToken: true,
      })
      .then(
        function (j) {
          var ow = persistence.getOwnerId();
          if (ow && ow !== j.localId) {
            if (
              !confirm(
                "This device holds data from a different account.\n\nSigning in will replace it with this account's data. Continue?",
              )
            ) {
              agFree(isNew);
              acMsg("Cancelled.");
              return;
            }
            appState.state = fix(null);
            lsave();
          }
          persistence.setOwnerId(j.localId);
          setAuth(j, em, nm);
          if (isNew && nm)
            firebaseClient
              .identity("accounts:update", {
                idToken: j.idToken,
                displayName: nm,
              })
              .then(
                function () {},
                function () {},
              );
          firebaseSync.reset();
          stat("Connecting...");
          firebaseSync.startSync();
          AGB = false;
          agMark();
          agClose();
          render();
        },
        function (e) {
          agFree(isNew);
          agErr(acErr(e));
        },
      );
  }
  function acReset() {
    var em = val("acm").toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      acMsg("Type your email above first.");
      return;
    }
    firebaseClient
      .identity("accounts:sendOobCode", {
        requestType: "PASSWORD_RESET",
        email: em,
      })
      .then(
        function () {
          acMsg("If this email has an account, a reset link was sent.");
        },
        function (e) {
          acMsg(
            /EMAIL_NOT_FOUND/.test((e && e.code) || "")
              ? "If this email has an account, a reset link was sent."
              : acErr(e),
          );
        },
      );
  }
  function acUI() {
    var h = '<div class="pad"><span id="syncs">' + esc(SYNC) + "</span></div>";
    if (AUTH)
      h +=
        '<div class="add"><button class="btn alt" data-a="acsync">Sync now</button></div>';
    return (
      h +
      '<div class="add"><button class="btn alt" data-a="bk">Download backup</button><label class="btn alt">Restore<input type="file" id="rs" accept=".json" hidden></label></div>'
    );
  }
  function acName() {
    if (!AUTH) return "";
    if (AUTH.dn) return AUTH.dn;
    var l = String(AUTH.em || "").split("@")[0];
    return l ? l.charAt(0).toUpperCase() + l.slice(1) : "Account";
  }
  function acNav() {
    var e = document.getElementById("pgacc");
    if (!e) return;
    if (AUTH) {
      var n = acName();
      e.innerHTML =
        '<div class="pga"><span class="pga-av" aria-hidden="true">' +
        esc(n.charAt(0).toUpperCase()) +
        '</span><span class="pga-n"><b>' +
        esc(n) +
        "</b><small>" +
        esc(AUTH.em) +
        '</small></span><button class="pga-b" data-a="acout">Sign out</button></div>';
    } else
      e.innerHTML =
        '<div class="pga"><span class="pga-n"><b>Not signed in</b><small>Saved on this device only</small></span><button class="pga-b go" data-a="agin">Sign in</button></div>';
  }
  function pgClose() {
    var o = document.getElementById("pgo");
    if (o) o.classList.remove("open");
  }
  /* ---------- sign in and create account pages ---------- */
  var GK = "tracker-gate",
    AGM = "in",
    AGB = false;
  function agSeen() {
    return !!persistence.readText(GK, "1");
  }
  function agMark() {
    persistence.writeText(GK, "1");
  }
  function agEl() {
    return document.getElementById("agx");
  }
  function agPaint(m, em) {
    var up = m === "up";
    agEl().innerHTML =
      '<div class="agx-in"><p class="agx-l"><i></i>Life Tracker</p>' +
      '<h1 class="agx-t" id="agx-t" tabindex="-1" autofocus>' +
      (up ? "Create your account" : "Welcome back") +
      "</h1>" +
      '<p class="agx-s">' +
      (up
        ? "One account keeps every device in step."
        : "Sign in to sync your days across devices.") +
      "</p>" +
      '<form class="agx-f" id="agf" novalidate>' +
      (up
        ? '<div><label for="acn">Name</label><input id="acn" type="text" autocomplete="name" autocapitalize="words" maxlength="40" placeholder="What should we call you?"></div>'
        : "") +
      '<div><label for="acm">Email</label><input id="acm" type="email" inputmode="email" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="120" placeholder="you@example.com" value="' +
      esc(em || "") +
      '"></div>' +
      '<div><label for="acp">Password</label><div class="agx-w"><input id="acp" type="password" autocomplete="' +
      (up ? "new-password" : "current-password") +
      '" maxlength="100" placeholder="' +
      (up ? "8 characters or more" : "Your password") +
      '"><button type="button" class="agx-sh" data-a="agpw" aria-pressed="false">Show</button></div></div>' +
      '<p class="agx-m" id="acmsg" role="status" aria-live="polite"></p>' +
      '<button type="submit" class="agx-go" id="agg">' +
      (up ? "Create account" : "Sign in") +
      "</button>" +
      '<div class="agx-r">' +
      (up
        ? '<button type="button" class="agx-k" data-a="agsw" data-i="in">Have an account? <b>Sign in</b></button>'
        : '<button type="button" class="agx-k" data-a="acrs">Forgot password?</button><button type="button" class="agx-k" data-a="agsw" data-i="up">New here? <b>Create account</b></button>') +
      "</div>" +
      '</form><button type="button" class="agx-k agx-x" data-a="agskip">Not now</button>' +
      (up
        ? '<p class="agx-n">Synced data is stored on Firebase and can be read by the app owner.</p>'
        : "") +
      "</div>";
  }
  function agOpen(m, keep) {
    var g = agEl(),
      em = keep ? val("acm") : "";
    AGM = m;
    AGB = false;
    agPaint(m, em);
    g.classList.remove("out", "sh");
    if (!g.open) g.showModal();
  }
  function agClose() {
    var g = agEl();
    if (!g.open) return;
    g.classList.add("out");
    setTimeout(function () {
      if (g.classList.contains("out")) {
        g.close();
        g.classList.remove("out");
      }
    }, 230);
  }
  function agSkip() {
    agMark();
    agClose();
  }
  function agErr(t) {
    acMsg(t);
    var g = agEl();
    g.classList.remove("sh");
    void g.offsetWidth;
    g.classList.add("sh");
  }
  function agFree(isNew) {
    AGB = false;
    var bt = document.getElementById("agg");
    if (bt) {
      bt.disabled = false;
      bt.textContent = isNew ? "Create account" : "Sign in";
    }
  }
  function agPw() {
    var p = document.getElementById("acp"),
      b = document.querySelector(".agx-sh");
    if (!p) return;
    var sh = p.type === "password";
    p.type = sh ? "text" : "password";
    if (b) {
      b.textContent = sh ? "Hide" : "Show";
      b.setAttribute("aria-pressed", sh ? "true" : "false");
    }
  }
  function agBoot() {
    if (!FIRST_RUN && !AUTH && !agSeen()) agOpen("in");
  }

  /* ---------- prayer times for Homs, schedule ---------- */
  function pt(y, m, d) {
    var R = Math.PI / 180,
      lat = 34.7324,
      lng = 36.7137,
      Dd = Date.UTC(y, m, d, 12) / 864e5 + 2440587.5 - 2451545,
      g = (357.529 + 0.98560028 * Dd) % 360,
      q = (280.459 + 0.98564736 * Dd) % 360,
      L = (q + 1.915 * Math.sin(g * R) + 0.02 * Math.sin(2 * g * R)) % 360,
      e = 23.439 - 3.6e-7 * Dd,
      RA =
        (((Math.atan2(Math.cos(e * R) * Math.sin(L * R), Math.cos(L * R)) /
          R /
          15) %
          24) +
          24) %
        24,
      dec = Math.asin(Math.sin(e * R) * Math.sin(L * R)) / R,
      eq = q / 15 - RA;
    eq -= 24 * Math.round(eq / 24);
    var noon = 15 - lng / 15 - eq,
      ha = function (a) {
        return (
          Math.acos(
            (-Math.sin(a * R) - Math.sin(dec * R) * Math.sin(lat * R)) /
              (Math.cos(dec * R) * Math.cos(lat * R)),
          ) /
          R /
          15
        );
      },
      asa = -Math.atan(1 / (1 + Math.tan(Math.abs(lat - dec) * R))) / R;
    return [
      noon - ha(18),
      noon,
      noon + ha(asa),
      noon + ha(0.833),
      noon + ha(17),
    ].map(function (h, i) {
      return Math.round(h * 60) + (i === 3 ? 1 : 0);
    });
  }
  function nowMin() {
    var h = new Date(Date.now() + 108e5);
    return h.getUTCHours() * 60 + h.getUTCMinutes();
  }
  function times(k) {
    var y, m, dd;
    if (k) {
      var pp = parse(k);
      y = pp.getFullYear();
      m = pp.getMonth();
      dd = pp.getDate();
    } else {
      var h = new Date(Date.now() + 108e5);
      y = h.getUTCFullYear();
      m = h.getUTCMonth();
      dd = h.getUTCDate();
    }
    var t = pt(y, m, dd),
      o = appState.state.set.po || [0, 0, 0, 0, 0];
    return t.map(function (x, i) {
      return x + (+o[i] || 0);
    });
  }

  /* ---------- learning track ---------- */
  var RES = [
    ["Pro Git book", "https://git-scm.com/book/en/v2"],
    [
      "Git branching",
      "https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell",
    ],
    ["Docker get started", "https://docs.docker.com/get-started/"],
    ["Docker Compose", "https://docs.docker.com/compose/"],
    ["npm docs", "https://docs.npmjs.com/"],
    ["Design patterns", "https://refactoring.guru/design-patterns"],
    ["Angular docs", "https://angular.dev/overview"],
    ["Angular signals", "https://angular.dev/guide/signals"],
    ["RxJS guide", "https://rxjs.dev/guide/overview"],
    ["Angular routing", "https://angular.dev/guide/routing"],
    ["Angular forms", "https://angular.dev/guide/forms"],
    ["NgRx SignalStore", "https://ngrx.io/guide/signals"],
    ["Angular HTTP", "https://angular.dev/guide/http"],
    ["Angular Material", "https://material.angular.dev/"],
    ["Angular testing", "https://angular.dev/guide/testing"],
    ["Playwright", "https://playwright.dev/docs/intro"],
    [
      "Angular performance",
      "https://angular.dev/best-practices/runtime-performance",
    ],
    ["GitHub Actions", "https://docs.github.com/actions"],
    ["MongoDB manual", "https://www.mongodb.com/docs/manual/"],
    [
      "System design primer",
      "https://github.com/donnemartin/system-design-primer",
    ],
    ["web.dev learn", "https://web.dev/learn"],
  ];
  var CUR = [
    [
      "Git basics",
      "Init, add, commit, branch, .gitignore, log",
      "Practice repo drills: 5 commits, clear messages",
      "Push to GitHub with a README",
      0,
      "What does git add do versus git commit?",
      "add stages changes in the index; commit records the staged snapshot in history.",
      "How do you undo the last commit but keep the changes?",
      "git reset --soft HEAD~1 keeps them staged; --mixed keeps them unstaged.",
    ],
    [
      "Gitflow and PRs",
      "Feature branches, PRs, merge vs rebase",
      "Create a conflict on purpose and resolve it",
      "Merge 2 PRs into develop",
      1,
      "Merge or rebase?",
      "Merge keeps history with a merge commit; rebase replays commits for a linear history. Never rebase shared branches.",
      "How do you resolve a merge conflict?",
      "Open the files, pick the right lines, remove the markers, git add, then commit or continue the rebase.",
    ],
    [
      "Docker fundamentals",
      "Images, containers, layers, volumes, ports",
      "Dockerfile for a small Node app",
      "Multi-stage build, compare image sizes",
      2,
      "Image versus container?",
      "An image is the read-only template; a container is a running instance of it.",
      "Why use multi-stage builds?",
      "Build tools stay in early stages; the final image ships only the output, so it is smaller and safer.",
    ],
    [
      "Compose and env vars",
      "docker-compose, networks, .env, healthchecks",
      "Angular 20 build behind nginx plus a mock API",
      "Document docker compose up in the README",
      3,
      "What does Docker Compose give you?",
      "One file to define and run multi-container apps with shared networks, volumes and env vars.",
      "How do Compose services reach each other?",
      "By service name on the default network, for example http://api:3000.",
    ],
    [
      "NPM mastery",
      "package.json fields, semver (^ ~), lockfiles",
      "Write 5 npm scripts, run npm audit and fix",
      "One-page note: lockfile and semver",
      4,
      "What do ^1.2.3 and ~1.2.3 allow?",
      "^ allows minor and patch updates; ~ allows patch updates only.",
      "Why commit package-lock.json?",
      "It pins exact versions so every install is reproducible.",
    ],
    [
      "Creational patterns",
      "Singleton, Factory, Builder in TypeScript",
      "One drill file per pattern",
      "Show why providedIn root is a singleton",
      5,
      "When do you use a Factory?",
      "When creation logic varies by input and callers should not know concrete classes.",
      "Why is providedIn root a singleton?",
      "The root injector creates one instance and shares it across the app.",
    ],
    [
      "Structural patterns",
      "Decorator, Facade, Adapter in TypeScript",
      "API facade service and a data adapter",
      "PATTERNS.md with one example each",
      5,
      "Facade versus Adapter?",
      "Facade simplifies a subsystem behind one interface; Adapter converts one interface into another.",
      "Give a Decorator example in Angular.",
      "HTTP interceptors wrap requests with extra behavior such as auth headers.",
    ],
    [
      "Standalone and control flow",
      "Angular 20 standalone, @if, @for, @switch",
      "3 small components with input() and output()",
      "Push the ng-drills repo",
      6,
      "What changed with standalone components?",
      "No NgModule needed; components import their dependencies directly.",
      "What does @for require?",
      "A track expression, such as @for (x of xs; track x.id), for efficient DOM updates.",
    ],
    [
      "Signals",
      "signal, computed, effect, linkedSignal",
      "Rebuild a counter and todo list with signals",
      "Signals vs RxJS in 5 sentences",
      7,
      "signal versus computed?",
      "signal is writable state; computed derives read-only state that updates when inputs change.",
      "When do you use effect?",
      "For side effects that react to signals, like logging or syncing storage, not for deriving state.",
    ],
    [
      "RxJS and HttpClient",
      "switchMap, catchError, interceptors",
      "Fetch a public API with loading and error states",
      "Add retry and a typed response model",
      8,
      "switchMap versus mergeMap?",
      "switchMap cancels the previous inner request; mergeMap runs them concurrently.",
      "How do you handle HTTP errors?",
      "catchError in the pipe, return a fallback or rethrow, and show the state to the user.",
    ],
    [
      "Routing",
      "Lazy routes, functional guards, resolvers",
      "4-page app with a guarded route",
      "Confirm the bundle splits per route",
      9,
      "How do you lazy-load a route?",
      "loadComponent or loadChildren with a dynamic import in the route config.",
      "What is a functional guard?",
      "A CanActivateFn using inject() to allow, block or redirect navigation.",
    ],
    [
      "Reactive forms",
      "FormGroup, custom and async validators",
      "Registration form with clear errors",
      "Table with sort and pagination",
      10,
      "Template-driven versus reactive forms?",
      "Reactive forms build the model in code, are easier to test and scale better.",
      "How do you write a custom validator?",
      "A function returning null when valid or an error object when invalid, attached to a control.",
    ],
    [
      "State management",
      "Signal stores, NgRx SignalStore, when NgRx is overkill",
      "Cart store with a signal store",
      "Write your rule: local, service or NgRx",
      11,
      "When is NgRx overkill?",
      "For small apps or local state; a service with signals is enough until many components share complex state.",
      "What does NgRx SignalStore offer?",
      "A signals-based store with state, computed values and methods, lighter than classic NgRx.",
    ],
    [
      "Authentication",
      "JWT, refresh tokens, interceptor, guard",
      "Login against a mock backend",
      "Test the 401 refresh path",
      12,
      "Access versus refresh token?",
      "The access token is short-lived for API calls; the refresh token gets new access tokens and is guarded more tightly.",
      "What does an auth interceptor do?",
      "Adds the token to requests and handles 401 by refreshing or logging out.",
    ],
    [
      "Material, RTL and LTR",
      "Material theming, CDK, logical CSS properties",
      "One screen fully bilingual Arabic and English",
      "Fix margin-left leaks with margin-inline",
      13,
      "How do you support RTL?",
      "Set dir=rtl, use logical CSS properties like margin-inline, and test the mirrored layout.",
      "What is the Angular CDK?",
      "Behavior primitives such as overlay, accessibility and drag-drop without Material styling.",
    ],
    [
      "Unit testing",
      "TestBed, Jasmine and Karma, mocks",
      "Test a service and a pipe",
      "70 percent coverage on the drills",
      14,
      "What does TestBed do?",
      "Configures a test module so you can create components and inject services.",
      "Mock versus spy?",
      "A spy records calls on a function; a mock replaces a dependency with controlled behavior.",
    ],
    [
      "Component and e2e tests",
      "Component harnesses, Playwright basics",
      "3 e2e flows for the auth drill",
      "Run them headless",
      15,
      "Unit versus e2e tests?",
      "Unit tests isolate small pieces and run fast; e2e drives the real app to verify full flows.",
      "Why prefer Playwright role locators?",
      "They mirror user behavior and survive markup changes.",
    ],
    [
      "Performance",
      "OnPush, @defer, bundle analyzer",
      "Profile a slow list, fix it, measure",
      "Record before and after numbers",
      16,
      "What does OnPush do?",
      "Checks the component only when inputs change, events fire or signals update.",
      "What is @defer?",
      "Lazy-loads template blocks on triggers like viewport or idle, shrinking the first bundle.",
    ],
    [
      "CI/CD",
      "GitHub Actions: lint, test, build, deploy",
      "Pipeline for the drills repo",
      "Deploy to GitHub Pages or Netlify",
      17,
      "What does CI do?",
      "Lints, tests and builds every push automatically so breakage shows up early.",
      "Why cache node_modules in Actions?",
      "To speed up installs by reusing dependencies between runs.",
    ],
    [
      "Backend basics",
      "REST design, Node, Express, MongoDB schemas",
      "CRUD API with MongoDB",
      "Connect an Angular drill to it",
      18,
      "What makes an API RESTful?",
      "Resources as nouns, HTTP verbs for actions, stateless requests, proper status codes.",
      "Embed or reference in MongoDB?",
      "Embed data read together and small; reference when large, shared or unbounded.",
    ],
    [
      "System design 1",
      "Client-server, databases, caching, CDN, load balancers",
      "Design a URL shortener on paper",
      "Explain it aloud in 10 minutes",
      19,
      "What does a cache trade off?",
      "Faster reads for staleness and invalidation complexity.",
      "What does a load balancer do?",
      "Spreads requests across servers and removes unhealthy ones from rotation.",
    ],
    [
      "System design 2",
      "Pagination, queues, scaling reads and writes",
      "Design a chat app or a feed",
      "List the trade-offs: SQL vs NoSQL, cache",
      19,
      "Offset versus cursor pagination?",
      "Cursor stays fast and consistent on big or changing data; offset is simpler but skips and slows.",
      "Why use a queue?",
      "To decouple producers from consumers, smooth spikes and retry work.",
    ],
    [
      "Offline, PWA and SEO",
      "Service workers, error handling, Lighthouse",
      "Make a drill installable and offline",
      "Hit Lighthouse 90 on one page",
      20,
      "What does a service worker do?",
      "Intercepts requests to cache assets and serve them offline.",
      "Name two Lighthouse levers.",
      "Cut render-blocking JavaScript and optimize or lazy-load images.",
    ],
    [
      "Review and mock interviews",
      "Revisit your 3 weakest weeks",
      "Mock interview: signals, NgRx, CI/CD",
      "Update CV and portfolio with the drills",
      -1,
      "Explain signals versus RxJS in one minute.",
      "Signals for synchronous state; RxJS for async streams and events; convert with toSignal and toObservable.",
      "Walk through your CI pipeline.",
      "On push: install with cache, lint, test, build, then deploy the artifact.",
    ],
  ];
  function phase(w) {
    return w < 7
      ? "Foundations"
      : w < 15
        ? "Angular 20 core"
        : w < 19
          ? "Quality and delivery"
          : "Backend and system design";
  }
  function wdone(j) {
    var x = appState.state.learn.d[j];
    return !!(x && x[0] && x[1] && x[2]);
  }
  function nextTask() {
    var L = appState.state.learn,
      c = CUR[L.w],
      dn = L.d[L.w] || [0, 0, 0],
      n = ["Learn", "Practice", "Ship"];
    for (var i = 0; i < 3; i++) if (!dn[i]) return n[i] + ": " + c[i + 1];
    return "Week done. Move to the next week.";
  }
  function topics() {
    var c = CUR[appState.state.learn.w];
    return ["Learn: " + c[1], "Practice: " + c[2], "Ship: " + c[3]];
  }
  function wkMin(w) {
    var m = 0;
    Object.keys(appState.state.days).forEach(function (k) {
      (appState.state.days[k].fs || []).forEach(function (x) {
        if (x.w === w) m += x.m || 0;
      });
    });
    return m;
  }
  function dueQs() {
    var td = iso(new Date()),
      o = [],
      L = appState.state.learn;
    for (var w = 0; w <= L.w; w++)
      for (var i = 0; i < 2; i++) {
        var id = w * 2 + i,
          r = L.sr[id];
        if (!r || r.due <= td) o.push([w, i, id]);
      }
    return o;
  }
  var INT = [1, 2, 4, 8, 16, 32],
    RC = { show: false, skip: {} };
  function rcNext() {
    var q = dueQs().filter(function (x) {
      return !RC.skip[x[2]];
    });
    return q[0] || null;
  }

  /* ---------- sounds ---------- */
  var AC = null,
    AUD = {},
    UNL = false,
    SEQ = {
      p: [[523.25, 0, 0.55]],
      w: [
        [392, 0, 0.45],
        [587.33, 0.16, 0.7],
      ],
      d: [
        [523.25, 0, 0.7],
        [659.25, 0.18, 0.7],
        [783.99, 0.36, 1.2],
      ],
    };
  function wav(seq) {
    var sr = 22050,
      len = 0,
      i;
    seq.forEach(function (x) {
      len = Math.max(len, Math.floor((x[1] + x[2]) * sr));
    });
    var b = new Int16Array(len);
    seq.forEach(function (x) {
      var a = Math.floor(x[1] * sr),
        n = Math.floor(x[2] * sr);
      for (i = 0; i < n && a + i < len; i++) {
        var t = i / sr,
          env = Math.min(1, i / (0.03 * sr)) * Math.exp((-3.2 * t) / x[2]);
        b[a + i] += Math.sin(2 * Math.PI * x[0] * t) * env * 9000;
      }
    });
    var hd = new ArrayBuffer(44 + len * 2),
      v = new DataView(hd),
      w = function (o, t) {
        for (var j = 0; j < t.length; j++) v.setUint8(o + j, t.charCodeAt(j));
      };
    w(0, "RIFF");
    v.setUint32(4, 36 + len * 2, true);
    w(8, "WAVEfmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, sr, true);
    v.setUint32(28, sr * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    w(36, "data");
    v.setUint32(40, len * 2, true);
    for (i = 0; i < len; i++) v.setInt16(44 + i * 2, b[i], true);
    var u = new Uint8Array(hd),
      st = "";
    for (i = 0; i < u.length; i += 8192)
      st += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
    return "data:audio/wav;base64," + btoa(st);
  }
  function aud(k) {
    return AUD[k] || (AUD[k] = new Audio(wav(SEQ[k])));
  }
  function unlock() {
    if (UNL) return;
    UNL = true;
    ["p", "w", "d"].forEach(function (k) {
      try {
        var a = aud(k);
        a.muted = true;
        var pr = a.play();
        if (pr && pr.then)
          pr.then(function () {
            a.pause();
            a.currentTime = 0;
            a.muted = false;
          }).catch(function () {
            a.muted = false;
            UNL = false;
          });
      } catch (e) {
        UNL = false;
      }
    });
  }
  function beep(kind) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      var n = AC.currentTime;
      SEQ[kind].forEach(function (x) {
        var o = AC.createOscillator(),
          g = AC.createGain();
        o.type = "sine";
        o.frequency.value = x[0];
        g.gain.setValueAtTime(0, n + x[1]);
        g.gain.linearRampToValueAtTime(0.05, n + x[1] + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, n + x[1] + x[2]);
        o.connect(g);
        g.connect(AC.destination);
        o.start(n + x[1]);
        o.stop(n + x[1] + x[2] + 0.05);
      });
    } catch (e) {}
  }
  function snd(kind, cb) {
    if (!cb && appState.state.set.snd === 0) return;
    try {
      var a = aud(kind);
      a.muted = false;
      a.volume = 0.6;
      try {
        a.currentTime = 0;
      } catch (e) {}
      var pr = a.play();
      if (pr && pr.then)
        pr.then(function () {
          if (cb) cb("ok");
        }).catch(function () {
          beep(kind);
          if (cb) cb("fallback");
        });
      else if (cb) cb("ok");
    } catch (e) {
      beep(kind);
      if (cb) cb("fallback");
    }
  }
  function testSound() {
    snd("d", function (r) {
      var e = document.getElementById("sndst");
      if (e)
        e.textContent =
          r === "ok"
            ? "Played. If you heard nothing, raise the volume and turn off silent mode."
            : "Used the backup sound engine. If still silent, this browser is blocking audio.";
    });
  }

  /* ---------- Composio connections ---------- */
  var EXT = {},
    LINK = {},
    CERR = "";
  const composioClient = createComposioClient({
    getHost: function () {
      return globalThis.claude;
    },
  });
  async function cx(tool, args) {
    return composioClient.callComposio(tool, args);
  }
  function cerr(e) {
    var c = e && e.code;
    return c === "server_not_connected"
      ? "Composio isn’t added in Claude. Add it in Settings, Connectors."
      : c === "needs_reauth"
        ? "Composio needs reconnecting in Claude Settings, Connectors."
        : c === "approval_required" || c === "not_granted"
          ? "Allow this page to use Composio when Claude asks."
          : c === "unavailable"
            ? "Open this page inside Claude, signed in."
            : "Couldn’t reach Composio (" +
              (c || "error") +
              "). Try again later.";
  }
  function dig(o, key, dep) {
    dep = dep || 0;
    if (!o || typeof o !== "object" || dep > 7) return null;
    if (Array.isArray(o[key])) return o[key];
    var ks = Object.keys(o);
    for (var i = 0; i < ks.length; i++) {
      var r = dig(o[ks[i]], key, dep + 1);
      if (r) return r;
    }
    return null;
  }
  function runTools(list) {
    return cx("COMPOSIO_MULTI_EXECUTE_TOOL", {
      sync_response_to_workbench: false,
      tools: list,
    });
  }
  function connList(slug) {
    return composioClient.connectionStatus(slug);
  }
  function connAdd(slug) {
    return composioClient.addConnection(slug);
  }
  async function fetchGmail() {
    try {
      var p = await runTools([
        {
          tool_slug: "GMAIL_FETCH_EMAILS",
          arguments: {
            query:
              "newer_than:7d (interview OR references OR application OR recruiter OR HR)",
            max_results: 5,
            verbose: false,
            include_payload: false,
          },
        },
      ]);
      var ms = dig(p, "messages") || [];
      EXT.gmail = {
        items: ms.map(function (m) {
          return {
            s: m.subject || "(no subject)",
            f: m.sender || m.from || "",
          };
        }),
      };
    } catch (e) {
      EXT.gmail = { items: [], err: cerr(e) };
    }
    render();
  }
  async function fetchGithub() {
    try {
      var zz = new Date(Date.now() + 108e5),
        d0 = new Date(
          Date.UTC(zz.getUTCFullYear(), zz.getUTCMonth(), zz.getUTCDate()) -
            108e5,
        ),
        since = d0.toISOString().replace(/\.\d+Z$/, "Z");
      var p1 = await runTools([
        {
          tool_slug: "GITHUB_LIST_REPOSITORIES_FOR_THE_AUTHENTICATED_USER",
          arguments: { sort: "pushed", per_page: 4, type: "owner" },
        },
      ]);
      var repos = (dig(p1, "repositories") || []).slice(0, 4),
        calls = repos
          .filter(function (r) {
            return r.owner && r.owner.login;
          })
          .map(function (r) {
            return {
              tool_slug: "GITHUB_LIST_COMMITS",
              arguments: {
                owner: r.owner.login,
                repo: r.name,
                since: since,
                per_page: 50,
              },
            };
          });
      var n = 0,
        names = [];
      if (calls.length) {
        var p2 = await runTools(calls),
          rs = dig(p2, "results") || [];
        calls.forEach(function (c, i) {
          var a =
            dig(rs[i] || {}, "commits") || dig(rs[i] || {}, "details") || [];
          if (a.length) {
            n += a.length;
            names.push(c.arguments.repo);
          }
        });
      }
      EXT.github = { n: n, r: names };
    } catch (e) {
      EXT.github = { n: 0, r: [], err: cerr(e) };
    }
    render();
  }
  function refreshExt() {
    if (appState.state.conn.github) fetchGithub();
  }
  function checkConn(slug) {
    connList(slug)
      .then(function (st) {
        CERR = "";
        appState.state.conn[slug] = st === "connected" ? 1 : 0;
        if (st !== "connected")
          CERR = "Not active yet. Finish the sign-in, then tap Done again.";
        else {
          delete LINK[slug];
          if (slug === "gmail") fetchGmail();
          else fetchGithub();
        }
        save();
        render();
      })
      .catch(function (er) {
        CERR = cerr(er);
        render();
      });
  }
  var tab = "now",
    sub = "money",
    sel = iso(new Date()),
    today0 = sel,
    armed = false,
    MM = sel.slice(0, 7),
    WS = sel,
    SND = "",
    lastKey = "",
    NZ = 0;
  function vd() {
    return tab === "now" ? iso(new Date()) : sel;
  }
  function val(id) {
    var e = document.getElementById(id);
    return e ? e.value.trim() : "";
  }
  function telapsed(t) {
    return t.acc + (t.on ? Date.now() - t.t0 : 0);
  }
  function box(t, inner, note) {
    return (
      "<h2>" +
      t +
      "</h2>" +
      (note ? '<p class="note">' + note + "</p>" : "") +
      '<div class="box">' +
      inner +
      "</div>"
    );
  }
  function row(l, s, r) {
    return (
      '<div class="row"><span>' +
      l +
      (s ? "<small>" + s + "</small>" : "") +
      "</span>" +
      (r || "") +
      "</div>"
    );
  }
  function tgl(a, k, i, on) {
    return (
      '<button class="chk" data-a="' +
      a +
      '"' +
      (k != null ? ' data-k="' + k + '"' : "") +
      (i != null ? ' data-i="' + i + '"' : "") +
      ' aria-pressed="' +
      (on ? "true" : "false") +
      '">' +
      (on ? "✓" : "") +
      "</button>"
    );
  }
  function del(a, i, l) {
    return (
      '<button class="del" data-a="' +
      a +
      '" data-i="' +
      i +
      '" aria-label="' +
      l +
      '">×</button>'
    );
  }
  function ctr(l, k, tg, s) {
    return stp(
      l,
      k,
      1,
      [s, tg ? "Target " + tg : ""].filter(Boolean).join(", "),
      "0",
    );
  }
  function W() {
    var k = weekDays(WS)[0];
    if (!appState.state.weeks[k])
      appState.state.weeks[k] = {
        g: ["", "", ""],
        gd: [0, 0, 0],
        win: "",
        fix: "",
      };
    return appState.state.weeks[k];
  }

  /* ---------- schedule ---------- */

  /* ---------- views ---------- */
  var STN = 0;
  function star(p, sz, sw, fill, line) {
    STN++;
    p = Math.max(0, Math.min(100, p || 0));
    var id = "sc" + STN,
      y = (58 - (56 * p) / 100).toFixed(1),
      L = "M30 3C49 13 53 38 30 57C7 38 11 13 30 3Z";
    return (
      '<svg width="' +
      sz +
      '" height="' +
      sz +
      '" viewBox="0 0 60 60" aria-hidden="true"><defs><clipPath id="' +
      id +
      '"><rect x="0" y="' +
      y +
      '" width="60" height="60"/></clipPath></defs><path d="' +
      L +
      '" fill="none" stroke="' +
      (line || "var(--basalt)") +
      '" stroke-width="' +
      sw +
      '" stroke-linejoin="round"/>' +
      (p > 0
        ? '<path d="' +
          L +
          '" fill="' +
          (fill || "var(--acc)") +
          '" clip-path="url(#' +
          id +
          ')"/>'
        : "") +
      (sw > 0
        ? '<path d="M30 57V22" stroke="' +
          (line || "var(--basalt)") +
          '" stroke-width="' +
          sw * 0.7 +
          '" stroke-linecap="round" opacity=".55" fill="none"/>'
        : "") +
      "</svg>"
    );
  }
  function hdr() {
    document.getElementById("top").hidden = tab !== "now";
    heroPaint();
    wxMaybe();
  }
  var HC = null,
    OD_ALL = false,
    OD_OPEN = false,
    UP_OPEN = false,
    WK_OPEN = false,
    TL_OPEN = false;
  var SUGRE =
    /^(Wake, medication|Focus session:|Reply:|Recall review|Home workout, 20|Breathing, 5|Back exercises, 10|Stand and stretch|Quran, 10|Morning adhkar$|Evening adhkar$|Drink water,|Chess puzzles, 10|Wind down for bed|Log today’s spending|Family time$|Close-out: check-in)/;
  function isMine(p) {
    return !p.s && !(p.f && SUGRE.test(p.x));
  }
  var LGMAP = {
    wake: ["meds", "ex"],
    sp: ["sp"],
    br: ["br"],
    care: ["pt"],
    q: ["q"],
    am: ["am"],
    pm: ["pm"],
    pz: ["pz"],
    jm: ["jm"],
  };
  var LGKW = [
    [/^\s*(fajr|الفجر|صلاة الفجر)(\s+prayer)?\s*$/i, ["p0"]],
    [/^\s*(dhuhr|zuhr|الظهر|صلاة الظهر)(\s+prayer)?\s*$/i, ["p1"]],
    [/^\s*(asr|العصر|صلاة العصر)(\s+prayer)?\s*$/i, ["p2"]],
    [/^\s*(maghrib|المغرب|صلاة المغرب)(\s+prayer)?\s*$/i, ["p3"]],
    [/^\s*(isha|العشاء|صلاة العشاء)(\s+prayer)?\s*$/i, ["p4"]],
    [/jumu|kahf|الجمعة|الكهف/i, ["jm"]],
    [/quran|qur’an|koran|قرآن|قران/i, ["q"]],
    [/morning adhkar|أذكار الصباح|اذكار الصباح|أذكار الصبح/i, ["am"]],
    [/evening adhkar|أذكار المساء|اذكار المساء|أذكار المسا/i, ["pm"]],
    [/workout|تمرين/i, ["sp"]],
    [/breath|تنفس/i, ["br"]],
    [/puzzle|ألغاز/i, ["pz"]],
    [/medication|\bmeds\b|دواء/i, ["meds"]],
    [/physical therapy|back exercises/i, ["pt"]],
    [/home exercises/i, ["ex"]],
  ];
  function lgTargets(p) {
    if (p.k && LGMAP[p.k]) return LGMAP[p.k].slice();
    var f = [];
    LGKW.forEach(function (m) {
      if (m[0].test(p.x))
        m[1].forEach(function (z) {
          if (f.indexOf(z) < 0) f.push(z);
        });
    });
    return f;
  }
  function lgApply(p, d) {
    var rec = [],
      H = appState.state.hide || {};
    lgTargets(p).forEach(function (f) {
      if (H[f]) return;
      if (f === "am" || f === "pm") {
        var ai = f === "am" ? 0 : 1;
        d.ad = d.ad || [0, 0];
        if (!d.ad[ai]) {
          rec.push({ f: f, p: 0, v: 1 });
          d.ad[ai] = 1;
        }
        return;
      }
      if (/^p[0-4]$/.test(f)) {
        var pi = +f.charAt(1);
        if (!d.p[pi]) {
          rec.push({ f: f, p: 0, v: 1 });
          d.p[pi] = 1;
        }
        return;
      }
      var w = d[f] || 0;
      if (!w) {
        var S0 = appState.state.set || {},
          tv =
            f === "q"
              ? Math.max(1, +S0.qm || 10)
              : f === "br"
                ? Math.max(1, +S0.bn || 1)
                : f === "pz"
                  ? Math.max(1, +S0.pn || 1)
                  : 1;
        rec.push({ f: f, p: w, v: tv });
        d[f] = tv;
      }
    });
    if (
      lgTargets(p).indexOf("q") >= 0 &&
      !H.q &&
      +(appState.state.set || {}).qp > 0 &&
      !d.qp
    ) {
      rec.push({ f: "qp", p: 0, v: +appState.state.set.qp });
      d.qp = +appState.state.set.qp;
    }
    if (p.k === "w" || /water|مي\b|ماء/i.test(p.x)) {
      var g = +(appState.state.set && appState.state.set.water) || 0;
      if (g && (d.water || 0) < g) {
        rec.push({ f: "water", p: d.water || 0, v: g });
        d.water = g;
      }
    }
    (appState.state.cx || []).forEach(function (c) {
      if (
        c.l &&
        String(p.x).toLowerCase().indexOf(String(c.l).toLowerCase()) >= 0
      ) {
        d.cx = d.cx || {};
        var v = +d.cx[c.id] || 0;
        if (c.k === "y" && !v) {
          rec.push({ c: c.id, p: v, v: 1 });
          d.cx[c.id] = 1;
        } else if (c.k === "c") {
          rec.push({ c: c.id, p: v, v: v + 1 });
          d.cx[c.id] = v + 1;
        }
      }
    });
    p.lg = rec;
  }
  function lgUndo(p, d) {
    (p.lg || []).forEach(function (r) {
      if (r.f === "am" || r.f === "pm") {
        var ai = r.f === "am" ? 0 : 1;
        if (d.ad && d.ad[ai] === r.v) d.ad[ai] = r.p;
      } else if (/^p[0-4]$/.test(r.f || "")) {
        var pj = +r.f.charAt(1);
        if (d.p[pj] === r.v) d.p[pj] = r.p;
      } else if (r.f) {
        if ((d[r.f] || 0) === r.v) d[r.f] = r.p;
      } else if (r.c && d.cx && (+d.cx[r.c] || 0) === r.v) d.cx[r.c] = r.p;
    });
    p.lg = [];
  }
  function pcard(o) {
    var C = 2 * Math.PI * 22,
      ring =
        o.r == null
          ? ""
          : '<div class="pc-ring" role="img" aria-label="' +
            esc(o.rl || "Progress") +
            " " +
            o.r +
            ' percent"><svg viewBox="0 0 56 56" aria-hidden="true"><circle class="rb" cx="28" cy="28" r="22"/><circle class="rf" cx="28" cy="28" r="22" stroke-dasharray="' +
            C.toFixed(1) +
            '" stroke-dashoffset="' +
            (C * (1 - Math.max(0, Math.min(100, o.r)) / 100)).toFixed(1) +
            '" transform="rotate(-90 28 28)"/></svg><b>' +
            o.r +
            "%</b></div>";
    return (
      '<section class="pgc' +
      (o.r === 100 ? " full" : "") +
      '">' +
      (o.nav || "") +
      '<div class="pc-row"><div class="pc-txt">' +
      (o.nav ? "" : '<span class="hr-k">' + o.k + "</span>") +
      '<div class="pc-t">' +
      o.t +
      "</div>" +
      (o.s ? '<p class="pc-s">' + o.s + "</p>" : "") +
      "</div>" +
      ring +
      "</div>" +
      (o.st
        ? '<div class="hr-stats pc-st">' +
          o.st
            .map(function (x) {
              return "<div><b>" + x[0] + "</b><span>" + x[1] + "</span></div>";
            })
            .join("") +
          "</div>"
        : "") +
      "</section>"
    );
  }
  function subCard() {
    var t = iso(new Date());
    if (sub === "money") return mTop();
    if (sub === "adhkar") {
      var L = ADK[AKL],
        c = (D(t).ak || {})[AKL] || [],
        dn = L.filter(function (x, j) {
          return (c[j] || 0) >= x[2];
        }).length;
      var ix0 = AKL === "m" ? 0 : 1,
        tk0 = (D(t).ad || [0, 0])[ix0],
        pp0 = Math.round((100 * dn) / L.length);
      return pcard({
        nav: akNav(),
        k: "Adhkar",
        t: dn + " of " + L.length + " done",
        s: tk0 ? "Ticked in your Log" : "",
        r: pp0,
        rl: "Adhkar",
      });
    }
    return "";
  }
  /* ---------- work ---------- */
  function wkR(k) {
    var w = D(k).wk || {};
    return {
      m: w.m || "o",
      i: w.i || "",
      o: w.o || "",
      n: w.n || "",
      dn: w.dn || [],
    };
  }
  function wkW(k) {
    var d = E(k);
    d.wk = d.wk || { m: "o", i: "", o: "", n: "", dn: [] };
    return d.wk;
  }
  function wkOn(k) {
    return jobDay(k) && wkR(k).m !== "x";
  }
  function wkCm(k) {
    return wkR(k).m === "o" ? +appState.state.set.job.c || 0 : 0;
  }
  function wkMin(k) {
    var w = wkR(k),
      jb = mins(appState.state.set.job.b);
    if (!w.i) return 0;
    var a = mins(w.i),
      b;
    if (w.o) b = mins(w.o);
    else if (k < iso(new Date())) b = jb;
    else b = Math.min(nowMin(), Math.max(jb, a));
    return Math.max(0, b - a);
  }
  function wkEnded(k) {
    var w = wkR(k);
    return (
      !!w.i &&
      (!!w.o ||
        k < iso(new Date()) ||
        nowMin() >= mins(appState.state.set.job.b))
    );
  }
  function wkV(k) {
    var w = wkR(k);
    return w.i ? (wkEnded(k) ? 1 : 0.5) : 0;
  }
  function wseed() {
    return [
      ["Attend Teams intro meetings", "", 1],
      ["Write down team names and roles", "", 0],
      ["Ask manager: top priorities for first 30 days", "", 1],
      ["Get access: email, systems, shared drive", "", 0],
      ["Get HR policies and org chart", "", 0],
      ["Note how my work is measured", "", 0],
      ["Submit onboarding documents to HR (official channel)", "2026-11-30", 1],
    ];
  }
  function WT() {
    if (!appState.state.wt) appState.state.wt = { t: [], seq: 1, seed: 1 };
    return appState.state.wt;
  }
  function wtOpen() {
    return WT()
      .t.filter(function (x) {
        return !x.st;
      })
      .sort(function (a, b) {
        var da = a.due || "9999",
          db = b.due || "9999";
        return (
          (b.p || 0) - (a.p || 0) ||
          (da < db ? -1 : da > db ? 1 : 0) ||
          a.id - b.id
        );
      });
  }
  function wtFind(i) {
    return WT().t.filter(function (x) {
      return x.id === +i;
    })[0];
  }
  function wtToggle(i) {
    var t = wtFind(i);
    if (!t) return false;
    var k = iso(new Date());
    if (!t.st) {
      t.st = 1;
      t.dd = k;
      var w = wkW(k);
      w.dn = w.dn || [];
      w.dn.push({ i: t.id, x: t.x });
    } else {
      var o = appState.state.days[t.dd];
      if (o && o.wk && o.wk.dn)
        o.wk.dn = o.wk.dn.filter(function (z) {
          return z.i !== t.id;
        });
      t.st = 0;
      t.dd = "";
    }
  }
  function wtPrune() {
    var c = new Date();
    c.setDate(c.getDate() - 30);
    var ck = iso(c),
      q = WT(),
      n = q.t.length;
    q.t = q.t.filter(function (x) {
      return !x.st || (x.dd || "") >= ck;
    });
    return q.t.length !== n;
  }
  function wDue(d) {
    if (!d) return "";
    var t = iso(new Date()),
      n = Math.round((parse(d) - parse(t)) / 864e5);
    return n < 0
      ? "Overdue " + -n + " d"
      : n === 0
        ? "Due today"
        : n === 1
          ? "Due tomorrow"
          : "Due " +
            parse(d).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            });
  }
  function wMode(m) {
    return m === "h" ? "Home" : m === "x" ? "Off" : "Office";
  }
  function wSeg(k, m) {
    return (
      '<span class="wseg">' +
      [
        ["o", "Office"],
        ["h", "Home"],
        ["x", "Off"],
      ]
        .map(function (x) {
          return (
            '<button data-a="wkm" data-i="' +
            x[0] +
            '" data-k="' +
            k +
            '" aria-pressed="' +
            (m === x[0] ? "true" : "false") +
            '">' +
            x[1] +
            "</button>"
          );
        })
        .join("") +
      "</span>"
    );
  }
  function wTask(t, rich) {
    return (
      '<div class="wt-r"><button class="chk" data-a="wtdn" data-i="' +
      t.id +
      '" aria-pressed="false" aria-label="Done"></button><div class="wt-t"><b>' +
      (t.p ? '<i class="wstar">★</i> ' : "") +
      esc(t.x) +
      "</b>" +
      (t.due
        ? '<small class="' +
          (t.due < iso(new Date()) ? "late" : "") +
          '">' +
          wDue(t.due) +
          "</small>"
        : "") +
      "</div>" +
      (rich
        ? '<button class="wt-p" data-a="wtp" data-i="' +
          t.id +
          '" aria-pressed="' +
          (t.p ? "true" : "false") +
          '" aria-label="Priority">★</button><button class="del" data-a="wtdel" data-i="' +
          t.id +
          '" aria-label="Delete">×</button>'
        : "") +
      "</div>"
    );
  }
  function workCard(k, n) {
    if (!jobDay(k)) return "";
    var w = wkR(k),
      j = appState.state.set.job,
      ja = mins(j.a),
      jb = mins(j.b),
      op = wtOpen(),
      dn = w.dn.length;
    var st = w.i
      ? wkEnded(k)
        ? "Done · " + dshort(wkMin(k))
        : "In since " + w.i + " · " + dshort(wkMin(k))
      : n < ja
        ? "Starts " + j.a
        : "Not clocked in";
    if (w.m === "x")
      return fdSec(
        "var(--acc)",
        "wkt",
        WK_OPEN,
        "Work",
        "Day off",
        '<button class="btn alt" data-a="wkm" data-i="o" data-k="' +
          k +
          '">Back to work</button>',
      );
    if (!WK_OPEN) return fdSec("var(--acc)", "wkt", 0, "Work", st, "");
    var pct = Math.max(
        0,
        Math.min(100, Math.round((100 * (n - ja)) / Math.max(1, jb - ja))),
      ),
      btn = !w.i
        ? '<button class="btn" data-a="wkin" data-k="' +
          k +
          '">Clock in</button>'
        : !w.o
          ? '<button class="btn alt" data-a="wkout" data-k="' +
            k +
            '">Clock out</button>'
          : "";
    var stats =
      '<div class="wk-st"><div><b>' +
      dshort(wkMin(k)) +
      "</b><small>Worked</small></div><div><b>" +
      dn +
      "</b><small>Done today</small></div><div><b>" +
      op.length +
      "</b><small>Open</small></div></div>";
    var list = op.length
      ? '<small class="wk-lb">Open tasks</small>' +
        (WTALL ? op : op.slice(0, 3))
          .map(function (t) {
            return wTask(t, false);
          })
          .join("") +
        (op.length > 3
          ? '<button class="od-more" data-a="wtall">' +
            (WTALL ? "Show less" : "Show " + (op.length - 3) + " more") +
            "</button>"
          : "")
      : '<p class="wk-e">No open tasks.</p>';
    return fdSec(
      "var(--acc)",
      "wkt",
      1,
      "Work",
      j.a + "\u2013" + j.b,
      wSeg(k, w.m) +
        '<div class="wk-bar"><i style="width:' +
        pct +
        '%"></i></div><div class="wk-s"><span>' +
        st +
        "</span>" +
        btn +
        "</div>" +
        stats +
        list +
        '<div class="wk-add"><input type="text" id="wtq" maxlength="120" placeholder="Add a task" aria-label="New work task"><button class="btn" data-a="wtadd">Add</button></div>',
    );
  }
  function wkWeekRows(ws) {
    var td = iso(new Date()),
      ds = weekDays(ws).filter(function (k) {
        return jobDay(k);
      }),
      on = ds.filter(function (k) {
        return wkOn(k);
      }),
      w = on.filter(function (k) {
        return wkR(k).i;
      }),
      m = 0,
      tk = 0,
      h = 0,
      o = 0;
    if (!ds.length) return "";
    on.forEach(function (k) {
      m += wkMin(k);
      tk += wkR(k).dn.length;
      if (wkR(k).i) {
        if (wkR(k).m === "h") h++;
        else o++;
      }
    });
    return (
      row(
        "Days worked",
        on.length < ds.length ? ds.length - on.length + " off" : "",
        "<b>" + w.length + " / " + on.length + "</b>",
      ) +
      row("Hours", "", "<b>" + dshort(m) + "</b>") +
      row("Tasks done", "", "<b>" + tk + "</b>") +
      (h || o ? row("Home / Office", "", "<b>" + h + " / " + o + "</b>") : "")
    );
  }
  var WTALL = false;
  var ARC_ALL = false;
  function arcList() {
    var o = [];
    Object.keys(appState.state.days)
      .sort()
      .reverse()
      .forEach(function (k) {
        var d = appState.state.days[k];
        if (!d || !d.plan) return;
        d.plan.forEach(function (p, i) {
          if (p.d && isMine(p))
            o.push({ k: k, i: i, t: p.t, x: p.x, lg: p.lg && p.lg.length });
        });
      });
    return o;
  }
  function arcDay(k) {
    var t = iso(new Date()),
      y = iso(new Date(Date.now() - 864e5));
    return k === t
      ? "Today"
      : k === y
        ? "Yesterday"
        : parse(k).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
  }
  var ARCT = "work";
  function wkDoneList() {
    var o = [];
    Object.keys(appState.state.days)
      .sort()
      .reverse()
      .forEach(function (k) {
        var d = appState.state.days[k];
        if (d && d.wk && d.wk.dn)
          d.wk.dn.forEach(function (z) {
            o.push({ k: k, x: z.x });
          });
      });
    return o;
  }
  function archTabs(wn, ln) {
    return (
      '<div class="lgtabs" role="group" aria-label="Archive sections">' +
      [
        ["work", "Work", wn],
        ["tl", "Timeline", ln],
      ]
        .map(function (q) {
          return (
            '<button class="lgtab" data-a="arct" data-i="' +
            q[0] +
            '" aria-pressed="' +
            (ARCT === q[0] ? "true" : "false") +
            '"><b>' +
            q[1] +
            "</b><small>" +
            cnt(q[2], "item") +
            "</small></button>"
          );
        })
        .join("") +
      "</div>"
    );
  }
  function archWork(W) {
    if (!W.length)
      return '<p class="note">Work tasks you tick off will collect here.</p>';
    var h = "",
      cur = "",
      sw = ARC_ALL ? W : W.slice(0, 40);
    sw.forEach(function (o) {
      if (o.k !== cur) {
        cur = o.k;
        var n = W.filter(function (z) {
          return z.k === cur;
        }).length;
        h +=
          '<div class="arc-d"><b>' +
          arcDay(cur) +
          "</b><span>" +
          n +
          "</span></div>";
      }
      h +=
        '<div class="arc-r"><span class="arc-c">✓</span><div class="arc-t"><b>' +
        esc(o.x) +
        "</b></div></div>";
    });
    if (W.length > 40)
      h +=
        '<button class="od-more" data-a="arm">' +
        (ARC_ALL ? "Show less" : "Show " + (W.length - 40) + " older") +
        "</button>";
    return h;
  }

  function dshort(m) {
    m = Math.round(m);
    var h = Math.floor(m / 60);
    return h ? h + "h" + (m % 60 ? " " + (m % 60) + "m" : "") : m + "m";
  }
  function odT(j) {
    return fmt(Math.min(1350, Math.ceil((nowMin() + 10) / 5) * 5 + j * 30));
  }
  function odAgo(k) {
    var n = Math.round((parse(iso(new Date())) - parse(k)) / 864e5);
    return n <= 1 ? "Yesterday" : n + " days ago";
  }
  function fdSec(c, a, o, t, m, body) {
    return (
      '<section class="fd" style="--fc:' +
      c +
      '"><button class="fd-h" data-a="' +
      a +
      '" aria-expanded="' +
      (o ? "true" : "false") +
      '"><span class="fd-t">' +
      t +
      '</span><span class="fd-m">' +
      m +
      '</span><i class="fd-c">' +
      (o ? "▴" : "▾") +
      "</i></button>" +
      (o ? '<div class="fd-b">' + body + "</div>" : "") +
      "</section>"
    );
  }
  function odBanner() {
    var L = appState.state.od || [];
    if (!L.length) return "";
    var sh = OD_ALL ? L : L.slice(0, 3);
    var body =
      (L.length > 1
        ? '<div class="add" style="justify-content:flex-start;padding-top:0"><button class="od-all" data-a="otda">All to today</button></div>'
        : "") +
      sh
        .map(function (o, i) {
          return (
            '<div class="od-r"><button class="od-ck" data-a="odn" data-i="' +
            i +
            '" aria-label="Mark done"></button><div class="od-t"><b>' +
            esc(o.x) +
            "</b><small>" +
            odAgo(o.k) +
            (o.t ? " · " + esc(o.t) : "") +
            '</small></div><button class="od-mv" data-a="otd" data-i="' +
            i +
            '">Today</button><button class="xd" data-a="odx" data-i="' +
            i +
            '" aria-label="Drop">×</button></div>'
          );
        })
        .join("") +
      (L.length > 3
        ? '<button class="od-more" data-a="odm">' +
          (OD_ALL ? "Show less" : "Show " + (L.length - 3) + " more") +
          "</button>"
        : "");
    return fdSec(
      "var(--late)",
      "odt",
      OD_OPEN,
      "Overdue",
      cnt(L.length, "item"),
      body,
    );
  }
  function upWhen(k) {
    var n = Math.round((parse(k) - parse(iso(new Date()))) / 864e5);
    return n === 1
      ? "Tomorrow"
      : parse(k).toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
  }
  function upBanner() {
    var L = appState.state.up || [];
    if (!L.length) return "";
    var body = L.map(function (u, i) {
      return (
        '<div class="od-r" style="grid-template-columns:1fr 32px;border-top-color:var(--line)"><div class="od-t"><b>' +
        esc(u.x) +
        "</b><small>" +
        upWhen(u.k) +
        (u.t ? " · " + esc(u.t) : "") +
        '</small></div><button class="xd" data-a="upx" data-i="' +
        i +
        '" aria-label="Remove">×</button></div>'
      );
    }).join("");
    return fdSec(
      "var(--acc)",
      "upt",
      UP_OPEN,
      "Coming",
      cnt(L.length, "item"),
      body,
    );
  }
  function heroSet(cur, n, pend, F, fm) {
    var o = { n: n, F: F, fm: fm };
    if (cur) {
      var pr = cur.g === "p";
      o.now = cur.a <= n;
      o.k = o.now ? "Now" : "Next at " + fmt(cur.a);
      o.t = pr ? cur.nm : cur.x;
      o.a = pr ? "pr" : cur.g === "pn" ? "pnt" : "pl";
      o.i = cur.i;
      o.l = pr ? "Mark prayed" : "Mark done";
      o.s = o.now
        ? pr
          ? "Window open until " + fmt(pend(cur.i))
          : "Started at " + fmt(cur.a)
        : "In " + dur(cur.a - n);
    } else {
      o.k = "All clear";
      o.t = "Nothing left on today’s timeline";
      o.s = "";
      o.a = "";
    }
    HC = o;
    heroPaint();
  }
  function heroPaint() {
    var tp = document.getElementById("top"),
      el = document.getElementById("hero");
    if (!tp || !el || !HC) return;
    var k = iso(new Date()),
      d = D(k),
      p = pc(k),
      st = streak(),
      pr = d.p.reduce(function (a, b) {
        return a + b;
      }, 0),
      C = 2 * Math.PI * 34,
      off = (C * (1 - p / 100)).toFixed(1),
      h = HC,
      w3 = wkOn(k)
        ? [dshort(wkMin(k)), "At work"]
        : [st, "Solid " + (st === 1 ? "day" : "days")];
    var mK = iso(new Date()).slice(0, 7),
      ms = mStats(mK),
      mp = mTgt(mK),
      mv = [
        mf(ms.spent),
        mp > 0
          ? "Spent of " + mf(mp) + " " + esc(appState.state.money.cur)
          : "Spent " + esc(appState.state.money.cur),
      ];
    tp.classList.toggle("full", p === 100);
    el.innerHTML =
      '<div class="hr"><div class="hr-top"><span>' +
      esc(
        new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
      ) +
      "</span>" +
      (WX ? '<span class="hr-wx">' + WX.t + "° " + esc(WX.p) + "</span>" : "") +
      "</div>" +
      '<div class="hr-main"><div class="hr-txt"><span class="hr-k' +
      (h.now ? " on" : "") +
      '"><i></i>' +
      esc(h.k) +
      '</span><div class="hr-t" role="heading" aria-level="1">' +
      esc(h.t) +
      "</div>" +
      (h.s ? '<p class="hr-s">' + esc(h.s) + "</p>" : "") +
      "</div>" +
      '<div class="hr-ring" role="img" aria-label="Effort ' +
      p +
      ' percent"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="rb" cx="40" cy="40" r="34"/><circle class="rf" cx="40" cy="40" r="34" stroke-dasharray="' +
      C.toFixed(1) +
      '" stroke-dashoffset="' +
      off +
      '" transform="rotate(-90 40 40)"/></svg><b>' +
      p +
      "%<small>effort</small></b></div></div>" +
      (h.a
        ? '<button class="hr-btn" data-a="' +
          h.a +
          '" data-i="' +
          h.i +
          '">' +
          h.l +
          "</button>"
        : "") +
      '<div class="hr-stats"><div><b>' +
      pr +
      "/5</b><span>Prayers</span></div><div><b>" +
      mv[0] +
      "</b><span>" +
      mv[1] +
      "</span></div><div><b>" +
      w3[0] +
      "</b><span>" +
      w3[1] +
      "</span></div></div>" +
      '<span id="hsync">' +
      esc(SYNC === "Synced across your devices" ? "" : SYNC) +
      "</span></div>";
  }

  var WX = null,
    WXT = 0,
    WXB = false,
    WXF = false;
  try {
    var wc = persistence.readJson("wx-v1", null);
    if (wc && wc.t && wc.d) {
      WX = wc.d;
      WXT = wc.t;
    }
  } catch (e) {}
  function wxHint(t, ph, aq) {
    if (/poor|unhealthy|hazard/i.test(aq))
      return "Air is poor: keep exercise short or indoors.";
    if (t >= 36) return "Hot: exercise early or after sunset.";
    if (/rain|storm|shower|snow/i.test(ph))
      return "Wet: use the home exercises.";
    if (t <= 3) return "Cold: warm up first and keep it short.";
    return "";
  }
  async function wxMaybe() {
    if (WXB || WXF || tab !== "now" || Date.now() - WXT < 1200000) return;
    WXF = true;
    try {
      var m = await composioClient.getBridge();
      if (!m) {
        WXB = true;
        WX = null;
        return;
      }
      var r = await composioClient.callTool(
          "AccuWeather®",
          "widgets-current-claude",
          { queryParams: { locationKey: "313556", unit: "metric" } },
        ),
        d = r && r.payload !== undefined ? r.payload : r;
      if (typeof d === "string") d = JSON.parse(d);
      var c = d.currentConditions,
        t = Math.round(c.temperatureValue);
      if (isNaN(t)) throw { code: "shape" };
      var ph = String(c.phrase || ""),
        aq = String(
          (d.currentAirQuality && d.currentAirQuality.category) || "",
        );
      WX = { t: t, p: ph, a: aq, h: wxHint(t, ph, aq) };
      WXT = Date.now();
      persistence.writeJson("wx-v1", { t: WXT, d: WX });
      hdr();
    } catch (e) {
      var cd = e && e.code;
      if (
        cd === "needs_reauth" ||
        cd === "server_not_connected" ||
        cd === "blocked_by_policy" ||
        cd === "approval_required" ||
        cd === "unavailable"
      ) {
        WXB = true;
        WX = null;
        hdr();
      } else WXT = Date.now();
    } finally {
      WXF = false;
    }
  }
  var ADPP = { wake: 1, jm: 1, care: 1 };
  function adpDt(k) {
    return jobDay(k) ? "j" : parse(k).getDay() === 5 ? "f" : "o";
  }
  function adpR(key, k, mk) {
    var id = key + "|" + adpDt(k),
      a = appState.state.adp;
    return (
      a[id] ||
      (mk ? (a[id] = { dn: 0, dx: 0, ms: 0, sx: 0, hu: "", tm: [] }) : null)
    );
  }
  function adpMed(a) {
    var b = a.slice().sort(function (x, y) {
      return x - y;
    });
    return b[b.length >> 1];
  }
  function adpAct(t, key, k) {
    var r = adpR(key, k, 1);
    if (t === "dn") {
      r.dn++;
      r.sx = 0;
      r.tm.push(nowMin());
      if (r.tm.length > 8) r.tm.shift();
    } else if (t === "dx") {
      r.dx++;
      r.sx++;
      if (r.sx >= 3 && !ADPP[key]) {
        var h = parse(k);
        h.setDate(h.getDate() + 14);
        r.hu = iso(h);
        r.sx = 2;
      }
    } else if (t === "ms") r.ms++;
  }
  function adpNorm(x) {
    return String(x)
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function adpPat(k) {
    var c = parse(k);
    c.setDate(c.getDate() - 21);
    var c0 = iso(c),
      wd = parse(k).getDay(),
      g = {},
      o = [];
    var put = function (dk, t, x) {
      if (dk < c0 || dk >= k) return;
      var n = adpNorm(x);
      if (n.length < 3) return;
      var q = (g[n] = g[n] || { x: x, e: [] });
      q.x = x;
      q.e.push({ k: dk, m: mins(t) });
    };
    Object.keys(appState.state.days).forEach(function (dk) {
      ((appState.state.days[dk] || {}).plan || []).forEach(function (p) {
        if (isMine(p) && !p.f) put(dk, p.t, p.x);
      });
    });
    (appState.state.od || []).forEach(function (q) {
      put(q.k, q.t, q.x);
    });
    Object.keys(g).forEach(function (n) {
      var e = g[n].e,
        dy = {};
      e.forEach(function (v) {
        dy[v.k] = 1;
      });
      var nd = Object.keys(dy).length,
        w = e.filter(function (v) {
          return parse(v.k).getDay() === wd;
        }),
        ms = function (a) {
          return a.map(function (v) {
            return v.m;
          });
        };
      if (nd >= 3)
        o.push({
          n: n,
          x: g[n].x,
          m: adpMed(ms(e)),
          c: nd,
          why: "You added this " + nd + " times in 3 weeks",
        });
      else if (w.length >= 2) {
        var t = ms(w);
        if (Math.max.apply(0, t) - Math.min.apply(0, t) <= 45)
          o.push({
            n: n,
            x: g[n].x,
            m: adpMed(t),
            c: w.length,
            why: "You add this on this weekday",
          });
      }
    });
    return o
      .sort(function (a, b) {
        return b.c - a.c;
      })
      .slice(0, 3);
  }
  var SG = [];
  function suggest(k, n) {
    return suggest0(k, n);
  }
  function suggest0(k, n) {
    var d = D(k),
      T = times(),
      s = appState.state.set,
      m = s.mods,
      tg = target(k),
      F = fgoal(k),
      fm = fsum(d),
      job = wkOn(k),
      j = s.job,
      ad = d.ad || [0, 0],
      fri = parse(k).getDay() === 5,
      y = new Date(),
      L = [],
      out = [];
    y.setDate(y.getDate() - 1);
    var Y = D(iso(y)),
      old = new Date();
    old.setDate(old.getDate() - 7);
    Object.keys(appState.state.dis).forEach(function (dk) {
      if (dk < iso(old)) delete appState.state.dis[dk];
    });
    var pl = (d.plan || []).map(function (p) {
        return p.x.toLowerCase();
      }),
      dis = appState.state.dis[k] || [],
      blocked = [];
    var has = function (b) {
      b = b.toLowerCase();
      return pl.some(function (e) {
        return e.indexOf(b) >= 0;
      });
    };
    T.forEach(function (t) {
      blocked.push([t, t + 20]);
    });
    if (job) {
      var ja = mins(j.a),
        jb = mins(j.b),
        c = wkCm(k);
      blocked.push([ja - c, jb + c]);
    }
    (d.plan || []).forEach(function (p) {
      var a = mins(p.t);
      blocked.push([a, a + 30]);
    });
    (appState.state.pins || []).forEach(function (q) {
      var a = mins(q.t);
      blocked.push([a, a + 30]);
    });
    var free = function (a, len) {
      for (var t = Math.max(a, Math.ceil((n + 5) / 5) * 5); t < 1380; t += 5) {
        var ok = true;
        for (var i = 0; i < blocked.length; i++) {
          if (t < blocked[i][1] && t + len > blocked[i][0]) {
            ok = false;
            t = blocked[i][1] - 5;
            break;
          }
        }
        if (ok) return t;
      }
      return null;
    };
    var add = function (key, base, pri, pref, len, x, why) {
      if (
        dis.indexOf(key) >= 0 ||
        has(base) ||
        (d.plan || []).some(function (q) {
          return q.k === key;
        }) ||
        (appState.state.pins || []).some(function (q) {
          return q.sk === key;
        })
      )
        return;
      L.push({ key: key, pri: pri, pref: pref, len: len, x: x, why: why });
    };
    var nerv = d.nv >= 4 || Y.nv >= 4,
      care = d.pain >= 4 || Y.pain >= 4,
      due = dueQs().length;
    if (n < tg + 60)
      add(
        "wake",
        "wake",
        60,
        tg,
        45,
        "صحّي، دوا، فطور، تمارين",
        "وقت الصحيان " + fmt(tg),
      );
    if (!isRest(k) && fm < F) {
      var need = F - fm,
        len = Math.min(90, Math.max(25, need));
      add(
        "f1",
        "focus session",
        90,
        job ? mins(j.b) + (+j.c || 0) + 30 : tg + 60,
        len,
        "جلسة تركيز: " + CUR[appState.state.learn.w][0],
        nextTask() + " (باقي " + dur(need) + " اليوم)",
      );
      if (need > len)
        add(
          "f2",
          "second focus",
          70,
          T[4] + 20,
          Math.min(90, need - len),
          "جلسة تركيز تانية: " + CUR[appState.state.learn.w][0],
          "حتى توصل لهدفك " + dur(F),
        );
    }
    appState.state.tasks
      .filter(function (t) {
        return !t.d;
      })
      .slice(0, 2)
      .forEach(function (t, i) {
        add("tk:" + t.x, t.x, 76 - i * 3, n + 30, 30, t.x, "من خطتك");
      });
    var wg = appState.state.weeks[weekDays(k)[0]];
    if (wg)
      wg.g.forEach(function (g, i) {
        if (g && !wg.gd[i])
          add("gl:" + i, g, 66 - i, n + 45, 45, g, "هدف الأسبوع");
      });
    if (EXT.gmail && EXT.gmail.items && EXT.gmail.items[0])
      add(
        "em",
        "reply:",
        72,
        n + 20,
        15,
        "رد على: " + EXT.gmail.items[0].s.slice(0, 40),
        "إيميل شغل من آخر 7 أيام",
      );
    if (!d.sp)
      add(
        "sp",
        "workout",
        55,
        T[2] + 20,
        25,
        "تمرين بالبيت، 20 دقيقة",
        "تمرين يومي",
      );
    if ((d.br || 0) < 2)
      add(
        "br",
        "breathing",
        nerv ? 90 : 45,
        tg + 50,
        10,
        "تنفس، 5 دقايق",
        nerv ? "التوتر كان عالي" : "تنفس يومي",
      );
    if (care)
      add(
        "care",
        "back exercises",
        88,
        tg + 30,
        15,
        "تمارين الضهر، 10 دقايق",
        "الوجع كان عالي",
      );
    add(
      "str",
      "stretch",
      40,
      n + 60,
      10,
      "قوم امدد، رقبة وضهر",
      "فكّ القعدة الطويلة",
    );
    if (m.faith) {
      if (!(d.q > 0 || d.qp > 0))
        add("q", "quran", 50, T[3] + 25, 15, "قرآن، 10 دقايق", "ورد إيماني");
      if (!ad[0] && n < 720)
        add(
          "am",
          "morning adhkar",
          52,
          tg + 10,
          10,
          "أذكار الصبح",
          "ورد إيماني",
        );
      if (!ad[1])
        add(
          "pm",
          "evening adhkar",
          48,
          T[2] + 30,
          10,
          "أذكار المسا",
          "ورد إيماني",
        );
      if (fri && !d.jm)
        add("jm", "jumu", 95, T[1] - 40, 40, "الجمعة وسورة الكهف", "الجمعة");
    }
    if ((d.water || 0) < s.water && n > T[1])
      add(
        "w",
        "drink water",
        35,
        n + 10,
        5,
        "اشرب مي، باقي " + (s.water - (d.water || 0)) + " كاسات",
        "هدف المي",
      );
    if (m.digital && (d.pz || 0) < 5)
      add(
        "pz",
        "chess puzzles",
        25,
        T[3] + 40,
        15,
        "ألغاز شطرنج، 10 دقايق",
        "ألغاز يومية",
      );
    if (Y.sleep > 0 && Y.sleep < s.sleep)
      add(
        "bed",
        "for bed",
        62,
        1350,
        15,
        "جهّز حالك للنوم",
        "نمت " + Y.sleep + " ساعات البارحة",
      );
    if (
      !appState.state.money.log.some(function (e) {
        return e.d === k;
      })
    )
      add("mo", "spending", 30, T[4] + 30, 5, "سجّل مصاري اليوم", "مصاري");
    add("fam", "family time", 42, T[3] + 20, 60, "وقت مع العيلة", "مع الأهل");
    add(
      "co",
      "close-out",
      80,
      T[4] + 45,
      15,
      "ختام اليوم: تقييم ويوميات",
      "المزاج والوجع واليوميات",
    );
    adpPat(k).forEach(function (q) {
      add("px:" + q.n, q.x.toLowerCase(), 58, q.m, 30, q.x, q.why);
    });
    L = L.filter(function (x) {
      var r = adpR(x.key, k);
      if (!r) return true;
      var m = r.dn + r.dx + r.ms,
        pr = ADPP[x.key] || (x.key === "br" && nerv);
      if (!pr && r.hu > k) return false;
      if (m >= 4 && !pr) x.pri += Math.round((r.dn / m - 0.5) * 40);
      if (
        r.tm.length >= 4 &&
        x.key !== "wake" &&
        x.key !== "jm" &&
        x.key.indexOf("px:") !== 0
      )
        x.pref = adpMed(r.tm);
      return true;
    });
    L.sort(function (a, b) {
      return b.pri - a.pri;
    });
    L.forEach(function (x) {
      if (out.length >= 10) return;
      var a = free(x.pref, x.len);
      if (a === null) return;
      blocked.push([a, a + Math.max(x.len, 10)]);
      out.push({ key: x.key, a: a, t: fmt(a), x: x.x, why: x.why });
    });
    return out.sort(function (a, b) {
      return a.a - b.a;
    });
  }
  function rollover() {
    var t = iso(new Date()),
      ch = false;
    appState.state.od = appState.state.od || [];
    var n0 = appState.state.od.length;
    appState.state.od = appState.state.od.filter(function (o) {
      return !SUGRE.test(o.x);
    });
    if (appState.state.od.length !== n0) ch = true;
    var td = appState.state.days[t];
    if (td && td.plan) {
      var b = td.plan.length;
      td.plan = td.plan.filter(function (p) {
        return p.d || !p.f || !SUGRE.test(p.x);
      });
      if (td.plan.length !== b) ch = true;
    }
    Object.keys(appState.state.days).forEach(function (k) {
      if (k >= t) return;
      var d = appState.state.days[k];
      if (!d || !d.plan || !d.plan.length) return;
      var keep = [];
      d.plan.forEach(function (p) {
        if (p.d) keep.push(p);
        else if (isMine(p))
          appState.state.od.push({ k: p.f || k, t: p.t, x: p.x });
        else if (p.s && p.k) adpAct("ms", p.k, k);
      });
      if (keep.length === d.plan.length) return;
      d.plan = keep;
      ch = true;
    });
    appState.state.up = appState.state.up || [];
    if (appState.state.up.length) {
      var rest = [];
      appState.state.up.forEach(function (u) {
        if (u.k > t) rest.push(u);
        else if (u.k === t) E(t).plan.push({ t: u.t, x: u.x, d: 0 });
        else appState.state.od.push({ k: u.k, t: u.t, x: u.x });
      });
      if (rest.length !== appState.state.up.length) {
        appState.state.up = rest;
        ch = true;
      }
    }
    if (wtPrune()) ch = true;
    if (ch)
      appState.state.od.sort(function (a, b) {
        return a.k < b.k ? -1 : a.k > b.k ? 1 : 0;
      });
    return ch;
  }

  function topicOpts() {
    return topics()
      .concat(["Other study"])
      .map(function (o) {
        return "<option>" + esc(o) + "</option>";
      })
      .join("");
  }
  var LSEC = "over",
    LAUTO = true;
  var SECN = {
    work: "Work",
    morning: "Morning",
    faith: "Faith",
    focus: "Focus",
    body: "Body",
    mind: "Mind",
    screens: "Screens",
  };
  function secList(k) {
    var o = [];
    ["morning", "faith", "focus", "body", "mind"].forEach(function (id) {
      if (sectionOn(id)) o.push(id);
    });
    if (k && sectionOn("work") && wkOn(k)) o.splice(1, 0, "work");
    if (sectionOn("screens")) o.push("screens");
    return o;
  }
  function secProg(k) {
    var c = ctx(k),
      d = c.d,
      s = c.s,
      hid = appState.state.hide || {},
      P = {
        morning: [0, 0],
        faith: [0, 0],
        focus: [0, 0],
        body: [0, 0],
        mind: [0, 0],
        screens: [0, 0],
        work: [0, 0],
      };
    INP.forEach(function (e) {
      if (
        !e.pg ||
        (e.pon && !e.pon(c)) ||
        (e.h && hid[e.id]) ||
        !bornOK(e.id, k)
      )
        return;
      var t = e.pt ? e.pt(c) : 1,
        q = P[e.sec];
      q[0] += Math.max(0, Math.min(t, +e.pg(c) || 0));
      q[1] += t;
    });
    if (c.rest) P.focus = [1, 1];
    (appState.state.cx || []).forEach(function (c) {
      if (P[c.sec] && bornOK("cx" + c.id, k)) {
        P[c.sec][0] += cxF(c, k);
        P[c.sec][1] += 1;
      }
    });
    if (d.min) {
      P.morning = [
        gf("sleep", (d.sleep || 0) / s.sleep) + (d.wake ? 1 : 0),
        1 + nh("sleep"),
      ];
      P.faith = [
        d.p.reduce(function (x, y) {
          return x + y;
        }, 0),
        5,
      ];
    }
    return P;
  }
  function stp(l, k, step, sub, u) {
    var v = D(vd())[k] || 0;
    return row(
      l,
      sub,
      '<span class="stp"><button data-a="ctrs" data-k="' +
        k +
        '" data-i="' +
        -step +
        '" aria-label="Less">−</button><input type="number" class="num" inputmode="decimal" min="0" data-c="num" data-k="' +
        k +
        '" value="' +
        (v || "") +
        '" placeholder="' +
        u +
        '" aria-label="' +
        esc(l) +
        '"><button data-a="ctrs" data-k="' +
        k +
        '" data-i="' +
        step +
        '" aria-label="More">+</button></span>',
    );
  }
  function scw(l, k, words) {
    var v = D(vd())[k] || 0,
      h =
        '<div class="scale"><b>' +
        l +
        '</b><div class="chips" style="margin-top:8px">';
    words.forEach(function (w, i) {
      h +=
        '<button class="chip" data-a="sc" data-k="' +
        k +
        '" data-i="' +
        (i + 1) +
        '" aria-pressed="' +
        (v === i + 1 ? "true" : "false") +
        '"><b>' +
        (i + 1) +
        "</b><small>" +
        w +
        "</small></button>";
    });
    return h + "</div></div>";
  }
  function secBody0(id, k) {
    var d = D(k),
      s = appState.state.set,
      m = s.mods,
      ad = d.ad || [0, 0],
      fm = fsum(d),
      F = fgoal(k),
      h = "",
      i;
    if (id === "work") {
      var w = wkR(k),
        tn = k === iso(new Date()),
        pl = appState.state.set.job;
      return box(
        "Work",
        row("Mode", "", wSeg(k, w.m)) +
          row(
            "In",
            "Planned " + pl.a,
            '<span class="acts"><input type="time" data-c="wki" value="' +
              w.i +
              '" aria-label="Clock in">' +
              (tn
                ? '<button class="btn alt" data-a="wkin" data-k="' +
                  k +
                  '">Now</button>'
                : "") +
              "</span>",
          ) +
          row(
            "Out",
            "Planned " + pl.b,
            '<span class="acts"><input type="time" data-c="wko" value="' +
              w.o +
              '" aria-label="Clock out">' +
              (tn
                ? '<button class="btn alt" data-a="wkout" data-k="' +
                  k +
                  '">Now</button>'
                : "") +
              "</span>",
          ) +
          row(
            "Worked",
            w.i && !w.o && k <= iso(new Date()) && !wkEnded(k) ? "Running" : "",
            "<b>" + dshort(wkMin(k)) + "</b>",
          ) +
          (w.dn.length
            ? row(
                "Tasks done",
                esc(
                  w.dn
                    .map(function (z) {
                      return z.x;
                    })
                    .join(", "),
                ),
                "<b>" + w.dn.length + "</b>",
              )
            : "") +
          '<div class="pad"><input type="text" class="wkn" data-c="wkn" maxlength="140" placeholder="One line on the day" aria-label="Work note" value="' +
          esc(w.n) +
          '"></div>',
      );
    }
    if (id === "morning") {
      var ok = wakeOK(d, k);
      return box(
        "Morning",
        row(
          "Wake time",
          "Target " +
            fmt(target(k)) +
            (d.wake ? (ok ? ", on target" : ", late") : ""),
          '<span class="acts"><input type="time" data-c="wake" value="' +
            d.wake +
            '" aria-label="Wake time"><button class="btn alt" data-a="wnow">Now</button></span>',
        ) +
          (LEDIT ? ieStrip("wake", 1) : "") +
          HD(
            "meds",
            row(LB("meds", "Medication"), "", tgl("tg", "meds", null, d.meds)),
          ) +
          HD(
            "ex",
            row(LB("ex", "Home exercises"), "", tgl("tg", "ex", null, d.ex)),
          ) +
          HD(
            "pt",
            row(
              LB("pt", "Physical therapy today"),
              "",
              tgl("tg", "pt", null, d.pt),
            ),
          ) +
          HD(
            "sleep",
            stp(
              LB("sleep", "Sleep last night"),
              "sleep",
              0.5,
              "Target " + s.sleep + " h",
              "hours",
            ),
          ) +
          HD(
            "bed",
            row(
              LB("bed", "Bedtime last night"),
              "Target " +
                fmt(bedT(k)) +
                (d.bed ? (bedLate(d, k) > 0 ? ", late" : ", on target") : ""),
              '<input type="time" data-c="bed" value="' +
                (d.bed || "") +
                '" aria-label="Bedtime">',
            ),
          ),
      );
    }
    if (id === "faith") {
      var sd = d.sn || [],
        stot = 0,
        sdone = 0,
        T2 = times(k),
        pcs = "",
        out2 = "";
      SUNN.forEach(function (u) {
        var c = s.sn[u.i];
        if (c > 0) {
          stot += c;
          if (sd[u.i]) sdone += c;
        }
      });
      PN.forEach(function (nm, i) {
        var bef = SUNN.filter(function (u) {
            return u.p === i && u.pos === "Before";
          }),
          aft = SUNN.filter(function (u) {
            return u.p === i && u.pos !== "Before";
          }),
          chip = function (u) {
            var c = s.sn[u.i];
            return c > 0
              ? '<button class="sn" data-a="sn" data-i="' +
                  u.i +
                  '" aria-pressed="' +
                  (sd[u.i] ? "true" : "false") +
                  '">' +
                  u.pos +
                  " " +
                  c +
                  "</button>"
              : "";
          };
        pcs +=
          '<div class="pcard"><div class="ph"><b>' +
          nm +
          (i === 1 && parse(k).getDay() === 5 ? " / Jumu’ah" : "") +
          "</b><small>" +
          fmt(T2[i]) +
          '</small></div><div class="pr">' +
          bef.map(chip).join("") +
          '<button class="fd" data-a="pr" data-i="' +
          i +
          '" aria-pressed="' +
          (d.p[i] ? "true" : "false") +
          '">' +
          (d.p[i] ? "✓ " : "") +
          "Fard</button>" +
          aft.map(chip).join("") +
          "</div></div>";
      });
      h =
        pcs +
        '<div class="add" style="padding-bottom:4px"><button class="btn alt" data-a="all5">Mark all five fard</button></div><p class="note" style="margin:0 0 10px">Sunnah ' +
        sdone +
        " of " +
        stot +
        " rak’at.</p>";
      if (m.faith) {
        out2 = box(
          "Quran and adhkar",
          HD(
            "q",
            stp(
              LB("q", "Quran read"),
              "q",
              5,
              s.qm > 0 ? "Target " + s.qm + " min" : "",
              "min",
            ) +
              (s.qp > 0
                ? stp("Quran pages", "qp", 1, "Target " + s.qp, "pages")
                : ""),
          ) +
            HD(
              "am",
              row(LB("am", "Morning adhkar"), "", tgl("ad", null, 0, ad[0])),
            ) +
            HD(
              "pm",
              row(LB("pm", "Evening adhkar"), "", tgl("ad", null, 1, ad[1])),
            ) +
            (parse(k).getDay() === 5
              ? row(
                  "Jumu’ah and Surah Al-Kahf",
                  "",
                  tgl("tg", "jm", null, d.jm),
                )
              : ""),
        );
      }
      return box("Prayers", h) + out2;
    }
    if (id === "focus") {
      if (isRest(k))
        return box(
          "Focus",
          '<div class="pad mut">Rest day. No focus target today.</div>',
        );
      var fs = d.fs || [];
      return box(
        "Focus",
        '<div class="pad"><b>' +
          fm +
          " of " +
          F +
          ' minutes</b><div class="bar"><i style="width:' +
          Math.min(100, Math.round((fm / F) * 100)) +
          '%"></i></div></div>' +
          (LEDIT ? ieStrip("focus", 1) : "") +
          (fs.length
            ? fs
                .map(function (x, j) {
                  return row(
                    esc(x.x || "Focus"),
                    x.t + ", " + x.m + " min",
                    del("delfs", j, "Delete"),
                  );
                })
                .join("")
            : '<div class="pad mut">No sessions yet.</div>') +
          '<div class="pad"><select id="fsx" style="width:100%" aria-label="Topic">' +
          topicOpts() +
          '</select><div class="qc" style="padding-bottom:0">' +
          [15, 25, 45, 60]
            .map(function (x) {
              return (
                '<button data-a="fq" data-i="' + x + '">+' + x + " min</button>"
              );
            })
            .join("") +
          '</div></div><div class="add" style="padding-top:0"><input type="number" class="num" id="fsm" inputmode="numeric" placeholder="min" aria-label="Minutes"><button class="btn" data-a="addfs">Add custom</button></div>',
      );
    }
    if (id === "body") {
      var wn = s.water,
        g = "";
      for (i = 1; i <= wn; i++)
        g +=
          '<button class="gl" data-a="wset" data-i="' +
          i +
          '" aria-pressed="' +
          ((d.water || 0) >= i ? "true" : "false") +
          '" aria-label="Glass ' +
          i +
          '"></button>';
      return box(
        "Body",
        '<div class="pad"><b>Water, ' +
          (d.water || 0) +
          " of " +
          wn +
          ' glasses</b><div class="glasses">' +
          g +
          "</div></div>" +
          (LEDIT ? ieStrip("water", 1) : "") +
          HD(
            "sp",
            row(LB("sp", "Home workout"), "", tgl("tg", "sp", null, d.sp)) +
              stp(
                "Workout length",
                "spm",
                5,
                s.wm > 0 ? "Target " + s.wm + " min" : "Minutes",
                "min",
              ),
          ) +
          HD("br", ctr(LB("br", "Breathing sessions"), "br", s.bn, "5 min")),
      );
    }
    if (id === "mind")
      return box(
        "Mind",
        '<div class="pad">' +
          scw("Mood", "mood", ["Low", "Down", "Okay", "Good", "Great"]) +
          scw("Nervousness", "nv", [
            "Calm",
            "Light",
            "Tense",
            "High",
            "Severe",
          ]) +
          scw("Neck and back pain", "pain", [
            "None",
            "Mild",
            "Medium",
            "High",
            "Severe",
          ]) +
          '<label class="note" for="jn" style="margin:16px 0 6px"><b>Journal</b></label><textarea id="jn" data-c="jn" rows="5" maxlength="1500">' +
          esc(d.jn || "") +
          "</textarea></div>",
      );
    if (id === "screens")
      return box(
        "Screens",
        HD(
          "phone",
          stp(
            LB("phone", "Phone screen time"),
            "phone",
            10,
            "Limit " +
              s.phone +
              " min" +
              (d.phone ? (d.phone <= s.phone ? ", under" : ", over") : ""),
            "min",
          ),
        ) +
          HD(
            "games",
            stp(
              LB("games", "Games"),
              "leis",
              10,
              "Limit " +
                s.games +
                " min" +
                (d.leis ? (d.leis <= s.games ? ", under" : ", over") : ""),
              "min",
            ),
          ) +
          HD("pz", ctr(LB("pz", "Chess puzzles"), "pz", s.pn, "")),
      );
    return "";
  }
  var LEDIT = false,
    CXT = { y: "Yes or no", c: "Counter", n: "Number", s: "Scale 1 to 5" },
    REG = regBuild();
  var EDID = "",
    TK = {
      sleep: "sleep",
      phone: "phone",
      games: "games",
      q: "qm",
      sp: "wm",
      br: "bn",
      pz: "pn",
      water: "water",
      focus: "focus",
    },
    TU = {
      sleep: "hours",
      phone: "min",
      games: "min",
      q: "min",
      sp: "min",
      br: "sessions",
      pz: "puzzles",
      water: "glasses",
      focus: "min",
    },
    TREQ = { sleep: 1, phone: 1, games: 1, water: 1, focus: 1 },
    NOREN = { wake: 1, water: 1, focus: 1 };
  function LB(id, d) {
    return esc((appState.state.lbl && appState.state.lbl[id]) || d);
  }
  function regName(id) {
    var n = "";
    Object.keys(REG).forEach(function (z) {
      REG[z].forEach(function (r) {
        if (r[0] === id) n = r[1];
      });
    });
    return n;
  }
  function ieStrip(id, keep) {
    if (EDID === id) {
      var f = "";
      if (!NOREN[id])
        f +=
          '<label class="ie-l">Name<input type="text" id="ien" maxlength="40" value="' +
          esc((appState.state.lbl && appState.state.lbl[id]) || regName(id)) +
          '" aria-label="Name"></label>';
      if (id === "wake")
        f +=
          '<label class="ie-l">Wake target, days off, blank = automatic<input type="time" id="iet" value="' +
          esc(appState.state.set.wku || "") +
          '" aria-label="Wake target days off"></label><label class="ie-l">Wake target, work days, blank = automatic<input type="time" id="iet2" value="' +
          esc(appState.state.set.wkw || "") +
          '" aria-label="Wake target work days"></label>';
      else if (TK[id])
        f +=
          '<label class="ie-l">Target, ' +
          TU[id] +
          (TREQ[id] ? "" : ", 0 = none") +
          '<input type="number" class="num" id="iet" inputmode="decimal" min="0" value="' +
          appState.state.set[TK[id]] +
          '" aria-label="Target"></label>';
      if (id === "q")
        f +=
          '<label class="ie-l">Pages per day, 0 = off<input type="number" class="num" id="ieq" inputmode="numeric" min="0" value="' +
          (appState.state.set.qp || 0) +
          '" aria-label="Pages target"></label>';
      return (
        '<div class="ie-f">' +
        f +
        '<div class="ie-b"><button class="btn" data-a="iesave" data-i="' +
        id +
        '">Save</button><button class="btn alt" data-a="ied" data-i="' +
        id +
        '">Cancel</button></div></div>'
      );
    }
    return (
      '<div class="ie"><button data-a="ied" data-i="' +
      id +
      '">Edit</button>' +
      (keep
        ? ""
        : '<button data-a="hide" data-i="' + id + '">Remove</button>') +
      "</div>"
    );
  }
  function HD(id, h) {
    var hid = appState.state.hide && appState.state.hide[id];
    if (!hid) return LEDIT ? h + ieStrip(id) : h;
    return LEDIT
      ? '<div class="row ie-off"><span>' +
          LB(id, regName(id)) +
          '<small>Removed</small></span><button class="btn alt" data-a="unhide" data-i="' +
          id +
          '">Restore</button></div>'
      : "";
  }
  function cxStrip(c) {
    if (EDID === c.id) {
      var f =
        '<label class="ie-l">Name<input type="text" id="ien" maxlength="40" value="' +
        esc(c.l) +
        '" aria-label="Name"></label>';
      if (c.k === "c" || c.k === "n")
        f +=
          '<label class="ie-l">Target, 0 = none<input type="number" class="num" id="iet" inputmode="decimal" min="0" value="' +
          (c.tg || 0) +
          '" aria-label="Target"></label>';
      f +=
        '<label class="ie-ck"><input type="checkbox" id="iesc"' +
        (c.sc ? " checked" : "") +
        "> Count in score</label>";
      return (
        '<div class="ie-f">' +
        f +
        '<div class="ie-b"><button class="btn" data-a="cxsave" data-i="' +
        c.id +
        '">Save</button><button class="btn alt" data-a="ied" data-i="' +
        c.id +
        '">Cancel</button></div></div>'
      );
    }
    return (
      '<div class="ie"><button data-a="ied" data-i="' +
      c.id +
      '">Edit</button><button data-a="cxdel" data-i="' +
      c.id +
      '">Delete</button></div>'
    );
  }
  function cxAdd(id) {
    return box(
      "Add input",
      '<div class="ie-f"><input type="text" id="cxl-' +
        id +
        '" placeholder="New input name" maxlength="40" aria-label="Name"><div class="ie-r"><select id="cxk-' +
        id +
        '" aria-label="Type">' +
        Object.keys(CXT)
          .map(function (x) {
            return '<option value="' + x + '">' + CXT[x] + "</option>";
          })
          .join("") +
        '</select><input type="number" class="num" id="cxg-' +
        id +
        '" inputmode="decimal" min="0" placeholder="Target" aria-label="Target"></div><label class="ie-ck"><input type="checkbox" id="cxsc-' +
        id +
        '" checked> Count in score</label><div class="ie-b"><button class="btn" data-a="cxadd" data-i="' +
        id +
        '">Add</button></div></div>',
    );
  }
  function cxV(c, k) {
    var x = D(k).cx;
    return x ? x[c.id] : undefined;
  }
  function cxF(c, k) {
    var v = +cxV(c, k) || 0;
    if (c.k === "y") return v ? 1 : 0;
    if (c.k === "s") return Math.min(1, v / 5);
    return c.tg > 0 ? Math.min(1, v / c.tg) : v ? 1 : 0;
  }
  function cxRow(c, k) {
    var v = +cxV(c, k) || 0,
      l = esc(c.l),
      sb = c.tg ? "Target " + c.tg : "",
      i,
      h;
    if (c.k === "y") return row(l, "", tgl("cxt", c.id, null, v));
    if (c.k === "c")
      return row(
        l,
        sb,
        '<span class="stp"><button data-a="cxc" data-k="' +
          c.id +
          '" data-i="-1" aria-label="Less">\u2212</button><input type="number" class="num" inputmode="decimal" min="0" data-c="cxn" data-k="' +
          c.id +
          '" value="' +
          (v || "") +
          '" placeholder="0" aria-label="' +
          l +
          '"><button data-a="cxc" data-k="' +
          c.id +
          '" data-i="1" aria-label="More">+</button></span>',
      );
    if (c.k === "n")
      return row(
        l,
        sb,
        '<span class="stp"><input type="number" class="num" inputmode="decimal" min="0" data-c="cxn" data-k="' +
          c.id +
          '" value="' +
          (v || "") +
          '" placeholder="0" aria-label="' +
          l +
          '"></span>',
      );
    h = '<div class="scale">' + l + '<div class="chips">';
    for (i = 1; i <= 5; i++)
      h +=
        '<button class="chip" data-a="cxs" data-k="' +
        c.id +
        '" data-i="' +
        i +
        '" aria-pressed="' +
        (v === i ? "true" : "false") +
        '">' +
        i +
        "</button>";
    return h + "</div></div>";
  }
  function secBody(id, k) {
    var h = secBody0(id, k),
      cs = (appState.state.cx || []).filter(function (c) {
        return c.sec === id;
      });
    if (cs.length)
      h +=
        '<div class="box">' +
        cs
          .map(function (c) {
            return cxRow(c, k) + (LEDIT ? cxStrip(c) : "");
          })
          .join("") +
        "</div>";
    if (LEDIT) h += cxAdd(id);
    return h;
  }
  function lscroll() {
    var e = document.querySelector(".ls.open .lh");
    if (e) e.scrollIntoView({ block: "start" });
  }
  var LGRP = [
    ["Start", ["morning", "work"]],
    ["Faith", ["faith"]],
    ["Body and mind", ["focus", "body", "mind"]],
    ["Limits", ["screens"]],
  ];
  var LGT = null;
  function lgStrip(list, pr) {
    var o = '<div class="lgtabs" role="group" aria-label="Log sections">';
    LGRP.forEach(function (g) {
      var ids = g[1].filter(function (id) {
        return list.indexOf(id) >= 0;
      });
      if (!ids.length) return;
      var nl = ids.filter(function (id) {
          var p = pr[id],
            q = p[1] ? Math.round((100 * p[0]) / p[1]) : 100;
          return q < 100;
        }).length,
        tid = "lg-" + g[0].toLowerCase().replace(/\W+/g, "-"),
        on = LGT === tid;
      o +=
        '<button class="lgtab" data-a="lgtab" data-i="' +
        tid +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '"><b>' +
        g[0] +
        "</b><small>" +
        (nl ? nl + " left" : "Done") +
        "</small></button>";
    });
    return o + "</div>";
  }
  function lgg(id, t, meta, inner) {
    return LGT === id ? '<div class="lgbody">' + inner + "</div>" : "";
  }

  function focusBox() {
    var t = TM,
      k = iso(new Date()),
      e = telapsed(t),
      tx = t.x || topics()[0],
      pct = Math.min(
        100,
        Math.round(((fsum(D(k)) + e / 6e4) / fgoal(k)) * 100),
      );
    return box(
      "Focus timer",
      '<div class="pad"><select id="ftop" data-c="ftopic" aria-label="Topic" style="width:100%">' +
        topics()
          .concat(["Other study"])
          .map(function (o) {
            return (
              "<option" +
              (o === tx ? " selected" : "") +
              ">" +
              esc(o) +
              "</option>"
            );
          })
          .join("") +
        '</select><div class="tnum" id="ftime" style="font-size:44px;text-align:center">' +
        mmss(e) +
        '</div><div class="bar"><i id="fbar" style="width:' +
        pct +
        '%"></i></div><p class="note" id="fnz" style="margin:8px 0 0"></p></div><div class="ctl"><button class="btn" data-a="' +
        (t.on ? "fpause" : "fstart") +
        '">' +
        (t.on ? "Pause" : e > 0 ? "Resume" : "Start") +
        "</button>" +
        (e > 0
          ? '<button class="btn alt" data-a="ffinish">Save</button><button class="btn alt" data-a="freset">Reset</button>'
          : "") +
        "</div>",
    );
  }
  var LRT = "week";
  function lrnNav() {
    var w = appState.state.learn.w;
    return (
      '<div class="pc-nav"><button data-a="lmv" data-i="-1" aria-label="Earlier week"' +
      (w <= 0 ? " disabled" : "") +
      '>‹</button><div class="pc-lab"><span>Week ' +
      (w + 1) +
      " of 24</span><small>" +
      esc(phase(w)) +
      '</small></div><button data-a="lmv" data-i="1" aria-label="Later week"' +
      (w >= 23 ? " disabled" : "") +
      ">›</button></div>"
    );
  }
  function lrnSec(done, pct, name, meta, body) {
    return (
      '<section class="lsx' +
      (done ? " done" : "") +
      '"><div class="lsh"><span class="ls-star">' +
      (done ? star(100, 28, 0, "var(--basalt)", "none") : star(pct, 28, 2.6)) +
      '</span><span class="ln"><b>' +
      name +
      "</b><small>" +
      meta +
      '</small></span></div><div class="lb">' +
      body +
      "</div></section>"
    );
  }

  var WVIEW = "week",
    WRT = "wk-review";
  function wlabel(ws) {
    var a = parse(ws),
      b = parse(weekDays(ws)[6]);
    return (
      a.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
      " to " +
      b.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );
  }
  function reportMd(r) {
    var L = [
      "# Week report: " + wlabel(r.ws),
      "",
      r.head,
      "",
      "- Effort " +
        r.eff +
        "%" +
        (r.wel !== null ? ", wellbeing " + r.wel + "%" : ""),
      "- Focus " + dur(r.focus) + " of " + dur(r.fgoal),
      "- Prayers " + r.pr + " of " + r.n * 5,
      "- PT sessions " + r.pt,
      "- Solid days " + r.solid + " of " + r.n,
      "",
      "## Days",
    ];
    r.days.forEach(function (x) {
      L.push(
        "- " +
          x.k +
          ": " +
          (x.fut
            ? "upcoming"
            : x.opn
              ? "in progress"
              : x.has
                ? x.sc + "%, focus " + x.fm + " min, prayers " + x.pr + "/5"
                : "not logged"),
      );
    });
    if (r.wins.length) {
      L.push("", "## Went well");
      r.wins.forEach(function (x) {
        L.push("- " + x.l + " (" + x.p + "%)");
      });
    }
    if (r.fixes.length) {
      L.push("", "## Needs attention");
      r.fixes.forEach(function (x) {
        L.push("- " + x.l + " (" + x.p + "%)");
      });
    }
    if (r.next.length) {
      L.push("", "## Next week");
      r.next.forEach(function (x) {
        L.push("- " + x);
      });
    }
    var wk = appState.state.weeks[r.ws];
    if (wk) {
      L.push("", "## Goals");
      wk.g.forEach(function (g, i) {
        if (g) L.push("- [" + (wk.gd[i] ? "x" : " ") + "] " + g);
      });
      if (wk.win) L.push("", "What worked: " + wk.win);
      if (wk.fix) L.push("", "Change: " + wk.fix);
    }
    var R = r.rec || weekRec(r.ws),
      q = [],
      m;
    if (R.sl.length)
      q.push(
        "Sleep avg " +
          r1(avgN(R.sl)) +
          " h, " +
          R.slOk +
          " of " +
          R.sl.length +
          " nights at target",
      );
    if (R.wa.length)
      q.push(
        "Water avg " +
          r1(avgN(R.wa)) +
          ", goal met " +
          R.waOk +
          " of " +
          R.wa.length +
          " days",
      );
    if (R.sp)
      q.push("Home workouts " + R.sp + (R.spm ? " (" + R.spm + " min)" : ""));
    if (R.br) q.push("Breathing " + R.br + " days");
    if (R.jn) q.push("Journal " + R.jn + " days");
    if (R.qd) q.push("Quran " + R.q + " min over " + R.qd + " days");
    if (R.am + R.pm) q.push("Adhkar morning " + R.am + ", evening " + R.pm);
    if (R.ph.length)
      q.push(
        "Phone avg " +
          Math.round(avgN(R.ph)) +
          " min, under limit " +
          R.phOk +
          " of " +
          R.ph.length +
          " days",
      );
    if ((m = avgN(R.mo)) !== null) q.push("Mood " + r1(m) + " of 5");
    if (R.wk.length)
      q.push(
        "Wake avg " +
          fmt(avgN(R.wk)) +
          ", on time " +
          R.wkOk +
          " of " +
          R.wk.length,
      );
    (appState.state.cx || []).forEach(function (c) {
      var a = (R.cx || {})[c.id];
      if (a && a.dy)
        q.push(
          c.l +
            " " +
            (c.k === "y"
              ? a.dy + " days"
              : c.k === "s"
                ? r1(a.s / a.dy) + " of 5"
                : r1(a.s) +
                  (c.tg > 0 ? ", on target " + a.hit + " of " + a.dy : "")),
        );
    });
    if (q.length) {
      L.push("", "## Records");
      q.forEach(function (x) {
        L.push("- " + x);
      });
    }
    return L.join("\n");
  }

  function grp(id, t, inner, note, def) {
    var o = appState.state.ui && appState.state.ui[id];
    if (o === undefined) o = def ? 1 : 0;
    return (
      '<details class="grp" data-g="' +
      id +
      '"' +
      (o ? " open" : "") +
      "><summary>" +
      t +
      "</summary>" +
      (note ? '<p class="note">' + note + "</p>" : "") +
      '<div class="box">' +
      inner +
      "</div></details>"
    );
  }
  function sbox(t, inner, note) {
    return grp(
      "s-" + t.toLowerCase().replace(/[^a-z]+/g, "-"),
      t,
      inner,
      note,
      t === "Daily targets" || t === "Look",
    );
  }
  document.addEventListener(
    "toggle",
    function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains("grp")) {
        appState.state.ui = appState.state.ui || {};
        appState.state.ui[t.dataset.g] = t.open ? 1 : 0;
        save();
      }
    },
    true,
  );
  function sxg(id, t, meta, inner, def) {
    var o = appState.state.ui && appState.state.ui[id];
    if (o === undefined) o = def ? 1 : 0;
    return (
      '<details class="grp sx" data-g="' +
      id +
      '"' +
      (o ? " open" : "") +
      "><summary><span>" +
      t +
      "</span>" +
      (meta ? '<em class="sx-meta">' + meta + "</em>" : "") +
      '</summary><div class="box sx-box">' +
      inner +
      "</div></details>"
    );
  }
  function cnt(n, w) {
    return n + " " + w + (n === 1 ? "" : "s");
  }

  function pilOf(id) {
    return /^p[0-4]$|^(jm|q|am|pm)$/.test(id)
      ? "Faith"
      : /^(sleep|wake|water|sp|br|ex|meds|pain|work)$/.test(id)
        ? "Body"
        : /^(mood|calm|jn|cx.*)$/.test(id)
          ? "Mind"
          : /^(focus|phone|games|pz)$/.test(id)
            ? "Focus"
            : "";
  }
  function wkTile(v, l) {
    return '<div class="pl-t"><b>' + v + "</b><span>" + l + "</span></div>";
  }
  function secPil(r, pe, R, ws, td) {
    var cur = ws === weekDays(td)[0],
      tg = 0,
      lf = 0,
      rk = r.rk || [],
      T = { Faith: [], Body: [], Mind: [], Focus: [] },
      ps = {},
      ok = {},
      ex = "",
      ph = (R.ph || []).filter(function (x) {
        return x <= 1440;
      }),
      phOk = ph.filter(function (x) {
        return x <= appState.state.set.phone;
      }).length,
      a = function (n, v, l) {
        T[n].push(wkTile(v, l));
      },
      sa = avgN(R.sl),
      wa = avgN(R.wa),
      fam = (appState.state.cx || []).filter(function (c) {
        return /family/i.test(c.l);
      })[0],
      drag = function (n) {
        var w = null;
        rk.forEach(function (q) {
          if (pilOf(q[0]) === n && q[1] < 70 && (!w || q[1] < w[1])) w = q;
        });
        return w ? "Biggest drag: " + idName(w[0]) : "Steady";
      };
    weekDays(ws).forEach(function (k) {
      if (!isRest(k)) {
        tg += fgoal(k);
        if (k >= td) lf++;
      }
    });
    a("Faith", R.am + R.pm + " of " + R.n * 2, "Adhkar");
    a("Faith", r.sn || 0, "Sunnah rak’at");
    if (!hidn("q")) a("Faith", cnt(R.qd, "day"), "Quran");
    if (sa !== null && !hidn("sleep"))
      a(
        "Body",
        r1(sa) + "h",
        "Sleep · " + R.slOk + " of " + R.sl.length + " on target",
      );
    if (wa !== null && !hidn("water"))
      a(
        "Body",
        r1(wa),
        "Water · " + R.waOk + " of " + R.wa.length + " on goal",
      );
    if (!hidn("sp"))
      a("Body", R.sp, "Workouts" + (R.spm ? " · " + R.spm + " min" : ""));
    if (!hidn("ex")) a("Body", cnt(R.ex, "day"), "Physical exercises");
    if (!hidn("br")) a("Body", cnt(R.br, "day"), "Breathing");
    if (R.pn.length && !hidn("pain"))
      a("Body", r1(avgN(R.pn)), "Low pain, of 5");
    if (R.mo.length && !hidn("mood")) a("Mind", r1(avgN(R.mo)), "Mood, of 5");
    if (R.nv.length && !hidn("calm")) a("Mind", r1(avgN(R.nv)), "Calm, of 5");
    if (!hidn("jn")) a("Mind", cnt(R.jn, "day"), "Journal");
    if (fam && R.cx[fam.id]) a("Mind", cnt(R.cx[fam.id].dy, "day"), esc(fam.l));
    a("Focus", dshort(r.focus), "Focus" + (tg ? " · goal " + dshort(tg) : ""));
    if (ph.length && !hidn("phone"))
      a(
        "Focus",
        Math.round(avgN(ph)) + "m",
        "Phone avg · " + phOk + " of " + ph.length + " under limit",
      );
    ps.Faith = r.pr + " of " + r.n * 5 + " prayers";
    ok.Faith = r.pr >= Math.round(r.n * 4.5);
    ps.Body = drag("Body");
    ok.Body = !(
      (sa !== null && sa < appState.state.set.sleep) ||
      (wa !== null && wa < appState.state.set.water)
    );
    ps.Mind = drag("Mind");
    ok.Mind = r.cats.Mind >= 65;
    ps.Focus =
      cur && lf && tg > r.focus
        ? "Needs " +
          dshort(Math.ceil((tg - r.focus) / lf)) +
          " a day, " +
          lf +
          " days left"
        : r.fgoal
          ? dshort(r.focus) + " of " + dshort(r.fgoal)
          : "";
    ok.Focus = r.focus >= r.fgoal;
    return (
      "<h2>Pillars</h2>" +
      ["Faith", "Body", "Mind", "Focus"]
        .map(function (n) {
          var p = r.cats[n],
            x =
              pe && pe.cats && pe.cats[n] != null
                ? Math.round(p - pe.cats[n])
                : 0;
          return sxg(
            "wp-" + n,
            n,
            p + "%" + (x ? " " + (x > 0 ? "+" : "−") + Math.abs(x) : ""),
            '<div class="pl-bar"><i style="width:' +
              p +
              '%"></i></div><div class="pl-ps"><span>' +
              ps[n] +
              '</span><span class="pl-tg' +
              (ok[n] ? "" : " bh") +
              '">' +
              (ok[n] ? (cur ? "On pace" : "Solid") : cur ? "Behind" : "Weak") +
              '</span></div><div class="pl-g">' +
              T[n].join("") +
              "</div>" +
              (n === "Mind" ? ex : ""),
            !ok[n],
          );
        })
        .join("")
    );
  }
  function secNxt(r, R) {
    var C = [],
      S0 = appState.state.set,
      sa = avgN(R.sl),
      wa = avgN(R.wa),
      ph = (R.ph || []).filter(function (x) {
        return x <= 1440;
      }),
      pa = avgN(ph),
      wp = null;
    (r.rk || []).forEach(function (q) {
      if (/^p[0-4]$/.test(q[0]) && (!wp || q[1] < wp[1])) wp = q;
    });
    if (sa !== null && sa < S0.sleep && !hidn("sleep"))
      C.push([
        (S0.sleep - sa) / S0.sleep,
        "Sleep averaged " + r1(sa) + "h against " + S0.sleep + "h",
        ADVI.sleep,
      ]);
    if (wa !== null && wa < S0.water && !hidn("water"))
      C.push([
        (S0.water - wa) / S0.water,
        "Water averaged " + r1(wa) + " against " + S0.water,
        ADVI.water,
      ]);
    if (r.fgoal > 0 && r.focus < r.fgoal)
      C.push([
        1 - r.focus / r.fgoal,
        "Focus reached " +
          Math.round((100 * r.focus) / r.fgoal) +
          "% of its goal",
        ADVI.focus,
      ]);
    if (pa !== null && pa > S0.phone && !hidn("phone"))
      C.push([
        Math.min(1, (pa - S0.phone) / S0.phone),
        "Phone averaged " + Math.round(pa) + " min against " + S0.phone,
        ADVI.phone,
      ]);
    if (r.pr < r.n * 5)
      C.push([
        (r.n * 5 - r.pr) / (r.n * 5),
        "Missed " + (r.n * 5 - r.pr) + " prayers",
        wp ? ADVI[wp[0]] : "",
      ]);
    if (!hidn("sp") && R.n > 2 && R.sp === 0)
      C.push([0.5, "No workout this week", ADVI.sp]);
    C.sort(function (p, q) {
      return q[0] - p[0];
    });
    return box(
      "Next week",
      C.length
        ? C.slice(0, 3)
            .map(function (x) {
              return row(x[1], x[2]);
            })
            .join("")
        : '<div class="pad mut">Nothing to fix. Keep the same rhythm.</div>',
    );
  }

  var TGR = [
    ["water", "swa", "Water, glasses", "water"],
    ["sleep", "ssl", "Sleep, hours", "sleep"],
    ["phone", "sph", "Phone limit, min", "phone"],
    ["games", "sgm", "Games limit, min", "games"],
    ["focus", "sfc", "Focus per day, min", "focus"],
    ["sp", "swm", "Home workout, min", "wm", "0 = any length counts"],
    ["q", "sqm", "Quran, min per day", "qm", "0 = no minutes target"],
    ["q", "sqp", "Quran, pages per day", "qp", "0 = pages not tracked"],
    ["br", "sbn", "Breathing sessions per day", "bn", "0 = one session counts"],
    ["pz", "spn", "Chess puzzles per day", "pn", "0 = any amount counts"],
  ];
  function tgRows(s, f) {
    var m = s.mods || {},
      h = "";
    TGR.forEach(function (t) {
      var id = t[0];
      if (hidn(id)) return;
      if ((id === "phone" || id === "games" || id === "pz") && !m.digital)
        return;
      if (id === "q" && !m.faith) return;
      h += f(t[2], t[1], s[t[3]], t[4]);
    });
    h +=
      row(
        "Wake time, days off",
        "Blank = automatic",
        '<input type="time" id="swk" value="' +
          esc(s.wku || "") +
          '" aria-label="Wake time days off">',
      ) +
      row(
        "Wake time, work days",
        "Blank = from work start and commute",
        '<input type="time" id="swkw" value="' +
          esc(s.wkw || "") +
          '" aria-label="Wake time work days">',
      );
    (appState.state.cx || []).forEach(function (c) {
      if (c.k === "c" || c.k === "n")
        h += row(
          esc(c.l),
          "0 = none",
          '<input type="number" class="num" id="cxt-' +
            c.id +
            '" value="' +
            (c.tg || 0) +
            '" min="0" inputmode="decimal" aria-label="' +
            esc(c.l) +
            ' target">',
        );
    });
    return (
      h +
      row(
        "Rest day",
        "No focus target that day",
        '<select id="srs" aria-label="Rest day">' +
          DN.map(function (n, i) {
            return (
              '<option value="' +
              i +
              '"' +
              (s.rest === i ? " selected" : "") +
              ">" +
              n +
              "</option>"
            );
          }).join("") +
          "</select>",
      )
    );
  }
  function adpView() {
    var k = iso(new Date()),
      DT = { j: "job days", f: "Fridays", o: "off days" },
      NM = {
        wake: "Wake routine",
        f1: "Focus session",
        f2: "Second focus",
        sp: "Workout",
        br: "Breathing",
        care: "Back exercises",
        str: "Stretch",
        q: "Quran",
        am: "Morning adhkar",
        pm: "Evening adhkar",
        jm: "Jumu’ah",
        w: "Water",
        pz: "Chess puzzles",
        bed: "Wind down",
        mo: "Spending",
        fam: "Family time",
        co: "Close-out",
      },
      nm = function (x) {
        return (
          NM[x] ||
          (x.indexOf("gl:") === 0
            ? "Weekly goal"
            : x.indexOf("tk:") === 0 || x.indexOf("px:") === 0
              ? x.slice(3)
              : x)
        );
      },
      A = appState.state.adp || {},
      rs = Object.keys(A)
        .filter(function (id) {
          return id.split("|")[0] !== "ws";
        })
        .map(function (id) {
          var p = id.split("|"),
            r = A[id];
          return {
            n: nm(p[0]),
            d: DT[p[1]] || "",
            r: r,
            t: r.dn + r.dx + r.ms,
          };
        }),
      box = function (t, a, f) {
        return a.length
          ? '<div class="pad"><small class="mut">' +
              t +
              "</small></div>" +
              a.map(f).join("")
          : "";
      },
      h = "",
      pc = function (x) {
        return Math.round((100 * x.r.dn) / x.t) + "% done";
      },
      pt = adpPat(k);
    h += box(
      "Hidden for now",
      rs.filter(function (x) {
        return x.r.hu > k;
      }),
      function (x) {
        return row(
          esc(x.n),
          x.d,
          '<span class="mut">until ' +
            parse(x.r.hu).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            }) +
            "</span>",
        );
      },
    );
    h += box(
      "Works for you",
      rs
        .filter(function (x) {
          return x.t >= 4 && x.r.dn / x.t >= 0.6;
        })
        .sort(function (a, b) {
          return b.r.dn / b.t - a.r.dn / a.t;
        })
        .slice(0, 3),
      function (x) {
        return row(esc(x.n), x.d, '<span class="mut">' + pc(x) + "</span>");
      },
    );
    h += box(
      "Often skipped",
      rs
        .filter(function (x) {
          return x.t >= 4 && x.r.dn / x.t < 0.4;
        })
        .sort(function (a, b) {
          return a.r.dn / a.t - b.r.dn / b.t;
        })
        .slice(0, 3),
      function (x) {
        return row(esc(x.n), x.d, '<span class="mut">' + pc(x) + "</span>");
      },
    );
    h += box(
      "Your usual times",
      rs.filter(function (x) {
        return x.r.tm.length >= 4;
      }),
      function (x) {
        return row(
          esc(x.n),
          x.d,
          '<span class="mut">about ' + fmt(adpMed(x.r.tm)) + "</span>",
        );
      },
    );
    h += box("Patterns in your tasks", pt, function (q) {
      return row(esc(q.x), q.why, '<span class="mut">' + fmt(q.m) + "</span>");
    });
    return sbox(
      "Suggestion learning",
      h ||
        '<div class="pad mut">Nothing learned yet. It needs 4 actions on a suggestion.</div>',
    );
  }
  function areaSettings() {
    var daily = [
        ["morning", "Morning", "Wake, sleep, and routines"],
        ["focus", "Focus", "Daily focus target"],
        ["body", "Body", "Movement and hydration"],
        ["mind", "Mind", "Mood and reflection"],
      ],
      optional = [
        ["faith", "Faith and adhkar", "Prayer routine and adhkar"],
        ["work", "Workday", "Schedule, time, and tasks"],
        ["learn", "Learning", "Study plan and goals"],
        ["money", "Money", "Income, spending, and savings"],
        ["digital", "Screen time", "Phone and games"],
      ];
    var rows = function (L) {
      return L.map(function (x) {
        return row(
          x[1],
          x[2],
          '<input type="checkbox" data-area="' +
            x[0] +
            '"' +
            (areaOn(x[0]) ? " checked" : "") +
            ' style="width:28px;height:28px" aria-label="Track ' +
            x[1] +
            '">',
        );
      }).join("");
    };
    return (
      '<p class="setup-group">Daily sections</p>' +
      rows(daily) +
      '<p class="setup-group">Optional areas</p>' +
      rows(optional) +
      '<p class="note">Turning an area off hides it from the daily log and its menu. Saved entries stay on this device.</p>'
    );
  }

  var AKL = new Date().getHours() < 12 ? "m" : "e",
    AKF = 24,
    AKS = {
      k: [
        "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
        "Ayat al-Kursi, Quran 2:255",
        1,
      ],
      i: [
        "قُلْ هُوَ اللَّهُ أَحَدٌ<br>اللَّهُ الصَّمَدُ<br>لَمْ يَلِدْ وَلَمْ يُولَدْ<br>وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
        "Al-Ikhlas, Quran 112",
        3,
      ],
      f: [
        "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ<br>مِنْ شَرِّ مَا خَلَقَ<br>وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ<br>وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ<br>وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
        "Al-Falaq, Quran 113",
        3,
      ],
      n: [
        "قُلْ أَعُوذُ بِرَبِّ النَّاسِ<br>مَلِكِ النَّاسِ<br>إِلَٰهِ النَّاسِ<br>مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ<br>الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ<br>مِنَ الْجِنَّةِ وَالنَّاسِ",
        "An-Nas, Quran 114",
        3,
      ],
      b: [
        "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        "In the name of Allah, with whose name nothing on earth or in heaven can harm",
        3,
      ],
      h: [
        "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
        "Allah is enough for me. There is no god but Him. In Him I trust, and He is Lord of the Mighty Throne",
        7,
      ],
      s: [
        "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        "Sayyid al-Istighfar, the master prayer for forgiveness",
        1,
      ],
      t: ["سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", "Glory and praise to Allah", 100],
    },
    ADK = {
      m: [
        AKS.k,
        AKS.i,
        AKS.f,
        AKS.n,
        [
          "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
          "We have reached the morning and the dominion belongs to Allah",
          1,
        ],
        [
          "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
          "O Allah, by You we reach the morning and the evening. To You is the resurrection",
          1,
        ],
        AKS.b,
        AKS.h,
        AKS.s,
        AKS.t,
      ],
      e: [
        AKS.k,
        AKS.i,
        AKS.f,
        AKS.n,
        [
          "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
          "We have reached the evening and the dominion belongs to Allah",
          1,
        ],
        [
          "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
          "O Allah, by You we reach the evening and the morning. To You is the final return",
          1,
        ],
        AKS.b,
        AKS.h,
        AKS.s,
        AKS.t,
      ],
    };
  function akNav() {
    return (
      '<div class="pc-nav pc-ak"><div class="pc-seg"><button data-a="aklist" data-i="m" aria-pressed="' +
      (AKL === "m" ? "true" : "false") +
      '">Morning</button><button data-a="aklist" data-i="e" aria-pressed="' +
      (AKL === "e" ? "true" : "false") +
      '">Evening</button></div><div class="pc-tx"><button data-a="akfs" data-i="-2" aria-label="Smaller text">A−</button><button data-a="akfs" data-i="2" aria-label="Larger text">A+</button></div></div>'
    );
  }

  var MSEC = [
    ["learn", "Learn"],
    ["archive", "Archive"],
    ["adhkar", "Adhkar"],
    ["money", "Money"],
    ["set", "Settings"],
  ];
  var MIC = {
    learn:
      '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19.5A2 2 0 0 0 6 21h13"/>',
    archive:
      '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9M10 13h4"/>',
    adhkar: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    money:
      '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.8 0-3 .9-3 2.2 0 3 6 1.5 6 4.3 0 1.3-1.3 2.2-3 2.2-1.5 0-2.6-.6-3.1-1.6M12 6v2M12 16v2"/>',
    work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2"/>',
    set: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  };
  function MICO(id) {
    return (
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      MIC[id] +
      "</svg>"
    );
  }
  var MK = "out",
    MCAT = "Food",
    DR = { a: "", n: "", d: "" },
    MF = "all";
  function mf(n) {
    return (Math.round(n * 100) / 100).toLocaleString("en-US");
  }
  function mStats(ym) {
    var m = appState.state.money,
      r = { i: 0, o: 0, v: 0, w: 0, n: 0, cat: {} };
    m.log.forEach(function (e) {
      if (e.d.slice(0, 7) !== ym) return;
      r.n++;
      if (e.k === "in") r.i += e.a;
      else if (e.k === "out") {
        r.o += e.a;
        var c = e.c || "Other";
        r.cat[c] = (r.cat[c] || 0) + e.a;
      } else if (e.k === "sv") r.v += e.a;
      else if (e.k === "wd") r.w += e.a;
    });
    r.plan = mTgt(ym);
    r.spent = r.o;
    r.free = Math.round((r.i - r.o - r.v + r.w) * 100) / 100;
    r.bud = r.i > 0 ? Math.round((r.i - r.plan) * 100) / 100 : null;
    return r;
  }
  function mBal() {
    var a = appState.state.money.anc;
    if (!a) return null;
    var b = +a.a || 0;
    appState.state.money.log.forEach(function (e) {
      if ((e.t || 0) <= a.at) return;
      if (e.k === "sv") b += e.a;
      else if (e.k === "wd") b -= e.a;
    });
    return Math.round(b * 100) / 100;
  }
  function mAvg() {
    var t = new Date(),
      ys = [];
    for (var j = 1; j <= 3; j++)
      ys.push(iso(new Date(t.getFullYear(), t.getMonth() - j, 1)).slice(0, 7));
    var sp = 0,
      nt = 0,
      n = 0;
    ys.forEach(function (y) {
      var s = mStats(y);
      if (s.n) {
        n++;
        sp += s.spent;
        nt += s.v - s.w;
      }
    });
    return n ? { spend: sp / n, net: nt / n } : null;
  }
  function mTgt(ym) {
    var t = appState.state.money.tgm || {},
      ks = Object.keys(t)
        .filter(function (k) {
          return k <= ym;
        })
        .sort();
    return ks.length ? t[ks[ks.length - 1]] : 0;
  }
  function defD() {
    return MM === iso(new Date()).slice(0, 7)
      ? iso(new Date())
      : MM + "-" + z(new Date(+MM.slice(0, 4), +MM.slice(5, 7), 0).getDate());
  }
  function keepDR() {
    DR.a = val("mamt");
    DR.n = val("mnote");
    DR.d = val("mdate") || DR.d;
  }
  function moNav() {
    var mn = new Date(
      +MM.slice(0, 4),
      +MM.slice(5, 7) - 1,
      1,
    ).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    return (
      '<div class="pc-nav"><button data-a="mm" data-i="-1" aria-label="Earlier month">‹</button><div class="pc-lab"><span>' +
      mn +
      '</span></div><button data-a="mm" data-i="1" aria-label="Later month">›</button></div>'
    );
  }
  function mTop() {
    var m = appState.state.money,
      bal = mBal(),
      cur = esc(m.cur);
    if (bal === null)
      return box(
        "Savings balance",
        row(
          "Savings now",
          "Enter what you have in savings today",
          '<input type="number" id="mbal" class="num" inputmode="decimal" aria-label="Savings now">',
        ) +
          '<div class="add"><button class="btn" data-a="setbal">Set balance</button></div>',
      );
    var g = m.goal || 0,
      av = mAvg(),
      s = mStats(MM),
      pct = g > 0 ? Math.min(100, Math.round((bal / g) * 100)) : null,
      cov = av && av.spend > 0 ? (bal / av.spend).toFixed(1) + " mo" : "—",
      toG =
        g <= 0
          ? "No goal"
          : bal >= g
            ? "Reached"
            : !av
              ? "—"
              : av.net > 0
                ? Math.ceil((g - bal) / av.net) + " mo"
                : "Save more";
    return pcard({
      nav: moNav(),
      t: mf(bal) + " " + cur,
      s: g > 0 ? "Goal " + mf(g) + " " + cur : "",
      r: pct,
      rl: "Savings goal",
    });
  }
  function mAdd() {
    var K = [
      ["out", "Spent"],
      ["in", "Income"],
      ["sv", "Save"],
      ["wd", "Withdraw"],
    ];
    var kinds =
      '<span class="wseg mny-kind">' +
      K.map(function (x) {
        return (
          '<button data-a="mkind" data-i="' +
          x[0] +
          '" aria-pressed="' +
          (MK === x[0] ? "true" : "false") +
          '">' +
          x[1] +
          "</button>"
        );
      }).join("") +
      "</span>";
    var cats =
      MK === "out"
        ? '<div class="mny-cats">' +
          CATS.map(function (c) {
            return (
              '<button data-a="mcat" data-i="' +
              c +
              '" aria-pressed="' +
              (MCAT === c ? "true" : "false") +
              '">' +
              c +
              "</button>"
            );
          }).join("") +
          "</div>"
        : "";
    return box(
      "Add entry",
      '<div class="pad">' +
        kinds +
        cats +
        '<div class="mny-row"><input type="number" class="num" id="mamt" inputmode="decimal" min="0" step="any" placeholder="Amount" value="' +
        (DR.a || "") +
        '" aria-label="Amount"><input type="text" id="mnote" placeholder="Note (optional)" maxlength="40" value="' +
        esc(DR.n) +
        '" aria-label="Note"></div><div class="mny-row"><input type="date" id="mdate" value="' +
        (DR.d || defD()) +
        '" max="' +
        iso(new Date()) +
        '" aria-label="Date"><button class="btn" data-a="addm">Add</button></div></div>',
    );
  }
  function moneyLeft() {
    var b = mBal();
    return b === null
      ? "Set savings"
      : "Savings " + mf(b) + " " + esc(appState.state.money.cur);
  }
  function moreStat(id) {
    var t = iso(new Date());
    if (id === "adhkar") {
      var L = ADK[AKL],
        c = (D(t).ak || {})[AKL] || [],
        dn = L.filter(function (x, j) {
          return (c[j] || 0) >= x[2];
        }).length;
      return (
        (AKL === "m" ? "Morning" : "Evening") + " · " + dn + " of " + L.length
      );
    }
    if (id === "money") return moneyLeft();
    if (id === "learn") {
      var LN = 0,
        j2;
      for (j2 = 0; j2 < 24; j2++) if (wdone(j2)) LN++;
      return LN + " of 24 done";
    }
    if (id === "archive")
      return arcList().length + " timeline · " + wkDoneList().length + " work";
    return "Targets and alerts";
  }
  function enabledMore() {
    return MSEC.filter(function (s) {
      return (
        s[0] === "set" ||
        s[0] === "archive" ||
        (s[0] === "learn" && areaOn("learn")) ||
        (s[0] === "adhkar" && areaOn("faith")) ||
        (s[0] === "money" && areaOn("money"))
      );
    });
  }
  function moreHub() {
    return (
      '<div class="mh">' +
      enabledMore()
        .map(function (s) {
          return (
            '<button class="mh-t" data-a="sub" data-i="' +
            s[0] +
            '"><span class="mh-ic">' +
            MICO(s[0]) +
            "</span><span><b>" +
            s[1] +
            "</b><small>" +
            moreStat(s[0]) +
            "</small></span></button>"
          );
        })
        .join("") +
      "</div>"
    );
  }
  var HS = [],
    SUBS = ["learn", "archive", "money", "adhkar", "set"],
    TABS = ["now", "log", "week", "more"];
  function rk() {
    return tab + (tab === "more" ? "-" + sub : "");
  }
  function goto(h) {
    var m = String(h || "")
        .replace(/^#/, "")
        .split("-"),
      t = m[0] || "now";
    if (!areaPageOn(t)) {
      tab = "more";
      sub = "home";
      return true;
    }
    if (t === "more") {
      tab = "more";
      var sx = { work: "archive", conn: "set" }[m[1]] || m[1];
      sub =
        sx === "home" || (areaPageOn(sx) && SUBS.indexOf(sx) >= 0)
          ? sx
          : "home";
      return true;
    }
    if (t === "learn" || t === "archive") {
      tab = "more";
      sub = t;
      return true;
    }
    if (t === "work") {
      tab = "more";
      sub = "archive";
      return true;
    }
    if (t === "week") {
      tab = "week";
      WVIEW = "week";
      return true;
    }
    if (t === "adhkar" || t === "money" || t === "set") {
      tab = "more";
      sub = t;
      return true;
    }
    if (TABS.indexOf(t) < 0) return false;
    tab = t;
    return true;
  }
  /* ---- page navigation (dock + all-pages sheet) ---- */
  var PG = [
    ["now", "Now"],
    ["log", "Log"],
    ["week", "Week"],
    ["learn", "Learn"],
    ["archive", "Archive"],
    ["adhkar", "Adhkar"],
    ["money", "Money"],
    ["set", "Settings"],
  ];
  function pgOf() {
    var p = tab === "more" ? sub : tab;
    return PG.some(function (x) {
      return x[0] === p;
    })
      ? p
      : "now";
  }
  function pgIdx() {
    var p = pgOf(),
      i = 0;
    visiblePages().forEach(function (x, j) {
      if (x[0] === p) i = j;
    });
    return i;
  }
  var PGED = false;
  function applyPGOrder() {
    var o = appState.state.ui && appState.state.ui.pgo;
    if (!o || !o.length) return;
    var ids = PG.map(function (x) {
        return x[0];
      }),
      ord = o.filter(function (id) {
        return ids.indexOf(id) >= 0;
      });
    ids.forEach(function (id) {
      if (ord.indexOf(id) < 0) ord.push(id);
    });
    if (ord.join() === ids.join()) return;
    var by = {};
    PG.forEach(function (x) {
      by[x[0]] = x;
    });
    PG.length = 0;
    ord.forEach(function (id) {
      PG.push(by[id]);
    });
    var g = document.querySelector(".pgs-g2");
    if (g)
      ord.forEach(function (id) {
        var t = g.querySelector('.pgt[data-i="' + id + '"]');
        if (t) g.appendChild(t);
      });
  }
  function pgMove(id, d) {
    var ids = PG.map(function (x) {
        return x[0];
      }),
      i = ids.indexOf(id),
      j = i + d;
    if (i < 0 || j < 0 || j >= ids.length) return;
    var t = ids[i];
    ids[i] = ids[j];
    ids[j] = t;
    appState.state.ui = appState.state.ui || {};
    appState.state.ui.pgo = ids;
    save();
    applyPGOrder();
  }
  function pgEdPaint() {
    var o = document.getElementById("pgo");
    if (!o) return;
    o.classList.toggle("edit", PGED);
    var g2 = o.querySelector(".pgs-g2");
    var ed = document.getElementById("pgoed");
    if (!ed) {
      ed = document.createElement("div");
      ed.id = "pgoed";
      g2.parentNode.insertBefore(ed, g2.nextSibling);
    }
    var bt = document.getElementById("pgedt");
    if (!bt) {
      bt = document.createElement("button");
      bt.id = "pgedt";
      bt.className = "pgt-ed";
      bt.setAttribute("data-a", "pgedit");
      o.querySelector(".pgs-h").appendChild(bt);
    }
    bt.textContent = PGED ? "Done" : "Reorder";
    if (!PGED) {
      ed.innerHTML = "";
      return;
    }
    var shown = visiblePages();
    ed.innerHTML = shown
      .map(function (x, i) {
        var t = g2.querySelector('.pgt[data-i="' + x[0] + '"]'),
          ic = t ? t.querySelector(".pgt-i").innerHTML : "";
        return (
          '<div class="pgr"><span class="pgr-i">' +
          ic +
          "</span><b>" +
          x[1] +
          '</b><span class="pgr-b"><button data-a="pgup" data-i="' +
          x[0] +
          '" aria-label="Move ' +
          x[1] +
          ' up"' +
          (i === 0 ? " disabled" : "") +
          '>↑</button><button data-a="pgdn" data-i="' +
          x[0] +
          '" aria-label="Move ' +
          x[1] +
          ' down"' +
          (i === shown.length - 1 ? " disabled" : "") +
          ">↓</button></span></div>"
        );
      })
      .join("");
  }
  function pgShut() {
    var o = document.getElementById("pgo");
    if (o) o.classList.remove("open");
    PGED = false;
  }
  function pgNav(id) {
    if (!areaPageOn(id)) return false;
    if (id === pgOf()) {
      pgShut();
      return;
    }
    pushH();
    if (id === "log") LAUTO = true;
    goto(id);
    armed = false;
    pgShut();
    window.scrollTo(0, 0);
    location.hash = id;
  }
  function pgPaint() {
    applyPGOrder();
    pgEdPaint();
    var list = visiblePages(),
      i = pgIdx(),
      p = pgOf(),
      l = document.getElementById("dkl"),
      k = document.getElementById("dkk");
    if (l)
      l.textContent = (PG.filter(function (x) {
        return x[0] === p;
      })[0] || [p, "More"])[1];
    if (k) k.textContent = i + 1 + " / " + list.length;
    document.querySelectorAll(".pgt").forEach(function (t) {
      var on = areaPageOn(t.dataset.i);
      t.hidden = !on;
      if (t.dataset.i === p) t.setAttribute("aria-current", "page");
      else t.removeAttribute("aria-current");
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") pgShut();
  });
  var PGX = 0,
    PGY = 0,
    PGT = false;
  document.addEventListener(
    "touchstart",
    function (e) {
      var t = e.target;
      PGT =
        !!(
          t.closest &&
          t.closest(
            "input,textarea,select,button,a,label,.grid24,.lgtabs,.sh,.sh-o,.pgo,.dk",
          )
        ) === false;
      if (PGT) {
        PGX = e.touches[0].clientX;
        PGY = e.touches[0].clientY;
      }
    },
    { passive: true },
  );
  document.addEventListener(
    "touchend",
    function (e) {
      if (!PGT) return;
      PGT = false;
      var c = e.changedTouches[0],
        dx = c.clientX - PGX,
        dy = c.clientY - PGY,
        v = visiblePages();
      if (
        Math.abs(dx) > 70 &&
        Math.abs(dx) > Math.abs(dy) * 1.6 &&
        !SH &&
        !document.querySelector(".pgo.open")
      )
        pgNav(v[(pgIdx() + (dx < 0 ? 1 : -1) + v.length) % v.length][0]);
    },
    { passive: true },
  );
  function pushH() {
    var k = rk();
    if (HS[HS.length - 1] !== k) HS.push(k);
    if (HS.length > 20) HS.shift();
  }
  var SH = null,
    SHK = "";
  function shFind() {
    if (!SH) return null;
    if (SH.m === "e") {
      var pl = E(iso(new Date())).plan;
      return pl[SH.i] ? { arr: pl, i: SH.i } : null;
    }
    if (SH.m === "p") {
      var a = appState.state.pins || [];
      for (var j = 0; j < a.length; j++)
        if (String(a[j].id) === String(SH.i)) return { arr: a, i: j };
    }
    return null;
  }
  function shItem() {
    if (SH && SH.m === "s") return { t: SH.t, x: SH.x, _s: 1 };
    var f = shFind();
    return f ? f.arr[f.i] : null;
  }
  function shAdd(pin, t, x, key) {
    if (pin) {
      appState.state.pins = appState.state.pins || [];
      var id = Date.now();
      while (
        appState.state.pins.some(function (q) {
          return q.id === id;
        })
      )
        id++;
      var q = { id: id, t: t, x: x };
      if (key) q.sk = key;
      appState.state.pins.push(q);
    } else {
      var it = { t: t, x: x, d: 0 };
      if (key) it.k = key;
      E(iso(new Date())).plan.push(it);
    }
  }
  function sheetR() {
    var k = iso(new Date()),
      p = shItem();
    if (SH && SH.m !== "a" && !p) SH = null;
    var key = SH
      ? SH.m + (SH.i === undefined ? "" : SH.i) + (p ? p.t + "|" + p.x : "")
      : "";
    if (key === SHK) return;
    SHK = key;
    var o = document.getElementById("sheet");
    if (!o) {
      o = document.createElement("div");
      o.id = "sheet";
      document.body.appendChild(o);
    }
    if (!SH) {
      o.innerHTML = "";
      return;
    }
    var n = nowMin(),
      t = p ? p.t : fmt(Math.min(1380, Math.ceil((n + 30) / 30) * 30)),
      x = p ? p.x : "";
    o.innerHTML =
      '<div class="sh-o" data-a="shx"></div><div class="sh" role="dialog" aria-modal="true" aria-label="' +
      (p ? "Edit item" : "New item") +
      '"><h2 style="margin:0 0 10px">' +
      (p ? "Edit item" : "Add to timeline") +
      '</h2><input class="sin" type="time" id="sht" value="' +
      t +
      '" aria-label="Time"><input class="sin" type="text" id="shw" maxlength="80" placeholder="What" value="' +
      esc(x) +
      '" aria-label="What" style="margin-top:10px">' +
      (SH && SH.m === "a"
        ? '<input class="sin" type="date" id="shd" data-c="shd" value="' +
          k +
          '" aria-label="Date" style="margin-top:10px">'
        : "") +
      '<div style="margin-top:10px">' +
      '<div class="row" id="shpr"><span>Pin every day until I unpin it</span><input type="checkbox" id="shpin" ' +
      (SH && SH.m === "p" ? "checked " : "") +
      'style="width:28px;height:28px" aria-label="Pin every day"></div>' +
      '</div><div class="ctl"><button class="btn" data-a="shsave">Save</button>' +
      (p && !p._s
        ? '<button class="btn alt" data-a="shp30">+30 min</button><button class="btn alt" data-a="shdel">Delete</button>'
        : "") +
      '<button class="btn alt" data-a="shx">Cancel</button></div></div>';
    if (!p)
      setTimeout(function () {
        var e = document.getElementById("shw");
        if (e) e.focus();
      }, 60);
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && SH) {
      SH = null;
      render();
    }
  });
  const appContext = createAppContext({
    ADK: {
      get: () => ADK,
      set: (value) => {
        ADK = value;
      },
    },
    AKF: {
      get: () => AKF,
      set: (value) => {
        AKF = value;
      },
    },
    AKL: {
      get: () => AKL,
      set: (value) => {
        AKL = value;
      },
    },
    ARCT: {
      get: () => ARCT,
      set: (value) => {
        ARCT = value;
      },
    },
    ARC_ALL: {
      get: () => ARC_ALL,
      set: (value) => {
        ARC_ALL = value;
      },
    },
    CERR: {
      get: () => CERR,
      set: (value) => {
        CERR = value;
      },
    },
    CUR: {
      get: () => CUR,
      set: (value) => {
        CUR = value;
      },
    },
    D: { get: () => D },
    DN: { get: () => DN },
    GAPS: {
      get: () => GAPS,
      set: (value) => {
        GAPS = value;
      },
    },
    LEDIT: {
      get: () => LEDIT,
      set: (value) => {
        LEDIT = value;
      },
    },
    LGRP: {
      get: () => LGRP,
      set: (value) => {
        LGRP = value;
      },
    },
    LINK: {
      get: () => LINK,
      set: (value) => {
        LINK = value;
      },
    },
    LRT: {
      get: () => LRT,
      set: (value) => {
        LRT = value;
      },
    },
    MF: {
      get: () => MF,
      set: (value) => {
        MF = value;
      },
    },
    MM: {
      get: () => MM,
      set: (value) => {
        MM = value;
      },
    },
    PN: { get: () => PN },
    RC: {
      get: () => RC,
      set: (value) => {
        RC = value;
      },
    },
    RES: {
      get: () => RES,
      set: (value) => {
        RES = value;
      },
    },
    S: {
      get: () => appState.state,
      set: (value) => {
        appState.state = value;
      },
    },
    SECN: {
      get: () => SECN,
      set: (value) => {
        SECN = value;
      },
    },
    SG: {
      get: () => SG,
      set: (value) => {
        SG = value;
      },
    },
    SUNN: { get: () => SUNN },
    THEMES: {
      get: () => THEMES,
      set: (value) => {
        THEMES = value;
      },
    },
    TL_OPEN: {
      get: () => TL_OPEN,
      set: (value) => {
        TL_OPEN = value;
      },
    },
    TM: {
      get: () => TM,
      set: (value) => {
        TM = value;
      },
    },
    UNDO: {
      get: () => UNDO,
      set: (value) => {
        UNDO = value;
      },
    },
    WS: {
      get: () => WS,
      set: (value) => {
        WS = value;
      },
    },
    WVIEW: {
      get: () => WVIEW,
      set: (value) => {
        WVIEW = value;
      },
    },
    acUI: { get: () => acUI },
    adpView: { get: () => adpView },
    arcDay: { get: () => arcDay },
    arcList: { get: () => arcList },
    archTabs: { get: () => archTabs },
    archWork: { get: () => archWork },
    areaOn: { get: () => areaOn },
    areaSettings: { get: () => areaSettings },
    box: { get: () => box },
    buildReport: { get: () => buildReport },
    dayNav: { get: () => dayNav },
    del: { get: () => del },
    dshort: { get: () => dshort },
    dueQs: { get: () => dueQs },
    dur: { get: () => dur },
    esc: { get: () => esc },
    fdSec: { get: () => fdSec },
    fgoal: { get: () => fgoal },
    fmt: { get: () => fmt },
    focusBox: { get: () => focusBox },
    fsum: { get: () => fsum },
    gapDays: { get: () => gapDays },
    gday: { get: () => gday },
    heroSet: { get: () => heroSet },
    idName: { get: () => idName },
    isRest: { get: () => isRest },
    iso: { get: () => iso },
    items: { get: () => items },
    lgStrip: { get: () => lgStrip },
    lgg: { get: () => lgg },
    lrnNav: { get: () => lrnNav },
    lrnSec: { get: () => lrnSec },
    mAdd: { get: () => mAdd },
    mBal: { get: () => mBal },
    mStats: { get: () => mStats },
    mf: { get: () => mf },
    mins: { get: () => mins },
    moreHub: { get: () => moreHub },
    nowMin: { get: () => nowMin },
    odBanner: { get: () => odBanner },
    openDay: { get: () => openDay },
    parse: { get: () => parse },
    pc: { get: () => pc },
    pcT: { get: () => pcT },
    pcard: { get: () => pcard },
    rcNext: { get: () => rcNext },
    rollover: { get: () => rollover },
    row: { get: () => row },
    save: { get: () => save },
    sbox: { get: () => sbox },
    secBody: { get: () => secBody },
    secList: { get: () => secList },
    secNxt: { get: () => secNxt },
    secPil: { get: () => secPil },
    secProg: { get: () => secProg },
    secWork: { get: () => secWork },
    sel: {
      get: () => sel,
      set: (value) => {
        sel = value;
      },
    },
    star: { get: () => star },
    sub: {
      get: () => sub,
      set: (value) => {
        sub = value;
      },
    },
    subCard: { get: () => subCard },
    suggest: { get: () => suggest },
    telapsed: { get: () => telapsed },
    tgRows: { get: () => tgRows },
    tgl: { get: () => tgl },
    times: { get: () => times },
    upBanner: { get: () => upBanner },
    vAdhkar: { get: () => vAdhkar },
    vArchive: { get: () => vArchive },
    vLearn: { get: () => vLearn },
    vMoney: { get: () => vMoney },
    vReports: { get: () => vReports },
    vSet: { get: () => vSet },
    wMode: { get: () => wMode },
    wb: { get: () => wb },
    wdone: { get: () => wdone },
    weekDays: { get: () => weekDays },
    weekRec: { get: () => weekRec },
    wkDoneList: { get: () => wkDoneList },
    wkMin: { get: () => wkMin },
    wkNav: { get: () => wkNav },
    wkOn: { get: () => wkOn },
    wkR: { get: () => wkR },
    wkWeekRows: { get: () => wkWeekRows },
    wlabel: { get: () => wlabel },
    workCard: { get: () => workCard },
  });
  const vNow = (...args) => render_vNow(appContext, ...args);
  const vLog = (...args) => render_vLog(appContext, ...args);
  const vWeek = (...args) => render_vWeek(appContext, ...args);
  const vMore = (...args) => render_vMore(appContext, ...args);
  const vArchive = (...args) => render_vArchive(appContext, ...args);
  const vLearn = (...args) => render_vLearn(appContext, ...args);
  const vReports = (...args) => render_vReports(appContext, ...args);
  const vMoney = (...args) => render_vMoney(appContext, ...args);
  const vSet = (...args) => render_vSet(appContext, ...args);
  const vAdhkar = (...args) => render_vAdhkar(appContext, ...args);
  const screens = createScreenRegistry({
    now: vNow,
    log: vLog,
    week: vWeek,
    more: vMore,
  });
  function render() {
    sheetR();
    hdr();
    var v = document.getElementById("view"),
      key = tab + (tab === "more" ? sub : "");
    v.innerHTML =
      (HS.length && tab === "more" && sub === "home"
        ? '<button class="btn alt" data-a="back" style="margin-bottom:10px">‹ Back</button>'
        : "") + renderScreen(screens, tab);
    var g24 = v.querySelector(".grid24");
    if (g24) {
      var gb = g24.querySelector('[aria-pressed="true"]');
      if (gb)
        g24.scrollLeft =
          gb.offsetLeft - g24.clientWidth / 2 + gb.offsetWidth / 2;
    }
    pgPaint();
    var r = document.getElementById("reset");
    r.hidden = !(tab === "more" && sub === "set");
    r.textContent = armed ? "Tap again to erase everything" : "Erase all data";
    if (key !== lastKey) {
      lastKey = key;
      v.classList.remove("fade");
      void v.offsetWidth;
      v.classList.add("fade");
    }
  }

  function dayNav() {
    var td = iso(new Date());
    return (
      '<div class="pc-nav"><button data-a="dprev" aria-label="Previous day">‹</button><label class="pc-lab"><span>' +
      parse(sel).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }) +
      "</span>" +
      (sel === td
        ? "<small>Today</small>"
        : '<button class="pc-pill" data-a="dtoday">Today</button>') +
      '<input type="date" data-c="dpick" value="' +
      sel +
      '" max="' +
      td +
      '" aria-label="Pick a day"></label><button data-a="dnext" aria-label="Next day"' +
      (sel >= td ? " disabled" : "") +
      ">›</button></div>"
    );
  }
  function wkNav(ws, cw, chip, ok) {
    return (
      '<div class="pc-nav"><button data-a="wnav" data-i="-7" aria-label="Earlier week">‹</button><div class="pc-lab"><span>' +
      wlabel(ws) +
      "</span>" +
      (ws !== cw
        ? '<button class="pc-pill" data-a="wthis">This week</button>'
        : "<small>" + chip + "</small>") +
      '</div><button data-a="wnav" data-i="7" aria-label="Later week"' +
      (ws >= cw ? " disabled" : "") +
      ">›</button></div>"
    );
  }
  /* ---------- alerts ---------- */
  var NTF = (function () {
    try {
      return persistence.readJson("tracker-notified", {});
    } catch (e) {
      return {};
    }
  })();
  function once(key) {
    var td = iso(new Date());
    if (NTF.d !== td) NTF = { d: td };
    if (NTF[key]) return false;
    NTF[key] = 1;
    persistence.writeJson("tracker-notified", NTF);
    return true;
  }
  function alertx(title, body, act, kind) {
    var box = document.getElementById("toasts");
    if (!box) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML =
      '<div style="flex:1"><b>' +
      esc(title) +
      "</b><small>" +
      esc(body || "") +
      "</small></div>" +
      (act
        ? '<button class="btn" data-a="' +
          act.a +
          '" data-i="' +
          act.i +
          '">' +
          esc(act.l) +
          "</button>"
        : "") +
      '<button class="x" data-a="tx" aria-label="Close">×</button>';
    box.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.remove();
    }, 20000);
    if (kind) snd(kind);
    try {
      if (window.Notification && Notification.permission === "granted")
        new Notification(title, { body: body || "" });
    } catch (e) {}
  }
  function ntick() {
    var nt = appState.state.set.nt;
    if (!nt || !nt.on) return;
    var n = nowMin(),
      k = iso(new Date()),
      d = D(k),
      T = times(),
      lead = +nt.lead || 0;
    if (nt.pl)
      (d.plan || []).forEach(function (p, i) {
        if (p.d) return;
        var a = mins(p.t);
        if (n >= a - lead && n < a + 10 && once("pl" + i + p.t + p.x))
          alertx(
            n < a ? "Starts in " + (a - n) + " min" : "Starts now",
            p.t + "  " + p.x,
            { a: "pl", i: i, l: "Mark done" },
            "w",
          );
      });
    PN.forEach(function (nm, i) {
      if (n >= T[i] && n < T[i] + 10) {
        if (nt.prayer && !d.p[i] && once("pr" + i))
          alertx(
            nm + " time",
            fmt(T[i]),
            { a: "prn", i: i, l: "Mark prayed" },
            "p",
          );
        if (
          nt.water &&
          (d.water || 0) <
            Math.round(((i + 1) * appState.state.set.water) / 5) &&
          once("wt" + i)
        )
          alertx(
            "Water",
            "Have a glass. " +
              (d.water || 0) +
              " of " +
              appState.state.set.water +
              " so far.",
            { a: "wtr", i: 0, l: "Add a glass" },
            "w",
          );
      }
    });
    if (nt.pl && wkOn(k)) {
      var wja = mins(appState.state.set.job.a),
        wjb = mins(appState.state.set.job.b),
        ww = wkR(k);
      if (!ww.i && n >= wja - 5 && n < wja + 30 && once("wki"))
        alertx(
          "Work starts " + appState.state.set.job.a,
          "Clock in when you start.",
          { a: "wkin", i: 0, l: "Clock in" },
          "w",
        );
      if (ww.i && !ww.o && n >= wjb && n < wjb + 30 && once("wko"))
        alertx(
          "Work day ends",
          "Clock out and note the day.",
          { a: "wkout", i: 0, l: "Clock out" },
          "w",
        );
    }
    if (nt.focus && !isRest(k) && fsum(d) >= fgoal(k) && once("fgoal"))
      alertx("Focus goal reached", dur(fsum(d)) + " logged today.", null, "d");
    if (
      nt.evening &&
      n >= T[4] + 45 &&
      n < T[4] + 120 &&
      !(d.jn || "").trim() &&
      once("co")
    )
      alertx(
        "Close-out time",
        "Log your mood, pain and journal.",
        { a: "tab", i: "log", l: "Open Log" },
        "w",
      );
  }
  function afterLoad() {
    var m = ensureReports();
    if (m.length) {
      save();
      render();
      var r = m[m.length - 1];
      alertx(
        "Week report saved",
        wlabel(r),
        { a: "oprep", i: r, l: "Open" },
        "d",
      );
    }
  }
  function icsToday() {
    var k = iso(new Date()),
      d = D(k),
      ymd = k.replace(/-/g, ""),
      T = times(),
      lead = +appState.state.set.nt.lead || 0,
      L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Life tracker//EN"],
      tm = function (m) {
        return z(Math.floor(m / 60)) + z(m % 60) + "00";
      },
      ev = function (id, a, b, t, al) {
        L.push(
          "BEGIN:VEVENT",
          "UID:" + k + "-" + id + "@tracker",
          "DTSTAMP:" + ymd + "T000000Z",
          "DTSTART:" + ymd + "T" + tm(a),
          "DTEND:" + ymd + "T" + tm(b),
          "SUMMARY:" + String(t).replace(/[,;\r\n]/g, " "),
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          "DESCRIPTION:Reminder",
          "TRIGGER:-PT" + al + "M",
          "END:VALARM",
          "END:VEVENT",
        );
      };
    (d.plan || []).forEach(function (p, i) {
      var a = mins(p.t);
      ev("p" + i, a, a + 30, p.x, lead);
    });
    PN.forEach(function (nm, i) {
      ev("s" + i, T[i], T[i] + 20, nm, 0);
    });
    L.push("END:VCALENDAR");
    return L.join("\r\n");
  }
  /* ---------- actions ---------- */
  function ansRc(ok) {
    var q = rcNext();
    if (!q) return false;
    var r = appState.state.learn.sr[q[2]] || { b: 0 },
      b = ok ? Math.min(5, (r.b || 0) + 1) : 0,
      du = new Date();
    du.setDate(du.getDate() + INT[b]);
    appState.state.learn.sr[q[2]] = { b: b, due: iso(du) };
    RC.skip[q[2]] = 1;
    RC.show = false;
    var d = E(iso(new Date()));
    d.rc = (d.rc || 0) + 1;
  }
  function dl(name, data) {
    try {
      var b = new Blob([data], { type: "application/octet-stream" }),
        u = URL.createObjectURL(b),
        a = document.createElement("a");
      a.href = u;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(u);
      }, 1500);
    } catch (e) {}
  }
  const actionContext = createAppContext({
    ADK: {
      get: () => ADK,
      set: (value) => {
        ADK = value;
      },
    },
    AKF: {
      get: () => AKF,
      set: (value) => {
        AKF = value;
      },
    },
    AKL: {
      get: () => AKL,
      set: (value) => {
        AKL = value;
      },
    },
    ARCT: {
      get: () => ARCT,
      set: (value) => {
        ARCT = value;
      },
    },
    ARC_ALL: {
      get: () => ARC_ALL,
      set: (value) => {
        ARC_ALL = value;
      },
    },
    CERR: {
      get: () => CERR,
      set: (value) => {
        CERR = value;
      },
    },
    D: { get: () => D },
    DR: {
      get: () => DR,
      set: (value) => {
        DR = value;
      },
    },
    DS: { get: () => DS },
    E: { get: () => E },
    EDID: {
      get: () => EDID,
      set: (value) => {
        EDID = value;
      },
    },
    GAPS: {
      get: () => GAPS,
      set: (value) => {
        GAPS = value;
      },
    },
    HS: {
      get: () => HS,
      set: (value) => {
        HS = value;
      },
    },
    IDL: {
      get: () => IDL,
      set: (value) => {
        IDL = value;
      },
    },
    LAUTO: {
      get: () => LAUTO,
      set: (value) => {
        LAUTO = value;
      },
    },
    LEDIT: {
      get: () => LEDIT,
      set: (value) => {
        LEDIT = value;
      },
    },
    LGT: {
      get: () => LGT,
      set: (value) => {
        LGT = value;
      },
    },
    LIM: {
      get: () => LIM,
      set: (value) => {
        LIM = value;
      },
    },
    LINK: {
      get: () => LINK,
      set: (value) => {
        LINK = value;
      },
    },
    LRT: {
      get: () => LRT,
      set: (value) => {
        LRT = value;
      },
    },
    LSEC: {
      get: () => LSEC,
      set: (value) => {
        LSEC = value;
      },
    },
    MCAT: {
      get: () => MCAT,
      set: (value) => {
        MCAT = value;
      },
    },
    MF: {
      get: () => MF,
      set: (value) => {
        MF = value;
      },
    },
    MK: {
      get: () => MK,
      set: (value) => {
        MK = value;
      },
    },
    MM: {
      get: () => MM,
      set: (value) => {
        MM = value;
      },
    },
    NOREN: {
      get: () => NOREN,
      set: (value) => {
        NOREN = value;
      },
    },
    NZ: {
      get: () => NZ,
      set: (value) => {
        NZ = value;
      },
    },
    OD_ALL: {
      get: () => OD_ALL,
      set: (value) => {
        OD_ALL = value;
      },
    },
    OD_OPEN: {
      get: () => OD_OPEN,
      set: (value) => {
        OD_OPEN = value;
      },
    },
    PGED: {
      get: () => PGED,
      set: (value) => {
        PGED = value;
      },
    },
    RC: {
      get: () => RC,
      set: (value) => {
        RC = value;
      },
    },
    S: {
      get: () => appState.state,
      set: (value) => {
        appState.state = value;
      },
    },
    SG: {
      get: () => SG,
      set: (value) => {
        SG = value;
      },
    },
    SH: {
      get: () => SH,
      set: (value) => {
        SH = value;
      },
    },
    SND: {
      get: () => SND,
      set: (value) => {
        SND = value;
      },
    },
    TK: {
      get: () => TK,
      set: (value) => {
        TK = value;
      },
    },
    TL_OPEN: {
      get: () => TL_OPEN,
      set: (value) => {
        TL_OPEN = value;
      },
    },
    TM: {
      get: () => TM,
      set: (value) => {
        TM = value;
      },
    },
    TREQ: {
      get: () => TREQ,
      set: (value) => {
        TREQ = value;
      },
    },
    UNDO: {
      get: () => UNDO,
      set: (value) => {
        UNDO = value;
      },
    },
    UP_OPEN: {
      get: () => UP_OPEN,
      set: (value) => {
        UP_OPEN = value;
      },
    },
    W: { get: () => W },
    WK_OPEN: {
      get: () => WK_OPEN,
      set: (value) => {
        WK_OPEN = value;
      },
    },
    WRT: {
      get: () => WRT,
      set: (value) => {
        WRT = value;
      },
    },
    WS: {
      get: () => WS,
      set: (value) => {
        WS = value;
      },
    },
    WT: { get: () => WT },
    WTALL: {
      get: () => WTALL,
      set: (value) => {
        WTALL = value;
      },
    },
    WVIEW: {
      get: () => WVIEW,
      set: (value) => {
        WVIEW = value;
      },
    },
    acGo: { get: () => acGo },
    acReset: { get: () => acReset },
    adpAct: { get: () => adpAct },
    agOpen: { get: () => agOpen },
    agPw: { get: () => agPw },
    agSkip: { get: () => agSkip },
    alertx: { get: () => alertx },
    ansRc: { get: () => ansRc },
    applyTheme: { get: () => applyTheme },
    armed: {
      get: () => armed,
      set: (value) => {
        armed = value;
      },
    },
    buildReport: { get: () => buildReport },
    cerr: { get: () => cerr },
    checkConn: { get: () => checkConn },
    connAdd: { get: () => connAdd },
    defD: { get: () => defD },
    dl: { get: () => dl },
    finishSetup: { get: () => finishSetup },
    fix: { get: () => fix },
    fmt: { get: () => fmt },
    goto: { get: () => goto },
    icsToday: { get: () => icsToday },
    iso: { get: () => iso },
    keepDR: { get: () => keepDR },
    lgApply: { get: () => lgApply },
    lgUndo: { get: () => lgUndo },
    lscroll: { get: () => lscroll },
    mins: { get: () => mins },
    nowMin: { get: () => nowMin },
    odT: { get: () => odT },
    parse: { get: () => parse },
    pc: { get: () => pc },
    pgClose: { get: () => pgClose },
    pgEdPaint: { get: () => pgEdPaint },
    pgIdx: { get: () => pgIdx },
    pgMove: { get: () => pgMove },
    pgNav: { get: () => pgNav },
    pgShut: { get: () => pgShut },
    pushH: { get: () => pushH },
    refreshExt: { get: () => refreshExt },
    regName: { get: () => regName },
    render: { get: () => render },
    reportMd: { get: () => reportMd },
    save: { get: () => save },
    sel: {
      get: () => sel,
      set: (value) => {
        sel = value;
      },
    },
    setArea: { get: () => setArea },
    shAdd: { get: () => shAdd },
    shFind: { get: () => shFind },
    shItem: { get: () => shItem },
    signOutLocal: { get: () => signOutLocal },
    snapDay: { get: () => snapDay },
    snd: { get: () => snd },
    sub: {
      get: () => sub,
      set: (value) => {
        sub = value;
      },
    },
    syncNow: { get: () => syncNow },
    tab: {
      get: () => tab,
      set: (value) => {
        tab = value;
      },
    },
    telapsed: { get: () => telapsed },
    testSound: { get: () => testSound },
    topics: { get: () => topics },
    undoPush: { get: () => undoPush },
    unlock: { get: () => unlock },
    val: { get: () => val },
    vd: { get: () => vd },
    visiblePages: { get: () => visiblePages },
    weekDays: { get: () => weekDays },
    wkW: { get: () => wkW },
    wtFind: { get: () => wtFind },
    wtToggle: { get: () => wtToggle },
    z: { get: () => z },
  });
  const ACT = createActionHandlers(actionContext);

  const CHG = createChangeHandlers(actionContext);
  bindActionEvents(actionContext, ACT, CHG);

  document.addEventListener("click", function (e) {
    var t = e.target.closest(".toast");
    if (t && e.target.closest("[data-a]"))
      setTimeout(function () {
        t.remove();
      }, 0);
  });
  document.addEventListener("focusout", function () {
    if (PENDING) {
      PENDING = false;
      setTimeout(render, 60);
    }
  });
  function typing() {
    var a = document.activeElement;
    return !!(
      a &&
      /INPUT|TEXTAREA|SELECT/.test(a.tagName) &&
      a.closest("#view")
    );
  }
  function tick() {
    var t = iso(new Date());
    if (t !== today0) {
      if (sel === today0) sel = t;
      today0 = t;
      afterLoad();
      render();
    } else if (tab === "now" && !typing()) render();
  }
  setInterval(function () {
    var a = document.getElementById("ftime"),
      g = document.getElementById("gtime"),
      t = TM;
    if (a) {
      var e = telapsed(t);
      a.textContent = mmss(e);
      var b = document.getElementById("fbar");
      if (b)
        b.style.width =
          Math.min(
            100,
            Math.round(
              ((fsum(D(iso(new Date()))) + e / 6e4) / fgoal(iso(new Date()))) *
                100,
            ),
          ) + "%";
    }
    if (g) g.textContent = mmss(telapsed(appState.state.gt));
    if (t.on && telapsed(t) >= 45 * 6e4 && NZ !== t.t0) {
      NZ = t.t0;
      snd("w");
      if (appState.state.set.nt.on && appState.state.set.nt.focus)
        alertx(
          "Stand up",
          "45 minutes of focus. Stretch your neck and back for 5 minutes.",
          null,
          null,
        );
      var n = document.getElementById("fnz");
      if (n) n.textContent = "45 min. Stand up and stretch.";
    }
  }, 1000);
  setInterval(tick, 30000);
  setInterval(ntick, 15000);
  document.addEventListener("visibilitychange", tick);
  window.addEventListener("focus", tick);
  document.addEventListener("submit", function (e) {
    if (e.target && e.target.id === "agf") {
      e.preventDefault();
      acGo(AGM === "up");
    }
  });
  goto(location.hash);
  window.addEventListener("hashchange", function () {
    if (goto(location.hash)) {
      armed = false;
      render();
    }
  });
  AUTH = aload();
  render();
  setupBoot();
  firebaseSync.initialize().then(refreshExt);
  agBoot();
  acNav();
  setTimeout(ntick, 1500);
}
