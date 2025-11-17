import config from '../config/config';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
}

export interface ExhibitorPerson {
  id: number;
  fullName: string;
  email: string | null;
  type: string | null;
  exhibitorId: number;
  exhibitorCompanyName: string;
  exhibitionId?: number | null;
  exhibitionName?: string | null;
  createdAt: string;
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
  events?: ExhibitorEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ExhibitorEvent {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location?: string;
  status: string;
}

// Exhibitor Awards
export interface ExhibitorAward {
  id?: number;
  exhibitorId: number;
  exhibitionId: number;
  applicationText: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface Exhibition {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  status: string;
  created_at: string;
  updated_at: string;
  trade?:'Dom'|'Budownictwo'|'Inne'; // TODO: przenieść to do enum
  event_logo_file_name?: string | null;
}

const apiCall = async (url: string, options: RequestInit): Promise<Response> => {
  const requestOptions = {
    ...options,
    credentials: 'include' as RequestCredentials
  };
  
  return fetch(url, requestOptions);
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

export const getAvatarUrl = (userId: number, token: string): string => {
  return `${config.API_BASE_URL}/api/v1/users/${userId}/avatar?token=${encodeURIComponent(token)}`;
};

export const uploadUserAvatar = async (userId: number, file: File, token: string): Promise<{ success: boolean; data: { id: number; avatarUrl: string } }> => {
  const form = new FormData();
  form.append('avatar', file);
  const res = await fetch(`${config.API_BASE_URL}/api/v1/users/${userId}/avatar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.error || 'Błąd podczas zapisu zdjęcia');
  return data;
};

export const resetUserPassword = async (userId: number, token: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/users/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Błąd podczas resetowania hasła');
  }
  return data;
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

export const updateUser = async (userId: number, userData: UpdateUserPayload, token: string): Promise<any> => {
  const url = `${config.API_BASE_URL}/api/v1/users/${userId}`;
  try {
    const response = await apiCall(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Błąd podczas aktualizacji użytkownika');
    }
    return data;
  } catch (err: any) {
    throw err;
  }
};

export const getExhibitorAward = async (
  exhibitorId: number,
  exhibitionId: number,
  token: string
): Promise<{ success: boolean; data: ExhibitorAward | null }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitor-awards/${exhibitorId}/${exhibitionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas pobierania zgłoszenia do nagrody');
  }
  return data;
};

export const saveExhibitorAward = async (
  exhibitorId: number,
  exhibitionId: number,
  payload: { applicationText?: string; status?: ExhibitorAward['status'] },
  token: string
): Promise<{ success: boolean; message: string; data: ExhibitorAward }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitor-awards/${exhibitorId}/${exhibitionId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas zapisywania zgłoszenia do nagrody');
  }
  return data;
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
    const url = `${config.API_BASE_URL}/api/v1/users`;
    try {
      console.log('[api] addUser →', { url, userData: { ...userData, password: userData.password ? '***' : undefined }, tokenPresent: !!token });
      const response = await apiCall(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      console.log('[api] addUser status:', response.status);

      if (!response.ok) {
        let errorData: any = null;
        try { errorData = await response.json(); } catch {}
        console.error('[api] addUser error payload:', errorData);
        throw new Error(errorData?.message || errorData?.error || 'Błąd podczas dodawania użytkownika');
      }

      const result = await response.json();
      console.log('[api] addUser result:', result);
      return result;
    } catch (e) {
      console.error('[api] addUser exception:', e);
      throw e;
    }
};

//
export interface AddUserPayloadByAdmin {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
}


export const addUserByAdmin = async (userData: AddUserPayloadByAdmin, token: string): Promise<any> => {
    const url = `${config.API_BASE_URL}/api/v1/users`;
    try {
      console.log('[api] addUserByAdmin →', { url, userData, tokenPresent: !!token });
      const payload: any = { ...userData, role: 'admin' };
      const response = await apiCall(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      console.log('[api] addUserByAdmin status:', response.status);

      if (!response.ok) {
        let errorData: any = null;
        try { errorData = await response.json(); } catch {}
        console.error('[api] addUserByAdmin error payload:', errorData);
        throw new Error(errorData?.message || errorData?.error || 'Błąd podczas dodawania użytkownika');
      }

      const result = await response.json();
      console.log('[api] addUserByAdmin result:', result);
      return result;
    } catch (e) {
      console.error('[api] addUserByAdmin exception:', e);
      throw e;
    }
};

// Exhibitors API
export const fetchExhibitors = async (
  token: string,
  opts?: { query?: string; exhibitionId?: number | 'all' }
): Promise<Exhibitor[]> => {
  const params: string[] = [];
  if (opts?.query && opts.query.trim()) params.push(`query=${encodeURIComponent(opts.query.trim())}`);
  if (opts && typeof opts.exhibitionId !== 'undefined' && opts.exhibitionId !== 'all') {
    params.push(`exhibitionId=${encodeURIComponent(String(opts.exhibitionId))}`);
  }
  const qs = params.length ? `?${params.join('&')}` : '';
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors${qs}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch exhibitors');
  }
  const data = await response.json();
  return data.sort((a: Exhibitor, b: Exhibitor) => a.companyName.localeCompare(b.companyName));
};

export const fetchExhibitor = async (id: number, token: string): Promise<Exhibitor> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch exhibitor');
  }
  return response.json();
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

// Remind exhibitor to fill catalog entry
export const remindExhibitorToFillCatalog = async (
  exhibitorId: number,
  token: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors/${exhibitorId}/remind-catalog`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Nie udało się wysłać przypomnienia');
  }
  return data;
};

// People (E-identyfikatory) API
export const fetchExhibitorPeople = async (
  token: string,
  opts?: { exhibitionId?: number; exhibitorId?: number; query?: string }
): Promise<ExhibitorPerson[]> => {
  const qs: string[] = [];
  if (opts && typeof opts.exhibitionId === 'number') qs.push(`exhibitionId=${encodeURIComponent(String(opts.exhibitionId))}`);
  if (opts && typeof opts.exhibitorId === 'number') qs.push(`exhibitorId=${encodeURIComponent(String(opts.exhibitorId))}`);
  if (opts?.query && opts.query.trim()) qs.push(`query=${encodeURIComponent(opts.query.trim())}`);
  const query = qs.length ? `?${qs.join('&')}` : '';
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors/people${query}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Nie udało się pobrać bazy danych');
  }
  const list = Array.isArray(data.data) ? data.data : [];
  return list.sort((a: ExhibitorPerson, b: ExhibitorPerson) => a.fullName.localeCompare(b.fullName));
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
  password: string;
  exhibitionId?: number | null;
  hallName?: string | null;
  standNumber?: string | null;
  boothArea?: number | null;
  exhibitionSupervisor?: number | null;
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

// Exhibitions API
export const fetchExhibitions = async (token?: string): Promise<Exhibition[]> => {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitions`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch exhibitions');
  }

  return response.json();
};

// GUS lookup by NIP (admin only)
export const fetchCompanyByNip = async (
  nip: string,
  token: string
): Promise<{ companyName: string; address: string; postalCode: string; city: string }> => {
  const norm = String(nip || '').trim();
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/gus/company/${encodeURIComponent(norm)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Nie udało się pobrać danych z GUS');
  }
  const d = data.data || {};
  return {
    companyName: d.companyName || '',
    address: d.address || '',
    postalCode: d.postalCode || '',
    city: d.city || '',
  };
};

export interface UpdateExhibitorPayload {
  companyName?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  contactPerson?: string;
  contactRole?: string;
  phone?: string;
  email?: string;
}

export const updateExhibitor = async (
  exhibitorId: number,
  updates: UpdateExhibitorPayload,
  token: string
): Promise<Exhibitor> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors/${exhibitorId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Błąd podczas aktualizacji wystawcy');
  }
  // backend returns { success, message, data }
  return (data.data ?? data) as Exhibitor;
};

// Reset exhibitor password (admin only)
export const resetExhibitorPassword = async (
  exhibitorId: number,
  token: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors/${exhibitorId}/reset-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Nie udało się zresetować hasła wystawcy');
  }
  return data;
};

export const fetchExhibition = async (id: number, token?: string): Promise<Exhibition> => {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitions/${id}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch exhibition');
  }

  return response.json();
};

// ============= PUBLIC API (no auth) =============
export const publicAPI = {
  listExhibitions: async (): Promise<{ success: boolean; data: Exhibition[] }> => {
    const res = await apiCall(`${config.API_BASE_URL}/public/exhibitions`, { method: 'GET' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Błąd podczas pobierania wydarzeń');
    return data;
  },
  listExhibitorsByExhibition: async (
    exhibitionId: number
  ): Promise<{ success: boolean; exhibitionId: number; exhibitors: any[] }> => {
    const res = await apiCall(`${config.API_BASE_URL}/public/exhibitions/${exhibitionId}/exhibitors`, { method: 'GET' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Błąd podczas pobierania wystawców');
    return data;
  },
  rssUrl: (): string => `${config.API_BASE_URL}/public/rss`,
};

// ===== Catalog dictionaries (tags/industries/brands) =====
export interface CatalogTag { tag: string; usage_count: number }
export interface CatalogIndustry { industry: string; usage_count: number }
export interface CatalogBrand { brand: string; usage_count: number }
export interface CatalogEventField { event_field: string; usage_count: number }
export interface CatalogBuildType { build_type: string; usage_count: number }

export const catalogAPI = {
  // Tags
  listTags: async (token: string, query?: string): Promise<CatalogTag[]> => {
    const qs: string[] = [];
    if (query && query.trim()) qs.push(`query=${encodeURIComponent(query.trim())}`);
    qs.push('limit=2000');
    const url = `${config.API_BASE_URL}/api/v1/catalog/tags${qs.length ? `?${qs.join('&')}` : ''}`;
    const res = await apiCall(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Nie udało się pobrać tagów');
    return Array.isArray(data.data) ? data.data : [];
  },
  addTag: async (token: string, tag: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/tags/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tag }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się dodać tagu'); }
  },
  renameTag: async (token: string, oldTag: string, newTag: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oldTag, newTag }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się zmienić tagu'); }
  },
  deleteTag: async (token: string, tag: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/tags?tag=${encodeURIComponent(tag)}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się usunąć tagu'); }
  },

  // Industries
  listIndustries: async (token: string, query?: string): Promise<CatalogIndustry[]> => {
    const qs: string[] = [];
    if (query && query.trim()) qs.push(`query=${encodeURIComponent(query.trim())}`);
    qs.push('limit=2000');
    const url = `${config.API_BASE_URL}/api/v1/catalog/industries${qs.length ? `?${qs.join('&')}` : ''}`;
    const res = await apiCall(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Nie udało się pobrać branż');
    return Array.isArray(data.data) ? data.data : [];
  },
  addIndustry: async (token: string, industry: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/industries/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ industry }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się dodać branży'); }
  },
  renameIndustry: async (token: string, oldIndustry: string, newIndustry: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/industries`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oldIndustry, newIndustry }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się zmienić branży'); }
  },
  deleteIndustry: async (token: string, industry: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/industries?industry=${encodeURIComponent(industry)}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się usunąć branży'); }
  },

