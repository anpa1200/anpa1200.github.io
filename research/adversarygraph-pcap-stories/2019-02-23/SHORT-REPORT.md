# PCAP investigation summary

## What happened

The host Ferguson-Win-PC at IP 10.2.23.231 downloaded four different PE files from external servers using HTTP requests, with three files served under PNG or JPG extensions, which is inconsistent with their content type and is suspicious.

A PE file named 'troll1.jpg' was also downloaded from 209.141.55.226 by the same host Ferguson-Win-PC at 10.2.23.231, further supporting suspicious transfer activity.

## Who was involved

- Ferguson-Win-PC at 10.2.23.231 is the client responsible for the suspicious file downloads.

## What remains uncertain

- There is no direct evidence that any of the downloaded PE files were executed or that the device was successfully compromised during the capture window.

## Next check

- Perform endpoint forensics on Ferguson-Win-PC to check for execution of the downloaded PE files and signs of follow-on compromise or persistence.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.