/**
 * dynamicLyricsEngine.js
 *
 * Fully procedural / dynamic Chinese lyrics generation engine.
 *
 * This file contains NO pre-written complete lyric lines. Every lyric line is
 * generated dynamically by filling grammatical slot-templates with words drawn
 * from per-theme vocabulary banks, influenced by per-style modifiers, and
 * constrained by a Chinese rhyme engine.
 *
 * Combination space: 30 themes x 30 styles x 50+ templates x 100+ words per
 * category = millions of unique lines.
 *
 * Exports: generateDynamicLyrics, getThemeBank, blendBanks, findRhymeWord
 */

import {
  generateMeloCommand,
  generateSunoCommand,
  generateMuseCommand,
  findMatchingExample,
  GENRE_PATTERNS,
  THEME_KEYWORDS,
  LYRIC_EXAMPLES
} from './referenceData.js';

/* =========================================================================
 * 1. THEME VOCABULARY BANKS
 * Each bank holds individual words / short phrases (NOT complete lines).
 * ========================================================================= */

const THEME_BANKS = {
  love: {
    imagery: ['月光', '繁星', '红烛', '玫瑰', '春风', '细雨', '晚霞', '银河', '蝶翼', '清辉'],
    emotions: ['心动', '思念', '眷恋', '温柔', '痴情', '甜蜜', '牵挂', '深情', '缠绵', '怦然'],
    actions: ['相拥', '守候', '凝望', '牵手', '许诺', '追寻', '陪伴', '轻抚', '靠近', '等待'],
    subjects: ['恋人', '心跳', '誓言', '缘分', '红豆', '情书', '鸳鸯', '身影', '眉眼', '笑靥'],
    objects: ['承诺', '诺言', '余生', '芳华', '真心', '柔情', '旧梦', '红绳', '信笺', '戒指'],
    locations: ['月下', '花前', '长街', '窗前', '海边', '雨中', '桥头', '梦里'],
    timeWords: ['今夜', '此生', '余生', '黎明', '黄昏', '四季', '永夜', '岁岁'],
    descriptors: ['深情', '温柔', '执着', '炽热', '纯粹', '甜蜜', '朦胧', '永恒', '缱绻', '嫣然']
  },
  loneliness: {
    imagery: ['寒星', '孤灯', '残月', '落叶', '冷雨', '空巷', '瘦影', '寒风', '枯枝', '暮色'],
    emotions: ['孤寂', '落寞', '凄凉', '空虚', '怅惘', '寂寥', '悲凉', '冷清', '萧索', '黯然'],
    actions: ['独坐', '徘徊', '凝望', '叹息', '独酌', '流浪', '蜷缩', '漫步', '守望', '漂泊'],
    subjects: ['孤影', '夜风', '寒窗', '空房', '残灯', '路人', '游子', '行客', '冷月', '空杯'],
    objects: ['回忆', '往事', '旧梦', '残酒', '空椅', '冷茶', '孤灯', '寂夜', '空巷', '离愁'],
    locations: ['空巷', '寒窗', '长街', '荒野', '高楼', '深巷', '桥头', '天涯'],
    timeWords: ['深夜', '黄昏', '黎明', '寒冬', '长夜', '午夜', '黄昏后', '岁末'],
    descriptors: ['孤单', '凄冷', '寂寥', '空荡', '清冷', '萧瑟', '落寞', '幽暗', '苍凉', '形单']
  },
  sadness: {
    imagery: ['泪痕', '落花', '残红', '秋雨', '枯叶', '断弦', '寒烟', '孤坟', '冷霜', '残阳'],
    emotions: ['悲伤', '心碎', '哀痛', '惆怅', '凄苦', '绝望', '心酸', '痛楚', '哀伤', '苦涩'],
    actions: ['流泪', '哭泣', '叹息', '回望', '追忆', '哽咽', '沉沦', '凋零', '破碎', '沉溺'],
    subjects: ['泪眼', '断肠人', '伤心客', '残梦', '离人', '孤魂', '愁绪', '悲歌', '残烛', '旧伤'],
    objects: ['泪滴', '回忆', '遗物', '旧信', '断弦', '残梦', '离愁', '伤痛', '遗憾', '苦酒'],
    locations: ['坟前', '雨中', '空房', '断桥', '荒原', '深巷', '病榻', '离别处'],
    timeWords: ['深夜', '黄昏', '雨天', '寒冬', '葬礼', '永夜', '岁末', '残秋'],
    descriptors: ['悲伤', '凄惨', '痛彻', '破碎', '哀怨', '凄美', '苦涩', '黯淡', '心碎', '惨淡']
  },
  dreams: {
    imagery: ['星光', '流星', '曙光', '翅膀', '远帆', '灯塔', '朝阳', '彩虹', '银河', '羽翼'],
    emotions: ['渴望', '憧憬', '热血', '坚定', '执着', '昂扬', '期盼', '澎湃', '振奋', '勇敢'],
    actions: ['追逐', '飞翔', '攀登', '跨越', '奔赴', '追寻', '启航', '拼搏', '奋进', '闯荡'],
    subjects: ['少年', '追梦人', '行者', '勇士', '远航者', '旅人', '星辰', '灯塔', '风帆', '朝阳'],
    objects: ['梦想', '远方', '彼岸', '巅峰', '星辰', '未来', '荣光', '勋章', '彩虹', '曙光'],
    locations: ['远方', '巅峰', '天际', '彼岸', '征途', '星空下', '海边', '荒原'],
    timeWords: ['黎明', '清晨', '未来', '此刻', '青春', '明天', '破晓', '岁岁'],
    descriptors: ['璀璨', '辽阔', '高远', '坚定', '炽热', '勇敢', '无畏', '灿烂', '辉煌', '执着']
  },
  memory: {
    imagery: ['旧照片', '泛黄', '落花', '夕阳', '老歌', '余晖', '残页', '旧巷', '钟声', '暮光'],
    emotions: ['怀念', '怅然', '温馨', '感伤', '留恋', '唏嘘', '追忆', '释然', '眷恋', '感慨'],
    actions: ['回望', '翻阅', '追忆', '回味', '重温', '拾起', '缅怀', '凝视', '回首', '珍藏'],
    subjects: ['往事', '旧时光', '回忆', '青春', '故人', '童年', '老屋', '旧梦', '日记', '年轮'],
    objects: ['照片', '旧信', '日记', '往事', '旧物', '回忆', '时光', '片段', '足迹', '笑颜'],
    locations: ['旧巷', '老屋', '校园', '故乡', '桥头', '窗前', '相册里', '梦里'],
    timeWords: ['从前', '当年', '昨日', '往昔', '曾经', '那年', '旧时', '流年'],
    descriptors: ['遥远', '泛黄', '珍贵', '模糊', '温暖', '唏嘘', '难忘', '斑驳', '苍老', '熟悉']
  },
  nature: {
    imagery: ['清风', '流水', '白云', '青山', '落霞', '飞鸟', '晨露', '野花', '竹林', '溪流'],
    emotions: ['宁静', '悠然', '舒畅', '惬意', '平和', '释然', '怡然', '安详', '澄澈', '豁达'],
    actions: ['漫步', '聆听', '呼吸', '感受', '拥抱', '凝望', '沉醉', '徜徉', '栖息', '漫游'],
    subjects: ['山川', '清风', '溪水', '飞鸟', '草木', '白云', '明月', '大地', '林间', '晨曦'],
    objects: ['自然', '美景', '天地', '万物', '清风', '山水', '花香', '鸟鸣', '晨露', '霞光'],
    locations: ['山林', '溪畔', '原野', '湖边', '山谷', '竹林', '海边', '草原'],
    timeWords: ['清晨', '黄昏', '四季', '春日', '秋夕', '正午', '暮色', '黎明'],
    descriptors: ['葱郁', '清澈', '壮丽', '秀美', '苍翠', '辽阔', '静谧', '空灵', '生机', '怡人']
  },
  friendship: {
    imagery: ['老酒', '篝火', '背影', '并肩', '长路', '吉他', '举杯', '夕阳', '合影', '星空'],
    emotions: ['真挚', '感动', '默契', '感恩', '温暖', '豪迈', '信任', '惺惺相惜', '义气', '牵挂'],
    actions: ['举杯', '并肩', '同行', '倾听', '守护', '陪伴', '畅饮', '扶持', '约定', '相聚'],
    subjects: ['知己', '兄弟', '故友', '同伴', '老友', '伯牙', '子期', '挚友', '伙伴', '同行者'],
    objects: ['友谊', '誓言', '酒杯', '岁月', '往事', '肩膀', '信任', '默契', '吉他', '老酒'],
    locations: ['酒馆', '长路', '山巅', '老树下', '篝火旁', '校园', '远方', '故里'],
    timeWords: ['当年', '此刻', '一生', '重逢', '离别', '青春', '岁月', '长久'],
    descriptors: ['真挚', '深厚', '肝胆', '默契', '可靠', '豪爽', '温暖', '长久', '惺惺', '义薄']
  },
  success: {
    imagery: ['旭日', '勋章', '奖杯', '凯歌', '红旗', '巅峰', '曙光', '礼花', '桂冠', '战旗'],
    emotions: ['自豪', '振奋', '激昂', '满足', '荣耀', '骄傲', '欣慰', '澎湃', '豪迈', '喜悦'],
    actions: ['攀登', '跨越', '征服', '凯旋', '突破', '斩获', '登顶', '拼搏', '奋进', '铸就'],
    subjects: ['英雄', '勇士', '冠军', '开拓者', '追梦人', '战士', '攀登者', '胜利者', '先锋', '栋梁'],
    objects: ['荣誉', '勋章', '巅峰', '桂冠', '辉煌', '成就', '胜利', '丰碑', '王座', '荣光'],
    locations: ['巅峰', '赛场', '舞台', '王座', '前线', '巅峰之上', '殿堂', '征途'],
    timeWords: ['此刻', '今朝', '终有一日', '黎明', '未来', '胜利时', '凯旋日', '长久'],
    descriptors: ['辉煌', '荣耀', '壮阔', '震撼', '不朽', '耀眼', '磅礴', '非凡', '卓越', '璀璨']
  },
  hope: {
    imagery: ['曙光', '灯塔', '星光', '火种', '朝阳', '破晓', '彩虹', '春芽', '晨曦', '明灯'],
    emotions: ['希望', '期盼', '坚定', '乐观', '昂扬', '温暖', '振奋', '勇敢', '信心', '憧憬'],
    actions: ['仰望', '前行', '坚守', '点燃', '追寻', '等待', '绽放', '破茧', '迎接', '拥抱'],
    subjects: ['曙光', '灯塔', '火种', '种子', '信念', '黎明', '希望', '光芒', '春芽', '星辰'],
    objects: ['光明', '未来', '春天', '奇迹', '曙光', '出路', '答案', '黎明', '方向', '新生'],
    locations: ['前方', '黎明', '彼岸', '荒原', '黑夜', '心中', '远方', '路口'],
    timeWords: ['黎明', '明天', '未来', '此刻', '终将', '破晓', '春天', '永远'],
    descriptors: ['光明', '温暖', '坚定', '璀璨', '蓬勃', '勇敢', '无尽', '耀眼', '崭新', '炽热']
  },
  life: {
    imagery: ['长河', '画卷', '舞台', '棋局', '旅途', '酒杯', '时钟', '四季', '驿站', '岔路'],
    emotions: ['感慨', '释然', '豁达', '珍惜', '顿悟', '坦然', '唏嘘', '珍惜', '从容', '深沉'],
    actions: ['前行', '品味', '经历', '感悟', '走过', '承受', '选择', '拥抱', '放下', '珍惜'],
    subjects: ['人生', '岁月', '时光', '命运', '旅人', '过客', '行者', '故事', '年轮', '光阴'],
    objects: ['经历', '回忆', '选择', '风景', '滋味', '智慧', '答案', '故事', '岁月', '人生'],
    locations: ['旅途', '人间', '十字路口', '驿站', '舞台', '长街', '远方', '归途'],
    timeWords: ['一生', '岁月', '此刻', '往昔', '未来', '四季', '每一天', '流年'],
    descriptors: ['漫长', '精彩', '坎坷', '短暂', '丰富', '无常', '从容', '深刻', '辽阔', '平凡']
  },
  lunatic: {
    imagery: ['狂风', '残月', '浊酒', '乱发', '狂笑', '闪电', '废墟', '烈焰', '荒唐', '惊雷'],
    emotions: ['癫狂', '肆意', '桀骜', '放荡', '狂妄', '洒脱', '不羁', '疯魔', '傲然', '狂热'],
    actions: ['狂笑', '醉舞', '咆哮', '癫狂', '撕裂', '焚烧', '践踏', '嘲弄', '颠覆', '放纵'],
    subjects: ['狂人', '醉客', '疯子', '浪子', '狂徒', '痴人', '枭雄', '醉汉', '疯癫者', '狂客'],
    objects: ['世俗', '规则', '牢笼', '枷锁', '常理', '天地', '红尘', '命运', '偏见', '条框'],
    locations: ['废墟', '红尘', '天涯', '酒馆', '荒野', '巅峰', '深渊', '闹市'],
    timeWords: ['此刻', '今朝', '永夜', '醉时', '一生', '瞬间', '当下', '狂夜'],
    descriptors: ['癫狂', '狂放', '桀骜', '不羁', '荒唐', '肆意', '傲慢', '疯魔', '洒脱', '张狂']
  },
  tango: {
    imagery: ['红月', '舞步', '裙摆', '高跟鞋', '探戈', '阴影', '烛光', '酒杯', '足音', '玫瑰'],
    emotions: ['痴迷', '缠绵', '暧昧', '压抑', '狂热', '沉醉', '纠结', '挑逗', '孤傲', '欲念'],
    actions: ['旋转', '踏步', '相拥', '后退', '贴近', '凝视', '起舞', '试探', '纠缠', '独舞'],
    subjects: ['舞者', '孤影', '裙摆', '足音', '红月', '探戈', '情人', '身影', '旋律', '舞伴'],
    objects: ['舞步', '节奏', '黑夜', '玫瑰', '酒杯', '影子', '旋律', '心跳', '裙角', '月光'],
    locations: ['舞池', '长街', '酒馆', '夜色', '舞台', '暗巷', '厅堂', '雨中'],
    timeWords: ['午夜', '深夜', '今夜', '黎明前', '此刻', '永夜', '黄昏', '整夜'],
    descriptors: ['优雅', '暧昧', '迷离', '压抑', '华丽', '孤傲', '缠绵', '戏剧', '冷艳', '痴狂']
  },
  heartbreak: {
    imagery: ['碎镜', '裂痕', '断弦', '残烛', '冷雨', '枯花', '废墟', '灰烬', '断桥', '泪痕'],
    emotions: ['心碎', '绝望', '痛楚', '悔恨', '空虚', '撕裂', '崩溃', '哀恸', '凄凉', '窒息'],
    actions: ['破碎', '撕裂', '坠落', '哭泣', '逃离', '割舍', '沉沦', '枯萎', '崩塌', '放手'],
    subjects: ['碎心', '断肠人', '旧爱', '残梦', '裂痕', '孤魂', '伤者', '泪眼', '废墟', '断弦'],
    objects: ['回忆', '誓言', '旧物', '伤口', '碎片', '遗憾', '眼泪', '幻影', '旧梦', '离愁'],
    locations: ['空房', '废墟', '雨中', '旧地', '病榻', '深巷', '桥头', '回忆里'],
    timeWords: ['深夜', '分手后', '永夜', '此刻', '那年', '雨夜', '寒冬', '岁末'],
    descriptors: ['破碎', '撕裂', '绝望', '凄凉', '痛彻', '灰暗', '残缺', '冰冷', '支离', '惨痛']
  },
  healing: {
    imagery: ['晨光', '暖阳', '微风', '花开', '清泉', '彩虹', '新芽', '羽翼', '曙光', '春雨'],
    emotions: ['温暖', '安宁', '释然', '希望', '平静', '慰藉', '舒畅', '柔和', '感恩', '新生'],
    actions: ['抚平', '治愈', '拥抱', '释怀', '绽放', '重生', '温暖', '滋养', '疗愈', '前行'],
    subjects: ['阳光', '微风', '清泉', '暖意', '新生', '希望', '春天', '微笑', '光芒', '羽翼'],
    objects: ['伤口', '心灵', '伤痛', '过往', '希望', '温暖', '力量', '新生', '答案', '阳光'],
    locations: ['阳光下', '花园', '溪畔', '窗前', '心中', '春天里', '清晨', '远方'],
    timeWords: ['清晨', '春天', '此刻', '明天', '未来', '雨后', '黎明', '长久'],
    descriptors: ['温暖', '柔和', '治愈', '宁静', '明媚', '崭新', '舒缓', '澄澈', '安详', '蓬勃']
  },
  time_travel: {
    imagery: ['铜镜', '古道', '烽火', '时光隧道', '轮回', '前世', '残卷', '古钟', '星河', '幻影'],
    emotions: ['恍惚', '宿命', '痴缠', '怅惘', '震撼', '执念', '迷离', '感慨', '牵挂', '笃定'],
    actions: ['穿越', '轮回', '寻觅', '邂逅', '重逢', '追溯', '梦回', '交错', '等待', '铭记'],
    subjects: ['前世', '旅人', '轮回者', '古人', '幻影', '灵魂', '宿命', '铜镜', '时光', '旧影'],
    objects: ['前世', '缘分', '宿命', '旧梦', '记忆', '时光', '誓言', '因果', '轮回', '旧物'],
    locations: ['古道', '宫廷', '时空', '前世', '梦境', '楼台', '战场', '轮回中'],
    timeWords: ['千年', '前世', '今生', '轮回', '往昔', '此刻', '永恒', '来世'],
    descriptors: ['古老', '宿命', '神秘', '恍惚', '悠远', '痴缠', '震撼', '迷离', '跨越', '永恒']
  },
  epic_journey: {
    imagery: ['战旗', '铠甲', '烽火', '长剑', '战马', '号角', '征程', '烈焰', '铁血', '苍穹'],
    emotions: ['豪迈', '悲壮', '激昂', '坚定', '无畏', '壮烈', '慷慨', '热血', '凛然', '决绝'],
    actions: ['征战', '冲锋', '征服', '跨越', '披荆', '斩棘', '凯旋', '厮杀', '坚守', '开拓'],
    subjects: ['英雄', '战士', '将军', '勇士', '征人', '铁骑', '战旗', '号角', '先锋', '王者'],
    objects: ['荣耀', '征途', '山河', '王座', '使命', '战旗', '丰碑', '疆土', '史诗', '荣光'],
    locations: ['沙场', '征途', '巅峰', '疆场', '前线', '王座', '山河', '边关'],
    timeWords: ['千古', '此战', '永恒', '一生', '终局', '黎明', '决战', '万世'],
    descriptors: ['壮阔', '豪迈', '悲壮', '磅礴', '铁血', '无畏', '英勇', '史诗', '凛然', '不朽']
  },
  dark_mystery: {
    imagery: ['迷雾', '暗影', '鬼火', '古堡', '黑鸦', '残月', '蛛网', '深渊', '诅咒', '暗门'],
    emotions: ['恐惧', '悬疑', '战栗', '压抑', '诡谲', '好奇', '不安', '惊悚', '绝望', '迷惘'],
    actions: ['潜行', '窥探', '追寻', '解开', '探索', '逃避', '隐藏', '揭示', '深入', '守望'],
    subjects: ['暗影', '迷雾', '鬼影', '诅咒', '谜团', '暗夜', '黑鸦', '古堡', '真相', '幽魂'],
    objects: ['真相', '谜团', '秘密', '诅咒', '钥匙', '线索', '黑暗', '阴影', '禁忌', '诡计'],
    locations: ['古堡', '迷雾', '深渊', '暗巷', '废墟', '森林', '墓园', '暗室'],
    timeWords: ['深夜', '午夜', '永夜', '黎明前', '此刻', '雨夜', '寒夜', '万古'],
    descriptors: ['诡谲', '神秘', '阴暗', '恐怖', '诡秘', '幽暗', '压抑', '惊悚', '迷离', '森冷']
  },
  romantic_night: {
    imagery: ['星光', '月光', '玫瑰', '烛光', '烟花', '夜风', '银河', '萤火', '花瓣', '香槟'],
    emotions: ['浪漫', '心动', '甜蜜', '温柔', '沉醉', '幸福', '暧昧', '怦然', '缠绵', '迷恋'],
    actions: ['漫步', '相拥', '凝望', '许愿', '举杯', '轻吻', '牵手', '低语', '共舞', '陪伴'],
    subjects: ['恋人', '星光', '月光', '玫瑰', '夜风', '烛光', '心跳', '身影', '誓言', '萤火'],
    objects: ['玫瑰', '誓言', '星光', '酒杯', '承诺', '夜晚', '回忆', '心跳', '花瓣', '甜蜜'],
    locations: ['月下', '花海', '海边', '屋顶', '街道', '窗前', '星空下', '梦里'],
    timeWords: ['今夜', '此刻', '永远', '深夜', '黄昏', '黎明', '整夜', '余生'],
    descriptors: ['浪漫', '温柔', '甜蜜', '璀璨', '梦幻', '迷离', '深情', '朦胧', '醉人', '美好']
  },
  nostalgic_memory: {
    imagery: ['旧照片', '蝉鸣', '单车', '校服', '夕阳', '老歌', '信笺', '黑板', '操场', '晚风'],
    emotions: ['怀旧', '感伤', '温暖', '怅然', '留恋', '唏嘘', '怀念', '酸涩', '珍惜', '释然'],
    actions: ['回忆', '翻看', '怀念', '重温', '回首', '珍藏', '追忆', '守候', '回望', '铭记'],
    subjects: ['青春', '旧时光', '故人', '少年', '回忆', '老歌', '日记', '旧影', '时光', '流年'],
    objects: ['回忆', '旧物', '照片', '青春', '时光', '往事', '片段', '笑颜', '旧梦', '足迹'],
    locations: ['校园', '老街', '操场', '旧巷', '故乡', '窗前', '梦里', '相册里'],
    timeWords: ['那年', '从前', '曾经', '往昔', '昨日', '青春', '旧时', '流年'],
    descriptors: ['遥远', '泛黄', '熟悉', '温暖', '模糊', '珍贵', '青涩', '美好', '斑驳', '难忘']
  },
  energetic_party: {
    imagery: ['霓虹', '灯光', '舞池', '音浪', '荧光', '汗珠', '聚光', '节拍', '烟雾', '彩带'],
    emotions: ['兴奋', '狂热', '激昂', '澎湃', '自由', '畅快', '狂欢', '嗨翻', '释放', '沸腾'],
    actions: ['跳跃', '舞动', '呐喊', '摇摆', '狂欢', '释放', '燃烧', '尖叫', '蹦跳', '尽情'],
    subjects: ['人群', '舞者', '灯光', '节拍', '音浪', '青春', '夜晚', '派对', '节奏', '心跳'],
    objects: ['节拍', '灯光', '夜晚', '音乐', '能量', '快乐', '自由', '激情', '青春', '派对'],
    locations: ['舞池', '派对', '舞台', '夜店', '广场', '现场', '灯光下', '人群中'],
    timeWords: ['今夜', '此刻', '整夜', '通宵', '当下', '青春', '今宵', '永远'],
    descriptors: ['狂热', '劲爆', '嗨翻', '炽热', '澎湃', '炫酷', '沸腾', '耀眼', '震撼', '肆意']
  },
  dreamy_fantasy: {
    imagery: ['云朵', '精灵', '彩虹', '水晶', '星尘', '魔法', '仙境', '萤火', '羽翼', '幻光'],
    emotions: ['梦幻', '奇妙', '纯真', '向往', '迷醉', '惊喜', '恍惚', '轻盈', '温柔', '憧憬'],
    actions: ['漂浮', '飞翔', '变幻', '闪烁', '漫游', '编织', '绽放', '凝结', '流转', '飘舞'],
    subjects: ['精灵', '梦境', '云朵', '魔法', '仙境', '星光', '幻影', '水晶', '彩虹', '羽翼'],
    objects: ['梦境', '魔法', '仙境', '奇迹', '星光', '幻影', '彩虹', '水晶', '童话', '美好'],
    locations: ['云端', '仙境', '梦境', '森林', '星河', '水晶宫', '彩虹桥', '幻境'],
    timeWords: ['梦境', '永恒', '此刻', '永远', '瞬间', '童话', '无尽', '永夜'],
    descriptors: ['梦幻', '奇妙', '空灵', '璀璨', '轻盈', '纯净', '绚烂', '迷离', '童话', '斑斓']
  },
  modern_city: {
    imagery: ['霓虹', '高楼', '车流', '地铁', '屏幕', '玻璃', '广告牌', '街灯', '天际线', '人群'],
    emotions: ['匆忙', '迷茫', '孤独', '野心', '焦虑', '兴奋', '冷漠', '渴望', '疲惫', '期待'],
    actions: ['穿梭', '奔波', '打拼', '凝望', '追逐', '闪耀', '打卡', '刷新', '奔跑', '攀登'],
    subjects: ['都市', '霓虹', '行人', '车流', '高楼', '夜归人', '打工人', '屏幕', '街灯', '梦想'],
    objects: ['城市', '霓虹', '节奏', '梦想', '生活', '未来', '夜晚', '焦虑', '机会', '繁华'],
    locations: ['都市', '地铁', '写字楼', '街头', '天桥', '夜店', '公寓', '商圈'],
    timeWords: ['今夜', '每天', '深夜', '清晨', '此刻', '未来', '通宵', '周末'],
    descriptors: ['繁华', '现代', '匆忙', '冰冷', '璀璨', '喧嚣', '冷漠', '时尚', '忙碌', '耀眼']
  },
  ancient_legend: {
    imagery: ['古道', '烽火', '龙影', '剑光', '仙山', '古卷', '神兽', '灵泉', '仙气', '星象'],
    emotions: ['敬畏', '神往', '豪迈', '沧桑', '震撼', '景仰', '传奇', '肃穆', '激昂', '怅惘'],
    actions: ['传颂', '征战', '修炼', '飞升', '守护', '祭奠', '寻访', '降妖', '悟道', '传承'],
    subjects: ['英雄', '仙人', '神兽', '传说', '古卷', '剑客', '帝王', '先贤', '灵兽', '神灵'],
    objects: ['传说', '神话', '古卷', '神器', '传奇', '使命', '因果', '秘宝', '誓言', '史诗'],
    locations: ['仙山', '古道', '宫廷', '战场', '秘境', '神殿', '江湖', '九天'],
    timeWords: ['远古', '千古', '万世', '前世', '此生', '永恒', '乱世', '盛世'],
    descriptors: ['古老', '传奇', '神秘', '壮阔', '沧桑', '神圣', '恢弘', '悠远', '磅礴', '不朽']
  },
  indie_story: {
    imagery: ['吉他', '咖啡', '路灯', '旧唱片', '日记', '耳机', '窗台', '烟圈', '旧鞋', '便签'],
    emotions: ['真实', '倔强', '孤独', '自由', '坦率', '迷茫', '坚定', '淡然', '倔强', '释然'],
    actions: ['弹唱', '记录', '独行', '坚持', '表达', '反抗', '创作', '漫步', '思考', '追寻'],
    subjects: ['少年', '歌手', '自己', '影子', '吉他', '日记', '故事', '路人', '梦想', '心声'],
    objects: ['吉他', '梦想', '故事', '真实', '自己', '自由', '音乐', '方向', '心声', '生活'],
    locations: ['咖啡馆', '街头', '房间', '路上', '天台', '地铁', '舞台', '角落'],
    timeWords: ['此刻', '每天', '青春', '曾经', '未来', '深夜', '当下', '长久'],
    descriptors: ['真实', '简单', '独立', '倔强', '纯粹', '朴素', '自由', '低调', '坦率', '孤独']
  },
  folk_tale: {
    imagery: ['炊烟', '麦田', '老槐', '古井', '土路', '篱笆', '夕阳', '镰刀', '灶台', '老屋'],
    emotions: ['朴实', '温暖', '眷恋', '踏实', '怀念', '感动', '亲切', '安详', '惆怅', '感恩'],
    actions: ['讲述', '耕作', '归家', '传承', '围坐', '回忆', '守望', '相聚', '劳作', '期盼'],
    subjects: ['老人', '故乡', '老槐', '麦田', '村庄', '故事', '游子', '乡亲', '土地', '往事'],
    objects: ['故乡', '故事', '土地', '乡音', '往事', '老酒', '丰收', '回忆', '智慧', '根'],
    locations: ['村庄', '田间', '老屋', '村口', '灶台旁', '老树下', '乡间', '故里'],
    timeWords: ['从前', '当年', '四季', '岁岁', '丰收', '此刻', '童年', '长久'],
    descriptors: ['朴实', '温暖', '古老', '亲切', '金黄', '宁静', '醇厚', '熟悉', '苍老', '踏实']
  },
  summer_vibes: {
    imagery: ['阳光', '海浪', '沙滩', '椰树', '蝉鸣', '冰淇淋', '比基尼', '冲浪板', '烈日', '海风'],
    emotions: ['快乐', '自由', '轻松', '热情', '畅快', '兴奋', '惬意', '奔放', '欢愉', '灿烂'],
    actions: ['畅游', '冲浪', '嬉戏', '奔跑', '晒太阳', '欢笑', '派对', '旅行', '放松', '享受'],
    subjects: ['海浪', '阳光', '夏日', '少年', '海风', '蝉鸣', '沙滩', '青春', '假期', '狂欢'],
    objects: ['夏天', '海浪', '阳光', '自由', '快乐', '假期', '青春', '海风', '回忆', '派对'],
    locations: ['海滩', '海边', '泳池', '街道', '岛屿', '阳光下', '椰林', '夏夜'],
    timeWords: ['盛夏', '今夏', '此刻', '整个夏天', '午后', '黄昏', '通宵', '假期'],
    descriptors: ['灿烂', '热烈', '清爽', '自由', '奔放', '明媚', '畅快', '耀眼', '热情', '欢快']
  },
  winter_solitude: {
    imagery: ['雪花', '寒风', '冰晶', '枯枝', '炉火', '霜花', '冻土', '冷月', '雪原', '冰湖'],
    emotions: ['孤寂', '清冷', '沉静', '凄凉', '安宁', '寂寥', '萧索', '落寞', '平静', '沉思'],
    actions: ['独坐', '守望', '凝望', '蜷缩', '沉思', '取暖', '漫步', '等待', '蛰伏', '回忆'],
    subjects: ['雪花', '寒风', '孤影', '炉火', '冷月', '冬夜', '旅人', '枯枝', '霜花', '寂静'],
    objects: ['寒冬', '雪花', '回忆', '寂静', '冷意', '炉火', '孤独', '时光', '安宁', '往事'],
    locations: ['雪原', '小屋', '窗前', '冰湖', '寒夜', '荒野', '炉火旁', '深山'],
    timeWords: ['寒冬', '长夜', '岁末', '此刻', '冬夜', '黎明', '永恒', '整个冬天'],
    descriptors: ['寒冷', '清冷', '寂寥', '苍白', '萧瑟', '宁静', '孤寂', '凛冽', '纯净', '沉静']
  },
  spring_awakening: {
    imagery: ['新芽', '春雨', '花开', '燕子', '微风', '晨露', '绿野', '桃红', '柳絮', '暖阳'],
    emotions: ['希望', '欣喜', '苏醒', '蓬勃', '温暖', '期待', '舒畅', '雀跃', '清新', '振奋'],
    actions: ['绽放', '萌发', '苏醒', '生长', '舒展', '歌唱', '飞翔', '迎接', '漫步', '呼吸'],
    subjects: ['春芽', '燕子', '春风', '花朵', '晨露', '大地', '新生', '绿野', '希望', '生命'],
    objects: ['春天', '新生', '希望', '花开', '暖阳', '绿意', '生命', '曙光', '芬芳', '生机'],
    locations: ['田野', '花园', '林间', '溪畔', '山野', '春风里', '阳光下', '枝头'],
    timeWords: ['初春', '清晨', '此刻', '春天', '黎明', '新岁', '万物', '永昼'],
    descriptors: ['清新', '蓬勃', '嫩绿', '温暖', '明媚', '鲜活', '盎然', '娇嫩', '灿烂', '生机']
  },
  autumn_melancholy: {
    imagery: ['落叶', '秋霜', '残阳', '枯叶', '秋风', '雁阵', '暮色', '红枫', '寒蝉', '晚霞'],
    emotions: ['怅惘', '萧瑟', '感伤', '惆怅', '凄美', '怅然', '落寞', '唏嘘', '苍凉', '怀念'],
    actions: ['飘零', '凋落', '回望', '叹息', '独行', '追忆', '守望', '漫步', '凝望', '沉吟'],
    subjects: ['落叶', '秋风', '残阳', '雁阵', '秋色', '旅人', '孤影', '寒蝉', '暮光', '旧梦'],
    objects: ['秋天', '落叶', '回忆', '往事', '时光', '离愁', '残梦', '暮色', '萧瑟', '旧事'],
    locations: ['秋林', '古道', '长街', '桥头', '山间', '暮色中', '风里', '旧地'],
    timeWords: ['深秋', '黄昏', '暮色', '此刻', '当年', '岁末', '长夜', '流年'],
    descriptors: ['萧瑟', '凄美', '苍凉', '萧条', '深沉', '惆怅', '斑斓', '寂寥', '苍茫', '凄清']
  },
  ocean_dreams: {
    imagery: ['海浪', '潮汐', '珊瑚', '贝壳', '星光', '海鸥', '蓝鲸', '深渊', '海雾', '帆影'],
    emotions: ['辽阔', '自由', '向往', '敬畏', '宁静', '梦幻', '深邃', '孤寂', '澎湃', '沉思'],
    actions: ['远航', '潜入', '漂流', '追寻', '凝望', '乘风', '破浪', '探索', '漂泊', '守望'],
    subjects: ['海浪', '蓝鲸', '帆船', '海鸥', '潮汐', '深海', '旅人', '星光', '海风', '梦境'],
    objects: ['大海', '远方', '梦想', '深渊', '自由', '星光', '潮汐', '彼岸', '梦境', '秘密'],
    locations: ['海边', '深海', '船上', '彼岸', '海岸', '海面', '灯塔下', '远方'],
    timeWords: ['永恒', '此刻', '潮起', '潮落', '黎明', '黄昏', '整夜', '长久'],
    descriptors: ['辽阔', '深邃', '蔚蓝', '澎湃', '梦幻', '自由', '神秘', '浩瀚', '宁静', '壮阔']
  },
  ghost_love: {
    imagery: ['幽魂', '磷火', '残月', '阴风', '纸钱', '孤坟', '迷雾', '残烛', '魅影', '黄泉'],
    emotions: ['痴缠', '幽怨', '凄婉', '执念', '怅惘', '缱绻', '哀恸', '缠绵', '眷恋', '不舍'],
    actions: ['流连', '守望', '追寻', '萦绕', '飘散', '低诉', '穿越', '守候', '呢喃', '消散'],
    subjects: ['幽魂', '孤魂', '魅影', '残梦', '旧约', '黄泉路', '奈何桥', '三生石', '彼岸花', '忘川'],
    objects: ['前缘', '执念', '残愿', '旧约', '夙愿', '离恨', '情丝', '残魂', '余温', '遗愿'],
    locations: ['黄泉', '奈何桥', '三生石畔', '忘川边', '孤坟前', '幽冥', '残梦中', '旧宅深处'],
    timeWords: ['千年', '永世', '轮回', '前生', '今世', '彼岸', '永夜', '生生世世'],
    descriptors: ['缥缈', '幽冷', '凄美', '缱绻', '幽怨', '执念', '缠绵', '凄婉', '痴绝', '苍茫']
  },
  supernatural: {
    imagery: ['鬼火', '幽魂', '咒语', '符咒', '异象', '残响', '迷雾', '暗影', '通灵', '异界'],
    emotions: ['诡秘', '战栗', '敬畏', '不安', '迷惑', '震撼', '痴迷', '惶恐', '躁动', '恍惚'],
    actions: ['召唤', '驱散', '穿越', '窥探', '封印', '觉醒', '附身', '显灵', '感应', '破解'],
    subjects: ['幽灵', '咒印', '法阵', '异相', '残魂', '灵媒', '结界', '异象', '秘宝', '预言'],
    objects: ['咒语', '符纸', '灵力', '秘宝', '结界', '预言', '残响', '印记', '契约', '诅咒'],
    locations: ['异界', '结界内', '废墟深处', '密室', '墓地', '阴阳交界', '虚空', '古宅'],
    timeWords: ['千年', '永夜', '破晓前', '月圆夜', '此刻', '轮回', '混沌', '创世'],
    descriptors: ['诡谲', '神秘', '幽森', '空灵', '妖异', '禁忌', '苍茫', '洪荒', '寂灭', '重生']
  }
};

