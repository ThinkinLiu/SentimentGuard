// 平台数据配置 - 约100家主流媒体平台

export interface Platform {
  id: string;
  name: string;
  domain: string;
  url: string; // 官网地址
  color: string;
  category: string;
}

export const PLATFORMS: Platform[] = [
  // ===== 社交媒体 =====
  { id: 'weibo', name: '微博', domain: 'weibo.com', url: 'https://weibo.com', color: 'bg-orange-500', category: '社交媒体' },
  { id: 'zhihu', name: '知乎', domain: 'zhihu.com', url: 'https://www.zhihu.com', color: 'bg-blue-600', category: '社交媒体' },
  { id: 'xiaohongshu', name: '小红书', domain: 'xiaohongshu.com', url: 'https://www.xiaohongshu.com', color: 'bg-red-500', category: '社交媒体' },
  { id: 'wechat', name: '微信公众号', domain: 'mp.weixin.qq.com', url: 'https://mp.weixin.qq.com', color: 'bg-green-600', category: '社交媒体' },
  { id: 'tieba', name: '百度贴吧', domain: 'tieba.baidu.com', url: 'https://tieba.baidu.com', color: 'bg-blue-500', category: '社交媒体' },
  { id: 'douban', name: '豆瓣', domain: 'douban.com', url: 'https://www.douban.com', color: 'bg-green-500', category: '社交媒体' },
  { id: 'tianya', name: '天涯社区', domain: 'tianya.cn', url: 'https://bbs.tianya.cn', color: 'bg-amber-600', category: '社交媒体' },
  { id: 'mafengwo', name: '马蜂窝', domain: 'mafengwo.cn', url: 'https://www.mafengwo.cn', color: 'bg-orange-400', category: '社交媒体' },
  { id: 'dianping', name: '大众点评', domain: 'dianping.com', url: 'https://www.dianping.com', color: 'bg-red-500', category: '社交媒体' },
  { id: 'meituan', name: '美团', domain: 'meituan.com', url: 'https://www.meituan.com', color: 'bg-yellow-500', category: '社交媒体' },
  
  // ===== 新闻资讯 =====
  { id: 'toutiao', name: '今日头条', domain: 'toutiao.com', url: 'https://www.toutiao.com', color: 'bg-red-600', category: '新闻资讯' },
  { id: 'baidu', name: '百度资讯', domain: 'baidu.com', url: 'https://www.baidu.com', color: 'bg-blue-500', category: '新闻资讯' },
  { id: 'sina', name: '新浪新闻', domain: 'sina.com.cn', url: 'https://news.sina.com.cn', color: 'bg-red-700', category: '新闻资讯' },
  { id: 'sohu', name: '搜狐新闻', domain: 'sohu.com', url: 'https://news.sohu.com', color: 'bg-orange-600', category: '新闻资讯' },
  { id: 'netease', name: '网易新闻', domain: '163.com', url: 'https://news.163.com', color: 'bg-red-600', category: '新闻资讯' },
  { id: 'qqnews', name: '腾讯新闻', domain: 'news.qq.com', url: 'https://news.qq.com', color: 'bg-blue-600', category: '新闻资讯' },
  { id: 'ifeng', name: '凤凰网', domain: 'ifeng.com', url: 'https://www.ifeng.com', color: 'bg-red-500', category: '新闻资讯' },
  { id: 'yidian', name: '一点资讯', domain: 'yidianzixun.com', url: 'https://www.yidianzixun.com', color: 'bg-blue-400', category: '新闻资讯' },
  { id: 'uc', name: 'UC头条', domain: 'uc.cn', url: 'https://www.uc.cn', color: 'bg-orange-500', category: '新闻资讯' },
  { id: 'zaker', name: 'ZAKER', domain: 'myzaker.com', url: 'https://www.myzaker.com', color: 'bg-blue-700', category: '新闻资讯' },
  { id: 'caixin', name: '财新网', domain: 'caixin.com', url: 'https://www.caixin.com', color: 'bg-yellow-600', category: '新闻资讯' },
  { id: 'jiemian', name: '界面新闻', domain: 'jiemian.com', url: 'https://www.jiemian.com', color: 'bg-slate-600', category: '新闻资讯' },
  { id: 'thepaper', name: '澎湃新闻', domain: 'thepaper.cn', url: 'https://www.thepaper.cn', color: 'bg-red-500', category: '新闻资讯' },
  { id: 'bjnews', name: '新京报', domain: 'bjnews.com.cn', url: 'https://www.bjnews.com.cn', color: 'bg-red-600', category: '新闻资讯' },
  { id: 'yicai', name: '第一财经', domain: 'yicai.com', url: 'https://www.yicai.com', color: 'bg-blue-500', category: '新闻资讯' },
  { id: 'cankao', name: '参考消息', domain: 'cankaoxiaoxi.com', url: 'https://www.cankaoxiaoxi.com', color: 'bg-red-700', category: '新闻资讯' },
  { id: 'huanqiu', name: '环球网', domain: 'huanqiu.com', url: 'https://www.huanqiu.com', color: 'bg-red-500', category: '新闻资讯' },
  { id: 'china', name: '中国网', domain: 'china.com.cn', url: 'https://www.china.com.cn', color: 'bg-red-600', category: '新闻资讯' },
  { id: 'gmw', name: '光明网', domain: 'gmw.cn', url: 'https://www.gmw.cn', color: 'bg-yellow-600', category: '新闻资讯' },
  
  // ===== 官方媒体 =====
  { id: 'people', name: '人民网', domain: 'people.com.cn', url: 'http://www.people.com.cn', color: 'bg-red-700', category: '官方媒体' },
  { id: 'xinhua', name: '新华网', domain: 'xinhuanet.com', url: 'http://www.xinhuanet.com', color: 'bg-red-600', category: '官方媒体' },
  { id: 'chinanews', name: '中国新闻网', domain: 'chinanews.com.cn', url: 'https://www.chinanews.com.cn', color: 'bg-blue-700', category: '官方媒体' },
  { id: 'cctv', name: '央视网', domain: 'cctv.com', url: 'https://www.cctv.com', color: 'bg-red-600', category: '官方媒体' },
  { id: 'cntv', name: '中国网络电视台', domain: 'cntv.cn', url: 'https://www.cntv.cn', color: 'bg-blue-600', category: '官方媒体' },
  { id: 'gov', name: '中国政府网', domain: 'gov.cn', url: 'https://www.gov.cn', color: 'bg-red-700', category: '官方媒体' },
  { id: '12315', name: '12315投诉平台', domain: '12315.cn', url: 'https://www.12315.cn', color: 'bg-blue-500', category: '官方媒体' },
  
  // ===== 视频平台 =====
  { id: 'douyin', name: '抖音', domain: 'douyin.com', url: 'https://www.douyin.com', color: 'bg-black', category: '视频平台' },
  { id: 'bilibili', name: 'B站', domain: 'bilibili.com', url: 'https://www.bilibili.com', color: 'bg-pink-500', category: '视频平台' },
  { id: 'kuaishou', name: '快手', domain: 'kuaishou.com', url: 'https://www.kuaishou.com', color: 'bg-orange-500', category: '视频平台' },
  { id: 'youku', name: '优酷', domain: 'youku.com', url: 'https://www.youku.com', color: 'bg-blue-500', category: '视频平台' },
  { id: 'iqiyi', name: '爱奇艺', domain: 'iqiyi.com', url: 'https://www.iqiyi.com', color: 'bg-green-500', category: '视频平台' },
  { id: 'tencentvideo', name: '腾讯视频', domain: 'v.qq.com', url: 'https://v.qq.com', color: 'bg-orange-600', category: '视频平台' },
  { id: 'mgtv', name: '芒果TV', domain: 'mgtv.com', url: 'https://www.mgtv.com', color: 'bg-orange-500', category: '视频平台' },
  { id: 'xigua', name: '西瓜视频', domain: 'ixigua.com', url: 'https://www.ixigua.com', color: 'bg-red-500', category: '视频平台' },
  { id: 'haokan', name: '好看视频', domain: 'haokan.baidu.com', url: 'https://haokan.baidu.com', color: 'bg-blue-500', category: '视频平台' },
  
  // ===== 科技财经 =====
  { id: '36kr', name: '36氪', domain: '36kr.com', url: 'https://36kr.com', color: 'bg-cyan-500', category: '科技财经' },
  { id: 'huxiu', name: '虎嗅', domain: 'huxiu.com', url: 'https://www.huxiu.com', color: 'bg-amber-500', category: '科技财经' },
  { id: 'tmtpost', name: '钛媒体', domain: 'tmtpost.com', url: 'https://www.tmtpost.com', color: 'bg-blue-800', category: '科技财经' },
  { id: 'leiphone', name: '雷锋网', domain: 'leiphone.com', url: 'https://www.leiphone.com', color: 'bg-red-500', category: '科技财经' },
  { id: 'donews', name: 'Donews', domain: 'donews.com', url: 'https://www.donews.com', color: 'bg-blue-500', category: '科技财经' },
  { id: 'techweb', name: 'TechWeb', domain: 'techweb.com.cn', url: 'https://www.techweb.com.cn', color: 'bg-blue-600', category: '科技财经' },
  { id: 'pingwest', name: 'PingWest', domain: 'pingwest.com', url: 'https://www.pingwest.com', color: 'bg-purple-500', category: '科技财经' },
  { id: 'ifanr', name: '爱范儿', domain: 'ifanr.com', url: 'https://www.ifanr.com', color: 'bg-red-500', category: '科技财经' },
  { id: 'sootuu', name: '速途网', domain: 'sootuu.com', url: 'https://www.sootuu.com', color: 'bg-blue-500', category: '科技财经' },
  { id: 'eastmoney', name: '东方财富', domain: 'eastmoney.com', url: 'https://www.eastmoney.com', color: 'bg-red-600', category: '科技财经' },
  { id: 'xueqiu', name: '雪球', domain: 'xueqiu.com', url: 'https://xueqiu.com', color: 'bg-blue-500', category: '科技财经' },
  { id: 'tonghuashun', name: '同花顺', domain: '10jqka.com.cn', url: 'https://www.10jqka.com.cn', color: 'bg-orange-500', category: '科技财经' },
  { id: 'jrj', name: '金融界', domain: 'jrj.com.cn', url: 'https://www.jrj.com.cn', color: 'bg-red-600', category: '科技财经' },
  { id: 'hexun', name: '和讯网', domain: 'hexun.com', url: 'https://www.hexun.com', color: 'bg-blue-600', category: '科技财经' },
  
  // ===== 电商平台 =====
  { id: 'taobao', name: '淘宝', domain: 'taobao.com', url: 'https://www.taobao.com', color: 'bg-orange-500', category: '电商平台' },
  { id: 'jd', name: '京东', domain: 'jd.com', url: 'https://www.jd.com', color: 'bg-red-600', category: '电商平台' },
  { id: 'pdd', name: '拼多多', domain: 'pinduoduo.com', url: 'https://www.pinduoduo.com', color: 'bg-red-500', category: '电商平台' },
  { id: 'tmall', name: '天猫', domain: 'tmall.com', url: 'https://www.tmall.com', color: 'bg-red-600', category: '电商平台' },
  { id: 'suning', name: '苏宁易购', domain: 'suning.com', url: 'https://www.suning.com', color: 'bg-yellow-500', category: '电商平台' },
  { id: 'gome', name: '国美', domain: 'gome.com.cn', url: 'https://www.gome.com.cn', color: 'bg-red-500', category: '电商平台' },
  { id: 'dangdang', name: '当当网', domain: 'dangdang.com', url: 'https://www.dangdang.com', color: 'bg-red-600', category: '电商平台' },
  { id: 'vip', name: '唯品会', domain: 'vip.com', url: 'https://www.vip.com', color: 'bg-pink-500', category: '电商平台' },
  
  // ===== 汽车出行 =====
  { id: 'autohome', name: '汽车之家', domain: 'autohome.com.cn', url: 'https://www.autohome.com.cn', color: 'bg-red-500', category: '汽车出行' },
  { id: 'dongchedi', name: '懂车帝', domain: 'dongchedi.com', url: 'https://www.dongchedi.com', color: 'bg-blue-500', category: '汽车出行' },
  { id: 'pcauto', name: '太平洋汽车', domain: 'pcauto.com.cn', url: 'https://www.pcauto.com.cn', color: 'bg-blue-600', category: '汽车出行' },
  { id: 'xcar', name: '爱卡汽车', domain: 'xcar.com.cn', url: 'https://www.xcar.com.cn', color: 'bg-red-600', category: '汽车出行' },
  { id: 'yiche', name: '易车网', domain: 'yiche.com', url: 'https://www.yiche.com', color: 'bg-blue-500', category: '汽车出行' },
  { id: 'gaode', name: '高德地图', domain: 'amap.com', url: 'https://www.amap.com', color: 'bg-blue-500', category: '汽车出行' },
  { id: 'didi', name: '滴滴出行', domain: 'didichuxing.com', url: 'https://www.didiglobal.com', color: 'bg-orange-500', category: '汽车出行' },
  
  // ===== 房产家居 =====
  { id: 'lianjia', name: '链家', domain: 'lianjia.com', url: 'https://www.lianjia.com', color: 'bg-green-500', category: '房产家居' },
  { id: 'ke', name: '贝壳找房', domain: 'ke.com', url: 'https://www.ke.com', color: 'bg-blue-500', category: '房产家居' },
  { id: 'anjuke', name: '安居客', domain: 'anjuke.com', url: 'https://www.anjuke.com', color: 'bg-red-500', category: '房产家居' },
  { id: 'fang', name: '房天下', domain: 'fang.com', url: 'https://www.fang.com', color: 'bg-red-600', category: '房产家居' },
  { id: 'leju', name: '乐居', domain: 'leju.com', url: 'https://www.leju.com', color: 'bg-orange-500', category: '房产家居' },
  
  // ===== 招聘求职 =====
  { id: 'boss', name: 'BOSS直聘', domain: 'zhipin.com', url: 'https://www.zhipin.com', color: 'bg-green-500', category: '招聘求职' },
  { id: 'zhaopin', name: '智联招聘', domain: 'zhaopin.com', url: 'https://www.zhaopin.com', color: 'bg-blue-500', category: '招聘求职' },
  { id: '51job', name: '前程无忧', domain: '51job.com', url: 'https://www.51job.com', color: 'bg-orange-500', category: '招聘求职' },
  { id: 'liepin', name: '猎聘', domain: 'liepin.com', url: 'https://www.liepin.com', color: 'bg-orange-600', category: '招聘求职' },
  { id: 'lagou', name: '拉勾网', domain: 'lagou.com', url: 'https://www.lagou.com', color: 'bg-green-500', category: '招聘求职' },
  
  // ===== 教育培训 =====
  { id: 'zhihuishu', name: '智慧树', domain: 'zhihuishu.com', url: 'https://www.zhihuishu.com', color: 'bg-green-500', category: '教育培训' },
  { id: 'xuetangx', name: '学堂在线', domain: 'xuetangx.com', url: 'https://www.xuetangx.com', color: 'bg-blue-500', category: '教育培训' },
  { id: 'icourse163', name: '中国大学MOOC', domain: 'icourse163.org', url: 'https://www.icourse163.org', color: 'bg-red-500', category: '教育培训' },
  { id: 'youdao', name: '有道精品课', domain: 'youdao.com', url: 'https://www.youdao.com', color: 'bg-red-600', category: '教育培训' },
  { id: 'xueersi', name: '学而思', domain: 'xueersi.com', url: 'https://www.xueersi.com', color: 'bg-orange-500', category: '教育培训' },
  
  // ===== 医疗健康 =====
  { id: 'haodf', name: '好大夫在线', domain: 'haodf.com', url: 'https://www.haodf.com', color: 'bg-blue-500', category: '医疗健康' },
  { id: 'guahao', name: '挂号网', domain: 'guahao.com', url: 'https://www.guahao.com', color: 'bg-green-500', category: '医疗健康' },
  { id: 'dingxiang', name: '丁香园', domain: 'dxy.com', url: 'https://www.dxy.com', color: 'bg-green-600', category: '医疗健康' },
  { id: 'chunyu', name: '春雨医生', domain: 'chunyuyisheng.com', url: 'https://www.chunyuyisheng.com', color: 'bg-green-500', category: '医疗健康' },
  
  // ===== 旅游出行 =====
  { id: 'ctrip', name: '携程', domain: 'ctrip.com', url: 'https://www.ctrip.com', color: 'bg-blue-500', category: '旅游出行' },
  { id: 'qunar', name: '去哪儿', domain: 'qunar.com', url: 'https://www.qunar.com', color: 'bg-blue-600', category: '旅游出行' },
  { id: 'tuniu', name: '途牛', domain: 'tuniu.com', url: 'https://www.tuniu.com', color: 'bg-orange-500', category: '旅游出行' },
  { id: 'ly', name: '同程旅行', domain: 'ly.com', url: 'https://www.ly.com', color: 'bg-blue-500', category: '旅游出行' },
  { id: 'fliggy', name: '飞猪', domain: 'fliggy.com', url: 'https://www.fliggy.com', color: 'bg-orange-500', category: '旅游出行' },
  
  // ===== 企业评价 =====
  { id: 'tianyancha', name: '天眼查', domain: 'tianyancha.com', url: 'https://www.tianyancha.com', color: 'bg-blue-500', category: '企业评价' },
  { id: 'qcc', name: '企查查', domain: 'qcc.com', url: 'https://www.qcc.com', color: 'bg-blue-600', category: '企业评价' },
  { id: 'kanzhun', name: '看准网', domain: 'kanzhun.com', url: 'https://www.kanzhun.com', color: 'bg-green-500', category: '企业评价' },
  { id: 'qixin', name: '启信宝', domain: 'qixin.com', url: 'https://www.qixin.com', color: 'bg-blue-500', category: '企业评价' },
  { id: 'zhazhipin', name: '职友集', domain: 'jobui.com', url: 'https://www.jobui.com', color: 'bg-blue-500', category: '企业评价' },
  
  // ===== 投诉维权 =====
  { id: 'ts21', name: '21CN聚投诉', domain: 'ts.21cn.com', url: 'https://ts.21cn.com', color: 'bg-red-500', category: '投诉维权' },
  { id: '12315online', name: '全国12315平台', domain: 'www.12315.cn', url: 'https://www.12315.cn', color: 'bg-red-600', category: '投诉维权' },
  { id: 'tousu', name: '黑猫投诉', domain: 'tousu.sina.com.cn', url: 'https://tousu.sina.com.cn', color: 'bg-black', category: '投诉维权' },
];

