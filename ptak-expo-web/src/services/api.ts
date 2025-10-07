import axios, { AxiosInstance, AxiosResponse } from 'axios';
import config from '../config/config';

interface LoginCredentials {
  email: string;
  password: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: any): any => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: any) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data with correct keys
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Use React Router navigation instead of hard redirect to prevent loops
      console.log('401 Unauthorized - token expired or invalid');
    }
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  // Exhibitor login (for ptak-expo-web)
  login: (credentials: LoginCredentials): Promise<AxiosResponse<ApiResponse>> => 
    api.post('/api/v1/auth/exhibitor-login', credentials),
  
  // Verify token
  verify: (): Promise<AxiosResponse<ApiResponse>> => 
    api.get('/api/v1/auth/verify'),
  
  // Logout
  logout: (): Promise<AxiosResponse<ApiResponse>> => 
    api.post('/api/v1/auth/logout'),
  
  // Test endpoint
  test: (): Promise<AxiosResponse<ApiResponse>> => 
    api.get('/api/v1/auth/test'),
};

// Exhibitions API methods
export const exhibitionsAPI = {
  // Get exhibitor's events
  getMyEvents: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/api/v1/exhibitions/user-events'),
  // Get single exhibition by id
  getById: (id: number): Promise<AxiosResponse<any>> =>
    api.get(`/api/v1/exhibitions/${id}`),
};

