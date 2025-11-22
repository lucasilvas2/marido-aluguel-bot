import { User } from "../entities/user";
import { Injectable } from "@nestjs/common";
import { UsersServiceInterface } from "./users.service.interface";
import { UsersRepositoryInterface } from "../repositories/users.repository.interface";

@Injectable()
export class UsersService implements UsersServiceInterface {
    constructor(private readonly userRepository: UsersRepositoryInterface) {}

    async createUser(data: { name: string; email: string; phone: string; userType?: string }): Promise<User> {
        return this.userRepository.create(data);
    }

    async findUserById(id: string): Promise<User | null> {
        return this.findById(id);
    }

    findById(id: string): Promise<User | null> {
        return this.userRepository.findById(id);
    }

    findAll(): Promise<User[]> {
        return this.userRepository.findAll();
    }

    update(id: string, data: Partial<{ name: string; email: string; phone: string }>): Promise<User> {
        return this.userRepository.update(id, data);
    }

    delete(id: string): Promise<User> {
        return this.userRepository.delete(id);
    }
}