import Button, { ButtonProps } from '@mui/material/Button';
import { Box } from '@mui/material';

interface CustomButtonProps extends Omit<ButtonProps, 'sx'> {
  bgColor?: string;
  focusColor?: string;
  disabledColor?: string;
  disabledTextColor?: string;
  width?: string | number;
  height?: string | number;
  fontSize?: string | number;
  fontWeight?: string | number;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | 'inherit';
  textColor?: string;
  sx?: object;        // możliwość przekazania dodatkowych własnych stylów
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'top' | 'left'; // domyślnie 'left'
  withBorder?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  bgColor = '#6F87F6', 
  focusColor = '#6F87F6',
  disabledColor = '#D7D9DD',
  disabledTextColor='#fff',
  width = '100%',
  height = '3rem',
  fontSize = '1rem',
  fontWeight = 500,
  textTransform = 'none',
  textColor = '#fff',
  sx = {},
  children,
  className='',
  icon,
  iconPosition = 'left',
  withBorder = false,
  ...rest
}) => {
  return (
    <Button
      {...rest}
      className={className}
      sx={{
        borderRadius: '1rem',
        backgroundColor: bgColor,
        color: textColor,
        width,
        height,
        fontSize,
        fontWeight,
        textTransform,
        transition: 'background 0.2s',
        border: withBorder ? '1px solid currentColor' : 'none',
        padding: iconPosition === 'top' ? '0.5rem' : '0 1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        '&:hover': {
          backgroundColor: focusColor,
        },
        '&:focus': {
          backgroundColor: focusColor,
        },
        '&.Mui-disabled': {
          backgroundColor: disabledColor,
          color: disabledTextColor,
        },
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: iconPosition === 'top' ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: iconPosition === 'top' ? '0.3rem' : '0.5rem',
        }}
      >
        {icon && (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </span>
        )}
        <span>{children}</span>
      </Box>
    </Button>
  );
};

export default CustomButton;