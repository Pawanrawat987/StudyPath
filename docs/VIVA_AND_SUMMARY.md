# Abstract, Project Summaries, and Viva Questions

## Abstract

StudyPath is a web-based learning platform intended to help students organize subject content, practice through quizzes, understand topic-level performance, schedule revision, and track upcoming examinations. Its React frontend communicates with a Node.js and Express API. Sequelize provides the persistence layer over MySQL. User authentication uses bcrypt-hashed passwords and a JWT stored in an HttpOnly cookie, with role-based access for students, teachers, and administrators. Managers maintain learning content and quizzes, while students take published quizzes and review their own results. Server-side scoring feeds performance summaries; weak topics can be placed in a revision plan, and exam schedules show preparation indicators. The project also contains optional email-link verification/password reset and Google OAuth integration. Verification documented for this release includes an 81-check live API regression run, schema and cookie checks, Vite proxy/SPA checks, and a successful production frontend build. Live SMTP delivery, Google provider exchange, and browser automation were not run. The system is a practical academic project and retains schema and deployment limitations described in the accompanying documentation.

## Five-line explanation

1. StudyPath helps students practice academic topics and organize exam preparation.
2. Students take published quizzes and receive server-calculated results.
3. Performance summaries identify strong, average, and weak topics.
4. Students can create revision plans and manage exam schedules.
5. Teachers and administrators manage content and view student summaries.

## 30-second introduction

“My project is StudyPath, a web-based study and exam preparation platform. The frontend is built with React and Vite, while the backend uses Node.js, Express, Sequelize, and MySQL. Students can take quizzes, review their performance by topic, create revision plans, and manage exam dates. Teachers and administrators manage learning content and view student performance summaries. I also implemented cookie-based JWT authentication and role-based access. The API regression checks and production frontend build passed; external email and Google provider flows still need live configuration and testing.”

## One-minute introduction

“StudyPath is designed to connect practice, performance review, revision, and exam planning in one application. Students browse subjects and topics, take published quizzes, and receive scores calculated by the backend. Performance endpoints summarize results by subject and topic, which supports weak-topic revision plans and retest comparisons. The exam planner stores each student's schedule and shows preparation metrics. Teachers and administrators maintain subjects, topics, questions, and quizzes and can view management summaries. Technically, the project uses a React/Vite frontend, an Express API, Sequelize models, and MySQL. Authentication uses bcrypt and a JWT in an HttpOnly cookie, with role and ownership checks. The documented local verification included 81 API regression checks, database schema checks, cookie behavior, frontend proxy routes, and a production build. SMTP delivery, Google OAuth with real provider credentials, and automated browser testing remain unverified.”

## Resume project entry

**StudyPath — Full-Stack Study and Exam Preparation Platform** | React, Node.js, Express, Sequelize, MySQL

- Built a role-aware learning platform with content management, published quizzes, server-side scoring, and student attempt history.
- Added topic-level performance summaries, weak-topic revision plans with retest comparison, and exam schedule tracking.
- Implemented bcrypt password hashing, HttpOnly JWT cookie sessions, ownership checks, and manager/student access controls.
- Recorded an 81-check API regression pass and successful frontend production build; external email/OAuth flows require further live verification.

## README project description

StudyPath is a full-stack study planner with React/Vite, Express, Sequelize, and MySQL. Students can practice with quizzes, review topic performance, plan revision, and track exams. Teachers and administrators manage learning content and view student summaries. See `docs/` for the synopsis, requirements, diagrams, database snapshot, API reference, test record, and security notes. Use the example environment files for configuration and never commit actual credentials. Email and Google sign-in require provider configuration.

## Viva questions and short answers

