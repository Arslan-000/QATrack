/**
 * All-in-One Software Project & Quality Management Platform
 * V1.3 Ticket / Work Management View (Kanban Board & List View)
 */

const TicketsView = {
  viewMode: "kanban", // 'kanban' or 'list'
  filterType: "all",
  filterPriority: "all",
  filterAssignee: "all",
  searchQuery: "",

  columns: [
    { id: "Backlog", title: "Backlog", color: "border-slate-300", badge: "badge-backlog" },
    { id: "To Do", title: "To Do", color: "border-slate-300", badge: "badge-todo" },
    { id: "In Development", title: "In Development", color: "border-amber-400", badge: "badge-development" },
    { id: "Ready for QA", title: "Ready for QA", color: "border-purple-400", badge: "badge-ready-for-qa" },
    { id: "QA Testing", title: "QA Testing", color: "border-pink-400", badge: "badge-qa-testing" },
    { id: "Done", title: "Done", color: "border-emerald-400", badge: "badge-done" }
  ],

  render(container) {
    const project = store.getActiveProject();
    const tickets = store.getTickets(project.id);
    const filteredTickets = this.filterTickets(tickets);
    const users = store.getUsers();

    container.innerHTML = `
      <div class="space-y-5 animate-fade-in">
        <!-- Top Toolbar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">Work & Ticket Management</h1>
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]">${project.key}</span>
            </div>
            <p class="text-xs text-slate-500 mt-1">Track Epics, Stories, Tasks, acceptance criteria, and full QA handover lifecycle.</p>
          </div>

          <div class="flex items-center gap-3">
            <!-- View Mode Switcher -->
            <div class="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200">
              <button onclick="TicketsView.setViewMode('kanban')" class="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${this.viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
                <i data-lucide="kanban" class="w-3.5 h-3.5"></i> Kanban
              </button>
              <button onclick="TicketsView.setViewMode('list')" class="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${this.viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
                <i data-lucide="list" class="w-3.5 h-3.5"></i> Table List
              </button>
            </div>

            <button onclick="TicketsView.openCreateTicketModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 text-xs font-bold rounded-xl shadow-xs shadow-[#bef264]/25 transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4 text-slate-950"></i> Create Ticket
            </button>
          </div>
        </div>

        <!-- Filters & Search Bar -->
        <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3 flex-1">
            <!-- Search -->
            <div class="relative min-w-[200px] flex-1 max-w-xs">
              <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
              <input type="text" value="${this.searchQuery}" oninput="TicketsView.handleSearch(this.value)" placeholder="Search tickets by title, key..." class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <!-- Type Filter -->
            <select onchange="TicketsView.setFilter('type', this.value)" class="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none text-slate-700 font-medium">
              <option value="all" ${this.filterType === 'all' ? 'selected' : ''}>All Types</option>
              <option value="Epic" ${this.filterType === 'Epic' ? 'selected' : ''}>Epic</option>
              <option value="Story" ${this.filterType === 'Story' ? 'selected' : ''}>Story</option>
              <option value="Task" ${this.filterType === 'Task' ? 'selected' : ''}>Task</option>
              <option value="Subtask" ${this.filterType === 'Subtask' ? 'selected' : ''}>Sub-task</option>
            </select>

            <!-- Priority Filter -->
            <select onchange="TicketsView.setFilter('priority', this.value)" class="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none text-slate-700 font-medium">
              <option value="all" ${this.filterPriority === 'all' ? 'selected' : ''}>All Priorities</option>
              <option value="Critical" ${this.filterPriority === 'Critical' ? 'selected' : ''}>Critical</option>
              <option value="High" ${this.filterPriority === 'High' ? 'selected' : ''}>High</option>
              <option value="Medium" ${this.filterPriority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="Low" ${this.filterPriority === 'Low' ? 'selected' : ''}>Low</option>
            </select>

            <!-- Assignee Filter -->
            <select onchange="TicketsView.setFilter('assignee', this.value)" class="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none text-slate-700 font-medium">
              <option value="all" ${this.filterAssignee === 'all' ? 'selected' : ''}>All Assignees</option>
              ${users.map(u => `<option value="${u.id}" ${this.filterAssignee === u.id ? 'selected' : ''}>${u.name} (${u.role})</option>`).join("")}
            </select>
          </div>

          <div class="text-xs text-slate-500 font-medium">
            Showing <strong>${filteredTickets.length}</strong> of ${tickets.length} tickets
          </div>
        </div>

        <!-- Main View Area -->
        ${this.viewMode === 'kanban' ? this.renderKanbanBoard(filteredTickets) : this.renderListView(filteredTickets)}

        <!-- Modals Container -->
        <div id="ticketModalContainer"></div>
      </div>
    `;

    this.initDragAndDrop();
    if (window.lucide) window.lucide.createIcons();
  },

  filterTickets(tickets) {
    return tickets.filter(t => {
      if (this.filterType !== "all" && t.type !== this.filterType) return false;
      if (this.filterPriority !== "all" && t.priority !== this.filterPriority) return false;
      if (this.filterAssignee !== "all" && t.assigneeId !== this.filterAssignee) return false;
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchKey = t.key.toLowerCase().includes(q);
        const matchDesc = (t.description || "").toLowerCase().includes(q);
        if (!matchTitle && !matchKey && !matchDesc) return false;
      }
      return true;
    });
  },

  setViewMode(mode) {
    this.viewMode = mode;
    this.render(document.getElementById("mainContent"));
  },

  setFilter(field, value) {
    if (field === "type") this.filterType = value;
    if (field === "priority") this.filterPriority = value;
    if (field === "assignee") this.filterAssignee = value;
    this.render(document.getElementById("mainContent"));
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.render(document.getElementById("mainContent"));
  },

  renderKanbanBoard(tickets) {
    return `
      <div class="flex lg:grid lg:grid-cols-6 gap-3.5 overflow-x-auto pb-4 horizontal-scroll-touch snap-x snap-mandatory">
        ${this.columns.map(col => {
          const colTickets = tickets.filter(t => {
            const s = (t.status || "").toLowerCase().trim();
            if (col.id === "Backlog") {
              return ["backlog", "open", "new", "reopened", "re-opened", "blocked"].includes(s) ||
                     (!["to do", "todo", "to_do", "in development", "in progress", "development", "ready for qa", "fixed", "qa testing", "qa", "done", "closed", "resolved"].includes(s));
            }
            if (col.id === "To Do") return ["to do", "todo", "to_do", "planning"].includes(s);
            if (col.id === "In Development") return ["in development", "in progress", "development", "active"].includes(s);
            if (col.id === "Ready for QA") return ["ready for qa", "ready_for_qa", "qa ready", "fixed"].includes(s);
            if (col.id === "QA Testing") return ["qa testing", "qa_testing", "qa", "testing", "in qa"].includes(s);
            if (col.id === "Done") return ["done", "closed", "resolved", "completed"].includes(s);
            return (t.status || "").toLowerCase() === col.id.toLowerCase();
          });

          return `
            <div class="w-[280px] sm:w-[300px] lg:w-auto shrink-0 snap-start bg-slate-50/75 rounded-xl border border-slate-200/90 flex flex-col kanban-col" data-column-status="${col.id}">
              <!-- Column Header -->
              <div class="p-3 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-xl">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full ${
                    col.id === 'Backlog' ? 'bg-slate-400' :
                    col.id === 'To Do' ? 'bg-slate-900' :
                    col.id === 'In Development' ? 'bg-amber-500' :
                    col.id === 'Ready for QA' ? 'bg-purple-500' :
                    col.id === 'QA Testing' ? 'bg-pink-500' : 'bg-emerald-500'
                  }"></span>
                  <h3 class="text-xs font-bold text-slate-800">${col.title}</h3>
                </div>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${colTickets.length}</span>
              </div>

              <!-- Column Cards Container -->
              <div class="p-2 space-y-2.5 flex-1 min-h-[380px] kanban-cards-area" data-status="${col.id}">
                ${colTickets.length === 0 ? `
                  <div class="h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400 text-center p-3">
                    No tickets in ${col.title}
                  </div>
                ` : colTickets.map(t => this.renderTicketCard(t)).join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  renderTicketCard(t) {
    const devId = t.developerId || t.developer_id || t.assigneeId || t.assignee_id;
    const qaId = t.qaAssigneeId || t.qaId || t.qa_id;
    const assignee = (devId && store.getUserById(devId)) || { name: "Unassigned", initials: "UA", color: "bg-slate-400" };
    const qa = (qaId && store.getUserById(qaId)) || { name: "Unassigned", initials: "QA", color: "bg-purple-600" };
    const acTotal = t.acceptanceCriteria ? t.acceptanceCriteria.length : 0;
    const acDone = t.acceptanceCriteria ? t.acceptanceCriteria.filter(a => a.done).length : 0;

    let typeColor = "bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]";
    if (t.type === "Epic") typeColor = "bg-purple-100 text-purple-800";
    if (t.type === "Task") typeColor = "bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]";
    if (t.type === "Subtask") typeColor = "bg-slate-100 text-slate-700";

    return `
      <div class="bg-white rounded-lg p-3.5 border border-slate-200 shadow-sm kanban-card card-hover" draggable="true" data-ticket-id="${t.id}" onclick="TicketsView.openTicketDetails('${t.id}')">
        <!-- Top row: Type, Key, Priority -->
        <div class="flex items-center justify-between gap-1.5 mb-2">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${typeColor}">${t.type}</span>
            <span class="text-xs font-mono font-bold text-slate-700">${t.key}</span>
          </div>
          <span class="text-[10px] font-bold px-1.5 py-0.2 rounded ${
            t.priority === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200' :
            t.priority === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
            t.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-600'
          }">${t.priority}</span>
        </div>

        <!-- Title -->
        <h4 class="text-xs font-bold text-slate-900 hover:text-slate-950 transition leading-snug line-clamp-2">${t.title}</h4>

        <!-- Acceptance criteria indicator -->
        ${acTotal > 0 ? `
          <div class="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
            <i data-lucide="check-square" class="w-3.5 h-3.5 ${acDone === acTotal ? 'text-emerald-600' : 'text-slate-400'}"></i>
            <span>AC: ${acDone}/${acTotal}</span>
            <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-1">
              <div class="h-full bg-emerald-500 rounded-full" style="width: ${(acDone/acTotal)*100}%"></div>
            </div>
          </div>
        ` : ''}

        <!-- Ready for QA banner if applicable -->
        ${t.status === 'Ready for QA' && t.devHandoverNotes ? `
          <div class="mt-2 p-1.5 bg-purple-50 rounded border border-purple-200 text-[10px] text-purple-800 flex items-center justify-between">
            <span class="font-semibold flex items-center gap-1"><i data-lucide="terminal" class="w-3 h-3"></i> ${t.devHandoverNotes.buildVersion}</span>
            <span class="text-purple-600 font-bold">Ready</span>
          </div>
        ` : ''}

        <!-- Bottom row: Assignee Avatar, QA Tag, Comments count -->
        <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div class="flex items-center gap-1.5" title="Developer: ${assignee.name || 'Unassigned'}">
            <div class="w-5 h-5 rounded-full ${assignee.color || 'bg-amber-600'} text-white text-[9px] font-bold flex items-center justify-center">${assignee.initials || 'UA'}</div>
            <span class="text-[11px] text-slate-600 truncate max-w-[80px]">${(assignee.name || 'Unassigned').split(" ")[0]}</span>
          </div>

          <div class="flex items-center gap-2 text-slate-400 text-[11px]">
            ${t.linkedTestCases && t.linkedTestCases.length > 0 ? `
              <span class="flex items-center gap-0.5 text-emerald-600 font-semibold" title="${t.linkedTestCases.length} linked test cases">
                <i data-lucide="clipboard-check" class="w-3 h-3"></i> ${t.linkedTestCases.length}
              </span>
            ` : ''}
            ${t.linkedBugs && t.linkedBugs.length > 0 ? `
              <span class="flex items-center gap-0.5 text-red-600 font-bold" title="${t.linkedBugs.length} linked bugs">
                <i data-lucide="bug" class="w-3 h-3"></i> ${t.linkedBugs.length}
              </span>
            ` : ''}
            ${t.comments && t.comments.length > 0 ? `
              <span class="flex items-center gap-0.5">
                <i data-lucide="message-square" class="w-3 h-3"></i> ${t.comments.length}
              </span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  renderListView(tickets) {
    return `
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-700 min-w-[650px]">
            <thead class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              <tr>
                <th class="py-3 px-4">Key</th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4">Title</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Priority</th>
                <th class="py-3 px-4">Developer</th>
                <th class="py-3 px-4">QA Lead</th>
                <th class="py-3 px-4">Due Date</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${tickets.map(t => {
                const dev = store.getUserById(t.assigneeId);
                const qa = store.getUserById(t.qaAssigneeId);
                return `
                  <tr class="hover:bg-slate-50/80 transition cursor-pointer" onclick="TicketsView.openTicketDetails('${t.id}')">
                    <td class="py-3 px-4 font-mono font-bold text-slate-900">${t.key}</td>
                    <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">${t.type}</span></td>
                    <td class="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">${t.title}</td>
                    <td class="py-3 px-4">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Ready for QA' ? 'bg-purple-100 text-purple-800' :
                        t.status === 'In Development' ? 'bg-amber-100 text-amber-800' :
                        t.status === 'QA Testing' ? 'bg-pink-100 text-pink-800' :
                        t.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }">● ${t.status}</span>
                    </td>
                    <td class="py-3 px-4 font-semibold ${
                      t.priority === 'Critical' ? 'text-red-600' :
                      t.priority === 'High' ? 'text-orange-600' : 'text-slate-600'
                    }">${t.priority}</td>
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-1.5">
                        <div class="w-4 h-4 rounded-full ${dev.color} text-white text-[8px] flex items-center justify-center">${dev.initials}</div>
                        <span>${dev.name}</span>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-1.5">
                        <div class="w-4 h-4 rounded-full ${qa.color} text-white text-[8px] flex items-center justify-center">${qa.initials}</div>
                        <span>${qa.name}</span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-slate-500">${t.dueDate || 'No date'}</td>
                    <td class="py-3 px-4 text-right" onclick="event.stopPropagation()">
                      <button onclick="TicketsView.openTicketDetails('${t.id}')" class="px-2 py-1 text-slate-900 hover:bg-slate-100 rounded font-bold cursor-pointer">View</button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  initDragAndDrop() {
    setTimeout(() => {
      const cards = document.querySelectorAll(".kanban-card");
      const columns = document.querySelectorAll(".kanban-cards-area");

      cards.forEach(card => {
        card.addEventListener("dragstart", e => {
          card.classList.add("dragging");
          e.dataTransfer.setData("text/plain", card.dataset.ticketId);
        });
        card.addEventListener("dragend", () => {
          card.classList.remove("dragging");
        });
      });

      columns.forEach(col => {
        col.addEventListener("dragover", e => {
          e.preventDefault();
          col.closest(".kanban-col").classList.add("drag-over");
        });
        col.addEventListener("dragleave", () => {
          col.closest(".kanban-col").classList.remove("drag-over");
        });
        col.addEventListener("drop", e => {
          e.preventDefault();
          col.closest(".kanban-col").classList.remove("drag-over");
          const ticketId = e.dataTransfer.getData("text/plain");
          const newStatus = col.dataset.status;
          if (ticketId && newStatus) {
            store.updateTicketStatus(ticketId, newStatus);
            window.app.toast("Status Updated", `Ticket moved to "${newStatus}".`, "info");
            TicketsView.render(document.getElementById("mainContent"));
          }
        });
      });
    }, 100);
  },

  openTicketDetails(ticketId) {
    const ticket = store.getTicketById(ticketId);
    if (!ticket) return;

    const project = store.getActiveProject();
    const users = store.getUsers();
    const activeUser = store.getActiveUser();
    const dev = store.getUserById(ticket.assigneeId);
    const qa = store.getUserById(ticket.qaAssigneeId);

    let modalContainer = document.getElementById("ticketModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "ticketModalContainer";
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-fade-in overflow-hidden">
          <!-- Modal Header -->
          <div class="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-0.5 text-xs font-bold rounded bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] uppercase">${ticket.type}</span>
              <span class="font-mono font-bold text-slate-800 text-sm">${ticket.key}</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${
                ticket.status === 'Ready for QA' ? 'bg-purple-100 text-purple-800' :
                ticket.status === 'In Development' ? 'bg-amber-100 text-amber-800' :
                ticket.status === 'QA Testing' ? 'bg-pink-100 text-pink-800' :
                ticket.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }">● ${ticket.status}</span>
            </div>
            <button onclick="document.getElementById('ticketModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            <!-- Title -->
            <div>
              <h2 class="text-xl font-semibold text-slate-900">${ticket.title}</h2>
              <p class="text-slate-600 mt-2 leading-relaxed text-sm">${ticket.description || 'No additional description provided.'}</p>
            </div>

            <!-- Quick Workflow Buttons Bar -->
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-700">Change Status:</span>
                <select onchange="TicketsView.changeStatusFromModal('${ticket.id}', this.value)" class="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                  <option value="Backlog" ${ticket.status === 'Backlog' ? 'selected' : ''}>Backlog</option>
                  <option value="To Do" ${ticket.status === 'To Do' ? 'selected' : ''}>To Do</option>
                  <option value="In Development" ${ticket.status === 'In Development' ? 'selected' : ''}>In Development</option>
                  <option value="Ready for QA" ${ticket.status === 'Ready for QA' ? 'selected' : ''}>Ready for QA</option>
                  <option value="QA Testing" ${ticket.status === 'QA Testing' ? 'selected' : ''}>QA Testing</option>
                  <option value="Done" ${ticket.status === 'Done' ? 'selected' : ''}>Done</option>
                </select>
              </div>

              <div class="flex items-center gap-2">
                ${ticket.status !== 'Ready for QA' ? `
                  <button onclick="TicketsView.openHandoverModal('${ticket.id}')" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5 transition">
                    <i data-lucide="send" class="w-3.5 h-3.5"></i> Mark Ready for QA
                  </button>
                ` : `
                  <button onclick="document.getElementById('ticketModalContainer').innerHTML=''; window.app.navigate('qa-workspace')" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5 transition">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> View in QA Queue →
                  </button>
                `}
              </div>
            </div>

            <!-- Meta Attributes Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Assigned Developer</span>
                <div class="mt-1 flex items-center gap-1.5 font-bold text-slate-800">
                  <div class="w-4 h-4 rounded-full ${dev.color} text-white text-[8px] flex items-center justify-center">${dev.initials}</div>
                  <span>${dev.name}</span>
                </div>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">QA Engineer</span>
                <div class="mt-1 flex items-center gap-1.5 font-bold text-slate-800">
                  <div class="w-4 h-4 rounded-full ${qa.color} text-white text-[8px] flex items-center justify-center">${qa.initials}</div>
                  <span>${qa.name}</span>
                </div>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Priority</span>
                <span class="mt-1 inline-block font-bold ${
                  ticket.priority === 'Critical' ? 'text-red-600' :
                  ticket.priority === 'High' ? 'text-orange-600' : 'text-slate-700'
                }">${ticket.priority}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Sprint / Due</span>
                <span class="mt-1 inline-block font-semibold text-slate-800">${ticket.sprint} (${ticket.dueDate || 'No due date'})</span>
              </div>
            </div>

            <!-- Developer Handover Notes (if Ready for QA) -->
            ${ticket.devHandoverNotes ? `
              <div class="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <div class="flex items-center justify-between text-purple-900 font-bold">
                  <span class="flex items-center gap-1.5"><i data-lucide="file-code" class="w-4 h-4 text-purple-600"></i> Developer Handover Notes</span>
                  <span class="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full">${ticket.devHandoverNotes.buildVersion}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
                  <div><strong>Target Env:</strong> ${ticket.devHandoverNotes.environment}</div>
                  <div><strong>Branch / PR:</strong> <a href="#" class="text-slate-900 font-bold hover:underline">${ticket.devHandoverNotes.branch}</a></div>
                </div>
                <p class="text-xs text-purple-950 bg-white p-2.5 rounded border border-purple-100 italic">
                  "${ticket.devHandoverNotes.notes}"
                </p>
              </div>
            ` : ''}

            <!-- Acceptance Criteria Checklist -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-bold text-slate-900 flex items-center gap-2">
                  <i data-lucide="check-square" class="w-4 h-4 text-emerald-600"></i> Acceptance Criteria
                </h3>
                <span class="text-[11px] text-slate-500">
                  ${ticket.acceptanceCriteria ? ticket.acceptanceCriteria.filter(a => a.done).length : 0} of ${ticket.acceptanceCriteria ? ticket.acceptanceCriteria.length : 0} verified
                </span>
              </div>
              <div class="space-y-2">
                ${(ticket.acceptanceCriteria && ticket.acceptanceCriteria.length > 0) ? ticket.acceptanceCriteria.map(ac => `
                  <label class="flex items-start gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 cursor-pointer transition">
                    <input type="checkbox" ${ac.done ? 'checked' : ''} onchange="TicketsView.toggleAC('${ticket.id}', '${ac.id}')" class="mt-0.5 rounded border-slate-300 accent-[#84cc16] focus:ring-[#bef264]" />
                    <span class="text-xs ${ac.done ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'}">${ac.text}</span>
                  </label>
                `).join("") : `<p class="text-xs text-slate-400 italic">No acceptance criteria added yet.</p>`}
              </div>
            </div>

            <!-- Comments & Discussion Thread -->
            <div>
              <h3 class="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <i data-lucide="message-circle" class="w-4 h-4 text-slate-900"></i> Comments & Discussion (${ticket.comments ? ticket.comments.length : 0})
              </h3>
              <div class="space-y-3 max-h-48 overflow-y-auto mb-3">
                ${(ticket.comments && ticket.comments.length > 0) ? ticket.comments.map(c => {
                  const author = store.getUserById(c.authorId);
                  return `
                    <div class="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div class="w-6 h-6 rounded-full ${author.color} text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">${author.initials}</div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-slate-800">${author.name}</span>
                          <span class="text-[10px] text-slate-400">${c.timestamp}</span>
                        </div>
                        <p class="text-xs text-slate-700 mt-1">${c.text}</p>
                      </div>
                    </div>
                  `;
                }).join("") : `<p class="text-xs text-slate-400 italic">No comments yet. Start the discussion below.</p>`}
              </div>

              <!-- Comment Input Form -->
              <div class="flex gap-2">
                <input type="text" id="ticketCommentInput" placeholder="Add a comment or QA test observation..." class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
                <button onclick="TicketsView.submitComment('${ticket.id}')" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow-xs shadow-[#bef264]/25">
                  Reply
                </button>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span class="text-[11px] text-slate-400">Created by ${store.getUserName(ticket.reporterId)}</span>
            <button onclick="document.getElementById('ticketModalContainer').innerHTML=''" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  changeStatusFromModal(ticketId, newStatus) {
    store.updateTicketStatus(ticketId, newStatus);
    window.app.toast("Status Changed", `Ticket updated to ${newStatus}`, "info");
    this.openTicketDetails(ticketId);
    this.render(document.getElementById("mainContent"));
  },

  toggleAC(ticketId, acId) {
    store.toggleTicketAcceptanceCriteria(ticketId, acId);
    this.openTicketDetails(ticketId);
  },

  submitComment(ticketId) {
    const input = document.getElementById("ticketCommentInput");
    if (!input || !input.value.trim()) return;
    store.addTicketComment(ticketId, input.value.trim());
    this.openTicketDetails(ticketId);
  },

  openHandoverModal(ticketId) {
    const ticket = store.getTicketById(ticketId);
    if (!ticket) return;

    let modalContainer = document.getElementById("ticketModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "ticketModalContainer";
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="send" class="w-5 h-5 text-purple-600"></i> Mark Ready for QA Handover
            </h3>
            <button onclick="TicketsView.openTicketDetails('${ticket.id}')" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="TicketsView.handleHandoverSubmit(event, '${ticket.id}')" class="mt-4 space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Target Environment *</label>
              <select id="handoverEnv" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500">
                <option value="Staging Environment (https://staging.omnipay.io)">Staging Environment</option>
                <option value="QA Cluster #2 (Integration)">QA Cluster #2 (Integration)</option>
                <option value="Dev Sandbox">Dev Sandbox</option>
                <option value="Production Preview">Production Preview</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Build / Release Version *</label>
              <input type="text" id="handoverBuild" value="v1.4.2-rc${Math.floor(1 + Math.random()*9)}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Git Branch / Pull Request</label>
              <input type="text" id="handoverBranch" value="feature/${ticket.key.toLowerCase()}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Developer Testing Notes & Handover Instructions</label>
              <textarea id="handoverNotes" rows="3" placeholder="Explain test scenarios covered, mock credentials, database seed notes..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500">Feature code completed and unit tests passing. Ready for QA test suites.</textarea>
            </div>

            <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="button" onclick="TicketsView.openTicketDetails('${ticket.id}')" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm">
                Submit to QA Queue
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  handleHandoverSubmit(e, ticketId) {
    e.preventDefault();
    const env = document.getElementById("handoverEnv").value;
    const build = document.getElementById("handoverBuild").value;
    const branch = document.getElementById("handoverBranch").value;
    const notes = document.getElementById("handoverNotes").value;

    store.markTicketReadyForQA(ticketId, {
      environment: env,
      buildVersion: build,
      branch: branch,
      notes: notes
    });

    window.app.toast("Handover Complete", `Ticket dispatched to QA Queue on ${build}!`, "success");
    document.getElementById("ticketModalContainer").innerHTML = "";
    this.render(document.getElementById("mainContent"));
  },

  openCreateTicketModal() {
    const project = store.getActiveProject();
    const users = store.getUsers();
    let modalContainer = document.getElementById("ticketModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "ticketModalContainer";
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="plus-circle" class="w-5 h-5 text-slate-900"></i> Create Work Ticket (${project.key})
            </h3>
            <button onclick="document.getElementById('ticketModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="TicketsView.handleCreateTicketSubmit(event)" class="mt-4 space-y-4 text-xs">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Issue Type *</label>
                <select id="newTicketType" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                  <option value="Story" selected>Story</option>
                  <option value="Epic">Epic</option>
                  <option value="Task">Task</option>
                  <option value="Subtask">Sub-task</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Priority</label>
                <select id="newTicketPriority" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                  <option value="Critical">Critical</option>
                  <option value="High" selected>High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Initial Status</label>
                <select id="newTicketStatus" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                  <option value="Backlog">Backlog</option>
                  <option value="To Do" selected>To Do</option>
                  <option value="In Development">In Development</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Summary / Title *</label>
              <input type="text" id="newTicketTitle" required placeholder="e.g. Implement OAuth2 Refresh Token Rotation" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Description</label>
              <textarea id="newTicketDesc" rows="3" placeholder="Provide background, user story rationale, technical context..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Developer Assignee</label>
                <select id="newTicketDev" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                  ${users.map(u => `<option value="${u.id}" ${u.role === 'Developer' ? 'selected' : ''}>${u.name} (${u.role})</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">QA Lead</label>
                <select id="newTicketQA" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                  ${users.map(u => `<option value="${u.id}" ${u.role === 'QA Engineer' ? 'selected' : ''}>${u.name} (${u.role})</option>`).join("")}
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Acceptance Criteria (1 per line)</label>
              <textarea id="newTicketAC" rows="2" placeholder="e.g. Token rotation succeeds\nOld refresh token is invalidated immediately\nAudit log entry recorded" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]"></textarea>
            </div>

            <div class="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="button" onclick="document.getElementById('ticketModalContainer').innerHTML=''" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" class="px-5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl shadow-xs shadow-[#bef264]/25 transition cursor-pointer">
                Create Ticket
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  handleCreateTicketSubmit(e) {
    e.preventDefault();
    const type = document.getElementById("newTicketType").value;
    const priority = document.getElementById("newTicketPriority").value;
    const status = document.getElementById("newTicketStatus").value;
    const title = document.getElementById("newTicketTitle").value.trim();
    const description = document.getElementById("newTicketDesc").value.trim();
    const assigneeId = document.getElementById("newTicketDev").value;
    const qaAssigneeId = document.getElementById("newTicketQA").value;
    const acText = document.getElementById("newTicketAC").value.trim();

    const acList = acText ? acText.split("\n").map(s => s.trim()).filter(Boolean) : [];

    const ticket = store.createTicket({
      type, priority, status, title, description, assigneeId, qaAssigneeId,
      acceptanceCriteria: acList
    });

    window.app.toast("Ticket Created", `Created ${ticket.key}: ${ticket.title}`, "success");
    document.getElementById("ticketModalContainer").innerHTML = "";
    this.render(document.getElementById("mainContent"));
  }
};

window.TicketsView = TicketsView;
