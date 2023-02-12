import * as C from "../controllers/customersController";
import { Router } from "express";

const BASE_URL = "/customers";
const router = Router();

router.get(BASE_URL, C.read);
router.post(BASE_URL, C.create);
router.put(BASE_URL + "/:id", C.update);
router.get(BASE_URL + "/:id", C.readById);

export default router;
