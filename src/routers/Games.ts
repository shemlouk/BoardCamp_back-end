import { Router } from "express";

const route = Router();

route.get("/games");
route.post("/games");

export default route;
