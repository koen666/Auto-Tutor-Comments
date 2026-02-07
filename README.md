
# Auto-Tutor Comments

面向教培/学校成绩表的「AI 评语自动生成」小工具：上传 Excel 成绩表 → 选择需要写评语的目标列 → 批量调用 Gemini 生成 50–100 字评语 → 导出为新的 Excel。

## 在线地址

- 线上演示：<http://ppwh.koen.top/>

## 主要功能

- 上传 Excel（`.xlsx` / `.xls`），自动读取第一张工作表
- 选择“目标列”（AI 会把该列内容视为「薄弱点关键词」列，并把生成的评语写回这一列）
- 批量生成评语（内置分批并发 + 轻微延时，降低 429 风险）
- 支持暂停 / 继续 / 停止
- 一键导出生成后的 Excel

## 技术栈

- Vite 6 + React 19 + TypeScript
- Zustand（状态管理）
- SheetJS/xlsx（Excel 读取与导出）
- @google/genai（Gemini API）

## 本地运行

### 1) 安装依赖

```bash
npm install
```

### 2) 配置 Gemini API Key

在项目根目录创建 `.env.local`（或任意 Vite 会加载的 `.env.*` 文件），写入：

```bash
GEMINI_API_KEY=你的key
```

说明：项目在构建时会把 `GEMINI_API_KEY` 注入前端（见 `vite.config.ts`），因此 **不要在公开网站中使用个人/高权限 Key**。如果要更安全的生产部署，建议改为服务端代理（把 Key 放后端）。

### 3) 启动开发服务器

```bash
npm run dev
```

默认地址：

- http://localhost:3000

## 使用方法

1. 打开页面，上传成绩表 Excel
2. 在 “Choose Target Column” 中选择要写评语的列
3. 点击 “Generate AI Comments” 开始批量生成
4. 生成过程中可 Pause / Resume / Stop
5. 点击 “Export” 导出结果（文件名以 `AutoTutor_` 开头）

## 构建与预览

```bash
npm run build
npm run preview
```

## 常见问题

- **提示 `Error: API_KEY is missing...`**
	- 没有配置 `GEMINI_API_KEY`，或本地环境文件未被加载。优先检查 `.env.local` 是否位于项目根目录。

- **`Error (429): Rate Limit Exceeded`**
	- 触发限流。可稍等片刻再试，或降低并发/增大批次间隔（当前默认每批 3 行，并在批次之间延时）。

- **`Error (403): Invalid API Key or location restricted`**
	- Key 无效、权限不足，或地区/项目限制导致不可用。请更换可用的 Gemini Key。

## 备注

- 当前实现会读取 Excel 的第一张工作表。
- 评语生成逻辑由提示词驱动（数学/物理助教风格，输出仅评语文本）。

