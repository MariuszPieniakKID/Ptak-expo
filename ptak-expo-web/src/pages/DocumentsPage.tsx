import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import styles from "./DocumentsPage.module.scss";
import CustomTypography from "../components/customTypography/CustomTypography";
import {useAuth} from "../contexts/AuthContext";
import {
  exhibitorsSelfAPI,
  exhibitorDocumentsAPI,
  ExhibitorDocument,
  tradeInfoAPI,
  userAvatarUrl,
} from "../services/api";
import IconDownload from "../assets/group-914.png";
import IconPdf from "../assets/pdf.png";
import IconInvoice from "../assets/invoice.png";
import IconMain from "../assets/group-20.png";
import IconLoader from "../assets/loader.png";

const DocumentsPage: React.FC = () => {
  const {eventId} = useParams<{eventId: string}>();
  const {token, isAuthenticated} = useAuth();
  const [documents, setDocuments] = useState<ExhibitorDocument[]>([]);
  // Branding docs not used in this view now
  // Only admin-uploaded exhibitor-documents are shown in downloads
  const [loading, setLoading] = useState(true);
  const [isFetchingFileId, setIsFetchingFileId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supervisor, setSupervisor] = useState<any | null>(null);
  const [assignedExhibitorId, setAssignedExhibitorId] = useState<number | null>(null);

  // Kategoryzacja bez filtra po roli – tylko dla tego wystawcy i wydarzenia
  const invoices = documents.filter((doc) => doc.category === 'faktury');
  const combinedAdminDocs = documents
    .filter((doc) => (doc.category === 'umowy' || doc.category === 'inne_dokumenty'))
    .map((doc) => ({ id: doc.id, originalName: doc.originalName, mimeType: doc.mimeType, url: '' }));

  // Fetch documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!isAuthenticated || !token || !eventId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch trade info first to determine exhibitor assigned to this event
        const tiRes = await tradeInfoAPI.get(parseInt(eventId));
        const ti: any = (tiRes && (tiRes as any).data && (tiRes as any).data.data) ? (tiRes as any).data.data : null;
        const assignment = ti?.exhibitorAssignment || null;
        if (!assignment || typeof assignment.exhibitorId !== 'number') {
          setAssignedExhibitorId(null);
          setDocuments([]);
          setSupervisor(null);
          setLoading(false);
          return;
        }
        const exhibitorId: number = assignment.exhibitorId;
        setAssignedExhibitorId(exhibitorId);

        // Then fetch documents for this exhibitor and event
        const documentsData = exhibitorId ? await exhibitorDocumentsAPI.list(exhibitorId, parseInt(eventId)) : [];
        // Dokumenty z exhibitor-documents używamy dalej tylko dla sekcji "Faktury"
        setDocuments(documentsData);
        const sup = ti?.exhibitorAssignment?.supervisor || null;
        setSupervisor(sup);

        // Brak brandingu w tym widoku – tylko adminowe pliki z exhibitor-documents
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

  // Handle document download
  const handleDownload = async (doc: ExhibitorDocument) => {
    if (!token || !eventId || !assignedExhibitorId) return;

    setIsFetchingFileId(doc.id);

    try {
      // Download document dla przypisanego wystawcy
      const response = await exhibitorDocumentsAPI.download(
        assignedExhibitorId,
        parseInt(eventId),
        doc.id
      );

      // Create blob and download
      const blob = new Blob([response.data], {type: doc.mimeType});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalName;
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

  // Download exhibitor branding document
  const handleDownloadBranding = async (doc: { id: number; originalName: string; mimeType: string; url: string }) => {
    setIsFetchingFileId(doc.id);
    try {
      // If URL is empty, treat it as exhibitor-documents admin upload and download via protected endpoint
      if (!doc.url && assignedExhibitorId && eventId) {
        const response = await exhibitorDocumentsAPI.download(assignedExhibitorId, parseInt(eventId as string), doc.id);
        const blob = new Blob([response.data], { type: doc.mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.originalName || 'file';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
      const resp = await fetch(doc.url, { credentials: 'include' });
      if (!resp.ok) throw new Error('Błąd serwera');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName || 'file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Błąd podczas pobierania dokumentu: ' + (err?.message || ''));
    }
    setIsFetchingFileId(null);
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.mainHeader}>
            <div className={styles.headerInner}>
              <img alt="główna ikona" src={IconMain} height={54} width={55} />
              <div className={styles.headerTitle}>Portal dokumentów</div>
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
              <div className={styles.headerTitle}>Portal dokumentów</div>
            </div>
          </div>
          <div style={{padding: "20px", color: "red"}}>Błąd: {error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* Main area only (left column is now provided by EventLayout) */}
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <div className={styles.headerInner}>
            <img alt="główna ikona" src={IconMain} height={54} width={55} />
            <div className={styles.headerTitle}>Portal dokumentów</div>
          </div>
        </div>
        <div className={styles.sectionWrapper}>
          <section className={styles.sectionInvoices}>
            <div className={styles.sectionHeaderRow}>
              <CustomTypography fontSize="1rem" fontWeight={600}>
                Faktury
              </CustomTypography>
            </div>
            <div className={styles.list}>
              {invoices.length === 0 ? (
                <div
                  style={{padding: "12px", color: "#666", fontStyle: "italic"}}
                >
                  Brak faktur do wyświetlenia
                </div>
              ) : (
                invoices.map((document, idx) => (
                  <div key={document.id}>
                    <div className={styles.listRow}>
                      <div className={styles.rowLeft}>
                        <div className={styles.iconWrapper}>
                          <img
                            alt="faktury ikona"
                            src={IconInvoice}
                            height={27}
                            width={21}
                          />
                          {idx < 2 && <span className={styles.redDot} />}
                        </div>
                        <span className={styles.rowText}>{document.title}</span>
                      </div>
                      <div className={styles.actions}>
                        <button
                          className={styles.downloadBtn}
                          aria-label="pobierz"
                          onClick={() => handleDownload(document)}
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
                            <img
                              alt="loader ikona"
                              src={IconLoader}
                              height={25}
                              width={14}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.rowDivider} />
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={styles.sectionGray}>
            <div className={styles.sectionHeaderRow}>
              <CustomTypography fontSize="1rem" fontWeight={600}>
                Dokumenty do pobrania
              </CustomTypography>
            </div>
            <div className={styles.list}>
              {combinedAdminDocs.length === 0 ? (
                <div
                  style={{padding: "12px", color: "#666", fontStyle: "italic"}}
                >
                  Brak dokumentów do wyświetlenia
                </div>
              ) : (
                combinedAdminDocs.map((document) => (
                  <div key={`exb_branding_${document.id}`}>
                    <div className={styles.listRow}>
                      <div className={styles.rowLeft}>
                        <img
                          alt="pdf ikona"
                          src={IconPdf}
                          height={30}
                          width={23}
                        />
                        <span className={styles.rowText}>{document.originalName}</span>
                      </div>
                      <div className={styles.actions}>
                        <button
                          className={styles.downloadBtn}
                          aria-label="pobierz"
                          onClick={() => handleDownloadBranding(document)}
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
                            <img
                              alt="loader ikona"
                              src={IconLoader}
                              height={25}
                              width={14}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.rowDivider} />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className={styles.contactBox}>
          <div className={styles.contactTitle}>
            Czegoś brakuje? Zadaj nam pytanie:
          </div>
          <div className={styles.contactRow}>
            <div className={styles.contactAvatar}>
              {supervisor?.id ? (
                <img
                  alt="avatar"
                  src={userAvatarUrl(supervisor.id)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
            </div>
            <div className={styles.contactMeta}>
              <div className={styles.contactName}>
                {supervisor ? `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() : '-'}
              </div>
              <div className={styles.contactPhone}>
                {supervisor?.phone || '-'}
              </div>
              <div className={styles.contactMail}>
                {supervisor?.email || '-'}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DocumentsPage;
