import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
import ChecklistCard from "./checklistCard";
import {ReactNode, useCallback, useEffect, useMemo, useState} from "react";
import {useChecklist} from "../../contexts/ChecklistContext";
import GreenCheck from "./GreenCheck";
import config from "../../config/config";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import YouTubeIcon from "@mui/icons-material/YouTube";

function DisplayEdit({
  text,
  onEdit,
  checked,
}: {
  text: ReactNode;
  onEdit: () => void;
  checked?: boolean;
}) {
  return (
    <Box display="flex" alignItems="center">
      <Box width="30px" alignItems="center" justifyContent="center">
        {checked && <GreenCheck />}
      </Box>
      {text}
      <IconButton color="secondary" onClick={onEdit} sx={{marginLeft: "auto"}}>
        <SvgIcon>
          <svg
            width="29"
            height="29"
            viewBox="0 0 29 29"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="14.499" cy="14.5" r="14" stroke="#A7A7A7" />
            <path
              d="M12.626 18.1979L10.3394 18.7888C9.84221 18.9174 9.38964 18.4648 9.51822 17.9678L10.1094 15.6813C10.2623 15.089 10.5712 14.5485 11.0038 14.116L17.2068 7.91294C18.0868 7.03293 19.5138 7.03293 20.3941 7.91294C21.2744 8.7932 21.2744 10.2202 20.3941 11.1005L14.1911 17.3035C13.7587 17.7361 13.2181 18.0449 12.626 18.1979Z"
              stroke="#A7A7A7"
              strokeLinecap="round"
            />
            <line
              x1="17.0216"
              y1="8.80566"
              x2="19.502"
              y2="11.2861"
              stroke="#A7A7A7"
              strokeLinecap="round"
            />
            <line
              x1="11.7315"
              y1="14.0952"
              x2="14.2119"
              y2="16.5756"
              stroke="#A7A7A7"
              strokeLinecap="round"
            />
            <line
              x1="10.0508"
              y1="21.75"
              x2="20.4453"
              y2="21.75"
              stroke="#A7A7A7"
              strokeLinecap="round"
            />
          </svg>
        </SvgIcon>
      </IconButton>
    </Box>
  );
}
function StringEdit({
  name,
  value,
  onChange,
  multiline,
}: {
  name: string;
  value: string | null;
  onChange: (s: string | null) => void;
  multiline?: boolean;
}) {
  const [isEdit, setIsEdit] = useState(false);
  const [editText, setEditText] = useState<string>(value || "");
  useEffect(() => setEditText(value || ""), [value]);
  if (!isEdit) {
    return (
      <DisplayEdit
        text={name + ": " + (value || "")}
        onEdit={() => setIsEdit(true)}
        checked={value != null}
      />
    );
  }
  return (
    <Box display="flex" alignItems="center">
      <Box width="30px" alignItems="center" justifyContent="center">
        {value != null && <GreenCheck />}
      </Box>
      <TextField
        variant="standard"
        label={name}
        InputLabelProps={{shrink: true}}
        value={editText}
        onChange={(e) => {
          setEditText(e.target.value);
        }}
        fullWidth
        multiline={multiline || false}
      />
      <Button
        onClick={() => {
          onChange(editText !== "" ? editText : null);
          setIsEdit(false);
        }}
      >
        Zapisz
      </Button>
    </Box>
  );
}
function ImageEdit({
  name,
  onChange,
  value,
}: {
  name: string;
  value: string | null;
  onChange: (s: string | null) => void;
  multiline?: boolean;
}) {
  const [isEdit, setIsEdit] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files == null) return;
      const file = e.target.files[0];
      if (file == null) return;
      
      // Validate file type (PNG only)
      if (!file.type.match(/^image\/png$/)) {
        alert('Logotyp musi być w formacie PNG');
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 50 KB)
      const maxSize = 50 * 1024; // 50 KB
      if (file.size > maxSize) {
        alert('Logotyp nie może przekraczać 50 KB');
        e.target.value = '';
        return;
      }
      
      // Validate image dimensions (300x200)
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        img.src = event.target?.result as string;
        img.onload = async () => {
          if (img.width !== 300 || img.height !== 200) {
            alert('Logotyp musi mieć wymiary 300x200 pikseli');
            e.target.value = '';
            return;
          }
          
          // All validations passed, proceed with upload
          setIsUploading(true);
          try {
            // Get exhibitor ID and exhibition ID from context/storage
            const token = localStorage.getItem('authToken') || '';
            const exhibitionId = Number((window as any).currentSelectedExhibitionId) || 0;
            
            // Get exhibitor ID
            const meRes = await fetch(`${require('../../config/config').default.API_BASE_URL}/api/v1/exhibitors/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const meData = await meRes.json();
            const exhibitorId = meData?.data?.id;
            
            if (!exhibitorId || !exhibitionId) {
              alert('Nie można pobrać informacji o wystawcy');
              setIsUploading(false);
              return;
            }
            
            // Upload file via API
            const { exhibitorDocumentsAPI } = await import('../../services/api');
            const fileName = await exhibitorDocumentsAPI.uploadCatalogImage(
              exhibitorId,
              exhibitionId,
              file,
              'logo'
            );
            
            // Save filename (not base64) to catalog
            onChange(fileName);
            setIsEdit(false);
          } catch (error) {
            console.error('Upload error:', error);
            alert('Błąd podczas przesyłania pliku');
          } finally {
            setIsUploading(false);
          }
        };
      };
      
      reader.readAsDataURL(file);
    },
    [onChange]
  );
  if (!isEdit) {
    // Generate image URL from filename or base64
    const imageUrl = value
      ? (value.startsWith('data:') || value.startsWith('http') 
          ? value 
          : value.startsWith('uploads/')
            ? `${require('../../config/config').default.API_BASE_URL}/${value}`
            : `${require('../../config/config').default.API_BASE_URL}/uploads/${value}`)
      : null;
    
    return (
      <Box>
        <DisplayEdit
          text={name}
          onEdit={() => setIsEdit(true)}
          checked={value != null}
        />
        {imageUrl && (
          <Box mt={1} display="flex" alignItems="center" gap={2}>
            <img
              src={imageUrl}
              alt="Podgląd logotypu"
              style={{maxHeight: 120, borderRadius: 8}}
              onError={(e) => {
                console.error('Image load error:', imageUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsEdit(true)}
              disabled={isUploading}
            >
              Podmień
            </Button>
          </Box>
        )}
        {isUploading && (
          <Box mt={1}>
            <Typography variant="body2">Przesyłanie...</Typography>
          </Box>
        )}
      </Box>
    );
  }
  return (
    <Box>
      <Box display="flex" alignItems="center">
        <Box width="30px" alignItems="center" justifyContent="center">
          {value != null && <GreenCheck />}
        </Box>
        <Button component="label" fullWidth disabled={isUploading}>
          {isUploading ? 'Przesyłanie...' : 'Wybierz logotyp (PNG, 300x200px, max 50KB)'}
          <input
            onChange={handleFileInput}
            type="file"
            hidden
            accept="image/png"
            disabled={isUploading}
          />
        </Button>
      </Box>
      {value && !isUploading && (() => {
        const imageUrl = value.startsWith('data:') || value.startsWith('http') 
          ? value 
          : value.startsWith('uploads/')
            ? `${require('../../config/config').default.API_BASE_URL}/${value}`
            : `${require('../../config/config').default.API_BASE_URL}/uploads/${value}`;
        return (
          <Box mt={1}>
            <img
              src={imageUrl}
              alt="Podgląd logotypu"
              style={{maxHeight: 120, borderRadius: 8}}
              onError={(e) => {
                console.error('Image load error:', imageUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </Box>
        );
      })()}
    </Box>
  );
}

/*function TextBoxEdit({name, value}: {name: string, value: string | null, onChange?: (s: string | null) => void}) {
	const [isEdit, setIsEdit] = useState(false);
	if (!isEdit) {
		return <DisplayEdit text={name + ": " + value} onEdit={() => setIsEdit(true)} />	}
	return <></>
}*/

export default function CompanyInfo() {
  var {checklist, saveCompanyInfo, companyInfoFilledCount} = useChecklist();
  const [catalogTagOptions, setCatalogTagOptions] = useState<string[]>([]);
  const [editingCatalogTags, setEditingCatalogTags] = useState(false);
  const [catalogInputValue, setCatalogInputValue] = useState<string>("");
  const currentCatalogTagsArray = useMemo(() => {
    const raw = (checklist.companyInfo as any).catalogTags || "";
    return String(raw || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [checklist.companyInfo]);
  const [selectedCatalogTags, setSelectedCatalogTags] = useState<string[]>(
    currentCatalogTagsArray
  );
  useEffect(
    () => setSelectedCatalogTags(currentCatalogTagsArray),
    [currentCatalogTagsArray]
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
            headers: {Authorization: `Bearer ${token}`},
          });
          if (res.ok) {
            const j = await res.json();
            const list = Array.isArray(j.data)
              ? j.data.map((r: any) => String(r.tag))
              : [];
            setCatalogTagOptions(list);
          }
        } catch {}
      }, 250);
    };
  }, []);
  useEffect(() => {
    debouncedFetch("");
  }, [debouncedFetch]);

  // Brands state and suggestions
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [editingBrands, setEditingBrands] = useState(false);
  const brandsRaw = (checklist.companyInfo as any).brands || "";
  const currentBrandsArray = useMemo(
    () =>
      String(brandsRaw || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [brandsRaw]
  );
  const [selectedBrands, setSelectedBrands] =
    useState<string[]>(currentBrandsArray);
  useEffect(() => setSelectedBrands(currentBrandsArray), [currentBrandsArray]);
  const [brandsInputValue, setBrandsInputValue] = useState<string>("");
  const debouncedBrandsFetch = useMemo(() => {
    let t: any;
    return (q: string) => {
      clearTimeout(t);
      t = setTimeout(async () => {
        try {
          const token = localStorage.getItem("authToken") || "";
          const base =
            config.API_BASE_URL || (window as any).API_BASE_URL || "";
          const url = q
            ? `${base}/api/v1/catalog/brands?query=${encodeURIComponent(q)}`
            : `${base}/api/v1/catalog/brands`;
          const res = await fetch(url, {
            headers: {Authorization: `Bearer ${token}`},
          });
          if (res.ok) {
            const j = await res.json();
            const list = Array.isArray(j.data)
              ? j.data.map((r: any) => String(r.brand))
              : [];
            setBrandOptions(list);
          }
        } catch {}
      }, 250);
    };
  }, []);
  useEffect(() => {
    debouncedBrandsFetch("");
  }, [debouncedBrandsFetch]);

  // Industries (event-scoped) state and suggestions
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [editingIndustries, setEditingIndustries] = useState(false);
  const industriesRaw = (checklist.companyInfo as any).industries || "";
  const currentIndustriesArray = useMemo(
    () =>
      String(industriesRaw || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [industriesRaw]
  );
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    currentIndustriesArray
  );
  useEffect(
    () => setSelectedIndustries(currentIndustriesArray),
    [currentIndustriesArray]
  );
  const [industriesInputValue, setIndustriesInputValue] = useState<string>("");
  const debouncedIndustriesFetch = useMemo(() => {
    let t: any;
    return (q: string) => {
      clearTimeout(t);
      t = setTimeout(async () => {
        try {
          const token = localStorage.getItem("authToken") || "";
          const base =
            config.API_BASE_URL || (window as any).API_BASE_URL || "";
          const url = q
            ? `${base}/api/v1/catalog/industries?query=${encodeURIComponent(q)}`
            : `${base}/api/v1/catalog/industries`;
          const res = await fetch(url, {
            headers: {Authorization: `Bearer ${token}`},
          });
          if (res.ok) {
            const j = await res.json();
            const list = Array.isArray(j.data)
              ? j.data.map((r: any) => String(r.industry))
              : [];
            setIndustryOptions(list);
          }
        } catch {}
      }, 250);
    };
  }, []);
  useEffect(() => {
    debouncedIndustriesFetch("");
  }, [debouncedIndustriesFetch]);

  // Socials draft state synced from backend value; save happens on explicit button click
  const [socialsDraft, setSocialsDraft] = useState<any>({});
  useEffect(() => {
    let parsed: any = {};
    try {
      parsed = JSON.parse(checklist.companyInfo.socials || "{}") || {};
    } catch {}
    setSocialsDraft(parsed);
  }, [checklist.companyInfo.socials]);
  const [editingSocials, setEditingSocials] = useState<boolean>(false);

  return (
    <ChecklistCard
      secondaryBackground
      icon={<img src={`/assets/checklist-step-1.svg`} alt=""></img>}
      title={
        <Typography fontSize={16} color="#2E2E38" fontWeight={700}>
          Wpis do katalogu targowego ({companyInfoFilledCount}/6)
        </Typography>
      }
      checked={companyInfoFilledCount === 6}
    >
      <StringEdit
        name="Nazwa firmy"
        value={checklist.companyInfo.name}
        onChange={(v) => saveCompanyInfo({...checklist.companyInfo, name: v})}
      />
      <StringEdit
        name="Nazwa firmy do wyświetlania"
        value={
          (checklist.companyInfo as any).displayName ||
          checklist.companyInfo.name
        }
        onChange={(v) =>
          saveCompanyInfo({...(checklist.companyInfo as any), displayName: v})
        }
      />
      <ImageEdit
        name="Logotyp"
        value={checklist.companyInfo.logo}
        onChange={(v) => saveCompanyInfo({...checklist.companyInfo, logo: v})}
      />
      <StringEdit
        name="Opis"
        value={checklist.companyInfo.description}
        onChange={(v) =>
          saveCompanyInfo({...checklist.companyInfo, description: v})
        }
        multiline
      />
      <StringEdit
        name="Dlaczego warto odwiedzić nasze stoisko?"
        value={(checklist.companyInfo as any).whyVisit ?? null}
        onChange={(v) =>
          saveCompanyInfo({
            ...(checklist.companyInfo as any),
            whyVisit: v as any,
          })
        }
        multiline
      />
      {/* Catalog Contact Info - separate fields for catalog display only */}
      <StringEdit
        name="Osoba kontaktowa (do katalogu)"
        value={(checklist.companyInfo as any).catalogContactPerson || null}
        onChange={(v) =>
          saveCompanyInfo({...(checklist.companyInfo as any), catalogContactPerson: v})
        }
      />
      <StringEdit
        name="Telefon kontaktowy (do katalogu)"
        value={(checklist.companyInfo as any).catalogContactPhone || null}
        onChange={(v) =>
          saveCompanyInfo({...(checklist.companyInfo as any), catalogContactPhone: v})
        }
      />
      <StringEdit
        name="E-mail kontaktowy (do katalogu)"
        value={(checklist.companyInfo as any).catalogContactEmail || null}
        onChange={(v) =>
          saveCompanyInfo({...(checklist.companyInfo as any), catalogContactEmail: v})
        }
      />
      <StringEdit
        name="Strona www"
        value={checklist.companyInfo.website}
        onChange={(v) =>
          saveCompanyInfo({...checklist.companyInfo, website: v})
        }
      />
      {/* Read-only email field - for login credentials only */}
      <Box display="flex" alignItems="center">
        <Box width="30px" alignItems="center" justifyContent="center">
          {(checklist.companyInfo as any).contactEmail && <GreenCheck />}
        </Box>
        <Typography variant="body2">
          Adres e-mail do logowania: {(checklist.companyInfo as any).contactEmail || ""}
        </Typography>
      </Box>
      {!editingCatalogTags && (
        <Box display="flex" alignItems="center">
          <Box width="30px" alignItems="center" justifyContent="center">
            {currentCatalogTagsArray.length > 0 && <GreenCheck />}
          </Box>
          <Box flex={1}>
            <Typography variant="body2">
              Sektory technologiczne (Wybierz lub stwórz tagi):{" "}
              {currentCatalogTagsArray.join(", ")}
            </Typography>
          </Box>
          <Button onClick={() => setEditingCatalogTags(true)}>Edytuj</Button>
        </Box>
      )}
      {editingCatalogTags && (
        <Box display="flex" alignItems="center" gap={1} width="100%">
          <Box width="30px" alignItems="center" justifyContent="center">
            {selectedCatalogTags.length > 0 && <GreenCheck />}
          </Box>
          <Autocomplete
            fullWidth
            sx={{flex: 1, minWidth: 0}}
            multiple
            freeSolo
            options={catalogTagOptions}
            value={selectedCatalogTags}
            inputValue={catalogInputValue}
            onInputChange={(_, q) => {
              setCatalogInputValue(q);
              debouncedFetch(q);
            }}
            onChange={(_, value) =>
              setSelectedCatalogTags(
                (value as string[]).map((v) => String(v).trim()).filter(Boolean)
              )
            }
            renderTags={(value: readonly string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({index})}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...(params as any)}
                fullWidth
                variant="standard"
                label="Sektory technologiczne (Wybierz lub stwórz tagi)"
                placeholder="zacznij pisać, aby dodać"
              />
            )}
          />
          <Button
            onClick={() => {
              // Dołącz także ręcznie wpisane po przecinku (jeszcze nie dodane jako chipy)
              const manual = String(catalogInputValue || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const final = Array.from(
                new Set([...(selectedCatalogTags || []), ...manual])
              );
              setSelectedCatalogTags(final);
              setCatalogInputValue("");
              setEditingCatalogTags(false);
              saveCompanyInfo({
                ...(checklist.companyInfo as any),
                catalogTags: final.join(",") as any,
              });
            }}
          >
            Zapisz
          </Button>
        </Box>
      )}
      {/* Brands (Brandy) */}
      {!editingBrands && (
        <Box display="flex" alignItems="center">
          <Box width="30px" alignItems="center" justifyContent="center">
            {currentBrandsArray.length > 0 && <GreenCheck />}
          </Box>
          <Box flex={1}>
            <Typography variant="body2">
              Brandy: {currentBrandsArray.join(", ")}
            </Typography>
          </Box>
          <Button onClick={() => setEditingBrands(true)}>Edytuj</Button>
        </Box>
      )}
      {editingBrands && (
        <Box display="flex" alignItems="center" gap={1} width="100%">
          <Box width="30px" alignItems="center" justifyContent="center">
            {selectedBrands.length > 0 && <GreenCheck />}
          </Box>
          <Autocomplete
            fullWidth
            sx={{flex: 1, minWidth: 0}}
            multiple
            freeSolo
            options={brandOptions}
            value={selectedBrands}
            inputValue={brandsInputValue}
            onInputChange={(_, q) => {
              setBrandsInputValue(q);
              debouncedBrandsFetch(q);
            }}
            onChange={(_, value) =>
              setSelectedBrands(
                (value as string[]).map((v) => String(v).trim()).filter(Boolean)
              )
            }
            renderTags={(value: readonly string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({index})}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...(params as any)}
                fullWidth
                variant="standard"
                label="Brandy"
                placeholder="zacznij pisać, aby dodać"
              />
            )}
          />
          <Button
            onClick={() => {
              const manual = String(brandsInputValue || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const final = Array.from(
                new Set([...(selectedBrands || []), ...manual])
              );
              setSelectedBrands(final);
              setBrandsInputValue("");
              setEditingBrands(false);
              saveCompanyInfo({
                ...(checklist.companyInfo as any),
                brands: final.join(",") as any,
              });
            }}
          >
            Zapisz
          </Button>
        </Box>
      )}

      {/* Social media structured links */}
      {(() => {
        const persistKey = (key: string) => {
          const raw = String(socialsDraft[key] || "").trim();
          const next = {...(socialsDraft || {})} as any;
          if (raw) next[key] = raw;
          else delete next[key];
          saveCompanyInfo({
            ...checklist.companyInfo,
            socials: JSON.stringify(next),
          });
          setSocialsDraft(next);
        };
        const hasAny = Object.values(socialsDraft || {}).some(
          (v) => String(v || "").trim() !== ""
        );
        const linkIcon = (
          key:
            | "facebook"
            | "instagram"
            | "x"
            | "tiktok"
            | "linkedin"
            | "youtube",
          href?: string
        ) => {
          if (!href) return null;
          const Icon =
            key === "facebook"
              ? FacebookIcon
              : key === "instagram"
              ? InstagramIcon
              : key === "x"
              ? TwitterIcon
              : key === "tiktok"
              ? MusicNoteIcon
              : key === "linkedin"
              ? LinkedInIcon
              : YouTubeIcon;
          return (
            <Box
              key={key}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key}
                style={{color: "inherit"}}
              >
                <Icon fontSize="small" />
              </a>
            </Box>
          );
        };
        return (
          <Box>
            <DisplayEdit
              text={<Typography variant="body2">Social media</Typography>}
              onEdit={() => setEditingSocials((v) => !v)}
              checked={hasAny}
            />
            {!editingSocials && hasAny && (
              <Box
                mt={1}
                display="grid"
                gridTemplateColumns="repeat(6, 28px)"
                gap={1}
              >
                {linkIcon("facebook", socialsDraft.facebook)}
                {linkIcon("instagram", socialsDraft.instagram)}
                {linkIcon("youtube", socialsDraft.youtube)}
                {linkIcon("x", socialsDraft.x)}
                {linkIcon("tiktok", socialsDraft.tiktok)}
                {linkIcon("linkedin", socialsDraft.linkedin)}
              </Box>
            )}
            {editingSocials && (
              <Box
                mt={1}
                display="grid"
                gridTemplateColumns="28px 1fr auto"
                gap={1}
              >
                <Box display="flex" alignItems="center" justifyContent="center">
                  <FacebookIcon fontSize="small" />
                </Box>
                <TextField
                  variant="standard"
                  value={socialsDraft.facebook || ""}
                  onChange={(e) =>
                    setSocialsDraft({...socialsDraft, facebook: e.target.value})
                  }
                  placeholder="https://facebook.com/..."
                />
                <Button size="small" onClick={() => persistKey("facebook")}>
                  Zapisz
                </Button>

                <Box display="flex" alignItems="center" justifyContent="center">
                  <InstagramIcon fontSize="small" />
                </Box>
                <TextField
                  variant="standard"
                  value={socialsDraft.instagram || ""}
                  onChange={(e) =>
                    setSocialsDraft({
                      ...socialsDraft,
                      instagram: e.target.value,
                    })
                  }
                  placeholder="https://instagram.com/..."
                />
                <Button size="small" onClick={() => persistKey("instagram")}>
                  Zapisz
                </Button>

                <Box display="flex" alignItems="center" justifyContent="center">
                  <YouTubeIcon fontSize="small" />
                </Box>
                <TextField
                  variant="standard"
                  value={socialsDraft.youtube || ""}
                  onChange={(e) =>
                    setSocialsDraft({...socialsDraft, youtube: e.target.value})
                  }
                  placeholder="https://youtube.com/@..."
                />
                <Button size="small" onClick={() => persistKey("youtube")}>
                  Zapisz
                </Button>

                <Box display="flex" alignItems="center" justifyContent="center">
                  <TwitterIcon fontSize="small" />
                </Box>
                <TextField
                  variant="standard"
                  value={socialsDraft.x || ""}
                  onChange={(e) =>
                    setSocialsDraft({...socialsDraft, x: e.target.value})
                  }
                  placeholder="https://x.com/..."
                />
                <Button size="small" onClick={() => persistKey("x")}>
                  Zapisz
                </Button>

                <Box display="flex" alignItems="center" justifyContent="center">
                  <MusicNoteIcon fontSize="small" />
                </Box>
                <TextField
                  variant="standard"
                  value={socialsDraft.tiktok || ""}
                  onChange={(e) =>
                    setSocialsDraft({...socialsDraft, tiktok: e.target.value})
                  }
                  placeholder="https://tiktok.com/@..."
                />
                <Button size="small" onClick={() => persistKey("tiktok")}>
                  Zapisz
                </Button>

                <Box display="flex" alignItems="center" justifyContent="center">
                  <LinkedInIcon fontSize="small" />
                </Box>
                <TextField
                  variant="standard"
                  value={socialsDraft.linkedin || ""}
                  onChange={(e) =>
                    setSocialsDraft({...socialsDraft, linkedin: e.target.value})
                  }
                  placeholder="https://linkedin.com/company/..."
                />
                <Button size="small" onClick={() => persistKey("linkedin")}>
                  Zapisz
                </Button>
              </Box>
            )}
          </Box>
        );
      })()}

      {/* Industries (Branże) */}
      {!editingIndustries && (
        <Box display="flex" alignItems="center">
          <Box width="30px" alignItems="center" justifyContent="center">
            {currentIndustriesArray.length > 0 && <GreenCheck />}
          </Box>
          <Box flex={1}>
            <Typography variant="body2">
              Branże (eventowe): {currentIndustriesArray.join(", ")}
            </Typography>
          </Box>
          <Button onClick={() => setEditingIndustries(true)}>Edytuj</Button>
        </Box>
      )}
      {editingIndustries && (
        <Box display="flex" alignItems="center" gap={1} width="100%">
          <Box width="30px" alignItems="center" justifyContent="center">
            {selectedIndustries.length > 0 && <GreenCheck />}
          </Box>
          <Autocomplete
            fullWidth
            sx={{flex: 1, minWidth: 0}}
            multiple
            freeSolo
            options={industryOptions}
            value={selectedIndustries}
            inputValue={industriesInputValue}
            onInputChange={(_, q) => {
              setIndustriesInputValue(q);
              debouncedIndustriesFetch(q);
            }}
            onChange={(_, value) =>
              setSelectedIndustries(
                (value as string[]).map((v) => String(v).trim()).filter(Boolean)
              )
            }
            renderTags={(value: readonly string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({index})}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...(params as any)}
                fullWidth
                variant="standard"
                label="Branże (eventowe)"
                placeholder="zacznij pisać, aby dodać"
              />
            )}
          />
          <Button
            onClick={async () => {
              const manual = String(industriesInputValue || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const final = Array.from(
                new Set([...(selectedIndustries || []), ...manual])
              );
              setSelectedIndustries(final);
              setIndustriesInputValue("");
              setEditingIndustries(false);
              // Persist event-scoped industries in exhibitor_catalog_entries for current exhibition
              try {
                const token = localStorage.getItem("authToken") || "";
                const exhibitionId =
                  Number((window as any).currentSelectedExhibitionId) || 0;
                await fetch(
                  `${config.API_BASE_URL}/api/v1/catalog/${exhibitionId}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({industries: final.join(",")}),
                  }
                );
              } catch {}
              // Upsert to global industries dictionary for suggestions
              try {
                const token = localStorage.getItem("authToken") || "";
                await fetch(
                  `${config.API_BASE_URL}/api/v1/catalog/industries`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({industries: final}),
                  }
                );
              } catch {}
              // Local optimistic update
              saveCompanyInfo({
                ...(checklist.companyInfo as any),
                industries: final.join(",") as any,
              });
            }}
          >
            Zapisz
          </Button>
        </Box>
      )}

      {/*<div className={styles.sectionList}>
			{['Nazwa Firmy','Logotyp','Opis','Dane kontaktowe','Strona www.','Social Media'].map((it) => (
				<div key={it} className={styles.sectionRow}><span>{it}</span><div className={styles.sectionGoodDot} /></div>
			))}
		</div>
		<div className={styles.sectionLink}>Podejrzyj wygląd wpisu do katalogu</div>*/}
    </ChecklistCard>
  );
}
