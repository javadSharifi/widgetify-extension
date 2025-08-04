import { IconType } from "react-icons";
import Tooltip from "../../../../components/toolTip";

interface NavbarWidgetsTooltipProps {
  content: string;
  Icon: IconType;
  onClick: VoidFunction;
  className?: string;
  disabled?: boolean;
}
export default function NavbarWidgetsTooltip({
  content,
  Icon,
  onClick,
  className,
  disabled,
}: NavbarWidgetsTooltipProps) {
  const buttonClasses = `btn cursor-pointer h-7 w-7 text-xs font-medium rounded-[0.55rem] transition-colors border-none shadow-none text-muted hover:bg-base-300 btn-xs ${
    className || ""
  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <Tooltip content={content}>
      <div className={buttonClasses} onClick={handleClick}>
        <Icon size={20} className="text-muted" />
      </div>
    </Tooltip>
  );
}