/* =========================================================================
 * 2. STYLE MODIFIERS
 * Each style defines vocabularyBias, sentencePatterns, rhymePreference,
 * lineLength and tone.
 * ========================================================================= */

const STYLE_MODIFIERS = {
  pop: {
    vocabularyBias: ['快乐', '阳光', '青春', '心动', '旋律', '闪亮'],
    sentencePatterns: ['{subject}{action}，{emotion}的{object}', '{imagery}里{action}，{emotion}满天'],
    rhymePreference: 'AABB',
    lineLength: [7, 12],
    tone: 'casual',
    instrumentation: ['钢琴', '吉他', '贝斯', '鼓组'],
    dynamics: ['mf', 'f'],
    vocal: { gender: '男声', emotionLevel: '情感6级', tone: '叙事', dialect: '普通话', micTechnique: '贴近麦克风', layering: '双轨人声' },
    effects: ['混响', '延迟'],
    sfx: []
  },
  rock: {
    vocabularyBias: ['撕裂', '火焰', '反叛', '自由', '呐喊', '热血', '爆发', '嘶吼', '震撼', '不屈'],
    sentencePatterns: [
      '{subject}{action}天，{emotion}燃烧',
      '{imagery}{action}，{subject}永不{action}',
      '{descriptor}{imagery}中，{subject}{action}',
      '{emotion}的{object}，{action}到{timeWord}',
      '{location}里{subject}{action}，{emotion}沸腾',
      '哪怕{imagery}{action}，{subject}也要{action}',
      '{subject}{action}，{emotion}刻进{object}'
    ],
    rhymePreference: 'ABAB',
    lineLength: [6, 11],
    tone: 'urban',
    instrumentation: ['吉他', '贝斯', '鼓组', '钢琴'],
    dynamics: ['f', 'ff', '渐强'],
    vocal: { gender: '男声', emotionLevel: '情感8级', tone: '嘶吼', dialect: '普通话', micTechnique: '贴近麦克风', layering: '多重人声叠录' },
    effects: ['失真', '压缩', '混响'],
    sfx: ['雷声']
  },
  electronic: {
    vocabularyBias: ['霓虹', '脉冲', '未来', '节拍', '释放', '迷幻'],
    sentencePatterns: ['{imagery}{action}，{subject}{action}', '{emotion}的{object}，{action}到{timeWord}'],
    rhymePreference: 'AABB',
    lineLength: [6, 10],
    tone: 'urban',
    instrumentation: ['合成器', '电子鼓', '采样器', '音序器'],
    dynamics: ['mf', 'f', '突强'],
    vocal: { gender: '女声', emotionLevel: '情感7级', tone: '吟唱', dialect: '普通话', micTechnique: '贴耳', layering: '双轨人声' },
    effects: ['调制', '延迟', '镶边'],
    sfx: ['心跳', '时钟']
  },
  hip_hop: {
    vocabularyBias: ['街头', '真实', '态度', '麦克风', '涂鸦', '节奏'],
    sentencePatterns: ['{subject}在{location}{action}，{emotion}是{object}', '{imagery}{action}，{subject}说真话'],
    rhymePreference: 'AABB',
    lineLength: [8, 14],
    tone: 'casual',
    instrumentation: ['鼓组', '贝斯', '采样器', '合成器'],
    dynamics: ['mf', 'f'],
    vocal: { gender: '男声', emotionLevel: '情感6级', tone: '独白', dialect: '普通话', micTechnique: '贴近麦克风', layering: '单层人声' },
    effects: ['压缩', '均衡'],
    sfx: []
  },
  ballad: {
    vocabularyBias: ['深情', '钢琴', '思念', '月光', '永恒', '温柔', '泪光', '心跳', '呢喃', '低语'],
    sentencePatterns: [
      '{subject}{action}，{emotion}蔓延',
      '{imagery}里{action}，{object}还在',
      '{timeWord}的{location}，{subject}独自{action}',
      '{emotion}的{subject}，{action}在{location}',
      '{descriptor}{imagery}下，{subject}静静{action}',
      '{subject}啊，{action}这{descriptor}{object}',
      '{imagery}{action}，{emotion}永不{action}'
    ],
    rhymePreference: 'ABAB',
    lineLength: [7, 12],
    tone: 'formal',
    instrumentation: ['钢琴', '大提琴', '小提琴', '吉他'],
    dynamics: ['p', 'mp', 'mf'],
    vocal: { gender: '女声', emotionLevel: '情感7级', tone: '叙事', dialect: '普通话', micTechnique: '空荡大厅', layering: '双轨人声' },
    effects: ['混响', '延迟', '合唱'],
    sfx: ['雨声']
  },
  jazz: {
    vocabularyBias: ['萨克斯', '红酒', '慵懒', '夜色', '优雅', '摇摆'],
    sentencePatterns: ['{location}里{subject}{action}，{emotion}悠扬', '{imagery}与{imagery}，{emotion}成诗'],
    rhymePreference: 'ABCB',
    lineLength: [7, 13],
    tone: 'casual',
    instrumentation: ['萨克斯', '钢琴', '贝斯', '鼓组'],
    dynamics: ['mp', 'mf'],
    vocal: { gender: '女声', emotionLevel: '情感5级', tone: '低语', dialect: '普通话', micTechnique: '教堂混响', layering: '单层人声' },
    effects: ['混响', '延迟'],
    sfx: []
  },
  classical: {
    vocabularyBias: ['钢琴', '小提琴', '永恒', '宫廷', '高雅', '命运'],
    sentencePatterns: ['{subject}{action}，{object}永恒', '{imagery}间{action}，{emotion}不朽'],
    rhymePreference: 'ABAB',
    lineLength: [7, 12],
    tone: 'classical',
    instrumentation: ['钢琴', '小提琴', '大提琴', '长笛'],
    dynamics: ['p', 'mp', 'mf', 'f'],
    vocal: { gender: '女声', emotionLevel: '情感4级', tone: '吟诵', dialect: '普通话', micTechnique: '教堂混响', layering: '和声合唱' },
    effects: ['混响'],
    sfx: []
  },
  rnb: {
    vocabularyBias: ['烛光', '红酒', '性感', '亲密', '节奏', '夜色'],
    sentencePatterns: ['{location}里{subject}{action}，{emotion}流转', '{imagery}{action}，{subject}靠近'],
    rhymePreference: 'ABCB',
    lineLength: [7, 12],
    tone: 'casual',
    instrumentation: ['钢琴', '贝斯', '鼓组', '合成器'],
    dynamics: ['mp', 'mf'],
    vocal: { gender: '女声', emotionLevel: '情感6级', tone: '低语', dialect: '普通话', micTechnique: '贴耳', layering: '双轨人声' },
    effects: ['延迟', '混响', '调制'],
    sfx: ['心跳']
  },
  country: {
    vocabularyBias: ['公路', '吉他', '牛仔', '星空', '自由', '篝火'],
    sentencePatterns: ['{location}上{subject}{action}，{emotion}自由', '{imagery}{action}，{object}简单'],
    rhymePreference: 'AABB',
    lineLength: [7, 12],
    tone: 'casual',
    instrumentation: ['吉他', '贝斯', '鼓组', '小提琴'],
    dynamics: ['mp', 'mf'],
    vocal: { gender: '男声', emotionLevel: '情感5级', tone: '叙事', dialect: '普通话', micTechnique: '远距', layering: '单层人声' },
    effects: ['混响'],
    sfx: ['风声']
  },
  heartbreaking: {
    vocabularyBias: ['碎裂', '泪痕', '绝望', '回忆', '伤口', '心碎'],
    sentencePatterns: ['{subject}{action}，{emotion}成河', '{imagery}里{action}，{object}破碎'],
    rhymePreference: 'ABAB',
    lineLength: [6, 12],
    tone: 'formal',
    instrumentation: ['钢琴', '大提琴', '小提琴', '吉他'],
    dynamics: ['p', 'mp', '渐弱'],
    vocal: { gender: '女声', emotionLevel: '情感8级', tone: '低语', dialect: '普通话', micTechnique: '空荡大厅', layering: '单层人声' },
    effects: ['混响', '延迟', '颤音'],
    sfx: ['雨声']
  },
  healing: {
    vocabularyBias: ['阳光', '微风', '治愈', '温暖', '新生', '安宁'],
    sentencePatterns: ['{subject}{action}，{emotion}流淌', '{imagery}里{action}，{object}愈合'],
    rhymePreference: 'AABB',
    lineLength: [7, 12],
    tone: 'ethereal',
    instrumentation: ['钢琴', '吉他', '小提琴', '合成器'],
    dynamics: ['p', 'mp', 'mf'],
    vocal: { gender: '女声', emotionLevel: '情感4级', tone: '低语', dialect: '普通话', micTechnique: '教堂混响', layering: '和声合唱' },
    effects: ['混响', '延迟', '调制'],
    sfx: ['风声', '鸟鸣', '流水']
  },
  time_travel: {
    vocabularyBias: ['铜镜', '前世', '轮回', '时空', '宿命', '千年'],
    sentencePatterns: ['{subject}{action}，{object}轮回', '{imagery}交错，{emotion}穿越'],
    rhymePreference: 'ABAB',
    lineLength: [7, 13],
    tone: 'classical',
    instrumentation: ['古琴', '古筝', '箫', '合成器'],
    dynamics: ['p', 'mp', 'mf', '渐强'],
    vocal: { gender: '女声', emotionLevel: '情感5级', tone: '吟诵', dialect: '普通话', micTechnique: '空荡大厅', layering: '双轨人声' },
    effects: ['混响', '延迟', '调制'],
    sfx: ['钟声']
  },
  epic: {
    vocabularyBias: ['战旗', '荣耀', '征途', '英雄', '壮志', '烽火'],
    sentencePatterns: ['{subject}{action}，{object}永存', '{imagery}间{action}，{emotion}磅礴'],
    rhymePreference: 'AABB',
    lineLength: [7, 13],
    tone: 'classical',
    instrumentation: ['小提琴', '大提琴', '鼓组', '小号'],
    dynamics: ['f', 'ff', '渐强', '突强'],
    vocal: { gender: '男声', emotionLevel: '情感8级', tone: '呐喊', dialect: '普通话', micTechnique: '教堂混响', layering: '和声合唱' },
    effects: ['混响', '压缩'],
    sfx: ['雷声', '钟声']
  },
  dark: {
    vocabularyBias: ['深渊', '诅咒', '暗影', '救赎', '恐惧', '黑暗'],
    sentencePatterns: ['{location}里{subject}{action}，{emotion}蔓延', '{imagery}{action}，{object}降临'],
    rhymePreference: 'ABCB',
    lineLength: [7, 12],
    tone: 'ethereal',
    instrumentation: ['钢琴', '大提琴', '合成器', '效果器'],
    dynamics: ['pp', 'p', 'mf'],
    vocal: { gender: '男声', emotionLevel: '情感7级', tone: '低语', dialect: '普通话', micTechnique: '远距', layering: '单层人声' },
    effects: ['混响', '延迟', '相位'],
    sfx: ['雷声', '风声']
  },
  romantic: {
    vocabularyBias: ['玫瑰', '月光', '誓言', '浪漫', '心跳', '星光'],
    sentencePatterns: ['{location}下{subject}{action}，{emotion}永恒', '{imagery}{action}，{object}不散'],
    rhymePreference: 'AABB',
    lineLength: [7, 12],
    tone: 'formal',
    instrumentation: ['钢琴', '小提琴', '大提琴', '萨克斯'],
    dynamics: ['mp', 'mf'],
    vocal: { gender: '女声', emotionLevel: '情感6级', tone: '吟唱', dialect: '普通话', micTechnique: '贴近麦克风', layering: '双轨人声' },
    effects: ['混响', '延迟', '合唱'],
    sfx: []
  },
  nostalgic: {
    vocabularyBias: ['旧时光', '青春', '回忆', '蝉鸣', '泛黄', '那年'],
    sentencePatterns: ['{subject}{action}，{object}不老', '{imagery}里{action}，{emotion}依旧'],
    rhymePreference: 'ABAB',
    lineLength: [7, 12],
    tone: 'casual',
    instrumentation: ['吉他', '钢琴', '贝斯', '小提琴'],
    dynamics: ['p', 'mp'],
    vocal: { gender: '男声', emotionLevel: '情感5级', tone: '叙事', dialect: '普通话', micTechnique: '远距', layering: '单层人声' },
    effects: ['混响', '延迟'],
    sfx: ['风声', '钟声']
  },
  energetic: {
    vocabularyBias: ['火焰', '舞台', '燃烧', '热血', '呐喊', '活力'],
    sentencePatterns: ['{subject}{action}，{emotion}沸腾', '{imagery}{action}，{object}闪耀'],
    rhymePreference: 'AABB',
    lineLength: [6, 11],
    tone: 'urban',
    instrumentation: ['鼓组', '吉他', '贝斯', '合成器'],
    dynamics: ['f', 'ff', '突强'],
    vocal: { gender: '合唱', emotionLevel: '情感7级', tone: '呐喊', dialect: '普通话', micTechnique: '贴近麦克风', layering: '多重人声叠录' },
    effects: ['失真', '压缩', '延迟'],
    sfx: []
  },
  dreamy: {
    vocabularyBias: ['云朵', '精灵', '魔法', '仙境', '梦幻', '星光'],
    sentencePatterns: ['{location}里{subject}{action}，{emotion}流转', '{imagery}{action}，{object}美好'],
    rhymePreference: 'ABCB',
    lineLength: [7, 12],
    tone: 'ethereal',
    instrumentation: ['钢琴', '合成器', '小提琴', '长笛'],
    dynamics: ['p', 'mp', 'mf'],
    vocal: { gender: '女声', emotionLevel: '情感4级', tone: '吟唱', dialect: '普通话', micTechnique: '教堂混响', layering: '和声合唱' },
    effects: ['混响', '延迟', '调制', '镶边'],
    sfx: ['鸟鸣', '流水']
  },
  modern: {
    vocabularyBias: ['霓虹', '都市', '态度', '潮流', '个性', '自由'],
    sentencePatterns: ['{location}里{subject}{action}，{emotion}是我的', '{imagery}{action}，{object}不被定义'],
    rhymePreference: 'AABB',
    lineLength: [7, 13],
    tone: 'urban',
    instrumentation: ['合成器', '电子鼓', '贝斯', '效果器'],
    dynamics: ['mf', 'f'],
    vocal: { gender: '男声', emotionLevel: '情感6级', tone: '独白', dialect: '普通话', micTechnique: '贴耳', layering: '单层人声' },
    effects: ['压缩', '均衡', '延迟'],
    sfx: ['心跳']
  },
  ancient: {
    vocabularyBias: ['墨香', '折扇', '青衫', '江湖', '诗词', '红颜'],
    sentencePatterns: ['{subject}{action}，{object}情长', '{imagery}间{action}，{emotion}悠悠'],
    rhymePreference: 'ABAB',
    lineLength: [7, 12],
    tone: 'classical',
    instrumentation: ['古琴', '古筝', '箫', '笛子'],
    dynamics: ['p', 'mp', 'mf'],
    vocal: { gender: '女声', emotionLevel: '情感4级', tone: '吟诵', dialect: '普通话', micTechnique: '空荡大厅', layering: '和声合唱' },
    effects: ['混响'],
    sfx: ['风声', '流水']
  },
  indie: {
    vocabularyBias: ['吉他', '真实', '独立', '简单', '倔强', '自由'],
    sentencePatterns: ['{subject}{action}，{object}是自己', '{imagery}{action}，{emotion}简单'],
    rhymePreference: 'ABCB',
    lineLength: [7, 12],
    tone: 'casual',
    instrumentation: ['吉他', '钢琴', '贝斯', '鼓组'],
    dynamics: ['mp', 'mf'],
    vocal: { gender: '男声', emotionLevel: '情感5级', tone: '叙事', dialect: '普通话', micTechnique: '贴近麦克风', layering: '单层人声' },
    effects: ['混响'],
    sfx: []
  },
  folk: {
    vocabularyBias: ['炊烟', '麦田', '故乡', '老槐', '乡音', '土地'],
    sentencePatterns: ['{location}里{subject}{action}，{emotion}暖心', '{imagery}{action}，{object}是根'],
    rhymePreference: 'AABB',
    lineLength: [7, 12],
    tone: 'casual',
    instrumentation: ['吉他', '古筝', '笛子', '鼓'],
    dynamics: ['p', 'mp', 'mf'],
    vocal: { gender: '男声', emotionLevel: '情感4级', tone: '叙事', dialect: '普通话', micTechnique: '远距', layering: '单层人声' },
    effects: ['混响'],
    sfx: ['风声', '流水']
  },
  kpop: {
    vocabularyBias: ['舞台', '星光', '应援', '梦想', '青春', '闪耀'],
    sentencePatterns: ['{subject}{action}，{emotion}发光', '{imagery}{action}，{object}不散场'],
    rhymePreference: 'AABB',
    lineLength: [7, 12],
    tone: 'casual',
    instrumentation: ['合成器', '鼓组', '贝斯', '钢琴'],
    dynamics: ['mf', 'f', 'ff'],
    vocal: { gender: '女声', emotionLevel: '情感7级', tone: '吟唱', dialect: '普通话', micTechnique: '贴近麦克风', layering: '多重人声叠录' },
    effects: ['混响', '延迟', '调制'],
    sfx: []
  },
  reggae: {
    vocabularyBias: ['海滩', '椰树', '阳光', '放松', '自由', '爱'],
    sentencePatterns: ['{location}上{subject}{action}，{emotion}放松', '{imagery}{action}，{object}简单'],
    rhymePreference: 'ABCB',
    lineLength: [7, 12],
    tone: 'casual',
    instrumentation: ['吉他', '贝斯', '鼓组', '钢琴'],
    dynamics: ['mp', 'mf'],
    vocal: { gender: '男声', emotionLevel: '情感5级', tone: '叙事', dialect: '普通话', micTechnique: '远距', layering: '单层人声' },
    effects: ['混响', '延迟'],
    sfx: ['海浪', '风声']
  },
  ambient: {
    vocabularyBias: ['回声', '宁静', '宇宙', '冥想', '深海', '星空'],
    sentencePatterns: ['{subject}{action}，{emotion}无尽', '{imagery}间{action}，{object}消融'],
    rhymePreference: 'ABCB',
    lineLength: [6, 12],
    tone: 'ethereal',
    instrumentation: ['合成器', '效果器', '采样器', '钢琴'],
    dynamics: ['pp', 'p', 'mp'],
    vocal: { gender: '女声', emotionLevel: '情感3级', tone: '低语', dialect: '普通话', micTechnique: '教堂混响', layering: '和声合唱' },
    effects: ['混响', '延迟', '调制'],
    sfx: ['风声', '流水', '海浪']
  },
  chinese_traditional: {
    vocabularyBias: ['古筝', '琵琶', '墨笔', '茶香', '山水', '诗意'],
    sentencePatterns: ['{subject}{action}，{object}韵味长', '{imagery}间{action}，{emotion}悠然'],
    rhymePreference: 'ABAB',
    lineLength: [7, 12],
    tone: 'classical',
    instrumentation: ['古筝', '琵琶', '笛子', '箫'],
    dynamics: ['p', 'mp', 'mf'],
    vocal: { gender: '女声', emotionLevel: '情感4级', tone: '吟诵', dialect: '普通话', micTechnique: '空荡大厅', layering: '和声合唱' },
    effects: ['混响'],
    sfx: ['风声', '流水']
  },
  chinese_classical: {
    vocabularyBias: ['古琴', '笛声', '宫廷', '牡丹', '琴棋', '雅致'],
    sentencePatterns: ['{subject}{action}，{object}永恒', '{imagery}间{action}，{emotion}高雅'],
    rhymePreference: 'ABAB',
    lineLength: [7, 12],
    tone: 'classical',
    instrumentation: ['古琴', '笛子', '古筝', '阮'],
    dynamics: ['p', 'mp', 'mf'],
    vocal: { gender: '女声', emotionLevel: '情感4级', tone: '吟诵', dialect: '粤语', micTechnique: '教堂混响', layering: '和声合唱' },
    effects: ['混响'],
    sfx: ['风声', '钟声']
  },
  love_song: {
    vocabularyBias: ['玫瑰', '戒指', '誓言', '深情', '永恒', '思念'],
    sentencePatterns: ['{subject}{action}，{emotion}是歌', '{imagery}{action}，{object}不变'],
    rhymePreference: 'AABB',
    lineLength: [7, 12],
    tone: 'formal',
    instrumentation: ['钢琴', '小提琴', '大提琴', '吉他'],
    dynamics: ['mp', 'mf', 'f'],
    vocal: { gender: '女声', emotionLevel: '情感7级', tone: '吟唱', dialect: '普通话', micTechnique: '贴近麦克风', layering: '双轨人声' },
    effects: ['混响', '延迟', '合唱'],
    sfx: []
  },
  gothic_rock: {
    vocabularyBias: ['十字架', '鲜血', '玫瑰', '诅咒', '古堡', '暗黑'],
    sentencePatterns: ['{location}里{subject}{action}，{emotion}弥漫', '{imagery}{action}，{object}永恒'],
    rhymePreference: 'ABAB',
    lineLength: [7, 13],
    tone: 'ethereal',
    instrumentation: ['吉他', '贝斯', '鼓组', '合成器'],
    dynamics: ['f', 'ff', '突强'],
    vocal: { gender: '男声', emotionLevel: '情感8级', tone: '嘶吼', dialect: '普通话', micTechnique: '贴近麦克风', layering: '多重人声叠录' },
    effects: ['失真', '混响', '延迟', '相位'],
    sfx: ['雷声', '钟声']
  },
  ancient_modern: {
    vocabularyBias: ['古筝', '电子', '汉服', '霓虹', '融合', '传承'],
    sentencePatterns: ['{subject}{action}，{object}交融', '{imagery}与{imagery}，{emotion}碰撞'],
    rhymePreference: 'ABCB',
    lineLength: [7, 13],
    tone: 'urban',
    instrumentation: ['古筝', '合成器', '弦乐团', '电子鼓'],
    dynamics: ['mp', 'mf', 'f'],
    vocal: { gender: '女声', emotionLevel: '情感6级', tone: '吟唱', dialect: '普通话', micTechnique: '贴近麦克风', layering: '双轨人声' },
    effects: ['混响', '延迟', '调制'],
    sfx: []
  }
};

