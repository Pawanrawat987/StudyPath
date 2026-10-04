const { DataTypes, QueryTypes } = require('sequelize');
const { RevisionPlan, User, Topic } = require('../models');

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
    throw new Error(`Cannot add ${table}.${column} foreign key because orphaned revision rows exist`);
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

module.exports = async function ensureRevisionSchema(sequelize) {
  const qi = sequelize.getQueryInterface();
  const table = RevisionPlan.getTableName();
  const columns = await qi.describeTable(table);
  const additions = {
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    topic_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'completed'), allowNull: false, defaultValue: 'pending' },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    completed_after_attempt_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  };
  for (const [column, definition] of Object.entries(additions)) {
    if (!columns[column]) await qi.addColumn(table, column, definition);
  }

  await ensureForeignKey(sequelize, table, 'user_id', User.getTableName(), 'revision_plans_user_id_fk');
  await ensureForeignKey(sequelize, table, 'topic_id', Topic.getTableName(), 'revision_plans_topic_id_fk');

  const indexes = await qi.showIndex(table);
  if (indexes.some(index => index.name === 'revision_plans_user_topic_unique')) return;
  const duplicatePairs = await sequelize.query(
    `SELECT user_id, topic_id FROM ${qi.queryGenerator.quoteTable(table)}
     WHERE user_id IS NOT NULL AND topic_id IS NOT NULL
     GROUP BY user_id, topic_id HAVING COUNT(*) > 1 LIMIT 1`,
    { type: QueryTypes.SELECT }
  );
  // Preserve any existing legacy rows if they already contain duplicates. The API
  // still checks duplicates, and a fresh/clean schema gets the database constraint.
  if (!duplicatePairs.length) {
    await qi.addConstraint(table, {
      fields: ['user_id', 'topic_id'],
      type: 'unique',
      name: 'revision_plans_user_topic_unique',
    });
  }
};
