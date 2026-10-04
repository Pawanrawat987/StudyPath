export default function FormField({ label, error, id, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? 'border-red-500' : 'border-slate-300'
        }`}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}