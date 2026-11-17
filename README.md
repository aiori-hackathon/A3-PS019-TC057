WEBSITE FUNCTIONALITY YOUTUBE VIDEO - https://youtu.be/MVfuXm52Rkw
WEBSITE LINK-https://as-ps019-tc057.onrender.com/
PRESENTATION VIDEO- https://youtu.be/BWVyN9AuqBE

# PrivacyLens — Personal-Data Discovery & Privacy Evidence Inventory

[![AIORI Hackathon 3](https://img.shields.io/badge/AIORI_Hackathon_3-PS--019-0284c7.svg)](https://aiori.in)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com)
[![Tests Passing](https://img.shields.io/badge/pytest-25%20passed-success.svg)](backend/tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **AIORI Hackathon 3 — Problem Statement PS-019:**
> Personal-Data Discovery and Privacy Evidence Inventory.
> An enterprise-grade, evidence-based scanner that discovers candidate personal-data fields across CSVs and SQL databases, connects them to declared business purpose and retention metadata, and generates a structured privacy evidence inventory for human-in-the-loop review.

---

## 1. Project Overview & Problem Statement

Modern enterprise data repositories accumulate personally identifiable information (PII) across ad-hoc spreadsheets, legacy databases, and operational dumps without maintaining a verifiable inventory of what data exists, why it was collected, or when it should be purged.

**PrivacyLens** solves this critical data governance gap by providing:
1. **Evidence-Based Discovery:** Multi-signal candidate detection (column patterns, value regex ratios, and domain format validators) rather than naive keyword matching.
2. **Metadata Linking:** Automatic compound mapping `(dataset, table, column)` against declared business purposes and statutory retention rules.
3. **Evidence Gap Identification:** Technical gap detection flagging missing purposes, indefinite retention risks, ambiguous mappings, and unreviewed fields.
4. **Human-in-the-Loop Review Center:** Review workflow enabling Data Protection Officers (DPOs) and security analysts to confirm or reject detections with audit notes.
5. **Auditable Reporting:** Downloadable CSV exports and formal printable PDF reports generated via ReportLab.
6. **Transparent Evaluation:** Scikit-learn standard evaluation calculating true positives, false positives, false negatives, precision, recall, and F1 score against ground-truth benchmarks.

> **Important Legal Disclaimer:** PrivacyLens provides *technical evidence for human review*. It does not automatically determine legal compliance, lawful basis, or provide universal certification under the DPDP Act 2023, GDPR, or other statutory regulations.

---

## 2. Key Competitive Differentiators & Regulatory Advancements

PrivacyLens stands out with enterprise-grade capabilities built specifically to address real-world governance requirements:

| Differentiator | Architectural Implementation | Regulatory / Technical Impact |
| :--- | :--- | :--- |
| **DPDP Act 2023 Governance Matrix** | Automated engine scoring inventory against Sections 5, 6, 8(7), and 9 | Produces statutory readiness scores (0–100%) and risk tiers (Low/Moderate/High) for Data Protection Board audits. |
| **Cryptographic SHA-256 Audit Seal** | Deterministic SHA-256 digest computed across records and timestamps | Guarantees non-repudiation and tamper-evident audit trails. Any record tampering breaks the cryptographic hash. |
| **Official Verhoeff Dihedral ($D_5$) Algorithm** | Full non-commutative dihedral permutation group ($D_5$) check tables | Implements official UIDAI checksum calculation for 12-digit Aadhaar numbers, catching single-digit errors & adjacent transpositions. |
| **Entity-Aware PAN Tax ID Classification** | 4th-character PAN taxonomy inspection (`P`, `C`, `F`, `G`, `T`) | Identifies individual personal PANs while suppressing corporate/firm tax IDs (`C`, `F`, `G`) from false-positive PII alarms. |
| **Children's Data Protection (Sec 9)** | Age calculation (< 18) on detected dates of birth | Flags minor data requiring verifiable parental consent and tracking heightened processing safeguards under DPDP Act 2023. |
| **What-If Sensitivity Simulation Studio** | Live in-browser weight and threshold optimization engine | Interactive sliders to tune precision vs recall against labelled ground truth benchmarks in real time. |
| **Native ReportLab PDF Dossier** | Formal vector PDF export (`/api/reports/dpdp.pdf`) | Generates executive audit summaries with embedded DPDP matrix scores and cryptographic seal. |

---

## 3. Five Supported Personal Data Classes

PrivacyLens includes configurable detection rules for the 5 mandated classes:

| Class | Key Detection Signals | Format Validation & Guardrails |
| :--- | :--- | :--- |
| **1. Person Name** | Column patterns (`full_name`, `first_name`, `cust_name`, etc.), multi-word alphabetical patterns | Alphabetic density > 75%, length checks (2-60 chars). Explicit negative patterns (`company_name`, `product_name`, `file_name`) penalized. |
| **2. Email Address** | Column patterns (`email`, `work_email`, `contact_email`), RFC-style regex | Validates single `@`, domain dots, TLD length >= 2, max RFC length. |
| **3. Phone Number** | Column patterns (`phone`, `mobile`, `contact_no`, `tel_no`), Indian mobile regex (`+91` or 10-digit starting 6-9) | Strips non-digits, checks standard lengths (10-13 digits), rejects repetitive dummy numbers (`1111111111`, `1234567890`). |
| **4. Government ID** | Column patterns (`aadhaar`, `uidai`, `pan`, `ssn`, `gov_id`), Aadhaar 12-digit & PAN 10-char formats | Aadhaar structural check (12 digits, cannot start with 0 or 1). PAN structure (5 letters, 4 digits, 1 letter). SSN structure (3-2-4). |
| **5. Date of Birth** | Column patterns (`dob`, `date_of_birth`, `birth_date`), ISO and standard date formats | Age plausibility validation (0 to 125 years old). Rejects future dates and ordinary created/updated timestamps. |

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, Recharts
- **Build Tool:** Vite 5
- **Backend:** Python 3.10+ (tested on Python 3.14.7), FastAPI, Uvicorn, Pydantic v2
- **Data Processing:** Pandas, NumPy
- **Database:** SQLite with SQLAlchemy ORM (read-only connector mode for source inspection)
- **Rules Engine:** PyYAML configuration (`backend/config/rules.yaml`)
- **Evaluation:** Scikit-learn standard metrics (TP, FP, FN, Precision, Recall, F1)
- **PDF Generation:** ReportLab 5.1
- **Testing:** Pytest (25 passing automated tests)

---

## 4. Project Directory Structure

```text
AIORI_CODE_FOR_WEBSITE/
├── frontend/                     # React + TypeScript + Tailwind UI
│   ├── src/
│   │   ├── components/           # Sidebar, Header, StatusBadge, Modals
│   │   ├── pages/                # 9 Primary workflow views
│   │   ├── services/             # API client (Fetch / JSON)
│   │   └── types/                # TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── api/                  # REST API Endpoints (inc. /dpdp/matrix, /scanner/simulate)
│   │   ├── connectors/           # CSV & SQLite connectors
│   │   ├── core/                 # Config, Database engine, Seeders
│   │   ├── evaluation/           # Accuracy evaluator
│   │   ├── metadata/             # Purpose & Retention manager
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── reports/              # CSV & ReportLab PDF generators (with SHA-256 seal)
│   │   ├── scanner/              # Detection engine & Verhoeff dihedral validators
│   │   ├── schemas/              # Pydantic v2 schemas
│   │   ├── static/               # Interactive UI shell, CSS, and JS
│   │   └── main.py               # Application entrypoint
│   ├── config/
│   │   └── rules.yaml            # Configurable detection rules
│   ├── tests/                    # Automated pytest test suite (25 tests)
│   └── requirements.txt          # Python dependencies
├── sample_data/                  # Synthetic demonstration assets
│   ├── synthetic_customers.csv   # Indian names, emails, phones, Aadhaar
│   ├── synthetic_employees.csv   # Employee names, work emails, PAN
│   ├── sample_enterprise.db      # Multi-table SQLite database (customers, employees, orders)
│   ├── labelled_test_set.csv     # 50+ labelled ground truth benchmark samples
│   ├── purpose_retention.csv     # Pre-seeded purpose & retention register
│   └── setup_sample_database.py  # SQLite DB generator
├── docs/                         # Technical documentation
│   ├── architecture.md           # Architecture, Data flow, Mermaid diagrams
│   ├── pseudocode.md             # Algorithmic pseudocode & scoring
│   ├── testing.md                # Test report & Mentor demo checklist
│   └── limitations.md            # Technical scope, disclaimers, security
├── reports/                      # Output directory for exported reports
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git exclusions
├── LICENSE                       # MIT License
└── README.md                     # Master project guide
```

---

## 5. Prerequisites

Before running PrivacyLens, ensure you have:
1. **Python 3.10 or higher** (`python --version`)
2. **Node.js v18 or higher** (`node --version`) and **npm** (`npm --version`)

---

## 6. Installation & Setup

### Step 1: Clone or Navigate to the Repository
```bash
git clone https://github.com/aiori-hackathon/A3-PS019-TC057.git
cd AIORI_CODE_FOR_WEBSITE
```

### Step 2: Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 4: Initialize Sample Database & Seeder
Populate the synthetic enterprise SQLite database and initial purpose/retention register:
```bash
python sample_data/setup_sample_database.py
python -m backend.app.core.init_db
```

---

## 7. Running the Application

### Option A: Run Unified Full-Stack Server
```bash
python run.py
```
- Web Application UI: `http://localhost:8000/` or live at `https://as-ps019-tc057.onrender.com/`
- Interactive API Docs (Swagger): `http://localhost:8000/docs`
- Redoc API Docs: `http://localhost:8000/redoc`

### Option B: Run Frontend Development Server (Terminal 2)
```bash
cd frontend
npm run dev
```
- Web Application UI: `http://localhost:5173`

---

## 8. Guided Mentor Demonstration Workflow

1. **Dashboard (`/` or `http://localhost:8000`):**
   - Review live metrics: total datasets, candidate fields detected, distribution across classes, and confidence spectrum.
   - Notice the DPDP Act 2023 Statutory Governance callout and cryptographic SHA-256 seal status.
2. **DPDP Act 2023 Statutory Matrix (Tab: "DPDP 2023 Matrix"):**
   - Inspect overall statutory readiness score (0-100%) and risk tier (Low / Moderate / High).
   - Review the Data Protection Board of India (DPBI) tamper-evident SHA-256 seal.
   - Review section-by-section breakdown: Section 5 (Notice), Section 8(7) (Retention Erasure), Section 9 (Children's Data Protection), and Section 16 (Evidentiary Non-Repudiation).
   - Download the official ReportLab **DPDP Dossier (PDF)**.
3. **What-If Sensitivity Studio (Tab: "Sensitivity Studio"):**
   - Adjust interactive sliders: Column Pattern Weight, Sample Value Weight, Format Bonus, and Candidate Threshold.
   - Click **"Execute Live Benchmark Simulation"** to observe real-time recalculations of Macro F1, Precision, Recall, and False Positives Suppressed.
4. **Data Sources:**
   - Inspect pre-loaded `synthetic_customers.csv`, `synthetic_employees.csv`, and `sample_enterprise.db`.
   - Click **"Inspect Schema"** to see table columns and non-null samples.
5. **Scan Data:**
   - Select `sample_enterprise.db` or `synthetic_customers.csv`.
   - Click **"Execute Scan"**. Multi-signal detection engine processes the dataset with Verhoeff dihedral validation and PAN entity filtering.
6. **Evidence Inventory:**
   - Filter by data class (e.g. `government_id` or `email_address`).
   - Click **"Evidence"** to inspect the multi-signal score breakdown and memory-redacted values (e.g. `XXXX-XXXX-9102`).
7. **Evidence Gaps:**
   - Filter by `Missing Purpose` or `Missing Retention`.
   - Observe how PrivacyLens highlights governance gaps without assuming universal compliance.
8. **Review Center:**
   - View pending candidate detections.
   - Click **"Confirm PII"** or **"Reject"** and enter audit justification notes.
9. **Evaluation & Accuracy:**
   - Click **"Execute Live Evaluation"** to run the scanner against `sample_data/labelled_test_set.csv`.
   - Inspect Macro Precision, Recall, F1 scores, and sample-by-sample confusion comparison.
10. **Configurable Rules:**
   - Open the live YAML editor. Adjust detection thresholds or add new regex patterns. Click **"Save & Compile Rules"**.
11. **Export Reports:**
   - Download `Inventory CSV`, `Gaps CSV`, `Inventory PDF`, or `DPDP Dossier (PDF)` from the header bar.

---

## 9. Running Automated Tests

Run the complete test suite with verbose output:
```bash
python -m pytest backend/tests -v
```

All 25 automated tests will execute and pass:
- CSV & SQLite connector validation
- All 5 personal data class detections
- Negative control suppression
- Metadata compound mapping & missing-metadata detection
- Precision, recall, and F1 calculation
- End-to-end API routes and PDF report generation

---

## 10. Security Safeguards

- **Synthetic Data Guarantee:** All demonstration assets are 100% fictional.
- **Zero-Exposure Masking:** Memory redaction masks PII prior to persistence and report output.
- **Read-Only Database Connections:** Enforces `mode=ro` URI connections to prevent write tampering.
- **Path Traversal Protection:** Sanitize upload filenames using strict `Path.name` extraction.
- **Safe Rule Compilation:** Rules are loaded using `yaml.safe_load` with pre-compilation syntax checks.

---

## 11. Pushing to Private GitHub Repository

```bash
# Initialize git if not already initialized
git init

# Add remote
git remote add origin https://github.com/<your-username>/PrivacyLens-AIORI-PS019.git

# Stage all files
git add .

# Commit
git commit -m "Initial release: PrivacyLens Personal-Data Discovery & Privacy Evidence Inventory (AIORI PS-019)"

# Push to private repository
git branch -M main
git push -u origin main
```

---

## 12. AIORI PS-019 Submission Checklist

- [x] Functional frontend (React + TypeScript + Tailwind CSS)
- [x] Functional backend (FastAPI + SQLAlchemy + Pandas)
- [x] 5 Configurable Data Classes implemented & tested
- [x] Multi-signal transparent detection engine (Column, Regex Ratio, Format Validator)
- [x] CSV & SQLite database connectors with safe sampling
- [x] Declared purpose and retention metadata register
- [x] Compound identifier mapping preventing ambiguous matches
- [x] Evidence gap report (missing purpose, missing retention, ambiguous mappings)
- [x] Human-in-the-loop review workflow (confirm, reject, notes)
- [x] Precision, Recall, and F1 evaluation module with ground-truth test set
- [x] Downloadable CSV and PDF reports
- [x] Configurable YAML detection rules with live validation
- [x] 100% synthetic demonstration data included
- [x] 25 Automated tests passing (`pytest backend/tests`)
- [x] Complete documentation: Architecture, Pseudocode, Testing, Limitations, README

---

## 13. Team Contributions

- **Lead Full-Stack & Security Architect:** Platform architecture, FastAPI backend, SQLite/CSV connectors, multi-signal scanner engine, security redaction.
- **Privacy Engineer & Governance Specialist:** Purpose/retention register, metadata mapping, ambiguity resolution, gap analysis module.
- **UI/UX Designer & Frontend Engineer:** Slate/navy cybersecurity dashboard, React/TypeScript workflows, Recharts data visualizations.
