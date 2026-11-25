// PrivacyLens — Application Logic
// Human-crafted, accessible (WCAG 2.1 AA/AAA), light-theme

const state = {
  currentTab: 'dashboard',
  dashboardSegment: 'overview',
  studioTab: 'sensitivity',
  selectedBlastTarget: null,
  auditVerified: false,
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
  reviewActiveChip: 'all',
  sidebarCollapsed: false
};

function switchDashboardSegment(segment) {
  state.dashboardSegment = segment;
  const container = document.getElementById('view-container');
  if (container) renderDashboard(container);
}

// Clean SVG Icons (Feather / Lucide style, no emojis)
const icons = {
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  file: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  database: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  copy: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
};


function switchStudioTab(tab) {
  state.studioTab = tab;
  const container = document.getElementById('view-container');
  if (container) renderSimulator(container);
}

async function runAuditVerification() {
  const btn = document.getElementById('btn-verify-audit');
  const txt = document.getElementById('audit-chain-text');
  if (btn) btn.disabled = true;
  if (txt) txt.innerHTML = `<span style="color:#059669; font-weight:600;">Verifying cryptographic SHA-256 Merkle chain across all ledger blocks...</span>`;

  try {
    const res = await fetch('/api/audit/verify', { method: 'POST' });
    const data = await res.json();
    state.auditVerified = true;
    showToast(`Audit Ledger Verified: ${data.total_blocks} blocks valid, zero tampering detected.`, 'success');

    if (txt) {
      txt.innerHTML = `
        <span style="color:#065f46; font-weight:700;">Verified & Bull; All ${data.total_blocks} Blocks Untampered</span>
        <span style="font-family:'JetBrains Mono',monospace; font-size:10px; color:#475569; display:block; margin-top:2px;">
          Genesis: ${data.genesis_hash.slice(0, 16)}... &bull; Head: ${data.latest_hash.slice(0, 16)}...
        </span>
      `;
    }
    if (btn) {
      btn.className = "btn btn-primary btn-sm";
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Verified Intact`;
    }
  } catch (err) {
    showToast(`Audit verification error: ${err.message}`, 'error');
    if (btn) btn.disabled = false;
  }
}

// Keyboard shortcuts for Review Queue (C = Confirm, R = Reject, E = Evidence)
if (!window._reviewKeydownBound) {
  window._reviewKeydownBound = true;
  window.addEventListener('keydown', (e) => {
    if (state.currentTab !== 'reviewcenter') return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    const firstPending = state.inventory?.find(r => r.review_status === 'PENDING');
    if (!firstPending) return;

    if (e.key === 'c' || e.key === 'C') {
      submitReview(firstPending.id, 'CONFIRMED');
    } else if (e.key === 'r' || e.key === 'R') {
      submitReview(firstPending.id, 'REJECTED');
    } else if (e.key === 'e' || e.key === 'E') {
      openEvidenceModal(firstPending.id);
    }
  });
}

// Sidebar Toggle Function
function toggleSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  state.sidebarCollapsed = !state.sidebarCollapsed;
  if (sidebar) {
    sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
  }
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', (!state.sidebarCollapsed).toString());
  }
}

// Accessible Toast Notifications
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? icons.check : type === 'error' ? icons.x : icons.info}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Sidebar Pending Review Count Badge
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
        badge.setAttribute('aria-label', `${pending} items awaiting review`);
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (e) {
    // silently fail
  }
}

// 1-Click Discovery Action
async function runOneClickDiscovery() {
  const btns = [
    document.getElementById('btn-1click-discovery'),
    document.getElementById('btn-sidebar-quickscan')
  ].filter(Boolean);

  btns.forEach(b => {
    b.disabled = true;
    b.innerHTML = `<span style="display:inline-block; animation:spin 1s linear infinite;" aria-hidden="true">&#x25F3;</span> Running Discovery...`;
  });

  try {
    const res = await fetch('/api/scans/scan-all', { method: 'POST' });
    if (!res.ok) throw new Error('Discovery scan failed to complete');
    const data = await res.json();
    showToast(`Discovery scan complete: found ${data.total_candidates_found} candidates across ${data.scans_completed} datasets.`, 'success');
    await updateSidebarPendingBadge();
    await renderActiveView();
  } catch (err) {
    showToast(`Discovery failed: ${err.message}`, 'error');
  } finally {
    btns.forEach(b => {
      b.disabled = false;
      b.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><polyline points="8 11 10 13 14 9"/></svg> Run Discovery Scan`;
    });
  }
}

// Reset Demo Environment
async function resetDemoData() {
  if (!confirm("Reset demo databases and compliance registers to fresh initial state?")) return;
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Reset failed');
    showToast('Demo environment reset successfully.', 'success');
    await updateSidebarPendingBadge();
    await renderActiveView();
  } catch (err) {
    showToast(`Reset error: ${err.message}`, 'error');
  }
}

// Accessible High-Contrast Badges
function renderClassBadge(cls) {
  const map = {
    person_name: ['badge-name', 'Person Name'],
    email_address: ['badge-email', 'Email Address'],
    phone_number: ['badge-phone', 'Phone Number'],
    government_id: ['badge-govid', 'Government ID'],
    date_of_birth: ['badge-dob', 'Date of Birth'],
    financial_identifier: ['badge-financial', 'Financial (UPI / Bank)'],
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
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 85 ? '#059669' : pct >= 70 ? '#24556d' : '#d97706';
  return `
    <div style="display:flex; align-items:center; gap:8px;" aria-label="Confidence score: ${pct}%">
      <div style="width:48px; background:#e2e8f0; height:6px; border-radius:3px; overflow:hidden;" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div style="width:${pct}%; height:100%; background:${color}; border-radius:3px;"></div>
      </div>
      <span style="font-size:11px; font-family:'JetBrains Mono',monospace; font-weight:600; color:#334155;">${pct}%</span>
    </div>
  `;
}

// Navigation Handler
function navigateTo(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(el => {
    const isActive = el.dataset.tab === tab;
    el.classList.toggle('active', isActive);
    if (isActive) {
      el.setAttribute('aria-current', 'page');
    } else {
      el.removeAttribute('aria-current');
    }
  });
  renderActiveView();
}

// Main View Dispatcher
async function renderActiveView() {
  const container = document.getElementById('view-container');
  const headerTitle = document.getElementById('header-title');
  const headerSub = document.getElementById('header-sub');

  const titles = {
    dashboard: ['Dashboard', 'System status, discovery metrics, and evidence telemetry'],
    datasources: ['Data Sources', 'Connected CSV files, SQLite databases, and schema inspection'],
    scandata: ['Personal Data Scanner', 'Multi-signal discovery across database columns and formats'],
    inventory: ['Evidence Inventory', 'Master catalog mapping personal data to declared purposes'],
    purposeretention: ['Purpose & Retention', 'Documented processing grounds and statutory retention schedules'],
    evidencegaps: ['Compliance Gaps', 'Identified gaps: missing notices, indefinite retention, and unreviewed fields'],
    evaluation: ['Accuracy Benchmark', 'Precision, recall, and harmonic F1 evaluated against ground truth'],
    reviewcenter: ['Review Queue', 'Triage center to confirm or reject candidate personal data fields'],
    settings: ['Detection Rules', 'YAML pattern configurations and scoring weights'],
    dpdp: ['DPDP Act 2023', 'Statutory readiness, Aadhaar Verhoeff validation, and compliance seal'],
    simulator: ['Sensitivity Studio', 'Live parameter and threshold optimization on benchmark data']
  };

  headerTitle.textContent = titles[state.currentTab][0];
  headerSub.textContent = titles[state.currentTab][1];
  container.innerHTML = `<div style="padding:48px; text-align:center; color:#64748b;" role="status">Loading ${titles[state.currentTab][0]}...</div>`;

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
    container.innerHTML = `
      <div class="card" style="border-color:#fecaca; background:#fef2f2; color:#991b1b; padding:20px;" role="alert">
        <strong>Error loading view:</strong> ${err.message}
      </div>
    `;
  }
}

// ============================================================================
// PrivacyLens Dual-Core Compliance Prism & AI Privacy Governance Analyst
// ============================================================================
function renderPrismHeroHtml() {
  return `
    <div class="prism-scene" id="prism-scene" role="img" aria-label="PrivacyLens Compliance Prism: Enterprise estate streamed through statutory optical lens into verified digital twin.">
      <!-- Animated SVG Conduits connecting Estate -> Lens -> Twin -->
      <svg class="prism-svg-overlay" viewBox="0 0 540 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="beamGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="#2563eb" stop-opacity="0.95"/>
          </linearGradient>
          <linearGradient id="beamGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#2563eb" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#059669" stop-opacity="0.85"/>
          </linearGradient>
        </defs>
        <!-- Conduit 1: Estate -> Lens -->
        <path d="M 145 160 C 190 160, 210 160, 235 160" stroke="url(#beamGrad1)" stroke-width="2.5" class="conduit-line" />
        <path d="M 145 135 C 185 140, 210 150, 235 155" stroke="#93c5fd" stroke-width="1.5" class="conduit-line" stroke-dasharray="4 4" />
        <path d="M 145 185 C 185 180, 210 170, 235 165" stroke="#93c5fd" stroke-width="1.5" class="conduit-line" stroke-dasharray="4 4" />

        <!-- Conduit 2: Lens -> Statutory Twin -->
        <path d="M 305 160 C 335 160, 360 160, 395 160" stroke="url(#beamGrad2)" stroke-width="2.5" class="conduit-line" />
        <path d="M 305 155 C 335 150, 360 140, 395 135" stroke="#86efac" stroke-width="1.5" class="conduit-line" stroke-dasharray="4 4" />
        <path d="M 305 165 C 335 170, 360 180, 395 185" stroke="#86efac" stroke-width="1.5" class="conduit-line" stroke-dasharray="4 4" />
      </svg>

      <!-- 1. Left Node: Enterprise Estate -->
      <div class="prism-col">
        <div class="estate-node-box" id="estate-node">
          <div class="sonar-ring"></div>
          <span style="font-size:10px; font-weight:700; text-transform:uppercase; color:#64748b; letter-spacing:0.06em;">Raw Sources</span>
          <div style="font-size:12px; font-weight:700; color:#0f172a; margin-top:1px;">Enterprise Estate</div>

          <div class="estate-server-stack">
            <div class="estate-server-tier">
              <span>customers.csv</span>
              <span class="tier-led"></span>
            </div>
            <div class="estate-server-tier">
              <span>enterprise.db</span>
              <span class="tier-led" style="animation-delay:0.4s;"></span>
            </div>
            <div class="estate-server-tier">
              <span>employees.csv</span>
              <span class="tier-led" style="animation-delay:0.8s;"></span>
            </div>
          </div>

          <span style="font-size:9.5px; font-weight:600; color:#0284c7; background:#f0f9ff; padding:2px 6px; border-radius:4px; border:1px solid #bae6fd;">
            Stream Active
          </span>
        </div>
      </div>

      <!-- 2. Center: The Privacy Lens -->
      <div class="prism-col">
        <div class="prism-center-box" id="prism-lens" title="PrivacyLens multi-signal validation prism">
          <div class="prism-outer-ring"></div>
          <div class="prism-inner-ring"></div>
          <div class="prism-core">
            <div class="prism-laser-sweep"></div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
            <span style="font-size:8px; font-weight:800; letter-spacing:0.05em; text-transform:uppercase; margin-top:2px;">Lens</span>
          </div>
        </div>
        <span style="font-size:10px; font-weight:700; color:#1f4e64; margin-top:8px; text-transform:uppercase; letter-spacing:0.05em;">
          DPDP Act Prism
        </span>
        <span style="font-size:9px; color:#64748b; font-family:'JetBrains Mono',monospace;">
          D₅ &bull; PAN &bull; UPI
        </span>
      </div>

      <!-- 3. Right Node: Statutory Digital Twin -->
      <div class="prism-col">
        <div class="twin-vault-box" id="twin-vault">
          <span style="font-size:10px; font-weight:700; text-transform:uppercase; color:#059669; letter-spacing:0.06em;">Classified Vault</span>
          <div style="font-size:12px; font-weight:700; color:#0f172a; margin-top:1px;">Statutory Twin</div>

          <div class="twin-slot-list">
            <div class="twin-slot-pill blue">
              <span>Gov ID (Aadhaar)</span>
              <span>D₅ OK</span>
            </div>
            <div class="twin-slot-pill purple">
              <span>Financial (UPI)</span>
              <span>Sec. 15</span>
            </div>
            <div class="twin-slot-pill green">
              <span>Contact (Email/Ph)</span>
              <span>Notice</span>
            </div>
          </div>

          <div class="sha-shield-orbit">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            <span>SHA-256 Sealed</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initPrismInteractivity() {
  const scene = document.getElementById('prism-scene');
  const estate = document.getElementById('estate-node');
  const lens = document.getElementById('prism-lens');
  const vault = document.getElementById('twin-vault');
  if (!scene || !estate || !lens || !vault) return;

  scene.addEventListener('pointermove', (e) => {
    const rect = scene.getBoundingClientRect();
    const dx = (e.clientX - rect.left) / rect.width - 0.5;
    const dy = (e.clientY - rect.top) / rect.height - 0.5;
    estate.style.transform = `translateY(${dy * 6}px) translateX(${dx * 4}px)`;
    lens.style.transform = `translateY(${-dy * 4}px) scale(1.03)`;
    vault.style.transform = `translateY(${-dy * 6}px) translateX(${-dx * 4}px)`;
  });

  scene.addEventListener('pointerleave', () => {
    estate.style.transform = 'translateY(0) translateX(0)';
    lens.style.transform = 'translateY(0) scale(1)';
    vault.style.transform = 'translateY(0) translateX(0)';
  });
}

// Backward-compatible alias to prevent ReferenceError if cached
function initTwinParallax() {
  try {
    initPrismInteractivity();
  } catch (e) {
    console.warn('Prism interactivity init:', e);
  }
}

function askAiAnalyst(question) {
  const inputEl = document.getElementById('ai-analyst-input');
  const q = (question || inputEl?.value || '').toLowerCase().trim();
  if (!q) return;

  if (inputEl) inputEl.value = question || inputEl.value;

  const respBox = document.getElementById('ai-analyst-response');
  if (!respBox) return;

  respBox.style.display = 'block';

  const inventory = state.inventory || [];
  const govIds = inventory.filter(r => r.candidate_class === 'government_id');
  const govNoRetention = govIds.filter(r => !r.retention_period || r.retention_period.toLowerCase().includes('missing'));
  const gaps = inventory.filter(r => r.metadata_status && r.metadata_status.includes('Missing'));

  if (q.includes('aadhaar') || q.includes('retention')) {
    if (govNoRetention.length > 0) {
      const tables = [...new Set(govNoRetention.map(r => r.table_name || r.dataset_name))].join(', ');
      respBox.innerHTML = `
        <strong>⚠️ Non-Compliance Alert:</strong> Found <strong>${govNoRetention.length} Government ID field(s)</strong> (Aadhaar / PAN) without a declared statutory retention schedule in <code>${tables}</code>.<br/>
        <em>Statutory Impact:</em> Violates <strong>DPDP Act 2023 Section 8(7)</strong> (Obligation to erase personal data upon fulfillment of purpose).<br/>
        <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;" onclick="navigateTo('evidencegaps')">Review Compliance Gaps &rarr;</button>
      `;
    } else {
      respBox.innerHTML = `<strong>✅ Compliant:</strong> All detected Government ID fields have registered retention schedules under DPDP Act Section 8(7).`;
    }
  } else if (q.includes('section 33') || q.includes('penalty') || q.includes('exposure') || q.includes('liability')) {
    respBox.innerHTML = `
      <strong>💥 Statutory Financial Exposure:</strong> Up to <strong>₹250 Crores</strong> under <strong>DPDP Act 2023 Section 33(1) Schedule 1</strong>.<br/>
      <em>Assessment:</em> Repository includes national identifiers (Aadhaar / PAN / Bank) linked across operational tables with high exposure velocity.<br/>
      <button type="button" class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="navigateTo('simulator'); switchStudioTab('blast');">Launch Blast Simulator &rarr;</button>
    `;
  } else if (q.includes('quasi') || q.includes('combination') || q.includes('identity')) {
    respBox.innerHTML = `
      <strong>🚨 Quasi-Identifier Threat Vectors Detected:</strong><br/>
      &bull; <strong>Name + Government ID:</strong> High risk of synthetic identity creation & financial account takeover.<br/>
      &bull; <strong>Name + Phone Number:</strong> High risk of targeted smishing & social engineering vectors.<br/>
      <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;" onclick="navigateTo('simulator'); switchStudioTab('blast');">Inspect Blast Radius &rarr;</button>
    `;
  } else if (q.includes('audit') || q.includes('ledger') || q.includes('verify')) {
    respBox.innerHTML = `
      <strong>🛡️ Cryptographic Integrity Verified:</strong> SHA-256 Merkle hash chain is active.<br/>
      Every triage decision is immutably appended with non-repudiation proofs for the Data Protection Board of India (DPBI).<br/>
      <button type="button" class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="runAuditVerification()">Execute Live Audit Verification &rarr;</button>
    `;
  } else {
    respBox.innerHTML = `
      <strong>Statutory Overview:</strong> Discovered <strong>${inventory.length} personal data attributes</strong> across repositories. <strong>${gaps.length} compliance gap(s)</strong> require Data Protection Officer (DPO) triage.<br/>
      <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;" onclick="navigateTo('inventory')">Open Evidence Catalog &rarr;</button>
    `;
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
    person_name: '#475569',
    email_address: '#1f4e64',
    phone_number: '#0d9488',
    government_id: '#0284c7',
    date_of_birth: '#d97706',
    financial_identifier: '#7c3aed'
  };

  const classLabels = {
    person_name: 'Person Name',
    email_address: 'Email Address',
    phone_number: 'Phone Number',
    government_id: 'Government ID',
    date_of_birth: 'Date of Birth',
    financial_identifier: 'Financial Data (UPI/Bank)'
  };

  const maxVal = Math.max(...Object.values(data.class_counts), 1);
  const currentSeg = state.dashboardSegment || 'overview';

  container.innerHTML = `
    <!-- 3D Digital Twin Hero & AI Privacy Analyst Section -->
    <div class="home-hero-section">
      <div class="home-hero-content">
        <div class="home-hero-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="12 8 8 12 12 16 16 12 12 8"/></svg>
          DPDP Act 2023 &bull; AI Discovery Engine
        </div>
        
        <h1 class="home-hero-title">
          Find, Classify & Protect <span>Personal Data</span> Across Systems
        </h1>
        
        <p class="home-hero-desc">
          Automated multi-signal discovery scans your databases and files, verifying Aadhaar (Verhoeff D₅), PAN, UPI, emails, and phone numbers to generate an immutable, audit-ready compliance evidence twin.
        </p>

        <div class="home-hero-cta">
          <button type="button" onclick="runOneClickDiscovery()" id="btn-hero-quickscan" class="btn btn-primary" style="padding:10px 18px; font-size:13.5px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><polyline points="8 11 10 13 14 9"/></svg>
            Run Discovery Scan
          </button>
          <button type="button" onclick="navigateTo('datasources')" class="btn btn-secondary" style="padding:10px 18px; font-size:13.5px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Connect Sources
          </button>
          <a href="/api/reports/dpdp.pdf" target="_blank" class="btn btn-secondary" style="padding:10px 18px; font-size:13.5px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            DPDP Dossier (PDF)
          </a>
        </div>

        <!-- AI Privacy Analyst Prompt Box -->
        <div class="ai-assistant-card">
          <div class="ai-assistant-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span style="font-size:12px; font-weight:700; color:#1e293b;">AI Privacy Governance Analyst</span>
            <span style="font-size:10.5px; color:#64748b; margin-left:auto;">Runs Offline &bull; Metadata Only</span>
          </div>

          <form onsubmit="event.preventDefault(); askAiAnalyst();" class="ai-assistant-input-row">
            <input type="text" id="ai-analyst-input" class="ai-assistant-input" placeholder="Ask AI about your data estate & DPDP compliance..." />
            <button type="submit" class="btn btn-primary btn-sm">Ask</button>
          </form>

          <div class="suggest-chips-row">
            <button type="button" class="suggest-chip" onclick="askAiAnalyst('Which tables have Aadhaar with no retention?')">🔍 Aadhaar with no retention?</button>
            <button type="button" class="suggest-chip" onclick="askAiAnalyst('What is our Section 33 penalty exposure?')">💥 Section 33 liability?</button>
            <button type="button" class="suggest-chip" onclick="askAiAnalyst('Show critical quasi-identifier combinations')">🚨 Quasi-identifiers?</button>
            <button type="button" class="suggest-chip" onclick="askAiAnalyst('Verify cryptographic audit ledger')">🛡️ Verify audit ledger</button>
          </div>

          <div id="ai-analyst-response" class="ai-response-box" style="display:none;" aria-live="polite"></div>
        </div>
      </div>

      <!-- PrivacyLens Dual-Core Compliance Prism Scene -->
      <div style="display:flex; justify-content:center; align-items:center;">
        ${renderPrismHeroHtml()}
      </div>
    </div>

    <!-- Guided Workflow Card -->
    <div class="pipeline-card">
      <div class="pipeline-header">
        <div>
          <h2 class="pipeline-title">Personal Data Discovery & Compliance Pipeline</h2>
          <p class="pipeline-desc">Four-step workflow to connect data repositories, identify personal data candidates, verify evidence, and fulfill statutory requirements.</p>
        </div>
        <div class="pipeline-actions">
          <button type="button" onclick="runOneClickDiscovery()" id="btn-1click-discovery" class="btn btn-primary">
            Run Discovery Scan
          </button>
          <button type="button" onclick="resetDemoData()" class="btn btn-secondary" title="Reset demo databases to clean state">
            Reset Demo
          </button>
        </div>
      </div>

      <div class="pipeline-steps-grid">
        <div class="pipeline-step-box" onclick="navigateTo('datasources')" tabindex="0" role="button" aria-label="Step 1: Connect Data Sources">
          <div class="step-num">1</div>
          <div class="step-info">
            <div class="step-title">Connect Sources</div>
            <div class="step-sub">CSVs & SQLite schemas</div>
            <span class="step-pill step-pill-done">${data.total_datasets} Repositories</span>
          </div>
        </div>

        <div class="pipeline-step-box" onclick="navigateTo('scandata')" tabindex="0" role="button" aria-label="Step 2: Scan Repositories">
          <div class="step-num">2</div>
          <div class="step-info">
            <div class="step-title">Scan Repositories</div>
            <div class="step-sub">Multi-signal detection</div>
            <span class="step-pill step-pill-active">${data.total_candidates} Fields Found</span>
          </div>
        </div>

        <div class="pipeline-step-box" onclick="navigateTo('reviewcenter')" tabindex="0" role="button" aria-label="Step 3: Review Candidates">
          <div class="step-num">3</div>
          <div class="step-info">
            <div class="step-title">Review Queue</div>
            <div class="step-sub">Human-in-the-loop triage</div>
            <span class="step-pill ${pendingCount > 0 ? 'step-pill-warn' : 'step-pill-done'}">${pendingCount > 0 ? pendingCount + ' Pending' : 'All Verified'}</span>
          </div>
        </div>

        <div class="pipeline-step-box" onclick="navigateTo('dpdp')" tabindex="0" role="button" aria-label="Step 4: DPDP Compliance Report">
          <div class="step-num">4</div>
          <div class="step-info">
            <div class="step-title">DPDP Act Report</div>
            <div class="step-sub">Statutory compliance dossier</div>
            <span class="step-pill step-pill-active">View Dossier &rarr;</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Core Highlights Grid (Clean 4 metrics, not overwhelming) -->
    <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 20px;">
      <div class="kpi-card">
        <div class="kpi-label">Personal Data Fields</div>
        <div class="kpi-val">${data.total_candidates}</div>
        <div class="kpi-sub">Identified personal attributes</div>
      </div>
      <div class="kpi-card" style="border-top-color:${pendingCount > 0 ? '#d97706' : '#059669'};">
        <div class="kpi-label" style="color:${pendingCount > 0 ? '#92400e' : '#065f46'};">Review Verification</div>
        <div class="kpi-val" style="color:${pendingCount > 0 ? '#92400e' : '#065f46'};">${pendingCount > 0 ? pendingCount + ' Pending' : '100% Verified'}</div>
        <div class="kpi-sub">${pendingCount > 0 ? 'Items awaiting audit approval' : 'All candidate detections vetted'}</div>
      </div>
      <div class="kpi-card" style="border-top-color:${data.missing_purpose > 0 ? '#ea580c' : '#059669'};">
        <div class="kpi-label" style="color:${data.missing_purpose > 0 ? '#9a3412' : '#065f46'};">Notice Status (Sec. 5)</div>
        <div class="kpi-val" style="color:${data.missing_purpose > 0 ? '#9a3412' : '#065f46'};">${data.missing_purpose > 0 ? data.missing_purpose + ' Notice Gaps' : '100% Notice Documented'}</div>
        <div class="kpi-sub">${data.missing_purpose > 0 ? 'Declared processing notice missing' : 'All fields have legal grounds'}</div>
      </div>
      <div class="kpi-card" style="border-top-color:${data.missing_retention > 0 ? '#dc2626' : '#059669'};">
        <div class="kpi-label" style="color:${data.missing_retention > 0 ? '#991b1b' : '#065f46'};">Retention Schedule (Sec. 8)</div>
        <div class="kpi-val" style="color:${data.missing_retention > 0 ? '#991b1b' : '#065f46'};">${data.missing_retention > 0 ? data.missing_retention + ' Retention Gaps' : '100% Retention Configured'}</div>
        <div class="kpi-sub">${data.missing_retention > 0 ? 'Storage period unspecified' : 'Erasure schedules documented'}</div>
      </div>
    </div>

    <!-- Progressive Disclosure Segmented Tabs -->
    <div class="tab-segment-bar" role="tablist" aria-label="Dashboard views">
      <button type="button" role="tab" class="tab-segment-btn ${currentSeg === 'overview' ? 'active' : ''}" onclick="switchDashboardSegment('overview')" aria-selected="${currentSeg === 'overview'}">
        Action Items & Statutory Compliance
      </button>
      <button type="button" role="tab" class="tab-segment-btn ${currentSeg === 'analytics' ? 'active' : ''}" onclick="switchDashboardSegment('analytics')" aria-selected="${currentSeg === 'analytics'}">
        Class Distribution & Confidence Spectrum
      </button>
      <button type="button" role="tab" class="tab-segment-btn ${currentSeg === 'scans' ? 'active' : ''}" onclick="switchDashboardSegment('scans')" aria-selected="${currentSeg === 'scans'}">
        Scan Activity History (${data.recent_scans ? data.recent_scans.length : 0})
      </button>
    </div>

    <!-- Segment 1: Action Items & Compliance -->
    ${currentSeg === 'overview' ? `
      <div class="card" style="border-left:3px solid var(--brand-primary); margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--brand-primary); text-transform:uppercase; letter-spacing:0.04em;">
              Statutory Alignment &bull; Digital Personal Data Protection Act, 2023
            </div>
            <h3 style="font-size:15px; font-weight:700; color:#0f172a; margin-top:2px;">
              Statutory Evidence & Regulatory Compliance Status
            </h3>
            <p style="font-size:12px; color:#475569; max-width:720px; margin-top:3px; line-height:1.5;">
              Evaluates discovered data assets against Section 5 (Notice requirement), Section 8(7) (Retention limit and erasure schedules), and Section 9 (Protection of minors' data).
            </p>
          </div>
          <div style="display:flex; gap:8px;">
            <button type="button" onclick="navigateTo('dpdp')" class="btn btn-primary btn-sm">Inspect DPDP Matrix &rarr;</button>
            <button type="button" onclick="navigateTo('evidencegaps')" class="btn btn-secondary btn-sm">Review Compliance Gaps</button>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
        <div class="card" style="margin-bottom:0; cursor:pointer;" onclick="navigateTo('inventory')">
          <h4 style="font-size:13px; font-weight:700; margin-bottom:4px; color:#0f172a;">Evidence Inventory Catalog</h4>
          <p style="font-size:12px; color:#64748b; line-height:1.4;">Browse the complete technical inventory linking detected columns to business purpose and retention rules.</p>
          <div style="margin-top:12px; font-size:12px; font-weight:600; color:var(--brand-primary);">Open Inventory &rarr;</div>
        </div>

        <div class="card" style="margin-bottom:0; cursor:pointer;" onclick="navigateTo('simulator')">
          <h4 style="font-size:13px; font-weight:700; margin-bottom:4px; color:#0f172a;">Sensitivity Studio</h4>
          <p style="font-size:12px; color:#64748b; line-height:1.4;">Tune detection thresholds and multi-signal weights (column pattern, regex, and validation check).</p>
          <div style="margin-top:12px; font-size:12px; font-weight:600; color:var(--brand-primary);">Launch Studio &rarr;</div>
        </div>

        <div class="card" style="margin-bottom:0; cursor:pointer;" onclick="navigateTo('evaluation')">
          <h4 style="font-size:13px; font-weight:700; margin-bottom:4px; color:#0f172a;">Accuracy Benchmark</h4>
          <p style="font-size:12px; color:#64748b; line-height:1.4;">Review Precision, Recall, and F1 performance evaluated against the labelled synthetic ground truth.</p>
          <div style="margin-top:12px; font-size:12px; font-weight:600; color:var(--brand-primary);">View Benchmark &rarr;</div>
        </div>
      </div>
    ` : ''}

    <!-- Segment 2: Analytics & Charts -->
    ${currentSeg === 'analytics' ? `
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; margin-bottom:20px;">
        <!-- Class Distribution Card -->
        <div class="card" style="margin-bottom:0;">
          <div class="card-header">
            <div>
              <h3 class="card-title">Personal Data Class Distribution</h3>
              <p class="card-subtitle">Candidate fields identified across statutory categories</p>
            </div>
            <button type="button" onclick="navigateTo('inventory')" class="btn btn-secondary btn-sm">View Inventory &rarr;</button>
          </div>

          <div style="height:190px; display:flex; align-items:flex-end; gap:20px; padding:0 8px 10px 8px; border-bottom:1px solid #e2e8f0;" aria-label="Class distribution bar chart">
            ${Object.entries(data.class_counts).map(([k, count]) => {
    const h = Math.max((count / maxVal) * 140, count > 0 ? 18 : 6);
    const color = classColors[k] || '#475569';
    return `
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
                  <span style="font-size:12px; font-family:'JetBrains Mono',monospace; font-weight:600; color:#1e293b;">${count}</span>
                  <div style="width:100%; max-width:44px; height:${h}px; background:${color}; border-radius:4px 4px 0 0;" title="${classLabels[k]}: ${count}"></div>
                </div>
              `;
  }).join('')}
          </div>
          <div style="display:flex; gap:20px; margin-top:10px; padding:0 8px;">
            ${Object.entries(data.class_counts).map(([k]) => `
              <div style="flex:1; text-align:center; font-size:11px; font-weight:500; color:#475569; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${classLabels[k]}">
                ${classLabels[k]}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Confidence Spectrum Card -->
        <div class="card" style="margin-bottom:0;">
          <div class="card-header">
            <div>
              <h3 class="card-title">Confidence Spectrum</h3>
              <p class="card-subtitle">Engine confidence distribution</p>
            </div>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:14px;">
            ${Object.entries(data.confidence_distribution).map(([k, val]) => {
    const pct = data.total_candidates > 0 ? Math.round((val / data.total_candidates) * 100) : 0;
    const barCol = k.includes('Very') ? '#059669' : k.includes('High') ? '#24556d' : '#d97706';
    return `
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span style="font-weight:500; color:#334155;">${k}</span>
                    <span style="font-family:'JetBrains Mono',monospace; font-weight:600; color:#0f172a;">${val} (${pct}%)</span>
                  </div>
                  <div style="width:100%; height:7px; background:#f1f5f9; border-radius:3px; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:${barCol}; border-radius:3px;"></div>
                  </div>
                </div>
              `;
  }).join('')}
          </div>
          <div style="margin-top:20px; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:11px; color:#475569; text-align:center;">
            Multi-signal weights: <strong>40%</strong> Column &bull; <strong>45%</strong> Regex &bull; <strong>15%</strong> Validator
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Segment 3: Scan Activity Log -->
    ${currentSeg === 'scans' ? `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Recent Discovery Scans</h3>
            <p class="card-subtitle">Auditable execution history of automated personal data discovery jobs</p>
          </div>
          <button type="button" onclick="navigateTo('scandata')" class="btn btn-secondary btn-sm">Launch New Scan &rarr;</button>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th scope="col">Dataset</th>
                <th scope="col">Format</th>
                <th scope="col">Status</th>
                <th scope="col">Columns Inspected</th>
                <th scope="col">Candidates Found</th>
                <th scope="col">Execution Time</th>
              </tr>
            </thead>
            <tbody>
              ${data.recent_scans && data.recent_scans.length > 0 ? data.recent_scans.map(s => `
                <tr>
                  <td style="font-weight:600; color:#0f172a;">${s.dataset_name}</td>
                  <td><span style="font-family:'JetBrains Mono',monospace; text-transform:uppercase; font-size:10px; padding:2px 6px; background:#f1f5f9; border-radius:4px; border:1px solid #e2e8f0;">${s.source_type}</span></td>
                  <td><span class="badge badge-complete">${s.status}</span></td>
                  <td style="font-family:'JetBrains Mono',monospace;">${s.total_columns}</td>
                  <td style="font-family:'JetBrains Mono',monospace; font-weight:600; color:#24556d;">${s.candidate_count}</td>
                  <td style="color:#64748b;">${new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              `).join('') : `<tr><td colspan="6" style="text-align:center; padding:24px; color:#94a3b8;">No discovery scans recorded yet. Click 'Run Discovery Scan' above.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
  `;
  try {
    initPrismInteractivity();
  } catch (e) {
    console.warn('Prism interactivity init:', e);
  }
}


// 2. Data Sources View
async function renderDataSources(container) {
  const res = await fetch('/api/datasets');
  const datasets = await res.json();
  state.datasets = datasets;

  container.innerHTML = `
    <!-- Info Banner -->
    <div class="help-callout">
      <div>
        <strong>Local Data Connectors:</strong> Connect CSV files or SQLite databases. All data inspection runs locally within your environment with zero network exfiltration.
      </div>
      <button type="button" onclick="resetDemoData()" class="btn btn-secondary btn-sm" title="Restore default demo data">Reset Demo</button>
    </div>

    <!-- Upload Dropzones Grid -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Add CSV Dataset</h3>
            <p class="card-subtitle">Delimited format with automatic header deduplication</p>
          </div>
        </div>
        
        <label class="upload-dropzone" tabindex="0" role="button" aria-label="Upload CSV file">
          <div class="upload-dropzone-icon">${icons.file}</div>
          <span style="font-size:13px; font-weight:600; color:#24556d;">Select or Drop CSV File</span>
          <span style="font-size:11px; color:#64748b; margin-top:2px;">.csv format up to 50MB</span>
          <input type="file" accept=".csv" style="display:none;" onchange="uploadFile(event, 'csv')"/>
        </label>
      </div>

      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Add SQLite Database</h3>
            <p class="card-subtitle">Connect database file in read-only inspection mode</p>
          </div>
        </div>
        
        <label class="upload-dropzone" tabindex="0" role="button" aria-label="Upload SQLite database file">
          <div class="upload-dropzone-icon">${icons.database}</div>
          <span style="font-size:13px; font-weight:600; color:#24556d;">Select or Drop SQLite File</span>
          <span style="font-size:11px; color:#64748b; margin-top:2px;">.db, .sqlite, .sqlite3 formats</span>
          <input type="file" accept=".db,.sqlite,.sqlite3" style="display:none;" onchange="uploadFile(event, 'sqlite')"/>
        </label>
      </div>
    </div>

    <!-- Connected Datasets Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Connected Data Sources (${datasets.length})</h3>
          <p class="card-subtitle">Configured repositories ready for discovery scanning</p>
        </div>
        <div class="btn-group">
          <button type="button" onclick="runOneClickDiscovery()" class="btn btn-primary btn-sm">Scan All Sources</button>
          <button type="button" onclick="renderActiveView()" class="btn btn-secondary btn-sm">Refresh</button>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th scope="col">Dataset Name</th>
              <th scope="col">Format</th>
              <th scope="col">Tables</th>
              <th scope="col">Row Count</th>
              <th scope="col">Date Registered</th>
              <th scope="col" style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${datasets.map(ds => `
              <tr>
                <td style="font-weight:600; color:#0f172a;">${ds.name}</td>
                <td><span style="font-family:'JetBrains Mono',monospace; text-transform:uppercase; font-size:10px; padding:2px 6px; background:#f1f5f9; border-radius:4px; border:1px solid #e2e8f0;">${ds.source_type}</span></td>
                <td style="font-family:'JetBrains Mono',monospace;">${ds.table_count}</td>
                <td style="font-family:'JetBrains Mono',monospace;">${ds.row_count.toLocaleString()}</td>
                <td style="color:#64748b;">${new Date(ds.created_at).toLocaleDateString()}</td>
                <td style="text-align:right;">
                  <button type="button" onclick="inspectDatasetTables('${ds.id}')" class="btn btn-secondary btn-sm">Inspect</button>
                  <button type="button" onclick="quickScanDataset('${ds.id}', '${ds.name}')" class="btn btn-primary btn-sm">Scan</button>
                  <button type="button" onclick="deleteDataset('${ds.id}', '${ds.name}')" class="btn btn-danger btn-sm">Delete</button>
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
    showToast(`Scan complete for ${datasetName}: found ${job.candidate_count} candidate fields.`, 'success');
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
    showToast(`File "${file.name}" registered successfully.`, 'success');
    renderActiveView();
  } catch (err) {
    showToast(`Upload error: ${err.message}`, 'error');
  }
}

async function deleteDataset(id, name) {
  if (!confirm(`Delete dataset "${name}"?`)) return;
  await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
  showToast(`Deleted ${name}.`, 'info');
  renderActiveView();
}

async function inspectDatasetTables(datasetId) {
  const box = document.getElementById('schema-inspector-box');
  box.innerHTML = `<div class="card" style="padding:20px; text-align:center; color:#64748b;" role="status">Loading schema tables...</div>`;

  const res = await fetch(`/api/datasets/${datasetId}/tables`);
  const tables = await res.json();

  box.innerHTML = `
    <div class="card" style="border:1.5px solid var(--brand-primary); margin-top:20px;">
      <div class="card-header">
        <div>
          <h3 class="card-title" style="color:var(--brand-primary);">Schema Structure & Sample Values</h3>
          <p class="card-subtitle">Read-only preview of discovered column types and sanitized cell samples</p>
        </div>
        <button type="button" onclick="document.getElementById('schema-inspector-box').innerHTML=''" class="btn btn-secondary btn-sm">Close Inspector</button>
      </div>
      ${tables.map(t => `
        <div style="margin-bottom:18px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
          <div style="padding:10px 14px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-weight:600; font-size:13px; display:flex; justify-content:space-between; align-items:center;">
            <span>Table: <strong style="font-family:'JetBrains Mono',monospace; color:#0f172a;">${t.table_name}</strong></span>
            <span style="font-size:11px; color:#64748b; font-weight:500;">${t.row_count} rows &bull; ${t.columns.length} columns</span>
          </div>
          <div class="table-responsive" style="border:none; border-radius:0;">
            <table>
              <thead>
                <tr>
                  <th scope="col" style="width:200px;">Column Name</th>
                  <th scope="col" style="width:110px;">Data Type</th>
                  <th scope="col" style="width:110px;">Non-Null Count</th>
                  <th scope="col">Sanitized Sample Values</th>
                </tr>
              </thead>
              <tbody>
                ${t.columns.map(c => `
                  <tr>
                    <td style="font-family:'JetBrains Mono',monospace; font-weight:600; color:#0f172a;">${c.name}</td>
                    <td style="font-family:'JetBrains Mono',monospace; color:#64748b; font-size:11px;">${c.data_type}</td>
                    <td style="font-family:'JetBrains Mono',monospace;">${c.non_null_count}</td>
                    <td>
                      <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${c.sample_values.slice(0, 3).map(v => `<span style="background:#f1f5f9; border:1px solid #e2e8f0; padding:1px 6px; border-radius:4px; font-family:'JetBrains Mono',monospace; font-size:11px; color:#334155;">${v}</span>`).join('')}
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
      <div class="card" style="max-width:540px; margin:40px auto; text-align:center; padding:36px;">
        <h3 style="font-size:16px; font-weight:700; margin-bottom:8px;">No Datasets Configured</h3>
        <p style="font-size:13px; color:#64748b; margin-bottom:20px;">Connect a CSV or SQLite source to execute discovery scans.</p>
        <button type="button" onclick="navigateTo('datasources')" class="btn btn-primary">Go to Data Sources</button>
      </div>
    `;
    return;
  }

  const selectedDs = state.selectedScanDatasetId || datasets[0].id;

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
      <span style="font-size:13px; color:#475569;">Select a connected repository below to execute targeted discovery scans.</span>
      <button type="button" onclick="runOneClickDiscovery()" class="btn btn-primary btn-sm">Scan All Sources</button>
    </div>

    <!-- Collapsible Technical Methodology Disclosure -->
    <details class="detail-accordion" style="margin-bottom:16px;">
      <summary>
        <span>Technical Detection Methodology & Scoring Formula</span>
        <span style="font-size:11px; color:#64748b;">40% Column &bull; 45% Regex &bull; 15% Validator</span>
      </summary>
      <div class="detail-accordion-body">
        Combines column header patterns (40%), value format regular expressions (45%), and algorithmic format validators (15% Aadhaar Verhoeff, Indian Phone, Entity-aware PAN, DOB) to score confidence against statutory DPDP personal data categories.
      </div>
    </details>

    <!-- Scan Launch Card -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Run Personal Data Discovery Scan</h3>
          <p class="card-subtitle">Select a target data repository to analyze column schemas and value distributions</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:16px; align-items:flex-end;">
        <div>
          <label for="scan-dataset-select" style="font-size:12px; font-weight:600; color:#334155; display:block; margin-bottom:6px;">Target Repository</label>
          <select id="scan-dataset-select" style="width:100%;">
            ${datasets.map(d => `
              <option value="${d.id}" ${d.id === selectedDs ? 'selected' : ''}>${d.name} (${d.source_type.toUpperCase()} &bull; ${d.row_count.toLocaleString()} rows)</option>
            `).join('')}
          </select>
        </div>

        <div>
          <button type="button" onclick="executeScan()" id="btn-run-scan" class="btn btn-primary" style="width:100%; padding:10px; justify-content:center;">
            Execute Discovery Scan
          </button>
        </div>
      </div>

      <div id="scan-feedback" style="margin-top:16px;"></div>
    </div>
  `;
}

async function executeScan() {
  const dsId = document.getElementById('scan-dataset-select').value;
  const btn = document.getElementById('btn-run-scan');
  const feedback = document.getElementById('scan-feedback');

  btn.disabled = true;
  btn.textContent = 'Scanning Data...';
  feedback.innerHTML = `<div style="padding:12px; font-size:12px; color:#24556d; background:#f0f7fa; border:1px solid #bcdbe7; border-radius:6px;" role="status">Inspecting column values, calculating multi-signal confidence scores, and verifying checksums...</div>`;

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
    showToast(`Scan completed: discovered ${job.candidate_count} candidate fields.`, 'success');
    await updateSidebarPendingBadge();

    feedback.innerHTML = `
      <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h4 style="color:#065f46; font-size:14px; font-weight:700;">Discovery Scan Complete</h4>
            <p style="font-size:12px; color:#047857; margin-top:2px;">
              Inspected <strong>${job.total_columns}</strong> columns across <strong>${job.total_tables}</strong> tables.
              Discovered <strong>${job.candidate_count}</strong> personal data fields.
            </p>
          </div>
          <button type="button" onclick="navigateTo('inventory')" class="btn btn-primary btn-sm" style="background:#065f46; border-color:#065f46;">View in Inventory &rarr;</button>
        </div>
      </div>
    `;
  } catch (err) {
    feedback.innerHTML = `<div style="padding:12px; font-size:12px; color:#991b1b; background:#fef2f2; border:1px solid #fecaca; border-radius:6px;" role="alert">Scan error: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Execute Discovery Scan';
  }
}

// 4. Inventory View
async function renderInventory(container) {
  const res = await fetch('/api/inventory');
  const inventory = await res.json();
  state.inventory = inventory;

  const missingCount = inventory.filter(r => r.metadata_status && r.metadata_status.includes('Missing')).length;
  const finCount = inventory.filter(r => r.candidate_class === 'financial_identifier').length;
  const govidCount = inventory.filter(r => r.candidate_class === 'government_id').length;
  const emailCount = inventory.filter(r => r.candidate_class === 'email_address').length;
  const phoneCount = inventory.filter(r => r.candidate_class === 'phone_number').length;
  const nameCount = inventory.filter(r => r.candidate_class === 'person_name').length;
  const dobCount = inventory.filter(r => r.candidate_class === 'date_of_birth').length;

  container.innerHTML = `
    <!-- Top Callout -->
    <div class="help-callout">
      <div>
        <strong>Master Evidence Inventory:</strong> Centralized technical catalog linking each detected field to declared processing purpose, retention schedules, and review status.
      </div>
      <div class="btn-group">
        <a href="/api/reports/inventory.csv" download class="btn btn-secondary btn-sm">Export CSV</a>
        <a href="/api/reports/inventory.pdf" target="_blank" class="btn btn-primary btn-sm">Export PDF</a>
      </div>
    </div>

    <!-- Filter Chips Ribbon -->
    <div class="filter-chips-bar" role="toolbar" aria-label="Category Filters">
      <span style="font-size:11px; font-weight:600; color:#64748b; margin-right:4px;">Filter:</span>
      <button type="button" class="filter-chip ${state.invActiveChip === 'all' ? 'active' : ''}" onclick="applyInvChip('all')">All Fields (${inventory.length})</button>
      <button type="button" class="filter-chip ${state.invActiveChip === 'missing' ? 'active' : ''}" onclick="applyInvChip('missing')">Missing Notice/Retention (${missingCount})</button>
      <button type="button" class="filter-chip ${state.invActiveChip === 'financial_identifier' ? 'active' : ''}" onclick="applyInvChip('financial_identifier')">Financial Data (${finCount})</button>
      <button type="button" class="filter-chip ${state.invActiveChip === 'government_id' ? 'active' : ''}" onclick="applyInvChip('government_id')">Government IDs (${govidCount})</button>
      <button type="button" class="filter-chip ${state.invActiveChip === 'email_address' ? 'active' : ''}" onclick="applyInvChip('email_address')">Email Addresses (${emailCount})</button>
      <button type="button" class="filter-chip ${state.invActiveChip === 'phone_number' ? 'active' : ''}" onclick="applyInvChip('phone_number')">Phone Numbers (${phoneCount})</button>
      <button type="button" class="filter-chip ${state.invActiveChip === 'person_name' ? 'active' : ''}" onclick="applyInvChip('person_name')">Person Names (${nameCount})</button>
      <button type="button" class="filter-chip ${state.invActiveChip === 'date_of_birth' ? 'active' : ''}" onclick="applyInvChip('date_of_birth')">Dates of Birth (${dobCount})</button>
    </div>

    <!-- Filter Control Card -->
    <div class="card" style="margin-bottom:16px; padding:14px 18px;">
      <div class="filter-box">
        <input type="text" id="inv-search" oninput="filterInventoryTable()" placeholder="Search column, table, purpose, or dataset..." style="flex:1; min-width:240px;" aria-label="Search inventory"/>
        <select id="inv-class-filter" onchange="filterInventoryTable()" style="min-width:160px;" aria-label="Filter by data class">
          <option value="">All Categories</option>
          <option value="financial_identifier">Financial Data (UPI / Bank / IFSC)</option>
          <option value="government_id">Government ID</option>
          <option value="person_name">Person Name</option>
          <option value="email_address">Email Address</option>
          <option value="phone_number">Phone Number</option>
          <option value="date_of_birth">Date of Birth</option>
        </select>
        <select id="inv-meta-filter" onchange="filterInventoryTable()" style="min-width:170px;" aria-label="Filter by notice status">
          <option value="">All Statuses</option>
          <option value="Complete metadata">Complete</option>
          <option value="Missing purpose">Missing Purpose</option>
          <option value="Missing retention">Missing Retention</option>
          <option value="Missing both">Missing Both</option>
        </select>
        <button type="button" onclick="document.getElementById('inv-search').value=''; document.getElementById('inv-class-filter').value=''; document.getElementById('inv-meta-filter').value=''; applyInvChip('all');" class="btn btn-secondary btn-sm">Clear Filters</button>
      </div>
    </div>

    <!-- Inventory Table Card -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Technical Evidence Records</h3>
          <p class="card-subtitle">Inspected database columns and classified personal data attributes</p>
        </div>
      </div>

      <div class="table-responsive">
        <table id="inv-table">
          <thead>
            <tr>
              <th scope="col">Dataset / Table</th>
              <th scope="col">Column Name</th>
              <th scope="col">Data Class</th>
              <th scope="col">Confidence</th>
              <th scope="col">Notice Status</th>
              <th scope="col">Review Status</th>
              <th scope="col" style="text-align:right;">Actions</th>
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
    return `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No candidate detections match the current filter.</td></tr>`;
  }
  return records.map(r => `
    <tr>
      <td>
        <strong style="color:#0f172a; display:block;">${r.dataset_name}</strong>
        <span style="font-size:11px; font-family:'JetBrains Mono',monospace; color:#64748b;">${r.table_name || 'root table'}</span>
      </td>
      <td style="font-family:'JetBrains Mono',monospace; font-weight:600; color:#0f172a;">${r.column_name}</td>
      <td>${renderClassBadge(r.candidate_class)}</td>
      <td>${renderConfidenceBar(r.confidence_score)}</td>
      <td>${renderMetaBadge(r.metadata_status)}</td>
      <td>${renderReviewBadge(r.review_status)}</td>
      <td style="text-align:right; white-space:nowrap;">
        <button type="button" onclick="openEvidenceModal('${r.id}')" class="btn btn-secondary btn-sm" title="View Purpose, Retention & Detection Evidence">Evidence</button>
        <button type="button" onclick="openReviewModal('${r.id}')" class="btn btn-primary btn-sm" title="Adjudicate Candidate">Review</button>
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
        <strong>Purpose & Retention Register:</strong> Documents statutory processing grounds (e.g., account onboarding, payroll) and retention schedules required under DPDP Section 5 & 8 principles.
      </div>
      <button type="button" onclick="openNewMetadataModal()" class="btn btn-primary btn-sm">+ Add Purpose Notice</button>
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
              <th scope="col">Dataset / Table</th>
              <th scope="col">Column Name</th>
              <th scope="col">Class</th>
              <th scope="col">Declared Purpose</th>
              <th scope="col">Retention Schedule</th>
              <th scope="col">Owner</th>
              <th scope="col">Last Reviewed</th>
            </tr>
          </thead>
          <tbody>
            ${metadata.map(m => `
              <tr>
                <td><strong>${m.dataset_name || 'Global'}</strong> <span style="font-size:10px; color:#64748b; font-family:'JetBrains Mono',monospace;">${m.table_name || 'All'}</span></td>
                <td style="font-family:'JetBrains Mono',monospace; font-weight:600;">${m.column_name}</td>
                <td>${m.data_class ? renderClassBadge(m.data_class) : '&mdash;'}</td>
                <td>${m.declared_purpose || '<span style="color:#92400e; font-style:italic;">Unspecified</span>'}</td>
                <td>${m.retention_period || '<span style="color:#9a3412; font-style:italic;">Unspecified</span>'}</td>
                <td style="color:#475569;">${m.metadata_owner || 'DPO Team'}</td>
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
        <strong>Compliance Gap Diagnostics:</strong> Highlights discovered personal data fields that lack documented processing notices, indefinite retention, or unconfirmed triage.
      </div>
      <a href="/api/reports/gaps.csv" download class="btn btn-warning btn-sm">Export Gaps CSV</a>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card" style="border-top-color:#d97706;">
        <div class="kpi-label" style="color:#92400e;">Missing Purpose</div>
        <div class="kpi-val" style="color:#92400e;">${s.missing_purpose_count}</div>
        <div class="kpi-sub">No declared notice</div>
      </div>
      <div class="kpi-card" style="border-top-color:#ea580c;">
        <div class="kpi-label" style="color:#9a3412;">Missing Retention</div>
        <div class="kpi-val" style="color:#9a3412;">${s.missing_retention_count}</div>
        <div class="kpi-sub">Indefinite storage risk</div>
      </div>
      <div class="kpi-card" style="border-top-color:#dc2626;">
        <div class="kpi-label" style="color:#991b1b;">Missing Both</div>
        <div class="kpi-val" style="color:#991b1b;">${s.missing_both_count}</div>
        <div class="kpi-sub">Severe compliance gap</div>
      </div>
      <div class="kpi-card" style="border-top-color:#24556d;">
        <div class="kpi-label" style="color:#24556d;">Unreviewed</div>
        <div class="kpi-val" style="color:#24556d;">${s.unreviewed_candidate_count}</div>
        <div class="kpi-sub">Awaiting triage</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Identified Compliance Gaps (${data.gap_records.length})</h3>
          <p class="card-subtitle">Candidates lacking statutory notices, retention policies, or verified review</p>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th scope="col">Dataset / Table</th>
              <th scope="col">Field</th>
              <th scope="col">Class</th>
              <th scope="col">Confidence</th>
              <th scope="col">Identified Gap</th>
              <th scope="col">Review Status</th>
              <th scope="col" style="text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${data.gap_records.map(r => `
              <tr>
                <td><strong>${r.dataset_name}</strong> <span style="font-size:10px; font-family:'JetBrains Mono',monospace; color:#64748b;">${r.table_name}</span></td>
                <td style="font-family:'JetBrains Mono',monospace; font-weight:600;">${r.column_name}</td>
                <td>${renderClassBadge(r.candidate_class)}</td>
                <td>${renderConfidenceBar(r.confidence_score)}</td>
                <td>${renderMetaBadge(r.metadata_status)}</td>
                <td>${renderReviewBadge(r.review_status)}</td>
                <td style="text-align:right;">
                  <button type="button" onclick="openReviewModal('${r.id}')" class="btn btn-primary btn-sm">Remediate</button>
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
        <strong>Accuracy & Benchmark Metrics:</strong> Benchmarked against labelled ground-truth synthetic test cases across all five statutory personal data classes.
      </div>
      <button type="button" onclick="runLiveEvaluation()" id="btn-eval" class="btn btn-primary btn-sm">Run Accuracy Benchmark</button>
    </div>

    ${!latest || Object.keys(classMetrics).length === 0 ? `
      <div class="card" style="text-align:center; padding:36px; color:#64748b;">
        <h4 style="font-size:15px; font-weight:600; color:#0f172a; margin-bottom:6px;">No Benchmark Evaluations Recorded</h4>
        <p style="font-size:13px; margin-bottom:16px;">Execute an automated accuracy test across labelled test cases to compute precision, recall, and F1 score.</p>
        <button type="button" onclick="runLiveEvaluation()" class="btn btn-primary">Run First Accuracy Benchmark</button>
      </div>
    ` : `
      <!-- KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card" style="border-top-color:#059669;">
          <div class="kpi-label" style="color:#065f46;">Macro Precision</div>
          <div class="kpi-val" style="color:#065f46;">${((latest.overall_precision || 0) * 100).toFixed(1)}%</div>
          <div class="kpi-sub">Low false positive rate</div>
        </div>
        <div class="kpi-card" style="border-top-color:#24556d;">
          <div class="kpi-label" style="color:#24556d;">Macro Recall</div>
          <div class="kpi-val" style="color:#24556d;">${((latest.overall_recall || 0) * 100).toFixed(1)}%</div>
          <div class="kpi-sub">High coverage across test set</div>
        </div>
        <div class="kpi-card" style="border-top-color:#059669;">
          <div class="kpi-label" style="color:#065f46;">Macro F1 Score</div>
          <div class="kpi-val" style="color:#065f46;">${((latest.overall_f1 || 0) * 100).toFixed(1)}%</div>
          <div class="kpi-sub">Harmonic benchmark balance</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Test Samples</div>
          <div class="kpi-val">${totalSamples}</div>
          <div class="kpi-sub">Synthetic ground-truth fields</div>
        </div>
      </div>

      <!-- Class-by-Class Table -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Class-by-Class Benchmark Accuracy</h3>
            <p class="card-subtitle">Precision, recall, and harmonic F1 across the five personal data classes</p>
          </div>
          <span style="font-size:11px; font-family:'JetBrains Mono',monospace; color:#64748b;">Run: ${(latest.id || '').slice(0, 8)}</span>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th scope="col">Personal Data Class</th>
                <th scope="col">True Support</th>
                <th scope="col">Predicted</th>
                <th scope="col">Precision</th>
                <th scope="col">Recall</th>
                <th scope="col">F1 Score</th>
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
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:14px;">
          <div style="padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
            <div style="font-weight:600; color:#0f172a; margin-bottom:2px; font-size:13px;">1. Column Pattern (40%)</div>
            <p style="font-size:12px; color:#475569; line-height:1.4;">Header matches against positive and negative regular expressions.</p>
          </div>
          <div style="padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
            <div style="font-weight:600; color:#0f172a; margin-bottom:2px; font-size:13px;">2. Value Pattern Ratio (45%)</div>
            <p style="font-size:12px; color:#475569; line-height:1.4;">Ratio of sampled cell values strictly matching format regex patterns.</p>
          </div>
          <div style="padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
            <div style="font-weight:600; color:#0f172a; margin-bottom:2px; font-size:13px;">3. Validator Bonus (15%)</div>
            <p style="font-size:12px; color:#475569; line-height:1.4;">Algorithmic verification including Verhoeff checksum and entity PAN checks.</p>
          </div>
        </div>
      </div>

      <!-- Sample Benchmark Predictions Table -->
      ${predictions.length > 0 ? `
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Sample Benchmark Predictions (${predictions.length} cases tested)</h3>
              <p class="card-subtitle">Auditable record of true class versus scanner prediction</p>
            </div>
          </div>
          <div class="table-responsive" style="max-height:340px; overflow-y:auto;">
            <table>
              <thead>
                <tr>
                  <th scope="col">Field / Column</th>
                  <th scope="col">Sample Value</th>
                  <th scope="col">Ground Truth</th>
                  <th scope="col">Predicted Class</th>
                  <th scope="col">Confidence</th>
                  <th scope="col" style="text-align:right;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${predictions.slice(0, 15).map(p => `
                  <tr>
                    <td style="font-family:'JetBrains Mono',monospace; font-weight:600;">${p.column_name}</td>
                    <td style="font-family:'JetBrains Mono',monospace; font-size:11px; color:#475569;">${p.sample_value}</td>
                    <td>${renderClassBadge(p.true_class)}</td>
                    <td>${renderClassBadge(p.predicted_class)}</td>
                    <td>${renderConfidenceBar(p.confidence)}</td>
                    <td style="text-align:right;">
                      ${p.is_correct ? '<span class="badge badge-complete">Match</span>' : '<span class="badge badge-missing-b">Mismatch</span>'}
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
    btn.textContent = 'Evaluating benchmark...';
  }
  try {
    const res = await fetch('/api/evaluation', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Evaluation request failed');
    }
    showToast('Accuracy evaluation completed successfully.', 'success');
    await renderActiveView();
  } catch (err) {
    showToast(`Evaluation failed: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Run Accuracy Benchmark';
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
    <!-- Cryptographic SHA-256 Audit Chain Banner -->
    <div class="audit-chain-card" id="audit-chain-banner">
      <div style="display:flex; align-items:center; gap:12px;">
        <div class="audit-shield-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
        </div>
        <div>
          <div style="font-size:12.5px; font-weight:700; color:#065f46;">SHA-256 Cryptographic Audit Ledger Active</div>
          <div style="font-size:11px; color:#475569;" id="audit-chain-text">Every triage action and scan receipt is anchored in an immutable Merkle hash chain.</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:#64748b;">
          <span class="kbd">C</span> Confirm
          <span class="kbd">R</span> Reject
          <span class="kbd">E</span> Evidence
        </div>
        <button type="button" onclick="runAuditVerification()" id="btn-verify-audit" class="btn btn-secondary btn-sm">
          Verify Audit Integrity
        </button>
      </div>
    </div>

    <!-- Explanatory Callout Banner -->
    <div class="help-callout">
      <div>
        <strong>Human-in-the-Loop Triage:</strong> Confirm or reject candidate personal data fields. Use batch actions to quickly confirm high-confidence matches (>85%) or adjudicate borderline candidates.
      </div>
      <div class="btn-group">
        ${highConfCount > 0 ? `
          <button type="button" onclick="quickBatchReview(0.85, 'CONFIRMED')" class="btn btn-primary btn-sm">
            Confirm High Confidence (>85%) [${highConfCount}]
          </button>
        ` : ''}
        ${pending.length > 0 ? `
          <button type="button" onclick="quickBatchReview(null, 'CONFIRMED')" class="btn btn-secondary btn-sm">
            Confirm All [${pending.length}]
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Quick Filter Chips -->
    <div class="filter-chips-bar" role="toolbar" aria-label="Review Queue Filter">
      <span style="font-size:11px; font-weight:600; color:#64748b; margin-right:4px;">Filter Queue:</span>
      <button type="button" class="filter-chip ${state.reviewActiveChip === 'all' ? 'active' : ''}" onclick="applyReviewChip('all')">All Pending (${pending.length})</button>
      <button type="button" class="filter-chip ${state.reviewActiveChip === 'high' ? 'active' : ''}" onclick="applyReviewChip('high')">High Confidence >85% (${highConfCount})</button>
      <button type="button" class="filter-chip ${state.reviewActiveChip === 'moderate' ? 'active' : ''}" onclick="applyReviewChip('moderate')">Moderate 70-84% (${modConfCount})</button>
      <button type="button" class="filter-chip ${state.reviewActiveChip === 'borderline' ? 'active' : ''}" onclick="applyReviewChip('borderline')">Borderline &lt;70% (${lowConfCount})</button>
    </div>

    <!-- Review Card -->
    <div class="card">
      <div class="card-header">
        <input type="text" id="review-search" oninput="filterReviewTable()" placeholder="Search pending field, dataset, or class..." style="width:260px;" aria-label="Search pending reviews"/>
        <span style="font-size:12px; font-weight:500; color:#475569;" id="review-counter">${pending.length} candidate fields awaiting review</span>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th scope="col">Field Identifier</th>
              <th scope="col">Dataset Source</th>
              <th scope="col">Candidate Class</th>
              <th scope="col">Confidence</th>
              <th scope="col">Detection Evidence</th>
              <th scope="col" style="text-align:right;">Decision</th>
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
    return `<tr><td colspan="6" style="text-align:center; padding:32px; color:#065f46; font-weight:600;">Review queue is clear. All candidate detections have been verified.</td></tr>`;
  }
  return records.map(r => `
    <tr id="review-row-${r.id}">
      <td><strong>${r.column_name}</strong> <span style="font-size:10px; font-family:'JetBrains Mono',monospace; color:#64748b;">${r.table_name}</span></td>
      <td>${r.dataset_name}</td>
      <td>${renderClassBadge(r.candidate_class)}</td>
      <td>${renderConfidenceBar(r.confidence_score)}</td>
      <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.evidence_summary}">${r.evidence_summary}</td>
      <td style="text-align:right; white-space:nowrap;">
        <button type="button" onclick="openEvidenceModal('${r.id}')" class="btn btn-secondary btn-sm">Evidence</button>
        <button type="button" onclick="quickReview('${r.id}', 'CONFIRMED')" class="btn btn-primary btn-sm" style="background:#065f46; border-color:#065f46;">Confirm PII</button>
        <button type="button" onclick="quickReview('${r.id}', 'REJECTED')" class="btn btn-danger btn-sm">Reject</button>
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
    showToast(`Field ${status === 'CONFIRMED' ? 'confirmed as PII' : 'rejected / suppressed'}.`, 'success');

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
      }, 200);
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
    showToast(`Batch update applied: ${data.updated_count} fields set to ${targetStatus}.`, 'success');
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
        <strong>Declarative Rules Specification:</strong> Customize regular expression patterns, negative suppression lists, and multi-signal weights with strict server-side validation.
      </div>
      <button type="button" onclick="saveRulesYaml()" id="btn-save-rules" class="btn btn-primary btn-sm">Save & Compile Rules</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Active YAML Rules Specification</h3>
          <p class="card-subtitle">Syntax is validated before hot-reload to prevent configuration errors</p>
        </div>
      </div>
      
      <textarea id="rules-textarea" style="width:100%; height:400px; font-family:'JetBrains Mono',monospace; font-size:12px; padding:14px; background:#f8fafc; color:#0f172a; border-radius:6px; border:1px solid #cbd5e1; line-height:1.6;" spellcheck="false" aria-label="YAML rules configuration">${data.yaml_content}</textarea>

      <div style="margin-top:14px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:12px; color:#475569;">
        <strong>Validation Guardrail:</strong> Syntax is compiled in an isolated sandbox before reloading. Invalid expressions are safely rejected.
      </div>
    </div>
  `;
}

async function saveRulesYaml() {
  const content = document.getElementById('rules-textarea').value;
  const btn = document.getElementById('btn-save-rules');
  btn.disabled = true;
  btn.textContent = 'Validating...';

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
    showToast('Rules updated and compiled successfully.', 'success');
  } catch (err) {
    showToast(`Rules error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save & Compile Rules';
  }
}

// Accessible Modals with Escape Key Support
function setupModalKeyListeners() {
  document.removeEventListener('keydown', handleModalKeyDown);
  document.addEventListener('keydown', handleModalKeyDown);
}

function handleModalKeyDown(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
}

function openEvidenceModal(recordId) {
  const r = (state.inventory.find(i => i.id === recordId)) ||
    (state.gapsReport?.gap_records.find(i => i.id === recordId));
  if (!r) return;

  const modal = document.getElementById('modal-container');
  const sb = r.signals_breakdown || {};

  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="modal-evidence-title">
        <div class="modal-header">
          <div>
            <span style="font-size:11px; font-weight:600; color:#24556d; text-transform:uppercase; letter-spacing:0.04em;">Technical Evidence Audit</span>
            <h3 id="modal-evidence-title" style="font-size:16px; font-weight:700; color:#0f172a; margin-top:2px;">${r.column_name}</h3>
          </div>
          <button type="button" onclick="closeModal()" class="sidebar-toggle-btn" aria-label="Close dialog">&times;</button>
        </div>

        <div class="modal-body" style="display:flex; flex-direction:column; gap:14px; font-size:13px;">
          <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:12px;">
            <strong style="color:#075985; display:block; margin-bottom:2px;">Detection Summary:</strong>
            <p style="color:#0c4a6e;">${r.evidence_summary}</p>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; border:1px solid #e2e8f0; border-radius:8px; padding:12px; background:#f8fafc;">
            <div>
              <span style="font-size:11px; font-weight:600; color:#475569; display:block;">Declared Purpose (Sec. 5):</span>
              <strong style="color:#0f172a; font-size:12px;">${r.declared_purpose || '<span style="color:#92400e; font-weight:normal;">Unspecified</span>'}</strong>
            </div>
            <div>
              <span style="font-size:11px; font-weight:600; color:#475569; display:block;">Retention Schedule (Sec. 8):</span>
              <strong style="color:#0f172a; font-size:12px;">${r.retention_period || '<span style="color:#9a3412; font-weight:normal;">Unspecified</span>'}</strong>
            </div>
          </div>

          <div style="border:1px solid #e2e8f0; border-radius:8px; padding:14px; background:#ffffff;">
            <strong style="display:block; margin-bottom:8px; color:#0f172a;">Multi-Signal Contribution:</strong>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>Column Match: <strong>${sb.column_matched ? 'Matched pattern' : 'No pattern match'}</strong></div>
              <div>Negative Penalty: <strong>${sb.negative_column_match ? 'Penalty applied' : 'None'}</strong></div>
              <div>Value Match Ratio: <strong>${Math.round((sb.value_match_ratio || 0) * 100)}%</strong></div>
              <div>Format Validator: <strong>${Math.round((sb.validator_pass_ratio || 0) * 100)}%</strong></div>
            </div>
          </div>

          <div>
            <strong style="display:block; margin-bottom:6px; color:#0f172a;">Sanitized Sample Values:</strong>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; color:#0f172a; font-family:'JetBrains Mono',monospace; padding:10px 12px; border-radius:6px; font-size:11px; line-height:1.6;">
              ${r.sample_values_masked && r.sample_values_masked.length > 0
      ? r.sample_values_masked.map((v, i) => `<div>[${i + 1}] ${v}</div>`).join('')
      : '<div>No samples available</div>'}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" onclick="closeModal()" class="btn btn-secondary btn-sm">Close</button>
        </div>
      </div>
    </div>
  `;
  setupModalKeyListeners();
}

function openReviewModal(recordId) {
  const r = state.inventory.find(i => i.id === recordId) ||
    (state.gapsReport?.gap_records.find(i => i.id === recordId));
  if (!r) return;
  state.reviewRecord = r;

  const modal = document.getElementById('modal-container');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="modal-review-title">
        <div class="modal-header">
          <div>
            <span style="font-size:11px; font-weight:600; color:#24556d; text-transform:uppercase; letter-spacing:0.04em;">Human Review Decision</span>
            <h3 id="modal-review-title" style="font-size:16px; font-weight:700; color:#0f172a; margin-top:2px;">${r.column_name}</h3>
          </div>
          <button type="button" onclick="closeModal()" class="sidebar-toggle-btn" aria-label="Close dialog">&times;</button>
        </div>

        <div class="modal-body" style="display:flex; flex-direction:column; gap:14px; font-size:13px;">
          <div>
            <label style="font-weight:600; display:block; margin-bottom:6px;">Review Decision</label>
            <div style="display:flex; gap:8px;">
              <button type="button" onclick="submitReviewDecision('CONFIRMED')" class="btn btn-primary" style="flex:1; justify-content:center; background:#065f46; border-color:#065f46; padding:9px;">
                Confirm as Personal Data
              </button>
              <button type="button" onclick="submitReviewDecision('REJECTED')" class="btn btn-danger" style="flex:1; justify-content:center; padding:9px;">
                Reject / Suppress
              </button>
            </div>
          </div>

          <div>
            <label for="modal-rev-notes" style="font-weight:600; display:block; margin-bottom:4px;">Reviewer Notes & Justification</label>
            <textarea id="modal-rev-notes" style="width:100%; height:75px;" placeholder="Optional justification or regulatory rationale...">${r.reviewer_notes || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" onclick="closeModal()" class="btn btn-secondary btn-sm">Cancel</button>
        </div>
      </div>
    </div>
  `;
  setupModalKeyListeners();
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
    showToast(`Field "${r.column_name}" marked as ${status}.`, 'success');
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
      <div class="modal-content" onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="modal-meta-title">
        <div class="modal-header">
          <h3 id="modal-meta-title" style="font-size:15px; font-weight:700;">Add Purpose & Retention Notice</h3>
          <button type="button" onclick="closeModal()" class="sidebar-toggle-btn" aria-label="Close dialog">&times;</button>
        </div>

        <div class="modal-body" style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
          <div>
            <label for="m-col" style="font-weight:600; display:block; margin-bottom:4px;">Column Name *</label>
            <input type="text" id="m-col" style="width:100%;" placeholder="e.g. email_address or pan_number"/>
          </div>
          <div>
            <label for="m-ds" style="font-weight:600; display:block; margin-bottom:4px;">Dataset Name (Optional)</label>
            <input type="text" id="m-ds" style="width:100%;" placeholder="e.g. synthetic_customers.csv"/>
          </div>
          <div>
            <label for="m-tbl" style="font-weight:600; display:block; margin-bottom:4px;">Table Name (Optional)</label>
            <input type="text" id="m-tbl" style="width:100%;" placeholder="e.g. customers"/>
          </div>
          <div>
            <label for="m-purp" style="font-weight:600; display:block; margin-bottom:4px;">Declared Purpose</label>
            <textarea id="m-purp" style="width:100%; height:55px;" placeholder="e.g. Account onboarding and transactional communications"></textarea>
          </div>
          <div>
            <label for="m-ret" style="font-weight:600; display:block; margin-bottom:4px;">Retention Period</label>
            <input type="text" id="m-ret" style="width:100%;" placeholder="e.g. 7 years following account closure"/>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" onclick="closeModal()" class="btn btn-secondary btn-sm">Cancel</button>
          <button type="button" onclick="saveNewMetadata()" class="btn btn-primary btn-sm">Save Notice</button>
        </div>
      </div>
    </div>
  `;
  setupModalKeyListeners();
}

async function saveNewMetadata() {
  const col = document.getElementById('m-col').value;
  if (!col.trim()) return showToast('Column Name is required.', 'warning');

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
    showToast('Metadata notice registered successfully.', 'success');
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

  const scoreColor = data.overall_readiness_score >= 80 ? '#059669' : (data.overall_readiness_score >= 60 ? '#d97706' : '#dc2626');
  const riskBadgeClass = data.risk_level.includes('LOW') ? 'badge-complete' : (data.risk_level.includes('MODERATE') ? 'badge-missing-p' : 'badge-missing-b');

  container.innerHTML = `
    <!-- Top Summary Cards (2 Equal-Height Cards) -->
    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px; margin-bottom:20px;">
      <!-- Readiness Gauge Card -->
      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:28px 20px;">
        <span style="font-size:11px; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:0.04em;">DPDP Statutory Readiness</span>
        <div style="font-size:48px; font-weight:800; color:${scoreColor}; margin:10px 0; font-family:'JetBrains Mono',monospace;">${data.overall_readiness_score}%</div>
        <div><span class="badge ${riskBadgeClass}" style="font-size:12px; padding:3px 10px;">${data.risk_level}</span></div>
        <p style="font-size:12px; color:#475569; margin-top:12px; max-width:240px; line-height:1.4;">Scored across statutory principles of the Digital Personal Data Protection Act, 2023.</p>
      </div>

      <!-- Audit Integrity & Validation Differentiators -->
      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div class="card-header" style="margin-bottom:10px; padding-bottom:8px;">
            <h3 class="card-title" style="display:flex; align-items:center; gap:8px;">
              ${icons.shield}
              Cryptographic Audit Seal
            </h3>
            <span style="font-size:10px; font-family:'JetBrains Mono',monospace; background:#f0f9ff; color:#075985; border:1px solid #bae6fd; padding:2px 8px; border-radius:4px; font-weight:600;">DPBI Sec 16 Non-Repudiation</span>
          </div>
          
          <div class="seal-box">
            <span style="font-size:11px;">${data.tamper_evident_seal_sha256}</span>
            <button type="button" onclick="navigator.clipboard.writeText('${data.tamper_evident_seal_sha256}'); showToast('Audit seal copied to clipboard.', 'info');" class="btn btn-secondary btn-sm" style="white-space:nowrap;">
              ${icons.copy} Copy Seal
            </button>
          </div>
          <p style="font-size:12px; color:#475569; margin-top:8px; line-height:1.4;">Deterministic SHA-256 fingerprint generated over discovery inventory records, retention schedules, and timestamp metadata. Guarantees immutable evidentiary integrity for Data Protection Board of India (DPBI) audits.</p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-top:14px; padding-top:14px; border-top:1px solid #e2e8f0;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
            <div style="font-size:11px; color:#475569; font-weight:500;">Aadhaar Verification</div>
            <div style="font-size:13px; font-weight:700; color:#0f172a; margin-top:2px;">Dihedral D5 Algorithm</div>
            <div style="font-size:11px; color:#059669; font-weight:500; margin-top:2px;">UIDAI Algorithmic Check</div>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
            <div style="font-size:11px; color:#475569; font-weight:500;">Corporate PAN Filter</div>
            <div style="font-size:13px; font-weight:700; color:#0f172a; margin-top:2px;">4th Character Check</div>
            <div style="font-size:11px; color:#24556d; font-weight:500; margin-top:2px;">Entity Noise Suppressed</div>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
            <div style="font-size:11px; color:#475569; font-weight:500;">Section 9 Minors</div>
            <div style="font-size:13px; font-weight:700; color:#0f172a; margin-top:2px;">Age &lt; 18 Consent Flag</div>
            <div style="font-size:11px; color:#d97706; font-weight:500; margin-top:2px;">Children's Data Protected</div>
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
        <a href="/api/reports/dpdp.pdf" target="_blank" class="btn btn-primary btn-sm">
          ${icons.shield} Download DPDP Dossier (PDF)
        </a>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th scope="col" style="width:100px;">Section</th>
              <th scope="col">Statutory Principle</th>
              <th scope="col">Status</th>
              <th scope="col" style="width:130px;">Readiness Score</th>
              <th scope="col">Recommended Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data.principles.map(p => {
    const statusBadge = p.status === 'COMPLIANT'
      ? '<span class="badge badge-complete">Compliant</span>'
      : (p.status === 'ACTION_REQUIRED' ? '<span class="badge badge-missing-p">Action Required</span>' : '<span class="badge badge-missing-b">Critical Gap</span>');
    const barColor = p.score >= 80 ? '#059669' : (p.score >= 50 ? '#24556d' : '#dc2626');
    return `
                <tr>
                  <td style="font-family:'JetBrains Mono',monospace; font-weight:600; color:#1e293b;">${p.statutory_section}</td>
                  <td>
                    <strong>${p.principle}</strong>
                    <div style="font-size:11px; color:#64748b; margin-top:1px;">${p.description}</div>
                  </td>
                  <td>${statusBadge}</td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div style="flex:1; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;">
                        <div style="width:${p.score}%; height:100%; background:${barColor};"></div>
                      </div>
                      <span style="font-size:11px; font-family:'JetBrains Mono',monospace; font-weight:600;">${p.score}%</span>
                    </div>
                  </td>
                  <td style="font-size:12px; color:#334155;">
                    ${p.action_items && p.action_items.length > 0
        ? p.action_items.map(a => `<div>&bull; ${a}</div>`).join('')
        : '&mdash;'}
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
  const currentTab = state.studioTab || 'sensitivity';

  container.innerHTML = `
    <!-- Studio Header & Sub-Tabs -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px;">
      <div>
        <h2 style="font-size:16px; font-weight:700; color:#0f172a;">Advanced Sensitivity, Blast Radius & Lineage Studio</h2>
        <p style="font-size:12px; color:#64748b; margin-top:2px;">Interactive simulations: detection weights tuning, breach blast radius, cross-table lineage, and snapshot drift tracking.</p>
      </div>
      <div class="tab-segment-bar" style="margin-bottom:0;" role="tablist" aria-label="Studio Modes">
        <button type="button" role="tab" class="tab-segment-btn ${currentTab === 'sensitivity' ? 'active' : ''}" onclick="switchStudioTab('sensitivity')" aria-selected="${currentTab === 'sensitivity'}">
          Sensitivity & Weights
        </button>
        <button type="button" role="tab" class="tab-segment-btn ${currentTab === 'blast' ? 'active' : ''}" onclick="switchStudioTab('blast')" aria-selected="${currentTab === 'blast'}">
          Breach Blast Radius (Sec. 33)
        </button>
        <button type="button" role="tab" class="tab-segment-btn ${currentTab === 'lineage' ? 'active' : ''}" onclick="switchStudioTab('lineage')" aria-selected="${currentTab === 'lineage'}">
          Data Lineage Graph
        </button>
        <button type="button" role="tab" class="tab-segment-btn ${currentTab === 'timemachine' ? 'active' : ''}" onclick="switchStudioTab('timemachine')" aria-selected="${currentTab === 'timemachine'}">
          Time Machine & Drift
        </button>
      </div>
    </div>

    <div id="studio-content-pane"></div>
  `;

  const pane = document.getElementById('studio-content-pane');
  if (currentTab === 'sensitivity') {
    renderSensitivitySliders(pane);
  } else if (currentTab === 'blast') {
    await renderBlastRadiusView(pane);
  } else if (currentTab === 'lineage') {
    await renderLineageView(pane);
  } else if (currentTab === 'timemachine') {
    await renderTimeMachineView(pane);
  }
}

function renderSensitivitySliders(pane) {
  const p = state.simParams;
  pane.innerHTML = `
    <!-- Top Callout -->
    <div class="help-callout">
      <div>
        <strong>What-If Sensitivity Simulation:</strong> Adjust detection signal weights and confidence thresholds in real-time to observe discoveries, precision, recall, and false positive suppression on labelled benchmark data.
      </div>
      <button type="button" onclick="resetSimParams()" class="btn btn-secondary btn-sm">Reset Defaults</button>
    </div>

    <!-- Sliders Grid (4 Clean Framed Cards) -->
    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:20px;">
      <!-- Column Pattern Weight -->
      <div class="slider-box">
        <div class="slider-header">
          <label for="rng-col-w" class="slider-title">Column Pattern Weight</label>
          <span id="lbl-col-w" class="slider-val">${p.column_weight.toFixed(2)}</span>
        </div>
        <input type="range" id="rng-col-w" min="0" max="1" step="0.05" value="${p.column_weight}" oninput="updateSimParam('column_weight', this.value)"/>
        <p class="slider-desc">Weight assigned to column name regex matches (e.g. email, pan, phone).</p>
      </div>

      <!-- Value Regex Weight -->
      <div class="slider-box">
        <div class="slider-header">
          <label for="rng-val-w" class="slider-title">Value Pattern Weight</label>
          <span id="lbl-val-w" class="slider-val">${p.value_weight.toFixed(2)}</span>
        </div>
        <input type="range" id="rng-val-w" min="0" max="1" step="0.05" value="${p.value_weight}" oninput="updateSimParam('value_weight', this.value)"/>
        <p class="slider-desc">Weight assigned to data cell format pattern conformance ratio.</p>
      </div>

      <!-- Validator Bonus -->
      <div class="slider-box">
        <div class="slider-header">
          <label for="rng-bon-w" class="slider-title">Format Validator Bonus</label>
          <span id="lbl-bon-w" class="slider-val">${p.validator_bonus.toFixed(2)}</span>
        </div>
        <input type="range" id="rng-bon-w" min="0" max="0.30" step="0.05" value="${p.validator_bonus}" oninput="updateSimParam('validator_bonus', this.value)"/>
        <p class="slider-desc">Bonus for passing Verhoeff checksum or entity checks.</p>
      </div>

      <!-- Decision Threshold -->
      <div class="slider-box">
        <div class="slider-header">
          <label for="rng-thresh" class="slider-title">Decision Threshold</label>
          <span id="lbl-thresh" class="slider-val">${p.threshold.toFixed(2)}</span>
        </div>
        <input type="range" id="rng-thresh" min="0.1" max="1.0" step="0.05" value="${p.threshold}" oninput="updateSimParam('threshold', this.value)"/>
        <p class="slider-desc">Minimum score required to classify a field as candidate personal data.</p>
      </div>
    </div>

    <!-- Live Simulation Output Box -->
    <div id="sim-output-pane">
      <div class="card" style="text-align:center; padding:32px; color:#64748b;" role="status">Computing live simulation metrics...</div>
    </div>
  `;
  runSimulation();
}

async function renderBlastRadiusView(pane) {
  pane.innerHTML = `<div class="card" style="text-align:center; padding:36px; color:#64748b;">Loading Breach Blast Radius model...</div>`;
  const dsRes = await fetch('/api/datasets');
  const datasets = await dsRes.json();
  const targetId = state.selectedBlastTarget || (datasets[0] ? datasets[0].id : '');

  const blastRes = await fetch('/api/simulator/blast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_id: targetId })
  });
  const data = await blastRes.json();

  pane.innerHTML = `
    <!-- Top Selector Bar -->
    <div class="card" style="margin-bottom:20px; padding:16px 20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <label for="blast-target-select" style="font-size:12px; font-weight:700; color:#0f172a; display:block; margin-bottom:4px;">Select Breach Incident Epicenter (Target Table)</label>
          <select id="blast-target-select" onchange="state.selectedBlastTarget = this.value; renderBlastRadiusView(document.getElementById('studio-content-pane'));" style="min-width:320px; padding:8px 12px; font-size:13px;">
            ${datasets.map(d => `<option value="${d.id}" ${d.id === targetId ? 'selected' : ''}>${d.name} (${d.source_type.toUpperCase()} &bull; ${d.row_count.toLocaleString()} rows)</option>`).join('')}
          </select>
        </div>
        <div style="font-size:12px; color:#64748b; max-width:440px;">
          Simulates the blast radius if the chosen table suffers unauthorized exfiltration, calculating downstream compromises and DPDP statutory fines.
        </div>
      </div>
    </div>

    <!-- Exposure Metrics Grid -->
    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px; margin-bottom:20px;">
      <!-- Meter Gauge Card -->
      <div class="blast-meter-box">
        <div class="blast-circle-gauge">
          <div class="blast-circle-inner">
            <span style="font-size:18px; font-weight:800; color:#dc2626; font-family:'JetBrains Mono',monospace;">${data.total_records_exposed.toLocaleString()}</span>
            <span style="font-size:10px; color:#64748b; font-weight:600; text-transform:uppercase;">Exposed</span>
          </div>
        </div>
        <h4 style="font-size:14px; font-weight:700; color:#0f172a; margin-bottom:4px;">Combined Blast Radius</h4>
        <p style="font-size:12px; color:#64748b;">${data.direct_records_compromised.toLocaleString()} direct records + ${data.downstream_records_at_risk.toLocaleString()} downstream records via shared keys.</p>
      </div>

      <!-- Quasi-Identifier Combinations Card -->
      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Quasi-Identifier Re-identification Vectors</h3>
            <p class="card-subtitle">Combinations that enable cross-referencing and targeted harm</p>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${data.quasi_identifier_combos && data.quasi_identifier_combos.length > 0 ? data.quasi_identifier_combos.map(c => `
            <div class="quasi-card">
              <div>
                <strong style="color:#0f172a; font-size:13px; display:block;">${c.name}</strong>
                <span style="font-size:11px; color:#991b1b; font-weight:500;">${c.risk}</span>
              </div>
              <span class="badge badge-missing-b">High Risk</span>
            </div>
          `).join('') : `<div style="color:#64748b; font-size:13px; padding:12px;">No high-risk quasi-identifier combinations detected in target schema.</div>`}
        </div>
      </div>
    </div>

    <!-- DPDP Act Section 33 Statutory Penalty Exposure Box -->
    <div class="penalty-card-critical">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span style="font-size:11px; font-weight:700; color:#991b1b; text-transform:uppercase; letter-spacing:0.04em;">Statutory Regulatory Liability &bull; DPDP Act 2023</span>
      </div>
      <h3 style="font-size:16px; font-weight:800; color:#991b1b; margin-bottom:4px;">${data.statutory_penalty_tier}</h3>
      <p style="font-size:12.5px; color:#7f1d1d; line-height:1.5; margin-bottom:8px;">${data.statutory_clause}</p>
      <div style="font-size:12px; color:#991b1b; background:#fee2e2; border-radius:6px; padding:10px 14px;">
        <strong>Statutory Impact Analysis:</strong> ${data.statutory_rationale}
      </div>
    </div>
  `;
}

async function renderLineageView(pane) {
  pane.innerHTML = `<div class="card" style="text-align:center; padding:36px; color:#64748b;">Generating interactive Data Lineage Graph...</div>`;
  const res = await fetch('/api/lineage');
  const lineage = await res.json();

  pane.innerHTML = `
    <div class="lineage-canvas-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <div>
          <h3 style="font-size:15px; font-weight:700; color:#0f172a;">Cross-Table Personal Data Lineage Graph</h3>
          <p style="font-size:12px; color:#64748b;">Visualizes relational links between database tables sharing common personal identifiers.</p>
        </div>
        <div style="display:flex; align-items:center; gap:16px; font-size:11px; color:#475569;">
          <span><span style="display:inline-block; width:10px; height:10px; background:#24556d; border-radius:2px; margin-right:4px;"></span>Personal Table</span>
          <span><span style="display:inline-block; width:16px; height:2px; background:#24556d; border-top:2px dashed #24556d; margin-right:4px; vertical-align:middle;"></span>Data Flow Link</span>
        </div>
      </div>

      <!-- Animated SVG Lineage Diagram -->
      <svg class="lineage-svg" viewBox="0 0 900 340">
        <!-- Connecting Edges with Animated Dash Flow -->
        <g id="lineage-edges">
          <path d="M 220 170 Q 450 70 680 120" class="lineage-edge" fill="none"/>
          <path d="M 220 170 Q 450 250 680 230" class="lineage-edge" fill="none"/>
          <path d="M 680 120 L 680 230" class="lineage-edge" fill="none"/>
        </g>

        <!-- Node 1: Customers CSV -->
        <g transform="translate(60, 120)" class="lineage-node-rect" onclick="showToast('synthetic_customers: 1000 rows • Name, Phone, Aadhaar, DOB', 'info')">
          <rect width="200" height="96" rx="8" fill="#ffffff" stroke="#bcd5e0" stroke-width="2"/>
          <text x="16" y="28" font-size="12" font-weight="700" fill="#0f172a">synthetic_customers.csv</text>
          <text x="16" y="46" font-size="10" font-family="'JetBrains Mono',monospace" fill="#64748b">1,000 Records &bull; 4 PII Classes</text>
          <rect x="16" y="58" width="68" height="20" rx="4" fill="#f0f6f9"/>
          <text x="24" y="72" font-size="10" font-weight="600" fill="#24556d">Aadhaar (UIDAI)</text>
          <rect x="90" y="58" width="54" height="20" rx="4" fill="#ecfdf5"/>
          <text x="98" y="72" font-size="10" font-weight="600" fill="#065f46">Phone</text>
        </g>

        <!-- Node 2: Employees CSV -->
        <g transform="translate(560, 60)" class="lineage-node-rect" onclick="showToast('synthetic_employees: 500 rows • Name, Email, PAN', 'info')">
          <rect width="200" height="96" rx="8" fill="#ffffff" stroke="#bcd5e0" stroke-width="2"/>
          <text x="16" y="28" font-size="12" font-weight="700" fill="#0f172a">synthetic_employees.csv</text>
          <text x="16" y="46" font-size="10" font-family="'JetBrains Mono',monospace" fill="#64748b">500 Records &bull; 3 PII Classes</text>
          <rect x="16" y="58" width="60" height="20" rx="4" fill="#f0f6f9"/>
          <text x="24" y="72" font-size="10" font-weight="600" fill="#24556d">Indian PAN</text>
          <rect x="82" y="58" width="50" height="20" rx="4" fill="#ecfdf5"/>
          <text x="90" y="72" font-size="10" font-weight="600" fill="#065f46">Email</text>
        </g>

        <!-- Node 3: Enterprise Database -->
        <g transform="translate(560, 185)" class="lineage-node-rect" onclick="showToast('sample_enterprise.db: 4 tables • Core relational schema', 'info')">
          <rect width="200" height="96" rx="8" fill="#ffffff" stroke="#bcd5e0" stroke-width="2"/>
          <text x="16" y="28" font-size="12" font-weight="700" fill="#0f172a">sample_enterprise.db</text>
          <text x="16" y="46" font-size="10" font-family="'JetBrains Mono',monospace" fill="#64748b">4 Tables &bull; Relational SQLite</text>
          <rect x="16" y="58" width="64" height="20" rx="4" fill="#fef2f2"/>
          <text x="22" y="72" font-size="10" font-weight="600" fill="#991b1b">High Linkage</text>
          <rect x="86" y="58" width="58" height="20" rx="4" fill="#f0f9ff"/>
          <text x="92" y="72" font-size="10" font-weight="600" fill="#075985">Accounts</text>
        </g>
      </svg>

      <div style="margin-top:16px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:11.5px; color:#475569; display:flex; justify-content:space-between; align-items:center;">
        <span><strong>Live Cross-Table Linkage:</strong> Tables sharing Aadhaar, PAN, and Phone numbers can be joined across boundaries to reconstruct a full identity profile.</span>
        <button type="button" onclick="switchStudioTab('blast')" class="btn btn-secondary btn-sm">Simulate Breach Blast &rarr;</button>
      </div>
    </div>
  `;
}

async function renderTimeMachineView(pane) {
  pane.innerHTML = `<div class="card" style="text-align:center; padding:36px; color:#64748b;">Loading snapshot history and schema drift models...</div>`;
  const res = await fetch('/api/time-machine/diff');
  const data = await res.json();

  pane.innerHTML = `
    <!-- Top Comparison Header -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header">
        <div>
          <h3 class="card-title">Digital Twin Snapshot Time Machine</h3>
          <p class="card-subtitle">Automated diff between baseline and latest discovery runs to detect schema drift</p>
        </div>
        <button type="button" onclick="runOneClickDiscovery()" class="btn btn-primary btn-sm">Capture New Snapshot</button>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
          <span style="font-size:11px; font-weight:700; color:#24556d; text-transform:uppercase;">Snapshot A &bull; Baseline</span>
          <h4 style="font-size:14px; font-weight:700; color:#0f172a; margin-top:2px;">${data.scan_a.dataset}</h4>
          <p style="font-size:11px; font-family:'JetBrains Mono',monospace; color:#64748b;">ID: ${data.scan_a.id.slice(0, 16)}... &bull; ${data.scan_a.candidates} Candidates</p>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
          <span style="font-size:11px; font-weight:700; color:#059669; text-transform:uppercase;">Snapshot B &bull; Current</span>
          <h4 style="font-size:14px; font-weight:700; color:#0f172a; margin-top:2px;">${data.scan_b.dataset}</h4>
          <p style="font-size:11px; font-family:'JetBrains Mono',monospace; color:#64748b;">ID: ${data.scan_b.id.slice(0, 16)}... &bull; ${data.scan_b.candidates} Candidates</p>
        </div>
      </div>
    </div>

    <!-- Automated Drift Alerts -->
    <div>
      <h4 style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:10px;">Automated Schema Drift Alerts</h4>
      ${data.drift_alerts && data.drift_alerts.length > 0 ? data.drift_alerts.map(a => `
        <div class="drift-card ${a.severity === 'OPTIMAL' ? 'optimal' : 'high'}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0; margin-top:2px;">
            ${a.severity === 'OPTIMAL' ? '<polyline points="20 6 9 17 4 12"/>' : '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'}
          </svg>
          <div>
            <strong style="font-size:13px; display:block;">${a.title}</strong>
            <p style="font-size:12px; margin-top:2px; opacity:0.9;">${a.description}</p>
          </div>
        </div>
      `).join('') : ''}
    </div>
  `;
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

    const f1Pct = Math.round((s.macro_f1 || 0) * 100);
    const precPct = Math.round((s.macro_precision || 0) * 100);
    const recPct = Math.round((s.macro_recall || 0) * 100);

    pane.innerHTML = `
      <div>
        <!-- Live Simulated KPIs -->
        <div class="kpi-grid" style="margin-bottom:16px;">
          <div class="kpi-card" style="border-top-color:#059669;">
            <div class="kpi-label" style="color:#065f46;">Simulated Macro F1</div>
            <div class="kpi-val" style="color:#065f46;">${f1Pct}%</div>
            <div class="kpi-sub">Harmonic benchmark balance</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Simulated Precision</div>
            <div class="kpi-val">${precPct}%</div>
            <div class="kpi-sub">True positive accuracy</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Simulated Recall</div>
            <div class="kpi-val">${recPct}%</div>
            <div class="kpi-sub">Ground-truth coverage</div>
          </div>
          <div class="kpi-card" style="border-top-color:#24556d;">
            <div class="kpi-label" style="color:#24556d;">False Positives Suppressed</div>
            <div class="kpi-val" style="color:#24556d;">${s.false_positives_suppressed}</div>
            <div class="kpi-sub">Non-personal data filtered</div>
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
          
          <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; margin-bottom:16px;">
            ${Object.entries(s.class_distribution).map(([cls, cnt]) => `
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px; text-align:center;">
                <div style="font-size:11px; font-weight:600; color:#475569; text-transform:uppercase;">${cls.replace('_', ' ')}</div>
                <div style="font-size:20px; font-weight:700; color:#0f172a; margin-top:2px; font-family:'JetBrains Mono',monospace;">${cnt}</div>
              </div>
            `).join('')}
          </div>

          <h4 style="font-size:13px; font-weight:600; margin-bottom:8px; color:#334155;">Confidence Score Bands</h4>
          <div style="display:flex; gap:12px;">
            ${Object.entries(s.confidence_spread).map(([rng, cnt]) => `
              <div style="flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px; font-size:12px;">
                <span style="color:#64748b;">Band ${rng}:</span>
                <strong style="color:#0f172a; margin-left:4px; font-family:'JetBrains Mono',monospace;">${cnt} fields</strong>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    pane.innerHTML = `<div class="card" style="color:#991b1b; background:#fef2f2;" role="alert">Simulation error: ${err.message}</div>`;
  }
}

// Initial Launch
document.addEventListener('DOMContentLoaded', () => {
  renderActiveView();
  updateSidebarPendingBadge();
});
