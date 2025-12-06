import { Specialty } from '../entities/specialty';

export abstract class SpecialtiesRepositoryInterface {
    abstract create(name: string, description: string): Promise<Specialty>;
    abstract getById(id: number): Promise<Specialty | null>;
    abstract update(id: number, name: string, description: string): Promise<void>;
    abstract delete(id: number): Promise<void>;
    abstract all(): Promise<Specialty[]>;
}