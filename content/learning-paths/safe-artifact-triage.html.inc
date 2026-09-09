<h1>Triage a reproducible benign artifact</h1>
<p><strong>Produce a structured observation record without extracting or executing the contents.</strong></p>
<p>Audience: beginning malware-analysis and DFIR learners. Prerequisites: a terminal, JSON familiarity, and Python 3.9 or later; no third-party packages. Planning time: 15–20 minutes. Executed with Python 3.13.12 on Linux; fixture and validator version 1.0, reviewed 2026-09-09.</p>
<p>The artifact is an authored ZIP containing one plain-text note. The source fixes the entry name, timestamp, permissions, storage mode, and bytes so it can be regenerated. A URL and the word <code>powershell</code> are text observations; their presence does not demonstrate a network connection or interpreter execution.</p>
<nav aria-label="On this page"><a href="#provenance">Provenance</a> · <a href="#workflow">Workflow</a> · <a href="#observations">Observations</a> · <a href="#controls">Controls</a> · <a href="#limits">Limitations</a> · <a href="#references">References</a></nav>
<h2 id="provenance">Inputs and provenance</h2>
<p>Download <a href="triage.py" download>triage.py</a>, <a href="fixture.zip" download>the benign fixture.zip</a>, and <a href="expected.json" download>expected.json</a>. No live sample or external upload is part of this exercise. The distributed ZIP is 245 bytes; its SHA-256 is:</p>
<pre tabindex="0"><code>77c380a3c4ab35efe50964b9c97db8bbbe27c49f96a65ee92b63c7c24f676cbb</code></pre>
<p>A matching digest checks byte identity against this published fixture. It does not prove that an arbitrary file is safe or that a publisher is trustworthy.</p>
<h2 id="workflow">Workflow and corroboration</h2>
<ol><li>Inspect the script. It accepts only the expected stored entry, bounds file and entry sizes, and reads into memory. It never extracts entries or evaluates their text.</li><li>Run the inspection and controls below.</li><li>Regenerate into a new filename. Generation refuses to overwrite an existing file. Compare both observation records and hashes.</li><li>On Linux, independently run <code>sha256sum fixture.zip</code> and <code>unzip -l fixture.zip</code>; the archive listing should show one <code>notes.txt</code> entry, 129 bytes, dated 2026-01-01. These commands inspect this supplied benign fixture.</li></ol>
<pre tabindex="0"><code>python3 triage.py fixture.zip
python3 triage.py --self-test
python3 triage.py --generate regenerated.zip
python3 triage.py regenerated.zip</code></pre>
<h2 id="observations">Expected structured observation</h2>
<pre tabindex="0"><code>{"bytes": 245, "entries": ["notes.txt"], "execution_observed": false, "format": "ZIP (stored)", "sha256": "77c380a3c4ab35efe50964b9c97db8bbbe27c49f96a65ee92b63c7c24f676cbb", "strings": ["example.invalid", "powershell"], "text_bytes": 129}</code></pre>
<p>The format, length, archive entry, and exact content are checked. <code>execution_observed: false</code> describes this static workflow's visibility, not proof of the absence of behavior in another environment.</p>
<h2 id="controls">Failure and negative cases</h2>
<pre tabindex="0"><code>{"negative_controls_rejected": 3, "positive_fixture_passed": true}</code></pre>
<p>The self-test rejects a traversal entry name, changed content with an invalid CRC, and non-ZIP bytes. It creates those controls in memory and extracts none. Unexpected compression, oversized entries, wrong content, missing files, and malformed archives stop validation with an error; an error is not a malware verdict. An identical hash with a different observation record indicates a tool or environment discrepancy that requires investigation.</p>
<h2 id="limits">Limitations and next step</h2>
<p>This deliberately narrow validator recognizes one known fixture. It is not a general archive scanner, sandbox, malware classifier, or a safe parser for arbitrary hostile samples. Static strings suggest questions; they do not demonstrate execution, persistence, or attribution. Keep this provenance and observation record with a separate hypothesis and a safe corroboration step.</p>
<p>Continue the <a href="/learning-paths/#malware-triage">malware-triage path</a> and the <a href="/cyber-knowledge/malware-analysis.html">analysis guide</a>. Adapt the observation schema to another approved benign artifact before considering any separately authorized dynamic analysis.</p>
<h2 id="references">References</h2>
<ul><li><a href="https://docs.python.org/3/library/zipfile.html">Python: ZIP archive inspection and CRC checking</a>.</li><li><a href="https://docs.python.org/3/library/hashlib.html">Python: SHA-256 and other digest algorithms</a>.</li></ul>
<h2>Follow My Work</h2><p><a href="/feed.xml">Research RSS</a> · <a href="/about.html">About the author</a> · <a href="https://github.com/anpa1200">GitHub</a>.</p>
