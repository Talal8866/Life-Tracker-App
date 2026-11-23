export function vLearn(ctx) {
  var L = ctx.S.learn,
    w = L.w,
    c = ctx.CUR[w],
    dn = L.d[w] || [0, 0, 0],
    done = 0,
    j,
    wm = ctx.wkMin(w),
    wt =
      ctx.weekDays(ctx.iso(new Date())).reduce(function (a, k) {
        return a + (ctx.isRest(k) ? 0 : ctx.fgoal(k));
      }, 0) || 900,
    r = c[4] >= 0 ? ctx.RES[c[4]] : null,
    due = ctx.dueQs().length,
    left = [0, 1, 2].filter(function (i) {
      return !dn[i];
    }).length,
    q = ctx.rcNext(),
    h = "",
    b = "";
  for (j = 0; j < 24; j++) if (ctx.wdone(j)) done++;
  h += ctx.pcard({
    nav: ctx.lrnNav(),
    t: "Week " + (w + 1) + ": " + ctx.esc(c[0]),
    s: done + " of 24 weeks done",
    r: Math.round((100 * done) / 24),
    rl: "Course progress",
    st: [
      [ctx.dshort(wm), "This week"],
      [ctx.dshort(wt), "Week goal"],
      [due, "Recall due"],
    ],
  });
  var tabs = [
    ["week", "Week", left ? left + " left" : "Done"],
    ["course", "Course", done + " of 24"],
    ["recall", "Recall", due ? due + " due" : "Clear"],
  ];
  h +=
    '<div class="lgtabs" role="group" aria-label="Learn sections">' +
    tabs
      .map(function (t) {
        return (
          '<button class="lgtab" data-a="lrtab" data-i="' +
          t[0] +
          '" aria-pressed="' +
          (ctx.LRT === t[0] ? "true" : "false") +
          '"><b>' +
          t[1] +
          "</b><small>" +
          t[2] +
          "</small></button>"
        );
      })
      .join("") +
    "</div>";
  if (ctx.LRT === "week") {
    var steps = ["Learn", "Practice", "Ship"]
      .map(function (l, i) {
        return ctx.row(
          "<b>" + l + "</b>",
          ctx.esc(c[i + 1]),
          ctx.tgl("lt", null, i, dn[i]),
        );
      })
      .join("");
    if (r)
      steps += ctx.row(
        "Study material",
        ctx.esc(r[0]),
        '<a class="btn alt" href="' +
          ctx.esc(r[1]) +
          '" target="_blank" rel="noopener">Open</a>',
      );
    b += ctx.lrnSec(
      !left,
      Math.round((100 * (3 - left)) / 3),
      "Steps",
      3 - left + " of 3",
      steps,
    );
    b += ctx.focusBox();
    b +=
      '<div class="ctl" style="margin-top:8px;justify-content:flex-start"><button class="btn" data-a="lfocus">Focus on this week</button></div>';
  } else if (ctx.LRT === "course") {
    var g = '<div class="grid24">';
    for (j = 0; j < 24; j++)
      g +=
        '<button data-a="lw" data-i="' +
        j +
        '" class="' +
        (ctx.wdone(j) ? "full" : "") +
        '" aria-pressed="' +
        (j === w ? "true" : "false") +
        '">' +
        (j + 1) +
        "</button>";
    g += "</div>";
    b += ctx.lrnSec(
      done === 24,
      Math.round((100 * done) / 24),
      "Weeks",
      done + " of 24",
      g,
    );
  } else {
    var rb = '<p class="mut">Nothing due.</p>';
    if (q) {
      var qa = [ctx.CUR[q[0]][5 + q[1] * 2], ctx.CUR[q[0]][6 + q[1] * 2]];
      rb =
        '<small class="mut">Week ' +
        (q[0] + 1) +
        ", " +
        ctx.esc(ctx.CUR[q[0]][0]) +
        '</small><p class="qa">' +
        ctx.esc(qa[0]) +
        "</p>" +
        (ctx.RC.show
          ? "<p>" +
            ctx.esc(qa[1]) +
            '</p><div class="ctl"><button class="btn alt" data-a="rcmiss">Missed it</button><button class="btn" data-a="rcgot">Got it</button></div>'
          : '<div class="ctl"><button class="btn" data-a="rcshow">Show answer</button></div>');
    }
    b += ctx.lrnSec(
      !due,
      due ? 0 : 100,
      "Recall",
      due ? due + " due" : "Clear",
      rb,
    );
  }
  return h + '<div class="lgbody">' + b + "</div>";
}
