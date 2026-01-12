var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { write } from "bun";
// Configuration for NASA JPL Horizons API
var API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api";
var OUTPUT_FILE = "./public/data/spacecraft.json";
// Deep Space Objects to track
// ID format: Negative numbers are usually spacecraft in Horizons
var SPACECRAFT = [
    { name: "Voyager 1", id: "-31", missionType: "Interstellar Probe" },
    { name: "Voyager 2", id: "-32", missionType: "Interstellar Probe" },
    { name: "New Horizons", id: "-98", missionType: "Pluto/Kuiper Belt" },
    { name: "James Webb", id: "-170", missionType: "Space Telescope" }, // L2 Halo Orbit
];
// Helper to format date as YYYY-MM-DD for API
var getToday = function () { return new Date().toISOString().split('T')[0]; };
var getTomorrow = function () {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};
function fetchSpacecraftData(spacecraft) {
    return __awaiter(this, void 0, void 0, function () {
        var params, response, text, soeIndex, eoeIndex, dataBlock, lines, firstLine, parts, rangeAU, velocity, AU_IN_KM, distanceKm, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\uD83D\uDCE1 Contacting NASA JPL for ".concat(spacecraft.name, " (ID: ").concat(spacecraft.id, ")..."));
                    params = new URLSearchParams({
                        format: "text",
                        COMMAND: "'".concat(spacecraft.id, "'"),
                        OBJ_DATA: "'NO'", // Don't need object physical data
                        MAKE_EPHEM: "'YES'",
                        EPHEM_TYPE: "'OBSERVER'",
                        CENTER: "'500@399'", // Earth (Geocentric)
                        START_TIME: "'".concat(getToday(), "'"),
                        STOP_TIME: "'".concat(getTomorrow(), "'"),
                        STEP_SIZE: "'1d'",
                        QUANTITIES: "'20'", // 20 = Range (distance) & Range-rate (velocity)
                        CSV_FORMAT: "'YES'"
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(API_URL, "?").concat(params.toString()))];
                case 2:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("HTTP ".concat(response.status));
                    return [4 /*yield*/, response.text()];
                case 3:
                    text = _a.sent();
                    soeIndex = text.indexOf("$$SOE");
                    eoeIndex = text.indexOf("$$EOE");
                    if (soeIndex === -1 || eoeIndex === -1) {
                        console.error("\u274C Bad data format for ".concat(spacecraft.name));
                        return [2 /*return*/, null];
                    }
                    dataBlock = text.substring(soeIndex + 5, eoeIndex).trim();
                    lines = dataBlock.split('\n');
                    firstLine = lines[0];
                    parts = firstLine.split(',');
                    rangeAU = parseFloat(parts[3]);
                    velocity = parseFloat(parts[4]);
                    AU_IN_KM = 149597870.7;
                    distanceKm = rangeAU * AU_IN_KM;
                    console.log("\u2705 ".concat(spacecraft.name, ": ").concat(distanceKm.toLocaleString(), " km"));
                    return [2 /*return*/, {
                            name: spacecraft.name,
                            id: spacecraft.id,
                            distanceKm: distanceKm,
                            velocityKmS: velocity,
                            missionType: spacecraft.missionType,
                            date: new Date().toISOString()
                        }];
                case 4:
                    e_1 = _a.sent();
                    console.error("\u274C Failed fetching ".concat(spacecraft.name, ":"), e_1);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var results, _i, SPACECRAFT_1, spacecraft, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🚀 Starting Deep Space Network Data Fetch...");
                    results = [];
                    _i = 0, SPACECRAFT_1 = SPACECRAFT;
                    _a.label = 1;
                case 1:
                    if (!(_i < SPACECRAFT_1.length)) return [3 /*break*/, 5];
                    spacecraft = SPACECRAFT_1[_i];
                    return [4 /*yield*/, fetchSpacecraftData(spacecraft)];
                case 2:
                    data = _a.sent();
                    if (data)
                        results.push(data);
                    // Be nice to NASA API
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 500); })];
                case 3:
                    // Be nice to NASA API
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5:
                    if (!(results.length > 0)) return [3 /*break*/, 7];
                    return [4 /*yield*/, write(OUTPUT_FILE, JSON.stringify(results, null, 2))];
                case 6:
                    _a.sent();
                    console.log("\n\u2728 Successfully wrote ".concat(results.length, " spacecraft to ").concat(OUTPUT_FILE));
                    return [3 /*break*/, 8];
                case 7:
                    console.error("\n⚠️ No data collected!");
                    process.exit(1);
                    _a.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    });
}
main();
