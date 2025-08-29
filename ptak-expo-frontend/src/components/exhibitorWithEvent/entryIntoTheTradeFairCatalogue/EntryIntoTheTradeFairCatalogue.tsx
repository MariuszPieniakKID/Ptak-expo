import { Box } from '@mui/material';
import CustomTypography from '../../customTypography/CustomTypography';
import { ReactComponent as GreenCiorcleIcon} from '../../../assets/greenCircleWithACheck.svg';
import { ReactComponent as GrayCircleIcon} from '../../../assets/grayDashedCircle.svg';
// import {ReactComponent as Fa} from "../../../assets/eyeIcon.svg";
 import {ReactComponent as FaceBookIcon} from "../../../assets/fIcon.svg";
 import {ReactComponent as InstagramIcon} from "../../../assets/instagramIcon.svg";
import {ReactComponent as LinkekInIcon} from "../../../assets/inIcon.svg";
import {ReactComponent as YouTobeIcon} from "../../../assets/youTubeIcon.svg";

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
      {(
      exhibitorsDetails.media.facebook!=='' 
      || exhibitorsDetails.media.instagram!=='' 
      || exhibitorsDetails.media.linkedIn!=='' 
      || exhibitorsDetails.media.youTube!=='' 
       )
        ?<GreenCiorcleIcon className={styles.icon}/>
        :<GrayCircleIcon className={styles.iconGray}/>} 
      <CustomTypography className={styles.label}>Social Media </CustomTypography>
    </Box>
    <Box className={styles.singleLine_}>
        <Box className={styles.rowWrapperIcon}>
            <Box className={styles.mediaRow}>
                <FaceBookIcon 
                className={styles.mediaIcon}
                style={{ width: '24px', height: '24px' }}
                />
                {exhibitorsDetails.media.facebook!=='' 
                ?<CustomTypography className={styles.value}>{exhibitorsDetails.media.facebook}</CustomTypography>
                :<CustomTypography className={styles.label}>Facebook</CustomTypography> }                
            </Box>
            <Box className={styles.mediaRow}>
                <InstagramIcon 
                style={{ width: '24px', height: '24px' }}
                className={styles.mediaIcon}
                />
                {exhibitorsDetails.media.instagram!==''
                ?<CustomTypography className={styles.value}>{exhibitorsDetails.media.instagram}</CustomTypography>
                :<CustomTypography className={styles.label}>Instagram</CustomTypography> }
            </Box>
            <Box className={styles.mediaRow}>
                <LinkekInIcon 
                style={{ width: '22px', height: '22px' }}
                className={styles.mediaIcon}
                />
                {exhibitorsDetails.media.linkedIn!=='' 
                ?<CustomTypography className={styles.value}>{exhibitorsDetails.media.linkedIn}</CustomTypography>
                :<CustomTypography className={styles.label}>LinkedIn</CustomTypography> }
            </Box>
            <Box className={styles.mediaRow}>
                <YouTobeIcon 
                style={{ width: '23px', height: 'auto' }}
                className={styles.mediaIcon}
                />
                 {exhibitorsDetails.media.youTube!==''
                ?<CustomTypography className={styles.value}>{exhibitorsDetails.media.youTube}</CustomTypography>
                :<CustomTypography className={styles.label}>YouTube</CustomTypography> }
            </Box>
     </Box>
    </Box>

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