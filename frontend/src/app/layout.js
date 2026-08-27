import "./globals.css";
import LayoutWrapper from "../components/LayoutWrapper";

export const metadata = {
  title: "Meal Mate AI - Premium Personal AI Nutritionist",
  description: "AI-powered custom meal plans, calorie counting, and real-time nutritionist guidance.",
  icons: {
    icon: [
      { url: "/assets/logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
