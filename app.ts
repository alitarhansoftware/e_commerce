import dotenv from "dotenv";
dotenv.config();

import express from "express";

const app = express();

import customerRouter from "./routes/customer";
import managerRouter from "./routes/manager";
import notFoundMiddleware from "./middleware/not-found";

// middleware
app.use(express.json());
app.use("/api/customer", customerRouter);
app.use("/api/authority", managerRouter);

app.use(notFoundMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error: any) {
    return {
      statusCode: 500,
      message: `Server error! Detail: ${error.message ?? "No Detail!"}`,
    };
  }
};

start();
