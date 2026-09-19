---
id: 4fdefba1eb2b25aa
title: Hitachi Energy FACTS Control Platform (FCP)
url: "https://www.cisa.gov/news-events/ics-advisories/icsa-26-260-03"
sourceId: "rss:cisa"
sourceLabel: CISA
publishedAt: "2026-09-17T12:00:00.000Z"
fetchedAt: "2026-09-19T06:28:43.346Z"
---
[**View CSAF**](https://github.com/cisagov/CSAF/blob/develop/csaf_files/OT/white/2026/icsa-26-260-03.json)

## Summary

**Hitachi Energy is aware of vulnerabilities that affect the FACTS Control systems with GWS component listed in this document. An attacker exploiting these vulnerabilities can cause impact on confidentiality, integrity and availability of the product. Following FACTS Control systems with GWS component deployed from year 2020 onwards are likely affected by the above vulnerabilities. Product deployments without GWS component are not affected. • SVC Light (STATCOM) • Fixed Series Capacitor • Thyristor Controlled Series Capacitor • Static Var Compensator • Static Watt Compensator • Hybrid Synchronous Condensers Please refer to the Recommended Immediate Actions for information about the mitigation/remediation. The affected FCP versions are only applicable if GWS component is present.**

The following versions of Hitachi Energy FACTS Control Platform (FCP) are affected:

*   FACTS Control Platform (FCP) 3.4.0, 3.7.0, 3.8.0, 3.10.0, 3.12.0, 3.14.0, 3.15.0, 4.0.0, 4.0.1, 4.1.0, 4.1.1 (CVE-2024-4872, CVE-2024-3980, CVE-2024-3982, CVE-2024-7940, CVE-2024-7941)

CVSS

Vendor

Equipment

Vulnerabilities

v3 9.9

Hitachi Energy

Hitachi Energy FACTS Control Platform (FCP)

Improper Neutralization of Special Elements in Data Query Logic, Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal'), Authentication Bypass by Capture-replay, Missing Authentication for Critical Function, URL Redirection to Untrusted Site ('Open Redirect')

### Background

*   **Critical Infrastructure Sectors:** Energy
*   **Countries/Areas Deployed:** Worldwide
*   **Company Headquarters Location:** Switzerland

* * *

## Vulnerabilities

[Expand All +](#)

### [CVE-2024-4872](#)

A vulnerability exists in the query validation of the FACTS Control system with GWS component. If exploited this could allow an authenticated attacker to inject code towards persistent data. Note that to successfully exploit this vulnerability an attacker must have a valid credential.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2024-4872)

* * *

#### Affected Products

##### Hitachi Energy FACTS Control Platform (FCP)

**Vendor:**  
Hitachi Energy

**Product Version:**  
FACTS Control Platform (FCP) version 3.4.0, FACTS Control Platform (FCP) version 3.7.0, FACTS Control Platform (FCP) version 3.8.0, FACTS Control Platform (FCP) version 3.10.0, FACTS Control Platform (FCP) version 3.12.0, FACTS Control Platform (FCP) version 3.14.0, FACTS Control Platform (FCP) version 3.15.0, FACTS Control Platform (FCP) version 4.0.0, FACTS Control Platform (FCP) version 4.0.1, FACTS Control Platform (FCP) version 4.1.0, FACTS Control Platform (FCP) version 4.1.1

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-943 Improper Neutralization of Special Elements in Data Query Logic](https://cwe.mitre.org/data/definitions/943.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

9.9

CRITICAL

[CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H)

### [CVE-2024-3980](#)

The FACTS Control system with GWS allows an authenticated user input to control or influence paths or file names that are used in filesystem operations. If exploited the vulnerability allows the attacker to access or modify system files or other files that are critical to the application.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2024-3980)

* * *

#### Affected Products

##### Hitachi Energy FACTS Control Platform (FCP)

**Vendor:**  
Hitachi Energy

**Product Version:**  
FACTS Control Platform (FCP) version 3.4.0, FACTS Control Platform (FCP) version 3.7.0, FACTS Control Platform (FCP) version 3.8.0, FACTS Control Platform (FCP) version 3.10.0, FACTS Control Platform (FCP) version 3.12.0, FACTS Control Platform (FCP) version 3.14.0, FACTS Control Platform (FCP) version 3.15.0, FACTS Control Platform (FCP) version 4.0.0, FACTS Control Platform (FCP) version 4.0.1, FACTS Control Platform (FCP) version 4.1.0, FACTS Control Platform (FCP) version 4.1.1

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-22 Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal')](https://cwe.mitre.org/data/definitions/22.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

9.9

CRITICAL

[CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H)

### [CVE-2024-3982](#)

An attacker with local access to machine where FACTS Control system with GWS is installed, could enable the session logging supporting the product and try to exploit a session hijacking of an already established session. Note: By default, the session logging level is not enabled and only users with administrator rights can enable it.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2024-3982)

* * *

#### Affected Products

##### Hitachi Energy FACTS Control Platform (FCP)

**Vendor:**  
Hitachi Energy

