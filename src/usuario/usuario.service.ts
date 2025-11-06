import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: boolean;
  es_admin: boolean;
  creado_en: string;
}

interface UserApiResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

@Injectable()
export class UsuarioService {
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('USUARIO_SERVICE_URL');
    if (!url) {
      throw new Error('USUARIO_SERVICE_URL no está configurada en las variables de entorno');
    }
    this.apiUrl = url;
  }

  async getUserProfile(token: string): Promise<UserProfile> {
    try {
      const response = await axios.get<UserApiResponse>(`${this.apiUrl}/perfil`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.data;
      }

      throw new HttpException(
        'Error al obtener perfil de usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          error.response?.data?.message || 'Error al obtener perfil de usuario',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      throw new HttpException(
        'Error al obtener perfil de usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserId(token: string): Promise<string> {
    const profile = await this.getUserProfile(token);
    return profile.id;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await this.getUserProfile(token);
      return true;
    } catch (error) {
      return false;
    }
  }
}
