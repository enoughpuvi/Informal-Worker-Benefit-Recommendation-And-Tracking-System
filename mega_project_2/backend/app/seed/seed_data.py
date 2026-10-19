import json
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.database.session import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.worker_profile import WorkerProfile
from app.models.scheme import Scheme
from app.models.application import Application
from app.models.application_history import ApplicationStatusHistory
from app.models.document import ApplicationDocument
from app.models.notification import Notification
from app.models.audit_log import AuditLog

DEMO_ADMIN = {
    "email": "admin@welfare.gov.in",
    "password": "Admin@12345",
    "full_name": "Dr. Rajesh Verma (Joint Secretary Welfare)",
    "phone": "+91 98100 12345",
    "role": "admin"
}

DEMO_WORKERS = [
    {
        "full_name": "Ramesh Kumar",
        "email": "ramesh.worker@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43210",
        "age": 36,
        "gender": "Male",
        "state": "Delhi",
        "district": "North East Delhi",
        "city": "Seelampur",
        "occupation": "Construction Worker",
        "employment_type": "Daily Wage",
        "monthly_income": 12500.0,
        "experience_years": 8,
        "family_members": 4,
        "dependents_count": 3,
        "children_count": 2,
        "elderly_count": 1,
        "education_level": "Primary School",
        "disability_status": False,
        "existing_benefits": '["e-Shram Card", "Ration Card"]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Sunita Devi",
        "email": "sunita.devi@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43211",
        "age": 42,
        "gender": "Female",
        "state": "Maharashtra",
        "district": "Mumbai Suburban",
        "city": "Dharavi",
        "occupation": "Domestic Helper",
        "employment_type": "Piece-rate",
        "monthly_income": 9500.0,
        "experience_years": 12,
        "family_members": 3,
        "dependents_count": 2,
        "children_count": 2,
        "elderly_count": 0,
        "education_level": "No Formal Education",
        "disability_status": False,
        "existing_benefits": '["Ration Card"]',
        "identity_proof_type": "Voter ID"
    },
    {
        "full_name": "Rajesh Patel",
        "email": "rajesh.patel@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43212",
        "age": 29,
        "gender": "Male",
        "state": "Gujarat",
        "district": "Ahmedabad",
        "city": "Maninagar",
        "occupation": "Street Vendor",
        "employment_type": "Self-Employed",
        "monthly_income": 14000.0,
        "experience_years": 5,
        "family_members": 3,
        "dependents_count": 2,
        "children_count": 1,
        "elderly_count": 1,
        "education_level": "High School",
        "disability_status": False,
        "existing_benefits": '["PM SVANidhi 1st Tranche"]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Priya Sharma",
        "email": "priya.sharma@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43213",
        "age": 31,
        "gender": "Female",
        "state": "Rajasthan",
        "district": "Jaipur",
        "city": "Sanganer",
        "occupation": "Tailor / Garment Worker",
        "employment_type": "Piece-rate",
        "monthly_income": 8500.0,
        "experience_years": 6,
        "family_members": 4,
        "dependents_count": 2,
        "children_count": 2,
        "elderly_count": 0,
        "education_level": "Middle School",
        "disability_status": False,
        "existing_benefits": '[]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Mohammed Arif",
        "email": "mohammed.arif@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43214",
        "age": 38,
        "gender": "Male",
        "state": "Telangana",
        "district": "Hyderabad",
        "city": "Old City",
        "occupation": "Auto-Rickshaw Driver",
        "employment_type": "Self-Employed",
        "monthly_income": 16000.0,
        "experience_years": 10,
        "family_members": 5,
        "dependents_count": 4,
        "children_count": 3,
        "elderly_count": 1,
        "education_level": "Secondary School",
        "disability_status": False,
        "existing_benefits": '["e-Shram Card"]',
        "identity_proof_type": "Driving Licence"
    },
    {
        "full_name": "Lakshmi Bai",
        "email": "lakshmi.bai@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43215",
        "age": 48,
        "gender": "Female",
        "state": "Karnataka",
        "district": "Mysore",
        "city": "Nanjangud",
        "occupation": "Agricultural Laborer",
        "employment_type": "Daily Wage",
        "monthly_income": 7200.0,
        "experience_years": 20,
        "family_members": 2,
        "dependents_count": 1,
        "children_count": 0,
        "elderly_count": 1,
        "education_level": "No Formal Education",
        "disability_status": False,
        "existing_benefits": '["BPL Ration Card"]',
        "identity_proof_type": "Voter ID"
    },
    {
        "full_name": "Vikram Singh",
        "email": "vikram.singh@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43216",
        "age": 25,
        "gender": "Male",
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "city": "Gomti Nagar",
        "occupation": "Delivery Worker / Gig Worker",
        "employment_type": "Contract",
        "monthly_income": 15500.0,
        "experience_years": 2,
        "family_members": 3,
        "dependents_count": 1,
        "children_count": 0,
        "elderly_count": 1,
        "education_level": "Higher Secondary",
        "disability_status": False,
        "existing_benefits": '[]',
        "identity_proof_type": "PAN Card"
    },
    {
        "full_name": "Ananya Mondal",
        "email": "ananya.mondal@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43217",
        "age": 34,
        "gender": "Female",
        "state": "West Bengal",
        "district": "Kolkata",
        "city": "Howrah",
        "occupation": "Handicraft Artisan",
        "employment_type": "Self-Employed",
        "monthly_income": 11000.0,
        "experience_years": 9,
        "family_members": 4,
        "dependents_count": 3,
        "children_count": 2,
        "elderly_count": 1,
        "education_level": "High School",
        "disability_status": False,
        "existing_benefits": '["Artisan Card"]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Satish Yadav",
        "email": "satish.yadav@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43218",
        "age": 52,
        "gender": "Male",
        "state": "Bihar",
        "district": "Patna",
        "city": "Danapur",
        "occupation": "Electrician",
        "employment_type": "Self-Employed",
        "monthly_income": 13500.0,
        "experience_years": 22,
        "family_members": 5,
        "dependents_count": 3,
        "children_count": 2,
        "elderly_count": 1,
        "education_level": "Middle School",
        "disability_status": False,
        "existing_benefits": '["e-Shram Card"]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Meena Kumari",
        "email": "meena.kumari@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43219",
        "age": 28,
        "gender": "Female",
        "state": "Madhya Pradesh",
        "district": "Bhopal",
        "city": "Kolar",
        "occupation": "Sanitation Worker",
        "employment_type": "Contract",
        "monthly_income": 10500.0,
        "experience_years": 4,
        "family_members": 3,
        "dependents_count": 2,
        "children_count": 1,
        "elderly_count": 1,
        "education_level": "Primary School",
        "disability_status": False,
        "existing_benefits": '["Ration Card"]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Suresh Chandra",
        "email": "suresh.chandra@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43220",
        "age": 45,
        "gender": "Male",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "city": "Tambaram",
        "occupation": "Carpenter",
        "employment_type": "Daily Wage",
        "monthly_income": 14500.0,
        "experience_years": 18,
        "family_members": 4,
        "dependents_count": 3,
        "children_count": 2,
        "elderly_count": 1,
        "education_level": "Primary School",
        "disability_status": True,
        "existing_benefits": '["Disability Pension"]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Kavita Reddy",
        "email": "kavita.reddy@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43221",
        "age": 33,
        "gender": "Female",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "city": "Gajuwaka",
        "occupation": "Fishery Worker",
        "employment_type": "Self-Employed",
        "monthly_income": 11800.0,
        "experience_years": 7,
        "family_members": 4,
        "dependents_count": 2,
        "children_count": 2,
        "elderly_count": 0,
        "education_level": "High School",
        "disability_status": False,
        "existing_benefits": '["Matsyakara Bharosa"]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Gurpreet Singh",
        "email": "gurpreet.singh@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43222",
        "age": 27,
        "gender": "Male",
        "state": "Punjab",
        "district": "Ludhiana",
        "city": "Gill",
        "occupation": "Plumber",
        "employment_type": "Daily Wage",
        "monthly_income": 15000.0,
        "experience_years": 5,
        "family_members": 3,
        "dependents_count": 2,
        "children_count": 1,
        "elderly_count": 1,
        "education_level": "Higher Secondary",
        "disability_status": False,
        "existing_benefits": '[]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Fatima Begum",
        "email": "fatima.begum@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43223",
        "age": 39,
        "gender": "Female",
        "state": "Kerala",
        "district": "Kozhikode",
        "city": "Feroke",
        "occupation": "Beedi / Coir Worker",
        "employment_type": "Piece-rate",
        "monthly_income": 8000.0,
        "experience_years": 15,
        "family_members": 3,
        "dependents_count": 2,
        "children_count": 1,
        "elderly_count": 1,
        "education_level": "Middle School",
        "disability_status": False,
        "existing_benefits": '["Coir Workers Welfare Fund"]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Deepak Nayak",
        "email": "deepak.nayak@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43224",
        "age": 24,
        "gender": "Male",
        "state": "Odisha",
        "district": "Bhubaneswar",
        "city": "Chandrasekharpur",
        "occupation": "Mason / Helper",
        "employment_type": "Daily Wage",
        "monthly_income": 10000.0,
        "experience_years": 3,
        "family_members": 4,
        "dependents_count": 3,
        "children_count": 0,
        "elderly_count": 2,
        "education_level": "Primary School",
        "disability_status": False,
        "existing_benefits": '["BOCW Card"]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Reena Barman",
        "email": "reena.barman@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43225",
        "age": 30,
        "gender": "Female",
        "state": "Assam",
        "district": "Kamrup",
        "city": "Guwahati",
        "occupation": "Tea Plantation Worker",
        "employment_type": "Daily Wage",
        "monthly_income": 7500.0,
        "experience_years": 8,
        "family_members": 3,
        "dependents_count": 2,
        "children_count": 1,
        "elderly_count": 1,
        "education_level": "No Formal Education",
        "disability_status": False,
        "existing_benefits": '["Chah Bagicha Dhan Puraskar"]',
        "identity_proof_type": "Voter ID"
    },
    {
        "full_name": "Mohan Lal",
        "email": "mohan.lal@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43226",
        "age": 58,
        "gender": "Male",
        "state": "Haryana",
        "district": "Faridabad",
        "city": "NIT",
        "occupation": "Cobbler / Footwear Repairer",
        "employment_type": "Self-Employed",
        "monthly_income": 8500.0,
        "experience_years": 30,
        "family_members": 2,
        "dependents_count": 1,
        "children_count": 0,
        "elderly_count": 1,
        "education_level": "No Formal Education",
        "disability_status": False,
        "existing_benefits": '["e-Shram Card"]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Geeta Rathore",
        "email": "geeta.rathore@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43227",
        "age": 37,
        "gender": "Female",
        "state": "Chhattisgarh",
        "district": "Raipur",
        "city": "Telibandha",
        "occupation": "Street Food Vendor",
        "employment_type": "Self-Employed",
        "monthly_income": 13000.0,
        "experience_years": 7,
        "family_members": 4,
        "dependents_count": 3,
        "children_count": 2,
        "elderly_count": 1,
        "education_level": "Primary School",
        "disability_status": False,
        "existing_benefits": '[]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Arjun Soren",
        "email": "arjun.soren@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43228",
        "age": 26,
        "gender": "Male",
        "state": "Jharkhand",
        "district": "Ranchi",
        "city": "Hatia",
        "occupation": "Forest Produce Gatherer",
        "employment_type": "Self-Employed",
        "monthly_income": 6800.0,
        "experience_years": 6,
        "family_members": 5,
        "dependents_count": 4,
        "children_count": 2,
        "elderly_count": 2,
        "education_level": "Middle School",
        "disability_status": False,
        "existing_benefits": '["Ration Card"]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Saroj Bala",
        "email": "saroj.bala@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43229",
        "age": 44,
        "gender": "Female",
        "state": "Uttarakhand",
        "district": "Dehradun",
        "city": "Rishikesh",
        "occupation": "Midday Meal Cook / Helper",
        "employment_type": "Contract",
        "monthly_income": 6000.0,
        "experience_years": 11,
        "family_members": 3,
        "dependents_count": 2,
        "children_count": 1,
        "elderly_count": 1,
        "education_level": "Primary School",
        "disability_status": False,
        "existing_benefits": '[]',
        "identity_proof_type": "Aadhaar Card"
    },
    {
        "full_name": "Prakash Das",
        "email": "prakash.das@demo.in",
        "password": "Worker@12345",
        "phone": "+91 98765 43230",
        "age": 40,
        "gender": "Male",
        "state": "Bihar",
        "district": "Muzaffarpur",
        "city": "Brahampura",
        "occupation": "Rickshaw Puller",
        "employment_type": "Daily Wage",
        "monthly_income": 9200.0,
        "experience_years": 14,
        "family_members": 4,
        "dependents_count": 3,
        "children_count": 2,
        "elderly_count": 1,
        "education_level": "No Formal Education",
        "disability_status": False,
        "existing_benefits": '["e-Shram Card"]',
        "identity_proof_type": "Aadhaar Card"
    }
]

