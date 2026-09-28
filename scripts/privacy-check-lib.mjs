// Symantec's historic advisory IDs contain date/record digits that can resemble
// local phone numbers. Mask only these structured identifiers in source URLs;
// do not exempt a page, ordinary text, other URLs, or any tel: attribute.
export function textForPhoneScan(html) {
  return html.replace(/https?:\/{1,2}(?:www\.)?symantec\.com\/(?:security_response\/writeup\.jsp\?docid=|security-center\/writeup\/)\d{4}-\d{6}-\d{4}-\d{2}(?=["'\s&#<]|$)/g,'[structured-public-advisory-url]');
}
