import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import Games from "./routers/Games";
import Rentals from "./routers/Rentals";
import Customers from "./routers/Customers";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(Games);
app.use(Rentals);
app.use(Customers);

app.listen(process.env.PORT, () => {
  console.log("Server is running");
});
