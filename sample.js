// KAGE engine sample script for JavaScript engine
//
// % js -m sample.js > result.svg (SpiderMonkey)
// % java -jar js.jar sample.js > result.svg (Rhino untested)

import { Kage } from "kage.js";
import { Polygons } from "polygons.js";
import { Gothic2 } from "./fonts/gothic2/gothic2.js";

var kage = new Kage();
var polygons = new Polygons();

kage.kFont = new Gothic2(10);

//kage.kBuhin.push("u6c38", "7:12:7:29:24:29:118:29:173:14:188$1:2:2:29:24:67:24$1:22:4:67:24:67:181$1:2:2:29:67:67:67$1:2:2:29:112:67:112$2:7:8:105:13:128:23:142:42$1:0:2:82:60:129:60$1:22:4:129:60:129:183$1:0:2:78:93:109:93$2:22:7:109:93:103:141:74:170$2:0:7:177:64:165:81:143:103$2:7:0:133:69:147:137:181:163");
kage.kBuhin.push("u6c38", "1:0:0:20:32:180:32$1:0:2:32:61:143:61$4:22:5:143:61:12:168:174:168");

kage.makeGlyph(polygons, "u6c38");

print(polygons.generateSVG(false));

