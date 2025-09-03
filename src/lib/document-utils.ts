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

  let transformedUrl = url;

  // Handle attachlive vs attachhis transformation
  if (preferLive) {
    // Convert attachhis to attachlive for current/live documents
    transformedUrl = url.replace(/attachhis/gi, 'attachlive');
  } else {
    // Convert attachlive to attachhis for historical documents
    transformedUrl = url.replace(/attachlive/gi, 'attachhis');
  }

  // If the URL doesn't contain either pattern, but looks like a document URL,
  // we might need to add the appropriate pattern
  if (transformedUrl === url && (url.includes('attachment') || url.includes('pdf'))) {
    // Check if we can identify a pattern to replace
    if (preferLive) {
      // Try to replace common patterns with attachlive
      console.log('live')
      transformedUrl = url.replace(/attach(?!live|his)/gi, 'attachlive');
    } else {
      // Try to replace common patterns with attachhis
      console.log('his')
      transformedUrl = url.replace(/attach(?!live|his)/gi, 'attachhis');
    }
  }

  // Log only when transformation actually occurs
  if (transformedUrl !== url) {
    console.log('URL transformed:', url, '->', transformedUrl);
  }

  return transformedUrl;
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
  if (!dateString) {
    return true; // Default to live for unknown dates
  }

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
         lowerUrl.includes('attachment') ||
         lowerUrl.includes('attachhis') ||
         lowerUrl.includes('attachlive') ||
         lowerUrl.includes('document') ||
         lowerUrl.includes('file');
};

/**
 * Open document with fallback logic - tries AttachLive first, then AttachHis if it fails
 * This mimics the backend behavior seen in company details
 *
 * @param url - The document URL to open
 * @param documentDate - Optional document date for determining preference
 */
export const openDocumentWithFallback = async (url: string, documentDate?: string): Promise<void> => {
  if (!url) return;

  // First, try to determine the preferred URL
  const preferLive = shouldUseLiveAttachment(documentDate);
  let primaryUrl = transformDocumentUrl(url, preferLive);
  let fallbackUrl = transformDocumentUrl(url, !preferLive);

  // If both URLs are the same (no transformation occurred), create both variants
  if (primaryUrl === fallbackUrl && isPdfUrl(url)) {
    if (url.toLowerCase().includes('attachlive')) {
      primaryUrl = url;
      fallbackUrl = url.replace(/attachlive/gi, 'attachhis');
    } else if (url.toLowerCase().includes('attachhis')) {
      primaryUrl = url;
      fallbackUrl = url.replace(/attachhis/gi, 'attachlive');
    } else if (url.toLowerCase().includes('attach')) {
      // If it has 'attach' but not the specific patterns, try both
      primaryUrl = url.replace(/attach/gi, 'attachlive');
      fallbackUrl = url.replace(/attach/gi, 'attachhis');
    }
  }

  console.log('Attempting to open document:', {
    originalUrl: url,
    primaryUrl,
    fallbackUrl,
    preferLive
  });

  // Try to open the primary URL first
  try {
    // Check if the primary URL is accessible
    const response = await fetch(primaryUrl, { method: 'HEAD' });
    if (response.ok) {
      window.open(primaryUrl, '_blank');
      return;
    }
  } catch (error) {
    console.log('Primary URL failed, trying fallback:', error);
  }

  // If primary URL fails, try the fallback
  try {
    const response = await fetch(fallbackUrl, { method: 'HEAD' });
    if (response.ok) {
      console.log('Using fallback URL:', fallbackUrl);
      window.open(fallbackUrl, '_blank');
      return;
    }
  } catch (error) {
    console.log('Fallback URL also failed:', error);
  }

  // If both fail, just open the original URL and let the browser handle it
  console.log('Both URLs failed, opening original URL:', url);
  window.open(url, '_blank');
};
