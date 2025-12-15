import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductInfo } from "../../services/checkListApi";
import { Autocomplete, Box, Button, Chip, TextField } from "@mui/material";
import config from "../../config/config";
import { useChecklist } from "../../contexts/ChecklistContext";
import CustomTypography from "../customTypography/CustomTypography";
import styles from "../../pages/ChecklistPage.module.scss";

const emptyProduct: ProductInfo = {
  description: "",
  img: "",
  name: "",
  tags: [],
};
export default function EditProduct({
  productNum,
  onClose,
}: {
  productNum?: number;
  onClose: () => void;
}) {
  const { checklist, addProduct, updateProduct } = useChecklist();
  const product =
    checklist.products[typeof productNum === "number" ? productNum : -1];
  const [editedProduct, setEditedProduct] = useState<ProductInfo>(emptyProduct);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const canSave =
    editedProduct.description && editedProduct.img && editedProduct.name;
  useEffect(() => {
    setEditedProduct(product || emptyProduct);
  }, [product]);
  const [isUploading, setIsUploading] = useState(false);
  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files == null) return;
      const file = e.target.files[0];
      if (file == null) return;

      // Validate file type (JPEG only)
      if (!file.type.match(/^image\/jpeg$/)) {
        alert("Zdjęcie produktu musi być w formacie JPEG");
        e.target.value = "";
        return;
      }

      // Validate file size (max 5 MB)
      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxSize) {
        alert("Zdjęcie produktu nie może przekraczać 5 MB");
        e.target.value = "";
        return;
      }

      // Validate image dimensions (max 1280x960)
      const img = new Image();
      const reader = new FileReader();

      reader.onload = async (event) => {
        img.src = event.target?.result as string;
        img.onload = async () => {
          if (img.width > 1280 || img.height > 960) {
            alert(
              "Zdjęcie produktu nie może przekraczać wymiarów 1280x960 pikseli"
            );
            e.target.value = "";
            return;
          }

          // All validations passed, proceed with upload
          setIsUploading(true);
          try {
            // Get exhibitor and exhibition IDs
            const token = localStorage.getItem("authToken") || "";
            const exhibitionId =
              Number((window as any).currentSelectedExhibitionId) || 0;

            const meRes = await fetch(
              `${config.API_BASE_URL}/api/v1/exhibitors/me`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            const meData = await meRes.json();
            const exhibitorId = meData?.data?.id;

            if (!exhibitorId || !exhibitionId) {
              alert("Nie można pobrać informacji o wystawcy");
              setIsUploading(false);
              return;
            }

            // Upload file via API
            const { exhibitorDocumentsAPI } = await import(
              "../../services/api"
            );
            const fileName = await exhibitorDocumentsAPI.uploadCatalogImage(
              exhibitorId,
              exhibitionId,
              file,
              "product"
            );

            // Save filename (not base64) to product
            setEditedProduct({ ...editedProduct, img: fileName });
          } catch (error) {
            console.error("Upload error:", error);
            alert("Błąd podczas przesyłania pliku");
          } finally {
            setIsUploading(false);
          }
        };
      };

      reader.readAsDataURL(file);
    },
    [editedProduct]
  );

  const debouncedFetch = useMemo(() => {
    let t: any;
    return (q: string) => {
      clearTimeout(t);
      t = setTimeout(async () => {
        try {
          const token = localStorage.getItem("authToken") || "";
          const base =
            config.API_BASE_URL || (window as any).API_BASE_URL || "";
          const url = q
            ? `${base}/api/v1/catalog/tags?query=${encodeURIComponent(q)}`
            : `${base}/api/v1/catalog/tags`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const json = await res.json();
            const arr = Array.isArray(json.data)
              ? json.data.map((r: any) => String(r.tag))
              : [];
            setTagOptions(arr);
          }
        } catch {}
      }, 250);
    };
  }, []);

  useEffect(() => {
    // Prefetch most popular tags when opening the editor
    debouncedFetch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box display="flex" flexDirection="column" gap="10px">
      <TextField
        label="Nazwa"
        value={editedProduct.name}
        fullWidth
        required
        onChange={(e) =>
          setEditedProduct({ ...editedProduct, name: e.target.value })
        }
      />
      <TextField
        label="Opis"
        fullWidth
        multiline
        required
        value={editedProduct.description}
        onChange={(e) =>
          setEditedProduct({ ...editedProduct, description: e.target.value })
        }
      />
      <Autocomplete
        fullWidth
        multiple
        freeSolo
        options={tagOptions}
        value={editedProduct.tags || []}
        onInputChange={(_, q) => debouncedFetch(q)}
        onChange={(_, value) =>
          setEditedProduct({
            ...editedProduct,
            tags: (value as string[])
              .map((v) => String(v).trim())
              .filter(Boolean),
          })
        }
        renderTags={(value: readonly string[], getTagProps) =>
          value.map((option: string, index: number) => (
            <Chip
              variant="outlined"
              label={option}
              {...getTagProps({ index })}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...(params as any)}
            size="small"
            label="Tagi (wybierz z listy lub wpisz)"
            placeholder="np. dom, drewniany, premium"
          />
        )}
      />
      {editedProduct.img &&
        !isUploading &&
        (() => {
          const imageUrl =
            editedProduct.img.startsWith("data:") ||
            editedProduct.img.startsWith("http")
              ? editedProduct.img
              : editedProduct.img.startsWith("uploads/")
              ? `${config.API_BASE_URL}/${editedProduct.img}`
              : `${config.API_BASE_URL}/uploads/${editedProduct.img}`;
          return (
            <Box sx={{ maxWidth: 240 }}>
              <Box
                component="img"
                src={imageUrl}
                alt="Zdjęcie produktu"
                sx={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  maxHeight: 180,
                  objectFit: "contain",
                  borderRadius: 1,
                  border: "1px solid #eee",
                }}
                onError={(e: any) => {
                  console.error("Image load error:", imageUrl);
                  e.target.style.display = "none";
                }}
              />
            </Box>
          );
        })()}
      <Button component="label" fullWidth disabled={isUploading}>
        {isUploading
          ? "Przesyłanie..."
          : "Dodaj zdjęcie produktu (JPEG, max 1280x960px, max 5MB)"}
        <input
          onChange={handleFileInput}
          type="file"
          hidden
          accept="image/jpeg"
          disabled={isUploading}
        />
      </Button>
      {!canSave && (
        <CustomTypography className={styles.productErrorMessage}>
          Wypełnij wszystkie pola i dodaj zdjęcie produktu
        </CustomTypography>
      )}
      <Button
        onClick={() => {
          if (typeof productNum === "number" && productNum >= 0) {
            updateProduct(productNum, { ...editedProduct });
          } else {
            addProduct({ ...editedProduct });
          }
          onClose();
        }}
        disabled={!canSave}
        fullWidth
      >
        Zapisz
      </Button>
    </Box>
  );
}
