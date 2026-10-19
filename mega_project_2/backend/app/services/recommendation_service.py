from typing import List, Dict, Any, Tuple
import json
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.scheme import Scheme
from app.models.worker_profile import WorkerProfile
from app.schemas.scheme import SchemeOut
from app.schemas.recommendation import RecommendedSchemeOut, ScoreBreakdown
from app.services.eligibility_service import evaluate_worker_eligibility

class RecommendationEngine:
    """
    Explainable AI Recommendation Engine for Informal Workers.
    Calculates transparent 0-100 match score based on 8 weighted criteria
    and supplies an interpretable reason breakdown.
    Dynamically queries active schemes from the database.
    """

    def compute_scheme_score(self, scheme: Scheme, profile: WorkerProfile | None) -> Tuple[int, ScoreBreakdown, List[str], List[str]]:
        reasons: List[str] = []
        caveats: List[str] = []

        if not profile:
            # Cold start without profile
            breakdown = ScoreBreakdown(
                occupation=10.0,
                income=10.0,
                age=10.0,
                location=10.0,
                family=5.0,
                disability=2.5,
                education=2.5,
                other=2.5
            )
            return 50, breakdown, ["General recommendation for new users"], ["Complete your worker profile for personalized matching"]

        # 1. Occupation Match (25 points max)
        occ_score = 0.0
        target_occ = (scheme.target_occupation or "All").strip().lower()
        worker_occ = (profile.occupation or "").strip().lower()
        if target_occ in ["all", "all informal workers", "any"] or not target_occ:
            occ_score = 22.0
            reasons.append("Universal welfare program covering all informal & unorganized trades")
        elif worker_occ:
            targets = [t.strip().lower() for t in target_occ.replace(";", ",").split(",")]
            if any(t in worker_occ or worker_occ in t for t in targets):
                occ_score = 25.0
                reasons.append(f"Highly targeted scheme for your trade ({profile.occupation})")
            else:
                occ_score = 5.0
                caveats.append(f"Primary beneficiaries are {scheme.target_occupation}")
        else:
            occ_score = 12.0
            caveats.append("Specify your primary occupation in profile to improve job matching")

        # 2. Income Eligibility (20 points max)
        income_score = 0.0
        income_limit = scheme.income_limit
        worker_income = profile.monthly_income or 0.0
        if income_limit is None or income_limit <= 0:
            income_score = 20.0
            reasons.append("No restrictive income threshold for this program")
        elif worker_income > 0:
            if worker_income <= income_limit:
                income_score = 20.0
                reasons.append(f"Monthly income (₹{int(worker_income):,}) is well within scheme ceiling (₹{int(income_limit):,})")
            else:
                diff_pct = (worker_income - income_limit) / income_limit
                if diff_pct < 0.2:
                    income_score = 8.0
                    caveats.append(f"Income slightly exceeds listed threshold of ₹{int(income_limit):,}")
                else:
                    income_score = 0.0
                    caveats.append(f"Monthly income exceeds statutory cap of ₹{int(income_limit):,}")
        else:
            income_score = 10.0
            caveats.append("Income self-declaration or certificate needed")

        # 3. Age Requirement (15 points max)
        age_score = 0.0
        worker_age = profile.age or 0
        min_age = scheme.minimum_age or 18
        max_age = scheme.maximum_age or 60
        if worker_age > 0:
            if min_age <= worker_age <= max_age:
                age_score = 15.0
                reasons.append(f"Worker age ({worker_age} yrs) satisfies entry bracket ({min_age}–{max_age} yrs)")
            elif abs(worker_age - min_age) <= 2 or abs(worker_age - max_age) <= 2:
                age_score = 5.0
                caveats.append(f"Age {worker_age} is close to boundary ({min_age}–{max_age} yrs)")
            else:
                age_score = 0.0
                caveats.append(f"Age outside required range ({min_age}–{max_age} yrs)")
        else:
            age_score = 7.5
            caveats.append("Age not yet verified")

        # 4. Location Match (15 points max)
        loc_score = 0.0
        scheme_state = (scheme.state or "All India").strip().lower()
        worker_state = (profile.state or "").strip().lower()
        if scheme_state in ["all india", "national", "central", "all"] or not scheme_state:
            loc_score = 15.0
            reasons.append("Centrally sponsored / nationwide program valid across India")
        elif worker_state and (scheme_state in worker_state or worker_state in scheme_state):
            loc_score = 15.0
            reasons.append(f"Direct state-specific benefit for residents of {profile.state}")
        elif not worker_state:
            loc_score = 8.0
            caveats.append("Location state verification needed")
        else:
            loc_score = 2.0
            caveats.append(f"Scheme restricted to {scheme.state}")

        # 5. Family & Dependents Criteria (10 points max)
        family_score = 0.0
        dependents = profile.dependents_count or 0
        children = profile.children_count or 0
        elderly = profile.elderly_count or 0
        cat = (scheme.category or "").lower()
        if "family" in cat or "education" in cat or "maternity" in cat:
            if children > 0 or dependents > 0:
                family_score = 10.0
                reasons.append(f"Supports households with dependents/children ({children} children, {dependents} dependents)")
            else:
                family_score = 5.0
        elif "pension" in cat:
            if elderly > 0 or (worker_age and worker_age >= 40):
                family_score = 10.0
                reasons.append("Prioritizes workers planning for elderly social security")
            else:
                family_score = 7.0
        else:
            family_score = 8.0

        # 6. Disability Criteria (5 points max)
        dis_score = 0.0
        scheme_dis = (scheme.disability_eligibility or "Any").strip().lower()
        if scheme_dis in ["yes", "pwd", "disabled"]:
            if profile.disability_status:
                dis_score = 5.0
                reasons.append("Matches priority disability welfare quota")
            else:
                dis_score = 0.0
                caveats.append("Requires valid PwD certificate")
        else:
            dis_score = 5.0

        # 7. Education Criteria (5 points max)
        edu_score = 0.0
        scheme_edu = (scheme.education or "Any").strip().lower()
        if scheme_edu in ["any", "none", "all", ""]:
            edu_score = 5.0
            reasons.append("Zero educational barriers - accessible to all literacy levels")
        else:
            if profile.education_level:
                edu_score = 5.0
            else:
                edu_score = 2.5
                caveats.append(f"Educational documentation required: {scheme.education}")

        # 8. Other / Non-duplication Criteria (5 points max)
        other_score = 0.0
        existing = []
        if profile.existing_benefits:
            try:
                existing = json.loads(profile.existing_benefits)
            except Exception:
                existing = [profile.existing_benefits]
        
        # Check if worker already holds this exact scheme
        already_has = any(scheme.scheme_name.lower() in str(b).lower() for b in existing)
        if already_has:
            other_score = 1.0
            caveats.append("Profile indicates you may already be registered for this benefit")
        else:
            other_score = 5.0
            reasons.append("Net-new welfare benefit opportunity for your household")

        total_score = int(round(occ_score + income_score + age_score + loc_score + family_score + dis_score + edu_score + other_score))
        total_score = max(0, min(100, total_score))

        breakdown = ScoreBreakdown(
            occupation=round(occ_score, 1),
            income=round(income_score, 1),
            age=round(age_score, 1),
            location=round(loc_score, 1),
            family=round(family_score, 1),
            disability=round(dis_score, 1),
            education=round(edu_score, 1),
            other=round(other_score, 1)
        )

        return total_score, breakdown, reasons, caveats

    def get_recommendations_for_worker(self, db: Session, profile: WorkerProfile | None) -> List[RecommendedSchemeOut]:
        # Always query active schemes directly from database (Single Source of Truth)
        schemes = db.query(Scheme).filter(Scheme.status == "active").all()
        results: List[RecommendedSchemeOut] = []

        for scheme in schemes:
            score, breakdown, reasons, caveats = self.compute_scheme_score(scheme, profile)
            elig_info = evaluate_worker_eligibility(scheme, profile)

            # SchemeOut representation
            scheme_out = SchemeOut.model_validate(scheme)

            results.append(
                RecommendedSchemeOut(
                    scheme=scheme_out,
                    match_score=score,
                    reasons=reasons,
                    caveats=caveats,
                    breakdown=breakdown,
                    eligibility_status=elig_info["status"]
                )
            )

        # Rank schemes by match score descending
        results.sort(key=lambda x: x.match_score, reverse=True)
        return results

recommendation_engine = RecommendationEngine()
