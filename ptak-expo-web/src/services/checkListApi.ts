export interface CompanyInfo {
	name: string | null,
	logo: string | null, //Upload and download support
	description: string | null,
	contactInfo: string | null,
	website: string | null,
	socials: string | null
}
export interface ProductInfo {
	name: string,
	img: string | null,
	description: string
}
export interface DownloadMaterial {
	fileName: string,
	fileUri: string
}
export interface ElectrionicId {
	name: string,
	type: string
	email: string,
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
	EDUCATION,
	CLOSED
}
export interface Event {
	date: string,
	startTime: string,
	endTime: string,
	name: string,
	description: string,
	type: EventType,
	kind: EventKind
}


export interface CheckList {
	companyInfo: CompanyInfo
	products: ProductInfo[],
	downloadMaterials: DownloadMaterial[],
	sentInvitesCount: number,
	availableInvitesCount: number,
	events: Event[],
	electrionicIds: ElectrionicId[],
}
const ExampleCheckList: CheckList = {
	companyInfo: {
		contactInfo: "tel: 22 111 22 33\nfax: 22 111 22 34",
		description: "Opis",
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
	products: []
}

export const getChecklist = async (_: number) => ExampleCheckList;
export const updateCompanyInfo = async (companyInfo: CompanyInfo) => {
	ExampleCheckList.companyInfo = companyInfo;
}