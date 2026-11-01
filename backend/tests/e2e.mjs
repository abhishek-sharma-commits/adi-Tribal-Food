/**
 * End-to-end check against a RUNNING server and real MongoDB. Standalone and removable:
 * nothing in src/ imports this folder.
 *
 *   BASE_URL=http://localhost:5000/api \
 *   E2E_ADMIN_EMAIL=admin@example.com E2E_ADMIN_PASSWORD='...' \
 *   node tests/e2e.mjs
 *
 * Optional: E2E_IMAGEKIT=1 also runs the real upload -> submit -> moderate flow
 * (the server must have valid IMAGEKIT_* settings).
 * It creates data (test users, one recipe, one blog, submissions) and deletes what it can.
 * Use a development database.
 */
const BASE = (process.env.BASE_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const WITH_IMAGEKIT = process.env.E2E_IMAGEKIT === '1';
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (run `npm run seed` first).');
  process.exit(2);
}

class Client {
  constructor(name) { this.name = name; this.jar = {}; this.csrf = null; }
  absorb(res) {
    for (const line of res.headers.getSetCookie?.() ?? []) {
      const [pair] = line.split(';');
      const i = pair.indexOf('=');
      const k = pair.slice(0, i).trim();
      const v = pair.slice(i + 1).trim();
      if (v === '' || /max-age=0|expires=thu, 01 jan 1970/i.test(line)) delete this.jar[k];
      else this.jar[k] = v;
    }
  }
  async req(method, path, body) {
    if (!this.csrf && method !== 'GET') await this.req('GET', '/auth/csrf');
    const headers = { cookie: Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join('; ') };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (method !== 'GET') headers['x-csrf-token'] = this.jar.adifood_csrf ?? this.csrf ?? '';
    const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    this.absorb(res);
    const json = await res.json().catch(() => ({}));
    if (json?.data?.csrfToken) this.csrf = json.data.csrfToken;
    return { status: res.status, code: json.error?.code ?? 'ok', body: json };
  }
  get = (p) => this.req('GET', p);
  post = (p, b = {}) => this.req('POST', p, b);
  patch = (p, b = {}) => this.req('PATCH', p, b);
  del = (p) => this.req('DELETE', p);
}

let passed = 0;
const failures = [];
function check(label, ok, detail = '') {
  if (ok) { passed += 1; console.log(`  PASS  ${label}`); }
  else { failures.push(label); console.log(`  FAIL  ${label} ${detail}`); }
}
const expect = (label, res, status, code = 'ok') =>
  check(label, res.status === status && res.code === code, `(got ${res.status} ${res.code}, want ${status} ${code})`);
const section = (s) => console.log(`\n${s}`);

const stamp = Date.now();
const anon = new Client('anon'), admin = new Client('admin'), alice = new Client('alice');
const aliceEmail = `e2e.alice.${stamp}@example.com`;
const PASSWORD = 'E2e-Passw0rd!';
const created = { recipe: null, blog: null };

