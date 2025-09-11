import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { ReactComponent as CubeIcon } from '../../assets/cubeIcon.svg';
//import { ReactComponent as DocumentsIcon } from '../../assets/documentsIcon.svg';
import { ReactComponent as DownloadIcon } from '../../assets/downloadIcon.svg';
import {ReactComponent as DownloadIconBlue} from'../../assets/documentIconBlue.svg';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import styles from './ExhibitorWithEvent.module.scss';
import EntryIntoTheTradeFairCatalogue from './entryIntoTheTradeFairCatalogue/EntryIntoTheTradeFairCatalogue';
import PresentedProduct from './presentedProduct/PresentedProduct';
import productImg from '../../assets/product.png';
import DownloadMaterials from './downloadMaterials/DownloadMaterials';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CustomTypography from '../customTypography/CustomTypography';
import { Exhibitor, getBrandingFiles, getBrandingFileUrl, getExhibitorDocuments, downloadExhibitorDocument } from '../../services/api';
import config from '../../config/config';

//1 TAB - DATA – wypełniane danymi wystawcy przekazanymi w props

const handleViewDirectoryEntry = (exhibitorId: number) => {
  console.log(`Klik w handleViewDirectoryEntry :${exhibitorId}`);
};

// Typ produktu prezentowanego w UI
type PresentedProductItem = {
  imageSrc: string;
  title: string;
  description: string;
  tabList?: string[] | null;
};

//3 TAB-DATA
type MaterialItem = { documentId: number; documentName: string };

//ZESTAWIENIE DANYCH W ACCORDION PAGE 1

const buildItems = (
  exhibitor: Exhibitor | undefined,
  description: string,
  website: string,
  logoFileName: string | null,
  logoUrl: string | null,
  products: PresentedProductItem[],
  socials: { facebook: string; instagram: string; linkedIn: string; youTube: string; tiktok: string; x: string },
  materials: MaterialItem[],
  onDownload: (id: number) => void
) => {
  const exhibitorsDetails = {
    companyName: exhibitor?.companyName || '',
    logotyp: logoFileName,
    description: description || '',
    daneKontaktowe: {
      person: exhibitor?.contactPerson || '',
      phone: exhibitor?.phone || '',
      email: exhibitor?.email || '',
    },
    website: website || '',
    media: {
      facebook: socials.facebook || '',
      youTube: socials.youTube || '',
      linkedIn: socials.linkedIn || '',
      instagram: socials.instagram || '',
      tiktok: socials.tiktok || '',
      x: socials.x || ''
    },
  };

  return [
    {
      icon: <DownloadIconBlue fontSize="small" />,
      title: 'Wpis do katalogu targowego',
      container: (
        <EntryIntoTheTradeFairCatalogue
          exhibitorsDetails={exhibitorsDetails}
          onViewDirectoryEntry={handleViewDirectoryEntry}
          exhibitorId={exhibitor?.id ?? 0}
          logoUrl={logoUrl}
        />
      ),
    },
  {
    icon: <CubeIcon fontSize="small" />,
    title: `Prezentowane produkty (${products.length})`,
    container:<PresentedProduct  products={products}/>
  },
  {
    icon: <DownloadIcon fontSize="small" />,
    title: `Materiały do pobrania (${materials.length})`,
    container:<DownloadMaterials  documentsList={materials} handleSubmitDocument={onDownload}/>
   
  }
  ];
};

const handleRemindTheExhibitorToCompleteTheCatalog=(exhibitorId:number)=>{
  console.log(`Wyślij przypomnienie do uzupełnienia katalogu exhibitorId: ${exhibitorId}`)
}

type ExhibitorWithEventProps = {
  allowMultiple?: boolean; // domyślnie false
  exhibitorId: number;
  exhibitor?: Exhibitor;
  hasLogo?: boolean;
  exhibitionId?: number; // preferowany wybrany event
};

