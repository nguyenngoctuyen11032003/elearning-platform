import { readFileSync } from 'fs';

const ts = readFileSync('lib/i18n/translations.ts', 'utf-8');

// Find each language section by looking for 'lang': { ... }
const sections = {};
for (const lang of ['en', 'ja', 'ko', 'zh-CN']) {
  const marker = `'${lang}': {`;
  const start = ts.indexOf(marker);
  if (start < 0) { console.log(`Section ${lang} not found`); continue; }
  // Find the closing },
  let depth = 0;
  let end = start + marker.length;
  for (; end < ts.length; end++) {
    if (ts[end] === '{') depth++;
    if (ts[end] === '}') { if (depth === 0) break; depth--; }
  }
  sections[lang] = ts.substring(start, end);
}

// Vietnamese words that shouldn't appear in non-vi translations
const viWords = [
  'tôi', 'của', 'hài lòng', 'khóa học', 'giảng viên', 'học viên',
  'đăng ký', 'đăng nhập', 'đăng xuất', 'trả lời', 'câu hỏi',
  'bài thi', 'luyện tập', 'phút', 'lượt', 'chứng chỉ', 'bài học',
  'thanh toán', 'giỏ hàng', 'nạp tiền', 'mật khẩu', 'tài khoản',
  'thông báo', 'lịch sử', 'cài đặt', 'hồ sơ', 'tiến độ',
  'ghi chú', 'thảo luận', 'bài tập', 'danh sách', 'yêu thích',
  'điểm', 'kết quả', 'xem', 'sửa', 'xóa', 'thêm', 'tạo',
  'cập nhật', 'tìm kiếm', 'lọc', 'sắp xếp', 'tải', 'xuất',
  'nhập', 'gửi', 'hủy', 'lưu', 'đóng', 'mở', 'quay lại',
  'tiếp tục', 'hoàn thành', 'bắt đầu', 'kết thúc', 'chờ',
  'duyệt', 'từ chối', 'chấp nhận'
];

// Check Japanese section for bad translations
for (const [lang, section] of Object.entries(sections)) {
  const lines = section.split('\n');
  const bad = [];
  for (const line of lines) {
    const m = line.match(/^\s+(\w+):\s*'(.+)'/);
    if (!m) continue;
    const [, key, val] = m;
    const foundWords = [];
    for (const w of viWords) {
      // Use word boundary-ish check
      if (val.toLowerCase().includes(w)) {
        foundWords.push(w);
      }
    }
    if (foundWords.length > 0) {
      bad.push({ key, val, words: foundWords });
    }
  }
  console.log(`\n${lang}: ${bad.length} keys with Vietnamese remnants`);
  for (const b of bad) {
    console.log(`  ${b.key}: "${b.val}" [${b.words.join(', ')}]`);
  }
}
