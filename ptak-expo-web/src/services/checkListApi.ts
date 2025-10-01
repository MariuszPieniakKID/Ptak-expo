import config from '../config/config';
import * as QRCode from 'qrcode';
// Do not import from EventUtils to avoid circular deps

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
	industries?: string | null,
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
    accessCode?: string,
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

// Local mapping to avoid circular import with shared/EventUtils
export function getEventKindString(kind: EventKind): string {
    switch (kind) {
        case EventKind.EDUCATION:
            return 'Akademie, panele edukacyjne';
        case EventKind.LIVE:
            return 'Pokazy na żywo';
        case EventKind.WORKSHOP:
            return 'Warsztaty tematyczne';
        case EventKind.PRESENTATION:
            return 'Prezentacje produktów / marek';
        case EventKind.SETUP:
            return 'Montaż stoiska';
        case EventKind.TEARDOWN:
            return 'Demontaż stoiska';
        default:
            return 'Prezentacje produktów / marek';
    }
}
export interface EventInfo {
    id?: number,
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
	sentInvites?: Array<{ id: number; recipientEmail: string; recipientName: string | null; invitationType: string; status: string; sentAt?: string }>,
}
let ExampleChecklist: Checklist = {
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
	sentInvites: [],
	products: []
}

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
							displayName: (d.display_name ?? d.name ?? null) as any,
							description: d.description ?? null,
							whyVisit: (d.why_visit ?? null) as any,
							website: d.website ?? null,
							logo: d.logo ?? null,
							socials: (d.socials ?? null) as any
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
					(ExampleChecklist.companyInfo as any).catalogTags = d.catalog_tags ?? null;
					(ExampleChecklist.companyInfo as any).brands = d.brands ?? null;
					(ExampleChecklist.companyInfo as any).industries = d.industries ?? null;
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
                // helper: map backend type string to EventKind enum
                const toKind = (t: any): EventKind => {
                    const s = String(t || '').toLowerCase();
                    if (s.includes('warsztat')) return EventKind.WORKSHOP;
                    if (s.includes('akadem') || s.includes('eduk')) return EventKind.EDUCATION;
                    if (s.includes('live') || s.includes('pokaz')) return EventKind.LIVE;
                    if (s.includes('monta')) return EventKind.SETUP;
                    if (s.includes('demonta')) return EventKind.TEARDOWN;
                    return EventKind.PRESENTATION;
                };

                ExampleChecklist = {
					...ExampleChecklist,
                    events: list.map((row: any): EventInfo => ({
                        id: row.id,
                        date: (row.eventDate ?? row.event_date ?? ''),
						startTime: row.startTime ?? row.start_time ?? '',
						endTime: row.endTime ?? row.end_time ?? '',
						name: row.name ?? '',
						description: row.description ?? '',
						type: EventType.OPEN,
                        kind: toKind(row.type)
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
            const inferType = (pos: any): EidType => {
                const s = String(pos || '').toLowerCase();
                if (s.includes('tech') || s.includes('technicz') || s.includes('obsług')) return EidType.TECH_WORKER;
                return EidType.GUEST;
            };
            ExampleChecklist = {
                ...ExampleChecklist,
                electrionicIds: list.map((row: any) => ({
                    name: row.full_name,
                    email: row.email,
                    type: inferType((row.position ?? row.person_position) as any),
                    accessCode: row.access_code || row.accessCode || row.qr_code || null,
                }))
            };
			}
		} catch {}

		// invitations – recipients list and counts
		try {
			const r = await fetch(`${config.API_BASE_URL}/api/v1/invitations/${encodeURIComponent(String(exhibitionId))}/recipients`, { headers: { Authorization: `Bearer ${token}` } });
			if (r.ok) {
				const j = await r.json();
				const recipients = Array.isArray(j.data) ? j.data : [];
				ExampleChecklist = {
					...ExampleChecklist,
					sentInvites: recipients.map((row: any) => ({
						id: row.id,
						recipientEmail: row.recipientEmail,
						recipientName: row.recipientName || null,
						invitationType: row.invitationType || 'standard',
						status: row.status || 'wysłane',
						sentAt: row.sentAt
					})),
					sentInvitesCount: recipients.length,
					availableInvitesCount: Math.max(recipients.length, ExampleChecklist.availableInvitesCount || 0)
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
            // map EventKind -> backend type string and encode closed state
            type: (event.type === EventType.CLOSED ? 'Zamknięte - ' : '') + getEventKindString(event.kind)
		};
		if (typeof exhibitorId === 'number') payload.exhibitor_id = exhibitorId;
		const resp = await fetch(`${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
        if (!resp.ok) {
			let msg = 'Nie udało się dodać wydarzenia';
			try { const j = await resp.json(); msg = j?.message || msg; } catch {}
			throw new Error(msg);
		}
        try { const j = await resp.json(); return j?.data; } catch { return null; }
	} catch (e) {
		// Surface error to UI consumer
		throw e;
	}
}

export const updateEvent = async (eventId: number, event: EventInfo) => {
    const exhibitionId = Number((window as any).currentSelectedExhibitionId) || 0;
    const token = localStorage.getItem('authToken') || '';
    const resp = await fetch(`${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}/${encodeURIComponent(String(eventId))}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            name: event.name,
            description: event.description,
            eventDate: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            // encode closed state in type string as prefix
            type: (event.type === EventType.CLOSED ? 'Zamknięte - ' : '') + getEventKindString(event.kind)
        })
    });
    if (!resp.ok) {
        let msg = 'Nie udało się zaktualizować wydarzenia';
        try { const j = await resp.json(); msg = j?.message || msg; } catch {}
        throw new Error(msg);
    }
    return resp.json();
}

