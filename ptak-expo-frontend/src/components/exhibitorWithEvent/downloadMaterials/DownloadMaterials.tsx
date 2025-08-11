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
  return (
    <Box className={styles.downloadMaterialcContainer}>
      {documentsList.map((doc) => (
        <Box key={doc.documentId} className={styles.singleDosument}>
          <PdfIcon className={styles.icon} />
          <Box
            className={styles.actionWrapper}
            onClick={() => handleSubmitDocument(doc.documentId)}
          >
            <CustomTypography className={styles.documentTitle}>
              {doc.documentName}
            </CustomTypography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default DownloadMaterials;