/** Copies the API's field-level validation errors onto a react-hook-form instance. Returns true if any matched. */
export function applyApiErrors(error, setError, knownFields) {
  let applied = false;
  for (const issue of error?.details ?? []) {
    const field = issue.path?.split('.')[0];
    if (field && knownFields.includes(field)) {
      setError(field, { type: 'server', message: issue.message });
      applied = true;
    }
  }
  return applied;
}
