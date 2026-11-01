import { Link } from 'react-router-dom';
import ContentPage from '../../components/ContentPage.jsx';
import { POLICY_UPDATED } from '../../utils/site.js';

export default function Terms() {
  return (
    <ContentPage title="Terms of Use" intro="By using Adi Food you agree to these terms. Please read them with the Community Guidelines and the Privacy Policy." updated={POLICY_UPDATED}>
      <p role="note" className="rounded-xl bg-amber-50 px-4 py-3 text-base text-amber-900">
        These terms are a general starting point. The site owner should have them reviewed by a legal adviser for the places where the site operates.
      </p>

      <h2>Using the site</h2>
      <p>You may browse recipes, stories and the gallery freely. Some features need an account. Keep your sign-in details private, and give accurate information when you register. You are responsible for what happens under your account.</p>

      <h2>Recipes and stories</h2>
      <p>Recipes and stories are written and published by the Adi Food editors. They are provided for information and enjoyment. Cooking involves risk (heat, fermentation, allergies), so use your own judgement and follow food-safety practice. We do not guarantee that any recipe is complete or suitable for you.</p>

      <h2>Your uploads</h2>
      <ul>
        <li>You keep ownership of what you upload.</li>
        <li>You confirm that you took it or have permission to share it, and that anyone identifiable in it is comfortable with it being shown.</li>
        <li>You give Adi Food permission to store and publicly display approved uploads, with your name, on this site.</li>
        <li>We review uploads before they appear and may reject, unpublish or delete content that breaks the <Link to="/community-guidelines">Community Guidelines</Link>.</li>
        <li>You can delete your uploads at any time.</li>
      </ul>

      <h2>What you must not do</h2>
      <p>Do not break the law, attempt to access areas or accounts you are not allowed to, disrupt the site, upload harmful or unlawful content, or use the site to send spam.</p>

      <h2>Accounts</h2>
      <p>We may suspend or close accounts that break these terms. You may stop using the site at any time.</p>

      <h2>Our content</h2>
      <p>Recipes, stories, official photographs and the design of the site belong to Adi Food or its contributors. Please do not republish them at scale without asking.</p>

      <h2>Liability</h2>
      <p>The site is provided as it is. To the extent the law allows, we are not responsible for losses arising from using it or from content posted by users.</p>

      <h2>Changes and contact</h2>
      <p>We may update these terms and will change the date above when we do. Questions? <Link to="/contact">Contact us</Link>.</p>
    </ContentPage>
  );
}
