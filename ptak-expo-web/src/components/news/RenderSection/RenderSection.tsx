import {Typography, Box} from "@mui/material";
import styles from "../News.module.scss";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import {NewsItem} from "../News";

export const RenderSection = ({
  list,
  title,
}: {
  title: string;
  list: NewsItem[];
}) => {
  const timeAgo = (date: Date) => dayjs(date).fromNow();

  return (
    <Box className={styles.section}>
      <p className={styles.sectionTitle}>{title}</p>
      <Box className={styles.list}>
        {list.map((n) => (
          <div key={n.id} className={styles.card}>
            <div className={styles.cardContent}>
              {n?.icon && n.icon}
              <div>
                <p className={styles.cardTitle}>{n.title}</p>
                <p className={styles.cardDescription}>{n.description}</p>
                <Typography
                  variant="caption"
                  className={styles.time}
                  fontWeight={600}
                >
                  {timeAgo(n.date)}
                </Typography>
              </div>
            </div>
          </div>
        ))}
      </Box>
    </Box>
  );
};
