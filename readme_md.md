# Personal-Data Discovery and Privacy Evidence Inventory (A3-PS019-TC057)

A privacy discovery scanner built for AIORI Hackathon 3 that identifies candidate personal data across synthetic CSV files and SQL databases, maps findings to purpose and retention registers, and generates technical evidence inventories for human review.

## 📺 Youtube Link

>  YouTube: <https://youtu.be/BWVyN9AuqBE>

## 📌 Key Highlights

* **Multi-Source Connectors**: Extracts schemas and sampled values from CSV files and SQL databases.

* **Configurable YAML Rule Engine**: Evaluates field names, regex patterns, and validation rules to calculate confidence scores.

* **Target Classes**: Detects Name, Email, Phone, Date of Birth, and Government IDs (Aadhaar & PAN).

* **Low False Positives**: Uses the Verhoeff checksum algorithm to validate identity numbers before flagging.

* **Metadata Mapping & Gaps**: Links detected fields to purpose and retention schedules; flags missing metadata.

* **Evaluation Framework**: Calculates per-class precision and recall against a labelled benchmark test set.

* **Human-in-the-Loop**: Produces verifiable evidence for human review without making automated legal decisions.

## 👥 Contributors

* **Josewin Joshi** (`josewin.joshi@btech.christuniversity.in`)

* **Neal Sebastian** (`neal.sebastian@btech.christuniversity.in`)

* **Dr. Manu Elappila** (`manu.elappila@christuniversity.in`)

* **Institution**: Christ University | AIORI Hackathon 3