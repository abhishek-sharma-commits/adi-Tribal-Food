import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireAdmin, RequireAuth } from './features/auth/guards.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import BlogDetail from './pages/BlogDetail.jsx';
import Blogs from './pages/Blogs.jsx';
import Community from './pages/Community.jsx';
import AdminBlogs from './pages/admin/Blogs.jsx';
import AdminCategories from './pages/admin/Categories.jsx';
import AdminMedia from './pages/admin/Media.jsx';
import AdminModeration from './pages/admin/Moderation.jsx';
import AdminOverview from './pages/admin/Overview.jsx';
import AdminRecipes from './pages/admin/Recipes.jsx';
import BlogEditor from './pages/admin/BlogEditor.jsx';
import BlogPreview from './pages/admin/BlogPreview.jsx';
import RecipeEditor from './pages/admin/RecipeEditor.jsx';
import RecipePreview from './pages/admin/RecipePreview.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import EditUpload from './pages/dashboard/EditUpload.jsx';
import MyUploads from './pages/dashboard/MyUploads.jsx';
import Overview from './pages/dashboard/Overview.jsx';
import Profile from './pages/dashboard/Profile.jsx';
import UploadDetail from './pages/dashboard/UploadDetail.jsx';
import UploadPage from './pages/dashboard/UploadPage.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import About from './pages/static/About.jsx';
import CommunityGuidelines from './pages/static/CommunityGuidelines.jsx';
import Contact from './pages/static/Contact.jsx';
import Privacy from './pages/static/Privacy.jsx';
import Terms from './pages/static/Terms.jsx';
import RecipeDetail from './pages/RecipeDetail.jsx';
import Recipes from './pages/Recipes.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="community" element={<Community />} />
        <Route element={<RequireAuth />}>
          <Route path="community/upload" element={<Navigate to="/dashboard/upload" replace />} />
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="uploads" element={<MyUploads />} />
            <Route path="uploads/:id" element={<UploadDetail />} />
            <Route path="uploads/:id/edit" element={<EditUpload />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
        <Route element={<RequireAdmin />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="recipes" element={<AdminRecipes />} />
            <Route path="recipes/new" element={<RecipeEditor />} />
            <Route path="recipes/:id/edit" element={<RecipeEditor />} />
            <Route path="recipes/:id/preview" element={<RecipePreview />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="blogs/new" element={<BlogEditor />} />
            <Route path="blogs/:id/edit" element={<BlogEditor />} />
            <Route path="blogs/:id/preview" element={<BlogPreview />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="moderation" element={<AdminModeration />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>
        <Route path="about" element={<About />} />
        <Route path="community-guidelines" element={<CommunityGuidelines />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="blogs/:slug" element={<BlogDetail />} />
        <Route path="recipes" element={<Recipes />} />
        <Route path="recipes/:slug" element={<RecipeDetail />} />
        <Route element={<GuestOnly />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
