import { EidType, EventKind, EventType } from "../services/checkListApi";

export function getEventKindString(kind: EventKind): string 
{
	switch(kind) {
		case EventKind.EDUCATION:
			return "Akademie, panele edukacyjne";
		case EventKind.LIVE:
			return "Pokazy na żywo";
		case EventKind.WORKSHOP:
			return "Warsztaty tematyczne";
		case EventKind.PRESENTATION:
			return "Prezentacje produktów / marek"
		case EventKind.SETUP:
			return "Montaż stoiska"
		case EventKind.TEARDOWN:
			return "Demontaż stoiska"
	}
}
export function getEventTypeString(type: EventType) 
{
	switch(type) {
		case EventType.OPEN:
			return "Otwarte";
		case EventType.CLOSED:
			return "Zamknięte";
	}
}
export function getEidTypeString(type: EidType) 
{
	switch(type) {
		case EidType.TECH_WORKER:
			return "Obsługa techniczna";
		case EidType.GUEST:
			return "Gość";
	}
}
export const eidTypes = [EidType.TECH_WORKER, EidType.GUEST]

export const eventTypes = [EventType.OPEN, EventType.CLOSED]
export const eventKinds = [
	EventKind.PRESENTATION,
	EventKind.LIVE,
	EventKind.WORKSHOP,
	EventKind.EDUCATION,
	EventKind.SETUP,
	EventKind.TEARDOWN
];