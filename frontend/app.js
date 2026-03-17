const API = (() => {
    if (window.location.protocol.startsWith("http")) {
        return `${window.location.origin}/api`;
    }
    return "http://127.0.0.1:8000/api";
})();

const STATUS_LABELS = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed"
};

const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const categoryInput = document.getElementById("category");
const priorityInput = document.getElementById("priority");
const filterCategoryInput = document.getElementById("filterCategory");
const filterPriorityInput = document.getElementById("filterPriority");
const filterStatusInput = document.getElementById("filterStatus");
const searchInput = document.getElementById("search");
const submitButton = document.getElementById("submitButton");
const classificationHint = document.getElementById("classificationHint");
const classificationState = document.getElementById("classificationState");
const ticketsContainer = document.getElementById("tickets");
const statsContainer = document.getElementById("stats");
const ticketCount = document.getElementById("ticketCount");
const heroTotalTickets = document.getElementById("heroTotalTickets");
const heroOpenTickets = document.getElementById("heroOpenTickets");
const toast = document.getElementById("toast");

let classifyTimeoutId = null;
let toastTimeoutId = null;

function formatLabel(value) {
    return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = `toast toast-visible${isError ? " toast-error" : ""}`;

    window.clearTimeout(toastTimeoutId);
    toastTimeoutId = window.setTimeout(() => {
        toast.className = "toast";
    }, 2800);
}

function setClassifierState(label, hintText) {
    classificationState.textContent = label;
    classificationHint.textContent = hintText;
}

