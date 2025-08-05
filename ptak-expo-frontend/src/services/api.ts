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
}

const apiCall = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      // Add credentials: 'include' to all requests for CORS
      const requestOptions = {
        ...options,
        credentials: 'include' as RequestCredentials
      };
      
      const response = await fetch(url, requestOptions);
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

//
export interface AddUserPayloadByAdmin {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}


export const addUserByAdmin = async (userData: AddUserPayloadByAdmin, token: string): Promise<any> => {
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
  exhibitionId?: number | undefined;
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

export interface AddExhibitionPayload {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  status?: string;
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
  files: { [fileType: string]: BrandingFile };
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
  exhibitorId: number,
  exhibitionId: number,
  fileType: string,
  token: string
): Promise<UploadBrandingFileResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('exhibitorId', exhibitorId.toString());
  formData.append('exhibitionId', exhibitionId.toString());
  formData.append('fileType', fileType);

  console.log('📤 FormData contents:', {
    file: file.name,
    exhibitorId: exhibitorId.toString(),
    exhibitionId: exhibitionId.toString(),
    fileType,
    url: `${config.API_BASE_URL}/api/v1/exhibitor-branding/upload`,
    note: exhibitorId === 2 ? '🔧 Admin uploading for default exhibitor' : '👤 User uploading for themselves'
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
  console.log('✅ Upload successful:', result);
  return result;
};

// Get branding files for exhibitor and exhibition
export const getBrandingFiles = async (
  exhibitorId: number,
  exhibitionId: number,
  token: string
): Promise<BrandingFilesResponse> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitor-branding/${exhibitorId}/${exhibitionId}`, {
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
  exhibitorId: number,
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
  exhibitorId: number,
  fileName: string,
  token: string
): string => {
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

// ============= EXHIBITOR ASSIGNMENT API =============

export const assignExhibitorToEvent = async (
  exhibitorId: number, 
  exhibitionId: number, 
  token: string
): Promise<{ success: boolean; message: string; assignment: any }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors/${exhibitorId}/assign-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ exhibitionId }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Błąd podczas przypisywania wystawcy do wydarzenia');
  }

  return data;
}; 