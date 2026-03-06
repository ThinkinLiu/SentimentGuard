'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PLATFORMS, CATEGORY_ICONS, CATEGORY_COLORS, type Platform } from '@/lib/platforms';
import { useState, useMemo } from 'react';

export default function PlatformsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // 按分类分组
  const groupedPlatforms = useMemo(() => {
    const groups: Record<string, Platform[]> = {};
    
    PLATFORMS.forEach(platform => {
      if (!groups[platform.category]) {
        groups[platform.category] = [];
      }
      groups[platform.category].push(platform);
    });

    return groups;
  }, []);

  // 过滤后的平台
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedPlatforms;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Platform[]> = {};

    Object.entries(groupedPlatforms).forEach(([category, platforms]) => {
      const matchedPlatforms = platforms.filter(
        p => p.name.toLowerCase().includes(query) || 
             p.category.toLowerCase().includes(query)
      );
      if (matchedPlatforms.length > 0) {
        filtered[category] = matchedPlatforms;
      }
    });

    return filtered;
  }, [groupedPlatforms, searchQuery]);

  // 分类排序
  const sortedCategories = Object.keys(filteredGroups).sort((a, b) => 
    filteredGroups[b].length - filteredGroups[a].length
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </Link>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">主流媒体平台</h1>
            <div className="w-20" /> {/* 占位符，保持标题居中 */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 统计信息 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-sm">
            <span className="font-bold text-lg">{PLATFORMS.length}</span>
            <span>家主流媒体平台</span>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="搜索平台名称或分类..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* 平台列表 */}
        <div className="space-y-8">
          {sortedCategories.map(category => (
            <Card key={category} className="overflow-hidden">
              <CardHeader className={`bg-gradient-to-r ${CATEGORY_COLORS[category]} text-white`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{CATEGORY_ICONS[category]}</span>
                    <span>{category}</span>
                  </CardTitle>
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    {filteredGroups[category].length} 个平台
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredGroups[category].map(platform => (
                    <a
                      key={platform.id}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                    >
                      <div className={`w-3 h-3 rounded-full ${platform.color} flex-shrink-0`} />
                      <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {platform.name}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 无结果提示 */}
        {sortedCategories.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">未找到匹配的平台</h3>
            <p className="text-slate-500 dark:text-slate-500 mt-2">请尝试其他搜索关键词</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              清除搜索
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-slate-900/80 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            点击平台名称可直接跳转至官网
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            企业舆情分析系统 - 覆盖 {PLATFORMS.length} 家主流媒体平台
          </p>
        </div>
      </footer>
    </div>
  );
}
