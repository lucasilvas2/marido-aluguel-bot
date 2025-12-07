import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBody } from "@nestjs/swagger";
import { SpecialtiesAppServiceInterface } from "src/application/specialties/interfaces/specialties.app.service.interface";

@Controller('specialties')
export class SpecialtyController {

    constructor(private readonly specialtiesAppService: SpecialtiesAppServiceInterface) {}

    @Get()
    async getAllSpecialties() {
        return await this.specialtiesAppService.all();
    }

    @Get(':id')
    async getSpecialtyById(
        @Param('id') id: number
    ) {
        return await this.specialtiesAppService.getById(id);
    }

    @Delete(':id')
    async deleteSpecialty(
        @Param('id') id: number
    ) {
        return await this.specialtiesAppService.delete(id);
    }

    @Put(':id')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
            }
        }
    })
    async updateSpecialty(
        @Param('id') id: number, 
        @Body() body: { name?: string; description?: string }
    ) {
        return await this.specialtiesAppService.update(id, body.name, body.description);
    }   

    @Post()
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
            }
        }
    })
    async createSpecialty(
        @Body() body: { name: string; description: string }
    ) {
        return await this.specialtiesAppService.create(body.name, body.description);
    }

}