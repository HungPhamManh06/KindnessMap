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

const getGeminiModelCandidates = () => {
  const configuredModel = String(process.env.GEMINI_MODEL || '')
    .trim()
    .replace(/^models\//, '');

  // Ưu tiên model nhẹ để giảm quota/cost. Nếu Render cấu hình GEMINI_MODEL thì vẫn thử trước.
  return [
    configuredModel,
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-1.5-flash-latest',
  ]
    .filter(Boolean)
    .filter((modelName, index, arr) => arr.indexOf(modelName) === index);
};

const isQuotaError = (errorData = {}) => {
  const message = String(errorData?.error?.message || '').toLowerCase();
  const status = String(errorData?.error?.status || '').toLowerCase();
  return status.includes('resource_exhausted') || message.includes('quota') || message.includes('rate limit');
};

const localFallbackReply = (message = '') => {
  const text = String(message).toLowerCase();

  if (text.includes('đăng') || text.includes('ghim') || text.includes('bài')) {
    return 'Hiện quota Gemini của máy chủ đang hết, nên mình trả lời bằng chế độ dự phòng: Bạn bấm “Ghim Việc Tốt Của Bạn”, đăng nhập nếu được yêu cầu, điền tiêu đề, mô tả, địa điểm, ảnh minh hoạ rồi gửi. Bài sẽ hiển thị sau khi được duyệt.';
  }

  if (text.includes('bản đồ') || text.includes('map')) {
    return 'Hiện quota Gemini của máy chủ đang hết, nên mình trả lời bằng chế độ dự phòng: Bạn vào mục “Bản Đồ”, phóng to/thu nhỏ để xem các việc tốt quanh khu vực. Bấm vào ghim trên bản đồ để xem chi tiết câu chuyện.';
  }

  if (text.includes('demo') || text.includes('tài khoản')) {
    return 'Hiện quota Gemini của máy chủ đang hết, nên mình trả lời bằng chế độ dự phòng: Bạn bấm “Tài Khoản Demo” hoặc “Demo” trên thanh điều hướng để thử nhanh các vai trò đã chuẩn bị sẵn.';
  }

  if (text.includes('admin') || text.includes('duyệt') || text.includes('quản trị')) {
    return 'Hiện quota Gemini của máy chủ đang hết, nên mình trả lời bằng chế độ dự phòng: Tài khoản có quyền quản trị có thể vào “Quản Trị Admin” để xem, duyệt, từ chối hoặc quản lý bài viết cộng đồng.';
  }

  return 'Hiện quota Gemini của máy chủ đang hết nên chatbot đang chạy chế độ dự phòng. Bạn vẫn có thể hỏi về: cách đăng việc tốt, xem bản đồ, xem câu chuyện, dùng tài khoản demo hoặc quản trị bài viết.';
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

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 700
      }
    };

    let data = null;
    let usedModel = null;
    let lastError = null;

    for (const model of getGeminiModelCandidates()) {
      const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      data = await response.json();

      if (response.ok) {
        usedModel = model;
        lastError = null;
        break;
      }

      lastError = { status: response.status, data, model };

      // Nếu model cũ không còn hỗ trợ generateContent, thử model kế tiếp.
      // Nếu quota/rate-limit bị hết ở một model, thử model nhẹ/khác trước khi chuyển sang fallback nội bộ.
      if (![400, 404, 429].includes(response.status) && !isQuotaError(data)) break;
    }

    if (lastError) {
      console.error('Gemini API error:', lastError);

      if (lastError.status === 429 || isQuotaError(lastError.data)) {
        return res.status(200).json({
          reply: localFallbackReply(message),
          model: 'local-fallback',
          warning: 'GEMINI_QUOTA_EXCEEDED'
        });
      }

      return res.status(lastError.status || 500).json({
        message: lastError.data?.error?.message || 'Không thể kết nối Gemini API.'
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim();

    res.status(200).json({
      reply: reply || 'Mình chưa có câu trả lời phù hợp. Bạn có thể hỏi lại rõ hơn không?',
      model: usedModel
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Có lỗi khi chatbot xử lý yêu cầu.' });
  }
};

module.exports = { chatWithGemini };
