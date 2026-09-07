/**
 * All-in-One Software Project & Quality Management Platform
 * V1.8 Bug Management & Defect Lifecycle View
 */

const BugsView = {
  filterStatus: "all",
  filterSeverity: "all",
  searchQuery: "",

  render(container) {
    const project = store.getActiveProject();
    const bugs = store.getBugs(project.id);
    const filteredBugs = this.filterBugs(bugs);

    container.innerHTML = `
      <div class="space-y-5 animate-fade-in">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">Defect & Bug Management</h1>
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">${project.key}</span>
            </div>
            <p class="text-xs text-slate-500 mt-1">Trace defects from failed test executions to developer fixes, regression retesting, and QA sign-off.</p>
          </div>

          <button onclick="BugsView.openCreateBugModal()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> Log New Defect
          </button>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3 flex-1">
            <!-- Search -->
            <div class="relative min-w-[200px] flex-1 max-w-xs">
              <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
              <input type="text" value="${this.searchQuery}" oninput="BugsView.handleSearch(this.value)" placeholder="Search bugs by key, title..." class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>

            <!-- Status Filter -->
            <select onchange="BugsView.setStatusFilter(this.value)" class="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-700 font-medium">
              <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="Open" ${this.filterStatus === 'Open' ? 'selected' : ''}>Open</option>
              <option value="In Progress" ${this.filterStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Fixed" ${this.filterStatus === 'Fixed' ? 'selected' : ''}>Fixed (Ready Retest)</option>
              <option value="QA Testing" ${this.filterStatus === 'QA Testing' ? 'selected' : ''}>QA Testing</option>
              <option value="Closed" ${this.filterStatus === 'Closed' ? 'selected' : ''}>Closed</option>
              <option value="Reopened" ${this.filterStatus === 'Reopened' ? 'selected' : ''}>Reopened</option>
            </select>

            <!-- Severity Filter -->
            <select onchange="BugsView.setSeverityFilter(this.value)" class="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-700 font-medium">
              <option value="all" ${this.filterSeverity === 'all' ? 'selected' : ''}>All Severities</option>
              <option value="Critical" ${this.filterSeverity === 'Critical' ? 'selected' : ''}>Critical (Blocker)</option>
              <option value="Major" ${this.filterSeverity === 'Major' ? 'selected' : ''}>Major</option>
              <option value="Moderate" ${this.filterSeverity === 'Moderate' ? 'selected' : ''}>Moderate</option>
              <option value="Minor" ${this.filterSeverity === 'Minor' ? 'selected' : ''}>Minor</option>
            </select>
          </div>

          <div class="text-xs text-slate-500 font-medium">
            <strong>${filteredBugs.length}</strong> of ${bugs.length} defects
          </div>
        </div>

        <!-- Defect Cards / Table -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th class="py-3 px-4">Bug ID</th>
                  <th class="py-3 px-4">Severity</th>
                  <th class="py-3 px-4">Summary</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Priority</th>
                  <th class="py-3 px-4">Dev Assignee</th>
                  <th class="py-3 px-4">QA Reporter</th>
                  <th class="py-3 px-4">Source</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filteredBugs.length === 0 ? `
                  <tr>
                    <td colspan="9" class="text-center py-8 text-slate-400 italic">No defects found matching criteria.</td>
                  </tr>
                ` : filteredBugs.map(b => {
                  const dev = store.getUserById(b.assigneeId);
                  const qa = store.getUserById(b.reporterId);
                  const linkedTc = b.testCaseId ? store.getTestCaseById(b.testCaseId) : null;

                  return `
                    <tr class="hover:bg-slate-50/80 transition cursor-pointer" onclick="BugsView.openBugDetails('${b.id}')">
                      <td class="py-3 px-4 font-mono font-bold text-red-600">${b.key}</td>
                      <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          b.severity === 'Major' ? 'bg-orange-100 text-orange-800' :
                          b.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }">${b.severity}</span>
                      </td>
                      <td class="py-3 px-4 font-semibold text-slate-900 max-w-sm truncate">${b.title}</td>
                      <td class="py-3 px-4">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'Open' ? 'bg-red-50 text-red-700 border border-red-200' :
                          b.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          b.status === 'Fixed' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          b.status === 'QA Testing' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                          b.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-800'
                        }">● ${b.status}</span>
                      </td>
                      <td class="py-3 px-4 font-mono font-bold text-slate-600">${b.priority}</td>
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-1.5">
                          <div class="w-4 h-4 rounded-full ${dev.color} text-white text-[8px] flex items-center justify-center">${dev.initials}</div>
                          <span>${dev.name}</span>
                        </div>
                      </td>
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-1.5">
                          <div class="w-4 h-4 rounded-full ${qa.color} text-white text-[8px] flex items-center justify-center">${qa.initials}</div>
                          <span>${qa.name}</span>
                        </div>
                      </td>
                      <td class="py-3 px-4">
                        ${linkedTc ? `<span class="font-mono text-emerald-700 font-bold">${linkedTc.key}</span>` : '<span class="text-slate-400">Manual</span>'}
                      </td>
                      <td class="py-3 px-4 text-right" onclick="event.stopPropagation()">
                        <button onclick="BugsView.openBugDetails('${b.id}')" class="px-2 py-1 text-red-600 hover:bg-red-50 rounded font-bold text-xs">
                          Manage
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Bug Modals Container -->
        <div id="bugModalContainer"></div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  filterBugs(bugs) {
    return bugs.filter(b => {
      if (this.filterStatus !== "all" && b.status !== this.filterStatus) return false;
      if (this.filterSeverity !== "all" && b.severity !== this.filterSeverity) return false;
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchKey = b.key.toLowerCase().includes(q);
        if (!matchTitle && !matchKey) return false;
      }
      return true;
    });
  },

  setStatusFilter(status) {
    this.filterStatus = status;
    this.render(document.getElementById("mainContent"));
  },

  setSeverityFilter(sev) {
    this.filterSeverity = sev;
    this.render(document.getElementById("mainContent"));
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.render(document.getElementById("mainContent"));
  },

  openBugDetails(bugId) {
    const bug = store.getBugById(bugId);
    if (!bug) return;

    const project = store.getActiveProject();
    const dev = store.getUserById(bug.assigneeId);
    const qa = store.getUserById(bug.reporterId);
    const linkedTc = bug.testCaseId ? store.getTestCaseById(bug.testCaseId) : null;
    const linkedStory = bug.ticketId ? store.getTicketById(bug.ticketId) : null;

    let modalContainer = document.getElementById("bugModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "bugModalContainer";
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-fade-in overflow-hidden">
          <!-- Header -->
          <div class="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div class="flex items-center gap-3">
              <span class="font-mono font-bold text-red-800 bg-red-100 px-2.5 py-0.5 rounded text-xs">${bug.key}</span>
              <span class="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">${bug.severity}</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">● ${bug.status}</span>
            </div>
            <button onclick="document.getElementById('bugModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            <div>
              <h2 class="text-xl font-semibold text-slate-900">${bug.title}</h2>
              <p class="text-slate-600 mt-2 text-xs leading-relaxed">${bug.description}</p>
            </div>

            <!-- Workflow Status Bar -->
            <div class="p-3 bg-red-50/60 rounded-xl border border-red-100 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-700">Defect Workflow:</span>
                <select onchange="BugsView.updateStatus('${bug.id}', this.value)" class="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-red-500">
                  <option value="Open" ${bug.status === 'Open' ? 'selected' : ''}>Open</option>
                  <option value="In Progress" ${bug.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Fixed" ${bug.status === 'Fixed' ? 'selected' : ''}>Fixed (Ready Retest)</option>
                  <option value="QA Testing" ${bug.status === 'QA Testing' ? 'selected' : ''}>QA Testing (Retesting)</option>
                  <option value="Closed" ${bug.status === 'Closed' ? 'selected' : ''}>Closed (Verified)</option>
                  <option value="Reopened" ${bug.status === 'Reopened' ? 'selected' : ''}>Reopened (Retest Failed)</option>
                </select>
              </div>

              <!-- Quick QA Retest Action Buttons -->
              <div class="flex items-center gap-2">
                ${bug.status === 'Fixed' ? `
                  <button onclick="BugsView.verifyRetest('${bug.id}', true)" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5 transition">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Pass Retest & Close
                  </button>
                  <button onclick="BugsView.verifyRetest('${bug.id}', false)" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5 transition">
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Retest Failed (Reopen)
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Meta Attributes -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Assigned Developer</span>
                <span class="mt-1 block font-bold text-slate-800">${dev.name}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Reported By (QA)</span>
                <span class="mt-1 block font-bold text-slate-800">${qa.name}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Environment</span>
                <span class="mt-1 block font-semibold text-slate-800">${bug.environment}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Build Version</span>
                <span class="mt-1 block font-semibold text-slate-800">${bug.releaseBuild}</span>
              </div>
            </div>

            <!-- Steps to Reproduce -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[10px] font-bold text-slate-500 uppercase">Steps to Reproduce</span>
              <pre class="text-xs text-slate-800 mt-1 font-sans whitespace-pre-line leading-relaxed">${bug.stepsToReproduce || 'N/A'}</pre>
            </div>

            <!-- Expected vs Actual Result -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <span class="text-[10px] font-bold text-emerald-800 uppercase">Expected Result</span>
                <p class="text-xs text-emerald-950 mt-1 font-medium">${bug.expectedResult || 'N/A'}</p>
              </div>
              <div class="p-3.5 bg-red-50/50 border border-red-200 rounded-xl">
                <span class="text-[10px] font-bold text-red-800 uppercase">Actual Result (Defect Behavior)</span>
                <p class="text-xs text-red-950 mt-1 font-medium">${bug.actualResult || 'N/A'}</p>
              </div>
            </div>

            <!-- Developer Fix / Resolution Notes -->
            ${bug.devFixNotes ? `
              <div class="p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                <span class="text-[10px] font-bold text-purple-900 uppercase">Developer Fix & Resolution Notes</span>
                <p class="text-xs text-purple-950 mt-1 font-medium">${bug.devFixNotes}</p>
              </div>
            ` : ''}

            <!-- QA Retest Notes -->
            ${bug.qaRetestNotes ? `
              <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span class="text-[10px] font-bold text-emerald-900 uppercase">QA Retest Verification Sign-off</span>
                <p class="text-xs text-emerald-950 mt-1 font-medium">${bug.qaRetestNotes}</p>
              </div>
            ` : ''}

            <!-- Comments -->
            <div>
              <h3 class="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <i data-lucide="message-circle" class="w-4 h-4 text-slate-700"></i> Discussion & Retest Notes (${bug.comments ? bug.comments.length : 0})
              </h3>
              <div class="space-y-2.5 max-h-40 overflow-y-auto mb-3">
                ${(bug.comments || []).map(c => {
                  const author = store.getUserById(c.authorId);
                  return `
                    <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2.5">
                      <div class="w-5 h-5 rounded-full ${author.color} text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">${author.initials}</div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-slate-800 text-[11px]">${author.name}</span>
                          <span class="text-[10px] text-slate-400">${c.timestamp}</span>
                        </div>
                        <p class="text-xs text-slate-700 mt-0.5">${c.text}</p>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>

              <div class="flex gap-2">
                <input type="text" id="bugCommentInput" placeholder="Add technical note or retest observation..." class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none" />
                <button onclick="BugsView.submitBugComment('${bug.id}')" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition">
                  Reply
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span class="text-[11px] text-slate-400">Logged on ${bug.createdAt}</span>
            <button onclick="document.getElementById('bugModalContainer').innerHTML=''" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  updateStatus(bugId, newStatus) {
    store.updateBugStatus(bugId, newStatus);
    window.app.toast("Defect Updated", `Status changed to ${newStatus}.`, "info");
    this.openBugDetails(bugId);
    this.render(document.getElementById("mainContent"));
  },

  verifyRetest(bugId, passed) {
    if (passed) {
      const note = prompt("QA Retest Sign-off Verification Notes:", "Verified fix on Staging Build. No side effects observed.");
      if (note !== null) {
        store.updateBugStatus(bugId, "Closed", note);
        window.app.toast("Defect Closed", "Bug verified and closed by QA!", "success");
        this.openBugDetails(bugId);
        this.render(document.getElementById("mainContent"));
      }
    } else {
      const note = prompt("QA Retest Failure Reason:", "Defect still reproduces under high concurrency.");
      if (note !== null) {
        store.updateBugStatus(bugId, "Reopened", note);
        window.app.toast("Defect Reopened", "Bug reopened and returned to developer.", "error");
        this.openBugDetails(bugId);
        this.render(document.getElementById("mainContent"));
      }
    }
  },

  submitBugComment(bugId) {
    const input = document.getElementById("bugCommentInput");
    if (!input || !input.value.trim()) return;
    store.addBugComment(bugId, input.value.trim());
    this.openBugDetails(bugId);
  },

  openCreateBugModal() {
    const project = store.getActiveProject();
    const tickets = store.getTickets(project.id);
    const testCases = store.getTestCases(project.id);
    const users = store.getUsers();

    let modalContainer = document.getElementById("bugModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "bugModalContainer";
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="bug" class="w-5 h-5 text-red-600"></i> Log Defect / Bug (${project.key})
            </h3>
            <button onclick="document.getElementById('bugModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="BugsView.handleCreateBugSubmit(event)" class="mt-4 space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Severity *</label>
                <select id="bugSeverity" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-500">
                  <option value="Critical">Critical (Blocker)</option>
                  <option value="Major" selected>Major</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Minor">Minor</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Priority *</label>
                <select id="bugPriority" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-500">
                  <option value="P1">P1 (Urgent Fix)</option>
                  <option value="P2" selected>P2 (High)</option>
                  <option value="P3">P3 (Medium)</option>
                  <option value="P4">P4 (Low)</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Environment *</label>
                <input type="text" id="bugEnv" value="Staging Environment" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Defect Title / Summary *</label>
              <input type="text" id="bugTitle" required placeholder="e.g. Session token not invalidated on password change" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Linked Story / Ticket</label>
                <select id="bugTicketId" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-500">
                  <option value="">-- None --</option>
                  ${tickets.map(t => `<option value="${t.id}">${t.key}: ${t.title}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Assign to Developer *</label>
                <select id="bugAssignee" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-500">
                  ${users.map(u => `<option value="${u.id}" ${u.role === 'Developer' ? 'selected' : ''}>${u.name} (${u.role})</option>`).join("")}
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Steps to Reproduce *</label>
              <textarea id="bugSteps" rows="3" required placeholder="1. Log in with test account&#10;2. Trigger payment with amount $0.00&#10;3. Observe crash" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Expected Result *</label>
                <input type="text" id="bugExpected" required placeholder="e.g. Validation error 'Amount must be > 0'" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Actual Result *</label>
                <input type="text" id="bugActual" required placeholder="e.g. Server threw 500 Unhandled Null Pointer" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500" />
              </div>
            </div>

            <div class="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="button" onclick="document.getElementById('bugModalContainer').innerHTML=''" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" class="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm">
                Log Defect
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  handleCreateBugSubmit(e) {
    e.preventDefault();
    const severity = document.getElementById("bugSeverity").value;
    const priority = document.getElementById("bugPriority").value;
    const environment = document.getElementById("bugEnv").value.trim();
    const title = document.getElementById("bugTitle").value.trim();
    const ticketId = document.getElementById("bugTicketId").value || null;
    const assigneeId = document.getElementById("bugAssignee").value;
    const stepsToReproduce = document.getElementById("bugSteps").value.trim();
    const expectedResult = document.getElementById("bugExpected").value.trim();
    const actualResult = document.getElementById("bugActual").value.trim();

    const newBug = store.createBug({
      severity, priority, environment, title, ticketId, assigneeId, stepsToReproduce, expectedResult, actualResult
    });

    window.app.toast("Defect Logged", `Created ${newBug.key}: ${newBug.title}`, "success");
    document.getElementById("bugModalContainer").innerHTML = "";
    this.render(document.getElementById("mainContent"));
  }
};

window.BugsView = BugsView;
