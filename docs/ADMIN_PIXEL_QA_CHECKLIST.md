# ADMIN PIXEL QA CHECKLIST

Ngay cap nhat: 2026-04-03
Pham vi: /admin/exams, /admin/certificates, /admin/payments, /admin/subscriptions, /admin/reports, /admin/settings, /admin/courses
Moc doi chieu phong cach: /admin/dashboard, /admin/users, /admin/categories

## Quy uoc danh dau
- PASS: da dat theo code audit sau vong can chinh cuoi.
- FAIL: chua dat, can sua tiep.

## Breakpoint 360
| Muc | Ket qua | Ghi chu |
|---|---|---|
| Shadow he thong | PASS | Card/filter/table shell da dua ve token nen thong nhat: shadow-[0_10px_28px_rgba(15,23,42,0.12)] cho khoi chinh. |
| Button size he thong | PASS | Nhom button hanh dong chinh da theo he h-10/h-11, modal confirm theo h-11. |
| Spacing doc filter-table-card-modal | PASS | Nhip gap/space-y card list mobile da dong bo giua courses/exams/payments/certificates/reports/subscriptions/settings. |

## Breakpoint 768
| Muc | Ket qua | Ghi chu |
|---|---|---|
| Shadow he thong | PASS | Main panel, table wrapper, card list dong pha do bong. |
| Button size he thong | PASS | CTA/Export/Save/Action button da can lai cung cap do text-sm + rounded-xl. |
| Spacing doc filter-table-card-modal | PASS | Filter block -> table/card -> modal da can nhiep cach deu. |

## Breakpoint 1024
| Muc | Ket qua | Ghi chu |
|---|---|---|
| Shadow he thong | PASS | Do bong khoi noi dung chinh dong nhat tren 7 trang quan tri. |
| Button size he thong | PASS | Nhom button table/menu/modal da dong bo, giam tinh trang nut bi cao/thap lech. |
| Spacing doc filter-table-card-modal | PASS | Nhip khoang cach section va card/list da can theo cung he. |

## Breakpoint 1440
| Muc | Ket qua | Ghi chu |
|---|---|---|
| Shadow he thong | PASS | Tong quan mat bang desktop lon da giu cung ngon ngu depth voi dashboard/users/categories. |
| Button size he thong | PASS | He kich thuoc nut giu on dinh tren khung rong lon, khong vo rhythm. |
| Spacing doc filter-table-card-modal | PASS | Truc doc giua hero, filter, table/card va modal da lien mach. |

## Micro requirements (courses)
| Hang muc | Ket qua | Ghi chu |
|---|---|---|
| Giam do dam metadata card mobile | PASS | Metadata mobile da giam trong so thi giac (tone text nhe hon). |
| Tang line-height title course trong table | PASS | Tieu de table da tang nhe line-height de doc title dai de hon. |
| Hover row table trung tinh hon | PASS | Hover row da chuyen ve neutral slate, giam sac xanh. |

## Ghi chu xac nhan
- Checklist nay duoc danh dau theo code-level visual QA sau vong chinh cuoi.
- Neu can xac nhan pixel-perfect runtime, tiep tuc doi chieu tren localhost voi viewport lock: 360x800, 768x1024, 1024x768, 1440x900.
