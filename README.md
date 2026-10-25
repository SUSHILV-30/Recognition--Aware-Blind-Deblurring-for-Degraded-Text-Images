
<div align="center">

# Recognition-Aware Blind Deblurring for Degraded Text Images

### A Comparative Analysis of Restoration Paradigms for Optical-Defocus Text

[![Research](https://img.shields.io/badge/Project-Research%20Paper-5B5BD6?style=for-the-badge)](#project-overview)
[![Domain](https://img.shields.io/badge/Computer%20Vision-Image%20Restoration-0E9F6E?style=for-the-badge)](#methodology)
[![Dataset](https://img.shields.io/badge/Benchmark-HDC%202021-2563EB?style=for-the-badge)](#dataset)
[![Models](https://img.shields.io/badge/Models-CNN%20%7C%20Transformers%20%7C%20Physics--Informed-orange?style=for-the-badge)](#restoration-approaches)

**Sri Jayaram J S · Sushil V · Praneeth U · Adithya Nambiar P · Rachit Anand**

*Advisor: Dr. Padmavathi S.*

Department of Computer Science and Engineering  
Amrita School of Computing, Amrita Vishwa Vidyapeetham, Coimbatore, India

</div>

---

## 🖥️ Project Dashboard

An interactive React site covering every study, the Phase 2 Restormer results and a same-sample comparison of all models lives in [`dashboard/`](dashboard/). Run it with `cd dashboard && npm install && npm run dev`. OCR scores for every blur level are collected in [`Restormer Fine Tuned/OCR_RESULTS.md`](Restormer%20Fine%20Tuned/OCR_RESULTS.md).

## 📌 Table of Contents

- [Project Overview](#project-overview)
- [Objectives](#objectives)
- [Research Contributions](#research-contributions)
- [Methodology](#methodology)
- [Restoration Approaches](#restoration-approaches)
- [Dataset](#dataset)
- [Experimental Setup](#experimental-setup)
- [Combined Model Results](#combined-model-results)
- [Detailed Results](#detailed-results)
- [Structural Edge Analysis](#structural-edge-analysis)
- [Recognition-Aware Blind Deblurring](#recognition-aware-blind-deblurring-rabd)
- [Key Findings](#key-findings)
- [Suggested Repository Structure](#suggested-repository-structure)
- [Reproducibility](#reproducibility-and-usage)
- [Limitations](#limitations)
- [Future Work](#future-work)
- [References](#references)
- [Acknowledgements](#acknowledgements)

---

## 🔎 Project Overview

Optical defocus is a common source of degradation in camera-captured text images. Incorrect focus weakens character boundaries, merges neighbouring characters, and removes fine structural details, reducing the reliability of Optical Character Recognition (OCR).

This project presents a comparative study of restoration approaches for degraded text images using the **Helsinki Deblur Challenge 2021 (HDC 2021)** benchmark and its `focusStep` subset.

Three restoration paradigms are investigated:

- **CNN-based restoration:** MPRNet and NAFNet.
- **Transformer-based restoration:** Restormer and an exploratory Uformer implementation.
- **Physics-informed restoration:** A U-Net trained using degradation-matched synthetic data generated from estimated point-spread functions and radial lens distortion.

The study also investigates the preservation of character boundaries through Sobel, Canny, and Laplacian edge operators.

