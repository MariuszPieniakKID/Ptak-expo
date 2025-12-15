import React from "react";

interface InvitationProgressProps {
  invites: number;
  limit: number;
}

const InvitationProgress: React.FC<InvitationProgressProps> = ({
  invites,
  limit,
}) => {
  const size = 72;
  const strokeWidth = 3;
  // Promień mniejszy o margines, aby marker nie był ucinany
  const radius = (size - strokeWidth) / 2 - 2;
  const center = size / 2;

  const percentage = Math.min(Math.max(invites / limit, 0), 1);
  const degrees = percentage * 360;

  const angleInRad = (degrees - 90) * (Math.PI / 180); // Start od góry
  const markerX = center + radius * Math.cos(angleInRad);
  const markerY = center + radius * Math.sin(angleInRad);

  const styles: { [key: string]: React.CSSProperties } = {
    wrapper: {
      position: "relative",
      width: `${size}px`,
      height: `${size}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent", // Całkowita przezroczystość tła
      fontFamily: "sans-serif",
    },
    progressRing: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      // Gradient postępu
      background: `conic-gradient(
        #6F87F6 0deg, 
        #383838 ${degrees}deg, 
        #383838 360deg
      )`,
      // Maska wycinająca środek - tworzy przezroczystość wewnątrz okręgu
      WebkitMaskImage: `radial-gradient(transparent ${
        radius - strokeWidth / 2
      }px, black ${radius - strokeWidth / 2 + 1}px)`,
      maskImage: `radial-gradient(transparent ${
        radius - strokeWidth / 2
      }px, black ${radius - strokeWidth / 2 + 1}px)`,
    },
    svgOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      overflow: "visible", // Zapobiega ucinaniu markera
    },
    marker: {
      fill: "transparent", // Środek markera jest teraz przezroczysty
      stroke: "#83F3AF",
      strokeWidth: 1.5,
    },
    content: {
      textAlign: "center",
      color: "#ffffff",
      zIndex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    numbers: {
      display: "flex",
      alignItems: "baseline",
      lineHeight: 1,
    },
    currentValue: {
      fontSize: "20px",
      fontWeight: "300",
    },
    limitValue: {
      fontSize: "11px",
      color: "rgba(255, 255, 255, 0.5)", // Szary kolor bazujący na przezroczystości bieli
      marginLeft: "1px",
    },
    label: {
      fontSize: "8px",
      fontWeight: "600",
      marginTop: "2px",
    },
  };

  return (
    <div style={styles.wrapper}>
      {/* Pierścień z gradientem i przezroczystym środkiem */}
      <div style={styles.progressRing} />

      {/* Warstwa SVG z markerem */}
      <svg style={styles.svgOverlay} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={markerX} cy={markerY} r="4" style={styles.marker} />
      </svg>

      {/* Tekst */}
      <div style={styles.content}>
        <div style={styles.numbers}>
          <span style={styles.currentValue}>{invites}</span>
          <span style={styles.limitValue}>/{limit}</span>
        </div>
        <span style={styles.label}>Zaproszeń</span>
      </div>
    </div>
  );
};

export default InvitationProgress;
