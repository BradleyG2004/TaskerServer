import Joi from "joi";


export const createUserValidation = Joi.object({
    name: Joi.string().required(),
    surname: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
}).options({ abortEarly: false });

export interface CreateUserValidationRequest {
    name: string;
    surname:string;
    email: string;
    password: string;
}



export const logUserValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
}).options({ abortEarly: false });

export interface LogUserValidationRequest {
    email: string;
    password: string;
}