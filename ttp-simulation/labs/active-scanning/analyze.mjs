// Educational fan-out detector. Native Zeek conn JSON in; no network operations.
export function normalizeAcceptRecords(events){
  return events.map(event=>{
    if(event.schema!=='1200km.lab.tcp-accept.v1'||event.synthetic!==false||event.event!=='socket_accept')throw Error('Not a native lab accept record');
    return {ts:event.ts,'id.orig_h':event.source_ip,'id.resp_h':event.destination_ip,'id.resp_p':event.destination_port};
  });
}
export function scanFeatures(events,{approvedSources=[]}={}) {
  const groups=new Map(),invalid=[];
  for(const [i,event] of events.entries()){
    if(!Number.isFinite(event.ts)||typeof event['id.orig_h']!=='string'||typeof event['id.resp_h']!=='string'||!Number.isInteger(event['id.resp_p'])){invalid.push(i);continue;}
    const key=event['id.orig_h']+'@'+Math.floor(event.ts/60);
    if(!groups.has(key))groups.set(key,{source:event['id.orig_h'],window_start:Math.floor(event.ts/60)*60,ports:new Set(),hosts:new Set(),connections:0});
    const g=groups.get(key);g.ports.add(event['id.resp_p']);g.hosts.add(event['id.resp_h']);g.connections++;
  }
  if(invalid.length)return {status:'invalid_telemetry',invalid,windows:[]};
  return {status:events.length?'observed':'no_telemetry',windows:[...groups.values()].map(g=>({source:g.source,window_start:g.window_start,distinct_ports:g.ports.size,distinct_hosts:g.hosts.size,connections:g.connections,approved:approvedSources.includes(g.source),threshold_match:!approvedSources.includes(g.source)&&(g.ports.size>=20||g.hosts.size>=20)&&g.connections>=20}))};
}
const median=a=>{const s=[...a].sort((x,y)=>x-y);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2;};
export function fanoutAnomaly(value,baseline) {
  if(!Number.isFinite(value)||baseline.length<20||baseline.some(v=>!Number.isFinite(v)||v<0))return {status:'insufficient_baseline'};
  const center=median(baseline),mad=median(baseline.map(v=>Math.abs(v-center)));
  if(mad===0)return {status:'zero_dispersion',median:center,mad,anomalous:null};
  const score=0.67448975*(value-center)/mad;
  return {status:'scored',median:center,mad,score,anomalous:score>6&&value>=20,boundary:'Illustrative lab threshold; not a calibrated production model.'};
}
