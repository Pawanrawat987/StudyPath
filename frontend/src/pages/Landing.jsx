import Button from '../components/Button.jsx';

export default function Landing() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">StudyPath</h1>
      <p className="mt-6 text-lg text-slate-600">
        Identify your learning gaps through topic-wise assessment, then close them with
        structured revision and clear performance tracking.
      </p>
      <div className="mt-10 flex gap-4">
        <Button to="/login">Login</Button>
        <Button to="/register" variant="secondary">
          Register
        </Button>
      </div>
    </section>
  );
}
