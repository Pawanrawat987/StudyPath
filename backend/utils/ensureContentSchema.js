const { DataTypes, QueryTypes } = require('sequelize');
const { Topic, Question, Subject } = require('../models');

async function ensureCascadeForeignKey(sequelize, table, column, referencedTable, constraintName) {
  const queryInterface = sequelize.getQueryInterface();
  const references = await queryInterface.getForeignKeyReferencesForTable(table);
  const existing = references.find((reference) => reference.columnName === column);
  if (existing) {
    const rules = await sequelize.query(
      `SELECT DELETE_RULE FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
      { replacements: [table, existing.constraintName], type: QueryTypes.SELECT }
    );
    if (rules[0]?.DELETE_RULE === 'CASCADE') return;
  }

  // Refuse to change the constraint if legacy rows already point at missing parents.
  const childTable = queryInterface.queryGenerator.quoteTable(table);
  const parentTable = queryInterface.queryGenerator.quoteTable(referencedTable);
  const quotedColumn = queryInterface.quoteIdentifier(column);
  const orphanRows = await sequelize.query(
    `SELECT COUNT(*) AS count FROM ${childTable} child
     LEFT JOIN ${parentTable} parent ON child.${quotedColumn} = parent.id
     WHERE child.${quotedColumn} IS NOT NULL AND parent.id IS NULL`,
    { type: QueryTypes.SELECT }
  );
  if (Number(orphanRows[0]?.count) > 0) {
    throw new Error(`Cannot enable cascade for ${table}.${column}: orphaned rows exist; no data was deleted`);
  }

  if (existing) await queryInterface.removeConstraint(table, existing.constraintName);
  await queryInterface.addConstraint(table, {
    fields: [column],
    type: 'foreign key',
    name: constraintName,
    references: { table: referencedTable, field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
}

async function ensureContentSchema(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const questionTable = Question.getTableName();
  const questionColumns = await queryInterface.describeTable(questionTable);

  if (!questionColumns.explanation) {
    await queryInterface.addColumn(questionTable, 'explanation', { type: DataTypes.TEXT, allowNull: true });
  }
  if (!questionColumns.difficulty) {
    await queryInterface.addColumn(questionTable, 'difficulty', {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      allowNull: false,
      defaultValue: 'medium',
    });
  }

  await ensureCascadeForeignKey(
    sequelize, Topic.getTableName(), 'subject_id', Subject.getTableName(), 'topics_subject_id_cascade_fk'
  );
  await ensureCascadeForeignKey(
    sequelize, questionTable, 'topic_id', Topic.getTableName(), 'questions_topic_id_cascade_fk'
  );
}

module.exports = ensureContentSchema;
