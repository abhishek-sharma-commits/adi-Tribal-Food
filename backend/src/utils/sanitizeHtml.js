import sanitizeHtml from 'sanitize-html';

const BLOG_OPTIONS = {
  allowedTags: [
    'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's',
    'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'code', 'pre',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'rel', 'target'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
  },
  // Inline images must be absolute https URLs.
  exclusiveFilter: (frame) => frame.tag === 'img' && !/^https:\/\//i.test(frame.attribs.src ?? ''),
};

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

/** Whitelist-sanitises rich-text HTML written by admins (defence in depth against stored XSS). */
export const sanitizeBlogHtml = (html) => sanitizeHtml(html, BLOG_OPTIONS);

/** Plain-text version of an HTML string. */
export const htmlToText = (html) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&(?:amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, ' ')
    .trim();

export function makeExcerpt(html, max = 200) {
  const text = htmlToText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max)}…`;
}
