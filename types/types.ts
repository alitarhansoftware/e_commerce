import * as z from "zod";

export const customerRegisterSchema = z.object({
  firstName: z.string().min(3).max(15),
  lastName: z.string().max(30),
  lastOrderAddressId: z.string().optional(),
  birthDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  email: z.string().email(),
  phoneNumber: z.string().regex(/^\(\d{3}\)-\d{3}-\d{2}-\d{2}$/),
  password: z.string().min(4).max(30),
});

export const loginCustomerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4).max(30),
});

export const addUserByAdminSchema = z.object({
  firstName: z.string().min(3).max(15),
  lastName: z.string().max(30),
  appRole: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().regex(/^\(\d{3}\)-\d{3}-\d{2}-\d{2}$/),
  password: z.string().min(4).max(30),
});

export const loginAuthoritySchema = z.object({
  email: z.string().email(),
  password: z.string().min(4).max(30),
});

export const productSchema = z.object({
  productId: z.string().max(12),
  price: z.number(),
  name: z.string().max(20),
  description: z.string().max(100).optional(),
  stock: z.number(),
  created_at: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  updatedBy: z.string().max(10).optional(),
});

export const createOrderSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string().max(12),
      qty: z.number(),
      totalPriceSub: z.number(),
    })
  ),
  userId: z.string().max(10),
  addressId: z.string(),
  totalPriceAll: z.number(),
});

export const addAddressSchema = z.object({
  userId: z.string().max(10),
  city: z.string(),
  neighborhood: z.string(),
  country: z.string(),
  street: z.string(),
  description: z.string().optional(),
});

export const getOrdersSchema = z.object({
  userId: z.string().max(10),
});

export const getOrderWithOrderIdSchema = z.object({
  orderId: z.string().max(12),
});

const ordersOutput = z.array(
  z.object({
    order_id: z.string().max(12),
    user_id: z.string(),
    total_price: z.string(),
    address_id: z.string(),
    created_at: z.date(),
    sub_id: z.number(),
    product_id: z.string(),
    qty: z.number(),
  })
);
export const getOrdersOutputSchema = z.object({
  msg: z.string(),
  orders: ordersOutput,
});

const productsOutput = z.array(
  z.object({
    product_id: z.string().max(12),
    price: z.string(),
    name: z.string(),
  })
);
export const getProductsOutputSchema = z.object({
  products: productsOutput,
  msg: z.string(),
});
