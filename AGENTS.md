# 项目协作规范

本文件适用于所有参与本项目的开发者与 AI 编码代理。新增或修改代码时，必须遵守以下命名规范，并优先保持同一模块内的命名一致。

## 命名规范

| 类型 | 规范 | 示例 |
| --- | --- | --- |
| Python 文件 | `snake_case.py` | `profile_extractor.py` |
| Python 文件夹 | 小写；多单词使用 `snake_case` | `schemas/`, `memory_services/` |
| Python 类 | `PascalCase` | `CandidateProfile` |
| Python 函数 | `snake_case` | `extract_profile_from_text()` |
| Python 变量 | `snake_case` | `resume_text` |
| Python 常量 | `UPPER_SNAKE_CASE` | `MAX_RESUME_TEXT_LENGTH` |
| JavaScript 文件 | 小写；职责后缀使用点分隔 | `memory.repository.js` |
| TypeScript 文件 | 小写；多单词使用 `kebab-case` | `memory-service.ts` |
| JavaScript/TypeScript 变量 | `camelCase` | `resumeText` |
| JavaScript/TypeScript 函数 | `camelCase` | `importProfileFromText()` |
| JavaScript/TypeScript 常量 | `UPPER_SNAKE_CASE` | `MAX_RESUME_TEXT_LENGTH` |
| TypeScript 类型与接口 | `PascalCase` | `CandidateProfile` |
| React 组件及组件文件 | `PascalCase` | `CandidateProfileCard.tsx` |
| API 路径 | 小写 + 短横线 | `/api/v1/profiles/import-text` |
| Git 分支 | 各路径段小写 + 短横线；使用用途前缀 | `feature/profile-import` |

## 执行要求

- 使用清晰、完整、能够表达业务含义的英文名称，避免无意义缩写和拼音。
- 同一个概念在数据库、后端、API 和前端中应使用一致的核心词汇。
- 布尔变量和函数优先使用 `is`、`has`、`can`、`should` 等前缀，例如 `isActive`、`hasMemory`。
- API 路径使用名词表达资源，动作仅用于无法自然表达为资源的操作。
- 不得仅为符合新规范而擅自修改既有公共 API、数据库字段或外部协议；确需修改时应同步迁移调用方并说明兼容性影响。
- 创建新文件或标识符前，先检查相邻模块的命名，避免同一概念出现多个不同名称。
