/**
 * PulseWave — High-Converting Unified Landing Page
 * Designed with a consistent executive light theme, lime-accented highlights,
 * compact vertical section spacing, permanent static/sticky navbar, and interactive live previews.
 */

const LandingPageView = {
  render(container) {
    container.innerHTML = `
      <div class="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#bef264] selection:text-slate-950 pb-0 relative">
        
        <!-- =========================================================================
             1. STATIC / STICKY TOP NAVBAR (Permanently fixed when scrolling up & down)
             ========================================================================= -->
        <nav class="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            
            <!-- Brand Logo (4-Square Grid + Brand Text) -->
            <div class="flex items-center gap-2.5 cursor-pointer" onclick="window.app.navigate('home')">
              <div class="w-6 h-6 grid grid-cols-2 gap-0.5">
                <div class="bg-[#84cc16] rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
              </div>
              <span class="text-lg font-extrabold text-slate-950 tracking-tight">
                PulseWave
              </span>
            </div>

            <!-- Center Navigation Links (Smooth Scroll Navigation) -->
            <div class="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-700">
              <button onclick="LandingPageView.scrollToSection('features')" class="text-slate-700 hover:text-slate-950 transition cursor-pointer font-semibold">Features</button>
              <button onclick="LandingPageView.scrollToSection('workflow')" class="text-slate-700 hover:text-slate-950 transition cursor-pointer font-semibold">Workflow</button>
              <button onclick="LandingPageView.scrollToSection('reporting')" class="text-slate-700 hover:text-slate-950 transition cursor-pointer font-semibold">Reporting</button>
              <button onclick="LandingPageView.scrollToSection('personas')" class="text-slate-700 hover:text-slate-950 transition cursor-pointer font-semibold">Workspaces</button>
              <button onclick="LandingPageView.scrollToSection('roadmap')" class="text-slate-700 hover:text-slate-950 transition cursor-pointer font-semibold">Roadmap</button>
            </div>

            <!-- Right Actions -->
            <div class="flex items-center gap-3">
              <button onclick="window.app.navigate('login')" class="text-xs font-bold text-slate-800 hover:text-slate-950 transition cursor-pointer">
                Sign In
              </button>
              <button onclick="window.app.navigate('signup')" class="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5">
                <span>Get Started</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>

          </div>
        </nav>

        <!-- =========================================================================
             2. HERO SECTION (Light Mixed Ambient Gradient Canvas)
             ========================================================================= -->
        <section class="relative pt-10 pb-14 lg:pt-14 lg:pb-20 overflow-hidden" style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 45%, #ffffff 100%);">
          
          <!-- Subtle Engineering Dot Matrix Grid -->
          <div class="absolute inset-0 pointer-events-none opacity-40 z-0" style="background-image: radial-gradient(#94a3b8 1.2px, transparent 1.2px); background-size: 24px 24px;"></div>

          <!-- Multi-Color Mixed Ambient Blooms (Layered Z-0) -->
          <!-- 1. Electric Lime & Chartreuse Bloom (Top-Right) -->
          <div class="absolute -top-24 -right-24 w-[650px] h-[650px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(190, 242, 100, 0.5) 0%, rgba(163, 230, 53, 0.28) 45%, rgba(217, 249, 157, 0.1) 70%, transparent 100%);"></div>
          
          <!-- 2. Soft Sky Azure & Cyan Glow (Top-Left behind Headline) -->
          <div class="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(186, 230, 253, 0.65) 0%, rgba(125, 211, 252, 0.3) 50%, transparent 75%);"></div>
          
          <!-- 3. Soft Violet, Rose & Mint Aura (Center-Bottom) -->
          <div class="absolute -bottom-10 left-1/4 w-[700px] h-[450px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(ellipse, rgba(237, 233, 254, 0.6) 0%, rgba(254, 205, 211, 0.3) 40%, rgba(236, 253, 245, 0.35) 70%, transparent 100%);"></div>

          <!-- Flowing Bezier Wave Lines (Aesthetic Background Art) -->
          <div class="absolute bottom-4 left-0 w-[550px] h-[280px] pointer-events-none opacity-60 z-0">
            <svg viewBox="0 0 550 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
              <path d="M-50 240 C150 240, 220 130, 480 170" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="4 4"/>
              <path d="M-50 270 C120 250, 240 160, 520 200" stroke="#94a3b8" stroke-width="1.2"/>
              <path d="M-50 200 C180 210, 260 90, 540 130" stroke="#a3e635" stroke-width="2"/>
              <path d="M-50 160 C200 180, 300 70, 550 100" stroke="#38bdf8" stroke-width="1.5" opacity="0.8"/>
            </svg>
          </div>

          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
              
              <!-- LEFT COLUMN: Messaging & Action Buttons -->
              <div class="lg:col-span-5 space-y-5 text-left relative z-20">
                
                <!-- Pill Badge -->
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] text-[11px] font-bold tracking-wide uppercase shadow-2xs">
                  <span>✦</span>
                  <span>THE MODERN QA WORKSPACE</span>
                </div>

                <!-- Giant Headline -->
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.06]">
                  Ship faster. <br />
                  Test <span class="text-[#84cc16]">smarter.</span>
                </h1>

                <!-- Subheadline -->
                <p class="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal max-w-md">
                  Plan projects, track issues, execute testing, document results, and deliver professional QA reports &mdash; all from one unified workspace.
                </p>

                <!-- Dual Action CTAs -->
                <div class="flex flex-wrap items-center gap-3 pt-1">
                  <button onclick="window.app.navigate('signup')" class="px-5 py-3 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md shadow-[#bef264]/40 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2">
                    <span>Get Started Free</span>
                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                  </button>
                  
                  <button onclick="window.app.navigate('dashboard')" class="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs sm:text-sm rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-2">
                    <i data-lucide="play" class="w-4 h-4 fill-slate-900 text-slate-900"></i>
                    <span>Watch Product Demo</span>
                  </button>
                </div>

                <!-- Feature Checkmarks Below CTAs -->
                <div class="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
                  <div class="flex items-center gap-1.5">
                    <i data-lucide="check-circle" class="w-4 h-4 text-[#84cc16]"></i>
                    <span>No credit card required</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <i data-lucide="check-circle" class="w-4 h-4 text-[#84cc16]"></i>
                    <span>Set up in minutes</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <i data-lucide="check-circle" class="w-4 h-4 text-[#84cc16]"></i>
                    <span>Loved by QA teams</span>
                  </div>
                </div>

              </div>

              <!-- RIGHT COLUMN: Layered 3D Isometric App Mockup + 4 Floating Glass Cards -->
              <div class="lg:col-span-7 relative pt-4 lg:pt-0">
                
                <!-- Main Tilted App Mockup Window -->
                <div class="relative rounded-2xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-900/10 p-2 sm:p-2.5 transform lg:rotate-1 lg:hover:rotate-0 transition-transform duration-500 text-left">
                  <div class="rounded-xl overflow-hidden border border-slate-100 flex bg-white text-xs">
                    
                    <!-- App Mockup Dark Left Sidebar -->
                    <div class="w-28 sm:w-36 bg-slate-950 text-slate-400 p-3 flex flex-col justify-between shrink-0 space-y-4 font-medium text-[11px]">
                      <div class="space-y-3">
                        <div class="flex items-center gap-1.5 text-white font-bold text-xs pb-2 border-b border-slate-800">
                          <div class="w-3.5 h-3.5 grid grid-cols-2 gap-0.5">
                            <div class="bg-[#84cc16] rounded-xs"></div>
                            <div class="bg-white rounded-xs"></div>
                            <div class="bg-white rounded-xs"></div>
                            <div class="bg-white rounded-xs"></div>
                          </div>
                          <span>PulseWave</span>
                        </div>
                        
                        <div class="space-y-1 text-[10px]">
                          <div class="px-2 py-1 rounded bg-[#84cc16] text-slate-950 font-bold flex items-center gap-1.5">
                            <i data-lucide="layout-dashboard" class="w-3 h-3"></i> Dashboard
                          </div>
                          <div class="px-2 py-1 rounded hover:text-white flex items-center gap-1.5">
                            <i data-lucide="folder" class="w-3 h-3"></i> Projects
                          </div>
                          <div class="px-2 py-1 rounded hover:text-white flex items-center gap-1.5">
                            <i data-lucide="alert-circle" class="w-3 h-3"></i> Issues
                          </div>
                          <div class="px-2 py-1 rounded hover:text-white flex items-center gap-1.5">
                            <i data-lucide="calendar" class="w-3 h-3"></i> Sprints
                          </div>
                          <div class="px-2 py-1 rounded hover:text-white flex items-center gap-1.5">
                            <i data-lucide="check-square" class="w-3 h-3"></i> QA Testing
                          </div>
                          <div class="px-2 py-1 rounded hover:text-white flex items-center gap-1.5">
                            <i data-lucide="file-text" class="w-3 h-3"></i> Test Cases
                          </div>
                          <div class="px-2 py-1 rounded hover:text-white flex items-center gap-1.5">
                            <i data-lucide="bar-chart-2" class="w-3 h-3"></i> Reports
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- App Mockup Main Content Canvas -->
                    <div class="flex-1 bg-slate-50/70 p-3.5 sm:p-4 space-y-3 overflow-hidden text-[11px]">
                      
                      <!-- Top Bar Inside Mockup -->
                      <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <div class="text-xs font-bold text-slate-900">Dashboard</div>
                          <div class="text-[10px] text-slate-500 font-medium">Welcome back, Ahmed 👋</div>
                        </div>
                        <div class="flex items-center gap-2">
                          <div class="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] text-slate-400">Search anything...</div>
                          <div class="w-5 h-5 rounded-full bg-slate-950 text-[#bef264] font-bold text-[9px] flex items-center justify-center">AH</div>
                        </div>
                      </div>

                      <!-- 4 Metric Cards Inside Mockup -->
                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div class="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                          <div class="text-[9px] text-slate-400 font-bold uppercase">Total Projects</div>
                          <div class="text-sm font-bold text-slate-900 mt-0.5">12</div>
                          <span class="text-[8px] text-emerald-600 font-semibold">↑ 20% vs last week</span>
                        </div>
                        <div class="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                          <div class="text-[9px] text-slate-400 font-bold uppercase">Active Issues</div>
                          <div class="text-sm font-bold text-slate-900 mt-0.5">84</div>
                          <span class="text-[8px] text-rose-600 font-semibold">↑ 12% vs last week</span>
                        </div>
                        <div class="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                          <div class="text-[9px] text-slate-400 font-bold uppercase">QA Pass Rate</div>
                          <div class="text-sm font-bold text-emerald-600 mt-0.5">94%</div>
                          <span class="text-[8px] text-emerald-600 font-semibold">↑ 6% vs last week</span>
                        </div>
                        <div class="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                          <div class="text-[9px] text-slate-400 font-bold uppercase">Release Readiness</div>
                          <div class="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                            <i data-lucide="check-circle" class="w-3 h-3 text-emerald-600"></i> Ready
                          </div>
                          <span class="text-[8px] text-slate-400">All checks passed</span>
                        </div>
                      </div>

                      <!-- Middle Charts Grid Inside Mockup -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        
                        <!-- Sprint Progress Gauge -->
                        <div class="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                          <div class="text-[10px] font-bold text-slate-800">Sprint Progress</div>
                          <div class="flex items-center justify-between">
                            <div class="relative w-12 h-12 flex items-center justify-center">
                              <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path class="text-slate-100" stroke-width="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path class="text-slate-900" stroke-dasharray="67, 100" stroke-width="4" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              </svg>
                              <span class="absolute font-black text-[10px] text-slate-900">67%</span>
                            </div>
                            <div class="text-[9px] space-y-0.5 text-slate-500 font-medium">
                              <div>&bull; Completed: 67%</div>
                              <div>&bull; In Progress: 25%</div>
                            </div>
                          </div>
                        </div>

                        <!-- Issues by Status Bars -->
                        <div class="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                          <div class="text-[10px] font-bold text-slate-800">Issues by Status</div>
                          <div class="space-y-1 text-[9px]">
                            <div class="flex items-center gap-1.5">
                              <span class="w-10 text-slate-400">To Do</span>
                              <div class="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div class="bg-slate-700 h-full w-[45%]"></div>
                              </div>
                              <span class="font-bold text-slate-700">23</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                              <span class="w-10 text-slate-400">In Prog</span>
                              <div class="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div class="bg-purple-500 h-full w-[65%]"></div>
                              </div>
                              <span class="font-bold text-slate-700">34</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                              <span class="w-10 text-slate-400">Done</span>
                              <div class="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div class="bg-[#84cc16] h-full w-[80%]"></div>
                              </div>
                              <span class="font-bold text-slate-700">42</span>
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>

                  </div>
                </div>

                <!-- 4 FLOATING ISOMETRIC GLASS POPUP WIDGETS -->
                
                <!-- 1. Top Floating Card: ACTIVE DEFECT -->
                <div class="absolute -top-5 left-8 sm:left-20 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2.5 shadow-xl shadow-slate-900/10 text-left z-30 animate-fade-in w-52">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0">
                      <i data-lucide="bug" class="w-3.5 h-3.5"></i>
                    </div>
                    <div>
                      <div class="text-[8px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE DEFECT</div>
                      <div class="text-[11px] font-black text-slate-900 leading-tight">BUG-142</div>
                      <div class="text-[9px] text-slate-500 truncate">Checkout payment fails</div>
                    </div>
                  </div>
                  <div class="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between text-[8px]">
                    <span class="px-1.5 py-0.2 bg-rose-500 text-white font-bold rounded-full">CRITICAL</span>
                    <span class="text-slate-500 font-medium">Assigned: Ahmed</span>
                  </div>
                </div>

                <!-- 2. Left Bottom Floating Card: QA VERIFICATION -->
                <div class="absolute -bottom-6 -left-3 sm:-left-6 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2.5 shadow-xl shadow-slate-900/10 text-left z-30 animate-fade-in w-44 text-[10px]">
                  <div class="text-[8px] font-bold text-slate-400 uppercase tracking-wider">QA VERIFICATION</div>
                  <div class="text-[11px] font-black text-slate-900">TC-042</div>
                  <div class="text-slate-500 text-[9px] mb-1 font-medium">Payment Flow</div>
                  <div class="space-y-0.5 text-[9px] border-t border-slate-100 pt-1">
                    <div class="flex items-center justify-between text-slate-700">
                      <span>Login</span><i data-lucide="check" class="w-3 h-3 text-[#84cc16]"></i>
                    </div>
                    <div class="flex items-center justify-between text-slate-700">
                      <span>Checkout</span><i data-lucide="check" class="w-3 h-3 text-[#84cc16]"></i>
                    </div>
                    <div class="flex items-center justify-between text-rose-600 font-bold">
                      <span>Payment</span><i data-lucide="x" class="w-3 h-3 text-rose-600"></i>
                    </div>
                  </div>
                  <div class="mt-1.5 pt-0.5 border-t border-slate-100">
                    <span class="w-full block text-center py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[8px]">
                      RETEST REQUIRED
                    </span>
                  </div>
                </div>

                <!-- 3. Top Right Floating Card: RELEASE READINESS -->
                <div class="absolute -top-3 -right-2 sm:-right-4 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2.5 shadow-xl shadow-slate-900/10 text-left z-30 animate-fade-in w-40">
                  <div class="text-[8px] font-bold text-slate-400 uppercase tracking-wider">RELEASE READINESS</div>
                  <div class="text-[11px] font-black text-slate-900 mb-0.5">Release v2.4.1</div>
                  <div class="flex items-center justify-between py-0.5">
                    <div>
                      <div class="text-[8px] text-slate-400 font-bold">QA PASS RATE</div>
                      <div class="text-xs font-black text-slate-900">94%</div>
                    </div>
                    <div class="w-8 h-8 rounded-full border-2 border-[#84cc16] flex items-center justify-center font-bold text-[9px] text-slate-900">
                      94%
                    </div>
                  </div>
                  <div class="mt-1 pt-0.5 border-t border-slate-100 flex items-center gap-1 text-[8px] text-emerald-700 font-bold">
                    <i data-lucide="check" class="w-2.5 h-2.5 text-emerald-600"></i> Ready for Release
                  </div>
                </div>

                <!-- 4. Bottom Right Floating Card: TEST EXECUTION -->
                <div class="absolute -bottom-4 -right-1 sm:-right-2 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2.5 shadow-xl shadow-slate-900/10 text-left z-30 animate-fade-in w-36">
                  <div class="text-[8px] font-bold text-slate-400 uppercase tracking-wider">TEST EXECUTION</div>
                  <div class="h-7 my-0.5 flex items-end">
                    <svg viewBox="0 0 100 35" class="w-full h-full" fill="none">
                      <path d="M0 25 Q20 30, 40 15 T80 8 T100 2" stroke="#84cc16" stroke-width="2.5" fill="none"/>
                      <path d="M0 25 Q20 30, 40 15 T80 8 T100 2 L100 35 L0 35 Z" fill="rgba(163, 230, 53, 0.15)"/>
                    </svg>
                  </div>
                  <div class="flex items-center justify-between text-[9px] font-bold pt-0.5 border-t border-slate-100">
                    <span class="text-emerald-700">42 Passed</span>
                    <span class="text-rose-600">3 Failed</span>
                  </div>
                </div>

              </div>

            </div>

            <!-- Social Proof Bar -->
            <div class="mt-10 pt-5 border-t border-slate-100 max-w-4xl mx-auto text-center space-y-2.5">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Trusted by modern software teams
              </span>
              <div class="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs font-bold text-slate-700">
                <div class="flex items-center gap-1.5 hover:text-slate-950 transition"><i data-lucide="users" class="w-3.5 h-3.5 text-slate-400"></i><span>QA Teams</span></div>
                <div class="flex items-center gap-1.5 hover:text-slate-950 transition"><i data-lucide="code-2" class="w-3.5 h-3.5 text-slate-400"></i><span>Engineering Teams</span></div>
                <div class="flex items-center gap-1.5 hover:text-slate-950 transition"><i data-lucide="shield" class="w-3.5 h-3.5 text-slate-400"></i><span>Product Teams</span></div>
                <div class="flex items-center gap-1.5 hover:text-slate-950 transition"><i data-lucide="building-2" class="w-3.5 h-3.5 text-slate-400"></i><span>Software Agencies</span></div>
                <div class="flex items-center gap-1.5 hover:text-slate-950 transition"><i data-lucide="rocket" class="w-3.5 h-3.5 text-slate-400"></i><span>Startups & Scaleups</span></div>
              </div>
            </div>

          </div>
        </section>

        <!-- =========================================================================
             3. SECTION 2: THE WORKFLOW PROBLEM
             ========================================================================= -->
        <section class="py-10 sm:py-14 bg-slate-50/60 border-y border-slate-200/80 relative">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
            
            <div class="max-w-3xl mx-auto space-y-1.5">
              <span class="text-xs font-black uppercase tracking-wider text-rose-600 block">
                THE WORKFLOW PROBLEM
              </span>
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Your QA Workflow Shouldn't Live in Five Different Tools.
              </h2>
              <p class="text-xs sm:text-sm text-slate-600 font-normal max-w-2xl mx-auto">
                Stop switching between project management, bug tracking, test cases, spreadsheets, documents and reporting tools.
              </p>
            </div>

            <!-- Comparison Cards -->
            <div class="relative max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-5 lg:gap-7 text-left">
              
              <!-- Left Card: Fragmented -->
              <div class="w-full lg:flex-1 bg-white rounded-3xl border border-rose-200/90 shadow-sm p-5 sm:p-6 space-y-4 relative">
                <div class="flex items-center justify-between border-b border-rose-100 pb-2.5">
                  <span class="text-xs font-extrabold uppercase tracking-wide text-rose-600">FRAGMENTED LEGACY WORKFLOW</span>
                  <span class="text-xs text-slate-400 font-medium">5 Disconnected Tools</span>
                </div>
                <div class="space-y-2.5 font-medium text-xs">
                  <div class="flex items-center justify-between group hover:bg-rose-50/40 p-1.5 rounded-xl transition">
                    <div class="flex items-center gap-2.5"><div class="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold border border-rose-100"><i data-lucide="layout-grid" class="w-3 h-3"></i></div><span class="text-slate-400 font-mono text-[10px] font-bold">01</span><span class="text-slate-800 font-bold">Project Management</span></div><span class="text-rose-600 font-bold text-xs">Jira</span>
                  </div>
                  <div class="flex items-center justify-between group hover:bg-rose-50/40 p-1.5 rounded-xl transition">
                    <div class="flex items-center gap-2.5"><div class="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold border border-rose-100"><i data-lucide="table-2" class="w-3 h-3"></i></div><span class="text-slate-400 font-mono text-[10px] font-bold">02</span><span class="text-slate-800 font-bold">Test Cases</span></div><span class="text-rose-600 font-bold text-xs">MS Excel</span>
                  </div>
                  <div class="flex items-center justify-between group hover:bg-rose-50/40 p-1.5 rounded-xl transition">
                    <div class="flex items-center gap-2.5"><div class="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold border border-rose-100"><i data-lucide="file-text" class="w-3 h-3"></i></div><span class="text-slate-400 font-mono text-[10px] font-bold">03</span><span class="text-slate-800 font-bold">QA Documentation</span></div><span class="text-rose-600 font-bold text-xs">ClickUp / Word</span>
                  </div>
                  <div class="flex items-center justify-between group hover:bg-rose-50/40 p-1.5 rounded-xl transition">
                    <div class="flex items-center gap-2.5"><div class="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold border border-rose-100"><i data-lucide="bug" class="w-3 h-3"></i></div><span class="text-slate-400 font-mono text-[10px] font-bold">04</span><span class="text-slate-800 font-bold">Bug Tracking</span></div><span class="text-rose-600 font-bold text-xs">Bug Tracker</span>
                  </div>
                  <div class="flex items-center justify-between group hover:bg-rose-50/40 p-1.5 rounded-xl transition">
                    <div class="flex items-center gap-2.5"><div class="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold border border-rose-100"><i data-lucide="mail" class="w-3 h-3"></i></div><span class="text-slate-400 font-mono text-[10px] font-bold">05</span><span class="text-slate-800 font-bold">Final Reporting</span></div><span class="text-rose-600 font-bold text-xs">Email / Attachments</span>
                  </div>
                </div>
                <div class="pt-2.5 border-t border-rose-100 flex items-center gap-2 text-rose-600 text-xs font-medium">
                  <i data-lucide="alert-triangle" class="w-4 h-4 shrink-0"></i>
                  <span>Result: Constant manual work, disconnected data, missing context & delayed releases.</span>
                </div>
              </div>

              <!-- Center Arrow -->
              <div class="shrink-0 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 font-bold z-10 my-[-8px] lg:my-0">
                <i data-lucide="arrow-right" class="w-4 h-4 hidden lg:block"></i>
                <i data-lucide="arrow-down" class="w-4 h-4 block lg:hidden"></i>
              </div>

              <!-- Right Card: Unified -->
              <div class="w-full lg:flex-1 bg-white rounded-3xl border-2 border-[#bef264] shadow-md p-5 sm:p-6 space-y-4 relative">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span class="text-xs font-black uppercase tracking-wide text-slate-950">PULSEWAVE UNIFIED PLATFORM</span>
                  <span class="text-xs font-bold text-[#65a30d]">One Single Workspace</span>
                </div>
                <div class="space-y-2.5 font-medium text-xs">
                  <div class="flex items-center justify-between group hover:bg-[#f7fee7]/50 p-1.5 rounded-xl transition">
                    <div class="flex items-center gap-2.5"><div class="w-6 h-6 rounded-lg bg-[#f7fee7] text-[#65a30d] flex items-center justify-center text-xs font-bold border border-[#d9f99d]"><i data-lucide="folder-kanban" class="w-3 h-3"></i></div><span class="text-slate-400 font-mono text-[10px] font-bold">01</span><span class="text-slate-900 font-bold">Project, Backlog & Sprints</span></div><span class="text-slate-950 font-bold text-xs">PulseWave Core</span>
                  </div>
                  <div class="flex items-center justify-between group hover:bg-[#f7fee7]/50 p-1.5 rounded-xl transition">
                    <div class="flex items-center gap-2.5"><div class="w-6 h-6 rounded-lg bg-[#f7fee7] text-[#65a30d] flex items-center justify-center text-xs font-bold border border-[#d9f99d]"><i data-lucide="clipboard-check" class="w-3 h-3"></i></div><span class="text-slate-400 font-mono text-[10px] font-bold">02</span><span class="text-slate-900 font-bold">Test Execution Runner</span></div><span class="text-[#65a30d] font-bold text-xs">Live Matrix</span>
                  </div>
                  <div class="flex items-center justify-between group hover:bg-[#f7fee7]/50 p-1.5 rounded-xl transition">
                    <div class="flex items-center gap-2.5"><div class="w-6 h-6 rounded-lg bg-[#f7fee7] text-[#65a30d] flex items-center justify-center text-xs font-bold border border-[#d9f99d]"><i data-lucide="shield-check" class="w-3 h-3"></i></div><span class="text-slate-400 font-mono text-[10px] font-bold">03</span><span class="text-slate-900 font-bold">Bug Retest & Gate</span></div><span class="text-slate-900 font-bold text-xs">Auto-Linked</span>
                  </div>
                  <div class="flex items-center justify-between group hover:bg-[#f7fee7]/50 p-1.5 rounded-xl transition">
                    <div class="flex items-center gap-2.5"><div class="w-6 h-6 rounded-lg bg-[#f7fee7] text-[#65a30d] flex items-center justify-center text-xs font-bold border border-[#d9f99d]"><i data-lucide="file-check-2" class="w-3 h-3"></i></div><span class="text-slate-400 font-mono text-[10px] font-bold">04</span><span class="text-slate-900 font-bold">Test Report Creator</span></div><span class="text-slate-950 font-bold text-xs">1-Click PDF/Excel</span>
                  </div>
                </div>
                <div class="pt-2.5 border-t border-emerald-100 flex items-center gap-2 text-[#4d7c0f] text-xs font-bold">
                  <i data-lucide="check" class="w-4 h-4 text-[#84cc16] shrink-0"></i>
                  <span>Test once. Document once. Report once. Everything stays connected.</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        <!-- =========================================================================
             3. 3D INTERACTIVE WORKSPACE FLOW (Stop Reconciling Three Tools)
             ========================================================================= -->
        <section class="py-12 sm:py-16 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/40 border-b border-slate-200/80 relative overflow-hidden">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              <!-- Left Column: Copy & Primary Button -->
              <div class="md:col-span-7 space-y-4 text-left">
                <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                  Stop reconciling three tools at the end of every sprint.
                </h2>
                <p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-md">
                  Open the workspace and walk the full V1 flow &mdash; board, queue, suites, runs, defects.
                </p>
                <div class="pt-2">
                  <button onclick="window.app.navigate('dashboard')" class="px-6 py-3 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#bef264]/25 transition transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2">
                    <span>Open workspace</span>
                  </button>
                </div>
              </div>

              <!-- Right Column: 3D Auto-Movable Rotating Glass Isometric Cube -->
              <div class="md:col-span-5 flex items-center justify-center relative py-4">
                
                <!-- Ambient Backdrop Glow -->
                <div class="absolute w-52 h-52 bg-gradient-to-tr from-blue-400/25 via-[#38bdf8]/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>

                <!-- 3D Cube Scene -->
                <div class="cube-scene cursor-grab active:cursor-grabbing" 
                     onmousemove="const cube = this.querySelector('.cube-3d-wrap'); if(cube){ const r = this.getBoundingClientRect(); const x = (event.clientX - r.left) / r.width - 0.5; const y = (event.clientY - r.top) / r.height - 0.5; cube.style.transform = 'rotateX(' + (-18 - y * 30) + 'deg) rotateY(' + (x * 40) + 'deg)'; }"
                     onmouseleave="const cube = this.querySelector('.cube-3d-wrap'); if(cube){ cube.style.transform = ''; }">
                  <div class="cube-3d-wrap">
                    <div class="cube-3d-face cube-face-front">BUILD</div>
                    <div class="cube-3d-face cube-face-back">TRACK</div>
                    <div class="cube-3d-face cube-face-right">TEST</div>
                    <div class="cube-3d-face cube-face-left">PLAN</div>
                    <div class="cube-3d-face cube-face-top">SHIP</div>
                    <div class="cube-3d-face cube-face-bottom">REPORT</div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        <!-- =========================================================================
             4. CORE CAPABILITIES
             ========================================================================= -->
        <section id="features" class="py-10 sm:py-14 bg-white border-b border-slate-200/80">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div class="text-center max-w-3xl mx-auto space-y-1.5">
              <span class="text-xs font-black uppercase tracking-wider text-slate-900 block">CORE CAPABILITIES</span>
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Everything Your QA Team Needs. In One Workspace.
              </h2>
              <p class="text-xs sm:text-sm text-slate-600 font-normal max-w-xl mx-auto">
                Purpose-built to bridge engineering sprints, testing executions, and executive client deliverables.
              </p>
            </div>

            <!-- Bento Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              <!-- 01: Project Management -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 flex flex-col justify-between space-y-4 text-left">
                <div class="space-y-2.5">
                  <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold border border-slate-200">
                    <i data-lucide="folder-kanban" class="w-4.5 h-4.5"></i>
                  </div>
                  <h3 class="text-sm font-extrabold text-slate-950">Project Management</h3>
                  <p class="text-xs text-slate-600 leading-relaxed font-normal">
                    Track projects, releases, sprints, team workload and overall health across delivery pipelines.
                  </p>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-bold text-slate-800 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-slate-950"></span> Sprint 08 Active</span>
                    <span class="text-slate-900 font-mono font-bold">92% Done</span>
                  </div>
                  <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"><div class="bg-slate-950 h-full w-[92%]"></div></div>
                </div>
              </div>

              <!-- 02: Issue & Bug Tracking -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 flex flex-col justify-between space-y-4 text-left">
                <div class="space-y-2.5">
                  <div class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-100">
                    <i data-lucide="bug" class="w-4.5 h-4.5"></i>
                  </div>
                  <h3 class="text-sm font-extrabold text-slate-950">Issue & Bug Tracking</h3>
                  <p class="text-xs text-slate-600 leading-relaxed font-normal">
                    Create, assign, prioritize and track bugs from discovery to developer fix and QA retesting.
                  </p>
                </div>
                <div class="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1.5 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-rose-600 text-[10px]">BUG-142</span>
                    <span class="px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold text-[8px]">CRITICAL</span>
                  </div>
                  <div class="text-[10px] text-slate-600">Checkout token timeout &bull; <strong class="text-amber-700">Auto-Linked</strong></div>
                </div>
              </div>

              <!-- 03: QA Testing -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 flex flex-col justify-between space-y-4 text-left">
                <div class="space-y-2.5">
                  <div class="w-9 h-9 rounded-xl bg-[#f7fee7] text-[#65a30d] flex items-center justify-center font-bold border border-[#d9f99d]">
                    <i data-lucide="clipboard-check" class="w-4.5 h-4.5"></i>
                  </div>
                  <h3 class="text-sm font-extrabold text-slate-950">QA Testing</h3>
                  <p class="text-xs text-slate-600 leading-relaxed font-normal">
                    Create test cases, execute test suites, and track Pass, Fail and Blocked telemetry live.
                  </p>
                </div>
                <div class="p-2.5 rounded-xl bg-[#f7fee7]/40 border border-[#d9f99d] flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-800 text-[11px]">Runner Suite</span>
                  <span class="px-2 py-0.5 rounded bg-white text-[#4d7c0f] font-mono font-bold text-[10px] border border-[#d9f99d]">94.2% PASS ✓</span>
                </div>
              </div>

              <!-- 04: Documentation Studio -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 flex flex-col justify-between space-y-4 text-left">
                <div class="space-y-2.5">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
                    <i data-lucide="file-text" class="w-4.5 h-4.5"></i>
                  </div>
                  <h3 class="text-sm font-extrabold text-slate-950">Documentation Studio</h3>
                  <p class="text-xs text-slate-600 leading-relaxed font-normal">
                    Author ClickUp-style documents and MS Excel spreadsheet grids directly inside PulseWave.
                  </p>
                </div>
                <div class="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-[10px]">
                  <span>📄 QA Strategy Doc</span>
                  <strong class="text-indigo-700">📊 Excel Matrix</strong>
                </div>
              </div>

              <!-- 05: Professional Reporting -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 flex flex-col justify-between space-y-4 text-left">
                <div class="space-y-2.5">
                  <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
                    <i data-lucide="file-check-2" class="w-4.5 h-4.5"></i>
                  </div>
                  <h3 class="text-sm font-extrabold text-slate-950">Professional Reporting</h3>
                  <p class="text-xs text-slate-600 leading-relaxed font-normal">
                    Generate structured QA test reports pulling live test cases, steps, and expected vs actual results.
                  </p>
                </div>
                <div class="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between text-[10px]">
                  <span class="font-bold text-slate-700">1-Click Export:</span>
                  <div class="flex gap-1"><span class="px-1.5 py-0.2 bg-white rounded border border-amber-200 font-bold">PDF</span><span class="px-1.5 py-0.2 bg-white rounded border border-amber-200 font-bold">Excel</span><span class="px-1.5 py-0.2 bg-white rounded border border-amber-200 font-bold">Word</span></div>
                </div>
              </div>

              <!-- 06: Customer Delivery -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 flex flex-col justify-between space-y-4 text-left">
                <div class="space-y-2.5">
                  <div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-100">
                    <i data-lucide="award" class="w-4.5 h-4.5"></i>
                  </div>
                  <h3 class="text-sm font-extrabold text-slate-950">Customer Delivery</h3>
                  <p class="text-xs text-slate-600 leading-relaxed font-normal">
                    Prepare executive-ready deliverables with verified scope, quality gate clearance, and sign-off.
                  </p>
                </div>
                <div class="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between text-[10px]">
                  <span class="font-bold text-slate-800">Quality Gate:</span>
                  <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">PASSED ✓</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        <!-- =========================================================================
             5. THE CONNECTED LIFECYCLE
             ========================================================================= -->
        <section id="workflow" class="py-10 sm:py-14 bg-slate-50/60 border-b border-slate-200/80 relative">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div class="text-center max-w-3xl mx-auto space-y-1.5">
              <span class="text-xs font-black uppercase tracking-wider text-slate-900 block">THE CONNECTED LIFECYCLE</span>
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                From Bug Discovery to Customer Report.
              </h2>
              <p class="text-xs sm:text-sm text-slate-600 font-normal max-w-xl mx-auto">
                Every step is connected. Every update is shared. Everyone stays aligned.
              </p>
            </div>

            <!-- 9-Step Connected Cards Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2.5 items-stretch">
              <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2 text-left">
                <div class="flex items-center justify-between"><div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-bold border border-slate-200"><i data-lucide="folder" class="w-3.5 h-3.5"></i></div><span class="font-mono text-[10px] font-black text-slate-900">01</span></div>
                <div><strong class="block text-slate-950 text-xs font-extrabold">Create Project</strong><p class="text-[10px] text-slate-500 leading-tight">Plan releases.</p></div>
              </div>
              <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2 text-left">
                <div class="flex items-center justify-between"><div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-bold border border-slate-200"><i data-lucide="list-todo" class="w-3.5 h-3.5"></i></div><span class="font-mono text-[10px] font-black text-slate-900">02</span></div>
                <div><strong class="block text-slate-950 text-xs font-extrabold">User Stories</strong><p class="text-[10px] text-slate-500 leading-tight">Define scope.</p></div>
              </div>
              <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2 text-left">
                <div class="flex items-center justify-between"><div class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold border border-purple-100"><i data-lucide="user-check" class="w-3.5 h-3.5"></i></div><span class="font-mono text-[10px] font-black text-purple-600">03</span></div>
                <div><strong class="block text-slate-950 text-xs font-extrabold">Assign QA</strong><p class="text-[10px] text-slate-500 leading-tight">Prioritize tasks.</p></div>
              </div>
              <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2 text-left">
                <div class="flex items-center justify-between"><div class="w-7 h-7 rounded-lg bg-[#f7fee7] text-[#65a30d] flex items-center justify-center text-xs font-bold border border-[#d9f99d]"><i data-lucide="play" class="w-3.5 h-3.5 fill-[#65a30d]"></i></div><span class="font-mono text-[10px] font-black text-[#65a30d]">04</span></div>
                <div><strong class="block text-slate-950 text-xs font-extrabold">Execute Tests</strong><p class="text-[10px] text-slate-500 leading-tight">Capture results.</p></div>
              </div>
              <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2 text-left">
                <div class="flex items-center justify-between"><div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold border border-rose-100"><i data-lucide="bug" class="w-3.5 h-3.5"></i></div><span class="font-mono text-[10px] font-black text-rose-600">05</span></div>
                <div><strong class="block text-slate-950 text-xs font-extrabold">Log Bug</strong><p class="text-[10px] text-slate-500 leading-tight">Context evidence.</p></div>
              </div>
              <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2 text-left">
                <div class="flex items-center justify-between"><div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold border border-amber-100"><i data-lucide="code-2" class="w-3.5 h-3.5"></i></div><span class="font-mono text-[10px] font-black text-amber-600">06</span></div>
                <div><strong class="block text-slate-950 text-xs font-extrabold">Dev Fix</strong><p class="text-[10px] text-slate-500 leading-tight">Push resolution.</p></div>
              </div>
              <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2 text-left">
                <div class="flex items-center justify-between"><div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold border border-emerald-100"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i></div><span class="font-mono text-[10px] font-black text-emerald-600">07</span></div>
                <div><strong class="block text-slate-950 text-xs font-extrabold">QA Retest</strong><p class="text-[10px] text-slate-500 leading-tight">Verify fix.</p></div>
              </div>
              <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2 text-left">
                <div class="flex items-center justify-between"><div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-bold border border-slate-200"><i data-lucide="file-text" class="w-3.5 h-3.5"></i></div><span class="font-mono text-[10px] font-black text-slate-900">08</span></div>
                <div><strong class="block text-slate-950 text-xs font-extrabold">QA Report</strong><p class="text-[10px] text-slate-500 leading-tight">Generate report.</p></div>
              </div>
              <div class="bg-slate-950 text-white rounded-2xl p-3.5 border border-slate-900 shadow-lg flex flex-col justify-between space-y-2 text-left">
                <div class="flex items-center justify-between"><div class="w-7 h-7 rounded-lg bg-[#84cc16] text-slate-950 flex items-center justify-center text-xs font-bold"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i></div><span class="font-mono text-[10px] font-black text-[#bef264]">09</span></div>
                <div><strong class="block text-white text-xs font-extrabold">Sign-Off</strong><p class="text-[10px] text-slate-400 leading-tight">Release live.</p></div>
              </div>
            </div>

            <!-- Bottom Highlight Banner -->
            <div class="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-sm max-w-3xl mx-auto text-xs text-slate-700 text-center font-medium flex items-center justify-center gap-2">
              <span class="text-base text-[#84cc16]">✨</span>
              <span><strong class="text-slate-950 font-bold">Everything stays connected.</strong> When a test fails, the bug auto-populates. When verified, the final QA report updates automatically.</span>
            </div>

          </div>
        </section>

        <!-- =========================================================================
             6. QA REPORTING SECTION (Exact Match to Reference Design)
             ========================================================================= -->
        <section id="reporting" class="py-12 sm:py-16 bg-white border-b border-slate-200 relative overflow-hidden">
          
          <!-- Background Subtle Radial Gradient Ring -->
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-r from-[#d9f99d]/20 via-[#bef264]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <!-- Section Header -->
            <div class="text-center max-w-3xl mx-auto space-y-2">
              <span class="text-xs font-black uppercase tracking-wider text-[#84cc16] block">
                CORPORATE DELIVERABLES
              </span>
              <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                Turn Testing Into a <br class="hidden sm:inline" />
                <span class="text-[#84cc16]">Professional</span> Report.
              </h2>
              <p class="text-xs sm:text-sm text-slate-600 font-normal max-w-xl mx-auto">
                Create structured QA reports directly from the same workspace where your testing happens.
              </p>
            </div>

            <!-- Main White Report Console Container -->
            <div class="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/5 p-6 sm:p-8 space-y-6 text-left relative">
              
              <!-- Document Header Row -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-1.5 text-slate-900 font-mono text-[10px] font-bold tracking-wider uppercase">
                    <i data-lucide="file-check-2" class="w-3.5 h-3.5"></i>
                    <span>TEST REPORT CREATOR</span>
                  </div>
                  <h3 class="text-base sm:text-lg font-black text-slate-950 tracking-tight">
                    Annoushka Integration Test Report (Release v2.4.1)
                  </h3>
                  <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-0.5">
                    <span class="flex items-center gap-1.5">
                      <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i> Apr 24, 2026
                    </span>
                    <span class="flex items-center gap-1.5">
                      <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i> Prepared by Ahmed Raza
                    </span>
                    <span class="flex items-center gap-1.5">
                      <i data-lucide="tag" class="w-3.5 h-3.5 text-slate-400"></i> Project: Annoushka
                    </span>
                  </div>
                </div>

                <!-- Verified Badge -->
                <div class="shrink-0 self-start sm:self-center">
                  <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] font-extrabold text-xs shadow-2xs">
                    <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-[#84cc16]"></i>
                    <span>FINAL &bull; 94% PASS RATE</span>
                  </span>
                </div>
              </div>

              <!-- 6 Structured Report Component Cards (2 Col Grid) -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                <!-- 01: Test Information -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/50 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition flex items-center justify-between gap-3 group cursor-pointer" onclick="window.app.navigate('test-reports')">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0 border border-slate-200">
                      <i data-lucide="file-text" class="w-4.5 h-4.5"></i>
                    </div>
                    <div class="truncate">
                      <div class="flex items-center gap-1.5">
                        <span class="font-mono text-slate-900 font-bold text-xs">01</span>
                        <strong class="text-xs font-bold text-slate-900">Test Information</strong>
                      </div>
                      <p class="text-[11px] text-slate-500 truncate font-normal mt-0.5">
                        Title, scope, objectives, environment & location
                      </p>
                    </div>
                  </div>
                  <div class="w-6 h-6 rounded-full bg-slate-100 text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-200 flex items-center justify-center shrink-0 transition">
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </div>
                </div>

                <!-- 02: Pre-requisites -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/50 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition flex items-center justify-between gap-3 group cursor-pointer" onclick="window.app.navigate('test-reports')">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 border border-purple-100">
                      <i data-lucide="database" class="w-4.5 h-4.5"></i>
                    </div>
                    <div class="truncate">
                      <div class="flex items-center gap-1.5">
                        <span class="font-mono text-purple-600 font-bold text-xs">02</span>
                        <strong class="text-xs font-bold text-slate-900">Pre-requisites</strong>
                      </div>
                      <p class="text-[11px] text-slate-500 truncate font-normal mt-0.5">
                        Test environment, credentials, database & test data setup
                      </p>
                    </div>
                  </div>
                  <div class="w-6 h-6 rounded-full bg-slate-100 text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-200 flex items-center justify-center shrink-0 transition">
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </div>
                </div>

                <!-- 03: Custom Test Data -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/50 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition flex items-center justify-between gap-3 group cursor-pointer" onclick="window.app.navigate('test-reports')">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold shrink-0 border border-cyan-100">
                      <i data-lucide="package" class="w-4.5 h-4.5"></i>
                    </div>
                    <div class="truncate">
                      <div class="flex items-center gap-1.5">
                        <span class="font-mono text-cyan-600 font-bold text-xs">03</span>
                        <strong class="text-xs font-bold text-slate-900">Custom Test Data</strong>
                      </div>
                      <p class="text-[11px] text-slate-500 truncate font-normal mt-0.5">
                        SKU details, orders, payloads & input data
                      </p>
                    </div>
                  </div>
                  <div class="w-6 h-6 rounded-full bg-slate-100 text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-200 flex items-center justify-center shrink-0 transition">
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </div>
                </div>

                <!-- 04: Expected vs Actual -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/50 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition flex items-center justify-between gap-3 group cursor-pointer" onclick="window.app.navigate('test-reports')">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-100">
                      <i data-lucide="code-2" class="w-4.5 h-4.5"></i>
                    </div>
                    <div class="truncate">
                      <div class="flex items-center gap-1.5">
                        <span class="font-mono text-amber-600 font-bold text-xs">04</span>
                        <strong class="text-xs font-bold text-slate-900">Expected vs Actual</strong>
                      </div>
                      <p class="text-[11px] text-slate-500 truncate font-normal mt-0.5">
                        Step-by-step execution, expected vs actual results
                      </p>
                    </div>
                  </div>
                  <div class="w-6 h-6 rounded-full bg-slate-100 text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-200 flex items-center justify-center shrink-0 transition">
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </div>
                </div>

                <!-- 05: Defect Summary -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/50 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition flex items-center justify-between gap-3 group cursor-pointer" onclick="window.app.navigate('test-reports')">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 border border-rose-100">
                      <i data-lucide="bug" class="w-4.5 h-4.5"></i>
                    </div>
                    <div class="truncate">
                      <div class="flex items-center gap-1.5">
                        <span class="font-mono text-rose-600 font-bold text-xs">05</span>
                        <strong class="text-xs font-bold text-slate-900">Defect Summary</strong>
                      </div>
                      <p class="text-[11px] text-slate-500 truncate font-normal mt-0.5">
                        Linked bugs, severity, root cause & status
                      </p>
                    </div>
                  </div>
                  <div class="w-6 h-6 rounded-full bg-slate-100 text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-200 flex items-center justify-center shrink-0 transition">
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </div>
                </div>

                <!-- 06: Quality Gate Status -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/50 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition flex items-center justify-between gap-3 group cursor-pointer" onclick="window.app.navigate('test-reports')">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
                      <i data-lucide="shield-check" class="w-4.5 h-4.5"></i>
                    </div>
                    <div class="truncate">
                      <div class="flex items-center gap-1.5">
                        <span class="font-mono text-emerald-600 font-bold text-xs">06</span>
                        <strong class="text-xs font-bold text-slate-900">Quality Gate Status</strong>
                      </div>
                      <p class="text-[11px] font-extrabold text-[#4d7c0f] truncate mt-0.5">
                        READY FOR RELEASE ✓ <span class="text-slate-400 font-normal ml-1">All quality criteria passed</span>
                      </p>
                    </div>
                  </div>
                  <div class="w-6 h-6 rounded-full bg-slate-100 text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-200 flex items-center justify-center shrink-0 transition">
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </div>
                </div>

              </div>

              <!-- Bottom Action Bar -->
              <div class="pt-5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <!-- Left: Export Pills -->
                <div class="space-y-1.5">
                  <span class="text-xs font-bold text-slate-900 block">Export & Share Report</span>
                  <div class="flex flex-wrap items-center gap-2 text-xs">
                    <button onclick="window.app.navigate('test-reports')" class="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 transition">
                      <i data-lucide="file" class="w-3.5 h-3.5 text-rose-500"></i>
                      <span>PDF</span>
                    </button>
                    <button onclick="window.app.navigate('test-reports')" class="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 transition">
                      <i data-lucide="sheet" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>MS Excel (.xlsx)</span>
                    </button>
                    <button onclick="window.app.navigate('test-reports')" class="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 transition">
                      <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-900"></i>
                      <span>MS Word (.docx)</span>
                    </button>
                    <button onclick="window.app.navigate('test-reports')" class="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-2xs transition" title="Share Report">
                      <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>

                <!-- Right: Explore Creator CTA Button -->
                <div>
                  <button onclick="window.app.navigate('test-reports')" class="w-full sm:w-auto px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
                    <i data-lucide="file-check-2" class="w-4 h-4"></i>
                    <span>Explore Test Report Creator</span>
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                  </button>
                </div>

              </div>

            </div>

            <!-- 4 Value Features Grid Below Console -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left pt-2">
              
              <div class="flex items-start gap-3 p-3">
                <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
                  <i data-lucide="shield" class="w-4 h-4"></i>
                </div>
                <div>
                  <strong class="block text-slate-950 font-bold text-xs">Consistent & Structured</strong>
                  <p class="text-[11px] text-slate-500 leading-relaxed font-normal mt-0.5">Standardized templates for every project and release.</p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-3">
                <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0 border border-slate-200">
                  <i data-lucide="zap" class="w-4 h-4"></i>
                </div>
                <div>
                  <strong class="block text-slate-950 font-bold text-xs">Auto-Connected</strong>
                  <p class="text-[11px] text-slate-500 leading-relaxed font-normal mt-0.5">Live data from tests, bugs & retests — always in sync.</p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-3">
                <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 border border-purple-100">
                  <i data-lucide="pie-chart" class="w-4 h-4"></i>
                </div>
                <div>
                  <strong class="block text-slate-950 font-bold text-xs">Accurate & Reliable</strong>
                  <p class="text-[11px] text-slate-500 leading-relaxed font-normal mt-0.5">Real-time results for confident release decisions.</p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-3">
                <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-100">
                  <i data-lucide="lock" class="w-4 h-4"></i>
                </div>
                <div>
                  <strong class="block text-slate-950 font-bold text-xs">Secure & Professional</strong>
                  <p class="text-[11px] text-slate-500 leading-relaxed font-normal mt-0.5">Share with clients and stakeholders with confidence.</p>
                </div>
              </div>

            </div>

          </div>
        </section>

        <!-- =========================================================================
             7. ROLE-BASED WORKSPACES (Exact Match to Reference Design)
             ========================================================================= -->
        <section id="personas" class="py-12 sm:py-16 bg-white border-b border-slate-200 relative overflow-hidden">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <div class="text-center max-w-3xl mx-auto space-y-2">
              <span class="text-xs font-black uppercase tracking-wider text-[#84cc16] block">
                ROLE-BASED WORKSPACES
              </span>
              <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                One Platform. Different Workspaces.
              </h2>
            </div>

            <!-- 4 Role Cards Grid with Integrated Micro-Widgets -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <!-- 1. QA Engineers -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 text-left">
                <div class="space-y-3">
                  <div class="w-10 h-10 rounded-2xl bg-[#f7fee7] text-[#65a30d] flex items-center justify-center font-bold border border-[#d9f99d]">
                    <i data-lucide="flask-conical" class="w-5 h-5"></i>
                  </div>
                  <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-950">QA ENGINEERS</h3>
                  <div class="space-y-1.5 text-xs font-medium text-slate-600">
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-[#84cc16]"></i><span>Test cases & suites</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-[#84cc16]"></i><span>Test execution runner</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-[#84cc16]"></i><span>Bug verification & retests</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-[#84cc16]"></i><span>Corporate QA reports</span></div>
                  </div>
                </div>
                <!-- Embedded Micro-Widget -->
                <div class="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 relative">
                  <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>Test Cases</span>
                    <span class="w-4 h-4 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-[8px]"><i data-lucide="bug" class="w-2.5 h-2.5"></i></span>
                  </div>
                  <div class="flex items-center justify-center py-1">
                    <div class="relative w-12 h-12 flex items-center justify-center">
                      <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path class="text-slate-200" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="text-slate-900" stroke-dasharray="85, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span class="absolute font-extrabold text-[10px] text-slate-900">85%</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. Project Managers -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 text-left">
                <div class="space-y-3">
                  <div class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold border border-slate-200">
                    <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
                  </div>
                  <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-950">PROJECT MANAGERS</h3>
                  <div class="space-y-1.5 text-xs font-medium text-slate-600">
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-slate-900"></i><span>Project & sprint health</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-slate-900"></i><span>Release tracking burndown</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-slate-900"></i><span>Quality Gate clearance</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-slate-900"></i><span>Team workload capacity</span></div>
                  </div>
                </div>
                <!-- Embedded Micro-Widget -->
                <div class="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 space-y-1.5">
                  <div class="h-8 flex items-end">
                    <svg viewBox="0 0 100 30" class="w-full h-full" fill="none">
                      <path d="M0 25 L30 18 L60 22 L100 5" stroke="#3b82f6" stroke-width="2" fill="none"/>
                      <path d="M0 25 L30 18 L60 22 L100 5 L100 30 L0 30 Z" fill="rgba(59, 130, 246, 0.1)"/>
                    </svg>
                  </div>
                  <div class="flex items-center justify-between text-[9px] pt-1 border-t border-slate-200">
                    <div class="flex items-end gap-1 h-3">
                      <div class="w-1.5 bg-slate-500 h-2 rounded-xs"></div>
                      <div class="w-1.5 bg-slate-1000 h-3 rounded-xs"></div>
                      <div class="w-1.5 bg-[#84cc16] h-2.5 rounded-xs"></div>
                    </div>
                    <span class="px-1.5 py-0.2 rounded bg-emerald-50 text-[#4d7c0f] font-bold text-[8px] flex items-center gap-0.5">
                      <span class="w-1 h-1 rounded-full bg-[#84cc16]"></span> On Track
                    </span>
                  </div>
                </div>
              </div>

              <!-- 3. Developers -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 text-left">
                <div class="space-y-3">
                  <div class="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-100">
                    <i data-lucide="code-2" class="w-5 h-5"></i>
                  </div>
                  <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-950">DEVELOPERS</h3>
                  <div class="space-y-1.5 text-xs font-medium text-slate-600">
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-purple-600"></i><span>Assigned issue board</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-purple-600"></i><span>Exact bug steps & logs</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-purple-600"></i><span>Commit & PR linking</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-purple-600"></i><span>QA retest feedback loop</span></div>
                  </div>
                </div>
                <!-- Embedded Micro-Widget -->
                <div class="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 space-y-1">
                  <div class="text-[9px] font-bold text-slate-400">Bug Details</div>
                  <div class="space-y-1 text-[8px]">
                    <div class="h-1.5 w-3/4 bg-amber-200 rounded-full"></div>
                    <div class="h-1.5 w-1/2 bg-slate-200 rounded-full"></div>
                    <div class="flex items-center gap-1 pt-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span class="text-slate-600 text-[8px] font-medium">Auto-Retest Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 4. Customers (Coming Soon) -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 text-left relative">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
                      <i data-lucide="users" class="w-5 h-5"></i>
                    </div>
                    <span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[9px] border border-amber-200 flex items-center gap-1">
                      <span>COMING SOON</span>
                      <i data-lucide="lock" class="w-2.5 h-2.5"></i>
                    </span>
                  </div>
                  <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-950">CUSTOMERS</h3>
                  <div class="space-y-1.5 text-xs font-medium text-slate-600">
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-amber-600"></i><span>Milestone visibility</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-amber-600"></i><span>Verified release notes</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-amber-600"></i><span>UAT acceptance sign-off</span></div>
                    <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-amber-600"></i><span>Customer deliverables</span></div>
                  </div>
                </div>
                <!-- Embedded Micro-Widget -->
                <div class="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between">
                  <div class="space-y-1 flex-1 pr-2">
                    <div class="h-1.5 w-3/4 bg-slate-300 rounded-full"></div>
                    <div class="h-1.5 w-1/2 bg-slate-200 rounded-full"></div>
                  </div>
                  <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        <!-- =========================================================================
             8. PRODUCT VISION (Roadmap - Exact Match to Reference Design)
             ========================================================================= -->
        <section id="roadmap" class="py-12 sm:py-16 bg-slate-50/60 border-b border-slate-200 relative overflow-hidden">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <div class="text-center max-w-3xl mx-auto space-y-2">
              <span class="text-xs font-black uppercase tracking-wider text-[#84cc16] block">
                PRODUCT VISION
              </span>
              <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                PulseWave Is Just Getting Started.
              </h2>
            </div>

            <!-- 3 Roadmap Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
              
              <!-- 01: V1 Current -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="w-9 h-9 rounded-2xl bg-[#84cc16] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      V1
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                      CURRENT ✓
                    </span>
                  </div>
                  <h4 class="font-extrabold text-slate-950 text-sm">Project & Issue Management</h4>
                  <p class="text-slate-600 text-xs leading-relaxed font-normal">
                    Dashboard, Workspace, Sprints, Kanban Board, Defect Tracking, and QA Queue.
                  </p>
                </div>
                <div class="p-2.5 rounded-2xl bg-[#f7fee7] border border-[#d9f99d] flex items-center justify-around text-[10px] font-bold text-[#4d7c0f]">
                  <span class="flex items-center gap-1"><i data-lucide="check" class="w-3 h-3 text-[#84cc16]"></i> Stable</span>
                  <span class="flex items-center gap-1"><i data-lucide="check" class="w-3 h-3 text-[#84cc16]"></i> Used Daily</span>
                  <span class="flex items-center gap-1"><i data-lucide="check" class="w-3 h-3 text-[#84cc16]"></i> Loved by Teams</span>
                </div>
              </div>

              <!-- 02: V2 Live Now -->
              <div class="bg-white rounded-3xl p-5 border-2 border-slate-950 shadow-md flex flex-col justify-between space-y-4 relative">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="w-9 h-9 rounded-2xl bg-slate-950 text-[#bef264] flex items-center justify-center font-black text-xs shadow-xs">
                      V2
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full bg-slate-900 text-[#bef264] font-bold text-[10px] border border-slate-200 flex items-center gap-1">
                      <span>LIVE NOW</span>
                      <i data-lucide="rocket" class="w-3 h-3"></i>
                    </span>
                  </div>
                  <h4 class="font-extrabold text-slate-950 text-sm">QA Testing & Documentation</h4>
                  <p class="text-slate-600 text-xs leading-relaxed font-normal">
                    Test Management, Execution Runner, Dedicated Test Report Creator, ClickUp & Excel Studio.
                  </p>
                </div>
                <div class="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-around text-[10px] font-bold text-slate-900">
                  <span class="flex items-center gap-1">✦ Connected</span>
                  <span class="flex items-center gap-1">✦ Automated</span>
                  <span class="flex items-center gap-1">✦ Reporting</span>
                </div>
              </div>

              <!-- 03: V3 Coming Soon -->
              <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4 opacity-90">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      V3
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200 flex items-center gap-1">
                      <span>COMING SOON</span>
                      <i data-lucide="lock" class="w-2.5 h-2.5"></i>
                    </span>
                  </div>
                  <h4 class="font-extrabold text-slate-950 text-sm">Ecosystem & Automation</h4>
                  <p class="text-slate-600 text-xs leading-relaxed font-normal">
                    Customer Portal, Real-Time Project Chat, AI Quality Assistant, and CI/CD Integrations.
                  </p>
                </div>
                <div class="p-2.5 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-around text-[10px] font-bold text-purple-700">
                  <span class="flex items-center gap-1"><i data-lucide="lock" class="w-2.5 h-2.5"></i> Intelligent</span>
                  <span class="flex items-center gap-1"><i data-lucide="lock" class="w-2.5 h-2.5"></i> Automated</span>
                  <span class="flex items-center gap-1"><i data-lucide="lock" class="w-2.5 h-2.5"></i> Integrated</span>
                </div>
              </div>

            </div>

            <!-- Connected Horizontal Process Rail Below Cards -->
            <div class="hidden md:block relative pt-2 max-w-5xl mx-auto">
              <div class="flex items-center justify-between relative">
                
                <!-- Left Solid Lime Circle -->
                <div class="w-4 h-4 rounded-full bg-white border-4 border-[#84cc16] shadow-xs z-10"></div>
                
                <!-- Line 1: Lime to Blue -->
                <div class="flex-1 h-0.5 bg-gradient-to-r from-[#84cc16] to-blue-500"></div>
                
                <!-- Center Solid Blue Circle -->
                <div class="w-4 h-4 rounded-full bg-white border-4 border-slate-950 shadow-xs z-10"></div>
                
                <!-- Line 2: Blue to Purple -->
                <div class="flex-1 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                
                <!-- Right Solid Purple Circle -->
                <div class="w-4 h-4 rounded-full bg-white border-4 border-purple-600 shadow-xs z-10"></div>
                
                <!-- Line 3: Dashed Purple Connector -->
                <div class="w-20 border-t-2 border-dashed border-purple-300"></div>
                
                <!-- Final Dashed Circle Ring -->
                <div class="w-4 h-4 rounded-full border-2 border-purple-400 bg-white z-10"></div>

              </div>
            </div>

          </div>
        </section>

        <!-- =========================================================================
             9. FINAL CALL TO ACTION (CTA)
             ========================================================================= -->
        <section class="py-12 sm:py-16 bg-slate-950 text-white text-center">
          <div class="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
            <h2 class="text-2xl sm:text-4xl font-bold tracking-tight">
              Ready to Simplify Your QA Workflow?
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-normal">
              Bring projects, issues, testing, documentation and reporting into one workspace.
            </p>
            
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button onclick="window.app.navigate('signup')" class="w-full sm:w-auto px-6 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2">
                <span>Get Started Free</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="window.app.navigate('login')" class="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer">
                Sign In to Account
              </button>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             10. FOOTER
             ========================================================================= -->
        <footer class="bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-6 text-left">
              
              <div class="col-span-2 space-y-2">
                <div class="flex items-center gap-2">
                  <div class="w-5 h-5 grid grid-cols-2 gap-0.5">
                    <div class="bg-[#84cc16] rounded-xs"></div>
                    <div class="bg-slate-950 rounded-xs"></div>
                    <div class="bg-slate-950 rounded-xs"></div>
                    <div class="bg-slate-950 rounded-xs"></div>
                  </div>
                  <span class="text-sm font-bold text-slate-900">PulseWave QA</span>
                </div>
                <p class="text-slate-500 text-[11px] max-w-xs leading-relaxed font-normal">
                  One workspace for your entire software delivery, QA testing, and customer reporting workflow.
                </p>
              </div>

              <div class="space-y-1.5">
                <strong class="text-slate-900 block font-bold uppercase tracking-wider text-[10px]">Product</strong>
                <ul class="space-y-1 text-slate-600">
                  <li><button onclick="LandingPageView.scrollToSection('features')" class="hover:text-slate-950 transition cursor-pointer text-left">Features</button></li>
                  <li><button onclick="LandingPageView.scrollToSection('workflow')" class="hover:text-slate-950 transition cursor-pointer text-left">Workflow</button></li>
                  <li><button onclick="LandingPageView.scrollToSection('reporting')" class="hover:text-slate-950 transition cursor-pointer text-left">Test Reports</button></li>
                  <li><button onclick="LandingPageView.scrollToSection('personas')" class="hover:text-slate-950 transition cursor-pointer text-left">Workspaces</button></li>
                  <li><button onclick="LandingPageView.scrollToSection('roadmap')" class="hover:text-slate-950 transition cursor-pointer text-left">Roadmap</button></li>
                </ul>
              </div>

              <div class="space-y-1.5">
                <strong class="text-slate-900 block font-bold uppercase tracking-wider text-[10px]">Resources</strong>
                <ul class="space-y-1 text-slate-600">
                  <li><button onclick="LandingPageView.scrollToSection('workflow')" class="hover:text-slate-950 transition cursor-pointer text-left">Workflow Guide</button></li>
                  <li><a href="#" onclick="window.app.navigate('dashboard')" class="hover:text-slate-950 transition">Live Demo</a></li>
                  <li><a href="#" onclick="window.app.openHelpModal()" class="hover:text-slate-950 transition">Help Center</a></li>
                </ul>
              </div>

              <div class="space-y-1.5">
                <strong class="text-slate-900 block font-bold uppercase tracking-wider text-[10px]">Legal</strong>
                <ul class="space-y-1 text-slate-600">
                  <li><a href="#" class="hover:text-slate-950 transition">Privacy Policy</a></li>
                  <li><a href="#" class="hover:text-slate-950 transition">Terms of Service</a></li>
                </ul>
              </div>

            </div>

            <div class="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[10px]">
              <span>&copy; 2026 PulseWave Technologies. All rights reserved.</span>
              <span>Enterprise QA & Software Delivery Management</span>
            </div>
          </div>
        </footer>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (!el) return;
    
    const contentArea = document.getElementById("mainContent");
    if (contentArea) {
      const topOffset = el.offsetTop - 64; // Account for fixed 64px navbar height
      contentArea.scrollTo({
        top: Math.max(0, topOffset),
        behavior: "smooth"
      });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
};

window.LandingPageView = LandingPageView;
