"""Reviewed identities, not keyword-generated tool or technique associations.

Guide IDs refer to the author's archive. Editorial capability links describe only
the named mode, not every feature of a framework and not observed adversary use.
"""
REVIEWED = '2026-09-27'
FRAMEWORK_EXCEPTIONS = {'S0154': 'Cobalt Strike is included as an explicit framework exception. ATT&CK classifies this software object as malware; that upstream type is preserved.'}
PRIMARY_PROJECTS = {
    'S0002': ('Mimikatz project and documentation', 'https://github.com/gentilkiwi/mimikatz'),
    'S0357': ('Impacket project and documentation', 'https://github.com/fortra/impacket'),
    'S0521': ('BloodHound documentation', 'https://bloodhound.specterops.io/home'),
    'S0633': ('Sliver project and documentation', 'https://github.com/BishopFox/sliver'),
    'S0194': ('PowerSploit archived project documentation', 'https://github.com/PowerShellMafia/PowerSploit'),
    'S0225': ('sqlmap project documentation', 'https://sqlmap.org/'),
}

# id: (display name, concise description, primary documentation)
EXTRA_TOOLS = {
    'nmap': ('Nmap', 'Network discovery and service-scanning utility. Its different scan modes produce different telemetry; a tool name alone is not a technique or a detection.', 'https://nmap.org/book/man.html'),
    'metasploit': ('Metasploit Framework', 'Modular security-testing framework with auxiliary, exploitation and post-exploitation components. Select and review a specific module before designing a lab.', 'https://docs.metasploit.com/'),
    'zap': ('ZAP', 'Intercepting proxy and web-application testing platform. Passive analysis and active vulnerability scanning are distinct activities with different risk and visibility.', 'https://www.zaproxy.org/docs/desktop/start/features/ascan/'),
    'burp-suite': ('Burp Suite', 'Web security testing toolkit. The scanner is a specific capability, not a synonym for every proxy, repeater or intruder workflow; feature availability depends on edition.', 'https://portswigger.net/burp/documentation/scanner'),
    'nikto': ('Nikto', 'Web-server scanner that checks for risky files, configuration issues and known server problems. Findings require verification; scanner output is not proof of exploitation.', 'https://cirt.net/nikto/'),
    'dirbuster': ('DirBuster', 'Directory and file discovery utility that tests candidate paths against a web server. Wordlist discovery is distinct from guessing account passwords.', 'https://www.kali.org/tools/dirbuster/'),
    'hydra': ('Hydra', 'Parallel network authentication-testing utility supporting multiple protocols. Use only approved test accounts and explicit rate and lockout limits.', 'https://github.com/vanhauser-thc/thc-hydra'),
    'john-the-ripper': ('John the Ripper', 'Password auditing and recovery software. Offline hash testing is distinct from online authentication attempts and has different defender visibility.', 'https://www.openwall.com/john/'),
    'hashcat': ('Hashcat', 'Password recovery utility for supported hash formats. Hardware, hash mode and input preparation determine the applicable lab procedure.', 'https://hashcat.net/hashcat/'),
    'aircrack-ng': ('Aircrack-ng', 'Wireless security assessment suite. This entry links only offline WPA-PSK candidate testing; it does not map every capture, injection or disruption feature to the same technique.', 'https://www.aircrack-ng.org/'),
    'shodan': ('Shodan', 'Search service for internet-connected devices and exposed services. Querying an existing scan database differs from actively probing a target yourself.', 'https://help.shodan.io/the-basics/what-is-shodan'),
    'amass': ('Amass', 'Attack-surface discovery and asset-mapping project. Its passive information gathering and active enumeration modes must be distinguished in a lab.', 'https://owasp.org/projects/amass'),
    'spiderfoot': ('SpiderFoot', 'Modular open-source intelligence automation. Results and visibility depend on enabled modules and data providers; collected associations require validation.', 'https://github.com/smicallef/spiderfoot'),
    'crowbar': ('Crowbar', 'Authentication-testing tool supporting several remote-access workflows. The linked guide covers an RDP credential-guessing lab, not every supported mode.', 'https://github.com/galkan/crowbar'),
    'ppg': ('Personal Pass Generator', 'Andrey Pautov’s wordlist-preparation utility for authorized assessments. Creating candidate strings alone does not perform password guessing or password cracking.', 'https://github.com/anpa1200/personal-pass-generator'),
    'rtsp-brute-force': ('RTSP Brute Force Tool', 'Andrey Pautov’s RTSP authentication-testing utility. Restrict tests to an owned lab service with synthetic credentials and bounded attempts.', 'https://github.com/anpa1200/RTSP-brute-force-tool'),
    'hexstrike-ai': ('HexStrike AI', 'MCP-based orchestration layer for security tools. Attribute behavior to the invoked tool and operation; do not inherit the entire ATT&CK coverage of every available backend.', 'https://github.com/0x4m4/hexstrike-ai'),
    'hackerai': ('HackerAI', 'AI-assisted penetration-testing service discussed in the author’s lab guides. Historical guide workflows are not a guarantee of current product features or execution access.', 'https://hackerai.co/'),
}

