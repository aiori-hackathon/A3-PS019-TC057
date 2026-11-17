import re
import datetime
from typing import Tuple, Optional, Any, Dict

# ==============================================================================
# Verhoeff Algorithm Implementation (Official UIDAI Checksum Specification)
# Uses dihedral group D5 multiplication and permutation tables.
# ==============================================================================

VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

def verhoeff_validate(number_str: str) -> bool:
    """Validates an input digit string using the Verhoeff checksum algorithm."""
    clean = re.sub(r"\D", "", str(number_str))
    if not clean:
        return False
    c = 0
    reversed_digits = [int(x) for x in reversed(clean)]
    for idx, digit in enumerate(reversed_digits):
        c = VERHOEFF_D[c][VERHOEFF_P[idx % 8][digit]]
    return c == 0

def verhoeff_compute_check_digit(number_str: str) -> int:
    """Computes the 12th Verhoeff check digit for an 11-digit prefix."""
    clean = re.sub(r"\D", "", str(number_str))
    c = 0
    reversed_digits = [int(x) for x in reversed(clean)]
    for idx, digit in enumerate(reversed_digits):
        c = VERHOEFF_D[c][VERHOEFF_P[(idx + 1) % 8][digit]]
    return VERHOEFF_INV[c]


# ==============================================================================
# Indian Income Tax PAN Structure & Entity Type Map
# 4th Character determines the legal status of the taxpayer under Indian Law.
# ==============================================================================

PAN_ENTITY_TYPES = {
    "P": ("Individual", True, "Personal data (Individual taxpayer)"),
    "C": ("Company", False, "Corporate entity (Not personal data under DPDP Act)"),
    "H": ("HUF", True, "Hindu Undivided Family (Personal / Familial)"),
    "F": ("Firm", False, "Partnership firm / LLP (Corporate entity)"),
    "A": ("AOP", False, "Association of Persons"),
    "T": ("Trust", False, "Trust / Institutional entity"),
    "B": ("BOI", False, "Body of Individuals"),
    "L": ("Local Authority", False, "Municipal / Government local authority"),
    "J": ("Juridical", False, "Artificial Juridical Person"),
    "G": ("Government", False, "Government agency / Department")
}


# ==============================================================================
# Masking / Redaction Helpers (Zero-Exposure Memory Protection)
# ==============================================================================

def mask_person_name(val: str) -> str:
    parts = str(val).strip().split()
    if not parts:
        return "[MASKED]"
    masked_parts = []
    for p in parts:
        if len(p) <= 2:
            masked_parts.append(p[0] + "*")
        else:
            masked_parts.append(p[0] + "*" * (len(p) - 2) + p[-1])
    return " ".join(masked_parts)

def mask_email(val: str) -> str:
    s = str(val).strip()
    if "@" not in s:
        return "[MASKED_EMAIL]"
    local, domain = s.split("@", 1)
    masked_local = local[0] + "***" + (local[-1] if len(local) > 1 else "")
    return f"{masked_local}@{domain}"

def mask_phone(val: str) -> str:
    s = str(val).strip()
    digits = re.sub(r"\D", "", s)
    if len(digits) >= 10:
        return f"+XX-XXXXX-{digits[-4:]}"
    return "[MASKED_PHONE]"

def mask_government_id(val: str) -> str:
    s = str(val).strip()
    clean = re.sub(r"[\s\-]", "", s)
    if len(clean) == 12 and clean.isdigit():
        return f"XXXX-XXXX-{clean[-4:]}"
    elif len(clean) == 10 and clean[:5].isalpha() and clean[5:9].isdigit():
        return f"{clean[:2]}*****{clean[-2:]}"
    elif len(clean) == 9 and clean.isdigit():
        return f"XXX-XX-{clean[-4:]}"
    return f"ID-***{s[-3:]}" if len(s) >= 4 else "[MASKED_ID]"

def mask_dob(val: str) -> str:
    s = str(val).strip()
    if len(s) >= 8:
        return f"****-**-{s[-2:]}"
    return "[MASKED_DOB]"

def mask_sample_value(data_class: str, value: Any) -> str:
    if value is None or str(value).lower() in ("nan", "none", "null", ""):
        return "[NULL]"
    s = str(value).strip()
    if data_class == "person_name":
        return mask_person_name(s)
    elif data_class == "email_address":
        return mask_email(s)
    elif data_class == "phone_number":
        return mask_phone(s)
    elif data_class == "government_id":
        return mask_government_id(s)
    elif data_class == "date_of_birth":
        return mask_dob(s)
    if len(s) > 4:
        return s[:2] + "***" + s[-2:]
    return "***"


# ==============================================================================
# Domain Format and Plausibility Validators
# ==============================================================================

def person_name_validator(value: str) -> Tuple[bool, str]:
    """Validates if value is structurally consistent with human person names."""
    if not isinstance(value, str):
        return False, "Not a string"
    s = value.strip()
    if len(s) < 2 or len(s) > 60:
        return False, "Length outside plausible name range (2-60)"

    if any(char.isdigit() for char in s):
        return False, "Contains digits"
    if any(char in "!@#$%^&*()_+=[]{}|;:\",<>?/" for char in s):
        return False, "Contains invalid punctuation"

    alpha_chars = sum(1 for c in s if c.isalpha())
    if alpha_chars / len(s) < 0.75:
        return False, "Insufficient alphabetic character density"

    return True, "Plausible name structure"

