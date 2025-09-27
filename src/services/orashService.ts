interface OrashAuthResponse {
  content: {
    token: string;
    refreshToken: string;
    name: string;
  };
  message: string;
  hasError: boolean;
  responseCode: number;
}

interface OrashRefreshResponse {
  content: {
    token: string;
    refreshToken: string;
  };
  message: string;
  hasError: boolean;
  responseCode: number;
}

interface OrashApiResponse<T> {
  content: T;
  message: string;
  hasError: boolean;
  responseCode: number;
}

class OrashService {
  private baseUrl = import.meta.env.VITE_ORASH_BASE_URL || 'http://orash.alamico.ir:5000/api';
  private username = import.meta.env.VITE_ORASH_USERNAME || '';
  private password = import.meta.env.VITE_ORASH_PASSWORD || '';
  private uniqueID = import.meta.env.VITE_ORASH_UNIQUE_ID || '';
  
  private token: string | null = null;
  private refreshToken: string | null = null;

  /**
   * Authenticate with Orash API and get tokens
   */
  async authenticate(): Promise<OrashAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
          uniqueID: this.uniqueID,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OrashAuthResponse = await response.json();
      
      if (data.hasError) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store tokens for future use
      this.token = data.content.token;
      this.refreshToken = data.content.refreshToken;

      return data;
    } catch (error) {
      console.error('Orash authentication error:', error);
      throw error;
    }
  }

  /**
   * Refresh the authentication token
   */
  async refreshAuthToken(): Promise<OrashRefreshResponse> {
    if (!this.token) {
      throw new Error('No token available for refresh');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.token,
          uniqueID: this.uniqueID,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OrashRefreshResponse = await response.json();
      
      if (data.hasError) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Update stored tokens
      this.token = data.content.token;
      this.refreshToken = data.content.refreshToken;

      return data;
    } catch (error) {
      console.error('Orash token refresh error:', error);
      throw error;
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Set tokens manually (useful for persistence)
   */
  setTokens(token: string, refreshToken: string): void {
    this.token = token;
    this.refreshToken = refreshToken;
  }

  /**
   * Clear stored tokens
   */
  clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
  }

  /**
   * Make authenticated request to Orash API with automatic token refresh
   */
  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<OrashApiResponse<T>> {
    // Ensure we have a token
    if (!this.token) {
      await this.authenticate();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // If token is expired, try to refresh and retry
      if (response.status === 401) {
        await this.refreshAuthToken();
        
        // Retry with new token
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${this.token}`,
          },
        });

        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }

        return retryResponse.json();
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Orash API request error:', error);
      throw error;
    }
  }

  /**
   * Generic method to make GET requests to Orash API
   */
  async get<T>(endpoint: string): Promise<OrashApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Generic method to make POST requests to Orash API
   */
  async post<T>(endpoint: string, data?: any): Promise<OrashApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Generic method to make PUT requests to Orash API
   */
  async put<T>(endpoint: string, data?: any): Promise<OrashApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Generic method to make DELETE requests to Orash API
   */
  async delete<T>(endpoint: string): Promise<OrashApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.username && this.password && this.uniqueID);
  }

  /**
   * Get goods information from Orash (price and stock)
   */
  async getGoods(orashProductId: string, currentUserId: number = 5): Promise<OrashApiResponse<any[]>> {
    return this.post('/v3/Good/getgoods', {
      uniqueID: this.uniqueID,
      data: {
        currentUserId:5,
        showStockflg: 1,
        fromGoodCode: orashProductId,
        toGoodCode: orashProductId,
        withFi: false
      }
    });
  }

  /**
   * Get configuration status
   */
  getConfigurationStatus(): {
    hasUsername: boolean;
    hasPassword: boolean;
    hasUniqueID: boolean;
    hasBaseUrl: boolean;
    isFullyConfigured: boolean;
  } {
    return {
      hasUsername: !!this.username,
      hasPassword: !!this.password,
      hasUniqueID: !!this.uniqueID,
      hasBaseUrl: !!this.baseUrl,
      isFullyConfigured: this.isConfigured(),
    };
  }
}

export default new OrashService();