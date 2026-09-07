/**
 * All-in-One Software Project & Quality Management Platform
 * V1.5 QA Workspace & Queue View
 */

const QaWorkspaceView = {
  render(container) {
    const project = store.getActiveProject();
    const activeUser = store.getActiveUser();
    const tickets = store.getTickets(project.id);
    const readyTickets = tickets.filter(t => t.status === "Ready for QA");
    const inTestingTickets = tickets.filter(t => t.status === "QA Testing");

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- QA Workspace Header Banner -->
        <div class="glass-panel rounded-2xl p-6 shadow-sm border border-purple-200/80 bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/40">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-purple-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                <i data-lucide="check-check" class="w-6 h-6"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">QA Testing Queue</h1>
                  <span class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800">
                    ${readyTickets.length} Items Ready for Verification
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-1">Review developer handover packages, acceptance criteria, linked test suites, and launch live test runs.</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button onclick="window.app.switchPersona('u-qa')" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5">
                <i data-lucide="user-check" class="w-4 h-4"></i> Switch to QA Persona
              </button>
              <button onclick="window.app.navigate('test-runs')" class="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5">
                <i data-lucide="play" class="w-4 h-4"></i> Test Runs Hub
              </button>
            </div>
          </div>
        </div>

        <!-- Section 1: Ready for QA Handover Queue -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="inbox" class="w-5 h-5 text-purple-600"></i> Incoming Handover Queue (Ready for QA)
            </h2>
            <span class="text-xs text-slate-500 font-medium">${readyTickets.length} tickets waiting for QA testing</span>
          </div>

          ${readyTickets.length === 0 ? `
            <div class="bg-white rounded-2xl p-10 border border-slate-200 text-center shadow-sm">
              <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <i data-lucide="check-circle-2" class="w-6 h-6"></i>
              </div>
              <h3 class="text-sm font-bold text-slate-800">QA Queue is Clear!</h3>
              <p class="text-xs text-slate-500 mt-1">No items currently waiting in "Ready for QA". Developers will submit items here when ready.</p>
              <button onclick="window.app.navigate('tickets')" class="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition">
                View Kanban Board →
              </button>
            </div>
          ` : `
            <div class="grid grid-cols-1 gap-4">
              ${readyTickets.map(t => this.renderQueueCard(t)).join("")}
            </div>
          `}
        </div>

        <!-- Section 2: Active Tickets Currently in QA Testing -->
        <div class="space-y-4 pt-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="loader" class="w-5 h-5 text-pink-600"></i> Actively Testing (${inTestingTickets.length})
            </h2>
            <span class="text-xs text-slate-500 font-medium">Work items currently undergoing test suites</span>
          </div>

          ${inTestingTickets.length === 0 ? `
            <div class="bg-white rounded-xl p-6 border border-slate-200 text-center text-xs text-slate-400">
              No tickets currently under active test execution. Select a ticket above and click "Start QA Testing".
            </div>
          ` : `
            <div class="grid grid-cols-1 gap-4">
              ${inTestingTickets.map(t => this.renderInTestingCard(t)).join("")}
            </div>
          `}
        </div>

        <!-- QA Modals Container -->
        <div id="qaModalContainer"></div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderQueueCard(t) {
    const dev = store.getUserById(t.assigneeId);
    const linkedCases = (t.linkedTestCases || []).map(cid => store.getTestCaseById(cid)).filter(Boolean);
    const acTotal = t.acceptanceCriteria ? t.acceptanceCriteria.length : 0;
    const acDone = t.acceptanceCriteria ? t.acceptanceCriteria.filter(a => a.done).length : 0;

    return `
      <div class="bg-white rounded-xl border border-purple-200 shadow-sm p-5 card-hover">
        <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <!-- Ticket & Handover Details -->
          <div class="space-y-3 flex-1">
            <div class="flex items-center gap-2.5">
              <span class="font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-xs">${t.key}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">${t.type}</span>
              <span class="text-xs font-semibold ${
                t.priority === 'Critical' ? 'text-red-600' :
                t.priority === 'High' ? 'text-orange-600' : 'text-slate-600'
              }">${t.priority} Priority</span>
            </div>

            <h3 class="text-base font-bold text-slate-900">${t.title}</h3>
            <p class="text-xs text-slate-600 leading-relaxed">${t.description || 'No description'}</p>

            <!-- Handover Box -->
            ${t.devHandoverNotes ? `
              <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div class="flex items-center justify-between font-bold text-slate-800">
                  <span class="flex items-center gap-1.5 text-purple-700">
                    <i data-lucide="package-check" class="w-4 h-4"></i> Build Handover: <strong>${t.devHandoverNotes.buildVersion}</strong>
                  </span>
                  <span class="text-[11px] text-slate-500">Submitted by ${t.devHandoverNotes.submittedBy || dev.name}</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div><strong>Environment:</strong> <span class="text-slate-800">${t.devHandoverNotes.environment}</span></div>
                  <div><strong>Branch:</strong> <span class="font-mono text-slate-900">${t.devHandoverNotes.branch}</span></div>
                </div>
                <div class="bg-white p-2.5 rounded border border-slate-200 text-slate-700">
                  <span class="font-semibold text-slate-500">Dev Instructions:</span> "${t.devHandoverNotes.notes}"
                </div>
              </div>
            ` : ''}

            <!-- Acceptance Criteria Checklist Preview -->
            <div class="pt-1">
              <div class="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Acceptance Criteria (${acDone}/${acTotal})</span>
              </div>
              <div class="space-y-1">
                ${(t.acceptanceCriteria || []).map(ac => `
                  <div class="flex items-center gap-2 text-xs text-slate-600">
                    <i data-lucide="${ac.done ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5 ${ac.done ? 'text-emerald-600' : 'text-slate-300'}"></i>
                    <span class="${ac.done ? 'line-through text-slate-400' : ''}">${ac.text}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- QA Action Sidebar -->
          <div class="lg:w-64 shrink-0 bg-purple-50/60 p-4 rounded-xl border border-purple-100 space-y-3 flex flex-col justify-between">
            <div>
              <div class="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">QA Actions</div>
              <div class="text-xs text-slate-600 space-y-1 mb-3">
                <div>Linked Test Cases: <strong>${linkedCases.length}</strong></div>
                <div>Developer: <strong>${dev.name}</strong></div>
              </div>
            </div>

            <div class="space-y-2">
              <button onclick="QaWorkspaceView.startTesting('${t.id}')" class="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5">
                <i data-lucide="play" class="w-4 h-4"></i> Start Testing Ticket
              </button>
              <button onclick="QaWorkspaceView.openCreateTestCaseForStory('${t.id}')" class="w-full py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-slate-900"></i> + Add Test Case
              </button>
              <button onclick="QaWorkspaceView.rejectBackToDev('${t.id}')" class="w-full py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1">
                <i data-lucide="corner-up-left" class="w-3.5 h-3.5"></i> Reject to Dev
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderInTestingCard(t) {
    return `
      <div class="bg-white rounded-xl border border-pink-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-pink-600 text-xs">${t.key}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800">● QA Testing</span>
          </div>
          <h4 class="text-sm font-bold text-slate-900">${t.title}</h4>
          <p class="text-xs text-slate-500">Target Env: ${t.devHandoverNotes ? t.devHandoverNotes.environment : 'Staging'}</p>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="window.app.openCreateTestRunModal()" class="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5">
            <i data-lucide="play" class="w-3.5 h-3.5"></i> Execute Test Run
          </button>
          <button onclick="QaWorkspaceView.markSignOffDone('${t.id}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> QA Sign-off (Done)
          </button>
        </div>
      </div>
    `;
  },

  startTesting(ticketId) {
    store.updateTicketStatus(ticketId, "QA Testing");
    window.app.toast("Testing Started", "Ticket status moved to 'QA Testing'.", "info");
    this.render(document.getElementById("mainContent"));
  },

  markSignOffDone(ticketId) {
    store.updateTicketStatus(ticketId, "Done");
    window.app.toast("QA Sign-off Complete", "Ticket passed all criteria and marked Done!", "success");
    this.render(document.getElementById("mainContent"));
  },

  rejectBackToDev(ticketId) {
    const reason = prompt("Reason for rejecting back to Developer:", "Build fails smoke test / Acceptance criteria unmet.");
    if (reason) {
      store.updateTicketStatus(ticketId, "In Development");
      store.addTicketComment(ticketId, `[QA Rejection] Returned to Development: ${reason}`);
      window.app.toast("Ticket Rejected", "Moved back to In Development for developer attention.", "warning");
      this.render(document.getElementById("mainContent"));
    }
  },

  openCreateTestCaseForStory(ticketId) {
    TestCasesView.openCreateModal(ticketId);
  }
};

window.QaWorkspaceView = QaWorkspaceView;
