"""
Seed data for Trusted Government Portals & Linked Schemes Directory.
Only verified, authentic official government portals are included.
"""

PORTALS_DATA = [
    {
        "id": "myscheme",
        "name": "myScheme Portal (Government of India)",
        "hindi_name": "माई स्कीम राष्ट्रीय पोर्टल",
        "description": "National citizen platform by MeitY and Digital India Corporation enabling unorganized workers and citizens to discover government welfare schemes across Central and State ministries using profile-based filtering.",
        "government_level": "Central",
        "state": "All India",
        "responsible_department": "Ministry of Electronics & Information Technology (MeitY) & Digital India Corporation",
        "categories": [
            "Labour and Employment",
            "Pension and Social Security",
            "Health and Insurance",
            "Agriculture",
            "Education",
            "Housing",
            "Women and Child Welfare",
            "Financial Assistance",
            "Skill Development"
        ],
        "information_available": [
            "Eligibility Criteria Checklists",
            "Benefit Entitlements & Calculations",
            "Required Identity & Income Documents",
            "Step-by-step Application Process",
            "Direct Official Application Links"
        ],
        "supported_languages": [
            "Hindi", "English", "Marathi", "Gujarati", "Bengali", "Tamil", "Telugu", "Kannada", "Malayalam", "Odia", "Punjabi", "Assamese"
        ],
        "official_url": "https://www.myscheme.gov.in/",
        "application_url": "https://www.myscheme.gov.in/find-scheme",
        "portal_type": "Informational & Discovery",
        "verification_status": "Verified",
        "last_verified_date": "2026-10-15",
        "review_frequency_days": 30,
        "schemes_count": 580,
        "notes": "Official Central Government unified scheme discovery gateway with multi-criteria screening."
    },
    {
        "id": "national-portal-india",
        "name": "National Portal of India (india.gov.in)",
        "hindi_name": "भारत का राष्ट्रीय पोर्टल",
        "description": "The single-entry national gateway for all Government of India citizen services, welfare scheme directories, citizen rights, gazettes, and official notifications curated by the National Informatics Centre (NIC).",
        "government_level": "Central",
        "state": "All India",
        "responsible_department": "National Informatics Centre (NIC), Ministry of Electronics & IT",
        "categories": [
            "Labour and Employment",
            "Pension and Social Security",
            "Health and Insurance",
            "Agriculture",
            "Housing",
            "Women and Child Welfare"
        ],
        "information_available": [
            "Central Ministry Scheme Directories",
            "State Government Links Directory",
            "Citizen Charters & Statutory Entitlements",
            "Official Gazette & Guidelines PDFs"
        ],
        "supported_languages": ["English", "Hindi"],
        "official_url": "https://www.india.gov.in/my-government/schemes",
        "application_url": "https://www.india.gov.in/",
        "portal_type": "Informational & Discovery",
        "verification_status": "Verified",
        "last_verified_date": "2026-10-15",
        "review_frequency_days": 60,
        "schemes_count": 420,
        "notes": "Authoritative national repository linking to all Central and State government schemes."
    },
    {
        "id": "services-india",
        "name": "National Government Services Portal",
        "hindi_name": "राष्ट्रीय सरकारी सेवाएं पोर्टल",
        "description": "Unified services directory providing direct online transactional access to over 14,000+ public services, certificates, permits, and financial grants for informal workers and rural citizens.",
        "government_level": "Central",
        "state": "All India",
        "responsible_department": "National Informatics Centre (NIC), Government of India",
        "categories": [
            "Labour and Employment",
            "Financial Assistance",
            "Agriculture",
            "Education",
            "Housing"
        ],
        "information_available": [
            "Direct Online Application Links",
            "Service Level Agreements (Turnaround Times)",
            "Department Contact Points",
            "Tracking & Receipt Verification"
        ],
        "supported_languages": ["English", "Hindi"],
        "official_url": "https://services.india.gov.in/",
        "application_url": "https://services.india.gov.in/service/search",
        "portal_type": "Direct Application & Service",
        "verification_status": "Verified",
        "last_verified_date": "2026-10-15",
        "review_frequency_days": 30,
        "schemes_count": 14000,
        "notes": "Enables direct digital form submission for birth/caste/income certificates and social grants."
    },
    {
        "id": "mahadbt",
        "name": "Maharashtra MahaDBT Portal",
        "hindi_name": "महाराष्ट्र महाडीबीटी पोर्टल",
        "description": "Direct Benefit Transfer (DBT) state portal by the Government of Maharashtra for disbursing pensions, unorganized labor board (BOCW) allowances, educational scholarships, and farmer subsidies.",
        "government_level": "State",
        "state": "Maharashtra",
        "responsible_department": "Department of Information Technology, Government of Maharashtra",
        "categories": [
            "Labour and Employment",
            "Pension and Social Security",
            "Education",
            "Agriculture",
            "Financial Assistance"
        ],
        "information_available": [
            "DBT Welfare Grant Guidelines",
            "Aadhaar Seeded Bank Account Verification",
            "BOCW Worker Allowance Tracking",
            "Annual Scholarship Registration"
        ],
        "supported_languages": ["Marathi", "English"],
        "official_url": "https://mahadbt.maharashtra.gov.in/",
        "application_url": "https://mahadbt.maharashtra.gov.in/Login/Login",
        "portal_type": "State Unified Portal",
        "verification_status": "Verified",
        "last_verified_date": "2026-10-15",
        "review_frequency_days": 30,
        "schemes_count": 85,
        "notes": "Premier state DBT delivery engine for labor board grants, pre-matric and post-matric benefits."
    },
    {
        "id": "eshram",
        "name": "e-Shram National Database of Unorganized Workers",
        "hindi_name": "ई-श्रम राष्ट्रीय असंगठित कामगार पोर्टल",
        "description": "The Ministry of Labour & Employment flagship portal for universal registration of unorganized workers, issuing the 12-digit Universal Account Number (UAN) and linking workers to accident insurance and social welfare boards.",
        "government_level": "Central",
        "state": "All India",
        "responsible_department": "Ministry of Labour and Employment, Government of India",
        "categories": [
            "Labour and Employment",
            "Pension and Social Security",
            "Health and Insurance",
            "Financial Assistance"
        ],
        "information_available": [
            "e-Shram Card Registration & UAN Generation",
            "PM Suraksha Bima Yojana Accidental Cover",
            "Integration with State Welfare Boards",
            "Migrant Worker Job Discovery Connect"
        ],
        "supported_languages": ["Hindi", "English", "Marathi", "Bengali", "Tamil", "Telugu", "Gujarati", "Odia", "Punjabi", "Assamese", "Kannada", "Malayalam"],
        "official_url": "https://eshram.gov.in/",
        "application_url": "https://register.eshram.gov.in/#/user/self",
        "portal_type": "Direct Application & Service",
        "verification_status": "Verified",
        "last_verified_date": "2026-10-15",
        "review_frequency_days": 15,
        "schemes_count": 12,
        "notes": "Primary national identity foundation for all informal sector welfare disbursement."
    },
    {
        "id": "pmsym-maandhan",
        "name": "Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)",
        "hindi_name": "प्रधानमंत्री श्रम योगी मान-धन पेंशन पोर्टल",
        "description": "Official voluntary pension enrolment portal providing ₹3,000 monthly pension to unorganized workers entering between 18-40 years with matching 50% contribution from Central Government.",
        "government_level": "Central",
        "state": "All India",
        "responsible_department": "Ministry of Labour and Employment & Life Insurance Corporation (LIC)",
        "categories": ["Pension and Social Security", "Labour and Employment"],
        "information_available": [
            "Age-Wise Monthly Contribution Chart",
            "Online Self-Enrollment Process",
            "LIC Nominee & Family Pension Rules",
            "CSC VLE Centre Locator"
        ],
        "supported_languages": ["Hindi", "English"],
        "official_url": "https://maandhan.in/",
        "application_url": "https://maandhan.in/shramyogi",
        "portal_type": "Direct Application & Service",
        "verification_status": "Verified",
        "last_verified_date": "2026-10-15",
        "review_frequency_days": 30,
        "schemes_count": 3,
        "notes": "Zero-paperwork enrolment using Aadhaar and Jan Dhan savings bank account."
    },
    {
        "id": "pmsvanidhi",
        "name": "PM SVANidhi Portal (Street Vendor AtmaNirbhar Nidhi)",
        "hindi_name": "पीएम स्वनिधि पोर्टल (स्ट्रीट वेंडर योजना)",
        "description": "Micro-credit portal providing working capital loans of ₹10,000, ₹20,000, and ₹50,000 with 7% interest subsidy and digital cashback incentives for urban street vendors and hawkers.",
        "government_level": "Central",
        "state": "All India",
        "responsible_department": "Ministry of Housing and Urban Affairs & SIDBI",
        "categories": ["Financial Assistance", "Labour and Employment"],
        "information_available": [
            "Direct Loan Application Submission",
            "Urban Local Body (ULB) Vending Certificate Verification",
            "Lender Bank Sanction & Disbursal Status",
            "Digital Transaction Cashback Tracker"
        ],
        "supported_languages": ["Hindi", "English", "Marathi", "Gujarati", "Tamil", "Telugu", "Bengali", "Kannada"],
        "official_url": "https://pmsvanidhi.mohua.gov.in/",
        "application_url": "https://pmsvanidhi.mohua.gov.in/Schemes/L1Apply",
        "portal_type": "Direct Application & Service",
        "verification_status": "Verified",
        "last_verified_date": "2026-10-15",
        "review_frequency_days": 15,
        "schemes_count": 3,
        "notes": "Accelerated digital approval workflow backed by Credit Guarantee Fund Trust."
    },
    {
        "id": "pmjay",
        "name": "Ayushman Bharat PM-JAY (National Health Authority)",
        "hindi_name": "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना",
        "description": "World's largest government-financed healthcare scheme portal offering ₹5,00,000 annual secondary and tertiary hospitalization cover per underprivileged family across 27,000+ empaneled hospitals.",
        "government_level": "Central",
        "state": "All India",
        "responsible_department": "National Health Authority (NHA), Ministry of Health & Family Welfare",
        "categories": ["Health and Insurance", "Women and Child Welfare"],
        "information_available": [
            "Am I Eligible (SECC & Ration Database Search)",
            "Empaneled Hospital Search by District & Specialty",
            "Ayushman Card Generation Procedure",
            "Package Rates & Cashless Treatment Guidelines"
        ],
        "supported_languages": ["Hindi", "English", "Bengali", "Gujarati", "Marathi", "Tamil", "Telugu", "Kannada", "Odia", "Punjabi", "Assamese"],
        "official_url": "https://pmjay.gov.in/",
        "application_url": "https://beneficiary.nha.gov.in/",
        "portal_type": "Direct Application & Service",
        "verification_status": "Verified",
        "last_verified_date": "2026-10-15",
        "review_frequency_days": 15,
        "schemes_count": 5,
        "notes": "Provides complete cashless access for surgeries, diagnostics, ICU care, and post-hospitalization."
    },
    {
        "id": "delhi-edistrict",
        "name": "Delhi e-District Citizen Portal",
        "hindi_name": "दिल्ली ई-डिस्ट्रिक्ट पोर्टल",
        "description": "Government of NCT Delhi online services portal for Delhi Building & Other Construction Workers Board (DBOCWWB) aid, monthly old-age pensions, widow allowances, and caste/income certificates.",
        "government_level": "State",
        "state": "Delhi",
        "responsible_department": "Department of Revenue & Labour Department, GNCTD",
        "categories": [
            "Labour and Employment",
            "Pension and Social Security",
            "Women and Child Welfare",
            "Financial Assistance"
        ],
        "information_available": [
            "DBOCW Construction Worker Registration & Renewal",
            "Maternity Benefit & Financial Assistance Forms",
            "Digital Certificate Verification & Issuance",
            "Doorstep Delivery of Public Services (1076)"
        ],
        "supported_languages": ["English", "Hindi"],
        "official_url": "https://edistrict.delhigovt.nic.in/",
        "application_url": "https://edistrict.delhigovt.nic.in/in/en/Public/CitizenRegistration.html",
        "portal_type": "State Unified Portal",
        "verification_status": "Verified",
        "last_verified_date": "2026-10-15",
        "review_frequency_days": 30,
        "schemes_count": 45,
        "notes": "Serves unorganized construction laborers, street vendors, and low-income families in Delhi."
    },
    {
        "id": "up-edistrict",
        "name": "Uttar Pradesh e-District (Janhit Portal)",
        "hindi_name": "उत्तर प्रदेश ई-डिस्ट्रिक्ट (जनहित पोर्टल)",
        "description": "State citizen portal for UP Building & Other Construction Workers Welfare Board (BOCW), destitute women pension, old age pension, and digital public certificate issuing across all 75 UP districts.",
        "government_level": "State",
        "state": "Uttar Pradesh",
        "responsible_department": "Centre for e-Governance, Government of Uttar Pradesh",
        "categories": [
            "Labour and Employment",
            "Pension and Social Security",
            "Women and Child Welfare",
            "Education"
        ],
        "information_available": [
            "UP BOCW Shramik Registration & Daughter Marriage Aid",
            "Kanya Sumangala Scheme Guidelines",
            "Old Age & Destitute Pension Application Forms",
            "Income, Domicile & Caste Verification"
        ],
        "supported_languages": ["Hindi", "English"],
        "official_url": "https://edistrict.up.gov.in/",
        "application_url": "https://edistrict.up.gov.in/edistrictup/",
        "portal_type": "State Unified Portal",
        "verification_status": "Verified",
        "last_verified_date": "2026-10-15",
        "review_frequency_days": 30,
        "schemes_count": 65,
        "notes": "Direct integration with Common Service Centres (CSC) and Jan Suvidha Kendras across UP."
    },
    {
        "id": "karnataka-sevasindhu",
        "name": "Karnataka Seva Sindhu Portal",
        "hindi_name": "कर्नाटक सेवा सिंधु पोर्टल",
        "description": "Unified electronic delivery of citizen services in Karnataka including Building Construction Workers Board (KBOCW) tools assistance, Gruha Lakshmi monthly aid, and artisan loans.",
        "government_level": "State",
        "state": "Karnataka",
        "responsible_department": "Department of Personnel & Administrative Reforms (e-Governance), Karnataka",
        "categories": [
            "Labour and Employment",
            "Women and Child Welfare",
            "Financial Assistance",
            "Housing"
        ],
        "information_available": [
            "KBOCW Smart Identity Card Application",
            "Gruha Lakshmi ₹2,000 Monthly Direct Transfer",
            "Toolkits & Safety Gear Distribution for Workers",
            "Caste, Income & Ration Card Services"
        ],
        "supported_languages": ["Kannada", "English"],
        "official_url": "https://sevasindhu.karnataka.gov.in/",
        "application_url": "https://sevasindhu.karnataka.gov.in/CitizenPortal/index.html",
        "portal_type": "State Unified Portal",
        "verification_status": "Needs verification",
        "last_verified_date": "2026-10-10",
        "review_frequency_days": 30,
        "schemes_count": 70,
        "notes": "Annual audit in progress for regional sub-service endpoints."
    }
]

