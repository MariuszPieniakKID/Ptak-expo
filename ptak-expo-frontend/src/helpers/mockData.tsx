import { InvitationStatus } from "../components/exhibitorInvitations/statusOfSentInvitations/StatusOfSentInvitations";

export const mockInvitations: {
  id: number;
  fullName: string;
  email: string;
  status: InvitationStatus;
  reminder?: boolean;
}[] = [
  { id: 1, fullName: "Jan Kowalski", email: "jan.kowalski@example.com", status: "Wysłane" },
  { id: 2, fullName: "Anna Nowak", email: "anna.nowak@example.com", status: "Aktywowane"},
  { id: 3, fullName: "Piotr Wiśniewski", email: "piotr.wisniewski@example.com", status: "Potwierdzone", reminder: true },
  { id: 4, fullName: "Katarzyna Zielińska", email: "katarzyna.zielinska@example.com", status: "Wysłane" },
  { id: 5, fullName: "Michał Wójcik", email: "michal.wojcik@example.com", status: "Potwierdzone", reminder: false },
  { id: 6, fullName: "Agnieszka Kamińska", email: "agnieszka.kaminska@example.com", status: "Aktywowane", reminder: true },
  { id: 7, fullName: "Tomasz Lewandowski", email: "tomasz.lewandowski@example.com", status: "Wysłane" },
  { id: 8, fullName: "Magdalena Szymańska", email: "magda.szymanska@example.com", status: "Wysłane", reminder: true },
  { id: 9, fullName: "Paweł Woźniak", email: "pawel.wozniak@example.com", status: "Aktywowane", reminder: false },
  { id: 10, fullName: "Ewa Kozłowska", email: "ewa.kozlowska@example.com", status: "Potwierdzone", reminder: false },
  { id: 11, fullName: "Marcin Jankowski", email: "marcin.jankowski@example.com", status: "Wysłane"},
  { id: 12, fullName: "Joanna Mazur", email: "joanna.mazur@example.com", status: "Aktywowane", reminder: false },
  { id: 13, fullName: "Grzegorz Krawczyk", email: "grzegorz.krawczyk@example.com", status: "Potwierdzone", reminder: true },
  { id: 14, fullName: "Paulina Piotrowska", email: "paulina.piotrowska@example.com", status: "Wysłane", reminder: false }
];