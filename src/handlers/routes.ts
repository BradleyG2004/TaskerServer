import { hash, compare } from "bcrypt";
import { verify, sign } from "jsonwebtoken";
import { User } from "../database/entities/user";
import { Token } from "../database/entities/token";
import { AppDataSource } from "../database/database";
import express, { Request, Response } from "express";
import { createUserValidation, logUserValidation } from "./validators/user-validator";
import { userUseCase } from "../domain/user-usecase"
import { notAuthenticated } from "./middleware/notAuthenticated";
import { isAuthenticated } from "./middleware/Authenticated";


export const initRoutes = (app: express.Express) => {
    const userUC = new userUseCase(AppDataSource);

    app.post('/', async (req: Request, res: Response) => {
        console.log("Home")
        return
    }
    )

    app.post('/refresh-token',isAuthenticated, async (req: Request, res: Response) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) return res.status(401).json({ error: "No refresh token provided" });

            const savedToken = await AppDataSource.getRepository(Token).findOne({
                where: { refreshToken },
                relations: ["user"]
            });
            if (!savedToken) return res.status(403).json({ error: "Invalid refresh token" });

            const decoded: any = verify(refreshToken, process.env.JWT_REFRESH_SECRET!);

            const newAccessToken = sign(
                { userId: savedToken.user.id, email: savedToken.user.email },
                process.env.JWT_SECRET!,
                { expiresIn: '15m' }
            );

            res.json({ accessToken: newAccessToken });

        } catch (error) {
            console.log(error);
            res.status(403).json({ error: "Could not refresh token" });
        }
    });

    app.get("/auth-refresh", async (req: Request, res: Response) => {
        try {
          const refreshToken = req.cookies.refreshToken;
      
          if (!refreshToken) {
            return res.status(401).json({ error: "Not authenticated" });
          }
      
          const tokenRepo = AppDataSource.getRepository(Token);
          const userRepo = AppDataSource.getRepository(User);
      
          // Vérifier que le refreshToken existe en DB
          const storedToken = await tokenRepo.findOne({
            where: { refreshToken },
            relations: ["user"],
          });
      
          if (!storedToken) {
            return res.status(401).json({ error: "Invalid token" });
          }
      
          // Vérifier que le refreshToken est valide
          const refreshSecret = process.env.JWT_REFRESH_SECRET!;
          try {
            const payload: any = verify(refreshToken, refreshSecret);
      
            // On peut retourner les infos utiles de l'utilisateur
            const user = await userRepo.findOneBy({ id: payload.userId });
            if (!user) {
              return res.status(404).json({ error: "User not found" });
            }
      
            res.status(200).json({
              user: {
                id: user.id,
                name: user.name,
                surname: user.surname,
                email: user.email,
              },
            });
          } catch (err) {
            return res.status(401).json({ error: "Invalid token" });
          }
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
        }
      });

    app.post('/signup', notAuthenticated, async (req: Request, res: Response) => {
        try {
            const validationResult = createUserValidation.validate(req.body);
            if (validationResult.error) {
                res.status(400).json(validationResult.error.details);
                return;
            }

            const createUserRequest = validationResult.value;

            const createdUser = await userUC.createUser(createUserRequest);

            if (typeof createdUser === 'string') {
                res.status(404).json(`${createdUser}`);
                return;
            }

            res.status(201).json(createdUser);
        } catch (error) {
            console.log(error);
            res.status(500).json("Internal error");
        }
    });
    

    app.post('/login', notAuthenticated, async (req: Request, res: Response) => {
        try {

            const validationResult = logUserValidation.validate(req.body)
            if (validationResult.error) {
                res.status(400).json(validationResult.error.details)
                return
            }
            const logUserRequest = validationResult.value

            const loggedUser = await userUC.LogUser(logUserRequest);

            if (typeof loggedUser === 'string') {
                res.status(400).json({ error: "Invalid Credentials" })
                return
            }

            res.cookie("refreshToken", loggedUser.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
            });

            res.status(200).json({ accessToken: loggedUser.accessToken, user: loggedUser.user, message: "authenticated ✅" });

        } catch (error) {
            console.log(error)
            res.status(500).json({ "error": "internal error retry later" })
            return
        }
    })

    app.post('/logout', isAuthenticated, async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await AppDataSource.getRepository(Token).delete({ refreshToken });
        }
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logged out ✅" });
    });

}
