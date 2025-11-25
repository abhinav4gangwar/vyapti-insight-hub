export interface Investigation {
  id: number;
  slug: string;
  title: string;
  country: string;
  status: string; 
  initiation_date: string | null;
  detail_page_url: string;
  last_seen: string;
  detail_json?: any;
  pdf_links?: Array<{ url: string; scraped_at: string }>;
  timeline?: Array<{ date: string; event: string; pdf_url?: string }>;
}

export type ChangeType = "NEW_INVESTIGATION" | "STATUS_CONCLUDED" | "UPDATED" | "OTHER";

export interface TriggerItem {
  id: number;
  change_type: ChangeType;
  investigation_id: number;
  slug?: string | null;
  detected_at: string;
  investigation?: Investigation;
}

export interface TriggersResponse {
  meta: { page: number; page_size: number; total: number };
  items: TriggerItem[] | null;
}