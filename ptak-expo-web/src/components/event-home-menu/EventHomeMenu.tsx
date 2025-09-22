import {Box, Card, CardContent, Grid} from "@mui/material";
import styles from "./EventHomeMenu.module.scss";
import {useNavigate} from "react-router-dom";
import IconBell from "../../assets/group-23.png";
import IconMarketing from "../../assets/group-21.png";
import IconEmails from "../../assets/emails.png";
import IconDocuments from "../../assets/group-20.png";

interface Props {
  id: string;
}

const EventHomeMenu: React.FC<Props> = ({id}) => {
  const navigate = useNavigate();
  const menu = [
    {
      id: "checklist",
      title: "Checklista targowa",
      icon: IconBell,
      href: `/event/${id}/checklist`,
    },
    {
      id: "docs",
      title: "Portal dokumentów",
      icon: IconDocuments,
      href: `/event/${id}/documents`,
    },
    {
      id: "marketing",
      title: "Materiały marketingowe",
      icon: IconMarketing,
      href: `/event/${id}`,
    },
    {
      id: "invites",
      title: "Generator zaproszeń",
      icon: IconEmails,
      href: `/event/${id}`,
    },
  ];

  return (
    <Box sx={{mt: 4}} className={styles.container}>
      <p className={styles.title}>Ważne sprawy dotyczące wydarzenia:</p>
      <Grid container spacing={3}>
        {menu.map((item, index) => {
          const Icon = item.icon;
          const disabled = item.id === "info";

          return (
            <Grid size={{xs: 12, md: 6}} key={`${item.id}_${index}`}>
              <Card
                onClick={!disabled ? () => navigate(item.href) : undefined}
                aria-disabled={disabled || undefined}
                className={styles.card}
                sx={{
                  cursor: disabled ? "default" : "pointer",
                  opacity: disabled ? 0.6 : undefined,
                }}
              >
                <CardContent className={styles.cardContent}>
                  <img src={Icon} alt="ikona" width="auto" height={55} />
                  <p>{item.title}</p>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default EventHomeMenu;
