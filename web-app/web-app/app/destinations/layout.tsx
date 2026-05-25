import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Global Destinations | Travel Lounge',
  description: 'Explore our curated list of international and local destinations. From the beaches of Mauritius to the cities of Europe, your next adventure starts here.',
};

export default function DestinationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
