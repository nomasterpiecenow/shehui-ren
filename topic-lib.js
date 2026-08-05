/* TOPIC_LIB — 受控词表：作文主题标签库（社会人 · 社会热点模块）
 * 版本：shehui-topics-v1  (2026-08-05)
 * 设计原则（防标签膨胀 / 防语义漂移）：
 *   1. 封闭词表：自动标注只可从中多选，不可造词；新增标签须人工评审并 bump 版本。
 *   2. 每个标签带定义(def) + 维度(dim)锁定语义，LLM/人与按同一把尺子分类。
 *   3. 纯关键词维度（青春/家国/思辨）用 keywords 兜底，仍限定在词表内。
 *   注：本阶段作文主题【不关联】社科知识节点（nodes 字段暂不使用），待后续阶段再评估。
 * 加载：<script src="topic-lib.js"></script> （置于 news-data.js 之后、主脚本之前）
 */
var TOPIC_LIB = {
  version: 'shehui-topics-v1',
  updated: '2026-08-05',
  note: '受控词表：作文主题标签库。自动标注只可从中多选，不可造词；新增标签须人工评审并 bump 版本。',
  topics: {
    /* —— 维度一：青春成长·青年担当 —— */
    youth_struggle: { id:'youth_struggle', label:'青春奋斗', dim:'青春成长·青年担当',
      def:'青年在成长中拼搏、追梦，以行动书写自身价值。',
      keywords:['青春','青年','年轻人','大学生','学生','奋斗','拼搏','追梦','梦想'] },
    youth_duty: { id:'youth_duty', label:'青年责任', dim:'青春成长·青年担当',
      def:'年轻一代对家庭、社会、时代应有的担当与使命。',
      keywords:['青年责任','青年担当','担当','使命','责任心'] },
    self_vs_greater: { id:'self_vs_greater', label:'小我与大我', dim:'青春成长·青年担当',
      def:'个人价值与集体、时代洪流的关系与权衡。',
      keywords:['小我','大我','集体','个人与集体','融入'] },
    ideal_action: { id:'ideal_action', label:'理想与实干', dim:'青春成长·青年担当',
      def:'理想需落于行动，拒绝空谈与虚浮。',
      keywords:['理想','实干','空谈','行动派','务实'] },
    no_lying_flat: { id:'no_lying_flat', label:'拒绝躺平', dim:'青春成长·青年担当',
      def:'面对压力不消极退缩，保持向上的生命力。',
      keywords:['躺平','内卷','摆烂','佛系'] },

    /* —— 维度二：家国情怀·时代使命 —— */
    nation_resonance: { id:'nation_resonance', label:'家国同频', dim:'家国情怀·时代使命',
      def:'个人命运与民族、国家发展的同频共振。',
      keywords:['家国','民族','爱国','复兴','祖国','本土'] },
    times_mission: { id:'times_mission', label:'时代使命', dim:'家国情怀·时代使命',
      def:'身处大时代，个体与群体被赋予的历史任务。',
      keywords:['时代','新征程','历史方位','变局'] },
    ordinary_great: { id:'ordinary_great', label:'平凡伟大', dim:'家国情怀·时代使命',
      def:'平凡岗位上的坚守与奉献，亦可成就不凡。',
      keywords:['平凡','伟大','英雄','奉献','凡人'] },

    /* —— 维度三：文化自信·传统创新 —— */
    inherit_innovate: { id:'inherit_innovate', label:'守正创新', dim:'文化自信·传统创新',
      def:'在守住根基的前提下推陈出新，传统与当代相接。',
      keywords:['守正创新','传承','推陈出新','非遗'] },
    tradition_activate: { id:'tradition_activate', label:'传统文化活化', dim:'文化自信·传统创新',
      def:'让传统文脉在当下生活中重新流动、被理解。',
      keywords:['传统文化','活化','国风','文物','典籍'] },
    civ_exchange: { id:'civ_exchange', label:'文明互鉴', dim:'文化自信·传统创新',
      def:'不同文明在流动与对话中相互照见、彼此滋养。',
      keywords:['文明','互鉴','文化交流','包容'] },

    /* —— 维度四：科技与人文 —— */
    tech_for_good: { id:'tech_for_good', label:'科技向善', dim:'科技与人文',
      def:'技术应服务于人，警惕其反噬与工具化。',
      keywords:['科技向善','技术赋能','以人为本'] },
    ai_ethics: { id:'ai_ethics', label:'AI伦理', dim:'科技与人文',
      def:'智能时代的权利、边界与人的主体性问题。',
      keywords:['AI','人工智能','算法','智能','大模型'] },
    info_cocoon: { id:'info_cocoon', label:'信息茧房', dim:'科技与人文',
      def:'算法投喂让人困于同质信息，丧失广阔视野。',
      keywords:['信息茧房','茧房','回音壁','算法推荐','过滤气泡'] },
    virtual_real: { id:'virtual_real', label:'虚拟与真实', dim:'科技与人文',
      def:'虚拟世界对真实关系、真实自我的冲击与重构。',
      keywords:['虚拟','元宇宙','真实','沉浸','线上'] },

    /* —— 维度五：思辨辩证 —— */
    gain_loss: { id:'gain_loss', label:'得与失', dim:'思辨辩证',
      def:'得失相生，取舍之间见格局与智慧。',
      keywords:['得与失','得失','利弊','取舍','代价'] },
    fast_slow: { id:'fast_slow', label:'快与慢', dim:'思辨辩证',
      def:'效率与从容的张力，在加速时代为节奏辩护。',
      keywords:['快与慢','快慢','节奏','慢生活','提速'] },
    freedom_rules: { id:'freedom_rules', label:'自由与规则', dim:'思辨辩证',
      def:'个体自由与公共秩序的边界与平衡。',
      keywords:['自由与规则','规则','秩序','边界','底线'] },
    persist_flex: { id:'persist_flex', label:'坚守与变通', dim:'思辨辩证',
      def:'原则性与灵活性的辩证，因时因地而制宜。',
      keywords:['坚守与变通','变通','灵活','因地制宜','原则'] },

    /* —— 维度六：道德修养·价值选择 —— */
    integrity: { id:'integrity', label:'诚信', dim:'道德修养·价值选择',
      def:'信任的基石，社会协作的最低成本纽带。',
      keywords:['诚信','守信','欺诈','造假','信任危机'] },
    duty_devote: { id:'duty_devote', label:'责任奉献', dim:'道德修养·价值选择',
      def:'在岗位与关系中主动担责、乐于付出。',
      keywords:['奉献','责任感','敬业','付出','利他'] },
    altruism: { id:'altruism', label:'利他', dim:'道德修养·价值选择',
      def:'超越自利，对他人与共同体伸出援手。',
      keywords:['利他','互助','志愿','善意','共情'] },
    righteousness_interest: { id:'righteousness_interest', label:'义与利', dim:'道德修养·价值选择',
      def:'道义与利益之间的人生与商业抉择。',
      keywords:['义利','功利','名利','贪婪','底线'] },

    /* —— 维度七：社会现实·人类关怀 —— */
    fairness: { id:'fairness', label:'公平正义', dim:'社会现实·人类关怀',
      def:'资源、机会与尊严的公平分配，是社会良序之本。',
      keywords:['公平','正义','贫富','歧视','不均','弱势群体'] },
    trust: { id:'trust', label:'信任', dim:'社会现实·人类关怀',
      def:'人际与制度间可信赖的预期，降低合作成本。',
      keywords:['信任','失信','信任危机','口碑'] },
    prejudice: { id:'prejudice', label:'偏见与歧视', dim:'社会现实·人类关怀',
      def:'把某群体标记为外人、以刻板眼光剥夺平等尊重。',
      keywords:['歧视','偏见','刻板','排外','标签化'] },
    community: { id:'community', label:'共同体', dim:'社会现实·人类关怀',
      def:'人与人之间守望相助、命运相连的有机连结。',
      keywords:['共同体','社区','团结','守望','邻里'] },

    /* —— 维度八：生态文明·人与自然 —— */
    harmony_nature: { id:'harmony_nature', label:'人与自然和谐', dim:'生态文明·人与自然',
      def:'摒弃人类中心，重启与自然的共生关系。',
      keywords:['自然','生态','环境','人与自然','共生'] },
    green_dev: { id:'green_dev', label:'绿色发展', dim:'生态文明·人与自然',
      def:'经济增长与生态承载相协调的可持续之路。',
      keywords:['绿色','低碳','可持续','环保','转型'] },
    risk_uncertain: { id:'risk_uncertain', label:'风险与不确定', dim:'生态文明·人与自然',
      def:'现代社会的危险更多来自互联系统的不确定。',
      keywords:['风险','不确定','灾害','危机','脆弱'] },

    /* —— 维度九：读书学习·自我认知 —— */
    lifelong_learn: { id:'lifelong_learn', label:'终身学习', dim:'读书学习·自我认知',
      def:'学习是贯穿一生的能力，而非阶段性任务。',
      keywords:['学习','读书','教育','终身','求知'] },
    deep_think: { id:'deep_think', label:'深度思考', dim:'读书学习·自我认知',
      def:'在碎片化中保持独立判断与深入探究的耐心。',
      keywords:['思考','深度','理性','独立判断','逻辑'] },
    self_aware: { id:'self_aware', label:'自我认知', dim:'读书学习·自我认知',
      def:'认识自己的情绪、边界与内在驱动力。',
      keywords:['自我','认知','心理','情绪','内在','成长'] },
    knowledge_anxiety: { id:'knowledge_anxiety', label:'知识焦虑', dim:'读书学习·自我认知',
      def:'信息过载时代对落后的不安与焦灼。',
      keywords:['焦虑','知识焦虑','信息过载','落后','内耗'] }
  }
};
if (typeof module !== 'undefined' && module.exports) module.exports = TOPIC_LIB;