export const deleteEvent = async (eventId: number) => {
    const exhibitionId = Number((window as any).currentSelectedExhibitionId) || 0;
    const token = localStorage.getItem('authToken') || '';
    const resp = await fetch(`${config.API_BASE_URL}/api/v1/trade-events/${exhibitionId}/${encodeURIComponent(String(eventId))}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) {
        let msg = 'Nie udało się usunąć wydarzenia';
        try { const j = await resp.json(); msg = j?.message || msg; } catch {}
        throw new Error(msg);
    }
    return resp.json();
}

export const addMaterial = async (material: DownloadMaterial) => {
	ExampleChecklist = {...ExampleChecklist, downloadMaterials: [...ExampleChecklist.downloadMaterials, material].sort(
		(a, b) =>(a.fileName).localeCompare(b.fileName)
)};
}
export const addElectronicId = async (electronicId: ElectrionicId, exhibitionIdFromArg?: number) => {
    const exhibitionId = typeof exhibitionIdFromArg === 'number' && exhibitionIdFromArg > 0
        ? exhibitionIdFromArg
        : (Number((window as any).currentSelectedExhibitionId) || 0);
	const token = localStorage.getItem('authToken') || '';
	try {
        // Fetch exhibitor and exhibition to build access code
        let exhibitorId: number | null = null;
        let exhibitionName: string = '';
        try {
            const meRes = await fetch(`${config.API_BASE_URL}/api/v1/exhibitors/me`, { headers: { Authorization: `Bearer ${token}` } });
            const meJson = await meRes.json();
            exhibitorId = meJson?.data?.id ?? null;
        } catch {}
        try {
            const exRes = await fetch(`${config.API_BASE_URL}/api/v1/exhibitions/${encodeURIComponent(String(exhibitionId))}`, { headers: { Authorization: `Bearer ${token}` } });
            if (exRes.ok) {
                const exJson = await exRes.json();
                exhibitionName = exJson?.name || exJson?.data?.name || '';
            }
        } catch {}

        // Build event code (FULL exhibition name), 0000 event id (padded), w000 exhibitor id (padded), entry_id (unique), rndXXXX, entry_id again
        const eventCode = String(exhibitionName || '').replace(/\s+/g, ' ').trim();
        const eventIdPadded = String(exhibitionId).padStart(4, '0');
        const exhibitorIdPadded = 'w' + String(typeof exhibitorId === 'number' ? exhibitorId : 0).padStart(3, '0');
        const entryId = (() => {
            const ts = Date.now().toString().slice(-6);
            const rnd = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
            return ts.slice(0,3) + rnd.slice(0,3) + ts.slice(3);
        })();
        const rndSuffix = 'rnd' + Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
        const accessCode = `${eventCode}${eventIdPadded}${exhibitorIdPadded}${entryId}${rndSuffix}${entryId}`;

        // Generate QR as Data URL
        let qrDataUrl: string | null = null;
        try {
            qrDataUrl = await QRCode.toDataURL(accessCode, { margin: 0, scale: 6 });
        } catch {}

        // Map type to readable label for admin DB (avoid numeric "0")
        const typeLabel = ((): string => {
            try {
                return electronicId.type === EidType.TECH_WORKER ? 'Pracownik techniczny' : 'Gość';
            } catch { return 'Gość'; }
        })();

        await fetch(`${config.API_BASE_URL}/api/v1/exhibitors/me/people`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                fullName: electronicId.name,
                position: typeLabel,
                email: electronicId.email,
                exhibitionId,
                accessCode,
                qrPngDataUrl: qrDataUrl || undefined,
            })
        });
        // Also upload QR image to exhibitor documents so it can be downloaded later
        if (qrDataUrl) {
            try {
                const resMe = await fetch(`${config.API_BASE_URL}/api/v1/exhibitors/me`, { headers: { Authorization: `Bearer ${token}` } });
                const me = await resMe.json();
                const exbId: number | null = me?.data?.id ?? null;
                if (typeof exbId === 'number') {
                    const blob = (await (await fetch(qrDataUrl)).blob());
                    const clean = (s: string) => s.replace(/[^a-zA-Z0-9._-]+/g, '-');
                    const entrySuffix = entryId.slice(-6);
                    const fileName = `e-id-qr-${clean(String(exhibitionName || 'event'))}-${String(exhibitionId).padStart(4, '0')}-${clean(electronicId.email)}-${entrySuffix}.png`;
                    const file = new File([blob], fileName, { type: 'image/png' });
                    await addMaterialFile(file, exhibitionId);
                }
            } catch {}
        }
        // Optimistic local store with accessCode
        ExampleChecklist = {...ExampleChecklist, electrionicIds: [...ExampleChecklist.electrionicIds, { ...electronicId, accessCode }].sort(
            (a, b) =>(a.type.toString() + a.name).localeCompare(b.type.toString() + b.name)
        )};
	} catch {}
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