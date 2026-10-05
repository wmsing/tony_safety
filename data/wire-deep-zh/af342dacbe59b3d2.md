---
id: af342dacbe59b3d2
title: Johnson Controls EasyIO Neo Series EC and CW Controllers
url: "https://www.cisa.gov/news-events/ics-advisories/icsa-26-274-05"
sourceId: "rss:cisa"
sourceLabel: CISA
publishedAt: "2026-10-01T12:00:00.000Z"
fetchedAt: "2026-10-05T03:32:12.258Z"
---
[**查看 CSAF**](https://github.com/cisagov/CSAF/blob/develop/csaf_files/OT/white/2026/icsa-26-274-05.json)

## 摘要

**成功利用此漏洞可能允许攻击者拦截并读取敏感信息，包括凭据和会话数据。**

以下 Johnson Controls EasyIO Neo 系列 EC 和 CW 控制器版本受到影响：

*   EasyIO Neo 系列 EC 控制器 V3.3b62 (CVE-2026-64893)
*   EasyIO Neo 系列 EC 控制器 V3.3b63 (CVE-2026-64893)
*   EasyIO Neo 系列 CW 控制器 V3.3b24 (CVE-2026-64893)
*   EasyIO Neo 系列 CW 控制器 V3.3b25 (CVE-2026-64893)

CVSS

厂商

设备

漏洞

v3 5.4

Johnson Controls

Johnson Controls EasyIO Neo 系列 EC 和 CW 控制器

敏感信息的明文传输

### 背景

*   **关键基础设施部门：** 关键制造、商业设施、政府服务和设施、运输系统、能源
*   **部署国家/地区：** 全球
*   **公司总部所在地：** 爱尔兰

* * *

## 漏洞

[展开全部 +](#)

### [CVE-2026-64893](#)

Johnson Controls 已发现 EasyIO Neo 中存在一个漏洞，攻击者可能利用该漏洞拦截并读取通过网络以明文传输的敏感信息（包括凭据和会话数据）。成功利用此漏洞可能导致技术或运营影响。EasyIO Neo 是一种可编程楼宇自动化边缘控制器，用于通过基于 Web 的界面管理和自动化商业建筑中的 HVAC、照明和能源系统。

[查看 CVE 详情](https://www.cve.org/CVERecord?id=CVE-2026-64893)

* * *

#### 受影响产品

##### Johnson Controls EasyIO Neo 系列 EC 和 CW 控制器

**厂商：**  
Johnson Controls

**产品版本：**  
Johnson Controls EasyIO Neo 系列 EC 控制器：V3.3b62, Johnson Controls EasyIO Neo 系列 EC 控制器：V3.3b63, Johnson Controls EasyIO Neo 系列 CW 控制器：V3.3b24, Johnson Controls EasyIO Neo 系列 CW 控制器：V3.3b25

**产品状态：**  
known\_affected

**相关 CWE：** [CWE-319 敏感信息的明文传输](https://cwe.mitre.org/data/definitions/319.html)

* * *

#### 指标

CVSS 版本

基础分数

基础严重性

向量字符串

3.1

5.4

MEDIUM

[CVSS:3.1/AV:N/AC:H/PR:L/UI:R/S:U/C:H/I:L/A:N](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:H/PR:L/UI:R/S:U/C:H/I:L/A:N)

4.0

5.9

MEDIUM

[CVSS:4.0/AV:N/AC:H/AT:P/PR:L/UI:P/VC:H/VI:L/VA:L/SC:N/SI:N/SA:N](https://www.first.org/cvss/calculator/4.0#CVSS:4.0/AV:N/AC:H/AT:P/PR:L/UI:P/VC:H/VI:L/VA:L/SC:N/SI:N/SA:N)

* * *

## 致谢

*   Gabriele Gardois 向 Johnson Controls 报告了此漏洞

* * *

## 法律声明和使用条款

本产品受本通知 ([https://www.cisa.gov/notification](https://www.cisa.gov/notification)) 和隐私及使用政策 ([https://www.cisa.gov/privacy-policy](https://www.cisa.gov/privacy-policy)) 约束。

* * *

## 建议做法

CISA 建议用户采取防御措施，以最大限度地降低利用此漏洞的风险。CISA 提醒组织在部署防御措施之前进行适当的冲击分析和风险评估。

CISA 还在 cisa.gov/ics 上的 ICS 网页上提供了控制系统安全建议做法部分。有几款 CISA 产品可供阅读和下载，详细介绍网络防御最佳实践，包括《通过纵深防御策略改进工业控制系统网络安全》。

CISA 鼓励组织实施针对 ICS 资产主动防御的建议网络安全策略。

关于 ICS-TIP-12-146-01B--Targeted Cyber Intrusion Detection and Mitigation Strategies（定向网络入侵检测与缓解策略）的技术信息论文，可在 cisa.gov/ics 上的 ICS 网页上找到公开的额外缓解指南和建议做法。

观察到疑似恶意活动的组织应遵循既定的内部程序，并将发现报告给 CISA 以进行跟踪和与其他事件关联。

目前尚未向 CISA 报告任何专门针对此漏洞的已知公开利用情况。此漏洞具有较高的攻击复杂度。

* * *

## 修订历史

*   **初始发布日期：** 2026-10-01

日期

修订版

摘要

2026-10-01

1

Johnson Controls 产品安全公告 JCI-PSA-2026-30 的初始重新发布

* * *

## 法律声明和使用条款
