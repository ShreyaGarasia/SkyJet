export function authHeaders(user, extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (user?.email) {
    headers['X-User-Email'] = user.email;
  }
  return headers;
}

export function isAdmin(user) {
  return user?.role === 'admin';
}

export function isCustomer(user) {
  return user && user.role !== 'admin';
}
