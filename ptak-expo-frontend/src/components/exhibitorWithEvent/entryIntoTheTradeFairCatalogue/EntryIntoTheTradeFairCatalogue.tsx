import { Box } from '@mui/material';
import CustomTypography from '../../customTypography/CustomTypography';
import { ReactComponent as GreenCiorcleIcon} from '../../../assets/greenCircleWithACheck.svg';
import { ReactComponent as GrayCircleIcon} from '../../../assets/grayDashedCircle.svg';
// import {ReactComponent as Fa} from "../../../assets/eyeIcon.svg";
 import {ReactComponent as FaceBookIcon} from "../../../assets/fIcon.svg";
 import {ReactComponent as InstagramIcon} from "../../../assets/instagramIcon.svg";
import {ReactComponent as LinkekInIcon} from "../../../assets/inIcon.svg";
import {ReactComponent as YouTobeIcon} from "../../../assets/youTubeIcon.svg";
import {ReactComponent as XIcon} from "../../../assets/xIcon.svg";

import {ReactComponent as EyeIcon} from "../../../assets/eyeIcon.svg";
import styles from './EntryIntoTheTradeFairCatalogue.module.scss';

type ExhibitorsDetails = {
  companyName: string;
  logotyp: string | null;
  description: string;
  daneKontaktowe: {
    person: string;
    phone: string;
    email: string;
  };
  website: string;
  media: {
    facebook: string;
    youTube: string;
    linkedIn: string;
    instagram: string;
    tiktok?: string;
    x?: string;
  };
};

type EntryIntoTheTradeFairCatalogueProps = {
  exhibitorsDetails: ExhibitorsDetails,
  exhibitorId:number;
  onViewDirectoryEntry: (exhibitorId: number) => void,
  logoUrl?: string | null,
};

