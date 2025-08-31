import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";

@Entity()
export class Token {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    refreshToken!: string;

    @ManyToOne(() => User, user => user.tokens)
    user!: User;
}