import * as C from "../controllers/rentalsController";
import { Router } from "express";

const BASE_URL = "/rentals";
const router = Router();

router.get(BASE_URL, C.read);
router.post(BASE_URL, C.create);
router.post(BASE_URL + "/:id/return", C.returnOne);
router.delete(BASE_URL + "/:id", C.deleteOne);

export default router;
