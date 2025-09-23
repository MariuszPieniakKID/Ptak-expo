import {Box} from "@mui/material";
import EventLayout from "../components/eventLayout/EventLayout";
import LeftColumn from "../components/event-left/LeftColumn";
import {useParams} from "react-router-dom";
import styles from "./EventHomePage.module.scss";
import News, {type NewsItem} from "../components/news/News";
import IconBell from "../assets/group-23.png";
import IconEmails from "../assets/emails.png";
import IconMarketing from "../assets/group-21.png";

const mockNews: NewsItem[] = [
  {
    id: 1,
    title: "Zmiana statusu zaproszenia",
    description: "Potwierdzono zaproszenie jako VIP",
    category: "Portal dokumentów",
    date: new Date(),
    icon: (
      <div className={styles.customIconMenuImage}>
        <img
          src={IconMarketing}
          alt="ikona marketing"
          width={35}
          height="auto"
        />
      </div>
    ),
  },
  {
    id: 2,
    title: "Portal dokumentów",
    description: "Nowe dokumenty do akceptacji",
    category: "Dokumenty",
    date: new Date(),
    icon: (
      <div className={styles.customIconMenuImage}>
        <img
          src={IconEmails}
          alt="ikona zaproszenia"
          width={35}
          height="auto"
        />
      </div>
    ),
  },
  {
    id: 3,
    title: "Zmiany organizacyjne",
    description: "Zmiana godzin biura targowego",
    category: "Organizacja",
    date: new Date("2025-08-20"),
    icon: (
      <img
        src={IconBell}
        alt="ikona informacje targowe"
        width={35}
        height="auto"
      />
    ),
  },
];

const EventNewsPage = () => {
  const {eventId} = useParams();

  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || "0"} />}
      right={
        <Box className={styles.rightContainer}>
          <Box className="children">
            <News news={mockNews} />
          </Box>
        </Box>
      }
      colorLeft="#eceef0"
    />
  );
};

export default EventNewsPage;
