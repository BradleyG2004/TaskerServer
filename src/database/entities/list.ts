import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinTable, ManyToMany, Unique } from "typeorm";
import { Task } from "./task";
import { User } from "./user";

@Entity()
@Unique(["name", "user"])
export class List {

    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @CreateDateColumn({ type: "datetime" })
    createdAt!: Date

    @Column({ default: false })
    isDeleted!: boolean;

    @ManyToOne(() => User, user => user.lists)
    user!: User

    @OneToMany(() => Task, task => task.list)
    tasks!: Task[];
    
}