import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Code, Heading2, Heading3, Heading4, Image as ImageIcon, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Strikethrough, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import MediaUploader from './MediaUploader.jsx';

const HTTPS = /^https:\/\/\S+$/i;
const LINK = /^(https:\/\/|mailto:)\S+$/i;

function Tool({ label, onClick, active, disabled, children }) {
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={active === undefined ? undefined : active} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm hover:bg-surface disabled:opacity-40 ${active ? 'bg-ink text-white hover:bg-ink' : ''}`}>
      {children}
    </button>
  );
}

/**
 * Article editor. Produces HTML limited to what the API accepts (headings 2-4, emphasis, lists, quotes, code,
 * rules, https links and https images); the server sanitises it again on save.
 */
export default function RichTextEditor({ value, onChange, disabled = false, invalid = false, id }) {
  const [panel, setPanel] = useState(null); // 'link' | 'image' | null
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [problem, setProblem] = useState('');

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] } }), Link.configure({ openOnClick: false, autolink: false }), Image],
    content: value || '',
    editable: !disabled,
    editorProps: { attributes: { id: id ?? '', role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Article body', class: 'prose prose-neutral max-w-none min-h-[320px] px-4 py-3 focus:outline-none prose-img:rounded-card' } },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  useEffect(() => {
    editor?.setEditable(!disabled, false); // false: toggling editability must not count as a content change
  }, [editor, disabled]);

  if (!editor) return <div className="min-h-[360px] animate-pulse rounded-xl bg-surface" aria-busy="true" />;

  const run = (fn) => () => fn(editor.chain().focus()).run();
  const close = () => (setPanel(null), setUrl(''), setAlt(''), setProblem(''));

  const openLink = () => {
    if (panel === 'link') return close();
    setPanel('link');
    setUrl(editor.getAttributes('link').href ?? '');
    setProblem('');
  };
  const applyLink = (e) => {
    e.preventDefault();
    const href = url.trim();
    if (!href) return removeLink();
    if (!LINK.test(href)) return setProblem('Use a link starting with https:// (or mailto:).');
    if (editor.state.selection.empty && !editor.isActive('link')) return setProblem('Select the text you want to link first.');
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    close();
  };
  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    close();
  };
  const insertImage = (src) => {
    editor.chain().focus().setImage({ src, alt: alt.trim() }).run();
    close();
  };
  const submitImage = (e) => {
    e.preventDefault();
    if (!HTTPS.test(url.trim())) return setProblem('Use an image link starting with https://');
    insertImage(url.trim());
  };

  const btn = 'h-5 w-5';
  return (
    <div className={`rounded-xl border bg-white ${invalid ? 'border-red-600' : 'border-line focus-within:border-ink'}`}>
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-line p-1.5">
        <Tool label="Bold" active={editor.isActive('bold')} disabled={disabled} onClick={run((c) => c.toggleBold())}><Bold className={btn} aria-hidden="true" /></Tool>
        <Tool label="Italic" active={editor.isActive('italic')} disabled={disabled} onClick={run((c) => c.toggleItalic())}><Italic className={btn} aria-hidden="true" /></Tool>
        <Tool label="Strikethrough" active={editor.isActive('strike')} disabled={disabled} onClick={run((c) => c.toggleStrike())}><Strikethrough className={btn} aria-hidden="true" /></Tool>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <Tool label="Heading 2" active={editor.isActive('heading', { level: 2 })} disabled={disabled} onClick={run((c) => c.toggleHeading({ level: 2 }))}><Heading2 className={btn} aria-hidden="true" /></Tool>
        <Tool label="Heading 3" active={editor.isActive('heading', { level: 3 })} disabled={disabled} onClick={run((c) => c.toggleHeading({ level: 3 }))}><Heading3 className={btn} aria-hidden="true" /></Tool>
        <Tool label="Heading 4" active={editor.isActive('heading', { level: 4 })} disabled={disabled} onClick={run((c) => c.toggleHeading({ level: 4 }))}><Heading4 className={btn} aria-hidden="true" /></Tool>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <Tool label="Bulleted list" active={editor.isActive('bulletList')} disabled={disabled} onClick={run((c) => c.toggleBulletList())}><List className={btn} aria-hidden="true" /></Tool>
        <Tool label="Numbered list" active={editor.isActive('orderedList')} disabled={disabled} onClick={run((c) => c.toggleOrderedList())}><ListOrdered className={btn} aria-hidden="true" /></Tool>
        <Tool label="Quote" active={editor.isActive('blockquote')} disabled={disabled} onClick={run((c) => c.toggleBlockquote())}><Quote className={btn} aria-hidden="true" /></Tool>
        <Tool label="Code block" active={editor.isActive('codeBlock')} disabled={disabled} onClick={run((c) => c.toggleCodeBlock())}><Code className={btn} aria-hidden="true" /></Tool>
        <Tool label="Divider" disabled={disabled} onClick={run((c) => c.setHorizontalRule())}><Minus className={btn} aria-hidden="true" /></Tool>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <Tool label="Link" active={panel === 'link' || editor.isActive('link')} disabled={disabled} onClick={openLink}><Link2 className={btn} aria-hidden="true" /></Tool>
        <Tool label="Image" active={panel === 'image'} disabled={disabled} onClick={() => (panel === 'image' ? close() : (setPanel('image'), setUrl(''), setAlt(''), setProblem('')))}><ImageIcon className={btn} aria-hidden="true" /></Tool>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <Tool label="Undo" disabled={disabled || !editor.can().undo()} onClick={run((c) => c.undo())}><Undo2 className={btn} aria-hidden="true" /></Tool>
        <Tool label="Redo" disabled={disabled || !editor.can().redo()} onClick={run((c) => c.redo())}><Redo2 className={btn} aria-hidden="true" /></Tool>
      </div>

      {panel === 'link' && (
        <form onSubmit={applyLink} className="space-y-2 border-b border-line bg-surface p-3" aria-label="Add link">
          <label htmlFor="rte-link-url" className="label">Link address</label>
          <input id="rte-link-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="input" autoFocus />
          {problem && <p className="field-error" role="alert">{problem}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary !py-1.5">Apply link</button>
            {editor.isActive('link') && <button type="button" onClick={removeLink} className="btn-secondary !py-1.5">Remove link</button>}
            <button type="button" onClick={close} className="btn-ghost !py-1.5">Cancel</button>
          </div>
        </form>
      )}

      {panel === 'image' && (
        <form onSubmit={submitImage} className="space-y-3 border-b border-line bg-surface p-3" aria-label="Add image">
          <div>
            <label htmlFor="rte-img-alt" className="label">Describe the image (alt text)</label>
            <input id="rte-img-alt" value={alt} onChange={(e) => setAlt(e.target.value)} className="input" />
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <MediaUploader kind="image" label="Upload image" onUploaded={(r) => insertImage(r.url)} />
          </div>
          <div>
            <label htmlFor="rte-img-url" className="label">Or use an image link</label>
            <input id="rte-img-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="input" />
          </div>
          {problem && <p className="field-error" role="alert">{problem}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary !py-1.5">Insert image</button>
            <button type="button" onClick={close} className="btn-ghost !py-1.5">Cancel</button>
          </div>
        </form>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