**Product Version:**  
FACTS Control Platform (FCP) version 3.10.0, FACTS Control Platform (FCP) version 3.12.0, FACTS Control Platform (FCP) version 3.14.0, FACTS Control Platform (FCP) version 3.15.0, FACTS Control Platform (FCP) version 4.0.0, FACTS Control Platform (FCP) version 4.0.1, FACTS Control Platform (FCP) version 4.1.0, FACTS Control Platform (FCP) version 4.1.1

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-294 Authentication Bypass by Capture-replay](https://cwe.mitre.org/data/definitions/294.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

8.2

HIGH

[CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:C/C:H/I:H/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:C/C:H/I:H/A:H)

### [CVE-2024-7940](#)

The FACTS Control system with GWS product exposes a service that is intended for local only to all network interfaces without any authentication.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2024-7940)

* * *

#### Affected Products

##### Hitachi Energy FACTS Control Platform (FCP)

**Vendor:**  
Hitachi Energy

**Product Version:**  
FACTS Control Platform (FCP) version 3.14.0, FACTS Control Platform (FCP) version 3.15.0, FACTS Control Platform (FCP) version 4.0.0, FACTS Control Platform (FCP) version 4.0.1, FACTS Control Platform (FCP) version 4.1.0, FACTS Control Platform (FCP) version 4.1.1

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-306 Missing Authentication for Critical Function](https://cwe.mitre.org/data/definitions/306.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

8.3

HIGH

[CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:C/C:H/I:H/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:C/C:H/I:H/A:H)

### [CVE-2024-7941](#)

A vulnerability exists in FACTS Control system with GWS where a HTTP parameter may contain a URL value and could cause the web application to redirect the request to the specified URL. By modifying the URL value to a malicious site, an attacker may successfully launch a phishing scam and steal user credentials.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2024-7941)

* * *

#### Affected Products

##### Hitachi Energy FACTS Control Platform (FCP)

**Vendor:**  
Hitachi Energy

**Product Version:**  
FACTS Control Platform (FCP) version 3.15.0, FACTS Control Platform (FCP) version 4.1.0, FACTS Control Platform (FCP) version 4.1.1

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-601 URL Redirection to Untrusted Site ('Open Redirect')](https://cwe.mitre.org/data/definitions/601.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

4.3

MEDIUM

[CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N)

* * *

## Acknowledgments

*   Hitachi Energy reported these vulnerabilities to CISA.

* * *

## Notice

The information in this document is subject to change without notice and should not be construed as a commitment by Hitachi Energy. Hitachi Energy provides no warranty, express or implied, including warranties of merchantability and fitness for a particular purpose, for the information contained in this document, and assumes no responsibility for any errors that may appear in this document. In no event shall Hitachi Energy or any of its suppliers be liable for direct, indirect, special, incidental or consequential damages of any nature or kind arising from the use of this document, or from the use of any hardware or software described in this document, even if Hitachi Energy or its suppliers have been advised of the possibility of such damages. This document and parts hereof must not be reproduced or copied without written permission from Hitachi Energy and the contents hereof must not be imparted to a third party nor used for any unauthorized purpose. All rights to registrations and trademarks reside with their respective owners.

* * *

## Support

For additional information and support please contact your product provider or Hitachi Energy service organization. For contact information, see [https://www.hitachienergy.com/contact-us/](https://www.hitachienergy.com/contact-us/) for Hitachi Energy contact-centers.

* * *

## General Mitigation Factors

Recommended security practices and firewall configurations can help protect a process control network from attacks that originate from outside the network. Such practices include that process control systems are physically protected from direct access by unauthorized personnel, have no direct connections to the Internet, and are separated from other networks by means of a firewall system that has a minimal number of ports exposed, and others that have to be evaluated case by case. Process control systems should not be used for Internet surfing, instant messaging, or receiving e-mails. Portable computers and removable storage media should be carefully scanned for viruses before they are connected to a control system. Proper password policies and processes should be followed. Additional information on Industrial Control Systems Cybersecurity Best Practices can be found in the Hitachi Energy “Industrial Control Systems Cybersecurity Best Practices” Cybersecurity Notification. \[1\]

* * *

## SSVC

SSVCv2/E:N/A:N/2026-07-24T09:43:32Z/

* * *

## Legal Notice and Terms of Use

This product is provided subject to this Notification ([https://www.cisa.gov/notification](https://www.cisa.gov/notification)) and this Privacy & Use policy ([https://www.cisa.gov/privacy-policy](https://www.cisa.gov/privacy-policy)).

* * *

## Recommended Practices

CISA recommends users take defensive measures to minimize the exploitation risk of this vulnerability.

*   Minimize network exposure for all control system devices and/or systems, and ensure they are not accessible from the internet.
*   Locate control system networks and remote devices behind firewalls and isolate them from business networks.
*   When remote access is required, use more secure methods, such as Virtual Private Networks (VPNs), recognizing VPNs may have vulnerabilities and should be updated to the most recent version available. Also recognize VPN is only as secure as its connected devices.

CISA reminds organizations to perform proper impact analysis and risk assessment prior to deploying defensive measures.

CISA also provides a section for control systems security recommended practices on the ICS webpage on cisa.gov. Several CISA products detailing cyber defense best practices are available for reading and download, including Improving Industrial Control Systems Cybersecurity with Defense-in-Depth Strategies.

CISA encourages organizations to implement recommended cybersecurity strategies for proactive defense of ICS assets. Additional mitigation guidance and recommended practices are publicly available on the ICS webpage at cisa.gov in the technical information paper, ICS-TIP-12-146-01B--Targeted Cyber Intrusion Detection and Mitigation Strategies.

Organizations observing suspected malicious activity should follow established internal procedures and report findings to CISA for tracking and correlation against other incidents.

* * *
