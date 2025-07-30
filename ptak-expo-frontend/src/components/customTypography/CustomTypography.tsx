import React, { ReactNode } from 'react';
import Typography from '@mui/material/Typography';
import styles from './CustomTypography.module.scss';

interface CustomTypographyProps {
  children: ReactNode;
  className?: string;
  fontSize?:string;
  fontWeight?:number;
  color?: string;
  component?: React.ElementType; 
}

const CustomTypography: React.FC<CustomTypographyProps> = ({ 
  children, 
  className = '',
  fontSize,
  fontWeight,
  color,
}) => (
  <Typography
    className={
      `
      // ${styles.title} 
      ${className}
      `}
    sx={{ 
      fontSize: fontSize ? fontSize : '1.125rem',
      fontWeight: fontWeight?fontWeight:600,
      color: color ? color : '#2e2e38',
    }}
  >
    {children}
  </Typography>
);

export default CustomTypography;