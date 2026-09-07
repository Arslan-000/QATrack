/**
 * PulseWave QA Platform — QA Documentation & Master Strategy Studio (V2)
 * Comprehensive QA Document Authoring, Master Test Strategy, Sprint QA Sign-Off,
 * Interactive Test Scenarios Matrix, Formal Approval Workflows, and Corporate Templates.
 * Built strictly with real project data and zero dummy text.
 */

const DocumentationView = {
  activeTab: "docs", // "docs" | "studio" | "templates" | "preview"
  currentEditingDocId: null,
  selectedProjectFilter: "all",
  selectedTypeFilter: "all",
  selectedStatusFilter: "all",
  searchQuery: "",

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
          <p class="text-xs text-slate-500">QA Documentation is restricted to Project Managers and QA Engineers.</p>
          <button onclick="window.app.navigate('all-issues')" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer">
            Go to Issues & Defects
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Default to active project on first load if available
    if (this.selectedProjectFilter === "all" && activeProject && this._hasInitializedFilter !== true) {
      this.selectedProjectFilter = activeProject.id;
      this._hasInitializedFilter = true;
    }

    const allProjects = store.getAuthorizedProjects ? store.getAuthorizedProjects() : store.getProjects();
    const allDocuments = store.getDocuments ? store.getDocuments() : [];
    const templates = store.getDocumentTemplates ? store.getDocumentTemplates() : [];

    // Filter documents by workspace/project if set
    let documents = [...allDocuments];
    if (this.selectedProjectFilter !== "all") {
      documents = documents.filter(d => d.projectId === this.selectedProjectFilter);
    }
    const totalDocs = documents.length;
    const drafts = documents.filter(d => (d.status || "").toLowerCase() === "draft").length;
    const inReview = documents.filter(d => (d.status || "").toLowerCase() === "in review").length;
    const approved = documents.filter(d => (d.status || "").toLowerCase() === "approved").length;
    const finalDocs = documents.filter(d => (d.status || "").toLowerCase() === "final").length;

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-12">

        <!-- 1. HEADER & TOP ACTIONS -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">QA Documentation</h1>
              <span class="px-2 py-0.5 rounded bg-slate-900 text-[#bef264] text-xs font-bold border border-slate-200">
                Strategy & Plans
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Author master test strategies, test plans, regression specs, and formal QA release sign-offs.</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="DocumentationView.switchTab('templates')" class="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="layout-template" class="w-4 h-4 text-slate-900"></i>
              <span>Templates Gallery</span>
            </button>
            <button onclick="DocumentationView.openCreateDocModal()" class="px-3.5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4 text-slate-950"></i>
              <span>+ New QA Document</span>
            </button>
          </div>
        </div>

        <!-- 2. KPI METRICS (REAL DATA) -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3.5 sm:gap-4">
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">TOTAL DOCUMENTS</span>
            <div class="text-2xl font-bold text-slate-900 tracking-tight mt-1">${totalDocs}</div>
            <span class="text-[10px] text-slate-400 mt-0.5 block">Active across projects</span>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">DRAFTS</span>
            <div class="text-2xl font-bold text-slate-700 tracking-tight mt-1">${drafts}</div>
            <span class="text-[10px] text-slate-400 mt-0.5 block">In authoring / edit</span>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-amber-600 block">IN REVIEW</span>
            <div class="text-2xl font-bold text-amber-600 tracking-tight mt-1">${inReview}</div>
            <span class="text-[10px] text-amber-600/80 mt-0.5 block">Awaiting PM signoff</span>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[#4d7c0f] block">APPROVED</span>
            <div class="text-2xl font-bold text-[#4d7c0f] tracking-tight mt-1">${approved}</div>
            <span class="text-[10px] text-[#4d7c0f]/80 mt-0.5 block">Quality Gate passed</span>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs col-span-2 sm:col-span-1">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 block">FINAL</span>
            <div class="text-2xl font-bold text-emerald-600 tracking-tight mt-1">${finalDocs}</div>
            <span class="text-[10px] text-emerald-600/80 mt-0.5 block">Published deliverable</span>
          </div>
        </div>

        <!-- 3. NAVIGATION SUB-TABS -->
        <div class="flex items-center justify-between border-b border-slate-200 gap-4 overflow-x-auto pb-px">
          <div class="flex items-center gap-2">
            <button onclick="DocumentationView.switchTab('docs')" class="px-3.5 py-2.5 text-xs transition whitespace-nowrap cursor-pointer ${this.activeTab === 'docs' ? 'border-b-2 border-slate-950 text-slate-950 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'}">
              <span class="flex items-center gap-1.5"><i data-lucide="file-text" class="w-4 h-4"></i> All Documents (${totalDocs})</span>
            </button>
            <button onclick="DocumentationView.switchTab('studio')" class="px-3.5 py-2.5 text-xs transition whitespace-nowrap cursor-pointer ${this.activeTab === 'studio' ? 'border-b-2 border-slate-950 text-slate-950 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'}">
              <span class="flex items-center gap-1.5"><i data-lucide="edit-3" class="w-4 h-4 text-slate-700"></i> QA Document Studio</span>
            </button>
            <button onclick="DocumentationView.switchTab('templates')" class="px-3.5 py-2.5 text-xs transition whitespace-nowrap cursor-pointer ${this.activeTab === 'templates' ? 'border-b-2 border-slate-950 text-slate-950 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'}">
              <span class="flex items-center gap-1.5"><i data-lucide="layout-template" class="w-4 h-4 text-slate-700"></i> Corporate QA Templates</span>
            </button>
          </div>
        </div>

        <!-- 4. TAB CONTENT AREA -->
        <div id="docTabContentArea">
          ${this.renderActiveTabContent(activeProject, allProjects, documents, templates)}
        </div>

        <!-- Modal Container -->
        <div id="docModalContainer"></div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderActiveTabContent(activeProject, allProjects, documents, templates) {
    switch (this.activeTab) {
      case "studio":
        return this.renderStudioTab(documents, allProjects);
      case "templates":
        return this.renderTemplatesTab(templates);
      case "preview":
        return this.renderDocumentPrintPreview(documents, allProjects);
      case "docs":
      default:
        return this.renderDocsTab(documents, allProjects);
    }
  },

  // =========================================================================
  // SUB-TAB 1: ALL DOCUMENTS LIST (Section 15 & 16)
  // =========================================================================
  renderDocsTab(documents, allProjects) {
    let filtered = [...documents];

    if (this.selectedProjectFilter !== "all") {
      filtered = filtered.filter(d => d.projectId === this.selectedProjectFilter);
    }
    if (this.selectedTypeFilter !== "all") {
      filtered = filtered.filter(d => d.type === this.selectedTypeFilter);
    }
    if (this.selectedStatusFilter !== "all") {
      filtered = filtered.filter(d => (d.status || "Draft").toLowerCase() === this.selectedStatusFilter.toLowerCase());
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        (d.type && d.type.toLowerCase().includes(q))
      );
    }

    return `
      <div class="space-y-4 text-xs">
        
        <!-- Filters Toolbar -->
        <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div class="relative flex-1 min-w-[220px]">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none"></i>
            <input
              type="text"
              value="${this.searchQuery}"
              oninput="DocumentationView.handleSearch(this.value)"
              placeholder="Search QA strategies, test plans, specs..."
              class="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Project Filter -->
            <select onchange="DocumentationView.handleProjectFilter(this.value)" class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 cursor-pointer">
              <option value="all" ${this.selectedProjectFilter === 'all' ? 'selected' : ''}>All Projects (${allProjects.length})</option>
              ${allProjects.map(p => `<option value="${p.id}" ${this.selectedProjectFilter === p.id ? 'selected' : ''}>${p.name} [${p.key || 'PRJ'}]</option>`).join("")}
            </select>

            <!-- Document Type Filter -->
            <select onchange="DocumentationView.handleTypeFilter(this.value)" class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 cursor-pointer">
              <option value="all" ${this.selectedTypeFilter === 'all' ? 'selected' : ''}>All Document Types</option>
              <option value="Test Strategy" ${this.selectedTypeFilter === 'Test Strategy' ? 'selected' : ''}>Test Strategy</option>
              <option value="Test Plan" ${this.selectedTypeFilter === 'Test Plan' ? 'selected' : ''}>Test Plan</option>
              <option value="Release Sign-Off" ${this.selectedTypeFilter === 'Release Sign-Off' ? 'selected' : ''}>Release Sign-Off</option>
              <option value="Requirements" ${this.selectedTypeFilter === 'Requirements' ? 'selected' : ''}>PRD & Requirements</option>
              <option value="QA Report" ${this.selectedTypeFilter === 'QA Report' ? 'selected' : ''}>QA Report</option>
            </select>

            <!-- Status Filter -->
            <select onchange="DocumentationView.handleStatusFilter(this.value)" class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 cursor-pointer">
              <option value="all" ${this.selectedStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="Draft" ${this.selectedStatusFilter === 'Draft' ? 'selected' : ''}>Draft</option>
              <option value="In Review" ${this.selectedStatusFilter === 'In Review' ? 'selected' : ''}>In Review</option>
              <option value="Approved" ${this.selectedStatusFilter === 'Approved' ? 'selected' : ''}>Approved</option>
              <option value="Final" ${this.selectedStatusFilter === 'Final' ? 'selected' : ''}>Final</option>
            </select>
          </div>
        </div>

        <!-- Documents Table -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs text-slate-600">
              <thead>
                <tr class="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th class="py-3 px-4 min-w-[240px]">DOCUMENT TITLE</th>
                  <th class="py-3 px-4">PROJECT</th>
                  <th class="py-3 px-4">TYPE</th>
                  <th class="py-3 px-4">RELEASE</th>
                  <th class="py-3 px-4">STATUS</th>
                  <th class="py-3 px-4">AUTHOR</th>
                  <th class="py-3 px-4">LAST UPDATED</th>
                  <th class="py-3 px-4 text-right min-w-[140px]">ACTIONS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="8" class="p-12 text-center text-slate-400">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <i data-lucide="file-x" class="w-8 h-8 text-slate-300"></i>
                        <span class="font-bold text-slate-700">No QA documents found</span>
                        <p class="text-[11px] text-slate-400 max-w-sm">Create a new test plan or start from a corporate template.</p>
                        <button onclick="DocumentationView.openCreateDocModal()" class="mt-2 px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl cursor-pointer">
                          + Create First QA Document
                        </button>
                      </div>
                    </td>
                  </tr>
                ` : filtered.map(doc => {
                  const project = store.getProjectById(doc.projectId);
                  const author = store.getUserById(doc.ownerId) || { name: doc.authorName || 'QA Lead' };

                  let statusClass = "bg-slate-100 text-slate-600 border-slate-200";
                  if (doc.status === "In Review") statusClass = "bg-amber-50 text-amber-700 border-amber-200";
                  else if (doc.status === "Approved") statusClass = "bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]";
                  else if (doc.status === "Final") statusClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

                  const updatedDate = doc.lastUpdated ? doc.lastUpdated.split(" ")[0] : "Recently";

                  return `
                    <tr class="hover:bg-slate-50/80 transition group">
                      <td class="py-3.5 px-4">
                        <div class="flex items-start gap-2.5">
                          <i data-lucide="file-text" class="w-4 h-4 text-slate-900 mt-0.5 shrink-0"></i>
                          <div>
                            <span class="font-bold text-slate-900 group-hover:text-[#4d7c0f] transition cursor-pointer" onclick="DocumentationView.openInStudio('${doc.id}')">
                              ${doc.name}
                            </span>
                            <span class="text-[10px] text-slate-400 block mt-0.5">${(doc.testMatrix || []).length} Test Scenarios &bull; Version ${doc.version || 'v1.0'}</span>
                          </div>
                        </div>
                      </td>

                      <td class="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          ${project ? project.name : 'General'}
                        </span>
                      </td>

                      <td class="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                        ${doc.type || 'Test Strategy'}
                      </td>

                      <td class="py-3.5 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">
                        ${doc.release || 'v1.0.0'}
                      </td>

                      <td class="py-3.5 px-4 whitespace-nowrap">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusClass}">
                          ${doc.status || 'Draft'}
                        </span>
                      </td>

                      <td class="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                        ${author.name}
                      </td>

                      <td class="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        ${updatedDate}
                      </td>

                      <td class="py-3.5 px-4 text-right whitespace-nowrap">
                        <div class="flex items-center justify-end gap-1.5">
                          <button onclick="DocumentationView.openInStudio('${doc.id}')" class="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer" title="Edit Document">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                            <span>Edit</span>
                          </button>
                          <button onclick="DocumentationView.openApprovalModal('${doc.id}')" class="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer" title="Review & Sign-Off">
                            <i data-lucide="check-check" class="w-4 h-4"></i>
                          </button>
                          <button onclick="DocumentationView.openExportModal('${doc.id}')" class="p-1 text-slate-400 hover:text-[#4d7c0f] hover:bg-slate-100 rounded-lg transition cursor-pointer" title="Export Deliverable">
                            <i data-lucide="download" class="w-4 h-4"></i>
                          </button>
                          <button onclick="DocumentationView.deleteDoc('${doc.id}')" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer" title="Delete Document">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
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

      </div>
    `;
  },

  // =========================================================================
  // SUB-TAB 2: QA DOCUMENT STUDIO (RICH POINT-BY-POINT AUTHORING)
  // =========================================================================
  renderStudioTab(documents, allProjects) {
    const doc = store.getDocumentById(this.currentEditingDocId) || documents[0] || null;
    
    if (!doc) {
      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <i data-lucide="file-edit" class="w-8 h-8 text-slate-300 mx-auto"></i>
          <p class="font-bold text-slate-800 text-sm">No document selected in Studio.</p>
          <p class="text-xs text-slate-500">Select an existing QA document or initialize a new one.</p>
          <button onclick="DocumentationView.openCreateDocModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl text-xs cursor-pointer">
            + Create New QA Document
          </button>
        </div>
      `;
    }

    const project = store.getProjectById(doc.projectId) || store.getActiveProject();
    const activeUser = store.getActiveUser();
    const testMatrix = doc.testMatrix || [];

    return `
      <div class="space-y-4 text-xs">
        
        <!-- Studio Action Header -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <button onclick="DocumentationView.switchTab('docs')" class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer" title="Back to List">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  id="studioDocTitle"
                  value="${doc.name || 'Untitled QA Document'}"
                  onblur="DocumentationView.updateDocField('name', this.value)"
                  class="font-bold text-base text-slate-900 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-[#84cc16] focus:outline-none px-1"
                />
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${doc.status === 'Approved' ? 'bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]' : (doc.status === 'Final' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}">
                  ${doc.status || 'Draft'}
                </span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Project: <strong>${project ? project.name : 'General'}</strong></span>
                <span>&bull;</span>
                <span>Type: <strong>${doc.type || 'QA Specification'}</strong></span>
                <span>&bull;</span>
                <span>Release: <strong class="font-mono">${doc.release || 'v1.0.0'}</strong></span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="DocumentationView.saveStudioDoc()" class="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="save" class="w-4 h-4 text-slate-600"></i>
              <span>Save Document</span>
            </button>
            <button onclick="DocumentationView.openPreviewFor('${doc.id}')" class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="eye" class="w-4 h-4 text-white"></i>
              <span>Preview / Print</span>
            </button>
            <button onclick="DocumentationView.openExportModal('${doc.id}')" class="px-3.5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="download" class="w-4 h-4 text-slate-950"></i>
              <span>Export Deliverable</span>
            </button>
          </div>
        </div>

        <!-- Studio Form Canvas -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-5xl mx-auto">
          
          <!-- Point 1: Executive Scope & Objectives -->
          <div class="space-y-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-slate-950 text-[#bef264] text-[11px] flex items-center justify-center font-bold">1</span>
              <span>Executive Scope & Testing Objectives</span>
            </h3>
            <textarea
              id="docPointDescription"
              rows="3"
              onblur="DocumentationView.updateDocField('description', this.value)"
              class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"
              placeholder="Describe the QA testing scope, target release goals, and quality objectives..."
            >${doc.description || ''}</textarea>
          </div>

          <!-- Point 2 & 3: Pre-requisites & Environment -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="space-y-2">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] flex items-center justify-center font-bold">2</span>
                <span>Pre-requisites & Required Configurations</span>
              </h3>
              <textarea
                id="docPointPrereq"
                rows="3"
                onblur="DocumentationView.updateDocField('prerequisites', this.value)"
                class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none font-mono"
                placeholder="Required permissions, build versions, and configuration settings..."
              >${doc.prerequisites || ''}</textarea>
            </div>

            <div class="space-y-2">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] flex items-center justify-center font-bold">3</span>
                <span>Target Environments & Dependencies</span>
              </h3>
              <textarea
                id="docPointEnv"
                rows="3"
                onblur="DocumentationView.updateDocField('environment', this.value)"
                class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none font-mono"
                placeholder="Staging QA Cluster, API Gateways, Database versions..."
              >${doc.environment || ''}</textarea>
            </div>
          </div>

          <!-- Point 4: Interactive Test Scenarios Matrix -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">4</span>
                  <span>Interactive Test Scenarios Matrix (${testMatrix.length})</span>
                </h3>
                <p class="text-[11px] text-slate-500 mt-0.5">Define core test verification cases, expected vs actual results, and status.</p>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="DocumentationView.importProjectTestCases()" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-900 text-[#bef264] hover:border-slate-400 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer" title="Pull test cases from active project">
                  <i data-lucide="folder-input" class="w-3.5 h-3.5 text-slate-900"></i>
                  <span>Import Project Cases</span>
                </button>
                <button onclick="DocumentationView.importProjectBugs()" class="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-700 hover:border-rose-300 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer" title="Pull active bugs for retest matrix">
                  <i data-lucide="bug" class="w-3.5 h-3.5 text-rose-600"></i>
                  <span>Import Project Bugs</span>
                </button>
                <button onclick="DocumentationView.addNewTestRow()" class="px-3 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 shadow-2xs cursor-pointer">
                  <i data-lucide="plus" class="w-3.5 h-3.5 text-slate-950"></i>
                  <span>+ Add Scenario Row</span>
                </button>
              </div>
            </div>

            <!-- Table -->
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th class="py-2.5 px-3 w-16"># ID</th>
                      <th class="py-2.5 px-3 min-w-[180px]">SCENARIO TITLE</th>
                      <th class="py-2.5 px-3 min-w-[180px]">STEPS TO EXECUTE</th>
                      <th class="py-2.5 px-3 min-w-[160px]">EXPECTED RESULT</th>
                      <th class="py-2.5 px-3 min-w-[160px]">ACTUAL RESULT</th>
                      <th class="py-2.5 px-3">STATUS</th>
                      <th class="py-2.5 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 bg-white">
                    ${testMatrix.length === 0 ? `
                      <tr>
                        <td colspan="7" class="p-6 text-center text-slate-400">
                          No test scenarios in matrix. Click "+ Add Scenario Row" above to add test records.
                        </td>
                      </tr>
                    ` : testMatrix.map((row, idx) => `
                      <tr class="hover:bg-slate-50/80 transition">
                        <td class="py-2.5 px-3 font-mono font-bold text-slate-900 align-top">
                          <input type="text" value="${row.id || ('TC-0' + (idx + 1))}" onchange="DocumentationView.updateMatrixCell(${idx}, 'id', this.value)" class="w-16 bg-transparent font-mono font-bold text-slate-900 border-0 border-b border-transparent focus:border-[#84cc16] focus:ring-0 p-0 text-xs" />
                        </td>
                        <td class="py-2.5 px-3 align-top">
                          <input type="text" value="${row.title || ''}" onchange="DocumentationView.updateMatrixCell(${idx}, 'title', this.value)" class="w-full font-bold text-slate-900 bg-transparent border-0 border-b border-transparent focus:border-[#84cc16] focus:ring-0 p-0 text-xs" placeholder="Scenario description" />
                        </td>
                        <td class="py-2.5 px-3 align-top">
                          <textarea rows="2" onchange="DocumentationView.updateMatrixCell(${idx}, 'steps', this.value)" class="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 leading-tight focus:bg-white" placeholder="Steps to execute...">${row.steps || ''}</textarea>
                        </td>
                        <td class="py-2.5 px-3 align-top">
                          <textarea rows="2" onchange="DocumentationView.updateMatrixCell(${idx}, 'expectedResult', this.value)" class="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-800 leading-tight focus:bg-white" placeholder="Expected behavior...">${row.expectedResult || ''}</textarea>
                        </td>
                        <td class="py-2.5 px-3 align-top">
                          <textarea rows="2" onchange="DocumentationView.updateMatrixCell(${idx}, 'actualResult', this.value)" class="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-800 leading-tight focus:bg-white" placeholder="Observed result...">${row.actualResult || ''}</textarea>
                        </td>
                        <td class="py-2.5 px-3 align-top whitespace-nowrap">
                          <select onchange="DocumentationView.updateMatrixCell(${idx}, 'status', this.value)" class="px-2 py-1 rounded text-xs font-bold cursor-pointer border ${row.status === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (row.status === 'Fail' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200')}">
                            <option value="Pass" ${row.status === 'Pass' ? 'selected' : ''}>Pass ✓</option>
                            <option value="Fail" ${row.status === 'Fail' ? 'selected' : ''}>Fail ✕</option>
                            <option value="Blocked" ${row.status === 'Blocked' ? 'selected' : ''}>Blocked ⚠</option>
                            <option value="Untested" ${row.status === 'Untested' || !row.status ? 'selected' : ''}>Untested</option>
                          </select>
                        </td>
                        <td class="py-2.5 px-3 align-top text-right whitespace-nowrap">
                          <button onclick="DocumentationView.deleteMatrixRow(${idx})" class="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer" title="Delete Row">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                          </button>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Point 5: Sign-off & Quality Gate Verdict -->
          <div class="space-y-3 pt-4 border-t border-slate-200">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-slate-950 text-[#bef264] text-[11px] flex items-center justify-center font-bold">5</span>
              <span>QA Sign-Off Statement & Quality Gate Decision</span>
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span class="text-slate-500 block font-semibold">Quality Gate Status:</span>
                <select onchange="DocumentationView.updateDocField('qualityGateVerdict', this.value)" class="mt-1 w-full bg-white border border-slate-200 font-bold text-slate-800 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none cursor-pointer">
                  <option value="READY FOR RELEASE" ${doc.qualityGateVerdict === 'READY FOR RELEASE' ? 'selected' : ''}>READY FOR RELEASE ✓</option>
                  <option value="READY WITH KNOWN ISSUES" ${doc.qualityGateVerdict === 'READY WITH KNOWN ISSUES' ? 'selected' : ''}>READY WITH KNOWN ISSUES ⚠</option>
                  <option value="BLOCKED" ${doc.qualityGateVerdict === 'BLOCKED' ? 'selected' : ''}>BLOCKED ✕</option>
                </select>
              </div>

              <div>
                <span class="text-slate-500 block font-semibold">Prepared By (Lead QA):</span>
                <input
                  type="text"
                  value="${doc.leadTester || (activeUser ? activeUser.name : 'QA Lead')}"
                  onblur="DocumentationView.updateDocField('leadTester', this.value)"
                  class="mt-1 w-full bg-white border border-slate-200 font-medium text-slate-800 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"
                />
              </div>

              <div>
                <span class="text-slate-500 block font-semibold">Authorized Reviewer:</span>
                <input
                  type="text"
                  value="${doc.reviewerName || ''}"
                  placeholder="e.g. Project Manager"
                  onblur="DocumentationView.updateDocField('reviewerName', this.value)"
                  class="mt-1 w-full bg-white border border-slate-200 font-medium text-slate-800 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  },

  // =========================================================================
  // SUB-TAB 3: CORPORATE QA TEMPLATES GALLERY
  // =========================================================================
  renderTemplatesTab(templates) {
    return `
      <div class="space-y-4 text-xs">
        <div class="flex items-center justify-between">
          <p class="text-slate-500">Standard corporate QA templates for master strategies, test plans, regression suites, and release sign-offs.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${templates.map(t => `
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between space-y-4">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="px-2 py-0.5 rounded bg-slate-900 text-[#bef264] text-[10px] font-semibold uppercase">${t.category}</span>
                    <h4 class="text-sm font-bold text-slate-900 mt-2">${t.name}</h4>
                  </div>
                </div>

                <p class="text-xs text-slate-500 mt-2 leading-relaxed font-normal">
                  ${t.description}
                </p>

                <div class="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  <span class="text-[10px] font-bold text-slate-400 uppercase block">Included Sections:</span>
                  <div class="flex flex-wrap gap-1 text-[10px]">
                    <span class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">Scope</span>
                    <span class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">Pre-reqs</span>
                    <span class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">Environment</span>
                    <span class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">Test Matrix</span>
                    <span class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">Sign-Off</span>
                  </div>
                </div>
              </div>

              <div class="pt-2 border-t border-slate-100">
                <button onclick="DocumentationView.useTemplate('${t.id}')" class="px-3.5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-black transition flex items-center gap-1 w-full justify-center cursor-pointer">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5 text-slate-950"></i>
                  <span>Instantiate Template</span>
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  },

  // =========================================================================
  // PRINT & PREVIEW VIEW
  // =========================================================================
  renderDocumentPrintPreview(documents, allProjects) {
    const doc = store.getDocumentById(this.currentEditingDocId) || documents[0] || {};
    const project = store.getProjectById(doc.projectId) || store.getActiveProject();
    const testMatrix = doc.testMatrix || [];

    return `
      <div class="space-y-4 text-xs">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <button onclick="DocumentationView.switchTab('studio')" class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer flex items-center gap-1.5">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            <span class="font-bold">Back to Editor</span>
          </button>
          <div class="flex items-center gap-2">
            <button onclick="window.print()" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="printer" class="w-4 h-4 text-slate-700"></i>
              <span>Print / Save as PDF</span>
            </button>
            <button onclick="DocumentationView.openExportModal('${doc.id}')" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="download" class="w-4 h-4 text-slate-950"></i>
              <span>Export Deliverable</span>
            </button>
          </div>
        </div>

        <div class="bg-slate-200/80 p-4 sm:p-8 rounded-2xl flex justify-center overflow-x-auto">
          <div class="bg-white shadow-2xl rounded-lg p-8 sm:p-12 w-full max-w-4xl space-y-8 border border-slate-200 text-slate-800">
            
            <!-- Document Header -->
            <div class="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-black text-xs tracking-tight text-slate-900 uppercase">PULSEWAVE QA DELIVERABLE</span>
                </div>
                <h2 class="text-2xl font-bold text-slate-900 tracking-tight mt-2">${doc.name || 'QA Document'}</h2>
                <div class="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Project: <strong class="text-slate-800">${project ? project.name : 'General'}</strong></span>
                  <span>&bull;</span>
                  <span>Release: <strong class="font-mono text-slate-900">${doc.release || 'v1.0.0'}</strong></span>
                  <span>&bull;</span>
                  <span>Version: <strong class="font-mono text-slate-700">${doc.version || 'v1.0'}</strong></span>
                </div>
              </div>

              <span class="px-2.5 py-1 rounded text-[11px] font-bold uppercase ${doc.status === 'Approved' ? 'bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]' : 'bg-slate-100 text-slate-700'}">
                ${doc.status || 'Draft'}
              </span>
            </div>

            <!-- 1. Scope -->
            <div class="space-y-2 text-xs">
              <h4 class="font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200">1. Executive Testing Scope & Objectives</h4>
              <p class="text-slate-600 leading-relaxed">${doc.description || 'QA testing completed against project specifications with verified results.'}</p>
            </div>

            <!-- 2. Pre-requisites & Environment -->
            <div class="space-y-2 text-xs">
              <h4 class="font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200">2. Environmental Requirements & Pre-requisites</h4>
              <div class="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div><strong class="block text-slate-700">Pre-requisites:</strong> ${doc.prerequisites || 'None specified'}</div>
                <div><strong class="block text-slate-700">Environment:</strong> ${doc.environment || 'Staging Lab'}</div>
              </div>
            </div>

            <!-- 3. Test Scenarios -->
            <div class="space-y-2 text-xs">
              <h4 class="font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200">3. Verified Test Execution Summary</h4>
              <table class="w-full text-left border-collapse text-[11px] border border-slate-200">
                <thead class="bg-slate-50 font-bold border-b border-slate-200">
                  <tr>
                    <th class="p-2">ID</th>
                    <th class="p-2">Scenario</th>
                    <th class="p-2">Expected Result</th>
                    <th class="p-2">Actual Result</th>
                    <th class="p-2">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${testMatrix.length === 0 ? `
                    <tr><td colspan="5" class="p-4 text-center text-slate-400">No test scenarios recorded.</td></tr>
                  ` : testMatrix.map(r => `
                    <tr>
                      <td class="p-2 font-mono font-bold text-slate-900">${r.id}</td>
                      <td class="p-2 font-semibold text-slate-900">${r.title}</td>
                      <td class="p-2 text-slate-700">${r.expectedResult || ''}</td>
                      <td class="p-2 text-slate-700">${r.actualResult || ''}</td>
                      <td class="p-2 font-bold ${r.status === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}">${r.status || 'Untested'}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <!-- Sign-Off Block -->
            <div class="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-6 text-xs">
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Prepared By Lead QA:</span>
                <strong class="text-slate-800">${doc.leadTester || 'QA Lead'}</strong> (Verified)
              </div>
              <div class="text-right">
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Authorized Approval:</span>
                <strong class="text-slate-800">${doc.reviewerName || 'Project Manager'}</strong>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // ACTIONS & HANDLERS
  // =========================================================================
  switchTab(tab) {
    this.activeTab = tab;
    this.render(document.getElementById("mainContent"));
  },

  openInStudio(docId) {
    this.currentEditingDocId = docId;
    this.switchTab("studio");
  },

  openPreviewFor(docId) {
    this.currentEditingDocId = docId;
    this.switchTab("preview");
  },

  updateDocField(field, value) {
    if (!this.currentEditingDocId) return;
    store.updateDocument(this.currentEditingDocId, { [field]: value });
  },

  updateMatrixCell(rowIdx, field, value) {
    const doc = store.getDocumentById(this.currentEditingDocId);
    if (!doc) return;
    if (!doc.testMatrix) doc.testMatrix = [];
    if (doc.testMatrix[rowIdx]) {
      doc.testMatrix[rowIdx][field] = value;
      store.updateDocument(this.currentEditingDocId, { testMatrix: doc.testMatrix });
    }
  },

  addNewTestRow() {
    const doc = store.getDocumentById(this.currentEditingDocId);
    if (!doc) return;
    if (!doc.testMatrix) doc.testMatrix = [];
    const count = doc.testMatrix.length + 1;
    doc.testMatrix.push({
      id: `TC-0${count}`,
      title: "New Verification Scenario",
      steps: "",
      expectedResult: "",
      actualResult: "",
      status: "Untested"
    });
    store.updateDocument(this.currentEditingDocId, { testMatrix: doc.testMatrix });
    this.render(document.getElementById("mainContent"));
  },

  deleteMatrixRow(rowIdx) {
    const doc = store.getDocumentById(this.currentEditingDocId);
    if (!doc || !doc.testMatrix) return;
    doc.testMatrix.splice(rowIdx, 1);
    store.updateDocument(this.currentEditingDocId, { testMatrix: doc.testMatrix });
    this.render(document.getElementById("mainContent"));
  },

  importProjectTestCases() {
    const doc = store.getDocumentById(this.currentEditingDocId);
    if (!doc) return;
    const testCases = store.getTestCases ? store.getTestCases(doc.projectId) : [];
    if (!testCases || testCases.length === 0) {
      window.dispatchEvent(new CustomEvent("qa-toast", {
        detail: {
          title: "No Project Cases",
          message: "No test cases found for this project.",
          type: "info"
        }
      }));
      return;
    }
    if (!doc.testMatrix) doc.testMatrix = [];
    let addedCount = 0;
    testCases.forEach(tc => {
      const exists = doc.testMatrix.some(m => m.id === tc.key || m.id === tc.id || m.title === tc.title);
      if (!exists) {
        doc.testMatrix.push({
          id: tc.key || `TC-${doc.testMatrix.length + 1}`,
          title: tc.title || tc.name || "Test Case",
          steps: tc.steps || (tc.testData ? `Test Data: ${tc.testData}` : ""),
          expectedResult: tc.expectedResult || tc.expected || "Expected behavior verified",
          actualResult: tc.actualResult || (tc.status === "Passed" ? "Verified Pass" : ""),
          status: tc.status === "Passed" ? "Pass" : (tc.status === "Failed" ? "Fail" : (tc.status === "Blocked" ? "Blocked" : "Untested"))
        });
        addedCount++;
      }
    });
    store.updateDocument(this.currentEditingDocId, { testMatrix: doc.testMatrix });
    window.dispatchEvent(new CustomEvent("qa-toast", {
      detail: {
        title: "Test Cases Imported",
        message: `Imported ${addedCount} test cases from active project.`,
        type: "success"
      }
    }));
    this.render(document.getElementById("mainContent"));
  },

  importProjectBugs() {
    const doc = store.getDocumentById(this.currentEditingDocId);
    if (!doc) return;
    const issues = store.getIssues ? store.getIssues(doc.projectId) : [];
    const bugs = issues.filter(i => (i.type || "").toLowerCase() === "bug");
    if (!bugs || bugs.length === 0) {
      window.dispatchEvent(new CustomEvent("qa-toast", {
        detail: {
          title: "No Project Defects",
          message: "Zero bug tickets found for this project.",
          type: "info"
        }
      }));
      return;
    }
    if (!doc.testMatrix) doc.testMatrix = [];
    let addedCount = 0;
    bugs.forEach(bug => {
      const exists = doc.testMatrix.some(m => m.id === bug.key || m.id === bug.id);
      if (!exists) {
        doc.testMatrix.push({
          id: bug.key || `BUG-${doc.testMatrix.length + 1}`,
          title: `[Defect Retest] ${bug.title}`,
          steps: bug.stepsToReproduce || bug.description || "Verify defect resolution and edge cases",
          expectedResult: bug.expectedResult || "Defect resolved and verified closed",
          actualResult: bug.status === "Closed" || bug.status === "Done" ? "Fix verified in build" : "Pending retest",
          status: bug.status === "Closed" || bug.status === "Done" ? "Pass" : "Untested"
        });
        addedCount++;
      }
    });
    store.updateDocument(this.currentEditingDocId, { testMatrix: doc.testMatrix });
    window.dispatchEvent(new CustomEvent("qa-toast", {
      detail: {
        title: "Defects Imported",
        message: `Imported ${addedCount} defects into verification matrix.`,
        type: "success"
      }
    }));
    this.render(document.getElementById("mainContent"));
  },

  saveStudioDoc() {
    const title = document.getElementById("studioDocTitle")?.value;
    const desc = document.getElementById("docPointDescription")?.value;
    const prereq = document.getElementById("docPointPrereq")?.value;
    const env = document.getElementById("docPointEnv")?.value;

    store.updateDocument(this.currentEditingDocId, {
      name: title,
      description: desc,
      prerequisites: prereq,
      environment: env
    });

    window.dispatchEvent(new CustomEvent("qa-toast", {
      detail: {
        title: "Document Saved",
        message: "QA Document updated successfully.",
        type: "success"
      }
    }));
  },

  useTemplate(templateId) {
    const tmpl = store.getDocumentTemplateById ? store.getDocumentTemplateById(templateId) : null;
    if (!tmpl) return;
    const activeProject = store.getActiveProject();
    const activeUser = store.getActiveUser();

    const doc = store.createDocument({
      projectId: activeProject ? activeProject.id : null,
      name: `${tmpl.name} — ${activeProject ? activeProject.name : 'Project'}`,
      type: tmpl.category || "Test Strategy",
      version: "v1.0",
      release: "v1.0.0",
      status: "Draft",
      ownerId: activeUser ? activeUser.id : null,
      authorName: activeUser ? activeUser.name : "QA Lead",
      leadTester: activeUser ? activeUser.name : "QA Lead",
      description: tmpl.content || tmpl.description,
      prerequisites: tmpl.prerequisites || "",
      environment: tmpl.environment || "Staging QA Lab",
      testMatrix: JSON.parse(JSON.stringify(tmpl.testMatrix || []))
    });

    window.dispatchEvent(new CustomEvent("qa-toast", {
      detail: {
        title: "Created from Template",
        message: `Instantiated "${doc.name}"`,
        type: "success"
      }
    }));

    this.openInStudio(doc.id);
  },

  deleteDoc(docId) {
    if (!confirm("Are you sure you want to delete this QA document?")) return;
    store.deleteDocument(docId);
    if (this.currentEditingDocId === docId) this.currentEditingDocId = null;
    window.dispatchEvent(new CustomEvent("qa-toast", {
      detail: {
        title: "Document Removed",
        message: "QA document deleted.",
        type: "info"
      }
    }));
    this.render(document.getElementById("mainContent"));
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.render(document.getElementById("mainContent"));
  },

  handleProjectFilter(val) {
    this.selectedProjectFilter = val;
    this.render(document.getElementById("mainContent"));
  },

  handleTypeFilter(val) {
    this.selectedTypeFilter = val;
    this.render(document.getElementById("mainContent"));
  },

  handleStatusFilter(val) {
    this.selectedStatusFilter = val;
    this.render(document.getElementById("mainContent"));
  },

  // =========================================================================
  // MODALS: CREATE, APPROVAL, EXPORT
  // =========================================================================
  openCreateDocModal() {
    const activeProject = store.getActiveProject();
    const allProjects = store.getAuthorizedProjects ? store.getAuthorizedProjects() : store.getProjects();
    const modalContainer = document.getElementById("docModalContainer");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in text-xs">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
                <i data-lucide="file-plus-2" class="w-4 h-4"></i>
              </div>
              <h3 class="text-base font-bold text-slate-900">Create New QA Document</h3>
            </div>
            <button onclick="document.getElementById('docModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="DocumentationView.handleCreateDocSubmit(event)" class="space-y-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Target Project <span class="text-rose-500">*</span></label>
              <select id="newDocProjectId" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none cursor-pointer">
                ${allProjects.map(p => `<option value="${p.id}" ${activeProject && activeProject.id === p.id ? 'selected' : ''}>${p.name} [${p.key || 'PRJ'}]</option>`).join("")}
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Document Title <span class="text-rose-500">*</span></label>
              <input type="text" id="newDocName" required placeholder="e.g. Master QA Test Strategy" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Document Type</label>
                <select id="newDocType" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none cursor-pointer">
                  <option value="Test Strategy">Test Strategy</option>
                  <option value="Test Plan">Test Plan</option>
                  <option value="Release Sign-Off">Release Sign-Off</option>
                  <option value="Requirements">PRD & Requirements</option>
                  <option value="QA Report">QA Report</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Target Release</label>
                <input type="text" id="newDocRelease" value="v1.0.0" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button type="button" onclick="document.getElementById('docModalContainer').innerHTML=''; DocumentationView.switchTab('templates');" class="text-slate-900 hover:text-[#4d7c0f] hover:underline font-bold">
                Or choose from Templates &rarr;
              </button>
              <div class="flex items-center gap-2">
                <button type="button" onclick="document.getElementById('docModalContainer').innerHTML=''" class="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl cursor-pointer">Create & Open</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  handleCreateDocSubmit(e) {
    e.preventDefault();
    const projectId = document.getElementById("newDocProjectId").value;
    const name = document.getElementById("newDocName").value.trim();
    const type = document.getElementById("newDocType").value;
    const release = document.getElementById("newDocRelease").value.trim() || "v1.0.0";
    const activeUser = store.getActiveUser();

    const doc = store.createDocument({
      projectId,
      name,
      type,
      release,
      status: "Draft",
      ownerId: activeUser ? activeUser.id : null,
      authorName: activeUser ? activeUser.name : "QA Lead",
      leadTester: activeUser ? activeUser.name : "QA Lead",
      description: "",
      prerequisites: "",
      environment: "Staging QA Lab",
      testMatrix: [
        { id: "TC-01", title: "Primary Verification Scenario", steps: "", expectedResult: "", actualResult: "", status: "Untested" }
      ]
    });

    document.getElementById("docModalContainer").innerHTML = "";
    window.dispatchEvent(new CustomEvent("qa-toast", {
      detail: {
        title: "QA Document Initialized",
        message: `Created "${doc.name}"`,
        type: "success"
      }
    }));
    this.openInStudio(doc.id);
  },

  openApprovalModal(docId) {
    const doc = store.getDocumentById(docId);
    if (!doc) return;
    const modalContainer = document.getElementById("docModalContainer");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in text-xs">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Document Review & Sign-Off</h3>
            <button onclick="document.getElementById('docModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div><span class="text-slate-400">Document:</span> <strong class="text-slate-800">${doc.name}</strong></div>
            <div><span class="text-slate-400">Current Status:</span> <strong class="text-slate-900 uppercase font-bold">${doc.status || 'Draft'}</strong></div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Reviewer Sign-Off Comments</label>
            <textarea id="approvalComment" rows="2" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" placeholder="Enter review remarks or sign-off decision..."></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button onclick="DocumentationView.requestChanges('${doc.id}')" class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition cursor-pointer">Request Revisions</button>
            <button onclick="DocumentationView.approveDoc('${doc.id}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer">Approve Document</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  approveDoc(docId) {
    const comment = document.getElementById("approvalComment")?.value || "Approved for delivery.";
    store.approveDocument(docId, null, comment);
    document.getElementById("docModalContainer").innerHTML = "";
    window.dispatchEvent(new CustomEvent("qa-toast", {
      detail: {
        title: "Document Approved",
        message: "Quality Gate decision verified.",
        type: "success"
      }
    }));
    this.render(document.getElementById("mainContent"));
  },

  requestChanges(docId) {
    const comment = document.getElementById("approvalComment")?.value || "Revisions required.";
    store.requestDocumentChanges(docId, null, comment);
    document.getElementById("docModalContainer").innerHTML = "";
    window.dispatchEvent(new CustomEvent("qa-toast", {
      detail: {
        title: "Revisions Requested",
        message: "Document status updated to Draft.",
        type: "warning"
      }
    }));
    this.render(document.getElementById("mainContent"));
  },

  openExportModal(docId) {
    const doc = store.getDocumentById(docId);
    if (!doc) return;
    const modalContainer = document.getElementById("docModalContainer");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in text-xs">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Export Deliverable</h3>
            <button onclick="document.getElementById('docModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <p class="text-slate-500">Download formatted deliverables for offline review or client sign-off:</p>

          <div class="space-y-2.5">
            <div onclick="DocumentationView.downloadExport('${doc.id}', 'pdf')" class="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition">
              <div class="flex items-center gap-2.5">
                <i data-lucide="file-text" class="w-5 h-5 text-rose-600"></i>
                <div>
                  <span class="font-bold text-slate-900 block">PDF Document</span>
                  <span class="text-[10px] text-slate-400">Complete formatted specifications & sign-off</span>
                </div>
              </div>
              <button class="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded shadow-2xs">Download</button>
            </div>

            <div onclick="DocumentationView.downloadExport('${doc.id}', 'csv')" class="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition">
              <div class="flex items-center gap-2.5">
                <i data-lucide="table" class="w-5 h-5 text-emerald-600"></i>
                <div>
                  <span class="font-bold text-slate-900 block">CSV Test Scenarios</span>
                  <span class="text-[10px] text-slate-400">Test matrix rows formatted for Excel / Sheets</span>
                </div>
              </div>
              <button class="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded shadow-2xs">Download</button>
            </div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  downloadExport(docId, format) {
    const doc = store.getDocumentById(docId);
    if (!doc) return;
    document.getElementById("docModalContainer").innerHTML = "";

    if (format === 'csv') {
      const rows = doc.testMatrix || [];
      let csv = "ID,Title,Steps,Expected Result,Actual Result,Status\n";
      rows.forEach(r => {
        csv += `"${r.id || ''}","${(r.title || '').replace(/"/g, '""')}","${(r.steps || '').replace(/"/g, '""')}","${(r.expectedResult || '').replace(/"/g, '""')}","${(r.actualResult || '').replace(/"/g, '""')}","${r.status || ''}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(doc.name || 'QA_Doc').replace(/\s+/g, '_')}_Matrix.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      this.openPreviewFor(docId);
    }
  }
};

// Global Exposure
if (typeof window !== 'undefined') window.DocumentationView = DocumentationView;
if (typeof global !== 'undefined') global.DocumentationView = DocumentationView;
if (typeof module !== 'undefined' && module.exports) module.exports = DocumentationView;
