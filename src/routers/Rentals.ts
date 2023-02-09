import { Router } from "express";

const BASE_URL = "/rentals";
const router = Router();

router.get(BASE_URL);
router.post(BASE_URL);
router.post(BASE_URL + "/:id/return");
router.delete(BASE_URL + "/:id");

export default router;
