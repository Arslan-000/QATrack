/**
 * PulseWave - QA-First Project Management & Quality Intelligence Platform
 * Intelligent Release Risk Engine & Quality Gate UI View
 */

const ReleasesView = {
  activeReleaseId: null,
  activeViewMode: 'list', // 'list' | 'detail'
  searchQuery: '',
  filterStatus: 'all',
  filterGate: 'all',
  isAssessing: false,

  /**
   * Main render entry point
   */
  render(container, projectId) {
    if (!container) return;
    const project = projectId ? store.getProjectById(projectId) : store.getActiveProject();
    if (!project) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-500">
          <i data-lucide="folder-x" class="w-10 h-10 mx-auto text-slate-400 mb-2"></i>
          <p class="font-bold text-slate-700">Project Not Found</p>
          <p class="text-xs text-slate-400 mt-1">Please select an active project to view releases.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    if (this.activeViewMode === 'detail' && this.activeReleaseId) {
      this.renderReleaseDetail(container, project, this.activeReleaseId);
    } else {
      this.renderReleaseList(container, project);
    }

    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * 1. Release List View
   */
  renderReleaseList(container, project) {
    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const canManage = store.canManageReleases ? store.canManageReleases(project.id) : true;
    const canConfigPolicy = store.canConfigureQualitySettings ? store.canConfigureQualitySettings(project.id) : false;
    
    const allReleases = store.getReleases(project.id) || [];
    
    // Filter releases
    const filtered = allReleases.filter(rel => {
      if (this.filterStatus !== 'all' && rel.status !== this.filterStatus) return false;
      
      const latestAssessment = store.getLatestReleaseAssessment(rel.id);
      const gateStatus = latestAssessment ? latestAssessment.status : 'NO_DATA';
      if (this.filterGate !== 'all' && gateStatus !== this.filterGate) return false;

      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const matchName = (rel.name || '').toLowerCase().includes(q);
        const matchVer = (rel.version || '').toLowerCase().includes(q);
        const matchDesc = (rel.description || '').toLowerCase().includes(q);
        if (!matchName && !matchVer && !matchDesc) return false;
      }
      return true;
    });

    container.innerHTML = `
      <div class="space-y-5 animate-fade-in pb-12">
        
        <!-- Header Banner -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0 shadow-2xs">
              <i data-lucide="shield-alert" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-lg font-black text-slate-950 tracking-tight">Releases & Quality Gate</h1>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  ${allReleases.length} Total
                </span>
              </div>
              <p class="text-xs text-slate-500">
                Evaluate release risk readiness, blocking rules, and live QA telemetry for <strong class="text-slate-800">${project.name}</strong>.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 shrink-0">
            ${canConfigPolicy ? `
              <button onclick="ReleasesView.openQualitySettingsModal('${project.id}')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer" title="Configure Quality Gate Policy">
                <i data-lucide="sliders" class="w-4 h-4 text-slate-600"></i>
                <span>Quality Policy</span>
              </button>
            ` : ''}

            ${canManage ? `
              <button onclick="ReleasesView.openCreateReleaseModal('${project.id}')" class="px-3.5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl text-xs font-black shadow-xs shadow-[#bef264]/25 transition flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="plus" class="w-4 h-4 text-slate-950"></i>
                <span>New Release</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Filter and Search Bar -->
        <div class="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div class="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
            <!-- Search -->
            <div class="relative min-w-[180px] sm:min-w-[220px]">
              <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400"></i>
              <input type="text" placeholder="Search releases or version..." value="${this.searchQuery}" 
                oninput="ReleasesView.handleSearchInput(this.value, '${project.id}')"
                class="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition">
            </div>

            <!-- Status Filter -->
            <select onchange="ReleasesView.handleStatusFilter(this.value, '${project.id}')" class="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none">
              <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="PLANNED" ${this.filterStatus === 'PLANNED' ? 'selected' : ''}>● Planned</option>
              <option value="IN_PROGRESS" ${this.filterStatus === 'IN_PROGRESS' ? 'selected' : ''}>● In Progress</option>
              <option value="READY_FOR_REVIEW" ${this.filterStatus === 'READY_FOR_REVIEW' ? 'selected' : ''}>● Ready for Review</option>
              <option value="RELEASED" ${this.filterStatus === 'RELEASED' ? 'selected' : ''}>● Released</option>
              <option value="CANCELLED" ${this.filterStatus === 'CANCELLED' ? 'selected' : ''}>● Cancelled</option>
            </select>

            <!-- Quality Gate Filter -->
            <select onchange="ReleasesView.handleGateFilter(this.value, '${project.id}')" class="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none">
              <option value="all" ${this.filterGate === 'all' ? 'selected' : ''}>All Gate Outcomes</option>
              <option value="READY" ${this.filterGate === 'READY' ? 'selected' : ''}>🟢 READY</option>
              <option value="AT_RISK" ${this.filterGate === 'AT_RISK' ? 'selected' : ''}>🟠 AT RISK</option>
              <option value="NOT_READY" ${this.filterGate === 'NOT_READY' ? 'selected' : ''}>🔴 NOT READY</option>
              <option value="NO_DATA" ${this.filterGate === 'NO_DATA' ? 'selected' : ''}>⚪ NO DATA</option>
            </select>
          </div>

          <div class="text-[11px] text-slate-500 font-medium">
            Showing <strong class="text-slate-800">${filtered.length}</strong> of ${allReleases.length} Releases
          </div>

        </div>

        <!-- Release Table / Cards -->
        ${filtered.length === 0 ? `
          <div class="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center border border-purple-100">
              <i data-lucide="package-open" class="w-7 h-7"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                ${allReleases.length === 0 ? 'No releases yet' : 'No releases matching filter'}
              </h3>
              <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                ${allReleases.length === 0 
                  ? 'Create a release to track software quality readiness, blocking defects, and automated quality gates.' 
                  : 'Try resetting your search or filter parameters to locate the release.'}
              </p>
            </div>
            ${allReleases.length === 0 && canManage ? `
              <button onclick="ReleasesView.openCreateReleaseModal('${project.id}')" class="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs transition cursor-pointer shadow-xs">
                <i data-lucide="plus" class="w-4 h-4"></i> Create First Release
              </button>
            ` : ''}
          </div>
        ` : `
          <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <th class="py-3 px-4">Release & Version</th>
                    <th class="py-3 px-3">Status</th>
                    <th class="py-3 px-3">Target Date</th>
                    <th class="py-3 px-3 text-center">Quality Score</th>
                    <th class="py-3 px-3 text-center">Quality Gate</th>
                    <th class="py-3 px-3 text-center">Critical Bugs</th>
                    <th class="py-3 px-3 text-center">Failed Tests</th>
                    <th class="py-3 px-3">Last Assessed</th>
                    <th class="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  ${filtered.map(rel => {
                    const assessment = store.getLatestReleaseAssessment(rel.id);
                    const gate = assessment ? assessment.status : 'NO_DATA';
                    const score = assessment && assessment.score !== null ? assessment.score : null;
                    
                    const openCriticalCount = assessment && assessment.critical_risk_count !== undefined 
                      ? assessment.critical_risk_count 
                      : store.getIssues(project.id).filter(i => i.priority === 'Critical' && i.status !== 'Done' && i.status !== 'Closed').length;

                    return `
                      <tr class="hover:bg-slate-50/80 transition group">
                        <td class="py-3.5 px-4">
                          <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold font-mono text-xs shrink-0 border border-purple-200">
                              <i data-lucide="package" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                              <div class="flex items-center gap-1.5">
                                <a href="javascript:void(0)" onclick="ReleasesView.openReleaseDetail('${rel.id}')" class="font-bold text-slate-900 hover:text-purple-700 truncate transition">
                                  ${rel.name}
                                </a>
                                ${rel.version ? `<span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px] border border-slate-200/60">${rel.version}</span>` : ''}
                              </div>
                              <p class="text-[11px] text-slate-400 truncate max-w-xs">${rel.description || 'No description provided'}</p>
                            </div>
                          </div>
                        </td>

                        <td class="py-3.5 px-3">
                          ${this.renderStatusBadge(rel.status)}
                        </td>

                        <td class="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                          ${rel.release_date || rel.target_date || rel.releaseDate ? new Date(rel.release_date || rel.target_date || rel.releaseDate).toLocaleDateString() : '<span class="text-slate-400">Unscheduled</span>'}
                        </td>

                        <td class="py-3.5 px-3 text-center">
                          ${score !== null ? `
                            <div class="inline-flex items-center gap-1.5 font-bold font-mono text-xs px-2.5 py-1 rounded-xl ${
                              score >= 80 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              score >= 60 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              'bg-rose-50 text-rose-800 border border-rose-200'
                            }">
                              <span>${score}</span>
                              <span class="text-[10px] text-slate-400 font-normal">/ 100</span>
                            </div>
                          ` : `
                            <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono text-[11px] font-bold" title="Insufficient data to compute score">N/A</span>
                          `}
                        </td>

                        <td class="py-3.5 px-3 text-center">
                          ${this.renderGateBadge(gate)}
                        </td>

                        <td class="py-3.5 px-3 text-center font-mono">
                          ${openCriticalCount > 0 ? `
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                              <i data-lucide="alert-circle" class="w-3 h-3"></i> ${openCriticalCount}
                            </span>
                          ` : `
                            <span class="text-slate-400 text-[11px]">0</span>
                          `}
                        </td>

                        <td class="py-3.5 px-3 text-center font-mono">
                          ${assessment && assessment.high_risk_count !== undefined ? `
                            <span class="text-slate-700 text-[11px]">${assessment.high_risk_count}</span>
                          ` : `<span class="text-slate-400 text-[11px]">0</span>`}
                        </td>

                        <td class="py-3.5 px-3 text-slate-500 text-[11px]">
                          ${assessment && assessment.calculated_at ? `
                            <span title="${new Date(assessment.calculated_at).toLocaleString()}">${this.timeAgo(new Date(assessment.calculated_at))}</span>
                          ` : '<span class="text-slate-400 italic">Not evaluated</span>'}
                        </td>

                        <td class="py-3.5 px-4 text-right">
                          <div class="flex items-center justify-end gap-1.5">
                            <button onclick="ReleasesView.openReleaseDetail('${rel.id}')" class="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer" title="Open Release Readiness Dashboard">
                              <i data-lucide="gauge" class="w-3.5 h-3.5"></i>
                              <span>Readiness</span>
                            </button>

                            <button onclick="ReleasesView.runAssessment('${rel.id}', '${project.id}')" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer" title="Re-evaluate Quality Gate">
                              <i data-lucide="play" class="w-3.5 h-3.5"></i>
                            </button>

                            ${canManage ? `
                              <button onclick="ReleasesView.openEditReleaseModal('${rel.id}')" class="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition cursor-pointer" title="Edit Release">
                                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                              </button>

                              <button onclick="ReleasesView.confirmDeleteRelease('${rel.id}', '${project.id}')" class="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer" title="Delete Release">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                              </button>
                            ` : ''}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}

      </div>
    `;
  },

  /**
   * 2. Release Readiness Detail View
   */
  renderReleaseDetail(container, project, releaseId) {
    const release = store.getReleaseById(releaseId);
    if (!release) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-500 space-y-3">
          <p class="font-bold text-slate-700">Release not found.</p>
          <button onclick="ReleasesView.backToList('${project.id}')" class="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold">Back to Releases</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const canManage = store.canManageReleases ? store.canManageReleases(project.id) : true;
    const canOverride = store.canOverrideRelease ? store.canOverrideRelease(project.id) : false;
    const canConfigPolicy = store.canConfigureQualitySettings ? store.canConfigureQualitySettings(project.id) : false;
    const isDev = store.getUserProjectRole ? (store.getUserProjectRole(project.id, activeUser?.id) || '').toUpperCase() === 'DEVELOPER' : false;

    // Fetch assessment snapshot and policy
    const latestAssessment = store.getLatestReleaseAssessment(releaseId);
    const riskFactors = latestAssessment ? store.getReleaseRiskFactors(latestAssessment.id) : [];
    const settings = store.getProjectQualitySettings(project.id);
    const assessmentHistory = store.getReleaseQualityAssessments(releaseId);
    const decisions = store.getReleaseDecisions(releaseId);
    const linkedIssues = store.getReleaseLinkedIssues(releaseId);

    const isOverridden = decisions.some(d => d.decision === 'OVERRIDDEN');
    const latestOverride = decisions.filter(d => d.decision === 'OVERRIDDEN').slice(-1)[0];

    // Compute live metrics if no assessment yet or to display gate breakdown
    const gateStatus = latestAssessment ? latestAssessment.status : 'NO_DATA';
    const score = latestAssessment && latestAssessment.score !== null ? latestAssessment.score : null;
    const dataCompleteness = latestAssessment ? (latestAssessment.data_completeness || 0) : 0;

    // Signals for Gate UI
    const projectIssues = store.getIssues(project.id) || [];
    const scopeIssues = linkedIssues.length > 0 ? linkedIssues : projectIssues;
    const openCritical = scopeIssues.filter(i => i.priority === 'Critical' && i.status !== 'Done' && i.status !== 'Closed');
    const openHigh = scopeIssues.filter(i => i.priority === 'High' && i.status !== 'Done' && i.status !== 'Closed');
    
    // Test telemetry
    const testCases = store.getTestCases ? (store.getTestCases(project.id) || []) : [];
    const testRuns = store.getTestRuns ? (store.getTestRuns(project.id) || []) : [];
    let totalTestsExecuted = 0;
    let totalTestsPassed = 0;
    let totalTestsFailed = 0;
    let totalTestsBlocked = 0;
    let regressionExecuted = 0;
    let regressionPassed = 0;

    testRuns.forEach(run => {
      const isReg = (run.type && run.type.toLowerCase().includes('regression')) || (run.title && run.title.toLowerCase().includes('regression'));
      (run.results || []).forEach(res => {
        totalTestsExecuted++;
        if (res.status === 'PASSED') totalTestsPassed++;
        else if (res.status === 'FAILED') totalTestsFailed++;
        else if (res.status === 'BLOCKED') totalTestsBlocked++;

        if (isReg) {
          regressionExecuted++;
          if (res.status === 'PASSED') regressionPassed++;
        }
      });
    });

    const testPassRate = totalTestsExecuted > 0 ? Math.round((totalTestsPassed / totalTestsExecuted) * 100) : null;
    const regressionPassRate = regressionExecuted > 0 ? Math.round((regressionPassed / regressionExecuted) * 100) : null;
    const coveragePct = testCases.length > 0 ? Math.round((testCases.filter(t => t.status === 'READY' || t.status === 'AUTOMATED').length / testCases.length) * 100) : null;

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-16">
        
        <!-- Breadcrumbs & Nav Strip -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-xs font-semibold">
            <button onclick="ReleasesView.backToList('${project.id}')" class="text-slate-500 hover:text-purple-700 flex items-center gap-1 transition cursor-pointer">
              <i data-lucide="arrow-left" class="w-4 h-4"></i> Back to Releases
            </button>
            <span class="text-slate-300">/</span>
            <span class="text-slate-900 font-bold">${release.name}</span>
            ${release.version ? `<span class="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-mono text-[10px] font-bold border border-purple-200">${release.version}</span>` : ''}
          </div>

          <!-- Top Control Toolbar -->
          <div class="flex items-center gap-2">
            ${canConfigPolicy ? `
              <button onclick="ReleasesView.openQualitySettingsModal('${project.id}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer">
                <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Gate Policy</span>
              </button>
            ` : ''}

            <button onclick="ReleasesView.openRiskInvestigationModal('${release.id}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer">
              <i data-lucide="search-check" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>Investigate Risks</span>
            </button>

            <button id="runAssessmentBtn" onclick="ReleasesView.runAssessment('${release.id}', '${project.id}')" class="px-4 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl text-xs font-black shadow-xs shadow-[#bef264]/25 transition flex items-center gap-1.5 cursor-pointer ${this.isAssessing ? 'opacity-60 pointer-events-none' : ''}">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-slate-950 ${this.isAssessing ? 'animate-spin' : ''}"></i>
              <span>${this.isAssessing ? 'Assessing Release...' : 'Run Assessment'}</span>
            </button>

            ${canOverride && settings.allow_release_override && gateStatus === 'NOT_READY' && !isOverridden ? `
              <button onclick="ReleasesView.openOverrideModal('${release.id}', '${project.id}')" class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-amber-600"></i>
                <span>Release Anyway</span>
              </button>
            ` : ''}

            ${canManage && release.status !== 'RELEASED' ? `
              <button onclick="ReleasesView.markAsReleased('${release.id}', '${project.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
                <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                <span>Mark Released</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Warning banner if Overridden -->
        ${isOverridden ? `
          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 flex items-start gap-3 text-xs animate-fade-in">
            <div class="p-1.5 rounded-lg bg-amber-100 text-amber-800 font-bold shrink-0">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            </div>
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2 font-bold text-amber-900">
                <span>⚠ RELEASE OVERRIDDEN BY AUTHORIZED PM</span>
                <span class="text-[10px] text-amber-700 font-mono">(${new Date(latestOverride.created_at).toLocaleString()})</span>
              </div>
              <p class="text-amber-800 leading-relaxed">
                <strong>Override Reason:</strong> "${latestOverride.override_reason || 'Manual authorization granted.'}"
              </p>
              <p class="text-[11px] text-amber-700">
                Note: This release failed automated quality gate checks, but was manually authorized for deployment. The original quality score remains preserved.
              </p>
            </div>
          </div>
        ` : ''}

        <!-- 1. Hero Readiness Scorecard -->
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 relative overflow-hidden">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            
            <!-- Left Score block -->
            <div class="flex items-center gap-6">
              <div class="relative flex flex-col items-center justify-center w-28 h-28 rounded-2xl ${
                score !== null && score >= 80 ? 'bg-emerald-50 text-emerald-950 border-2 border-emerald-200' :
                score !== null && score >= 60 ? 'bg-amber-50 text-amber-950 border-2 border-amber-200' :
                score !== null ? 'bg-rose-50 text-rose-950 border-2 border-rose-200' :
                'bg-slate-100 text-slate-700 border-2 border-slate-200'
              } shadow-2xs shrink-0">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QUALITY SCORE</span>
                <span class="text-3xl font-black font-mono tracking-tight my-0.5">${score !== null ? score : 'N/A'}</span>
                <span class="text-[10px] font-semibold text-slate-500 font-mono">/ 100</span>
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">GATE STATUS:</span>
                  ${this.renderGateBadge(gateStatus, true)}
                </div>
                <h2 class="text-lg font-black text-slate-900 tracking-tight">${this.getRecommendationTitle(gateStatus, score)}</h2>
                <p class="text-xs text-slate-500 max-w-xl leading-relaxed">
                  ${this.getRecommendationText(gateStatus, score, openCritical.length, riskFactors)}
                </p>
                <div class="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                  <span>Evaluated: <strong class="text-slate-700">${latestAssessment ? new Date(latestAssessment.calculated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Never'}</strong></span>
                  <span>•</span>
                  <span>Data Completeness: <strong class="text-slate-700 font-mono">${dataCompleteness}%</strong></span>
                </div>
              </div>
            </div>

            <!-- Right: Quick Stat Chips -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 shrink-0 text-xs">
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Critical Defects</span>
                <span class="text-base font-black font-mono mt-0.5 block ${openCritical.length > 0 ? 'text-rose-600' : 'text-slate-800'}">
                  ${openCritical.length} Open
                </span>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Test Pass Rate</span>
                <span class="text-base font-black font-mono mt-0.5 block ${testPassRate !== null ? (testPassRate >= 90 ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-400'}">
                  ${testPassRate !== null ? `${testPassRate}%` : 'N/A'}
                </span>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Regression Pass</span>
                <span class="text-base font-black font-mono mt-0.5 block ${regressionPassRate !== null ? (regressionPassRate >= 90 ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-400'}">
                  ${regressionPassRate !== null ? `${regressionPassRate}%` : 'N/A'}
                </span>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Blocked Tests</span>
                <span class="text-base font-black font-mono mt-0.5 block ${totalTestsBlocked > 0 ? 'text-rose-600' : 'text-slate-800'}">
                  ${totalTestsBlocked}
                </span>
              </div>
            </div>

          </div>
        </div>

        <!-- 2. Quality Gate Rules Table & Top Risks Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Quality Gate Rules Panel -->
          <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-purple-50 text-purple-600 font-bold border border-purple-100">
                    <i data-lucide="shield-check" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Formal Quality Gate</h3>
                    <p class="text-[11px] text-slate-400">Deterministic criteria required for release certification</p>
                  </div>
                </div>
                ${canConfigPolicy ? `
                  <button onclick="ReleasesView.openQualitySettingsModal('${project.id}')" class="text-[11px] text-purple-700 font-bold hover:underline cursor-pointer">Edit Policy</button>
                ` : ''}
              </div>

              <!-- Gate Rules List -->
              <div class="mt-3.5 space-y-2.5 text-xs">
                
                <!-- Rule 1: Critical Bugs -->
                ${this.renderGateRuleRow({
                  title: 'Critical Open Defects',
                  current: `${openCritical.length}`,
                  threshold: `Max ${settings.maximum_open_critical_bugs || 0} allowed`,
                  passed: openCritical.length <= (settings.maximum_open_critical_bugs || 0),
                  isBlocking: settings.critical_bug_blocks_release,
                  clickAction: `window.app.navigate('all-issues')`
                })}

                <!-- Rule 2: High Bugs -->
                ${this.renderGateRuleRow({
                  title: 'High Severity Defects',
                  current: `${openHigh.length}`,
                  threshold: `Max ${settings.high_bug_threshold || 0} allowed`,
                  passed: openHigh.length <= (settings.high_bug_threshold || 0),
                  isBlocking: false,
                  clickAction: `window.app.navigate('all-issues')`
                })}

                <!-- Rule 3: Test Pass Rate -->
                ${this.renderGateRuleRow({
                  title: 'Test Pass Rate',
                  current: testPassRate !== null ? `${testPassRate}%` : 'N/A (No tests)',
                  threshold: `Min ${settings.minimum_test_pass_rate || 90}%`,
                  passed: testPassRate !== null ? testPassRate >= (settings.minimum_test_pass_rate || 90) : null,
                  isBlocking: false,
                  clickAction: `ProjectWorkspaceView.switchTab('qa')`
                })}

                <!-- Rule 4: Regression Pass Rate -->
                ${this.renderGateRuleRow({
                  title: 'Regression Pass Rate',
                  current: regressionPassRate !== null ? `${regressionPassRate}%` : 'N/A (No runs)',
                  threshold: `Min ${settings.minimum_regression_pass_rate || 90}%`,
                  passed: regressionPassRate !== null ? regressionPassRate >= (settings.minimum_regression_pass_rate || 90) : null,
                  isBlocking: false,
                  clickAction: `ProjectWorkspaceView.switchTab('qa')`
                })}

                <!-- Rule 5: Blocked Tests -->
                ${this.renderGateRuleRow({
                  title: 'Blocked Test Executions',
                  current: totalTestsExecuted > 0 ? `${totalTestsBlocked}` : 'N/A',
                  threshold: `Max ${settings.maximum_blocked_tests || 0} allowed`,
                  passed: totalTestsExecuted > 0 ? totalTestsBlocked <= (settings.maximum_blocked_tests || 0) : null,
                  isBlocking: false,
                  clickAction: `ProjectWorkspaceView.switchTab('qa')`
                })}

                <!-- Rule 6: Test Coverage -->
                ${this.renderGateRuleRow({
                  title: 'Automated Test Coverage',
                  current: coveragePct !== null ? `${coveragePct}%` : 'N/A',
                  threshold: `Min ${settings.minimum_coverage || 80}%`,
                  passed: coveragePct !== null ? coveragePct >= (settings.minimum_coverage || 80) : null,
                  isBlocking: false,
                  clickAction: `ProjectWorkspaceView.switchTab('qa')`
                })}

              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Gate status evaluates blocking rules and numerical quality.</span>
              <span class="font-mono font-bold text-slate-700">6 Rules Configured</span>
            </div>
          </div>

          <!-- Top Risks & Evidence Panel -->
          <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold border border-rose-100">
                    <i data-lucide="alert-octagon" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Identified Risk Factors</h3>
                    <p class="text-[11px] text-slate-400">Evidence-based quality deductions</p>
                  </div>
                </div>
                <button onclick="ReleasesView.openRiskInvestigationModal('${release.id}')" class="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer">
                  Investigate All (${riskFactors.length})
                </button>
              </div>

              <!-- List of top risks -->
              <div class="mt-3.5 space-y-2.5">
                ${riskFactors.length === 0 ? `
                  <div class="p-8 text-center text-slate-400 text-xs">
                    <i data-lucide="check-circle-2" class="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80"></i>
                    <p class="font-bold text-slate-700">No Quality Risks Detected</p>
                    <p class="text-[11px] text-slate-400">All evaluated quality signals are currently healthy.</p>
                  </div>
                ` : riskFactors.slice(0, 4).map(rf => {
                  return `
                    <div class="p-3 rounded-xl ${rf.is_blocking ? 'bg-rose-50/70 border border-rose-200' : 'bg-slate-50 border border-slate-200/80'} transition flex items-start justify-between gap-3 text-xs">
                      <div class="flex items-start gap-2.5 min-w-0">
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 mt-0.5 ${
                          rf.severity === 'BLOCKING' ? 'bg-red-600 text-white' :
                          rf.severity === 'HIGH' ? 'bg-amber-500 text-white' :
                          rf.severity === 'MEDIUM' ? 'bg-amber-600 text-white' :
                          'bg-slate-500 text-white'
                        }">
                          ${rf.severity}
                        </span>
                        <div class="min-w-0">
                          <h4 class="font-bold text-slate-900 truncate">${rf.title}</h4>
                          <p class="text-[11px] text-slate-500 line-clamp-2 mt-0.5">${rf.description}</p>
                          ${rf.evidence && (rf.evidence.issue_keys || rf.evidence.test_case_keys) ? `
                            <div class="flex items-center gap-1.5 mt-1.5 font-mono text-[10px]">
                              ${(rf.evidence.issue_keys || []).slice(0, 3).map(k => `
                                <span class="px-1 py-0.2 bg-white rounded border border-slate-200 text-slate-700 font-bold">${k}</span>
                              `).join('')}
                              ${(rf.evidence.test_case_keys || []).slice(0, 3).map(k => `
                                <span class="px-1 py-0.2 bg-white rounded border border-slate-200 text-purple-700 font-bold">${k}</span>
                              `).join('')}
                            </div>
                          ` : ''}
                        </div>
                      </div>

                      <div class="shrink-0 text-right">
                        <span class="text-rose-600 font-mono font-bold text-xs">-${rf.score_impact || 0} pts</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Click investigate to view underlying issues and test traces.</span>
              <button onclick="ReleasesView.openRiskInvestigationModal('${release.id}')" class="text-slate-900 font-bold hover:underline">
                View Evidence Panel &rarr;
              </button>
            </div>
          </div>

        </div>

        <!-- 3. Explainable Score Breakdown & Historical Trend Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Explainable Score Breakdown -->
          <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200">
                  <i data-lucide="help-circle" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">How is this score calculated?</h3>
                  <p class="text-[11px] text-slate-400">Deterministic deduction calculation</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">Base 100</span>
            </div>

            <div class="mt-4 space-y-2 text-xs font-mono">
              <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-slate-700 font-bold">
                <span>Baseline Quality Score</span>
                <span class="text-emerald-700">+100 pts</span>
              </div>

              ${riskFactors.length === 0 ? `
                <div class="p-3 text-center text-slate-400 text-xs font-sans">
                  No deductions applied. Clean baseline readiness.
                </div>
              ` : riskFactors.map(rf => `
                <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50/60 hover:bg-slate-100/80 transition text-slate-600">
                  <span class="font-sans font-medium truncate max-w-xs">${rf.title}</span>
                  <span class="text-rose-600 font-bold shrink-0">-${rf.score_impact} pts</span>
                </div>
              `).join('')}

              <div class="pt-2 border-t border-slate-200 flex items-center justify-between p-2 rounded-xl bg-slate-900 text-white font-bold text-sm">
                <span>Final Calculated Score</span>
                <span class="${score !== null && score >= 80 ? 'text-[#bef264]' : score !== null && score >= 60 ? 'text-amber-400' : 'text-rose-400'}">
                  ${score !== null ? score : 'N/A'} / 100
                </span>
              </div>
            </div>
          </div>

          <!-- Assessment Trend & Decision History -->
          <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 font-bold border border-cyan-100">
                    <i data-lucide="trending-up" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Quality History & Decisions</h3>
                    <p class="text-[11px] text-slate-400">Immutable evaluation snapshots</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                  ${assessmentHistory.length} Snapshots
                </span>
              </div>

              <!-- History Timeline -->
              <div class="mt-4 space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
                ${assessmentHistory.length === 0 ? `
                  <div class="p-6 text-center text-slate-400 text-xs">
                    <p>No historical assessments logged.</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">Run assessments over time to track score evolution.</p>
                  </div>
                ` : assessmentHistory.slice(0, 5).map((snap, idx) => `
                  <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                        #${assessmentHistory.length - idx}
                      </span>
                      <div class="min-w-0">
                        <span class="font-bold text-slate-800 block truncate">${this.renderGateBadge(snap.status)}</span>
                        <span class="text-[10px] text-slate-400">${new Date(snap.calculated_at || snap.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div class="font-mono font-black text-xs ${
                      snap.score >= 80 ? 'text-emerald-700' :
                      snap.score >= 60 ? 'text-amber-700' :
                      'text-rose-700'
                    }">
                      ${snap.score !== null ? `${snap.score} / 100` : 'N/A'}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Audit log preserves all evaluations without mutating past records.
            </div>
          </div>

        </div>

      </div>
    `;
  },

  // =========================================================================
  // HELPER UI RENDERING METHODS
  // =========================================================================
  
  renderStatusBadge(status) {
    switch (status) {
      case 'PLANNED':
        return `<span class="px-2 py-0.5 rounded-md bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] font-bold text-[10px]">● Planned</span>`;
      case 'IN_PROGRESS':
        return `<span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">● In Progress</span>`;
      case 'READY_FOR_REVIEW':
        return `<span class="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">● In Review</span>`;
      case 'RELEASED':
        return `<span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">✓ Released</span>`;
      case 'CANCELLED':
        return `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 font-bold text-[10px]">✕ Cancelled</span>`;
      default:
        return `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">${status}</span>`;
    }
  },

  renderGateBadge(gate, large = false) {
    const size = large ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';
    switch (gate) {
      case 'READY':
        return `<span class="${size} rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono inline-flex items-center gap-1">🟢 READY</span>`;
      case 'AT_RISK':
        return `<span class="${size} rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold font-mono inline-flex items-center gap-1">🟠 AT RISK</span>`;
      case 'NOT_READY':
        return `<span class="${size} rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold font-mono inline-flex items-center gap-1">🔴 NOT READY</span>`;
      case 'NO_DATA':
      default:
        return `<span class="${size} rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold font-mono inline-flex items-center gap-1">⚪ NO DATA</span>`;
    }
  },

  renderGateRuleRow({ title, current, threshold, passed, isBlocking, clickAction }) {
    let badge = '';
    if (passed === true) {
      badge = `<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono text-[10px] inline-flex items-center gap-1">✅ PASSED</span>`;
    } else if (passed === false) {
      badge = isBlocking 
        ? `<span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold font-mono text-[10px] inline-flex items-center gap-1">❌ FAILED (BLOCKING)</span>`
        : `<span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold font-mono text-[10px] inline-flex items-center gap-1">❌ FAILED</span>`;
    } else {
      badge = `<span class="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px] font-bold">N/A (NO DATA)</span>`;
    }

    return `
      <div onclick="${clickAction || ''}" class="p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/60 transition cursor-pointer flex items-center justify-between gap-2 group">
        <div class="min-w-0">
          <div class="font-bold text-slate-800 group-hover:text-purple-700 transition flex items-center gap-1.5">
            <span>${title}</span>
            <i data-lucide="external-link" class="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition"></i>
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">
            Current: <strong class="text-slate-700">${current}</strong> • ${threshold}
          </div>
        </div>
        <div class="shrink-0">
          ${badge}
        </div>
      </div>
    `;
  },

  getRecommendationTitle(gate, score) {
    if (gate === 'READY') return 'Ready for Release Deployment';
    if (gate === 'NOT_READY') return 'Release Blocked: Quality Gate Failed';
    if (gate === 'AT_RISK') return 'Release At Risk: Review Recommended';
    return 'Insufficient Telemetry Data to Evaluate';
  },

  getRecommendationText(gate, score, criticalBugsCount, riskFactors) {
    if (gate === 'READY') {
      return 'All quality signals satisfy project policies. No blocking defects detected. Release is certified safe to proceed.';
    }
    if (gate === 'NOT_READY') {
      if (criticalBugsCount > 0) {
        return `Do not release yet. Resolve the ${criticalBugsCount} critical open defect(s) and re-verify quality gate before deployment.`;
      }
      return 'One or more release-blocking rules failed. Resolve highlighted blocking risks before proceeding with deployment.';
    }
    if (gate === 'AT_RISK') {
      return 'Release has meaningful quality deductions. Review all identified risks with QA leads before proceeding.';
    }
    return 'Not enough QA execution telemetry or issue data is currently available to calculate a certified score.';
  },

  timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  },

  // =========================================================================
  // ACTIONS & MODALS
  // =========================================================================

  openReleaseDetail(releaseId) {
    this.activeReleaseId = releaseId;
    this.activeViewMode = 'detail';
    const project = store.getActiveProject();
    this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), project?.id);
  },

  backToList(projectId) {
    this.activeReleaseId = null;
    this.activeViewMode = 'list';
    this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), projectId);
  },

  handleSearchInput(val, projectId) {
    this.searchQuery = val;
    this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), projectId);
  },

  handleStatusFilter(val, projectId) {
    this.filterStatus = val;
    this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), projectId);
  },

  handleGateFilter(val, projectId) {
    this.filterGate = val;
    this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), projectId);
  },

  async runAssessment(releaseId, projectId) {
    if (this.isAssessing) return;
    this.isAssessing = true;
    
    // Update UI state
    const btn = document.getElementById('runAssessmentBtn');
    if (btn) btn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 animate-spin"></i> <span>Assessing Release...</span>`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const assessment = await store.runReleaseQualityAssessment(releaseId);
      if (assessment) {
        if (window.app && window.app.showToast) {
          window.app.showToast(`Assessment completed: Gate is ${assessment.status} (${assessment.score !== null ? assessment.score : 'N/A'} pts)`, 'success');
        }
      }
    } catch (err) {
      console.error("Error assessing release:", err);
      if (window.app && window.app.showToast) {
        window.app.showToast("Assessment failed: " + err.message, "error");
      }
    } finally {
      this.isAssessing = false;
      this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), projectId);
    }
  },

  /**
   * Modal: Create Release
   */
  openCreateReleaseModal(projectId) {
    const project = store.getProjectById(projectId) || store.getActiveProject();
    if (!project) return;
    const issues = store.getIssues(project.id) || [];

    const modalContainer = document.getElementById('globalModalContainer') || document.getElementById('prjModalContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <div class="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 rounded-xl bg-purple-100 text-purple-700">
                <i data-lucide="package-plus" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-950">Create New Release</h3>
                <p class="text-xs text-slate-400">Target release candidate for ${project.name}</p>
              </div>
            </div>
            <button onclick="ReleasesView.closeModal()" class="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="ReleasesView.handleCreateReleaseSubmit(event, '${project.id}')" class="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-slate-700 font-bold mb-1">Release Name <span class="text-red-500">*</span></label>
                <input id="newReleaseName" type="text" placeholder="e.g. Summer Production Release" required
                  class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">
              </div>

              <div>
                <label class="block text-slate-700 font-bold mb-1">Version String</label>
                <input id="newReleaseVersion" type="text" placeholder="e.g. v2.4.0"
                  class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-slate-700 font-bold mb-1">Status</label>
                <select id="newReleaseStatus" class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">
                  <option value="PLANNED">● Planned</option>
                  <option value="IN_PROGRESS" selected>● In Progress</option>
                  <option value="READY_FOR_REVIEW">● Ready for Review</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-700 font-bold mb-1">Target Release Date</label>
                <input id="newReleaseDate" type="date"
                  class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">
              </div>
            </div>

            <div>
              <label class="block text-slate-700 font-bold mb-1">Description / Release Notes</label>
              <textarea id="newReleaseDesc" rows="2" placeholder="Brief scope and deliverables summary..."
                class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"></textarea>
            </div>

            <!-- Scope Issue Selection -->
            <div>
              <label class="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>Link Scope Issues (${issues.length} available)</span>
                <span class="text-[10px] text-slate-400 font-normal">Optional scope filter</span>
              </label>
              <div class="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-2 space-y-1 bg-slate-50">
                ${issues.length === 0 ? `
                  <p class="text-slate-400 text-center py-2">No project issues available</p>
                ` : issues.map(iss => `
                  <label class="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg transition cursor-pointer">
                    <input type="checkbox" name="releaseScopeIssues" value="${iss.id}" class="rounded text-[#4d7c0f] focus:ring-[#bef264]">
                    <span class="font-mono font-bold text-[10px] ${iss.type === 'Bug' ? 'text-rose-600' : 'text-slate-900'}">${iss.key}</span>
                    <span class="text-slate-700 truncate flex-1">${iss.title}</span>
                    <span class="text-[10px] text-slate-400">${iss.priority}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div class="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button type="button" onclick="ReleasesView.closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs transition">
                Create & Assess Release
              </button>
            </div>

          </form>

        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  async handleCreateReleaseSubmit(e, projectId) {
    e.preventDefault();
    const name = document.getElementById('newReleaseName')?.value.trim();
    const version = document.getElementById('newReleaseVersion')?.value.trim();
    const status = document.getElementById('newReleaseStatus')?.value;
    const release_date = document.getElementById('newReleaseDate')?.value || null;
    const description = document.getElementById('newReleaseDesc')?.value.trim();

    if (!name) return;

    // Collect linked issues
    const checkboxes = document.querySelectorAll('input[name="releaseScopeIssues"]:checked');
    const issueIds = Array.from(checkboxes).map(cb => cb.value);

    try {
      const release = await store.createRelease({
        project_id: projectId,
        name,
        version,
        status,
        release_date,
        description
      });

      if (release && issueIds.length > 0) {
        await store.linkIssuesToRelease(release.id, issueIds);
      }

      // Automatically run first assessment
      if (release) {
        await store.runReleaseQualityAssessment(release.id);
      }

      this.closeModal();
      if (window.app && window.app.showToast) {
        window.app.showToast(`Release ${name} created and assessed successfully!`, 'success');
      }
      this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), projectId);
    } catch (err) {
      console.error("Error creating release:", err);
      if (window.app && window.app.showToast) {
        window.app.showToast("Failed to create release: " + err.message, "error");
      }
    }
  },

  /**
   * Modal: Edit Release
   */
  openEditReleaseModal(releaseId) {
    const release = store.getReleaseById(releaseId);
    if (!release) return;

    const modalContainer = document.getElementById('globalModalContainer') || document.getElementById('prjModalContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <div class="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 rounded-xl bg-purple-100 text-purple-700">
                <i data-lucide="edit" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-950">Edit Release</h3>
                <p class="text-xs text-slate-400">Update metadata for ${release.name}</p>
              </div>
            </div>
            <button onclick="ReleasesView.closeModal()" class="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="ReleasesView.handleEditReleaseSubmit(event, '${release.id}', '${release.project_id}')" class="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-slate-700 font-bold mb-1">Release Name <span class="text-red-500">*</span></label>
                <input id="editReleaseName" type="text" value="${release.name || ''}" required
                  class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">
              </div>

              <div>
                <label class="block text-slate-700 font-bold mb-1">Version String</label>
                <input id="editReleaseVersion" type="text" value="${release.version || ''}"
                  class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-slate-700 font-bold mb-1">Status</label>
                <select id="editReleaseStatus" class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">
                  <option value="PLANNED" ${release.status === 'PLANNED' ? 'selected' : ''}>● Planned</option>
                  <option value="IN_PROGRESS" ${release.status === 'IN_PROGRESS' ? 'selected' : ''}>● In Progress</option>
                  <option value="READY_FOR_REVIEW" ${release.status === 'READY_FOR_REVIEW' ? 'selected' : ''}>● Ready for Review</option>
                  <option value="RELEASED" ${release.status === 'RELEASED' ? 'selected' : ''}>● Released</option>
                  <option value="CANCELLED" ${release.status === 'CANCELLED' ? 'selected' : ''}>● Cancelled</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-700 font-bold mb-1">Target Release Date</label>
                <input id="editReleaseDate" type="date" value="${release.release_date ? release.release_date.split('T')[0] : ''}"
                  class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">
              </div>
            </div>

            <div>
              <label class="block text-slate-700 font-bold mb-1">Description / Release Notes</label>
              <textarea id="editReleaseDesc" rows="3"
                class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">${release.description || ''}</textarea>
            </div>

            <div class="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button type="button" onclick="ReleasesView.closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition">
                Save Changes
              </button>
            </div>

          </form>

        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  async handleEditReleaseSubmit(e, releaseId, projectId) {
    e.preventDefault();
    const name = document.getElementById('editReleaseName')?.value.trim();
    const version = document.getElementById('editReleaseVersion')?.value.trim();
    const status = document.getElementById('editReleaseStatus')?.value;
    const release_date = document.getElementById('editReleaseDate')?.value || null;
    const description = document.getElementById('editReleaseDesc')?.value.trim();

    try {
      await store.updateRelease(releaseId, {
        name,
        version,
        status,
        release_date,
        description
      });

      this.closeModal();
      if (window.app && window.app.showToast) {
        window.app.showToast(`Release updated successfully!`, 'success');
      }
      this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), projectId);
    } catch (err) {
      console.error("Error updating release:", err);
      if (window.app && window.app.showToast) {
        window.app.showToast("Failed to update release: " + err.message, "error");
      }
    }
  },

  async confirmDeleteRelease(releaseId, projectId) {
    if (!confirm("Are you sure you want to delete this release? All historical assessments will be permanently removed.")) {
      return;
    }
    try {
      await store.deleteRelease(releaseId);
      if (window.app && window.app.showToast) {
        window.app.showToast("Release deleted successfully.", "info");
      }
      this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), projectId);
    } catch (err) {
      console.error("Error deleting release:", err);
      if (window.app && window.app.showToast) {
        window.app.showToast("Failed to delete release: " + err.message, "error");
      }
    }
  },

  /**
   * Modal: Investigate Risks & Evidence
   */
  openRiskInvestigationModal(releaseId) {
    const release = store.getReleaseById(releaseId);
    if (!release) return;

    const assessment = store.getLatestReleaseAssessment(releaseId);
    const riskFactors = assessment ? store.getReleaseRiskFactors(assessment.id) : [];

    const modalContainer = document.getElementById('globalModalContainer') || document.getElementById('prjModalContainer');
    if (!modalContainer) return;

    const blockingRisks = riskFactors.filter(r => r.severity === 'BLOCKING');
    const highRisks = riskFactors.filter(r => r.severity === 'HIGH');
    const mediumRisks = riskFactors.filter(r => r.severity === 'MEDIUM');
    const lowRisks = riskFactors.filter(r => r.severity === 'LOW');

    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          
          <div class="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 rounded-xl bg-rose-100 text-rose-700">
                <i data-lucide="search-check" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-950">Risk Investigation & Evidence Explorer</h3>
                <p class="text-xs text-slate-400">${release.name} (${riskFactors.length} Total Risk Factors)</p>
              </div>
            </div>
            <button onclick="ReleasesView.closeModal()" class="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="p-5 overflow-y-auto space-y-6 text-xs flex-1">
            
            <!-- Blocking Risks -->
            <div>
              <div class="flex items-center gap-2 mb-2 pb-1 border-b border-slate-100 font-bold text-rose-950 text-xs uppercase tracking-wider">
                <span class="w-2 h-2 rounded-full bg-red-600"></span>
                <span>BLOCKING RISKS (${blockingRisks.length})</span>
              </div>
              ${blockingRisks.length === 0 ? `
                <p class="text-slate-400 italic py-1">No blocking risks detected.</p>
              ` : blockingRisks.map(r => this.renderRiskItemModal(r)).join('')}
            </div>

            <!-- High Risks -->
            <div>
              <div class="flex items-center gap-2 mb-2 pb-1 border-b border-slate-100 font-bold text-amber-950 text-xs uppercase tracking-wider">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>HIGH RISKS (${highRisks.length})</span>
              </div>
              ${highRisks.length === 0 ? `
                <p class="text-slate-400 italic py-1">No high risks detected.</p>
              ` : highRisks.map(r => this.renderRiskItemModal(r)).join('')}
            </div>

            <!-- Medium Risks -->
            <div>
              <div class="flex items-center gap-2 mb-2 pb-1 border-b border-slate-100 font-bold text-slate-950 text-xs uppercase tracking-wider">
                <span class="w-2 h-2 rounded-full bg-slate-600"></span>
                <span>MEDIUM RISKS (${mediumRisks.length})</span>
              </div>
              ${mediumRisks.length === 0 ? `
                <p class="text-slate-400 italic py-1">No medium risks detected.</p>
              ` : mediumRisks.map(r => this.renderRiskItemModal(r)).join('')}
            </div>

            <!-- Low Risks -->
            <div>
              <div class="flex items-center gap-2 mb-2 pb-1 border-b border-slate-100 font-bold text-slate-700 text-xs uppercase tracking-wider">
                <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>LOW RISKS / WARNINGS (${lowRisks.length})</span>
              </div>
              ${lowRisks.length === 0 ? `
                <p class="text-slate-400 italic py-1">No low risks detected.</p>
              ` : lowRisks.map(r => this.renderRiskItemModal(r)).join('')}
            </div>

          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span class="text-slate-500">Clicking on any issue or test entity navigates directly to source record.</span>
            <button onclick="ReleasesView.closeModal()" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition">
              Close
            </button>
          </div>

        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  renderRiskItemModal(r) {
    return `
      <div class="p-3 mb-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition space-y-2">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 class="font-bold text-slate-900">${r.title}</h4>
            <p class="text-[11px] text-slate-600 mt-0.5">${r.description}</p>
          </div>
          <span class="font-mono font-bold text-rose-600 text-xs shrink-0">-${r.score_impact} pts</span>
        </div>

        ${r.evidence ? `
          <div class="p-2 rounded-lg bg-white border border-slate-100 text-[11px] space-y-1">
            <div class="font-bold text-slate-400 uppercase text-[9px]">EVIDENCE SNAPSHOT:</div>
            ${r.evidence.issues ? r.evidence.issues.map(iss => `
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="font-mono font-bold text-rose-600">${iss.key}</span>
                  <span class="text-slate-700 truncate">${iss.title}</span>
                </div>
                <button onclick="ReleasesView.closeModal(); window.app.openIssueDetails('${iss.id}')" class="px-2 py-0.5 rounded bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] font-bold text-[10px] hover:bg-[#ecfccb] transition shrink-0 cursor-pointer">
                  View Issue &rarr;
                </button>
              </div>
            `).join('') : ''}

            ${r.evidence.failed_test_runs ? r.evidence.failed_test_runs.map(tr => `
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="font-mono font-bold text-purple-700">${tr.case_key || 'TC'}</span>
                  <span class="text-slate-700 truncate">${tr.title || 'Test Execution'}</span>
                </div>
                <button onclick="ReleasesView.closeModal(); ProjectWorkspaceView.switchTab('qa')" class="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px] hover:bg-purple-100 transition shrink-0">
                  View QA Run &rarr;
                </button>
              </div>
            `).join('') : ''}
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Modal: Project Quality Gate Policy Settings
   */
  openQualitySettingsModal(projectId) {
    const project = store.getProjectById(projectId) || store.getActiveProject();
    if (!project) return;
    const settings = store.getProjectQualitySettings(project.id);

    const modalContainer = document.getElementById('globalModalContainer') || document.getElementById('prjModalContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <div class="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 rounded-xl bg-purple-100 text-purple-700">
                <i data-lucide="sliders" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-950">Configure Quality Gate Policy</h3>
                <p class="text-xs text-slate-400">Project-level thresholds for ${project.name}</p>
              </div>
            </div>
            <button onclick="ReleasesView.closeModal()" class="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="ReleasesView.handleQualitySettingsSubmit(event, '${project.id}')" class="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            
            <div class="p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-slate-600 leading-relaxed">
              Define the automated rules required for a release to pass the Quality Gate. These policies are enforced deterministically on every assessment.
            </div>

            <div class="space-y-3">
              <label class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <div class="font-bold text-slate-900">Critical Bugs Block Release</div>
                  <div class="text-[11px] text-slate-400">Any open critical defect sets gate status to NOT READY</div>
                </div>
                <input id="setCritBlocks" type="checkbox" ${settings.critical_bug_blocks_release ? 'checked' : ''} class="w-4 h-4 text-purple-600 rounded">
              </label>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Max Open Critical Bugs</label>
                  <input id="setMaxCrit" type="number" min="0" value="${settings.maximum_open_critical_bugs ?? 0}"
                    class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none">
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">High Bug Threshold</label>
                  <input id="setMaxHigh" type="number" min="0" value="${settings.high_bug_threshold ?? 0}"
                    class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Min Test Pass Rate (%)</label>
                  <input id="setMinPass" type="number" min="0" max="100" value="${settings.minimum_test_pass_rate ?? 90}"
                    class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none">
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Min Regression Rate (%)</label>
                  <input id="setMinReg" type="number" min="0" max="100" value="${settings.minimum_regression_pass_rate ?? 90}"
                    class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Min Test Coverage (%)</label>
                  <input id="setMinCov" type="number" min="0" max="100" value="${settings.minimum_coverage ?? 80}"
                    class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none">
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Max Blocked Tests</label>
                  <input id="setMaxBlock" type="number" min="0" value="${settings.maximum_blocked_tests ?? 0}"
                    class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none">
                </div>
              </div>

              <label class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <div class="font-bold text-slate-900">Allow Release Override</div>
                  <div class="text-[11px] text-slate-400">Permits authorized PMs to sign off with mandatory justification</div>
                </div>
                <input id="setAllowOverride" type="checkbox" ${settings.allow_release_override ? 'checked' : ''} class="w-4 h-4 text-purple-600 rounded">
              </label>
            </div>

            <div class="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button type="button" onclick="ReleasesView.closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition">
                Save Policy
              </button>
            </div>

          </form>

        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  async handleQualitySettingsSubmit(e, projectId) {
    e.preventDefault();
    const critical_bug_blocks_release = document.getElementById('setCritBlocks')?.checked;
    const maximum_open_critical_bugs = parseInt(document.getElementById('setMaxCrit')?.value || 0, 10);
    const high_bug_threshold = parseInt(document.getElementById('setMaxHigh')?.value || 0, 10);
    const minimum_test_pass_rate = parseFloat(document.getElementById('setMinPass')?.value || 90);
    const minimum_regression_pass_rate = parseFloat(document.getElementById('setMinReg')?.value || 90);
    const minimum_coverage = parseFloat(document.getElementById('setMinCov')?.value || 80);
    const maximum_blocked_tests = parseInt(document.getElementById('setMaxBlock')?.value || 0, 10);
    const allow_release_override = document.getElementById('setAllowOverride')?.checked;

    try {
      await store.updateProjectQualitySettings(projectId, {
        critical_bug_blocks_release,
        maximum_open_critical_bugs,
        high_bug_threshold,
        minimum_test_pass_rate,
        minimum_regression_pass_rate,
        minimum_coverage,
        maximum_blocked_tests,
        allow_release_override
      });

      this.closeModal();
      if (window.app && window.app.showToast) {
        window.app.showToast("Project Quality Policy updated!", "success");
      }
      this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), projectId);
    } catch (err) {
      console.error("Error saving policy:", err);
      if (window.app && window.app.showToast) {
        window.app.showToast("Failed to update policy: " + err.message, "error");
      }
    }
  },

  /**
   * Modal: Release Override Justification
   */
  openOverrideModal(releaseId, projectId) {
    const release = store.getReleaseById(releaseId);
    if (!release) return;

    const modalContainer = document.getElementById('globalModalContainer') || document.getElementById('prjModalContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <div class="p-5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                <i data-lucide="shield-alert" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-amber-950">Authorize Release Override</h3>
                <p class="text-xs text-amber-700">Audit-logged exception for ${release.name}</p>
              </div>
            </div>
            <button onclick="ReleasesView.closeModal()" class="p-1.5 hover:bg-amber-100 rounded-lg text-amber-600 transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="ReleasesView.handleOverrideSubmit(event, '${release.id}', '${projectId}')" class="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            
            <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 leading-relaxed">
              <strong>Caution:</strong> This release has failed automated quality gate rules. Overriding this release will record an immutable decision entry with your persona identity and justification.
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Mandatory Override Justification <span class="text-red-500">*</span>
              </label>
              <textarea id="overrideReasonText" rows="3" required placeholder="e.g. Critical bug BUG-102 was accepted by customer with hotfix scheduled for v2.4.1..."
                class="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"></textarea>
            </div>

            <div class="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button type="button" onclick="ReleasesView.closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition">
                Authorize Override
              </button>
            </div>

          </form>

        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  async handleOverrideSubmit(e, releaseId, projectId) {
    e.preventDefault();
    const reason = document.getElementById('overrideReasonText')?.value.trim();
    if (!reason) return;

    try {
      await store.recordReleaseDecision(releaseId, 'OVERRIDDEN', 'Manual gate override authorized', reason);
      this.closeModal();
      if (window.app && window.app.showToast) {
        window.app.showToast("Release overridden and audit decision logged.", "warning");
      }
      this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), projectId);
    } catch (err) {
      console.error("Error overriding release:", err);
      if (window.app && window.app.showToast) {
        window.app.showToast("Override failed: " + err.message, "error");
      }
    }
  },

  async markAsReleased(releaseId, projectId) {
    if (!confirm("Are you sure you want to mark this release as RELEASED to production?")) {
      return;
    }
    try {
      await store.updateRelease(releaseId, { status: 'RELEASED' });
      await store.recordReleaseDecision(releaseId, 'RELEASED', 'Release marked as successfully deployed');
      if (window.app && window.app.showToast) {
        window.app.showToast("Release marked as RELEASED!", "success");
      }
      this.render(document.getElementById('projectTabContent') || document.getElementById('mainContent'), projectId);
    } catch (err) {
      console.error("Error marking release as released:", err);
      if (window.app && window.app.showToast) {
        window.app.showToast("Failed to update status: " + err.message, "error");
      }
    }
  },

  closeModal() {
    const modalContainer = document.getElementById('globalModalContainer') || document.getElementById('prjModalContainer');
    if (modalContainer) modalContainer.innerHTML = '';
  }
};

if (typeof window !== 'undefined') window.ReleasesView = ReleasesView;
if (typeof module !== 'undefined' && module.exports) module.exports = ReleasesView;
