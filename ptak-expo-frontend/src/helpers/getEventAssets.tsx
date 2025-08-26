
import OldGreenCard from '../assets/oldGreenCard.png';
import MintWithPeopleCard from '../assets/mintWithPeopleCard.png';
import PurpleWithMachinesCard from '../assets/purpleWithMachinesCard.png';
import BrownWithBackgroundCard from '../assets/brownWithBackgroundCard.png';
import GreenWithBackgroundCard from '../assets/greenWithBackgroundCard.png';
import BlueGeometryCard from '../assets/blueGeometryCarrd.png';

import WarsawFloorExpoLogoCard from '../assets/warsaw_floor_expo_Logo_Card.png';
import GlassTechPolandLogoCard from '../assets/glass_tech_poland_Logo_Card.png';
import DootTecLogoCard from '../assets/doot-tec_Logo_Card.png';
import FiltraTECLogoCard from '../assets/filtraTec_Logo_Card.png';


import DefaultBackground from '../assets/blueGeometryCarrd.png';
import DefaultLogo from '../assets/doot-tec_Logo_Card.png';

// Mapowanie nazw wystaw na tło + logo
const eventAssets: Record<string, { background: string; logo: string }> = {
  "Warsaw Industry Week": {
    background: OldGreenCard,
    logo: DootTecLogoCard,
  },
  "Warsaw Floor Expo": {
    background: MintWithPeopleCard,
    logo: WarsawFloorExpoLogoCard,
  },
  "Glass Tech Poland": {
    background: PurpleWithMachinesCard,
    logo: GlassTechPolandLogoCard,
  },
  "Metal Show": {
    background: BrownWithBackgroundCard,
    logo: DootTecLogoCard,
  },
  "Energy Expo": {
    background: GreenWithBackgroundCard,
    logo: FiltraTECLogoCard,
  },
  "Robotics Fair": {
    background: BlueGeometryCard,
    logo: DootTecLogoCard,
  },
  "Construction Week": {
    background: OldGreenCard,
    logo: WarsawFloorExpoLogoCard,
  },
  "Tech Future Expo": {
    background: PurpleWithMachinesCard,
    logo: GlassTechPolandLogoCard,
  },
  "Eco Days": {
    background: GreenWithBackgroundCard,
    logo: DootTecLogoCard,
  },
  "Gaming Arena": {
    background: BlueGeometryCard,
    logo: DootTecLogoCard,
  },
};

// We make our lives easier - we collect all the "sets" into an array
const allAssetSets = Object.values(eventAssets);

// Function: match or randomize a set
export function getEventAssets(eventName: string) {
  const asset = eventAssets[eventName];

  if (asset) {
    return asset; // normal match if exists
  }

  // draw a random set from the available ones
  const randomIndex = Math.floor(Math.random() * allAssetSets.length);
  return allAssetSets[randomIndex] || {
    background: DefaultBackground,
    logo: DefaultLogo,
  };
}