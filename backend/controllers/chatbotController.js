const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const systemInstruction = `Bạn là trợ lý AI của KindnessMap Việt Nam - Bản Đồ Việc Tốt.
Nhiệm vụ: trả lời thân thiện, ngắn gọn bằng tiếng Việt; hướng dẫn người dùng đăng bài việc tốt, xem bản đồ, xem câu chuyện, đăng nhập, tích điểm, dùng trang admin nếu họ có quyền.
Không bịa đặt dữ liệu nội bộ. Nếu không chắc, hãy đề nghị người dùng kiểm tra lại trên trang tương ứng.`;

const cleanEnvValue = (value = '', keyName = '') => {
  let result = String(value || '').trim();
  if (keyName && result.startsWith(`${keyName}=`)) {
    result = result.slice(`${keyName}=`.length).trim();
  }
  return result.replace(/^['"]|['"]$/g, '').trim();
};

const readEnvKey = (keyName) => {
  let key = process.env[keyName] || '';

  // Tolerate common Render mistake: VALUE contains "KEY_NAME=<api-key>".
  if (!key) {
    const envValueWithPrefix = Object.values(process.env).find(
      (value) => typeof value === 'string' && value.trim().startsWith(`${keyName}=`)
    );
    if (envValueWithPrefix) key = envValueWithPrefix;
  }

  return cleanEnvValue(key, keyName);
};

const getGeminiModelCandidates = () => {
  const configuredModel = String(process.env.GEMINI_MODEL || '')
    .trim()
    .replace(/^models\//, '');

  // Ưu tiên model nhẹ/mới. Nếu model bị quá tải, backend sẽ tự thử model tiếp theo.
  return [
    configuredModel,
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
  ]
    .filter(Boolean)
    .filter((modelName, index, arr) => arr.indexOf(modelName) === index);
};

const isQuotaError = (errorData = {}) => {
  const message = String(errorData?.error?.message || errorData?.message || '').toLowerCase();
  const status = String(errorData?.error?.status || errorData?.status || '').toLowerCase();
  return status.includes('resource_exhausted') || message.includes('quota') || message.includes('rate limit') || message.includes('too many requests');
};

const isTransientModelError = (status, errorData = {}) => {
  const message = String(errorData?.error?.message || errorData?.message || '').toLowerCase();
  return [429, 500, 502, 503, 504].includes(status)
    || isQuotaError(errorData)
    || message.includes('high demand')
    || message.includes('overloaded')
    || message.includes('temporarily')
    || message.includes('try again later')
    || message.includes('unavailable');
};

const localFallbackReply = (message = '') => {
  const text = String(message).toLowerCase();

  if (text.includes('ai') || text.includes('ghép nối')) {
    return 'Mình đang dùng chế độ dự phòng vì các model AI miễn phí đang bị giới hạn/quá tải. Để dùng AI Ghép Nối, bạn vào mục “AI Ghép Nối”, chọn nhu cầu hoặc nguồn lực của mình, hệ thống sẽ gợi ý kết nối phù hợp giữa người cần giúp và người có thể hỗ trợ.';
  }

  if (text.includes('đóng góp') || text.includes('nhiều bài') || text.includes('xếp hạng') || text.includes('top')) {
    return 'Mình đang dùng chế độ dự phòng vì model AI miễn phí đang bị giới hạn/quá tải. Bạn có thể xem người đóng góp nhiều bài nhất ở mục “Bảng Xếp Hạng”. Trang này hiển thị các công dân tích cực, điểm việc tốt và thành tích đóng góp.';
  }

  if (text.includes('đăng') || text.includes('ghim') || text.includes('bài')) {
    return 'Mình đang dùng chế độ dự phòng vì model AI miễn phí đang bị giới hạn/quá tải. Để đăng việc tốt, bạn bấm “Ghim Việc Tốt Của Bạn”, đăng nhập nếu được yêu cầu, điền tiêu đề, mô tả, địa điểm, ảnh minh hoạ rồi gửi. Bài sẽ hiển thị sau khi được duyệt.';
  }

  if (text.includes('bản đồ') || text.includes('map')) {
    return 'Mình đang dùng chế độ dự phòng vì model AI miễn phí đang bị giới hạn/quá tải. Bạn vào mục “Bản Đồ”, phóng to/thu nhỏ để xem các việc tốt quanh khu vực. Bấm vào ghim trên bản đồ để xem chi tiết câu chuyện.';
  }

  if (text.includes('demo') || text.includes('tài khoản')) {
    return 'Mình đang dùng chế độ dự phòng vì model AI miễn phí đang bị giới hạn/quá tải. Bạn bấm “Tài Khoản Demo” hoặc “Demo” trên thanh điều hướng để thử nhanh các vai trò đã chuẩn bị sẵn.';
  }

  if (text.includes('admin') || text.includes('duyệt') || text.includes('quản trị')) {
    return 'Mình đang dùng chế độ dự phòng vì model AI miễn phí đang bị giới hạn/quá tải. Tài khoản có quyền quản trị có thể vào “Quản Trị Admin” để xem, duyệt, từ chối hoặc quản lý bài viết cộng đồng.';
  }

  return 'Mình đang dùng chế độ dự phòng vì các model AI miễn phí đang bị giới hạn/quá tải. Bạn vẫn có thể hỏi về: cách đăng việc tốt, xem bản đồ, xem câu chuyện, bảng xếp hạng, tài khoản demo hoặc quản trị bài viết.';
};

const buildContents = (message, history = []) => {
  const safeHistory = Array.isArray(history) ? history.slice(-4) : [];

  return [
    ...safeHistory.map((item) => ({
      role: item.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(item.text || '').slice(0, 700) }]
    })),
    {
      role: 'user',
      parts: [{ text: String(message).slice(0, 1000) }]
    }
  ];
};

const buildOpenAiMessages = (message, history = []) => {
  const safeHistory = Array.isArray(history) ? history.slice(-4) : [];

  return [
    { role: 'system', content: systemInstruction },
    ...safeHistory.map((item) => ({
      role: item.role === 'model' ? 'assistant' : 'user',
      content: String(item.text || '').slice(0, 700)
    })),
    { role: 'user', content: String(message).slice(0, 1000) }
  ];
};

const askGemini = async ({ message, history }) => {
  const apiKey = readEnvKey('GEMINI_API_KEY');
  if (!apiKey) return null;

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: buildContents(message, history),
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 350
    }
  };

  let lastError = null;

  for (const model of getGeminiModelCandidates()) {
    const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim();
      if (reply) return { reply, model, provider: 'gemini' };
    }

    lastError = { status: response.status, data, model, provider: 'gemini' };

    // Model không tồn tại, hết quota, quá tải, hoặc lỗi tạm thời: thử model Gemini tiếp theo.
    if (![400, 404].includes(response.status) && !isTransientModelError(response.status, data)) {
      break;
    }
  }

  return { error: lastError };
};

