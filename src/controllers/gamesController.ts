import { Request, Response } from "express";
import { gameSchema } from "../schemas";
import db from "../config/database";

export const
  read = async (req: Request, res: Response) => {
    try {
      const { rows } = await db.query("SELECT * FROM games");
      res.send(rows);
    } catch ({ message }) {
      res.status(500).send(message);
    }
  },
  create = async (req: Request, res: Response) => {
    const { error } = gameSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).send(error.details);
    const { name, image, stockTotal, pricePerDay } = req.body;
    try {
      const { rowCount } = await db.query(
        "SELECT name FROM games WHERE name = $1",
        [name]
      );
      if (rowCount) return res.sendStatus(409);
      await db.query(
        'INSERT INTO games (name, image, "stockTotal", "pricePerDay") VALUES ($1, $2, $3, $4)',
        [name, image, stockTotal, pricePerDay]
      );
      res.sendStatus(201);
    } catch ({ message }) {
      res.status(500).send(message);
    }
  };
