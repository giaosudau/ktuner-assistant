---
id: kc-maf-housing
title: MAF Scaling follows the housing, never the brand
kind: ktuner-howto
topics: intake, housing, ktuner
applies-when: An intake is fitted, trims sit far off after a Flash, or the owner asks which MAF preset to pick.
status: current
source-doc: docs/research/afr-tuning-research.md
source-section: §1
numbers:
- race-air-lo: 1.29 ratio
- race-air-hi: 1.43 ratio
- trim-stop: 10 %
- trim-ok: 5 %
---
Ask which housing is fitted before touching anything: factory airbox, a street housing, or a larger Race housing. The street housings read near stock, so they keep the Factory curve. The Race curves read 1.29 to 1.43 times the air at the same sensor frequency, so a Race preset on a street housing runs about forty percent rich and the trims clamp trying to pull it back. After any airflow Flash, drive calm first and make no pull until trims sit within 5 percent. Trims beyond 10 percent across most of the range mean the curve is wrong for the hardware: revert, do not tune around it. Never infer the housing from the brand.
