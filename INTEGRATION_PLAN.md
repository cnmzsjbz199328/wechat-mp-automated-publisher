# 新数据源集成计划文档
## ScienceDaily · MIT Research News · APA Blog

> **版本**: v2.0（架构修订版）
> **日期**: 2026-03-02
> **状态**: 待审阅

---

## 一、现有项目三层架构（首先明确）

在制定任何计划之前，必须严格遵守项目已有的三层独立架构：

```
┌──────────────────────────────────────────────────────────────────┐
│  层 1：信息层（Information Layer）                                 │
│                                                                  │
│  职责：获取原始信息，输出标准 NewsItem[]。                          │
│  内部可以使用任何技术（RSS解析 / xAI API / NVIDIA Nemotron）。      │
│  对外契约：始终返回 NewsItem[]，不做任何翻译或词汇工作。             │
│                                                                  │
│  当前 4 个：                                                      │
│    FinanceProvider   → RSS → NewsItem[]                          │
│    NasaProvider      → RSS → NewsItem[]                          │
│    ArsProvider       → RSS → NewsItem[]                          │
│    GrokNewsProvider  → xAI API → NewsItem[]  ← 内部用了AI，但对外只输出NewsItem[]
│                                                                  │
│  新增 3 个（本计划实施对象）：                                      │
│    ScienceDailyProvider → RSS → NewsItem[]                       │
│    MITProvider          → RSS + Nemotron 内部 → NewsItem[]       │
│    APAProvider          → RSS + Nemotron 内部 → NewsItem[]       │
└──────────────────────────────────────────────────────────────────┘
                          │
                          ▼ NewsItem[] （7个信息源统一输出格式）
┌──────────────────────────────────────────────────────────────────┐
│  层 2：翻译层（Translation Layer）                                 │
│                                                                  │
│  TranslationService.translateBatch(news)                         │
│  → 调用 /v1/models/medium                                        │
│  → 就地写入 news[i].aiTranslation.{title, content}               │
│  → 对 7 个信息层输出：完全相同的处理方式                            │
└──────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│  层 3：词汇拓展层（Vocabulary Layer）                              │
│                                                                  │
│  AIService.processWithAI(news)                                   │
│  → 调用 Cloudflare @cf/meta/llama-3-8b-instruct                  │
│  → 返回 5 组英文词汇 vocab                                         │
│  → 对 7 个信息层输出：完全相同的处理方式                            │
└──────────────────────────────────────────────────────────────────┘
```

**设计原则**：三层相互独立，任意一层的改变不影响其他层。信息层的责任边界是明确的——只管生产 `NewsItem[]`。

---

## 二、三个新数据源的信息层设计

### 2.1 NewsItem 接口回顾（来自 `src/types/index.ts`）

```typescript
interface NewsItem {
    title: string;
    pubDate?: string;
    link?: string;
    source?: string;
    description?: string;
    imageUrl?: string | null;
    aiTranslation?: { title: string; content: string };
    aiAbstract?: string;   // 预留字段，当前未赋值，模板中 fallback 到 description
}
```

三个新 Provider 只需填充这些字段，无需新增任何类型。

---

### 2.2 ScienceDaily Provider（最简单）

**处理模式**：纯 RSS 解析，直接走 `BaseRssProvider`，无需任何额外处理。

**信息层输出**：5-10 条 `NewsItem[]`，每条 description 约 120 词，干净纯文本。

**字段映射**：
| RSS 字段 | NewsItem 字段 | 备注 |
|---|---|---|
| `<title>` | `title` | 直接使用 |
| `<pubDate>` | `pubDate` | 格式标准，无需替换 |
| `<link>` | `link` | 直接使用 |
| `<description>` | `description` | 无 HTML，直接使用 |
| (无) | `imageUrl` | `null`，RSS 无图片 |
| `'ScienceDaily'` | `source` | 固定值 |

