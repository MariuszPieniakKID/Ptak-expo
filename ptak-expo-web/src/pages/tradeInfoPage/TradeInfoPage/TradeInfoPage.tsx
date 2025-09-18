import React, {useCallback, useEffect, useMemo, useState} from "react";
import styles from "./TradeInfoPage.module.css";
import IconMain from "../../../assets/group-23.png";
import IconArrowRight from "../../../assets/arrow-right.png";
import CustomTypography from "../../../components/customTypography/CustomTypography";
import {
  formatDateForDisplay,
  formatDateRange,
  formatDateRangeDays,
} from "./utilities";
import {TradeInfoPlan} from "./TradeInfoPlan";

const mockMainBuildInfo = {
  stand: "Hala F / 3.47",
  informations: [
    {
      title: "Montaż idywidualny",
      hours: [
        {
          dateStart: "2025-10-20T08:00:00",
          dateEnd: "2025-10-20T18:00:00",
        },
        {
          dateStart: "2025-10-21T08:00:00",
          dateEnd: "2025-10-21T18:00:00",
        },
      ],
    },
    {
      title: "Montaż PTAK EXPO",
      hours: [
        {
          dateStart: "2025-10-21T08:00:00",
          dateEnd: "2025-10-21T18:00:00",
        },
      ],
    },
    {
      title: "Demontaż",
      hours: [
        {
          dateStart: "2025-10-26T08:00:00",
          dateEnd: "2025-10-26T18:00:00",
        },
      ],
    },
  ],
};

const mockEventInformations = {
  startDate: "2025-10-26T08:00:00",
  endDate: "2025-10-29T08:00:00",
  name: "Warsaw Industry Weej Targi Innowacyjnych Rozwiązań dla Przemysłu",
  openingHours: {
    forExhibitors: "08:00 - 17:00",
    forClients: "10:00 - 16:00",
  },
  phones: {
    forClients: "+48 518 739 124",
    security: "+48 514 363 603",
  },
  guardian: {
    name: "Magda Masny",
    phone: "+48 518 739 124",
    email: "m.masny@warsawexpo.eu",
  },
};

const mockFairPlan = {
  halls: [
    {
      name: "Hala A",
      isYourHall: false,
      positionNumber: undefined,
    },
    {
      name: "Hala B",
      isYourHall: false,
      positionNumber: undefined,
    },
    {
      name: "Hala C",
      isYourHall: false,
      positionNumber: undefined,
    },
    {
      name: "Hala D",
      isYourHall: true,
      positionNumber: "3.47",
    },
  ],
  days: [
    {
      id: 1,
      date: "2025-10-26T08:00:00",
      plans: [
        {
          id: 1,
          hours: "09:00-17:00",
          hall: {
            name: "Hala D",
          },
          title: "ArchiDay",
          description:
            "Sala konferencyjna, Hala C Wymagany własny sprzęt. Sala konferencyjna, Hala C Wymagany własny sprzęt",
        },
        {
          id: 2,
          hours: "02:00-17:00",
          hall: {
            name: "Hala C",
          },
          title: "ArchiDay",
          description:
            "Sala konferencyjna, Hala C Wymagany własny sprzęt. Sala konferencyjna, Hala C Wymagany własny sprzęt",
          urlMore: "https://www.google.com/",
        },
      ],
    },
    {
      id: 2,
      date: "2025-10-28T08:00:00",
      plans: [
        {
          id: 3,
          hours: "09:00-17:00",
          hall: {
            name: "Hala D",
          },
          title: "ArchiDay",
          description:
            "Sala konferencyjna, Hala C Wymagany własny sprzęt. Sala konferencyjna, Hala C Wymagany własny sprzęt",
          urlMore: "https://www.google.com/",
        },
      ],
    },
  ],
  countEvents: 65,
};

type T_TradeInfoPage = {
  tradeInfo: {
    tradeHours: {
      exhibitorStart: string;
      exhibitorEnd: string;
      visitorStart: string;
      visitorEnd: string;
    };
    contactInfo: {guestService: string; security: string};
    buildDays: Array<{
      id: string;
      date: string;
      startTime: string;
      endTime: string;
    }>;
    buildType: string;
    tradeSpaces: Array<{
      id: string;
      name: string;
      hallName: string;
      filePath?: string | null;
      originalFilename?: string | null;
    }>;
    tradeMessage: string;
  } | null;
  eventName?: string;
  eventDateRange?: string;
  daysUntilEvent?: number;
  onDownloadPlan: (spaceId: string, filename: string) => void;
  eventId: string;
};

