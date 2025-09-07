import Joi from "joi";

export const createListValidation = Joi.object({
    name: Joi.string().min(1).max(100).required()
}).options({ abortEarly: false });

export interface CreateListRequest {
    name: string;
}