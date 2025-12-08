import { User } from "../entities/user";

export abstract class UsersServiceInterface {
    abstract createUser(data: { name: string; email: string; phone: string; userType?: string }): Promise<User>;
    abstract findById(id: number): Promise<User | null>;
    abstract findAll(): Promise<User[]>;
    abstract update(id: number, data: Partial<{ name: string; email: string; phone: string }>): Promise<User>;
    abstract delete(id: number): Promise<User>;
    abstract findByPhone(phone: string): Promise<User | null>;
}