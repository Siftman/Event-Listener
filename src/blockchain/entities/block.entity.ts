import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Transfer } from "./transfer.entity";


@Entity('blocks')
export class Block {
    @PrimaryColumn('bigint')
    number: number;

    @Column()
    hash: string;

    @Column()
    parentHash: string;

    @Column('bigint')
    timestamp: number;

    @Column()
    miner: string;

    @Column('numeric')
    gasUsed: string;

    @Column('numeric')
    gasLimit: string;

    @Column('numeric', { nullable: true })
    baseFeePerGas?: string;

    @Column()
    nonce: string;

    @OneToMany(() => Transfer, transfer => transfer.block)
    transfers: Transfer[];

    @CreateDateColumn()
    createdAt: Date;
}