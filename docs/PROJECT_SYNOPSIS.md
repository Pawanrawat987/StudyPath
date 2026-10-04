# StudyPath — Project Synopsis

## 1. Title

**StudyPath — Student Learning Gap Detection and Performance Tracking System**

## 2. Introduction

StudyPath is a web application for managing academic subjects, topics, questions and quizzes. Students attempt published quizzes. The server stores answers and calculates results, then summarizes completed attempts by topic and subject. A student can use weak-topic results to create a revision item, mark it complete, take another quiz and compare attempt performance. Students can also maintain exam schedules and see a topic-based preparation percentage. Teachers and administrators manage academic content and can review student performance.

## 3. Problem Statement

Quiz results are often presented only as a score for a complete test. This makes it difficult for a learner to see which topics need more attention or to keep a record of revision and follow-up attempts. StudyPath organizes assessment results by topic and subject and connects weak results with revision and retesting.

## 4. Need for the Project

The system provides one place to maintain course content, conduct quizzes, review answer-derived performance, record revision and schedule examinations. It supports a repeatable study cycle without claiming that automated machine learning or a mobile application is part of the current implementation.

## 5. Objectives

- Provide account registration and cookie-based authentication.
- Organize learning material into subjects, topics and multiple-choice questions.
- Let teachers and administrators create quizzes and control publication.
- Let students attempt published quizzes and view their results and history.
- Calculate overall, subject and topic performance from stored answers.
- Classify topic performance as Strong, Average or Weak.
- Let students track weak topics through revision and retesting.
- Let students record exam dates and view topic-based preparation information.
- Let teachers and administrators review content counts and student performance.

## 6. Scope

StudyPath is a browser-based application with a React/Vite frontend, Express REST API, Sequelize ORM and MySQL database. The current scope includes student, teacher and admin roles; content management; quiz attempts; performance summaries; revision tracking; exam schedules; email-token account verification/reset flows; and optional Google OAuth configuration.

The scope does not include AI/ML predictions, a mobile application, live classroom tools, payments, or institutional SIS integrations. Teacher and admin share the current management permissions; there is no teacher-to-class assignment feature.

## 7. Proposed System

The browser communicates with the Express API through Axios. Authentication uses a JWT in an HttpOnly cookie. Sequelize maps application models to MySQL. The API enforces roles and ownership, validates key inputs, calculates quiz scores on the server, and returns summaries used by the frontend.

## 8. Major Features

1. Student, teacher and admin authentication roles.
2. Registration, login, logout and current-user lookup.
3. Email verification and password reset using emailed tokens.
4. Google OAuth when credentials are configured.
5. Subject, topic and question management.
6. Quiz creation, question assignment, publication and student attempts.
7. Server-side answer checking, scoring, history and result retrieval.
8. Answer-derived topic and subject performance with 75%/50% thresholds.
9. Weak-topic revision, completion, retesting and comparison.
10. Exam schedule CRUD, completion and preparation summary.
11. Teacher/admin dashboard counts and student performance views.

## 9. Target Users

- **Student:** browses content, attempts quizzes, reviews personal performance, tracks revision and plans exams.
- **Teacher:** manages academic content/quizzes and views the student list and student performance.
- **Admin:** has the same implemented management permissions as a teacher, including dashboard and student monitoring.

Public registration creates a student account. Management roles must be assigned through trusted account administration outside the public registration request.

## 10. Technology Used

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express.js, CommonJS |
| Database | MySQL |
| ORM | Sequelize |
| Authentication | JSON Web Token in HttpOnly cookie |
| Password hashing | bcrypt |
| Email | Nodemailer with SMTP environment settings |
| Google sign-in | Passport Google OAuth 2.0, optional configuration |
| API | REST over HTTP/JSON |

## 11. Hardware and Software Requirements

**Development minimum:** a modern dual-core computer, 4 GB RAM, several hundred MB of free project/database space, and a current desktop operating system. A larger memory allocation is recommended when running MySQL and both development servers together.

**Software:** Node.js/npm, MySQL Server, a modern browser, and a code editor. SMTP settings are needed to deliver verification/reset email. Google OAuth client configuration is needed to exercise Google login. Exact Node/MySQL version support should be confirmed against the deployment environment.

## 12. Functional Requirements

