import { authService } from './auth';
import type { PromptTriggerDetail } from '@/types/prompt-triggers';

/**
 * Fetch detailed information for any document (earnings call, investor PPT, SEBI doc)
 * This replaces the old getPromptTriggerDetail function for the /documents/:id route
 */
export async function getDocumentDetail(
  documentType: string,
  documentId: number
): Promise<PromptTriggerDetail> {
  const client = authService.createAuthenticatedClient();
  const response = await client.get(`/data-catalogue/${documentType}/${documentId}`);

  // Transform the response to match the PromptTriggerDetail interface
  // The backend returns document_date and document_url, but frontend expects earning_call_date and earning_call_url
  const data = response.data;

  // Flatten the buckets structure into a flat triggers array
  // Backend returns: { buckets: [{ questions: [...] }] }
  // Frontend expects: { triggers: [...] }
  let triggers = [];
  if (data.triggers) {
    // If triggers already exists as flat array, use it
    triggers = data.triggers;
  } else if (data.buckets) {
    // If data comes in buckets structure, flatten it
    triggers = data.buckets.flatMap((bucket: any) =>
      bucket.questions ? bucket.questions : []
    );
  }

  return {
    id: data.id,
    company_name: data.company_name,
    company_isin: data.company_isin,
    document_type: data.document_type,
    earning_call_date: data.document_date, // Map document_date to earning_call_date
    earning_call_url: data.document_url,   // Map document_url to earning_call_url
    text_length: data.text_length,
    created_at: data.created_at,
    total_triggers: data.total_triggers || 0,
    bucket_counts: data.bucket_counts || {},
    triggers: triggers,
  };
}

/**
 * Helper function to generate the document details URL
 * Used across the app for consistent URL generation
 */
export function getDocumentUrl(documentType: string, documentId: number): string {
  return `/documents/${documentType}/${documentId}`;
}

/**
 * Opens a PDF URL with BSE AttachLive/AttachHis fallback logic.
 * First checks if the URL is accessible via HEAD request.
 * If it fails and contains AttachLive, tries the AttachHis variant (and vice versa).
 *
 * @param url - The PDF URL to open
 */
export async function openPdfWithFallback(url: string): Promise<void> {
  if (!url) return;

  try {
    // First, try the original URL with a HEAD request to check if it's accessible
    const response = await fetch(url, { method: 'HEAD' });

    if (response.ok) {
      // If the original URL works, open it
      window.open(url, '_blank');
    } else {
      // If it doesn't work, try swapping AttachLive <-> AttachHis
      const fallbackUrl = getBseFallbackUrl(url);
      if (fallbackUrl) {
        console.log(`Original URL failed (${response.status}), trying fallback:`, fallbackUrl);
        window.open(fallbackUrl, '_blank');
      } else {
        // No fallback available, just open the original URL
        window.open(url, '_blank');
      }
    }
  } catch (error) {
    // If there's a network error (e.g., CORS), try the fallback
    const fallbackUrl = getBseFallbackUrl(url);
    if (fallbackUrl) {
      console.log('Network error, trying fallback:', fallbackUrl);
      window.open(fallbackUrl, '_blank');
    } else {
      // Otherwise just open the original URL
      window.open(url, '_blank');
    }
  }
}

/**
 * Gets the BSE fallback URL by swapping AttachLive <-> AttachHis
 * Returns null if the URL doesn't contain either pattern
 */
function getBseFallbackUrl(url: string): string | null {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('attachlive')) {
    return url.replace(/AttachLive/gi, 'AttachHis');
  } else if (lowerUrl.includes('attachhis')) {
    return url.replace(/AttachHis/gi, 'AttachLive');
  }

  return null;
}
