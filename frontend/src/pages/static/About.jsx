import { Link } from 'react-router-dom';
import ContentPage from '../../components/ContentPage.jsx';

export default function About() {
  return (
    <ContentPage title="About Adi Food" intro="Adi Food is a place to preserve, document and share the traditional food culture of the Adi tribe of Arunachal Pradesh, India.">
      <h2>What this site is for</h2>
      <p>
        Food carries memory: who cooked it, where, for which occasion, and how it was passed on. Adi Food brings recipes, ingredients, photographs and stories together in one place, so that this knowledge can be kept, found and shared.
      </p>

      <h2>How the site works</h2>
      <ul>
        <li>
          <strong>Recipes</strong> are written and published by the Adi Food editors. Visitors cannot edit them. If something about a recipe is not documented, we leave it out rather than guess. <Link to="/recipes">Explore recipes</Link>.
        </li>
        <li>
          <strong>Stories</strong> are articles about food, tradition and the people behind them, also written by the editors. <Link to="/blogs">Read stories</Link>.
        </li>
        <li>
          <strong>The community gallery</strong> is where members share their own photographs and videos. Every submission is reviewed by our team before it appears, and the gallery is kept separate from the official recipes. <Link to="/community">Visit the gallery</Link>.
        </li>
        <li>
          <strong>Official media</strong> are photographs and films curated by the team, some of which are featured on the homepage.
        </li>
      </ul>

      <h2>Taking part</h2>
      <p>
        Anyone can browse. To share photographs or videos you need a free account: <Link to="/register">create one here</Link>. Please read our <Link to="/community-guidelines">community guidelines</Link> first.
      </p>

      <h2>Accuracy and respect</h2>
      <p>
        We aim to present Adi food traditions accurately and respectfully. Descriptions of cultural background appear only where they can be documented. If you notice something that looks wrong or incomplete, please <Link to="/contact">tell us</Link>.
      </p>
    </ContentPage>
  );
}
