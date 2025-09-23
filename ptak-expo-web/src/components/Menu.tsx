import {FunctionComponent, useMemo, useState} from "react";
import {useNavigate, useLocation, useParams} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
} from "@mui/material";
import styles from "./Header.module.scss";
import Logo from "../assets/group-257@3x.png";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ListAltIcon from "@mui/icons-material/ListAlt";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
// import InfoIcon from "@mui/icons-material/Info";
import IconMarketing from "../assets/group-842.png";
import IconEmails from "../assets/emails-border.png";
import IconDocuments from "../assets/documents.png";
import IconBell from "../assets/bell.png";
import IconNews from "../assets/news.png";

export type MenuType = {
  className?: string;
  onMenuClick?: (page: string) => void;
  onLogout?: () => void;
};

type NavItem = {
  label: string;
  icon?: React.ReactNode;
  getUrl: (eventId: string) => string;
  key: string;
  customIcon?: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    label: "Home",
    icon: <HomeIcon />,
    key: "home",
    getUrl: (id) => `/event/${id}/home`,
  },
  {
    label: "Aktualności",
    customIcon: (
      <div className={styles.customIconMenuImage}>
        <img src={IconNews} alt="ikona aktualności" width="auto" height={22} />
      </div>
    ),
    key: "news",
    getUrl: (id) => `/event/${id}/news`,
  },
  {
    label: "E-Identyfikator",
    icon: <FingerprintIcon />,
    key: "identifier",
    getUrl: (id) => `/event/${id}/identifier`,
  },
  {
    label: "Checklista targowa",
    icon: <ListAltIcon />,
    key: "checklist",
    getUrl: (id) => `/event/${id}/checklist`,
  },
  {
    label: "Portal dokumentów",
    customIcon: (
      <div className={styles.customIconMenuImage}>
        <img
          src={IconDocuments}
          alt="ikona dokumentów"
          width={22}
          height={26}
        />
      </div>
    ),
    key: "documents",
    getUrl: (id) => `/event/${id}/documents`,
  },
  {
    label: "Materiały marketingowe",
    customIcon: (
      <div className={styles.customIconMenuImage}>
        <img src={IconMarketing} alt="ikona marketing" width={26} height={19} />
      </div>
    ),
    key: "marketing",
    getUrl: (id) => `/event/${id}/marketing`,
  },
  {
    label: "Zaproszenia",
    customIcon: (
      <div className={styles.customIconMenuImage}>
        <img src={IconEmails} alt="ikona zaproszenia" width={26} height={19} />
      </div>
    ),
    key: "invitations",
    getUrl: (id) => `/event/${id}/invitations`,
  },
  {
    label: "Informacje targowe",
    customIcon: (
      <div className={styles.customIconMenuImage}>
        <img
          src={IconBell}
          alt="ikona informacje targowe"
          width="auto"
          height={22}
        />
      </div>
    ),
    key: "info",
    getUrl: (id) => `/event/${id}/trade-info`,
  },
];

const Menu: FunctionComponent<MenuType> = ({className = "", onLogout}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{eventId: string}>();
  const isDrawer = useMediaQuery("(max-width:1280px)");
  const [mobileOpen, setMobileOpen] = useState(false);

  const eventId = params.eventId || "1";
  const menuItems = navItems;
  const isDisabled = (_key: string) => false;
  const activeIndex = useMemo(() => {
    const base = `/event/${eventId}`;
    const home = `${base}/home`;
    return menuItems.findIndex((item) => {
      const target = item.getUrl(eventId);
      if (item.key === "home") {
        return location.pathname === base || location.pathname.startsWith(home);
      }
      return location.pathname.startsWith(target);
    });
  }, [location.pathname, eventId, menuItems]);

  const handleDrawerToggle = () => setMobileOpen((v) => !v);

  return (
    <AppBar position="static" className={`${styles.appbar} ${className}`}>
      <Toolbar className={styles.toolbar}>
        {!isDrawer && (
          <Box className={styles.navItems}>
            <Box className={styles.logo}>
              <img
                src={Logo}
                alt="Logo"
                onClick={() => navigate("/dashboard")}
              />
            </Box>
            {menuItems.map((item, index) => {
              const disabled = isDisabled(item.key);
              return (
                <Box
                  key={item.key}
                  className={`${styles.navItem} ${
                    index === activeIndex ? styles.active : ""
                  }`}
                  onClick={
                    !disabled ? () => navigate(item.getUrl(eventId)) : undefined
                  }
                  aria-disabled={disabled || undefined}
                  sx={{
                    cursor: disabled ? "default" : "pointer",
                    opacity: disabled ? 0.6 : undefined,
                  }}
                >
                  {item.icon && item.icon}
                  {item.customIcon && item.customIcon}
                  <Typography
                    variant="caption"
                    textAlign={"center"}
                    fontSize={{lg: "10px", xl: "13px"}}
                  >
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}

        {isDrawer && (
          <>
            <Box className={styles.menuIconContainer}>
              <Box className={styles.logo}>
                <img
                  src={Logo}
                  alt="Logo"
                  onClick={() => navigate("/dashboard")}
                />
              </Box>
              <IconButton onClick={handleDrawerToggle}>
                <MenuIcon />
              </IconButton>
            </Box>
            <Drawer
              anchor="left"
              open={mobileOpen}
              onClose={handleDrawerToggle}
            >
              <List>
                {menuItems.map((item, index) => {
                  const disabled = isDisabled(item.key);
                  return (
                    <ListItem key={item.key} disablePadding>
                      <ListItemButton
                        selected={activeIndex === index}
                        onClick={
                          !disabled
                            ? () => navigate(item.getUrl(eventId))
                            : undefined
                        }
                        disabled={disabled}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Drawer>
          </>
        )}

        <Box>
          {onLogout && (
            <button className={styles.logoutButton} onClick={onLogout}>
              <span className={styles.logoutText}>Wyloguj</span>
            </button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Menu;
