/**
 * File: test.tele.js
 * Script (Kịch bản) kiểm thử gửi thông báo qua Telegram Bot API (Giao diện lập trình ứng dụng Telegram Bot)
 * sử dụng module tích hợp HTTPS của Node.js mà không cần cài đặt thêm thư viện phụ thuộc bên ngoài.
 */

const https = require('https');

// Cấu hình thông tin kết nối Telegram (Có thể lấy từ biến môi trường hoặc cấu hình trực tiếp)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

/**
 * Hàm gửi tin nhắn Telegram qua HTTPS POST Request (Yêu cầu gửi dữ liệu POST qua HTTPS)
 * @param {string} token - Bot Token (Mã định danh xác thực Bot)
 * @param {string|number} chatId - Chat ID (Mã định danh cuộc trò chuyện)
 * @param {string} text - Message Content (Nội dung tin nhắn)
 * @returns {Promise<object>}
 */
function sendTelegramMessage(token, chatId, text) {
  return new Promise((resolve, reject) => {
    if (!token || !chatId) {
      return reject(new Error('Lỗi: Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID. Hãy thiết lập biến môi trường trước khi chạy.'));
    }

    const payload = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000 // Timeout (Thời gian chờ tối đa): 10 giây
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const responseJson = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && responseJson.ok) {
            resolve(responseJson);
          } else {
            reject(new Error(`Telegram API trả về lỗi (${res.statusCode}): ${data}`));
          }
        } catch (err) {
          reject(new Error(`Lỗi phân tích JSON phản hồi: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Lỗi kết nối mạng: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Yêu cầu gửi tin nhắn bị quá thời gian chờ (Timeout).'));
    });

    req.write(payload);
    req.end();
  });
}

// Chạy thử nghiệm
async function main() {
  console.log('=== KHỞI CHẠY KIỂM THỬ TELEGRAM BOT ===');
  console.log('Kiểm tra cấu hình môi trường...');

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️  CẢNH BÁO: Chưa tìm thấy biến môi trường TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID.');
    console.log('Hướng dẫn chạy:');
    console.log('  Windows PowerShell:');
    console.log('    $env:TELEGRAM_BOT_TOKEN="YOUR_TOKEN"; $env:TELEGRAM_CHAT_ID="YOUR_CHAT_ID"; node test.tele.js');
    console.log('  Linux / macOS Bash:');
    console.log('    TELEGRAM_BOT_TOKEN="YOUR_TOKEN" TELEGRAM_CHAT_ID="YOUR_CHAT_ID" node test.tele.js\n');
    return;
  }

  const sampleMessage = `🤖 <b>[Thông Báo Kiểm Thử]</b>\n\n` +
                        `✅ Kịch bản kiểm thử <code>test.tele.js</code> đã kết nối thành công!\n` +
                        `🕒 Thời gian: <i>${new Date().toLocaleString('vi-VN')}</i>\n` +
                        `🚀 Hệ thống: <b>Smartmarket App</b>`;

  try {
    console.log(`Đang gửi tin nhắn thử nghiệm tới Chat ID: ${TELEGRAM_CHAT_ID}...`);
    const result = await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, sampleMessage);
    console.log('✅ Gửi tin nhắn thành công!');
    console.log('Phản hồi từ Telegram Server:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Thất bại:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { sendTelegramMessage };