DEMO_SCHEMES = [
    {
        "scheme_id": "SCHEME-PMSYM-01",
        "scheme_name": "Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)",
        "description": "A voluntary and contributory pension scheme for unorganized workers to ensure dignified old age social security.",
        "category": "Pension",
        "department": "Ministry of Labour and Employment",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "Construction Worker, Street Vendor, Domestic Helper, Rickshaw Puller, Agricultural Laborer, Tailor, Carpenter",
        "minimum_age": 18,
        "maximum_age": 40,
        "income_limit": 15000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Should not be covered under EPFO / ESIC / NPS or income tax payer",
        "required_documents": '["Aadhaar Card", "Savings Bank Account / Jan Dhan Account Passbook"]',
        "benefits": "Assured monthly pension of ₹3,000 per month after attaining 60 years of age, with 50% family pension to spouse.",
        "benefit_amount": 3000.0,
        "application_process": "Self-enroll at maandhan.in or visit any Common Service Centre (CSC) with Aadhaar and bank details.",
        "official_url": "https://maandhan.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-PMJAY-02",
        "scheme_name": "Ayushman Bharat - PM Jan Arogya Yojana (PM-JAY)",
        "description": "Flagship public health insurance offering secondary and tertiary hospitalization cover without out-of-pocket expenses.",
        "category": "Health",
        "department": "National Health Authority",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "All",
        "minimum_age": 0,
        "maximum_age": 100,
        "income_limit": 20000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Families listed under SECC deprivation categories or state BPL rosters",
        "required_documents": '["Aadhaar Card", "Ration Card", "Identity Certificate"]',
        "benefits": "Cashless hospitalization coverage of up to ₹5,00,000 per family per year across empaneled public & private hospitals.",
        "benefit_amount": 500000.0,
        "application_process": "Verify eligibility on mera.pmjay.gov.in or generate Ayushman Card at any empaneled hospital / CSC.",
        "official_url": "https://pmjay.gov.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-PMSVANIDHI-03",
        "scheme_name": "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
        "description": "Micro-credit scheme designed to empower street vendors with affordable collateral-free working capital.",
        "category": "Financial Assistance",
        "department": "Ministry of Housing and Urban Affairs",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "Street Vendor, Hawker, Thele-wala, Fruit/Vegetable Seller, Cobbler, Tea Stall Owner",
        "minimum_age": 18,
        "maximum_age": 65,
        "income_limit": 25000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Vendors active in urban/peri-urban markets with vending recommendation",
        "required_documents": '["Aadhaar Card", "Vending Certificate / Letter of Recommendation (LoR)", "Bank Details"]',
        "benefits": "First loan tranche of ₹10,000, progressing to ₹20,000 and ₹50,000 with 7% interest subsidy on timely repayment and digital cashback.",
        "benefit_amount": 10000.0,
        "application_process": "Apply online at pmsvanidhi.mohua.gov.in or through Urban Local Bodies and CSC centers.",
        "official_url": "https://pmsvanidhi.mohua.gov.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-BOCW-04",
        "scheme_name": "Building & Other Construction Workers (BOCW) Welfare Fund",
        "description": "Statutory social welfare fund providing healthcare, maternity, tool grants, and children's education scholarships.",
        "category": "Social Security",
        "department": "State BOCW Welfare Boards / Labour Dept",
        "government_level": "State",
        "state": "All India",
        "target_occupation": "Construction Worker, Mason, Plumber, Electrician, Painter, Welder, Carpenter, Bar Bender",
        "minimum_age": 18,
        "maximum_age": 60,
        "income_limit": 18000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Worked at least 90 days in building or construction work in the preceding 12 months",
        "required_documents": '["90 Days Work Certificate / Contractor Letter", "Aadhaar Card", "Bank Passbook", "Passport Photos"]',
        "benefits": "Tool kit grant of ₹10,000, accidental disability cover of ₹2,00,000, maternity assistance of ₹25,000, and education stipends for children.",
        "benefit_amount": 15000.0,
        "application_process": "Register with the local District Labour Commissioner / State BOCW Portal.",
        "official_url": "https://labour.gov.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-PMSBY-05",
        "scheme_name": "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
        "description": "Ultra-affordable accidental insurance scheme offering financial security against sudden accidental death or permanent disability.",
        "category": "Insurance",
        "department": "Department of Financial Services",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "All",
        "minimum_age": 18,
        "maximum_age": 70,
        "income_limit": None,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Must have an active savings bank account with auto-debit consent",
        "required_documents": '["Aadhaar Card", "Savings Bank Account"]',
        "benefits": "Accidental death and full disability coverage of ₹2,00,000 for a nominal premium of just ₹20 per annum.",
        "benefit_amount": 200000.0,
        "application_process": "Enable auto-debit through your bank branch or internet banking portal.",
        "official_url": "https://financialservices.gov.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-PMJJBY-06",
        "scheme_name": "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)",
        "description": "Renewable one-year term life insurance cover offering death benefit protection to worker families.",
        "category": "Insurance",
        "department": "Department of Financial Services",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "All",
        "minimum_age": 18,
        "maximum_age": 50,
        "income_limit": None,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Active savings bank account with auto-debit consent",
        "required_documents": '["Aadhaar Card", "Bank Passbook", "Nominee Declaration"]',
        "benefits": "Life insurance payout of ₹2,00,000 to family in case of death due to any reason at ₹436 annual premium.",
        "benefit_amount": 200000.0,
        "application_process": "Enroll at your bank branch or through banking correspondent.",
        "official_url": "https://jansuraksha.gov.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-ESHRAM-07",
        "scheme_name": "e-Shram National Unorganized Worker Registry & Insurance",
        "description": "National database of unorganized workers offering universal UAN card and immediate accidental insurance.",
        "category": "Social Security",
        "department": "Ministry of Labour & Employment",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "All",
        "minimum_age": 16,
        "maximum_age": 59,
        "income_limit": 25000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Not a member of EPFO or ESIC",
        "required_documents": '["Aadhaar Card linked with Mobile", "Active Bank Account"]',
        "benefits": "12-digit Universal Account Number (UAN) with ₹2,00,000 accidental death cover and seamless interstate benefit portability.",
        "benefit_amount": 200000.0,
        "application_process": "Self-register free on eshram.gov.in or visit CSC center.",
        "official_url": "https://eshram.gov.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-PMAYG-08",
        "scheme_name": "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
        "description": "Financial housing assistance for homeless informal families and those living in kutcha or dilapidated dwellings.",
        "category": "Housing",
        "department": "Ministry of Rural Development",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "Agricultural Laborer, Rural Artisan, Forest Worker, Construction Worker",
        "minimum_age": 21,
        "maximum_age": 70,
        "income_limit": 15000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Houseless or living in 0-2 room kutcha houses with kutcha roof",
        "required_documents": '["Aadhaar Card", "Ration Card / SECC ID", "Land Possession / Gram Panchayat Certificate", "Bank Account"]',
        "benefits": "Direct financial grant of ₹1,20,000 in plains and ₹1,30,000 in hilly/difficult areas for pucca house construction.",
        "benefit_amount": 120000.0,
        "application_process": "Registration through Gram Sabha verification and AwaasSoft portal.",
        "official_url": "https://pmayg.nic.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-PMMVY-09",
        "scheme_name": "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
        "description": "Maternity incentive and wage-compensation program providing direct benefit transfer for pregnant women and lactating mothers.",
        "category": "Maternity",
        "department": "Ministry of Women and Child Development",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "Domestic Helper, Garment Worker, Agricultural Laborer, Midday Meal Cook, Artisan",
        "minimum_age": 19,
        "maximum_age": 45,
        "income_limit": 15000.0,
        "gender": "Female",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Pregnant women and lactating mothers for first two living children",
        "required_documents": '["Mother-Child Protection (MCP) Card", "Aadhaar Card of Mother and Husband", "Bank Account Details"]',
        "benefits": "Cash incentive of ₹5,000 in two installments for 1st child and ₹6,000 for 2nd female child directly into bank account.",
        "benefit_amount": 5000.0,
        "application_process": "Register at nearest Anganwadi Centre or approved government healthcare facility.",
        "official_url": "https://pmmvy.wcd.gov.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-NSAP-10",
        "scheme_name": "National Social Assistance Programme (NSAP) - Indira Gandhi Pension",
        "description": "Non-contributory monthly pension support for elderly citizens, widows, and persons with severe disabilities living below poverty line.",
        "category": "Pension",
        "department": "Ministry of Rural Development",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "All",
        "minimum_age": 60,
        "maximum_age": 100,
        "income_limit": 8000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Belonging to BPL (Below Poverty Line) household",
        "required_documents": '["Aadhaar Card", "BPL Ration Card", "Age Proof", "Bank Account"]',
        "benefits": "Monthly pension of ₹1,000 to ₹1,500 credited directly into beneficiary bank account.",
        "benefit_amount": 1000.0,
        "application_process": "Submit application form at Block Development Office (BDO) or Municipality Office.",
        "official_url": "https://nsap.nic.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-DAYNULM-11",
        "scheme_name": "Deendayal Antyodaya Yojana - National Urban Livelihoods Mission (DAY-NULM)",
        "description": "Skill training and subsidized entrepreneurship credit for urban informal workers and Self Help Groups (SHGs).",
        "category": "Skill Development",
        "department": "Ministry of Housing and Urban Affairs",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "Street Vendor, Tailor, Artisan, Electrician, Plumber, Beautician, Helper",
        "minimum_age": 18,
        "maximum_age": 45,
        "income_limit": 20000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Urban poor informal worker or member of recognized SHG",
        "required_documents": '["Aadhaar Card", "Urban Residence Proof", "Income Declaration", "Bank Account Details"]',
        "benefits": "Free certified skill training with guaranteed placement support and subsidized micro-enterprise loans up to ₹2,00,000 at 7% interest.",
        "benefit_amount": 200000.0,
        "application_process": "Register through Urban Local Body (ULB) city mission management unit.",
        "official_url": "https://nulm.gov.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-PMUY-12",
        "scheme_name": "Pradhan Mantri Ujjwala Yojana 2.0 (PMUY)",
        "description": "Clean cooking fuel initiative providing deposit-free LPG gas connections to women from underprivileged households.",
        "category": "Financial Assistance",
        "department": "Ministry of Petroleum and Natural Gas",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "All",
        "minimum_age": 18,
        "maximum_age": 80,
        "income_limit": 12000.0,
        "gender": "Female",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Adult female member of poor family with no existing LPG connection in household",
        "required_documents": '["Aadhaar Card", "Ration Card / 14-Point Declaration", "Bank Account Passbook"]',
        "benefits": "Free LPG connection with security deposit exemption, free first cylinder refill and hotplate stove.",
        "benefit_amount": 1600.0,
        "application_process": "Apply at nearest LPG distributor (Indane, Bharatgas, HP) or online at pmuy.gov.in.",
        "official_url": "https://pmuy.gov.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-PMKMY-13",
        "scheme_name": "Pradhan Mantri Kisan Maan-dhan Yojana (PM-KMY)",
        "description": "Old age pension cover specifically dedicated to small and marginal farmers with small landholdings.",
        "category": "Pension",
        "department": "Department of Agriculture and Farmers Welfare",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "Agricultural Laborer, Small Farmer, Tenant Farmer",
        "minimum_age": 18,
        "maximum_age": 40,
        "income_limit": 15000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Cultivable land up to 2 hectares in revenue records",
        "required_documents": '["Aadhaar Card", "Land Record (Khasra/Khatauni)", "Bank Account Details"]',
        "benefits": "Guaranteed minimum monthly pension of ₹3,000 upon reaching age 60.",
        "benefit_amount": 3000.0,
        "application_process": "Enroll at nearest CSC center or online at maandhan.in.",
        "official_url": "https://maandhan.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-PWDWELF-14",
        "scheme_name": "National Handicapped Finance and Development Support (Divyangjan Welfare)",
        "description": "Concessional credit and assistive equipment aids for informal workers with disabilities (PwD).",
        "category": "Disability Support",
        "department": "Department of Empowerment of Persons with Disabilities",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "All",
        "minimum_age": 18,
        "maximum_age": 60,
        "income_limit": 25000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Yes",
        "family_criteria": "Individual with 40% or more certified disability",
        "required_documents": '["UDID Card / Disability Certificate (40%+)", "Aadhaar Card", "Bank Passbook", "Income Certificate"]',
        "benefits": "Direct business setup soft loan up to ₹50,000 at 4% interest plus free assistive aids & motorized tricycles.",
        "benefit_amount": 50000.0,
        "application_process": "Apply through State Channelising Agency (SCA) or online via nhfdc.nic.in.",
        "official_url": "https://nhfdc.nic.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-PMV-15",
        "scheme_name": "PM Vishwakarma Scheme (Artisans & Traditional Craftsmen)",
        "description": "Holistic support package providing collateral-free enterprise loans, toolkits, and modern skill enhancement for traditional craft workers.",
        "category": "Skill Development",
        "department": "Ministry of Micro, Small and Medium Enterprises",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "Carpenter, Blacksmith, Cobbler, Mason, Barber, Tailor, Potter, Sculptor, Basket Maker",
        "minimum_age": 18,
        "maximum_age": 65,
        "income_limit": 25000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Engaged in one of 18 traditional family-based craft trades",
        "required_documents": '["Aadhaar Card", "Trade Verification Certificate", "Bank Account Details"]',
        "benefits": "Free modern toolkit incentive of ₹15,000, 5-7 days basic skill training with ₹500/day stipend, and collateral-free loan up to ₹3,00,000 at 5% interest.",
        "benefit_amount": 15000.0,
        "application_process": "Register via CSC with biometric authentication at pmvishwakarma.gov.in.",
        "official_url": "https://pmvishwakarma.gov.in",
        "status": "active"
    },
    {
        "scheme_id": "SCHEME-NFSA-16",
        "scheme_name": "National Food Security Act (NFSA) - Antyodaya Anna Yojana",
        "description": "Subsidized food grain entitlement providing hunger relief and nutritional security for poorest informal families.",
        "category": "Food Security",
        "department": "Department of Food and Public Distribution",
        "government_level": "Central",
        "state": "All India",
        "target_occupation": "All",
        "minimum_age": 0,
        "maximum_age": 100,
        "income_limit": 10000.0,
        "gender": "All",
        "education": "Any",
        "disability_eligibility": "Any",
        "family_criteria": "Destitute, landless agriculture workers, rural artisans, slum dwellers",
        "required_documents": '["Ration Card", "Aadhaar Card of all family members"]',
        "benefits": "35 kg of highly subsidized food grains (wheat, rice, coarse grains) per family per month completely free under PMGKAY.",
        "benefit_amount": 2500.0,
        "application_process": "Apply for Antyodaya / Priority Household Ration Card at local Food & Civil Supplies office.",
        "official_url": "https://dfpd.gov.in",
        "status": "active"
    }
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Create or verify Admin
        admin = db.query(User).filter(User.email == DEMO_ADMIN["email"]).first()
        if not admin:
            admin = User(
                email=DEMO_ADMIN["email"],
                hashed_password=get_password_hash(DEMO_ADMIN["password"]),
                full_name=DEMO_ADMIN["full_name"],
                phone=DEMO_ADMIN["phone"],
                role=DEMO_ADMIN["role"],
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"[*] Admin account created: {admin.email}")
        else:
            print(f"[*] Admin account already present: {admin.email}")

        # 2. Seed Schemes
        schemes_map = {}
        for s_data in DEMO_SCHEMES:
            scheme = db.query(Scheme).filter(Scheme.scheme_id == s_data["scheme_id"]).first()
            if not scheme:
                scheme = Scheme(**s_data)
                db.add(scheme)
                db.commit()
                db.refresh(scheme)
            schemes_map[scheme.scheme_id] = scheme
        print(f"[*] Seeded {len(schemes_map)} welfare schemes.")

        # 3. Seed Workers & Profiles
        workers_list = []
        for w_data in DEMO_WORKERS:
            worker = db.query(User).filter(User.email == w_data["email"]).first()
            if not worker:
                worker = User(
                    email=w_data["email"],
                    hashed_password=get_password_hash(w_data["password"]),
                    full_name=w_data["full_name"],
                    phone=w_data["phone"],
                    role="worker",
                    is_active=True
                )
                db.add(worker)
                db.flush()

                profile = WorkerProfile(
                    user_id=worker.id,
                    age=w_data["age"],
                    gender=w_data["gender"],
                    state=w_data["state"],
                    district=w_data["district"],
                    city=w_data["city"],
                    occupation=w_data["occupation"],
                    employment_type=w_data["employment_type"],
                    monthly_income=w_data["monthly_income"],
                    experience_years=w_data["experience_years"],
                    family_members=w_data["family_members"],
                    dependents_count=w_data["dependents_count"],
                    children_count=w_data["children_count"],
                    elderly_count=w_data["elderly_count"],
                    education_level=w_data["education_level"],
                    disability_status=w_data["disability_status"],
                    existing_benefits=w_data["existing_benefits"],
                    identity_proof_type=w_data["identity_proof_type"]
                )
                profile.calculate_completion()
                db.add(profile)
                db.commit()
                db.refresh(worker)
            workers_list.append(worker)
        print(f"[*] Seeded {len(workers_list)} realistic worker profiles.")

        # 4. Seed Applications across all 7 statuses + Rejected
        existing_apps_count = db.query(Application).count()
        if existing_apps_count < 30:
            STATUS_CHOICES = [
                ("APPLIED", 6),
                ("DOCUMENTS_PENDING", 4),
                ("DOCUMENTS_VERIFIED", 5),
                ("UNDER_REVIEW", 5),
                ("APPROVED", 6),
                ("BENEFIT_DISBURSED", 8),
                ("REJECTED", 3)
            ]

            scheme_keys = list(schemes_map.keys())
            app_counter = existing_apps_count + 1
            now = datetime.now(timezone.utc)

            for target_status, count in STATUS_CHOICES:
                for _ in range(count):
                    worker = random.choice(workers_list)
                    scheme_id = random.choice(scheme_keys)
                    scheme = schemes_map[scheme_id]

                    # Check if worker already has this scheme
                    has_app = db.query(Application).filter(Application.worker_id == worker.id, Application.scheme_id == scheme_id).first()
                    if has_app:
                        continue

                    # Random days ago
                    days_ago = random.randint(3, 45)
                    applied_date = now - timedelta(days=days_ago)

                    app_no = f"APP-2026-{app_counter:04d}{random.randint(10, 99)}"
                    app_counter += 1

                    disbursed_date = None
                    if target_status == "BENEFIT_DISBURSED":
                        disbursed_date = applied_date + timedelta(days=random.randint(5, 15))

                    app = Application(
                        application_no=app_no,
                        worker_id=worker.id,
                        scheme_id=scheme_id,
                        application_date=applied_date,
                        current_status=target_status,
                        benefit_amount=scheme.benefit_amount or 5000.0,
                        benefit_disbursed_date=disbursed_date,
                        assigned_admin_id=admin.id,
                        admin_remarks=f"Processed during state welfare drive. Status: {target_status.replace('_', ' ').title()}",
                        last_updated=disbursed_date or applied_date + timedelta(days=random.randint(1, 3))
                    )
                    db.add(app)
                    db.flush()

                    # Status History Trail
                    transitions_map = {
                        "APPLIED": ["APPLIED"],
                        "DOCUMENTS_PENDING": ["APPLIED", "DOCUMENTS_PENDING"],
                        "DOCUMENTS_VERIFIED": ["APPLIED", "DOCUMENTS_VERIFIED"],
                        "UNDER_REVIEW": ["APPLIED", "DOCUMENTS_VERIFIED", "UNDER_REVIEW"],
                        "APPROVED": ["APPLIED", "DOCUMENTS_VERIFIED", "UNDER_REVIEW", "APPROVED"],
                        "BENEFIT_DISBURSED": ["APPLIED", "DOCUMENTS_VERIFIED", "UNDER_REVIEW", "APPROVED", "BENEFIT_DISBURSED"],
                        "REJECTED": ["APPLIED", "DOCUMENTS_VERIFIED", "UNDER_REVIEW", "REJECTED"]
                    }

                    stages = transitions_map[target_status]
                    step_time = applied_date
                    prev = None

                    for st in stages:
                        rem = f"Moved to {st.replace('_', ' ').title()} stage"
                        if st == "REJECTED":
                            rem = "Worker household monthly income exceeds configured statutory limit."
                        elif st == "BENEFIT_DISBURSED":
                            rem = f"Disbursed welfare grant of ₹{int(app.benefit_amount):,} via PFMS Direct Benefit Transfer (DBT)."

                        hist = ApplicationStatusHistory(
                            application_id=app.id,
                            previous_status=prev,
                            new_status=st,
                            changed_by_id=admin.id if st != "APPLIED" else worker.id,
                            changed_by_name=admin.full_name if st != "APPLIED" else worker.full_name,
                            timestamp=step_time,
                            remarks=rem
                        )
                        db.add(hist)
                        prev = st
                        step_time += timedelta(days=random.randint(1, 4))

                    # Seed sample document
                    doc = ApplicationDocument(
                        application_id=app.id,
                        worker_id=worker.id,
                        document_type="Identity Proof (Aadhaar Card)",
                        file_name=f"{worker.full_name.replace(' ', '_')}_Aadhaar.pdf",
                        file_path="sample_aadhaar.pdf",
                        file_size=245000,
                        upload_date=applied_date,
                        status="Verified" if target_status in ["DOCUMENTS_VERIFIED", "UNDER_REVIEW", "APPROVED", "BENEFIT_DISBURSED"] else "Uploaded",
                        admin_remarks="Document verified via UIDAI portal" if target_status in ["APPROVED", "BENEFIT_DISBURSED"] else None,
                        verified_by_id=admin.id if target_status in ["APPROVED", "BENEFIT_DISBURSED"] else None,
                        verified_at=step_time if target_status in ["APPROVED", "BENEFIT_DISBURSED"] else None
                    )
                    db.add(doc)

                    # Seed Notification
                    notif = Notification(
                        user_id=worker.id,
                        title=f"Application {app_no}: {target_status.replace('_', ' ').title()}",
                        message=f"Your application for '{scheme.scheme_name}' is currently in {target_status.replace('_', ' ').title()}.",
                        type="application_status",
                        related_id=app_no,
                        is_read=random.choice([True, False]),
                        created_at=step_time
                    )
                    db.add(notif)

            db.commit()
            print("[*] Seeded 35+ realistic applications with status histories, documents, and notifications.")

        # 5. Seed Audit Logs
        audit_count = db.query(AuditLog).count()
        if audit_count < 10:
            actions = [
                ("STATUS_CHANGE", "application", "APP-2026-000101", "UNDER_REVIEW", "APPROVED"),
                ("DOCUMENT_VERIFICATION", "document", "DOC-401", "Uploaded", "Verified"),
                ("SCHEME_CREATED", "scheme", "SCHEME-PMSYM-01", "", "PM Shram Yogi Maan-dhan"),
                ("DATASET_IMPORT", "scheme", "government_schemes_template.csv", "", "Created 16 schemes"),
                ("STATUS_CHANGE", "application", "APP-2026-000105", "APPROVED", "BENEFIT_DISBURSED")
            ]
            for act, ent, ent_id, prev_v, new_v in actions:
                log = AuditLog(
                    user_id=admin.id,
                    user_name=admin.full_name,
                    action=act,
                    entity=ent,
                    entity_id=ent_id,
                    previous_value=prev_v,
                    new_value=new_v,
                    timestamp=datetime.now(timezone.utc) - timedelta(hours=random.randint(2, 72))
                )
                db.add(log)
            db.commit()
            print("[*] Seeded system audit logs.")

        print("\n=======================================================")
        print("DATABASE SEEDING COMPLETE FOR ACADEMIC MEGA PROJECT")
        print("=======================================================")
        print(f"Admin Login:  {DEMO_ADMIN['email']} / {DEMO_ADMIN['password']}")
        print("Demo Workers:")
        for w in DEMO_WORKERS[:3]:
            print(f"  - {w['full_name']} ({w['occupation']}): {w['email']} / {w['password']}")
        print("=======================================================\n")

    except Exception as e:
        db.rollback()
        print(f"[!] Error seeding database: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
