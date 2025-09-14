import { hash, compare } from "bcrypt";
import { verify, sign } from "jsonwebtoken";
import { User } from "../database/entities/user";
import { Token } from "../database/entities/token";
import { List } from "../database/entities/list";
import { Task } from "../database/entities/task";
import { AppDataSource } from "../database/database";
import express, { Request, Response } from "express";
import { createUserValidation, logUserValidation } from "./validators/user-validator";
import { createListValidation } from "./validators/list-validator";
import { userUseCase } from "../domain/user-usecase"
import { notAuthenticated } from "./middleware/notAuthenticated";
import { isAuthenticated } from "./middleware/Authenticated";


export const initRoutes = (app: express.Express) => {
    const userUC = new userUseCase(AppDataSource);

    app.post('/', async (req: Request, res: Response) => {
        console.log("I'am the API and I am good !")
        return
    }
    )

    app.get('/check_refresh', async (req: Request, res: Response) => {
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

            // Vérifier que le refreshToken est encore valide
            const refreshSecret = process.env.JWT_REFRESH_SECRET!;
            try {
                const payload: any = verify(refreshToken, refreshSecret);

                // On peut retourner les infos utiles de l'utilisateur
                const user = await userRepo.findOneBy({ id: payload.userId });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                const accessToken = sign({ userId: user.id, email: user.email, name: user.name, surname: user.surname }, process.env.JWT_SECRET!, { expiresIn: '15m' });
                console.log(user)
                res.status(200).json({ user: { id: user.id, name: user.name, surname: user.surname, email: user.email, }, accessToken: accessToken });
            } catch (err) {
                // Le refresh token est expiré ou invalide
                // Marquer le token comme désactivé au lieu de le supprimer
                storedToken.refreshToken = "DEACTIVATED";
                await tokenRepo.save(storedToken);
                return res.status(401).json({ error: "Refresh token expired. Please login again." });
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

    app.patch('/token', async (req: Request, res: Response) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            
            if (!refreshToken) {
                return res.status(400).json({ 
                    error: "No refresh token provided" 
                });
            }

            const tokenRepo = AppDataSource.getRepository(Token);
            const token = await tokenRepo.findOne({
                where: { refreshToken },
            });

            if (!token) {
                return res.status(404).json({ 
                    error: "Refresh token not found" 
                });
            }

            // Mark token as deactivated
            token.refreshToken = "DEACTIVATED";
            await tokenRepo.save(token);

            res.status(200).json({ 
                message: "Token successfully invalidated" 
            });
        } catch (error) {
            console.error("Error invalidating token:", error);
            res.status(500).json({ 
                error: "Internal server error" 
            });
        }
    })




    //list gestion
    app.get('/list', isAuthenticated,async (req: Request, res: Response) => {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({ error: "Not authenticated" });
            }

            const tokenRepo = AppDataSource.getRepository(Token);
            const userRepo = AppDataSource.getRepository(User);
            const listRepo = AppDataSource.getRepository(List);

            // Vérifier que le refreshToken existe en DB
            const storedToken = await tokenRepo.findOne({
                where: { refreshToken },
                relations: ["user"],
            });

            if (!storedToken) {
                return res.status(401).json({ error: "Invalid token" });
            }

            // Vérifier que le refreshToken est encore valide
            const refreshSecret = process.env.JWT_REFRESH_SECRET!;
            try {
                const payload: any = verify(refreshToken, refreshSecret);

                // Récupérer l'utilisateur lié à ce token
                const user = await userRepo.findOneBy({ id: payload.userId });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }

                // Récupérer toutes les listes de cet utilisateur (non supprimées)
                const userLists = await listRepo.find({
                    where: { 
                        user: { id: user.id },
                        isDeleted: false 
                    },
                    relations: ["tasks"],
                    order: { createdAt: "DESC" }
                });

                res.status(200).json({ 
                    lists: userLists,
                    message: "Lists retrieved successfully" 
                });

            } catch (err) {
                // Le refresh token est expiré ou invalide
                return res.status(401).json({ error: "Please login again." });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    app.post('/list', isAuthenticated, async (req: Request, res: Response) => {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({ error: "Not authenticated" });
            }

            // Validation des données d'entrée
            const validationResult = createListValidation.validate(req.body);
            if (validationResult.error) {
                return res.status(400).json({ error: validationResult.error.details });
            }

            const createListRequest = validationResult.value;

            const tokenRepo = AppDataSource.getRepository(Token);
            const userRepo = AppDataSource.getRepository(User);
            const listRepo = AppDataSource.getRepository(List);

            // Vérifier que le refreshToken existe en DB
            const storedToken = await tokenRepo.findOne({
                where: { refreshToken },
                relations: ["user"],
            });

            if (!storedToken) {
                return res.status(401).json({ error: "Invalid token" });
            }

            // Vérifier que le refreshToken est encore valide
            const refreshSecret = process.env.JWT_REFRESH_SECRET!;
            try {
                const payload: any = verify(refreshToken, refreshSecret);

                // Récupérer l'utilisateur lié à ce token
                const user = await userRepo.findOneBy({ id: payload.userId });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }

                // Vérifier si une liste avec ce nom existe déjà pour cet utilisateur
                const existingList = await listRepo.findOne({
                    where: { 
                        name: createListRequest.name,
                        user: { id: user.id },
                        isDeleted: false 
                    }
                });

                if (existingList) {
                    return res.status(409).json({ error: "A list with this name already exists" });
                }

                // Créer la nouvelle liste
                const newList = listRepo.create({
                    name: createListRequest.name.toLowerCase(),
                    user: user,
                    isDeleted: false
                });

                const savedList = await listRepo.save(newList);

                res.status(201).json({ 
                    list: savedList,
                    message: "List created successfully" 
                });

            } catch (err) {
                // Le refresh token est expiré ou invalide
                return res.status(401).json({ error: "Please login again." });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    })

    app.patch('/list', isAuthenticated, async (req: Request, res: Response) => {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({ error: "Not authenticated" });
            }

            const { id } = req.body as { id?: number };
            if (!id) {
                return res.status(400).json({ error: "Missing required field: id" });
            }

            const tokenRepo = AppDataSource.getRepository(Token);
            const userRepo = AppDataSource.getRepository(User);
            const listRepo = AppDataSource.getRepository(List);

            const storedToken = await tokenRepo.findOne({
                where: { refreshToken },
                relations: ["user"],
            });

            if (!storedToken) {
                return res.status(401).json({ error: "Invalid token" });
            }

            const refreshSecret = process.env.JWT_REFRESH_SECRET!;
            try {
                const payload: any = verify(refreshToken, refreshSecret);

                const user = await userRepo.findOneBy({ id: payload.userId });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }

                const list = await listRepo.findOne({
                    where: {
                        id: id,
                        user: { id: user.id },
                        isDeleted: false
                    }
                });

                if (!list) {
                    return res.status(404).json({ error: "List not found or access denied" });
                }

                list.isDeleted = true;
                await listRepo.save(list);

                res.status(200).json({ message: "List dropped successfully" });

            } catch (err) {
                return res.status(401).json({ error: "Please login again." });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    })




    //task gestion
    app.post('/task', isAuthenticated, async (req: Request, res: Response) => {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({ error: "Not authenticated" });
            }

            // Validation des données d'entrée
            const { shortDesc, longDesc, deadline, listId } = req.body;

            if (!shortDesc || !deadline || !listId) {
                return res.status(400).json({ error: "Missing required fields: shortDesc, deadline, listId" });
            }

            const tokenRepo = AppDataSource.getRepository(Token);
            const userRepo = AppDataSource.getRepository(User);
            const listRepo = AppDataSource.getRepository(List);
            const taskRepo = AppDataSource.getRepository(Task);

            // Vérifier que le refreshToken existe en DB
            const storedToken = await tokenRepo.findOne({
                where: { refreshToken },
                relations: ["user"],
            });

            if (!storedToken) {
                return res.status(401).json({ error: "Invalid token" });
            }

            // Vérifier que le refreshToken est encore valide
            const refreshSecret = process.env.JWT_REFRESH_SECRET!;
            try {
                const payload: any = verify(refreshToken, refreshSecret);

                // Récupérer l'utilisateur lié à ce token
                const user = await userRepo.findOneBy({ id: payload.userId });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }

                // Vérifier que la liste existe et appartient à l'utilisateur
                const list = await listRepo.findOne({
                    where: { 
                        id: listId,
                        user: { id: user.id },
                        isDeleted: false 
                    }
                });

                if (!list) {
                    return res.status(404).json({ error: "List not found or access denied" });
                }

                // Créer la nouvelle tâche
                const newTask = taskRepo.create({
                    shortDesc: shortDesc,
                    longDesc: longDesc || "",
                    Deadline: new Date(deadline),
                    list: list,
                    isAchieved: false,
                    isDeleted: false
                });

                const savedTask = await taskRepo.save(newTask);

                res.status(201).json({ 
                    task: savedTask,
                    message: "Task created successfully" 
                });

            } catch (err) {
                // Le refresh token est expiré ou invalide
                return res.status(401).json({ error: "Please login again." });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    })

    app.get('/list/:id/tasks', isAuthenticated, async (req: Request, res: Response) => {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({ error: "Not authenticated" });
            }

            const listId = parseInt(req.params.id);
            if (!listId) {
                return res.status(400).json({ error: "Invalid list ID" });
            }

            const tokenRepo = AppDataSource.getRepository(Token);
            const userRepo = AppDataSource.getRepository(User);
            const listRepo = AppDataSource.getRepository(List);
            const taskRepo = AppDataSource.getRepository(Task);

            const storedToken = await tokenRepo.findOne({
                where: { refreshToken },
                relations: ["user"],
            });

            if (!storedToken) {
                return res.status(401).json({ error: "Invalid token" });
            }

            const refreshSecret = process.env.JWT_REFRESH_SECRET!;
            try {
                const payload: any = verify(refreshToken, refreshSecret);

                const user = await userRepo.findOneBy({ id: payload.userId });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }

                // Verify the list belongs to the user
                const list = await listRepo.findOne({
                    where: {
                        id: listId,
                        user: { id: user.id },
                        isDeleted: false
                    }
                });

                if (!list) {
                    return res.status(404).json({ error: "List not found or access denied" });
                }

                // Fetch all tasks for this list
                const tasks = await taskRepo.find({
                    where: {
                        list: { id: listId },
                        isDeleted: false
                    },
                    order: { createdAt: "DESC" }
                });

                res.status(200).json({ 
                    tasks: tasks,
                    message: "Tasks retrieved successfully" 
                });

            } catch (err) {
                return res.status(401).json({ error: "Please login again." });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    })

    app.patch('/task/:id', isAuthenticated, async (req: Request, res: Response) => {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({ error: "Not authenticated" });
            }

            const taskId = parseInt(req.params.id);
            const { isAchieved, isDeleted } = req.body as { isAchieved?: boolean, isDeleted?: boolean };

            if (!taskId) {
                return res.status(400).json({ error: "Invalid task ID" });
            }
            if (typeof isAchieved === 'undefined' && typeof isDeleted === 'undefined') {
                return res.status(400).json({ error: "Provide isAchieved or isDeleted in body" });
            }

            const tokenRepo = AppDataSource.getRepository(Token);
            const userRepo = AppDataSource.getRepository(User);
            const taskRepo = AppDataSource.getRepository(Task);

            const storedToken = await tokenRepo.findOne({
                where: { refreshToken },
                relations: ["user"],
            });

            if (!storedToken) {
                return res.status(401).json({ error: "Invalid token" });
            }

            const refreshSecret = process.env.JWT_REFRESH_SECRET!;
            try {
                const payload: any = verify(refreshToken, refreshSecret);

                const user = await userRepo.findOneBy({ id: payload.userId });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }

                // Find the task and verify it belongs to the user
                const task = await taskRepo.findOne({
                    where: {
                        id: taskId,
                        isDeleted: false
                    },
                    relations: ["list", "list.user"]
                });

                if (!task || task.list.user.id !== user.id) {
                    return res.status(404).json({ error: "Task not found or access denied" });
                }

                // Update fields conditionally
                if (typeof isAchieved === 'boolean') {
                    task.isAchieved = isAchieved;
                }
                if (typeof isDeleted === 'boolean') {
                    task.isDeleted = isDeleted;
                }
                const saved = await taskRepo.save(task);

                res.status(200).json({ 
                    task: saved,
                    message: "Task updated successfully" 
                });

            } catch (err) {
                return res.status(401).json({ error: "Please login again." });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    })



}