import Button, { ButtonProps } from '@mui/material/Button';

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
  ...rest
}) => {
  return (
    <Button
      {...rest}
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
      {children}
    </Button>
  );
};

export default CustomButton;
