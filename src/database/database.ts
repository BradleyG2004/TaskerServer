import 'dotenv/config';
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.MYSQL_HOST,
    port: 3307,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    logging: true,
    synchronize: true,
    entities: [
        "src/database/entities/*.ts"
    ],
    migrations: [
        "src/database/migrations/*.ts"
    ],
    driver: require("mysql2")
});
