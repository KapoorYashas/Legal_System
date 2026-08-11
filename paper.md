# Technical Report: Fine-Tuning GPT-2 Medium for Indian Legal Case Justification

## 1. Abstract
This project implements a specialized Legal Expert System designed to assist in navigating the transition from the Indian Penal Code (IPC) to the Bharatiya Nyaya Sanhita (BNS). The core of the system is a fine-tuned GPT-2 Medium language model capable of generating semantic justifications and identifying judicial patterns (Common vs. Notable judgements) based on approximately 5,500 real-world Indian court records.

## 2. Model Architecture
- **Base Model:** `gpt2-medium` (Generative Pre-trained Transformer 2).
- **Parameters:** 345 million.
- **Layers:** 24 transformer blocks with 16 attention heads each.
- **Hidden Dimension:** 1024.
- **Context Window:** 1024 tokens (optimized to 256 during training for efficiency).
- **Format:** Autoregressive causal language model.

## 3. Dataset Characteristics
The model was trained on the **Legal Dataset India**, comprising 5,509 high-quality legal records.
- **Training Set:** 4,956 records (90%).
- **Validation Set:** 553 records (10%).
- **Data Structure:** Instruction-following format.
  - **Instruction:** Task-specific prompt (e.g., "Summarize this case related to IPC Section 302").
  - **Input:** Case facts, citations, and court headers.
  - **Output:** The semantic justification, categorized into *Common* (standard applications) and *Different* (exceptional/notable judgements) based on contrast keyword detection.

## 4. Training Methodology
The fine-tuning process employed **Instruction Fine-Tuning** to align the general-purpose GPT-2 model with legal domain specificities.

### 4.1 Hyperparameters
| Hyperparameter | Value |
|---|---|
| Epochs | 5 |
| Learning Rate | 5e-5 (AdamW) |
| Batch Size | 4 |
| Gradient Accumulation Steps | 4 (Effective Batch Size: 16) |
| Max Sequence Length | 256 tokens |
| Warmup Steps | 100 |
| Weight Decay | 0.01 |
| Precision | Mixed Precision (FP16) |

### 4.2 Training Infrastructure
- **Hardware:** Tesla P100-PCIE-16GB / Tesla T4 GPU (Kaggle Environment).
- **Runtime:** Approximately 20–30 minutes for total convergence.
- **Final Metrics:** 
  - **Eval Loss:** 0.9546
  - **Perplexity:** 2.60

## 5. Software Stack & Dependencies
The following core libraries and frameworks were utilized for the model's development and deployment:
- **PyTorch (v2.9.0+cu126):** Deep learning framework for model execution and gradient computation.
- **HuggingFace Transformers:** Provided the core `GPT2LMHeadModel` and `GPT2Tokenizer`.
- **HuggingFace Datasets:** Used for efficient data streaming and tokenization.
- **Accelerate:** Optimized training across available GPU hardware.
- **Flask:** Serves the model via a REST API for the frontend application.

## 6. Functional Capability
The model performs **Semantic Justification Extraction**. Unlike simple keyword matching, the model understands the context of legal sections. It processes raw case data to:
1.  **Extract Rationale:** Identifies the "why" behind a court's decision.
2.  **Pattern Recognition:** Differentiates between standard outcomes (e.g., bail granted in petty theft) and exceptional ones (e.g., quashed FIRs due to lack of evidence).
3.  **Cross-Legal Mapping:** Synthesizes descriptions from both IPC and BNS categories to provide a "Conclusion" that summarizes the core trigger for a law's application.

## 7. Conclusion
By leveraging a 345M parameter transformer model with domain-specific instruction tuning, the system achieves a low perplexity of 2.60, indicating high confidence in generating legally coherent summaries that reflect the actual trends in Indian jurisprudence.
