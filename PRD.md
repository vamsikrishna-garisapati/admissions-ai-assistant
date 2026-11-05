# Product Requirements Document (PRD)
# AI Admissions Assistant

**Product:** AI Admissions Assistant  
**Organization:** Admissions & Career Training  
**Version:** 1.0  
**Date:** 5 November 2026  
**Status:** Proposed – Ready for Technical Planning  
**Priority:** High  
**Platform:** Institute Website  
**Primary objective:** Increase qualified student enquiries and admissions through AI-powered conversations.

---

## 1. Executive Summary

The institute will introduce an AI-powered conversational assistant on its main website to help prospective students understand courses, career opportunities, admission requirements, training methodology, fees and placement support.

The assistant will be available 24/7 and will act as an initial digital admissions counsellor.

Unlike a conventional FAQ chatbot, the assistant will understand the visitor's educational background, career interests and learning requirements. It will provide relevant course guidance and progressively collect visitor information when the visitor expresses interest in counselling or requests a callback.

Captured leads will be stored in a dedicated database and made available to the admissions team for follow-up.

The solution will use Cloudflare Workers AI for AI inference, Cloudflare Vectorize for knowledge retrieval and Cloudflare D1 for conversation and lead storage.

The chatbot backend will be developed independently from the existing Next.js website. Only the chatbot user interface and API integration will be added to the existing website repository.

### Product vision

Build an AI admissions assistant that turns website visitors into informed prospective students and helps the admissions team convert qualified enquiries into admissions.

---

## 2. Problem Statement

Visitors coming to the website may have questions before deciding whether to join a course.

Common questions include:

- Which course is suitable for my educational background?
- What technologies will I learn?
- What are the course fees?
- How long does the training take?
- Do you provide placement assistance?
- What is the eligibility criteria?
- Can freshers join?
- How does the admissions process work?
- Where is the institute located?
- Can I speak with an admissions counsellor?

Currently, visitors may need to wait for the admissions team to become available or search through multiple website pages to find answers.

This creates potential business problems:

1. Interested visitors may leave without submitting an enquiry.
2. Visitors may not receive answers outside admissions working hours.
3. Admissions counsellors repeatedly answer similar questions.
4. The institute may not understand why visitors are interested or what prevents them from enrolling.
5. Marketing campaigns may generate traffic without providing enough information to convert that traffic into qualified leads.

### Proposed solution

Introduce a website-based AI assistant that provides immediate answers, understands visitor requirements and converts interested visitors into structured admissions enquiries.

---

## 3. Business Objectives

The product should contribute to the following business objectives.

| Objective | Expected business value |
|---|---|
| Increase enquiries | Convert more website visitors into prospects |
| Improve lead quality | Understand visitor background and course preferences |
| Reduce repetitive enquiries | Automate common admissions questions |
| Improve response availability | Provide support outside business hours |
| Improve admissions follow-up | Provide counsellors with conversation summaries |
| Improve marketing intelligence | Understand course interest and visitor objections |
| Improve conversion | Help prospective students receive relevant information before counselling |

### Primary success metric

**Number of additional qualified admissions leads generated through the chatbot.**

### Secondary success metrics

- Chatbot engagement rate.
- Conversation completion rate.
- Lead capture rate.
- Qualified lead rate.
- Callback requests.
- Callback completion rate.
- Admissions conversion rate.
- AI answer accuracy.
- Unanswered question rate.
- Average admissions response time.

Success should be measured against the existing website enquiry baseline. Incremental impact should be evaluated through a controlled comparison wherever practical.

---

## 4. Target Users

### 4.1 Primary users – Prospective students

People interested in learning software development, building technical skills or starting a career in IT.

Typical characteristics:

- Recent graduates.
- Final-year students.
- Freshers.
- Working professionals.
- Career switchers.
- People exploring software development courses.

### 4.2 Secondary users – Parents and guardians

Parents or guardians researching training programmes and career opportunities for students.

### 4.3 Internal users – Admissions counsellors

The admissions team will use the information collected by the chatbot to understand visitor requirements and follow up with interested prospects.

---

## 5. Product Scope

### 5.1 MVP – In scope