**实现**：
```typescript
// src/services/news/sciencedaily.ts
export class ScienceDailyProvider extends BaseRssProvider {
    constructor() {
        super(RSS_SOURCES.SCIENCEDAILY, 'ScienceDaily');
    }
    // 无需覆盖任何方法，BaseRssProvider 已满足需求
}
```

**下游（翻译层 + 词汇层）**：与 FINANCE / ARS 完全相同，无差异。

---

### 2.3 MIT Research News Provider（Nemotron 内嵌）

**核心思路**：  
MIT RSS 每条新闻本质上是**一篇完整长文**（约 800-2000 词，带 HTML 标签）。  
Provider 的职责是从 RSS 候选池中随机选 1 篇，用 Nemotron 在内部将其拆解为 5 个部分，然后将这 5 个部分**映射为 5 个独立的 `NewsItem`** 对外输出。

**信息层输出**：始终为恰好 **5 条** `NewsItem[]`，每条对应原文的一个分解部分。

**处理流程（全部在 `fetchNews()` 内部）**：
```
1. 从 RSS 拉取最多 8 条文章（扩大候选池）
2. 用 pickByDate(items) 选出 1 篇
3. 清洗 description 中的 HTML 标签，得到纯文本（约 800-2000 词）
4. 调用 NvidiaService.decomposeArticle(纯文本, 'science')
   └─ Nemotron 返回: {"parts":[{index,title,body}×5]}
5. 将 5 个 parts 映射为 5 个 NewsItem 返回
```

**字段映射（parts → NewsItem）**：
| Nemotron 输出 | NewsItem 字段 | 备注 |
|---|---|---|
| `part.title` | `title` | Nemotron 生成的吸引人标题 |
| `part.body` | `description` | Nemotron 改写后的 150-250 词正文 |
| 原文 `link` | `link` | 5 条共用同一个原文链接 |
| 原文 `imageUrl` | `imageUrl` | 第 1 条填充，其余为 null（或 5 条共用） |
| 原文 `pubDate` | `pubDate` | 5 条共用 |
| `'MIT Research'` | `source` | 固定值 |

**关键设计**：  
5 个 `NewsItem` 就是 5 条"独立新闻"。下游的翻译层会翻译每条的 title 和 description，词汇层会从这 5 条内容中提取词汇。**下游层无需知道这 5 条是来自一篇文章的拆解。**

---

### 2.4 APA Blog Provider（Nemotron 内嵌，哲学版）

**与 MIT 完全相同的结构**，差异仅在两点：

1. **无需 HTML 清洗**（APA description 是纯文本）
2. **需要清除签名行**（每篇末尾附有 `"The post XXX first appeared on Blog of the APA."` ）：
   ```typescript
   const clean = raw.replace(/The post .+ first appeared on Blog of the APA\.\s*$/, '').trim();
   ```
3. **Nemotron 使用不同的 Prompt 模式**（`'philosophy'` 模式），强调：
   - 用日常类比解释抽象概念
   - 标题要引发好奇（如 "What Your Morning Coffee Says About Free Will?"）
   - 避免术语，对外行读者友好

**信息层输出**：恰好 **5 条** `NewsItem[]`，与 MIT 格式完全相同。

---

## 三、随机选文策略

### 推荐：日期确定性随机（Date-Seeded Selection）

**核心函数**（放入 `src/utils.ts`）：

```typescript
/**
 * 用当天的"年积日"（day-of-year）对候选数组取模，
 * 确保同一天内多次调用返回同一篇（对 Cron 重试安全），
 * 不同天自动轮换，无需 KV 存储。
 */
export function pickByDate<T>(items: T[]): T {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000);
    return items[dayOfYear % items.length];
}
```

**四种方案对比**：

| 方案 | 同天重试安全？ | 需要存储？ | 轮换规律？ | 结论 |
|---|---|---|---|---|
| `Math.random()` | ❌ 每次不同 | 否 | 随机 | ❌ 不适合 Cron |
| **日期确定性（推荐）** | ✅ 同天同篇 | 否 | 每天换篇 | ✅ 推荐 |
| KV 存储记录上次 | ✅ | 需要 KV Binding | 可控最大随机 | ⚠️ 过度设计 |
| 固定取第一篇 | ✅ | 否 | 无（每天最新） | ⚠️ 可能重复 |

