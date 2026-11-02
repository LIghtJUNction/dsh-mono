# pi → dsh migration

本集合把 pi 扩展中有用的使用场景迁移到 dsh，采用独立行为实现。`0.1.0` 是首版范围，不是完整 pi TUI 复刻，也不是加载原 pi 扩展的兼容层。以下按各插件首版 README 记录实际支持与迁移差异。

[返回 README](../README.md) · [机器可读清单](../plugins.json)

## 范围与选择依据

最终清单为十项，覆盖终端命令、文件操作、上下文和开发流程。LSP、analytics 与 PR 功能已由 dsh 原生提供，因此排除，避免重复建设。

这不是“十个最热门 pi 插件”排行榜。选择考虑迁移价值、职责边界和 dsh 已有能力；GitHub stars 只提供来源背景。

### 上游 stars 参考快照

以下数据引用[上游审计记录](upstream-audit.json)，抓取时间为 **2026-11-02T06:48:55.078Z（UTC）**。stars 是仓库级快照，只作来源背景；审计同时保留完整 commit 和许可证信息。

| 来源仓库 | stars | 审计 commit |
| --- | ---: | --- |
| [MasuRii/pi-rtk-optimizer](https://github.com/MasuRii/pi-rtk-optimizer) | 285 | [`d155d253cb`](https://github.com/MasuRii/pi-rtk-optimizer/commit/d155d253cb2f1358e34e717d47a82ebccb08cb8e) |
| [arpagon/pi-rewind](https://github.com/arpagon/pi-rewind) | 116 | [`91611ad879`](https://github.com/arpagon/pi-rewind/commit/91611ad87992fb7b635a41ba68f67916ff6e6ae3) |
| [coctostan/pi-hashline-readmap](https://github.com/coctostan/pi-hashline-readmap) | 105 | [`38ab735dd3`](https://github.com/coctostan/pi-hashline-readmap/commit/38ab735dd3739e8d0e4a41e5e0e009c6fd541535) |
| [narumiruna/pi-extensions](https://github.com/narumiruna/pi-extensions) | 754 | [`a0e0079303`](https://github.com/narumiruna/pi-extensions/commit/a0e0079303415a1eb0eb58f68538a593c58182e5) |
| [MattDevy/pi-extensions](https://github.com/MattDevy/pi-extensions) | 156 | [`86cbbbb1d6`](https://github.com/MattDevy/pi-extensions/commit/86cbbbb1d65eeca88ce2f820dd958301625e394c) |
| [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | 268,729 | [`ce7073d512`](https://github.com/deepseek-ai/deepseek-harness/commit/ce7073d51254c26cd63b22a60835b8f948deb447) |

其中 deepseek-harness 是目标 host 的核对来源，不计入 pi 插件来源。

排除项对应的原生实现：

- `pi-lsp`：packages/lsp/{lsp,lsp-stdio,tool-lsp}。
- `pi-github-pr`：experimental forge-github PR polling。
- `pi-analytics`：session-stats and experimental client-ui-stats。

## 首版支持与迁移差异

工具名、参数与完整示例见每个插件的独立 README；这里集中说明首版行为和与 pi 的主要差异。

| 插件与文档 | `0.1.0` 支持 | 边界与差异 |
| --- | --- | --- |
| [dsh-rtk-optimizer](../plugins/dsh-rtk-optimizer/README.md) · [pi 来源](https://github.com/MasuRii/pi-rtk-optimizer) | `rtk_rewrite` 提供命令建议，`rtk_compact` 显式压缩，`rtk_stats` 返回实例内字节统计；默认压缩 bash/shell 的模型可见 content，保留 canonical value 和退出状态。 | 不自动改写已派发命令，不执行建议命令；只有 rewrite 依赖本机 RTK，缺失时返回原命令。压缩限 ANSI、成功测试行与连续重复行，不截断；无完整上游语义过滤或 TUI。 |
| [dsh-rewind](../plugins/dsh-rewind/README.md) · [pi 来源](https://github.com/arpagon/pi-rewind) | `rewind` 支持 checkpoint/list/preview/restore；Git blob 与独立 refs 持久保存明确选定的文件，恢复前保存 redo；token 绑定文件、权限、HEAD 和分支，不改用户 index。 | 要求已有提交、具名分支的仓库根目录；每次 1–100 个现有文件、每文件 ≤1 MiB。不自动每轮快照，不恢复全仓库或会话，不跨分支/HEAD，不创建或删除目标。多文件恢复不是整批事务；preview 返回 base64 字节而非统一 diff。 |
| [dsh-file-context](../plugins/dsh-file-context/README.md) · [pi 来源](https://github.com/narumiruna/pi-extensions/tree/main/packages/pi-file-context) | `file_context_capture/get/diff` 保存不可变文本摘录和真实 Git diff；按工作区与 agent 隔离，支持 revision 检查。 | 最多 64 个内存快照，重启丢失；文件 ≤256 KiB，摘录 ≤500 行/50,000 字节。diff 要求仓库根目录及现有文本文件，不支持已删除或 untracked 文件。无文件写入、浏览器、外部编辑器或自动提示注入。 |
| [dsh-hashline](../plugins/dsh-hashline/README.md) · [pi 来源](https://github.com/coctostan/pi-hashline-readmap) | `hashline_read/edit` 使用整文件 SHA-256 revision 与 16 位十六进制行哈希，支持范围 replace、insert_after；保留 LF/CRLF、末尾换行习惯及普通权限位。 | 不替换 dsh 内置 read/edit；与上游三位 xxhash 锚点不兼容。限现有 UTF-8 文件 ≤1 MiB，拒绝混合换行；任意文件变化都须重读。无 readmap、AST、模糊定位、copy/move 或 TUI diff，不创建文件。 |
| [dsh-red-green](../plugins/dsh-red-green/README.md) · [pi 来源](https://github.com/MattDevy/pi-extensions/tree/main/packages/pi-red-green) | 用户明确要求 TDD 后，通过 `tdd_status/start/run/reset` 推进 RED → GREEN → REFACTOR → COMPLETE；固定测试命令与文件指纹绑定，RED 后锁定测试内容。 | 默认不启动；`userRequested` 是调用者声明。失败识别为文本/退出码启发式，非完整报告解析器；所有跟踪文件须已存在。RED 的工具名守卫不是安全隔离，后续阶段为建议式约束。状态仅内存，无 Pi TUI、slash command 或手动跳过证据；Unix only。 |
| [dsh-compass](../plugins/dsh-compass/README.md) · [pi 来源](https://github.com/MattDevy/pi-extensions/tree/main/packages/pi-compass) | `codebase_map` 返回文件、包摘要和候选入口；`code_tour` 按路径关键词匹配并提取常见语言声明，支持 map revision 校验。 | 每次重新扫描，最多 1,000 文件/4,000 条目/深度 8；跳过隐藏项、符号链接及常见构建目录，不解析 gitignore。tour 最多 20 文件、每文件 15 行。revision 非全部源码内容哈希；无 AST、引用图、语义导览、持久缓存或自动注入。 |
| [dsh-recall](../plugins/dsh-recall/README.md) · [pi 来源](https://github.com/narumiruna/pi-extensions/tree/main/packages/pi-recall) | `recall_save/search/delete` 显式保存、检索、删除摘录；同 root 的 agent 共享 `.dsh-recall/records.json`，重启保留。搜索为忽略大小写的字面 AND 匹配，删除校验 revision。 | 不自动搜索/复制/总结会话，不迁移 pi 全局存储，不替代 dsh session-search。最多 200 条/4 MiB、单条 50,000 字节；明文保存，无自动提示注入。并发写锁忙时报错，崩溃残留锁需人工检查。 |
| [dsh-notes](../plugins/dsh-notes/README.md) · [pi 来源](https://github.com/narumiruna/pi-extensions/tree/main/packages/pi-notes) | `notes_list/read/create/update/delete` 管理 `.dsh-notes/notes` 与 `templates`；更新/删除校验内容 SHA-256 revision，创建拒绝覆盖，支持模板原文前缀。 | 限平面 ASCII `.md` 名称与单文件 256 KiB，无子目录、重命名、Pi TUI 或自动会话导出。删除永久生效；内容 revision 无法检测改后恢复原文。合作写锁不约束外部编辑器，崩溃残留锁不自动抢占。 |
| [dsh-dotenv](../plugins/dsh-dotenv/README.md) · [pi 来源](https://github.com/narumiruna/pi-extensions/tree/main/packages/pi-dotenv) | 显式配置 `path` 后，在初始化时用 Node `util.parseEnv` 加载一次；仅填充尚未定义的 `process.env`，保留已有空字符串。 | 默认不加载、不自动发现 `.env`、不读取 pi `--env-file`；root 默认是 host 的 `process.cwd()`。无 shell 执行或变量插值；消费者须在其后初始化，dispose 不撤销已加载值。修改后需新进程获得干净环境，不能向远程 world 注入。 |
| [dsh-caffeinate](../plugins/dsh-caffeinate/README.md) · [pi 来源](https://github.com/narumiruna/pi-extensions/tree/main/packages/pi-caffeinate) | 跟踪运行中的 agent 集合，同一插件实例共享一个防休眠子进程；`caffeinate` 工具支持 status/enable/disable 和 revision 检查；最后 agent 空闲或卸载时释放。 | Linux 依赖 systemd-inhibit/logind，macOS 使用 caffeinate；无 Windows/WSL backend。display 模式受 compositor 策略影响，无门户 fallback。进程测试不证明 OS 实际防休眠或 macOS 设备验收；不跨实例/进程共享计数，无 Pi 菜单/状态栏。 |

### 共同的 host-local 边界

这些插件操作 dsh 进程所在主机的文件系统、环境或子进程，不会把操作自动映射到 remote world / sandbox，也不构成 OS 安全隔离。文件路径检查不能抵御恶意外部进程替换父目录的全部竞态。

文件工具通常从调用 agent 的 workingDirectory 取 root，无 agent 的直接调用须显式配置；dotenv 的 root 则默认取进程启动目录，caffeinate 控制的是 host 本身。平台、权限和路径限制以各插件 README 为准。

recall 的摘录与 notes 的笔记可进入模型工具结果；dotenv 的环境值虽不由该插件输出，仍对同进程插件和继承环境的子进程可见。Git 检查点、摘录和笔记都是持久数据，需按项目的数据保留规则管理。

## 用户迁移步骤

1. 确认 Node.js 24+ 与目标 dsh `0.2.1-rc.2`。原 pi 扩展配置不能直接视为 dsh 插件配置。
2. 按需要选择插件，阅读其独立 README 中的命令、参数、依赖和首版限制。
3. 按[快速开始](../README.md#quick-start)从源码检查并打包，安装 `.artifacts/packages/` 中的目标插件。
4. 未来使用 GitHub Release 时，下载并核验 `.tgz` 与 `SHA256SUMS`，再安装到目标 profile。
5. 在测试项目中运行该插件的最小示例，确认输出、文件变化和失败行为符合预期，再用于日常工作。

不应直接搬运 pi 的 hook、会话目录或 TUI 配置。若插件没有记录相应迁移方法，将其视为尚未支持，避免猜测配置键或数据格式。

## 开发者验收

本地统一入口：

```bash
npm ci && npm run check
npm run pack
npm run test:cli
```

根目录 `check` 负责并行本地检查；`pack` 先将十个包各自在独立临时目录安装，逐包验证真实 dsh ACTIVE 与工具注册（10/10 STANDALONE），再在一个十包合装 host 中验证 model → tool → model 往返；`test:cli` 使用独立 `DSH_HOME` 安装全部 tarball，检查 dump-config 中每包可见并启动 headless CLI。

本地检查覆盖以下交付要求：

- 安装包包含构建产物与插件声明，能够在目标 dsh host 加载。
- 最小用户操作能够产生文档描述的结果，并覆盖该插件关键失败场景。
- 实际命令、配置、默认值、路径和平台支持都有依据；与 pi 不同之处明确记录。
- 原始来源与许可证归属保留；发布资产、哈希与文档版本对应。

## 发布与安装的边界

插件仓库在 `v*` tag 上执行 `npm ci`、`npm run check`、`npm pack`，向 GitHub Release 上传 tarball 与 `SHA256SUMS`。根仓库的发布工作流只在 tag / 手动触发时汇总 artifacts。

当前统一版本为 `0.1.0`。普通源码提交与推送不创建 Release；发布需要另行打 `v*` tag。初次交付走本地 pack 安装，不要求发布 tag。不自动向 npm 发布，也不需要 npm token。
