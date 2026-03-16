import './globals.css';
import AuthProvider from '@/components/AuthProvider';

export const metadata = {
  title: 'TNEC Marketing - Quản lý Công việc',
  description: 'Hệ thống quản lý công việc phòng Marketing TNEC',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
