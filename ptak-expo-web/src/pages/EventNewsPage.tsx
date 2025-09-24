import {Box} from "@mui/material";
import EventLayout from "../components/eventLayout/EventLayout";
import LeftColumn from "../components/event-left/LeftColumn";
import {useParams} from "react-router-dom";
import styles from "./EventHomePage.module.scss";
import News, {type NewsItem} from "../components/news/News";
import IconBell from "../assets/group-23.png";
import IconEmails from "../assets/emails.png";
import IconMarketing from "../assets/group-21.png";
import { useEffect, useState } from "react";
import { newsAPI } from "../services/api";

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
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const idNum = Number(eventId);
        if (!idNum) { setItems(mockNews); return; }
        const list = await newsAPI.listByExhibition(idNum);
        const mapped: NewsItem[] = list.map((row, idx) => ({
          id: idx + 1,
          title: row.title,
          description: row.description,
          category: row.kind,
          date: new Date(row.timestamp),
          icon: (
            <div className={styles.customIconMenuImage}>
              <img
                src={row.kind.includes('event') ? IconBell : (row.kind.includes('branding') ? IconMarketing : IconEmails)}
                alt="ikona"
                width={35}
                height="auto"
              />
            </div>
          ),
        }));
        setItems(mapped.length ? mapped : mockNews);
      } catch {
        setItems(mockNews);
      }
    };
    load();
  }, [eventId]);

  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || "0"} />}
      right={
        <Box className={styles.rightContainer}>
          <Box className="children">
            <News news={items} />
          </Box>
        </Box>
      }
      colorLeft="#eceef0"
    />
  );
};

export default EventNewsPage;
