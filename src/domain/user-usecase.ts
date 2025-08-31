import { DataSource } from "typeorm";
import { hash, compare } from "bcrypt";
import { verify, sign } from "jsonwebtoken";
import { User } from "../database/entities/user";
import { Token } from "../database/entities/token";

export interface UserToCreate {
    email: string;
    name: string;
    surname: string;
    password: string;
}

export interface UserToLog {
    email: string;
    password: string;
}

export class userUseCase {

    constructor(private readonly db: DataSource) { }

    async createUser(userToCreate: UserToCreate): Promise<User | string> {
        const userRepo = this.db.getRepository(User);

        // Check if the email is already in use
        const existingUser = await userRepo.findOne({ where: { email: userToCreate.email } });
        if (existingUser) {
            return "Email is already in use!";
        }

        // Create a new user entity
        const newUser = new User();
        newUser.email = userToCreate.email;
        newUser.name = userToCreate.name;
        newUser.surname = userToCreate.surname;
        newUser.password = await hash(userToCreate.password, 10);

        // Save the new user to the database
        const createdUser = await userRepo.save(newUser);
        return createdUser;
    }

    async LogUser(userToLog: UserToLog): Promise<User | string | any> {
        const userRepo = this.db.getRepository(User);
        const tokenRepo = this.db.getRepository(Token);

        const user = await userRepo.findOne({
            where: {
                email: userToLog.email,
                isDeleted: false
            }
        })

        if (!user) {
            return "Invalid Credentials"
        }

        // valid password for this other
        const isValid = await compare(userToLog.password, user.password);
        if (!isValid) {
            return "Invalid Credentials"
        }

        const secret = process.env.JWT_SECRET!;
        const refreshSecret = process.env.JWT_REFRESH_SECRET!;

        console.log(secret)
        console.log(refreshSecret)
        // generate jwt
        const accessToken = sign({ userId: user.id, email: user.email, name: user.name, surname: user.surname }, secret, { expiresIn: '15m' });
        const refreshToken = sign({ userId: user.id, email: user.email, name: user.name, surname: user.surname }, refreshSecret, { expiresIn: '7d' });

        // store un token pour un other
        await tokenRepo.save({ refreshToken, user })

        return { accessToken, refreshToken, user}
    }
}
