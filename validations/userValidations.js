import Joi from 'joi';

// Expresión regular para validar el formato de correo electrónico
const emailRegex = /^\S+@\S+\.\S+$/;
// Expresión regular para validar que solo contenga dígitos y no sea solo numeros
const nonNumericRegex = /^\D+$/;

//Schema base para nichos de usuario
const nicheSchema = Joi.object({
  category: Joi.string().trim().min(2).max(50).required(),
  specific: Joi.string().trim().min(2).max(100).required(),
  isCustom: Joi.boolean().default(false),
});

//Schema para reliquias
const reliquaryNicheSchema = Joi.object({
  category: Joi.string().trim().min(2).max(50).required(),
  specific: Joi.string().trim().min(2).max(100).required(),
});

//--------------------------------------------------------------
//SHCEMAS para el registro de usuario 
const createUserSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .required()
    .regex(nonNumericRegex)
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'any.required': 'El nombre es obligatorio',
      'string.pattern.base': 'El nombre no puede ser solo números',
    }),
  lastname: Joi.string()
    .trim()
    .min(2)
    .required()
    .regex(nonNumericRegex)
    .messages({
      'string.min': 'El apellido debe tener al menos 2 caracteres',
      'any.required': 'El apellido es obligatorio',
      'string.pattern.base': 'El apellido no puede ser solo números',
    }),
  username: Joi.string().trim().min(3).max(30).required().messages({
    'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
    'string.max': 'El nombre de usuario no puede exceder los 30 caracteres',
    'any.required': 'El nombre de usuario es obligatorio',
  }),
  email: Joi.string().trim().lowercase().pattern(emailRegex).required().messages({
    'string.pattern.base': 'Por favor, utiliza una dirección de correo electrónico válida',
    'any.required': 'El correo electrónico es obligatorio',
  }),
  password: Joi.string().min(6).when('googleId', {
    is: Joi.exist(),
    then: Joi.allow('').optional(),
    otherwise: Joi.required(),
  }).messages({
    'string.min': 'El password debe tener al menos 6 caracteres',
    'any.required': 'El password es obligatorio, a menos que inicies sesión con Google',
  }),
  googleId: Joi.string().optional(),
  location: Joi.object({
    city: Joi.string().trim().allow('').default(''),
    country: Joi.string().trim().allow('').default(''),
  }).optional().default({ city: '', country: '' }),
  rating: Joi.number().min(0).max(5).default(0).messages({
    'number.min': 'El rating no puede ser negativo',
    'number.max': 'El rating no puede exceder 5',
  }),
  niches: Joi.array()
    .items(nicheSchema)
    .optional()
    .default([])
    .messages({
      'array.base': 'Nichos deben ser una lista',
    }),
  reliquaryLists: Joi.array()
    .items(
      Joi.object({
        niche: reliquaryNicheSchema,
        relics: Joi.array().items(Joi.string().hex().length(24)).default([]),
      })
    )
    .optional()
    .default([])
    .messages({
      'array.base': 'El reliquario debe ser una lista',
    }),
  role: Joi.string().valid('user', 'admin').default('user').messages({
    'any.only': 'El rol debe ser "user" o "admin"',
  }),
});

//--------------------------------------------------------------


//Shema para la actualizacion de usuario
const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).optional().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
  }),
  lastname: Joi.string().trim().min(2).optional().messages({
    'string.min': 'El apellido debe tener al menos 2 caracteres',
  }),
  username: Joi.string().trim().min(3).max(30).optional().messages({
    'string.min': 'EL nombre de usuario debe tener al menos 3 caracteres',
    'string.max': 'El nombre de usuario no puede exceder los 30 caracteres',
  }),
  email: Joi.string().trim().lowercase().pattern(emailRegex).optional().messages({
    'string.pattern.base': 'Por favor, utiliza una dirección de correo electrónico válida',
  }),
  password: Joi.string().min(6).optional().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
  }),
  location: Joi.object({
    city: Joi.string().trim().allow('').optional(),
    country: Joi.string().trim().allow('').optional(),
  }).optional(),
  rating: Joi.number().min(0).max(5).optional().messages({
    'number.min': 'El rating no puede ser negativo',
    'number.max': 'El rating no puede exceder 5',
  }),
  niches: Joi.array()
    .items(nicheSchema)
    .optional()
    .messages({
      'array.base': 'Los nichos deben ser una lista',
    }),
  reliquaryLists: Joi.array()
    .items(
      Joi.object({
        niche: reliquaryNicheSchema,
        relics: Joi.array().items(Joi.string().hex().length(24)).optional(),
      })
    )
    .optional()
    .messages({
      'array.base': 'El reliquario debe ser una lista',
    }),
  role: Joi.string().valid('user', 'admin').optional().messages({
    'any.only': 'El rol debe ser "user" o "admin"',
  }),
}).min(1).messages({
  'object.min': 'Al menos un campo debe ser actualizado',
});

//schema para el login
const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'El Email o nombre de usuario es obligatorio',
  }),
  password: Joi.string().required().messages({
    'any.required': 'El password es obligatorio',
  }),
});

//funciones de validacion
const validateUserCreation = (data) => createUserSchema.validate(data, { abortEarly: false });
const validateUserUpdate = (data) => updateUserSchema.validate(data, { abortEarly: false });
const validateLogin = (data) => loginSchema.validate(data, { abortEarly: false });

export { validateUserCreation, validateUserUpdate, validateLogin };