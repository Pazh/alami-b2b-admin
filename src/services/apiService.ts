interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface PaginatedResponse<T> {
  data: T[];
  details: {
    count: number;
  };
}

class ApiService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://alami-b2b-api.liara.run/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    authToken?: string
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Brand APIs
  async getBrands(pageSize: number, pageIndex: number, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/brand?${queryParams}`, {}, authToken);
  }

  async getBrandById(id: string, authToken: string) {
    return this.request<any>(`/brand/${id}`, {}, authToken);
  }

  async createBrand(data: { name: string }, authToken: string) {
    return this.request<any>('/brand', {
      method: 'POST',
      body: JSON.stringify(data),
    }, authToken);
  }

  async updateBrand(id: string, data: { name: string }, authToken: string) {
    return this.request<any>(`/brand/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, authToken);
  }

  async deleteBrand(id: string, authToken: string) {
    return this.request<any>(`/brand/${id}`, {
      method: 'DELETE',
    }, authToken);
  }

  // Tag APIs
  async getTags(pageSize: number, pageIndex: number, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/tag?${queryParams}`, {}, authToken);
  }

  async getTagById(id: string, authToken: string) {
    return this.request<any>(`/tag/${id}`, {}, authToken);
  }

  async createTag(data: { name: string }, authToken: string) {
    return this.request<any>('/tag', {
      method: 'POST',
      body: JSON.stringify(data),
    }, authToken);
  }

  async updateTag(id: string, data: { name: string }, authToken: string) {
    return this.request<any>(`/tag/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, authToken);
  }

  async deleteTag(id: string, authToken: string) {
    return this.request<any>(`/tag/${id}`, {
      method: 'DELETE',
    }, authToken);
  }

  // Grade APIs
  async getGrades(authToken: string) {
    return this.request<PaginatedResponse<any>>('/grade', {}, authToken);
  }

  async getGradeById(id: string, authToken: string) {
    return this.request<any>(`/grade/${id}`, {}, authToken);
  }

  async createGrade(data: { name: string; description?: string; maxCredit: number }, authToken: string) {
    return this.request<any>('/grade', {
      method: 'POST',
      body: JSON.stringify(data),
    }, authToken);
  }

  async updateGrade(id: string, data: { name: string; description?: string; maxCredit: number }, authToken: string) {
    return this.request<any>(`/grade/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, authToken);
  }

  async deleteGrade(id: string, authToken: string) {
    return this.request<any>(`/grade/${id}`, {
      method: 'DELETE',
    }, authToken);
  }

  // Stock APIs
  async getStocks(pageSize: number, pageIndex: number, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/stock?${queryParams}`, {}, authToken);
  }

  async filterStocks(pageSize: number, pageIndex: number, filters: any, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/stock/filter?${queryParams}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    }, authToken);
  }

  async searchStocksByName(name: string, authToken: string) {
    return this.request<PaginatedResponse<any>>('/stock/filter?pageSize=20', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }, authToken);
  }

  async getStockById(id: string, authToken: string) {
    return this.request<any>(`/stock/${id}`, {}, authToken);
  }

  async updateStock(id: string, data: any, authToken: string) {
    return this.request<any>(`/stock/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, authToken);
  }

  // Customer APIs
  async getCustomers(pageSize: number, pageIndex: number, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/customer-user?${queryParams}`, {}, authToken);
  }

  async filterCustomers(pageSize: number, pageIndex: number, filters: any, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/customer-user/filter?${queryParams}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    }, authToken);
  }

  async updateCustomer(id: string, data: any, authToken: string) {
    return this.request<any>(`/customer-user/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, authToken);
  }

  async getCustomerById(id: string, authToken: string) {
    return this.request<any>(`/customer-user/${id}`, {}, authToken);
  }

  // Customer Relation APIs
  async getCustomerRelations(pageSize: number, pageIndex: number, filters: any, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/customer-relation/filter?${queryParams}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    }, authToken);
  }

  async createCustomerRelation(data: { customerUserId: number; managerUserId: number }, authToken: string) {
    return this.request<any>('/customer-relation', {
      method: 'POST',
      body: JSON.stringify(data),
    }, authToken);
  }

  async deleteCustomerRelation(data: { customerUserId: number; managerUserId: number }, authToken: string) {
    return this.request<any>('/customer-relation', {
      method: 'DELETE',
      body: JSON.stringify(data),
    }, authToken);
  }

  // Employee APIs
  async getEmployees(pageSize: number, pageIndex: number, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/manager-user?${queryParams}`, {}, authToken);
  }

  async filterEmployees(pageSize: number, pageIndex: number, filters: any, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/manager-user/filter?${queryParams}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    }, authToken);
  }

  async updateEmployee(id: string, data: any, authToken: string) {
    return this.request<any>(`/manager-user/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, authToken);
  }

  // Role APIs
  async getRoles(authToken: string) {
    return this.request<PaginatedResponse<any>>('/role', {}, authToken);
  }

  // Invoice APIs
  async getInvoices(pageSize: number, pageIndex: number, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/factor?${queryParams}`, {}, authToken);
  }

  async filterInvoices(pageSize: number, pageIndex: number, filters: any, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/factor/filter?${queryParams}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    }, authToken);
  }

  async getCustomerInvoices(customerUserId: string, authToken: string) {
    return this.request<PaginatedResponse<any>>('/factor/filter', {
      method: 'POST',
      body: JSON.stringify({ customerUserId }),
    }, authToken);
  }

  async getInvoiceById(id: string, authToken: string) {
    return this.request<any>(`/factor/${id}`, {}, authToken);
  }

  async createInvoice(data: any, authToken: string) {
    return this.request<any>('/factor', {
      method: 'POST',
      body: JSON.stringify(data),
    }, authToken);
  }

  async updateInvoice(id: string, data: any, authToken: string) {
    return this.request<any>(`/factor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, authToken);
  }

  async updateInvoiceStatus(id: string, status: string, creatorUserId: number, authToken: string) {
    return this.request<any>(`/factor/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, creatorUserId }),
    }, authToken);
  }

  // Invoice Items APIs
  async getInvoiceItems(invoiceId: string, authToken: string) {
    return this.request<PaginatedResponse<any>>('/factor-item/filter', {
      method: 'POST',
      body: JSON.stringify({ factorId: invoiceId }),
    }, authToken);
  }

  // Check APIs
  async getChecks(pageSize: number, pageIndex: number, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/check?${queryParams}`, {}, authToken);
  }

  async filterChecks(pageSize: number, pageIndex: number, filters: any, authToken: string) {
    const queryParams = new URLSearchParams({
      pageSize: pageSize.toString(),
      pageIndex: pageIndex.toString()
    });
    return this.request<PaginatedResponse<any>>(`/check/filter?${queryParams}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    }, authToken);
  }

  async getCheckById(id: string, authToken: string) {
    return this.request<any>(`/check/${id}`, {}, authToken);
  }

  async createCheck(data: any, authToken: string) {
    return this.request<any>('/check', {
      method: 'POST',
      body: JSON.stringify(data),
    }, authToken);
  }

  async updateCheck(id: string, data: any, authToken: string) {
    return this.request<any>(`/check/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, authToken);
  }

  async deleteCheck(id: string, authToken: string) {
    return this.request<any>(`/check/${id}`, {
      method: 'DELETE',
    }, authToken);
  }

  // Invoice Item APIs
  async createInvoiceItem(data: { stockId: string; factorId: string; amount: number,creatorUserId:any}, authToken: string) {
    return this.request<any>('/factor-item', {
      method: 'POST',
      body: JSON.stringify(data),
    }, authToken);
  }

  async updateInvoiceItem(id: string, data: { stockId: string; factorId: string; amount: number,creatorUserId:any }, authToken: string) {
    return this.request<any>(`/factor-item/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, authToken);
  }

  async deleteInvoiceItem(id: string, authToken: string,body:any) {
    return this.request<any>(`/factor-item/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(body),
    }, authToken);
  }

  // Factor Cheque APIs
  async getFactorCheques(factorId: string, authToken: string) {
    return this.request<PaginatedResponse<any>>('/factor-cheque/filter', {
      method: 'POST',
      body: JSON.stringify({ factorId }),
    }, authToken);
  }

  async assignChequeToFactor(factorId: string, chequeId: string, authToken: string) {
    return this.request<any>('/factor-cheque', {
      method: 'POST',
      body: JSON.stringify({ factorId, chequeId }),
    }, authToken);
  }

  async deleteFactorCheque(id: string, authToken: string) {
    return this.request<any>(`/factor-cheque/${id}`, {
      method: 'DELETE',
    }, authToken);
  }

  async getCustomerCheques(filterData: any, authToken: string) {
    return this.request<PaginatedResponse<any>>('/cheque/filter', {
      method: 'POST',
      body: JSON.stringify(filterData),
    }, authToken);
  }

  // Transaction APIs
  async getFactorTransactions(factorId: string, authToken: string) {
    return this.request<PaginatedResponse<any>>('/transaction/filter', {
      method: 'POST',
      body: JSON.stringify({ factorId }),
    }, authToken);
  }

  async getCustomerTransactions(customerUserId: string, authToken: string) {
    return this.request<PaginatedResponse<any>>('/transaction/filter', {
      method: 'POST',
      body: JSON.stringify({ customerUserId }),
    }, authToken);
  }

  async createTransaction(data: {
    customerUserId: string;
    chequeId: string | null;
    factorId: string;
    trackingCode: string;
    price: string;
    method: 'cash' | 'cheque';
    createdAt: string;
  }, authToken: string) {
    return this.request<any>('/transaction', {
      method: 'POST',
      body: JSON.stringify(data),
    }, authToken);
  }

  async createCheque(data: {
    number: string;
    date: string;
    price: number;
    customerUserId: string;
    managerUserId: string;
    creatorUserId: string;
    status: string;
    bankName: string;
    description: string;
    sayyadi: boolean;
  }, authToken: string) {
    return this.request<any>('/cheque', {
      method: 'POST',
      body: JSON.stringify(data),
    }, authToken);
  }

  // Factor Log APIs
  async getFactorLogs(filterData: any, authToken: string) {
    return this.request<PaginatedResponse<any>>('/factor-log/filter?sortColumn=createdAt&pageSize=1000', {
      method: 'POST',
      body: JSON.stringify(filterData),
    }, authToken);
  }

  // Cheque Log APIs
  async getChequeLogs(filterData: any, authToken: string) {
    return this.request<PaginatedResponse<any>>('/cheque-log/filter?sortColumn=createdAt&pageSize=1000', {
      method: 'POST',
      body: JSON.stringify(filterData),
    }, authToken);
  }

  // Stock Log APIs
  async getStockLogs(filterData: any, authToken: string) {
    return this.request<PaginatedResponse<any>>('/stock-log/filter?sortColumn=createdAt&pageSize=1000', {
      method: 'POST',
      body: JSON.stringify(filterData),
    }, authToken);
  }

  // Comment APIs
  async getComments(filterData: any, authToken: string) {
    return this.request<PaginatedResponse<any>>('/comment/filter', {
      method: 'POST',
      body: JSON.stringify(filterData),
    }, authToken);
  }

  async createComment(data: {
    factorId?: string;
    userId: string;
    content: string;
    relatedType?: string;
    relatedId?: string;
  }, authToken: string) {
    return this.request<any>('/comment', {
      method: 'POST',
      body: JSON.stringify(data),
    }, authToken);
  }

  // Customer Debt API
  async getCustomerDebt(userId: string, authToken: string) {
    return this.request<{
      totalTransactions: number;
      totalDebt: number;
      finalDebt: number;
    }>(`/customer-user/debt/${userId}`, {}, authToken);
  }
}

export default new ApiService();