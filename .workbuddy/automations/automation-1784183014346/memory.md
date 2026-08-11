# 自动化执行记录 — 社会人 新闻全自动更新

## 2026-08-05 (morning, ~09:36)
- 批次日期: 2026-08-05（morning 槽，近24h）；候选池约 50 条（微博/百度/知乎/抖音/头条 + 央媒/部委编辑源；多源 WebSearch + 重抓主源核对 title/gist 关键事实）
- 入库: 15 条（4 特大 + 11 非特大），日期键插入 NEWS_DATA 首位；删除最旧 2026-07-29，日期数保持 7（08-05~07-30）
- 特大(4, 均≥4平台): #1 超强台风"白海豚"加强至16级(risk_society/social_capital)、#2 泰航拒载22名中国乘客做"拉眼角"歧视手势(othering/globalization)、#3 全国高温首现50℃+国家级站(risk_society/health,research)、#4 "竹知了"反噬华为触发史翠珊效应(media/attention_economy/psy_social_influence,research)
- 非特大(11): 信用卡三年消失1.2亿张(econ_behavioral/econ_finance)、超60城优化公积金(econ_welfare/social_capital)、求职者问午休被回怼(work/law)、买错机票7分钟扣2022元(econ_info_asym/econ_behavioral)、四大行5年期大额存单返场(econ_monetary_policy/econ_macro)、单亲妈妈扛钢管女儿考上北大(education/stratification,research)、男子私密视频勒索前女友获刑(law/deviance)、录取通知书本科印成专科(education/institutionalism)、新人高铁当婚车(family/attention_economy)、患癌妻子申请销毁婚外胚胎(family/law)、姚洋称智商低于150搞不好数学(psy_growth_mindset/education,research)
- 学科覆盖: soc 15 / econ 5 / psy 4，三科全覆盖；节点 id 全部∈311节点集（逐一比对 risk_society/social_capital/othering/globalization/health/media/attention_economy/psy_social_influence/econ_behavioral/econ_finance/econ_welfare/work/law/econ_info_asym/econ_monetary_policy/econ_macro/education/stratification/deviance/institutionalism/family/psy_growth_mindset 等均存在）
- S9 前沿研究: 4 条（#3 高温→Liu et al. 2025 Lancet Regional Health – Western Pacific (Lancet Countdown China) fromNode=health；#4 竹知了→Hu & Wang 2025 Online Media and Global Communication DOI 10.1515/omgc-2024-0063 fromNode=psy_social_influence；#10 北大录取→《寒门何以出贵子》2026 fromNode=stratification；#15 姚洋→Blackwell/Trzesniewski/Dweck 2007 Child Development DOI 10.1111/j.1467-8624.2007.00995.x fromNode=psy_growth_mindset），均嵌 interpretation.research，url 真实、fromNode∈311节点集
- 质检: 临时副本注入 navigator/matchMedia/localStorage/sessionStorage/location 桩后 `node news-validate.js` → **FAIL=0 WARN=0**（7日期各15条，311节点）；S2 平台阈值核对 4 条 major 均≥4平台；节点 id 全合法
- S0 剔除/未纳入: 国际政治(特朗普/伊朗/莫斯科)、娱乐八卦、纯UGC个人帖、网传无源灾情、台风红霞(7/24–26已连续覆盖达上限)、仅 weak 链接弱关联候选
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 部署: deploy-netlify.js 生产先报 Forbidden，自动「草稿部署+发布」兜底成功，Production https://shehui-ren.com（deploy id 6a7293c2a2b05283974701cc，退出码 0）；并同步 Gitee(commit "news: auto-sync 2026-08-05" push master)
- 红线: 未改 sociology-map.html/deploy-netlify.js/.netlify_token；临时脚本(_ins_0805/_validate_run/_blk_0805/_extract_nodes_now) 跑完已删

