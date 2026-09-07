/**
 * All-in-One Software Project & Quality Management Platform
 * V1.6 Test Case Management View
 */

const TestCasesView = {
  selectedSuiteId: "all",
  selectedCategory: "all",
  searchQuery: "",

  render(container) {
    const project = store.getActiveProject();
    const suites = store.getTestSuites(project.id);
    const testCases = store.getTestCases(project.id);
    const filteredCases = this.filterCases(testCases);

    container.innerHTML = `
      <div class="space-y-5 animate-fade-in">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">Test Case Repository</h1>
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">${project.key}</span>
            </div>
            <p class="text-xs text-slate-500 mt-1">Organize test suites, step-by-step test procedures, templates, and verification matrices.</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="TestCasesView.openCreateSuiteModal()" class="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5">
              <i data-lucide="folder-plus" class="w-4 h-4 text-emerald-600"></i> + New Suite
            </button>
            <button onclick="TestCasesView.openCreateModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5">
              <i data-lucide="plus" class="w-4 h-4"></i> Create Test Case
            </button>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3 flex-1">
            <!-- Search -->
            <div class="relative min-w-[200px] flex-1 max-w-xs">
              <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
              <input type="text" value="${this.searchQuery}" oninput="TestCasesView.handleSearch(this.value)" placeholder="Search test cases..." class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <!-- Suite Filter -->
            <select onchange="TestCasesView.setSuiteFilter(this.value)" class="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium">
              <option value="all" ${this.selectedSuiteId === 'all' ? 'selected' : ''}>All Suites (${suites.length})</option>
              ${suites.map(s => `<option value="${s.id}" ${this.selectedSuiteId === s.id ? 'selected' : ''}>${s.name} (${s.module})</option>`).join("")}
            </select>

            <!-- Category / Type Filter (10 V1 categories) -->
            <select onchange="TestCasesView.setCategoryFilter(this.value)" class="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium">
              <option value="all" ${this.selectedCategory === 'all' ? 'selected' : ''}>All Categories</option>
              <option value="Positive" ${this.selectedCategory === 'Positive' ? 'selected' : ''}>Positive</option>
              <option value="Negative" ${this.selectedCategory === 'Negative' ? 'selected' : ''}>Negative</option>
              <option value="Functional" ${this.selectedCategory === 'Functional' ? 'selected' : ''}>Functional</option>
              <option value="Regression" ${this.selectedCategory === 'Regression' ? 'selected' : ''}>Regression</option>
              <option value="Smoke" ${this.selectedCategory === 'Smoke' ? 'selected' : ''}>Smoke</option>
              <option value="Sanity" ${this.selectedCategory === 'Sanity' ? 'selected' : ''}>Sanity</option>
              <option value="Integration" ${this.selectedCategory === 'Integration' ? 'selected' : ''}>Integration</option>
              <option value="API" ${this.selectedCategory === 'API' ? 'selected' : ''}>API</option>
              <option value="UI" ${this.selectedCategory === 'UI' ? 'selected' : ''}>UI</option>
              <option value="UAT" ${this.selectedCategory === 'UAT' ? 'selected' : ''}>UAT</option>
            </select>
          </div>

          <div class="text-xs text-slate-500 font-medium">
            <strong>${filteredCases.length}</strong> of ${testCases.length} test cases
          </div>
        </div>

        <!-- Test Suites & Cases Container -->
        <div class="space-y-4">
          ${suites.map(suite => {
            const suiteCases = filteredCases.filter(tc => tc.suiteId === suite.id);
            if (this.selectedSuiteId !== "all" && this.selectedSuiteId !== suite.id) return "";
            if (suiteCases.length === 0 && this.searchQuery) return "";

            return `
              <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <!-- Suite Title Bar -->
                <div class="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <i data-lucide="folder" class="w-4 h-4 text-emerald-600"></i>
                    <h3 class="text-sm font-bold text-slate-900">${suite.name}</h3>
                    <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">${suite.module}</span>
                  </div>
                  <span class="text-xs font-semibold text-slate-500">${suiteCases.length} cases</span>
                </div>

                <!-- Test Cases Table -->
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs text-slate-700 min-w-[650px]">
                    <thead class="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                      <tr>
                        <th class="py-2.5 px-4">ID</th>
                        <th class="py-2.5 px-4">Test Title</th>
                        <th class="py-2.5 px-4">Category</th>
                        <th class="py-2.5 px-4">Priority</th>
                        <th class="py-2.5 px-4">Steps</th>
                        <th class="py-2.5 px-4">Linked Story</th>
                        <th class="py-2.5 px-4">Status</th>
                        <th class="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${suiteCases.length === 0 ? `
                        <tr>
                          <td colspan="8" class="text-center py-4 text-slate-400 italic">No test cases in this suite.</td>
                        </tr>
                      ` : suiteCases.map(tc => {
                        const linkedTicket = tc.storyId ? store.getTicketById(tc.storyId) : null;
                        return `
                          <tr class="hover:bg-slate-50/80 transition cursor-pointer" onclick="TestCasesView.openDetails('${tc.id}')">
                            <td class="py-3 px-4 font-mono font-bold text-emerald-700">${tc.key}</td>
                            <td class="py-3 px-4 font-semibold text-slate-900 max-w-sm truncate">${tc.title}</td>
                            <td class="py-3 px-4">
                              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">${tc.type}</span>
                            </td>
                            <td class="py-3 px-4 font-semibold ${
                              tc.priority === 'Critical' ? 'text-red-600 font-bold' :
                              tc.priority === 'High' ? 'text-orange-600' : 'text-slate-600'
                            }">${tc.priority}</td>
                            <td class="py-3 px-4 text-slate-500">${tc.steps ? tc.steps.length : 0} steps</td>
                            <td class="py-3 px-4">
                              ${linkedTicket ? `
                                <span class="font-mono text-slate-900 hover:text-[#4d7c0f] hover:underline cursor-pointer" title="${linkedTicket.title}">${linkedTicket.key}</span>
                              ` : '<span class="text-slate-400">—</span>'}
                            </td>
                            <td class="py-3 px-4">
                              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${tc.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                                ${tc.status}
                              </span>
                            </td>
                            <td class="py-3 px-4 text-right" onclick="event.stopPropagation()">
                              <div class="flex items-center justify-end gap-1">
                                <button onclick="TestCasesView.duplicateCase('${tc.id}')" title="Duplicate Case" class="p-1 text-slate-400 hover:text-slate-700 rounded">
                                  <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                                </button>
                                <button onclick="TestCasesView.openDetails('${tc.id}')" class="px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded font-bold text-xs">
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        `;
                      }).join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <!-- Modals Container -->
        <div id="testCaseModalContainer"></div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  filterCases(cases) {
    return cases.filter(tc => {
      if (this.selectedSuiteId !== "all" && tc.suiteId !== this.selectedSuiteId) return false;
      if (this.selectedCategory !== "all" && tc.type !== this.selectedCategory) return false;
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const matchTitle = tc.title.toLowerCase().includes(q);
        const matchKey = tc.key.toLowerCase().includes(q);
        if (!matchTitle && !matchKey) return false;
      }
      return true;
    });
  },

  setSuiteFilter(suiteId) {
    this.selectedSuiteId = suiteId;
    this.render(document.getElementById("mainContent"));
  },

  setCategoryFilter(category) {
    this.selectedCategory = category;
    this.render(document.getElementById("mainContent"));
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.render(document.getElementById("mainContent"));
  },

  duplicateCase(caseId) {
    const dup = store.duplicateTestCase(caseId);
    if (dup) {
      window.app.toast("Test Case Duplicated", `Created ${dup.key} as draft copy.`, "success");
      this.render(document.getElementById("mainContent"));
    }
  },

  openDetails(caseId) {
    const tc = store.getTestCaseById(caseId);
    if (!tc) return;

    const project = store.getActiveProject();
    const suite = store.getTestSuites(project.id).find(s => s.id === tc.suiteId);
    const story = tc.storyId ? store.getTicketById(tc.storyId) : null;
    const creator = store.getUserById(tc.creatorId);

    let modalContainer = document.getElementById("testCaseModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "testCaseModalContainer";
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-fade-in overflow-hidden">
          <!-- Modal Header -->
          <div class="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div class="flex items-center gap-3">
              <span class="font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded text-xs">${tc.key}</span>
              <span class="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">${tc.type}</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${tc.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                ● ${tc.status}
              </span>
            </div>
            <button onclick="document.getElementById('testCaseModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            <div>
              <h2 class="text-xl font-semibold text-slate-900">${tc.title}</h2>
              <div class="flex flex-wrap items-center gap-4 text-slate-500 mt-2">
                <span>Suite: <strong class="text-slate-700">${suite ? suite.name : 'General'}</strong></span>
                <span>Environment: <strong class="text-slate-700">${tc.environment}</strong></span>
                <span>Priority: <strong class="${tc.priority === 'Critical' ? 'text-red-600' : 'text-slate-700'}">${tc.priority}</strong></span>
                <span>Author: <strong class="text-slate-700">${creator.name}</strong></span>
              </div>
            </div>

            <!-- Linked Story -->
            ${story ? `
              <div class="p-3 bg-slate-900/5 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-700">Linked Work Ticket</span>
                  <div class="font-bold text-slate-800 text-xs mt-0.5">${story.key}: ${story.title}</div>
                </div>
                <button onclick="document.getElementById('testCaseModalContainer').innerHTML=''; TicketsView.openTicketDetails('${story.id}')" class="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold rounded-lg text-xs cursor-pointer">
                  View Story →
                </button>
              </div>
            ` : ''}

            <!-- Preconditions & Test Data -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] font-bold text-slate-400 uppercase">Preconditions</span>
                <p class="text-xs text-slate-700 mt-1">${tc.preconditions || 'None specified.'}</p>
              </div>
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] font-bold text-slate-400 uppercase">Test Data</span>
                <p class="text-xs font-mono text-slate-700 mt-1 whitespace-pre-line">${tc.testData || 'Standard staging test data.'}</p>
              </div>
            </div>

            <!-- Step-by-Step Procedure -->
            <div>
              <h3 class="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <i data-lucide="list-ordered" class="w-4 h-4 text-emerald-600"></i> Step-by-Step Test Procedure
              </h3>
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th class="py-2.5 px-3 w-12 text-center">Step</th>
                      <th class="py-2.5 px-4 w-1/2">Action / Test Input</th>
                      <th class="py-2.5 px-4 w-1/2">Expected Output / Result</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${(tc.steps || []).map(s => `
                      <tr class="hover:bg-slate-50/50">
                        <td class="py-3 px-3 text-center font-bold text-slate-400">${s.stepNumber}</td>
                        <td class="py-3 px-4 font-medium text-slate-800">${s.action}</td>
                        <td class="py-3 px-4 text-emerald-800 bg-emerald-50/30">${s.expectedResult}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Overall Expected Result -->
            <div class="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <span class="text-[10px] font-bold text-emerald-800 uppercase">Final Acceptance Criteria / Expected Outcome</span>
              <p class="text-xs text-emerald-950 font-medium mt-1">${tc.expectedResult || 'All steps pass with no errors.'}</p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button onclick="TestCasesView.duplicateCase('${tc.id}'); document.getElementById('testCaseModalContainer').innerHTML='';" class="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i> Duplicate Case
            </button>
            <button onclick="document.getElementById('testCaseModalContainer').innerHTML=''" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  openCreateModal(prefillStoryId = null) {
    const project = store.getActiveProject();
    const suites = store.getTestSuites(project.id);
    const tickets = store.getTickets(project.id);
    const templates = INITIAL_DATA.testCaseTemplates;

    let modalContainer = document.getElementById("testCaseModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "testCaseModalContainer";
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-fade-in overflow-hidden">
          <div class="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="clipboard-plus" class="w-5 h-5 text-emerald-600"></i> Create Test Case
            </h3>
            <button onclick="document.getElementById('testCaseModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form id="createTestCaseForm" onsubmit="TestCasesView.handleCreateSubmit(event)" class="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            <!-- Reusable Template Selector -->
            <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-amber-900 font-semibold">
                <i data-lucide="sparkles" class="w-4 h-4 text-amber-600"></i> Apply Reusable Template:
              </div>
              <select onchange="TestCasesView.applyTemplate(this.value)" class="bg-white border border-amber-300 rounded-lg px-3 py-1 text-xs font-medium focus:ring-2 focus:ring-amber-500">
                <option value="">-- Choose Template --</option>
                ${templates.map((tpl, i) => `<option value="${i}">${tpl.name} (${tpl.category})</option>`).join("")}
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Test Suite *</label>
                <select id="tcSuiteId" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500">
                  ${suites.map(s => `<option value="${s.id}">${s.name}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Category / Type *</label>
                <select id="tcType" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500">
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                  <option value="Functional" selected>Functional</option>
                  <option value="Regression">Regression</option>
                  <option value="Smoke">Smoke</option>
                  <option value="Sanity">Sanity</option>
                  <option value="Integration">Integration</option>
                  <option value="API">API</option>
                  <option value="UI">UI</option>
                  <option value="UAT">UAT</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Priority</label>
                <select id="tcPriority" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500">
                  <option value="Critical">Critical</option>
                  <option value="High" selected>High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Test Case Title *</label>
              <input type="text" id="tcTitle" required placeholder="e.g. Verify password reset token expiry after 15 minutes" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Linked Story / Ticket</label>
                <select id="tcStoryId" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500">
                  <option value="">-- No Linked Ticket --</option>
                  ${tickets.map(t => `<option value="${t.id}" ${prefillStoryId === t.id ? 'selected' : ''}>${t.key}: ${t.title}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Environment</label>
                <input type="text" id="tcEnv" value="Staging" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Preconditions</label>
                <textarea id="tcPreconditions" rows="2" placeholder="e.g. User is logged out. Database populated with test accounts." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"></textarea>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Test Data / Payloads</label>
                <textarea id="tcTestData" rows="2" placeholder="e.g. User email: reset_test@omnipay.io" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"></textarea>
              </div>
            </div>

            <!-- Dynamic Steps Builder -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="font-bold text-slate-700 uppercase">Test Steps & Expected Results</label>
                <button type="button" onclick="TestCasesView.addStepRow()" class="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Step
                </button>
              </div>

              <div id="stepsBuilderList" class="space-y-2.5">
                <div class="step-row grid grid-cols-12 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div class="col-span-1 text-center font-bold text-slate-400 flex items-center justify-center">1</div>
                  <div class="col-span-6">
                    <input type="text" placeholder="Action: e.g. Navigate to /login and click Forgot Password" class="step-action w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs" />
                  </div>
                  <div class="col-span-5">
                    <input type="text" placeholder="Expected: Password reset email sent" class="step-expected w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Overall Expected Result *</label>
              <input type="text" id="tcExpectedResult" required placeholder="e.g. Password reset link expires gracefully with 410 Gone after 15m." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div class="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="button" onclick="document.getElementById('testCaseModalContainer').innerHTML=''" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm">
                Save Test Case
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  addStepRow() {
    const list = document.getElementById("stepsBuilderList");
    const count = list.querySelectorAll(".step-row").length + 1;
    const row = document.createElement("div");
    row.className = "step-row grid grid-cols-12 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200";
    row.innerHTML = `
      <div class="col-span-1 text-center font-bold text-slate-400 flex items-center justify-center">${count}</div>
      <div class="col-span-6">
        <input type="text" placeholder="Action step ${count}" class="step-action w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs" />
      </div>
      <div class="col-span-5">
        <input type="text" placeholder="Expected output ${count}" class="step-expected w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs" />
      </div>
    `;
    list.appendChild(row);
  },

  applyTemplate(templateIndex) {
    if (templateIndex === "") return;
    const tpl = INITIAL_DATA.testCaseTemplates[parseInt(templateIndex, 10)];
    if (!tpl) return;

    document.getElementById("tcType").value = tpl.category;
    document.getElementById("tcPriority").value = tpl.priority;
    document.getElementById("tcTitle").value = `${tpl.name} - Verification`;
    document.getElementById("tcPreconditions").value = tpl.preconditions;
    document.getElementById("tcTestData").value = tpl.testData;
    document.getElementById("tcExpectedResult").value = tpl.expectedResult;

    // populate steps
    const list = document.getElementById("stepsBuilderList");
    list.innerHTML = "";
    tpl.steps.forEach(s => {
      const row = document.createElement("div");
      row.className = "step-row grid grid-cols-12 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200";
      row.innerHTML = `
        <div class="col-span-1 text-center font-bold text-slate-400 flex items-center justify-center">${s.stepNumber}</div>
        <div class="col-span-6">
          <input type="text" value="${s.action}" class="step-action w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs" />
        </div>
        <div class="col-span-5">
          <input type="text" value="${s.expectedResult}" class="step-expected w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs" />
        </div>
      `;
      list.appendChild(row);
    });
  },

  handleCreateSubmit(e) {
    e.preventDefault();
    const suiteId = document.getElementById("tcSuiteId").value;
    const type = document.getElementById("tcType").value;
    const priority = document.getElementById("tcPriority").value;
    const title = document.getElementById("tcTitle").value.trim();
    const storyId = document.getElementById("tcStoryId").value || null;
    const environment = document.getElementById("tcEnv").value.trim();
    const preconditions = document.getElementById("tcPreconditions").value.trim();
    const testData = document.getElementById("tcTestData").value.trim();
    const expectedResult = document.getElementById("tcExpectedResult").value.trim();

    const stepRows = document.querySelectorAll("#stepsBuilderList .step-row");
    const steps = [];
    stepRows.forEach((row, idx) => {
      const action = row.querySelector(".step-action").value.trim();
      const exp = row.querySelector(".step-expected").value.trim();
      if (action) {
        steps.push({ stepNumber: idx + 1, action, expectedResult: exp });
      }
    });

    const newCase = store.createTestCase({
      suiteId, type, priority, title, storyId, environment, preconditions, testData, expectedResult, steps
    });

    window.app.toast("Test Case Created", `Created ${newCase.key}: ${newCase.title}`, "success");
    document.getElementById("testCaseModalContainer").innerHTML = "";
    this.render(document.getElementById("mainContent"));
  },

  openCreateSuiteModal() {
    let modalContainer = document.getElementById("testCaseModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "testCaseModalContainer";
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="folder-plus" class="w-5 h-5 text-emerald-600"></i> New Test Suite
            </h3>
            <button onclick="document.getElementById('testCaseModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="TestCasesView.handleCreateSuiteSubmit(event)" class="mt-4 space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Suite Name *</label>
              <input type="text" id="newSuiteName" required placeholder="e.g. User Profile & Settings Suite" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Module / Feature Area *</label>
              <input type="text" id="newSuiteModule" required placeholder="e.g. Account Management" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Description</label>
              <textarea id="newSuiteDesc" rows="2" placeholder="Suite testing scope..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"></textarea>
            </div>

            <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="button" onclick="document.getElementById('testCaseModalContainer').innerHTML=''" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm">
                Create Suite
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  handleCreateSuiteSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("newSuiteName").value.trim();
    const module = document.getElementById("newSuiteModule").value.trim();
    const description = document.getElementById("newSuiteDesc").value.trim();

    store.createTestSuite({ name, module, description });
    window.app.toast("Suite Created", `Test Suite "${name}" created.`, "success");
    document.getElementById("testCaseModalContainer").innerHTML = "";
    this.render(document.getElementById("mainContent"));
  }
};

window.TestCasesView = TestCasesView;
