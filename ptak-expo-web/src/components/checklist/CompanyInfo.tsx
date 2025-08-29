import { Box, Button, IconButton, SvgIcon, TextField, Typography } from "@mui/material";
import ChecklistCard from "./checklistCard";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useChecklist } from "../../contexts/ChecklistContext";
import GreenCheck from "./GreenCheck";

function DisplayEdit({text, onEdit, checked}: {text: ReactNode, onEdit: () => void, checked?: boolean}) {
		return <Box display="flex" alignItems="center">
			<Box width="30px" alignItems="center" justifyContent="center">
				{checked && <GreenCheck/>}
			</Box>
				{text}
			<IconButton color="secondary" onClick={onEdit} sx={{marginLeft: "auto"}}>
				<SvgIcon>
				<svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="14.499" cy="14.5" r="14" stroke="#A7A7A7"/>
<path d="M12.626 18.1979L10.3394 18.7888C9.84221 18.9174 9.38964 18.4648 9.51822 17.9678L10.1094 15.6813C10.2623 15.089 10.5712 14.5485 11.0038 14.116L17.2068 7.91294C18.0868 7.03293 19.5138 7.03293 20.3941 7.91294C21.2744 8.7932 21.2744 10.2202 20.3941 11.1005L14.1911 17.3035C13.7587 17.7361 13.2181 18.0449 12.626 18.1979Z" stroke="#A7A7A7" strokeLinecap="round"/>
<line x1="17.0216" y1="8.80566" x2="19.502" y2="11.2861" stroke="#A7A7A7" strokeLinecap="round"/>
<line x1="11.7315" y1="14.0952" x2="14.2119" y2="16.5756" stroke="#A7A7A7" strokeLinecap="round"/>
<line x1="10.0508" y1="21.75" x2="20.4453" y2="21.75" stroke="#A7A7A7" strokeLinecap="round"/>
</svg></SvgIcon>
			</IconButton>
		</Box>

}
function StringEdit({name, value, onChange, multiline}: {name: string, value: string | null, onChange: (s: string | null) => void, multiline?: boolean}) {
	const [isEdit, setIsEdit] = useState(false);
	const [editText, setEditText] = useState<string>(value || "")
	useEffect(() => setEditText(value || ""), [value])
	if (!isEdit) {
		return <DisplayEdit text={name + ": " + (value || "")} onEdit={() => setIsEdit(true)} checked={value != null} />	}
	return (
		<Box display="flex" alignItems="center">
				<Box width="30px" alignItems="center" justifyContent="center">
					{value != null && <GreenCheck/>}
				</Box>
			<TextField variant="standard" value={editText} onChange={(e) => { setEditText(e.target.value);  }} fullWidth multiline={multiline || false}></TextField>
			<Button onClick={() => {onChange(editText !== "" ? editText : null); setIsEdit(false);}}>Zapisz</Button>
		</Box>);
}
function ImageEdit({name, onChange,  value}: {name: string, value: string | null, onChange: (s: string | null) => void, multiline?: boolean}) {
	const [isEdit, setIsEdit] = useState(false);
	const handleFileInput = useCallback((e : React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files == null) return;
		const file = e.target.files[0];
		if (file == null) return;
		const reader = new FileReader();
		reader.onload = le => {
			onChange(le.target?.result?.toString() || ""); // set <img src> to file content
			setIsEdit(false);
		};
    reader.readAsDataURL(file);

	}, [onChange])
	if (!isEdit) {
		return (
			<Box>
				<DisplayEdit text={name} onEdit={() => setIsEdit(true)} checked={value != null} />
				{value && (
					<Box mt={1} display="flex" alignItems="center" gap={2}>
						<img src={value} alt="Podgląd logotypu" style={{ maxHeight: 120, borderRadius: 8 }} />
						<Button variant="outlined" size="small" onClick={() => setIsEdit(true)}>Podmień</Button>
					</Box>
				)}
			</Box>
		);
	}
	return (
		<Box>
			<Box display="flex" alignItems="center">
				<Box width="30px" alignItems="center" justifyContent="center">
					{value != null && <GreenCheck/>}
				</Box>
				<Button component="label" fullWidth>
					Wybierz plik
					<input onChange={handleFileInput} type="file" hidden accept="image/*" />
				</Button>
			</Box>
			{value && (
				<Box mt={1}>
					<img src={value} alt="Podgląd logotypu" style={{ maxHeight: 120, borderRadius: 8 }} />
				</Box>
			)}
		</Box>
	);
}

/*function TextBoxEdit({name, value}: {name: string, value: string | null, onChange?: (s: string | null) => void}) {
	const [isEdit, setIsEdit] = useState(false);
	if (!isEdit) {
		return <DisplayEdit text={name + ": " + value} onEdit={() => setIsEdit(true)} />	}
	return <></>
}*/

export default function CompanyInfo() {
	var {checklist, saveCompanyInfo, companyInfoFilledCount} = useChecklist();
	return (
	<ChecklistCard
			icon={<img src={`/assets/checklist-step-1.svg`} alt=""></img>}
			title={<Typography fontSize={16}>Wpis do katalogu targowego ({companyInfoFilledCount}/7)</Typography>}
			checked={companyInfoFilledCount === 7}
		>
		<StringEdit name="Nazwa firmy" value={checklist.companyInfo.name} onChange={(v) => 
			saveCompanyInfo({ ...checklist.companyInfo, name: v})}/>
		<ImageEdit name="Logotyp" value={checklist.companyInfo.logo} onChange={(v) => 
			saveCompanyInfo({ ...checklist.companyInfo, logo: v})}/>
		<StringEdit name="Opis" value={checklist.companyInfo.description} onChange={(v) => 
			saveCompanyInfo({ ...checklist.companyInfo, description: v})} multiline/>
		<StringEdit name="Dane kontaktowe" value={checklist.companyInfo.contactInfo} onChange={(v) => 
			saveCompanyInfo({ ...checklist.companyInfo, contactInfo: v})} multiline/>
		<StringEdit name="Strona www" value={checklist.companyInfo.website} onChange={(v) => 
			saveCompanyInfo({ ...checklist.companyInfo, website: v})}/>
		<StringEdit name="Adres e-mail" value={(checklist.companyInfo as any).contactEmail || null} onChange={(v) => 
			saveCompanyInfo({ ...checklist.companyInfo, contactEmail: v as any})}/>
		<StringEdit name="Social Media" value={checklist.companyInfo.socials} onChange={(v) => 
			saveCompanyInfo({ ...checklist.companyInfo, socials: v})} multiline/>

		{/*<div className={styles.sectionList}>
			{['Nazwa Firmy','Logotyp','Opis','Dane kontaktowe','Strona www.','Social Media'].map((it) => (
				<div key={it} className={styles.sectionRow}><span>{it}</span><div className={styles.sectionGoodDot} /></div>
			))}
		</div>
		<div className={styles.sectionLink}>Podejrzyj wygląd wpisu do katalogu</div>*/}
	</ChecklistCard>)
}