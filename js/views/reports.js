/**
 * PulseWave QA Platform — Analytics, Quality Gates & Velocity Telemetry
 * Real-time test execution metrics, defect turnaround, sprint velocity, and live release audit.
 * 100% real data calculation with zero hardcoded dummy values.
 */

const ReportsView = {
  activeProjectFilter: "all",

  render(container) {
    if (!container) container = document.getElementById("mainContent");
    if (!container) return;

    const activeProject = this.activeProjectFilter === "all" ? store.getActiveProject() : store.getProjectById(this.activeProjectFilter);
    const projects = store.getProjects ? store.getProjects() : [];
    const allIssues = store.getIssues ? store.getIssues(this.activeProjectFilter === "all" ? (activeProject ? activeProject.id : null) : this.activeProjectFilter) : [];
    const bugs = allIssues.filter(i => (i.type || "").toLowerCase() === "bug");
    const sprints = store.getSprints ? store.getSprints(activeProject ? activeProject.id : null) : [];
    const activeSprint = store.getActiveSprint ? store.getActiveSprint(activeProject ? activeProject.id : null) : (sprints[0] || null);
    const tmStats = store.getTestManagementStats ? store.getTestManagementStats(activeProject ? activeProject.id : null) : { totalCases: 0, passed: 0, failed: 0, blocked: 0, passRate: 100 };

    const bugsByPriority = {
      critical: bugs.filter(b => b.priority === "Critical" && b.status !== "Done" && b.status !== "Closed").length,
      high: bugs.filter(b => b.priority === "High" && b.status !== "Done" && b.status !== "Closed").length,
      medium: bugs.filter(b => b.priority === "Medium" && b.status !== "Done" && b.status !== "Closed").length,
      low: bugs.filter(b => b.priority === "Low" && b.status !== "Done" && b.status !== "Closed").length
    };

    const qaPassed = allIssues.filter(i => i.qaStatus === "Passed" || i.status === "Done" || i.status === "Closed").length;
    const qaTesting = allIssues.filter(i => i.status === "QA Testing" || i.status === "QA" || i.qaStatus === "Testing").length;
    const qaReady = allIssues.filter(i => i.status === "Ready for QA" || i.status === "Fixed" || i.qaStatus === "Ready for QA").length;
    const inDev = allIssues.filter(i => i.status === "In Progress" || i.status === "Todo" || i.status === "Backlog").length;
    const reopenedBugs = bugs.filter(b => (b.reopenCount || 0) > 0);

    const totalIssues = allIssues.length || 0;
    const passRate = totalIssues > 0 ? Math.round((qaPassed / totalIssues) * 100) : 100;

    // Calculate Real Quality Gate Score & Decision
    const blockerCount = bugsByPriority.critical;
    const effectiveTestPassRate = tmStats.totalCases > 0 ? tmStats.passRate : passRate;
    const qualityScore = Math.max(0, Math.min(100, Math.round(effectiveTestPassRate - (blockerCount * 25) - (bugsByPriority.high * 5))));
    
    let qualityVerdict = "READY FOR RELEASE";
    let qualityBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
    let qualityGrade = "Grade A+ (Production Certified)";

    if (blockerCount > 0 || qualityScore < 70) {
      qualityVerdict = "BLOCKED";
      qualityBadgeClass = "bg-rose-100 text-rose-800 border-rose-300";
      qualityGrade = "Grade C (Critical Blockers Active)";
    } else if (bugsByPriority.high > 0 || qualityScore < 90) {
      qualityVerdict = "READY WITH KNOWN ISSUES";
      qualityBadgeClass = "bg-amber-100 text-amber-800 border-amber-300";
      qualityGrade = "Grade B (Minor Issues Pending)";
    }

    const targetReleaseName = activeProject ? (activeProject.currentRelease || activeProject.name) : "All Projects";

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-12 text-xs">
        
        <!-- 1. Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h1 class="text-xl font-bold text-slate-900 tracking-tight">Analytics & Quality Gate Velocity</h1>
              <span class="px-2 py-0.5 rounded-full bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] font-extrabold text-[10px] uppercase">Live QA Telemetry</span>
            </div>
            <p class="text-slate-500 text-xs">Test execution metrics, defect turnaround, sprint velocity, and live release quality gates.</p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Project Filter Dropdown -->
            <select onchange="ReportsView.setProjectFilter(this.value)" class="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] cursor-pointer">
              <option value="all" ${this.activeProjectFilter === 'all' ? 'selected' : ''}>All Projects (${projects.length})</option>
              ${projects.map(p => `<option value="${p.id}" ${this.activeProjectFilter === p.id ? 'selected' : ''}>${p.name} [${p.key || 'PRJ'}]</option>`).join("")}
            </select>

            <button onclick="window.app.navigate('test-reports')" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 border border-[#bef264] rounded-xl font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="file-check-2" class="w-4 h-4 text-slate-950"></i>
              <span>Generate QA Report</span>
            </button>

            <button onclick="window.print()" class="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="printer" class="w-4 h-4 text-slate-500"></i>
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>

        <!-- 2. Top Executive QA Quality KPI Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Total Work Items</span>
            <div class="text-2xl font-bold text-slate-900 mt-1">${totalIssues}</div>
            <span class="text-[10px] text-slate-500 font-medium">Stories, Tasks, Bugs</span>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] uppercase font-bold text-emerald-600 block">QA Passed & Verified</span>
            <div class="text-2xl font-bold text-emerald-600 mt-1">${qaPassed}</div>
            <span class="text-[10px] text-emerald-700 font-bold">${passRate}% Pass Rate</span>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] uppercase font-bold text-purple-600 block">Ready for Testing</span>
            <div class="text-2xl font-bold text-purple-700 mt-1">${qaReady}</div>
            <span class="text-[10px] text-slate-500 font-medium">In QA Queue</span>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] uppercase font-bold text-indigo-600 block">Under Testing</span>
            <div class="text-2xl font-bold text-indigo-700 mt-1">${qaTesting}</div>
            <span class="text-[10px] text-slate-500 font-medium">Active test cycles</span>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] uppercase font-bold text-red-600 block">Failed / Reopened</span>
            <div class="text-2xl font-bold text-red-600 mt-1">${reopenedBugs.length}</div>
            <span class="text-[10px] text-red-700 font-bold">${reopenedBugs.length > 0 ? 'Retest Required' : 'Zero Flaky Bugs'}</span>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] uppercase font-bold text-slate-900 block">Quality Gate Index</span>
            <div class="text-2xl font-bold text-slate-900 mt-1 font-mono">${qualityScore}%</div>
            <span class="text-[10px] font-bold ${qualityScore >= 85 ? 'text-emerald-700' : 'text-amber-700'}">${qualityGrade.split(' ')[0]}</span>
          </div>
        </div>

        <!-- 3. Sprint Health & Release Quality Gate Summary -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Sprint Health Report -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded-lg bg-slate-100 text-slate-900 font-bold">
                  <i data-lucide="activity" class="w-4 h-4"></i>
                </div>
                <div>
                  <h2 class="text-sm font-bold text-slate-900">Sprint Health & Velocity Telemetry</h2>
                  <p class="text-[11px] text-slate-400">Groomed vs QA Verified throughput per sprint</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-slate-900 text-[#bef264] font-bold font-mono text-[10px]">
                ${activeSprint ? `${activeSprint.name || 'Active Sprint'} (${activeSprint.status || 'Active'})` : 'No Active Sprint'}
              </span>
            </div>

            <div class="space-y-3">
              ${sprints.length === 0 ? `
                <div class="p-8 text-center text-slate-400">
                  <i data-lucide="calendar" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
                  <p class="font-bold text-slate-700">No active sprints found</p>
                  <p class="text-[11px] text-slate-400 mt-0.5">Initialize sprints in Backlog & Sprints to track velocity.</p>
                  <button onclick="window.app.navigate('backlog-sprints')" class="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs cursor-pointer">
                    Go to Backlog & Sprints
                  </button>
                </div>
              ` : sprints.slice(0, 4).map(s => {
                const sIssues = allIssues.filter(i => i.sprintId === s.id);
                const sDone = sIssues.filter(i => i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed").length;
                const sPct = sIssues.length > 0 ? Math.round((sDone / sIssues.length) * 100) : (s.status === 'completed' || s.status === 'Completed' ? 100 : 0);

                return `
                  <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full ${s.status === 'active' || s.status === 'Active' ? 'bg-slate-950' : (s.status === 'completed' || s.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-400')}"></span>
                        <strong class="font-bold text-slate-900">${s.name || s.title || 'Sprint'}</strong>
                        <span class="text-slate-400">&bull;</span>
                        <span class="text-slate-500">${s.startDate || s.start_date || 'Start'} &ndash; ${s.endDate || s.end_date || 'End'}</span>
                      </div>
                      <span class="px-2 py-0.5 rounded font-bold text-[10px] ${(s.status === 'active' || s.status === 'Active') ? 'bg-slate-900 text-[#bef264]' : ((s.status === 'completed' || s.status === 'Completed') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700')}">
                        ${(s.status || 'PLANNED').toUpperCase()}
                      </span>
                    </div>

                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>QA Verification Progress</span>
                        <span class="font-mono text-slate-900">${sDone}/${sIssues.length} Verified (${sPct}%)</span>
                      </div>
                      <div class="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full rounded-full ${sPct >= 80 ? 'bg-emerald-500' : 'bg-slate-950'}" style="width: ${sPct}%"></div>
                      </div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Target Release Quality Gate Summary -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold">
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                </div>
                <div>
                  <h2 class="text-sm font-bold text-slate-900">Release Quality Sign-Off Summary</h2>
                  <p class="text-[11px] text-slate-400">Release readiness assessment for <strong>${targetReleaseName}</strong></p>
                </div>
              </div>
              <span class="px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] border ${qualityBadgeClass}">
                ${qualityVerdict}
              </span>
            </div>

            <!-- Release Quality Breakdown -->
            <div class="space-y-3">
              <div class="p-3 rounded-xl ${blockerCount === 0 ? 'bg-emerald-50/60 border border-emerald-200' : 'bg-rose-50/60 border border-rose-200'} flex items-center justify-between">
                <div>
                  <span class="font-bold ${blockerCount === 0 ? 'text-emerald-950' : 'text-rose-950'} block">Critical Defects Policy (P0)</span>
                  <p class="text-[11px] ${blockerCount === 0 ? 'text-emerald-800' : 'text-rose-800'} mt-0.5">
                    ${blockerCount === 0 ? '0 Critical blocker defects remaining' : `${blockerCount} Critical blocker defect(s) unresolved`}
                  </p>
                </div>
                <span class="px-2 py-1 rounded-lg ${blockerCount === 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'} font-bold text-[10px]">
                  ${blockerCount === 0 ? 'PASSED ✓' : 'BLOCKED ✕'}
                </span>
              </div>

              <div class="p-3 rounded-xl bg-slate-900/5 border border-slate-200 flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-950 block">Test Management Coverage</span>
                  <p class="text-[11px] text-slate-600 mt-0.5">
                    ${tmStats.totalCases > 0 ? `${tmStats.totalCases} Total test cases (${tmStats.passed} Passed, ${tmStats.failed} Failed)` : `${qaPassed} Work items verified in QA testing`}
                  </p>
                </div>
                <span class="px-2 py-1 rounded-lg bg-slate-950 text-[#bef264] font-bold text-[10px]">
                  ${effectiveTestPassRate}% PASS
                </span>
              </div>

              <div class="p-3 rounded-xl bg-purple-50/60 border border-purple-200 flex items-center justify-between">
                <div>
                  <span class="font-bold text-purple-950 block">Sprint QA Verification</span>
                  <p class="text-[11px] text-purple-800 mt-0.5">
                    ${qaPassed}/${totalIssues} stories and tasks verified in active sprints
                  </p>
                </div>
                <span class="px-2 py-1 rounded-lg bg-purple-600 text-white font-bold text-[10px]">
                  ${passRate >= 80 ? 'SATISFIED ✓' : 'IN PROGRESS'}
                </span>
              </div>
            </div>
          </div>

        </div>

        <!-- 4. Bug Severity & Reopened Defect Analytics -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Bug Severity Summary -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded-lg bg-red-50 text-red-600 font-bold">
                  <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                </div>
                <div>
                  <h2 class="text-sm font-bold text-slate-900">Defect Severity Distribution</h2>
                  <p class="text-[11px] text-slate-400">Breakdown of bugs by priority and triage status</p>
                </div>
              </div>
              <span class="font-mono font-bold text-slate-700">${bugs.length} Total Defects</span>
            </div>

            <div class="space-y-3.5">
              <!-- Critical -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-red-600">Critical (Blockers)</span>
                  <span class="font-bold text-red-600 font-mono">${bugsByPriority.critical}</span>
                </div>
                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-red-600 rounded-full" style="width: ${bugs.length > 0 ? (bugsByPriority.critical / bugs.length) * 100 : 0}%"></div>
                </div>
              </div>

              <!-- High -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-amber-600">High Severity</span>
                  <span class="font-bold text-amber-600 font-mono">${bugsByPriority.high}</span>
                </div>
                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-500 rounded-full" style="width: ${bugs.length > 0 ? (bugsByPriority.high / bugs.length) * 100 : 0}%"></div>
                </div>
              </div>

              <!-- Medium -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-slate-700">Medium</span>
                  <span class="font-bold text-slate-800 font-mono">${bugsByPriority.medium}</span>
                </div>
                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-slate-700 rounded-full" style="width: ${bugs.length > 0 ? (bugsByPriority.medium / bugs.length) * 100 : 0}%"></div>
                </div>
              </div>

              <!-- Low -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-slate-600">Low</span>
                  <span class="font-bold text-slate-700 font-mono">${bugsByPriority.low}</span>
                </div>
                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-slate-400 rounded-full" style="width: ${bugs.length > 0 ? (bugsByPriority.low / bugs.length) * 100 : 0}%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Reopened Bugs Analytics Panel -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold">
                  <i data-lucide="refresh-ccw" class="w-4 h-4"></i>
                </div>
                <div>
                  <h2 class="text-sm font-bold text-slate-900">Reopened Defects Analytics</h2>
                  <p class="text-[11px] text-slate-400">Defects requiring multiple fix and verification cycles</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                ${reopenedBugs.length} Reopened Defects
              </span>
            </div>

            <div class="space-y-2.5 max-h-56 overflow-y-auto">
              ${reopenedBugs.length === 0 ? `
                <div class="p-8 text-center text-slate-400">
                  <i data-lucide="shield-check" class="w-8 h-8 text-emerald-400 mx-auto mb-2"></i>
                  <p class="font-bold text-slate-700">Zero reopened defects</p>
                  <p class="text-[11px] text-slate-400 mt-0.5">High first-time resolution rate across all verified issues.</p>
                </div>
              ` : reopenedBugs.map(b => {
                const dev = store.getUserById(b.developerId || b.assigneeId) || { name: 'Assigned Dev' };
                const qa = store.getUserById(b.qaId) || { name: 'QA Lead' };

                return `
                  <div onclick="window.app.openIssueDetails ? window.app.openIssueDetails('${b.id}') : null" class="p-3 bg-rose-50/40 rounded-xl border border-rose-200/80 hover:bg-rose-50 transition cursor-pointer flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-bold text-rose-700">${b.key || 'BUG'}</span>
                        <h4 class="font-bold text-slate-900 truncate">${b.title}</h4>
                      </div>
                      <p class="text-[11px] text-slate-500 mt-0.5">Assigned Dev: ${dev.name} &bull; QA: ${qa.name}</p>
                    </div>

                    <span class="px-2.5 py-1 rounded-full bg-red-600 text-white font-bold text-[10px] shrink-0">
                      Reopened ${b.reopenCount}x
                    </span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  setProjectFilter(projectId) {
    this.activeProjectFilter = projectId;
    this.render(document.getElementById("mainContent"));
  }
};

if (typeof window !== 'undefined') window.ReportsView = ReportsView;
if (typeof global !== 'undefined') global.ReportsView = ReportsView;
if (typeof module !== 'undefined' && module.exports) module.exports = ReportsView;