| Feature | Description | Priority |
|---|---|---|
| Website chatbot | Floating chatbot available throughout the website | P0 |
| Suggested questions | Predefined questions to encourage interaction | P0 |
| AI conversations | Natural-language question and answer experience | P0 |
| Knowledge retrieval | Answers based on approved institute information | P0 |
| Course guidance | Recommend relevant courses based on visitor background | P0 |
| Session management | Maintain conversation context | P0 |
| Conversation history | Store and retrieve chat messages | P0 |
| Progressive lead capture | Collect visitor information naturally | P0 |
| Callback request | Allow interested visitors to request an admissions callback | P0 |
| Lead storage | Store structured leads in D1 | P0 |
| Consent management | Record appropriate contact consent | P0 |
| Human handoff | Offer admissions follow-up when AI cannot resolve an enquiry | P0 |
| Basic analytics | Track engagement, leads and conversation outcomes | P1 |
| Feedback | Collect visitor feedback on AI responses | P1 |

### 5.2 Future scope – Not included in MVP

- WhatsApp chatbot.
- Voice-based conversations.
- Multilingual conversations.
- Automated outbound calling.
- Automated marketing messages.
- Full CRM integration.
- Advanced admissions dashboard.
- Payment and registration workflows.
- Automated student onboarding.
- AI career assessment and aptitude testing.

These capabilities may be introduced in future releases.

---

## 6. User Experience and Core Workflows

### 6.1 Chatbot entry point

A floating chatbot button will appear in the bottom-right corner of the website.

It should:

- Be visible without interrupting the main website experience.
- Work on desktop, tablet and mobile.
- Open a conversational interface when clicked.
- Display a welcome message.
- Provide suggested questions.
- Allow visitors to start conversations without registration.

### Welcome message

"Hello! 👋 Welcome to our Career Admissions Assistant.

Are you planning to start your career in IT, switch careers or improve your technical skills?

I can help you understand our courses, training methodology and admissions process."

### Suggested questions

1. I'm a fresher. Where should I start?
2. Which courses do you offer?
3. How does your placement support work?
4. What are the course fees?
5. Can I attend classes offline?
6. I want to speak with an admissions counsellor.

### 6.2 Information and guidance workflow

The assistant should understand the visitor's question and provide an appropriate answer using the approved knowledge base.

Example:

**Visitor:** I completed B.Tech in 2025. I want to become a Python developer.

**Assistant:** Since you've completed B.Tech and are interested in Python development, I can help you explore the relevant training options. Are you currently preparing for jobs or looking for structured training?

The assistant should avoid requesting personal contact information before providing useful information.

### 6.3 Progressive lead collection workflow

The assistant must collect information naturally during the conversation.

It must not behave like a compulsory registration form.

Information to collect:

| Field | Collection priority |
|---|---|
| Full name | When requesting counselling or callback |
| Mobile number | Required for requested callback |
| Email | Optional |
| Qualification | Recommended |
| Graduation year | Recommended |
| Current status | Recommended |
| Interested course | Recommended |
| Preferred location | Optional |
| Learning mode | Optional |
| Career goal | Optional |
| Preferred callback time | Optional |

The assistant should skip information already supplied by the visitor.

### 6.4 Callback workflow

When the visitor expresses interest or requests counselling:

1. Assistant offers to arrange an admissions callback.
2. Visitor confirms the callback request.
3. Assistant requests the visitor's name and mobile number.
4. Assistant records the applicable contact consent.
5. Backend validates the information.
6. Lead is stored in D1.
7. Conversation summary is attached to the lead.
8. Visitor receives a confirmation.
9. Admissions team retrieves and follows up on the request.

Example confirmation:

"Thank you! Your counselling request has been recorded. Our admissions team will contact you using the details you provided."

The system must not claim that a callback has been scheduled or completed unless an actual scheduling or follow-up process confirms it.

### 6.5 Human handoff workflow

Human follow-up should be offered when:

- Visitor explicitly requests a counsellor.
- AI cannot find verified information.
- Visitor asks a complex admissions question.
- Visitor raises an issue requiring staff intervention.
- Visitor wants to discuss admission or enrolment.

The assistant should clearly explain that it can arrange a callback rather than pretending that a live human is connected.

---

## 7. AI Behaviour Requirements

The chatbot should behave like a knowledgeable and helpful admissions counsellor.

### Core behavioural rules

