"use client"

import type React from "react"
import Script from "next/script"
import { Navbar } from "@/components/ui/navbar"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="stagger-items">{children}</div>
      <Script id="gim-chatbot-marketing" strategy="afterInteractive">
        {`window.__gim = window.__gim || {};
window.__gim.licenseId = "614197095947060277";
(function(c,o){const e=[],n={_handler:null,_version:"1.0",_queue:e,on:function(){return e.push(["on",arguments]),n},call:function(){return e.push(["call",arguments]),n},loadScript:function(){const t=o.createElement("script");t.async=!0,t.type="text/javascript",t.src="https://botsdk.stg.gim.beango.com/index.umd.js",o.head.appendChild(t)}};n.loadScript(),window.GIMBotTool=n})(window,document);`}
      </Script>
    </>
  )
}
