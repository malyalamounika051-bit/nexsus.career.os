/**
 * Ensures an external URL has a protocol and doesn't point to placeholder/dead link.
 * If the link is invalid, a placeholder, or missing, redirects to a Google search for the item.
 * 
 * @param {string} url The URL to clean/validate
 * @param {string} fallbackSearchTerm The term to search Google for if URL is invalid/dummy
 * @returns {string} The cleaned URL or Google search URL
 */
export const formatExternalUrl = (url, fallbackSearchTerm = '') => {
  if (
    !url || 
    url === '#' || 
    url.trim() === '' ||
    url.includes('/404') || 
    url.toLowerCase().includes('placeholder') || 
    url.toLowerCase().includes('example.com') ||
    url.toLowerCase().includes('test.com') ||
    url.toLowerCase().includes('dummy')
  ) {
    const query = fallbackSearchTerm || 'official website';
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  let cleanUrl = url.trim();
  // Ensure it starts with http:// or https://
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }

  return cleanUrl;
};
