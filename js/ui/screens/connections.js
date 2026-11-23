export function vConn(ctx) {
  var L = [["github", "GitHub", "Not connected"]],
    h = "";
  h += ctx.sbox(
    "Connections",
    L.map(function (a) {
      var on = ctx.S.conn[a[0]];
      return (
        ctx.row(
          a[1],
          on ? "Connected" : a[2],
          ctx.LINK[a[0]]
            ? '<span class="acts"><a class="btn" href="' +
                ctx.esc(ctx.LINK[a[0]]) +
                '" target="_blank" rel="noopener">Sign in</a><button class="btn alt" data-a="cc" data-i="' +
                a[0] +
                '">Done</button></span>'
            : '<button class="btn alt" data-a="' +
                (on ? "cc" : "ca") +
                '" data-i="' +
                a[0] +
                '">' +
                (on ? "Recheck" : "Connect") +
                "</button>",
        ) +
        (ctx.LINK[a[0]]
          ? '<p class="note" style="word-break:break-all">If nothing opens, copy: ' +
            ctx.esc(ctx.LINK[a[0]]) +
            "</p>"
          : "")
      );
    }).join("") +
      '<div class="add"><button class="btn alt" data-a="rf">Refresh data</button></div>',
    "Linked through Composio. Works inside Claude, signed in.",
  );
  if (ctx.CERR) h += '<p class="verdict">' + ctx.esc(ctx.CERR) + "</p>";
  return h;
}
