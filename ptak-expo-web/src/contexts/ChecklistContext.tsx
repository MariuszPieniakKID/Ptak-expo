import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Checklist, CompanyInfo, getChecklist, updateCompanyInfo } from "../services/checklistApi";

interface ChecklistContextType {
  checklist: Checklist;
	saveCompanyInfo: (ci: CompanyInfo) => void
}
const ChecklistContext = createContext<ChecklistContextType | null>(null);

const emptyChecklist: Checklist = {
	companyInfo: {
		contactInfo: null,
		description: null,
		logo: null,
		name: null,
		socials: null,
		website: null
	},
	availableInvitesCount: 0,
	sentInvitesCount: 0,
	downloadMaterials: [],
	events: [],
	electrionicIds: [],
	products: []
}

export const ChecklistProvider = ({ children, eventId }: {children: ReactNode, eventId: number}) => {
	const [checklist, setChecklist] = useState<Checklist>(emptyChecklist);
	useEffect(() => { getChecklist(eventId).then(setChecklist); }, [eventId]);
	const value = {
		checklist,
		saveCompanyInfo: (ci: CompanyInfo) => { updateCompanyInfo(ci).then(() => getChecklist(eventId)).then(setChecklist);}
	}
	return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>
}

export const useChecklist = () => {
  const context = useContext(ChecklistContext);
  if (!context) {
    throw new Error('useChecklist must be used within an ChecklistProvider');
  }
  return context;
};