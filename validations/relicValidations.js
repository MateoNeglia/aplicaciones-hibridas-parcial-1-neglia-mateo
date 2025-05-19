import Joi from 'joi';

//regex para las imagenes
const pictureRegex = /^(https?:\/\/([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?|[\/][\w-\/]*\.(jpeg|jpg|png))$/i;


const nicheSchema = Joi.object({
  category: Joi.string()
  .trim()
  .min(2)
  .max(50)
  .required()
  .messages({
    'string.min': 'La categoría del nicho debe tener al menos 2 caracteres',
    'string.max': 'La categoría del nicho no puede exceder los 50 caracteres',
    'any.required': 'La categoría del nicho es obligatoria',
  }),
  specific: Joi.string()
  .trim()
  .min(2)
  .max(100)
  .required()
  .messages({
    'string.min': 'El nicho específico debe tener al menos 2 caracteres',
    'string.max': 'El nicho específico no puede exceder los 100 caracteres',
    'any.required': 'El nicho específico es obligatorio',
  }),
});


const createRelicSchema = Joi.object({
  niche: nicheSchema.required().messages({
    'any.required': 'El nicho es obligatorio',
  }),
  year: Joi.number()
  .integer()
  .min(1800)
  .max(new Date()
  .getFullYear())
  .optional()
  .messages({
    'number.min': 'El año debe ser posterior a 1800',
    'number.max': 'El año no puede ser futuro',
    'number.integer': 'El año debe ser un número entero',
  }),
  name: Joi.string()
  .trim()
  .min(2)
  .max(100)
  .required()
  .messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder los 100 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),
  description: Joi.string()
  .trim()
  .max(500)
  .optional()
  .messages({
    'string.max': 'La descripción no puede exceder los 500 caracteres',
  }),
  condition: Joi.string()
    .valid(
      'Perfecto Estado',
      'Casi Perfecto Estado',
      'Ligeramente Usado',
      'Moderadamente Usado',
      'Muy Usado',
      'Desgastado',
      'Dañado'
    )
    .required()
    .messages({
      'any.only': 'La condición debe ser una de las opciones permitidas',
      'any.required': 'La condición es obligatoria',
    }),
  set: Joi.string()
  .trim()
  .max(100)
  .optional()
  .messages({
    'string.max': 'El set no puede exceder los 100 caracteres',
  }),
  picture: Joi.string()
  .trim()
  .pattern(pictureRegex)
  .optional()
  .allow('')
  .messages({
    'string.pattern.base': 'La imagen debe ser una URL válida o una ruta de archivo (jpeg, jpg, png)',
  }),
});


const updateRelicSchema = Joi.object({
  niche: nicheSchema.optional(),
  year: Joi.number()
  .integer()
  .min(1800)
  .max(new Date().getFullYear())
  .optional()
  .messages({
    'number.min': 'El año debe ser posterior a 1800',
    'number.max': 'El año no puede ser futuro',
    'number.integer': 'El año debe ser un número entero',
  }),
  name: Joi.string()
  .trim()
  .min(2)
  .max(100)
  .optional()
  .messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder los 100 caracteres',
  }),
  description: Joi.string()
  .trim()
  .max(500)
  .optional()
  .messages({
    'string.max': 'La descripción no puede exceder los 500 caracteres',
  }),
  condition: Joi.string()
    .valid(
      'Perfecto Estado',
      'Casi Perfecto Estado',
      'Ligeramente Usado',
      'Moderadamente Usado',
      'Muy Usado',
      'Desgastado',
      'Dañado'
    )
    .optional()
    .messages({
      'any.only': 'La condición debe ser una de las opciones permitidas',
    }),
  set: Joi.string()
  .trim()
  .max(100)
  .optional()
  .messages({
    'string.max': 'El set no puede exceder los 100 caracteres',
  }),
  picture: Joi.string()
  .trim()
  .pattern(pictureRegex)
  .optional()
  .allow('')
  .messages({
    'string.pattern.base': 'La imagen debe ser una URL válida o una ruta de archivo (jpeg, jpg, png)',
  }),
}).min(1).messages({
  'object.min': 'Al menos un campo debe ser actualizado',
});




const validateRelicCreation = (data) => createRelicSchema.validate(data, { abortEarly: false });
const validateRelicUpdate = (data) => updateRelicSchema.validate(data, { abortEarly: false });

export { validateRelicCreation, validateRelicUpdate };