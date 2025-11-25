export interface Investigation {
  id: number;
  slug: string;
  title: string;
  country: string;
  status: "Ongoing" | "Concluded";
  initiation_date: string | null;
  detail_page_url: string;
  last_seen: string;
  detail_json?: any;
}

export type ChangeType = "NEW_INVESTIGATION" | "STATUS_CONCLUDED" | "UPDATED" | "OTHER";

export interface Trigger {
  id: number;
  change_type: ChangeType;
  investigation_id: number;
  dgtr_slug?: string | null;
  detected_at: string;
  investigation: Investigation;
}