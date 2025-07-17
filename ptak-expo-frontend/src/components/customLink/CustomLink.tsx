import clsx from 'clsx';
import styles from './CustomLink.module.scss';
import { useState } from 'react';

interface CustomLinkProps {
  children: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  color?: string;
  hoverColor?:string;
  fontSize?: string | number;
  fontWeight?: string | number;
  underline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
const CustomLink: React.FC<CustomLinkProps> = ({
  children,
  href,
  onClick,
  color = '#2e2e38',
  hoverColor='#6F87F6',
  fontSize = '1rem',
  fontWeight = 300,
  underline = false,
  className,
  style = {},
  ...rest
}) => {
  const [isHover, setIsHover] = useState(false);

  return (
    <a
      href={href}
      onClick={onClick}
      className={clsx(styles.link, className)}
      style={{
        color: isHover ? hoverColor : color,
        fontSize,
        fontWeight,
        textDecoration: underline ? 'underline' : 'none',
        cursor: 'pointer',
        ...style,
      }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      {...rest}
    >
      {children}
    </a>
  );
};

export default CustomLink;