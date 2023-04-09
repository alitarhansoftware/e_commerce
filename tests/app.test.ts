import { Request, Response } from "express";
import * as uuid from "uuid";
import pool from "../db/connection";
import {
  customerRegisterSchema,
  addUserByAdminSchema,
  loginCustomerSchema,
  addAddressSchema,
  getOrdersSchema,
  getOrderWithOrderIdSchema,
  createOrderSchema,
} from "../types/types";
import {
  addAddress,
  getProducts,
  listOrders,
  loginCustomer,
  registerCustomer,
  getOrderDetailWithOrderId,
  createOrder,
} from "../controllers/customer";
import { addUserByAdmin } from "../controllers/manager";
jest.mock("uuid", () => ({ v4: () => "1234567890" }));

describe("registerCustomer function", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should add a new customer", async () => {
    const mockRequest = {
      body: {
        firstName: "John",
        lastName: "Doe",
        email: "johndoe@example.com",
        password: "password123",
        birthDate: "2000-01-01",
        phoneNumber: "(555)-111-11-11",
        lastOrderAddressId: "123",
      },
    } as unknown as Request<{}, {}, typeof customerRegisterSchema>;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    jest.mock("bcrypt", () => ({
      hash: jest.fn(() => "hashedPassword"),
    }));

    jest.spyOn(pool, "connect").mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            user_id: "1234567890",
            first_name: "John",
            last_name: "Doe",
            password: "hashedPassword",
            birthDate: "2000-01-01",
            phoneNumber: "(555)-111-11-11",
            lastOrderAddressId: "123",
          },
        ],
      }),
      release: jest.fn(),
    }));

    await registerCustomer(mockRequest as any, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      msg: "Sisteme başarıyla kayıt oldunuz.",
      user: {
        first_name: "John",
        last_name: "Doe",
      },
    });
  });
});

describe("addUserByAdmin function", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should add a new manager", async () => {
    const mockRequest = {
      body: {
        firstName: "John",
        lastName: "Doe",
        appRole: "Admin_product",
        email: "johndoe@example.com",
        phoneNumber: "(555)-111-11-11",
        password: "password123",
      },
    } as unknown as Request<{}, {}, typeof addUserByAdminSchema>;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    jest.mock("bcrypt", () => ({
      hash: jest.fn(() => "hashedPassword"),
    }));

    jest.spyOn(pool, "connect").mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            user_id: "1234567890",
            first_name: "John",
            last_name: "Doe",
            app_role: "Admin_product",
            password: "hashedPassword",
            birth_date: "2000-01-01",
            phone_number: "(555)-111-11-11",
            email: "example@outlook.com",
          },
        ],
      }),
      release: jest.fn(),
    }));

    await addUserByAdmin(mockRequest as any, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      msg: "Sisteme başarıyla kayıt oldunuz.",
      user: {
        userId: "1234567890",
        firstName: "John",
        lastName: "Doe",
        appRole: "Admin_product",
      },
    });
  });
});

describe("loginCustomer function", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("email not registered in database ", async () => {
    const mockRequest = {
      body: {
        email: "johndoe@example.com",
        password: "password123",
      },
    } as unknown as Request<{}, {}, typeof loginCustomerSchema>;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    jest.spyOn(pool, "connect").mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({
        rows: [],
      }),
      release: jest.fn(),
    }));

    jest.mock("jsonwebtoken", () => ({
      sign: jest.fn(() => "jwtToken"),
    }));

    await loginCustomer(mockRequest as any, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      msg: "E posta adresi veya şifre hatalı",
    });
  });
});

describe("addAddress function", () => {
  beforeEach(() => {
    jest.mock("uuid", () => ({ v4: () => "1234567890" }));
    // jest.restoreAllMocks();
  });

  it("should add a new address", async () => {
    const mockRequest = {
      body: {
        userId: "John",
        city: "CITY",
        neighborhood: "NEIGHBORHOOD",
        country: "COUNTRY",
        street: "STREET",
        description: "DESCRIPTION",
      },
    } as unknown as Request<{}, {}, typeof addAddressSchema>;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    //jest.spyOn(uuid, "v4").mockReturnValue("1234567890");
    jest.spyOn(pool, "connect").mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            address_id: "1234567890",
          },
        ],
      }),
      release: jest.fn(),
    }));

    await addAddress(mockRequest as any, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      msg: "Sisteme adresiniz başarıyla eklendi.",
    });
  });
});

