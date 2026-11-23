export function bindActionEvents(ctx, ACT, CHG) {
  document.addEventListener("click", function (e) {
    ctx.unlock();
    var t = e.target.closest("[data-a]");
    if (!t) return;
    var a = t.dataset.a,
      f = ACT[a];
    if (!f) return;
    var vk = ctx.vd(),
      pre = ctx.snapDay(vk),
      b = ctx.pc(vk),
      ds = t.dataset,
      q =
        '[data-a="' +
        a +
        '"]' +
        (ds.i !== undefined ? '[data-i="' + ds.i + '"]' : "") +
        (ds.k ? '[data-k="' + ds.k + '"]' : "");
    if (f(ds.i, ds.k, t) === false) return;
    if (a === "sets") {
      ctx.S.ui = ctx.S.ui || {};
      ctx.S.ui.areas = ctx.S.ui.areas || {};
      ctx.S.ui.areas.faith = !!ctx.S.set.mods.faith;
      ctx.S.ui.areas.digital = !!ctx.S.set.mods.digital;
      ctx.S.ui.areas.work = !!ctx.S.set.job.on;
    }
    if (a !== "undo") ctx.undoPush(vk, pre);
    ctx.save();
    ctx.render();
    var el = document.querySelector("#view " + q);
    if (el && el.getAttribute("aria-pressed") === "true")
      el.classList.add("pop");
    if (ctx.SND) {
      ctx.snd(ctx.SND);
      ctx.SND = "";
    }
    var vk2 = ctx.vd();
    if (vk2 === vk && b < 100 && ctx.pc(vk2) === 100) {
      ctx.snd("d");
      var tp = document.getElementById("top");
      tp.classList.remove("glow");
      void tp.offsetWidth;
      tp.classList.add("glow");
    }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.area) {
      ctx.setArea(t.dataset.area, t.checked);
      ctx.save();
      ctx.render();
      return;
    }
    if (t.id === "rs" && t.files && t.files[0]) {
      t.files[0].text().then(function (x) {
        var o = null;
        try {
          o = JSON.parse(x);
        } catch (er) {}
        if (
          !o ||
          typeof o !== "object" ||
          !o.days ||
          typeof o.days !== "object" ||
          Array.isArray(o.days) ||
          !o.set
        ) {
          alert("This file is not a Life Tracker backup. Nothing was changed.");
          return;
        }
        var ks = Object.keys(o.days).sort(),
          ml = (o.money && o.money.log && o.money.log.length) || 0;
        if (
          !confirm(
            "Replace everything on this device with this backup?\n\n" +
              ks.length +
              " days" +
              (ks.length
                ? " (" + ks[0] + " to " + ks[ks.length - 1] + ")"
                : "") +
              ", " +
              ml +
              " money entries.\n\nYour current data here will be overwritten.",
          )
        )
          return;
        ctx.S = ctx.fix(o);
        ctx.save();
        ctx.render();
      });
      t.value = "";
      return;
    }
    var c = t.dataset && t.dataset.c;
    if (!c || !CHG[c]) return;
    var vk = ctx.vd(),
      pre = ctx.snapDay(vk);
    CHG[c](t.value, t);
    ctx.undoPush(vk, pre);
    ctx.save();
    ctx.render();
  });
}
