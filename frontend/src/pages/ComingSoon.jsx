import Button from '../components/Button.jsx';

export default function ComingSoon({ title }) {
  return (
    <section className="mx-auto flex flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-4 text-slate-600">This page is not available yet.</p>
      <div className="mt-8">
        <Button to="/" variant="secondary">
          Back to home
        </Button>
      </div>
    </section>
  );
}
