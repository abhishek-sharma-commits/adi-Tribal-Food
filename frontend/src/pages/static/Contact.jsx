import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import ContentPage from '../../components/ContentPage.jsx';
import { CONTACT_EMAIL } from '../../utils/site.js';

export default function Contact() {
  return (
    <ContentPage title="Contact" intro="Questions, corrections, or a request about your account or your content: we'd like to hear from you.">
      {CONTACT_EMAIL ? (
        <p className="not-prose">
          <a href={`mailto:${CONTACT_EMAIL}`} className="btn-primary">
            <Mail className="h-4 w-4" aria-hidden="true" /> {CONTACT_EMAIL}
          </a>
        </p>
      ) : (
        <p role="note" className="rounded-xl bg-surface px-4 py-3 text-base">
          Contact details have not been set up for this site yet.
        </p>
      )}

      <h2>What to write to us about</h2>
      <ul>
        <li>A correction or missing detail in a recipe or story.</li>
        <li>A problem with an upload or a moderation decision. Include the title of the upload.</li>
        <li>Deleting your account or personal data. See the <Link to="/privacy">Privacy Policy</Link>.</li>
        <li>Content you believe should not be on the site. Include a link to the page.</li>
      </ul>
    </ContentPage>
  );
}
