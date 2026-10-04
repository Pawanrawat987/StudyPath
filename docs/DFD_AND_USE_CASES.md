# Data Flow Diagrams and Use Cases

## Context diagram

```mermaid
flowchart LR
  Student[Student] -->|credentials, answers, planner entries| SP((StudyPath))
  SP -->|content, scores, performance and status| Student
  Manager[Teacher / Admin] -->|content maintenance and report requests| SP
  SP -->|content results and student summaries| Manager
  SP <-->|user, content, attempt and planner records| DB[(MySQL)]
  SP -->|verification/reset messages| SMTP[SMTP service]
  SMTP -->|delivery result| SP
  SP <-->|optional authorization| OAuth[Google OAuth]
```

## Level 1 DFD

```mermaid
flowchart TB
  S[Student] --> P1[1 Authenticate]
  T[Teacher / Admin] --> P1
  P1 <--> D1[(Users)]
  S --> P2[2 Browse content]
  T --> P2
  P2 <--> D2[(Subjects Topics Questions)]
  T --> P3[3 Maintain content and quizzes]
  P3 <--> D2
  P3 <--> D3[(Quizzes and question links)]
  S --> P4[4 Take quiz and submit answers]
  P4 <--> D3
  P4 <--> D4[(Attempts and answers)]
  P4 --> P5[5 Analyze performance]
  P5 --> D4
  P5 <--> D5[(Revision plans)]
  S <--> P5
  S <--> P6[6 Plan exams]
  P6 <--> D6[(Exam schedules)]
  T --> P7[7 View management reports]
  P7 --> D1
  P7 --> D2
  P7 --> D3
  P7 --> D4
```

## Level 2 DFD: quiz attempt and analysis

```mermaid
flowchart LR
  S[Authenticated student] --> A[Start quiz]
  A -->|quiz, membership and availability| Q[(Quizzes Questions)]
  A -->|new in_progress record| AT[(QuizAttempts)]
  A -->|prompts and options, no key| S
  S -->|answers| B[Submit attempt]
  B --> C[Check ownership timer membership and duplicates]
  C --> D[Compare and calculate score]
  D <--> Q
  D -->|response and correctness| AN[(Answers)]
  D -->|completion and aggregate score| AT
  AT --> E[Performance aggregation]
  AN --> E
  E -->|topic and subject summaries| S
  E -->|weak topic may be scheduled| R[(RevisionPlans)]
```

## Actors and use cases

Actors are Student; Teacher/Admin (manager role); and optional SMTP/Google providers.

### UC-01 Register

- **Preconditions:** Visitor supplies unused email; database is available.
- **Main flow:** Submit name, email and password; server validates, hashes password and creates a student account, then attempts verification email delivery.
- **Alternates:** Invalid values return validation error; duplicate email conflicts; SMTP failure may leave the account created and return delivery failure.
- **Postconditions:** Student account exists; it becomes verified by following the emailed token link. Public signup cannot select teacher/admin.

### UC-02 Login/logout

- **Preconditions:** Account exists and credentials are valid.
- **Main flow:** Server checks bcrypt hash, sets signed JWT in HttpOnly cookie; `/me` returns public profile; logout clears cookie.
- **Alternates:** Invalid credentials return an error; missing/invalid/expired cookie yields 401 on protected routes.
- **Postconditions:** Auth cookie is set or cleared. Current login does not enforce `emailVerified`.

### UC-03 Maintain learning content

- **Preconditions:** Authenticated teacher/admin.
- **Main flow:** Create/update/delete subjects, topics and questions; validate references and persist.
- **Alternates:** Student gets 403; missing record returns not found; duplicate/invalid data returns an error.
- **Postconditions:** Accepted changes persist. Student topic-question view excludes answer key and explanation.

### UC-04 Take quiz

- **Preconditions:** Authenticated student; quiz published and available.
- **Main flow:** Start attempt; receive questions without correct answers; submit selections; server validates timer, membership and duplicate submissions, scores and stores result.
- **Alternates:** Unpublished quiz or invalid attempt rejected; non-owner cannot access attempt; late answers beyond limit plus transport grace are not scored.
- **Postconditions:** Attempt is completed with server-calculated result and answers.

### UC-05 Review performance and revise

- **Preconditions:** Authenticated student; no-attempt performance is an empty/zero state.
- **Main flow:** Review aggregates; create revision for topic below 50%; complete plan; retake quiz and view comparison.
- **Alternates:** Non-weak topic or duplicate plan rejected; another student's plan inaccessible; comparison explains missing prior/retest attempt.
- **Postconditions:** Owned plan and optional retest comparison are stored.

### UC-06 Schedule exam

- **Preconditions:** Authenticated student and existing subject.
- **Main flow:** Create future exam date; view preparation metrics; edit, complete or delete owned schedule.
- **Alternates:** Invalid/past date, missing subject, duplicate same-subject date or non-owned record is rejected.
- **Postconditions:** Schedule status and dashboard summary update.

### UC-07 View management summaries

- **Preconditions:** Authenticated teacher/admin.
- **Main flow:** View dashboard counts, student listing or one student's performance.
- **Alternates:** Student gets 403; missing student returns not found.
- **Postconditions:** Read-only information is returned without passwords or tokens.
