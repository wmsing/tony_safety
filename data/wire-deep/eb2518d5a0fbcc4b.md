---
id: eb2518d5a0fbcc4b
title: Siemens Reyrolle 7SR5
url: "https://www.cisa.gov/news-events/ics-advisories/icsa-26-258-05"
sourceId: "rss:cisa"
sourceLabel: CISA
publishedAt: "2026-09-15T12:00:00.000Z"
fetchedAt: "2026-09-16T15:02:02.570Z"
---
[**View CSAF**](https://github.com/cisagov/CSAF/blob/develop/csaf_files/OT/white/2026/icsa-26-258-05.json)

## Summary

**Siemens Reyrolle 7SR5 Before V2.70 is affected by multiple vulnerabilities. Siemens has released a new version for Reyrolle 7SR5 and recommends to update to the latest version.**

The following versions of Siemens Reyrolle 7SR5 are affected:

*   Reyrolle 7SR5 vers:intdot/<2.70 (CVE-2024-42384, CVE-2024-42385, CVE-2024-42386, CVE-2024-42391, CVE-2024-42392, CVE-2026-62645, CVE-2026-62646, CVE-2026-62647, CVE-2026-62648, CVE-2026-62649, CVE-2026-62650, CVE-2026-62652, CVE-2026-62653, CVE-2026-62654)

CVSS

Vendor

Equipment

Vulnerabilities

v3 9.8

Siemens

Siemens Reyrolle 7SR5

Integer Overflow or Wraparound, Improper Neutralization of Delimiters, Use of Out-of-range Pointer Offset, Missing Authentication for Critical Function, Insufficient Entropy, Improper Input Validation, Out-of-bounds Write, Allocation of Resources Without Limits or Throttling, Authentication Bypass Using an Alternate Path or Channel, Insertion of Sensitive Information Into Debugging Code, Download of Code Without Integrity Check

### Background

*   **Critical Infrastructure Sectors:** Energy
*   **Countries/Areas Deployed:** Worldwide
*   **Company Headquarters Location:** Germany

* * *

## Vulnerabilities

[Expand All +](#)

### [CVE-2024-42384](#)

Integer Overflow or Wraparound vulnerability in Cesanta Mongoose Web Server v7.14 allows an attacker to send an unexpected TLS packet and produce a segmentation fault on the application.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2024-42384)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-190 Integer Overflow or Wraparound](https://cwe.mitre.org/data/definitions/190.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

7.5

HIGH

[CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H)

### [CVE-2024-42385](#)

Improper Neutralization of Delimiters vulnerability in Cesanta Mongoose Web Server v7.14 allows to trigger an out-of-bound memory write if the PEM certificate contains unexpected characters.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2024-42385)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-140 Improper Neutralization of Delimiters](https://cwe.mitre.org/data/definitions/140.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

4

MEDIUM

[CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:H)

### [CVE-2024-42386](#)

Use of Out-of-range Pointer Offset vulnerability in Cesanta Mongoose Web Server v7.14 allows an attacker to send an unexpected TLS packet and produce a segmentation fault on the application.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2024-42386)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-823 Use of Out-of-range Pointer Offset](https://cwe.mitre.org/data/definitions/823.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

8.2

HIGH

[CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:H)

### [CVE-2024-42391](#)

Use of Out-of-range Pointer Offset vulnerability in Cesanta Mongoose Web Server v7.14 allows an attacker to send an unexpected TLS packet and force the application to read unintended heap memory space.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2024-42391)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-823 Use of Out-of-range Pointer Offset](https://cwe.mitre.org/data/definitions/823.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

4.3

MEDIUM

[CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N)

### [CVE-2024-42392](#)

Improper Neutralization of Delimiters vulnerability in Cesanta Mongoose Web Server v7.14 allows to trigger an infinite loop bug if the input string contains unexpected characters.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2024-42392)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-140 Improper Neutralization of Delimiters](https://cwe.mitre.org/data/definitions/140.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

4

MEDIUM

[CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:H)

### [CVE-2026-62645](#)

Information is exposed through the web interface that can be used to calculate the current and past session ID numbers. This could allow an attacker to bypass the authentication and gain unauthorized access to the device.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2026-62645)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

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

9.8

CRITICAL

[CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)

### [CVE-2026-62646](#)

