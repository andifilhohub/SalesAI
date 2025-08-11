const Joi = require('joi');

// Schemas de validação
const schemas = {
  // Autenticação
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  // Configuração do agente
  agentConfig: Joi.object({
    name: Joi.string().min(2).max(100),
    language: Joi.string().valid('pt', 'en', 'es'),
    mood: Joi.string().valid('friendly', 'professional', 'casual', 'formal'),
    formality: Joi.string().valid('informal', 'formal', 'mixed'),
    allow_emojis: Joi.boolean(),
    response_speed: Joi.string().valid('fast', 'balanced', 'detailed'),
    tone: Joi.string().valid('supportive', 'assertive', 'empathetic', 'neutral'),
    opening_phrase: Joi.string().max(500),
    closing_phrase: Joi.string().max(500),
    outbound_webhook_url: Joi.string().uri().allow('')
  }),

  // Atualização de conta
  accountUpdate: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email()
  }),

  // Mudança de senha
  passwordChange: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  // Integração
  integration: Joi.object({
    service: Joi.string().valid('whatsapp', 'telegram', 'twilio', 'outbound_webhook').required(),
    credentials: Joi.object().when('service', {
      is: 'whatsapp',
      then: Joi.object({
        token: Joi.string().required(),
        phone_number_id: Joi.string()
      }),
      otherwise: Joi.when('service', {
        is: 'telegram',
        then: Joi.object({
          bot_token: Joi.string().required()
        }),
        otherwise: Joi.when('service', {
          is: 'twilio',
          then: Joi.object({
            account_sid: Joi.string().required(),
            auth_token: Joi.string().required(),
            phone_number: Joi.string()
          }),
          otherwise: Joi.when('service', {
            is: 'outbound_webhook',
            then: Joi.object({
              url: Joi.string().uri().required()
            })
          })
        })
      })
    })
  }),

  // Mensagem
  message: Joi.object({
    content: Joi.string().min(1).max(2000).required(),
    channel: Joi.string().valid('web', 'whatsapp', 'telegram', 'sms', 'api')
  }),

  // API pública
  publicMessage: Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    channel: Joi.string().valid('web', 'whatsapp', 'telegram', 'sms', 'api').default('api'),
    customer_identifier: Joi.string().max(100)
  })
};

// Middleware de validação
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        code: 'VALIDATION_ERROR'
      });
    }

    req.validatedData = value;
    next();
  };
};

module.exports = {
  validate,
  schemas
};
