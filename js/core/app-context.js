/** A live, explicit view of app state and helpers supplied to screen modules. */
export function createAppContext(bindings) {
  const context = Object.create(null);
  for (const [name, binding] of Object.entries(bindings)) {
    Object.defineProperty(context, name, {
      enumerable: true,
      get: binding.get,
      ...(binding.set ? { set: binding.set } : {}),
    });
  }
  return context;
}