## 2026-08-03 (morning, ~10:43)
- 批次日期: 2026-08-03（morning 槽，取近24h）；候选池约 50+ 条（微博/百度/知乎/抖音/头条/腾讯 6 指数 + 央媒/部委编辑源；多源 WebSearch 并行检索 + 重抓主源核对 title/gist 关键事实一致性）
- 入库: 15 条（7 特大 + 8 非特大），日期键插入 NEWS_DATA 首位；删除最旧 2026-07-27，日期数保持 7（08-03~07-28）
- 特大(7, 均≥4平台经程序核对): #1 最高检公安部低龄未成年人核准追诉(law/institutionalism,5平台,research)、#2 小米手机涨价(econ_supply_demand/technology,5平台)、#3 微信地震预警新功能(technology/risk_society,4平台)、#4 央视水光针医美乱象(health/deviance,4平台)、#5 国家防总京冀黔防汛四级响应(risk_society/social_capital,5平台,research)、#6 河南三支一扶作弊通报(institutionalism/education,4平台)、#7 瑞幸奶油枪喂食(emotional_labor/media,4平台)
- 非特大(8): 中国烹协废大师称号(institutionalism/cultural_capital)、地方养老基金1420.71亿(econ_welfare/stratification)、个贷新规8/1施行(econ_behavioral/law)、包钢爆炸10死84伤62人追责(work/law)、暑期档票房破72亿(media/attention_economy)、Tau人形机器人家政30美元/时(technology/alienation)、淘宝AI图两只半手臂(psy_cognitive_bias/media)、央行适度宽松货币政策(econ_monetary_policy/econ_macro)
- 学科覆盖: soc 15 / econ 12 / psy 4，三科全覆盖；节点 id 全部∈311节点集（law/institutionalism/risk_society/social_capital/health/deviance/technology/econ_supply_demand/work/emotional_labor/media/cultural_capital/econ_welfare/stratification/econ_behavioral/econ_monetary_policy/econ_macro/education/alienation/attention_economy/psy_cognitive_bias 等逐一核对存在）
- S9 前沿研究: 2 条（#1 低龄未成年人 → 检察日报理论版《低龄未成年人严重暴力犯罪的刑事责任认定与司法平衡》(2025) fromNode=law；#5 防汛 → Budría et al. IZA DP No.17907 "Resilience in the Wake of Disaster: The Role of Social Capital in Mitigating Long-Term Well-Being Losses" (2026 forthcoming American Behavioral Scientist) fromNode=social_capital），均嵌 interpretation.research，url 真实(12309.gov.cn / iza.org)、fromNode∈311节点集
- 质检: 全量非中文字符扫描 08-03 块，69 处拉丁串均为合法专有名词/技术词(AI/DRAM/NAND/HBM/TrendForce/Counterpoint/REDMI/Tau Robotics)与英文论文题名(IZA)，无偶然外文混入(如 первый/precisely)
- 校验: 临时副本注入 navigator/matchMedia/localStorage/sessionStorage/location 桩后 `node news-validate.js` → **FAIL=0 WARN=0**（7日期各15条，311节点）；S2 平台阈值核对 7 条 major 均≥4平台
- S0 剔除/未纳入: 理想i8碰撞测试争议(2025旧闻)、微博热搜归档页2023内容(非真实当日热榜)、国际政治(特朗普/伊朗/莫斯科爆炸，敏感或弱关联)、娱乐八卦、纯UGC个人帖
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 部署: deploy-netlify.js 首报生产 Forbidden，自动「草稿部署+发布」兜底成功，Production https://shehui-ren.com（deploy id 6a7004b4e9396d8bf65ca692，退出码 0）；并同步 Gitee(commit "news: auto-sync 2026-08-03" push master)
- 红线: 未改 sociology-map.html/deploy-netlify.js/.netlify_token；临时脚本(_ins/_mk_log/_validate/_scan/_chk_major) 跑完已删