def email_address_validator(value: str) -> Tuple[bool, str]:
    """Validates standard email syntax and domain format."""
    s = str(value).strip()
    if "@" not in s or s.count("@") != 1:
        return False, "Must contain exactly one @"
    local_part, domain_part = s.split("@", 1)
    if not local_part or not domain_part:
        return False, "Missing local or domain component"
    if "." not in domain_part or domain_part.startswith(".") or domain_part.endswith("."):
        return False, "Invalid domain dot placement"
    tld = domain_part.split(".")[-1]
    if len(tld) < 2 or not tld.isalpha():
        return False, "Invalid top-level domain"
    if len(s) > 254:
        return False, "Exceeds RFC maximum email length"
    return True, "Valid email format"

def phone_number_validator(value: str) -> Tuple[bool, str]:
    """Validates phone number plausibility and digit count."""
    s = str(value).strip()
    digits = re.sub(r"\D", "", s)
    if len(digits) < 10 or len(digits) > 13:
        return False, f"Digit count {len(digits)} outside standard range (10-13)"

    if len(set(digits)) <= 2:
        return False, "Repetitive dummy digits detected"
    if digits in ("1234567890", "0123456789", "9876543210"):
        return False, "Obvious sequence dummy number"

    if len(digits) == 10 and digits[0] in "6789":
        return True, "Plausible Indian 10-digit mobile number"
    elif len(digits) == 12 and digits.startswith("91") and digits[2] in "6789":
        return True, "Plausible Indian mobile with 91 country code"
    elif 10 <= len(digits) <= 13:
        return True, "Plausible standard telephone format"
    return False, "Non-standard phone format"

def government_id_validator(value: str) -> Tuple[bool, str]:
    """
    Validates Indian Aadhaar (Verhoeff checksum + UIDAI format), Indian PAN (Entity type check),
    and standard national identity structures.
    """
    s = str(value).strip().upper()
    clean = re.sub(r"[\s\-]", "", s)

    # 1. Indian PAN: 5 letters, 4 digits, 1 letter
    if len(clean) == 10 and clean[:5].isalpha() and clean[5:9].isdigit() and clean[9].isalpha():
        fourth_char = clean[3]
        if fourth_char in PAN_ENTITY_TYPES:
            entity_name, is_personal, desc = PAN_ENTITY_TYPES[fourth_char]
            if is_personal:
                return True, f"Indian PAN ({entity_name}): {desc}"
            else:
                # Corporate PAN (e.g. C for Company) is NOT personal data!
                return False, f"Corporate PAN detected ({entity_name}) - Excluded from PII classification"
        return True, "Matches Indian PAN format structure (5 letters, 4 digits, 1 letter)"

    # 2. Indian Aadhaar style: 12 digits, cannot start with 0 or 1, validated with Verhoeff
    if len(clean) == 12 and clean.isdigit():
        if clean[0] in ("0", "1"):
            return False, "Aadhaar specification: cannot begin with 0 or 1"

        is_verhoeff_valid = verhoeff_validate(clean)
        if is_verhoeff_valid:
            return True, "Indian Aadhaar candidate: 12-digit UIDAI structure & Verhoeff D5 Checksum Validated"
        else:
            return True, "Matches 12-digit Aadhaar candidate structure (Verhoeff checksum unverified / synthetic)"

    # 3. US SSN style: 9 digits, 3-2-4
    if len(clean) == 9 and clean.isdigit():
        if clean.startswith("000") or clean[3:5] == "00" or clean[5:] == "0000":
            return False, "Invalid SSN group zeroes"
        return True, "Matches 9-digit national identity format"

    return False, "Does not conform to recognized government ID format"

def dob_validator(value: str) -> Tuple[bool, str]:
    """
    Validates calendar date plausibility for birth date.
    Detects Children / Minor data for DPDP Act 2023 Section 9 heightened safeguards.
    """
    s = str(value).strip()
    if not s or len(s) < 6:
        return False, "Value too short to be a date"

    if not any(char.isdigit() for char in s) or not any(sep in s for sep in "-/."):
        return False, "Not a recognized calendar date format"

    date_str = s.split()[0].split("T")[0]
    if not date_str:
        return False, "Empty date portion"

    date_obj = None
    formats = [
        "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y",
        "%Y/%m/%d", "%d.%m.%Y", "%Y.%m.%d"
    ]
    for fmt in formats:
        try:
            date_obj = datetime.datetime.strptime(date_str, fmt)
            break
        except ValueError:
            continue

    if not date_obj:
        return False, "Unrecognized date format"

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    year = date_obj.year

    if date_obj > now:
        return False, "Date is in the future; cannot be Date of Birth"

    age_years = (now - date_obj).days / 365.25
    if age_years < 0 or age_years > 125:
        return False, f"Implausible human age ({age_years:.1f} years)"

    if year < 1900:
        return False, "Birth year precedes 1900"

    is_minor = age_years < 18
    if is_minor:
        return True, f"Plausible DOB: Minor/Child (~{int(age_years)} yrs) - DPDP Act Sec 9 heightened consent applies"
    return True, f"Plausible Date of Birth (~{int(age_years)} yrs old)"


VALIDATOR_MAP = {
    "person_name_validator": person_name_validator,
    "email_address_validator": email_address_validator,
    "phone_number_validator": phone_number_validator,
    "government_id_validator": government_id_validator,
    "dob_validator": dob_validator,
}
