/**
 * REST API Client for Agni's Capsule
 * Handles authentication headers, token storage, Google OAuth flows,
 * and encrypted capsule lifecycle endpoints.
 */

const API_BASE = '/api/v1';
let inMemoryAccessToken: string | null = null;

export function getStoredToken(): string | null {
  return inMemoryAccessToken ?? localStorage.getItem('agni_access_token');
}

export function setStoredToken(token: string | null): void {
  inMemoryAccessToken = token;
  if (token) {
    localStorage.setItem('agni_access_token', token);
  } else {
    localStorage.removeItem('agni_access_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return undefined as T;
}

export const api = {
  // --- Authentication ---
  async register(payload: {
    email: string;
    password: string;
    full_name: string;
    department?: string;
    graduation_year?: number;
    roll_number?: string;
  }): Promise<{ access_token: string; refresh_token: string; token_type?: string }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload: {
    email: string;
    password: string;
  }): Promise<{ access_token: string; refresh_token: string; token_type?: string }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async logout(refreshToken?: string): Promise<{ status: string; message: string }> {
    return request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken ?? null }),
    });
  },

  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; token_type?: string }> {
    return request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  async getMyProfile(): Promise<any> {
    return request('/auth/me');
  },

  // --- Google OAuth ---
  async getGoogleAuthUrl(): Promise<{ auth_url: string }> {
    return request<{ auth_url: string }>('/auth/google/url');
  },

  async postGoogleAuthCallback(code: string, state = ''): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: {
      id: string;
      email: string;
      full_name: string;
      avatar_url?: string;
    };
  }> {
    return request('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  },

  // --- Sovereign Google Drive ---
  async getGoogleDriveConnectUrl(): Promise<{ auth_url: string }> {
    return request<{ auth_url: string }>('/storage/google/connect');
  },

  async postGoogleDriveCallback(code: string, state = ''): Promise<{
    status: string;
    account_email: string;
  }> {
    return request('/storage/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  },

  async postGoogleDriveDisconnect(): Promise<{ status: string; message: string }> {
    return request('/storage/google/disconnect', {
      method: 'POST',
    });
  },

  async getStorageUsage(): Promise<{
    provider: string;
    is_connected: boolean;
    status: string;
    account_email?: string;
    authorized_folder_id?: string;
    directory?: string;
    uploaded_files_count: number;
    allocated_bytes: number;
    failed_files_count: number;
    total_bytes: number;
    last_sync_at?: string;
    last_verified_at?: string;
  }> {
    return request('/storage/usage');
  },

  async verifyGoogleDriveAccess(): Promise<{
    status: string;
    folder_id: string;
    folder_name: string;
    folder_created_time?: string;
    drive_files_count: number;
    database_objects_count: number;
    verified_files_count: number;
    missing_files_count: number;
    application_used_bytes: number;
    verified_files: any[];
    missing_files: any[];
    discrepancies: string[];
    quota_info?: any;
    last_verified_at: string;
  }> {
    return request('/storage/google/verify', {
      method: 'POST',
    });
  },

  async testGoogleDriveUpload(): Promise<{
    status: string;
    message: string;
    file_id: string;
    file_name: string;
    folder_id: string;
    size_bytes: number;
    sha256: string;
    checksum_matches: boolean;
    web_view_link?: string;
  }> {
    return request('/storage/google/test-upload', {
      method: 'POST',
    });
  },

  // --- Capsule Management ---
  async listCapsules(status?: string): Promise<any[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/capsules${query}`);
  },

  async createCapsule(payload: any): Promise<any> {
    return request('/capsules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getCapsule(id: string): Promise<any> {
    return request(`/capsules/${id}`);
  },

  async sealCapsule(id: string, payload: any): Promise<any> {
    return request(`/capsules/${id}/seal`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async cancelCapsule(id: string): Promise<any> {
    return request(`/capsules/${id}/cancel`, {
      method: 'POST',
    });
  },

  // --- Recipient Inbox ---
  async listInbox(): Promise<any[]> {
    return request('/inbox');
  },

  async openInboxCapsule(id: string): Promise<any> {
    return request(`/inbox/${id}/open`);
  },

  async acknowledgeInboxCapsule(id: string): Promise<any> {
    return request(`/inbox/${id}/acknowledge`, {
      method: 'POST',
    });
  },

  // --- Notifications ---
  async listNotifications(): Promise<any[]> {
    return request('/notifications');
  },

  async markNotificationRead(id: string): Promise<any> {
    return request(`/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  // --- Batch Communities ---
  async getBatchLedger(batchId = 'default'): Promise<any> {
    return request(`/batches/${batchId}/ledger`);
  },

  async contributeToBatch(batchId: string, payload: any): Promise<any> {
    return request(`/batches/${batchId}/capsules`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
