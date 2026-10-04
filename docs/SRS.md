# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose

This document defines the implemented requirements and boundaries of StudyPath for students, teachers and administrators.

### 1.2 Scope

StudyPath is a web system for academic content, quizzes, answer-based performance summaries, weak-topic revision and exam scheduling. It is not an AI prediction system or mobile app.

### 1.3 Definitions

- **Topic performance:** percent of stored answer records marked correct for a topic across completed attempts, with repeated attempts counted independently.
- **Strong:** at least 75%; **Average:** at least 50% and below 75%; **Weak:** below 50%.
- **Quiz publication:** whether students can list/start a quiz.
- **Retest comparison:** comparison of the latest relevant completed attempt before revision completion with an attempt started after the revision completion baseline.
- **Management role:** teacher or admin.

### 1.4 Intended Users

Students use learning and planning screens; teachers/admins manage shared content and inspect student performance; developers/operators configure MySQL, JWT, email and optional Google OAuth settings.

### 1.5 Product Overview

The React SPA uses a REST API. Express authenticates JWT cookies, authorizes the role, calls Sequelize models and returns JSON. MySQL stores users, content, quizzes, answers, revision and schedules.

## 2. Overall Description

### 2.1 Product Perspective

The product is a client/server web application. Vite proxies `/api` to Express in development (default backend port 5000); Axios uses `/api` by default and sends credentials. Express connects to MySQL through Sequelize.

### 2.2 Product Functions

Account flows; academic content CRUD; quiz publication/attempt/evaluation/history; performance classification; revision/retest comparison; exam planning; teacher/admin counts and student review.

### 2.3 User Classes

| Role | Implemented access |
|---|---|
| Student | Read academic content and published quizzes; start/submit own attempts; view own results/performance; manage own revision and exam items. |
| Teacher | Shared content/quiz management; dashboard and student performance. Student-only performance/revision/exam routes are restricted. |
| Admin | Same implemented management access as teacher; student-only routes are restricted. |

The public registration endpoint always creates a student; the request cannot choose teacher/admin.

### 2.4 Operating Environment

Modern browser; React/Vite frontend; Node.js/Express API; MySQL Server; SMTP service for email; Google OAuth provider when configured.

### 2.5 Design Constraints

- Backend uses CommonJS and Sequelize v6-style models.
- Authentication is stateless JWT stored in an HttpOnly cookie.
- Management role provisioning is outside public registration.
- Quiz score is determined by server-side `Question.correctAnswer` comparison.
- Performance is rule-based, using persisted Answer rows.
- Some legacy database FK columns are nullable and `Quiz.topic_id` is not physically constrained by an FK in the inspected database.

### 2.6 Assumptions and Dependencies

MySQL credentials and JWT secret are provided through backend environment variables. Email delivery requires complete SMTP variables. Google login requires client ID, client secret and callback URL. Browser/API communication requires the configured client origin and credential-enabled CORS.

## 3. Functional Requirements

### 3.1 Authentication

- **FR-AUTH-01 Registration:** accept name, valid email and password meeting the controller’s minimum rules (at least 8 characters, a letter and a digit); hash with bcrypt; assign role `student`; generate a hashed email verification token and send an email link. If SMTP fails, the account may already exist and the endpoint reports delivery failure.
- **FR-AUTH-02 Login:** verify email/password and set a signed JWT in an HttpOnly cookie. The current login controller does not block accounts whose email is unverified.
- **FR-AUTH-03 Logout:** clear the token cookie.
- **FR-AUTH-04 Current user:** `/api/auth/me` verifies the cookie and returns a public-user projection without password or private auth tokens.
- **FR-AUTH-05 Email verification:** accept a time-limited token from the emailed URL; resend accepts an email and returns a generic response for unknown/already-verified accounts.
- **FR-AUTH-06 Password reset:** request a reset email; store only a hash of the reset token; accept a valid unexpired token and a policy-compliant password.
- **FR-AUTH-07 Google OAuth:** initiate the Passport Google flow with `state`; callback uses the configured callback URL and sets the same authentication cookie. This integration is conditional on configuration.

### 3.2 Academic Content

- **FR-CONT-01:** authenticated users can list/read subjects and topics and list topic questions.
- **FR-CONT-02:** teacher/admin can create, update and delete subjects, topics and questions.
- **FR-CONT-03:** question input includes prompt, four options, correct option, difficulty and optional explanation; student list responses omit correct answer and explanation.

### 3.3 Quiz

