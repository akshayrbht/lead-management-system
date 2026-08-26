import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("leadToken") || ""
  );

  const [page, setPage] = useState("dashboard");
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [selectedLead, setSelectedLead] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  const [loginData, setLoginData] = useState({
    username: "admin",
    password: "Admin@123",
  });

  const [leadForm, setLeadForm] = useState({
    leadName: "",
    companyName: "",
    mobile: "",
    email: "",
    service: "Web Development",
    source: "Website",
    estimatedValue: "",
    assignedTo: "",
    remarks: "",
    status: "New",
  });

  const [followUpForm, setFollowUpForm] = useState({
    date: "",
    followUpType: "Phone Call",
    remarks: "",
    nextFollowUpDate: "",
  });

  // ---------------- LOGIN ----------------

  const login = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("leadToken", data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("leadToken");
    setToken("");
    setLeads([]);
    setStats(null);
  };

  // ---------------- API HELPER ----------------

  const apiRequest = async (url, options = {}) => {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  };

  // ---------------- GET LEADS ----------------

  const fetchLeads = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (service) params.append("service", service);
      if (assignedTo) params.append("assignedTo", assignedTo);

      params.append("sortBy", "createdAt");
      params.append("order", "desc");

      const data = await apiRequest(`/leads?${params.toString()}`);

      setLeads(data.leads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DASHBOARD ----------------

  const fetchStats = async () => {
    if (!token) return;

    try {
      const data = await apiRequest("/dashboard/stats");
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLeads();
      fetchStats();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const timer = setTimeout(() => {
      fetchLeads();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, status, service, assignedTo]);

  // ---------------- LEAD FORM ----------------

  const resetLeadForm = () => {
    setLeadForm({
      leadName: "",
      companyName: "",
      mobile: "",
      email: "",
      service: "Web Development",
      source: "Website",
      estimatedValue: "",
      assignedTo: "",
      remarks: "",
      status: "New",
    });
  };

  const openAddLead = () => {
    resetLeadForm();
    setEditingLead(null);
    setShowLeadForm(true);
  };

  const openEditLead = (lead) => {
    setEditingLead(lead);

    setLeadForm({
      leadName: lead.leadName || "",
      companyName: lead.companyName || "",
      mobile: lead.mobile || "",
      email: lead.email || "",
      service: lead.service || "Web Development",
      source: lead.source || "Website",
      estimatedValue: lead.estimatedValue || "",
      assignedTo: lead.assignedTo || "",
      remarks: lead.remarks || "",
      status: lead.status || "New",
    });

    setShowLeadForm(true);
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const body = {
        ...leadForm,
        estimatedValue: Number(leadForm.estimatedValue) || 0,
      };

      if (editingLead) {
        await apiRequest(`/leads/${editingLead._id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await apiRequest("/leads", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      setShowLeadForm(false);
      resetLeadForm();

      await fetchLeads();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DELETE ----------------

  const deleteLead = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/leads/${id}`, {
        method: "DELETE",
      });

      await fetchLeads();
      await fetchStats();

      if (selectedLead?._id === id) {
        setSelectedLead(null);
        setShowDetails(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------------- FOLLOW UPS ----------------

  const openDetails = async (lead) => {
    setSelectedLead(lead);
    setShowDetails(true);
    setFollowUps([]);

    try {
      const data = await apiRequest(`/followups/${lead._id}`);
      setFollowUps(data.followUps || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const addFollowUp = async (e) => {
    e.preventDefault();

    if (!selectedLead) return;

    try {
      await apiRequest(`/followups/${selectedLead._id}`, {
        method: "POST",
        body: JSON.stringify(followUpForm),
      });

      const data = await apiRequest(
        `/followups/${selectedLead._id}`
      );

      setFollowUps(data.followUps || []);

      setFollowUpForm({
        date: "",
        followUpType: "Phone Call",
        remarks: "",
        nextFollowUpDate: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------------- LOGIN SCREEN ----------------

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-icon">L</div>

          <h1>LeadFlow</h1>
          <p className="login-subtitle">
            Lead Management System
          </p>

          <form onSubmit={login}>
            <label>Username</label>
            <input
              type="text"
              value={loginData.username}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  username: e.target.value,
                })
              }
            />

            <label>Password</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  password: e.target.value,
                })
              }
            />

            {error && <div className="error-box">{error}</div>}

            <button className="primary-btn full-width">
              Login
            </button>
          </form>

          <p className="demo-login">
            Demo: admin / Admin@123
          </p>
        </div>
      </div>
    );
  }

  // ---------------- MAIN APP ----------------

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">L</div>
          <div>
            <strong>LeadFlow</strong>
            <span>Management</span>
          </div>
        </div>

        <nav>
          <button
            className={page === "dashboard" ? "nav-active" : ""}
            onClick={() => setPage("dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className={page === "leads" ? "nav-active" : ""}
            onClick={() => setPage("leads")}
          >
            <span>◉</span>
            Leads
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="logged-user">
            <div className="avatar">A</div>
            <div>
              <strong>Admin</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>
              {page === "dashboard"
                ? "Dashboard"
                : "Lead Management"}
            </h1>
            <p>
              {page === "dashboard"
                ? "Overview of your sales pipeline"
                : "Manage and track your leads"}
            </p>
          </div>

          <button className="primary-btn" onClick={openAddLead}>
            + Add Lead
          </button>
        </header>

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {page === "dashboard" && (
          <Dashboard
            stats={stats}
            leads={leads}
            onViewLead={openDetails}
          />
        )}

        {page === "leads" && (
          <LeadManagement
            leads={leads}
            loading={loading}
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
            service={service}
            setService={setService}
            assignedTo={assignedTo}
            setAssignedTo={setAssignedTo}
            openAddLead={openAddLead}
            openEditLead={openEditLead}
            openDetails={openDetails}
            deleteLead={deleteLead}
          />
        )}
      </main>

      {showLeadForm && (
        <LeadFormModal
          form={leadForm}
          setForm={setLeadForm}
          editingLead={editingLead}
          onSubmit={handleLeadSubmit}
          onClose={() => setShowLeadForm(false)}
        />
      )}

      {showDetails && selectedLead && (
        <DetailsModal
          lead={selectedLead}
          followUps={followUps}
          followUpForm={followUpForm}
          setFollowUpForm={setFollowUpForm}
          onAddFollowUp={addFollowUp}
          onClose={() => setShowDetails(false)}
          onEdit={() => {
            setShowDetails(false);
            openEditLead(selectedLead);
          }}
        />
      )}
    </div>
  );
}

// ---------------- DASHBOARD COMPONENT ----------------

function Dashboard({ stats, leads, onViewLead }) {
  if (!stats) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <section className="stats-grid">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon="◉"
        />

        <StatCard
          title="New Leads"
          value={stats.newLeads}
          icon="✦"
        />

        <StatCard
          title="Contacted"
          value={stats.contactedLeads}
          icon="☎"
        />

        <StatCard
          title="Proposal Sent"
          value={stats.proposalSentLeads}
          icon="▤"
        />

        <StatCard
          title="Won"
          value={stats.wonLeads}
          icon="✓"
        />

        <StatCard
          title="Lost"
          value={stats.lostLeads}
          icon="×"
        />
      </section>

      <section className="value-grid">
        <div className="value-card">
          <span>Potential Business Value</span>
          <strong>
            ₹{Number(stats.potentialBusinessValue || 0).toLocaleString()}
          </strong>
        </div>

        <div className="value-card">
          <span>Won Business Value</span>
          <strong>
            ₹{Number(stats.wonBusinessValue || 0).toLocaleString()}
          </strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Recent Leads</h2>
            <p>Your latest opportunities</p>
          </div>
        </div>

        <div className="recent-list">
          {leads.slice(0, 5).map((lead) => (
            <div className="recent-item" key={lead._id}>
              <div>
                <strong>{lead.leadName}</strong>
                <span>{lead.companyName}</span>
              </div>

              <div className="recent-right">
                <StatusBadge status={lead.status} />
                <button
                  className="text-btn"
                  onClick={() => onViewLead(lead)}
                >
                  View
                </button>
              </div>
            </div>
          ))}

          {leads.length === 0 && (
            <div className="empty-state">
              No leads available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

// ---------------- LEAD MANAGEMENT ----------------

function LeadManagement({
  leads,
  loading,
  search,
  setSearch,
  status,
  setStatus,
  service,
  setService,
  assignedTo,
  setAssignedTo,
  openAddLead,
  openEditLead,
  openDetails,
  deleteLead,
}) {
  return (
    <div>
      <section className="filter-panel">
        <div className="search-box">
          <span>⌕</span>
          <input
            placeholder="Search leads, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Proposal Sent">Proposal Sent</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Won">Won</option>
          <option value="Lost">Lost</option>
        </select>

        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
        >
          <option value="">All Services</option>
          <option value="Web Development">Web Development</option>
          <option value="Mobile Application">
            Mobile Application
          </option>
          <option value="SEO">SEO</option>
          <option value="Digital Marketing">
            Digital Marketing
          </option>
          <option value="Other">Other</option>
        </select>

        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        >
          <option value="">All Assignees</option>
          <option value="Akshay">Akshay</option>
          <option value="Rahul">Rahul</option>
        </select>

        <button
          className="clear-btn"
          onClick={() => {
            setSearch("");
            setStatus("");
            setService("");
            setAssignedTo("");
          }}
        >
          Clear
        </button>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>All Leads</h2>
            <p>{leads.length} leads found</p>
          </div>

          <button className="primary-btn" onClick={openAddLead}>
            + Add Lead
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            No leads found.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Company</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id}>
                    <td>
                      <div className="lead-name">
                        <div className="small-avatar">
                          {lead.leadName?.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <strong>{lead.leadName}</strong>
                          <span>{lead.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>{lead.companyName}</td>

                    <td>{lead.service}</td>

                    <td>
                      <StatusBadge status={lead.status} />
                    </td>

                    <td>
                      ₹{Number(lead.estimatedValue || 0).toLocaleString()}
                    </td>

                    <td>{lead.assignedTo || "-"}</td>

                    <td>
                      <div className="actions">
                        <button
                          className="action-btn"
                          onClick={() => openDetails(lead)}
                        >
                          View
                        </button>

                        <button
                          className="action-btn"
                          onClick={() => openEditLead(lead)}
                        >
                          Edit
                        </button>

                        <button
                          className="action-btn danger"
                          onClick={() => deleteLead(lead._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------- STATUS ----------------

function StatusBadge({ status }) {
  return (
    <span
      className={`status-badge status-${status
        ?.toLowerCase()
        .replaceAll(" ", "-")}`}
    >
      {status}
    </span>
  );
}

// ---------------- LEAD FORM ----------------

function LeadFormModal({
  form,
  setForm,
  editingLead,
  onSubmit,
  onClose,
}) {
  const update = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal large-modal">
        <div className="modal-header">
          <div>
            <h2>
              {editingLead ? "Edit Lead" : "Add New Lead"}
            </h2>
            <p>
              {editingLead
                ? "Update lead information"
                : "Enter the lead details"}
            </p>
          </div>

          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-grid">
            <div>
              <label>Lead Name *</label>
              <input
                required
                value={form.leadName}
                onChange={(e) =>
                  update("leadName", e.target.value)
                }
              />
            </div>

            <div>
              <label>Company Name *</label>
              <input
                required
                value={form.companyName}
                onChange={(e) =>
                  update("companyName", e.target.value)
                }
              />
            </div>

            <div>
              <label>Mobile *</label>
              <input
                required
                value={form.mobile}
                onChange={(e) =>
                  update("mobile", e.target.value)
                }
              />
            </div>

            <div>
              <label>Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) =>
                  update("email", e.target.value)
                }
              />
            </div>

            <div>
              <label>Service *</label>
              <select
                value={form.service}
                onChange={(e) =>
                  update("service", e.target.value)
                }
              >
                <option>Web Development</option>
                <option>Mobile Application</option>
                <option>SEO</option>
                <option>Digital Marketing</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label>Source *</label>
              <select
                value={form.source}
                onChange={(e) =>
                  update("source", e.target.value)
                }
              >
                <option>Website</option>
                <option>Referral</option>
                <option>LinkedIn</option>
                <option>Google</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label>Estimated Value *</label>
              <input
                required
                type="number"
                min="0"
                value={form.estimatedValue}
                onChange={(e) =>
                  update("estimatedValue", e.target.value)
                }
              />
            </div>

            <div>
              <label>Assigned To *</label>
              <input
                required
                value={form.assignedTo}
                onChange={(e) =>
                  update("assignedTo", e.target.value)
                }
              />
            </div>

            <div>
              <label>Status *</label>
              <select
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value)
                }
              >
                <option>New</option>
                <option>Contacted</option>
                <option>Proposal Sent</option>
                <option>Negotiation</option>
                <option>Won</option>
                <option>Lost</option>
              </select>
            </div>

            <div className="full-field">
              <label>Remarks</label>
              <textarea
                rows="4"
                value={form.remarks}
                onChange={(e) =>
                  update("remarks", e.target.value)
                }
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="primary-btn">
              {editingLead ? "Update Lead" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------- DETAILS + FOLLOW UPS ----------------

function DetailsModal({
  lead,
  followUps,
  followUpForm,
  setFollowUpForm,
  onAddFollowUp,
  onClose,
  onEdit,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal details-modal">
        <div className="modal-header">
          <div>
            <h2>{lead.leadName}</h2>
            <p>{lead.companyName}</p>
          </div>

          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="details-grid">
          <Detail label="Email" value={lead.email} />
          <Detail label="Mobile" value={lead.mobile} />
          <Detail label="Service" value={lead.service} />
          <Detail label="Source" value={lead.source} />
          <Detail
            label="Estimated Value"
            value={`₹${Number(
              lead.estimatedValue || 0
            ).toLocaleString()}`}
          />
          <Detail label="Assigned To" value={lead.assignedTo} />
          <Detail
            label="Status"
            value={<StatusBadge status={lead.status} />}
          />
          <Detail label="Remarks" value={lead.remarks || "-"} />
        </div>

        <div className="followup-section">
          <h3>Follow-up History</h3>

          {followUps.length === 0 ? (
            <div className="empty-state small">
              No follow-ups yet.
            </div>
          ) : (
            <div className="timeline">
              {followUps.map((followUp) => (
                <div
                  className="timeline-item"
                  key={followUp._id}
                >
                  <div className="timeline-dot"></div>

                  <div>
                    <strong>
                      {followUp.followUpType}
                    </strong>

                    <span>
                      {new Date(
                        followUp.date
                      ).toLocaleDateString()}
                    </span>

                    <p>{followUp.remarks}</p>

                    {followUp.nextFollowUpDate && (
                      <small>
                        Next follow-up:{" "}
                        {new Date(
                          followUp.nextFollowUpDate
                        ).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="followup-section">
          <h3>Add Follow-up</h3>

          <form onSubmit={onAddFollowUp}>
            <div className="form-grid">
              <div>
                <label>Date *</label>
                <input
                  required
                  type="date"
                  value={followUpForm.date}
                  onChange={(e) =>
                    setFollowUpForm({
                      ...followUpForm,
                      date: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Follow-up Type *</label>
                <select
                  value={followUpForm.followUpType}
                  onChange={(e) =>
                    setFollowUpForm({
                      ...followUpForm,
                      followUpType: e.target.value,
                    })
                  }
                >
                  <option>Phone Call</option>
                  <option>Email</option>
                  <option>Meeting</option>
                  <option>WhatsApp</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="full-field">
                <label>Remarks *</label>
                <textarea
                  required
                  rows="3"
                  value={followUpForm.remarks}
                  onChange={(e) =>
                    setFollowUpForm({
                      ...followUpForm,
                      remarks: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Next Follow-up Date</label>
                <input
                  type="date"
                  value={followUpForm.nextFollowUpDate}
                  onChange={(e) =>
                    setFollowUpForm({
                      ...followUpForm,
                      nextFollowUpDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <button className="primary-btn">
              Add Follow-up
            </button>
          </form>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            Close
          </button>

          <button className="primary-btn" onClick={onEdit}>
            Edit Lead
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;