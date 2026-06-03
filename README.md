
# Intelligent Log Analytics Platform

### Real-Time Anomaly Detection and Monitoring System

An enterprise-grade, AI-powered log management and monitoring solution designed to overcome the scale and limitations of traditional rule-based monitoring. By leveraging a five-stage modular pipeline and a hybrid machine learning scoring engine, this platform automates log ingestion, filters out background noise, and surfaces critical system anomalies in real time.

---

## 📌 Project Overview

Modern distributed architectures generate millions of log entries every second, making manual inspection impossible. Traditional rule-based alerting systems suffer from extreme alert fatigue and fail to catch zero-day behavioral anomalies.

**SecureLog** solves this by parsing, structuralizing, and analyzing logs across four distinct machine learning models running in parallel. This hybrid approach significantly improves recall while minimizing costly false positives.

### Key Objectives

* **Automated Log Ingestion:** Eliminate manual triage with continuous, validation-backed file and stream parsing.
* **Instant Anomaly Detection:** Track system threats and infrastructure irregularities in near real time.
* **Operational Intelligence:** Provide a rich, responsive React-based dashboard for pattern recognition and proactive trend forecasting.
* **Enterprise Security:** Role-based access controls (RBAC) and configurable threat thresholds for localized tuning.

---

## 🏗️ System Architecture & Data Pipeline

The platform is designed around a decoupled, five-stage architecture ensuring independent scalability of each component.

1. **Log Ingestion (Upload Module):** Accepts multi-source unstructured files or streams with automated format validation.
2. **Preprocessing Module:** Normalizes timestamps, sanitizes text strings, and tokenizes raw entries into structured key-value maps.
3. **Feature Extraction Module:** Converts tokenized logs into numerical vector structures based on statistical and behavioral metadata.
4. **Hybrid ML Detection Engine:** Evaluates vectorized items across parallel algorithms to assign a unified anomaly confidence score.
5. **Analytics & Visualization Dashboard:** Aggregates scores via Spring Boot endpoints and renders live time-series alerts on the React frontend.

---

## 🧠 Hybrid Machine Learning Engine

The platform eliminates single-model blind spots by routing log vectors through **four complementary algorithms** concurrently:

| Model | Target Anomaly Signature | Ideal For |
| --- | --- | --- |
| **🌲 Isolation Forest** | Outliers isolated via recursive feature space partitioning | High-dimensional data, novel exploits |
| **📊 Z-Score** | Statistical boundary deviations ($> \pm3\sigma$) | Numeric metrics (Response times, error counts) |
| **🔵 K-Means Clustering** | Distance calculation relative to dense behavioral centroids | Grouping structural variations, clustering normal state |
| **📋 Naive Bayes** | Probabilistic classification of sequential text states | Categorizing historical attack vectors / explicit errors |

### The Hybrid Scoring Formula

Each model outputs an anomaly probability $P_m$. The system combines these outputs using a weighted aggregation matrix to yield a final confidence score:

$$Anomaly\_Score = \sum_{m=1}^{n} w_m \cdot P_m$$

If the unified score passes the user-defined threshold in the **Security Settings**, an alert state is triggered instantly.

---

## 🛠️ Technology Stack

### Frontend

* **React.js (v18+)** - Component-driven, responsive UI built for operational speed.
* **State Management & Charts** - Real-time state management with interactive canvas/SVG-based time-series analytics.

### Backend

* **Spring Boot 3.x** - High-throughput REST API layer handling core business logic, ingestion pipelines, and cross-service orchestration.
* **Spring Security & JWT** - Implements robust role-based access control (Admin/Analyst) and secure endpoint communication.

### ML Engine & Middleware

* **Python Stack** - Scikit-Learn, NumPy, and Pandas driving the model pipeline.
* **Integration Layer** - Native JSON serialization protocols linking the Spring Boot coordinator to the Python execution runtime.

---

## 🖥️ Platform Modules & Interface Walkthrough

* **Login Interface (`SecureLog`):** Secure access gateway enforcing role-based permissions (Admin vs. Analyst access scopes).
* **Upload & Ingestion Manager:** Drag-and-drop system for raw log submissions supporting dynamic validation rules.
* **Real-time Analytics Dashboard:** Live stream visualization panel tracking aggregated threat levels, anomaly timelines, and historical logs.
* **Security Settings Panel:** Micro-tuning UI for operators to adjust notification delivery channels, toggle individual ML models, and modify threshold configurations.

---

## 🚀 Getting Started

### Prerequisites

* Java 17 or higher
* Node.js (v18.x or higher)
* Python 3.10+
* Maven 3.x

### Installation Steps

1. **Clone the Repository**
```bash
git clone https://github.com/your-username/intelligent-log-analytics.git
cd intelligent-log-analytics

```


2. **Setup ML Engine**
```bash
cd ml-engine
pip install -r requirements.txt
python app.py

```


3. **Launch Backend Service**
```bash
cd ../backend
mvn clean install
mvn spring-boot:run

```


4. **Initialize Frontend UI**
```bash
cd ../frontend
npm install
npm start

```



