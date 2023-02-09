import Joi from "joi";

export const gameSchema = Joi.object({
  name: Joi.string(),
  image: Joi.string().uri(),
  stockTotal: Joi.number().positive().integer(),
  pricePerDay: Joi.number().positive().precision(2),
})
  .options({ presence: "required" })
  .required();
