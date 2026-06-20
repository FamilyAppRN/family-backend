export class AuthService {
  static async register(body: any): Promise<any> {
    return { message: 'Register endpoint structure active', data: body };
  }

  static async login(body: any): Promise<any> {
    return {
      message: 'Login endpoint structure active',
      accessToken: 'sample_access_token',
      refreshToken: 'sample_refresh_token',
    };
  }

  static async refresh(body: any): Promise<any> {
    return {
      message: 'Refresh token endpoint structure active',
      accessToken: 'new_sample_access_token',
    };
  }

  static async logout(user: any, body: any): Promise<any> {
    return { message: 'Logout endpoint structure active' };
  }

  static async updatePushToken(userId: string, body: any): Promise<any> {
    return { message: 'Update push token active', userId, data: body };
  }

  static async deletePushToken(userId: string, body: any): Promise<any> {
    return { message: 'Delete push token active', userId, data: body };
  }
}
