import React, { MouseEventHandler, ReactNode } from 'react';
import Typography from '@mui/material/Typography';
import styles from './CustomTypography.module.scss';
import { SxProps, Theme } from '@mui/material';

interface CustomTypographyProps {
  children: ReactNode;
  className?: string;
  fontSize?:string;
  fontWeight?:number;
  color?: string;
  component?: React.ElementType;
  sx?: SxProps<Theme>;
  onClick?: MouseEventHandler<any>;
  
}

const CustomTypography: React.FC<CustomTypographyProps> = ({ 
  children, 
  className = '',
  fontSize,
  fontWeight,
  color,
  component,
  onClick,
  sx,
}) => (
  <Typography
    {...(component && { component })}
    className={
      `
      // ${styles.title} 
      ${className}
      `}
    sx={{ 
      fontSize: fontSize ? fontSize : '1.125rem',
      fontWeight: fontWeight?fontWeight:600,
      color: color ? color : '#2e2e38',
      ...sx,
    }}
    onClick={onClick} 
  >
    {children}
  </Typography>
);

export default CustomTypography;