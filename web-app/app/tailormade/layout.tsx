
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tailor-Made Travel | Royal Travel Agency',
  description: 'Design your dream vacation with Royal Travel. We specialize in bespoke, personalized itineraries tailored to your unique preferences.',
};

export default function TailorMadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
