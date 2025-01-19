import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('usdc_transactions')
export class USDCTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    transactionHash: string;

    @Column()
    blockNumber: number;

    @Column()
    from: string;

    @Column()
    to: string;

    @Column()
    value: string;

    @CreateDateColumn()
    createdAt: Date;
}