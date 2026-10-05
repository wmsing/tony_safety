---
id: af342dacbe59b3d2
title: Johnson Controls EasyIO Neo Series EC and CW Controllers
url: "https://www.cisa.gov/news-events/ics-advisories/icsa-26-274-05"
sourceId: "rss:cisa"
sourceLabel: CISA
publishedAt: "2026-10-01T12:00:00.000Z"
fetchedAt: "2026-10-05T03:32:12.258Z"
---
[**View CSAF**](https://github.com/cisagov/CSAF/blob/develop/csaf_files/OT/white/2026/icsa-26-274-05.json)

## Summary

**Successful exploitation of this vulnerability could allow an attacker tointercept and read sensitive information, including credentials andsession data.**

The following versions of Johnson Controls EasyIO Neo Series EC and CW Controllers are affected:

*   EasyIO Neo Series EC Controllers V3.3b62 (CVE-2026-64893)
*   EasyIO Neo Series EC Controllers V3.3b63 (CVE-2026-64893)
*   EasyIO Neo Series CW Controllers V3.3b24 (CVE-2026-64893)
*   EasyIO Neo Series CW Controllers V3.3b25 (CVE-2026-64893)

CVSS

Vendor

Equipment

Vulnerabilities

v3 5.4

Johnson Controls

Johnson Controls EasyIO Neo Series EC and CW Controllers

Cleartext Transmission of Sensitive Information

### Background

*   **Critical Infrastructure Sectors:** Critical Manufacturing, Commercial Facilities, Government Services and Facilities, Transportation Systems, Energy
*   **Countries/Areas Deployed:** Worldwide
*   **Company Headquarters Location:** Ireland

* * *

## Vulnerabilities

[Expand All +](#)

### [CVE-2026-64893](#)

Johnson Controls is aware of a vulnerability in EasyIO Neo which may allow an attacker to intercept and read sensitive information, including credentials and session data, transmitted in cleartext over the network. Successful exploitation could result in technical or operational impact. EasyIO Neo is a programmable building automation edge controller used to manage and automate HVAC, lighting, and energy systems in commercial buildings through a web-based interface.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2026-64893)

* * *

#### Affected Products

##### Johnson Controls EasyIO Neo Series EC and CW Controllers

**Vendor:**  
Johnson Controls

**Product Version:**  
Johnson Controls EasyIO Neo Series EC Controllers: V3.3b62, Johnson Controls EasyIO Neo Series EC Controllers: V3.3b63, Johnson Controls EasyIO Neo Series CW Controllers: V3.3b24, Johnson Controls EasyIO Neo Series CW Controllers: V3.3b25

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-319 Cleartext Transmission of Sensitive Information](https://cwe.mitre.org/data/definitions/319.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

5.4

MEDIUM

[CVSS:3.1/AV:N/AC:H/PR:L/UI:R/S:U/C:H/I:L/A:N](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:H/PR:L/UI:R/S:U/C:H/I:L/A:N)

4.0

5.9

MEDIUM

[CVSS:4.0/AV:N/AC:H/AT:P/PR:L/UI:P/VC:H/VI:L/VA:L/SC:N/SI:N/SA:N](https://www.first.org/cvss/calculator/4.0#CVSS:4.0/AV:N/AC:H/AT:P/PR:L/UI:P/VC:H/VI:L/VA:L/SC:N/SI:N/SA:N)

* * *

## Acknowledgments

*   Gabriele Gardois reported this vulnerability to Johnson Controls

* * *

## Legal Notice and Terms of Use

This product is provided subject to this Notification ([https://www.cisa.gov/notification](https://www.cisa.gov/notification)) and this Privacy & Use policy ([https://www.cisa.gov/privacy-policy](https://www.cisa.gov/privacy-policy)).

* * *

## Recommended Practices

CISA recommends users take defensive measures to minimize the risk of exploitation of this vulnerability. CISA reminds organizations to perform proper impact analysis and risk assessment prior to deploying defensive measures.

CISA also provides a section for control systems security recommended practices on the ICS webpage on cisa.gov/ics. Several CISA products detailing cyber defense best practices are available for reading and download, including Improving Industrial Control Systems Cybersecurity with Defense-in-Depth Strategies.

CISA encourages organizations to implement recommended cybersecurity strategies for proactive defense of ICS assets.

Additional mitigation guidance and recommended practices are publicly available on the ICS webpage at cisa.gov/ics in the technical information paper, ICS-TIP-12-146-01B--Targeted Cyber Intrusion Detection and Mitigation Strategies.

Organizations observing suspected malicious activity should follow established internal procedures and report findings to CISA for tracking and correlation against other incidents.

No known public exploitation specifically targeting this vulnerability has been reported to CISA at this time. This vulnerability has a high attack complexity.

* * *

## Revision History

*   **Initial Release Date:** 2026-10-01

Date

Revision

Summary

2026-10-01

1

Initial Republication of Johnson Controls Product Security Advisory JCI-PSA-2026-30

* * *

## Legal Notice and Terms of Use
