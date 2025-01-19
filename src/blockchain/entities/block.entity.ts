import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from "typeorm";


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

    @CreateDateColumn()
    createdAt: Date;
}