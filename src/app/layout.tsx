import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PetMatch Home Score',
  description:
    'Evaluate how suitable a property is for a homebuyer\'s pets — powered by AI and neighborhood data.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