const askGroq = async ({ message, history }) => {
  const apiKey = readEnvKey('GROQ_API_KEY');
  if (!apiKey) return null;

  const model = String(process.env.GROQ_MODEL || 'llama-3.1-8b-instant').trim();

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: buildOpenAiMessages(message, history),
      temperature: 0.55,
      max_tokens: 350
    })
  });

  const data = await response.json().catch(() => ({}));
  if (response.ok) {
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (reply) return { reply, model, provider: 'groq' };
  }

  return { error: { status: response.status, data, model, provider: 'groq' } };
};

const askOpenRouter = async ({ message, history }) => {
  const apiKey = readEnvKey('OPENROUTER_API_KEY');
  if (!apiKey) return null;

  const model = String(process.env.OPENROUTER_MODEL || 'openrouter/free').trim();

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'https://kindnessmap-vn.vercel.app',
      'X-Title': 'KindnessMap'
    },
    body: JSON.stringify({
      model,
      messages: buildOpenAiMessages(message, history),
      temperature: 0.4,
      max_tokens: 220,
      transforms: ['middle-out'],
      route: 'fallback',
      models: [
        model,
        'meta-llama/llama-3.3-70b-instruct:free',
        'deepseek/deepseek-chat-v3-0324:free',
        'google/gemma-3-27b-it:free'
      ].filter((modelName, index, arr) => modelName && arr.indexOf(modelName) === index)
    })
  });

  const data = await response.json().catch(() => ({}));
  if (response.ok) {
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (reply) return { reply, model: data.model || model, provider: 'openrouter' };
  }

  return { error: { status: response.status, data, model, provider: 'openrouter' } };
};

const chatWithGemini = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung cần hỏi chatbot.' });
    }

    const errors = [];
    const providers = [askOpenRouter, askGroq, askGemini];

    for (const provider of providers) {
      const result = await provider({ message, history });
      if (!result) continue;

      if (result.reply) {
        return res.status(200).json({
          reply: result.reply,
          model: result.model,
          provider: result.provider
        });
      }

      if (result.error) {
        errors.push(result.error);
        console.error('AI provider error:', result.error);
      }
    }

    return res.status(200).json({
      reply: localFallbackReply(message),
      model: 'local-fallback',
      provider: 'local',
      warning: 'AI_PROVIDERS_UNAVAILABLE',
      errors: errors.map((item) => ({ provider: item.provider, status: item.status, model: item.model }))
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(200).json({
      reply: localFallbackReply(req.body?.message),
      model: 'local-fallback',
      provider: 'local',
      warning: 'CHATBOT_FALLBACK_AFTER_ERROR'
    });
  }
};

module.exports = { chatWithGemini };
