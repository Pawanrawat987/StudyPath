# Subjects, topics, and questions

Content APIs are mounted under `/api` and require the existing JWT cookie. Students can read the content; only users whose database role is `teacher` or `admin` can write it.

## Existing question columns

The existing Question table is reused without duplicating equivalent data:

- API `questionText` maps to the existing `prompt` column.
- API options A–D map to the existing `options` JSON column.
- API `correctAnswer` maps to the existing `correct_answer` column.
- `explanation` and `difficulty` are added only when missing.

## Deletion behavior

Deleting a Subject intentionally cascades to its Topics and Questions. Deleting a Topic intentionally cascades to its Questions. Foreign keys enforce both relationships. Existing Answer rows are preserved; their optional question reference becomes null when a Question is deleted. The startup schema check refuses to replace a foreign key if it detects orphaned child rows, and it never deletes or resets existing data.

Student question-list responses omit both `correctAnswer` and `explanation`. The single-question management endpoint is available only to teachers and admins.
