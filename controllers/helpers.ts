import { z } from "zod";
import pool from "../db/connection";
import { v4 as uuidv4 } from "uuid";

const createOrderId = async () => {
  function getRandomNumber() {
    return Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
  }
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const firstPart = today.slice(0, 8);
  const lastPart = getRandomNumber();
  const result = firstPart + lastPart;
  return result;
};

const controlCreateOrderParameters = async (validatedData: any) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < validatedData.products.length; i++) {
      const productId = validatedData.products[i].productId;
      const query = "SELECT * FROM product WHERE product_id = $1";
      const values = [productId];
      const result = await client.query(query, values);
      if (result.rows.length === 0) {
        throw Object.assign(
          new Error(`'${productId}' nolu ürün sistemde kayıtlı değil.`),
          {
            code: "INVALID_PRODUCT_ORDER",
            message: `'${productId}' nolu ürün sistemde kayıtlı değil.`,
          }
        );
      }
    }
    const query =
      "SELECT * FROM customer_address WHERE user_id = $1 AND address_id = $2";
    const values = [validatedData.userId, validatedData.addressId];
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      throw Object.assign(
        new Error(
          `'${validatedData.addressId}' nolu adres bu kullanıcıya ait değil.`
        ),
        {
          code: "INVALID_ADDRESS_ORDER",
          message: `'${validatedData.addressId}' nolu adres bu kullanıcıya ait değil.`,
        }
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const controlStock = async (validatedData: any) => {
  let productStock = [];
  const client = await pool.connect();
  try {
    for (let i = 0; i < validatedData.products.length; i++) {
      const queryProduct = "SELECT * FROM product WHERE product_id = $1";
      const valuesProduct = [validatedData.products[i].productId];
      const result = await client.query(queryProduct, valuesProduct);
      const availableStock =
        result.rows[0].stock - validatedData.products[i].qty;
      if (availableStock <= 0) {
        throw Object.assign(
          new Error(
            `'${result.rows[0].product_id}' nolu ürün için stok miktarı yetersiz.`
          ),
          {
            code: "INSUFFICIENT_ STOCK_ORDER",
            message: `'${result.rows[0].product_id}'nolu ürün için stok miktarı yetersiz.`,
          }
        );
      } else {
        const producIdAndStock = result.rows.map(({ product_id, stock }) => ({
          product_id,
          stock,
        }));
        productStock.push(...producIdAndStock);
      }
    }
    return productStock;
  } catch (error: any) {
    throw error;
  } finally {
    client.release();
  }
};

const decreaseStock = async (validatedData: any, productStock: any) => {
  const client = await pool.connect();
  try {
    for (let i = 0; i < productStock.length; i++) {
      const determinedProduct = validatedData.products.find((product: any) => {
        return product.productId === productStock[i].product_id;
      });
      const updatedStock = productStock[i].stock - determinedProduct.qty;
      const queryProduct =
        "UPDATE product SET stock = $1 WHERE product_id = $2";
      const valuesProduct = [updatedStock, determinedProduct.productId];
      await client.query(queryProduct, valuesProduct);
    }
  } catch (error: any) {
    throw error;
  } finally {
    client.release();
  }
};

const addLog = async (
  userId: any,
  requestType: any,
  userRole: any,
  responseStatusCode: any
) => {
  const client = await pool.connect();
  try {
    const logId = uuidv4().slice(0, 10);
    const query =
      "INSERT INTO user_activity (log_id , user_id, log_date, request_type, response_status_code, user_role) VALUES ($1, $2, NOW(), $3, $4, $5) RETURNING *";
    const values = [logId, userId, requestType, responseStatusCode, userRole];
    await client.query(query, values);
  } catch (error: any) {
    throw error;
  } finally {
    client.release();
  }
};

export {
  createOrderId,
  controlCreateOrderParameters,
  controlStock,
  decreaseStock,
  addLog,
};
