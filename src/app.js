// src/app.ts
import express from "express";
import dotenv2 from "dotenv";
import cors from "cors";

// src/schemas/index.ts
import Joi from "joi";
var gameSchema = Joi.object({
  name: Joi.string(),
  image: Joi.string().uri(),
  stockTotal: Joi.number().positive().integer(),
  pricePerDay: Joi.number().positive().precision(2)
}).options({ presence: "required" }).required();
var customerSchema = Joi.object({
  name: Joi.string(),
  phone: Joi.string().pattern(/\d{10,11}/),
  cpf: Joi.string().pattern(/^\d{11}$/),
  birthday: Joi.date().iso()
}).options({ presence: "required" }).required();
var rentalSchema = Joi.object({
  customerId: Joi.number().integer().positive(),
  gameId: Joi.number().integer().positive(),
  daysRented: Joi.number().integer().positive()
}).options({ presence: "required" }).required();

// src/config/database.ts
import dotenv from "dotenv";
import pg from "pg";
dotenv.config();
var configDatabase = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.MODE === "prod"
};
var database_default = new pg.Pool(configDatabase);

// src/controllers/gamesController.ts
var read = async (req, res) => {
  try {
    const { rows } = await database_default.query("SELECT * FROM games");
    res.send(rows);
  } catch ({ message }) {
    res.status(500).send(message);
  }
};
var create = async (req, res) => {
  const { error } = gameSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).send(error.details);
  const { name, image, stockTotal, pricePerDay } = req.body;
  try {
    const { rowCount } = await database_default.query(
      "SELECT name FROM games WHERE name = $1",
      [name]
    );
    if (rowCount)
      return res.sendStatus(409);
    await database_default.query(
      'INSERT INTO games (name, image, "stockTotal", "pricePerDay") VALUES ($1, $2, $3, $4)',
      [name, image, stockTotal, pricePerDay]
    );
    res.sendStatus(201);
  } catch ({ message }) {
    res.status(500).send(message);
  }
};

// src/routers/Games.ts
import { Router } from "express";
var BASE_URL = "/games";
var route = Router();
route.get(BASE_URL, read);
route.post(BASE_URL, create);
var Games_default = route;

// src/controllers/rentalsController.ts
import dayjs from "dayjs";
var read2 = async (req, res) => {
  try {
    const { rows } = await database_default.query("SELECT * FROM rentals");
    const result = await Promise.all(
      rows.map(async (r) => {
        const game = await database_default.query(
          "SELECT id, name FROM games WHERE id = $1",
          [r.gameId]
        );
        const customer = await database_default.query(
          "SELECT id, name FROM customers WHERE id = $1",
          [r.customerId]
        );
        r.customer = customer.rows[0];
        r.game = game.rows[0];
        r.rentDate = dayjs(r.rentDate).format("YYYY-MM-DD");
        r.returnDate = r.returnDate && dayjs(r.returnDate).format("YYYY-MM-DD");
        return r;
      })
    );
    res.send(result);
  } catch ({ message }) {
    res.status(500).send(message);
  }
};
var create2 = async (req, res) => {
  const { error } = rentalSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).send(error.details);
  const { customerId, gameId, daysRented } = req.body;
  try {
    const customer = await database_default.query("SELECT * FROM customers WHERE id = $1", [
      customerId
    ]);
    const game = await database_default.query("SELECT * FROM games WHERE id = $1", [
      gameId
    ]);
    const { rowCount } = await database_default.query(
      'SELECT * FROM rentals WHERE "gameId" = $1',
      [gameId]
    );
    if (!customer.rowCount || !game.rowCount || game.rows[0].stockTotal <= rowCount)
      return res.sendStatus(400);
    await database_default.query(
      'INSERT INTO rentals ("customerId", "gameId", "daysRented", "rentDate", "originalPrice", "returnDate", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        customerId,
        gameId,
        daysRented,
        /* @__PURE__ */ new Date(),
        game.rows[0].pricePerDay * daysRented,
        null,
        null
      ]
    );
    res.sendStatus(201);
  } catch ({ message }) {
    res.status(500).send(message);
  }
};
var returnOne = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { rows } = await database_default.query("SELECT * FROM rentals WHERE id = $1", [
      id
    ]);
    const rental = rows[0];
    if (!rental)
      return res.sendStatus(404);
    if (rental.returnDate)
      return res.sendStatus(400);
    const dayToReturn = dayjs(rental.rentDate).add(rental.daysRented, "day");
    const delayDays = Math.max(dayjs().diff(dayToReturn, "day"), 0);
    await database_default.query(
      'UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3',
      [/* @__PURE__ */ new Date(), delayDays * rental.originalPrice, id]
    );
    res.sendStatus(200);
  } catch ({ message }) {
    res.status(500).send(message);
  }
};
var deleteOne = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { rows } = await database_default.query("SELECT * FROM rentals WHERE id = $1", [
      id
    ]);
    if (!rows[0])
      return res.sendStatus(404);
    if (!rows[0].returnDate)
      return res.sendStatus(400);
    await database_default.query("DELETE FROM rentals WHERE id = $1", [id]);
    res.sendStatus(200);
  } catch ({ message }) {
    res.status(500).send(message);
  }
};

