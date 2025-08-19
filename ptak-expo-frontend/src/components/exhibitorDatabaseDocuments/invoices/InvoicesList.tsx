import React, { useState } from "react";
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
}

// Mapa ikon
const documentTypeIcons: Record<DocumentType, React.FC<React.SVGProps<SVGSVGElement>> | null> = {
  invoices: InvoicesIcon,
  contracts: ContractIcon,
  other: null,
};

const InvoicesList: React.FC<InvoicesListProps> = ({
  documents,
  handleDeleteDocument,
  excludeTypes = [] // domyślnie brak wykluczeń
}) => {

  // Filtrowanie dokumentów
  const filteredDocuments = documents.filter(
    doc => !excludeTypes.includes(doc.documentType)
  );

  const [visibleDocs, setVisibleDocs] = useState<Record<number, boolean>>(
    () => Object.fromEntries(filteredDocuments.map((d) => [d.documentId, true]))
  );

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
            in={visibleDocs[doc.documentId]}
            timeout={300}
            style={{ transitionDelay: `${index * 100}ms` }}
            unmountOnExit
          >
            <Box className={styles.singleInvoiceInfo}>
              <Box className={styles.iconWithFileName}>
                {IconComponent && <IconComponent className={styles.invoiceIcon} />}
                <CustomTypography className={styles.invoiceTitle}>
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