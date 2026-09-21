import { redirect } from 'next/navigation';

export default function RootPage() {
  // This sends users to the dashboard automatically
  redirect('/dashboard');
}