import { Box, IconButton, Typography } from "@mui/material";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
import { Add } from "@mui/icons-material";
import { useState } from "react";
import EditProduct from "./EditProduct";
import config from "../../config/config";
import styles from "../../pages/ChecklistPage.module.scss";

export default function ProductsInfo() {
  var { checklist, removeProduct } = useChecklist();
  var [showAdd, setShowAdd] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  return (
    <ChecklistCard
      icon={<img src={`/assets/checklist-step-1.svg`} alt=""></img>}
      title={
        <Typography color="#2E2E38" fontWeight={700} fontSize={16}>
          Prezentowane produkty ({checklist.products.length})
        </Typography>
      }
      checked={checklist.products.length > 0}
    >
      {checklist.products.map((cp) => {
        const i = checklist.products.indexOf(cp);
        const raw = (cp as any).tags;
        const tagsArr = Array.isArray(raw)
          ? raw
          : typeof raw === "string"
          ? raw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        // Generate proper image URL
        const imageUrl = cp.img
          ? cp.img.startsWith("data:") || cp.img.startsWith("http")
            ? cp.img
            : cp.img.startsWith("uploads/")
            ? `${config.API_BASE_URL}/${cp.img}`
            : `${config.API_BASE_URL}/uploads/${cp.img}`
          : "/assets/placeholder-product.png";

        return (
          <Box
            display={"flex"}
            alignItems="center"
            gap="10px"
            paddingY="16px"
            width="100%"
            key={`${cp.name}-${i}`}
            borderBottom={"1px solid #D7D9DD"}
          >
            <Box
              component="img"
              sx={{
                width: 40,
                height: 40,
                objectFit: "cover",
                objectPosition: "center",
                borderRadius: "20px",
              }}
              src={imageUrl}
              alt=""
            />
            <Box flex="1 1 auto" minWidth={0}>
              <Typography
                fontSize={16}
                fontWeight={"bold"}
                onClick={() => setEditIndex(i)}
                sx={{ cursor: "pointer" }}
              >
                {cp.name}
              </Typography>
              <Typography
                fontSize={13}
                color="rgba(111, 111, 111, 1)"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
                onClick={() => setEditIndex(i)}
                sx={{ cursor: "pointer" }}
              >
                {cp.description}
              </Typography>
              {tagsArr.length > 0 && (
                <Typography fontSize={12} color="var(--color-darkslategray)">
                  Tagi: {tagsArr.join(", ")}
                </Typography>
              )}
            </Box>
            <IconButton
              aria-label="Usuń"
              onClick={() => {
                if (window.confirm("Czy na pewno chcesz usunąć ten produkt?"))
                  removeProduct(i);
              }}
            >
              <img
                src="/assets/wastebasket.svg"
                alt="Usuń"
                width={12}
                height={12}
              />
            </IconButton>
          </Box>
        );
      })}
      {!showAdd && (
        <Box display="flex" marginTop={"20px"}>
          <IconButton
            className={styles.addProductButton}
            onClick={() => setShowAdd(true)}
          >
            <Add className={styles.addProductButtonIcon} />
          </IconButton>
          <span
            className={styles.addProductText}
            onClick={() => setShowAdd(true)}
          >
            dodaj produkt
          </span>
        </Box>
      )}
      {showAdd && (
        <EditProduct
          key={`add-${checklist.products.length}`}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editIndex !== null && (
        <EditProduct
          key={`edit-${editIndex}`}
          productNum={editIndex}
          onClose={() => setEditIndex(null)}
        />
      )}
    </ChecklistCard>
  );
}
