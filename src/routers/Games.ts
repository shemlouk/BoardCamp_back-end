import { Router } from "express";

const BASE_URL = "/games";
const route = Router();

route.get(BASE_URL);
route.post(BASE_URL);

export default route;
