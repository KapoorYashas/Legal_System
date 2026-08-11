# ⚖️ Legal Expert System — IPC to BNS Mapping

> An AI-powered web application for navigating Indian criminal law. Maps **IPC** sections to **BNS** equivalents, provides keyword-based law discovery, and delivers AI-generated case justifications from 5,500+ real court records using a fine-tuned GPT-2 Medium model.

---

## ✨ Features

| Feature                        | Description                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| 🔍 **Keyword Search**          | 93+ legal keywords to find relevant IPC/BNS sections                      |
| ⚖️ **IPC ↔ BNS Mapping**       | 86 rules mapping old IPC sections to BNS equivalents                      |
| 🧑‍⚖️ **Justification Popup**     | AI-powered popup with _Common_ and _Different_ past case judgements       |
| 📖 **Law Section Search**      | Dedicated page to search directly by IPC/BNS section via linked dropdowns |
| 🤖 **Fine-tuned GPT-2 Medium** | 345M parameter model trained on Indian court case data (Perplexity: 2.60) |

---

## 🏗️ Project Structure

```
legal/
│
├── backend/                            # Flask API server
│   ├── api_server.py                   # REST API (7 endpoints)
│   ├── legal_expert_system.py          # Rules DB (86 entries) + justification logic
│   └── requirements.txt
│
├── frontend/                           # React 19 web app
│   └── src/
│       ├── App.jsx                     # Tab navigation (Keyword Search / Law Search)
│       ├── App.css                     # Dark glassmorphism nav styles
│       └── components/
│           ├── LegalChatbot.jsx        # Keyword search page + Justification button
│           ├── LawSearch.jsx           # Direct IPC/BNS section search page
│           └── JustificationModal.jsx  # AI case justification popup
│
├── legal_model/                        # Fine-tuned GPT-2 Medium (~677 MB, FP16)
│   ├── model.safetensors
│   ├── config.json
│   ├── tokenizer.json
│   ├── tokenizer_config.json
│   └── generation_config.json
│
├── legal_training_data_batch/          # Training dataset
│   ├── train.jsonl                     # 4,956 original training records
│   ├── val.jsonl                       # 553 original validation records
│   ├── train_split.jsonl               # Cleaned + split (common/different)
│   ├── val_split.jsonl                 # Cleaned + split (common/different)
│   ├── legal_training_data.json        # Full combined dataset (5,509 records)
│   ├── dataset_stats.json
│   └── checkpoint_*.json               # 153 per-section case files (77 IPC + 76 BNS)
│
├── legal-analysis.ipynb                # GPT-2 Medium fine-tuning notebook (Kaggle)
├── prepare_dataset.py                  # Data cleaning + semantic split script
└── README.md
```

---

## 🧠 Architecture

```
User selects keywords / section code
         │
         ▼
   React Frontend  ──POST/GET──▶  Flask API (port 5000)
         │                              │
         │                  ┌───────────┴───────────┐
         │                  │                       │
         ▼              Rules DB (86)        Checkpoint JSONs
   Law cards shown       keyword match       (153 section files)
         │                                          │
         ▼                                          ▼
  [Justification]                        get_justification()
      button                           keyword-based classifier
         │                             Common | Different outcomes
         ▼
  JustificationModal
  (also calls /api/justification)
```

---

## 🔌 API Endpoints

| Method | Endpoint             | Description                                                     |
| ------ | -------------------- | --------------------------------------------------------------- |
| `GET`  | `/api/keywords`      | All 93 keywords                                                 |
| `POST` | `/api/search`        | Search by keywords. Body: `{"keywords": [...]}`                 |
| `POST` | `/api/justification` | Case justifications. Body: `{"ipc": "302"}` or `{"bns": "103"}` |
| `GET`  | `/api/law-detail`    | Full rule. Params: `?ipc=302` or `?bns=103`                     |
| `GET`  | `/api/rules`         | All 86 rules                                                    |
| `GET`  | `/api/stats`         | System statistics                                               |
| `GET`  | `/api/search-ipc`    | Search by IPC code                                              |

---

## 📦 Tech Stack

**Backend** — Python 3, Flask 3.0, Flask-CORS 4.0

**Frontend** — React 19, Tailwind CSS, Lucide React

**ML** — GPT-2 Medium (345M params), HuggingFace Transformers 4.40, fine-tuned on 4,956 Indian court case records. **Eval Loss: 0.95 | Perplexity: 2.60**

---

## 🚀 Setup & Running

### Prerequisites

- Python 3.8+ with pip
- Node.js 18+ with npm

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python api_server.py
# → http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

> Run both servers simultaneously in separate terminals.

---

## 🤖 AI Model

The `legal-analysis.ipynb` notebook fine-tunes **GPT-2 Medium** on the legal dataset.

### Training results

| Metric            | Value                      |
| ----------------- | -------------------------- |
| Base model        | GPT-2 Medium (345M params) |
| Epochs            | 3                          |
| Eval Loss         | 0.9546                     |
| Perplexity        | **2.60**                   |
| Model size (FP16) | ~677 MB                    |

### Retrain on Kaggle (Free T4/P100 GPU)

📦 **Dataset**: [legal-dataset-india on Kaggle](https://www.kaggle.com/datasets/yashaskapoor/legal-dataset-india)

1. Open the dataset above and add it to your Kaggle notebook
2. Upload `legal-analysis.ipynb` → Settings → **GPU P100 × 1**
3. Set `DATASET_SLUG = 'yashaskapoor/legal-dataset-india'` in Cell 3
4. Run all cells (~20–30 min)
5. Download model ZIP from the Kaggle Output tab

### Prepare the dataset (before training)

```bash
python prepare_dataset.py
```

Outputs cleaned `train_split.jsonl` + `val_split.jsonl` with:

- Citations, court headers, page markers removed
- Semantic split into `common_judgement` / `different_judgement` using contrast keyword detection

### Install the model

After downloading from Kaggle, extract to:

```
/Users/yashas/Developer/legal/legal_model/
```

---

## 📊 Dataset

|                          |                                                |
| ------------------------ | ---------------------------------------------- |
| **Total records**        | 5,509                                          |
| **Train**                | 4,956 (90%)                                    |
| **Validation**           | 553 (10%)                                      |
| **IPC checkpoint files** | 77 sections                                    |
| **BNS checkpoint files** | 76 sections                                    |
| **Sources**              | Indian court judgements (2 collection batches) |

---

## ⚖️ Legal Coverage

- **Crimes against persons** — Murder (IPC 302 / BNS 103), Hurt, Assault, Kidnapping
- **Sexual offences** — Rape (IPC 376 / BNS 64), POCSO-related
- **Crimes against property** — Theft, Robbery, Dacoity, House-trespass
- **Crimes against women** — Dowry death, Stalking, Voyeurism
- **Public order** — Rioting, Unlawful assembly, Criminal conspiracy
- **Fraud / Forgery** — Cheating, Forgery, Criminal breach of trust
- **Traffic / Negligence** — Rash driving, Negligent acts

---

## 📄 License

Educational and research use only. Legal data derived from publicly available Indian court judgements.

---

_Built for navigating the IPC → BNS transition in Indian criminal law_ ⚖️