---

## 四、NvidiaService 设计（信息层内部使用）

**文件**：`src/services/nvidia.ts`

NvidiaService 是 MIT Provider 和 APA Provider 的内部依赖，不暴露到信息层之外。

```typescript
export type DecomposeMode = 'science' | 'philosophy';

export interface DecomposedPart {
    index: number;
    title: string;
    body: string;
}

export class NvidiaService {
    private readonly endpoint =
        'https://unified-ai-backend.tj15982183241.workers.dev/v1/models/large/nvidia';

    /**
     * 将长文拆解为 5 个独立段落。
     * 内置重试（最多 2 次）+ fallback（均分原文）。
     */
    async decomposeArticle(text: string, mode: DecomposeMode): Promise<DecomposedPart[]>

    private buildMessages(text: string, mode: DecomposeMode): { role: string; content: string }[]
    private extractJson(raw: string): any    // 先 JSON.parse，退而找最大 {} 块
    private validate(parts: any[]): boolean  // 检查 parts.length === 5 且各字段非空
    private fallback(text: string): DecomposedPart[]  // 均分原文为 5 部分
}
```

**Prompt 设计（science 模式）**：
```
System: You are a professional science communicator transforming academic 
        research into engaging English content for WeChat Official Accounts.

User:   Split and rewrite the following article into EXACTLY 5 INDEPENDENT 
        ENGLISH SECTIONS. Each section: catchy BuzzFeed/Medium-style title, 
        150-250 word body, vivid and jargon-free. Output ONLY raw JSON:
        {"parts":[{"index":1,"title":"...","body":"..."},...]}
```

**Prompt 设计（philosophy 模式）**：
```
System: You are a philosophy communicator who makes complex ideas accessible 
        to general readers through vivid analogies and real-world examples.

User:   Split and rewrite the following philosophy article into EXACTLY 5 
        INDEPENDENT SECTIONS. Each section: curiosity-sparking title 
        (e.g. "What Chess Teaches Us About Free Will"), 150-250 word body 
        using everyday examples, zero jargon. Output ONLY raw JSON:
        {"parts":[{"index":1,"title":"...","body":"..."},...]}
```

---

## 五、文件变更清单

### 新增文件（5 个）

```
src/
  utils.ts                       ← pickByDate() 工具函数
src/services/
  nvidia.ts                      ← NvidiaService（仅信息层内部使用）
src/services/news/
  sciencedaily.ts                ← ScienceDaily Provider
  mit.ts                         ← MIT Research Provider（内嵌 Nemotron）
  apa.ts                         ← APA Blog Provider（内嵌 Nemotron）
```

### 修改文件（3 个，最小侵入）

```
src/services/news/index.ts       ← NewsFactory 新增 3 个 case（3行）
src/config/constants.ts          ← 新增 RSS_SOURCES 条目（3行）+ UNIFIED_AI 常量
wrangler.toml                    ← 新增 3 条 Cron 触发器 + scheduled() 3个case
```

> ⚠️ `src/index.ts` 的 `handleDomainLive()` **不需要修改**。  
> 7 个信息层输出相同的 `NewsItem[]`，翻译层和词汇层对所有域以相同逻辑处理。

---

## 六、NewsFactory 修改（最小改动示意）

```typescript
// src/services/news/index.ts —— 仅追加 3 个 case
static getProvider(domain: string, env: Env): NewsProvider {
    switch (domain) {
        case 'IMMIGRATION': return new GrokNewsProvider(env);
        case 'NASA':        return new NasaProvider();
        case 'ARS':         return new ArsProvider();
        /* ── 新增 ── */
        case 'SCIENCEDAILY': return new ScienceDailyProvider();
        case 'MIT':          return new MITProvider();
        case 'APA':          return new APAProvider();
        /* ─────────── */
        default:             return new FinanceProvider();
    }
}
```

