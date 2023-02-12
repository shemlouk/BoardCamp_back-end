import { read, create } from "../controllers/gamesController";
import { Router } from "express";

const BASE_URL = "/games";
const route = Router();

route.get(BASE_URL, read);
route.post(BASE_URL, create);

export default route;