function EntryIntoTheTradeFairCatalogue({ 
    exhibitorsDetails,
    exhibitorId, 
    onViewDirectoryEntry,
    logoUrl

}: EntryIntoTheTradeFairCatalogueProps) {
  const hasAnySocial = Boolean(
    (exhibitorsDetails.media.facebook || '').trim() ||
    (exhibitorsDetails.media.instagram || '').trim() ||
    (exhibitorsDetails.media.linkedIn || '').trim() ||
    (exhibitorsDetails.media.youTube || '').trim() ||
    (exhibitorsDetails.media.tiktok || '').trim()
  );
  return (
   <>
    <Box className={styles.singleLine}>
      {exhibitorsDetails.companyName
      ?<GreenCiorcleIcon className={styles.icon}/>
      :<GrayCircleIcon className={styles.iconGray}/>} 
      <CustomTypography className={styles.label}>Nazwa firmy: </CustomTypography>
      {exhibitorsDetails.companyName!=='' 
      &&<CustomTypography className={styles.value}>{exhibitorsDetails.companyName}</CustomTypography>}
    </Box>
     <Box className={styles.singleLine}>
      {exhibitorsDetails.logotyp
      ?<GreenCiorcleIcon className={styles.icon}/>
      :<GrayCircleIcon className={styles.iconGray}/>} 
      <CustomTypography className={styles.label}>Logotyp: </CustomTypography>
      {exhibitorsDetails.logotyp!==null && (
        logoUrl ? (
          <a href={logoUrl} className={styles.value} download>
            {exhibitorsDetails.logotyp}
          </a>
        ) : (
          <CustomTypography className={styles.value}>{exhibitorsDetails.logotyp}</CustomTypography>
        )
      )}
    </Box> 
    <Box className={styles.singleLine}>
      {exhibitorsDetails.description
      ?<GreenCiorcleIcon className={styles.icon}/>
      :<GrayCircleIcon className={styles.iconGray}/>} 
      <CustomTypography className={styles.label}>Opis: </CustomTypography>
     {exhibitorsDetails.description !=='' 
     &&<CustomTypography className={styles.value}>{exhibitorsDetails.description}</CustomTypography>}
    </Box> 
    <Box className={styles.singleLine}>
        <Box>
            {
            (exhibitorsDetails.daneKontaktowe.person!==''
            && exhibitorsDetails.daneKontaktowe.phone!==''
            && exhibitorsDetails.daneKontaktowe.email!=='')
            ?<GreenCiorcleIcon className={styles.icon}/>
            :<GrayCircleIcon className={styles.iconGray}/>} 
        </Box>
        <Box className={styles.rowWrapper}>
            <Box className={styles.row}>
                <CustomTypography className={styles.label}>Dane kontaktowe: </CustomTypography>
      {exhibitorsDetails.daneKontaktowe.person !==''
      &&<CustomTypography className={styles.value}>{exhibitorsDetails.daneKontaktowe.person}</CustomTypography>}
            </Box>
            <Box className={styles.row}>
                <CustomTypography className={styles.label}>telefon: </CustomTypography>
                {exhibitorsDetails.daneKontaktowe.phone!=='' 
                && <CustomTypography className={styles.value}>{exhibitorsDetails.daneKontaktowe.phone}</CustomTypography>}
            </Box>
            <Box className={styles.row}>
                <CustomTypography className={styles.label}>e-mail: </CustomTypography>
                {exhibitorsDetails.daneKontaktowe.email!==''
                && <CustomTypography className={styles.value}>{exhibitorsDetails.daneKontaktowe.email}</CustomTypography>}
            </Box>
        </Box>
    </Box> 
    <Box className={styles.singleLine}>
        {exhibitorsDetails.website !==''
        ?<GreenCiorcleIcon className={styles.icon}/>
        :<GrayCircleIcon className={styles.iconGray}/>} 
      <CustomTypography className={styles.label}>strona www: </CustomTypography>
      {exhibitorsDetails.website !==''  
      && <CustomTypography className={styles.value}>{exhibitorsDetails.website}</CustomTypography>}
    </Box>


    <Box className={styles.singleLineLabel} >
      {hasAnySocial
        ?<GreenCiorcleIcon className={styles.icon}/>
        :<GrayCircleIcon className={styles.iconGray}/>} 
      <CustomTypography className={styles.label}>Social Media </CustomTypography>
    </Box>
    {hasAnySocial && (
    <Box className={styles.singleLine_}>
        <Box className={styles.rowWrapperIcon}>
            {exhibitorsDetails.media.facebook?.trim() !== '' && (
              <Box className={styles.mediaRow}>
                <FaceBookIcon className={styles.mediaIcon} style={{ width: '24px', height: '24px' }} />
                <CustomTypography className={styles.value}>{exhibitorsDetails.media.facebook}</CustomTypography>
              </Box>
            )}
            {exhibitorsDetails.media.instagram?.trim() !== '' && (
              <Box className={styles.mediaRow}>
                <InstagramIcon style={{ width: '24px', height: '24px' }} className={styles.mediaIcon} />
                <CustomTypography className={styles.value}>{exhibitorsDetails.media.instagram}</CustomTypography>
              </Box>
            )}
            {exhibitorsDetails.media.linkedIn?.trim() !== '' && (
              <Box className={styles.mediaRow}>
                <LinkekInIcon style={{ width: '22px', height: '22px' }} className={styles.mediaIcon} />
                <CustomTypography className={styles.value}>{exhibitorsDetails.media.linkedIn}</CustomTypography>
              </Box>
            )}
            {exhibitorsDetails.media.youTube?.trim() !== '' && (
              <Box className={styles.mediaRow}>
                <YouTobeIcon style={{ width: '23px', height: 'auto' }} className={styles.mediaIcon} />
                <CustomTypography className={styles.value}>{exhibitorsDetails.media.youTube}</CustomTypography>
              </Box>
            )}
            {exhibitorsDetails.media.tiktok?.trim() !== '' && (
              <Box className={styles.mediaRow}>
                {/* Brak dedykowanej ikonki w assets – można dodać później */}
                <CustomTypography className={styles.value}>{exhibitorsDetails.media.tiktok}</CustomTypography>
              </Box>
            )}
            {exhibitorsDetails.media.x?.trim() !== '' && (
              <Box className={styles.mediaRow}>
                <XIcon className={styles.mediaIcon} style={{ width: '20px', height: '20px' }} />
                <CustomTypography className={styles.value}>{exhibitorsDetails.media.x}</CustomTypography>
              </Box>
            )}
     </Box>
    </Box>
    )}

     <Box 
     sx={{paddingTop:'2em'}}
     className={styles.singleLineLabel}>
       <Box 
       className={styles.actionButton}
        onClick={() => onViewDirectoryEntry(exhibitorId)} 
       >
            <EyeIcon className={styles.actionIcon}/>         
            <CustomTypography className={styles.actionText}>Podejrzyj wygląd wpisu do katalogu</CustomTypography> 
        </Box>          
    </Box>
  </>
  );
}

export default EntryIntoTheTradeFairCatalogue;