  // Brands
  listBrands: async (token: string, query?: string): Promise<CatalogBrand[]> => {
    const qs: string[] = [];
    if (query && query.trim()) qs.push(`query=${encodeURIComponent(query.trim())}`);
    qs.push('limit=2000');
    const url = `${config.API_BASE_URL}/api/v1/catalog/brands${qs.length ? `?${qs.join('&')}` : ''}`;
    const res = await apiCall(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Nie udało się pobrać marek');
    return Array.isArray(data.data) ? data.data : [];
  },
  addBrand: async (token: string, brand: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/brands/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ brand }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się dodać marki'); }
  },
  renameBrand: async (token: string, oldBrand: string, newBrand: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/brands`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oldBrand, newBrand }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się zmienić marki'); }
  },
  deleteBrand: async (token: string, brand: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/brands?brand=${encodeURIComponent(brand)}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się usunąć marki'); }
  },
  
  // Event fields (industry type for exhibitions)
  listEventFields: async (token: string, query?: string): Promise<CatalogEventField[]> => {
    const qs: string[] = [];
    if (query && query.trim()) qs.push(`query=${encodeURIComponent(query.trim())}`);
    qs.push('limit=2000');
    const url = `${config.API_BASE_URL}/api/v1/catalog/event-fields${qs.length ? `?${qs.join('&')}` : ''}`;
    const res = await apiCall(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Nie udało się pobrać branż wydarzeń');
    return Array.isArray(data.data) ? data.data : [];
  },
  addEventField: async (token: string, eventField: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/event-fields/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventField }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się dodać branży wydarzenia'); }
  },
  renameEventField: async (token: string, oldEventField: string, newEventField: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/event-fields`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oldEventField, newEventField }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się zmienić branży wydarzenia'); }
  },
  deleteEventField: async (token: string, eventField: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/event-fields?eventField=${encodeURIComponent(eventField)}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się usunąć branży wydarzenia'); }
  },
  
