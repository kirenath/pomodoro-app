# Pomodoro App

个人使用的番茄钟,代码公开仅供参考。

基于 Next.js 16 + React 19 + Tailwind CSS 4,数据以 JSON 文件形式存储在服务器本地。

## 功能

- 番茄钟计时(工作/短休/长休,可自定义时长)
- 会话记录与统计图表
- 设置持久化(主题、时长、提示音等)
- 简洁的深色 UI

## 技术栈

- **框架**:Next.js 16(App Router)
- **UI**:React 19、Tailwind CSS 4、shadcn/ui、Base UI
- **图表**:Recharts
- **存储**:本地 JSON 文件(`data/settings.json`、`data/sessions.json`)
- **包管理**:pnpm

## 本地运行

```bash
pnpm install
pnpm dev
```

访问 <http://localhost:3000>。

## 目录结构

```txt
app/              # Next.js App Router 页面与 API
  api/            # JSON 持久化接口
  settings/       # 设置页
  stats/          # 统计页
components/       # UI 组件
  timer/          # 计时器
  stats/          # 统计图表
  settings/       # 设置表单
  ui/             # shadcn/ui 基础组件
lib/              # 业务逻辑
  pomodoro/       # 番茄钟状态机
  stats/          # 统计聚合
  storage/        # 文件读写
  audio/          # 提示音
data/             # 运行时 JSON 数据(已在 .gitignore)
```

## License

未声明 license,默认保留所有权利。
仅供学习参考,不建议直接拿去用。