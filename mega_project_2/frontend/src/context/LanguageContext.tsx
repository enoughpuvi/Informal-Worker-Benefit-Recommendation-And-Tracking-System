import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'mr';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // App Branding & Navigation
    app_name: 'Apana Benefits',
    app_subtitle: 'Informal Worker Welfare & Support Platform',
    dashboard: 'Dashboard',
    my_profile: 'My Profile',
    recommended_benefits: 'Recommended Schemes',
    all_schemes: 'All Schemes',
    my_applications: 'My Applications',
    track_applications: 'Track Application',
    documents: 'My Documents',
    notifications: 'Notifications',
    help_faq: 'Help & FAQ',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    admin_portal: 'Admin Portal',
    worker_portal: 'Worker Portal',

    // Admin Navigation
    schemes_mgmt: 'Scheme Management',
    dataset_upload: 'Upload Scheme Dataset',
    all_applications: 'Manage Applications',
    workers_directory: 'Workers Directory',
    analytics: 'Analytics & Insights',
    reports: 'Export Reports',
    audit_logs: 'Audit Logs',
    issues_grievances: 'Report Issue / Grievance',
    admin_issues: 'Issues & Grievances',
    trusted_portals: 'Trusted Government Portals',
    trusted_portals_desc: 'Browse verified official Central and State government welfare platforms, eligibility guidelines, and application gateways.',
    browse_by_central: 'Central Government Portals',
    browse_by_state: 'By State / UT',
    browse_by_category: 'By Scheme Category',
    browse_schemes_directory: 'Linked Schemes Directory',

    // Common Actions & Badges
    apply_now: 'Apply for Benefit',
    apply_scheme: 'Apply for Scheme',
    check_eligibility: 'Check Eligibility',
    view_details: 'View Details',
    upload_documents: 'Upload Documents',
    search_placeholder: 'Search schemes by name, trade or category...',
    track_placeholder: 'Enter Application ID (e.g. APP-2026-000123)',
    eligible: 'Eligible',
    potentially_eligible: 'Potentially Eligible',
    not_eligible: 'Not Eligible',
    match_score: 'Match Score',
    profile_completion: 'Profile Completion',
    benefits_disbursed: 'Benefits Received',
    status: 'Status',
    last_updated: 'Last Updated',
    why_recommended: 'Why this scheme matches you',
    save_changes: 'Save Changes',
    cancel: 'Cancel',
    confirm: 'Confirm',
    processing: 'Processing...',
    welcome_back: 'Welcome back',
    monthly_income: 'Monthly Income',
    occupation: 'Occupation',
    state: 'State',
    district: 'District',

    // Scheme Detail Page
    statutory_entitlement: 'Statutory Welfare Benefit Entitlement:',
    official_gov_portal: 'Official Government Portal',
    automated_eligibility_check: 'Automated Eligibility Check for Your Profile',
    satisfied_criteria: 'Satisfied Criteria',
    missing_requirements: 'Requirements to Verify / Missing Details:',
    fully_eligible: 'Fully eligible! All criteria satisfied.',
    scheme_guideline_benefits: 'Financial assistance and social welfare entitlement as per official government policy.',
    gov_scheme: 'Government Scheme',
    required_documents: 'Required Documents',
    category: 'Category',
    all_schemes_heading: 'Government Welfare Schemes Catalog',
    showing_active_schemes: 'Active Schemes',

    // Chatbot
    ai_chatbot_title: 'Apana AI Assistant',
    ask_scheme_queries: 'Ask welfare scheme queries',
    sample_questions: 'Sample Questions:',
    type_query_placeholder: 'Ask about schemes, eligibility, documents...',

    // Helplines
    official_helplines: 'Official National Social Security Helplines (Informational)',
    ministry_labour: 'Ministry of Labour Helpline',
    ayushman_bharat: 'Ayushman Bharat (PM-JAY)',
    pm_svanidhi: 'PM SVANidhi Portal',

    // Voice Assistant
    voice_assistant_title: 'Talk to Apana AI',
    voice_assistant_subtitle: 'Free Voice Assistant — Powered by Web Speech API',
    tap_to_speak: 'Tap to Speak',
    listening: 'Listening... Tap to Stop',
    you_said: 'You said:',
    ai_says: 'Apana AI says:',
    speak_answer: 'Speak Answer',
    stop_speaking: 'Stop Speaking',
    speak_again: 'Speak Again',
    type_question: 'Or type your question:',
    no_voice_support: 'Your browser does not support voice input. Please use Google Chrome or type your question below.',
    voice_language: 'Voice Language',
    analyzing_question: 'Analyzing your question...',
    question_placeholder: 'Your question will appear here...',
  },
  hi: {
    // App Branding & Navigation
    app_name: 'अपना बेनेफिट्स (Apana Benefits)',
    app_subtitle: 'असंगठित कामगार कल्याण एवं सहायता पोर्टल',
    dashboard: 'डैशबोर्ड (Dashboard)',
    my_profile: 'मेरी प्रोफ़ाइल (Profile)',
    recommended_benefits: 'मेरे लिए योजनाएं (Recommended)',
    all_schemes: 'सभी सरकारी योजनाएं (All Schemes)',
    my_applications: 'मेरे आवेदन (Applications)',
    track_applications: 'आवेदन की स्थिति देखें (Track)',
    documents: 'दस्तावेज़ (Documents)',
    notifications: 'सूचनाएं (Notifications)',
    help_faq: 'सहायता व प्रश्न (Help & FAQ)',
    logout: 'लॉग आउट (Logout)',
    login: 'लॉग इन करें (Login)',
    register: 'नया खाता बनाएं (Register)',
    admin_portal: 'प्रशासक पोर्टल (Admin)',
    worker_portal: 'श्रमिक पोर्टल (Worker)',

    // Admin Navigation
    schemes_mgmt: 'योजना प्रबंधन',
    dataset_upload: 'योजना डेटासेट अपलोड',
    all_applications: 'सभी आवेदन प्रबंधन',
    workers_directory: 'श्रमिक सूची',
    analytics: 'विश्लेषण और रिपोर्ट',
    reports: 'रिपोर्ट डाउनलोड करें',
    audit_logs: 'ऑडिट लॉग्स',
    issues_grievances: 'समस्या / शिकायत निवारण',
    admin_issues: 'शिकायतें एवं समस्याएं',
    trusted_portals: 'विश्वसनीय सरकारी पोर्टल',
    trusted_portals_desc: 'सत्यापित आधिकारिक केंद्र एवं राज्य सरकार कल्याणकारी पोर्टल और आवेदन गेटवे खोजें।',
    browse_by_central: 'केंद्र सरकार के पोर्टल',
    browse_by_state: 'राज्य / केंद्र शासित प्रदेश अनुसार',
    browse_by_category: 'योजना श्रेणी अनुसार',
    browse_schemes_directory: 'संबद्ध सरकारी योजना सूची',

    // Common Actions & Badges
    apply_now: 'योजना के लिए आवेदन करें (Apply for Benefit)',
    apply_scheme: 'आवेदन करें (Apply)',
    check_eligibility: 'पात्रता जांचें (Check Eligibility)',
    view_details: 'विवरण देखें (View Details)',
    upload_documents: 'दस्तावेज़ अपलोड करें',
    search_placeholder: 'योजना, व्यवसाय या श्रेणी खोजें...',
    track_placeholder: 'आवेदन संख्या दर्ज करें (उदा. APP-2026-000123)',
    eligible: 'पात्र (Eligible)',
    potentially_eligible: 'संभावित पात्र (Potentially Eligible)',
    not_eligible: 'अपात्र (Not Eligible)',
    match_score: 'सटीकता स्कोर',
    profile_completion: 'प्रोफ़ाइल पूर्णता',
    benefits_disbursed: 'प्राप्त लाभ राशि',
    status: 'वर्तमान स्थिति (Status)',
    last_updated: 'अंतिम अपडेट',
    why_recommended: 'यह योजना आपके लिए क्यों उपयुक्त है',
    save_changes: 'सुरक्षित करें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    processing: 'प्रक्रिया जारी है...',
    welcome_back: 'नमस्ते एवं स्वागत है',
    monthly_income: 'मासिक आय',
    occupation: 'मुख्य व्यवसाय',
    state: 'राज्य',
    district: 'ज़िला',

    // Scheme Detail Page
    statutory_entitlement: 'कानूनी कल्याणकारी लाभ अधिकार (Statutory Benefit Entitlement):',
    official_gov_portal: 'आधिकारिक सरकारी पोर्टल देखें',
    automated_eligibility_check: 'आपकी प्रोफ़ाइल के लिए स्वचालित पात्रता जांच (Automated Eligibility Check)',
    satisfied_criteria: 'संतुष्ट पात्रता नियम (Satisfied Criteria)',
    missing_requirements: 'सत्यापन योग्य आवश्यकताएं / छूटी जानकारी:',
    fully_eligible: 'पूर्णतः पात्र! सभी नियम एवं शर्तें संतुष्ट हैं।',
    scheme_guideline_benefits: 'सरकारी दिशानिर्देशों एवं नीति के अनुसार वित्तीय सहायता और सामाजिक सुरक्षा लाभ।',
    gov_scheme: 'सरकारी कल्याण योजना',
    required_documents: 'आवश्यक दस्तावेज़',
    category: 'श्रेणी (Category)',
    all_schemes_heading: 'सरकारी कल्याणकारी योजनाओं की सूची',
    showing_active_schemes: 'सक्रिय योजनाएं',

    // Chatbot
    ai_chatbot_title: 'अपना एआई सहायक (Apana AI Assistant)',
    ask_scheme_queries: 'योजनाओं के बारे में सवाल पूछें',
    sample_questions: 'उदाहरण प्रश्न:',
    type_query_placeholder: 'योजना, पात्रता, दस्तावेज़ या पेंशन के बारे में पूछें...',

    // Helplines
    official_helplines: 'राष्ट्रीय सामाजिक सुरक्षा आधिकारिक हेल्पलाइन (सहायतार्थ)',
    ministry_labour: 'श्रम एवं रोजगार मंत्रालय हेल्पलाइन',
    ayushman_bharat: 'आयुष्मान भारत (PM-JAY)',
    pm_svanidhi: 'पीएम स्वनिधि पोर्टल हेल्पलाइन',

    // Voice Assistant
    voice_assistant_title: 'अपना AI से बात करें (Talk to Apana AI)',
    voice_assistant_subtitle: 'मुफ़्त वॉइस असिस्टेंट — वेब स्पीच API द्वारा संचालित',
    tap_to_speak: 'बोलने के लिए टैप करें',
    listening: 'सुन रहा है... रोकने के लिए टैप करें',
    you_said: 'आपने कहा:',
    ai_says: 'अपना AI का उत्तर:',
    speak_answer: 'उत्तर सुनें',
    stop_speaking: 'बोलना बंद करें',
    speak_again: 'दोबारा सुनें',
    type_question: 'या अपना प्रश्न टाइप करें:',
    no_voice_support: 'आपका ब्राउज़र वॉइस इनपुट का समर्थन नहीं करता। कृपया Google Chrome उपयोग करें या नीचे टाइप करें।',
    voice_language: 'वॉइस भाषा',
    analyzing_question: 'आपके प्रश्न का विश्लेषण हो रहा है...',
    question_placeholder: 'आपका प्रश्न यहाँ दिखेगा...',
  },
  mr: {
    // App Branding & Navigation
    app_name: 'अपना बेनेफिट्स (Apana Benefits)',
    app_subtitle: 'अनौपचारिक कामगार कल्याण व सहाय्य व्यासपीठ',
    dashboard: 'डॅशबोर्ड (Dashboard)',
    my_profile: 'माझी प्रोफाइल (Profile)',
    recommended_benefits: 'शिफारस केलेल्या योजना (Recommended)',
    all_schemes: 'सर्व सरकारी योजना (All Schemes)',
    my_applications: 'माझे अर्ज (Applications)',
    track_applications: 'अर्जाची स्थिती पहा (Track)',
    documents: 'कागदपत्रे (Documents)',
    notifications: 'सूचना (Notifications)',
    help_faq: 'मदत व प्रश्न (Help & FAQ)',
    logout: 'लॉग आउट (Logout)',
    login: 'लॉग इन करा (Login)',
    register: 'नवीन खाते तयार करा (Register)',
    admin_portal: 'प्रशासक पोर्टल (Admin)',
    worker_portal: 'कामगार पोर्टल (Worker)',
    schemes_mgmt: 'योजना व्यवस्थापन',
    dataset_upload: 'योजना डेटासेट अपलोड',
    all_applications: 'सर्व अर्ज व्यवस्थापन',
    workers_directory: 'कामगार सूची',
    analytics: 'विश्लेषण आणि अहवाल',
    reports: 'अहवाल डाउनलोड करा',
    audit_logs: 'ऑडिट लॉग्स',
    issues_grievances: 'समस्या / तक्रार निवारण',
    admin_issues: 'तक्रारी आणि समस्या',
    trusted_portals: 'विश्वसनीय सरकारी पोर्टल',
    trusted_portals_desc: 'सत्यापित अधिकृत केंद्र व राज्य सरकार कल्याणकारी पोर्टल आणि अर्ज गेटवे शोधा.',
    browse_by_central: 'केंद्र सरकारचे पोर्टल',
    browse_by_state: 'राज्य / केंद्रशासित प्रदेशानुसार',
    browse_by_category: 'योजना श्रेणीनुसार',
    browse_schemes_directory: 'संबद्ध सरकारी योजना सूची',
    apply_now: 'योजनेसाठी अर्ज करा (Apply for Benefit)',
    apply_scheme: 'अर्ज करा (Apply)',
    check_eligibility: 'पात्रता तपासा (Check Eligibility)',
    view_details: 'तपशील पहा (View Details)',
    upload_documents: 'कागदपत्रे अपलोड करा',
    search_placeholder: 'योजना, व्यवसाय किंवा श्रेणी शोधा...',
    track_placeholder: 'अर्ज क्रमांक प्रविष्ट करा (उदा. APP-2026-000123)',
    eligible: 'पात्र (Eligible)',
    potentially_eligible: 'संभाव्य पात्र (Potentially Eligible)',
    not_eligible: 'अपात्र (Not Eligible)',
    match_score: 'अचूकता स्कोअर',
    profile_completion: 'प्रोफाइल पूर्णता',
    benefits_disbursed: 'प्राप्त लाभ रक्कम',
    status: 'सध्याची स्थिती (Status)',
    last_updated: 'शेवटचे अपडेट',
    why_recommended: 'ही योजना तुमच्यासाठी का योग्य आहे',
    save_changes: 'जतन करा',
    cancel: 'रद्द करा',
    confirm: 'पुष्टी करा',
    processing: 'प्रक्रिया सुरू आहे...',
    welcome_back: 'नमस्कार आणि स्वागत',
    monthly_income: 'मासिक उत्पन्न',
    occupation: 'मुख्य व्यवसाय',
    state: 'राज्य',
    district: 'जिल्हा',
    statutory_entitlement: 'वैधानिक कल्याणकारी लाभ हक्क (Statutory Benefit Entitlement):',
    official_gov_portal: 'अधिकृत सरकारी पोर्टल पहा',
    automated_eligibility_check: 'तुमच्या प्रोफाइलसाठी स्वयंचलित पात्रता तपासणी (Automated Eligibility Check)',
    satisfied_criteria: 'समाधानकारक पात्रता नियम (Satisfied Criteria)',
    missing_requirements: 'सत्यापन आवश्यक / गहाळ माहिती:',
    fully_eligible: 'पूर्णपणे पात्र! सर्व नियम व अटी पूर्ण.',
    scheme_guideline_benefits: 'सरकारी मार्गदर्शक तत्त्वे व धोरणानुसार आर्थिक सहाय्य आणि सामाजिक सुरक्षा लाभ.',
    gov_scheme: 'सरकारी कल्याण योजना',
    required_documents: 'आवश्यक कागदपत्रे',
    category: 'श्रेणी (Category)',
    all_schemes_heading: 'सरकारी कल्याणकारी योजनांची सूची',
    showing_active_schemes: 'सक्रिय योजना',
    ai_chatbot_title: 'अपना AI सहाय्यक (Apana AI Assistant)',
    ask_scheme_queries: 'योजनांबद्दल प्रश्न विचारा',
    sample_questions: 'उदाहरण प्रश्न:',
    type_query_placeholder: 'योजना, पात्रता, कागदपत्रे किंवा पेन्शनबद्दल विचारा...',
    official_helplines: 'राष्ट्रीय सामाजिक सुरक्षा अधिकृत हेल्पलाइन (सहाय्यार्थ)',
    ministry_labour: 'श्रम आणि रोजगार मंत्रालय हेल्पलाइन',
    ayushman_bharat: 'आयुष्मान भारत (PM-JAY)',
    pm_svanidhi: 'पीएम स्वनिधी पोर्टल हेल्पलाइन',
    // Voice Assistant
    voice_assistant_title: 'अपना AI शी बोला (Talk to Apana AI)',
    voice_assistant_subtitle: 'मोफत व्हॉइस असिस्टंट — वेब स्पीच API द्वारे',
    tap_to_speak: 'बोलण्यासाठी टॅप करा',
    listening: 'ऐकत आहे... थांबवण्यासाठी टॅप करा',
    you_said: 'तुम्ही म्हणालात:',
    ai_says: 'अपना AI चे उत्तर:',
    speak_answer: 'उत्तर ऐका',
    stop_speaking: 'बोलणे थांबवा',
    speak_again: 'पुन्हा ऐका',
    type_question: 'किंवा तुमचा प्रश्न टाइप करा:',
    no_voice_support: 'तुमचा ब्राउझर व्हॉइस इनपुट सपोर्ट करत नाही. कृपया Google Chrome वापरा किंवा खाली टाइप करा.',
    voice_language: 'व्हॉइस भाषा',
    analyzing_question: 'तुमच्या प्रश्नाचे विश्लेषण होत आहे...',
    question_placeholder: 'तुमचा प्रश्न येथे दिसेल...',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