function ExhibitorWithEvent({ 
  allowMultiple = true,
  exhibitorId,
  exhibitor,
  exhibitionId: preferredExhibitionId
}: ExhibitorWithEventProps) {
  const [catalogDescription, setCatalogDescription] = useState<string>('');
  const [catalogWebsite, setCatalogWebsite] = useState<string>('');
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<PresentedProductItem[]>([]);
  const [catalogSocials, setCatalogSocials] = useState<{ facebook: string; instagram: string; linkedIn: string; youTube: string; tiktok: string; x: string }>({ facebook: '', instagram: '', linkedIn: '', youTube: '', tiktok: '', x: '' });
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [effectiveExhibitionId, setEffectiveExhibitionId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!exhibitor?.id) return;
        const token = localStorage.getItem('authToken') || '';
        let fallbackCatalogLogoDataUrl: string | null = null;
        let nextLogoFileName: string | null = null;
        let nextLogoUrl: string | null = null;

        // Determine effective exhibitionId for requests
        const effectiveExId = preferredExhibitionId ?? (Array.isArray(exhibitor.events) && exhibitor.events.length > 0
          ? (exhibitor.events[0] as any).id
          : undefined);
        setEffectiveExhibitionId(effectiveExId);

        // 1) Fetch catalog entry (exhibitor view)
        try {
          if (effectiveExId) {
            const res = await fetch(`${config.API_BASE_URL}/api/v1/catalog/${effectiveExId}?exhibitorId=${encodeURIComponent(String(exhibitor.id))}`, {
              headers: { 'Authorization': `Bearer ${token}` },
              credentials: 'include'
            });
            if (res.ok) {
              const json = await res.json();
              const data = json?.data || null;
              if (data) {
                setCatalogDescription(data.description || '');
                setCatalogWebsite(data.website || '');
                fallbackCatalogLogoDataUrl = data.logo || null;
                // Socials mapping (JSON string in data.socials)
                try {
                  const s = JSON.parse(data.socials || '{}') || {};
                  setCatalogSocials({
                    facebook: String(s.facebook || ''),
                    instagram: String(s.instagram || ''),
                    linkedIn: String(s.linkedin || s.linkedIn || ''),
                    youTube: String(s.youtube || s.youTube || ''),
                    tiktok: String(s.tiktok || s.tikTok || ''),
                    x: String(s.x || s.twitter || '')
                  });
                } catch {
                  setCatalogSocials({ facebook: '', instagram: '', linkedIn: '', youTube: '', tiktok: '', x: '' });
                }
              } else {
                setCatalogDescription('');
                setCatalogWebsite('');
                fallbackCatalogLogoDataUrl = null;
                setCatalogSocials({ facebook: '', instagram: '', linkedIn: '', youTube: '', tiktok: '', x: '' });
              }
            }
          }
        } catch {}

        // 2) Fetch branding files to determine logo filename and URL
        if (effectiveExId) {
          try {
            const filesResp = await getBrandingFiles(exhibitor.id, effectiveExId, token);
            const files = filesResp.files || {};
            // Prefer exhibitor-scoped event_logo, else first key containing 'logo', else any
            const preferredKey = files['event_logo']
              ? 'event_logo'
              : Object.keys(files).find(k => k.toLowerCase().includes('logo'))
                || Object.keys(files)[0];
            if (preferredKey && files[preferredKey]) {
              const value: any = files[preferredKey] as any;
              const file = Array.isArray(value) ? value[0] : value;
              if (file) {
                nextLogoFileName = file.originalName || file.fileName;
                nextLogoUrl = getBrandingFileUrl(exhibitor.id, file.fileName, token);
              }
            }
          } catch {
            // ignore, will try global fallback below
          }

          // If exhibitor-scoped logo not found, fall back to global event logo
          if (!nextLogoUrl) {
            try {
              const globalFilesResp = await getBrandingFiles(null, effectiveExId, token);
              const gfiles = globalFilesResp.files || {};
              if (gfiles['event_logo']) {
                const value: any = gfiles['event_logo'] as any;
                const file = Array.isArray(value) ? value[0] : value;
                if (file) {
                  nextLogoFileName = file.originalName || file.fileName;
                  nextLogoUrl = getBrandingFileUrl(null, file.fileName, token);
                }
              }
            } catch {
              // ignore, will try catalogue fallback below
            }
          }
        } else {
          nextLogoFileName = null;
          nextLogoUrl = null;
        }

        // 3) Fallback to catalogue stored data URL (base64) if no branding file
        if (!nextLogoUrl && fallbackCatalogLogoDataUrl) {
          // Try to infer extension from data URL
          const match = /^data:(.*?);base64,/.exec(fallbackCatalogLogoDataUrl);
          const mime = match?.[1] || 'image/png';
          const ext = mime.includes('jpeg') ? 'jpg' : (mime.split('/')[1] || 'png');
          nextLogoFileName = `logo.${ext}`;
          nextLogoUrl = fallbackCatalogLogoDataUrl;
        }

        setLogoFileName(nextLogoFileName);
        setLogoUrl(nextLogoUrl);

        // 4) Fetch presented products from catalog (admin endpoint)
        try {
          const prodRes = await fetch(`${config.API_BASE_URL}/api/v1/catalog/admin/${exhibitor.id}/products`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
          });
          if (prodRes.ok) {
            const res = prodRes; // alias to avoid stale references
            const prodJson = await res.json();
            const raw = Array.isArray(prodJson?.data) ? prodJson.data : [];
            const mapped: PresentedProductItem[] = raw.map((p: any) => ({
              imageSrc: p.img || productImg,
              title: p.name || '',
              description: p.description || '',
              tabList: Array.isArray(p.tabList) ? p.tabList : null
            }));
            setProducts(mapped);
          } else {
            setProducts([]);
          }
        } catch {
          setProducts([]);
        }

        // 5) Fetch exhibitor documents (materials) for this exhibition
        try {
          if (effectiveExId) {
            const docs = await getExhibitorDocuments(exhibitor.id, effectiveExId, token);
            const list: MaterialItem[] = docs.map(d => ({ documentId: d.id, documentName: d.originalName || d.title || d.fileName }));
            setMaterials(list);
          } else {
            setMaterials([]);
          }
        } catch {
          setMaterials([]);
        }
      } catch {}
    };
    loadData();
  }, [exhibitor?.id, exhibitor?.events, preferredExhibitionId]);

  const handleDownloadMaterial = async (documentId: number) => {
    try {
      if (!exhibitor?.id || !effectiveExhibitionId) return;
      const item = materials.find(m => m.documentId === documentId);
      const filename = item?.documentName || 'document';
      await downloadExhibitorDocument(exhibitor.id, effectiveExhibitionId, documentId, filename, localStorage.getItem('authToken') || '');
    } catch (e) {
      // Silent fail to avoid breaking UI
    }
  };

  const items = buildItems(exhibitor, catalogDescription, catalogWebsite, logoFileName, logoUrl, products, catalogSocials, materials, handleDownloadMaterial);
  const [expandedAccordions, setExpandedAccordions] = useState<boolean[]>(Array(items.length).fill(false));
  const [expandedOne, setExpandedOne] = useState<number | false>(false);

  const handleChangeMultiple = (index: number) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedAccordions(prev =>
      prev.map((opened, i) => (i === index ? isExpanded : opened))
    );
  };

  const handleChangeSingle = (index: number) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedOne(isExpanded ? index : false);
  };

  return (
    <Box className={styles.container}>
      {items.map((item, idx) => {
        const isExpanded = allowMultiple
          ? expandedAccordions[idx]
          : expandedOne === idx;

        const handleChange = allowMultiple
          ? handleChangeMultiple(idx)
          : handleChangeSingle(idx);
        const accordionBg = idx % 2 === 0 ? "#f5f5f5" : "#fff";
        const iconBg = idx % 2 === 0 ? "#fff" : "#f5f5f5";

        return (
          <Accordion
            key={item.title}
            expanded={isExpanded}
            onChange={handleChange}
            disableGutters
            elevation={0}
            square
            sx={{
              padding: '0px 24px !important',
               '@media (max-width:440px)': {
                padding: '0px 8px !important',
              },
              borderRadius: "20px",
              backgroundColor: accordionBg,
              boxShadow: "none",
              border: "none",
              position: "relative",
               '&:before': { 
                display: 'none',
              },
              zIndex: 'auto',
            }}
          >
            <AccordionSummary
              expandIcon={
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
                  boxSizing: "border-box",                
                }}
              >
                <ExpandMoreIcon sx={{ color: '#6f87f6', fontSize: 28 }} />
              </Box>
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: iconBg,
                    boxShadow: "0 2px 8px 0 rgba(94,101,119,0.06)"
                  }}
                >
                  {item.icon}
                </Box>
                <Typography 
                sx={{ 
                  margin: "24px 0",
                  fontWeight:600,
                  fontSize:'1rem',
                  '@media (max-width:440px)': {
                    fontSize:'13px',
                  },

                   }} component="span">
                  {item.title}
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                borderRadius: "0 0 20px 20px",
                pb: 2,
                pt: 1.5
              }}
            >
              <Typography
                sx={{
                  margin: '0px 0px',
                  marginBottom: '30px',
                }}
                component="div"
              >
                {item.container}
              </Typography>
            </AccordionDetails>
          </Accordion>
        );
      })}
      <Box 
      className={styles.action}
       onClick={() => handleRemindTheExhibitorToCompleteTheCatalog(exhibitorId)}
      >
        <CustomTypography className={styles.actionText}>Przypomnij wystawcy o uzupełnieniu katalogu</CustomTypography>
        <NotificationsNoneIcon style={{ color: '#fff' }}/>
      </Box>
    </Box>
  );
}

export default ExhibitorWithEvent;