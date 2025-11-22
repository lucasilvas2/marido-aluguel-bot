import { User } from "../entities/user";

export abstract class UsersRepositoryInterface {
    abstract create(data: { name: string; email: string; phone: string; userType?: string }): Promise<User>;
    abstract findById(id: string): Promise<any | null>;
    abstract findAll(): Promise<any[]>;
    abstract update(id: string, data: Partial<{ name: string; email: string; phone: string }>): Promise<any>;
    abstract delete(id: string): Promise<any>;
}