# PCAP investigation summary

## What happened

Windows host 10.20.30.227 \(DESKTOP-4C02EMG, Kerberos principal alejandrina.hogue\) downloaded a PE executable over cleartext HTTP from http://gengrasjeepram.com/sv.exe \(server 49.51.133.162\).

The same host sent repeated HTTP POST requests to twereptale.com \(81.177.6.156\) at /4/forum.php and /mlu/forum.php with unusual user-agent strings, a pattern suitable for beaconing review.

No packet evidence establishes execution of the downloaded PE or any successful exfiltration; endpoint payloads were not decrypted and no actor attribution is supported.

## Who was involved

- 10.20.30.227 is the internal host that downloaded the PE and generated the suspicious POST traffic.
- Kerberos client principal alejandrina.hogue is bound to host 10.20.30.227.

## What remains uncertain

- Whether the downloaded PE executed or established persistence is unestablished; encrypted payloads were not decrypted and no endpoint execution was observed.
- Reputation of the download and POST destinations is inconclusive: VirusTotal was rate-limited and ThreatFox/MalwareBazaar returned not\_found or not-applicable, which does not mean clean.

## Next check

- Submit the recovered PE \(SHA-256 995cbbb422634d497d65e12454cd5832cf1b4422189d9ec06efa88ed56891cda\) for sandbox detonation and reputation lookup to determine maliciousness.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.