// Import only types that don't create circular runtime dependency
import { EidType, EventType } from "../services/checkListApi";
// Duplicate enum to avoid runtime circular import (TS will erase at compile time)
export enum EventKindLocal {
    SETUP,
    TEARDOWN,
    PRESENTATION,
    LIVE,
    WORKSHOP,
    EDUCATION
}

export function getEventKindString(kind: any): string 
{
	switch(kind) {
        case EventKindLocal.EDUCATION:
			return "Akademie, panele edukacyjne";
        case EventKindLocal.LIVE:
			return "Pokazy na żywo";
        case EventKindLocal.WORKSHOP:
			return "Warsztaty tematyczne";
        case EventKindLocal.PRESENTATION:
			return "Prezentacje produktów / marek"
        case EventKindLocal.SETUP:
			return "Montaż stoiska"
        case EventKindLocal.TEARDOWN:
			return "Demontaż stoiska"
        default:
            return "Prezentacje produktów / marek";
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
    EventKindLocal.PRESENTATION,
    EventKindLocal.LIVE,
    EventKindLocal.WORKSHOP,
    EventKindLocal.EDUCATION,
    EventKindLocal.SETUP,
    EventKindLocal.TEARDOWN
];