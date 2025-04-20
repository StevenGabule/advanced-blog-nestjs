import {ConflictException, Injectable, InternalServerErrorException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from './user.entity';
import {Repository} from 'typeorm';
import {AuthRegisterDto} from "../auth/dto/auth-register.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(authRegisterDto: AuthRegisterDto): Promise<User> {
    const {name, username, password} = authRegisterDto
    const user = this.usersRepository.create({name, username, password});
    try {
      await this.usersRepository.save(user);
      const {password: _, ...result} = user;
      return result as User;
    } catch (error) {
      // Handle duplicate username error (PostgresSQL error code 23505 for unique violation)
      if (error.code === '23505') {
        throw new ConflictException('Username already exists');
      } else {
        // Log other potential database errors
        console.error(error);
        throw new InternalServerErrorException();
      }
    }
  }

  async update(id: string, updateData: Partial<User>): Promise<void> {
    await this.usersRepository.update(id, updateData);
  }

  async findOneByVerificationToken(verificationToken: string) : Promise<User | null> {
    return this.usersRepository.findOne({where: {verificationToken}, relations: ['refreshTokens']});
  }
}
