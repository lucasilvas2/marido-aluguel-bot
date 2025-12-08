import { User } from "src/domain/users/entities/user";
import { Specialty } from "src/domain/specialties/entities/specialty";

export class ServiceRequest {
    protected id: number;
    protected clientId: number;
    protected professionalId?: number;
    protected specialtyId: number;
    protected status: string;
    protected description?: string;
    protected notes?: string;
    protected requestedDate?: Date;
    protected completedDate?: Date;
    protected client?: User;
    protected professional?: User;
    protected specialty?: Specialty;
    protected createdAt: Date;
    protected updatedAt: Date;

    constructor(
        id: number,
        clientId: number,
        professionalId: number | null,
        specialtyId: number,
        status: string,
        description: string | null,
        createdAt: Date,
        updatedAt: Date,
        notes?: string,
        requestedDate?: Date,
        completedDate?: Date,
        client?: User,
        professional?: User,
        specialty?: Specialty
    ) {
        this.setId(id);
        this.setClientId(clientId);
        this.setSpecialtyId(specialtyId);
        this.setStatus(status);
        this.setCreatedAt(createdAt);
        this.setUpdatedAt(updatedAt);

        if (professionalId !== undefined) {
            this.setProfessionalId(professionalId);
        }
        if (description !== undefined) {
            this.setDescription(description);
        }
        if (notes !== undefined) {
            this.setNotes(notes);
        }
        if (requestedDate !== undefined) {
            this.setRequestedDate(requestedDate);
        }
        if (completedDate !== undefined) {
            this.setCompletedDate(completedDate);
        }
        if (client !== undefined) {
            this.setClient(client);
        }
        if (professional !== undefined) {
            this.setProfessional(professional);
        }
        if (specialty !== undefined) {
            this.setSpecialty(specialty);
        }
    }

    getId(): number {
        return this.id;
    }

    setId(id: number): void {
        this.id = id;
    }

    getClientId(): number {
        return this.clientId;
    }

    setClientId(clientId: number): void {
        this.clientId = clientId;
    }

    getProfessionalId(): number | undefined {
        return this.professionalId;
    }

    setProfessionalId(professionalId: number): void {
        this.professionalId = professionalId;
    }

    getSpecialtyId(): number {
        return this.specialtyId;
    }

    setSpecialtyId(specialtyId: number): void {
        this.specialtyId = specialtyId;
    }

    getStatus(): string {
        return this.status;
    }

    setStatus(status: string): void {
        this.status = status;
    }

    getDescription(): string | undefined {
        return this.description;
    }

    setDescription(description: string): void {
        this.description = description;
    }

    getNotes(): string | undefined {
        return this.notes;
    }

    setNotes(notes: string): void {
        this.notes = notes;
    }

    getRequestedDate(): Date | undefined {
        return this.requestedDate;
    }

    setRequestedDate(requestedDate: Date): void {
        this.requestedDate = requestedDate;
    }

    getCompletedDate(): Date | undefined {
        return this.completedDate;
    }

    setCompletedDate(completedDate: Date): void {
        this.completedDate = completedDate;
    }

    getClient(): User | undefined {
        return this.client;
    }

    setClient(client: User): void {
        this.client = client;
    }

    getProfessional(): User | undefined {
        return this.professional;
    }

    setProfessional(professional: User): void {
        this.professional = professional;
    }

    getSpecialty(): Specialty | undefined {
        return this.specialty;
    }

    setSpecialty(specialty: Specialty): void {
        this.specialty = specialty;
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