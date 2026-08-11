# backend/data_collection/dataset_creator_2.py
# BATCH 2 — Second half of IPC & BNS sections from legal_expert_system.py

import requests
import json
import time
from datetime import datetime
from pathlib import Path
import os
from dotenv import load_dotenv
from bs4 import BeautifulSoup

load_dotenv()


class LegalDatasetCreator:
    """
    Creates training dataset from Indian Kanoon API
    Uses official API docs - POST requests with HTTPS
    BATCH 2: Second 50% of IPC and BNS sections
    """

    def __init__(self, output_dir='legal_training_data_batch2'):
        self.api_token  = os.getenv('INDIAN_KANOON_API_TOKEN')
        self.api_url    = 'https://api.indiankanoon.org'
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.all_training_data = []

        print("="*60)
        print("LEGAL DATASET CREATOR — BATCH 2")
        print("="*60)
        if self.api_token:
            print(f"✓ API Token: {self.api_token[:10]}...")
        else:
            print("❌ No API token found in .env!")
            print("   Add INDIAN_KANOON_API_TOKEN=your_token to .env")
            exit(1)
        print(f"✓ API URL  : {self.api_url}")
        print(f"✓ Output   : {self.output_dir}")
        print("="*60)

        # ── BATCH 2 : Second half of all IPC sections ─────────────
        self.ipc_sections = [
            # Rape (second half)
            '376(C)', '376(B)', '376(DA)', '376(DB)', '376(E)',
            # Thefts
            '379', '380', '382', '384', '392', '395', '396', '356',
            # Forgery
            '468', '470', '471',
            # Nuisance
            '290', '228A',
            # Kidnap / Abduction
            '363', '363(a)', '362', '364', '364(A)', '365', '367', '370', '370(A)',
            # Cheating
            '417', '419', '420',
            # Misappropriation
            '406', '408', '409',
            # Suicides / Attempt
            '306', '307',
            # Other
            '120(b)', '153(a)', '353', '506', '506(2)',
        ]

        # ── BATCH 2 : Matching BNS sections ───────────────────────
        self.bns_sections = [
            # Rape (second half)
            '68', '70(1)', '70(2)', '70', '71',
            # Thefts
            '303(2)', '305', '307', '308(2)', '309(4)', '310(2)', '310(3)', '134',
            # Forgery
            '353(3)', '340',
            # Nuisance
            '292', '72',
            # Kidnap / Abduction
            '137(2)', '139', '138', '140', '140(2)', '140(3)', '140(4)', '143', '144',
            # Cheating
            '318(2)', '319(2)', '318(4)',
            # Misappropriation
            '316(2)', '316(4)', '316(5)',
            # Suicides / Attempt
            '108', '109',
            # Other
            '61(2)', '196', '132', '351(2)', '351(3)',
        ]

    # ─────────────────────────────────────────
    # SEARCH
    # ─────────────────────────────────────────

    def search_cases(self, section_type, section_number, max_pages=3):
        """
        Search cases using official API (POST + HTTPS)
        """
        print(f"\n{'='*60}")
        print(f"Searching: {section_type} Section {section_number}")
        print('='*60)
        return self._search_via_api(section_type, section_number, max_pages)

    def _search_via_api(self, section_type, section_number, max_pages):
        all_docs = []

        for page in range(max_pages):
            print(f"  [API] Page {page+1}/{max_pages}...", end=' ', flush=True)

            try:
                response = requests.post(
                    f"{self.api_url}/search/",
                    params={
                        'formInput': f"{section_type} {section_number}",
                        'pagenum'  : page,
                        'pagesize' : 20,
                        'doctype'  : 'judgments'
                    },
                    headers={
                        'Authorization': f'Token {self.api_token}'
                    },
                    timeout=30
                )

                print(f"Status {response.status_code}", end=' ')

                if response.status_code == 200:
                    data = response.json()
                    docs = data.get('docs', [])

                    if not docs:
                        print("- no more results")
                        break

                    all_docs.extend(docs)
                    print(f"- found {len(docs)} cases "
                          f"(total found: {data.get('found', '?')})")

                elif response.status_code == 429:
                    print("- rate limited, waiting 60s...")
                    time.sleep(60)
                    continue

                elif response.status_code == 403:
                    print("- 403 Forbidden: check API token")
                    break

                else:
                    print(f"- error: {response.text[:100]}")
                    break

                time.sleep(2)

            except Exception as e:
                print(f"- exception: {e}")
                break

        print(f"  API total: {len(all_docs)} cases")
        return all_docs

    # ─────────────────────────────────────────
    # FETCH FULL DOCUMENT
    # ─────────────────────────────────────────

    def fetch_full_document(self, doc_id):
        return self._fetch_doc_via_api(doc_id)

    def _fetch_doc_via_api(self, doc_id):
        try:
            response = requests.post(
                f"{self.api_url}/doc/{doc_id}/",
                headers={
                    'Authorization': f'Token {self.api_token}'
                },
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                if data.get('doc'):
                    print(f"      ✓ doc {doc_id} (API)", flush=True)
                    return data

            elif response.status_code == 429:
                print(f"      Rate limited - waiting 60s...")
                time.sleep(60)
                return self._fetch_doc_via_api(doc_id)  # retry

            elif response.status_code == 403:
                print(f"      403 Forbidden - token issue")

            return None

        except Exception as e:
            print(f"      API error for {doc_id}: {e}")
            return None

    # ─────────────────────────────────────────
    # TEXT EXTRACTION
    # ─────────────────────────────────────────

    def extract_text_from_html(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        for tag in soup(['script', 'style']):
            tag.decompose()
        return ' '.join(soup.get_text().split())

    def extract_facts(self, text):
        low  = text.lower()
        keys = [
            'brief facts', 'facts of the case', 'factual background',
            'prosecution case', 'facts are', 'facts in brief'
        ]
        start = next((low.find(k) for k in keys if low.find(k) != -1), -1)
        if start == -1:
            return text[:1000]

        ends = [
            'held:', 'judgment:', 'decision:',
            'we have heard', 'this court', 'law on the point'
        ]
        end = next(
            (low.find(e, start + 100) for e in ends if low.find(e, start + 100) != -1),
            len(text)
        )
        return text[start:end][:2000].strip()

    def extract_judgment(self, text):
        low  = text.lower()
        keys = [
            'held:', 'judgment:', 'decision:', 'conclusion:',
            'we hold', 'it is held', 'accordingly', 'in the result'
        ]
        start = next((low.find(k) for k in keys if low.find(k) != -1), -1)
        if start == -1:
            return text[-1000:]
        return text[start:start + 1500].strip()

    # ─────────────────────────────────────────
    # TRAINING EXAMPLE CREATION
    # ─────────────────────────────────────────

    def create_training_examples(self, doc, section_type, section_number):
        examples = []

        html = doc.get('doc', '')
        if not html:
            return examples

        text     = self.extract_text_from_html(html)
        title    = doc.get('title', 'Unknown Case')
        facts    = self.extract_facts(text)
        judgment = self.extract_judgment(text)

        if not facts or not judgment:
            return examples

        conditions = self._extract_conditions(facts, judgment, section_number)

        # 1 – Summarization
        examples.append({
            'instruction': (
                f'Summarize this case related to {section_type} '
                f'Section {section_number} in 2-3 sentences.'
            ),
            'input' : f"Case: {title}\n\nFacts: {facts[:700]}",
            'output': judgment[:300]
        })

        # 2 – Condition extraction
        examples.append({
            'instruction': (
                f'What are the key conditions for {section_type} '
                f'Section {section_number} to apply?'
            ),
            'input' : f"Facts: {facts[:600]}",
            'output': conditions
        })

        # 3 – Judgment
        examples.append({
            'instruction': "What was the court's decision and reasoning?",
            'input' : f"Case: {title}\n\nFacts: {facts[:500]}",
            'output': judgment[:400]
        })

        # 4 – Legal application
        examples.append({
            'instruction': (
                f'Explain how {section_type} Section {section_number} '
                f'applies in this case.'
            ),
            'input' : f"Facts: {facts[:600]}",
            'output': (
                f"In this case, {section_type} Section {section_number} "
                f"applies because: {judgment[:350]}"
            )
        })

        return examples

    def _extract_conditions(self, facts, judgment, section_number):
        text = (facts + ' ' + judgment).lower()

        condition_map = {
            '420'    : ['dishonest intention', 'fraudulent means', 'deception'],
            '318(4)' : ['dishonest intention', 'fraudulent means', 'deception'],
            '419'    : ['cheating by personation', 'impersonation', 'deception'],
            '319(2)' : ['cheating by personation', 'impersonation', 'deception'],
            '406'    : ['criminal breach of trust', 'misappropriation', 'dishonest use'],
            '316(2)' : ['criminal breach of trust', 'misappropriation', 'dishonest use'],
            '306'    : ['abetment', 'instigation', 'conspiracy to suicide'],
            '108'    : ['abetment', 'instigation', 'conspiracy to suicide'],
            '307'    : ['attempt to murder', 'intention to cause death'],
            '109'    : ['attempt to murder', 'intention to cause death'],
            '370'    : ['trafficking', 'exploitation', 'recruitment by deception'],
            '143'    : ['trafficking', 'exploitation', 'recruitment by deception'],
            '376(C)' : ['position of authority', 'abuse of position', 'fiduciary relationship'],
            '68'     : ['position of authority', 'abuse of position', 'fiduciary relationship'],
            '392'    : ['robbery', 'theft with hurt', 'wrongful restraint'],
            '309(4)' : ['robbery', 'theft with hurt', 'wrongful restraint'],
            '468'    : ['forgery', 'cheating', 'fraudulent document'],
            '353(3)' : ['forgery', 'cheating', 'fraudulent document'],
        }

        matched = [
            kw.capitalize()
            for kw in condition_map.get(section_number, [])
            if kw in text
        ]

        return (
            '; '.join(matched[:3]) if matched
            else f'Case demonstrates application of Section {section_number}'
        )

    # ─────────────────────────────────────────
    # MAIN COLLECTION
    # ─────────────────────────────────────────

    def collect_dataset(self, max_cases_per_section=10):
        print("\n" + "="*60)
        print("DATASET COLLECTION STARTED — BATCH 2")
        print("="*60)
        print(f"IPC sections   : {len(self.ipc_sections)}")
        print(f"BNS sections   : {len(self.bns_sections)}")
        print(f"Max per section: {max_cases_per_section}")
        print("="*60)

        total_cases    = 0
        total_examples = 0

        for label, sections in [('IPC', self.ipc_sections),
                                 ('BNS', self.bns_sections)]:

            print(f"\n📚 COLLECTING {label} SECTIONS...")

            for idx, section in enumerate(sections, 1):
                print(f"\n[{idx}/{len(sections)}] {label} {section}")

                try:
                    results = self.search_cases(label, section, max_pages=2)

                    if not results:
                        print(f"  ⚠ No results found")
                        continue

                    cases_done = 0
                    for doc_meta in results[:max_cases_per_section]:
                        try:
                            full_doc = self.fetch_full_document(doc_meta['tid'])

                            if full_doc:
                                examples = self.create_training_examples(
                                    full_doc, label, section
                                )
                                if examples:
                                    self.all_training_data.extend(examples)
                                    total_examples += len(examples)
                                    cases_done     += 1

                            time.sleep(2)

                        except Exception as e:
                            print(f"    ✗ {doc_meta['tid']}: {e}")
                            continue

                    total_cases += cases_done
                    print(
                        f"  ✓ {label} {section}: "
                        f"{cases_done} cases → {cases_done * 4} examples"
                    )

                    self._save_checkpoint(f'{label.lower()}_{section}')
                    time.sleep(5)

                except Exception as e:
                    print(f"  ✗ Section error: {e}")
                    continue

        self._save_final_dataset()

        print("\n" + "="*60)
        print("COLLECTION COMPLETE ✅ — BATCH 2")
        print("="*60)
        print(f"Cases collected  : {total_cases}")
        print(f"Training examples: {total_examples}")
        print(f"Output directory : {self.output_dir}")
        print("="*60)

    # ─────────────────────────────────────────
    # SAVE HELPERS
    # ─────────────────────────────────────────

    def _save_checkpoint(self, name):
        path = self.output_dir / f'checkpoint_{name}.json'
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(self.all_training_data, f, indent=2, ensure_ascii=False)

    def _save_final_dataset(self):
        # Deduplicate
        seen, unique = set(), []
        for item in self.all_training_data:
            key = item['instruction'] + item['input'][:100]
            if key not in seen:
                seen.add(key)
                unique.append(item)
        self.all_training_data = unique

        # Shuffle & split 90/10
        import random
        random.seed(42)
        data = self.all_training_data[:]
        random.shuffle(data)

        split      = int(len(data) * 0.9)
        train_data = data[:split]
        val_data   = data[split:]

        def write_jsonl(path, rows):
            with open(path, 'w', encoding='utf-8') as f:
                for r in rows:
                    f.write(json.dumps(r, ensure_ascii=False) + '\n')

        write_jsonl(self.output_dir / 'train.jsonl', train_data)
        write_jsonl(self.output_dir / 'val.jsonl',   val_data)

        with open(self.output_dir / 'legal_training_data.json',
                  'w', encoding='utf-8') as f:
            json.dump(self.all_training_data, f, indent=2, ensure_ascii=False)

        stats = {
            'total'      : len(self.all_training_data),
            'train'      : len(train_data),
            'val'        : len(val_data),
            'created_at' : datetime.now().isoformat()
        }
        with open(self.output_dir / 'dataset_stats.json', 'w') as f:
            json.dump(stats, f, indent=2)

        print(f"\n📊 Final stats:")
        print(f"  Total   : {stats['total']}")
        print(f"  Train   : {stats['train']}")
        print(f"  Val     : {stats['val']}")
        print(f"\n📁 Files saved to: {self.output_dir}/")
        for name in ['train.jsonl', 'val.jsonl',
                     'legal_training_data.json', 'dataset_stats.json']:
            print(f"  ✓ {name}")


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == '__main__':
    creator = LegalDatasetCreator(output_dir='legal_training_data_batch2')
    creator.collect_dataset(max_cases_per_section=10)
    print("\n✅ Done! Check legal_training_data_batch2/ folder")
