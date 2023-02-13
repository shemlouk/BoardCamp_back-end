import { Request, Response } from "express";
import { customerSchema } from "../schemas";
import db from "../config/database";
import dayjs from "dayjs";

export const
  read = async (req: Request, res: Response) => {
    try {
      const { rows } = await db.query("SELECT * FROM customers");
      rows.map((r) => (r.birthday = dayjs(r.birthday).format("YYYY-MM-DD")));
      res.send(rows);
    } catch ({ message }) {
      res.status(500).send(message);
    }
  },
  readById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (id <= 0 || !id) return res.sendStatus(400);
    try {
      const { rows, rowCount } = await db.query(
        "SELECT * FROM customers WHERE id = $1",
        [id]
      );
      if (!rowCount) return res.sendStatus(404);
      rows[0].birthday = dayjs(rows[0].birthday).format("YYYY-MM-DD");
      res.send(rows[0]);
    } catch ({ message }) {
      res.status(500).send(message);
    }
  },
  create = async (req: Request, res: Response) => {
    const { error } = customerSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).send(error.details);
    const { name, phone, cpf, birthday } = req.body;
    try {
      const { rowCount } = await db.query(
        "SELECT * FROM customers WHERE cpf = $1",
        [cpf]
      );
      if (rowCount) return res.sendStatus(409);
      await db.query(
        "INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)",
        [name, phone, cpf, birthday]
      );
      res.sendStatus(201);
    } catch ({ message }) {
      res.status(500).send(message);
    }
  },
  update = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { error } = customerSchema.validate(req.body, { abortEarly: false });
    if (error || id <= 0 || !id) return res.status(400).send(error?.details);
    const { name, phone, cpf, birthday } = req.body;
    try {
      const { rowCount } = await db.query(
        "SELECT * FROM customers WHERE cpf = $1 AND id <> $2",
        [cpf, id]
      );
      if (rowCount) return res.sendStatus(409);
      await db.query(
        "UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5",
        [name, phone, cpf, birthday, id]
      );
      res.sendStatus(200);
    } catch ({ message }) {
      res.status(500).send(message);
    }
  };
