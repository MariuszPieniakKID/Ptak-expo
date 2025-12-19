import { Box, TextField, Button, Typography, IconButton } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import EventLayout from "../components/eventLayout/EventLayout";
import LeftColumn from "../components/event-left/LeftColumn";
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  exhibitionsAPI,
  brandingAPI,
  invitationsAPI,
  marketingAPI,
  BenefitItem,
  type InvitationTemplate,
} from "../services/api";
import api from "../services/api";
import IconEmail from "../assets/email.png";
import IconHeaderEmail from "../assets/emails.png";
import { getChecklist } from "../services/checkListApi";
import styles from "./EventHomePage.module.scss";
import BulkSendModal from "../components/invitations/BulkSendModal";
import config from "../config/config";
import CustomTypography from "../components/customTypography/CustomTypography";
import InvitationProgress from "../components/chart/InvitationProgress";

// no date fields in invitations card

const EventInvitationsPage = () => {
  const { eventId } = useParams();
  const [data, setData] = useState<any | null>(null);
  const [guestName, setGuestName] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [templates, setTemplates] = useState<InvitationTemplate[]>([]);
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");
  const [sent, setSent] = useState<
    Array<{
      id: number;
      recipientName: string;
      recipientEmail: string;
      invitationType: string;
      status: string;
      sentAt?: string;
    }>
  >([]);
  const [isSending, setIsSending] = useState(false);
  const [bulkOpen, setBulkOpen] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [editorHtml, setEditorHtml] = useState<string>("");
  const isFormValid = Boolean(
    guestName.trim() && guestEmail.trim() && selectedTemplateId
  );

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      try {
        const idNum = Number(eventId);
        const [evRes, brandingRes, benefitsRes] = await Promise.all([
          exhibitionsAPI.getById(idNum),
          brandingAPI.getGlobal(idNum).catch(() => null),
          marketingAPI.listByExhibition(idNum).catch(() => []),
        ]);

        const e = evRes.data;
        // trade info not used in invitations card for now

        // Resolve header image for invitations (right side) and catalog logo (left side)
        let headerImageUrl = "/assets/background.png";
        const files =
          brandingRes && brandingRes.data && brandingRes.data.success
            ? brandingRes.data.files
            : null;
        const headerFile = files && files["tlo_wydarzenia_logo_zaproszenia"];
        if (headerFile?.fileName)
          headerImageUrl = brandingAPI.serveGlobalUrl(headerFile.fileName);
        let catalogLogoUrl: string | null = null;
        try {
          const cl = await getChecklist(idNum);
          const l = cl?.companyInfo?.logo || null;
          if (l && typeof l === "string" && l.trim().length > 0) {
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

        setData({
          id: String(e.id),
          eventName: e.name || "",
          headerImageUrl,
          catalogLogoUrl,
        });
        setBenefits(Array.isArray(benefitsRes) ? benefitsRes : []);

        // Load invitation templates for this event
        try {
          const list = await invitationsAPI.list(idNum);
          setTemplates(list);
          if (list.length > 0) setSelectedTemplateId(list[0].id);
        } catch {}

        // Load already sent recipients
        try {
          const recipients = await invitationsAPI.recipients(idNum);
          setSent(recipients);
        } catch {}

        // Load invitation limit for this exhibitor
        try {
          const meRes = await api.get("/api/v1/exhibitors/me");
          console.log("[EventInvitationsPage] Full /me response:", meRes.data);
          const exhibitorId = meRes.data?.data?.id; // Fix: backend returns { success, data: { id } }
          console.log(
            "[EventInvitationsPage] Exhibitor ID:",
            exhibitorId,
            "Exhibition ID:",
            idNum
          );
          if (exhibitorId) {
            const limit = await invitationsAPI.getLimit(exhibitorId, idNum);
            console.log(
              "[EventInvitationsPage] Loaded invitation limit:",
              limit
            );
            setInvitesLimit(limit);
          } else {
            console.warn(
              "[EventInvitationsPage] No exhibitor ID found, using default limit 50"
            );
            setInvitesLimit(50);
          }
        } catch (error) {
          console.error(
            "[EventInvitationsPage] Failed to load invitation limit:",
            error
          );
          setInvitesLimit(50); // Default fallback
        }
      } catch {
        setData(null);
      }
    };
    load();
  }, [eventId]);

  const handleSend = async () => {
    if (!eventId || !selectedTemplateId) return;
    setIsSending(true);
    try {
      const idNum = Number(eventId);
      const res = await invitationsAPI.send(
        idNum,
        Number(selectedTemplateId),
        guestName.trim(),
        guestEmail.trim(),
        previewHtml || undefined
      );
      if (res?.success) {
        // Refresh list
        const recipients = await invitationsAPI.recipients(idNum);
        setSent(recipients);
        // Clear inputs
        setGuestName("");
        setGuestEmail("");
      }
    } catch (e) {
      // noop, error shown in console by axios interceptor if needed
    } finally {
      setIsSending(false);
    }
  };

  const handlePreview = async () => {
    if (!eventId || !selectedTemplateId || !isFormValid) return;
    try {
      // Try inline fields from list (avoids extra request)
      let tpl = templates.find((t) => t.id === selectedTemplateId) as any;
      if (!tpl) {
        // Fallback: fetch full template by id
        tpl = await invitationsAPI.getById(Number(selectedTemplateId));
      }
      if (!tpl) {
        setPreviewHtml("");
        return;
      }
      const greeting = (tpl.greeting || "").trim();
      const namePart = (guestName || "").trim();
      const greetingLine = greeting
        ? `${greeting}${namePart ? " " + namePart : ""},`
        : namePart
        ? `${namePart},`
        : "";
      const contentHtml = (tpl.content || "").trim();
      const companyInfo = (tpl.company_info || "").trim();
      // Build special offers block from IDs in tpl.special_offers (comma-separated IDs)
      const offersBlock = (() => {
        const raw = tpl.special_offers;
        const ids: number[] = Array.isArray(raw)
          ? raw
          : typeof raw === "string"
          ? raw
              .split(",")
              .map((s: string) => Number(s.trim()))
              .filter((n) => !Number.isNaN(n))
          : [];
        const items = ids
          .map((id: number) => benefits.find((b) => b.id === id))
          .filter(Boolean) as BenefitItem[];
        if (items.length === 0) return "";
        const list = items
          .map((b) => {
            let imageHtml = "";
            if (b.file_url) {
              const imageUrl = b.file_url.startsWith("http")
                ? b.file_url
                : `${config.API_BASE_URL}${b.file_url}`;
              imageHtml = `<div style='text-align:center;margin:12px 0;'><img src='${imageUrl}' alt='${b.title}' style='max-width:100%;max-height:200px;height:auto;display:inline-block;border-radius:4px;' /></div>`;
            }
            return `<li style='margin-bottom:20px;padding:12px;background:#f9f9f9;border-radius:8px;'>${imageHtml}<div style='margin-top:8px;'><strong>${
              b.title
            }</strong>${
              b.description ? "<br/>" + b.description : ""
            }</div></li>`;
          })
          .join("");
        return `<h4>Oferta specjalna:</h4><ul style='list-style-type:none;padding:0;'>${list}</ul>`;
      })();

      const headerImgHtml = data?.headerImageUrl
        ? `<div style='text-align:center;margin-bottom:16px;background:#f5f5f5;padding:20px;'><img alt='header' src='${data.headerImageUrl}' style='max-width:100%;height:auto;display:inline-block;'/></div>`
        : "";

      const html = `<!doctype html><html><head><meta charset='utf-8'/></head><body style='font-family:Arial,sans-serif;color:#333;line-height:1.5;'>${headerImgHtml}
        ${greetingLine ? `<p>${greetingLine}</p>` : ""}
        ${
          contentHtml ? `<div>${contentHtml.replace(/\n/g, "<br/>")}</div>` : ""
        }
        ${
          tpl.booth_info
            ? `<p style='margin-top:12px;'><strong>Stoisko:</strong> ${tpl.booth_info}</p>`
            : ""
        }
        ${offersBlock}
        ${
          companyInfo
            ? `<p style='margin-top:16px;'>${companyInfo.replace(
                /\n/g,
                "<br/>"
              )}</p>`
            : ""
        }
      </body></html>`;
      setEditorHtml(html);
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (e) {
      console.warn("Preview build failed", e);
      setPreviewHtml("");
    }
  };

  const [invitesLimit, setInvitesLimit] = useState<number>(50);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const invitedCount = sent.length;
  const vipTemplate = Array.isArray(templates)
    ? templates.find(
        (t) =>
          (t as any).vip_value && String((t as any).vip_value).trim().length > 0
      )
    : (undefined as any);
  const vipValue: string | undefined = vipTemplate
    ? String((vipTemplate as any).vip_value)
    : undefined;
  const openBulk = () => setBulkOpen(true);
  const closeBulk = () => setBulkOpen(false);

  // Initialize editor content once when preview opens
  useEffect(() => {
    if (
      showPreview &&
      editorRef.current &&
      editorRef.current.innerHTML === "" &&
      editorHtml
    ) {
      editorRef.current.innerHTML = editorHtml;
    }
  }, [showPreview, editorHtml]);

  // Toolbar actions for contentEditable editor
  const exec = (cmd: string, val?: string) => {
    if (editorRef.current) editorRef.current.focus();
    try {
      document.execCommand(cmd, false, val);
    } catch {}
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setEditorHtml(html);
      setPreviewHtml(html);
    }
  };
  const onInsertLink = () => {
    const url = window.prompt("Wprowadź adres URL", "https://");
    if (url) exec("createLink", url);
  };
  const onInsertEmoji = (emoji: string) => exec("insertText", emoji);

  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || "0"} isDarkBg={true} />}
      right={
        <Box className={styles.rightContainer}>
          <Box className={styles.headerInner}>
            <img
              alt="główna ikona"
              src={IconHeaderEmail}
              height={54}
              width={55}
            />
            <Typography variant="h5" className={styles.headerTitle} pb={2}>
              Generator zaproszeń
            </Typography>
          </Box>
          {data && (
            <>
              <Box
                sx={{
                  bgcolor: "#2f2f35",
                  borderRadius: "12px",
                  borderBottomLeftRadius: "0",
                  borderBottomRightRadius: "0",
                  overflow: "hidden",
                  border: "1px solid #464646",
                  borderBottom: "none",
                }}
              >
                <Box className={styles.eventInvitationTopContainer}>
                  <Box
                    sx={{
                      display: "block",
                      color: "#fff",
                      margin: "auto",
                    }}
                  >
                    <InvitationProgress
                      invites={invitedCount}
                      limit={invitesLimit}
                    />
                  </Box>
                  <Box
                    sx={{
                      color: "#fff",
                    }}
                  >
                    <CustomTypography
                      className={styles.invitationSpecialGuestHeader}
                    >
                      Zaproś gości specjalnych
                    </CustomTypography>
                    <CustomTypography
                      className={styles.invitationSpecialGuestContent}
                    >
                      Zaproś swoich najważniejszych klientów i partnerów, aby
                      odwiedzili Cię na targach w wyjątkowych warunkach. Każda
                      osoba zaproszona przez Ciebie przez aplikację otrzyma
                      imienny
                    </CustomTypography>
                  </Box>
                </Box>
              </Box>
              <Box className={styles.eventInvitationContainer}>
                <Box className={styles.eventInvitationLeftContainer}>
                  <Box className={styles.eventInvitationLeft}>
                    {/* Split header: left (catalog logo), right (branding invitation header) */}
                    <Box
                      sx={{
                        height: 160,
                        display: "flex",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#fff",
                        }}
                      >
                        {data.catalogLogoUrl ? (
                          <img
                            src={data.catalogLogoUrl}
                            alt="Logo"
                            style={{
                              maxWidth: "80%",
                              borderRadius: "12px",
                              maxHeight: "80%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <img
                            src="/assets/logo192.png"
                            alt="Logo"
                            style={{
                              maxWidth: "60%",
                              borderRadius: "12px",
                              maxHeight: "60%",
                              objectFit: "contain",
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ flex: 1, overflow: "hidden" }}>
                        <img
                          src={data.headerImageUrl}
                          alt={data.eventName}
                          style={{
                            width: "100%",
                            borderRadius: "100px",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                    </Box>
                    {/* Content */}
                    <Box sx={{ flex: "1 1 auto" }}>
                      <Typography
                        variant="h6"
                        sx={{
                          mt: "10px",
                          mb: "10px",
                          lineHeight: "100%",
                          color: "#2E2E38",
                          textAlign: "center",
                        }}
                      >
                        {data.eventName}
                      </Typography>
                      <TextField
                        label="Imię i Nazwisko gościa"
                        variant="standard"
                        className={styles.eventInvitationInput}
                        fullWidth
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                      />
                      <TextField
                        label="Adres e-mail"
                        variant="standard"
                        className={styles.eventInvitationInput}
                        fullWidth
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        type="email"
                      />
                      {/* Invitation type selector */}
                      <TextField
                        variant="standard"
                        select
                        className={styles.eventInvitationInput}
                        label="Typ zaproszenia"
                        fullWidth
                        SelectProps={{ native: true }}
                        value={selectedTemplateId}
                        sx={{ mb: "10px" }}
                        onChange={(e) =>
                          setSelectedTemplateId(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                      >
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </TextField>

                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handlePreview}
                        disabled={!isFormValid}
                      >
                        Sprawdź wiadomość
                      </Button>

                      {showPreview && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            border: "1px solid #eee",
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Podgląd wiadomości – edycja 1:1
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.5, mb: 1 }}>
                            <IconButton
                              aria-label="Pogrubienie"
                              size="small"
                              onClick={() => exec("bold")}
                              sx={{
                                p: 0.5,
                                border: "1px solid #e5e7eb",
                                borderRadius: 1,
                                color: "#2E2E38",
                              }}
                            >
                              <FormatBoldIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              aria-label="Kursywa"
                              size="small"
                              onClick={() => exec("italic")}
                              sx={{
                                p: 0.5,
                                border: "1px solid #e5e7eb",
                                borderRadius: 1,
                                color: "#2E2E38",
                              }}
                            >
                              <FormatItalicIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              aria-label="Wstaw link"
                              size="small"
                              onClick={onInsertLink}
                              sx={{
                                p: 0.5,
                                border: "1px solid #e5e7eb",
                                borderRadius: 1,
                                color: "#2E2E38",
                              }}
                            >
                              <InsertLinkIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              aria-label="Wstaw emotkę"
                              size="small"
                              onClick={() => onInsertEmoji("🙂")}
                              sx={{
                                p: 0.5,
                                border: "1px solid #e5e7eb",
                                borderRadius: 1,
                                color: "#2E2E38",
                              }}
                            >
                              <EmojiEmotionsIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                          <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={() => {
                              if (editorRef.current) {
                                const html = editorRef.current.innerHTML;
                                setEditorHtml(html);
                                setPreviewHtml(html);
                              }
                            }}
                            style={{
                              minHeight: 240,
                              border: "1px solid #ddd",
                              borderRadius: 8,
                              padding: 12,
                            }}
                          />
                        </Box>
                      )}

                      <Button
                        variant="contained"
                        fullWidth
                        sx={{ mt: 1 }}
                        onClick={handleSend}
                        disabled={
                          isSending ||
                          !guestName.trim() ||
                          !guestEmail.trim() ||
                          !selectedTemplateId
                        }
                      >
                        {isSending ? "Wysyłanie…" : "Wyślij zaproszenie"}
                      </Button>

                      <Button
                        variant="contained"
                        fullWidth
                        sx={{ mt: 1 }}
                        color="secondary"
                        onClick={openBulk}
                        disabled={!selectedTemplateId}
                      >
                        Wyślij masowo
                      </Button>

                      {/* Sent list */}
                    </Box>
                  </Box>
                </Box>
                <Box className={styles.eventInvitationRightContainer}>
                  <Box
                    sx={{
                      fontWeight: 700,
                      color: "#fff",
                      marginTop: "8px",
                      ml: "8px",
                      fontSize: "18px",
                      lineHeight: "100%",
                      mb: "8px",
                    }}
                  >
                    Business Priority Pass
                  </Box>
                  {vipValue && vipValue.trim().length > 0 && (
                    <Box
                      sx={{
                        color: "#6F87F6",
                        mb: "8px",
                        fontSize: "13px",
                        lineHeight: "100%",
                        ml: "8px",
                      }}
                    >
                      bilet o wartości {vipValue} PLN
                    </Box>
                  )}
                  <Box
                    sx={{
                      color: "#A7A7A7",
                      fontSize: "13px",
                      lineHeight: "100%",
                      ml: "8px",
                      mr: "8px",
                    }}
                  >
                    Każda osoba, którą zaprosisz przez generator w aplikacji,
                    otrzyma imienny Business Priority Pass o wartości {vipValue}{" "}
                    PLN, obejmujący:
                  </Box>
                </Box>
              </Box>
            </>
          )}
          {/* Dark summary box aligned to the right, full height of invitations module */}
          <Box
            sx={{
              flex: "1",
              bgcolor: "#2f2f35",
              border: "1px solid #464646",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              overflow: "hidden",
              color: "#fff",
              p: 2.5,
              marginTop: "25px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <Box sx={{ width: 24, height: 24, mr: 1 }}>
                <img
                  alt="ikona koperty"
                  src={IconEmail}
                  style={{ width: 24, height: 24 }}
                />
              </Box>
              <Box sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                <span>Wysłane</span>
                <br />
                <span>zaproszenia</span>
                <span style={{ marginLeft: 8, fontWeight: 400 }}>
                  ({invitedCount}{" "}
                  <span style={{ color: "#A7A7A7" }}>/ {invitesLimit}</span>)
                </span>
              </Box>
            </Box>
            {sent.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Wysłane zaproszenia
                </Typography>
                {sent.map((row) => (
                  <Box
                    key={row.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 0.75,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        mr: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(row.recipientName || row.recipientEmail) +
                        (row.recipientName
                          ? `, ${row.invitationType}`
                          : ` (${row.invitationType})`)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#2e7d32" }}>
                      {row.status}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          <BulkSendModal
            isOpen={bulkOpen}
            onClose={closeBulk}
            exhibitionId={Number(eventId)}
            templateId={Number(selectedTemplateId) as number}
            {...(selectedTemplate?.title
              ? { templateTitle: selectedTemplate.title }
              : {})}
            {...(selectedTemplate?.invitation_type
              ? { invitationType: selectedTemplate.invitation_type }
              : {})}
            previewHtml={previewHtml}
            onFinished={() => {
              // reload recipients list after bulk send
              if (eventId) {
                invitationsAPI
                  .recipients(Number(eventId))
                  .then(setSent)
                  .catch(() => {});
              }
              closeBulk();
            }}
          />
          <div id="black-background" />
        </Box>
      }
      colorRight="#2E2E38"
      colorLeft="#BB1821"
    />
  );
};

export default EventInvitationsPage;