  // Build types (Zabudowa targowa)
  listBuildTypes: async (token: string, query?: string): Promise<CatalogBuildType[]> => {
    const qs: string[] = [];
    if (query && query.trim()) qs.push(`query=${encodeURIComponent(query.trim())}`);
    qs.push('limit=2000');
    const url = `${config.API_BASE_URL}/api/v1/catalog/build-types${qs.length ? `?${qs.join('&')}` : ''}`;
    const res = await apiCall(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Nie udało się pobrać typów zabudowy');
    return Array.isArray(data.data) ? data.data : [];
  },
  addBuildType: async (token: string, buildType: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/build-types/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ buildType }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się dodać typu zabudowy'); }
  },
  renameBuildType: async (token: string, oldBuildType: string, newBuildType: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/build-types`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oldBuildType, newBuildType }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się zmienić typu zabudowy'); }
  },
  deleteBuildType: async (token: string, buildType: string): Promise<void> => {
    const res = await apiCall(`${config.API_BASE_URL}/api/v1/catalog/build-types?buildType=${encodeURIComponent(buildType)}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Nie udało się usunąć typu zabudowy'); }
  },
};

export interface AddExhibitionPayload {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  status?: string;
  field?:string; //LISTA ZAMKNIETA?
}

export const addExhibition = async (exhibitionData: AddExhibitionPayload, token: string): Promise<Exhibition> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(exhibitionData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Błąd podczas dodawania wydarzenia');
  }

  return response.json();
};

export const updateExhibition = async (id: number, exhibitionData: Partial<AddExhibitionPayload>, token: string): Promise<Exhibition> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(exhibitionData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Błąd podczas aktualizacji wydarzenia');
  }

  return response.json();
};

export const deleteExhibition = async (id: number, token: string): Promise<void> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitions/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Błąd podczas usuwania wydarzenia');
  }
};

// Branding Files interfaces and functions
export interface BrandingFile {
  id: number;
  fileType: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  dimensions: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  config: BrandingFileConfig;
}

export interface BrandingFileConfig {
  name: string;
  dimensions: string | null;
  allowedFormats: string[];
  maxSize: number;
}

export interface BrandingFilesResponse {
  success: boolean;
  exhibitorId: number;
  exhibitionId: number;
  files: { [fileType: string]: BrandingFile | BrandingFile[] };
  fileTypes: { [fileType: string]: BrandingFileConfig };
}

export interface UploadBrandingFileResponse {
  success: boolean;
  message: string;
  file: BrandingFile;
}

