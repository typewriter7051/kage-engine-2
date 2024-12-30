// KAGE engine sample script for JavaScript engine
//
// % node standalone.ts > result.svg (NodeJS)

import { Kage } from "../../kage/kage";
import { GothicWeb } from "../../fonts/gothic-web/gothic-web";

let gothicWeb = new GothicWeb();

let gothicProperties = {
  "stroke-width": 5,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "precision": 2
};
gothicWeb.setProperties(gothicProperties);

var kage = new Kage();
kage.kFont = gothicWeb;

kage.kBuhin.push("u6cf3-j", "99:0:0:3:0:156:200:u6c35-01:0:0:0$99:0:0:-10:0:202:200:u6c38-02:0:0:0");
kage.kBuhin.push("u6c35-01", "2:7:8:33:20:59:28:69:41$2:7:8:12:68:38:75:49:89$2:7:8:14:133:54:142:50:184$2:32:7:44:150:49:139:86:58");
kage.kBuhin.push("u6c38-02", "2:7:8:101:13:126:23:140:42$1:0:2:77:60:127:60$1:22:4:127:60:127:183$1:0:2:72:93:105:93$2:22:7:105:93:99:141:68:170$2:0:7:178:64:165:81:141:103$2:7:0:131:69:146:137:182:163");
/*
kage.kBuhin.push("u99ac-01", "1:12:13:28:28:28:110$1:2:0:28:28:96:28$1:32:32:60:28:60:110$1:2:0:28:56:95:56$1:2:0:28:83:95:83$1:2:2:28:110:88:110$2:22:4:88:110:90:156:73:183$2:7:8:27:124:30:160:17:172$2:7:8:37:127:45:147:42:164$2:7:8:47:124:58:138:59:155$2:7:8:56:118:69:127:73:142");
kage.kBuhin.push("u50c9-j", "2:0:7:102:16:69:64:12:87$2:7:0:99:19:133:60:179:77$1:0:0:65:69:133:69$1:12:13:42:90:42:121$1:2:2:42:90:84:90$1:22:23:84:90:84:121$1:2:2:42:121:84:121$1:12:13:116:90:116:121$1:2:2:116:90:158:90$1:22:23:158:90:158:121$1:2:2:116:121:158:121$2:0:7:66:132:54:166:16:188$2:7:8:60:152:78:160:90:176$2:0:7:140:132:126:170:90:188$2:7:8:134:152:156:162:174:185");
kage.kBuhin.push("u6c38", "99:0:0:2:0:165:200:u99ac-01$99:0:0:74:0:194:200:u50c9-j");
*/

kage.applyFontOverrides();
let paths = kage.IDS2Paths("u6cf3-j");

// @ts-ignore
console.log(kage.generateSVG(paths));

