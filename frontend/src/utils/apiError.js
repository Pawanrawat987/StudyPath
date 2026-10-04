// Turns an Axios error into { message, fields } for display in forms.
export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (!error?.response) return { message: 'Unable to reach the server. Please try again.', fields: {} };
  return { message: data?.message || fallback, fields: data?.details || {} };
}