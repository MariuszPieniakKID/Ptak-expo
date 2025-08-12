import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { ReactComponent as CubeIcon } from '../../assets/cubeIcon.svg';
import { ReactComponent as DocumentsIcon } from '../../assets/documentsIcon.svg';
import { ReactComponent as DownloadIcon } from '../../assets/downloadIcon.svg';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box } from '@mui/material';
import { useState } from 'react';
import styles from './ExhibitorWithEvent.module.scss';
import EntryIntoTheTradeFairCatalogue from './entryIntoTheTradeFairCatalogue/EntryIntoTheTradeFairCatalogue';
import PresentedProduct from './presentedProduct/PresentedProduct';
import productImg from '../../assets/product.png';
import productImg_m from '../../assets/product_m.png';
import DownloadMaterials from './downloadMaterials/DownloadMaterials';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CustomTypography from '../customTypography/CustomTypography';
import { Exhibitor } from '../../services/api';

//1 TAB - DATA – wypełniane danymi wystawcy przekazanymi w props

const handleViewDirectoryEntry = (exhibitorId: number) => {
  console.log(`Klik w handleViewDirectoryEntry :${exhibitorId}`);
};

//2 TAB - DATA
const productsList = [
  {
    imageSrc: productImg,
    title: 'MTB ONE',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    tabList: ['tag1', 'tag2', 'tag3']
  },
  {
    imageSrc: productImg_m ,
    title: 'Produkt 2',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    tabList: ['tag1', 'tag2', 'tag3','tag4', 'tag5', 'tag6']
  },
    {
    imageSrc: productImg_m ,
    title: 'Produkt 3',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    tabList: null
  }
];

//3 TAB-DATA

const  documentsList = [
  {
    documentId:1,
    documentName:"nazwa dokumentu 1"
  },
  {
    documentId:2,
    documentName:"nazwa dokumentu 2"
  },      
  {
    documentId:3,
    documentName:"nazwa dokumentu 3"
  },
  {
    documentId:4,
    documentName:"nazwa dokumentu 4"
  },
  {
    documentId:5,
    documentName:"nazwa dokumentu 5"
  },
  {
    documentId:100,
    documentName:"nazwa dokumentu 6"
  },    
];

const handleSubmitDocument=(documentId:number)=>{
  console.log(`Kliknięto w document o id: ${documentId}`)
}

//ZESTAWIENIE DANYCH W ACCORDION PAGE 1




const buildItems = (exhibitor: Exhibitor | undefined) => {
  const exhibitorsDetails = {
    companyName: exhibitor?.companyName || '',
    logotyp: null as null,
    description: '',
    daneKontaktowe: {
      person: exhibitor?.contactPerson || '',
      phone: exhibitor?.phone || '',
      email: exhibitor?.email || '',
    },
    website: '',
    media: {
      facebook: '',
      youTube: '',
      linkedIn: '',
      instagram: '',
    },
  };

  return [
    {
      icon: <DocumentsIcon fontSize="small" />,
      title: 'Wpis do katalogu targowego',
      container: (
        <EntryIntoTheTradeFairCatalogue
          exhibitorsDetails={exhibitorsDetails}
          onViewDirectoryEntry={handleViewDirectoryEntry}
          exhibitorId={exhibitor?.id ?? 0}
        />
      ),
    },
  {
    icon: <CubeIcon fontSize="small" />,
    title: `Prezentowane produkty (${productsList.length})`,
    container:<PresentedProduct  products={productsList}/>
  },
  {
    icon: <DownloadIcon fontSize="small" />,
    title: `Materiały do pobrania (${documentsList.length})`,
    container:<DownloadMaterials  documentsList={documentsList} handleSubmitDocument={handleSubmitDocument}/>
   
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
};

function ExhibitorWithEvent({ 
  allowMultiple = true,
  exhibitorId,
  exhibitor
}: ExhibitorWithEventProps) {

  const items = buildItems(exhibitor);
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
              borderRadius: "20px",
              backgroundColor: accordionBg,
              boxShadow: "none",
              border: "none",
              position: "relative",
               '&:before': { 
                display: 'none',
              },
              zIndex: isExpanded ? 2 : 1,
              ...(isExpanded && {
                mt: idx === 0 ? 0 : -3,
                mb: -3
              })
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
                "&.Mui-expanded": { minHeight: 56 }
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
                  fontSize:'1rem'
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