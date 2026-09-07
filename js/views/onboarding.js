/**
 * PulseWave — Workspace Onboarding & Team Setup (V1 / V2)
 * Premium B2B SaaS First-Time User Onboarding Experience
 * Features:
 *  - 00: Welcome to PulseWave (Value propositions & benefits)
 *  - 01: Create Workspace (Slug generator, URL availability, company type, logo upload)
 *  - 02: Create First Project (Key auto-gen, PM dropdown, priority, status, timeline)
 *  - 03: Invite Team Members (Dynamic list, role selector, quick chips, pending badges)
 *  - 04: Workspace Setup Complete (Checklist, executive summary card, direct dashboard entry)
 */

const OnboardingView = {
  state: {
    currentStep: 0, // 0: Welcome, 1: Workspace, 2: Project, 3: Team, 4: Complete
    workspace: {
      name: "",
      company: "",
      slug: "",
      type: "Software Company",
      logo: null,
      logoColor: "bg-slate-900"
    },
    project: {
      name: "",
      key: "",
      client: "",
      pmId: "",
      priority: "P1 High",
      status: "Active",
      startDate: "",
      targetDate: "",
      description: ""
    },
    team: [],
    skippedProject: false,
    skippedTeam: false,
    errors: {}
  },

  async setStep(stepIndex) {
    this.state.currentStep = stepIndex;
    const contentArea = document.getElementById("mainContent");
    if (contentArea) {
      this.render(contentArea);
    }
  },

  render(container) {
    const step = this.state.currentStep;

    container.innerHTML = `
      <div class="min-h-screen relative flex flex-col justify-between font-sans overflow-hidden" style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 45%, #ffffff 100%);">
        
        <!-- Subtle Engineering Dot Matrix Grid -->
        <div class="absolute inset-0 pointer-events-none opacity-35 z-0" style="background-image: radial-gradient(#94a3b8 1.2px, transparent 1.2px); background-size: 24px 24px;"></div>

        <!-- Ambient Multi-Color Glow Blooms -->
        <div class="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(190, 242, 100, 0.4) 0%, rgba(163, 230, 53, 0.2) 50%, transparent 75%);"></div>
        <div class="absolute -bottom-24 -left-24 w-[550px] h-[550px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(186, 230, 253, 0.55) 0%, rgba(125, 211, 252, 0.2) 50%, transparent 75%);"></div>

        <!-- Top Navigation Bar for Onboarding -->
        <header class="relative z-20 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div class="flex items-center gap-3 cursor-pointer" onclick="window.app.navigate('home')">
            <div class="w-7 h-7 grid grid-cols-2 gap-0.5 shadow-2xs">
              <div class="bg-[#84cc16] rounded-xs"></div>
              <div class="bg-slate-950 rounded-xs"></div>
              <div class="bg-slate-950 rounded-xs"></div>
              <div class="bg-slate-950 rounded-xs"></div>
            </div>
            <span class="text-base font-extrabold text-slate-950 tracking-tight">
              PulseWave
            </span>
            <span class="px-2 py-0.5 rounded-full bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] text-[10px] font-bold uppercase tracking-wider">
              Setup Wizard
            </span>
          </div>

          <!-- Quick Actions & Skip Exit -->
          <div class="flex items-center gap-3 text-xs">
            <button onclick="OnboardingView.skipToDashboard()" class="text-slate-500 hover:text-slate-900 font-semibold cursor-pointer transition">
              Exit to Dashboard
            </button>
          </div>
        </header>

        <!-- Main Onboarding Container (Two-Column Layout on Desktop) -->
        <main class="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
          
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- LEFT PANEL: Brand Info, Hierarchy & Visual Progress Checklist (Hidden on small screens, visible on lg) -->
            <div class="lg:col-span-4 space-y-6 text-left">
              
              <!-- Setup Header -->
              <div class="space-y-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">GETTING STARTED</span>
                <h1 class="text-2xl font-black text-slate-950 tracking-tight">
                  Let's get your workspace ready
                </h1>
                <p class="text-xs text-slate-500 font-normal leading-relaxed">
                  Set up your organization, launch your initial QA project, and invite your engineering team.
                </p>
              </div>

              <!-- Interactive Step Progress Indicators -->
              <div class="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3">
                
                <!-- Step 01: Workspace -->
                <div class="flex items-center gap-3 cursor-pointer group" onclick="OnboardingView.setStep(1)">
                  <div class="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition ${
                    step > 1 ? 'bg-emerald-500 text-white' : step === 1 ? 'bg-[#bef264] text-slate-950 font-black shadow-xs ring-2 ring-[#84cc16]/40' : 'bg-slate-100 text-slate-500'
                  }">
                    ${step > 1 ? '✓' : '01'}
                  </div>
                  <div class="flex-1">
                    <div class="text-xs font-bold ${step === 1 ? 'text-slate-950 font-black' : step > 1 ? 'text-emerald-700' : 'text-slate-600'}">
                      Workspace Setup
                    </div>
                    <div class="text-[10px] text-slate-400">Company & organization URL</div>
                  </div>
                  ${step === 1 ? `<span class="w-2 h-2 rounded-full bg-[#84cc16] animate-pulse"></span>` : ''}
                </div>

                <div class="h-px bg-slate-100 ml-3.5"></div>

                <!-- Step 02: Project -->
                <div class="flex items-center gap-3 cursor-pointer group" onclick="OnboardingView.setStep(2)">
                  <div class="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition ${
                    step > 2 ? 'bg-emerald-500 text-white' : step === 2 ? 'bg-[#bef264] text-slate-950 font-black shadow-xs ring-2 ring-[#84cc16]/40' : 'bg-slate-100 text-slate-500'
                  }">
                    ${step > 2 ? '✓' : '02'}
                  </div>
                  <div class="flex-1">
                    <div class="text-xs font-bold ${step === 2 ? 'text-slate-950 font-black' : step > 2 ? 'text-emerald-700' : 'text-slate-600'}">
                      First Project
                    </div>
                    <div class="text-[10px] text-slate-400">Sprints, QA gates & timeline</div>
                  </div>
                  ${step === 2 ? `<span class="w-2 h-2 rounded-full bg-[#84cc16] animate-pulse"></span>` : ''}
                </div>

                <div class="h-px bg-slate-100 ml-3.5"></div>

                <!-- Step 03: Team -->
                <div class="flex items-center gap-3 cursor-pointer group" onclick="OnboardingView.setStep(3)">
                  <div class="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition ${
                    step > 3 ? 'bg-emerald-500 text-white' : step === 3 ? 'bg-[#bef264] text-slate-950 font-black shadow-xs ring-2 ring-[#84cc16]/40' : 'bg-slate-100 text-slate-500'
                  }">
                    ${step > 3 ? '✓' : '03'}
                  </div>
                  <div class="flex-1">
                    <div class="text-xs font-bold ${step === 3 ? 'text-slate-950 font-black' : step > 3 ? 'text-emerald-700' : 'text-slate-600'}">
                      Invite Team
                    </div>
                    <div class="text-[10px] text-slate-400">QA engineers, PMs & developers</div>
                  </div>
                  ${step === 3 ? `<span class="w-2 h-2 rounded-full bg-[#84cc16] animate-pulse"></span>` : ''}
                </div>

                <div class="h-px bg-slate-100 ml-3.5"></div>

                <!-- Step 04: Ready -->
                <div class="flex items-center gap-3 cursor-pointer group" onclick="OnboardingView.setStep(4)">
                  <div class="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition ${
                    step === 4 ? 'bg-emerald-600 text-white font-black shadow-xs ring-2 ring-emerald-400' : 'bg-slate-100 text-slate-500'
                  }">
                    ${step === 4 ? '✓' : '04'}
                  </div>
                  <div class="flex-1">
                    <div class="text-xs font-bold ${step === 4 ? 'text-slate-950 font-black' : 'text-slate-600'}">
                      Workspace Ready
                    </div>
                    <div class="text-[10px] text-slate-400">Launch command center</div>
                  </div>
                  ${step === 4 ? `<span class="w-2 h-2 rounded-full bg-emerald-500"></span>` : ''}
                </div>

              </div>

              <!-- Visual Hierarchy Infographic (Architecture Reminder) -->
              <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-2.5 shadow-md">
                <div class="flex items-center justify-between text-[10px] font-mono text-[#bef264] font-bold">
                  <span>PULSEWAVE ARCHITECTURE</span>
                  <span>UNIFIED</span>
                </div>
                <div class="space-y-1.5 text-xs font-medium">
                  <div class="flex items-center gap-2 text-slate-200">
                    <div class="w-2 h-2 rounded-full bg-[#bef264]"></div>
                    <span class="font-bold">Workspace</span>
                    <span class="text-[10px] text-slate-400">(Your Company)</span>
                  </div>
                  <div class="pl-4 border-l border-slate-700 space-y-1 text-slate-300 text-[11px]">
                    <div class="flex items-center gap-1.5">
                      <span>↳</span> <span>Team Members & Roles</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span>↳</span> <span>Projects (Multi-Project)</span>
                    </div>
                    <div class="pl-3 border-l border-slate-700 text-slate-400 text-[10px] space-y-0.5">
                      <div>• Sprints & Backlog</div>
                      <div>• QA Suites & Test Runs</div>
                      <div>• Bug Retest & Gate Pass</div>
                      <div>• PDF / Excel Reports</div>
                    </div>
                  </div>
                </div>
                <div class="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                  <i data-lucide="clock" class="w-3 h-3 text-[#bef264]"></i>
                  <span>Setup takes about 2 minutes</span>
                </div>
              </div>

            </div>

            <!-- RIGHT PANEL: Dynamic Step Form Card -->
            <div class="lg:col-span-8">
              <div class="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-8 text-left relative transition-all">
                ${this.renderStepContent(step)}
              </div>
            </div>

          </div>

        </main>

        <!-- Onboarding Footer -->
        <footer class="relative z-10 py-4 border-t border-slate-200/60 text-center text-xs text-slate-400">
          <span>&copy; 2026 PulseWave Technologies. Enterprise QA & Project Management SaaS.</span>
        </footer>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderStepContent(step) {
    switch (step) {
      case 0:
        return this.renderWelcomeStep();
      case 1:
        return this.renderWorkspaceStep();
      case 2:
        return this.renderProjectStep();
      case 3:
        return this.renderTeamStep();
      case 4:
        return this.renderCompleteStep();
      default:
        return this.renderWelcomeStep();
    }
  },

  // =========================================================================
  // STEP 00: WELCOME
  // =========================================================================
  renderWelcomeStep() {
    return `
      <div class="space-y-6 animate-fade-in">
        
        <!-- Header -->
        <div class="space-y-2">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] text-[11px] font-bold uppercase tracking-wide shadow-2xs">
            <span>✦</span>
            <span>WELCOME TO PULSEWAVE</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Welcome to PulseWave
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-xl">
            Your workspace for project management, QA, issue tracking, and software delivery.
          </p>
        </div>

        <!-- 4 Small Benefit Cards (Grid) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          
          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-400 hover:bg-white transition group space-y-1.5">
            <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200 group-hover:bg-slate-950 group-hover:text-[#bef264] transition">
              <i data-lucide="folder-kanban" class="w-4 h-4"></i>
            </div>
            <h3 class="text-xs font-bold text-slate-900">Project Management</h3>
            <p class="text-[11px] text-slate-500 leading-relaxed font-normal">
              Track projects, sprints, backlog, and team velocity in one board.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-[#84cc16] hover:bg-white transition group space-y-1.5">
            <div class="w-8 h-8 rounded-lg bg-[#f7fee7] text-[#4d7c0f] flex items-center justify-center font-bold text-xs border border-[#d9f99d] group-hover:bg-[#84cc16] group-hover:text-slate-950 transition">
              <i data-lucide="clipboard-check" class="w-4 h-4"></i>
            </div>
            <h3 class="text-xs font-bold text-slate-900">QA Management</h3>
            <p class="text-[11px] text-slate-500 leading-relaxed font-normal">
              Manage test plans, test suites, live execution runner, and quality gates.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-rose-300 hover:bg-white transition group space-y-1.5">
            <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition">
              <i data-lucide="bug" class="w-4 h-4"></i>
            </div>
            <h3 class="text-xs font-bold text-slate-900">Issue Tracking</h3>
            <p class="text-[11px] text-slate-500 leading-relaxed font-normal">
              Track bugs from discovery to fix, retest verification, and release clearance.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-purple-300 hover:bg-white transition group space-y-1.5">
            <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition">
              <i data-lucide="file-check-2" class="w-4 h-4"></i>
            </div>
            <h3 class="text-xs font-bold text-slate-900">Corporate Reporting</h3>
            <p class="text-[11px] text-slate-500 leading-relaxed font-normal">
              Turn testing activity into professional, stakeholder-ready PDF and Excel reports.
            </p>
          </div>

        </div>

        <!-- Action CTAs -->
        <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button onclick="OnboardingView.setStep(1)" class="w-full sm:w-auto px-6 py-3 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md shadow-[#bef264]/35 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2">
            <span>Create My Workspace</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>

          <button onclick="OnboardingView.skipToDashboard()" class="text-xs text-slate-400 hover:text-slate-700 font-semibold cursor-pointer transition">
            Skip setup
          </button>
        </div>

      </div>
    `;
  },

  // =========================================================================
  // STEP 01: CREATE WORKSPACE
  // =========================================================================
  renderWorkspaceStep() {
    const ws = this.state.workspace;
    const errors = this.state.errors;

    return `
      <div class="space-y-6 animate-fade-in">
        
        <!-- Header -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-[#4d7c0f]">STEP 01 OF 04</div>
          <h2 class="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Create your workspace
          </h2>
          <p class="text-xs text-slate-500 font-normal">
            Your workspace is the central home for your team and projects.
          </p>
        </div>

        <!-- Form Fields -->
        <form onsubmit="OnboardingView.handleWorkspaceSubmit(event)" class="space-y-4 text-xs">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Workspace Name -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">
                Workspace Name *
              </label>
              <input
                type="text"
                id="wsName"
                value="${ws.name}"
                oninput="OnboardingView.handleWorkspaceNameChange(this.value)"
                required
                class="w-full px-3 py-2.5 bg-slate-50/80 border ${errors.wsName ? 'border-rose-500' : 'border-slate-200'} rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                placeholder="e.g. Acme Software"
              />
              ${errors.wsName ? `<p class="text-[10px] text-rose-600 mt-1 font-semibold">${errors.wsName}</p>` : ''}
            </div>

            <!-- Company / Organization -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">
                Company / Organization
              </label>
              <input
                type="text"
                id="wsCompany"
                value="${ws.company}"
                class="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                placeholder="e.g. Acme Technologies Inc."
              />
            </div>
          </div>

          <!-- Workspace URL (Slug Preview with live availability badge) -->
          <div>
            <label class="block font-bold text-slate-700 mb-1 text-[11px]">
              Workspace URL
            </label>
            <div class="flex items-center">
              <span class="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-mono text-[11px]">
                pulsewave.com/
              </span>
              <input
                type="text"
                id="wsSlug"
                value="${ws.slug}"
                oninput="OnboardingView.handleSlugChange(this.value)"
                required
                class="flex-1 px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-r-xl text-slate-900 font-mono font-medium text-[11px] focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                placeholder="acme-software"
              />
            </div>
            <div class="mt-1.5 flex items-center justify-between text-[11px]">
              <span class="${ws.slug ? 'text-emerald-700' : 'text-slate-500'} font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full ${ws.slug ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}"></span>
                <span>${ws.slug ? `pulsewave.com/${ws.slug} is available` : 'Enter workspace name to generate team domain'}</span>
              </span>
              <span class="text-slate-400">Unique team domain</span>
            </div>
          </div>

          <!-- Workspace Type Selector -->
          <div>
            <label class="block font-bold text-slate-700 mb-1.5 text-[11px]">
              Workspace Type
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
              ${["Software Company", "Agency", "Startup", "Enterprise", "Other"].map(t => `
                <button
                  type="button"
                  onclick="OnboardingView.selectWorkspaceType('${t}')"
                  class="px-2.5 py-2 rounded-xl text-center font-bold text-[11px] border transition cursor-pointer ${
                    ws.type === t
                      ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                      : 'bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }"
                >
                  ${t}
                </button>
              `).join("")}
            </div>
          </div>

          <!-- Workspace Brand & Logo Upload Section (Clean, Spacious, No Color Theme Selection) -->
          <div class="pt-2 border-t border-slate-100">
            <label class="block font-bold text-slate-700 mb-1.5 text-[11px]">
              Workspace Logo / Icon
            </label>
            
            <input
              type="file"
              id="wsLogoFileInput"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              class="hidden"
              onchange="OnboardingView.handleLogoUpload(event)"
            />

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/90 p-4 rounded-2xl border border-slate-200">
              <div class="flex items-center gap-3.5 min-w-0">
                <!-- Interactive Logo Box -->
                <div id="wsLogoPreviewBox" onclick="OnboardingView.triggerLogoUpload()" class="shrink-0 cursor-pointer group relative" title="Click to upload logo">
                  ${ws.logo ? `
                    <div class="relative">
                      <img src="${ws.logo}" alt="Workspace Logo" class="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 shadow-sm" />
                      <div class="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-[10px] font-bold">
                        Change
                      </div>
                    </div>
                  ` : `
                    <div class="w-14 h-14 rounded-2xl bg-slate-950 text-[#bef264] border-2 border-[#bef264]/80 flex items-center justify-center font-black text-lg shadow-sm uppercase group-hover:scale-105 transition-transform">
                      ${ws.name ? ws.name.substring(0, 2).toUpperCase() : 'PW'}
                    </div>
                  `}
                </div>

                <div class="min-w-0">
                  <div class="text-xs font-bold text-slate-900 truncate">
                    ${ws.logo ? 'Custom Logo Uploaded' : (ws.name || 'Workspace Brand')}
                  </div>
                  <p class="text-[11px] text-slate-500 font-normal mt-0.5">
                    Recommended PNG, JPG, or SVG (square 1:1, up to 5MB).
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2 shrink-0">
                ${ws.logo ? `
                  <button
                    type="button"
                    onclick="OnboardingView.removeLogo()"
                    class="px-3 py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-500"></i>
                    <span>Remove</span>
                  </button>
                ` : ''}

                <button
                  type="button"
                  onclick="OnboardingView.triggerLogoUpload()"
                  class="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <i data-lucide="upload" class="w-3.5 h-3.5 text-slate-600"></i>
                  <span>${ws.logo ? 'Change Logo' : 'Upload Logo'}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Navigation CTAs -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button type="button" onclick="OnboardingView.setStep(0)" class="px-4 py-2.5 text-slate-500 hover:text-slate-900 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition">
              <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
              <span>Back</span>
            </button>

            <button type="submit" class="px-6 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-md shadow-[#bef264]/35 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5">
              <span>Continue to Project</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </div>

        </form>

      </div>
    `;
  },

  // =========================================================================
  // STEP 02: CREATE FIRST PROJECT
  // =========================================================================
  renderProjectStep() {
    const proj = this.state.project;
    const errors = this.state.errors;
    const currentUser = (typeof store !== 'undefined' ? store.getActiveUser() : null);

    return `
      <div class="space-y-6 animate-fade-in">
        
        <!-- Header -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-[#4d7c0f]">STEP 02 OF 04</div>
          <h2 class="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Create your first project
          </h2>
          <p class="text-xs text-slate-500 font-normal">
            Start tracking development and QA work in one place.
          </p>
        </div>

        <!-- Form Fields -->
        <form onsubmit="OnboardingView.handleProjectSubmit(event)" class="space-y-3.5 text-xs">
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <!-- Project Name -->
            <div class="sm:col-span-2">
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">
                Project Name *
              </label>
              <input
                type="text"
                id="projName"
                value="${proj.name}"
                oninput="OnboardingView.handleProjectNameChange(this.value)"
                required
                class="w-full px-3 py-2.5 bg-slate-50/80 border ${errors.projName ? 'border-rose-500' : 'border-slate-200'} rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                placeholder="e.g. Retail POS Integration"
              />
              ${errors.projName ? `<p class="text-[10px] text-rose-600 mt-1 font-semibold">${errors.projName}</p>` : ''}
            </div>

            <!-- Project Key -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">
                Project Key *
              </label>
              <input
                type="text"
                id="projKey"
                value="${proj.key}"
                required
                maxlength="10"
                class="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold uppercase focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                placeholder="RPIS"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <!-- Customer / Client -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">
                Customer / Client
              </label>
              <input
                type="text"
                id="projClient"
                value="${proj.client}"
                class="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                placeholder="e.g. Acme Retail"
              />
            </div>

            <!-- Project Manager Text Input (Clean Text Field) -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">
                Project Manager / Lead *
              </label>
              <input
                type="text"
                id="projPm"
                value="${proj.pmId || (currentUser ? currentUser.name : '')}"
                required
                class="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                placeholder="e.g. Sarah Jenkins or Lead PM"
              />
            </div>
          </div>

          <!-- Priority & Status Selector -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block font-bold text-slate-700 mb-1.5 text-[11px]">Priority</label>
              <div class="grid grid-cols-4 gap-1.5">
                ${["P0 Critical", "P1 High", "P2 Medium", "P3 Low"].map(p => `
                  <button
                    type="button"
                    onclick="OnboardingView.selectPriority('${p}')"
                    class="px-2 py-1.5 rounded-lg text-center font-bold text-[10px] border transition cursor-pointer ${
                      proj.priority === p
                        ? (p.includes('P0') ? 'bg-red-600 text-white border-red-600' : p.includes('P1') ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-950 text-white border-slate-950')
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }"
                  >
                    ${p.split(" ")[0]}
                  </button>
                `).join("")}
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1.5 text-[11px]">Initial Status</label>
              <div class="grid grid-cols-3 gap-1.5">
                ${["Planning", "Active", "On Hold"].map(s => `
                  <button
                    type="button"
                    onclick="OnboardingView.selectStatus('${s}')"
                    class="px-2 py-1.5 rounded-lg text-center font-bold text-[10px] border transition cursor-pointer ${
                      proj.status === s
                        ? 'bg-slate-950 text-[#bef264] border-slate-950 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }"
                  >
                    ${s}
                  </button>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- Timeline Dates -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">Start Date</label>
              <input
                type="date"
                id="projStartDate"
                value="${proj.startDate}"
                class="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:outline-none transition"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">Target Release Date</label>
              <input
                type="date"
                id="projTargetDate"
                value="${proj.targetDate}"
                class="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:outline-none transition"
              />
            </div>
          </div>

          <!-- Project Description Textarea -->
          <div>
            <label class="block font-bold text-slate-700 mb-1 text-[11px]">
              Project Description
            </label>
            <textarea
              id="projDesc"
              rows="2"
              class="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-normal focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition resize-none"
              placeholder="Briefly describe the project, product, or integration..."
            >${proj.description}</textarea>
          </div>

          <!-- Navigation CTAs -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button type="button" onclick="OnboardingView.setStep(1)" class="px-4 py-2.5 text-slate-500 hover:text-slate-900 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition">
              <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
              <span>Back</span>
            </button>

            <div class="flex items-center gap-3">
              <button type="button" onclick="OnboardingView.skipProjectStep()" class="text-xs text-slate-400 hover:text-slate-700 font-semibold cursor-pointer transition">
                Skip for now
              </button>
              <button type="submit" class="px-6 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-md shadow-[#bef264]/35 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5">
                <span>Continue to Team</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

        </form>

      </div>
    `;
  },

  // =========================================================================
  // STEP 03: INVITE TEAM MEMBERS
  // =========================================================================
  renderTeamStep() {
    const team = this.state.team;

    return `
      <div class="space-y-6 animate-fade-in">
        
        <!-- Header -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-[#4d7c0f]">STEP 03 OF 04</div>
          <h2 class="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Build your team
          </h2>
          <p class="text-xs text-slate-500 font-normal">
            Invite the people who will work with you on PulseWave.
          </p>
        </div>

        <!-- Add Member Input Group -->
        <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Add New Team Member</span>
          <form onsubmit="OnboardingView.handleAddTeamMember(event)" class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div class="sm:col-span-6">
              <input
                type="email"
                id="teamEmailInput"
                placeholder="colleague@company.com"
                required
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
              />
            </div>
            <div class="sm:col-span-4">
              <select
                id="teamRoleInput"
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
              >
                <option value="QA Engineer">QA Engineer</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Developer">Developer</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <button
                type="submit"
                class="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span>+ Add</span>
              </button>
            </div>
          </form>

          <!-- Quick Suggested Personas -->
          <div class="pt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span class="text-slate-400 font-medium">Quick Suggestions:</span>
            <button type="button" onclick="OnboardingView.addQuickMember('qa.lead@pulsewave.io', 'QA Engineer', 'Rimsha Shahbaz')" class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-slate-300 font-semibold">+ Rimsha (QA)</button>
            <button type="button" onclick="OnboardingView.addQuickMember('dev.lead@pulsewave.io', 'Developer', 'Kamran Akmal')" class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-slate-300 font-semibold">+ Kamran (Dev)</button>
            <button type="button" onclick="OnboardingView.addQuickMember('pm.lead@pulsewave.io', 'Project Manager', 'Emily Watson')" class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-slate-300 font-semibold">+ Emily (PM)</button>
          </div>
        </div>

        <!-- Team Members List -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Invited Members (${team.length})</span>
            <span class="text-[10px] text-slate-400 font-normal">Pending acceptance on launch</span>
          </div>

          <div class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto">
            ${team.length === 0 ? `
              <div class="p-6 text-center text-slate-400 text-xs">
                No team members added yet. You can invite colleagues above or add them later.
              </div>
            ` : team.map(m => `
              <div class="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition group">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-8 h-8 rounded-full ${m.color || 'bg-slate-600'} text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                    ${m.initials}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-900 truncate">${m.name}</span>
                      <span class="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold uppercase tracking-wider">
                        PENDING
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                      <span>${m.email}</span>
                      <span>•</span>
                      <span class="font-semibold text-slate-700">${m.role}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onclick="OnboardingView.copyInviteLink('${m.email}', '${m.role}')"
                    class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1"
                    title="Copy direct invitation link"
                  >
                    <i data-lucide="link" class="w-3 h-3 text-slate-500"></i>
                    <span>Copy Link</span>
                  </button>

                  <button
                    type="button"
                    onclick="OnboardingView.removeTeamMember('${m.id}')"
                    class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer text-xs font-semibold"
                    title="Remove invitation"
                  >
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Navigation CTAs -->
        <div class="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button type="button" onclick="OnboardingView.setStep(2)" class="px-4 py-2.5 text-slate-500 hover:text-slate-900 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
            <span>Back</span>
          </button>

          <div class="flex items-center gap-3">
            <button type="button" onclick="OnboardingView.skipTeamStep()" class="text-xs text-slate-400 hover:text-slate-700 font-semibold cursor-pointer transition">
              Skip for now
            </button>
            <button id="teamContinueBtn" type="button" onclick="OnboardingView.handleTeamSubmit()" class="px-6 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-md shadow-[#bef264]/35 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5">
              <span>Send Invitations & Continue</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

      </div>
    `;
  },

  // =========================================================================
  // STEP 04: SETUP COMPLETE
  // =========================================================================
  renderCompleteStep() {
    const ws = this.state.workspace;
    const proj = this.state.project;
    const team = this.state.team;

    return `
      <div class="space-y-6 animate-fade-in text-center sm:text-left">
        
        <!-- Header -->
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wide shadow-2xs">
            <span>✓</span>
            <span>SETUP COMPLETED</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Your PulseWave workspace is ready.
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-xl">
            You're ready to start managing projects and shipping better software.
          </p>
        </div>

        <!-- Visual Completion Checklist -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div class="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
            <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              ✓
            </div>
            <div class="text-left">
              <span class="text-xs font-bold text-slate-900 block">Workspace created</span>
              <span class="text-[10px] text-emerald-800 font-medium">pulsewave.com/${ws.slug}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
            <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              ✓
            </div>
            <div class="text-left">
              <span class="text-xs font-bold text-slate-900 block">First project initialized</span>
              <span class="text-[10px] text-emerald-800 font-medium">${proj.name} [${proj.key}]</span>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
            <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              ✓
            </div>
            <div class="text-left">
              <span class="text-xs font-bold text-slate-900 block">Team invitations queued</span>
              <span class="text-[10px] text-emerald-800 font-medium">${team.length} members invited</span>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
            <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              ✓
            </div>
            <div class="text-left">
              <span class="text-xs font-bold text-slate-900 block">Project workspace ready</span>
              <span class="text-[10px] text-emerald-800 font-medium">Backlog, QA Suites & Reports</span>
            </div>
          </div>
        </div>

        <!-- Executive Summary Card -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 text-left">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl ${ws.logoColor} text-white font-black text-xs flex items-center justify-center shadow-xs">
                ${ws.name ? ws.name.substring(0, 2) : 'PW'}
              </div>
              <div>
                <span class="text-xs font-black text-slate-900 block">${ws.name}</span>
                <span class="text-[10px] text-slate-400 font-mono">pulsewave.com/${ws.slug}</span>
              </div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Ready to start</span>
            </span>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div class="p-2 rounded-lg bg-slate-50">
              <span class="text-slate-400 block font-medium">Active Project</span>
              <span class="font-bold text-slate-900 truncate block">${proj.name}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-50">
              <span class="text-slate-400 block font-medium">Team Members</span>
              <span class="font-bold text-slate-900">${team.length} Members</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-50">
              <span class="text-slate-400 block font-medium">QA Readiness</span>
              <span class="font-bold text-emerald-600">100% Configured</span>
            </div>
          </div>
        </div>

        <!-- Primary Action Buttons -->
        <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <button onclick="OnboardingView.finishAndNavigate('dashboard')" class="w-full sm:flex-1 py-3 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md shadow-[#bef264]/35 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2">
            <span>Go to PulseWave Dashboard</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>

          <button onclick="OnboardingView.finishAndNavigate('workspace')" class="w-full sm:w-auto px-5 py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2">
            <i data-lucide="folder-kanban" class="w-4 h-4"></i>
            <span>Open Project Workspace</span>
          </button>
        </div>

      </div>
    `;
  },

  // =========================================================================
  // INTERACTION HANDLERS
  // =========================================================================
  handleWorkspaceNameChange(val) {
    this.state.workspace.name = val;
    const slug = val.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    this.state.workspace.slug = slug || "my-workspace";
    const slugEl = document.getElementById("wsSlug");
    if (slugEl) slugEl.value = this.state.workspace.slug;
  },

  handleSlugChange(val) {
    this.state.workspace.slug = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
  },

  saveCurrentWorkspaceInputs() {
    const nameEl = document.getElementById("wsName");
    const slugEl = document.getElementById("wsSlug");
    const compEl = document.getElementById("wsCompany");
    if (nameEl && nameEl.value !== undefined) this.state.workspace.name = nameEl.value;
    if (slugEl && slugEl.value !== undefined) this.state.workspace.slug = slugEl.value;
    if (compEl && compEl.value !== undefined) this.state.workspace.company = compEl.value;
  },

  selectWorkspaceType(type) {
    this.saveCurrentWorkspaceInputs();
    this.state.workspace.type = type;
    this.setStep(1);
  },

  triggerLogoUpload() {
    this.saveCurrentWorkspaceInputs();
    const fileInput = document.getElementById("wsLogoFileInput");
    if (fileInput) {
      fileInput.value = "";
      fileInput.click();
    }
  },

  handleLogoUpload(e) {
    this.saveCurrentWorkspaceInputs();
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      window.app.toast("File Too Large", "Logo must be under 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      this.state.workspace.logo = event.target.result;
      window.app.toast("Logo Uploaded", "Workspace logo uploaded successfully.", "success");
      this.setStep(1);
    };
    reader.onerror = () => {
      window.app.toast("Upload Error", "Failed to read image file.", "error");
    };
    reader.readAsDataURL(file);
  },

  removeLogo() {
    this.saveCurrentWorkspaceInputs();
    this.state.workspace.logo = null;
    window.app.toast("Logo Removed", "Default monogram restored.", "info");
    this.setStep(1);
  },

  copyInviteLink(email, role) {
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:3000';
    const wsSlug = this.state.workspace.slug || 'workspace';
    const link = `${origin}/#join?ws=${encodeURIComponent(wsSlug)}&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        window.app.toast("Invite Link Copied", `Invitation link copied to clipboard for ${email}!`, "success");
      }).catch(() => {
        window.app.toast("Invite Link", `Share link: ${link}`, "info");
      });
    } else {
      window.app.toast("Invite Link", `Share link: ${link}`, "info");
    }
  },

  async handleWorkspaceSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("wsName")?.value.trim();
    const company = document.getElementById("wsCompany")?.value.trim();
    const slug = document.getElementById("wsSlug")?.value.trim();
    const submitBtn = e && e.target && e.target.querySelector ? e.target.querySelector('button[type="submit"]') : null;

    if (!name) {
      this.state.errors.wsName = "Workspace name is required.";
      this.setStep(1);
      return;
    }
    this.state.errors.wsName = null;
    this.state.workspace.name = name;
    this.state.workspace.company = company || name;
    this.state.workspace.slug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Creating Workspace...</span>`;
    }

    try {
      const currentUser = (typeof store !== 'undefined' ? store.getActiveUser() : null);
      const ws = {
        id: `ws_${Date.now()}`,
        name: this.state.workspace.name,
        slug: this.state.workspace.slug,
        company_name: this.state.workspace.company,
        workspace_type: this.state.workspace.type,
        logo_color: this.state.workspace.logoColor,
        logo_url: this.state.workspace.logo,
        owner_id: currentUser ? currentUser.id : null,
        created_by: currentUser ? currentUser.email : null,
        owner_name: currentUser ? currentUser.name : "Owner",
        role: "OWNER",
        members: currentUser ? [{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: "OWNER"
        }] : []
      };
      this.state.createdWorkspace = ws;
      if (typeof store !== 'undefined' && store.addWorkspace) {
        store.addWorkspace(ws);
      }
      window.app.toast("Space Created", `Space '${name}' created by ${currentUser ? currentUser.name : 'you'} (Owner / PM).`, "success");
      this.setStep(2);
    } catch (err) {
      window.app.toast("Space Error", err.message || "Failed to create space.", "error");
      this.state.errors.wsSlug = err.message;
      this.setStep(1);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  },

  handleProjectNameChange(val) {
    this.state.project.name = val;
    const words = val.trim().split(/\s+/);
    let key = "";
    if (words.length === 1) {
      key = val.substring(0, 4).toUpperCase();
    } else {
      key = words.map(w => w[0]).join("").substring(0, 4).toUpperCase();
    }
    this.state.project.key = key || "PRJ";
    const keyEl = document.getElementById("projKey");
    if (keyEl) keyEl.value = this.state.project.key;
  },

  selectPriority(p) {
    this.state.project.priority = p;
    this.setStep(2);
  },

  selectStatus(s) {
    this.state.project.status = s;
    this.setStep(2);
  },

  async handleProjectSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("projName")?.value.trim();
    const key = document.getElementById("projKey")?.value.trim().toUpperCase();
    const client = document.getElementById("projClient")?.value.trim() || "Enterprise Client";
    const currentUser = (typeof store !== 'undefined' ? store.getActiveUser() : null);
    const pmName = document.getElementById("projPm")?.value.trim() || (currentUser ? currentUser.name : "Project Manager");
    const priority = this.state.project.priority || "P1";
    const status = this.state.project.status || "Active";
    const startDate = document.getElementById("projStartDate")?.value || new Date().toISOString().split("T")[0];
    const targetDate = document.getElementById("projTargetDate")?.value || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];
    const description = document.getElementById("projDesc")?.value.trim() || "";
    const submitBtn = e && e.target && e.target.querySelector ? e.target.querySelector('button[type="submit"]') : null;

    if (!name) {
      this.state.errors.projName = "Project name is required.";
      this.setStep(2);
      return;
    }
    if (!key || key.length < 2) {
      window.app.toast("Invalid Key", "Project key must contain at least 2 characters.", "error");
      return;
    }

    this.state.errors.projName = null;
    this.state.project.name = name;
    this.state.project.key = key;
    this.state.project.client = client;
    this.state.project.pmId = pmName;
    this.state.project.startDate = startDate;
    this.state.project.targetDate = targetDate;
    this.state.project.description = description;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Creating Project...</span>`;
    }

    try {
      const createdWs = this.state.createdWorkspace || (store.getActiveWorkspace ? store.getActiveWorkspace() : null);
      const wsId = createdWs ? createdWs.id : (store.data.activeWorkspaceId || null);

      const newProj = {
        id: `prj_${Date.now()}`,
        workspace_id: wsId,
        name,
        key,
        customer: client,
        project_manager_id: pmName,
        pmId: pmName,
        priority,
        status,
        startDate: startDate,
        dueDate: targetDate,
        target_release_date: targetDate,
        description
      };
      this.state.createdProject = newProj;
      if (typeof store !== 'undefined' && store.addRealProject) {
        store.addRealProject(newProj);
      }
      window.app.toast("Project Initialized", `Project '${name}' [${key}] created in ${createdWs ? createdWs.name : 'your space'}.`, "success");
      this.setStep(3);
    } catch (err) {
      window.app.toast("Project Error", err.message || "Failed to create project.", "error");
      this.state.errors.projKey = err.message;
      this.setStep(2);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  },

  skipProjectStep() {
    this.state.skippedProject = true;
    window.app.toast("Project Skipped", "You can create your first project from the Projects section later.", "info");
    this.setStep(3);
  },

  handleAddTeamMember(e) {
    e.preventDefault();
    const email = document.getElementById("teamEmailInput")?.value.trim();
    const role = document.getElementById("teamRoleInput")?.value || "QA Engineer";

    if (!email || !email.includes("@")) {
      window.app.toast("Invalid Email", "Enter a valid email address.", "error");
      return;
    }

    const namePart = email.split("@")[0].replace(/[._-]/g, " ");
    const formattedName = namePart.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const initials = namePart.split(" ").map(w => w.charAt(0).toUpperCase()).join("").substring(0, 2) || "TM";

    const colors = ["bg-slate-900", "bg-rose-600", "bg-emerald-600", "bg-purple-600", "bg-indigo-600", "bg-amber-600"];
    const color = colors[this.state.team.length % colors.length];

    this.state.team.push({
      id: "tm-" + Date.now(),
      name: formattedName,
      email: email,
      role: role,
      initials: initials,
      color: color
    });

    window.app.toast("Member Added", `Queued invitation for ${email} (${role}).`, "success");
    this.setStep(3);
  },

  addQuickMember(email, role, name) {
    const initials = name.split(" ").map(w => w[0]).join("").substring(0, 2);
    const colors = ["bg-purple-600", "bg-emerald-600", "bg-slate-900", "bg-rose-600"];
    const color = colors[this.state.team.length % colors.length];

    this.state.team.push({
      id: "tm-" + Date.now(),
      name: name,
      email: email,
      role: role,
      initials: initials,
      color: color
    });

    window.app.toast("Quick Teammate Added", `${name} (${role}) added to invite list.`, "success");
    this.setStep(3);
  },

  removeTeamMember(id) {
    this.state.team = this.state.team.filter(m => m.id !== id);
    this.setStep(3);
  },

  async handleTeamSubmit() {
    const submitBtn = document.getElementById("teamContinueBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Sending Invitations...</span>`;
    }

    try {
      const createdWs = this.state.createdWorkspace || (store.getActiveWorkspace ? store.getActiveWorkspace() : null);
      const createdProj = this.state.createdProject || (store.getActiveProject ? store.getActiveProject() : null);

      if (typeof store !== 'undefined' && this.state.team && this.state.team.length > 0) {
        this.state.team.forEach(m => {
          if (!store.data.users.find(u => u.email === m.email)) {
            store.data.users.push({
              id: m.id,
              name: m.name,
              email: m.email,
              role: m.role,
              initials: m.initials,
              color: m.color
            });
          }

          // Create official workspace invitation record in Supabase
          if (createdWs && store.createInvitation) {
            store.createInvitation(createdWs.id, {
              email: m.email,
              role: m.role
            });
          }

          // Add to Space members
          if (createdWs && store.addSpaceMember) {
            store.addSpaceMember(createdWs.id, {
              id: m.id,
              name: m.name,
              email: m.email,
              role: m.role
            });
          }

          // Add to Project members
          if (createdProj && store.addProjectMember) {
            store.addProjectMember(createdProj.id, {
              id: m.id,
              email: m.email,
              role: m.role
            });
          }
        });
        store.saveState();
        if (store.syncSupabaseCloudState) store.syncSupabaseCloudState();
      }
      window.app.toast("Invitations Dispatched", `${this.state.team.length} teammate invitations dispatched.`, "success");
      this.setStep(4);
    } catch (err) {
      window.app.toast("Invitations Error", err.message, "error");
      this.setStep(4);
    }
  },

  skipTeamStep() {
    this.state.skippedTeam = true;
    window.app.toast("Team Skipped", "You can invite your team anytime from Workspace Settings.", "info");
    this.setStep(4);
  },

  skipToDashboard() {
    window.app.toast("Welcome to PulseWave", "Navigating to your executive command center.", "info");
    window.app.navigate("dashboard");
  },

  async finishAndNavigate(target) {
    try {
      const activeUser = store.getActiveUser ? store.getActiveUser() : null;
      if (activeUser) {
        activeUser.onboarding_completed = true;
        activeUser.onboarding_step = 'COMPLETE';
      }
      if (store.completeOnboarding) {
        store.completeOnboarding();
      } else {
        store.saveState();
      }
      window.app.toast("Workspace Activated", "All systems operational. Welcome aboard!", "success");
      const activeProj = store.getActiveProject ? store.getActiveProject() : null;
      if (target === "workspace" && activeProj) {
        window.app.openProjectWorkspace(activeProj.id, "board");
      } else {
        window.app.navigate("dashboard");
      }
    } catch (err) {
      window.app.navigate("dashboard");
    }
  }
};

window.OnboardingView = OnboardingView;