- **FR-QUIZ-01:** teacher/admin can create/update/delete quizzes; creation starts unpublished.
- **FR-QUIZ-02:** teacher/admin can publish/unpublish and add/remove question links.
- **FR-QUIZ-03:** students see only published quizzes. If a quiz has no explicit question links, the existing quiz engine snapshots questions from its primary topic when loading/starting it.
- **FR-QUIZ-04:** only students can start/submit attempts. The server creates an attempt and returns safe question data.
- **FR-QUIZ-05:** submission contains question IDs and selected option letters. Server validates membership/duplicates, checks answers, saves Answer rows and computes result; client-supplied score fields are ignored.
- **FR-QUIZ-06:** timed attempts are measured from stored `startedAt`; answers arriving more than the time limit plus a 3-second transport grace are not scored.
- **FR-QUIZ-07:** students can list their history and read only their own attempt; teachers/admins can read an attempt as management users. Student response bodies do not include answer keys.
- **FR-QUIZ-08:** a quiz with attempts cannot be deleted; question assignment cannot change after attempts start.

### 3.4 Performance

- **FR-PERF-01:** calculate over completed attempts and stored answers, deduplicating a question within one attempt while counting it again in a later attempt.
- **FR-PERF-02:** return overall, subject and topic metrics plus Strong/Average/Weak groups.
- **FR-PERF-03:** route access is student-only and is scoped to the authenticated student.

### 3.5 Revision

- **FR-REV-01:** only a topic currently below 50% is accepted for revision.
- **FR-REV-02:** one revision item per user/topic is enforced by controller and a unique database index when present.
- **FR-REV-03:** student can list, mark complete and delete only their revision items.
- **FR-REV-04:** improvement endpoint reports pending, awaiting retest, no previous attempt or comparison status as applicable. Completion stores the latest attempt ID as the baseline to avoid timestamp-rounding ambiguity.

### 3.6 Exam Planner

- **FR-EXAM-01:** student creates a schedule with subject, valid `YYYY-MM-DD` date and optional notes; same student/subject/date duplicate is rejected.
- **FR-EXAM-02:** student can update date/subject/notes, complete or delete their own schedule.
- **FR-EXAM-03:** list/upcoming/completed/dashboard endpoints return the student’s records with date status and preparation summary.
- **FR-EXAM-04:** preparation percentage is the proportion of subject topics counted as prepared by an Average/Strong quiz result or completed revision; empty subjects yield zero.

### 3.7 Teacher/Admin

- **FR-MGMT-01:** teacher/admin can read dashboard counts for students, subjects, topics, questions and quizzes, including published quizzes.
- **FR-MGMT-02:** teacher/admin can list students with account status, attempt count and average completed-attempt performance where available.
- **FR-MGMT-03:** teacher/admin can inspect a student’s overall percentage and strong/average/weak topic lists.
- **FR-MGMT-04:** management APIs return 403 to students.

## 4. Non-Functional Requirements

- **Security:** use bcrypt, JWT verification, HttpOnly cookie, role/ownership enforcement, secret environment variables, safe public user serialization and safe student question serialization.
- **Performance:** support project-scale use; the current student list calculates performance per student and is not paginated.
- **Reliability:** startup checks DB connection and executes additive schema helpers before listening.
- **Usability:** provide role-appropriate navigation, loading/empty/error states and responsive layout.
- **Maintainability:** separate routes/controllers/models/services/middleware and React pages/context/services.
- **Scalability:** current architecture is a single Express service and MySQL database; horizontal scaling/load testing are not verified.
- **Data integrity:** unique email and Google ID indexes, quiz/revision join keys and revision/exam constraints exist; see physical schema notes.

## 5. External Interface Requirements

- **User interface:** React SPA routes listed in `App.jsx`; authenticated requests use Axios with credentials.
- **API interface:** JSON REST endpoints under `/api`; cookie credentials are used for authenticated endpoints.
- **Database interface:** Sequelize/MySQL, configured with `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- **External services:** SMTP for account emails; Google OAuth 2.0 when configured.

## 6. Security Requirements

Only a valid JWT cookie establishes an authenticated user. Management endpoints require teacher/admin. Student data endpoints require student and query by the authenticated user ID. Quiz score fields from the browser are not trusted. Student-facing question/result responses do not return answer keys. See [Security](SECURITY.md) for the implementation and limitations.

## 7. Database Requirements

MySQL must support Sequelize-created tables and JSON question options. The current database includes nine model tables and three implicit join tables. A schema snapshot and relationship notes are provided in [Database Design](DATABASE_DESIGN.md).

## 8. Constraints

- Email and Google provider availability are external dependencies.
- Public registration is student-only; management-role provisioning is not part of this product flow.
- Topics/questions are accessed through the existing subject hierarchy; no separate aggregate topic/question directory is implemented.
- Quiz attempt status supports `in_progress` and `completed` only.
- Current performance classification uses fixed thresholds; it is not configurable by end users.

## 9. Future Enhancements

Add automated browser tests, a controlled account provisioning process, paginated student monitoring, transactional/versioned migrations, expanded audit logging, accessibility review, and production load/security testing. These are future recommendations, not current functions.
