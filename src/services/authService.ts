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

  saveAuthData(authToken: string, userId: number, userName?: string, fullName?: string): void {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userId', userId.toString());
    if (userName) {
      localStorage.setItem('userName', userName);
    }
    if (fullName) {
      localStorage.setItem('fullName', fullName);
    }
  }

  getAuthData(): { authToken: string | null; userId: number | null; userName: string | null; fullName: string | null } {
    return {
      authToken: localStorage.getItem('authToken'),
      userId: localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')!) : null,
      userName: localStorage.getItem('userName'),
      fullName: localStorage.getItem('fullName'),
    };
  }

  clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('fullName');
  }

  isAuthenticated(): boolean {
    const { authToken, userId } = this.getAuthData();
    return !!(authToken && userId);
  }
}

export default new AuthService();