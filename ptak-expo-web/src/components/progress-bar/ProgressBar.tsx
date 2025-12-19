import React from "react";

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const BARS_COUNT = 40;
  const GAP_WIDTH = 5; // Szerokość białej przerwy

  // Generujemy maskę w formie pasków (linear-gradient powtarzalny)
  // Używamy SVG jako maski, aby mieć pełną kontrolę nad zaokrągleniami
  //   const barWidth = 100 / BARS_COUNT;

  return (
    <div
      style={{ width: "100%", backgroundColor: "#FFFFFF", padding: "10px 0" }}
    >
      <div
        style={{
          width: "100%",
          height: "32px",
          position: "relative",
          backgroundColor: "#fff", // Szary spód (nieaktywne paski)
          display: "flex",
          gap: `${GAP_WIDTH}px`,
        }}
      >
        {Array.from({ length: BARS_COUNT }).map((_, i) => {
          const threshold = (i / BARS_COUNT) * 100;
          const isActive = threshold < clampedPercentage;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: "100%",
                position: "relative",
                overflow: "hidden",
                // Zaokrąglenie tylko dla środkowych pasków
                borderRadius: "100px",
                backgroundColor: "#D7D9DD", // Domyślnie szary
              }}
            >
              {/* Warstwa z gradientem - widoczna tylko jeśli pasek jest 'aktywny' */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    // Obliczamy przesunięcie gradientu tak, aby czerwony był na 0%, a zielony na 100% całości
                    // Używamy left: -X% względem całego kontenera
                    left: `calc(${-i * 100}% - ${i * GAP_WIDTH}px)`,
                    width: `calc(${BARS_COUNT * 100}% + ${
                      (BARS_COUNT - 1) * GAP_WIDTH
                    }px)`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, #FF0000 0%, #EC693A 25%, #FFE100 50%, #3DE40E 75%, #19E58D 100%)",
                    zIndex: 1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
