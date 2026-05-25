
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tailor-Made Travel | Travel Lounge',
  description: 'Design your dream vacation with Travel Lounge. We specialize in bespoke, personalized itineraries tailored to your unique preferences.',
};

export default function TailorMadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
