# 社区目录投稿

核对时间：2026-11-02T07:36:55.200Z。本轮向 [1024 插件目录](https://github.com/imsai-sh/awesome-deepseek-harness-plugins) 提交了十个独立插件，共十个 PR；当前 6 个已合并、4 个待处理。另外四个 PR 的机器人评论均确认静态校验通过，等待目标目录合并。状态是本次核验快照，后续以 PR 页面为准。

| 插件 | 收录 PR | 核对状态 |
| --- | --- | --- |
| [dsh-rtk-optimizer](https://github.com/LIghtJUNction/dsh-rtk-optimizer) | [#787](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/787) | 已合并，主分支条目已核对 |
| [dsh-hashline](https://github.com/LIghtJUNction/dsh-hashline) | [#788](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/788) | 静态校验通过，待合并 |
| [dsh-file-context](https://github.com/LIghtJUNction/dsh-file-context) | [#789](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/789) | 静态校验通过，待合并 |
| [dsh-rewind](https://github.com/LIghtJUNction/dsh-rewind) | [#790](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/790) | 已合并，主分支条目已核对 |
| [dsh-red-green](https://github.com/LIghtJUNction/dsh-red-green) | [#791](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/791) | 已合并，主分支条目已核对 |
| [dsh-compass](https://github.com/LIghtJUNction/dsh-compass) | [#792](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/792) | 静态校验通过，待合并 |
| [dsh-recall](https://github.com/LIghtJUNction/dsh-recall) | [#793](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/793) | 已合并，主分支条目已核对 |
| [dsh-notes](https://github.com/LIghtJUNction/dsh-notes) | [#794](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/794) | 已合并，主分支条目已核对 |
| [dsh-dotenv](https://github.com/LIghtJUNction/dsh-dotenv) | [#795](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/795) | 已合并，主分支条目已核对 |
| [dsh-caffeinate](https://github.com/LIghtJUNction/dsh-caffeinate) | [#796](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/796) | 静态校验通过，待合并 |

每个 PR 只新增一份 `catalog/plugins/*.json`，包含中英文功能描述。已使用目标仓库的校验器核对字段与变更范围，并读取各插件远端同一 Git tree 中的 `package.json` 和 `cordis.patch.yml`。所有插件均公开、采用 MIT，且已加 `dsh-plugin` 与 `deepseek-harness` GitHub topics。已合并项的主分支目录文件也已读取核实；这里不将 PR 合并等同于网站同步完成。

## 目录与安装

dsh 官方支持用户添加自定义插件索引，但[官方文档明确目前没有官方索引](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/plugin-market-bundle/README.md#known-limitations-and-deferred-work)。本轮投稿对象是社区目录。

1024 目录[允许未发布 npm 的插件先收录](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/blob/main/CONTRIBUTING.md)，显示仓库链接；其安装按钮只提供 npm 包。本批插件尚未发布 npm，因此本轮是浏览条目投稿。可用的本地构建安装步骤见[快速开始](../README.md#quick-start)。

另一个社区目录 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md) 要求仓库创建满一天。本批仓库在 2026-11-02 创建，本轮未向该目录发出不符合年龄要求的 PR。

插件行为和真实 dsh 安装验证见[本地验收记录](verification.md)，机器可读 PR 状态在 [community-submissions.json](community-submissions.json)。
