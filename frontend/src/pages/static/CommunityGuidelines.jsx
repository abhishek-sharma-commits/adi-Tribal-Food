import { Link } from 'react-router-dom';
import ContentPage from '../../components/ContentPage.jsx';
import { POLICY_UPDATED } from '../../utils/site.js';

export default function CommunityGuidelines() {
  return (
    <ContentPage title="Community Guidelines" intro="These guidelines explain what you can share in the community gallery and how submissions are reviewed." updated={POLICY_UPDATED}>
      <h2>What to share</h2>
      <p>Photographs and videos related to Adi food: finished dishes, ingredients, cooking, preserving and serving, markets, kitchens and the occasions food belongs to.</p>

      <h2>Before you upload</h2>
      <ul>
        <li>Share only photographs and videos that you took, or that you have permission to share.</li>
        <li>If identifiable people appear, make sure they are comfortable with the image being shown publicly.</li>
        <li>Give your upload an accurate title and category. Add context (who made it, where, for which occasion) only if you know it.</li>
        <li>Do not present guesses as facts about Adi traditions. If you are unsure, say so or leave it out.</li>
      </ul>

      <h2>What is not allowed</h2>
      <ul>
        <li>Content that is unrelated to food and food culture, spam or advertising.</li>
        <li>Content that is hateful, harassing, sexual, graphic or that endangers anyone.</li>
        <li>Content that infringes someone else's copyright or privacy.</li>
        <li>Content that mocks or misrepresents the Adi community or its traditions.</li>
      </ul>

      <h2>How review works</h2>
      <ol>
        <li>Your upload is saved as <strong>pending</strong>. It is not public.</li>
        <li>An administrator reviews it and either approves or rejects it. If it is rejected, you will see the reason in your dashboard.</li>
        <li>Approved uploads appear in the community gallery with your name. They never become official recipes.</li>
        <li>You can edit the details of a pending or rejected upload; saving a rejected one sends it back for review. Approved uploads are locked. To change one, delete it and submit a new one.</li>
        <li>You can delete your own uploads at any time. This removes them from the gallery and deletes the stored file.</li>
      </ol>

      <h2>Our rights</h2>
      <p>We may reject, unpublish or delete content that breaks these guidelines, and may suspend accounts that repeatedly do so. Questions or concerns? <Link to="/contact">Contact us</Link>.</p>
    </ContentPage>
  );
}
