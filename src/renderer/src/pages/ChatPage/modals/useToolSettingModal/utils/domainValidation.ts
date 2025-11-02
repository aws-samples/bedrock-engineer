/**
 * Validates a domain string according to Tavily's domain format requirements.
 *
 * Supported formats:
 * - Standard domains: example.com
 * - Wildcards: *.com, *.example.com
 * - Paths: linkedin.com/in, example.com/path/to/page
 *
 * @param domain - The domain string to validate
 * @returns true if the domain is valid, false otherwise
 */
export const validateDomain = (domain: string): boolean => {
  const domainRegex =
    /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z]{2,})(\/[^\s]*)?$/
  return domainRegex.test(domain.trim())
}
