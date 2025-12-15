import { useState, useEffect } from 'react';
import { getChecklist } from '../services/checkListApi';

export const useEventReadiness = (eventId: number | null) => {
  const [readiness, setReadiness] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setReadiness(0);
      return;
    }

    let mounted = true;
    setLoading(true);

    const loadReadiness = async () => {
      try {
        const checklist = await getChecklist(eventId);
        
        // Calculate filled steps
        const catalogContactPerson = (checklist.companyInfo as any).catalogContactPerson;
        const catalogContactPhone = (checklist.companyInfo as any).catalogContactPhone;
        const catalogContactEmail = (checklist.companyInfo as any).catalogContactEmail;
        let catalogContactFilled = 0;
        if (catalogContactPerson && catalogContactPhone && catalogContactEmail) {
          catalogContactFilled = 1;
        }
        
        const companyInfoFilledCount = catalogContactFilled +
          (checklist.companyInfo.description != null ? 1 : 0) +
          (checklist.companyInfo.logo != null ? 1 : 0) +
          (checklist.companyInfo.name != null ? 1 : 0) +
          (checklist.companyInfo.socials != null ? 1 : 0) +
          (checklist.companyInfo.website != null ? 1 : 0);

        const filled = [
          companyInfoFilledCount === 6,
          checklist.products.length > 0,
          checklist.downloadMaterials.length > 0,
          checklist.sentInvitesCount > 0,
          checklist.events.length > 0,
          checklist.electrionicIds.length > 0
        ];

        const percent = Math.round((filled.filter(Boolean).length / filled.length) * 100);
        
        if (mounted) {
          setReadiness(percent);
        }
      } catch (error) {
        console.error('Error loading readiness:', error);
        if (mounted) {
          setReadiness(0);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReadiness();

    return () => {
      mounted = false;
    };
  }, [eventId]);

  return { readiness, loading };
};

