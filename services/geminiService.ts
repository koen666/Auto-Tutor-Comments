import { GoogleGenAI } from "@google/genai";
import { StudentRow } from "../types";

const SYSTEM_INSTRUCTION = `You are a senior high school teaching assistant (Math & Physics).
I will provide you with a JSON object representing ONE student's data row.
Your task is to:
1. **Analyze the Row**: Intelligently identify which fields correspond to 'Score/Grade', 'Subject', 'Lesson Content', and 'Student Name'.
2. **Focus on Column '{TARGET_COLUMN}'**: This column contains a 'Keyword' (the student's weak point) OR it might be empty.
3. **Generate a Comment**: Write a 50-100 word comment to replace the content of '{TARGET_COLUMN}'.
4. **Tone & Logic**:
   - **High Score**: Challenge them. Tone: 'Excellent, aim for perfection.' Structure: Praise -> Point out the keyword as the final hurdle -> Actionable advice based on lesson content.
   - **Mid Score**: Encourage them. Tone: 'Good base, fix this weakness.' Structure: Affirmation -> Identify keyword as the main blocker -> Specific review task.
   - **Low Score**: Support them. Tone: 'Back to basics, patience.' Structure: Reassurance -> Emphasize keyword as a foundation -> Basic practice advice.
5. **Output**: Return ONLY the comment text. No JSON, no quotes.

**Few-Shot Examples (Strictly follow this style):**

Example 1 (Math - High Score):
Input Context: Score 115, Keyword '导数极值点偏移', Lesson '构造函数法'
Output: 这次测验115分，整体手感维持得很棒！但在压轴题的“导数极值点偏移”上还不够老练，这正是你突破140分的最后一道坎。今晚务必结合上课讲的“构造函数法”，把那道错题重新推导一遍过程，期待你下次完美通关！

Example 2 (Physics - Mid Score):
Input Context: Score 65, Keyword '受力分析整体法', Lesson '连接体问题'
Output: 这次物理及格了，说明基础概念有了起色。现在最大的拦路虎就是“受力分析整体法”，这块不弄懂，后面的连接体问题很难得分。今晚别做新题，先把课上讲的那两个例题盖住答案重做一遍，一定要画对受力图！

Example 3 (Math - Low Score):
Input Context: Score 42, Keyword '诱导公式', Lesson '单位圆性质'
Output: 分数暂时不理想没关系，我们先沉下心来解决基础问题。你目前在“诱导公式”上的混淆非常明显，这是三角函数的基石。请务必回归课本，结合今天讲的单位圆画图记忆，先保证简单的公式变换不丢分，我们可以一步步来。`;

export const generateComment = async (
  row: StudentRow,
  targetColumn: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API_KEY is missing in environment variables.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Inject the target column name into the system instruction for context
    const specificSystemInstruction = SYSTEM_INSTRUCTION.replace(/{TARGET_COLUMN}/g, targetColumn);

    const prompt = `Row Data: ${JSON.stringify(row)}\nTarget Column Name: ${targetColumn}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Updated to recommended model for text tasks
      contents: prompt,
      config: {
        systemInstruction: specificSystemInstruction,
        temperature: 0.7, // Balance creativity with consistency
      }
    });

    return response.text?.trim() || "Error: AI returned empty response.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Extract meaningful error message
    let errorMessage = error.message || JSON.stringify(error);
    
    if (errorMessage.includes("429")) {
      return "Error (429): Rate Limit Exceeded. Slowing down...";
    }
    if (errorMessage.includes("403")) {
      return "Error (403): Invalid API Key or location restricted.";
    }
    if (errorMessage.includes("400")) {
      return "Error (400): Bad Request (Check prompt size).";
    }

    return `Error: ${errorMessage.substring(0, 50)}...`;
  }
};