PORTAL_SCHEMES_DATA = [
    {
        "id": "myscheme-pmsym",
        "portal_id": "myscheme",
        "portal_name": "myScheme Portal",
        "name": "Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)",
        "category": "Pension and Social Security",
        "responsible_department": "Ministry of Labour and Employment",
        "state_applicability": "All India",
        "target_occupation": "Construction Workers, Street Vendors, Domestic Helpers, Rickshaw Drivers",
        "eligibility": "Unorganized workers aged 18 to 40 with monthly income <= ₹15,000. Not enrolled in EPFO/ESIC/NPS.",
        "benefits": "Guaranteed minimum monthly pension of ₹3,000 after age 60, with 50% family pension for surviving spouse.",
        "required_documents": ["Aadhaar Card", "Savings Bank Account / Jan Dhan Account Passbook with IFSC", "Mobile Number"],
        "official_information_url": "https://www.myscheme.gov.in/schemes/pm-sym",
        "application_url": "https://maandhan.in/shramyogi",
        "last_verified_date": "2026-10-15",
        "verification_status": "Verified"
    },
    {
        "id": "myscheme-svanidhi",
        "portal_id": "pmsvanidhi",
        "portal_name": "PM SVANidhi Portal",
        "name": "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
        "category": "Financial Assistance",
        "responsible_department": "Ministry of Housing and Urban Affairs",
        "state_applicability": "All India",
        "target_occupation": "Street Vendors, Hawkers, Thele-walas, Cobblers, Fruit/Vegetable Sellers",
        "eligibility": "Urban and peri-urban street vendors active before or during statutory survey dates with Vending Certificate or LoR.",
        "benefits": "Initial working capital loan of ₹10,000, advancing to ₹20,000 and ₹50,000 on timely repayment with 7% interest subsidy.",
        "required_documents": ["Aadhaar Card", "Certificate of Vending / Letter of Recommendation (LoR)", "Bank Account Statement"],
        "official_information_url": "https://www.myscheme.gov.in/schemes/pmsvanidhi",
        "application_url": "https://pmsvanidhi.mohua.gov.in/Schemes/L1Apply",
        "last_verified_date": "2026-10-15",
        "verification_status": "Verified"
    },
    {
        "id": "myscheme-pmjay",
        "portal_id": "pmjay",
        "portal_name": "Ayushman Bharat PM-JAY",
        "name": "Ayushman Bharat - PM Jan Arogya Yojana (PM-JAY)",
        "category": "Health and Insurance",
        "responsible_department": "National Health Authority (NHA)",
        "state_applicability": "All India",
        "target_occupation": "All Unorganized & Informal Workers and Low-Income Households",
        "eligibility": "Families identified under SECC deprivation categories (D1-D7) or active NFSA BPL ration card rosters.",
        "benefits": "Cashless inpatient medical treatment of up to ₹5,00,000 per family per annum across empaneled public & private hospitals.",
        "required_documents": ["Aadhaar Card", "Ration Card / Family ID", "Registered Mobile Number"],
        "official_information_url": "https://www.myscheme.gov.in/schemes/pmjay",
        "application_url": "https://beneficiary.nha.gov.in/",
        "last_verified_date": "2026-10-15",
        "verification_status": "Verified"
    },
    {
        "id": "mahadbt-bocw-marriage",
        "portal_id": "mahadbt",
        "portal_name": "Maharashtra MahaDBT Portal",
        "name": "Maharashtra BOCW Worker Daughter Marriage Financial Assistance",
        "category": "Financial Assistance",
        "responsible_department": "Maharashtra Building and Other Construction Workers Welfare Board",
        "state_applicability": "Maharashtra",
        "target_occupation": "Registered Building & Construction Workers (BOCW)",
        "eligibility": "Registered BOCW construction laborer in Maharashtra with at least 90 days active work verification in the preceding year.",
        "benefits": "One-time direct grant of ₹30,000 to ₹51,000 towards marriage expenses of registered worker or up to two daughters.",
        "required_documents": ["BOCW Registration Card", "Aadhaar Card", "90 Days Work Certificate by Employer/Contractor", "Marriage Certificate", "Aadhaar Seeded Bank Passbook"],
        "official_information_url": "https://mahadbt.maharashtra.gov.in/",
        "application_url": "https://mahadbt.maharashtra.gov.in/Login/Login",
        "last_verified_date": "2026-10-15",
        "verification_status": "Verified"
    },
    {
        "id": "delhi-bocw-maternity",
        "portal_id": "delhi-edistrict",
        "portal_name": "Delhi e-District Citizen Portal",
        "name": "Delhi Construction Worker Maternity Benefit Scheme",
        "category": "Women and Child Welfare",
        "responsible_department": "Delhi Building and Other Construction Workers Welfare Board (DBOCWWB)",
        "state_applicability": "Delhi",
        "target_occupation": "Female Construction Workers, Helpers, Masons in NCT Delhi",
        "eligibility": "Registered female construction laborer with at least one year of continuous valid membership with DBOCWWB.",
        "benefits": "Direct financial assistance of ₹30,000 for female worker on birth of child, or ₹10,000 for male worker on wife delivery.",
        "required_documents": ["DBOCWWB Worker Registration Card", "Birth Certificate / Hospital Discharge Card", "Aadhaar Card", "Bank Passbook"],
        "official_information_url": "https://edistrict.delhigovt.nic.in/",
        "application_url": "https://edistrict.delhigovt.nic.in/in/en/Public/CitizenRegistration.html",
        "last_verified_date": "2026-10-15",
        "verification_status": "Verified"
    },
    {
        "id": "karnataka-gruhalakshmi",
        "portal_id": "karnataka-sevasindhu",
        "portal_name": "Karnataka Seva Sindhu Portal",
        "name": "Karnataka Gruha Lakshmi Direct Assistance Scheme",
        "category": "Women and Child Welfare",
        "responsible_department": "Department of Women & Child Development, Karnataka",
        "state_applicability": "Karnataka",
        "target_occupation": "Female Head of Low-Income and Informal Sector Households",
        "eligibility": "Female head of household registered in BPL, Antyodaya, or APL ration cards. Taxpaying families not eligible.",
        "benefits": "Direct financial assistance of ₹2,000 per month (₹24,000 annually) transferred via Direct Benefit Transfer.",
        "required_documents": ["Aadhaar Card of Female Head", "Spouse Aadhaar Card", "Ration Card (APL/BPL/AAY)", "Aadhaar-Linked Bank Account"],
        "official_information_url": "https://sevasindhu.karnataka.gov.in/",
        "application_url": "https://sevasindhu.karnataka.gov.in/CitizenPortal/index.html",
        "last_verified_date": "2026-10-10",
        "verification_status": "Needs verification"
    }
]

SCHEMES_DIRECTORY_DATA = PORTAL_SCHEMES_DATA
