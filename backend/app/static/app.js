// PrivacyLens Interactive Application Logic
const state = {
  currentTab: 'dashboard',
  dashboardData: null,
  dpdpData: null,
  simParams: { column_weight: 0.40, value_weight: 0.45, validator_bonus: 0.15, threshold: 0.50 },
  simData: null,
  datasets: [],
  inventory: [],
  metadata: [],
  gapsReport: null,
  evalHistory: [],
  selectedScanDatasetId: null,
  rulesConfig: null,
  inspectRecord: null,
  reviewRecord: null,
  invActiveChip: 'all',
  reviewActiveChip: 'all'
};

// SVG Icons
const icons = {
  dashboard: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
  datasources: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  scandata: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><polyline points="8 11 10 13 14 9"/></svg>`,
  inventory: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>`,
  purposeretention: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  evidencegaps: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  evaluation: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  reviewcenter: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>`,
  dpdp: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>`,
  simulator: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>`
};

// --- Toast Notifications ---
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- Live Sidebar Pending Count Badge ---
async function updateSidebarPendingBadge() {
  try {
    const res = await fetch('/api/inventory');
    if (!res.ok) return;
    const inv = await res.json();
    state.inventory = inv;
    const pending = inv.filter(r => r.review_status === 'PENDING').length;
    const badge = document.getElementById('nav-pending-badge');
    if (badge) {
      if (pending > 0) {
        badge.textContent = pending;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (e) {
    // silently fail
  }
}

// --- 1-Click Complete Discovery ---
async function runOneClickDiscovery() {
  const btns = [
    document.getElementById('btn-1click-discovery'),
    document.getElementById('btn-sidebar-quickscan')
  ].filter(Boolean);

  btns.forEach(b => {
    b.disabled = true;
    b.innerHTML = `<span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span> Running Discovery...`;
  });

  try {
    const res = await fetch('/api/scans/scan-all', { method: 'POST' });
    if (!res.ok) throw new Error('Scan failed');
    const data = await res.json();
    showToast(`✓ Discovery complete: Found ${data.total_candidates_found} candidates across ${data.scans_completed} data sources.`, 'success');
    await updateSidebarPendingBadge();
    await renderActiveView();
  } catch (err) {
    showToast(`Scan failed: ${err.message}`, 'error');
  } finally {
    btns.forEach(b => {
      b.disabled = false;
      b.innerHTML = `⚡ 1-Click Discovery`;
    });
  }
}

// --- Reset Demo Environment ---
async function resetDemoData() {
  if (!confirm("Reset demo datasets and governance register to fresh initial state?")) return;
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Reset failed');
    showToast('✓ Demo databases and registers reset successfully.', 'success');
    await updateSidebarPendingBadge();
    await renderActiveView();
  } catch (err) {
    showToast(`Reset error: ${err.message}`, 'error');
  }
}

// Badges
function renderClassBadge(cls) {
  const map = {
    person_name: ['badge-name', 'Person Name'],
    email_address: ['badge-email', 'Email Address'],
    phone_number: ['badge-phone', 'Phone Number'],
    government_id: ['badge-govid', 'Gov ID (Aadhaar/PAN)'],
    date_of_birth: ['badge-dob', 'Date of Birth'],
    non_personal: ['badge-rejected', 'Non-Personal']
  };
  const [clsStyle, label] = map[cls] || ['badge-pending', cls];
  return `<span class="badge ${clsStyle}">${label}</span>`;
}

function renderMetaBadge(status) {
  const map = {
    'Complete metadata': ['badge-complete', 'Complete'],
    'Missing purpose': ['badge-missing-p', 'Missing Purpose'],
    'Missing retention': ['badge-missing-r', 'Missing Retention'],
    'Missing both': ['badge-missing-b', 'Missing Both'],
    'Ambiguous metadata match': ['badge-ambiguous', 'Ambiguous Match']
  };
  const [clsStyle, label] = map[status] || ['badge-pending', status];
  return `<span class="badge ${clsStyle}">${label}</span>`;
}

function renderReviewBadge(status) {
  const map = {
    CONFIRMED: ['badge-confirmed', 'Confirmed PII'],
    REJECTED: ['badge-rejected', 'Rejected'],
    PENDING: ['badge-pending', 'Pending Review']
  };
  const [clsStyle, label] = map[status] || ['badge-pending', status];
  return `<span class="badge ${clsStyle}">${label}</span>`;
}

function renderConfidenceBar(score) {
  const pct = Math.round(score * 100);
  const color = pct >= 85 ? '#10b981' : pct >= 70 ? '#488099' : '#f59e0b';
  return `
    <div style="display:flex; align-items:center; gap:8px;">
      <div style="width:54px; background:#e2e8f0; height:6px; border-radius:3px; overflow:hidden; border:1px solid #cbd5e1;">
        <div style="width:${pct}%; height:100%; background:${color};"></div>
      </div>
      <span style="font-size:11px; font-family:'JetBrains Mono',monospace; font-weight:700;">${pct}%</span>
    </div>
  `;
}

// Navigation Handler
function navigateTo(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  renderActiveView();
}

// Main View Dispatcher
async function renderActiveView() {
  const container = document.getElementById('view-container');
  const headerTitle = document.getElementById('header-title');
  const headerSub = document.getElementById('header-sub');

  const titles = {
    dashboard: ['Dashboard Overview', 'Real-time telemetry, 4-step guided discovery, and evidence posture'],
    datasources: ['Data Sources Management', 'Connect CSV files, SQLite databases, and inspect schemas with zero exfiltration'],
    scandata: ['Personal-Data Scanner', 'Execute multi-signal discovery across column patterns, formats, and sampled values'],
    inventory: ['Privacy Evidence Inventory', 'Searchable master catalog linking detected personal data to declared purposes'],
    purposeretention: ['Purpose & Retention Register', 'Declared business processing notices and statutory retention schedules'],
    evidencegaps: ['Technical Evidence Gaps', 'Identified compliance gaps: missing purposes, indefinite retention, and unreviewed PII'],
    evaluation: ['Evaluation & Benchmark Metrics', 'Transparent precision, recall, and F1 calculations from labelled synthetic test set'],
    reviewcenter: ['Human Review & Triage Center', 'Human-in-the-loop decision center with 1-click batch confirmation and rejection'],
    settings: ['Configurable Rules & Settings', 'Inspect and customize YAML regex patterns and scoring weights'],
    dpdp: ['DPDP Act 2023 Statutory Compliance Matrix', 'Regulatory readiness, Dihedral Verhoeff Aadhaar verification, and cryptographic audit seal'],
    simulator: ['What-If Sensitivity Simulation Studio', 'Live parameter optimization against labelled benchmark dataset']
  };

  headerTitle.textContent = titles[state.currentTab][0];
  headerSub.textContent = titles[state.currentTab][1];
  container.innerHTML = `<div style="padding:40px; text-align:center; color:#64748b;">Loading ${titles[state.currentTab][0]}...</div>`;

  try {
    if (state.currentTab === 'dashboard') await renderDashboard(container);
    else if (state.currentTab === 'datasources') await renderDataSources(container);
    else if (state.currentTab === 'scandata') await renderScan(container);
    else if (state.currentTab === 'inventory') await renderInventory(container);
    else if (state.currentTab === 'purposeretention') await renderMetadata(container);
    else if (state.currentTab === 'evidencegaps') await renderGaps(container);
    else if (state.currentTab === 'evaluation') await renderEvaluation(container);
    else if (state.currentTab === 'reviewcenter') await renderReviewCenter(container);
    else if (state.currentTab === 'settings') await renderSettings(container);
    else if (state.currentTab === 'dpdp') await renderDPDP(container);
    else if (state.currentTab === 'simulator') await renderSimulator(container);
    updateSidebarPendingBadge();
  } catch (err) {
    container.innerHTML = `<div class="card" style="border-color:#fecaca; background:#fef2f2; color:#991b1b; padding:20px;">
      <strong>Error loading view:</strong> ${err.message}
    </div>`;
  }
}

// 1. Dashboard View
async function renderDashboard(container) {
  const res = await fetch('/api/dashboard');
  const data = await res.json();
  state.dashboardData = data;

  const invRes = await fetch('/api/inventory');
  const inv = await invRes.json();
  state.inventory = inv;
  const pendingCount = inv.filter(r => r.review_status === 'PENDING').length;

  const classColors = {
    person_name: '#264759',
    email_address: '#488099',
    phone_number: '#10b981',
    government_id: '#315267',
    date_of_birth: '#f59e0b'
  };

  const classLabels = {
    person_name: 'Person Name',
    email_address: 'Email Address',
    phone_number: 'Phone Number',
    government_id: 'Gov ID',
    date_of_birth: 'Date of Birth'
  };

  const maxVal = Math.max(...Object.values(data.class_counts), 1);

  container.innerHTML = `
    <!-- Guided 4-Step Discovery Pipeline Card -->
    <div class="guided-pipeline-card">
      <div class="pipeline-header">
        <div>
          <div class="pipeline-badge">⚡ GUIDED 4-STEP DISCOVERY & AUDIT PIPELINE</div>
          <h3 class="pipeline-title">Simple End-to-End Privacy Discovery Workflow</h3>
          <p class="pipeline-desc">Follow these 4 simple steps to connect data, run multi-signal discovery, verify evidence, and generate your statutory DPDP Act dossier.</p>
        </div>
        <div class="pipeline-actions">
          <button onclick="runOneClickDiscovery()" id="btn-1click-discovery" class="btn btn-primary" style="padding:10px 18px; font-weight:700;">
            ⚡ 1-Click Discovery
          </button>
          <button onclick="resetDemoData()" class="btn btn-secondary" style="font-size:11px; padding:8px 12px;" title="Reset demo databases and registers">
            ↻ Reset Demo
          </button>
        </div>
      </div>

      <div class="pipeline-steps-grid">
        <div class="pipeline-step-box" onclick="navigateTo('datasources')">
          <div class="step-num">1</div>
          <div class="step-info">
            <div class="step-title">Connect Data Sources</div>
            <div class="step-sub">CSVs & SQLite schemas</div>
            <span class="step-pill step-pill-done">✓ ${data.total_datasets} Sources Connected</span>
          </div>
        </div>

        <div class="pipeline-step-box" onclick="navigateTo('scandata')">
          <div class="step-num">2</div>
          <div class="step-info">
            <div class="step-title">Multi-Signal Scan</div>
            <div class="step-sub">Column, format, value regex</div>
            <span class="step-pill step-pill-active">${data.total_candidates} Fields Detected</span>
          </div>
        </div>

        <div class="pipeline-step-box" onclick="navigateTo('reviewcenter')">
          <div class="step-num">3</div>
          <div class="step-info">
            <div class="step-title">Human Triage</div>
            <div class="step-sub">Confirm / reject candidate PII</div>
            <span class="step-pill ${pendingCount > 0 ? 'step-pill-warn' : 'step-pill-done'}">${pendingCount > 0 ? pendingCount + ' Pending Review' : '✓ All Reviewed'}</span>
          </div>
        </div>

        <div class="pipeline-step-box" onclick="navigateTo('dpdp')">
          <div class="step-num">4</div>
          <div class="step-info">
            <div class="step-title">DPDP Act Compliance</div>
            <div class="step-sub">Tamper-evident SHA-256 seal</div>
            <span class="step-pill step-pill-primary">Download PDF Dossier</span>
          </div>
        </div>
      </div>
    </div>

    <!-- KPIs Grid with Plain-English Explanations -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Datasets</div>
        <div class="kpi-val">${data.total_datasets}</div>
        <div class="kpi-sub">Connected data repositories</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Tables Inspected</div>
        <div class="kpi-val">${data.total_tables}</div>
        <div class="kpi-sub">Inspected schema tables</div>
      </div>
      <div class="kpi-card" style="background:#f0f9ff; border-color:#bcdbe7;">
        <div class="kpi-label" style="color:#36657c;">Candidate PII</div>
        <div class="kpi-val" style="color:#488099;">${data.total_candidates}</div>
        <div class="kpi-sub" style="color:#36657c;">Discovered personal fields</div>
      </div>
      <div class="kpi-card" style="background:#fffbeb; border-color:#fde68a;">
        <div class="kpi-label" style="color:#b45309;">Missing Purpose</div>
        <div class="kpi-val" style="color:#b45309;">${data.missing_purpose}</div>
        <div class="kpi-sub" style="color:#b45309;">Lacks Section 5 notice</div>
      </div>
      <div class="kpi-card" style="background:#fff7ed; border-color:#fed7aa;">
        <div class="kpi-label" style="color:#c2410c;">Missing Retention</div>
        <div class="kpi-val" style="color:#c2410c;">${data.missing_retention}</div>
        <div class="kpi-sub" style="color:#c2410c;">Lacks Section 8 schedule</div>
      </div>
      <div class="kpi-card" style="background:#fef2f2; border-color:#fecaca;">
        <div class="kpi-label" style="color:#b91c1c;">Missing Both</div>
        <div class="kpi-val" style="color:#b91c1c;">${data.missing_both}</div>
        <div class="kpi-sub" style="color:#b91c1c;">Critical governance gaps</div>
      </div>
    </div>

    <!-- DPDP Statutory Readiness Callout -->
    <div style="background: linear-gradient(135deg, #101824 0%, #1a2536 50%, #2d4f66 100%); border-radius:14px; padding:22px 26px; color:white; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 8px 20px -4px rgba(15,23,42,0.3); border:1px solid #2d4f66;">
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:10px; font-weight:800; background:#488099; color:#ffffff; padding:2px 8px; border-radius:10px; text-transform:uppercase;">DPDP Act 2023 Statutory Matrix</span>
          <span style="font-size:11px; color:#bcdbe7;">• Cryptographic SHA-256 Audit Seal Enabled</span>
        </div>
        <h3 style="font-size:16px; font-weight:700; margin-top:6px;">Personal Data Governance & Regulatory Audit Matrix</h3>
        <p style="font-size:12px; color:#bcdbe7; max-width:640px; margin-top:2px;">Audits discovery evidence against DPDP Section 5 (Notice), Section 8(7) (Retention Erasure), and Section 9 (Children & Minors Protection with Dihedral Verhoeff validation and Corporate PAN suppression).</p>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <button onclick="navigateTo('dpdp')" class="btn btn-primary" style="background:#488099; border-color:#579eba; white-space:nowrap;">Inspect DPDP Matrix &rarr;</button>
        <button onclick="navigateTo('simulator')" class="btn btn-secondary" style="background:rgba(255,255,255,0.15); color:white; border-color:rgba(255,255,255,0.25); white-space:nowrap;">Sensitivity Studio</button>
      </div>
    </div>

    <!-- Charts Grid -->
    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px; margin-bottom:24px;">
      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Personal Data Class Distribution</h3>
            <p class="card-subtitle">Discovered candidate fields across statutory personal data classes</p>
          </div>
          <button onclick="navigateTo('inventory')" class="btn btn-secondary" style="font-size:11px;">View Inventory &rarr;</button>
        </div>

        <div style="height:200px; display:flex; align-items:flex-end; gap:20px; padding:0 10px 10px 10px; border-bottom:1px solid #e2e8f0;">
          ${Object.entries(data.class_counts).map(([k, count]) => {
            const h = Math.max((count / maxVal) * 150, count > 0 ? 18 : 6);
            const color = classColors[k] || '#94a3b8';
            return `
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
                <span style="font-size:12px; font-family:'JetBrains Mono',monospace; font-weight:800; color:#1e293b;">${count}</span>
                <div style="width:100%; max-width:48px; height:${h}px; background:${color}; border-radius:6px 6px 0 0; box-shadow:0 2px 6px rgba(0,0,0,0.12);" title="${classLabels[k]}: ${count}"></div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display:flex; gap:20px; margin-top:12px; padding:0 10px;">
          ${Object.entries(data.class_counts).map(([k]) => `
            <div style="flex:1; text-align:center; font-size:11px; font-weight:600; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${classLabels[k]}">
              ${classLabels[k]}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Confidence Spectrum</h3>
            <p class="card-subtitle">Multi-signal engine confidence scoring</p>
          </div>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:16px;">
          ${Object.entries(data.confidence_distribution).map(([k, val]) => {
            const pct = data.total_candidates > 0 ? Math.round((val / data.total_candidates) * 100) : 0;
            const barCol = k.includes('Very') ? '#10b981' : k.includes('High') ? '#488099' : '#f59e0b';
            return `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
                  <span style="font-weight:600; color:#334155;">${k}</span>
                  <span style="font-family:'JetBrains Mono',monospace; font-weight:700; color:#0f172a;">${val} (${pct}%)</span>
                </div>
                <div style="width:100%; height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden; border:1px solid #e2e8f0;">
                  <div style="width:${pct}%; height:100%; background:${barCol}; border-radius:4px;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:24px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:11px; color:#64748b; text-align:center;">
          Multi-signal weights: <strong>40%</strong> Column • <strong>45%</strong> Regex • <strong>15%</strong> Validator
        </div>
      </div>
    </div>

    <!-- Recent Scans Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Recent Discovery Scans</h3>
          <p class="card-subtitle">Auditable record of personal data discovery runs</p>
        </div>
        <button onclick="navigateTo('scandata')" class="btn btn-secondary" style="font-size:11px;">New Scan &rarr;</button>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Dataset</th>
              <th>Type</th>
              <th>Status</th>
              <th>Columns</th>
              <th>Candidates Discovered</th>
              <th>Execution Time</th>
            </tr>
          </thead>
          <tbody>
            ${data.recent_scans && data.recent_scans.length > 0 ? data.recent_scans.map(s => `
              <tr>
                <td style="font-weight:700; color:#0f172a;">${s.dataset_name}</td>
                <td><span style="font-family:monospace; text-transform:uppercase; font-size:10px; padding:2px 6px; background:#f1f5f9; border-radius:4px; border:1px solid #e2e8f0;">${s.source_type}</span></td>
                <td><span class="badge badge-confirmed">${s.status}</span></td>
                <td style="font-family:'JetBrains Mono',monospace;">${s.total_columns}</td>
                <td style="font-family:'JetBrains Mono',monospace; font-weight:700; color:#488099;">${s.candidate_count}</td>
                <td style="color:#64748b;">${new Date(s.started_at).toLocaleTimeString()}</td>
              </tr>
            `).join('') : `<tr><td colspan="6" style="text-align:center; padding:24px; color:#94a3b8;">No scans recorded yet. Click '1-Click Discovery' above to run.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 2. Data Sources View
async function renderDataSources(container) {
  const res = await fetch('/api/datasets');
  const datasets = await res.json();
  state.datasets = datasets;

  container.innerHTML = `
    <!-- Explanatory Banner -->
    <div class="help-callout">
      <div>
        <strong>💡 Enterprise Data Connectors:</strong> Connect CSV files or SQLite databases in read-only mode. All analysis is executed locally in-memory with zero data exfiltration.
      </div>
      <button onclick="resetDemoData()" class="btn btn-secondary" style="font-size:11px; padding:4px 8px; white-space:nowrap;">↻ Reset Demo Data</button>
    </div>

    <!-- Upload Cards Grid -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px;">
      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Upload Delimited CSV Dataset</h3>
            <p class="card-subtitle">Supports UTF-8, Latin-1, with automated header deduplication</p>
          </div>
        </div>
        
        <label class="upload-dropzone">
          <div class="upload-dropzone-icon">📄</div>
          <span style="font-size:13px; font-weight:700; color:#488099;">Click or Drop CSV File Here</span>
          <span style="font-size:11px; color:#94a3b8;">.csv format up to 50MB</span>
          <input type="file" accept=".csv" style="display:none;" onchange="uploadFile(event, 'csv')"/>
        </label>
      </div>

      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Upload SQLite Database</h3>
            <p class="card-subtitle">Discovers user tables and schema relations in read-only mode</p>
          </div>
        </div>
        
        <label class="upload-dropzone">
          <div class="upload-dropzone-icon">🗄️</div>
          <span style="font-size:13px; font-weight:700; color:#36657c;">Click or Drop SQLite Database Here</span>
          <span style="font-size:11px; color:#94a3b8;">.db, .sqlite, .sqlite3 formats</span>
          <input type="file" accept=".db,.sqlite,.sqlite3" style="display:none;" onchange="uploadFile(event, 'sqlite')"/>
        </label>
      </div>
    </div>

    <!-- Datasets Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Connected Data Sources (${datasets.length})</h3>
          <p class="card-subtitle">Registered repositories ready for personal data discovery scanning</p>
        </div>
        <div class="btn-group">
          <button onclick="runOneClickDiscovery()" class="btn btn-primary" style="font-size:11px;">⚡ Scan All Sources</button>
          <button onclick="renderActiveView()" class="btn btn-secondary" style="font-size:11px;">Refresh</button>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Dataset Name</th>
              <th>Type</th>
              <th>Tables</th>
              <th>Row Count</th>
              <th>Registered Date</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${datasets.map(ds => `
              <tr>
                <td style="font-weight:700; color:#0f172a;">${ds.name}</td>
                <td><span style="font-family:monospace; text-transform:uppercase; font-size:10px; padding:2px 6px; background:#f1f5f9; border-radius:4px; border:1px solid #e2e8f0;">${ds.source_type}</span></td>
                <td style="font-family:'JetBrains Mono',monospace;">${ds.table_count}</td>
                <td style="font-family:'JetBrains Mono',monospace;">${ds.row_count.toLocaleString()}</td>
                <td style="color:#64748b;">${new Date(ds.created_at).toLocaleDateString()}</td>
                <td style="text-align:right;">
                  <button onclick="inspectDatasetTables('${ds.id}')" class="btn btn-secondary" style="font-size:11px; padding:4px 8px;">Inspect</button>
                  <button onclick="quickScanDataset('${ds.id}', '${ds.name}')" class="btn btn-primary" style="font-size:11px; padding:4px 10px;">⚡ Scan</button>
                  <button onclick="deleteDataset('${ds.id}', '${ds.name}')" class="btn btn-danger" style="font-size:11px; padding:4px 8px;">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="schema-inspector-box"></div>
  `;
}

async function quickScanDataset(datasetId, datasetName) {
  showToast(`Scanning ${datasetName}...`, 'info');
  try {
    const res = await fetch('/api/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId })
    });
    if (!res.ok) throw new Error('Scan failed');
    const job = await res.json();
    showToast(`✓ Scanned ${datasetName}: Found ${job.candidate_count} candidate fields.`, 'success');
    await updateSidebarPendingBadge();
    await renderActiveView();
  } catch (e) {
    showToast(`Scan error: ${e.message}`, 'error');
  }
}

async function uploadFile(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);

  const url = type === 'csv' ? '/api/datasets/csv' : '/api/datasets/sqlite';
  try {
    const res = await fetch(url, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    showToast(`✓ File "${file.name}" registered successfully!`, 'success');
    renderActiveView();
  } catch (err) {
    showToast(`Upload error: ${err.message}`, 'error');
  }
}

async function deleteDataset(id, name) {
  if (!confirm(`Delete dataset "${name}"?`)) return;
  await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
  showToast(`Deleted ${name}`, 'info');
  renderActiveView();
}

async function inspectDatasetTables(datasetId) {
  const box = document.getElementById('schema-inspector-box');
  box.innerHTML = `<div class="card" style="padding:24px; text-align:center; color:#64748b;">Loading schema tables...</div>`;

  const res = await fetch(`/api/datasets/${datasetId}/tables`);
  const tables = await res.json();

  box.innerHTML = `
    <div class="card" style="border:1.5px solid var(--brand-primary); margin-top:24px;">
      <div class="card-header">
        <div>
          <h3 class="card-title" style="color:var(--brand-primary);">Schema Structure & Sample Values</h3>
          <p class="card-subtitle">Read-only preview of discovered column data types and sanitized samples</p>
        </div>
        <button onclick="document.getElementById('schema-inspector-box').innerHTML=''" class="btn btn-secondary" style="font-size:11px;">Close Inspector ✕</button>
      </div>
      ${tables.map(t => `
        <div style="margin-bottom:20px; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
          <div style="padding:12px 16px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-weight:700; font-size:13px; display:flex; justify-content:space-between; align-items:center;">
            <span>Table: <strong style="font-family:'JetBrains Mono',monospace; color:#0f172a;">${t.table_name}</strong></span>
            <span style="font-size:11px; color:#64748b; font-weight:500;">${t.row_count} rows • ${t.columns.length} columns</span>
          </div>
          <div class="table-responsive" style="border:none; border-radius:0;">
            <table>
              <thead>
                <tr>
                  <th style="width:220px;">Column Name</th>
                  <th style="width:120px;">Data Type</th>
                  <th style="width:120px;">Non-Null Count</th>
                  <th>Sanitized Sample Values</th>
                </tr>
              </thead>
              <tbody>
                ${t.columns.map(c => `
                  <tr>
                    <td style="font-family:'JetBrains Mono',monospace; font-weight:700; color:#0f172a;">${c.name}</td>
                    <td style="font-family:'JetBrains Mono',monospace; color:#64748b; font-size:11px;">${c.data_type}</td>
                    <td style="font-family:'JetBrains Mono',monospace;">${c.non_null_count}</td>
                    <td>
                      <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${c.sample_values.slice(0, 3).map(v => `<span style="background:#f1f5f9; border:1px solid #e2e8f0; padding:2px 8px; border-radius:4px; font-family:'JetBrains Mono',monospace; font-size:11px; color:#334155;">${v}</span>`).join('')}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 3. Scan View
async function renderScan(container) {
  const res = await fetch('/api/datasets');
  const datasets = await res.json();

  if (!datasets || datasets.length === 0) {
    container.innerHTML = `
      <div class="card" style="max-width:600px; margin:40px auto; text-align:center; padding:40px;">
        <h3 style="font-size:18px; font-weight:800; margin-bottom:8px;">No Datasets Available</h3>
        <p style="font-size:12px; color:#64748b; margin-bottom:20px;">Connect a CSV or SQLite source to run discovery scans.</p>
        <button onclick="navigateTo('datasources')" class="btn btn-primary">Go to Data Sources</button>
      </div>
    `;
    return;
  }

  const selectedDs = state.selectedScanDatasetId || datasets[0].id;

  container.innerHTML = `
    <!-- Callout -->
    <div class="help-callout">
      <div>
        <strong>💡 Multi-Signal Detection Engine:</strong> Evaluates header naming patterns (40%), regex value distributions (45%), and format validators (15% Aadhaar Verhoeff, Indian Phone, Entity-aware PAN, DOB) to score confidence.
      </div>
      <button onclick="runOneClickDiscovery()" class="btn btn-primary" style="font-size:11px; padding:4px 10px; white-space:nowrap;">⚡ 1-Click Scan All</button>
    </div>

    <!-- Scan Launch Card -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Execute Personal-Data Discovery Scan</h3>
          <p class="card-subtitle">Select a target data repository to inspect columns and sample rows</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; align-items:flex-end;">
        <div>
          <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:6px;">Target Data Repository</label>
          <select id="scan-dataset-select" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; font-weight:600; background:#ffffff;">
            ${datasets.map(d => `
              <option value="${d.id}" ${d.id === selectedDs ? 'selected' : ''}>${d.name} (${d.source_type.toUpperCase()} • ${d.row_count.toLocaleString()} rows)</option>
            `).join('')}
          </select>
        </div>

        <div>
          <button onclick="executeScan()" id="btn-run-scan" class="btn btn-primary" style="width:100%; padding:11px; justify-content:center; font-size:13px; font-weight:700;">
            ${icons.scandata} Execute Discovery Scan
          </button>
        </div>
      </div>

      <div id="scan-feedback" style="margin-top:20px;"></div>
    </div>
  `;
}

async function executeScan() {
  const dsId = document.getElementById('scan-dataset-select').value;
  const btn = document.getElementById('btn-run-scan');
  const feedback = document.getElementById('scan-feedback');

  btn.disabled = true;
  btn.innerHTML = `<span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span> Scanning Data...`;
  feedback.innerHTML = `<div style="padding:14px; font-size:12px; color:#488099; background:#f0f7fa; border:1px solid #bcdbe7; border-radius:8px;">Scanning columns, computing multi-signal confidence scores, and validating checksums...</div>`;

  try {
    const res = await fetch('/api/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: dsId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Scan failed');
    }
    const job = await res.json();
    showToast(`✓ Scan completed! Discovered ${job.candidate_count} candidate fields.`, 'success');
    await updateSidebarPendingBadge();

    feedback.innerHTML = `
      <div style="background:#ecfdf5; border:1.5px solid #a7f3d0; border-radius:10px; padding:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h4 style="color:#065f46; font-size:15px; font-weight:700;">✓ Discovery Scan Completed Successfully</h4>
            <p style="font-size:12px; color:#047857; margin-top:3px;">
              Inspected <strong>${job.total_columns}</strong> columns across <strong>${job.total_tables}</strong> tables.
              Discovered <strong>${job.candidate_count}</strong> personal data fields.
            </p>
          </div>
          <button onclick="navigateTo('inventory')" class="btn btn-primary" style="background:#047857; border-color:#065f46;">View Evidence Inventory &rarr;</button>
        </div>
      </div>
    `;
  } catch (err) {
    feedback.innerHTML = `<div style="padding:14px; font-size:12px; color:#b91c1c; background:#fef2f2; border:1px solid #fecaca; border-radius:8px;">Scan error: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `${icons.scandata} Execute Discovery Scan`;
  }
}

// 4. Inventory View
async function renderInventory(container) {
  const res = await fetch('/api/inventory');
  const inventory = await res.json();
  state.inventory = inventory;

  const missingCount = inventory.filter(r => r.metadata_status && r.metadata_status.includes('Missing')).length;
  const govidCount = inventory.filter(r => r.candidate_class === 'government_id').length;
  const emailCount = inventory.filter(r => r.candidate_class === 'email_address').length;
  const phoneCount = inventory.filter(r => r.candidate_class === 'phone_number').length;
  const nameCount = inventory.filter(r => r.candidate_class === 'person_name').length;
  const dobCount = inventory.filter(r => r.candidate_class === 'date_of_birth').length;

  container.innerHTML = `
    <!-- Explanatory Banner -->
    <div class="help-callout">
      <div>
        <strong>💡 Master Evidence Inventory:</strong> Centralized technical catalog linking every detected field to declared processing purpose, retention period, and human review verification.
      </div>
      <div class="btn-group">
        <a href="/api/reports/inventory.csv" download class="btn btn-secondary" style="font-size:11px; padding:4px 8px;">Export CSV</a>
        <a href="/api/reports/inventory.pdf" target="_blank" class="btn btn-primary" style="font-size:11px; padding:4px 8px;">Export PDF</a>
      </div>
    </div>

    <!-- Quick Filter Chips Ribbon -->
    <div class="filter-chips-bar">
      <span style="font-size:11px; font-weight:700; color:#64748b; margin-right:4px;">1-Click Filter:</span>
      <div class="filter-chip ${state.invActiveChip === 'all' ? 'active' : ''}" onclick="applyInvChip('all')">All Fields (${inventory.length})</div>
      <div class="filter-chip ${state.invActiveChip === 'missing' ? 'active' : ''}" onclick="applyInvChip('missing')" style="${missingCount > 0 ? 'border-color:#fde68a;' : ''}">⚠️ Missing Notice/Retention (${missingCount})</div>
      <div class="filter-chip ${state.invActiveChip === 'government_id' ? 'active' : ''}" onclick="applyInvChip('government_id')">🛡️ Gov IDs (${govidCount})</div>
      <div class="filter-chip ${state.invActiveChip === 'email_address' ? 'active' : ''}" onclick="applyInvChip('email_address')">📧 Emails (${emailCount})</div>
      <div class="filter-chip ${state.invActiveChip === 'phone_number' ? 'active' : ''}" onclick="applyInvChip('phone_number')">📞 Phones (${phoneCount})</div>
      <div class="filter-chip ${state.invActiveChip === 'person_name' ? 'active' : ''}" onclick="applyInvChip('person_name')">👤 Names (${nameCount})</div>
      <div class="filter-chip ${state.invActiveChip === 'date_of_birth' ? 'active' : ''}" onclick="applyInvChip('date_of_birth')">🎂 DOBs (${dobCount})</div>
    </div>

    <!-- Filter Control Card -->
    <div class="card" style="margin-bottom:20px; padding:16px 20px;">
      <div class="filter-box">
        <input type="text" id="inv-search" oninput="filterInventoryTable()" placeholder="Search column, table, purpose, or dataset..." style="flex:1; min-width:260px;"/>
        <select id="inv-class-filter" onchange="filterInventoryTable()" style="min-width:180px;">
          <option value="">All Data Classes</option>
          <option value="person_name">Person Name</option>
          <option value="email_address">Email Address</option>
          <option value="phone_number">Phone Number</option>
          <option value="government_id">Gov ID (Aadhaar/PAN)</option>
          <option value="date_of_birth">Date of Birth</option>
        </select>
        <select id="inv-meta-filter" onchange="filterInventoryTable()" style="min-width:190px;">
          <option value="">All Metadata Statuses</option>
          <option value="Complete metadata">Complete</option>
          <option value="Missing purpose">Missing Purpose</option>
          <option value="Missing retention">Missing Retention</option>
          <option value="Missing both">Missing Both</option>
        </select>
        <button onclick="document.getElementById('inv-search').value=''; document.getElementById('inv-class-filter').value=''; document.getElementById('inv-meta-filter').value=''; applyInvChip('all');" class="btn btn-secondary" style="font-size:11px; padding:7px 12px;">Reset</button>
      </div>
    </div>

    <!-- Inventory Table Card -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Technical Evidence Records</h3>
          <p class="card-subtitle">Inspected database columns and classified personal data</p>
        </div>
      </div>

      <div class="table-responsive">
        <table id="inv-table">
          <thead>
            <tr>
              <th>Dataset / Table</th>
              <th>Column Name</th>
              <th>Data Class</th>
              <th>Confidence</th>
              <th>Metadata Status</th>
              <th>Declared Purpose</th>
              <th>Retention Rule</th>
              <th>Review</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="inv-tbody">
            ${renderInventoryRows(inventory)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function applyInvChip(chip) {
  state.invActiveChip = chip;
  document.querySelectorAll('.filter-chips-bar .filter-chip').forEach(el => el.classList.remove('active'));
  if (event && event.target && event.target.classList.contains('filter-chip')) event.target.classList.add('active');

  const search = (document.getElementById('inv-search')?.value || '').toLowerCase();
  const filtered = state.inventory.filter(r => {
    const matchSearch = r.column_name.toLowerCase().includes(search) ||
                        r.dataset_name.toLowerCase().includes(search) ||
                        (r.table_name || '').toLowerCase().includes(search) ||
                        (r.declared_purpose || '').toLowerCase().includes(search);
    let matchChip = true;
    if (chip === 'missing') {
      matchChip = r.metadata_status && r.metadata_status.includes('Missing');
    } else if (chip !== 'all') {
      matchChip = r.candidate_class === chip;
    }
    return matchSearch && matchChip;
  });

  const tbody = document.getElementById('inv-tbody');
  if (tbody) tbody.innerHTML = renderInventoryRows(filtered);
}

function renderInventoryRows(records) {
  if (records.length === 0) {
    return `<tr><td colspan="9" style="text-align:center; padding:24px; color:#94a3b8;">No candidate detections matched current filter.</td></tr>`;
  }
  return records.map(r => `
    <tr>
      <td>
        <strong style="color:#0f172a; display:block;">${r.dataset_name}</strong>
        <span style="font-size:10px; font-family:'JetBrains Mono',monospace; color:#64748b;">${r.table_name || 'root table'}</span>
      </td>
      <td style="font-family:'JetBrains Mono',monospace; font-weight:700;">${r.column_name}</td>
      <td>${renderClassBadge(r.candidate_class)}</td>
      <td>${renderConfidenceBar(r.confidence_score)}</td>
      <td>${renderMetaBadge(r.metadata_status)}</td>
      <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.declared_purpose || ''}">
        ${r.declared_purpose || '<span style="color:#b45309; font-style:italic;">⚠️ Unspecified</span>'}
      </td>
      <td style="max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        ${r.retention_period || '<span style="color:#c2410c; font-style:italic;">⚠️ Unspecified</span>'}
      </td>
      <td>${renderReviewBadge(r.review_status)}</td>
      <td style="text-align:right; white-space:nowrap;">
        <button onclick="openEvidenceModal('${r.id}')" class="btn btn-secondary" style="font-size:11px; padding:4px 8px;">Evidence</button>
        <button onclick="openReviewModal('${r.id}')" class="btn btn-primary" style="font-size:11px; padding:4px 8px;">Review</button>
      </td>
    </tr>
  `).join('');
}

function filterInventoryTable() {
  const search = document.getElementById('inv-search').value.toLowerCase();
  const cls = document.getElementById('inv-class-filter').value;
  const meta = document.getElementById('inv-meta-filter').value;

  const filtered = state.inventory.filter(r => {
    const matchSearch = r.column_name.toLowerCase().includes(search) ||
                        r.dataset_name.toLowerCase().includes(search) ||
                        (r.table_name || '').toLowerCase().includes(search) ||
                        (r.declared_purpose || '').toLowerCase().includes(search);
    const matchClass = !cls || r.candidate_class === cls;
    const matchMeta = !meta || r.metadata_status === meta;
    return matchSearch && matchClass && matchMeta;
  });

  const tbody = document.getElementById('inv-tbody');
  if (tbody) tbody.innerHTML = renderInventoryRows(filtered);
}

// 5. Metadata Register View
async function renderMetadata(container) {
  const res = await fetch('/api/metadata');
  const metadata = await res.json();
  state.metadata = metadata;

  container.innerHTML = `
    <div class="help-callout">
      <div>
        <strong>💡 Purpose & Retention Register:</strong> Documents statutory processing grounds (e.g., customer onboarding, salary disbursement) and retention limits to satisfy DPDP Section 5 & 8 principles.
      </div>
      <button onclick="openNewMetadataModal()" class="btn btn-primary" style="font-size:11px; padding:6px 12px;">+ New Notice</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Governance Register (${metadata.length} notices declared)</h3>
          <p class="card-subtitle">Declared business purposes and retention limits mapped to data attributes</p>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Dataset / Table</th>
              <th>Column Name</th>
              <th>Class</th>
              <th>Declared Purpose</th>
              <th>Retention Rule</th>
              <th>Owner</th>
              <th>Reviewed</th>
            </tr>
          </thead>
          <tbody>
            ${metadata.map(m => `
              <tr>
                <td><strong>${m.dataset_name || 'Global'}</strong> <span style="font-size:10px; color:#64748b; font-family:'JetBrains Mono',monospace;">${m.table_name || 'All'}</span></td>
                <td style="font-family:'JetBrains Mono',monospace; font-weight:700;">${m.column_name}</td>
                <td>${m.data_class ? renderClassBadge(m.data_class) : '—'}</td>
                <td>${m.declared_purpose || '<span style="color:#b45309; font-style:italic;">⚠️ Unspecified</span>'}</td>
                <td>${m.retention_period || '<span style="color:#c2410c; font-style:italic;">⚠️ Unspecified</span>'}</td>
                <td style="color:#64748b;">${m.metadata_owner || 'DPO Team'}</td>
                <td style="font-family:'JetBrains Mono',monospace; font-size:11px;">${m.last_reviewed_date || 'Active'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 6. Evidence Gaps View
async function renderGaps(container) {
  const res = await fetch('/api/gaps');
  const data = await res.json();
  state.gapsReport = data;
  const s = data.statistics;

  container.innerHTML = `
    <div class="help-callout">
      <div>
        <strong>💡 Compliance Gap Diagnostics:</strong> Highlights discovered personal data fields that lack documented processing notices, indefinite retention, or pending human review.
      </div>
      <a href="/api/reports/gaps.csv" download class="btn btn-warning" style="font-size:11px; padding:4px 8px;">Export Gaps CSV</a>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card" style="background:#fffbeb; border-color:#fde68a;">
        <div class="kpi-label" style="color:#b45309;">Missing Purpose</div>
        <div class="kpi-val" style="color:#b45309;">${s.missing_purpose_count}</div>
        <div class="kpi-sub" style="color:#b45309;">No notice declared</div>
      </div>
      <div class="kpi-card" style="background:#fff7ed; border-color:#fed7aa;">
        <div class="kpi-label" style="color:#c2410c;">Missing Retention</div>
        <div class="kpi-val" style="color:#c2410c;">${s.missing_retention_count}</div>
        <div class="kpi-sub" style="color:#c2410c;">Indefinite storage risk</div>
      </div>
      <div class="kpi-card" style="background:#fef2f2; border-color:#fecaca;">
        <div class="kpi-label" style="color:#b91c1c;">Missing Both</div>
        <div class="kpi-val" style="color:#b91c1c;">${s.missing_both_count}</div>
        <div class="kpi-sub" style="color:#b91c1c;">Severe gap</div>
      </div>
      <div class="kpi-card" style="background:#f0f9ff; border-color:#bcdbe7;">
        <div class="kpi-label" style="color:#36657c;">Unreviewed</div>
        <div class="kpi-val" style="color:#488099;">${s.unreviewed_candidate_count}</div>
        <div class="kpi-sub" style="color:#36657c;">Awaiting DPO triage</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Identified Technical Evidence Gaps (${data.gap_records.length})</h3>
          <p class="card-subtitle">Candidates lacking statutory notices, retention policies, or confirmed review</p>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Dataset / Table</th>
              <th>Field</th>
              <th>Class</th>
              <th>Confidence</th>
              <th>Metadata Gap Status</th>
              <th>Review Status</th>
              <th style="text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${data.gap_records.map(r => `
              <tr>
                <td><strong>${r.dataset_name}</strong> <span style="font-size:10px; font-family:'JetBrains Mono',monospace; color:#64748b;">${r.table_name}</span></td>
                <td style="font-family:'JetBrains Mono',monospace; font-weight:700;">${r.column_name}</td>
                <td>${renderClassBadge(r.candidate_class)}</td>
                <td>${renderConfidenceBar(r.confidence_score)}</td>
                <td>${renderMetaBadge(r.metadata_status)}</td>
                <td>${renderReviewBadge(r.review_status)}</td>
                <td style="text-align:right;">
                  <button onclick="openReviewModal('${r.id}')" class="btn btn-primary" style="font-size:11px; padding:3px 8px;">Remediate</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 7. Evaluation View
async function renderEvaluation(container) {
  const res = await fetch('/api/evaluation');
  const history = await res.json();
  state.evalHistory = history;

  const latest = history && history.length > 0 ? history[0] : null;
  const classMetrics = latest ? (latest.per_class_metrics || latest.class_metrics || {}) : {};
  const totalSamples = latest ? (latest.total_evaluated ?? latest.total_samples ?? 0) : 0;
  const predictions = latest ? (latest.predictions_breakdown || []) : [];

  container.innerHTML = `
    <div class="help-callout">
      <div>
        <strong>💡 Accuracy & Benchmark Metrics:</strong> Benchmarked against labelled ground-truth synthetic test cases across all five statutory PII classes.
      </div>
      <button onclick="runLiveEvaluation()" id="btn-eval" class="btn btn-primary" style="font-size:11px; padding:6px 14px; font-weight:700;">
        ⚡ Run Accuracy Test
      </button>
    </div>

    ${!latest || Object.keys(classMetrics).length === 0 ? `
      <div class="card" style="text-align:center; padding:40px; color:#64748b;">
        <h4 style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:8px;">No Benchmark Evaluation Runs Yet</h4>
        <p style="font-size:12px; margin-bottom:20px;">Click the button below to execute an automated multi-signal precision, recall, and F1 test across labelled ground-truth samples.</p>
        <button onclick="runLiveEvaluation()" class="btn btn-primary">Run First Accuracy Benchmark</button>
      </div>
    ` : `
      <!-- KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card" style="background:#f0fdf4; border-color:#bbf7d0;">
          <div class="kpi-label" style="color:#15803d;">Macro Precision</div>
          <div class="kpi-val" style="color:#15803d;">${((latest.overall_precision || 0) * 100).toFixed(1)}%</div>
          <div class="kpi-sub" style="color:#15803d;">Low false positives</div>
        </div>
        <div class="kpi-card" style="background:#f0f9ff; border-color:#bcdbe7;">
          <div class="kpi-label" style="color:#488099;">Macro Recall</div>
          <div class="kpi-val" style="color:#488099;">${((latest.overall_recall || 0) * 100).toFixed(1)}%</div>
          <div class="kpi-sub" style="color:#488099;">High ground-truth coverage</div>
        </div>
        <div class="kpi-card" style="background:#f0fdf4; border-color:#bbf7d0;">
          <div class="kpi-label" style="color:#15803d;">Macro F1 Score</div>
          <div class="kpi-val" style="color:#15803d;">${((latest.overall_f1 || 0) * 100).toFixed(1)}%</div>
          <div class="kpi-sub" style="color:#15803d;">Harmonic test set accuracy</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Test Samples</div>
          <div class="kpi-val">${totalSamples}</div>
          <div class="kpi-sub">Synthetic ground-truth fields</div>
        </div>
      </div>

      <!-- Class-by-Class Accuracy Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Class-by-Class Benchmark Accuracy</h3>
            <p class="card-subtitle">Precision, recall, and harmonic F1 across the five personal data classes (${latest.test_set_name || 'Standard Benchmark'})</p>
          </div>
          <span style="font-size:11px; font-family:'JetBrains Mono',monospace; color:#64748b;">Run ID: ${(latest.id || '').slice(0, 8)}</span>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Personal Data Class</th>
                <th>True Support</th>
                <th>Predicted</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1 Score</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(classMetrics).map(([cls, m]) => {
                const f1Val = m.f1_score ?? m.f1 ?? 0;
                const precVal = m.precision ?? 0;
                const recVal = m.recall ?? 0;
                const tp = m.true_positives ?? 0;
                const fp = m.false_positives ?? 0;
                const support = m.support ?? 0;
                return `
                  <tr>
                    <td>${renderClassBadge(cls)}</td>
                    <td style="font-family:'JetBrains Mono',monospace;">${support}</td>
                    <td style="font-family:'JetBrains Mono',monospace;">${tp + fp}</td>
                    <td><strong>${(precVal * 100).toFixed(1)}%</strong></td>
                    <td><strong>${(recVal * 100).toFixed(1)}%</strong></td>
                    <td><span class="badge badge-complete">${(f1Val * 100).toFixed(1)}%</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Multi-Signal Mechanics Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Multi-Signal Scoring Mechanics</h3>
            <p class="card-subtitle">How PrivacyLens combines signals into an auditable confidence score</p>
          </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
          <div style="padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
            <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">1. Column Regex Pattern (40%)</div>
            <p style="font-size:11px; color:#64748b;">Header matches against curated positive and negative regular expressions.</p>
          </div>
          <div style="padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
            <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">2. Value Pattern Ratio (45%)</div>
            <p style="font-size:11px; color:#64748b;">Ratio of sampled cell values strictly matching format regex patterns.</p>
          </div>
          <div style="padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
            <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">3. Validator Bonus (15%)</div>
            <p style="font-size:11px; color:#64748b;">Algorithmic verification such as Verhoeff D5 checksum and entity-aware PAN checks.</p>
          </div>
        </div>
      </div>

      <!-- Auditable Sample Predictions Table -->
      ${predictions.length > 0 ? `
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Sample Benchmark Predictions (${predictions.length} cases tested)</h3>
              <p class="card-subtitle">Auditable record of true class versus scanner prediction</p>
            </div>
          </div>
          <div class="table-responsive" style="max-height:360px; overflow-y:auto;">
            <table>
              <thead>
                <tr>
                  <th>Field / Column</th>
                  <th>Sample Value</th>
                  <th>Ground Truth Class</th>
                  <th>Predicted Class</th>
                  <th>Confidence</th>
                  <th style="text-align:right;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${predictions.slice(0, 15).map(p => `
                  <tr>
                    <td style="font-family:'JetBrains Mono',monospace; font-weight:700;">${p.column_name}</td>
                    <td style="font-family:'JetBrains Mono',monospace; font-size:11px; color:#64748b;">${p.sample_value}</td>
                    <td>${renderClassBadge(p.true_class)}</td>
                    <td>${renderClassBadge(p.predicted_class)}</td>
                    <td>${renderConfidenceBar(p.confidence)}</td>
                    <td style="text-align:right;">
                      ${p.is_correct ? '<span class="badge badge-complete">✓ Match</span>' : '<span class="badge badge-missing-b">✕ Mismatch</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `}
  `;
}

async function runLiveEvaluation() {
  const btn = document.getElementById('btn-eval');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span> Evaluating benchmark...`;
  }
  try {
    const res = await fetch('/api/evaluation', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Evaluation request failed');
    }
    showToast('✓ Accuracy evaluation completed successfully!', 'success');
    await renderActiveView();
  } catch (err) {
    showToast(`Evaluation failed: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Run Accuracy Test';
    }
  }
}

// 8. Review Center View
async function renderReviewCenter(container) {
  const res = await fetch('/api/inventory');
  const allRecords = await res.json();
  const pending = allRecords.filter(r => r.review_status === 'PENDING');
  const highConfCount = pending.filter(r => r.confidence_score >= 0.85).length;
  const modConfCount = pending.filter(r => r.confidence_score >= 0.70 && r.confidence_score < 0.85).length;
  const lowConfCount = pending.filter(r => r.confidence_score < 0.70).length;

  container.innerHTML = `
    <!-- Explanatory Callout Banner -->
    <div class="help-callout">
      <div>
        <strong>💡 Human-in-the-Loop Triage Center:</strong> Verify automated multi-signal detections. Use 1-click batch actions to rapidly confirm high-confidence matches (>85%) or adjudicate borderline candidates.
      </div>
      <div class="btn-group">
        ${highConfCount > 0 ? `
          <button onclick="quickBatchReview(0.85, 'CONFIRMED')" class="btn btn-primary" style="font-size:11px; padding:5px 12px; font-weight:700;">
            ✓ Confirm High-Confidence (>85%) [${highConfCount}]
          </button>
        ` : ''}
        ${pending.length > 0 ? `
          <button onclick="quickBatchReview(null, 'CONFIRMED')" class="btn btn-secondary" style="font-size:11px; padding:5px 10px;">
            Confirm All [${pending.length}]
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Quick Filter Chips Ribbon -->
    <div class="filter-chips-bar">
      <span style="font-size:11px; font-weight:700; color:#64748b; margin-right:4px;">Filter Queue:</span>
      <div class="filter-chip ${state.reviewActiveChip === 'all' ? 'active' : ''}" onclick="applyReviewChip('all')">All Pending (${pending.length})</div>
      <div class="filter-chip ${state.reviewActiveChip === 'high' ? 'active' : ''}" onclick="applyReviewChip('high')">High Confidence >85% (${highConfCount})</div>
      <div class="filter-chip ${state.reviewActiveChip === 'moderate' ? 'active' : ''}" onclick="applyReviewChip('moderate')">Moderate 70-84% (${modConfCount})</div>
      <div class="filter-chip ${state.reviewActiveChip === 'borderline' ? 'active' : ''}" onclick="applyReviewChip('borderline')">Borderline &lt;70% (${lowConfCount})</div>
    </div>

    <!-- Review Card -->
    <div class="card">
      <div class="card-header">
        <input type="text" id="review-search" oninput="filterReviewTable()" placeholder="Search pending field, dataset, or class..." style="width:280px;"/>
        <span style="font-size:12px; font-weight:600; color:#475569;" id="review-counter">${pending.length} candidate fields awaiting review</span>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Field Identifier</th>
              <th>Dataset Source</th>
              <th>Candidate Class</th>
              <th>Confidence</th>
              <th>Technical Evidence</th>
              <th style="text-align:right;">Decision</th>
            </tr>
          </thead>
          <tbody id="review-tbody">
            ${renderReviewRows(pending)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderReviewRows(records) {
  if (records.length === 0) {
    return `<tr><td colspan="6" style="text-align:center; padding:36px; color:#10b981; font-weight:700;">✓ Review queue empty! All candidate detections reviewed.</td></tr>`;
  }
  return records.map(r => `
    <tr id="review-row-${r.id}">
      <td><strong>${r.column_name}</strong> <span style="font-size:10px; font-family:'JetBrains Mono',monospace; color:#64748b;">${r.table_name}</span></td>
      <td>${r.dataset_name}</td>
      <td>${renderClassBadge(r.candidate_class)}</td>
      <td>${renderConfidenceBar(r.confidence_score)}</td>
      <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.evidence_summary}">${r.evidence_summary}</td>
      <td style="text-align:right; white-space:nowrap;">
        <button onclick="openEvidenceModal('${r.id}')" class="btn btn-secondary" style="font-size:11px; padding:3px 8px;">Evidence</button>
        <button onclick="quickReview('${r.id}', 'CONFIRMED')" class="btn btn-primary" style="font-size:11px; padding:3px 8px; background:#047857; border-color:#065f46;">Confirm</button>
        <button onclick="quickReview('${r.id}', 'REJECTED')" class="btn btn-danger" style="font-size:11px; padding:3px 8px;">Reject</button>
      </td>
    </tr>
  `).join('');
}

function applyReviewChip(chip) {
  state.reviewActiveChip = chip;
  document.querySelectorAll('.filter-chips-bar .filter-chip').forEach(el => el.classList.remove('active'));
  if (event && event.target && event.target.classList.contains('filter-chip')) event.target.classList.add('active');
  filterReviewTable();
}

function filterReviewTable() {
  const search = (document.getElementById('review-search')?.value || '').toLowerCase();
  const chip = state.reviewActiveChip || 'all';

  const pending = state.inventory.filter(r => r.review_status === 'PENDING');
  const filtered = pending.filter(r => {
    const matchSearch = r.column_name.toLowerCase().includes(search) ||
                        r.dataset_name.toLowerCase().includes(search) ||
                        r.candidate_class.toLowerCase().includes(search);
    let matchChip = true;
    if (chip === 'high') matchChip = r.confidence_score >= 0.85;
    else if (chip === 'moderate') matchChip = r.confidence_score >= 0.70 && r.confidence_score < 0.85;
    else if (chip === 'borderline') matchChip = r.confidence_score < 0.70;

    return matchSearch && matchChip;
  });

  const tbody = document.getElementById('review-tbody');
  if (tbody) tbody.innerHTML = renderReviewRows(filtered);
  const counter = document.getElementById('review-counter');
  if (counter) counter.textContent = `${filtered.length} fields matching filter`;
}

async function quickReview(id, status) {
  try {
    const res = await fetch(`/api/inventory/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_status: status, reviewer_notes: `Decision: ${status}` })
    });
    if (!res.ok) throw new Error('Review failed');
    showToast(`✓ Field ${status === 'CONFIRMED' ? 'confirmed as PII' : 'rejected / suppressed'}`, 'success');
    
    // Update local state
    const record = state.inventory.find(r => r.id === id);
    if (record) record.review_status = status;
    
    // Smooth remove row
    const row = document.getElementById(`review-row-${id}`);
    if (row) {
      row.style.opacity = '0.3';
      row.style.background = status === 'CONFIRMED' ? '#ecfdf5' : '#fef2f2';
      setTimeout(() => {
        row.remove();
        updateSidebarPendingBadge();
        filterReviewTable();
      }, 250);
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function quickBatchReview(minConfidence, targetStatus) {
  try {
    const payload = { target_status: targetStatus };
    if (minConfidence !== null) payload.min_confidence = minConfidence;
    
    const res = await fetch('/api/inventory/batch-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Batch review failed');
    const data = await res.json();
    showToast(`✓ Batch review applied: ${data.updated_count} fields ${targetStatus}.`, 'success');
    await updateSidebarPendingBadge();
    await renderActiveView();
  } catch (err) {
    showToast(`Batch error: ${err.message}`, 'error');
  }
}

// 9. Settings View
async function renderSettings(container) {
  const res = await fetch('/api/rules');
  const data = await res.json();
  state.rulesConfig = data;

  container.innerHTML = `
    <div class="help-callout">
      <div>
        <strong>💡 Configurable YAML Rules Engine:</strong> Customize regex patterns, negative suppression lists, scoring weights, and candidate thresholds with backend strict syntax validation.
      </div>
      <button onclick="saveRulesYaml()" id="btn-save-rules" class="btn btn-primary" style="font-size:11px; padding:5px 12px;">Save & Compile Rules</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Active YAML Rules Specification</h3>
          <p class="card-subtitle">Declarative patterns and multi-signal scoring weights</p>
        </div>
      </div>
      
      <textarea id="rules-textarea" style="width:100%; height:440px; font-family:'JetBrains Mono',monospace; font-size:12px; padding:18px; background:#0f172a; color:#34d399; border-radius:10px; border:1px solid #334155; line-height:1.6;" spellcheck="false">${data.yaml_content}</textarea>

      <div style="margin-top:16px; padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:11px; color:#64748b;">
        <strong>Safety Guardrail:</strong> Syntax is validated on the backend before hot-reload. Arbitrary code execution is strictly prevented.
      </div>
    </div>
  `;
}

async function saveRulesYaml() {
  const content = document.getElementById('rules-textarea').value;
  const btn = document.getElementById('btn-save-rules');
  btn.disabled = true;
  btn.textContent = 'Validating & Compiling...';

  try {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml_content: content })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Validation failed');
    }
    showToast('✓ Rules updated and compiled successfully!', 'success');
  } catch (err) {
    showToast(`Rules error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save & Compile Rules';
  }
}

// Evidence Modal
function openEvidenceModal(recordId) {
  const r = (state.inventory.find(i => i.id === recordId)) ||
            (state.gapsReport?.gap_records.find(i => i.id === recordId));
  if (!r) return;

  const modal = document.getElementById('modal-container');
  const sb = r.signals_breakdown || {};

  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div>
            <span style="font-size:10px; font-weight:700; color:#488099; text-transform:uppercase; letter-spacing:0.05em;">Technical Evidence Audit</span>
            <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin-top:2px;">${r.column_name}</h3>
          </div>
          <button onclick="closeModal()" style="background:none; border:none; font-size:20px; cursor:pointer; color:#64748b;">&times;</button>
        </div>

        <div class="modal-body" style="display:flex; flex-direction:column; gap:16px; font-size:12px;">
          <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:14px;">
            <strong style="color:#36657c; display:block; margin-bottom:4px;">Detection Summary:</strong>
            <p style="color:#0c4a6e; font-weight:500;">${r.evidence_summary}</p>
          </div>

          <div style="border:1px solid #e2e8f0; border-radius:10px; padding:14px; background:#ffffff;">
            <strong style="display:block; margin-bottom:8px; color:#334155;">Multi-Signal Breakdown:</strong>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>Column Match: <strong>${sb.column_matched ? '✓ Matched pattern' : '✗ No match'}</strong></div>
              <div>Negative Penalty: <strong>${sb.negative_column_match ? '⚠️ Applied' : 'None'}</strong></div>
              <div>Value Match Ratio: <strong>${Math.round((sb.value_match_ratio || 0) * 100)}%</strong></div>
              <div>Format Validator: <strong>${Math.round((sb.validator_pass_ratio || 0) * 100)}%</strong></div>
            </div>
          </div>

          <div>
            <strong style="display:block; margin-bottom:6px; color:#334155;">Redacted Sample Values (Zero-Exposure):</strong>
            <div style="background:#0f172a; color:#34d399; font-family:'JetBrains Mono',monospace; padding:12px 14px; border-radius:10px; font-size:11px; line-height:1.6;">
              ${r.sample_values_masked && r.sample_values_masked.length > 0
                ? r.sample_values_masked.map((v, i) => `<div>[${i+1}] ${v}</div>`).join('')
                : '<div>No samples available</div>'}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button onclick="closeModal()" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `;
}

// Review Decision Modal
function openReviewModal(recordId) {
  const r = state.inventory.find(i => i.id === recordId) ||
            (state.gapsReport?.gap_records.find(i => i.id === recordId));
  if (!r) return;
  state.reviewRecord = r;

  const modal = document.getElementById('modal-container');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div>
            <span style="font-size:10px; font-weight:700; color:#488099; text-transform:uppercase; letter-spacing:0.05em;">Human-in-the-Loop Review</span>
            <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin-top:2px;">${r.column_name}</h3>
          </div>
          <button onclick="closeModal()" style="background:none; border:none; font-size:20px; cursor:pointer; color:#64748b;">&times;</button>
        </div>

        <div class="modal-body" style="display:flex; flex-direction:column; gap:16px; font-size:12px;">
          <div>
            <label style="font-weight:700; display:block; margin-bottom:6px;">Decision</label>
            <div style="display:flex; gap:10px;">
              <button onclick="submitReviewDecision('CONFIRMED')" class="btn btn-primary" style="flex:1; justify-content:center; background:#047857; border-color:#065f46; padding:10px;">
                ✓ Confirm as Personal Data (PII)
              </button>
              <button onclick="submitReviewDecision('REJECTED')" class="btn btn-danger" style="flex:1; justify-content:center; padding:10px;">
                ✕ Reject / Suppress
              </button>
            </div>
          </div>

          <div>
            <label style="font-weight:700; display:block; margin-bottom:4px;">Reviewer Notes & Justification</label>
            <textarea id="modal-rev-notes" style="width:100%; height:80px; padding:10px; border:1px solid #cbd5e1; border-radius:8px; font-size:12px;" placeholder="Optional justification or regulatory rationale...">${r.reviewer_notes || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

async function submitReviewDecision(status) {
  const r = state.reviewRecord;
  if (!r) return;
  const notes = document.getElementById('modal-rev-notes')?.value || `Decision: ${status}`;

  try {
    const res = await fetch(`/api/inventory/${r.id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_status: status, reviewer_notes: notes })
    });
    if (!res.ok) throw new Error('Review failed');
    showToast(`✓ Field "${r.column_name}" marked as ${status}`, 'success');
    closeModal();
    await updateSidebarPendingBadge();
    await renderActiveView();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

function openNewMetadataModal() {
  const modal = document.getElementById('modal-container');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3 style="font-size:16px; font-weight:800;">Register Declared Processing Purpose & Retention</h3>
          <button onclick="closeModal()" style="background:none; border:none; font-size:20px; cursor:pointer; color:#64748b;">&times;</button>
        </div>

        <div class="modal-body" style="display:flex; flex-direction:column; gap:14px; font-size:12px;">
          <div>
            <label style="font-weight:700; display:block; margin-bottom:4px;">Column Name *</label>
            <input type="text" id="m-col" style="width:100%;" placeholder="e.g. email_id or pan_number"/>
          </div>
          <div>
            <label style="font-weight:700; display:block; margin-bottom:4px;">Dataset Name (Optional)</label>
            <input type="text" id="m-ds" style="width:100%;" placeholder="e.g. synthetic_customers.csv"/>
          </div>
          <div>
            <label style="font-weight:700; display:block; margin-bottom:4px;">Table Name (Optional)</label>
            <input type="text" id="m-tbl" style="width:100%;" placeholder="e.g. customers"/>
          </div>
          <div>
            <label style="font-weight:700; display:block; margin-bottom:4px;">Declared Purpose</label>
            <textarea id="m-purp" style="width:100%; height:60px;" placeholder="e.g. Account onboarding and transactional communications"></textarea>
          </div>
          <div>
            <label style="font-weight:700; display:block; margin-bottom:4px;">Retention Period</label>
            <input type="text" id="m-ret" style="width:100%;" placeholder="e.g. 7 years post-account closure"/>
          </div>
        </div>

        <div class="modal-footer">
          <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
          <button onclick="saveNewMetadata()" class="btn btn-primary">Save Notice</button>
        </div>
      </div>
    </div>
  `;
}

async function saveNewMetadata() {
  const col = document.getElementById('m-col').value;
  if (!col.trim()) return showToast('Column Name is required', 'warning');

  try {
    const res = await fetch('/api/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        column_name: col.trim(),
        dataset_name: document.getElementById('m-ds').value.trim(),
        table_name: document.getElementById('m-tbl').value.trim(),
        declared_purpose: document.getElementById('m-purp').value.trim(),
        retention_period: document.getElementById('m-ret').value.trim(),
        last_reviewed_date: new Date().toISOString().split('T')[0]
      })
    });
    if (!res.ok) throw new Error('Save failed');
    showToast('✓ Metadata notice registered successfully!', 'success');
    closeModal();
    renderActiveView();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

function closeModal(event) {
  if (event && event.target && !event.target.classList.contains('modal-overlay')) {
    return;
  }
  document.getElementById('modal-container').innerHTML = '';
}

// 10. DPDP Act 2023 Statutory Compliance Matrix View
async function renderDPDP(container) {
  const res = await fetch('/api/dpdp/matrix');
  const data = await res.json();
  state.dpdpData = data;

  const scoreColor = data.overall_readiness_score >= 80 ? '#10b981' : (data.overall_readiness_score >= 60 ? '#f59e0b' : '#ef4444');
  const riskBadgeClass = data.risk_level.includes('LOW') ? 'badge-confirmed' : (data.risk_level.includes('MODERATE') ? 'badge-pending' : 'badge-rejected');

  container.innerHTML = `
    <!-- Top Summary Card: 2 equal-height cards -->
    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:24px; margin-bottom:24px;">
      <!-- Readiness Gauge Card -->
      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:32px 24px;">
        <span style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">DPDP Statutory Readiness</span>
        <div style="font-size:52px; font-weight:900; color:${scoreColor}; margin:12px 0; font-family:'JetBrains Mono',monospace;">${data.overall_readiness_score}%</div>
        <div><span class="badge ${riskBadgeClass}" style="font-size:12px; padding:4px 12px;">${data.risk_level}</span></div>
        <p style="font-size:11px; color:#64748b; margin-top:14px; max-width:260px;">Scored across statutory principles of the Digital Personal Data Protection Act, 2023.</p>
      </div>

      <!-- Audit Integrity & Differentiators Card -->
      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div class="card-header" style="margin-bottom:12px; padding-bottom:10px;">
            <h3 class="card-title" style="display:flex; align-items:center; gap:8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#488099" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Cryptographic Tamper-Evident Audit Seal
            </h3>
            <span style="font-size:10px; font-family:'JetBrains Mono',monospace; background:#e0f2fe; color:#36657c; padding:2px 8px; border-radius:6px; font-weight:700;">DPBI Sec 16 Non-Repudiation</span>
          </div>
          
          <div class="seal-box">
            <span style="font-size:11px;">${data.tamper_evident_seal_sha256}</span>
            <button onclick="navigator.clipboard.writeText('${data.tamper_evident_seal_sha256}'); showToast('✓ Audit seal copied to clipboard!', 'info');" class="btn btn-secondary" style="font-size:10px; padding:4px 8px; background:#1e293b; color:#f0f9ff; border-color:#334155; white-space:nowrap;">Copy Seal</button>
          </div>
          <p style="font-size:11px; color:#64748b; margin-top:8px;">Deterministic SHA-256 fingerprint generated over discovery inventory records, retention schedules, and timestamp metadata. Guarantees immutable evidentiary integrity for Data Protection Board of India (DPBI) audits.</p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-top:16px; padding-top:16px; border-top:1px solid #e2e8f0;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px;">
            <div style="font-size:10px; color:#64748b; font-weight:600;">Verhoeff ($D_5$) Checksum</div>
            <div style="font-size:13px; font-weight:800; color:#0f172a; margin-top:2px;">Dihedral Algorithmic</div>
            <div style="font-size:10px; color:#10b981; font-weight:600; margin-top:2px;">Official UIDAI Checksum</div>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px;">
            <div style="font-size:10px; color:#64748b; font-weight:600;">Entity-Aware PAN Tax ID</div>
            <div style="font-size:13px; font-weight:800; color:#0f172a; margin-top:2px;">4th Char Inspection</div>
            <div style="font-size:10px; color:#488099; font-weight:600; margin-top:2px;">Corporate Noise Suppressed</div>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px;">
            <div style="font-size:10px; color:#64748b; font-weight:600;">DPDP Sec 9 Minor Protection</div>
            <div style="font-size:13px; font-weight:800; color:#0f172a; margin-top:2px;">Age &lt; 18 Consent Flag</div>
            <div style="font-size:10px; color:#f59e0b; font-weight:600; margin-top:2px;">Children's Data Protected</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statutory Principles Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">DPDP Act 2023 Statutory Principles Breakdown</h3>
          <p class="card-subtitle">Evaluation of personal data discovery inventory against the statutory mandate</p>
        </div>
        <a href="/api/reports/dpdp.pdf" target="_blank" class="btn btn-primary" style="background:#488099; border-color:#36657c; font-size:12px;">
          ${icons.dashboard} Download Official DPDP Dossier (PDF)
        </a>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th style="width:110px;">Section</th>
              <th>Statutory Principle</th>
              <th>Status</th>
              <th style="width:140px;">Readiness Score</th>
              <th>Technical Action Items</th>
            </tr>
          </thead>
          <tbody>
            ${data.principles.map(p => {
              const statusBadge = p.status === 'COMPLIANT'
                ? '<span class="badge badge-complete">COMPLIANT</span>'
                : (p.status === 'ACTION_REQUIRED' ? '<span class="badge badge-missing-p">ACTION REQUIRED</span>' : '<span class="badge badge-missing-b">CRITICAL GAP</span>');
              const barColor = p.score >= 80 ? '#10b981' : (p.score >= 50 ? '#488099' : '#ef4444');
              return `
                <tr>
                  <td style="font-family:'JetBrains Mono',monospace; font-weight:700; color:#334155;">${p.statutory_section}</td>
                  <td>
                    <strong>${p.principle}</strong>
                    <div style="font-size:11px; color:#64748b; margin-top:2px;">${p.description}</div>
                  </td>
                  <td>${statusBadge}</td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div style="flex:1; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;">
                        <div style="width:${p.score}%; height:100%; background:${barColor};"></div>
                      </div>
                      <span style="font-size:11px; font-family:'JetBrains Mono',monospace; font-weight:700;">${p.score}%</span>
                    </div>
                  </td>
                  <td style="font-size:11px; color:#488099;">
                    ${p.action_items && p.action_items.length > 0
                      ? p.action_items.map(a => `<div>• ${a}</div>`).join('')
                      : 'None required'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 11. What-If Sensitivity Simulator View
async function renderSimulator(container) {
  const p = state.simParams;

  container.innerHTML = `
    <!-- Top Callout -->
    <div style="background: linear-gradient(135deg, #16202c 0%, #315267 60%, #488099 100%); border-radius:14px; padding:22px 26px; color:#ffffff; margin-bottom:24px; box-shadow:0 4px 16px rgba(22,32,44,0.18); border:1px solid #315267;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <span style="font-size:10px; font-weight:800; background:rgba(255,255,255,0.2); color:#ffffff; padding:2px 8px; border-radius:10px; text-transform:uppercase;">Simulation & What-If Studio</span>
          <h3 style="font-size:18px; font-weight:800; margin-top:6px;">Multi-Signal Weight & Threshold Tuning</h3>
          <p style="font-size:12px; color:#cbd5e1; max-width:620px; margin-top:2px;">Adjust signal weights and confidence threshold in real-time. Immediately simulates discoveries, precision, recall, and suppressed corporate noise on the labelled benchmark.</p>
        </div>
        <button onclick="resetSimParams()" class="btn btn-secondary" style="background:rgba(255,255,255,0.15); color:white; border-color:rgba(255,255,255,0.3); font-size:11px;">Reset Defaults</button>
      </div>
    </div>

    <!-- Sliders Grid: 4 distinct framed cards -->
    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:20px; margin-bottom:24px;">
      <!-- Column Pattern Weight -->
      <div class="slider-box">
        <div class="slider-header">
          <label class="slider-title">Column Pattern Weight</label>
          <span id="lbl-col-w" class="slider-val">${p.column_weight.toFixed(2)}</span>
        </div>
        <input type="range" id="rng-col-w" min="0" max="1" step="0.05" value="${p.column_weight}" oninput="updateSimParam('column_weight', this.value)"/>
        <p class="slider-desc">Weight for header regex match (e.g. email, pan, phone)</p>
      </div>

      <!-- Value Regex Weight -->
      <div class="slider-box">
        <div class="slider-header">
          <label class="slider-title">Value Pattern Match</label>
          <span id="lbl-val-w" class="slider-val">${p.value_weight.toFixed(2)}</span>
        </div>
        <input type="range" id="rng-val-w" min="0" max="1" step="0.05" value="${p.value_weight}" oninput="updateSimParam('value_weight', this.value)"/>
        <p class="slider-desc">Weight for data value pattern conformance ratio</p>
      </div>

      <!-- Validator Bonus -->
      <div class="slider-box">
        <div class="slider-header">
          <label class="slider-title">Validator Bonus</label>
          <span id="lbl-bon-w" class="slider-val">${p.validator_bonus.toFixed(2)}</span>
        </div>
        <input type="range" id="rng-bon-w" min="0" max="0.30" step="0.05" value="${p.validator_bonus}" oninput="updateSimParam('validator_bonus', this.value)"/>
        <p class="slider-desc">Bonus for passing Verhoeff checksum or entity checks</p>
      </div>

      <!-- Threshold -->
      <div class="slider-box">
        <div class="slider-header">
          <label class="slider-title">Decision Threshold</label>
          <span id="lbl-thresh" class="slider-val">${p.threshold.toFixed(2)}</span>
        </div>
        <input type="range" id="rng-thresh" min="0.1" max="1.0" step="0.05" value="${p.threshold}" oninput="updateSimParam('threshold', this.value)"/>
        <p class="slider-desc">Minimum score required to flag candidate personal data</p>
      </div>
    </div>

    <!-- Live Simulation Output Box -->
    <div id="sim-output-pane">
      <div class="card" style="text-align:center; padding:36px; color:#64748b;">Computing live simulation metrics...</div>
    </div>
  `;

  runSimulation();
}

function updateSimParam(param, val) {
  state.simParams[param] = parseFloat(val);
  const lblMap = {
    column_weight: 'lbl-col-w',
    value_weight: 'lbl-val-w',
    validator_bonus: 'lbl-bon-w',
    threshold: 'lbl-thresh'
  };
  const el = document.getElementById(lblMap[param]);
  if (el) el.textContent = parseFloat(val).toFixed(2);
  runSimulation();
}

function resetSimParams() {
  state.simParams = { column_weight: 0.40, value_weight: 0.45, validator_bonus: 0.15, threshold: 0.50 };
  renderSimulator(document.getElementById('view-container'));
}

let simDebounceTimer = null;
function runSimulation() {
  clearTimeout(simDebounceTimer);
  simDebounceTimer = setTimeout(async () => {
    await executeSimulation();
  }, 120);
}

async function executeSimulation() {
  const pane = document.getElementById('sim-output-pane');
  if (!pane) return;

  try {
    const res = await fetch('/api/scanner/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.simParams)
    });
    if (!res.ok) throw new Error('Simulation endpoint failed');
    const s = await res.json();
    state.simData = s;

    const f1Pct = Math.round(s.macro_f1 * 100);
    const precPct = Math.round(s.macro_precision * 100);
    const recPct = Math.round(s.macro_recall * 100);

    pane.innerHTML = `
      <div>
        <!-- Live Simulated KPIs -->
        <div class="kpi-grid" style="margin-bottom:20px;">
          <div class="kpi-card" style="background:#f0fdf4; border-color:#bbf7d0;">
            <div class="kpi-label" style="color:#15803d;">Simulated Macro F1</div>
            <div class="kpi-val" style="color:#15803d;">${f1Pct}%</div>
            <div class="kpi-sub" style="color:#15803d;">Harmonic accuracy</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Simulated Precision</div>
            <div class="kpi-val">${precPct}%</div>
            <div class="kpi-sub">True positive accuracy</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Simulated Recall</div>
            <div class="kpi-val">${recPct}%</div>
            <div class="kpi-sub">Coverage across test set</div>
          </div>
          <div class="kpi-card" style="background:#f0f9ff; border-color:#bcdbe7;">
            <div class="kpi-label" style="color:#36657c;">False Positives Suppressed</div>
            <div class="kpi-val" style="color:#36657c;">${s.false_positives_suppressed}</div>
            <div class="kpi-sub" style="color:#36657c;">Non-personal filtered</div>
          </div>
        </div>

        <!-- Candidate Distribution -->
        <div class="card" style="margin-bottom:0;">
          <div class="card-header">
            <div>
              <h4 class="card-title">Class Distribution & Candidates Discovered (${s.total_candidates_found})</h4>
              <p class="card-subtitle">Real-time breakdown based on current weight coefficients</p>
            </div>
          </div>
          
          <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:12px; margin-bottom:20px;">
            ${Object.entries(s.class_distribution).map(([cls, cnt]) => `
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; text-align:center;">
                <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase;">${cls.replace('_', ' ')}</div>
                <div style="font-size:22px; font-weight:800; color:#0f172a; margin-top:4px; font-family:'JetBrains Mono',monospace;">${cnt}</div>
              </div>
            `).join('')}
          </div>

          <h4 style="font-size:13px; font-weight:700; margin-bottom:10px; color:#334155;">Confidence Spread Spectrum</h4>
          <div style="display:flex; gap:16px;">
            ${Object.entries(s.confidence_spread).map(([rng, cnt]) => `
              <div style="flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; font-size:12px;">
                <span style="color:#64748b; font-weight:600;">Band ${rng}:</span>
                <strong style="color:#0f172a; margin-left:4px; font-family:'JetBrains Mono',monospace;">${cnt} fields</strong>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    pane.innerHTML = `<div class="card" style="color:#b91c1c; background:#fef2f2;">Simulation error: ${err.message}</div>`;
  }
}

// Initial Launch
document.addEventListener('DOMContentLoaded', () => {
  renderActiveView();
  updateSidebarPendingBadge();
});
