// KAGE engine sample script for JavaScript engine
//
// % js -m sample.js > result.svg (SpiderMonkey)
// % java -jar js.jar sample.js > result.svg (Rhino untested)

import { Kage } from "kage.js";
import { Gothic } from "./fonts/gothic/gothic.js";
import { GothicWeb } from "./fonts/gothic-web/gothic-web.js";
import { Gothic2 } from "./fonts/gothic2/gothic2.js";

var kage = new Kage();
kage.kFont = new GothicWeb(10);

/*
kage.kBuhin.push("u99ac-01", "1:12:13:28:28:28:110$1:2:0:28:28:96:28$1:32:32:60:28:60:110$1:2:0:28:56:95:56$1:2:0:28:83:95:83$1:2:2:28:110:88:110$2:22:4:88:110:90:156:73:183$2:7:8:27:124:30:160:17:172$2:7:8:37:127:45:147:42:164$2:7:8:47:124:58:138:59:155$2:7:8:56:118:69:127:73:142");
kage.kBuhin.push("u50c9-j", "2:0:7:102:16:69:64:12:87$2:7:0:99:19:133:60:179:77$1:0:0:65:69:133:69$1:12:13:42:90:42:121$1:2:2:42:90:84:90$1:22:23:84:90:84:121$1:2:2:42:121:84:121$1:12:13:116:90:116:121$1:2:2:116:90:158:90$1:22:23:158:90:158:121$1:2:2:116:121:158:121$2:0:7:66:132:54:166:16:188$2:7:8:60:152:78:160:90:176$2:0:7:140:132:126:170:90:188$2:7:8:134:152:156:162:174:185");
kage.kBuhin.push("u6c38", "99:0:0:2:0:165:200:u99ac-01$99:0:0:74:0:194:200:u50c9-j");
kage.kBuhin.push("u6c38", "1:0:2:16:38:77:38$2:22:7:77:38:63:132:13:180$2:7:8:19:66:58:92:82:140$1:0:0:88:61:187:61$1:0:0:136:14:136:185$2:32:7:133:61:118:114:82:151$2:7:0:139:61:152:112:181:142$1:0:0:100:144:168:144");
*/

kage.kBuhin.push("u6c38", "1:0:0:20:32:180:32$1:0:2:32:61:143:61$4:22:5:143:61:12:168:174:168");

// Old method.

/*
kage.makeGlyph(polygons, "u6c38");
print(polygons.generateSVG(false));
*/

// New method.

let paths = kage.getPaths("u6c38");
print(kage.generateSVG(paths));

