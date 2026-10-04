const { DataTypes } = require('sequelize');
const { User } = require('../models');

// Add only missing columns, so an existing Phase 2 Users table is migrated safely.
async function ensureUserAuthFields(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const table = User.getTableName();
  const columns = await queryInterface.describeTable(table);
  const requiredColumns = {
    email_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    email_verification_token: { type: DataTypes.STRING(64), allowNull: true },
    email_verification_expires: { type: DataTypes.DATE, allowNull: true },
    password_reset_token: { type: DataTypes.STRING(64), allowNull: true },
    password_reset_expires: { type: DataTypes.DATE, allowNull: true },
    password_reset_requested_at: { type: DataTypes.DATE, allowNull: true },
    google_id: { type: DataTypes.STRING(128), allowNull: true },
    auth_provider: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'local' },
    phone_number: { type: DataTypes.STRING(16), allowNull: true },
    phone_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  };

  for (const [column, definition] of Object.entries(requiredColumns)) {
    if (!columns[column]) await queryInterface.addColumn(table, column, definition);
  }

  if (columns.password && columns.password.allowNull === false) {
    await queryInterface.changeColumn(table, 'password', { type: DataTypes.STRING(255), allowNull: true });
  }

  const indexes = await queryInterface.showIndex(table);
  const googleIdUniqueIndexExists = indexes.some((index) => index.unique && index.fields.some((field) => field.attribute === 'google_id' || field.name === 'google_id'));
  if (!googleIdUniqueIndexExists) {
    await queryInterface.addIndex(table, ['google_id'], { unique: true, name: 'users_google_id_unique' });
  }

  const phoneUniqueIndexExists = indexes.some((index) => index.unique && index.fields.some((field) => field.attribute === 'phone_number' || field.name === 'phone_number'));
  if (!phoneUniqueIndexExists) {
    await queryInterface.addIndex(table, ['phone_number'], { unique: true, name: 'users_phone_number_unique' });
  }
}

module.exports = ensureUserAuthFields;
