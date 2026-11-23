export function vMore(ctx) {
  if (ctx.sub === "home" || !ctx.sub) return ctx.moreHub();
  return (
    ctx.subCard() +
    {
      learn: ctx.vLearn,
      archive: ctx.vArchive,
      money: ctx.vMoney,
      adhkar: ctx.vAdhkar,
      set: function () {
        return ctx.vSet();
      },
    }[ctx.sub]()
  );
}
