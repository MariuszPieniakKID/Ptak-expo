import config from '../config/config';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
}

export interface Exhibitor {
  id: number;
  nip: string;
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  contactPerson: string;
  contactRole: string;
  phone: string;
  email: string;
  status: string;
  nearestEventDate?: string;
  eventNames?: string;
  createdAt: string;
  updatedAt: string;
}

const apiCall = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 401) {
        // Handle unauthorized access globally if needed, e.g., by dispatching a logout event
        // For now, let the caller handle it.
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      if (config.DEBUG) console.log(`🔄 Retry ${i + 1}/${retries} for ${options.method || 'GET'} ${url}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
    }
  }
  throw new Error('All API call retries failed');
};

export const fetchUsers = async (token: string): Promise<User[]> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/users`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  const data = await response.json();
  return data.data.sort((a: User, b: User) => a.fullName.localeCompare(b.fullName));
};

export const resetUserPassword = async (userId: number): Promise<void> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/users/${userId}/reset-password`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to reset password');
  }
};

export const deleteUser = async (userId: number, token: string): Promise<any> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete user');
  }
  return response.json();
};

export interface AddUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  password: string;
  role: 'admin' | 'exhibitor' | 'guest';
}

export const addUser = async (userData: AddUserPayload, token: string): Promise<any> => {
    const response = await apiCall(`${config.API_BASE_URL}/api/v1/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd podczas dodawania użytkownika');
    }

    return response.json();
};

// Exhibitors API
export const fetchExhibitors = async (token: string): Promise<Exhibitor[]> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch exhibitors');
  }
  const data = await response.json();
  return data.sort((a: Exhibitor, b: Exhibitor) => a.companyName.localeCompare(b.companyName));
};

export const deleteExhibitor = async (exhibitorId: number, token: string): Promise<any> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors/${exhibitorId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete exhibitor');
  }
  return response.json();
};

export interface AddExhibitorPayload {
  nip: string;
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  contactPerson: string;
  contactRole: string;
  phone: string;
  email: string;
}

export const addExhibitor = async (exhibitorData: AddExhibitorPayload, token: string): Promise<any> => {
    const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(exhibitorData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd podczas dodawania wystawcy');
    }

    return response.json();
}; 