import DOMPurify from 'dompurify';

// Defence in depth: the API already sanitises blog HTML on write, and we sanitise again before rendering.
const CONFIG = {
  ALLOWED_TAGS: ['h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'title', 'rel', 'target', 'src', 'alt', 'width', 'height'],
};

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer nofollow');
    node.setAttribute('target', '_blank');
  }
  if (node.tagName === 'IMG' && !/^https:\/\//i.test(node.getAttribute('src') ?? '')) node.remove();
});

export const sanitizeRichText = (html) => DOMPurify.sanitize(html ?? '', CONFIG);

export function readingMinutes(html) {
  const words = (html ?? '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
