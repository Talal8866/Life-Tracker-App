export function createChangeHandlers(ctx) {
  return {
    bed: function (v) {
      ctx.E(ctx.vd()).bed = v;
    },
    wki: function (v) {
      ctx.wkW(ctx.vd()).i = v;
    },
    wko: function (v) {
      ctx.wkW(ctx.vd()).o = v;
    },
    wkn: function (v) {
      ctx.wkW(ctx.vd()).n = v;
    },
    cxn: function (v, t) {
      var d = ctx.E(ctx.vd());
      d.cx = d.cx || {};
      d.cx[t.dataset.k] = Math.max(0, parseFloat(v) || 0);
    },
    wake: function (v) {
      ctx.E(ctx.vd()).wake = v;
    },
    num: function (v, t) {
      var k = t.dataset.k,
        x = Math.max(0, parseFloat(v) || 0),
        L = ctx.LIM[k];
      if (L && x > L) {
        ctx.alertx(
          (ctx.IDL[k] || k) + ": max " + L,
          "Enter a realistic value.",
          null,
        );
        return;
      }
      ctx.E(ctx.vd())[k] = x;
    },
    jn: function (v) {
      ctx.E(ctx.vd()).jn = v;
    },
    ftopic: function (v) {
      ctx.TM.x = v;
    },
    dpick: function (v) {
      if (v && v <= ctx.iso(new Date())) ctx.sel = v;
    },
    shd: function (v) {
      var r = document.getElementById("shpr"),
        pe = document.getElementById("shpin"),
        off = !!v && v !== ctx.iso(new Date());
      if (r) r.style.display = off ? "none" : "";
      if (off && pe) pe.checked = false;
    },
    topin: function (v, t) {
      var dk = t.dataset.d,
        x = ctx.S.tops[dk] || { t: ["", "", ""], x: [0, 0, 0] };
      x.t[+t.dataset.i] = v.trim();
      ctx.S.tops[dk] = x;
    },
    goal: function (v, t) {
      ctx.W().g[+t.dataset.i] = v;
    },
    rwin: function (v) {
      ctx.W().win = v;
    },
    rfix: function (v) {
      ctx.W().fix = v;
    },
    note: function (v) {
      ctx.S.learn.n[ctx.S.learn.w] = v;
    },
  };
}
