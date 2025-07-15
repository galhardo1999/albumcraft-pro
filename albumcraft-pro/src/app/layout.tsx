import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlbumCraftPro - Criador de Álbuns Profissionais",
  description: "A ferramenta definitiva para fotógrafos criarem layouts de álbuns incríveis. Interface intuitiva, templates profissionais e exportação em alta qualidade.",
  keywords: "álbum de fotos, fotografia, design, layout, templates, profissional",
  authors: [{ name: "AlbumCraftPro Team" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
