export function vPlan(ctx) {
  return ctx.box(
    "Plan",
    (ctx.S.tasks.length
      ? ctx.S.tasks
          .map(function (t, i) {
            return ctx.row(
              "<span" +
                (t.d
                  ? ' style="text-decoration:line-through;color:var(--mute)"'
                  : "") +
                ">" +
                ctx.esc(t.x) +
                "</span>",
              "",
              '<span class="acts">' +
                ctx.tgl("tk", null, i, t.d) +
                ctx.del("deltk", i, "Delete") +
                "</span>",
            );
          })
          .join("")
      : '<div class="pad mut">Nothing yet. Add what you plan to do.</div>') +
      '<div class="add"><input type="text" id="tkx" placeholder="Add a plan" maxlength="100" aria-label="New plan"><button class="btn" data-a="addtk">Add</button></div>',
    "Your own list. It stays here and never appears on the Now timeline.",
  );
}
