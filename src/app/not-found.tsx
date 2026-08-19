import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-sm text-fd-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">找不到页面</h1>
      <p className="text-fd-muted-foreground">
        你请求的页面不存在或已移动。
      </p>
      <Link
        href="/"
        className="rounded-lg border bg-fd-secondary px-4 py-2 text-sm font-medium hover:bg-fd-accent"
      >
        返回文档
      </Link>
    </main>
  );
}
