import { Link } from 'react-router-dom';
import ContentPage from '../../components/ContentPage.jsx';
import { CONTACT_EMAIL, POLICY_UPDATED } from '../../utils/site.js';

export default function Privacy() {
  return (
    <ContentPage title="Privacy Policy" intro="This explains what personal information Adi Food collects, why, and the choices you have." updated={POLICY_UPDATED}>
      <p role="note" className="rounded-xl bg-amber-50 px-4 py-3 text-base text-amber-900">
        This is a plain-language description of how the site works. The site owner should have it reviewed against the laws that apply to them before relying on it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your full name and email address, and your password stored only as a one-way hash (we cannot read it).</li>
        <li><strong>Your uploads:</strong> photographs and videos you submit, with the title, description, caption, category, the date, and your confirmation that you may share them.</li>
        <li><strong>Moderation records:</strong> who reviewed a submission, when, and any reason given.</li>
        <li><strong>Technical data:</strong> your IP address is used briefly to limit repeated sign-in attempts and protect the site from abuse.</li>
      </ul>
      <p>We do not run advertising or third-party analytics on this site.</p>

      <h2>Cookies</h2>
      <p>We use two cookies, both strictly necessary: a secure session cookie that keeps you signed in, and a security cookie that protects form submissions from forgery. We do not use tracking cookies.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account, show your dashboard and let you upload.</li>
        <li>To review submissions and keep the community gallery appropriate.</li>
        <li>To keep the site secure and to answer messages you send us.</li>
      </ul>

      <h2>What is public</h2>
      <p>When a submission is approved, its media, title, description, caption and your <strong>full name</strong> are shown publicly in the community gallery. Pending and rejected submissions are not public. Your email address is never shown publicly. It is visible to administrators.</p>

      <h2>Who processes your data</h2>
      <p>Uploaded photographs and videos are stored with our media hosting provider (ImageKit). Account and content records are stored in our database. These providers process data on our behalf to run the site.</p>

      <h2>Keeping and deleting data</h2>
      <p>You can edit your name and change your password from your dashboard, and delete your own uploads at any time (the stored file is deleted too). We keep account data while your account exists. To delete your account or ask what we hold about you, {CONTACT_EMAIL ? <>write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></> : <><Link to="/contact">contact us</Link></>}.</p>

      <h2>Security</h2>
      <p>Passwords are hashed, sessions use secure HTTP-only cookies, and administrator functions are protected on the server. No system is perfectly secure, so please use a strong, unique password.</p>

      <h2>Changes</h2>
      <p>If we change this policy we will update the date at the top of the page.</p>
    </ContentPage>
  );
}
