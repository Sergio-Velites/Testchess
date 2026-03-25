/**
 * Shared utility helpers
 */

// ── Toast notifications ───────────────────────────────────────
export function toast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  if (type === 'error')   el.style.borderLeftColor = '#f44336';
  if (type === 'success') el.style.borderLeftColor = '#4caf50';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('hide');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}

// ── Copy to clipboard ─────────────────────────────────────────
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return true;
  }
}

// ── Format date ───────────────────────────────────────────────
export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// ── Redirect helpers ──────────────────────────────────────────
export function requireAuth(sb) {
  sb.auth.getSession().then(({ data }) => {
    if (!data.session) window.location.href = '/';
  });
}

// ── Get profile for current user ─────────────────────────────
export async function getMyProfile(sb) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data } = await sb.from('users')
    .select('*')
    .eq('auth_id', session.user.id)
    .single();
  return data;
}

// ── Ensure profile row exists (called after sign-in/sign-up) ─
export async function ensureProfile(sb, user, username) {
  const { data: existing } = await sb.from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  if (existing) return existing;

  const uname = username || user.email.split('@')[0];
  const { data } = await sb.from('users')
    .insert({ auth_id: user.id, username: uname, email: user.email })
    .select()
    .single();
  return data;
}
