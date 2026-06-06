import { notFound } from "next/navigation";

// In a real implementation, we fetch data on the server component
// Let's create a Server Component for SEO and speed

export default async function EmployerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    // Note: since this is a Server Component, we should fetch directly or use a fetch wrapper that works in Server Components.
    // For now we'll mock the fetch logic with standard fetch if we have an API base URL, or we assume a server-side service exists.
    // However, since we're generating the frontend in Next.js app router, let's just make it a Client Component for simplicity,
    // OR fetch data from the NestJS backend if we know the URL.
    
    return <EmployerProfileClient id={id} />;
  } catch (error) {
    notFound();
  }
}

// Just to avoid complex server-side fetch logic with cookies right now, I'll use a Client Component
import EmployerProfileClient from "./EmployerProfileClient";