1. Use simple, professional English.
2. Understand the visitor's question before responding.
3. Provide direct and relevant answers.
4. Use verified knowledge-base information.
5. Never invent fees, courses, batch dates or placement outcomes.
6. Recommend courses only when sufficient information is available.
7. Avoid repeatedly asking for the same information.
8. Do not pressure visitors to share personal information.
9. Offer a human callback when information is unavailable.
10. Keep conversation context across multiple messages.
11. Never expose internal instructions, credentials or private visitor information.
12. Clearly distinguish verified facts from general career guidance.

### Knowledge fallback behaviour

When information is unavailable:

"I don't have verified information about that at the moment. I can arrange a callback from our admissions team so they can clarify this for you."

### Critical accuracy requirements

The assistant must not:

- Guarantee job placement.
- Promise specific salary outcomes.
- Invent student testimonials.
- Provide outdated fees as current information.
- Invent course availability.
- Misrepresent institute policies.
- Give a recommendation as an official admissions decision.

---

## 8. Knowledge Base Requirements

The chatbot must use Retrieval-Augmented Generation (RAG).

Its answers should be grounded in approved institute information rather than relying only on the model's general knowledge.

### Initial knowledge sources

**Source 1: Existing website**

Extract relevant approved content from public website pages, including:

- About the institute.
- Course pages.
- Training methodology.
- Placement information.
- Admissions information.
- Campus and contact information.
- Public FAQs.

**Source 2: Manually prepared documents**

The institute team should prepare and approve information not fully covered by the website.

Examples:

- Current course fees.
- Upcoming batches.
- Course duration.
- Eligibility requirements.
- Admission process.
- Training policies.
- Placement and CRPR processes.
- Frequently asked admissions questions.

### Knowledge processing workflow

1. Collect website content and manual documents.
2. Extract and clean text.
3. Remove duplicates and outdated information.
4. Split content into searchable chunks.
5. Generate embeddings.
6. Store vectors in Cloudflare Vectorize.
7. Store original documents in R2.
8. Maintain document metadata in D1.
9. Retrieve relevant information for visitor queries.
10. Generate answers using the retrieved context.

### Knowledge governance

Every knowledge document must have:

- Document title.
- Category.
- Version.
- Source.
- Last updated date.
- Approval status.
- Indexing status.

Only approved documents should be searchable by the production chatbot.

When important information changes, the knowledge base must be reindexed.

---

## 9. Technical Architecture

### 9.1 High-level architecture

The solution will use two independent repositories.

**Repository 1: Existing website**

Technology: Next.js

Responsibilities:

- Floating chatbot button.
- Chat window.
- Message rendering.
- Suggested questions.
- User input.
- Chat session handling.
- Callback interaction.
- API integration.

**Repository 2: New AI assistant backend**

Repository name:

`admissions-ai-assistant`

Technology: TypeScript + Cloudflare Workers + Hono.

Responsibilities:

- API endpoints.
- Session management.
- AI orchestration.
- Conversation management.
- Knowledge retrieval.
- Lead extraction.
- Lead storage.
- Callback request management.
- Consent records.
- Monitoring and analytics.

### 9.2 Infrastructure components

| Component | Technology | Responsibility |
|---|---|---|
| Website | Next.js | Chatbot frontend |
| Backend | Cloudflare Workers | API and business logic |
| API framework | Hono | HTTP routing |
| AI inference | Workers AI | Conversation responses |
| Embeddings | Workers AI | Knowledge vector generation |
| Vector database | Vectorize | Semantic retrieval |
| SQL database | D1 | Sessions, messages and leads |
| Document storage | R2 | Knowledge documents |
| Validation | Zod | Request and structured data validation |
| Testing | Vitest | Unit and integration testing |

### 9.3 Suggested domains

- Website: `example.com` (Main Website)
- Backend API: `assistant-api.example.com`

The chatbot UI will initially remain inside the existing Next.js website repository.

---

## 10. API Requirements

Base URL:

`https://assistant-api.example.com/api/v1`

