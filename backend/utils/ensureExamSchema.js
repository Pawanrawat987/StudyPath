const { DataTypes, QueryTypes } = require('sequelize');
const { ExamSchedule, User, Subject } = require('../models');

async function ensureForeignKey(sequelize, table, column, parentTable, constraintName) {
  const qi = sequelize.getQueryInterface();
  const references = await qi.getForeignKeyReferencesForTable(table);
  if (references.some(reference => reference.columnName === column)) return;
  const child = qi.queryGenerator.quoteTable(table);
  const parent = qi.queryGenerator.quoteTable(parentTable);
  const quotedColumn = qi.quoteIdentifier(column);
  const orphanRows = await sequelize.query(
    `SELECT COUNT(*) AS count FROM ${child} child LEFT JOIN ${parent} parent
     ON child.${quotedColumn} = parent.id
     WHERE child.${quotedColumn} IS NOT NULL AND parent.id IS NULL`,
    { type: QueryTypes.SELECT }
  );
  if (Number(orphanRows[0]?.count) > 0) {
    throw new Error(`Cannot add ${table}.${column} foreign key because orphaned exam rows exist`);
  }
  await qi.addConstraint(table, {
    fields: [column],
    type: 'foreign key',
    name: constraintName,
    references: { table: parentTable, field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
}

module.exports = async function ensureExamSchema(sequelize) {
  const qi = sequelize.getQueryInterface();
  const table = ExamSchedule.getTableName();
  const columns = await qi.describeTable(table);
  if (columns.title && columns.title.allowNull === false) {
    await qi.changeColumn(table, 'title', { type: DataTypes.STRING(180), allowNull: true });
  }
  const additions = {
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    subject_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    status: { type: DataTypes.ENUM('upcoming', 'completed'), allowNull: false, defaultValue: 'upcoming' },
    notes: { type: DataTypes.TEXT, allowNull: true },
  };
  for (const [column, definition] of Object.entries(additions)) {
    if (!columns[column]) await qi.addColumn(table, column, definition);
  }

  await ensureForeignKey(sequelize, table, 'user_id', User.getTableName(), 'exam_schedules_user_id_fk');
  await ensureForeignKey(sequelize, table, 'subject_id', Subject.getTableName(), 'exam_schedules_subject_id_fk');

  const indexName = 'exam_schedules_user_subject_date_unique';
  const indexes = await qi.showIndex(table);
  if (indexes.some(index => index.name === indexName)) return;
  const duplicatePairs = await sequelize.query(
    `SELECT user_id, subject_id, DATE(exam_at) AS exam_date FROM ${qi.queryGenerator.quoteTable(table)}
     WHERE user_id IS NOT NULL AND subject_id IS NOT NULL
     GROUP BY user_id, subject_id, DATE(exam_at) HAVING COUNT(*) > 1 LIMIT 1`,
    { type: QueryTypes.SELECT }
  );
  // Keep legacy schedules untouched if they already contain duplicate dates.
  // New schedules are also checked by the API before insert.
  if (!duplicatePairs.length) {
    await qi.addIndex(table, {
      fields: ['user_id', 'subject_id', 'exam_at'],
      unique: true,
      name: indexName,
    });
  }
};
