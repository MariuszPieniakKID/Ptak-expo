import {
  Box,
  TextField,
  Button,
  Typography,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import EventLayout from "../components/eventLayout/EventLayout";
import LeftColumn from "../components/event-left/LeftColumn";
import {useParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import {exhibitionsAPI, brandingAPI, invitationsAPI} from "../services/api";
import styles from "./EventHomePage.module.scss";
import IconMain from "../assets/emails.png";
import IconBell from "../assets/bell-white.png";
import IconBellCheck from "../assets/bell-check.png";
import {Ticket} from "../components/ticket";
import {Chart} from "../components/chart";

type T_MockUsersSend = {
  userName: string;
  status: "SEND" | "CONFIRMED" | "ACTIVATED";
  received?: boolean;
};

const mockUsersSend: T_MockUsersSend[] = [
  {
    userName: "Katarzyna Sułkowska",
    status: "SEND",
    received: true,
  },
  {
    userName: "Katarzyna Sułkowska",
    status: "SEND",
    received: false,
  },
  {
    userName: "Józef Gumowski",
    status: "CONFIRMED",
  },
  {
    userName: "Wiesław Chruszcz",
    status: "ACTIVATED",
  },
];

// no date fields in invitations card

const EventInvitationsPage = () => {
  const {eventId} = useParams();
  const [data, setData] = useState<any | null>(null);
  const [guestName, setGuestName] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [templates, setTemplates] = useState<
    {id: number; title: string; invitation_type: string}[]
  >([]);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      try {
        const idNum = Number(eventId);
        const [evRes, brandingRes] = await Promise.all([
          exhibitionsAPI.getById(idNum),
          brandingAPI.getGlobal(idNum).catch(() => null),
        ]);

        const e = evRes.data;
        // trade info not used in invitations card for now

        // Resolve header image specifically for invitations: tlo_wydarzenia_logo_zaproszenia
        let headerImageUrl = "/assets/background.png";
        const files =
          brandingRes && brandingRes.data && brandingRes.data.success
            ? brandingRes.data.files
            : null;
        const headerFile = files && files["tlo_wydarzenia_logo_zaproszenia"];
        if (headerFile?.fileName) {
          headerImageUrl = brandingAPI.serveGlobalUrl(headerFile.fileName);
        }

        setData({
          id: String(e.id),
          eventName: e.name || "",
          headerImageUrl,
        });

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
      } catch {
        setData(null);
      }
    };
    load();
  }, [eventId]);

  const handleClick = () => {
    fileInputRef.current?.click(); // kliknięcie ukrytego inputa
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Wybrano plik:", file.name);
    }
  };

  const handleSend = async () => {
    if (!eventId || !selectedTemplateId) return;
    setIsSending(true);
    try {
      const idNum = Number(eventId);
      const res = await invitationsAPI.send(
        idNum,
        Number(selectedTemplateId),
        guestName.trim(),
        guestEmail.trim()
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

  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || "0"} isDarkBg={true} />}
      right={
        <>
          <div className={styles.layout}>
            <main className={styles.main}>
              <div className={styles.mainHeader}>
                <div className={styles.headerInner}>
                  <img
                    alt="główna ikona"
                    src={IconMain}
                    height={54}
                    width="auto"
                  />
                  <div className={styles.headerTitle}>Generator zaproszeń</div>
                </div>
              </div>
              {data && (
                <Ticket
                  left={0}
                  cardDarkWithoutPadding
                  contentDark={
                    <>
                      <div className={styles.darkContent}>
                        <Chart value={15} valueMax={50} />
                        <div>
                          <div className={styles.darkContentTitle}>
                            Zaproś gości specjalnych
                          </div>
                          <div className={styles.darkContentDescription}>
                            Zaproś swoich kluczowych klientów, partnerów lub
                            gości specjalnych i zapewnij im dostęp do szeregu
                            wyjątkowych udogodnień.
                          </div>
                        </div>
                      </div>
                      <div className={styles.darkContentRight}>
                        <p className={styles.darkContentText}>
                          Biznes priority pass
                        </p>
                        <p className={styles.darkContentRightDescription}>
                          Każda osoba, którą zaprosisz przez generator w
                          aplikacji, otrzyma imienny Biznes Priority Pass o
                          wartości 249 PLN, obejmujący:
                        </p>
                      </div>
                    </>
                  }
                  contentDown={
                    <>
                      <p className={styles.ticketDownTitle}>Wysyłka masowa</p>
                      <p className={styles.ticketDownDescription}>
                        wgraj plik (csv, xls, xlsx) z danymi osób, które powinny
                        otrzymać zaproszenia VIP GOLD. Przed wysyłką zweryfikuj
                        zgodność danych.
                      </p>
                      <div className={styles.ticketAddFile}>
                        <p className={styles.ticketAddFileText}>Wgraj plik</p>
                        <button
                          className={styles.ticketAddFileButton}
                          type="button"
                          onClick={handleClick}
                        >
                          +
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{display: "none"}}
                          onChange={handleFileChange}
                        />
                      </div>
                    </>
                  }
                  contentUp={
                    <>
                      <Box sx={{height: 160, overflow: "hidden"}}>
                        <img
                          // src={data.headerImageUrl}
                          src="https://img.freepik.com/free-photo/abstract-flowing-neon-wave-background_53876-101942.jpg?semt=ais_incoming&w=740&q=80"
                          alt={data.eventName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                      <Box sx={{pt: 2.5}}>
                        <p className={styles.ticketTitle}>{data.eventName}</p>
                        <TextField
                          label="Imię i Nazwisko gościa"
                          variant="standard"
                          fullWidth
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          sx={{
                            mb: 2,
                          }}
                        />
                        <TextField
                          label="Adres e-mail"
                          variant="standard"
                          fullWidth
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          type="email"
                          sx={{mb: 3}}
                        />
                        <Box sx={{mb: 2}}>
                          <Typography variant="caption" sx={{color: "#666"}}>
                            Typ zaproszenia
                          </Typography>
                          <TextField
                            variant="standard"
                            select
                            fullWidth
                            SelectProps={{native: true}}
                            value={selectedTemplateId}
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
                        </Box>
                        <Button
                          variant="contained"
                          fullWidth
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
                        {sent.length > 0 && (
                          <Box sx={{mt: 3}}>
                            <Typography variant="subtitle2" sx={{mb: 1}}>
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
                                <Typography
                                  variant="body2"
                                  sx={{color: "#2e7d32"}}
                                >
                                  {row.status}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </>
                  }
                  heightUp={510}
                  heightDown={160}
                  cardDarkTop={-140}
                  cardDarkLeft={0}
                  cardDarkWidth={550}
                  heightDark={672}
                />
              )}
              <div className={styles.history}>
                <div
                  className={styles.historyTitle}
                  dangerouslySetInnerHTML={{
                    __html: `Wysłane zaproszenia (15<span> / 50</span>)`,
                  }}
                ></div>
                <div className={styles.line}></div>
                <p className={styles.historyTitle2}>
                  Sprawdź status wysłanych zaproszeń.
                </p>
                <div className={styles.historyBellFlex}>
                  <img alt="dzwonek" src={IconBell} height={15} width="auto" />
                  <p className={styles.historyBellText}>
                    Wyślij jednorazowe przypomnienie do tego gościa. Otrzyma
                    e-mail z linkiem do aktywacji zaproszenia
                  </p>
                </div>
                <div className={styles.historyBellCheckFlex}>
                  <img
                    alt="dzwonek"
                    src={IconBellCheck}
                    height={15}
                    width="auto"
                  />
                  <p className={styles.historyBellText}>
                    Gość już otrzymał przypomnienie. Można je wysłać tylko raz.
                  </p>
                </div>
                <TableContainer>
                  <Table aria-label="custom pagination table">
                    <TableBody>
                      {mockUsersSend.map((row, index) => (
                        <TableRow key={`row_${index}`}>
                          <TableCell
                            style={{width: 40}}
                            component="th"
                            scope="row"
                            className={styles.historyTableId}
                          >
                            {index + 1}.
                          </TableCell>
                          <TableCell
                            align="left"
                            className={styles.historyTableName}
                          >
                            {row.userName}
                          </TableCell>
                          <TableCell align="right">
                            <div
                              className={styles.badge}
                              style={{
                                color:
                                  row.status === "SEND"
                                    ? "#EFF3F6"
                                    : row.status === "CONFIRMED"
                                    ? "#6F87F6"
                                    : "#89F4C9",
                                borderColor:
                                  row.status === "SEND"
                                    ? "##707070"
                                    : row.status === "CONFIRMED"
                                    ? "#6F87F6"
                                    : "#89F4C9",
                              }}
                            >
                              {row.status === "SEND"
                                ? "Wysłane"
                                : row.status === "CONFIRMED"
                                ? "Potwierdzone"
                                : "Aktywowane"}
                            </div>
                          </TableCell>
                          <TableCell align="right">
                            {row.status === "SEND" && (
                              <img
                                alt="dzwonek"
                                src={row.received ? IconBellCheck : IconBell}
                                height={15}
                                width="auto"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <p className={styles.explanation}>Objaśnienie:</p>
                <div className={styles.explanationFlex}>
                  <div className={styles.explanationFlexBadge}>
                    <div
                      className={styles.badge}
                      style={{
                        color: "#EFF3F6",
                        borderColor: "##707070",
                      }}
                    >
                      Wysłane
                    </div>
                  </div>
                  <p className={styles.explanationFlexText}>
                    Zaproszenie zostało wysłane do gościa, ale jeszcze nie
                    zostało aktywowane.
                  </p>
                </div>
                <div className={styles.explanationFlex}>
                  <div className={styles.explanationFlexBadge}>
                    <div
                      className={styles.badge}
                      style={{
                        color: "#6F87F6",
                        borderColor: "##6F87F6",
                      }}
                    >
                      Potwierdzone
                    </div>
                  </div>
                  <p className={styles.explanationFlexText}>
                    Gość potwierdził swój udział i zapisał się na wydarzenie.
                  </p>
                </div>
                <div className={styles.explanationFlex}>
                  <div className={styles.explanationFlexBadge}>
                    <div
                      className={styles.badge}
                      style={{
                        color: "#89F4C9",
                        borderColor: "##89F4C9",
                      }}
                    >
                      Aktywowane
                    </div>
                  </div>
                  <p className={styles.explanationFlexText}>
                    Gość kliknął link w zaproszeniu i aktywował swój Biznes
                    Priority Pass.
                  </p>
                </div>
              </div>
            </main>
          </div>
        </>
      }
      colorLeft="#145D5A"
    />
  );
};

export default EventInvitationsPage;
