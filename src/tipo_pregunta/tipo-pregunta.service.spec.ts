import { Test, TestingModule } from '@nestjs/testing';
import { TipoPreguntaService } from './tipo-pregunta.service';

describe('TipoPreguntaService', () => {
    let service: TipoPreguntaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TipoPreguntaService],
        }).compile();

        service = module.get<TipoPreguntaService>(TipoPreguntaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
