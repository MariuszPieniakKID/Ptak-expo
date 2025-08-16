import { SVGProps } from "react";
import { JSX } from "react/jsx-runtime";

const CircleOrangeIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    viewBox="0 0 24 24"
    width="24"
    {...props}
  >
    {/* Pomarańczowe tło koła */}
    <circle fill="#FC8A06" cx="12" cy="12" r="12" />
    {/* Biały znak check */}
    <path fill="#FFF" d="M10 15l-3-3 1.4-1.4L10 12.2l5.6-5.6L17 8l-7 7z" />
  </svg>
);

export default CircleOrangeIcon;