// 分类图标映射
export const CATEGORY_ICONS: Record<string, string> = {
  '社交媒体': '💬',
  '新闻资讯': '📰',
  '官方媒体': '🏛️',
  '视频平台': '🎬',
  '科技财经': '📈',
  '电商平台': '🛒',
  '汽车出行': '🚗',
  '房产家居': '🏠',
  '招聘求职': '👤',
  '教育培训': '📚',
  '医疗健康': '🏥',
  '旅游出行': '✈️',
  '企业评价': '🏢',
  '投诉维权': '⚠️',
};

// 分类颜色映射
export const CATEGORY_COLORS: Record<string, string> = {
  '社交媒体': 'from-orange-500 to-red-500',
  '新闻资讯': 'from-blue-500 to-cyan-500',
  '官方媒体': 'from-red-600 to-red-700',
  '视频平台': 'from-pink-500 to-purple-500',
  '科技财经': 'from-cyan-500 to-blue-500',
  '电商平台': 'from-orange-500 to-yellow-500',
  '汽车出行': 'from-blue-500 to-indigo-500',
  '房产家居': 'from-green-500 to-teal-500',
  '招聘求职': 'from-green-500 to-emerald-500',
  '教育培训': 'from-purple-500 to-indigo-500',
  '医疗健康': 'from-green-500 to-cyan-500',
  '旅游出行': 'from-blue-400 to-cyan-400',
  '企业评价': 'from-blue-500 to-slate-500',
  '投诉维权': 'from-red-500 to-orange-500',
};

// 默认选择的平台
export const DEFAULT_PLATFORMS = ['weibo', 'toutiao', 'baidu'];
