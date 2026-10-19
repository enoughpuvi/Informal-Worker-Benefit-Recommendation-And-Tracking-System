from typing import Dict, Any, List
import json
from app.models.scheme import Scheme
from app.models.worker_profile import WorkerProfile

def evaluate_worker_eligibility(scheme: Scheme, profile: WorkerProfile | None) -> Dict[str, Any]:
    satisfied: List[str] = []
    missing: List[str] = []
    failed: List[str] = []
    
    if not profile:
        return {
            "scheme_id": scheme.scheme_id,
            "scheme_name": scheme.scheme_name,
            "status": "Potentially Eligible",
            "is_eligible": False,
            "match_percentage": 50,
            "satisfied_criteria": [],
            "missing_criteria": ["Worker profile incomplete - please update your profile details"],
            "failed_criteria": [],
            "remarks": "Please complete your worker profile to verify scheme eligibility."
        }

    # 1. Age check
    worker_age = profile.age
    if worker_age is not None and worker_age > 0:
        min_age = scheme.minimum_age or 18
        max_age = scheme.maximum_age or 60
        if min_age <= worker_age <= max_age:
            satisfied.append(f"Age {worker_age} meets requirement ({min_age}–{max_age} years)")
        else:
            failed.append(f"Age {worker_age} does not fall within required range of {min_age}–{max_age} years")
    else:
        missing.append("Age not provided in profile")

    # 2. Income check
    if scheme.income_limit is not None and scheme.income_limit > 0:
        if profile.monthly_income is not None and profile.monthly_income > 0:
            if profile.monthly_income <= scheme.income_limit:
                satisfied.append(f"Monthly income ₹{int(profile.monthly_income):,} is within ceiling of ₹{int(scheme.income_limit):,}")
            else:
                failed.append(f"Monthly income ₹{int(profile.monthly_income):,} exceeds scheme ceiling of ₹{int(scheme.income_limit):,}")
        else:
            missing.append(f"Income certificate / monthly income required (limit: ₹{int(scheme.income_limit):,})")
    else:
        satisfied.append("No strict monthly income cap specified")

    # 3. Occupation match
    target_occ = (scheme.target_occupation or "All").strip().lower()
    worker_occ = (profile.occupation or "").strip().lower()
    if target_occ == "all" or not target_occ:
        satisfied.append(f"Open to all informal trades (your occupation: {profile.occupation or 'General'})")
    else:
        if worker_occ:
            # Check substring match or list match
            target_list = [o.strip().lower() for o in target_occ.replace(";", ",").split(",")]
            matched = any(t in worker_occ or worker_occ in t for t in target_list)
            if matched:
                satisfied.append(f"Target occupation matches your trade ({profile.occupation})")
            else:
                failed.append(f"Scheme targets '{scheme.target_occupation}'; your profile lists '{profile.occupation}'")
        else:
            missing.append(f"Occupation not specified in profile (targets: {scheme.target_occupation})")

    # 4. Gender check
    scheme_gender = (scheme.gender or "All").strip().lower()
    worker_gender = (profile.gender or "").strip().lower()
    if scheme_gender == "all" or not scheme_gender:
        satisfied.append("Open to all genders")
    elif worker_gender:
        if scheme_gender in worker_gender or worker_gender in scheme_gender:
            satisfied.append(f"Gender requirement met ({profile.gender})")
        else:
            failed.append(f"Scheme designated for {scheme.gender} applicants only")
    else:
        missing.append(f"Gender not specified in profile ({scheme.gender} required)")

    # 5. State / Location check
    scheme_state = (scheme.state or "All India").strip().lower()
    worker_state = (profile.state or "").strip().lower()
    if scheme_state in ["all india", "national", "central", "all"]:
        satisfied.append("Applicable across all Indian states and Union Territories")
    elif worker_state:
        if scheme_state in worker_state or worker_state in scheme_state:
            satisfied.append(f"State location requirement satisfied ({profile.state})")
        else:
            failed.append(f"Scheme active only in {scheme.state}; your profile location is {profile.state}")
    else:
        missing.append(f"State/region not specified in profile ({scheme.state} required)")

    # 6. Disability check
    scheme_dis = (scheme.disability_eligibility or "Any").strip().lower()
    if scheme_dis == "any" or not scheme_dis:
        satisfied.append("Open to all individuals regardless of disability status")
    elif scheme_dis in ["yes", "pwd", "disabled"]:
        if profile.disability_status:
            satisfied.append("Disability/PwD criteria satisfied")
        else:
            failed.append("Scheme is reserved specifically for Persons with Disabilities (PwD)")

    # 7. Education check
    scheme_edu = (scheme.education or "Any").strip().lower()
    if scheme_edu in ["any", "none", "all", ""]:
        satisfied.append("No minimum education qualification barrier")
    else:
        if profile.education_level:
            satisfied.append(f"Education level recorded: {profile.education_level}")
        else:
            missing.append(f"Educational documentation required: {scheme.education}")

    # Determine overall status and score
    total_checks = len(satisfied) + len(missing) + len(failed)
    score_ratio = len(satisfied) / total_checks if total_checks > 0 else 1.0
    match_percentage = int(score_ratio * 100)

    if len(failed) > 0:
        status = "Not Eligible"
        is_eligible = False
        remarks = f"Does not meet {len(failed)} critical eligibility requirement(s)."
    elif len(missing) > 0:
        status = "Potentially Eligible"
        is_eligible = True  # Can apply once missing details/documents verified
        remarks = f"Likely eligible! Please provide or verify {len(missing)} missing detail(s)."
    else:
        status = "Eligible"
        is_eligible = True
        remarks = "Fully eligible! All criteria satisfied."

    return {
        "scheme_id": scheme.scheme_id,
        "scheme_name": scheme.scheme_name,
        "status": status,
        "is_eligible": is_eligible,
        "match_percentage": match_percentage,
        "satisfied_criteria": satisfied,
        "missing_criteria": missing,
        "failed_criteria": failed,
        "remarks": remarks
    }
