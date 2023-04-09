import jwt from "jsonwebtoken";
import * as z from "zod";
import dotenv from "dotenv";
import {
  customerRegisterSchema,
  loginCustomerSchema,
  createOrderSchema,
  addAddressSchema,
  getOrdersSchema,
  getOrdersOutputSchema,
  getProductsOutputSchema,
  getOrderWithOrderIdSchema,
} from "../types/types";
import { Request, Response } from "express";
import pool from "../db/connection";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import {
  addLog,
  controlCreateOrderParameters,
  controlStock,
  createOrderId,
  decreaseStock,
} from "./helpers";
import {
  getErrorMessageFromPostgres,
  getErrorMessageFromZodError,
  handleOrderError,
  handleZodAndPostgresError,
} from "../errors/handle-error";

dotenv.config();
const SALT_ROUNDS = 10;

const registerCustomer = async (
  req: Request<{}, {}, z.infer<typeof customerRegisterSchema>>,
  res: Response
) => {
  const client = await pool.connect();
  const validatedData = await customerRegisterSchema.parse(req.body);
  const userId = uuidv4().slice(0, 10);
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      birthDate,
      phoneNumber,
      lastOrderAddressId,
    } = validatedData;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const query =
      "INSERT INTO customer (user_id, first_name, last_name, email, password, birth_date, phone_number, last_order_address_id ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *";
    const values = [
      userId,
      firstName,
      lastName,
      email,
      hashedPassword,
      birthDate,
      phoneNumber,
      lastOrderAddressId,
    ];
    const result = await client.query(query, values);
    client.release();
    const user = {
      first_name: result.rows[0].first_name,
      last_name: result.rows[0].last_name,
    };
    res.status(201).json({ msg: "Sisteme başarıyla kayıt oldunuz.", user });
    addLog(userId, "register", "customer", "201");
  } catch (error: any) {
    await handleZodAndPostgresError(error, res);
    addLog(userId, "register", "customer", "400");
  }
};

const loginCustomer = async (
  req: Request<{}, {}, z.infer<typeof loginCustomerSchema>>,
  res: Response
) => {
  const validatedData = await loginCustomerSchema.parse(req.body);
  try {
    const { email, password } = validatedData;
    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM customer WHERE email = $1",
      [email]
    );
    client.release();
    if (result.rows.length === 0) {
      throw Object.assign(new Error("E posta adresi veya şifre hatalı"), {
        code: 400,
        message: "E posta adresi veya şifre hatalı",
      });
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    const { user_id, email: userEmail } = user;
    if (!passwordMatch) {
      throw Object.assign(new Error("E posta adresi veya şifre hatalı"), {
        code: 400,
        message: "E posta adresi veya şifre hatalı",
        user_id,
      });
    }

    const token = jwt.sign({ user_id, userEmail }, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    });

    res.status(200).json({ msg: "Başarılı bir şekilde giriş yaptınız", token });
    addLog(user_id, "login", "customer", "200");
  } catch (error: any) {
    res.status(error.code).json({ msg: error.message });
    addLog(error.user_id, "login", "customer", "400");
  }
};

const addAddress = async (
  req: Request<{}, {}, z.infer<typeof addAddressSchema>>,
  res: Response
) => {
  const validatedData = await addAddressSchema.parse(req.body);
  try {
    const { userId, city, neighborhood, country, street, description } =
      validatedData;
    const addressId = uuidv4().slice(0, 10);
    const query =
      "INSERT INTO customer_address (address_id, user_id, city, neighborhood, country, street, description ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *";
    const values = [
      addressId,
      userId,
      city,
      neighborhood,
      country,
      street,
      description,
    ];

    const client = await pool.connect();
    await client.query(query, values);
    client.release();
    res
      .status(201)
      .json({ msg: "Sisteme adresiniz başarıyla eklendi." });

    addLog(userId, "add_address", "customer", "201");
  } catch (error: any) {
    addLog(validatedData.userId, "add_address", "customer", "400");
    const zodErrorMessage = getErrorMessageFromZodError(error);
    if (zodErrorMessage) {
      return res.status(400).json({ message: zodErrorMessage });
    }
    const postgresErrorMessage = getErrorMessageFromPostgres(error);
    if (postgresErrorMessage) {
      return res.status(400).json({ message: postgresErrorMessage });
    }
    return res.status(400).json({ message: "Bir hata oluştu." });
  }
};

