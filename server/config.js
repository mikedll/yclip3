
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
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongo: {
    uri: `mongodb://${envVars.MONGO_HOST}:${envVars.MONGO_PORT}/${envVars.MONGO_DATABASE}`,
    connectionOpts: { useNewUrlParser: true }
  }
}

module.exports = config
