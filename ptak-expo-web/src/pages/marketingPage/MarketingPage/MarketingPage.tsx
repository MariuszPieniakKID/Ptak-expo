import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import styles from "./MarketingPage.module.scss";
import {useAuth} from "../../../contexts/AuthContext";
import {
  exhibitorsSelfAPI,
  exhibitorDocumentsAPI,
  ExhibitorDocument,
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
  // Start with empty list to avoid clicking placeholder item when fetch fails
  const [documents, setDocuments] = useState<ExhibitorDocument[]>([]);
  const [isFetchingFileId, setIsFetchingFileId] = useState<number | null>(null);
  const {eventId} = useParams<{eventId: string}>();
  const {token, isAuthenticated} = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const otherDocuments = documents.filter(
    (doc) => doc.category === "inne_dokumenty"
  );

  const mockLogos: T_File[] = [];

  const mockBanners: T_File[] = [];

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!isAuthenticated || !token || !eventId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const profileResponse = await exhibitorsSelfAPI.getMe();
        const exhibitorId = profileResponse.data.data.id;

        const documentsData = await exhibitorDocumentsAPI.list(
          exhibitorId,
          parseInt(eventId)
        );
        setDocuments(documentsData);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Błąd podczas pobierania dokumentów"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [isAuthenticated, token, eventId]);

  const handleDownload = async (fileToDownload: T_File) => {
    if (!token || !eventId) return;

    setIsFetchingFileId(fileToDownload.id);

    try {
      // Get exhibitor profile to get exhibitorId
      const profileResponse = await exhibitorsSelfAPI.getMe();
      const exhibitorId = profileResponse.data.data.id;

      // Download document
      const response = await exhibitorDocumentsAPI.download(
        exhibitorId,
        parseInt(eventId),
        fileToDownload.id
      );

      // Create blob and download
      const blob = new Blob([response.data], {type: fileToDownload.mimeType});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileToDownload.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(
        "Błąd podczas pobierania dokumentu: " +
          (err.response?.data?.message || err.message)
      );
    }

    setIsFetchingFileId(null);
  };

  const handleDownloadDocument = async (fileToDownload: ExhibitorDocument) => {
    if (!token || !eventId) return;

    setIsFetchingFileId(fileToDownload.id);

    try {
      // Get exhibitor profile to get exhibitorId
      const profileResponse = await exhibitorsSelfAPI.getMe();
      const exhibitorId = profileResponse.data.data.id;

      console.log("🔍 Downloading document:", {
        exhibitorId,
        eventId: parseInt(eventId),
        documentId: fileToDownload.id,
        url: `/api/v1/exhibitor-documents/${exhibitorId}/${parseInt(
          eventId
        )}/download/${fileToDownload.id}`,
      });

      // Download document
      const response = await exhibitorDocumentsAPI.download(
        exhibitorId,
        parseInt(eventId),
        fileToDownload.id
      );

      // Create blob and download
      const blob = new Blob([response.data], {type: fileToDownload.mimeType});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileToDownload.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(
        "Błąd podczas pobierania dokumentu: " +
          (err.response?.data?.message || err.message)
      );
    }

    setIsFetchingFileId(null);
  };

  const mapLogos = mockLogos.map((item, index) => {
    const isLast = index + 1 === mockLogos.length;

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
            onClick={() => handleDownload(item)}
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

  const mapBanners = mockBanners.map((item, index) => {
    const isLast = index + 1 === mockBanners.length;

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
            onClick={() => handleDownload(item)}
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

  const mapDocuments = otherDocuments.map((document) => (
    <div key={document.id}>
      <div className={styles.listRow}>
        <div className={styles.rowLeft}>
          <img alt="pdf ikona" src={IconPdf} height={30} width={23} />
          <span className={styles.rowText}>{document.title}</span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.downloadBtn}
            aria-label="pobierz"
            onClick={() => handleDownloadDocument(document)}
          >
            <img
              alt="pobierz ikona"
              src={IconDownload}
              height={29}
              width={29}
            />
          </button>
          {isFetchingFileId === document.id && (
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
          {mockLogos.length === 0 && (
            <div className={styles.noContent}>
              Brak logotypów do wyświetlenia
            </div>
          )}
          {mockLogos.length > 0 && mapLogos}
          <div className={styles.contentOtherFiles}>
            <CustomTypography fontSize="1rem" fontWeight={600}>
              Banery z Twoim logo
            </CustomTypography>
          </div>
          {mockBanners.length === 0 && (
            <div className={styles.noContent}>
              Brak bannerów do wyświetlenia
            </div>
          )}
          {mockBanners.length > 0 && mapBanners}
          <div className={styles.contentOtherFiles}>
            <CustomTypography fontSize="1rem" fontWeight={600}>
              Pozostałe dokumnty
            </CustomTypography>
          </div>
          {otherDocuments.length === 0 && (
            <div className={styles.noContent}>
              Brak dokumentów do wyświetlenia
            </div>
          )}
          {otherDocuments.length > 0 && mapDocuments}
        </div>
      </main>
    </div>
  );
};
