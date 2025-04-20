import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "../users/user.entity";

@Entity('refresh_token')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({unique: true})
  token: string;

  @Column({type: 'timestamp'})
  expiresAt: Date;

  @Column({default: false})
  isRevoked: boolean;

  @ManyToOne(() => User, user => user.refreshTokens, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'userId'})
  user: User

  @Column()
  userId: string;
}
