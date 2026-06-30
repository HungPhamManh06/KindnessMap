const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const systemInstruction = `Bạn là trợ lý AI của KindnessMap Việt Nam - Bản Đồ Việc Tốt.
Nhiệm vụ: trả lời thân thiện, ngắn gọn bằng tiếng Việt; hướng dẫn người dùng đăng bài việc tốt, xem bản đồ, xem câu chuyện, đăng nhập, tích điểm, dùng trang admin nếu họ có quyền.
Không bịa đặt dữ liệu nội bộ. Nếu không chắc, hãy đề nghị người dùng kiểm tra lại trên trang tương ứng.`;

const readGeminiApiKey = () => {
  // Correct config: GEMINI_API_KEY=<api-key>
  let key = process.env.GEMINI_API_KEY || '';

  // Tolerate common Render mistake: VALUE contains "GEMINI_API_KEY=<api-key>".
  if (!key) {
    const envValueWithPrefix = Object.values(process.env).find(
      (value) => typeof value === 'string' && value.trim().startsWith('GEMINI_API_KEY=')
    );
    if (envValueWithPrefix) key = envValueWithPrefix;
  }

  key = String(key).trim();
  if (key.startsWith('GEMINI_API_KEY=')) {
    key = key.slice('GEMINI_API_KEY='.length).trim();
  }

  // Remove accidental quotes/spaces/newlines copied from dashboards.
  return key.replace(/^['"]|['"]$/g, '').trim();
};

const chatWithGemini = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung cần hỏi chatbot.' });
    }

    const apiKey = readGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ message: 'Máy chủ chưa cấu hình GEMINI_API_KEY.' });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const safeHistory = Array.isArray(history) ? history.slice(-8) : [];

    const contents = [
      ...safeHistory.map((item) => ({
        role: item.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(item.text || '').slice(0, 1200) }]
      })),
      {
        role: 'user',
        parts: [{ text: String(message).slice(0, 2000) }]
      }
    ];

    const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 700
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(response.status).json({
        message: data?.error?.message || 'Không thể kết nối Gemini API.'
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim();

    res.status(200).json({
      reply: reply || 'Mình chưa có câu trả lời phù hợp. Bạn có thể hỏi lại rõ hơn không?'
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Có lỗi khi chatbot xử lý yêu cầu.' });
  }
};

module.exports = { chatWithGemini };
