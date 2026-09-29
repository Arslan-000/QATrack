/**
 * All-in-One Software Project & QA Management Platform
 * AI QA Assistant View & Conversational Bot Component for Kanban Board
 * 
 * Features:
 * 1. 💬 Interactive AI QA Chat Bot for short tasks, project & board telemetry,
 *    and 7 pre-built quick QA questions.
 * 2. 📑 Structured QA Summaries, Developer/Client Emails, and PDF Export Docs.
 */

const AIQAAssistantView = {
  isOpen: false,
  activeMode: "chat", // "chat" | "reports"
  projectId: null,
  activeWorkspaceId: null,
  
  // Chat Bot State
  isTyping: false,
  chatInput: "",
  promptsMenuOpen: false,

  // Date selection & Reports state
  dateMode: "single", // "single" | "range"
  selectedDate: "2026-09-07",
  startDate: "2026-09-07",
  endDate: "2026-09-07",
  matchingIssues: [],
  selectedIssueIds: new Set(),
  
  // Generation & Document UI State
  isGenerating: false,
  generationStage: "",
  activeGenerationType: null,
  currentGeneration: null,
  isEditing: false,
  editedContent: null,
  
  // Email modal state
  emailModalOpen: false,
  emailRecipient: "",
  emailSubject: "",
  emailBody: "",
  includePdfAttachment: true,
  isSendingEmail: false,
  
  // Regenerate instruction modal state
  regenerateModalOpen: false,
  customInstruction: "",

  /**
   * Open the AI QA Assistant Modal / Panel for a project
   */
  open(projectId, initialMode = "chat") {
    this.projectId = projectId || (store.getActiveProject() ? store.getActiveProject().id : null);
    const project = store.getProjectById(this.projectId) || store.getActiveProject();
    if (project) {
      this.activeWorkspaceId = project.workspace_id || project.workspaceId || store.data.activeWorkspaceId;
    }

    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    this.selectedDate = today;
    this.startDate = today;
    this.endDate = today;
    this.dateMode = "single";
    this.activeMode = initialMode;
    this.isTyping = false;
    this.promptsMenuOpen = false;
    this.currentGeneration = null;
    this.isEditing = false;
    this.editedContent = null;
    this.isOpen = true;

    this.loadIssuesForDate();
    this.render();

    // Auto-focus chat input & scroll to bottom if opening in chat mode
    if (this.activeMode === "chat") {
      setTimeout(() => {
        this.scrollChatToBottom();
        const inputEl = document.getElementById("aiQAChatInput");
        if (inputEl && typeof inputEl.focus === "function") inputEl.focus();
      }, 50);
    }
  },

  /**
   * Close the assistant
   */
  close() {
    this.isOpen = false;
    this.emailModalOpen = false;
    this.regenerateModalOpen = false;
    this.promptsMenuOpen = false;
    const container = document.getElementById("aiQAAssistantContainer");
    if (container) {
      container.innerHTML = "";
    }
  },

  /**
   * Switch mode between "chat" and "reports"
   */
  switchMode(mode) {
    this.activeMode = mode;
    this.render();
    if (mode === "chat") {
      setTimeout(() => {
        this.scrollChatToBottom();
        const inputEl = document.getElementById("aiQAChatInput");
        if (inputEl && typeof inputEl.focus === "function") inputEl.focus();
      }, 50);
    }
  },

  /**
   * Toggle quick prompts menu
   */
  togglePromptsMenu() {
    this.promptsMenuOpen = !this.promptsMenuOpen;
    this.render();
  },

  /**
   * Scroll chat container to bottom
   */
  scrollChatToBottom() {
    const chatArea = document.getElementById("aiQAChatScrollArea");
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  },

  /**
   * Send a chat message or execute a quick short task
   */
  async sendChatMessage(customText = null, quickQuestionId = null) {
    const inputEl = document.getElementById("aiQAChatInput");
    const textToSend = (customText !== null ? customText : (inputEl ? inputEl.value : "")).trim();
    if (!textToSend && !quickQuestionId) return;

    if (inputEl) {
      inputEl.value = "";
    }
    this.chatInput = "";
    this.promptsMenuOpen = false;

    // 1. Add user message to history
    store.addAIChatMessage(this.projectId, {
      role: "user",
      text: textToSend,
      quickQuestionId
    });

    this.isTyping = true;
    this.render();
    this.scrollChatToBottom();

    try {
      // 2. Call conversational AI service
      const response = await AIQAService.chatWithAssistant({
        projectId: this.projectId,
        message: textToSend,
        history: store.getAIChatHistory(this.projectId),
        quickQuestionId
      });

      // 3. Add AI assistant reply to history
      store.addAIChatMessage(this.projectId, {
        role: "assistant",
        text: response.reply,
        actions: response.actions,
        metrics: response.metrics,
        quickQuestionId: response.quickQuestionId
      });

    } catch (err) {
      console.error("AI QA Chat Error:", err);
      store.addAIChatMessage(this.projectId, {
        role: "assistant",
        text: "⚠️ I encountered an issue analyzing the board. Please try asking again."
      });
    } finally {
      this.isTyping = false;
      this.render();
      this.scrollChatToBottom();
    }
  },

  /**
   * Trigger quick question prompt
   */
  sendQuickQuestion(questionId) {
    const qList = AIQAService.getQuickQuestions ? AIQAService.getQuickQuestions() : [];
    const q = qList.find(item => item.id === questionId);
    const promptText = q ? q.prompt : questionId;
    this.sendChatMessage(promptText, questionId);
  },

  /**
   * Clear Chat History for current project
   */
  clearChat() {
    if (confirm("Clear AI QA chat history for this project?")) {
      store.clearAIChatHistory(this.projectId);
      this.render();
    }
  },

  /**
   * Copy message text to clipboard
   */
  async copyMessageText(text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.showToast("Copied to clipboard!");
    } catch (e) {
      console.warn("Clipboard write failed:", e);
    }
  },

  /**
   * Handle keydown in chat textarea
   */
  handleChatKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.sendChatMessage();
    }
  },

  /**
   * Format markdown into styled HTML
   */
  formatMarkdown(text) {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xs font-black uppercase text-slate-900 tracking-wider mt-2.5 mb-1.5">$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4 class="text-xs font-bold text-slate-800 mt-2 mb-1">$1</h4>');
    
    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>');
    
    // Code & status pills
    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-200/80 text-slate-800 rounded font-mono text-[11px] font-bold">$1</code>');
    
    // Clickable Ticket Keys e.g. [POS-101], [BUG-101]
    html = html.replace(/\[([A-Z0-9]+-[0-9]+)\]/g, '<span class="inline-flex items-center px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px] border border-indigo-200/70 cursor-pointer hover:bg-indigo-100 hover:text-indigo-900 transition" onclick="window.app.openIssueDetails(\'$1\')" title="Inspect Issue $1">$1</span>');
    
    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-3 border-indigo-500 bg-indigo-50/60 px-3 py-1.5 my-2 rounded-r-lg text-slate-700 text-xs italic leading-relaxed">$1</blockquote>');
    
    // Bullets
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 my-0.5">$1</li>');
    html = html.replace(/^• (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 my-0.5">$1</li>');
    
    // Paragraph breaks
    html = html.replace(/\n\n/g, '<div class="h-2"></div>');
    html = html.replace(/\n/g, '<br/>');

    return html;
  },

  /**
   * Load real issues matching the selected date or date range
   */
  loadIssuesForDate() {
    if (!this.projectId) return;

    let start = this.selectedDate;
    let end = this.selectedDate;

    if (this.dateMode === "range") {
      start = this.startDate;
      end = this.endDate;
      if (start > end) {
        const temp = start;
        start = end;
        end = temp;
      }
    }

    this.matchingIssues = store.getIssuesByDateRange(this.projectId, start, end);
    this.selectedIssueIds = new Set(this.matchingIssues.map(i => i.id));
  },

  /**
   * Toggle single date vs range mode
   */
  setDateMode(mode) {
    this.dateMode = mode;
    this.loadIssuesForDate();
    this.render();
  },

  handleSingleDateChange(dateValue) {
    this.selectedDate = dateValue;
    this.loadIssuesForDate();
    this.render();
  },

  handleRangeChange(startVal, endVal) {
    if (startVal) this.startDate = startVal;
    if (endVal) this.endDate = endVal;
    this.loadIssuesForDate();
    this.render();
  },

  toggleIssueSelection(issueId) {
    if (this.selectedIssueIds.has(issueId)) {
      this.selectedIssueIds.delete(issueId);
    } else {
      this.selectedIssueIds.add(issueId);
    }
    this.render();
  },

  toggleSelectAllIssues(selectAll = true) {
    if (selectAll) {
      this.selectedIssueIds = new Set(this.matchingIssues.map(i => i.id));
    } else {
      this.selectedIssueIds.clear();
    }
    this.render();
  },

  /**
   * Trigger AI generation for one of the 4 formal report types
   */
  async generate(generationType, instruction = null) {
    const selectedIssues = this.matchingIssues.filter(i => this.selectedIssueIds.has(i.id));
    if (selectedIssues.length === 0) {
      alert("Please select at least 1 issue before generating.");
      return;
    }

    const project = store.getProjectById(this.projectId) || store.getActiveProject();
    this.isGenerating = true;
    this.activeGenerationType = generationType;
    this.generationStage = `Reviewing ${selectedIssues.length} issues...`;
    this.render();

    try {
      setTimeout(() => {
        if (this.isGenerating) {
          this.generationStage = "Analyzing severity patterns & QA telemetry...";
          const stageEl = document.getElementById("aiQAStageText");
          if (stageEl) stageEl.textContent = this.generationStage;
        }
      }, 500);

      setTimeout(() => {
        if (this.isGenerating) {
          this.generationStage = "Drafting structured " + this.getGenerationTypeName(generationType) + "...";
          const stageEl = document.getElementById("aiQAStageText");
          if (stageEl) stageEl.textContent = this.generationStage;
        }
      }, 950);

      const result = await AIQAService.generate({
        projectId: this.projectId,
        workspaceId: this.activeWorkspaceId,
        generationType: generationType,
        startDate: this.dateMode === "single" ? this.selectedDate : this.startDate,
        endDate: this.dateMode === "single" ? this.selectedDate : this.endDate,
        selectedIssues: selectedIssues,
        project: project,
        instruction: instruction
      });

      const savedRecord = await store.saveAIGeneration({
        projectId: this.projectId,
        workspaceId: this.activeWorkspaceId,
        startDate: this.dateMode === "single" ? this.selectedDate : this.startDate,
        endDate: this.dateMode === "single" ? this.selectedDate : this.endDate,
        generationType: generationType,
        selectedIssueIds: Array.from(this.selectedIssueIds),
        generatedContent: result.content
      });

      this.currentGeneration = savedRecord;
      this.editedContent = JSON.parse(JSON.stringify(result.content));
      this.isEditing = false;
      this.isGenerating = false;
      this.render();

    } catch (err) {
      console.error("AI Generation Error:", err);
      this.isGenerating = false;
      alert("Unable to generate the summary right now. Please try again.");
      this.render();
    }
  },

  getGenerationTypeName(type) {
    switch (type) {
      case "qa_summary": return "QA Summary";
      case "developer_email": return "Developer Email";
      case "client_email": return "Client Email";
      case "qa_document": return "QA Document";
      default: return "QA Report";
    }
  },

  toggleEditMode() {
    this.isEditing = !this.isEditing;
    this.render();
  },

  saveManualEdits() {
    if (!this.currentGeneration) return;

    if (this.currentGeneration.generation_type === 'developer_email' || this.currentGeneration.generation_type === 'client_email') {
      const subjEl = document.getElementById("editEmailSubject");
      const bodyEl = document.getElementById("editEmailBody");
      if (subjEl && bodyEl) {
        this.editedContent.subject = subjEl.value;
        this.editedContent.body = bodyEl.value;
      }
    } else if (this.currentGeneration.generation_type === 'qa_summary') {
      const titleEl = document.getElementById("editSummaryTitle");
      const sumEl = document.getElementById("editSummaryText");
      const obsEl = document.getElementById("editSummaryObs");
      if (titleEl && sumEl && obsEl) {
        this.editedContent.title = titleEl.value;
        this.editedContent.summary = sumEl.value;
        this.editedContent.qa_observation = obsEl.value;
      }
    } else if (this.currentGeneration.generation_type === 'qa_document') {
      const titleEl = document.getElementById("editDocTitle");
      const obsEl = document.getElementById("editDocObs");
      if (titleEl && obsEl) {
        this.editedContent.title = titleEl.value;
        this.editedContent.qa_observation = obsEl.value;
      }
    }

    this.currentGeneration.generated_content = JSON.parse(JSON.stringify(this.editedContent));
    this.isEditing = false;
    store.saveState();
    this.render();
  },

  async copyToClipboard() {
    if (!this.editedContent && !this.currentGeneration) return;
    const content = this.editedContent || this.currentGeneration.generated_content;
    
    let textToCopy = "";
    if (content.body) {
      textToCopy = `Subject: ${content.subject || ''}\n\n${content.body}`;
    } else if (content.summary) {
      textToCopy = `${content.title || 'QA Testing Summary'}\n\n${content.summary}\n\nQA Observations:\n${content.qa_observation || ''}`;
    } else {
      textToCopy = JSON.stringify(content, null, 2);
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      this.showToast("Copied to clipboard!");
    } catch (e) {
      console.warn("Clipboard write failed:", e);
    }
  },

  showToast(message) {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-5 right-5 z-[9999] px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce";
    toast.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-[#bef264]"></i> <span>${message}</span>`;
    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      toast.remove();
    }, 2500);
  },

  async downloadPDF() {
    if (!this.currentGeneration && !this.editedContent) return;
    const project = store.getProjectById(this.projectId) || store.getActiveProject();

    const pdfContainer = document.getElementById("aiQAPdfRenderRoot");
    if (!pdfContainer) {
      alert("PDF template root not found.");
      return;
    }

    this.showToast("Generating PDF Document...");

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${(project?.name || 'Project').replace(/\s+/g, '_')}_QA_Summary_${this.selectedDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
      try {
        const worker = html2pdf().set(opt).from(pdfContainer);
        await worker.save();

        const pdfBlob = await worker.outputPdf('blob');
        if (pdfBlob) {
          const filename = `QA_Summary_${Date.now()}.pdf`;
          await store.uploadAIPDF(pdfBlob, filename, this.projectId, this.activeWorkspaceId);
        }
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("PDF could not be generated. Please try again.");
      }
    } else {
      window.print();
    }
  },

  openEmailModal(prefillSubject = null, prefillBody = null) {
    const project = store.getProjectById(this.projectId) || store.getActiveProject();
    const content = this.editedContent || (this.currentGeneration ? this.currentGeneration.generated_content : null);

    this.emailSubject = prefillSubject || (content ? content.subject : `QA Testing Summary – ${project ? project.name : 'Project'} – ${this.selectedDate}`);
    this.emailBody = prefillBody || (content ? (content.body || content.summary) : "");
    this.emailRecipient = "";
    this.includePdfAttachment = true;
    this.emailModalOpen = true;
    this.render();
  },

  closeEmailModal() {
    this.emailModalOpen = false;
    this.render();
  },

  async sendEmail() {
    const recipient = this.emailRecipient.trim();
    if (!recipient || !recipient.includes('@')) {
      alert("Please enter a valid recipient email address.");
      return;
    }

    this.isSendingEmail = true;
    this.render();

    try {
      let attachmentPath = null;
      if (this.includePdfAttachment) {
        attachmentPath = `${this.activeWorkspaceId}/${this.projectId}/ai-qa-reports/QA_Summary_${this.selectedDate}.pdf`;
      }

      await store.sendAIEmail({
        projectId: this.projectId,
        workspaceId: this.activeWorkspaceId,
        generationId: this.currentGeneration ? this.currentGeneration.id : null,
        recipient: recipient,
        subject: this.emailSubject,
        body: this.emailBody,
        attachmentPath: attachmentPath
      });

      this.isSendingEmail = false;
      this.emailModalOpen = false;
      this.showToast(`Email successfully sent to ${recipient}!`);
      this.render();

    } catch (err) {
      console.error("Failed to send email:", err);
      this.isSendingEmail = false;
      alert(`Email could not be sent: ${err.message || 'Please review the recipient and try again.'}`);
      this.render();
    }
  },

  openRegenerateModal() {
    this.regenerateModalOpen = true;
    this.customInstruction = "";
    this.render();
  },

  closeRegenerateModal() {
    this.regenerateModalOpen = false;
    this.render();
  },

  executeRegenerate(presetInstruction = null) {
    const instruction = presetInstruction || this.customInstruction;
    this.regenerateModalOpen = false;
    this.generate(this.activeGenerationType || "qa_summary", instruction);
  },

  /**
   * Main Render Method for AI QA Assistant Modal / Panel
   */
  render() {
    let container = document.getElementById("aiQAAssistantContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "aiQAAssistantContainer";
      document.body.appendChild(container);
    }

    if (!this.isOpen) {
      container.innerHTML = "";
      return;
    }

    const project = store.getProjectById(this.projectId) || store.getActiveProject();
    const boardIssues = (store.getIssues ? store.getIssues(this.projectId) : []) || [];
    const chatHistory = store.getAIChatHistory(this.projectId);
    const quickQuestions = AIQAService.getQuickQuestions ? AIQAService.getQuickQuestions() : [];

    container.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5 animate-fade-in">
        
        <!-- Main Assistant Card Container -->
        <div class="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden">
          
          <!-- Top Header Bar -->
          <div class="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-slate-700/50">
            
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 text-lg shrink-0">
                ✨
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-sm sm:text-base font-black tracking-tight text-white truncate">AI QA Assistant</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 shrink-0">
                    ${project ? project.key : 'QA'}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span class="truncate">${project ? project.name : 'Project Board'} • <strong>${boardIssues.length} issues connected</strong></span>
                </div>
              </div>
            </div>

            <!-- Header Controls: Mode Tabs & Actions -->
            <div class="flex items-center gap-2 shrink-0">
              
              <!-- Mode Switcher Segmented Pill -->
              <div class="bg-white/10 p-0.5 rounded-xl flex items-center text-xs font-bold border border-white/10">
                <button onclick="AIQAAssistantView.switchMode('chat')" class="px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${this.activeMode === 'chat' ? 'bg-[#bef264] text-slate-950 shadow-xs' : 'text-slate-200 hover:text-white'}">
                  <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                  <span>Chat Bot</span>
                </button>
                <button onclick="AIQAAssistantView.switchMode('reports')" class="px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${this.activeMode === 'reports' ? 'bg-[#bef264] text-slate-950 shadow-xs' : 'text-slate-200 hover:text-white'}">
                  <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                  <span>Documents & Emails</span>
                </button>
              </div>

              ${this.activeMode === 'chat' && chatHistory.length > 0 ? `
                <button onclick="AIQAAssistantView.clearChat()" class="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-rose-200 transition border border-white/10 cursor-pointer" title="Clear Chat History">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              ` : ''}

              <button onclick="AIQAAssistantView.close()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer" title="Close">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>

          </div>

          <!-- Main Dynamic Body Area -->
          ${this.activeMode === 'chat' ? this.renderChatMode(project, boardIssues, chatHistory, quickQuestions) : this.renderReportsMode(project)}

        </div>

      </div>

      <!-- Modals for Email Sending, Regeneration Refinement & PDF Render Hook -->
      ${this.renderEmailModal()}
      ${this.renderRegenerateModal()}
      ${this.renderHiddenPdfTemplate(project)}
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * =========================================================================
   * MODE 1: INTERACTIVE AI QA CHAT BOT
   * =========================================================================
   */
  renderChatMode(project, boardIssues, chatHistory, quickQuestions) {
    return `
      <div class="flex-1 flex flex-col min-h-0 bg-slate-50/50">
        
        <!-- 7 Quick-Question Suggestion Chips Bar -->
        <div class="px-4 py-2.5 bg-white border-b border-slate-200/80 shrink-0 overflow-x-auto horizontal-scroll-touch shadow-2xs">
          <div class="flex items-center gap-1.5 min-w-max">
            <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1 flex items-center gap-1">
              <span>Short Tasks:</span>
            </span>
            ${quickQuestions.map(q => `
              <button onclick="AIQAAssistantView.sendQuickQuestion('${q.id}')" class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/80 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs" title="${q.prompt}">
                <span class="text-xs">${q.emoji}</span>
                <span>${q.title}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Chat Message Thread Area -->
        <div id="aiQAChatScrollArea" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          ${chatHistory.length === 0 ? `
            <!-- Welcome Screen for Empty Chat -->
            <div class="max-w-2xl mx-auto my-auto py-6 text-center space-y-4 animate-fade-in">
              <div class="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-[#bef264] text-slate-950 flex items-center justify-center mx-auto text-2xl shadow-xl shadow-indigo-500/20">
                ✨
              </div>
              
              <div class="space-y-1">
                <h3 class="text-base font-black text-slate-900">AI QA Assistant for ${project ? project.name : 'Project'}</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  I read your active project state, board columns, and all <strong>${boardIssues.length} real issues</strong>. Ask questions or run short QA tasks!
                </p>
              </div>

              <!-- 4 Starter Tiles -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                <button onclick="AIQAAssistantView.sendQuickQuestion('summary_blockers')" class="p-3.5 bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-2xl transition shadow-2xs group cursor-pointer space-y-1">
                  <div class="flex items-center gap-2 font-bold text-xs text-slate-900 group-hover:text-indigo-600">
                    <span>📋</span>
                    <span>Board Summary & Blockers</span>
                  </div>
                  <p class="text-[11px] text-slate-500">Overview of WIP, open defects, and blockers</p>
                </button>

                <button onclick="AIQAAssistantView.sendQuickQuestion('critical_high_defects')" class="p-3.5 bg-white hover:bg-rose-50/60 border border-slate-200 hover:border-rose-300 rounded-2xl transition shadow-2xs group cursor-pointer space-y-1">
                  <div class="flex items-center gap-2 font-bold text-xs text-slate-900 group-hover:text-rose-600">
                    <span>🚨</span>
                    <span>Critical & High Defects</span>
                  </div>
                  <p class="text-[11px] text-slate-500">Breakdown of blocking bugs and severe risks</p>
                </button>

                <button onclick="AIQAAssistantView.sendQuickQuestion('daily_standup_3bullets')" class="p-3.5 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-2xl transition shadow-2xs group cursor-pointer space-y-1">
                  <div class="flex items-center gap-2 font-bold text-xs text-slate-900 group-hover:text-emerald-600">
                    <span>⚡</span>
                    <span>3-Bullet Daily Standup</span>
                  </div>
                  <p class="text-[11px] text-slate-500">Copyable Done, In Progress & Blocker bullets</p>
                </button>

                <button onclick="AIQAAssistantView.sendQuickQuestion('release_readiness_check')" class="p-3.5 bg-white hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-2xl transition shadow-2xs group cursor-pointer space-y-1">
                  <div class="flex items-center gap-2 font-bold text-xs text-slate-900 group-hover:text-purple-600">
                    <span>🚀</span>
                    <span>Release Gate Check</span>
                  </div>
                  <p class="text-[11px] text-slate-500">Go / No-Go readiness evaluation</p>
                </button>
              </div>

            </div>
          ` : `
            <!-- Chat Messages List -->
            ${chatHistory.map((msg, idx) => {
              const isUser = msg.role === "user";
              const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

              if (isUser) {
                return `
                  <div class="flex justify-end gap-2.5 max-w-2xl ml-auto animate-fade-in">
                    <div class="space-y-1 text-right">
                      <div class="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-slate-900 text-white rounded-2xl rounded-tr-xs text-xs font-medium shadow-xs leading-relaxed text-left inline-block">
                        ${(msg.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                      </div>
                      <div class="text-[10px] text-slate-400 font-semibold pr-1">${timeStr}</div>
                    </div>
                    <div class="w-7 h-7 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                      You
                    </div>
                  </div>
                `;
              }

              // Assistant Message Bubble
              return `
                <div class="flex justify-start gap-2.5 max-w-3xl mr-auto animate-fade-in">
                  <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    ✨
                  </div>
                  <div class="space-y-2 flex-1 min-w-0">
                    <div class="p-4 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs text-xs text-slate-800 shadow-2xs space-y-2 leading-relaxed">
                      ${this.formatMarkdown(msg.text)}
                    </div>

                    <!-- Action Toolbar below assistant bubble -->
                    <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <button onclick="AIQAAssistantView.copyMessageText(${JSON.stringify(msg.text).replace(/"/g, '&quot;')})" class="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs">
                        <i data-lucide="copy" class="w-3 h-3 text-slate-400"></i>
                        <span>Copy</span>
                      </button>

                      ${(msg.actions || []).map(act => {
                        if (act.action === "generate_dev_email") {
                          return `
                            <button onclick="AIQAAssistantView.openEmailModal('QA Defect Report – ${project ? project.name : 'Project'}', ${JSON.stringify(msg.text).replace(/"/g, '&quot;')})" class="px-2.5 py-1 bg-[#f7fee7] hover:bg-[#ecfccb] text-[#4d7c0f] border border-[#d9f99d] rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer">
                              <i data-lucide="mail" class="w-3 h-3 text-[#65a30d]"></i>
                              <span>Send Email</span>
                            </button>
                          `;
                        } else if (act.action === "generate_client_email") {
                          return `
                            <button onclick="AIQAAssistantView.openEmailModal('QA Milestone Update – ${project ? project.name : 'Project'}', ${JSON.stringify(msg.text).replace(/"/g, '&quot;')})" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer">
                              <i data-lucide="mail" class="w-3 h-3 text-emerald-500"></i>
                              <span>Client Email</span>
                            </button>
                          `;
                        } else if (act.action === "generate_qa_doc") {
                          return `
                            <button onclick="AIQAAssistantView.switchMode('reports')" class="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer">
                              <i data-lucide="file-check" class="w-3 h-3 text-purple-500"></i>
                              <span>Full Document</span>
                            </button>
                          `;
                        } else if (act.action === "prompt") {
                          return `
                            <button onclick="AIQAAssistantView.sendChatMessage('${act.prompt}')" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer">
                              <i data-lucide="corner-down-right" class="w-3 h-3 text-indigo-500"></i>
                              <span>${act.label}</span>
                            </button>
                          `;
                        }
                        return '';
                      }).join('')}

                      <span class="text-[10px] text-slate-400 font-semibold ml-auto pr-1">${timeStr}</span>
                    </div>

                  </div>
                </div>
              `;
            }).join('')}
          `}

          <!-- Typing Indicator Animation -->
          ${this.isTyping ? `
            <div class="flex items-center gap-2.5 text-xs text-indigo-600 font-bold animate-pulse py-2">
              <div class="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shadow-xs">
                ✨
              </div>
              <div class="px-4 py-2.5 bg-white border border-indigo-200 rounded-2xl rounded-tl-xs flex items-center gap-2 shadow-2xs">
                <span class="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                <span>AI is analyzing board issues & telemetry...</span>
              </div>
            </div>
          ` : ''}

        </div>

        <!-- Chat Input & Quick Menu Bar -->
        <div class="p-3 sm:p-4 bg-white border-t border-slate-200/90 shrink-0">
          
          <!-- Quick Prompts Floating Menu Popover -->
          ${this.promptsMenuOpen ? `
            <div class="mb-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-2 animate-fade-in text-xs">
              <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quick Task Shortcuts</span>
                <button onclick="AIQAAssistantView.togglePromptsMenu()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                ${quickQuestions.map(q => `
                  <button onclick="AIQAAssistantView.sendQuickQuestion('${q.id}')" class="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 text-left font-bold text-slate-800 hover:text-indigo-700 transition flex items-center gap-2 cursor-pointer">
                    <span>${q.emoji}</span>
                    <span class="truncate">${q.title}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Input Controls -->
          <div class="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition shadow-2xs">
            
            <button onclick="AIQAAssistantView.togglePromptsMenu()" class="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition shrink-0 cursor-pointer" title="Quick Task Prompts (/)">
              <i data-lucide="sparkles" class="w-4 h-4 text-indigo-600"></i>
            </button>

            <textarea id="aiQAChatInput" rows="1" onkeydown="AIQAAssistantView.handleChatKeydown(event)" placeholder="Ask about board issues, blockers, or short QA tasks... (Press Enter to send)" class="flex-1 bg-transparent py-2 px-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none resize-none font-medium max-h-24"></textarea>

            <button onclick="AIQAAssistantView.sendChatMessage()" class="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition shrink-0 cursor-pointer flex items-center justify-center">
              <i data-lucide="send" class="w-4 h-4"></i>
            </button>

          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1 mt-1.5">
            <span>✨ Zero-hallucination engine • Connected to <strong>${boardIssues.length} issues</strong></span>
            <span>Press <kbd class="px-1 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200 font-mono">Enter</kbd> to send</span>
          </div>

        </div>

      </div>
    `;
  },

  /**
   * =========================================================================
   * MODE 2: FORMAL DOCUMENTS, QA SUMMARIES & EMAILS GENERATOR
   * =========================================================================
   */
  renderReportsMode(project) {
    const metrics = AIQAService.calculateMetrics(this.matchingIssues);
    const selectedCount = this.selectedIssueIds.size;
    const totalFound = this.matchingIssues.length;

    return `
      <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

        <!-- STEP 1: SELECT TESTING DATE / RANGE -->
        <div class="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">1</span>
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Select Testing Date</h3>
            </div>

            <!-- Date Mode Segmented Toggle -->
            <div class="bg-slate-200/80 p-0.5 rounded-xl flex items-center text-xs font-bold">
              <button onclick="AIQAAssistantView.setDateMode('single')" class="px-3 py-1 rounded-lg transition ${this.dateMode === 'single' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
                Single Date
              </button>
              <button onclick="AIQAAssistantView.setDateMode('range')" class="px-3 py-1 rounded-lg transition ${this.dateMode === 'range' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
                Date Range
              </button>
            </div>
          </div>

          <!-- Date Picker Controls -->
          <div class="flex flex-wrap items-center gap-3 pt-1">
            ${this.dateMode === 'single' ? `
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-500 font-semibold">Testing Date:</span>
                <input type="date" value="${this.selectedDate}" onchange="AIQAAssistantView.handleSingleDateChange(this.value)" class="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
            ` : `
              <div class="flex flex-wrap items-center gap-2.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs text-slate-500 font-semibold">From:</span>
                  <input type="date" value="${this.startDate}" onchange="AIQAAssistantView.handleRangeChange(this.value, null)" class="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <span class="text-slate-400 font-bold text-xs">→</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs text-slate-500 font-semibold">To:</span>
                  <input type="date" value="${this.endDate}" onchange="AIQAAssistantView.handleRangeChange(null, this.value)" class="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
            `}

            <div class="text-[11px] text-slate-400 font-medium ml-auto">
              Scope: <span class="font-bold text-slate-700">${project ? project.name : 'Active Project'}</span>
            </div>
          </div>
        </div>

        <!-- STEP 2: ISSUES FOUND & SELECTION CHECKLIST -->
        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <div>
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Issues Found</h3>
                <p class="text-[11px] text-slate-500 font-medium">
                  ${totalFound === 0 ? 'No issues logged for this timeframe' : `${totalFound} ${totalFound === 1 ? 'issue' : 'issues'} found (${selectedCount} selected for AI analysis)`}
                </p>
              </div>
            </div>

            ${totalFound > 0 ? `
              <div class="flex items-center gap-2 text-xs">
                <button onclick="AIQAAssistantView.toggleSelectAllIssues(true)" class="text-indigo-600 hover:underline font-bold text-[11px]">Select All</button>
                <span class="text-slate-300">|</span>
                <button onclick="AIQAAssistantView.toggleSelectAllIssues(false)" class="text-slate-500 hover:underline font-bold text-[11px]">Deselect All</button>
              </div>
            ` : ''}
          </div>

          ${totalFound === 0 ? `
            <div class="py-8 text-center space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <i data-lucide="calendar-x" class="w-5 h-5"></i>
              </div>
              <div class="text-xs font-bold text-slate-700">No issues were found for the selected date.</div>
              <div class="text-[11px] text-slate-400">Try another date or date range to inspect issues.</div>
            </div>
          ` : `
            <!-- Severity Breakdown Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div class="p-2.5 rounded-xl bg-red-50/70 border border-red-200/80 flex items-center justify-between">
                <div>
                  <div class="text-[10px] font-bold uppercase text-red-600">Critical</div>
                  <div class="text-lg font-black text-red-950 font-mono">${metrics.severityCounts.Critical || 0}</div>
                </div>
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
              </div>
              <div class="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/80 flex items-center justify-between">
                <div>
                  <div class="text-[10px] font-bold uppercase text-orange-600">High</div>
                  <div class="text-lg font-black text-orange-950 font-mono">${metrics.severityCounts.High || 0}</div>
                </div>
                <span class="w-2 h-2 rounded-full bg-orange-500"></span>
              </div>
              <div class="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <div class="text-[10px] font-bold uppercase text-amber-600">Medium</div>
                  <div class="text-lg font-black text-amber-950 font-mono">${metrics.severityCounts.Medium || 0}</div>
                </div>
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              </div>
              <div class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <div class="text-[10px] font-bold uppercase text-emerald-600">Low</div>
                  <div class="text-lg font-black text-emerald-950 font-mono">${metrics.severityCounts.Low || 0}</div>
                </div>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
            </div>

            <!-- Selectable Issues List -->
            <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
              ${this.matchingIssues.map(issue => {
                const isChecked = this.selectedIssueIds.has(issue.id);
                const prio = issue.priority || "Medium";
                const prioColor = prio === 'Critical' ? 'bg-red-100 text-red-800 border-red-200' :
                                  prio === 'High' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                  prio === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200';

                return `
                  <label class="flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${isChecked ? 'bg-white shadow-2xs border border-slate-200' : 'bg-transparent hover:bg-slate-100 text-slate-400'}">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                      <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="AIQAAssistantView.toggleIssueSelection('${issue.id}')" class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                      <span class="font-mono text-xs font-bold text-slate-900 shrink-0">${issue.key}</span>
                      <span class="text-xs font-medium text-slate-800 truncate">${issue.title}</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 ml-3">
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${prioColor}">${prio}</span>
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">${issue.status || 'Open'}</span>
                    </div>
                  </label>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- STEP 3: AI GENERATION OPTIONS -->
        ${totalFound > 0 ? `
          <div class="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white space-y-3.5 shadow-md">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-[#bef264] text-slate-950 text-[11px] font-black flex items-center justify-center">3</span>
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-100">AI Generation Options</h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              
              <!-- Button 1: QA Summary -->
              <button onclick="AIQAAssistantView.generate('qa_summary')" ${this.isGenerating ? 'disabled' : ''} class="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 rounded-xl text-left transition space-y-1 cursor-pointer group">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-black text-white group-hover:text-[#bef264] transition">QA Summary</div>
                  <i data-lucide="file-text" class="w-4 h-4 text-[#bef264]"></i>
                </div>
                <p class="text-[10px] text-slate-300 font-medium">Metrics, severity distribution & observations</p>
              </button>

              <!-- Button 2: Developer Email -->
              <button onclick="AIQAAssistantView.generate('developer_email')" ${this.isGenerating ? 'disabled' : ''} class="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 rounded-xl text-left transition space-y-1 cursor-pointer group">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-black text-white group-hover:text-[#bef264] transition">Developer Email</div>
                  <i data-lucide="code" class="w-4 h-4 text-[#bef264]"></i>
                </div>
                <p class="text-[10px] text-slate-300 font-medium">Technical keys, blockers & action items</p>
              </button>

              <!-- Button 3: Client Email -->
              <button onclick="AIQAAssistantView.generate('client_email')" ${this.isGenerating ? 'disabled' : ''} class="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 rounded-xl text-left transition space-y-1 cursor-pointer group">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-black text-white group-hover:text-emerald-300 transition">Client Email</div>
                  <i data-lucide="mail" class="w-4 h-4 text-emerald-400"></i>
                </div>
                <p class="text-[10px] text-slate-300 font-medium">Executive business summary & release status</p>
              </button>

              <!-- Button 4: QA Document -->
              <button onclick="AIQAAssistantView.generate('qa_document')" ${this.isGenerating ? 'disabled' : ''} class="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 rounded-xl text-left transition space-y-1 cursor-pointer group">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-black text-white group-hover:text-purple-300 transition">QA Document</div>
                  <i data-lucide="file-check" class="w-4 h-4 text-purple-400"></i>
                </div>
                <p class="text-[10px] text-slate-300 font-medium">Concise report formatted for PDF export</p>
              </button>

            </div>
          </div>
        ` : ''}

        <!-- STEP 4: GENERATION LOADING STATE -->
        ${this.isGenerating ? `
          <div class="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-8 text-center space-y-3 animate-pulse">
            <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto text-xl shadow-lg shadow-indigo-500/30 animate-bounce">
              ✨
            </div>
            <div class="text-sm font-black text-slate-900">✨ Analyzing your QA issues...</div>
            <div id="aiQAStageText" class="text-xs font-semibold text-indigo-700">${this.generationStage}</div>
          </div>
        ` : ''}

        <!-- STEP 5: PREVIEW & INTERACTIVE TOOLBAR -->
        ${(this.currentGeneration || this.editedContent) && !this.isGenerating ? `
          <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            
            <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  ${this.getGenerationTypeName(this.currentGeneration?.generation_type || this.activeGenerationType)} Preview
                </h3>
              </div>

              <!-- Toolbar Buttons -->
              <div class="flex flex-wrap items-center gap-1.5">
                ${this.isEditing ? `
                  <button onclick="AIQAAssistantView.saveManualEdits()" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i> Save Edits
                  </button>
                ` : `
                  <button onclick="AIQAAssistantView.toggleEditMode()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
                  </button>
                `}

                <button onclick="AIQAAssistantView.openRegenerateModal()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Regenerate
                </button>

                <button onclick="AIQAAssistantView.copyToClipboard()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy
                </button>

                <button onclick="AIQAAssistantView.downloadPDF()" class="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i> Download PDF
                </button>

                <button onclick="AIQAAssistantView.openEmailModal()" class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="send" class="w-3.5 h-3.5 text-emerald-400"></i> Send Email
                </button>
              </div>
            </div>

            <div class="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 font-sans text-xs text-slate-800 space-y-4">
              ${this.renderGeneratedContentPreview()}
            </div>

          </div>
        ` : ''}

      </div>
    `;
  },

  renderGeneratedContentPreview() {
    const content = this.editedContent || (this.currentGeneration ? this.currentGeneration.generated_content : null);
    if (!content) return `<div class="text-slate-400">No content generated.</div>`;

    const genType = this.currentGeneration ? this.currentGeneration.generation_type : this.activeGenerationType;

    if (genType === 'developer_email' || genType === 'client_email') {
      if (this.isEditing) {
        return `
          <div class="space-y-3">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Email Subject:</label>
              <input id="editEmailSubject" type="text" value="${(content.subject || '').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Email Message Body:</label>
              <textarea id="editEmailBody" rows="10" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 leading-relaxed">${content.body || ''}</textarea>
            </div>
          </div>
        `;
      }

      return `
        <div class="space-y-3">
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Subject:</span>
            <div class="font-bold text-slate-900 text-sm">${content.subject || ''}</div>
          </div>
          <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs whitespace-pre-wrap font-sans text-slate-800 leading-relaxed">
            ${content.body || ''}
          </div>
        </div>
      `;
    }

    if (this.isEditing) {
      return `
        <div class="space-y-3">
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title:</label>
            <input id="editSummaryTitle" type="text" value="${(content.title || '').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900" />
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Summary:</label>
            <textarea id="editSummaryText" rows="4" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-sans text-slate-800">${content.summary || ''}</textarea>
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">QA Observation:</label>
            <textarea id="editSummaryObs" rows="3" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-sans text-slate-800">${content.qa_observation || ''}</textarea>
          </div>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        <div class="border-b border-slate-200 pb-3">
          <h4 class="text-sm font-black text-slate-900">${content.title || 'QA Testing Summary'}</h4>
          <div class="text-[11px] text-slate-500 font-medium mt-0.5">
            Testing Date: <span class="font-bold text-slate-800">${this.selectedDate}</span> • Issues Evaluated: <span class="font-bold text-slate-800">${this.selectedIssueIds.size}</span>
          </div>
        </div>

        <div class="p-3.5 bg-white rounded-xl border border-slate-200 leading-relaxed">
          ${content.summary || ''}
        </div>

        ${content.major_findings && content.major_findings.length > 0 ? `
          <div class="space-y-1.5">
            <span class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Major Findings:</span>
            <div class="space-y-1">
              ${content.major_findings.map((f, idx) => `
                <div class="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                  <span class="font-medium text-slate-800">${idx + 1}. ${f.title}</span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${f.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}">${f.priority}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${content.qa_observation ? `
          <div class="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase text-emerald-800">QA Observation:</span>
            <p class="text-xs text-emerald-950 font-medium leading-relaxed">${content.qa_observation}</p>
          </div>
        ` : ''}
      </div>
    `;
  },

  renderEmailModal() {
    if (!this.emailModalOpen) return '';

    return `
      <div class="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
          
          <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="mail" class="w-4 h-4 text-emerald-400"></i>
              <h3 class="text-sm font-black text-white">Send QA Report Email</h3>
            </div>
            <button onclick="AIQAAssistantView.closeEmailModal()" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">To: Recipient Email Address <span class="text-red-500">*</span></label>
              <input type="email" value="${this.emailRecipient}" oninput="AIQAAssistantView.emailRecipient = this.value" placeholder="e.g. developer@company.com or client@enterprise.io" class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Subject:</label>
              <input type="text" value="${(this.emailSubject || '').replace(/"/g, '&quot;')}" oninput="AIQAAssistantView.emailSubject = this.value" class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Message Body:</label>
              <textarea rows="6" oninput="AIQAAssistantView.emailBody = this.value" class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-sans text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed">${this.emailBody || ''}</textarea>
            </div>

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <i data-lucide="paperclip" class="w-4 h-4 text-indigo-600"></i>
                <div>
                  <div class="text-xs font-bold text-slate-800">QA-Testing-Summary.pdf</div>
                  <div class="text-[10px] text-slate-400">Attached QA Executive Report</div>
                </div>
              </div>
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" ${this.includePdfAttachment ? 'checked' : ''} onchange="AIQAAssistantView.includePdfAttachment = this.checked" class="w-4 h-4 rounded text-indigo-600" />
                <span>Attach</span>
              </label>
            </div>
          </div>

          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button onclick="AIQAAssistantView.closeEmailModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition">
              Cancel
            </button>
            <button onclick="AIQAAssistantView.sendEmail()" ${this.isSendingEmail ? 'disabled' : ''} class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer">
              ${this.isSendingEmail ? '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Sending...' : '<i data-lucide="send" class="w-3.5 h-3.5"></i> Send Email'}
            </button>
          </div>

        </div>
      </div>
    `;
  },

  renderRegenerateModal() {
    if (!this.regenerateModalOpen) return '';

    return `
      <div class="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
          
          <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="refresh-cw" class="w-4 h-4 text-[#bef264]"></i>
              <h3 class="text-sm font-black text-white">Regenerate Content</h3>
            </div>
            <button onclick="AIQAAssistantView.closeRegenerateModal()" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <p class="text-xs text-slate-600 font-medium">Select a refinement preset or type custom formatting instructions:</p>

            <div class="space-y-2">
              <button onclick="AIQAAssistantView.executeRegenerate('Make it shorter')" class="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition flex items-center justify-between">
                <span>Make it shorter</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-400"></i>
              </button>

              <button onclick="AIQAAssistantView.executeRegenerate('Make it more professional')" class="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition flex items-center justify-between">
                <span>Make it more professional</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-400"></i>
              </button>

              <button onclick="AIQAAssistantView.executeRegenerate('Focus only on critical and high issues')" class="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition flex items-center justify-between">
                <span>Focus only on critical and high issues</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-400"></i>
              </button>

              <button onclick="AIQAAssistantView.executeRegenerate('Make it suitable for the client')" class="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition flex items-center justify-between">
                <span>Make it suitable for the client</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-400"></i>
              </button>
            </div>

            <div class="pt-2 border-t border-slate-100">
              <label class="block text-xs font-bold text-slate-700 mb-1">Custom Instruction:</label>
              <input type="text" value="${this.customInstruction}" oninput="AIQAAssistantView.customInstruction = this.value" placeholder="e.g. Include note about staging verification..." class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button onclick="AIQAAssistantView.closeRegenerateModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition">
              Cancel
            </button>
            <button onclick="AIQAAssistantView.executeRegenerate(null)" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Regenerate
            </button>
          </div>

        </div>
      </div>
    `;
  },

  renderHiddenPdfTemplate(project) {
    const content = this.editedContent || (this.currentGeneration ? this.currentGeneration.generated_content : null);
    if (!content) return '';

    const metrics = AIQAService.calculateMetrics(this.matchingIssues.filter(i => this.selectedIssueIds.has(i.id)));

    return `
      <div style="position: absolute; left: -9999px; top: -9999px;">
        <div id="aiQAPdfRenderRoot" style="width: 210mm; min-height: 297mm; padding: 25mm 20mm; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #ffffff;">
          
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #0f172a;">QA Testing Summary</h1>
              <p style="font-size: 13px; color: #475569; margin: 4px 0 0 0;">Project: <strong>${project ? project.name : 'Software Project'}</strong></p>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <div>Testing Date: <strong>${this.selectedDate}</strong></div>
              <div>Generated: <strong>${new Date().toLocaleDateString()}</strong></div>
            </div>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 20px;">
            <div style="flex: 1; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Total Issues</div>
              <div style="font-size: 22px; font-weight: bold; color: #0f172a; margin-top: 4px;">${this.selectedIssueIds.size}</div>
            </div>
            <div style="flex: 1; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
              <div style="font-size: 11px; color: #dc2626; font-weight: bold; text-transform: uppercase;">Critical</div>
              <div style="font-size: 22px; font-weight: bold; color: #991b1b; margin-top: 4px;">${metrics.severityCounts.Critical || 0}</div>
            </div>
            <div style="flex: 1; padding: 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;">
              <div style="font-size: 11px; color: #ea580c; font-weight: bold; text-transform: uppercase;">High</div>
              <div style="font-size: 22px; font-weight: bold; color: #9a3412; margin-top: 4px;">${metrics.severityCounts.High || 0}</div>
            </div>
            <div style="flex: 1; padding: 12px; background: #fefce8; border: 1px solid #fef08a; border-radius: 8px;">
              <div style="font-size: 11px; color: #ca8a04; font-weight: bold; text-transform: uppercase;">Medium</div>
              <div style="font-size: 22px; font-weight: bold; color: #854d0e; margin-top: 4px;">${metrics.severityCounts.Medium || 0}</div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; color: #334155; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Summary Overview</h3>
            <p style="font-size: 12px; line-height: 1.6; color: #1e293b;">
              ${content.summary || content.body || 'QA testing completed successfully.'}
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; color: #334155; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Selected Discovered Issues</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background: #f1f5f9; text-align: left;">
                  <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Key</th>
                  <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Title</th>
                  <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Severity</th>
                  <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${this.matchingIssues.filter(i => this.selectedIssueIds.has(i.id)).map(issue => `
                  <tr>
                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">${issue.key}</td>
                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${issue.title}</td>
                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: bold;">${issue.priority || 'Medium'}</td>
                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${issue.status || 'Open'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${content.qa_observation ? `
            <div style="margin-top: 20px; padding: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
              <h4 style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #065f46; margin: 0 0 4px 0;">QA Observation</h4>
              <p style="font-size: 11px; color: #064e3b; margin: 0; line-height: 1.5;">${content.qa_observation}</p>
            </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
            <span>PulseWave QA Management Platform</span>
            <span>Confidential QA Report</span>
          </div>

        </div>
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.AIQAAssistantView = AIQAAssistantView;
}
if (typeof global !== 'undefined') {
  global.AIQAAssistantView = AIQAAssistantView;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIQAAssistantView;
}
