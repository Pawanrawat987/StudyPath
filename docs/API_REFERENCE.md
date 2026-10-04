# API Reference

All paths are relative to `/api`. JSON endpoints use `Content-Type: application/json`. The frontend sends cookie credentials. Authentication uses an HttpOnly `token` JWT cookie; most protected routes return 401 without a valid session. Role failures return 403. Exact validation messages can vary; status behavior below reflects the controllers and verified regression checks.

## Health and authentication

| Method and path | Access | Request | Success / common errors |
|---|---|---|---|
| `GET /health` | Public | — | 200 `{success:true,message:"StudyPath API is running"}` |
| `POST /auth/register` | Public | `{name,email,password}` | 201 created student; 400 invalid; 409 duplicate; mail delivery can fail after account creation |
| `POST /auth/login` | Public | `{email,password}` | 200 user + HttpOnly cookie; invalid credentials rejected |
| `POST /auth/logout` | Public/session | — | 200 and cookie cleared |
| `GET /auth/me` | Authenticated | Cookie | 200 public user; 401 absent/invalid/expired |
| `GET /auth/verify-email?token=…` | Public | Email token query | Verification result; invalid/expired token rejected |
| `POST /auth/resend-verification` | Public | `{email}` | Generic delivery/status response; SMTP required |
| `POST /auth/forgot-password` | Public | `{email}` | Generic delivery response; SMTP required |
| `POST /auth/reset-password` | Public | `{token,password}` | Reset result; invalid/expired token rejected |
| `GET /auth/google` | Public, optional | OAuth redirect | Redirects to Google when configured |
| `GET /auth/google/callback` | OAuth callback | Provider query/state | Auth callback/cookie; requires configured provider |

Verification and password reset use emailed one-time tokens, not numeric OTP codes. Public registration creates student accounts only.

## Subjects, topics and questions

Manager means teacher or admin.

| Method and path | Access | Request | Behavior |
|---|---|---|---|
| `GET /subjects` | Authenticated | — | List subjects |
| `GET /subjects/:id` | Authenticated | — | One subject |
| `POST /subjects` | Manager | `{name,description?}` | Create subject |
| `PUT /subjects/:id` | Manager | `{name?,description?}` | Update subject |
| `DELETE /subjects/:id` | Manager | — | Delete subject if allowed by references |
| `GET /subjects/:subjectId/topics` | Authenticated | — | Topics in subject |
| `POST /subjects/:subjectId/topics` | Manager | `{name,description?}` | Create topic |
| `GET /topics/:id` | Authenticated | — | One topic |
| `PUT /topics/:id` | Manager | `{name?,description?,subjectId?}` | Update topic |
| `DELETE /topics/:id` | Manager | — | Delete topic if allowed |
| `GET /topics/:topicId/questions` | Authenticated | — | Student response redacts key/explanation |
| `POST /topics/:topicId/questions` | Manager | `{questionText,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation?}` | Create question; difficulty easy/medium/hard |
| `GET /questions/:id` | Manager | — | Detailed question |
| `PUT /questions/:id` | Manager | Question fields | Update |
| `DELETE /questions/:id` | Manager | — | Delete if not restricted by references |

## Quizzes and attempts

| Method and path | Access | Request | Behavior |
|---|---|---|---|
| `GET /quizzes` | Authenticated | — | Managers see all; students see published quizzes |
| `GET /quizzes/topic/:topicId` | Authenticated | — | Published quizzes by topic |
| `GET /quizzes/subject/:subjectId` | Authenticated | — | Published quizzes by subject |
| `POST /quizzes` | Manager | `{title,topicId,description?,timeLimit?}` | Create unpublished quiz; time limit 1–600 or null |
| `GET /quizzes/:id` | Authenticated | — | Quiz details under visibility rules |
| `GET /quizzes/:id/questions` | Authenticated | — | Questions; student answer keys withheld |
| `POST /quizzes/:id/questions` | Manager | `{questionId}` | Add question; assignment restrictions apply after attempts |
| `DELETE /quizzes/:id/questions/:questionId` | Manager | — | Remove linked question |
| `PUT /quizzes/:id` | Manager | Quiz fields | Update; quiz with attempts has restrictions |
| `DELETE /quizzes/:id` | Manager | — | Delete; attempts can block deletion |
| `POST /quizzes/:id/publish` | Manager | — | Publish |
| `POST /quizzes/:id/unpublish` | Manager | — | Unpublish |
| `POST /quizzes/:id/start` | Student | — | Create in-progress attempt; returns safe question data |
| `POST /quiz-attempts/:id/submit` | Student owner | `{answers:[{questionId,selectedAnswer}]}` | Server scores and completes; client score values ignored |
| `GET /quiz-attempts/my` | Student | — | Own history |
| `GET /quiz-attempts/:id` | Student owner or manager | — | Attempt/result; ownership enforced for students |

## Performance, revision, planner and management

| Method and path | Access | Request | Behavior |
|---|---|---|---|
| `GET /performance`, `/performance/overview`, `/performance/subjects`, `/performance/topics`, `/performance/weak-topics` | Student | — | Aggregates completed attempts; Strong ≥75%, Average ≥50%, Weak <50% |
| `GET /revision`, `/revision/pending`, `/revision/completed` | Student | — | Own revision plans/list views |
| `POST /revision` | Student | `{topicId}` | Create plan only for a weak topic; duplicate plan conflict |
| `PATCH /revision/:id/complete` | Student owner | — | Complete plan and capture retest baseline |
| `GET /revision/:id/improvement` | Student owner | — | Retest comparison/status |
| `DELETE /revision/:id` | Student owner | — | Delete own plan |
| `GET /exams`, `/exams/upcoming`, `/exams/completed`, `/exams/dashboard` | Student | — | Own schedule and planner summaries |
| `POST /exams` | Student | `{subjectId,examDate:YYYY-MM-DD,notes?}` | Create future exam; duplicate subject/date conflict |
| `PATCH /exams/:id` | Student owner | `{examDate?,subjectId?,notes?}` | Update schedule |
| `PATCH /exams/:id/complete` | Student owner | — | Mark completed |
| `DELETE /exams/:id` | Student owner | — | Delete own schedule |
| `GET /admin/dashboard` | Manager | — | Counts for users/content/quizzes |
| `GET /admin/students` | Manager | — | Student list and summary performance; no-history average is null |
| `GET /admin/students/:studentId/performance` | Manager | — | Student details and topic performance groups |

All schedule/revision operations scope records to the authenticated student. Not-found, validation, conflict and authorization errors are returned with appropriate 4xx status; unexpected errors use generic 500 responses.
