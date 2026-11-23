/** Owns the current normalized tracker state and controlled whole-state replacement. */
export function createAppState(initialState) {
  let currentState = initialState;
  return {
    get state() { return currentState; },
    set state(nextState) { currentState = nextState; },
  };
}
