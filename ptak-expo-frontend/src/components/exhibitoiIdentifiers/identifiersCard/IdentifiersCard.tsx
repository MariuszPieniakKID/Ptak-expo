import React from "react";
import { Box } from "@mui/material";
import styles from "./IdentifiersCard.module.scss";
import CustomTypography from "../../customTypography/CustomTypography";


interface Identyfikator {
  id: number;
  imieNazwisko: string;
  typ: string;
}

interface IdentifiersCardProps {
  data: Identyfikator[];
}

const IdentifiersCard: React.FC<IdentifiersCardProps> = ({ data }) => {
  return (
    <Box className={styles.container}>
      {data.length === 0 ? (
        <CustomTypography className={styles.title}>
          Brak wygenerowanych identyfikatorów
        </CustomTypography>
      ) : (
        <>
          <CustomTypography className={styles.title}>
            Wygenerowane e-identyfikatory ({data.length})
          </CustomTypography>

          {data.map((item, index) => (
            <Box key={item.id} className={styles.singleLine}>
              <Box className={styles.indexWithFullName}>
                <CustomTypography className={styles.number}>
                  {index + 1}.
                </CustomTypography>
                <CustomTypography className={styles.fullName}>
                  {item.imieNazwisko}
                </CustomTypography>
              </Box>

              {/* Prawa strona */}
              <Box className={styles.identifiersType}>
                <CustomTypography className={styles.identifiersType}>
                  {item.typ}
                </CustomTypography>
              </Box>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
};

export default IdentifiersCard;
