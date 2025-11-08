import express, {Express, Request, Response} from "express";
import cors from "cors";
import { server, pool } from "./config/config";
import { fileURLToPath } from "url";


import path from "path";

// routers
import userRoute from "./routers/userRoute";
import cartRoute from "./routers/cartRoute";
import productRoute from "./routers/productRoute";
import authRoute from "./routers/authRoute";
import orderRoute from "./routers/orderRoute";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
app.use(cors());
app.use(express.json());

app.use("/img", express.static(path.join(__dirname, "img")));

// Routers 
app.use("/user", userRoute);
app.use("/cart", cartRoute);
app.use("/product", productRoute);
app.use("/auth", authRoute);
app.use("/order", orderRoute);

// connect to database
pool.connect()
    .then(() => console.log("Database Connected"))
    .catch((err: Error) => console.error("DB connection error: ", err));
// initailize server
app.listen(server.port, ()=> console.log(`Server running at port ${server.port}`));
