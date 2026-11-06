// Generated: do not edit. Real replies, checked by `tsc`. To refresh: cd server && KTA_WRITE_REPLIES=1 uv run pytest tests/seam1/test_reply_contract.py -n0
// Every state, in order, including those only kept as a digest: sha1:41f783a33c0d sha1:76bc6220d997 sha1:8d43b388caf4 sha1:8ac09f08a30f sha1:24579ffc5277 sha1:d7661ddcc518 sha1:9f8e4a61f9a9 sha1:3e4acf2d9f85 sha1:9009cce3ae22 sha1:6adc30461f86 sha1:5bfc8da8edc6 sha1:87d90bf83d38 sha1:50cb7c7076a9 sha1:96faf2fc41fc sha1:d71abccbf1f2 sha1:f50eb737a8a8
import type { AskAnswer, LoopState } from "../lib/api";
import type { ReplyCard } from "../lib/types";

export const replies: ReplyCard[] = [
{
"say": "Nothing broken, but there is a Watch: full-throttle AFR 10.5 (map asks 11.0, lean limit 12.0), Knock Control peak 0.52: costs about 0.3° of timing, not damage.",
"afterFlash": "Knock Control started at 0.49 and settled to your Baseline (0.50): that is what a fresh flash does.",
"window": "based on this Drive only (22 Aug 09:03)",
"windowDrives": [
"20260822-090322"
],
"windowSince": null,
"numbers": [
{
"label": "intake air, moving",
"value": "49",
"unit": "°C"
},
{
"label": "Knock Control, start → peak",
"value": "0.49 → 0.52",
"unit": ""
},
{
"label": "worst fuel trim",
"value": "−2.3",
"unit": "%"
},
{
"label": "hard pulls",
"value": "9",
"unit": ""
}
],
"mapVersion": {
"line": "on Map version 1 · Starter 21 Dual Tune 2",
"version": 1,
"name": "Starter 21 Dual Tune 2",
"since": null,
"kind": "ktuner-basemap",
"note": "A Map version is the map on your ECU: version 1 is the KTuner basemap you gave me, and each map you flash becomes the next version."
},
"verdict": "Watch",
"settled": [],
"wasted": null,
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median -2.3 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: no Cool drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot max 1.9 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": {
"driveId": "20260822-090322",
"start": 1787364202000,
"cause": "heat"
},
"shakedownPending": false,
"unexplained": []
},
"stepFail": null
},
"cause": null,
"nextStep": {
"kind": "drive",
"key": "baseline",
"title": "Log one Cool-morning drive with 2 pulls",
"body": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "Turbo Pressure",
"ok": "within +1.5 psi of Turbo Pressure Target",
"see": "more than +2.5 psi above Turbo Pressure Target, held",
"then": "Upload. A held overshoot is the only reason to touch boost."
}
]
},
"same": false,
"proves": "a Cool Drive with 2 pulls to measure every later Drive against",
"upload": "after that morning Drive",
"uploadWhen": "Upload when: after that morning Drive.",
"flashPlan": null,
"also": null
},
"readback": null,
"questions": [],
"housing": null,
"harness": {
"checked": 12,
"seconds": 0,
"line": "Checked 12 things · 0 s",
"steps": [
{
"name": "readLog",
"title": "Read the TunerView log",
"inputs": "sha1:442d1c49ea44",
"output": "sha1:d9d572b928e9",
"ms": 0
},
{
"name": "ingestUpload",
"title": "Add the Drive to your Car history",
"inputs": "sha1:442d1c49ea44",
"output": "sha1:04ba8b548b11",
"ms": 0
},
{
"name": "carHistory",
"title": "Compare with your earlier Drives",
"inputs": "sha1:e54539c9a2e4",
"output": "sha1:77a08a1f27d1",
"ms": 0
},
{
"name": "overview",
"title": "Check every safety line",
"inputs": "sha1:4df1b2fad9a5",
"output": "sha1:aacaa41a040b",
"ms": 0
},
{
"name": "driveFacts",
"title": "Read this Drive's numbers",
"inputs": "sha1:4df1b2fad9a5",
"output": "sha1:35544046489b",
"ms": 0
},
{
"name": "logQuality",
"title": "Check the log against the drive brief",
"inputs": "sha1:4df1b2fad9a5",
"output": "sha1:80581afeb0b8",
"ms": 0
},
{
"name": "heat",
"title": "Read intake, coolant and CVT heat",
"inputs": "sha1:4df1b2fad9a5",
"output": "sha1:7d2b4dbfce93",
"ms": 0
},
{
"name": "flashPlan",
"title": "Work out the Flash plan",
"inputs": "sha1:e54539c9a2e4",
"output": "sha1:f0a7e81ed0e5",
"ms": 0
},
{
"name": "ceilingRead",
"title": "Read whether more boost can show",
"inputs": "sha1:e54539c9a2e4",
"output": "sha1:b8aeaac5b4e4",
"ms": 0
},
{
"name": "settleOpenSteps",
"title": "Settle what I asked last time",
"inputs": "sha1:2f2d23b7fcf9",
"output": "sha1:baeeabcac1b0",
"ms": 0
},
{
"name": "nextStep",
"title": "Decide the Next step",
"inputs": "sha1:2f2d23b7fcf9",
"output": "sha1:3c2b160ac8d0",
"ms": 0
},
{
"name": "ownerQuestions",
"title": "Ask what only you know",
"inputs": "sha1:2f2d23b7fcf9",
"output": "sha1:c1949c6838f9",
"ms": 0
}
]
},
"checkpoints": [
{
"id": "rate",
"label": "Logged 10 times a second or faster",
"value": "7.5 a second",
"met": false
},
{
"id": "moving",
"label": "10 minutes or more of moving",
"value": "8 min",
"met": false
},
{
"id": "gauges",
"label": "Every gauge moving",
"value": "all moving",
"met": true
},
{
"id": "channels",
"label": "AFR Command and MAF Hz in the log",
"value": "missing: AFR Command and MAF Hz",
"met": false
},
{
"id": "warm",
"label": "Engine warm (coolant 80 °C or more)",
"value": "90 °C peak",
"met": true
},
{
"id": "cool",
"label": "Cool intake while moving (under 42 °C)",
"value": "49 °C",
"met": false
},
{
"id": "pulls",
"label": "2 full-throttle pulls",
"value": "9 hard pulls",
"met": true
},
{
"id": "pullIat",
"label": "Pulls started under 48 °C intake",
"value": "51 °C",
"met": false
}
],
"health": {
"line": "Yes, with things to watch. Nothing here is damaging the engine; the list below fixes them in order.",
"rows": [
{
"system": "Fuel",
"id": "trims",
"label": "Fuel trims (cruise)",
"value": "+0.9 %",
"word": "OK",
"tone": "good",
"band": {
"value": 0.9,
"unit": "%",
"min": -15,
"max": 15,
"marks": [
{
"at": -10,
"label": "Stop -10",
"tone": "stop"
},
{
"at": -5,
"label": "Watch -5",
"tone": "watch"
},
{
"at": 5,
"label": "Watch +5",
"tone": "watch"
},
{
"at": 10,
"label": "Stop +10",
"tone": "stop"
}
],
"source": "kc-trims"
}
},
{
"system": "Fuel",
"id": "wotAfr",
"label": "Mixture at 12 psi and up",
"value": "10.1 AFR at 12 psi and up, map asks 11.0 (richer: safe)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Fuel",
"id": "fuelPress",
"label": "DI fuel pressure at WOT",
"value": "98 % of target (worst 5 %)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Air & boost",
"id": "overshoot",
"label": "Boost overshoot",
"value": "+1.9 psi at 3,964 rpm",
"word": "Watch",
"tone": "watch",
"band": null
},
{
"system": "Air & boost",
"id": "undershoot",
"label": "Boost reaches target",
"value": "On target after spool",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Air & boost",
"id": "mafHz",
"label": "MAF sensor headroom",
"value": "MAF Hz not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Spark",
"id": "knock",
"label": "Knock retard at WOT",
"value": "5.0° under boost, scheduled by Knock Control (not knock events)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Spark",
"id": "kControl",
"label": "Fuel-quality score (Knock Control)",
"value": "0.49 → 0.50",
"word": "OK",
"tone": "good",
"band": {
"value": 0.5,
"unit": "",
"min": 0.45,
"max": 0.85,
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
},
{
"at": 0.8,
"label": "Stop 0.80",
"tone": "stop"
}
],
"source": "kc-ranges"
}
},
{
"system": "Heat",
"id": "iat",
"label": "Intake air temp",
"value": "57 °C peak in a pull",
"word": "Watch",
"tone": "watch",
"band": {
"value": 57,
"unit": "°C",
"min": 20,
"max": 60,
"marks": [
{
"at": 42,
"label": "Cool 42",
"tone": "none"
},
{
"at": 48,
"label": "Pull start 48",
"tone": "none"
}
],
"source": "kc-drive-brief"
}
},
{
"system": "Heat",
"id": "ect",
"label": "Coolant temp",
"value": "90 °C peak",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "cvtTemp",
"label": "CVT fluid temp",
"value": "79 °C peak",
"word": "OK",
"tone": "good",
"band": {
"value": 79,
"unit": "°C",
"min": 30,
"max": 110,
"marks": [
{
"at": 90,
"label": "Watch 90",
"tone": "watch"
},
{
"at": 100,
"label": "Stop 100",
"tone": "stop"
}
],
"source": "kc-cvt"
}
},
{
"system": "CVT",
"id": "slip",
"label": "CVT slip (revs without speed)",
"value": "No slip seen under boost",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "lowBoost",
"label": "Boost below 3,000 rpm",
"value": "-3.8 psi vs reference map",
"word": "OK",
"tone": "good",
"band": null
}
]
},
"calibration": {
"status": "none",
"settled": false,
"mapAction": "no-change",
"meaning": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null,
"lines": [
{
"label": "Pedal",
"value": "Not set yet: type the Pedal full reading in your car profile",
"tone": "watch"
},
{
"label": "Logger",
"value": "7.5 a second · AFR Command not checked · MAF Hz not checked",
"tone": "good"
},
{
"label": "Ceiling",
"value": "Can't tell yet: no Cool drive read since the ceiling last moved.",
"tone": "none"
},
{
"label": "What it means",
"value": "No map change yet: drive the Calibration drive on a cool morning.",
"tone": "none"
}
]
},
"tour": {
"families": [
{
"family": "airflow",
"title": "Airflow (MAF Scaling)",
"what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
"card": "kc-table-maf",
"tables": [
"MAF_Scaling_Custom",
"MAF_Scaling_Factory",
"MAF_Scaling_PRL_Race",
"MAF_Scaling_27Won_Race"
],
"status": "fine",
"reason": "No change: trims within ±5 % (median -2.3 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"family": "mixture",
"title": "Full-throttle mixture (WOT Enrich)",
"what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
"card": "kc-table-wot",
"tables": [
"WOT_Enrich_L",
"WOT_Enrich_H"
],
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"family": "boost",
"title": "Boost targets and limits",
"what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
"card": "kc-table-boost",
"tables": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H",
"Boost_Target_1_ECO_L",
"Boost_Target_1_ECO_H",
"Final_Boost_Target_L",
"Final_Boost_Target_H",
"Boost_By_Gear_Limits",
"Cylinder_Fill_Limitation_L",
"Cylinder_Fill_Limitation_H"
],
"status": "locked",
"reason": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null
},
{
"family": "ignition",
"title": "Ignition timing",
"what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
"card": "kc-table-ignition",
"tables": [
"Ignition_Base_L",
"Ignition_Base_H",
"Ignition_Max_L",
"Ignition_Max_H",
"Ethanol_Ign_Adj_L",
"Ethanol_Ign_Adj_H"
],
"status": "read-only",
"reason": "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove timing where retard collects, never add it without a dyno.",
"unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing)."
},
{
"family": "knock",
"title": "Knock sensitivity",
"what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
"card": "kc-table-ignition",
"tables": [
"Knock_Sens_1+4_L",
"Knock_Sens_1+4_H",
"Knock_Sens_2+3_L",
"Knock_Sens_2+3_H"
],
"status": "read-only",
"reason": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
"unlocks": "Nothing in this app: this one stays with the basemap."
},
{
"family": "basemap",
"title": "Left to the basemap",
"what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
"card": "kc-tune-order",
"tables": [
"DI_Fuel_Pressure_Target_0pct",
"DI_Fuel_Pressure_Target_55pct",
"WOT_Exhaust_VTC_Low_Cam",
"Ethanol_Boost_Target_Adj_L",
"Ethanol_Boost_Target_Adj_H"
],
"status": "read-only",
"reason": "Leave to the basemap: these are matched to the hardware, not to a street log.",
"unlocks": "Hardware changes a professional tuner would recalibrate for."
}
],
"headline": "Your logs support no map change right now."
},
"tags": {
"fuel": null,
"slot": 1
},
"pictures": [
{
"kind": "trace",
"title": "Hard pull to 14.8 psi",
"unit": "psi",
"series": [
{
"name": "Boost",
"points": [
[
-60,
-0.3
],
[
-59,
-0.3
],
[
-57,
-0.3
],
[
-56,
-0.3
],
[
-54,
-0.3
],
[
-53,
-0.3
],
[
-52,
-0.3
],
[
-50,
-0.3
],
[
-49,
-0.3
],
[
-47,
-0.3
],
[
-46,
-0.3
],
[
-45,
-0.3
],
[
-43,
-0.3
],
[
-42,
0
],
[
-40,
0.2
],
[
-39,
3.4
],
[
-38,
8.2
],
[
-36,
9.1
],
[
-35,
7
],
[
-34,
12.7
],
[
-32,
0.5
],
[
-31,
0
],
[
-29,
0
],
[
-28,
0
],
[
-27,
0
],
[
-25,
0
],
[
-24,
-0.1
],
[
-23,
-0.1
],
[
-21,
-0.1
],
[
-20,
-0.1
],
[
-19,
-0.2
],
[
-18,
-0.2
],
[
-16,
-0.2
],
[
-15,
-0.3
],
[
-14,
5.4
],
[
-12,
11.7
],
[
-11,
12.7
],
[
-10,
14.1
],
[
-8,
0.7
],
[
-7,
-0.1
],
[
-6,
0
],
[
-4,
0.1
],
[
-3,
0.1
],
[
-1,
0.1
],
[
0,
1.7
],
[
1,
7.2
],
[
3,
5.3
],
[
4,
14.6
],
[
5,
3.4
],
[
7,
0
],
[
8,
0
],
[
9,
0.1
],
[
11,
0.1
],
[
12,
0.1
],
[
14,
0.1
],
[
15,
0.1
],
[
16,
0.1
],
[
18,
0
],
[
19,
-0.1
],
[
20,
-0.1
],
[
22,
-0.1
],
[
23,
-0.1
],
[
24,
-0.1
],
[
26,
-0.1
],
[
27,
-0.2
],
[
29,
-0.2
],
[
30,
-0.2
],
[
31,
-0.2
],
[
33,
-0.3
],
[
34,
-0.3
],
[
36,
-0.3
],
[
37,
-0.3
],
[
38,
-0.3
],
[
40,
-0.3
],
[
41,
-0.3
],
[
43,
-0.3
],
[
44,
-0.3
],
[
45,
-0.3
],
[
47,
-0.3
],
[
48,
-0.3
],
[
49,
-0.3
],
[
51,
-0.3
],
[
52,
-0.3
],
[
53,
-0.3
],
[
55,
-0.3
],
[
56,
-0.3
],
[
58,
-0.3
],
[
59,
-0.3
]
]
},
{
"name": "Boost target",
"points": [
[
-60,
-0.2
],
[
-59,
-0.2
],
[
-57,
-0.2
],
[
-56,
-0.2
],
[
-54,
-0.2
],
[
-53,
-0.2
],
[
-52,
-0.2
],
[
-50,
-0.2
],
[
-49,
-0.2
],
[
-47,
-0.2
],
[
-46,
-0.2
],
[
-45,
-0.2
],
[
-43,
0
],
[
-42,
0.2
],
[
-40,
1.3
],
[
-39,
3.8
],
[
-38,
7.7
],
[
-36,
8.6
],
[
-35,
7.2
],
[
-34,
11.2
],
[
-32,
-0.2
],
[
-31,
-0.2
],
[
-29,
-0.2
],
[
-28,
-0.2
],
[
-27,
-0.2
],
[
-25,
-0.2
],
[
-24,
-0.2
],
[
-23,
-0.2
],
[
-21,
-0.2
],
[
-20,
-0.2
],
[
-19,
-0.2
],
[
-18,
-0.2
],
[
-16,
-0.2
],
[
-15,
-0.2
],
[
-14,
7.8
],
[
-12,
12.2
],
[
-11,
12.3
],
[
-10,
13.2
],
[
-8,
-0.2
],
[
-7,
-0.2
],
[
-6,
-0.2
],
[
-4,
-0.2
],
[
-3,
-0.2
],
[
-1,
-0.2
],
[
0,
5.3
],
[
1,
6.5
],
[
3,
5.7
],
[
4,
13.3
],
[
5,
-0.2
],
[
7,
-0.2
],
[
8,
-0.2
],
[
9,
-0.2
],
[
11,
-0.2
],
[
12,
-0.2
],
[
14,
-0.2
],
[
15,
-0.2
],
[
16,
-0.2
],
[
18,
-0.2
],
[
19,
-0.2
],
[
20,
-0.2
],
[
22,
-0.2
],
[
23,
-0.2
],
[
24,
-0.2
],
[
26,
-0.2
],
[
27,
-0.2
],
[
29,
-0.2
],
[
30,
-0.2
],
[
31,
-0.2
],
[
33,
-0.2
],
[
34,
-0.2
],
[
36,
-0.2
],
[
37,
-0.2
],
[
38,
-0.2
],
[
40,
-0.2
],
[
41,
-0.2
],
[
43,
-0.2
],
[
44,
-0.2
],
[
45,
-0.2
],
[
47,
-0.2
],
[
48,
-0.2
],
[
49,
-0.2
],
[
51,
-0.2
],
[
52,
-0.2
],
[
53,
-0.2
],
[
55,
-0.2
],
[
56,
-0.2
],
[
58,
-0.2
],
[
59,
-0.2
]
]
}
],
"moment": {
"at": 0,
"label": "Hard pull to 14.8 psi"
},
"numbers": [
14.8
],
"momentIndex": 0,
"moments": 5
}
],
"openSteps": [
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "open",
"why": "Asked on 22 Aug 09:03.",
"id": null,
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": "20260822-090322",
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
},
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "open",
"why": "Asked on 22 Aug 09:03.",
"id": null,
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
]
},
{
"say": "Nothing broken, but there is a Watch: Knock Control peak 0.53: costs about 0.4° of timing, not damage.",
"afterFlash": "Knock Control started at 0.49 and settled to your Baseline (0.50): that is what a fresh flash does.",
"window": "based on your 2 Drives, 22 Aug 09:03 to 22 Aug 09:50",
"windowDrives": [
"20260822-090322",
"20260822-095021"
],
"windowSince": null,
"numbers": [
{
"label": "intake air, moving",
"value": "60",
"unit": "°C"
},
{
"label": "Knock Control, start → peak",
"value": "0.49 → 0.53",
"unit": ""
},
{
"label": "worst fuel trim",
"value": "−3.9",
"unit": "%"
},
{
"label": "hard pulls",
"value": "0",
"unit": ""
}
],
"mapVersion": {
"line": "on Map version 1 · Starter 21 Dual Tune 2",
"version": 1,
"name": "Starter 21 Dual Tune 2",
"since": null,
"kind": "ktuner-basemap"
},
"verdict": "Watch",
"settled": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked."
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Intake 60 °C while moving: not a Cool Drive."
}
],
"wasted": "This Drive settles nothing: it was too warm to be a Cool Drive. A Cool Drive with 2 pulls would have settled the Baseline.",
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median -3.1 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; no Cool drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot max 1.9 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": {
"driveId": "20260822-095021",
"start": 1787367021000,
"cause": "heat"
},
"shakedownPending": false,
"unexplained": []
},
"stepFail": null
},
"cause": null,
"nextStep": {
"kind": "drive",
"key": "baseline",
"title": "Log one Cool-morning drive with 2 pulls",
"body": "",
"recipe": null,
"gauges": null,
"same": true,
"proves": "a Cool Drive with 2 pulls to measure every later Drive against",
"upload": "after that morning Drive",
"uploadWhen": "Upload when: after that morning Drive.",
"flashPlan": null,
"also": null
},
"readback": null,
"questions": [],
"housing": null,
"harness": {
"checked": 12,
"seconds": 0,
"line": "Checked 12 things · 0 s",
"steps": [
{
"name": "readLog",
"title": "Read the TunerView log",
"inputs": "sha1:aaf37d61226d",
"output": "sha1:2a3162ae3c96",
"ms": 0
},
{
"name": "ingestUpload",
"title": "Add the Drive to your Car history",
"inputs": "sha1:aaf37d61226d",
"output": "sha1:f30d5ec47aa1",
"ms": 0
},
{
"name": "carHistory",
"title": "Compare with your earlier Drives",
"inputs": "sha1:af9615169383",
"output": "sha1:f06f769f0bff",
"ms": 0
},
{
"name": "overview",
"title": "Check every safety line",
"inputs": "sha1:3ffcc912f940",
"output": "sha1:1b20f7331bb2",
"ms": 0
},
{
"name": "driveFacts",
"title": "Read this Drive's numbers",
"inputs": "sha1:3ffcc912f940",
"output": "sha1:a5607f225700",
"ms": 0
},
{
"name": "logQuality",
"title": "Check the log against the drive brief",
"inputs": "sha1:3ffcc912f940",
"output": "sha1:2be9335e2e5b",
"ms": 0
},
{
"name": "heat",
"title": "Read intake, coolant and CVT heat",
"inputs": "sha1:3ffcc912f940",
"output": "sha1:db707afc4a14",
"ms": 0
},
{
"name": "flashPlan",
"title": "Work out the Flash plan",
"inputs": "sha1:af9615169383",
"output": "sha1:821ad4e3c961",
"ms": 0
},
{
"name": "ceilingRead",
"title": "Read whether more boost can show",
"inputs": "sha1:af9615169383",
"output": "sha1:b8aeaac5b4e4",
"ms": 0
},
{
"name": "settleOpenSteps",
"title": "Settle what I asked last time",
"inputs": "sha1:b79c4420ccfa",
"output": "sha1:678aa5f0c88d",
"ms": 0
},
{
"name": "nextStep",
"title": "Decide the Next step",
"inputs": "sha1:b79c4420ccfa",
"output": "sha1:de2fd4c2790a",
"ms": 0
},
{
"name": "ownerQuestions",
"title": "Ask what only you know",
"inputs": "sha1:b79c4420ccfa",
"output": "sha1:c1949c6838f9",
"ms": 0
}
]
},
"checkpoints": [
{
"id": "rate",
"label": "Logged 10 times a second or faster",
"value": "7.5 a second",
"met": false
},
{
"id": "moving",
"label": "10 minutes or more of moving",
"value": "13 min",
"met": true
},
{
"id": "gauges",
"label": "Every gauge moving",
"value": "all moving",
"met": true
},
{
"id": "channels",
"label": "AFR Command and MAF Hz in the log",
"value": "missing: AFR Command and MAF Hz",
"met": false
},
{
"id": "warm",
"label": "Engine warm (coolant 80 °C or more)",
"value": "92 °C peak",
"met": true
},
{
"id": "cool",
"label": "Cool intake while moving (under 42 °C)",
"value": "60 °C",
"met": false
},
{
"id": "pulls",
"label": "2 full-throttle pulls",
"value": "0 hard pulls",
"met": false
},
{
"id": "pullIat",
"label": "Pulls started under 48 °C intake",
"value": "no pull to time",
"met": null
}
],
"health": {
"line": "Yes, with things to watch. Nothing here is damaging the engine; the list below fixes them in order.",
"rows": [
{
"system": "Fuel",
"id": "trims",
"label": "Fuel trims (cruise)",
"value": "-1.1 %",
"word": "OK",
"tone": "good",
"band": {
"value": -1.1,
"unit": "%",
"min": -15,
"max": 15,
"marks": [
{
"at": -10,
"label": "Stop -10",
"tone": "stop"
},
{
"at": -5,
"label": "Watch -5",
"tone": "watch"
},
{
"at": 5,
"label": "Watch +5",
"tone": "watch"
},
{
"at": 10,
"label": "Stop +10",
"tone": "stop"
}
],
"source": "kc-trims"
}
},
{
"system": "Fuel",
"id": "wotAfr",
"label": "Mixture at 12 psi and up",
"value": "No time at 12 psi or more",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Fuel",
"id": "fuelPress",
"label": "DI fuel pressure at WOT",
"value": "Not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "overshoot",
"label": "Boost overshoot",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "undershoot",
"label": "Boost reaches target",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "mafHz",
"label": "MAF sensor headroom",
"value": "MAF Hz not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Spark",
"id": "knock",
"label": "Knock retard at WOT",
"value": "5.5° under boost, scheduled by Knock Control (not knock events)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Spark",
"id": "kControl",
"label": "Fuel-quality score (Knock Control)",
"value": "0.49 → 0.50 (peak 0.53)",
"word": "OK",
"tone": "good",
"band": {
"value": 0.5,
"unit": "",
"min": 0.45,
"max": 0.85,
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
},
{
"at": 0.8,
"label": "Stop 0.80",
"tone": "stop"
}
],
"source": "kc-ranges"
}
},
{
"system": "Heat",
"id": "iat",
"label": "Intake air temp",
"value": "64 °C peak under boost",
"word": "Watch",
"tone": "watch",
"band": {
"value": 64,
"unit": "°C",
"min": 20,
"max": 64,
"marks": [
{
"at": 42,
"label": "Cool 42",
"tone": "none"
},
{
"at": 48,
"label": "Pull start 48",
"tone": "none"
}
],
"source": "kc-drive-brief"
}
},
{
"system": "Heat",
"id": "ect",
"label": "Coolant temp",
"value": "92 °C peak",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "cvtTemp",
"label": "CVT fluid temp",
"value": "79 °C peak",
"word": "OK",
"tone": "good",
"band": {
"value": 79,
"unit": "°C",
"min": 30,
"max": 110,
"marks": [
{
"at": 90,
"label": "Watch 90",
"tone": "watch"
},
{
"at": 100,
"label": "Stop 100",
"tone": "stop"
}
],
"source": "kc-cvt"
}
},
{
"system": "CVT",
"id": "slip",
"label": "CVT slip (revs without speed)",
"value": "No slip seen under boost",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "lowBoost",
"label": "Boost below 3,000 rpm",
"value": "Needs a pull and boost",
"word": "Can't tell",
"tone": "none",
"band": null
}
]
},
"calibration": {
"status": "none",
"settled": false,
"mapAction": "no-change",
"meaning": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null,
"lines": [
{
"label": "Pedal",
"value": "Not set yet: type the Pedal full reading in your car profile",
"tone": "watch"
},
{
"label": "Logger",
"value": "7.5 a second · AFR Command not checked · MAF Hz not checked",
"tone": "good"
},
{
"label": "Ceiling",
"value": "Can't tell yet: no Cool drive read since the ceiling last moved.",
"tone": "none"
},
{
"label": "What it means",
"value": "No map change yet: drive the Calibration drive on a cool morning.",
"tone": "none"
}
]
},
"tour": {
"families": [
{
"family": "airflow",
"title": "Airflow (MAF Scaling)",
"what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
"card": "kc-table-maf",
"tables": [
"MAF_Scaling_Custom",
"MAF_Scaling_Factory",
"MAF_Scaling_PRL_Race",
"MAF_Scaling_27Won_Race"
],
"status": "fine",
"reason": "No change: trims within ±5 % (median -3.1 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"family": "mixture",
"title": "Full-throttle mixture (WOT Enrich)",
"what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
"card": "kc-table-wot",
"tables": [
"WOT_Enrich_L",
"WOT_Enrich_H"
],
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"family": "boost",
"title": "Boost targets and limits",
"what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
"card": "kc-table-boost",
"tables": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H",
"Boost_Target_1_ECO_L",
"Boost_Target_1_ECO_H",
"Final_Boost_Target_L",
"Final_Boost_Target_H",
"Boost_By_Gear_Limits",
"Cylinder_Fill_Limitation_L",
"Cylinder_Fill_Limitation_H"
],
"status": "locked",
"reason": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null
},
{
"family": "ignition",
"title": "Ignition timing",
"what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
"card": "kc-table-ignition",
"tables": [
"Ignition_Base_L",
"Ignition_Base_H",
"Ignition_Max_L",
"Ignition_Max_H",
"Ethanol_Ign_Adj_L",
"Ethanol_Ign_Adj_H"
],
"status": "read-only",
"reason": "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove timing where retard collects, never add it without a dyno.",
"unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing)."
},
{
"family": "knock",
"title": "Knock sensitivity",
"what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
"card": "kc-table-ignition",
"tables": [
"Knock_Sens_1+4_L",
"Knock_Sens_1+4_H",
"Knock_Sens_2+3_L",
"Knock_Sens_2+3_H"
],
"status": "read-only",
"reason": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
"unlocks": "Nothing in this app: this one stays with the basemap."
},
{
"family": "basemap",
"title": "Left to the basemap",
"what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
"card": "kc-tune-order",
"tables": [
"DI_Fuel_Pressure_Target_0pct",
"DI_Fuel_Pressure_Target_55pct",
"WOT_Exhaust_VTC_Low_Cam",
"Ethanol_Boost_Target_Adj_L",
"Ethanol_Boost_Target_Adj_H"
],
"status": "read-only",
"reason": "Leave to the basemap: these are matched to the hardware, not to a street log.",
"unlocks": "Hardware changes a professional tuner would recalibrate for."
}
],
"headline": "Your logs support no map change right now."
},
"tags": {
"fuel": null,
"slot": 1
},
"pictures": [
{
"kind": "trace",
"title": "Fuel-quality score 0.49 → 0.53",
"unit": "",
"series": [
{
"name": "Fuel-quality score",
"points": [
[
-60,
0.49
],
[
-58,
0.49
],
[
-57,
0.49
],
[
-56,
0.49
],
[
-54,
0.49
],
[
-53,
0.49
],
[
-51,
0.49
],
[
-50,
0.49
],
[
-48,
0.49
],
[
-46,
0.49
],
[
-45,
0.49
],
[
-43,
0.49
],
[
-42,
0.49
],
[
-40,
0.49
],
[
-39,
0.49
],
[
-38,
0.49
],
[
-36,
0.49
],
[
-34,
0.49
],
[
-33,
0.49
],
[
-31,
0.49
],
[
-30,
0.49
],
[
-29,
0.49
],
[
-27,
0.49
],
[
-26,
0.49
],
[
-24,
0.49
],
[
-23,
0.49
],
[
-21,
0.49
],
[
-20,
0.49
],
[
-18,
0.49
],
[
-17,
0.49
],
[
-15,
0.49
],
[
-14,
0.49
],
[
-12,
0.49
],
[
-11,
0.49
],
[
-9,
0.49
],
[
-8,
0.49
],
[
-6,
0.49
],
[
-5,
0.49
],
[
-3,
0.49
],
[
-2,
0.49
],
[
0,
0.49
],
[
1,
0.49
],
[
3,
0.49
],
[
5,
0.49
],
[
6,
0.5
],
[
8,
0.52
],
[
9,
0.52
],
[
11,
0.53
],
[
12,
0.53
],
[
14,
0.53
],
[
16,
0.53
],
[
17,
0.53
],
[
19,
0.53
],
[
20,
0.53
],
[
22,
0.53
],
[
23,
0.53
],
[
25,
0.53
],
[
26,
0.53
],
[
28,
0.53
],
[
29,
0.52
],
[
31,
0.53
],
[
32,
0.53
],
[
34,
0.53
],
[
35,
0.53
],
[
37,
0.53
],
[
38,
0.53
],
[
40,
0.53
],
[
41,
0.53
],
[
43,
0.53
],
[
44,
0.53
],
[
46,
0.53
],
[
48,
0.53
],
[
49,
0.53
],
[
51,
0.53
],
[
52,
0.53
],
[
54,
0.53
],
[
55,
0.53
],
[
57,
0.53
],
[
59,
0.53
]
]
}
],
"moment": {
"at": 0,
"label": "Fuel-quality score 0.49 → 0.53"
},
"numbers": [
0.49,
0.53
],
"momentIndex": 0,
"moments": 2,
"yRange": [
0.45,
0.7
],
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
}
]
}
],
"openSteps": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"id": "channels",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": "20260822-095021",
"settledAt": 1787367021000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"why": "Intake 60 °C while moving: not a Cool Drive.",
"id": "baseline",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": "20260822-095021",
"settledBy": "20260822-095021",
"settledAt": 1787367021000,
"word": "Can't tell yet",
"tone": "none"
}
]
},
{
"say": "Engine healthy: Knock Control peak 0.50: costs about 0.1° of timing, not damage.",
"afterFlash": "Knock Control started at 0.49 and settled to your Baseline (0.49): that is what a fresh flash does.",
"window": "based on your 3 Drives, 22 Aug 09:03 to 23 Aug 19:59",
"windowDrives": [
"20260822-090322",
"20260822-095021",
"20260823-195901"
],
"windowSince": null,
"numbers": [
{
"label": "intake air, moving",
"value": "49",
"unit": "°C"
},
{
"label": "Knock Control, start → peak",
"value": "0.49 → 0.50",
"unit": ""
},
{
"label": "worst fuel trim",
"value": "−1.6",
"unit": "%"
},
{
"label": "hard pulls",
"value": "0",
"unit": ""
}
],
"mapVersion": {
"line": "on Map version 1 · Starter 21 Dual Tune 2",
"version": 1,
"name": "Starter 21 Dual Tune 2",
"since": null,
"kind": "ktuner-basemap"
},
"verdict": "OK",
"settled": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked."
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Intake 49 °C while moving: not a Cool Drive."
}
],
"wasted": "This Drive settles nothing: it was too warm to be a Cool Drive. A Cool Drive with 2 pulls would have settled the Baseline.",
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median -2.3 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; no Cool drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot max 1.9 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": false,
"unexplained": []
},
"stepFail": null
},
"cause": null,
"nextStep": {
"kind": "drive",
"key": "baseline",
"title": "Log one Cool-morning drive with 2 pulls",
"body": "",
"recipe": null,
"gauges": null,
"same": true,
"proves": "a Cool Drive with 2 pulls to measure every later Drive against",
"upload": "after that morning Drive",
"uploadWhen": "Upload when: after that morning Drive.",
"flashPlan": null,
"also": null
},
"readback": null,
"questions": [],
"housing": null,
"harness": {
"checked": 12,
"seconds": 0,
"line": "Checked 12 things · 0 s",
"steps": [
{
"name": "readLog",
"title": "Read the TunerView log",
"inputs": "sha1:76f20b2e4b1e",
"output": "sha1:bd768492159c",
"ms": 0
},
{
"name": "ingestUpload",
"title": "Add the Drive to your Car history",
"inputs": "sha1:76f20b2e4b1e",
"output": "sha1:cfb5d021aa52",
"ms": 0
},
{
"name": "carHistory",
"title": "Compare with your earlier Drives",
"inputs": "sha1:d2bfec0889ad",
"output": "sha1:b0245bfbadcb",
"ms": 0
},
{
"name": "overview",
"title": "Check every safety line",
"inputs": "sha1:e39e50f6c628",
"output": "sha1:0cfe90f175bf",
"ms": 0
},
{
"name": "driveFacts",
"title": "Read this Drive's numbers",
"inputs": "sha1:e39e50f6c628",
"output": "sha1:7b9bd6b27e0c",
"ms": 0
},
{
"name": "logQuality",
"title": "Check the log against the drive brief",
"inputs": "sha1:e39e50f6c628",
"output": "sha1:e70955a6a145",
"ms": 0
},
{
"name": "heat",
"title": "Read intake, coolant and CVT heat",
"inputs": "sha1:e39e50f6c628",
"output": "sha1:0abe7b3d1043",
"ms": 0
},
{
"name": "flashPlan",
"title": "Work out the Flash plan",
"inputs": "sha1:d2bfec0889ad",
"output": "sha1:400819ab0c04",
"ms": 0
},
{
"name": "ceilingRead",
"title": "Read whether more boost can show",
"inputs": "sha1:d2bfec0889ad",
"output": "sha1:b8aeaac5b4e4",
"ms": 0
},
{
"name": "settleOpenSteps",
"title": "Settle what I asked last time",
"inputs": "sha1:c11bde3b734e",
"output": "sha1:5d2de6d838d7",
"ms": 0
},
{
"name": "nextStep",
"title": "Decide the Next step",
"inputs": "sha1:c11bde3b734e",
"output": "sha1:90a4ccf8b447",
"ms": 0
},
{
"name": "ownerQuestions",
"title": "Ask what only you know",
"inputs": "sha1:c11bde3b734e",
"output": "sha1:c1949c6838f9",
"ms": 0
}
]
},
"checkpoints": [
{
"id": "rate",
"label": "Logged 10 times a second or faster",
"value": "7.5 a second",
"met": false
},
{
"id": "moving",
"label": "10 minutes or more of moving",
"value": "22 min",
"met": true
},
{
"id": "gauges",
"label": "Every gauge moving",
"value": "all moving",
"met": true
},
{
"id": "channels",
"label": "AFR Command and MAF Hz in the log",
"value": "missing: AFR Command and MAF Hz",
"met": false
},
{
"id": "warm",
"label": "Engine warm (coolant 80 °C or more)",
"value": "92 °C peak",
"met": true
},
{
"id": "cool",
"label": "Cool intake while moving (under 42 °C)",
"value": "49 °C",
"met": false
},
{
"id": "pulls",
"label": "2 full-throttle pulls",
"value": "0 hard pulls",
"met": false
},
{
"id": "pullIat",
"label": "Pulls started under 48 °C intake",
"value": "no pull to time",
"met": null
}
],
"health": {
"line": "Nothing wrong seen, but 6 checks couldn't be read on this log.",
"rows": [
{
"system": "Fuel",
"id": "trims",
"label": "Fuel trims (cruise)",
"value": "+0.6 %",
"word": "OK",
"tone": "good",
"band": {
"value": 0.6,
"unit": "%",
"min": -15,
"max": 15,
"marks": [
{
"at": -10,
"label": "Stop -10",
"tone": "stop"
},
{
"at": -5,
"label": "Watch -5",
"tone": "watch"
},
{
"at": 5,
"label": "Watch +5",
"tone": "watch"
},
{
"at": 10,
"label": "Stop +10",
"tone": "stop"
}
],
"source": "kc-trims"
}
},
{
"system": "Fuel",
"id": "wotAfr",
"label": "Mixture at 12 psi and up",
"value": "No time at 12 psi or more",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Fuel",
"id": "fuelPress",
"label": "DI fuel pressure at WOT",
"value": "Not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "overshoot",
"label": "Boost overshoot",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "undershoot",
"label": "Boost reaches target",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "mafHz",
"label": "MAF sensor headroom",
"value": "MAF Hz not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Spark",
"id": "knock",
"label": "Knock retard at WOT",
"value": "5.0° under boost, scheduled by Knock Control (not knock events)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Spark",
"id": "kControl",
"label": "Fuel-quality score (Knock Control)",
"value": "0.49 → 0.49",
"word": "OK",
"tone": "good",
"band": {
"value": 0.49,
"unit": "",
"min": 0.45,
"max": 0.85,
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
},
{
"at": 0.8,
"label": "Stop 0.80",
"tone": "stop"
}
],
"source": "kc-ranges"
}
},
{
"system": "Heat",
"id": "iat",
"label": "Intake air temp",
"value": "40 °C peak under boost",
"word": "OK",
"tone": "good",
"band": {
"value": 40,
"unit": "°C",
"min": 20,
"max": 60,
"marks": [
{
"at": 42,
"label": "Cool 42",
"tone": "none"
},
{
"at": 48,
"label": "Pull start 48",
"tone": "none"
}
],
"source": "kc-drive-brief"
}
},
{
"system": "Heat",
"id": "ect",
"label": "Coolant temp",
"value": "92 °C peak",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "cvtTemp",
"label": "CVT fluid temp",
"value": "68 °C peak",
"word": "OK",
"tone": "good",
"band": {
"value": 68,
"unit": "°C",
"min": 30,
"max": 110,
"marks": [
{
"at": 90,
"label": "Watch 90",
"tone": "watch"
},
{
"at": 100,
"label": "Stop 100",
"tone": "stop"
}
],
"source": "kc-cvt"
}
},
{
"system": "CVT",
"id": "slip",
"label": "CVT slip (revs without speed)",
"value": "No slip seen under boost",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "lowBoost",
"label": "Boost below 3,000 rpm",
"value": "Needs a pull and boost",
"word": "Can't tell",
"tone": "none",
"band": null
}
]
},
"calibration": {
"status": "none",
"settled": false,
"mapAction": "no-change",
"meaning": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null,
"lines": [
{
"label": "Pedal",
"value": "Not set yet: type the Pedal full reading in your car profile",
"tone": "watch"
},
{
"label": "Logger",
"value": "7.5 a second · AFR Command not checked · MAF Hz not checked",
"tone": "good"
},
{
"label": "Ceiling",
"value": "Can't tell yet: no Cool drive read since the ceiling last moved.",
"tone": "none"
},
{
"label": "What it means",
"value": "No map change yet: drive the Calibration drive on a cool morning.",
"tone": "none"
}
]
},
"tour": {
"families": [
{
"family": "airflow",
"title": "Airflow (MAF Scaling)",
"what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
"card": "kc-table-maf",
"tables": [
"MAF_Scaling_Custom",
"MAF_Scaling_Factory",
"MAF_Scaling_PRL_Race",
"MAF_Scaling_27Won_Race"
],
"status": "fine",
"reason": "No change: trims within ±5 % (median -2.3 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"family": "mixture",
"title": "Full-throttle mixture (WOT Enrich)",
"what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
"card": "kc-table-wot",
"tables": [
"WOT_Enrich_L",
"WOT_Enrich_H"
],
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"family": "boost",
"title": "Boost targets and limits",
"what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
"card": "kc-table-boost",
"tables": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H",
"Boost_Target_1_ECO_L",
"Boost_Target_1_ECO_H",
"Final_Boost_Target_L",
"Final_Boost_Target_H",
"Boost_By_Gear_Limits",
"Cylinder_Fill_Limitation_L",
"Cylinder_Fill_Limitation_H"
],
"status": "locked",
"reason": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null
},
{
"family": "ignition",
"title": "Ignition timing",
"what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
"card": "kc-table-ignition",
"tables": [
"Ignition_Base_L",
"Ignition_Base_H",
"Ignition_Max_L",
"Ignition_Max_H",
"Ethanol_Ign_Adj_L",
"Ethanol_Ign_Adj_H"
],
"status": "read-only",
"reason": "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove timing where retard collects, never add it without a dyno.",
"unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing)."
},
{
"family": "knock",
"title": "Knock sensitivity",
"what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
"card": "kc-table-ignition",
"tables": [
"Knock_Sens_1+4_L",
"Knock_Sens_1+4_H",
"Knock_Sens_2+3_L",
"Knock_Sens_2+3_H"
],
"status": "read-only",
"reason": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
"unlocks": "Nothing in this app: this one stays with the basemap."
},
{
"family": "basemap",
"title": "Left to the basemap",
"what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
"card": "kc-tune-order",
"tables": [
"DI_Fuel_Pressure_Target_0pct",
"DI_Fuel_Pressure_Target_55pct",
"WOT_Exhaust_VTC_Low_Cam",
"Ethanol_Boost_Target_Adj_L",
"Ethanol_Boost_Target_Adj_H"
],
"status": "read-only",
"reason": "Leave to the basemap: these are matched to the hardware, not to a street log.",
"unlocks": "Hardware changes a professional tuner would recalibrate for."
}
],
"headline": "Your logs support no map change right now."
},
"tags": {
"fuel": null,
"slot": 1
},
"pictures": [],
"openSteps": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"id": "channels",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": "20260823-195901",
"settledAt": 1787489941000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"why": "Intake 49 °C while moving: not a Cool Drive.",
"id": "baseline",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": "20260823-195901",
"settledBy": "20260823-195901",
"settledAt": 1787489941000,
"word": "Can't tell yet",
"tone": "none"
}
]
},
{
"say": "Stop driving hard: worst fuel trim −21.4 %, Knock Control peak 0.50: costs about 0.1° of timing, not damage.",
"afterFlash": null,
"window": "based on your 4 Drives, 22 Aug 09:03 to 23 Aug 20:38",
"windowDrives": [
"20260822-090322",
"20260822-095021",
"20260823-195901",
"20260823-203853"
],
"windowSince": null,
"numbers": [
{
"label": "intake air, moving",
"value": "45",
"unit": "°C"
},
{
"label": "Knock Control, start → peak",
"value": "0.50 → 0.50",
"unit": ""
},
{
"label": "worst fuel trim",
"value": "−21.4",
"unit": "%"
},
{
"label": "hard pulls",
"value": "0",
"unit": ""
}
],
"mapVersion": {
"line": "on Map version 1 · Starter 21 Dual Tune 2",
"version": 1,
"name": "Starter 21 Dual Tune 2",
"since": null,
"kind": "ktuner-basemap"
},
"verdict": "Stop",
"settled": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked."
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Intake 45 °C while moving: not a Cool Drive."
}
],
"wasted": null,
"flashPlan": {
"kind": "undo",
"changeId": "undo",
"family": null,
"headline": "Stop open: flash your previous map file, and tell me which one it is.",
"route": "preset",
"basis": "Data",
"proof": "The next Shakedown drive passes: 10 calm minutes with trims within ±5 %, score near the Baseline, no lean mixture.",
"saveAs": null,
"undoName": "your previous map file — I need you to tell me which one",
"undo": {
"known": false,
"version": null,
"name": null,
"from": null,
"stamp": null,
"label": null,
"headline": "your previous map file — I need you to tell me which one"
},
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": "other",
"evidence": [
{
"drives": [
"20260823-203853"
],
"text": "Drive 20260823-203853 is a Stop (worst trim -21.4 %) on Map version 1 · Starter 21 Dual Tune 2.",
"basis": "Data"
}
],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "locked",
"reason": "Superseded by the open Stop: undo first. Trims off everywhere route to pick the right preset / Undo, never a curve edit.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2).",
"unlocks": "—"
}
],
"openIssues": {
"stop": {
"driveId": "20260823-203853",
"start": 1787492333000,
"cause": "trims"
},
"watch": null,
"shakedownPending": false,
"unexplained": [
{
"driveId": "20260823-203853",
"reasons": [
"trim"
]
}
]
},
"stepFail": null,
"ktunerCard": null
},
"cause": "Trims pulled −21.4 % in every band from the first minute, right after a change: the airflow reading is off, not the fuel.",
"nextStep": {
"kind": "flash",
"key": "undo",
"title": "Put the map from before back on the car",
"body": "Trims pulled −21.4 % in every band from the first minute, right after a change: the airflow reading is off, not the fuel.",
"recipe": {
"intro": "",
"steps": [
"In KTuner, save today's map under a new name so nothing is lost.",
"Open the file you ran before this drive and flash it.",
"Drive 10 calm minutes (the Shakedown), then attach the log here."
]
},
"gauges": null,
"same": false,
"proves": "trims back within ±5 % over 10 calm minutes",
"upload": "after the first calm drive on the old file",
"uploadWhen": "Upload when: after the first calm drive on the old file.",
"flashPlan": {
"kind": "undo",
"changeId": "undo",
"family": null,
"headline": "Stop open: flash your previous map file, and tell me which one it is.",
"route": "preset",
"basis": "Data",
"proof": "The next Shakedown drive passes: 10 calm minutes with trims within ±5 %, score near the Baseline, no lean mixture.",
"saveAs": null,
"undoName": "your previous map file — I need you to tell me which one",
"undo": {
"known": false,
"version": null,
"name": null,
"from": null,
"stamp": null,
"label": null,
"headline": "your previous map file — I need you to tell me which one"
},
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": "other",
"evidence": [
{
"drives": [
"20260823-203853"
],
"text": "Drive 20260823-203853 is a Stop (worst trim -21.4 %) on Map version 1 · Starter 21 Dual Tune 2.",
"basis": "Data"
}
],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "locked",
"reason": "Superseded by the open Stop: undo first. Trims off everywhere route to pick the right preset / Undo, never a curve edit.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2).",
"unlocks": "—"
}
],
"openIssues": {
"stop": {
"driveId": "20260823-203853",
"start": 1787492333000,
"cause": "trims"
},
"watch": null,
"shakedownPending": false,
"unexplained": [
{
"driveId": "20260823-203853",
"reasons": [
"trim"
]
}
]
},
"stepFail": null,
"ktunerCard": null
},
"also": null
},
"readback": null,
"questions": [
{
"id": "what-changed:20260823-203853",
"kind": "what-changed",
"title": "What changed",
"question": "What changed between your 23 Aug 19:59 drive and this one?",
"choices": [
{
"id": "maf",
"label": "I flashed, changing MAF Scaling"
},
{
"id": "other-flash",
"label": "I flashed something else"
},
{
"id": "part",
"label": "I fitted a part, no flash"
},
{
"id": "nothing",
"label": "Nothing I know of"
}
],
"askedOn": "20260823-203853",
"answer": null
},
{
"id": "housing:20260823-203853",
"kind": "housing",
"title": "Which intake housing is fitted",
"question": "Which intake housing is fitted?",
"choices": [
{
"id": "factory",
"label": "Factory airbox"
},
{
"id": "hvi",
"label": "PRL HVI"
},
{
"id": "race",
"label": "PRL Race housing"
},
{
"id": "won",
"label": "27WON Race"
},
{
"id": "unsure",
"label": "Not sure"
}
],
"askedOn": "20260823-203853",
"answer": null
}
],
"housing": null,
"harness": {
"checked": 12,
"seconds": 0,
"line": "Checked 12 things · 0 s",
"steps": [
{
"name": "readLog",
"title": "Read the TunerView log",
"inputs": "sha1:9a8434034071",
"output": "sha1:a36f51799430",
"ms": 0
},
{
"name": "ingestUpload",
"title": "Add the Drive to your Car history",
"inputs": "sha1:9a8434034071",
"output": "sha1:5579f3978761",
"ms": 0
},
{
"name": "carHistory",
"title": "Compare with your earlier Drives",
"inputs": "sha1:9fbb05d6a06b",
"output": "sha1:b184b80e6e9f",
"ms": 0
},
{
"name": "overview",
"title": "Check every safety line",
"inputs": "sha1:bfeca88779e3",
"output": "sha1:e29b7d4ed29d",
"ms": 0
},
{
"name": "driveFacts",
"title": "Read this Drive's numbers",
"inputs": "sha1:bfeca88779e3",
"output": "sha1:89fb37667890",
"ms": 0
},
{
"name": "logQuality",
"title": "Check the log against the drive brief",
"inputs": "sha1:bfeca88779e3",
"output": "sha1:1b1b3e4d618d",
"ms": 0
},
{
"name": "heat",
"title": "Read intake, coolant and CVT heat",
"inputs": "sha1:bfeca88779e3",
"output": "sha1:b1228a865a39",
"ms": 0
},
{
"name": "flashPlan",
"title": "Work out the Flash plan",
"inputs": "sha1:9fbb05d6a06b",
"output": "sha1:70a7b9a6ed59",
"ms": 0
},
{
"name": "ceilingRead",
"title": "Read whether more boost can show",
"inputs": "sha1:9fbb05d6a06b",
"output": "sha1:b8aeaac5b4e4",
"ms": 0
},
{
"name": "settleOpenSteps",
"title": "Settle what I asked last time",
"inputs": "sha1:bfac983f0b10",
"output": "sha1:c4a924a2a9d9",
"ms": 0
},
{
"name": "nextStep",
"title": "Decide the Next step",
"inputs": "sha1:bfac983f0b10",
"output": "sha1:c74e281af728",
"ms": 0
},
{
"name": "ownerQuestions",
"title": "Ask what only you know",
"inputs": "sha1:bfac983f0b10",
"output": "sha1:55d8b545a5cc",
"ms": 0
}
]
},
"checkpoints": [
{
"id": "rate",
"label": "Logged 10 times a second or faster",
"value": "7.5 a second",
"met": false
},
{
"id": "moving",
"label": "10 minutes or more of moving",
"value": "10 min",
"met": true
},
{
"id": "gauges",
"label": "Every gauge moving",
"value": "all moving",
"met": true
},
{
"id": "channels",
"label": "AFR Command and MAF Hz in the log",
"value": "missing: AFR Command and MAF Hz",
"met": false
},
{
"id": "warm",
"label": "Engine warm (coolant 80 °C or more)",
"value": "92 °C peak",
"met": true
},
{
"id": "cool",
"label": "Cool intake while moving (under 42 °C)",
"value": "45 °C",
"met": false
},
{
"id": "pulls",
"label": "2 full-throttle pulls",
"value": "0 hard pulls",
"met": false
},
{
"id": "pullIat",
"label": "Pulls started under 48 °C intake",
"value": "no pull to time",
"met": null
}
],
"health": {
"line": "Not yet. Fix the Stop before any more hard pulls.",
"rows": [
{
"system": "Fuel",
"id": "trims",
"label": "Fuel trims (cruise)",
"value": "-18.6 %",
"word": "Stop",
"tone": "stop",
"band": {
"value": -18.6,
"unit": "%",
"min": -18.6,
"max": 18.6,
"marks": [
{
"at": -10,
"label": "Stop -10",
"tone": "stop"
},
{
"at": -5,
"label": "Watch -5",
"tone": "watch"
},
{
"at": 5,
"label": "Watch +5",
"tone": "watch"
},
{
"at": 10,
"label": "Stop +10",
"tone": "stop"
}
],
"source": "kc-trims"
}
},
{
"system": "Fuel",
"id": "wotAfr",
"label": "Mixture at 12 psi and up",
"value": "No time at 12 psi or more",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Fuel",
"id": "fuelPress",
"label": "DI fuel pressure at WOT",
"value": "Not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "overshoot",
"label": "Boost overshoot",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "undershoot",
"label": "Boost reaches target",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "mafHz",
"label": "MAF sensor headroom",
"value": "MAF Hz not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Spark",
"id": "knock",
"label": "Knock retard at WOT",
"value": "6.0° worst at 1,434 rpm",
"word": "Stop",
"tone": "stop",
"band": null
},
{
"system": "Spark",
"id": "kControl",
"label": "Fuel-quality score (Knock Control)",
"value": "0.50 → 0.49. Starts high after a Flash, ECU reset or new tank: give it 10–15 calm minutes before judging",
"word": "OK",
"tone": "good",
"band": {
"value": 0.49,
"unit": "",
"min": 0.45,
"max": 0.85,
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
},
{
"at": 0.8,
"label": "Stop 0.80",
"tone": "stop"
}
],
"source": "kc-ranges"
}
},
{
"system": "Heat",
"id": "iat",
"label": "Intake air temp",
"value": "48 °C peak under boost",
"word": "OK",
"tone": "good",
"band": {
"value": 48,
"unit": "°C",
"min": 20,
"max": 60,
"marks": [
{
"at": 42,
"label": "Cool 42",
"tone": "none"
},
{
"at": 48,
"label": "Pull start 48",
"tone": "none"
}
],
"source": "kc-drive-brief"
}
},
{
"system": "Heat",
"id": "ect",
"label": "Coolant temp",
"value": "92 °C peak",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "cvtTemp",
"label": "CVT fluid temp",
"value": "85 °C peak",
"word": "OK",
"tone": "good",
"band": {
"value": 85,
"unit": "°C",
"min": 30,
"max": 110,
"marks": [
{
"at": 90,
"label": "Watch 90",
"tone": "watch"
},
{
"at": 100,
"label": "Stop 100",
"tone": "stop"
}
],
"source": "kc-cvt"
}
},
{
"system": "CVT",
"id": "slip",
"label": "CVT slip (revs without speed)",
"value": "No slip seen under boost",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "lowBoost",
"label": "Boost below 3,000 rpm",
"value": "Needs a pull and boost",
"word": "Can't tell",
"tone": "none",
"band": null
}
]
},
"calibration": {
"status": "none",
"settled": false,
"mapAction": "no-change",
"meaning": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null,
"lines": [
{
"label": "Pedal",
"value": "Not set yet: type the Pedal full reading in your car profile",
"tone": "watch"
},
{
"label": "Logger",
"value": "7.5 a second · AFR Command not checked · MAF Hz not checked",
"tone": "good"
},
{
"label": "Ceiling",
"value": "Can't tell yet: no Cool drive read since the ceiling last moved.",
"tone": "none"
},
{
"label": "What it means",
"value": "No map change yet: drive the Calibration drive on a cool morning.",
"tone": "none"
}
]
},
"tour": {
"families": [
{
"family": "airflow",
"title": "Airflow (MAF Scaling)",
"what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
"card": "kc-table-maf",
"tables": [
"MAF_Scaling_Custom",
"MAF_Scaling_Factory",
"MAF_Scaling_PRL_Race",
"MAF_Scaling_27Won_Race"
],
"status": "locked",
"reason": "Superseded by the open Stop: undo first. Trims off everywhere route to pick the right preset / Undo, never a curve edit.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"family": "mixture",
"title": "Full-throttle mixture (WOT Enrich)",
"what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
"card": "kc-table-wot",
"tables": [
"WOT_Enrich_L",
"WOT_Enrich_H"
],
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"family": "boost",
"title": "Boost targets and limits",
"what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
"card": "kc-table-boost",
"tables": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H",
"Boost_Target_1_ECO_L",
"Boost_Target_1_ECO_H",
"Final_Boost_Target_L",
"Final_Boost_Target_H",
"Boost_By_Gear_Limits",
"Cylinder_Fill_Limitation_L",
"Cylinder_Fill_Limitation_H"
],
"status": "locked",
"reason": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null
},
{
"family": "ignition",
"title": "Ignition timing",
"what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
"card": "kc-table-ignition",
"tables": [
"Ignition_Base_L",
"Ignition_Base_H",
"Ignition_Max_L",
"Ignition_Max_H",
"Ethanol_Ign_Adj_L",
"Ethanol_Ign_Adj_H"
],
"status": "read-only",
"reason": "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove timing where retard collects, never add it without a dyno.",
"unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing)."
},
{
"family": "knock",
"title": "Knock sensitivity",
"what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
"card": "kc-table-ignition",
"tables": [
"Knock_Sens_1+4_L",
"Knock_Sens_1+4_H",
"Knock_Sens_2+3_L",
"Knock_Sens_2+3_H"
],
"status": "read-only",
"reason": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
"unlocks": "Nothing in this app: this one stays with the basemap."
},
{
"family": "basemap",
"title": "Left to the basemap",
"what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
"card": "kc-tune-order",
"tables": [
"DI_Fuel_Pressure_Target_0pct",
"DI_Fuel_Pressure_Target_55pct",
"WOT_Exhaust_VTC_Low_Cam",
"Ethanol_Boost_Target_Adj_L",
"Ethanol_Boost_Target_Adj_H"
],
"status": "read-only",
"reason": "Leave to the basemap: these are matched to the hardware, not to a street log.",
"unlocks": "Hardware changes a professional tuner would recalibrate for."
}
],
"headline": "Stop open: flash your previous map file, and tell me which one it is."
},
"tags": {
"fuel": null,
"slot": 1
},
"pictures": [],
"openSteps": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"id": "channels",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": "20260823-203853",
"settledAt": 1787492333000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"why": "Intake 45 °C while moving: not a Cool Drive.",
"id": "baseline",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": "20260823-195901",
"settledBy": "20260823-203853",
"settledAt": 1787492333000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "undo",
"title": "Undo: trims back within ±5 %",
"status": "open",
"why": "Asked on 23 Aug 20:38.",
"id": null,
"askedOn": "20260823-203853",
"askedAt": 1787492333000,
"lastAskedOn": "20260823-203853",
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
]
},
{
"say": "Nothing read: under a minute moving",
"afterFlash": null,
"window": "nothing read — your Car history still holds 4 Drives",
"windowDrives": [],
"windowSince": null,
"numbers": [],
"mapVersion": null,
"verdict": null,
"settled": [],
"wasted": "This Drive settles nothing: it was too short (under a minute moving). A drive of 10 calm minutes would have settled the Undo.",
"flashPlan": null,
"cause": null,
"nextStep": {
"kind": "none",
"key": "tooShort",
"title": "Nothing read: the drive was too short",
"body": "Under a minute moving. I keep your Car history clean and I don't judge it. The step you already have stands: Undo: trims back within ±5 %. Upload after a drive of 10 minutes or more.",
"recipe": null,
"gauges": null,
"same": false,
"proves": "",
"upload": "after a drive of 10 minutes or more",
"uploadWhen": "Upload when: after a drive of 10 minutes or more.",
"flashPlan": null,
"also": null
},
"readback": null,
"questions": [],
"housing": null,
"harness": {
"checked": 7,
"seconds": 0,
"line": "Checked 7 things · 0 s",
"steps": [
{
"name": "readLog",
"title": "Read the TunerView log",
"inputs": "sha1:104e4b99a7a5",
"output": "sha1:fed9abc749dd",
"ms": 0
},
{
"name": "ingestUpload",
"title": "Add the Drive to your Car history",
"inputs": "sha1:104e4b99a7a5",
"output": "sha1:262a2ff2a88b",
"ms": 0
},
{
"name": "carHistory",
"title": "Compare with your earlier Drives",
"inputs": "sha1:3bc4feca19f5",
"output": "sha1:b184b80e6e9f",
"ms": 0
},
{
"name": "flashPlan",
"title": "Work out the Flash plan",
"inputs": "sha1:3bc4feca19f5",
"output": "sha1:4400193848c3",
"ms": 0
},
{
"name": "settleOpenSteps",
"title": "Settle what I asked last time",
"inputs": "sha1:1bdec412d6e5",
"output": "sha1:2a36c3efcd72",
"ms": 0
},
{
"name": "nextStep",
"title": "Decide the Next step",
"inputs": "sha1:1bdec412d6e5",
"output": "sha1:f03ae9f700bd",
"ms": 0
},
{
"name": "ownerQuestions",
"title": "Ask what only you know",
"inputs": "sha1:1bdec412d6e5",
"output": "sha1:c1949c6838f9",
"ms": 0
}
]
},
"tour": {
"families": [
{
"family": "airflow",
"title": "Airflow (MAF Scaling)",
"what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
"card": "kc-table-maf",
"tables": [
"MAF_Scaling_Custom",
"MAF_Scaling_Factory",
"MAF_Scaling_PRL_Race",
"MAF_Scaling_27Won_Race"
],
"status": "fine",
"reason": "No change: trims within ±5 % (no trim data yet).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"family": "mixture",
"title": "Full-throttle mixture (WOT Enrich)",
"what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
"card": "kc-table-wot",
"tables": [
"WOT_Enrich_L",
"WOT_Enrich_H"
],
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"family": "boost",
"title": "Boost targets and limits",
"what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
"card": "kc-table-boost",
"tables": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H",
"Boost_Target_1_ECO_L",
"Boost_Target_1_ECO_H",
"Final_Boost_Target_L",
"Final_Boost_Target_H",
"Boost_By_Gear_Limits",
"Cylinder_Fill_Limitation_L",
"Cylinder_Fill_Limitation_H"
],
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; no Cool drive yet; no hot drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"family": "ignition",
"title": "Ignition timing",
"what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
"card": "kc-table-ignition",
"tables": [
"Ignition_Base_L",
"Ignition_Base_H",
"Ignition_Max_L",
"Ignition_Max_H",
"Ethanol_Ign_Adj_L",
"Ethanol_Ign_Adj_H"
],
"status": "read-only",
"reason": "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove timing where retard collects, never add it without a dyno.",
"unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing)."
},
{
"family": "knock",
"title": "Knock sensitivity",
"what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
"card": "kc-table-ignition",
"tables": [
"Knock_Sens_1+4_L",
"Knock_Sens_1+4_H",
"Knock_Sens_2+3_L",
"Knock_Sens_2+3_H"
],
"status": "read-only",
"reason": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
"unlocks": "Nothing in this app: this one stays with the basemap."
},
{
"family": "basemap",
"title": "Left to the basemap",
"what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
"card": "kc-tune-order",
"tables": [
"DI_Fuel_Pressure_Target_0pct",
"DI_Fuel_Pressure_Target_55pct",
"WOT_Exhaust_VTC_Low_Cam",
"Ethanol_Boost_Target_Adj_L",
"Ethanol_Boost_Target_Adj_H"
],
"status": "read-only",
"reason": "Leave to the basemap: these are matched to the hardware, not to a street log.",
"unlocks": "Hardware changes a professional tuner would recalibrate for."
}
],
"headline": "Your logs support no map change right now."
},
"tags": {
"fuel": null,
"slot": 1
},
"pictures": [],
"openSteps": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"id": "channels",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": "20260823-203853",
"settledAt": 1787492333000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"why": "Intake 45 °C while moving: not a Cool Drive.",
"id": "baseline",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": "20260823-195901",
"settledBy": "20260823-203853",
"settledAt": 1787492333000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "undo",
"title": "Undo: trims back within ±5 %",
"status": "open",
"why": "Asked on 23 Aug 20:38.",
"id": "undo",
"askedOn": "20260823-203853",
"askedAt": 1787492333000,
"lastAskedOn": "20260823-203853",
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
]
},
{
"say": "Nothing broken, but there is a Watch: full-throttle AFR 10.7 (map asks 11.0, lean limit 12.0), Knock Control peak 0.59: costs about 1.0° of timing, not damage.",
"afterFlash": "Knock Control started at 0.58 and settled to your Baseline (0.49): that is what a fresh flash does.",
"window": "based on your 5 Drives, 22 Aug 09:03 to 30 Aug 15:29",
"windowDrives": [
"20260822-090322",
"20260822-095021",
"20260823-195901",
"20260823-203853",
"20260830-152931"
],
"windowSince": null,
"numbers": [
{
"label": "intake air, moving",
"value": "51",
"unit": "°C"
},
{
"label": "Knock Control, start → peak",
"value": "0.58 → 0.59",
"unit": ""
},
{
"label": "worst fuel trim",
"value": "−2.3",
"unit": "%"
},
{
"label": "hard pulls",
"value": "8",
"unit": ""
}
],
"mapVersion": {
"line": "on Map version 1 · Starter 21 Dual Tune 2",
"version": 1,
"name": "Starter 21 Dual Tune 2",
"since": null,
"kind": "ktuner-basemap"
},
"verdict": "Watch",
"settled": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked."
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Intake 51 °C while moving: not a Cool Drive."
},
{
"key": "undo",
"title": "Undo: trims back within ±5 %",
"status": "done",
"word": "Done",
"tone": "good",
"why": "Trims −2.3 % over 15 calm minutes (they were −21.4 %)."
}
],
"wasted": null,
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median -2.3 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; no Cool drive yet; the latest hot drive (30 Aug 15:29) started Knock Control at 0.58, not settled.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot max 1.9 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": {
"driveId": "20260830-152931",
"start": 1788078571000,
"cause": "score"
},
"shakedownPending": false,
"unexplained": [
{
"driveId": "20260823-203853",
"reasons": [
"trim"
]
}
]
},
"stepFail": null
},
"cause": null,
"nextStep": {
"kind": "drive",
"key": "baseline",
"title": "Log one Cool-morning drive with 2 pulls",
"body": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "Turbo Pressure",
"ok": "within +1.5 psi of Turbo Pressure Target",
"see": "more than +2.5 psi above Turbo Pressure Target, held",
"then": "Upload. A held overshoot is the only reason to touch boost."
}
]
},
"same": false,
"proves": "a Cool Drive with 2 pulls to measure every later Drive against",
"upload": "after that morning Drive",
"uploadWhen": "Upload when: after that morning Drive.",
"flashPlan": null,
"also": null
},
"readback": null,
"questions": [
{
"id": "did-flash:20260830-152931",
"kind": "did-flash",
"title": "Did you flash",
"question": "Knock Control started at 0.58 and settled: that is what a fresh flash does. Did you flash after the Stop?",
"choices": [
{
"id": "undo",
"label": "Yes, the old file back (Undo)"
},
{
"id": "other",
"label": "Yes, a different file"
},
{
"id": "no",
"label": "No"
}
],
"askedOn": "20260830-152931",
"answer": null
}
],
"housing": null,
"harness": {
"checked": 12,
"seconds": 0,
"line": "Checked 12 things · 0 s",
"steps": [
{
"name": "readLog",
"title": "Read the TunerView log",
"inputs": "sha1:467e818a9773",
"output": "sha1:1c83a7174ccf",
"ms": 0
},
{
"name": "ingestUpload",
"title": "Add the Drive to your Car history",
"inputs": "sha1:467e818a9773",
"output": "sha1:dc1ea9f6d9c6",
"ms": 0
},
{
"name": "carHistory",
"title": "Compare with your earlier Drives",
"inputs": "sha1:67a7737d7519",
"output": "sha1:93c1b98a34a5",
"ms": 0
},
{
"name": "overview",
"title": "Check every safety line",
"inputs": "sha1:2933a76fc5dc",
"output": "sha1:5c8d3170b492",
"ms": 0
},
{
"name": "driveFacts",
"title": "Read this Drive's numbers",
"inputs": "sha1:2933a76fc5dc",
"output": "sha1:482e178833fe",
"ms": 0
},
{
"name": "logQuality",
"title": "Check the log against the drive brief",
"inputs": "sha1:2933a76fc5dc",
"output": "sha1:2e4f6efb30c4",
"ms": 0
},
{
"name": "heat",
"title": "Read intake, coolant and CVT heat",
"inputs": "sha1:2933a76fc5dc",
"output": "sha1:03af1205cd0d",
"ms": 0
},
{
"name": "flashPlan",
"title": "Work out the Flash plan",
"inputs": "sha1:67a7737d7519",
"output": "sha1:4945cf14b90d",
"ms": 0
},
{
"name": "ceilingRead",
"title": "Read whether more boost can show",
"inputs": "sha1:67a7737d7519",
"output": "sha1:b8aeaac5b4e4",
"ms": 0
},
{
"name": "settleOpenSteps",
"title": "Settle what I asked last time",
"inputs": "sha1:38a6d65edf94",
"output": "sha1:ceb7ed74ac7b",
"ms": 0
},
{
"name": "nextStep",
"title": "Decide the Next step",
"inputs": "sha1:38a6d65edf94",
"output": "sha1:4c052604b122",
"ms": 0
},
{
"name": "ownerQuestions",
"title": "Ask what only you know",
"inputs": "sha1:38a6d65edf94",
"output": "sha1:0ff99cf081ab",
"ms": 0
}
]
},
"checkpoints": [
{
"id": "rate",
"label": "Logged 10 times a second or faster",
"value": "7.5 a second",
"met": false
},
{
"id": "moving",
"label": "10 minutes or more of moving",
"value": "16 min",
"met": true
},
{
"id": "gauges",
"label": "Every gauge moving",
"value": "all moving",
"met": true
},
{
"id": "channels",
"label": "AFR Command and MAF Hz in the log",
"value": "missing: AFR Command and MAF Hz",
"met": false
},
{
"id": "warm",
"label": "Engine warm (coolant 80 °C or more)",
"value": "91 °C peak",
"met": true
},
{
"id": "cool",
"label": "Cool intake while moving (under 42 °C)",
"value": "51 °C",
"met": false
},
{
"id": "pulls",
"label": "2 full-throttle pulls",
"value": "8 hard pulls",
"met": true
},
{
"id": "pullIat",
"label": "Pulls started under 48 °C intake",
"value": "49 °C",
"met": false
}
],
"health": {
"line": "Yes, with things to watch. Nothing here is damaging the engine; the list below fixes them in order.",
"rows": [
{
"system": "Fuel",
"id": "trims",
"label": "Fuel trims (cruise)",
"value": "+0.5 %",
"word": "OK",
"tone": "good",
"band": {
"value": 0.5,
"unit": "%",
"min": -15,
"max": 15,
"marks": [
{
"at": -10,
"label": "Stop -10",
"tone": "stop"
},
{
"at": -5,
"label": "Watch -5",
"tone": "watch"
},
{
"at": 5,
"label": "Watch +5",
"tone": "watch"
},
{
"at": 10,
"label": "Stop +10",
"tone": "stop"
}
],
"source": "kc-trims"
}
},
{
"system": "Fuel",
"id": "wotAfr",
"label": "Mixture at 12 psi and up",
"value": "10.2 AFR at 12 psi and up, map asks 11.0 (richer: safe)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Fuel",
"id": "fuelPress",
"label": "DI fuel pressure at WOT",
"value": "98 % of target (worst 5 %)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Air & boost",
"id": "overshoot",
"label": "Boost overshoot",
"value": "+1.4 psi at 3,236 rpm",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Air & boost",
"id": "undershoot",
"label": "Boost reaches target",
"value": "0.6 psi above target after spool",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Air & boost",
"id": "mafHz",
"label": "MAF sensor headroom",
"value": "MAF Hz not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Spark",
"id": "knock",
"label": "Knock retard at WOT",
"value": "5.0° under boost, scheduled by Knock Control (not knock events)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Spark",
"id": "kControl",
"label": "Fuel-quality score (Knock Control)",
"value": "0.58 → 0.49. Starts high after a Flash, ECU reset or new tank: give it 10–15 calm minutes before judging",
"word": "Watch",
"tone": "watch",
"band": {
"value": 0.49,
"unit": "",
"min": 0.45,
"max": 0.85,
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
},
{
"at": 0.8,
"label": "Stop 0.80",
"tone": "stop"
}
],
"source": "kc-ranges"
}
},
{
"system": "Heat",
"id": "iat",
"label": "Intake air temp",
"value": "53 °C peak in a pull",
"word": "Watch",
"tone": "watch",
"band": {
"value": 53,
"unit": "°C",
"min": 20,
"max": 60,
"marks": [
{
"at": 42,
"label": "Cool 42",
"tone": "none"
},
{
"at": 48,
"label": "Pull start 48",
"tone": "none"
}
],
"source": "kc-drive-brief"
}
},
{
"system": "Heat",
"id": "ect",
"label": "Coolant temp",
"value": "91 °C peak",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "cvtTemp",
"label": "CVT fluid temp",
"value": "93 °C peak",
"word": "Watch",
"tone": "watch",
"band": {
"value": 93,
"unit": "°C",
"min": 30,
"max": 110,
"marks": [
{
"at": 90,
"label": "Watch 90",
"tone": "watch"
},
{
"at": 100,
"label": "Stop 100",
"tone": "stop"
}
],
"source": "kc-cvt"
}
},
{
"system": "CVT",
"id": "slip",
"label": "CVT slip (revs without speed)",
"value": "No slip seen under boost",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "lowBoost",
"label": "Boost below 3,000 rpm",
"value": "-5.0 psi vs reference map",
"word": "OK",
"tone": "good",
"band": null
}
]
},
"calibration": {
"status": "none",
"settled": false,
"mapAction": "no-change",
"meaning": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null,
"lines": [
{
"label": "Pedal",
"value": "Not set yet: type the Pedal full reading in your car profile",
"tone": "watch"
},
{
"label": "Logger",
"value": "7.5 a second · AFR Command not checked · MAF Hz not checked",
"tone": "good"
},
{
"label": "Ceiling",
"value": "Can't tell yet: no Cool drive read since the ceiling last moved.",
"tone": "none"
},
{
"label": "What it means",
"value": "No map change yet: drive the Calibration drive on a cool morning.",
"tone": "none"
}
]
},
"tour": {
"families": [
{
"family": "airflow",
"title": "Airflow (MAF Scaling)",
"what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
"card": "kc-table-maf",
"tables": [
"MAF_Scaling_Custom",
"MAF_Scaling_Factory",
"MAF_Scaling_PRL_Race",
"MAF_Scaling_27Won_Race"
],
"status": "fine",
"reason": "No change: trims within ±5 % (median -2.3 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"family": "mixture",
"title": "Full-throttle mixture (WOT Enrich)",
"what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
"card": "kc-table-wot",
"tables": [
"WOT_Enrich_L",
"WOT_Enrich_H"
],
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"family": "boost",
"title": "Boost targets and limits",
"what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
"card": "kc-table-boost",
"tables": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H",
"Boost_Target_1_ECO_L",
"Boost_Target_1_ECO_H",
"Final_Boost_Target_L",
"Final_Boost_Target_H",
"Boost_By_Gear_Limits",
"Cylinder_Fill_Limitation_L",
"Cylinder_Fill_Limitation_H"
],
"status": "locked",
"reason": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null
},
{
"family": "ignition",
"title": "Ignition timing",
"what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
"card": "kc-table-ignition",
"tables": [
"Ignition_Base_L",
"Ignition_Base_H",
"Ignition_Max_L",
"Ignition_Max_H",
"Ethanol_Ign_Adj_L",
"Ethanol_Ign_Adj_H"
],
"status": "read-only",
"reason": "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove timing where retard collects, never add it without a dyno.",
"unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing)."
},
{
"family": "knock",
"title": "Knock sensitivity",
"what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
"card": "kc-table-ignition",
"tables": [
"Knock_Sens_1+4_L",
"Knock_Sens_1+4_H",
"Knock_Sens_2+3_L",
"Knock_Sens_2+3_H"
],
"status": "read-only",
"reason": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
"unlocks": "Nothing in this app: this one stays with the basemap."
},
{
"family": "basemap",
"title": "Left to the basemap",
"what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
"card": "kc-tune-order",
"tables": [
"DI_Fuel_Pressure_Target_0pct",
"DI_Fuel_Pressure_Target_55pct",
"WOT_Exhaust_VTC_Low_Cam",
"Ethanol_Boost_Target_Adj_L",
"Ethanol_Boost_Target_Adj_H"
],
"status": "read-only",
"reason": "Leave to the basemap: these are matched to the hardware, not to a street log.",
"unlocks": "Hardware changes a professional tuner would recalibrate for."
}
],
"headline": "Your logs support no map change right now."
},
"tags": {
"fuel": null,
"slot": 1
},
"pictures": [
{
"kind": "proof",
"title": "Worst fuel trim, before and after",
"unit": "%",
"bars": [
{
"label": "Before",
"value": -21.4
},
{
"label": "After",
"value": -2.3
}
],
"numbers": [
-21.4,
-2.3
]
}
],
"openSteps": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"id": "channels",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": "20260830-152931",
"settledAt": 1788078571000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"why": "Intake 51 °C while moving: not a Cool Drive.",
"id": "baseline",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": "20260830-152931",
"settledBy": "20260830-152931",
"settledAt": 1788078571000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "undo",
"title": "Undo: trims back within ±5 %",
"status": "done",
"why": "Trims −2.3 % over 15 calm minutes (they were −21.4 %).",
"id": "undo",
"askedOn": "20260823-203853",
"askedAt": 1787492333000,
"lastAskedOn": "20260823-203853",
"settledBy": "20260830-152931",
"settledAt": 1788078571000,
"word": "Done",
"tone": "good"
}
]
},
{
"say": "Nothing broken, but there is a Watch: full-throttle AFR 10.5 (map asks 11.0, lean limit 12.0), Knock Control peak 0.65: costs about 1.6° of timing, not damage.",
"afterFlash": null,
"window": "based on your 6 Drives, 22 Aug 09:03 to 30 Aug 16:01",
"windowDrives": [
"20260822-090322",
"20260822-095021",
"20260823-195901",
"20260823-203853",
"20260830-152931",
"20260830-160151"
],
"windowSince": null,
"numbers": [
{
"label": "intake air, moving",
"value": "53",
"unit": "°C"
},
{
"label": "Knock Control, start → peak",
"value": "0.49 → 0.65",
"unit": ""
},
{
"label": "worst fuel trim",
"value": "−2.4",
"unit": "%"
},
{
"label": "hard pulls",
"value": "2",
"unit": ""
}
],
"mapVersion": {
"line": "on Map version 1 · Starter 21 Dual Tune 2",
"version": 1,
"name": "Starter 21 Dual Tune 2",
"since": null,
"kind": "ktuner-basemap"
},
"verdict": "Watch",
"settled": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked."
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Intake 53 °C while moving: not a Cool Drive."
}
],
"wasted": "This Drive settles nothing: it was too warm to be a Cool Drive. A Cool Drive with 2 pulls would have settled the Baseline.",
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median -2.3 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; no Cool drive yet; the latest hot drive (30 Aug 16:01) reached Knock Control 0.65 judged, over 0.56.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot max 1.9 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": {
"driveId": "20260830-160151",
"start": 1788080511000,
"cause": "score"
},
"shakedownPending": false,
"unexplained": [
{
"driveId": "20260823-203853",
"reasons": [
"trim"
]
}
]
},
"stepFail": null
},
"cause": "Knock Control rose 0.49 → 0.65 mostly while lugging in 53 °C air: keep the revs up.",
"nextStep": {
"kind": "drive",
"key": "baseline",
"title": "Log one Cool-morning drive with 2 pulls",
"body": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "Turbo Pressure",
"ok": "within +1.5 psi of Turbo Pressure Target",
"see": "more than +2.5 psi above Turbo Pressure Target, held",
"then": "Upload. A held overshoot is the only reason to touch boost."
}
]
},
"same": false,
"proves": "a Cool Drive with 2 pulls to measure every later Drive against",
"upload": "after that morning Drive",
"uploadWhen": "Upload when: after that morning Drive.",
"flashPlan": null,
"also": {
"key": "habit",
"title": "Also seen today: keep the revs up (free, no Flash)",
"why": "Knock Control went 0.49 → 0.65: about 1.6° of timing taken under boost. Not damage. 31 of its 41 step-ups came while the CVT held 1,509 rpm with load in 53 °C air.",
"steps": [
"Below 60 km/h, put it in S (or tap a paddle) before you press past a third of the pedal.",
"No pulls out of traffic or out of a car park: steady speed for 1–2 minutes first.",
"Log your next hot-afternoon Drive, same kind of traffic."
],
"settlesOn": "after your next hot-afternoon Drive"
}
},
"readback": null,
"questions": [],
"housing": null,
"harness": {
"checked": 12,
"seconds": 0,
"line": "Checked 12 things · 0 s",
"steps": [
{
"name": "readLog",
"title": "Read the TunerView log",
"inputs": "sha1:018b12a27406",
"output": "sha1:eb4cd6f2f009",
"ms": 0
},
{
"name": "ingestUpload",
"title": "Add the Drive to your Car history",
"inputs": "sha1:018b12a27406",
"output": "sha1:9658dc3f5545",
"ms": 0
},
{
"name": "carHistory",
"title": "Compare with your earlier Drives",
"inputs": "sha1:4eac623d0c33",
"output": "sha1:b104a56d170c",
"ms": 0
},
{
"name": "overview",
"title": "Check every safety line",
"inputs": "sha1:114861b5bbcd",
"output": "sha1:9d12c2132415",
"ms": 0
},
{
"name": "driveFacts",
"title": "Read this Drive's numbers",
"inputs": "sha1:114861b5bbcd",
"output": "sha1:1c2e53edc885",
"ms": 0
},
{
"name": "logQuality",
"title": "Check the log against the drive brief",
"inputs": "sha1:114861b5bbcd",
"output": "sha1:7c7f153e177a",
"ms": 0
},
{
"name": "heat",
"title": "Read intake, coolant and CVT heat",
"inputs": "sha1:114861b5bbcd",
"output": "sha1:16d7ad8dda0a",
"ms": 0
},
{
"name": "flashPlan",
"title": "Work out the Flash plan",
"inputs": "sha1:4eac623d0c33",
"output": "sha1:fea68149937d",
"ms": 0
},
{
"name": "ceilingRead",
"title": "Read whether more boost can show",
"inputs": "sha1:4eac623d0c33",
"output": "sha1:b8aeaac5b4e4",
"ms": 0
},
{
"name": "settleOpenSteps",
"title": "Settle what I asked last time",
"inputs": "sha1:1d8069582afe",
"output": "sha1:985e4e4f00ba",
"ms": 0
},
{
"name": "nextStep",
"title": "Decide the Next step",
"inputs": "sha1:1d8069582afe",
"output": "sha1:c1bdaf064dd2",
"ms": 0
},
{
"name": "ownerQuestions",
"title": "Ask what only you know",
"inputs": "sha1:1d8069582afe",
"output": "sha1:c1949c6838f9",
"ms": 0
}
]
},
"checkpoints": [
{
"id": "rate",
"label": "Logged 10 times a second or faster",
"value": "7.5 a second",
"met": false
},
{
"id": "moving",
"label": "10 minutes or more of moving",
"value": "46 min",
"met": true
},
{
"id": "gauges",
"label": "Every gauge moving",
"value": "all moving",
"met": true
},
{
"id": "channels",
"label": "AFR Command and MAF Hz in the log",
"value": "missing: AFR Command and MAF Hz",
"met": false
},
{
"id": "warm",
"label": "Engine warm (coolant 80 °C or more)",
"value": "92 °C peak",
"met": true
},
{
"id": "cool",
"label": "Cool intake while moving (under 42 °C)",
"value": "53 °C",
"met": false
},
{
"id": "pulls",
"label": "2 full-throttle pulls",
"value": "2 hard pulls",
"met": true
},
{
"id": "pullIat",
"label": "Pulls started under 48 °C intake",
"value": "60 °C",
"met": false
}
],
"health": {
"line": "Yes, with things to watch. Nothing here is damaging the engine; the list below fixes them in order.",
"rows": [
{
"system": "Fuel",
"id": "trims",
"label": "Fuel trims (cruise)",
"value": "-0.0 %",
"word": "OK",
"tone": "good",
"band": {
"value": -0.0,
"unit": "%",
"min": -15,
"max": 15,
"marks": [
{
"at": -10,
"label": "Stop -10",
"tone": "stop"
},
{
"at": -5,
"label": "Watch -5",
"tone": "watch"
},
{
"at": 5,
"label": "Watch +5",
"tone": "watch"
},
{
"at": 10,
"label": "Stop +10",
"tone": "stop"
}
],
"source": "kc-trims"
}
},
{
"system": "Fuel",
"id": "wotAfr",
"label": "Mixture at 12 psi and up",
"value": "10.2 AFR at 12 psi and up, map asks 11.0 (richer: safe)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Fuel",
"id": "fuelPress",
"label": "DI fuel pressure at WOT",
"value": "99 % of target (worst 5 %)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Air & boost",
"id": "overshoot",
"label": "Boost overshoot",
"value": "+1.0 psi at 3,521 rpm",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Air & boost",
"id": "undershoot",
"label": "Boost reaches target",
"value": "On target after spool",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Air & boost",
"id": "mafHz",
"label": "MAF sensor headroom",
"value": "MAF Hz not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Spark",
"id": "knock",
"label": "Knock retard at WOT",
"value": "5.5° under boost, scheduled by Knock Control (not knock events)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Spark",
"id": "kControl",
"label": "Fuel-quality score (Knock Control)",
"value": "0.49 → 0.64. Under boost your score costs about 1.5° of timing",
"word": "Watch",
"tone": "watch",
"band": {
"value": 0.64,
"unit": "",
"min": 0.45,
"max": 0.85,
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
},
{
"at": 0.8,
"label": "Stop 0.80",
"tone": "stop"
}
],
"source": "kc-ranges"
}
},
{
"system": "Heat",
"id": "iat",
"label": "Intake air temp",
"value": "60 °C peak in a pull",
"word": "Watch",
"tone": "watch",
"band": {
"value": 60,
"unit": "°C",
"min": 20,
"max": 60,
"marks": [
{
"at": 42,
"label": "Cool 42",
"tone": "none"
},
{
"at": 48,
"label": "Pull start 48",
"tone": "none"
}
],
"source": "kc-drive-brief"
}
},
{
"system": "Heat",
"id": "ect",
"label": "Coolant temp",
"value": "92 °C peak",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "cvtTemp",
"label": "CVT fluid temp",
"value": "95 °C peak",
"word": "Watch",
"tone": "watch",
"band": {
"value": 95,
"unit": "°C",
"min": 30,
"max": 110,
"marks": [
{
"at": 90,
"label": "Watch 90",
"tone": "watch"
},
{
"at": 100,
"label": "Stop 100",
"tone": "stop"
}
],
"source": "kc-cvt"
}
},
{
"system": "CVT",
"id": "slip",
"label": "CVT slip (revs without speed)",
"value": "No slip seen under boost",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "lowBoost",
"label": "Boost below 3,000 rpm",
"value": "-7.9 psi vs reference map",
"word": "OK",
"tone": "good",
"band": null
}
]
},
"calibration": {
"status": "none",
"settled": false,
"mapAction": "no-change",
"meaning": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null,
"lines": [
{
"label": "Pedal",
"value": "Not set yet: type the Pedal full reading in your car profile",
"tone": "watch"
},
{
"label": "Logger",
"value": "7.5 a second · AFR Command not checked · MAF Hz not checked",
"tone": "good"
},
{
"label": "Ceiling",
"value": "Can't tell yet: no Cool drive read since the ceiling last moved.",
"tone": "none"
},
{
"label": "What it means",
"value": "No map change yet: drive the Calibration drive on a cool morning.",
"tone": "none"
}
]
},
"tour": {
"families": [
{
"family": "airflow",
"title": "Airflow (MAF Scaling)",
"what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
"card": "kc-table-maf",
"tables": [
"MAF_Scaling_Custom",
"MAF_Scaling_Factory",
"MAF_Scaling_PRL_Race",
"MAF_Scaling_27Won_Race"
],
"status": "fine",
"reason": "No change: trims within ±5 % (median -2.3 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"family": "mixture",
"title": "Full-throttle mixture (WOT Enrich)",
"what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
"card": "kc-table-wot",
"tables": [
"WOT_Enrich_L",
"WOT_Enrich_H"
],
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"family": "boost",
"title": "Boost targets and limits",
"what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
"card": "kc-table-boost",
"tables": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H",
"Boost_Target_1_ECO_L",
"Boost_Target_1_ECO_H",
"Final_Boost_Target_L",
"Final_Boost_Target_H",
"Boost_By_Gear_Limits",
"Cylinder_Fill_Limitation_L",
"Cylinder_Fill_Limitation_H"
],
"status": "locked",
"reason": "No map change yet: drive the Calibration drive on a cool morning.",
"unlocks": null
},
{
"family": "ignition",
"title": "Ignition timing",
"what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
"card": "kc-table-ignition",
"tables": [
"Ignition_Base_L",
"Ignition_Base_H",
"Ignition_Max_L",
"Ignition_Max_H",
"Ethanol_Ign_Adj_L",
"Ethanol_Ign_Adj_H"
],
"status": "read-only",
"reason": "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove timing where retard collects, never add it without a dyno.",
"unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing)."
},
{
"family": "knock",
"title": "Knock sensitivity",
"what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
"card": "kc-table-ignition",
"tables": [
"Knock_Sens_1+4_L",
"Knock_Sens_1+4_H",
"Knock_Sens_2+3_L",
"Knock_Sens_2+3_H"
],
"status": "read-only",
"reason": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
"unlocks": "Nothing in this app: this one stays with the basemap."
},
{
"family": "basemap",
"title": "Left to the basemap",
"what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
"card": "kc-tune-order",
"tables": [
"DI_Fuel_Pressure_Target_0pct",
"DI_Fuel_Pressure_Target_55pct",
"WOT_Exhaust_VTC_Low_Cam",
"Ethanol_Boost_Target_Adj_L",
"Ethanol_Boost_Target_Adj_H"
],
"status": "read-only",
"reason": "Leave to the basemap: these are matched to the hardware, not to a street log.",
"unlocks": "Hardware changes a professional tuner would recalibrate for."
}
],
"headline": "Your logs support no map change right now."
},
"tags": {
"fuel": null,
"slot": 1
},
"pictures": [
{
"kind": "trace",
"title": "Fuel-quality score 0.49 → 0.65",
"unit": "",
"series": [
{
"name": "Fuel-quality score",
"points": [
[
-60,
0.5
],
[
-58,
0.5
],
[
-57,
0.5
],
[
-55,
0.5
],
[
-54,
0.5
],
[
-53,
0.5
],
[
-51,
0.5
],
[
-50,
0.49
],
[
-48,
0.49
],
[
-47,
0.49
],
[
-45,
0.49
],
[
-44,
0.49
],
[
-43,
0.49
],
[
-41,
0.49
],
[
-40,
0.49
],
[
-38,
0.49
],
[
-37,
0.49
],
[
-35,
0.49
],
[
-34,
0.49
],
[
-32,
0.49
],
[
-31,
0.49
],
[
-29,
0.49
],
[
-28,
0.49
],
[
-26,
0.49
],
[
-25,
0.49
],
[
-23,
0.49
],
[
-22,
0.49
],
[
-20,
0.49
],
[
-19,
0.49
],
[
-17,
0.49
],
[
-16,
0.49
],
[
-15,
0.49
],
[
-13,
0.49
],
[
-12,
0.49
],
[
-10,
0.49
],
[
-8,
0.49
],
[
-7,
0.49
],
[
-5,
0.48
],
[
-4,
0.49
],
[
-2,
0.49
],
[
-1,
0.49
],
[
1,
0.49
],
[
2,
0.49
],
[
4,
0.49
],
[
5,
0.51
],
[
7,
0.51
],
[
8,
0.51
],
[
10,
0.51
],
[
11,
0.51
],
[
13,
0.51
],
[
14,
0.51
],
[
15,
0.51
],
[
17,
0.51
],
[
18,
0.51
],
[
20,
0.51
],
[
21,
0.51
],
[
23,
0.5
],
[
24,
0.5
],
[
26,
0.5
],
[
27,
0.51
],
[
29,
0.51
],
[
30,
0.51
],
[
32,
0.51
],
[
34,
0.51
],
[
35,
0.51
],
[
37,
0.53
],
[
38,
0.53
],
[
40,
0.55
],
[
41,
0.55
],
[
42,
0.55
],
[
44,
0.54
],
[
45,
0.54
],
[
47,
0.53
],
[
48,
0.54
],
[
50,
0.54
],
[
51,
0.54
],
[
53,
0.54
],
[
55,
0.53
],
[
56,
0.53
],
[
58,
0.54
],
[
59,
0.54
]
]
}
],
"moment": {
"at": 0,
"label": "Fuel-quality score 0.49 → 0.65"
},
"numbers": [
0.49,
0.65
],
"momentIndex": 0,
"moments": 5,
"yRange": [
0.45,
0.7
],
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
}
]
}
],
"openSteps": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"id": "channels",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": "20260830-160151",
"settledAt": 1788080511000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"why": "Intake 53 °C while moving: not a Cool Drive.",
"id": "baseline",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": "20260830-160151",
"settledBy": "20260830-160151",
"settledAt": 1788080511000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "undo",
"title": "Undo: trims back within ±5 %",
"status": "done",
"why": "Trims −2.3 % over 15 calm minutes (they were −21.4 %).",
"id": "undo",
"askedOn": "20260823-203853",
"askedAt": 1787492333000,
"lastAskedOn": "20260823-203853",
"settledBy": "20260830-152931",
"settledAt": 1788078571000,
"word": "Done",
"tone": "good"
},
{
"key": "habit",
"title": "Habit test: revs up in hot traffic",
"status": "open",
"why": "Asked on 30 Aug 16:01.",
"id": null,
"askedOn": "20260830-160151",
"askedAt": 1788080511000,
"lastAskedOn": null,
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
]
},
{
"say": "Engine healthy: full-throttle AFR 10.8 (map asks 11.0, lean limit 12.0), Knock Control peak 0.54: costs about 0.5° of timing, not damage.",
"afterFlash": null,
"window": "based on your 7 Drives, 22 Aug 09:03 to 01 Sep 08:13",
"windowDrives": [
"20260822-090322",
"20260822-095021",
"20260823-195901",
"20260823-203853",
"20260830-152931",
"20260830-160151",
"20260901-081358"
],
"windowSince": null,
"numbers": [
{
"label": "intake air, moving",
"value": "37",
"unit": "°C"
},
{
"label": "Knock Control, start → peak",
"value": "0.51 → 0.54",
"unit": ""
},
{
"label": "worst fuel trim",
"value": "+1.6",
"unit": "%"
},
{
"label": "hard pulls",
"value": "2",
"unit": ""
}
],
"mapVersion": {
"line": "on Map version 1 · Starter 21 Dual Tune 2",
"version": 1,
"name": "Starter 21 Dual Tune 2",
"since": null,
"kind": "ktuner-basemap"
},
"verdict": "OK",
"settled": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked."
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "done",
"word": "Done",
"tone": "good",
"why": "Intake 37 °C, 2 pulls, 50→70 km/h in 1.97 s. Every later Drive is compared to this one."
},
{
"key": "habit",
"title": "Habit test: revs up in hot traffic",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Cool Drive (37 °C moving): the habit only shows on a hot afternoon."
}
],
"wasted": null,
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median -2.3 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; the latest Cool drive (1 Sep 08:13) was read without a Pedal full reading: say what TPS reads with the pedal floored; the latest hot drive (30 Aug 16:01) reached Knock Control 0.65 judged, over 0.56.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot max 1.4 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": false,
"unexplained": [
{
"driveId": "20260823-203853",
"reasons": [
"trim"
]
},
{
"driveId": "20260901-081358",
"reasons": [
"boost"
]
}
]
},
"stepFail": null
},
"cause": null,
"nextStep": {
"kind": "drive",
"key": "habit",
"title": "Habit test: log your next hot-afternoon Drive",
"body": "The Baseline is in. Keep the habit going: the next hot afternoon scores it.",
"recipe": {
"intro": "",
"steps": [
"Below 60 km/h, put it in S (or tap a paddle) before you press past a third of the pedal.",
"No pulls out of traffic or out of a car park: steady speed for 1–2 minutes first.",
"Log your next hot-afternoon Drive, same kind of traffic."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "Engine RPM",
"ok": "2,000 rpm or more",
"see": "under 1,700 rpm",
"then": "Use S or a paddle below 60 km/h."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
}
]
},
"same": false,
"proves": "lugging under 4 % of moving time and Knock Control not rising",
"upload": "after your next hot-afternoon Drive",
"uploadWhen": "Upload when: after your next hot-afternoon Drive.",
"flashPlan": null,
"also": null
},
"readback": null,
"questions": [],
"housing": null,
"harness": {
"checked": 12,
"seconds": 0,
"line": "Checked 12 things · 0 s",
"steps": [
{
"name": "readLog",
"title": "Read the TunerView log",
"inputs": "sha1:4b7fbcb945b1",
"output": "sha1:5485534a430d",
"ms": 0
},
{
"name": "ingestUpload",
"title": "Add the Drive to your Car history",
"inputs": "sha1:4b7fbcb945b1",
"output": "sha1:fa1399ccbb28",
"ms": 0
},
{
"name": "carHistory",
"title": "Compare with your earlier Drives",
"inputs": "sha1:57e2d370ddd1",
"output": "sha1:8518d09c0394",
"ms": 0
},
{
"name": "overview",
"title": "Check every safety line",
"inputs": "sha1:2dea8b0b99ad",
"output": "sha1:03cd2fbff756",
"ms": 0
},
{
"name": "driveFacts",
"title": "Read this Drive's numbers",
"inputs": "sha1:2dea8b0b99ad",
"output": "sha1:fb2f0d751853",
"ms": 0
},
{
"name": "logQuality",
"title": "Check the log against the drive brief",
"inputs": "sha1:2dea8b0b99ad",
"output": "sha1:0001411f6bbc",
"ms": 0
},
{
"name": "heat",
"title": "Read intake, coolant and CVT heat",
"inputs": "sha1:2dea8b0b99ad",
"output": "sha1:ce01deee29e7",
"ms": 0
},
{
"name": "flashPlan",
"title": "Work out the Flash plan",
"inputs": "sha1:57e2d370ddd1",
"output": "sha1:e1d1bad60321",
"ms": 0
},
{
"name": "ceilingRead",
"title": "Read whether more boost can show",
"inputs": "sha1:57e2d370ddd1",
"output": "sha1:3c7065540c0f",
"ms": 0
},
{
"name": "settleOpenSteps",
"title": "Settle what I asked last time",
"inputs": "sha1:1e7f41369a9c",
"output": "sha1:01a72a36de4a",
"ms": 0
},
{
"name": "nextStep",
"title": "Decide the Next step",
"inputs": "sha1:1e7f41369a9c",
"output": "sha1:efe867e6f781",
"ms": 0
},
{
"name": "ownerQuestions",
"title": "Ask what only you know",
"inputs": "sha1:1e7f41369a9c",
"output": "sha1:c1949c6838f9",
"ms": 0
}
]
},
"checkpoints": [
{
"id": "rate",
"label": "Logged 10 times a second or faster",
"value": "7.5 a second",
"met": false
},
{
"id": "moving",
"label": "10 minutes or more of moving",
"value": "30 min",
"met": true
},
{
"id": "gauges",
"label": "Every gauge moving",
"value": "all moving",
"met": true
},
{
"id": "channels",
"label": "AFR Command and MAF Hz in the log",
"value": "missing: AFR Command and MAF Hz",
"met": false
},
{
"id": "warm",
"label": "Engine warm (coolant 80 °C or more)",
"value": "92 °C peak",
"met": true
},
{
"id": "cool",
"label": "Cool intake while moving (under 42 °C)",
"value": "37 °C",
"met": true
},
{
"id": "pulls",
"label": "2 full-throttle pulls",
"value": "2 hard pulls",
"met": true
},
{
"id": "pullIat",
"label": "Pulls started under 48 °C intake",
"value": "39 °C",
"met": true
}
],
"health": {
"line": "Nothing wrong seen, but 1 check couldn't be read on this log.",
"rows": [
{
"system": "Fuel",
"id": "trims",
"label": "Fuel trims (cruise)",
"value": "+1.6 %",
"word": "OK",
"tone": "good",
"band": {
"value": 1.6,
"unit": "%",
"min": -15,
"max": 15,
"marks": [
{
"at": -10,
"label": "Stop -10",
"tone": "stop"
},
{
"at": -5,
"label": "Watch -5",
"tone": "watch"
},
{
"at": 5,
"label": "Watch +5",
"tone": "watch"
},
{
"at": 10,
"label": "Stop +10",
"tone": "stop"
}
],
"source": "kc-trims"
}
},
{
"system": "Fuel",
"id": "wotAfr",
"label": "Mixture at 12 psi and up",
"value": "10.6 AFR at 12 psi and up, map asks 11.0 (richer: safe)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Fuel",
"id": "fuelPress",
"label": "DI fuel pressure at WOT",
"value": "99 % of target (worst 5 %)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Air & boost",
"id": "overshoot",
"label": "Boost overshoot",
"value": "+0.1 psi at 3,793 rpm",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Air & boost",
"id": "undershoot",
"label": "Boost reaches target",
"value": "On target after spool",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Air & boost",
"id": "mafHz",
"label": "MAF sensor headroom",
"value": "MAF Hz not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Spark",
"id": "knock",
"label": "Knock retard at WOT",
"value": "5.5° under boost, scheduled by Knock Control (not knock events)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Spark",
"id": "kControl",
"label": "Fuel-quality score (Knock Control)",
"value": "0.51 → 0.49 (peak 0.54). Starts high after a Flash, ECU reset or new tank: give it 10–15 calm minutes before judging",
"word": "OK",
"tone": "good",
"band": {
"value": 0.49,
"unit": "",
"min": 0.45,
"max": 0.85,
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
},
{
"at": 0.8,
"label": "Stop 0.80",
"tone": "stop"
}
],
"source": "kc-ranges"
}
},
{
"system": "Heat",
"id": "iat",
"label": "Intake air temp",
"value": "39 °C peak in a pull",
"word": "OK",
"tone": "good",
"band": {
"value": 39,
"unit": "°C",
"min": 20,
"max": 60,
"marks": [
{
"at": 42,
"label": "Cool 42",
"tone": "none"
},
{
"at": 48,
"label": "Pull start 48",
"tone": "none"
}
],
"source": "kc-drive-brief"
}
},
{
"system": "Heat",
"id": "ect",
"label": "Coolant temp",
"value": "92 °C peak",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "cvtTemp",
"label": "CVT fluid temp",
"value": "73 °C peak",
"word": "OK",
"tone": "good",
"band": {
"value": 73,
"unit": "°C",
"min": 30,
"max": 110,
"marks": [
{
"at": 90,
"label": "Watch 90",
"tone": "watch"
},
{
"at": 100,
"label": "Stop 100",
"tone": "stop"
}
],
"source": "kc-cvt"
}
},
{
"system": "CVT",
"id": "slip",
"label": "CVT slip (revs without speed)",
"value": "No slip seen under boost",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "lowBoost",
"label": "Boost below 3,000 rpm",
"value": "-8.5 psi vs reference map",
"word": "OK",
"tone": "good",
"band": null
}
]
},
"calibration": {
"status": "no-reading",
"settled": false,
"mapAction": "no-change",
"meaning": "No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive.",
"unlocks": null,
"lines": [
{
"label": "Pedal",
"value": "Not set yet: type the Pedal full reading in your car profile",
"tone": "watch"
},
{
"label": "Logger",
"value": "7.5 a second · AFR Command not checked · MAF Hz not checked",
"tone": "good"
},
{
"label": "Ceiling",
"value": "Can't tell: the drive was read without a Pedal full reading: say what TPS reads with the pedal floored.",
"tone": "none"
},
{
"label": "What it means",
"value": "No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive.",
"tone": "none"
}
]
},
"tour": {
"families": [
{
"family": "airflow",
"title": "Airflow (MAF Scaling)",
"what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
"card": "kc-table-maf",
"tables": [
"MAF_Scaling_Custom",
"MAF_Scaling_Factory",
"MAF_Scaling_PRL_Race",
"MAF_Scaling_27Won_Race"
],
"status": "fine",
"reason": "No change: trims within ±5 % (median -2.3 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"family": "mixture",
"title": "Full-throttle mixture (WOT Enrich)",
"what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
"card": "kc-table-wot",
"tables": [
"WOT_Enrich_L",
"WOT_Enrich_H"
],
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"family": "boost",
"title": "Boost targets and limits",
"what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
"card": "kc-table-boost",
"tables": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H",
"Boost_Target_1_ECO_L",
"Boost_Target_1_ECO_H",
"Final_Boost_Target_L",
"Final_Boost_Target_H",
"Boost_By_Gear_Limits",
"Cylinder_Fill_Limitation_L",
"Cylinder_Fill_Limitation_H"
],
"status": "locked",
"reason": "No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive.",
"unlocks": null
},
{
"family": "ignition",
"title": "Ignition timing",
"what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
"card": "kc-table-ignition",
"tables": [
"Ignition_Base_L",
"Ignition_Base_H",
"Ignition_Max_L",
"Ignition_Max_H",
"Ethanol_Ign_Adj_L",
"Ethanol_Ign_Adj_H"
],
"status": "read-only",
"reason": "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove timing where retard collects, never add it without a dyno.",
"unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing)."
},
{
"family": "knock",
"title": "Knock sensitivity",
"what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
"card": "kc-table-ignition",
"tables": [
"Knock_Sens_1+4_L",
"Knock_Sens_1+4_H",
"Knock_Sens_2+3_L",
"Knock_Sens_2+3_H"
],
"status": "read-only",
"reason": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
"unlocks": "Nothing in this app: this one stays with the basemap."
},
{
"family": "basemap",
"title": "Left to the basemap",
"what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
"card": "kc-tune-order",
"tables": [
"DI_Fuel_Pressure_Target_0pct",
"DI_Fuel_Pressure_Target_55pct",
"WOT_Exhaust_VTC_Low_Cam",
"Ethanol_Boost_Target_Adj_L",
"Ethanol_Boost_Target_Adj_H"
],
"status": "read-only",
"reason": "Leave to the basemap: these are matched to the hardware, not to a street log.",
"unlocks": "Hardware changes a professional tuner would recalibrate for."
}
],
"headline": "Your logs support no map change right now."
},
"tags": {
"fuel": null,
"slot": 1
},
"pictures": [
{
"kind": "trace",
"title": "Fuel-quality score 0.49 → 0.54",
"unit": "",
"series": [
{
"name": "Fuel-quality score",
"points": [
[
-60,
0.49
],
[
-58,
0.49
],
[
-56,
0.49
],
[
-54,
0.49
],
[
-52,
0.49
],
[
-50,
0.49
],
[
-48,
0.49
],
[
-46,
0.49
],
[
-44,
0.49
],
[
-42,
0.49
],
[
-40,
0.49
],
[
-38,
0.49
],
[
-36,
0.49
],
[
-35,
0.48
],
[
-33,
0.49
],
[
-31,
0.49
],
[
-29,
0.49
],
[
-27,
0.48
],
[
-25,
0.49
],
[
-23,
0.49
],
[
-21,
0.49
],
[
-19,
0.49
],
[
-17,
0.49
],
[
-15,
0.49
],
[
-13,
0.49
],
[
-11,
0.49
],
[
-10,
0.49
],
[
-8,
0.49
],
[
-6,
0.49
],
[
-4,
0.49
],
[
-2,
0.49
],
[
0,
0.49
],
[
2,
0.49
],
[
4,
0.49
],
[
5,
0.48
],
[
7,
0.51
],
[
9,
0.53
],
[
11,
0.54
],
[
13,
0.54
],
[
15,
0.54
],
[
17,
0.54
],
[
19,
0.54
],
[
21,
0.54
],
[
22,
0.54
],
[
24,
0.54
],
[
26,
0.54
],
[
28,
0.54
],
[
30,
0.54
],
[
32,
0.54
],
[
34,
0.54
],
[
35,
0.54
],
[
37,
0.54
],
[
39,
0.54
],
[
41,
0.54
],
[
43,
0.54
],
[
45,
0.54
],
[
47,
0.54
],
[
49,
0.54
],
[
51,
0.54
],
[
53,
0.54
],
[
54,
0.54
],
[
56,
0.54
],
[
58,
0.54
]
]
}
],
"moment": {
"at": 0,
"label": "Fuel-quality score 0.49 → 0.54"
},
"numbers": [
0.49,
0.54
],
"momentIndex": 0,
"moments": 3,
"yRange": [
0.45,
0.7
],
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
}
]
}
],
"openSteps": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"id": "channels",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": "20260901-081358",
"settledAt": 1788225238000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "done",
"why": "Intake 37 °C, 2 pulls, 50→70 km/h in 1.97 s. Every later Drive is compared to this one.",
"id": "baseline",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": "20260830-160151",
"settledBy": "20260901-081358",
"settledAt": 1788225238000,
"word": "Done",
"tone": "good"
},
{
"key": "undo",
"title": "Undo: trims back within ±5 %",
"status": "done",
"why": "Trims −2.3 % over 15 calm minutes (they were −21.4 %).",
"id": "undo",
"askedOn": "20260823-203853",
"askedAt": 1787492333000,
"lastAskedOn": "20260823-203853",
"settledBy": "20260830-152931",
"settledAt": 1788078571000,
"word": "Done",
"tone": "good"
},
{
"key": "habit",
"title": "Habit test: revs up in hot traffic",
"status": "wait",
"why": "Cool Drive (37 °C moving): the habit only shows on a hot afternoon.",
"id": "habit",
"askedOn": "20260830-160151",
"askedAt": 1788080511000,
"lastAskedOn": "20260901-081358",
"settledBy": "20260901-081358",
"settledAt": 1788225238000,
"word": "Can't tell yet",
"tone": "none"
}
]
},
{
"say": "Engine healthy: Knock Control peak 0.50: costs about 0.1° of timing, not damage.",
"afterFlash": "Knock Control started at 0.49 and settled to your Baseline (0.49): that is what a fresh flash does.",
"window": "based on your 8 Drives, 22 Aug 09:03 to 05 Sep 07:56",
"windowDrives": [
"20260822-090322",
"20260822-095021",
"20260823-195901",
"20260823-203853",
"20260830-152931",
"20260830-160151",
"20260901-081358",
"20260905-075634"
],
"windowSince": null,
"numbers": [
{
"label": "intake air, moving",
"value": "39",
"unit": "°C"
},
{
"label": "Knock Control, start → peak",
"value": "0.49 → 0.50",
"unit": ""
},
{
"label": "worst fuel trim",
"value": "−1.6",
"unit": "%"
},
{
"label": "hard pulls",
"value": "0",
"unit": ""
}
],
"mapVersion": {
"line": "on Map version 1 · Starter 21 Dual Tune 2",
"version": 1,
"name": "Starter 21 Dual Tune 2",
"since": null,
"kind": "ktuner-basemap"
},
"verdict": "OK",
"settled": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked."
},
{
"key": "habit",
"title": "Habit test: revs up in hot traffic",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Cool Drive (39 °C moving): the habit only shows on a hot afternoon."
}
],
"wasted": "This Drive settles nothing: the logger lost DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target. A hot-afternoon drive would have settled the habit test, with every gauge moving.",
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median -1.6 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; the latest Cool drive (5 Sep 07:56) was read without a Pedal full reading: say what TPS reads with the pedal floored; the latest hot drive (30 Aug 16:01) reached Knock Control 0.65 judged, over 0.56.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot max 1.4 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": false,
"unexplained": [
{
"driveId": "20260823-203853",
"reasons": [
"trim"
]
},
{
"driveId": "20260901-081358",
"reasons": [
"boost"
]
}
]
},
"stepFail": null
},
"cause": null,
"nextStep": {
"kind": "watch",
"key": "logger",
"title": "Your logger recorded 4 dead gauges",
"body": "DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target sat on one number the whole Drive while the revs moved. The car is fine; the log isn't. Without boost in the log I cannot check the next pull, and the habit test cannot be scored.",
"recipe": {
"intro": "DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target sat on one number the whole Drive while the revs moved. The car is fine; the log isn't. Without boost in the log I cannot check the next pull, and the habit test cannot be scored.",
"steps": [
"Open TunerView before you drive, and check the gauges below move when you blip the throttle.",
"If one is stuck: remove it from the gauge list, add it back, restart logging."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target",
"ok": "move as you drive",
"see": "stuck on one number",
"then": "Remove it from the gauge list, add it back, then start the log again."
}
]
},
"same": false,
"proves": "that every gauge moves again",
"upload": "your next drive, any kind",
"uploadWhen": "Upload when: your next drive, any kind.",
"flashPlan": null,
"also": null
},
"readback": null,
"questions": [],
"housing": null,
"harness": {
"checked": 12,
"seconds": 0,
"line": "Checked 12 things · 0 s",
"steps": [
{
"name": "readLog",
"title": "Read the TunerView log",
"inputs": "sha1:e02a8b05e8b1",
"output": "sha1:1fe78a90ad1f",
"ms": 0
},
{
"name": "ingestUpload",
"title": "Add the Drive to your Car history",
"inputs": "sha1:e02a8b05e8b1",
"output": "sha1:79d5abf97f60",
"ms": 0
},
{
"name": "carHistory",
"title": "Compare with your earlier Drives",
"inputs": "sha1:c9ead7c0c6d6",
"output": "sha1:8a9fc3bdbeb6",
"ms": 0
},
{
"name": "overview",
"title": "Check every safety line",
"inputs": "sha1:c2c286f80828",
"output": "sha1:c00b80fa1d57",
"ms": 0
},
{
"name": "driveFacts",
"title": "Read this Drive's numbers",
"inputs": "sha1:c2c286f80828",
"output": "sha1:997bf53926d4",
"ms": 0
},
{
"name": "logQuality",
"title": "Check the log against the drive brief",
"inputs": "sha1:c2c286f80828",
"output": "sha1:307a22f0e024",
"ms": 0
},
{
"name": "heat",
"title": "Read intake, coolant and CVT heat",
"inputs": "sha1:c2c286f80828",
"output": "sha1:b88f6e97c0a5",
"ms": 0
},
{
"name": "flashPlan",
"title": "Work out the Flash plan",
"inputs": "sha1:c9ead7c0c6d6",
"output": "sha1:be48878af1fa",
"ms": 0
},
{
"name": "ceilingRead",
"title": "Read whether more boost can show",
"inputs": "sha1:c9ead7c0c6d6",
"output": "sha1:4ec5856b43ea",
"ms": 0
},
{
"name": "settleOpenSteps",
"title": "Settle what I asked last time",
"inputs": "sha1:947165c9e158",
"output": "sha1:f6391cb44971",
"ms": 0
},
{
"name": "nextStep",
"title": "Decide the Next step",
"inputs": "sha1:947165c9e158",
"output": "sha1:aa2957ce64fe",
"ms": 0
},
{
"name": "ownerQuestions",
"title": "Ask what only you know",
"inputs": "sha1:947165c9e158",
"output": "sha1:c1949c6838f9",
"ms": 0
}
]
},
"checkpoints": [
{
"id": "rate",
"label": "Logged 10 times a second or faster",
"value": "7.5 a second",
"met": false
},
{
"id": "moving",
"label": "10 minutes or more of moving",
"value": "35 min",
"met": true
},
{
"id": "gauges",
"label": "Every gauge moving",
"value": "stuck: DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target",
"met": false
},
{
"id": "channels",
"label": "AFR Command and MAF Hz in the log",
"value": "missing: AFR Command and MAF Hz",
"met": false
},
{
"id": "warm",
"label": "Engine warm (coolant 80 °C or more)",
"value": "91 °C peak",
"met": true
},
{
"id": "cool",
"label": "Cool intake while moving (under 42 °C)",
"value": "39 °C",
"met": true
},
{
"id": "pulls",
"label": "2 full-throttle pulls",
"value": "0 hard pulls",
"met": false
},
{
"id": "pullIat",
"label": "Pulls started under 48 °C intake",
"value": "no pull to time",
"met": null
}
],
"health": {
"line": "Nothing wrong seen, but 7 checks couldn't be read on this log.",
"rows": [
{
"system": "Fuel",
"id": "trims",
"label": "Fuel trims (cruise)",
"value": "+0.6 %",
"word": "OK",
"tone": "good",
"band": {
"value": 0.6,
"unit": "%",
"min": -15,
"max": 15,
"marks": [
{
"at": -10,
"label": "Stop -10",
"tone": "stop"
},
{
"at": -5,
"label": "Watch -5",
"tone": "watch"
},
{
"at": 5,
"label": "Watch +5",
"tone": "watch"
},
{
"at": 10,
"label": "Stop +10",
"tone": "stop"
}
],
"source": "kc-trims"
}
},
{
"system": "Fuel",
"id": "wotAfr",
"label": "Mixture at 12 psi and up",
"value": "No time at 12 psi or more",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Fuel",
"id": "fuelPress",
"label": "DI fuel pressure at WOT",
"value": "Not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "overshoot",
"label": "Boost overshoot",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "undershoot",
"label": "Boost reaches target",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "mafHz",
"label": "MAF sensor headroom",
"value": "MAF Hz not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Spark",
"id": "knock",
"label": "Knock retard at WOT",
"value": "5.5° under boost, scheduled by Knock Control (not knock events)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Spark",
"id": "kControl",
"label": "Fuel-quality score (Knock Control)",
"value": "0.49 → 0.49",
"word": "OK",
"tone": "good",
"band": {
"value": 0.49,
"unit": "",
"min": 0.45,
"max": 0.85,
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
},
{
"at": 0.8,
"label": "Stop 0.80",
"tone": "stop"
}
],
"source": "kc-ranges"
}
},
{
"system": "Heat",
"id": "iat",
"label": "Intake air temp",
"value": "49 °C peak under boost",
"word": "OK",
"tone": "good",
"band": {
"value": 49,
"unit": "°C",
"min": 20,
"max": 60,
"marks": [
{
"at": 42,
"label": "Cool 42",
"tone": "none"
},
{
"at": 48,
"label": "Pull start 48",
"tone": "none"
}
],
"source": "kc-drive-brief"
}
},
{
"system": "Heat",
"id": "ect",
"label": "Coolant temp",
"value": "91 °C peak",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "cvtTemp",
"label": "CVT fluid temp",
"value": "Can't tell: CVT fluid temp was flat for the whole drive.",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "CVT",
"id": "slip",
"label": "CVT slip (revs without speed)",
"value": "No slip seen under boost",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "lowBoost",
"label": "Boost below 3,000 rpm",
"value": "Needs a pull and boost",
"word": "Can't tell",
"tone": "none",
"band": null
}
]
},
"calibration": {
"status": "no-reading",
"settled": false,
"mapAction": "no-change",
"meaning": "No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive.",
"unlocks": null,
"lines": [
{
"label": "Pedal",
"value": "Not set yet: type the Pedal full reading in your car profile",
"tone": "watch"
},
{
"label": "Logger",
"value": "7.5 a second · AFR Command not checked · MAF Hz not checked",
"tone": "good"
},
{
"label": "Ceiling",
"value": "Can't tell: the drive was read without a Pedal full reading: say what TPS reads with the pedal floored.",
"tone": "none"
},
{
"label": "What it means",
"value": "No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive.",
"tone": "none"
}
]
},
"tour": {
"families": [
{
"family": "airflow",
"title": "Airflow (MAF Scaling)",
"what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
"card": "kc-table-maf",
"tables": [
"MAF_Scaling_Custom",
"MAF_Scaling_Factory",
"MAF_Scaling_PRL_Race",
"MAF_Scaling_27Won_Race"
],
"status": "fine",
"reason": "No change: trims within ±5 % (median -1.6 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"family": "mixture",
"title": "Full-throttle mixture (WOT Enrich)",
"what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
"card": "kc-table-wot",
"tables": [
"WOT_Enrich_L",
"WOT_Enrich_H"
],
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"family": "boost",
"title": "Boost targets and limits",
"what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
"card": "kc-table-boost",
"tables": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H",
"Boost_Target_1_ECO_L",
"Boost_Target_1_ECO_H",
"Final_Boost_Target_L",
"Final_Boost_Target_H",
"Boost_By_Gear_Limits",
"Cylinder_Fill_Limitation_L",
"Cylinder_Fill_Limitation_H"
],
"status": "locked",
"reason": "No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive.",
"unlocks": null
},
{
"family": "ignition",
"title": "Ignition timing",
"what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
"card": "kc-table-ignition",
"tables": [
"Ignition_Base_L",
"Ignition_Base_H",
"Ignition_Max_L",
"Ignition_Max_H",
"Ethanol_Ign_Adj_L",
"Ethanol_Ign_Adj_H"
],
"status": "read-only",
"reason": "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove timing where retard collects, never add it without a dyno.",
"unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing)."
},
{
"family": "knock",
"title": "Knock sensitivity",
"what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
"card": "kc-table-ignition",
"tables": [
"Knock_Sens_1+4_L",
"Knock_Sens_1+4_H",
"Knock_Sens_2+3_L",
"Knock_Sens_2+3_H"
],
"status": "read-only",
"reason": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
"unlocks": "Nothing in this app: this one stays with the basemap."
},
{
"family": "basemap",
"title": "Left to the basemap",
"what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
"card": "kc-tune-order",
"tables": [
"DI_Fuel_Pressure_Target_0pct",
"DI_Fuel_Pressure_Target_55pct",
"WOT_Exhaust_VTC_Low_Cam",
"Ethanol_Boost_Target_Adj_L",
"Ethanol_Boost_Target_Adj_H"
],
"status": "read-only",
"reason": "Leave to the basemap: these are matched to the hardware, not to a street log.",
"unlocks": "Hardware changes a professional tuner would recalibrate for."
}
],
"headline": "Your logs support no map change right now."
},
"tags": {
"fuel": null,
"slot": 1
},
"pictures": [],
"openSteps": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"id": "channels",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": "20260905-075634",
"settledAt": 1788569794000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "done",
"why": "Intake 37 °C, 2 pulls, 50→70 km/h in 1.97 s. Every later Drive is compared to this one.",
"id": "baseline",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": "20260830-160151",
"settledBy": "20260901-081358",
"settledAt": 1788225238000,
"word": "Done",
"tone": "good"
},
{
"key": "undo",
"title": "Undo: trims back within ±5 %",
"status": "done",
"why": "Trims −2.3 % over 15 calm minutes (they were −21.4 %).",
"id": "undo",
"askedOn": "20260823-203853",
"askedAt": 1787492333000,
"lastAskedOn": "20260823-203853",
"settledBy": "20260830-152931",
"settledAt": 1788078571000,
"word": "Done",
"tone": "good"
},
{
"key": "habit",
"title": "Habit test: revs up in hot traffic",
"status": "wait",
"why": "Cool Drive (39 °C moving): the habit only shows on a hot afternoon.",
"id": "habit",
"askedOn": "20260830-160151",
"askedAt": 1788080511000,
"lastAskedOn": "20260901-081358",
"settledBy": "20260905-075634",
"settledAt": 1788569794000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "logger",
"title": "Fix the logger: dead gauges",
"status": "open",
"why": "Asked on 5 Sep 07:56.",
"id": null,
"askedOn": "20260905-075634",
"askedAt": 1788569794000,
"lastAskedOn": "20260905-075634",
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
]
},
{
"say": "Engine healthy: Knock Control peak 0.50: costs about 0.1° of timing, not damage.",
"afterFlash": "Knock Control started at 0.49 and settled to your Baseline (0.49): that is what a fresh flash does.",
"window": "based on your 2 Drives since the Flash on 1 Sep",
"windowDrives": [
"20260901-081358",
"20260905-075634"
],
"windowSince": {
"kind": "flash",
"label": "the Flash",
"day": "1 Sep"
},
"numbers": [
{
"label": "intake air, moving",
"value": "39",
"unit": "°C"
},
{
"label": "Knock Control, start → peak",
"value": "0.49 → 0.50",
"unit": ""
},
{
"label": "worst fuel trim",
"value": "−1.6",
"unit": "%"
},
{
"label": "hard pulls",
"value": "0",
"unit": ""
}
],
"mapVersion": {
"line": "on Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1",
"version": 2,
"name": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"since": 1756723200000,
"kind": "flash"
},
"verdict": "OK",
"settled": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked."
}
],
"wasted": "This Drive settles nothing: the logger lost DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target. A log with AFR Command and MAF Hz in the list would have settled the AFR Command / MAF Hz step, with every gauge moving.",
"flashPlan": {
"kind": "one-family",
"changeId": "downpipe",
"family": "boost",
"headline": "Boost targets: −1 psi at 3,500–4,000 rpm, because overshoot held 3.4 psi there.",
"route": null,
"basis": "Data",
"proof": "A Cool drive with 2 hard pulls: overshoot at or under +2.5 psi, full-load mixture at or richer than target and never leaner than 12.0, trims within ±5 %.",
"saveAs": "Starter 21 Dual Tune 2 · 20250901 · boost r1 · 20250901 · boost r2",
"undoName": "Flash your previous map file (Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1, flashed 20250901-174000)",
"undo": {
"known": true,
"version": 2,
"name": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"from": 1756723200000,
"stamp": "20250901-174000",
"label": "Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1, flashed 20250901-174000",
"headline": "Flash your previous map file (Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1, flashed 20250901-174000)"
},
"mapVersion": {
"n": 2,
"name": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"label": "Map version 2",
"kind": "flash",
"tablesFrom": "app-store",
"tablesPending": false,
"from": 1756723200000,
"flashId": "fmf0zmwao-starter-21-dual-",
"changed": "boost",
"note": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"updatedAt": 1756723200000
},
"ceilingPsi": 23.4,
"tables": [
{
"id": "Boost_Target_1_Normal_L",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_1_Normal_H",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_2_Normal_L",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_2_Normal_H",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_3_Normal_L",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_3_Normal_H",
"kind": "map",
"cellCount": 28,
"pasteRow": null
}
],
"cellCount": 168,
"cells": [
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
}
],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": "boost",
"evidence": [
{
"drives": [
"20260901-081358"
],
"text": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"basis": "Data"
}
],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median 0.0 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; the B2 overshoot trim comes first; the latest Cool drive (5 Sep 07:56) was read without a Pedal full reading: say what TPS reads with the pedal floored; no hot drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi at 3,500–4,000 rpm",
"status": "planned",
"reason": "In the plan below.",
"unlocks": "Two hard pulls on a Cool drive prove it."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": false,
"unexplained": []
},
"stepFail": null,
"ktunerCard": {
"kind": "change",
"changeId": "3c881aef53",
"family": "boost",
"headline": "Boost targets: −1 psi at 3,500–4,000 rpm, because overshoot held 3.4 psi there.",
"because": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"writtenOn": "Written on Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1",
"groups": [
{
"tables": [
"Boost Target 1 Normal L",
"Boost Target 1 Normal H",
"Boost Target 2 Normal L",
"Boost Target 2 Normal H",
"Boost Target 3 Normal L",
"Boost Target 3 Normal H"
],
"tableIds": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H"
],
"unit": "psi",
"what": "The boost the ECU aims for in Normal and Sport, psi gauge, by rpm (rows) and load (columns).",
"effect": "Lowers the boost the ECU aims for by 1.0 psi in 28 cells, 3,500-4,000 rpm.",
"same": true,
"pasteRow": null,
"cells": [
{
"id": "0-12-2",
"rpm": 3500,
"row": "3,500 rpm",
"col": 3,
"of": 16,
"column": "3 of 16",
"before": "12.5",
"after": "11.5",
"unit": "psi"
},
{
"id": "0-12-3",
"rpm": 3500,
"row": "3,500 rpm",
"col": 4,
"of": 16,
"column": "4 of 16",
"before": "14.5",
"after": "13.5",
"unit": "psi"
},
{
"id": "0-12-4",
"rpm": 3500,
"row": "3,500 rpm",
"col": 5,
"of": 16,
"column": "5 of 16",
"before": "16.5",
"after": "15.5",
"unit": "psi"
},
{
"id": "0-12-5",
"rpm": 3500,
"row": "3,500 rpm",
"col": 6,
"of": 16,
"column": "6 of 16",
"before": "18.0",
"after": "17.0",
"unit": "psi"
},
{
"id": "0-12-6",
"rpm": 3500,
"row": "3,500 rpm",
"col": 7,
"of": 16,
"column": "7 of 16",
"before": "19.0",
"after": "18.0",
"unit": "psi"
},
{
"id": "0-12-7",
"rpm": 3500,
"row": "3,500 rpm",
"col": 8,
"of": 16,
"column": "8 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-8",
"rpm": 3500,
"row": "3,500 rpm",
"col": 9,
"of": 16,
"column": "9 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-9",
"rpm": 3500,
"row": "3,500 rpm",
"col": 10,
"of": 16,
"column": "10 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-10",
"rpm": 3500,
"row": "3,500 rpm",
"col": 11,
"of": 16,
"column": "11 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-11",
"rpm": 3500,
"row": "3,500 rpm",
"col": 12,
"of": 16,
"column": "12 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-12",
"rpm": 3500,
"row": "3,500 rpm",
"col": 13,
"of": 16,
"column": "13 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-13",
"rpm": 3500,
"row": "3,500 rpm",
"col": 14,
"of": 16,
"column": "14 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-14",
"rpm": 3500,
"row": "3,500 rpm",
"col": 15,
"of": 16,
"column": "15 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-15",
"rpm": 3500,
"row": "3,500 rpm",
"col": 16,
"of": 16,
"column": "16 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-2",
"rpm": 4000,
"row": "4,000 rpm",
"col": 3,
"of": 16,
"column": "3 of 16",
"before": "12.5",
"after": "11.5",
"unit": "psi"
},
{
"id": "0-13-3",
"rpm": 4000,
"row": "4,000 rpm",
"col": 4,
"of": 16,
"column": "4 of 16",
"before": "14.5",
"after": "13.5",
"unit": "psi"
},
{
"id": "0-13-4",
"rpm": 4000,
"row": "4,000 rpm",
"col": 5,
"of": 16,
"column": "5 of 16",
"before": "16.5",
"after": "15.5",
"unit": "psi"
},
{
"id": "0-13-5",
"rpm": 4000,
"row": "4,000 rpm",
"col": 6,
"of": 16,
"column": "6 of 16",
"before": "18.0",
"after": "17.0",
"unit": "psi"
},
{
"id": "0-13-6",
"rpm": 4000,
"row": "4,000 rpm",
"col": 7,
"of": 16,
"column": "7 of 16",
"before": "19.0",
"after": "18.0",
"unit": "psi"
},
{
"id": "0-13-7",
"rpm": 4000,
"row": "4,000 rpm",
"col": 8,
"of": 16,
"column": "8 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-8",
"rpm": 4000,
"row": "4,000 rpm",
"col": 9,
"of": 16,
"column": "9 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-9",
"rpm": 4000,
"row": "4,000 rpm",
"col": 10,
"of": 16,
"column": "10 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-10",
"rpm": 4000,
"row": "4,000 rpm",
"col": 11,
"of": 16,
"column": "11 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-11",
"rpm": 4000,
"row": "4,000 rpm",
"col": 12,
"of": 16,
"column": "12 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-12",
"rpm": 4000,
"row": "4,000 rpm",
"col": 13,
"of": 16,
"column": "13 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-13",
"rpm": 4000,
"row": "4,000 rpm",
"col": 14,
"of": 16,
"column": "14 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-14",
"rpm": 4000,
"row": "4,000 rpm",
"col": 15,
"of": 16,
"column": "15 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-15",
"rpm": 4000,
"row": "4,000 rpm",
"col": 16,
"of": 16,
"column": "16 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
}
]
}
],
"cellCount": 28,
"tableCount": 6,
"saveAs": "Starter 21 Dual Tune 2 · 20250901 · boost r1 · 20250901 · boost r2",
"undo": {
"known": true,
"version": 2,
"line": "Flash your previous map file (Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1, flashed 20250901-174000)"
},
"proof": "A Cool drive with 2 hard pulls: overshoot at or under +2.5 psi, full-load mixture at or richer than target and never leaner than 12.0, trims within ±5 %.",
"afterFlash": "Then drive a Shakedown drive: 10 calm minutes, no hard driving.",
"readback": {
"possible": true,
"line": "Readback is possible: your first Drive after the Flash checks the logged Turbo Pressure Target in these cells."
},
"checked": "Checked twice, and both checks agree: the engine's rules and a separate check against Map version 2."
}
},
"cause": null,
"nextStep": {
"kind": "change",
"key": "recheck",
"title": "Re-check what you typed in KTuner",
"body": "Re-check what you typed in KTuner: 4,000 rpm column 3 reads 12.2, planned 12.5.",
"recipe": null,
"gauges": null,
"same": false,
"proves": "",
"upload": "",
"uploadWhen": "",
"flashPlan": null,
"also": null
},
"readback": {
"state": "mismatch",
"credited": false,
"mismatches": [
"4,000 rpm column 3 reads 12.2, planned 12.5"
],
"line": "Readback: what the ECU runs is not Map version 2. 4,000 rpm column 3 reads 12.2, planned 12.5.",
"next": "Re-check what you typed in KTuner: 4,000 rpm column 3 reads 12.2, planned 12.5.",
"version": 2,
"cells": [
{
"rpm": 3500,
"cols": [
3
],
"before": 13.5,
"after": 12.5,
"status": "unseen",
"reads": null
},
{
"rpm": 3500,
"cols": [
4
],
"before": 15.5,
"after": 14.5,
"status": "unseen",
"reads": null
},
{
"rpm": 3500,
"cols": [
5
],
"before": 17.5,
"after": 16.5,
"status": "unseen",
"reads": null
},
{
"rpm": 3500,
"cols": [
6
],
"before": 19.0,
"after": 18,
"status": "unseen",
"reads": null
},
{
"rpm": 3500,
"cols": [
7
],
"before": 20.0,
"after": 19,
"status": "unseen",
"reads": null
},
{
"rpm": 3500,
"cols": [
8,
9,
10,
11,
12,
13,
14,
15,
16
],
"before": 21.0,
"after": 20,
"status": "unseen",
"reads": null
},
{
"rpm": 4000,
"cols": [
3
],
"before": 13.5,
"after": 12.5,
"status": "mismatch",
"reads": 12.2
},
{
"rpm": 4000,
"cols": [
4
],
"before": 15.5,
"after": 14.5,
"status": "unseen",
"reads": null
},
{
"rpm": 4000,
"cols": [
5
],
"before": 17.5,
"after": 16.5,
"status": "unseen",
"reads": null
},
{
"rpm": 4000,
"cols": [
6
],
"before": 19.0,
"after": 18,
"status": "unseen",
"reads": null
},
{
"rpm": 4000,
"cols": [
7
],
"before": 20.0,
"after": 19,
"status": "unseen",
"reads": null
},
{
"rpm": 4000,
"cols": [
8,
9,
10,
11,
12,
13,
14,
15,
16
],
"before": 21.0,
"after": 20,
"status": "unseen",
"reads": null
}
]
},
"questions": [],
"housing": null,
"harness": {
"checked": 12,
"seconds": 0,
"line": "Checked 12 things · 0 s",
"steps": [
{
"name": "readLog",
"title": "Read the TunerView log",
"inputs": "sha1:e02a8b05e8b1",
"output": "sha1:1fe78a90ad1f",
"ms": 0
},
{
"name": "ingestUpload",
"title": "Add the Drive to your Car history",
"inputs": "sha1:e02a8b05e8b1",
"output": "sha1:7608185b7265",
"ms": 0
},
{
"name": "carHistory",
"title": "Compare with your earlier Drives",
"inputs": "sha1:c9ead7c0c6d6",
"output": "sha1:6da717d3e211",
"ms": 0
},
{
"name": "overview",
"title": "Check every safety line",
"inputs": "sha1:c2c286f80828",
"output": "sha1:c00b80fa1d57",
"ms": 0
},
{
"name": "driveFacts",
"title": "Read this Drive's numbers",
"inputs": "sha1:c2c286f80828",
"output": "sha1:997bf53926d4",
"ms": 0
},
{
"name": "logQuality",
"title": "Check the log against the drive brief",
"inputs": "sha1:c2c286f80828",
"output": "sha1:307a22f0e024",
"ms": 0
},
{
"name": "heat",
"title": "Read intake, coolant and CVT heat",
"inputs": "sha1:c2c286f80828",
"output": "sha1:b88f6e97c0a5",
"ms": 0
},
{
"name": "flashPlan",
"title": "Work out the Flash plan",
"inputs": "sha1:c9ead7c0c6d6",
"output": "sha1:38685224edd1",
"ms": 0
},
{
"name": "ceilingRead",
"title": "Read whether more boost can show",
"inputs": "sha1:c9ead7c0c6d6",
"output": "sha1:4ec5856b43ea",
"ms": 0
},
{
"name": "settleOpenSteps",
"title": "Settle what I asked last time",
"inputs": "sha1:0c84e0fb9655",
"output": "sha1:7f8fb16f5988",
"ms": 0
},
{
"name": "nextStep",
"title": "Decide the Next step",
"inputs": "sha1:0c84e0fb9655",
"output": "sha1:b89d67cceb51",
"ms": 0
},
{
"name": "ownerQuestions",
"title": "Ask what only you know",
"inputs": "sha1:0c84e0fb9655",
"output": "sha1:782bdbd9aa7d",
"ms": 0
}
]
},
"checkpoints": [
{
"id": "rate",
"label": "Logged 10 times a second or faster",
"value": "7.5 a second",
"met": false
},
{
"id": "moving",
"label": "10 minutes or more of moving",
"value": "35 min",
"met": true
},
{
"id": "gauges",
"label": "Every gauge moving",
"value": "stuck: DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target",
"met": false
},
{
"id": "channels",
"label": "AFR Command and MAF Hz in the log",
"value": "missing: AFR Command and MAF Hz",
"met": false
},
{
"id": "warm",
"label": "Engine warm (coolant 80 °C or more)",
"value": "91 °C peak",
"met": true
},
{
"id": "cool",
"label": "Cool intake while moving (under 42 °C)",
"value": "39 °C",
"met": true
},
{
"id": "pulls",
"label": "2 full-throttle pulls",
"value": "0 hard pulls",
"met": false
},
{
"id": "pullIat",
"label": "Pulls started under 48 °C intake",
"value": "no pull to time",
"met": null
}
],
"health": {
"line": "Nothing wrong seen, but 7 checks couldn't be read on this log.",
"rows": [
{
"system": "Fuel",
"id": "trims",
"label": "Fuel trims (cruise)",
"value": "+0.6 %",
"word": "OK",
"tone": "good",
"band": {
"value": 0.6,
"unit": "%",
"min": -15,
"max": 15,
"marks": [
{
"at": -10,
"label": "Stop -10",
"tone": "stop"
},
{
"at": -5,
"label": "Watch -5",
"tone": "watch"
},
{
"at": 5,
"label": "Watch +5",
"tone": "watch"
},
{
"at": 10,
"label": "Stop +10",
"tone": "stop"
}
],
"source": "kc-trims"
}
},
{
"system": "Fuel",
"id": "wotAfr",
"label": "Mixture at 12 psi and up",
"value": "No time at 12 psi or more",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Fuel",
"id": "fuelPress",
"label": "DI fuel pressure at WOT",
"value": "Not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "overshoot",
"label": "Boost overshoot",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "undershoot",
"label": "Boost reaches target",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "mafHz",
"label": "MAF sensor headroom",
"value": "MAF Hz not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Spark",
"id": "knock",
"label": "Knock retard at WOT",
"value": "5.5° under boost, scheduled by Knock Control (not knock events)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Spark",
"id": "kControl",
"label": "Fuel-quality score (Knock Control)",
"value": "0.49 → 0.49",
"word": "OK",
"tone": "good",
"band": {
"value": 0.49,
"unit": "",
"min": 0.45,
"max": 0.85,
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
},
{
"at": 0.8,
"label": "Stop 0.80",
"tone": "stop"
}
],
"source": "kc-ranges"
}
},
{
"system": "Heat",
"id": "iat",
"label": "Intake air temp",
"value": "49 °C peak under boost",
"word": "OK",
"tone": "good",
"band": {
"value": 49,
"unit": "°C",
"min": 20,
"max": 60,
"marks": [
{
"at": 42,
"label": "Cool 42",
"tone": "none"
},
{
"at": 48,
"label": "Pull start 48",
"tone": "none"
}
],
"source": "kc-drive-brief"
}
},
{
"system": "Heat",
"id": "ect",
"label": "Coolant temp",
"value": "91 °C peak",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "cvtTemp",
"label": "CVT fluid temp",
"value": "Can't tell: CVT fluid temp was flat for the whole drive.",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "CVT",
"id": "slip",
"label": "CVT slip (revs without speed)",
"value": "No slip seen under boost",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "lowBoost",
"label": "Boost below 3,000 rpm",
"value": "Needs a pull and boost",
"word": "Can't tell",
"tone": "none",
"band": null
}
]
},
"calibration": {
"status": "no-reading",
"settled": false,
"mapAction": "no-change",
"meaning": "No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive.",
"unlocks": null,
"lines": [
{
"label": "Pedal",
"value": "Not set yet: type the Pedal full reading in your car profile",
"tone": "watch"
},
{
"label": "Logger",
"value": "7.5 a second · AFR Command not checked · MAF Hz not checked",
"tone": "good"
},
{
"label": "Ceiling",
"value": "Can't tell: the drive was read without a Pedal full reading: say what TPS reads with the pedal floored.",
"tone": "none"
},
{
"label": "What it means",
"value": "No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive.",
"tone": "none"
}
]
},
"tour": {
"families": [
{
"family": "airflow",
"title": "Airflow (MAF Scaling)",
"what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
"card": "kc-table-maf",
"tables": [
"MAF_Scaling_Custom",
"MAF_Scaling_Factory",
"MAF_Scaling_PRL_Race",
"MAF_Scaling_27Won_Race"
],
"status": "fine",
"reason": "No change: trims within ±5 % (median 0.0 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"family": "mixture",
"title": "Full-throttle mixture (WOT Enrich)",
"what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
"card": "kc-table-wot",
"tables": [
"WOT_Enrich_L",
"WOT_Enrich_H"
],
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"family": "boost",
"title": "Boost targets and limits",
"what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
"card": "kc-table-boost",
"tables": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H",
"Boost_Target_1_ECO_L",
"Boost_Target_1_ECO_H",
"Final_Boost_Target_L",
"Final_Boost_Target_H",
"Boost_By_Gear_Limits",
"Cylinder_Fill_Limitation_L",
"Cylinder_Fill_Limitation_H"
],
"status": "this-round",
"reason": "In the plan below.",
"unlocks": null
},
{
"family": "ignition",
"title": "Ignition timing",
"what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
"card": "kc-table-ignition",
"tables": [
"Ignition_Base_L",
"Ignition_Base_H",
"Ignition_Max_L",
"Ignition_Max_H",
"Ethanol_Ign_Adj_L",
"Ethanol_Ign_Adj_H"
],
"status": "read-only",
"reason": "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove timing where retard collects, never add it without a dyno.",
"unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing)."
},
{
"family": "knock",
"title": "Knock sensitivity",
"what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
"card": "kc-table-ignition",
"tables": [
"Knock_Sens_1+4_L",
"Knock_Sens_1+4_H",
"Knock_Sens_2+3_L",
"Knock_Sens_2+3_H"
],
"status": "read-only",
"reason": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
"unlocks": "Nothing in this app: this one stays with the basemap."
},
{
"family": "basemap",
"title": "Left to the basemap",
"what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
"card": "kc-tune-order",
"tables": [
"DI_Fuel_Pressure_Target_0pct",
"DI_Fuel_Pressure_Target_55pct",
"WOT_Exhaust_VTC_Low_Cam",
"Ethanol_Boost_Target_Adj_L",
"Ethanol_Boost_Target_Adj_H"
],
"status": "read-only",
"reason": "Leave to the basemap: these are matched to the hardware, not to a street log.",
"unlocks": "Hardware changes a professional tuner would recalibrate for."
}
],
"headline": "Boost targets: −1 psi at 3,500–4,000 rpm, because overshoot held 3.4 psi there."
},
"tags": {
"fuel": null,
"slot": 1
},
"pictures": [],
"openSteps": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"id": "channels",
"askedOn": "20260901-081358",
"askedAt": 1788225238000,
"lastAskedOn": null,
"settledBy": "20260905-075634",
"settledAt": 1788569794000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "done",
"why": "Intake 37 °C, 2 pulls, 50→70 km/h in 1.97 s. Every later Drive is compared to this one.",
"id": "baseline",
"askedOn": "20260901-081358",
"askedAt": 1788225238000,
"lastAskedOn": null,
"settledBy": "20260901-081358",
"settledAt": 1788225238000,
"word": "Done",
"tone": "good"
},
{
"key": "logger",
"title": "Fix the logger: dead gauges",
"status": "open",
"why": "Asked on 5 Sep 07:56.",
"id": null,
"askedOn": "20260905-075634",
"askedAt": 1788569794000,
"lastAskedOn": "20260905-075634",
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
]
},
{
"say": "Engine healthy: Knock Control peak 0.50: costs about 0.1° of timing, not damage.",
"afterFlash": "Knock Control started at 0.49 and settled to your Baseline (0.49): that is what a fresh flash does.",
"window": "based on your 2 Drives since the Flash on 1 Sep",
"windowDrives": [
"20260901-081358",
"20260905-075634"
],
"windowSince": {
"kind": "flash",
"label": "the Flash",
"day": "1 Sep"
},
"numbers": [
{
"label": "intake air, moving",
"value": "39",
"unit": "°C"
},
{
"label": "Knock Control, start → peak",
"value": "0.49 → 0.50",
"unit": ""
},
{
"label": "worst fuel trim",
"value": "−1.6",
"unit": "%"
},
{
"label": "hard pulls",
"value": "0",
"unit": ""
}
],
"mapVersion": {
"line": "on Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1",
"version": 2,
"name": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"since": 1756723200000,
"kind": "flash"
},
"verdict": "OK",
"settled": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"word": "Can't tell yet",
"tone": "none",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked."
}
],
"wasted": "This Drive settles nothing: the logger lost DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target. A log with AFR Command and MAF Hz in the list would have settled the AFR Command / MAF Hz step, with every gauge moving.",
"flashPlan": {
"kind": "one-family",
"changeId": "downpipe",
"family": "boost",
"headline": "Boost targets: −1 psi at 3,500–4,000 rpm, because overshoot held 3.4 psi there.",
"route": null,
"basis": "Data",
"proof": "A Cool drive with 2 hard pulls: overshoot at or under +2.5 psi, full-load mixture at or richer than target and never leaner than 12.0, trims within ±5 %.",
"saveAs": "Starter 21 Dual Tune 2 · 20250901 · boost r1 · 20250901 · boost r2",
"undoName": "Flash your previous map file (Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1, flashed 20250901-174000)",
"undo": {
"known": true,
"version": 2,
"name": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"from": 1756723200000,
"stamp": "20250901-174000",
"label": "Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1, flashed 20250901-174000",
"headline": "Flash your previous map file (Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1, flashed 20250901-174000)"
},
"mapVersion": {
"n": 2,
"name": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"label": "Map version 2",
"kind": "flash",
"tablesFrom": "app-store",
"tablesPending": false,
"from": 1756723200000,
"flashId": "fmf0zmwao-starter-21-dual-",
"changed": "boost",
"note": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"updatedAt": 1756723200000
},
"ceilingPsi": 23.4,
"tables": [
{
"id": "Boost_Target_1_Normal_L",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_1_Normal_H",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_2_Normal_L",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_2_Normal_H",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_3_Normal_L",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_3_Normal_H",
"kind": "map",
"cellCount": 28,
"pasteRow": null
}
],
"cellCount": 168,
"cells": [
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 12.5,
"after": 11.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 14.5,
"after": 13.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 16.5,
"after": 15.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 18,
"after": 17
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 20,
"after": 19
}
],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": "boost",
"evidence": [
{
"drives": [
"20260901-081358"
],
"text": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"basis": "Data"
}
],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median 0.0 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; the B2 overshoot trim comes first; the latest Cool drive (5 Sep 07:56) was read without a Pedal full reading: say what TPS reads with the pedal floored; no hot drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi at 3,500–4,000 rpm",
"status": "planned",
"reason": "In the plan below.",
"unlocks": "Two hard pulls on a Cool drive prove it."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": false,
"unexplained": []
},
"stepFail": null,
"ktunerCard": {
"kind": "change",
"changeId": "3c881aef53",
"family": "boost",
"headline": "Boost targets: −1 psi at 3,500–4,000 rpm, because overshoot held 3.4 psi there.",
"because": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"writtenOn": "Written on Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1",
"groups": [
{
"tables": [
"Boost Target 1 Normal L",
"Boost Target 1 Normal H",
"Boost Target 2 Normal L",
"Boost Target 2 Normal H",
"Boost Target 3 Normal L",
"Boost Target 3 Normal H"
],
"tableIds": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H"
],
"unit": "psi",
"what": "The boost the ECU aims for in Normal and Sport, psi gauge, by rpm (rows) and load (columns).",
"effect": "Lowers the boost the ECU aims for by 1.0 psi in 28 cells, 3,500-4,000 rpm.",
"same": true,
"pasteRow": null,
"cells": [
{
"id": "0-12-2",
"rpm": 3500,
"row": "3,500 rpm",
"col": 3,
"of": 16,
"column": "3 of 16",
"before": "12.5",
"after": "11.5",
"unit": "psi"
},
{
"id": "0-12-3",
"rpm": 3500,
"row": "3,500 rpm",
"col": 4,
"of": 16,
"column": "4 of 16",
"before": "14.5",
"after": "13.5",
"unit": "psi"
},
{
"id": "0-12-4",
"rpm": 3500,
"row": "3,500 rpm",
"col": 5,
"of": 16,
"column": "5 of 16",
"before": "16.5",
"after": "15.5",
"unit": "psi"
},
{
"id": "0-12-5",
"rpm": 3500,
"row": "3,500 rpm",
"col": 6,
"of": 16,
"column": "6 of 16",
"before": "18.0",
"after": "17.0",
"unit": "psi"
},
{
"id": "0-12-6",
"rpm": 3500,
"row": "3,500 rpm",
"col": 7,
"of": 16,
"column": "7 of 16",
"before": "19.0",
"after": "18.0",
"unit": "psi"
},
{
"id": "0-12-7",
"rpm": 3500,
"row": "3,500 rpm",
"col": 8,
"of": 16,
"column": "8 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-8",
"rpm": 3500,
"row": "3,500 rpm",
"col": 9,
"of": 16,
"column": "9 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-9",
"rpm": 3500,
"row": "3,500 rpm",
"col": 10,
"of": 16,
"column": "10 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-10",
"rpm": 3500,
"row": "3,500 rpm",
"col": 11,
"of": 16,
"column": "11 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-11",
"rpm": 3500,
"row": "3,500 rpm",
"col": 12,
"of": 16,
"column": "12 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-12",
"rpm": 3500,
"row": "3,500 rpm",
"col": 13,
"of": 16,
"column": "13 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-13",
"rpm": 3500,
"row": "3,500 rpm",
"col": 14,
"of": 16,
"column": "14 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-14",
"rpm": 3500,
"row": "3,500 rpm",
"col": 15,
"of": 16,
"column": "15 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-15",
"rpm": 3500,
"row": "3,500 rpm",
"col": 16,
"of": 16,
"column": "16 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-2",
"rpm": 4000,
"row": "4,000 rpm",
"col": 3,
"of": 16,
"column": "3 of 16",
"before": "12.5",
"after": "11.5",
"unit": "psi"
},
{
"id": "0-13-3",
"rpm": 4000,
"row": "4,000 rpm",
"col": 4,
"of": 16,
"column": "4 of 16",
"before": "14.5",
"after": "13.5",
"unit": "psi"
},
{
"id": "0-13-4",
"rpm": 4000,
"row": "4,000 rpm",
"col": 5,
"of": 16,
"column": "5 of 16",
"before": "16.5",
"after": "15.5",
"unit": "psi"
},
{
"id": "0-13-5",
"rpm": 4000,
"row": "4,000 rpm",
"col": 6,
"of": 16,
"column": "6 of 16",
"before": "18.0",
"after": "17.0",
"unit": "psi"
},
{
"id": "0-13-6",
"rpm": 4000,
"row": "4,000 rpm",
"col": 7,
"of": 16,
"column": "7 of 16",
"before": "19.0",
"after": "18.0",
"unit": "psi"
},
{
"id": "0-13-7",
"rpm": 4000,
"row": "4,000 rpm",
"col": 8,
"of": 16,
"column": "8 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-8",
"rpm": 4000,
"row": "4,000 rpm",
"col": 9,
"of": 16,
"column": "9 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-9",
"rpm": 4000,
"row": "4,000 rpm",
"col": 10,
"of": 16,
"column": "10 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-10",
"rpm": 4000,
"row": "4,000 rpm",
"col": 11,
"of": 16,
"column": "11 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-11",
"rpm": 4000,
"row": "4,000 rpm",
"col": 12,
"of": 16,
"column": "12 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-12",
"rpm": 4000,
"row": "4,000 rpm",
"col": 13,
"of": 16,
"column": "13 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-13",
"rpm": 4000,
"row": "4,000 rpm",
"col": 14,
"of": 16,
"column": "14 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-14",
"rpm": 4000,
"row": "4,000 rpm",
"col": 15,
"of": 16,
"column": "15 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-15",
"rpm": 4000,
"row": "4,000 rpm",
"col": 16,
"of": 16,
"column": "16 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
}
]
}
],
"cellCount": 28,
"tableCount": 6,
"saveAs": "Starter 21 Dual Tune 2 · 20250901 · boost r1 · 20250901 · boost r2",
"undo": {
"known": true,
"version": 2,
"line": "Flash your previous map file (Map version 2 · Starter 21 Dual Tune 2 · 20250901 · boost r1, flashed 20250901-174000)"
},
"proof": "A Cool drive with 2 hard pulls: overshoot at or under +2.5 psi, full-load mixture at or richer than target and never leaner than 12.0, trims within ±5 %.",
"afterFlash": "Then drive a Shakedown drive: 10 calm minutes, no hard driving.",
"readback": {
"possible": true,
"line": "Readback is possible: your first Drive after the Flash checks the logged Turbo Pressure Target in these cells."
},
"checked": "Checked twice, and both checks agree: the engine's rules and a separate check against Map version 2."
}
},
"cause": null,
"nextStep": {
"kind": "change",
"key": "recheck",
"title": "Re-check what you typed in KTuner",
"body": "Re-check what you typed in KTuner: 4,000 rpm column 3 reads 12.2, planned 12.5.",
"recipe": null,
"gauges": null,
"same": false,
"proves": "",
"upload": "",
"uploadWhen": "",
"flashPlan": null,
"also": null
},
"readback": {
"state": "mismatch",
"credited": false,
"mismatches": [
"4,000 rpm column 3 reads 12.2, planned 12.5"
],
"line": "Readback: what the ECU runs is not Map version 2. 4,000 rpm column 3 reads 12.2, planned 12.5.",
"next": "Re-check what you typed in KTuner: 4,000 rpm column 3 reads 12.2, planned 12.5.",
"version": 2,
"cells": [
{
"rpm": 3500,
"cols": [
3
],
"before": 13.5,
"after": 12.5,
"status": "unseen",
"reads": null
},
{
"rpm": 3500,
"cols": [
4
],
"before": 15.5,
"after": 14.5,
"status": "unseen",
"reads": null
},
{
"rpm": 3500,
"cols": [
5
],
"before": 17.5,
"after": 16.5,
"status": "unseen",
"reads": null
},
{
"rpm": 3500,
"cols": [
6
],
"before": 19.0,
"after": 18,
"status": "unseen",
"reads": null
},
{
"rpm": 3500,
"cols": [
7
],
"before": 20.0,
"after": 19,
"status": "unseen",
"reads": null
},
{
"rpm": 3500,
"cols": [
8,
9,
10,
11,
12,
13,
14,
15,
16
],
"before": 21.0,
"after": 20,
"status": "unseen",
"reads": null
},
{
"rpm": 4000,
"cols": [
3
],
"before": 13.5,
"after": 12.5,
"status": "mismatch",
"reads": 12.2
},
{
"rpm": 4000,
"cols": [
4
],
"before": 15.5,
"after": 14.5,
"status": "unseen",
"reads": null
},
{
"rpm": 4000,
"cols": [
5
],
"before": 17.5,
"after": 16.5,
"status": "unseen",
"reads": null
},
{
"rpm": 4000,
"cols": [
6
],
"before": 19.0,
"after": 18,
"status": "unseen",
"reads": null
},
{
"rpm": 4000,
"cols": [
7
],
"before": 20.0,
"after": 19,
"status": "unseen",
"reads": null
},
{
"rpm": 4000,
"cols": [
8,
9,
10,
11,
12,
13,
14,
15,
16
],
"before": 21.0,
"after": 20,
"status": "unseen",
"reads": null
}
]
},
"questions": [],
"housing": null,
"harness": {
"checked": 12,
"seconds": 0,
"line": "Checked 12 things · 0 s",
"steps": [
{
"name": "readLog",
"title": "Read the TunerView log",
"inputs": "sha1:e02a8b05e8b1",
"output": "sha1:1fe78a90ad1f",
"ms": 0
},
{
"name": "ingestUpload",
"title": "Add the Drive to your Car history",
"inputs": "sha1:e02a8b05e8b1",
"output": "sha1:336582f7f7aa",
"ms": 0
},
{
"name": "carHistory",
"title": "Compare with your earlier Drives",
"inputs": "sha1:c9ead7c0c6d6",
"output": "sha1:c238365e3fad",
"ms": 0
},
{
"name": "overview",
"title": "Check every safety line",
"inputs": "sha1:c2c286f80828",
"output": "sha1:c00b80fa1d57",
"ms": 0
},
{
"name": "driveFacts",
"title": "Read this Drive's numbers",
"inputs": "sha1:c2c286f80828",
"output": "sha1:997bf53926d4",
"ms": 0
},
{
"name": "logQuality",
"title": "Check the log against the drive brief",
"inputs": "sha1:c2c286f80828",
"output": "sha1:307a22f0e024",
"ms": 0
},
{
"name": "heat",
"title": "Read intake, coolant and CVT heat",
"inputs": "sha1:c2c286f80828",
"output": "sha1:b88f6e97c0a5",
"ms": 0
},
{
"name": "flashPlan",
"title": "Work out the Flash plan",
"inputs": "sha1:c9ead7c0c6d6",
"output": "sha1:38685224edd1",
"ms": 0
},
{
"name": "ceilingRead",
"title": "Read whether more boost can show",
"inputs": "sha1:c9ead7c0c6d6",
"output": "sha1:4ec5856b43ea",
"ms": 0
},
{
"name": "settleOpenSteps",
"title": "Settle what I asked last time",
"inputs": "sha1:947165c9e158",
"output": "sha1:29e5e93a01d3",
"ms": 0
},
{
"name": "nextStep",
"title": "Decide the Next step",
"inputs": "sha1:947165c9e158",
"output": "sha1:7853e74622f8",
"ms": 0
},
{
"name": "ownerQuestions",
"title": "Ask what only you know",
"inputs": "sha1:947165c9e158",
"output": "sha1:782bdbd9aa7d",
"ms": 0
}
]
},
"checkpoints": [
{
"id": "rate",
"label": "Logged 10 times a second or faster",
"value": "7.5 a second",
"met": false
},
{
"id": "moving",
"label": "10 minutes or more of moving",
"value": "35 min",
"met": true
},
{
"id": "gauges",
"label": "Every gauge moving",
"value": "stuck: DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target",
"met": false
},
{
"id": "channels",
"label": "AFR Command and MAF Hz in the log",
"value": "missing: AFR Command and MAF Hz",
"met": false
},
{
"id": "warm",
"label": "Engine warm (coolant 80 °C or more)",
"value": "91 °C peak",
"met": true
},
{
"id": "cool",
"label": "Cool intake while moving (under 42 °C)",
"value": "39 °C",
"met": true
},
{
"id": "pulls",
"label": "2 full-throttle pulls",
"value": "0 hard pulls",
"met": false
},
{
"id": "pullIat",
"label": "Pulls started under 48 °C intake",
"value": "no pull to time",
"met": null
}
],
"health": {
"line": "Nothing wrong seen, but 7 checks couldn't be read on this log.",
"rows": [
{
"system": "Fuel",
"id": "trims",
"label": "Fuel trims (cruise)",
"value": "+0.6 %",
"word": "OK",
"tone": "good",
"band": {
"value": 0.6,
"unit": "%",
"min": -15,
"max": 15,
"marks": [
{
"at": -10,
"label": "Stop -10",
"tone": "stop"
},
{
"at": -5,
"label": "Watch -5",
"tone": "watch"
},
{
"at": 5,
"label": "Watch +5",
"tone": "watch"
},
{
"at": 10,
"label": "Stop +10",
"tone": "stop"
}
],
"source": "kc-trims"
}
},
{
"system": "Fuel",
"id": "wotAfr",
"label": "Mixture at 12 psi and up",
"value": "No time at 12 psi or more",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Fuel",
"id": "fuelPress",
"label": "DI fuel pressure at WOT",
"value": "Not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "overshoot",
"label": "Boost overshoot",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "undershoot",
"label": "Boost reaches target",
"value": "Needs boost and boost target",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Air & boost",
"id": "mafHz",
"label": "MAF sensor headroom",
"value": "MAF Hz not logged",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "Spark",
"id": "knock",
"label": "Knock retard at WOT",
"value": "5.5° under boost, scheduled by Knock Control (not knock events)",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "Spark",
"id": "kControl",
"label": "Fuel-quality score (Knock Control)",
"value": "0.49 → 0.49",
"word": "OK",
"tone": "good",
"band": {
"value": 0.49,
"unit": "",
"min": 0.45,
"max": 0.85,
"marks": [
{
"at": 0.49,
"label": "Floor 0.49",
"tone": "good"
},
{
"at": 0.56,
"label": "Watch 0.56",
"tone": "watch"
},
{
"at": 0.62,
"label": "No hard driving 0.62",
"tone": "watch"
},
{
"at": 0.8,
"label": "Stop 0.80",
"tone": "stop"
}
],
"source": "kc-ranges"
}
},
{
"system": "Heat",
"id": "iat",
"label": "Intake air temp",
"value": "49 °C peak under boost",
"word": "OK",
"tone": "good",
"band": {
"value": 49,
"unit": "°C",
"min": 20,
"max": 60,
"marks": [
{
"at": 42,
"label": "Cool 42",
"tone": "none"
},
{
"at": 48,
"label": "Pull start 48",
"tone": "none"
}
],
"source": "kc-drive-brief"
}
},
{
"system": "Heat",
"id": "ect",
"label": "Coolant temp",
"value": "91 °C peak",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "cvtTemp",
"label": "CVT fluid temp",
"value": "Can't tell: CVT fluid temp was flat for the whole drive.",
"word": "Can't tell",
"tone": "none",
"band": null
},
{
"system": "CVT",
"id": "slip",
"label": "CVT slip (revs without speed)",
"value": "No slip seen under boost",
"word": "OK",
"tone": "good",
"band": null
},
{
"system": "CVT",
"id": "lowBoost",
"label": "Boost below 3,000 rpm",
"value": "Needs a pull and boost",
"word": "Can't tell",
"tone": "none",
"band": null
}
]
},
"calibration": {
"status": "no-reading",
"settled": false,
"mapAction": "no-change",
"meaning": "No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive.",
"unlocks": null,
"lines": [
{
"label": "Pedal",
"value": "Not set yet: type the Pedal full reading in your car profile",
"tone": "watch"
},
{
"label": "Logger",
"value": "7.5 a second · AFR Command not checked · MAF Hz not checked",
"tone": "good"
},
{
"label": "Ceiling",
"value": "Can't tell: the drive was read without a Pedal full reading: say what TPS reads with the pedal floored.",
"tone": "none"
},
{
"label": "What it means",
"value": "No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive.",
"tone": "none"
}
]
},
"tour": {
"families": [
{
"family": "airflow",
"title": "Airflow (MAF Scaling)",
"what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
"card": "kc-table-maf",
"tables": [
"MAF_Scaling_Custom",
"MAF_Scaling_Factory",
"MAF_Scaling_PRL_Race",
"MAF_Scaling_27Won_Race"
],
"status": "fine",
"reason": "No change: trims within ±5 % (median 0.0 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"family": "mixture",
"title": "Full-throttle mixture (WOT Enrich)",
"what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
"card": "kc-table-wot",
"tables": [
"WOT_Enrich_L",
"WOT_Enrich_H"
],
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"family": "boost",
"title": "Boost targets and limits",
"what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
"card": "kc-table-boost",
"tables": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H",
"Boost_Target_1_ECO_L",
"Boost_Target_1_ECO_H",
"Final_Boost_Target_L",
"Final_Boost_Target_H",
"Boost_By_Gear_Limits",
"Cylinder_Fill_Limitation_L",
"Cylinder_Fill_Limitation_H"
],
"status": "this-round",
"reason": "In the plan below.",
"unlocks": null
},
{
"family": "ignition",
"title": "Ignition timing",
"what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
"card": "kc-table-ignition",
"tables": [
"Ignition_Base_L",
"Ignition_Base_H",
"Ignition_Max_L",
"Ignition_Max_H",
"Ethanol_Ign_Adj_L",
"Ethanol_Ign_Adj_H"
],
"status": "read-only",
"reason": "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove timing where retard collects, never add it without a dyno.",
"unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing)."
},
{
"family": "knock",
"title": "Knock sensitivity",
"what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
"card": "kc-table-ignition",
"tables": [
"Knock_Sens_1+4_L",
"Knock_Sens_1+4_H",
"Knock_Sens_2+3_L",
"Knock_Sens_2+3_H"
],
"status": "read-only",
"reason": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
"unlocks": "Nothing in this app: this one stays with the basemap."
},
{
"family": "basemap",
"title": "Left to the basemap",
"what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
"card": "kc-tune-order",
"tables": [
"DI_Fuel_Pressure_Target_0pct",
"DI_Fuel_Pressure_Target_55pct",
"WOT_Exhaust_VTC_Low_Cam",
"Ethanol_Boost_Target_Adj_L",
"Ethanol_Boost_Target_Adj_H"
],
"status": "read-only",
"reason": "Leave to the basemap: these are matched to the hardware, not to a street log.",
"unlocks": "Hardware changes a professional tuner would recalibrate for."
}
],
"headline": "Boost targets: −1 psi at 3,500–4,000 rpm, because overshoot held 3.4 psi there."
},
"tags": {
"fuel": null,
"slot": 1
},
"repeat": {
"line": "I read this drive before, on 1 Sep: nothing new is added to your car file.",
"at": 1756723200000
},
"pictures": [],
"openSteps": [
{
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"id": "channels",
"askedOn": "20260901-081358",
"askedAt": 1788225238000,
"lastAskedOn": null,
"settledBy": "20260905-075634",
"settledAt": 1788569794000,
"word": "Can't tell yet",
"tone": "none"
},
{
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "done",
"why": "Intake 37 °C, 2 pulls, 50→70 km/h in 1.97 s. Every later Drive is compared to this one.",
"id": "baseline",
"askedOn": "20260901-081358",
"askedAt": 1788225238000,
"lastAskedOn": null,
"settledBy": "20260901-081358",
"settledAt": 1788225238000,
"word": "Done",
"tone": "good"
},
{
"key": "logger",
"title": "Fix the logger: dead gauges",
"status": "open",
"why": "Asked on 5 Sep 07:56.",
"id": "logger",
"askedOn": "20260905-075634",
"askedAt": 1788569794000,
"lastAskedOn": "20260905-075634",
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
]
}
];

