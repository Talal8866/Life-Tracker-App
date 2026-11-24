function percent(weeks) {
  var possible = weeks.length * 3,
    done = weeks.reduce(function (sum, item) {
      return sum + item.week.done.filter(Boolean).length;
    }, 0);
  return possible ? Math.round((100 * done) / possible) : 0;
}

function safeUrl(value) {
  try {
    var url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch (error) {
    return "";
  }
}

function renderPlanEditor(ctx, plan) {
  var content =
    '<div class="lp-form"><label>Plan name<input id="lp-title" maxlength="80" value="' + ctx.esc(plan.title) + '"></label>' +
    '<label>Description<textarea id="lp-description" maxlength="500" rows="3">' + ctx.esc(plan.description || "") + '</textarea></label>' +
    '<div class="lp-form-row"><label>Level<input id="lp-level" maxlength="40" value="' + ctx.esc(plan.level || "Beginner") + '"></label>' +
    '<label>Minutes per day<input id="lp-minutes" type="number" min="5" max="240" value="' + (+plan.dailyMinutes || 30) + '"></label></div>' +
    '<div class="ctl"><button class="btn" data-a="lpsave">Save plan details</button><button class="btn alt" data-a="lpcancel">Done editing</button></div></div>' +
    '<div class="lp-phase-head"><h3>Phases and weeks</h3><button class="btn alt" data-a="lpaddphase">Add phase</button></div>';
  if (!plan.phases.length) content += '<p class="mut">Add a phase, then add weeks with learning, practice, and a small outcome.</p>';
  plan.phases.forEach(function (phase, phaseIndex) {
    content += '<section class="lp-phase"><div class="lp-phase-head"><label>Phase ' + (phaseIndex + 1) + '<input id="lp-phase-' + phaseIndex + '" maxlength="80" value="' + ctx.esc(phase.title) + '"></label><div class="ctl"><button class="btn alt" data-a="lpaddweek" data-i="' + phaseIndex + '">Add week</button><button class="btn alt" data-a="lpphasedel" data-i="' + phaseIndex + '">Delete phase</button></div></div>';
    if (!phase.weeks.length) content += '<p class="mut">No weeks yet.</p>';
    phase.weeks.forEach(function (week, weekIndex) {
      var id = phaseIndex + ":" + weekIndex;
      content += '<div class="lp-week-edit"><div><b>' + ctx.esc(week.title || "Untitled week") + '</b><small>' + ctx.esc(week.learn || "Add learning details") + '</small></div><div class="ctl"><button class="btn alt" data-a="lpweekedit" data-i="' + id + '">Edit week</button><button class="del" data-a="lpweekdel" data-i="' + id + '" aria-label="Delete ' + ctx.esc(week.title || "week") + '">×</button></div></div>';
      if (ctx.LPWEDIT === id) {
        content += '<div class="lp-week-form"><label>Week title<input id="lpw-title" maxlength="100" value="' + ctx.esc(week.title || "") + '"></label>' +
          '<label>Learn<input id="lpw-learn" maxlength="500" value="' + ctx.esc(week.learn || "") + '"></label>' +
          '<label>Practice<input id="lpw-practice" maxlength="500" value="' + ctx.esc(week.practice || "") + '"></label>' +
          '<label>Make or demonstrate<input id="lpw-ship" maxlength="500" value="' + ctx.esc(week.ship || "") + '"></label>' +
          '<label>Learning resource<input id="lpw-resource" maxlength="120" value="' + ctx.esc((week.resource && week.resource.title) || "") + '"></label>' +
          '<label>Resource URL<input id="lpw-url" type="url" maxlength="500" value="' + ctx.esc((week.resource && week.resource.url) || "") + '"></label>' +
          '<div class="ctl"><button class="btn" data-a="lpweeksave" data-i="' + id + '">Save week</button><button class="btn alt" data-a="lpweekcancel">Cancel</button></div></div>';
      }
    });
    content += '</section>';
  });
  return ctx.box("Plan builder", content, "Edit the plan, organize it into phases, and add as many weeks as you need.");
}

export function vLearn(ctx) {
  var L = ctx.S.learn,
    plans = L.plans || [],
    plan = ctx.currentPlan(),
    weeks = ctx.planWeeks(),
    w = Math.max(0, Math.min(Math.max(0, weeks.length - 1), L.w || 0)),
    entry = weeks[w],
    current = entry && entry.week,
    due = ctx.dueQs().length,
    doneWeeks = weeks.filter(function (item) { return item.week.done.every(Boolean); }).length,
    selectedTab = ctx.LRT,
    body = "";

  if (!plan) return ctx.box("Learning plans", '<p class="mut">Create a plan to start tracking your learning.</p><button class="btn" data-a="lpnew">Create a plan</button>');
  var planCards = plans.map(function (item) {
    var itemWeeks = ctx.planWeeks(item), active = item.id === plan.id;
    return '<button class="lp-card' + (active ? ' active' : '') + '" data-a="lpselect" data-i="' + ctx.esc(item.id) + '" aria-pressed="' + active + '"><span><b>' + ctx.esc(item.title) + '</b><small>' + ctx.esc(item.level || "Beginner") + ' · ' + itemWeeks.length + ' weeks</small></span><span class="lp-meter"><i style="width:' + percent(itemWeeks) + '%"></i></span><small>' + percent(itemWeeks) + '%</small></button>';
  }).join("");
  var planList = ctx.box("Learning plans", '<div class="lp-list">' + planCards + '</div><div class="ctl lp-list-actions"><button class="btn" data-a="lpnew">Create a full plan</button><button class="btn alt" data-a="lpedit">' + (ctx.LPMODE === "plan" ? "Close editor" : "Edit plan") + '</button>' + (plans.length > 1 && plan.id !== "excel-hr" ? '<button class="btn alt" data-a="lpdelete">Delete plan</button>' : '') + '</div>', "Switch plans any time; each plan keeps its own progress.");

  if (ctx.LPMODE === "plan") {
    body += renderPlanEditor(ctx, plan);
  } else if (!weeks.length) {
    body += ctx.box("Your plan is ready to build", '<p class="mut">Add the first phase and week in the plan editor.</p><button class="btn" data-a="lpedit">Build this plan</button>');
  } else {
    var phaseGroups = plan.phases.map(function (phase, pi) {
      var start = 0;
      for (var k = 0; k < pi; k++) start += plan.phases[k].weeks.length;
      var weekButtons = phase.weeks.map(function (week, wi) {
        var index = start + wi;
        return '<button class="lp-week' + (index === w ? ' current' : '') + (week.done.every(Boolean) ? ' complete' : '') + '" data-a="lw" data-i="' + index + '" aria-pressed="' + (index === w) + '"><span>Week ' + (index + 1) + '</span><b>' + ctx.esc(week.title || "Untitled week") + '</b><small>' + (week.done.filter(Boolean).length) + ' of 3 steps</small></button>';
      }).join("");
      return '<section class="lp-phase"><h3>' + ctx.esc(phase.title) + (phase.optional ? ' <small>Optional</small>' : '') + '</h3><div class="lp-week-grid">' + (weekButtons || '<p class="mut">No weeks in this phase.</p>') + '</div></section>';
    }).join("");
    var tabs = [["week", "This week", current ? current.title : "Empty"], ["course", "All weeks", doneWeeks + " of " + weeks.length], ["recall", "Recall", due ? due + " due" : "Clear"]];
    body += '<div class="lgtabs" role="group" aria-label="Learning plan sections">' + tabs.map(function (tab) {
      return '<button class="lgtab" data-a="lrtab" data-i="' + tab[0] + '" aria-pressed="' + (selectedTab === tab[0]) + '"><b>' + ctx.esc(tab[1]) + '</b><small>' + ctx.esc(tab[2]) + '</small></button>';
    }).join("") + '</div>';
    if (selectedTab === "course") {
      body += ctx.box("Plan roadmap", '<div class="lp-roadmap">' + phaseGroups + '</div>', plan.description || "Choose a week to view and track its steps.");
    } else if (selectedTab === "week" && current) {
      var cards = [current.learn, current.practice, current.ship].map(function (step, index) {
        var names = ["Learn", "Practice", "Make or demonstrate"];
        return ctx.row('<b>' + names[index] + '</b>', ctx.esc(step || "Add this step in Edit plan."), ctx.tgl("lt", null, index, current.done[index]));
      }).join("");
      if (current.resource && current.resource.title) {
        var href = safeUrl(current.resource.url);
        cards += ctx.row("Learning resource", ctx.esc(current.resource.title), href ? '<a class="btn alt" href="' + ctx.esc(href) + '" target="_blank" rel="noopener">Open</a>' : "");
      }
      var pct = Math.round(100 * current.done.filter(Boolean).length / 3);
      body += ctx.lrnSec(current.done.every(Boolean), pct, entry.phase.title + " · Week " + (w + 1) + ": " + ctx.esc(current.title), current.done.filter(Boolean).length + " of 3", cards);
      body += ctx.focusBox();
      body += '<div class="ctl" style="margin-top:8px;justify-content:flex-start"><button class="btn" data-a="lfocus">Focus on this week</button><button class="btn alt" data-a="lpweekedit" data-i="' + entry.phaseIndex + ':' + entry.weekIndex + '">Edit this week</button></div>';
    } else {
      var q = ctx.rcNext(), recallBody = '<p class="mut">Nothing due. Keep going with your current week.</p>';
      if (q) {
        var card = ctx.recallCard(q);
        recallBody = '<small class="mut">Week ' + (q[0] + 1) + ', ' + ctx.esc(weeks[q[0]].week.title) + '</small><p class="qa">' + ctx.esc(card.question) + '</p>' +
          (ctx.RC.show ? '<p>' + ctx.esc(card.answer) + '</p><div class="ctl"><button class="btn alt" data-a="rcmiss">Missed it</button><button class="btn" data-a="rcgot">Got it</button></div>' : '<div class="ctl"><button class="btn" data-a="rcshow">Show answer</button></div>');
      }
      body += ctx.lrnSec(!due, due ? 0 : 100, "Recall", due ? due + " due" : "Clear", recallBody);
    }
  }
  var progress = percent(weeks),
    title = plan.title + (current ? " · " + current.title : ""),
    header = ctx.pcard({ nav: ctx.lrnNav(), t: title, s: doneWeeks + " of " + weeks.length + " weeks complete", r: progress, rl: "Plan progress", st: [[ctx.dshort(ctx.learnMin(w)), "Study time"], [plan.dailyMinutes || 30, "min/day"], [due, "Recall due"]] });
  return header + planList + body;
}
