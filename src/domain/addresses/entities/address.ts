export class Address {
    id: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    number?: string;

    constructor(id: string, street: string, city: string, zipCode: string, country: string) {
        this.setId(id);
        this.setStreet(street);
        this.setCity(city);
        this.setZipCode(zipCode);
        this.setCountry(country);
    }

    getId(): string {
        return this.id;
    }
    
    setId(id: string): void {
        this.id = id;
    }

    getStreet(): string {
        return this.street;
    }

    setStreet(street: string): void {
        this.street = street;
    }

    getCity(): string {
        return this.city;
    }

    setCity(city: string): void {
        this.city = city;
    }

    getZipCode(): string {
        return this.zipCode;
    }

    setZipCode(zipCode: string): void {
        this.zipCode = zipCode;
    }

    getCountry(): string {
        return this.country;
    }

    setCountry(country: string): void {
        this.country = country;
    }

    getNumber(): string | undefined {
        return this.number;
    }
    setNumber(number: string): void {
        this.number = number;
    }
}