// Upload branding file
export const uploadBrandingFile = async (
  file: File,
  exhibitorId: number | null,
  exhibitionId: number,
  fileType: string,
  token: string
): Promise<UploadBrandingFileResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Only append exhibitorId if it's not null (for global event files)
  if (exhibitorId !== null) {
    formData.append('exhibitorId', exhibitorId.toString());
  }
  
  formData.append('exhibitionId', exhibitionId.toString());
  formData.append('fileType', fileType);

  if (config.DEBUG) console.log('FormData contents:', {
    file: file.name,
    exhibitorId: exhibitorId !== null ? exhibitorId.toString() : 'null (global event file)',
    exhibitionId: exhibitionId.toString(),
    fileType,
    url: `${config.API_BASE_URL}/api/v1/exhibitor-branding/upload`,
    note: exhibitorId !== null ? '👤 Exhibitor-specific branding' : '🌐 Global event branding'
  });

  const response = await fetch(`${config.API_BASE_URL}/api/v1/exhibitor-branding/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    console.error('❌ Upload response error:', response.status, response.statusText);
    try {
      const errorData = await response.json();
      console.error('❌ Error details:', errorData);
      throw new Error(errorData.message || errorData.error || 'Błąd podczas przesyłania pliku');
    } catch (parseError) {
      console.error('❌ Could not parse error response:', parseError);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }

  const result = await response.json();
  if (config.DEBUG) console.log('Upload successful');
  return result;
};

// Get branding files for exhibitor and exhibition
export const getBrandingFiles = async (
  exhibitorId: number | null,
  exhibitionId: number,
  token: string
): Promise<BrandingFilesResponse> => {
  let url;
  if (exhibitorId === null) {
    // Global event branding files
    url = `${config.API_BASE_URL}/api/v1/exhibitor-branding/global/${exhibitionId}`;
  } else {
    // Exhibitor-specific branding files  
    url = `${config.API_BASE_URL}/api/v1/exhibitor-branding/${exhibitorId}/${exhibitionId}`;
  }
  
  const response = await apiCall(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Błąd podczas pobierania plików');
  }

  return response.json();
};

// Delete branding file
export const deleteBrandingFile = async (
  fileId: number,
  exhibitorId: number | null,
  token: string
): Promise<void> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitor-branding/file/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ exhibitorId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Błąd podczas usuwania pliku');
  }
};

// Get branding file URL for preview/download
export const getBrandingFileUrl = (
  exhibitorId: number | null,
  fileName: string,
  token: string
): string => {
  if (exhibitorId === null) {
    // Global event files
    return `${config.API_BASE_URL}/api/v1/exhibitor-branding/serve/global/${fileName}?token=${encodeURIComponent(token)}`;
  }
  return `${config.API_BASE_URL}/api/v1/exhibitor-branding/serve/${exhibitorId}/${fileName}?token=${encodeURIComponent(token)}`;
};

// Get available file types
export const getBrandingFileTypes = async (token: string): Promise<{ [fileType: string]: BrandingFileConfig }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitor-branding/file-types`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Błąd podczas pobierania typów plików');
  }

  const data = await response.json();
  return data.fileTypes;
};

// Trade Info interfaces and functions
export interface TradeHours {
  exhibitorStart: string;
  exhibitorEnd: string;
  visitorStart: string;  
  visitorEnd: string;
}

export interface ContactInfo {
  guestService: string;
  security: string;
}

export interface BuildDay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface TradeSpace {
  id: string;
  name: string;
  hallName: string;
  filePath?: string | null;
  originalFilename?: string | null;
}

export interface TradeInfoData {
  tradeHours: TradeHours;
  contactInfo: ContactInfo;
  buildDays: BuildDay[];
  buildType: string;
  tradeSpaces: TradeSpace[];
  tradeMessage: string;
}

export interface TradeInfoResponse {
  success: boolean;
  data: TradeInfoData | null;
  message?: string;
}

export const saveTradeInfo = async (
  exhibitionId: number,
  tradeInfoData: TradeInfoData,
  token: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/trade-info/${exhibitionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(tradeInfoData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas zapisywania informacji targowych');
  }

  return data;
};

// Broadcast trade message to all exhibitors of the exhibition
export const broadcastTradeMessage = async (
  exhibitionId: number,
  message: string,
  token: string,
  subject?: string,
): Promise<{ success: boolean; message: string; data?: { recipients: number; sent: number; failed: number } }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/trade-info/${exhibitionId}/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message, subject }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas wysyłki komunikatu');
  }
  return data;
};

export const getTradeInfo = async (
  exhibitionId: number,
  token: string
): Promise<TradeInfoResponse> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/trade-info/${exhibitionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas pobierania informacji targowych');
  }

  return data;
};

// ============= INVITATIONS API =============

