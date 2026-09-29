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
    this.activeIssueDetailTab = "comments";
  }

  async init() {
    // Try restoring real Supabase authenticated user session
    if (window.supabaseClient && window.supabaseClient.auth) {
      try {
        const { data: userData, error: userErr } = await window.supabaseClient.auth.getUser();
        if (userErr || !userData || !userData.user) {
          // User was deleted from Supabase Auth or token is invalid
          console.log("No valid Supabase user found on server. Clearing local session.");
          try { await window.supabaseClient.auth.signOut(); } catch (e) {}
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem("pulsewave_supabase_auth_token");
            localStorage.removeItem("pulsewave_qa_v2_store");
          }
          store.clearSupabaseUser();
        } else {
          store.setSupabaseUser(userData.user);
          // Load real database tables if initialized in Supabase
          if (store.loadSupabaseCloudTables) {
            await store.loadSupabaseCloudTables();
          }
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
            this.updateHeaderProjectSelector();
            this.updateHeaderPersona();
            this.updateSidebarSpacesExplorer();
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
      const route = hash || "dashboard";
      if (route && route !== this.currentView) {
        this.navigate(route);
      }
    });

    // Handle initial route (Starts from dashboard by default or current hash)
    const initialHash = window.location.hash ? window.location.hash.substring(1) : "";
    const initialView = initialHash || "dashboard";
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
      setTimeout(() => { if (toastEl && toastEl.remove) toastEl.remove(); else if (toastEl && toastEl.parentElement) toastEl.parentElement.removeChild(toastEl); }, 300);
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
      if (!activeUser) {
        this.navigate("login");
        return;
      }

      const userSpaces = store.getWorkspaces ? store.getWorkspaces(activeUser.id) : [];
      if (userSpaces.length === 0) {
        this.navigate("onboarding");
        return;
      }

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

    if (!contentArea) return;

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
      case "releases":
        if (typeof ReleasesView !== 'undefined') {
          ReleasesView.render(contentArea);
        } else {
          TestReportsView.render(contentArea);
        }
        break;
      case "documentation":
        DocumentationView.render(contentArea);
        break;
      case "test-runs":
      case "qa-workspace":
        TestManagementView.render(contentArea);
        break;
      case "tickets":
      case "bugs":
        AllIssuesView.render(contentArea);
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
    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const activeWorkspace = store.getActiveWorkspace ? store.getActiveWorkspace() : null;
    const container = document.getElementById("headerPersonaWidget");
    if (!container) return;

    if (!activeUser) {
      container.innerHTML = `
        <button onclick="window.app.navigate('login')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer">
          <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
          <span>Sign In</span>
        </button>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

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
    const currentSpace = (store.getActiveWorkspace ? store.getActiveWorkspace() : null) || spaces[0] || { id: "ws_default", name: "Workspace", logo_color: "bg-slate-950 text-[#bef264]" };
    const currentActiveProject = store.getActiveProject ? store.getActiveProject() : null;
    const canCreateProject = store.canCreateProject ? store.canCreateProject() : false;
    const spaceRole = store.getEffectiveSpaceRole ? store.getEffectiveSpaceRole() : 'PM';
    const isSpacePm = spaceRole === "PM" || (store.isWorkspaceAdmin && store.isWorkspaceAdmin());
    const spaceProjects = store.getProjectsForCurrentSpace ? store.getProjectsForCurrentSpace() : (store.getProjects ? store.getProjects() : []);

    const spaceInitials = (currentSpace.name || "S").split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'PW';

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
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem("pulsewave_supabase_auth_token");
      localStorage.removeItem("pulsewave_qa_v2_store");
      localStorage.removeItem("pulsewave_project_invitations");
      localStorage.removeItem("last_project_invite_token");
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    store.clearSupabaseUser();
    this.showToast("Signed Out", "You have been signed out from Supabase. Returning to login screen.", "info");
    this.navigate("login");
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
    const emailLogs = store.getEmailLogs ? store.getEmailLogs() : [];
    const unreadCount = allNotifs.filter(n => !n.read).length;
    const assignmentCount = allNotifs.filter(n => n.type === 'assignment').length;
    const qaCount = allNotifs.filter(n => n.type === 'qa' || n.type === 'bug' || n.type === 'release').length;
    const chatCount = allNotifs.filter(n => n.type === 'chat').length;
    const emailsCount = emailLogs.length;

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

        <button
          onclick="event.stopPropagation(); window.app.setNotificationFilter('emails')"
          class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${this.notificationFilter === 'emails' ? 'bg-purple-950 text-[#d8b4fe] shadow-2xs' : 'text-slate-500 hover:text-slate-800'}"
        >
          <i data-lucide="mail" class="w-3 h-3"></i>
          <span>Emails</span>
          ${emailsCount > 0 ? `<span class="px-1 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[9px]">${emailsCount}</span>` : ''}
        </button>
      </div>

      <!-- Notifications / Emails Feed -->
      <div class="max-h-72 overflow-y-auto divide-y divide-slate-100">
        ${this.notificationFilter === 'emails' ? (
          emailLogs.length === 0 ? `
            <div class="p-8 text-center text-slate-400 space-y-1">
              <i data-lucide="mail-x" class="w-7 h-7 text-slate-300 mx-auto"></i>
              <p class="font-bold text-slate-600 text-xs">No Outbound Emails Logged</p>
              <p class="text-[10px] text-slate-400">Trigger actions (assign tasks, handover QA, chat mentions) to dispatch emails.</p>
            </div>
          ` : emailLogs.map(em => `
            <div
              onclick="window.app.openEmailPreviewModal('${em.id}')"
              class="p-3 hover:bg-purple-50/50 cursor-pointer transition flex items-start gap-2.5 group relative bg-white font-medium"
            >
              <div class="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <i data-lucide="mail-check" class="w-3.5 h-3.5"></i>
              </div>
              <div class="flex-1 min-w-0 pr-2">
                <div class="flex items-center justify-between gap-1">
                  <h4 class="text-xs font-bold text-slate-900 truncate">${em.subject}</h4>
                  <span class="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-black uppercase shrink-0">Delivered</span>
                </div>
                <p class="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-1">To: <span class="font-mono text-purple-900">${em.recipient}</span></p>
                <div class="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>${em.projectName || 'PulseWave Workspace'}</span>
                  <span>${new Date(em.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          `).join('')
        ) : (
          notifs.length === 0 ? `
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
          }).join('')
        )}
      </div>

      <!-- Dropdown Footer -->
      <div class="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
        <div class="flex items-center gap-3">
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
            <span>Clear</span>
          </button>
        </div>

        <button
          onclick="event.stopPropagation(); window.app.closeNotificationMenu(); window.app.navigate('settings', { tab: 'notifications' })"
          class="text-slate-700 hover:text-slate-950 font-bold hover:underline cursor-pointer flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
        >
          <i data-lucide="settings" class="w-3.5 h-3.5 text-slate-600"></i>
          <span>Preferences</span>
        </button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  showEmailToast(logEntry) {
    if (!logEntry || !logEntry.recipient) return;
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "flex items-start gap-2.5 p-3.5 bg-slate-950 text-white rounded-xl shadow-lg border border-[#bef264]/40 max-w-sm w-full animate-slide-in pointer-events-auto relative z-50 mb-2";
    toast.innerHTML = `
      <div class="p-1.5 rounded-lg bg-[#bef264]/20 text-[#bef264] border border-[#bef264]/40 shrink-0 mt-0.5">
        <i data-lucide="mail-check" class="w-4 h-4"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-black text-white flex items-center gap-1">
            <span>Email Dispatched</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] bg-[#bef264] text-slate-950 font-black uppercase">Delivered</span>
          </h4>
          <span class="text-[10px] text-slate-400">Just now</span>
        </div>
        <p class="text-[11px] text-slate-300 mt-0.5 truncate">${logEntry.subject || 'Notification Email'}</p>
        <p class="text-[10px] text-slate-400 mt-0.5">To: <span class="font-mono text-[#bef264]">${logEntry.recipient}</span></p>
      </div>
    `;
    toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-opacity", "duration-300");
      setTimeout(() => { if (toast && toast.remove) toast.remove(); else if (toast && toast.parentElement) toast.parentElement.removeChild(toast); }, 300);
    }, 4500);
  }

  openEmailPreviewModal(emailLogId) {
    const logs = store.getEmailLogs ? store.getEmailLogs() : [];
    const entry = logs.find(l => l.id === emailLogId);
    if (!entry) return;

    let modal = document.getElementById("emailPreviewModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "emailPreviewModal";
      document.body.appendChild(modal);
    }

    modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in";
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        <div class="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="p-1.5 rounded-lg bg-[#bef264]/20 text-[#bef264] border border-[#bef264]/30">
              <i data-lucide="mail" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-white truncate max-w-md">${entry.subject}</h3>
              <p class="text-xs text-slate-400">Sent to: <span class="font-mono text-[#bef264]">${entry.recipient}</span> &bull; ${new Date(entry.sentAt).toLocaleString()}</p>
            </div>
          </div>
          <button onclick="document.getElementById('emailPreviewModal').remove()" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 bg-slate-100">
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <iframe srcdoc="${entry.html.replace(/"/g, '&quot;')}" class="w-full h-[450px] border-none"></iframe>
          </div>
        </div>
        <div class="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <span class="text-xs text-slate-500 font-medium">Status: <strong class="text-emerald-700 uppercase">${entry.status}</strong></span>
          <button onclick="document.getElementById('emailPreviewModal').remove()" class="px-4 py-1.5 bg-slate-950 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer">
            Close Preview
          </button>
        </div>
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
      setTimeout(() => { if (toast && toast.remove) toast.remove(); else if (toast && toast.parentElement) toast.parentElement.removeChild(toast); }, 300);
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
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-70 flex items-start justify-center pt-20 p-4" onclick="if(event.target === this) window.app.closeSearchModal()">
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
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-70 flex items-center justify-center p-4">
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

  // =========================================================================
  // PULSEWAVE V2 — ENTERPRISE ISSUE DETAIL, WORKFLOW & QA VERIFICATION DRAWER
  // =========================================================================

  async openIssueDetails(issueId, defaultTab = null) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;

    if (defaultTab) {
      this.activeIssueDetailTab = defaultTab;
    }

    // Async background sync with Supabase for latest relational records
    if (store.syncIssueDetailsFromSupabase) {
      store.syncIssueDetailsFromSupabase(issue.id).then(() => {
        // Re-render tabs if drawer is still open
        const container = document.getElementById("issueActivityTabsContent");
        if (container) {
          this.renderIssueActivityTabsContent(issue.id);
        }
      }).catch(() => {});
    }

    const project = store.getProjectById(issue.projectId || issue.project_id) || store.getActiveProject();
    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const userRole = (store.getUserProjectRole(project?.id, activeUser?.id) || store.getUserSpaceRole(project?.workspace_id || project?.workspaceId, activeUser?.id) || 'DEVELOPER').toUpperCase();
    const isPM = userRole === 'PM' || userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';
    const isQA = userRole === 'QA' || userRole === 'QA_MANAGER' || userRole === 'QA_ENGINEER';
    const isDev = userRole === 'DEVELOPER';
    const isViewer = userRole === 'VIEWER' || userRole === 'CLIENT_VIEWER';

    const devId = issue.developerId || issue.developer_id || issue.assigneeId || issue.assignee_id;
    const qaId = issue.qaId || issue.qa_id;
    const developer = (devId && store.getUserById(devId)) || { id: "", name: "Unassigned", initials: "UA", color: "bg-slate-400" };
    const qa = (qaId && store.getUserById(qaId)) || { id: "", name: "Unassigned", initials: "QA", color: "bg-purple-600" };
    const reporter = (issue.reporterId && store.getUserById(issue.reporterId)) || { id: "", name: "Team Member", initials: "TM", color: "bg-indigo-600" };
    const sprintId = issue.sprintId || issue.sprint_id;
    const sprints = project ? store.getSprints(project.id) : [];
    const projectMembers = project ? (store.getProjectMembers ? store.getProjectMembers(project.id) : store.getUsers()) : store.getUsers();
    const gate = store.getQualityGate(issue);
    const isWatched = store.isIssueWatched ? store.isIssueWatched(issue.id) : false;

    // Checklists & Relationships
    const checklists = store.getIssueChecklists ? store.getIssueChecklists(issue.id) : [];
    const relationships = store.getIssueRelationships ? store.getIssueRelationships(issue.id) : [];
    const attachments = store.getIssueAttachments ? store.getIssueAttachments(issue.id) : [];
    const qaEvidence = store.getQaEvidence ? store.getQaEvidence(issue.id) : [];
    const qaVerifications = store.getQaVerifications ? store.getQaVerifications(issue.id) : [];
    const comments = store.getIssueComments ? store.getIssueComments(issue.id) : (issue.comments || []);

    // Resolve & Format Due Date for HTML5 date input (YYYY-MM-DD)
    const sprintObj = sprintId ? store.getSprintById(sprintId) : null;
    let rawDueDate = issue.dueDate || issue.due_date || issue.targetDate || issue.target_date;
    let isInherited = false;
    if (!rawDueDate) {
      if (sprintObj && (sprintObj.endDate || sprintObj.end_date || sprintObj.dueDate)) {
        rawDueDate = sprintObj.endDate || sprintObj.end_date || sprintObj.dueDate;
        isInherited = true;
      } else if (project && (project.dueDate || project.due_date || project.deadline)) {
        rawDueDate = project.dueDate || project.due_date || project.deadline;
        isInherited = true;
      }
    }

    let formattedDueDate = "";
    if (rawDueDate) {
      try {
        const d = new Date(rawDueDate);
        if (!isNaN(d.getTime())) {
          formattedDueDate = d.toISOString().split('T')[0];
        } else if (typeof rawDueDate === 'string' && rawDueDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          formattedDueDate = rawDueDate.slice(0, 10);
        }
      } catch (e) {
        formattedDueDate = String(rawDueDate).slice(0, 10);
      }
    }

    let drawerContainer = document.getElementById("globalDrawerContainer");
    if (!drawerContainer) {
      drawerContainer = document.createElement("div");
      drawerContainer.id = "globalDrawerContainer";
      document.body.appendChild(drawerContainer);
    }

    drawerContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 flex justify-end animate-fade-in" onclick="if(event.target === this) window.app.closeIssueDetails()">
        <div class="bg-white w-full max-w-4xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-slide-in-right overflow-hidden text-xs">
          
          <!-- =========================================================================
               1. HEADER: KEY, TYPE, PROJECT BREADCRUMB, WATCH, SHARE & MORE ACTIONS
               ========================================================================= -->
          <div class="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3 shrink-0">
            <!-- Left: Breadcrumb & Key -->
            <div class="flex items-center gap-2 min-w-0">
              <button onclick="window.app.handleCopyIssueLink('${issue.key}')" class="font-mono font-extrabold text-xs text-slate-900 px-2.5 py-1 rounded-lg bg-[#f7fee7] border border-[#d9f99d] hover:bg-[#ecfccb] transition flex items-center gap-1 shrink-0 cursor-pointer" title="Click to copy issue key">
                <i data-lucide="copy" class="w-3 h-3 text-[#4d7c0f]"></i>
                <span>${issue.key}</span>
              </button>
              
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                issue.type === 'Bug' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                issue.type === 'Story' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-slate-100 text-slate-800 border border-slate-200'
              }">
                ${issue.type}
              </span>

              <span class="text-slate-400 font-medium truncate hidden sm:inline">in <strong class="text-slate-700">${project?.name || 'Project'}</strong></span>
            </div>

            <!-- Right: Action Buttons -->
            <div class="flex items-center gap-1.5 shrink-0">
              <!-- Watch Button -->
              <button onclick="window.app.handleToggleWatch('${issue.id}')" class="px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                isWatched ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
              }" title="${isWatched ? 'You are watching this issue' : 'Watch this issue'}">
                <i data-lucide="${isWatched ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5 ${isWatched ? 'text-indigo-600' : 'text-slate-400'}"></i>
                <span class="hidden sm:inline">${isWatched ? 'Watching ✓' : 'Watch'}</span>
              </button>

              <!-- Share / Copy Link -->
              <button onclick="window.app.handleCopyIssueLink('${issue.key}')" class="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer" title="Copy link to issue">
                <i data-lucide="share-2" class="w-4 h-4"></i>
              </button>

              <!-- More Actions Menu -->
              <div class="relative">
                <button onclick="window.app.toggleIssueMoreMenu(event)" class="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 transition cursor-pointer" title="More issue actions">
                  <i data-lucide="more-vertical" class="w-4 h-4"></i>
                </button>
                <div id="issueMoreMenuDropdown" class="hidden absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 text-xs font-semibold space-y-0.5">
                  <button onclick="window.app.openLinkWorkItemModal('${issue.id}')" class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                    <i data-lucide="link" class="w-3.5 h-3.5 text-indigo-600"></i> Link Work Item
                  </button>
                  <button onclick="window.app.handleAddChecklist('${issue.id}')" class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                    <i data-lucide="check-square" class="w-3.5 h-3.5 text-emerald-600"></i> Add QA Checklist
                  </button>
                  <button onclick="window.app.handleCloneIssue('${issue.id}')" class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                    <i data-lucide="copy" class="w-3.5 h-3.5 text-slate-500"></i> Clone Issue
                  </button>
                  ${isPM || isQA ? `
                    <div class="border-t border-slate-100 my-1"></div>
                    <button onclick="window.app.handleDeleteIssue('${issue.id}')" class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-bold">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-600"></i> Delete Issue
                    </button>
                  ` : ''}
                </div>
              </div>

              <div class="h-4 w-px bg-slate-300 mx-0.5"></div>

              <!-- Close Button -->
              <button onclick="window.app.closeIssueDetails()" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer" title="Close Details">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- =========================================================================
               2. PRIMARY WORKFLOW BAR (Status Transition Engine & Priority)
               ========================================================================= -->
          <div class="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <!-- Status Transition -->
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Workflow:</span>
              <div class="relative inline-block">
                <select onchange="window.app.handleWorkflowTransitionSelect('${issue.id}', this.value)" class="bg-white border border-slate-300 font-extrabold text-xs text-slate-900 rounded-lg px-3 py-1.5 shadow-2xs hover:border-slate-400 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] cursor-pointer">
                  <option value="Backlog" ${issue.status === 'Backlog' || issue.status === 'Open' ? 'selected' : ''}>Backlog / Open</option>
                  <option value="To Do" ${issue.status === 'To Do' ? 'selected' : ''}>To Do</option>
                  <option value="In Progress" ${issue.status === 'In Progress' || issue.status === 'In Development' ? 'selected' : ''}>In Progress (Dev)</option>
                  <option value="Ready for QA" ${issue.status === 'Ready for QA' || issue.status === 'Fixed' ? 'selected' : ''}>Ready for QA (Fixed) ⮞</option>
                  <option value="QA Testing" ${issue.status === 'QA Testing' || issue.status === 'QA' ? 'selected' : ''}>QA Testing</option>
                  <option value="Done" ${issue.status === 'Done' || issue.status === 'Closed' ? 'selected' : ''}>Done / QA Verified ✓</option>
                  <option value="Reopened" ${issue.status === 'Reopened' ? 'selected' : ''}>Reopened ✗ (Fix Required)</option>
                </select>
              </div>
            </div>

            <!-- Priority & Quality Badge -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Priority:</span>
                <select onchange="window.app.handleUpdatePriority('${issue.id}', this.value)" class="bg-white border border-slate-300 font-bold text-xs rounded-lg px-2.5 py-1.5 shadow-2xs cursor-pointer ${
                  issue.priority === 'Critical' ? 'text-red-600 border-red-300 bg-red-50/50' :
                  issue.priority === 'High' ? 'text-amber-600 border-amber-300 bg-amber-50/50' :
                  'text-slate-800'
                }">
                  <option value="Critical" ${issue.priority === 'Critical' ? 'selected' : ''}>🔴 Critical (P0)</option>
                  <option value="High" ${issue.priority === 'High' ? 'selected' : ''}>🟠 High (P1)</option>
                  <option value="Medium" ${issue.priority === 'Medium' ? 'selected' : ''}>🟡 Medium (P2)</option>
                  <option value="Low" ${issue.priority === 'Low' ? 'selected' : ''}>🟢 Low (P3)</option>
                </select>
              </div>

              <div id="inlineSaveIndicator" class="text-[10px] font-bold text-emerald-600 hidden items-center gap-1">
                <i data-lucide="check" class="w-3 h-3"></i> Saved
              </div>
            </div>
          </div>

          <!-- =========================================================================
               3. SCROLLABLE BODY (2-Column Jira/ClickUp Standard Grid)
               ========================================================================= -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              <!-- =====================================================================
                   LEFT MAIN COLUMN (8 of 12 Cols - 67%)
                   ===================================================================== -->
              <div class="lg:col-span-8 space-y-6">
                
                <!-- Issue Title (Inline Editable) -->
                <div class="space-y-1.5">
                  <div class="group relative">
                    <input type="text" id="issueTitleInput" value="${issue.title.replace(/"/g, '&quot;')}" onblur="window.app.handleInlineTitleSave('${issue.id}', this.value)" onkeydown="if(event.key==='Enter') this.blur()" class="w-full text-base sm:text-lg font-extrabold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 rounded-xl px-2.5 py-1.5 transition leading-snug" placeholder="Issue Title..." />
                  </div>
                </div>

                <!-- ===================================================================
                     PULSEWAVE QUALITY GATE & VERIFICATION CARD (CORE DIFFERENTIATOR)
                     =================================================================== -->
                <div class="p-4 sm:p-5 rounded-2xl border-2 ${
                  gate.isPassed ? 'bg-gradient-to-br from-emerald-50/70 to-white border-emerald-300' :
                  gate.status === 'failed' ? 'bg-gradient-to-br from-red-50/80 to-white border-red-300' :
                  'bg-gradient-to-br from-purple-50/70 via-slate-50 to-white border-purple-200'
                } shadow-xs space-y-3.5">
                  
                  <div class="flex items-center justify-between pb-2.5 border-b border-current/10">
                    <div class="flex items-center gap-2">
                      <div class="p-1.5 rounded-lg ${
                        gate.isPassed ? 'bg-emerald-600 text-white' :
                        gate.status === 'failed' ? 'bg-red-600 text-white' :
                        'bg-purple-600 text-white'
                      } font-bold shadow-2xs">
                        <i data-lucide="${gate.isPassed ? 'shield-check' : gate.status === 'failed' ? 'shield-alert' : 'shield'}" class="w-4 h-4"></i>
                      </div>
                      <div>
                        <h3 class="font-bold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-1.5">
                          <span>Quality Gate Verification</span>
                          <span class="text-[10px] text-slate-400 font-normal lowercase">(PulseWave QA Engine)</span>
                        </h3>
                      </div>
                    </div>
                    
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase shadow-2xs ${
                      gate.isPassed ? 'bg-emerald-600 text-white' :
                      gate.status === 'failed' ? 'bg-red-600 text-white' :
                      'bg-purple-600 text-white'
                    }">
                      ${gate.label}
                    </span>
                  </div>

                  <!-- 3 Distinct Tiers: Developer -> QA -> Final Gate -->
                  <div class="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div class="p-2 bg-white/80 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span class="text-[10px] text-slate-400 block font-bold uppercase">Dev Verification</span>
                      <span class="font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                        ${issue.status === 'In Progress' ? '⏳ In Dev' : (issue.status === 'Backlog' || issue.status === 'To Do') ? 'Pending' : '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i> READY ✓'}
                      </span>
                    </div>

                    <div class="p-2 bg-white/80 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span class="text-[10px] text-slate-400 block font-bold uppercase">QA Verification</span>
                      <span class="font-bold mt-0.5 block ${
                        issue.qaStatus === 'Passed' ? 'text-emerald-700' :
                        issue.qaStatus === 'Failed' ? 'text-red-700' :
                        issue.qaStatus === 'Blocked' ? 'text-amber-700' :
                        'text-purple-700'
                      }">
                        ${issue.qaStatus === 'Passed' ? 'PASSED ✓' : issue.qaStatus === 'Failed' ? 'FAILED ✗' : issue.qaStatus === 'Blocked' ? 'BLOCKED ⚠' : (issue.qaStatus || 'AWAITING QA')}
                      </span>
                    </div>

                    <div class="p-2 bg-white/80 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span class="text-[10px] text-slate-400 block font-bold uppercase">Final Quality Gate</span>
                      <span class="font-bold mt-0.5 block ${gate.isPassed ? 'text-emerald-700' : gate.status === 'failed' ? 'text-red-700' : 'text-slate-600'}">
                        ${gate.isPassed ? 'CLEARED ✓' : gate.status === 'failed' ? 'BLOCKED ✗' : 'PENDING ⏳'}
                      </span>
                    </div>
                  </div>

                  <!-- QA Quick Action Decision Bar (Interactive) -->
                  <div class="pt-2 border-t border-current/10 flex flex-wrap items-center justify-between gap-2">
                    <span class="text-[11px] text-slate-500 font-medium">Record QA Result on <strong>${issue.environment || 'Staging'}</strong>:</span>
                    
                    <div class="flex items-center gap-1.5">
                      <button onclick="window.app.openWorkflowTransitionModal('${issue.id}', 'Done', false, 'PASS')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer">
                        <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                        <span>PASS ✓</span>
                      </button>

                      <button onclick="window.app.openWorkflowTransitionModal('${issue.id}', 'Reopened', false, 'FAIL')" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer">
                        <i data-lucide="x-circle" class="w-3.5 h-3.5"></i>
                        <span>FAIL ✗</span>
                      </button>

                      <button onclick="window.app.openWorkflowTransitionModal('${issue.id}', 'QA Testing', false, 'BLOCKED')" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer">
                        <i data-lucide="alert-octagon" class="w-3.5 h-3.5"></i>
                        <span>BLOCK ⚠</span>
                      </button>

                      <button onclick="window.app.openWorkflowTransitionModal('${issue.id}', 'QA Testing', false, 'RETEST')" class="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer">
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                        <span>RETEST 🔄</span>
                      </button>
                    </div>
                  </div>

                </div>

                <!-- ===================================================================
                     DESCRIPTION (Inline Editable)
                     =================================================================== -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <i data-lucide="align-left" class="w-3.5 h-3.5 text-slate-500"></i> Description
                    </h4>
                    <span class="text-[10px] text-slate-400">Click below to edit</span>
                  </div>

                  <div class="group relative">
                    <textarea id="issueDescriptionInput" rows="3" onblur="window.app.handleInlineDescriptionSave('${issue.id}', this.value)" class="w-full p-3.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 rounded-2xl text-xs text-slate-800 leading-relaxed transition" placeholder="Add a detailed description, user story, or context...">${issue.description || ''}</textarea>
                  </div>
                </div>

                <!-- ===================================================================
                     BUG-SPECIFIC DEFECT SECTION (Steps, Expected vs Actual)
                     =================================================================== -->
                ${issue.type === 'Bug' ? `
                  <div class="p-4 bg-red-50/40 rounded-2xl border border-red-200 space-y-3.5">
                    <div class="flex items-center justify-between pb-2 border-b border-red-200/80">
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
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold uppercase text-slate-500">Steps to Reproduce:</label>
                      <textarea rows="3" onblur="window.app.handleInlineFieldUpdate('${issue.id}', 'stepsToReproduce', this.value)" class="w-full p-2.5 bg-white rounded-xl border border-slate-200 font-sans text-xs text-slate-800 focus:ring-2 focus:ring-red-400 focus:outline-none leading-relaxed" placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Observe error...">${issue.stepsToReproduce || ''}</textarea>
                    </div>

                    <!-- Expected vs Actual -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div class="space-y-1 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                        <label class="text-[10px] font-bold text-emerald-800 uppercase block">Expected Result</label>
                        <textarea rows="2" onblur="window.app.handleInlineFieldUpdate('${issue.id}', 'expectedResult', this.value)" class="w-full p-2 bg-white rounded-lg border border-emerald-300 text-xs text-slate-800 focus:outline-none" placeholder="What was supposed to happen...">${issue.expectedResult || ''}</textarea>
                      </div>

                      <div class="space-y-1 p-2.5 bg-red-50/70 rounded-xl border border-red-200">
                        <label class="text-[10px] font-bold text-red-800 uppercase block">Actual Result</label>
                        <textarea rows="2" onblur="window.app.handleInlineFieldUpdate('${issue.id}', 'actualResult', this.value)" class="w-full p-2 bg-white rounded-lg border border-red-300 text-xs text-slate-800 focus:outline-none" placeholder="What actually happened...">${issue.actualResult || ''}</textarea>
                      </div>
                    </div>
                  </div>
                ` : ''}

                <!-- ===================================================================
                     CHECKLISTS & ACCEPTANCE CRITERIA
                     =================================================================== -->
                <div class="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                  <div class="flex items-center justify-between">
                    <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <i data-lucide="check-square" class="w-3.5 h-3.5 text-emerald-600"></i> QA Checklists & Acceptance Criteria
                    </h4>
                    <button onclick="window.app.handleAddChecklist('${issue.id}')" class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer">
                      <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Checklist
                    </button>
                  </div>

                  <!-- Legacy acceptanceCriteria if present -->
                  ${(issue.acceptanceCriteria && issue.acceptanceCriteria.length > 0) ? `
                    <div class="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <span class="text-[10px] font-bold text-slate-500 uppercase">Acceptance Criteria</span>
                      <div class="space-y-1.5">
                        ${issue.acceptanceCriteria.map((ac, idx) => `
                          <label class="flex items-start gap-2 cursor-pointer select-none text-xs text-slate-700">
                            <input type="checkbox" ${ac.done ? 'checked' : ''} onchange="window.app.toggleAcceptanceCriterion('${issue.id}', ${idx})" class="mt-0.5 rounded text-slate-950 focus:ring-[#bef264]/50 cursor-pointer" />
                            <span class="${ac.done ? 'line-through text-slate-400' : 'text-slate-800'}">${ac.text}</span>
                          </label>
                        `).join("")}
                      </div>
                    </div>
                  ` : ''}

                  <!-- Dynamic Relational Checklists -->
                  ${checklists.length > 0 ? checklists.map(chk => `
                    <div class="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <i data-lucide="list-checks" class="w-4 h-4 text-emerald-600"></i> ${chk.title}
                        </span>
                        <span class="text-[10px] font-mono font-bold text-slate-500">${chk.completedCount}/${chk.totalItems} done (${chk.progressPct}%)</span>
                      </div>

                      <!-- Progress bar -->
                      <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div class="bg-emerald-500 h-1.5 rounded-full transition-all" style="width: ${chk.progressPct}%"></div>
                      </div>

                      <!-- Items list -->
                      <div class="space-y-1.5 pt-1">
                        ${chk.items.map(item => `
                          <div class="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-50 group">
                            <label class="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                              <input type="checkbox" ${item.is_completed || item.isCompleted ? 'checked' : ''} onchange="window.app.handleToggleChecklistItem('${item.id}', '${issue.id}')" class="rounded text-emerald-600 focus:ring-emerald-400 cursor-pointer" />
                              <span class="${item.is_completed || item.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'} truncate">${item.content}</span>
                            </label>
                            <button onclick="window.app.handleDeleteChecklistItem('${item.id}', '${issue.id}')" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 transition cursor-pointer">
                              <i data-lucide="trash" class="w-3 h-3"></i>
                            </button>
                          </div>
                        `).join("")}

                        <!-- Add Item Input -->
                        <div class="pt-1 flex gap-1.5">
                          <input type="text" id="newChecklistItemInput_${chk.id}" placeholder="Add an item to this checklist..." onkeydown="if(event.key==='Enter') window.app.handleAddChecklistItem('${chk.id}', '${issue.id}')" class="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/40 focus:bg-white focus:outline-none" />
                          <button onclick="window.app.handleAddChecklistItem('${chk.id}', '${issue.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition cursor-pointer">
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  `).join("") : `
                    <div class="p-3 text-center text-slate-400 italic text-xs">
                      No checklists created yet. Click "+ Add Checklist" to track verification steps.
                    </div>
                  `}
                </div>

                <!-- ===================================================================
                     TRACEABILITY & RELATED WORK ITEMS (Dependencies, Subtasks, Links)
                     =================================================================== -->
                <div class="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                  <div class="flex items-center justify-between">
                    <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <i data-lucide="git-merge" class="w-3.5 h-3.5 text-indigo-600"></i> Linked Work Items & Dependencies
                    </h4>
                    <button onclick="window.app.openLinkWorkItemModal('${issue.id}')" class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer">
                      <i data-lucide="link-2" class="w-3.5 h-3.5"></i> Link Work Item
                    </button>
                  </div>

                  ${relationships.length > 0 ? `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      ${relationships.map(rel => `
                        <div class="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-300 transition">
                          <div class="flex items-center gap-2 min-w-0 cursor-pointer" onclick="window.app.openIssueDetails('${rel.otherIssue.id}')">
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">${rel.relationshipType}</span>
                            <div class="min-w-0">
                              <span class="font-mono font-bold text-slate-900">${rel.otherIssue.key}</span>
                              <span class="text-slate-600 block text-[11px] truncate">${rel.otherIssue.title}</span>
                            </div>
                          </div>
                          <button onclick="window.app.handleRemoveRelationship('${rel.id}', '${issue.id}')" class="text-slate-400 hover:text-rose-600 p-1 cursor-pointer" title="Unlink">
                            <i data-lucide="x" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                      `).join("")}
                    </div>
                  ` : `
                    <p class="text-slate-400 italic text-center py-2 text-xs">No linked work items or dependencies.</p>
                  `}
                </div>

                <!-- ===================================================================
                     ACTIVITY & COLLABORATION TABS: COMMENTS, HISTORY, EVIDENCE, QA
                     =================================================================== -->
                <div class="space-y-4 pt-2">
                  <!-- Tab Header -->
                  <div class="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto horizontal-scroll-touch text-xs font-bold">
                    <button onclick="window.app.switchIssueDetailTab('${issue.id}', 'comments')" class="px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                      this.activeIssueDetailTab === 'comments' ? 'bg-slate-950 text-[#bef264]' : 'text-slate-600 hover:bg-slate-100'
                    }">
                      <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                      <span>Comments (${comments.length})</span>
                    </button>

                    <button onclick="window.app.switchIssueDetailTab('${issue.id}', 'history')" class="px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                      this.activeIssueDetailTab === 'history' ? 'bg-slate-950 text-[#bef264]' : 'text-slate-600 hover:bg-slate-100'
                    }">
                      <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                      <span>History</span>
                    </button>

                    <button onclick="window.app.switchIssueDetailTab('${issue.id}', 'evidence')" class="px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                      this.activeIssueDetailTab === 'evidence' ? 'bg-slate-950 text-[#bef264]' : 'text-slate-600 hover:bg-slate-100'
                    }">
                      <i data-lucide="paperclip" class="w-3.5 h-3.5"></i>
                      <span>Evidence & Files (${attachments.length})</span>
                    </button>

                    <button onclick="window.app.switchIssueDetailTab('${issue.id}', 'qa_history')" class="px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                      this.activeIssueDetailTab === 'qa_history' ? 'bg-slate-950 text-[#bef264]' : 'text-slate-600 hover:bg-slate-100'
                    }">
                      <i data-lucide="shield" class="w-3.5 h-3.5"></i>
                      <span>QA Attempts (${qaVerifications.length})</span>
                    </button>
                  </div>

                  <!-- Dynamic Tabs Content Container -->
                  <div id="issueActivityTabsContent">
                    ${this.renderIssueActivityTabsContent(issue.id)}
                  </div>

                </div>

              </div>

              <!-- =====================================================================
                   RIGHT SIDEBAR (4 of 12 Cols - 33%): METADATA & INLINE EDITING
                   ===================================================================== -->
              <div class="lg:col-span-4 space-y-4">
                
                <!-- Core Attributes Card -->
                <div class="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 space-y-3.5">
                  <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200/80">
                    Issue Details & Assignees
                  </h4>

                  <!-- Assigned Developer -->
                  <div class="space-y-1">
                    <span class="text-slate-400 block text-[10px] uppercase font-bold">Assigned Developer</span>
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full ${developer.color || 'bg-slate-950 text-[#bef264]'} text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                        ${developer.initials || 'UA'}
                      </div>
                      <select onchange="window.app.handleAssignDeveloper('${issue.id}', this.value)" class="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] w-full truncate cursor-pointer">
                        <option value="" ${!developer.id ? 'selected' : ''}>Unassigned</option>
                        ${projectMembers.map(u => `
                          <option value="${u.id}" ${u.id === developer.id ? 'selected' : ''}>${u.name} (${u.role || 'Developer'})</option>
                        `).join("")}
                      </select>
                    </div>
                  </div>

                  <!-- Assigned QA Engineer -->
                  <div class="space-y-1">
                    <span class="text-slate-400 block text-[10px] uppercase font-bold">Assigned QA Engineer</span>
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full ${qa.color || 'bg-purple-600'} text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                        ${qa.initials || 'QA'}
                      </div>
                      <select onchange="window.app.handleAssignQA('${issue.id}', this.value)" class="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-purple-400 focus:border-purple-500 w-full truncate cursor-pointer">
                        <option value="" ${!qa.id ? 'selected' : ''}>Unassigned</option>
                        ${projectMembers.filter(u => u.role?.toUpperCase().includes("QA") || u.department === "Quality Assurance" || isPM).map(u => `
                          <option value="${u.id}" ${u.id === qa.id ? 'selected' : ''}>${u.name}</option>
                        `).join("")}
                      </select>
                    </div>
                  </div>

                  <!-- Reporter -->
                  <div class="space-y-1">
                    <span class="text-slate-400 block text-[10px] uppercase font-bold">Reporter</span>
                    <div class="flex items-center gap-2 pt-0.5">
                      <div class="w-6 h-6 rounded-full ${reporter.color || 'bg-indigo-600'} text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                        ${reporter.initials || 'TM'}
                      </div>
                      <span class="font-bold text-slate-800">${reporter.name || 'Team Member'}</span>
                    </div>
                  </div>

                  <div class="border-t border-slate-200/80 my-2"></div>

                  <!-- Sprint -->
                  <div class="space-y-1">
                    <span class="text-slate-400 block text-[10px] font-bold uppercase">Sprint</span>
                    <select onchange="window.app.handleUpdateSprint('${issue.id}', this.value)" class="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 w-full cursor-pointer">
                      <option value="" ${!issue.sprintId ? 'selected' : ''}>Product Backlog</option>
                      ${sprints.map(s => `
                        <option value="${s.id}" ${issue.sprintId === s.id ? 'selected' : ''}>${s.name}</option>
                      `).join("")}
                    </select>
                  </div>

                  <!-- Environment -->
                  <div class="space-y-1">
                    <span class="text-slate-400 block text-[10px] font-bold uppercase">Testing Environment</span>
                    <select onchange="window.app.handleUpdateEnvironment('${issue.id}', this.value)" class="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 w-full cursor-pointer">
                      <option value="Staging" ${issue.environment === 'Staging' ? 'selected' : ''}>Staging</option>
                      <option value="Production" ${issue.environment === 'Production' ? 'selected' : ''}>Production</option>
                      <option value="UAT" ${issue.environment === 'UAT' ? 'selected' : ''}>UAT</option>
                      <option value="Development" ${issue.environment === 'Development' ? 'selected' : ''}>Development</option>
                    </select>
                  </div>

                  <!-- Build / Version -->
                  <div class="space-y-1">
                    <span class="text-slate-400 block text-[10px] font-bold uppercase">Build / Version</span>
                    <input type="text" value="${issue.buildVersion || 'v2.4.1'}" onblur="window.app.handleInlineFieldUpdate('${issue.id}', 'buildVersion', this.value)" class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#bef264]/40" placeholder="e.g. v2.4.1" />
                  </div>

                  <!-- Target Release -->
                  <div class="space-y-1">
                    <span class="text-slate-400 block text-[10px] font-bold uppercase">Target Release</span>
                    <input type="text" value="${issue.releaseVersion || 'v2.4.1'}" onblur="window.app.handleInlineFieldUpdate('${issue.id}', 'releaseVersion', this.value)" class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#bef264]/40" placeholder="e.g. v2.4.1" />
                  </div>

                  <!-- Due Date -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-slate-400 block text-[10px] font-bold uppercase">Due Date</span>
                      ${isInherited && formattedDueDate ? `<span class="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200" title="Inherited from Project Timeline">Timeline Default</span>` : ''}
                    </div>
                    <input 
                      type="date" 
                      id="issueDueDateInput"
                      value="${formattedDueDate}" 
                      onchange="window.app.handleInlineFieldUpdate('${issue.id}', 'dueDate', this.value)" 
                      class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#bef264]/40 cursor-pointer" 
                    />
                  </div>

                  <!-- Story Points -->
                  <div class="space-y-1">
                    <span class="text-slate-400 block text-[10px] font-bold uppercase">Story Points</span>
                    <input type="number" min="0" max="100" value="${issue.storyPoints || issue.story_points || 3}" onblur="window.app.handleInlineFieldUpdate('${issue.id}', 'storyPoints', this.value)" class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#bef264]/40" />
                  </div>

                  <!-- Labels -->
                  <div class="space-y-1.5 pt-1">
                    <span class="text-slate-400 block text-[10px] font-bold uppercase">Labels</span>
                    <div class="flex flex-wrap items-center gap-1">
                      ${(issue.labels && issue.labels.length > 0) ? issue.labels.map(l => `
                        <span class="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-medium text-[10px] flex items-center gap-1">
                          <span>${l}</span>
                          <button onclick="window.app.handleRemoveLabel('${issue.id}', '${l}')" class="hover:text-rose-600 cursor-pointer">×</button>
                        </span>
                      `).join("") : '<span class="text-[10px] text-slate-400 italic">No labels</span>'}
                    </div>
                    <div class="flex gap-1 pt-1">
                      <input type="text" id="newLabelInput" placeholder="+ Add label..." onkeydown="if(event.key==='Enter') window.app.handleAddLabel('${issue.id}')" class="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px]" />
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

          <!-- =========================================================================
               4. FOOTER: AUDIT TIMESTAMP & CLOSE
               ========================================================================= -->
          <div class="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span class="text-slate-400 text-[11px]">Last modified: ${issue.updatedAt || 'Recently'}</span>
            <button onclick="window.app.closeIssueDetails()" class="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition cursor-pointer">
              Close Details
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  switchIssueDetailTab(issueId, tabName) {
    this.activeIssueDetailTab = tabName;
    const container = document.getElementById("issueActivityTabsContent");
    if (container) {
      container.innerHTML = this.renderIssueActivityTabsContent(issueId);
      if (window.lucide) window.lucide.createIcons();
    }
  }

  renderIssueActivityTabsContent(issueId) {
    const issue = store.getIssueById(issueId);
    if (!issue) return "";

    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const tab = this.activeIssueDetailTab || "comments";

    // 1. COMMENTS TAB
    if (tab === "comments") {
      const comments = store.getIssueComments ? store.getIssueComments(issue.id) : (issue.comments || []);
      const project = store.getProjectById(issue.projectId || issue.project_id);
      const projectMembers = project ? (store.getProjectMembers ? store.getProjectMembers(project.id) : store.getUsers()) : store.getUsers();

      return `
        <div class="space-y-4">
          <!-- Comments List -->
          <div class="space-y-3 max-h-96 overflow-y-auto pr-1">
            ${comments.length > 0 ? comments.map(c => `
              <div class="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2 group">
                <!-- Author Header -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full ${c.author?.color || 'bg-slate-700'} text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                      ${c.author?.initials || 'TM'}
                    </div>
                    <span class="font-bold text-slate-900">${c.author?.name || 'Team Member'}</span>
                    <span class="text-[10px] text-slate-400">${c.relativeTime || c.createdAt}</span>
                    ${c.editedAt ? '<span class="text-[9px] text-slate-400 italic">(edited)</span>' : ''}
                  </div>

                  <!-- Actions: Reply, React, Edit, Delete -->
                  <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button onclick="window.app.toggleCommentReplyBox('${c.id}')" class="px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer">
                      Reply
                    </button>

                    <button onclick="window.app.toggleCommentReactionPicker('${c.id}')" class="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer" title="Add reaction">
                      <i data-lucide="smile" class="w-3.5 h-3.5"></i>
                    </button>

                    ${(c.authorId === (activeUser ? activeUser.id : null)) ? `
                      <button onclick="window.app.handleEditCommentPrompt('${c.id}', '${escape(c.body)}')" class="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-200 transition cursor-pointer" title="Edit comment">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="window.app.handleDeleteComment('${c.id}', '${issue.id}')" class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition cursor-pointer" title="Delete comment">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    ` : ''}
                  </div>
                </div>

                <!-- Comment Body -->
                <p class="text-slate-800 text-xs leading-relaxed whitespace-pre-line pl-8">${c.body}</p>

                <!-- Reaction Badges -->
                ${(c.reactions && Object.keys(c.reactions).length > 0) ? `
                  <div class="flex flex-wrap items-center gap-1 pl-8 pt-1">
                    ${Object.entries(c.reactions).map(([emoji, rData]) => `
                      <button onclick="window.app.handleToggleReaction('${c.id}', '${emoji}', '${issue.id}')" class="px-2 py-0.5 rounded-full text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                        rData.userReacted ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }">
                        <span>${emoji}</span>
                        <span>${rData.count}</span>
                      </button>
                    `).join("")}
                  </div>
                ` : ''}

                <!-- Reaction Picker Popover (Hidden by default) -->
                <div id="reactionPicker_${c.id}" class="hidden pl-8 pt-1 flex items-center gap-1">
                  ${['👍', '✅', '👀', '🚀', '⚠️', '❗'].map(emoji => `
                    <button onclick="window.app.handleToggleReaction('${c.id}', '${emoji}', '${issue.id}')" class="p-1 text-sm rounded hover:bg-slate-200 transition cursor-pointer">
                      ${emoji}
                    </button>
                  `).join("")}
                </div>

                <!-- Threaded Replies -->
                ${(c.replies && c.replies.length > 0) ? `
                  <div class="ml-8 mt-2 pl-3 border-l-2 border-slate-200 space-y-2">
                    ${c.replies.map(r => `
                      <div class="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-1.5">
                            <div class="w-5 h-5 rounded-full ${r.author?.color || 'bg-slate-600'} text-white text-[8px] font-bold flex items-center justify-center">${r.author?.initials || 'TM'}</div>
                            <span class="font-bold text-slate-900">${r.author?.name}</span>
                            <span class="text-[9px] text-slate-400">${r.relativeTime || r.createdAt}</span>
                          </div>
                          ${(r.authorId === (activeUser ? activeUser.id : null)) ? `
                            <button onclick="window.app.handleDeleteComment('${r.id}', '${issue.id}')" class="text-slate-400 hover:text-rose-600 p-0.5">
                              <i data-lucide="trash-2" class="w-3 h-3"></i>
                            </button>
                          ` : ''}
                        </div>
                        <p class="text-slate-800 text-xs leading-relaxed whitespace-pre-line pl-6">${r.body}</p>
                      </div>
                    `).join("")}
                  </div>
                ` : ''}

                <!-- Nested Reply Box (Hidden by default) -->
                <div id="replyBox_${c.id}" class="hidden ml-8 pt-2">
                  <div class="flex gap-2">
                    <input type="text" id="replyInput_${c.id}" placeholder="Write a reply..." onkeydown="if(event.key==='Enter') window.app.handleSubmitComment('${issue.id}', '${c.id}')" class="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none" />
                    <button onclick="window.app.handleSubmitComment('${issue.id}', '${c.id}')" class="px-3 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer">
                      Reply
                    </button>
                  </div>
                </div>

              </div>
            `).join("") : `
              <div class="p-6 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No comments yet. Start the discussion for this issue below.
              </div>
            `}
          </div>

          <!-- Comment Composer Card -->
          <div class="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <textarea id="issueMainCommentInput" rows="2" placeholder="Write a comment, test finding, or tag a colleague with @..." class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#bef264]/40 focus:bg-white focus:outline-none leading-relaxed"></textarea>
            
            <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div class="flex items-center gap-1 text-slate-500">
                <!-- Attach file button -->
                <label class="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer" title="Attach image or file">
                  <i data-lucide="paperclip" class="w-4 h-4"></i>
                  <input type="file" onchange="window.app.handleCommentFileUpload('${issue.id}', this)" class="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.json,.log" />
                </label>

                <!-- Mention tag button -->
                <button type="button" onclick="window.app.handleInsertMention('${issue.id}')" class="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer" title="Mention team member">
                  <i data-lucide="at-sign" class="w-4 h-4"></i>
                </button>
              </div>

              <button onclick="window.app.handleSubmitComment('${issue.id}')" class="px-4 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="send" class="w-3.5 h-3.5"></i>
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 2. HISTORY / AUDIT TAB
    if (tab === "history") {
      const activities = store.getIssueActivities ? store.getIssueActivities(issue.id) : [];
      return `
        <div class="space-y-3">
          <div class="space-y-2.5 max-h-96 overflow-y-auto pl-2 border-l-2 border-slate-200">
            ${activities.length > 0 ? activities.map(act => `
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-2 text-xs">
                <div>
                  <strong class="text-slate-900">${act.actor?.name || 'User'}</strong>
                  <span class="text-slate-600"> ${act.activityType?.replace(/_/g, ' ')}</span>
                  ${act.metadata?.description ? `<p class="text-slate-500 mt-0.5 text-[11px]">${act.metadata.description}</p>` : ''}
                  ${act.metadata?.result ? `<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono mt-1 ${act.metadata.result === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">${act.metadata.result}</span>` : ''}
                </div>
                <span class="text-[10px] text-slate-400 font-mono shrink-0">${act.relativeTime || act.createdAt}</span>
              </div>
            `).join("") : `
              <p class="text-slate-400 italic py-4 text-center">No activity history recorded yet.</p>
            `}
          </div>
        </div>
      `;
    }

    // 3. EVIDENCE & ATTACHMENTS TAB
    if (tab === "evidence") {
      const attachments = store.getIssueAttachments ? store.getIssueAttachments(issue.id) : [];
      const qaEvidence = store.getQaEvidence ? store.getQaEvidence(issue.id) : [];

      return `
        <div class="space-y-4">
          
          <!-- QA Quality Evidence Cards -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <i data-lucide="shield-check" class="w-4 h-4 text-purple-600"></i> Verification Evidence
              </span>
              <label class="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1">
                <i data-lucide="upload" class="w-3 h-3"></i> + Attach QA Evidence
                <input type="file" onchange="window.app.handleEvidenceUpload('${issue.id}', this)" class="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.json,.log" />
              </label>
            </div>

            ${qaEvidence.length > 0 ? `
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                ${qaEvidence.map(ev => `
                  <div class="p-3 bg-purple-50/50 rounded-xl border border-purple-200 space-y-1.5 shadow-2xs">
                    <div class="flex items-center justify-between">
                      <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-200 text-purple-800">${ev.evidenceType}</span>
                      <span class="text-[10px] font-mono text-purple-700">${ev.environment} • ${ev.buildVersion}</span>
                    </div>
                    <span class="font-bold text-slate-900 block truncate text-xs">${ev.attachment?.fileName || 'evidence-file'}</span>
                    <div class="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span>By ${ev.uploadedBy?.name}</span>
                      <div class="flex items-center gap-1.5">
                        <button onclick="window.app.openFilePreviewModal('${ev.attachment?.id || ev.id}')" class="text-purple-700 hover:underline font-bold cursor-pointer">Preview</button>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            ` : `
              <p class="text-slate-400 italic text-center py-2 text-xs">No QA verification evidence attached yet.</p>
            `}
          </div>

          <!-- General Attachments Cards -->
          <div class="space-y-2 pt-2 border-t border-slate-200">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <i data-lucide="file" class="w-4 h-4 text-slate-500"></i> All Issue Attachments
              </span>
              <label class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1">
                <i data-lucide="upload" class="w-3 h-3"></i> Upload File
                <input type="file" onchange="window.app.handleGeneralFileUpload('${issue.id}', this)" class="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.json,.log,.zip" />
              </label>
            </div>

            ${attachments.length > 0 ? `
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                ${attachments.map(att => `
                  <div class="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs hover:border-slate-300 transition">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-mono text-slate-400">${Math.round(att.fileSize / 1024)} KB</span>
                      <button onclick="window.app.handleDeleteAttachment('${att.id}', '${issue.id}')" class="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                      </button>
                    </div>
                    <span class="font-bold text-slate-900 block truncate text-xs">${att.fileName}</span>
                    <div class="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span>${att.relativeTime}</span>
                      <button onclick="window.app.openFilePreviewModal('${att.id}')" class="text-indigo-600 hover:underline font-bold cursor-pointer">View / Download</button>
                    </div>
                  </div>
                `).join("")}
              </div>
            ` : `
              <div class="p-4 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                No files uploaded yet. Drag and drop logs, recordings, or screenshots.
              </div>
            `}
          </div>

        </div>
      `;
    }

    // 4. QA VERIFICATION ATTEMPTS TAB
    if (tab === "qa_history") {
      const verifications = store.getQaVerifications ? store.getQaVerifications(issue.id) : [];

      return `
        <div class="space-y-3">
          ${verifications.length > 0 ? verifications.map(v => `
            <div class="p-4 bg-white rounded-2xl border-2 ${
              v.result === 'PASS' ? 'border-emerald-200 bg-emerald-50/20' :
              v.result === 'FAIL' ? 'border-red-200 bg-red-50/20' :
              'border-amber-200 bg-amber-50/20'
            } shadow-xs space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                    v.result === 'PASS' ? 'bg-emerald-600 text-white' :
                    v.result === 'FAIL' ? 'bg-red-600 text-white' :
                    'bg-amber-500 text-white'
                  }">
                    Attempt #${v.attemptNumber}: ${v.result}
                  </span>
                  <span class="text-slate-500 font-semibold text-xs">by <strong>${v.qaUser?.name}</strong></span>
                </div>
                <span class="text-[10px] font-mono text-slate-400">${v.relativeTime || v.createdAt}</span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <div><span class="text-slate-400 font-semibold">Environment:</span> <strong>${v.environment}</strong></div>
                <div><span class="text-slate-400 font-semibold">Build:</span> <strong class="font-mono">${v.buildVersion}</strong></div>
              </div>

              ${v.failureReason ? `
                <div class="p-2 bg-red-50 rounded-lg text-red-900 text-xs font-semibold">
                  <span>Defect Reason:</span> ${v.failureReason}
                </div>
              ` : ''}

              ${v.notes ? `
                <div class="p-2 bg-slate-50 rounded-lg text-slate-700 text-xs leading-relaxed">
                  <span>Notes:</span> ${v.notes}
                </div>
              ` : ''}
            </div>
          `).join("") : `
            <div class="p-6 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No historical verification cycles recorded for this issue.
            </div>
          `}
        </div>
      `;
    }

    return "";
  }

  handleWorkflowTransitionSelect(issueId, newStatus) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;
    if (issue.status === newStatus) return;

    let verdict = null;
    const s = (newStatus || '').toLowerCase();
    if (s.includes('done') || s.includes('closed') || s.includes('verified')) verdict = 'PASS';
    else if (s.includes('reopen') || s.includes('fail')) verdict = 'FAIL';
    else if (s.includes('block')) verdict = 'BLOCKED';
    else if (s.includes('ready')) verdict = 'DEV_READY';
    else if (s.includes('qa') || s.includes('test')) verdict = 'RETEST';
    else if (s.includes('progress') || s.includes('dev')) verdict = 'IN_PROGRESS';
    else verdict = 'TODO';

    this.openWorkflowTransitionModal(issueId, newStatus, false, verdict);
  }

  openWorkflowTransitionModal(issueId, targetStatus, fromBoard = false, verdictType = null) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;

    const project = store.getProjectById(issue.projectId || issue.project_id) || store.getActiveProject();
    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    
    // Initialize transition state
    this._pendingTransitionFiles = [];
    this._activeTransitionIssueId = issue.id;
    this._activeTransitionTargetStatus = targetStatus;

    let currentVerdict = verdictType;
    if (!currentVerdict) {
      const s = (targetStatus || '').toLowerCase();
      if (s.includes('done') || s.includes('closed')) currentVerdict = 'PASS';
      else if (s.includes('reopen') || s.includes('fail')) currentVerdict = 'FAIL';
      else if (s.includes('block')) currentVerdict = 'BLOCKED';
      else if (s.includes('ready')) currentVerdict = 'DEV_READY';
      else if (s.includes('qa') || s.includes('test')) currentVerdict = 'RETEST';
      else if (s.includes('progress') || s.includes('dev')) currentVerdict = 'IN_PROGRESS';
      else currentVerdict = 'TODO';
    }
    this._activeTransitionVerdict = currentVerdict;

    let container = document.getElementById("globalModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "globalModalContainer";
      document.body.appendChild(container);
    }

    // Clipboard paste listener for direct screenshot paste
    if (this._clipboardPasteHandler) {
      document.removeEventListener('paste', this._clipboardPasteHandler);
    }
    this._clipboardPasteHandler = (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const pastedFile = new File([blob], `pasted_proof_${Date.now()}.png`, { type: blob.type });
            if (!this._pendingTransitionFiles) this._pendingTransitionFiles = [];
            this._pendingTransitionFiles.push(pastedFile);
            this.renderTransitionFilesTray();
            if (window.app && window.app.toast) window.app.toast("Screenshot Attached", "Pasted image from clipboard added to verification proof.", "success");
          }
        }
      }
    };
    document.addEventListener('paste', this._clipboardPasteHandler);

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-70 flex items-center justify-center p-3 sm:p-4 animate-fade-in" onclick="if(event.target===this) window.app.closeWorkflowTransitionModal('${issue.id}')">
        <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-xs animate-scale-up">
          
          <!-- =====================================================================
               1. HEADER: ISSUE IDENTITY & WORKFLOW PROGRESSION PATH
               ===================================================================== -->
          <div class="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-slate-950 text-[#bef264] flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-2xs">
                ${issue.key.split('-')[0] || 'QA'}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-extrabold text-slate-950 text-xs">${issue.key}</span>
                  <span class="text-slate-400">&bull;</span>
                  <span class="text-slate-600 font-semibold truncate max-w-[280px] sm:max-w-md">${issue.title}</span>
                </div>
                <!-- Status Progression Pill -->
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-bold text-[10px] uppercase">${issue.status || 'Open'}</span>
                  <i data-lucide="arrow-right" class="w-3 h-3 text-slate-400"></i>
                  <span class="px-2.5 py-0.5 rounded-md bg-[#bef264] text-slate-950 font-black text-[10px] uppercase shadow-2xs border border-[#a3e635]">
                    ${targetStatus}
                  </span>
                </div>
              </div>
            </div>

            <button onclick="window.app.closeWorkflowTransitionModal('${issue.id}')" class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer shrink-0" title="Close">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- =====================================================================
               2. SCROLLABLE FORM: VERDICTS, MANDATORY RATIONALE, PROOF & CONTEXT
               ===================================================================== -->
          <div class="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">

            <!-- Verdict Segmented Bar -->
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Verdict / Intent</label>
              <div class="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/90 font-bold text-[11px] text-center" id="verdictTabsContainer">
                <button type="button" onclick="window.app.setTransitionVerdict('PASS')" class="verdict-btn py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${this._activeTransitionVerdict === 'PASS' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'}">
                  <span>PASS ✓</span>
                </button>
                <button type="button" onclick="window.app.setTransitionVerdict('FAIL')" class="verdict-btn py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${this._activeTransitionVerdict === 'FAIL' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'}">
                  <span>FAIL ✗</span>
                </button>
                <button type="button" onclick="window.app.setTransitionVerdict('BLOCKED')" class="verdict-btn py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${this._activeTransitionVerdict === 'BLOCKED' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'}">
                  <span>BLOCK ⚠</span>
                </button>
                <button type="button" onclick="window.app.setTransitionVerdict('RETEST')" class="verdict-btn py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${this._activeTransitionVerdict === 'RETEST' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'}">
                  <span>RETEST 🔄</span>
                </button>
                <button type="button" onclick="window.app.setTransitionVerdict('DEV_READY')" class="verdict-btn py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${this._activeTransitionVerdict === 'DEV_READY' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'}">
                  <span>FIXED 🛠️</span>
                </button>
                <button type="button" onclick="window.app.setTransitionVerdict('IN_PROGRESS')" class="verdict-btn py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${this._activeTransitionVerdict === 'IN_PROGRESS' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'}">
                  <span>IN DEV ⏳</span>
                </button>
              </div>
            </div>

            <!-- Execution Environment & Build Target -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/90">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Execution Environment *</label>
                <select id="transEnvInput" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none cursor-pointer">
                  <option value="Staging" ${issue.environment === 'Staging' ? 'selected' : ''}>🔬 Staging Lab</option>
                  <option value="Production" ${issue.environment === 'Production' ? 'selected' : ''}>🚀 Production Cluster</option>
                  <option value="UAT" ${issue.environment === 'UAT' ? 'selected' : ''}>👥 UAT / Client Sandbox</option>
                  <option value="QA Lab" ${issue.environment === 'QA Lab' ? 'selected' : ''}>🛡️ QA Dedicated Lab</option>
                  <option value="Development" ${issue.environment === 'Development' ? 'selected' : ''}>💻 Dev Sandbox</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Build / Version *</label>
                <input type="text" id="transBuildInput" value="${issue.buildVersion || project?.build_version || 'v2.4.1'}" placeholder="e.g. v2.4.1-rc3" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
            </div>

            <!-- Mandatory Verification Rationale & Comment Section -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <span>Verification Remarks & Action Comment</span>
                  <span class="text-rose-600 font-black text-sm leading-none">*</span>
                  <span class="text-slate-400 font-normal lowercase">(required to save status)</span>
                </label>
                <span id="transNotesCharCount" class="text-[10px] font-mono text-slate-400">0 chars</span>
              </div>

              <textarea 
                id="transNotesInput" 
                rows="3" 
                required
                oninput="document.getElementById('transNotesCharCount').textContent = this.value.length + ' chars'"
                placeholder="${
                  this._activeTransitionVerdict === 'PASS' ? 'Describe the verification steps executed, test suite results, and confirmation of acceptance criteria...' :
                  this._activeTransitionVerdict === 'FAIL' ? 'Detail the steps taken, exact discrepancy observed, and reason this issue failed verification...' :
                  this._activeTransitionVerdict === 'BLOCKED' ? 'Explain what blocker or dependency is preventing verification on target build...' :
                  'Provide detailed transition notes, fix description, or testing instructions...'
                }"
                class="w-full p-3 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none leading-relaxed"
              ></textarea>

              <!-- Rapid Snippet Chips -->
              <div class="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                <span class="text-slate-400 font-bold uppercase">Quick Snippets:</span>
                <button type="button" onclick="window.app.insertTransitionSnippet('All acceptance criteria & edge cases verified on Staging.')" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium cursor-pointer">+ Smoke Passed</button>
                <button type="button" onclick="window.app.insertTransitionSnippet('Regression suite executed clean with zero regressions.')" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium cursor-pointer">+ Regression Clean</button>
                <button type="button" onclick="window.app.insertTransitionSnippet('Root-cause fix implemented and verified in local build.')" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium cursor-pointer">+ Fix Delivered</button>
                <button type="button" onclick="window.app.insertTransitionSnippet('Defect consistently reproduced with attached trace log.')" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium cursor-pointer">+ Repro Confirmed</button>
              </div>
            </div>

            <!-- Defect / Blocker Specifics Container (Reactive) -->
            <div id="transDefectFieldsContainer" class="${this._activeTransitionVerdict === 'FAIL' || this._activeTransitionVerdict === 'BLOCKED' || targetStatus === 'Reopened' ? 'block' : 'hidden'} p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-3">
              <div class="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
                <i data-lucide="alert-octagon" class="w-4 h-4 text-rose-600"></i>
                <span id="transDefectHeaderTitle">${this._activeTransitionVerdict === 'BLOCKED' ? 'Blocker Specification' : 'Defect Failure Specification'}</span>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  <span>${this._activeTransitionVerdict === 'BLOCKED' ? 'Blocker Reason / Summary *' : 'Failure Reason / Root Discrepancy *'}</span>
                </label>
                <input type="text" id="transFailureReasonInput" placeholder="e.g. Calculation returns NaN when discount rate exceeds total order line" class="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-400 focus:outline-none" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Expected Behavior</label>
                  <textarea id="transExpectedResultInput" rows="2" placeholder="What was expected..." class="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-400 focus:outline-none">${issue.expectedResult || ''}</textarea>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Observed Actual Behavior *</label>
                  <textarea id="transActualResultInput" rows="2" placeholder="What actually occurred..." class="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-400 focus:outline-none">${issue.actualResult || ''}</textarea>
                </div>
              </div>
            </div>

            <!-- Proof & Evidence Hub (Video Link, Screen Recording, Files Dropzone) -->
            <div class="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="paperclip" class="w-4 h-4 text-purple-600"></i> Verification Proof & Attachments
                </span>
                <span class="text-[10px] text-slate-400">Links, Videos, Screenshots & Logs</span>
              </div>

              <!-- Proof Link / Video Recording URL Input -->
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Proof Link / Video Recording URL</label>
                <div class="relative flex items-center">
                  <input 
                    type="url" 
                    id="transProofUrlInput" 
                    oninput="window.app.handleProofUrlChange(this.value)"
                    placeholder="e.g. Loom video link, Google Drive recording, YouTube, Pull Request URL..." 
                    class="w-full pl-9 pr-32 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none truncate" 
                  />
                  <i data-lucide="link" class="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none"></i>
                  <div id="transProofUrlBadge" class="absolute right-2 hidden items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    <span>Link</span>
                  </div>
                </div>
              </div>

              <!-- Media Dropzone & File Browser -->
              <div>
                <div 
                  id="transDropZone"
                  ondragover="event.preventDefault(); this.classList.add('border-[#84cc16]', 'bg-[#f7fee7]/50');"
                  ondragleave="this.classList.remove('border-[#84cc16]', 'bg-[#f7fee7]/50');"
                  ondrop="event.preventDefault(); this.classList.remove('border-[#84cc16]', 'bg-[#f7fee7]/50'); window.app.handleTransitionDrop(event);"
                  onclick="document.getElementById('transFileInput').click()"
                  class="border-2 border-dashed border-slate-300 hover:border-[#84cc16] hover:bg-[#f7fee7]/30 rounded-2xl p-4 text-center transition cursor-pointer bg-white group space-y-1.5"
                >
                  <input 
                    type="file" 
                    id="transFileInput" 
                    multiple 
                    onchange="window.app.handleTransitionFileSelect(this)" 
                    class="hidden" 
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt,.json,.log,.zip" 
                  />
                  
                  <div class="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-2xs">
                    <i data-lucide="upload-cloud" class="w-5 h-5"></i>
                  </div>
                  
                  <div>
                    <span class="font-bold text-slate-800 text-xs">Click to browse files or drag & drop</span>
                    <p class="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, MP4, WebM, PDF, logs • Or press <kbd class="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-slate-700">Ctrl+V</kbd> to paste screenshot</p>
                  </div>
                </div>
              </div>

              <!-- Live Attached Files Tray -->
              <div id="transFilesTrayContainer" class="space-y-1.5">
                <!-- Dynamically populated -->
              </div>
            </div>

            <!-- Automated Synchronizations -->
            <div class="pt-1 flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-600">
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" id="transAutoCommentCheck" checked class="rounded text-[#84cc16] focus:ring-[#bef264]/50 cursor-pointer" />
                <span>Post note & proof to ticket comments stream</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" id="transAutoEvidenceCheck" checked class="rounded text-purple-600 focus:ring-purple-400 cursor-pointer" />
                <span>Store in Evidence & Attachments library</span>
              </label>
            </div>

          </div>

          <!-- =====================================================================
               3. FOOTER: CANCEL & SAVE BUTTONS WITH FEEDBACK
               ===================================================================== -->
          <div class="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            <button 
              type="button" 
              onclick="window.app.closeWorkflowTransitionModal('${issue.id}')" 
              class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold border border-slate-300 shadow-2xs transition cursor-pointer text-xs"
            >
              Cancel
            </button>

            <button 
              type="button" 
              id="confirmTransitionBtn"
              onclick="window.app.submitWorkflowTransitionModal('${issue.id}', '${targetStatus}', '${this._activeTransitionVerdict || ''}', ${fromBoard})" 
              class="px-6 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-black shadow-xs shadow-[#bef264]/40 transition flex items-center gap-2 cursor-pointer text-xs group"
            >
              <i data-lucide="check-circle" class="w-4 h-4 font-bold text-slate-950 group-hover:scale-110 transition-transform"></i>
              <span>Confirm & Save Status</span>
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  closeWorkflowTransitionModal(issueId) {
    if (this._clipboardPasteHandler) {
      document.removeEventListener('paste', this._clipboardPasteHandler);
      this._clipboardPasteHandler = null;
    }
    this._pendingTransitionFiles = [];
    const container = document.getElementById("globalModalContainer");
    if (container) container.innerHTML = "";

    // Reset workflow select dropdown if drawer is open
    const issue = store.getIssueById(issueId);
    if (issue) {
      const select = document.querySelector("#globalDrawerContainer select");
      if (select && issue.status) {
        select.value = issue.status;
      }
    }
  }

  setTransitionVerdict(verdictType) {
    this._activeTransitionVerdict = verdictType;
    const defectFields = document.getElementById("transDefectFieldsContainer");
    const defectTitle = document.getElementById("transDefectHeaderTitle");
    const notesInput = document.getElementById("transNotesInput");

    // Update tab styling
    const tabs = document.querySelectorAll("#verdictTabsContainer .verdict-btn");
    tabs.forEach(btn => {
      btn.className = "verdict-btn py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 text-slate-600 hover:bg-white/60";
    });

    if (defectFields) {
      if (verdictType === "FAIL" || verdictType === "BLOCKED") {
        defectFields.classList.remove("hidden");
        defectFields.classList.add("block");
        if (defectTitle) defectTitle.textContent = verdictType === "BLOCKED" ? "Blocker Specification" : "Defect Failure Specification";
      } else {
        defectFields.classList.add("hidden");
        defectFields.classList.remove("block");
      }
    }

    if (notesInput && !notesInput.value.trim()) {
      if (verdictType === 'PASS') notesInput.placeholder = "Describe the verification steps executed, test suite results, and confirmation of acceptance criteria...";
      else if (verdictType === 'FAIL') notesInput.placeholder = "Detail the steps taken, exact discrepancy observed, and reason this issue failed verification...";
      else if (verdictType === 'BLOCKED') notesInput.placeholder = "Explain what blocker or dependency is preventing verification on target build...";
      else notesInput.placeholder = "Provide detailed transition notes, fix description, or testing instructions...";
    }
  }

  handleProofUrlChange(url) {
    const badge = document.getElementById("transProofUrlBadge");
    if (!badge) return;
    const clean = (url || '').trim().toLowerCase();

    if (!clean) {
      badge.className = "absolute right-2 hidden";
      return;
    }

    badge.className = "absolute right-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase shadow-2xs ";

    if (clean.includes("loom.com")) {
      badge.className += "bg-purple-100 text-purple-800 border border-purple-200";
      badge.innerHTML = "🎥 Loom Video";
    } else if (clean.includes("drive.google.com")) {
      badge.className += "bg-amber-100 text-amber-800 border border-amber-200";
      badge.innerHTML = "📁 Google Drive";
    } else if (clean.includes("youtube.com") || clean.includes("youtu.be")) {
      badge.className += "bg-red-100 text-red-800 border border-red-200";
      badge.innerHTML = "▶️ YouTube";
    } else if (clean.includes("vimeo.com")) {
      badge.className += "bg-sky-100 text-sky-800 border border-sky-200";
      badge.innerHTML = "🎬 Vimeo";
    } else if (clean.includes("github.com") || clean.includes("gitlab.com")) {
      badge.className += "bg-slate-900 text-white border border-slate-800";
      badge.innerHTML = "🐙 Git PR / Commit";
    } else if (clean.includes("atlassian.net") || clean.includes("jira")) {
      badge.className += "bg-blue-100 text-blue-800 border border-blue-200";
      badge.innerHTML = "🔷 Jira Link";
    } else {
      badge.className += "bg-emerald-100 text-emerald-800 border border-emerald-200";
      badge.innerHTML = "🔗 Verified Link";
    }
  }

  handleTransitionFileSelect(input) {
    if (!input || !input.files) return;
    if (!this._pendingTransitionFiles) this._pendingTransitionFiles = [];
    for (let i = 0; i < input.files.length; i++) {
      this._pendingTransitionFiles.push(input.files[i]);
    }
    this.renderTransitionFilesTray();
  }

  handleTransitionDrop(e) {
    if (!e.dataTransfer || !e.dataTransfer.files) return;
    if (!this._pendingTransitionFiles) this._pendingTransitionFiles = [];
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      this._pendingTransitionFiles.push(e.dataTransfer.files[i]);
    }
    this.renderTransitionFilesTray();
  }

  removeTransitionFile(idx) {
    if (!this._pendingTransitionFiles) return;
    this._pendingTransitionFiles.splice(idx, 1);
    this.renderTransitionFilesTray();
  }

  insertTransitionSnippet(text) {
    const input = document.getElementById("transNotesInput");
    if (!input) return;
    input.value = input.value ? `${input.value.trim()}\n${text}` : text;
    const charCounter = document.getElementById("transNotesCharCount");
    if (charCounter) charCounter.textContent = input.value.length + " chars";
    input.focus();
  }

  renderTransitionFilesTray() {
    const tray = document.getElementById("transFilesTrayContainer");
    if (!tray) return;

    if (!this._pendingTransitionFiles || this._pendingTransitionFiles.length === 0) {
      tray.innerHTML = "";
      return;
    }

    tray.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        ${this._pendingTransitionFiles.map((file, idx) => {
          const isImg = file.type && file.type.startsWith('image');
          const isVid = file.type && file.type.startsWith('video');
          const sizeKb = Math.round(file.size / 1024);
          return `
            <div class="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-7 h-7 rounded-lg ${isImg ? 'bg-emerald-50 text-emerald-600' : isVid ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'} flex items-center justify-center shrink-0">
                  <i data-lucide="${isImg ? 'image' : isVid ? 'film' : 'file-text'}" class="w-3.5 h-3.5"></i>
                </div>
                <div class="min-w-0">
                  <span class="font-bold text-slate-800 truncate block text-[11px]">${file.name}</span>
                  <span class="text-[9px] text-slate-400 font-mono">${sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb + ' KB'}</span>
                </div>
              </div>
              <button type="button" onclick="window.app.removeTransitionFile(${idx})" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer" title="Remove file">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  async submitWorkflowTransitionModal(issueId, targetStatus, verdictType, fromBoard) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;

    const buildVersion = document.getElementById("transBuildInput")?.value?.trim() || "v2.4.1";
    const notes = document.getElementById("transNotesInput")?.value?.trim() || "";
    const failureReason = document.getElementById("transFailureReasonInput")?.value?.trim() || "";
    const actualResult = document.getElementById("transActualResultInput")?.value?.trim() || "";
    const expectedResult = document.getElementById("transExpectedResultInput")?.value?.trim() || "";
    const environment = document.getElementById("transEnvInput")?.value || "Staging";
    const proofUrl = document.getElementById("transProofUrlInput")?.value?.trim() || "";
    const autoComment = document.getElementById("transAutoCommentCheck")?.checked !== false;
    const autoEvidence = document.getElementById("transAutoEvidenceCheck")?.checked !== false;
    const activeUser = store.getActiveUser ? store.getActiveUser() : null;

    const activeVerdict = this._activeTransitionVerdict || verdictType || (targetStatus === 'Done' ? 'PASS' : (targetStatus === 'Reopened' ? 'FAIL' : 'PASS'));

    // 1. MANDATORY VALIDATION
    if (!notes) {
      const notesEl = document.getElementById("transNotesInput");
      if (notesEl) {
        notesEl.classList.add("ring-2", "ring-rose-500", "border-rose-500");
        notesEl.focus();
      }
      this.toast("Verification Note Required", "Please provide remarks or rationale explaining this status transition.", "error");
      return;
    }

    if ((activeVerdict === "FAIL" || targetStatus === "Reopened") && (!failureReason || !actualResult)) {
      this.toast("Defect Details Required", "Please provide both the Failure Reason and Observed Actual Behavior for defects.", "error");
      return;
    }

    if (activeVerdict === "BLOCKED" && !failureReason) {
      this.toast("Blocker Reason Required", "Please provide the category or reason blocking this verification.", "error");
      return;
    }

    // 2. RECORD QA VERIFICATION ATTEMPT (If QA sign-off verdict)
    if (activeVerdict === "PASS") {
      await store.recordQaVerificationAttempt(issueId, {
        result: "PASS",
        notes,
        environment,
        buildVersion
      });
    } else if (activeVerdict === "FAIL" || targetStatus === "Reopened") {
      await store.recordQaVerificationAttempt(issueId, {
        result: "FAIL",
        failureReason,
        expectedResult,
        actualResult,
        notes,
        environment,
        buildVersion
      });
    } else if (activeVerdict === "BLOCKED") {
      await store.recordQaVerificationAttempt(issueId, {
        result: "BLOCKED",
        failureReason,
        notes,
        environment,
        buildVersion
      });
    } else if (activeVerdict === "RETEST") {
      await store.recordQaVerificationAttempt(issueId, {
        result: "RETEST",
        notes,
        environment,
        buildVersion
      });
    } else {
      await store.executeWorkflowTransition(issueId, targetStatus, {
        developerNotes: notes,
        buildVersion,
        environment
      });
    }

    // 3. UPLOAD ALL ATTACHED FILES
    const uploadedAttachments = [];
    if (this._pendingTransitionFiles && this._pendingTransitionFiles.length > 0) {
      for (const file of this._pendingTransitionFiles) {
        const uploadRes = await store.uploadIssueAttachment(issueId, {
          fileName: file.name,
          fileData: file,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size || 1024,
          isQaEvidence: autoEvidence,
          qaMeta: { environment, buildVersion, result: activeVerdict }
        });
        if (uploadRes && uploadRes.attachment) {
          uploadedAttachments.push(uploadRes.attachment);
        }
      }
    }

    // 4. PERSIST PROOF URL INTO ISSUE RECORD
    if (proofUrl) {
      if (!issue.evidenceUrls) issue.evidenceUrls = [];
      if (!issue.evidenceUrls.includes(proofUrl)) {
        issue.evidenceUrls.unshift(proofUrl);
      }
      issue.proofLink = proofUrl;
      store.saveState();
    }

    // 5. AUTOMATICALLY POST DETAILED COMMENT WITH VERDICT & PROOF
    if (autoComment) {
      const verdictBadge = activeVerdict === 'PASS' ? '✅ **QA VERIFICATION PASSED**' :
                           activeVerdict === 'FAIL' ? '💥 **QA VERIFICATION FAILED / DEFECT REOPENED**' :
                           activeVerdict === 'BLOCKED' ? '⚠️ **TESTING BLOCKED**' :
                           activeVerdict === 'DEV_READY' ? '🛠️ **DEVELOPER FIX DELIVERED (READY FOR QA)**' :
                           `🔄 **STATUS UPDATED TO "${targetStatus}"**`;

      let commentBody = `${verdictBadge}\n\n${notes}\n\n**Environment:** \`${environment}\` &bull; **Build:** \`${buildVersion}\``;
      
      if (proofUrl) {
        commentBody += `\n\n🔗 **Verification Proof / Video:** [${proofUrl}](${proofUrl})`;
      }

      if (uploadedAttachments.length > 0) {
        commentBody += `\n\n📎 **Attached Evidence (${uploadedAttachments.length} file${uploadedAttachments.length > 1 ? 's' : ''}):**\n` + 
          uploadedAttachments.map(a => `- \`${a.file_name || a.fileName}\` (${Math.round((a.file_size || a.fileSize || 1024) / 1024)} KB)`).join('\n');
      }

      store.addIssueComment(issueId, { text: commentBody });
    }

    // 6. RECORD AUDIT EVENT
    store.recordIssueActivity(issueId, 'status_transition', {
      fromStatus: issue.status,
      toStatus: targetStatus,
      verdict: activeVerdict,
      notes,
      proofUrl,
      environment,
      buildVersion
    });

    // Clean up clipboard listener & close modal
    if (this._clipboardPasteHandler) {
      document.removeEventListener('paste', this._clipboardPasteHandler);
      this._clipboardPasteHandler = null;
    }
    this._pendingTransitionFiles = [];
    const modalContainer = document.getElementById("globalModalContainer");
    if (modalContainer) modalContainer.innerHTML = "";

    this.toast("Status & Quality Verified", `${issue.key} successfully transitioned to "${targetStatus}".`, "success");

    // 7. RE-RENDER OPEN DRAWER & PARENT VIEWS
    this.openIssueDetails(issueId);
    if (this.currentView === "project-workspace" && typeof ProjectWorkspaceView !== 'undefined') {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "all-issues" && typeof AllIssuesView !== 'undefined') {
      AllIssuesView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "my-issues" && typeof MyIssuesView !== 'undefined') {
      MyIssuesView.render(document.getElementById("mainContent"));
    }
  }

  openFilePreviewModal(attachmentId) {
    const attach = (store.data.issueAttachments || []).find(a => a.id === attachmentId);
    if (!attach) return;

    let container = document.getElementById("globalModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "globalModalContainer";
      document.body.appendChild(container);
    }

    const mime = attach.mime_type || attach.mimeType || "";
    const isImage = mime.includes("image");
    const isVideo = mime.includes("video");

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-70 flex items-center justify-center p-4 animate-fade-in" onclick="if(event.target===this) document.getElementById('globalModalContainer').innerHTML=''">
        <div class="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3 flex flex-col max-h-[90vh]">
          
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <span class="font-bold text-slate-900 text-sm truncate">${attach.file_name || attach.fileName}</span>
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="flex-1 overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-4 min-h-[280px]">
            ${isImage ? `
              <img src="${attach.storage_path || ''}" alt="Attachment" class="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f1f5f9%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2212%22 fill=%22%2394a3b8%22>Preview Image</text></svg>';" />
            ` : isVideo ? `
              <video controls class="max-h-[60vh] max-w-full rounded-lg shadow-md">
                <source src="${attach.storage_path || ''}" type="${mime}">
                Your browser does not support video preview.
              </video>
            ` : `
              <div class="text-center p-8 space-y-2">
                <i data-lucide="file-text" class="w-12 h-12 text-slate-400 mx-auto"></i>
                <span class="font-bold text-slate-800 block">${attach.file_name || attach.fileName}</span>
                <span class="text-slate-400 text-xs">${Math.round((attach.file_size || attach.fileSize || 1024) / 1024)} KB</span>
              </div>
            `}
          </div>

          <div class="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span class="text-slate-400 text-[11px]">Storage: ${attach.storage_path || 'local'}</span>
            <button onclick="window.app.showToast('Download Started', 'Downloading ${attach.file_name || attach.fileName}', 'info')" class="px-4 py-2 bg-slate-950 text-[#bef264] font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="download" class="w-3.5 h-3.5"></i> Download
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  openLinkWorkItemModal(issueId) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;
    const project = store.getProjectById(issue.projectId || issue.project_id);
    const issues = (store.getIssues(project?.id) || []).filter(i => i.id !== issue.id);

    let container = document.getElementById("globalModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "globalModalContainer";
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-70 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3.5">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 class="text-sm font-bold text-slate-900">Link Work Item to ${issue.key}</h3>
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-4 h-4"></i></button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block font-bold text-slate-700 text-xs mb-1">Relationship Type</label>
              <select id="linkRelType" class="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold">
                <option value="Relates To">Relates To</option>
                <option value="Blocks">Blocks (This blocks target)</option>
                <option value="Blocked By">Blocked By (Target blocks this)</option>
                <option value="Parent">Parent Story</option>
                <option value="Child">Child Subtask</option>
                <option value="Duplicate">Duplicate Of</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 text-xs mb-1">Target Work Item</label>
              <select id="linkTargetIssueId" class="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs">
                ${issues.map(i => `<option value="${i.id}">${i.key} — ${i.title}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
            <button onclick="window.app.submitLinkWorkItem('${issue.id}')" class="px-4 py-1.5 bg-[#bef264] text-slate-950 font-bold rounded-xl shadow-2xs cursor-pointer">Link Item</button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  async submitLinkWorkItem(issueId) {
    const relType = document.getElementById("linkRelType")?.value || "Relates To";
    const targetId = document.getElementById("linkTargetIssueId")?.value;
    if (targetId) {
      await store.addIssueRelationship(issueId, targetId, relType);
      document.getElementById("globalModalContainer").innerHTML = "";
      this.openIssueDetails(issueId);
    }
  }

  handleWorkflowTransition(issueId, targetStatus) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;

    // Check if this transition requires additional details
    if (targetStatus === 'Ready for QA' || targetStatus === 'Done' || targetStatus === 'Reopened') {
      this.openWorkflowTransitionModal(issueId, targetStatus);
    } else {
      store.updateIssueStatus(issueId, targetStatus);
      this.openIssueDetails(issueId);
      if (this.currentView === "project-workspace" && typeof ProjectWorkspaceView !== 'undefined') {
        ProjectWorkspaceView.render(document.getElementById("mainContent"));
      }
    }
  }

  handleUpdateTitle(issueId, newTitle) {
    if (!newTitle.trim()) return;
    store.updateIssue(issueId, { title: newTitle.trim() });
    this.showInlineSaved();
  }

  handleUpdateDescription(issueId, newDesc) {
    store.updateIssue(issueId, { description: newDesc.trim() });
    this.showInlineSaved();
  }

  handleInlineFieldUpdate(issueId, field, val) {
    const update = {};
    update[field] = val;
    if (field === 'dueDate') update.due_date = val;
    if (field === 'due_date') update.dueDate = val;
    store.updateIssue(issueId, update);
    this.showInlineSaved();
    if (this.currentView === "project-workspace" && typeof ProjectWorkspaceView !== 'undefined') {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    }
  }

  showInlineSaved() {
    const ind = document.getElementById("inlineSaveIndicator");
    if (ind) {
      ind.classList.remove("hidden");
      ind.classList.add("flex");
      setTimeout(() => {
        ind.classList.add("hidden");
        ind.classList.remove("flex");
      }, 1500);
    }
  }

  handleAssignDeveloper(issueId, devId) {
    store.updateIssue(issueId, { developerId: devId, assigneeId: devId });
    this.openIssueDetails(issueId);
  }

  handleAssignQA(issueId, qaId) {
    store.updateIssue(issueId, { qaId });
    this.openIssueDetails(issueId);
  }

  handleUpdateEnvironment(issueId, env) {
    store.updateIssue(issueId, { environment: env });
    this.openIssueDetails(issueId);
  }

  handleUpdatePriority(issueId, priority) {
    store.updateIssue(issueId, { priority });
    this.openIssueDetails(issueId);
  }

  handleUpdateSprint(issueId, sprintId) {
    store.moveIssueToSprint(issueId, sprintId || null);
    this.openIssueDetails(issueId);
  }

  handleToggleAcceptanceCriteria(issueId, index) {
    const issue = store.getIssueById(issueId);
    if (issue && issue.acceptanceCriteria && issue.acceptanceCriteria[index]) {
      issue.acceptanceCriteria[index].done = !issue.acceptanceCriteria[index].done;
      store.saveState();
      this.openIssueDetails(issueId);
    }
  }

  handleAddLabel(issueId) {
    const input = document.getElementById("newLabelInput");
    if (!input || !input.value.trim()) return;
    const issue = store.getIssueById(issueId);
    if (!issue) return;
    if (!issue.labels) issue.labels = [];
    if (!issue.labels.includes(input.value.trim())) {
      issue.labels.push(input.value.trim());
      store.saveState();
      this.openIssueDetails(issueId);
    }
  }

  handleRemoveLabel(issueId, label) {
    const issue = store.getIssueById(issueId);
    if (issue && issue.labels) {
      issue.labels = issue.labels.filter(l => l !== label);
      store.saveState();
      this.openIssueDetails(issueId);
    }
  }

  handleToggleWatcher(issueId) {
    store.toggleIssueWatcher(issueId);
    this.openIssueDetails(issueId);
  }

  handleCopyIssueLink(issueKey) {
    navigator.clipboard?.writeText(window.location.origin + "#" + issueKey);
    this.showToast("Link Copied", `Copied link for ${issueKey}`, "success");
  }

  toggleIssueMoreMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById("issueMoreMenuDropdown");
    if (menu) menu.classList.toggle("hidden");
  }

  handleDeleteIssue(issueId) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;
    if (confirm(`Are you sure you want to delete ${issue.key}? This action is auditable and will archive associated records.`)) {
      store.data.issues = store.data.issues.filter(i => i.id !== issueId);
      store.saveState();
      this.closeIssueDetails();
      this.showToast("Issue Deleted", `${issue.key} was deleted.`, "info");
      if (this.currentView === "project-workspace" && typeof ProjectWorkspaceView !== 'undefined') {
        ProjectWorkspaceView.render(document.getElementById("mainContent"));
      }
    }
  }

  handleCloneIssue(issueId) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;
    store.createIssue({
      ...issue,
      id: null,
      key: null,
      title: `[Clone] ${issue.title}`,
      status: "Backlog"
    });
    this.showToast("Issue Cloned", `Cloned copy of ${issue.key} created in Backlog.`, "success");
    this.closeIssueDetails();
    if (this.currentView === "project-workspace" && typeof ProjectWorkspaceView !== 'undefined') {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    }
  }

  handleAddComment(issueId, parentCommentId = null) {
    let text = "";
    if (parentCommentId) {
      const input = document.getElementById(`replyInput_${parentCommentId}`);
      text = input ? input.value : "";
    } else {
      const input = document.getElementById("issueMainCommentInput");
      text = input ? input.value : "";
    }

    if (!text.trim()) return;

    // Detect @mentions in text
    const mentions = [];
    const mentionMatches = text.match(/@([a-zA-Z0-9_-]+)/g);
    if (mentionMatches) {
      const users = store.getUsers();
      mentionMatches.forEach(m => {
        const username = m.substring(1).toLowerCase();
        const found = users.find(u => u.name.toLowerCase().includes(username) || u.email.toLowerCase().includes(username));
        if (found) mentions.push(found.id);
      });
    }

    store.addIssueComment(issueId, { text, parentCommentId, mentions });
    this.openIssueDetails(issueId, "comments");
  }

  handleEditComment(commentId, encodedOldBody) {
    const oldBody = unescape(encodedOldBody);
    const newBody = prompt("Edit your comment:", oldBody);
    if (newBody !== null && newBody.trim() && newBody !== oldBody) {
      store.editIssueComment(commentId, newBody);
      const container = document.getElementById("issueActivityTabsContent");
      if (container) this.renderIssueActivityTabsContent(store.data.issues[0]?.id);
    }
  }

  handleDeleteComment(commentId, issueId) {
    if (confirm("Delete this comment?")) {
      store.deleteIssueComment(commentId);
      this.openIssueDetails(issueId, "comments");
    }
  }

  toggleReplyBox(commentId) {
    const box = document.getElementById(`replyBox_${commentId}`);
    if (box) box.classList.toggle("hidden");
  }

  toggleReactionPicker(commentId) {
    const picker = document.getElementById(`reactionPicker_${commentId}`);
    if (picker) picker.classList.toggle("hidden");
  }

  handleReaction(commentId, reaction, issueId) {
    store.toggleCommentReaction(commentId, reaction);
    this.openIssueDetails(issueId, "comments");
  }

  insertMention(issueId) {
    const input = document.getElementById("issueMainCommentInput");
    if (!input) return;
    const project = store.getProjectById(store.getIssueById(issueId)?.projectId);
    const members = project ? (store.getProjectMembers ? store.getProjectMembers(project.id) : store.getUsers()) : store.getUsers();
    if (members.length > 0) {
      const first = members[0].name.split(" ")[0];
      input.value += ` @${first} `;
      input.focus();
    }
  }

  handleCommentFileUpload(issueId, fileInput) {
    const file = fileInput?.files?.[0];
    if (file) {
      store.uploadIssueAttachment(issueId, {
        fileName: file.name,
        fileData: file,
        mimeType: file.type,
        fileSize: file.size,
        isQaEvidence: false
      });
      this.showToast("Attachment Uploaded", `${file.name} uploaded`, "success");
      this.openIssueDetails(issueId, "comments");
    }
  }

  handleEvidenceFileUpload(issueId, fileInput) {
    const file = fileInput?.files?.[0];
    if (file) {
      store.uploadIssueAttachment(issueId, {
        fileName: file.name,
        fileData: file,
        mimeType: file.type,
        fileSize: file.size,
        isQaEvidence: false
      });
      this.showToast("File Uploaded", `${file.name} attached to issue.`, "success");
      this.openIssueDetails(issueId, "evidence");
    }
  }

  handleQaEvidenceUpload(issueId, fileInput) {
    const file = fileInput?.files?.[0];
    if (file) {
      const issue = store.getIssueById(issueId);
      store.uploadIssueAttachment(issueId, {
        fileName: file.name,
        fileData: file,
        mimeType: file.type,
        fileSize: file.size,
        isQaEvidence: true,
        qaMeta: {
          environment: issue?.environment || "Staging",
          buildVersion: issue?.buildVersion || "v2.4.1",
          result: issue?.qaStatus || "PASS"
        }
      });
      this.showToast("Evidence Uploaded", `${file.name} recorded as QA evidence.`, "success");
      this.openIssueDetails(issueId, "evidence");
    }
  }

  handleDeleteAttachment(attachmentId, issueId) {
    if (confirm("Delete this attachment?")) {
      store.deleteIssueAttachment(attachmentId);
      this.openIssueDetails(issueId, "evidence");
    }
  }

  handleAddChecklist(issueId) {
    const title = prompt("Enter Checklist Title:", "QA Verification Steps");
    if (title && title.trim()) {
      store.addIssueChecklist(issueId, title.trim());
      this.openIssueDetails(issueId);
    }
  }

  handleAddChecklistItem(checklistId, issueId) {
    const input = document.getElementById(`newChecklistItemInput_${checklistId}`);
    if (input && input.value.trim()) {
      store.addChecklistItem(checklistId, input.value.trim());
      this.openIssueDetails(issueId);
    }
  }

  handleToggleChecklistItem(itemId, issueId) {
    store.toggleChecklistItem(itemId);
    this.openIssueDetails(issueId);
  }

  handleDeleteChecklistItem(itemId, issueId) {
    store.deleteChecklistItem(itemId);
    this.openIssueDetails(issueId);
  }

  handleRemoveRelationship(relId, issueId) {
    store.removeIssueRelationship(relId);
    this.openIssueDetails(issueId);
  }

  closeIssueDetails() {
    const container = document.getElementById("globalDrawerContainer");
    if (container) container.innerHTML = "";
  }

  async handleQuickStatusChange(issueId, newStatus) {
    await store.updateIssueStatus(issueId, newStatus);
    this.openIssueDetails(issueId);
    if (this.currentView === "project-workspace" && typeof ProjectWorkspaceView !== 'undefined') {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "backlog-sprints" && typeof BacklogSprintsView !== 'undefined') {
      BacklogSprintsView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "my-issues" && typeof MyIssuesView !== 'undefined') {
      MyIssuesView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "all-issues" && typeof AllIssuesView !== 'undefined') {
      AllIssuesView.render(document.getElementById("mainContent"));
    }
  }

  async changeIssueStatus(issueId, newStatus) {
    return this.handleQuickStatusChange(issueId, newStatus);
  }

  openWorkflowTourModal() {
    this.openWorkflowGuideModal();
  }

  openWorkflowGuideModal() {
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
      setTimeout(() => { if (toast && toast.remove) toast.remove(); else if (toast && toast.parentElement) toast.parentElement.removeChild(toast); }, 300);
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
if (typeof global !== 'undefined') {
  global.AppController = AppController;
}
if (typeof window !== 'undefined') {
  window.AppController = AppController;
  window.app = new AppController();
  if (typeof window.addEventListener === 'function') {
    window.addEventListener("DOMContentLoaded", () => {
      window.app.init();
    });
  }
}
