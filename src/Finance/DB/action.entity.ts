import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity({name: 'action'})
export class Action {
    @PrimaryGeneratedColumn()
    action_id: number;

    @Column()
    action_date: string;

    @Column()
    action_name: string;

    @Column()
    action_description: string;

    @Column()
    action_type: number;

    @Column()
    action_amount: number;

    @Column()
    action_currency: string;
}