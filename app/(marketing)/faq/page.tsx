"use client"

import { useState } from "react"
import { ChevronDown, Search, HelpCircle, Book, CreditCard, User, Settings, Shield } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
  category: string
}

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [expandedItems, setExpandedItems] = useState<number[]>([])

  const categories = [
    { id: "all", label: "Tất cả", icon: HelpCircle },
    { id: "general", label: "Chung", icon: Book },
    { id: "course", label: "Khóa học", icon: Book },
    { id: "payment", label: "Thanh toán", icon: CreditCard },
    { id: "account", label: "Tài khoản", icon: User },
    { id: "technical", label: "Kỹ thuật", icon: Settings },
    { id: "policy", label: "Chính sách", icon: Shield }
  ]

  const faqs: FAQItem[] = [
    {
      question: "ICS Learning là gì?",
      answer: "ICS Learning là nền tảng học trực tuyến hàng đầu tại Việt Nam, cung cấp hàng ngàn khóa học chất lượng cao trong nhiều lĩnh vực như lập trình, thiết kế, kinh doanh, marketing, và nhiều hơn nữa. Chúng tôi kết nối học viên với các giảng viên chuyên nghiệp và giúp họ phát triển kỹ năng cần thiết cho sự nghiệp.",
      category: "general"
    },
    {
      question: "Làm thế nào để đăng ký tài khoản?",
      answer: "Bạn có thể đăng ký tài khoản miễn phí bằng cách nhấn vào nút 'Đăng ký' ở góc trên bên phải của trang web. Điền thông tin cá nhân của bạn (email, mật khẩu) và xác nhận email để kích hoạt tài khoản. Quá trình này chỉ mất vài phút.",
      category: "account"
    },
    {
      question: "Tôi có thể học miễn phí không?",
      answer: "ICS Learning cung cấp cả khóa học miễn phí và trả phí. Bạn có thể tìm kiếm và lọc các khóa học miễn phí trong danh mục khóa học. Tuy nhiên, các khóa học trả phí thường cung cấp nội dung chuyên sâu hơn, chứng chỉ hoàn thành và quyền truy cập trọn đời.",
      category: "course"
    },
    {
      question: "Các hình thức thanh toán được hỗ trợ?",
      answer: "Chúng tôi chấp nhận nhiều hình thức thanh toán bao gồm: Thẻ tín dụng/ghi nợ quốc tế (Visa, Mastercard, JCB), Ví điện tử (Momo, ZaloPay, VNPay), Chuyển khoản ngân hàng, và thanh toán qua cổng Stripe. Mọi giao dịch đều được bảo mật tuyệt đối.",
      category: "payment"
    },
    {
      question: "Sau khi mua khóa học, tôi có quyền truy cập trong bao lâu?",
      answer: "Khi bạn mua một khóa học, bạn sẽ có quyền truy cập trọn đời vào nội dung khóa học đó. Bạn có thể học bất cứ lúc nào, tốc độ tùy ý, và xem lại nội dung nhiều lần. Khóa học cũng sẽ được cập nhật miễn phí khi có nội dung mới.",
      category: "course"
    },
    {
      question: "Tôi có thể hoàn tiền không?",
      answer: "Chúng tôi cung cấp chính sách hoàn tiền trong vòng 30 ngày kể từ ngày mua khóa học nếu bạn không hài lòng. Để yêu cầu hoàn tiền, vui lòng liên hệ với bộ phận hỗ trợ khách hàng qua email hoặc chat trực tuyến. Lưu ý rằng bạn không được xem quá 30% nội dung khóa học để đủ điều kiện hoàn tiền.",
      category: "payment"
    },
    {
      question: "Làm thế nào để đặt lại mật khẩu?",
      answer: "Nếu bạn quên mật khẩu, nhấn vào 'Quên mật khẩu' trên trang đăng nhập. Nhập địa chỉ email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu đến email của bạn. Link này có hiệu lực trong 24 giờ. Sau khi nhấn vào link, bạn có thể tạo mật khẩu mới cho tài khoản của mình.",
      category: "account"
    },
    {
      question: "Tôi có nhận được chứng chỉ sau khi hoàn thành khóa học không?",
      answer: "Có, sau khi hoàn thành 100% nội dung khóa học và vượt qua bài kiểm tra cuối khóa (nếu có), bạn sẽ nhận được chứng chỉ hoàn thành. Chứng chỉ có thể tải xuống dưới dạng PDF và chia sẻ trên LinkedIn hoặc mạng xã hội khác.",
      category: "course"
    },
    {
      question: "Làm thế nào để liên hệ với giảng viên?",
      answer: "Mỗi khóa học có phần Q&A (Hỏi đáp) nơi bạn có thể đặt câu hỏi trực tiếp cho giảng viên. Giảng viên sẽ trả lời câu hỏi của bạn trong vòng 24-48 giờ. Bạn cũng có thể gửi tin nhắn trực tiếp cho giảng viên thông qua hệ thống nhắn tin nội bộ.",
      category: "course"
    },
    {
      question: "Tôi gặp vấn đề kỹ thuật khi xem video, phải làm sao?",
      answer: "Nếu bạn gặp vấn đề với video (không load, giật lag, không có âm thanh), hãy thử: 1) Làm mới trang web, 2) Xóa cache trình duyệt, 3) Thử trình duyệt khác, 4) Kiểm tra kết nối internet. Nếu vấn đề vẫn tiếp diễn, liên hệ bộ phận hỗ trợ kỹ thuật với thông tin chi tiết về lỗi.",
      category: "technical"
    },
    {
      question: "Dữ liệu cá nhân của tôi có được bảo mật không?",
      answer: "ICS Learning cam kết bảo vệ dữ liệu cá nhân của bạn theo tiêu chuẩn quốc tế. Chúng tôi sử dụng mã hóa SSL/TLS cho mọi giao dịch, không chia sẻ thông tin của bạn với bên thứ ba mà không có sự đồng ý, và tuân thủ nghiêm ngặt các quy định về bảo vệ dữ liệu cá nhân.",
      category: "policy"
    },
    {
      question: "Tôi có thể học trên điện thoại không?",
      answer: "Có, ICS Learning được tối ưu hóa cho mọi thiết bị. Bạn có thể truy cập và học trên trình duyệt mobile hoặc tải ứng dụng ICS Learning trên iOS và Android để có trải nghiệm tốt nhất. Ứng dụng cho phép bạn tải video để xem offline.",
      category: "technical"
    },
    {
      question: "Làm thế nào để trở thành giảng viên?",
      answer: "Để trở thành giảng viên trên ICS Learning, truy cập trang 'Giảng dạy' và điền form đăng ký. Chúng tôi sẽ xem xét hồ sơ và kinh nghiệm của bạn. Sau khi được duyệt, bạn có thể tạo và upload khóa học của mình. Giảng viên sẽ nhận được hoa hồng từ mỗi khóa học bán ra.",
      category: "general"
    },
    {
      question: "Khóa học có phụ đề tiếng Việt không?",
      answer: "Hầu hết các khóa học do giảng viên Việt Nam tạo ra đều có audio và phụ đề tiếng Việt. Đối với khóa học quốc tế, chúng tôi đang từng bước bổ sung phụ đề tiếng Việt. Bạn có thể kiểm tra ngôn ngữ của khóa học trước khi mua trong phần thông tin khóa học.",
      category: "course"
    },
    {
      question: "Tôi có thể tặng khóa học cho người khác không?",
      answer: "Có, ICS Learning có tính năng tặng khóa học (Gift). Bạn có thể mua khóa học và gửi mã kích hoạt cho người nhận qua email. Người nhận sẽ có thể sử dụng mã này để kích hoạt khóa học vào tài khoản của họ.",
      category: "payment"
    },
    {
      question: "Có giảm giá cho học sinh, sinh viên không?",
      answer: "ICS Learning thường xuyên có các chương trình ưu đãi đặc biệt cho học sinh, sinh viên. Đăng ký nhận bản tin để cập nhật các chương trình khuyến mãi. Ngoài ra, các giảng viên cũng thường xuyên có flash sale với giá ưu đãi lên tới 80%.",
      category: "payment"
    }
  ]

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleItem = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="text-white" size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-4">
            Câu hỏi thường gặp
          </h1>
          <p className="text-lg text-muted-foreground dark:text-slate-400 mb-8">
            Tìm câu trả lời cho những câu hỏi phổ biến về ICS Learning
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-border dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                    activeCategory === category.id
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                      : "bg-card dark:bg-slate-900/60 text-muted-foreground hover:text-foreground dark:hover:text-white border border-border dark:border-slate-800"
                  }`}
                >
                  <Icon size={18} />
                  {category.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">
                Không tìm thấy câu hỏi nào phù hợp. Vui lòng thử từ khóa khác.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-secondary/30 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <span className="font-semibold text-foreground dark:text-white pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`text-muted-foreground flex-shrink-0 transition-transform ${
                        expandedItems.includes(index) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedItems.includes(index) && (
                    <div className="px-6 pb-5 border-t border-border dark:border-slate-800">
                      <p className="text-muted-foreground dark:text-slate-400 pt-4 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground dark:text-white mb-4">
            Vẫn cần hỗ trợ?
          </h2>
          <p className="text-muted-foreground dark:text-slate-400 mb-8">
            Nếu bạn không tìm thấy câu trả lời mình cần, đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="px-8 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Liên hệ hỗ trợ
            </a>
            <a
              href="mailto:support@icslearning.vn"
              className="px-8 py-4 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 text-foreground dark:text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Gửi email
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
