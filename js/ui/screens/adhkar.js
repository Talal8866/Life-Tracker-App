export function vAdhkar(ctx) {
  var d = ctx.D(ctx.iso(new Date())),
    a = d.ak || {},
    L = ctx.ADK[ctx.AKL],
    c = a[ctx.AKL] || [],
    ix = ctx.AKL === "m" ? 0 : 1,
    dn = L.filter(function (x, j) {
      return (c[j] || 0) >= x[2];
    }).length,
    pp = Math.round((100 * dn) / L.length);
  var h =
    '<div style="--akfs:' +
    ctx.AKF +
    'px">' +
    L.map(function (x, j) {
      var v = c[j] || 0,
        done = v >= x[2];
      return (
        '<div class="akc' +
        (done ? " done" : "") +
        '"><button class="akm" data-a="akc" data-i="' +
        j +
        '" data-k="' +
        ctx.AKL +
        '" aria-label="Count"><div class="ar" lang="ar" dir="rtl">' +
        x[0] +
        "</div><small>" +
        ctx.esc(x[1]) +
        '</small></button><div class="akf"><b class="' +
        (done ? "ok" : "") +
        '">' +
        (done ? "\u2713 " : "") +
        v +
        " / " +
        x[2] +
        '</b><span class="acts">' +
        (x[2] >= 10 && !done
          ? '<button class="btn alt" data-a="akc" data-s="10" data-i="' +
            j +
            '" data-k="' +
            ctx.AKL +
            '">+10</button>'
          : "") +
        '<button class="del" data-a="akr" data-i="' +
        j +
        '" data-k="' +
        ctx.AKL +
        '" aria-label="Reset this card">\u21BA</button></span></div></div>'
      );
    }).join("") +
    "</div>";
  return (
    h +
    '<p class="note" style="margin-top:14px">Arabic typed from memory. Verify before relying on it.</p>'
  );
}
