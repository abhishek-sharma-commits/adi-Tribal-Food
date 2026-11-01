import UploadForm from '../../features/community/UploadForm.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

export default function UploadPage() {
  useDocumentTitle('Upload photos and videos');
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold tracking-tight">Upload photos and videos</h2>
      <p className="mt-2 text-ink-muted">Add a photo or video of Adi food, a dish, an ingredient or a moment from the kitchen. Our team reviews every submission before it appears in the gallery.</p>
      <div className="mt-8">
        <UploadForm />
      </div>
    </div>
  );
}
