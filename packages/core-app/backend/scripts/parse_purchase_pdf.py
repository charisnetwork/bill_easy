import sys
import json
import pdfplumber
import re
import os

def extract_purchase_data(pdf_path):
    data = {
        "items": [],
        "bill_number": "",
        "bill_date": "",
        "total_amount": 0
    }

    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            for page in pdf.pages:
                full_text += page.extract_text() or ""
                
                # Extract tables
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        # Clean row: remove None and empty strings
                        clean_row = [cell.strip() if cell else "" for cell in row]
                        if not any(clean_row):
                            continue
                        
                        # Heuristic to identify product row:
                        # Usually has a numeric quantity and a numeric price/rate
                        # We look for a row where at least one cell looks like a number
                        numbers = []
                        for cell in clean_row:
                            # Extract numbers from cell
                            found = re.findall(r"[-+]?\d*\.\d+|\d+", cell.replace(',', ''))
                            if found:
                                numbers.extend([float(f) for f in found])
                        
                        if len(numbers) >= 2:
                            # Potential item row
                            # Try to identify which cell is the name
                            # Name is usually the longest non-numeric cell
                            name = ""
                            max_len = 0
                            for cell in clean_row:
                                if not re.search(r"\d", cell) and len(cell) > max_len:
                                    name = cell
                                    max_len = len(cell)
                            
                            # If no purely text cell, take the first non-numeric one
                            if not name:
                                for cell in clean_row:
                                    if len(re.findall(r"[a-zA-Z]", cell)) > 3:
                                        name = cell
                                        break
                            
                            if name and len(name) > 2:
                                # We have a name and some numbers
                                # Standard order: Qty, Rate, Total
                                # But it varies. Let's try to be smart.
                                qty = 0
                                price = 0
                                
                                # Heuristic: Qty is usually a whole number or small decimal
                                # Rate/Price is usually larger
                                sorted_nums = sorted(numbers)
                                if len(sorted_nums) >= 2:
                                    qty = sorted_nums[0]
                                    price = sorted_nums[1]
                                    
                                    # If they are very similar, or it's hard to tell, 
                                    # we might need better logic, but for now:
                                    data["items"].append({
                                        "name": name,
                                        "quantity": qty,
                                        "unit_price": price,
                                        "tax_rate": 18, # Default
                                        "is_new": True
                                    })

            # Extract bill number and date using regex from full text
            bill_match = re.search(r"(?:Bill|Invoice|No|Number)[:.\s#]+([A-Z0-9\-\/]+)", full_text, re.IGNORECASE)
            if bill_match:
                data["bill_number"] = bill_match.group(1)

            date_match = re.search(r"(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})", full_text)
            if date_match:
                data["bill_date"] = date_match.group(1)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    print(json.dumps(data))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF path provided"}))
        sys.exit(1)
    
    extract_purchase_data(sys.argv[1])