export interface InvitationData {
  id?: number;
  invitation_type: 'standard' | 'vip' | 'exhibitor' | 'guest';
  title: string;
  content: string;
  greeting: string;
  company_info: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  booth_info: string;
  special_offers: string;
  vip_value?: string; // dodatkowa wartość zaproszenia VIP
  is_template?: boolean;
  is_active?: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface InvitationStats {
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  accepted_count: number;
}

export interface InvitationWithStats extends InvitationData {
  stats: InvitationStats;
  created_by_name?: string;
}

export interface InvitationsResponse {
  success: boolean;
  message: string;
  data: {
    invitations: InvitationWithStats[];
    hasInvitations: boolean;
    totalCount: number;
  };
}

// ============= BENEFITS (MARKETING MATERIALS) API =============

export interface BenefitItem {
  id: number;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export const getBenefits = async (
  exhibitionId: number,
  token: string
): Promise<BenefitItem[]> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/marketing-materials/${exhibitionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas pobierania benefitów');
  }
  return Array.isArray(data.data) ? data.data : [];
};

export const createBenefit = async (
  exhibitionId: number,
  payload: { file: File; title: string; description: string },
  token: string
): Promise<{ success: boolean; message: string; data: BenefitItem }> => {
  const form = new FormData();
  form.append('file', payload.file);
  form.append('title', payload.title);
  form.append('description', payload.description);

  const response = await fetch(`${config.API_BASE_URL}/api/v1/marketing-materials/${exhibitionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: form,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas tworzenia benefitu');
  }
  return data;
};

export const updateBenefit = async (
  id: number,
  payload: { file?: File; title?: string; description?: string },
  token: string
): Promise<{ success: boolean; message: string; data: BenefitItem }> => {
  const form = new FormData();
  if (payload.file) form.append('file', payload.file);
  if (payload.title !== undefined) form.append('title', payload.title);
  if (payload.description !== undefined) form.append('description', payload.description);
  const response = await fetch(`${config.API_BASE_URL}/api/v1/marketing-materials/item/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: form,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas aktualizacji benefitu');
  }
  return data;
};

export const deleteBenefit = async (
  id: number,
  token: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/marketing-materials/item/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas usuwania benefitu');
  }
  return data;
};

export const saveInvitation = async (
  exhibitionId: number,
  invitationData: InvitationData,
  token: string
): Promise<{ success: boolean; message: string; data?: InvitationData }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/invitations/${exhibitionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invitationData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas zapisywania zaproszenia');
  }

  return data;
};

export const getInvitations = async (
  exhibitionId: number,
  token: string
): Promise<InvitationsResponse> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/invitations/${exhibitionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas pobierania zaproszeń');
  }

  return data;
};

export const getInvitationById = async (
  invitationId: number,
  token: string
): Promise<{ success: boolean; message: string; data: InvitationData }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/invitations/detail/${invitationId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas pobierania zaproszenia');
  }

  return data;
};

export const deleteInvitation = async (
  invitationId: number,
  token: string  
): Promise<{ success: boolean; message: string }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/invitations/detail/${invitationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas usuwania zaproszenia');
  }

  return data;
};

export const sendInvitationTest = async (
  exhibitionId: number,
  payload: { templateId?: number; recipientName?: string; recipientEmail: string },
  token: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/invitations/${exhibitionId}/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas wysyłki testowego zaproszenia');
  }
  return data;
};

// ============= EXHIBITOR ASSIGNMENT API =============

export const assignExhibitorToEvent = async (
  exhibitorId: number,
  exhibitionId: number,
  token: string,
  supervisorUserId?: number | null,
  hallName?: string | null,
  standNumber?: string | null,
  boothArea?: number | null,
): Promise<{ success: boolean; message: string; assignment: any }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors/${exhibitorId}/assign-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      exhibitionId,
      supervisorUserId: supervisorUserId ?? null,
      hallName: hallName ?? null,
      standNumber: standNumber ?? null,
      boothArea: typeof boothArea === 'number' ? boothArea : boothArea ?? null,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Błąd podczas przypisywania wystawcy do wydarzenia');
  }

  return data;
};

export const unassignExhibitorFromEvent = async (
  exhibitorId: number,
  exhibitionId: number,
  token: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors/${exhibitorId}/assign-event/${exhibitionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Błąd podczas odłączania wystawcy od wydarzenia');
  }
  return data;
};

export const fetchExhibitorAssignment = async (
  exhibitorId: number,
  exhibitionId: number,
  token: string
): Promise<{ success: boolean; data: { supervisorUserId: number | null; hallName: string; standNumber: string; boothArea: string } | null }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors/${exhibitorId}/assign-event/${exhibitionId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Błąd podczas pobierania szczegółów przypisania');
  }
  return data;
};

// ============= TRADE PLAN FILES API =============

export interface TradePlanUploadResponse {
  success: boolean;
  message: string;
  file: {
    filename: string;
    originalname: string;
    path: string;
    size: number;
  };
}

