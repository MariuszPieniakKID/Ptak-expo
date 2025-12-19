import { Box, IconButton, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
import { Add } from "@mui/icons-material";
import { useCallback } from "react";
import styles from "../../pages/ChecklistPage.module.scss";

function AddMaterial({ onChangeFile }: { onChangeFile: (file: File) => void }) {
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files == null) return;
      const file = e.target.files[0];
      if (file == null) return;

      // Validate file type (PDF only)
      if (file.type !== "application/pdf") {
        alert("Materiały do pobrania muszą być w formacie PDF");
        e.target.value = "";
        return;
      }

      onChangeFile(file);
    },
    [onChangeFile]
  );
  return (
    <Box display="flex" alignItems="center">
      <input
        onChange={handleFileInput}
        type="file"
        hidden
        accept="application/pdf"
        id="file-input"
      />
      <label htmlFor="file-input">
        <Box display="flex" marginTop={"20px"}>
          <IconButton component="span" className={styles.addProductButton}>
            <Add className={styles.addProductButtonIcon} />
          </IconButton>
          <span className={styles.addProductText}>
            dodaj pliki do pobrania (PDF)
          </span>
        </Box>
      </label>
    </Box>
  );
}
export default function MaterialsCard() {
  const { filled, checklist, uploadMaterialFile, removeMaterial } =
    useChecklist();

  return (
    <ChecklistCard
      secondaryBackground
      icon={<img src={`/assets/checklist-step-3.svg`} alt=""></img>}
      title={
        <Typography color="#2E2E38" fontWeight={700} fontSize={16}>
          Materiały do pobrania ({checklist.downloadMaterials.length})
        </Typography>
      }
      checked={filled[2]}
    >
      {checklist.downloadMaterials.map((dm) => (
        <Box
          key={(dm as any).id ?? (dm.fileUri || dm.fileName)}
          display="flex"
          flexDirection={"row"}
          alignItems="center"
          margin="20px 20px"
          gap="20px"
        >
          <Box
            component="a"
            href={dm.fileUri}
            target="_blank"
            rel="noreferrer"
            display="flex"
            alignItems="center"
            gap="20px"
            flex={1}
          >
            <img src="/assets/pdf-file.svg" alt="" />
            <Typography
              fontSize="16px"
              color="var(--color-darkslategray)"
              sx={{ textDecoration: "none" }}
            >
              {dm.fileName}
            </Typography>
          </Box>
          {(dm as any).id ? (
            <IconButton
              aria-label="Usuń"
              onClick={() => removeMaterial((dm as any).id)}
              size="small"
              sx={{ ml: 1 }}
            >
              <DeleteOutlineIcon />
            </IconButton>
          ) : null}
        </Box>
      ))}
      <AddMaterial
        onChangeFile={async (file) => {
          try {
            await uploadMaterialFile(file);
          } catch (e) {
            alert(
              "Nie udało się dodać pliku. Spróbuj ponownie lub skontaktuj się z administratorem."
            );
          }
        }}
      />
    </ChecklistCard>
  );
}
