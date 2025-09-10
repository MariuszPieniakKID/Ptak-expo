import config from '../config/config';

export interface CompanyInfo {
	name: string | null,
	logo: string | null, //Upload and download support
	description: string | null,
	whyVisit?: string | null,
	contactInfo: string | null,
	website: string | null,
	socials: string | null,
	contactEmail?: string | null,
	brands?: string | null,
	displayName?: string | null
}
export interface ProductInfo {
	name: string,
	img: string,
	description: string,
	tags?: string[]
}
export interface DownloadMaterial {
	fileName: string,
	fileUri: string
}
export interface ElectrionicId {
	name: string,
	type: EidType,
	email: string,
}
export enum EidType {
	TECH_WORKER,
	GUEST
}

export enum EventType {
	OPEN,
	CLOSED
}
export enum EventKind {
	SETUP,
	TEARDOWN,
	PRESENTATION,
	LIVE,
	WORKSHOP,
	EDUCATION
}
export interface EventInfo {
	date: string,
	startTime: string,
	endTime: string,
	name: string,
	description: string,
	type: EventType,
	kind: EventKind
}


export interface Checklist {
	companyInfo: CompanyInfo
	products: ProductInfo[],
	downloadMaterials: DownloadMaterial[],
	sentInvitesCount: number,
	availableInvitesCount: number,
	events: EventInfo[],
	electrionicIds: ElectrionicId[],
}
let ExampleChecklist: Checklist = {
	companyInfo: {
		contactInfo: "tel: 22 111 22 33\nfax: 22 111 22 34",
		description: null,
		logo: "/assets/logo192.png",
		name: "Testowa firma",
		socials: "fb.com/testowa_firma",
		website: "test.example.com"
	},
	availableInvitesCount: 50,
	sentInvitesCount: 50,
	downloadMaterials: [],
	events: [],
	electrionicIds: [],
	products: [{
		img: "data:image/png;base64,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",
		description: "Przedstawiamy Państwu ofertę na zakup nowoczesnego domu 35m2 ",
		name: "MTB ONE"
	},
]}

