# 自动化执行记录 — 社会人 新闻全自动更新

## 2026-07-29 (morning, ~08:56)
- 批次日期: 2026-07-29（morning 槽，近24h）；候选池约 48 条（微博/百度/知乎/抖音/头条/腾讯 + 央媒/部委编辑源）
- 入库: 15 条（0 特大），日期键插入 NEWS_DATA 首位；删除最旧 2026-07-22，日期数保持 7（07-29~07-23）
- 特大: 0。跨平台统计无单事件 ≥4 平台（彭水崩塌/青海地震/两高司法解释均重要但未达特大线）；台风"红霞"已封顶（07-24/26/27）续发排除
- 学科覆盖: soc 12 / econ 9 / psy 4，三科全覆盖
- S9 前沿研究: 2 条（#8 朋友圈静音→Xu Jing 等2023 TMSP 模型 fromNode=self_presentation sciencedirect；#12 手机沉迷→Xiao Y 等2025 JAMA 青少年成瘾性屏幕使用轨迹 fromNode=psy_emotion pubmed PMID 40531519），均嵌 interpretation.research
- 本批条目: 彭水崩塌(risk_society/beck/durkheim)、青海地震(social_capital/institutionalism)、两高内幕交易(econ_akerlof/law)、央行逆回购(econ_keynes/econ_macro)、个税退税(econ_welfare/econ_macro)、森马短裤(econ_signaling/psy_conformity/econ_veblen)、避暑游(late_modern/giddens)、朋友圈静音(goffman/self_presentation,research)、暑期档票房(habitus/econ_behavioral/econ_industrial_org)、虞书欣AI侵权(technology/law)、逍遥干部(weber/merton/work)、手机沉迷(psy_emotion/family/psy_stress,research)、世界杯观赛(media/durkheim)、林依晨翻红(simmel/mead/attention_economy)、苏有朋大同(econ_behavioral/attention_economy)
- 节点id: 全部∈311节点集（入库前批量核对；本轮用 beck/durkheim/self_presentation/habitus/econ_veblen/late_modern/giddens/econ_akerlof 均确认存在；仍规避失效 id 如 dramaturgy/bourdieu/class/disaster/community 等）
- 校验: 临时副本注入 navigator/matchMedia/localStorage/sessionStorage/location 桩后 `node news-validate.js` → **FAIL=0 WARN=0**（7日期各15条，311节点）
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 部署: deploy-netlify.js 退出码 0，Production https://shehui-ren.com（deploy id 6a695799b4490dc2a6bedf36）
- 红线: 未改 sociology-map.html、未删无关文件、未改 deploy-netlify.js 与 .netlify_token；临时脚本(_del_0722/_validate_run/_mk_log) 跑完已删

## 2026-07-28 (morning, ~09:06)
- 批次日期: 2026-07-28（morning 槽，近24h）；候选池约 46 条（微博/百度/知乎/抖音/头条热榜 + 央媒/部委编辑源）
- 入库: 15 条（0 特大），日期键插入 NEWS_DATA 首位
- 特大: 0。跨平台统计无单事件 ≥4 平台（东野圭吾去世 3 平台最高）；红霞已封顶、渭源山洪/长鑫 07-27 已入库 → 全部按 S5 排除
- 本批条目: 东野圭吾去世(media/health)、唐山大地震50周年(durkheim/risk_society)、工业利润+18.7%(econ_growth/technology)、残疾人十五五规划孤独症专栏(stratification/econ_welfare)、入境游2291万人次(globalization/econ_growth)、606分选职业本科(econ_signaling/econ_human_capital/education)、山姆骑手985噱头(media/econ_labor)、龙南1元时薪(law/econ_labor)、河南三支一扶改分疑云(education/institutionalism)、基层干部镜头焦虑(goffman/media)、佛得角门将AI假图(technology/psy_schema)、老人被骗594万水贝洗钱(psy_social_influence/law)、附子网售曝光(econ_info_asym/health)、松山湖父子桨板遇难(psy_cognitive_bias/risk_society)、胖东来流失率0.5%(work/econ_labor)
- 学科覆盖: soc 15 / econ 9 / psy 3，三科全覆盖
- S9 前沿研究: 1 条（#14 松山湖遇难 → 黄晶等2024《基于主体建模的城市暴雨洪涝灾害预警策略仿真研究》地球信息科学学报 DOI:10.12082/dqxxkx.2024.230311，fromNode=risk_society）
- 事实修正: "老人被骗600万"候选经主源核对实为上海浦东杨先生被骗594万、赃款经深圳水贝金店洗钱案（案件聚焦07-27报道），按已判决事实撰写
- 节点id: 全部∈311节点集（入库前批量核对，goffman/durkheim/institutionalism/globalization/econ_human_capital 等均确认存在）
- 校验: news-validate.js 沙箱新增 `window.matchMedia is not a function` 报错 → 临时副本除 navigator 桩外还需注入 matchMedia/localStorage/sessionStorage/location 桩，注入后 **FAIL=0 WARN=0**（7日期各15条）
- 修剪: 删除最旧 2026-07-21，日期数保持 7（07-28~07-22）
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 部署: deploy-netlify.js 退出码 0，Production https://shehui-ren.com（deploy id 6a6808e8ca3a8a7c38a67c68）