## 2026-08-01 (morning, ~08:56)
- 批次日期: 2026-08-01（morning 槽，近24h）；候选池约 50 条（微博/百度/知乎/头条/抖音 5 指数 + 央媒/部委编辑源；多源 WebSearch 并行检索 + 重抓主源核对 title/gist 关键事实一致性）
- 入库: 15 条（1 特大 + 14 非特大），日期键插入 NEWS_DATA 首位；删除最旧 2026-07-25，日期数保持 7（08-01~07-26）
- 特大(1): #1 台风"白海豚"逼近华东、多地停课停运（≥4 平台），risk_society/social_capital 双强链
- 本批条目: 台风白海豚(risk_society/social_capital,major)、连云港母女坠楼(risk_society/urban)、第十二批集采(econ_welfare/econ_moral_hazard,research)、马尔康红旗大桥(law/institutionalism)、公积金条例修订(econ_welfare/social_capital)、聊城鸡鸭粪便烟丝(deviance/econ_moral_hazard)、医生买原料药救母(health/law)、12306提前发车(rationalization_theory/technology)、4万亿算力网(econ_growth/technology)、湖南体育锻炼规定(education/health)、三大运营商停第三方办卡(econ_monopoly/technology)、大学生暑期工(work/psy_self_efficacy,research)、医药代表管理办法(econ_moral_hazard/law)、微博人体极限视频(media/psy_emotion)、贵州漂流伴漂服务(media/attention_economy)
- 学科覆盖: soc 14 / econ 13 / psy 5，三科全覆盖；节点 id 全部∈311节点集、label 与节点名一致
- S9 前沿研究: 2 条（#3 集采 → Wang T. (2026) Social Science & Medicine 398:119195 fromNode=econ_welfare；#12 暑期工 → Gbadamosi G. et al. (2019) HESWBL 9(3):468-484 fromNode=psy_self_efficacy），均嵌 interpretation.research，url 真实(DOI/期刊)、fromNode∈311节点集
- 质量质检: 全量非中文字符扫描发现条目#12正文嵌英文 `multitask` → 已改为「在快餐店里同时顶好几样活」；其余 ASCII 命中均为 JSON 键名/专名(NVL/ALK/ICU/Bandura/Gbadamosi)/学术引用，合法
- 校验: 临时副本注入 navigator/matchMedia/localStorage/sessionStorage/location 桩后 `node news-validate.js` → **FAIL=0 WARN=0**（7日期各15条，311节点）
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/（已 Grep 复核 7 日期键一致）
- 部署: deploy-netlify.js 首报生产 Forbidden，自动「草稿部署+发布」兜底成功，Production https://shehui-ren.com（deploy id 6a6d4bb55584ba0af3af7851，退出码 0）
- 红线: 未改 sociology-map.html/deploy-netlify.js/.netlify_token；临时脚本(_validate_run_0801 等) 跑完已删