export const uploadTradePlan = async (
  file: File,
  exhibitionId: number,
  spaceId: string,
  token: string
): Promise<TradePlanUploadResponse> => {
  const formData = new FormData();
  formData.append('tradePlan', file);
  formData.append('spaceId', spaceId);

  if (config.DEBUG) console.log('Uploading trade plan:', {
    file: file.name,
    exhibitionId,
    spaceId,
    url: `${config.API_BASE_URL}/api/v1/trade-info/${exhibitionId}/upload/${spaceId}`
  });

  const response = await fetch(`${config.API_BASE_URL}/api/v1/trade-info/${exhibitionId}/upload/${spaceId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    console.error('❌ Upload response error:', response.status, response.statusText);
    try {
      const errorData = await response.json();
      console.error('❌ Error details:', errorData);
      throw new Error(errorData.message || 'Błąd podczas przesyłania pliku');
    } catch (parseError) {
      console.error('❌ Could not parse error response:', parseError);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }

  const result = await response.json();
  if (config.DEBUG) console.log('Trade plan upload successful');
  return result;
};

export const downloadTradePlan = async (
  exhibitionId: number,
  spaceId: string,
  token: string
): Promise<Blob> => {
  if (config.DEBUG) console.log('Downloading trade plan:', {
    exhibitionId,
    spaceId,
    url: `${config.API_BASE_URL}/api/v1/trade-info/${exhibitionId}/download/${spaceId}`
  });

  const response = await fetch(`${config.API_BASE_URL}/api/v1/trade-info/${exhibitionId}/download/${spaceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    console.error('❌ Download response error:', response.status, response.statusText);
    try {
      const errorData = await response.json();
      console.error('❌ Error details:', errorData);
      throw new Error(errorData.message || 'Błąd podczas pobierania pliku');
    } catch (parseError) {
      console.error('❌ Could not parse error response:', parseError);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }

  const blob = await response.blob();
  if (config.DEBUG) console.log('Trade plan download successful');
  return blob;
}; 

// ============= TRADE EVENTS API =============

export interface TradeEvent {
  id?: number;
  exhibition_id?: number;
  exhibitor_id?: number;
  name: string;
  eventDate: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  hall?: string;
  description?: string;
  type: string; // e.g. 'Ceremonia otwarcia'
  organizer?: string;
  link?:string;
  eventSource?: 'official_events' | 'construction';
  event_source?: string; // From backend (snake_case)
  booth_number?: string; // Booth/stand number for exhibitor events
  is_in_agenda?: boolean; // Whether event should be shown in exhibitor portal
}

// normalize helpers to keep consistent date/time formats
const toDateOnly = (value?: string): string => {
  if (!value) return '';
  // expect formats like YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ
  return value.length >= 10 ? value.slice(0, 10) : value;
};

const toTimeHM = (value?: string): string => {
  if (!value) return '';
  // accept HH:mm or HH:mm:ss
  return value.length >= 5 ? value.slice(0, 5) : value;
};

const mapTradeEventRow = (row: any): TradeEvent => ({
  id: row.id,
  exhibition_id: row.exhibition_id,
  exhibitor_id: row.exhibitor_id,
  name: row.name,
  eventDate: toDateOnly(row.event_date ?? row.eventDate),
  startTime: toTimeHM(row.start_time ?? row.startTime),
  endTime: toTimeHM(row.end_time ?? row.endTime),
  hall: row.hall ?? undefined,
  description: row.description ?? undefined,
  type: row.type,
  organizer: row.organizer ?? undefined,
  link: row.link ?? undefined,
  event_source: row.event_source ?? undefined,
  booth_number: row.booth_number ?? undefined,
  is_in_agenda: row.is_in_agenda ?? false,
});

export const getTradeEvents = async (
  exhibitionId: number,
  token: string,
  exhibitorId?: number
): Promise<{ success: boolean; data: TradeEvent[] }> => {
  const query = exhibitorId ? `?exhibitorId=${encodeURIComponent(String(exhibitorId))}` : '';
  const url = `${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}${query}`;
  if (config.DEBUG) console.log('GET trade-events url:', url);
  const response = await apiCall(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await response.json();
  if (config.DEBUG) console.log('GET trade-events raw:', data);
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas pobierania wydarzeń targowych');
  }
  const list = Array.isArray(data.data) ? data.data.map(mapTradeEventRow) : [];
  if (config.DEBUG) console.log('GET trade-events mapped:', list);
  return { success: true, data: list };
};

export const createTradeEvent = async (
  exhibitionId: number,
  event: TradeEvent,
  token: string
): Promise<{ success: boolean; data: TradeEvent }> => {
  const url = `${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}`;
  if (config.DEBUG) console.log('POST trade-event payload:', event);
  const response = await apiCall(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  const data = await response.json();
  if (config.DEBUG) console.log('POST trade-event response:', data);
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas zapisywania wydarzenia targowego');
  }
  return { success: true, data: mapTradeEventRow(data.data) };
};

export const updateTradeEvent = async (
  exhibitionId: number,
  eventId: number,
  event: TradeEvent,
  token: string
): Promise<{ success: boolean; data: TradeEvent }> => {
  const url = `${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}/${eventId}`;
  if (config.DEBUG) console.log('PUT trade-event payload:', { eventId, event });
  const response = await apiCall(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  const data = await response.json();
  if (config.DEBUG) console.log('PUT trade-event response:', data);
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas aktualizacji wydarzenia targowego');
  }
  return { success: true, data: mapTradeEventRow(data.data) };
};

export const deleteTradeEvent = async (
  exhibitionId: number,
  eventId: number,
  token: string
): Promise<{ success: boolean; message: string }> => {
  const url = `${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}/${eventId}`;
  if (config.DEBUG) console.log('DELETE trade-event url:', url);
  const response = await apiCall(url , {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (config.DEBUG) console.log('DELETE trade-event response:', data);
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas usuwania wydarzenia targowego');
  }
  return data;
};

export const updateTradeEventAgendaStatus = async (
  exhibitionId: number,
  eventId: number,
  isInAgenda: boolean,
  token: string
): Promise<{ success: boolean; data: TradeEvent }> => {
  const url = `${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}/${eventId}/agenda`;
  if (config.DEBUG) console.log('PATCH trade-event agenda url:', url);
  const response = await apiCall(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ isInAgenda }),
  });
  const data = await response.json();
  if (config.DEBUG) console.log('PATCH trade-event agenda response:', data);
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas aktualizacji statusu agendy');
  }
  return { success: true, data: mapTradeEventRow(data.data) };
};

