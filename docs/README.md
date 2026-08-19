# 文档内容

此目录保存 Fumadocs 站点的 MDX 内容。当前 Agent Skills 中文文档仅作为内容结构和组件用法示例，并不代表官方网站。

## 编写与预览

在仓库根目录运行：

```powershell
pnpm install
pnpm dev
```

页面顺序由本目录及子目录的 `meta.json` 控制。站点名称、地址、仓库链接和功能开关位于 `src/site.config.ts`。

提交前运行：

```powershell
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e
```

保留示例内容时，请同时保留 `docs/LICENSE` 和仓库根目录的 `ATTRIBUTION.md`。
