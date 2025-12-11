import React, { ReactNode } from "react";
import { Typography, Box } from "@mui/material";
import styles from "./News.module.scss";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pl";
import { RenderSection } from "./RenderSection";

dayjs.extend(relativeTime);
dayjs.locale("pl");

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  category: string;
  date: Date;
  icon: ReactNode;
}

interface NewsProps {
  news: NewsItem[];
}

const News: React.FC<NewsProps> = ({ news }) => {
  const today = dayjs();
  const newNotifications = news.filter((n) =>
    dayjs(n.date).isSame(today, "day")
  );
  const earlierNotifications = news.filter(
    (n) => !dayjs(n.date).isSame(today, "day")
  );

  return (
    <Box className={styles.container}>
      <Typography variant="h5" className={styles.header} pb={2} pl="20px">
        Aktualności
      </Typography>
      {newNotifications.length > 0 && (
        <RenderSection title="Nowe" list={newNotifications} />
      )}
      {earlierNotifications.length > 0 && (
        <RenderSection title="Ostatnie" list={earlierNotifications} />
      )}
    </Box>
  );
};

export default News;