export const getChecklist = async (exhibitionId: number) => {
	try {
		const token = localStorage.getItem('authToken') || '';
		let exhibitor: any = null;
		try {
			const res = await fetch(`${config.API_BASE_URL}/api/v1/exhibitors/me`, { headers: { Authorization: `Bearer ${token}` } });
			if (res.ok) {
				const j = await res.json();
				if (j.success && j.data) exhibitor = j.data;
			}
		} catch {}

		// company
		ExampleChecklist = {
			...ExampleChecklist,
			companyInfo: {
				...ExampleChecklist.companyInfo,
				name: exhibitor?.companyName ?? ExampleChecklist.companyInfo.name
			}
		};

		// catalog
		try {
			const r = await fetch(`${config.API_BASE_URL}/api/v1/catalog/${exhibitionId}`, { headers: { Authorization: `Bearer ${token}` } });
			if (r.ok) {
				const j = await r.json();
				const d = j?.data;
				if (d) {
					ExampleChecklist = {
						...ExampleChecklist,
						companyInfo: {
							...ExampleChecklist.companyInfo,
							name: d.name ?? ExampleChecklist.companyInfo.name,
							displayName: (d.display_name ?? (ExampleChecklist.companyInfo as any).displayName ?? d.name ?? null) as any,
							description: d.description ?? ExampleChecklist.companyInfo.description,
							whyVisit: (d.why_visit ?? (ExampleChecklist.companyInfo as any).whyVisit ?? null) as any,
							website: d.website ?? ExampleChecklist.companyInfo.website,
							logo: d.logo ?? ExampleChecklist.companyInfo.logo,
							socials: (d.socials ?? ExampleChecklist.companyInfo.socials) as any
						},
						products: Array.isArray(d.products) ? d.products
							.map((p: any) => {
								const raw = p?.tags;
								const tagsArr = Array.isArray(raw)
									? raw
									: (typeof raw === 'string' ? raw.split(',').map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(p?.tabList) ? p.tabList : []));
								return { ...p, tags: tagsArr } as ProductInfo;
							})
							.sort((a: ProductInfo, b: ProductInfo) => a.name.localeCompare(b.name))
							: []
					};
					(ExampleChecklist.companyInfo as any).catalogTags = d.catalog_tags ?? (ExampleChecklist.companyInfo as any).catalogTags ?? null;
					(ExampleChecklist.companyInfo as any).brands = d.brands ?? (ExampleChecklist.companyInfo as any).brands ?? null;
				}
			}
		} catch {}

		// also set email from exhibitor profile
		(ExampleChecklist.companyInfo as any).contactEmail = exhibitor?.email ?? (ExampleChecklist.companyInfo as any).contactEmail ?? null;

		// events
		try {
			const url = exhibitor?.id ? `${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}?exhibitorId=${encodeURIComponent(String(exhibitor.id))}` : `${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}`;
			const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
			if (r.ok) {
				const j = await r.json();
				const list = Array.isArray(j.data) ? j.data : [];
				ExampleChecklist = {
					...ExampleChecklist,
					events: list.map((row: any): EventInfo => ({
						date: row.eventDate ?? row.event_date ?? '',
						startTime: row.startTime ?? row.start_time ?? '',
						endTime: row.endTime ?? row.end_time ?? '',
						name: row.name ?? '',
						description: row.description ?? '',
						type: EventType.OPEN,
						kind: EventKind.PRESENTATION
					})).sort((a: EventInfo, b: EventInfo) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
				};
			}
		} catch {}

		// materials
		try {
			if (exhibitor?.id) {
				const r = await fetch(`${config.API_BASE_URL}/api/v1/exhibitor-documents/${encodeURIComponent(String(exhibitor.id))}/${encodeURIComponent(String(exhibitionId))}`, { headers: { Authorization: `Bearer ${token}` } });
				if (r.ok) {
					const j = await r.json();
					const docs = Array.isArray(j.documents) ? j.documents : [];
					ExampleChecklist = {
						...ExampleChecklist,
						downloadMaterials: docs.map((row: any) => ({
							fileName: row.original_name || row.title || row.file_name,
							fileUri: `${config.API_BASE_URL}/api/v1/exhibitor-documents/${encodeURIComponent(String(exhibitor.id))}/${encodeURIComponent(String(exhibitionId))}/download/${encodeURIComponent(String(row.id))}?token=${encodeURIComponent(token)}`
						})).sort((a: DownloadMaterial, b: DownloadMaterial) => a.fileName.localeCompare(b.fileName))
					};
				}
			}
		} catch {}

		// people (e-identyfikatory)
		try {
			const r = await fetch(`${config.API_BASE_URL}/api/v1/exhibitors/me/people?exhibitionId=${encodeURIComponent(String(exhibitionId))}`, { headers: { Authorization: `Bearer ${token}` } });
			if (r.ok) {
				const j = await r.json();
				const list = Array.isArray(j.data) ? j.data : [];
				ExampleChecklist = {
					...ExampleChecklist,
					electrionicIds: list.map((row: any) => ({ name: row.full_name, email: row.email, type: EidType.TECH_WORKER }))
				};
			}
		} catch {}

		return ExampleChecklist;
	} catch {
		return ExampleChecklist;
	}
}

export const updateCompanyInfo = async (companyInfo: CompanyInfo) => {
	const token = localStorage.getItem('authToken') || '';
	const exhibitionId = Number((window as any).currentSelectedExhibitionId) || 0;
	const body: any = {};
	if (companyInfo.name !== undefined) body.companyName = companyInfo.name;
	const emailToUpdate = (companyInfo as any).contactEmail;
	if (emailToUpdate !== undefined) body.email = emailToUpdate;
	try {
		await fetch(`${config.API_BASE_URL}/api/v1/exhibitors/me`, {
			method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body)
		});
	} catch {}
	try {
		await fetch(`${config.API_BASE_URL}/api/v1/catalog/${exhibitionId}`, {
			method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({
				name: companyInfo.name ?? null,
				displayName: (companyInfo as any).displayName ?? null,
				logo: companyInfo.logo ?? null,
				description: companyInfo.description ?? null,
				whyVisit: (companyInfo as any).whyVisit ?? null,
				contactInfo: companyInfo.contactInfo ?? null,
				website: companyInfo.website ?? null,
				socials: companyInfo.socials ?? null,
				contactEmail: emailToUpdate ?? null,
				catalogTags: Array.isArray((companyInfo as any).catalogTags)
					? ((companyInfo as any).catalogTags as string[]).map(s => String(s).trim()).filter(Boolean).join(',')
					: (((companyInfo as any).catalogTags ?? null) as any),
				brands: Array.isArray((companyInfo as any).brands)
					? ((companyInfo as any).brands as string[]).map(s => String(s).trim()).filter(Boolean).join(',')
					: (((companyInfo as any).brands ?? null) as any)
			})
		});
	} catch {}
	ExampleChecklist = {...ExampleChecklist, companyInfo};
}
export const addProduct = async (productInfo: ProductInfo) => {
	const exhibitionId = Number((window as any).currentSelectedExhibitionId) || 0;
	const token = localStorage.getItem('authToken') || '';
	try {
		await fetch(`${config.API_BASE_URL}/api/v1/catalog/${exhibitionId}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({
			name: productInfo.name,
			img: productInfo.img,
			description: productInfo.description,
			tags: Array.isArray(productInfo.tags) ? productInfo.tags : []
		}) });
	} catch {}
	// Immediate optimistic update so the list shows tags without waiting for refetch
	const existing = Array.isArray(ExampleChecklist.products) ? ExampleChecklist.products : [];
	const next = [...existing, { ...productInfo, tags: Array.isArray(productInfo.tags) ? productInfo.tags : [] }].sort((a, b) => a.name.localeCompare(b.name));
	ExampleChecklist = { ...ExampleChecklist, products: next };
}

export const updateProduct = async (index: number, productInfo: ProductInfo) => {
	const exhibitionId = Number((window as any).currentSelectedExhibitionId) || 0;
	const token = localStorage.getItem('authToken') || '';
	await fetch(`${config.API_BASE_URL}/api/v1/catalog/${exhibitionId}/products/${encodeURIComponent(String(index))}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify({
			name: productInfo.name,
			img: productInfo.img,
			description: productInfo.description,
			tags: Array.isArray(productInfo.tags) ? productInfo.tags : [],
		})
	});
};

