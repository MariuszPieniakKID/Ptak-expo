import Tooltip, { tooltipClasses, TooltipProps } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

interface CustomTooltipProps extends TooltipProps {
  boxShadowColor?: string | undefined;
}

const CustomTooltip = styled(
  ({ className, boxShadowColor, ...props }: CustomTooltipProps) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
  )
)<{ boxShadowColor?: string | undefined }>(({ boxShadowColor }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#FFFFFF",
    color: "#6F6F6F",
    fontSize: "11px",
    borderRadius: "20px",
    padding: "4px 10px",
    boxShadow: `0 2px 6px ${boxShadowColor ?? "rgba(0,0,0,0.08)"}`,
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#FFFFFF",
  },
}));

export default CustomTooltip;