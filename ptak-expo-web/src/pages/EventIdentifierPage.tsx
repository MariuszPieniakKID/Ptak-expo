import { Box } from "@mui/material";
import EventLayout from "../components/eventLayout/EventLayout";
import LeftColumn from "../components/event-left/LeftColumn";
import IdentifierCard, {
  type Identifier,
} from "../components/identifierCard/IdentifierCard";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  exhibitionsAPI,
  tradeInfoAPI,
  brandingAPI,
  invitationsAPI,
} from "../services/api";
import { getChecklist } from "../services/checkListApi";
import config from "../config/config";
import styles from "./EventHomePage.module.scss";

const formatDate = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const EventIdentifierPage = () => {
  const { eventId } = useParams();
  const [identifier, setIdentifier] = useState<Identifier | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      try {
        const idNum = Number(eventId);
        const [
          evRes,
          tradeRes,
          brandingRes,
          recipients,
          templates,
          exhibitorAssignment,
        ] = await Promise.all([
          exhibitionsAPI.getById(idNum),
          tradeInfoAPI.get(idNum).catch(() => null),
          brandingAPI.getGlobal(idNum).catch(() => null),
          invitationsAPI.recipients(idNum).catch(() => []),
          invitationsAPI.list(idNum).catch(() => []),
          // Fetch exhibitor's hall assignment
          fetch(
            `${config.API_BASE_URL}/api/v1/exhibitors/me/exhibition/${idNum}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          )
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null),
        ]);

        const e = evRes.data;
        const trade =
          tradeRes && tradeRes.data && tradeRes.data.success
            ? tradeRes.data.data
            : null;

        const exhibitorStart = trade?.tradeHours?.exhibitorStart;
        const exhibitorEnd = trade?.tradeHours?.exhibitorEnd;
        const visitorStart = trade?.tradeHours?.visitorStart;
        const visitorEnd = trade?.tradeHours?.visitorEnd;
        const timeRange =
          exhibitorStart && exhibitorEnd
            ? `${exhibitorStart}–${exhibitorEnd}`
            : visitorStart && visitorEnd
            ? `${visitorStart}–${visitorEnd}`
            : "";

        // Use exhibitor's actual hall assignment instead of global trade_spaces
        const hallName =
          exhibitorAssignment &&
          exhibitorAssignment.success &&
          exhibitorAssignment.data?.hallName
            ? exhibitorAssignment.data.hallName
            : e.location || "";

        // Resolve header image from global branding files
        let headerImageUrl = "/assets/background.png";
        const files =
          brandingRes && brandingRes.data && brandingRes.data.success
            ? brandingRes.data.files
            : null;
        const headerFile =
          files &&
          (files["kolorowe_tlo_logo_wydarzenia"] ||
            files["tlo_wydarzenia_logo_zaproszenia"]);
        if (headerFile?.fileName) {
          headerImageUrl = brandingAPI.serveGlobalUrl(headerFile.fileName);
        }

        // Resolve exhibitor catalog logo from checklist
        let catalogLogoUrl: string | null = null;
        try {
          const cl = await getChecklist(idNum);
          const l = cl?.companyInfo?.logo || null;
          if (l && typeof l === "string" && l.trim().length > 0) {
            // Convert relative path to absolute URL
            if (l.startsWith("http://") || l.startsWith("https://")) {
              catalogLogoUrl = l;
            } else if (l.startsWith("data:")) {
              catalogLogoUrl = l; // base64
            } else {
              // Relative path - convert to absolute using API_BASE_URL
              const path = l.startsWith("/") ? l : `/${l}`;
              catalogLogoUrl = `${config.API_BASE_URL}${path}`;
            }
          }
        } catch {}

        // Pick first template with vip_value
        const vipTemplate = Array.isArray(templates)
          ? templates.find(
              (t: any) =>
                t &&
                typeof t.vip_value === "string" &&
                t.vip_value.trim().length > 0
            )
          : null;

        const data: Identifier = {
          id: String(e.id),
          eventName: e.name || "",
          dateFrom: formatDate(e.start_date || e.startDate),
          dateTo: formatDate(e.end_date || e.endDate),
          time: timeRange,
          type: "Wystawca",
          location: hallName,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
            String(e.id)
          )}`,
          headerImageUrl,
          logoUrl: catalogLogoUrl || "/assets/logo192.png",
          invitesSentCount: Array.isArray(recipients) ? recipients.length : 0,
          invitesLimit: 50,
          ...(vipTemplate ? { vipValue: String(vipTemplate.vip_value) } : {}),
        };
        setIdentifier(data);
      } catch (_err) {
        setIdentifier(null);
      }
    };
    load();
  }, [eventId]);

  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || "0"} isDarkBg={true} />}
      right={
        <Box className={styles.rightContainer}>
          {identifier && <IdentifierCard data={identifier} />}
        </Box>
      }
      colorRight="#5a6ec8"
      colorLeft="#2E2E38"
    />
  );
};

export default EventIdentifierPage;
