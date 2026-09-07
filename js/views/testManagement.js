/**
 * PulseWave QA Platform — Test Management Workspace (V2 Simplified)
 * Clean, real-world QA workflow:
 * 1. Overview (Real metrics, Quality Gate, Active Cycle, Defect connection)
 * 2. Test Library (Reusable test cases organized by Module/Feature/Tags, dynamic steps editor)
 * 3. Test Execution (Interactive runner, Step results, Failed test -> Create Bug, Retest workflow)
 * 100% Dynamic Real Project Data & Supabase PostgreSQL Synchronization.
 */

const TestManagementView = {
  activeTab: "overview", // overview | library | execution
  searchQuery: "",
  selectedModule: "all",
  selectedType: "all",
  selectedPriority: "all",
  selectedStatus: "all",
  selectedResult: "all",
  selectedAssignee: "all",
  groupByModule: true,

  // Execution Runner State
  activeCycleId: null,
  executionFilter: "all", // all | pending | failed | passed | blocked
  executionModuleFilter: "all",
  activeExecutionCaseId: null,
  openDrawerCaseId: null,

  render(container) {
    const activeProject = store.getActiveProject() || {};
    const activeProjectId = activeProject.id || null;
    const allProjects = store.getAuthorizedProjects ? store.getAuthorizedProjects() : (store.getProjects() || []);
    const activeUser = store.getActiveUser() || { name: "QA Lead", role: "QA Engineer" };
    const userRole = store.getUserSpaceRole ? store.getUserSpaceRole(activeProject.workspace_id, activeUser.id) : (activeUser.role || "QA");
    const isReadOnly = userRole === "VIEWER" || userRole === "DEVELOPER";

    const testCases = store.getTestCases(activeProjectId);
    const executions = store.getTestExecutions(activeProjectId);
    const cycles = store.getTestCycles(activeProjectId);
    const stats = this.computeProjectStats(testCases, executions);

    // Optional background Supabase sync
    if (store.syncTestCasesFromSupabase && activeProjectId) {
      store.syncTestCasesFromSupabase(activeProjectId).catch(() => {});
    }

    const releaseVersion = activeProject.release_version || activeProject.currentRelease || "v1.0.0";
    const projectEnv = activeProject.environment || "Staging";

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-16">

        <!-- =========================================================================
             1. HEADER & PROJECT CONTEXT BAR
             ========================================================================= -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-slate-900 text-[#bef264] flex items-center justify-center font-bold text-sm border border-slate-800">
                ${activeProject.key ? activeProject.key.substring(0, 3) : 'QA'}
              </div>
              <div>
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Test Management
                  <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Data
                  </span>
                </h1>
              </div>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Maintain reusable test cases, execute testing cycles against releases, and trace defects to retests.
            </p>
          </div>

          <!-- Project, Release & Environment Context Bar -->
          <div class="flex flex-wrap items-center gap-2 text-xs bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
            <div class="flex items-center gap-1.5 px-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PROJECT:</span>
              <select onchange="TestManagementView.handleProjectChange(this.value)" class="bg-slate-50 font-semibold text-slate-800 border-0 focus:ring-0 cursor-pointer rounded px-2 py-1 text-xs">
                ${allProjects.map(p => `<option value="${p.id}" ${activeProject && p.id === activeProject.id ? 'selected' : ''}>${p.key || 'PRJ'} &bull; ${p.name}</option>`).join("")}
              </select>
            </div>

            <div class="h-4 w-px bg-slate-200 hidden sm:block"></div>

            <div class="flex items-center gap-1.5 px-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RELEASE:</span>
              <span class="font-mono font-semibold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">
                ${releaseVersion}
              </span>
            </div>

            <div class="h-4 w-px bg-slate-200 hidden sm:block"></div>

            <div class="flex items-center gap-1.5 px-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ENV:</span>
              <span class="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 text-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                ${projectEnv}
              </span>
            </div>
          </div>
        </div>

        <!-- =========================================================================
             2. 3-TAB SIMPLIFIED NAVIGATION & PRIMARY ACTIONS
             ========================================================================= -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 gap-3 pb-px">
          <div class="flex items-center gap-2 overflow-x-auto">
            <button onclick="TestManagementView.switchTab('overview')" class="px-4 py-2.5 text-xs transition whitespace-nowrap cursor-pointer rounded-t-lg ${this.activeTab === 'overview' ? 'border-b-2 border-slate-950 text-slate-950 font-bold bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'}">
              <span class="flex items-center gap-1.5"><i data-lucide="layout-grid" class="w-4 h-4"></i> 1. Overview</span>
            </button>
            <button onclick="TestManagementView.switchTab('library')" class="px-4 py-2.5 text-xs transition whitespace-nowrap cursor-pointer rounded-t-lg ${this.activeTab === 'library' ? 'border-b-2 border-slate-950 text-slate-950 font-bold bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'}">
              <span class="flex items-center gap-1.5"><i data-lucide="folder-check" class="w-4 h-4"></i> 2. Test Library (${testCases.length})</span>
            </button>
            <button onclick="TestManagementView.switchTab('execution')" class="px-4 py-2.5 text-xs transition whitespace-nowrap cursor-pointer rounded-t-lg ${this.activeTab === 'execution' ? 'border-b-2 border-slate-950 text-slate-950 font-bold bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'}">
              <span class="flex items-center gap-1.5"><i data-lucide="play-circle" class="w-4 h-4 text-emerald-600"></i> 3. Test Execution (${stats.executed} run)</span>
            </button>
          </div>

          <!-- Primary Actions -->
          <div class="flex items-center gap-2 pb-1 shrink-0">
            ${!isReadOnly ? `
              <button onclick="TestManagementView.openCreateCaseModal()" class="px-3.5 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl text-xs transition shadow-xs shadow-[#bef264]/25 flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="plus" class="w-3.5 h-3.5 text-slate-950"></i>
                <span>+ Create Test Case</span>
              </button>
              <button onclick="TestManagementView.switchTab('execution'); TestManagementView.openStartCycleModal()" class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                <span>Start Test Cycle</span>
              </button>
            ` : `
              <span class="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold flex items-center gap-1">
                <i data-lucide="lock" class="w-3 h-3"></i> Read Only
              </span>
            `}
          </div>
        </div>

        <!-- =========================================================================
             3. ACTIVE TAB CONTENT
             ========================================================================= -->
        <div id="tmTabContentArea">
          ${this.renderActiveTabContent(activeProject, testCases, executions, stats, cycles, isReadOnly)}
        </div>

        <!-- Modals & Drawers Container -->
        <div id="tmModalContainer"></div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  computeProjectStats(testCases, executions) {
    const total = testCases.length;
    const passed = testCases.filter(tc => tc.lastResult === "Passed" || tc.lastResult === "Pass").length;
    const failed = testCases.filter(tc => tc.lastResult === "Failed" || tc.lastResult === "Fail").length;
    const blocked = testCases.filter(tc => tc.lastResult === "Blocked").length;
    const skipped = testCases.filter(tc => tc.lastResult === "Skipped" || tc.lastResult === "Skip").length;
    const notRun = total - (passed + failed + blocked + skipped);
    const executed = passed + failed + blocked + skipped;

    // Quality gate status
    let qualityGate = "NOT EVALUATED";
    let passRate = 0;
    if (executed > 0) {
      passRate = Math.round((passed / executed) * 100);
      if (failed === 0 && passRate >= 95) {
        qualityGate = "PASSED";
      } else if (failed > 0 && failed <= 2 && passRate >= 75) {
        qualityGate = "AT RISK";
      } else if (failed > 2 || passRate < 75) {
        qualityGate = "FAILED";
      } else {
        qualityGate = "IN PROGRESS";
      }
    }

    return {
      total,
      executed,
      passed,
      failed,
      blocked,
      skipped,
      notRun: notRun < 0 ? 0 : notRun,
      passRate,
      qualityGate,
      totalExecutions: executions.length
    };
  },

  renderActiveTabContent(project, testCases, executions, stats, cycles, isReadOnly) {
    switch (this.activeTab) {
      case "library":
        return this.renderLibraryTab(project, testCases, isReadOnly);
      case "execution":
        return this.renderExecutionTab(project, testCases, executions, stats, cycles, isReadOnly);
      case "overview":
      default:
        return this.renderOverviewTab(project, testCases, executions, stats, cycles, isReadOnly);
    }
  },

  // =========================================================================
  // TAB 1: OVERVIEW DASHBOARD & HONEST QUALITY METRICS
  // =========================================================================
  renderOverviewTab(project, testCases, executions, stats, cycles, isReadOnly) {
    const failedCases = testCases.filter(tc => tc.lastResult === "Failed" || tc.lastResult === "Fail");
    const linkedBugs = (store.getIssues ? store.getIssues(project.id) : []).filter(i => i.type === "Bug" && (i.linkedTestCaseId || failedCases.some(fc => fc.relatedIssueKey === i.key)));
    const openBlockers = linkedBugs.filter(b => b.priority === "Critical" || b.severity === "Critical" || b.status !== "Done");

    const activeCycle = store.getActiveTestCycle ? store.getActiveTestCycle(project.id) : (cycles[0] || null);

    return `
      <div class="space-y-6">

        <!-- Honest Real-Data Metric Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <!-- Total -->
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">TOTAL TESTS</span>
              <i data-lucide="layers" class="w-4 h-4 text-slate-400"></i>
            </div>
            <div class="text-2xl font-black text-slate-900 tracking-tight mt-1">${stats.total}</div>
            <span class="text-[11px] text-slate-400 font-medium mt-0.5 block">Repository scope</span>
          </div>

          <!-- Executed -->
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-900">EXECUTED</span>
              <i data-lucide="play-circle" class="w-4 h-4 text-slate-700"></i>
            </div>
            <div class="text-2xl font-black text-slate-900 tracking-tight mt-1">${stats.executed}</div>
            <span class="text-[11px] text-slate-500 font-medium mt-0.5 block">
              ${stats.total > 0 ? Math.round((stats.executed / stats.total) * 100) : 0}% progress
            </span>
          </div>

          <!-- Passed -->
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600">PASSED</span>
              <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500"></i>
            </div>
            <div class="text-2xl font-black text-emerald-600 tracking-tight mt-1">${stats.passed}</div>
            <span class="text-[11px] text-emerald-600/80 font-medium mt-0.5 block">
              ${stats.executed > 0 ? stats.passRate : 0}% pass rate
            </span>
          </div>

          <!-- Failed -->
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-rose-600">FAILED</span>
              <i data-lucide="x-circle" class="w-4 h-4 text-rose-500"></i>
            </div>
            <div class="text-2xl font-black text-rose-600 tracking-tight mt-1">${stats.failed}</div>
            <span class="text-[11px] text-rose-500 font-medium mt-0.5 block">
              ${stats.failed > 0 ? `${stats.failed} actionable defects` : 'Zero defect failures'}
            </span>
          </div>

          <!-- Blocked -->
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600">BLOCKED</span>
              <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-500"></i>
            </div>
            <div class="text-2xl font-black text-amber-600 tracking-tight mt-1">${stats.blocked}</div>
            <span class="text-[11px] text-amber-600/80 font-medium mt-0.5 block">
              ${stats.blocked > 0 ? 'Blocked by dependency' : 'No blockers'}
            </span>
          </div>

          <!-- Not Run -->
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">NOT RUN</span>
              <i data-lucide="clock" class="w-4 h-4 text-slate-400"></i>
            </div>
            <div class="text-2xl font-black text-slate-600 tracking-tight mt-1">${stats.notRun}</div>
            <span class="text-[11px] text-slate-400 font-medium mt-0.5 block">Pending execution</span>
          </div>
        </div>

        <!-- Quality Gate & Active Testing Cycle 2-Card Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- 1. Quality Gate Card (Evaluated Honestly from Real Data) -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <i data-lucide="shield-check" class="w-4 h-4 text-slate-900"></i> Release Quality Gate
                </span>
                <span class="font-mono text-xs text-slate-400">${project.release_version || 'v1.0.0'} &bull; ${project.environment || 'Staging'}</span>
              </div>

              <div class="mt-4">
                ${stats.executed === 0 ? `
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-sm">
                      --
                    </div>
                    <div>
                      <div class="text-lg font-bold text-slate-700">QUALITY GATE: NOT EVALUATED</div>
                      <p class="text-xs text-slate-500">No test cases have been executed yet for this project. Quality status cannot be determined without execution data.</p>
                    </div>
                  </div>
                ` : `
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${stats.qualityGate === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : (stats.qualityGate === 'AT RISK' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}">
                      ${stats.passRate}%
                    </div>
                    <div>
                      <div class="text-lg font-bold ${stats.qualityGate === 'PASSED' ? 'text-emerald-700' : (stats.qualityGate === 'AT RISK' ? 'text-amber-700' : 'text-rose-700')}">
                        QUALITY GATE: ${stats.qualityGate}
                      </div>
                      <p class="text-xs text-slate-500">
                        ${stats.passed} of ${stats.executed} executed tests passed (${stats.passRate}% pass rate). ${stats.failed > 0 ? `${stats.failed} failing test(s) blocking release.` : 'Ready for release verification.'}
                      </p>
                    </div>
                  </div>
                `}
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-500">Criteria: &ge;95% Pass Rate & 0 P0/P1 Failures</span>
              <button onclick="TestManagementView.switchTab('execution')" class="font-bold text-slate-900 hover:text-[#4d7c0f] hover:underline">
                Execute Tests &rarr;
              </button>
            </div>
          </div>

          <!-- 2. Active Testing Cycle Card -->
          <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CURRENT TESTING CYCLE
                </span>
                <span class="text-xs text-slate-400 font-mono">${project.key || 'QA'}</span>
              </div>

              <h3 class="text-lg font-bold text-white mt-3">
                ${activeCycle ? activeCycle.name : `Regression Testing — Release ${project.release_version || 'v1.0.0'}`}
              </h3>
              
              <div class="mt-3 space-y-2">
                <div class="flex items-center justify-between text-xs text-slate-300">
                  <span>Progress (${stats.executed} / ${stats.total} tests)</span>
                  <span class="font-mono font-bold">${stats.total > 0 ? Math.round((stats.executed / stats.total) * 100) : 0}%</span>
                </div>
                <div class="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                  <div class="bg-emerald-400 h-full rounded-full transition-all duration-500" style="width: ${stats.total > 0 ? Math.round((stats.executed / stats.total) * 100) : 0}%"></div>
                </div>
                <div class="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                  <span class="text-emerald-400 font-medium">${stats.passed} Passed</span>
                  <span class="text-rose-400 font-medium">${stats.failed} Failed</span>
                  <span class="text-amber-400 font-medium">${stats.blocked} Blocked</span>
                  <span class="text-slate-400 font-medium">${stats.notRun} Not Run</span>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between">
              <span class="text-xs text-slate-400">Environment: <strong class="text-slate-200">${project.environment || 'Staging'}</strong></span>
              ${stats.total === 0 ? `
                <button onclick="TestManagementView.openCreateCaseModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl text-xs transition shadow-xs cursor-pointer">
                  + Create First Test Case
                </button>
              ` : `
                <button onclick="TestManagementView.switchTab('execution')" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                  <span>${stats.executed > 0 ? 'Continue Testing' : 'Start Test Execution'}</span>
                </button>
              `}
            </div>
          </div>

        </div>

        <!-- Defect Connection & Failed Test Traceability Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Testing-Related Defect Information -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs border border-rose-200">
                  <i data-lucide="bug" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-900">Testing Defect Connections</h4>
                  <p class="text-[11px] text-slate-500">Live synchronization with Issues & Defects board</p>
                </div>
              </div>
              <button onclick="window.app.navigate('bugs')" class="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1">
                Issues Board &rarr;
              </button>
            </div>

            <!-- 3 Mini Metric Badges -->
            <div class="grid grid-cols-3 gap-2.5">
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Failed Tests</span>
                <span class="text-lg font-black text-rose-600">${stats.failed}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Linked Bugs</span>
                <span class="text-lg font-black text-slate-800">${linkedBugs.length}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Open Blockers</span>
                <span class="text-lg font-black ${openBlockers.length > 0 ? 'text-rose-600' : 'text-emerald-600'}">${openBlockers.length}</span>
              </div>
            </div>

            <!-- Failed Tests Action List -->
            <div class="divide-y divide-slate-100">
              ${failedCases.length === 0 ? `
                <div class="py-6 text-center text-xs text-slate-400 space-y-1">
                  <i data-lucide="check-circle-2" class="w-6 h-6 text-emerald-500 mx-auto"></i>
                  <p class="font-semibold text-slate-700">Zero Failed Tests in Scope</p>
                  <p class="text-[11px] text-slate-400">All executed test cases passed successfully.</p>
                </div>
              ` : failedCases.slice(0, 4).map(fc => {
                const linkedBug = (store.getIssues ? store.getIssues(project.id) : []).find(i => i.linkedTestCaseId === fc.id || i.key === fc.relatedIssueKey);
                return `
                  <div class="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-bold text-rose-600 text-[11px]">${fc.id}</span>
                        <span class="font-semibold text-slate-800 truncate">${fc.title}</span>
                      </div>
                      <span class="text-[10px] text-slate-400">${fc.module || 'General'} &bull; ${fc.priority || 'High'}</span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      ${linkedBug ? `
                        <span onclick="window.app.navigate('bugs')" class="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer hover:bg-rose-100 transition">
                          ${linkedBug.key} (${linkedBug.status})
                        </span>
                        ${linkedBug.status === 'Ready for QA' || linkedBug.status === 'Done' ? `
                          <button onclick="TestManagementView.openRetestModal('${fc.id}')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer">
                            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Retest
                          </button>
                        ` : ''}
                      ` : `
                        <button onclick="TestManagementView.openCreateBugModal('${fc.id}')" class="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer">
                          <i data-lucide="bug" class="w-3 h-3"></i> + Create Bug
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Recent Test Activity & Execution History -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200">
                  <i data-lucide="history" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-900">Recent Test Activity</h4>
                  <p class="text-[11px] text-slate-500">Real-time immutable execution log</p>
                </div>
              </div>
              <button onclick="TestManagementView.switchTab('execution')" class="text-xs font-bold text-slate-900 hover:text-[#4d7c0f] hover:underline">
                Execution Hub &rarr;
              </button>
            </div>

            <div class="divide-y divide-slate-100">
              ${executions.length === 0 ? `
                <div class="py-6 text-center text-xs text-slate-400 space-y-1">
                  <i data-lucide="play-circle" class="w-6 h-6 text-slate-300 mx-auto"></i>
                  <p class="font-semibold text-slate-700">No Executions Recorded Yet</p>
                  <p class="text-[11px] text-slate-400">Execute test cases to build a complete audit trail.</p>
                </div>
              ` : executions.slice(0, 5).map(ex => {
                const tc = store.getTestCaseById(ex.testCaseId) || {};
                const isPass = ex.status === "Passed" || ex.result === "Passed";
                const isFail = ex.status === "Failed" || ex.result === "Failed";
                const isBlock = ex.status === "Blocked" || ex.result === "Blocked";
                return `
                  <div class="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${isPass ? 'bg-emerald-50 text-emerald-700' : (isFail ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700')}">
                          ${ex.status}
                        </span>
                        <span class="font-mono font-semibold text-slate-700 text-[11px]">${ex.testCaseId}</span>
                        <span class="font-medium text-slate-800 truncate cursor-pointer hover:text-[#4d7c0f]" onclick="TestManagementView.openCaseDrawer('${ex.testCaseId}')">${tc.title || 'Verification'}</span>
                      </div>
                      <span class="text-[10px] text-slate-400">by ${ex.executedBy || 'QA'} &bull; ${ex.executionDate || 'Recently'} &bull; ${ex.runType || 'Run'}</span>
                    </div>
                    ${ex.linkedDefectKey ? `
                      <span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        ${ex.linkedDefectKey}
                      </span>
                    ` : ''}
                  </div>
                `;
              }).join("")}
            </div>
          </div>

        </div>

      </div>
    `;
  },

  // =========================================================================
  // TAB 2: TEST LIBRARY (Clean Table & Module-Grouped Repository)
  // =========================================================================
  renderLibraryTab(project, testCases, isReadOnly) {
    const activeProjectId = project.id;
    const modules = [...new Set(testCases.map(tc => tc.module || "General"))];
    const assignees = [...new Set(testCases.map(tc => tc.assignedQA || tc.assigned_to).filter(Boolean))];

    // Filter test cases
    const filteredCases = store.getTestCases(activeProjectId, {
      module: this.selectedModule,
      testType: this.selectedType,
      priority: this.selectedPriority,
      status: this.selectedStatus,
      result: this.selectedResult,
      assignedQA: this.selectedAssignee,
      search: this.searchQuery
    });

    return `
      <div class="space-y-4">

        <!-- Filter & Search Toolbar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            <!-- Search Bar -->
            <div class="relative flex-1 max-w-md">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
              <input
                type="text"
                value="${this.searchQuery}"
                oninput="TestManagementView.handleSearch(this.value)"
                placeholder="Search by ID, title, description, module or tags..."
                class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]"
              />
            </div>

            <!-- View Mode Switch & Reset Filters -->
            <div class="flex items-center gap-2">
              <button onclick="TestManagementView.toggleGrouping()" class="px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${this.groupByModule ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}">
                <i data-lucide="${this.groupByModule ? 'folder-tree' : 'list'}" class="w-3.5 h-3.5"></i>
                <span>${this.groupByModule ? 'Grouped by Module' : 'Flat Table'}</span>
              </button>

              ${(this.searchQuery || this.selectedModule !== 'all' || this.selectedType !== 'all' || this.selectedPriority !== 'all' || this.selectedStatus !== 'all' || this.selectedResult !== 'all' || this.selectedAssignee !== 'all') ? `
                <button onclick="TestManagementView.resetFilters()" class="px-2.5 py-1.5 text-xs text-rose-600 font-bold hover:underline cursor-pointer">
                  Clear Filters
                </button>
              ` : ''}
            </div>

          </div>

          <!-- Dropdown Filter Pills -->
          <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
            <!-- Module Filter -->
            <div class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span class="text-[10px] font-bold text-slate-400">MODULE:</span>
              <select onchange="TestManagementView.setFilter('selectedModule', this.value)" class="bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 focus:ring-0 cursor-pointer">
                <option value="all">All Modules (${testCases.length})</option>
                ${modules.map(m => `<option value="${m}" ${this.selectedModule.toLowerCase() === m.toLowerCase() ? 'selected' : ''}>${m}</option>`).join("")}
              </select>
            </div>

            <!-- Test Type Filter -->
            <div class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span class="text-[10px] font-bold text-slate-400">TYPE:</span>
              <select onchange="TestManagementView.setFilter('selectedType', this.value)" class="bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 focus:ring-0 cursor-pointer">
                <option value="all">All Types</option>
                <option value="Functional" ${this.selectedType === 'Functional' ? 'selected' : ''}>Functional</option>
                <option value="Smoke" ${this.selectedType === 'Smoke' ? 'selected' : ''}>Smoke</option>
                <option value="Sanity" ${this.selectedType === 'Sanity' ? 'selected' : ''}>Sanity</option>
                <option value="Regression" ${this.selectedType === 'Regression' ? 'selected' : ''}>Regression</option>
                <option value="Integration" ${this.selectedType === 'Integration' ? 'selected' : ''}>Integration</option>
                <option value="UAT" ${this.selectedType === 'UAT' ? 'selected' : ''}>UAT</option>
                <option value="E2E" ${this.selectedType === 'E2E' ? 'selected' : ''}>E2E</option>
                <option value="Exploratory" ${this.selectedType === 'Exploratory' ? 'selected' : ''}>Exploratory</option>
              </select>
            </div>

            <!-- Priority Filter -->
            <div class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span class="text-[10px] font-bold text-slate-400">PRIORITY:</span>
              <select onchange="TestManagementView.setFilter('selectedPriority', this.value)" class="bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 focus:ring-0 cursor-pointer">
                <option value="all">All Priorities</option>
                <option value="Critical" ${this.selectedPriority === 'Critical' ? 'selected' : ''}>Critical (P0)</option>
                <option value="High" ${this.selectedPriority === 'High' ? 'selected' : ''}>High (P1)</option>
                <option value="Medium" ${this.selectedPriority === 'Medium' ? 'selected' : ''}>Medium (P2)</option>
                <option value="Low" ${this.selectedPriority === 'Low' ? 'selected' : ''}>Low (P3)</option>
              </select>
            </div>

            <!-- Status Filter -->
            <div class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span class="text-[10px] font-bold text-slate-400">STATUS:</span>
              <select onchange="TestManagementView.setFilter('selectedStatus', this.value)" class="bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 focus:ring-0 cursor-pointer">
                <option value="all">All Status</option>
                <option value="Active" ${this.selectedStatus === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Draft" ${this.selectedStatus === 'Draft' ? 'selected' : ''}>Draft</option>
                <option value="Archived" ${this.selectedStatus === 'Archived' ? 'selected' : ''}>Archived</option>
              </select>
            </div>

            <!-- Last Result Filter -->
            <div class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span class="text-[10px] font-bold text-slate-400">RESULT:</span>
              <select onchange="TestManagementView.setFilter('selectedResult', this.value)" class="bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 focus:ring-0 cursor-pointer">
                <option value="all">All Results</option>
                <option value="Passed" ${this.selectedResult === 'Passed' ? 'selected' : ''}>Passed</option>
                <option value="Failed" ${this.selectedResult === 'Failed' ? 'selected' : ''}>Failed</option>
                <option value="Blocked" ${this.selectedResult === 'Blocked' ? 'selected' : ''}>Blocked</option>
                <option value="Not Run" ${this.selectedResult === 'Not Run' ? 'selected' : ''}>Not Run</option>
              </select>
            </div>

            <span class="ml-auto text-slate-400 font-medium text-[11px]">
              Showing <strong>${filteredCases.length}</strong> of ${testCases.length} cases
            </span>
          </div>
        </div>

        <!-- Main Test Library Content -->
        ${testCases.length === 0 ? `
          <!-- Empty State When 0 Cases Exist -->
          <div class="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto">
              <i data-lucide="folder-plus" class="w-7 h-7"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900">No test cases yet</h3>
              <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Create reusable tests for your project and execute them against releases.
              </p>
            </div>
            ${!isReadOnly ? `
              <button onclick="TestManagementView.openCreateCaseModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl text-xs transition shadow-xs cursor-pointer inline-flex items-center gap-1.5 mt-2">
                <i data-lucide="plus" class="w-4 h-4 text-slate-950"></i>
                <span>+ Create Test Case</span>
              </button>
            ` : ''}
          </div>
        ` : filteredCases.length === 0 ? `
          <!-- Empty State When Filter Yields 0 Cases -->
          <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <i data-lucide="filter-x" class="w-8 h-8 text-slate-300 mx-auto"></i>
            <h4 class="text-sm font-bold text-slate-800">No test cases match your search criteria</h4>
            <p class="text-xs text-slate-500">Try adjusting your search query or removing filters.</p>
            <button onclick="TestManagementView.resetFilters()" class="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer">
              Reset Filters
            </button>
          </div>
        ` : this.groupByModule ? `
          <!-- Grouped by Module View -->
          <div class="space-y-4">
            ${modules.map(mod => {
              const casesInMod = filteredCases.filter(c => (c.module || "General").toLowerCase() === mod.toLowerCase());
              if (casesInMod.length === 0) return '';
              const passedCount = casesInMod.filter(c => c.lastResult === 'Passed').length;
              const failedCount = casesInMod.filter(c => c.lastResult === 'Failed').length;
              return `
                <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <!-- Module Header Accordion Strip -->
                  <div class="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <i data-lucide="folder" class="w-4 h-4 text-slate-700"></i>
                      <h4 class="text-xs font-bold text-slate-900 tracking-wide uppercase">${mod}</h4>
                      <span class="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">${casesInMod.length}</span>
                    </div>
                    <div class="flex items-center gap-3 text-xs">
                      <span class="text-[11px] text-slate-500">
                        <strong class="text-emerald-600">${passedCount} passed</strong> &bull; <strong class="text-rose-600">${failedCount} failed</strong>
                      </span>
                    </div>
                  </div>
                  <!-- Cases Table -->
                  ${this.renderCasesTable(casesInMod, isReadOnly)}
                </div>
              `;
            }).join("")}
          </div>
        ` : `
          <!-- Flat Table View -->
          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            ${this.renderCasesTable(filteredCases, isReadOnly)}
          </div>
        `}

      </div>
    `;
  },

  renderCasesTable(cases, isReadOnly) {
    return `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th class="py-3 px-4 w-28">ID</th>
              <th class="py-3 px-4 min-w-[240px]">Test Case Title</th>
              <th class="py-3 px-4 w-28">Type</th>
              <th class="py-3 px-4 w-24">Priority</th>
              <th class="py-3 px-4 w-20 text-center">Steps</th>
              <th class="py-3 px-4 w-28">Last Result</th>
              <th class="py-3 px-4 w-28">Assignee</th>
              <th class="py-3 px-4 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${cases.map(tc => {
              const isPass = tc.lastResult === "Passed" || tc.lastResult === "Pass";
              const isFail = tc.lastResult === "Failed" || tc.lastResult === "Fail";
              const isBlock = tc.lastResult === "Blocked";
              const isSkip = tc.lastResult === "Skipped";
              const stepCount = Array.isArray(tc.steps) ? tc.steps.length : 1;
              return `
                <tr class="hover:bg-slate-50/60 transition group">
                  <!-- ID -->
                  <td class="py-3 px-4 font-mono font-bold text-slate-700">
                    <span class="cursor-pointer hover:text-[#4d7c0f]" onclick="TestManagementView.openCaseDrawer('${tc.id}')">
                      ${tc.id}
                    </span>
                  </td>

                  <!-- Title & Module & Linked Bug -->
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-slate-900 hover:text-[#4d7c0f] cursor-pointer line-clamp-1" onclick="TestManagementView.openCaseDrawer('${tc.id}')">
                        ${tc.title}
                      </span>
                      ${tc.relatedIssueKey ? `
                        <span onclick="window.app.navigate('bugs')" class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer hover:bg-rose-100 shrink-0">
                          ${tc.relatedIssueKey}
                        </span>
                      ` : ''}
                    </div>
                    <div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>${tc.module || 'General'}</span>
                      ${tc.tags && tc.tags.length > 0 ? `<span>&bull;</span> <span>${tc.tags.join(", ")}</span>` : ''}
                    </div>
                  </td>

                  <!-- Test Type -->
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      ${tc.testType || tc.type || 'Functional'}
                    </span>
                  </td>

                  <!-- Priority -->
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${tc.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : (tc.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700')}">
                      ${tc.priority || 'Medium'}
                    </span>
                  </td>

                  <!-- Steps Count -->
                  <td class="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                    ${stepCount}
                  </td>

                  <!-- Last Result -->
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${isPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (isFail ? 'bg-rose-50 text-rose-700 border border-rose-200' : (isBlock ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'))}">
                      <span class="w-1.5 h-1.5 rounded-full ${isPass ? 'bg-emerald-500' : (isFail ? 'bg-rose-500' : (isBlock ? 'bg-amber-500' : 'bg-slate-400'))}"></span>
                      ${tc.lastResult || 'Not Run'}
                    </span>
                  </td>

                  <!-- Assignee -->
                  <td class="py-3 px-4 text-slate-600 text-[11px] truncate">
                    ${tc.assignedQA || tc.assigned_to || 'Unassigned'}
                  </td>

                  <!-- Actions -->
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                      <button onclick="TestManagementView.quickExecuteModal('${tc.id}')" title="Execute Case" class="p-1.5 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition cursor-pointer">
                        <i data-lucide="play" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="TestManagementView.openCaseDrawer('${tc.id}')" title="View / Edit Details" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                      </button>
                      ${!isReadOnly ? `
                        <button onclick="TestManagementView.duplicateCase('${tc.id}')" title="Duplicate Case" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer">
                          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="TestManagementView.deleteCase('${tc.id}')" title="Delete Case" class="p-1.5 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg transition cursor-pointer">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  // =========================================================================
  // TAB 3: TEST EXECUTION (Interactive Runner & Defect Retest Workflow)
  // =========================================================================
  renderExecutionTab(project, testCases, executions, stats, cycles, isReadOnly) {
    const activeProjectId = project.id;
    const activeCycle = store.getActiveTestCycle ? store.getActiveTestCycle(activeProjectId) : (cycles[0] || null);

    // Filter test cases in execution scope
    let runnerCases = testCases;
    if (activeCycle && activeCycle.selectedCaseIds && activeCycle.selectedCaseIds.length > 0) {
      runnerCases = testCases.filter(tc => activeCycle.selectedCaseIds.includes(tc.id));
    }

    if (this.executionFilter === "failed") {
      runnerCases = runnerCases.filter(tc => tc.lastResult === "Failed");
    } else if (this.executionFilter === "passed") {
      runnerCases = runnerCases.filter(tc => tc.lastResult === "Passed");
    } else if (this.executionFilter === "blocked") {
      runnerCases = runnerCases.filter(tc => tc.lastResult === "Blocked");
    } else if (this.executionFilter === "pending") {
      runnerCases = runnerCases.filter(tc => tc.lastResult === "Not Run" || !tc.lastResult);
    }

    if (this.executionModuleFilter !== "all") {
      runnerCases = runnerCases.filter(tc => (tc.module || "").toLowerCase() === this.executionModuleFilter.toLowerCase());
    }

    const modules = [...new Set(testCases.map(tc => tc.module || "General"))];

    return `
      <div class="space-y-6">

        <!-- Testing Cycle Execution Header Banner -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ACTIVE TESTING CYCLE
                </span>
                <span class="text-xs font-mono text-slate-400">Release ${activeCycle ? activeCycle.release : (project.release_version || 'v1.0.0')} &bull; ${activeCycle ? activeCycle.environment : (project.environment || 'Staging')}</span>
              </div>
              <h2 class="text-xl font-bold text-slate-900 tracking-tight mt-1">
                ${activeCycle ? activeCycle.name : `Regression Testing Cycle — Release ${project.release_version || 'v1.0.0'}`}
              </h2>
            </div>

            <div class="flex items-center gap-2">
              ${!isReadOnly ? `
                <button onclick="TestManagementView.openStartCycleModal()" class="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  <span>New Cycle Setup</span>
                </button>
              ` : ''}
              <button onclick="window.app.navigate('test-reports')" class="px-3.5 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl text-xs transition shadow-xs shadow-[#bef264]/25 flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                <span>Generate QA Report</span>
              </button>
            </div>
          </div>

          <!-- Real-Time Execution Counters & Progress -->
          <div class="pt-3 border-t border-slate-100 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-700">Execution Progress: <strong>${stats.executed} / ${stats.total} executed</strong> (${stats.total > 0 ? Math.round((stats.executed / stats.total) * 100) : 0}%)</span>
              <div class="flex items-center gap-3 text-[11px] font-semibold">
                <span class="text-emerald-700">${stats.passed} Passed</span>
                <span class="text-rose-700">${stats.failed} Failed</span>
                <span class="text-amber-700">${stats.blocked} Blocked</span>
                <span class="text-slate-500">${stats.notRun} Not Run</span>
              </div>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
              <div class="bg-emerald-500 h-full transition-all duration-500" style="width: ${stats.total > 0 ? (stats.passed / stats.total) * 100 : 0}%"></div>
              <div class="bg-rose-500 h-full transition-all duration-500" style="width: ${stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}%"></div>
              <div class="bg-amber-500 h-full transition-all duration-500" style="width: ${stats.total > 0 ? (stats.blocked / stats.total) * 100 : 0}%"></div>
            </div>
          </div>
        </div>

        <!-- Runner Filters -->
        <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
          <!-- Filter Tabs -->
          <div class="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
            <button onclick="TestManagementView.setExecutionFilter('all')" class="px-3 py-1 rounded-lg font-bold transition cursor-pointer ${this.executionFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}">
              All (${stats.total})
            </button>
            <button onclick="TestManagementView.setExecutionFilter('pending')" class="px-3 py-1 rounded-lg font-bold transition cursor-pointer ${this.executionFilter === 'pending' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}">
              Pending (${stats.notRun})
            </button>
            <button onclick="TestManagementView.setExecutionFilter('failed')" class="px-3 py-1 rounded-lg font-bold transition cursor-pointer ${this.executionFilter === 'failed' ? 'bg-rose-600 text-white' : 'text-rose-600 hover:bg-rose-50'}">
              Failed (${stats.failed})
            </button>
            <button onclick="TestManagementView.setExecutionFilter('passed')" class="px-3 py-1 rounded-lg font-bold transition cursor-pointer ${this.executionFilter === 'passed' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'}">
              Passed (${stats.passed})
            </button>
            <button onclick="TestManagementView.setExecutionFilter('blocked')" class="px-3 py-1 rounded-lg font-bold transition cursor-pointer ${this.executionFilter === 'blocked' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'}">
              Blocked (${stats.blocked})
            </button>
          </div>

          <!-- Module Selector -->
          <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <span class="text-[10px] font-bold text-slate-400">MODULE:</span>
            <select onchange="TestManagementView.setExecutionModuleFilter(this.value)" class="bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 focus:ring-0 cursor-pointer">
              <option value="all">All Modules</option>
              ${modules.map(m => `<option value="${m}" ${this.executionModuleFilter.toLowerCase() === m.toLowerCase() ? 'selected' : ''}>${m}</option>`).join("")}
            </select>
          </div>
        </div>

        <!-- Interactive Runner Test Case Execution Cards -->
        <div class="space-y-4">
          ${runnerCases.length === 0 ? `
            <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <i data-lucide="check-circle-2" class="w-8 h-8 text-emerald-500 mx-auto"></i>
              <h4 class="text-sm font-bold text-slate-800">No test cases match the execution filter</h4>
              <button onclick="TestManagementView.setExecutionFilter('all')" class="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer">
                Show All Tests
              </button>
            </div>
          ` : runnerCases.map(tc => this.renderExecutionCard(tc, project, isReadOnly)).join("")}
        </div>

      </div>
    `;
  },

  renderExecutionCard(tc, project, isReadOnly) {
    const isPass = tc.lastResult === "Passed" || tc.lastResult === "Pass";
    const isFail = tc.lastResult === "Failed" || tc.lastResult === "Fail";
    const isBlock = tc.lastResult === "Blocked";
    const isSkip = tc.lastResult === "Skipped";
    const isNotRun = !tc.lastResult || tc.lastResult === "Not Run";

    const steps = Array.isArray(tc.steps) && tc.steps.length > 0 ? tc.steps : [
      { stepNumber: 1, action: "Perform test scenario action", expectedResult: tc.expectedResult || "Expected behavior observed." }
    ];

    const history = store.getTestCaseExecutionHistory ? store.getTestCaseExecutionHistory(tc.id) : [];
    const linkedBug = (store.getIssues ? store.getIssues(project.id) : []).find(i => i.linkedTestCaseId === tc.id || i.key === tc.relatedIssueKey);

    return `
      <div class="bg-white rounded-2xl border ${isFail ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'} p-5 shadow-2xs space-y-4 transition">
        
        <!-- Header Strip -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <span class="px-2 py-0.5 rounded font-mono font-bold text-xs ${isPass ? 'bg-emerald-100 text-emerald-800' : (isFail ? 'bg-rose-100 text-rose-800' : (isBlock ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'))}">
              ${tc.id}
            </span>
            <h3 class="text-sm font-bold text-slate-900">${tc.title}</h3>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
              ${tc.module || 'General'}
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${tc.priority === 'Critical' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}">
              ${tc.priority || 'Medium'}
            </span>
          </div>

          <!-- Current Verdict Chip -->
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${isPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (isFail ? 'bg-rose-50 text-rose-700 border border-rose-200' : (isBlock ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'))}">
              <span class="w-2 h-2 rounded-full ${isPass ? 'bg-emerald-500' : (isFail ? 'bg-rose-500' : (isBlock ? 'bg-amber-500' : 'bg-slate-400'))}"></span>
              ${tc.lastResult || 'Not Run'}
            </span>
          </div>
        </div>

        <!-- Preconditions & Test Data -->
        ${tc.preconditions || tc.testData ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100 text-xs">
            ${tc.preconditions ? `
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Preconditions:</span>
                <span class="text-slate-700 font-medium">${tc.preconditions}</span>
              </div>
            ` : ''}
            ${tc.testData ? `
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Test Data:</span>
                <span class="text-slate-700 font-mono text-[11px]">${tc.testData}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Multi-Row Step-by-Step Verification Table -->
        <div class="space-y-2">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verification Steps:</span>
          <div class="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs">
            ${steps.map((s, idx) => `
              <div class="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-start gap-2.5">
                  <span class="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    ${s.stepNumber || idx + 1}
                  </span>
                  <div>
                    <span class="font-medium text-slate-800">${s.action}</span>
                    <div class="text-[11px] text-slate-500 mt-0.5">
                      <strong class="text-slate-700">Expected:</strong> ${s.expectedResult}
                    </div>
                  </div>
                </div>

                <!-- Step Level Verdict Selector -->
                <div class="flex items-center gap-1 shrink-0 self-end sm:self-center" id="stepButtons_${tc.id}_${idx}">
                  <button type="button" onclick="TestManagementView.setStepVerdict('${tc.id}', ${idx}, 'Pass')" class="px-2 py-1 rounded text-[10px] font-bold border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition cursor-pointer">
                    Pass
                  </button>
                  <button type="button" onclick="TestManagementView.setStepVerdict('${tc.id}', ${idx}, 'Fail')" class="px-2 py-1 rounded text-[10px] font-bold border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition cursor-pointer">
                    Fail
                  </button>
                  <button type="button" onclick="TestManagementView.setStepVerdict('${tc.id}', ${idx}, 'Blocked')" class="px-2 py-1 rounded text-[10px] font-bold border border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition cursor-pointer">
                    Blocked
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Actual Result & QA Notes Inputs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Actual Result:</label>
            <input
              type="text"
              id="actualResult_${tc.id}"
              placeholder="e.g. Verified with 200 OK / Inventory remained unchanged..."
              class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16]"
            />
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">QA Comments / Notes:</label>
            <input
              type="text"
              id="qaNotes_${tc.id}"
              placeholder="Optional execution observations..."
              class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16]"
            />
          </div>
        </div>

        <!-- Execution Verdict Action Bar -->
        <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          <!-- Quick Status Verdict Buttons -->
          <div class="flex items-center gap-1.5">
            <button onclick="TestManagementView.executeCase('${tc.id}', 'Passed')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-2xs flex items-center gap-1 cursor-pointer">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> Pass
            </button>
            <button onclick="TestManagementView.executeCase('${tc.id}', 'Failed')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-2xs flex items-center gap-1 cursor-pointer">
              <i data-lucide="x" class="w-3.5 h-3.5"></i> Fail
            </button>
            <button onclick="TestManagementView.executeCase('${tc.id}', 'Blocked')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition shadow-2xs flex items-center gap-1 cursor-pointer">
              <i data-lucide="slash" class="w-3.5 h-3.5"></i> Block
            </button>
            <button onclick="TestManagementView.executeCase('${tc.id}', 'Skipped')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer">
              Skip
            </button>
          </div>

          <!-- Failed Test -> Create Bug or Retest Links -->
          <div class="flex items-center gap-2">
            ${isFail ? `
              ${!linkedBug ? `
                <button onclick="TestManagementView.openCreateBugModal('${tc.id}')" class="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer animate-bounce-subtle">
                  <i data-lucide="bug" class="w-3.5 h-3.5"></i>
                  <span>Create Bug in Issues & Defects</span>
                </button>
              ` : `
                <div class="flex items-center gap-1.5">
                  <span onclick="window.app.navigate('bugs')" class="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer hover:bg-rose-100">
                    Defect: ${linkedBug.key} (${linkedBug.status})
                  </span>
                  ${linkedBug.status === 'Ready for QA' || linkedBug.status === 'Done' ? `
                    <button onclick="TestManagementView.openRetestModal('${tc.id}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer">
                      <i data-lucide="refresh-cw" class="w-3 h-3"></i> Retest
                    </button>
                  ` : ''}
                </div>
              `}
            ` : linkedBug ? `
              <span onclick="window.app.navigate('bugs')" class="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer hover:bg-slate-200">
                Linked Bug: ${linkedBug.key} (${linkedBug.status})
              </span>
            ` : ''}

            <!-- Execution History Count Pill -->
            ${history.length > 0 ? `
              <button onclick="TestManagementView.openCaseDrawer('${tc.id}')" class="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer">
                <i data-lucide="history" class="w-3.5 h-3.5"></i>
                <span>${history.length} runs</span>
              </button>
            ` : ''}
          </div>

        </div>

      </div>
    `;
  },

  // =========================================================================
  // MODALS: CREATE & EDIT TEST CASE (With Dynamic Multi-Row Steps)
  // =========================================================================
  openCreateCaseModal(existingCaseId = null) {
    const activeProject = store.getActiveProject() || {};
    const existing = existingCaseId ? store.getTestCaseById(existingCaseId) : null;
    const users = store.getUsers ? store.getUsers() : [];

    const defaultSteps = existing && existing.steps && existing.steps.length > 0 ? existing.steps : [
      { stepNumber: 1, action: "", expectedResult: "" }
    ];

    const modalHtml = `
      <div id="createCaseModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div class="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 class="text-base font-bold text-slate-900">
                ${existing ? `Edit Test Case (${existing.id})` : 'Create Reusable Test Case'}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Define scenario metadata, preconditions, and multi-step verification procedures.</p>
            </div>
            <button onclick="TestManagementView.closeModal()" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Body Form -->
          <div class="p-6 overflow-y-auto space-y-4 text-xs flex-1">
            
            <!-- Title -->
            <div>
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Test Case Title *</label>
              <input
                type="text"
                id="tcFormTitle"
                value="${existing ? existing.title : ''}"
                placeholder="e.g. Verify inventory updates after partial return"
                class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]"
              />
            </div>

            <!-- Row 1: Module & Test Type & Priority -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Module / Feature *</label>
                <input
                  type="text"
                  id="tcFormModule"
                  value="${existing ? (existing.module || 'General') : 'Authentication'}"
                  placeholder="e.g. Orders, Payments, Auth"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16]"
                />
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Test Type</label>
                <select id="tcFormType" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16] cursor-pointer">
                  <option value="Functional" ${existing && existing.testType === 'Functional' ? 'selected' : ''}>Functional</option>
                  <option value="Smoke" ${existing && existing.testType === 'Smoke' ? 'selected' : ''}>Smoke</option>
                  <option value="Sanity" ${existing && existing.testType === 'Sanity' ? 'selected' : ''}>Sanity</option>
                  <option value="Regression" ${existing && existing.testType === 'Regression' ? 'selected' : ''}>Regression</option>
                  <option value="Integration" ${existing && existing.testType === 'Integration' ? 'selected' : ''}>Integration</option>
                  <option value="UAT" ${existing && existing.testType === 'UAT' ? 'selected' : ''}>UAT</option>
                  <option value="E2E" ${existing && existing.testType === 'E2E' ? 'selected' : ''}>E2E</option>
                  <option value="Exploratory" ${existing && existing.testType === 'Exploratory' ? 'selected' : ''}>Exploratory</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Priority</label>
                <select id="tcFormPriority" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16] cursor-pointer">
                  <option value="Critical" ${existing && existing.priority === 'Critical' ? 'selected' : ''}>Critical (P0)</option>
                  <option value="High" ${existing && existing.priority === 'High' ? 'selected' : 'selected'}>High (P1)</option>
                  <option value="Medium" ${existing && existing.priority === 'Medium' ? 'selected' : ''}>Medium (P2)</option>
                  <option value="Low" ${existing && existing.priority === 'Low' ? 'selected' : ''}>Low (P3)</option>
                </select>
              </div>
            </div>

            <!-- Row 2: Status, Assigned QA, Environment -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                <select id="tcFormStatus" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16] cursor-pointer">
                  <option value="Active" ${existing && existing.status === 'Active' ? 'selected' : ''}>Active</option>
                  <option value="Draft" ${existing && existing.status === 'Draft' ? 'selected' : ''}>Draft</option>
                  <option value="Archived" ${existing && existing.status === 'Archived' ? 'selected' : ''}>Archived</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Assigned QA</label>
                <select id="tcFormAssignee" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16] cursor-pointer">
                  ${users.map(u => `<option value="${u.name}" ${existing && (existing.assignedQA === u.name || existing.assigned_to === u.name) ? 'selected' : ''}>${u.name} (${u.role})</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Environment</label>
                <input
                  type="text"
                  id="tcFormEnv"
                  value="${existing ? (existing.environment || 'Staging') : 'Staging'}"
                  placeholder="Staging, QA, Production"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16]"
                />
              </div>
            </div>

            <!-- Preconditions & Test Data -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Preconditions</label>
                <textarea
                  id="tcFormPreconditions"
                  rows="2"
                  placeholder="e.g. Valid test account authenticated, inventory initial stock = 10"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16]"
                >${existing ? (existing.preconditions || '') : ''}</textarea>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Test Data & Parameters</label>
                <textarea
                  id="tcFormTestData"
                  rows="2"
                  placeholder="e.g. SKU: ITEM-101, ReturnQty: 1, OrderID: ORD-9921"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16]"
                >${existing ? (existing.testData || '') : ''}</textarea>
              </div>
            </div>

            <!-- Tags & Overall Expected Result -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  id="tcFormTags"
                  value="${existing && Array.isArray(existing.tags) ? existing.tags.join(', ') : 'Regression, Core'}"
                  placeholder="Regression, Smoke, Orders"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16]"
                />
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Overall Expected Result</label>
                <input
                  type="text"
                  id="tcFormExpectedResult"
                  value="${existing ? (existing.expectedResult || '') : 'Operation succeeds cleanly with proper data persistence.'}"
                  placeholder="e.g. Inventory count increments by 1"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16]"
                />
              </div>
            </div>

            <!-- Dynamic Multi-Row Test Steps Editor -->
            <div class="pt-3 border-t border-slate-200 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-slate-900 block">Test Steps Procedure</span>
                  <span class="text-[11px] text-slate-500">Define discrete steps with explicit user actions and expected results.</span>
                </div>
                <button type="button" onclick="TestManagementView.addStepRow()" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Step
                </button>
              </div>

              <!-- Steps List Container -->
              <div id="stepsRowsContainer" class="space-y-2.5">
                ${defaultSteps.map((s, idx) => `
                  <div class="step-row flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200" data-index="${idx}">
                    <span class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-1">
                      ${idx + 1}
                    </span>
                    <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          class="step-action w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                          placeholder="Action (e.g. Create an order with item SKU-1)"
                          value="${s.action || ''}"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          class="step-expected w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                          placeholder="Expected Result (e.g. Order created successfully)"
                          value="${s.expectedResult || ''}"
                        />
                      </div>
                    </div>
                    <button type="button" onclick="TestManagementView.removeStepRow(this)" class="w-7 h-7 text-slate-400 hover:text-rose-600 rounded-lg flex items-center justify-center transition cursor-pointer mt-0.5">
                      <i data-lucide="trash" class="w-4 h-4"></i>
                    </button>
                  </div>
                `).join("")}
              </div>
            </div>

          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50/50">
            <button onclick="TestManagementView.closeModal()" class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition cursor-pointer">
              Cancel
            </button>
            <button onclick="TestManagementView.saveCaseForm('${existing ? existing.id : ''}')" class="px-5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl text-xs transition shadow-xs cursor-pointer">
              ${existing ? 'Update Test Case' : 'Save Test Case'}
            </button>
          </div>

        </div>
      </div>
    `;

    document.getElementById("tmModalContainer").innerHTML = modalHtml;
    if (window.lucide) window.lucide.createIcons();
  },

  addStepRow() {
    const container = document.getElementById("stepsRowsContainer");
    if (!container) return;
    const currentCount = container.querySelectorAll(".step-row").length;
    const newIdx = currentCount + 1;

    const row = document.createElement("div");
    row.className = "step-row flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200";
    row.setAttribute("data-index", currentCount);
    row.innerHTML = `
      <span class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-1">
        ${newIdx}
      </span>
      <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <input
            type="text"
            class="step-action w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
            placeholder="Action (e.g. Return one item)"
          />
        </div>
        <div>
          <input
            type="text"
            class="step-expected w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
            placeholder="Expected Result (e.g. Return invoice issued)"
          />
        </div>
      </div>
      <button type="button" onclick="TestManagementView.removeStepRow(this)" class="w-7 h-7 text-slate-400 hover:text-rose-600 rounded-lg flex items-center justify-center transition cursor-pointer mt-0.5">
        <i data-lucide="trash" class="w-4 h-4"></i>
      </button>
    `;
    container.appendChild(row);
    if (window.lucide) window.lucide.createIcons();
  },

  removeStepRow(btn) {
    const row = btn.closest(".step-row");
    const container = document.getElementById("stepsRowsContainer");
    if (container && container.querySelectorAll(".step-row").length > 1) {
      row.remove();
      // Re-index step numbers
      container.querySelectorAll(".step-row").forEach((r, i) => {
        r.querySelector("span").textContent = i + 1;
      });
    } else {
      if (window.app && window.app.toast) window.app.toast("Notice", "Test cases must have at least 1 step.", "info");
    }
  },

  saveCaseForm(existingId = null) {
    const title = document.getElementById("tcFormTitle")?.value.trim();
    if (!title) {
      if (window.app && window.app.toast) window.app.toast("Validation", "Please enter a test case title.", "error");
      return;
    }

    const moduleVal = document.getElementById("tcFormModule")?.value.trim() || "General";
    const testType = document.getElementById("tcFormType")?.value || "Functional";
    const priority = document.getElementById("tcFormPriority")?.value || "High";
    const status = document.getElementById("tcFormStatus")?.value || "Active";
    const assignedQA = document.getElementById("tcFormAssignee")?.value || "QA Lead";
    const environment = document.getElementById("tcFormEnv")?.value.trim() || "Staging";
    const preconditions = document.getElementById("tcFormPreconditions")?.value.trim() || "";
    const testData = document.getElementById("tcFormTestData")?.value.trim() || "";
    const expectedResult = document.getElementById("tcFormExpectedResult")?.value.trim() || "Operation completes successfully.";
    const tagsStr = document.getElementById("tcFormTags")?.value || "Regression";
    const tags = tagsStr.split(",").map(t => t.trim()).filter(Boolean);

    // Extract dynamic steps
    const stepRows = document.querySelectorAll("#stepsRowsContainer .step-row");
    const steps = [];
    stepRows.forEach((r, idx) => {
      const action = r.querySelector(".step-action")?.value.trim() || `Step ${idx + 1} action`;
      const expected = r.querySelector(".step-expected")?.value.trim() || expectedResult;
      steps.push({ stepNumber: idx + 1, action, expectedResult: expected });
    });

    const activeProject = store.getActiveProject() || {};

    const caseData = {
      title,
      module: moduleVal,
      feature: moduleVal,
      testType,
      type: testType,
      priority,
      status,
      assignedQA,
      assigned_to: assignedQA,
      environment,
      preconditions,
      testData,
      test_data: testData,
      expectedResult,
      expected_result: expectedResult,
      tags,
      steps,
      projectId: activeProject.id
    };

    if (existingId) {
      store.updateTestCase(existingId, caseData);
      if (window.app && window.app.toast) window.app.toast("Success", `Test Case ${existingId} updated.`, "success");
    } else {
      const created = store.createTestCase(caseData);
      if (window.app && window.app.toast) window.app.toast("Success", `Test Case ${created.id} created successfully.`, "success");
    }

    this.closeModal();
    this.render(document.getElementById("mainContent") || document.querySelector("main"));
  },

  // =========================================================================
  // SLIDE-OVER DRAWER: TEST CASE DETAILS & FULL EXECUTION HISTORY
  // =========================================================================
  openCaseDrawer(caseId) {
    const tc = store.getTestCaseById(caseId);
    if (!tc) return;

    const history = store.getTestCaseExecutionHistory ? store.getTestCaseExecutionHistory(tc.id) : [];
    const activeProject = store.getActiveProject() || {};
    const linkedBug = (store.getIssues ? store.getIssues(activeProject.id) : []).find(i => i.linkedTestCaseId === tc.id || i.key === tc.relatedIssueKey);
    const steps = Array.isArray(tc.steps) ? tc.steps : [];

    const drawerHtml = `
      <div id="caseDetailDrawer" class="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-2xs animate-fade-in">
        <div class="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-slate-200">
          
          <!-- Top Drawer Header -->
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-900 text-[#bef264] border border-slate-800">
                ${tc.id}
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                ${tc.module || 'General'}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button onclick="TestManagementView.openCreateCaseModal('${tc.id}')" class="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer">
                <i data-lucide="edit-3" class="w-4 h-4"></i> Edit
              </button>
              <button onclick="TestManagementView.closeDrawer()" class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Drawer Body Details -->
          <div class="p-6 overflow-y-auto space-y-5 text-xs flex-1">
            
            <!-- Title & Status -->
            <div>
              <h2 class="text-base font-bold text-slate-900">${tc.title}</h2>
              <div class="flex items-center gap-2 mt-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${tc.lastResult === 'Passed' ? 'bg-emerald-50 text-emerald-700' : (tc.lastResult === 'Failed' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600')}">
                  Last Result: ${tc.lastResult || 'Not Run'}
                </span>
                <span class="text-slate-400">&bull;</span>
                <span class="text-slate-500">Priority: <strong>${tc.priority || 'Medium'}</strong></span>
                <span class="text-slate-400">&bull;</span>
                <span class="text-slate-500">Type: <strong>${tc.testType || tc.type || 'Functional'}</strong></span>
              </div>
            </div>

            <!-- Key Metadata Grid -->
            <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned QA</span>
                <span class="text-slate-800 font-semibold">${tc.assignedQA || tc.assigned_to || 'QA Lead'}</span>
              </div>
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Environment</span>
                <span class="text-slate-800 font-semibold">${tc.environment || 'Staging'}</span>
              </div>
              ${tc.preconditions ? `
                <div class="col-span-2">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Preconditions</span>
                  <span class="text-slate-700 font-medium">${tc.preconditions}</span>
                </div>
              ` : ''}
              ${tc.testData ? `
                <div class="col-span-2">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Test Data</span>
                  <span class="text-slate-700 font-mono text-[11px]">${tc.testData}</span>
                </div>
              ` : ''}
            </div>

            <!-- Steps Procedure -->
            <div class="space-y-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Test Procedure Steps (${steps.length})</span>
              <div class="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                ${steps.map((s, idx) => `
                  <div class="p-3 bg-white space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-[10px] text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">Step ${s.stepNumber || idx + 1}</span>
                      <span class="font-medium text-slate-800">${s.action}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 pl-6">
                      <strong>Expected:</strong> ${s.expectedResult}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <!-- Linked Bug Status -->
            ${linkedBug ? `
              <div class="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i data-lucide="bug" class="w-4 h-4 text-rose-600"></i>
                    <span class="font-mono font-bold text-rose-700 text-xs">${linkedBug.key}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-rose-700 border border-rose-200">${linkedBug.status}</span>
                  </div>
                  <button onclick="window.app.navigate('bugs')" class="text-xs font-bold text-rose-700 hover:underline">
                    View Bug &rarr;
                  </button>
                </div>
                <p class="text-xs text-slate-700 font-medium">${linkedBug.title}</p>
                ${linkedBug.status === 'Ready for QA' || linkedBug.status === 'Done' ? `
                  <div class="pt-2 border-t border-rose-200 flex items-center justify-between">
                    <span class="text-[11px] text-emerald-700 font-bold">Developer marked ready for retest!</span>
                    <button onclick="TestManagementView.openRetestModal('${tc.id}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer">
                      Retest Now
                    </button>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Immutable Execution History Timeline -->
            <div class="space-y-3 pt-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Execution History (${history.length} runs)</span>
              
              ${history.length === 0 ? `
                <div class="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No previous runs recorded. Execute this case in Test Execution to record history.
                </div>
              ` : `
                <div class="space-y-2">
                  ${history.map((h, i) => `
                    <div class="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${h.status === 'Passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                            ${h.runType || `Run ${history.length - i}`} &bull; ${h.status}
                          </span>
                          <span class="text-[10px] text-slate-400">${h.executionDate || 'Recent'}</span>
                        </div>
                        <span class="text-[10px] text-slate-500 font-medium">by ${h.executedBy || 'QA'}</span>
                      </div>
                      ${h.actualResult ? `
                        <div class="text-[11px] text-slate-600">
                          <strong>Outcome:</strong> ${h.actualResult}
                        </div>
                      ` : ''}
                      ${h.linkedDefectKey ? `
                        <span class="inline-block font-mono text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          Defect: ${h.linkedDefectKey}
                        </span>
                      ` : ''}
                    </div>
                  `).join("")}
                </div>
              `}
            </div>

          </div>

          <!-- Bottom Drawer Actions -->
          <div class="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <button onclick="TestManagementView.quickExecuteModal('${tc.id}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="play" class="w-3.5 h-3.5"></i>
              <span>Execute Case</span>
            </button>
            <button onclick="TestManagementView.closeDrawer()" class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition cursor-pointer">
              Close
            </button>
          </div>

        </div>
      </div>
    `;

    document.getElementById("tmModalContainer").innerHTML = drawerHtml;
    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================================
  // MODAL: CREATE BUG FROM FAILED TEST CASE
  // =========================================================================
  openCreateBugModal(testCaseId) {
    const tc = store.getTestCaseById(testCaseId);
    if (!tc) return;

    const activeProject = store.getActiveProject() || {};
    const developers = (store.getUsers ? store.getUsers() : []).filter(u => u.role === "Developer" || u.role === "DEVELOPER" || u.role === "QA Engineer");

    const modalHtml = `
      <div id="createBugModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div class="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-rose-200 flex flex-col overflow-hidden">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                <i data-lucide="bug" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">Create Defect from Failed Test</h3>
                <p class="text-[11px] text-slate-500">Auto-links to ${tc.id} and populates Issues & Defects board</p>
              </div>
            </div>
            <button onclick="TestManagementView.closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Body Form -->
          <div class="p-6 space-y-3.5 text-xs">
            
            <!-- Bug Title -->
            <div>
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Bug Title *</label>
              <input
                type="text"
                id="bugFormTitle"
                value="[${tc.id}] ${tc.title} — Step execution failure"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <!-- Priority & Severity & Developer Assignee -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Severity / Priority</label>
                <select id="bugFormPriority" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-rose-500 cursor-pointer">
                  <option value="Critical" ${tc.priority === 'Critical' ? 'selected' : ''}>Critical (Blocker)</option>
                  <option value="High" ${tc.priority === 'High' ? 'selected' : ''}>High</option>
                  <option value="Medium" ${tc.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Assign Developer</label>
                <select id="bugFormDev" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-rose-500 cursor-pointer">
                  ${developers.map(d => `<option value="${d.id}">${d.name} (${d.role})</option>`).join("")}
                </select>
              </div>
            </div>

            <!-- Expected vs Actual Result -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Expected Result</label>
                <textarea id="bugFormExpected" rows="2" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">${tc.expectedResult || 'Operation completes successfully.'}</textarea>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Observed Actual Result *</label>
                <textarea id="bugFormActual" rows="2" placeholder="Describe actual failure..." class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">${document.getElementById(`actualResult_${tc.id}`)?.value || 'Validation deviation or exception observed.'}</textarea>
              </div>
            </div>

            <!-- Context Info -->
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span>Environment: <strong>${tc.environment || activeProject.environment || 'Staging'}</strong></span>
              <span>Release: <strong>${activeProject.release_version || 'v1.0.0'}</strong></span>
            </div>

          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50/50">
            <button onclick="TestManagementView.closeModal()" class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition cursor-pointer">
              Cancel
            </button>
            <button onclick="TestManagementView.submitBugForm('${tc.id}')" class="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-2xs cursor-pointer">
              Create & Link Defect
            </button>
          </div>

        </div>
      </div>
    `;

    document.getElementById("tmModalContainer").innerHTML = modalHtml;
    if (window.lucide) window.lucide.createIcons();
  },

  submitBugForm(testCaseId) {
    const title = document.getElementById("bugFormTitle")?.value.trim();
    const priority = document.getElementById("bugFormPriority")?.value || "High";
    const developerId = document.getElementById("bugFormDev")?.value || null;
    const actualResult = document.getElementById("bugFormActual")?.value.trim() || "Defect observed during execution.";

    if (!title) {
      if (window.app && window.app.toast) window.app.toast("Validation", "Please enter a bug title.", "error");
      return;
    }

    const bug = store.createBugFromFailedTest(testCaseId, {
      title,
      priority,
      developerId,
      actualResult
    });

    if (window.app && window.app.toast) {
      window.app.toast("Defect Logged", `Created ${bug.key} in Issues & Defects and linked to ${testCaseId}.`, "success");
    }

    this.closeModal();
    this.render(document.getElementById("mainContent") || document.querySelector("main"));
  },

  // =========================================================================
  // MODAL: RETEST CASE
  // =========================================================================
  openRetestModal(testCaseId) {
    const tc = store.getTestCaseById(testCaseId);
    if (!tc) return;

    const modalHtml = `
      <div id="retestModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2">
              <i data-lucide="refresh-cw" class="w-4 h-4 text-emerald-600"></i>
              <h3 class="text-sm font-bold text-slate-900">Retest Defect Resolution</h3>
            </div>
            <button onclick="TestManagementView.closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="p-6 space-y-3.5 text-xs">
            <p class="text-slate-600">
              Retesting <strong>${tc.id}</strong> (Linked Defect: <strong>${tc.relatedIssueKey || 'BUG'}</strong>). Previous result was <strong>FAILED</strong>.
            </p>

            <div>
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Retest Verdict *</label>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" onclick="TestManagementView.submitRetest('${tc.id}', 'Passed')" class="p-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 transition cursor-pointer text-center">
                  ✓ PASSED (Defect Fixed)
                </button>
                <button type="button" onclick="TestManagementView.submitRetest('${tc.id}', 'Failed')" class="p-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 font-bold hover:bg-rose-100 transition cursor-pointer text-center">
                  ✗ FAILED (Still Reproducing)
                </button>
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Retest Verification Notes</label>
              <textarea id="retestNotes" rows="2" placeholder="e.g. Verified on build b102. Inventory increments correctly." class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"></textarea>
            </div>
          </div>

          <div class="px-6 py-3 border-t border-slate-100 flex justify-end">
            <button onclick="TestManagementView.closeModal()" class="px-4 py-1.5 bg-white text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 cursor-pointer">
              Cancel
            </button>
          </div>

        </div>
      </div>
    `;

    document.getElementById("tmModalContainer").innerHTML = modalHtml;
    if (window.lucide) window.lucide.createIcons();
  },

  submitRetest(testCaseId, verdict) {
    const notes = document.getElementById("retestNotes")?.value.trim() || "";
    const tc = store.getTestCaseById(testCaseId);
    
    if (store.retestTestCase) {
      store.retestTestCase(testCaseId, verdict, verdict === "Passed" ? "Retest passed: Defect resolved." : "Retest failed: Defect continues to reproduce.", notes);
    } else {
      store.executeTestCase(testCaseId, verdict, verdict === "Passed" ? "Retest passed." : "Retest failed.", notes);
    }

    if (window.app && window.app.toast) {
      window.app.toast("Retest Logged", `${tc ? tc.id : 'Test'} retest verdict: ${verdict}. Execution history updated.`, "success");
    }

    this.closeModal();
    this.render(document.getElementById("mainContent") || document.querySelector("main"));
  },

  // =========================================================================
  // MODAL: START NEW TESTING CYCLE
  // =========================================================================
  openStartCycleModal() {
    const activeProject = store.getActiveProject() || {};
    const testCases = store.getTestCases(activeProject.id);

    const modalHtml = `
      <div id="startCycleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2">
              <i data-lucide="play-circle" class="w-4 h-4 text-emerald-600"></i>
              <h3 class="text-sm font-bold text-slate-900">Start Testing Cycle</h3>
            </div>
            <button onclick="TestManagementView.closeModal()" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="p-6 space-y-3.5 text-xs">
            <div>
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cycle Name *</label>
              <input type="text" id="cycleFormName" value="Regression Testing — Release ${activeProject.release_version || 'v1.0.0'}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Release</label>
                <input type="text" id="cycleFormRelease" value="${activeProject.release_version || 'v1.0.0'}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Environment</label>
                <select id="cycleFormEnv" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer">
                  <option value="Staging">Staging</option>
                  <option value="QA-Env">QA-Env</option>
                  <option value="Production">Production</option>
                  <option value="Dev">Dev</option>
                </select>
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Test Scope (${testCases.length} available)</label>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label class="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input type="radio" name="cycleScope" value="all" checked />
                  <span>All Active Test Cases (${testCases.length} cases)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input type="radio" name="cycleScope" value="failed_untested" />
                  <span>Untested & Previously Failed Cases Only</span>
                </label>
              </div>
            </div>
          </div>

          <div class="px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50/50">
            <button onclick="TestManagementView.closeModal()" class="px-4 py-2 bg-white text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 cursor-pointer">
              Cancel
            </button>
            <button onclick="TestManagementView.submitStartCycle()" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-2xs cursor-pointer">
              Launch Cycle
            </button>
          </div>

        </div>
      </div>
    `;

    document.getElementById("tmModalContainer").innerHTML = modalHtml;
    if (window.lucide) window.lucide.createIcons();
  },

  submitStartCycle() {
    const name = document.getElementById("cycleFormName")?.value.trim();
    const release = document.getElementById("cycleFormRelease")?.value.trim();
    const environment = document.getElementById("cycleFormEnv")?.value;
    const activeProject = store.getActiveProject() || {};

    store.saveTestCycle({
      name,
      release,
      environment,
      projectId: activeProject.id,
      status: "Active"
    });

    if (window.app && window.app.toast) {
      window.app.toast("Cycle Started", `Active testing cycle "${name}" launched.`, "success");
    }

    this.closeModal();
    this.switchTab("execution");
  },

  // Quick Execute Modal for Single Test Case
  quickExecuteModal(testCaseId) {
    this.switchTab("execution");
    // Scroll to test case card if available
    setTimeout(() => {
      const el = document.getElementById(`actualResult_${testCaseId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  },

  // =========================================================================
  // ACTIONS & HANDLERS
  // =========================================================================
  switchTab(tabName) {
    this.activeTab = tabName;
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  setFilter(filterKey, value) {
    this[filterKey] = value;
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  handleSearch(query) {
    this.searchQuery = query;
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  resetFilters() {
    this.searchQuery = "";
    this.selectedModule = "all";
    this.selectedType = "all";
    this.selectedPriority = "all";
    this.selectedStatus = "all";
    this.selectedResult = "all";
    this.selectedAssignee = "all";
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  toggleGrouping() {
    this.groupByModule = !this.groupByModule;
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  setExecutionFilter(filter) {
    this.executionFilter = filter;
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  setExecutionModuleFilter(mod) {
    this.executionModuleFilter = mod;
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  handleProjectChange(projectId) {
    store.setActiveProject(projectId);
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  setStepVerdict(testCaseId, stepIdx, verdict) {
    const parent = document.getElementById(`stepButtons_${testCaseId}_${stepIdx}`);
    if (parent) {
      parent.querySelectorAll("button").forEach(b => {
        b.className = "px-2 py-1 rounded text-[10px] font-bold border border-slate-200 transition cursor-pointer";
      });
      const btns = parent.querySelectorAll("button");
      if (verdict === "Pass" && btns[0]) btns[0].className = "px-2 py-1 rounded text-[10px] font-bold bg-emerald-600 text-white border-emerald-600";
      if (verdict === "Fail" && btns[1]) btns[1].className = "px-2 py-1 rounded text-[10px] font-bold bg-rose-600 text-white border-rose-600";
      if (verdict === "Blocked" && btns[2]) btns[2].className = "px-2 py-1 rounded text-[10px] font-bold bg-amber-500 text-white border-amber-500";
    }
  },

  executeCase(testCaseId, verdict) {
    const actualResult = document.getElementById(`actualResult_${testCaseId}`)?.value.trim() || "";
    const qaNotes = document.getElementById(`qaNotes_${testCaseId}`)?.value.trim() || "";
    
    store.executeTestCase(testCaseId, verdict, actualResult, qaNotes);

    if (window.app && window.app.toast) {
      window.app.toast("Execution Recorded", `${testCaseId} marked as ${verdict}.`, "success");
    }

    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  duplicateCase(caseId) {
    const cloned = store.duplicateTestCase(caseId);
    if (cloned && window.app && window.app.toast) {
      window.app.toast("Duplicated", `Cloned test case as ${cloned.id}.`, "success");
    }
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  deleteCase(caseId) {
    if (confirm(`Are you sure you want to delete test case ${caseId}?`)) {
      store.deleteTestCase(caseId);
      if (window.app && window.app.toast) window.app.toast("Deleted", `Test case ${caseId} deleted.`, "info");
      const container = document.getElementById("mainContent") || document.querySelector("main");
      if (container) this.render(container);
    }
  },

  closeModal() {
    const container = document.getElementById("tmModalContainer");
    if (container) container.innerHTML = "";
  },

  closeDrawer() {
    this.closeModal();
  }
};

if (typeof window !== 'undefined') window.TestManagementView = TestManagementView;
if (typeof global !== 'undefined') global.TestManagementView = TestManagementView;
if (typeof module !== 'undefined' && module.exports) module.exports = TestManagementView;
