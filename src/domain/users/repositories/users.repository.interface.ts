import { User } from "../entities/user";

export abstract class UsersRepositoryInterface {
    abstract create(data: { name: string; email: string; phone: string; userType?: string }): Promise<User>;
    abstract findById(id: number): Promise<any | null>;
    abstract findAll(): Promise<any[]>;
    abstract update(id: number, data: Partial<{ name: string; email: string; phone: string }>): Promise<any>;
    abstract delete(id: number): Promise<any>;
}