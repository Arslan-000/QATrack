/**
 * All-in-One Software Project & Quality Management Platform
 * V1.4 Developer Workflow Hub ("My Work & Handover")
 */

const DevWorkspaceView = {
  render(container) {
    const project = store.getActiveProject();
    const activeUser = store.getActiveUser();
    const tickets = store.getTickets(project.id);
    const bugs = store.getBugs(project.id);

    // If current persona is Developer (u-dev), filter by them; otherwise show David Chen or let user switch
    const devUserId = activeUser.role === "Developer" ? activeUser.id : "u-dev";
    const devUser = store.getUserById(devUserId);

    const devTickets = tickets.filter(t => t.assigneeId === devUserId);
    const devBugs = bugs.filter(b => b.assigneeId === devUserId && b.status !== "Closed");

    const inProgressTickets = devTickets.filter(t => t.status === "In Development" || t.status === "To Do");
    const readyTickets = devTickets.filter(t => t.status === "Ready for QA");
    const testingTickets = devTickets.filter(t => t.status === "QA Testing");

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Developer Hub Header -->
        <div class="glass-panel rounded-2xl p-6 shadow-sm border border-slate-200">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl ${devUser.color} text-white font-bold text-lg flex items-center justify-center shadow-md">
                ${devUser.initials}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">Developer Workspace</h1>
                  <span class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                    ${devUser.name} (${devUser.role})
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-1">Manage assigned features, commit references, fix assigned defects, and trigger QA handover.</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button onclick="window.app.switchPersona('u-dev')" class="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5">
                <i data-lucide="user-check" class="w-4 h-4"></i> Switch to Dev Persona
              </button>
            </div>
          </div>
        </div>

        <!-- Dev Metric Counters -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase">In Development</span>
              <div class="text-2xl font-semibold text-amber-600 mt-1">${inProgressTickets.length}</div>
            </div>
            <div class="p-2.5 bg-amber-50 text-amber-600 rounded-lg"><i data-lucide="code" class="w-5 h-5"></i></div>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase">Waiting on QA</span>
              <div class="text-2xl font-semibold text-purple-600 mt-1">${readyTickets.length + testingTickets.length}</div>
            </div>
            <div class="p-2.5 bg-purple-50 text-purple-600 rounded-lg"><i data-lucide="clock" class="w-5 h-5"></i></div>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase">Defects to Fix</span>
              <div class="text-2xl font-semibold text-red-600 mt-1">${devBugs.length}</div>
            </div>
            <div class="p-2.5 bg-red-50 text-red-600 rounded-lg"><i data-lucide="bug" class="w-5 h-5"></i></div>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase">Completed in Sprint</span>
              <div class="text-2xl font-semibold text-emerald-600 mt-1">${devTickets.filter(t => t.status === "Done").length}</div>
            </div>
            <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg"><i data-lucide="check-circle" class="w-5 h-5"></i></div>
          </div>
        </div>

        <!-- Section 1: Assigned Feature Tickets & Ready for QA Action -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="layers" class="w-4 h-4 text-slate-700"></i> My Assigned Work Items (${devTickets.length})
            </h2>
            <span class="text-xs text-slate-500">Project: <strong>${project.name}</strong></span>
          </div>

          <div class="divide-y divide-slate-100">
            ${devTickets.length === 0 ? `
              <p class="text-xs text-slate-400 py-8 text-center">No tickets currently assigned to this developer.</p>
            ` : devTickets.map(t => this.renderDevTicketRow(t)).join("")}
          </div>
        </div>

        <!-- Section 2: Assigned Defects Requiring Developer Fix -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-200 bg-red-50/40 flex items-center justify-between">
            <h2 class="text-sm font-bold text-red-900 flex items-center gap-2">
              <i data-lucide="alert-octagon" class="w-4 h-4 text-red-600"></i> Defect Queue Assigned for Fix (${devBugs.length})
            </h2>
            <span class="text-xs text-red-700 font-medium">Bugs requiring code fix & build deployment</span>
          </div>

          <div class="divide-y divide-slate-100">
            ${devBugs.length === 0 ? `
              <p class="text-xs text-emerald-600 font-medium py-8 text-center flex items-center justify-center gap-2">
                <i data-lucide="check-circle-2" class="w-4 h-4"></i> No open defects assigned! All clear.
              </p>
            ` : devBugs.map(b => this.renderDevBugRow(b)).join("")}
          </div>
        </div>

        <!-- Dev Modals Container -->
        <div id="devModalContainer"></div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderDevTicketRow(t) {
    const isDevActive = t.status === "In Development" || t.status === "To Do";
    const acTotal = t.acceptanceCriteria ? t.acceptanceCriteria.length : 0;
    const acDone = t.acceptanceCriteria ? t.acceptanceCriteria.filter(a => a.done).length : 0;

    return `
      <div class="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1.5 flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">${t.type}</span>
            <span class="font-mono font-bold text-slate-900 text-xs">${t.key}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
              t.status === 'Ready for QA' ? 'bg-purple-100 text-purple-800' :
              t.status === 'In Development' ? 'bg-amber-100 text-amber-800' :
              t.status === 'QA Testing' ? 'bg-pink-100 text-pink-800' :
              t.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }">● ${t.status}</span>
            <span class="text-[10px] font-semibold text-slate-500">Sprint: ${t.sprint}</span>
          </div>

          <h3 class="text-sm font-bold text-slate-900">${t.title}</h3>
          <p class="text-xs text-slate-500 line-clamp-1">${t.description || 'No description'}</p>

          <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span class="flex items-center gap-1"><i data-lucide="check-square" class="w-3.5 h-3.5 text-emerald-600"></i> AC: ${acDone}/${acTotal}</span>
            <span class="flex items-center gap-1"><i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i> QA Lead: ${store.getUserName(t.qaAssigneeId)}</span>
            ${t.devHandoverNotes ? `
              <span class="text-purple-700 font-semibold flex items-center gap-1"><i data-lucide="terminal" class="w-3.5 h-3.5"></i> ${t.devHandoverNotes.buildVersion}</span>
            ` : ''}
          </div>
        </div>

        <!-- Dev Action Button -->
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="TicketsView.openTicketDetails('${t.id}')" class="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition">
            Details
          </button>
          ${isDevActive ? `
            <button onclick="TicketsView.openHandoverModal('${t.id}')" class="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5">
              <i data-lucide="send" class="w-3.5 h-3.5"></i> Mark Ready for QA
            </button>
          ` : `
            <span class="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded">In QA Workflow</span>
          `}
        </div>
      </div>
    `;
  },

  renderDevBugRow(b) {
    return `
      <div class="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1.5 flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-red-600 text-xs">${b.key}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
              b.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
            }">${b.severity}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">● ${b.status}</span>
            <span class="text-[10px] text-slate-500">Env: ${b.environment}</span>
          </div>

          <h3 class="text-sm font-bold text-slate-900">${b.title}</h3>
          <p class="text-xs text-slate-600 line-clamp-1"><strong>Actual:</strong> ${b.actualResult || b.description}</p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button onclick="BugsView.openBugDetails('${b.id}')" class="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition">
            View Defect
          </button>
          ${b.status !== 'Fixed' ? `
            <button onclick="DevWorkspaceView.openFixBugModal('${b.id}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5">
              <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Deploy Fix & Retest
            </button>
          ` : `
            <span class="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              ✓ Fixed (Waiting QA Retest)
            </span>
          `}
        </div>
      </div>
    `;
  },

  openFixBugModal(bugId) {
    const bug = store.getBugById(bugId);
    if (!bug) return;

    let modalContainer = document.getElementById("devModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "devModalContainer";
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-600"></i> Mark Defect Fixed & Request Retest
            </h3>
            <button onclick="document.getElementById('devModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <div class="font-bold text-slate-800">${bug.key}: ${bug.title}</div>
            <div class="text-slate-500 mt-0.5">Severity: <span class="font-semibold text-red-600">${bug.severity}</span> | Env: ${bug.environment}</div>
          </div>

          <form onsubmit="DevWorkspaceView.handleFixBugSubmit(event, '${bug.id}')" class="mt-4 space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Target Build / Deployed Commit *</label>
              <input type="text" id="devFixBuild" required value="v1.4.2-rc4 (Commit #e7a4b9)" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Resolution & Fix Notes for QA Retest *</label>
              <textarea id="devFixNotes" rows="3" required placeholder="Describe root cause and how the defect was fixed..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500">Root cause identified and corrected in backend controller. Automated unit test added. Ready for QA retest on Staging.</textarea>
            </div>

            <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="button" onclick="document.getElementById('devModalContainer').innerHTML=''" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm">
                Submit Fix to QA
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  handleFixBugSubmit(e, bugId) {
    e.preventDefault();
    const build = document.getElementById("devFixBuild").value;
    const notes = document.getElementById("devFixNotes").value;

    store.updateBugStatus(bugId, "Fixed", `[${build}] ${notes}`);
    window.app.toast("Fix Submitted", `Defect marked Fixed. QA notified for retesting.`, "success");
    document.getElementById("devModalContainer").innerHTML = "";
    this.render(document.getElementById("mainContent"));
  }
};

window.DevWorkspaceView = DevWorkspaceView;