export const states: LoopState[] = [
{
"carProfile": null,
"profileSpec": {
"fields": [
"model",
"engine",
"transmission",
"fuel",
"climate",
"basemap"
],
"parts": [
"intake",
"downpipe",
"front-pipe",
"catback",
"intercooler",
"cvt-cooler"
],
"basemap": "Starter 21 Dual Tune 2",
"basemapNote": "Prefilled from the map the app holds: you never type a table name."
},
"hasDrives": false,
"driveWindow": {
"driveIds": [],
"count": 0,
"since": null,
"line": "nothing read yet"
},
"ktunerBasemap": "Starter 21 Dual Tune 2",
"carHistory": [],
"baseline": {
"value": 0.49,
"n": 0
},
"flashes": [],
"installs": [],
"mapVersions": [
{
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
}
],
"activeMapVersion": {
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
},
"openSteps": [],
"answers": {},
"questionAnswers": {},
"unansweredQuestions": [],
"drives": [],
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (no trim data yet).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: no Cool drive yet; no hot drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot never over 2.5 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": false,
"unexplained": []
},
"stepFail": null
},
"hasLlm": false,
"calibration": {
"status": "none",
"driveId": null,
"mapAction": "no-change",
"settled": false
},
"logGuide": {
"title": "The Calibration drive",
"intro": "One drive answers whether more boost can show on your car: it reads whether the boost target reaches your map's table with the pedal floored. It adds no power by itself, and it can come back \"capped\": that is an answer too. About 25 minutes, done once.",
"sections": [
{
"title": "Parked, the evening before",
"steps": [
"Ignition on, engine off (press Start twice without the brake), TunerView's live screen open: press the pedal to the floor and hold it, three times. Read TPS at each hold and type the highest in your car profile as the Pedal full reading.",
"In TunerView's gauge list, check whether it offers AFR Command and MAF Hz, and say so in your car profile's Logger setup.",
"Open TunerView's logging rate menu and type its fastest logging rate in the Logger setup too.",
"If you can, attach a screenshot of KTuner's Quick Adjustments screen here, so I can see the map's settings."
]
},
{
"title": "Before you drive, in TunerView",
"steps": [
"Turn on every gauge in the table below, plus AFR Command and MAF Hz if your app offers them.",
"Set the logging rate as fast as it goes: 10 samples a second or more.",
"Mount the phone where you won't touch it, and start the log before you set off."
]
},
{
"title": "When and where",
"steps": [
"Before 8 am, or after an hour parked in shade, so the intake reads under 42 °C.",
"Pick a straight, empty road where full throttle is legal and safe. Never in traffic."
]
},
{
"title": "Warm up, then cruise",
"steps": [
"Drive about 10 minutes normally, until coolant reads 80 °C or more.",
"Then cruise steady at a few different speeds, light throttle, several minutes in all: your fuel trims are read from this."
]
},
{
"title": "The two pulls",
"steps": [
"Choose slot 2 (Tune 2) when you start the car: while you choose, the tach shows 2,000 rpm for it. Turn ECO off.",
"Put the gearbox in S.",
"From a steady 50 km/h, press the pedal to the floor, all the way, and hold it until 100 km/h: at least 5 seconds, above 3,500 rpm for 4 s or more.",
"Cruise calmly about a minute so the intake cools, check it reads under 48 °C, then do the second pull the same way.",
"No brake launch, and no pull with the CVT fluid at 90 °C or more."
]
},
{
"title": "Finish",
"steps": [
"Keep at least 10 minutes of moving time in the log in all.",
"Idle a minute, stop the log, export it as CSV, and attach it here."
]
}
],
"checkpoints": [
"Logged 10 times a second or faster",
"10 minutes or more of moving",
"Every gauge moving",
"AFR Command and MAF Hz in the log",
"Engine warm (coolant 80 °C or more)",
"Cool intake while moving (under 42 °C)",
"2 full-throttle pulls",
"Pulls started under 48 °C intake",
"2 floored pulls held 4 s or more above 3,500 rpm",
"On slot 2 (Tune 2)"
],
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "STFT B1 + LTFT B1",
"ok": "within ±5 %",
"see": "beyond ±10 %",
"then": "Stop pulling. Drive home calm, upload."
}
]
},
"slot": 2
},
"stage": "car",
"recap": null,
"suggestions": [
{
"label": "Use an example description",
"action": "example",
"icon": "car"
},
{
"label": "What can you do?",
"action": "send",
"icon": "help",
"text": "What can you do?"
}
],
"capabilities": [
{
"id": "read-log",
"status": "can",
"title": "Read your TunerView log",
"says": "Attach a TunerView CSV and I read every row: is the engine OK (OK, Watch, Stop or Can't tell), the health report by system, and whether the log met the drive brief."
},
{
"id": "car-file",
"status": "can",
"title": "Keep your car's file",
"says": "I keep your car: model, fuel, parts with the date fitted, every Map version and Flash, and every Drive, so each answer is read against your car's own history."
},
{
"id": "next-step",
"status": "can",
"title": "Name the one next step",
"says": "After each log I name one thing to do — a change to flash, a gauge to watch, or a drive to log — and the drive that will prove it."
},
{
"id": "maf",
"status": "partly",
"title": "Correct your airflow (MAF Scaling)",
"says": "I can correct MAF Scaling at part throttle from your trims, a few points at a time, when your logs call for it.",
"limit": "Full throttle needs AFR Command in your log, which your logs don't have yet, so I don't correct that end of the curve."
},
{
"id": "boost-down",
"status": "partly",
"title": "Change boost",
"says": "I can lower boost where your logs show overshoot or lugging.",
"limit": "I never raise boost: on this turbo the wastegate has no headroom left."
},
{
"id": "afr",
"status": "partly",
"title": "Judge your AFR (mixture)",
"says": "I judge full-throttle AFR against your map's target and say if it is OK, Watch or Stop.",
"limit": "I don't change the full-throttle AFR target: no gain is shown on this car, and leaning it costs timing."
},
{
"id": "fuel",
"status": "can",
"title": "E10 and RON95 III vs RON97 III",
"says": "Tag each log with its fuel and I compare RON95 III and RON97 III on matched drives by Knock Control, so you see if premium is worth it on your car."
},
{
"id": "tables",
"status": "can",
"title": "Explain any table in your map",
"says": "I can walk your map family by family and show any table in 2D or 3D with your own values, and explain what it does."
},
{
"id": "slots",
"status": "partly",
"title": "KTuner map slots (on-the-fly switching)",
"says": "Tag each log with the map slot it ran on, and I never compare drives from different slots.",
"limit": "I keep one map line for the car, not one per slot, so I can't yet tune a separate RON97 map in its own slot."
},
{
"id": "ignition",
"status": "cannot",
"title": "Add ignition timing or lower knock sensitivity",
"says": "I read and explain the ignition and knock tables, and show how much timing Knock Control pulls.",
"limit": "I never add timing or lower knock sensitivity: a street log can't prove that change is safe, and a wrong one costs an engine."
},
{
"id": "flash",
"status": "cannot",
"title": "Flash the ECU for you",
"says": "I give you the exact cells to type into KTuner and keep each Map version.",
"limit": "You flash in KTuner yourself; I can't connect to the car or the ECU."
},
{
"id": "live",
"status": "cannot",
"title": "Watch the car live",
"says": "I read a log after the drive.",
"limit": "I can't see live data: log in TunerView, then attach the CSV."
},
{
"id": "power",
"status": "cannot",
"title": "Promise power or dyno numbers",
"says": "I can time a 50 to 70 km/h run from your log and compare like with like.",
"limit": "A street log can't give horsepower, and I never promise a gain."
},
{
"id": "other-car",
"status": "partly",
"title": "Cars other than the Civic FE 1.5T",
"says": "My limits and knowledge are built for a Honda 1.5T on KTuner.",
"limit": "On any other car I'm not sure my limits hold: I'd read the log, but treat every verdict as unproven."
}
]
},
{
"carProfile": null,
"profileSpec": {
"fields": [
"model",
"engine",
"transmission",
"fuel",
"climate",
"basemap"
],
"parts": [
"intake",
"downpipe",
"front-pipe",
"catback",
"intercooler",
"cvt-cooler"
],
"basemap": "Starter 21 Dual Tune 2",
"basemapNote": "Prefilled from the map the app holds: you never type a table name."
},
"hasDrives": true,
"driveWindow": {
"driveIds": [
"20260822-090322"
],
"count": 1,
"since": null,
"line": "based on this Drive only (22 Aug 09:03)"
},
"ktunerBasemap": "Starter 21 Dual Tune 2",
"carHistory": [
{
"id": "20260822-090322",
"start": 1787364202000,
"fileName": "TunerView_20260822_090322.csv",
"duration": 541,
"moving": 482,
"cool": false,
"hot": true,
"hotRestart": true,
"verdict": "watch",
"kcStart": 0.49,
"kcEnd": 0.5,
"kcPeak": 0.52,
"trimWorst": -2.3,
"iatMoving": 49,
"cvtPeak": 79,
"lugShare": 5.69,
"accel5070": {
"seconds": 1.63,
"iat": 56
},
"boostTarget": 16.3,
"hardPulls": 9,
"overshoot": 1.9,
"wgAtPeak": 3.2,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
}
],
"baseline": {
"value": 0.49,
"n": 0
},
"flashes": [],
"installs": [],
"mapVersions": [
{
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
}
],
"activeMapVersion": {
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
},
"openSteps": [
{
"id": "baseline",
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "open",
"why": "Asked on 22 Aug 09:03.",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": "20260822-090322",
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
},
{
"id": "channels",
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "open",
"why": "Asked on 22 Aug 09:03.",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
],
"answers": {},
"questionAnswers": {},
"unansweredQuestions": [],
"drives": [
{
"id": "20260822-090322",
"upload_id": "<id>",
"file_name": "TunerView_20260822_090322.csv",
"started_at": 1787364202000,
"received_at": 0,
"too_short": false,
"verdict": "watch",
"summary": {
"id": "20260822-090322",
"start": 1787364202000,
"fileName": "TunerView_20260822_090322.csv",
"durationSec": 541,
"movingSec": 482,
"iatMoving": 49,
"cool": false,
"hot": true,
"hotRestart": true,
"kcStart": 0.49,
"kcEnd": 0.5,
"kcPeak": 0.52,
"timingCostDeg": 0.3,
"trimWorst": -2.3,
"hardPulls": 9,
"mixLeanest": 10.5,
"mixTarget": 11,
"boostTarget": 16.3,
"overshoot": 1.9,
"wgAtPeak": 3.2,
"cvtPeak": 79,
"lugShare": 5.69,
"kcUpSteps": 3,
"lugUpSteps": 0,
"lugRpm": 1479,
"accel5070": 1.63,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 418,
"shakedown": "none"
}
}
],
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median -2.3 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; no Cool drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot max 1.9 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": {
"driveId": "20260822-090322",
"start": 1787364202000,
"cause": "heat"
},
"shakedownPending": false,
"unexplained": []
},
"stepFail": null
},
"hasLlm": false,
"calibration": {
"status": "none",
"driveId": null,
"mapAction": "no-change",
"settled": false
},
"logGuide": {
"title": "The Calibration drive",
"intro": "One drive answers whether more boost can show on your car: it reads whether the boost target reaches your map's table with the pedal floored. It adds no power by itself, and it can come back \"capped\": that is an answer too. About 25 minutes, done once.",
"sections": [
{
"title": "Parked, the evening before",
"steps": [
"Ignition on, engine off (press Start twice without the brake), TunerView's live screen open: press the pedal to the floor and hold it, three times. Read TPS at each hold and type the highest in your car profile as the Pedal full reading.",
"In TunerView's gauge list, check whether it offers AFR Command and MAF Hz, and say so in your car profile's Logger setup.",
"Open TunerView's logging rate menu and type its fastest logging rate in the Logger setup too.",
"If you can, attach a screenshot of KTuner's Quick Adjustments screen here, so I can see the map's settings."
]
},
{
"title": "Before you drive, in TunerView",
"steps": [
"Turn on every gauge in the table below, plus AFR Command and MAF Hz if your app offers them.",
"Set the logging rate as fast as it goes: 10 samples a second or more.",
"Mount the phone where you won't touch it, and start the log before you set off."
]
},
{
"title": "When and where",
"steps": [
"Before 8 am, or after an hour parked in shade, so the intake reads under 42 °C.",
"Pick a straight, empty road where full throttle is legal and safe. Never in traffic."
]
},
{
"title": "Warm up, then cruise",
"steps": [
"Drive about 10 minutes normally, until coolant reads 80 °C or more.",
"Then cruise steady at a few different speeds, light throttle, several minutes in all: your fuel trims are read from this."
]
},
{
"title": "The two pulls",
"steps": [
"Choose slot 2 (Tune 2) when you start the car: while you choose, the tach shows 2,000 rpm for it. Turn ECO off.",
"Put the gearbox in S.",
"From a steady 50 km/h, press the pedal to the floor, all the way, and hold it until 100 km/h: at least 5 seconds, above 3,500 rpm for 4 s or more.",
"Cruise calmly about a minute so the intake cools, check it reads under 48 °C, then do the second pull the same way.",
"No brake launch, and no pull with the CVT fluid at 90 °C or more."
]
},
{
"title": "Finish",
"steps": [
"Keep at least 10 minutes of moving time in the log in all.",
"Idle a minute, stop the log, export it as CSV, and attach it here."
]
}
],
"checkpoints": [
"Logged 10 times a second or faster",
"10 minutes or more of moving",
"Every gauge moving",
"AFR Command and MAF Hz in the log",
"Engine warm (coolant 80 °C or more)",
"Cool intake while moving (under 42 °C)",
"2 full-throttle pulls",
"Pulls started under 48 °C intake",
"2 floored pulls held 4 s or more above 3,500 rpm",
"On slot 2 (Tune 2)"
],
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "STFT B1 + LTFT B1",
"ok": "within ±5 %",
"see": "beyond ±10 %",
"then": "Stop pulling. Drive home calm, upload."
}
]
},
"slot": 2
},
"stage": "car",
"recap": null,
"suggestions": [
{
"label": "Use an example description",
"action": "example",
"icon": "car"
},
{
"label": "What can you do?",
"action": "send",
"icon": "help",
"text": "What can you do?"
}
],
"capabilities": [
{
"id": "read-log",
"status": "can",
"title": "Read your TunerView log",
"says": "Attach a TunerView CSV and I read every row: is the engine OK (OK, Watch, Stop or Can't tell), the health report by system, and whether the log met the drive brief."
},
{
"id": "car-file",
"status": "can",
"title": "Keep your car's file",
"says": "I keep your car: model, fuel, parts with the date fitted, every Map version and Flash, and every Drive, so each answer is read against your car's own history."
},
{
"id": "next-step",
"status": "can",
"title": "Name the one next step",
"says": "After each log I name one thing to do — a change to flash, a gauge to watch, or a drive to log — and the drive that will prove it."
},
{
"id": "maf",
"status": "partly",
"title": "Correct your airflow (MAF Scaling)",
"says": "I can correct MAF Scaling at part throttle from your trims, a few points at a time, when your logs call for it.",
"limit": "Full throttle needs AFR Command in your log, which your logs don't have yet, so I don't correct that end of the curve."
},
{
"id": "boost-down",
"status": "partly",
"title": "Change boost",
"says": "I can lower boost where your logs show overshoot or lugging.",
"limit": "I never raise boost: on this turbo the wastegate has no headroom left."
},
{
"id": "afr",
"status": "partly",
"title": "Judge your AFR (mixture)",
"says": "I judge full-throttle AFR against your map's target and say if it is OK, Watch or Stop.",
"limit": "I don't change the full-throttle AFR target: no gain is shown on this car, and leaning it costs timing."
},
{
"id": "fuel",
"status": "can",
"title": "E10 and RON95 III vs RON97 III",
"says": "Tag each log with its fuel and I compare RON95 III and RON97 III on matched drives by Knock Control, so you see if premium is worth it on your car."
},
{
"id": "tables",
"status": "can",
"title": "Explain any table in your map",
"says": "I can walk your map family by family and show any table in 2D or 3D with your own values, and explain what it does."
},
{
"id": "slots",
"status": "partly",
"title": "KTuner map slots (on-the-fly switching)",
"says": "Tag each log with the map slot it ran on, and I never compare drives from different slots.",
"limit": "I keep one map line for the car, not one per slot, so I can't yet tune a separate RON97 map in its own slot."
},
{
"id": "ignition",
"status": "cannot",
"title": "Add ignition timing or lower knock sensitivity",
"says": "I read and explain the ignition and knock tables, and show how much timing Knock Control pulls.",
"limit": "I never add timing or lower knock sensitivity: a street log can't prove that change is safe, and a wrong one costs an engine."
},
{
"id": "flash",
"status": "cannot",
"title": "Flash the ECU for you",
"says": "I give you the exact cells to type into KTuner and keep each Map version.",
"limit": "You flash in KTuner yourself; I can't connect to the car or the ECU."
},
{
"id": "live",
"status": "cannot",
"title": "Watch the car live",
"says": "I read a log after the drive.",
"limit": "I can't see live data: log in TunerView, then attach the CSV."
},
{
"id": "power",
"status": "cannot",
"title": "Promise power or dyno numbers",
"says": "I can time a 50 to 70 km/h run from your log and compare like with like.",
"limit": "A street log can't give horsepower, and I never promise a gain."
},
{
"id": "other-car",
"status": "partly",
"title": "Cars other than the Civic FE 1.5T",
"says": "My limits and knowledge are built for a Honda 1.5T on KTuner.",
"limit": "On any other car I'm not sure my limits hold: I'd read the log, but treat every verdict as unproven."
}
]
},
{
"carProfile": null,
"profileSpec": {
"fields": [
"model",
"engine",
"transmission",
"fuel",
"climate",
"basemap"
],
"parts": [
"intake",
"downpipe",
"front-pipe",
"catback",
"intercooler",
"cvt-cooler"
],
"basemap": "Starter 21 Dual Tune 2",
"basemapNote": "Prefilled from the map the app holds: you never type a table name."
},
"hasDrives": true,
"driveWindow": {
"driveIds": [
"20260822-090322",
"20260822-095021",
"20260823-195901",
"20260823-203853"
],
"count": 4,
"since": null,
"line": "based on your 4 Drives, 22 Aug 09:03 to 23 Aug 20:38"
},
"ktunerBasemap": "Starter 21 Dual Tune 2",
"carHistory": [
{
"id": "20260822-090322",
"start": 1787364202000,
"fileName": "TunerView_20260822_090322.csv",
"duration": 541,
"moving": 482,
"cool": false,
"hot": true,
"hotRestart": true,
"verdict": "watch",
"kcStart": 0.49,
"kcEnd": 0.5,
"kcPeak": 0.52,
"trimWorst": -2.3,
"iatMoving": 49,
"cvtPeak": 79,
"lugShare": 5.69,
"accel5070": {
"seconds": 1.63,
"iat": 56
},
"boostTarget": 16.3,
"hardPulls": 9,
"overshoot": 1.9,
"wgAtPeak": 3.2,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
},
{
"id": "20260822-095021",
"start": 1787367021000,
"fileName": "TunerView_20260822_095021.csv",
"duration": 1049,
"moving": 791,
"cool": false,
"hot": true,
"hotRestart": false,
"verdict": "watch",
"kcStart": 0.49,
"kcEnd": 0.5,
"kcPeak": 0.53,
"trimWorst": -3.9,
"iatMoving": 60,
"cvtPeak": 79,
"lugShare": 10.25,
"accel5070": null,
"boostTarget": 8.7,
"hardPulls": 0,
"overshoot": null,
"wgAtPeak": null,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
},
{
"id": "20260823-195901",
"start": 1787489941000,
"fileName": "TunerView_20260823_195901.csv",
"duration": 1721,
"moving": 1350,
"cool": false,
"hot": true,
"hotRestart": false,
"verdict": "good",
"kcStart": 0.49,
"kcEnd": 0.49,
"kcPeak": 0.5,
"trimWorst": -1.6,
"iatMoving": 49,
"cvtPeak": 68,
"lugShare": 6.82,
"accel5070": null,
"boostTarget": 8.7,
"hardPulls": 0,
"overshoot": null,
"wgAtPeak": null,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
},
{
"id": "20260823-203853",
"start": 1787492333000,
"fileName": "TunerView_20260823_203853.csv",
"duration": 887,
"moving": 617,
"cool": false,
"hot": true,
"hotRestart": true,
"verdict": "stop",
"kcStart": 0.5,
"kcEnd": 0.49,
"kcPeak": 0.5,
"trimWorst": -21.4,
"iatMoving": 45,
"cvtPeak": 85,
"lugShare": 2.45,
"accel5070": null,
"boostTarget": null,
"hardPulls": 0,
"overshoot": null,
"wgAtPeak": null,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
}
],
"baseline": {
"value": 0.49,
"n": 0
},
"flashes": [],
"installs": [],
"mapVersions": [
{
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
}
],
"activeMapVersion": {
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
},
"openSteps": [
{
"id": "baseline",
"key": "baseline",
"title": "Baseline: one Cool drive with 2 pulls",
"status": "wait",
"why": "Intake 45 °C while moving: not a Cool Drive.",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": "20260823-195901",
"settledBy": "20260823-203853",
"settledAt": 1787492333000,
"word": "Can't tell yet",
"tone": "none"
},
{
"id": "channels",
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": "20260823-203853",
"settledAt": 1787492333000,
"word": "Can't tell yet",
"tone": "none"
},
{
"id": "undo",
"key": "undo",
"title": "Undo: trims back within ±5 %",
"status": "open",
"why": "Asked on 23 Aug 20:38.",
"askedOn": "20260823-203853",
"askedAt": 1787492333000,
"lastAskedOn": "20260823-203853",
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
],
"answers": {},
"questionAnswers": {},
"unansweredQuestions": [
{
"id": "what-changed:20260823-203853",
"title": "What changed",
"askedOn": "20260823-203853",
"askedOnStamp": "23 Aug 20:38"
},
{
"id": "housing:20260823-203853",
"title": "Which intake housing is fitted",
"askedOn": "20260823-203853",
"askedOnStamp": "23 Aug 20:38"
}
],
"drives": [
{
"id": "20260823-203853",
"upload_id": "<id>",
"file_name": "TunerView_20260823_203853.csv",
"started_at": 1787492333000,
"received_at": 0,
"too_short": false,
"verdict": "stop",
"summary": {
"id": "20260823-203853",
"start": 1787492333000,
"fileName": "TunerView_20260823_203853.csv",
"durationSec": 887,
"movingSec": 617,
"iatMoving": 45,
"cool": false,
"hot": true,
"hotRestart": true,
"kcStart": 0.5,
"kcEnd": 0.49,
"kcPeak": 0.5,
"timingCostDeg": 0.1,
"trimWorst": -21.4,
"hardPulls": 0,
"mixLeanest": null,
"mixTarget": 11,
"boostTarget": null,
"overshoot": null,
"wgAtPeak": null,
"cvtPeak": 85,
"lugShare": 2.45,
"kcUpSteps": 1,
"lugUpSteps": 0,
"lugRpm": 1543,
"accel5070": null,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 616,
"shakedown": "none"
}
},
{
"id": "20260823-195901",
"upload_id": "<id>",
"file_name": "TunerView_20260823_195901.csv",
"started_at": 1787489941000,
"received_at": 0,
"too_short": false,
"verdict": "good",
"summary": {
"id": "20260823-195901",
"start": 1787489941000,
"fileName": "TunerView_20260823_195901.csv",
"durationSec": 1721,
"movingSec": 1350,
"iatMoving": 49,
"cool": false,
"hot": true,
"hotRestart": false,
"kcStart": 0.49,
"kcEnd": 0.49,
"kcPeak": 0.5,
"timingCostDeg": 0.1,
"trimWorst": -1.6,
"hardPulls": 0,
"mixLeanest": null,
"mixTarget": 11,
"boostTarget": 8.7,
"overshoot": null,
"wgAtPeak": null,
"cvtPeak": 68,
"lugShare": 6.82,
"kcUpSteps": 2,
"lugUpSteps": 0,
"lugRpm": 1481,
"accel5070": null,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 1338,
"shakedown": "none"
}
},
{
"id": "20260822-095021",
"upload_id": "<id>",
"file_name": "TunerView_20260822_095021.csv",
"started_at": 1787367021000,
"received_at": 0,
"too_short": false,
"verdict": "watch",
"summary": {
"id": "20260822-095021",
"start": 1787367021000,
"fileName": "TunerView_20260822_095021.csv",
"durationSec": 1049,
"movingSec": 791,
"iatMoving": 60,
"cool": false,
"hot": true,
"hotRestart": false,
"kcStart": 0.49,
"kcEnd": 0.5,
"kcPeak": 0.53,
"timingCostDeg": 0.4,
"trimWorst": -3.9,
"hardPulls": 0,
"mixLeanest": null,
"mixTarget": 11,
"boostTarget": 8.7,
"overshoot": null,
"wgAtPeak": null,
"cvtPeak": 79,
"lugShare": 10.25,
"kcUpSteps": 5,
"lugUpSteps": 4,
"lugRpm": 1458,
"accel5070": null,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 782,
"shakedown": "none"
}
},
{
"id": "20260822-090322",
"upload_id": "<id>",
"file_name": "TunerView_20260822_090322.csv",
"started_at": 1787364202000,
"received_at": 0,
"too_short": false,
"verdict": "watch",
"summary": {
"id": "20260822-090322",
"start": 1787364202000,
"fileName": "TunerView_20260822_090322.csv",
"durationSec": 541,
"movingSec": 482,
"iatMoving": 49,
"cool": false,
"hot": true,
"hotRestart": true,
"kcStart": 0.49,
"kcEnd": 0.5,
"kcPeak": 0.52,
"timingCostDeg": 0.3,
"trimWorst": -2.3,
"hardPulls": 9,
"mixLeanest": 10.5,
"mixTarget": 11,
"boostTarget": 16.3,
"overshoot": 1.9,
"wgAtPeak": 3.2,
"cvtPeak": 79,
"lugShare": 5.69,
"kcUpSteps": 3,
"lugUpSteps": 0,
"lugRpm": 1479,
"accel5070": 1.63,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 418,
"shakedown": "none"
}
}
],
"flashPlan": {
"kind": "undo",
"changeId": "undo",
"family": null,
"headline": "Stop open: flash your previous map file, and tell me which one it is.",
"route": "preset",
"basis": "Data",
"proof": "The next Shakedown drive passes: 10 calm minutes with trims within ±5 %, score near the Baseline, no lean mixture.",
"saveAs": null,
"undoName": "your previous map file — I need you to tell me which one",
"undo": {
"known": false,
"version": null,
"name": null,
"from": null,
"stamp": null,
"label": null,
"headline": "your previous map file — I need you to tell me which one"
},
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": "other",
"evidence": [
{
"drives": [
"20260823-203853"
],
"text": "Drive 20260823-203853 is a Stop (worst trim -21.4 %) on Map version 1 · Starter 21 Dual Tune 2.",
"basis": "Data"
}
],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "locked",
"reason": "Superseded by the open Stop: undo first. Trims off everywhere route to pick the right preset / Undo, never a curve edit.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "locked",
"reason": "Superseded by the open Stop: undo first.",
"unlocks": "Flash the previous map file, then a passing Shakedown drive."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2).",
"unlocks": "—"
}
],
"openIssues": {
"stop": {
"driveId": "20260823-203853",
"start": 1787492333000,
"cause": "trims"
},
"watch": null,
"shakedownPending": false,
"unexplained": [
{
"driveId": "20260823-203853",
"reasons": [
"trim"
]
}
]
},
"stepFail": null,
"ktunerCard": null
},
"hasLlm": false,
"calibration": {
"status": "none",
"driveId": null,
"mapAction": "no-change",
"settled": false
},
"logGuide": {
"title": "The Calibration drive",
"intro": "One drive answers whether more boost can show on your car: it reads whether the boost target reaches your map's table with the pedal floored. It adds no power by itself, and it can come back \"capped\": that is an answer too. About 25 minutes, done once.",
"sections": [
{
"title": "Parked, the evening before",
"steps": [
"Ignition on, engine off (press Start twice without the brake), TunerView's live screen open: press the pedal to the floor and hold it, three times. Read TPS at each hold and type the highest in your car profile as the Pedal full reading.",
"In TunerView's gauge list, check whether it offers AFR Command and MAF Hz, and say so in your car profile's Logger setup.",
"Open TunerView's logging rate menu and type its fastest logging rate in the Logger setup too.",
"If you can, attach a screenshot of KTuner's Quick Adjustments screen here, so I can see the map's settings."
]
},
{
"title": "Before you drive, in TunerView",
"steps": [
"Turn on every gauge in the table below, plus AFR Command and MAF Hz if your app offers them.",
"Set the logging rate as fast as it goes: 10 samples a second or more.",
"Mount the phone where you won't touch it, and start the log before you set off."
]
},
{
"title": "When and where",
"steps": [
"Before 8 am, or after an hour parked in shade, so the intake reads under 42 °C.",
"Pick a straight, empty road where full throttle is legal and safe. Never in traffic."
]
},
{
"title": "Warm up, then cruise",
"steps": [
"Drive about 10 minutes normally, until coolant reads 80 °C or more.",
"Then cruise steady at a few different speeds, light throttle, several minutes in all: your fuel trims are read from this."
]
},
{
"title": "The two pulls",
"steps": [
"Choose slot 2 (Tune 2) when you start the car: while you choose, the tach shows 2,000 rpm for it. Turn ECO off.",
"Put the gearbox in S.",
"From a steady 50 km/h, press the pedal to the floor, all the way, and hold it until 100 km/h: at least 5 seconds, above 3,500 rpm for 4 s or more.",
"Cruise calmly about a minute so the intake cools, check it reads under 48 °C, then do the second pull the same way.",
"No brake launch, and no pull with the CVT fluid at 90 °C or more."
]
},
{
"title": "Finish",
"steps": [
"Keep at least 10 minutes of moving time in the log in all.",
"Idle a minute, stop the log, export it as CSV, and attach it here."
]
}
],
"checkpoints": [
"Logged 10 times a second or faster",
"10 minutes or more of moving",
"Every gauge moving",
"AFR Command and MAF Hz in the log",
"Engine warm (coolant 80 °C or more)",
"Cool intake while moving (under 42 °C)",
"2 full-throttle pulls",
"Pulls started under 48 °C intake",
"2 floored pulls held 4 s or more above 3,500 rpm",
"On slot 2 (Tune 2)"
],
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "STFT B1 + LTFT B1",
"ok": "within ±5 %",
"see": "beyond ±10 %",
"then": "Stop pulling. Drive home calm, upload."
}
]
},
"slot": 2
},
"stage": "car",
"recap": null,
"suggestions": [
{
"label": "Use an example description",
"action": "example",
"icon": "car"
},
{
"label": "What can you do?",
"action": "send",
"icon": "help",
"text": "What can you do?"
}
],
"capabilities": [
{
"id": "read-log",
"status": "can",
"title": "Read your TunerView log",
"says": "Attach a TunerView CSV and I read every row: is the engine OK (OK, Watch, Stop or Can't tell), the health report by system, and whether the log met the drive brief."
},
{
"id": "car-file",
"status": "can",
"title": "Keep your car's file",
"says": "I keep your car: model, fuel, parts with the date fitted, every Map version and Flash, and every Drive, so each answer is read against your car's own history."
},
{
"id": "next-step",
"status": "can",
"title": "Name the one next step",
"says": "After each log I name one thing to do — a change to flash, a gauge to watch, or a drive to log — and the drive that will prove it."
},
{
"id": "maf",
"status": "partly",
"title": "Correct your airflow (MAF Scaling)",
"says": "I can correct MAF Scaling at part throttle from your trims, a few points at a time, when your logs call for it.",
"limit": "Full throttle needs AFR Command in your log, which your logs don't have yet, so I don't correct that end of the curve."
},
{
"id": "boost-down",
"status": "partly",
"title": "Change boost",
"says": "I can lower boost where your logs show overshoot or lugging.",
"limit": "I never raise boost: on this turbo the wastegate has no headroom left."
},
{
"id": "afr",
"status": "partly",
"title": "Judge your AFR (mixture)",
"says": "I judge full-throttle AFR against your map's target and say if it is OK, Watch or Stop.",
"limit": "I don't change the full-throttle AFR target: no gain is shown on this car, and leaning it costs timing."
},
{
"id": "fuel",
"status": "can",
"title": "E10 and RON95 III vs RON97 III",
"says": "Tag each log with its fuel and I compare RON95 III and RON97 III on matched drives by Knock Control, so you see if premium is worth it on your car."
},
{
"id": "tables",
"status": "can",
"title": "Explain any table in your map",
"says": "I can walk your map family by family and show any table in 2D or 3D with your own values, and explain what it does."
},
{
"id": "slots",
"status": "partly",
"title": "KTuner map slots (on-the-fly switching)",
"says": "Tag each log with the map slot it ran on, and I never compare drives from different slots.",
"limit": "I keep one map line for the car, not one per slot, so I can't yet tune a separate RON97 map in its own slot."
},
{
"id": "ignition",
"status": "cannot",
"title": "Add ignition timing or lower knock sensitivity",
"says": "I read and explain the ignition and knock tables, and show how much timing Knock Control pulls.",
"limit": "I never add timing or lower knock sensitivity: a street log can't prove that change is safe, and a wrong one costs an engine."
},
{
"id": "flash",
"status": "cannot",
"title": "Flash the ECU for you",
"says": "I give you the exact cells to type into KTuner and keep each Map version.",
"limit": "You flash in KTuner yourself; I can't connect to the car or the ECU."
},
{
"id": "live",
"status": "cannot",
"title": "Watch the car live",
"says": "I read a log after the drive.",
"limit": "I can't see live data: log in TunerView, then attach the CSV."
},
{
"id": "power",
"status": "cannot",
"title": "Promise power or dyno numbers",
"says": "I can time a 50 to 70 km/h run from your log and compare like with like.",
"limit": "A street log can't give horsepower, and I never promise a gain."
},
{
"id": "other-car",
"status": "partly",
"title": "Cars other than the Civic FE 1.5T",
"says": "My limits and knowledge are built for a Honda 1.5T on KTuner.",
"limit": "On any other car I'm not sure my limits hold: I'd read the log, but treat every verdict as unproven."
}
]
},
{
"carProfile": {
"model": "Civic FE 1.5T",
"engine": "L15 turbo",
"transmission": "CVT",
"fuel": "E10 RON95",
"climate": "hot city traffic",
"basemap": "Starter 21 Dual Tune 2",
"parts": [
"intake",
"downpipe"
],
"eliminate_artificial_kc_rise": false
},
"profileSpec": {
"fields": [
"model",
"engine",
"transmission",
"fuel",
"climate",
"basemap"
],
"parts": [
"intake",
"downpipe",
"front-pipe",
"catback",
"intercooler",
"cvt-cooler"
],
"basemap": "Starter 21 Dual Tune 2",
"basemapNote": "Prefilled from the map the app holds: you never type a table name."
},
"hasDrives": true,
"driveWindow": {
"driveIds": [
"20260822-090322",
"20260822-095021",
"20260823-195901",
"20260823-203853",
"20260830-152931",
"20260830-160151",
"20260901-081358",
"20260905-075634"
],
"count": 8,
"since": null,
"line": "based on your 8 Drives, 22 Aug 09:03 to 05 Sep 07:56"
},
"ktunerBasemap": "Starter 21 Dual Tune 2",
"carHistory": [
{
"id": "20260822-090322",
"start": 1787364202000,
"fileName": "TunerView_20260822_090322.csv",
"duration": 541,
"moving": 482,
"cool": false,
"hot": true,
"hotRestart": true,
"verdict": "watch",
"kcStart": 0.49,
"kcEnd": 0.5,
"kcPeak": 0.52,
"trimWorst": -2.3,
"iatMoving": 49,
"cvtPeak": 79,
"lugShare": 5.69,
"accel5070": {
"seconds": 1.63,
"iat": 56
},
"boostTarget": 16.3,
"hardPulls": 9,
"overshoot": 1.9,
"wgAtPeak": 3.2,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
},
{
"id": "20260822-095021",
"start": 1787367021000,
"fileName": "TunerView_20260822_095021.csv",
"duration": 1049,
"moving": 791,
"cool": false,
"hot": true,
"hotRestart": false,
"verdict": "watch",
"kcStart": 0.49,
"kcEnd": 0.5,
"kcPeak": 0.53,
"trimWorst": -3.9,
"iatMoving": 60,
"cvtPeak": 79,
"lugShare": 10.25,
"accel5070": null,
"boostTarget": 8.7,
"hardPulls": 0,
"overshoot": null,
"wgAtPeak": null,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
},
{
"id": "20260823-195901",
"start": 1787489941000,
"fileName": "TunerView_20260823_195901.csv",
"duration": 1721,
"moving": 1350,
"cool": false,
"hot": true,
"hotRestart": false,
"verdict": "good",
"kcStart": 0.49,
"kcEnd": 0.49,
"kcPeak": 0.5,
"trimWorst": -1.6,
"iatMoving": 49,
"cvtPeak": 68,
"lugShare": 6.82,
"accel5070": null,
"boostTarget": 8.7,
"hardPulls": 0,
"overshoot": null,
"wgAtPeak": null,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
},
{
"id": "20260823-203853",
"start": 1787492333000,
"fileName": "TunerView_20260823_203853.csv",
"duration": 887,
"moving": 617,
"cool": false,
"hot": true,
"hotRestart": true,
"verdict": "stop",
"kcStart": 0.5,
"kcEnd": 0.49,
"kcPeak": 0.5,
"trimWorst": -21.4,
"iatMoving": 45,
"cvtPeak": 85,
"lugShare": 2.45,
"accel5070": null,
"boostTarget": null,
"hardPulls": 0,
"overshoot": null,
"wgAtPeak": null,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
},
{
"id": "20260830-152931",
"start": 1788078571000,
"fileName": "TunerView_20260830_152931.csv",
"duration": 1148,
"moving": 935,
"cool": false,
"hot": true,
"hotRestart": false,
"verdict": "watch",
"kcStart": 0.58,
"kcEnd": 0.49,
"kcPeak": 0.59,
"trimWorst": -2.3,
"iatMoving": 51,
"cvtPeak": 93,
"lugShare": 0.09,
"accel5070": {
"seconds": 1.77,
"iat": 50
},
"boostTarget": 19.2,
"hardPulls": 8,
"overshoot": 1.4,
"wgAtPeak": 2.7,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
},
{
"id": "20260830-160151",
"start": 1788080511000,
"fileName": "TunerView_20260830_160151.csv",
"duration": 3150,
"moving": 2787,
"cool": false,
"hot": true,
"hotRestart": true,
"verdict": "watch",
"kcStart": 0.49,
"kcEnd": 0.64,
"kcPeak": 0.65,
"trimWorst": -2.4,
"iatMoving": 53,
"cvtPeak": 95,
"lugShare": 6.93,
"accel5070": {
"seconds": 2.23,
"iat": 58
},
"boostTarget": 17.2,
"hardPulls": 2,
"overshoot": 1,
"wgAtPeak": 2.7,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
},
{
"id": "20260901-081358",
"start": 1788225238000,
"fileName": "TunerView_20260901_081358.csv",
"duration": 2427,
"moving": 1797,
"cool": true,
"hot": false,
"hotRestart": false,
"verdict": "good",
"kcStart": 0.51,
"kcEnd": 0.49,
"kcPeak": 0.54,
"trimWorst": 1.6,
"iatMoving": 37,
"cvtPeak": 73,
"lugShare": 5.11,
"accel5070": {
"seconds": 1.97,
"iat": 39
},
"boostTarget": 13.7,
"hardPulls": 2,
"overshoot": 0.1,
"wgAtPeak": 2.5,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
},
{
"id": "20260905-075634",
"start": 1788569794000,
"fileName": "TunerView_20260905_075634.csv",
"duration": 2566,
"moving": 2089,
"cool": true,
"hot": false,
"hotRestart": false,
"verdict": "good",
"kcStart": 0.49,
"kcEnd": 0.49,
"kcPeak": 0.5,
"trimWorst": -1.6,
"iatMoving": 39,
"cvtPeak": 79,
"lugShare": 6.61,
"accel5070": null,
"boostTarget": null,
"hardPulls": 0,
"overshoot": null,
"wgAtPeak": null,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
}
],
"baseline": {
"value": 0.49,
"n": 2
},
"flashes": [],
"installs": [],
"mapVersions": [
{
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
}
],
"activeMapVersion": {
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
},
"openSteps": [
{
"id": "channels",
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "wait",
"why": "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0, not what the ECU asked.",
"askedOn": "20260822-090322",
"askedAt": 1787364202000,
"lastAskedOn": null,
"settledBy": "20260905-075634",
"settledAt": 1788569794000,
"word": "Can't tell yet",
"tone": "none"
},
{
"id": "habit",
"key": "habit",
"title": "Habit test: revs up in hot traffic",
"status": "wait",
"why": "Cool Drive (39 °C moving): the habit only shows on a hot afternoon.",
"askedOn": "20260830-160151",
"askedAt": 1788080511000,
"lastAskedOn": "20260901-081358",
"settledBy": "20260905-075634",
"settledAt": 1788569794000,
"word": "Can't tell yet",
"tone": "none"
},
{
"id": "logger",
"key": "logger",
"title": "Fix the logger: dead gauges",
"status": "open",
"why": "Asked on 5 Sep 07:56.",
"askedOn": "20260905-075634",
"askedAt": 1788569794000,
"lastAskedOn": "20260905-075634",
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
],
"answers": {},
"questionAnswers": {},
"unansweredQuestions": [
{
"id": "what-changed:20260823-203853",
"title": "What changed",
"askedOn": "20260823-203853",
"askedOnStamp": "23 Aug 20:38"
},
{
"id": "housing:20260823-203853",
"title": "Which intake housing is fitted",
"askedOn": "20260823-203853",
"askedOnStamp": "23 Aug 20:38"
},
{
"id": "did-flash:20260830-152931",
"title": "Did you flash",
"askedOn": "20260830-152931",
"askedOnStamp": "30 Aug 15:29"
}
],
"drives": [
{
"id": "20260905-075634",
"upload_id": "<id>",
"file_name": "TunerView_20260905_075634.csv",
"started_at": 1788569794000,
"received_at": 0,
"too_short": false,
"verdict": "good",
"summary": {
"id": "20260905-075634",
"start": 1788569794000,
"fileName": "TunerView_20260905_075634.csv",
"durationSec": 2566,
"movingSec": 2089,
"iatMoving": 39,
"cool": true,
"hot": false,
"hotRestart": false,
"kcStart": 0.49,
"kcEnd": 0.49,
"kcPeak": 0.5,
"timingCostDeg": 0.1,
"trimWorst": -1.6,
"hardPulls": 0,
"mixLeanest": null,
"mixTarget": 11,
"boostTarget": null,
"overshoot": null,
"wgAtPeak": null,
"cvtPeak": 79,
"lugShare": 6.61,
"kcUpSteps": 1,
"lugUpSteps": 1,
"lugRpm": 1491,
"accel5070": null,
"flat": [
"fp",
"cvt",
"boost",
"boostTarget"
],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 2044,
"shakedown": "none"
}
},
{
"id": "20260901-081358",
"upload_id": "<id>",
"file_name": "TunerView_20260901_081358.csv",
"started_at": 1788225238000,
"received_at": 0,
"too_short": false,
"verdict": "good",
"summary": {
"id": "20260901-081358",
"start": 1788225238000,
"fileName": "TunerView_20260901_081358.csv",
"durationSec": 2427,
"movingSec": 1797,
"iatMoving": 37,
"cool": true,
"hot": false,
"hotRestart": false,
"kcStart": 0.51,
"kcEnd": 0.49,
"kcPeak": 0.54,
"timingCostDeg": 0.5,
"trimWorst": 1.6,
"hardPulls": 2,
"mixLeanest": 10.8,
"mixTarget": 11,
"boostTarget": 13.7,
"overshoot": 0.1,
"wgAtPeak": 2.5,
"cvtPeak": 73,
"lugShare": 5.11,
"kcUpSteps": 7,
"lugUpSteps": 1,
"lugRpm": 1506,
"accel5070": 1.97,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 1708,
"shakedown": "none"
}
},
{
"id": "20260830-160151",
"upload_id": "<id>",
"file_name": "TunerView_20260830_160151.csv",
"started_at": 1788080511000,
"received_at": 0,
"too_short": false,
"verdict": "watch",
"summary": {
"id": "20260830-160151",
"start": 1788080511000,
"fileName": "TunerView_20260830_160151.csv",
"durationSec": 3150,
"movingSec": 2787,
"iatMoving": 53,
"cool": false,
"hot": true,
"hotRestart": true,
"kcStart": 0.49,
"kcEnd": 0.64,
"kcPeak": 0.65,
"timingCostDeg": 1.6,
"trimWorst": -2.4,
"hardPulls": 2,
"mixLeanest": 10.5,
"mixTarget": 11,
"boostTarget": 17.2,
"overshoot": 1,
"wgAtPeak": 2.7,
"cvtPeak": 95,
"lugShare": 6.93,
"kcUpSteps": 41,
"lugUpSteps": 31,
"lugRpm": 1509,
"accel5070": 2.23,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 2752,
"shakedown": "none"
}
},
{
"id": "20260830-152931",
"upload_id": "<id>",
"file_name": "TunerView_20260830_152931.csv",
"started_at": 1788078571000,
"received_at": 0,
"too_short": false,
"verdict": "watch",
"summary": {
"id": "20260830-152931",
"start": 1788078571000,
"fileName": "TunerView_20260830_152931.csv",
"durationSec": 1148,
"movingSec": 935,
"iatMoving": 51,
"cool": false,
"hot": true,
"hotRestart": false,
"kcStart": 0.58,
"kcEnd": 0.49,
"kcPeak": 0.59,
"timingCostDeg": 1,
"trimWorst": -2.3,
"hardPulls": 8,
"mixLeanest": 10.7,
"mixTarget": 11,
"boostTarget": 19.2,
"overshoot": 1.4,
"wgAtPeak": 2.7,
"cvtPeak": 93,
"lugShare": 0.09,
"kcUpSteps": 7,
"lugUpSteps": 0,
"lugRpm": 1632,
"accel5070": 1.77,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 884,
"shakedown": "none"
}
},
{
"id": "20260830-150925",
"upload_id": "<id>",
"file_name": "TunerView_20260830_150925.csv",
"started_at": null,
"received_at": 0,
"too_short": true,
"verdict": null,
"summary": {}
},
{
"id": "20260823-203853",
"upload_id": "<id>",
"file_name": "TunerView_20260823_203853.csv",
"started_at": 1787492333000,
"received_at": 0,
"too_short": false,
"verdict": "stop",
"summary": {
"id": "20260823-203853",
"start": 1787492333000,
"fileName": "TunerView_20260823_203853.csv",
"durationSec": 887,
"movingSec": 617,
"iatMoving": 45,
"cool": false,
"hot": true,
"hotRestart": true,
"kcStart": 0.5,
"kcEnd": 0.49,
"kcPeak": 0.5,
"timingCostDeg": 0.1,
"trimWorst": -21.4,
"hardPulls": 0,
"mixLeanest": null,
"mixTarget": 11,
"boostTarget": null,
"overshoot": null,
"wgAtPeak": null,
"cvtPeak": 85,
"lugShare": 2.45,
"kcUpSteps": 1,
"lugUpSteps": 0,
"lugRpm": 1543,
"accel5070": null,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 616,
"shakedown": "none"
}
},
{
"id": "20260823-195901",
"upload_id": "<id>",
"file_name": "TunerView_20260823_195901.csv",
"started_at": 1787489941000,
"received_at": 0,
"too_short": false,
"verdict": "good",
"summary": {
"id": "20260823-195901",
"start": 1787489941000,
"fileName": "TunerView_20260823_195901.csv",
"durationSec": 1721,
"movingSec": 1350,
"iatMoving": 49,
"cool": false,
"hot": true,
"hotRestart": false,
"kcStart": 0.49,
"kcEnd": 0.49,
"kcPeak": 0.5,
"timingCostDeg": 0.1,
"trimWorst": -1.6,
"hardPulls": 0,
"mixLeanest": null,
"mixTarget": 11,
"boostTarget": 8.7,
"overshoot": null,
"wgAtPeak": null,
"cvtPeak": 68,
"lugShare": 6.82,
"kcUpSteps": 2,
"lugUpSteps": 0,
"lugRpm": 1481,
"accel5070": null,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 1338,
"shakedown": "none"
}
},
{
"id": "20260822-095021",
"upload_id": "<id>",
"file_name": "TunerView_20260822_095021.csv",
"started_at": 1787367021000,
"received_at": 0,
"too_short": false,
"verdict": "watch",
"summary": {
"id": "20260822-095021",
"start": 1787367021000,
"fileName": "TunerView_20260822_095021.csv",
"durationSec": 1049,
"movingSec": 791,
"iatMoving": 60,
"cool": false,
"hot": true,
"hotRestart": false,
"kcStart": 0.49,
"kcEnd": 0.5,
"kcPeak": 0.53,
"timingCostDeg": 0.4,
"trimWorst": -3.9,
"hardPulls": 0,
"mixLeanest": null,
"mixTarget": 11,
"boostTarget": 8.7,
"overshoot": null,
"wgAtPeak": null,
"cvtPeak": 79,
"lugShare": 10.25,
"kcUpSteps": 5,
"lugUpSteps": 4,
"lugRpm": 1458,
"accel5070": null,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 782,
"shakedown": "none"
}
},
{
"id": "20260822-090322",
"upload_id": "<id>",
"file_name": "TunerView_20260822_090322.csv",
"started_at": 1787364202000,
"received_at": 0,
"too_short": false,
"verdict": "watch",
"summary": {
"id": "20260822-090322",
"start": 1787364202000,
"fileName": "TunerView_20260822_090322.csv",
"durationSec": 541,
"movingSec": 482,
"iatMoving": 49,
"cool": false,
"hot": true,
"hotRestart": true,
"kcStart": 0.49,
"kcEnd": 0.5,
"kcPeak": 0.52,
"timingCostDeg": 0.3,
"trimWorst": -2.3,
"hardPulls": 9,
"mixLeanest": 10.5,
"mixTarget": 11,
"boostTarget": 16.3,
"overshoot": 1.9,
"wgAtPeak": 3.2,
"cvtPeak": 79,
"lugShare": 5.69,
"kcUpSteps": 3,
"lugUpSteps": 0,
"lugRpm": 1479,
"accel5070": 1.63,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 418,
"shakedown": "none"
}
}
],
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median -1.6 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; the latest Cool drive (5 Sep 07:56) was read without a Pedal full reading: say what TPS reads with the pedal floored; the latest hot drive (30 Aug 16:01) reached Knock Control 0.65 judged, over 0.56.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot max 1.4 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": false,
"unexplained": [
{
"driveId": "20260823-203853",
"reasons": [
"trim"
]
},
{
"driveId": "20260901-081358",
"reasons": [
"boost"
]
}
]
},
"stepFail": null
},
"hasLlm": false,
"calibration": {
"driveId": "20260905-075634",
"status": "no-reading",
"text": "was read without a Pedal full reading: say what TPS reads with the pedal floored",
"mapAction": "no-change",
"settled": false
},
"logGuide": {
"title": "The Calibration drive",
"intro": "One drive answers whether more boost can show on your car: it reads whether the boost target reaches your map's table with the pedal floored. It adds no power by itself, and it can come back \"capped\": that is an answer too. About 25 minutes, done once.",
"sections": [
{
"title": "Parked, the evening before",
"steps": [
"Ignition on, engine off (press Start twice without the brake), TunerView's live screen open: press the pedal to the floor and hold it, three times. Read TPS at each hold and type the highest in your car profile as the Pedal full reading.",
"In TunerView's gauge list, check whether it offers AFR Command and MAF Hz, and say so in your car profile's Logger setup.",
"Open TunerView's logging rate menu and type its fastest logging rate in the Logger setup too.",
"If you can, attach a screenshot of KTuner's Quick Adjustments screen here, so I can see the map's settings."
]
},
{
"title": "Before you drive, in TunerView",
"steps": [
"Turn on every gauge in the table below, plus AFR Command and MAF Hz if your app offers them.",
"Set the logging rate as fast as it goes: 10 samples a second or more.",
"Mount the phone where you won't touch it, and start the log before you set off."
]
},
{
"title": "When and where",
"steps": [
"Before 8 am, or after an hour parked in shade, so the intake reads under 42 °C.",
"Pick a straight, empty road where full throttle is legal and safe. Never in traffic."
]
},
{
"title": "Warm up, then cruise",
"steps": [
"Drive about 10 minutes normally, until coolant reads 80 °C or more.",
"Then cruise steady at a few different speeds, light throttle, several minutes in all: your fuel trims are read from this."
]
},
{
"title": "The two pulls",
"steps": [
"Choose slot 2 (Tune 2) when you start the car: while you choose, the tach shows 2,000 rpm for it. Turn ECO off.",
"Put the gearbox in S.",
"From a steady 50 km/h, press the pedal to the floor, all the way, and hold it until 100 km/h: at least 5 seconds, above 3,500 rpm for 4 s or more.",
"Cruise calmly about a minute so the intake cools, check it reads under 48 °C, then do the second pull the same way.",
"No brake launch, and no pull with the CVT fluid at 90 °C or more."
]
},
{
"title": "Finish",
"steps": [
"Keep at least 10 minutes of moving time in the log in all.",
"Idle a minute, stop the log, export it as CSV, and attach it here."
]
}
],
"checkpoints": [
"Logged 10 times a second or faster",
"10 minutes or more of moving",
"Every gauge moving",
"AFR Command and MAF Hz in the log",
"Engine warm (coolant 80 °C or more)",
"Cool intake while moving (under 42 °C)",
"2 full-throttle pulls",
"Pulls started under 48 °C intake",
"2 floored pulls held 4 s or more above 3,500 rpm",
"On slot 2 (Tune 2)"
],
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "STFT B1 + LTFT B1",
"ok": "within ±5 %",
"see": "beyond ±10 %",
"then": "Stop pulling. Drive home calm, upload."
}
]
},
"slot": 2
},
"stage": "read",
"recap": {
"car": "Civic FE 1.5T · CVT · E10 RON95",
"parts": "intake, downpipe",
"map": "Map version 1",
"round": 1,
"stage": "read",
"stageLine": "Your last log is read; the next drive settles what's open.",
"lines": [
{
"label": "Last drive",
"value": "05 Sep 07:56"
},
{
"label": "Drives in your car file",
"value": "8"
},
{
"label": "Waiting on",
"value": "Fix the logger: dead gauges"
},
{
"label": "Questions for you",
"value": "3"
}
]
},
"suggestions": [
{
"label": "Attach my latest log",
"action": "attach",
"icon": "paperclip"
},
{
"label": "Is my knock control OK?",
"action": "send",
"icon": "gauge",
"text": "Is my knock control OK?"
},
{
"label": "Is RON97 worth it?",
"action": "send",
"icon": "help",
"text": "Is RON97 III worth it over RON95 III on my car?"
}
],
"capabilities": [
{
"id": "read-log",
"status": "can",
"title": "Read your TunerView log",
"says": "Attach a TunerView CSV and I read every row: is the engine OK (OK, Watch, Stop or Can't tell), the health report by system, and whether the log met the drive brief."
},
{
"id": "car-file",
"status": "can",
"title": "Keep your car's file",
"says": "I keep your car: model, fuel, parts with the date fitted, every Map version and Flash, and every Drive, so each answer is read against your car's own history."
},
{
"id": "next-step",
"status": "can",
"title": "Name the one next step",
"says": "After each log I name one thing to do — a change to flash, a gauge to watch, or a drive to log — and the drive that will prove it."
},
{
"id": "maf",
"status": "partly",
"title": "Correct your airflow (MAF Scaling)",
"says": "I can correct MAF Scaling at part throttle from your trims, a few points at a time, when your logs call for it.",
"limit": "Full throttle needs AFR Command in your log, which your logs don't have yet, so I don't correct that end of the curve."
},
{
"id": "boost-down",
"status": "partly",
"title": "Change boost",
"says": "I can lower boost where your logs show overshoot or lugging.",
"limit": "I never raise boost: on this turbo the wastegate has no headroom left."
},
{
"id": "afr",
"status": "partly",
"title": "Judge your AFR (mixture)",
"says": "I judge full-throttle AFR against your map's target and say if it is OK, Watch or Stop.",
"limit": "I don't change the full-throttle AFR target: no gain is shown on this car, and leaning it costs timing."
},
{
"id": "fuel",
"status": "can",
"title": "E10 and RON95 III vs RON97 III",
"says": "Tag each log with its fuel and I compare RON95 III and RON97 III on matched drives by Knock Control, so you see if premium is worth it on your car."
},
{
"id": "tables",
"status": "can",
"title": "Explain any table in your map",
"says": "I can walk your map family by family and show any table in 2D or 3D with your own values, and explain what it does."
},
{
"id": "slots",
"status": "partly",
"title": "KTuner map slots (on-the-fly switching)",
"says": "Tag each log with the map slot it ran on, and I never compare drives from different slots.",
"limit": "I keep one map line for the car, not one per slot, so I can't yet tune a separate RON97 map in its own slot."
},
{
"id": "ignition",
"status": "cannot",
"title": "Add ignition timing or lower knock sensitivity",
"says": "I read and explain the ignition and knock tables, and show how much timing Knock Control pulls.",
"limit": "I never add timing or lower knock sensitivity: a street log can't prove that change is safe, and a wrong one costs an engine."
},
{
"id": "flash",
"status": "cannot",
"title": "Flash the ECU for you",
"says": "I give you the exact cells to type into KTuner and keep each Map version.",
"limit": "You flash in KTuner yourself; I can't connect to the car or the ECU."
},
{
"id": "live",
"status": "cannot",
"title": "Watch the car live",
"says": "I read a log after the drive.",
"limit": "I can't see live data: log in TunerView, then attach the CSV."
},
{
"id": "power",
"status": "cannot",
"title": "Promise power or dyno numbers",
"says": "I can time a 50 to 70 km/h run from your log and compare like with like.",
"limit": "A street log can't give horsepower, and I never promise a gain."
},
{
"id": "other-car",
"status": "partly",
"title": "Cars other than the Civic FE 1.5T",
"says": "My limits and knowledge are built for a Honda 1.5T on KTuner.",
"limit": "On any other car I'm not sure my limits hold: I'd read the log, but treat every verdict as unproven."
}
]
},
{
"carProfile": {
"model": "Civic FE 1.5T",
"engine": "L15 turbo",
"transmission": "CVT",
"fuel": "E10 RON95",
"climate": "hot city traffic",
"basemap": "Starter 21 Dual Tune 2",
"parts": [
"intake",
"downpipe"
],
"eliminate_artificial_kc_rise": false
},
"profileSpec": {
"fields": [
"model",
"engine",
"transmission",
"fuel",
"climate",
"basemap"
],
"parts": [
"intake",
"downpipe",
"front-pipe",
"catback",
"intercooler",
"cvt-cooler"
],
"basemap": "Starter 21 Dual Tune 2",
"basemapNote": "Prefilled from the map the app holds: you never type a table name."
},
"hasDrives": false,
"driveWindow": {
"driveIds": [],
"count": 0,
"since": null,
"line": "nothing read yet"
},
"ktunerBasemap": "Starter 21 Dual Tune 2",
"carHistory": [],
"baseline": {
"value": 0.49,
"n": 0
},
"flashes": [],
"installs": [],
"mapVersions": [
{
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
}
],
"activeMapVersion": {
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
},
"openSteps": [],
"answers": {},
"questionAnswers": {},
"unansweredQuestions": [],
"drives": [],
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (no trim data yet).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: no Cool drive yet; no hot drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot never over 2.5 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": false,
"unexplained": []
},
"stepFail": null
},
"hasLlm": false,
"calibration": {
"status": "none",
"driveId": null,
"mapAction": "no-change",
"settled": false
},
"logGuide": {
"title": "The Calibration drive",
"intro": "One drive answers whether more boost can show on your car: it reads whether the boost target reaches your map's table with the pedal floored. It adds no power by itself, and it can come back \"capped\": that is an answer too. About 25 minutes, done once.",
"sections": [
{
"title": "Parked, the evening before",
"steps": [
"Ignition on, engine off (press Start twice without the brake), TunerView's live screen open: press the pedal to the floor and hold it, three times. Read TPS at each hold and type the highest in your car profile as the Pedal full reading.",
"In TunerView's gauge list, check whether it offers AFR Command and MAF Hz, and say so in your car profile's Logger setup.",
"Open TunerView's logging rate menu and type its fastest logging rate in the Logger setup too.",
"If you can, attach a screenshot of KTuner's Quick Adjustments screen here, so I can see the map's settings."
]
},
{
"title": "Before you drive, in TunerView",
"steps": [
"Turn on every gauge in the table below, plus AFR Command and MAF Hz if your app offers them.",
"Set the logging rate as fast as it goes: 10 samples a second or more.",
"Mount the phone where you won't touch it, and start the log before you set off."
]
},
{
"title": "When and where",
"steps": [
"Before 8 am, or after an hour parked in shade, so the intake reads under 42 °C.",
"Pick a straight, empty road where full throttle is legal and safe. Never in traffic."
]
},
{
"title": "Warm up, then cruise",
"steps": [
"Drive about 10 minutes normally, until coolant reads 80 °C or more.",
"Then cruise steady at a few different speeds, light throttle, several minutes in all: your fuel trims are read from this."
]
},
{
"title": "The two pulls",
"steps": [
"Choose slot 2 (Tune 2) when you start the car: while you choose, the tach shows 2,000 rpm for it. Turn ECO off.",
"Put the gearbox in S.",
"From a steady 50 km/h, press the pedal to the floor, all the way, and hold it until 100 km/h: at least 5 seconds, above 3,500 rpm for 4 s or more.",
"Cruise calmly about a minute so the intake cools, check it reads under 48 °C, then do the second pull the same way.",
"No brake launch, and no pull with the CVT fluid at 90 °C or more."
]
},
{
"title": "Finish",
"steps": [
"Keep at least 10 minutes of moving time in the log in all.",
"Idle a minute, stop the log, export it as CSV, and attach it here."
]
}
],
"checkpoints": [
"Logged 10 times a second or faster",
"10 minutes or more of moving",
"Every gauge moving",
"AFR Command and MAF Hz in the log",
"Engine warm (coolant 80 °C or more)",
"Cool intake while moving (under 42 °C)",
"2 full-throttle pulls",
"Pulls started under 48 °C intake",
"2 floored pulls held 4 s or more above 3,500 rpm",
"On slot 2 (Tune 2)"
],
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "STFT B1 + LTFT B1",
"ok": "within ±5 %",
"see": "beyond ±10 %",
"then": "Stop pulling. Drive home calm, upload."
}
]
},
"slot": 2
},
"stage": "baseline",
"recap": {
"car": "Civic FE 1.5T · CVT · E10 RON95",
"parts": "intake, downpipe",
"map": "Map version 1",
"round": 1,
"stage": "baseline",
"stageLine": "We're at the start: I need your first log, driven to the brief.",
"lines": [
{
"label": "Drives in your car file",
"value": "0"
}
]
},
"suggestions": [
{
"label": "How should I log a drive?",
"action": "guide",
"icon": "route"
},
{
"label": "Attach my log",
"action": "attach",
"icon": "paperclip"
},
{
"label": "What can you do?",
"action": "send",
"icon": "help",
"text": "What can you do?"
}
],
"capabilities": [
{
"id": "read-log",
"status": "can",
"title": "Read your TunerView log",
"says": "Attach a TunerView CSV and I read every row: is the engine OK (OK, Watch, Stop or Can't tell), the health report by system, and whether the log met the drive brief."
},
{
"id": "car-file",
"status": "can",
"title": "Keep your car's file",
"says": "I keep your car: model, fuel, parts with the date fitted, every Map version and Flash, and every Drive, so each answer is read against your car's own history."
},
{
"id": "next-step",
"status": "can",
"title": "Name the one next step",
"says": "After each log I name one thing to do — a change to flash, a gauge to watch, or a drive to log — and the drive that will prove it."
},
{
"id": "maf",
"status": "partly",
"title": "Correct your airflow (MAF Scaling)",
"says": "I can correct MAF Scaling at part throttle from your trims, a few points at a time, when your logs call for it.",
"limit": "Full throttle needs AFR Command in your log, which your logs don't have yet, so I don't correct that end of the curve."
},
{
"id": "boost-down",
"status": "partly",
"title": "Change boost",
"says": "I can lower boost where your logs show overshoot or lugging.",
"limit": "I never raise boost: on this turbo the wastegate has no headroom left."
},
{
"id": "afr",
"status": "partly",
"title": "Judge your AFR (mixture)",
"says": "I judge full-throttle AFR against your map's target and say if it is OK, Watch or Stop.",
"limit": "I don't change the full-throttle AFR target: no gain is shown on this car, and leaning it costs timing."
},
{
"id": "fuel",
"status": "can",
"title": "E10 and RON95 III vs RON97 III",
"says": "Tag each log with its fuel and I compare RON95 III and RON97 III on matched drives by Knock Control, so you see if premium is worth it on your car."
},
{
"id": "tables",
"status": "can",
"title": "Explain any table in your map",
"says": "I can walk your map family by family and show any table in 2D or 3D with your own values, and explain what it does."
},
{
"id": "slots",
"status": "partly",
"title": "KTuner map slots (on-the-fly switching)",
"says": "Tag each log with the map slot it ran on, and I never compare drives from different slots.",
"limit": "I keep one map line for the car, not one per slot, so I can't yet tune a separate RON97 map in its own slot."
},
{
"id": "ignition",
"status": "cannot",
"title": "Add ignition timing or lower knock sensitivity",
"says": "I read and explain the ignition and knock tables, and show how much timing Knock Control pulls.",
"limit": "I never add timing or lower knock sensitivity: a street log can't prove that change is safe, and a wrong one costs an engine."
},
{
"id": "flash",
"status": "cannot",
"title": "Flash the ECU for you",
"says": "I give you the exact cells to type into KTuner and keep each Map version.",
"limit": "You flash in KTuner yourself; I can't connect to the car or the ECU."
},
{
"id": "live",
"status": "cannot",
"title": "Watch the car live",
"says": "I read a log after the drive.",
"limit": "I can't see live data: log in TunerView, then attach the CSV."
},
{
"id": "power",
"status": "cannot",
"title": "Promise power or dyno numbers",
"says": "I can time a 50 to 70 km/h run from your log and compare like with like.",
"limit": "A street log can't give horsepower, and I never promise a gain."
},
{
"id": "other-car",
"status": "partly",
"title": "Cars other than the Civic FE 1.5T",
"says": "My limits and knowledge are built for a Honda 1.5T on KTuner.",
"limit": "On any other car I'm not sure my limits hold: I'd read the log, but treat every verdict as unproven."
}
]
},
{
"carProfile": {
"model": "Civic FE 1.5T",
"engine": "L15 turbo",
"transmission": "CVT",
"fuel": "E10 RON95",
"climate": "hot city traffic",
"basemap": "Starter 21 Dual Tune 2",
"parts": [
"intake",
"downpipe"
],
"eliminate_artificial_kc_rise": false
},
"profileSpec": {
"fields": [
"model",
"engine",
"transmission",
"fuel",
"climate",
"basemap"
],
"parts": [
"intake",
"downpipe",
"front-pipe",
"catback",
"intercooler",
"cvt-cooler"
],
"basemap": "Starter 21 Dual Tune 2",
"basemapNote": "Prefilled from the map the app holds: you never type a table name."
},
"hasDrives": true,
"driveWindow": {
"driveIds": [
"20260901-081358"
],
"count": 1,
"since": null,
"line": "based on this Drive only (01 Sep 08:13)"
},
"ktunerBasemap": "Starter 21 Dual Tune 2",
"carHistory": [
{
"id": "20260901-081358",
"start": 1788225238000,
"fileName": "TunerView_20260901_081358.csv",
"duration": 2427,
"moving": 1797,
"cool": true,
"hot": false,
"hotRestart": false,
"verdict": "good",
"kcStart": 0.51,
"kcEnd": 0.49,
"kcPeak": 0.54,
"trimWorst": 1.6,
"iatMoving": 37,
"cvtPeak": 73,
"lugShare": 5.11,
"accel5070": {
"seconds": 1.97,
"iat": 39
},
"boostTarget": 13.7,
"hardPulls": 2,
"overshoot": 0.1,
"wgAtPeak": 2.5,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
}
],
"baseline": {
"value": 0.49,
"n": 1
},
"flashes": [],
"installs": [],
"mapVersions": [
{
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
}
],
"activeMapVersion": {
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
},
"openSteps": [
{
"id": "channels",
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "open",
"why": "Asked on 1 Sep 08:13.",
"askedOn": "20260901-081358",
"askedAt": 1788225238000,
"lastAskedOn": null,
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
],
"answers": {},
"questionAnswers": {},
"unansweredQuestions": [],
"drives": [
{
"id": "20260901-081358",
"upload_id": "<id>",
"file_name": "TunerView_20260901_081358.csv",
"started_at": 1788225238000,
"received_at": 0,
"too_short": false,
"verdict": "good",
"summary": {
"id": "20260901-081358",
"start": 1788225238000,
"fileName": "TunerView_20260901_081358.csv",
"durationSec": 2427,
"movingSec": 1797,
"iatMoving": 37,
"cool": true,
"hot": false,
"hotRestart": false,
"kcStart": 0.51,
"kcEnd": 0.49,
"kcPeak": 0.54,
"timingCostDeg": 0.5,
"trimWorst": 1.6,
"hardPulls": 2,
"mixLeanest": 10.8,
"mixTarget": 11,
"boostTarget": 13.7,
"overshoot": 0.1,
"wgAtPeak": 2.5,
"cvtPeak": 73,
"lugShare": 5.11,
"kcUpSteps": 7,
"lugUpSteps": 1,
"lugRpm": 1506,
"accel5070": 1.97,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 1708,
"shakedown": "none"
}
}
],
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median 1.6 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; the latest Cool drive (1 Sep 08:13) was read without a Pedal full reading: say what TPS reads with the pedal floored; no hot drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi where overshoot held",
"status": "not-needed",
"reason": "Not needed: overshoot max 0.1 psi.",
"unlocks": "Overshoot above 2.5 psi held on pulls."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": false,
"unexplained": []
},
"stepFail": null
},
"hasLlm": false,
"calibration": {
"driveId": "20260901-081358",
"status": "no-reading",
"text": "was read without a Pedal full reading: say what TPS reads with the pedal floored",
"mapAction": "no-change",
"settled": false
},
"logGuide": {
"title": "The Calibration drive",
"intro": "One drive answers whether more boost can show on your car: it reads whether the boost target reaches your map's table with the pedal floored. It adds no power by itself, and it can come back \"capped\": that is an answer too. About 25 minutes, done once.",
"sections": [
{
"title": "Parked, the evening before",
"steps": [
"Ignition on, engine off (press Start twice without the brake), TunerView's live screen open: press the pedal to the floor and hold it, three times. Read TPS at each hold and type the highest in your car profile as the Pedal full reading.",
"In TunerView's gauge list, check whether it offers AFR Command and MAF Hz, and say so in your car profile's Logger setup.",
"Open TunerView's logging rate menu and type its fastest logging rate in the Logger setup too.",
"If you can, attach a screenshot of KTuner's Quick Adjustments screen here, so I can see the map's settings."
]
},
{
"title": "Before you drive, in TunerView",
"steps": [
"Turn on every gauge in the table below, plus AFR Command and MAF Hz if your app offers them.",
"Set the logging rate as fast as it goes: 10 samples a second or more.",
"Mount the phone where you won't touch it, and start the log before you set off."
]
},
{
"title": "When and where",
"steps": [
"Before 8 am, or after an hour parked in shade, so the intake reads under 42 °C.",
"Pick a straight, empty road where full throttle is legal and safe. Never in traffic."
]
},
{
"title": "Warm up, then cruise",
"steps": [
"Drive about 10 minutes normally, until coolant reads 80 °C or more.",
"Then cruise steady at a few different speeds, light throttle, several minutes in all: your fuel trims are read from this."
]
},
{
"title": "The two pulls",
"steps": [
"Choose slot 2 (Tune 2) when you start the car: while you choose, the tach shows 2,000 rpm for it. Turn ECO off.",
"Put the gearbox in S.",
"From a steady 50 km/h, press the pedal to the floor, all the way, and hold it until 100 km/h: at least 5 seconds, above 3,500 rpm for 4 s or more.",
"Cruise calmly about a minute so the intake cools, check it reads under 48 °C, then do the second pull the same way.",
"No brake launch, and no pull with the CVT fluid at 90 °C or more."
]
},
{
"title": "Finish",
"steps": [
"Keep at least 10 minutes of moving time in the log in all.",
"Idle a minute, stop the log, export it as CSV, and attach it here."
]
}
],
"checkpoints": [
"Logged 10 times a second or faster",
"10 minutes or more of moving",
"Every gauge moving",
"AFR Command and MAF Hz in the log",
"Engine warm (coolant 80 °C or more)",
"Cool intake while moving (under 42 °C)",
"2 full-throttle pulls",
"Pulls started under 48 °C intake",
"2 floored pulls held 4 s or more above 3,500 rpm",
"On slot 2 (Tune 2)"
],
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "STFT B1 + LTFT B1",
"ok": "within ±5 %",
"see": "beyond ±10 %",
"then": "Stop pulling. Drive home calm, upload."
}
]
},
"slot": 2
},
"stage": "calibrate",
"recap": {
"car": "Civic FE 1.5T · CVT · E10 RON95",
"parts": "intake, downpipe",
"map": "Map version 1",
"round": 1,
"stage": "calibrate",
"stageLine": "One drive answers whether more boost can show on your car.",
"lines": [
{
"label": "Last drive",
"value": "01 Sep 08:13"
},
{
"label": "Drives in your car file",
"value": "1"
},
{
"label": "Next drive",
"value": "The Calibration drive"
},
{
"label": "Waiting on",
"value": "Log AFR Command and MAF Hz"
}
]
},
"suggestions": [
{
"label": "How do I drive the Calibration drive?",
"action": "guide",
"icon": "route"
},
{
"label": "Attach my log",
"action": "attach",
"icon": "paperclip"
},
{
"label": "Why not more boost?",
"action": "send",
"icon": "help",
"text": "Why won't you raise my boost?"
}
],
"capabilities": [
{
"id": "read-log",
"status": "can",
"title": "Read your TunerView log",
"says": "Attach a TunerView CSV and I read every row: is the engine OK (OK, Watch, Stop or Can't tell), the health report by system, and whether the log met the drive brief."
},
{
"id": "car-file",
"status": "can",
"title": "Keep your car's file",
"says": "I keep your car: model, fuel, parts with the date fitted, every Map version and Flash, and every Drive, so each answer is read against your car's own history."
},
{
"id": "next-step",
"status": "can",
"title": "Name the one next step",
"says": "After each log I name one thing to do — a change to flash, a gauge to watch, or a drive to log — and the drive that will prove it."
},
{
"id": "maf",
"status": "partly",
"title": "Correct your airflow (MAF Scaling)",
"says": "I can correct MAF Scaling at part throttle from your trims, a few points at a time, when your logs call for it.",
"limit": "Full throttle needs AFR Command in your log, which your logs don't have yet, so I don't correct that end of the curve."
},
{
"id": "boost-down",
"status": "partly",
"title": "Change boost",
"says": "I can lower boost where your logs show overshoot or lugging.",
"limit": "I never raise boost: on this turbo the wastegate has no headroom left."
},
{
"id": "afr",
"status": "partly",
"title": "Judge your AFR (mixture)",
"says": "I judge full-throttle AFR against your map's target and say if it is OK, Watch or Stop.",
"limit": "I don't change the full-throttle AFR target: no gain is shown on this car, and leaning it costs timing."
},
{
"id": "fuel",
"status": "can",
"title": "E10 and RON95 III vs RON97 III",
"says": "Tag each log with its fuel and I compare RON95 III and RON97 III on matched drives by Knock Control, so you see if premium is worth it on your car."
},
{
"id": "tables",
"status": "can",
"title": "Explain any table in your map",
"says": "I can walk your map family by family and show any table in 2D or 3D with your own values, and explain what it does."
},
{
"id": "slots",
"status": "partly",
"title": "KTuner map slots (on-the-fly switching)",
"says": "Tag each log with the map slot it ran on, and I never compare drives from different slots.",
"limit": "I keep one map line for the car, not one per slot, so I can't yet tune a separate RON97 map in its own slot."
},
{
"id": "ignition",
"status": "cannot",
"title": "Add ignition timing or lower knock sensitivity",
"says": "I read and explain the ignition and knock tables, and show how much timing Knock Control pulls.",
"limit": "I never add timing or lower knock sensitivity: a street log can't prove that change is safe, and a wrong one costs an engine."
},
{
"id": "flash",
"status": "cannot",
"title": "Flash the ECU for you",
"says": "I give you the exact cells to type into KTuner and keep each Map version.",
"limit": "You flash in KTuner yourself; I can't connect to the car or the ECU."
},
{
"id": "live",
"status": "cannot",
"title": "Watch the car live",
"says": "I read a log after the drive.",
"limit": "I can't see live data: log in TunerView, then attach the CSV."
},
{
"id": "power",
"status": "cannot",
"title": "Promise power or dyno numbers",
"says": "I can time a 50 to 70 km/h run from your log and compare like with like.",
"limit": "A street log can't give horsepower, and I never promise a gain."
},
{
"id": "other-car",
"status": "partly",
"title": "Cars other than the Civic FE 1.5T",
"says": "My limits and knowledge are built for a Honda 1.5T on KTuner.",
"limit": "On any other car I'm not sure my limits hold: I'd read the log, but treat every verdict as unproven."
}
]
},
{
"carProfile": {
"model": "Civic FE 1.5T",
"engine": "L15 turbo",
"transmission": "CVT",
"fuel": "E10 RON95",
"climate": "hot city traffic",
"basemap": "Starter 21 Dual Tune 2",
"parts": [
"intake",
"downpipe"
],
"eliminate_artificial_kc_rise": false
},
"profileSpec": {
"fields": [
"model",
"engine",
"transmission",
"fuel",
"climate",
"basemap"
],
"parts": [
"intake",
"downpipe",
"front-pipe",
"catback",
"intercooler",
"cvt-cooler"
],
"basemap": "Starter 21 Dual Tune 2",
"basemapNote": "Prefilled from the map the app holds: you never type a table name."
},
"hasDrives": true,
"driveWindow": {
"driveIds": [
"20260901-081358"
],
"count": 1,
"since": null,
"line": "based on this Drive only (01 Sep 08:13)"
},
"ktunerBasemap": "Starter 21 Dual Tune 2",
"carHistory": [
{
"id": "20260901-081358",
"start": 1788225238000,
"fileName": "TunerView_20260901_081358.csv",
"duration": 2427,
"moving": 1797,
"cool": true,
"hot": false,
"hotRestart": false,
"verdict": "good",
"kcStart": 0.51,
"kcEnd": 0.49,
"kcPeak": 0.54,
"trimWorst": 1.6,
"iatMoving": 37,
"cvtPeak": 73,
"lugShare": 5.11,
"accel5070": {
"seconds": 1.97,
"iat": 39
},
"boostTarget": 13.7,
"hardPulls": 2,
"overshoot": 3.4,
"wgAtPeak": 2.5,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
}
],
"baseline": {
"value": 0.49,
"n": 1
},
"flashes": [],
"installs": [],
"mapVersions": [
{
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
}
],
"activeMapVersion": {
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
},
"openSteps": [
{
"id": "channels",
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "open",
"why": "Asked on 1 Sep 08:13.",
"askedOn": "20260901-081358",
"askedAt": 1788225238000,
"lastAskedOn": null,
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
],
"answers": {},
"questionAnswers": {},
"unansweredQuestions": [],
"drives": [
{
"id": "20260901-081358",
"upload_id": "<id>",
"file_name": "TunerView_20260901_081358.csv",
"started_at": 1788225238000,
"received_at": 0,
"too_short": false,
"verdict": "good",
"summary": {
"id": "20260901-081358",
"start": 1788225238000,
"fileName": "TunerView_20260901_081358.csv",
"durationSec": 2427,
"movingSec": 1797,
"iatMoving": 37,
"cool": true,
"hot": false,
"hotRestart": false,
"kcStart": 0.51,
"kcEnd": 0.49,
"kcPeak": 0.54,
"timingCostDeg": 0.5,
"trimWorst": 1.6,
"hardPulls": 2,
"mixLeanest": 10.8,
"mixTarget": 11,
"boostTarget": 13.7,
"overshoot": 0.1,
"wgAtPeak": 2.5,
"cvtPeak": 73,
"lugShare": 5.11,
"kcUpSteps": 7,
"lugUpSteps": 1,
"lugRpm": 1506,
"accel5070": 1.97,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 1708,
"shakedown": "none"
}
}
],
"flashPlan": {
"kind": "one-family",
"changeId": "downpipe",
"family": "boost",
"headline": "Boost targets: −1 psi at 3,500–4,000 rpm, because overshoot held 3.4 psi there.",
"route": null,
"basis": "Data",
"proof": "A Cool drive with 2 hard pulls: overshoot at or under +2.5 psi, full-load mixture at or richer than target and never leaner than 12.0, trims within ±5 %.",
"saveAs": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"undoName": "Flash your previous map file (Map version 1 · Starter 21 Dual Tune 2)",
"undo": {
"known": true,
"version": 1,
"name": "Starter 21 Dual Tune 2",
"from": null,
"stamp": null,
"label": "Map version 1 · Starter 21 Dual Tune 2",
"headline": "Flash your previous map file (Map version 1 · Starter 21 Dual Tune 2)"
},
"mapVersion": {
"n": 1,
"name": "Starter 21 Dual Tune 2",
"label": "Map version 1",
"kind": "ktuner-basemap",
"tablesFrom": "ktuner-basemap",
"tablesPending": false,
"from": null,
"flashId": null,
"changed": null,
"note": "",
"updatedAt": null
},
"ceilingPsi": 23.4,
"tables": [
{
"id": "Boost_Target_1_Normal_L",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_1_Normal_H",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_2_Normal_L",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_2_Normal_H",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_3_Normal_L",
"kind": "map",
"cellCount": 28,
"pasteRow": null
},
{
"id": "Boost_Target_3_Normal_H",
"kind": "map",
"cellCount": 28,
"pasteRow": null
}
],
"cellCount": 168,
"cells": [
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_1_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_2_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_L",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 3500,
"rpmRow": 12,
"col": 16,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 3,
"of": 16,
"before": 13.5,
"after": 12.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 4,
"of": 16,
"before": 15.5,
"after": 14.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 5,
"of": 16,
"before": 17.5,
"after": 16.5
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 6,
"of": 16,
"before": 19,
"after": 18
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 7,
"of": 16,
"before": 20,
"after": 19
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 8,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 9,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 10,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 11,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 12,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 13,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 14,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 15,
"of": 16,
"before": 21,
"after": 20
},
{
"table": "Boost_Target_3_Normal_H",
"rpm": 4000,
"rpmRow": 13,
"col": 16,
"of": 16,
"before": 21,
"after": 20
}
],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": "boost",
"evidence": [
{
"drives": [
"20260901-081358"
],
"text": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"basis": "Data"
}
],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median 1.6 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; the B2 overshoot trim comes first; the latest Cool drive (1 Sep 08:13) was read without a Pedal full reading: say what TPS reads with the pedal floored; no hot drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi at 3,500–4,000 rpm",
"status": "planned",
"reason": "In the plan below.",
"unlocks": "Two hard pulls on a Cool drive prove it."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": false,
"unexplained": []
},
"stepFail": null,
"ktunerCard": {
"kind": "change",
"changeId": "4c39875b4d",
"family": "boost",
"headline": "Boost targets: −1 psi at 3,500–4,000 rpm, because overshoot held 3.4 psi there.",
"because": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"writtenOn": "Written on Map version 1 · Starter 21 Dual Tune 2",
"groups": [
{
"tables": [
"Boost Target 1 Normal L",
"Boost Target 1 Normal H",
"Boost Target 2 Normal L",
"Boost Target 2 Normal H",
"Boost Target 3 Normal L",
"Boost Target 3 Normal H"
],
"tableIds": [
"Boost_Target_1_Normal_L",
"Boost_Target_1_Normal_H",
"Boost_Target_2_Normal_L",
"Boost_Target_2_Normal_H",
"Boost_Target_3_Normal_L",
"Boost_Target_3_Normal_H"
],
"unit": "psi",
"what": "The boost the ECU aims for in Normal and Sport, psi gauge, by rpm (rows) and load (columns).",
"effect": "Lowers the boost the ECU aims for by 1.0 psi in 28 cells, 3,500-4,000 rpm.",
"same": true,
"pasteRow": null,
"cells": [
{
"id": "0-12-2",
"rpm": 3500,
"row": "3,500 rpm",
"col": 3,
"of": 16,
"column": "3 of 16",
"before": "13.5",
"after": "12.5",
"unit": "psi"
},
{
"id": "0-12-3",
"rpm": 3500,
"row": "3,500 rpm",
"col": 4,
"of": 16,
"column": "4 of 16",
"before": "15.5",
"after": "14.5",
"unit": "psi"
},
{
"id": "0-12-4",
"rpm": 3500,
"row": "3,500 rpm",
"col": 5,
"of": 16,
"column": "5 of 16",
"before": "17.5",
"after": "16.5",
"unit": "psi"
},
{
"id": "0-12-5",
"rpm": 3500,
"row": "3,500 rpm",
"col": 6,
"of": 16,
"column": "6 of 16",
"before": "19.0",
"after": "18.0",
"unit": "psi"
},
{
"id": "0-12-6",
"rpm": 3500,
"row": "3,500 rpm",
"col": 7,
"of": 16,
"column": "7 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-12-7",
"rpm": 3500,
"row": "3,500 rpm",
"col": 8,
"of": 16,
"column": "8 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-12-8",
"rpm": 3500,
"row": "3,500 rpm",
"col": 9,
"of": 16,
"column": "9 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-12-9",
"rpm": 3500,
"row": "3,500 rpm",
"col": 10,
"of": 16,
"column": "10 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-12-10",
"rpm": 3500,
"row": "3,500 rpm",
"col": 11,
"of": 16,
"column": "11 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-12-11",
"rpm": 3500,
"row": "3,500 rpm",
"col": 12,
"of": 16,
"column": "12 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-12-12",
"rpm": 3500,
"row": "3,500 rpm",
"col": 13,
"of": 16,
"column": "13 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-12-13",
"rpm": 3500,
"row": "3,500 rpm",
"col": 14,
"of": 16,
"column": "14 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-12-14",
"rpm": 3500,
"row": "3,500 rpm",
"col": 15,
"of": 16,
"column": "15 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-12-15",
"rpm": 3500,
"row": "3,500 rpm",
"col": 16,
"of": 16,
"column": "16 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-13-2",
"rpm": 4000,
"row": "4,000 rpm",
"col": 3,
"of": 16,
"column": "3 of 16",
"before": "13.5",
"after": "12.5",
"unit": "psi"
},
{
"id": "0-13-3",
"rpm": 4000,
"row": "4,000 rpm",
"col": 4,
"of": 16,
"column": "4 of 16",
"before": "15.5",
"after": "14.5",
"unit": "psi"
},
{
"id": "0-13-4",
"rpm": 4000,
"row": "4,000 rpm",
"col": 5,
"of": 16,
"column": "5 of 16",
"before": "17.5",
"after": "16.5",
"unit": "psi"
},
{
"id": "0-13-5",
"rpm": 4000,
"row": "4,000 rpm",
"col": 6,
"of": 16,
"column": "6 of 16",
"before": "19.0",
"after": "18.0",
"unit": "psi"
},
{
"id": "0-13-6",
"rpm": 4000,
"row": "4,000 rpm",
"col": 7,
"of": 16,
"column": "7 of 16",
"before": "20.0",
"after": "19.0",
"unit": "psi"
},
{
"id": "0-13-7",
"rpm": 4000,
"row": "4,000 rpm",
"col": 8,
"of": 16,
"column": "8 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-13-8",
"rpm": 4000,
"row": "4,000 rpm",
"col": 9,
"of": 16,
"column": "9 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-13-9",
"rpm": 4000,
"row": "4,000 rpm",
"col": 10,
"of": 16,
"column": "10 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-13-10",
"rpm": 4000,
"row": "4,000 rpm",
"col": 11,
"of": 16,
"column": "11 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-13-11",
"rpm": 4000,
"row": "4,000 rpm",
"col": 12,
"of": 16,
"column": "12 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-13-12",
"rpm": 4000,
"row": "4,000 rpm",
"col": 13,
"of": 16,
"column": "13 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-13-13",
"rpm": 4000,
"row": "4,000 rpm",
"col": 14,
"of": 16,
"column": "14 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-13-14",
"rpm": 4000,
"row": "4,000 rpm",
"col": 15,
"of": 16,
"column": "15 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
},
{
"id": "0-13-15",
"rpm": 4000,
"row": "4,000 rpm",
"col": 16,
"of": 16,
"column": "16 of 16",
"before": "21.0",
"after": "20.0",
"unit": "psi"
}
]
}
],
"cellCount": 28,
"tableCount": 6,
"saveAs": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"undo": {
"known": true,
"version": 1,
"line": "Flash your previous map file (Map version 1 · Starter 21 Dual Tune 2)"
},
"proof": "A Cool drive with 2 hard pulls: overshoot at or under +2.5 psi, full-load mixture at or richer than target and never leaner than 12.0, trims within ±5 %.",
"afterFlash": "Then drive a Shakedown drive: 10 calm minutes, no hard driving.",
"readback": {
"possible": true,
"line": "Readback is possible: your first Drive after the Flash checks the logged Turbo Pressure Target in these cells."
},
"checked": "Checked twice, and both checks agree: the engine's rules and a separate check against Map version 1."
}
},
"hasLlm": false,
"calibration": {
"driveId": "20260901-081358",
"status": "no-reading",
"text": "was read without a Pedal full reading: say what TPS reads with the pedal floored",
"mapAction": "no-change",
"settled": false
},
"logGuide": {
"title": "The Calibration drive",
"intro": "One drive answers whether more boost can show on your car: it reads whether the boost target reaches your map's table with the pedal floored. It adds no power by itself, and it can come back \"capped\": that is an answer too. About 25 minutes, done once.",
"sections": [
{
"title": "Parked, the evening before",
"steps": [
"Ignition on, engine off (press Start twice without the brake), TunerView's live screen open: press the pedal to the floor and hold it, three times. Read TPS at each hold and type the highest in your car profile as the Pedal full reading.",
"In TunerView's gauge list, check whether it offers AFR Command and MAF Hz, and say so in your car profile's Logger setup.",
"Open TunerView's logging rate menu and type its fastest logging rate in the Logger setup too.",
"If you can, attach a screenshot of KTuner's Quick Adjustments screen here, so I can see the map's settings."
]
},
{
"title": "Before you drive, in TunerView",
"steps": [
"Turn on every gauge in the table below, plus AFR Command and MAF Hz if your app offers them.",
"Set the logging rate as fast as it goes: 10 samples a second or more.",
"Mount the phone where you won't touch it, and start the log before you set off."
]
},
{
"title": "When and where",
"steps": [
"Before 8 am, or after an hour parked in shade, so the intake reads under 42 °C.",
"Pick a straight, empty road where full throttle is legal and safe. Never in traffic."
]
},
{
"title": "Warm up, then cruise",
"steps": [
"Drive about 10 minutes normally, until coolant reads 80 °C or more.",
"Then cruise steady at a few different speeds, light throttle, several minutes in all: your fuel trims are read from this."
]
},
{
"title": "The two pulls",
"steps": [
"Choose slot 2 (Tune 2) when you start the car: while you choose, the tach shows 2,000 rpm for it. Turn ECO off.",
"Put the gearbox in S.",
"From a steady 50 km/h, press the pedal to the floor, all the way, and hold it until 100 km/h: at least 5 seconds, above 3,500 rpm for 4 s or more.",
"Cruise calmly about a minute so the intake cools, check it reads under 48 °C, then do the second pull the same way.",
"No brake launch, and no pull with the CVT fluid at 90 °C or more."
]
},
{
"title": "Finish",
"steps": [
"Keep at least 10 minutes of moving time in the log in all.",
"Idle a minute, stop the log, export it as CSV, and attach it here."
]
}
],
"checkpoints": [
"Logged 10 times a second or faster",
"10 minutes or more of moving",
"Every gauge moving",
"AFR Command and MAF Hz in the log",
"Engine warm (coolant 80 °C or more)",
"Cool intake while moving (under 42 °C)",
"2 full-throttle pulls",
"Pulls started under 48 °C intake",
"2 floored pulls held 4 s or more above 3,500 rpm",
"On slot 2 (Tune 2)"
],
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "STFT B1 + LTFT B1",
"ok": "within ±5 %",
"see": "beyond ±10 %",
"then": "Stop pulling. Drive home calm, upload."
}
]
},
"slot": 2
},
"stage": "plan",
"recap": {
"car": "Civic FE 1.5T · CVT · E10 RON95",
"parts": "intake, downpipe",
"map": "Map version 1",
"round": 1,
"stage": "plan",
"stageLine": "A map change is ready for you to flash.",
"lines": [
{
"label": "Last drive",
"value": "01 Sep 08:13"
},
{
"label": "Drives in your car file",
"value": "1"
},
{
"label": "Waiting on",
"value": "Log AFR Command and MAF Hz"
}
]
},
"suggestions": [
{
"label": "Show my map change",
"action": "send",
"icon": "wrench",
"text": "Show me the change you planned and why."
},
{
"label": "What if I don't flash it?",
"action": "send",
"icon": "help",
"text": "What happens if I don't flash the planned change?"
},
{
"label": "Attach my latest log",
"action": "attach",
"icon": "paperclip"
}
],
"capabilities": [
{
"id": "read-log",
"status": "can",
"title": "Read your TunerView log",
"says": "Attach a TunerView CSV and I read every row: is the engine OK (OK, Watch, Stop or Can't tell), the health report by system, and whether the log met the drive brief."
},
{
"id": "car-file",
"status": "can",
"title": "Keep your car's file",
"says": "I keep your car: model, fuel, parts with the date fitted, every Map version and Flash, and every Drive, so each answer is read against your car's own history."
},
{
"id": "next-step",
"status": "can",
"title": "Name the one next step",
"says": "After each log I name one thing to do — a change to flash, a gauge to watch, or a drive to log — and the drive that will prove it."
},
{
"id": "maf",
"status": "partly",
"title": "Correct your airflow (MAF Scaling)",
"says": "I can correct MAF Scaling at part throttle from your trims, a few points at a time, when your logs call for it.",
"limit": "Full throttle needs AFR Command in your log, which your logs don't have yet, so I don't correct that end of the curve."
},
{
"id": "boost-down",
"status": "partly",
"title": "Change boost",
"says": "I can lower boost where your logs show overshoot or lugging.",
"limit": "I never raise boost: on this turbo the wastegate has no headroom left."
},
{
"id": "afr",
"status": "partly",
"title": "Judge your AFR (mixture)",
"says": "I judge full-throttle AFR against your map's target and say if it is OK, Watch or Stop.",
"limit": "I don't change the full-throttle AFR target: no gain is shown on this car, and leaning it costs timing."
},
{
"id": "fuel",
"status": "can",
"title": "E10 and RON95 III vs RON97 III",
"says": "Tag each log with its fuel and I compare RON95 III and RON97 III on matched drives by Knock Control, so you see if premium is worth it on your car."
},
{
"id": "tables",
"status": "can",
"title": "Explain any table in your map",
"says": "I can walk your map family by family and show any table in 2D or 3D with your own values, and explain what it does."
},
{
"id": "slots",
"status": "partly",
"title": "KTuner map slots (on-the-fly switching)",
"says": "Tag each log with the map slot it ran on, and I never compare drives from different slots.",
"limit": "I keep one map line for the car, not one per slot, so I can't yet tune a separate RON97 map in its own slot."
},
{
"id": "ignition",
"status": "cannot",
"title": "Add ignition timing or lower knock sensitivity",
"says": "I read and explain the ignition and knock tables, and show how much timing Knock Control pulls.",
"limit": "I never add timing or lower knock sensitivity: a street log can't prove that change is safe, and a wrong one costs an engine."
},
{
"id": "flash",
"status": "cannot",
"title": "Flash the ECU for you",
"says": "I give you the exact cells to type into KTuner and keep each Map version.",
"limit": "You flash in KTuner yourself; I can't connect to the car or the ECU."
},
{
"id": "live",
"status": "cannot",
"title": "Watch the car live",
"says": "I read a log after the drive.",
"limit": "I can't see live data: log in TunerView, then attach the CSV."
},
{
"id": "power",
"status": "cannot",
"title": "Promise power or dyno numbers",
"says": "I can time a 50 to 70 km/h run from your log and compare like with like.",
"limit": "A street log can't give horsepower, and I never promise a gain."
},
{
"id": "other-car",
"status": "partly",
"title": "Cars other than the Civic FE 1.5T",
"says": "My limits and knowledge are built for a Honda 1.5T on KTuner.",
"limit": "On any other car I'm not sure my limits hold: I'd read the log, but treat every verdict as unproven."
}
]
},
{
"carProfile": {
"model": "Civic FE 1.5T",
"engine": "L15 turbo",
"transmission": "CVT",
"fuel": "E10 RON95",
"climate": "hot city traffic",
"basemap": "Starter 21 Dual Tune 2",
"parts": [
"intake",
"downpipe"
],
"eliminate_artificial_kc_rise": false
},
"profileSpec": {
"fields": [
"model",
"engine",
"transmission",
"fuel",
"climate",
"basemap"
],
"parts": [
"intake",
"downpipe",
"front-pipe",
"catback",
"intercooler",
"cvt-cooler"
],
"basemap": "Starter 21 Dual Tune 2",
"basemapNote": "Prefilled from the map the app holds: you never type a table name."
},
"hasDrives": true,
"driveWindow": {
"driveIds": [
"20260901-081358"
],
"count": 1,
"since": {
"kind": "flash",
"label": "the Flash",
"day": "1 Sep"
},
"line": "based on your 1 Drive since the Flash on 1 Sep"
},
"ktunerBasemap": "Starter 21 Dual Tune 2",
"carHistory": [
{
"id": "20260901-081358",
"start": 1788225238000,
"fileName": "TunerView_20260901_081358.csv",
"duration": 2427,
"moving": 1797,
"cool": true,
"hot": false,
"hotRestart": false,
"verdict": "good",
"kcStart": 0.51,
"kcEnd": 0.49,
"kcPeak": 0.54,
"trimWorst": 1.6,
"iatMoving": 37,
"cvtPeak": 73,
"lugShare": 5.11,
"accel5070": {
"seconds": 1.97,
"iat": 39
},
"boostTarget": 13.7,
"hardPulls": 2,
"overshoot": 3.4,
"wgAtPeak": 2.5,
"map": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"mapVersion": 2,
"shakedown": "none",
"answered": null
}
],
"baseline": {
"value": 0.49,
"n": 1
},
"flashes": [
{
"id": "fmf0zmwao-starter-21-dual-",
"flashed_at": 1756723200000,
"map": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"changed": "boost",
"note": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"restores": null
}
],
"installs": [],
"mapVersions": [
{
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
},
{
"id": 2,
"n": 2,
"label": "Map version 2",
"name": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"kind": "flash",
"source": "flash",
"parent_id": 1,
"flash_id": "fmf0zmwao-starter-21-dual-",
"changed": "boost",
"note": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"flashed_at": 1756723200000,
"created_at": 0,
"updated_at": 0,
"has_tables": true
}
],
"activeMapVersion": {
"id": 2,
"n": 2,
"label": "Map version 2",
"name": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"kind": "flash",
"source": "flash",
"parent_id": 1,
"flash_id": "fmf0zmwao-starter-21-dual-",
"changed": "boost",
"note": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"flashed_at": 1756723200000,
"created_at": 0,
"updated_at": 0,
"has_tables": true
},
"openSteps": [
{
"id": "channels",
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "open",
"why": "Asked on 1 Sep 08:13.",
"askedOn": "20260901-081358",
"askedAt": 1788225238000,
"lastAskedOn": null,
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
],
"answers": {},
"questionAnswers": {},
"unansweredQuestions": [],
"drives": [
{
"id": "20260901-081358",
"upload_id": "<id>",
"file_name": "TunerView_20260901_081358.csv",
"started_at": 1788225238000,
"received_at": 0,
"too_short": false,
"verdict": "good",
"summary": {
"id": "20260901-081358",
"start": 1788225238000,
"fileName": "TunerView_20260901_081358.csv",
"durationSec": 2427,
"movingSec": 1797,
"iatMoving": 37,
"cool": true,
"hot": false,
"hotRestart": false,
"kcStart": 0.51,
"kcEnd": 0.49,
"kcPeak": 0.54,
"timingCostDeg": 0.5,
"trimWorst": 1.6,
"hardPulls": 2,
"mixLeanest": 10.8,
"mixTarget": 11,
"boostTarget": 13.7,
"overshoot": 0.1,
"wgAtPeak": 2.5,
"cvtPeak": 73,
"lugShare": 5.11,
"kcUpSteps": 7,
"lugUpSteps": 1,
"lugRpm": 1506,
"accel5070": 1.97,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 1708,
"shakedown": "none"
}
}
],
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 2,
"name": "Starter 21 Dual Tune 2 · 20250901 · boost r1",
"label": "Map version 2",
"kind": "flash",
"tablesFrom": "app-store",
"tablesPending": false,
"from": 1756723200000,
"flashId": "fmf0zmwao-starter-21-dual-",
"changed": "boost",
"note": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"updatedAt": 1756723200000
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median 1.6 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; the B2 overshoot trim comes first; the latest Cool drive (1 Sep 08:13) was read without a Pedal full reading: say what TPS reads with the pedal floored; no hot drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi at 3,500–4,000 rpm",
"status": "deferred",
"reason": "Finish the Shakedown drive first: while it is open nothing else is planned (P2).",
"unlocks": "A passing Shakedown drive."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": true,
"unexplained": []
},
"stepFail": null
},
"hasLlm": false,
"calibration": {
"driveId": "20260901-081358",
"status": "no-reading",
"text": "was read without a Pedal full reading: say what TPS reads with the pedal floored",
"mapAction": "no-change",
"settled": false
},
"logGuide": {
"title": "The Calibration drive",
"intro": "One drive answers whether more boost can show on your car: it reads whether the boost target reaches your map's table with the pedal floored. It adds no power by itself, and it can come back \"capped\": that is an answer too. About 25 minutes, done once.",
"sections": [
{
"title": "Parked, the evening before",
"steps": [
"Ignition on, engine off (press Start twice without the brake), TunerView's live screen open: press the pedal to the floor and hold it, three times. Read TPS at each hold and type the highest in your car profile as the Pedal full reading.",
"In TunerView's gauge list, check whether it offers AFR Command and MAF Hz, and say so in your car profile's Logger setup.",
"Open TunerView's logging rate menu and type its fastest logging rate in the Logger setup too.",
"If you can, attach a screenshot of KTuner's Quick Adjustments screen here, so I can see the map's settings."
]
},
{
"title": "Before you drive, in TunerView",
"steps": [
"Turn on every gauge in the table below, plus AFR Command and MAF Hz if your app offers them.",
"Set the logging rate as fast as it goes: 10 samples a second or more.",
"Mount the phone where you won't touch it, and start the log before you set off."
]
},
{
"title": "When and where",
"steps": [
"Before 8 am, or after an hour parked in shade, so the intake reads under 42 °C.",
"Pick a straight, empty road where full throttle is legal and safe. Never in traffic."
]
},
{
"title": "Warm up, then cruise",
"steps": [
"Drive about 10 minutes normally, until coolant reads 80 °C or more.",
"Then cruise steady at a few different speeds, light throttle, several minutes in all: your fuel trims are read from this."
]
},
{
"title": "The two pulls",
"steps": [
"Choose slot 2 (Tune 2) when you start the car: while you choose, the tach shows 2,000 rpm for it. Turn ECO off.",
"Put the gearbox in S.",
"From a steady 50 km/h, press the pedal to the floor, all the way, and hold it until 100 km/h: at least 5 seconds, above 3,500 rpm for 4 s or more.",
"Cruise calmly about a minute so the intake cools, check it reads under 48 °C, then do the second pull the same way.",
"No brake launch, and no pull with the CVT fluid at 90 °C or more."
]
},
{
"title": "Finish",
"steps": [
"Keep at least 10 minutes of moving time in the log in all.",
"Idle a minute, stop the log, export it as CSV, and attach it here."
]
}
],
"checkpoints": [
"Logged 10 times a second or faster",
"10 minutes or more of moving",
"Every gauge moving",
"AFR Command and MAF Hz in the log",
"Engine warm (coolant 80 °C or more)",
"Cool intake while moving (under 42 °C)",
"2 full-throttle pulls",
"Pulls started under 48 °C intake",
"2 floored pulls held 4 s or more above 3,500 rpm",
"On slot 2 (Tune 2)"
],
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "STFT B1 + LTFT B1",
"ok": "within ±5 %",
"see": "beyond ±10 %",
"then": "Stop pulling. Drive home calm, upload."
}
]
},
"slot": 2
},
"stage": "calibrate",
"recap": {
"car": "Civic FE 1.5T · CVT · E10 RON95",
"parts": "intake, downpipe",
"map": "Map version 2",
"round": 2,
"stage": "calibrate",
"stageLine": "One drive answers whether more boost can show on your car.",
"lines": [
{
"label": "Last drive",
"value": "01 Sep 08:13"
},
{
"label": "Drives in your car file",
"value": "1"
},
{
"label": "Next drive",
"value": "The Calibration drive"
},
{
"label": "Waiting on",
"value": "Log AFR Command and MAF Hz"
}
]
},
"suggestions": [
{
"label": "How do I drive the Calibration drive?",
"action": "guide",
"icon": "route"
},
{
"label": "Attach my log",
"action": "attach",
"icon": "paperclip"
},
{
"label": "Why not more boost?",
"action": "send",
"icon": "help",
"text": "Why won't you raise my boost?"
}
],
"capabilities": [
{
"id": "read-log",
"status": "can",
"title": "Read your TunerView log",
"says": "Attach a TunerView CSV and I read every row: is the engine OK (OK, Watch, Stop or Can't tell), the health report by system, and whether the log met the drive brief."
},
{
"id": "car-file",
"status": "can",
"title": "Keep your car's file",
"says": "I keep your car: model, fuel, parts with the date fitted, every Map version and Flash, and every Drive, so each answer is read against your car's own history."
},
{
"id": "next-step",
"status": "can",
"title": "Name the one next step",
"says": "After each log I name one thing to do — a change to flash, a gauge to watch, or a drive to log — and the drive that will prove it."
},
{
"id": "maf",
"status": "partly",
"title": "Correct your airflow (MAF Scaling)",
"says": "I can correct MAF Scaling at part throttle from your trims, a few points at a time, when your logs call for it.",
"limit": "Full throttle needs AFR Command in your log, which your logs don't have yet, so I don't correct that end of the curve."
},
{
"id": "boost-down",
"status": "partly",
"title": "Change boost",
"says": "I can lower boost where your logs show overshoot or lugging.",
"limit": "I never raise boost: on this turbo the wastegate has no headroom left."
},
{
"id": "afr",
"status": "partly",
"title": "Judge your AFR (mixture)",
"says": "I judge full-throttle AFR against your map's target and say if it is OK, Watch or Stop.",
"limit": "I don't change the full-throttle AFR target: no gain is shown on this car, and leaning it costs timing."
},
{
"id": "fuel",
"status": "can",
"title": "E10 and RON95 III vs RON97 III",
"says": "Tag each log with its fuel and I compare RON95 III and RON97 III on matched drives by Knock Control, so you see if premium is worth it on your car."
},
{
"id": "tables",
"status": "can",
"title": "Explain any table in your map",
"says": "I can walk your map family by family and show any table in 2D or 3D with your own values, and explain what it does."
},
{
"id": "slots",
"status": "partly",
"title": "KTuner map slots (on-the-fly switching)",
"says": "Tag each log with the map slot it ran on, and I never compare drives from different slots.",
"limit": "I keep one map line for the car, not one per slot, so I can't yet tune a separate RON97 map in its own slot."
},
{
"id": "ignition",
"status": "cannot",
"title": "Add ignition timing or lower knock sensitivity",
"says": "I read and explain the ignition and knock tables, and show how much timing Knock Control pulls.",
"limit": "I never add timing or lower knock sensitivity: a street log can't prove that change is safe, and a wrong one costs an engine."
},
{
"id": "flash",
"status": "cannot",
"title": "Flash the ECU for you",
"says": "I give you the exact cells to type into KTuner and keep each Map version.",
"limit": "You flash in KTuner yourself; I can't connect to the car or the ECU."
},
{
"id": "live",
"status": "cannot",
"title": "Watch the car live",
"says": "I read a log after the drive.",
"limit": "I can't see live data: log in TunerView, then attach the CSV."
},
{
"id": "power",
"status": "cannot",
"title": "Promise power or dyno numbers",
"says": "I can time a 50 to 70 km/h run from your log and compare like with like.",
"limit": "A street log can't give horsepower, and I never promise a gain."
},
{
"id": "other-car",
"status": "partly",
"title": "Cars other than the Civic FE 1.5T",
"says": "My limits and knowledge are built for a Honda 1.5T on KTuner.",
"limit": "On any other car I'm not sure my limits hold: I'd read the log, but treat every verdict as unproven."
}
]
},
{
"carProfile": {
"model": "Civic FE 1.5T",
"engine": "L15 turbo",
"transmission": "CVT",
"fuel": "E10 RON95",
"climate": "hot city traffic",
"basemap": "Starter 21 Dual Tune 2",
"parts": [
"intake",
"downpipe"
],
"eliminate_artificial_kc_rise": false
},
"profileSpec": {
"fields": [
"model",
"engine",
"transmission",
"fuel",
"climate",
"basemap"
],
"parts": [
"intake",
"downpipe",
"front-pipe",
"catback",
"intercooler",
"cvt-cooler"
],
"basemap": "Starter 21 Dual Tune 2",
"basemapNote": "Prefilled from the map the app holds: you never type a table name."
},
"hasDrives": true,
"driveWindow": {
"driveIds": [
"20260901-081358"
],
"count": 1,
"since": null,
"line": "based on this Drive only (01 Sep 08:13)"
},
"ktunerBasemap": "Starter 21 Dual Tune 2",
"carHistory": [
{
"id": "20260901-081358",
"start": 1788225238000,
"fileName": "TunerView_20260901_081358.csv",
"duration": 2427,
"moving": 1797,
"cool": true,
"hot": false,
"hotRestart": false,
"verdict": "good",
"kcStart": 0.51,
"kcEnd": 0.49,
"kcPeak": 0.54,
"trimWorst": 1.6,
"iatMoving": 37,
"cvtPeak": 73,
"lugShare": 5.11,
"accel5070": {
"seconds": 1.97,
"iat": 39
},
"boostTarget": 13.7,
"hardPulls": 2,
"overshoot": 3.4,
"wgAtPeak": 2.5,
"map": "Starter 21 Dual Tune 2",
"mapVersion": 1,
"shakedown": "none",
"answered": null
}
],
"baseline": {
"value": 0.49,
"n": 1
},
"flashes": [
{
"id": "fmuwjrmyo-starter-21-dual-",
"flashed_at": 1791283200000,
"map": "Starter 21 Dual Tune 2 · 20261006 · boost r1",
"changed": "boost",
"note": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"restores": null
}
],
"installs": [],
"mapVersions": [
{
"id": 1,
"n": 1,
"label": "Map version 1",
"name": "Starter 21 Dual Tune 2",
"kind": "ktuner-basemap",
"source": "ktuner-basemap",
"parent_id": null,
"flash_id": null,
"changed": null,
"note": "",
"flashed_at": null,
"created_at": 0,
"updated_at": 0,
"has_tables": true
},
{
"id": 2,
"n": 2,
"label": "Map version 2",
"name": "Starter 21 Dual Tune 2 · 20261006 · boost r1",
"kind": "flash",
"source": "flash",
"parent_id": 1,
"flash_id": "fmuwjrmyo-starter-21-dual-",
"changed": "boost",
"note": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"flashed_at": 1791283200000,
"created_at": 0,
"updated_at": 0,
"has_tables": true
}
],
"activeMapVersion": {
"id": 2,
"n": 2,
"label": "Map version 2",
"name": "Starter 21 Dual Tune 2 · 20261006 · boost r1",
"kind": "flash",
"source": "flash",
"parent_id": 1,
"flash_id": "fmuwjrmyo-starter-21-dual-",
"changed": "boost",
"note": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"flashed_at": 1791283200000,
"created_at": 0,
"updated_at": 0,
"has_tables": true
},
"openSteps": [
{
"id": "channels",
"key": "channels",
"title": "Log AFR Command and MAF Hz",
"status": "open",
"why": "Asked on 1 Sep 08:13.",
"askedOn": "20260901-081358",
"askedAt": 1788225238000,
"lastAskedOn": null,
"settledBy": null,
"settledAt": null,
"word": "Not yet",
"tone": "watch"
}
],
"answers": {},
"questionAnswers": {},
"unansweredQuestions": [],
"drives": [
{
"id": "20260901-081358",
"upload_id": "<id>",
"file_name": "TunerView_20260901_081358.csv",
"started_at": 1788225238000,
"received_at": 0,
"too_short": false,
"verdict": "good",
"summary": {
"id": "20260901-081358",
"start": 1788225238000,
"fileName": "TunerView_20260901_081358.csv",
"durationSec": 2427,
"movingSec": 1797,
"iatMoving": 37,
"cool": true,
"hot": false,
"hotRestart": false,
"kcStart": 0.51,
"kcEnd": 0.49,
"kcPeak": 0.54,
"timingCostDeg": 0.5,
"trimWorst": 1.6,
"hardPulls": 2,
"mixLeanest": 10.8,
"mixTarget": 11,
"boostTarget": 13.7,
"overshoot": 0.1,
"wgAtPeak": 2.5,
"cvtPeak": 73,
"lugShare": 5.11,
"kcUpSteps": 7,
"lugUpSteps": 1,
"lugRpm": 1506,
"accel5070": 1.97,
"flat": [],
"missing": [
"mafHz",
"afrCmd"
],
"calmSec": 1708,
"shakedown": "none"
}
}
],
"flashPlan": {
"kind": "no-change",
"changeId": null,
"family": null,
"headline": "Your logs support no map change right now.",
"route": null,
"basis": "Data",
"proof": null,
"saveAs": null,
"undoName": null,
"undo": null,
"mapVersion": {
"n": 2,
"name": "Starter 21 Dual Tune 2 · 20261006 · boost r1",
"label": "Map version 2",
"kind": "flash",
"tablesFrom": "app-store",
"tablesPending": false,
"from": 1791283200000,
"flashId": "fmuwjrmyo-starter-21-dual-",
"changed": "boost",
"note": "Boost overshoot 3.4 psi, over the 2.5 psi hold, at 3,500–4,000 rpm.",
"updatedAt": 1791283200000
},
"ceilingPsi": 23.4,
"tables": [],
"cellCount": 0,
"cells": [],
"afmPasteRow": null,
"afmAfter": null,
"flashChanged": null,
"evidence": [],
"deferred": [],
"levers": [
{
"id": "afm",
"family": "AFM Flow",
"title": "AFM Flow curve",
"status": "not-needed",
"reason": "No change: trims within ±5 % (median 1.6 %).",
"unlocks": "A drive whose trims pass ±5 % in some airflow bins."
},
{
"id": "mixture",
"family": "mixture",
"title": "Mixture target (WOT 11.0 → 11.5)",
"status": "locked",
"reason": "Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.",
"unlocks": "The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible."
},
{
"id": "boostPlus",
"family": "boost",
"title": "Boost step +1 psi (Tune 2)",
"status": "locked",
"reason": "Locked: the open step \"Log AFR Command and MAF Hz\" comes first; the B2 overshoot trim comes first; the latest Cool drive (1 Sep 08:13) was read without a Pedal full reading: say what TPS reads with the pedal floored; no hot drive yet.",
"unlocks": "A Cool drive with 2 floored pulls that pass every gate (target within 0.5 psi of the table, undershoot and overshoot within 1.5 psi, target + overshoot at most 24, Knock Control settled and at most 0.56, mixture never leaner than 12.0 and at or richer than target, DIFP at least 90 %, trims within ±5 %), and a hot drive with Knock Control at most 0.56."
},
{
"id": "boostLow",
"family": "boost",
"title": "Boost lower at low rpm",
"status": "locked",
"reason": "Locked by P3: keep the revs up comes first — free beats a Flash.",
"unlocks": "Try keep the revs up; if the score still rises while lugging, this lever unlocks."
},
{
"id": "downpipe",
"family": "boost",
"title": "Boost −1 psi at 3,500–4,000 rpm",
"status": "deferred",
"reason": "Finish the Shakedown drive first: while it is open nothing else is planned (P2).",
"unlocks": "A passing Shakedown drive."
},
{
"id": "hot",
"family": null,
"title": "Hot days",
"status": "no-edit",
"reason": "No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) (file peak 18 psi).",
"unlocks": "—"
}
],
"openIssues": {
"stop": null,
"watch": null,
"shakedownPending": true,
"unexplained": []
},
"stepFail": null
},
"hasLlm": false,
"calibration": {
"status": "none",
"driveId": null,
"mapAction": "no-change",
"settled": false
},
"logGuide": {
"title": "The Calibration drive",
"intro": "One drive answers whether more boost can show on your car: it reads whether the boost target reaches your map's table with the pedal floored. It adds no power by itself, and it can come back \"capped\": that is an answer too. About 25 minutes, done once.",
"sections": [
{
"title": "Parked, the evening before",
"steps": [
"Ignition on, engine off (press Start twice without the brake), TunerView's live screen open: press the pedal to the floor and hold it, three times. Read TPS at each hold and type the highest in your car profile as the Pedal full reading.",
"In TunerView's gauge list, check whether it offers AFR Command and MAF Hz, and say so in your car profile's Logger setup.",
"Open TunerView's logging rate menu and type its fastest logging rate in the Logger setup too.",
"If you can, attach a screenshot of KTuner's Quick Adjustments screen here, so I can see the map's settings."
]
},
{
"title": "Before you drive, in TunerView",
"steps": [
"Turn on every gauge in the table below, plus AFR Command and MAF Hz if your app offers them.",
"Set the logging rate as fast as it goes: 10 samples a second or more.",
"Mount the phone where you won't touch it, and start the log before you set off."
]
},
{
"title": "When and where",
"steps": [
"Before 8 am, or after an hour parked in shade, so the intake reads under 42 °C.",
"Pick a straight, empty road where full throttle is legal and safe. Never in traffic."
]
},
{
"title": "Warm up, then cruise",
"steps": [
"Drive about 10 minutes normally, until coolant reads 80 °C or more.",
"Then cruise steady at a few different speeds, light throttle, several minutes in all: your fuel trims are read from this."
]
},
{
"title": "The two pulls",
"steps": [
"Choose slot 2 (Tune 2) when you start the car: while you choose, the tach shows 2,000 rpm for it. Turn ECO off.",
"Put the gearbox in S.",
"From a steady 50 km/h, press the pedal to the floor, all the way, and hold it until 100 km/h: at least 5 seconds, above 3,500 rpm for 4 s or more.",
"Cruise calmly about a minute so the intake cools, check it reads under 48 °C, then do the second pull the same way.",
"No brake launch, and no pull with the CVT fluid at 90 °C or more."
]
},
{
"title": "Finish",
"steps": [
"Keep at least 10 minutes of moving time in the log in all.",
"Idle a minute, stop the log, export it as CSV, and attach it here."
]
}
],
"checkpoints": [
"Logged 10 times a second or faster",
"10 minutes or more of moving",
"Every gauge moving",
"AFR Command and MAF Hz in the log",
"Engine warm (coolant 80 °C or more)",
"Cool intake while moving (under 42 °C)",
"2 full-throttle pulls",
"Pulls started under 48 °C intake",
"2 floored pulls held 4 s or more above 3,500 rpm",
"On slot 2 (Tune 2)"
],
"recipe": {
"intro": "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the 50→70 time on its own, so the Baseline has to be a Cool Drive.",
"steps": [
"Before 8 am, or after an hour parked in shade: intake under 42 °C.",
"10 minutes of normal driving first, so the engine and the CVT are warm.",
"Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
"While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app offers them. Without AFR Command I judge the mixture against the map's 11.0, not what the ECU asked for."
]
},
"gauges": {
"columns": [
"Gauge in TunerView",
"OK",
"If you see",
"Then"
],
"rows": [
{
"gauge": "IAT2",
"ok": "under 42 °C moving, under 48 °C when a pull starts",
"see": "over 48 °C",
"then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test."
},
{
"gauge": "Knock Control",
"ok": "at or under 0.56",
"see": "above 0.62",
"then": "Ease off, and note what you were doing (rpm, heat, hill). Up to 0.62 costs about 1.3° of timing, not damage."
},
{
"gauge": "O2 (AFR) at full throttle",
"ok": "10.0–11.5",
"see": "leaner than 12.0",
"then": "Lift. Upload before the next pull."
},
{
"gauge": "STFT B1 + LTFT B1",
"ok": "within ±5 %",
"see": "beyond ±10 %",
"then": "Stop pulling. Drive home calm, upload."
}
]
},
"slot": 2
},
"stage": "verify",
"recap": {
"car": "Civic FE 1.5T · CVT · E10 RON95",
"parts": "intake, downpipe",
"map": "Map version 2",
"round": 2,
"stage": "verify",
"stageLine": "You flashed a change: the next drive proves it.",
"lines": [
{
"label": "Last drive",
"value": "01 Sep 08:13"
},
{
"label": "Drives in your car file",
"value": "1"
},
{
"label": "Waiting on",
"value": "Log AFR Command and MAF Hz"
}
]
},
"suggestions": [
{
"label": "How do I drive the Shakedown?",
"action": "guide",
"icon": "route"
},
{
"label": "Attach my log",
"action": "attach",
"icon": "paperclip"
},
{
"label": "How do I undo it?",
"action": "send",
"icon": "help",
"text": "How do I undo the change I flashed?"
}
],
"capabilities": [
{
"id": "read-log",
"status": "can",
"title": "Read your TunerView log",
"says": "Attach a TunerView CSV and I read every row: is the engine OK (OK, Watch, Stop or Can't tell), the health report by system, and whether the log met the drive brief."
},
{
"id": "car-file",
"status": "can",
"title": "Keep your car's file",
"says": "I keep your car: model, fuel, parts with the date fitted, every Map version and Flash, and every Drive, so each answer is read against your car's own history."
},
{
"id": "next-step",
"status": "can",
"title": "Name the one next step",
"says": "After each log I name one thing to do — a change to flash, a gauge to watch, or a drive to log — and the drive that will prove it."
},
{
"id": "maf",
"status": "partly",
"title": "Correct your airflow (MAF Scaling)",
"says": "I can correct MAF Scaling at part throttle from your trims, a few points at a time, when your logs call for it.",
"limit": "Full throttle needs AFR Command in your log, which your logs don't have yet, so I don't correct that end of the curve."
},
{
"id": "boost-down",
"status": "partly",
"title": "Change boost",
"says": "I can lower boost where your logs show overshoot or lugging.",
"limit": "I never raise boost: on this turbo the wastegate has no headroom left."
},
{
"id": "afr",
"status": "partly",
"title": "Judge your AFR (mixture)",
"says": "I judge full-throttle AFR against your map's target and say if it is OK, Watch or Stop.",
"limit": "I don't change the full-throttle AFR target: no gain is shown on this car, and leaning it costs timing."
},
{
"id": "fuel",
"status": "can",
"title": "E10 and RON95 III vs RON97 III",
"says": "Tag each log with its fuel and I compare RON95 III and RON97 III on matched drives by Knock Control, so you see if premium is worth it on your car."
},
{
"id": "tables",
"status": "can",
"title": "Explain any table in your map",
"says": "I can walk your map family by family and show any table in 2D or 3D with your own values, and explain what it does."
},
{
"id": "slots",
"status": "partly",
"title": "KTuner map slots (on-the-fly switching)",
"says": "Tag each log with the map slot it ran on, and I never compare drives from different slots.",
"limit": "I keep one map line for the car, not one per slot, so I can't yet tune a separate RON97 map in its own slot."
},
{
"id": "ignition",
"status": "cannot",
"title": "Add ignition timing or lower knock sensitivity",
"says": "I read and explain the ignition and knock tables, and show how much timing Knock Control pulls.",
"limit": "I never add timing or lower knock sensitivity: a street log can't prove that change is safe, and a wrong one costs an engine."
},
{
"id": "flash",
"status": "cannot",
"title": "Flash the ECU for you",
"says": "I give you the exact cells to type into KTuner and keep each Map version.",
"limit": "You flash in KTuner yourself; I can't connect to the car or the ECU."
},
{
"id": "live",
"status": "cannot",
"title": "Watch the car live",
"says": "I read a log after the drive.",
"limit": "I can't see live data: log in TunerView, then attach the CSV."
},
{
"id": "power",
"status": "cannot",
"title": "Promise power or dyno numbers",
"says": "I can time a 50 to 70 km/h run from your log and compare like with like.",
"limit": "A street log can't give horsepower, and I never promise a gain."
},
{
"id": "other-car",
"status": "partly",
"title": "Cars other than the Civic FE 1.5T",
"says": "My limits and knowledge are built for a Honda 1.5T on KTuner.",
"limit": "On any other car I'm not sure my limits hold: I'd read the log, but treat every verdict as unproven."
}
]
}
];

