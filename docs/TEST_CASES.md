# Test Cases and Verification Record

## Evidence and scope

The Phase 11 handoff ran an 81-check live API regression set against the configured local backend/database. It also performed direct schema, cookie, Vite proxy/SPA, and production-build checks. The temporary test harness was removed after the run; this document records that result and the known coverage rather than presenting an executable test suite. All rows marked **PASS** below are represented in that recorded run. SMTP provider delivery, a real Google OAuth exchange, and browser automation were **NOT RUN**.

## Test cases

| ID | Test | Expected result | Recorded status |
|---|---|---|---|
| T01 | Health endpoint | 200 success message | PASS |
| T02 | Login as student | Authenticated student response | PASS |
| T03 | Login as teacher | Authenticated teacher response | PASS |
| T04 | Login as admin | Authenticated admin response | PASS |
| T05 | Login as second student | Separate account session | PASS |
| T06 | Login with bad password | Rejected; no session | PASS |
| T07 | `/me` with valid cookie | Public user fields only | PASS |
| T08 | `/me` excludes password | No password field | PASS |
| T09 | `/me` excludes token/private fields | No token or reset secrets | PASS |
| T10 | Protected route without cookie | 401 | PASS |
| T11 | Protected route with invalid/expired JWT | 401 | PASS |
| T12 | Logout | Cookie cleared | PASS |
| T13 | Logout cookie attributes | Clear response includes expected cookie behavior | PASS |
| T14 | Login cookie | HttpOnly cookie set | PASS |
| T15 | Register with manager role attempt | Self-assigned manager role blocked; student role used | PASS |
| T16 | Register controller mail path | Registration behavior verified with mailer stub | PASS |
| T17 | Malformed JSON request | 400 generic syntax response | PASS |
| T18 | Invalid verification token | 400 rejection | PASS |
| T19 | Invalid reset token | 400 rejection | PASS |
| T20 | Student requests admin dashboard | 403 | PASS |
| T21 | Student requests student-management endpoint | 403 | PASS |
| T22 | Student mutates managed content | 403 | PASS |
| T23 | Manager views dashboard | Allowed | PASS |
| T24 | Subject CRUD | Manager create/read/update/delete path verified | PASS |
| T25 | Topic CRUD | Manager create/read/update/delete path verified | PASS |
| T26 | Question CRUD | Manager path verified | PASS |
| T27 | Student views topic questions | Answer key/explanation redacted | PASS |
| T28 | Student requests manager question detail | 403 | PASS |
| T29 | Manager creates quiz | Created unpublished | PASS |
| T30 | Manager attaches question | Link created | PASS |
| T31 | Quiz question list | Expected question membership returned | PASS |
| T32 | Publish quiz | Published state saved | PASS |
| T33 | Student quiz listing | Published quiz visible | PASS |
| T34 | Student cannot see unpublished quiz | Hidden/rejected | PASS |
| T35 | Student cannot start unpublished quiz | Rejected | PASS |
| T36 | Student starts published quiz | Attempt created, safe question data returned | PASS |
| T37 | Quiz response hides correct answer | No answer key returned | PASS |
| T38 | Student submits correct answer | Server computes correct score | PASS |
| T39 | Client-supplied score tampering | Fake score ignored | PASS |
| T40 | Attempt result response | No sensitive answer-key leakage | PASS |
| T41 | Student reads own attempt | Allowed | PASS |
| T42 | Student reads another user's attempt | Rejected | PASS |
| T43 | Attempt history | Own history returned | PASS |
| T44 | Assign question after attempt exists | Restricted | PASS |
| T45 | Delete quiz with attempts | Conflict/restriction enforced | PASS |
| T46 | Unpublish quiz | Hidden to student and cannot start | PASS |
| T47 | Performance with no attempts | Empty/zero summary | PASS |
| T48 | Performance weak classification | Below 50% classified weak | PASS |
| T49 | Performance average threshold | 50% classified average | PASS |
| T50 | Performance strong threshold | 75% classified strong | PASS |
| T51 | Performance overview endpoint | Summary available | PASS |
| T52 | Performance subject endpoint | Subject aggregation available | PASS |
| T53 | Performance topic endpoint | Topic aggregation available | PASS |
| T54 | Weak-topic endpoint | Weak topics returned | PASS |
| T55 | Create weak-topic revision | Plan created | PASS |
| T56 | Create revision for non-weak topic | Rejected | PASS |
| T57 | Duplicate revision plan | Conflict | PASS |
| T58 | Access another user's revision | Rejected | PASS |
| T59 | Complete revision | Completed state saved | PASS |
| T60 | Improvement without retest | Correct no-retest status | PASS |
| T61 | Improvement after retest | Comparison returned; tested improvement reached 100% | PASS |
| T62 | Delete revision | Own plan removed | PASS |
| T63 | Create exam with invalid/past date | Rejected | PASS |
| T64 | Create exam with missing subject | Rejected | PASS |
| T65 | Create valid exam schedule | Created | PASS |
| T66 | Duplicate same subject/date schedule | Conflict | PASS |
| T67 | Update exam date/notes | Updated | PASS |
| T68 | Complete exam schedule | Completed status saved | PASS |
| T69 | Delete exam schedule | Own record removed | PASS |
| T70 | Access another user's exam | Rejected | PASS |
| T71 | Upcoming and completed exam lists | Correct status partitions | PASS |
| T72 | Exam dashboard | Days remaining/preparation fields returned | PASS |
| T73 | Student content mutation through planner/admin | Restricted | PASS |
| T74 | Admin student list | Summary returned with no secrets | PASS |
| T75 | Student with no attempts in admin list | Average performance is null | PASS |
| T76 | Student detailed admin performance | Breakdown returned to manager | PASS |
| T77 | Date boundary calculations | Boundary cases passed | PASS |
| T78 | Revision/exam schema migration columns | Required columns present | PASS |
| T79 | Revision/exam foreign keys | Expected FK counts present | PASS |
| T80 | Disposable test data cleanup | No test data left by recorded check | PASS |
| T81 | Vite `/` and `/admin` SPA routes | HTTP 200 | PASS |
| T82 | Vite proxy `/api/health` | Backend success through proxy | PASS |
| T83 | Production frontend build | Vite build succeeded | PASS |
| T84 | Actual SMTP delivery | Live provider delivery | NOT RUN |
| T85 | Google OAuth provider handshake | External OAuth round trip | NOT RUN |
| T86 | Full browser end-to-end interaction | Browser automation unavailable in recorded run | NOT RUN |

The recorded 81-item API regression set passed. T82–T83 and direct supplemental checks are listed separately because they were outside the 81 API assertions. Do not interpret this table as a rerunnable test suite; the harness was removed after the verified run.

## Remaining verification

Configure a test SMTP account and verify delivery/verification/reset links; configure Google credentials and complete provider authorization; run automated browser flows in a browser-capable environment. Keep provider credentials out of source control. No user-facing browser UX claim is made based solely on HTTP route checks.