## 2026-07-27 (morning, ~09:06)
- 批次日期: 2026-07-27（morning 槽，近24h）；候选池约 48 条（微博/百度/知乎/抖音/头条/腾讯 + 央媒/部委编辑源）
- 入库: 15 条（0 特大），日期键插入 NEWS_DATA 首位
- 特大: 0。台风"红霞"已于 07-24/25/26 连续覆盖 3 天（达 S5 上限），携程(07-26)/粤车南下(07-26)/离岸信托个税(07-25)/结婚发钱(07-25) 均 7 日内已覆盖 → 全部排除，故本批无特大
- 学科覆盖: soc 13 / econ 13 / psy 1（psy 由 #5 依恋理论承载），三科全覆盖（校验 WARN=0 印证）
- S9 前沿研究: 3 条（#2 区域收入收敛 郭劲光、张景媛2025《兰州学刊》β收敛 fromNode econ_inequality；#4 AI替代青年就业 Brynjolfsson等2025 Stanford Digital Economy Lab fromNode econ_labor；#5 青少年向AI倾诉 复旦《中国青年网民社会心态调查报告2024》fromNode psy_attachment），均嵌 interpretation.research，url 真实、fromNode∈311节点集
- 节点id: 全部∈311节点集（econ_supply_demand/econ_growth/stratification/econ_inequality/health/econ_info_asym/technology/econ_labor/psy_attachment/econ_fiscal_policy/econ_welfare/econ_environmental_econ/environment/education/family/socialization/econ_public_finance/social_capital/youth/risk_society/precariat/econ_monetary_policy），label 均=节点名
- 替换: 原候选#9（蜂群无人机台风观测）隶属已封顶的红霞事件 → 改为合规非台风项"我国红树林面积达3.17万公顷"（environment+econ_environmental_econ）
- 文案质检: 全量非中文字符扫描，07-27 仅余 FrieslandCampina/Standing/Brynjolfsson 等专有名词引述，无偶然外文混入；"社会风险Pooling"已改为"社会风险共担"
- 校验: 临时副本注入 navigator 桩后 `node news-validate.js` → **FAIL=0 WARN=0**（本批全过，311节点，7日期各15条）
- 修剪: 删除最旧 2026-07-20，日期数保持 7（07-27/26/25/24/23/22/21）
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 部署: deploy-netlify.js 退出码 0，Production https://shehui-ren.com（deploy id 6a66b40a1eee4c38a426e9ed）

