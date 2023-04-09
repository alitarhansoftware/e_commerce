import jwt from "jsonwebtoken";
import * as z from "zod";
import dotenv from "dotenv";
import {
  addUserByAdminSchema,
  loginAuthoritySchema,
  productSchema,
} from "../types/types";
import { Request, Response } from "express";
import pool from "../db/connection";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { handleZodAndPostgresError } from "../errors/handle-error";
import { addLog } from "./helpers";

dotenv.config();
const SALT_ROUNDS = 10;

const addUserByAdmin = async (
  req: Request<{}, {}, z.infer<typeof addUserByAdminSchema>>,
  res: Response
) => {
  const validatedData = await addUserByAdminSchema.parse(req.body);
  try {
    const { firstName, lastName, email, phoneNumber, password, appRole } =
      validatedData;

    const userId = uuidv4().slice(0, 10);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const query =
      "INSERT INTO app_authority (user_id, first_name, last_name, app_role, email,  phone_number, password ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *";
    const values = [
      userId,
      firstName,
      lastName,
      appRole,
      email,
      phoneNumber,
      hashedPassword,
    ];

    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();
    const user = {
      userId: result.rows[0].user_id,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
      appRole: result.rows[0].app_role,
    };
    res.status(201).json({ msg: "Sisteme başarıyla kayıt oldunuz.", user });
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(400).json({ msg: "Bu e-posta adresi zaten kayıtlı." });
    }
    res.status(500).send("Bir hata oluştu.");
  }
};

const upsertProduct = async (
  req: Request<{}, {}, z.infer<typeof productSchema>>,
  res: Response
) => {
  const client = await pool.connect();
  const validatedData = await productSchema.parse(req.body);
  try {
    const { productId, price, name, description, stock, updatedBy } =
      validatedData;

    await client.query("BEGIN");

    const result = await client.query(
      "SELECT * FROM product WHERE product_id = $1",
      [productId]
    );

    const isUpdate = result.rows.length === 0 ? false : true;
    const msg = isUpdate
      ? "Ürün başarılı bir şekilde güncellendi."
      : "Ürün başarılı bir şekilde eklendi.";

    if (result.rows.length === 0) {
      await client.query(
        "INSERT INTO product (product_id, price, name, description, stock, updated_by) VALUES ($1, $2, $3, $4, $5, $6)",
        [productId, price, name, description, stock, updatedBy]
      );
    } else {
      await client.query(
        "UPDATE product SET name = COALESCE($3, name), price = COALESCE($2, price), description = COALESCE($4, description), stock = COALESCE($5, stock), updated_by = COALESCE($6, updated_by) WHERE product_id = $1",
        [productId, price, name, description, stock, updatedBy]
      );
    }
    await client.query("COMMIT");
    res.status(200).json({ msg });
    addLog(validatedData.updatedBy, "upsert_product", "app_authority", "200");
  } catch (err) {
    await client.query("ROLLBACK");
    await handleZodAndPostgresError(err, res);
  } finally {
    client.release();
  }
};

const loginAuhority = async (
  req: Request<{}, {}, z.infer<typeof loginAuthoritySchema>>,
  res: Response
) => {
  try {
    const validatedData = await loginAuthoritySchema.parse(req.body);
    const { email, password } = validatedData;

    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM app_authority WHERE email = $1",
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
    const { user_id, app_role, email: userEmail } = user;

    if (!passwordMatch) {
      throw Object.assign(new Error("E posta adresi veya şifre hatalı"), {
        code: 400,
        message: "E posta adresi veya şifre hatalı",
        user_id,
      });
    }

    const token = jwt.sign({ app_role, userEmail }, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    });

    res.status(200).json({ msg: "Başarılı bir şekilde giriş yaptınız", token });
    addLog(user_id, "login", "app_authority", "200");
  } catch (error: any) {
    res.status(error.code).send({ msg: error.message });
    addLog(error.user_id, "login", "app_authority", "400");
  }
};

export { addUserByAdmin, upsertProduct, loginAuhority };
