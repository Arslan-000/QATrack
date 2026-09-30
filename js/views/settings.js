/**
 * PulseWave — Executive Workspace & Profile Settings Hub (V2.5)
 * Space Configuration, Profile Settings, Team Directory, Invitations, Security & Danger Zones
 * Synchronized with Local Storage and Supabase PostgreSQL Cloud
 */

const SettingsView = {
  activeTab: "space", // "space" | "profile" | "team" | "invitations" | "security" | "danger"
  memberSearchQuery: "",
  invitationSearchQuery: "",

  setTab(tab) {
    this.activeTab = tab;
    const contentArea = document.getElementById("mainContent");
    if (contentArea) this.render(contentArea);
  },

  render(container) {
    const activeSpace = store.getActiveWorkspace() || { 
      id: 'ws_none', 
      name: 'My Space', 
      company_name: 'My Company', 
      slug: 'my-space', 
      workspace_type: 'Software Company',
      logo_color: 'bg-slate-950',
      description: ''
    };
    const activeUser = store.getActiveUser() || { 
      id: 'usr_none', 
      name: 'User', 
      email: '', 
      role: 'PROJECT_MANAGER', 
      initials: 'U', 
      color: 'bg-slate-950',
      bio: '',
      phone: ''
    };

    const allMembers = store.getWorkspaceMembers ? store.getWorkspaceMembers(activeSpace.id) : (activeSpace.members || []);
    const invitations = store.getInvitations ? store.getInvitations(activeSpace.id) : [];

    const spaceRole = store.getUserSpaceRole ? store.getUserSpaceRole(activeSpace.id, activeUser?.id) : (activeUser?.role || 'PM');
    const isOwnerOrPm = spaceRole === "PM" || spaceRole === "OWNER" || spaceRole === "PROJECT_MANAGER";

    // Filter members if query present
    const filteredMembers = this.memberSearchQuery ? allMembers.filter(m => 
      (m.name || '').toLowerCase().includes(this.memberSearchQuery.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(this.memberSearchQuery.toLowerCase()) ||
      (m.role || '').toLowerCase().includes(this.memberSearchQuery.toLowerCase())
    ) : allMembers;

    // Filter invitations if query present
    const filteredInvitations = this.invitationSearchQuery ? invitations.filter(i => 
      (i.invited_email || i.invitedEmail || '').toLowerCase().includes(this.invitationSearchQuery.toLowerCase()) ||
      (i.role || '').toLowerCase().includes(this.invitationSearchQuery.toLowerCase())
    ) : invitations;

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-16 max-w-4xl text-xs font-sans">
        
        <!-- Top Title & Space ID Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <div class="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
                <i data-lucide="settings" class="w-5 h-5"></i>
              </div>
              <span>Settings & Preferences</span>
            </h1>
            <p class="text-slate-500 text-xs mt-1">Manage space configuration, your profile, team permissions, security, and invitations.</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Space: ${activeSpace.name} (${spaceRole === 'PM' ? 'Project Manager' : (spaceRole === 'QA' ? 'QA Engineer' : (spaceRole === 'DEVELOPER' ? 'Developer' : 'Viewer'))})
            </span>
          </div>
        </div>

        <!-- Segmented Tab Switcher -->
        <div class="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 max-w-full overflow-x-auto shadow-2xs">
          <button
            onclick="SettingsView.setTab('space')"
            class="px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'space' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            <i data-lucide="building-2" class="w-3.5 h-3.5 ${this.activeTab === 'space' ? 'text-slate-900' : 'text-slate-400'}"></i>
            <span>Space Settings</span>
          </button>

          <button
            onclick="SettingsView.setTab('profile')"
            class="px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'profile' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            <i data-lucide="user" class="w-3.5 h-3.5 ${this.activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-400'}"></i>
            <span>Profile Settings</span>
          </button>

          <button
            onclick="SettingsView.setTab('team')"
            class="px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'team' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            <i data-lucide="users" class="w-3.5 h-3.5 ${this.activeTab === 'team' ? 'text-indigo-600' : 'text-slate-400'}"></i>
            <span>Team Members</span>
            <span class="px-1.5 py-0.2 rounded-full text-[9px] ${this.activeTab === 'team' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'} font-bold">${allMembers.length}</span>
          </button>

          <button
            onclick="SettingsView.setTab('invitations')"
            class="px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'invitations' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            <i data-lucide="mail" class="w-3.5 h-3.5 ${this.activeTab === 'invitations' ? 'text-violet-600' : 'text-slate-400'}"></i>
            <span>Invitations</span>
            ${invitations.length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 text-amber-800 font-bold">${invitations.length}</span>` : ''}
          </button>

          <button
            onclick="SettingsView.setTab('security')"
            class="px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'security' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            <i data-lucide="shield-check" class="w-3.5 h-3.5 ${this.activeTab === 'security' ? 'text-cyan-600' : 'text-slate-400'}"></i>
            <span>Security & Alerts</span>
          </button>

          <button
            onclick="SettingsView.setTab('notifications')"
            class="px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'notifications' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            <i data-lucide="bell-ring" class="w-3.5 h-3.5 ${this.activeTab === 'notifications' ? 'text-amber-500' : 'text-slate-400'}"></i>
            <span>Notifications & Emails</span>
          </button>

          <button
            onclick="SettingsView.setTab('danger')"
            class="px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'danger' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-rose-600'}"
          >
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5 ${this.activeTab === 'danger' ? 'text-rose-600' : 'text-slate-400'}"></i>
            <span>Danger Zone</span>
          </button>
        </div>

        <!-- =========================================================================
             TAB 1: SPACE SETTINGS
             ========================================================================= -->
        ${this.activeTab === 'space' ? `
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
            ${!isOwnerOrPm ? `
              <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-amber-900 text-xs">
                <i data-lucide="shield-alert" class="w-4 h-4 text-amber-600 shrink-0"></i>
                <span>You have <strong>read-only access</strong> to Space configuration. Only Workspace Owners and Project Managers can modify settings.</span>
              </div>
            ` : ''}

            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 class="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                  <i data-lucide="building" class="w-4 h-4 text-slate-900"></i>
                  <span>Space Configuration</span>
                </h2>
                <p class="text-slate-400 text-[11px] mt-0.5">Update your workspace branding, organization title, and operational category.</p>
              </div>
              <div class="w-10 h-10 rounded-2xl ${activeSpace.logo_color || 'bg-slate-950'} text-white font-black text-sm flex items-center justify-center uppercase shadow-sm border border-slate-200">
                ${(activeSpace.name || 'S').substring(0, 2).toUpperCase()}
              </div>
            </div>

            <form onsubmit="SettingsView.handleUpdateSpace(event, '${activeSpace.id}')" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px]">Space Name *</label>
                  <input
                    type="text"
                    id="settingsSpaceName"
                    value="${activeSpace.name || ''}"
                    ${!isOwnerOrPm ? 'disabled' : 'required'}
                    class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50 focus:bg-white transition ${!isOwnerOrPm ? 'cursor-not-allowed opacity-75' : ''}"
                    placeholder="e.g. Apex Global Space"
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px]">Company / Organization</label>
                  <input
                    type="text"
                    id="settingsCompanyName"
                    value="${activeSpace.company_name || activeSpace.name || ''}"
                    ${!isOwnerOrPm ? 'disabled' : ''}
                    class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50 focus:bg-white transition ${!isOwnerOrPm ? 'cursor-not-allowed opacity-75' : ''}"
                    placeholder="e.g. Apex Technologies Inc."
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px]">Space URL Slug</label>
                  <input
                    type="text"
                    id="settingsSpaceSlug"
                    value="${activeSpace.slug || activeSpace.id || ''}"
                    readonly
                    class="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px]">Workspace Type</label>
                  <select id="settingsSpaceType" ${!isOwnerOrPm ? 'disabled' : ''} class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-white ${!isOwnerOrPm ? 'cursor-not-allowed opacity-75' : ''}">
                    <option value="Software Company" ${activeSpace.workspace_type === 'Software Company' ? 'selected' : ''}>Software Company</option>
                    <option value="QA & Testing Agency" ${activeSpace.workspace_type === 'QA & Testing Agency' ? 'selected' : ''}>QA & Testing Agency</option>
                    <option value="Enterprise IT" ${activeSpace.workspace_type === 'Enterprise IT' ? 'selected' : ''}>Enterprise IT</option>
                    <option value="Product Studio" ${activeSpace.workspace_type === 'Product Studio' ? 'selected' : ''}>Product Studio</option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px]">Theme Accent Color</label>
                  <select id="settingsSpaceLogoColor" ${!isOwnerOrPm ? 'disabled' : ''} class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-white ${!isOwnerOrPm ? 'cursor-not-allowed opacity-75' : ''}">
                    <option value="bg-slate-950" ${activeSpace.logo_color === 'bg-slate-950' ? 'selected' : ''}>Obsidian Lime (Default)</option>
                    <option value="bg-emerald-600" ${activeSpace.logo_color === 'bg-emerald-600' ? 'selected' : ''}>Emerald Green</option>
                    <option value="bg-indigo-600" ${activeSpace.logo_color === 'bg-indigo-600' ? 'selected' : ''}>Deep Indigo</option>
                    <option value="bg-purple-600" ${activeSpace.logo_color === 'bg-purple-600' ? 'selected' : ''}>Royal Purple</option>
                    <option value="bg-amber-600" ${activeSpace.logo_color === 'bg-amber-600' ? 'selected' : ''}>Amber Sun</option>
                    <option value="bg-slate-900" ${activeSpace.logo_color === 'bg-slate-900' ? 'selected' : ''}>Midnight Obsidian</option>
                    <option value="bg-rose-600" ${activeSpace.logo_color === 'bg-rose-600' ? 'selected' : ''}>Crimson Rose</option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px]">Space Description / Scope</label>
                  <input
                    type="text"
                    id="settingsSpaceDescription"
                    value="${activeSpace.description || ''}"
                    ${!isOwnerOrPm ? 'disabled' : ''}
                    class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50 focus:bg-white transition ${!isOwnerOrPm ? 'cursor-not-allowed opacity-75' : ''}"
                    placeholder="Brief objective of this QA & project workspace"
                  />
                </div>
              </div>

              ${isOwnerOrPm ? `
                <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                    <i data-lucide="cloud-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                    Synced with Supabase spaces table
                  </span>
                  <button
                    type="submit"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    <i data-lucide="save" class="w-4 h-4"></i>
                    <span>Save Space Changes</span>
                  </button>
                </div>
              ` : ''}
            </form>
          </div>
        ` : ''}

        <!-- =========================================================================
             TAB 2: PROFILE SETTINGS
             ========================================================================= -->
        ${this.activeTab === 'profile' ? `
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 class="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                  <i data-lucide="user-check" class="w-4 h-4 text-emerald-600"></i>
                  <span>Personal Profile Settings</span>
                </h2>
                <p class="text-slate-400 text-[11px] mt-0.5">Manage your user identity, system role, initials, and persona styling.</p>
              </div>
              <div class="w-12 h-12 rounded-2xl ${activeUser.color || 'bg-slate-950 text-[#bef264]'} flex items-center justify-center font-black text-sm uppercase shadow-sm border border-slate-200">
                ${activeUser.initials || (activeUser.name ? activeUser.name.substring(0, 2).toUpperCase() : 'PW')}
              </div>
            </div>

            <form onsubmit="SettingsView.handleUpdateProfile(event)" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px]">Full Name *</label>
                  <input
                    type="text"
                    id="settingsProfileName"
                    value="${activeUser.name || ''}"
                    required
                    class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50 focus:bg-white transition"
                    placeholder="Your Full Name"
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px] flex items-center justify-between">
                    <span>Email Address</span>
                    <span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Supabase Auth Verified</span>
                  </label>
                  <input
                    type="email"
                    id="settingsProfileEmail"
                    value="${activeUser.email || ''}"
                    readonly
                    class="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px]">System Role / Discipline</label>
                  <select id="settingsProfileRole" class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-white">
                    <option value="PROJECT_MANAGER" ${(activeUser.role || '').includes('PROJECT_MANAGER') || (activeUser.role || '').includes('Manager') ? 'selected' : ''}>Project Manager (Admin / Space Lead)</option>
                    <option value="QA_ENGINEER" ${(activeUser.role || '').includes('QA') ? 'selected' : ''}>QA Engineer / Lead Tester</option>
                    <option value="DEVELOPER" ${(activeUser.role || '').includes('DEVELOPER') ? 'selected' : ''}>Software Developer</option>
                    <option value="VIEWER" ${(activeUser.role || '').includes('VIEWER') ? 'selected' : ''}>Stakeholder / Viewer</option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px]">Display Initials</label>
                  <input
                    type="text"
                    id="settingsProfileInitials"
                    value="${activeUser.initials || ''}"
                    maxlength="3"
                    class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono uppercase font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50 focus:bg-white transition"
                    placeholder="e.g. AP"
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px]">Avatar Color Theme</label>
                  <select id="settingsProfileColor" class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-white">
                    <option value="bg-slate-950 text-[#bef264]" ${activeUser.color === 'bg-slate-950 text-[#bef264]' ? 'selected' : ''}>Obsidian Lime (Brand Signature)</option>
                    <option value="bg-slate-950 text-[#bef264]" ${activeUser.color === 'bg-slate-950 text-[#bef264]' ? 'selected' : ''}>Obsidian Lime</option>
                    <option value="bg-emerald-600 text-white" ${activeUser.color === 'bg-emerald-600 text-white' ? 'selected' : ''}>Emerald Teal</option>
                    <option value="bg-indigo-600 text-white" ${activeUser.color === 'bg-indigo-600 text-white' ? 'selected' : ''}>Indigo Purple</option>
                    <option value="bg-rose-600 text-white" ${activeUser.color === 'bg-rose-600 text-white' ? 'selected' : ''}>Crimson Coral</option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-[11px]">Phone / Extension (Optional)</label>
                  <input
                    type="text"
                    id="settingsProfilePhone"
                    value="${activeUser.phone || ''}"
                    class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50 focus:bg-white transition"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1 text-[11px]">Professional Bio / QA Specialization</label>
                <textarea
                  id="settingsProfileBio"
                  rows="2"
                  class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50/50 focus:bg-white transition"
                  placeholder="e.g. Lead QA Engineer specializing in automated regression, performance benchmarks, and release readiness gates."
                >${activeUser.bio || ''}</textarea>
              </div>

              <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                  <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                  Synced with Supabase profiles table
                </span>
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        ` : ''}

        <!-- =========================================================================
             TAB 3: TEAM MEMBERS
             ========================================================================= -->
        ${this.activeTab === 'team' ? `
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6 animate-fade-in">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 class="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                  <i data-lucide="users" class="w-4 h-4 text-indigo-600"></i>
                  <span>Team Directory (${allMembers.length})</span>
                </h2>
                <p class="text-slate-400 text-[11px] mt-0.5">Manage team roster, access levels, and assign role-based permissions in ${activeSpace.name}.</p>
              </div>
              
              <div class="flex items-center gap-2">
                ${isOwnerOrPm ? `
                  <button
                    onclick="SettingsView.openInviteModal('${activeSpace.id}')"
                    class="px-3.5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i data-lucide="user-plus" class="w-3.5 h-3.5 text-slate-950"></i>
                    <span>Invite Teammate</span>
                  </button>
                ` : `
                  <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                    Read-Only Directory
                  </span>
                `}
              </div>
            </div>

            <!-- Search Filter Bar -->
            <div class="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
              <input
                type="text"
                value="${this.memberSearchQuery}"
                oninput="SettingsView.memberSearchQuery = this.value; SettingsView.render(document.getElementById('mainContent'))"
                placeholder="Search teammates by name, email, or role..."
                class="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              ${this.memberSearchQuery ? `
                <button onclick="SettingsView.memberSearchQuery = ''; SettingsView.render(document.getElementById('mainContent'))" class="text-slate-400 hover:text-slate-600 text-[11px] font-bold">Clear</button>
              ` : ''}
            </div>

            <!-- Active Members Table -->
            <div class="overflow-x-auto rounded-xl border border-slate-200">
              <table class="w-full text-left text-slate-700">
                <thead class="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th class="py-2.5 px-3">Member</th>
                    <th class="py-2.5 px-3">Email</th>
                    <th class="py-2.5 px-3">Role & Permissions</th>
                    <th class="py-2.5 px-3">Status</th>
                    <th class="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs">
                  ${filteredMembers.length === 0 ? `
                    <tr>
                      <td colspan="5" class="p-8 text-center text-slate-400">
                        <i data-lucide="users" class="w-8 h-8 text-slate-300 mx-auto mb-1"></i>
                        <p class="font-bold text-slate-600">No teammates found.</p>
                        <p class="text-[11px] mt-0.5">Click "Invite Teammate" to invite colleagues to this space.</p>
                      </td>
                    </tr>
                  ` : filteredMembers.map(m => {
                    const isCurrentUser = activeUser && ((m.user_id && m.user_id === activeUser.id) || (m.email && m.email.toLowerCase() === (activeUser.email || '').toLowerCase()));
                    const mRole = (m.role || 'QA_ENGINEER').toUpperCase();
                    return `
                      <tr class="hover:bg-slate-50/70 transition">
                        <td class="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                          <div class="w-7 h-7 rounded-full bg-slate-900 text-[#bef264] font-bold text-[10px] flex items-center justify-center uppercase shadow-2xs border border-slate-200">
                            ${(m.name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div class="flex items-center gap-1.5">
                              <span>${m.name || 'Member'}</span>
                              ${isCurrentUser ? '<span class="px-1.5 py-0.2 rounded bg-slate-900 text-[#bef264] text-[9px] font-bold">You</span>' : ''}
                            </div>
                          </div>
                        </td>
                        <td class="py-2.5 px-3 font-mono text-slate-500 text-[11px]">${m.email || '—'}</td>
                        <td class="py-2.5 px-3">
                          ${isOwnerOrPm && !isCurrentUser ? `
                            <select
                              onchange="SettingsView.handleUpdateMemberRole('${activeSpace.id}', '${m.id || m.user_id || m.email}', this.value)"
                              class="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none cursor-pointer"
                            >
                              <option value="PROJECT_MANAGER" ${mRole.includes('PROJECT_MANAGER') || mRole.includes('MANAGER') ? 'selected' : ''}>Project Manager</option>
                              <option value="QA_ENGINEER" ${mRole.includes('QA') ? 'selected' : ''}>QA Engineer</option>
                              <option value="DEVELOPER" ${mRole.includes('DEVELOPER') ? 'selected' : ''}>Developer</option>
                              <option value="VIEWER" ${mRole.includes('VIEWER') ? 'selected' : ''}>Viewer</option>
                            </select>
                          ` : `
                            <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              mRole.includes('OWNER') || mRole.includes('MANAGER') ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              mRole.includes('QA') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              mRole.includes('DEVELOPER') ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }">
                              ${m.role || 'QA_ENGINEER'}
                            </span>
                          `}
                        </td>
                        <td class="py-2.5 px-3">
                          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        </td>
                        <td class="py-2.5 px-3 text-right">
                          ${!isCurrentUser && isOwnerOrPm ? `
                            <button
                              onclick="SettingsView.openRemoveMemberModal('${activeSpace.id}', '${m.id || m.user_id || m.email}', '${encodeURIComponent(m.name || m.email)}')"
                              class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Remove Teammate"
                            >
                              <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                          ` : `
                            <span class="text-[10px] font-medium text-slate-400">—</span>
                          `}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- =========================================================================
             TAB 4: INVITATIONS
             ========================================================================= -->
        ${this.activeTab === 'invitations' ? `
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 animate-fade-in">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 class="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                  <i data-lucide="mail" class="w-4 h-4 text-violet-600"></i>
                  <span>Pending & Active Invitations (${invitations.length})</span>
                </h2>
                <p class="text-slate-400 text-[11px] mt-0.5">Track dispatched invitations, copy onboarding join links, and manage member requests.</p>
              </div>

              ${isOwnerOrPm ? `
                <button
                  onclick="SettingsView.openInviteModal('${activeSpace.id}')"
                  class="px-3.5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold shadow-xs shadow-[#bef264]/25 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>New Invitation</span>
                </button>
              ` : `
                <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                  Read-Only Invitations
                </span>
              `}
            </div>

            <!-- Search Filter Bar -->
            <div class="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
              <input
                type="text"
                value="${this.invitationSearchQuery}"
                oninput="SettingsView.invitationSearchQuery = this.value; SettingsView.render(document.getElementById('mainContent'))"
                placeholder="Filter invitations by email or role..."
                class="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              ${this.invitationSearchQuery ? `
                <button onclick="SettingsView.invitationSearchQuery = ''; SettingsView.render(document.getElementById('mainContent'))" class="text-slate-400 hover:text-slate-600 text-[11px] font-bold">Clear</button>
              ` : ''}
            </div>

            ${filteredInvitations.length === 0 ? `
              <div class="p-8 text-center text-slate-400 space-y-1">
                <i data-lucide="mail-check" class="w-8 h-8 text-slate-300 mx-auto mb-1"></i>
                <p class="font-bold text-slate-700">No Pending Invitations</p>
                <p class="text-[11px]">All teammates have joined or no invites are outstanding.</p>
              </div>
            ` : `
              <div class="space-y-2.5">
                ${filteredInvitations.map(inv => {
                  const token = inv.token || inv.id;
                  const isPending = (inv.status || '').toLowerCase() === 'pending';
                  return `
                    <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-300 transition">
                      <div class="flex items-center gap-3">
                        <span class="w-2.5 h-2.5 rounded-full shrink-0 ${isPending ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'}"></span>
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="font-bold text-slate-900 font-mono text-xs">${inv.invited_email || inv.invitedEmail}</span>
                            <span class="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700">${inv.role}</span>
                            <span class="text-[10px] font-semibold ${isPending ? 'text-amber-600' : 'text-slate-400'}">(${inv.status || 'Pending'})</span>
                          </div>
                          <div class="text-[10px] text-slate-400 mt-0.5">
                            Invited by ${inv.invited_by || inv.invitedBy || 'Admin'} • Sent ${new Date(inv.created_at || inv.createdAt || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 shrink-0">
                        <button
                          onclick="SettingsView.copyInviteLink('${token}')"
                          class="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Copy Direct Join Link"
                        >
                          <i data-lucide="copy" class="w-3 h-3 text-slate-500"></i>
                          <span>Copy Link</span>
                        </button>

                        ${isOwnerOrPm ? (isPending ? `
                          <button
                            onclick="SettingsView.handleResendInvite('${inv.id}')"
                            class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                          >
                            Resend
                          </button>
                          <button
                            onclick="SettingsView.handleCancelInvite('${inv.id}')"
                            class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        ` : `
                          <button
                            onclick="SettingsView.handleDeleteInvite('${inv.id}')"
                            class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                          >
                            Delete
                          </button>
                        `) : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        ` : ''}

        <!-- =========================================================================
             TAB 5: SECURITY & NOTIFICATIONS
             ========================================================================= -->
        ${this.activeTab === 'security' ? `
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 class="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                  <i data-lucide="shield-check" class="w-4 h-4 text-cyan-600"></i>
                  <span>Security & Notification Preferences</span>
                </h2>
                <p class="text-slate-400 text-[11px] mt-0.5">Manage authentication credentials, password reset requests, and real-time QA alert preferences.</p>
              </div>
            </div>

            <!-- Password Reset Section -->
            <div class="p-4 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 class="font-bold text-slate-900 text-xs">Reset Account Password</h4>
                <p class="text-[11px] text-slate-500 mt-0.5">
                  Send a secure password reset link to your verified email address: <span class="font-mono font-bold text-slate-700">${activeUser.email || 'your email'}</span>
                </p>
              </div>
              <button
                type="button"
                onclick="SettingsView.handleRequestPasswordReset('${activeUser.email || ''}')"
                class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <i data-lucide="key" class="w-3.5 h-3.5"></i>
                <span>Send Reset Link</span>
              </button>
            </div>

            <!-- Notification Toggles -->
            <div class="space-y-3 pt-2">
              <h3 class="font-bold text-slate-800 text-xs uppercase tracking-wider text-[10px]">Real-Time Notifications</h3>
              
              <label class="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition cursor-pointer">
                <div>
                  <div class="font-bold text-slate-800 text-xs">Defect & Bug Assignments</div>
                  <div class="text-[11px] text-slate-400">Receive alerts when issues or failed test cases are assigned to you.</div>
                </div>
                <input type="checkbox" checked class="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
              </label>

              <label class="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition cursor-pointer">
                <div>
                  <div class="font-bold text-slate-800 text-xs">QA Release Gate & Sign-Off Alerts</div>
                  <div class="text-[11px] text-slate-400">Get notified when a release cycle achieves 100% test execution or has blockers.</div>
                </div>
                <input type="checkbox" checked class="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
              </label>

              <label class="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition cursor-pointer">
                <div>
                  <div class="font-bold text-slate-800 text-xs">Test Execution Cycle Summary</div>
                  <div class="text-[11px] text-slate-400">Receive daily digest of test run results across active projects.</div>
                </div>
                <input type="checkbox" class="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
              </label>
            </div>
          </div>
        ` : ''}

        <!-- =========================================================================
             TAB 6: DANGER ZONE
             ========================================================================= -->
        ${this.activeTab === 'danger' ? `
          <div class="bg-rose-50/40 rounded-2xl p-6 border border-rose-200 shadow-sm space-y-4 animate-fade-in">
            <div class="flex items-center gap-2 text-rose-700 font-extrabold text-sm pb-2 border-b border-rose-200 uppercase">
              <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-600"></i>
              <span>Danger Zone</span>
            </div>

            <!-- Danger Item 1: Delete Space -->
            ${isOwnerOrPm ? `
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-rose-200 shadow-2xs">
                <div>
                  <h4 class="font-extrabold text-slate-900 text-xs">Delete this Space permanently</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5 max-w-lg">
                    Permanently removes <strong>${activeSpace.name}</strong>, all associated projects, members, tickets, and test runs from Supabase and local storage. This action cannot be undone.
                  </p>
                </div>
                <button
                  onclick="SettingsView.openDeleteSpaceModal('${activeSpace.id}', '${encodeURIComponent(activeSpace.name)}')"
                  class="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  <span>Delete Space</span>
                </button>
              </div>
            ` : `
              <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <i data-lucide="shield-alert" class="w-4 h-4 text-amber-600 shrink-0"></i>
                <span>Space deletion is restricted to Workspace Owners and Project Managers.</span>
              </div>
            `}

            <!-- Danger Item 2: Delete Account -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-rose-200 shadow-2xs">
              <div>
                <h4 class="font-extrabold text-slate-900 text-xs">Delete your User Account</h4>
                <p class="text-[11px] text-slate-500 mt-0.5 max-w-lg">
                  Permanently removes your profile, memberships, and credentials from Supabase and PulseWave.
                </p>
              </div>
              <button
                onclick="SettingsView.openDeleteAccountModal()"
                class="px-3.5 py-2 bg-slate-900 hover:bg-rose-950 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <i data-lucide="user-x" class="w-3.5 h-3.5"></i>
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- =========================================================================
             TAB 7: NOTIFICATIONS & AUTOMATED EMAIL ALERTS
             ========================================================================= -->
        ${this.activeTab === 'notifications' ? (() => {
          const prefs = store.getNotificationPreferences ? store.getNotificationPreferences() : {};
          const emailLogs = store.getEmailLogs ? store.getEmailLogs(this.emailLogsSearchQuery || null) : [];
          return `
            <div class="space-y-6 animate-fade-in">
              
              <!-- 1. Email Preferences Header & Toggles -->
              <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 class="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                      <i data-lucide="mail" class="w-4 h-4 text-purple-600"></i>
                      <span>Automated Email Notification Preferences</span>
                    </h2>
                    <p class="text-[11px] text-slate-500 mt-0.5">Control which platform events trigger real-time responsive HTML email notifications.</p>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Dispatch Active
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <!-- Item 1: Chat Mentions & DMs -->
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="p-1 rounded-lg bg-emerald-100 text-emerald-800"><i data-lucide="message-square" class="w-3.5 h-3.5"></i></span>
                        <h4 class="font-extrabold text-slate-900 text-xs">Chat Mentions & Direct Messages</h4>
                      </div>
                      <p class="text-[11px] text-slate-500">Send email notification when someone tags you (@mention) or sends you a direct message.</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" ${prefs.emailOnChatMention !== false ? 'checked' : ''} onchange="SettingsView.handleTogglePref('emailOnChatMention', this.checked)" class="sr-only peer">
                      <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                    </label>
                  </div>

                  <!-- Item 2: Project & Space Assignments -->
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="p-1 rounded-lg bg-blue-100 text-blue-800"><i data-lucide="folder-plus" class="w-3.5 h-3.5"></i></span>
                        <h4 class="font-extrabold text-slate-900 text-xs">Project & Space Assignments</h4>
                      </div>
                      <p class="text-[11px] text-slate-500">Send email when you are assigned or invited to a project or workspace.</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" ${prefs.emailOnProjectAssignment !== false ? 'checked' : ''} onchange="SettingsView.handleTogglePref('emailOnProjectAssignment', this.checked)" class="sr-only peer">
                      <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                    </label>
                  </div>

                  <!-- Item 3: Task & Defect Assignments -->
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="p-1 rounded-lg bg-amber-100 text-amber-800"><i data-lucide="check-square" class="w-3.5 h-3.5"></i></span>
                        <h4 class="font-extrabold text-slate-900 text-xs">Task & Defect Assignments</h4>
                      </div>
                      <p class="text-[11px] text-slate-500">Send email when a new ticket, user story, or defect is assigned to you.</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" ${prefs.emailOnIssueAssignment !== false ? 'checked' : ''} onchange="SettingsView.handleTogglePref('emailOnIssueAssignment', this.checked)" class="sr-only peer">
                      <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                    </label>
                  </div>

                  <!-- Item 4: QA Verification Handovers -->
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="p-1 rounded-lg bg-purple-100 text-purple-800"><i data-lucide="clipboard-check" class="w-3.5 h-3.5"></i></span>
                        <h4 class="font-extrabold text-slate-900 text-xs">QA Verification Handovers</h4>
                      </div>
                      <p class="text-[11px] text-slate-500">Send email to QA Lead & Engineers when developers move tickets to "Ready for QA".</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" ${prefs.emailOnQAHandoff !== false ? 'checked' : ''} onchange="SettingsView.handleTogglePref('emailOnQAHandoff', this.checked)" class="sr-only peer">
                      <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                    </label>
                  </div>

                  <!-- Item 5: Blocker & Critical Bugs -->
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="p-1 rounded-lg bg-rose-100 text-rose-800"><i data-lucide="alert-octagon" class="w-3.5 h-3.5"></i></span>
                        <h4 class="font-extrabold text-slate-900 text-xs">Critical Blocker Escalations</h4>
                      </div>
                      <p class="text-[11px] text-slate-500">Broadcast immediate email alert to all project members when a Critical/Blocker bug is filed.</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" ${prefs.emailOnCriticalBug !== false ? 'checked' : ''} onchange="SettingsView.handleTogglePref('emailOnCriticalBug', this.checked)" class="sr-only peer">
                      <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                    </label>
                  </div>

                  <!-- Item 6: Sprint & Release Milestones -->
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="p-1 rounded-lg bg-violet-100 text-violet-800"><i data-lucide="calendar-range" class="w-3.5 h-3.5"></i></span>
                        <h4 class="font-extrabold text-slate-900 text-xs">Sprint & Release Milestones</h4>
                      </div>
                      <p class="text-[11px] text-slate-500">Send email updates when sprints are kicked off or completed with sprint reports.</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" ${prefs.emailOnSprintLifecycle !== false ? 'checked' : ''} onchange="SettingsView.handleTogglePref('emailOnSprintLifecycle', this.checked)" class="sr-only peer">
                      <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                    </label>
                  </div>

                </div>
              </div>

              <!-- 2. Interactive "Send Test Email" Dispatcher -->
              <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <div class="p-1.5 rounded-lg bg-slate-950 text-[#bef264]">
                      <i data-lucide="send" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-slate-900">Interactive Email Notification Tester</h3>
                      <p class="text-[11px] text-slate-500">Test any notification email template with live delivery to your inbox.</p>
                    </div>
                  </div>
                </div>

                <form onsubmit="SettingsView.handleSendTestEmail(event)" class="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  <div class="sm:col-span-4">
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">Scenario Template</label>
                    <select id="testEmailScenario" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-white">
                      <option value="project_assignment">🎯 Project Assignment Notification</option>
                      <option value="issue_assignment">⚡ Task / Defect Assigned</option>
                      <option value="qa_handoff">🔍 Ready for QA Handover</option>
                      <option value="critical_defect">🚨 Critical Blocker Bug Alert</option>
                      <option value="chat_mention">💬 Chat @Mention Alert</option>
                      <option value="sprint_milestone">🚀 Sprint Milestone Kickoff</option>
                    </select>
                  </div>

                  <div class="sm:col-span-5">
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">Recipient Email Address</label>
                    <input
                      type="email"
                      id="testEmailRecipient"
                      placeholder="e.g. your-email@company.com"
                      value="${activeUser.email || 'user@pulsewave.io'}"
                      required
                      class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"
                    />
                  </div>

                  <div class="sm:col-span-3 flex items-end">
                    <button
                      type="submit"
                      class="w-full py-2 px-4 bg-slate-950 hover:bg-slate-800 text-[#bef264] font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i data-lucide="mail-check" class="w-4 h-4"></i>
                      <span>Send Test Email</span>
                    </button>
                  </div>
                </form>
              </div>

              <!-- 3. Outbound Email Logs & Audit Trail -->
              <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <div class="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                      <i data-lucide="history" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-slate-900">Outbound Email Audit Trail</h3>
                      <p class="text-[11px] text-slate-500">Record of all notification emails dispatched across your workspace.</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search email logs..."
                      value="${this.emailLogsSearchQuery || ''}"
                      oninput="SettingsView.emailLogsSearchQuery = this.value; SettingsView.render(document.getElementById('mainContent'))"
                      class="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#bef264]/50 w-44"
                    />
                    <button
                      onclick="SettingsView.handleClearEmailLogs()"
                      class="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold rounded-xl text-[11px] transition cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <i data-lucide="trash" class="w-3 h-3"></i>
                      <span>Clear Logs</span>
                    </button>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold bg-slate-50/50">
                        <th class="py-2.5 px-3">Subject & Title</th>
                        <th class="py-2.5 px-3">Recipient</th>
                        <th class="py-2.5 px-3">Category</th>
                        <th class="py-2.5 px-3">Status</th>
                        <th class="py-2.5 px-3">Sent At</th>
                        <th class="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-xs">
                      ${emailLogs.length === 0 ? `
                        <tr>
                          <td colspan="6" class="py-8 text-center text-slate-400">
                            <i data-lucide="mail-open" class="w-6 h-6 mx-auto mb-1 text-slate-300"></i>
                            <p class="font-bold text-slate-600">No Outbound Emails Logged</p>
                            <p class="text-[10px] text-slate-400">Emails dispatched via assignments, QA handovers, and mentions will appear here.</p>
                          </td>
                        </tr>
                      ` : emailLogs.map(log => `
                        <tr class="hover:bg-slate-50/80 transition group">
                          <td class="py-2.5 px-3 font-bold text-slate-900 max-w-xs truncate">
                            <div class="truncate">${log.subject}</div>
                            <div class="text-[10px] text-slate-400 font-normal truncate">${log.projectName || 'PulseWave'}</div>
                          </td>
                          <td class="py-2.5 px-3 font-mono text-purple-900 text-[11px]">${log.recipient}</td>
                          <td class="py-2.5 px-3">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                              ${log.type}
                            </span>
                          </td>
                          <td class="py-2.5 px-3">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 uppercase">
                              ${log.status || 'DELIVERED'}
                            </span>
                          </td>
                          <td class="py-2.5 px-3 text-slate-400 text-[11px]">
                            ${new Date(log.sentAt).toLocaleString()}
                          </td>
                          <td class="py-2.5 px-3 text-right">
                            <button
                              onclick="window.app.openEmailPreviewModal('${log.id}')"
                              class="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer flex items-center gap-1 inline-flex"
                            >
                              <i data-lucide="eye" class="w-3 h-3"></i>
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          `;
        })() : ''}

      </div>

      <!-- Modal Container -->
      <div id="settingsModalContainer"></div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleUpdateProfile(e) {
    e.preventDefault();
    const name = document.getElementById("settingsProfileName")?.value.trim();
    const role = document.getElementById("settingsProfileRole")?.value || "PROJECT_MANAGER";
    const initials = document.getElementById("settingsProfileInitials")?.value.trim().toUpperCase() || (name ? name.substring(0, 2).toUpperCase() : "PW");
    const color = document.getElementById("settingsProfileColor")?.value || "bg-slate-950 text-[#bef264]";
    const phone = document.getElementById("settingsProfilePhone")?.value.trim() || "";
    const bio = document.getElementById("settingsProfileBio")?.value.trim() || "";

    if (!name) {
      window.app.toast("Validation Error", "Full name is required.", "error");
      return;
    }

    const activeUser = store.getActiveUser();
    if (activeUser) {
      if (store.updateUserProfile) {
        await store.updateUserProfile(activeUser.id, { name, role, initials, color, phone, bio });
      } else {
        activeUser.name = name;
        activeUser.role = role;
        activeUser.initials = initials;
        activeUser.color = color;
        activeUser.phone = phone;
        activeUser.bio = bio;
        store.saveState();
      }

      window.app.updateHeaderPersona();
      window.app.updateSidebarUserFooter();
      window.app.toast("Profile Saved", "Your profile details were synchronized with Supabase.", "success");
      this.render(document.getElementById("mainContent"));
    }
  },

  handleUpdateSpace(e, spaceId) {
    e.preventDefault();
    const name = document.getElementById("settingsSpaceName")?.value.trim();
    const company = document.getElementById("settingsCompanyName")?.value.trim();
    const type = document.getElementById("settingsSpaceType")?.value.trim();
    const logoColor = document.getElementById("settingsSpaceLogoColor")?.value || "bg-slate-950";
    const description = document.getElementById("settingsSpaceDescription")?.value.trim() || "";

    if (!name) {
      window.app.toast("Validation Error", "Space name is required.", "error");
      return;
    }

    if (store.updateWorkspace) {
      store.updateWorkspace(spaceId, {
        name,
        company_name: company,
        workspace_type: type,
        logo_color: logoColor,
        description
      });
    } else {
      const space = store.getWorkspaces().find(w => w.id === spaceId);
      if (space) {
        space.name = name;
        space.company_name = company;
        space.workspace_type = type;
        space.logo_color = logoColor;
        space.description = description;
        store.addWorkspace(space);
      }
    }

    window.app.updateSidebarSpacesExplorer();
    window.app.toast("Space Updated", `Saved settings for ${name}.`, "success");
    this.render(document.getElementById("mainContent"));
  },

  async handleUpdateMemberRole(spaceId, memberId, newRole) {
    if (store.updateWorkspaceMemberRole) {
      await store.updateWorkspaceMemberRole(spaceId, memberId, newRole);
      window.app.toast("Role Updated", `Member role updated to ${newRole}.`, "success");
      this.render(document.getElementById("mainContent"));
    }
  },

  openRemoveMemberModal(spaceId, memberId, encodedName) {
    const memberName = decodeURIComponent(encodedName);
    const modalContainer = document.getElementById("settingsModalContainer");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-xs font-sans">
        <div class="bg-white rounded-2xl max-w-sm w-full border border-rose-200 shadow-2xl p-6 space-y-4 animate-scale-up text-center">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <i data-lucide="user-minus" class="w-6 h-6"></i>
          </div>
          <div>
            <h3 class="text-base font-black text-slate-950">Remove Teammate?</h3>
            <p class="text-slate-500 text-xs mt-1">
              Are you sure you want to remove <strong>${memberName}</strong> from this Space? They will lose access to all projects and test suites.
            </p>
          </div>
          <div class="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onclick="SettingsView.closeModal()"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick="SettingsView.confirmRemoveMember('${spaceId}', '${memberId}')"
              class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              Remove Member
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async confirmRemoveMember(spaceId, memberId) {
    try {
      if (store.removeWorkspaceMember) {
        await store.removeWorkspaceMember(spaceId, memberId);
        window.app.toast("Member Removed", "Teammate was removed from the space.", "info");
        this.closeModal();
        this.render(document.getElementById("mainContent"));
      }
    } catch (err) {
      window.app.toast("Cannot Remove", err.message || "Error removing teammate.", "error");
    }
  },

  // Invite Modal
  openInviteModal(spaceId) {
    const modalContainer = document.getElementById("settingsModalContainer");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-xs font-sans">
        <div class="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-scale-up">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <i data-lucide="user-plus" class="w-4 h-4 text-slate-900"></i>
              <span>Invite Teammate to Space</span>
            </h3>
            <button onclick="SettingsView.closeModal()" class="text-slate-400 hover:text-slate-700">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="SettingsView.handleSendInvite(event, '${spaceId}')" class="space-y-3.5">
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">Teammate Work Email *</label>
              <input
                type="email"
                id="inviteModalEmail"
                required
                class="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"
                placeholder="colleague@company.com"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">System Role *</label>
              <select
                id="inviteModalRole"
                class="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-white"
              >
                <option value="QA_ENGINEER">QA Lead / Tester (Full test management & defect logging)</option>
                <option value="DEVELOPER">Developer (Sprint tracking & bug resolution)</option>
                <option value="PROJECT_MANAGER">Project Manager (Sprints, projects & team admin)</option>
                <option value="VIEWER">Viewer / Client (Read-only reports & dashboards)</option>
              </select>
            </div>

            <div class="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onclick="SettingsView.closeModal()"
                class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs transition cursor-pointer"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleSendInvite(e, spaceId) {
    e.preventDefault();
    const email = document.getElementById("inviteModalEmail")?.value.trim().toLowerCase();
    const role = document.getElementById("inviteModalRole")?.value || "QA_ENGINEER";

    if (!email) {
      window.app.toast("Email Required", "Please enter an email address.", "error");
      return;
    }

    if (store.createInvitation) {
      await store.createInvitation(spaceId, { email, role });
    }

    window.app.toast("Invitation Sent", `Dispatched invitation to ${email}.`, "success");
    this.closeModal();
    this.render(document.getElementById("mainContent"));
  },

  copyInviteLink(token) {
    const origin = window.location.origin || '';
    const pathname = window.location.pathname || '';
    const inviteUrl = `${origin}${pathname}#invite/${token}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        window.app.toast("Link Copied", "Invitation URL copied to clipboard.", "success");
      }).catch(() => {
        prompt("Copy this invitation link:", inviteUrl);
      });
    } else {
      prompt("Copy this invitation link:", inviteUrl);
    }
  },

  async handleResendInvite(invId) {
    if (store.resendInvitation) {
      await store.resendInvitation(invId);
      window.app.toast("Invitation Resent", "Fresh invitation dispatched.", "success");
      this.render(document.getElementById("mainContent"));
    }
  },

  async handleCancelInvite(invId) {
    if (store.cancelInvitation) {
      await store.cancelInvitation(invId);
      window.app.toast("Invitation Cancelled", "Invitation has been revoked.", "info");
      this.render(document.getElementById("mainContent"));
    }
  },

  async handleDeleteInvite(invId) {
    if (store.deleteWorkspaceInvitation) {
      await store.deleteWorkspaceInvitation(invId);
    } else if (store.deleteInvitation) {
      await store.deleteInvitation(invId);
    }
    window.app.toast("Invitation Deleted", "Removed invitation record.", "info");
    this.render(document.getElementById("mainContent"));
  },

  async handleRequestPasswordReset(email) {
    if (!email) {
      window.app.toast("No Email", "User email address is missing.", "error");
      return;
    }

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.auth && sb.auth.resetPasswordForEmail) {
      try {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) {
          window.app.toast("Reset Notice", error.message, "info");
        } else {
          window.app.toast("Email Dispatched", `Password reset instructions sent to ${email}.`, "success");
        }
      } catch (err) {
        window.app.toast("Reset Error", err.message || "Failed to dispatch reset email.", "error");
      }
    } else {
      window.app.toast("Demo Environment", `Password reset instructions simulated for ${email}.`, "info");
    }
  },

  // Delete Space Modal
  openDeleteSpaceModal(spaceId, encodedName) {
    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    if (store.canDeleteWorkspace && !store.canDeleteWorkspace(spaceId, activeUser?.id)) {
      window.app.toast("Permission Denied", "Only Workspace Owners and Project Managers can delete spaces.", "error");
      return;
    }

    const spaceName = decodeURIComponent(encodedName);
    const modalContainer = document.getElementById("settingsModalContainer");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-xs font-sans">
        <div class="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-4 animate-scale-up">
          
          <div class="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <i data-lucide="trash-2" class="w-6 h-6"></i>
          </div>

          <div class="text-center space-y-1">
            <h3 class="text-base font-black text-slate-950">Delete this space permanently?</h3>
            <p class="text-slate-500 text-xs leading-relaxed">
              All projects, members, issues, test suites, and workspace records associated with <strong>${spaceName}</strong> will be permanently deleted.
            </p>
          </div>

          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-left">
            <label class="block font-bold text-slate-700 text-[11px]">
              Type <span class="font-mono text-rose-600 font-black">${spaceName}</span> to confirm:
            </label>
            <input
              type="text"
              id="confirmSpaceNameInput"
              class="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              placeholder="${spaceName}"
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onclick="SettingsView.closeModal()"
              class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick="SettingsView.confirmDeleteSpace('${spaceId}', '${encodeURIComponent(spaceName)}')"
              class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              Permanently Delete Space
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async confirmDeleteSpace(spaceId, encodedName) {
    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    if (store.canDeleteWorkspace && !store.canDeleteWorkspace(spaceId, activeUser?.id)) {
      window.app.toast("Permission Denied", "Only Workspace Owners and Project Managers can delete spaces.", "error");
      return;
    }

    const spaceName = decodeURIComponent(encodedName);
    const inputVal = document.getElementById("confirmSpaceNameInput")?.value.trim();

    if (inputVal !== spaceName) {
      window.app.toast("Name Mismatch", "Please type the exact space name to confirm deletion.", "error");
      return;
    }

    if (store.deleteSpace) {
      await store.deleteSpace(spaceId);
      window.app.toast("Space Deleted", `Space ${spaceName} was permanently removed.`, "success");
      this.closeModal();

      const remainingSpaces = store.getWorkspaces();
      if (!remainingSpaces || remainingSpaces.length === 0) {
        window.app.navigate("onboarding");
      } else {
        window.app.navigate("dashboard");
      }
    }
  },

  // Delete Account Modal
  openDeleteAccountModal() {
    const modalContainer = document.getElementById("settingsModalContainer");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-xs font-sans">
        <div class="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-4 animate-scale-up text-center">
          
          <div class="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <i data-lucide="user-x" class="w-6 h-6"></i>
          </div>

          <div class="space-y-1">
            <h3 class="text-base font-black text-slate-950">Delete your account permanently?</h3>
            <p class="text-slate-500 text-xs leading-relaxed">
              This action will permanently remove your user profile, assigned tickets, and workspace memberships from Supabase and PulseWave. You will be signed out immediately.
            </p>
          </div>

          <div class="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onclick="SettingsView.closeModal()"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick="SettingsView.confirmDeleteAccount()"
              class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              Confirm Account Deletion
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async confirmDeleteAccount() {
    if (store.deleteUserAccount) {
      await store.deleteUserAccount();
      window.app.toast("Account Deleted", "Your account and data have been removed.", "info");
      this.closeModal();
      window.app.navigate("home");
    }
  },

  // Notification Preferences & Test Email Handlers
  handleTogglePref(prefKey, value) {
    if (store.updateNotificationPreferences) {
      store.updateNotificationPreferences(null, { [prefKey]: value });
      window.app.toast("Preferences Updated", `Email notification setting updated.`, "success");
    }
  },

  async handleSendTestEmail(e) {
    e.preventDefault();
    const scenario = document.getElementById("testEmailScenario")?.value || "project_assignment";
    const recipient = document.getElementById("testEmailRecipient")?.value.trim();

    if (!recipient || !recipient.includes("@")) {
      window.app.toast("Validation Error", "Please enter a valid recipient email address.", "error");
      return;
    }

    const scenarios = {
      project_assignment: {
        type: 'project_assignment',
        subject: '[PulseWave] 🎯 Assigned to Project: Core Architecture V2',
        title: 'Project Assignment: Core Architecture V2',
        message: 'You have been added to project "Core Architecture V2" as QA Lead. Access the workspace below to review committed scope and test plans.',
        actionUrl: 'project-workspace',
        actionText: 'Open Project Workspace'
      },
      issue_assignment: {
        type: 'issue_assignment',
        subject: '[PulseWave] ⚡ Task Assigned: [PROJ-104] Payment Webhook Retry Mechanism',
        title: 'Task Assigned: [PROJ-104] Payment Webhook Retry Mechanism',
        message: 'A new high-priority defect has been assigned to you for resolution. Target sprint: Sprint 24.',
        issueKey: 'PROJ-104',
        issueTitle: 'Payment Webhook Retry Mechanism',
        issuePriority: 'High',
        actionUrl: 'all-issues',
        actionText: 'View Issue Details'
      },
      qa_handoff: {
        type: 'qa_handoff',
        subject: '[PulseWave] 🔍 Ready for QA: [PROJ-88] OAuth2 Google SSO Integration',
        title: 'Ready for QA: [PROJ-88] OAuth2 Google SSO Integration',
        message: 'Developer Alex has completed development and marked the ticket Ready for QA on Staging (Build #v2.4.2). Verification checklist attached.',
        issueKey: 'PROJ-88',
        issueTitle: 'OAuth2 Google SSO Integration',
        issuePriority: 'Medium',
        actionUrl: 'all-issues',
        actionText: 'Execute QA Sign-off'
      },
      critical_defect: {
        type: 'critical_defect',
        subject: '[PulseWave] 🚨 Blocker Defect Logged: [PROJ-99] Checkout Database Deadlock',
        title: 'Critical Blocker Defect: [PROJ-99] Checkout Database Deadlock',
        message: 'High-severity blocker defect filed on Production replica. Immediate dev triage requested.',
        issueKey: 'PROJ-99',
        issueTitle: 'Checkout Database Deadlock',
        issuePriority: 'Critical',
        actionUrl: 'all-issues',
        actionText: 'Inspect Blocker Defect'
      },
      chat_mention: {
        type: 'chat_mention',
        subject: '[PulseWave] 💬 Sarah Jenkins mentioned you in #release-engineering',
        title: 'Mentioned in #release-engineering',
        message: 'Sarah Jenkins: "@Arslan could you verify the regression test suite results before tomorrow morning deployment?"',
        actionUrl: 'project-workspace',
        actionText: 'Reply in Chat'
      },
      sprint_milestone: {
        type: 'sprint_milestone',
        subject: '[PulseWave] 🚀 Sprint 24 Kickoff: Notification Engine & Quality Gates',
        title: 'Sprint Started: Sprint 24 - Notification Engine',
        message: 'Sprint 24 has started with 42 committed Story Points across 8 user stories. Review active sprint board for your deliverables.',
        actionUrl: 'project-workspace',
        actionText: 'Open Sprint Board'
      }
    };

    const config = scenarios[scenario] || scenarios.project_assignment;

    const res = await store.dispatchEmailNotification({
      recipient,
      recipientName: recipient.split('@')[0],
      subject: config.subject,
      type: config.type,
      title: config.title,
      message: config.message,
      issueKey: config.issueKey || null,
      issueTitle: config.issueTitle || null,
      issuePriority: config.issuePriority || null,
      actionUrl: config.actionUrl,
      actionText: config.actionText
    });

    if (res && res.success) {
      window.app.toast("Test Email Sent", `Dispatched ${config.title} to ${recipient}. Check the audit log below.`, "success");
      this.render(document.getElementById("mainContent"));
    } else {
      window.app.toast("Email Dispatch Error", res?.reason || "Could not dispatch test email.", "error");
    }
  },

  handleClearEmailLogs() {
    if (confirm("Are you sure you want to clear all outbound email records?")) {
      if (store.clearEmailLogs) {
        store.clearEmailLogs();
        window.app.toast("Logs Cleared", "Outbound email audit log has been cleared.", "info");
        this.render(document.getElementById("mainContent"));
      }
    }
  },

  closeModal() {
    const modalContainer = document.getElementById("settingsModalContainer");
    if (modalContainer) modalContainer.innerHTML = "";
  }
};

window.SettingsView = SettingsView;
