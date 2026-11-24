function makeWeek(title, learn, practice, ship, resource, url, cards) {
  return {
    title,
    learn,
    practice,
    ship,
    resource: { title: resource, url },
    cards: cards || [],
    done: [0, 0, 0],
  };
}

export function createEmptyPlan(title) {
  return {
    id: "plan-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    title: title || "New learning plan",
    description: "",
    level: "Beginner",
    dailyMinutes: 30,
    currentWeek: 0,
    phases: [],
  };
}

export function createWeek(title) {
  return makeWeek(title || "New week", "", "", "", "", "", []);
}

export function flattenPlanWeeks(plan) {
  const weeks = [];
  (plan && plan.phases ? plan.phases : []).forEach(function (phase, phaseIndex) {
    (phase.weeks || []).forEach(function (week, weekIndex) {
      weeks.push({ phase: phase, phaseIndex: phaseIndex, week: week, weekIndex: weekIndex });
    });
  });
  return weeks;
}

function createExcelPlan() {
  const tkawen = "https://academy.tkawen.com/courses/excel-professional-foundations";
  const edraak = "https://www.edraak.org/en/programs/course/ae101-vsp-2019/";
  const analysis = "https://www.edraak.org/en/programs/course/dae101-vt1-2021/";
  const dashboard = "https://www.edraak.org/en/programs/course/ed101-vt1-2021/";
  const vba = "https://www.edraak.org/en/programs/course/excelvba-vt1-2021/";
  return {
    id: "excel-hr",
    title: "Excel for HR",
    description:
      "Build practical Excel skills for HR trackers and reporting, then add optional VBA automation.",
    level: "Beginner to Intermediate",
    dailyMinutes: 30,
    currentWeek: 0,
    phases: [
      {
        title: "1. Learn the basics",
        weeks: [
          makeWeek("Excel workspace and clean data", "Explore workbooks, sheets, cells, rows, columns, number formats, and tables.", "Enter a small employee roster and practice sorting, filtering, and formatting.", "Create a clean employee information tracker with consistent columns.", "TKAWEN: Excel – Professional Foundations", tkawen),
          makeWeek("Formulas and everyday calculations", "Use cell references, SUM, COUNT, AVERAGE, MIN, MAX, and simple date calculations.", "Calculate headcount, tenure, and leave balances from sample employee data.", "Add totals and clear input rules to the employee tracker.", "TKAWEN: Excel – Professional Foundations", tkawen),
          makeWeek("Reliable data entry", "Use tables, freeze panes, data validation lists, and conditional formatting.", "Create department and employment-status dropdowns and flag missing information.", "Finish the first version of your employee database.", "TKAWEN: Excel – Professional Foundations", tkawen),
        ],
      },
      {
        title: "2. Build intermediate skills",
        weeks: [
          makeWeek("Logic and conditional summaries", "Learn IF, COUNTIF, SUMIF, COUNTIFS, and SUMIFS.", "Summarize attendance and leave by employee, month, and status.", "Build an attendance, absence, and leave tracker.", "Edraak: Advanced Excel", edraak),
          makeWeek("Lookups and dates", "Practice VLOOKUP, date differences, month boundaries, and error handling.", "Match interview records to vacancies and calculate hiring dates.", "Build a recruitment and interview tracker.", "Edraak: Advanced Excel", edraak),
          makeWeek("PivotTables and data checks", "Create PivotTables, group dates, filter results, and spot duplicate or incomplete rows.", "Summarize headcount and absences by department and month.", "Write a short HR summary from the PivotTable results.", "Edraak: Advanced Excel", edraak),
        ],
      },
      {
        title: "3. Reporting and analysis",
        weeks: [
          makeWeek("Charts that answer a question", "Choose suitable charts, labels, titles, and readable color use.", "Chart monthly attendance and recruitment stages.", "Add two useful charts to an HR report.", "Edraak: Data Analysis Using Excel", analysis),
          makeWeek("Monthly HR dashboard", "Combine PivotTables, slicers, charts, and key metrics on one sheet.", "Build a headcount and attendance dashboard from sample data.", "Create your monthly HR dashboard and timesheet summary.", "Edraak: Building Dashboard Using Excel", dashboard),
          makeWeek("Review and present your work", "Check formulas, refresh PivotTables, and explain what each metric means.", "Test the dashboard with a new month of sample records.", "Package the four HR workbooks with a short usage note.", "Edraak: Data Analysis Using Excel", analysis),
        ],
      },
      {
        title: "4. Optional: VBA and macros",
        optional: true,
        weeks: [
          makeWeek("Record and inspect a macro", "Understand macro security and record a simple formatting macro.", "Record, inspect, and rerun the macro on a copy of a workbook.", "Document when the macro is useful and how to run it safely.", "Microsoft Learn: Getting started with VBA in Office", "https://learn.microsoft.com/en-us/office/vba/library-reference/concepts/getting-started-with-vba-in-office", [{ question: "When should you start learning VBA?", answer: "After you are comfortable building and checking Excel workbooks manually." }]),
          makeWeek("VBA fundamentals", "Learn the VBA editor, procedures, variables, ranges, and basic loops.", "Write a small macro that formats a copy of a monthly report.", "Keep the macro in a test workbook with clear comments.", "Edraak: Programming VBA Using Excel", vba),
          makeWeek("Automate a repeatable HR task", "Use buttons carefully, handle blank data, and keep a manual fallback.", "Automate one repetitive formatting or report-preparation step.", "Review the result and keep the automation optional for coworkers.", "Edraak: Programming VBA Using Excel", vba),
        ],
      },
    ],
  };
}

