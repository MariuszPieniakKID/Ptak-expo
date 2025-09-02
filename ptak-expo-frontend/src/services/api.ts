import config from '../config/config';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
}

export interface ExhibitorPerson {
  id: number;
  fullName: string;
  email: string | null;
  type: string | null;
  exhibitorId: number;
  exhibitorCompanyName: string;
  exhibitionId?: number | null;
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
  trade?:'Dom'|'Budownictwo'|'Inne';//TODOO
  event_logo_file_name?: string | null;
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

// People (E-identyfikatory) API
export const fetchExhibitorPeople = async (token: string, exhibitionId?: number): Promise<ExhibitorPerson[]> => {
  const query = typeof exhibitionId === 'number' ? `?exhibitionId=${encodeURIComponent(String(exhibitionId))}` : '';
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

  console.log('📤 FormData contents:', {
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
  console.log('✅ Upload successful:', result);
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
  token: string,
  supervisorUserId?: number | null,
): Promise<{ success: boolean; message: string; assignment: any }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/exhibitors/${exhibitorId}/assign-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ exhibitionId, supervisorUserId: supervisorUserId ?? null }),
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

  console.log('📤 Uploading trade plan:', {
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
  console.log('✅ Trade plan upload successful:', result);
  return result;
};

export const downloadTradePlan = async (
  exhibitionId: number,
  spaceId: string,
  token: string
): Promise<Blob> => {
  console.log('📥 Downloading trade plan:', {
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
  console.log('✅ Trade plan download successful');
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
}

const mapTradeEventRow = (row: any): TradeEvent => ({
  id: row.id,
  exhibition_id: row.exhibition_id,
  exhibitor_id: row.exhibitor_id,
  name: row.name,
  eventDate: row.event_date ?? row.eventDate,
  startTime: row.start_time ?? row.startTime,
  endTime: row.end_time ?? row.endTime,
  hall: row.hall ?? undefined,
  description: row.description ?? undefined,
  type: row.type,
  organizer: row.organizer ?? undefined,
});

export const getTradeEvents = async (
  exhibitionId: number,
  token: string,
  exhibitorId?: number
): Promise<{ success: boolean; data: TradeEvent[] }> => {
  const query = exhibitorId ? `?exhibitorId=${encodeURIComponent(String(exhibitorId))}` : '';
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}${query}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas pobierania wydarzeń targowych');
  }
  return { success: true, data: Array.isArray(data.data) ? data.data.map(mapTradeEventRow) : [] };
};

export const createTradeEvent = async (
  exhibitionId: number,
  event: TradeEvent,
  token: string
): Promise<{ success: boolean; data: TradeEvent }> => {
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  const data = await response.json();
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
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}/${eventId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  const data = await response.json();
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
  const response = await apiCall(`${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}/${eventId}` , {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Błąd podczas usuwania wydarzenia targowego');
  }
  return data;
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
}

export const getExhibitorDocuments = async (
  exhibitorId: number,
  exhibitionId: number,
  token: string
): Promise<ExhibitorDocument[]> => {
  const url = `${config.API_BASE_URL}/api/v1/exhibitor-documents/${exhibitorId}/${exhibitionId}`;
  if (config.DEBUG) console.log('[api] GET documents', url);
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
  })) : [];
};

export const uploadExhibitorDocument = async (
  file: File,
  exhibitorId: number,
  exhibitionId: number,
  category: ExhibitorDocumentCategory,
  token: string
): Promise<{ success: boolean; message: string; document: ExhibitorDocument }> => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('title', file.name);
  formData.append('category', category);
  const url = `${config.API_BASE_URL}/api/v1/exhibitor-documents/${exhibitorId}/${exhibitionId}/upload`;
  if (config.DEBUG) console.log('[api] POST upload document', { url, file: file.name, exhibitorId, exhibitionId, category });
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
  if (config.DEBUG) console.log('[api] DELETE document', url);
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
  if (config.DEBUG) console.log('[api] DOWNLOAD document', { url, exhibitorId, exhibitionId, documentId, filename });

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