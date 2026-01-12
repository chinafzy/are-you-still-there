import './globals.css';

export const metadata = {
  title: 'Project Connection | 独居守护',
  description: '生命倒计时与独居平安守护系统',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased selection:bg-blue-100">
        {children}
      </body>
    </html>
  );
}
