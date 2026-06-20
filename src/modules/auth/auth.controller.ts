import { AuthService } from './auth.service.js';

export const AuthController = {
  async register({ body }: any) {
    return await AuthService.register(body);
  },

  async login({ body }: any) {
    return await AuthService.login(body);
  },

  async refresh({ body }: any) {
    return await AuthService.refresh(body);
  },

  async logout({ user, body }: any) {
    return await AuthService.logout(user, body);
  },

  async updatePushToken({ user, body }: any) {
    return await AuthService.updatePushToken(user.id, body);
  },

  async deletePushToken({ user, body }: any) {
    return await AuthService.deletePushToken(user.id, body);
  }
};
