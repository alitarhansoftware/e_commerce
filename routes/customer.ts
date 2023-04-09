import express from "express";
const router = express.Router();

import {
  registerCustomer,
  loginCustomer,
  getProducts,
  createOrder,
  addAddress,
  getAllOrdersWithDetail,
  listOrders,
  getOrderDetailWithOrderId,
} from "../controllers/customer";
import authMiddleware from "../middleware/auth";

router.route("/registerCustomer").post(registerCustomer);
router.route("/loginCustomer").post(loginCustomer);
router.route("/addAddress").post(authMiddleware, addAddress);
router.route("/getProducts").get(authMiddleware, getProducts);
router.route("/createOrder").post(authMiddleware, createOrder);
router.route("/listOrders").get(authMiddleware, listOrders);
router.route("/getAllOrders").get(authMiddleware, getAllOrdersWithDetail);
router
  .route("/getOrderWithOrderId")
  .get(authMiddleware, getOrderDetailWithOrderId);

export default router;
