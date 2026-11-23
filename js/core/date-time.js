export function z(n) {
  return String(n).padStart(2, "0");
}
export function iso(d) {
  return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
}
export function parse(s) {
  var a = s.split("-");
  return new Date(+a[0], +a[1] - 1, +a[2]);
}
export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
export function fmt(m) {
  m = ((Math.round(m) % 1440) + 1440) % 1440;
  return z(Math.floor(m / 60)) + ":" + z(m % 60);
}
export function mins(t) {
  var a = String(t || "0:0").split(":");
  return +a[0] * 60 + +a[1];
}
export function dur(m) {
  m = Math.round(m);
  var h = Math.floor(m / 60);
  return h ? h + "h " + (m % 60) + "m" : m + "m";
}
export function mmss(ms) {
  var s = Math.floor(ms / 1000);
  return z(Math.floor(s / 60)) + ":" + z(s % 60);
}
