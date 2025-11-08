import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import { Pool } from "pg";
import path from "path";
import Hashids from "hashids"

dotenv.config();

interface server_config{
    port: number;
};

// web server
export const server: server_config = {
    port: Number(process.env.SERVER_PORT) || 3001,
};

// connection
export const pool = new Pool({
    user: process.env.DB_UNAME,
    host: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
});

export const hashsalt = process.env.HASH_SALT;
console.log(`conf hashsalt: ${hashsalt}`);
export const hashids: Hashids = new Hashids(hashsalt, 20);