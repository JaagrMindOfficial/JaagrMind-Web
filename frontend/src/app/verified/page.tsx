'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function VerifiedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-zinc-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Email Verified!
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Your email address has been successfully verified. You can now sign in to your account.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            Continue to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
