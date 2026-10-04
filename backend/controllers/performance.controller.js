const { QuizAttempt, Answer, Question, Topic, Subject } = require('../models');

function percentage(correct, total) {
  return total ? Number((correct / total * 100).toFixed(2)) : 0;
}

function statusFor(value) {
  if (value >= 75) return 'Strong';
  if (value >= 50) return 'Average';
  return 'Weak';
}

async function calculatePerformance(userId) {
  const attempts = await QuizAttempt.findAll({
    where: { userId, status: 'completed' },
    attributes: ['id'],
    include: [{
      model: Answer,
      attributes: ['id', 'questionId', 'isCorrect'],
      required: false,
      include: [{
        model: Question,
        attributes: ['id'],
        required: false,
        include: [{
          model: Topic,
          attributes: ['id', 'name'],
          required: false,
          include: [{ model: Subject, attributes: ['id', 'name'], required: false }],
        }],
      }],
    }],
    order: [['id', 'ASC']],
  });

  const subjectStats = new Map();
  const topicStats = new Map();
  const overallQuestionKeys = new Set();
  let totalCorrectAnswers = 0;

  for (const attempt of attempts) {
    const seenInAttempt = new Set();
    for (const answer of attempt.Answers || []) {
      const questionId = answer.questionId || answer.Question?.id;
      const questionKey = questionId ? String(questionId) : `orphan-answer-${answer.id}`;
      if (seenInAttempt.has(questionKey)) continue;
      seenInAttempt.add(questionKey);

      // An answer belongs to an attempt, so repeated attempts count independently.
      overallQuestionKeys.add(`${attempt.id}:${questionKey}`);
      const correct = Boolean(answer.isCorrect);
      if (correct) totalCorrectAnswers += 1;

      const topic = answer.Question?.Topic;
      if (!topic) continue;
      const subject = topic.Subject;
      const topicEntry = topicStats.get(topic.id) || {
        topicId: topic.id,
        topicName: topic.name,
        subjectId: subject?.id ?? null,
        subjectName: subject?.name ?? 'Unknown subject',
        questionsAttempted: 0,
        correctAnswers: 0,
      };
      topicEntry.questionsAttempted += 1;
      if (correct) topicEntry.correctAnswers += 1;
      topicStats.set(topic.id, topicEntry);

      if (subject) {
        const subjectEntry = subjectStats.get(subject.id) || {
          subjectId: subject.id,
          subjectName: subject.name,
          quizAttemptIds: new Set(),
          questionsAttempted: 0,
          correctAnswers: 0,
        };
        subjectEntry.quizAttemptIds.add(attempt.id);
        subjectEntry.questionsAttempted += 1;
        if (correct) subjectEntry.correctAnswers += 1;
        subjectStats.set(subject.id, subjectEntry);
      }
    }
  }

  const totalQuestionsAttempted = overallQuestionKeys.size;
  const totalIncorrectAnswers = totalQuestionsAttempted - totalCorrectAnswers;
  const subjectPerformance = [...subjectStats.values()].map((entry) => {
    const totalPossibleMarks = entry.questionsAttempted;
    const marksObtained = entry.correctAnswers;
    const value = percentage(marksObtained, totalPossibleMarks);
    return {
      subjectId: entry.subjectId,
      subjectName: entry.subjectName,
      quizzesAttempted: entry.quizAttemptIds.size,
      questionsAttempted: totalPossibleMarks,
      correctAnswers: marksObtained,
      incorrectAnswers: totalPossibleMarks - marksObtained,
      marksObtained,
      totalPossibleMarks,
      percentage: value,
      status: statusFor(value),
    };
  }).sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  const topicPerformance = [...topicStats.values()].map((entry) => {
    const totalPossibleMarks = entry.questionsAttempted;
    const marksObtained = entry.correctAnswers;
    const value = percentage(marksObtained, totalPossibleMarks);
    return {
      topicId: entry.topicId,
      topicName: entry.topicName,
      subjectId: entry.subjectId,
      subjectName: entry.subjectName,
      questionsAttempted: totalPossibleMarks,
      correctAnswers: marksObtained,
      incorrectAnswers: totalPossibleMarks - marksObtained,
      marksObtained,
      totalPossibleMarks,
      percentage: value,
      status: statusFor(value),
    };
  }).sort((a, b) => a.subjectName.localeCompare(b.subjectName) || a.topicName.localeCompare(b.topicName));

  const totalMarksObtained = totalCorrectAnswers;
  const totalPossibleMarks = totalQuestionsAttempted;
  const overview = {
    totalQuizzesAttempted: attempts.length,
    totalQuestionsAttempted,
    totalCorrectAnswers,
    totalIncorrectAnswers,
    totalMarksObtained,
    totalPossibleMarks,
    overallPercentage: percentage(totalMarksObtained, totalPossibleMarks),
  };
  return {
    overview,
    subjectPerformance,
    topicPerformance,
    strongTopics: topicPerformance.filter((topic) => topic.status === 'Strong'),
    averageTopics: topicPerformance.filter((topic) => topic.status === 'Average'),
    weakTopics: topicPerformance.filter((topic) => topic.status === 'Weak'),
  };
}

function sendPart(part) {
  return async (req, res, next) => {
    try {
      const performance = await calculatePerformance(req.user.id);
      return res.json({ success: true, [part]: performance[part] });
    } catch (error) { return next(error); }
  };
}

async function getPerformance(req, res, next) {
  try {
    const performance = await calculatePerformance(req.user.id);
    return res.json({ success: true, ...performance });
  } catch (error) { return next(error); }
}

module.exports = {
  overview: sendPart('overview'),
  subjects: sendPart('subjectPerformance'),
  topics: sendPart('topicPerformance'),
  weakTopics: sendPart('weakTopics'),
  getPerformance,
  calculatePerformance,
};
