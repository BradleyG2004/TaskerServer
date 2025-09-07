import express from "express";
import cors from "cors";
import { initRoutes } from "./handlers/routes";
import { AppDataSource } from "./database/database";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const main = async () => {
    const app = express()
    const port = process.env.PORT || 3000

    try {
        await AppDataSource.initialize()
        console.error("well connected to database")
    } catch (error) {
        console.log(error)
        console.error("Cannot contact database",error)
        process.exit(1)
    }

    // CORS middleware
    app.use(cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    }))
    
    app.use(cookieParser())
    app.use(express.json())
    initRoutes(app)

    app.listen(port, () => {
        console.log(`Server running on port ${port}`)
    })
}

main()