try {
  section('Health');
  expect('GET /health', await anon.get('/health'), 200);

  section('Auth');
  expect('register rejects injected role', await alice.post('/auth/register', { fullName: 'Alice E2E', email: aliceEmail, password: PASSWORD, confirmPassword: PASSWORD, role: 'admin' }), 400, 'VALIDATION_ERROR');
  expect('register mismatched passwords', await alice.post('/auth/register', { fullName: 'Alice E2E', email: aliceEmail, password: PASSWORD, confirmPassword: 'nope' }), 400, 'VALIDATION_ERROR');
  const reg = await alice.post('/auth/register', { fullName: 'Alice E2E', email: aliceEmail, password: PASSWORD, confirmPassword: PASSWORD });
  expect('register ok', reg, 201);
  check('new account is role=user, active', reg.body.data?.user?.role === 'user' && reg.body.data?.user?.accountStatus === 'active');
  check('response has no password hash', !JSON.stringify(reg.body).includes('passwordHash'));
  expect('duplicate email', await new Client('dup').post('/auth/register', { fullName: 'Alice Two', email: aliceEmail.toUpperCase(), password: PASSWORD, confirmPassword: PASSWORD }), 409, 'EMAIL_TAKEN');
  const me = await alice.get('/auth/me');
  expect('/auth/me with session', me, 200);
  expect('logout', await alice.post('/auth/logout'), 200);
  expect('/auth/me after logout', await alice.get('/auth/me'), 401, 'UNAUTHENTICATED');
  expect('login wrong password', await alice.post('/auth/login', { email: aliceEmail, password: 'wrong-password1' }), 401, 'INVALID_CREDENTIALS');
  expect('login ok', await alice.post('/auth/login', { email: aliceEmail, password: PASSWORD }), 200);
  const raw = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: aliceEmail, password: PASSWORD }) });
  check('login without CSRF token is refused', raw.status === 403);
  expect('admin login', await admin.post('/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }), 200);
  check('admin has role=admin', (await admin.get('/auth/me')).body.data?.user?.role === 'admin');

  section('Role boundaries');
  expect('user cannot list admin recipes', await alice.get('/admin/recipes'), 403, 'FORBIDDEN');
  expect('user cannot create a recipe', await alice.post('/admin/recipes', { title: 'x', category: '0'.repeat(24) }), 403, 'FORBIDDEN');
  expect('user cannot create a blog', await alice.post('/admin/blogs', { title: 'x', content: '<p>x</p>' }), 403, 'FORBIDDEN');
  expect('user cannot read admin users', await alice.get('/admin/users'), 403, 'FORBIDDEN');
  expect('anonymous cannot reach admin', await anon.get('/admin/dashboard'), 401, 'UNAUTHENTICATED');

  section('Categories');
  const cats = await anon.get('/categories');
  expect('GET /categories', cats, 200);
  const category = cats.body.data?.[0];
  check('categories are seeded (run `npm run seed`)', Boolean(category), '');
  if (!category) throw new Error('No categories: run `npm run seed` first');

  section('Recipes: draft -> publish -> unpublish -> delete');
  const slug = `e2e-recipe-${stamp}`;
  const rec = await admin.post('/admin/recipes', { title: `E2E Recipe ${stamp}`, slug, category: category._id, shortDescription: 'e2e', ingredients: [{ name: 'Rice', quantity: '2', unit: 'cup' }], instructions: [{ text: 'Cook.' }] });
  expect('admin creates recipe', rec, 201);
  created.recipe = rec.body.data?._id;
  check('new recipe is a draft with admin as author', rec.body.data?.status === 'draft' && Boolean(rec.body.data?.author));
  expect('duplicate slug', await admin.post('/admin/recipes', { title: 'Dup', slug, category: category._id }), 409, 'SLUG_TAKEN');
  expect('draft hidden from public detail', await anon.get(`/recipes/${slug}`), 404, 'RECIPE_NOT_FOUND');
  check('draft absent from public list', !(await anon.get(`/recipes?q=E2E%20Recipe%20${stamp}`)).body.data?.some((r) => r.slug === slug));
  expect('publish', await admin.patch(`/admin/recipes/${created.recipe}/publish`, { status: 'published' }), 200);
  const pub = await anon.get(`/recipes/${slug}`);
  expect('published recipe visible to anonymous', pub, 200);
  check('public detail hides author and status', !('author' in pub.body.data.recipe) && !('status' in pub.body.data.recipe));
  check('search by ingredient finds it', (await anon.get('/recipes?q=rice')).body.data?.some((r) => r.slug === slug));
  expect('feature', await admin.patch(`/admin/recipes/${created.recipe}/feature`, { isFeatured: true }), 200);
  check('featured filter finds it', (await anon.get('/recipes?featured=true')).body.data?.some((r) => r.slug === slug));
  check('filter by category slug finds it', (await anon.get(`/recipes?category=${category.slug}`)).body.data?.some((r) => r.slug === slug));
  expect('admin patch', await admin.patch(`/admin/recipes/${created.recipe}`, { shortDescription: 'updated' }), 200);
  expect('patch cannot change status', await admin.patch(`/admin/recipes/${created.recipe}`, { status: 'draft' }), 400, 'VALIDATION_ERROR');
  expect('unpublish', await admin.patch(`/admin/recipes/${created.recipe}/publish`, { status: 'draft' }), 200);
  expect('unpublished recipe hidden again', await anon.get(`/recipes/${slug}`), 404, 'RECIPE_NOT_FOUND');
  expect('delete recipe', await admin.del(`/admin/recipes/${created.recipe}`), 200);
  expect('deleted recipe gone', await admin.get(`/admin/recipes/${created.recipe}`), 404, 'RECIPE_NOT_FOUND');
  created.recipe = null;

  section('Blogs: sanitising and visibility');
  const bslug = `e2e-blog-${stamp}`;
  const blog = await admin.post('/admin/blogs', { title: `E2E Blog ${stamp}`, slug: bslug, content: '<p>Hello <script>alert(1)</script><a href="javascript:x">bad</a></p>', tags: ['E2E', 'e2e'] });
  expect('admin creates blog', blog, 201);
  created.blog = blog.body.data?._id;
  check('script and javascript: stripped, tags deduped', !/script|javascript:/i.test(blog.body.data?.content ?? 'script') && blog.body.data?.tags?.length === 1);
  check('excerpt derived from content', blog.body.data?.excerpt === 'Hello bad');
  expect('draft blog hidden', await anon.get(`/blogs/${bslug}`), 404, 'BLOG_NOT_FOUND');
  expect('publish blog', await admin.patch(`/admin/blogs/${created.blog}`, { status: 'published' }), 200);
  expect('published blog visible', await anon.get(`/blogs/${bslug}`), 200);
  check('blog appears in public list', (await anon.get(`/blogs?tag=e2e`)).body.data?.some((b) => b.slug === bslug));
  expect('delete blog', await admin.del(`/admin/blogs/${created.blog}`), 200);
  created.blog = null;

  section('Community submissions (no provider needed)');
  const subBody = { title: 'E2E photo', category: category._id, mediaType: 'image', mediaFileId: 'e2efileid1', consent: true };
  expect('anonymous cannot submit', await anon.post('/community/submissions', { ...subBody, mediaUrl: 'https://example.com/x.jpg' }), 401, 'UNAUTHENTICATED');
  expect('status cannot be injected', await alice.post('/community/submissions', { ...subBody, mediaUrl: 'https://example.com/x.jpg', status: 'approved' }), 400, 'VALIDATION_ERROR');
  expect('consent required', await alice.post('/community/submissions', { ...subBody, mediaUrl: 'https://example.com/x.jpg', consent: false }), 400, 'VALIDATION_ERROR');
  const foreign = await alice.post('/community/submissions', { ...subBody, mediaUrl: 'https://example.com/x.jpg' });
  check('foreign media URL refused', foreign.status === 400 && foreign.code === 'MEDIA_URL_NOT_ALLOWED' || foreign.status === 503, `(got ${foreign.status} ${foreign.code})`);
  const gal = await anon.get('/community/gallery');
  expect('gallery is public', gal, 200);
  const mine = await alice.get('/community/submissions/mine');
  expect('my submissions', mine, 200);
  check('counts block present', mine.body.meta?.counts && 'pending' in mine.body.meta.counts);

  if (WITH_IMAGEKIT) {
    section('Community submissions (live ImageKit)');
    const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const authRes = await alice.post('/media/upload-auth', {});
    expect('upload-auth', authRes, 200);
    const a = authRes.body.data;
    const form = new FormData();
    form.set('file', new Blob([PNG], { type: 'image/png' }), `e2e-${stamp}.png`);
    form.set('fileName', `e2e-${stamp}.png`);
    form.set('publicKey', a.publicKey); form.set('signature', a.signature);
    form.set('expire', String(a.expire)); form.set('token', a.token);
    form.set('folder', a.folder); form.set('useUniqueFileName', 'true');
    const up = await fetch(a.uploadUrl, { method: 'POST', body: form });
    const file = await up.json();
    check('direct upload to ImageKit', up.ok && file.fileId, JSON.stringify(file).slice(0, 200));
    const sub = await alice.post('/community/submissions', { title: 'E2E real photo', category: category._id, mediaType: 'image', mediaUrl: file.url, mediaFileId: file.fileId, consent: true });
    expect('submit verified upload', sub, 201);
    const sid = sub.body.data?._id;
    check('starts pending', sub.body.data?.status === 'pending');
    expect('same upload cannot be submitted twice', await alice.post('/community/submissions', { title: 'again', category: category._id, mediaType: 'image', mediaUrl: file.url, mediaFileId: file.fileId, consent: true }), 409, 'MEDIA_ALREADY_USED');
    check('pending item not in public gallery', !(await anon.get('/community/gallery')).body.data?.some((s) => s._id === sid));
    check('admin sees it in pending tab', (await admin.get('/admin/submissions?status=pending')).body.data?.some((s) => s._id === sid));
    expect('reject requires a reason', await admin.patch(`/admin/submissions/${sid}/review`, { status: 'rejected' }), 400, 'VALIDATION_ERROR');
    expect('approve', await admin.patch(`/admin/submissions/${sid}/review`, { status: 'approved' }), 200);
    check('approved item is in the gallery', (await anon.get('/community/gallery')).body.data?.some((s) => s._id === sid));
    check('approved item is NOT a recipe', !(await anon.get('/recipes?limit=50')).body.data?.some((r) => r.title === 'E2E real photo'));
    expect('approved submission is locked for the user', await alice.patch(`/community/submissions/${sid}`, { title: 'x' }), 409, 'SUBMISSION_LOCKED');
    expect('admin rejects approved item', await admin.patch(`/admin/submissions/${sid}/review`, { status: 'rejected', reason: 'e2e reject' }), 200);
    check('rejected item leaves the gallery', !(await anon.get('/community/gallery')).body.data?.some((s) => s._id === sid));
    const seen = await alice.get(`/community/submissions/mine/${sid}`);
    check('user sees the rejection reason', seen.body.data?.rejectionReason === 'e2e reject');
    expect('editing a rejected item re-queues it', await alice.patch(`/community/submissions/${sid}`, { title: 'E2E retitled' }), 200);
    check('back to pending', (await alice.get(`/community/submissions/mine/${sid}`)).body.data?.status === 'pending');
    expect('user deletes own submission', await alice.del(`/community/submissions/${sid}`), 200);
  } else {
    console.log('  (skipped live ImageKit flow: set E2E_IMAGEKIT=1 with a configured server)');
  }

  section('User management');
  const aliceId = me.body.data?.user?.id;
  const list = await admin.get(`/admin/users?q=${encodeURIComponent(aliceEmail)}`);
  expect('admin searches users', list, 200);
  check('user list never exposes password hashes', !JSON.stringify(list.body).includes('passwordHash'));
  expect('admin cannot suspend self', await admin.patch(`/admin/users/${(await admin.get('/auth/me')).body.data.user.id}/status`, { accountStatus: 'suspended' }), 403, 'SELF_STATUS_CHANGE');
  expect('suspend alice', await admin.patch(`/admin/users/${aliceId}/status`, { accountStatus: 'suspended' }), 200);
  expect('suspended session is rejected immediately', await alice.get('/auth/me'), 403, 'ACCOUNT_SUSPENDED');
  expect('suspended user cannot log in', await new Client('alice2').post('/auth/login', { email: aliceEmail, password: PASSWORD }), 403, 'ACCOUNT_SUSPENDED');
  expect('reactivate alice', await admin.patch(`/admin/users/${aliceId}/status`, { accountStatus: 'active' }), 200);
  expect('reactivated session works', await alice.get('/auth/me'), 200);

  section('Profile and password');
  const aliceB = new Client('aliceB');
  expect('second session for alice', await aliceB.post('/auth/login', { email: aliceEmail, password: PASSWORD }), 200);
  expect('profile: unknown field rejected', await alice.patch('/auth/me', { fullName: 'Alice Renamed', role: 'admin' }), 400, 'VALIDATION_ERROR');
  expect('profile: empty name rejected', await alice.patch('/auth/me', { fullName: ' ' }), 400, 'VALIDATION_ERROR');
  const renamed = await alice.patch('/auth/me', { fullName: 'Alice Renamed' });
  expect('profile: update name', renamed, 200); check('profile: name persisted, role unchanged', (await alice.get('/auth/me')).body.data.user.fullName === 'Alice Renamed' && renamed.body.data.user.role === 'user');
  expect('password: wrong current password', await alice.patch('/auth/password', { currentPassword: 'Wrong-pass1', newPassword: 'New-Passw0rd!', confirmPassword: 'New-Passw0rd!' }), 400, 'INVALID_CURRENT_PASSWORD');
  expect('password: confirmation mismatch', await alice.patch('/auth/password', { currentPassword: PASSWORD, newPassword: 'New-Passw0rd!', confirmPassword: 'nope' }), 400, 'VALIDATION_ERROR');
  expect('password: weak new password', await alice.patch('/auth/password', { currentPassword: PASSWORD, newPassword: 'abcdefgh', confirmPassword: 'abcdefgh' }), 400, 'VALIDATION_ERROR');
  expect('password: must differ from current', await alice.patch('/auth/password', { currentPassword: PASSWORD, newPassword: PASSWORD, confirmPassword: PASSWORD }), 400, 'VALIDATION_ERROR');
  expect('anonymous cannot change a password', await anon.patch('/auth/password', { currentPassword: PASSWORD, newPassword: 'New-Passw0rd!', confirmPassword: 'New-Passw0rd!' }), 401, 'UNAUTHENTICATED');
  const NEW_PASSWORD = 'New-Passw0rd!';
  expect('password: change succeeds', await alice.patch('/auth/password', { currentPassword: PASSWORD, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD }), 200);
  expect('password: this session stays signed in', await alice.get('/auth/me'), 200);
  expect('password: other sessions are signed out', await aliceB.get('/auth/me'), 401, 'INVALID_SESSION');
  expect('password: old password no longer works', await new Client('old').post('/auth/login', { email: aliceEmail, password: PASSWORD }), 401, 'INVALID_CREDENTIALS');
  expect('password: new password works', await new Client('new').post('/auth/login', { email: aliceEmail, password: NEW_PASSWORD }), 200);

  section('Category management');
  const CAT_NAME = `E2E Category ${stamp}`;
  expect('user cannot list admin categories', await alice.get('/admin/categories'), 403, 'FORBIDDEN');
  expect('user cannot create a category', await alice.post('/admin/categories', { name: 'Nope' }), 403, 'FORBIDDEN');
  expect('create rejects unknown fields', await admin.post('/admin/categories', { name: CAT_NAME, id: 'x' }), 400, 'VALIDATION_ERROR');
  expect('create rejects a bad slug', await admin.post('/admin/categories', { name: CAT_NAME, slug: 'Bad Slug' }), 400, 'VALIDATION_ERROR');
  expect('create rejects a non-https image', await admin.post('/admin/categories', { name: CAT_NAME, imageUrl: 'http://x.example/a.jpg' }), 400, 'VALIDATION_ERROR');
  const newCat = await admin.post('/admin/categories', { name: CAT_NAME, description: 'created by e2e' });
  expect('create category', newCat, 201); const catId = newCat.body.data?._id;
  check('slug generated from the name', newCat.body.data?.slug === `e2e-category-${stamp}`);
  expect('duplicate name (case-insensitive)', await admin.post('/admin/categories', { name: CAT_NAME.toUpperCase() }), 409, 'NAME_TAKEN');
  expect('duplicate slug', await admin.post('/admin/categories', { name: `Other ${stamp}`, slug: `e2e-category-${stamp}` }), 409, 'SLUG_TAKEN');
  check('public list includes it', (await anon.get('/categories')).body.data.some((c) => c._id === catId));
  const listed = await admin.get('/admin/categories'); expect('admin list', listed, 200);
  check('usage counts start at zero', JSON.stringify(listed.body.data.find((c) => c._id === catId)?.usage) === '{"recipes":0,"blogs":0,"submissions":0,"media":0}');
  expect('update description', await admin.patch(`/admin/categories/${catId}`, { description: 'edited' }), 200);
  expect('rename to an existing category is refused', await admin.patch(`/admin/categories/${catId}`, { name: category.name }), 409, 'NAME_TAKEN');
  expect('update rejects an empty body', await admin.patch(`/admin/categories/${catId}`, {}), 400, 'VALIDATION_ERROR');
  expect('update an unknown category', await admin.patch(`/admin/categories/${'0'.repeat(24)}`, { name: 'x' }), 404, 'CATEGORY_NOT_FOUND');
  const used = await admin.post('/admin/recipes', { title: `Uses category ${stamp}`, category: catId }); expect('a recipe uses the category', used, 201);
  check('usage now shows the recipe', (await admin.get('/admin/categories')).body.data.find((c) => c._id === catId)?.usage?.recipes === 1);
  const blocked = await admin.del(`/admin/categories/${catId}`); expect('delete is blocked while in use', blocked, 409, 'CATEGORY_IN_USE'); check('block reports what uses it', blocked.body.error?.details?.recipes === 1);
  expect('remove the recipe', await admin.del(`/admin/recipes/${used.body.data._id}`), 200);
  expect('user cannot delete a category', await alice.del(`/admin/categories/${catId}`), 403, 'FORBIDDEN');
  expect('delete the unused category', await admin.del(`/admin/categories/${catId}`), 200);
  check('gone from the public list', !(await anon.get('/categories')).body.data.some((c) => c._id === catId));
  expect('delete again', await admin.del(`/admin/categories/${catId}`), 404, 'CATEGORY_NOT_FOUND');
  const oddName = `Odd (name) [x] C++ ${stamp}`;
  const odd = await admin.post('/admin/categories', { name: oddName }); expect('names with regex characters are accepted', odd, 201);
  expect('...and duplicates of them are still caught (case-insensitive)', await admin.post('/admin/categories', { name: oddName.toLowerCase() }), 409, 'NAME_TAKEN');
  expect('an unbalanced bracket in a name does not break anything', await admin.post('/admin/categories', { name: `Broken ( [ ${stamp}` }), 201);
  expect('renaming to a name with regex characters works', await admin.patch(`/admin/categories/${odd.body.data._id}`, { name: `${oddName} v2` }), 200);
  for (const c of (await admin.get('/admin/categories')).body.data.filter((c) => /^(Odd \(name\)|Broken \()/.test(c.name) && c.name.includes(String(stamp)))) await admin.del(`/admin/categories/${c._id}`);

  section('Dashboard');
  const dash = await admin.get('/admin/dashboard');
  expect('dashboard', dash, 200);
  check('dashboard stats shape', typeof dash.body.data?.totalUsers === 'number' && typeof dash.body.data?.submissions?.pending === 'number');
} catch (err) {
  failures.push(`aborted: ${err.message}`);
  console.error('\nAborted:', err);
} finally {
  if (created.recipe) await admin.del(`/admin/recipes/${created.recipe}`).catch(() => {});
  if (created.blog) await admin.del(`/admin/blogs/${created.blog}`).catch(() => {});
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) { console.log(failures.map((f) => ` - ${f}`).join('\n')); process.exit(1); }
