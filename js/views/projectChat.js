/**
 * PulseWave QA Platform — Floating Project Chat Module (V1 Production)
 * Compact, modern, real-time floating chat popup attached to each project.
 * Single project-scoped conversation, Supabase Realtime, Presence, Soft-Delete,
 * Mentions, File Attachments via Supabase Storage, and Bug/Issue linking.
 */

const FloatingProjectChat = {
  isOpen: false,
  isMinimized: false,
  activeProjectId: null,
  conversationId: null,
  replyingTo: null,
  editingMessageId: null,
  searchQuery: "",
  searchOpen: false,
  membersDropdownOpen: false,
  issuePickerOpen: false,
  issuePickerSearch: "",
  emojiTrayOpen: false,
  pendingAttachments: [],
  pendingLinks: [],
  mentionQuery: null,
  mentionIndex: -1,
  typingTimer: null,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  realtimeChannel: null,
  hasInitialized: false,

  /**
   * Initialize floating chat container in DOM
   */
  init() {
    if (this.hasInitialized) return;
    this.hasInitialized = true;

    // Inject container if not present
    if (!document.getElementById("floatingProjectChatContainer")) {
      const container = document.createElement("div");
      container.id = "floatingProjectChatContainer";
      container.className = "fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none";
      document.body.appendChild(container);
    }

    // Global click listener to close popovers
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#chatMembersDropdownBtn") && !e.target.closest("#chatMembersPopover")) {
        if (this.membersDropdownOpen) {
          this.membersDropdownOpen = false;
          this.renderPopup();
        }
      }
      if (!e.target.closest("#chatEmojiBtn") && !e.target.closest("#chatEmojiPopover")) {
        if (this.emojiTrayOpen) {
          this.emojiTrayOpen = false;
          this.renderPopup();
        }
      }
      if (!e.target.closest("#chatIssueLinkBtn") && !e.target.closest("#chatIssuePickerPopover")) {
        if (this.issuePickerOpen) {
          this.issuePickerOpen = false;
          this.renderPopup();
        }
      }
    });

    this.updateWidget();
  },

  /**
   * Update floating widget visibility & unread badge based on current context
   */
  updateWidget() {
    this.init();
    const container = document.getElementById("floatingProjectChatContainer");
    if (!container) return;

    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const activeProject = store.getActiveProject ? store.getActiveProject() : null;
    const currentView = window.app && window.app.currentView ? window.app.currentView.split("?")[0] : "";
    
    // Check if current route is a Project Detail / Workspace page
    const isProjectDetailPage = ["project-workspace", "project-detail", "project-chat"].includes(currentView);

    // Only display when the project detail page is open and user is an authorized member of that project
    if (!isProjectDetailPage || !activeUser || !activeProject || !store.isUserAuthorizedForProject(activeProject.id, activeUser.id)) {
      container.innerHTML = "";
      if (this.isOpen) {
        this.isOpen = false;
      }
      return;
    }

    // Switch project channel if project changed
    if (this.activeProjectId !== activeProject.id) {
      this.activeProjectId = activeProject.id;
      this.subscribeRealtime(activeProject.id);
    }

    // Ensure Project Chat conversation exists in store
    const conv = store.getProjectChatConversation(activeProject.id);
    this.conversationId = conv ? conv.id : null;

    const unreadCount = store.getUnreadChatCount(activeProject.id, this.conversationId, activeUser.id);
    const isBoardTab = (typeof ProjectWorkspaceView !== 'undefined' && ProjectWorkspaceView.activeTab === 'board');

    if (isBoardTab) {
      // ON KANBAN BOARD PAGE: Show [ AI QA Assistant ] (with chat bubble + sparkles) on left, and [ + Add Card ] (lime green) on right
      container.innerHTML = `
        <div class="pointer-events-auto flex flex-col items-end gap-3">
          <!-- Floating Chat Popup Window (when toggled open) -->
          <div id="floatingChatPopupMount" class="${this.isOpen ? 'block' : 'hidden'}"></div>

          <!-- Bottom Action Buttons: AI QA Assistant on left, Add Card on right -->
          <div class="flex items-center gap-2.5">
            <!-- AI QA Assistant Pill Button -->
            <button
              id="boardAIAssistantTrigger"
              onclick="window.app.openAIQAAssistant('${activeProject.id}')"
              class="group relative flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl border border-slate-700/80 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer select-none"
              title="AI QA Assistant - Summaries, Test Plans & Auto-Generation"
            >
              <div class="relative flex items-center justify-center">
                <i data-lucide="message-square" class="w-4 h-4 text-emerald-400 group-hover:text-[#bef264] transition"></i>
                <span class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <span class="text-xs">✨</span>
              <span class="font-bold text-xs tracking-tight text-white">AI QA Assistant</span>
            </button>

            <!-- Add Card Pill Button (Lime Green) -->
            <button
              id="boardAddCardTrigger"
              onclick="window.app.openAddCardModal('${activeProject.id}')"
              class="flex items-center gap-1.5 px-4 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-full shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer select-none font-bold text-xs shadow-[#bef264]/20"
              title="Add Card to Kanban Board"
            >
              <i data-lucide="plus" class="w-4 h-4 text-slate-950 font-bold"></i>
              <span>Add Card</span>
            </button>
          </div>
        </div>
      `;
    } else {
      // ON OTHER TABS (Overview, Issues, Releases, Sprints, QA, Team, Settings): Show Project Chat button in bottom right
      container.innerHTML = `
        <div class="pointer-events-auto flex flex-col items-end gap-3">
          <!-- Floating Chat Popup Window -->
          <div id="floatingChatPopupMount" class="${this.isOpen ? 'block' : 'hidden'}"></div>

          <!-- Floating Chat Trigger Button -->
          <button
            id="floatingProjectChatTrigger"
            onclick="FloatingProjectChat.toggle()"
            class="group relative flex items-center gap-2.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl border border-slate-700/80 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer select-none"
            title="Toggle Project Chat (${activeProject.name})"
          >
            <!-- Status & Icon -->
            <div class="relative flex items-center justify-center">
              <i data-lucide="message-square" class="w-5 h-5 text-emerald-400 group-hover:text-[#bef264] transition"></i>
              <span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900 animate-pulse"></span>
            </div>

            <span class="font-bold text-xs tracking-wide pr-0.5">Project Chat</span>

            <!-- Unread Badge -->
            ${unreadCount > 0 ? `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950 font-mono shadow-xs animate-bounce">
                ${unreadCount}
              </span>
            ` : ''}
          </button>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();

    if (this.isOpen) {
      this.renderPopup();
    }
  },

  /**
   * Toggle open/closed state of the popup
   */
  toggle(targetProjectId = null) {
    if (targetProjectId && targetProjectId !== this.activeProjectId) {
      store.setActiveProject(targetProjectId);
      this.activeProjectId = targetProjectId;
    }

    if (this.isOpen) {
      this.close();
    } else {
      this.open(targetProjectId);
    }
  },

  /**
   * Open the chat popup for the project
   */
  open(targetProjectId = null) {
    const activeProject = targetProjectId ? (store.getProjects().find(p => p.id === targetProjectId) || store.getActiveProject()) : store.getActiveProject();
    if (!activeProject) return;

    const activeUser = store.getActiveUser();
    if (!store.isUserAuthorizedForProject(activeProject.id, activeUser?.id)) {
      if (window.app && window.app.toast) {
        window.app.toast("Access Restricted", "You are not a member of this project.", "warning");
      }
      return;
    }

    this.activeProjectId = activeProject.id;
    if (store.setActiveProject) {
      store.setActiveProject(activeProject.id);
    }
    this.isOpen = true;
    this.isMinimized = false;

    const conv = store.getProjectChatConversation(activeProject.id);
    this.conversationId = conv ? conv.id : null;

    if (this.conversationId && activeUser) {
      store.markConversationRead(this.conversationId, activeUser.id);
    }

    this.subscribeRealtime(activeProject.id);
    this.updateWidget();

    // Scroll to latest message
    setTimeout(() => {
      this.scrollToBottom();
      const input = document.getElementById("chatComposerInput");
      if (input) input.focus();
    }, 50);
  },

  /**
   * Close the chat popup
   */
  close() {
    this.isOpen = false;
    this.searchOpen = false;
    this.membersDropdownOpen = false;
    this.issuePickerOpen = false;
    this.emojiTrayOpen = false;
    this.replyingTo = null;
    this.editingMessageId = null;
    this.updateWidget();
  },

  /**
   * Minimize popup down to floating button
   */
  minimize() {
    this.close();
  },

  /**
   * Subscribe to Supabase Realtime channel for live messages & presence
   */
  subscribeRealtime(projectId) {
    if (this.realtimeChannel && this.realtimeChannel.unsubscribe) {
      try { this.realtimeChannel.unsubscribe(); } catch (e) {}
    }

    this.realtimeChannel = store.subscribeToProjectChat(
      projectId,
      (payload) => {
        this.handleRealtimeMessage(payload);
      },
      (presenceState) => {
        this.handlePresenceUpdate(presenceState);
      }
    );
  },

  /**
   * Handle incoming realtime message events
   */
  handleRealtimeMessage(payload) {
    const activeUser = store.getActiveUser();
    if (this.isOpen && this.conversationId && activeUser) {
      store.markConversationRead(this.conversationId, activeUser.id);
    }
    this.updateWidget();
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 50);
    }
  },

  /**
   * Handle presence state updates (online members and typing indicator)
   */
  handlePresenceUpdate(presenceState) {
    this.onlineUsers.clear();
    if (presenceState) {
      Object.values(presenceState).forEach(presences => {
        (presences || []).forEach(p => {
          if (p.userId) this.onlineUsers.add(p.userId);
          if (p.isTyping && p.userId) {
            this.typingUsers.set(p.userId, { name: p.userName || "Team Member", timestamp: Date.now() });
          } else if (p.userId) {
            this.typingUsers.delete(p.userId);
          }
        });
      });
    }

    // Purge stale typing indicators > 4 seconds old
    const now = Date.now();
    for (const [uid, info] of this.typingUsers.entries()) {
      if (now - info.timestamp > 4000) {
        this.typingUsers.delete(uid);
      }
    }

    if (this.isOpen) {
      this.updateTypingAndPresenceUI();
    }
  },

  /**
   * Render the floating popup content
   */
  renderPopup() {
    const mount = document.getElementById("floatingChatPopupMount");
    if (!mount) return;

    const project = store.getProjects().find(p => p.id === this.activeProjectId) || store.getActiveProject();
    if (!project) return;

    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const members = store.getProjectMembers(project.id);
    const messages = this.conversationId ? store.getConversationMessages(this.conversationId) : [];

    // Filter messages if search query exists
    let displayMessages = messages;
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      displayMessages = messages.filter(m => {
        const textMatch = (m.message || "").toLowerCase().includes(q);
        const senderMatch = m.sender && m.sender.name && m.sender.name.toLowerCase().includes(q);
        const linkMatch = m.links && m.links.some(l => (l.key || "").toLowerCase().includes(q) || (l.title || "").toLowerCase().includes(q));
        return textMatch || senderMatch || linkMatch;
      });
    }

    // Typing names
    const activeTypers = Array.from(this.typingUsers.entries())
      .filter(([uid]) => uid !== activeUser?.id)
      .map(([, info]) => info.name);

    mount.innerHTML = `
      <div class="w-[380px] sm:w-[410px] h-[580px] max-h-[calc(100vh-6.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/95 flex flex-col overflow-hidden animate-fade-in font-sans select-text">
        
        <!-- =========================================================================
             1. COMPACT POPUP HEADER
             ========================================================================= -->
        <div class="bg-slate-900 text-white px-3.5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 select-none relative">
          
          <!-- Left: Title & Project Context -->
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="relative flex items-center justify-center shrink-0">
              <div class="w-7 h-7 rounded-xl bg-slate-800 text-[#bef264] flex items-center justify-center font-bold text-xs border border-slate-700">
                💬
              </div>
              <span class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900"></span>
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <h3 class="text-xs font-black text-white truncate tracking-tight">Project Chat</h3>
                <span class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[9px] font-bold border border-slate-700 uppercase">
                  ${project.key}
                </span>
              </div>
              <p class="text-[10px] text-slate-400 truncate max-w-[150px] font-medium leading-none mt-0.5" title="${project.name}">
                ${project.name}
              </p>
            </div>
          </div>

          <!-- Right: Member Counter, Search, Minimize, Close -->
          <div class="flex items-center gap-1 shrink-0">
            
            <!-- Member Count & Presence Button -->
            <button
              id="chatMembersDropdownBtn"
              onclick="FloatingProjectChat.toggleMembersDropdown()"
              class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer border border-slate-700/60"
              title="Project Members (${members.length})"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>${members.length}</span>
              <i data-lucide="users" class="w-3 h-3 text-slate-400"></i>
            </button>

            <!-- Search Toggle -->
            <button
              onclick="FloatingProjectChat.toggleSearch()"
              class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer ${this.searchOpen ? 'text-emerald-400 bg-slate-800' : ''}"
              title="Search Messages"
            >
              <i data-lucide="search" class="w-3.5 h-3.5"></i>
            </button>

            <!-- Minimize Button -->
            <button
              onclick="FloatingProjectChat.minimize()"
              class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Minimize"
            >
              <i data-lucide="minus" class="w-3.5 h-3.5"></i>
            </button>

            <!-- Close Button -->
            <button
              onclick="FloatingProjectChat.close()"
              class="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="Close Chat"
            >
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- =========================================================================
               MEMBERS DROPDOWN POPOVER
               ========================================================================= -->
          ${this.membersDropdownOpen ? `
            <div id="chatMembersPopover" class="absolute top-12 right-3 w-64 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-3 z-50 animate-slide-up-fast">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span class="text-[11px] font-black uppercase tracking-wider text-slate-500">Project Members (${members.length})</span>
                <span class="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                </span>
              </div>
              <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                ${members.map(m => {
                  const isOnline = this.onlineUsers.has(m.id) || m.id === activeUser?.id;
                  const initials = m.name ? m.name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase() : "U";
                  return `
                    <div class="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition">
                      <div class="flex items-center gap-2 min-w-0">
                        <div class="relative">
                          <div class="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-[9px] flex items-center justify-center">
                            ${initials}
                          </div>
                          <span class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
                        </div>
                        <div class="min-w-0">
                          <p class="text-xs font-bold text-slate-800 truncate">${m.name}</p>
                          <p class="text-[9px] text-slate-400 truncate">${m.email || 'Member'}</p>
                        </div>
                      </div>
                      <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${m.projectRole === 'PM' ? 'bg-purple-100 text-purple-700' : (m.projectRole === 'QA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-800')}">
                        ${m.projectRole || 'DEV'}
                      </span>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          ` : ''}

        </div>

        <!-- =========================================================================
             2. INLINE SEARCH FILTER BAR
             ========================================================================= -->
        ${this.searchOpen ? `
          <div class="p-2 bg-slate-100/90 border-b border-slate-200/80 flex items-center gap-1.5 shrink-0 animate-fade-in">
            <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 ml-1"></i>
            <input
              type="text"
              id="chatSearchFilterInput"
              value="${this.searchQuery}"
              oninput="FloatingProjectChat.handleSearch(this.value)"
              placeholder="Filter messages, bugs, or people..."
              class="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              autofocus
            />
            ${this.searchQuery ? `
              <button onclick="FloatingProjectChat.handleSearch('')" class="p-1 text-slate-400 hover:text-slate-600">
                <i data-lucide="x" class="w-3 h-3"></i>
              </button>
            ` : ''}
            <button onclick="FloatingProjectChat.toggleSearch()" class="text-[10px] font-bold text-slate-500 hover:text-slate-900 px-1.5">
              Done
            </button>
          </div>
        ` : ''}

        <!-- =========================================================================
             3. MESSAGE STREAM VIEWPORT
             ========================================================================= -->
        <div id="floatingChatMessagesStream" class="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/60 select-text">
          ${displayMessages.length === 0 ? `
            <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <div class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-2xs">
                💬
              </div>
              <h4 class="text-xs font-bold text-slate-800">Start the conversation</h4>
              <p class="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                ${this.searchQuery ? 'No messages match your search query.' : 'Discuss bugs, QA tests, sprint goals, and project updates in real time with your team.'}
              </p>
            </div>
          ` : displayMessages.map(m => this.renderMessageBubble(m, activeUser)).join("")}
        </div>

        <!-- =========================================================================
             4. TYPING INDICATOR
             ========================================================================= -->
        <div id="chatTypingIndicatorArea" class="px-3.5 py-1 text-[10px] font-medium text-slate-500 bg-white border-t border-slate-100 flex items-center gap-1.5 ${activeTypers.length > 0 ? 'block' : 'hidden'}">
          <span class="flex gap-0.5">
            <span class="w-1 h-1 rounded-full bg-emerald-500 animate-bounce"></span>
            <span class="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
          </span>
          <span>${activeTypers.join(", ")} ${activeTypers.length === 1 ? 'is' : 'are'} typing...</span>
        </div>

        <!-- =========================================================================
             5. ACTIVE REPLY / EDIT BANNER
             ========================================================================= -->
        ${this.replyingTo ? `
          <div class="px-3 py-1.5 bg-indigo-50/80 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-900 shrink-0">
            <div class="flex items-center gap-1.5 min-w-0">
              <i data-lucide="corner-down-right" class="w-3.5 h-3.5 text-indigo-600 shrink-0"></i>
              <span class="text-[10px] font-bold truncate">
                Replying to <strong>${this.replyingTo.senderName}</strong>: <span class="font-normal text-slate-600">"${(this.replyingTo.message || '').substring(0, 30)}..."</span>
              </span>
            </div>
            <button onclick="FloatingProjectChat.cancelReply()" class="p-0.5 text-indigo-400 hover:text-indigo-700 cursor-pointer">
              <i data-lucide="x" class="w-3 h-3"></i>
            </button>
          </div>
        ` : ''}

        ${this.editingMessageId ? `
          <div class="px-3 py-1.5 bg-amber-50/90 border-t border-amber-200 flex items-center justify-between text-xs text-amber-900 shrink-0">
            <div class="flex items-center gap-1.5 min-w-0">
              <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-600 shrink-0"></i>
              <span class="text-[10px] font-bold truncate">Editing your message</span>
            </div>
            <button onclick="FloatingProjectChat.cancelEdit()" class="p-0.5 text-amber-500 hover:text-amber-800 cursor-pointer">
              <i data-lucide="x" class="w-3 h-3"></i>
            </button>
          </div>
        ` : ''}

        <!-- Pending Attachments & Links Strip -->
        ${(this.pendingAttachments.length > 0 || this.pendingLinks.length > 0) ? `
          <div class="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto shrink-0">
            ${this.pendingAttachments.map((att, idx) => `
              <div class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 flex items-center gap-1 shadow-2xs">
                <i data-lucide="file-text" class="w-3 h-3 text-slate-700"></i>
                <span class="truncate max-w-[100px]">${att.name}</span>
                <button onclick="FloatingProjectChat.removePendingAttachment(${idx})" class="text-slate-400 hover:text-rose-500">
                  <i data-lucide="x" class="w-2.5 h-2.5"></i>
                </button>
              </div>
            `).join("")}

            ${this.pendingLinks.map((lnk, idx) => `
              <div class="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-800 flex items-center gap-1 shadow-2xs">
                <i data-lucide="bug" class="w-3 h-3 text-rose-600"></i>
                <span>${lnk.key}</span>
                <button onclick="FloatingProjectChat.removePendingLink(${idx})" class="text-rose-400 hover:text-rose-700">
                  <i data-lucide="x" class="w-2.5 h-2.5"></i>
                </button>
              </div>
            `).join("")}
          </div>
        ` : ''}

        <!-- =========================================================================
             6. MESSAGE COMPOSER & ACTIONS
             ========================================================================= -->
        <div class="p-2.5 bg-white border-t border-slate-200 shrink-0 relative">
          
          <!-- @mention autocomplete dropdown -->
          ${this.mentionQuery !== null ? `
            <div id="chatMentionDropdown" class="absolute bottom-16 left-3 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 z-50 animate-slide-up-fast">
              <div class="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">Mention Member</div>
              <div class="max-h-36 overflow-y-auto space-y-0.5">
                ${members.filter(m => m.name.toLowerCase().includes(this.mentionQuery.toLowerCase())).map(m => `
                  <button
                    onclick="FloatingProjectChat.selectMention('${m.id}', '${m.name}')"
                    class="w-full px-2 py-1.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition cursor-pointer"
                  >
                    <span class="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center">
                      ${m.name.substring(0, 1).toUpperCase()}
                    </span>
                    <span class="truncate">${m.name}</span>
                  </button>
                `).join("")}
              </div>
            </div>
          ` : ''}

          <!-- Issue / Bug Picker Popover -->
          ${this.issuePickerOpen ? this.renderIssuePickerPopover(project) : ''}

          <!-- Quick Emoji Tray -->
          ${this.emojiTrayOpen ? `
            <div id="chatEmojiPopover" class="absolute bottom-14 left-10 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 flex items-center gap-1.5 animate-slide-up-fast">
              ${['👍', '❤️', '🔥', '🎉', '🚀', '👀', '😂', '✅'].map(emoji => `
                <button
                  onclick="FloatingProjectChat.insertEmoji('${emoji}')"
                  class="w-7 h-7 flex items-center justify-center text-sm hover:bg-slate-100 rounded-lg transition cursor-pointer transform hover:scale-125"
                >
                  ${emoji}
                </button>
              `).join("")}
            </div>
          ` : ''}

          <!-- Composer Input Form -->
          <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-2xl px-2.5 py-1.5 focus-within:bg-white focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 transition">
            
            <!-- Attachment Button -->
            <button
              onclick="document.getElementById('chatFileUploadInput').click()"
              class="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer rounded-lg hover:bg-slate-200/60"
              title="Attach File / Image"
            >
              <i data-lucide="paperclip" class="w-4 h-4"></i>
            </button>
            <input type="file" id="chatFileUploadInput" class="hidden" onchange="FloatingProjectChat.handleFileUpload(event)" multiple />

            <!-- Link Issue / Bug Button -->
            <button
              id="chatIssueLinkBtn"
              onclick="FloatingProjectChat.toggleIssuePicker()"
              class="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer rounded-lg hover:bg-slate-200/60"
              title="Link Project Bug or Issue"
            >
              <i data-lucide="bug" class="w-4 h-4"></i>
            </button>

            <!-- Emoji Button -->
            <button
              id="chatEmojiBtn"
              onclick="FloatingProjectChat.toggleEmojiTray()"
              class="p-1 text-slate-400 hover:text-amber-500 transition cursor-pointer rounded-lg hover:bg-slate-200/60"
              title="Add Emoji"
            >
              <i data-lucide="smile" class="w-4 h-4"></i>
            </button>

            <!-- Textarea / Input -->
            <input
              type="text"
              id="chatComposerInput"
              placeholder="Type a message... (@ to mention)"
              onkeydown="FloatingProjectChat.handleInputKeyDown(event)"
              oninput="FloatingProjectChat.handleInputChange(event)"
              class="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden py-1 px-1"
            />

            <!-- Send Button -->
            <button
              id="chatSendBtn"
              onclick="FloatingProjectChat.submitMessage()"
              class="w-7 h-7 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition transform active:scale-90 cursor-pointer shadow-xs shrink-0"
              title="Send Message (Enter)"
            >
              <i data-lucide="send" class="w-3.5 h-3.5 text-[#bef264]"></i>
            </button>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Render individual message bubble (Right for self, Left for peers)
   */
  renderMessageBubble(msg, activeUser) {
    const isSelf = (msg.sender_id === activeUser?.id) || (msg.senderId === activeUser?.id);
    const sender = msg.sender || store.getUserById(msg.sender_id || msg.senderId) || (isSelf ? activeUser : null);
    const fullName = sender ? sender.name : (isSelf ? (activeUser?.name || "You") : "Team Member");
    const displayName = isSelf ? `${fullName} (You)` : fullName;
    const initials = sender && sender.name 
      ? sender.name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase() 
      : (isSelf && activeUser?.name ? activeUser.name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase() : "U");
    const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
    const isDeleted = !!msg.deleted_at;
    const isEdited = !!msg.edited_at;
    const role = sender?.projectRole || sender?.role || (isSelf ? activeUser?.role : null);

    const avatarBg = isSelf 
      ? "bg-slate-950 text-[#bef264] border border-slate-800 ring-1 ring-slate-700" 
      : (sender?.color || "bg-indigo-600 text-white shadow-2xs");

    return `
      <div id="msg-${msg.id}" class="group/msg flex flex-col ${isSelf ? 'items-end' : 'items-start'} transition">
        
        <div class="flex items-start gap-2 max-w-[94%] ${isSelf ? 'flex-row-reverse' : 'flex-row'}">
          
          <!-- Avatar Icon (Displayed for BOTH current user and other members) -->
          <div class="w-6 h-6 rounded-full ${avatarBg} text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs select-none" title="${fullName} (${role || 'Member'})">
            ${initials}
          </div>

          <div class="flex flex-col ${isSelf ? 'items-end' : 'items-start'} min-w-0">
            
            <!-- Sender Profile Name & Header (Displayed for BOTH current user and other members) -->
            <div class="flex items-center gap-1.5 mb-1 px-1 ${isSelf ? 'flex-row-reverse' : 'flex-row'}">
              <span class="text-[11px] font-bold text-slate-800">${displayName}</span>
              ${role ? `<span class="px-1.5 py-0.1 rounded text-[8px] font-black uppercase ${isSelf ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-800'}">${role}</span>` : ''}
              <span class="text-[9px] text-slate-400 font-mono">${timeStr}</span>
            </div>

            <!-- Parent Quote Box if replying -->
            ${msg.replyParent ? `
              <div
                onclick="FloatingProjectChat.scrollToMessage('${msg.replyParent.id}')"
                class="mb-1 px-2.5 py-1 bg-slate-200/70 hover:bg-slate-300/80 rounded-lg text-[10px] text-slate-700 border-l-2 border-slate-500 cursor-pointer transition truncate max-w-full"
                title="Jump to original message"
              >
                <strong>↳ ${msg.replyParent.senderName}:</strong> <span>"${(msg.replyParent.message || '').substring(0, 35)}..."</span>
              </div>
            ` : ''}

            <!-- Message Card Bubble -->
            <div class="relative group/bubble">
              <div class="px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                isSelf 
                  ? 'bg-slate-900 text-white rounded-tr-xs' 
                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
              }">
                
                ${isDeleted ? `
                  <span class="italic text-slate-400 flex items-center gap-1.5">
                    <i data-lucide="trash-2" class="w-3 h-3"></i> This message was deleted.
                  </span>
                ` : `
                  <!-- Message Text -->
                  <div class="break-words select-text">
                    ${this.formatMessageText(msg.message)}
                  </div>

                  <!-- Linked Project Record (Bug / Issue Card) -->
                  ${(msg.links || []).map(lnk => this.renderLinkedEntityCard(lnk, isSelf)).join("")}

                  <!-- Attachments -->
                  ${(msg.attachments || []).map(att => this.renderAttachmentItem(att, isSelf)).join("")}
                `}

                <!-- Bubble Footer (Timestamp & Edited indicator) -->
                <div class="flex items-center justify-end gap-1 mt-1 text-[9px] ${isSelf ? 'text-slate-400' : 'text-slate-400'} font-mono">
                  ${isEdited && !isDeleted ? '<span class="italic">Edited</span> •' : ''}
                  <span>${timeStr}</span>
                  ${isSelf ? '<i data-lucide="check" class="w-2.5 h-2.5 text-emerald-400"></i>' : ''}
                </div>
              </div>

              <!-- Hover Toolbar -->
              ${!isDeleted ? `
                <div class="absolute -top-3 ${isSelf ? 'right-2' : 'left-2'} hidden group-hover/msg:flex items-center gap-0.5 bg-white border border-slate-200 shadow-md rounded-lg p-0.5 z-20">
                  <button onclick="FloatingProjectChat.quickReact('${msg.id}', '👍')" class="p-1 hover:bg-slate-100 rounded text-xs" title="Thumbs Up">👍</button>
                  <button onclick="FloatingProjectChat.quickReact('${msg.id}', '❤️')" class="p-1 hover:bg-slate-100 rounded text-xs" title="Heart">❤️</button>
                  <button onclick="FloatingProjectChat.quickReact('${msg.id}', '🚀')" class="p-1 hover:bg-slate-100 rounded text-xs" title="Rocket">🚀</button>
                  <button onclick="FloatingProjectChat.startReply('${msg.id}')" class="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900" title="Reply">
                    <i data-lucide="reply" class="w-3 h-3"></i>
                  </button>
                  ${isSelf ? `
                    <button onclick="FloatingProjectChat.startEdit('${msg.id}', \`${(msg.message || '').replace(/`/g, '\\`')}\`)" class="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900" title="Edit Message">
                      <i data-lucide="edit-2" class="w-3 h-3"></i>
                    </button>
                    <button onclick="FloatingProjectChat.deleteMessagePrompt('${msg.id}')" class="p-1 hover:bg-rose-50 rounded text-rose-500" title="Delete Message">
                      <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                  ` : ''}
                </div>
              ` : ''}
            </div>

            <!-- Reactions Row -->
            ${(msg.reactionSummary || []).length > 0 ? `
              <div class="flex flex-wrap gap-1 mt-1">
                ${msg.reactionSummary.map(r => `
                  <button
                    onclick="FloatingProjectChat.toggleReaction('${msg.id}', '${r.reaction}')"
                    class="px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                      r.hasReacted 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }"
                    title="${r.users.join(', ')}"
                  >
                    <span>${r.reaction}</span>
                    <span class="font-mono text-[9px]">${r.count}</span>
                  </button>
                `).join("")}
              </div>
            ` : ''}

          </div>
        </div>
      </div>
    `;
  },

  /**
   * Format message text with bold tags and highlighted @mentions
   */
  formatMessageText(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/(@[a-zA-Z0-9_\s]+)/g, '<span class="font-black text-emerald-400 bg-emerald-950/40 px-1 py-0.2 rounded">$1</span>')
      .replace(/\n/g, "<br/>");
  },

  /**
   * Render linked Issue / Bug interactive card
   */
  renderLinkedEntityCard(link, isSelf) {
    return `
      <div
        onclick="window.app.openIssueDetails ? window.app.openIssueDetails('${link.key}') : null"
        class="mt-2 p-2 rounded-xl border transition cursor-pointer select-none text-left ${
          isSelf 
            ? 'bg-slate-800/90 border-slate-700 hover:bg-slate-800 text-white' 
            : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100 text-slate-900'
        }"
      >
        <div class="flex items-center justify-between gap-1 mb-1">
          <span class="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] uppercase ${isSelf ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-200 text-rose-800'}">
            ${link.key}
          </span>
          <span class="text-[9px] font-semibold text-slate-400">${link.status || 'Active'}</span>
        </div>
        <p class="text-xs font-bold truncate leading-tight">${link.title || 'Project Issue'}</p>
        <span class="text-[9px] ${isSelf ? 'text-[#bef264]' : 'text-slate-900'} font-bold mt-1 inline-flex items-center gap-0.5">
          View Details →
        </span>
      </div>
    `;
  },

  /**
   * Render Attachment thumbnail / file card
   */
  renderAttachmentItem(att, isSelf) {
    const isImage = att.file_type && att.file_type.startsWith("image/");
    const sizeKB = att.file_size ? Math.round(att.file_size / 1024) : 0;

    if (isImage && att.file_path) {
      return `
        <div class="mt-2">
          <img
            src="${att.file_path}"
            alt="${att.file_name}"
            onclick="window.open('${att.file_path}', '_blank')"
            class="rounded-xl max-h-40 max-w-full object-cover border border-slate-200/80 hover:opacity-95 transition cursor-pointer shadow-xs"
          />
        </div>
      `;
    }

    return `
      <a
        href="${att.file_path || '#'}"
        target="_blank"
        download="${att.file_name}"
        class="mt-2 px-2.5 py-1.5 rounded-xl flex items-center gap-2 border transition text-left ${
          isSelf 
            ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' 
            : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
        }"
      >
        <i data-lucide="file" class="w-4 h-4 ${isSelf ? 'text-[#bef264]' : 'text-slate-700'} shrink-0"></i>
        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-bold truncate">${att.file_name}</p>
          <p class="text-[9px] text-slate-400 font-mono">${sizeKB} KB</p>
        </div>
        <i data-lucide="download" class="w-3.5 h-3.5 text-slate-400"></i>
      </a>
    `;
  },

  /**
   * Render Issue / Bug picker popover
   */
  renderIssuePickerPopover(project) {
    const issues = (store.getProjectIssues ? store.getProjectIssues(project.id) : (store.data.issues || []))
      .filter(i => (i.project_id === project.id || i.projectId === project.id));

    let filtered = issues;
    if (this.issuePickerSearch) {
      const q = this.issuePickerSearch.toLowerCase();
      filtered = issues.filter(i => (i.key || '').toLowerCase().includes(q) || (i.title || '').toLowerCase().includes(q));
    }

    return `
      <div id="chatIssuePickerPopover" class="absolute bottom-14 left-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-slide-up-fast">
        <div class="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
          <span class="text-[10px] font-black uppercase text-slate-500">Link Project Bug / Issue</span>
          <button onclick="FloatingProjectChat.toggleIssuePicker()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-3 h-3"></i>
          </button>
        </div>
        <input
          type="text"
          value="${this.issuePickerSearch}"
          oninput="FloatingProjectChat.handleIssueSearch(this.value)"
          placeholder="Search by BUG-ID or title..."
          class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs mb-1.5 focus:outline-hidden"
          autofocus
        />
        <div class="max-h-40 overflow-y-auto space-y-1">
          ${filtered.length === 0 ? `
            <p class="text-center text-[10px] text-slate-400 py-3">No matching issues found</p>
          ` : filtered.map(i => `
            <button
              onclick="FloatingProjectChat.attachIssueLink('${i.id}', '${i.key}', '${i.title.replace(/'/g, "\\'")}')"
              class="w-full p-1.5 text-left rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer"
            >
              <div class="flex items-center gap-1.5">
                <span class="px-1 py-0.2 rounded font-mono font-bold text-[9px] ${i.type === 'Bug' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'}">
                  ${i.key}
                </span>
                <span class="text-xs font-bold text-slate-800 truncate">${i.title}</span>
              </div>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  },

  /**
   * Handle user typing in message composer
   */
  handleInputChange(event) {
    const val = event.target.value;

    // Check for @mention trigger
    const cursorPos = event.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\s]*)$/);

    if (mentionMatch) {
      this.mentionQuery = mentionMatch[1];
    } else {
      this.mentionQuery = null;
    }

    // Broadcast Realtime Typing Indicator
    if (this.realtimeChannel && store.getActiveUser()) {
      clearTimeout(this.typingTimer);
      this.realtimeChannel.track({
        userId: store.getActiveUser().id,
        userName: store.getActiveUser().name,
        isTyping: true
      });

      this.typingTimer = setTimeout(() => {
        if (this.realtimeChannel && store.getActiveUser()) {
          this.realtimeChannel.track({
            userId: store.getActiveUser().id,
            userName: store.getActiveUser().name,
            isTyping: false
          });
        }
      }, 3000);
    }

    const sendBtn = document.getElementById("chatSendBtn");
    if (sendBtn) {
      if (val.trim() || this.pendingAttachments.length > 0 || this.pendingLinks.length > 0) {
        sendBtn.classList.remove("opacity-50");
      } else {
        sendBtn.classList.add("opacity-50");
      }
    }
  },

  /**
   * Handle Keydown for Enter to send and Shift+Enter for newline
   */
  handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.submitMessage();
    } else if (event.key === "Escape") {
      if (this.mentionQuery !== null) {
        this.mentionQuery = null;
        this.renderPopup();
      } else if (this.replyingTo) {
        this.cancelReply();
      } else if (this.editingMessageId) {
        this.cancelEdit();
      }
    }
  },

  /**
   * Submit and dispatch new/edited message
   */
  async submitMessage() {
    const input = document.getElementById("chatComposerInput");
    if (!input) return;

    const text = input.value.trim();
    if (!text && this.pendingAttachments.length === 0 && this.pendingLinks.length === 0) {
      return;
    }

    const activeUser = store.getActiveUser();
    if (!activeUser) return;

    try {
      if (this.editingMessageId) {
        // Edit existing message
        await store.editMessage(this.editingMessageId, text);
        this.editingMessageId = null;
      } else {
        // Extract mentions
        const mentions = [];
        const members = store.getProjectMembers(this.activeProjectId);
        members.forEach(m => {
          if (text.includes(`@${m.name}`)) {
            mentions.push(m.id);
          }
        });

        // Send new message
        await store.sendMessage({
          conversationId: this.conversationId,
          message: text,
          replyToMessageId: this.replyingTo ? this.replyingTo.id : null,
          attachments: this.pendingAttachments,
          links: this.pendingLinks.map(l => ({ entityType: l.entityType, entityId: l.entityId })),
          mentions
        });

        this.replyingTo = null;
        this.pendingAttachments = [];
        this.pendingLinks = [];
      }

      input.value = "";
      this.mentionQuery = null;
      this.renderPopup();
      setTimeout(() => this.scrollToBottom(), 50);

    } catch (err) {
      if (window.app && window.app.toast) {
        window.app.toast("Chat Error", err.message || "Failed to send message", "error");
      }
    }
  },

  /**
   * Handle File Upload & Supabase Storage
   */
  async handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      try {
        const uploaded = await store.uploadChatAttachment(this.activeProjectId, file);
        this.pendingAttachments.push({
          name: file.name,
          size: file.size,
          type: file.type,
          path: uploaded.file_path
        });
      } catch (e) {
        console.warn("Attachment upload fallback:", e);
      }
    }

    this.renderPopup();
  },

  removePendingAttachment(idx) {
    this.pendingAttachments.splice(idx, 1);
    this.renderPopup();
  },

  removePendingLink(idx) {
    this.pendingLinks.splice(idx, 1);
    this.renderPopup();
  },

  toggleIssuePicker() {
    this.issuePickerOpen = !this.issuePickerOpen;
    this.emojiTrayOpen = false;
    this.renderPopup();
  },

  handleIssueSearch(val) {
    this.issuePickerSearch = val;
    this.renderPopup();
  },

  attachIssueLink(id, key, title) {
    this.pendingLinks.push({
      entityType: "ISSUE",
      entityId: id,
      key,
      title
    });
    this.issuePickerOpen = false;
    this.renderPopup();
  },

  toggleEmojiTray() {
    this.emojiTrayOpen = !this.emojiTrayOpen;
    this.issuePickerOpen = false;
    this.renderPopup();
  },

  insertEmoji(emoji) {
    const input = document.getElementById("chatComposerInput");
    if (input) {
      input.value += `${emoji} `;
      input.focus();
    }
    this.emojiTrayOpen = false;
  },

  selectMention(userId, userName) {
    const input = document.getElementById("chatComposerInput");
    if (input) {
      input.value = input.value.replace(/@[a-zA-Z0-9_\s]*$/, `@${userName} `);
      input.focus();
    }
    this.mentionQuery = null;
    this.renderPopup();
  },

  startReply(messageId) {
    const msg = store.getConversationMessages(this.conversationId).find(m => m.id === messageId);
    if (!msg) return;

    const sender = msg.sender || store.getUserById(msg.sender_id || msg.senderId);
    this.replyingTo = {
      id: msg.id,
      senderName: sender ? sender.name : "Team Member",
      message: msg.message
    };
    this.renderPopup();
    const input = document.getElementById("chatComposerInput");
    if (input) input.focus();
  },

  cancelReply() {
    this.replyingTo = null;
    this.renderPopup();
  },

  startEdit(messageId, currentText) {
    this.editingMessageId = messageId;
    this.renderPopup();
    const input = document.getElementById("chatComposerInput");
    if (input) {
      input.value = currentText;
      input.focus();
    }
  },

  cancelEdit() {
    this.editingMessageId = null;
    this.renderPopup();
    const input = document.getElementById("chatComposerInput");
    if (input) input.value = "";
  },

  async deleteMessagePrompt(messageId) {
    if (confirm("Are you sure you want to delete this message?")) {
      await store.deleteMessage(messageId);
      this.renderPopup();
    }
  },

  async toggleReaction(messageId, reaction) {
    await store.toggleReaction(messageId, reaction);
    this.renderPopup();
  },

  async quickReact(messageId, reaction) {
    await store.toggleReaction(messageId, reaction);
    this.renderPopup();
  },

  toggleMembersDropdown() {
    this.membersDropdownOpen = !this.membersDropdownOpen;
    this.renderPopup();
  },

  toggleSearch() {
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) {
      this.searchQuery = "";
    }
    this.renderPopup();
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.renderPopup();
  },

  scrollToBottom() {
    const stream = document.getElementById("floatingChatMessagesStream");
    if (stream) {
      stream.scrollTop = stream.scrollHeight;
    }
  },

  scrollToMessage(messageId) {
    const target = document.getElementById(`msg-${messageId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add("bg-amber-100/50", "rounded-xl", "p-1");
      setTimeout(() => {
        target.classList.remove("bg-amber-100/50", "rounded-xl", "p-1");
      }, 2000);
    }
  },

  updateTypingAndPresenceUI() {
    const typerArea = document.getElementById("chatTypingIndicatorArea");
    if (typerArea) {
      const activeUser = store.getActiveUser();
      const activeTypers = Array.from(this.typingUsers.entries())
        .filter(([uid]) => uid !== activeUser?.id)
        .map(([, info]) => info.name);

      if (activeTypers.length > 0) {
        typerArea.classList.remove("hidden");
        typerArea.innerHTML = `
          <span class="flex gap-0.5">
            <span class="w-1 h-1 rounded-full bg-emerald-500 animate-bounce"></span>
            <span class="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
          </span>
          <span>${activeTypers.join(", ")} ${activeTypers.length === 1 ? 'is' : 'are'} typing...</span>
        `;
      } else {
        typerArea.classList.add("hidden");
      }
    }
  }
};

// Aliases for compatibility
window.FloatingProjectChat = FloatingProjectChat;
window.ProjectChatView = FloatingProjectChat;