/* =========================================================================
 * 2.5 PRODUCTION METADATA BANKS
 * ========================================================================= */

const CHINESE_INSTRUMENTS = ['古琴', '古筝', '箫', '笛子', '琵琶', '二胡', '鼓', '笙', '埙', '阮'];
const WESTERN_INSTRUMENTS = ['钢琴', '小提琴', '大提琴', '吉他', '贝斯', '鼓组', '萨克斯', '小号', '长笛', '班多钮手风琴'];
const ELECTRONIC_INSTRUMENTS = ['合成器', '电子鼓', '采样器', '效果器', '音序器'];
const SOUND_EFFECTS = ['雨声', '风声', '脚步声', '雷声', '鸟鸣', '海浪', '钟声', '心跳', '时钟', '流水'];
const EFFECTS_PROCESSING = ['混响', '延迟', '调制', '合唱', '失真', '压缩', '均衡', '镶边', '相位', '颤音'];
const DYNAMICS = ['pp', 'p', 'mp', 'mf', 'f', 'ff', '渐强', '渐弱', '突强', '突弱'];
const VOCAL_DIRECTIONS = {
  gender: ['男声', '女声', '童声', '合唱'],
  emotionLevel: ['情感3级', '情感4级', '情感5级', '情感6级', '情感7级', '情感8级'],
  tone: ['叙事', '低语', '嘶吼', '吟唱', '呐喊', '独白', '吟诵'],
  dialect: ['普通话', '粤语', '闽南语'],
  micTechnique: ['贴近麦克风', '教堂混响', '空荡大厅', '贴耳', '远距'],
  layering: ['单层人声', '双轨人声', '多重人声叠录', '和声合唱']
};
const STYLE_VARIATION_SCHEMES = {
  default: { name: '原味复刻', description: '最完美贴合原始蓝图的方案' },
  enhanced: { name: '情绪放大', description: '将核心特质推向极致' },
  transformed: { name: '风格变奏', description: '抽离部分元素，换上新的音色' }
};

