import { Request, Response } from "express";
import { rentalSchema } from "../schemas";
import db from "../config/database";
import dayjs from "dayjs";

export const
  read = async (req: Request, res: Response) => {
    try {
      const { rows } = await db.query("SELECT * FROM rentals");
      const result = await Promise.all(
        rows.map(async (r) => {
          const game = await db.query(
            "SELECT id, name FROM games WHERE id = $1",
            [r.gameId]
          );
          const customer = await db.query(
            "SELECT id, name FROM customers WHERE id = $1",
            [r.customerId]
          );
          r.customer = customer.rows[0];
          r.game = game.rows[0];
          r.rentDate = dayjs(r.rentDate).format("YYYY-MM-DD");
          r.returnDate =
            r.returnDate && dayjs(r.returnDate).format("YYYY-MM-DD");
          return r;
        })
      );
      res.send(result);
    } catch ({ message }) {
      res.status(500).send(message);
    }
  },
  create = async (req: Request, res: Response) => {
    const { error } = rentalSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).send(error.details);
    const { customerId, gameId, daysRented } = req.body;
    try {
      const customer = await db.query("SELECT * FROM customers WHERE id = $1", [
        customerId,
      ]);
      const game = await db.query("SELECT * FROM games WHERE id = $1", [
        gameId,
      ]);
      const { rowCount } = await db.query(
        'SELECT * FROM rentals WHERE "gameId" = $1',
        [gameId]
      );
      if (
        !customer.rowCount ||
        !game.rowCount ||
        game.rows[0].stockTotal <= rowCount
      )
        return res.sendStatus(400);
      await db.query(
        'INSERT INTO rentals ("customerId", "gameId", "daysRented", "rentDate", "originalPrice", "returnDate", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          customerId,
          gameId,
          daysRented,
          new Date(),
          game.rows[0].pricePerDay * daysRented,
          null,
          null,
        ]
      );
      res.sendStatus(201);
    } catch ({ message }) {
      res.status(500).send(message);
    }
  },
  returnOne = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
      const { rows } = await db.query("SELECT * FROM rentals WHERE id = $1", [
        id,
      ]);
      const rental = rows[0];
      if (!rental) return res.sendStatus(404);
      if (rental.returnDate) return res.sendStatus(400);
      const dayToReturn = dayjs(rental.rentDate).add(rental.daysRented, "day");
      const delayDays = Math.max(dayjs().diff(dayToReturn, "day"), 0);
      await db.query(
        'UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3',
        [new Date(), delayDays * rental.originalPrice, id]
      );
      res.sendStatus(200);
    } catch ({ message }) {
      res.status(500).send(message);
    }
  },
  deleteOne = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
      const { rows } = await db.query("SELECT * FROM rentals WHERE id = $1", [
        id,
      ]);
      if (!rows[0]) return res.sendStatus(404);
      if (!rows[0].returnDate) return res.sendStatus(400);
      await db.query("DELETE FROM rentals WHERE id = $1", [id]);
      res.sendStatus(200);
    } catch ({ message }) {
      res.status(500).send(message);
    }
  };