## 2026-07-26 (morning, ~09:06)
- 批次日期: 2026-07-26（morning 槽，近24h）；候选池约 46 条（微博/百度/知乎/抖音/头条/腾讯 + 部委/央媒编辑源）
- 入库: 15 条（2 特大 + 13 非特大），日期键插入 NEWS_DATA 首位
- 特大(2): #1 台风"红霞"惠州登陆14级+今年首个台风红色预警（6+平台，红霞连日跟踪 07-24生成→07-25预警→07-26登陆，取"实际登陆+红警"新角度合规续发）；#2 携程垄断被罚没51.79亿元（OTA 反垄断第一案，跨多平台）
- 学科覆盖: soc 12 / econ 10 / psy 1，三科全覆盖
- S9 前沿研究: 3 条（#2 携程→OTA 平台 SCP 反垄断论文 qikanchina；#3 粤车南下→GBA 核心-边缘 Applied Sciences 10.3390/app15147705；#7 游戏障碍→IGD meta 分析 Asian J Psychiatry 2024 PMID 39366164/DOI 10.1016/j.ajp.2024.104257），均嵌 interpretation.research
- 节点id: 全部∈311节点集；本批用 risk_society/urban/environment/econ_monopoly/econ_industrial_org/econ_welfare/migration/core_periphery/cultural_capital/psy_attachment/psy_mental_health/econ_public_finance/econ_environmental_econ/econ_fiscal_policy/youth/social_capital/econ_labor/precariat/econ_growth/digital/technology/stratification/health/science/family，全部校验存在
- S0 剔除: 苏泊尔擦边营销 UGC、省部级立案(政治边界)、造船业(07-22已覆盖去重)、延迟退休自媒体解读(缺一级源)、明星塌房(无学科价值)、离岸信托个税(07-25已入库)
- 数据修正: 原拟"社保基金11.07万亿"未坐实，改用 mohrss 已确证的"2026基础养老金最低标准163元/月 + 三项社保基金2025底累计结余10.2万亿"(#8)
- 校验: 临时副本注入 navigator 桩后 `node news-validate.js` → **FAIL=0 WARN=0**（本批全过，311节点，7日期各15条；旧日期历史告警亦已随修剪清零）
- 修剪: 删除最旧 2026-07-16，日期数保持 7（07-26/25/24/23/22/21/20）
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 部署: deploy-netlify.js 退出码 0，Production https://shehui-ren.com（deploy id 6a65633ca7bd824afd26e22a）
- 备注: 全量非中文字符扫描无外文词混入；deploy 脚本位于 ctrip-claw/ 目录（发布源仍为 sociology-map/），从 ctrip-claw 运行

## 2026-07-25 (morning, ~09:06)
- 批次日期: 2026-07-25（morning 槽，近24h）；候选池约 48 条（微博/百度/知乎/抖音/头条/腾讯 + 川观/澎湃/新浪早报等编辑源）
- 入库: 15 条（1 特大 + 14 非特大），日期键插入 NEWS_DATA 首位
- 特大(1): #1 台风"红霞"今夜登陆粤东、国家防总四级响应、多地停课停航（6平台）——同事件连日跟踪，取新进展角度（登陆倒计时+防总响应），与 07-24"生成+预警"不重复
- 学科覆盖: soc 11 / econ 10 / psy 3，三科全覆盖；strong 6 条（台风/离岸信托个税/个贷新规/耐克清退/16小时外卖/新就业形态社保）
- S9 前沿研究: 2 条（#7 马孟琛《新就业形态劳动者的职业伤害保障研究》社会保障评论2025 fromNode precariat；#9 Nakagomi et al. AI companions and subjective well-being, Technology in Society 2026, DOI 10.1016/j.techsoc.2026.103229 fromNode psy_attachment），出处均经检索核验
- 节点id: 全部∈311节点集；本轮发现 consumption/aging/econ_incentive/modernity/fertility/population 均不存在，改用 econ_welfare/family/institutionalism/technology/econ_industrial_org 等替代
- S0 剔除: 方星海被查(纪委案件)、菲律宾黄岩岛/伊朗美军(国际政治)、爱泼斯坦关联死亡(猎奇)、UGC个人帖均未采；13-15 补足条目（结婚发钱/企业年金线上转接/人形机器人量产）均取编辑源
- 校验: 临时副本注入 navigator 桩后 `node news-validate.js` FAIL=0 WARN=1（仅旧日期 07-16 soc-only 历史告警，本批无告警）
- 修剪: 删除最旧 2026-07-15，日期数保持 7（07-25/24/23/22/21/20/16）
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 部署: deploy-netlify.js 退出码 0，Production https://shehui-ren.com（deploy id 6a641256cc47020775ddc71a）
- 教训: 生成长文案时混入外文词（"первый""precisely"）各1处，入库后自查发现并已修复——今后写完批次先跑一次非中文字符扫描

## 2026-07-24 (morning, ~09:06)
- 批次日期: 2026-07-24（morning 槽，近24h）；候选池约 45 条（微博/百度/知乎/抖音/头条/腾讯 + 综合新闻 + 部委/央媒）
- 入库: 15 条（3 特大 + 12 非特大），日期键插入 NEWS_DATA 首位
- 特大(3): #1 台风"红霞"橙色预警登陆粤闽（6平台）、#2 注射用环磷酰胺24元涨至680元全国缺货（5平台）、#5 王虹/邓煜同获菲尔兹奖（中国籍首次，6平台）
- 学科覆盖: soc 24 / econ 18 / psy 4，三科全覆盖；节点id 全部取自 311 节点集（已校验 social_work/social_governance/social_comparison 等失效id未使用）
- S9 前沿研究: 3 条（#2 中国低价药政策与供应短缺 Frontiers Pharmacol PMC7893609 fromNode econ_supply_demand；#5 成长型思维全国实验 Nature 2019 s41586-019-1466-y PMC6786290 fromNode psy_growth_mindset；#7 瑞士 baby bonus 生育率 Health Econ 2021 PMC8453695 fromNode econ_fiscal_policy），fromNode 均∈节点集，DOI/PMID 已核验
- S0 剔除: 政治/国际/明星八卦/NSFW/无源灾情均未采；#14《关于加强新时代社会工作的意见》用新京报/新华社编辑源（非163 UGC），节点用 social_capital/family/work/alienation（social_work 失效未用）
- 校验: 临时补 navigator 桩后 `node news-validate.js` 通过，FAIL=0（2 WARN 为旧日期 07-16/07-15 soc-only，非本批）；注意原校验脚本沙箱缺 navigator 全局，HTML 脚本加载即报 "navigator is not defined"，需注入桩后方可跑
- 修剪: 删除最旧 2026-07-14，日期数保持 7（07-24/23/22/21/20/16/15）
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/（已校验副本一致）

## 2026-07-23 (morning, ~09:06)
- 批次日期: 2026-07-23（morning 槽，近24h）；候选池约 46 条（微博/百度/知乎/抖音/头条+综合新闻）
- 入库: 15 条（2 特大 + 13 非特大），日期键插入 NEWS_DATA 首位
- 特大(2): #1 大暑高温/暴雨/强对流三预警齐发（5平台）、#3 法国拟禁15岁以下用社媒（4平台）
- 学科覆盖: soc 14 / econ 9 / psy 4，三科全覆盖
- S9 前沿研究: 4 条（#3 JAMA青少年社媒抑郁纵向研究、#10 平台劳动多重化Social Inclusion2024、#11 四分之一人生危机MDPI2024、#12 代偿式消费量表J.Retail2024），fromNode 均∈节点集
- 节点id: 全部取自 311 节点集；本轮修正 5 个失效id→econ_fiscal_policy/psy_psychosocial/econ_behavioral/econ_welfare/econ_public_finance
- S0 剔除: 特朗普/伊朗国际政治、涉台政治、明星八卦(弱关联)、无源灾情、招嫖诈骗；S5去重: 避开07-22南方强降雨(特大)与育儿补贴发放(改取财政资金下达角度)
- 校验: `node news-validate.js` FAIL=0（3 WARN 为更早旧日期 soc-only）；07-23 自检字段/url/节点全通过
- 修剪: 删除最旧 07-12，日期数保持 7（07-23/22/21/20/16/15/14）
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/（已校验副本一致）

## 2026-07-22 (morning, ~09:06)
- 批次日期: 2026-07-22（morning 槽，取近24h）
- 候选池: 微博/百度/知乎/抖音/今日头条/腾讯 等多源热榜，约 40+ 条候选
- 入库: 15 条（1 特大 + 14 非特大），日期键插入 NEWS_DATA 首位
- 特大(1): 南方多地强降雨/龙卷风/洪涝（湖北强对流致11死、广西洪水、多流域防汛），跨 5 平台（微博/知乎/抖音/百度/今日头条）
- 学科覆盖: soc / econ / psy 三科全覆盖
- S0 剔除: 招嫖诈骗(NSFW)、网传无源灾情、涉中英关系国有化、国际政治敏感(特朗普/伊朗)、过期A股(7/17)、ofo(weak-only)、娱乐八卦(weak-only)、世界杯(近7天07-20已覆盖)
- 节点id: 全部取自 sociology-map.html 的 311 节点集（已用 _extract_nodes.js 解析校验）；无 urbanization 等失效id
- 校验: `node news-validate.js` 通过，FAIL=0（4 个 WARN 均为更早旧日期 soc-only，非本批）
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 日期数: 7（07-22/21/20/16/15/14/12），未超 7，无需修剪
