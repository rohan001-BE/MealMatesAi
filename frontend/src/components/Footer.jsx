import React from "react";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#fff3e6] text-gray-700 px-6 pt-16 pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Top: Brand + Nav columns */}
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
          
          {/* Brand */}
          <div className="md:w-1/3 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo.png"
                alt="Meal Mates Logo"
                className="h-11 w-11 rounded-full object-cover shadow-md"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-orange-500 font-headline block">
                  Meal Mates
                </span>
                <span className="text-sm text-orange-400 font-semibold">AI Nutrition Platform</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Your personalized AI meal planner built for Pakistani dietary culture. Eat better, track smarter, live healthier.
            </p>
            {/* Social icons */}
            <div className="flex gap-4 pt-2">
              {[
                { icon: <FaFacebook />, label: "Facebook", href: "#" },
                { icon: <FaInstagram />, label: "Instagram", href: "#" },
                { icon: <FaTwitter />, label: "Twitter", href: "#" },
                { icon: <FaWhatsapp />, label: "WhatsApp", href: "#" },
                { icon: <FaLinkedin />, label: "LinkedIn", href: "#" },
              ].map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white shadow-sm border border-orange-100 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-300 transition-all"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1">
            {/* Product */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "How It Works", href: "/how-it-works" },
                  { label: "Features", href: "/features" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "Meal Planner", href: "/meal-planner" },
                  { label: "AI Chatbot", href: "/chatbot" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "About Us", href: "/about" },
                  { label: "Contact", href: "/contact" },
                  { label: "Reviews", href: "/reviews" },
                  { label: "FAQ", href: "/faq" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Nutrition Guide", href: "/nutrition" },
                  { label: "Recipe Discovery", href: "/ingredients" },
                  { label: "Grocery Store", href: "/ingredients" },
                  { label: "Help Center", href: "/help" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Use", href: "/terms" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Contact</h4>
                <a href="mailto:info@mealmates.com" className="text-sm text-gray-500 hover:text-orange-500 transition-colors block">
                  info@mealmates.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="border-t border-orange-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Meal Mates AI. All rights reserved. Built for Pakistani nutrition culture.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-orange-500 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-orange-500 transition-colors">Terms</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-orange-500 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
