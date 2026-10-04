const { DataTypes } = require('sequelize');

// Additive migration for existing StudyPath databases. Existing quiz/attempt data
// is retained; new quiz columns are nullable/defaulted so older rows remain valid.
module.exports = async function ensureQuizSchema(sequelize) {
  const qi = sequelize.getQueryInterface();
  const additions = {
    quizzes: {
      topic_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      time_limit: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      is_published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    quiz_attempts: {
      total_questions: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      correct_answers: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      wrong_answers: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.ENUM('in_progress', 'completed'), allowNull: false, defaultValue: 'in_progress' },
    },
  };
  for (const [table, columns] of Object.entries(additions)) {
    let description;
    try { description = await qi.describeTable(table); } catch (error) {
      if (error.name === 'SequelizeDatabaseError') continue;
      throw error;
    }
    for (const [column, definition] of Object.entries(columns)) {
      if (!description[column]) await qi.addColumn(table, column, definition);
    }
  }
};
