import { Router } from "express";

const BASE_URL = "/customers";
const router = Router();

router.get(BASE_URL);
router.get(BASE_URL + "/:id");
router.put(BASE_URL);
router.post(BASE_URL);

export default router;
