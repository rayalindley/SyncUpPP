// app/event/[slug]/layout.tsx
import { createClient } from '@/lib/supabase/client'; // Adjust as needed
import { Metadata } from 'next';
import React from 'react';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('eventslug', params.slug)
    .single();

  const { data: organizationData } = await supabase
    .from('organizations')
    .select('*')
    .eq('organizationid', eventData.organizationid)
    .single();


    const faviconUrl = organizationData.photo
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${organizationData.photo}`
    : '/favicon.ico'; // Fallback to default favicon

  return {
    title: `${eventData.title} | ${organizationData?.name || 'SyncUp'}`,
    description: eventData.description,
    openGraph: {
      title: `${eventData.title} | ${organizationData?.name || 'SyncUp'}`,
      description: eventData.description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/e/${eventData.eventslug}`,
      images: eventData.eventphoto
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${eventData.eventphoto}`
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${organizationData.banner}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${eventData.title}`,
      description: eventData.description,
      images: eventData.eventphoto
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${eventData.eventphoto}`
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${organizationData.banner}`,
    },
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
    },
  };
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children} {/* This will render your client page inside this layout */}
    </div>
  );
}