GUIDE_IDS = {
    'nmap': ['f36d74d1b2c0', 'd5a95569031c', '450eec6e9db2', '5ec77704057f', 'e2acb6130be5'],
    'metasploit': ['43c8573487df', '1821db1712f0', '73eecb50e3c3', '3ec6ef4cee5b'],
    'S0225': ['6dd540363c83', '0136ac6ffe53'],
    'zap': ['6c247f4be39b'],
    'burp-suite': ['33087bb286b0', '019ed82c8bac', 'fdd03cec343d', 'c1229edfe092', '01c02eed5258'],
    'hydra': ['182579dbaed1'],
    'john-the-ripper': ['e42d68239c71', 'f2ec958acaf8', '9bb0bd44ed64'],
    'hashcat': ['15f8da8facb8'],
    'dirbuster': ['31c8406a892b'],
    'nikto': ['6d2d2fbc1e21'],
    'aircrack-ng': ['d51cf98c789f'],
    'shodan': ['640f47f41bbe', 'b6f9fcbe8e6e'],
    'amass': ['94bd55521f91'],
    'spiderfoot': ['11ea6537ad6f'],
    'crowbar': ['5f50027115b7'],
    'ppg': ['4979a3a1385c', '5f50027115b7'],
    'rtsp-brute-force': ['ad1c29b9e5ee'],
    'hexstrike-ai': ['85a0e5752949', '00a9e88b3bde', '67f3dae32040', 'b6f9fcbe8e6e', 'b8fc5c475ebc', '3e1d4e86f3ae', '1d799845410b', '3c8bb7deb82d', 'cfa7eb0fae91', 'f049ab140596', 'b892c07be39f', 'a9162f8e253b', '2c5f99dcdbf4', '90034032775b', 'f2e1fd793ad7', 'ffdfc7ba1b30', '8736fec53c58', '01c02eed5258'],
    'hackerai': ['b2ab2cdd4139', '1d799845410b'],
    'S0633': ['38602f432e5c', '91339316f0df'],
}

# Exact test GUIDs reviewed for tool identity only. Procedure safety and execution
# remain unreviewed/unvalidated. The builder also requires a compatible candidate.
ATOMIC_LINKS = [
    ('nmap', 'T1046', '515942b0-a09f-4163-a7bb-22fefb6f185f', 'Nmap scan in the pinned network-service discovery test.'),
    ('nmap', 'T1046', 'd696a3cb-d7a8-4976-8eb5-5af4abf2e3df', 'Windows Nmap scan in the pinned procedure.'),
    ('nmap', 'T1046', '0d5a2b03-3a26-45e4-96ae-89485b4d1f97', 'Nmap port-range and service probe in the pinned procedure.'),
    ('hashcat', 'T1110.002', '6d27df5d-69d4-4c91-bc33-5983ffe91692', 'The exact test invokes Hashcat on prepared hash input.'),
    ('S0357', 'T1047', 'a3ddaf15-d1a1-4bc3-8683-84c7c67120fe', 'The procedure invokes Impacket wmiexec.py.'),
    ('S0002', 'T1059.001', 'f3132740-55bc-48c4-bcc0-758a459cd027', 'Invoke-Mimikatz PowerShell wrapper; this is not a claim that PowerShell itself is Mimikatz.'),
    ('S0521', 'T1059.001', 'a21bb23e-e677-4ee7-af90-6931b57b6350', 'SharpHound collection for BloodHound through PowerShell; collector and analysis application have different roles.'),
    ('S0194', 'T1620', '114c2b95-d992-4c03-8c38-fc58420a3eb5', 'PowerSploit Invoke-ReflectivePEInjection in the exact test.'),
    ('S1071', 'T1550.003', 'a2fc4ec5-12c6-4fb4-b661-961f23f359cb', 'Rubeus ticket workflow in the exact test; other dependencies are not exhaustively indexed here.'),
]

# tool, exact Enterprise sub-technique, scope explanation, supporting guide ID.
# These are editorial capability/workflow mappings, NOT ATT&CK uses edges.
EDITORIAL_LINKS = [
    ('metasploit', 'T1110.001', 'Only the SSH login-testing workflow in the linked guide, not the whole framework.', '3ec6ef4cee5b'),
    ('zap', 'T1595.002', 'Active vulnerability scanning of an authorized external web application; passive proxy analysis is excluded.', '6c247f4be39b'),
    ('burp-suite', 'T1595.002', 'The web vulnerability scanner in a reconnaissance context, not every Burp feature.', '019ed82c8bac'),
    ('nikto', 'T1595.002', 'Web-server vulnerability scanning in a reconnaissance context; not confirmed exploitation.', '6d2d2fbc1e21'),
    ('dirbuster', 'T1595.003', 'Candidate web-path enumeration using a wordlist, not account authentication guessing.', '31c8406a892b'),
    ('hydra', 'T1110.001', 'Online password guessing against an approved authentication service; not offline cracking.', '182579dbaed1'),
    ('john-the-ripper', 'T1110.002', 'Offline password recovery against prepared lab hashes; not online login attempts.', 'e42d68239c71'),
    ('aircrack-ng', 'T1110.002', 'Offline candidate testing against a lab WPA-PSK capture only. Capture/injection behaviors are not included in this mapping.', 'd51cf98c789f'),
    ('shodan', 'T1596.005', 'Searching an existing scan database; this does not imply direct target-side scan telemetry.', '640f47f41bbe'),
    ('amass', 'T1596.001', 'Passive DNS information gathering only; active enumeration is a separate mode.', '94bd55521f91'),
    ('spiderfoot', 'T1596.001', 'DNS/passive-DNS intelligence modules only; not blanket coverage of all OSINT modules.', '11ea6537ad6f'),
    ('crowbar', 'T1110.001', 'Online RDP credential guessing in the named guide; other authentication modes are excluded.', '5f50027115b7'),
    ('rtsp-brute-force', 'T1110.001', 'RTSP service password-guessing workflow using synthetic lab accounts.', 'ad1c29b9e5ee'),
    ('hexstrike-ai', 'T1110.001', 'Guide-specific orchestration of SSH credential attempts through a backend tool, not an intrinsic capability of the model or every HexStrike integration.', 'a9162f8e253b'),
]