const TIME_SIGNATURES = {
  '4/4': { name: '四四拍', chinese: '进行曲', feel: '稳定', bpmRange: [60, 140], description: '强弱次强弱' },
  '3/4': { name: '三四拍', chinese: '华尔兹', feel: '摇摆', bpmRange: [60, 100], description: '强弱弱' },
  '2/4': { name: '二四拍', chinese: '快步', feel: '轻快', bpmRange: [80, 160], description: '强弱' },
  '6/8': { name: '六八拍', chinese: '船歌', feel: '流动', bpmRange: [60, 120], description: '强弱弱次强弱弱' },
  '3/8': { name: '三八拍', chinese: '圆舞曲', feel: '轻盈', bpmRange: [80, 130], description: '强弱弱' },
  '9/8': { name: '九八拍', chinese: '复三拍', feel: '宏大', bpmRange: [50, 100], description: '强弱弱次强弱弱再次强弱弱' },
  '5/4': { name: '五四拍', chinese: '不对称', feel: '复杂', bpmRange: [60, 110], description: '强弱次强弱' }
};

const TEMPO_MARKINGS = {
  largo: { name: '广板', bpm: 40, description: '缓慢庄重' },
  lento: { name: '慢板', bpm: 50, description: '缓慢' },
  adagio: { name: '柔板', bpm: 60, description: '舒缓优美' },
  andante: { name: '行板', bpm: 76, description: '行走速度' },
  moderato: { name: '中板', bpm: 100, description: '适中速度' },
  allegretto: { name: '小快板', bpm: 116, description: '轻快' },
  allegro: { name: '快板', bpm: 132, description: '快速活泼' },
  vivace: { name: '活泼', bpm: 140, description: '生动活泼' },
  presto: { name: '急板', bpm: 180, description: '急速' },
  prestissimo: { name: '最急板', bpm: 200, description: '极快' }
};

const ARTICULATION_MARKS = {
  legato: { name: '连奏', symbol: '⌒', description: '连贯流畅' },
  staccato: { name: '断奏', symbol: '·', description: '短促跳跃' },
  tenuto: { name: '保持', symbol: '-', description: '充分保持时值' },
  marcato: { name: '强调', symbol: '^', description: '有力强调' },
  accent: { name: '重音', symbol: '>', description: '加强力度' },
  staccatissimo: { name: '顿音', symbol: '▼', description: '更短促' },
  portato: { name: '半连奏', symbol: '⌒·', description: '连中有断' }
};

const EXPRESSION_MARKS = {
  crescendo: { name: '渐强', symbol: '≺', description: '音量逐渐增大' },
  decrescendo: { name: '渐弱', symbol: '≻', description: '音量逐渐减小' },
  ritardando: { name: '渐慢', symbol: 'rit.', description: '速度逐渐减慢' },
  accelerando: { name: '渐快', symbol: 'accel.', description: '速度逐渐加快' },
  rubato: { name: '自由节奏', symbol: 'rub.', description: '弹性速度处理' },
  fermata: { name: '延长', symbol: '𝄐', description: '延长音符时值' },
  daCapo: { name: '从头反复', symbol: 'D.C.', description: '回到乐曲开头' },
  fine: { name: '结束', symbol: 'Fine', description: '乐曲结束' }
};

const KEY_SIGNATURES = {
  'C': { name: 'C大调', sharps: 0, flats: 0, chinese: 'C大调', relativeMinor: 'a小调' },
  'G': { name: 'G大调', sharps: 1, flats: 0, chinese: 'G大调', relativeMinor: 'e小调' },
  'D': { name: 'D大调', sharps: 2, flats: 0, chinese: 'D大调', relativeMinor: 'b小调' },
  'A': { name: 'A大调', sharps: 3, flats: 0, chinese: 'A大调', relativeMinor: 'f♯小调' },
  'E': { name: 'E大调', sharps: 4, flats: 0, chinese: 'E大调', relativeMinor: 'c♯小调' },
  'F': { name: 'F大调', sharps: 0, flats: 1, chinese: 'F大调', relativeMinor: 'd小调' },
  'B♭': { name: 'B♭大调', sharps: 0, flats: 2, chinese: '降B大调', relativeMinor: 'g小调' },
  'E♭': { name: 'E♭大调', sharps: 0, flats: 3, chinese: '降E大调', relativeMinor: 'c小调' },
  'A♭': { name: 'A♭大调', sharps: 0, flats: 4, chinese: '降A大调', relativeMinor: 'f小调' },
  'D♭': { name: 'D♭大调', sharps: 0, flats: 5, chinese: '降D大调', relativeMinor: 'b♭小调' }
};

const CHORD_PROGRESSIONS = {
  pop: ['I-IV-V', 'I-vi-IV-V', 'vi-IV-I-V', 'I-V-vi-IV'],
  ballad: ['I-vi-ii-V', 'I-IV-viio-V', 'viio-iii-vi-ii-V'],
  rock: ['I-V-vi-IV', 'I-bVII-IV', 'I-IV-bIII-bII'],
  jazz: ['ii-V-I', 'I-vi-ii-V', 'viio-iii-vi-ii-V'],
  blues: ['I-I-I-I', 'IV-IV-I-I', 'I-IV-I-V'],
  chinese_classical: ['I-vi-IV-V', 'I-IV-vi-IV', 'vi-IV-I-V'],
  tango: ['I-V-vi-iii-IV-I-IV-V', 'i-vi-iv-V', 'i-III-vi-III'],
  electronic: ['I-IV-V', 'I-vi-IV-V', 'I-V-vi-IV', 'i-VII-III-vi']
};

const FSM_TRIGGERS = {
  'intro_to_verse': {
    condition: '当进入主歌段落',
    action: '鼓组加入轻拍，合成器渐入，人声从叙事转为深情',
    transition: 'pp → p'
  },
  'verse_to_prechorus': {
    condition: '当进入预副歌段落',
    action: '弦乐铺垫增强，节奏加快，人声张力提升',
    transition: 'p → mf'
  },
  'prechorus_to_chorus': {
    condition: '当进入副歌段落',
    action: '鼓组全力投入，弦乐团全编制，人声爆发',
    transition: 'mf → f → ff'
  },
  'chorus_to_verse': {
    condition: '当回到主歌段落',
    action: '乐器精简，保留核心旋律，人声回归叙事',
    transition: 'ff → mp'
  },
  'verse_to_bridge': {
    condition: '当进入桥段段落',
    action: '切换乐器组合，引入新音色，人声转为低语或独白',
    transition: 'mp → p → pp'
  },
  'bridge_to_final_chorus': {
    condition: '当进入最终副歌段落',
    action: '全曲最高潮，所有乐器齐奏，人声最强爆发',
    transition: 'pp → mf → f → ff'
  },
  'chorus_to_outro': {
    condition: '当进入尾声段落',
    action: '乐器逐渐退出，人声渐弱，环境音效渐入',
    transition: 'ff → mf → p → pp'
  },
  'key_change': {
    condition: '当需要转调时',
    action: '升高一个半音或全音，重新调整乐器音色',
    transition: '调性转换'
  },
  'dynamic_shift': {
    condition: '当情感需要突变时',
    action: '突然切换动态级别，制造戏剧化效果',
    transition: 'f → pp 或 pp → ff'
  },
  'instrument_swap': {
    condition: '当需要音色变化时',
    action: '替换核心乐器，保持旋律不变',
    transition: '乐器转换'
  }
};

const MUSICAL_TERMS = {
  tempo: {
    largo: '广板', lento: '慢板', adagio: '柔板', andante: '行板',
    moderato: '中板', allegretto: '小快板', allegro: '快板',
    vivace: '活泼', presto: '急板', prestissimo: '最急板'
  },
  dynamics: {
    ppp: '极弱', pp: '很弱', p: '弱', mp: '中弱',
    mf: '中强', f: '强', ff: '很强', fff: '极强',
    cresc: '渐强', decresc: '渐弱', dim: '渐弱',
    sf: '突强', sfz: '突强', fp: '强后即弱'
  },
  expression: {
    espressivo: '富有表情', legato: '连奏', staccato: '断奏',
    tenuto: '保持', marcato: '强调', rubato: '自由节奏',
    dolce: '甜美', cantabile: '如歌', maestoso: '庄严'
  },
  form: {
    intro: '前奏', verse: '主歌', prechorus: '预副歌',
    chorus: '副歌', bridge: '桥段', outro: '尾声',
    interlude: '间奏', finale: '终曲', coda: '尾声'
  }
};

/* =========================================================================
 * 3. SENTENCE TEMPLATES (slot syntax, NOT pre-written lyrics)
 * Slots: {imagery} {emotion} {action} {subject} {object} {location}
 *        {timeWord} {descriptor}
 * ========================================================================= */

const TEMPLATES = {
  intro: [
    '{location}里{descriptor}{subject}，{action}着{descriptor}{object}',
    '{timeWord}，{imagery}与{imagery}交织，{emotion}渐生',
    '{subject}{action}，{descriptor}如{imagery}',
    '{imagery}{action}，{location}渐{descriptor}',
    '{timeWord}的{location}，{subject}独自{action}',
    '{descriptor}的{imagery}里，{emotion}悄然{action}',
    '{subject}在{location}{action}，{object}若隐若现',
    '{imagery}与{imagery}，{emotion}在{location}蔓延',
    '{timeWord}初临，{descriptor}{subject}{action}'
  ],
  verse: [
    '{subject}在{location}里{action}，{emotion}了{object}',
    '{timeWord}的{location}，{descriptor}{subject}独自{action}',
    '{imagery}{action}，{emotion}的{subject}在{location}',
    '{descriptor}的{object}，{action}着{descriptor}{imagery}',
    '{subject}{action}，{timeWord}已{descriptor}',
    '{location}里{imagery}{action}，{emotion}涌上{subject}',
    '{timeWord}{subject}{action}，{object}渐行渐远',
    '{descriptor}{imagery}下，{subject}静静{action}',
    '{emotion}的{object}，{action}在{location}深处',
    '{subject}{action}着{object}，{timeWord}无声流逝'
  ],
  pre_chorus: [
    '{emotion}升腾，{subject}不再{action}',
    '看{imagery}{action}，{emotion}涌上心头',
    '{timeWord}逼近，{descriptor}{subject}将要{action}',
    '{imagery}之间，{emotion}与{emotion}碰撞',
    '{subject}{action}，{object}开始{action}',
    '{location}的尽头，{emotion}将{subject}吞没',
    '{descriptor}的{imagery}，{action}出{emotion}'
  ],
  chorus: [
    '{subject}啊，{action}这{descriptor}{object}',
    '就让{imagery}{action}，{emotion}永不{action}',
    '{emotion}的{subject}，{action}到{timeWord}',
    '{location}里{subject}{action}，{object}燃烧',
    '{timeWord}，{subject}为{object}{action}',
    '{descriptor}{imagery}下，{subject}肆意{action}',
    '{emotion}如{imagery}，{action}着{descriptor}{object}',
    '哪怕{imagery}{action}，{subject}也要{action}',
    '{subject}{action}，{emotion}刻进{object}',
    '让{descriptor}{object}，{action}到{timeWord}尽头'
  ],
  bridge: [
    '若{subject}能{action}，{object}是否会{action}',
    '{imagery}之间，{emotion}与{emotion}碰撞',
    '{timeWord}流转，{subject}已非{subject}',
    '{location}之外，{descriptor}{object}在{action}',
    '当{imagery}{action}，{emotion}能否{action}',
    '{subject}{action}，{object}终将{action}',
    '{descriptor}的{imagery}里，{emotion}与{emotion}交融'
  ],
  outro: [
    '{imagery}消散，{subject}归于{location}',
    '{timeWord}尽头，{emotion}化作{imagery}',
    '{subject}{action}，{object}随风而去',
    '{location}沉寂，{descriptor}{subject}安息',
    '{imagery}渐远，{emotion}归于平静',
    '{timeWord}落幕，{object}化作{imagery}',
    '{descriptor}{imagery}，{subject}悄然{action}',
    '{location}尽头，{emotion}永远{action}'
  ]
};

/* =========================================================================
 * 4. CHINESE RHYME ENGINE
 * ========================================================================= */

const RHYME_GROUPS = {
  an: ['寒', '残', '看', '叹', '散', '乱', '幻', '暖', '满', '远'],
  ang: ['光', '霜', '长', '忘', '狂', '伤', '浪', '唱', '想', '望'],
  ing: ['影', '静', '境', '冷', '醒', '听', '明', '清', '轻', '情'],
  ong: ['风', '空', '梦', '红', '动', '痛', '同', '终', '中', '钟'],
  i: ['泪', '碎', '醉', '悔', '美', '飞', '归', '谁', '随', '微'],
  u: ['无', '孤', '途', '路', '步', '舞', '诉', '雾', '渡', '暮'],
  a: ['花', '涯', '家', '茶', '纱', '霞', '哑', '怕', '下', '沙'],
  e: ['月', '雪', '血', '绝', '缺', '灭', '别', '歇', '裂', '铁'],
  ao: ['老', '好', '高', '笑', '闹', '吵', '照', '烧', '逃', '抱'],
  ou: ['愁', '楼', '秋', '流', '留', '求', '走', '透', '瘦', '后']
};

// Reverse lookup: character -> rhyme key
const _CHAR_TO_RHYME = (() => {
  const map = {};
  Object.keys(RHYME_GROUPS).forEach((key) => {
    RHYME_GROUPS[key].forEach((ch) => {
      map[ch] = key;
    });
  });
  return map;
})();

/**
 * Resolve a target ending into a rhyme group key.
 * Accepts either a rhyme key (e.g. 'an') or a single character.
 */
function _resolveRhymeKey(targetEnding) {
  if (!targetEnding) return null;
  if (RHYME_GROUPS[targetEnding]) return targetEnding;
  const last = targetEnding.slice(-1);
  return _CHAR_TO_RHYME[last] || null;
}

