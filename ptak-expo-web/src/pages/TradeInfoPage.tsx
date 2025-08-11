import React from 'react';
import './tradeInfoFigma.css';

type Props = {
  tradeInfo: {
    tradeHours: { exhibitorStart: string; exhibitorEnd: string; visitorStart: string; visitorEnd: string };
    contactInfo: { guestService: string; security: string };
    buildDays: Array<{ id: string; date: string; startTime: string; endTime: string }>;
    buildType: string;
    tradeSpaces: Array<{ id: string; name: string; hallName: string; filePath?: string | null; originalFilename?: string | null }>;
    tradeMessage: string;
  } | null;
  eventName?: string;
  eventDateRange?: string;
  daysUntilEvent?: number;
  onDownloadPlan: (spaceId: string, filename: string) => void;
};

const TradeInfoPage: React.FC<Props> = ({ tradeInfo, onDownloadPlan, eventName, eventDateRange, daysUntilEvent }) => {
  const exhibStart = tradeInfo?.tradeHours.exhibitorStart || '-';
  const exhibEnd = tradeInfo?.tradeHours.exhibitorEnd || '-';
  const visitStart = tradeInfo?.tradeHours.visitorStart || '-';
  const visitEnd = tradeInfo?.tradeHours.visitorEnd || '-';
  const guest = tradeInfo?.contactInfo.guestService || '-';
  const security = tradeInfo?.contactInfo.security || '-';
  // const buildType = tradeInfo?.buildType || '-';

  return (
    <div className="web-informacje-8">
      <div className="web-informacje-8-child" />
      <div className="informacje-targowe">Informacje targowe</div>
      <div className="web-informacje-8-item" />
      <div className="web-informacje-8-inner" />
      <div className="rectangle-div" />
      <img className="path-10-icon" alt="" src="/assets/path-10.svg" />

      <div className="gratulacje-mamy-wszystko-container">
        <p className="gratulacje-mamy-wszystko">Gratulacje, mamy wszystko!</p>
        <p className="wasza-gotowo-do">Wasza gotowość do targów:</p>
      </div>
      <div className="id-do-checklisty">Idź do checklisty</div>
      <div className="uzupenij-wszystkie-kroki">Uzupełnij wszystkie kroki z checklisty by być jak najlepiej przygotowanym na to wydarzenie.</div>
      <img className="group-icon" alt="" src="/assets/group-5491.svg" />
      <div className="web-informacje-8-child1" />
      <div className="do-wydarzenia-zostalo-container"><span>Do wydarzenia zostało</span><span className="dni"> {typeof daysUntilEvent === 'number' ? `${daysUntilEvent} dni` : '—'}</span></div>
      <div className="rectangle-parent">
        <div className="group-child" />
        <div className="div">100%</div>
      </div>

      <div className="web-informacje-8-child7" />
      <div className="web-informacje-8-child8" />
      <img className="f4ed2e86e01309533e2483db0fd4-icon1" alt="" src="/assets/4515f4ed2e86e01309533e2483db0fd4@2x.png" />
      <div className="warsaw-industry-weej1">{eventName || ''}</div>
      <div className="div2">{eventDateRange || ''}</div>
      <div className="twoje-stoisko-targowe-container"><span>Twoje Stoisko</span><br /><span>targowe:</span></div>
      <div className="hala-f">{tradeInfo?.tradeSpaces?.[0]?.name || tradeInfo?.tradeSpaces?.[0]?.hallName || ''}</div>

      <div className="kontakt-podczas-targw">Kontakt podczas targów:</div>
      <div className="obsuga-goci">Obsługa Gości</div>
      <div className="div3">{guest}</div>
      <div className="ochrona">Ochrona</div>
      <div className="div4">{security}</div>

      <div className="godziny-otwarcia-targw">Godziny otwarcia targów:</div>
      <div className="dla-wystawcw">Dla wystawców</div>
      <div className="div9">{exhibStart} - {exhibEnd}</div>
      <div className="dla-goci">Dla gości</div>
      <div className="div10">{visitStart} - {visitEnd}</div>

      <div className="web-informacje-8-child12" />
      <div className="plan-targw">Plan Targów:</div>

      {/* Halls grid from API: map first 4 to the designed boxes */}
      {tradeInfo?.tradeSpaces?.map((h, idx) => {
        const common = (
          <>
            <div className="group-child1" />
            <div className={h.hallName?.toLowerCase().includes('e') || h.hallName?.toLowerCase().includes('f') ? 'hala-e-f' : (h.hallName?.toLowerCase().includes('d') ? 'hala-d' : (h.hallName?.toLowerCase().includes('c') ? 'hala-c' : 'hala-b'))}>
              {h.hallName || h.name || 'Hala'}
            </div>
          </>
        );
        if (idx === 0) {
          return (
            <div key={h.id} className="rectangle-group">
              {common}
              {h.originalFilename && (
                <div className="group-child5" onClick={() => onDownloadPlan(h.id, h.originalFilename!)} style={{cursor:'pointer'}} />
              )}
            </div>
          );
        }
        if (idx === 1) {
          return (
            <div key={h.id} className="rectangle-container">
              {common}
            </div>
          );
        }
        if (idx === 2) {
          return (
            <div key={h.id} className="group-div">
              <div className="group-child3" />
              <div className="hala-d">{h.hallName || h.name || 'Hala'}</div>
            </div>
          );
        }
        if (idx === 3) {
          return (
            <div key={h.id} className="rectangle-parent1">
              <div className="group-child4" />
              <div className="group-child5" onClick={() => h.originalFilename && onDownloadPlan(h.id, h.originalFilename!)} style={{cursor:'pointer'}} />
              <div className="hala-e-f">{h.hallName || h.name || 'Hala'}</div>
              {h.originalFilename && (
                <div className="twoje-stoisko-container">Pobierz – {h.originalFilename}</div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default TradeInfoPage;