export const answers: AskAnswer[] = [
{
"ok": true,
"kind": "desk",
"intent": "greeting",
"citations": [],
"window": null,
"nextStep": null,
"answer": "Welcome back. Here's your car and where we are. Your last log is read; the next drive settles what's open. What would you like to do today?",
"suggestions": [
{
"label": "Attach my latest log",
"action": "attach",
"icon": "paperclip"
},
{
"label": "Is my knock control OK?",
"action": "send",
"icon": "gauge",
"text": "Is my knock control OK?"
},
{
"label": "Is RON97 worth it?",
"action": "send",
"icon": "help",
"text": "Is RON97 III worth it over RON95 III on my car?"
}
],
"ui": [
{
"tool": "show_recap",
"recap": {
"car": "Civic FE 1.5T · CVT · E10 RON95",
"parts": "intake, downpipe",
"map": "Map version 1",
"round": 1,
"stage": "read",
"stageLine": "Your last log is read; the next drive settles what's open.",
"lines": [
{
"label": "Last drive",
"value": "05 Sep 07:56"
},
{
"label": "Drives in your car file",
"value": "8"
},
{
"label": "Waiting on",
"value": "Fix the logger: dead gauges"
},
{
"label": "Questions for you",
"value": "3"
}
]
}
}
],
"basis": null
},
{
"ok": true,
"kind": "desk",
"intent": "capabilities",
"citations": [],
"window": null,
"nextStep": null,
"answer": "I'm a tuning shop for your KTuner car, in a chat. Here's what I'm sure I can do, what I can do with a limit, and what I won't do.\n\n**I can**\n- **Read your TunerView log** — Attach a TunerView CSV and I read every row: is the engine OK (OK, Watch, Stop or Can't tell), the health report by system, and whether the log met the drive brief.\n- **Keep your car's file** — I keep your car: model, fuel, parts with the date fitted, every Map version and Flash, and every Drive, so each answer is read against your car's own history.\n- **Name the one next step** — After each log I name one thing to do — a change to flash, a gauge to watch, or a drive to log — and the drive that will prove it.\n- **E10 and RON95 III vs RON97 III** — Tag each log with its fuel and I compare RON95 III and RON97 III on matched drives by Knock Control, so you see if premium is worth it on your car.\n- **Explain any table in your map** — I can walk your map family by family and show any table in 2D or 3D with your own values, and explain what it does.\n\n**I can, with a limit**\n- **Correct your airflow (MAF Scaling)** — I can correct MAF Scaling at part throttle from your trims, a few points at a time, when your logs call for it. Full throttle needs AFR Command in your log, which your logs don't have yet, so I don't correct that end of the curve.\n- **Change boost** — I can lower boost where your logs show overshoot or lugging. I never raise boost: on this turbo the wastegate has no headroom left.\n- **Judge your AFR (mixture)** — I judge full-throttle AFR against your map's target and say if it is OK, Watch or Stop. I don't change the full-throttle AFR target: no gain is shown on this car, and leaning it costs timing.\n- **KTuner map slots (on-the-fly switching)** — Tag each log with the map slot it ran on, and I never compare drives from different slots. I keep one map line for the car, not one per slot, so I can't yet tune a separate RON97 map in its own slot.\n- **Cars other than the Civic FE 1.5T** — My limits and knowledge are built for a Honda 1.5T on KTuner. On any other car I'm not sure my limits hold: I'd read the log, but treat every verdict as unproven.\n\n**I can't**\n- **Add ignition timing or lower knock sensitivity** — I never add timing or lower knock sensitivity: a street log can't prove that change is safe, and a wrong one costs an engine.\n- **Flash the ECU for you** — You flash in KTuner yourself; I can't connect to the car or the ECU.\n- **Watch the car live** — I can't see live data: log in TunerView, then attach the CSV.\n- **Promise power or dyno numbers** — A street log can't give horsepower, and I never promise a gain.",
"suggestions": [
{
"label": "Attach my latest log",
"action": "attach",
"icon": "paperclip"
},
{
"label": "Is my knock control OK?",
"action": "send",
"icon": "gauge",
"text": "Is my knock control OK?"
},
{
"label": "Is RON97 worth it?",
"action": "send",
"icon": "help",
"text": "Is RON97 III worth it over RON95 III on my car?"
}
],
"ui": [],
"basis": null
},
{
"ok": true,
"kind": "car-edit",
"intent": "car-change",
"citations": [],
"window": null,
"nextStep": null,
"answer": "Noted: intercooler fitted. Check your car below and save it: saving records the Install with today's date, so the drives after it are read against the car as it is now. A new part can change how the car breathes, so your next log should be a calm drive before any hard pulls.",
"suggestions": [
{
"label": "How should I log the next drive?",
"action": "guide",
"icon": "route"
}
],
"ui": [
{
"tool": "show_car_editor",
"draft": {
"fields": {
"model": "Civic FE 1.5T",
"engine": "L15 turbo",
"transmission": "CVT",
"fuel": "E10 RON95",
"climate": "hot city traffic",
"basemap": "Starter 21 Dual Tune 2",
"parts": [
"intake",
"downpipe",
"intercooler"
],
"eliminate_artificial_kc_rise": false
},
"filled": {
"parts": true
},
"missing": [],
"prefilled": [],
"changed": [
"intercooler"
]
}
}
],
"basis": null
},
{
"ok": true,
"kind": "answer",
"intent": "heat",
"window": "based on your 8 Drives, 22 Aug 09:03 to 05 Sep 07:56",
"citations": [
{
"id": "kc-heat-soak",
"title": "Heat soak, not the tune, costs this car performance"
}
],
"nextStep": "Your logger recorded 4 dead gauges",
"answer": "Your hotter Drive was the slower one: on 30 Aug 15:29 your 50 to 70 km/h run took 1.77 s with the intake at 50 °C; on 30 Aug 16:01 it took 2.23 s at 58 °C. Heat soak, not the tune, costs this car performance, so judge power only at similar intake temperatures. [kc-heat-soak] Next step: Your logger recorded 4 dead gauges.",
"readDrives": true,
"ui": [],
"basis": "based on your 8 Drives, 22 Aug 09:03 to 05 Sep 07:56 · 8 Drives in your car file",
"suggestions": [
{
"label": "Attach my latest log",
"action": "attach",
"icon": "paperclip"
},
{
"label": "How do I log a cool drive?",
"action": "guide",
"icon": "route"
},
{
"label": "Is my knock control OK?",
"action": "send",
"icon": "gauge",
"text": "Is my knock control OK?"
}
],
"harness": {
"checked": 1,
"seconds": 0,
"line": "Checked 1 things · 0 s",
"steps": [
{
"name": "suggest",
"title": "Suggest follow-up replies",
"inputs": {
"text": "why's it so sluggish when it's hot out"
},
"output": {
"result": [
{
"label": "Attach my latest log",
"action": "attach",
"icon": "paperclip"
},
{
"label": "How do I log a cool drive?",
"action": "guide",
"icon": "route"
},
{
"label": "Is my knock control OK?",
"action": "send",
"icon": "gauge",
"text": "Is my knock control OK?"
}
]
},
"ms": 0
}
]
}
}
];
