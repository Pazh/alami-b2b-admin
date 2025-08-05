interface LoginResponse {
  status: number;
  message: string;
  data: {
    authToken: string;
    userId: number;
    redirectUri: string;
  };
}

interface ErrorResponse {
  status: number;
  message: string;
  error: string;
}

class AuthService {
  private baseUrl = 'https://id.contentapi.io/api';
  private headers = {
    'url': 'p-id.ir',
    'Content-Type': 'application/json',
  };

  async login(phone: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ phone, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  }

  async generateOTP(phone: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/user/generateOtp/${phone}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to generate OTP');
    }
  }

  async loginWithOTP(phone: string, otpCode: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/loginOTP`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ phone, otpCode }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    return data;
  }

  async updatePassword(userId: number, newPassword: string, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/user/${userId}`, {
      method: 'PUT',
      headers: {
        ...this.headers,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to update password');
    }
  }

  saveAuthData(authToken: string, userId: number): void {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userId', userId.toString());
  }

  getAuthData(): { authToken: string | null; userId: number | null } {
    return {
      authToken: localStorage.getItem('authToken'),
      userId: localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')!) : null,
    };
  }

  clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
  }

  isAuthenticated(): boolean {
    const { authToken, userId } = this.getAuthData();
    return !!(authToken && userId);
  }
}

export default new AuthService();