export const TradeInfoPage: React.FC<T_TradeInfoPage> = ({eventId}) => {
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  // const exhibStart = tradeInfo?.tradeHours.exhibitorStart || "-";
  // const exhibEnd = tradeInfo?.tradeHours.exhibitorEnd || "-";
  // const visitStart = tradeInfo?.tradeHours.visitorStart || "-";
  // const visitEnd = tradeInfo?.tradeHours.visitorEnd || "-";
  // const guest = tradeInfo?.contactInfo.guestService || "-";
  // const security = tradeInfo?.contactInfo.security || "-";
  // const buildType = tradeInfo?.buildType || '-';

  useEffect(() => {
    if (mockFairPlan.days.length === 0) {
      return;
    }

    setSelectedDayId(mockFairPlan.days.at(0)?.id || null);
  }, []);

  const handleClickDay = useCallback((newDayId: number) => {
    setSelectedDayId(newDayId);
  }, []);

  const foundDay = useMemo(() => {
    return mockFairPlan.days.find((item) => item.id === selectedDayId);
  }, [selectedDayId]);

  const mapBuildInformations = mockMainBuildInfo.informations.map(
    (item, index) => {
      const mapHours = item.hours.map((itemHour, indexHour) => {
        const generatedDate = formatDateRange({
          endDate: itemHour.dateStart,
          startDate: itemHour.dateEnd,
        });
        return (
          <div
            key={`hour_${index}_${indexHour}`}
            className={styles.marketBuildingsItemHours}
          >
            <div className={styles.marketBuildingsItemHoursFirstHour}>
              <CustomTypography fontSize="14px" fontWeight={700}>
                {generatedDate.date}
              </CustomTypography>
            </div>
            <CustomTypography fontSize="14px" fontWeight={700} color="#6F87F6">
              {generatedDate.hours}
            </CustomTypography>
          </div>
        );
      });

      return (
        <div key={`information_${index}`}>
          <CustomTypography
            fontSize="13px"
            fontWeight={500}
            color="#666A73"
            className={styles.marketBuildingsItemHeader}
          >
            {item.title}
          </CustomTypography>
          {mapHours}
        </div>
      );
    }
  );

  const mapHall = mockFairPlan.halls.map((item, index) => {
    return (
      <div
        key={`hall_${index}`}
        className={styles.planCard}
        style={{
          borderColor: item.isYourHall ? "#6F87F6" : "#4d4c4f",
        }}
      >
        <CustomTypography fontSize="10px" fontWeight={700} color="white">
          {item.name}
        </CustomTypography>
        {item.isYourHall && item.positionNumber && (
          <div className={styles.planCardPosition}>
            <p
              dangerouslySetInnerHTML={{
                __html: `Twoje stoisko - <b>${item.positionNumber}</b>`,
              }}
            />
          </div>
        )}
      </div>
    );
  });

  const mapDays = mockFairPlan.days.map((item, index) => {
    const {day, month} = formatDateForDisplay({
      date: item.date,
    });

    const isSelectedDay = selectedDayId === item.id;

    return (
      <button
        className={styles.plansDay}
        key={`day_${index}`}
        onClick={() => handleClickDay(item.id)}
        style={{
          backgroundColor: isSelectedDay ? "#6f87f6" : undefined,
        }}
      >
        {day}
        <br />
        {month}
      </button>
    );
  });

  const mapDayPlans = foundDay?.plans?.map((item, index) => {
    return (
      <TradeInfoPlan
        {...item}
        key={`infoPlan_${item.id}_${index}`}
        isFirstItem={index === 0}
      />
    );
  });

  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <section className={styles.mainHeader}>
          <div className={styles.headerInner}>
            <img alt="główna ikona" src={IconMain} height={54} width={69} />
            <div className={styles.headerTitle}>Informacje targowe</div>
          </div>
        </section>
        <section className={styles.content}>
          <div className={styles.contentWhite}>
            <div className={styles.eventInformations}>
              <div className={styles.eventInformationsLogo}>
                <img alt="logo" src={IconMain} height="auto" width={55} />
              </div>
              <div>
                <CustomTypography
                  fontSize="1rem"
                  fontWeight={600}
                  color="#6F87F6"
                >
                  {formatDateRangeDays({
                    endDate: mockEventInformations.endDate,
                    startDate: mockEventInformations.startDate,
                  })}
                </CustomTypography>
                <CustomTypography
                  fontSize="14px"
                  fontWeight={700}
                  className={styles.eventInformationsName}
                >
                  {mockEventInformations.name}
                </CustomTypography>
              </div>
            </div>
            <div className={styles.eventInformationsHours}>
              <CustomTypography fontSize="14px" fontWeight={700}>
                Godziny otwarcia targów:
              </CustomTypography>
              <div className={styles.eventInformationsHoursItems}>
                <div className={styles.eventInformationsHoursItem}>
                  <CustomTypography
                    fontSize="13px"
                    fontWeight={400}
                    color="#666A73"
                  >
                    Dla wystawców
                  </CustomTypography>
                  <div className={styles.eventInformationsHoursItemDate}>
                    <CustomTypography
                      fontSize="14px"
                      fontWeight={700}
                      color="#6F87F6"
                    >
                      {mockEventInformations.openingHours.forExhibitors}
                    </CustomTypography>
                  </div>
                </div>
                <div className={styles.eventInformationsHoursItem}>
                  <CustomTypography
                    fontSize="13px"
                    fontWeight={400}
                    color="#666A73"
                  >
                    Dla gości
                  </CustomTypography>
                  <div className={styles.eventInformationsHoursItemDate}>
                    <CustomTypography
                      fontSize="14px"
                      fontWeight={700}
                      color="#6F87F6"
                    >
                      {mockEventInformations.openingHours.forClients}
                    </CustomTypography>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.eventInformationsHours}>
              <CustomTypography fontSize="14px" fontWeight={700}>
                Kontakt podczas targów:
              </CustomTypography>
              <div className={styles.eventInformationsHoursItems}>
                <div className={styles.eventInformationsHoursItem}>
                  <CustomTypography
                    fontSize="13px"
                    fontWeight={400}
                    color="#666A73"
                  >
                    Obsługa Gości
                  </CustomTypography>
                  <div className={styles.eventInformationsHoursItemDate}>
                    <CustomTypography fontSize="12px" fontWeight={700}>
                      {mockEventInformations.phones.forClients}
                    </CustomTypography>
                  </div>
                </div>
                <div className={styles.eventInformationsHoursItem}>
                  <CustomTypography
                    fontSize="13px"
                    fontWeight={400}
                    color="#666A73"
                  >
                    Ochrona
                  </CustomTypography>
                  <div className={styles.eventInformationsHoursItemDate}>
                    <CustomTypography fontSize="12px" fontWeight={700}>
                      {mockEventInformations.phones.security}
                    </CustomTypography>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.contactBox}>
              <div className={styles.contactTitle}>
                Twój dedykowany opiekun:
              </div>
              <div className={styles.contactRow}>
                <div className={styles.contactAvatar} />
                <div className={styles.contactMeta}>
                  <div className={styles.contactName}>
                    {mockEventInformations.guardian.name}
                  </div>
                  <div className={styles.contactPhone}>
                    {mockEventInformations.guardian.phone}
                  </div>
                  <div className={styles.contactMail}>
                    {mockEventInformations.guardian.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.contentGray}>
            <div className={styles.contentPosition}>
              <CustomTypography
                fontSize="14px"
                fontWeight={600}
                color="#6F87F6"
              >
                Twoje Stoisko targowe:
              </CustomTypography>
              <CustomTypography
                fontSize="1rem"
                fontWeight={600}
                className={styles.positionInfo}
              >
                {mockMainBuildInfo.stand}
              </CustomTypography>
            </div>
            <div className={styles.marketBuildings}>
              <CustomTypography fontSize="14px" fontWeight={600}>
                Zabudowa targowa:
              </CustomTypography>
              <div className={styles.marketBuildingsContent}>
                {mapBuildInformations}
                <div className={styles.marketingBuildingsShowMore}>
                  <CustomTypography fontSize="13px" fontWeight={400}>
                    Zobacz dokumenty
                  </CustomTypography>
                  <a href={`/event/${eventId}/documents`}>
                    <button className={styles.marketingBuildingsShowMoreButton}>
                      <img
                        alt="ikona strzałka w prawo"
                        src={IconArrowRight}
                        height={8}
                        width={10}
                      />
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.contentDark}>
          <CustomTypography fontSize="1rem" fontWeight={700} color="white">
            Plan Targów:
          </CustomTypography>
          <div className={styles.plansContent}>{mapHall}</div>
          <CustomTypography fontSize="1rem" fontWeight={700} color="white">
            {`Wydarzenia towarzyszące  (${mockFairPlan.countEvents})`}
          </CustomTypography>
          <div className={styles.plansDays}>
            <CustomTypography fontSize="13px" fontWeight={500} color="#A7A7A7">
              Wybierz dzień targów:
            </CustomTypography>
            {mapDays}
          </div>
          {mapDayPlans}
          <div className={styles.dayPlanEvent}>
            <CustomTypography fontSize="13px" fontWeight={500} color="#D7D9DD">
              Wydarzenia towarzyszące to wsaniały pomysł lorem ipsum. Wydarzenia
              towarzyszące to wsaniały pomysł lorem ipsum
            </CustomTypography>
          </div>
          <button className={styles.dayPlanEventButton}>
            Zgłoś wydarzenie na swoim stoisku
          </button>
        </section>
      </main>
    </div>
  );
};
