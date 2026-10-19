from typing import List, Dict, Any, Optional
import os
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from app.models.scheme import Scheme
from app.core.config import settings

class SchemeRAGService:
    """
    RAG (Retrieval-Augmented Generation) & Chatbot Service.
    Indexes active welfare schemes dynamically from the database.
    Provides semantic retrieval and grounded natural language answers.
    """
    def __init__(self):
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self.indexed_schemes: List[Dict[str, Any]] = []

    def index_schemes(self, db: Session):
        schemes = db.query(Scheme).filter(Scheme.status == "active").all()
        if not schemes:
            self.vectorizer = None
            self.tfidf_matrix = None
            self.indexed_schemes = []
            return

        documents = []
        self.indexed_schemes = []

        for s in schemes:
            content = f"{s.scheme_name} {s.category} {s.department or ''} {s.state or ''} {s.target_occupation or ''} {s.description} {s.benefits} {s.application_process or ''} {s.education or ''} {s.required_documents or ''}"
            documents.append(content)
            self.indexed_schemes.append({
                "scheme_id": s.scheme_id,
                "scheme_name": s.scheme_name,
                "category": s.category,
                "description": s.description,
                "benefits": s.benefits,
                "target_occupation": s.target_occupation,
                "income_limit": s.income_limit,
                "minimum_age": s.minimum_age,
                "maximum_age": s.maximum_age,
                "application_process": s.application_process,
                "required_documents": s.required_documents,
                "official_url": s.official_url
            })

        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.tfidf_matrix = self.vectorizer.fit_transform(documents)

    def retrieve_relevant_schemes(self, query: str, top_k: int = 3, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        if not self.indexed_schemes and db:
            self.index_schemes(db)

        if not self.vectorizer or self.tfidf_matrix is None or not self.indexed_schemes:
            return []

        query_vec = self.vectorizer.transform([query])
        sim_scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        top_indices = sim_scores.argsort()[::-1][:top_k]
        results = []
        for idx in top_indices:
            score = float(sim_scores[idx])
            scheme_data = self.indexed_schemes[idx].copy()
            scheme_data["relevance_score"] = round(score, 3)
            results.append(scheme_data)
        return results

    def answer_query(self, query: str, db: Session, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Always re-index if not yet initialized
        if not self.indexed_schemes:
            self.index_schemes(db)

        relevant = self.retrieve_relevant_schemes(query, top_k=3, db=db)

        # Check if query indicates Hindi preference
        is_hindi = bool(re.search(r'[\u0900-\u097F]', query)) or "hindi" in query.lower() or "kaise" in query.lower() or "yojana" in query.lower()

        # Check if Gemini API Key is available for generative response
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                
                context_str = "\n\n".join([
                    f"Scheme: {s['scheme_name']} ({s['scheme_id']})\n"
                    f"Category: {s['category']}\n"
                    f"Target Occupations: {s['target_occupation']}\n"
                    f"Income Limit: ₹{s['income_limit'] if s['income_limit'] else 'No limit'}\n"
                    f"Age: {s['minimum_age']} to {s['maximum_age']} yrs\n"
                    f"Benefits: {s['benefits']}\n"
                    f"Application Process: {s['application_process']}\n"
                    f"Required Documents: {s['required_documents']}"
                    for s in relevant
                ])

                user_info_str = ""
                if user_context:
                    user_info_str = f"Worker Profile: Occupation: {user_context.get('occupation')}, Age: {user_context.get('age')}, Monthly Income: ₹{user_context.get('monthly_income')}, State: {user_context.get('state')}."

                prompt = f"""You are an empathetic, clear social welfare assistant for informal and unorganized workers in India.
Answer the user's question accurately using ONLY the welfare schemes information provided below.
Explain in very simple, easy-to-understand terms with bullet points.
If the question is in Hindi or Hinglish, answer in simple Hindi/Hinglish. Otherwise, answer in simple English.

{user_info_str}

Retrieved Schemes:
{context_str}

User Question: {query}
"""
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                return {
                    "answer": response.text,
                    "retrieved_schemes": relevant,
                    "model": "Gemini 2.5 Flash (RAG Grounded)"
                }
            except Exception as e:
                # Graceful fallback to local grounded synthesis if Gemini API call encounters network/quota limits
                pass

        # Offline Local Grounded Synthesis
        if not relevant:
            if is_hindi:
                ans = "क्षमा करें, मुझे आपकी आवश्यकता के अनुसार कोई सरकारी योजना नहीं मिली। कृपया अपने काम का प्रकार या आय विवरण लिखकर पुनः खोजें।"
            else:
                ans = "I could not find matching schemes in the database for your query. Please try searching with your trade (e.g. 'Street Vendor', 'Construction Worker') or benefit type (e.g. 'Pension', 'Health Insurance')."
            return {
                "answer": ans,
                "retrieved_schemes": [],
                "model": "Local RAG Knowledge Engine"
            }

        top = relevant[0]
        if is_hindi:
            ans = f"### आपके लिए अनुशंसित योजना: **{top['scheme_name']}**\n\n"
            ans += f"**श्रेणी**: {top['category']}\n"
            ans += f"**मुख्य लाभ**: {top['benefits']}\n\n"
            ans += f"**पात्रता (Eligibility)**:\n"
            ans += f"- लक्षित श्रमिक: {top['target_occupation']}\n"
            ans += f"- आयु सीमा: {top['minimum_age']} से {top['maximum_age']} वर्ष\n"
            if top['income_limit']:
                ans += f"- अधिकतम मासिक आय: ₹{int(top['income_limit']):,}\n"
            ans += f"\n**आवेदन प्रक्रिया**: {top['application_process'] or 'आधिकारिक पोर्टल या सीएससी (CSC) केंद्र से आवेदन करें।'}\n"
            if len(relevant) > 1:
                ans += f"\n**अन्य संबंधित योजनाएं**: {', '.join([s['scheme_name'] for s in relevant[1:]])}."
        else:
            ans = f"### Recommended Scheme: **{top['scheme_name']}**\n\n"
            ans += f"**Category**: {top['category']}\n"
            ans += f"**Key Benefits**: {top['benefits']}\n\n"
            ans += f"**Who Can Apply**:\n"
            ans += f"- **Target Workers**: {top['target_occupation']}\n"
            ans += f"- **Age Range**: {top['minimum_age']} to {top['maximum_age']} years\n"
            if top['income_limit']:
                ans += f"- **Monthly Income Limit**: Up to ₹{int(top['income_limit']):,}\n"
            ans += f"\n**How to Apply**: {top['application_process'] or 'Submit application through our portal or nearest Common Service Center (CSC).'}\n"
            if len(relevant) > 1:
                ans += f"\n**You May Also Qualify For**: {', '.join([s['scheme_name'] for s in relevant[1:]])}."

        return {
            "answer": ans,
            "retrieved_schemes": relevant,
            "model": "Local RAG Knowledge Engine"
        }

rag_service = SchemeRAGService()
