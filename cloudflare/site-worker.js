// Wrangler embeds the policy as text: no runtime filesystem or origin request.
import headerPolicy from '../_headers';
import { createSiteWorker } from './site-worker-lib.js';

export default createSiteWorker(headerPolicy);
