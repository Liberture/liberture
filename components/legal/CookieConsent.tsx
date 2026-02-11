"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after a brief delay
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load existing preferences (handle legacy string values)
      try {
        const preferences: CookiePreferences = JSON.parse(consent);
        if (preferences.analytics) {
          enableGoogleAnalytics();
        }
      } catch {
        // Legacy value (e.g., "all") - migrate to new format
        const enableAnalytics = consent === 'all';
        const newPreferences: CookiePreferences = { necessary: true, analytics: enableAnalytics };
        localStorage.setItem('cookie-consent', JSON.stringify(newPreferences));
        if (enableAnalytics) {
          enableGoogleAnalytics();
        }
      }
    }
  }, []);

  const savePreferences = (preferences: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    
    if (preferences.analytics) {
      enableGoogleAnalytics();
    }
    
    setShowBanner(false);
  };

  const acceptAll = () => {
    savePreferences({ necessary: true, analytics: true });
  };

  const acceptNecessary = () => {
    savePreferences({ necessary: true, analytics: false });
  };

  const enableGoogleAnalytics = () => {
    // Initialize Google Analytics
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });
    `;
    document.head.appendChild(script2);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl">
              {!showDetails ? (
                // Simple view
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">
                      🍪 We Value Your Privacy
                    </h3>
                    <p className="text-slate-300 text-sm">
                      We use cookies to enhance your experience. Essential cookies are required for the site to function. 
                      Analytics cookies help us improve our platform (disabled by default).{" "}
                      <button
                        onClick={() => setShowDetails(true)}
                        className="text-purple-400 hover:text-purple-300 underline"
                      >
                        Customize
                      </button>
                    </p>
                    <div className="mt-2 text-xs text-slate-400">
                      Read our{" "}
                      <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline">
                        Terms
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                      onClick={acceptNecessary}
                      className="px-6 py-2.5 rounded-lg border border-slate-600 hover:border-slate-500 text-white transition-colors"
                    >
                      Only Necessary
                    </button>
                    <button
                      onClick={acceptAll}
                      className="px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    >
                      Accept All
                    </button>
                  </div>
                </div>
              ) : (
                // Detailed view
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Cookie Preferences</h3>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Necessary Cookies */}
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">
                            Necessary Cookies
                            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                              Always Active
                            </span>
                          </h4>
                          <p className="text-sm text-slate-300">
                            Essential for the website to function properly. These cookies enable basic features like:
                          </p>
                          <ul className="mt-2 text-xs text-slate-400 list-disc list-inside space-y-1">
                            <li>User authentication and security</li>
                            <li>Session management</li>
                            <li>Form submissions and data persistence</li>
                            <li>Security features and fraud prevention</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">
                            Analytics Cookies (Google Analytics)
                            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                              Optional
                            </span>
                          </h4>
                          <p className="text-sm text-slate-300 mb-2">
                            Help us understand how visitors interact with our platform. This data is:
                          </p>
                          <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                            <li>Anonymized (IP addresses masked)</li>
                            <li>Used only to improve user experience</li>
                            <li>Never shared with third parties for marketing</li>
                            <li>Disabled by default - requires your consent</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={acceptNecessary}
                      className="flex-1 px-6 py-2.5 rounded-lg border border-slate-600 hover:border-slate-500 text-white transition-colors"
                    >
                      Only Necessary
                    </button>
                    <button
                      onClick={acceptAll}
                      className="flex-1 px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    >
                      Accept All Cookies
                    </button>
                  </div>

                  <p className="mt-4 text-xs text-slate-400 text-center">
                    You can change your preferences anytime in{" "}
                    <Link href="/dashboard/settings" className="text-purple-400 hover:text-purple-300 underline">
                      Settings
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
