import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../errors/error";
import dotenv from "dotenv";
dotenv.config();

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: any
) => {
  try {
    const { path } = req.route;
    const authHeader: string | undefined = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "Unauthorized!");
    }
    const token: string = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      if (
        path === "/addUserByAdmin" &&
        decoded.app_role === "Admin" &&
        decoded.userEmail === "admin@ekinoks.com.tr"
      ) {
        next();
      } else if (
        path === "/upsertProduct" &&
        decoded.app_role === "Admin_product" &&
        decoded.userEmail === "adminproduct@ekinoks.com.tr"
      ) {
        next();
      } else if (
        path === "/getProducts" ||
        path === "/createOrder" ||
        path === "/addAddress" ||
        path === "/getAllOrders" ||
        path === "/listOrders" ||
        path === "/getOrderWithOrderId"
      ) {
        next();
      } else {
        throw new HttpError(401, "Unauthorized access!");
      }
    } catch (error) {
      throw new HttpError(401, "Unauthorized access!");
    }
  } catch (error: any) {
    res
      .status(isNaN(error.code) ? 500 : error.code)
      .json(
        `Error occured while executing authentication! Detail: ${
          error.message ?? "No Detail!"
        }`
      );
    return {
      statusCode: isNaN(error.code) ? 500 : error.code,
      message: `Error occured while executing login! Detail: ${
        error.message ?? "No Detail!"
      }`,
    };
  }
};

export default authMiddleware;
