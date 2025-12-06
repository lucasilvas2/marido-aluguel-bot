export class Specialty {
    protected id: number;
    protected name: string;
    protected description: string;
    protected createdAt: Date;
    protected updatedAt: Date;

    constructor(id: number, name: string, description: string, createdAt: Date, updatedAt: Date) {
        this.setId(id);
        this.setName(name);
        this.setDescription(description);
        this.setCreatedAt(createdAt);
        this.setUpdatedAt(updatedAt);
    }

    getId(): number {
        return this.id;
    }

    setId(id: number): void {
        this.id = id;
    }

    getName(): string {
        return this.name;
    }

    setName(name: string): void {
        this.name = name;
    }

    getDescription(): string {
        return this.description;
    }

    setDescription(description: string): void {
        this.description = description;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    setCreatedAt(createdAt: Date): void {
        this.createdAt = createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    setUpdatedAt(updatedAt: Date): void {
        this.updatedAt = updatedAt;
    }
}