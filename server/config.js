
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
  COOKIE_SECRET: Joi.string().required()
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
  mongo: {
    uri: envVars.MONGODB_URI || `mongodb://${envVars.MONGO_HOST}:${envVars.MONGO_PORT}/${envVars.MONGO_DATABASE}`,
    connectionOpts: { useNewUrlParser: true }
  }
}

module.exports = config
