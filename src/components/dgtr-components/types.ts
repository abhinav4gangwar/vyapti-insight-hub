export interface Investigation {
  uuid: string;
  title: string;
  country: string;
  status: string; // "Ongoing" or "Concluded"
  url: string;
  file_no: string | null;
  product: string | null;
  created_at: string;
  updated_at: string;
  pdf_links?: PDFLink[];
}

export interface PDFLink {
  id: number;
  investigation_uuid: string;
  url: string;
  title: string | null;
  publish_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestigationDetail extends Investigation {
  pdf_links: PDFLink[];
}