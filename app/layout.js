import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutShell from "./component/LayoutShell";
import ReduxProvider from "./redux/ReduxProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "College Attendance System",
    template: "%s | College Attendance System",
  },
  description:
    "Manage college attendance, academic batches, faculty allocations, and timetables.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ReduxProvider>
          <LayoutShell>{children}</LayoutShell>
        </ReduxProvider>
      </body>
    </html>
  );
}
