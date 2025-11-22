import { User } from "../entities/user";

export abstract class UsersServiceInterface {
    abstract createUser(data: { name: string; email: string; phone: string; userType?: string }): Promise<User>;
    abstract findById(id: string): Promise<User | null>;
    abstract findAll(): Promise<User[]>;
    abstract update(id: string, data: Partial<{ name: string; email: string; phone: string }>): Promise<User>;
    abstract delete(id: string): Promise<User>;
}