import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Roboto } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import { SystemConfigProvider } from "@/lib/system-config/system-config-context"
import { MaintenanceWatcher } from "@/lib/system-config/maintenance-watcher"
const roboto = Roboto({ 
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap"
})

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "ICS Learning - Nền tảng học trực tuyến cao cấp",
  description: "Khám phá tri thức hiện đại. Học theo cách của bạn.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${roboto.variable} font-sans antialiased bg-background text-foreground transition-smooth`} style={{ fontFamily: 'var(--font-roboto), sans-serif' }}>
        <ThemeProvider>
          <AuthProvider>
            <SystemConfigProvider>
            <MaintenanceWatcher />
            {children}
            </SystemConfigProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <Script id="gim-chatbot" strategy="afterInteractive">
          {`window.__gim = window.__gim || {};
window.__gim.licenseId = "604927107960698062";
(function(c,o){const e=[],n={_handler:null,_version:"1.0",_queue:e,on:function(){return e.push(["on",arguments]),n},call:function(){return e.push(["call",arguments]),n},loadScript:function(){const t=o.createElement("script");t.async=!0,t.type="text/javascript",t.src="https://botsdk.stg.gim.beango.com/index.umd.js",o.head.appendChild(t)}};n.loadScript(),window.GIMBotTool=n})(window,document);`}
        </Script>
        <Script id="gim-chatbot-stick" strategy="afterInteractive">
          {`(function(){
  var fixButton = function(){
    var container = document.getElementById("gim-bot-tool-button-container");
    if (!container) return;
    
    // Handle visibility based on data attribute
    if (document.body.dataset.chatbot === "header") {
      container.style.display = "none";
      return;
    }
    container.style.display = "";
    
    // Move to body if needed
    if (container.parentElement !== document.body) {
      document.body.appendChild(container);
    }
    
    // Apply viewport-fixed positioning with inset
    container.style.position = "fixed";
    container.style.inset = "auto 24px 24px auto";
    container.style.transform = "none";
    container.style.willChange = "transform";
    container.style.zIndex = "2147483647";
    container.style.pointerEvents = "none";
    container.style.width = "auto";
    container.style.height = "auto";

    var chatButton = document.getElementById("gim-bot-tool-button");
    if (chatButton) {
      chatButton.style.pointerEvents = "auto";
      chatButton.style.touchAction = "manipulation";
    }
    
    // Handle bot container (chat panel)
    var botContainer = document.getElementById("gim-bot-tool-bot-container");
    if (botContainer) {
      if (botContainer.parentElement !== document.body) {
        document.body.appendChild(botContainer);
      }
      botContainer.style.position = "fixed";
      botContainer.style.right = "24px";
      botContainer.style.bottom = "96px";
      botContainer.style.top = "auto";
      botContainer.style.zIndex = "10000";
      botContainer.style.pointerEvents = "auto";
    }
  };

  // Initial fix
  fixButton();
  
  // Keep observer running to continuously reposition if SDK re-renders
  var observer = new MutationObserver(function(){
    fixButton();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  
  // Handle scroll on viewport element
  var scrollEl = document.querySelector(".main") || window;
  scrollEl.addEventListener("scroll", function(){
    fixButton();
  }, { passive: true });
})();`}
        </Script>
        <div id="gim-chatbot-popup" role="status" aria-live="polite">
          <span>Bạn cần hỗ trợ gì hôm nay?</span>
          <button type="button" aria-label="Đóng thông báo" id="gim-chatbot-popup-close">×</button>
        </div>
        <Script id="gim-chatbot-popup-script" strategy="afterInteractive">
          {`(function(){
  var popup = document.getElementById("gim-chatbot-popup");
  var closeBtn = document.getElementById("gim-chatbot-popup-close");
  if (!popup) return;
  var dismissed = false;

  var showPopup = function(){
    if (!dismissed) popup.classList.add("is-visible");
  };
  var hidePopup = function(){ popup.classList.remove("is-visible"); };

  var bindChatButton = function(){
    var chatButton = document.getElementById("gim-bot-tool-button");
    if (chatButton && !chatButton.__popupBound) {
      chatButton.addEventListener("click", function(){
        dismissed = true;
        hidePopup();
      });
      chatButton.__popupBound = true;
    }
  };

  var onScroll = function(){
    if (dismissed) return;
    if (window.scrollY > 200) {
      showPopup();
    } else {
      hidePopup();
    }
  };

  if (closeBtn) {
    closeBtn.addEventListener("click", function(){
      dismissed = true;
      hidePopup();
    });
  }

  bindChatButton();
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var observer = new MutationObserver(function(){ bindChatButton(); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();`}
        </Script>
        <Script id="motion-profile" strategy="afterInteractive">
          {`(function(){
  try {
    var nav = navigator || {};
    var conn = nav.connection || nav.mozConnection || nav.webkitConnection || {};
    var params = new URLSearchParams(window.location.search || "");
    var forced = (params.get('motion') || '').toLowerCase();
    var memory = nav.deviceMemory || 8;
    var cores = nav.hardwareConcurrency || 8;
    var saveData = !!conn.saveData;
    var slowNet = /(^2g$)|(^slow-2g$)/i.test(conn.effectiveType || "");
    var lowSpec = memory <= 4 || cores <= 4;
    var prefersReduced = false;

    try {
      prefersReduced = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}

    var root = document.documentElement;
    var body = document.body;

    var forceLite = forced === 'lite';
    var forceFull = forced === 'full';
    var shouldLite = forceLite || (!forceFull && (saveData || slowNet || lowSpec || prefersReduced));

    root.classList.remove('motion-lite');
    body.classList.remove('motion-lite');

    if (shouldLite) {
      root.classList.add('motion-lite');
      body.classList.add('motion-lite');
      root.setAttribute('data-motion-profile', forceLite ? 'lite-forced' : 'lite-auto');
    } else {
      root.setAttribute('data-motion-profile', forceFull ? 'full-forced' : 'full-auto');
    }

    if (forced && forced !== 'lite' && forced !== 'full') {
      root.setAttribute('data-motion-debug', 'invalid-param');
    }

    if (forced === 'lite' || forced === 'full') {
      root.setAttribute('data-motion-debug', 'query-override');
    } else {
      root.removeAttribute('data-motion-debug');
    }

  } catch (e) {}
})();`}
        </Script>
      </body>
    </html>
  )
}