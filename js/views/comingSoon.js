/**
 * All-in-One Software Project & QA Management Platform (V1)
 * Standard Coming Soon View for Locked Future Features
 */

const ComingSoonView = {
  render(container, featureName = "Future Feature") {
    container.innerHTML = `
      <div class="flex items-center justify-center min-h-[70vh] p-4 animate-fade-in">
        <div class="bg-white rounded-2xl p-8 sm:p-12 max-w-lg w-full border border-slate-200 shadow-sm text-center space-y-6">
          <!-- Lock Icon -->
          <div class="w-16 h-16 rounded-2xl bg-slate-900 text-[#bef264] flex items-center justify-center mx-auto shadow-xs">
            <i data-lucide="lock" class="w-8 h-8"></i>
          </div>

          <!-- Title & Copy (Exact prompt specification) -->
          <div class="space-y-2">
            <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              ${featureName}
            </span>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">COMING SOON</h1>
            <p class="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              This feature is planned for a future version.<br />
              We are currently focused on the core <strong>Project & Issue Management</strong> experience.
            </p>
          </div>

          <!-- Version Pill -->
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-[#bef264] text-xs font-semibold border border-slate-800">
            <span class="w-2 h-2 rounded-full bg-[#bef264]"></span>
            Current Version: <strong>V1</strong>
          </div>

          <!-- Action Button -->
          <div class="pt-2">
            <button onclick="window.app.navigate('dashboard')" class="px-6 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl text-xs font-bold shadow-xs shadow-[#bef264]/25 transition inline-flex items-center gap-2 cursor-pointer">
              <i data-lucide="arrow-left" class="w-4 h-4"></i> Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};

window.ComingSoonView = ComingSoonView;
