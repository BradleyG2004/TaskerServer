import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinTable, ManyToMany } from "typeorm";
import { List } from "./list";

@Entity()
export class Task {

    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    shortDesc!: string

    @Column({ default: "" })
    longDesc!: string

    @Column({ type: "datetime" })
    Deadline!: Date

    @Column({ default: false })
    isAchieved!: boolean;

    @CreateDateColumn({ type: "datetime" })
    createdAt!: Date

    @Column({ default: false })
    isDeleted!: boolean;

    @ManyToOne(() => List, list => list.tasks)
    list!: List
    
}