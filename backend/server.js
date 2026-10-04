const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./app');
const { sequelize } = require('./models');
const ensureUserAuthFields = require('./utils/ensureUserAuthFields');
const ensureContentSchema = require('./utils/ensureContentSchema');
const ensureQuizSchema = require('./utils/ensureQuizSchema');
const ensureRevisionSchema = require('./utils/ensureRevisionSchema');
const ensureExamSchema = require('./utils/ensureExamSchema');

async function start() {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  await sequelize.authenticate();
  console.log('MySQL connection established');
  await sequelize.sync();
  await ensureUserAuthFields(sequelize);
  await ensureContentSchema(sequelize);
  await ensureQuizSchema(sequelize);
  await ensureRevisionSchema(sequelize);
  await ensureExamSchema(sequelize);
  console.log('Sequelize models synchronized');
  const port = Number(process.env.PORT || 5000);
  app.listen(port, () => console.log(`StudyPath API listening on port ${port}`));
}

start().catch((error) => {
  console.error('Backend startup failed:', error.message);
  process.exit(1);
});
