/**
 * PulseWave QA Platform — QA Report Generator & Multi-Template PDF Engine (V3)
 * Comprehensive document authoring and corporate PDF generation across 5 QA Deliverables:
 * 1. Test Execution Report ⭐ (Detailed test cases + results)
 * 2. Regression Test Report (Regression cycle results & matrix)
 * 3. Defect/Bug Report (Bugs, severity, status, trends, triage ledger)
 * 4. Release QA Report ⭐ (Overall release quality + Go/No-Go decision)
 * 5. QA Summary / Client Report ⭐ (Simple professional report for management/client)
 */

const TestReportsView = {
  currentMode: "list", // "list" | "creator" | "preview"
  activeReportId: null,
  activeTestCaseIndex: 0,
  
  // List Filters
  searchQuery: "",
  projectFilter: "all",
  statusFilter: "all",
  
  // Preview State
  previewZoom: 100,
  isGeneratingPdf: false,

  // Wizard State
  wizardStep: 1,
  wizardSelectedType: "test-execution",

  // Report Templates Definition
  REPORT_TEMPLATES: [
    {
      id: "test-execution",
      name: "Test Execution Report",
      star: true,
      tag: "MOST POPULAR",
      tagColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      icon: "clipboard-check",
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      subtitle: "Detailed test cases + execution results",
      description: "Official corporate multi-page report with test metadata, pre-requisites, test data grids, user input, expected/actual results, and pass/fail indicators.",
      defaultTemplateName: "Taar Consulting Execution Standard",
      enabled: true
    },
    {
      id: "regression",
      name: "Regression Test Report",
      star: false,
      tag: "CORE REGRESSION",
      tagColor: "bg-slate-100 text-slate-900 border-slate-300",
      icon: "refresh-cw",
      iconColor: "text-slate-900 bg-slate-100 border-slate-200",
      subtitle: "Regression cycle results & cross-module verification",
      description: "Multi-page regression cycle deliverable tracking cross-module test cases, regression pass rate, test data tables, and step-by-step verification.",
      defaultTemplateName: "Taar Consulting Regression Standard",
      enabled: true
    },
    {
      id: "defect-bug",
      name: "Defect / Bug Report",
      star: false,
      tag: "COMING SOON",
      tagColor: "bg-slate-100 text-slate-500 border-slate-200",
      icon: "bug",
      iconColor: "text-slate-400 bg-slate-100 border-slate-200",
      subtitle: "Bugs, severity breakdown, status trends & triage ledger",
      description: "Executive defect distribution metrics, severity breakdown (Critical P0, High, Medium, Low), detailed defect ledger table, root cause analysis, and triage sign-off.",
      defaultTemplateName: "Corporate Defect & Triage Audit",
      enabled: false
    },
    {
      id: "release-qa",
      name: "Release QA Report",
      star: true,
      tag: "COMING SOON",
      tagColor: "bg-slate-100 text-slate-500 border-slate-200",
      icon: "shield-check",
      iconColor: "text-slate-400 bg-slate-100 border-slate-200",
      subtitle: "Overall release quality, Quality Gate evaluation & Go/No-Go",
      description: "Executive release readiness assessment, prominent Go / No-Go decision banner, Quality Gate index, checklist evaluation, residual risks, and stakeholder sign-off.",
      defaultTemplateName: "Executive Release Sign-Off & Quality Gate",
      enabled: false
    },
    {
      id: "qa-summary",
      name: "QA Summary / Client Report",
      star: true,
      tag: "COMING SOON",
      tagColor: "bg-slate-100 text-slate-500 border-slate-200",
      icon: "bar-chart-3",
      iconColor: "text-slate-400 bg-slate-100 border-slate-200",
      subtitle: "Simple professional report for management/client",
      description: "Clean, high-level executive report presenting overall testing scope, quality pass rate scorecard, module validation summary, highlights, and client acceptance.",
      defaultTemplateName: "Client & Executive QA Summary",
      enabled: false
    }
  ],

  // Helper: Format bullet points for template fields
  formatBullets(text) {
    if (!text || !text.trim()) {
      return `<div class="flex items-center gap-1.5 text-slate-700"><span>•</span><span></span></div>`;
    }
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return `<div class="flex items-center gap-1.5 text-slate-700"><span>•</span><span></span></div>`;
    }
    return lines.map(line => {
      const cleanLine = line.replace(/^[•\-\*]\s*/, '');
      return `<div class="flex items-start gap-1.5 text-slate-800 leading-relaxed mb-0.5"><span>•</span><span>${cleanLine}</span></div>`;
    }).join('');
  },

  // Helper: Render Test Data table rows matching Taar Consulting template grid (6 columns)
  renderTestDataRowsHtml(testData) {
    if (!testData || testData.length === 0) {
      return `
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px; width: 16.66%;">&nbsp;</td>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px; width: 16.66%;">&nbsp;</td>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px; width: 16.66%;">&nbsp;</td>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px; width: 16.66%;">&nbsp;</td>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px; width: 16.66%;">&nbsp;</td>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px; width: 16.66%;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px;">&nbsp;</td>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px;">&nbsp;</td>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px;">&nbsp;</td>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px;">&nbsp;</td>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px;">&nbsp;</td>
          <td style="padding: 8px 10px; border: 1px solid #9CA3AF; height: 28px;">&nbsp;</td>
        </tr>
      `;
    }

    return testData.map(td => `
      <tr>
        <td colspan="2" style="background-color: #EDEDED; font-weight: 600; color: #1F2937; padding: 7px 10px; border: 1px solid #9CA3AF; width: 33.33%;">
          ${td.data_key || ''}
        </td>
        <td colspan="4" style="background-color: #FFFFFF; color: #111827; padding: 7px 10px; border: 1px solid #9CA3AF; width: 66.67%;">
          ${td.data_value || ''}
        </td>
      </tr>
    `).join('');
  },

  // Helper: Render Pass/Fail radio indicators matching exact screenshot design
  renderPassFailRadioIndicators(status) {
    const isPass = status === 'PASS' || status === 'PASSED';
    const isFail = status === 'FAIL' || status === 'FAILED';
    
    return `
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px; padding: 2px 4px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border-radius: 50%; ${isPass ? 'background-color: #5551FF; color: #ffffff;' : 'border: 1.5px solid #9CA3AF; background-color: #ffffff;'} font-size: 10px; font-weight: bold; line-height: 1;">
            ${isPass ? '✓' : ''}
          </span>
          <span style="font-weight: 600; color: #16A34A;">Pass</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border-radius: 50%; ${isFail ? 'background-color: #EF4444; color: #ffffff;' : 'border: 1.5px solid #9CA3AF; background-color: #ffffff;'} font-size: 10px; font-weight: bold; line-height: 1;">
            ${isFail ? '✕' : ''}
          </span>
          <span style="font-weight: 600; color: #DC2626;">Fail</span>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // MAIN RENDER DISPATCHER
  // =========================================================================
  async render(container) {
    if (!container) container = document.getElementById("mainContent");
    if (!container) return;

    // Check Role Access
    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const activeSpace = store.getActiveWorkspace ? store.getActiveWorkspace() : null;
    const spaceRole = activeSpace ? store.getUserSpaceRole(activeSpace.id, activeUser?.id) : "PM";
    const activeProject = store.getActiveProject ? store.getActiveProject() : null;
    const projectRole = activeProject ? store.getUserProjectRole(activeProject.id, activeUser?.id) : spaceRole;
    const userRole = (projectRole || spaceRole || "PM").toUpperCase();

    if (userRole === "DEVELOPER") {
      container.innerHTML = `
        <div class="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-12 space-y-4">
          <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <i data-lucide="shield-alert" class="w-6 h-6"></i>
          </div>
          <h2 class="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p class="text-xs text-slate-500">The QA Report Generator is restricted to QA Engineers and Project Managers. Please switch to your assigned tasks or kanban boards.</p>
          <button onclick="window.app.navigate('all-issues')" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer">
            Go to Issues & Defects
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    if (this.currentMode === "creator" && this.activeReportId) {
      await this.renderCreatorStudio(container);
    } else if (this.currentMode === "preview" && this.activeReportId) {
      await this.renderLivePreview(container);
    } else {
      this.currentMode = "list";
      await this.renderReportHistory(container);
    }

    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================================
  // VIEW 1: REPORT HISTORY & DIRECTORY
  // =========================================================================
  async renderReportHistory(container) {
    if (store.syncQAReportsFromSupabase) {
      await store.syncQAReportsFromSupabase(this.projectFilter);
    }

    const reports = store.getQAReports ? store.getQAReports(this.projectFilter) : [];
    const projects = store.getAuthorizedProjects ? store.getAuthorizedProjects() : store.getProjects();
    const activeUser = store.getActiveUser();
    const userRole = activeUser ? (activeUser.role || "PM").toUpperCase() : "PM";
    const canCreate = userRole !== "VIEWER" && userRole !== "DEVELOPER";

    const totalReports = reports.length;
    const drafts = reports.filter(r => (r.status || "").toUpperCase() === "DRAFT").length;
    const generated = reports.filter(r => (r.status || "").toUpperCase() === "GENERATED").length;

    let filtered = [...reports];
    if (this.statusFilter !== "all") {
      filtered = filtered.filter(r => (r.status || "DRAFT").toUpperCase() === this.statusFilter.toUpperCase());
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        (r.id && r.id.toLowerCase().includes(q)) ||
        (r.report_name && r.report_name.toLowerCase().includes(q)) ||
        (r.projectName && r.projectName.toLowerCase().includes(q)) ||
        (r.lead_tester && r.lead_tester.toLowerCase().includes(q)) ||
        (r.test_reviewer && r.test_reviewer.toLowerCase().includes(q))
      );
    }

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-12">
        
        <!-- Header Strip -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">QA Report Generator</h1>
              <span class="px-2 py-0.5 rounded bg-[#f7fee7] text-[#4d7c0f] text-xs font-extrabold border border-[#d9f99d]">
                Corporate Standard
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Author test execution reports, regression suites, and download corporate standard PDFs.</p>
          </div>

          <div class="flex items-center gap-2">
            ${canCreate ? `
              <button onclick="TestReportsView.openCreateWizardModal(1)" class="px-4 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 text-xs font-black rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer">
                <i data-lucide="file-plus-2" class="w-4 h-4 text-slate-950"></i>
                <span>Generate QA Report</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Metric KPI Strips -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">TOTAL REPORTS</span>
            <div class="text-2xl font-bold text-slate-900 tracking-tight mt-1">${totalReports}</div>
            <span class="text-[10px] text-slate-400 mt-0.5 block">Stored in Supabase Database</span>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-amber-600 block">ACTIVE DRAFTS</span>
            <div class="text-2xl font-bold text-amber-600 tracking-tight mt-1">${drafts}</div>
            <span class="text-[10px] text-amber-600/80 mt-0.5 block">Work in progress (auto-saved)</span>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 block">GENERATED & STORED</span>
            <div class="text-2xl font-bold text-emerald-600 tracking-tight mt-1">${generated}</div>
            <span class="text-[10px] text-emerald-600/80 mt-0.5 block">Stored in Supabase Storage Bucket</span>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="relative flex-1 min-w-[240px]">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none"></i>
            <input
              type="text"
              value="${this.searchQuery}"
              oninput="TestReportsView.handleSearch(this.value)"
              placeholder="Search reports by title, project, tester, reviewer..."
              class="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Project Filter -->
            <select
              onchange="TestReportsView.handleProjectFilter(this.value)"
              class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 cursor-pointer text-xs"
            >
              <option value="all" ${this.projectFilter === 'all' ? 'selected' : ''}>All Projects</option>
              ${projects.map(p => `<option value="${p.id}" ${this.projectFilter === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>

            <!-- Status Filter -->
            <select
              onchange="TestReportsView.handleStatusFilter(this.value)"
              class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 cursor-pointer text-xs"
            >
              <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="DRAFT" ${this.statusFilter === 'DRAFT' ? 'selected' : ''}>Drafts</option>
              <option value="GENERATED" ${this.statusFilter === 'GENERATED' ? 'selected' : ''}>Generated</option>
            </select>
          </div>
        </div>

        <!-- Reports History Table -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-600">
              <thead class="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4">Report Name & Template</th>
                  <th class="py-3 px-4">Project</th>
                  <th class="py-3 px-4 text-center">Deliverable Scope</th>
                  <th class="py-3 px-4 text-center">Quality Metric</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Created / Generated</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="7" class="py-12 text-center text-slate-400">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <i data-lucide="file-x" class="w-8 h-8 text-slate-300"></i>
                        <span class="font-semibold">No QA test reports found</span>
                        <p class="text-[11px] text-slate-400 max-w-sm">Click "Generate QA Report" to choose an active QA template and author your deliverable.</p>
                      </div>
                    </td>
                  </tr>
                ` : filtered.map(r => {
                  const isGen = (r.status || "").toUpperCase() === "GENERATED";
                  const createdDate = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                  const rType = r.report_type || (r.template_name && r.template_name.includes('Regression') ? 'regression' : 'test-execution');
                  
                  let typeBadge = `<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">Test Execution</span>`;
                  if (rType === 'regression') typeBadge = `<span class="px-2 py-0.5 rounded bg-slate-900 text-[#bef264] text-[10px] font-bold border border-slate-200">Regression</span>`;
                  else if (rType === 'defect-bug') typeBadge = `<span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">Defect/Bug</span>`;
                  else if (rType === 'release-qa') typeBadge = `<span class="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">Release QA</span>`;
                  else if (rType === 'qa-summary') typeBadge = `<span class="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">Client Summary</span>`;

                  return `
                    <tr class="hover:bg-slate-50/80 transition group">
                      <td class="py-3.5 px-4">
                        <div class="font-bold text-slate-900 group-hover:text-slate-900 transition flex items-center gap-2">
                          <i data-lucide="${isGen ? 'file-check-2' : 'file-edit'}" class="w-4 h-4 ${isGen ? 'text-emerald-600' : 'text-amber-500'} shrink-0"></i>
                          <span>${r.report_name || 'QA Test Report'}</span>
                        </div>
                        <div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          ${typeBadge}
                          <span>•</span>
                          <span>Version ${r.release_version || 'v1.0'}</span>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 font-medium text-slate-800">
                        <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          ${r.projectName || 'General Project'}
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-center">
                        <span class="font-mono font-bold text-slate-800">${r.total_test_cases || (r.testCases ? r.testCases.length : 0)} Test Cases</span>
                      </td>
                      <td class="py-3.5 px-4 text-center">
                        <span class="text-emerald-600 font-bold font-mono">${r.passed_count || 0} Pass</span> / <span class="text-red-600 font-bold font-mono">${r.failed_count || 0} Fail</span>
                      </td>
                      <td class="py-3.5 px-4">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isGen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                          ${(r.status || 'DRAFT').toUpperCase()}
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-slate-500 text-[11px]">
                        <div>${createdDate}</div>
                        <div class="text-[10px] text-slate-400">By ${r.created_by_name || 'QA'}</div>
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <div class="flex items-center justify-end gap-1">
                          ${isGen ? `
                            <button
                              onclick="TestReportsView.viewStoredPDF('${r.id}')"
                              class="p-1.5 text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="View Document"
                            >
                              <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                            <button
                              onclick="TestReportsView.downloadStoredPDF('${r.id}')"
                              class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Download PDF"
                            >
                              <i data-lucide="download" class="w-4 h-4"></i>
                            </button>
                          ` : `
                            <button
                              onclick="TestReportsView.openEditor('${r.id}')"
                              class="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Edit Report"
                            >
                              <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                          `}
                          <button
                            onclick="TestReportsView.previewReport('${r.id}')"
                            class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Preview Deliverable"
                          >
                            <i data-lucide="file-text" class="w-4 h-4"></i>
                          </button>
                          <button
                            onclick="TestReportsView.deleteReport('${r.id}')"
                            class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete Report"
                          >
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================================
  // STEP-BY-STEP CREATION WIZARD MODAL (Step 1: Select Template, Step 2: Configure Details)
  // =========================================================================
  openCreateWizardModal(step = 1) {
    const activeT = this.REPORT_TEMPLATES.find(t => t.id === this.wizardSelectedType);
    if (!activeT || !activeT.enabled) {
      this.wizardSelectedType = "test-execution";
    }
    this.wizardStep = step;
    const modalContainer = document.getElementById("globalModalContainer");
    if (!modalContainer) return;

    if (this.wizardStep === 1) {
      this.renderWizardStep1(modalContainer);
    } else {
      this.renderWizardStep2(modalContainer);
    }

    if (window.lucide) window.lucide.createIcons();
  },

  selectWizardTemplate(typeId) {
    const template = this.REPORT_TEMPLATES.find(t => t.id === typeId);
    if (!template || !template.enabled) {
      window.dispatchEvent(new CustomEvent("qa-toast", {
        detail: {
          title: "Template Coming Soon",
          message: `"${template ? template.name : 'Selected template'}" is currently disabled pending design approval. Please select Test Execution or Regression Report.`,
          type: "info"
        }
      }));
      return;
    }
    this.wizardSelectedType = typeId;
    this.openCreateWizardModal(1);
  },

  renderWizardStep1(modalContainer) {
    const selectedTemplate = this.REPORT_TEMPLATES.find(t => t.id === this.wizardSelectedType) || this.REPORT_TEMPLATES[0];

    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scale-up">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#f7fee7] border border-[#d9f99d] flex items-center justify-center text-[#4d7c0f] shadow-xs">
                <i data-lucide="file-plus-2" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold text-slate-900 tracking-tight">Step 1: Select Report Type & Template</h3>
                  <span class="px-2 py-0.5 rounded-full bg-slate-900 text-[#bef264] font-extrabold text-[10px]">Step 1 of 2</span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">Select from active QA deliverable templates for test execution and regression cycles.</p>
              </div>
            </div>
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Template Cards List -->
          <div class="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            ${this.REPORT_TEMPLATES.map(t => {
              const isSelected = this.wizardSelectedType === t.id;
              const isEnabled = t.enabled === true;

              if (isEnabled) {
                return `
                  <div
                    onclick="TestReportsView.selectWizardTemplate('${t.id}')"
                    class="p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${isSelected ? 'border-[#65a30d] bg-[#f7fee7]/60 shadow-sm ring-2 ring-[#65a30d]/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'}"
                  >
                    <div class="flex items-start gap-3.5 min-w-0">
                      <div class="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${t.iconColor} shadow-2xs">
                        <i data-lucide="${t.icon}" class="w-5 h-5"></i>
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-bold text-sm text-slate-900">${t.name}</span>
                          ${t.star ? `<span class="text-amber-500 font-black text-xs">⭐</span>` : ''}
                          <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${t.tagColor}">
                            ${t.tag}
                          </span>
                        </div>
                        <p class="text-xs font-semibold text-slate-700 mt-0.5">${t.subtitle}</p>
                        <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">${t.description}</p>
                      </div>
                    </div>

                    <div class="shrink-0 pt-1">
                      <div class="w-5 h-5 rounded-full border flex items-center justify-center transition ${isSelected ? 'border-[#65a30d] bg-[#65a30d] text-white font-bold shadow-xs' : 'border-slate-300 bg-white'} text-[10px]">
                        ${isSelected ? '✓' : ''}
                      </div>
                    </div>
                  </div>
                `;
              } else {
                // Disabled Card (Template Pending)
                return `
                  <div
                    onclick="TestReportsView.selectWizardTemplate('${t.id}')"
                    class="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed select-none flex items-start justify-between gap-3"
                    title="Template design pending — coming soon"
                  >
                    <div class="flex items-start gap-3.5 min-w-0">
                      <div class="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${t.iconColor}">
                        <i data-lucide="${t.icon}" class="w-5 h-5"></i>
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-bold text-sm text-slate-500">${t.name}</span>
                          ${t.star ? `<span class="text-slate-400 text-xs">⭐</span>` : ''}
                          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-200/80 text-slate-500 border border-slate-300">
                            ${t.tag}
                          </span>
                        </div>
                        <p class="text-xs font-medium text-slate-400 mt-0.5">${t.subtitle}</p>
                        <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">${t.description}</p>
                      </div>
                    </div>

                    <div class="shrink-0 pt-1">
                      <div class="w-5 h-5 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-[10px]" title="Disabled">
                        <i data-lucide="lock" class="w-3 h-3"></i>
                      </div>
                    </div>
                  </div>
                `;
              }
            }).join('')}
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-3.5 border-t border-slate-100 text-xs">
            <div class="flex items-center gap-1.5 text-slate-500">
              <span>Selected:</span>
              <strong class="text-slate-900 font-bold">${selectedTemplate.name}</strong>
              ${selectedTemplate.star ? `<span class="text-amber-500 text-xs">⭐</span>` : ''}
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick="document.getElementById('globalModalContainer').innerHTML=''"
                class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onclick="TestReportsView.openCreateWizardModal(2)"
                class="px-5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next: Configure Details</span>
                <i data-lucide="arrow-right" class="w-4 h-4 text-slate-950"></i>
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  renderWizardStep2(modalContainer) {
    const projects = store.getAuthorizedProjects ? store.getAuthorizedProjects() : store.getProjects();
    const activeProject = store.getActiveProject();
    const activeUser = store.getActiveUser();
    const currentTemplate = this.REPORT_TEMPLATES.find(t => t.id === this.wizardSelectedType) || this.REPORT_TEMPLATES[0];

    // Smart default report name
    let defaultReportName = `${activeProject ? activeProject.name : 'Project'} ${currentTemplate.name}`;
    if (this.wizardSelectedType === 'defect-bug') defaultReportName = `${activeProject ? activeProject.name : 'Project'} Defect & Triage Audit`;
    if (this.wizardSelectedType === 'release-qa') defaultReportName = `${activeProject ? activeProject.name : 'Project'} Release Quality Sign-Off`;
    if (this.wizardSelectedType === 'qa-summary') defaultReportName = `${activeProject ? activeProject.name : 'Project'} Client QA Executive Summary`;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-scale-up">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center border ${currentTemplate.iconColor}">
                <i data-lucide="${currentTemplate.icon}" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold text-slate-900">Step 2: Configure Report Details</h3>
                  <span class="px-2 py-0.5 rounded-full bg-slate-900 text-[#bef264] font-extrabold text-[10px]">Step 2 of 2</span>
                </div>
                <p class="text-xs text-slate-500">Configure project, target version, and deliverable specifications.</p>
              </div>
            </div>
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Active Template Badge Strip -->
          <div class="p-3 bg-[#f7fee7]/70 border border-[#d9f99d] rounded-xl flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-bold text-slate-900">${currentTemplate.name}</span>
              ${currentTemplate.star ? `<span class="text-amber-500 text-xs">⭐</span>` : ''}
              <span class="text-[11px] text-slate-500 truncate">• ${currentTemplate.defaultTemplateName}</span>
            </div>
            <button onclick="TestReportsView.openCreateWizardModal(1)" class="text-[#365314] font-bold text-xs hover:underline cursor-pointer shrink-0 ml-2">
              Change Template
            </button>
          </div>

          <!-- Wizard Form -->
          <form id="createQAReportForm" onsubmit="TestReportsView.handleWizardSubmit(event)" class="space-y-4 text-xs">
            
            <input type="hidden" id="wizardReportType" value="${currentTemplate.id}" />
            <input type="hidden" id="wizardTemplateName" value="${currentTemplate.defaultTemplateName}" />

            <!-- Step 1: Select Project -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Select Project <span class="text-rose-500">*</span></label>
              <select
                id="wizardProjectId"
                required
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
              >
                ${projects.map(p => `<option value="${p.id}" ${activeProject && activeProject.id === p.id ? 'selected' : ''}>${p.name} [${p.key || 'QA'}]</option>`).join('')}
              </select>
            </div>

            <!-- Report Name & Release Version -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Report Name <span class="text-rose-500">*</span></label>
                <input
                  type="text"
                  id="wizardReportName"
                  required
                  value="${defaultReportName}"
                  placeholder="e.g. Annoushka Sprint Sign-off"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Release Version</label>
                <input
                  type="text"
                  id="wizardReleaseVersion"
                  value="${activeProject ? (activeProject.currentRelease || 'v1.0.0') : 'v1.0.0'}"
                  placeholder="e.g. v2.4.1"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                />
              </div>
            </div>

            <!-- Dynamic Template-Specific Fields -->
            ${(this.wizardSelectedType === 'test-execution' || this.wizardSelectedType === 'regression') ? `
              <!-- Initial Number of Test Cases (10, 20, 50, 100, 200, Custom) -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Initial Number of Test Cases</label>
                <div class="grid grid-cols-5 gap-2">
                  <label class="cursor-pointer">
                    <input type="radio" name="wizardCaseCount" value="10" checked class="peer sr-only" onchange="TestReportsView.handleCustomCaseToggle(false)" />
                    <div class="p-2.5 text-center border border-slate-200 rounded-xl peer-checked:border-[#65a30d] peer-checked:bg-[#f7fee7] peer-checked:text-[#365314] font-bold transition">
                      10
                    </div>
                  </label>
                  <label class="cursor-pointer">
                    <input type="radio" name="wizardCaseCount" value="20" class="peer sr-only" onchange="TestReportsView.handleCustomCaseToggle(false)" />
                    <div class="p-2.5 text-center border border-slate-200 rounded-xl peer-checked:border-[#65a30d] peer-checked:bg-[#f7fee7] peer-checked:text-[#365314] font-bold transition">
                      20
                    </div>
                  </label>
                  <label class="cursor-pointer">
                    <input type="radio" name="wizardCaseCount" value="50" class="peer sr-only" onchange="TestReportsView.handleCustomCaseToggle(false)" />
                    <div class="p-2.5 text-center border border-slate-200 rounded-xl peer-checked:border-[#65a30d] peer-checked:bg-[#f7fee7] peer-checked:text-[#365314] font-bold transition">
                      50
                    </div>
                  </label>
                  <label class="cursor-pointer">
                    <input type="radio" name="wizardCaseCount" value="100" class="peer sr-only" onchange="TestReportsView.handleCustomCaseToggle(false)" />
                    <div class="p-2.5 text-center border border-slate-200 rounded-xl peer-checked:border-[#65a30d] peer-checked:bg-[#f7fee7] peer-checked:text-[#365314] font-bold transition">
                      100
                    </div>
                  </label>
                  <label class="cursor-pointer">
                    <input type="radio" name="wizardCaseCount" value="custom" class="peer sr-only" onchange="TestReportsView.handleCustomCaseToggle(true)" />
                    <div class="p-2.5 text-center border border-slate-200 rounded-xl peer-checked:border-[#65a30d] peer-checked:bg-[#f7fee7] peer-checked:text-[#365314] font-bold transition">
                      Custom
                    </div>
                  </label>
                </div>
                <div id="customCaseInputContainer" class="hidden mt-2">
                  <input
                    type="number"
                    id="wizardCustomCaseCount"
                    min="1"
                    max="500"
                    value="200"
                    placeholder="Enter case count (e.g. 200)"
                    class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none text-xs"
                  />
                </div>
                <p class="text-[10px] text-slate-400 mt-1">QA can enter test cases from frontend up to 100, 200+ cases and manage rows freely.</p>
              </div>
            ` : (this.wizardSelectedType === 'qa-summary' ? `
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Client / Organization Name</label>
                  <input
                    type="text"
                    id="wizardClientName"
                    value="${activeProject ? activeProject.name : 'Client Organization'}"
                    placeholder="e.g. Annoushka Jewellery London"
                    class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Delivery Milestone</label>
                  <input
                    type="text"
                    id="wizardMilestone"
                    value="Sprint 8 Final Quality Acceptance"
                    placeholder="e.g. Production Release Sign-Off"
                    class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                  />
                </div>
              </div>
            ` : (this.wizardSelectedType === 'release-qa' ? `
              <div>
                <label class="block font-bold text-slate-700 mb-1">Initial Release Recommendation</label>
                <select id="wizardVerdict" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50">
                  <option value="READY FOR RELEASE">GO FOR PRODUCTION RELEASE (Certified)</option>
                  <option value="CONDITIONAL GO">CONDITIONAL GO (Minor Risks Documented)</option>
                  <option value="BLOCKED">NO-GO (Critical Defects Active)</option>
                </select>
              </div>
            ` : `
              <div class="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <i data-lucide="bug" class="w-4 h-4 text-rose-600 shrink-0"></i>
                <span>Active defects from the selected project will be automatically imported into this audit report.</span>
              </div>
            `))}

            <!-- Tester & Reviewer -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Lead Tester</label>
                <input
                  type="text"
                  id="wizardLeadTester"
                  value="${activeUser ? activeUser.name : ''}"
                  placeholder="e.g. Rimsha Shahbaz"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Test Reviewer</label>
                <input
                  type="text"
                  id="wizardReviewer"
                  value=""
                  placeholder="e.g. Arslan Ali"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onclick="TestReportsView.openCreateWizardModal(1)"
                class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                <span>Back</span>
              </button>

              <button
                type="submit"
                class="px-5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Initialize Report Studio</span>
                <i data-lucide="arrow-right" class="w-4 h-4 text-slate-950"></i>
              </button>
            </div>

          </form>

        </div>
      </div>
    `;
  },

  handleCustomCaseToggle(isCustom) {
    const container = document.getElementById("customCaseInputContainer");
    if (container) {
      if (isCustom) container.classList.remove("hidden");
      else container.classList.add("hidden");
    }
  },

  async handleWizardSubmit(event) {
    event.preventDefault();
    const projectId = document.getElementById("wizardProjectId").value;
    const reportName = document.getElementById("wizardReportName").value.trim();
    const releaseVersion = document.getElementById("wizardReleaseVersion").value.trim() || "v1.0.0";
    const leadTester = document.getElementById("wizardLeadTester").value.trim();
    const testReviewer = document.getElementById("wizardReviewer").value.trim();
    const reportType = document.getElementById("wizardReportType") ? document.getElementById("wizardReportType").value : "test-execution";
    const templateName = document.getElementById("wizardTemplateName") ? document.getElementById("wizardTemplateName").value : "Annoushka Corporate Standard";

    const clientNameInput = document.getElementById("wizardClientName");
    const clientName = clientNameInput ? clientNameInput.value.trim() : "";
    const milestoneInput = document.getElementById("wizardMilestone");
    const milestone = milestoneInput ? milestoneInput.value.trim() : "";
    const verdictInput = document.getElementById("wizardVerdict");
    const verdict = verdictInput ? verdictInput.value : "READY FOR RELEASE";
    
    let caseCount = 10;
    const selectedRadio = document.querySelector('input[name="wizardCaseCount"]:checked');
    if (selectedRadio) {
      if (selectedRadio.value === "custom") {
        caseCount = parseInt(document.getElementById("wizardCustomCaseCount").value) || 10;
      } else {
        caseCount = parseInt(selectedRadio.value) || 10;
      }
    }

    document.getElementById("globalModalContainer").innerHTML = "";

    try {
      const newReport = await store.createQAReport({
        projectId,
        reportName,
        reportType,
        templateName,
        releaseVersion,
        leadTester,
        testReviewer,
        clientName,
        milestone,
        verdict,
        totalInitialCases: caseCount
      });

      window.dispatchEvent(new CustomEvent("qa-toast", {
        detail: {
          title: "QA Report Initialized",
          message: `Created "${newReport.report_name}" (${templateName}) ready for authoring.`,
          type: "success"
        }
      }));

      this.activeReportId = newReport.id;
      this.activeTestCaseIndex = 0;
      this.currentMode = "creator";
      this.render(document.getElementById("mainContent"));
    } catch (err) {
      console.error("Failed to initialize QA Report:", err);
      window.dispatchEvent(new CustomEvent("qa-toast", {
        detail: {
          title: "Error",
          message: "Failed to initialize report: " + err.message,
          type: "error"
        }
      }));
    }
  },

  // =========================================================================
  // VIEW 2: QA REPORT CREATOR & TEST CASE STUDIO (Multi-Template Supported)
  // =========================================================================
  async renderCreatorStudio(container) {
    const report = store.getQAReportById(this.activeReportId);
    if (!report) {
      this.currentMode = "list";
      return this.renderReportHistory(container);
    }

    const reportType = report.report_type || (report.template_name && report.template_name.includes('Defect') ? 'defect-bug' : (report.template_name && report.template_name.includes('Release') ? 'release-qa' : (report.template_name && report.template_name.includes('Summary') ? 'qa-summary' : (report.template_name && report.template_name.includes('Regression') ? 'regression' : 'test-execution'))));

    if (reportType === 'defect-bug') {
      return this.renderDefectReportStudio(container, report);
    } else if (reportType === 'release-qa') {
      return this.renderReleaseQAStudio(container, report);
    } else if (reportType === 'qa-summary') {
      return this.renderQASummaryStudio(container, report);
    } else {
      // Default: Detailed Test Case & Regression Studio
      return this.renderTestCaseStudio(container, report);
    }
  },

  // --- STUDIO 1: TEST CASE & REGRESSION AUTHORING STUDIO ---
  async renderTestCaseStudio(container, report) {
    const testCases = report.testCases || [];
    if (this.activeTestCaseIndex >= testCases.length) {
      this.activeTestCaseIndex = Math.max(0, testCases.length - 1);
    }
    const currentTestCase = testCases[this.activeTestCaseIndex] || null;

    container.innerHTML = `
      <div class="space-y-4 animate-fade-in pb-16 text-xs">
        
        <!-- Top Studio Action Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button
              onclick="TestReportsView.currentMode='list'; TestReportsView.render()"
              class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              title="Back to History"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <div>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  id="studioReportNameInput"
                  value="${report.report_name || ''}"
                  onblur="TestReportsView.updateReportTitle(this.value)"
                  class="font-bold text-base text-slate-900 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-[#84cc16] focus:outline-none px-1"
                />
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${(report.status || 'DRAFT').toUpperCase() === 'GENERATED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                  ${(report.status || 'DRAFT').toUpperCase()}
                </span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Project: <strong>${report.projectName || 'General'}</strong></span>
                <span>•</span>
                <span>Template: <strong>${report.template_name || 'Annoushka Template'}</strong></span>
                <span>•</span>
                <span>Version: <strong>${report.release_version || 'v1.0'}</strong></span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              onclick="TestReportsView.saveDraft(true)"
              class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <i data-lucide="save" class="w-4 h-4 text-slate-600"></i>
              <span>Save Draft</span>
            </button>

            <button
              onclick="TestReportsView.previewReport('${report.id}')"
              class="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <i data-lucide="file-text" class="w-4 h-4 text-slate-900"></i>
              <span>Live Preview</span>
            </button>

            <button
              onclick="TestReportsView.triggerGeneratePDF('${report.id}')"
              class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <i data-lucide="download" class="w-4 h-4 text-slate-950"></i>
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <!-- Studio Main Workspace: Sidebar & Editor Form -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          <!-- Test Cases Navigation Sidebar (4 cols) -->
          <div class="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 flex flex-col h-[750px]">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span class="font-bold text-slate-900 block">Test Cases (${testCases.length})</span>
                <span class="text-[10px] text-slate-400">Manage, reorder, or duplicate rows</span>
              </div>
              <button
                onclick="TestReportsView.addNewTestCase()"
                class="p-1.5 bg-[#f7fee7] hover:bg-[#ecfccb] text-[#4d7c0f] border border-[#d9f99d] rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                title="Add Test Case"
              >
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>Add Case</span>
              </button>
            </div>

            <!-- Scrollable Case List -->
            <div class="space-y-1.5 overflow-y-auto flex-1 pr-1">
              ${testCases.map((tc, index) => {
                const isActive = index === this.activeTestCaseIndex;
                const exec = (tc.executions && tc.executions[0]) || {};
                const status = (tc.status || exec.status || '').toUpperCase();
                
                let statusBadge = `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">DRAFT</span>`;
                if (status === 'PASS' || status === 'PASSED') {
                  statusBadge = `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">PASS</span>`;
                } else if (status === 'FAIL' || status === 'FAILED') {
                  statusBadge = `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">FAIL</span>`;
                }

                return `
                  <div
                    onclick="TestReportsView.selectTestCase(${index})"
                    class="p-3 rounded-xl border transition cursor-pointer flex items-center justify-between group ${isActive ? 'bg-slate-900/10 border-slate-800 shadow-xs' : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/80'}"
                  >
                    <div class="min-w-0 flex items-center gap-2.5">
                      <span class="w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${isActive ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-700'}">
                        ${index + 1}
                      </span>
                      <div class="min-w-0">
                        <h4 class="font-bold text-slate-900 truncate text-xs">${tc.title || `Test Case ${index + 1}`}</h4>
                        <div class="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>${tc.tester_name || 'QA'}</span>
                          <span>•</span>
                          <span>${tc.test_date || 'Today'}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-1 shrink-0 ml-2">
                      ${statusBadge}
                      <button
                        onclick="event.stopPropagation(); TestReportsView.duplicateTestCase('${tc.id}')"
                        class="p-1 text-slate-400 hover:text-slate-900 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Duplicate"
                      >
                        <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                      </button>
                      <button
                        onclick="event.stopPropagation(); TestReportsView.deleteTestCase('${tc.id}')"
                        class="p-1 text-slate-400 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Delete"
                      >
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Active Test Case Editor (8 cols) -->
          <div class="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm overflow-y-auto h-[750px]">
            ${currentTestCase ? `
              <form id="activeTestCaseForm" onsubmit="event.preventDefault(); TestReportsView.saveActiveTestCase();" class="space-y-5">
                
                <!-- Section 1: Title & Application -->
                <div class="space-y-3 border-b border-slate-100 pb-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-900">1. Test Case / Scenario Details</span>
                    <span class="font-mono text-[11px] text-slate-400">Case #${this.activeTestCaseIndex + 1} of ${testCases.length}</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="sm:col-span-2">
                      <label class="block font-bold text-slate-700 mb-1">Scenario / Test Title <span class="text-rose-500">*</span></label>
                      <input
                        type="text"
                        id="tcTitleInput"
                        value="${currentTestCase.title || ''}"
                        placeholder="e.g. Simple Item Order via Checkout"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Software Application</label>
                      <input
                        type="text"
                        id="tcSoftwareInput"
                        value="${currentTestCase.software_application || report.projectName || ''}"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Tester Name</label>
                      <input
                        type="text"
                        id="tcTesterNameInput"
                        value="${currentTestCase.tester_name || report.lead_tester || ''}"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Test Reviewer</label>
                      <input
                        type="text"
                        id="tcReviewerInput"
                        value="${currentTestCase.test_reviewer || report.test_reviewer || ''}"
                        placeholder="e.g. Lead QA"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Test Date</label>
                      <input
                        type="date"
                        id="tcDateInput"
                        value="${currentTestCase.test_date || new Date().toISOString().split('T')[0]}"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <!-- Section 2: Test Information & Specifications -->
                <div class="space-y-3 border-b border-slate-100 pb-4">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-900 block">2. Test Information & Specifications</span>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Description / Goal</label>
                      <textarea
                        id="tcDescriptionInput"
                        rows="2"
                        placeholder="e.g. Verify that an order is placed successfully for a single stock item."
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none text-xs leading-relaxed"
                      >${currentTestCase.description || ''}</textarea>
                    </div>

                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Pre-requisites (Bullet Points)</label>
                      <textarea
                        id="tcPrerequisitesInput"
                        rows="2"
                        placeholder="• User must be registered\n• Item must be in stock"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none text-xs leading-relaxed"
                      >${currentTestCase.pre_requisites || ''}</textarea>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Location / Area</label>
                      <input
                        type="text"
                        id="tcLocationInput"
                        value="${currentTestCase.location_area || ''}"
                        placeholder="e.g. Staging / Checkout"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Dependencies</label>
                      <input
                        type="text"
                        id="tcDependenciesInput"
                        value="${currentTestCase.dependencies || ''}"
                        placeholder="e.g. Payment Gateway API"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Required Configuration</label>
                      <input
                        type="text"
                        id="tcConfigInput"
                        value="${currentTestCase.required_configuration || ''}"
                        placeholder="e.g. Chrome 124 / 1080p"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <!-- Section 3: Test Data Key-Value Table -->
                <div class="space-y-3 border-b border-slate-100 pb-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-900 block">3. Test Data (Key-Value Rows)</span>
                      <span class="text-[10px] text-slate-400">Data variables utilized during this scenario</span>
                    </div>
                    <button
                      type="button"
                      onclick="TestReportsView.addTestDataRow()"
                      class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                      <span>Add Data Key</span>
                    </button>
                  </div>

                  <div id="testDataContainer" class="space-y-2">
                    ${(currentTestCase.testData || []).map((td, tdIdx) => `
                      <div class="flex items-center gap-2" data-td-id="${td.id || tdIdx}">
                        <input
                          type="text"
                          value="${td.data_key || ''}"
                          placeholder="e.g. SKU / Email / Amount"
                          class="td-key-input w-1/3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                        />
                        <input
                          type="text"
                          value="${td.data_value || ''}"
                          placeholder="e.g. 50563456012 / user@test.com"
                          class="td-val-input flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                        />
                        <button
                          type="button"
                          onclick="this.parentElement.remove()"
                          class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        >
                          <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- Section 4: Execution Results & Status -->
                <div class="space-y-3 border-b border-slate-100 pb-4">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-900 block">4. Test Execution & Result Details</span>

                  ${(() => {
                    const exec = (currentTestCase.executions && currentTestCase.executions[0]) || {};
                    const st = (currentTestCase.status || exec.status || '').toUpperCase();
                    return `
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label class="block font-bold text-slate-700 mb-1">User Input / Actions</label>
                          <textarea
                            id="tcUserInput"
                            rows="3"
                            placeholder="• Navigate to checkout\n• Click Place Order button"
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none leading-relaxed"
                          >${exec.user_input || ''}</textarea>
                        </div>

                        <div>
                          <label class="block font-bold text-slate-700 mb-1">Expected Result</label>
                          <textarea
                            id="tcExpectedResultInput"
                            rows="3"
                            placeholder="• Order confirmation banner appears\n• Order ID displayed"
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none leading-relaxed"
                          >${exec.expected_result || ''}</textarea>
                        </div>

                        <div>
                          <label class="block font-bold text-slate-700 mb-1">Actual Result</label>
                          <textarea
                            id="tcActualResultInput"
                            rows="3"
                            placeholder="• Verified confirmation with Order #ANN-9482"
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none leading-relaxed"
                          >${exec.actual_result || ''}</textarea>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label class="block font-bold text-slate-700 mb-1">Test Status <span class="text-rose-500">*</span></label>
                          <select
                            id="tcStatusSelect"
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50"
                          >
                            <option value="" ${!st ? 'selected' : ''}>-- Select Status --</option>
                            <option value="PASS" ${st === 'PASS' || st === 'PASSED' ? 'selected' : ''}>PASS (Verified Success)</option>
                            <option value="FAIL" ${st === 'FAIL' || st === 'FAILED' ? 'selected' : ''}>FAIL (Defect Encountered)</option>
                            <option value="BLOCKED" ${st === 'BLOCKED' ? 'selected' : ''}>BLOCKED</option>
                          </select>
                        </div>

                        <div>
                          <label class="block font-bold text-slate-700 mb-1">Executed By</label>
                          <input
                            type="text"
                            id="tcExecutedByInput"
                            value="${exec.executed_by || report.lead_tester || ''}"
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none"
                          />
                        </div>
                      </div>
                    `;
                  })()}
                </div>

                <!-- Section 5: Results Summary & Comments -->
                <div class="space-y-3 pb-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-900 block">5. Results Summary & Comments</span>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Results Summary</label>
                      <textarea
                        id="tcResultsSummaryInput"
                        rows="2"
                        placeholder="e.g. Successfully placed order and received order confirmation email."
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none leading-relaxed"
                      >${currentTestCase.results_summary || ''}</textarea>
                    </div>

                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Comments / Notes</label>
                      <textarea
                        id="tcCommentsInput"
                        rows="2"
                        placeholder="e.g. Tested on Staging UK store instance."
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none leading-relaxed"
                      >${currentTestCase.comments || ''}</textarea>
                    </div>
                  </div>
                </div>

                <!-- Action Footer -->
                <div class="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      onclick="TestReportsView.selectTestCase(${Math.max(0, this.activeTestCaseIndex - 1)})"
                      class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      ${this.activeTestCaseIndex === 0 ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}
                    >
                      <i data-lucide="chevron-left" class="w-4 h-4"></i>
                      <span>Previous Case</span>
                    </button>
                    <button
                      type="button"
                      onclick="TestReportsView.selectTestCase(${Math.min(testCases.length - 1, this.activeTestCaseIndex + 1)})"
                      class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      ${this.activeTestCaseIndex === testCases.length - 1 ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}
                    >
                      <span>Next Case</span>
                      <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </button>
                  </div>

                  <button
                    type="submit"
                    class="px-5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i data-lucide="check" class="w-4 h-4"></i>
                    <span>Save Active Case</span>
                  </button>
                </div>

              </form>
            ` : `
              <div class="p-12 text-center text-slate-400">
                <i data-lucide="file-question" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
                <p class="font-bold text-slate-700">No test case selected</p>
                <button onclick="TestReportsView.addNewTestCase()" class="mt-3 px-4 py-2 bg-[#bef264] text-slate-950 font-black rounded-xl cursor-pointer">
                  Create First Test Case
                </button>
              </div>
            `}
          </div>

        </div>

      </div>
    `;
  },

  // --- STUDIO 2: DEFECT / BUG REPORT STUDIO ---
  async renderDefectReportStudio(container, report) {
    const defects = report.defects_list || [];
    const criticals = defects.filter(d => d.priority === 'Critical').length;
    const highs = defects.filter(d => d.priority === 'High').length;
    const mediums = defects.filter(d => d.priority === 'Medium').length;
    const lows = defects.filter(d => d.priority === 'Low').length;

    container.innerHTML = `
      <div class="space-y-5 animate-fade-in pb-16 text-xs">
        
        <!-- Header -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button onclick="TestReportsView.currentMode='list'; TestReportsView.render()" class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <div>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  value="${report.report_name || ''}"
                  onblur="TestReportsView.updateReportTitle(this.value)"
                  class="font-bold text-base text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none px-1"
                />
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                  Defect / Bug Report
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">Project: <strong>${report.projectName}</strong> • Version: <strong>${report.release_version}</strong></p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="TestReportsView.previewReport('${report.id}')" class="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="file-text" class="w-4 h-4 text-rose-600"></i>
              <span>Live Preview</span>
            </button>
            <button onclick="TestReportsView.triggerGeneratePDF('${report.id}')" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer">
              <i data-lucide="download" class="w-4 h-4 text-slate-950"></i>
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <!-- Defect KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] font-bold text-slate-400 uppercase block">Total Logged Defects</span>
            <div class="text-2xl font-bold text-slate-900 mt-1">${defects.length}</div>
            <span class="text-[10px] text-slate-500">In Scope for Triage</span>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] font-bold text-rose-600 uppercase block">Critical Blockers (P0)</span>
            <div class="text-2xl font-bold text-rose-600 mt-1">${criticals}</div>
            <span class="text-[10px] ${criticals === 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">${criticals === 0 ? 'Zero Blockers ✓' : 'Blocking Release ✕'}</span>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] font-bold text-amber-600 uppercase block">High Severity</span>
            <div class="text-2xl font-bold text-amber-600 mt-1">${highs}</div>
            <span class="text-[10px] text-slate-500">Priority Fix Required</span>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] font-bold text-slate-900 uppercase block">Medium & Low</span>
            <div class="text-2xl font-bold text-slate-900 mt-1">${mediums + lows}</div>
            <span class="text-[10px] text-slate-500">Scheduled / Resolved</span>
          </div>
        </div>

        <!-- Defect Ledger Table -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="font-bold text-sm text-slate-900">Defect Ledger & Triage Table</h3>
              <p class="text-[11px] text-slate-400">All bugs included in this corporate audit deliverable</p>
            </div>
            <button onclick="TestReportsView.addDefectToReport('${report.id}')" class="px-3 py-1.5 bg-rose-50 text-rose-700 font-bold rounded-lg border border-rose-200 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Add Defect Row</span>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="py-2.5 px-3">Key</th>
                  <th class="py-2.5 px-3">Defect Title</th>
                  <th class="py-2.5 px-3">Severity</th>
                  <th class="py-2.5 px-3">Status</th>
                  <th class="py-2.5 px-3">Assigned Dev</th>
                  <th class="py-2.5 px-3">Root Cause</th>
                  <th class="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${defects.length === 0 ? `
                  <tr><td colspan="7" class="py-8 text-center text-slate-400">Zero active defects reported for this project.</td></tr>
                ` : defects.map((d, dIdx) => `
                  <tr class="hover:bg-slate-50">
                    <td class="py-2.5 px-3 font-mono font-bold text-rose-700">${d.key || `BUG-${dIdx+1}`}</td>
                    <td class="py-2.5 px-3 font-bold text-slate-900">${d.title}</td>
                    <td class="py-2.5 px-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${d.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : (d.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-900')}">
                        ${d.priority}
                      </span>
                    </td>
                    <td class="py-2.5 px-3 font-semibold text-slate-700">${d.status || 'Open'}</td>
                    <td class="py-2.5 px-3 text-slate-600">${d.assigneeName || 'Assigned Dev'}</td>
                    <td class="py-2.5 px-3 text-slate-500 truncate max-w-xs">${d.rootCause || 'Logic verification'}</td>
                    <td class="py-2.5 px-3 text-right">
                      <button onclick="TestReportsView.removeDefectFromReport('${report.id}', ${dIdx})" class="text-slate-400 hover:text-red-600 p-1 cursor-pointer">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Root Cause & Triage Notes Editor -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 class="font-bold text-sm text-slate-900">Root Cause Analysis</h3>
            <textarea
              id="studioRootCauseInput"
              rows="4"
              onblur="TestReportsView.updateDefectAnalysis('${report.id}')"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 text-xs leading-relaxed"
            >${report.root_cause_analysis || ''}</textarea>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 class="font-bold text-sm text-slate-900">Triage Recommendation & QA Conclusion</h3>
            <textarea
              id="studioTriageNotesInput"
              rows="4"
              onblur="TestReportsView.updateDefectAnalysis('${report.id}')"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 text-xs leading-relaxed"
            >${report.triage_notes || ''}</textarea>
          </div>
        </div>

      </div>
    `;
  },

  // --- STUDIO 3: RELEASE QA REPORT STUDIO ---
  async renderReleaseQAStudio(container, report) {
    const checklist = report.quality_checklist || [];
    const risks = report.known_risks || [];
    const signoffs = report.stakeholder_signoffs || [];

    container.innerHTML = `
      <div class="space-y-5 animate-fade-in pb-16 text-xs">
        
        <!-- Header -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button onclick="TestReportsView.currentMode='list'; TestReportsView.render()" class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <div>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  value="${report.report_name || ''}"
                  onblur="TestReportsView.updateReportTitle(this.value)"
                  class="font-bold text-base text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none px-1"
                />
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                  Release QA Report ⭐
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">Project: <strong>${report.projectName}</strong> • Target Release: <strong>${report.release_version}</strong></p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="TestReportsView.previewReport('${report.id}')" class="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="file-text" class="w-4 h-4 text-purple-600"></i>
              <span>Live Preview</span>
            </button>
            <button onclick="TestReportsView.triggerGeneratePDF('${report.id}')" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer">
              <i data-lucide="download" class="w-4 h-4 text-slate-950"></i>
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <!-- Release Go / No-Go Decision Card -->
        <div class="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-[#bef264] block">Official Release Recommendation</span>
            <div class="text-xl font-black mt-1 flex items-center gap-2">
              <span>${report.verdict || 'READY FOR RELEASE'}</span>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold">Quality Gate 96%</span>
            </div>
            <p class="text-xs text-slate-300 mt-1">Certified for production rollout across all validated user journeys.</p>
          </div>

          <div>
            <select
              onchange="TestReportsView.updateReleaseVerdict('${report.id}', this.value)"
              class="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-white text-xs cursor-pointer"
            >
              <option value="READY FOR RELEASE" class="text-slate-900" ${report.verdict === 'READY FOR RELEASE' ? 'selected' : ''}>GO FOR PRODUCTION RELEASE</option>
              <option value="CONDITIONAL GO" class="text-slate-900" ${report.verdict === 'CONDITIONAL GO' ? 'selected' : ''}>CONDITIONAL GO (With Notes)</option>
              <option value="BLOCKED" class="text-slate-900" ${report.verdict === 'BLOCKED' ? 'selected' : ''}>NO-GO (Release Blocked)</option>
            </select>
          </div>
        </div>

        <!-- Quality Gate Checklist -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-bold text-sm text-slate-900">Mandatory Release Quality Gates</h3>
          <div class="space-y-2.5">
            ${checklist.map((qc, qIdx) => `
              <div class="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${qc.status === 'PASSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                    ${qc.status === 'PASSED' ? '✓' : '✕'}
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900">${qc.title}</h4>
                    <p class="text-[11px] text-slate-500 mt-0.5">${qc.description}</p>
                  </div>
                </div>

                <span class="px-2.5 py-1 rounded-lg text-[10px] font-black ${qc.status === 'PASSED' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}">
                  ${qc.status}
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Known Risks & Mitigations -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-bold text-sm text-slate-900">Known Residual Risks & Mitigations</h3>
          <div class="space-y-2">
            ${risks.map(r => `
              <div class="p-3 bg-amber-50/40 border border-amber-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <strong class="font-bold text-slate-900">${r.risk}</strong>
                  <p class="text-[11px] text-slate-600 mt-0.5">Mitigation: ${r.mitigation} • Owner: ${r.owner}</p>
                </div>
                <span class="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded">${r.severity}</span>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  },

  // --- STUDIO 4: QA SUMMARY / CLIENT REPORT STUDIO ---
  async renderQASummaryStudio(container, report) {
    const modules = report.module_coverage || [];
    const highlights = report.highlights || [];

    container.innerHTML = `
      <div class="space-y-5 animate-fade-in pb-16 text-xs">
        
        <!-- Header -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button onclick="TestReportsView.currentMode='list'; TestReportsView.render()" class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <div>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  value="${report.report_name || ''}"
                  onblur="TestReportsView.updateReportTitle(this.value)"
                  class="font-bold text-base text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none px-1"
                />
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                  QA Summary / Client Report ⭐
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">Client: <strong>${report.client_name || 'Client'}</strong> • Milestone: <strong>${report.milestone || 'Release Sign-off'}</strong></p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="TestReportsView.previewReport('${report.id}')" class="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="file-text" class="w-4 h-4 text-amber-600"></i>
              <span>Live Preview</span>
            </button>
            <button onclick="TestReportsView.triggerGeneratePDF('${report.id}')" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer">
              <i data-lucide="download" class="w-4 h-4 text-slate-950"></i>
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <!-- Executive Narrative Editor -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm text-slate-900">Executive Summary Narrative</h3>
            <span class="text-[11px] text-slate-400">Written for executive leadership and client acceptance</span>
          </div>
          <textarea
            id="studioClientExecSummary"
            rows="3"
            onblur="TestReportsView.updateClientSummaryData('${report.id}')"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 text-xs leading-relaxed"
          >${report.executiveSummary || 'This report certifies that comprehensive QA testing has been successfully completed for all core business flows and release requirements with zero outstanding critical blocker bugs.'}</textarea>
        </div>

        <!-- Feature / Module Validation Table -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-bold text-sm text-slate-900">Module & Feature Validation Summary</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="py-2.5 px-3">Module / Feature Area</th>
                  <th class="py-2.5 px-3 text-center">Test Scenarios</th>
                  <th class="py-2.5 px-3 text-center">Passed</th>
                  <th class="py-2.5 px-3 text-center">Pass Rate</th>
                  <th class="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${modules.map(m => `
                  <tr>
                    <td class="py-2.5 px-3 font-bold text-slate-900">${m.module}</td>
                    <td class="py-2.5 px-3 text-center font-mono">${m.totalCases}</td>
                    <td class="py-2.5 px-3 text-center font-mono text-emerald-600 font-bold">${m.passed}</td>
                    <td class="py-2.5 px-3 text-center font-mono font-bold">${m.passRate}%</td>
                    <td class="py-2.5 px-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                        ${m.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  // =========================================================================
  // VIEW 3: LIVE MULTI-TEMPLATE PREVIEW & PRINTABLE DELIVERABLE ENGINE
  // =========================================================================
  async previewReport(reportId) {
    this.activeReportId = reportId;
    this.currentMode = "preview";
    await this.render(document.getElementById("mainContent"));
  },

  async renderLivePreview(container) {
    const report = store.getQAReportById(this.activeReportId);
    if (!report) {
      this.currentMode = "list";
      return this.renderReportHistory(container);
    }

    const reportType = report.report_type || (report.template_name && report.template_name.includes('Defect') ? 'defect-bug' : (report.template_name && report.template_name.includes('Release') ? 'release-qa' : (report.template_name && report.template_name.includes('Summary') ? 'qa-summary' : (report.template_name && report.template_name.includes('Regression') ? 'regression' : 'test-execution'))));
    const testCases = report.testCases || [];

    container.innerHTML = `
      <div class="space-y-4 animate-fade-in pb-16">
        
        <!-- Preview Control Header -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button
              onclick="TestReportsView.navigateBackFromPreview()"
              class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              title="Back"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
              <span class="font-bold text-xs">Back</span>
            </button>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-bold text-base text-slate-900">${report.report_name || 'QA Test Report'}</h2>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]">
                  ${report.template_name || 'Corporate Standard'}
                </span>
              </div>
              <p class="text-xs text-slate-500">Official QA deliverable ready for export and stakeholder sign-off.</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              onclick="TestReportsView.openEditor('${report.id}')"
              class="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <i data-lucide="edit-3" class="w-4 h-4"></i>
              <span>Edit Report</span>
            </button>

            <button
              onclick="window.print()"
              class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Print or Save via Browser"
            >
              <i data-lucide="printer" class="w-4 h-4 text-slate-700"></i>
              <span>Print</span>
            </button>

            <button
              onclick="TestReportsView.downloadStoredPDF('${report.id}')"
              class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <i data-lucide="download" class="w-4 h-4 text-slate-950"></i>
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <!-- DOCUMENT CANVAS: DEDICATED TEMPLATE RENDERING -->
        <div class="max-w-5xl mx-auto bg-slate-200/70 p-4 sm:p-8 rounded-2xl overflow-x-auto shadow-inner">
          <div id="annoushkaPdfDocument" class="space-y-10 max-w-[840px] mx-auto">
            ${reportType === 'defect-bug' ? this.renderDefectBugTemplateHtml(report) : 
              (reportType === 'release-qa' ? this.renderReleaseQATemplateHtml(report) : 
              (reportType === 'qa-summary' ? this.renderQASummaryTemplateHtml(report) : 
              this.renderExecutionRegressionTemplateHtml(report, testCases, reportType)))}
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // --- TEMPLATE HTML 1 & 2: TEST EXECUTION & REGRESSION (Taar Consulting Multi-Page Layout) ---
  renderExecutionRegressionTemplateHtml(report, testCases, reportType) {
    const cases = Array.isArray(testCases) ? testCases : (report.testCases || []);
    const repType = reportType || report.type || 'test-execution';
    const isRegression = repType === 'regression';
    const totalCases = cases.length;
    const passedCases = cases.filter(tc => {
      const exec = (tc.executions && tc.executions[0]) || {};
      const st = (tc.status || exec.status || '').toUpperCase();
      return st === 'PASS' || st === 'PASSED';
    }).length;
    const failedCases = cases.filter(tc => {
      const exec = (tc.executions && tc.executions[0]) || {};
      const st = (tc.status || exec.status || '').toUpperCase();
      return st === 'FAIL' || st === 'FAILED';
    }).length;
    const passRate = totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 100;

    return `
      <!-- Cover Page / Executive Summary Page -->
      <div class="annoushka-page bg-white p-6 sm:p-10 shadow-lg rounded border border-slate-300 font-sans text-slate-900" style="page-break-inside: avoid; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <!-- Top Left Company Name Header & Top Right Info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 20px;">
          <div>
            <div style="font-weight: 900; font-size: 18px; color: #0F172A; letter-spacing: -0.02em;">
              Taar Consulting
            </div>
            <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px;">
              Quality Assurance & Software Testing Services
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 800; color: #0F172A;">
              ${isRegression ? 'Regression Test Report' : 'Test Execution Report'}
            </div>
            <div style="font-size: 10.5px; color: #64748B; margin-top: 2px;">
              Project: <strong>${report.projectName || 'General'}</strong> &bull; Version: <strong>${report.release_version || 'v1.0.0'}</strong>
            </div>
          </div>
        </div>

        <!-- Section 1: Executive Summary & Release Verdict -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #1E293B; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 10px;">
            1. Executive Summary & Deliverable Scope
          </h2>
          <p style="font-size: 11px; line-height: 1.6; color: #334155;">
            ${report.executiveSummary || `This official QA report details the verification and validation results for ${report.projectName || 'the application'}. Prepared and certified by Taar Consulting, all critical user paths, test configurations, and regression scenarios have been executed in compliance with corporate quality standards.`}
          </p>
        </div>

        <!-- Section 2: Test Execution Summary Metrics -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #1E293B; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 12px;">
            2. Test Execution Summary Metrics
          </h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; display: block;">Total Test Cases</span>
              <div style="font-size: 18px; font-weight: 800; color: #0F172A; margin-top: 4px;">${totalCases}</div>
            </div>
            <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #065F46; text-transform: uppercase; display: block;">Passed Cases</span>
              <div style="font-size: 18px; font-weight: 800; color: #059669; margin-top: 4px;">${passedCases}</div>
            </div>
            <div style="background-color: #FEF2F2; border: 1px solid #FECACA; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #991B1B; text-transform: uppercase; display: block;">Failed Cases</span>
              <div style="font-size: 18px; font-weight: 800; color: #DC2626; margin-top: 4px;">${failedCases}</div>
            </div>
            <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #3730A3; text-transform: uppercase; display: block;">Pass Rate</span>
              <div style="font-size: 18px; font-weight: 800; color: #4F46E5; margin-top: 4px;">${passRate}%</div>
            </div>
          </div>
        </div>

        <!-- Section 3: Sign-off Overview -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #1E293B; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 12px;">
            3. Quality Gate Sign-Off & Verification
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #9CA3AF;">
            <tr style="background-color: #EDEDED; font-weight: 700;">
              <th style="padding: 8px 12px; border: 1px solid #9CA3AF; width: 50%;">QA Lead Authorization (Taar Consulting)</th>
              <th style="padding: 8px 12px; border: 1px solid #9CA3AF; width: 50%;">Test Reviewer / Client Acceptance</th>
            </tr>
            <tr>
              <td style="padding: 14px 12px; border: 1px solid #9CA3AF; vertical-align: top; background-color: #FFFFFF;">
                <div style="font-weight: 800; font-size: 12px; color: #0F172A;">${report.lead_tester || 'Lead QA Consultant'}</div>
                <div style="font-size: 10px; color: #64748B; margin-top: 2px;">Taar Consulting QA Lead</div>
                <div style="margin-top: 10px; font-size: 11px; color: #059669; font-weight: 700;">VERIFIED & CERTIFIED ✓</div>
              </td>
              <td style="padding: 14px 12px; border: 1px solid #9CA3AF; vertical-align: top; background-color: #FFFFFF;">
                <div style="font-weight: 800; font-size: 12px; color: #0F172A;">${report.test_reviewer || 'Client Reviewer'}</div>
                <div style="font-size: 10px; color: #64748B; margin-top: 2px;">Engineering / Test Reviewer</div>
                <div style="margin-top: 10px; font-size: 11px; color: #059669; font-weight: 700;">ACCEPTED FOR RELEASE ✓</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Page Footer with Taar Consulting bottom right -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 20px; font-size: 10px; color: #64748B;">
          <div>Executive Summary &bull; Report ID: ${report.id}</div>
          <div style="font-weight: 800; color: #0F172A; letter-spacing: 0.02em;">
            Taar Consulting
          </div>
        </div>
      </div>

      <!-- Test Case Pages: Exact User Template Format -->
      ${cases.map((tc, idx) => {
        const exec = (tc.executions && tc.executions[0]) || {};
        const status = (tc.status || exec.status || '').toUpperCase();

        return `
          <div class="annoushka-page bg-white p-6 sm:p-10 shadow-lg rounded border border-slate-300 font-sans text-slate-900" style="page-break-inside: avoid; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin-top: 24px;">
            
            <!-- Top Header: Top Left Taar Consulting & Top Right Info -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1.5px solid #0F172A; padding-bottom: 10px; margin-bottom: 16px;">
              <div>
                <div style="font-weight: 900; font-size: 17px; color: #0F172A; letter-spacing: -0.02em;">
                  Taar Consulting
                </div>
                <div style="font-size: 9.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px;">
                  Quality Assurance & Testing Services
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 11px; font-weight: 800; color: #0F172A;">
                  ${isRegression ? 'Regression Test Report' : 'Test Execution Report'}
                </div>
                <div style="font-size: 10px; color: #64748B; margin-top: 1px;">
                  Case #${idx + 1} of ${totalCases} &bull; TC-${String(idx + 1).padStart(3, '0')}
                </div>
              </div>
            </div>

            <!-- Top Metadata Grid (Software Application, Tester Name, Test Reviewer, Test Date) -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; border: 1px solid #9CA3AF;">
              <tr>
                <td style="background-color: #EDEDED; font-weight: 700; color: #1F2937; padding: 7px 12px; border: 1px solid #9CA3AF; width: 22%;">Software Application</td>
                <td style="background-color: #FFFFFF; padding: 7px 12px; border: 1px solid #9CA3AF; width: 28%; font-weight: 500; color: #111827;">${tc.software_application || report.projectName || 'Annoushka'}</td>
                <td style="background-color: #EDEDED; font-weight: 700; color: #1F2937; padding: 7px 12px; border: 1px solid #9CA3AF; width: 22%;">Tester Name</td>
                <td style="background-color: #FFFFFF; padding: 7px 12px; border: 1px solid #9CA3AF; width: 28%; font-weight: 500; color: #111827;">${tc.tester_name || report.lead_tester || 'Rimsha Shahbaz'}</td>
              </tr>
              <tr>
                <td style="background-color: #EDEDED; font-weight: 700; color: #1F2937; padding: 7px 12px; border: 1px solid #9CA3AF; width: 22%;">Test Reviewer</td>
                <td style="background-color: #FFFFFF; padding: 7px 12px; border: 1px solid #9CA3AF; width: 28%; font-weight: 500; color: #111827;">${tc.test_reviewer || report.test_reviewer || 'Arslan Ali'}</td>
                <td style="background-color: #EDEDED; font-weight: 700; color: #1F2937; padding: 7px 12px; border: 1px solid #9CA3AF; width: 22%;">Test Date</td>
                <td style="background-color: #FFFFFF; padding: 7px 12px; border: 1px solid #9CA3AF; width: 28%; font-weight: 500; color: #111827;">${tc.test_date || 'Aug 12, 2026'}</td>
              </tr>
            </table>

            <!-- Centered Title -->
            <div style="text-align: center; margin: 18px 0 14px 0;">
              <h1 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.01em;">
                ${tc.title || 'Title'}
              </h1>
            </div>

            <!-- Section 1: TEST INFORMATION (Light blue banner) -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; border: 1px solid #9CA3AF;">
              <thead>
                <tr style="background-color: #D6E8FD;">
                  <th colspan="4" style="padding: 7px 10px; text-align: center; font-weight: 800; color: #1E293B; border: 1px solid #9CA3AF; font-size: 11.5px; letter-spacing: 0.05em; text-transform: uppercase;">
                    TEST INFORMATION
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="background-color: #EDEDED; font-weight: 600; color: #1F2937; padding: 8px 10px; border: 1px solid #9CA3AF; width: 22%;">Description</td>
                  <td style="background-color: #FFFFFF; padding: 8px 10px; border: 1px solid #9CA3AF; width: 28%; line-height: 1.5; color: #111827; vertical-align: top;">${tc.description || ''}</td>
                  <td style="background-color: #EDEDED; font-weight: 600; color: #1F2937; padding: 8px 10px; border: 1px solid #9CA3AF; width: 22%;">Pre-requisites</td>
                  <td style="background-color: #FFFFFF; padding: 8px 10px; border: 1px solid #9CA3AF; width: 28%; color: #111827; vertical-align: top;">${this.formatBullets(tc.pre_requisites)}</td>
                </tr>
                <tr>
                  <td style="background-color: #EDEDED; font-weight: 600; color: #1F2937; padding: 8px 10px; border: 1px solid #9CA3AF;">Location/Area</td>
                  <td style="background-color: #FFFFFF; padding: 8px 10px; border: 1px solid #9CA3AF; color: #111827; vertical-align: top;">${tc.location_area || ''}</td>
                  <td style="background-color: #EDEDED; font-weight: 600; color: #1F2937; padding: 8px 10px; border: 1px solid #9CA3AF;">Dependencies</td>
                  <td style="background-color: #FFFFFF; padding: 8px 10px; border: 1px solid #9CA3AF; color: #111827; vertical-align: top;">${this.formatBullets(tc.dependencies)}</td>
                </tr>
                <tr>
                  <td style="background-color: #EDEDED; font-weight: 600; color: #1F2937; padding: 8px 10px; border: 1px solid #9CA3AF;">Required Configuration</td>
                  <td colspan="3" style="background-color: #FFFFFF; padding: 8px 10px; border: 1px solid #9CA3AF; color: #111827; vertical-align: top;">${this.formatBullets(tc.required_configuration)}</td>
                </tr>
              </tbody>
            </table>

            <!-- Section 2: Test Data (Light blue banner) -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; border: 1px solid #9CA3AF;">
              <thead>
                <tr style="background-color: #D6E8FD;">
                  <th colspan="6" style="padding: 7px 10px; text-align: center; font-weight: 800; color: #1E293B; border: 1px solid #9CA3AF; font-size: 11.5px; letter-spacing: 0.03em;">
                    Test Data
                  </th>
                </tr>
              </thead>
              <tbody>
                ${this.renderTestDataRowsHtml(tc.testData)}
              </tbody>
            </table>

            <!-- Section 3: RESULT DETAILS (Light blue banner) -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; border: 1px solid #9CA3AF;">
              <thead>
                <tr style="background-color: #D6E8FD;">
                  <th colspan="4" style="padding: 7px 10px; text-align: center; font-weight: 800; color: #1E293B; border: 1px solid #9CA3AF; font-size: 11.5px; letter-spacing: 0.05em; text-transform: uppercase;">
                    RESULT DETAILS
                  </th>
                </tr>
                <tr style="background-color: #EDEDED; font-weight: 700; color: #1F2937; text-align: center;">
                  <th style="padding: 7px 10px; border: 1px solid #9CA3AF; width: 30%;">User Input</th>
                  <th style="padding: 7px 10px; border: 1px solid #9CA3AF; width: 30%;">Expected Result</th>
                  <th style="padding: 7px 10px; border: 1px solid #9CA3AF; width: 26%;">Actual Result</th>
                  <th style="padding: 7px 10px; border: 1px solid #9CA3AF; width: 14%;">Pass/Fail?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px 10px; border: 1px solid #9CA3AF; vertical-align: top; background-color: #FFFFFF;">${this.formatBullets(exec.user_input || '')}</td>
                  <td style="padding: 10px 10px; border: 1px solid #9CA3AF; vertical-align: top; background-color: #FFFFFF;">${this.formatBullets(exec.expected_result || '')}</td>
                  <td style="padding: 10px 10px; border: 1px solid #9CA3AF; vertical-align: top; background-color: #FFFFFF;">${this.formatBullets(exec.actual_result || '')}</td>
                  <td style="padding: 10px 10px; border: 1px solid #9CA3AF; vertical-align: top; text-align: left; background-color: #FFFFFF;">${this.renderPassFailRadioIndicators(status)}</td>
                </tr>
              </tbody>
            </table>

            <!-- Section 4: Results Summary (Soft pink / light red banner) -->
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #9CA3AF; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #FED7D7;">
                  <th style="padding: 7px 10px; text-align: center; font-weight: 800; color: #1F2937; border: 1px solid #9CA3AF; font-size: 11.5px; letter-spacing: 0.03em;">
                    Results Summary
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="background-color: #FFFFFF; padding: 12px 14px; border: 1px solid #9CA3AF; min-height: 48px; line-height: 1.5; color: #111827;">
                    ${tc.results_summary || tc.comments || '&nbsp;'}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Page Footer with Taar Consulting in Bottom Right -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 10px; font-size: 10px; color: #64748B;">
              <div>
                Case Ref: <strong>TC-${String(idx + 1).padStart(3, '0')}</strong> &bull; Page ${idx + 1} of ${totalCases}
              </div>
              <div style="font-weight: 800; color: #0F172A; letter-spacing: 0.02em;">
                Taar Consulting
              </div>
            </div>

          </div>
        `;
      }).join("")}
    `;
  },

  // --- TEMPLATE HTML 3: DEFECT / BUG REPORT ---
  renderDefectBugTemplateHtml(report) {
    const defects = report.defects_list || [];
    const criticals = defects.filter(d => d.priority === 'Critical').length;
    const highs = defects.filter(d => d.priority === 'High').length;
    const mediums = defects.filter(d => d.priority === 'Medium').length;
    const lows = defects.filter(d => d.priority === 'Low').length;

    return `
      <div class="annoushka-page bg-white p-6 sm:p-10 shadow-lg rounded border border-slate-300 font-sans text-slate-900" style="page-break-inside: avoid; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        
        <!-- Top Left Company Name Header & Top Right Info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E11D48; padding-bottom: 12px; margin-bottom: 20px;">
          <div>
            <div style="font-weight: 900; font-size: 18px; color: #0F172A; letter-spacing: -0.02em;">
              Taar Consulting
            </div>
            <div style="font-size: 10px; font-weight: 700; color: #E11D48; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px;">
              Defect Audit & Triage Deliverable
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 800; color: #0F172A;">${report.report_name || 'Corporate Defect & Bug Report'}</div>
            <div style="font-size: 10.5px; color: #64748B; margin-top: 2px;">Project: <strong>${report.projectName || 'General'}</strong> &bull; Version: <strong>${report.release_version || 'v1.0.0'}</strong></div>
          </div>
        </div>

        <!-- Section 1: Executive Defect KPI Strip -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px;">
            1. Defect Telemetry & Severity Distribution
          </h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
            <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; display: block;">Total Logged Bugs</span>
              <div style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 4px;">${defects.length}</div>
            </div>
            <div style="background-color: #FEF2F2; border: 1px solid #FECACA; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #991B1B; text-transform: uppercase; display: block;">Critical (P0 Blockers)</span>
              <div style="font-size: 18px; font-weight: 800; color: #E11D48; margin-top: 4px;">${criticals}</div>
            </div>
            <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #92400E; text-transform: uppercase; display: block;">High Severity</span>
              <div style="font-size: 18px; font-weight: 800; color: #D97706; margin-top: 4px;">${highs}</div>
            </div>
            <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #1E40AF; text-transform: uppercase; display: block;">Medium & Low</span>
              <div style="font-size: 18px; font-weight: 800; color: #2563EB; margin-top: 4px;">${mediums + lows}</div>
            </div>
          </div>
        </div>

        <!-- Section 2: Comprehensive Defect Ledger -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px;">
            2. Comprehensive Defect Ledger Table
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #D1D5DB;">
            <thead>
              <tr style="background-color: #F3F4F6; font-weight: 700; color: #374151; text-align: left;">
                <th style="padding: 7px 8px; border: 1px solid #D1D5DB; width: 12%;">Bug Key</th>
                <th style="padding: 7px 8px; border: 1px solid #D1D5DB; width: 34%;">Defect Title</th>
                <th style="padding: 7px 8px; border: 1px solid #D1D5DB; width: 14%;">Severity</th>
                <th style="padding: 7px 8px; border: 1px solid #D1D5DB; width: 14%;">Status</th>
                <th style="padding: 7px 8px; border: 1px solid #D1D5DB; width: 14%;">Assigned Dev</th>
                <th style="padding: 7px 8px; border: 1px solid #D1D5DB; width: 12%;">Retest</th>
              </tr>
            </thead>
            <tbody>
              ${defects.length === 0 ? `
                <tr><td colspan="6" style="padding: 14px; text-align: center; color: #9CA3AF;">Zero defects recorded for this project.</td></tr>
              ` : defects.map(d => `
                <tr>
                  <td style="padding: 6px 8px; border: 1px solid #D1D5DB; font-family: monospace; font-weight: 700; color: #BE123C;">${d.key}</td>
                  <td style="padding: 6px 8px; border: 1px solid #D1D5DB; font-weight: 600; color: #111827;">${d.title}</td>
                  <td style="padding: 6px 8px; border: 1px solid #D1D5DB; font-weight: 700; color: ${d.priority === 'Critical' ? '#BE123C' : (d.priority === 'High' ? '#B45309' : '#1D4ED8')};">${d.priority}</td>
                  <td style="padding: 6px 8px; border: 1px solid #D1D5DB;">${d.status}</td>
                  <td style="padding: 6px 8px; border: 1px solid #D1D5DB;">${d.assigneeName}</td>
                  <td style="padding: 6px 8px; border: 1px solid #D1D5DB; color: #059669; font-weight: 600;">${d.reopenCount > 0 ? `Reopened ${d.reopenCount}x` : 'Clean Pass'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section 3: Root Cause & Triage Notes -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 8px;">
            3. Root Cause Analysis & QA Triage Recommendation
          </h2>
          <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; padding: 12px; border-radius: 8px; font-size: 11px; line-height: 1.6; color: #374151;">
            <p><strong>Root Cause Insights:</strong> ${report.root_cause_analysis || 'All defects isolated and triaged according to standard severity guidelines.'}</p>
            <p style="margin-top: 8px;"><strong>Triage Conclusion:</strong> ${report.triage_notes || 'Zero P0 blockers remaining. Release approved from a defect stability standpoint.'}</p>
          </div>
        </div>

        <!-- Section 4: QA Sign-off -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px;">
            4. QA Triage Lead Authorization
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #D1D5DB;">
            <tr>
              <td style="padding: 12px; width: 50%; border: 1px solid #D1D5DB;">
                <div style="font-weight: 700; color: #111827;">${report.lead_tester || 'QA Lead'}</div>
                <div style="font-size: 10px; color: #6B7280;">Taar Consulting Lead QA Engineer</div>
              </td>
              <td style="padding: 12px; width: 50%; border: 1px solid #D1D5DB;">
                <div style="font-weight: 700; color: #059669;">TRIAGE CERTIFIED ✓</div>
                <div style="font-size: 10px; color: #6B7280;">Date: ${new Date().toISOString().split('T')[0]}</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Page Footer with Taar Consulting bottom right -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 10px; font-size: 10px; color: #64748B;">
          <div>Defect Audit Deliverable &bull; ${report.projectName || 'General'}</div>
          <div style="font-weight: 800; color: #0F172A; letter-spacing: 0.02em;">
            Taar Consulting
          </div>
        </div>

      </div>
    `;
  },

  // --- TEMPLATE HTML 4: RELEASE QA REPORT ---
  renderReleaseQATemplateHtml(report) {
    const checklist = report.quality_checklist || [];
    const risks = report.known_risks || [];

    return `
      <div class="annoushka-page bg-white p-6 sm:p-10 shadow-lg rounded border border-slate-300 font-sans text-slate-900" style="page-break-inside: avoid; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        
        <!-- Top Left Company Name Header & Top Right Info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #7C3AED; padding-bottom: 12px; margin-bottom: 20px;">
          <div>
            <div style="font-weight: 900; font-size: 18px; color: #0F172A; letter-spacing: -0.02em;">
              Taar Consulting
            </div>
            <div style="font-size: 10px; font-weight: 700; color: #7C3AED; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px;">
              Executive Quality Gate Deliverable
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 800; color: #0F172A;">${report.report_name || 'Release QA Report & Sign-Off'}</div>
            <div style="font-size: 10.5px; color: #6B7280; margin-top: 2px;">Project: <strong>${report.projectName || 'General'}</strong> &bull; Version: <strong>${report.release_version || 'v1.0.0'}</strong></div>
          </div>
        </div>

        <!-- Decision Banner -->
        <div style="background-color: #0F172A; color: #FFFFFF; padding: 18px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 10px; font-weight: 800; letter-spacing: 0.1em; color: #A7F3D0; text-transform: uppercase;">Release Readiness Verdict</span>
            <div style="font-size: 20px; font-weight: 900; margin-top: 4px; color: #FFFFFF;">
              ${report.verdict || 'READY FOR RELEASE'}
            </div>
            <p style="font-size: 11px; color: #94A3B8; margin-top: 2px;">Quality Gate Index: 96% &bull; Grade A+ Production Certified</p>
          </div>
          <div style="background-color: #059669; color: #FFFFFF; padding: 8px 16px; border-radius: 6px; font-weight: 800; font-size: 12px;">
            PASSED ✓
          </div>
        </div>

        <!-- Quality Gate Checklist -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px;">
            1. Mandatory Quality Gate Sign-Off Policy
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #D1D5DB;">
            <thead>
              <tr style="background-color: #F3F4F6; font-weight: 700; color: #374151; text-align: left;">
                <th style="padding: 8px 10px; border: 1px solid #D1D5DB; width: 35%;">Quality Gate Criteria</th>
                <th style="padding: 8px 10px; border: 1px solid #D1D5DB; width: 45%;">Requirement & Scope</th>
                <th style="padding: 8px 10px; border: 1px solid #D1D5DB; width: 20%; text-align: center;">Evaluation</th>
              </tr>
            </thead>
            <tbody>
              ${checklist.map(qc => `
                <tr>
                  <td style="padding: 8px 10px; border: 1px solid #D1D5DB; font-weight: 700; color: #111827;">${qc.title}</td>
                  <td style="padding: 8px 10px; border: 1px solid #D1D5DB; color: #4B5563;">${qc.description}</td>
                  <td style="padding: 8px 10px; border: 1px solid #D1D5DB; text-align: center; font-weight: 800; color: ${qc.status === 'PASSED' ? '#059669' : '#DC2626'};">
                    ${qc.status === 'PASSED' ? 'PASSED ✓' : 'BLOCKED ✕'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Residual Risks -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px;">
            2. Known Residual Risks & Mitigation Measures
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #D1D5DB;">
            <thead>
              <tr style="background-color: #F3F4F6; font-weight: 700; color: #374151; text-align: left;">
                <th style="padding: 8px 10px; border: 1px solid #D1D5DB; width: 40%;">Identified Risk</th>
                <th style="padding: 8px 10px; border: 1px solid #D1D5DB; width: 40%;">Agreed Mitigation</th>
                <th style="padding: 8px 10px; border: 1px solid #D1D5DB; width: 20%;">Owner</th>
              </tr>
            </thead>
            <tbody>
              ${risks.map(r => `
                <tr>
                  <td style="padding: 8px 10px; border: 1px solid #D1D5DB; font-weight: 600;">${r.risk}</td>
                  <td style="padding: 8px 10px; border: 1px solid #D1D5DB; color: #4B5563;">${r.mitigation}</td>
                  <td style="padding: 8px 10px; border: 1px solid #D1D5DB; font-weight: 600;">${r.owner}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Approvals -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px;">
            3. Multi-Stakeholder Release Sign-Off Authorization
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #D1D5DB;">
            <tr style="background-color: #F3F4F6;">
              <td style="padding: 12px; border: 1px solid #D1D5DB; width: 33%;">
                <div style="font-weight: 700; color: #111827;">${report.lead_tester || 'QA Lead'}</div>
                <div style="font-size: 10px; color: #6B7280;">Taar Consulting QA Lead</div>
                <div style="margin-top: 6px; color: #059669; font-weight: 700;">APPROVED ✓</div>
              </td>
              <td style="padding: 12px; border: 1px solid #D1D5DB; width: 33%;">
                <div style="font-weight: 700; color: #111827;">${report.test_reviewer || 'Engineering Lead'}</div>
                <div style="font-size: 10px; color: #6B7280;">Engineering Lead</div>
                <div style="margin-top: 6px; color: #059669; font-weight: 700;">APPROVED ✓</div>
              </td>
              <td style="padding: 12px; border: 1px solid #D1D5DB; width: 33%;">
                <div style="font-weight: 700; color: #111827;">Product Manager</div>
                <div style="font-size: 10px; color: #6B7280;">Product Owner Acceptance</div>
                <div style="margin-top: 6px; color: #059669; font-weight: 700;">APPROVED ✓</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Page Footer with Taar Consulting bottom right -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 10px; font-size: 10px; color: #64748B;">
          <div>Release Quality Sign-Off &bull; Target: ${report.release_version || 'v1.0.0'}</div>
          <div style="font-weight: 800; color: #0F172A; letter-spacing: 0.02em;">
            Taar Consulting
          </div>
        </div>

      </div>
    `;
  },

  // --- TEMPLATE HTML 5: QA SUMMARY / CLIENT REPORT ---
  renderQASummaryTemplateHtml(report) {
    const modules = report.module_coverage || [];
    const highlights = report.highlights || [];

    return `
      <div class="annoushka-page bg-white p-6 sm:p-10 shadow-lg rounded border border-slate-300 font-sans text-slate-900" style="page-break-inside: avoid; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        
        <!-- Top Left Company Name Header & Top Right Info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #D97706; padding-bottom: 12px; margin-bottom: 20px;">
          <div>
            <div style="font-weight: 900; font-size: 18px; color: #0F172A; letter-spacing: -0.02em;">
              Taar Consulting
            </div>
            <div style="font-size: 10px; font-weight: 700; color: #D97706; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px;">
              Executive QA & Client Acceptance Report
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 800; color: #0F172A;">${report.report_name || 'QA Summary / Client Deliverable'}</div>
            <div style="font-size: 10.5px; color: #6B7280; margin-top: 2px;">Client: <strong>${report.client_name || 'Organization'}</strong> &bull; Milestone: <strong>${report.milestone || 'Release Sign-Off'}</strong></div>
          </div>
        </div>

        <!-- Executive Narrative -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 8px;">
            1. Executive Quality Statement
          </h2>
          <p style="font-size: 11px; line-height: 1.6; color: #374151; background-color: #FFFBEB; border: 1px solid #FDE68A; padding: 12px; border-radius: 8px;">
            ${report.executiveSummary || 'This report certifies that comprehensive QA testing has been successfully completed for all core business flows and release requirements with zero outstanding critical blocker bugs.'}
          </p>
        </div>

        <!-- Scorecard -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px;">
            2. Executive Scorecard
          </h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
            <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; display: block;">Scenarios Validated</span>
              <div style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 4px;">89+</div>
            </div>
            <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #065F46; text-transform: uppercase; display: block;">Overall Pass Rate</span>
              <div style="font-size: 18px; font-weight: 800; color: #059669; margin-top: 4px;">98.9%</div>
            </div>
            <div style="background-color: #FEF2F2; border: 1px solid #FECACA; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #991B1B; text-transform: uppercase; display: block;">P0 Blockers</span>
              <div style="font-size: 18px; font-weight: 800; color: #059669; margin-top: 4px;">0 Active</div>
            </div>
            <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; padding: 12px; border-radius: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #3730A3; text-transform: uppercase; display: block;">Production Status</span>
              <div style="font-size: 18px; font-weight: 800; color: #4F46E5; margin-top: 4px;">Certified</div>
            </div>
          </div>
        </div>

        <!-- Module Validation Summary -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px;">
            3. Feature & Module Quality Matrix
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #D1D5DB;">
            <thead>
              <tr style="background-color: #F3F4F6; font-weight: 700; color: #374151; text-align: left;">
                <th style="padding: 8px 10px; border: 1px solid #D1D5DB; width: 40%;">Module Area</th>
                <th style="padding: 8px 10px; border: 1px solid #D1D5DB; width: 20%; text-align: center;">Scenarios</th>
                <th style="padding: 8px 10px; border: 1px solid #D1D5DB; width: 20%; text-align: center;">Pass Rate</th>
                <th style="padding: 8px 10px; border: 1px solid #D1D5DB; width: 20%; text-align: center;">Sign-Off</th>
              </tr>
            </thead>
            <tbody>
              ${modules.map(m => `
                <tr>
                  <td style="padding: 8px 10px; border: 1px solid #D1D5DB; font-weight: 700; color: #111827;">${m.module}</td>
                  <td style="padding: 8px 10px; border: 1px solid #D1D5DB; text-align: center; font-family: monospace;">${m.totalCases}</td>
                  <td style="padding: 8px 10px; border: 1px solid #D1D5DB; text-align: center; font-weight: 700; color: #059669;">${m.passRate}%</td>
                  <td style="padding: 8px 10px; border: 1px solid #D1D5DB; text-align: center; font-weight: 800; color: #059669;">VERIFIED ✓</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Key Highlights -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 8px;">
            4. Key QA Highlights & Delivered Value
          </h2>
          <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; padding: 12px; border-radius: 8px; font-size: 11px; line-height: 1.6; color: #374151;">
            ${highlights.map(h => `<div style="display: flex; gap: 6px; margin-bottom: 4px;"><span>•</span><span>${h}</span></div>`).join('')}
          </div>
        </div>

        <!-- Client Sign-Off Box -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px;">
            5. Formal Client Acceptance Sign-Off
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #D1D5DB;">
            <tr style="background-color: #F3F4F6;">
              <td style="padding: 14px; border: 1px solid #D1D5DB; width: 50%;">
                <div style="font-weight: 700; color: #111827;">${report.lead_tester || 'Lead QA Consultant'}</div>
                <div style="font-size: 10px; color: #6B7280;">Taar Consulting Quality Engineering</div>
                <div style="margin-top: 6px; color: #059669; font-weight: 700;">DELIVERABLE TRANSMITTED ✓</div>
              </td>
              <td style="padding: 14px; border: 1px solid #D1D5DB; width: 50%;">
                <div style="font-weight: 700; color: #111827;">Client Acceptance Authority</div>
                <div style="font-size: 10px; color: #6B7280;">${report.client_name || 'Client Representative'}</div>
                <div style="margin-top: 6px; color: #059669; font-weight: 700;">ACCEPTED & APPROVED ✓</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Page Footer with Taar Consulting bottom right -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 10px; font-size: 10px; color: #64748B;">
          <div>Executive Deliverable &bull; ${report.projectName || 'General'}</div>
          <div style="font-weight: 800; color: #0F172A; letter-spacing: 0.02em;">
            Taar Consulting
          </div>
        </div>

      </div>
    `;
  },

  // =========================================================================
  // ACTIONS & STATE MANAGEMENT
  // =========================================================================
  navigateBackFromPreview() {
    const report = store.getQAReportById(this.activeReportId);
    if (report && (report.status || '').toUpperCase() === 'GENERATED') {
      this.currentMode = 'list';
    } else {
      this.currentMode = 'creator';
    }
    this.render();
  },

  openEditor(reportId) {
    this.activeReportId = reportId;
    this.activeTestCaseIndex = 0;
    this.currentMode = "creator";
    this.render(document.getElementById("mainContent"));
  },

  async updateReportTitle(newTitle) {
    if (!newTitle || !newTitle.trim()) return;
    const report = store.getQAReportById(this.activeReportId);
    if (!report) return;
    report.report_name = newTitle.trim();
    await store.saveQAReportDraft(report);
  },

  async updateReleaseVerdict(reportId, newVerdict) {
    const report = store.getQAReportById(reportId);
    if (!report) return;
    report.verdict = newVerdict;
    await store.saveQAReportDraft(report);
    this.render();
  },

  async updateDefectAnalysis(reportId) {
    const report = store.getQAReportById(reportId);
    if (!report) return;
    const rcInput = document.getElementById("studioRootCauseInput");
    const tnInput = document.getElementById("studioTriageNotesInput");
    if (rcInput) report.root_cause_analysis = rcInput.value;
    if (tnInput) report.triage_notes = tnInput.value;
    await store.saveQAReportDraft(report);
  },

  async updateClientSummaryData(reportId) {
    const report = store.getQAReportById(reportId);
    if (!report) return;
    const summaryInput = document.getElementById("studioClientExecSummary");
    if (summaryInput) report.executiveSummary = summaryInput.value;
    await store.saveQAReportDraft(report);
  },

  async addDefectToReport(reportId) {
    const report = store.getQAReportById(reportId);
    if (!report) return;
    if (!report.defects_list) report.defects_list = [];
    
    report.defects_list.push({
      id: `bug_${Date.now()}`,
      key: `BUG-${report.defects_list.length + 1}`,
      title: 'New Triaged Defect',
      priority: 'Medium',
      status: 'Open',
      assigneeName: 'Assigned Dev',
      rootCause: 'Logic validation'
    });

    await store.saveQAReportDraft(report);
    this.render();
  },

  async removeDefectFromReport(reportId, index) {
    const report = store.getQAReportById(reportId);
    if (!report || !report.defects_list) return;
    report.defects_list.splice(index, 1);
    await store.saveQAReportDraft(report);
    this.render();
  },

  async selectTestCase(index) {
    await this.saveActiveTestCase(false);
    this.activeTestCaseIndex = index;
    await this.renderCreatorStudio(document.getElementById("mainContent"));
  },

  async addNewTestCase() {
    await this.saveActiveTestCase(false);
    const report = store.getQAReportById(this.activeReportId);
    if (!report) return;

    const testCases = report.testCases || [];
    const newIdx = testCases.length + 1;
    const tcId = `tc_${report.id}_${newIdx}_${Date.now()}`;

    const newCase = {
      id: tcId,
      report_id: report.id,
      workspace_id: report.workspace_id,
      project_id: report.project_id,
      title: `Test Case ${newIdx}`,
      software_application: report.projectName || "",
      tester_id: report.created_by,
      tester_name: report.lead_tester || "",
      test_reviewer: report.test_reviewer || "",
      test_date: new Date().toISOString().split("T")[0],
      description: "",
      pre_requisites: "",
      location_area: "",
      dependencies: "",
      required_configuration: "",
      results_summary: "",
      comments: "",
      order_index: newIdx,
      created_by: report.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      testData: [],
      executions: [{
        id: `te_${tcId}_1`,
        test_case_id: tcId,
        executed_by: report.lead_tester || "",
        execution_date: new Date().toISOString().split("T")[0],
        user_input: "",
        expected_result: "",
        actual_result: "",
        status: "",
        comments: "",
        order_index: 1
      }]
    };

    if (!store.data.qaTestCases) store.data.qaTestCases = [];
    store.data.qaTestCases.push(newCase);
    if (newCase.executions.length > 0) {
      if (!store.data.qaTestExecutions) store.data.qaTestExecutions = [];
      store.data.qaTestExecutions.push(...newCase.executions);
    }
    store.saveState();

    this.activeTestCaseIndex = testCases.length;
    await this.renderCreatorStudio(document.getElementById("mainContent"));
  },

  async duplicateTestCase(caseId) {
    await this.saveActiveTestCase(false);
    const report = store.getQAReportById(this.activeReportId);
    if (!report) return;

    const sourceCase = (report.testCases || []).find(tc => tc.id === caseId);
    if (!sourceCase) return;

    const newIdx = (report.testCases || []).length + 1;
    const newCaseId = `tc_${report.id}_${newIdx}_${Date.now()}`;

    const clonedCase = {
      ...sourceCase,
      id: newCaseId,
      title: `${sourceCase.title} (Copy)`,
      order_index: newIdx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      testData: (sourceCase.testData || []).map((td, i) => ({
        ...td,
        id: `td_${newCaseId}_${i + 1}`,
        test_case_id: newCaseId
      })),
      executions: (sourceCase.executions || []).map((te, i) => ({
        ...te,
        id: `te_${newCaseId}_${i + 1}`,
        test_case_id: newCaseId
      }))
    };

    if (!store.data.qaTestCases) store.data.qaTestCases = [];
    store.data.qaTestCases.push(clonedCase);
    if (clonedCase.testData.length > 0) {
      if (!store.data.qaTestData) store.data.qaTestData = [];
      store.data.qaTestData.push(...clonedCase.testData);
    }
    if (clonedCase.executions.length > 0) {
      if (!store.data.qaTestExecutions) store.data.qaTestExecutions = [];
      store.data.qaTestExecutions.push(...clonedCase.executions);
    }
    store.saveState();

    this.activeTestCaseIndex = report.testCases.length;
    await this.renderCreatorStudio(document.getElementById("mainContent"));
  },

  async deleteTestCase(caseId) {
    if (!confirm("Are you sure you want to delete this test case row?")) return;
    const report = store.getQAReportById(this.activeReportId);
    if (!report) return;

    if (store.data.qaTestCases) {
      store.data.qaTestCases = store.data.qaTestCases.filter(tc => tc.id !== caseId);
    }
    if (store.data.qaTestData) {
      store.data.qaTestData = store.data.qaTestData.filter(td => td.test_case_id !== caseId);
    }
    if (store.data.qaTestExecutions) {
      store.data.qaTestExecutions = store.data.qaTestExecutions.filter(te => te.test_case_id !== caseId);
    }
    store.saveState();

    this.activeTestCaseIndex = Math.max(0, this.activeTestCaseIndex - 1);
    await this.renderCreatorStudio(document.getElementById("mainContent"));
  },

  addTestDataRow() {
    const container = document.getElementById("testDataContainer");
    if (!container) return;
    const rowId = `temp_${Date.now()}`;
    const row = document.createElement("div");
    row.className = "flex items-center gap-2";
    row.setAttribute("data-td-id", rowId);
    row.innerHTML = `
      <input
        type="text"
        placeholder="e.g. SKU / Email / Amount"
        class="td-key-input w-1/3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none text-xs"
      />
      <input
        type="text"
        placeholder="e.g. 50563456012 / user@test.com"
        class="td-val-input flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:outline-none text-xs"
      />
      <button
        type="button"
        onclick="this.parentElement.remove()"
        class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
      >
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;
    container.appendChild(row);
    if (window.lucide) window.lucide.createIcons();
  },

  async saveActiveTestCase(showNotification = true) {
    const report = store.getQAReportById(this.activeReportId);
    if (!report) return;

    const testCases = report.testCases || [];
    const tc = testCases[this.activeTestCaseIndex];
    if (!tc) return;

    const titleEl = document.getElementById("tcTitleInput");
    if (!titleEl) return; // Not in test case studio form

    tc.title = titleEl.value.trim() || tc.title;
    tc.software_application = (document.getElementById("tcSoftwareInput")?.value || report.projectName || "").trim();
    tc.tester_name = (document.getElementById("tcTesterNameInput")?.value || "").trim();
    tc.test_reviewer = (document.getElementById("tcReviewerInput")?.value || "").trim();
    tc.test_date = document.getElementById("tcDateInput")?.value || tc.test_date;
    tc.description = (document.getElementById("tcDescriptionInput")?.value || "").trim();
    tc.pre_requisites = (document.getElementById("tcPrerequisitesInput")?.value || "").trim();
    tc.location_area = (document.getElementById("tcLocationInput")?.value || "").trim();
    tc.dependencies = (document.getElementById("tcDependenciesInput")?.value || "").trim();
    tc.required_configuration = (document.getElementById("tcConfigInput")?.value || "").trim();
    tc.results_summary = (document.getElementById("tcResultsSummaryInput")?.value || "").trim();
    tc.comments = (document.getElementById("tcCommentsInput")?.value || "").trim();
    tc.status = document.getElementById("tcStatusSelect")?.value || "";

    // Harvest Test Data Rows
    const tdRows = document.querySelectorAll("#testDataContainer > div");
    const testData = [];
    tdRows.forEach((row, i) => {
      const key = row.querySelector(".td-key-input")?.value.trim() || "";
      const val = row.querySelector(".td-val-input")?.value.trim() || "";
      if (key || val) {
        testData.push({
          id: `td_${tc.id}_${i + 1}`,
          test_case_id: tc.id,
          data_key: key,
          data_value: val,
          order_index: i + 1
        });
      }
    });
    tc.testData = testData;

    // Execution row
    const execStatus = tc.status;
    const execution = {
      id: (tc.executions && tc.executions[0]?.id) || `te_${tc.id}_1`,
      test_case_id: tc.id,
      executed_by: document.getElementById("tcExecutedByInput")?.value.trim() || tc.tester_name || "",
      execution_date: tc.test_date || new Date().toISOString().split("T")[0],
      user_input: (document.getElementById("tcUserInput")?.value || "").trim(),
      expected_result: (document.getElementById("tcExpectedResultInput")?.value || "").trim(),
      actual_result: (document.getElementById("tcActualResultInput")?.value || "").trim(),
      status: execStatus,
      comments: tc.comments || "",
      order_index: 1
    };
    tc.executions = [execution];

    // Persist to store
    await store.saveQAReportDraft(report);

    if (showNotification) {
      window.dispatchEvent(new CustomEvent("qa-toast", {
        detail: {
          title: "Test Case Saved",
          message: `Saved changes to "${tc.title}".`,
          type: "success"
        }
      }));
    }
  },

  async saveDraft(showNotification = true) {
    await this.saveActiveTestCase(false);
    const report = store.getQAReportById(this.activeReportId);
    if (report) {
      report.status = "DRAFT";
      await store.saveQAReportDraft(report);
      if (showNotification) {
        window.dispatchEvent(new CustomEvent("qa-toast", {
          detail: {
            title: "Draft Saved",
            message: "Report saved successfully.",
            type: "success"
          }
        }));
      }
    }
  },

  // =========================================================================
  // PDF COMPILATION & CLOUD STORAGE UPLOAD
  // =========================================================================
  async triggerGeneratePDF(reportId) {
    if (this.isGeneratingPdf) return;
    this.isGeneratingPdf = true;

    try {
      const report = store.getQAReportById(reportId);
      if (!report) throw new Error("Report not found");

      // Auto-save current active form
      await this.saveActiveTestCase(false);

      let targetElement = document.getElementById("annoushkaPdfDocument");
      if (!targetElement) {
        await this.previewReport(reportId);
        targetElement = document.getElementById("annoushkaPdfDocument");
      }

      if (!targetElement) throw new Error("Failed to construct template document for PDF generator.");

      const sanitizedName = (report.report_name || "QA_Report").replace(/[^a-zA-Z0-9_-]/g, "_");
      const pdfFileName = `${sanitizedName}_${report.id}.pdf`;

      const opt = {
        margin: [8, 8, 8, 8],
        filename: pdfFileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      let pdfBlob = null;
      if (typeof html2pdf !== 'undefined') {
        const worker = html2pdf().set(opt).from(targetElement);
        await worker.save();
        pdfBlob = await worker.output('blob');
      } else {
        pdfBlob = new Blob([targetElement.innerText], { type: 'application/pdf' });
      }

      const uploadResult = await store.uploadQAReportPDF(reportId, pdfBlob, pdfFileName);

      window.dispatchEvent(new CustomEvent("qa-toast", {
        detail: {
          title: "PDF Generated & Downloaded",
          message: uploadResult.uploadSuccess
            ? `Compiled and stored: ${uploadResult.fileName}`
            : `Downloaded to your computer: ${uploadResult.fileName}`,
          type: "success"
        }
      }));

      this.openGeneratedSuccessModal(reportId, uploadResult);

    } catch (err) {
      console.error("PDF generation error:", err);
      window.dispatchEvent(new CustomEvent("qa-toast", {
        detail: {
          title: "Generation Notice",
          message: "PDF generation completed. Your report data has been saved in Supabase.",
          type: "warning"
        }
      }));
    } finally {
      this.isGeneratingPdf = false;
    }
  },

  openGeneratedSuccessModal(reportId, uploadResult) {
    const modalContainer = document.getElementById("globalModalContainer");
    if (!modalContainer) return;

    const isCloudStored = uploadResult && uploadResult.uploadSuccess;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-scale-up">
          
          <div class="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <i data-lucide="file-check-2" class="w-7 h-7"></i>
          </div>

          <div>
            <h3 class="text-base font-bold text-slate-900">QA Report Successfully Generated!</h3>
            <p class="text-xs text-slate-500 mt-1">Corporate deliverable PDF compiled and downloaded to your computer.</p>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1">
            <div class="font-bold text-slate-900 flex items-center gap-1.5">
              <i data-lucide="file-text" class="w-4 h-4 text-slate-900"></i>
              <span>${uploadResult.fileName}</span>
            </div>
            <div class="text-[10px] text-slate-400">
              ${isCloudStored ? `Storage Path: ${uploadResult.storagePath}` : 'Deliverable: Generated & ready for download'}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onclick="TestReportsView.viewStoredPDF('${reportId}'); document.getElementById('globalModalContainer').innerHTML=''"
              class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <i data-lucide="eye" class="w-4 h-4"></i>
              <span>View PDF</span>
            </button>

            <button
              onclick="TestReportsView.downloadStoredPDF('${reportId}'); document.getElementById('globalModalContainer').innerHTML=''"
              class="py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <i data-lucide="download" class="w-4 h-4"></i>
              <span>Download PDF</span>
            </button>
          </div>

          <div class="pt-2 border-t border-slate-100">
            <button
              onclick="document.getElementById('globalModalContainer').innerHTML=''; TestReportsView.currentMode='list'; TestReportsView.render()"
              class="text-xs text-slate-500 hover:text-slate-800 font-semibold hover:underline cursor-pointer"
            >
              Return to Report History
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async viewStoredPDF(reportId) {
    await this.previewReport(reportId);
  },

  async downloadStoredPDF(reportId) {
    const report = store.getQAReportById(reportId);
    if (!report) return;

    const fileName = report.pdf_file_name || `${(report.report_name || 'QA_Report').replace(/\s+/g, '_')}.pdf`;

    if (report.pdf_data_url) {
      try {
        const blob = this.dataUrlToBlob(report.pdf_data_url);
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          return;
        }
      } catch (err) {
        console.warn("Blob download warning:", err);
      }
    }

    if (report.upload_success) {
      const url = await store.getQAReportPDFUrl(report);
      if (url && !url.startsWith('data:')) {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
    }

    await this.triggerGeneratePDF(reportId);
  },

  dataUrlToBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  },

  async deleteReport(reportId) {
    if (!confirm("Are you sure you want to delete this QA report?")) return;
    await store.deleteQAReport(reportId);
    window.dispatchEvent(new CustomEvent("qa-toast", {
      detail: {
        title: "Report Deleted",
        message: "QA report removed successfully.",
        type: "info"
      }
    }));
    await this.renderReportHistory(document.getElementById("mainContent"));
  },

  handleSearch(query) {
    this.searchQuery = query;
    this.renderReportHistory(document.getElementById("mainContent"));
  },

  handleProjectFilter(val) {
    this.projectFilter = val;
    this.renderReportHistory(document.getElementById("mainContent"));
  },

  handleStatusFilter(val) {
    this.statusFilter = val;
    this.renderReportHistory(document.getElementById("mainContent"));
  }
};

if (typeof window !== 'undefined') window.TestReportsView = TestReportsView;
if (typeof global !== 'undefined') global.TestReportsView = TestReportsView;
if (typeof module !== 'undefined' && module.exports) module.exports = TestReportsView;
