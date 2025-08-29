import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { addElectronicId, addEvent, addMaterial, addProduct, Checklist, CompanyInfo, DownloadMaterial, ElectrionicId, EventInfo, getChecklist, ProductInfo, updateCompanyInfo } from "../services/checklistApi";

interface ChecklistContextType {
  checklist: Checklist;
	saveCompanyInfo: (ci: CompanyInfo) => void;
	addProduct: (pi: ProductInfo) => void;
	addEvent: (ei: EventInfo) => void;
	addMaterial: (dm: DownloadMaterial) => void;
	addElectronicId: (ei: ElectrionicId) => void;
	filled: boolean[];
	companyInfoFilledCount: number;
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
	const companyInfoFilledCount = 
			(checklist.companyInfo.contactInfo != null ? 1 : 0) +
			(checklist.companyInfo.description != null ? 1 : 0) +
			(checklist.companyInfo.logo != null ? 1 : 0) +
			(checklist.companyInfo.name != null ? 1 : 0) +
			(checklist.companyInfo.socials != null ? 1 : 0) +
			(checklist.companyInfo.website != null ? 1 : 0);
	const filled = useMemo(() => {
		const ret = [];
		ret.push(companyInfoFilledCount === 6);
		ret.push(checklist.products.length > 0);
		ret.push(checklist.sentInvitesCount > 0);
		ret.push(checklist.electrionicIds.length > 0);
		ret.push(checklist.downloadMaterials.length > 0);
		ret.push(checklist.events.length > 0);
		return ret;
	}, [checklist, companyInfoFilledCount]);
	const value = {
		checklist,
		saveCompanyInfo: (ci: CompanyInfo) => { updateCompanyInfo(ci).then(() => getChecklist(eventId)).then(setChecklist);},
		addProduct: (ci: ProductInfo) => { addProduct(ci).then(() => getChecklist(eventId)).then(setChecklist);},
		addEvent: (ci: EventInfo) => { addEvent(ci).then(() => getChecklist(eventId)).then(setChecklist);},
		addMaterial: (ci: DownloadMaterial) => { addMaterial(ci).then(() => getChecklist(eventId)).then(setChecklist);},
		addElectronicId: (ci: ElectrionicId) => { addElectronicId(ci).then(() => getChecklist(eventId)).then(setChecklist);},
		filled,
		companyInfoFilledCount
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