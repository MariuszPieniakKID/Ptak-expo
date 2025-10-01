import { Box } from "@mui/material";
import { ReactComponent as PdfIcon } from "../../../assets/redPDF.svg";
import styles from "./DownloadMaterials.module.scss";
import CustomTypography from "../../customTypography/CustomTypography";

interface DocumentItem {
  documentId: number;
  documentName: string;
}

interface DownloadMaterialsProps {
  documentsList: DocumentItem[];
  handleSubmitDocument: (documentId: number) => void;
}

function DownloadMaterials({ documentsList, handleSubmitDocument }: DownloadMaterialsProps) {
  // Truncate filename to 20 characters max
  const truncateFilename = (name: string) => {
    if (!name) return '';
    if (name.length <= 20) return name;
    return name.substring(0, 20) + '...';
  };

  return (
    <Box className={styles.downloadMaterialcContainer}>
      {documentsList.map((doc) => (
        <Box key={doc.documentId} className={styles.singleDosument}>
          <PdfIcon className={styles.icon} />
          <Box
            className={styles.actionWrapper}
            onClick={() => handleSubmitDocument(doc.documentId)}
            title={doc.documentName} // Show full name on hover
          >
            <CustomTypography className={styles.documentTitle}>
              {truncateFilename(doc.documentName)}
            </CustomTypography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default DownloadMaterials;