// src/routers/Rentals.ts
import { Router as Router2 } from "express";
var BASE_URL2 = "/rentals";
var router = Router2();
router.get(BASE_URL2, read2);
router.post(BASE_URL2, create2);
router.post(BASE_URL2 + "/:id/return", returnOne);
router.delete(BASE_URL2 + "/:id", deleteOne);
var Rentals_default = router;

// src/controllers/customersController.ts
import dayjs2 from "dayjs";
var read3 = async (req, res) => {
  try {
    const { rows } = await database_default.query("SELECT * FROM customers");
    rows.map((r) => r.birthday = dayjs2(r.birthday).format("YYYY-MM-DD"));
    res.send(rows);
  } catch ({ message }) {
    res.status(500).send(message);
  }
};
var readById = async (req, res) => {
  const id = Number(req.params.id);
  if (id <= 0 || !id)
    return res.sendStatus(400);
  try {
    const { rows, rowCount } = await database_default.query(
      "SELECT * FROM customers WHERE id = $1",
      [id]
    );
    if (!rowCount)
      return res.sendStatus(404);
    rows[0].birthday = dayjs2(rows[0].birthday).format("YYYY-MM-DD");
    res.send(rows[0]);
  } catch ({ message }) {
    res.status(500).send(message);
  }
};
var create3 = async (req, res) => {
  const { error } = customerSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).send(error.details);
  const { name, phone, cpf, birthday } = req.body;
  try {
    const { rowCount } = await database_default.query(
      "SELECT * FROM customers WHERE cpf = $1",
      [cpf]
    );
    if (rowCount)
      return res.sendStatus(409);
    await database_default.query(
      "INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)",
      [name, phone, cpf, birthday]
    );
    res.sendStatus(201);
  } catch ({ message }) {
    res.status(500).send(message);
  }
};
var update = async (req, res) => {
  const id = Number(req.params.id);
  const { error } = customerSchema.validate(req.body, { abortEarly: false });
  if (error || id <= 0 || !id)
    return res.status(400).send(error?.details);
  const { name, phone, cpf, birthday } = req.body;
  try {
    const { rowCount } = await database_default.query(
      "SELECT * FROM customers WHERE cpf = $1 AND id <> $2",
      [cpf, id]
    );
    if (rowCount)
      return res.sendStatus(409);
    await database_default.query(
      "UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5",
      [name, phone, cpf, birthday, id]
    );
    res.sendStatus(200);
  } catch ({ message }) {
    res.status(500).send(message);
  }
};

// src/routers/Customers.ts
import { Router as Router3 } from "express";
var BASE_URL3 = "/customers";
var router2 = Router3();
router2.get(BASE_URL3, read3);
router2.post(BASE_URL3, create3);
router2.put(BASE_URL3 + "/:id", update);
router2.get(BASE_URL3 + "/:id", readById);
var Customers_default = router2;

// src/app.ts
dotenv2.config();
var app = express();
app.use(express.json());
app.use(cors());
app.use(Games_default);
app.use(Rentals_default);
app.use(Customers_default);
app.listen(process.env.PORT, () => {
  console.log("Server is running");
});