A session identifier is generated using an algorithm with insufficient randomness, resulting in a token with low entropy that can be predicted or brute-forced within a feasible number of attempts. This could allow an unauthenticated remote attacker to derive valid session identifiers and bypass authentication.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2026-62646)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-331 Insufficient Entropy](https://cwe.mitre.org/data/definitions/331.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

7.4

HIGH

[CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N)

### [CVE-2026-62647](#)

A random number generator is used to generate security-relevant values (such as session identifiers used for authentication purposes) that is not initialized with a True Random Number Generator (TRNG), resulting in a predictable sequence of generated values. This could allow an unauthenticated remote attacker to more easily predict the generated values and impersonate a legitimate authenticated user, potentially gaining unauthorized access to the device.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2026-62647)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-20 Improper Input Validation](https://cwe.mitre.org/data/definitions/20.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

7.4

HIGH

[CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N)

### [CVE-2026-62648](#)

The length of the URL component contained in pre-authenticated HTTP messages is not properly validated before appending additional data to it, resulting in an out-of-bounds write condition in memory. This could allow an unauthenticated remote attacker to crash the affected device, causing a reboot and resulting in a denial-of-service condition.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2026-62648)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-787 Out-of-bounds Write](https://cwe.mitre.org/data/definitions/787.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

7.5

HIGH

[CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H)

### [CVE-2026-62649](#)

The web server does not properly limit or manage system resources when processing a high volume of concurrent HTTP requests. This could allow an unauthenticated remote attacker to cause the entire device to crash and reboot, resulting in a denial-of-service condition.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2026-62649)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-770 Allocation of Resources Without Limits or Throttling](https://cwe.mitre.org/data/definitions/770.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

7.5

HIGH

[CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H)

### [CVE-2026-62650](#)

Server-side authorization checks in the web-based management interface are not properly enforced, allowing role-based access control (RBAC) restrictions to be bypassed through manipulation of request data. This could allow an authenticated, low-privileged remote attacker to escalate privileges to an administrative level.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2026-62650)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-288 Authentication Bypass Using an Alternate Path or Channel](https://cwe.mitre.org/data/definitions/288.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

8.8

HIGH

[CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H)

### [CVE-2026-62652](#)

The device firmware contains binaries from which debugging symbols have not been removed. This could allow an unauthenticated attacker with access to the publicly available firmware update files to more easily reverse engineer the device's firmware, facilitating the identification of further vulnerabilities.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2026-62652)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-215 Insertion of Sensitive Information Into Debugging Code](https://cwe.mitre.org/data/definitions/215.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

5.3

MEDIUM

[CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N)

### [CVE-2026-62653](#)

The input received over a proprietary communication protocol that is exposed when the device is placed into a special firmware-update mode is not properly validated, resulting in a memory corruption condition. This could allow an unauthenticated attacker with physical access to the device to cause a crash and potentially execute arbitrary code on the device.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2026-62653)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-787 Out-of-bounds Write](https://cwe.mitre.org/data/definitions/787.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

6.8

MEDIUM

[CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)

### [CVE-2026-62654](#)

A special maintenance mode can be activated via a physical key sequence during device boot, in which the device downloads and executes program code from a network server without verifying its authenticity or integrity. This could allow an attacker with physical access to the device to upload and execute arbitrary, unsigned code.

[View CVE Details](https://www.cve.org/CVERecord?id=CVE-2026-62654)

* * *

#### Affected Products

##### Siemens Reyrolle 7SR5

**Vendor:**  
Siemens

**Product Version:**  
Reyrolle 7SR5 < V2.70

**Product Status:**  
known\_affected

**Relevant CWE:** [CWE-494 Download of Code Without Integrity Check](https://cwe.mitre.org/data/definitions/494.html)

* * *

#### Metrics

CVSS Version

Base Score

Base Severity

Vector String

3.1

6.8

MEDIUM

[CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)

* * *

## Acknowledgments

*   Siemens ProductCERT reported these vulnerabilities to CISA.

* * *

## General Recommendations

Operators of critical power systems (e.g. TSOs or DSOs) worldwide are usually required by regulations to build resilience into the power grids by applying multi-level redundant secondary protection schemes. It is therefore recommended that the operators check whether appropriate resilient protection measures are in place. The risk of cyber incidents impacting the grid's reliability can thus be minimized by virtue of the grid design. Siemens strongly recommends applying the provided security updates using the corresponding tooling and documented procedures made available with the product. If supported by the product, an automated means to apply the security updates across multiple product instances may be used. Siemens strongly recommends prior validation of any security update before being applied, and supervision by trained staff of the update process in the target environment. As a general security measure Siemens strongly recommends protecting network access with appropriate mechanisms (e.g. firewalls, segmentation, VPN). It is advised to configure the environment according to our operational guidelines in order to run the devices in a protected IT environment. Recommended security guidelines can be found at: [https://www.siemens.com/gridsecurity](https://www.siemens.com/gridsecurity)

* * *

## Additional Resources

For further inquiries on security vulnerabilities in Siemens products and solutions, please contact the Siemens ProductCERT: [https://www.siemens.com/cert/advisories](https://www.siemens.com/cert/advisories)

Additional information on industrial security by Siemens can be found on the [Siemens industrial security webpage](https://www.siemens.com/industrialsecurity)

For more information see the associated Siemens security advisory SSA-142885 in [HTML](https://cert-portal.siemens.com/productcert/html/ssa-142885.html) and [CSAF](https://cert-portal.siemens.com/productcert/csaf/ssa-142885.json).

* * *

## Terms of Use

The use of Siemens Security Advisories is subject to the terms and conditions listed on: [https://www.siemens.com/productcert/terms-of-use](https://www.siemens.com/productcert/terms-of-use).

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
