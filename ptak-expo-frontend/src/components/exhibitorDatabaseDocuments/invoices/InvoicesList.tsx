import React, { useEffect, useMemo, useState } from "react";
import { Box, Fade } from "@mui/material";
import styles from "./InvoicesList.module.scss";
import { ReactComponent as InvoicesIcon } from "../../../assets/blue-f_Vat.svg";
import { ReactComponent as ContractIcon } from "../../../assets/redPDF.svg";
import { ReactComponent as WastebasketIcon } from "../../../assets/wastebasket.svg";
import CustomTypography from "../../customTypography/CustomTypography";

// Typy
export type DocumentType = "invoices" | "contracts" | "other";

export interface DocumentItem {
  documentId: number;
  documentName: string;
  documentType: DocumentType;
}

interface InvoicesListProps {
  documents: DocumentItem[];
  handleDeleteDocument: (documentId: number) => void;
  excludeTypes?: DocumentType[]; // NOWY props
  onDownload?: (doc: DocumentItem) => void;
}

// Mapa ikon
const documentTypeIcons: Record<DocumentType, React.FC<React.SVGProps<SVGSVGElement>> | null> = {
  invoices: InvoicesIcon,
  contracts: ContractIcon,
  other: ContractIcon,
};

const InvoicesList: React.FC<InvoicesListProps> = ({
  documents,
  handleDeleteDocument,
  excludeTypes = [], // domyślnie brak wykluczeń
  onDownload,
}) => {

  // Filtrowanie dokumentów
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => !excludeTypes.includes(doc.documentType));
  }, [documents, excludeTypes]);

  const [visibleDocs, setVisibleDocs] = useState<Record<number, boolean>>({});

  // Ensure new docs become visible by default; remove stale ids
  useEffect(() => {
    setVisibleDocs(prev => {
      const next: Record<number, boolean> = { ...prev };
      // Add any missing doc ids as visible
      for (const d of filteredDocuments) {
        if (next[d.documentId] === undefined) {
          next[d.documentId] = true;
        }
      }
      // Remove ids no longer present
      for (const id of Object.keys(next)) {
        const numId = Number(id);
        if (!filteredDocuments.some(d => d.documentId === numId)) {
          delete next[numId];
        }
      }
      // Shallow equality check to avoid unnecessary state updates
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length === nextKeys.length && prevKeys.every(k => prev[k as any] === next[k as any])) {
        return prev; // no changes -> no re-render
      }
      return next;
    });
  }, [filteredDocuments]);

  const handleDeleteWithFade = (id: number) => {
    setVisibleDocs(prev => ({ ...prev, [id]: false }));
    setTimeout(() => {
      handleDeleteDocument(id);
    }, 300);
  };

  if (filteredDocuments.length === 0) {
    return (
      <Box className={styles.invoicesListWrapper}>
        <CustomTypography>Brak dokumentów</CustomTypography>
      </Box>
    );
  }

  return (
    <Box className={styles.invoicesListWrapper}>
      {filteredDocuments.map((doc, index) => {
        const IconComponent = documentTypeIcons[doc.documentType];
        return (
          <Fade
            key={doc.documentId}
            in={visibleDocs[doc.documentId] !== false}
            timeout={300}
            style={{ transitionDelay: `${index * 100}ms` }}
            unmountOnExit
          >
            <Box className={styles.singleInvoiceInfo}>
              <Box className={styles.iconWithFileName}>
                {IconComponent && <IconComponent className={styles.invoiceIcon} />}
                <CustomTypography 
                  className={styles.invoiceTitle}
                  onClick={() => onDownload && onDownload(doc)}
                  sx={{ cursor: onDownload ? 'pointer' : 'default' }}
                >
                  {doc.documentName}
                </CustomTypography>
              </Box>
              <Box
                className={styles.actionButton}
                onClick={() => handleDeleteWithFade(doc.documentId)}
              >
                <WastebasketIcon className={styles.actionIcon} />
                <CustomTypography className={styles.actionLabel}>
                  Usuń
                </CustomTypography>
              </Box>
            </Box>
          </Fade>
        );
      })}
    </Box>
  );
};

export default InvoicesList;