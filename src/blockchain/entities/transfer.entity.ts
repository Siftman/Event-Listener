import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Block } from './block.entity';

@Entity('transfers')
export class Transfer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    from: string;

    @Column()
    to: string;

    @Column('numeric')
    value: string;

    @Column()
    transactionHash: string;

    @Column('bigint')
    blockNumber: number;

    @ManyToOne(() => Block, block => block.transfers)
    block: Block;

    @CreateDateColumn()
    createdAt: Date;
}