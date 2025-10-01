import React, { useEffect, useState } from "react";
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ReactComponent as UploadingIcon } from "../../assets/uploadingIcon.svg";
import styles from "./ExhibitorDatabaseDocuments.module.scss";

// Components
import UploadDocuments, { SelectedFileEntry } from "./uploadDocuments/UploadDocuments";
import InvoicesList, { DocumentItem } from "./invoices/InvoicesList";
import SendMessageContainer from "./messageContainer/SendMessageContainer";
import { useAuth } from "../../contexts/AuthContext";
import { deleteExhibitorDocument, downloadExhibitorDocument, ExhibitorDocumentCategory, getExhibitorDocuments, uploadExhibitorDocument, sendExhibitorDocumentMessage } from "../../services/api";

type ExhibitorDatabaseDocumentsProps = {
  allowMultiple?: boolean;
  exhibitorId: number;
  exhibitionId?: number | null;
};

function ExhibitorDatabaseDocuments({
  allowMultiple = true,
  exhibitorId,
  exhibitionId,
}: ExhibitorDatabaseDocumentsProps) {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  // Load documents for exhibitor + selected exhibition
  useEffect(() => {
    const loadDocs = async () => {
      console.log('[ExhibitorDatabaseDocuments] loadDocs called with', { exhibitorId, exhibitionId, hasToken: Boolean(token) });
      if (!token || !exhibitorId || !exhibitionId) {
        setDocuments([]);
        return;
      }
      try {
        console.log('[ExhibitorDatabaseDocuments] fetching documents...');
        // Only exhibitor self-added documents for this exhibition (match web checklist)
        const docs = await getExhibitorDocuments(exhibitorId, exhibitionId, token, { selfOnly: true });
        console.log('[ExhibitorDatabaseDocuments] documents fetched:', docs);
        const mapped: DocumentItem[] = docs.map((d) => ({
          documentId: d.id,
          documentName: d.originalName || d.title,
          documentType: d.category === 'faktury' ? 'invoices' : d.category === 'umowy' ? 'contracts' : 'other',
        }));
        setDocuments(mapped);
      } catch (_e) {
        console.error('[ExhibitorDatabaseDocuments] getExhibitorDocuments error:', _e);
        setDocuments([]);
      }
    };
    void loadDocs();
  }, [token, exhibitorId, exhibitionId]);

  // Obsługa dodawania plików
  const handleSubmit = async (files: SelectedFileEntry[]) => {
    if (!token || !exhibitionId) return;
    console.log('[ExhibitorDatabaseDocuments] handleSubmit: uploading', files.map(f => ({ name: f.file.name, type: f.type })), { exhibitorId, exhibitionId });
    for (const entry of files) {
      const category: ExhibitorDocumentCategory = entry.type === 'invoices' ? 'faktury' : entry.type === 'contracts' ? 'umowy' : 'inne_dokumenty';
      try {
        console.log('[ExhibitorDatabaseDocuments] uploading single file', { name: entry.file.name, category });
        const { document } = await uploadExhibitorDocument(entry.file, exhibitorId, exhibitionId, category, token);
        console.log('[ExhibitorDatabaseDocuments] upload success:', document);
        setDocuments((prev) => [
          ...prev,
          {
            documentId: document.id,
            documentName: document.originalName || document.title,
            documentType: entry.type === 'invoices' ? 'invoices' : entry.type === 'contracts' ? 'contracts' : 'other',
          },
        ]);
      } catch (e) {
        console.error('[ExhibitorDatabaseDocuments] upload error:', e);
        // optionally show toast
      }
    }
  };

  // Obsługa usuwania dokumentu
  const handleDeleteDocument = async (id: number) => {
    if (!token || !exhibitionId) return;
    try {
      console.log('[ExhibitorDatabaseDocuments] delete document', { id, exhibitorId, exhibitionId });
      await deleteExhibitorDocument(exhibitorId, exhibitionId, id, token);
      setDocuments((prev) => prev.filter((doc) => doc.documentId !== id));
    } catch (e) {
      console.error('[ExhibitorDatabaseDocuments] delete error:', e);
      // optionally show toast
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    if (!token || !exhibitionId) return;
    try {
      await downloadExhibitorDocument(exhibitorId, exhibitionId, doc.documentId, doc.documentName, token);
    } catch (e) {
      console.error('[ExhibitorDatabaseDocuments] download error:', e);
    }
  };

  const handleSendMessage = async (msg: string) => {
    if (!token || !exhibitionId) return;
    try {
      const res = await sendExhibitorDocumentMessage(exhibitorId, exhibitionId, msg, token);
      console.log('[ExhibitorDatabaseDocuments] message sent result:', res);
    } catch (e: any) {
      console.error('[ExhibitorDatabaseDocuments] message send error:', e?.message || e);
    }
  };

  // Definicja sekcji
  const items = [
    {
      icon: <UploadingIcon fontSize="small" />,
      title: "Wgraj dokumenty",
      container: <UploadDocuments onSubmit={handleSubmit} isEventSelected={Boolean(exhibitionId)} />,
    },
    {
      icon: null,
      title: "Faktury",
      container: (
        <InvoicesList 
          documents={documents} 
          handleDeleteDocument={handleDeleteDocument} 
          excludeTypes={['other', 'contracts']}
          onDownload={handleDownload}
        />
      ),
    },
    {
      icon: null,
      title: "Dokumenty do pobrania",
      container: (
        <InvoicesList 
          documents={documents} 
          handleDeleteDocument={handleDeleteDocument} 
          excludeTypes={['invoices']}
          onDownload={handleDownload}
        />
      ),
    },
    {
      icon: null,
      title: "Wiadomości dotyczące dokumentów:",
      container:   <SendMessageContainer onSend={handleSendMessage} />,
    },
  ];

  // Stany accordionów
  const [expandedAccordions, setExpandedAccordions] = useState<boolean[]>(Array(items.length).fill(false));
  const [expandedOne, setExpandedOne] = useState<number | false>(false);

  const handleChangeMultiple = (index: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordions((prev) => prev.map((opened, i) => (i === index ? isExpanded : opened)));
  };

  const handleChangeSingle = (index: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedOne(isExpanded ? index : false);
  };

  const alwaysOpenIndexes = [0, 1, 2, 3];
  const overlapIndexes = [1, 2];

  return (
    <Box className={styles.container}>
      {items.map((item, idx) => {
        const isLastAccordion = idx === items.length - 1;
        const isAlwaysOpen = alwaysOpenIndexes.includes(idx);

        return (
          <React.Fragment key={item.title}>
            {isLastAccordion && <Box sx={{ height: 40 }} />}

            <Accordion
              expanded={isAlwaysOpen ? true : allowMultiple ? expandedAccordions[idx] : expandedOne === idx}
            onChange={
            isAlwaysOpen
              ? () => {} 
              : allowMultiple
              ? handleChangeMultiple(idx)
              : handleChangeSingle(idx)
          }
              disableGutters
              elevation={0}
              square
              sx={{
                padding: "0px 24px !important",
                '@media (max-width:440px)': {
                padding: '0px 8px !important',
              },
                borderRadius: "20px",
                backgroundColor: idx % 2 === 0 ? "#f5f5f5" : "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "none",
                position: "relative",
                "&:before": { display: "none" },
                // Avoid overlaying other UI elements
                zIndex: "auto",
                // Remove negative margins to prevent accidental overlays across siblings
                ...(overlapIndexes.includes(idx) ? {} : {}),
                ...(!overlapIndexes.includes(idx) && { marginBottom: "40px" }),
              }}
            >
              <AccordionSummary
                expandIcon={
                  !isAlwaysOpen && (
                    <Box
                      sx={{
                        width: 35,
                        height: 35,
                        borderRadius: "50%",
                        backgroundColor: "#fafbfb",
                        border: "2px solid #fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ExpandMoreIcon sx={{ color: "#6f87f6", fontSize: 28 }} />
                    </Box>
                  )
                }
                aria-controls={`panel${idx + 1}-content`}
                id={`panel${idx + 1}-header`}
                sx={{
                  borderRadius: "20px",
                  minHeight: 56,
                  "&.Mui-expanded": { minHeight: 56 },
                  '@media (max-width:440px)': {
                  padding: '0px 0px !important',
                }, 
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1,marginTop:'1em' }}>
                  {item.icon && (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: idx % 2 === 0 ? "#fff" : "#f5f5f5",
                        boxShadow: "0 2px 8px rgba(94,101,119,0.06)",
                      }}
                    >
                      {item.icon}
                    </Box>
                  )}
                  <Typography 
                  sx={{ fontWeight: 600, 
                  fontSize: "1rem",
                   '@media (max-width:440px)': {
                    fontSize:'13px',
                  },

                   }} component="span">
                    {item.title}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ borderRadius: "0 0 20px 20px", pb: 2, pt: 1.5 }}>
                {item.container}
              </AccordionDetails>
            </Accordion>
          </React.Fragment>
        );
      })}
    </Box>
  );
}

export default ExhibitorDatabaseDocuments;