function createLegacyPlan(course, learning, resources) {
  const phases = [
    { title: "Foundations", weeks: [] },
    { title: "Angular core", weeks: [] },
    { title: "Quality and delivery", weeks: [] },
    { title: "Backend and system design", weeks: [] },
  ];
  course.forEach(function (item, index) {
    const phaseIndex = index < 7 ? 0 : index < 15 ? 1 : index < 19 ? 2 : 3;
    phases[phaseIndex].weeks.push({
      title: item[0],
      learn: item[1],
      practice: item[2],
      ship: item[3],
      resource: item[4] >= 0 && resources && resources[item[4]]
        ? { title: resources[item[4]][0], url: resources[item[4]][1] }
        : { title: "", url: "" },
      cards: item.length > 6 ? [{ question: item[5], answer: item[6] }, { question: item[7], answer: item[8] }].filter(function (card) { return card.question && card.answer; }) : [],
      done: (learning.d && learning.d[index]) || [0, 0, 0],
    });
  });
  const sr = {};
  course.forEach(function (item, index) {
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const oldReview = learning.sr && learning.sr[index * 2 + cardIndex];
      if (oldReview) sr["advanced-frontend:" + index + ":" + cardIndex] = oldReview;
    }
  });
  return {
    id: "advanced-frontend",
    title: "Advanced Frontend Development",
    description: "Your existing 24-week development track, preserved with its progress.",
    level: "Intermediate",
    dailyMinutes: 30,
    currentWeek: Math.max(0, +learning.w || 0),
    sr,
    phases,
  };
}

export function ensureLearningPlans(learning, course, resources) {
  const state = learning || {};
  if (!Array.isArray(state.plans)) {
    state.plans = [createExcelPlan()];
    if (Array.isArray(course) && course.length) state.plans.push(createLegacyPlan(course, state, resources));
    state.activePlanId = "excel-hr";
    state.w = 0;
    state.d = {};
    state.sr = {};
  }
  if (!state.plans.some(function (plan) { return plan.id === "excel-hr"; }))
    state.plans.unshift(createExcelPlan());
  if (!state.activePlanId || !state.plans.some(function (plan) { return plan.id === state.activePlanId; }))
    state.activePlanId = state.plans[0] ? state.plans[0].id : "";
  state.plans.forEach(function (plan) {
    plan.currentWeek = Math.max(0, +plan.currentWeek || 0);
    plan.phases = Array.isArray(plan.phases) ? plan.phases : [];
    plan.phases.forEach(function (phase) {
      phase.weeks = Array.isArray(phase.weeks) ? phase.weeks : [];
      phase.weeks.forEach(function (week) {
        week.done = Array.isArray(week.done) ? week.done : [0, 0, 0];
        week.cards = Array.isArray(week.cards) ? week.cards : [];
        week.resource = week.resource || { title: "", url: "" };
      });
    });
      plan.currentWeek = Math.min(plan.currentWeek, Math.max(0, flattenPlanWeeks(plan).length - 1));
  });
  return state;
}