1. A visitor can submit registration details; public registration assigns the student role.
2. A user can log in and receive an HttpOnly JWT cookie, then log out or request the current user.
3. A visitor can request email verification/reset flows using one-time links.
4. An authenticated user can list subjects, topics and student-safe question content.
5. A teacher/admin can create, update and delete subjects, topics and questions.
6. A teacher/admin can create and edit quizzes, assign/remove questions, and publish/unpublish quizzes.
7. A student can start a published quiz, submit selected options, see the server-calculated result and view their own history/results.
8. The system summarizes completed attempts by subject/topic and labels topic results with configured thresholds.
9. A student can add a currently weak topic to revision, complete/remove the item and inspect before/after attempt comparison.
10. A student can create, edit, complete, list and delete their exam schedules.
11. A teacher/admin can view dashboard counts, student records and answer-derived student performance.

## 13. Non-Functional Requirements

- **Security:** password hashing, signed JWT cookie, role/ownership checks, answer-key filtering, server-side scoring, environment-based credentials.
- **Performance:** indexed key identifiers and bounded ORM queries suitable for a small-to-medium academic project; student-list performance currently computes per-student summaries and may need pagination at larger scale.
- **Reliability:** database connection and schema helpers run before the API listens; API failures return a generic server response.
- **Usability:** responsive web pages, status messages, loading states and empty states for key student/admin screens.
- **Maintainability:** separate route/controller/model/middleware/frontend page layers.
- **Scalability:** the present single API and database design is suitable for a project-scale deployment; production scaling and load testing are future work.
- **Data integrity:** Sequelize associations, database foreign keys and unique constraints are used where present; legacy nullable columns and relationships are noted in the database document.

## 14. Database Overview

There are nine named Sequelize models: User, Subject, Topic, Question, Quiz, QuizAttempt, Answer, RevisionPlan and ExamSchedule. Sequelize also creates three join tables: QuizQuestions, RevisionPlanTopics and ExamScheduleSubjects. The active application primarily uses QuizQuestions; revision and exam features use their direct `topic_id` and `subject_id` columns. Database introspection found legacy-nullable foreign-key columns and no physical foreign key on `quizzes.topic_id`; see [Database Design](DATABASE_DESIGN.md).

## 15. Methodology / SDLC

The project follows an iterative development approach: identify a module requirement, implement its routes/models/UI, run API or build checks, then correct issues before proceeding. This is suitable for a modular BCA project because each layer can be reviewed separately while testing the complete student flow.

## 16. Expected Benefits

- Students can identify topics with low quiz performance.
- Revision and retesting provide a simple record of follow-up study.
- Teachers/admins can maintain shared academic content and review student results.
- Exam schedules combine dates with a topic-based preparation summary.

## 17. Limitations

- Performance is descriptive and based on saved quiz answers; it does not predict future achievement.
- A topic is classified from accumulated answer correctness; it is not a psychometric evaluation.
- Public registration creates students only; there is no management-role self-service workflow.
- Email/OAuth depend on external provider credentials and services.
- No visual browser-driven end-to-end test was available during the documentation pass.
- Some migrated legacy columns remain nullable in MySQL even when the current Sequelize model expects values.
- Larger deployments need pagination, rate limiting, operational monitoring and load testing.

## 18. Future Enhancements

Possible later work includes controlled teacher/admin provisioning, pagination and search, better audit trails, additional question types, richer accessibility review, scheduled reminders, formal database migrations, automated browser tests, and mobile-responsive usability research. AI/ML would require a separate data/ethics/validation study and is not implemented now.

## 19. Conclusion

StudyPath combines content management, quiz assessment and answer-based topic summaries with revision and exam scheduling. Its present implementation provides a practical learning-support workflow for a final-year BCA project while keeping performance analysis rule-based and explainable.

## 20. References

- React documentation: https://react.dev/
- Vite documentation: https://vite.dev/
- Express documentation: https://expressjs.com/
- Sequelize v6 documentation: https://sequelize.org/docs/v6/
- MySQL documentation: https://dev.mysql.com/doc/
- JSON Web Token introduction: https://jwt.io/introduction
- Node.js documentation: https://nodejs.org/docs/

Accessed for technology descriptions on 2 October 2026. Project behavior statements are based on the StudyPath source and database inspection, not solely on these references.