## 2026-07-31 (morning, ~08:56)
- 批次日期: 2026-07-31（morning 槽，近24h）；候选池约 50 条（微博/百度/头条/知乎/抖音 5 指数 + 央媒/部委编辑源；多源 WebSearch 并行检索）
- 入库: 15 条（1 特大 + 14 非特大），日期键插入 NEWS_DATA 首位；删除最旧 2026-07-24，日期数保持 7（07-31~07-25）
- 特大(1): #1 重庆彭水山体崩塌（7/30通报51遇难10失联，陆上搜寻完毕），跨微博热搜+央广+央视+环球+百度 ≥4 平台；risk_society/social_capital 双强链
- 本批条目: 彭水崩塌(risk_society/social_capital,major,research)、河南三支一扶(institutionalism/education)、医保套现(econ_moral_hazard/deviance,research)、北京外卖算法新规(work/econ_labor,research)、养老补贴(econ_welfare/social_capital,research)、美股AI芯片(econ_supply_demand/technology,research)、职业伤害保障全国推开(econ_labor/work,research)、开放安全AI联盟(rationalization_theory/technology)、暑期档65亿(media/attention_economy,research)、多地高温红色预警(health/risk_society,research)、崇太长江隧道(science/econ_growth)、网文蓝皮书(media/psy_emotion)、重点群体就业(econ_human_capital/work)、产教评技能生态链(cultural_capital/institutionalism)、青年下乡(stratification/psy_stress)
- 学科覆盖: soc 14 / econ 13 / psy 5，三科全覆盖；15 条全 strong，每条 2–3 链接
- S9 前沿研究: 8 条（#1 Akbar&Aldrich 2018 Disasters 巴基斯坦洪灾社会资本 fromNode=social_capital；#3 Qin等2022 Front Public Health 医保道德风险实证 fromNode=econ_moral_hazard；#4 Liu等2025 iScience 算法管理推高骑手冒险 fromNode=work；#5 Zeng等2024 Arch Geront Geriatr 失能老人长期照护 fromNode=econ_welfare；#6 Tan&Mathews 2010 TFSC 半导体周期 fromNode=econ_supply_demand；#7 梁栋2026 山大学报 新职伤制度 fromNode=econ_labor；#9 杨继军2022 世界经济 电影拉动文旅 fromNode=media；#10 Healy等2026 Lancet Planet Health 高温老人死亡率 fromNode=health），均嵌 interpretation.research，url 真实(DOI/PubMed/期刊)，fromNode∈311节点集
- 节点id: 全部∈311节点集逐一程序化比对（urbanization/consumption/aging 实测 MISSING 已规避；rationalization_theory 与 rationalization_concept 拆分正确）
- 校验: 临时副本注入 navigator/matchMedia/localStorage/sessionStorage/location 桩后 `node news-validate.js` → **FAIL=0 WARN=0**（7日期各15条，311节点）；前置另跑条数/url/id/非中文字符扫描全过（拉丁词仅作者名与 AI/GDP/SK 专有名词）
- S5 去重: 重庆GDP再易位(07-30)、熊本地震(07-30)均近7天已覆盖 → 排除；彭水07-29已报，本次取"51遇难10失联通报"新进展角度合规续发
- S0 剔除/未纳入: 政治局会议主体(仅民生侧面入#13)、伊朗打击美军基地/高市支持率(国际政治)、柯洁/宋祖儿(娱乐体育弱关联)、卫星发射/江苏高温(名额满合并)
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 部署: deploy-netlify.js 退出码 0，Production https://shehui-ren.com（deploy id 6a6bf59b8e4b3b0a234248e9）
- 红线: 未改 sociology-map.html/deploy 脚本/.netlify_token；临时脚本(_validate_tmp_0731/_node_map_run) 跑完已删

## 2026-07-30 (morning, ~08:56)
- 批次日期: 2026-07-30（morning 槽，近24h）；候选池约 46 条（微博/百度/头条/知乎/抖音 5 指数 + 央媒/部委编辑源；腾讯热榜抓取失败但 ≥4 指数已满足；百度经 tophub 拦截后改抓 top.baidu.com 成功）
- 入库: 15 条（1 特大 + 14 非特大），日期键插入 NEWS_DATA 首位；删除最旧 2026-07-23，日期数保持 7（07-30~07-24）
- 特大(1): #1 日本熊本接连强震（14死/余震近200次/半导体停产），跨微博+百度+头条+知乎 4 指数
- 本批条目: 熊本强震(risk_society/globalization/econ_supply_demand,major,research)、乐事毛粉(econ_adverse_selection/deviance/econ_moral_hazard)、宁波无人岛(econ_public_goods/law/digital)、老人羊奶会销(emotional_labor/econ_behavioral/socialization)、美团盗刷(econ_moral_hazard/technology/psy_loss_aversion)、修手机私密照(panopticon/goffman/digital,research)、王的猜想洛阳纸贵(capital_forms/media/education)、勐腊老师打学生(psy_obedience/psy_milgram/education)、智驾小蓝灯禁用(technology/rationalization_concept/law)、最高法脱产学历批复(econ_human_capital/institutionalism/work)、GDP十强重庆反超广州(econ_gdp/urban/stratification)、美联储按兵不动三反对票(econ_monetary_policy/econ_inflation/globalization)、6月彩票新高(econ_behavioral/econ_public_finance/durkheim)、打赏650万驳回(media/family/psy_conformity,research)、内存涨300%(econ_supply_demand/technology/globalization)
- 学科覆盖: soc 14 / econ 10 / psy 5，三科全覆盖；15 条全 strong
- S9 前沿研究: 3 条（#1 Ding/Lam/Cheng/Zhou 2021 IJPE 熊本地震跨国供应链传染 fromNode=globalization，作者经 sciencedirect 原文页 WebFetch 核实；#6 Ceci/Stegman/Khan 2023 IEEE S&P "No Privacy in the Electronics Repair Industry" arxiv 2211.05824 fromNode=panopticon；#14 Liu 等 2025 J. Retailing & Consumer Services 准社会关系与打赏 fromNode=media）
- 节点id: 全部∈311节点集，label 与节点名逐条程序化比对（本轮自检脚本新增 lens/label==节点名 断言）；capital_forms/digital/urban/reflexivity 实测在集合内（reminder 的 stale 列表以实时提取为准）
- 校验: 自写校验（字段/url/theory/lensId/label/research.fromNode/外文字符扫描）全过 + 临时副本注入全套桩后 `node news-validate.js` → **FAIL=0 WARN=0**（7日期各15条）
- S5 去重: 王虹获奖 07-24 首报，本批《王的猜想》取"报纸加印洛阳纸贵"新进展角度合规；世界杯仅取彩票数据新角度
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 部署: deploy-netlify.js 退出码 0，Production https://shehui-ren.com（deploy id 6a6aa9c4771a6e95403f59b3）
- 红线: 未改 sociology-map.html/deploy 脚本/.netlify_token；临时脚本(_tmp_trim/_tmp_verify/_tmp_validate) 跑完已删

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

## 2026-08-08 (morning, ~09:25)
- 批次日期: 2026-08-08（morning 槽，近24h）；候选池约 50 条（微博/百度/知乎/抖音/头条 + 央媒/部委编辑源）
- 入库: 15 条（3 特大 + 12 非特大），日期键插入 NEWS_DATA 首位；删除最旧 2026-08-01，日期数保持 7（08-08~08-02）
- 特大(3, 均≥4平台): #1 BESIII证实胶球(science,5平台,research)、#2 北京优化住房限购(urban/econ_welfare/stratification,5平台)、#3 东航提前14天免费退改(econ_behavioral/law,4平台)
- 非特大(12): 藏蓝青春段宇(youth/socialization,themePick)、全民健身日健康中国(health/socialization,themePick)、上饶男童扶梯被救(social_capital/socialization)、承欢膝下古语刷屏(family/socialization/psy_attachment)、幼儿园关停潮2.14万所(stratification/family/education)、雷州特教招聘违规(institutionalism/law/stratification)、智能网联汽车强制国标(technology/law/rationalization_concept)、中百之家坑老直播(deviance/health/psy_cognitive_bias)、网信办个人信息保护规定(law/technology/digital)、宜宾高县4.9级地震(risk_society/urban)、用电负荷15.57亿千瓦(environment/econ_growth)、前7月进出口30万亿(econ_macro/globalization,themePick)
- 学科覆盖: soc 15 / econ 4 / psy 2，三科全覆盖；节点 id 全部∈311节点集
- S9 前沿研究: 1 条（#1 BESIII → Glueball domination in X(2370) established by the BESIII experiment, arXiv:2607.20366, fromNode=science），嵌 interpretation.research，url 真实、fromNode∈311节点集
- S2.5 青春家国主题配额 3 条(#4 藏蓝青春、#5 全民健身日、#15 进出口30万亿)标记 themePick
- 质检: `node news-validate.js` → **FAIL=0 WARN=0**（7日期各15条，311节点）；全量非中文字符扫描无偶然外文混入
- S5 去重: 台风"白海豚"已于 08-05/06/07 连发三天达上限 → 08-08 不续发（列入 rejected）
- S0 剔除/未纳入: 国际政治(特朗普/伊朗)、娱乐八卦、纯UGC个人帖、网传无源灾情、纯弱关联单点候选
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 部署: **Netlify 失败** —— `node deploy-netlify.js` 生产+草稿均报 `Unauthorized: could not retrieve project`；经 API 直连核验 `.netlify_token`(nfp_...，40字节) 返回 HTTP 401 Access Denied，**令牌已失效/过期**，需用户登录 Netlify 重新生成 Personal Access Token 写入 ctrip-claw/.netlify_token 后方可恢复生产发布
- 兜底: 因 Netlify 不可达，改走 **Gitee 同步**（`git add news-data.js news-review-log.json` → commit "news: auto-sync 2026-08-08" → push master，退出码 0），Mac 端 `git pull` 即获本批新闻；远程 URL 已重置
- 红线: 未改 sociology-map.html/deploy-netlify.js/.netlify_token；临时脚本(_mk_0808/_fix_quote/_inspect_0808/_mk_log_0808) 跑完已删

## 2026-08-11 (morning, ~09:45)
- 批次日期: 2026-08-11（morning 槽，近24h）；候选池约 50 条（微博/百度/知乎/抖音/头条 + 央媒/部委编辑源）
- 入库: 15 条（3 特大 + 12 非特大），日期键插入 NEWS_DATA 首位；删除最旧 2026-08-02，日期数保持 7（08-11~08-03）
- 特大(3, 均≥4平台): #1 存款降息加息两极分化(econ_monetary_policy/econ_macro/econ_new_keynesian,5平台)、#2 钟睒睒呼吁限制平台权力(econ_monopoly/digital/technology,5平台)、#3 白海豚过境上海宝山转移2.3万人+社区互助(risk_society/social_capital/socialization,5平台,新进展角度续发)
- 非特大(12): 高职分数线超本科(education/stratification/cultural_capital,themePick)、江西村自建免费泳池(institutionalism/socialization/social_capital)、就业职业伤害保障(econ_labor/precariat/econ_welfare,themePick)、出生证7分钟改革(institutionalism/digital/rationalization_theory)、自建房新规禁下乡买宅基地(econ_institution/urban/institutionalism)、驾培垄断整治(econ_monopoly/law/econ_institution)、视频号AI带货标注(technology/law/digital)、AI识菇中毒(technology/health/digital)、贪凉吃冷饮女童肺阴影(health/socialization/family)、哥伦比亚7.5级强震(risk_society/social_solidarity/health)、美团服务消费节一老一小(econ_institution/digital/social_capital)、国家标准338项(science/institutionalism/econ_public_finance,themePick)
- 学科覆盖: soc / econ / psy 三科全覆盖（每条均含多视角解读）
- S9 前沿研究: 1 条（#3 白海豚/社区互助 → Aldrich & Meyer 2015 "Social Capital and Community Resilience" American Behavioral Scientist 59(2):254-269 DOI 10.1177/0002764214550299 fromNode=social_capital），嵌 interpretation.research，url 真实(DOI)、fromNode∈311节点集
- S2.5 青春家国主题配额 3 条(#4 高职超本科线、#6 就业保障、#15 国家标准)标记 themePick
- 质检: 自写校验（字段/url/theory/lensId/research.fromNode/essayTopics/essayQuote长度100-160）全过 → FAIL=0；节点 id 全部∈311节点集；essayQuote 全部 100+ 字（站点既有标准 118-150，本批 102-114）
- 重要修复: 上次（中断）会话曾因 Edit 串扰损坏 08-08 块、误删 08-02、且重建时把 08-06/08-04/08-03 的 essayQuote 清空；本次用「本地 08-11 块 + 镜像忠实块（08-08~08-03）」重新 eval+重组修复：修正 #6 theory social_policy→econ_welfare、#11 lensId/theory info_cocoon→media/digital（info_cocoon 仅保留为 essayTopic），补齐 08-06/08-04/08-03 的 essayQuote（来自镜像），并将 15 条 essayQuote 扩写至 100+ 字应试金句
- S0 剔除/未纳入: 国际政治(特朗普/伊朗)、娱乐八卦、纯UGC个人帖、网传无源灾情、白海豚旧角度(08-05/06/07已连发三天，本次仅新进展角度续发)
- 同步: news-data.js + news-review-log.json 已 cp 至 D:/Users/wtianyi/ctrip-claw/
- 部署: deploy-netlify.js 生产+草稿均报 Unauthorized/401（.netlify_token 自 08-08 起持续失效）→ 未发布到 shehui-ren.com；兜底走 **Gitee 同步**（git commit news-data.js news-review-log.json → push master），Mac 端 git pull 即获本批新闻
- 红线: 未改 sociology-map.html/deploy-netlify.js/.netlify_token；临时脚本(_inspect/_rebuild/_patch/_quote/_report/_mklog_0811) 跑完已删