Required API endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/sessions` | Create a visitor session |
| GET | `/sessions/:id` | Retrieve session information |
| POST | `/chat` | Send a visitor message |
| GET | `/sessions/:id/messages` | Retrieve conversation history |
| POST | `/leads` | Create or update a lead |
| PATCH | `/leads/:id` | Update lead information |
| POST | `/feedback` | Submit answer feedback |
| POST | `/privacy/withdraw` | Record consent withdrawal request |
| GET | `/health` | Health check |

### API requirements

- Validate every request.
- Authenticate session-specific operations.
- Prevent visitors from accessing another visitor's session.
- Store visitor and AI messages.
- Return structured errors.
- Support streaming AI responses.
- Apply API rate limits.
- Validate lead information server-side.
- Record consent evidence.
- Support future CRM integration.

The frontend must never directly access Workers AI, Vectorize or the D1 database.

---

## 11. Database Requirements

Cloudflare D1 will act as the initial system of record.

### Core tables

| Table | Purpose |
|---|---|
| `chat_sessions` | Visitor sessions |
| `chat_messages` | Conversation messages |
| `leads` | Structured admissions enquiries |
| `lead_events` | Lead activity and status history |
| `consent_records` | Contact consent evidence |
| `knowledge_documents` | Document metadata and indexing status |

### Lead information

The lead record should support:

- Lead ID.
- Session ID.
- Full name.
- Phone number.
- Email.
- Education qualification.
- Graduation year.
- Current status.
- Interested course.
- Career goal.
- Preferred location.
- Learning mode.
- Callback request status.
- Preferred callback time.
- Lead score.
- Lead status.
- CRM external reference for future integration.
- Created and updated timestamps.

### Lead status

Initial statuses:

- New.
- Qualified.
- Contacted.
- Follow-up required.
- Converted.
- Not interested.
- Closed.

The MVP will store leads in D1. CRM integration will be implemented after the existing admissions workflow is evaluated.

---

## 12. Lead Qualification and Scoring

The application should calculate an initial lead score using backend business rules.

Example scoring signals:

| Signal | Points |
|---|---:|
| Asked about a specific course | 10 |
| Shared education details | 10 |
| Asked about fees | 10 |
| Asked about upcoming batches | 15 |
| Asked about placement support | 10 |
| Expressed joining interest | 20 |
| Requested counselling | 20 |
| Provided contact number | 5 |

The final score must be calculated by deterministic application logic, not accepted directly from the LLM.

Initial lead classifications:

| Score | Classification |
|---|---|
| 0–24 | Low intent |
| 25–49 | Exploring |
| 50–74 | Interested |
| 75–100 | High intent |

These weights should be calibrated against real admissions outcomes.

Lead scores are prioritization indicators, not guaranteed predictions of enrolment.

---

## 13. User Interface Requirements

The chatbot must provide a clean, modern and accessible interface.

### Desktop

- Floating launcher at bottom-right.
- Expandable chat window.
- Message bubbles.
- Text input.
- Suggested questions.
- Typing indicator.
- Response streaming.
- Callback interaction.

### Mobile

- Responsive full-screen or near-full-screen interface.
- Comfortable touch controls.
- Proper keyboard handling.
- Readable messages.
- Accessible close and navigation controls.

### Required UX features

- Welcome message.
- Suggested questions.
- Conversation history.
- Loading state.
- Error state.
- Retry option.
- Copy response.
- Restart conversation.
- Callback request.
- Privacy policy link.
- Human follow-up option.
- Feedback on AI responses.

The chatbot must not block or significantly affect the main website's page loading and user experience.

---

## 14. Security and Privacy Requirements

The solution will process personal information such as visitor names, mobile numbers and education details.

The following requirements must be implemented:

1. Explain what information is collected and why.
2. Collect only necessary personal information.
3. Obtain appropriate consent before admissions contact.
4. Keep optional marketing consent separate.
5. Do not require contact information to answer ordinary questions.
6. Protect personal information at rest and in transit.
7. Restrict access to captured leads.
8. Avoid exposing sensitive information in logs.
9. Implement session authorization.
10. Implement API rate limits and abuse protection.
11. Establish data retention and deletion policies.
12. Provide a process for privacy requests and consent withdrawal.
13. Ensure the chatbot does not disclose another visitor's conversation or lead information.

The implementation must be reviewed against applicable Indian privacy and data protection requirements before production release.

Cloudflare credentials and private backend secrets must never be exposed in frontend code.

---

## 15. Analytics and Reporting

The system should record measurable events for business analysis.

### Engagement analytics

- Chatbot opened.
- Conversation started.
- Message sent.
- Suggested question clicked.
- Conversation completed.
- Conversation abandoned.

### Lead analytics

- Lead information collected.
- Course interest identified.
- Callback requested.
- Lead qualified.
- Lead status updated.
- Lead converted.
- Lead source identified.

### AI analytics

- Questions by topic.
- Frequently requested courses.
- Unanswered questions.
- Knowledge retrieval failures.
- AI response feedback.
- Average response latency.
- Model usage and inference cost.

### Business reports

The system should eventually support:

- Course-wise enquiry reports.
- Lead source reports.
- Qualified lead reports.
- Callback request reports.
- Admission conversion reports.
- Common student objections.
- Unanswered question reports.

The MVP must capture the underlying events even if a full analytics dashboard is deferred.

---

## 16. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Availability | Serverless backend with production monitoring |
| Scalability | Support growth in concurrent conversations |
| Performance | Stream responses where supported |
| Reliability | Graceful failure when AI services are unavailable |
| Data consistency | Persist messages and leads reliably |
| Security | Authenticated sessions and protected data |
| Maintainability | Modular backend services |
| Extensibility | CRM and WhatsApp integration readiness |
| Accessibility | Keyboard-accessible and readable interface |
| Compatibility | Current desktop and mobile browsers |
| Observability | Logs, error tracking and usage analytics |

Specific latency, availability and concurrency targets should be finalized after baseline testing and Cloudflare account-limit review.

---

## 17. Development and Release Plan

### Phase 1 – Backend Foundation

- Create `admissions-ai-assistant` repository.
- Initialize TypeScript Cloudflare Worker.
- Configure Hono and Zod.
- Create Cloudflare D1.
- Create Vectorize index.
- Create R2 bucket.
- Implement database migrations.
- Implement session creation and authorization.
- Implement message persistence.
- Create initial API endpoints.

**Deliverable:** Working backend foundation.

### Phase 2 – AI Conversation Engine

- Configure Workers AI.
- Evaluate available chat models.
- Create system prompts.
- Implement conversation context.
- Implement chat completion.
- Implement structured intent extraction.
- Add AI fallback behaviour.
- Add response feedback.

**Deliverable:** Working AI conversation service.

### Phase 3 – Knowledge Engine

- Collect website content.
- Prepare manual institute documents.
- Build website content ingestion.
- Implement text cleaning and chunking.
- Generate embeddings.
- Store vectors in Vectorize.
- Implement retrieval.
- Add source tracking.
- Implement relevance checks and fallback.

**Deliverable:** AI assistant answering verified institute questions.

### Phase 4 – Lead Generation

- Implement visitor profile extraction.
- Implement progressive lead collection.
- Implement lead creation and updating.
- Implement lead scoring.
- Implement callback requests.
- Implement consent recording.
- Implement lead events and summaries.
- Implement D1 lead retrieval for authorized staff.

**Deliverable:** End-to-end lead capture workflow.

### Phase 5 – Website Integration

- Add chatbot components to Next.js repository.
- Integrate API.
- Implement session persistence.
- Implement streaming.
- Implement responsive design.
- Add suggested questions.
- Add callback UI.
- Test desktop and mobile.

**Deliverable:** Website chatbot experience.

### Phase 6 – Testing and Production

- AI answer accuracy testing.
- Knowledge-base testing.
- Lead extraction testing.
- Session isolation testing.
- Consent and privacy testing.
- Rate-limit testing.
- Performance testing.
- Staging deployment.
- Admissions team UAT.
- Production deployment.

**Deliverable:** Production-ready AI admissions assistant.

Indicative implementation estimate: approximately three weeks for an initial implementation by one developer, subject to knowledge preparation, testing and integration complexity.

---

## 18. Testing and Acceptance Criteria

The MVP will be considered ready for release when:

### Functional acceptance

- Visitors can initiate a conversation.
- Visitors receive relevant answers from approved knowledge.
- The assistant handles multiple conversation turns.
- It understands basic student backgrounds.
- It recommends appropriate verified course options.
- It does not repeatedly ask for existing information.
- It collects lead details progressively.
- Visitors can request a callback.
- Callback leads are saved successfully in D1.
- Appropriate consent is recorded.
- Admissions staff can retrieve captured leads.
- Unknown questions trigger a safe fallback.
- Session data is not accessible by other visitors.

### AI quality acceptance

- Build an evaluation dataset with at least 100 admissions questions.
- Achieve a proposed 90% or higher accuracy on approved FAQ answers.
- Avoid critical hallucinations about fees, course availability and placement guarantees.
- Evaluate course recommendation relevance.
- Verify that the assistant correctly identifies questions outside the knowledge base.

### Business acceptance

- Chat engagement and lead conversion can be measured.
- Lead source and course interest are captured.
- Callback requests are accessible to admissions.
- Conversation summaries help admissions staff understand prospects.
- Baseline website enquiries can be compared with chatbot-generated enquiries.

The quality targets are proposed launch thresholds and must be validated through testing.

---

## 19. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Incorrect AI answers | Approved knowledge base and retrieval validation |
| Outdated course information | Versioned documents and reindexing |
| Low lead conversion | Improve conversation design and progressive capture |
| Spam enquiries | Rate limits and bot protection |
| Duplicate leads | Normalized contact matching and deduplication |
| AI service downtime | Graceful fallback and callback enquiry capture where available |
| High inference cost | Model evaluation, token limits and usage monitoring |
| CRM uncertainty | Adapter-based architecture |
| Personal data exposure | Encryption, access restrictions and retention controls |
| Visitors abandoning conversations | Helpful answers before requesting contact details |

---

## 20. Dependencies

The project requires:

- Access to the existing Next.js website repository.
- Access to Cloudflare account.
- Domain and DNS access for API configuration.
- Current and accurate course information.
- Verified admissions and placement information.
- Approved privacy policy and consent language.
- Admissions team agreement on callback handling.
- A designated person to review and approve knowledge documents.
- Agreement on how admissions staff will retrieve and manage leads.

CRM selection is not a blocker for the initial MVP.

---

## 21. Ownership and Responsibilities

| Team / Role | Responsibility |
|---|---|
| Product / Management | Scope, priorities and business KPIs |
| Backend Developer | Worker, AI, RAG, D1 and lead workflows |
| Frontend Developer | Next.js chatbot UI and API integration |
| Admissions Team | Knowledge validation and callback follow-up |
| Marketing Team | Campaign tracking and conversion analysis |
| Management | CRM integration and operational approval |
| QA | Functional, security and AI evaluation |

---

## 22. Future Roadmap

After MVP validation:

**Phase 2 – Admissions Automation**
- CRM integration.
- Automated lead assignment.
- Callback tracking.
- WhatsApp integration with appropriate opt-in.
- Follow-up reminders.
- Lead management dashboard.

**Phase 3 – Student Intelligence**
- AI career assessment.
- Personalized course recommendations.
- Advanced lead scoring.
- Course demand analysis.
- Admissions funnel analytics.

**Phase 4 – AI-powered Institute Platform**
- Voice-based admissions assistant.
- Multilingual support.
- Automated student onboarding.
- Personalized learning-path recommendations.
- Integration with student and mentor platforms where appropriate.

---

## 23. Final Product Decisions

| Decision | Final selection |
|---|---|
| Product | AI Admissions Assistant |
| Existing website | Next.js |
| Backend repository | Separate repository |
| Repository name | `admissions-ai-assistant` |
| Backend runtime | Cloudflare Workers |
| Backend language | TypeScript |
| API framework | Hono |
| AI inference | Workers AI |
| Knowledge retrieval | Vectorize |
| Database | D1 |
| Document storage | R2 |
| Knowledge sources | Website + manually approved content |
| Lead collection | Progressive |
| Initial language | English |
| Admissions handoff | Callback request |
| Initial lead storage | D1 |
| CRM | To be evaluated later |
| Frontend location | Existing Next.js website repository |

---

## 24. Product Success Definition

The project is successful when the assistant consistently provides accurate admissions information, helps visitors understand suitable learning options, captures genuine callback requests and gives the admissions team actionable information to follow up.

The main measure of success is not the number of conversations or messages generated by AI.

It is the measurable improvement in qualified admissions enquiries and incremental student admissions generated through the website.

**Final product principle: Help first, understand the visitor, capture information naturally and convert through a better admissions experience.**