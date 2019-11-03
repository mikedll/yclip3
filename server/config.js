
const path = require('path')
const Joi = require('joi')

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test'])
    .default('development'),
  PORT: Joi.number()
    .default(4040),
  MONGO_HOST: Joi.string()
    .description("Mongo DB host url")
    .default("localhost"),
  MONGO_PORT: Joi.number()
    .default(27017),
  MONGO_DATABASE: Joi.string()
    .description("Mongo database name")
    .default("yclip3dev"),
  MONGODB_URI: Joi.string(),
  GOOGLE_SIGNIN_CLIENT_ID: Joi.string().required(),
  COOKIE_SECRET: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string(),
  AWS_SECRET_ACCESS_KEY: Joi.string(),
  AWS_S3_BUCKET: Joi.string(),
  TEST_AWS_S3_BUCKET: Joi.string()
}).unknown().required().when(
  Joi.object({
    NODE_ENV: Joi.exist().equal('test')
  }).unknown(), {
    then: {
      MONGO_DATABASE: Joi.default("yclip3test")
    }
  })

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);

if(error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  cookieSecret: envVars.COOKIE_SECRET,
  googleClientId: envVars.GOOGLE_SIGNIN_CLIENT_ID,
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  localStorageLocation: (envVars.NODE_ENV !== 'test' ? path.join(__dirname, '../static/storage') : path.join(__dirname, '../tmp/storage')),
  mongo: {
    uri: envVars.MONGODB_URI || `mongodb://${envVars.MONGO_HOST}:${envVars.MONGO_PORT}/${envVars.MONGO_DATABASE}`,
    connectionOpts: { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
  },
  s3: {
    key: envVars.AWS_ACCESS_KEY_ID,
    secret: envVars.AWS_SECRET_ACCESS_KEY,
    bucket: envVars.AWS_S3_BUCKET,
    testBucket: envVars.AWS_S3_BUCKET
  }
}

module.exports = config
