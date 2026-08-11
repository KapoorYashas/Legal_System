# backend/data_collection/dataset_creator.py

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
    Uses official API docs - GET requests with HTTPS
    """

    def __init__(self, output_dir='legal_training_data'):
        self.api_token  = os.getenv('INDIAN_KANOON_API_TOKEN')
        # FIXED: Use HTTPS (not http)
        self.api_url    = 'https://api.indiankanoon.org'
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.all_training_data = []

        print("="*60)
        print("LEGAL DATASET CREATOR")
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

        self.ipc_sections = [
            '302', '304', '307', '376', '376C',
            '376D', '378', '392', '420', '468',
            '498A', '304B', '406'
        ]

        self.bns_sections = [
            '103', '105', '109', '63', '66',
            '70', '303', '309', '318', '336',
            '84', '80', '316'
        ]

    # ─────────────────────────────────────────
    # SEARCH  
    # ─────────────────────────────────────────

    def search_cases(self, section_type, section_number, max_pages=3):
        """
        Search cases using official API (GET + HTTPS)
        
        Official endpoint:
        GET https://api.indiankanoon.org/search/?formInput=<query>&pagenum=<num>
        """
        print(f"\n{'='*60}")
        print(f"Searching: {section_type} Section {section_number}")
        print('='*60)

        # Use API only
        results = self._search_via_api(section_type, section_number, max_pages)

        return results

    def _search_via_api(self, section_type, section_number, max_pages):
        """
        Official API search
        
        From docs:
        - Method: GET
        - URL: https://api.indiankanoon.org/search/
        - Params: formInput, pagenum, doctypes
        - Auth: Authorization: Token <token>
        - pagenum starts from 0
        """
        all_docs = []

        for page in range(max_pages):
            print(f"  [API] Page {page+1}/{max_pages}...", end=' ', flush=True)

            try:
                # FIXED: POST request to HTTPS endpoint
                response = requests.post(
                    f"{self.api_url}/search/",
                    params={
                        'formInput': f"{section_type} {section_number}",
                        'pagenum'  : page,
                        'pagesize' : 20,
                        'doctype'  : 'judgments'   # SC + HC + District Courts
                    },
                    headers={
                        # Official auth format from docs
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
        """
        Fetch document using official API
        
        From docs:
        - Method: GET
        - URL: https://api.indiankanoon.org/doc/<docid>/
        - Auth: Authorization: Token <token>
        """
        # Use API only
        return self._fetch_doc_via_api(doc_id)

    def _fetch_doc_via_api(self, doc_id):
        """
        Official API document fetch - GET request
        """
        try:
            # FIXED: GET to HTTPS
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
            '302' : ['intention to cause death', 'knowledge that act likely to cause death'],
            '103' : ['intention to cause death', 'knowledge that act likely to cause death'],
            '376' : ['without consent', 'against will', 'force or threat'],
            '63'  : ['without consent', 'against will', 'force or threat'],
            '376C': ['position of authority', 'abuse of position', 'fiduciary relationship'],
            '66'  : ['position of authority', 'abuse of position', 'fiduciary relationship'],
            '420' : ['dishonest intention', 'fraudulent means', 'deception'],
            '318' : ['dishonest intention', 'fraudulent means', 'deception'],
            '498A': ['cruelty', 'harassment', 'demand for dowry'],
            '84'  : ['cruelty', 'harassment', 'demand for dowry'],
            '304B': ['dowry death', 'within seven years', 'harassment for dowry'],
            '80'  : ['dowry death', 'within seven years', 'harassment for dowry'],
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
        print("DATASET COLLECTION STARTED")
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
        print("COLLECTION COMPLETE ✅")
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
        print(f"\n📁 Files:")
        for name in ['train.jsonl', 'val.jsonl',
                     'legal_training_data.json', 'dataset_stats.json']:
            print(f"  ✓ {name}")


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == '__main__':
    creator = LegalDatasetCreator(output_dir='legal_training_data')
    creator.collect_dataset(max_cases_per_section=10)
    print("\n✅ Done! Check legal_training_data/ folder")
