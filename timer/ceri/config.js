const TIMER_CONFIG = {
  configVersion: 3,
  activePlan: "ceri-session",
  streamName: "TLC Storyworks",
  planName: "Ceri's Writing Session",
  plans: {
    "ceri-session": {
      name: "Ceri's Writing Session",
      stages: [
        { name: "Setup", minutes: 15, writing: false },
        { name: "Writing Sprint 1", minutes: 20, writing: true },
        { name: "Break", minutes: 10, writing: false },
        { name: "Writing Sprint 2", minutes: 20, writing: true },
        { name: "Break", minutes: 5, writing: false },
        { name: "Writing Sprint 3", minutes: 20, writing: true },
        { name: "Wrap-Up", minutes: 15, writing: false }
      ]
    }
  },
  display: {
    showWritingProgress: true,
    showStreamProgress: true,
    showNextStage: true,
    showPlanName: true
  },
  labels: {
    writingIcon: "Writing",
    breakIcon: "Break",
    nextPrefix: "Next",
    writingProgressLabel: "Writing progress",
    streamProgressLabel: "Stream progress"
  }
};
const TIMER_PLAN = TIMER_CONFIG.plans[TIMER_CONFIG.activePlan];