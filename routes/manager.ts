import express from "express";
const router = express.Router();

import {
  addUserByAdmin,
  loginAuhority,
  upsertProduct,
} from "../controllers/manager";
import authMiddleware from "../middleware/auth";

router.route("/addUserByAdmin").post(authMiddleware, addUserByAdmin);
router.route("/loginAuthority").post(loginAuhority);
router.route("/upsertProduct").post(authMiddleware, upsertProduct);

export default router;
