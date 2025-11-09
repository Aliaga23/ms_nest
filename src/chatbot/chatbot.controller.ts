import { Controller, Post, Body, Delete, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatbotRequestDto } from './dto/chatbot-request.dto';
import { AuthHeader } from '../auth/auth-header.decorator';
import { UsuarioService } from '../usuario/usuario.service';
import { randomUUID } from 'crypto';

@ApiTags('Chatbot')
@ApiBearerAuth()
@Controller('api/chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly usuarioService: UsuarioService,
  ) {}

  private async extractUserId(authHeader: string): Promise<string> {
    if (!authHeader) {
      throw new HttpException('Token no proporcionado', HttpStatus.UNAUTHORIZED);
    }
    const token = authHeader.replace('Bearer ', '');
    return this.usuarioService.getUserId(token);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Enviar mensaje al chatbot' })
  async chat(
    @Body() chatbotRequest: ChatbotRequestDto,
    @AuthHeader() authHeader: string,
  ) {
    const userId = await this.extractUserId(authHeader);
    const sessionId = chatbotRequest.sessionId || randomUUID();
    
    return this.chatbotService.chat(
      chatbotRequest.mensaje,
      sessionId,
      userId,
    );
  }

  @Delete('session/:sessionId')
  @ApiOperation({ summary: 'Limpiar sesión de conversación' })
  clearSession(@Param('sessionId') sessionId: string) {
    this.chatbotService.clearSession(sessionId);
    return { message: 'Sesión eliminada correctamente' };
  }
}
