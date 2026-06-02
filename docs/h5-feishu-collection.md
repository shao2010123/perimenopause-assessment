# 手机端 H5 问卷与飞书回收部署说明

## 已创建的飞书回收表

- 多维表格名称：更年期智能体问卷回收
- 多维表格链接：https://fcnc8g2zc10j.feishu.cn/base/B70ebq5NZabNDqszKATcQAWVnIe
- Base Token：`B70ebq5NZabNDqszKATcQAWVnIe`
- 数据表名称：问卷提交记录
- Table ID：`tblVMk0M7dvCXiv3`

## H5 提交流程

1. 用户通过 H5 链接进入问卷。
2. 用户完成问卷并生成报告。
3. 用户点击「保存PDF报告」时，前端先把报告快照提交到 `/api/submit-report`。
4. 服务端使用飞书应用凭证写入多维表格，并返回飞书记录 ID。
5. 前端生成 PDF 后，把 PDF 提交到 `/api/upload-report-pdf`。
6. 服务端使用飞书 OpenAPI 上传 PDF，并写入同一条记录的 `PDF报告` 附件字段。
7. 如果 PDF 生成或上传失败，问卷数据仍会保留在飞书表里，页面只提示 PDF 保存失败。

## 环境变量

复制 `.env.example`，在部署平台或服务器中配置：

```bash
FEISHU_APP_ID=你的飞书应用 App ID
FEISHU_APP_SECRET=你的飞书应用 App Secret
FEISHU_BASE_TOKEN=B70ebq5NZabNDqszKATcQAWVnIe
FEISHU_TABLE_ID=tblVMk0M7dvCXiv3
FEISHU_PDF_FIELD_ID=fldhA2xBzb
FEISHU_HTML_FIELD_ID=fldJYY5wWx
FEISHU_CLI_FALLBACK=0
PORT=4173
```

不要把 `FEISHU_APP_SECRET` 放进前端代码或公开仓库。

正式云端部署必须配置 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET`。`FEISHU_CLI_FALLBACK=0` 表示云端不会尝试调用本机 `lark-cli` 登录态。

## 本地运行

```bash
npm run build
npm start
```

启动后访问：

```text
http://localhost:4173/
```

## Render 部署

项目已包含 `render.yaml`。推荐流程：

1. 把项目上传到 GitHub 仓库。
2. 在 Render 选择 New + Blueprint，并选择这个仓库。
3. Render 会读取 `render.yaml`，自动使用：
   - Build Command：`npm ci && npm run build`
   - Start Command：`npm start`
   - Health Check：`/`
4. 在 Render 的 Environment 页面填入：
   - `FEISHU_APP_ID`
   - `FEISHU_APP_SECRET`
5. 部署完成后，Render 分配的 HTTPS 地址就是正式问卷入口。

## Railway 部署

项目已包含 `railway.json`。推荐流程：

1. 把项目上传到 GitHub 仓库。
2. 在 Railway 选择 Deploy from GitHub repo。
3. Railway 会读取 `railway.json`，自动使用：
   - Build Command：`npm ci && npm run build`
   - Start Command：`npm start`
4. 在 Railway Variables 中填入：
   - `FEISHU_APP_ID`
   - `FEISHU_APP_SECRET`
   - `FEISHU_BASE_TOKEN=B70ebq5NZabNDqszKATcQAWVnIe`
   - `FEISHU_TABLE_ID=tblVMk0M7dvCXiv3`
   - `FEISHU_PDF_FIELD_ID=fldhA2xBzb`
   - `FEISHU_HTML_FIELD_ID=fldJYY5wWx`
   - `FEISHU_CLI_FALLBACK=0`
5. 部署完成后，Railway 分配的 HTTPS 地址就是正式问卷入口。

## 通用对外发布

把本项目部署到支持 Node.js 的服务器或平台，启动命令使用：

```bash
npm run build && npm start
```

部署完成后，用户填写入口就是部署域名的首页，例如：

```text
https://你的域名/
```

需要强制清空当前浏览器旧记录时，可以使用：

```text
https://你的域名/?reset=1
```
