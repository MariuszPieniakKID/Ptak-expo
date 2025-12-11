import styles from "./Ticket.module.scss";
import { memo, ReactNode } from "react";

type T_Ticket = {
  contentUp: ReactNode;
  contentDown: ReactNode;
  contentDark: ReactNode;
  heightUp?: number;
  heightDown?: number;
  heightDark?: number;
  cardDarkTop?: number;
  cardDarkLeft?: number;
  cardDarkWidth?: number;
  cardDarkWithoutPadding?: boolean;
  left?: number;
};

const Ticket = ({
  contentUp,
  contentDown,
  contentDark,
  heightUp = 380,
  heightDown = 190,
  cardDarkTop = 0,
}: // cardDarkLeft = 270,
// cardDarkWidth = 320,
// heightDark,
// cardDarkWithoutPadding,
T_Ticket) => {
  return (
    <div
      className={styles.cardWrapper}
      style={{
        paddingTop: `${Math.abs(cardDarkTop)}px`,
      }}
    >
      <div className={styles.card}>
        <div
          className={styles.leftBackground}
          style={{
            maskImage: `radial-gradient(
    circle 20px at 0px ${heightUp + 20}px,
    transparent 99%,
    black 100%
  )`,
          }}
        ></div>
        <div
          className={styles.rightBackground}
          style={{
            maskImage: `radial-gradient(
    circle 20px at 100% ${heightUp + 20}px,
    transparent 99%,
    black 100%
  )`,
          }}
        ></div>
        <div className={styles.cardContent}>
          <div
            className={styles.cardContentUp}
            style={{
              height: `${heightUp}px`,
            }}
          >
            {contentUp}
          </div>
          <div
            className={styles.dash}
            style={{
              top: `${heightUp}px`,
            }}
          ></div>
          <div
            className={styles.cardContentDown}
            style={{
              height: `${heightDown}px`,
            }}
          >
            {contentDown}
          </div>
        </div>
      </div>
      <div
        className={styles.cardDark}
        // style={{
        //   top: `${cardDarkTop}px`,
        //   left: `${cardDarkLeft}px`,
        //   width: `${cardDarkWidth}px`,
        //   minHeight: `${Math.abs(cardDarkTop) + 40}px`,
        //   height: heightDark ? `${heightDark}px` : "auto",
        //   padding: cardDarkWithoutPadding ? 0 : undefined,
        // }}
      >
        {contentDark}
      </div>
    </div>
  );
};

export default memo(Ticket);
