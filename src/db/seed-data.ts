import { NewQuestion } from "./schema";

export const INITIAL_SIX_SIGMA_QUESTIONS: Omit<
  NewQuestion,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    questionNumber: 1,
    questionText:
      "Six Sigma primarily aims to reduce process output variation to a level of approximately how many defects per million opportunities (DPMO)?",
    optionA: "3.4",
    optionB: "34",
    optionC: "340",
    optionD: "6.0",
    correctOption: "A",
    explanation:
      "A 6-sigma process yields about 3.4 DPMO (long-term, with 1.5-sigma shift).",
    dmaicPhase: "Define",
  },
  {
    questionNumber: 2,
    questionText:
      "Which of the following is the correct sequence of the Six Sigma DMAIC methodology?",
    optionA: "Define, Measure, Analyze, Improve, Control",
    optionB: "Design, Measure, Analyze, Implement, Confirm",
    optionC: "Define, Manage, Assess, Improve, Close",
    optionD: "Discover, Measure, Act, Investigate, Close",
    correctOption: "A",
    explanation: "DMAIC stands for Define-Measure-Analyze-Improve-Control.",
    dmaicPhase: "Define",
  },
  {
    questionNumber: 3,
    questionText:
      "In the DMAIC cycle, in which phase is the Project Charter typically created?",
    optionA: "Measure",
    optionB: "Analyze",
    optionC: "Define",
    optionD: "Control",
    correctOption: "C",
    explanation:
      "The project charter, scope, and business case are established in the Define phase.",
    dmaicPhase: "Define",
  },
  {
    questionNumber: 4,
    questionText: "SIPOC is a tool used to summarize which of the following?",
    optionA: "Suppliers, Inputs, Process, Outputs, Customers",
    optionB: "Standards, Information, Procedure, Output, Cost",
    optionC: "Scope, Impact, Plan, Objective, Control",
    optionD: "Sample, Interval, Process, Output, Capability",
    correctOption: "A",
    explanation:
      "SIPOC provides a high-level view of a process: Suppliers-Inputs-Process-Outputs-Customers.",
    dmaicPhase: "Define",
  },
  {
    questionNumber: 5,
    questionText:
      "Which term describes a characteristic that is critical to the customer's satisfaction with a product or service?",
    optionA: "CTQ (Critical to Quality)",
    optionB: "COPQ (Cost of Poor Quality)",
    optionC: "OEE (Overall Equipment Effectiveness)",
    optionD: "TPM (Total Productive Maintenance)",
    correctOption: "A",
    explanation:
      "CTQ characteristics are the key measurable attributes that matter most to the customer.",
    dmaicPhase: "Define",
  },
  {
    questionNumber: 6,
    questionText:
      "Voice of the Customer (VOC) data is best gathered using which of the following methods?",
    optionA: "Surveys, interviews, and complaint records",
    optionB: "Control charts only",
    optionC: "Capability studies only",
    optionD: "ANOVA testing",
    correctOption: "A",
    explanation:
      "VOC is collected through direct/indirect customer feedback channels such as surveys, interviews, and complaints.",
    dmaicPhase: "Define",
  },
  {
    questionNumber: 7,
    questionText: "What is the primary purpose of the Measure phase in DMAIC?",
    optionA: "To implement corrective actions",
    optionB: "To establish baseline performance and collect reliable data",
    optionC: "To sustain the improved process",
    optionD: "To define the project team",
    correctOption: "B",
    explanation:
      "The Measure phase focuses on understanding current performance through valid, reliable data collection.",
    dmaicPhase: "Measure",
  },
  {
    questionNumber: 8,
    questionText:
      "Which of the following best describes 'Gage R&R' (Repeatability and Reproducibility)?",
    optionA: "A study to evaluate the accuracy of a financial forecast",
    optionB:
      "A study to assess how much variation in measurements comes from the measurement system itself",
    optionC: "A method to reduce cycle time",
    optionD: "A tool used only in the Control phase",
    correctOption: "B",
    explanation:
      "Gage R&R is a Measurement System Analysis (MSA) tool quantifying measurement variation from equipment and appraisers.",
    dmaicPhase: "Measure",
  },
  {
    questionNumber: 9,
    questionText: "Process capability index Cpk measures:",
    optionA: "The average of the process",
    optionB:
      "How well a process output fits within specification limits, accounting for centering",
    optionC: "The number of defects produced per day",
    optionD: "The speed of the process",
    correctOption: "B",
    explanation:
      "Cpk accounts for both process spread and how centered the process is relative to specification limits.",
    dmaicPhase: "Measure",
  },
  {
    questionNumber: 10,
    questionText:
      "Which type of data is considered 'continuous' (variable) data?",
    optionA: "Pass/Fail result",
    optionB: "Number of defects",
    optionC: "Weight of a product in grams",
    optionD: "Yes/No response",
    correctOption: "C",
    explanation:
      "Continuous data can take any value within a range, such as weight, length, or time.",
    dmaicPhase: "Measure",
  },
  {
    questionNumber: 11,
    questionText: "A Pareto Chart is primarily used to:",
    optionA: "Show the trend of a process over time",
    optionB:
      "Identify the vital few causes contributing to the majority of problems",
    optionC: "Display the correlation between two variables",
    optionD: "Control the process using upper and lower limits",
    correctOption: "B",
    explanation:
      "Pareto analysis applies the 80/20 rule to prioritize the most significant contributing factors.",
    dmaicPhase: "Analyze",
  },
  {
    questionNumber: 12,
    questionText:
      "A Fishbone (Ishikawa) Diagram is used in the Analyze phase mainly to:",
    optionA: "Track project timelines",
    optionB: "Brainstorm and organize potential root causes of a problem",
    optionC: "Calculate the sigma level",
    optionD: "Set control limits",
    correctOption: "B",
    explanation:
      "The fishbone diagram categorizes potential causes (e.g., Man, Machine, Method, Material) of an effect.",
    dmaicPhase: "Analyze",
  },
  {
    questionNumber: 13,
    questionText:
      "Which statistical test would you use to compare the means of two independent samples?",
    optionA: "Chi-square test",
    optionB: "Two-sample t-test",
    optionC: "Regression analysis",
    optionD: "Control chart",
    correctOption: "B",
    explanation:
      "A two-sample t-test compares the means of two independent groups.",
    dmaicPhase: "Analyze",
  },
  {
    questionNumber: 14,
    questionText:
      "A p-value less than 0.05 in a hypothesis test typically indicates:",
    optionA: "The null hypothesis should be accepted",
    optionB:
      "There is statistically significant evidence to reject the null hypothesis",
    optionC: "The sample size was too small",
    optionD: "The data is normally distributed",
    correctOption: "B",
    explanation:
      "A p-value below the common alpha of 0.05 suggests rejecting the null hypothesis.",
    dmaicPhase: "Analyze",
  },
  {
    questionNumber: 15,
    questionText: "FMEA stands for:",
    optionA: "Failure Mode and Effects Analysis",
    optionB: "Full Measurement and Evaluation Approach",
    optionC: "Final Manufacturing Efficiency Audit",
    optionD: "Factor Mode Elimination Analysis",
    correctOption: "A",
    explanation:
      "FMEA is a structured approach to identify potential failure modes and their impact/severity.",
    dmaicPhase: "Analyze",
  },
  {
    questionNumber: 16,
    questionText:
      "In FMEA, the Risk Priority Number (RPN) is calculated as:",
    optionA: "Severity + Occurrence + Detection",
    optionB: "Severity x Occurrence x Detection",
    optionC: "Severity / Occurrence",
    optionD: "Occurrence x Detection only",
    correctOption: "B",
    explanation:
      "RPN = Severity x Occurrence x Detection, used to prioritize corrective actions.",
    dmaicPhase: "Improve",
  },
  {
    questionNumber: 17,
    questionText: "Which of the following is an example of 'Poka-Yoke'?",
    optionA: "A checklist reviewed once a month",
    optionB: "A fixture designed so a part can only be inserted correctly",
    optionC: "A monthly performance report",
    optionD: "A customer satisfaction survey",
    correctOption: "B",
    explanation:
      "Poka-Yoke (mistake-proofing) physically prevents errors from occurring.",
    dmaicPhase: "Improve",
  },
  {
    questionNumber: 18,
    questionText:
      "Which Lean concept refers to the seven (or eight) categories of waste in a process?",
    optionA: "Kaizen",
    optionB: "Muda",
    optionC: "Gemba",
    optionD: "Kanban",
    correctOption: "B",
    explanation:
      "Muda is the Japanese term for waste; common categories include TIMWOOD(S).",
    dmaicPhase: "Improve",
  },
  {
    questionNumber: 19,
    questionText:
      "Which of the following is NOT one of the traditional 8 wastes (TIMWOODS)?",
    optionA: "Transportation",
    optionB: "Inventory",
    optionC: "Overproduction",
    optionD: "Certification",
    correctOption: "D",
    explanation:
      "The 8 wastes are Transportation, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, Skills - 'Certification' is not one.",
    dmaicPhase: "Improve",
  },
  {
    questionNumber: 20,
    questionText: "A Control Chart is primarily used to:",
    optionA: "Determine root causes of variation",
    optionB: "Monitor process stability over time using statistical limits",
    optionC: "Estimate customer satisfaction",
    optionD: "Calculate the project budget",
    correctOption: "B",
    explanation:
      "Control charts track process performance over time relative to upper and lower control limits.",
    dmaicPhase: "Control",
  },
  {
    questionNumber: 21,
    questionText:
      "If a process shows a point outside the control limits on a control chart, this typically indicates:",
    optionA: "Common cause variation only",
    optionB: "A special cause (assignable cause) of variation is present",
    optionC: "The process is perfectly stable",
    optionD: "Measurement system error is impossible",
    correctOption: "B",
    explanation:
      "Points beyond control limits usually signal special cause variation requiring investigation.",
    dmaicPhase: "Control",
  },
  {
    questionNumber: 22,
    questionText:
      "Which document is typically developed in the Control phase to sustain improvements?",
    optionA: "Project Charter",
    optionB: "SIPOC diagram",
    optionC: "Control Plan",
    optionD: "Fishbone diagram",
    correctOption: "C",
    explanation:
      "The Control Plan documents how the improved process will be monitored and maintained.",
    dmaicPhase: "Control",
  },
  {
    questionNumber: 23,
    questionText:
      "Who is typically responsible for removing organizational barriers and providing resources for a Six Sigma project?",
    optionA: "Green Belt",
    optionB: "Black Belt",
    optionC: "Champion/Sponsor",
    optionD: "Process Operator",
    correctOption: "C",
    explanation:
      "The Champion/Sponsor provides resources, removes barriers, and aligns the project with business goals.",
    dmaicPhase: "Define",
  },
  {
    questionNumber: 24,
    questionText: "What does 'DPMO' stand for?",
    optionA: "Defects Per Million Opportunities",
    optionB: "Data Points per Measurement Output",
    optionC: "Design Process Management Objective",
    optionD: "Defect Prevention Management Operation",
    correctOption: "A",
    explanation:
      "DPMO is a standard metric used to calculate sigma level.",
    dmaicPhase: "Measure",
  },
  {
    questionNumber: 25,
    questionText:
      "Which of the following best describes the goal of a Kaizen event?",
    optionA: "A long-term multi-year improvement initiative",
    optionB:
      "A focused, short-term rapid improvement workshop for a specific process area",
    optionC: "A yearly financial audit",
    optionD: "A customer satisfaction survey campaign",
    correctOption: "B",
    explanation:
      "Kaizen events are short, focused workshops aimed at rapid, incremental process improvement.",
    dmaicPhase: "Improve",
  },
];