async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    if (!response.ok) {
        let message = "Request failed";
        try {
            const data = await response.json();
            message = JSON.stringify(data);
        } catch (error) {
            message = response.statusText || message;
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function classifyTicket() {
    const description = descriptionInput.value.trim();

    if (!description) {
        setClassifierState("Classifier idle", "Add a description and pause for a moment to get AI suggestions.");
        return;
    }

    setClassifierState("Classifying", "Reviewing the issue details to suggest category and priority.");

    try {
        const data = await request("/tickets/classify/", {
            method: "POST",
            body: JSON.stringify({ description })
        });

        if (data.suggested_category) {
            categoryInput.value = data.suggested_category;
        }

        if (data.suggested_priority) {
            priorityInput.value = data.suggested_priority;
        }

        if (data.suggested_category || data.suggested_priority) {
            setClassifierState(
                "Suggestions ready",
                `Suggested ${formatLabel(categoryInput.value)} and ${formatLabel(priorityInput.value)} priority.`
            );
            return;
        }

        setClassifierState("No suggestion", "The classifier could not infer a category or priority from this description.");
    } catch (error) {
        setClassifierState("Classifier unavailable", "Ticket creation still works even if the AI suggestion service is unavailable.");
    }
}

async function submitTicket() {
    const payload = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        category: categoryInput.value,
        priority: priorityInput.value
    };

    if (!payload.title || !payload.description) {
        showToast("Title and description are required.", true);
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
        await request("/tickets/", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        titleInput.value = "";
        descriptionInput.value = "";
        categoryInput.value = "billing";
        priorityInput.value = "low";
        setClassifierState("Classifier idle", "Add a description and pause for a moment to get AI suggestions.");
        showToast("Ticket submitted.");

        await Promise.all([loadTickets(), loadStats()]);
    } catch (error) {
        showToast(`Unable to submit ticket: ${error.message}`, true);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Ticket";
    }
}

function buildBreakdownMarkup(items) {
    if (!items.length) {
        return '<p class="breakdown-empty">No data yet</p>';
    }

    return items
        .map(
            (item) => `
                <div class="breakdown-row">
                    <span>${formatLabel(item.label || item.priority || item.category)}</span>
                    <strong>${item.count}</strong>
                </div>
            `
        )
        .join("");
}

function renderTickets(tickets) {
    ticketCount.textContent = `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`;

    if (!tickets.length) {
        ticketsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No tickets match the current filters.</h3>
                <p>Change the search or filters to widen the queue.</p>
            </div>
        `;
        return;
    }

    ticketsContainer.innerHTML = tickets
        .map(
            (ticket) => `
                <article class="ticket-card">
                    <div class="ticket-topline">
                        <div>
                            <h3>${ticket.title}</h3>
                            <p class="ticket-description">${ticket.description}</p>
                        </div>
                        <span class="status-badge status-${ticket.status}">${STATUS_LABELS[ticket.status]}</span>
                    </div>

                    <div class="ticket-meta">
                        <span class="meta-pill">${formatLabel(ticket.category)}</span>
                        <span class="meta-pill">${formatLabel(ticket.priority)} Priority</span>
                        <span class="meta-pill">Created ${new Date(ticket.created_at).toLocaleString()}</span>
                    </div>

                    <div class="ticket-footer">
                        <label class="field inline-field">
                            <span>Status</span>
                            <select data-ticket-id="${ticket.id}" class="status-select">
                                <option value="open" ${ticket.status === "open" ? "selected" : ""}>Open</option>
                                <option value="in_progress" ${ticket.status === "in_progress" ? "selected" : ""}>In Progress</option>
                                <option value="resolved" ${ticket.status === "resolved" ? "selected" : ""}>Resolved</option>
                                <option value="closed" ${ticket.status === "closed" ? "selected" : ""}>Closed</option>
                            </select>
                        </label>
                    </div>
                </article>
            `
        )
        .join("");
}

async function loadTickets() {
    const params = new URLSearchParams();

    if (filterCategoryInput.value) {
        params.set("category", filterCategoryInput.value);
    }
    if (filterPriorityInput.value) {
        params.set("priority", filterPriorityInput.value);
    }
    if (filterStatusInput.value) {
        params.set("status", filterStatusInput.value);
    }
    if (searchInput.value.trim()) {
        params.set("search", searchInput.value.trim());
    }

    const query = params.toString() ? `?${params.toString()}` : "";

    try {
        const tickets = await request(`/tickets/${query}`);
        renderTickets(tickets);
    } catch (error) {
        ticketsContainer.innerHTML = `
            <div class="empty-state">
                <h3>Ticket feed unavailable.</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function updateStatus(id, status) {
    try {
        await request(`/tickets/${id}/`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });

        showToast("Ticket status updated.");
        await Promise.all([loadTickets(), loadStats()]);
    } catch (error) {
        showToast(`Unable to update status: ${error.message}`, true);
    }
}

async function loadStats() {
    try {
        const stats = await request("/tickets/stats/");

        heroTotalTickets.textContent = stats.total_tickets;
        heroOpenTickets.textContent = `${stats.open_tickets} open tickets`;

        statsContainer.innerHTML = `
            <article class="metric-card accent-card">
                <span class="metric-label">Total tickets</span>
                <strong>${stats.total_tickets}</strong>
                <p>Current volume across the support queue.</p>
            </article>
            <article class="metric-card">
                <span class="metric-label">Open tickets</span>
                <strong>${stats.open_tickets}</strong>
                <p>Tickets that still need active handling.</p>
            </article>
            <article class="metric-card">
                <span class="metric-label">Average per day</span>
                <strong>${stats.avg_tickets_per_day}</strong>
                <p>Based on tickets created over the active date range.</p>
            </article>
            <article class="metric-card breakdown-card">
                <span class="metric-label">Priority breakdown</span>
                <div class="breakdown-list">${buildBreakdownMarkup(stats.priority_breakdown)}</div>
            </article>
            <article class="metric-card breakdown-card">
                <span class="metric-label">Category breakdown</span>
                <div class="breakdown-list">${buildBreakdownMarkup(stats.category_breakdown)}</div>
            </article>
        `;
    } catch (error) {
        statsContainer.innerHTML = `
            <article class="metric-card">
                <span class="metric-label">Stats unavailable</span>
                <strong>API error</strong>
                <p>${error.message}</p>
            </article>
        `;
    }
}

descriptionInput.addEventListener("input", () => {
    window.clearTimeout(classifyTimeoutId);
    classifyTimeoutId = window.setTimeout(classifyTicket, 700);
});

submitButton.addEventListener("click", submitTicket);
filterCategoryInput.addEventListener("change", loadTickets);
filterPriorityInput.addEventListener("change", loadTickets);
filterStatusInput.addEventListener("change", loadTickets);
searchInput.addEventListener("input", () => {
    window.clearTimeout(classifyTimeoutId);
    classifyTimeoutId = window.setTimeout(loadTickets, 250);
});

ticketsContainer.addEventListener("change", (event) => {
    if (!event.target.classList.contains("status-select")) {
        return;
    }

    updateStatus(event.target.dataset.ticketId, event.target.value);
});

loadTickets();
loadStats();
