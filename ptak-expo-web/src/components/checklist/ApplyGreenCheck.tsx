import { ReactNode } from "react";
import GreenCheck from "./GreenCheck";

export function ApplyGreenCheck({checked, children}: {checked: boolean, children: ReactNode}) {
	return <div style={{position: "relative", width: "fit-content", margin: "auto"}}>
		{checked &&<GreenCheck style={{top: -7, right: -2, position: "absolute"}}/>}
		{children}
	</div>
}