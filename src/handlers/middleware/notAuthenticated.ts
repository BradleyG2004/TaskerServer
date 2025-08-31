import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

export const notAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return next(); // pas de token → il peut s’inscrire/se connecter
    }

    const token = authHeader.split(" ")[1]; // format "Bearer <token>"
    if (!token) {
      return next();
    }

    const decoded = verify(token, process.env.JWT_SECRET!);

    if (decoded) {
      return res.status(403).json({ error: "Already authenticated" });
    }
  } catch (error) {
    // Si le token est invalide ou expiré, on le traite comme non connecté
    return next();
  }
};
