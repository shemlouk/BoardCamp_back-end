import Joi from "joi";

export const gameSchema = Joi.object({
  name: Joi.string(),
  image: Joi.string().uri(),
  stockTotal: Joi.number().positive().integer(),
  pricePerDay: Joi.number().positive().precision(2),
})
  .options({ presence: "required" })
  .required();

export const customerSchema = Joi.object({
  name: Joi.string(),
  phone: Joi.string().pattern(/\d{10,11}/),
  cpf: Joi.string().pattern(/\d{11}/),
  birthday: Joi.date().iso(),
})
  .options({ presence: "required" })
  .required();

export const rentalSchema = Joi.object({
  customerId: Joi.number().integer().positive(),
  gameId: Joi.number().integer().positive(),
  daysRented: Joi.number().integer().positive(),
})
  .options({ presence: "required" })
  .required();
