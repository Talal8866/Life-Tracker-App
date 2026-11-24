import assert from "node:assert/strict";
import test from "node:test";
import { ensureLearningPlans, createEmptyPlan } from "../js/domain/learning-plans.js";

test("seeds Excel as the active plan and keeps an existing course", () => {
  const course = [["Legacy course", "Learn", "Practice", "Ship", -1, "Question", "Answer"]];
  const review = { b: 3, due: "2030-01-01" };
  const learning = { w: 0, d: { 0: [1, 0, 0] }, n: {}, sr: { 0: review } };

  ensureLearningPlans(learning, course);

  assert.equal(learning.plans[0].id, "excel-hr");
  assert.equal(learning.activePlanId, "excel-hr");
  assert.ok(learning.plans.some((plan) => plan.id === "advanced-frontend"));
  assert.deepEqual(learning.plans[1].phases[0].weeks[0].done, [1, 0, 0]);
  assert.deepEqual(learning.plans[1].sr["advanced-frontend:0:0"], review);
});

test("creates a plan with editable phase and week collections", () => {
  const plan = createEmptyPlan("My plan");

  assert.equal(plan.title, "My plan");
  assert.equal(plan.currentWeek, 0);
  assert.deepEqual(plan.phases, []);
  assert.ok(plan.id);
});

test("keeps each existing plan's current week when normalizing", () => {
  const plan = createEmptyPlan("Existing plan");
  plan.id = "existing";
  plan.currentWeek = 1;
  plan.phases = [{ title: "Phase", weeks: [{ title: "Week 0", done: [0, 0, 0] }, { title: "Week 1", done: [0, 0, 0] }] }];
  const learning = { plans: [plan], activePlanId: "existing", w: 0, d: {}, n: {}, sr: {} };

  ensureLearningPlans(learning, []);

  assert.equal(learning.plans.find((item) => item.id === "existing").currentWeek, 1);
});

test("does not duplicate seeded plans when normalized repeatedly", () => {
  const learning = { plans: [], activePlanId: "", w: 0, d: {}, n: {}, sr: {} };

  ensureLearningPlans(learning, []);
  ensureLearningPlans(learning, []);

  assert.equal(learning.plans.filter((plan) => plan.id === "excel-hr").length, 1);
});