const getProducts = async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM product");
    client.release();
    const products = result.rows.map(({ product_id, price, name }) => ({
      product_id,
      price,
      name,
    }));
    const returnResult = { msg: "Sistemdeki tüm ürünler.", products };
    res.status(200).json(getProductsOutputSchema.parse(returnResult));
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Bir hata oluştu." });
  }
};

const createOrder = async (
  req: Request<{}, {}, z.infer<typeof createOrderSchema>>,
  res: Response
) => {
  const validatedData = await createOrderSchema.parse(req.body);
  const client = await pool.connect();
  try {
    await controlCreateOrderParameters(validatedData);
    await client.query("BEGIN");
    const productStock = await controlStock(validatedData);
    const orderId = await createOrderId();
    let subId = 1;
    const query =
      "INSERT INTO customer_order (order_id, user_id, total_price, address_id, created_at ) VALUES ($1, $2, $3, $4, NOW()) RETURNING *";
    const values = [
      orderId,
      validatedData.userId,
      validatedData.totalPriceAll,
      validatedData.addressId,
    ];
    await client.query(query, values);

    for (let i = 0; i < validatedData.products.length; i++) {
      const query =
        "INSERT INTO customer_suborder (order_id, sub_id, product_id, qty, total_price ) VALUES ($1, $2, $3, $4, $5) RETURNING *";
      const values = [
        orderId,
        subId,
        validatedData.products[i].productId,
        validatedData.products[i].qty,
        validatedData.products[i].totalPriceSub,
      ];
      await client.query(query, values);
      subId++;
    }

    await decreaseStock(validatedData, productStock);

    await client.query("COMMIT");
    client.release();
    res.status(200).json({ msg: "Siparişiniz başarıyla oluşturuldu." });
    addLog(validatedData.userId, "create_order", "customer", "200");
  } catch (error: any) {
    await client.query("ROLLBACK");
    await handleOrderError(error, res);
    addLog(validatedData.userId, "create_order", "customer", "400");
    throw error;
  }
};

const listOrders = async (
  req: Request<{}, {}, z.infer<typeof getOrdersSchema>>,
  res: Response
) => {
  try {
    const validatedData = getOrdersSchema.parse(req.query);
    const client = await pool.connect();
    const usersAllOrders = await client.query(
      "SELECT * FROM customer_order WHERE user_id = $1",
      [validatedData.userId]
    );
    const orders = usersAllOrders.rows.map((order) => ({
      orderId: order.order_id,
      totalPrice: order.total_price,
    }));

    client.release();
    const result = { msg: "Tüm siparişleriniz", orders };
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Bir hata oluştu." });
  }
};

const getOrderDetailWithOrderId = async (
  req: Request<{}, {}, z.infer<typeof getOrderWithOrderIdSchema>>,
  res: Response
) => {
  try {
    const validatedData = getOrderWithOrderIdSchema.parse(req.query);
    const client = await pool.connect();

    const order = await client.query(
      "SELECT * FROM customer_order co JOIN customer_suborder cs ON co.order_id = cs.order_id WHERE co.order_id = $1;",
      [validatedData.orderId]
    );

    client.release();
    const result = {
      msg: "Sipariş detayınız şu şekildedir.",
      order: order.rows,
    };
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Bir hata oluştu.");
  }
};

const getAllOrdersWithDetail = async (
  req: Request<{}, {}, z.infer<typeof getOrdersSchema>>,
  res: Response
) => {
  const client = await pool.connect();
  try {
    const validatedData = getOrdersSchema.parse(req.query);
    await client.query("BEGIN");
    const usersAllOrders = await client.query(
      "SELECT * FROM customer_order WHERE user_id = $1",
      [validatedData.userId]
    );

    const orderIds = usersAllOrders.rows.map((order) => order.order_id);
    const allOrderResult = [] as any;

    for (let i = 0; i < orderIds.length; i++) {
      const res = await client.query(
        "SELECT * FROM customer_order co JOIN customer_suborder cs ON co.order_id = cs.order_id WHERE co.order_id = $1;",
        [orderIds[i]]
      );
      allOrderResult.push(...res.rows);
    }

    await client.query("COMMIT");
    client.release();
    const result = { msg: "Tüm siparişleriniz", orders: allOrderResult };
    res.status(200).json(getOrdersOutputSchema.parse(result));
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).send("Bir hata oluştu.");
  }
};

export {
  registerCustomer,
  loginCustomer,
  getProducts,
  createOrder,
  addAddress,
  getAllOrdersWithDetail,
  listOrders,
  getOrderDetailWithOrderId,
};