export const deleteProduct = async (index: number) => {
  const exhibitionId = Number((window as any).currentSelectedExhibitionId) || 0;
  const token = localStorage.getItem('authToken') || '';
  await fetch(`${config.API_BASE_URL}/api/v1/catalog/${exhibitionId}/products/${encodeURIComponent(String(index))}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
};
export const addEvent = async (event: EventInfo) => {
	const exhibitionId = Number((window as any).currentSelectedExhibitionId) || 0;
	const token = localStorage.getItem('authToken') || '';
	try {
		const meRes = await fetch(`${config.API_BASE_URL}/api/v1/exhibitors/me`, { headers: { Authorization: `Bearer ${token}` } });
		const meJson = await meRes.json();
		const exhibitorId: number | null = meJson?.data?.id ?? null;
		const payload: any = {
			name: event.name,
			description: event.description,
			eventDate: event.date,
			startTime: event.startTime,
			endTime: event.endTime,
			type: 'Prezentacja'
		};
		if (typeof exhibitorId === 'number') payload.exhibitor_id = exhibitorId;
		await fetch(`${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
	} catch {}
}

export const addMaterial = async (material: DownloadMaterial) => {
	ExampleChecklist = {...ExampleChecklist, downloadMaterials: [...ExampleChecklist.downloadMaterials, material].sort(
		(a, b) =>(a.fileName).localeCompare(b.fileName)
)};
}
export const addElectronicId = async (electronicId: ElectrionicId) => {
	const exhibitionId = Number((window as any).currentSelectedExhibitionId) || 0;
	const token = localStorage.getItem('authToken') || '';
	try {
		await fetch(`${config.API_BASE_URL}/api/v1/exhibitors/me/people`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ fullName: electronicId.name, position: String(electronicId.type), email: electronicId.email, exhibitionId }) });
	} catch {}
	ExampleChecklist = {...ExampleChecklist, electrionicIds: [...ExampleChecklist.electrionicIds, electronicId].sort(
		(a, b) =>(a.type.toString() + a.name).localeCompare(b.type.toString() + b.name)
	)};
}

export const addMaterialFile = async (file: File, _eventId: number) => {
	const token = localStorage.getItem('authToken') || '';
	try {
		const meRes = await fetch(`${config.API_BASE_URL}/api/v1/exhibitors/me`, { headers: { Authorization: `Bearer ${token}` } });
		const meJson = await meRes.json();
		const exhibitorId: number | null = meJson?.data?.id ?? null;
		if (typeof exhibitorId !== 'number') return;
		const exhibitionId = Number((window as any).currentSelectedExhibitionId) || 0;
		const formData = new FormData();
		formData.append('document', file);
		formData.append('title', file.name);
		formData.append('category', 'inne_dokumenty');
		const url = `${config.API_BASE_URL}/api/v1/exhibitor-documents/${encodeURIComponent(String(exhibitorId))}/${encodeURIComponent(String(exhibitionId))}/upload`;
		await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData, credentials: 'include' });
	} catch {}
}