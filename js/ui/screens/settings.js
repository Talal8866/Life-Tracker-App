export function vSet(ctx) {
  var s = ctx.S.set,
    nt = s.nt,
    jb = s.job,
    po = s.po || [0, 0, 0, 0, 0],
    f = function (l, id, v, sub) {
      return ctx.row(
        l,
        sub,
        '<input type="number" class="num" id="' +
          id +
          '" value="' +
          v +
          '" min="0" aria-label="' +
          l +
          '">',
      );
    },
    ck = function (l, id, v) {
      return ctx.row(
        l,
        "",
        '<input type="checkbox" id="' +
          id +
          '"' +
          (v ? " checked" : "") +
          ' style="width:28px;height:28px" aria-label="' +
          l +
          '">',
      );
    },
    sg = function (t, inner, note) {
      return ctx.sbox(t, inner, note);
    };
  var cur = (ctx.S.ui && ctx.S.ui.theme) || "zaytun",
    h = sg(
      "Look",
      '<div class="thms">' +
        ctx.THEMES.map(function (x) {
          return (
            '<button class="thm" data-a="theme" data-i="' +
            x[0] +
            '" aria-pressed="' +
            (cur === x[0]) +
            '"><i style="background:linear-gradient(135deg,' +
            x[2] +
            " 50%," +
            x[3] +
            ' 50%)"></i>' +
            x[1] +
            "</button>"
          );
        }).join("") +
        "</div>",
    );
  h += sg("Daily targets", ctx.tgRows(s, f));
  h += sg("Your areas", ctx.areaSettings());
  h += sg(
    "Features",
    ck("Calm sounds", "snd", s.snd !== 0) +
      '<input type="checkbox" id="mf"' +
      (s.mods.faith ? " checked" : "") +
      ' hidden><input type="checkbox" id="md"' +
      (s.mods.digital ? " checked" : "") +
      " hidden>",
  );
  h += sg(
    "Prayers",
    '<details class="sx"><summary>Prayer time shifts, min</summary>' +
      ctx.PN.map(function (n, i) {
        return f(n, "p" + "fdami"[i], po[i]);
      }).join("") +
      '</details><details class="sx"><summary>Sunnah counts, 0 hides one</summary>' +
      [
        "سنة الفجر قبله",
        "سنة الظهر قبله",
        "سنة الظهر بعده",
        "سنة العصر قبله",
        "سنة المغرب بعده",
        "سنة العشاء بعده",
        "الوتر",
      ]
        .map(function (l, i) {
          return f(l, "sn" + i, s.sn[i]);
        })
        .join("") +
      "</details>",
  );
  h += sg(
    "Work schedule",
    ck("Job schedule", "jon", jb.on) +
      '<div class="row"><span>Work days</span><span class="acts" style="flex-wrap:wrap;justify-content:flex-end">' +
      ctx.DN.map(function (n, i) {
        return (
          '<label style="display:inline-flex;align-items:center;gap:3px;font-size:13px">' +
          n +
          '<input type="checkbox" id="jd' +
          i +
          '"' +
          (jb.days.indexOf(i) >= 0 ? " checked" : "") +
          "></label>"
        );
      }).join("") +
      "</span></div>" +
      ctx.row(
        "Starts",
        "",
        '<input type="time" id="jsa" value="' +
          jb.a +
          '" aria-label="Work starts">',
      ) +
      ctx.row(
        "Ends",
        "",
        '<input type="time" id="jsb" value="' +
          jb.b +
          '" aria-label="Work ends">',
      ) +
      f("Commute one way, min", "jsc", jb.c) +
      ctx.row(
        "From date",
        "",
        '<input type="date" id="jfr" value="' +
          jb.from +
          '" aria-label="From date">',
      ) +
      f("Focus on work days, min", "jfo", jb.jf),
  );
  h += sg(
    "Alerts",
    ck("Alerts on", "nton", nt.on) +
      ck("Prayer times", "ntp", nt.prayer) +
      ck("Focus goal reached", "ntf", nt.focus) +
      ck("Evening close-out", "nte", nt.evening) +
      ctx.row(
        "Remind me before a plan",
        "",
        '<select id="ntl" aria-label="Lead time">' +
          [0, 5, 10, 15]
            .map(function (m) {
              return (
                '<option value="' +
                m +
                '"' +
                (+nt.lead === m ? " selected" : "") +
                ">" +
                (m ? m + " min before" : "At the start") +
                "</option>"
              );
            })
            .join("") +
          "</select>",
      ) +
      '<div class="add"><button class="btn alt" data-a="nperm">Allow phone notifications</button><button class="btn alt" data-a="ics">Download today’s timeline (.ics)</button></div><p class="note" id="ntst"></p>',
  );
  h +=
    '<div class="add"><button class="btn" data-a="sets">Save settings</button></div>';
  h += ctx.adpView();
  h += sg("Your data", ctx.acUI());
  return h;
}
