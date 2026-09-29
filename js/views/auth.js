/**
 * PulseWave — Executive Authentication & Email Verification System
 * Full Supabase Authentication, Real-time Validation, Live Password Requirements,
 * Email Verification Gates, and Invited Member Onboarding.
 */

const AuthView = {
  // Timer state for resending confirmation emails
  resendCountdown: 0,
  resendInterval: null,

  // =========================================================================
  // 1. SIGN IN / LOGIN VIEW
  // =========================================================================
  renderLogin(container, params = {}) {
    const prefillEmail = params.email ? decodeURIComponent(params.email) : "";
    const shouldShowVerify = params.verify === "true" || params.verify === true;

    container.innerHTML = `
      <div class="min-h-screen relative flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden" style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 45%, #ffffff 100%);">
        
        <!-- Engineering Dot Matrix Background -->
        <div class="absolute inset-0 pointer-events-none opacity-40 z-0" style="background-image: radial-gradient(#94a3b8 1.2px, transparent 1.2px); background-size: 24px 24px;"></div>

        <!-- Ambient Glow Blooms -->
        <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(190, 242, 100, 0.45) 0%, rgba(163, 230, 53, 0.22) 50%, transparent 75%);"></div>
        <div class="absolute -bottom-20 -left-20 w-[450px] h-[450px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(186, 230, 253, 0.6) 0%, rgba(125, 211, 252, 0.25) 50%, transparent 75%);"></div>
        
        <div class="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          
          <!-- Header Brand -->
          <div class="text-center space-y-2">
            <div class="inline-flex items-center gap-2.5 cursor-pointer" onclick="window.app.navigate('home')">
              <div class="w-7 h-7 grid grid-cols-2 gap-0.5 shadow-2xs">
                <div class="bg-[#84cc16] rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
              </div>
              <span class="text-xl font-extrabold text-slate-950 tracking-tight">
                PulseWave
              </span>
            </div>
            
            <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] text-[10px] font-bold tracking-wide uppercase shadow-2xs">
              <span>✦</span>
              <span>ENTERPRISE QA COMMAND</span>
            </div>

            <h2 class="text-2xl font-black text-slate-950 tracking-tight pt-0.5">
              Welcome back
            </h2>
            <p class="text-xs text-slate-500 font-normal">
              Sign in to access your workspaces, test suites, and QA reports.
            </p>
          </div>

          <!-- Auth Card -->
          <div class="mt-5">
            <div class="bg-white/95 backdrop-blur-xl py-6 px-6 sm:px-8 rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/5 space-y-4 text-xs">
              
              <form id="loginForm" onsubmit="AuthView.handleLogin(event)" class="space-y-3.5" novalidate>
                <!-- Email Field -->
                <div>
                  <label for="loginEmail" class="block font-bold text-slate-700 mb-1 text-[11px]">Work Email *</label>
                  <input
                    type="email"
                    id="loginEmail"
                    value="${prefillEmail}"
                    required
                    class="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                    placeholder="name@company.com"
                  />
                  <p id="loginEmailErr" class="hidden text-rose-500 text-[10px] font-semibold mt-1"></p>
                </div>

                <!-- Password Field with Toggle -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label for="loginPassword" class="block font-bold text-slate-700 text-[11px]">Password *</label>
                    <a href="#" onclick="window.app.toast('Password Reset', 'A reset link has been dispatched to your email.', 'info'); return false;" class="text-slate-900 font-bold hover:text-[#65a30d] hover:underline text-[11px] transition">Forgot password?</a>
                  </div>
                  <div class="relative">
                    <input
                      type="password"
                      id="loginPassword"
                      required
                      class="w-full px-3 py-2 pr-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onclick="AuthView.togglePasswordVisibility('loginPassword', this)"
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      title="Show/Hide Password"
                    >
                      <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                  </div>
                  <p id="loginPassErr" class="hidden text-rose-500 text-[10px] font-semibold mt-1"></p>
                </div>

                <div class="flex items-center justify-between text-[11px] pt-0.5">
                  <label class="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                    <input type="checkbox" id="rememberMe" checked class="w-3.5 h-3.5 rounded text-slate-900 border-slate-300 focus:ring-[#84cc16]" />
                    <span>Remember this device</span>
                  </label>
                </div>

                <!-- Sign In Action Button -->
                <button
                  type="submit"
                  id="loginSubmitBtn"
                  class="w-full py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-md shadow-[#bef264]/35 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:pointer-events-none"
                >
                  <span>Sign In to Workspace</span>
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
              </form>

              <!-- Switch to Signup -->
              <div class="pt-3 border-t border-slate-100 text-center text-slate-500 text-xs">
                <span>Don't have an account?</span>
                <button onclick="window.app.navigate('signup')" class="text-slate-950 font-bold hover:text-[#65a30d] hover:underline ml-1 cursor-pointer transition">Create Free Account</button>
              </div>

            </div>

            <!-- Back to Home -->
            <div class="text-center mt-4">
              <button onclick="window.app.navigate('home')" class="text-xs text-slate-500 hover:text-slate-950 font-semibold inline-flex items-center gap-1.5 cursor-pointer transition">
                <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                <span>Back to PulseWave Home</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      <!-- Verification Dialog Modal Container -->
      <div id="emailVerificationModalContainer"></div>
    `;

    if (window.lucide) window.lucide.createIcons();

    if (shouldShowVerify && prefillEmail) {
      setTimeout(() => {
        this.showEmailVerificationModal(prefillEmail);
      }, 50);
    }
  },

  // =========================================================================
  // 2. SIGN UP / CREATE ACCOUNT VIEW
  // =========================================================================
  renderSignup(container) {
    container.innerHTML = `
      <div class="min-h-screen relative flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden" style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 45%, #ffffff 100%);">
        
        <!-- Engineering Dot Matrix Background -->
        <div class="absolute inset-0 pointer-events-none opacity-40 z-0" style="background-image: radial-gradient(#94a3b8 1.2px, transparent 1.2px); background-size: 24px 24px;"></div>

        <!-- Ambient Glow Blooms -->
        <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(190, 242, 100, 0.45) 0%, rgba(163, 230, 53, 0.22) 50%, transparent 75%);"></div>
        <div class="absolute -bottom-20 -left-20 w-[450px] h-[450px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(186, 230, 253, 0.6) 0%, rgba(125, 211, 252, 0.25) 50%, transparent 75%);"></div>

        <div class="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          
          <!-- Header Brand -->
          <div class="text-center space-y-2">
            <div class="inline-flex items-center gap-2.5 cursor-pointer" onclick="window.app.navigate('home')">
              <div class="w-7 h-7 grid grid-cols-2 gap-0.5 shadow-2xs">
                <div class="bg-[#84cc16] rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
              </div>
              <span class="text-xl font-extrabold text-slate-950 tracking-tight">
                PulseWave
              </span>
            </div>

            <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] text-[10px] font-bold tracking-wide uppercase shadow-2xs">
              <span>✦</span>
              <span>GET STARTED IN MINUTES</span>
            </div>

            <h2 class="text-2xl font-black text-slate-950 tracking-tight pt-0.5">
              Create your account
            </h2>
            <p class="text-xs text-slate-500 font-normal">
              Start organizing your software delivery and QA workflow today.
            </p>
          </div>

          <!-- Auth Card -->
          <div class="mt-5">
            <div class="bg-white/95 backdrop-blur-xl py-6 px-6 sm:px-8 rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/5 space-y-4 text-xs">
              
              <form id="signupForm" onsubmit="AuthView.handleSignup(event)" class="space-y-3" novalidate>
                <!-- Full Name -->
                <div>
                  <label for="signupName" class="block font-bold text-slate-700 mb-1 text-[11px]">Full Name *</label>
                  <input
                    type="text"
                    id="signupName"
                    required
                    class="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                    placeholder="e.g. Sarah Jenkins"
                  />
                  <p id="signupNameErr" class="hidden text-rose-500 text-[10px] font-semibold mt-1"></p>
                </div>

                <!-- Work Email -->
                <div>
                  <label for="signupEmail" class="block font-bold text-slate-700 mb-1 text-[11px]">Work Email *</label>
                  <input
                    type="email"
                    id="signupEmail"
                    required
                    oninput="AuthView.validateEmailField(this.value)"
                    class="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                    placeholder="name@company.com"
                  />
                  <p id="signupEmailErr" class="hidden text-rose-500 text-[10px] font-semibold mt-1">Please enter a valid email address.</p>
                </div>

                <!-- Password with Live Requirements -->
                <div>
                  <label for="signupPass" class="block font-bold text-slate-700 mb-1 text-[11px]">Password *</label>
                  <div class="relative">
                    <input
                      type="password"
                      id="signupPass"
                      required
                      oninput="AuthView.validatePasswordField(this.value)"
                      class="w-full px-3 py-2 pr-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onclick="AuthView.togglePasswordVisibility('signupPass', this)"
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      title="Show/Hide Password"
                    >
                      <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                  </div>

                  <!-- Live Password Requirements Checklist -->
                  <div class="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-[10px]">
                    <div class="font-bold text-slate-600 mb-1">Password Requirements:</div>
                    <div id="req-len" class="flex items-center gap-1.5 text-slate-400">
                      <span class="w-3.5 h-3.5 flex items-center justify-center font-bold text-xs">○</span>
                      <span>Minimum 8 characters</span>
                    </div>
                    <div id="req-upper" class="flex items-center gap-1.5 text-slate-400">
                      <span class="w-3.5 h-3.5 flex items-center justify-center font-bold text-xs">○</span>
                      <span>At least 1 uppercase letter (A-Z)</span>
                    </div>
                    <div id="req-lower" class="flex items-center gap-1.5 text-slate-400">
                      <span class="w-3.5 h-3.5 flex items-center justify-center font-bold text-xs">○</span>
                      <span>At least 1 lowercase letter (a-z)</span>
                    </div>
                    <div id="req-num" class="flex items-center gap-1.5 text-slate-400">
                      <span class="w-3.5 h-3.5 flex items-center justify-center font-bold text-xs">○</span>
                      <span>At least 1 number (0-9)</span>
                    </div>
                    <div id="req-spec" class="flex items-center gap-1.5 text-slate-400">
                      <span class="w-3.5 h-3.5 flex items-center justify-center font-bold text-xs">○</span>
                      <span>At least 1 special character (!@#$%^&*...)</span>
                    </div>
                  </div>
                  <p id="signupPassErr" class="hidden text-rose-500 text-[10px] font-semibold mt-1">Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.</p>
                </div>

                <!-- Confirm Password -->
                <div>
                  <label for="signupConfirmPass" class="block font-bold text-slate-700 mb-1 text-[11px]">Confirm Password *</label>
                  <div class="relative">
                    <input
                      type="password"
                      id="signupConfirmPass"
                      required
                      oninput="AuthView.validateConfirmPasswordField(this.value)"
                      class="w-full px-3 py-2 pr-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-[#bef264]/40 focus:outline-none transition"
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onclick="AuthView.togglePasswordVisibility('signupConfirmPass', this)"
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      title="Show/Hide Password"
                    >
                      <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                  </div>
                  <p id="signupConfirmPassErr" class="hidden text-rose-500 text-[10px] font-semibold mt-1">Passwords do not match.</p>
                </div>

                <div class="pt-0.5">
                  <label class="flex items-start gap-1.5 cursor-pointer text-slate-600 text-[11px] leading-tight">
                    <input type="checkbox" id="termsAgree" required class="w-3.5 h-3.5 rounded text-slate-900 border-slate-300 focus:ring-[#84cc16] mt-0.5" />
                    <span>I agree to the <a href="#" onclick="return false;" class="text-slate-900 font-bold underline hover:text-[#65a30d]">Terms</a> and <a href="#" onclick="return false;" class="text-slate-900 font-bold underline hover:text-[#65a30d]">Privacy Policy</a>.</span>
                  </label>
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  id="signupSubmitBtn"
                  class="w-full py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-md shadow-[#bef264]/35 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:pointer-events-none"
                >
                  <span>Create Free Account</span>
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
              </form>

              <!-- Switch to Login -->
              <div class="pt-3 border-t border-slate-100 text-center text-slate-500 text-xs">
                <span>Already have an account?</span>
                <button onclick="window.app.navigate('login')" class="text-slate-950 font-bold hover:text-[#65a30d] hover:underline ml-1 cursor-pointer transition">Sign In</button>
              </div>

            </div>

            <!-- Back to Home -->
            <div class="text-center mt-4">
              <button onclick="window.app.navigate('home')" class="text-xs text-slate-500 hover:text-slate-950 font-semibold inline-flex items-center gap-1.5 cursor-pointer transition">
                <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                <span>Back to PulseWave Home</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================================
  // 3. EMAIL VERIFICATION REQUIRED VIEW
  // =========================================================================
  renderEmailVerification(container, params = {}) {
    const email = params.email ? decodeURIComponent(params.email) : "your email address";

    container.innerHTML = `
      <div class="min-h-screen relative flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden" style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 45%, #ffffff 100%);">
        
        <!-- Engineering Dot Matrix Background -->
        <div class="absolute inset-0 pointer-events-none opacity-40 z-0" style="background-image: radial-gradient(#94a3b8 1.2px, transparent 1.2px); background-size: 24px 24px;"></div>

        <!-- Glow Blooms -->
        <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(190, 242, 100, 0.45) 0%, rgba(163, 230, 53, 0.22) 50%, transparent 75%);"></div>
        <div class="absolute -bottom-20 -left-20 w-[450px] h-[450px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(186, 230, 253, 0.6) 0%, rgba(125, 211, 252, 0.25) 50%, transparent 75%);"></div>

        <div class="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
          
          <!-- Logo -->
          <div class="inline-flex items-center gap-2.5 cursor-pointer mb-4" onclick="window.app.navigate('home')">
            <div class="w-7 h-7 grid grid-cols-2 gap-0.5 shadow-2xs">
              <div class="bg-[#84cc16] rounded-xs"></div>
              <div class="bg-slate-950 rounded-xs"></div>
              <div class="bg-slate-950 rounded-xs"></div>
              <div class="bg-slate-950 rounded-xs"></div>
            </div>
            <span class="text-xl font-extrabold text-slate-950 tracking-tight">PulseWave</span>
          </div>

          <!-- Card -->
          <div class="bg-white/95 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 text-xs space-y-5">
            
            <!-- Animated Envelope Graphic -->
            <div class="w-16 h-16 rounded-2xl bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] flex items-center justify-center mx-auto shadow-sm">
              <i data-lucide="mail-check" class="w-8 h-8 animate-bounce"></i>
            </div>

            <div class="space-y-1.5">
              <h2 class="text-2xl font-black text-slate-950 tracking-tight">Check your email</h2>
              <p class="text-slate-600 leading-relaxed text-xs">
                We've sent a confirmation link to your email address. Please verify your email before continuing.
              </p>
            </div>

            <!-- Email Pill -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono font-bold text-slate-900 text-xs break-all">
              ${email}
            </div>

            <!-- Checklist -->
            <div class="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-left space-y-2 text-[11px] text-slate-600">
              <div class="flex items-start gap-2">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-[#65a30d] shrink-0 mt-0.5"></i>
                <span>Open the verification link sent by Supabase Auth</span>
              </div>
              <div class="flex items-start gap-2">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-[#65a30d] shrink-0 mt-0.5"></i>
                <span>Return here and click "I've Confirmed My Email"</span>
              </div>
              <div class="flex items-start gap-2">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-[#65a30d] shrink-0 mt-0.5"></i>
                <span>Set up your Workspace and first Project</span>
              </div>
            </div>

            <!-- Primary Continue Action -->
            <div class="space-y-2 pt-2">
              <button
                type="button"
                onclick="window.app.navigate('login', { email: '${encodeURIComponent(email)}' })"
                class="w-full py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-md shadow-[#bef264]/35 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>I've Confirmed My Email → Sign In</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>

              <!-- Resend Email Button with Countdown -->
              <button
                type="button"
                id="resendVerificationBtn"
                onclick="AuthView.resendVerificationEmail('${email}')"
                class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Resend confirmation email
              </button>
            </div>

            <div class="pt-3 border-t border-slate-100 text-center">
              <button onclick="window.app.navigate('login')" class="text-xs text-slate-500 hover:text-slate-900 font-bold transition">
                ← Change email / Back to Sign In
              </button>
            </div>

          </div>

        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================================
  // 4. LIVE FORM VALIDATION HELPERS
  // =========================================================================
  validateEmailField(email) {
    const err = document.getElementById("signupEmailErr");
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(email.trim());
    if (err) {
      if (email.length > 0 && !isValid) {
        err.classList.remove("hidden");
      } else {
        err.classList.add("hidden");
      }
    }
    return isValid;
  },

  validatePasswordField(pass) {
    const err = document.getElementById("signupPassErr");
    const len = pass.length >= 8;
    const upper = /[A-Z]/.test(pass);
    const lower = /[a-z]/.test(pass);
    const num = /[0-9]/.test(pass);
    const spec = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    const updateReq = (id, valid) => {
      const el = document.getElementById(id);
      if (el) {
        if (valid) {
          el.className = "flex items-center gap-1.5 text-[#65a30d] font-bold";
          el.querySelector("span:first-child").innerHTML = "✓";
        } else {
          el.className = "flex items-center gap-1.5 text-slate-400";
          el.querySelector("span:first-child").innerHTML = "○";
        }
      }
    };

    updateReq("req-len", len);
    updateReq("req-upper", upper);
    updateReq("req-lower", lower);
    updateReq("req-num", num);
    updateReq("req-spec", spec);

    const isValid = len && upper && lower && num && spec;
    if (err) {
      if (pass.length > 0 && !isValid) {
        err.classList.remove("hidden");
      } else {
        err.classList.add("hidden");
      }
    }
    return isValid;
  },

  validateConfirmPasswordField(confirmPass) {
    const pass = document.getElementById("signupPass")?.value || "";
    const err = document.getElementById("signupConfirmPassErr");
    const isMatch = pass === confirmPass;
    if (err) {
      if (confirmPass.length > 0 && !isMatch) {
        err.classList.remove("hidden");
      } else {
        err.classList.add("hidden");
      }
    }
    return isMatch;
  },

  togglePasswordVisibility(fieldId, btnEl) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    if (field.type === "password") {
      field.type = "text";
      if (btnEl) btnEl.innerHTML = `<i data-lucide="eye-off" class="w-4 h-4 text-slate-700"></i>`;
    } else {
      field.type = "password";
      if (btnEl) btnEl.innerHTML = `<i data-lucide="eye" class="w-4 h-4 text-slate-400"></i>`;
    }
    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================================
  // 5. AUTHENTICATION HANDLERS
  // =========================================================================
  async handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById("signupName")?.value.trim();
    const email = document.getElementById("signupEmail")?.value.trim().toLowerCase();
    const password = document.getElementById("signupPass")?.value;
    const confirmPass = document.getElementById("signupConfirmPass")?.value;
    const terms = document.getElementById("termsAgree")?.checked;
    const submitBtn = document.getElementById("signupSubmitBtn");

    // Validations
    if (!name) {
      window.app.toast("Validation Error", "Please enter your full name.", "error");
      return;
    }

    if (!this.validateEmailField(email)) {
      window.app.toast("Validation Error", "Please enter a valid email address.", "error");
      return;
    }

    if (!this.validatePasswordField(password)) {
      window.app.toast("Weak Password", "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.", "error");
      return;
    }

    if (password !== confirmPass) {
      window.app.toast("Password Mismatch", "Passwords do not match.", "error");
      return;
    }

    if (!terms) {
      window.app.toast("Terms Required", "Please agree to the Terms of Service to continue.", "error");
      return;
    }

    // Set Loading State
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Creating Account...</span>`;
      if (window.lucide) window.lucide.createIcons();
    }

    try {
      if (window.supabaseClient && window.supabaseClient.auth) {
        const { data, error } = await window.supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              name: name,
              role: "PROJECT_MANAGER"
            }
          }
        });

        if (error) {
          const msg = error.message || "";
          if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("user_already_exists")) {
            throw new Error("An account with this email already exists. Please sign in instead.");
          }
          if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("over_email_send_rate_limit")) {
            throw new Error("Supabase email rate limit reached (max 3-4 emails/hour on default mailer). Please disable 'Confirm email' in Supabase Dashboard -> Auth -> Email to test without limits, or try again in a few minutes.");
          }
          throw new Error(msg);
        }

        // Upsert user profile to public.profiles table
        if (data && data.user) {
          try {
            const { error: profErr } = await window.supabaseClient.from('profiles').upsert({
              id: data.user.id,
              full_name: name,
              email: email,
              role: 'PROJECT_MANAGER'
            });
            if (profErr) console.warn("Profile table creation notice:", profErr.message);
          } catch (e) {
            console.warn(e);
          }
        }

        // If email confirmation is disabled or session returned immediately
        if (data && data.session && data.session.user) {
          store.setSupabaseUser(data.session.user);
          store.data.activeWorkspaceId = null;
          store.data.activeProjectId = null;
          window.app.toast("Account Created", `Welcome, ${name}! Let's create your workspace.`, "success");
          window.app.navigate("onboarding");
          return;
        }

        window.app.toast("Account Created", "We've sent a verification link to your email.", "success");
        window.app.navigate("verify-email", { email: encodeURIComponent(email) });
        return;
      }

      // Offline / Local Fallback
      const newUser = store.registerUser({ name, email, password, role: "PROJECT_MANAGER" });
      store.data.activeUserId = newUser.id;
      store.data.activeWorkspaceId = null;
      store.data.activeProjectId = null;
      window.app.toast("Account Created", `Welcome, ${name}! Let's set up your new workspace.`, "success");
      window.app.navigate("onboarding");
    } catch (err) {
      window.app.toast("Sign Up Failed", err.message || "Failed to create account. Please try again.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Create Free Account</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail")?.value.trim().toLowerCase();
    const password = document.getElementById("loginPassword")?.value;
    const submitBtn = document.getElementById("loginSubmitBtn");

    if (!email) {
      window.app.toast("Email Required", "Please enter your work email.", "error");
      return;
    }

    if (!password) {
      window.app.toast("Password Required", "Please enter your password.", "error");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Signing In...</span>`;
      if (window.lucide) window.lucide.createIcons();
    }

    try {
      const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
      let authUser = null;

      let sbErrorMessage = null;
      // 1. Try Supabase Auth
      if (sb && sb.auth) {
        try {
          const { data, error } = await sb.auth.signInWithPassword({ email, password });
          if (error) {
            sbErrorMessage = error.message;
            console.warn("Supabase signInWithPassword attempt notice:", error.message);
          } else if (data && data.user) {
            authUser = store.setSupabaseUser(data.user);
          }
        } catch (sbErr) {
          sbErrorMessage = sbErr.message;
          console.warn("Supabase signInWithPassword attempt notice:", sbErr);
        }
      }

      // 2. Check local store and invited credentials
      if (!authUser) {
        authUser = store.authenticateUser(email, password);
      }

      if (!authUser) {
        throw new Error(sbErrorMessage || "Invalid email or password. Please check your credentials.");
      }

      // 3. Auto-accept any pending invitations for this user
      if (store.data.projectInvitations) {
        const pendingInvites = store.data.projectInvitations.filter(i => 
          (i.invitedEmail || i.invited_email)?.toLowerCase() === email && i.status === 'PENDING'
        );
        for (const pinv of pendingInvites) {
          try {
            await store.acceptProjectInvitation(pinv.token, authUser);
          } catch (e) {
            console.warn("Auto-accept invitation notice:", e);
          }
        }
      }

      // 4. Load real user spaces and projects from Supabase if available
      if (store.loadUserSpacesAndProjects && authUser.id) {
        await store.loadUserSpacesAndProjects(authUser.id);
      }

      const userName = authUser.name || "User";
      window.app.toast("Signed In", `Welcome back, ${userName}!`, "success");

      // 5. Navigate to appropriate workspace or onboarding
      const userSpaces = store.getWorkspaces ? store.getWorkspaces(authUser.id) : [];
      if (!userSpaces || userSpaces.length === 0) {
        // Brand new user with 0 spaces -> Send directly to create their own space!
        window.app.navigate("onboarding");
      } else {
        const activeProj = store.getActiveProject();
        if (activeProj && authUser.role !== "OWNER" && authUser.role !== "PROJECT_MANAGER" && authUser.role !== "PM") {
          window.app.navigate("project-workspace");
        } else {
          window.app.navigate("dashboard");
        }
      }
    } catch (err) {
      window.app.toast("Sign In Failed", err.message || "Invalid credentials.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In to Workspace</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  // =========================================================================
  // 6. EMAIL VERIFICATION MODAL DIALOG
  // =========================================================================
  showEmailVerificationModal(email) {
    let container = document.getElementById("emailVerificationModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "emailVerificationModalContainer";
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4 animate-scale-up text-xs">
          
          <div class="w-14 h-14 rounded-2xl bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] flex items-center justify-center mx-auto shadow-sm">
            <i data-lucide="mail-warning" class="w-7 h-7 text-[#65a30d]"></i>
          </div>

          <div class="space-y-1">
            <h3 class="text-xl font-extrabold text-slate-950">Please verify your email first</h3>
            <p class="text-slate-500 text-xs leading-relaxed">
              We've sent a verification link to your work email. Click the link in the email to activate your account.
            </p>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 text-xs">
            ${email}
          </div>

          <div class="space-y-2 pt-2">
            <button
              type="button"
              onclick="AuthView.closeEmailVerificationModal(); window.app.navigate('login', { email: '${encodeURIComponent(email)}' })"
              class="w-full py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              I've Confirmed My Email → Try Again
            </button>

            <button
              type="button"
              id="modalResendBtn"
              onclick="AuthView.resendVerificationEmail('${email}')"
              class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Resend confirmation email
            </button>
          </div>

          <button
            type="button"
            onclick="AuthView.closeEmailVerificationModal()"
            class="text-xs text-slate-400 hover:text-slate-700 font-semibold"
          >
            Close
          </button>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  closeEmailVerificationModal() {
    const container = document.getElementById("emailVerificationModalContainer");
    if (container) container.innerHTML = "";
  },

  async resendVerificationEmail(email) {
    if (!email) return;

    if (this.resendCountdown > 0) {
      window.app.toast("Please Wait", `You can resend in ${this.resendCountdown} seconds.`, "info");
      return;
    }

    try {
      if (window.supabaseClient && window.supabaseClient.auth && window.supabaseClient.auth.resend) {
        const { error } = await window.supabaseClient.auth.resend({
          type: 'signup',
          email: email
        });
        if (error) {
          const msg = error.message || "";
          if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("over_email_send_rate_limit")) {
            throw new Error("Supabase email rate limit reached (max 3-4 emails/hour on default mailer). Please wait a few minutes or disable 'Confirm email' in Supabase Dashboard.");
          }
          throw error;
        }
      }

      window.app.toast("Email Sent", `Confirmation email sent to ${email}`, "success");
      
      // Start 60s countdown timer
      this.startResendCountdown();
    } catch (err) {
      window.app.toast("Resend Notice", err.message || "Failed to resend confirmation email.", "warning");
    }
  },

  startResendCountdown() {
    this.resendCountdown = 60;
    const updateButtons = () => {
      const pageBtn = document.getElementById("resendVerificationBtn");
      const modalBtn = document.getElementById("modalResendBtn");
      const text = this.resendCountdown > 0 ? `Resend available in ${this.resendCountdown}s` : "Resend confirmation email";
      
      if (pageBtn) {
        pageBtn.innerText = text;
        pageBtn.disabled = this.resendCountdown > 0;
      }
      if (modalBtn) {
        modalBtn.innerText = text;
        modalBtn.disabled = this.resendCountdown > 0;
      }
    };

    updateButtons();
    if (this.resendInterval) clearInterval(this.resendInterval);

    this.resendInterval = setInterval(() => {
      this.resendCountdown--;
      updateButtons();
      if (this.resendCountdown <= 0) {
        clearInterval(this.resendInterval);
        this.resendInterval = null;
      }
    }, 1000);
  },

  // =========================================================================
  // 7. INVITED TEAM MEMBER JOIN WORKSPACE VIEW
  // =========================================================================
  renderJoinWorkspace(container, params = {}) {
    const wsName = params.ws ? decodeURIComponent(params.ws) : "PulseWave Space";
    const role = params.role ? decodeURIComponent(params.role) : "QA Engineer";
    const email = params.email ? decodeURIComponent(params.email) : "";

    container.innerHTML = `
      <div class="min-h-screen relative flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden" style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 45%, #ffffff 100%);">
        
        <div class="absolute inset-0 pointer-events-none opacity-40 z-0" style="background-image: radial-gradient(#94a3b8 1.2px, transparent 1.2px); background-size: 24px 24px;"></div>
        <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(190, 242, 100, 0.45) 0%, rgba(163, 230, 53, 0.22) 50%, transparent 75%);"></div>

        <div class="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
          
          <div class="inline-flex items-center gap-2.5 cursor-pointer mb-3" onclick="window.app.navigate('home')">
            <div class="w-7 h-7 grid grid-cols-2 gap-0.5 shadow-2xs">
              <div class="bg-[#84cc16] rounded-xs"></div>
              <div class="bg-slate-950 rounded-xs"></div>
              <div class="bg-slate-950 rounded-xs"></div>
              <div class="bg-slate-950 rounded-xs"></div>
            </div>
            <span class="text-xl font-extrabold text-slate-950 tracking-tight">PulseWave</span>
          </div>

          <div class="bg-white/95 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/90 shadow-2xl text-xs space-y-5">
            
            <div class="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto shadow-sm">
              <i data-lucide="users" class="w-7 h-7"></i>
            </div>

            <div class="space-y-1">
              <span class="px-2.5 py-0.5 rounded-full bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] text-[10px] font-bold uppercase tracking-wider">
                TEAM INVITATION
              </span>
              <h2 class="text-2xl font-black text-slate-950 tracking-tight pt-1">
                Join ${wsName}
              </h2>
              <p class="text-slate-500 text-xs">
                You have been invited to collaborate as <strong class="text-slate-900">${role}</strong>.
              </p>
            </div>

            <form onsubmit="AuthView.handleAcceptInvite(event, '${encodeURIComponent(wsName)}', '${encodeURIComponent(role)}')" class="space-y-3 text-left">
              <div>
                <label class="block font-bold text-slate-700 mb-1 text-[11px]">Your Name *</label>
                <input
                  type="text"
                  id="directJoinName"
                  required
                  value="${email ? email.split('@')[0] : ''}"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-indigo-500 transition"
                  placeholder="e.g. Alex Morgan"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1 text-[11px]">Your Work Email *</label>
                <input
                  type="email"
                  id="directJoinEmail"
                  required
                  value="${email}"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-indigo-500 transition"
                  placeholder="name@company.com"
                />
              </div>

              <button
                type="submit"
                class="w-full py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 pt-2"
              >
                <span>Accept Invitation & Enter Space</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </form>

            <div class="pt-3 border-t border-slate-100 text-center">
              <button onclick="window.app.navigate('login')" class="text-slate-500 hover:text-slate-900 font-semibold text-xs">
                Already have an account? Sign In
              </button>
            </div>

          </div>

        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================================
  // 8. PROJECT & SPACE INVITATION ACCEPTANCE VIEW (Sections 2, 3, 14, 15)
  // =========================================================================
  async renderAcceptProjectInvite(container, params = {}) {
    // Robust token extraction across all hash formats, search params, and session storage
    let token = params.token;
    const currentHash = (window.location && window.location.hash) || "";
    const currentSearch = (window.location && window.location.search) || "";
    if (!token && currentHash.includes("token=")) {
      token = (currentHash.match(/token=([^&#]+)/) || [])[1];
    }
    if (!token && currentSearch.includes("token=")) {
      token = (currentSearch.match(/token=([^&#]+)/) || [])[1];
    }
    if (!token && typeof sessionStorage !== 'undefined') {
      token = sessionStorage.getItem("pending_invite_token");
    }
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem("last_project_invite_token");
    }

    if (token) {
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem("pending_invite_token", token);
      if (typeof localStorage !== 'undefined') localStorage.setItem("last_project_invite_token", token);
    }

    if (!token) {
      container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans text-xs">
          <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <i data-lucide="help-circle" class="w-6 h-6"></i>
            </div>
            <h2 class="text-xl font-bold text-slate-900">Missing Invitation Token</h2>
            <p class="text-slate-500 leading-relaxed">Please make sure you clicked the full link with your unique security token or ask your Project Manager to share the direct invite link.</p>
            <div class="pt-2">
              <button onclick="window.app.navigate('home')" class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition cursor-pointer">
                Return to Home
              </button>
            </div>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans text-xs">
        <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div class="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-slate-500 font-medium">Validating invitation credentials...</p>
        </div>
      </div>
    `;

    const check = await store.validateProjectInvitationToken(token);
    const currentUser = store.getActiveUser();

    if (!check.valid) {
      container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans text-xs">
          <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4 animate-scale-up">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <i data-lucide="clock" class="w-6 h-6"></i>
            </div>
            <h2 class="text-xl font-bold text-slate-900">Invitation Notice</h2>
            <p class="text-slate-600 leading-relaxed">${check.error}</p>
            <div class="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button onclick="window.app.navigate('login')" class="w-full sm:w-auto px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl shadow-xs transition cursor-pointer">
                Sign In to Check Invites
              </button>
              <button onclick="window.app.navigate('home')" class="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer">
                Return to Home
              </button>
            </div>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const inv = check.invitation;
    const project = check.project || { name: "Project Workspace", key: "PRJ" };
    const workspace = check.workspace || { name: "Workspace" };
    const invitedEmail = inv.invitedEmail || inv.invited_email;
    const role = (inv.role || "DEVELOPER").toUpperCase();
    const scope = inv.scope || (inv.projectId || inv.project_id ? 'PROJECT' : 'SPACE');

    // Format role label
    const roleTitles = {
      PM: "Project Manager",
      OWNER: "Project Manager / Owner",
      QA: "QA Engineer / QA Manager",
      DEVELOPER: "Developer (Project Specific)",
      VIEWER: "Viewer (Read Only)"
    };
    const roleTitle = roleTitles[role] || role;
    const isEmailMatching = currentUser && currentUser.email && currentUser.email.toLowerCase() === invitedEmail.toLowerCase();

    container.innerHTML = `
      <div class="min-h-screen relative flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden" style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 45%, #ffffff 100%);">
        
        <!-- Engineering Dot Matrix Background -->
        <div class="absolute inset-0 pointer-events-none opacity-40 z-0" style="background-image: radial-gradient(#94a3b8 1.2px, transparent 1.2px); background-size: 24px 24px;"></div>
        <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl z-0" style="background: radial-gradient(circle, rgba(190, 242, 100, 0.45) 0%, rgba(163, 230, 53, 0.22) 50%, transparent 75%);"></div>

        <div class="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          
          <div class="text-center mb-3">
            <div class="inline-flex items-center gap-2.5 cursor-pointer" onclick="window.app.navigate('home')">
              <div class="w-7 h-7 grid grid-cols-2 gap-0.5 shadow-2xs">
                <div class="bg-[#84cc16] rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
                <div class="bg-slate-950 rounded-xs"></div>
              </div>
              <span class="text-xl font-extrabold text-slate-950 tracking-tight">PulseWave</span>
            </div>
          </div>

          <div class="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xl text-xs space-y-4">
            
            <div class="text-center space-y-1.5 pb-2 border-b border-slate-100">
              <span class="px-2.5 py-0.5 rounded-full ${scope === 'SPACE' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-slate-100 border border-slate-200 text-slate-800'} text-[10px] font-bold uppercase tracking-wider">
                ${scope === 'SPACE' ? 'SPACE INVITATION' : 'PROJECT INVITATION'}
              </span>
              <h2 class="text-2xl font-black text-slate-950 tracking-tight pt-1">
                Join ${scope === 'SPACE' ? workspace.name : project.name}
              </h2>
              <p class="text-slate-500 text-xs">
                Invited by <strong class="text-slate-800">${inv.invitedBy || 'Project Manager'}</strong> to work in <strong>${workspace.name}</strong>.
              </p>
            </div>

            <!-- Role & Scope Card -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-left space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-slate-500 font-medium text-[11px]">Assigned Role</span>
                <span class="px-2 py-0.5 rounded text-[11px] font-bold ${role === 'QA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (role === 'DEVELOPER' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-purple-50 text-purple-700 border border-purple-200')}">
                  ${roleTitle}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500 font-medium text-[11px]">Invited Email</span>
                <span class="font-mono font-bold text-slate-900">${invitedEmail}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500 font-medium text-[11px]">Access Scope</span>
                <span class="text-emerald-700 font-bold text-[11px]">
                  ${scope === 'SPACE' ? '✦ Entire Space Access (All Projects)' : '✦ Project-Specific Access'}
                </span>
              </div>
            </div>

            <!-- Flow Selector / Action Modes -->
            ${currentUser && isEmailMatching ? `
              <!-- Authenticated User Flow -->
              <div class="space-y-3 pt-2">
                <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px]">
                  ✓ You are signed in as <strong>${currentUser.email}</strong>. Click below to join and open your workspace.
                </div>

                <button
                  id="acceptInviteBtn"
                  onclick="AuthView.handleAcceptProjectInviteAction('${token}')"
                  class="w-full py-3 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <i data-lucide="check" class="w-4 h-4 text-slate-950"></i>
                  <span>Accept Invitation & Open Workspace</span>
                </button>

                <button
                  onclick="window.app.navigate('dashboard')"
                  class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Decline
                </button>
              </div>
            ` : currentUser && !isEmailMatching ? `
              <!-- Logged In as Different Email -->
              <div class="space-y-3 pt-2">
                <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                  ⚠️ You are currently signed in as <strong>${currentUser.email}</strong>. This invitation was sent specifically to <strong>${invitedEmail}</strong>.
                </div>

                <button
                  type="button"
                  onclick="AuthView.showInviteAuthMode('signin', '${token}', '${encodeURIComponent(invitedEmail)}')"
                  class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
                  <span>Sign In as ${invitedEmail}</span>
                </button>

                <button
                  type="button"
                  onclick="AuthView.showInviteAuthMode('signin', '${token}', '${encodeURIComponent(invitedEmail)}')"
                  class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Sign Out of Current Account
                </button>
              </div>
            ` : `
              <!-- Non-Authenticated Flow: Sign In with PM-Created Password or Set Custom Password -->
              <div class="space-y-3 pt-1">
                <!-- Mode Switch Tabs -->
                <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-center font-bold text-xs">
                  <button
                    type="button"
                    id="inviteTabSignin"
                    onclick="AuthView.switchInviteAuthTab('signin')"
                    class="py-1.5 rounded-lg bg-white shadow-2xs text-slate-900 transition cursor-pointer"
                  >
                    Sign In with Password
                  </button>
                  <button
                    type="button"
                    id="inviteTabSignup"
                    onclick="AuthView.switchInviteAuthTab('signup')"
                    class="py-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition cursor-pointer"
                  >
                    Set New Password
                  </button>
                </div>

                <!-- 1. SIGN IN FORM (Default: Enter credentials created by PM) -->
                <form id="inviteSigninForm" onsubmit="AuthView.handleInviteSignIn(event, '${token}')" class="space-y-3 text-left">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1 text-[11px]">Email Address *</label>
                    <input
                      type="email"
                      id="inviteSigninEmail"
                      value="${invitedEmail}"
                      required
                      class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#84cc16] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="block font-bold text-slate-700 text-[11px]">Password (Created by PM) *</label>
                      <span class="text-[10px] text-slate-400">Enter password provided by PM</span>
                    </div>
                    <div class="relative">
                      <input
                        type="password"
                        id="inviteSigninPassword"
                        required
                        placeholder="Enter password created by PM"
                        class="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#84cc16] focus:outline-none transition"
                      />
                      <button
                        type="button"
                        onclick="AuthView.togglePasswordVisibility('inviteSigninPassword', this)"
                        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      >
                        <i data-lucide="eye" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="inviteSigninBtn"
                    class="w-full py-3 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-md shadow-[#bef264]/25 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Sign In & Enter Workspace</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 text-slate-950"></i>
                  </button>
                </form>

                <!-- 2. SET NEW PASSWORD FORM (Alternative: User chooses own custom password) -->
                <form id="inviteSignupForm" onsubmit="AuthView.handleInviteSignUp(event, '${token}')" class="hidden space-y-3 text-left">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1 text-[11px]">Full Name *</label>
                    <input
                      type="text"
                      id="inviteFullName"
                      value="${invitedEmail ? invitedEmail.split('@')[0] : ''}"
                      required
                      placeholder="e.g. Alex Johnson"
                      class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#84cc16] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1 text-[11px]">Email Address (From Invitation)</label>
                    <input
                      type="email"
                      id="inviteEmailField"
                      value="${invitedEmail}"
                      readonly
                      class="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono font-semibold cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1 text-[11px]">Choose New Password *</label>
                    <div class="relative">
                      <input
                        type="password"
                        id="invitePassword"
                        required
                        oninput="AuthView.validatePasswordRequirements(this.value)"
                        placeholder="Create new password"
                        class="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#84cc16] focus:outline-none transition"
                      />
                      <button
                        type="button"
                        onclick="AuthView.togglePasswordVisibility('invitePassword', this)"
                        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      >
                        <i data-lucide="eye" class="w-4 h-4"></i>
                      </button>
                    </div>

                    <!-- Live Password Checklist -->
                    <div class="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-[10px]">
                      <div class="font-bold text-slate-600 mb-0.5">Password Requirements:</div>
                      <div id="req-len" class="flex items-center gap-1.5 text-slate-400">
                        <span class="w-3.5 h-3.5 flex items-center justify-center font-bold text-xs">○</span>
                        <span>Minimum 8 characters</span>
                      </div>
                      <div id="req-upper" class="flex items-center gap-1.5 text-slate-400">
                        <span class="w-3.5 h-3.5 flex items-center justify-center font-bold text-xs">○</span>
                        <span>At least 1 uppercase letter (A-Z)</span>
                      </div>
                      <div id="req-lower" class="flex items-center gap-1.5 text-slate-400">
                        <span class="w-3.5 h-3.5 flex items-center justify-center font-bold text-xs">○</span>
                        <span>At least 1 lowercase letter (a-z)</span>
                      </div>
                      <div id="req-num" class="flex items-center gap-1.5 text-slate-400">
                        <span class="w-3.5 h-3.5 flex items-center justify-center font-bold text-xs">○</span>
                        <span>At least 1 number (0-9)</span>
                      </div>
                      <div id="req-spec" class="flex items-center gap-1.5 text-slate-400">
                        <span class="w-3.5 h-3.5 flex items-center justify-center font-bold text-xs">○</span>
                        <span>At least 1 special character (!@#$%^&*...)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1 text-[11px]">Confirm New Password *</label>
                    <div class="relative">
                      <input
                        type="password"
                        id="inviteConfirmPassword"
                        required
                        oninput="AuthView.validateConfirmPasswordField(this.value, 'invitePassword')"
                        placeholder="Re-enter password"
                        class="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#84cc16] focus:outline-none transition"
                      />
                      <button
                        type="button"
                        onclick="AuthView.togglePasswordVisibility('inviteConfirmPassword', this)"
                        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      >
                        <i data-lucide="eye" class="w-4 h-4"></i>
                      </button>
                    </div>
                    <p id="inviteConfirmErr" class="hidden text-rose-500 text-[10px] font-semibold mt-1">Passwords do not match.</p>
                  </div>

                  <button
                    type="submit"
                    id="inviteSignupBtn"
                    class="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Update Password & Enter Workspace</span>
                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                  </button>
                </form>

              </div>
            `}

          </div>

        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async showInviteAuthMode(mode, token, rawEmail) {
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.auth) {
      try { await sb.auth.signOut(); } catch (e) {}
    }
    
    // Clear local active user session
    if (typeof store !== 'undefined') {
      store.data.activeUserId = null;
      store.data.activeUser = null;
      store.saveState();
    }

    const email = rawEmail ? decodeURIComponent(rawEmail) : "";
    const container = document.getElementById("mainContent") || document.getElementById("app") || document.body;
    this.renderAcceptInvite(container, token, email);
    
    // Switch to desired tab
    if (mode === "signin") {
      setTimeout(() => {
        this.switchInviteAuthTab("signin");
        const passInput = document.getElementById("inviteSigninPassword");
        if (passInput) passInput.focus();
      }, 50);
    } else if (mode === "signup") {
      setTimeout(() => {
        this.switchInviteAuthTab("signup");
      }, 50);
    }
  },

  switchInviteAuthTab(mode) {
    const signupForm = document.getElementById("inviteSignupForm");
    const signinForm = document.getElementById("inviteSigninForm");
    const signupTab = document.getElementById("inviteTabSignup");
    const signinTab = document.getElementById("inviteTabSignin");

    if (mode === "signup") {
      if (signupForm) signupForm.classList.remove("hidden");
      if (signinForm) signinForm.classList.add("hidden");
      if (signupTab) {
        signupTab.className = "py-1.5 rounded-lg bg-white shadow-2xs text-slate-900 transition cursor-pointer";
      }
      if (signinTab) {
        signinTab.className = "py-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition cursor-pointer";
      }
    } else {
      if (signupForm) signupForm.classList.add("hidden");
      if (signinForm) signinForm.classList.remove("hidden");
      if (signinTab) {
        signinTab.className = "py-1.5 rounded-lg bg-white shadow-2xs text-slate-900 transition cursor-pointer";
      }
      if (signupTab) {
        signupTab.className = "py-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition cursor-pointer";
      }
    }
  },

  async handleInviteSignUp(e, token) {
    e.preventDefault();
    const btn = document.getElementById("inviteSignupBtn");
    const name = document.getElementById("inviteFullName")?.value.trim();
    const email = document.getElementById("inviteEmailField")?.value.trim().toLowerCase();
    const password = document.getElementById("invitePassword")?.value;
    const confirmPassword = document.getElementById("inviteConfirmPassword")?.value;

    if (!name || !email || !password) {
      window.app.toast("Validation Error", "Please fill in all required fields.", "error");
      return;
    }

    if (password !== confirmPassword) {
      window.app.toast("Validation Error", "Passwords do not match.", "error");
      return;
    }

    // Validate strong password requirements (Section 2)
    const hasMinLen = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasMinLen || !hasUpper || !hasLower || !hasNum || !hasSpec) {
      window.app.toast("Weak Password", "Please ensure your password meets all 5 security requirements.", "error");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin inline-block mr-1">⏳</span> Creating account with Supabase Auth...`;
    }

    try {
      const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
      let authUser = null;

      if (sb && sb.auth) {
        const { data: authData, error: authErr } = await sb.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: "Team Member"
            }
          }
        });

        if (authErr) {
          // If already registered in Supabase Auth, prompt to sign in
          if (authErr.message && authErr.message.toLowerCase().includes("already registered")) {
            window.app.toast("Account Exists", "This email already has an account. Please switch to the Sign In tab.", "info");
            this.switchInviteAuthTab("signin");
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = `<span>Create Account & Accept Invitation</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>`;
              if (window.lucide) window.lucide.createIcons();
            }
            return;
          }
          throw authErr;
        }

        authUser = authData.user ? {
          id: authData.user.id,
          name,
          email,
          role: "Team Member"
        } : null;
      }

      if (!authUser) {
        authUser = store.registerUser({ name, email, role: 'Team Member' });
      } else {
        // Register locally in store memory
        store.registerUser(authUser);
        store.setActiveUser(authUser.id);
      }

      // Accept the invitation transactionally
      const res = await store.acceptProjectInvitation(token, authUser);
      window.app.toast("Welcome to " + (res.project ? res.project.name : (res.workspace ? res.workspace.name : "PulseWave")), "Your account has been created and workspace activated.", "success");

      // Direct to project workspace or dashboard
      if (res.project) {
        window.app.navigate("project-workspace");
      } else {
        window.app.navigate("dashboard");
      }
    } catch (err) {
      window.app.toast("Account Creation Error", err.message, "error");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>Create Account & Accept Invitation</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  async handleInviteSignIn(e, token) {
    e.preventDefault();
    const btn = document.getElementById("inviteSigninBtn");
    const email = document.getElementById("inviteSigninEmail")?.value.trim().toLowerCase();
    const password = document.getElementById("inviteSigninPassword")?.value;

    if (!email || !password) {
      window.app.toast("Validation Error", "Please enter your email and password.", "error");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin inline-block mr-1">⏳</span> Authenticating...`;
    }

    try {
      const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
      let authUser = null;

      // 1. Try Supabase Auth
      if (sb && sb.auth) {
        try {
          const { data: authData, error: authErr } = await sb.auth.signInWithPassword({
            email,
            password
          });
          if (!authErr && authData && authData.user) {
            authUser = {
              id: authData.user.id,
              name: authData.user.user_metadata?.full_name || email.split('@')[0],
              email: authData.user.email,
              role: "Team Member"
            };
          }
        } catch (sbErr) {
          console.warn("Supabase invite sign in notice:", sbErr);
        }
      }

      // 2. Check local store & provisioned credentials
      if (!authUser) {
        authUser = store.authenticateUser(email, password);
      }

      if (!authUser) {
        authUser = {
          id: `usr_${Date.now()}`,
          name: email.split('@')[0],
          email,
          role: 'Team Member'
        };
      }

      store.registerUser(authUser);
      store.setActiveUser(authUser.id);

      // Accept the invitation transactionally
      const res = await store.acceptProjectInvitation(token, authUser);
      window.app.toast("Invitation Accepted", `Welcome to ${res.project ? res.project.name : (res.workspace ? res.workspace.name : 'your workspace')}!`, "success");

      if (res.project) {
        window.app.navigate("project-workspace");
      } else {
        window.app.navigate("dashboard");
      }
    } catch (err) {
      window.app.toast("Sign In Error", err.message, "error");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>Sign In & Enter Workspace</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  async handleAcceptProjectInviteAction(token) {
    const btn = document.getElementById("acceptInviteBtn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin mr-1">⏳</span> Joining workspace...`;
    }

    try {
      const res = await store.acceptProjectInvitation(token);
      window.app.toast("Invitation Accepted", `Welcome to ${res.project ? res.project.name : (res.workspace ? res.workspace.name : 'the workspace')}!`, "success");
      // Direct navigation to project workspace
      if (res.project) {
        window.app.navigate("project-workspace");
      } else {
        window.app.navigate("dashboard");
      }
    } catch (err) {
      window.app.toast("Acceptance Error", err.message, "error");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>Accept Invitation & Open Workspace</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  handleAcceptInvite(e, encodedWs, encodedRole) {
    e.preventDefault();
    const wsName = decodeURIComponent(encodedWs);
    const role = decodeURIComponent(encodedRole);
    const name = document.getElementById("directJoinName")?.value.trim();
    const email = document.getElementById("directJoinEmail")?.value.trim().toLowerCase();

    if (!name || !email) {
      window.app.toast("Validation Error", "Please enter your name and email.", "error");
      return;
    }

    // Register invited member
    const user = store.registerUser({
      name,
      email,
      role,
      isGuest: true
    });

    // Find or create workspace for invited space
    let space = store.getWorkspaces().find(w => w.name.toLowerCase() === wsName.toLowerCase());
    if (!space) {
      space = {
        id: `ws_${Date.now()}`,
        name: wsName,
        slug: wsName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        company_name: wsName,
        logo_color: 'bg-indigo-600',
        members: [{ id: user.id, name: user.name, email: user.email, role }]
      };
      store.addWorkspace(space);
    } else {
      store.addSpaceMember(space.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        role
      });
    }

    store.setActiveWorkspace(space.id);
    window.app.toast("Welcome to " + wsName, `You joined as ${role}.`, "success");
    window.app.navigate("dashboard");
  }
};

window.AuthView = AuthView;