// ============= EXHIBITOR DOCUMENTS API =============

export type ExhibitorDocumentCategory = 'faktury' | 'umowy' | 'inne_dokumenty';

export interface ExhibitorDocument {
  id: number;
  title: string;
  description?: string | null;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: ExhibitorDocumentCategory;
  createdAt: string;
  uploadedBy?: number | null;
  uploadedByRole?: string | null;
  documentSource?: 'admin_exhibitor_card' | 'exhibitor_self' | 'admin_other' | 'exhibitor_checklist_materials' | 'catalog_images';
}

export const getExhibitorDocuments = async (
  exhibitorId: number,
  exhibitionId: number,
  token: string,
  opts?: { selfOnly?: boolean }
): Promise<ExhibitorDocument[]> => {
  const qs = opts?.selfOnly ? '?selfOnly=1' : '';
  const url = `${config.API_BASE_URL}/api/v1/exhibitor-documents/${exhibitorId}/${exhibitionId}${qs}`;
  if (config.DEBUG) console.log('GET documents', url);
  const response = await apiCall(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Błąd podczas pobierania dokumentów');
  }
  // Map DB fields to interface
  return Array.isArray(data.documents) ? data.documents.map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    fileName: row.file_name,
    originalName: row.original_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    category: row.category,
    createdAt: row.created_at,
    uploadedBy: row.uploaded_by ?? null,
    uploadedByRole: row.uploaded_by_role ?? null,
    documentSource: row.document_source ?? 'exhibitor_self',
  })) : [];
};

export const uploadExhibitorDocument = async (
  file: File,
  exhibitorId: number,
  exhibitionId: number,
  category: ExhibitorDocumentCategory,
  token: string,
  documentSource: 'admin_exhibitor_card' | 'exhibitor_self' | 'admin_other' | 'exhibitor_checklist_materials' | 'catalog_images' = 'admin_exhibitor_card'
): Promise<{ success: boolean; message: string; document: ExhibitorDocument }> => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('title', file.name);
  formData.append('category', category);
  formData.append('documentSource', documentSource);
  const url = `${config.API_BASE_URL}/api/v1/exhibitor-documents/${exhibitorId}/${exhibitionId}/upload`;
  if (config.DEBUG) console.log('POST upload document', { file: file.name });
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Błąd podczas przesyłania dokumentu');
  }
  return {
    success: true,
    message: data.message,
    document: {
      id: data.document.id,
      title: data.document.title,
      description: data.document.description ?? null,
      fileName: data.document.fileName,
      originalName: data.document.originalName,
      fileSize: data.document.fileSize,
      mimeType: data.document.mimeType,
      category: data.document.category,
      createdAt: data.document.createdAt,
    },
  };
};

export const deleteExhibitorDocument = async (
  exhibitorId: number,
  exhibitionId: number,
  documentId: number,
  token: string
): Promise<{ success: boolean; message: string }> => {
  const url = `${config.API_BASE_URL}/api/v1/exhibitor-documents/${exhibitorId}/${exhibitionId}/${documentId}`;
  if (config.DEBUG) console.log('DELETE document', url);
  const response = await apiCall(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Błąd podczas usuwania dokumentu');
  }
  return data;
};

export const downloadExhibitorDocument = async (
  exhibitorId: number,
  exhibitionId: number,
  documentId: number,
  filename: string,
  token: string
): Promise<void> => {
  const url = `${config.API_BASE_URL}/api/v1/exhibitor-documents/${exhibitorId}/${exhibitionId}/download/${documentId}`;
  if (config.DEBUG) console.log('DOWNLOAD document', filename);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Błąd podczas pobierania dokumentu');
    } catch (e) {
      throw new Error(`Błąd podczas pobierania dokumentu: ${response.status} ${response.statusText}`);
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename || 'document';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
};

// Send message to exhibitor regarding documents and log to communications/news
export const sendExhibitorDocumentMessage = async (
  exhibitorId: number,
  exhibitionId: number,
  message: string,
  token: string
): Promise<{ success: boolean; message: string }> => {
  const url = `${config.API_BASE_URL}/api/v1/exhibitor-documents/${exhibitorId}/${exhibitionId}/message`;
  const response = await apiCall(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Nie udało się wysłać wiadomości');
  }
  return data;
};

// ===== Exhibitor Awards Messages (Admin) =====
export interface AwardMessageRow { id: number; message: string; created_at: string }

