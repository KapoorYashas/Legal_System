    def search_cases(self, section_type, section_number, max_pages=3):
        """
        Search cases for a specific section using POST method
        
        Args:
            section_type: 'IPC' or 'BNS'
            section_number: Section number
            max_pages: Number of pages to fetch
        
        Returns:
            List of case documents
        """
        print(f"\n{'='*60}")
        print(f"Searching: {section_type} Section {section_number}")
        print('='*60)
        
        all_docs = []
        
        for page in range(max_pages):
            print(f"  Page {page + 1}/{max_pages}...", end=' ')
            
            try:
                # USE POST METHOD (not GET)
                response = requests.post(
                    f"{self.api_url}/search/",
                    data={
                        'formInput': f"{section_type} {section_number}",
                        'pagenum': page,
                        'pagesize': 20,
                        'doctype': 'judgment'
                    },
                    headers={
                        'Authorization': f'Token {self.api_token}',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout=30
                )
                
                print(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    docs = data.get('docs', [])
                    
                    if not docs:
                        print("No more results")
                        break
                    
                    all_docs.extend(docs)
                    print(f"✓ Found {len(docs)} cases")
                    
                elif response.status_code == 429:
                    print("Rate limit hit, waiting 60s...")
                    time.sleep(60)
                    continue
                else:
                    print(f"Error: {response.status_code}")
                    print(f"Response: {response.text[:200]}")
                    break
                
                time.sleep(2)  # Rate limiting
                
            except Exception as e:
                print(f"Error: {e}")
                break
        
        print(f"  Total cases found: {len(all_docs)}")
        return all_docs    