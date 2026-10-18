# Cloudflare Pages 部署（本仓库）

本教程对应 `ShiXinqiang/MoonTV` 的 `main` 分支。先完成密码访问版：不需要服务器，也不需要数据库；收藏和播放记录保存在当前浏览器。需要多设备同步和管理后台时，再做下面的 D1 步骤。

此版本沿用现有 Next.js 14 / `next-on-pages` 架构。`next-on-pages` 已停止维护；这份教程用于部署此仓库，不代表它是 Cloudflare 对新项目的推荐架构。后续升级框架时应一起评估 Workers 迁移。

## 1. 创建 Pages 项目

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)。
2. 打开 **Workers 和 Pages（Workers & Pages）→ 创建应用程序（Create application）→ Pages → 导入现有 Git 仓库**。有些界面需先点击页面下方的 **Get started / Looking to deploy Pages?**。
3. 连接 GitHub，选择账号 `ShiXinqiang` 和仓库 `MoonTV`。如果列表里找不到仓库，在 GitHub 授权设置里允许 Cloudflare 访问这个仓库即可。
4. 按以下内容填写：

| 项目         | 填什么                                             |
| ------------ | -------------------------------------------------- |
| 项目名称     | `shixinqiang-moontv`；已被占用时用你自己的唯一名称 |
| 生产分支     | `main`                                             |
| 框架预设     | `None / 无`                                        |
| 构建命令     | `pnpm run pages:build`                             |
| 构建输出目录 | `.vercel/output/static`                            |
| 根目录       | 留空                                               |

选择 **Pages**。如果页面要求填写“部署命令 / Deploy command”，说明进入了 Workers 创建流程，应返回选择 Pages。不要选 Next.js 静态导出预设：本项目需要登录和搜索 API。

如果项目名称不是 `shixinqiang-moontv`，同时把仓库根目录 `wrangler.toml` 的 `name` 改为你选的名称，再部署。

## 2. 添加变量并部署

在创建页的“环境变量（高级）”或项目的 **设置 → 变量和机密** 中填写：

| 名称           | 值                 | 说明                                            |
| -------------- | ------------------ | ----------------------------------------------- |
| `NODE_VERSION` | `22`               | 构建使用 Node.js 22                             |
| `PNPM_VERSION` | `10.12.4`          | 与仓库锁文件配套                                |
| `PASSWORD`     | 自己设置一个长密码 | MoonTV 访问密码，不是 Cloudflare 或 Google 密码 |

`PASSWORD` 请选择 **Secret / 加密**，不要写进 GitHub。只给生产环境配置真实密码；如需开放预览部署，为预览环境另外设置密码。

然后点击 **保存并部署（Save and Deploy）**。Pages 会自动安装依赖，再运行构建命令。仓库中的 `wrangler.toml` 已声明输出目录、兼容日期和 `nodejs_compat`，无需手动补兼容标志。

如果创建页只能添加普通文本变量，先只添加 Node 和 pnpm 两项。首次部署后进入项目设置添加加密 `PASSWORD`，再点击 **部署 → 最新部署 → 重试部署（Retry deployment）**。未设置密码时，站点会显示配置提醒。

成功后打开 Cloudflare 分配的 `https://你的项目名.pages.dev`，输入自己设置的 `PASSWORD`。这个基础版本只需要密码，没有管理员账号或管理后台。

## 3. 可选：D1 数据库、跨设备同步和管理后台

1. Cloudflare 左侧 **存储和数据库 → D1 SQL 数据库 → 创建数据库**，建议名称 `moontv-db`。
2. 打开数据库的控制台 / Explore Data，复制 [d1/0001-init.sql](../d1/0001-init.sql) 中的 SQL，运行全部语句。脚本仅创建不存在的表和索引，不删除已有数据。
3. 复制数据库的 **Database ID**。在 GitHub 编辑根目录 `wrangler.toml`，在文件末尾追加下面的内容，将 `粘贴你的Database-ID` 换成实际 ID：

```toml
[vars]
NEXT_PUBLIC_STORAGE_TYPE = "d1"
NEXT_PUBLIC_ENABLE_REGISTER = "false"

[[d1_databases]]
binding = "DB"
database_name = "moontv-db"
database_id = "粘贴你的Database-ID"
migrations_dir = "d1"
```

4. 在 Pages **生产环境**的变量和机密中，添加 `NEXT_PUBLIC_STORAGE_TYPE=d1` 和 `NEXT_PUBLIC_ENABLE_REGISTER=false`，保证构建时和运行时配置一致；再添加加密 `USERNAME=admin` 和加密 `PASSWORD=你自己设置的管理员密码`。不要把 `NEXT_PUBLIC_` 变量当作秘密，它们会进入前端代码。
5. 重新部署。使用账号 `admin` 和设置的密码登录，访问 `/admin` 管理站点。

本仓库使用 Wrangler 文件管理资源绑定，因此 D1 绑定应修改上面的文件，不要只在控制台添加一个名为 `DB` 的文本变量。生产环境默认关闭用户自助注册，站长可在后台管理用户。预览环境如需 D1，单独配置测试数据库，避免与生产数据混用。

## 4. 常见问题

| 现象                                              | 处理                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| 找不到 MoonTV 仓库                                | 检查 Cloudflare 的 GitHub 应用是否被授予此仓库权限                    |
| 要求填写 Deploy command，或报 Missing entry-point | 进入了 Workers 流程；回到 Pages 创建项目                              |
| 找不到输出目录                                    | 构建命令填写 `pnpm run pages:build`，输出填写 `.vercel/output/static` |
| 锁文件或 pnpm 版本错误                            | 设置 `PNPM_VERSION=10.12.4`，使用 `main` 的最新提交后重试             |
| 提示未配置密码                                    | 在生产环境添加加密 `PASSWORD`，然后重新部署                           |
| 提示未找到 D1 绑定 DB                             | 检查 `wrangler.toml` 中的绑定名、Database ID，并重新部署              |
| D1 报 no such table                               | 打开相同的数据库，执行 `d1/0001-init.sql`                             |
| 修改变量后没有变化                                | 保存变量后必须重新部署，尤其是 `NEXT_PUBLIC_` 开头的变量              |
| 网站可以打开，但某个来源无法播放                  | 部署成功不代表第三方来源可用；检查来源接口、地区可达性和视频地址      |

构建日志若出现失败，请提供最后一段错误日志；不要附带密码或令牌。之后向 `main` 提交代码会触发 Pages 自动重新部署。

## 官方参考

- [Pages 构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Pages 构建环境及版本变量](https://developers.cloudflare.com/pages/configuration/build-image/)
- [Pages Wrangler 配置](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [next-on-pages 状态及文档](https://github.com/cloudflare/next-on-pages)
