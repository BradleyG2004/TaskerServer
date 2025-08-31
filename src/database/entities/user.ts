import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinTable, ManyToMany } from "typeorm";
import { Token } from "./token";
import { List } from "./list";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id!: number

    @Column({
        unique: true
    })
    email!: string

    @Column()
    password!: string

    @Column()
    name!: string

    @Column()
    surname!: string

    @CreateDateColumn({ type: "datetime" })
    createdAt!: Date

    @Column({ default: false })
    isDeleted!: boolean;

    @OneToMany(() => Token, token => token.user)
    tokens!: any[]

    @OneToMany(() => List, ev => ev.user)
    lists!: List[]
    
}