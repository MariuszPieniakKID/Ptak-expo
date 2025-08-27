import { ReactNode } from "react";
import GreenCheck from "./GreenCheck";

export function ApplyGreenCheck({checked, children, nomargin}: {checked: boolean, children: ReactNode, nomargin?: boolean}) {
	return <div style={{position: "relative", width: "fit-content", margin: nomargin ? "initial" : "auto"}}>
		{checked &&<GreenCheck style={{top: -7, right: -2, position: "absolute"}}/>}
		{children}
	</div>
}