1. **What is StudyPath?** A web app for quiz practice, performance review, revision planning, and exam scheduling.
2. **Who are its users?** Students, teachers, and administrators.
3. **What does the frontend use?** React and Vite.
4. **What does the backend use?** Node.js and Express.
5. **Which database is used?** MySQL.
6. **What is Sequelize?** An ORM that maps JavaScript models and queries to relational database operations.
7. **What is an API?** A defined interface through which software components exchange requests and responses.
8. **What format do API responses use?** JSON.
9. **What does REST mean here?** HTTP resources are exposed through methods such as GET, POST, PUT, PATCH and DELETE.
10. **What is a primary key?** A column or column set that uniquely identifies a row.
11. **What is a foreign key?** A constraint linking a row to a referenced table row.
12. **What is a many-to-many relationship?** A relationship implemented through a join table, such as quizzes and questions.
13. **Name core entities.** User, Subject, Topic, Question, Quiz, QuizAttempt, Answer, RevisionPlan and ExamSchedule.
14. **Why use bcrypt?** It hashes passwords with a deliberately costly password-hashing function and salt.
15. **Are passwords stored in plaintext?** No, the application stores bcrypt hashes.
16. **What is a JWT?** A signed token carrying claims that a server can validate.
17. **Where is the login JWT stored?** In an HttpOnly cookie.
18. **What does HttpOnly do?** It prevents browser JavaScript from reading that cookie directly.
19. **What does SameSite=Lax help with?** It limits when browsers attach the cookie on cross-site requests.
20. **What is authentication?** Establishing who the requester is.
21. **What is authorization?** Deciding what an authenticated requester may do.
22. **How are user roles enforced?** Middleware restricts routes by role, with ownership checks for personal records.
23. **Can public signup create an admin?** No, public registration assigns the student role.
24. **What happens when a student asks for an admin route?** The API returns 403 Forbidden.
25. **What does 401 mean?** Authentication is missing or invalid.
26. **What does 403 mean?** The identity is known but access is forbidden.
27. **What does 404 mean?** The requested resource was not found.
28. **What does 500 mean?** An unexpected server-side failure occurred.
29. **What is CORS?** A browser policy governing cross-origin requests.
30. **How does Vite reach the backend in development?** Its `/api` proxy forwards requests to the backend target.
31. **Why does Axios send credentials?** So the browser includes the authentication cookie.
32. **How are quiz scores protected from tampering?** The server calculates scores from submitted answers and stored keys.
33. **Are answer keys sent to students?** The student-facing question response omits them.
34. **What is a quiz attempt?** A student's persisted session/result for a quiz.
35. **What is an in-progress attempt?** An attempt started but not yet submitted/completed.
36. **How is a weak topic determined?** Its measured performance is below 50 percent.
37. **What are the performance bands?** Strong at 75% or higher, Average at 50% or higher, otherwise Weak.
38. **Why distinguish attempts from answers?** Attempt stores aggregate/session state; Answer stores each question response.
39. **What is a revision plan?** A student's record to revisit a weak topic and compare a later retest.
40. **What does an exam schedule store?** An owned subject exam date and related schedule/status information.
41. **How is exam preparation estimated?** Topic performance and completed revision data contribute to preparation metrics.
42. **What is an ORM?** A tool for mapping object-oriented application code to relational tables.
43. **What are Sequelize associations?** Model declarations describing relations such as hasMany and belongsToMany.
44. **What is a join table?** A table that stores links between rows in two tables.
45. **Why can a model differ from the physical database?** Existing schema history or incomplete migrations can leave nullability/constraints out of sync.
46. **What is a database migration?** A versioned, repeatable schema change applied in a controlled sequence.
47. **Are startup schema helpers a complete migration framework?** No, they are additive compatibility helpers.
48. **What is email verification in this app?** An emailed token link; it is not a numeric OTP.
49. **Does login currently require verified email?** No, current login does not enforce that flag.
50. **What does Google OAuth do?** It optionally delegates identity authorization to Google when configured.
51. **What is an alternate flow?** A documented path when validation, authorization, or an external dependency changes the main use case.
52. **What is a DFD?** A diagram showing processes, external actors, data stores, and data movement.
53. **What is an ER diagram?** A diagram of entities and their relationships.
54. **What does the health endpoint check?** It confirms the API process responds; it does not by itself prove every dependency works.
55. **What tests were recorded?** An 81-check live API regression set plus schema, cookie, proxy, and build checks.
56. **Was live SMTP delivery verified?** No, provider delivery was not run.
57. **Was Google OAuth fully tested with Google?** No, the real provider exchange was not run.
58. **Was browser automation run?** No, the recorded verification had no browser automation.
59. **What is a production build?** A compiled/optimized frontend artifact intended for serving, not the development server.
60. **Name one limitation.** Some physical FK columns are nullable or missing compared with model intent, so schema reconciliation is needed.
61. **Why use environment variables?** They separate deployment configuration and secrets from source code.
62. **Should `.env` be committed?** No; only example keys with placeholder values belong in source control.
63. **Why use an HttpOnly cookie over localStorage for this JWT?** JavaScript cannot directly read an HttpOnly cookie, reducing token exposure to script access.
64. **What security concern still needs review?** Rate limiting and production security testing were not evidenced by this verification.
65. **What is the purpose of the admin dashboard?** Summarize users, content, quizzes, and student performance for managers.
66. **What does the answer record hold?** A student's response and whether it was correct for an attempt/question.
67. **Why is ownership checked?** It prevents one student from reading or changing another student's private records.
68. **What does idempotent migration behavior mean?** Re-running a schema operation does not repeatedly damage or duplicate its intended change.
69. **What is the value of test documentation?** It distinguishes demonstrated behavior from assumptions and untested integrations.
70. **What would you improve next?** Add formal migrations and automated browser/provider integration tests, then reconcile DB constraints.
