import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import styles from "./MarketingPage.module.scss";
import {useAuth} from "../../../contexts/AuthContext";
import {
  exhibitorsSelfAPI,
  brandingAPI,
} from "../../../services/api";
import IconMain from "../../../assets/group-21.png";
import CustomTypography from "../../../components/customTypography/CustomTypography";
import IconDownload from "../../../assets/group-914.png";
import IconLoader from "../../../assets/loader.png";
import IconPdf from "../../../assets/pdf.png";

type T_File = {
  id: number;
  mimeType: string;
  originalName: string;
  title: string;
  src: string;
};

export const MarketingPage: React.FC = () => {
  const [isFetchingFileId, setIsFetchingFileId] = useState<number | null>(null);
  const {eventId} = useParams<{eventId: string}>();
  const {token, isAuthenticated} = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // For "Pozostałe dokumenty" we will show exhibitor branding docs only (not generic exhibitor-documents uploads)

  // Branding files grouped for this exhibition (global)
  const [brandingLogos, setBrandingLogos] = useState<T_File[]>([]);
  const [brandingBanners, setBrandingBanners] = useState<T_File[]>([]);
  const [brandingDocs, setBrandingDocs] = useState<{ id: number; originalName: string; mimeType: string; url: string }[]>([]);
  const [exhibitorBrandingDocs, setExhibitorBrandingDocs] = useState<{ id: number; originalName: string; mimeType: string; url: string }[]>([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!isAuthenticated || !token || !eventId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to get exhibitor profile; if not found (404), skip exhibitor-specific documents
        let exhibitorId: number | null = null;
        try {
          const profileResponse = await exhibitorsSelfAPI.getMe();
          exhibitorId = profileResponse.data.data.id;
        } catch (e: any) {
          const msg = e?.response?.data?.message || e?.message || '';
          // Ignore missing exhibitor error and proceed with branding-only content
          if (!String(msg).toLowerCase().includes('wystawca nie został znaleziony')) {
            // Other errors should be surfaced
            throw e;
          }
        }

        // Skip generic exhibitor-documents for "Pozostałe dokumenty" section

        // Fetch branding files (global per exhibition) and exhibitor-scoped branding documents
        try {
          const res = await brandingAPI.getGlobal(parseInt(eventId));
          const files = (res.data && (res.data as any).files) || {};
          const logos: T_File[] = [];
          const banners: T_File[] = [];
          const docs: { id: number; originalName: string; mimeType: string; url: string }[] = [];

          const pushSingle = (fileObj: any, fallbackTitle?: string) => {
            if (!fileObj) return;
            const url = brandingAPI.serveGlobalUrl(fileObj.fileName);
            logos.push({
              id: fileObj.id,
              mimeType: fileObj.mimeType || 'image/*',
              originalName: fileObj.originalName || fallbackTitle || 'logo',
              title: fileObj.originalName || fallbackTitle || 'logo',
              src: url,
            });
          };

          // Logos: event_logo, logo_ptak_expo
          if (files.event_logo) pushSingle(files.event_logo, 'Logo wydarzenia');
          if (files.logo_ptak_expo) pushSingle(files.logo_ptak_expo, 'Logo PTAK WARSAW EXPO');

          // Banners: banner_wystawcy_800, banner_wystawcy_1200
          const pushBanner = (fileObj: any, fallbackTitle?: string) => {
            if (!fileObj) return;
            const url = brandingAPI.serveGlobalUrl(fileObj.fileName);
            banners.push({
              id: fileObj.id,
              mimeType: fileObj.mimeType || 'image/*',
              originalName: fileObj.originalName || fallbackTitle || 'banner',
              title: fileObj.originalName || fallbackTitle || 'banner',
              src: url,
            });
          };
          if (files.banner_wystawcy_800) pushBanner(files.banner_wystawcy_800, 'Banner 800');
          if (files.banner_wystawcy_1200) pushBanner(files.banner_wystawcy_1200, 'Banner 1200');

          // Branding PDFs: dokumenty_brandingowe (array)
          if (Array.isArray(files.dokumenty_brandingowe)) {
            for (const f of files.dokumenty_brandingowe) {
              docs.push({
                id: f.id,
                originalName: f.originalName || 'dokument.pdf',
                mimeType: f.mimeType || 'application/pdf',
                url: brandingAPI.serveGlobalUrl(f.fileName),
              });
            }
          }

          setBrandingLogos(logos);
          setBrandingBanners(banners);
          setBrandingDocs(docs);

          // Exhibitor-scoped branding PDFs under 'dokumenty_brandingowe'
          try {
            if (exhibitorId) {
              const exbRes = await brandingAPI.getForExhibitor(exhibitorId, parseInt(eventId));
              const exbFiles = (exbRes.data && (exbRes.data as any).files) || {};
              const exbDocs: { id: number; originalName: string; mimeType: string; url: string }[] = [];
              if (Array.isArray(exbFiles.dokumenty_brandingowe)) {
                for (const f of exbFiles.dokumenty_brandingowe) {
                  exbDocs.push({
                    id: f.id,
                    originalName: f.originalName || 'dokument.pdf',
                    mimeType: f.mimeType || 'application/pdf',
                    url: brandingAPI.serveExhibitorUrl(exhibitorId, f.fileName),
                  });
                }
              }
              setExhibitorBrandingDocs(exbDocs);
            } else {
              setExhibitorBrandingDocs([]);
            }
          } catch {
            setExhibitorBrandingDocs([]);
          }
        } catch (e) {
          setBrandingLogos([]);
          setBrandingBanners([]);
          setBrandingDocs([]);
          setExhibitorBrandingDocs([]);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Błąd podczas ładowania treści');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [isAuthenticated, token, eventId]);

  // removed old generic documents download handler – we now use branding download for exhibitor branding docs

  const handleDownloadBranding = async (file: T_File) => {
    try {
      setIsFetchingFileId(file.id);
      const resp = await fetch(file.src, { credentials: 'include' });
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName || 'file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsFetchingFileId(null);
    }
  };

  const mapLogos = brandingLogos.map((item, index) => {
    const isLast = index + 1 === brandingLogos.length;

    return (
      <div
        className={styles.contentLogos}
        key={`logo_${index}`}
        style={
          isLast
            ? undefined
            : {
                borderBottom: "1px solid #d7d9dd",
              }
        }
      >
        <div className={styles.row}>
          <div className={styles.rowImage}>
            <img alt="logo" src={item.src} height={34} width="auto" />
          </div>
          <div className={styles.rowText}>{item.title}</div>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.downloadBtn}
            aria-label="pobierz"
            onClick={() => handleDownloadBranding(item)}
          >
            <img
              alt="pobierz ikona"
              src={IconDownload}
              height={29}
              width={29}
            />
          </button>
          {isFetchingFileId === item.id && (
            <div className={styles.loadingIcon}>
              <img alt="loader ikona" src={IconLoader} height={25} width={14} />
            </div>
          )}
        </div>
      </div>
    );
  });

  const mapBanners = brandingBanners.map((item, index) => {
    const isLast = index + 1 === brandingBanners.length;

    return (
      <div
        className={styles.contentLogos}
        key={`logo_${index}`}
        style={
          isLast
            ? undefined
            : {
                borderBottom: "1px solid #d7d9dd",
              }
        }
      >
        <div className={styles.row}>
          <div className={styles.rowImage}>
            <img alt="banner" src={item.src} height={34} width="auto" />
          </div>
          <div className={styles.rowText}>{item.title}</div>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.downloadBtn}
            aria-label="pobierz"
            onClick={() => handleDownloadBranding(item)}
          >
            <img
              alt="pobierz ikona"
              src={IconDownload}
              height={29}
              width={29}
            />
          </button>
          {isFetchingFileId === item.id && (
            <div className={styles.loadingIcon}>
              <img alt="loader ikona" src={IconLoader} height={25} width={14} />
            </div>
          )}
        </div>
      </div>
    );
  });

  const mapDocuments = exhibitorBrandingDocs.map((doc) => (
    <div key={`exb_branding_${doc.id}`}>
      <div className={styles.listRow}>
        <div className={styles.rowLeft}>
          <img alt="pdf ikona" src={IconPdf} height={30} width={23} />
          <span className={styles.rowText}>{doc.originalName}</span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.downloadBtn}
            aria-label="pobierz"
            onClick={() => handleDownloadBranding({ id: doc.id, mimeType: doc.mimeType, originalName: doc.originalName, title: doc.originalName, src: doc.url })}
          >
            <img alt="pobierz ikona" src={IconDownload} height={29} width={29} />
          </button>
          {isFetchingFileId === doc.id && (
            <div className={styles.loadingIcon}>
              <img alt="loader ikona" src={IconLoader} height={25} width={14} />
            </div>
          )}
        </div>
      </div>
      <div className={styles.rowDivider} />
    </div>
  ));

  const mapBrandingDocs = brandingDocs.map((doc) => (
    <div key={`branding_${doc.id}`}>
      <div className={styles.listRow}>
        <div className={styles.rowLeft}>
          <img alt="pdf ikona" src={IconPdf} height={30} width={23} />
          <span className={styles.rowText}>{doc.originalName}</span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.downloadBtn}
            aria-label="pobierz"
            onClick={() => handleDownloadBranding({ id: doc.id, mimeType: doc.mimeType, originalName: doc.originalName, title: doc.originalName, src: doc.url })}
          >
            <img alt="pobierz ikona" src={IconDownload} height={29} width={29} />
          </button>
          {isFetchingFileId === doc.id && (
            <div className={styles.loadingIcon}>
              <img alt="loader ikona" src={IconLoader} height={25} width={14} />
            </div>
          )}
        </div>
      </div>
      <div className={styles.rowDivider} />
    </div>
  ));

  if (loading) {
    return (
      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.mainHeader}>
            <div className={styles.headerInner}>
              <img alt="główna ikona" src={IconMain} height={54} width={55} />
              <div className={styles.headerTitle}>Materiały Marketingowe</div>
            </div>
          </div>
          <div style={{padding: "20px", textAlign: "center"}}>
            Ładowanie dokumentów...
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.mainHeader}>
            <div className={styles.headerInner}>
              <img alt="główna ikona" src={IconMain} height={54} width={55} />
              <div className={styles.headerTitle}>Materiały Marketingowe</div>
            </div>
          </div>
          <div style={{padding: "20px", color: "red"}}>Błąd: {error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <div className={styles.headerInner}>
            <img alt="główna ikona" src={IconMain} height={54} width={55} />
            <div className={styles.headerTitle}>Materiały Marketingowe</div>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.contentText}>
            <CustomTypography fontSize="1rem" fontWeight={600}>
              Logotypy
            </CustomTypography>
          </div>
          {brandingLogos.length === 0 && (
            <div className={styles.noContent}>
              Brak logotypów do wyświetlenia
            </div>
          )}
          {brandingLogos.length > 0 && mapLogos}
          <div className={styles.contentOtherFiles}>
            <CustomTypography fontSize="1rem" fontWeight={600}>
              Banery z Twoim logo
            </CustomTypography>
          </div>
          {brandingBanners.length === 0 && (
            <div className={styles.noContent}>
              Brak bannerów do wyświetlenia
            </div>
          )}
          {brandingBanners.length > 0 && mapBanners}
          <div className={styles.contentOtherFiles}>
            <CustomTypography fontSize="1rem" fontWeight={600}>
              Pozostałe dokumnty
            </CustomTypography>
          </div>
          {exhibitorBrandingDocs.length === 0 && brandingDocs.length === 0 && (
            <div className={styles.noContent}>
              Brak dokumentów do wyświetlenia
            </div>
          )}
          {exhibitorBrandingDocs.length > 0 && mapDocuments}
          {brandingDocs.length > 0 && mapBrandingDocs}
        </div>
      </main>
    </div>
  );
};