// Trade Info API methods (viewer for exhibitors)
export const tradeInfoAPI = {
  get: (exhibitionId: number): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/api/v1/trade-info/${exhibitionId}`),
  downloadPlan: (exhibitionId: number, spaceId: string): Promise<AxiosResponse<Blob>> =>
    api.get(`/api/v1/trade-info/${exhibitionId}/download/${spaceId}`, { responseType: 'blob' }),
};

// Branding files (global per exhibition)
export interface BrandingFilesResponse {
  success: boolean;
  exhibitorId: number;
  exhibitionId: number;
  files: Record<string, {
    id: number;
    fileType: string;
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    dimensions: string | null;
    createdAt: string;
    updatedAt?: string;
  }>;
}

export const brandingAPI = {
  getGlobal: (exhibitionId: number): Promise<AxiosResponse<BrandingFilesResponse>> =>
    api.get(`/api/v1/exhibitor-branding/global/${exhibitionId}`),
  serveGlobalUrl: (fileName: string): string => {
    const base = `${config.API_BASE_URL}/api/v1/exhibitor-branding/serve/global/${encodeURIComponent(fileName)}`;
    const token = localStorage.getItem('authToken');
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  },
  getForExhibitor: (exhibitorId: number, exhibitionId: number): Promise<AxiosResponse<BrandingFilesResponse>> =>
    api.get(`/api/v1/exhibitor-branding/${exhibitorId}/${exhibitionId}`),
  serveExhibitorUrl: (exhibitorId: number, fileName: string): string => {
    const base = `${config.API_BASE_URL}/api/v1/exhibitor-branding/serve/${encodeURIComponent(String(exhibitorId))}/${encodeURIComponent(fileName)}`;
    const token = localStorage.getItem('authToken');
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  },
};

// Health check
export const healthAPI = {
  check: (): Promise<AxiosResponse<ApiResponse>> => 
    api.get('/api/v1/health'),
};

// ============= PUBLIC API (no auth required) =============
export const publicAPI = {
  // List all exhibitions ordered by start_date
  listExhibitions: (): Promise<AxiosResponse<{ success: boolean; data: any[] }>> =>
    api.get('/public/exhibitions'),
  // List exhibitors for a given exhibition including catalog details and products
  listExhibitorsByExhibition: (
    exhibitionId: number
  ): Promise<AxiosResponse<{ success: boolean; exhibitionId: number; exhibitors: any[] }>> =>
    api.get(`/public/exhibitions/${exhibitionId}/exhibitors`),
  // Absolute RSS feed URL
  rssUrl: (): string => `${config.API_BASE_URL}/public/rss`,
};

// Invitations templates (marketing materials analog) - backend exposes /api/v1/invitations/:exhibitionId
export interface InvitationTemplate {
  id: number;
  title: string;
  invitation_type: string;
  content?: string;
  greeting?: string;
  company_info?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  booth_info?: string;
  special_offers?: string;
  vip_value?: string | null;
}

export const invitationsAPI = {
  getById: async (
    invitationId: number
  ): Promise<{
    id: number;
    exhibition_title?: string;
    title: string;
    invitation_type: string;
    content?: string;
    greeting?: string;
    company_info?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    booth_info?: string;
    special_offers?: string;
    vip_value?: string | null;
  } | null> => {
    const res = await api.get(`/api/v1/invitations/item/${invitationId}`);
    const data = res.data as { success?: boolean; data?: any };
    if (!data?.data) return null;
    const t = data.data;
    return {
      id: t.id,
      exhibition_title: t.exhibition_title,
      title: t.title,
      invitation_type: t.invitation_type,
      content: t.content,
      greeting: t.greeting,
      company_info: t.company_info,
      contact_person: t.contact_person,
      contact_email: t.contact_email,
      contact_phone: t.contact_phone,
      booth_info: t.booth_info,
      special_offers: t.special_offers,
      vip_value: t.vip_value ?? null,
    };
  },
  list: async (exhibitionId: number): Promise<InvitationTemplate[]> => {
    const res = await api.get(`/api/v1/invitations/${exhibitionId}`);
    const data = res.data as { success?: boolean; data?: { invitations: any[] } };
    const arr = Array.isArray(data?.data?.invitations) ? data!.data!.invitations : [];
    return arr.map((row: any) => ({
      id: row.id,
      title: row.title || row.name || 'Zaproszenie',
      invitation_type: row.invitation_type || 'standard',
      content: row.content,
      greeting: row.greeting,
      company_info: row.company_info,
      contact_person: row.contact_person,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      booth_info: row.booth_info,
      special_offers: row.special_offers,
      vip_value: row.vip_value ?? null,
    }));
  },
  send: async (
    exhibitionId: number,
    templateId: number,
    recipientName: string,
    recipientEmail: string,
    htmlOverride?: string
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
    const res = await api.post(`/api/v1/invitations/${exhibitionId}/send`, {
      templateId,
      recipientName,
      recipientEmail,
      htmlOverride,
    });
    return res.data;
  },
  recipients: async (
    exhibitionId: number
  ): Promise<Array<{ id: number; recipientName: string; recipientEmail: string; invitationType: string; status: string; sentAt?: string }>> => {
    const res = await api.get(`/api/v1/invitations/${exhibitionId}/recipients`);
    const data = res.data as { success?: boolean; data?: any[] };
    return Array.isArray(data?.data) ? data!.data! : [];
  },
  getLimit: async (
    exhibitorId: number,
    exhibitionId: number
  ): Promise<number> => {
    const res = await api.get(`/api/v1/exhibitors/${exhibitorId}/${exhibitionId}/invitation-limit`);
    const data = res.data as { success?: boolean; data?: { invitationLimit?: number } };
    return data?.data?.invitationLimit || 50;
  }
};

// Marketing materials (benefits) for exhibitions
export interface BenefitItem {
  id: number;
  title: string;
  description?: string | null;
  file_url?: string | null;
  file_type?: string | null;
}

export const marketingAPI = {
  listByExhibition: async (exhibitionId: number): Promise<BenefitItem[]> => {
    const res = await api.get(`/api/v1/marketing-materials/${exhibitionId}`);
    const data = res.data as { success?: boolean; data?: any[] };
    const arr = Array.isArray(data?.data) ? data!.data! : [];
    return arr.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      file_url: row.file_url ?? null,
      file_type: row.file_type ?? null,
    }));
  },
};

// ============= NEWS (Aktualności) API =============
export interface NewsItemDto {
  kind: string;
  title: string;
  description: string;
  timestamp: string;
}

export const newsAPI = {
  listByExhibition: async (exhibitionId: number): Promise<NewsItemDto[]> => {
    const res = await api.get(`/api/v1/news/${exhibitionId}`);
    const data = res.data as { success?: boolean; data?: any[] };
    return Array.isArray(data?.data) ? data!.data! : [];
  },
};

// ============= EXHIBITOR SELF API (ptak-expo-web) =============

export interface ExhibitorProfile {
  id: number;
  nip?: string;
  companyName: string;
  address?: string;
  postalCode?: string;
  city?: string;
  contactPerson?: string;
  contactRole?: string;
  phone?: string;
  email: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const exhibitorsSelfAPI = {
  getMe: (): Promise<AxiosResponse<{ success: boolean; data: ExhibitorProfile }>> =>
    api.get('/api/v1/exhibitors/me'),
};

// User avatar (served as img, token via query string)
export const userAvatarUrl = (userId: number): string => {
  const token = localStorage.getItem('authToken');
  const base = `${config.API_BASE_URL}/api/v1/users/${userId}/avatar`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
};

// ============= EXHIBITOR DOCUMENTS API (ptak-expo-web) =============

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
  documentSource?: 'admin_exhibitor_card' | 'exhibitor_self' | 'admin_other' | 'exhibitor_checklist_materials';
}

export const exhibitorDocumentsAPI = {
  list: async (
    exhibitorId: number,
    exhibitionId: number
  ): Promise<ExhibitorDocument[]> => {
    const res = await api.get(`/api/v1/exhibitor-documents/${exhibitorId}/${exhibitionId}`);
    const data = res.data as { success?: boolean; documents?: any[] };
    const rows = Array.isArray(data?.documents) ? data.documents : [];
    return rows.map((row: any) => ({
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
    }));
  },
  download: async (
    exhibitorId: number,
    exhibitionId: number,
    documentId: number
  ): Promise<AxiosResponse<Blob>> => {
    return api.get(
      `/api/v1/exhibitor-documents/${exhibitorId}/${exhibitionId}/download/${documentId}`,
      { responseType: 'blob' }
    );
  },
  // Upload catalog image (logo or product image) via exhibitor-documents
  uploadCatalogImage: async (
    exhibitorId: number,
    exhibitionId: number,
    file: File,
    imageType: 'logo' | 'product'
  ): Promise<string> => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', `${imageType}_${file.name}`);
    formData.append('category', 'inne_dokumenty');
    formData.append('documentSource', 'exhibitor_checklist_materials');
    
    const res = await api.post(
      `/api/v1/exhibitor-documents/${exhibitorId}/${exhibitionId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    const data = res.data as { success?: boolean; document?: { fileName: string } };
    if (!data.success || !data.document?.fileName) {
      throw new Error('Upload failed');
    }
    
    // Return file name to be saved in catalog
    return data.document.fileName;
  },
};

// ============= TRADE EVENTS API (ptak-expo-web) =============

export interface TradeEventRow {
  id: number;
  exhibition_id?: number;
  exhibitor_id?: number | null;
  name: string;
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS or HH:MM
  end_time: string;   // HH:MM:SS or HH:MM
  hall?: string | null;
  organizer?: string | null;
  description?: string | null;
  type?: string | null;
  link?: string | null;
  event_source?: string | null; // 'official_events' | 'construction'
  is_in_agenda?: boolean | null; // Whether event should be shown in exhibitor portal
}

export const tradeEventsAPI = {
  listByExhibition: async (
    exhibitionId: number,
    exhibitorId?: number
  ): Promise<TradeEventRow[]> => {
    const res = await api.get(`/api/v1/trade-events/${exhibitionId}`, {
      params: { exhibitorId },
    });
    const data = res.data as { success?: boolean; data?: TradeEventRow[] };
    return Array.isArray(data?.data) ? data!.data! : [];
  },
};

export default api;