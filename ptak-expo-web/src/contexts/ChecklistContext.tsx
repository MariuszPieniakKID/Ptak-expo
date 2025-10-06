import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { addElectronicId, addEvent, addMaterial, addMaterialFile, addProduct, Checklist, CompanyInfo, DownloadMaterial, ElectrionicId, EventInfo, getChecklist, ProductInfo, updateCompanyInfo, updateProduct as apiUpdateProduct, deleteMaterialFile as apiDeleteMaterialFile } from "../services/checkListApi";
import { deleteProduct as apiDeleteProduct } from "../services/checkListApi";
import { updateEvent as apiUpdateEvent, deleteEvent as apiDeleteEvent } from "../services/checkListApi";

interface ChecklistContextType {
  checklist: Checklist;
	saveCompanyInfo: (ci: CompanyInfo) => void;
	addProduct: (pi: ProductInfo) => void;
	removeProduct: (index: number) => void;
	addEvent: (ei: EventInfo) => void;
	updateEvent: (index: number, ei: EventInfo) => void;
	removeEvent: (index: number) => void;
	addMaterial: (dm: DownloadMaterial) => void;
	uploadMaterialFile: (file: File) => void;
	removeMaterial: (documentId: number) => void;
	addElectronicId: (ei: ElectrionicId) => void;
	filled: boolean[];
	companyInfoFilledCount: number;
	updateProduct: (index: number, pi: ProductInfo) => void;
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
	useEffect(() => { (window as any).currentSelectedExhibitionId = eventId; }, [eventId]);
	useEffect(() => { getChecklist(eventId).then(setChecklist); }, [eventId]);
	const companyInfoFilledCount = 
		(checklist.companyInfo.contactInfo != null ? 1 : 0) +
		(checklist.companyInfo.description != null ? 1 : 0) +
		(checklist.companyInfo.logo != null ? 1 : 0) +
		(checklist.companyInfo.name != null ? 1 : 0) +
		(checklist.companyInfo.socials != null ? 1 : 0) +
		(checklist.companyInfo.website != null ? 1 : 0);
	const filled = useMemo(() => {
		const ret = [] as boolean[];
		ret.push(companyInfoFilledCount === 6);
		ret.push(checklist.products.length > 0);
		ret.push(checklist.downloadMaterials.length > 0);
		ret.push(checklist.sentInvitesCount > 0);
		ret.push(checklist.events.length > 0);
		ret.push(checklist.electrionicIds.length > 0);
		return ret;
	}, [checklist, companyInfoFilledCount]);
	const value: ChecklistContextType = {
		checklist,
		saveCompanyInfo: (ci: CompanyInfo) => {
			// Optimistic update: reflect changes immediately in UI
			setChecklist(prev => ({ ...prev, companyInfo: { ...(prev.companyInfo as any), ...(ci as any) } }));
			updateCompanyInfo(ci).then(() => getChecklist(eventId)).then(setChecklist);
		},
		addProduct: (ci: ProductInfo) => {
			// Optimistic update: append product so tags show immediately
			const normalized: ProductInfo = { ...ci, tags: Array.isArray(ci.tags) ? ci.tags : [] };
			setChecklist(prev => ({ ...prev, products: [...prev.products, normalized] }));
			addProduct(ci).then(() => getChecklist(eventId)).then(setChecklist);
		},
		removeProduct: (index: number) => {
			setChecklist(prev => {
				const next = [...prev.products];
				if (index >= 0 && index < next.length) next.splice(index, 1);
				return { ...prev, products: next };
			});
			apiDeleteProduct(index).then(() => getChecklist(eventId)).then(setChecklist);
		},
		updateProduct: (index: number, pi: ProductInfo) => {
			const normalized: ProductInfo = { ...pi, tags: Array.isArray(pi.tags) ? pi.tags : [] };
			setChecklist(prev => {
				const next = [...prev.products];
				if (index >= 0 && index < next.length) next[index] = normalized;
				return { ...prev, products: next };
			});
			apiUpdateProduct(index, pi).then(() => getChecklist(eventId)).then(setChecklist);
		},
		addEvent: (ei: EventInfo) => {
			// Optimistic append so nie trzeba odświeżać strony
			setChecklist(prev => ({ ...prev, events: [...prev.events, ei].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)) }));
			addEvent(ei).then(() => getChecklist(eventId)).then(setChecklist);
		},
		updateEvent: (index: number, ei: EventInfo) => {
			setChecklist(prev => {
				const next = [...prev.events];
				if (index >= 0 && index < next.length) next[index] = ei;
				return { ...prev, events: next.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)) };
			});
			const id = (checklist.events[index] as any)?.id;
			if (typeof id === 'number') {
				apiUpdateEvent(id, ei).then(() => getChecklist(eventId)).then(setChecklist);
			} else {
				// fallback: full refresh
				getChecklist(eventId).then(setChecklist);
			}
		},
	removeEvent: (index: number) => {
		const event = checklist.events[index];
		const id = (event as any)?.id;
		console.log('[ChecklistContext] removeEvent called:', { index, event, id, allEvents: checklist.events });
		setChecklist(prev => {
			const next = [...prev.events];
			if (index >= 0 && index < next.length) next.splice(index, 1);
			return { ...prev, events: next };
		});
		if (typeof id === 'number') {
			console.log('[ChecklistContext] Calling apiDeleteEvent with ID:', id);
			apiDeleteEvent(id)
				.then(() => {
					console.log('[ChecklistContext] Delete successful, refreshing checklist');
					return getChecklist(eventId);
				})
				.then(setChecklist)
				.catch(err => {
					console.error('[ChecklistContext] Delete failed:', err);
					getChecklist(eventId).then(setChecklist);
				});
		} else {
			console.warn('[ChecklistContext] Event ID is not a number, doing full refresh:', id);
			getChecklist(eventId).then(setChecklist);
		}
	},
		addMaterial: (ci: DownloadMaterial) => { addMaterial(ci).then(() => getChecklist(eventId)).then(setChecklist);},
		uploadMaterialFile: (file: File) => { addMaterialFile(file, eventId).then(() => getChecklist(eventId)).then(setChecklist);},
		removeMaterial: (documentId: number) => {
			setChecklist(prev => ({ ...prev, downloadMaterials: prev.downloadMaterials.filter(dm => (dm as any).id !== documentId) }));
			apiDeleteMaterialFile(documentId).then(() => getChecklist(eventId)).then(setChecklist);
		},
    addElectronicId: (ci: ElectrionicId) => { addElectronicId(ci, eventId).then(() => getChecklist(eventId)).then(setChecklist);},
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