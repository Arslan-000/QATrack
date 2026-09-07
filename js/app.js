/**
 * All-in-One Software Project & QA Management Platform (V1)
 * Main Application Controller, Router & Global Modals
 */

class AppController {
  constructor() {
    this.currentView = "dashboard";
    this.selectedProjectForWorkspace = null;
    this.notificationOpen = false;
    this.personaMenuOpen = false;
    this.mobileSidebarOpen = false;
    this.searchModalOpen = false;
  }

  async init() {
    // Try restoring real Supabase authenticated user session
    if (window.supabaseClient && window.supabaseClient.auth) {
      try {
        const { data } = await window.supabaseClient.auth.getSession();
        if (data && data.session && data.session.user) {
          store.setSupabaseUser(data.session.user);
        }

        // Load real database tables if initialized in Supabase
        if (store.loadSupabaseCloudTables) {
          await store.loadSupabaseCloudTables();
        }

        // Listen for Supabase auth state changes
        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session && session.user) {
            store.setSupabaseUser(session.user);
            if (store.loadSupabaseCloudTables) await store.loadSupabaseCloudTables();
            this.updateHeaderProjectSelector();
            this.updateHeaderPersona();
            this.updateSidebarSpacesExplorer();
          } else if (event === 'SIGNED_OUT') {
            store.clearSupabaseUser();
          }
        });
      } catch (e) {
        console.warn("Supabase session restore check:", e);
      }
    }

    // Render top bar & sidebar components
    this.updateHeaderProjectSelector();
    this.updateHeaderPersona();
    this.updateNotificationBadge();
    this.updateSidebarSpacesExplorer();
    this.updateSidebarNav();
    this.updateSidebarUserFooter();
    if (typeof FloatingProjectChat !== 'undefined') FloatingProjectChat.updateWidget();

    // Subscribe to store updates
    store.subscribe(() => {
      this.updateHeaderProjectSelector();
      this.updateHeaderPersona();
      this.updateNotificationBadge();
      this.updateSidebarSpacesExplorer();
      this.updateSidebarNav();
      this.updateSidebarUserFooter();
      if (typeof FloatingProjectChat !== 'undefined') FloatingProjectChat.updateWidget();
    });

    // Listen for custom toast events
    window.addEventListener("qa-toast", (e) => {
      this.showToast(e.detail.title, e.detail.message, e.detail.type);
    });

    // Global click listener to dismiss dropdowns
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#notifDropdownBtn") && !e.target.closest("#notifDropdownMenu")) {
        this.closeNotificationMenu();
      }
      if (!e.target.closest("#personaDropdownBtn") && !e.target.closest("#personaDropdownMenu")) {
        this.closePersonaMenu();
      }
      if (!e.target.closest("#sidebarSpacesExplorerContainer")) {
        const dropdown = document.getElementById("sidebarSpacesDropdown");
        if (dropdown) dropdown.classList.add("hidden");
      }
    });

    // Global escape key handler
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeSearchModal();
        this.closeIssueDetails();
      }
    });

    // Listen for hash changes
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash ? window.location.hash.substring(1) : "";
      const route = hash || "home";
      if (route && route !== this.currentView) {
        this.navigate(route);
      }
    });

    // Handle initial route (Always navigate towards the Landing Page first)
    const initialHash = window.location.hash ? window.location.hash.substring(1) : "";
    const initialView = initialHash || "home";
    this.navigate(initialView);

    if (window.lucide) window.lucide.createIcons();
  }

  // --- TOAST NOTIFICATIONS ---
  toast(title, message, type = 'info') {
    this.showToast(title, message, type);
  }

  showToast(title, message, type = 'info') {
    let toastContainer = document.getElementById('appToastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'appToastContainer';
      toastContainer.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm pointer-events-none';
      document.body.appendChild(toastContainer);
    }

    const toastEl = document.createElement('div');
    const bgColors = {
      success: 'bg-slate-950 text-white border-l-4 border-l-[#bef264]',
      error: 'bg-slate-950 text-white border-l-4 border-l-rose-500',
      warning: 'bg-slate-950 text-white border-l-4 border-l-amber-500',
      info: 'bg-slate-950 text-white border-l-4 border-l-[#bef264]'
    };
    const iconColors = {
      success: 'text-[#bef264]',
      error: 'text-rose-400',
      warning: 'text-amber-400',
      info: 'text-[#bef264]'
    };
    const iconNames = {
      success: 'check-circle-2',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    toastEl.className = `p-4 rounded-xl shadow-2xl border border-slate-800 ${bgColors[type] || bgColors.info} animate-fade-in pointer-events-auto flex items-start gap-3 transition-all duration-300`;
    toastEl.innerHTML = `
      <div class="shrink-0 mt-0.5 ${iconColors[type] || iconColors.info}">
        <i data-lucide="${iconNames[type] || 'info'}" class="w-5 h-5"></i>
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-white tracking-tight">${title}</h4>
        ${message ? `<p class="text-[11px] text-slate-300 mt-0.5 leading-relaxed font-normal">${message}</p>` : ''}
      </div>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white shrink-0 -mt-1 -mr-1 p-1 cursor-pointer">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;

    toastContainer.appendChild(toastEl);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toastEl.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toastEl.remove(), 300);
    }, 4500);
  }

  // --- NAVIGATION ROUTER ---
  navigate(viewId, params = {}) {
    this.currentView = viewId || "home";
    window.location.hash = this.currentView;
    this.toggleMobileSidebar(false);

    const baseRoute = this.currentView.split("?")[0];
    const isPublicView = ["home", "landing", "login", "signup", "verify-email", "onboarding", "join", "invite", "accept-invite", "project-invite", ""].includes(baseRoute);
    const sidebar = document.getElementById("appSidebar");
    const appHeader = document.querySelector("header");
    const contentArea = document.getElementById("mainContent");

    if (sidebar) {
      if (isPublicView) {
        sidebar.classList.add("hidden");
        sidebar.classList.remove("md:static", "md:translate-x-0");
      } else {
        sidebar.classList.remove("hidden");
        sidebar.classList.add("md:static", "md:translate-x-0");
      }
    }

    if (appHeader) {
      if (isPublicView) {
        appHeader.classList.add("hidden");
        appHeader.classList.remove("flex");
      } else {
        appHeader.classList.remove("hidden");
        appHeader.classList.add("flex");
      }
    }

    if (contentArea) {
      if (isPublicView) {
        contentArea.className = "flex-1 overflow-y-auto bg-white p-0";
      } else {
        contentArea.className = "flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/70";
      }
      contentArea.scrollTop = 0;
    }

    // Update active nav styling & dynamic sidebar nav menu
    this.updateSidebarNav();
    document.querySelectorAll(".sidebar-nav-item").forEach(item => {
      item.classList.remove("nav-item-active");
      if (item.dataset.view === baseRoute) {
        item.classList.add("nav-item-active");
      }
    });

    // Show top-bar project selector ONLY on dashboard
    const headerProjContainer = document.getElementById("headerProjectSelectorContainer");
    if (headerProjContainer) {
      if (baseRoute === "dashboard") {
        headerProjContainer.classList.remove("hidden");
        headerProjContainer.classList.add("flex");
      } else {
        headerProjContainer.classList.add("hidden");
        headerProjContainer.classList.remove("flex");
      }
    }

    if (!contentArea) return;

    // Parse query params if present in hash (e.g. #join?ws=...&email=...)
    let queryParams = { ...params };
    if (this.currentView.includes("?")) {
      const queryString = this.currentView.split("?")[1];
      const searchParams = new URLSearchParams(queryString);
      for (const [key, val] of searchParams.entries()) {
        queryParams[key] = val;
      }
    }

    // Role-based Route Guards & Project Isolation
    if (!isPublicView) {
      const activeUser = store.getActiveUser ? store.getActiveUser() : null;
      const activeSpace = store.getActiveWorkspace ? store.getActiveWorkspace() : null;
      const spaceRole = activeSpace ? store.getUserSpaceRole(activeSpace.id, activeUser?.id) : "PM";
      const activeProject = store.getActiveProject ? store.getActiveProject() : null;
      const projectRole = activeProject ? store.getUserProjectRole(activeProject.id, activeUser?.id) : spaceRole;
      const userRole = (projectRole || spaceRole || "PM").toUpperCase();

      // Developer Route Guard: Restricted modules are blocked
      if (userRole === "DEVELOPER") {
        const restrictedDeveloperRoutes = ["test-management", "test-reports", "documentation", "reports", "backlog-sprints"];
        if (restrictedDeveloperRoutes.includes(baseRoute)) {
          this.toast("Access Restricted", "This section is restricted to Project Managers and QA Engineers.", "warning");
          this.navigate("project-workspace");
          return;
        }
      }

      // Project Isolation Guard
      if (baseRoute === "project-workspace" && queryParams.projectId) {
        const authorized = store.getAuthorizedProjects ? store.getAuthorizedProjects().some(p => p.id === queryParams.projectId || p.key === queryParams.projectId) : true;
        if (!authorized) {
          this.toast("Access Denied", "You are not assigned to this project.", "error");
          this.navigate("dashboard");
          return;
        }
        store.setActiveProject(queryParams.projectId);
      }
    }

    switch (baseRoute) {
      // Public Landing & Auth Routes
      case "home":
      case "landing":
      case "":
        LandingPageView.render(contentArea);
        break;
      case "login":
        AuthView.renderLogin(contentArea, queryParams);
        break;
      case "signup":
        AuthView.renderSignup(contentArea);
        break;
      case "verify-email":
        AuthView.renderEmailVerification(contentArea, queryParams);
        break;
      case "join":
      case "invite":
        AuthView.renderJoinWorkspace(contentArea, queryParams);
        break;
      case "accept-invite":
      case "project-invite":
        AuthView.renderAcceptProjectInvite(contentArea, queryParams);
        break;
      case "onboarding":
        OnboardingView.render(contentArea);
        break;

      // In-App Platform Routes
      case "dashboard":
        DashboardView.render(contentArea);
        break;
      case "projects":
        ProjectsView.render(contentArea);
        break;
      case "backlog-sprints":
        BacklogSprintsView.render(contentArea);
        break;
      case "project-workspace":
        if (queryParams.projectId) {
          store.setActiveProject(queryParams.projectId);
        }
        if (queryParams.tab && typeof ProjectWorkspaceView !== 'undefined') {
          ProjectWorkspaceView.activeTab = queryParams.tab;
        }
        ProjectWorkspaceView.render(contentArea);
        break;
      case "my-issues":
        MyIssuesView.render(contentArea);
        break;
      case "all-issues":
        AllIssuesView.render(contentArea);
        break;
      case "reports":
        ReportsView.render(contentArea);
        break;
      case "test-management":
        TestManagementView.render(contentArea);
        break;
      case "test-reports":
        TestReportsView.render(contentArea);
        break;
      case "documentation":
        DocumentationView.render(contentArea);
        break;
      case "qa-queue":
        this.navigate("my-issues");
        break;
      case "settings":
        SettingsView.render(contentArea);
        break;
      case "project-chat":
        const targetProjId = queryParams.projectId || (store.getActiveProject() ? store.getActiveProject().id : null);
        if (targetProjId) {
          store.setActiveProject(targetProjId);
        }
        ProjectWorkspaceView.render(contentArea);
        if (typeof FloatingProjectChat !== 'undefined') {
          FloatingProjectChat.open(targetProjId);
        }
        break;

      // Locked Future Features (Section 23 - V3)
      case "customer-portal-locked":
        ComingSoonView.render(contentArea, "Customer Portal 🔒");
        break;
      case "automation-locked":
        ComingSoonView.render(contentArea, "Automation & CI/CD 🔒");
        break;
      case "ai-assistant-locked":
        ComingSoonView.render(contentArea, "AI Quality Assistant 🔒");
        break;
      case "integrations-locked":
        ComingSoonView.render(contentArea, "External Integrations 🔒");
        break;

      default:
        LandingPageView.render(contentArea);
    }

    if (window.lucide) window.lucide.createIcons();
    if (typeof FloatingProjectChat !== 'undefined') FloatingProjectChat.updateWidget();
  }

  openCreateProjectModal() {
    if (typeof ProjectsView !== 'undefined' && ProjectsView.openCreateProjectModal) {
      ProjectsView.openCreateProjectModal();
    }
  }

  openProjectWorkspace(projectId, tab = "overview") {
    if (projectId) {
      store.setActiveProject(projectId);
    }
    if (typeof ProjectWorkspaceView !== 'undefined') {
      ProjectWorkspaceView.activeTab = tab || "overview";
    }
    this.navigate(`project-workspace?projectId=${projectId}&tab=${tab || 'overview'}`);
    if (typeof FloatingProjectChat !== 'undefined') FloatingProjectChat.updateWidget();
  }

  // --- MOBILE SIDEBAR ---
  toggleMobileSidebar(force) {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (!sidebar || !backdrop) return;

    this.mobileSidebarOpen = force !== undefined ? force : !this.mobileSidebarOpen;

    if (this.mobileSidebarOpen) {
      sidebar.classList.remove("-translate-x-full");
      backdrop.classList.remove("hidden");
      if (document.body && document.body.classList) {
        document.body.classList.add("overflow-hidden");
      }
    } else {
      sidebar.classList.add("-translate-x-full");
      backdrop.classList.add("hidden");
      if (document.body && document.body.classList) {
        document.body.classList.remove("overflow-hidden");
      }
    }
  }

  // --- TOP BAR: PROJECT SELECTOR ---
  updateHeaderProjectSelector() {
    const project = store.getActiveProject();
    const projects = store.getProjects();
    const container = document.getElementById("headerProjectSelector");
    const parentContainer = document.getElementById("headerProjectSelectorContainer");
    
    if (parentContainer) {
      if (this.currentView === "dashboard") {
        parentContainer.classList.remove("hidden");
        parentContainer.classList.add("flex");
      } else {
        parentContainer.classList.add("hidden");
        parentContainer.classList.remove("flex");
      }
    }

    if (!container) return;

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <button onclick="window.app.openCreateProjectModal()" class="px-2.5 py-1 bg-slate-100 hover:bg-[#bef264] text-slate-700 hover:text-slate-950 text-xs font-bold rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
          <span>+ Project</span>
        </button>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <select onchange="window.app.handleProjectSelect(this.value)" class="bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] transition cursor-pointer max-w-[130px] sm:max-w-[200px] md:max-w-xs truncate">
        ${projects.map(p => `<option value="${p.id}" ${project && p.id === project.id ? 'selected' : ''}>${p.key} - ${p.name}</option>`).join("")}
      </select>
    `;
  }

  handleProjectSelect(projectId) {
    store.setActiveProject(projectId);
    const p = store.getActiveProject();
    if (p) {
      this.toast("Workspace Changed", `Now viewing ${p.name} (${p.key})`, "info");
    }
    if (this.currentView === "project-workspace") {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else {
      this.navigate(this.currentView);
    }
  }

  // --- TOP BAR: LOGGED-IN USER & WORKSPACE PROFILE ---
  updateHeaderPersona() {
    const activeUser = store.getActiveUser();
    const activeWorkspace = store.getActiveWorkspace ? store.getActiveWorkspace() : null;
    const container = document.getElementById("headerPersonaWidget");
    if (!container) return;

    const isPm = activeUser && activeUser.role && (
      activeUser.role.toLowerCase().includes("project manager") || 
      activeUser.role.toLowerCase().includes("admin") || 
      activeUser.role.toLowerCase().includes("lead") || 
      activeUser.role === "OWNER"
    );

    container.innerHTML = `
      <button id="personaDropdownBtn" onclick="window.app.togglePersonaMenu()" class="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 transition border border-slate-200 bg-white cursor-pointer">
        <div class="w-7 h-7 rounded-full ${activeUser.color || 'bg-slate-950 text-[#bef264]'} text-white text-xs font-bold flex items-center justify-center shadow-xs uppercase">
          ${activeUser.initials || (activeUser.name ? activeUser.name.substring(0, 2).toUpperCase() : 'PW')}
        </div>
        <div class="text-left hidden md:block">
          <div class="text-xs font-bold text-slate-900 leading-tight">${activeUser.name || 'User'}</div>
          <div class="text-[10px] text-slate-500 font-medium">${activeUser.email || activeUser.role || 'Member'}</div>
        </div>
        <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
      </button>

      <!-- Dropdown -->
      <div id="personaDropdownMenu" class="hidden fixed sm:absolute inset-x-3 sm:inset-auto right-auto sm:right-0 top-16 sm:top-14 sm:w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-fade-in text-xs">
        <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-100 mb-2">
          <div class="font-bold text-slate-900 text-xs">${activeUser.name || 'User'}</div>
          <div class="text-[11px] text-slate-500 truncate">${activeUser.email || 'user@pulsewave.io'}</div>
          <div class="mt-1 flex items-center gap-1">
            <span class="px-1.5 py-0.2 rounded bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] text-[9px] font-bold uppercase">
              ${activeUser.role || 'Member'}
            </span>
            <span class="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase truncate max-w-[140px]">
              ${activeWorkspace ? activeWorkspace.name : 'No Space'}
            </span>
          </div>
        </div>

        <div class="space-y-1">
          ${isPm ? `
            <button onclick="window.app.closePersonaMenu(); window.app.openCreateWorkspaceModal()" class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium cursor-pointer">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Create New Space</span>
            </button>
            <button onclick="window.app.closePersonaMenu(); window.app.navigate('settings')" class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium cursor-pointer">
              <i data-lucide="shield" class="w-3.5 h-3.5 text-slate-600"></i>
              <span>Space Roles & Permissions</span>
            </button>
          ` : `
            <div class="px-2.5 py-1.5 text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <i data-lucide="shield" class="w-3.5 h-3.5 text-slate-400"></i>
              <span>Scoped Space Access</span>
            </div>
          `}
          <button onclick="window.app.closePersonaMenu(); window.app.navigate('settings')" class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium cursor-pointer">
            <i data-lucide="user" class="w-3.5 h-3.5 text-slate-600"></i>
            <span>Profile & Preferences</span>
          </button>
          <button onclick="window.app.closePersonaMenu(); window.app.navigate('settings')" class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium cursor-pointer">
            <i data-lucide="settings" class="w-3.5 h-3.5 text-slate-600"></i>
            <span>System Settings</span>
          </button>
          <button onclick="window.app.closePersonaMenu(); window.app.navigate('home')" class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium cursor-pointer">
            <i data-lucide="globe" class="w-3.5 h-3.5 text-slate-600"></i>
            <span>PulseWave Home Website</span>
          </button>
        </div>

        <div class="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
          <button onclick="window.app.signOut()" class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-bold cursor-pointer transition">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  togglePersonaMenu() {
    const menu = document.getElementById("personaDropdownMenu");
    if (menu) menu.classList.toggle("hidden");
  }

  closePersonaMenu() {
    const menu = document.getElementById("personaDropdownMenu");
    if (menu) menu.classList.add("hidden");
  }

  switchPersona(userId) {
    store.setActiveUser(userId);
    const user = store.getActiveUser();
    this.closePersonaMenu();
    this.toast("Persona Switched", `Viewing workspace as ${user.name} (${user.role}).`, "info");
    this.navigate(this.currentView);
  }

  // --- SIDEBAR: SPACES & PROJECTS EXPLORER ---
  updateSidebarSpacesExplorer() {
    const container = document.getElementById("sidebarSpacesExplorerContainer");
    if (!container) return;

    const spaces = store.getWorkspaces ? store.getWorkspaces() : [];
    const currentSpace = store.getActiveWorkspace ? store.getActiveWorkspace() : (spaces[0] || { id: "ws_default", name: "Default Space" });
    const currentActiveProject = store.getActiveProject();
    const canCreateProject = store.canCreateProject();
    const spaceRole = store.getEffectiveSpaceRole ? store.getEffectiveSpaceRole() : 'PM';
    const isSpacePm = spaceRole === "PM" || (store.isWorkspaceAdmin && store.isWorkspaceAdmin());
    const spaceProjects = store.getProjectsForCurrentSpace ? store.getProjectsForCurrentSpace() : store.getProjects();

    const spaceInitials = (currentSpace.name || "S").split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();

    container.innerHTML = `
      <div class="space-y-3">
        
        <!-- 1. SPACE CONTEXT SWITCHER -->
        <div class="relative">
          <div class="px-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>SPACE</span>
            ${isSpacePm ? `
              <button onclick="window.app.openCreateWorkspaceModal()" class="text-slate-900 hover:text-[#4d7c0f] font-bold hover:underline flex items-center gap-0.5 cursor-pointer text-[10px]" title="Create New Space">
                <i data-lucide="plus" class="w-3 h-3"></i>
                <span>New</span>
              </button>
            ` : ''}
          </div>
          <button
            type="button"
            onclick="window.app.toggleSidebarSpacesDropdown()"
            class="w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 flex items-center justify-between gap-2 transition cursor-pointer group shadow-2xs text-left"
          >
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-6 h-6 rounded-lg ${currentSpace.logo_color || 'bg-slate-950 text-[#bef264]'} text-white font-bold text-[10px] flex items-center justify-center shrink-0 uppercase shadow-2xs">
                ${spaceInitials}
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold text-slate-900 truncate leading-tight">${currentSpace.name}</div>
                <div class="text-[9px] text-slate-400 truncate">${spaceRole === 'PM' ? 'Project Manager' : (spaceRole === 'QA' ? 'QA Engineer' : (spaceRole === 'DEVELOPER' ? 'Developer' : 'Viewer'))}</div>
              </div>
            </div>
            <i data-lucide="chevrons-up-down" class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0 transition"></i>
          </button>

          <!-- Spaces Dropdown Menu -->
          <div id="sidebarSpacesDropdown" class="hidden absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-fade-in text-xs space-y-0.5">
            <div class="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Switch Space</div>
            ${spaces.map(s => {
              const isActive = s.id === currentSpace.id;
              const sInitials = (s.name || "S").split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();
              return `
                <button
                  type="button"
                  onclick="window.app.selectSidebarSpace('${s.id}')"
                  class="w-full text-left p-1.5 rounded-lg flex items-center justify-between gap-2 transition cursor-pointer ${isActive ? 'bg-[#f7fee7] text-[#4d7c0f] font-bold border border-[#d9f99d]' : 'hover:bg-slate-50 text-slate-700'}"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-5 h-5 rounded ${s.logo_color || 'bg-slate-950 text-[#bef264]'} text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                      ${sInitials}
                    </div>
                    <span class="truncate text-[11px]">${s.name}</span>
                  </div>
                  ${isActive ? '<i data-lucide="check" class="w-3.5 h-3.5 text-[#65a30d]"></i>' : ''}
                </button>
              `;
            }).join('')}

            ${isSpacePm ? `
              <div class="pt-1 border-t border-slate-100 mt-1">
                <button type="button" onclick="window.app.toggleSidebarSpacesDropdown(); window.app.openCreateWorkspaceModal()" class="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-950 hover:text-[#4d7c0f] flex items-center gap-1.5 font-bold text-[11px] cursor-pointer">
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-[#4d7c0f]"></i>
                  <span>+ Create New Space</span>
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 2. ACTIVE PROJECT CONTEXT SELECTOR (Jira & Linear Standard) -->
        <div class="relative">
          <div class="px-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>${spaceRole === 'DEVELOPER' ? 'MY PROJECT' : 'PROJECT'}</span>
            ${canCreateProject ? `
              <button type="button" onclick="window.app.openCreateProjectModal()" class="text-slate-900 hover:text-[#4d7c0f] font-bold hover:underline flex items-center gap-0.5 cursor-pointer text-[10px]" title="Create Project in this Space">
                <i data-lucide="plus" class="w-3 h-3"></i>
                <span>New</span>
              </button>
            ` : ''}
          </div>

          ${currentActiveProject ? `
            <button
              type="button"
              onclick="window.app.toggleSidebarProjectsDropdown()"
              class="w-full p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2 transition cursor-pointer group shadow-2xs text-left"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div class="px-1.5 py-0.5 rounded bg-slate-900 text-[#bef264] font-mono font-bold text-[9px] shrink-0 uppercase shadow-2xs">
                  ${currentActiveProject.key}
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-bold text-slate-900 truncate leading-tight">${currentActiveProject.name}</div>
                  <div class="text-[9px] text-slate-400 truncate">${spaceRole === 'DEVELOPER' ? 'Assigned Project' : (currentActiveProject.customer || 'Enterprise Delivery')}</div>
                </div>
              </div>
              <i data-lucide="chevrons-up-down" class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0 transition"></i>
            </button>
          ` : `
            <div class="p-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-[11px] font-medium text-slate-500">
              ${canCreateProject ? `
                <button type="button" onclick="window.app.openCreateProjectModal()" class="text-slate-950 hover:text-[#4d7c0f] font-bold hover:underline flex items-center justify-center gap-1 w-full cursor-pointer">
                  <i data-lucide="plus" class="w-3.5 h-3.5 text-[#4d7c0f]"></i>
                  <span>Create First Project</span>
                </button>
              ` : `
                <span>No assigned projects</span>
              `}
            </div>
          `}

          <!-- Projects Dropdown Menu -->
          <div id="sidebarProjectsDropdown" class="hidden absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-fade-in text-xs space-y-0.5 max-h-56 overflow-y-auto">
            <div class="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>${spaceRole === 'DEVELOPER' ? 'My Assigned Projects' : 'Projects in Space'}</span>
              <span class="text-[9px] text-slate-400">${spaceProjects.length}</span>
            </div>
            ${spaceProjects.length === 0 ? `
              <div class="p-2 text-center text-slate-400 text-[10px]">No projects available.</div>
            ` : spaceProjects.map(p => {
              const isActive = currentActiveProject && p.id === currentActiveProject.id;
              return `
                <button
                  type="button"
                  onclick="window.app.selectSidebarProject('${p.id}')"
                  class="w-full text-left p-1.5 rounded-lg flex items-center justify-between gap-2 transition cursor-pointer ${isActive ? 'bg-[#f7fee7] text-[#4d7c0f] font-bold border border-[#d9f99d]' : 'hover:bg-slate-50 text-slate-700'}"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[9px] font-bold shrink-0">
                      ${p.key}
                    </span>
                    <span class="truncate text-[11px]">${p.name}</span>
                  </div>
                  ${isActive ? '<i data-lucide="check" class="w-3.5 h-3.5 text-[#65a30d]"></i>' : ''}
                </button>
              `;
            }).join('')}

            <div class="pt-1 border-t border-slate-100 mt-1 flex flex-col gap-0.5">
              ${canCreateProject ? `
                <button type="button" onclick="window.app.toggleSidebarProjectsDropdown(); window.app.openCreateProjectModal()" class="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-950 hover:text-[#4d7c0f] flex items-center gap-1.5 font-bold text-[11px] cursor-pointer">
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-[#4d7c0f]"></i>
                  <span>+ Create New Project</span>
                </button>
              ` : ''}
              <button type="button" onclick="window.app.toggleSidebarProjectsDropdown(); window.app.navigate('projects')" class="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 font-medium text-[11px] cursor-pointer">
                <i data-lucide="folder-kanban" class="w-3.5 h-3.5"></i>
                <span>${spaceRole === 'DEVELOPER' ? 'My Projects List' : 'View All Projects'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  toggleSidebarSpacesDropdown() {
    const dropdown = document.getElementById("sidebarSpacesDropdown");
    if (dropdown) dropdown.classList.toggle("hidden");
    const projDropdown = document.getElementById("sidebarProjectsDropdown");
    if (projDropdown) projDropdown.classList.add("hidden");
  }

  toggleSidebarProjectsDropdown() {
    const dropdown = document.getElementById("sidebarProjectsDropdown");
    if (dropdown) dropdown.classList.toggle("hidden");
    const spaceDropdown = document.getElementById("sidebarSpacesDropdown");
    if (spaceDropdown) spaceDropdown.classList.add("hidden");
  }

  selectSidebarSpace(spaceId) {
    store.setActiveWorkspace(spaceId);
    const ws = store.getActiveWorkspace();
    
    // Automatically select first project in this space if available
    const projects = store.getProjects().filter(p => p.workspace_id === spaceId || !p.workspace_id);
    if (projects.length > 0) {
      store.setActiveProject(projects[0].id);
    } else {
      store.data.activeProjectId = null;
    }

    const dropdown = document.getElementById("sidebarSpacesDropdown");
    if (dropdown) dropdown.classList.add("hidden");

    if (ws) {
      this.toast("Space Selected", `Switched to ${ws.name}`, "info");
    }

    this.updateSidebarSpacesExplorer();
    this.updateHeaderProjectSelector();
    this.updateHeaderPersona();
    
    if (this.currentView === "project-workspace" && projects.length > 0) {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else {
      this.navigate(this.currentView);
    }
  }

  selectSidebarProject(projectId) {
    store.setActiveProject(projectId);
    const p = store.getActiveProject();
    
    const dropdown = document.getElementById("sidebarProjectsDropdown");
    if (dropdown) dropdown.classList.add("hidden");

    if (p) {
      this.toast("Project Selected", `Active: ${p.name} [${p.key}]`, "info");
    }

    this.updateSidebarSpacesExplorer();
    this.updateHeaderProjectSelector();

    if (this.currentView === "project-workspace") {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else {
      this.navigate(this.currentView);
    }
  }

  openActiveProjectBoard() {
    const activeProject = store.getActiveProject();
    if (activeProject) {
      this.openProjectWorkspace(activeProject.id, "board");
    } else {
      this.navigate("projects");
    }
  }

  openSettingsTab(tab) {
    if (typeof SettingsView !== 'undefined') {
      SettingsView.activeTab = tab;
    }
    this.navigate("settings");
  }

  updateSidebarUserFooter() {
    const container = document.getElementById("sidebarUserFooterContainer");
    if (!container) return;
    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    if (!activeUser) return;

    container.innerHTML = `
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-7 h-7 rounded-full ${activeUser.color || 'bg-slate-950 text-[#bef264]'} flex items-center justify-center font-bold text-xs shrink-0 uppercase border border-slate-200">
          ${activeUser.initials || (activeUser.name ? activeUser.name.substring(0, 2).toUpperCase() : 'PW')}
        </div>
        <div class="min-w-0">
          <div class="text-xs font-bold text-slate-900 truncate leading-tight">${activeUser.name || 'User'}</div>
          <div class="text-[10px] text-slate-400 font-medium truncate">${activeUser.role || 'Project Manager'}</div>
        </div>
      </div>
      <button onclick="window.app.signOut()" class="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer shrink-0" title="Sign Out">
        <i data-lucide="log-out" class="w-4 h-4"></i>
      </button>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  // --- SIDEBAR DYNAMIC ROLE NAVIGATION ---
  updateSidebarNav() {
    const container = document.getElementById("sidebarNavMenuContainer");
    if (!container) return;

    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const activeSpace = store.getActiveWorkspace ? store.getActiveWorkspace() : null;
    const spaceRole = activeSpace ? store.getUserSpaceRole(activeSpace.id, activeUser?.id) : "PM";
    const activeProject = store.getActiveProject ? store.getActiveProject() : null;
    const projectRole = activeProject ? store.getUserProjectRole(activeProject.id, activeUser?.id) : spaceRole;

    const role = (projectRole || spaceRole || "PM").toUpperCase();
    const isPM = role === "PM" || role === "OWNER" || role === "PROJECT_MANAGER";
    const isQA = role === "QA" || role === "QA_MANAGER" || role === "QA_ENGINEER";
    const isDev = role === "DEVELOPER";
    const isViewer = role === "VIEWER" || role === "CLIENT_VIEWER";

    let html = "";

    if (isDev) {
      // DEVELOPER SIDEBAR: Project-focused, Kanban-focused. Restricted modules COMPLETELY HIDDEN.
      html = `
        <!-- PLANNING & DELIVERY -->
        <div>
          <div class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Planning & Delivery</span>
          </div>
          <div class="space-y-0.5">
            <button onclick="window.app.navigate('dashboard')" data-view="dashboard" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="layout-dashboard" class="w-4 h-4 text-slate-700 shrink-0"></i>
              <span>Dashboard</span>
            </button>

            <button onclick="window.app.navigate('all-issues')" data-view="all-issues" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="list-todo" class="w-4 h-4 text-amber-600 shrink-0"></i>
              <span>Issues & Defects</span>
            </button>

            <button onclick="window.app.navigate('projects')" data-view="projects" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="folder-kanban" class="w-4 h-4 text-slate-600 shrink-0"></i>
              <span>Projects Register</span>
            </button>
          </div>
        </div>
      `;
    } else if (isViewer) {
      // VIEWER SIDEBAR: Read-only access to authorized views
      html = `
        <!-- PLANNING & DELIVERY -->
        <div>
          <div class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Planning & Delivery</span>
          </div>
          <div class="space-y-0.5">
            <button onclick="window.app.navigate('dashboard')" data-view="dashboard" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="layout-dashboard" class="w-4 h-4 text-slate-900 shrink-0"></i>
              <span>Dashboard</span>
            </button>

            <button onclick="window.app.navigate('all-issues')" data-view="all-issues" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="list-todo" class="w-4 h-4 text-amber-600 shrink-0"></i>
              <span>Issues & Defects</span>
            </button>

            <button onclick="window.app.navigate('projects')" data-view="projects" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="folder-kanban" class="w-4 h-4 text-slate-600 shrink-0"></i>
              <span>Projects Register</span>
            </button>
          </div>
        </div>
      `;
    } else if (isViewer) {
      // VIEWER SIDEBAR: Read-only access to authorized views
      html = `
        <!-- PLANNING & DELIVERY -->
        <div>
          <div class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Planning & Delivery (Read-Only)</span>
          </div>
          <div class="space-y-0.5">
            <button onclick="window.app.navigate('dashboard')" data-view="dashboard" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="layout-dashboard" class="w-4 h-4 text-slate-900 shrink-0"></i>
              <span>Dashboard</span>
            </button>

            <button onclick="window.app.navigate('all-issues')" data-view="all-issues" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="list-todo" class="w-4 h-4 text-amber-600 shrink-0"></i>
              <span>Issues & Defects</span>
            </button>

            <button onclick="window.app.navigate('projects')" data-view="projects" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="folder-kanban" class="w-4 h-4 text-slate-600 shrink-0"></i>
              <span>Projects Register</span>
            </button>
          </div>
        </div>

        <!-- QA READ-ONLY -->
        <div>
          <div class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Reports & Documentation</span>
          </div>
          <div class="space-y-0.5">
            <button onclick="window.app.navigate('test-reports')" data-view="test-reports" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="file-check-2" class="w-4 h-4 text-indigo-600 shrink-0"></i>
              <span>Test Reports</span>
            </button>

            <button onclick="window.app.navigate('documentation')" data-view="documentation" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="file-text" class="w-4 h-4 text-slate-900 shrink-0"></i>
              <span>Documentation</span>
            </button>
          </div>
        </div>
      `;
    } else {
      // PM & QA: Full System / QA Modules Access
      html = `
        <!-- PLANNING & DELIVERY -->
        <div>
          <div class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Planning & Delivery</span>
          </div>
          <div class="space-y-0.5">
            <button onclick="window.app.navigate('dashboard')" data-view="dashboard" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="layout-dashboard" class="w-4 h-4 text-slate-900 shrink-0"></i>
              <span>Dashboard</span>
            </button>

            <button onclick="window.app.navigate('backlog-sprints')" data-view="backlog-sprints" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="calendar-range" class="w-4 h-4 text-violet-600 shrink-0"></i>
              <span>Backlog & Sprints</span>
            </button>

            <button onclick="window.app.navigate('all-issues')" data-view="all-issues" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="list-todo" class="w-4 h-4 text-amber-600 shrink-0"></i>
              <span>Issues & Defects</span>
            </button>

            <button onclick="window.app.navigate('projects')" data-view="projects" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="folder-kanban" class="w-4 h-4 text-slate-600 shrink-0"></i>
              <span>Projects Register</span>
            </button>
          </div>
        </div>

        <!-- QA & QUALITY ENGINEERING -->
        <div>
          <div class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>QA Engineering</span>
            <span class="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">V2</span>
          </div>
          <div class="space-y-0.5">
            <button onclick="window.app.navigate('test-management')" data-view="test-management" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="clipboard-check" class="w-4 h-4 text-emerald-600 shrink-0"></i>
              <span>Test Management</span>
            </button>

            <button onclick="window.app.navigate('test-reports')" data-view="test-reports" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="file-check-2" class="w-4 h-4 text-indigo-600 shrink-0"></i>
              <span>Test Reports & Sign-Off</span>
            </button>

            <button onclick="window.app.navigate('reports')" data-view="reports" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="bar-chart-2" class="w-4 h-4 text-purple-600 shrink-0"></i>
              <span>Analytics & Velocity</span>
            </button>
          </div>
        </div>

        <!-- SETTINGS & ADMINISTRATION -->
        <div>
          <div class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Settings</span>
          </div>
          <div class="space-y-0.5">
            <button onclick="window.app.navigate('settings')" data-view="settings" class="sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
              <i data-lucide="settings" class="w-4 h-4 text-slate-500 shrink-0"></i>
              <span>Settings</span>
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Highlight active nav item
    const baseRoute = this.currentView ? this.currentView.split("?")[0] : "dashboard";
    document.querySelectorAll(".sidebar-nav-item").forEach(item => {
      item.classList.remove("nav-item-active");
      if (item.dataset.view === baseRoute) {
        item.classList.add("nav-item-active");
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  openCreateWorkspaceModal() {
    let modal = document.getElementById("createWorkspaceModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "createWorkspaceModal";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onclick="if(event.target === this) window.app.closeCreateWorkspaceModal()">
        <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in text-xs">
          <div class="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2 font-bold text-slate-900">
              <div class="w-6 h-6 rounded-lg bg-slate-950 text-[#bef264] flex items-center justify-center text-xs">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              </div>
              <span>Create New Workspace</span>
            </div>
            <button onclick="window.app.closeCreateWorkspaceModal()" class="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="window.app.handleCreateWorkspaceModalSubmit(event)" class="p-5 space-y-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">Workspace Name *</label>
              <input
                type="text"
                id="modalWsName"
                required
                oninput="document.getElementById('modalWsSlug').value = this.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')"
                placeholder="e.g. Retail POS Team"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">Workspace URL *</label>
              <div class="flex items-center">
                <span class="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-mono text-[10px]">
                  pulsewave.com/
                </span>
                <input
                  type="text"
                  id="modalWsSlug"
                  required
                  placeholder="retail-pos-team"
                  class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-r-xl text-slate-900 font-mono font-medium text-[11px] focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">Company / Organization</label>
              <input
                type="text"
                id="modalWsCompany"
                placeholder="e.g. Acme Retail Corp."
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
              />
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button type="button" onclick="window.app.closeCreateWorkspaceModal()" class="px-3.5 py-2 text-slate-500 hover:text-slate-800 font-semibold rounded-xl text-xs transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>Create Workspace</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  closeCreateWorkspaceModal() {
    const modal = document.getElementById("createWorkspaceModal");
    if (modal) modal.remove();
  }

  async handleCreateWorkspaceModalSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("modalWsName")?.value.trim();
    const slug = document.getElementById("modalWsSlug")?.value.trim();
    const company = document.getElementById("modalWsCompany")?.value.trim();

    if (!name) {
      this.toast("Missing Name", "Enter a workspace name.", "error");
      return;
    }

    try {
      const activeUser = store.getActiveUser();
      const ws = {
        id: `ws_${Date.now()}`,
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        company_name: company || name,
        workspace_type: "Software Company",
        logo_color: "bg-slate-950 text-[#bef264]",
        owner_id: activeUser ? activeUser.id : null,
        created_by: activeUser ? activeUser.email : null,
        owner_name: activeUser ? activeUser.name : "Owner",
        role: "OWNER",
        members: activeUser ? [{
          id: activeUser.id,
          name: activeUser.name,
          email: activeUser.email,
          role: "OWNER"
        }] : []
      };
      if (store.addWorkspace) store.addWorkspace(ws);
      this.closeCreateWorkspaceModal();
      this.toast("Space Created", `Space '${name}' created by ${activeUser ? activeUser.name : 'you'} (Owner / PM).`, "success");
      this.navigate(this.currentView);
    } catch (err) {
      this.toast("Creation Failed", err.message || "Could not create space.", "error");
    }
  }

  async signOut() {
    this.closePersonaMenu();
    if (window.supabaseClient && window.supabaseClient.auth) {
      try {
        await window.supabaseClient.auth.signOut();
      } catch (e) {
        console.warn("Supabase signOut error:", e);
      }
    }
    store.clearSupabaseUser();
    this.showToast("Signed Out", "You have been signed out from Supabase. Returning to home landing page.", "info");
    this.navigate("home");
  }

  // --- TOP BAR: NOTIFICATIONS ---
  updateNotificationBadge() {
    const count = store.getUnreadNotificationsCount();
    const badge = document.getElementById("notifBadge");
    if (badge) {
      if (count > 0) {
        badge.innerText = count > 99 ? "99+" : count;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }
  }

  toggleNotificationMenu() {
    const menu = document.getElementById("notifDropdownMenu");
    if (menu) {
      menu.classList.toggle("hidden");
      this.renderNotificationList();
    }
  }

  closeNotificationMenu() {
    const menu = document.getElementById("notifDropdownMenu");
    if (menu) menu.classList.add("hidden");
  }

  setNotificationFilter(filter) {
    this.notificationFilter = filter;
    this.renderNotificationList();
  }

  renderNotificationList() {
    const container = document.getElementById("notifListContainer");
    if (!container) return;

    if (!this.notificationFilter) this.notificationFilter = "all";

    const allNotifs = store.getNotifications();
    const unreadCount = allNotifs.filter(n => !n.read).length;
    const assignmentCount = allNotifs.filter(n => n.type === 'assignment').length;
    const qaCount = allNotifs.filter(n => n.type === 'qa' || n.type === 'bug' || n.type === 'release').length;
    const chatCount = allNotifs.filter(n => n.type === 'chat').length;

    let notifs = allNotifs;
    if (this.notificationFilter === "unread") {
      notifs = allNotifs.filter(n => !n.read);
    } else if (this.notificationFilter === "assignments") {
      notifs = allNotifs.filter(n => n.type === 'assignment');
    } else if (this.notificationFilter === "qa") {
      notifs = allNotifs.filter(n => n.type === 'qa' || n.type === 'bug' || n.type === 'release');
    } else if (this.notificationFilter === "chat") {
      notifs = allNotifs.filter(n => n.type === 'chat');
    }

    const typeIcons = {
      assignment: { icon: "user-check", color: "bg-[#f7fee7] text-[#4d7c0f] border-[#d9f99d]" },
      qa: { icon: "clipboard-check", color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
      bug: { icon: "bug", color: "bg-rose-50 text-rose-600 border-rose-200" },
      release: { icon: "shield-check", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      chat: { icon: "message-circle", color: "bg-slate-100 text-slate-700 border-slate-200" },
      comment: { icon: "message-square", color: "bg-amber-50 text-amber-600 border-amber-200" },
      sprint: { icon: "calendar-range", color: "bg-violet-50 text-violet-600 border-violet-200" },
      role: { icon: "award", color: "bg-cyan-50 text-cyan-600 border-cyan-200" },
      info: { icon: "bell", color: "bg-slate-100 text-slate-600 border-slate-200" }
    };

    container.innerHTML = `
      <!-- Segmented Filter Bar -->
      <div class="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-[10px]">
        <button
          onclick="event.stopPropagation(); window.app.setNotificationFilter('all')"
          class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${this.notificationFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}"
        >
          <span>All</span>
          <span class="px-1 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[9px]">${allNotifs.length}</span>
        </button>

        <button
          onclick="event.stopPropagation(); window.app.setNotificationFilter('unread')"
          class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${this.notificationFilter === 'unread' ? 'bg-slate-950 text-[#bef264] shadow-2xs' : 'text-slate-500 hover:text-slate-800'}"
        >
          <span>Unread</span>
          ${unreadCount > 0 ? `<span class="px-1 py-0.2 rounded-full bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] text-[9px]">${unreadCount}</span>` : ''}
        </button>

        <button
          onclick="event.stopPropagation(); window.app.setNotificationFilter('assignments')"
          class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${this.notificationFilter === 'assignments' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}"
        >
          <span>Assignments</span>
          ${assignmentCount > 0 ? `<span class="px-1 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px]">${assignmentCount}</span>` : ''}
        </button>

        <button
          onclick="event.stopPropagation(); window.app.setNotificationFilter('qa')"
          class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${this.notificationFilter === 'qa' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}"
        >
          <span>QA & Bugs</span>
          ${qaCount > 0 ? `<span class="px-1 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[9px]">${qaCount}</span>` : ''}
        </button>

        <button
          onclick="event.stopPropagation(); window.app.setNotificationFilter('chat')"
          class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${this.notificationFilter === 'chat' ? 'bg-slate-950 text-[#bef264] shadow-2xs' : 'text-slate-500 hover:text-slate-800'}"
        >
          <span>Chat</span>
          ${chatCount > 0 ? `<span class="px-1 py-0.2 rounded-full bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] text-[9px]">${chatCount}</span>` : ''}
        </button>
      </div>

      <!-- Notifications Feed -->
      <div class="max-h-72 overflow-y-auto divide-y divide-slate-100">
        ${notifs.length === 0 ? `
          <div class="p-8 text-center text-slate-400 space-y-1">
            <i data-lucide="bell-off" class="w-7 h-7 text-slate-300 mx-auto"></i>
            <p class="font-bold text-slate-600 text-xs">No notifications here</p>
            <p class="text-[10px] text-slate-400">You are all caught up with your project alerts.</p>
          </div>
        ` : notifs.map(n => {
          const typeConfig = typeIcons[n.type] || typeIcons.info;
          return `
            <div
              onclick="window.app.handleNotificationClick('${n.id}', '${n.issueKey || ''}')"
              class="p-3 hover:bg-slate-50 cursor-pointer transition flex items-start gap-2.5 group relative ${n.read ? 'opacity-70 bg-white' : 'bg-[#f7fee7]/30 font-medium'}"
            >
              <!-- Type Icon Badge -->
              <div class="w-7 h-7 rounded-xl ${typeConfig.color} border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <i data-lucide="${typeConfig.icon}" class="w-3.5 h-3.5"></i>
              </div>

              <!-- Content Body -->
              <div class="flex-1 min-w-0 pr-6">
                <div class="flex items-center justify-between gap-1">
                  <h4 class="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    ${!n.read ? '<span class="w-1.5 h-1.5 rounded-full bg-[#84cc16] shrink-0"></span>' : ''}
                    <span>${n.title}</span>
                  </h4>
                  <span class="text-[10px] text-slate-400 shrink-0">${n.timestamp || 'Just now'}</span>
                </div>
                <p class="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">${n.message}</p>
                ${n.issueKey ? `
                  <div class="mt-1 flex items-center gap-1.5">
                    <span class="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[9px] font-mono font-bold text-slate-700">${n.issueKey}</span>
                    <span class="text-[10px] text-slate-950 font-bold hover:underline">View Ticket →</span>
                  </div>
                ` : ''}
                ${n.type === 'chat' && n.projectId ? `
                  <div class="mt-1 flex items-center gap-1.5">
                    <span class="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-700">Project Chat</span>
                    <span class="text-[10px] text-slate-950 font-bold hover:underline">Open Discussion →</span>
                  </div>
                ` : ''}
              </div>

              <!-- Hover Action: Delete / Toggle Read -->
              <div class="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white/90 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  onclick="event.stopPropagation(); window.app.handleDeleteNotification('${n.id}')"
                  class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete"
                >
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Dropdown Footer -->
      <div class="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
        <button
          onclick="event.stopPropagation(); window.app.markAllNotifsRead()"
          class="text-slate-900 hover:text-[#4d7c0f] font-bold hover:underline cursor-pointer flex items-center gap-1"
        >
          <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
          <span>Mark All Read</span>
        </button>

        <button
          onclick="event.stopPropagation(); window.app.clearAllNotifs()"
          class="text-slate-500 hover:text-rose-600 font-medium hover:underline cursor-pointer flex items-center gap-1"
        >
          <i data-lucide="trash" class="w-3 h-3"></i>
          <span>Clear All</span>
        </button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  handleNotificationClick(notifId, issueKey) {
    const notif = (store.data.notifications || []).find(n => n.id === notifId);
    store.markNotificationRead(notifId);
    this.updateNotificationBadge();
    this.closeNotificationMenu();

    if (notif && notif.type === 'chat') {
      const pId = notif.projectId || store.getActiveProject()?.id;
      if (pId) {
        this.navigate('project-workspace', { projectId: pId });
        setTimeout(() => {
          if (window.FloatingProjectChat && window.FloatingProjectChat.open) {
            window.FloatingProjectChat.open(pId);
          }
        }, 150);
      }
      return;
    }

    if (issueKey) {
      this.openIssueDetails(issueKey);
    } else if (notif && notif.projectId) {
      this.navigate('project-workspace', { projectId: notif.projectId });
    }
  }

  handleDeleteNotification(notifId) {
    if (store.deleteNotification) {
      store.deleteNotification(notifId);
      this.renderNotificationList();
      this.updateNotificationBadge();
    }
  }

  markAllNotifsRead() {
    store.markAllNotificationsRead();
    this.renderNotificationList();
    this.updateNotificationBadge();
    this.toast("Notifications Updated", "All notifications marked as read.", "info");
  }

  clearAllNotifs() {
    if (store.clearAllNotifications) {
      store.clearAllNotifications();
      this.renderNotificationList();
      this.updateNotificationBadge();
      this.toast("Notifications Cleared", "Cleared all notifications feed.", "info");
    }
  }

  showNotificationToast(notif) {
    const container = document.getElementById("toastContainer");
    if (!container || !notif) return;

    const toast = document.createElement("div");
    const typeStyles = {
      assignment: { border: "border-slate-950", icon: "user-check", color: "text-[#4d7c0f]" },
      qa: { border: "border-indigo-500", icon: "clipboard-check", color: "text-indigo-600" },
      bug: { border: "border-rose-500", icon: "bug", color: "text-rose-600" },
      release: { border: "border-emerald-500", icon: "shield-check", color: "text-emerald-600" },
      chat: { border: "border-slate-800", icon: "message-circle", color: "text-slate-700" },
      comment: { border: "border-amber-500", icon: "message-square", color: "text-amber-600" },
      sprint: { border: "border-violet-500", icon: "calendar-range", color: "text-violet-600" },
      role: { border: "border-cyan-500", icon: "award", color: "text-cyan-600" },
      info: { border: "border-slate-500", icon: "bell", color: "text-slate-600" }
    };
    const style = typeStyles[notif.type] || typeStyles.info;

    toast.className = `p-3.5 rounded-2xl shadow-xl border-l-4 ${style.border} bg-white text-slate-800 animate-fade-in flex items-start gap-3 w-full pointer-events-auto transition-all border border-slate-200/80`;
    toast.innerHTML = `
      <div class="p-1.5 rounded-xl bg-slate-50 border border-slate-200 ${style.color} shrink-0 mt-0.5">
        <i data-lucide="${style.icon}" class="w-4 h-4"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-xs font-bold text-slate-900 flex items-center justify-between gap-1">
          <span>${notif.title}</span>
          <span class="text-[9px] text-slate-400 font-mono font-normal">Just now</span>
        </div>
        <div class="text-[11px] text-slate-600 mt-0.5 leading-snug">${notif.message}</div>
        ${notif.issueKey ? `
          <div class="mt-1.5 flex items-center gap-2">
            <button
              onclick="window.app.openIssueDetails('${notif.issueKey}'); this.closest('.animate-fade-in')?.remove();"
              class="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[10px] font-bold transition cursor-pointer"
            >
              Open ${notif.issueKey}
            </button>
          </div>
        ` : ''}
        ${notif.type === 'chat' && notif.projectId ? `
          <div class="mt-1.5 flex items-center gap-2">
            <button
              onclick="window.app.navigate('project-workspace', { projectId: '${notif.projectId}' }); setTimeout(() => { if (window.FloatingProjectChat && window.FloatingProjectChat.open) window.FloatingProjectChat.open('${notif.projectId}'); }, 200); this.closest('.animate-fade-in')?.remove();"
              class="px-2 py-0.5 bg-slate-950 hover:bg-slate-900 text-[#bef264] rounded-md text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <i data-lucide="message-circle" class="w-3 h-3"></i>
              <span>Open Chat</span>
            </button>
          </div>
        ` : ''}
      </div>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 shrink-0">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  // --- GLOBAL SEARCH MODAL ---
  openSearchModal() {
    let modal = document.getElementById("globalSearchModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "globalSearchModal";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4" onclick="if(event.target === this) window.app.closeSearchModal()">
        <div class="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in text-xs">
          <!-- Search Input -->
          <div class="p-3.5 border-b border-slate-200 flex items-center gap-3">
            <i data-lucide="search" class="w-4 h-4 text-slate-400"></i>
            <input type="text" id="globalSearchInput" oninput="window.app.executeGlobalSearch(this.value)" placeholder="Search projects, issues, bugs, team members... (e.g. BUG-101)" class="w-full text-xs sm:text-sm focus:outline-none text-slate-900 font-medium" autofocus />
            <span class="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-400">ESC</span>
          </div>

          <!-- Search Results Container -->
          <div id="globalSearchResults" class="max-h-80 overflow-y-auto p-2 space-y-1">
            <p class="p-6 text-center text-xs text-slate-400">Type to start searching across projects, bugs, stories, and users...</p>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      document.getElementById("globalSearchInput")?.focus();
      if (window.lucide) window.lucide.createIcons();
    }, 50);
  }

  closeSearchModal() {
    const modal = document.getElementById("globalSearchModal");
    if (modal) modal.innerHTML = "";
  }

  executeGlobalSearch(query) {
    const resultsContainer = document.getElementById("globalSearchResults");
    if (!resultsContainer) return;

    if (!query.trim()) {
      resultsContainer.innerHTML = `<p class="p-6 text-center text-xs text-slate-400">Type to search...</p>`;
      return;
    }

    const { projects, issues, users } = store.searchAll(query);

    if (projects.length === 0 && issues.length === 0 && users.length === 0) {
      resultsContainer.innerHTML = `<p class="p-6 text-center text-xs text-slate-400">No results found for "${query}".</p>`;
      return;
    }

    let html = "";

    if (issues.length > 0) {
      html += `<div class="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">Issues & Bugs (${issues.length})</div>`;
      issues.slice(0, 5).forEach(i => {
        html += `
          <div onclick="window.app.closeSearchModal(); window.app.openIssueDetails('${i.id}')" class="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2 transition">
            <div class="flex items-center gap-2 min-w-0">
              <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${i.type === 'Bug' ? 'type-bug' : 'type-task'}">${i.key}</span>
              <span class="font-semibold text-slate-900 truncate">${i.title}</span>
            </div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${i.priority === 'Critical' ? 'priority-critical' : 'priority-medium'} shrink-0">${i.priority}</span>
          </div>
        `;
      });
    }

    if (projects.length > 0) {
      html += `<div class="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 mt-2">Projects (${projects.length})</div>`;
      projects.slice(0, 3).forEach(p => {
        html += `
          <div onclick="window.app.closeSearchModal(); window.app.openProjectWorkspace('${p.id}')" class="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2 transition">
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700">${p.key}</span>
              <span class="font-bold text-slate-900">${p.name}</span>
            </div>
            <span class="text-[10px] text-slate-950 hover:text-[#4d7c0f] font-semibold">Open Project →</span>
          </div>
        `;
      });
    }

    if (users.length > 0) {
      html += `<div class="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 mt-2">Team Members (${users.length})</div>`;
      users.slice(0, 3).forEach(u => {
        html += `
          <div onclick="window.app.closeSearchModal(); window.app.switchPersona('${u.id}')" class="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2 transition">
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded-full ${u.color || 'bg-slate-400'} text-white text-[8px] font-bold flex items-center justify-center">${u.initials}</div>
              <span class="font-semibold text-slate-900">${u.name}</span>
            </div>
            <span class="text-[10px] text-slate-500">${u.role}</span>
          </div>
        `;
      });
    }

    resultsContainer.innerHTML = html;
  }

  // --- CREATE TASK MODAL (Distinct formal engineering task flow) ---
  openCreateTaskModal(defaultProjectId = null) {
    const projects = store.getProjects();
    const users = store.getUsers();
    const activeProject = defaultProjectId ? store.getProjectById(defaultProjectId) : store.getActiveProject();
    const sprints = activeProject ? (store.getSprints(activeProject.id) || []) : [];

    let container = document.getElementById("globalModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "globalModalContainer";
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto text-xs">
          <!-- Header -->
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-slate-950 text-[#bef264] flex items-center justify-center font-bold border border-slate-800 shadow-2xs">
                <i data-lucide="check-square" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-950 flex items-center gap-1.5">
                  <span>Create Engineering Task</span>
                  ${activeProject ? `<span class="px-2 py-0.5 rounded-md bg-[#f7fee7] text-[#4d7c0f] font-mono font-bold text-[11px] border border-[#d9f99d]">${activeProject.key}</span>` : ''}
                </h3>
                <p class="text-[11px] text-slate-500 mt-0.5">Plan, estimate, and assign a structured development task with acceptance criteria.</p>
              </div>
            </div>
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Form -->
          <form onsubmit="window.app.handleCreateTaskSubmit(event)" class="mt-4 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Project *</label>
                <select id="newTaskProject" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50">
                  ${projects.map(p => `<option value="${p.id}" ${activeProject && p.id === activeProject.id ? 'selected' : ''}>${p.key} - ${p.name}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Category / Domain</label>
                <select id="newTaskCategory" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50">
                  <option value="Frontend & UI" selected>Frontend & UI</option>
                  <option value="Backend & APIs">Backend & APIs</option>
                  <option value="Database & Sync">Database & Sync</option>
                  <option value="QA & Testing Suite">QA & Testing Suite</option>
                  <option value="DevOps & Infra">DevOps & Infra</option>
                  <option value="Security & Auth">Security & Auth</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Sprint / Milestone</label>
                <select id="newTaskSprint" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50">
                  <option value="">Backlog (No Sprint)</option>
                  ${sprints.map(s => `<option value="${s.id}">${s.name || s.title} (${s.status || 'Active'})</option>`).join("")}
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Task Title / Summary *</label>
              <input type="text" id="newTaskTitle" required placeholder="e.g. Implement OAuth2 Refresh Token Rotation & Session Revocation" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Story Points (SP) *</label>
                <select id="newTaskPoints" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50">
                  <option value="1">1 SP (Trivial)</option>
                  <option value="2">2 SP (Small)</option>
                  <option value="3" selected>3 SP (Medium)</option>
                  <option value="5">5 SP (Large)</option>
                  <option value="8">8 SP (Complex)</option>
                  <option value="13">13 SP (Epic)</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Priority *</label>
                <select id="newTaskPriority" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50">
                  <option value="Critical">🔴 Critical</option>
                  <option value="High" selected>🟠 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">⚪ Low</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Initial Status</label>
                <select id="newTaskStatus" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50">
                  <option value="To Do" selected>To Do</option>
                  <option value="In Progress">In Development</option>
                  <option value="Ready for QA">Ready for QA</option>
                  <option value="Backlog">Backlog</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Due Date</label>
                <input type="date" id="newTaskDueDate" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Lead Developer / Assignee</label>
                <select id="newTaskDev" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none">
                  ${users.map(u => `<option value="${u.id}">${u.name} (${u.role || 'Developer'})</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">QA Reviewer / Verification Owner</label>
                <select id="newTaskQA" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none">
                  ${users.map(u => `<option value="${u.id}" ${u.role === 'QA Engineer' || u.role === 'QA Manager' ? 'selected' : ''}>${u.name} (${u.role || 'QA'})</option>`).join("")}
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Task Description & Context</label>
              <textarea id="newTaskDesc" rows="3" placeholder="Provide background architecture details, API contract notes, dependencies, or scope..." class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"></textarea>
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Acceptance Criteria (1 per line)</label>
              <textarea id="newTaskAC" rows="2" placeholder="e.g. Refresh token invalidates immediately upon reuse&#10;Unit test coverage >= 90%&#10;Audit log record saved on token reissue" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none font-sans"></textarea>
            </div>

            <!-- Footer -->
            <div class="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button type="button" onclick="document.getElementById('globalModalContainer').innerHTML=''" class="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs shadow-[#bef264]/30 transition cursor-pointer flex items-center gap-1.5">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>Create Task</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  handleCreateTaskSubmit(e) {
    e.preventDefault();
    const projectId = document.getElementById("newTaskProject").value;
    const category = document.getElementById("newTaskCategory")?.value || "Frontend & UI";
    const sprintId = document.getElementById("newTaskSprint")?.value || null;
    const title = document.getElementById("newTaskTitle").value.trim();
    const storyPoints = Number(document.getElementById("newTaskPoints")?.value || 3);
    const priority = document.getElementById("newTaskPriority").value;
    const status = document.getElementById("newTaskStatus").value;
    const dueDate = document.getElementById("newTaskDueDate")?.value || "";
    const assigneeId = document.getElementById("newTaskDev").value;
    const qaId = document.getElementById("newTaskQA").value;
    const description = document.getElementById("newTaskDesc").value.trim();
    const acText = document.getElementById("newTaskAC")?.value.trim() || "";

    const acceptanceCriteria = acText 
      ? acText.split("\n").map(line => line.trim()).filter(Boolean).map(text => ({ text, done: false }))
      : [
          { text: "Implementation satisfies technical design specification", done: false },
          { text: "Passes automated and regression QA verification", done: false }
        ];

    const newTask = store.createIssue({
      projectId,
      sprintId,
      type: "Task",
      title,
      description,
      priority,
      status,
      storyPoints,
      dueDate,
      assigneeId,
      developerId: assigneeId,
      qaId,
      category,
      labels: [category, "Task"],
      acceptanceCriteria
    });

    document.getElementById("globalModalContainer").innerHTML = "";
    this.toast("Task Created", `Created ${newTask.key}: ${newTask.title}`, "success");

    // Refresh active view
    if (this.currentView === "project-workspace") {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else {
      this.navigate(this.currentView);
    }
  }

  // --- ADD CARD MODAL (Direct Agile Kanban Card placement) ---
  openAddCardModal(defaultProjectId = null, defaultColumn = "Backlog") {
    const projects = store.getProjects();
    const users = store.getUsers();
    const activeProject = defaultProjectId ? store.getProjectById(defaultProjectId) : store.getActiveProject();

    let container = document.getElementById("globalModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "globalModalContainer";
      document.body.appendChild(container);
    }

    const columnOptions = [
      { id: "Backlog", label: "Backlog / Open" },
      { id: "To Do", label: "To Do" },
      { id: "In Progress", label: "In Development" },
      { id: "Ready for QA", label: "Ready for QA" },
      { id: "QA Testing", label: "QA Testing" },
      { id: "Done", label: "Done / Closed" }
    ];

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto text-xs">
          <!-- Header -->
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-[#bef264]/30 text-slate-900 flex items-center justify-center font-bold border border-[#bef264]/80 shadow-2xs">
                <i data-lucide="layout-grid" class="w-4 h-4 text-slate-900"></i>
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-950 flex items-center gap-1.5">
                  <span>Add Card to Board</span>
                  ${defaultColumn ? `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">${defaultColumn}</span>` : ''}
                </h3>
                <p class="text-[11px] text-slate-500 mt-0.5">Quickly drop a card with story points into an agile board column.</p>
              </div>
            </div>
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Form -->
          <form onsubmit="window.app.handleAddCardSubmit(event)" class="mt-4 space-y-3.5">
            <input type="hidden" id="newCardProject" value="${activeProject ? activeProject.id : ''}" />

            <!-- Target Column & Type & Priority -->
            <div class="grid grid-cols-3 gap-2.5">
              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Target Column *</label>
                <select id="newCardColumn" class="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50">
                  ${columnOptions.map(col => `<option value="${col.id}" ${col.id === defaultColumn ? 'selected' : ''}>${col.label}</option>`).join("")}
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Card Type *</label>
                <select id="newCardType" class="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50">
                  <option value="Task" selected>📋 Task</option>
                  <option value="Bug">💥 Bug / Defect</option>
                  <option value="Story">✨ Feature Story</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Priority</label>
                <select id="newCardPriority" class="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50">
                  <option value="High" selected>● High</option>
                  <option value="Critical">● Critical</option>
                  <option value="Medium">● Medium</option>
                  <option value="Low">● Low</option>
                </select>
              </div>
            </div>

            <!-- Card Headline -->
            <div>
              <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Card Headline / Title *</label>
              <input type="text" id="newCardTitle" required placeholder="e.g. Verify POS invoice sync error handling & retry queue" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <!-- Story Points, Assignee & Labels -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Story Points (SP)</label>
                <select id="newCardPoints" class="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50">
                  <option value="1">1 SP</option>
                  <option value="2">2 SP</option>
                  <option value="3">3 SP</option>
                  <option value="5" selected>5 SP</option>
                  <option value="8">8 SP</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Assignee</label>
                <select id="newCardAssignee" class="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50">
                  ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join("")}
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Tags / Labels</label>
                <input type="text" id="newCardLabels" placeholder="e.g. POS, Checkout" class="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50" />
              </div>
            </div>

            <!-- Notes / Description -->
            <div>
              <label class="block font-bold text-slate-700 uppercase text-[10px] mb-1">Card Notes / Brief Details</label>
              <textarea id="newCardDesc" rows="2" placeholder="Key notes or requirements for this card..." class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"></textarea>
            </div>

            <!-- Footer -->
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button type="button" onclick="document.getElementById('globalModalContainer').innerHTML=''" class="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs shadow-[#bef264]/30 transition cursor-pointer flex items-center gap-1.5">
                <i data-lucide="plus" class="w-4 h-4 font-bold"></i>
                <span>Add Card</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  handleAddCardSubmit(e) {
    e.preventDefault();
    const projectId = document.getElementById("newCardProject").value || store.getActiveProject()?.id;
    const targetColumn = document.getElementById("newCardColumn").value;
    const type = document.getElementById("newCardType").value;
    const priority = document.getElementById("newCardPriority").value;
    const title = document.getElementById("newCardTitle").value.trim();
    const storyPoints = Number(document.getElementById("newCardPoints")?.value || 3);
    const assigneeId = document.getElementById("newCardAssignee").value;
    const rawLabels = document.getElementById("newCardLabels")?.value.trim() || "";
    const description = document.getElementById("newCardDesc").value.trim();

    const labels = rawLabels ? rawLabels.split(",").map(l => l.trim()).filter(Boolean) : [type];

    const newCard = store.createIssue({
      projectId,
      type,
      priority,
      status: targetColumn,
      title,
      description,
      storyPoints,
      assigneeId,
      developerId: assigneeId,
      labels
    });

    document.getElementById("globalModalContainer").innerHTML = "";
    this.toast("Card Added", `Added ${newCard.key} to "${targetColumn}": ${newCard.title}`, "success");

    // Refresh active view
    if (this.currentView === "project-workspace") {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else {
      this.navigate(this.currentView);
    }
  }

  // --- CREATE ISSUE MODAL (Section 11, 12, 14) ---
  openCreateIssueModal(defaultProjectId = null) {
    const projects = store.getProjects();
    const users = store.getUsers();
    const activeProject = defaultProjectId ? store.getProjectById(defaultProjectId) : store.getActiveProject();

    let container = document.getElementById("globalModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "globalModalContainer";
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto text-xs">
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="plus-circle" class="w-5 h-5 text-slate-950"></i> Create Issue / Bug
            </h3>
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Form -->
          <form onsubmit="window.app.handleCreateIssueSubmit(event)" class="mt-4 space-y-3.5">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Project *</label>
                <select id="newIssueProject" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                  ${projects.map(p => `<option value="${p.id}" ${p.id === activeProject.id ? 'selected' : ''}>${p.key} - ${p.name}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Issue Type *</label>
                <select id="newIssueType" onchange="window.app.toggleBugFields(this.value)" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                  <option value="Bug" selected>Bug (Defect)</option>
                  <option value="Story">Story</option>
                  <option value="Task">Task</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Priority *</label>
                <select id="newIssuePriority" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                  <option value="Critical">Critical</option>
                  <option value="High" selected>High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Title / Summary *</label>
              <input type="text" id="newIssueTitle" required placeholder="e.g. Checkout payment fails when applying 100% discount coupon" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea id="newIssueDesc" rows="2" placeholder="Detailed issue description, acceptance criteria, or business context..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Assignee</label>
                <select id="newIssueAssignee" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                  ${users.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Environment</label>
                <input type="text" id="newIssueEnv" value="Staging" placeholder="e.g. Staging / Production" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]" />
              </div>
            </div>

            <!-- Dynamic QA-Friendly Bug Fields (Section 14) -->
            <div id="bugSpecificFields" class="p-3.5 bg-red-50/40 rounded-xl border border-red-200/80 space-y-3">
              <div class="flex items-center gap-1.5 font-bold text-red-900 text-xs">
                <i data-lucide="bug" class="w-4 h-4 text-red-600"></i> QA Defect Details
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Steps to Reproduce *</label>
                <textarea id="bugSteps" rows="3" placeholder="1. Open checkout&#10;2. Add product&#10;3. Select payment method&#10;4. Click Pay" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none font-sans"></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Expected Result *</label>
                  <input type="text" id="bugExpected" placeholder="Payment completes with receipt" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Actual Result *</label>
                  <input type="text" id="bugActual" placeholder="Payment fails with error 400" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Browser / Device</label>
                  <input type="text" id="bugDevice" value="Chrome 125, macOS" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Build Version</label>
                  <input type="text" id="bugBuild" value="v1.4.2-rc" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button type="button" onclick="document.getElementById('globalModalContainer').innerHTML=''" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl shadow-xs shadow-[#bef264]/30 transition cursor-pointer">
                Create Issue
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  toggleBugFields(type) {
    const fields = document.getElementById("bugSpecificFields");
    if (fields) {
      fields.style.display = type === "Bug" ? "block" : "none";
    }
  }

  handleCreateIssueSubmit(e) {
    e.preventDefault();
    const projectId = document.getElementById("newIssueProject").value;
    const type = document.getElementById("newIssueType").value;
    const priority = document.getElementById("newIssuePriority").value;
    const title = document.getElementById("newIssueTitle").value.trim();
    const description = document.getElementById("newIssueDesc").value.trim();
    const assigneeId = document.getElementById("newIssueAssignee").value;
    const environment = document.getElementById("newIssueEnv").value.trim();

    let stepsToReproduce = "";
    let expectedResult = "";
    let actualResult = "";
    let browserDevice = "";
    let buildVersion = "";

    if (type === "Bug") {
      stepsToReproduce = document.getElementById("bugSteps")?.value.trim() || "";
      expectedResult = document.getElementById("bugExpected")?.value.trim() || "";
      actualResult = document.getElementById("bugActual")?.value.trim() || "";
      browserDevice = document.getElementById("bugDevice")?.value.trim() || "";
      buildVersion = document.getElementById("bugBuild")?.value.trim() || "";
    }

    const newIssue = store.createIssue({
      projectId,
      type,
      priority,
      title,
      description,
      assigneeId,
      environment,
      stepsToReproduce,
      expectedResult,
      actualResult,
      browserDevice,
      buildVersion
    });

    document.getElementById("globalModalContainer").innerHTML = "";
    this.toast("Issue Created", `Created ${newIssue.key}: ${newIssue.title}`, "success");
    
    // Refresh active view
    if (this.currentView === "project-workspace") {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else {
      this.navigate(this.currentView);
    }
  }

  // --- ENHANCED ISSUE DETAILS DRAWER / MODAL (Sections 6-14, 24) ---
  openIssueDetails(issueId) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;

    const project = store.getProjectById(issue.projectId || issue.project_id) || store.getActiveProject();
    const devId = issue.developerId || issue.developer_id || issue.assigneeId || issue.assignee_id;
    const qaId = issue.qaId || issue.qa_id;
    const developer = (devId && store.getUserById(devId)) || { id: "", name: "Unassigned", initials: "UA", color: "bg-slate-400" };
    const qa = (qaId && store.getUserById(qaId)) || { id: "", name: "Unassigned", initials: "QA", color: "bg-purple-600" };
    const reporter = (issue.reporterId && store.getUserById(issue.reporterId)) || { id: "", name: "Team Member", initials: "TM", color: "bg-indigo-600" };
    const sprintId = issue.sprintId || issue.sprint_id;
    const sprint = sprintId ? store.getSprintById(sprintId) : null;
    const sprints = project ? store.getSprints(project.id) : [];
    const users = store.getUsers();
    const gate = store.getQualityGate(issue);

    let drawerContainer = document.getElementById("globalDrawerContainer");
    if (!drawerContainer) {
      drawerContainer = document.createElement("div");
      drawerContainer.id = "globalDrawerContainer";
      document.body.appendChild(drawerContainer);
    }

    drawerContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end animate-fade-in" onclick="if(event.target === this) window.app.closeIssueDetails()">
        <div class="bg-white w-full max-w-3xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-slide-in-right overflow-hidden text-xs">
          
          <!-- =========================================================================
               1. HEADER: KEY, TYPE, TITLE, STATUS & PRIORITY
               ========================================================================= -->
          <div class="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3 shrink-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="font-mono font-bold text-sm text-slate-900 px-2 py-0.5 rounded bg-[#f7fee7] border border-[#d9f99d] shrink-0">
                ${issue.key}
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${issue.type === 'Bug' ? 'type-bug' : issue.type === 'Story' ? 'type-story' : 'type-task'}">
                ${issue.type}
              </span>
              <span class="text-slate-500 font-medium truncate">in <strong>${project.name}</strong></span>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button onclick="window.app.closeIssueDetails()" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- =========================================================================
               2. SCROLLABLE BODY
               ========================================================================= -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            <!-- Issue Title & Quick Status Bar -->
            <div class="space-y-3">
              <h2 class="text-lg sm:text-xl font-bold text-slate-900 leading-snug">${issue.title}</h2>
              
              <!-- Quick Transitions Strip -->
              <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-700">Status:</span>
                  <select onchange="window.app.changeIssueStatus('${issue.id}', this.value)" class="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] cursor-pointer">
                    <option value="Backlog" ${issue.status === 'Backlog' || issue.status === 'Open' ? 'selected' : ''}>Backlog / Open</option>
                    <option value="To Do" ${issue.status === 'To Do' ? 'selected' : ''}>To Do</option>
                    <option value="In Progress" ${issue.status === 'In Progress' || issue.status === 'In Development' ? 'selected' : ''}>In Progress</option>
                    <option value="Fixed" ${issue.status === 'Fixed' ? 'selected' : ''}>Fixed (Ready for QA)</option>
                    <option value="Ready for QA" ${issue.status === 'Ready for QA' ? 'selected' : ''}>Ready for QA</option>
                    <option value="QA Testing" ${issue.status === 'QA Testing' || issue.status === 'QA' ? 'selected' : ''}>QA Testing</option>
                    <option value="Done" ${issue.status === 'Done' || issue.status === 'Closed' ? 'selected' : ''}>Done / Closed</option>
                    <option value="Reopened" ${issue.status === 'Reopened' ? 'selected' : ''}>Reopened ✗</option>
                  </select>
                </div>

                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-700">Priority:</span>
                  <select onchange="window.app.handleUpdatePriority('${issue.id}', this.value)" class="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold ${
                    issue.priority === 'Critical' ? 'text-red-600' : issue.priority === 'High' ? 'text-amber-600' : 'text-slate-800'
                  } focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] cursor-pointer">
                    <option value="Critical" ${issue.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                    <option value="High" ${issue.priority === 'High' ? 'selected' : ''}>High</option>
                    <option value="Medium" ${issue.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="Low" ${issue.priority === 'Low' ? 'selected' : ''}>Low</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- =========================================================================
                 3. QUALITY GATE BANNER (Section 9 - PROMINENT PULSEWAVE DIFFERENTIATOR)
                 ========================================================================= -->
            <div class="p-4 rounded-xl border ${
              gate.isPassed ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900' :
              gate.status === 'failed' ? 'bg-red-50/90 border-red-300 text-red-950' :
              'bg-purple-50/80 border-purple-300 text-purple-950'
            } shadow-xs space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 font-bold uppercase text-[11px] tracking-wider">
                  <i data-lucide="${gate.isPassed ? 'shield-check' : gate.status === 'failed' ? 'shield-alert' : 'shield'}" class="w-4 h-4 ${
                    gate.isPassed ? 'text-emerald-600' : gate.status === 'failed' ? 'text-red-600' : 'text-purple-600'
                  }"></i>
                  <span>QUALITY GATE VERIFICATION</span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full font-bold text-xs uppercase shadow-2xs ${
                  gate.isPassed ? 'bg-emerald-600 text-white' :
                  gate.status === 'failed' ? 'bg-red-600 text-white' :
                  'bg-purple-600 text-white'
                }">
                  ${gate.label}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2 pt-2 border-t border-current/10 text-center text-xs">
                <div class="p-1.5 bg-white/70 rounded-lg">
                  <span class="text-[10px] text-slate-500 block font-semibold uppercase">Developer Status</span>
                  <span class="font-bold text-slate-900">${issue.status === 'Done' || issue.status === 'Closed' || issue.status === 'Fixed' ? 'Fixed' : issue.status}</span>
                </div>
                <div class="p-1.5 bg-white/70 rounded-lg">
                  <span class="text-[10px] text-slate-500 block font-semibold uppercase">QA Status</span>
                  <span class="font-bold ${issue.qaStatus === 'Passed' ? 'text-emerald-700' : issue.qaStatus === 'Failed' ? 'text-red-700' : 'text-purple-700'}">${issue.qaStatus || 'Not Tested'}</span>
                </div>
                <div class="p-1.5 bg-white/70 rounded-lg">
                  <span class="text-[10px] text-slate-500 block font-semibold uppercase">Final Gate</span>
                  <span class="font-bold ${gate.isPassed ? 'text-emerald-700' : gate.status === 'failed' ? 'text-red-700' : 'text-purple-700'}">${gate.finalStatus}</span>
                </div>
              </div>
            </div>

            <!-- =========================================================================
                 4. ASSIGNMENT & ROLES (Section 7)
                 ========================================================================= -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              
              <!-- Assigned Developer -->
              <div class="space-y-1">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Assigned Developer</span>
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full ${developer.color || 'bg-slate-950 text-[#bef264]'} text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                    ${developer.initials || 'UA'}
                  </div>
                  <select onchange="window.app.handleAssignDeveloper('${issue.id}', this.value)" class="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] w-full truncate">
                    <option value="" ${!developer.id ? 'selected' : ''}>Unassigned</option>
                    ${users.filter(u => u.role.includes("Developer") || u.role.includes("Senior") || u.role.includes("Engineer") || u.role.includes("Member")).map(u => `
                      <option value="${u.id}" ${u.id === developer.id ? 'selected' : ''}>${u.name}</option>
                    `).join("")}
                  </select>
                </div>
              </div>

              <!-- Assigned QA Engineer -->
              <div class="space-y-1">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Assigned QA Engineer</span>
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full ${qa.color || 'bg-rose-600'} text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                    ${qa.initials || 'QA'}
                  </div>
                  <select onchange="window.app.handleAssignQA('${issue.id}', this.value)" class="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] w-full truncate">
                    <option value="" ${!qa.id ? 'selected' : ''}>Unassigned</option>
                    ${users.filter(u => u.role.includes("QA") || u.department === "Quality Assurance").map(u => `
                      <option value="${u.id}" ${u.id === qa.id ? 'selected' : ''}>${u.name}</option>
                    `).join("")}
                  </select>
                </div>
              </div>

              <!-- Reporter -->
              <div class="space-y-1">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Reporter</span>
                <div class="flex items-center gap-2 pt-1">
                  <div class="w-6 h-6 rounded-full ${reporter.color || 'bg-indigo-600'} text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                    ${reporter.initials || 'TM'}
                  </div>
                  <span class="font-bold text-slate-800">${reporter.name || 'Team Member'}</span>
                </div>
              </div>

            </div>

            <!-- =========================================================================
                 5. PROJECT & RELEASE INFORMATION (Section 6, 14, 18)
                 ========================================================================= -->
            <div class="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
              <h4 class="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500">Project & Release Information</h4>
              
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div>
                  <span class="text-slate-400 block text-[10px] font-semibold">Sprint</span>
                  <select onchange="window.app.handleUpdateSprint('${issue.id}', this.value)" class="mt-0.5 bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-bold text-slate-800 w-full">
                    <option value="" ${!issue.sprintId ? 'selected' : ''}>Product Backlog</option>
                    ${sprints.map(s => `
                      <option value="${s.id}" ${issue.sprintId === s.id ? 'selected' : ''}>${s.name}</option>
                    `).join("")}
                  </select>
                </div>

                <div>
                  <span class="text-slate-400 block text-[10px] font-semibold">Environment</span>
                  <select onchange="window.app.handleUpdateEnvironment('${issue.id}', this.value)" class="mt-0.5 bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-bold text-slate-800 w-full">
                    <option value="Staging" ${issue.environment === 'Staging' ? 'selected' : ''}>Staging</option>
                    <option value="Production" ${issue.environment === 'Production' ? 'selected' : ''}>Production</option>
                    <option value="UAT" ${issue.environment === 'UAT' ? 'selected' : ''}>UAT</option>
                    <option value="Development" ${issue.environment === 'Development' ? 'selected' : ''}>Development</option>
                  </select>
                </div>

                <div>
                  <span class="text-slate-400 block text-[10px] font-semibold">Build / Version</span>
                  <span class="font-mono font-bold text-slate-800 block mt-1">${issue.buildVersion || 'v2.4.1'}</span>
                </div>

                <div>
                  <span class="text-slate-400 block text-[10px] font-semibold">Target Release</span>
                  <span class="font-mono font-bold text-slate-900 block mt-1">${issue.releaseVersion || 'v2.4.1'}</span>
                </div>
              </div>

              ${(issue.labels && issue.labels.length > 0) ? `
                <div class="flex items-center gap-1.5 pt-1">
                  <span class="text-[10px] text-slate-400 font-semibold">Labels:</span>
                  ${issue.labels.map(l => `<span class="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium text-[10px]">${l}</span>`).join("")}
                </div>
              ` : ''}
            </div>

            <!-- =========================================================================
                 6. DESCRIPTION & ACCEPTANCE CRITERIA
                 ========================================================================= -->
            <div class="space-y-3">
              <h4 class="font-bold text-slate-900 text-sm">Description</h4>
              <p class="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">${issue.description || 'No description provided.'}</p>

              <!-- Acceptance Criteria Checklist -->
              ${(issue.acceptanceCriteria && issue.acceptanceCriteria.length > 0) ? `
                <div class="mt-3 p-3.5 bg-[#f7fee7]/60 rounded-xl border border-[#d9f99d] space-y-2">
                  <span class="font-bold text-[#4d7c0f] text-xs flex items-center gap-1.5">
                    <i data-lucide="check-square" class="w-4 h-4 text-[#4d7c0f]"></i> Acceptance Criteria
                  </span>
                  <div class="space-y-1.5 pt-1">
                    ${issue.acceptanceCriteria.map((ac, idx) => `
                      <label class="flex items-start gap-2 cursor-pointer select-none text-xs text-slate-700">
                        <input type="checkbox" ${ac.done ? 'checked' : ''} onchange="window.app.toggleAcceptanceCriterion('${issue.id}', ${idx})" class="mt-0.5 rounded text-slate-950 focus:ring-[#bef264]/50" />
                        <span class="${ac.done ? 'line-through text-slate-400' : 'text-slate-800'}">${ac.text}</span>
                      </label>
                    `).join("")}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- =========================================================================
                 7. BUG-SPECIFIC INFORMATION & REOPEN COUNTER (Section 10, 11, 12)
                 ========================================================================= -->
            ${issue.type === 'Bug' ? `
              <div class="space-y-3 p-4 bg-red-50/40 rounded-xl border border-red-200">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-red-900 flex items-center gap-1.5 text-xs">
                    <i data-lucide="bug" class="w-4 h-4 text-red-600"></i> Bug Defect Specification
                  </h4>
                  ${issue.reopenCount > 0 ? `
                    <span class="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px] animate-pulse">
                      Reopened ${issue.reopenCount} ${issue.reopenCount === 1 ? 'time' : 'times'}
                    </span>
                  ` : `
                    <span class="text-[10px] text-slate-500 font-semibold">First cycle test</span>
                  `}
                </div>

                <!-- Steps to reproduce -->
                <div>
                  <span class="text-[10px] font-bold uppercase text-slate-500">Steps to Reproduce:</span>
                  <pre class="mt-1 p-2.5 bg-white rounded-lg border border-slate-200 font-sans text-xs text-slate-800 whitespace-pre-line leading-relaxed">${issue.stepsToReproduce || 'N/A'}</pre>
                </div>

                <!-- Expected vs Actual -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200">
                    <span class="text-[10px] font-bold text-emerald-800 uppercase block">Expected Result</span>
                    <p class="text-emerald-950 mt-0.5">${issue.expectedResult || 'N/A'}</p>
                  </div>
                  <div class="p-2.5 bg-red-50/70 rounded-lg border border-red-200">
                    <span class="text-[10px] font-bold text-red-800 uppercase block">Actual Result</span>
                    <p class="text-red-950 mt-0.5">${issue.actualResult || 'N/A'}</p>
                  </div>
                </div>

                <!-- Hardware/Browser & Device Details (Section 14) -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1 text-slate-600">
                  <div class="p-1.5 bg-white rounded border border-slate-200">
                    <span class="text-slate-400 block text-[9px] uppercase font-bold">Browser</span>
                    <strong>${issue.browser || 'Chrome 151'}</strong>
                  </div>
                  <div class="p-1.5 bg-white rounded border border-slate-200">
                    <span class="text-slate-400 block text-[9px] uppercase font-bold">Device / OS</span>
                    <strong>${issue.device || 'Windows Desktop'}</strong>
                  </div>
                  <div class="p-1.5 bg-white rounded border border-slate-200 col-span-2 sm:col-span-1">
                    <span class="text-slate-400 block text-[9px] uppercase font-bold">Build Version</span>
                    <strong>${issue.buildVersion || 'v2.4.1'}</strong>
                  </div>
                </div>

                <!-- Reopen History Breakdown (Section 12) -->
                ${(issue.reopenHistory && issue.reopenHistory.length > 0) ? `
                  <div class="mt-3 pt-3 border-t border-red-200/80 space-y-2">
                    <span class="text-[10px] font-bold text-red-900 uppercase">Reopen QA History:</span>
                    <div class="space-y-1.5">
                      ${issue.reopenHistory.map(h => `
                        <div class="p-2 bg-white/90 rounded border border-red-200 text-[11px] flex items-start justify-between gap-2">
                          <div>
                            <span class="font-bold text-red-700">Fix #${h.attempt}</span>: QA by <strong>${h.qa}</strong> → <span class="font-bold text-red-600">Failed</span>
                            <p class="text-slate-600 mt-0.5">${h.reason}</p>
                          </div>
                          <span class="text-[10px] text-slate-400 shrink-0 font-mono">${h.date}</span>
                        </div>
                      `).join("")}
                    </div>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- =========================================================================
                 8. TRACEABILITY SECTION (Section 13)
                 ========================================================================= -->
            <div class="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500 flex items-center gap-1.5">
                  <i data-lucide="git-merge" class="w-3.5 h-3.5 text-indigo-600"></i> Work Item Traceability
                </h4>
                <span class="text-[10px] text-slate-400">Click any node to navigate</span>
              </div>

              <!-- Interactive Linked Traceability Chain -->
              <div class="flex items-center gap-2 overflow-x-auto py-1 horizontal-scroll-touch text-[11px]">
                <div class="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold shrink-0">
                  <span class="text-[9px] uppercase block text-indigo-500">Parent Story</span>
                  <span>${issue.traceability?.storyKey || 'STY-105'}</span>
                </div>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-300 shrink-0"></i>

                <div class="px-2.5 py-1.5 rounded-lg bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] font-bold shrink-0">
                  <span class="text-[9px] uppercase block text-[#4d7c0f]">Active Task / Bug</span>
                  <span>${issue.key}</span>
                </div>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-300 shrink-0"></i>

                <div class="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-medium shrink-0">
                  <span class="text-[9px] uppercase block text-slate-400">Dev Fix</span>
                  <span>${developer.name}</span>
                </div>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-300 shrink-0"></i>

                <div class="px-2.5 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-medium shrink-0">
                  <span class="text-[9px] uppercase block text-purple-500">QA Verification</span>
                  <span>${qa.name}</span>
                </div>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-300 shrink-0"></i>

                <div class="px-2.5 py-1.5 rounded-lg ${gate.isPassed ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-200 text-slate-700 font-bold'} shrink-0">
                  <span class="text-[9px] uppercase block ${gate.isPassed ? 'text-emerald-100' : 'text-slate-500'}">Sign-off</span>
                  <span>${gate.isPassed ? 'PASSED ✓' : 'PENDING'}</span>
                </div>
              </div>
            </div>

            <!-- =========================================================================
                 9. DEDICATED QA VERIFICATION PANEL (Section 8 - MAJOR FEATURE)
                 ========================================================================= -->
            <div class="p-5 bg-gradient-to-br from-purple-50/60 via-slate-50 to-white rounded-2xl border-2 border-purple-200 shadow-sm space-y-4">
              
              <div class="flex items-center justify-between pb-3 border-b border-purple-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-purple-600 text-white font-bold">
                    <i data-lucide="shield-check" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-slate-900 text-sm">QA Quality Verification & Sign-off</h3>
                    <p class="text-[11px] text-slate-500">Execute testing verification on target environment and sign off Quality Gate</p>
                  </div>
                </div>
                
                <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  issue.qaStatus === 'Passed' ? 'bg-emerald-100 text-emerald-800' :
                  issue.qaStatus === 'Failed' ? 'bg-red-100 text-red-800' :
                  'bg-purple-100 text-purple-800'
                }">
                  ${issue.qaStatus || 'Not Tested'}
                </span>
              </div>

              <!-- QA Meta Row -->
              <div class="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span class="text-slate-400 block font-semibold text-[10px]">Assigned QA</span>
                  <span class="font-bold text-slate-800">${qa.name}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-semibold text-[10px]">Environment</span>
                  <span class="font-bold text-slate-800">${issue.environment || 'Staging'}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-semibold text-[10px]">Build Target</span>
                  <span class="font-mono font-bold text-slate-800">${issue.buildVersion || 'v2.4.1'}</span>
                </div>
              </div>

              <!-- QA Notes Area -->
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-700 text-xs">QA Verification Notes & Defect Findings:</label>
                <textarea id="qaNotesInput" rows="2" placeholder="Record verification steps, pass/fail remarks, edge-case coverage..." class="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none leading-relaxed">${issue.qaNotes || ''}</textarea>
              </div>

              <!-- Evidence Upload Simulation -->
              <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div class="flex items-center gap-2">
                  <i data-lucide="paperclip" class="w-4 h-4 text-slate-400"></i>
                  <div>
                    <span class="font-bold text-slate-800 block text-xs">Verification Evidence & Logs</span>
                    <span class="text-[10px] text-slate-400">${issue.qaEvidence || 'No attachments linked yet'}</span>
                  </div>
                </div>
                <button onclick="window.app.showToast('Evidence Attached', 'Mock screenshot attached to verification record', 'info')" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition cursor-pointer">
                  + Attach Evidence
                </button>
              </div>

              <!-- QA Action Decision Buttons (Section 8) -->
              <div class="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                <span class="text-[11px] text-slate-500 font-medium">Record Quality Verdict:</span>
                
                <div class="flex items-center gap-2">
                  <button onclick="window.app.handleQADecision('${issue.id}', 'Passed')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                    <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                    <span>PASS ✓</span>
                  </button>

                  <button onclick="window.app.handleQADecision('${issue.id}', 'Failed')" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                    <i data-lucide="x-circle" class="w-4 h-4"></i>
                    <span>FAIL ✕</span>
                  </button>

                  <button onclick="window.app.handleQADecision('${issue.id}', 'Blocked')" class="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition flex items-center gap-1 cursor-pointer">
                    <i data-lucide="alert-octagon" class="w-3.5 h-3.5"></i>
                    <span>BLOCK ⚠</span>
                  </button>

                  <button onclick="window.app.handleQADecision('${issue.id}', 'Retesting')" class="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition flex items-center gap-1 cursor-pointer">
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                    <span>RETEST 🔄</span>
                  </button>
                </div>
              </div>

            </div>

            <!-- =========================================================================
                 10. COMMENTS STREAM
                 ========================================================================= -->
            <div class="space-y-3">
              <h4 class="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <i data-lucide="message-square" class="w-4 h-4 text-slate-900"></i> Comments & Discussion (${issue.comments ? issue.comments.length : 0})
              </h4>

              <div class="space-y-2 max-h-48 overflow-y-auto">
                ${(issue.comments && issue.comments.length > 0) ? issue.comments.map(c => {
                  const author = store.getUserById(c.authorId);
                  return `
                    <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                      <div class="w-6 h-6 rounded-full ${author.color || 'bg-slate-400'} text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">${author.initials}</div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-slate-900">${author.name}</span>
                          <span class="text-[10px] text-slate-400">${c.timestamp}</span>
                        </div>
                        <p class="text-slate-700 mt-1 leading-relaxed">${c.text}</p>
                      </div>
                    </div>
                  `;
                }).join("") : `<p class="text-slate-400 italic py-2">No comments yet. Start a discussion or add test logs below.</p>`}
              </div>

              <!-- Comment Input Form -->
              <div class="flex gap-2">
                <input type="text" id="issueCommentInput" placeholder="Add a comment, fix commit link, or verification note..." class="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
                <button onclick="window.app.submitIssueComment('${issue.id}')" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl shadow-sm transition cursor-pointer">
                  Send
                </button>
              </div>
            </div>

            <!-- =========================================================================
                 11. ACTIVITY LIFECYCLE TIMELINE (Section 24)
                 ========================================================================= -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <h4 class="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <i data-lucide="clock" class="w-4 h-4 text-slate-500"></i> Lifecycle History Timeline
              </h4>
              
              <div class="space-y-2.5 pl-3 border-l-2 border-slate-200">
                ${(issue.activityTimeline && issue.activityTimeline.length > 0) ? issue.activityTimeline.map(ev => `
                  <div class="text-[11px] text-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <strong>${ev.user}</strong>: ${ev.action}
                    </div>
                    <span class="text-[10px] text-slate-400 shrink-0 font-mono">${ev.time}</span>
                  </div>
                `).join("") : `
                  <div class="text-[11px] text-slate-600">
                    <strong>${reporter.name}</strong> created ${issue.key} • <span class="text-slate-400">${issue.createdAt || 'Initial'}</span>
                  </div>
                `}
              </div>
            </div>

          </div>

          <!-- =========================================================================
               12. FOOTER
               ========================================================================= -->
          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span class="text-slate-400 text-[11px]">Last updated: ${issue.updatedAt || 'Recently'}</span>
            <button onclick="window.app.closeIssueDetails()" class="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition cursor-pointer">
              Close Details
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  handleQADecision(issueId, qaStatus) {
    const qaNotes = document.getElementById("qaNotesInput")?.value || "";
    store.verifyIssueQA(issueId, { qaStatus, qaNotes });
    this.openIssueDetails(issueId);

    if (this.currentView === "project-workspace") {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "backlog-sprints") {
      BacklogSprintsView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "my-issues") {
      MyIssuesView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "all-issues") {
      AllIssuesView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "dashboard") {
      DashboardView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "test-management") {
      TestManagementView.render(document.getElementById("mainContent"));
    }
  }

  handleQaRetest(issueKey, newResult, actualResult = "", qaNotes = "") {
    const res = store.retestFromBug(issueKey, newResult, actualResult, qaNotes);
    if (res) {
      if (newResult === "Passed") {
        this.toast("Retest Passed ✓", `${issueKey} closed and Quality Gate cleared.`, "success");
      } else {
        this.toast("Retest Failed ✗", `${issueKey} reopened with new failure cycle.`, "error");
      }
      this.openIssueDetails(res.id);
      if (this.currentView === "project-workspace") {
        ProjectWorkspaceView.render(document.getElementById("mainContent"));
      } else if (this.currentView === "test-management") {
        TestManagementView.render(document.getElementById("mainContent"));
      }
    }
  }

  handleAssignDeveloper(issueId, devId) {
    store.updateIssue(issueId, { developerId: devId, assigneeId: devId });
    const user = store.getUserById(devId);
    this.showToast("Developer Assigned", `Assigned to ${user.name}`, "info");
    this.openIssueDetails(issueId);
  }

  handleAssignQA(issueId, qaId) {
    store.updateIssue(issueId, { qaId });
    const user = store.getUserById(qaId);
    this.showToast("QA Assigned", `Assigned to ${user.name}`, "info");
    this.openIssueDetails(issueId);
  }

  handleUpdateEnvironment(issueId, env) {
    store.updateIssue(issueId, { environment: env });
    this.showToast("Environment Updated", `Testing target: ${env}`, "info");
    this.openIssueDetails(issueId);
  }

  handleUpdatePriority(issueId, priority) {
    store.updateIssue(issueId, { priority });
    this.showToast("Priority Updated", `Set to ${priority}`, "info");
    this.openIssueDetails(issueId);
  }

  handleUpdateSprint(issueId, sprintId) {
    const sId = sprintId ? sprintId : null;
    store.moveIssueToSprint(issueId, sId);
    const targetName = sId ? store.getSprintById(sId)?.name : "Product Backlog";
    this.showToast("Sprint Updated", `Moved to ${targetName}`, "info");
    this.openIssueDetails(issueId);
  }

  toggleAcceptanceCriterion(issueId, index) {
    const issue = store.getIssueById(issueId);
    if (!issue || !issue.acceptanceCriteria) return;
    issue.acceptanceCriteria[index].done = !issue.acceptanceCriteria[index].done;
    store.saveState();
    this.openIssueDetails(issueId);
  }

  closeIssueDetails() {
    const container = document.getElementById("globalDrawerContainer");
    if (container) container.innerHTML = "";
  }

  changeIssueStatus(issueId, newStatus) {
    store.updateIssueStatus(issueId, newStatus);
    this.openIssueDetails(issueId);
    if (this.currentView === "project-workspace") {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "backlog-sprints") {
      BacklogSprintsView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "my-issues") {
      MyIssuesView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "all-issues") {
      AllIssuesView.render(document.getElementById("mainContent"));
    }
  }

  submitIssueComment(issueId) {
    const input = document.getElementById("issueCommentInput");
    if (!input || !input.value.trim()) return;
    store.addComment(issueId, input.value.trim());
    this.openIssueDetails(issueId);
  }

  // --- HELP / TOUR MODAL ---
  openHelpModal() {
    let container = document.getElementById("globalModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "globalModalContainer";
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in text-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="help-circle" class="w-5 h-5 text-slate-900"></i> V1 Lifecycle Workflow Guide
            </h3>
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <p class="text-slate-600 leading-relaxed">
            Welcome to the V1 Project & QA Management Platform. The platform provides a clean, Jira-familiar workflow with an independent modern SaaS UI:
          </p>

          <div class="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full bg-slate-950 text-[#bef264] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div><strong>Project Manager:</strong> Creates project & sets up board.</div>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full bg-slate-950 text-[#bef264] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div><strong>Create Issues & Bugs:</strong> Log work items and assign developers & QA.</div>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full bg-slate-950 text-[#bef264] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div><strong>Developer:</strong> Moves issue to <em>In Progress</em>, builds fix, then moves to <em>QA</em>.</div>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full bg-slate-950 text-[#bef264] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">4</span>
              <div><strong>QA Engineer:</strong> Verifies fix. If resolved → <em>Done/Closed</em>; if failing → <em>Reopened</em>.</div>
            </div>
          </div>

          <div class="p-3 bg-[#f7fee7] rounded-xl border border-[#d9f99d] text-slate-900">
            <strong>Pro Tip:</strong> Use the top right <strong>Persona Switcher</strong> to switch between PM, Developer, and QA roles to test the entire lifecycle in real time.
          </div>

          <div class="pt-2 flex justify-end">
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl shadow-sm transition">
              Got it!
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  // --- TOAST ALERTS ---
  toast(title, message, type = "info") {
    this.showToast(title, message, type);
  }

  showToast(title, message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    let border = "border-slate-950 bg-white text-slate-800";
    let icon = "info";
    if (type === "success") {
      border = "border-emerald-500 bg-white text-slate-800";
      icon = "check-circle";
    } else if (type === "error" || type === "urgent") {
      border = "border-red-500 bg-white text-slate-800";
      icon = "alert-circle";
    } else if (type === "warning") {
      border = "border-amber-500 bg-white text-slate-800";
      icon = "alert-triangle";
    }

    toast.className = `p-3.5 rounded-xl shadow-lg border-l-4 ${border} animate-fade-in flex items-start gap-3 w-full pointer-events-auto transition-all`;
    toast.innerHTML = `
      <div class="mt-0.5 shrink-0">
        <i data-lucide="${icon}" class="w-4 h-4 ${type === 'success' ? 'text-emerald-600' : type === 'error' || type === 'urgent' ? 'text-red-600' : 'text-slate-900'}"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-xs font-bold text-slate-900">${title}</div>
        <div class="text-[11px] text-slate-600 mt-0.5">${message}</div>
      </div>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 shrink-0">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- AI QA ASSISTANT ---
  openAIQAAssistant(projectId = null) {
    const pId = projectId || store.getActiveProject()?.id;
    if (typeof AIQAAssistantView !== 'undefined' && AIQAAssistantView.open) {
      AIQAAssistantView.open(pId);
    }
  }

  closeAIQAAssistant() {
    if (typeof AIQAAssistantView !== 'undefined' && AIQAAssistantView.close) {
      AIQAAssistantView.close();
    }
  }

  // --- RESET DATA ---
  resetData() {
    if (confirm("Reset all project workspaces, issues, bugs, and activity logs to default seed dataset?")) {
      store.resetToDefault();
      this.toast("Reset Complete", "Workspace dataset reset to factory seed values.", "success");
      this.navigate(this.currentView);
    }
  }
}

// Instantiate global app controller
window.app = new AppController();
window.addEventListener("DOMContentLoaded", () => {
  window.app.init();
});
