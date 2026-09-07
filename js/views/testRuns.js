/**
 * All-in-One Software Project & Quality Management Platform
 * V1.7 Test Execution & Test Runs View
 */

const TestRunsView = {
  activeRunModalId: null,

  render(container) {
    const project = store.getActiveProject();
    const testRuns = store.getTestRuns(project.id);

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">Test Execution & Runs</h1>
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">${project.key}</span>
            </div>
            <p class="text-xs text-slate-500 mt-1">Execute test cycles for Sprints, Features, or Releases with live pass/fail scoring and defect logging.</p>
          </div>

          <button onclick="TestRunsView.openCreateRunModal()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5">
            <i data-lucide="play-circle" class="w-4 h-4"></i> Launch New Test Run
          </button>
        </div>

        <!-- Test Runs List -->
        <div class="space-y-4">
          ${testRuns.length === 0 ? `
            <div class="bg-white rounded-xl p-10 border border-slate-200 text-center">
              <i data-lucide="play-circle" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
              <h3 class="text-sm font-bold text-slate-800">No Test Runs Executed Yet</h3>
              <p class="text-xs text-slate-500 mt-1">Click "Launch New Test Run" to execute test cases against the current build.</p>
            </div>
          ` : testRuns.map(tr => this.renderTestRunCard(tr)).join("")}
        </div>

        <!-- Execution Runner Full Modal Container -->
        <div id="testRunModalContainer"></div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderTestRunCard(tr) {
    const total = tr.executedCases.length;
    const passed = tr.executedCases.filter(ec => ec.status === "Pass").length;
    const failed = tr.executedCases.filter(ec => ec.status === "Fail").length;
    const blocked = tr.executedCases.filter(ec => ec.status === "Blocked").length;
    const notRun = tr.executedCases.filter(ec => ec.status === "Not Run").length;
    const passRate = (passed + failed > 0) ? Math.round((passed / (passed + failed)) * 100) : 100;
    const completionRate = total > 0 ? Math.round(((total - notRun) / total) * 100) : 0;

    return `
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm card-hover">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <!-- Left details -->
          <div class="space-y-2 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs">${tr.key}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">${tr.type} Run</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                tr.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }">● ${tr.status}</span>
              <span class="text-xs text-slate-500 font-medium">${tr.sprintOrRelease}</span>
            </div>

            <h3 class="text-base font-bold text-slate-900">${tr.name}</h3>

            <!-- Progress Bar -->
            <div class="space-y-1.5 max-w-lg pt-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-600 font-medium">Execution Progress: <strong>${completionRate}%</strong> (${total - notRun}/${total})</span>
                <span class="font-bold ${passRate < 80 ? 'text-red-600' : 'text-emerald-600'}">Pass Rate: ${passRate}%</span>
              </div>
              <div class="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
                <div style="width: ${(passed/total)*100}%" class="bg-emerald-500" title="Passed: ${passed}"></div>
                <div style="width: ${(failed/total)*100}%" class="bg-red-500" title="Failed: ${failed}"></div>
                <div style="width: ${(blocked/total)*100}%" class="bg-amber-500" title="Blocked: ${blocked}"></div>
                <div style="width: ${(notRun/total)*100}%" class="bg-slate-200" title="Not Run: ${notRun}"></div>
              </div>
            </div>

            <!-- Mini badges count -->
            <div class="flex items-center gap-3 text-xs pt-1">
              <span class="flex items-center gap-1 text-emerald-700 font-semibold"><i data-lucide="check" class="w-3.5 h-3.5"></i> ${passed} Pass</span>
              <span class="flex items-center gap-1 text-red-600 font-bold"><i data-lucide="x" class="w-3.5 h-3.5"></i> ${failed} Fail</span>
              <span class="flex items-center gap-1 text-amber-600 font-semibold"><i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> ${blocked} Blocked</span>
              <span class="flex items-center gap-1 text-slate-400"><i data-lucide="circle" class="w-3.5 h-3.5"></i> ${notRun} Remaining</span>
            </div>
          </div>

          <!-- Right Action Button -->
          <div class="flex items-center gap-3 shrink-0">
            <button onclick="TestRunsView.openExecutionRunner('${tr.id}')" class="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-2">
              <i data-lucide="play" class="w-4 h-4"></i> Open Test Runner
            </button>
          </div>
        </div>
      </div>
    `;
  },

  openCreateRunModal() {
    const project = store.getActiveProject();
    const testCases = store.getTestCases(project.id);
    const suites = store.getTestSuites(project.id);

    let modalContainer = document.getElementById("testRunModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "testRunModalContainer";
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="play-circle" class="w-5 h-5 text-purple-600"></i> Launch New Test Run
            </h3>
            <button onclick="document.getElementById('testRunModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="TestRunsView.handleCreateRunSubmit(event)" class="mt-4 space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Test Run Title *</label>
              <input type="text" id="runName" required value="${project.sprint} QA Verification Cycle" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Run Type</label>
                <select id="runType" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500">
                  <option value="Sprint" selected>Sprint Cycle</option>
                  <option value="Feature">Feature Verification</option>
                  <option value="Release">Release Candidate</option>
                  <option value="Ticket">Ticket Sanity</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Sprint / Target Build</label>
                <input type="text" id="runSprintOrRelease" value="${project.sprint} (Build v1.4.2)" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            <!-- Test Cases to Include Selection -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="font-bold text-slate-700 uppercase">Select Test Cases (${testCases.length} available)</label>
                <button type="button" onclick="TestRunsView.selectAllRunCheckboxes(true)" class="text-[11px] text-purple-600 font-bold hover:underline">Select All</button>
              </div>
              <div class="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 bg-slate-50">
                ${testCases.map(tc => `
                  <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" name="runCases" value="${tc.id}" checked class="rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                    <span class="font-mono font-bold text-purple-700">${tc.key}</span>
                    <span class="truncate flex-1 font-medium">${tc.title}</span>
                    <span class="text-[10px] uppercase font-bold text-slate-400">${tc.type}</span>
                  </label>
                `).join("")}
              </div>
            </div>

            <div class="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="button" onclick="document.getElementById('testRunModalContainer').innerHTML=''" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm">
                Launch Runner
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  selectAllRunCheckboxes(check) {
    document.querySelectorAll("input[name='runCases']").forEach(cb => { cb.checked = check; });
  },

  handleCreateRunSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("runName").value.trim();
    const type = document.getElementById("runType").value;
    const sprintOrRelease = document.getElementById("runSprintOrRelease").value.trim();

    const selectedCases = Array.from(document.querySelectorAll("input[name='runCases']:checked")).map(cb => cb.value);

    if (selectedCases.length === 0) {
      alert("Please select at least 1 test case to include in the run.");
      return;
    }

    const newRun = store.createTestRun({
      name, type, sprintOrRelease, testCaseIds: selectedCases
    });

    window.app.toast("Test Run Created", `Created ${newRun.key}. Opening Runner...`, "success");
    document.getElementById("testRunModalContainer").innerHTML = "";
    this.openExecutionRunner(newRun.id);
  },

  // Interactive Live Test Execution Runner
  openExecutionRunner(runId) {
    const run = store.getTestRunById(runId);
    if (!run) return;

    this.activeRunModalId = runId;
    const total = run.executedCases.length;
    const passed = run.executedCases.filter(ec => ec.status === "Pass").length;
    const failed = run.executedCases.filter(ec => ec.status === "Fail").length;
    const blocked = run.executedCases.filter(ec => ec.status === "Blocked").length;
    const notRun = run.executedCases.filter(ec => ec.status === "Not Run").length;

    let modalContainer = document.getElementById("testRunModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "testRunModalContainer";
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
        <div class="bg-white rounded-2xl max-w-5xl w-full h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-fade-in overflow-hidden">
          <!-- Top Bar -->
          <div class="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <span class="font-mono font-bold px-2 py-0.5 bg-purple-500/30 text-purple-200 rounded text-xs border border-purple-400/30">${run.key}</span>
              <div>
                <h2 class="text-sm font-semibold text-white">${run.name}</h2>
                <span class="text-[11px] text-slate-400">${run.sprintOrRelease}</span>
              </div>
            </div>

            <!-- Real-time Counters -->
            <div class="flex items-center gap-3 text-xs">
              <span class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                ${passed} Pass
              </span>
              <span class="px-2.5 py-1 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                ${failed} Fail
              </span>
              <span class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                ${blocked} Blocked
              </span>
              <button onclick="document.getElementById('testRunModalContainer').innerHTML=''; TestRunsView.render(document.getElementById('mainContent'))" class="p-1 text-slate-400 hover:text-white ml-2">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Runner Body (Two-Column Layout: Left Case List, Right Execution Active Panel) -->
          <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
            <!-- Left: Cases List Sidebar -->
            <div class="w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 max-h-44 md:max-h-none overflow-y-auto">
              <div class="p-3 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                Test Cases (${total})
              </div>
              <div class="divide-y divide-slate-200/70 flex-1 overflow-y-auto" id="runnerCaseSidebar">
                ${run.executedCases.map((ec, idx) => {
                  const tc = store.getTestCaseById(ec.testCaseId);
                  return `
                    <div onclick="TestRunsView.selectRunnerCase('${run.id}', '${ec.testCaseId}')" class="p-3 hover:bg-white cursor-pointer transition flex items-center justify-between gap-2 ${idx === 0 ? 'bg-white shadow-sm border-l-4 border-purple-600' : ''}" data-case-row="${ec.testCaseId}">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5">
                          <span class="font-mono font-bold text-slate-600 text-[11px]">${tc ? tc.key : 'TC'}</span>
                          <span class="text-[10px] font-bold uppercase text-slate-400">${tc ? tc.type : ''}</span>
                        </div>
                        <div class="text-xs font-semibold text-slate-900 truncate mt-0.5">${tc ? tc.title : 'Test Case'}</div>
                      </div>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                        ec.status === 'Pass' ? 'badge-pass' :
                        ec.status === 'Fail' ? 'badge-fail' :
                        ec.status === 'Blocked' ? 'badge-blocked' : 'badge-not-run'
                      }">${ec.status}</span>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <!-- Right: Active Test Execution Panel -->
            <div class="flex-1 bg-white p-6 overflow-y-auto" id="runnerActiveCasePanel">
              ${run.executedCases.length > 0 ? this.renderActiveCaseExecutionPanel(run.id, run.executedCases[0].testCaseId) : '<p class="text-slate-400 p-8">No test cases in run.</p>'}
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  selectRunnerCase(runId, caseId) {
    document.querySelectorAll("#runnerCaseSidebar [data-case-row]").forEach(el => {
      el.classList.remove("bg-white", "shadow-sm", "border-l-4", "border-purple-600");
      if (el.dataset.caseRow === caseId) {
        el.classList.add("bg-white", "shadow-sm", "border-l-4", "border-purple-600");
      }
    });

    const panel = document.getElementById("runnerActiveCasePanel");
    panel.innerHTML = this.renderActiveCaseExecutionPanel(runId, caseId);
    if (window.lucide) window.lucide.createIcons();
  },

  renderActiveCaseExecutionPanel(runId, caseId) {
    const run = store.getTestRunById(runId);
    const tc = store.getTestCaseById(caseId);
    if (!run || !tc) return "";

    const execItem = run.executedCases.find(ec => ec.testCaseId === caseId) || { status: "Not Run" };

    return `
      <div class="space-y-6 text-xs animate-fade-in">
        <!-- Title & Status Header -->
        <div class="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-xs">${tc.key}</span>
              <span class="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">${tc.type}</span>
              <span class="font-semibold text-slate-500">Priority: <strong>${tc.priority}</strong></span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mt-1">${tc.title}</h3>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400">Current Status:</span>
            <span class="px-3 py-1 rounded-full font-bold text-xs ${
              execItem.status === 'Pass' ? 'badge-pass' :
              execItem.status === 'Fail' ? 'badge-fail' :
              execItem.status === 'Blocked' ? 'badge-blocked' : 'badge-not-run'
            }">${execItem.status}</span>
          </div>
        </div>

        <!-- Preconditions & Test Data -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Preconditions</span>
            <p class="text-xs text-slate-700 mt-0.5">${tc.preconditions || 'None'}</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Test Data</span>
            <p class="text-xs text-slate-700 mt-0.5 font-mono">${tc.testData || 'Default'}</p>
          </div>
        </div>

        <!-- Step-by-Step Execution Verification Checklist -->
        <div>
          <h4 class="font-bold text-slate-800 uppercase text-[11px] mb-2 flex items-center gap-1.5">
            <i data-lucide="list-checks" class="w-4 h-4 text-purple-600"></i> Execution Steps
          </h4>
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="py-2 px-3 w-10 text-center">#</th>
                  <th class="py-2 px-4">Action</th>
                  <th class="py-2 px-4">Expected Result</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${(tc.steps || []).map(s => `
                  <tr class="hover:bg-slate-50/50">
                    <td class="py-2.5 px-3 text-center font-bold text-slate-400">${s.stepNumber}</td>
                    <td class="py-2.5 px-4 text-slate-800">${s.action}</td>
                    <td class="py-2.5 px-4 text-emerald-800 bg-emerald-50/20">${s.expectedResult}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Record Actual Result & Evidence -->
        <div class="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <label class="block font-bold text-slate-800 uppercase text-[11px]">Actual Result & Observation Notes</label>
          <textarea id="runnerActualResult" rows="2" placeholder="Record actual behavior, error response, or verification observations..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500">${execItem.actualResult || ''}</textarea>

          <div class="flex items-center gap-3">
            <div class="flex-1">
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Evidence / Attachment Mock</label>
              <input type="text" id="runnerEvidence" value="${execItem.evidence || ''}" placeholder="e.g. error_screenshot_step2.png or logfile.log" class="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs" />
            </div>
          </div>
        </div>

        <!-- Status Action Buttons (PASS / FAIL / BLOCKED) -->
        <div class="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button onclick="TestRunsView.submitStatus('${runId}', '${caseId}', 'Pass')" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5">
              <i data-lucide="check" class="w-4 h-4"></i> Mark PASSED
            </button>
            <button onclick="TestRunsView.submitStatus('${runId}', '${caseId}', 'Fail')" class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5">
              <i data-lucide="x" class="w-4 h-4"></i> Mark FAILED
            </button>
            <button onclick="TestRunsView.submitStatus('${runId}', '${caseId}', 'Blocked')" class="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5">
              <i data-lucide="alert-octagon" class="w-4 h-4"></i> Mark BLOCKED
            </button>
          </div>

          <!-- 1-Click: Log Bug from Failed Test (Section V1.8) -->
          ${execItem.status === 'Fail' ? `
            <button onclick="TestRunsView.triggerLogBugFromTest('${runId}', '${caseId}')" class="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5 pulse-attention">
              <i data-lucide="bug" class="w-4 h-4 text-red-600"></i> 1-Click: Log Bug from Failure
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  submitStatus(runId, caseId, status) {
    const actual = document.getElementById("runnerActualResult") ? document.getElementById("runnerActualResult").value.trim() : "";
    const evidence = document.getElementById("runnerEvidence") ? document.getElementById("runnerEvidence").value.trim() : "";

    store.recordTestCaseExecution(runId, caseId, {
      status,
      actualResult: actual || (status === "Pass" ? "Executed successfully according to steps." : "Execution resulted in failure."),
      evidence
    });

    window.app.toast("Result Recorded", `Test case marked as ${status}.`, status === "Pass" ? "success" : status === "Fail" ? "error" : "warning");
    this.openExecutionRunner(runId);
  },

  triggerLogBugFromTest(runId, caseId) {
    const actual = document.getElementById("runnerActualResult") ? document.getElementById("runnerActualResult").value.trim() : "";
    const evidence = document.getElementById("runnerEvidence") ? document.getElementById("runnerEvidence").value.trim() : "";

    const newBug = store.logBugFromFailedTest(runId, caseId, {
      actualResult: actual,
      evidence
    });

    window.app.toast("Defect Created", `1-Click Bug ${newBug.key} logged from test failure!`, "success");
    document.getElementById("testRunModalContainer").innerHTML = "";
    window.app.navigate("bugs");
  }
};

window.TestRunsView = TestRunsView;
