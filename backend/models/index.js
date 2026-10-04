const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(254), allowNull: false, unique: true, validate: { isEmail: true } },
  phoneNumber: { type: DataTypes.STRING(16), allowNull: true, field: 'phone_number' },
  phoneVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'phone_verified' },
  password: { type: DataTypes.STRING(255), allowNull: true },
  role: { type: DataTypes.ENUM('student', 'teacher', 'admin'), allowNull: false, defaultValue: 'student' },
  emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'email_verified' },
  emailVerificationToken: { type: DataTypes.STRING(64), allowNull: true, field: 'email_verification_token' },
  emailVerificationExpires: { type: DataTypes.DATE, allowNull: true, field: 'email_verification_expires' },
  passwordResetToken: { type: DataTypes.STRING(64), allowNull: true, field: 'password_reset_token' },
  passwordResetExpires: { type: DataTypes.DATE, allowNull: true, field: 'password_reset_expires' },
  passwordResetRequestedAt: { type: DataTypes.DATE, allowNull: true, field: 'password_reset_requested_at' },
  googleId: { type: DataTypes.STRING(128), allowNull: true, unique: true, field: 'google_id' },
  authProvider: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'local', field: 'auth_provider' },
}, { defaultScope: { attributes: { exclude: ['password'] } }, scopes: { withPassword: { attributes: {} } } });

const PasswordResetOtp = sequelize.define('PasswordResetOtp', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
  phoneNumber: { type: DataTypes.STRING(16), allowNull: false, field: 'phone_number' },
  otpHash: { type: DataTypes.STRING(64), allowNull: false, field: 'otp_hash' },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
  attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  verifiedAt: { type: DataTypes.DATE, allowNull: true, field: 'verified_at' },
  resetTokenHash: { type: DataTypes.STRING(64), allowNull: true, field: 'reset_token_hash' },
  resetTokenExpiresAt: { type: DataTypes.DATE, allowNull: true, field: 'reset_token_expires_at' },
}, { indexes: [{ fields: ['phone_number', 'expires_at'] }, { fields: ['reset_token_hash'], unique: true }] });

const Subject = sequelize.define('Subject', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  description: DataTypes.TEXT,
});
const Topic = sequelize.define('Topic', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  subjectId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'subject_id' },
  name: { type: DataTypes.STRING(160), allowNull: false },
  description: DataTypes.TEXT,
});
const Question = sequelize.define('Question', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  topicId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'topic_id' },
  questionText: { type: DataTypes.TEXT, allowNull: false, field: 'prompt' },
  type: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'multiple_choice' },
  options: DataTypes.JSON,
  correctAnswer: { type: DataTypes.TEXT, field: 'correct_answer' },
  explanation: { type: DataTypes.TEXT, allowNull: true },
  difficulty: { type: DataTypes.ENUM('easy', 'medium', 'hard'), allowNull: false, defaultValue: 'medium' },
});
const Quiz = sequelize.define('Quiz', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(180), allowNull: false },
  description: DataTypes.TEXT,
  subjectId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'subject_id' },
  topicId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'topic_id' },
  timeLimit: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'time_limit' },
  isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_published' },
});
const QuizAttempt = sequelize.define('QuizAttempt', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  quizId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'quiz_id' },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
  startedAt: { type: DataTypes.DATE, field: 'started_at' },
  completedAt: { type: DataTypes.DATE, field: 'completed_at' },
  score: DataTypes.DECIMAL(7, 2),
  totalQuestions: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'total_questions' },
  correctAnswers: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'correct_answers' },
  wrongAnswers: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'wrong_answers' },
  percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.ENUM('in_progress', 'completed'), allowNull: false, defaultValue: 'in_progress' },
});
const Answer = sequelize.define('Answer', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  quizAttemptId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'quiz_attempt_id' },
  questionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'question_id' },
  selectedAnswer: { type: DataTypes.STRING(1), allowNull: true, field: 'response' },
  isCorrect: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_correct' },
});
const RevisionPlan = sequelize.define('RevisionPlan', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(180), allowNull: false },
  starts_at: DataTypes.DATE,
  ends_at: DataTypes.DATE,
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
  topicId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'topic_id' },
  status: { type: DataTypes.ENUM('pending', 'completed'), allowNull: false, defaultValue: 'pending' },
  completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
  completedAfterAttemptId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'completed_after_attempt_id' },
});
const ExamSchedule = sequelize.define('ExamSchedule', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(180), allowNull: true },
  examDate: { type: DataTypes.DATE, allowNull: false, field: 'exam_at' },
  location: DataTypes.STRING(180),
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
  subjectId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'subject_id' },
  status: { type: DataTypes.ENUM('upcoming', 'completed'), allowNull: false, defaultValue: 'upcoming' },
  notes: { type: DataTypes.TEXT, allowNull: true },
});

