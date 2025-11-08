import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class BulkRegisterService {
  constructor(private readonly httpService: HttpService) {}

  async registerUsers(users: any[]): Promise<{ user: any; status?: number; data?: any; error?: string }[]> {
    const url = 'https://usuario.sw2ficct.lat/api/v1/auth/register';
    const results: { user: any; status?: number; data?: any; error?: string }[] = [];

    for (const user of users) {
      try {
        const response = await this.httpService.post(url, user).toPromise();
        if (response) {
          results.push({ user, status: response.status, data: response.data });
        } else {
          results.push({ user, error: 'No response received' });
        }
      } catch (error) {
        results.push({ user, error: error.message });
      }
    }

    return results;
  }
}