export const listExhibitorAwardMessages = async (
  exhibitorId: number,
  exhibitionId: number,
  token: string
): Promise<AwardMessageRow[]> => {
  const res = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitor-awards/${exhibitorId}/${exhibitionId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Błąd podczas pobierania wiadomości');
  return Array.isArray(data?.data) ? data.data : [];
};

export const addExhibitorAwardMessage = async (
  exhibitorId: number,
  exhibitionId: number,
  message: string,
  token: string
): Promise<AwardMessageRow> => {
  const res = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitor-awards/${exhibitorId}/${exhibitionId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Błąd podczas zapisu wiadomości');
  return data.data as AwardMessageRow;
};

// ===== Invitations (Admin) =====
export interface InvitationRecipientRow {
  id: number;
  recipientEmail: string;
  recipientName?: string | null;
  invitationType: string;
  status: string; // 'wysłane' | 'pending' | 'accepted' | ...
  sentAt?: string | null;
}

export const listInvitationRecipients = async (
  exhibitionId: number,
  token: string,
  exhibitorId?: number
): Promise<InvitationRecipientRow[]> => {
  const query = exhibitorId ? `?exhibitorId=${encodeURIComponent(String(exhibitorId))}` : '';
  const url = `${config.API_BASE_URL}/api/v1/invitations/${exhibitionId}/recipients${query}`;
  const res = await apiCall(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Błąd podczas pobierania listy zaproszeń');
  }
  const arr = Array.isArray(data?.data) ? data.data : [];
  return arr;
};

// Get invitation limit for exhibitor-exhibition
export const getInvitationLimit = async (
  exhibitorId: number,
  exhibitionId: number,
  token: string
): Promise<number> => {
  const url = `${config.API_BASE_URL}/api/v1/exhibitors/${exhibitorId}/${exhibitionId}/invitation-limit`;
  const res = await apiCall(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Błąd podczas pobierania limitu zaproszeń');
  }
  return data?.data?.invitationLimit || 50;
};

// Update invitation limit for exhibitor-exhibition (admin only)
export const updateInvitationLimit = async (
  exhibitorId: number,
  exhibitionId: number,
  invitationLimit: number,
  token: string
): Promise<number> => {
  const url = `${config.API_BASE_URL}/api/v1/exhibitors/${exhibitorId}/${exhibitionId}/invitation-limit`;
  const res = await apiCall(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ invitationLimit })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Błąd podczas aktualizacji limitu zaproszeń');
  }
  return data?.data?.invitationLimit || invitationLimit;
};

// Trade Plan Links
export interface TradePlanLink {
  id: number;
  exhibition_id: number;
  title: string;
  url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const listTradePlanLinks = async (exhibitionId: number, token: string): Promise<TradePlanLink[]> => {
  const res = await fetch(`${config.API_BASE_URL}/api/v1/trade-plan-links/${exhibitionId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Błąd podczas pobierania linków');
  }
  return data?.data || [];
};

export const createTradePlanLink = async (exhibitionId: number, title: string, url: string, token: string): Promise<TradePlanLink> => {
  const res = await fetch(`${config.API_BASE_URL}/api/v1/trade-plan-links/${exhibitionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, url })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Błąd podczas tworzenia linku');
  }
  return data?.data;
};

export const updateTradePlanLink = async (linkId: number, title: string, url: string, token: string): Promise<TradePlanLink> => {
  const res = await fetch(`${config.API_BASE_URL}/api/v1/trade-plan-links/link/${linkId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, url })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Błąd podczas aktualizacji linku');
  }
  return data?.data;
};

export const deleteTradePlanLink = async (linkId: number, token: string): Promise<void> => {
  const res = await fetch(`${config.API_BASE_URL}/api/v1/trade-plan-links/link/${linkId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Błąd podczas usuwania linku');
  }
};

// Trade Message History
export interface TradeMessage {
  id: number;
  title: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const getTradeMessageHistory = async (exhibitionId: number, token: string): Promise<TradeMessage[]> => {
  const res = await fetch(`${config.API_BASE_URL}/api/v1/trade-info/${exhibitionId}/messages`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Błąd podczas pobierania historii wiadomości');
  }
  return data?.data || [];
};

// ===== INVITATIONS =====
export interface InvitationRecipient {
  id: number;
  recipient_email: string;
  recipient_name: string | null;
  recipient_company: string | null;
  sent_at: string | null;
  opened_at: string | null;
  responded_at: string | null;
  response_status: string;
  created_at: string;
  template_id: number;
  template_title: string;
  invitation_type: string;
  exhibition_id: number;
  exhibition_name: string;
  exhibition_start_date: string;
  exhibition_end_date: string;
  exhibitor_id: number | null;
  company_name: string | null;
  exhibitor_email: string | null;
  exhibitor_phone: string | null;
}

export interface InvitationsSummary {
  totalInvitations: number;
  sent: number;
  opened: number;
  accepted: number;
  pending: number;
  uniqueExhibitors: number;
  uniqueExhibitions: number;
}

export interface AllInvitationsResponse {
  success: boolean;
  data: InvitationRecipient[];
  summary: InvitationsSummary;
}

export interface InvitationsFilters {
  exhibitionId?: string | number;
  exhibitorId?: string | number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const fetchAllInvitations = async (
  token: string,
  filters?: InvitationsFilters
): Promise<AllInvitationsResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.exhibitionId) params.append('exhibitionId', String(filters.exhibitionId));
  if (filters?.exhibitorId) params.append('exhibitorId', String(filters.exhibitorId));
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const url = `${config.API_BASE_URL}/api/v1/invitations/admin/all${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await apiCall(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.message || 'Błąd podczas pobierania zaproszeń');
  }

  return await response.json();
};

export const exportInvitationsCSV = (
  token: string,
  filters?: InvitationsFilters
): void => {
  const params = new URLSearchParams();
  
  if (filters?.exhibitionId) params.append('exhibitionId', String(filters.exhibitionId));
  if (filters?.exhibitorId) params.append('exhibitorId', String(filters.exhibitorId));
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);

  const url = `${config.API_BASE_URL}/api/v1/invitations/admin/export-csv?${params.toString()}&token=${encodeURIComponent(token)}`;
  
  // Open in new window to trigger download
  window.open(url, '_blank');
};