import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Fun Scrum
        </h1>
        <p className="text-center text-lg">
          A fun and interactive planning poker tool for agile teams
        </p>
        <div className="mt-8 text-center">
          <Link href="/login" className="text-blue-500 hover:underline">
            Go to Login
          </Link>
          <span className="mx-2">|</span>
          <Link href="/admin" className="text-blue-500 hover:underline">
            Go to Admin
          </Link>
        </div>
      </div>
    </main>
  )
} 