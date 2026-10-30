# 💊 FakeMed AI – AI-Based Counterfeit Medicine Screening System

**FakeMed AI** is an AI-powered preliminary screening system designed to identify potential inconsistencies in medicine packaging and support the early screening of counterfeit medicines.

The system combines Deep Learning, Optical Character Recognition (OCR), Barcode/QR Code Verification, and reference-based medicine information checks to analyze uploaded medicine images and generate preliminary screening reports.

> **Note:** FakeMed AI is a preliminary screening and decision-support tool. It does not provide definitive authentication of medicines or replace verification by pharmacists, manufacturers, or regulatory authorities.

---

## 🚀 Key Features

- **AI-Based Visual Analysis:** Uses deep learning and CNN-based image analysis to identify suspicious visual patterns in medicine packaging.
- **OCR-Based Text Extraction:** Extracts medicine names, batch details, manufacturing dates, expiry dates, and other available packaging information.
- **Barcode & QR Code Verification:** Reads and validates available barcode and QR code information.
- **Medicine Reference Verification:** Cross-checks extracted information against available medicine reference databases.
- **Multi-Source Evidence Analysis:** Combines visual, textual, barcode, and reference-based evidence.
- **AI-Powered Explanation:** Provides understandable explanations of detected inconsistencies.
- **Preliminary Screening Report:** Generates a report summarizing the analysis and available evidence.

## 🧠 System Workflow

```text
        Upload Medicine Image
                 |
                 v
         Image Preprocessing
                 |
        +--------+--------+
        |                 |
        v                 v
  CNN-Based Visual     OCR-Based Text
      Analysis          Extraction
        |                 |
        v                 v
  Visual Features    Extracted Medicine
                      Information
        |                 |
        +--------+--------+
                 |
                 v
       Barcode / QR Verification
                 |
                 v
       Medicine Reference Check
                 |
                 v
       Multi-Source Evidence Fusion
                 |
                 v
        Preliminary Screening
                 |
                 v
          AI Explanation
                 |
                 v
        Screening Report
```

## 🛠️ Technologies Used

| Component | Technology |
|---|---|
| Programming Language | Python |
| Deep Learning | CNN |
| Image Processing | OpenCV |
| Text Extraction | Tesseract OCR |
| Barcode / QR | Barcode and QR decoding libraries |
| Medicine Reference | RxNorm / RxNav, openFDA, DailyMed |
| Frontend | React.js |
| Styling | Tailwind CSS |
| Backend | Node.js / Python API (depending on integration) |
| Version Control | Git & GitHub |

*Technologies listed represent the intended project stack; actual implementation may vary.*

## 🔍 How It Works

1. **Image Upload:** The user uploads an image of a medicine package.
2. **Image Preprocessing:** The image is enhanced and prepared for analysis.
3. **Visual Analysis:** A CNN-based model analyzes packaging characteristics and visual patterns.
4. **OCR Extraction:** Relevant medicine information is extracted from the package.
5. **Barcode/QR Analysis:** Available codes are decoded and checked.
6. **Reference Validation:** Extracted information is compared with available medicine reference sources.
7. **Evidence Fusion:** Results from different analysis modules are combined.
8. **Report Generation:** The system produces a preliminary screening result with supporting explanations.

## 📊 Screening Result Categories

FakeMed AI uses evidence-based result categories:

| Result | Description |
|---|---|
| Consistent with available reference data | Available information appears consistent with the checked references. |
| Potential inconsistency detected | One or more discrepancies require further verification. |
| Insufficient reference evidence | Available information is not sufficient to make a meaningful assessment. |

## 📈 Model Evaluation

The machine learning component can be evaluated using:

- Accuracy
- Precision
- Recall
- F1-Score
- Confusion Matrix
- ROC-AUC

Additional module-level evaluation:

- OCR extraction accuracy
- Barcode/QR decoding success rate
- Medicine reference matching rate

## 🎯 Project Objectives

- Support preliminary counterfeit medicine screening.
- Explore the application of AI and deep learning in pharmaceutical safety.
- Combine multiple verification techniques into a unified workflow.
- Improve accessibility to medicine packaging information.
- Provide understandable screening results to support further verification.

## 🔮 Future Enhancements

- Multilingual OCR support.
- Real-time medicine package scanning using a mobile camera.
- Advanced deep learning architectures for visual analysis.
- Improved medicine reference database integration.
- AI-powered multilingual voice assistant.
- Explainable AI for transparent screening results.
- Mobile application integration.
- Blockchain-based medicine supply-chain traceability.

## ⚙️ Installation & Setup

Clone the repository:

```bash
git clone https://github.com/FrancinaDharshini/MedVerify-AI.git
```

Navigate to the project directory:

```bash
cd MedVerify-AI
```

Install the frontend dependencies (if using Node.js):

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

For backend setup, install the required Python or Node.js dependencies according to the backend implementation.

## 👩‍💻 Project Team

**Project:** FakeMed AI – AI-Based Preliminary Counterfeit Medicine Screening System

**Contributors:**
- Francina Dharshini S
- Deva Dharshika D

## 🌐 Repository

[GitHub – MedVerify-AI](https://github.com/FrancinaDharshini/MedVerify-AI)

## ⚠️ Disclaimer

FakeMed AI is developed for educational and research purposes. Its output is intended only for preliminary screening. A medicine should not be declared genuine or counterfeit solely based on this system's results. Suspected medicines should be verified with qualified pharmacists, manufacturers, or appropriate regulatory authorities.

---

**Built with AI for safer medicine verification. 💙**
