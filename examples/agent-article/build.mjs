// 组装《让 agent 替你干长活》手绘风文章 HTML。
// 用法：node examples/agent-article/build.mjs  → 生成 article.html
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { diagCompare, diagPipeline, diagFlow, diagHabits, diagDeepcode, diagVscode } from './diagrams.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));

const card = (svg, cap, { rot = '-0.5deg', maxw = '880px' } = {}) => `
<figure class="sketch-card" style="--rot:${rot}; --maxw:${maxw};">
  <span class="tape tape-l"></span><span class="tape tape-r"></span>
  <div class="sketch-svg">${svg}</div>
  <figcaption>${cap}</figcaption>
</figure>`;

const html = `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>让 agent 替你干长活：不再是程序员的专属</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Noto+Serif+SC:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--paper:#fdfcf9;--paper2:#f6f3ea;--ink:#1a1a1a;--muted:#6b6b66;--accent:#b8503e;--teal:#2c5f6b;--rule:#dcd6c4;}
*{box-sizing:border-box;} html{scroll-behavior:smooth;}
body{margin:0;background:var(--paper);color:var(--ink);font-family:'Noto Serif SC','Songti SC',serif;line-height:1.85;
 background-image:radial-gradient(ellipse at top left,rgba(184,80,62,.04),transparent 45%),
 repeating-linear-gradient(transparent 0,transparent 38px,var(--rule) 39px,transparent 40px);}
.wrap{max-width:880px;margin:0 auto;padding:64px 28px 120px;}
header.hero{margin-bottom:48px;}
.stamp{display:inline-block;font-family:'Kalam',cursive;color:var(--accent);border:2px solid var(--accent);
 border-radius:3px;padding:3px 10px;font-size:14px;transform:rotate(-2deg);margin-bottom:18px;letter-spacing:1px;}
h1{font-family:'Kalam',cursive;font-weight:700;font-size:42px;line-height:1.25;margin:0 0 14px;}
.subtitle{font-size:18px;color:var(--muted);margin:0 0 22px;max-width:680px;}
.meta-line{font-size:14px;color:var(--muted);font-family:'JetBrains Mono',monospace;}
.meta-line code{background:var(--paper2);padding:1px 6px;border-radius:3px;}
section{margin:60px 0;}
.section-head{display:flex;align-items:baseline;gap:14px;margin-bottom:16px;}
.num{font-family:'Kalam',cursive;color:var(--accent);font-size:30px;font-weight:700;transform:rotate(-3deg);flex-shrink:0;}
h2{font-size:25px;margin:0;font-weight:700;}
p{font-size:17px;margin:0 0 16px;} .lede{font-size:18px;color:#3a3a37;}
strong{color:var(--accent);}
p code{font-family:'JetBrains Mono','Cascadia Mono',monospace;font-size:14px;background:var(--paper2);padding:1px 6px;border-radius:3px;color:#2b2b28;word-break:break-all;}
.callout{background:var(--paper2);border-left:3px solid var(--teal);padding:14px 18px;font-size:15.5px;color:#3c4e52;margin:20px 0;border-radius:2px;}
.sketch-card{position:relative;margin:30px auto;padding:22px 18px 14px;background:#fff;border:1px solid #e7e2d3;
 box-shadow:0 10px 24px -14px rgba(0,0,0,.35);transform:rotate(var(--rot));max-width:var(--maxw);width:100%;}
.sketch-svg svg{width:100%;height:auto;display:block;}
figcaption{text-align:center;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--muted);margin-top:10px;}
.tape{position:absolute;width:64px;height:22px;background:rgba(184,80,62,.22);border:1px solid rgba(184,80,62,.3);top:-12px;}
.tape-l{left:24px;transform:rotate(-7deg);} .tape-r{right:24px;transform:rotate(6deg);}
table.fit{width:100%;border-collapse:collapse;font-size:15.5px;margin:18px 0;}
table.fit th,table.fit td{border:1px solid var(--rule);padding:10px 12px;text-align:left;vertical-align:top;}
table.fit th{background:var(--paper2);font-family:'Kalam',cursive;font-weight:700;}
table.fit td.no{color:var(--accent);} table.fit td.yes{color:var(--teal);font-weight:700;}
footer{margin-top:80px;padding-top:24px;border-top:1px dashed var(--rule);font-size:14px;color:var(--muted);font-family:'JetBrains Mono',monospace;}
@media(max-width:600px){h1{font-size:30px;}.num{font-size:24px;}h2{font-size:20px;}}
</style></head><body><div class="wrap">

<header class="hero">
  <span class="stamp">CLI agent 日常实战</span>
  <h1>让 agent 替你干长活</h1>
  <p class="subtitle">很多人已经天天在用 AI，但用的是网页版的一问一答——复制粘贴，反复交代格式，聊长了还会失忆。AI 早就够聪明了，累的是<strong>用法</strong>。这篇想说：换成 agent，长任务会从"问答"变成"有人替你动手、还会积累"。而且，它早已不是程序员的专属。</p>
  <p class="meta-line">本文配图：<code>node build.mjs</code> 程序化生成 · 手绘风零文生图调用</p>
</header>

<section>
  <div class="section-head"><span class="num">01</span><h2>先认清痛点：长任务最磨人</h2></div>
  <p class="lede">不分行业，凡是<strong>又长、结构重复、还要不断碰文件</strong>的活儿，用网页版 AI 都会很累——整理长报告、归纳一摞资料、把几十段内容套成统一格式，都是同一种苦。</p>
  <p>问题不在 AI 笨，而在它<strong>够不着你的文件</strong>：每一段都要复制进去、把结果粘回来；格式每次重新交代；聊长了上下文被截断、开始失忆。人成了 AI 和文件之间的"搬运工"。</p>
  ${card(diagCompare(), '图 1 · 同一件事：网页 AI 里你在搬运，agent 里它替你动手', { rot: '-0.6deg', maxw: '1000px' })}
  <p><strong>举个具体例子。</strong>一位做医疗的朋友发来一份《寻常痤疮的临床鉴别诊断》——左边导航栏十几个并列条目：玫瑰痤疮、口周皮炎、蠕形螨病、须疮、皮脂腺增生……正是上面说的那种"长 + 重复 + 要套格式"的稿子。本文后面就拿它当例子，但你完全可以把它换成自己手头的长文档。</p>
  <div class="callout">一句话区别：网页 AI 是"更聪明的问答框"；agent 是"能动手、有记忆、可复用的协作者"。</div>
</section>

<section>
  <div class="section-head"><span class="num">02</span><h2>agent 到底比"问答"多了什么</h2></div>
  <table class="fit">
    <tr><th>能力</th><th>网页 AI（一问一答）</th><th>CLI Agent</th></tr>
    <tr><td>碰文件</td><td class="no">手动复制进、粘出来</td><td class="yes">直接读写本地文档 / 图片</td></tr>
    <tr><td>干长活</td><td class="no">每条目重开一轮，人当搬运</td><td class="yes">一句话跑完十几个条目</td></tr>
    <tr><td>统一格式</td><td class="no">每次重新交代排版</td><td class="yes">写一次 skill，永久复用</td></tr>
    <tr><td>记得住</td><td class="no">聊长了失忆、被截断</td><td class="yes">memory 跨会话续接</td></tr>
    <tr><td>会积累</td><td class="no">每次从零开始</td><td class="yes">文献库 / 产出沉淀下来</td></tr>
  </table>
  <p>别被"CLI"吓到：你不用写代码。你用<strong>自然语言</strong>指挥它，它替你去读写文件、跑流程。门槛只是"打开一个窗口、把话说清楚"。</p>
</section>

<section>
  <div class="section-head"><span class="num">03</span><h2>最佳流程：先固化"怎么做"，再让它反复做</h2></div>
  <p class="lede">很多人把 agent 当成"更强的聊天"，每次从头交代。真正的用法是<strong>四步走</strong>，把重复的部分一次性沉淀下来。</p>
  ${card(diagFlow(), '图 2 · 上手四步：装好 → 建项目 → 固化 skill → 跑长活', { rot: '0.4deg', maxw: '1000px' })}
  <p><strong>第 1 步 · 请进电脑。</strong>装好 CLI agent，第一次打开就是一个能对话的窗口——和聊天没两样，区别是它现在站在你的文件旁边。</p>
  <p>说得再具体些。<strong>CLI agent 不止一家</strong>——Claude Code、Gemini CLI、DeepSeek 官方适配的 DeepCode 等都属于这一类；下面以国内可直接用的 <strong>DeepCode CLI</strong> 为例，把"请进电脑 + 开项目"走一遍，换成别的 CLI 也是同样的三步。</p>
  ${card(diagDeepcode(), '图 · 以 DeepCode CLI 为例：装 → 配 Key → 启动，三步上手', { rot: '-0.4deg', maxw: '1000px' })}
  <p><strong>① 安装。</strong>DeepCode 是 DeepSeek 官方适配的开源终端 AI 助手，用 npm 全局装一次即可（需要 Node.js 18+）：<code>npm install -g @vegamo/deepcode-cli</code>，装完用 <code>deepcode --version</code> 验证。</p>
  <p><strong>② 配置 API Key。</strong>去 DeepSeek 开放平台领一个 API Key，写进配置文件 <code>~/.deepcode/settings.json</code>：填上 <code>API_KEY</code>、模型（如 <code>deepseek-v4-pro</code>）和接口地址 <code>https://api.deepseek.com</code>，还能开启深度思考、设置推理强度。这步记不住没关系——让 agent 自己帮你建这个文件也行。</p>
  <p><strong>③ 进项目、启动。</strong><code>cd 我的项目</code> 进到上面建好的文件夹，敲一句 <code>deepcode</code> 就进入对话界面：回车发送，<code>/</code> 打开技能菜单，<code>/new</code> 开新对话，<code>/exit</code> 退出。从此每次干活，进项目敲 <code>deepcode</code> 就行。</p>
  <p><strong>第 2 步 · 开个项目。</strong>建一个文件夹，把要处理的文档、图片、产出都放进去，这样 agent 能直接操作它们，而不是让你在聊天框里来回贴。但别一股脑全堆进去——怎么摆才好用，下一节专门说。</p>
  <p><strong>第 3 步 · 固化 skill。</strong>这是价值最高的一步：把"每个鉴别诊断条目整理成【定义 / 鉴别要点 / 与痤疮的区别】统一格式"这种做法<strong>写成一个 skill</strong>。以后每来一篇新稿，一句话调用，不用再交代格式。再配上 memory，记住他惯用的术语和偏好。</p>
  <p><strong>第 4 步 · 跑长活。</strong>剩下的交给它：十几个条目一次处理完，配图也一并程序化生成——比如你正在看的这几张手绘图，就不是文生图画的，是脚本现算现画的，可控、可复用。</p>
</section>

<section>
  <div class="section-head"><span class="num">04</span><h2>顺手养个好习惯：分类、命名、留版本</h2></div>
  <p class="lede">这一步很多人会忽略，但它直接决定 agent 好不好用：<strong>文件怎么摆，agent 就怎么找</strong>。摆得乱，它和你一样得翻半天、还容易拿错。</p>
  ${card(diagHabits(), '图 4 · 分好类、起好名，再加版本控制——好用又安全', { rot: '0.5deg', maxw: '1000px' })}
  <p><strong>先分类、再命名。</strong>别把文档、资料、图片、产出全倒进一个文件夹。哪怕只是粗分成「文献 / 稿件 / 产出 / 图片」几个子目录，再给文件起个见名知意的名字，agent 读取和调用时就能精准定位，不用满地翻。这本身就是好习惯的一部分。</p>
  <p><strong>分不清就让它帮你分。</strong>如果文件已经堆成一团、或者你拿不准该怎么归类，直接让 agent 看一遍现有文件、提一套分类方案,甚至替你把文件归位、批量重命名——这正是它擅长的活。</p>
  <p><strong>给文件留版本。</strong>养成版本控制的习惯（最常用的就是 git）：每改一轮存一个版本。这样哪怕某个文件被覆盖、被改错，你也能<strong>随时退回任意一个历史版本</strong>，不至于一夜回到解放前。让 agent 帮你跑这些保存、回退的操作就行，你不需要记命令。</p>
</section>

<section>
  <div class="section-head"><span class="num">05</span><h2>配个趁手的"显示器"：用 VS Code 看改动</h2></div>
  <p class="lede">留了版本，还得有个方便的地方去看和回退。<strong>纯在终端里看改动，对非程序员太不友好了</strong>——满屏文字，谁改了哪行根本看不清。换个图形化工具，体验立刻不一样。</p>
  ${card(diagVscode(), '图 · VS Code 里：改动标红标绿、版本一键回退、agent 对话和终端都在同一个窗口', { rot: '-0.4deg', maxw: '1000px' })}
  <p>最省心的选择是 <strong>VS Code</strong>（微软出的免费编辑器，也就是本文这些脚本所在的窗口）。它把你最需要的几件事装进了一个界面：</p>
  <p><strong>① 改动一眼可见。</strong>左边文件列表里，agent 改过的文件会标黄（M）、新建的会标绿（U）；点开文件，新增的行是绿底、删掉的行是红底，谁动了哪一行清清楚楚。</p>
  <p><strong>② 版本一键回退。</strong>侧边的「源代码管理」（Git）面板，能看到每一次改动的历史，点一下就能把某个文件退回上一个版本——前一节说的版本控制，在这里是图形化操作，不用记命令。</p>
  <p><strong>③ 对话和干活在一起。</strong>Claude Code、DeepCode 等都有 VS Code 扩展，agent 的对话面板就嵌在右侧。你一边看它改动、一边跟它说话，不用在多个窗口之间来回切。</p>
  <p>如果你连编辑器都不想装，<strong>GitHub Desktop</strong> 这类专门的图形化 Git 工具更轻量，只做"看历史、看改动、回退"一件事；而对内容创作者，最直观的其实是<strong>直接看产物</strong>——比如用浏览器打开生成的网页、在微信草稿箱里预览，看结果往往比看代码差异更实在。</p>
</section>

<section>
  <div class="section-head"><span class="num">06</span><h2>skill 不止一个：让它们接力</h2></div>
  <p class="lede">真正拉开差距的，是 skill 可以<strong>互相联动</strong>。网页 AI 每个环节都是孤岛；而 skill 之间能共享同一个文献库、彼此接力——前一个的产出，是后一个的输入。</p>
  ${card(diagPipeline(), '图 3 · 一条会积累的知识流水线：① 的产出喂给 ② 和 ③', { rot: '-0.5deg', maxw: '1000px' })}
  <p>以这位医生朋友为例，可以养三个互补的 skill：</p>
  <p><strong>① 文献阅读归档 skill</strong>——读皮肤科专著与论文，结构化存进"我的文献库"。一次建立，长期复用。</p>
  <p><strong>② 准确性审查 skill</strong>——拿文献库去校对《寻常痤疮的临床鉴别诊断》，逐条核对、把存疑处标红。</p>
  <p><strong>③ 新见解 / 新方向 skill</strong>——文献库叠加模型的世界知识，提出新的选题角度与研究方向。</p>
  <div class="callout">这一步，agent 就从"帮你排版"升级成了"会积累的个人科研助手"——这是一问一答永远到不了的地方。</div>
</section>

<section>
  <div class="section-head"><span class="num">07</span><h2>它改变的不是效率，是分工</h2></div>
  <p>用 agent 之后，重复劳动交给它，你只负责判断与决策：哪条鉴别要点存疑、哪个方向值得深挖。效率是副产品，真正变的是<strong>你和工具的分工</strong>。</p>
  <p>而这套方法不挑职业。医生整理文献、研究者梳理资料、写作者组织长稿——只要你的活儿"又长、又重复、还要碰文件"，agent 就比一问一答更合适。它早已不是程序员的专属。</p>
</section>

<footer>
  配图由 roughjs 程序化生成 · 全文零文生图 API 调用 · node output/agent-article/build.mjs
</footer>

</div></body></html>`;

const out = join(__dir, 'article.html');
writeFileSync(out, html, 'utf8');
console.log('OK', out);
