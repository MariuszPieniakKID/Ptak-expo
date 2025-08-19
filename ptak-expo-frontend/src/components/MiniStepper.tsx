import React from "react";
import { Box, Typography } from "@mui/material";

interface StepperProps {
 value: number;
  min?: number;
  max?: number;
  noMax?: boolean; // nowa opcja
  disableDecrease?: boolean;
  onChange?: (value: number) => void;
}

const MiniStepper: React.FC<StepperProps> = ({
  value,
  min,
  max,
  disableDecrease = false,
  noMax,
  onChange
}) => {
  const handleDecrease = () => {
    if (disableDecrease) return;
    if (min !== undefined && value <= min) return;
    onChange?.(value - 1);
  };

const handleIncrease = () => {
  if (!noMax && max !== undefined && value >= max) return;
  onChange?.(value + 1);
};

  return (
    <Box
      sx={{
        width: "72px",
        height: "29px",
        border: "1px solid #ccc",
        borderRadius: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Minus */}
      <Box
        onClick={handleDecrease}
        sx={{
          width: "24px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disableDecrease ? "not-allowed" : "pointer",
          fontWeight: "bold",
          color: disableDecrease ? "#ccc" : "orange",
          "&:hover": disableDecrease ? {} : { backgroundColor: "rgba(255,165,0,0.1)" },
        }}
      >
        –
      </Box>

      {/* Value */}
      <Typography
        sx={{
          flex: 1,
          textAlign: "center",
          fontSize: "14px",
          fontWeight: 500,
          color: "#a7a7a7",
        }}
      >
        {value}
      </Typography>

      {/* Plus */}
      <Box
        onClick={handleIncrease}
        sx={{
          width: "24px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontWeight: "bold",
          color: "orange",
          "&:hover": { backgroundColor: "rgba(255,165,0,0.1)" },
        }}
      >
        +
      </Box>
    </Box>
  );
};

export default MiniStepper;