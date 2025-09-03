/**
 * Utility functions for handling document URLs and transformations
 */

/**
 * Transform document URLs to handle live vs historical attachments
 * This function converts URLs between attachlive and attachhis patterns
 * 
 * @param url - The original document URL
 * @param preferLive - Whether to prefer live attachments over historical ones
 * @returns The transformed URL
 */
export const transformDocumentUrl = (url: string, preferLive: boolean = true): string => {
  if (!url) return url;

  // Handle attachlive vs attachhis transformation
  if (preferLive) {
    // Convert attachhis to attachlive for current/live documents
    return url.replace(/attachhis/g, 'attachlive');
  } else {
    // Convert attachlive to attachhis for historical documents
    return url.replace(/attachlive/g, 'attachhis');
  }
};

/**
 * Determine if a document should use live or historical attachment based on date
 * Documents from recent periods (e.g., last 6 months) should use live attachments
 * 
 * @param dateString - The document date string
 * @param thresholdMonths - Number of months to consider as "recent" (default: 6)
 * @returns Whether to use live attachments
 */
export const shouldUseLiveAttachment = (dateString: string, thresholdMonths: number = 6): boolean => {
  if (!dateString) return true; // Default to live for unknown dates

  try {
    const docDate = new Date(dateString);
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setMonth(now.getMonth() - thresholdMonths);

    return docDate >= thresholdDate;
  } catch (error) {
    console.warn('Error parsing date for attachment preference:', error);
    return true; // Default to live on error
  }
};

/**
 * Get the appropriate document URL with live/historical preference applied
 * 
 * @param pdfUrl - The PDF URL from the API
 * @param attachmentFile - The attachment file URL from the API
 * @param documentDate - The document date to determine live vs historical preference
 * @returns The processed document URL
 */
export const getDocumentUrl = (
  pdfUrl?: string, 
  attachmentFile?: string, 
  documentDate?: string
): string => {
  const url = pdfUrl || attachmentFile || '';
  if (!url) return '';

  const preferLive = shouldUseLiveAttachment(documentDate);
  return transformDocumentUrl(url, preferLive);
};

/**
 * Check if a URL contains PDF-related patterns
 * 
 * @param url - The URL to check
 * @returns Whether the URL appears to be a PDF
 */
export const isPdfUrl = (url: string): boolean => {
  if (!url) return false;
  
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.pdf') || 
         lowerUrl.includes('pdf') || 
         lowerUrl.includes('attachment');
};
