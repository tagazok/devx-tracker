export interface TicketAlias {
  precedence: string;
  id: string;
}

export interface CustomFieldString {
  id: string;
  value: string;
}

export interface CustomFieldDate {
  id: string;
  value: string;
}

export interface Ticket {
  title: string;
  id: string;
  aliases: TicketAlias[];
  labels: string[];
  customFields: {
    string: CustomFieldString[];
    date: CustomFieldDate[];
    boolean: { id: string; value: boolean }[];
    number: { id: string; value: number }[];
  };
  extensions: {
    tt: {
      status: string;
      computedPendingReason?: string;
    };
  };
  assigneeIdentity?: string;
  description: string;
  descriptionContentType: string;
}

export type TabId = "statistics" | "all" | "conferences" | "students" | "community-goals" | "faq";

export interface StatusCounts {
  assigned: number;
  accepted: number;
  resolved: number;
}

export interface LabelStat {
  label: string;
  ticketCount: number;
  totalAttendees: number;
}

export interface OrganizerCrossRow {
  label: string;
  counts: Record<string, number>;
  total: number;
}

export interface StatisticsData {
  statusCounts: StatusCounts;
  labelStats: LabelStat[];
  organizerCross: OrganizerCrossRow[];
  organizerNames: string[];
}