---

## 七、Cron 计划扩展

```toml
[triggers]
crons = [
  # 现有 4 条（不变）
  "30 21 * * *",   # 08:00 Adelaide → FINANCE
  "45 21 * * *",   # 08:15 Adelaide → NASA
  "0 22 * * *",    # 08:30 Adelaide → ARS
  "15 22 * * *",   # 08:45 Adelaide → IMMIGRATION

  # 新增 3 条（追加在现有之后）
  "30 22 * * *",   # 09:00 Adelaide → SCIENCEDAILY
  "45 22 * * *",   # 09:15 Adelaide → MIT
  "0 23 * * *"     # 09:30 Adelaide → APA
]
```

新增3个对应的 `scheduled()` case，调用同一个 `handleDomainLive()` 函数。

---

## 八、微信文章标题规划

| 域名 | 微信文章大标题 |
|---|---|
| SCIENCEDAILY | `【科学前沿】ScienceDaily 每日科学速递` |
| MIT | `【MIT深读】${原文标题（截断至20字）}` |
| APA | `【哲思漫谈】${原文标题（截断至20字）}` |

---

## 九、实施步骤（按阶段）

### 阶段一：基础设施（无 AI，可独立测试）
- [ ] **Step 1** — 创建 `src/utils.ts`，实现 `pickByDate()`
- [ ] **Step 2** — 扩展 `src/config/constants.ts`，添加 3 个 RSS_SOURCES 和 UNIFIED_AI 常量
- [ ] **Step 3** — 创建 `src/services/news/sciencedaily.ts`
- [ ] **Step 4** — 注册进 `NewsFactory`，更新 `wrangler.toml` 和 `scheduled()`
- [ ] **Step 5** — 编译验证 `npx tsc --noEmit`，手动调用 `/sciencedaily-preview` 测试

### 阶段二：Nemotron 服务层
- [ ] **Step 6** — 创建 `src/services/nvidia.ts`（NvidiaService，含重试和 fallback）
- [ ] **Step 7** — 创建 `src/services/news/mit.ts`（MIT Provider，内嵌 NvidiaService）
- [ ] **Step 8** — 创建 `src/services/news/apa.ts`（APA Provider，内嵌 NvidiaService）

### 阶段三：注册与验证
- [ ] **Step 9** — 将 MIT / APA 注册进 `NewsFactory`，更新 `wrangler.toml` 和 `scheduled()`
- [ ] **Step 10** — 编译验证 `npx tsc --noEmit`
- [ ] **Step 11** — 手动调用 `/mit-preview` 验证 5 条 NewsItem 输出结构
- [ ] **Step 12** — 手动调用 `/apa-preview` 验证哲学内容拆分质量
- [ ] **Step 13** — 手动调用 `/mit-live` 和 `/apa-live` 验证微信草稿是否正常创建

---

## 十、风险与缓解

| 风险 | 可能性 | 缓解措施 |
|---|---|---|
| Nemotron 返回少于 5 部分 | 中 | NvidiaService 内置最多 2 次重试；兜底：均分原文 |
| MIT RSS description 中 HTML 清洗不完整 | 低 | 发送给 Nemotron 前先打印日志检查，测试阶段可视化 |
| APA 文章超出 Nemotron 最大 token 数 | 低 | Provider 层截断至前 3000 词再发送（约 4000 tokens） |
| 翻译层处理 Nemotron 输出时质量下降 | 低 | Nemotron 已生成高质量英文，翻译层做中文转换无影响 |

---

> **结论**：新 3 个数据源在架构上与现有 4 个完全对等——全部是信息层，全部输出 `NewsItem[]`，翻译层和词汇层无需感知数据来源的差异。Nemotron 的介入是信息层的**内部实现细节**，与 Grok API 在 IMMIGRATION Provider 内部被调用的性质完全一致。
