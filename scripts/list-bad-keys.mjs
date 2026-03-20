import { readFileSync } from 'fs';

const ts = readFileSync('lib/i18n/translations.ts', 'utf-8');

const viStart = ts.indexOf("'vi': {");
const viEnd = ts.indexOf('\n  },', viStart);
const viSection = ts.substring(viStart, viEnd);
const viKeys = {};
for (const line of viSection.split('\n')) {
  const m = line.match(/^\s+(\w+):\s*'(.*)'/);
  if (m) viKeys[m[1]] = m[2];
}

const badKeys = [
  'adm_set_qr_note','assign_filter_course','auth_aes_encryption','auth_check_login_info',
  'auth_reset_desc','cart_load_error','cert_title','checkout_confirm_paid',
  'common_filter_by','discuss_filter_course','discuss_filter_lesson',
  'enroll_invoice_term2','enroll_invoice_term4','enroll_pending_title',
  'exam_available_from','exam_available_until','exam_no_certs','exam_practice_desc',
  'exam_published','exam_select_course_first','exam_title',
  'faq_no_results','footer_updates_desc','forgot_form_sent_title',
  'google_err_back_login','google_err_inactive_title','google_login_processing',
  'home_courses_desc','home_metric_students',
  'logout_confirm_message','logout_confirm_subtitle',
  'mycourses_buy_more','mycourses_title','nav_my_home',
  'notes_clear_all_filters','notes_edit_desc','notes_fetch_error','notes_loading_fav',
  'pay_view_course','payment_card_hint',
  'profile_desc','profile_new_pwd_placeholder',
  'refund_condition_1','refund_summary_4',
  'reset_new_password_placeholder',
  'settings_course_desc','settings_course_notif','settings_desc',
  'settings_new_course_desc','settings_notif_title','settings_saved',
  'signup_role_student_desc','student_menu_my_courses',
  'tch_lsn_free_preview','tch_prof_ph_new_pw','tch_rev_reply_sent','tch_rev_subtitle',
  'teacher_analytics_completion_desc','teacher_analytics_enrollments',
  'teacher_analytics_total_enrollments',
  'tfa_download','tfa_save_backup_title','topup_title',
  'user_confirm_unlock','user_edit_info','user_unlock_account',
  'user_unlock_failed','user_unlocked',
  'userdb_no_courses','userdb_view_all',
  'wishlist_select_to_see','wishlist_title'
];

for (const key of badKeys.sort()) {
  console.log(`  ${key}: '${viKeys[key] || 'NOT_FOUND'}',`);
}
console.log(`Total: ${badKeys.length}`);
