import {ReactNode} from "react";
import GreenCheck from "./GreenCheck";

export function ApplyGreenCheck({
  checked,
  children,
  nomargin,
}: {
  checked: boolean;
  children: ReactNode;
  nomargin?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: 44,
        margin: nomargin ? "initial" : "auto",
        border: "2px solid white",
        borderRadius: "50%",
        height: 44,
      }}
    >
      {children}
      {checked && (
        <GreenCheck
          style={{
            top: -7,
            right: -2,
            position: "absolute",
          }}
        />
      )}
    </div>
  );
}
