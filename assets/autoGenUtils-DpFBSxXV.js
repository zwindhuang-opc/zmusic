import{r as w}from"./lucide-DCzLa9Lh.js";const T=["love","loneliness","sadness","dreams","hope","friendship","success","nostalgia","freedom","healing","adventure","heartbreak","ambition","nature","travel","urban_life","memory","romance","triumph","companionship"],A=["pop","rock","electronic","jazz","classical","rnb","tango","anime","chinese_classical","folk","country","reggae","ambient","hip_hop","kpop","ballad"],$=["流行音乐","流行舞曲","流行说唱","R&B","灵魂乐","放克","摇滚","硬摇滚","朋克","金属","哥特摇滚","另类摇滚","电子乐","EDM","合成器流行","深浩室","科技舞曲","梦幻电子","说唱","陷阱","Boom Bap","西海岸说唱","东岸说唱","古典","古典交响","室内乐","巴洛克","浪漫主义","爵士乐","民谣","古风","中国风","民歌","乡村音乐","蓝调","拉丁","雷鬼","桑巴","探戈","弗拉门戈","K-Pop","氛围音乐","新世纪","冥想","环境音乐","Chillout"],O=["流行","摇滚","电子","民谣","古风","R&B","爵士","古典","嘻哈","雷鬼","蓝调","乡村","金属","朋克","灵魂","放克","迪斯科","氛围","新世纪","凯尔特","拉丁"],P=["欢快","忧伤","浪漫","激昂","平静","神秘","紧张","轻松","深情","豪迈","治愈","孤独","狂欢","思念","励志","怀旧","梦幻","力量","温柔","激情"],S=["午夜","星河","雨后","追风","远方","旧巷","极光","云端","破晓","落叶","潮汐","逆光","微光","晚风","少年","旅人","候鸟","旧梦","山海","烟火"],E=["之歌","序曲","独白","叙事诗","圆舞曲","幻想曲","随想曲","练习曲","夜曲","协奏曲","小夜曲","赋格","变奏曲","安魂曲","的回忆","的告白","的旅程","的告别","的约定","的誓言"],i=n=>n[Math.floor(Math.random()*n.length)],h=(n,e)=>Math.floor(Math.random()*(e-n+1))+n;function U(){return{theme:i(T),style:i(A)}}function z(){return i(S)+i(E)}function B(){return i($)}function F(){const n=h(1,3),e=h(1,3),o=[],s=[],t=[...O],a=[...P];for(let r=0;r<n&&t.length>0;r++){const l=Math.floor(Math.random()*t.length);o.push(t.splice(l,1)[0])}for(let r=0;r<e&&a.length>0;r++){const l=Math.floor(Math.random()*a.length);s.push(a.splice(l,1)[0])}return{genres:o,moods:s}}function V(){const n={pop:"pop, upbeat, catchy melody, modern production",rock:"rock, electric guitar, heavy drums, powerful vocals",electronic:"electronic, synthwave, arpeggiator, digital drums",hip_hop:"hip hop, rap, beat, bassline, urban",ballad:"ballad, piano, acoustic guitar, emotional vocals",jazz:"jazz, saxophone, swing, smooth, improvisation",classical:"classical, orchestra, violin, cello, dramatic",rnb:"rnb, soul, piano, bass, smooth vocals",folk:"folk, acoustic, storytelling, warm, earthy",ambient:"ambient, atmospheric, drone, meditative, calming",epic:"epic, cinematic, orchestra, choir, dramatic, heroic",ancient:"ancient, chinese folk, guzheng, traditional, classical"},e=i(Object.keys(n));return{styleKey:e,tags:n[e],chips:n[e].split(",").map(o=>o.trim()).filter(Boolean)}}const p={love:[`[Verse 1]
月光洒在你发梢
像是我收藏的珍宝
那一刻心跳的节拍
连呼吸都变得美妙

[Pre-Chorus]
如果时光能停住一秒
我希望是此刻的拥抱

[Chorus]
这就是爱 心跳的证据
这就是你 命运的相遇
不管明天会去向哪里
有你在就是最好的结局`,`[Verse 1]
街角的咖啡店
阳光洒落在窗边
你抬头的那一瞬间
世界仿佛按下暂停键

[Pre-Chorus]
我假装在看窗外的天
余光却一直在你身边

[Chorus]\\n喜欢你是我藏不住的秘密
每一次心跳都在说愿意
可不可以让我牵着你的手
走过每一个春夏秋冬的温柔`],dreams:[`[Verse 1]
背着破旧的行囊
走向未知的远方
他们说这条路太长
可我心里有方向

[Pre-Chorus]
就算跌倒也要笑着爬起
每道伤疤都是勋章的印记

[Chorus]
我要追 追着光的方向
我要飞 飞到云层之上
梦想不会被现实埋葬
汗水终会开出最耀眼的花`,`[Verse 1]
小时候写下的愿望
藏在抽屉最底的地方
长大后我终于敢回望
那行字依然发着光

[Pre-Chorus]
他们说长大就会变现实
可我偏要让现实变成诗

[Chorus]
梦想从来都不是奢侈
是你敢不敢 迈出第一步的坚持
就算全世界都说不可能
我也要亲手写出 自己的传奇`],loneliness:[`[Verse 1]
凌晨三点的便利店
只剩我和冷掉的咖啡
城市安静得能听见
路灯破碎的光影

[Pre-Chorus]
朋友说我最近有点沉默
我说只是最近比较累而已

[Chorus]
孤独是一个人的狂欢
狂欢是一群人的孤单
我们在人潮里走散
却谁都不敢先回头看`,`[Verse 1]
空荡的房间开着所有灯
电视演着没在看的剧情
手机开着静音等你的消息
其实我知道 不会有回音

[Pre-Chorus]
热闹的聚会 我总是先走的那个
因为我怕散场时的安静 更难过

[Chorus]
孤独是条漫长的走廊
每扇门后都是另一段过往
我学会了和自己对话
却学不会 如何不想他`],nostalgia:[`[Verse 1]
翻开旧相册 阳光穿过尘埃
那一年我们笑得 不知天高地厚
校门口的老冰棍 五毛钱的快乐
如今什么都有了 却少了点什么

[Pre-Chorus]
时间是个贪心的小偷
偷走了岁月 却把回忆留给了我

[Chorus]
我怀念的不是旧时光
是时光里的你 是那时的我们
说好永远不分开的夏天
如今只剩我一个人 还在原地等`,`[Verse 1]
老唱片机转动那首老歌
音符里还是当年的温热
窗外的蝉鸣 像没停过
可窗边的少年 已经走了

[Pre-Chorus]
长大是一场无人送行的告别
我们笑着挥手 转身却红了眼

[Chorus]
旧梦重游 我还是那个少年
站在初遇的街口 等风也等你
可风会来 你不会来
只剩回忆的风 吹散我满怀`],healing:[`[Verse 1]
雨后的泥土芬芳
阳光透过云层洒下
一只蝴蝶停在窗台上
它也知道 雨过了

[Pre-Chorus]
你看 花都在努力开着
你也要 努力好起来啊

[Chorus]
一切都会好的 时间会给出答案
那些流过的泪 会变成天上的星照亮你
你值得被爱 值得所有温柔
请你再等一等 春天正在路上`,`[Verse 1]
泡一杯热茶 放在手心
窗外的世界 暂时别去关心
深呼吸 听听心跳的声音
它在说 一切都会过去

[Pre-Chorus]
别着急 你已经很努力了
允许自己 偶尔也停下来喘口气

[Chorus]
治愈自己 是一生的课题
允许难过 允许崩溃 允许不完美
天黑之后一定会有天明
你不是一个人 我们都陪着你`],nature:[`[Verse 1]
赤脚走在溪流边
溪水凉过我的思念
远山如黛 云雾如烟
这一刻时间 都变得柔软

[Pre-Chorus]
风穿过竹林 奏着谁的歌
我闭上眼 听懂了它在说什么

[Chorus]
山川河流 自有它的节奏
人生一世 何必太匆匆
你看那落花 从不问归期
归于泥土 是另一种 永恒的延续`,`[Verse 1]
森林深处有一间木屋
清晨被鸟儿的歌声唤醒
推开窗 云海翻涌
仿佛伸手就能触碰天空

[Pre-Chorus]
没有手机 没有消息
只有风和树的对话 还有自己的呼吸

[Chorus]
自然是最温柔的治愈
它不问你从哪里来 也不问你去哪里
你只需静静地站在风里
就让所有烦恼 都随云 飘散去`]};function G(n){const e=p[n]||p.dreams;return e[Math.floor(Math.random()*e.length)]}function R(n,e){const o={love:"一首深情款款的情歌，关于心动与告白的甜蜜瞬间",dreams:"一首热血励志的追梦之歌，充满希望与勇气的力量",loneliness:"一首孤独独白的都市夜曲，都市深夜的思考与感悟",sadness:"一首忧伤的抒情曲，关于离别与失去的痛苦回忆",hope:"一首充满希望的治愈之歌，雨后见彩虹的温暖力量",friendship:"一首友情岁月的暖心歌，共同成长的珍贵回忆",nostalgia:"一首怀旧的复古旋律，童年往事与旧时光的温柔想念",healing:"一首温柔治愈的心灵之歌，自我疗愈与接纳的温暖旅程",success:"一首胜利凯旋的辉煌乐章，拼搏成功后的荣耀与喜悦",freedom:"一首自由奔放的公路之歌，挣脱束缚奔向远方的冒险",heartbreak:"一首心碎的告别曲，爱而不得的伤感与释然",adventure:"一首冒险探索的史诗乐章，踏上未知旅程的勇气与激情",nature:"一首清新自然的田园风，山水之间的宁静与诗意",travel:"一首公路旅行的自由歌，沿途风景与人生感悟",urban_life:"一首都市生活的城市民谣，霓虹灯下的喜怒哀乐",memory:"一首回忆往事的怀旧歌，旧人旧事的温柔回望",romance:"一首浪漫缠绵的热恋曲，甜蜜相拥的幸福时光",triumph:"一首胜利归来的战歌，历尽艰辛后的凯旋与辉煌",companionship:"一首温馨陪伴的抒情曲，相依相伴的岁月静好",ambition:"一首雄心壮志的奋斗曲，少年意气风发追逐理想"},s=o[n]||o.dreams,t={pop:"现代流行风格，抓耳的旋律，精致的制作",rock:"摇滚风格，电吉他riff，强力鼓点，充满力量的主唱",electronic:"电子音乐风格，合成器音效，脉冲节奏，赛博未来感",jazz:"爵士风格，萨克斯独奏，摇摆节奏，慵懒午夜的氛围",classical:"古典风格，管弦乐团，小提琴与大提琴的交响，华丽大气",rnb:"R&B节奏蓝调，灵魂唱腔，钢琴与贝斯，性感而温柔",tango:"探戈风格，三拍子节奏，优雅而激情，舞步回旋的韵律",anime:"二次元动漫风格，青春热血，夏日祭与校园的怀旧感",chinese_classical:"中国古风，古筝琵琶笛子，水墨意境，诗词韵律",folk:"民谣风格，木吉他，叙事性歌词，质朴温暖的质感",country:"乡村风格，木吉他，田园气息，质朴的生活感",reggae:"雷鬼风格，海岛节奏，慵懒阳光，自由放松的氛围",ambient:"氛围音乐，空灵飘渺，环境音景，冥想沉静的体验",hip_hop:"嘻哈说唱，街头律动，韵脚flow，真实有力的表达",kpop:"K-Pop韩流风格，精致制作，副歌洗脑，舞台感十足",ballad:"抒情民谣，钢琴为主，情感真挚，催泪的旋律线条"},a=t[e]||t.pop;return`${s}，${a}。`}function j(n){const e=[`一首关于${n}的歌曲，旋律优美，情感真挚，结构完整，包含主歌副歌桥段`,`描绘${n}的场景，用音乐讲一个动人的故事，配器丰富，层次分明`,`表达${n}的情感，现代流行风格，副歌抓耳，让人一听就记住`,`${n}主题的歌曲，有画面感的歌词，动听的旋律，治愈人心的力量`,`讲述一个关于${n}的故事，叙事性强的歌词，感人的副歌，制作精良`];return i(e)}function x(n,e,o){w.useEffect(()=>{const s=()=>{try{if(o!=null&&o.current)return}catch{}e()},t=a=>{var r;((r=a.detail)==null?void 0:r.platform)===n&&s()};window.addEventListener("zmusic:auto-start",t);try{sessionStorage.getItem("zmusic-pending-auto")===n&&(sessionStorage.removeItem("zmusic-pending-auto"),setTimeout(s,300))}catch{}return()=>window.removeEventListener("zmusic:auto-start",t)},[n,e,o])}const d={love:{feeling:"心动与告白的甜蜜瞬间",scene:"街角咖啡店的午后阳光",why:'想捕捉那种"世界按下暂停键"的心动时刻'},loneliness:{feeling:"都市深夜的疏离感",scene:"凌晨三点的便利店",why:"用最日常的场景承载最私密的孤独"},sadness:{feeling:"离别与失去的痛",scene:"雨天的车站月台",why:"悲伤需要被听见，音乐是最好的容器"},dreams:{feeling:"追梦的热血与坚持",scene:"清晨第一班地铁",why:"每个追梦人都值得一首属于自己的战歌"},hope:{feeling:"雨后见彩虹的温暖",scene:"暴风雨后的初晴",why:"在最暗的时刻点亮一束光"},friendship:{feeling:"共同成长的珍贵",scene:"毕业那年的操场",why:"友情是岁月给的最温柔的礼物"},nostalgia:{feeling:"旧时光的想念",scene:"翻开的旧相册",why:"时间偷走岁月，却把回忆留给我们"},healing:{feeling:"自我疗愈与接纳",scene:"雨后窗台的蝴蝶",why:"允许自己停下来，也是一种勇敢"},success:{feeling:"拼搏后的荣耀",scene:"领奖台的聚光灯",why:"每一滴汗水都值得被歌颂"},freedom:{feeling:"挣脱束缚的奔放",scene:"海岸公路的敞篷车",why:"自由是风，是远方，是不回头的勇气"},heartbreak:{feeling:"爱而不得的释然",scene:"搬家那天的空房间",why:"有些告别是为了更好的相遇"},adventure:{feeling:"未知的勇气",scene:"背包客的山径",why:"人生最美的风景都在未知里"},nature:{feeling:"山水之间的宁静",scene:"溪流边的赤脚",why:"自然是最温柔的治愈师"},travel:{feeling:"在路上的自由",scene:"车窗外的风景",why:"旅行的意义不在终点而在路上"},urban_life:{feeling:"霓虹灯下的喜怒哀乐",scene:"加班后的深夜地铁",why:"城市从不眠，故事在每盏灯下"},memory:{feeling:"旧人旧事的回望",scene:"老唱片的旋转",why:"回忆是时间留给我们的诗"},romance:{feeling:"热恋的甜蜜",scene:"夏夜的海边",why:"浪漫是两个人共享的宇宙"},triumph:{feeling:"凯旋的辉煌",scene:"战场的归途",why:"历经艰辛后的胜利最甘甜"},companionship:{feeling:"相依相伴的静好",scene:"阳台上的两杯茶",why:"最长情的告白是陪伴"},ambition:{feeling:"少年意气风发",scene:"天台上的远眺",why:"雄心是少年最闪亮的勋章"}},f={pop:{instruments:"现代合成器 + 钢琴 + 流行鼓组",mood:"抓耳、易传唱、制作精致",color:"明亮温暖"},rock:{instruments:"电吉他 riff + 重型鼓点 + 贝斯",mood:"力量、爆发、不妥协",color:"炽热红橙"},electronic:{instruments:"合成器琶音 + 数字鼓机 + 低音",mood:"未来感、脉冲、赛博",color:"霓虹紫蓝"},jazz:{instruments:"萨克斯 + 钢琴 + 慢摇摆鼓",mood:"慵懒、即兴、午夜",color:"琥珀深棕"},classical:{instruments:"管弦乐团 + 小提琴 + 大提琴",mood:"华丽、戏剧性、史诗",color:"金色辉煌"},rnb:{instruments:"钢琴 + 灵魂贝斯 + 温柔鼓机",mood:"性感、温柔、深情",color:"酒红丝绒"},tango:{instruments:"手风琴 + 小提琴 + 三拍子鼓",mood:"优雅、激情、回旋",color:"深红玫瑰"},anime:{instruments:"合成器 + 电吉他 + 快速鼓",mood:"热血、青春、夏日祭",color:"天空蓝"},chinese_classical:{instruments:"古筝 + 琵琶 + 笛子",mood:"水墨、诗意、空灵",color:"青绿山水"},folk:{instruments:"木吉他 + 口琴 + 手鼓",mood:"质朴、叙事、温暖",color:"原木大地"},country:{instruments:"木吉他 + 班卓琴 + 小提琴",mood:"田园、质朴、生活",color:"麦田金黄"},reggae:{instruments:"雷鬼吉他 + 贝斯 + 海岛鼓",mood:"阳光、慵懒、自由",color:"加勒比绿"},ambient:{instruments:"环境音景 + 混响合成器 + 长音",mood:"空灵、冥想、沉静",color:"云雾白"},hip_hop:{instruments:"808 鼓机 + 贝斯 + 采样",mood:"街头、真实、有力",color:"街头灰"},kpop:{instruments:"合成器 + 电子鼓 + 副歌洗脑",mood:"舞台感、精致、活力",color:"粉紫霓虹"},ballad:{instruments:"钢琴 + 弦乐 + 真实鼓",mood:"催泪、真挚、情感",color:"月色银白"}},g=[{bpm:60,label:"慢板",reason:"适合深夜、冥想、忧伤情绪，让每个字都有重量"},{bpm:75,label:"缓板",reason:"抒情叙事的黄金速度，给人喘息的空间"},{bpm:85,label:"行板",reason:"爵士与灵魂乐的舒适区，慵懒而不拖沓"},{bpm:95,label:"中板",reason:"民谣与R&B的甜蜜节奏，温柔而有律动"},{bpm:110,label:"稍快",reason:"流行副歌的标准速度，抓耳又易传唱"},{bpm:120,label:"标准",reason:"电子与舞曲的基础节拍，身体会不自觉跟着动"},{bpm:128,label:"舞曲",reason:"EDM 的经典 BPM，让心跳与节拍同步"},{bpm:140,label:"快板",reason:"摇滚与朋克的血液，充满冲击力"},{bpm:160,label:"急板",reason:"金属与硬核的极限，肾上腺素拉满"}],b={C:"纯大调，明亮开阔，适合希望与胜利",Cm:"自然小调，忧郁深邃，适合孤独与悲伤",D:"明亮大调，温暖向上，适合梦想与治愈",Dm:"忧伤小调，叙事性强，适合民谣与怀旧",E:"明亮有力，吉他常用调，适合摇滚与热血",Em:"忧郁小调，吉他开放弦，适合叙事与忧伤",F:"庄严大调，管弦乐常用，适合史诗与古典",Fm:"深沉小调，情感浓烈，适合激情与悲剧",G:"明亮大调，民谣常用，适合温暖与自由",Gm:"忧伤小调，爵士常用，适合午夜与沉思",A:"明亮大调，乐队常用，适合青春与活力",Am:"自然小调，最常用的小调，适合孤独与忧伤",B:"明亮大调，金属常用，适合力量与冲击",Bm:"忧郁小调，摇滚常用，适合挣扎与坚持"};function D(n){const{iteration:e,theme:o,style:s,title:t,bpm:a,key:r,engine:l,lyricsSnippet:y,commandSent:M}=n,c=d[o]||d.dreams,m=f[s]||f.pop,u=g.find(_=>_.bpm===a)||g[3],C=b[r]||b.Am;return{timestamp:new Date().toLocaleTimeString("zh-CN",{hour12:!1}),iteration:e,engine:l,title:t,sections:[{icon:"💭",label:"主题构思",title:`「${o}」— ${c.feeling}`,lines:[`灵感场景: ${c.scene}`,`创作意图: ${c.why}`]},{icon:"🎨",label:"风格定调",title:`「${s}」`,lines:[`配器思路: ${m.instruments}`,`情绪走向: ${m.mood}`,`声音色彩: ${m.color}`]},{icon:"📝",label:"歌词片段",title:t,lines:[(y||"").split(`
`).slice(0,4).join(`
`)]},{icon:"🎚️",label:"音乐参数",title:`${a} BPM · ${r}`,lines:[`速度: ${u.label} — ${u.reason}`,`调性: ${r} — ${C}`]},{icon:"📤",label:`发送给 ${l} 的指令`,title:"实际请求内容",lines:[M||"(见生成日志)"]}]}}const N={title1:n=>`⚠️ 危险：启动 ${n} AUTO 自动生成模式？`,title2:"⚠️ 二次确认：此操作将大量消耗积分",title3:'⚠️ 最后确认：您确定要"烧完"所有积分吗？',desc1:(n,e)=>`AUTO 模式将持续调用 ${n} 生成歌曲，直到检测到积分 <= 0 才会停止。

当前可用积分：${e}
预估每次消耗：约 10-14 积分
理论可生成：${Math.max(0,Math.floor(e/12))} ~ ${Math.max(0,Math.floor(e/10))} 首歌

请确认：一旦开始，除非手动刷新页面或点击"停止"，否则不会停止。
这将"烧掉"您账户里的全部积分，无法撤销！`,desc2:n=>`您正在启动一个高消耗操作，将持续使用 ${n} 生成歌曲。

此行为可能：
  • 在几十分钟内消耗全部剩余积分
  • 生成大量歌曲，需要手动前往官网整理收藏
  • 若为付费订阅，积分用尽后可能产生额外费用

请再次确认：您理解并愿意承担以上风险。`,desc3:(n,e)=>`✅ 最后一次确认：

平台：${n}
当前积分：${e}
操作：持续生成歌曲 → 直到积分归零

如果您现在点击"确认启动"，将立刻开始第一首歌的生成，
之后每首歌完成后会自动开始下一首，循环往复不会停止。

【请确认】：我已清楚以上后果，愿意为此操作负责。`,buttonConfirm:"我确认，启动 AUTO 模式",buttonCancel:"取消 (我再想想)"},L={muse:"https://muse.top",suno:"https://suno.cn",melo:"https://h.51melo.com/pages/mine/index"},I="zmusic_tab_opened_";function k(n){try{const e=L[n];if(!e)return!1;const o=I+n;if(typeof sessionStorage!="undefined"){if(sessionStorage.getItem(o)==="1")return console.log("[AUTO][openPlatformWebsite] Already opened in this session, skipping:",n),!1;sessionStorage.setItem(o,"1")}const s=typeof window!="undefined"?window.open(e,`zmusic_${n}`,"noopener,noreferrer,width=1200,height=800"):null;if(s){try{s.blur()}catch{}try{window.focus()}catch{}}return console.log("[AUTO][openPlatformWebsite] ✅ Opened tab for:",n,"→",e),!0}catch(e){return console.warn("[AUTO][openPlatformWebsite] Failed to open tab for",n,":",e.message),!1}}function W(n=["muse","suno","melo"]){const e=[],o=[];return n.forEach(s=>{k(s)?e.push(s):o.push(s)}),console.log("[AUTO][openAllPlatformWebsites] opened:",e,"  skipped (session dedupe):",o),{opened:e,skipped:o}}const Y={title1:"⚠️ 超级危险：启动三平台 AUTO 同步生成？",title2:"⚠️ 二次确认：将同时消耗 Muse/Suno/Melo 三方积分",title3:"⚠️ 最终确认：三个平台的积分都会被用完",desc1:n=>{var e,o,s,t,a,r;return`GLOBAL AUTO 模式将同时启动三个平台（Muse AI / Suno AI / Melo AI）的自动生成，
每个平台都会独立循环，直到自己的积分归零为止。

当前各平台积分：
  • Muse  : ${(e=n.muse)!=null?e:"未知"}
  • Suno  : ${(o=n.suno)!=null?o:"未知"}
  • Melo  : ${(s=n.melo)!=null?s:"未知"}
合计约：${((t=n.muse)!=null?t:0)+((a=n.suno)!=null?a:0)+((r=n.melo)!=null?r:0)} 积分将全部消耗！

此操作极度危险，请确保您真的想"烧掉"三家全部积分。`},desc2:`您即将触发三平台并行自动生成，
这意味着：

  • 可能在1-2小时内耗尽三个平台的全部剩余积分
  • 同时生成大量歌曲，官网历史记录会显著增长
  • 若有订阅到期提醒，积分用尽后可能触发充值提示
  • 页面 CPU / 内存占用会明显升高，请不要关闭页面

请再次确认：您愿意承担三平台积分同时耗尽的后果。`,desc3:(n,e)=>{var o,s,t;return`✅ 最终确认：

已选择平台：${e.join(" + ")}
当前积分总计：${((o=n.muse)!=null?o:0)+((s=n.suno)!=null?s:0)+((t=n.melo)!=null?t:0)}
操作：多平台并行自动生成 → 各自循环直到归零

【请确认】我已完全理解后果，自愿启动此高消耗操作。`},platformSelectorTitle:"选择要并行生成的平台（可多选）",buttonConfirm:"启动 GLOBAL AUTO 三平台生成",buttonCancel:"取消操作"};export{N as A,Y as G,G as a,k as b,D as c,j as d,B as e,V as f,z as g,R as h,F as i,W as o,U as p,x as u};
