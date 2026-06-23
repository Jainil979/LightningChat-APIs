// middleware/sanitizers.js

function safeTrim(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function capitaliseFirst(value) {
  if (!value || value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function sanitizeSignupBody(body) {
  if (body.firstName) body.firstName = capitaliseFirst(safeTrim(body.firstName));
  if (body.lastName)  body.lastName  = capitaliseFirst(safeTrim(body.lastName));
  if (body.email)     body.email     = safeTrim(body.email).toLowerCase();
}

export function sanitizeLoginBody(body) {
  if (body.email) body.email = safeTrim(body.email).toLowerCase();
}