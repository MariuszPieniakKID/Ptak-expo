export type _EventStatus =
  | 'Montaż stoiska'
  | 'Demontaż stoiska'
  | 'Dostawa i montaż sprzętu/materiałów' 
  | 'Prezentacja produktów i marek'
  | 'Edukacyjne i eksperckie' ;

export type _AddedEvent = 
  | { 
      // wariant z podanym addedToOfficialCatalog 
      id?: number;
      exhibition_id?: number;
      name: string;
      eventDate: string;  // ISO date
      startTime: string;  // HH:mm
      endTime: string;    // HH:mm
      eventType: _EventStatus;
      eventTitle: string;
      description?: string;
      organizer: string;
      addedToOfficialCatalog: boolean;
      //isDelete?: boolean;
      //isEdited?: boolean;
    }
  | { 
      // wariant bez addedToOfficialCatalog, ale z obowiązkowym isDelete i isEdited
      id?: number;
      exhibition_id?: number;
      name: string;
      eventDate: string;  
      startTime: string;  
      endTime: string;    
      eventType: _EventStatus;
      eventTitle: string;
      description?: string;
      organizer: string;
      //addedToOfficialCatalog: undefined; // wyraźne odrzucenie tej właściwości
      isDelete: boolean;
      isEdited: boolean;
    };
  export interface _TradeAwardsFair {
  id: number;
  message: string;
}
export type _BrandingImg ={

}