describe("getProducts function", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("get all products", async () => {
    const mockRequest = {
      body: {},
    } as unknown as Request<{}, {}>;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    jest.spyOn(pool, "connect").mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            product_id: "product_1",
            price: "20.00",
            name: "product_1_name",
            stock: 29,
            created_at: "2023-04-07",
            updated_by: "513a25eb-4",
          },
          {
            product_id: "product_2",
            price: "20.00",
            name: "product_2_name",
            stock: 4,
            created_at: "2023-04-07",
            updated_by: "513a25eb-4",
          },
        ],
      }),
      release: jest.fn(),
    }));

    await getProducts(mockRequest as any, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      msg: "Sistemdeki tüm ürünler.",
      products: [
        {
          product_id: "product_1",
          price: "20.00",
          name: "product_1_name",
        },
        {
          product_id: "product_2",
          price: "20.00",
          name: "product_2_name",
        },
      ],
    });
  });
});

describe("listOrders function", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("list customer orders", async () => {
    const mockRequest = {
      query: {
        userId: "123",
      },
    } as unknown as Request<{}, {}, typeof getOrdersSchema>;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    jest.spyOn(pool, "connect").mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            order_id: "202304076925",
            total_price: "270.00",
            qty: "20",
            subId: 2,
          },
          {
            order_id: "202304077680",
            total_price: "130.00",
            qty: "20",
            subId: 3,
          },
          {
            order_id: "202304077419",
            total_price: "30.00",
            qty: "20",
            subId: 1,
          },
          {
            order_id: "202304071227",
            total_price: "30.00",
            qty: "20",
            subId: 2,
          },
        ],
      }),
      release: jest.fn(),
    }));

    await listOrders(mockRequest as any, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      msg: "Tüm siparişleriniz",
      orders: [
        {
          orderId: "202304076925",
          totalPrice: "270.00",
        },
        {
          orderId: "202304077680",
          totalPrice: "130.00",
        },
        {
          orderId: "202304077419",
          totalPrice: "30.00",
        },
        {
          orderId: "202304071227",
          totalPrice: "30.00",
        },
      ],
    });
  });
});

describe("getOrderDetailWithOrderId function", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("get order with orderId", async () => {
    const mockRequest = {
      query: {
        orderId: "123",
      },
    } as unknown as Request<{}, {}, typeof getOrderWithOrderIdSchema>;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    jest.spyOn(pool, "connect").mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            order_id: "202304077680",
            user_id: "90f6126b-9",
            total_price: "30.00",
            address_id: "37e4190e-e",
            created_at: "2023-04-07T15:22:45.945Z",
            sub_id: 1,
            product_id: "product_1",
            qty: 3,
          },
          {
            order_id: "202304077680",
            user_id: "90f6126b-9",
            total_price: "100.00",
            address_id: "37e4190e-e",
            created_at: "2023-04-07T15:22:45.945Z",
            sub_id: 2,
            product_id: "product_2",
            qty: 5,
          },
        ],
      }),
      release: jest.fn(),
    }));

    await getOrderDetailWithOrderId(mockRequest as any, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      msg: "Sipariş detayınız şu şekildedir.",
      order: [
        {
          order_id: "202304077680",
          user_id: "90f6126b-9",
          total_price: "30.00",
          address_id: "37e4190e-e",
          created_at: "2023-04-07T15:22:45.945Z",
          sub_id: 1,
          product_id: "product_1",
          qty: 3,
        },
        {
          order_id: "202304077680",
          user_id: "90f6126b-9",
          total_price: "100.00",
          address_id: "37e4190e-e",
          created_at: "2023-04-07T15:22:45.945Z",
          sub_id: 2,
          product_id: "product_2",
          qty: 5,
        },
      ],
    });
  });
});