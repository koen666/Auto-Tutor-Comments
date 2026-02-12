import { StudentRow } from "../types";

const QWEN_API_KEY = process.env.QWEN_API_KEY || "";
const QWEN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const QWEN_MODEL = "qwen-max-latest";

const SYSTEM_INSTRUCTION = `你是一位高中数学/物理老师，熟悉一线课堂与考试要求，正在为学生和家长撰写简洁、专业、可操作的学习评语。

## 核心原则
1. **用学生姓名开头**：从JSON中识别姓名字段，使用正式但亲切的称呼（如"王明"、"李婷"、"王同学"）
2. **说人话，别像AI**：用真实老师的语气，口语化但保持专业克制
3. **具体+走心**：不要空洞的鼓励，要结合'{TARGET_COLUMN}'列的薄弱点关键词给出可操作的学习建议（描述学生后续怎么做，面向家长可理解）
4. **因人而异**：根据分数段调整语气，但要自然变化，避免模板化
5. **术语贴合学科**：根据科目自动切换表述（数学偏概念/方法/题型，物理偏模型/过程/实验/受力）
6. **草稿关键词先“老师化”再落笔**：薄弱点关键词可能是老师/家长随手写的草稿（口语、冗长、甚至不规范），写评语时必须先转成课堂常用说法再使用；避免原样照抄生硬长词。
7. **反套话**：尽量避免固定句式（如“虽是…但…/下一步可尝试/稳步提升…”等），用更像真实老师的表达。

## 任务流程
1. 识别：学生姓名、成绩、科目、'{TARGET_COLUMN}'列的薄弱点关键词、最近课堂内容
2. 写评语（50-100字）：
  - **开头**：称呼学生+简要点评本次表现（面向家长）
  - **中间**：说明薄弱点是当前关键问题，并给出原因或现象描述
  - **结尾**：给出1-2条可执行的学习建议（描述长期/阶段性安排，不出现"今晚/今天"）

## 语气参考（不要生搬硬套）
- **高分(90+)**：肯定优势，指出提升空间 → "这次物理表现稳定，但仍有拔高空间..."
- **中等分(60-89)**：肯定努力，指出突破口 → "整体基础扎实，当前提升的关键在..."
- **低分(<60)**：温和客观，强调夯实基础 → "目前主要问题集中在...，先把基础打牢"

## 输出要求
- **纯文本**，不要JSON/引号/标签
- **必须用姓名**，如果找不到姓名就用"同学"
- **多样化表达**：同样的意思换着说，别每条都"这次xxx分"
- **防模板化**：避免固定句式开头，开头/中间/结尾至少各更换一种表述方式
- **不要表情符号**，不使用emoji或颜文字
- **不建议家长做什么**，建议只描述学生后续行动
- 当薄弱点来自草稿词时，优先用短、准、课堂化的关键词（8-14字左右），不要把草稿整句塞进评语。

---

**参考示例（仅供风格参考，不要照抄结构）：**

例1（高分）：
输入：Name '张伟', Math 115, Keyword '导数极值点偏移', Lesson '构造函数法'
→ 张伟同学这次数学发挥稳定，思路清晰，但压轴题的"导数极值点偏移"仍是主要短板，也是冲高分的关键。建议阶段性复盘相关错题，结合课堂的"构造函数法"整理解题步骤，形成稳定解题模板。

例2（中等分）：
输入：Name '李婷', Physics 65, Keyword '受力分析整体法', Lesson '连接体问题'
→ 李婷同学物理基础较扎实，但实验题和大题仍是当前薄弱环节，是拉开差距的关键。"受力分析整体法"在连接体问题中易出现思路卡顿，建议其分模块整理错题，重点梳理实验设计思路与受力步骤，提升解题稳定性。

例3（低分）：
输入：Name '王强', Math 42, Keyword '诱导公式', Lesson '单位圆性质'
→ 王强同学当前分数偏低，主要问题集中在"诱导公式"，这是三角函数的基础环节，若不稳固会影响后续题型。建议先回归课本，系统梳理单位圆性质与符号规律，夯实概念后再逐步过渡到简单应用题。`;

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 500;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const pickFirstString = (row: StudentRow, keys: string[]) => {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const guessStudentName = (row: StudentRow) =>
  pickFirstString(row, ["姓名", "Name", "name", "学生姓名", "学生", "同学"]) || "同学";

const guessLesson = (row: StudentRow) =>
  pickFirstString(row, ["课堂内容", "最近课堂内容", "Lesson", "lesson", "本周内容", "教学内容"]);

const inferSubjectFromTarget = (targetColumn: string) => {
  const col = (targetColumn || "").toLowerCase();
  if (col.includes("物理") || col.includes("physics")) return "物理";
  if (col.includes("数学") || col.includes("math")) return "数学";
  return "";
};

const teacherizeWeaknessDraft = (draft: unknown, subjectHint: string) => {
  if (draft == null) return "";
  const raw = String(draft).trim();
  if (!raw) return "";

  // Remove obvious draft suffixes and punctuation clutter
  let text = raw
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ")
    .replace(/(方面|问题|题目|题型)\s*$/g, "")
    .trim();

  // Common classroom-friendly rewrites
  text = text
    .replace(/找规律/g, "模型归纳")
    .replace(/滑块\s*木板/g, "滑块-木板")
    .replace(/滑块\s*\-\s*木板\s*模型/g, "滑块-木板相对运动模型")
    .replace(/滑块-木板模型/g, "滑块-木板相对运动模型")
    .replace(/模型归纳问题/g, "模型归纳")
    .replace(/受力分析整体法/g, "整体法受力分析")
    .replace(/受力分析隔离法/g, "隔离法受力分析")
    .replace(/最大最小值问题/g, "函数最值")
    .replace(/函数的最大最小值/g, "函数最值")
    .replace(/切线性质/g, "切线条件")
    .trim();

  // If still too long, compress by keeping core tokens
  if (text.length > 18) {
    text = text
      .replace(/(的|与|以及|并且|同时|虽然|但是|下一步|尝试|形成|提升|稳步)/g, "")
      .replace(/\s+/g, "")
      .trim();
  }

  // Add light subject-specific hint if missing (avoid adding new concepts)
  if (subjectHint === "物理" && text.includes("滑块-木板") && !text.includes("相对运动")) {
    text = text.replace("滑块-木板", "滑块-木板相对运动");
  }
  if (subjectHint === "数学" && text.includes("函数") && !text.includes("最值") && raw.includes("最大") && raw.includes("最小")) {
    text = text.replace(/函数/g, "函数最值");
  }

  return text;
};

export const generateComment = async (
  row: StudentRow,
  targetColumn: string
): Promise<string> => {
  if (!QWEN_API_KEY) {
    return "Error: Missing QWEN_API_KEY. Set it in .env.local.";
  }
  const specificSystemInstruction = SYSTEM_INSTRUCTION.replace(/{TARGET_COLUMN}/g, targetColumn);

  const subjectHint = inferSubjectFromTarget(targetColumn);
  const studentName = guessStudentName(row);
  const lesson = guessLesson(row);
  const weaknessDraft = row?.[targetColumn];
  const weaknessPolished = teacherizeWeaknessDraft(weaknessDraft, subjectHint);

  const promptPayload = {
    studentName,
    subjectHint,
    targetColumn,
    weaknessDraft,
    weaknessPolished,
    lesson,
    row
  };

  const prompt = [
    "请基于以下数据写评语：",
    JSON.stringify(promptPayload),
    "要求：优先使用 weaknessPolished 的课堂化表述；不要原样照抄 weaknessDraft 里的长句草稿。"
  ].join("\n");

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(QWEN_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${QWEN_API_KEY}`,
        },
        body: JSON.stringify({
          model: QWEN_MODEL,
          messages: [
            { role: "system", content: specificSystemInstruction },
            { role: "user", content: prompt },
          ],
          temperature: 0.85,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        if (response.status === 429 || response.status >= 500) {
          if (attempt < MAX_RETRIES - 1) {
            const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), 15000) + Math.random() * 1000;
            console.warn(`Qwen API ${response.status} (attempt ${attempt + 1}). Retry in ${Math.round(delay / 1000)}s...`);
            await sleep(delay);
            continue;
          }
        }
        return `Error (${response.status}): ${errBody.substring(0, 80)}`;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      return text || "Error: AI returned empty response.";
    } catch (error: any) {
      console.warn(`Qwen API attempt ${attempt + 1} failed:`, error.message);
      if (attempt < MAX_RETRIES - 1) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
        continue;
      }
      return `Error: ${(error.message || "").substring(0, 80)}`;
    }
  }
  return "Error: Max retries reached.";
};
