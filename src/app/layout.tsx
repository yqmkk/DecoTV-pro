import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import React from 'react';

import './globals.css';

import { getConfig } from '@/lib/config';

import { GlobalErrorIndicator } from '../components/GlobalErrorIndicator';
import NavbarGate from '../components/NavbarGate';
import ParticleBackground from '../components/ParticleBackground';
import { SiteProvider } from '../components/SiteProvider';
import { ThemeProvider } from '../components/ThemeProvider';
import TopNavbar from '../components/TopNavbar';

const inter = Inter({ subsets: ['latin'] });
export const dynamic = 'force-dynamic';

// 动态生成 metadata
export async function generateMetadata(): Promise<Metadata> {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
  const config = await getConfig();
  let siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'DecoTV';
  if (storageType !== 'localstorage') {
    siteName = config.SiteConfig.SiteName;
  }

  return {
    title: siteName,
    description: '影视聚合',
    manifest: '/manifest.json',
  };
}

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';

  let siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'DecoTV';
  let announcement =
    process.env.ANNOUNCEMENT ||
    '本网站仅提供影视信息搜索服务，所有内容均来自第三方网站。本站不存储任何视频资源。';

  let doubanProxyType = process.env.NEXT_PUBLIC_DOUBAN_PROXY_TYPE || 'cmliussss-cdn-tencent';
  let doubanProxy = process.env.NEXT_PUBLIC_DOUBAN_PROXY || '';
  let doubanImageProxyType = process.env.NEXT_PUBLIC_DOUBAN_IMAGE_PROXY_TYPE || 'cmliussss-cdn-tencent';
  let doubanImageProxy = process.env.NEXT_PUBLIC_DOUBAN_IMAGE_PROXY || '';
  let disableYellowFilter = process.env.NEXT_PUBLIC_DISABLE_YELLOW_FILTER === 'true';
  let fluidSearch = process.env.NEXT_PUBLIC_FLUID_SEARCH !== 'false';
  let customCategories = [] as { name: string; type: 'movie' | 'tv'; query: string; }[];

  if (storageType !== 'localstorage') {
    const config = await getConfig();
    siteName = config.SiteConfig.SiteName;
    announcement = config.SiteConfig.Announcement;
    doubanProxyType = config.SiteConfig.DoubanProxyType;
    doubanProxy = config.SiteConfig.DoubanProxy;
    doubanImageProxyType = config.SiteConfig.DoubanImageProxyType;
    doubanImageProxy = config.SiteConfig.DoubanImageProxy;
    disableYellowFilter = config.SiteConfig.DisableYellowFilter;
    customCategories = config.CustomCategories.filter((category) => !category.disabled)
      .map((category) => ({
        name: category.name || '',
        type: category.type,
        query: category.query,
      }));
    fluidSearch = config.SiteConfig.FluidSearch;
  }

  const runtimeConfig = {
    STORAGE_TYPE: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage',
    DOUBAN_PROXY_TYPE: doubanProxyType,
    DOUBAN_PROXY: doubanProxy,
    DOUBAN_IMAGE_PROXY_TYPE: doubanImageProxyType,
    DOUBAN_IMAGE_PROXY: doubanImageProxy,
    DISABLE_YELLOW_FILTER: disableYellowFilter,
    CUSTOM_CATEGORIES: customCategories,
    FLUID_SEARCH: fluidSearch,
  };

  return (
    <html lang='zh-CN' suppressHydrationWarning>
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0, viewport-fit=cover' />
        <link rel='apple-touch-icon' href='/icons/icon-192x192.png' />
        
        {/* --- 注入加速劫持脚本：解决播放缓存慢的核心 --- */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const optimizeHls = () => {
                  if (window.Hls && window.Hls.DefaultConfig) {
                    // 开启激进缓存：撑大缓冲区到 200MB，预读时间延长到 2 分钟
                    window.Hls.DefaultConfig.maxBufferSize = 200 * 1024 * 1024;
                    window.Hls.DefaultConfig.maxBufferLength = 120;
                    window.Hls.DefaultConfig.maxMaxBufferLength = 300;
                    window.Hls.DefaultConfig.enableWorker = true; // 开启多线程解析
                    window.Hls.DefaultConfig.fragLoadPolicy = {
                      default: { maxRetry: 10, timeout: 10000, retryDelay: 500 }
                    };
                    console.log('🚀 [DecoTV 加速器]: 播放内核已优化，当前缓存限制：200MB');
                    return true;
                  }
                  return false;
                };
                // 每 500 毫秒检测一次播放器是否加载，持续 10 秒
                const timer = setInterval(() => { if (optimizeHls()) clearInterval(timer); }, 500);
                setTimeout(() => clearInterval(timer), 10000);
              })();
            `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `window.RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig)};`,
          }}
        />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-white text-gray-900 dark:bg-black dark:text-gray-200 bg-animated-gradient`}
      >
        <NextTopLoader
          color='#ec4899'
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing='ease'
          speed={200}
          shadow='0 0 10px #ec4899,0 0 5px #ec4899'
        />
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <SiteProvider siteName={siteName} announcement={announcement}>
            <ParticleBackground />
            <NavbarGate>
              <TopNavbar />
            </NavbarGate>
            {children}
            <GlobalErrorIndicator />
          </SiteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
