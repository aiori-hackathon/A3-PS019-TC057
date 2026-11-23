import io
import hashlib
import datetime
import pandas as pd
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from backend.app.models.models import ScanResult, Dataset, ScanJob
from backend.app.metadata.manager import MetadataManager

class ReportGenerator:
    @staticmethod
    def get_inventory_records(db: Session) -> List[Dict[str, Any]]:
        results = db.query(ScanResult).order_by(ScanResult.created_at.desc()).all()
        records = []
        for r in results:
            meta, meta_status = MetadataManager.match_metadata(
                db, r.dataset_name, r.table_name, r.column_name
            )
            records.append({
                "id": r.id,
                "dataset_name": r.dataset_name,
                "source_type": r.source_type,
                "table_name": r.table_name or "N/A",
                "column_name": r.column_name,
                "candidate_class": r.candidate_class,
                "confidence_score": round(r.confidence_score, 3),
                "review_status": r.review_status,
                "declared_purpose": meta.declared_purpose if meta else "",
                "retention_period": meta.retention_period if meta else "",
                "metadata_owner": meta.metadata_owner if meta else "",
                "metadata_status": meta_status,
                "evidence_summary": r.evidence_summary,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return records

    @staticmethod
    def compute_tamper_evident_seal(records: List[Dict[str, Any]]) -> str:
        """Computes a deterministic SHA-256 fingerprint representing the entire privacy inventory posture."""
        canonical_stream = "|".join(
            f"{r['dataset_name']}:{r['table_name']}:{r['column_name']}:{r['candidate_class']}:{r['confidence_score']}:{r['review_status']}:{r['declared_purpose']}:{r['retention_period']}"
            for r in sorted(records, key=lambda x: (x['dataset_name'], x['table_name'], x['column_name']))
        )
        return hashlib.sha256(canonical_stream.encode("utf-8")).hexdigest()

    @staticmethod
    def get_dpdp_matrix(db: Session) -> Dict[str, Any]:
        """Evaluates overall inventory against India's DPDP Act 2023 statutory principles."""
        records = ReportGenerator.get_inventory_records(db)
        total = len(records)

        with_purpose = sum(1 for r in records if r.get("declared_purpose") and str(r["declared_purpose"]).strip())
        with_retention = sum(1 for r in records if r.get("retention_period") and str(r["retention_period"]).strip())
        confirmed_count = sum(1 for r in records if r["review_status"] == "CONFIRMED")
        pending_count = sum(1 for r in records if r["review_status"] == "PENDING")

        minors_count = sum(1 for r in records if r["candidate_class"] == "date_of_birth" and "minor" in (r["evidence_summary"] or "").lower())
        verhoeff_count = sum(1 for r in records if r["candidate_class"] == "government_id" and "verhoeff" in (r["evidence_summary"] or "").lower())

        notice_pct = round((with_purpose / total * 100), 1) if total > 0 else 100.0
        retention_pct = round((with_retention / total * 100), 1) if total > 0 else 100.0

        # Weighted Readiness Score (Notice 40%, Retention 40%, Human Review 20%)
        review_pct = round((confirmed_count / total * 100), 1) if total > 0 else 100.0
        readiness_score = round((notice_pct * 0.40) + (retention_pct * 0.40) + (review_pct * 0.20), 1)

        if readiness_score >= 85:
            risk_level = "LOW RISK"
        elif readiness_score >= 65:
            risk_level = "MEDIUM RISK"
        elif readiness_score >= 40:
            risk_level = "HIGH RISK"
        else:
            risk_level = "CRITICAL GAP"

        seal = ReportGenerator.compute_tamper_evident_seal(records)

        principles = [
            {
                "principle": "Notice & Transparent Collection",
                "statutory_section": "DPDP Act 2023 Sec 5",
                "status": "COMPLIANT" if notice_pct >= 90 else ("ACTION_REQUIRED" if notice_pct >= 60 else "CRITICAL_GAP"),
                "score": notice_pct,
                "description": "Personal data fields must be linked to declared business processing notices.",
                "action_items": [f"{total - with_purpose} fields require declared collection purposes"] if total > with_purpose else ["All fields documented"]
            },
            {
                "principle": "Storage Limitation & Statutory Erasure",
                "statutory_section": "DPDP Act 2023 Sec 8(7)",
                "status": "COMPLIANT" if retention_pct >= 90 else ("ACTION_REQUIRED" if retention_pct >= 60 else "CRITICAL_GAP"),
                "score": retention_pct,
                "description": "Data must be erased upon purpose fulfillment; indefinite retention violates DPDP standards.",
                "action_items": [f"{total - with_retention} fields lack explicit retention schedules"] if total > with_retention else ["All retention schedules bounded"]
            },
            {
                "principle": "Children's Personal Data Safeguards",
                "statutory_section": "DPDP Act 2023 Sec 9",
                "status": "ACTION_REQUIRED" if minors_count > 0 else "COMPLIANT",
                "score": 100.0 if minors_count == 0 else 50.0,
                "description": "Strict prohibition against tracking or targeted advertising directed at individuals under 18.",
                "action_items": [f"{minors_count} child/minor records detected requiring verifiable parental consent"] if minors_count > 0 else ["No minor records detected"]
            },
            {
                "principle": "Accountability & Verifiable Audit Trail",
                "statutory_section": "DPDP Act 2023 Sec 8(5)",
                "status": "COMPLIANT" if pending_count == 0 else "ACTION_REQUIRED",
                "score": review_pct,
                "description": "Technical evidence must undergo human DPO review with immutable cryptographic audit seals.",
                "action_items": [f"{pending_count} candidate fields awaiting human confirmation"] if pending_count > 0 else ["All candidate detections adjudicated"]
            }
        ]

        recommendations = []
        if total > with_purpose:
            recommendations.append(f"Assign declared business purposes to {total - with_purpose} unlinked candidate fields.")
        if total > with_retention:
            recommendations.append(f"Define statutory retention schedules to eliminate indefinite data holding risks for {total - with_retention} fields.")
        if minors_count > 0:
            recommendations.append(f"Isolate {minors_count} minor records into heightened-security storage under DPDP Act Section 9.")
        if pending_count > 0:
            recommendations.append(f"Complete human adjudication for {pending_count} pending candidates in the Review Center.")
        if not recommendations:
            recommendations.append("All technical governance controls and statutory mappings are fully aligned.")

        return {
            "generated_at": datetime.datetime.now(datetime.timezone.utc),
            "overall_readiness_score": readiness_score,
            "risk_level": risk_level,
            "tamper_evident_seal_sha256": seal,
            "total_candidate_fields": total,
            "notice_readiness_pct": notice_pct,
            "retention_limitation_pct": retention_pct,
            "minors_data_detected_count": minors_count,
            "aadhaar_verhoeff_validated_count": verhoeff_count,
            "corporate_pan_suppressed_count": sum(1 for r in records if "corporate" in (r["evidence_summary"] or "").lower()),
            "principles": principles,
            "recommendations": recommendations
        }

    @staticmethod
    def generate_inventory_csv(db: Session) -> str:
        records = ReportGenerator.get_inventory_records(db)
        if not records:
            return "id,dataset_name,source_type,table_name,column_name,candidate_class,confidence_score,review_status,declared_purpose,retention_period,metadata_owner,metadata_status,evidence_summary,created_at\n"
        df = pd.DataFrame(records)
        return df.to_csv(index=False)

    @staticmethod
    def generate_gaps_csv(db: Session) -> str:
        records = ReportGenerator.get_inventory_records(db)
        gap_records = [
            r for r in records
            if r["metadata_status"] in ("Missing purpose", "Missing retention", "Missing both", "Ambiguous metadata match")
            or r["review_status"] == "PENDING"
            or r["confidence_score"] < 0.70
        ]
        if not gap_records:
            return "id,dataset_name,table_name,column_name,candidate_class,confidence_score,review_status,metadata_status,evidence_summary,identified_gap\n"
        
        enriched_gaps = []
        for g in gap_records:
            gaps_found = []
            if g["metadata_status"] != "Complete metadata":
                gaps_found.append(f"Metadata Gap: {g['metadata_status']}")
            if g["review_status"] == "PENDING":
                gaps_found.append("Human Review Pending")
            if g["confidence_score"] < 0.70:
                gaps_found.append("Borderline Confidence Detection (<0.70)")
            
            item = dict(g)
            item["identified_gap"] = " | ".join(gaps_found)
            enriched_gaps.append(item)

        df = pd.DataFrame(enriched_gaps)
        return df.to_csv(index=False)

    @staticmethod
    def generate_inventory_pdf(db: Session) -> bytes:
        records = ReportGenerator.get_inventory_records(db)
        matrix = ReportGenerator.get_dpdp_matrix(db)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=26, leftMargin=26, topMargin=26, bottomMargin=26
        )
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor("#16202c"),
            spaceAfter=4
        )
        meta_style = ParagraphStyle(
            'ReportMeta',
            parent=styles['Normal'],
            fontSize=8.5,
            textColor=colors.HexColor("#475569"),
            spaceAfter=10
        )
        cell_style = ParagraphStyle(
            'CellText',
            parent=styles['Normal'],
            fontSize=7.5,
            textColor=colors.HexColor("#1e293b")
        )
        head_style = ParagraphStyle(
            'HeadText',
            parent=styles['Normal'],
            fontSize=8,
            fontName="Helvetica-Bold",
            textColor=colors.white
        )

        elements = [
            Paragraph("PrivacyLens — Personal-Data Discovery & DPDP Statutory Evidence Inventory", title_style),
            Paragraph(
                f"Generated: {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | "
                f"Total Candidates: {len(records)} | Overall Readiness: <b>{matrix['overall_readiness_score']}% ({matrix['risk_level']})</b> | "
                f"SHA-256 Seal: <font name='Courier' size='7'>{matrix['tamper_evident_seal_sha256'][:24]}...</font>",
                meta_style
            ),
            HRFlowable(width="100%", thickness=1, color=colors.HexColor("#488099"), spaceAfter=8)
        ]

        # Executive Summary Box
        summary_data = [
            [
                Paragraph("<b>Total Candidates</b>", cell_style),
                Paragraph("<b>Notice Readiness (Sec 5)</b>", cell_style),
                Paragraph("<b>Retention Limitation (Sec 8)</b>", cell_style),
                Paragraph("<b>Minors / Children Data (Sec 9)</b>", cell_style),
                Paragraph("<b>Verhoeff Validated IDs</b>", cell_style)
            ],
            [
                Paragraph(f"<b>{matrix['total_candidate_fields']}</b> fields", cell_style),
                Paragraph(f"<b>{matrix['notice_readiness_pct']}%</b> declared", cell_style),
                Paragraph(f"<b>{matrix['retention_limitation_pct']}%</b> scheduled", cell_style),
                Paragraph(f"<b>{matrix['minors_data_detected_count']}</b> flagged", cell_style),
                Paragraph(f"<b>{matrix['aadhaar_verhoeff_validated_count']}</b> verified", cell_style)
            ]
        ]
        t_sum = Table(summary_data, colWidths=[140, 150, 150, 150, 150])
        t_sum.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_sum)
        elements.append(Spacer(1, 10))

        # Table data headers
        table_data = [[
            Paragraph("Dataset", head_style),
            Paragraph("Table", head_style),
            Paragraph("Column", head_style),
            Paragraph("Data Class", head_style),
            Paragraph("Conf", head_style),
            Paragraph("Status", head_style),
            Paragraph("Declared Purpose", head_style),
            Paragraph("Retention", head_style),
            Paragraph("Technical & Statutory Evidence", head_style)
        ]]

        for r in records[:45]:
            table_data.append([
                Paragraph(r["dataset_name"][:16], cell_style),
                Paragraph(r["table_name"][:14], cell_style),
                Paragraph(r["column_name"][:14], cell_style),
                Paragraph(r["candidate_class"].replace("_", " ").title(), cell_style),
                Paragraph(f"{r['confidence_score']:.2f}", cell_style),
                Paragraph(r["metadata_status"], cell_style),
                Paragraph((r["declared_purpose"] or "—")[:28], cell_style),
                Paragraph((r["retention_period"] or "—")[:15], cell_style),
                Paragraph(r["evidence_summary"][:55] + "...", cell_style),
            ])

        if len(table_data) == 1:
            table_data.append([Paragraph("No candidate personal data detected yet.", cell_style)] * 9)

        t = Table(table_data, colWidths=[80, 70, 75, 80, 38, 90, 105, 65, 137])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#16202c")),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(t)

        elements.append(Spacer(1, 10))
        disclaimer = Paragraph(
            "<b>Statutory Governance & Technical Disclaimer:</b> This report provides automated technical discovery evidence and DPDP Act 2023 readiness indicators for human DPO review. "
            "It does not constitute official legal advice or universal statutory certification under the Digital Personal Data Protection Act 2023. Reference: https://www.meity.gov.in/data-protection-framework",
            ParagraphStyle('Disclaimer', parent=styles['Normal'], fontSize=6.5, textColor=colors.HexColor("#64748b"))
        )
        elements.append(disclaimer)

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
