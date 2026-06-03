## 📌 Project Overview

Modern distributed architectures generate millions of log entries every second, making manual inspection impossible. Traditional rule-based alerting systems suffer from extreme alert fatigue and fail to catch zero-day behavioral anomalies. 

**SecureLog** solves this by parsing, structuring, and analyzing logs across four distinct machine learning models running in parallel. This hybrid approach significantly improves recall while minimizing costly false positives, providing security teams with instant actionable intelligence.

### Key Objectives
* **Automated Log Ingestion:** Eliminate manual triage with continuous, validation-backed file and stream parsing supporting uploads up to **50MB**.
* **Instant Anomaly Detection:** Track system threats and infrastructure irregularities in near real time.
* **Operational Intelligence:** Provide a rich, responsive React-based dashboard for pattern recognition and proactive trend forecasting.
* **Enterprise Security:** Role-based access controls (RBAC) enforced via JWT and configurable threat thresholds for localized tuning.

---

## 🏗️ System Architecture & Data Pipeline

The platform is designed around a decoupled, five-stage architecture ensuring independent scalability of each component.

1. **Log Upload Module:** Accepts multi-source unstructured files (up to 50MB) or streams with automated format validation.
2. **Preprocessing Module:** Normalizes timestamps to UTC, sanitizes text strings, and tokenizes raw entries into structured elements.
3. **Feature Extraction Module:** Converts tokenized logs into numerical and categorical vector structures based on statistical and behavioral metadata.
4. **Detection Engine:** Evaluates vectorized items across four parallel models to assign a unified anomaly confidence score.
5. **Dashboard Module:** Aggregates scores via Spring Boot REST APIs and renders live time-series alerts on the React frontend.

---

## 🧠 Hybrid Machine Learning Engine

The platform eliminates single-model blind spots by routing log vectors through **four complementary algorithms** concurrently inside the ML Integration Layer:

| Model | Target Anomaly Signature | Ideal For |
| :--- | :--- | :--- |
| **🌲 Isolation Forest** | Outliers isolated via recursive feature space partitioning | High-dimensional data, novel exploits |
| **📊 Z-Score** | Statistical boundary deviations ($> \pm3\sigma$) | Numeric metrics (Response times, error rates) |
| **🔵 K-Means Clustering** | Distance calculation relative to dense behavioral centroids | Grouping structural variations, clustering normal states |
| **📋 Naive Bayes** | Probabilistic classification of sequential text states | Categorizing historical attack vectors / explicit errors |

### The Hybrid Scoring Formula
Each model outputs an anomaly probability $P_m$. The system combines these outputs using a weighted aggregation matrix to yield a final confidence score:

$$Anomaly\_Score = \sum_{m=1}^{n} w_m \cdot P_m$$

If the unified score passes the operator-defined threshold in the Security Settings, an alert state is triggered instantly.

---

## 🛠️ Technology Stack & Configuration

### Frontend
* **React.js (v18+)** - Component-driven, responsive UI built for operational speed.
* **Interactive Dashboard** - Canvas/SVG-based time-series charts, anomaly timelines, and real-time alert panels.

### Backend
* **Spring Boot 3.x** - High-throughput REST API layer handling core business logic, ingestion pipelines, and cross-service orchestration.
* **Spring Security & JWT** - Implements robust role-based access control (Admin/Analyst) with stateless session handling.
* **Spring Data JPA** - Modern ORM layer utilizing Hibernate for database interactions.

### Environment & Database Configurations
The application is pre-configured for seamless local execution using an optimized environment footprint:
* **Server Port:** `8080`
* **Database Engine:** H2 In-Memory Database (`securelogdb`) — *Zero setup required for deployment testing.*
* **H2 Console Path:** `/h2-console` (Available during runtime for database state inspection).
* **JWT Expiration:** 24 Hours ($86,400,000 \text{ ms}$) for secure token life cycles.
* **File Upload Constraints:** Maximum file size capped at **50MB** (Maximum request size: **52MB**) to handle large bulk log dumps.

---

## 🚀 Getting Started

### Prerequisites
* **Java Development Kit (JDK 17 or higher)**
* **Node.js** (v18.x or higher) & npm
* **Maven** 3.x

### Local Deployment Steps

1. **Clone the Repository**
```bash
   git clone [https://github.com/your-username/intelligent-log-analytics.git](https://github.com/your-username/intelligent-log-analytics.git)
   cd intelligent-log-analytics

```

2. **Run the Backend Service (Spring Boot)**
The service will boot up on port `8080` and automatically initialize the in-memory H2 database.

```bash
   cd backend
   mvn clean install
   mvn spring-boot:run

```

* *Note: You can inspect the live running database by visiting `http://localhost:8080/h2-console` with the JDBC URL: `jdbc:h2:mem:securelogdb`, Username: `sa`, and keeping the password blank.*

3. **Initialize the Frontend UI (React)**

```bash
   cd ../frontend
   npm install
   npm start

```

4. **Access the Application**
* Open your browser and navigate to `http://localhost:3000`
* Log in via the **SecureLog** portal using your specified Admin or Analyst role credentials.



---

## 📄 Academic Research & Publications

This platform is backed by a peer-reviewed academic manuscript detailing its underlying framework, hybrid scoring performance, and architecture layout.

* **Status:** Successfully submitted and acknowledged for publication via the **IJERT (International Journal of Engineering Research & Technology)** publication portal.

---

