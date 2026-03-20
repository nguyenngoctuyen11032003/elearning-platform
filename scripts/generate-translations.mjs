/**
 * Complete translations.ts generator for ICS E-Learning.
 * 
 * Strategy:
 * 1. Read all 2037 t() keys from all_t_keys_utf8.txt
 * 2. Use explicit per-key translations (highest quality)
 * 3. Fall back to phrase-dictionary greedy matching
 * 4. Output complete lib/i18n/translations.ts
 *
 * Usage: node scripts/generate-translations.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { phrases } from './phrase-dictionary.mjs';
import { explicit2 } from './explicit-translations-2.mjs';
import { explicit3 } from './explicit-translations-3.mjs';
import { explicit4 } from './explicit-translations-4.mjs';
import { explicit5 } from './explicit-translations-5.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── 1. Read key→vi pairs ──────────────────────────────────────────────
const raw = readFileSync(join(__dirname, 'all_t_keys_utf8.txt'), 'utf-8');
const allKeys = {};
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t) continue;
  const i = t.indexOf('\t');
  if (i < 0) continue;
  allKeys[t.substring(0, i).trim()] = t.substring(i + 1).trim();
}
// Also load keys from explicit3/4/5 that aren't already in allKeys
for (const src of [explicit3, explicit4, explicit5]) {
  for (const [key, val] of Object.entries(src)) {
    if (!allKeys[key] && val.vi) allKeys[key] = val.vi;
  }
}
const keyCount = Object.keys(allKeys).length;
console.log(`Loaded ${keyCount} keys`);

// ── 2. Sort phrase dictionary longest-first ──
const sortedPhrases = [...phrases].sort((a, b) => b[0].length - a[0].length);

function autoTranslate(viText, langIdx) {
  // langIdx: 1=en, 2=ja, 3=ko, 4=zh
  let result = viText;
  const replacements = [];
  
  // Find all matches (longest first, non-overlapping)
  let working = viText;
  for (const entry of sortedPhrases) {
    const viPhrase = entry[0];
    const translation = entry[langIdx];
    if (!translation) continue;
    
    let idx = working.indexOf(viPhrase);
    while (idx !== -1) {
      replacements.push({ start: idx, end: idx + viPhrase.length, translation, viPhrase });
      // Mark as used
      working = working.substring(0, idx) + '\x00'.repeat(viPhrase.length) + working.substring(idx + viPhrase.length);
      idx = working.indexOf(viPhrase);
    }
  }
  
  if (replacements.length === 0) return null;
  
  // Sort by position
  replacements.sort((a, b) => a.start - b.start);
  
  // Build translated string
  let parts = [];
  let lastEnd = 0;
  for (const r of replacements) {
    if (r.start > lastEnd) {
      const gap = viText.substring(lastEnd, r.start).trim();
      if (gap) parts.push(gap);
    }
    parts.push(r.translation);
    lastEnd = r.end;
  }
  if (lastEnd < viText.length) {
    const tail = viText.substring(lastEnd).trim();
    if (tail) parts.push(tail);
  }
  
  const translated = parts.join(' ').replace(/\s+/g, ' ').trim();
  // Only return if we translated a significant portion
  const translatedChars = replacements.reduce((s, r) => s + r.viPhrase.length, 0);
  if (translatedChars / viText.length < 0.4) return null;
  
  return translated;
}

// ── 3. Explicit per-key translations ──────────────────────────────────
// Keys that need manual translation (complex sentences, special formatting)
// Format: { key: [en, ja, ko, zh] }
const explicit = {
  // ── about_* ──
  about_cta_signup: ['Register as student', '受講生登録', '수강생 등록', '注册学员'],
  about_cta_teacher: ['Become an instructor', '講師になる', '강사 되기', '成为讲师'],
  about_cta_title: ['Join the ICS Learning community', 'ICS Learningコミュニティに参加', 'ICS Learning 커뮤니티 참여', '加入ICS Learning社区'],
  about_mission_badge: ['Our Mission', '私たちのミッション', '우리의 사명', '我们的使命'],
  about_mission_title: ['Democratizing quality education', '質の高い教育を民主化する', '양질의 교육 민주화', '民主化优质教育'],
  about_stat_courses: ['Diverse courses', '多様なコース', '다양한 코스', '多样化课程'],
  about_stat_rating: ['Average rating', '平均評価', '평균 평점', '平均评分'],
  about_stat_students: ['Global students', '世界中の受講生', '전 세계 수강생', '全球学员'],
  about_stat_teachers: ['Expert instructors', '専門講師', '전문 강사', '专家讲师'],
  about_team_desc: ['The passionate people behind ICS Learning', 'ICS Learningを支える情熱的なチーム', 'ICS Learning 뒤의 열정적인 사람들', 'ICS Learning背后充满热情的团队'],
  about_team_title: ['Leadership Team', 'リーダーシップチーム', '리더십 팀', '领导团队'],
  about_val1_desc: ['We are committed to providing high-quality learning content from top experts. Every course is carefully reviewed.', '業界トップの専門家による高品質な学習コンテンツの提供に尽力しています。すべてのコースは丁寧に審査されています。', '업계 최고의 전문가들이 제공하는 고품질 학습 콘텐츠에 최선을 다하고 있습니다. 모든 코스는 철저히 검토됩니다.', '我们致力于提供来自顶级专家的高质量学习内容。每门课程都经过严格审核。'],
  about_val1_title: ['Quality is our top priority', '品質が最優先', '품질이 최우선', '质量是首要任务'],
  about_val2_desc: ['Always updating with the latest technology for the best learning experience. We invest in AI and machine learning for personalized learning.', '最高の学習体験のために最新技術を常に更新。AIと機械学習に投資し、パーソナライズされた学習を実現。', '최고의 학습 경험을 위해 항상 최신 기술로 업데이트합니다. AI와 머신러닝에 투자하여 맞춤형 학습을 제공합니다.', '始终使用最新技术提供最佳学习体验。我们投资AI和机器学习以实现个性化学习。'],
  about_val2_title: ['Continuous innovation', '絶え間ないイノベーション', '끊임없는 혁신', '持续创新'],
  about_val3_desc: ['Building a vibrant learning community where everyone can share, support and grow together. Learning is not just individual but collective.', '皆が共有・支援・成長できる活気ある学習コミュニティを構築。学びは個人だけでなく集団で。', '모든 사람이 공유하고, 지원하고, 함께 성장하는 활기찬 학습 커뮤니티를 구축합니다. 학습은 개인만의 것이 아닌 공동체의 것입니다.', '构建活跃的学习社区，让每个人都能分享、互助和共同成长。学习不仅是个人的，更是集体的。'],
  about_val3_title: ['Connected community', 'つながるコミュニティ', '연결된 커뮤니티', '连接社区'],
  about_values_desc: ['The principles that guide everything we do', '私たちの活動を導く原則', '우리의 모든 활동을 이끄는 원칙', '指导我们一切活动的原则'],
  about_values_title: ['Core Values', 'コアバリュー', '핵심 가치', '核心价值观'],
  
  // ── adm_cat_* ──
  adm_cat_add_btn: ['Add category', 'カテゴリを追加', '카테고리 추가', '添加分类'],
  adm_cat_add_title: ['Add new category', '新しいカテゴリを追加', '새 카테고리 추가', '添加新分类'],
  adm_cat_cancel: ['Cancel', 'キャンセル', '취소', '取消'],
  adm_cat_choose_img: ['Choose image...', '画像を選択...', '이미지 선택...', '选择图片...'],
  adm_cat_courses: ['Courses', 'コース', '코스', '课程'],
  adm_cat_courses_unit: ['courses', 'コース', '코스', '门课程'],
  adm_cat_delete: ['Delete', '削除', '삭제', '删除'],
  adm_cat_delete_confirm: ['Delete category', 'カテゴリを削除', '카테고리 삭제', '删除分类'],
  adm_cat_delete_msg: ['Are you sure you want to delete category', 'このカテゴリを削除しますか', '이 카테고리를 삭제하시겠습니까', '确定要删除分类'],
  adm_cat_delete_title: ['Confirm delete category', 'カテゴリ削除の確認', '카테고리 삭제 확인', '确认删除分类'],
  adm_cat_delete_warn: ['This action cannot be undone.', 'この操作は元に戻せません。', '이 작업은 되돌릴 수 없습니다.', '此操作无法撤销。'],
  adm_cat_desc_label: ['Description', '説明', '설명', '描述'],
  adm_cat_desc_ph: ['Enter category description...', 'カテゴリの説明を入力...', '카테고리 설명 입력...', '输入分类描述...'],
  adm_cat_edit: ['Edit', '編集', '편집', '编辑'],
  adm_cat_empty: ['No categories found', 'カテゴリが見つかりません', '카테고리를 찾을 수 없습니다', '未找到分类'],
  adm_cat_icon: ['Icon', 'アイコン', '아이콘', '图标'],
  adm_cat_icon_label: ['Icon (optional)', 'アイコン（任意）', '아이콘 (선택사항)', '图标（可选）'],
  adm_cat_icon_needed: ['Category needs an icon or image', 'カテゴリにはアイコンか画像が必要です', '카테고리에 아이콘이나 이미지가 필요합니다', '分类需要图标或图片'],
  adm_cat_icon_required: ['Please select an icon or image for the category', 'カテゴリのアイコンまたは画像を選択してください', '카테고리의 아이콘이나 이미지를 선택해주세요', '请选择分类的图标或图片'],
  adm_cat_image: ['Category image', 'カテゴリ画像', '카테고리 이미지', '分类图片'],
  adm_cat_img_label: ['Category image (optional)', 'カテゴリ画像（任意）', '카테고리 이미지 (선택사항)', '分类图片（可选）'],
  adm_cat_name_label: ['Category name', 'カテゴリ名', '카테고리 이름', '分类名称'],
  adm_cat_name_ph: ['Enter category name...', 'カテゴリ名を入力...', '카테고리 이름 입력...', '输入分类名称...'],
  adm_cat_name_required: ['Please enter category name', 'カテゴリ名を入力してください', '카테고리 이름을 입력해주세요', '请输入分类名称'],
  adm_cat_no_icon: ['No icon selected', 'アイコン未選択', '아이콘 미선택', '未选择图标'],
  adm_cat_save: ['Save', '保存', '저장', '保存'],
  adm_cat_saving: ['Saving...', '保存中...', '저장 중...', '保存中...'],
  adm_cat_search: ['Search categories by name or description...', 'カテゴリ名または説明で検索...', '이름이나 설명으로 카테고리 검색...', '按名称或描述搜索分类...'],
  adm_cat_students: ['Students', '受講生', '수강생', '学员'],
  adm_cat_subtitle: ['Classify and organize courses', 'コースを分類・整理', '코스를 분류하고 정리', '分类和组织课程'],
  adm_cat_title: ['Category Management', 'カテゴリ管理', '카테고리 관리', '分类管理'],
  adm_cat_total: ['Total categories', 'カテゴリ合計', '전체 카테고리', '总分类数'],
  adm_cat_total_courses: ['Total courses', 'コース合計', '전체 코스', '总课程数'],
  adm_cat_total_students: ['Total students', '受講生合計', '전체 수강생', '总学员数'],

  // ── adm_cd_* (Course Detail) ──
  adm_cd_analytics_title: ['Analytics & Statistics', '分析 & 統計', '분석 & 통계', '分析与统计'],
  adm_cd_approved: ['Approved', '承認済み', '승인됨', '已审批'],
  adm_cd_avg_progress: ['Avg. progress', '平均進捗', '평균 진도', '平均进度'],
  adm_cd_avg_rating: ['Average rating', '平均評価', '평균 평점', '平均评分'],
  adm_cd_back: ['Go back', '戻る', '돌아가기', '返回'],
  adm_cd_category: ['Category', 'カテゴリ', '카테고리', '分类'],
  adm_cd_col_enrolled_date: ['Enrollment date', '登録日', '등록일', '注册日期'],
  adm_cd_col_last_access: ['Last accessed', '最終アクセス', '마지막 접속', '最后访问'],
  adm_cd_col_progress: ['Progress', '進捗', '진도', '进度'],
  adm_cd_col_status: ['Status', 'ステータス', '상태', '状态'],
  adm_cd_col_student: ['Student', '受講生', '수강생', '学员'],
  adm_cd_completed: ['Completed', '完了', '완료', '已完成'],
  adm_cd_completion_by_section: ['Completion rate by section', 'セクション別完了率', '섹션별 완료율', '各章节完成率'],
  adm_cd_completion_rate: ['Completion rate', '完了率', '완료율', '完成率'],
  adm_cd_course_content: ['Course content', 'コースコンテンツ', '코스 내용', '课程内容'],
  adm_cd_created_at: ['Created at', '作成日時', '생성일', '创建时间'],
  adm_cd_delete: ['Delete', '削除', '삭제', '删除'],
  adm_cd_draft: ['Draft', '下書き', '초안', '草稿'],
  adm_cd_due_date: ['Due date', '締切日', '마감일', '截止日期'],
  adm_cd_duration: ['Duration', '期間', '기간', '时长'],
  adm_cd_edit: ['Edit', '編集', '편집', '编辑'],
  adm_cd_enrolled_students: ['Enrolled students', '登録済み受講生', '등록된 수강생', '已注册学员'],
  adm_cd_enrollment_count: ['Enrollment count', '登録数', '등록 수', '注册数量'],
  adm_cd_enrollments: ['Enrollments', '登録数', '등록 수', '注册数'],
  adm_cd_enrollments_unit: ['enrollments', '件', '건', '人'],
  adm_cd_explanation: ['Explanation', '解説', '해설', '解析'],
  adm_cd_fill_answer: ['Fill-in answer', '穴埋め解答', '빈칸 답', '填空答案'],
  adm_cd_info: ['Info', '情報', '정보', '信息'],
  adm_cd_instructor: ['Instructor', '講師', '강사', '讲师'],
  adm_cd_language: ['Language', '言語', '언어', '语言'],
  adm_cd_lessons_unit: ['lessons', 'レッスン', '강의', '课时'],
  adm_cd_lessons_unit_short: ['lessons', '課', '과', '课'],
  adm_cd_level: ['Level', 'レベル', '레벨', '等级'],
  adm_cd_load_err: ['Failed to load course info', 'コース情報の読み込みに失敗しました', '코스 정보를 불러올 수 없습니다', '无法加载课程信息'],
  adm_cd_max_score: ['Max score', '最高スコア', '최대 점수', '最高分'],
  adm_cd_multi_answer: ['Multiple answers', '複数回答', '복수 응답', '多选答案'],
  adm_cd_next: ['Next', '次へ', '다음', '下一页'],
  adm_cd_no_content: ['(No content yet)', '（コンテンツなし）', '(콘텐츠 없음)', '（暂无内容）'],
  adm_cd_no_video: ['Lesson has no video', 'レッスンに動画がありません', '강의에 비디오가 없습니다', '课时暂无视频'],
  adm_cd_not_found: ['Course not found', 'コースが見つかりません', '코스를 찾을 수 없습니다', '未找到课程'],
  adm_cd_open_video: ['Open lesson video', 'レッスン動画を開く', '강의 비디오 열기', '打开课时视频'],
  adm_cd_outcomes: ['What you will learn', '学べること', '배울 수 있는 것', '你将学到什么'],
  adm_cd_pending: ['Pending review', '審査中', '검토 중', '待审批'],
  adm_cd_prev: ['Previous', '前へ', '이전', '上一页'],
  adm_cd_price: ['Price', '価格', '가격', '价格'],
  adm_cd_published: ['Published', '公開済み', '게시됨', '已发布'],
  adm_cd_question_img: ['Question image', '質問画像', '질문 이미지', '题目图片'],
  adm_cd_questions: ['questions', '問', '문', '题'],
  adm_cd_rating: ['Rating', '評価', '평점', '评分'],
  adm_cd_rating_dist: ['Rating distribution', '評価分布', '평점 분포', '评分分布'],
  adm_cd_rejected: ['Rejected', '却下', '거부됨', '已拒绝'],
  adm_cd_requirements: ['Requirements', '必要条件', '요구사항', '要求'],
  adm_cd_revenue: ['Revenue', '収益', '수익', '收入'],
  adm_cd_revenue_million: ['Revenue (million VND)', '収益（百万VND）', '수익 (백만 VND)', '收入（百万越南盾）'],
  adm_cd_revenue_over_time: ['Revenue over time', '時系列収益', '시간별 수익', '收入趋势'],
  adm_cd_showing: ['Showing', '表示中', '표시 중', '显示'],
  adm_cd_single_answer: ['Single answer', '単一回答', '단일 응답', '单选答案'],
  adm_cd_stats: ['Statistics', '統計', '통계', '统计'],
  adm_cd_student_list: ['List', 'リスト', '목록', '列表'],
  adm_cd_students: ['students', '受講生', '수강생', '学员'],
  adm_cd_students_enrolled: ['students have enrolled in this course.', '名の受講生がこのコースに登録しています。', '명의 수강생이 이 코스에 등록했습니다.', '名学员已注册此课程。'],
  adm_cd_studying: ['In progress', '学習中', '학습 중', '学习中'],
  adm_cd_tab_analytics: ['Statistics', '統計', '통계', '统计'],
  adm_cd_tab_content: ['Content', 'コンテンツ', '콘텐츠', '内容'],
  adm_cd_tab_overview: ['Overview', '概要', '개요', '概览'],
  adm_cd_tab_students: ['Students', '受講生', '수강생', '学员'],
  adm_cd_total_enrollments: ['Total enrollments', '総登録数', '전체 등록', '总注册数'],
  adm_cd_total_lessons: ['Total lessons', 'レッスン合計', '전체 강의', '总课时数'],
  adm_cd_true_false: ['True/False', '正誤', '참/거짓', '判断题'],
  adm_cd_updated_at: ['Updated', '更新日時', '업데이트', '更新时间'],
  adm_cd_video_duration: ['Video duration', '動画時間', '비디오 시간', '视频时长'],

  // ── adm_cert_* ──
  adm_cert_all: ['All', 'すべて', '전체', '全部'],
  adm_cert_approve: ['Approve', '承認', '승인', '审批'],
  adm_cert_approve_btn: ['Approve certificate', '証明書を承認', '인증서 승인', '审批证书'],
  adm_cert_approve_err: ['Failed to approve certificate. Please try again.', '証明書の承認に失敗しました。再試行してください。', '인증서 승인에 실패했습니다. 다시 시도해주세요.', '无法审批证书。请重试。'],
  adm_cert_approve_msg: ['Are you sure you want to approve this certificate template?', 'この証明書テンプレートを承認しますか？', '이 인증서 템플릿을 승인하시겠습니까?', '确定要审批此证书模板吗？'],
  adm_cert_approve_title: ['Approve this certificate?', 'この証明書を承認しますか？', '이 인증서를 승인하시겠습니까?', '审批此证书？'],
  adm_cert_approved: ['Approved', '承認済み', '승인됨', '已审批'],
  adm_cert_approving: ['Approving...', '承認中...', '승인 중...', '审批中...'],
  adm_cert_back: ['Go back', '戻る', '돌아가기', '返回'],
  adm_cert_cancel: ['Cancel', 'キャンセル', '취소', '取消'],
  adm_cert_certifies: ['Certifies that', '以下を証明する', '다음을 인증합니다', '兹证明'],
  adm_cert_col_course: ['Course', 'コース', '코스', '课程'],
  adm_cert_col_issue_date: ['Issue date', '発行日', '발급일', '颁发日期'],
  adm_cert_col_number: ['Certificate number', '証明書番号', '인증서 번호', '证书编号'],
  adm_cert_col_status: ['Status', 'ステータス', '상태', '状态'],
  adm_cert_col_student: ['Student', '受講生', '수강생', '学员'],
  adm_cert_completion: ['Completion certificate', '修了証', '수료 인증서', '结业证书'],
  adm_cert_course_label: ['Course', 'コース', '코스', '课程'],
  adm_cert_course_name: ['[Course Name]', '【コース名】', '[코스 이름]', '【课程名称】'],
  adm_cert_created: ['Created', '作成', '생성', '创建'],
  adm_cert_detail_subtitle: ['Quick view of this certificate template info', 'この証明書テンプレートの情報を確認', '이 인증서 템플릿의 정보 빠른 보기', '快速查看此证书模板信息'],
  adm_cert_detail_title: ['Certificate details', '証明書の詳細', '인증서 상세', '证书详情'],
  adm_cert_draft: ['Draft', '下書き', '초안', '草稿'],
  adm_cert_empty: ['No certificates found', '証明書が見つかりません', '인증서를 찾을 수 없습니다', '未找到证书'],
  adm_cert_issued: ['Issued', '発行済み', '발급됨', '已颁发'],
  adm_cert_issued_count: ['Issued count', '発行数', '발급 수', '颁发数量'],
  adm_cert_issued_label: ['Issued', '発行済み', '발급됨', '已颁发'],
  adm_cert_loading: ['Loading certificates...', '証明書を読み込み中...', '인증서 로딩 중...', '正在加载证书...'],
  adm_cert_pending: ['Pending review', '審査中', '검토 중', '待审批'],
  adm_cert_reject_confirm: ['Confirm rejection', '却下を確認', '거부 확인', '确认拒绝'],
  adm_cert_reject_err: ['Failed to reject certificate. Please try again.', '証明書の却下に失敗しました。再試行してください。', '인증서 거부에 실패했습니다. 다시 시도해주세요.', '无法拒绝证书。请重试。'],
  adm_cert_reject_note: ['This reason will be sent to the instructor\'s email.', 'この理由は講師のメールに送信されます。', '이 사유는 강사의 이메일로 전송됩니다.', '此原因将发送至讲师邮箱。'],
  adm_cert_reject_ph: ['Enter reason for rejecting this certificate...', 'この証明書を却下する理由を入力...', '이 인증서를 거부하는 사유를 입력...', '输入拒绝此证书的原因...'],
  adm_cert_reject_reason: ['Rejection reason', '却下理由', '거부 사유', '拒绝原因'],
  adm_cert_reject_subtitle: ['Enter a reason so the instructor receives clear feedback', '講師が明確なフィードバックを受けられるよう理由を入力', '강사가 명확한 피드백을 받을 수 있도록 사유를 입력', '输入原因以便讲师收到明确反馈'],
  adm_cert_reject_title: ['Reject certificate', '証明書を却下', '인증서 거부', '拒绝证书'],
  adm_cert_rejected: ['Rejected', '却下', '거부됨', '已拒绝'],
  adm_cert_search: ['Search certificates, courses or instructors...', '証明書、コース、講師を検索...', '인증서, 코스 또는 강사 검색...', '搜索证书、课程或讲师...'],
  adm_cert_student_name: ['[Student Name]', '【受講生名】', '[수강생 이름]', '【学员姓名】'],
  adm_cert_subtitle: ['Review, approve and manage certificate templates from instructors', '講師からの証明書テンプレートを審査・承認・管理', '강사의 인증서 템플릿 검토, 승인 및 관리', '审查、审批和管理来自讲师的证书模板'],
  adm_cert_tab_issued: ['Issued certificates', '発行済み証明書', '발급된 인증서', '已颁发证书'],
  adm_cert_tab_templates: ['Certificate templates', '証明書テンプレート', '인증서 템플릿', '证书模板'],
  adm_cert_teacher_label: ['Instructor', '講師', '강사', '讲师'],
  adm_cert_title: ['Certificate Management', '証明書管理', '인증서 관리', '证书管理'],
  adm_cert_total: ['Total templates', 'テンプレート合計', '전체 템플릿', '总模板数'],
  adm_cert_unit: ['certificates', '証明書', '인증서', '证书'],
  adm_cert_validity: ['Validity period', '有効期間', '유효 기간', '有效期'],
  adm_cert_view: ['View details', '詳細を表示', '상세 보기', '查看详情'],

  // ── adm_code_* ──
  adm_code_back: ['Back to transactions', '取引一覧に戻る', '거래 목록으로 돌아가기', '返回交易列表'],
  adm_code_create: ['Create code', 'コードを作成', '코드 생성', '创建代码'],
  adm_code_create_fail: ['Failed to create code', 'コードの作成に失敗', '코드 생성 실패', '创建代码失败'],
  adm_code_create_new: ['Create new code', '新しいコードを作成', '새 코드 생성', '创建新代码'],
  adm_code_created: ['Payment code created', '支払いコードが作成されました', '결제 코드가 생성되었습니다', '已创建支付代码'],
  adm_code_creating: ['Creating...', '作成中...', '생성 중...', '创建中...'],
  adm_code_empty: ['No payment codes yet.', '支払いコードがありません。', '결제 코드가 없습니다.', '暂无支付代码。'],
  adm_code_enter_code: ['Please enter a code', 'コードを入力してください', '코드를 입력해주세요', '请输入代码'],
  adm_code_fixed: ['Fixed', '固定', '고정', '固定'],
  adm_code_fixed_vnd: ['Fixed discount (VND)', '固定割引（VND）', '고정 할인 (VND)', '固定折扣（越南盾）'],
  adm_code_from: ['From', 'から', '부터', '从'],
  adm_code_list: ['Code list', 'コード一覧', '코드 목록', '代码列表'],
  adm_code_load_fail: ['Failed to load payment codes', '支払いコードの読み込みに失敗', '결제 코드를 불러올 수 없습니다', '无法加载支付代码'],
  adm_code_loading: ['Loading...', '読み込み中...', '로딩 중...', '加载中...'],
  adm_code_pct: ['Percentage discount', '%割引', '% 할인', '百分比折扣'],
  adm_code_percent: ['Percentage', 'パーセント', '퍼센트', '百分比'],
  adm_code_ph_example: ['Example: PAYMENT100', '例: PAYMENT100', '예: PAYMENT100', '示例: PAYMENT100'],
  adm_code_ph_usage: ['Usage limit', '使用回数制限', '사용 제한', '使用次数限制'],
  adm_code_ph_val_pct: ['Discount value (%)', '割引値（%）', '할인 값 (%)', '折扣值（%）'],
  adm_code_ph_val_vnd: ['Discount value (VND)', '割引値（VND）', '할인 값 (VND)', '折扣值（越南盾）'],
  adm_code_subtitle: ['Admin creates codes for students to use when paying for courses.', '管理者が受講生のコース支払い用コードを作成します。', '관리자가 수강생이 코스 결제 시 사용할 코드를 생성합니다.', '管理员创建代码供学员在支付课程时使用。'],
  adm_code_title: ['Payment codes', '支払いコード', '결제 코드', '支付代码'],
  adm_code_until: ['Until', 'まで', '까지', '至'],
  adm_code_used: ['Used', '使用済み', '사용됨', '已使用'],
  adm_code_value: ['Value', '値', '값', '价值'],
  adm_code_value_gt0: ['Code value must be greater than 0', 'コードの値は0より大きくなければなりません', '코드 값은 0보다 커야 합니다', '代码值必须大于0'],

  // ── adm_courses_* ──
  adm_courses_action_fail: ['Action failed', '操作に失敗しました', '작업 실패', '操作失败'],
  adm_courses_actions: ['Actions', 'アクション', '작업', '操作'],
  adm_courses_all: ['All', 'すべて', '전체', '全部'],
  adm_courses_approve: ['Approve course', 'コースを承認', '코스 승인', '审批课程'],
  adm_courses_approved: ['Course approved!', 'コースが承認されました！', '코스가 승인되었습니다!', '课程已审批！'],
  adm_courses_approved_label: ['Approved', '承認済み', '승인됨', '已审批'],
  adm_courses_back: ['Go back', '戻る', '돌아가기', '返回'],
  adm_courses_cat_business: ['Business', 'ビジネス', '비즈니스', '商业'],
  adm_courses_cat_design: ['Design', 'デザイン', '디자인', '设计'],
  adm_courses_cat_label: ['Category', 'カテゴリ', '카테고리', '分类'],
  adm_courses_cat_language: ['Foreign language', '外国語', '외국어', '外语'],
  adm_courses_cat_programming: ['Programming', 'プログラミング', '프로그래밍', '编程'],
  adm_courses_col_category: ['Category', 'カテゴリ', '카테고리', '分类'],
  adm_courses_col_course: ['Course', 'コース', '코스', '课程'],
  adm_courses_col_date: ['Created date', '作成日', '생성일', '创建日期'],
  adm_courses_col_instructor: ['Instructor', '講師', '강사', '讲师'],
  adm_courses_col_price: ['Price', '価格', '가격', '价格'],
  adm_courses_col_status: ['Status', 'ステータス', '상태', '状态'],
  adm_courses_col_students: ['Students', '受講生', '수강생', '学员'],
  adm_courses_confirm_reject: ['Confirm rejection', '却下を確認', '거부 확인', '确认拒绝'],
  adm_courses_delete: ['Delete course', 'コースを削除', '코스 삭제', '删除课程'],
  adm_courses_deleted: ['Course deleted!', 'コースが削除されました！', '코스가 삭제되었습니다!', '课程已删除！'],
  adm_courses_desc_label: ['Description', '説明', '설명', '描述'],
  adm_courses_detail_info: ['Detail info', '詳細情報', '상세 정보', '详细信息'],
  adm_courses_duration: ['Duration', '期間', '기간', '时长'],
  adm_courses_edit: ['Edit', '編集', '편집', '编辑'],
  adm_courses_edit_title: ['Edit course', 'コースを編集', '코스 편집', '编辑课程'],
  adm_courses_full_detail: ['Full details', '完全な詳細', '전체 상세', '完整详情'],
  adm_courses_lessons: ['Lessons', 'レッスン', '강의', '课时'],
  adm_courses_lessons_unit: ['lessons', 'レッスン', '강의', '课时'],
  adm_courses_load_err: ['Failed to load course list', 'コース一覧の読み込みに失敗しました', '코스 목록을 불러올 수 없습니다', '无法加载课程列表'],
  adm_courses_name_label: ['Course name', 'コース名', '코스 이름', '课程名称'],
  adm_courses_not_found: ['No courses found', 'コースが見つかりません', '코스를 찾을 수 없습니다', '未找到课程'],
  adm_courses_pending: ['Pending review', '審査中', '검토 중', '待审批'],
  adm_courses_performance: ['Course performance', 'コースパフォーマンス', '코스 성과', '课程效果'],
  adm_courses_preview: ['Preview', 'プレビュー', '미리보기', '预览'],
  adm_courses_preview_title: ['Preview course', 'コースをプレビュー', '코스 미리보기', '预览课程'],
  adm_courses_price_label: ['Course price', 'コース価格', '코스 가격', '课程价格'],
  adm_courses_price_vnd: ['Price (VND)', '価格（VND）', '가격 (VND)', '价格（越南盾）'],
  adm_courses_reject_email_note: ['This reason will be sent to the instructor\'s email', 'この理由は講師のメールに送信されます', '이 사유는 강사의 이메일로 전송됩니다', '此原因将发送至讲师邮箱'],
  adm_courses_reject_hint: ['Please enter the rejection reason so the instructor knows what to improve', '講師が改善点を把握できるよう却下理由を入力してください', '강사가 개선할 점을 알 수 있도록 거부 사유를 입력해주세요', '请输入拒绝原因以便讲师了解需要改进的内容'],
  adm_courses_reject_placeholder: ['Enter reason for rejecting this course...', 'このコースを却下する理由を入力...', '이 코스를 거부하는 사유를 입력...', '输入拒绝此课程的原因...'],
  adm_courses_reject_reason: ['Rejection reason', '却下理由', '거부 사유', '拒绝原因'],
  adm_courses_reject_title: ['Reject course', 'コースを却下', '코스 거부', '拒绝课程'],
  adm_courses_rejected: ['Course rejected', 'コースが却下されました', '코스가 거부되었습니다', '课程已拒绝'],
  adm_courses_rejected_label: ['Rejected', '却下', '거부됨', '已拒绝'],
  adm_courses_revenue: ['Revenue', '収益', '수익', '收入'],
  adm_courses_reviews: ['reviews', 'レビュー', '리뷰', '评价'],
  adm_courses_save: ['Save changes', '変更を保存', '변경사항 저장', '保存更改'],
  adm_courses_search: ['Search courses or instructors...', 'コースまたは講師を検索...', '코스 또는 강사 검색...', '搜索课程或讲师...'],
  adm_courses_status_label: ['Status', 'ステータス', '상태', '状态'],
  adm_courses_students: ['Students', '受講生', '수강생', '学员'],
  adm_courses_subtitle: ['Review, approve and manage courses from instructors', '講師からのコースを審査・承認・管理', '강사의 코스 검토, 승인 및 관리', '审查、审批和管理来自讲师的课程'],
  adm_courses_title: ['Course Management', 'コース管理', '코스 관리', '课程管理'],
  adm_courses_total: ['Total courses', 'コース合計', '전체 코스', '总课程数'],
  adm_courses_view_full_detail: ['View full details (content, lessons)', '詳細を表示（コンテンツ、レッスン）', '전체 상세 보기 (콘텐츠, 강의)', '查看完整详情（内容、课时）'],

  // ── adm_dash_* ──
  adm_dash_active_users: ['Active users', 'アクティブユーザー', '활성 사용자', '活跃用户'],
  adm_dash_amount: ['Amount', '金額', '금액', '金额'],
  adm_dash_course: ['Course', 'コース', '코스', '课程'],
  adm_dash_course_dist: ['Course distribution', 'コース分布', '코스 분포', '课程分布'],
  adm_dash_courses_unit: ['courses', 'コース', '코스', '门'],
  adm_dash_date: ['Date', '日付', '날짜', '日期'],
  adm_dash_day: ['Day', '日', '일', '日'],
  adm_dash_failed: ['Failed', '失敗', '실패', '失败'],
  adm_dash_growth_monthly: ['Monthly growth', '月次成長', '월별 성장', '月度增长'],
  adm_dash_loading: ['Loading dashboard...', 'ダッシュボード読み込み中...', '대시보드 로딩 중...', '正在加载仪表板...'],
  adm_dash_month: ['Month', '月', '월', '月'],
  adm_dash_new_signups: ['New registrations', '新規登録', '새 등록', '新注册'],
  adm_dash_no_cat_data: ['No category data', 'カテゴリデータなし', '카테고리 데이터 없음', '暂无分类数据'],
  adm_dash_no_growth_data: ['No growth data', '成長データなし', '성장 데이터 없음', '暂无增长数据'],
  adm_dash_no_revenue_data: ['No revenue data', '収益データなし', '수익 데이터 없음', '暂无收入数据'],
  adm_dash_no_tx: ['No transactions yet', 'まだ取引がありません', '아직 거래가 없습니다', '暂无交易'],
  adm_dash_no_weekly_data: ['No weekly data yet', '今週のデータなし', '이번 주 데이터 없음', '暂无本周数据'],
  adm_dash_pending: ['Processing', '処理中', '처리 중', '处理中'],
  adm_dash_recent_tx: ['Recent transactions', '最近の取引', '최근 거래', '最近交易'],
  adm_dash_revenue: ['Revenue', '収益', '수익', '收入'],
  adm_dash_revenue_monthly: ['Monthly revenue', '月次収益', '월별 수익', '月度收入'],
  adm_dash_status: ['Status', 'ステータス', '상태', '状态'],
  adm_dash_students: ['Students', '受講生', '수강생', '学员'],
  adm_dash_subtitle: ['ICS Learning system overview - Comprehensive management', 'ICS Learningシステム概要 - 総合管理', 'ICS Learning 시스템 개요 - 종합 관리', 'ICS Learning系统概览 - 综合管理'],
  adm_dash_success: ['Success', '成功', '성공', '成功'],
  adm_dash_teachers: ['Teachers', '教師', '교사', '教师'],
  adm_dash_title: ['Admin Dashboard', '管理ダッシュボード', '관리 대시보드', '管理仪表板'],
  adm_dash_total_courses: ['Total courses', 'コース合計', '전체 코스', '总课程数'],
  adm_dash_total_revenue: ['Total revenue', '総収益', '총 수익', '总收入'],
  adm_dash_total_students: ['Total students', '受講生合計', '전체 수강생', '总学员数'],
  adm_dash_total_teachers: ['Total teachers', '教師合計', '전체 교사', '总教师数'],
  adm_dash_user: ['User', 'ユーザー', '사용자', '用户'],
  adm_dash_vs_30_days: ['vs last 30 days', '過去30日比', '지난 30일 대비', '与过去30天相比'],
  adm_dash_vs_last_month: ['vs last month', '先月比', '지난달 대비', '与上月相比'],
  adm_dash_week: ['Week', '週', '주', '周'],
  adm_dash_weekly_activity: ['User activity this week', '今週のユーザーアクティビティ', '이번 주 사용자 활동', '本周用户活动'],
  adm_dash_year: ['Year', '年', '년', '年'],

  // ── adm_exam_* key explicit translations ──
  adm_exam_approve_fail: ['Failed to approve exam', '試験の承認に失敗', '시험 승인 실패', '无法审批考试'],
  adm_exam_attempts_unit: ['attempts', '回', '회', '次'],
  adm_exam_cancel: ['Cancel', 'キャンセル', '취소', '取消'],
  adm_exam_cert_issued: ['Certificate issued', '証明書発行', '인증서 발급', '证书已颁发'],
  adm_exam_cert_pass_desc: ['Students scoring from', '以下のスコアを取得した受講生', '다음 점수 이상의 수강생에게', '得分达到'],
  adm_exam_cert_pass_desc2: ['and above will receive this certificate', '以上がこの証明書を受け取ります', '이 인증서가 수여됩니다', '及以上将获得此证书'],
  adm_exam_config_attempts: ['Attempts', '受験回数', '응시 횟수', '考试次数'],
  adm_exam_config_pass_score: ['Pass score', '合格点', '합격 점수', '及格分'],
  adm_exam_config_questions: ['Questions', '質問', '질문', '题目'],
  adm_exam_config_time: ['Time', '時間', '시간', '时间'],
  adm_exam_config_title: ['Exam configuration', '試験設定', '시험 설정', '考试配置'],
  adm_exam_confirm_delete_title: ['Confirm delete', '削除の確認', '삭제 확인', '确认删除'],
  adm_exam_confirm_reject: ['Confirm rejection', '却下を確認', '거부 확인', '确认拒绝'],
  adm_exam_course_id: ['Course ID', 'コースID', '코스 ID', '课程编号'],
  adm_exam_course_label: ['Course:', 'コース:', '코스:', '课程:'],
  adm_exam_created_date: ['Created date', '作成日', '생성일', '创建日期'],
  adm_exam_delete: ['Delete exam', '試験を削除', '시험 삭제', '删除考试'],
  adm_exam_delete_confirm_msg: ['Are you sure you want to delete this exam? This action cannot be undone.', 'この試験を削除しますか？この操作は元に戻せません。', '이 시험을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.', '确定要删除此考试吗？此操作无法撤销。'],
  adm_exam_delete_fail: ['Failed to delete exam', '試験の削除に失敗', '시험 삭제 실패', '无法删除考试'],
  adm_exam_empty: ['No exams found', '試験が見つかりません', '시험을 찾을 수 없습니다', '未找到考试'],
  adm_exam_filter_all_status: ['All statuses', 'すべてのステータス', '모든 상태', '所有状态'],
  adm_exam_filter_all_type: ['All types', 'すべての種類', '모든 유형', '所有类型'],
  adm_exam_full_detail: ['Full details', '完全な詳細', '전체 상세', '完整详情'],
  adm_exam_loading: ['Loading exam data...', '試験データを読み込み中...', '시험 데이터 로딩 중...', '正在加载考试数据...'],
  adm_exam_max: ['Maximum', '最大', '최대', '最大'],
  adm_exam_maximum: ['maximum', '最大', '최대', '最大'],
  adm_exam_minimum: ['minimum', '最小', '최소', '最小'],
  adm_exam_minutes: ['minutes', '分', '분', '分钟'],
  adm_exam_of_teacher: ['of teacher', '教師の', '교사의', '的教师'],
  adm_exam_pass: ['pass', '合格', '합격', '通过'],
  adm_exam_preview: ['Preview', 'プレビュー', '미리보기', '预览'],
  adm_exam_preview_title: ['Preview exam', '試験をプレビュー', '시험 미리보기', '预览考试'],
  adm_exam_questions_short: ['questions', '問', '문', '题'],
  adm_exam_reject_fail: ['Failed to reject exam', '試験の却下に失敗', '시험 거부 실패', '无法拒绝考试'],
  adm_exam_reject_placeholder: ['Enter reason for rejecting exam...', '試験を却下する理由を入力...', '시험 거부 사유 입력...', '输入拒绝考试的原因...'],
  adm_exam_reject_title: ['Reject exam', '試験を却下', '시험 거부', '拒绝考试'],
  adm_exam_rejecting: ['You are rejecting exam', 'この試験を却下しようとしています', '다음 시험을 거부합니다', '您正在拒绝考试'],
  adm_exam_rejection_reason: ['Rejection reason', '却下理由', '거부 사유', '拒绝原因'],
  adm_exam_search: ['Search exams, teachers, courses...', '試験、教師、コースを検索...', '시험, 교사, 코스 검색...', '搜索考试、教师、课程...'],
  adm_exam_stat_total: ['Total exams', '試験合計', '전체 시험', '总考试数'],
  adm_exam_statistics: ['Statistics', '統計', '통계', '统计'],
  adm_exam_status_approved: ['Approved', '承認済み', '승인됨', '已审批'],
  adm_exam_status_draft: ['Draft', '下書き', '초안', '草稿'],
  adm_exam_status_pending: ['Pending review', '審査中', '검토 중', '待审批'],
  adm_exam_status_rejected: ['Rejected', '却下', '거부됨', '已拒绝'],
  adm_exam_subtitle: ['Track and manage exams from teachers', '教師からの試験を追跡・管理', '교사의 시험을 추적하고 관리', '跟踪和管理来自教师的考试'],
  adm_exam_teacher_label: ['Teacher:', '教師:', '교사:', '教师:'],
  adm_exam_th_actions: ['Actions', 'アクション', '작업', '操作'],
  adm_exam_th_attempts: ['Attempts', '受験回数', '응시 횟수', '考试次数'],
  adm_exam_th_exam: ['Exam', '試験', '시험', '考试'],
  adm_exam_th_settings: ['Settings', '設定', '설정', '设置'],
  adm_exam_th_status: ['Status', 'ステータス', '상태', '状态'],
  adm_exam_th_teacher: ['Teacher', '教師', '교사', '教师'],
  adm_exam_th_type: ['Type', 'タイプ', '유형', '类型'],
  adm_exam_times: ['times', '回', '회', '次'],
  adm_exam_title: ['Exam Management', '試験管理', '시험 관리', '考试管理'],
  adm_exam_type_official: ['Official exam', '本試験', '본시험', '正式考试'],
  adm_exam_type_practice: ['Practice exam', '模擬試験', '모의시험', '模拟考试'],
  adm_exam_view_full_detail: ['View full details (questions, answers)', '詳細を表示（質問、解答）', '전체 상세 보기 (질문, 답변)', '查看完整详情（题目、答案）'],
  adm_exam_view_reason: ['View reason', '理由を表示', '사유 보기', '查看原因'],

  // ── adm_examd_* ──
  adm_examd_analytics_note: ['The current endpoint does not return score distribution and time trend data, so the page only displays the actual overview metrics above.', '現在のエンドポイントはスコア分布と時系列データを返さないため、上記の概要指標のみ表示しています。', '현재 엔드포인트는 점수 분포 및 시간 추이 데이터를 반환하지 않으므로 위의 개요 지표만 표시됩니다.', '当前接口不返回分数分布和时间趋势数据，因此页面仅显示上方的实际概览指标。'],
  adm_examd_approve_fail: ['Failed to approve exam', '試験の承認に失敗', '시험 승인 실패', '无法审批考试'],
  adm_examd_approve_ok: ['Exam approved successfully', '試験が承認されました', '시험이 승인되었습니다', '考试审批成功'],
  adm_examd_attempts: ['Attempts', '受験回数', '응시 횟수', '考试次数'],
  adm_examd_attempts_count: ['attempts on this exam.', '回のこの試験への受験があります。', '회의 이 시험 응시가 있습니다.', '次考试应试。'],
  adm_examd_attempts_note: ['Detailed per-attempt data is not returned by the backend at the exam detail endpoint. The page currently shows the actual total attempts.', '各受験の詳細データはバックエンドの試験詳細エンドポイントで返されません。現在は実際の受験総数を表示しています。', '각 응시의 상세 데이터는 백엔드의 시험 상세 엔드포인트에서 반환되지 않습니다. 현재 실제 응시 총 횟수를 표시합니다.', '后端考试详情接口不返回每次考试的详细数据。当前页面显示实际的总考试次数。'],
  adm_examd_average_score: ['Average score', '平均スコア', '평균 점수', '平均分'],
  adm_examd_avg_score: ['Avg score', '平均点', '평균 점수', '平均分'],
  adm_examd_back: ['Go back', '戻る', '돌아가기', '返回'],
  adm_examd_benchmark: ['Benchmark', '基準点', '기준 점수', '基准分'],
  adm_examd_cancel: ['Cancel', 'キャンセル', '취소', '取消'],
  adm_examd_cannot_undo: ['This action cannot be undone.', 'この操作は元に戻せません。', '이 작업은 되돌릴 수 없습니다.', '此操作无法撤销。'],
  adm_examd_certificate: ['Certificate', '証明書', '인증서', '证书'],
  adm_examd_chart_title: ['Analysis chart', '分析チャート', '분석 차트', '分析图表'],
  adm_examd_confirm_delete: ['Confirm delete', '削除の確認', '삭제 확인', '确认删除'],
  adm_examd_confirm_reject: ['Confirm rejection', '却下を確認', '거부 확인', '确认拒绝'],
  adm_examd_correct_answer: ['Correct answer', '正解', '정답', '正确答案'],
  adm_examd_created_at: ['Created at', '作成日時', '생성일', '创建时间'],
  adm_examd_delete: ['Delete', '削除', '삭제', '删除'],
  adm_examd_delete_btn: ['Delete exam', '試験を削除', '시험 삭제', '删除考试'],
  adm_examd_delete_fail: ['Failed to delete exam', '試験の削除に失敗', '시험 삭제 실패', '无法删除考试'],
  adm_examd_delete_msg: ['Are you sure you want to delete exam', 'この試験を削除しますか', '이 시험을 삭제하시겠습니까', '确定要删除考试'],
  adm_examd_delete_ok: ['Exam deleted', '試験が削除されました', '시험이 삭제되었습니다', '考试已删除'],
  adm_examd_deleting: ['Deleting...', '削除中...', '삭제 중...', '删除中...'],
  adm_examd_exam_type: ['Exam type', '試験タイプ', '시험 유형', '考试类型'],
  adm_examd_explanation: ['Explanation', '解説', '해설', '解析'],
  adm_examd_fill_answer: ['Fill-in answer', '穴埋め解答', '빈칸 답', '填空答案'],
  adm_examd_has_attempts: ['Yes', 'あり', '있음', '有'],
  adm_examd_history: ['Attempt history', '受験履歴', '응시 이력', '考试记录'],
  adm_examd_info: ['Info', '情報', '정보', '信息'],
  adm_examd_instr_1: ['Read each question carefully before answering', '回答する前に各質問をよく読んでください', '답변하기 전에 각 질문을 주의 깊게 읽으세요', '回答前请仔细阅读每道题'],
  adm_examd_instr_2a: ['You have', '', '', '您有'],
  adm_examd_instr_2b: ['minutes to complete the exam', '分で試験を完了してください', '분 내에 시험을 완료하세요', '分钟完成考试'],
  adm_examd_instr_3a: ['You must score at least', '少なくとも', '최소', '您必须至少得到'],
  adm_examd_instr_3b: ['to pass the exam', 'を取得して試験に合格してください', '이상을 취득하여 시험을 통과하세요', '才能通过考试'],
  adm_examd_instr_4a: ['You can retake the exam up to', '最大', '최대', '您最多可以重考'],
  adm_examd_instr_4b: ['times', '回まで試験を再受験できます', '회까지 시험을 다시 볼 수 있습니다', '次'],
  adm_examd_instructions: ['Exam instructions', '受験ガイド', '시험 안내', '考试说明'],
  adm_examd_load_fail: ['Failed to load exam details', '試験詳細の読み込みに失敗', '시험 상세를 불러올 수 없습니다', '无法加载考试详情'],
  adm_examd_loading: ['Loading exam details...', '試験詳細を読み込み中...', '시험 상세 로딩 중...', '正在加载考试详情...'],
  adm_examd_max_attempts: ['Max attempts', '最大受験回数', '최대 응시 횟수', '最大考试次数'],
  adm_examd_minutes: ['minutes', '分', '분', '分钟'],
  adm_examd_no_content: ['no displayable content from source data.', 'ソースデータから表示可能なコンテンツがありません。', '소스 데이터에서 표시할 콘텐츠가 없습니다.', '源数据暂无可显示内容。'],
  adm_examd_no_teacher: ['No instructor assigned', '講師未割当', '강사 미배정', '未分配讲师'],
  adm_examd_num_questions: ['Number of questions', '質問数', '질문 수', '题目数'],
  adm_examd_official: ['Official', '正式', '공식', '正式'],
  adm_examd_pass_rate: ['Pass rate', '合格率', '합격률', '通过率'],
  adm_examd_pass_score: ['Pass score', '合格点', '합격 점수', '及格分'],
  adm_examd_points: ['points', '点', '점', '分'],
  adm_examd_practice: ['Practice', '練習', '연습', '练习'],
  adm_examd_processing: ['Processing...', '処理中...', '처리 중...', '处理中...'],
  adm_examd_qtype_fill: ['Fill in the blank', '穴埋め', '빈칸 채우기', '填空'],
  adm_examd_qtype_mc: ['Multiple choice', '選択式', '객관식', '选择题'],
  adm_examd_qtype_tf: ['True/False', '正誤', '참/거짓', '判断题'],
  adm_examd_question_img: ['Question illustration', '質問のイラスト', '질문 이미지', '题目配图'],
  adm_examd_question_list: ['Question list', '質問一覧', '질문 목록', '题目列表'],
  adm_examd_question_prefix: ['Question', '質問', '질문', '题目'],
  adm_examd_reject_fail: ['Failed to reject exam', '試験の却下に失敗', '시험 거부 실패', '无法拒绝考试'],
  adm_examd_reject_ok: ['Exam rejected', '試験が却下されました', '시험이 거부되었습니다', '考试已拒绝'],
  adm_examd_reject_placeholder: ['Enter reason for rejecting exam...', '試験を却下する理由を入力...', '시험 거부 사유 입력...', '输入拒绝考试的原因...'],
  adm_examd_reject_subtitle: ['Enter reason for rejecting exam', '試験を却下する理由を入力', '시험 거부 사유를 입력', '输入拒绝考试的原因'],
  adm_examd_reject_title: ['Reject exam', '試験を却下', '시험 거부', '拒绝考试'],
  adm_examd_rejection_reason: ['Rejection reason', '却下理由', '거부 사유', '拒绝原因'],
  adm_examd_retry: ['Try again', '再試行', '다시 시도', '重试'],
  adm_examd_settings: ['Settings', '設定', '설정', '设置'],
  adm_examd_status_approved: ['Approved', '承認済み', '승인됨', '已审批'],
  adm_examd_status_draft: ['Draft', '下書き', '초안', '草稿'],
  adm_examd_status_pending: ['Pending review', '審査中', '검토 중', '待审批'],
  adm_examd_status_rejected: ['Rejected', '却下', '거부됨', '已拒绝'],
  adm_examd_tab_analytics: ['Analytics', '分析', '분석', '分析'],
  adm_examd_tab_attempts: ['Attempts', '受験', '응시', '考试'],
  adm_examd_tab_overview: ['Overview', '概要', '개요', '概览'],
  adm_examd_tab_questions: ['Questions', '質問', '질문', '题目'],
  adm_examd_teacher: ['Instructor', '講師', '강사', '讲师'],
  adm_examd_time: ['Time', '時間', '시간', '时间'],
  adm_examd_total_attempts: ['Total attempts', '受験総数', '응시 총 횟수', '总考试次数'],
  adm_examd_total_points: ['Total points', '合計点', '총 점수', '总分'],
  adm_examd_total_points_label: ['Total points:', '合計点:', '총 점수:', '总分:'],
  adm_examd_updated_at: ['Updated', '更新日時', '업데이트', '更新时间'],

  // ── adm_prof_* ──
  adm_prof_avatar_fail: ['Error uploading avatar', 'アバターのアップロードエラー', '아바타 업로드 오류', '上传头像出错'],
  adm_prof_avatar_hint: ['Click avatar to change (PNG, JPG - Max 2MB)', 'アバターをクリックして変更（PNG、JPG - 最大2MB）', '아바타를 클릭하여 변경 (PNG, JPG - 최대 2MB)', '点击头像更换（PNG, JPG - 最大2MB）'],
  adm_prof_avatar_selected: ['New avatar selected', '新しいアバターが選択されました', '새 아바타가 선택되었습니다', '已选择新头像'],
  adm_prof_change_pw: ['Change password', 'パスワード変更', '비밀번호 변경', '修改密码'],
  adm_prof_confirm_pw: ['Confirm new password', '新しいパスワードの確認', '새 비밀번호 확인', '确认新密码'],
  adm_prof_confirm_pw_placeholder: ['Re-enter new password', '新しいパスワードを再入力', '새 비밀번호 재입력', '重新输入新密码'],
  adm_prof_current_pw: ['Current password', '現在のパスワード', '현재 비밀번호', '当前密码'],
  adm_prof_current_pw_placeholder: ['Enter current password', '現在のパスワードを入力', '현재 비밀번호 입력', '输入当前密码'],
  adm_prof_email_readonly: ['Email cannot be changed for security reasons', 'メールはセキュリティ上変更できません', '보안상의 이유로 이메일을 변경할 수 없습니다', '出于安全原因，邮箱无法更改'],
  adm_prof_file_too_large: ['File size must not exceed 5MB', 'ファイルサイズは5MB以下にしてください', '파일 크기는 5MB를 초과할 수 없습니다', '文件大小不能超过5MB'],
  adm_prof_login_again: ['Please log in again', '再度ログインしてください', '다시 로그인해주세요', '请重新登录'],
  adm_prof_name: ['Full name', '氏名', '성명', '姓名'],
  adm_prof_name_placeholder: ['Enter your full name', '氏名を入力', '성명을 입력', '输入姓名'],
  adm_prof_new_pw: ['New password', '新しいパスワード', '새 비밀번호', '新密码'],
  adm_prof_new_pw_placeholder: ['Enter new password (minimum 6 characters)', '新しいパスワードを入力（6文字以上）', '새 비밀번호 입력 (최소 6자)', '输入新密码（最少6个字符）'],
  adm_prof_phone: ['Phone number', '電話番号', '전화번호', '电话号码'],
  adm_prof_phone_placeholder: ['Enter phone number (optional)', '電話番号を入力（任意）', '전화번호 입력 (선택사항)', '输入电话号码（可选）'],
  adm_prof_pw_fail: ['Error changing password. Please check current password.', 'パスワード変更エラー。現在のパスワードを確認してください。', '비밀번호 변경 오류. 현재 비밀번호를 확인해주세요.', '修改密码出错。请检查当前密码。'],
  adm_prof_pw_mismatch: ['New passwords do not match!', '新しいパスワードが一致しません！', '새 비밀번호가 일치하지 않습니다!', '新密码不匹配！'],
  adm_prof_pw_ok: ['Password changed successfully!', 'パスワードが変更されました！', '비밀번호가 변경되었습니다!', '密码修改成功！'],
  adm_prof_pw_too_short: ['New password must be at least 6 characters!', '新しいパスワードは6文字以上必要です！', '새 비밀번호는 최소 6자 이상이어야 합니다!', '新密码至少需要6个字符！'],
  adm_prof_save: ['Save changes', '変更を保存', '변경사항 저장', '保存更改'],
  adm_prof_saving: ['Saving...', '保存中...', '저장 중...', '保存中...'],
  adm_prof_subtitle: ['Manage account information and security', 'アカウント情報とセキュリティを管理', '계정 정보 및 보안 관리', '管理账户信息和安全'],
  adm_prof_tab_info: ['Personal information', '個人情報', '개인 정보', '个人信息'],
  adm_prof_tab_password: ['Change password', 'パスワード変更', '비밀번호 변경', '修改密码'],
  adm_prof_title: ['Personal Profile', 'プロフィール', '개인 프로필', '个人资料'],
  adm_prof_update_fail: ['Error updating profile', 'プロフィール更新エラー', '프로필 업데이트 오류', '更新个人资料出错'],
  adm_prof_update_ok: ['Profile updated successfully!', 'プロフィールが更新されました！', '프로필이 업데이트되었습니다!', '个人资料更新成功！'],
  adm_prof_user_not_found: ['User info not found', 'ユーザー情報が見つかりません', '사용자 정보를 찾을 수 없습니다', '未找到用户信息'],

  // ── adm_rpt_* ──
  adm_rpt_12_months: ['12 months', '12ヶ月', '12개월', '12个月'],
  adm_rpt_category_dist: ['Distribution by category', 'カテゴリ別分布', '카테고리별 분포', '按分类分布'],
  adm_rpt_category_revenue: ['Revenue ratio by category', 'カテゴリ別収益比率', '카테고리별 수익 비율', '按分类的收入比例'],
  adm_rpt_completion_desc: ['Track student completion levels', '受講生の完了率を追跡', '수강생의 완료 수준을 추적', '追踪学员完成情况'],
  adm_rpt_completion_progress: ['Completion rate', '完了率', '완료율', '完成率'],
  adm_rpt_completion_rate: ['Completion rate by category', 'カテゴリ別完了率', '카테고리별 완료율', '按分类的完成率'],
  adm_rpt_course_perf: ['Course performance', 'コースパフォーマンス', '코스 성과', '课程表现'],
  adm_rpt_course_perf_desc: ['Detailed statistics by course', 'コース別の詳細統計', '코스별 상세 통계', '按课程的详细统计'],
  adm_rpt_courses: ['Courses', 'コース', '코스', '课程'],
  adm_rpt_day: ['Day', '日', '일', '日'],
  adm_rpt_export: ['Export report', 'レポートをエクスポート', '보고서 내보내기', '导出报告'],
  adm_rpt_export_desc: ['The Excel file will contain all displayed data.', 'Excelファイルには表示中の全データが含まれます。', 'Excel 파일에 표시 중인 모든 데이터가 포함됩니다.', 'Excel文件将包含所有显示的数据。'],
  adm_rpt_export_excel: ['Export Excel report', 'Excelレポートをエクスポート', 'Excel 보고서 내보내기', '导出Excel报告'],
  adm_rpt_full_year: ['Full year', '通年', '연간', '全年'],
  adm_rpt_last_7_days: ['Last 7 days', '過去7日', '최근 7일', '最近7天'],
  adm_rpt_legend_orders: ['Orders', '注文', '주문', '订单'],
  adm_rpt_legend_revenue: ['Revenue', '収益', '수익', '收入'],
  adm_rpt_legend_students: ['Students', '受講生', '수강생', '学员'],
  adm_rpt_legend_teachers: ['Teachers', '教師', '교사', '教师'],
  adm_rpt_load_fail: ['Failed to load report. Please try again.', 'レポートの読み込みに失敗しました。再試行してください。', '보고서를 불러올 수 없습니다. 다시 시도해주세요.', '无法加载报告。请重试。'],
  adm_rpt_month: ['Month', '月', '월', '月'],
  adm_rpt_name_category: ['Category report', 'カテゴリレポート', '카테고리 보고서', '分类报告'],
  adm_rpt_name_courses: ['Course report', 'コースレポート', '코스 보고서', '课程报告'],
  adm_rpt_name_revenue: ['Revenue report', '収益レポート', '수익 보고서', '收入报告'],
  adm_rpt_name_students: ['Student report', '受講生レポート', '수강생 보고서', '学员报告'],
  adm_rpt_name_teachers: ['Teacher report', '教師レポート', '교사 보고서', '教师报告'],
  adm_rpt_no_data: ['No data yet', 'データなし', '데이터 없음', '暂无数据'],
  adm_rpt_period_update: ['Period update', '期間更新', '기간 업데이트', '按期更新'],
  adm_rpt_revenue_chart: ['Revenue chart', '収益チャート', '수익 차트', '收入图表'],
  adm_rpt_student_growth: ['Student growth', '受講生の成長', '수강생 증가', '学员增长'],
  adm_rpt_student_growth_desc: ['Number of students over time', '時系列の受講生数', '시간별 수강생 수', '学员数量随时间变化'],
  adm_rpt_teacher_growth: ['Teacher growth', '教師の成長', '교사 증가', '教师增长'],
  adm_rpt_teacher_growth_desc: ['Number of teachers over time', '時系列の教師数', '시간별 교사 수', '教师数量随时间变化'],
  adm_rpt_subtitle: ['View detailed platform performance', 'プラットフォームのパフォーマンス詳細を表示', '플랫폼 성과 상세 보기', '查看平台详细表现'],
  adm_rpt_th_category: ['Category', 'カテゴリ', '카테고리', '分类'],
  adm_rpt_th_completion: ['Completion', '完了', '완료', '完成'],
  adm_rpt_th_course: ['Course', 'コース', '코스', '课程'],
  adm_rpt_th_enrollments: ['Total enrollments', '総登録数', '전체 등록', '总注册'],
  adm_rpt_th_instructor: ['Instructor', '講師', '강사', '讲师'],
  adm_rpt_th_rating: ['Rating', '評価', '평점', '评分'],
  adm_rpt_th_ratio: ['Ratio', '比率', '비율', '比例'],
  adm_rpt_th_revenue: ['Revenue', '収益', '수익', '收入'],
  adm_rpt_th_students: ['Students', '受講生', '수강생', '学员'],
  adm_rpt_this_week: ['This week', '今週', '이번 주', '本周'],
  adm_rpt_title: ['Reports & Analytics', 'レポート & 分析', '보고서 & 분석', '报告与分析'],
  adm_rpt_total_revenue: ['Total revenue', '総収益', '총 수익', '总收入'],
  adm_rpt_total_students: ['Total students', '受講生合計', '전체 수강생', '总学员数'],
  adm_rpt_total_teachers: ['Total teachers', '教師合計', '전체 교사', '总教师数'],
  adm_rpt_week: ['Week', '週', '주', '周'],
  adm_rpt_xl_category: ['Category', 'カテゴリ', '카테고리', '分类'],
  adm_rpt_xl_completion: ['Completion (%)', '完了（%）', '완료 (%)', '完成率（%）'],
  adm_rpt_xl_course: ['Course', 'コース', '코스', '课程'],
  adm_rpt_xl_export_date: ['Export date', 'エクスポート日', '내보내기 날짜', '导出日期'],
  adm_rpt_xl_growth: ['Growth (%)', '成長（%）', '성장 (%)', '增长（%）'],
  adm_rpt_xl_instructor: ['Instructor', '講師', '강사', '讲师'],
  adm_rpt_xl_orders: ['Orders', '注文', '주문', '订单'],
  adm_rpt_xl_period: ['Period', '期間', '기간', '期间'],
  adm_rpt_xl_rating: ['Rating', '評価', '평점', '评分'],
  adm_rpt_xl_ratio: ['Ratio (%)', '比率（%）', '비율 (%)', '比例（%）'],
  adm_rpt_xl_report: ['Report', 'レポート', '보고서', '报告'],
  adm_rpt_xl_revenue: ['Revenue', '収益', '수익', '收入'],
  adm_rpt_xl_students: ['Students', '受講生', '수강생', '学员'],
  adm_rpt_xl_teachers: ['Teachers', '教師', '교사', '教师'],
  adm_rpt_xl_time: ['Time', '時間', '시간', '时间'],
  adm_rpt_year: ['Year', '年', '년', '年'],
};

// ── 4. Merge explicit translations from second and third files ──
Object.assign(explicit, explicit2);

// Merge explicit3 (which uses {vi,en,ja,ko,"zh-CN"} format)
for (const [key, val] of Object.entries(explicit3)) {
  if (val.vi) explicit[key] = [val.en, val.ja, val.ko, val['zh-CN']];
}

// Merge explicit4 (same format as explicit3)
for (const [key, val] of Object.entries(explicit4)) {
  if (val.vi) explicit[key] = [val.en, val.ja, val.ko, val['zh-CN']];
}

// Merge explicit5 (same format as explicit3)
for (const [key, val] of Object.entries(explicit5)) {
  if (val.vi) explicit[key] = [val.en, val.ja, val.ko, val['zh-CN']];
}

// ── 5. Build final translation objects ──
const langs = ['en', 'ja', 'ko', 'zh'];
const langIdx = { en: 0, ja: 1, ko: 2, zh: 3 };
const results = { vi: {}, en: {}, ja: {}, ko: {}, 'zh-CN': {} };

let explicitCount = 0;
let autoCount = 0;
let fallbackCount = 0;

// Build a map of correct Vietnamese texts from explicit3/4 (overrides allKeys)
const viOverrides = {};
for (const src of [explicit3, explicit4, explicit5]) {
  for (const [key, val] of Object.entries(src)) {
    if (val.vi) viOverrides[key] = val.vi;
  }
}

const sortedKeys = Object.keys(allKeys).sort();

for (const key of sortedKeys) {
  const vi = viOverrides[key] || allKeys[key];
  results.vi[key] = vi;
  
  if (explicit[key]) {
    const [en, ja, ko, zh] = explicit[key];
    results.en[key] = en;
    results.ja[key] = ja;
    results.ko[key] = ko;
    results['zh-CN'][key] = zh;
    explicitCount++;
  } else {
    // Try auto-translate
    const enAuto = autoTranslate(vi, 1);
    const jaAuto = autoTranslate(vi, 2);
    const koAuto = autoTranslate(vi, 3);
    const zhAuto = autoTranslate(vi, 4);
    
    if (enAuto) {
      results.en[key] = enAuto;
      results.ja[key] = jaAuto || vi;
      results.ko[key] = koAuto || vi;
      results['zh-CN'][key] = zhAuto || vi;
      autoCount++;
    } else {
      // Fallback to Vietnamese
      results.en[key] = vi;
      results.ja[key] = vi;
      results.ko[key] = vi;
      results['zh-CN'][key] = vi;
      fallbackCount++;
    }
  }
}

console.log(`\nTranslation stats:`);
console.log(`  Explicit: ${explicitCount}`);
console.log(`  Auto-translated: ${autoCount}`);
console.log(`  Fallback (Vietnamese): ${fallbackCount}`);
console.log(`  Total: ${sortedKeys.length}`);

// ── 6. Write translations.ts ──
function formatBlock(langKey, obj) {
  const entries = Object.entries(obj);
  let out = `  '${langKey}': {\n`;
  for (const [k, v] of entries) {
    const escaped = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    out += `    ${k}: '${escaped}',\n`;
  }
  out += `  }`;
  return out;
}

const tsContent = `// Auto-generated by scripts/generate-translations.mjs
// Total keys: ${sortedKeys.length} | Explicit: ${explicitCount} | Auto: ${autoCount} | Fallback: ${fallbackCount}
// Do not edit manually - regenerate with: node scripts/generate-translations.mjs

export const translations: Record<string, Record<string, string>> = {
${formatBlock('vi', results.vi)},
${formatBlock('en', results.en)},
${formatBlock('ja', results.ja)},
${formatBlock('ko', results.ko)},
${formatBlock('zh-CN', results['zh-CN'])},
};
`;

const outPath = join(ROOT, 'lib', 'i18n', 'translations.ts');
writeFileSync(outPath, tsContent, 'utf-8');
console.log(`\nWrote ${outPath}`);
console.log(`File size: ${(Buffer.byteLength(tsContent) / 1024).toFixed(1)} KB`);

// ── 7. Report fallback keys (for future improvement) ──
if (fallbackCount > 0) {
  const fallbackKeys = sortedKeys.filter(k => !explicit[k] && !autoTranslate(allKeys[k], 1));
  const reportPath = join(__dirname, 'untranslated-keys.txt');
  writeFileSync(reportPath, fallbackKeys.map(k => `${k}\t${allKeys[k]}`).join('\n'), 'utf-8');
  console.log(`\nWrote ${fallbackKeys.length} untranslated keys to ${reportPath}`);
}
