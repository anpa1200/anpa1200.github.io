# PCAP investigation summary

## What happened

The device with IP 139.199.184.166 initiated multiple repeated HTTP POST requests to the URLs http://128.199.64.235/1.php and http://128.199.64.235/qq.php, which may indicate beaconing or suspicious data transfer activity.

Reputation and threat intelligence checks on 139.199.184.166 and the contacted URLs returned no confirmation of known threats, but rate limiting or the absence of records does not mean the endpoints are benign.

## Who was involved

- 139.199.184.166 — Observed client repeatedly communicating with 128.199.64.235 over HTTP; involved in outbound POST activity.

## Key indicators

- http://128.199.64.235/1.php received suspicious repeated POST requests from 139.199.184.166; flagged for potential beaconing or data transfer review.
- http://128.199.64.235/qq.php was targeted by repeated outbound POST requests from 139.199.184.166, suggesting suspicious interaction.

## What remains uncertain

- It is unknown if any downloaded or uploaded payloads were successfully delivered or executed due to lack of packet contents or endpoint execution evidence.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.