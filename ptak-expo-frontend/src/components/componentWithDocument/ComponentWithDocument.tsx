import React from "react";
import Box from "@mui/material/Box";
import { ReactComponent as blueFVAT } from "../../assets/blue-f_Vat.svg";
import { ReactComponent as PdfIcon } from "../../assets/redPDF.svg";
import { ReactComponent as Wastebasket } from "../../assets/wastebasket.svg";
import styles from "./ComponentWithDocument.module.scss";
import CustomTypography from "../customTypography/CustomTypography";
import { ReactComponent as RedCross } from "../../assets/redCross.svg";

interface ComponentWithDocumentProps {
  documentType: "pdf" | "doc" | "other"| 'noFile';
  iconSVG?: React.FC<React.SVGProps<SVGSVGElement>>;
  handleDelete: () => void;
  documentName: string;
  deleteIcon: "basket" | "cross" | "other";
  ounDeleteIconSVG?: React.FC<React.SVGProps<SVGSVGElement>>;
  nameStyle?: React.CSSProperties; // opcjonalny styl dla nazwy dokumentu
}

const ComponentWithDocument: React.FC<ComponentWithDocumentProps> = ({
  documentType='pdf',
  iconSVG: IconSVG,
  handleDelete,
  documentName,
  deleteIcon='cross',
  ounDeleteIconSVG: OunDeleteIconSVG,
  nameStyle,
}) => {
  // Wybór ikony dokumentu w zależności od documentType
  const DocumentIcon = (() => {
    switch (documentType) {
      case "pdf":
        return PdfIcon;
      case "doc":
        return blueFVAT;
      case "other":
        return IconSVG;
      case "noFile":
        return null;
      default:
        return null;
    }
  })();

  // Wybór ikony usunięcia w zależności od deleteIcon
  const DeleteIcon = (() => {
    switch (deleteIcon) {
      case "basket":
        return Wastebasket;
      case "cross":
        return RedCross;
      case "other":
        return OunDeleteIconSVG;
      default:
        return null;
    }
  })();

  // Debug info for rendering
  console.log('[ComponentWithDocument] render', {
    documentType,
    hasDocumentIcon: !!DocumentIcon,
    deleteIcon,
    hasDeleteIcon: !!DeleteIcon,
    documentName,
  });

  return (
    <Box className={styles.documentContainer}>
      {DocumentIcon && <DocumentIcon className={styles.documentIcon} />}
        <Box style={nameStyle}>
            <CustomTypography className={styles.fileName}>{documentName}</CustomTypography>
        </Box>
      {DeleteIcon && (
        <DeleteIcon
          className={styles.deleteIcon}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); console.log('[ComponentWithDocument] delete click'); handleDelete(); }}
          aria-label="Usuń"
          title="Usuń"
        />
      )}
    </Box>
  );
};

export default ComponentWithDocument;