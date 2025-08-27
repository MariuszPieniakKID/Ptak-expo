import { Typography } from "@mui/material";
import ChecklistCard from "./checklistCard";

export default function CompanyInfo() {
	return (
	<ChecklistCard title={<>
			<img src={`/assets/checklist-step-1.svg`} alt=""></img>
			<Typography fontSize={16}>Wpis do katalogu targowego (1/6)</Typography>
		</>}>
		Test
		{/*<div className={styles.sectionList}>
			{['Nazwa Firmy','Logotyp','Opis','Dane kontaktowe','Strona www.','Social Media'].map((it) => (
				<div key={it} className={styles.sectionRow}><span>{it}</span><div className={styles.sectionGoodDot} /></div>
			))}
		</div>
		<div className={styles.sectionLink}>Podejrzyj wygląd wpisu do katalogu</div>*/}
	</ChecklistCard>)
}