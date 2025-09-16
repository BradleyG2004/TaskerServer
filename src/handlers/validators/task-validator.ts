import Joi from 'joi';

// Define the schema for task validation
export const createTaskValidation = Joi.object({
    shortDesc: Joi.string()
        .min(3)
        .max(255)
        .required(),

    longDesc: Joi.string()
        .allow('') // Optional field
        .max(1000),

    deadline: Joi.date()
        .required(),

    listId: Joi.number()
        .integer()
        .positive()
        .required(),
});

export interface CreateTaskValidationRequest {
    shortDesc: string;
    longDesc: string;
    deadline: Date;
}