/**
 * Find a word from themeBank that rhymes with targetEnding and has not been
 * used yet. Searches across all vocabulary categories of the bank.
 *
 * @param {string} targetEnding - rhyme key or last character to rhyme with
 * @param {Set|Array} usedWords - words already used (avoid repeats)
 * @param {object} themeBank - a theme vocabulary bank
 * @returns {string|null} a matching word, or null if none found
 */
export function findRhymeWord(targetEnding, usedWords, themeBank) {
  const rhymeKey = _resolveRhymeKey(targetEnding);
  if (!rhymeKey || !themeBank) return null;

  const usedSet = usedWords instanceof Set ? usedWords : new Set(usedWords || []);
  const rhymeChars = RHYME_GROUPS[rhymeKey];

  // Collect candidate words from every category whose last character rhymes
  const candidates = [];
  const categories = ['imagery', 'emotions', 'actions', 'subjects', 'objects', 'locations', 'timeWords', 'descriptors'];
  categories.forEach((cat) => {
    const list = themeBank[cat];
    if (!Array.isArray(list)) return;
    list.forEach((word) => {
      if (!word) return;
      const last = word.slice(-1);
      if (rhymeChars.includes(last) && !usedSet.has(word)) {
        candidates.push(word);
      }
    });
  });

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/* =========================================================================
 * 5. SLOT CATEGORIES MAPPING
 * Maps template slot names to theme bank category names.
 * ========================================================================= */

const SLOT_TO_CATEGORY = {
  imagery: 'imagery',
  emotion: 'emotions',
  action: 'actions',
  subject: 'subjects',
  object: 'objects',
  location: 'locations',
  timeWord: 'timeWords',
  descriptor: 'descriptors'
};

/* =========================================================================
 * 6. CORE HELPERS
 * ========================================================================= */

function _pickRandom(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

function _pickWeighted(banks, weights) {
  // banks: array of theme banks; weights: array of numbers
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  let r = Math.random() * total;
  for (let i = 0; i < banks.length; i++) {
    r -= (weights[i] || 0);
    if (r <= 0) return banks[i];
  }
  return banks[banks.length - 1];
}

function _getWordForSlot(slot, banks, weights, usedWords, styleConfig) {
  const category = SLOT_TO_CATEGORY[slot];
  if (!category) return '';

  if (styleConfig && styleConfig.vocabularyBias && styleConfig.vocabularyBias.length) {
    const biasSlots = ['descriptor', 'emotion', 'object', 'subject'];
    if (biasSlots.includes(slot) && Math.random() < 0.2) {
      const shuffled = [...styleConfig.vocabularyBias].sort(() => Math.random() - 0.5);
      for (const biasWord of shuffled) {
        if (biasWord && !usedWords.has(biasWord)) {
          usedWords.add(biasWord);
          return biasWord;
        }
      }
    }
  }

  const bank = weights && weights.length > 1 ? _pickWeighted(banks, weights) : banks[0];
  const list = bank ? bank[category] : null;
  if (!list || list.length === 0) return '';

  const shuffled = [...list].sort(() => Math.random() - 0.5);
  for (const word of shuffled) {
    if (!usedWords.has(word)) {
      usedWords.add(word);
      return word;
    }
  }
  return _pickRandom(list);
}

function _fillTemplate(template, banks, weights, usedWords, styleConfig, rhymeOptions) {
  // Replace each {slot} token with a generated word.
  let result = template;
  const slotRegex = /\{(\w+)\}/g;
  const slots = [];
  let match;
  while ((match = slotRegex.exec(template)) !== null) {
    slots.push(match[1]);
  }

  // Process slots in order. Each .replace() targets the FIRST remaining
  // occurrence, so processing left-to-right fills tokens in document order.
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const token = `{${slot}}`;
    const isLast = i === slots.length - 1;

    // If this is the last slot in the template and rhyme is requested,
    // try to find a rhyming word from the bank for this slot category.
    if (rhymeOptions && rhymeOptions.targetEnding && isLast) {
      const rhymeWord = findRhymeWord(rhymeOptions.targetEnding, usedWords, banks[0]);
      if (rhymeWord) {
        usedWords.add(rhymeWord);
        result = result.replace(token, rhymeWord);
        continue;
      }
    }

    const word = _getWordForSlot(slot, banks, weights, usedWords, styleConfig);
    result = result.replace(token, word);
  }

  return result;
}

/**
 * Clamp a generated line to the style's preferred length range by trimming
 * or padding with a continuation particle. We avoid breaking meaning: trimming
 * only removes trailing punctuation/particles.
 */
function _enforceLineLength(line, styleConfig) {
  const [min, max] = styleConfig && styleConfig.lineLength ? styleConfig.lineLength : [6, 14];
  let out = line;
  if (out.length > max) {
    out = out.slice(0, max);
  }
  if (out.length < min) {
    const fillers = [
      '……', '，无止境', '，不停歇', '，在心中', '，永不散',
      '，到永远', '，在梦里', '，绕心间', '，难入眠', '，意未断',
      '，人未还', '，泪未干', '，情未了', '，缘未尽', '，夜未央'
    ];
    out += _pickRandom(fillers);
    out = out.slice(0, max);
  }
  return out;
}

/* =========================================================================
 * 7. LINE GENERATOR
 * ========================================================================= */

/**
 * Generate a single lyric line for a given section type.
 *
 * @param {string} sectionType - intro|verse|pre_chorus|chorus|bridge|outro
 * @param {object|Array} themeBank - a single bank or array of blended banks
 * @param {object} styleConfig - a style modifier config
 * @param {object} options - { banks, weights, usedWords, rhyme }
 * @returns {string} the generated line
 */
export function generateLine(sectionType, themeBank, styleConfig, options = {}) {
  const banks = options.banks || (Array.isArray(themeBank) ? themeBank : [themeBank]);
  const weights = options.weights || banks.map(() => 1);
  const usedWords = options.usedWords instanceof Set ? options.usedWords : new Set(options.usedWords || []);
  const rhyme = options.rhyme || null;

  // Decide template pool: prefer style sentencePatterns as extra variety
  const pool = TEMPLATES[sectionType] || TEMPLATES.verse;
  let template = _pickRandom(pool);

  // Occasionally (30%) use a style-specific sentence pattern instead
  if (styleConfig && styleConfig.sentencePatterns && styleConfig.sentencePatterns.length && Math.random() < 0.3) {
    template = _pickRandom(styleConfig.sentencePatterns);
  }

  let line = _fillTemplate(template, banks, weights, usedWords, styleConfig, rhyme ? { targetEnding: rhyme } : null);
  line = _enforceLineLength(line, styleConfig);

  return line;
}

/* =========================================================================
 * 8. SECTION GENERATOR
 * ========================================================================= */

const _RHYME_SCHEME_PATTERNS = {
  AABB: ['A', 'A', 'B', 'B'],
  ABAB: ['A', 'B', 'A', 'B'],
  ABCB: ['A', 'B', 'C', 'B'],
  ABC: ['A', 'B', 'C'],
  AAB: ['A', 'A', 'B'],
  ABA: ['A', 'B', 'A'],
  AAA: ['A', 'A', 'A'],
  AB: ['A', 'B']
};

/**
 * Generate a full section (2-4 lines) following a rhyme scheme.
 *
 * @param {string} sectionType
 * @param {object|Array} themeBank
 * @param {object} styleConfig
 * @param {number} complexity - 1-10, influences line count
 * @param {string} rhymeScheme - AABB|ABAB|ABCB
 * @returns {Array<string>} generated lines
 */
export function generateSection(sectionType, themeBank, styleConfig, lineCountOrComplexity = 3, rhymeScheme = 'ABAB', usedWords = null) {
  const banks = Array.isArray(themeBank) ? themeBank : [themeBank];
  const weights = banks.map(() => 1);
  const globalUsed = usedWords instanceof Set ? usedWords : new Set();

  // Support both old-style complexity number and new-style explicit lineCount
  const lineCount = lineCountOrComplexity <= 10 ? lineCountOrComplexity : (lineCountOrComplexity >= 7 ? 4 : lineCountOrComplexity >= 4 ? 3 : 2);
  const scheme = _RHYME_SCHEME_PATTERNS[rhymeScheme] || _RHYME_SCHEME_PATTERNS.ABAB;

  const lines = [];
  const rhymeAnchors = {};

  for (let i = 0; i < lineCount; i++) {
    const letter = scheme[i % scheme.length];
    let rhymeTarget = null;

    if (rhymeAnchors[letter]) {
      rhymeTarget = rhymeAnchors[letter];
    }

    const line = generateLine(sectionType, themeBank, styleConfig, {
      banks, weights, usedWords: globalUsed, rhyme: rhymeTarget
    });

    if (!rhymeAnchors[letter] && line.length > 0) {
      rhymeAnchors[letter] = line.slice(-1);
    }

    lines.push(line);
  }

  return {
    lines,
    productionMetadata: {
      instrumentation: styleConfig.instrumentation || [],
      dynamics: styleConfig.dynamics || [],
      vocal: styleConfig.vocal || {},
      effects: styleConfig.effects || [],
      sfx: styleConfig.sfx || []
    },
    rhymeScheme: scheme.slice(0, lineCount).join(''),
    lineCount,
    sectionType
  };
}

export function generateTimeMarkers(structure, duration = 270) {
  const markers = [];
  let currentTime = 0;
  const totalSections = structure.length;

  structure.forEach((sectionType, index) => {
    const baseDuration = duration / totalSections;
    const variance = baseDuration * 0.2;
    const sectionDuration = baseDuration + (Math.random() * variance * 2 - variance);

    const startTime = _formatTime(currentTime);
    const endTime = _formatTime(currentTime + sectionDuration);

    let dynamicLevel = 'mp';
    if (sectionType.includes('intro')) dynamicLevel = 'pp';
    else if (sectionType.includes('verse')) dynamicLevel = index < totalSections * 0.3 ? 'p' : 'mp';
    else if (sectionType.includes('pre_chorus')) dynamicLevel = 'mf';
    else if (sectionType.includes('chorus')) dynamicLevel = index > totalSections * 0.7 ? 'ff' : 'f';
    else if (sectionType.includes('bridge')) dynamicLevel = 'p→mp';
    else if (sectionType.includes('outro') || sectionType.includes('finale')) dynamicLevel = 'p→pp';

    markers.push({
      section: sectionType,
      startTime: currentTime,
      endTime: currentTime + sectionDuration,
      startTimeFormatted: startTime,
      endTimeFormatted: endTime,
      duration: sectionDuration,
      dynamicLevel,
      index
    });

    currentTime += sectionDuration;
  });

  return markers;
}

/* =========================================================================
 * 9. THEME / STYLE ACCESSORS & BLENDING
 * ========================================================================= */

/**
 * Get a theme vocabulary bank by key. Falls back to 'love' if not found.
 */
export function getThemeBank(theme) {
  return THEME_BANKS[theme] || THEME_BANKS.love;
}

function _getStyleConfig(style) {
  return STYLE_MODIFIERS[style] || STYLE_MODIFIERS.pop;
}

/**
 * Blend multiple theme banks (or style configs) with weighted random selection.
 * Returns a single merged bank whose categories contain the union of all
 * source banks' words. At generation time, weighted selection picks which
 * source bank a word comes from, producing cross-theme hybrid lyrics.
 *
 * @param {Array} banks - array of theme bank objects
 * @param {Array<number>} weights - parallel array of weights
 * @returns {object} a blended bank with merged categories + __sources + __weights
 */
export function blendBanks(banks, weights) {
  if (!banks || banks.length === 0) return THEME_BANKS.love;
  if (banks.length === 1) return banks[0];

  const w = weights && weights.length === banks.length ? weights : banks.map(() => 1);
  const merged = {
    imagery: [],
    emotions: [],
    actions: [],
    subjects: [],
    objects: [],
    locations: [],
    timeWords: [],
    descriptors: []
  };

  banks.forEach((bank) => {
    if (!bank) return;
    Object.keys(merged).forEach((cat) => {
      if (Array.isArray(bank[cat])) {
        merged[cat].push(...bank[cat]);
      }
    });
  });

  // Deduplicate while preserving order
  Object.keys(merged).forEach((cat) => {
    merged[cat] = [...new Set(merged[cat])];
  });

  // Attach metadata so the line generator can do weighted picks across sources
  merged.__sources = banks;
  merged.__weights = w;
  return merged;
}

/**
 * Create a theme bank from visual context (image analysis results).
 * This maps image-derived features into the standard theme bank structure,
 * allowing lyrics generation to use imagery/emotions extracted from the picture.
 *
 * @param {Object} visualContext - from visionAnalyzer.fullImageAnalysis()
 * @returns {Object} theme bank compatible with blendBanks()
 */
export function createVisualBank(visualContext) {
  if (!visualContext) return null;

  const { imagery = [], emotions = [], subjects = [], actions = [], locations = [] } = visualContext;

  return {
    imagery: [...new Set(imagery)].slice(0, 15),
    emotions: [...new Set(emotions)].slice(0, 10),
    actions: [...new Set(actions)].slice(0, 10),
    subjects: [...new Set(subjects)].slice(0, 10),
    objects: [...new Set(imagery)].slice(5, 15),
    locations: [...new Set(locations)].slice(0, 8),
    timeWords: ['此刻', '眼前', '当下', '瞬间', '此刻', '今朝', '今日', '当下'],
    descriptors: [...new Set(emotions)].slice(0, 8)
  };
}

/* =========================================================================
 * 10. STRUCTURE DEFINITIONS (per genre)
 * ========================================================================= */

const STRUCTURES = {
  pop: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'],
  rock: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  chinese_traditional: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'],
  electronic: ['intro', 'build', 'drop', 'verse', 'drop', 'verse', 'drop', 'outro'],
  hip_hop: ['intro', 'verse', 'hook', 'verse', 'hook', 'bridge', 'hook'],
  ballad: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  love_song: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  chinese_classical: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'outro'],
  tango: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
  ancient_modern: ['intro', 'verse', 'interlude', 'verse', 'chorus', 'bridge', 'finale', 'outro'],
  heartbreaking: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  healing: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  time_travel: ['intro', 'verse', 'interlude', 'verse', 'chorus', 'bridge', 'finale', 'outro'],
  epic: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  dark: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  romantic: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  nostalgic: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'outro'],
  energetic: ['intro', 'build', 'drop', 'verse', 'drop', 'verse', 'drop', 'bridge', 'drop', 'outro'],
  dreamy: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  modern: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  indie: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  folk: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'outro'],
  kpop: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  reggae: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  ambient: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'],
  ancient: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'outro'],
  jazz: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  classical: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  rnb: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  country: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  gothic_rock: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  friendship: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'outro'],
  nature: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'outro']
};

/* =========================================================================
 * 11. SECTION NORMALIZATION & META ANALYSIS (mirrors lyricsEngine format)
 * ========================================================================= */

function _normalizeSectionType(type) {
  if (type.includes('intro')) return 'intro';
  if (type.includes('verse')) return 'verse';
  if (type.includes('pre_chorus') || type.includes('prechorus')) return 'pre_chorus';
  if (type.includes('chorus')) return 'chorus';
  if (type.includes('bridge')) return 'bridge';
  if (type.includes('outro') || type.includes('finale') || type.includes('ending')) return 'outro';
  if (type.includes('interlude')) return 'verse';
  if (type.includes('build') || type.includes('drop') || type.includes('hook')) return 'chorus';
  return 'verse';
}

function _analyzeLiteraryDevices(sections) {
  const devices = { metaphor: 0, personification: 0, imagery: 0, repetition: 0 };
  sections.forEach((section) => {
    const lines = section.content.split('\n');
    lines.forEach((line) => {
      if (line.includes('如') || line.includes('似') || line.includes('若') || line.includes('像')) devices.metaphor++;
      if (line.includes('听') || line.includes('看') || line.includes('说') || line.includes('低语') || line.includes('诉')) devices.personification++;
      if (line.match(/(雨|风|月|星|光|影|声|水|花|云|山|川|草|木|夜|寒|冷)/)) devices.imagery++;
    });
  });
  return devices;
}

function _analyzeEmotionalArc(sections) {
  const arc = [];
  let intensity = 0.3;
  sections.forEach((section, index) => {
    const type = section.type;
    if (type.includes('intro')) intensity = 0.3;
    else if (type.includes('verse')) intensity = 0.4;
    else if (type.includes('pre_chorus')) intensity = 0.5;
    else if (type.includes('chorus')) intensity = 0.7;
    else if (type.includes('bridge')) intensity = 0.5;
    else if (type.includes('final')) intensity = 0.8;
    else if (type.includes('outro') || type.includes('finale') || type.includes('ending')) intensity = 0.3;
    else intensity = Math.min(intensity + 0.1, 0.6);

    const prevIntensity = arc[index - 1] ? arc[index - 1].intensity : intensity;
    arc.push({
      section: type,
      intensity,
      progression: intensity > prevIntensity ? 'rising' : intensity < prevIntensity ? 'falling' : 'stable'
    });
  });
  return arc;
}

function _analyzeRhymeScheme(sections) {
  return sections.map((section) => {
    const lines = section.content.split('\n').filter((l) => l.trim());
    const endings = lines.map((line) => line.slice(-1));
    const mapping = {};
    let currentLetter = 'A';
    const scheme = endings.map((end) => {
      if (!mapping[end]) mapping[end] = currentLetter++;
      return mapping[end];
    });
    return { section: section.type, lines: lines.length, rhymeScheme: scheme.join('') };
  });
}

/* =========================================================================
 * 12. NETWORK / TIME / VARIATION LAYER CONFIGS
 * (Self-contained copies so this file has zero imports)
 * ========================================================================= */

