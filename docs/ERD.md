# Entity Relationship Diagram

The full source-of-truth schema lives in [`prisma/schema.prisma`](../prisma/schema.prisma).
This document is the human-readable summary.

## Core domain

```
LearningPath 1───* Module 1───* Unit 1───* ContentBlock
                              │            │
                              │            └── embedding vector(1536)
                              │
                              ├─* Transcript 1─* TranscriptChunk (embedding)
                              ├─* KnowledgeCheck
                              ├─* Flashcard
                              └─ LabGuide (1:1)

Module 1───* ExamQuestion *──* Exam (via ExamItem)
                          *───* QuestionAttempt
```

## Identity & state

```
User ─┬─* Account (OAuth)
      ├─* Session
      ├─* UnitProgress (per Unit, status + percent + time)
      ├─* ExamAttempt 1─* QuestionAttempt
      ├─* FlashcardReview (SM-2 state, due date)
      ├─* StudyPlan (active flag)
      ├─* TopicConfidence (one per ExamObjective)
      ├─* TutorThread 1─* TutorMessage
      └─* AuditLog
```

## Operational

```
ScrapeJob          (url, kind, status, attempts, lastError)
AIGeneration       (kind, model, tokens, costUsd, latencyMs, refTable, refId)
PromptVersion      (name, version, template, active)
AuditLog           (action, target, meta, ip, ua)
```

## Key enums

- `Role`               – STUDENT, INSTRUCTOR, ADMIN
- `ExamObjective`      – IDENTITIES_GOVERNANCE, STORAGE, COMPUTE,
                          VIRTUAL_NETWORKING, MONITORING_BACKUP
- `ContentLevel`       – BEGINNER, INTERMEDIATE, ADVANCED
- `UnitKind`           – LESSON, LAB, QUIZ, REVIEW, EXERCISE
- `BlockKind`          – HEADING, PARAGRAPH, CODE, TABLE, LIST, CALLOUT, IMAGE, LINK
- `QuestionType`       – MULTIPLE_CHOICE, MULTIPLE_RESPONSE, DRAG_DROP, CASE_STUDY,
                          SCENARIO, ARCHITECTURE, CLI_TROUBLESHOOT
- `Difficulty`         – EASY, MEDIUM, HARD, EXPERT
- `ExamMode`           – TIMED, REVIEW, STUDY, ADAPTIVE, WEAK_AREA
- `QuestionSource`     – AI_GENERATED, EXPERT_AUTHORED, IMPORTED
- `ReviewStatus`       – NEEDS_REVIEW, APPROVED, REJECTED
- `ProcessingStatus`   – PENDING, PROCESSING, COMPLETED, FAILED
- `ProgressStatus`     – NOT_STARTED, IN_PROGRESS, COMPLETED, MASTERED
- `FlashcardSource`    – AI_GENERATED, CURATED, USER_AUTHORED
- `TutorRole`          – USER, ASSISTANT, SYSTEM

## Indexes worth noting

- `ExamQuestion(objective, difficulty)` — exam sampling
- `ExamQuestion(reviewStatus)` — admin review queue
- `ExamQuestion.tags` — Gin index for tag filtering
- `Unit(moduleId, orderIndex)` — curriculum rendering
- `Unit(likelyOnExam)` — exam-focus surface
- `FlashcardReview(userId, dueAt)` — daily review query
- `QuestionAttempt(userId, questionId)` — duplicate detection
- `QuestionAttempt(questionId, isCorrect)` — quality scoring
- `AIGeneration(kind, createdAt)` — admin cost dashboard
