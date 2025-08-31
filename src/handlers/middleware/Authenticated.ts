import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(403).json({ error: "Not authenticated" });
        }

        const token = authHeader.split(" ")[1]; // format "Bearer <token>"
        if (!token) {
            return res.status(403).json({ error: "Not authenticated" });
        }

        const decoded = verify(token, process.env.JWT_SECRET!);

        if (!decoded) {
            return res.status(403).json({ error: "Not authenticated" });
        }
        return next();

    } catch (error) {
        // Si le token est invalide ou expiré, on le traite comme non connecté
        return res.status(403).json({ error: "Not authenticated" });
    }
};