const NETWORK_LAYER_CONFIG = {
  foundation: {
    templates: [
      '底层节拍: {bpm}bpm基础律动, 围绕{theme}主题构建稳定的{beat}节拍',
      '底层律动: {bpm}bpm三拍子节拍, {rhythm}节奏型, {style}基础风格'
    ],
    beats: ['4/4拍子基础节拍', 'waltz三拍子探戈节拍', '电子碎拍', '古典华尔兹3/4拍'],
    rhythms: ['稳定律动', '跳转节奏', '摇摆节奏', '断奏节奏'],
    styles: ['古典', '流行', '电子', '摇滚', '爵士', '民谣']
  },
  melody: {
    templates: [
      '旋律层: {melody_style}主旋律线条, 表达{emotion}情绪, 配合{elements}',
      '旋律层: 以{reference}为主旋律线条, 表达{feeling}情绪, 配合{classical_elements}'
    ],
    melodyStyles: ['跳转的主旋律', '流畅的旋律线条', '戏剧性的旋律起伏', '空灵的旋律'],
    elements: ['classical elements', 'surrounding element的空灵和穿透感', '电子合成器铺底', '弦乐伴奏'],
    references: ['Eason Chan孤獨探戈、黑擇明', '古典交响乐', '现代电子音乐', '中国古典民乐'],
    feelings: ['夜來獨行的lonely但not solitude', '人到中年的不安情绪', '彻骨的悲伤', '癫狂的笑泪']
  },
  expression: {
    templates: [
      '表现层: {vocals}与{harmony}, 深度诠释{emotion_theme}, 体现{style_feature}',
      '表现层: {sfx}深度诠释{expression_theme}, 体现{feature}'
    ],
    vocals: ['人声', '风声与雨水声脚步声', '多重人声叠录', '笑声与哭腔交织'],
    harmonies: ['和声层层叠叠递进', '合唱团烘托', '独唱与合唱交替', '男女混唱'],
    emotionThemes: ['人生壯志未酬之慨嘆', '黑夜的靜與人心中的動的互双影響', '彻骨的悲伤', '笑着流泪的癫狂'],
    styleFeatures: ['古風俠劍豪情特色', '獨宿人漸冷，夜來風雨淒特色', '暗黑浪漫', '精神分裂感'],
    sfx: ['風聲与雨水声腳步聲', '环境音效与人声交织', '教堂混响', '电影级Foley音效'],
    expressionThemes: ['黑夜的靜與人心中的動的情感', '情感层次分明', '情感爆发', '压抑与释放']
  },
  effects: {
    templates: [
      '效果层: {intro_effects}, 营造{atmosphere}, 整合{final_elements}',
      '效果层: {effects_list}, {mood_description}'
    ],
    introEffects: ['开場的7-8秒雨水風聲5-6秒腳步聲混响、4-5延迟漸入人聲獨白', '混响、延迟、调制效果', 'Shimmer Reverb星光混响', 'Di-Da Delay滴答延迟'],
    atmospheres: ['柔和孤獨氛围', '古風氛围', '暗黑压抑氛围', '教堂空旷声场'],
    finalElements: ['一个像極月圆彎刀中的紅月照天上的黑夜感入歌', 'surrounding elements的声音设计', '电影级音效设计', '精神分裂的听觉错觉'],
    effectsList: ['Church Acoustics教堂声场', 'Shimmer Reverb星光混响', 'Di-Da Delay滴答延迟', 'Rain SFX, Wind SFX, Footsteps SFX'],
    moodDescriptions: ['柔和孤獨的氛围弥漫', '暗黑压抑的情绪蔓延', '空灵治愈的声场展开', '戏剧化的张力铺陈']
  }
};

const DYNAMIC_LEVELS = {
  ppp: { name: '极弱', intensity: 0.1, description: '几乎无声，极度空灵' },
  pp: { name: '很弱', intensity: 0.2, description: '清冷，极简留白' },
  p: { name: '弱', intensity: 0.3, description: '柔和，内敛' },
  mp: { name: '中弱', intensity: 0.4, description: '轻微叙事，渐入' },
  mf: { name: '中强', intensity: 0.5, description: '平稳推进，张力渐起' },
  f: { name: '强', intensity: 0.7, description: '情感释放，高潮推进' },
  ff: { name: '很强', intensity: 0.85, description: '全曲最高潮，爆发' },
  fff: { name: '极强', intensity: 1.0, description: '终极毁灭感，撕裂' }
};

const TIME_SECTION_CONFIG = {
  intro: { durationRange: [0, 30], format: '[前奏·古 ({start}:{end})]', defaultDynamic: 'pp', defaultInstruments: ['古琴泛音独奏', '极简留白', 'Rain SFX', 'Wind SFX'] },
  verse: { durationRange: [30, 70], format: '[主歌·古 ({start}:{end})]', defaultDynamic: 'p→mp', defaultInstruments: ['古琴按音散音', '箫长音点缀', 'Cello backing'] },
  verse1: { durationRange: [30, 70], format: '[主歌一·古 ({start}:{end})]', defaultDynamic: 'p→mp', defaultInstruments: ['古琴按音散音', '箫长音点缀', 'Cello backing'] },
  interlude: { durationRange: [70, 95], format: '[间奏·今 ({start}:{end})]', defaultDynamic: 'p→mf', defaultInstruments: ['电子脉冲渐入', 'Synth Pad低沉嗡鸣', 'Bandoneon enters'] },
  verse2: { durationRange: [95, 130], format: '[主歌二·今 ({start}:{end})]', defaultDynamic: 'mp', defaultInstruments: ['钢琴高音单音', 'Synth Pad', 'Heavy Bass'] },
  pre_chorus: { durationRange: [110, 130], format: '[预副歌 ({start}:{end})]', defaultDynamic: 'mf', defaultInstruments: ['钢琴', '弦乐铺垫'] },
  chorus: { durationRange: [130, 180], format: '[副歌·古今叠★ ({start}:{end})]', defaultDynamic: 'f→ff', defaultInstruments: ['Full Classical Tango ensemble', 'String Orchestra', 'Layered Vocals'] },
  bridge: { durationRange: [180, 205], format: '[桥段·古 ({start}:{end})]', defaultDynamic: 'pp→ppp', defaultInstruments: ['古琴泛音', '风声采样', 'Cello Solo'] },
  finale: { durationRange: [205, 255], format: '[尾声·今 ({start}:{end})]', defaultDynamic: 'p→mf→pp', defaultInstruments: ['钢琴单音', '电子脉冲渐弱', '古琴最后一个按音'] },
  ending: { durationRange: [255, 270], format: '[终章·合 ({start}:{end})]', defaultDynamic: 'p→mf→pp', defaultInstruments: ['古琴单音三声', '弦乐团最后一个和弦', 'Choir极弱长音'] }
};

const INSTRUMENT_TIME_SPACE = {
  ancient: { name: '古时空·乐器', instruments: ['古琴（核心）', '箫', '中国大鼓（极轻）', '二胡', '琵琶', '笛子', '古筝'], description: '古典民族乐器，营造悠远空灵意境' },
  modern: { name: '今时空·乐器', instruments: ['合成器Pad', '电子脉冲', '钢琴', '弦乐团', '电吉他', 'Synth Bass', '电子鼓'], description: '现代电子乐器，营造都市迷茫感' },
  fusion: { name: '融合层·副歌', instruments: ['古琴+合成器交织', '弦乐团全编制', '合唱团', '中国大鼓+电子鼓叠层'], description: '古今融合，情感高潮爆发' }
};

const STYLE_VARIATIONS = {
  tango: {
    A: { name: '孤月探戈 (Lunar Waltz)', description: '【原味复刻：午夜剧院的低吟】', design: '以120BPM的传统探戈华尔兹（3/4拍）为底色，核心乐器采用班多纽手风琴与凄冷的大提琴交织', vocals: '贴近中低音男声，前段像是在空荡教堂里的绝望低语，随着旋律逐渐加入癫狂的笑音和哭腔', effects: '强烈的空间混响，精准植入雨水、风声和脚步声，并在副歌加入Shimmer Reverb星光混响', instruments: ['Bandoneon', 'Cello', 'Acoustic Bass', 'Piano'], sfx: ['Rain SFX', 'Wind SFX', 'Footsteps SFX'], language: '粤语' },
    B: { name: '红月重影 (Crimson Echoes)', description: '【情绪放大：疯癫的月下狂欢】', design: '把疯癫特质推向极致，在探戈骨架上注入哥特摇滚血液，保留三拍子律动但底鼓更重', vocals: '从压抑的呢喃直接撕裂成极具爆发力的悲鸣，副歌运用大量多重人声叠录', effects: '环境音效与尖锐电吉他泛音交织，Di-Da Delay营造华丽的毁灭感', instruments: ['Oppressive Strings', 'Electric Guitar Harmonics', 'Heavy Kick Drum', 'Distorted Guitar'], sfx: ['Heavy Rain SFX', 'Wind SFX', 'Footsteps SFX', 'Bell tolling'], language: '普通话' },
    C: { name: '冷雨长街 (Cold Street Illusions)', description: '【风格变奏：迷幻的冰冷都市】', design: '抽离部分古典乐器，换上冰冷下沉的合成器贝斯和Trip-Hop式碎拍鼓点，保持探戈摇曳感', vocals: '极其贴耳的演绎，副歌几乎用气声诉说，彻骨的悲伤在于死寂', effects: 'Shimmer Reverb开到最大，脚步声和雨声被处理成编曲律动的一部分', instruments: ['Synth Bass', 'Trip-Hop Drums', 'Ambient Synth', 'Minimal Piano'], sfx: ['Rain SFX', 'Urban Footsteps', 'City Ambience'], language: '普通话' }
  },
  chinese_classical: {
    A: { name: '古时空·穿越', description: '【古典韵味：唐宋诗词古风】', design: '采用唐清诗词古风式，叠字和弦推进，融合古典乐器与现代编曲', vocals: '女声清冷叙事，情感层次分明，从少年癫狂到中年迷茫再到顿悟看破', effects: '古琴泛音独奏，极简留白，大型超空旷混响声场', instruments: ['古琴（核心）', '箫', '中国大鼓', '二胡', '琵琶'], sfx: ['Wind SFX', 'Nature Ambience'], language: '粤语/普通话混唱' },
    B: { name: '今时空·都市', description: '【现代变奏：都市迷惘】', design: '合成器Pad、电子脉冲、钢琴、弦乐团，营造都市迷茫感', vocals: '男声叙事，情感6级，略带疲惫，贴近现代都市人的心境', effects: '电子脉冲渐入，心跳节奏，Sub Bass深沉', instruments: ['Synth Pad', 'Electronic Pulse', 'Piano', 'String Orchestra'], sfx: ['Urban Ambience', 'Electronic Noise'], language: '普通话' },
    C: { name: '古今叠·融合', description: '【时空交响：古今对话】', design: '古琴散音轮奏+合成器大气弦乐Pad+弦乐团全编制', vocals: '女声（古）+男声（今）叠唱，合唱团烘托', effects: '中国大鼓沉稳+电子鼓叠层，Shimmer Reverb', instruments: ['古琴', 'Synth Strings', 'Chinese Drums', 'Electronic Drums', 'String Orchestra', 'Choir'], sfx: ['Wind SFX', 'Electronic Ambience'], language: '男女混唱' }
  }
};

/* =========================================================================
 * 13. NETWORK / TIME / VARIATION FORMATTERS
 * ========================================================================= */

function _formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function _translateTheme(theme) {
  const translations = {
    love: '爱情', loneliness: '孤独', sadness: '悲伤', dreams: '梦想', memory: '回忆',
    nature: '自然', friendship: '友情', success: '成功', hope: '希望', life: '人生',
    lunatic: '疯癫', tango: '探戈', heartbreak: '心碎', healing: '治愈', time_travel: '穿越',
    epic_journey: '史诗旅程', dark_mystery: '暗黑神秘', romantic_night: '浪漫之夜',
    nostalgic_memory: '怀旧回忆', energetic_party: '活力派对', dreamy_fantasy: '梦幻幻想',
    modern_city: '现代都市', ancient_legend: '古老传说', indie_story: '独立故事',
    folk_tale: '民间故事', summer_vibes: '夏日氛围', winter_solitude: '冬日孤寂',
    spring_awakening: '春日觉醒', autumn_melancholy: '秋日忧郁', ocean_dreams: '海洋之梦',
    dark: '暗黑', epic: '史诗', romantic: '浪漫', nostalgic: '怀旧', energetic: '活力',
    dreamy: '梦幻', modern: '现代', ghost_love: '人鬼情未了', supernatural: '灵异超自然'
  };
  return translations[theme] || theme;
}

function _buildFoundationLayer(bpm, theme, params) {
  const template = NETWORK_LAYER_CONFIG.foundation.templates[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.foundation.templates.length)];
  return template
    .replace('{bpm}', bpm)
    .replace('{theme}', _translateTheme(theme))
    .replace('{beat}', _pickRandom(NETWORK_LAYER_CONFIG.foundation.beats))
    .replace('{rhythm}', _pickRandom(NETWORK_LAYER_CONFIG.foundation.rhythms))
    .replace('{style}', _pickRandom(NETWORK_LAYER_CONFIG.foundation.styles));
}

function _buildMelodyLayer(theme, params) {
  const template = NETWORK_LAYER_CONFIG.melody.templates[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.melody.templates.length)];
  return template
    .replace('{melody_style}', _pickRandom(NETWORK_LAYER_CONFIG.melody.melodyStyles))
    .replace('{reference}', _pickRandom(NETWORK_LAYER_CONFIG.melody.references))
    .replace('{feeling}', _pickRandom(NETWORK_LAYER_CONFIG.melody.feelings))
    .replace('{classical_elements}', _pickRandom(NETWORK_LAYER_CONFIG.melody.elements))
    .replace('{emotion}', _pickRandom(NETWORK_LAYER_CONFIG.melody.feelings))
    .replace('{elements}', _pickRandom(NETWORK_LAYER_CONFIG.melody.elements));
}

function _buildExpressionLayer(theme, params) {
  const template = NETWORK_LAYER_CONFIG.expression.templates[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.expression.templates.length)];
  return template
    .replace('{vocals}', _pickRandom(NETWORK_LAYER_CONFIG.expression.vocals))
    .replace('{harmony}', _pickRandom(NETWORK_LAYER_CONFIG.expression.harmonies))
    .replace('{emotion_theme}', _pickRandom(NETWORK_LAYER_CONFIG.expression.emotionThemes))
    .replace('{style_feature}', _pickRandom(NETWORK_LAYER_CONFIG.expression.styleFeatures))
    .replace('{sfx}', _pickRandom(NETWORK_LAYER_CONFIG.expression.sfx))
    .replace('{expression_theme}', _pickRandom(NETWORK_LAYER_CONFIG.expression.expressionThemes))
    .replace('{feature}', _pickRandom(NETWORK_LAYER_CONFIG.expression.styleFeatures));
}

function _buildEffectsLayer(params) {
  const template = NETWORK_LAYER_CONFIG.effects.templates[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.effects.templates.length)];
  return template
    .replace('{intro_effects}', _pickRandom(NETWORK_LAYER_CONFIG.effects.introEffects))
    .replace('{atmosphere}', _pickRandom(NETWORK_LAYER_CONFIG.effects.atmospheres))
    .replace('{final_elements}', _pickRandom(NETWORK_LAYER_CONFIG.effects.finalElements))
    .replace('{effects_list}', _pickRandom(NETWORK_LAYER_CONFIG.effects.effectsList))
    .replace('{mood_description}', _pickRandom(NETWORK_LAYER_CONFIG.effects.moodDescriptions));
}

function _getDynamicForSection(sectionType, index, totalSections) {
  if (sectionType.includes('intro')) return 'pp';
  if (sectionType.includes('verse')) return index / totalSections < 0.3 ? 'p' : 'mp';
  if (sectionType.includes('pre_chorus')) return 'mf';
  if (sectionType.includes('chorus')) return index / totalSections < 0.7 ? 'f' : 'ff';
  if (sectionType.includes('bridge')) return 'pp→ppp';
  if (sectionType.includes('finale') || sectionType.includes('final') || sectionType.includes('ending')) return 'p→mf→pp';
  if (sectionType.includes('outro')) return 'pp';
  return 'mp';
}

function _getInstrumentsForSection(sectionType, params) {
  if (sectionType.includes('ancient')) return INSTRUMENT_TIME_SPACE.ancient.instruments.slice(0, 4);
  if (sectionType.includes('modern')) return INSTRUMENT_TIME_SPACE.modern.instruments.slice(0, 4);
  if (sectionType.includes('fusion') || sectionType.includes('chorus')) return INSTRUMENT_TIME_SPACE.fusion.instruments;
  const configKey = sectionType.replace(/[0-9]/g, '');
  const cfg = TIME_SECTION_CONFIG[configKey];
  return (cfg && cfg.defaultInstruments) || ['Piano', 'Strings'];
}

function _getTimeSpaceForSection(sectionType) {
  if (sectionType.includes('ancient')) return INSTRUMENT_TIME_SPACE.ancient;
  if (sectionType.includes('modern')) return INSTRUMENT_TIME_SPACE.modern;
  return INSTRUMENT_TIME_SPACE.fusion;
}

function _formatNetworkLayerOutput(baseResult, foundation, melody, expression, effects) {
  return `[LAYER: FOUNDATION]\n${foundation}\n\n[LAYER: MELODY]\n${melody}\n\n[LAYER: EXPRESSION]\n${expression}\n\n[LAYER: EFFECTS]\n${effects}\n\n${baseResult.fullText}`;
}

function _formatTimeSectionOutput(sections) {
  return sections.map((s) => {
    const dynamicDesc = s.dynamicLevel ? ` [动态: ${s.dynamicLevel.name}]` : '';
    const instrumentsStr = s.instruments ? `\n[乐器: ${s.instruments.join(', ')}]` : '';
    const timeSpaceStr = s.timeSpace ? `\n[${s.timeSpace.name}]` : '';
    return `${s.timeSection}${dynamicDesc}${instrumentsStr}${timeSpaceStr}\n${s.content}`;
  }).join('\n\n');
}

function _formatVariationOutput(baseResult, variation) {
  const header = `[标题：${variation.name}]\n\n${variation.description}\n\n核心设计：${variation.design}\n人声表现：${variation.vocals}\n效果重点：${variation.effects}\n乐器：${variation.instruments.join(', ')}\n语言：${variation.language}\n\n`;
  return header + baseResult.fullText;
}

function _formatMeloOutput(baseResult, meloCommand) {
  const sections = meloCommand.sections.map((s) => {
    const directives = s.aiDirectives.map(d => `（AI执行指令：${d}）`).join('\n');
    const sectionContent = baseResult.sections.find(sec =>
      sec.type.toLowerCase().includes(s.type.toLowerCase().replace(/[0-9]/g, ''))
    );
    const lyrics = sectionContent ? sectionContent.content : '';
    return `[${s.type.toUpperCase()} | 情绪：${s.emotion} | 力度：${s.dynamics} | 演唱：${s.vocal} | 时长：${s.duration}]
${directives}
${lyrics}`;
  }).join('\n\n');

  const header = `【MELO 生成指令】

🎵 标题：${meloCommand.title}
🎼 风格：${meloCommand.style}
⏱️ BPM：${meloCommand.bpm}
🎹 调性：${meloCommand.key}

🎯 整体关键词：
${meloCommand.overallKeywords}

---

【分层结构】
[LAYER: FOUNDATION]
底层节拍：${meloCommand.bpm} 基础律动，围绕主题构建稳定节拍

[LAYER: MELODY]
旋律层：以核心乐器表达主题情绪，配合和声与织体

[LAYER: EXPRESSION]
表现层：人声与和声叠加，深度诠释情感内核

[LAYER: EFFECTS]
效果层：混响、延迟、调制效果，营造氛围

---

【段落详解】
${sections}

---

💡 风格：${meloCommand.style}
`;

  return header;
}

