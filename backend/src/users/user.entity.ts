import {BeforeInsert, Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import * as bcrypt from 'bcrypt';
import {RefreshToken} from "../auth/refresh-token.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({unique: true})
  username: string;

  @Column()
  password: string;

  @Column({default: false})
  isVerified: boolean;

  @Column({type: 'varchar', nullable: true})
  verificationToken: string | null;

  @Column({nullable: true, type: 'timestamp'})
  verificationTokenExpiresAt: Date | null;

  @OneToMany(() => RefreshToken, refreshToken => refreshToken.user)
  refreshTokens: RefreshToken

  @BeforeInsert()
  async hashPassword() {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
}
