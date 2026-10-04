---
id: kp-which-way-a-fuel-trim-points-when-correcting-the-airflow-cur
title: Which way a fuel trim points when correcting the airflow curve
status: proposed
why: The owner asked how to correct MAF Scaling from their TunerView CSV; the cards give the method and the sample rules but not the direction the correction goes.
source-hint: KTuner help / fuel trim and MAF scaling explanation
---
In a KTuner log, a positive fuel trim means the ECU added fuel because the mixture measured lean, so the airflow point covering that airflow reads slightly low and needs a small upward correction. A negative trim means the opposite. Corrections aim the trims back toward zero, a few percent per round, with the curve kept smooth. Not yet confirmed on this car's ECU.