function _buildInstrumentTimeline(sections) {
  return sections.map((s) => ({
    time: _formatTime(s.startTime),
    instruments: s.instruments,
    timeSpace: (s.timeSpace && s.timeSpace.name) || 'fusion'
  }));
}

/* =========================================================================
 * 14. BASIC DYNAMIC GENERATION (procedural core)
 * ========================================================================= */

function _generateDynamicBasic(genre, theme, themeBank, styleConfig, complexity) {
  const structure = STRUCTURES[genre] || STRUCTURES.pop;
  const baseRhyme = styleConfig.rhymePreference || 'ABAB';
  const globalUsedWords = new Set();

  // Section-type-specific rhyme and line count variations
  const sectionConfig = {
    intro: { rhyme: 'ABC', lines: 2 },
    pre_chorus: { rhyme: 'AAB', lines: 3 },
    verse: { rhyme: 'ABC', lines: 3 },
    chorus: { rhyme: 'AAB', lines: 4 },
    bridge: { rhyme: 'ABA', lines: 3 },
    breakdown: { rhyme: 'ABC', lines: 2 },
    interlude: { rhyme: 'AAA', lines: 2 },
    outro: { rhyme: 'ABC', lines: 2 },
    hook: { rhyme: 'AAB', lines: 4 },
    drop: { rhyme: 'ABAB', lines: 4 },
    final_chorus: { rhyme: 'AAB', lines: 5 }
  };

  const _resolveSectionConfig = (sectionType, idx) => {
    const normalized = _normalizeSectionType(sectionType);
    const base = sectionConfig[normalized] || { rhyme: baseRhyme, lines: 3 };
    // Slight variation based on section index to avoid repetition
    const variants = ['ABC', 'AAB', 'ABA', 'ABAB', 'AABB'];
    const alternateRhyme = variants[idx % variants.length];
    return {
      rhyme: idx === 0 ? base.rhyme : (idx % 3 === 0 ? alternateRhyme : base.rhyme),
      lines: idx === 0 ? base.lines : (Math.max(2, Math.min(4, base.lines + (idx % 2 === 0 ? 0 : 1))))
    };
  };

  const sections = structure.map((sectionType, idx) => {
    const normalized = _normalizeSectionType(sectionType);
    const cfg = _resolveSectionConfig(sectionType, idx);
    const sectionResult = generateSection(normalized, themeBank, styleConfig, cfg.lines, cfg.rhyme, globalUsedWords);
    const lines = sectionResult.lines || sectionResult;
    return {
      type: sectionType,
      content: lines.join('\n'),
      lines,
      productionMetadata: sectionResult.productionMetadata || {},
      rhymeScheme: sectionResult.rhymeScheme || cfg.rhyme,
      lineCount: cfg.lines
    };
  });

  return {
    genre,
    theme,
    structure,
    sections,
    fullText: sections.map((s) => `[${s.type.toUpperCase()}]\n${s.content}`).join('\n\n'),
    generatedAt: new Date().toISOString(),
    productionMetadata: {
      instrumentation: styleConfig.instrumentation || [],
      dynamics: styleConfig.dynamics || [],
      vocal: styleConfig.vocal || {},
      effects: styleConfig.effects || [],
      sfx: styleConfig.sfx || []
    },
    meta: {
      engine: 'dynamic',
      sectionCount: sections.length,
      totalLines: sections.reduce((sum, s) => sum + (s.lineCount || s.content.split('\n').filter((l) => l.trim()).length), 0),
      literaryAnalysis: _analyzeLiteraryDevices(sections),
      productionMetadata: {
        instrumentation: styleConfig.instrumentation || [],
        dynamics: styleConfig.dynamics || [],
        vocal: styleConfig.vocal || {},
        effects: styleConfig.effects || [],
        sfx: styleConfig.sfx || []
      }
    }
  };
}

/* =========================================================================
 * 15. FULL GENERATION FUNCTION (matches generateLyrics() format)
 * ========================================================================= */

/**
 * Generate fully procedural lyrics.
 *
 * @param {object} params
 * @param {string} params.genre - musical genre / style key
 * @param {string} params.theme - theme key
 * @param {string} params.method - basic|network|time|variation
 * @param {number} params.complexity - 1-10
 * @param {string} params.variation - A|B|C (for variation method)
 * @param {number} params.bpm - beats per minute (network method)
 * @param {number} params.duration - total seconds (time method)
 * @param {Array<string>} params.mixThemes - themes to blend
 * @param {Array<string>} params.mixStyles - styles to blend
 * @param {Array<number>} params.themeWeights - weights for mixThemes
 * @param {Array<number>} params.styleWeights - weights for mixStyles
 * @returns {object} result matching generateLyrics() format
 */
export function generateDynamicLyrics(params) {
  const {
    genre = 'pop',
    theme = 'love',
    method = 'basic',
    bpm = 120,
    duration = 270,
    complexity = 5,
    variation = 'A',
    mixThemes = null,
    mixStyles = null,
    themeWeights = null,
    styleWeights = null,
    visualContext = null,
    vocalGender = null
  } = params || {};

  // ---- Resolve theme bank (single or blended) ----
  let themeBank;
  let effectiveTheme = theme;
  if (mixThemes && mixThemes.length > 0) {
    const banks = mixThemes.map((t) => getThemeBank(t));
    const weights = themeWeights && themeWeights.length === banks.length ? themeWeights : banks.map(() => 1);
    themeBank = blendBanks(banks, weights);
    effectiveTheme = 'mix:' + mixThemes.join('+');
  } else {
    themeBank = getThemeBank(theme);
  }

  // ---- Blend visual context bank if provided ----
  if (visualContext) {
    const visualBank = createVisualBank(visualContext);
    if (visualBank) {
      themeBank = blendBanks([themeBank, visualBank], [0.35, 0.65]);
      effectiveTheme = 'visual:' + (visualContext.sceneId || theme);
    }
  }

  // ---- Resolve style config (single or blended) ----
  let styleConfig;
  let effectiveGenre = genre;
  if (mixStyles && mixStyles.length > 0) {
    const styleConfigs = mixStyles.map((s) => _getStyleConfig(s));
    const mergedBias = [];
    const mergedPatterns = [];
    const allInstrumentation = [];
    const allDynamics = [];
    const allEffects = [];
    const allSfx = [];
    styleConfigs.forEach((sc) => {
      if (sc.vocabularyBias) mergedBias.push(...sc.vocabularyBias);
      if (sc.sentencePatterns) mergedPatterns.push(...sc.sentencePatterns);
      if (sc.instrumentation) allInstrumentation.push(...sc.instrumentation);
      if (sc.dynamics) allDynamics.push(...sc.dynamics);
      if (sc.effects) allEffects.push(...sc.effects);
      if (sc.sfx) allSfx.push(...sc.sfx);
    });
    const avgMin = Math.round(styleConfigs.reduce((s, sc) => s + sc.lineLength[0], 0) / styleConfigs.length);
    const avgMax = Math.round(styleConfigs.reduce((s, sc) => s + sc.lineLength[1], 0) / styleConfigs.length);
    styleConfig = {
      vocabularyBias: [...new Set(mergedBias)],
      sentencePatterns: [...new Set(mergedPatterns)],
      rhymePreference: styleConfigs[0].rhymePreference,
      lineLength: [avgMin, avgMax],
      tone: styleConfigs[0].tone,
      instrumentation: [...new Set(allInstrumentation)].slice(0, 4),
      dynamics: [...new Set(allDynamics)].slice(0, 3),
      vocal: styleConfigs[0].vocal || {},
      effects: [...new Set(allEffects)].slice(0, 3),
      sfx: [...new Set(allSfx)].slice(0, 3)
    };
    effectiveGenre = 'mix:' + mixStyles.join('+');
  } else {
    styleConfig = JSON.parse(JSON.stringify(_getStyleConfig(genre)));
  }

  // ---- Override vocal gender from visual analysis if available ----
  if (visualContext && visualContext.vocalGender) {
    const originalVocal = styleConfig.vocal || {};
    styleConfig.vocal = {
      ...originalVocal,
      gender: visualContext.vocalGender,
      _visualOverride: true,
      _visualConfidence: visualContext.vocalConfidence || 0
    };
  }

  // ---- Allow explicit vocal gender override from params ----
  if (params.vocalGender) {
    const originalVocal = styleConfig.vocal || {};
    styleConfig.vocal = {
      ...originalVocal,
      gender: params.vocalGender,
      _explicitOverride: true
    };
  }

  // ---- Dispatch by method ----
  if (method === 'network') {
    const baseResult = _generateDynamicBasic(genre, theme, themeBank, styleConfig, complexity);
    const foundation = _buildFoundationLayer(bpm, theme, params);
    const melody = _buildMelodyLayer(theme, params);
    const expression = _buildExpressionLayer(theme, params);
    const effects = _buildEffectsLayer(params);
    const networkResult = {
      ...baseResult,
      networkLayer: { foundation, melody, expression, effects },
      fullCommand: _formatNetworkLayerOutput(baseResult, foundation, melody, expression, effects),
      generatedAt: new Date().toISOString()
    };
    return _normalizeResult(networkResult, 'network', params);
  }

  if (method === 'melo') {
    const baseResult = _generateDynamicBasic(genre, theme, themeBank, styleConfig, complexity);
    const meloCommand = generateMeloCommand({
      genre,
      theme,
      bpm,
      key: params.key || 'C',
      duration,
      language: params.language || 'zh',
      title: params.title || ''
    });
    const matchedExample = findMatchingExample(theme, genre);
    const meloResult = {
      ...baseResult,
      meloCommand,
      referenceExample: matchedExample.length > 0 ? matchedExample[0] : null,
      fullCommand: _formatMeloOutput(baseResult, meloCommand),
      generatedAt: new Date().toISOString()
    };
    return _normalizeResult(meloResult, 'melo', params);
  }

  if (method === 'time') {
    const structure = STRUCTURES[genre] || STRUCTURES.pop;
    const sections = [];
    let currentTime = 0;
    const globalUsedWords = new Set();

    structure.forEach((sectionType, index) => {
      const normalizedType = _normalizeSectionType(sectionType);
      const configKey = sectionType.replace(/[0-9]/g, '');
      const timeConfig = TIME_SECTION_CONFIG[configKey] || TIME_SECTION_CONFIG.verse1;
      const baseDuration = timeConfig.durationRange[1] - timeConfig.durationRange[0];
      const durationSec = Math.floor((baseDuration * duration) / 270);

      const startTime = _formatTime(currentTime);
      const endTime = _formatTime(currentTime + durationSec);

      // Use section-type-specific rhyme and line count
      const sectionCfg = {
        intro: { rhyme: 'ABC', lines: 2 }, verse: { rhyme: 'ABC', lines: 3 },
        pre_chorus: { rhyme: 'AAB', lines: 3 }, chorus: { rhyme: 'AAB', lines: 4 },
        bridge: { rhyme: 'ABA', lines: 3 }, outro: { rhyme: 'ABC', lines: 2 }
      };
      const timeSectionDefault = sectionCfg[normalizedType] || { rhyme: styleConfig.rhymePreference || 'ABAB', lines: 3 };

      const sectionResult = generateSection(normalizedType, themeBank, styleConfig, timeSectionDefault.lines, timeSectionDefault.rhyme, globalUsedWords);
      const lines = sectionResult.lines || sectionResult;

      const dynamic = _getDynamicForSection(sectionType, index, structure.length);
      const instruments = _getInstrumentsForSection(sectionType, params);
      const timeSpace = _getTimeSpaceForSection(sectionType);

      sections.push({
        type: sectionType,
        timeSection: timeConfig.format.replace('{start}', startTime).replace('{end}', endTime),
        startTime: currentTime,
        endTime: currentTime + durationSec,
        duration: durationSec,
        dynamic,
        dynamicLevel: DYNAMIC_LEVELS[dynamic.split('→')[0]] || DYNAMIC_LEVELS.mp,
        instruments,
        timeSpace,
        content: lines.join('\n'),
        lines,
        productionMetadata: sectionResult.productionMetadata || {}
      });

      currentTime += durationSec;
    });

    const timeResult = {
      genre: effectiveGenre,
      theme: effectiveTheme,
      totalDuration: duration,
      structure,
      sections,
      fullText: _formatTimeSectionOutput(sections),
      generatedAt: new Date().toISOString(),
      productionMetadata: {
        instrumentation: styleConfig.instrumentation || [],
        dynamics: styleConfig.dynamics || [],
        vocal: styleConfig.vocal || {},
        effects: styleConfig.effects || [],
        sfx: styleConfig.sfx || []
      },
      meta: {
        engine: 'dynamic',
        literaryAnalysis: _analyzeLiteraryDevices(sections),
        emotionalArc: _analyzeEmotionalArc(sections),
        rhymeAnalysis: _analyzeRhymeScheme(sections),
        instrumentTimeline: _buildInstrumentTimeline(sections),
        productionMetadata: {
          instrumentation: styleConfig.instrumentation || [],
          dynamics: styleConfig.dynamics || [],
          vocal: styleConfig.vocal || {},
          effects: styleConfig.effects || [],
          sfx: styleConfig.sfx || []
        }
      }
    };
    return _normalizeResult(timeResult, 'time', params);
  }

  if (method === 'variation') {
    const variations = STYLE_VARIATIONS[genre] || STYLE_VARIATIONS.tango;
    const variationConfig = variations[variation] || variations.A;
    const baseResult = _generateDynamicBasic(genre, theme, themeBank, styleConfig, complexity);
    const variationResult = {
      ...baseResult,
      variation: {
        key: variation,
        name: variationConfig.name,
        description: variationConfig.description,
        design: variationConfig.design,
        vocals: variationConfig.vocals,
        effects: variationConfig.effects,
        instruments: variationConfig.instruments,
        sfx: variationConfig.sfx,
        language: variationConfig.language
      },
      fullText: _formatVariationOutput(baseResult, variationConfig),
      generatedAt: new Date().toISOString()
    };
    return _normalizeResult(variationResult, 'variation', params);
  }

  // ---- basic (default) ----
  const base = _generateDynamicBasic(genre, theme, themeBank, styleConfig, complexity);
  if (mixThemes || mixStyles) {
    base.theme = effectiveTheme;
    base.genre = effectiveGenre;
    base.meta.mixed = true;
    if (mixThemes) base.meta.mixThemes = mixThemes;
    if (mixStyles) base.meta.mixStyles = mixStyles;
  }
  return _normalizeResult(base, method, params);
}

/**
 * Normalize result to ensure consistent output across all methods:
 * - fullText: commands + lyrics combined (for "copy all")
 * - fullCommand: production commands only (for "commands only" view)
 * - lyricsText: lyrics with section markers (for "lyrics only" view)
 */
function _normalizeResult(result, method, params) {
  const production = result.productionMetadata || (result.meta && result.meta.productionMetadata) || {};
  const vocal = production.vocal || {};
  const genre = result.genre || (params && params.genre) || 'pop';
  const theme = result.theme || (params && params.theme) || 'love';

  // Build lyricsText (lyrics with section markers)
  let lyricsText = result.fullText || '';
  if (result.sections && result.sections.length > 0) {
    lyricsText = result.sections.map((s) => `[${s.type.toUpperCase()}]\n${s.content}`).join('\n\n');
  }

  // Build fullCommand based on method
  let fullCommand = result.fullCommand || '';
  if (!fullCommand) {
    const instrList = production.instrumentation && production.instrumentation.length > 0
      ? production.instrumentation.join(', ')
      : '默认配置';
    const dynList = production.dynamics && production.dynamics.length > 0
      ? production.dynamics.join(', ')
      : 'mf (中强)';
    const effList = production.effects && production.effects.length > 0
      ? production.effects.join(', ')
      : '混响、延迟';
    const sfxList = production.sfx && production.sfx.length > 0
      ? production.sfx.join(', ')
      : '无';

    if (method === 'network') {
      fullCommand = result.fullCommand || '';
    } else if (method === 'melo') {
      fullCommand = result.fullCommand || '';
    } else if (method === 'time') {
      fullCommand = `【时间轴制作指令】

🎵 风格：${genre}
🎯 主题：${theme}
⏱️ 总时长：${result.totalDuration || (params && params.duration) || 270}秒

---

【制作参数】
🎹 乐器配置：${instrList}
🎙️ 人声设定：
  - 性别：${vocal.gender || '默认'}
  - 情感等级：${vocal.emotionLevel || '情感5级'}
  - 演唱方式：${vocal.tone || '叙事'}
  - 语言：${vocal.dialect || '普通话'}
🎚️ 动态控制：${dynList}
✨ 效果处理：${effList}
🎧 音效元素：${sfxList}

---

【时间轴段落】
${result.sections ? result.sections.map((s, i) => {
        const time = s.timeSection || `${s.startTime || 0}s - ${s.endTime || 0}s`;
        return `${i + 1}. [${s.type.toUpperCase()}] ${time}
   力度：${s.dynamic || 'mf'}
   乐器：${s.instruments ? (Array.isArray(s.instruments) ? s.instruments.join(', ') : s.instruments) : '默认'}
   时空：${s.timeSpace || '现代'}`;
      }).join('\n') : ''}

---

💡 提示：各段落之间注意情绪过渡，保持整体的叙事连贯性。`;
    } else if (method === 'variation') {
      const v = result.variation || {};
      fullCommand = `【变奏制作指令 - ${v.name || '变体 ' + (params && params.variation) || 'A'}】

🎵 风格：${genre}
🎯 主题：${theme}
🎭 变奏：${v.name || '原味复刻'}

---

【变奏设计】
📝 设计理念：${v.description || '保持原曲精髓，加入独特风格元素'}
🎤 人声处理：${v.vocals || '标准人声'}
🎸 乐器编配：${v.instruments ? (Array.isArray(v.instruments) ? v.instruments.join(', ') : v.instruments) : '标准配置'}
✨ 效果处理：${v.effects ? (Array.isArray(v.effects) ? v.effects.join(', ') : v.effects) : '标准效果'}
🔊 音效元素：${v.sfx ? (Array.isArray(v.sfx) ? v.sfx.join(', ') : v.sfx) : '无'}
🌐 语言风格：${v.language || '普通话'}

---

【制作参数】
🎹 乐器配置：${instrList}
🎚️ 动态控制：${dynList}
✨ 效果处理：${effList}

---

💡 提示：变奏版本应在保持原曲辨识度的基础上，展现出独特的风格特点。`;
    } else {
      // basic / fsm method
      fullCommand = `【FSM状态机制作指令】

🎵 风格：${genre}
🎯 主题：${theme}
⚙️ 生成方法：FSM编程 (Finite State Machine)

---

【状态机结构】
${result.sections ? result.sections.map((s, i) => {
        return `STATE_${i}: ${s.type.toUpperCase()}
  ├─ 韵式：${s.rhymeScheme || 'ABAB'}
  ├─ 行数：${s.lineCount || (s.content ? s.content.split('\n').filter(l => l.trim()).length : 0)}
  └─ 制作元数据：${s.productionMetadata ? Object.keys(s.productionMetadata).length + '项' : '默认'}`;
      }).join('\n\n') : ''}

---

【制作参数】
🎹 乐器配置：${instrList}
🎙️ 人声设定：
  - 性别：${vocal.gender || '默认'}
  - 情感等级：${vocal.emotionLevel || '情感5级'}
  - 演唱方式：${vocal.tone || '叙事'}
  - 语言：${vocal.dialect || '普通话'}
🎚️ 动态控制：${dynList}
✨ 效果处理：${effList}
🎧 音效元素：${sfxList}

---

💡 提示：状态机驱动的生成确保了结构的严谨性和情感的递进层次。`;
    }
  }

  // Build fullText = fullCommand + lyrics
  const fullText = `${fullCommand}\n\n【歌词内容】\n\n${lyricsText}`;

  return {
    ...result,
    fullCommand,
    lyricsText,
    fullText
  };
}

