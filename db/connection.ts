import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ekinoks",
  password: "1997989900dD.",
  port: 5432,
});

export default pool;
