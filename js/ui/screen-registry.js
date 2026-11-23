/** Build the screen map once so routing stays separate from screen rendering. */
export function createScreenRegistry({ now, log, week, more }) {
  return Object.freeze({ now, log, week, more });
}

export function renderScreen(registry, page) {
  const render = registry[page];
  if (typeof render !== "function") {
    throw new Error("No renderer registered for page: " + page);
  }
  return render();
}