/* =========================================================================
 * 16. ACCESSORS
 * ========================================================================= */

export function getDynamicThemes() {
  return Object.keys(THEME_BANKS);
}

export function getDynamicStyles() {
  return Object.keys(STYLE_MODIFIERS);
}

export function getDynamicGenres() {
  return Object.keys(STRUCTURES);
}

export function getMusicalNotations() {
  return {
    timeSignatures: TIME_SIGNATURES,
    tempoMarkings: TEMPO_MARKINGS,
    articulationMarks: ARTICULATION_MARKS,
    expressionMarks: EXPRESSION_MARKS,
    keySignatures: KEY_SIGNATURES,
    chordProgressions: CHORD_PROGRESSIONS,
    fsmTriggers: FSM_TRIGGERS,
    musicalTerms: MUSICAL_TERMS
  };
}

/* =========================================================================
 * 17. OUTPUT FORMATTERS
 * ========================================================================= */

export function formatSunoOutput(result) {
  const lyrics = result.sections.map(section => {
    let content;
    if (section.content) {
      content = section.content;
    } else if (section.lines) {
      content = section.lines.join('\n');
    } else {
      content = '';
    }
    return `[${section.type.toUpperCase()}]
${content}`;
  }).join('\n\n');

  const production = result.productionMetadata || (result.meta && result.meta.productionMetadata) || {};
  const vocal = production.vocal || {};

  return `【Suno风格音乐生成指令】

🎵 风格：${result.genre || '流行'}
🎯 主题：${result.theme || '爱情'}

---

【歌词】
${lyrics}

---

【制作参数】

🎹 乐器配置：${production.instrumentation ? production.instrumentation.join(', ') : '默认'}
🎙️ 人声设定：
  - 性别：${vocal.gender || '默认'}
  - 情感等级：${vocal.emotionLevel || '情感5级'}
  - 演唱方式：${vocal.tone || '叙事'}
  - 语言：${vocal.dialect || '普通话'}
  - 麦克风技术：${vocal.micTechnique || '贴近麦克风'}
  - 人声叠加：${vocal.layering || '单层人声'}

🎚️ 动态控制：${production.dynamics ? production.dynamics.join(', ') : 'mf'}
✨ 效果处理：${production.effects ? production.effects.join(', ') : '混响'}
🎧 音效元素：${production.sfx && production.sfx.length > 0 ? production.sfx.join(', ') : '无'}

---

💡 提示：生成时请保持歌词的韵律感和情感表达，注意段落之间的过渡。`;
}

export function formatMuseOutput(result) {
  const sections = result.sections.map(section => {
    let lines;
    if (section.content) {
      lines = section.content.split('\n').filter(l => l.trim());
    } else if (section.lines) {
      lines = section.lines;
    } else {
      lines = [];
    }

    const lineEntries = lines.map((line, idx) => `      "${line.replace(/"/g, '\\"')}"`).join(',\n');

    return `    {
      "type": "${section.type}",
      "lines": [
${lineEntries}
      ]
    }`;
  }).join(',\n');

  const production = result.productionMetadata || (result.meta && result.meta.productionMetadata) || {};
  const vocal = production.vocal || {};

  return JSON.stringify({
    version: '1.0',
    metadata: {
      genre: result.genre || 'pop',
      theme: result.theme || 'love',
      generatedAt: result.generatedAt || new Date().toISOString(),
      engine: 'dynamicLyricsEngine'
    },
    production: {
      instrumentation: production.instrumentation || [],
      dynamics: production.dynamics || [],
      vocal: {
        gender: vocal.gender || '男声',
        emotionLevel: vocal.emotionLevel || '情感5级',
        tone: vocal.tone || '叙事',
        dialect: vocal.dialect || '普通话',
        micTechnique: vocal.micTechnique || '贴近麦克风',
        layering: vocal.layering || '单层人声'
      },
      effects: production.effects || [],
      sfx: production.sfx || []
    },
    lyrics: {
      structure: result.structure || [],
      sections: JSON.parse(`[${sections}]`)
    },
    analysis: {
      totalLines: result.meta ? result.meta.totalLines : 0,
      sectionCount: result.meta ? result.meta.sectionCount : 0
    }
  }, null, 2);
}

/* =========================================================================
 * 18. MUSICAL NOTATION GENERATOR
 * ========================================================================= */

function _getTempoByGenre(genre) {
  const genreTempos = {
    pop: ['moderato', 'allegretto'],
    rock: ['allegro', 'vivace'],
    ballad: ['andante', 'adagio'],
    chinese_classical: ['andante', 'moderato'],
    tango: ['andante', 'moderato'],
    electronic: ['allegretto', 'allegro'],
    hip_hop: ['moderato', 'allegretto'],
    jazz: ['andante', 'moderato'],
    classical: ['andante', 'moderato'],
    love_song: ['andante', 'moderato'],
    heartbreaking: ['adagio', 'lento'],
    healing: ['andante', 'moderato'],
    epic: ['moderato', 'allegretto'],
    dark: ['adagio', 'andante'],
    romantic: ['andante', 'moderato'],
    nostalgic: ['andante', 'moderato'],
    energetic: ['allegro', 'vivace'],
    dreamy: ['andante', 'moderato'],
    ancient: ['adagio', 'andante'],
    indie: ['andante', 'moderato'],
    folk: ['andante', 'moderato'],
    kpop: ['allegretto', 'allegro'],
    reggae: ['moderato', 'allegretto'],
    ambient: ['largo', 'adagio'],
    gothic_rock: ['allegro', 'vivace'],
    ancient_modern: ['andante', 'moderato']
  };
  const options = genreTempos[genre] || genreTempos.pop;
  return _pickRandom(options);
}

function _getTimeSignatureByGenre(genre) {
  const genreSignatures = {
    pop: ['4/4'],
    rock: ['4/4'],
    ballad: ['4/4', '6/8'],
    chinese_classical: ['4/4', '3/4'],
    tango: ['4/4', '3/4'],
    electronic: ['4/4'],
    hip_hop: ['4/4'],
    jazz: ['4/4', '6/8'],
    classical: ['4/4', '3/4', '6/8'],
    love_song: ['4/4'],
    heartbreaking: ['4/4', '6/8'],
    healing: ['4/4', '6/8'],
    epic: ['4/4', '3/4'],
    dark: ['4/4', '6/8'],
    romantic: ['4/4', '3/4'],
    nostalgic: ['4/4', '6/8'],
    energetic: ['4/4'],
    dreamy: ['4/4', '6/8'],
    ancient: ['4/4', '3/4'],
    indie: ['4/4'],
    folk: ['4/4', '3/4'],
    kpop: ['4/4'],
    reggae: ['4/4'],
    ambient: ['4/4', '6/8'],
    gothic_rock: ['4/4'],
    ancient_modern: ['4/4', '3/4']
  };
  const options = genreSignatures[genre] || genreSignatures.pop;
  return _pickRandom(options);
}

function _getKeySignatureByTheme(theme) {
  const themeKeys = {
    love: ['C', 'G', 'F'],
    loneliness: ['F', 'B♭', 'E♭'],
    sadness: ['D♭', 'A♭', 'E♭'],
    dreams: ['C', 'G', 'D'],
    memory: ['F', 'C', 'G'],
    nature: ['G', 'D', 'A'],
    friendship: ['C', 'G', 'D'],
    success: ['D', 'A', 'E'],
    hope: ['C', 'G', 'D'],
    life: ['C', 'F', 'G'],
    lunatic: ['E♭', 'B♭', 'D'],
    tango: ['D', 'A', 'G'],
    heartbreak: ['E♭', 'A♭', 'D♭'],
    healing: ['C', 'F', 'G'],
    time_travel: ['G', 'D', 'C'],
    epic_journey: ['D', 'A', 'E'],
    dark_mystery: ['E♭', 'B♭', 'D♭'],
    romantic_night: ['C', 'G', 'F'],
    nostalgic_memory: ['F', 'C', 'G'],
    energetic_party: ['D', 'A', 'G'],
    dreamy_fantasy: ['C', 'G', 'F'],
    modern_city: ['E♭', 'B♭', 'F'],
    ancient_legend: ['G', 'D', 'A'],
    indie_story: ['C', 'F', 'G'],
    folk_tale: ['G', 'D', 'C'],
    summer_vibes: ['D', 'A', 'G'],
    winter_solitude: ['E♭', 'B♭', 'A♭'],
    spring_awakening: ['C', 'G', 'D'],
    autumn_melancholy: ['F', 'B♭', 'E♭'],
    ocean_dreams: ['C', 'G', 'F']
  };
  const options = themeKeys[theme] || themeKeys.love;
  return _pickRandom(options);
}

export function generateMusicalNotation(genre, theme) {
  const tempoKey = _getTempoByGenre(genre);
  const tempo = TEMPO_MARKINGS[tempoKey];
  const timeSigKey = _getTimeSignatureByGenre(genre);
  const timeSig = TIME_SIGNATURES[timeSigKey];
  const keySigKey = _getKeySignatureByTheme(theme);
  const keySig = KEY_SIGNATURES[keySigKey];
  const progression = CHORD_PROGRESSIONS[genre] || CHORD_PROGRESSIONS.pop;

  return {
    tempo: {
      italian: tempoKey,
      chinese: tempo.name,
      bpm: tempo.bpm,
      description: tempo.description
    },
    timeSignature: {
      notation: timeSigKey,
      name: timeSig.name,
      chinese: timeSig.chinese,
      feel: timeSig.feel,
      description: timeSig.description
    },
    keySignature: {
      notation: keySigKey,
      name: keySig.name,
      chinese: keySig.chinese,
      sharps: keySig.sharps,
      flats: keySig.flats,
      relativeMinor: keySig.relativeMinor
    },
    chordProgression: _pickRandom(progression),
    structure: STRUCTURES[genre] || STRUCTURES.pop
  };
}

/* =========================================================================
 * 19. FSM PRODUCTION TRANSITIONS
 * ========================================================================= */

export function generateFSMProductionTransitions(structure) {
  const transitions = [];
  const triggers = Object.keys(FSM_TRIGGERS);

  for (let i = 0; i < structure.length - 1; i++) {
    const from = structure[i];
    const to = structure[i + 1];

    let triggerKey = null;
    if (from.includes('intro') && to.includes('verse')) triggerKey = 'intro_to_verse';
    else if (from.includes('verse') && to.includes('pre_chorus')) triggerKey = 'verse_to_prechorus';
    else if (from.includes('pre_chorus') && to.includes('chorus')) triggerKey = 'prechorus_to_chorus';
    else if (from.includes('chorus') && to.includes('verse')) triggerKey = 'chorus_to_verse';
    else if (from.includes('verse') && to.includes('bridge')) triggerKey = 'verse_to_bridge';
    else if (from.includes('bridge') && (to.includes('final') || to.includes('chorus'))) triggerKey = 'bridge_to_final_chorus';
    else if (from.includes('chorus') && (to.includes('outro') || to.includes('finale'))) triggerKey = 'chorus_to_outro';

    if (triggerKey && FSM_TRIGGERS[triggerKey]) {
      transitions.push({
        from,
        to,
        trigger: FSM_TRIGGERS[triggerKey],
        transitionKey: triggerKey,
        sectionIndex: i
      });
    } else {
      transitions.push({
        from,
        to,
        trigger: {
          condition: `当从${from}进入${to}`,
          action: '自然过渡，保持乐器和动态连贯',
          transition: '平滑过渡'
        },
        transitionKey: 'default',
        sectionIndex: i
      });
    }
  }

  return transitions;
}

/* =========================================================================
 * 20. SHEET MUSIC OUTPUT FORMATTER
 * ========================================================================= */

export function formatSheetMusicOutput(result) {
  const notation = generateMusicalNotation(result.genre, result.theme);
  const transitions = generateFSMProductionTransitions(result.structure);
  const production = result.productionMetadata || (result.meta && result.meta.productionMetadata) || {};
  const vocal = production.vocal || {};

  let sheetMusic = `【乐谱总谱】\n\n`;
  sheetMusic += `┌─────────────────────────────────────────────────────┐\n`;
  sheetMusic += `│  🎵 曲谱标题：${result.theme || '无题'} × ${result.genre || '流行'}              │\n`;
  sheetMusic += `│  🎯 调性：${notation.keySignature.chinese} (${notation.keySignature.notation})        │\n`;
  sheetMusic += `│  ⏱️ 拍号：${notation.timeSignature.notation} (${notation.timeSignature.chinese})       │\n`;
  sheetMusic += `│  🚀 速度：${notation.tempo.chinese} (${notation.tempo.bpm} BPM)                  │\n`;
  sheetMusic += `│  📊 和弦进行：${notation.chordProgression}                                       │\n`;
  sheetMusic += `└─────────────────────────────────────────────────────┘\n\n`;

  sheetMusic += `【段落结构】\n\n`;
  result.sections.forEach((section, idx) => {
    const timeMarker = section.timeSection || `${idx + 1}. ${section.type}`;
    const dynamic = section.dynamic || _getDynamicForSection(section.type, idx, result.sections.length);
    const instruments = section.instruments || production.instrumentation || [];

    sheetMusic += `╔══════════════════════════════════════════════════════════════╗\n`;
    sheetMusic += `║ ${timeMarker}\n`;
    sheetMusic += `║ [动态: ${dynamic}] [乐器: ${instruments.join(', ')}]\n`;
    sheetMusic += `╚══════════════════════════════════════════════════════════════╝\n`;

    if (section.content) {
      const lines = section.content.split('\n').filter(l => l.trim());
      lines.forEach(line => {
        sheetMusic += `    ${line}\n`;
      });
    } else if (section.lines) {
      section.lines.forEach(line => {
        sheetMusic += `    ${line}\n`;
      });
    }
    sheetMusic += '\n';
  });

  sheetMusic += `【FSM 状态转换】\n\n`;
  sheetMusic += `状态机设计：段落 → 条件 → 动作 → 动态变化\n\n`;
  transitions.forEach(t => {
    sheetMusic += `  ${t.from} → ${t.to}\n`;
    sheetMusic += `    ├─ 条件：${t.trigger.condition}\n`;
    sheetMusic += `    ├─ 动作：${t.trigger.action}\n`;
    sheetMusic += `    └─ 动态：${t.trigger.transition}\n\n`;
  });

  sheetMusic += `【人声与制作参数】\n\n`;
  sheetMusic += `🎙️ 人声设定：\n`;
  sheetMusic += `  - 性别：${vocal.gender || '默认'}\n`;
  sheetMusic += `  - 情感等级：${vocal.emotionLevel || '情感5级'}\n`;
  sheetMusic += `  - 演唱方式：${vocal.tone || '叙事'}\n`;
  sheetMusic += `  - 语言：${vocal.dialect || '普通话'}\n`;
  sheetMusic += `  - 麦克风技术：${vocal.micTechnique || '贴近麦克风'}\n`;
  sheetMusic += `  - 人声叠加：${vocal.layering || '单层人声'}\n\n`;

  sheetMusic += `🎚️ 动态控制：${production.dynamics ? production.dynamics.join(', ') : 'mf'}\n`;
  sheetMusic += `✨ 效果处理：${production.effects ? production.effects.join(', ') : '混响'}\n`;
  sheetMusic += `🎧 音效元素：${production.sfx && production.sfx.length > 0 ? production.sfx.join(', ') : '无'}\n`;

  return sheetMusic;
}

/* =========================================================================
 * 21. VARIATION GENERATOR
 * ========================================================================= */

export function generateVariation(baseResult, variationType = 'default') {
  const scheme = STYLE_VARIATION_SCHEMES[variationType] || STYLE_VARIATION_SCHEMES.default;
  const production = baseResult.productionMetadata || (baseResult.meta && baseResult.meta.productionMetadata) || {};
  const vocal = production.vocal || {};

  let modifiedProduction = { ...production };

  if (variationType === 'enhanced') {
    modifiedProduction.dynamics = production.dynamics ?
      production.dynamics.map(d => d === 'mf' ? 'f' : d === 'f' ? 'ff' : d === 'p' ? 'mp' : d) :
      ['f', 'ff'];

    if (vocal.emotionLevel) {
      const levels = ['情感3级', '情感4级', '情感5级', '情感6级', '情感7级', '情感8级'];
      const currentIdx = levels.indexOf(vocal.emotionLevel);
      modifiedProduction.vocal = {
        ...vocal,
        emotionLevel: levels[Math.min(currentIdx + 1, levels.length - 1)]
      };
    }

    modifiedProduction.effects = [...(production.effects || []), '合唱'];
  } else if (variationType === 'transformed') {
    const chineseInst = CHINESE_INSTRUMENTS.slice(0, 2);
    const westernInst = WESTERN_INSTRUMENTS.slice(0, 2);
    const electronicInst = ELECTRONIC_INSTRUMENTS.slice(0, 2);

    if (production.instrumentation) {
      modifiedProduction.instrumentation = production.instrumentation.map(inst => {
        if (CHINESE_INSTRUMENTS.includes(inst)) {
          return _pickRandom(electronicInst);
        } else if (WESTERN_INSTRUMENTS.includes(inst)) {
          return _pickRandom(chineseInst);
        }
        return inst;
      });
    }

    if (vocal.micTechnique) {
      modifiedProduction.vocal = {
        ...vocal,
        micTechnique: vocal.micTechnique === '贴近麦克风' ? '空荡大厅' : '贴近麦克风'
      };
    }
  }

  return {
    ...baseResult,
    variation: {
      type: variationType,
      name: scheme.name,
      description: scheme.description
    },
    productionMetadata: modifiedProduction,
    fullText: formatSunoOutput({
      ...baseResult,
      productionMetadata: modifiedProduction
    })
  };
}
