# Screenshot Checklist and Project Report Guide

## Suggested screenshots

Capture screenshots from the running application using non-sensitive demo accounts and data. Avoid showing passwords, JWT cookies, `.env` values, email tokens, or personal student information. The following are suggested evidence captures, not screenshots included with this documentation.

1. Login page and registration page.
2. Student dashboard.
3. Subject list and subject topics.
4. Topic question view showing that answer keys are not exposed.
5. Published quiz list.
6. Quiz attempt interface before submission.
7. Quiz result/history.
8. Performance overview with topic categories.
9. Revision plan list and retest comparison.
10. Exam planner dashboard and schedule.
11. Teacher/admin dashboard.
12. Student management list and a student performance detail.
13. API health response (`/api/health`) and terminal showing backend/frontend startup (redact host/account details if needed).

Use consistent browser size, readable zoom, seeded demo data, and captions with figure number, page/module, and what the image demonstrates. Do not fabricate screenshots or represent mock data as live production data.

## Ten-chapter report outline

### Chapter 1 — Introduction

Background, problem statement, objectives, scope, intended users, assumptions and report organization. Keep scope aligned with the implemented app.

### Chapter 2 — Existing System and Feasibility

Describe manual learning progress tracking and limitations; compare the proposed workflow. Include technical, operational and schedule feasibility only when supported by your project evidence.

### Chapter 3 — Requirements and SRS

Functional/nonfunctional requirements, actor roles, constraints, use cases and acceptance criteria. Refer to [SRS](SRS.md).

### Chapter 4 — System Analysis and Design

Architecture, module decomposition, request flow, context/level 1/level 2 DFDs and use-case diagrams or narratives. Refer to [System Design](SYSTEM_DESIGN.md) and [DFDs](DFD_AND_USE_CASES.md).

### Chapter 5 — Database Design

ER diagram, entities, relationships, physical tables, keys, constraints and schema caveats. State which schema snapshot was inspected. Refer to [Database Design](DATABASE_DESIGN.md).

### Chapter 6 — Implementation

Summarize React/Vite frontend, Express API, Sequelize/MySQL persistence, auth and role controls, quiz scoring, performance, revision, planner, and management modules. Do not paste secrets or claim unimplemented features.

### Chapter 7 — Testing

Test environment, methods, case table, actual pass/fail/not-run outcomes, deviations and limitations. Refer to [Test Cases](TEST_CASES.md); keep “not run” provider/browser checks visible.

### Chapter 8 — Security and Limitations

Summarize implemented controls, deployment requirements, known schema/auth limitations and future improvements. Refer to [Security Review](SECURITY.md).

### Chapter 9 — Results and User Interface

Present real application screenshots with figure captions, explain observed results and connect them to requirements. Include no credentials or personal data.

### Chapter 10 — Conclusion and Future Scope

Summarize completed objectives, practical constraints, and carefully scoped possible future work (e.g. formal migrations, verified email enforcement, broader automated browser/provider testing). Identify proposals as future work.

## Suggested appendices

- Appendix A: API reference.
- Appendix B: test cases and result evidence.
- Appendix C: sanitized `.env.example` keys and local setup steps (never actual `.env`).
- Appendix D: sample non-sensitive output and glossary.