User.hasMany(QuizAttempt, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(PasswordResetOtp, { foreignKey: 'userId', onDelete: 'CASCADE' });
PasswordResetOtp.belongsTo(User, { foreignKey: 'userId' });
QuizAttempt.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RevisionPlan, { foreignKey: 'userId', onDelete: 'CASCADE' });
RevisionPlan.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ExamSchedule, { foreignKey: 'userId', onDelete: 'CASCADE' });
ExamSchedule.belongsTo(User, { foreignKey: 'userId' });
Subject.hasMany(Topic, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
Topic.belongsTo(Subject, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
Topic.hasMany(Question, { foreignKey: 'topicId', onDelete: 'CASCADE' });
Question.belongsTo(Topic, { foreignKey: 'topicId', onDelete: 'CASCADE' });
Subject.hasMany(Quiz, { foreignKey: 'subjectId', onDelete: 'SET NULL' });
Quiz.belongsTo(Subject, { foreignKey: 'subjectId' });
Topic.hasMany(Quiz, { foreignKey: 'topicId', onDelete: 'SET NULL' });
Quiz.belongsTo(Topic, { foreignKey: 'topicId' });
Quiz.belongsToMany(Question, { through: 'QuizQuestions', foreignKey: 'quiz_id', otherKey: 'question_id' });
Question.belongsToMany(Quiz, { through: 'QuizQuestions', foreignKey: 'question_id', otherKey: 'quiz_id' });
Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId' });
QuizAttempt.hasMany(Answer, { foreignKey: 'quizAttemptId', onDelete: 'CASCADE' });
Answer.belongsTo(QuizAttempt, { foreignKey: 'quizAttemptId' });
Question.hasMany(Answer, { foreignKey: 'questionId', onDelete: 'SET NULL' });
Answer.belongsTo(Question, { foreignKey: 'questionId' });
RevisionPlan.belongsToMany(Topic, { through: 'RevisionPlanTopics', foreignKey: 'revision_plan_id', otherKey: 'topic_id' });
Topic.belongsToMany(RevisionPlan, { through: 'RevisionPlanTopics', foreignKey: 'topic_id', otherKey: 'revision_plan_id' });
Topic.hasMany(RevisionPlan, { foreignKey: 'topicId', onDelete: 'CASCADE' });
RevisionPlan.belongsTo(Topic, { foreignKey: 'topicId' });
ExamSchedule.belongsToMany(Subject, { through: 'ExamScheduleSubjects', foreignKey: 'exam_schedule_id', otherKey: 'subject_id' });
Subject.belongsToMany(ExamSchedule, { through: 'ExamScheduleSubjects', foreignKey: 'subject_id', otherKey: 'exam_schedule_id' });
Subject.hasMany(ExamSchedule, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
ExamSchedule.belongsTo(Subject, { foreignKey: 'subjectId' });

module.exports = { sequelize, User, PasswordResetOtp, Subject, Topic, Question, Quiz, QuizAttempt, Answer, RevisionPlan, ExamSchedule };
