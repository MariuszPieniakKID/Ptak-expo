import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import styles from './News.module.scss';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pl';
import { useTranslation } from 'react-i18next';

dayjs.extend(relativeTime);
dayjs.locale('pl');

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  category: string;
  date: Date;
}

interface NewsProps {
  news: NewsItem[];
}

const News: React.FC<NewsProps> = ({ news }) => {
  const { t } = useTranslation('common');
  const today = dayjs();

  const newNotifications = news.filter((n) => dayjs(n.date).isSame(today, 'day'));
  const earlierNotifications = news.filter((n) => !dayjs(n.date).isSame(today, 'day'));

  const timeAgo = (date: Date) => dayjs(date).fromNow();

  const renderSection = (title: string, list: typeof news) => (
    <Box className={styles.section}>
      <Typography variant="subtitle1" className={styles.sectionTitle}>
        {title}
      </Typography>
      <Box className={styles.list}>
        {list.map((n) => (
          <Card key={n.id} className={styles.card}>
            <CardContent>
              <Typography variant="subtitle1" className={styles.cardTitle}>
                {n.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {n.description}
              </Typography>
              <Typography variant="caption" className={styles.time} fontWeight={600}>
                {timeAgo(n.date)}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box className={styles.container}>
      <Typography variant="h5" className={styles.header} pb={2}>
        {t('news')}
      </Typography>

      {newNotifications.length > 0 && renderSection(t('new'), newNotifications)}
      {earlierNotifications.length > 0 && renderSection(t('latest'), earlierNotifications)}
    </Box>
  );
};

export default News;
