import styles from "../TradeInfoPage.module.css";
import IconArrow from "../../../../assets/group-148.png";
import IconArrowUpRight from "../../../../assets/arrow-up-right.png";
import {Collapse} from "@mui/material";
import {memo, useCallback, useState} from "react";

type T_TradeInfoPlan = {
  hours: string;
  hall: {
    name: string;
  };
  title: string;
  description: string;
  urlMore?: string;
  isFirstItem: boolean;
};

const TradeInfoPlan = ({
  description,
  hall,
  hours,
  title,
  isFirstItem,
  urlMore,
}: T_TradeInfoPlan) => {
  const [isCollapseOpen, setIsCollapseOpen] = useState(false);

  const handleClickArrow = useCallback(() => {
    setIsCollapseOpen((prevState) => !prevState);
  }, []);

  return (
    <div
      className={styles.dayPlanWrapper}
      style={{
        borderTop: isFirstItem ? undefined : "none",
      }}
    >
      <div className={styles.dayPlan} onClick={handleClickArrow}>
        <div className={styles.dayPlanItems}>
          <div className={styles.dayPlanDate}>{hours}</div>
          <div className={styles.dayPlanHall}>{hall.name}</div>
          <div className={styles.dayPlanTitle}>{title}</div>
          <button
            className={styles.dayPlanArrow}
            style={{
              transform: `rotate(${isCollapseOpen ? "180deg" : "0deg"})`,
            }}
          >
            <img alt="strzałka" src={IconArrow} height={7} width="auto" />
          </button>
        </div>
      </div>
      <Collapse in={isCollapseOpen}>
        <div className={styles.dayPlanDescriptionWrapper}>
          <div className={styles.dayPlanDescription}>{description}</div>
          {urlMore && (
            <a
              className={styles.dayPlanShowMore}
              href={urlMore}
              target="_blank"
              rel="noreferrer"
            >
              <div>więcej</div>
              <img
                alt="strzałka"
                src={IconArrowUpRight}
                height={12}
                width="auto"
              />
            </a>
          )}
        </div>
      </Collapse>
    </div>
  );
};

export default memo(TradeInfoPlan);
