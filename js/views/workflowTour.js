/**
 * All-in-One Software Project & Quality Management Platform
 * V1.11 Interactive End-to-End Workflow Guided Tour Demo
 */

const WorkflowTour = {
  currentStep: 0,

  steps: [
    {
      stepNumber: 1,
      title: "Step 1: PM Creates Work & Assigns Team",
      persona: "Project Manager (Alex Rivera)",
      personaId: "u-pm",
      icon: "clipboard-list",
      color: "bg-slate-900",
      description: "The Project Manager creates Epics, Stories, and Tasks with detailed acceptance criteria, and assigns Developer (David Chen) and QA Lead (Sarah Jenkins).",
      actionLabel: "Switch to Developer Hub →",
      targetView: "tickets",
      highlightNote: "Review how tickets have developer assignees, QA leads, sprints, and acceptance criteria checklists."
    },
    {
      stepNumber: 2,
      title: "Step 2: Developer Builds & Marks 'Ready for QA'",
      persona: "Developer (David Chen)",
      personaId: "u-dev",
      icon: "code",
      color: "bg-amber-600",
      description: "The Developer completes code implementation, checks off criteria, and clicks 'Mark Ready for QA' with target environment and build version #v1.4.2.",
      actionLabel: "Switch to QA Testing Queue →",
      targetView: "dev-workspace",
      highlightNote: "Notice the Developer Handover package containing target build versions, git branch, and deployment notes."
    },
    {
      stepNumber: 3,
      title: "Step 3: QA Queue & Test Case Execution",
      persona: "QA Engineer (Sarah Jenkins)",
      personaId: "u-qa",
      icon: "list-checks",
      color: "bg-purple-600",
      description: "QA receives the ticket in the QA Testing Queue, verifies handover notes, and launches an interactive Test Run with step-by-step verification.",
      actionLabel: "Open Test Execution Runner →",
      targetView: "qa-workspace",
      highlightNote: "QA steps through test cases marking Pass, Fail, or Blocked with real-time pass-rate calculation."
    },
    {
      stepNumber: 4,
      title: "Step 4: 1-Click Defect Logging from Failed Test",
      persona: "QA Engineer (Sarah Jenkins)",
      personaId: "u-qa",
      icon: "bug",
      color: "bg-red-600",
      description: "When a test case fails, QA clicks '1-Click: Log Bug from Failure', automatically linking the test case, story, failure evidence, and assigning the developer.",
      actionLabel: "View Defect Tracker →",
      targetView: "test-runs",
      highlightNote: "Zero manual duplication—test steps and failure observations are automatically converted into a structured bug report."
    },
    {
      stepNumber: 5,
      title: "Step 5: Dev Fixes Defect & QA Retests / Closes",
      persona: "Dev & QA Collaboration",
      personaId: "u-dev",
      icon: "check-check",
      color: "bg-emerald-600",
      description: "Developer deploys a fix commit and marks bug as 'Fixed'. QA retests on staging and gives final sign-off, closing the bug.",
      actionLabel: "View Executive Dashboard →",
      targetView: "bugs",
      highlightNote: "Complete audit history traces the bug from failed test to code fix and final verified closure."
    },
    {
      stepNumber: 6,
      title: "Step 6: Real-time Project & QA Health Dashboard",
      persona: "PM / Admin / Stakeholders",
      personaId: "u-pm",
      icon: "activity",
      color: "bg-indigo-600",
      description: "PM and team monitor the unified real-time dashboard: ticket workflow donut, test pass rates, defect severity breakdown, and QA Health Index score.",
      actionLabel: "Complete Tour & Explore V1",
      targetView: "dashboard",
      highlightNote: "One Project. One Workspace. One Source of Truth."
    }
  ],

  open() {
    this.currentStep = 0;
    this.renderModal();
  },

  renderModal() {
    const step = this.steps[this.currentStep];
    const totalSteps = this.steps.length;

    let modal = document.getElementById("tourModalContainer");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "tourModalContainer";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fade-in text-xs">
          <!-- Step Counter Badge -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-full ${step.color} text-white font-bold flex items-center justify-center text-sm shadow">
                ${step.stepNumber}
              </span>
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400">V1 Core Workflow Tour (Step ${step.stepNumber} of ${totalSteps})</span>
                <h3 class="text-base font-semibold text-slate-900">${step.title}</h3>
              </div>
            </div>

            <button onclick="WorkflowTour.close()" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Step Content -->
          <div class="py-6 space-y-4">
            <div class="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-slate-400 font-bold uppercase text-[10px]">Active Persona:</span>
              <span class="font-bold text-slate-800">${step.persona}</span>
            </div>

            <p class="text-sm text-slate-700 leading-relaxed font-normal">
              ${step.description}
            </p>

            <div class="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start gap-2.5 text-indigo-950">
              <i data-lucide="lightbulb" class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5"></i>
              <div>
                <strong class="font-bold">Key V1 Capability:</strong> ${step.highlightNote}
              </div>
            </div>

            <!-- Visual Progress Dots -->
            <div class="flex items-center justify-center gap-2 pt-2">
              ${this.steps.map((s, idx) => `
                <div class="h-2 rounded-full transition-all ${idx === this.currentStep ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}"></div>
              `).join("")}
            </div>
          </div>

          <!-- Footer Navigation -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button onclick="WorkflowTour.prev()" ${this.currentStep === 0 ? 'disabled class="opacity-30 cursor-not-allowed text-slate-400 px-3 py-2"' : 'class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"'}>
              ← Previous
            </button>

            <div class="flex items-center gap-2">
              <button onclick="WorkflowTour.close()" class="px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold">
                Skip Tour
              </button>
              <button onclick="WorkflowTour.next()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow transition flex items-center gap-2">
                ${step.actionLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  next() {
    const step = this.steps[this.currentStep];
    // Switch persona if specified
    if (step.personaId) {
      store.setActiveUser(step.personaId);
    }
    // Navigate to target view
    if (step.targetView) {
      window.app.navigate(step.targetView);
    }

    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.renderModal();
    } else {
      this.close();
      window.app.toast("Tour Completed", "You have explored the full V1 Project & QA core lifecycle!", "success");
    }
  },

  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      const step = this.steps[this.currentStep];
      if (step.personaId) store.setActiveUser(step.personaId);
      if (step.targetView) window.app.navigate(step.targetView);
      this.renderModal();
    }
  },

  close() {
    const modal = document.getElementById("tourModalContainer");
    if (modal) modal.remove();
  }
};

window.WorkflowTour = WorkflowTour;
