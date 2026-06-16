import urllib.request
import csv
import io
import os
import json

URL = "https://docs.google.com/spreadsheets/d/1RRpkarZGReZMb243IsGNQfP1Urzs5Fh24uWRbfkwVdM/export?format=csv&gid=0"

def main():
    print(f"Downloading Google Sheets from {URL}...")
    try:
        req = urllib.request.Request(
            URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            csv_content = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error downloading CSV: {e}")
        return

    # Process and clean data
    f = io.StringIO(csv_content)
    reader = csv.reader(f)
    
    # Read header
    try:
        original_header = next(reader)
        print(f"Original header: {original_header}")
    except StopIteration:
        print("CSV is empty.")
        return

    cleaned_rows = []
    default_icon = "images/world.png"

    for row in reader:
        if not row or all(cell.strip() == '' for cell in row):
            continue
        
        while len(row) < 5:
            row.append('')
            
        name = row[0].strip()
        group = row[1].strip()
        url = row[2].strip()
        icon = row[3].strip()
        desc = row[4].strip()
        
        if not group:
            group = "기타"
        if not icon:
            icon = default_icon
            
        cleaned_rows.append({
            'name': name,
            'group': group,
            'url': url,
            'icon': icon,
            'desc': desc
        })

    os.makedirs("_data", exist_ok=True)

    # 1. Save tools.csv (for index_win.html and direct access)
    fieldnames = ['name', 'group', 'url', 'icon', 'desc']
    print("Saving cleaned CSV to tools.csv...")
    with open('tools.csv', 'w', encoding='utf-8', newline='') as out_f:
        writer = csv.DictWriter(out_f, fieldnames=fieldnames)
        writer.writeheader()
        for row in cleaned_rows:
            writer.writerow(row)

    # 2. Group rows and save to _data/tools_grouped.json (for Jekyll static rendering)
    grouped = []
    group_map = {}
    for row in cleaned_rows:
        gname = row['group']
        if gname == '배경화면':
            continue
        if gname not in group_map:
            group_obj = {'name': gname, 'items': []}
            grouped.append(group_obj)
            group_map[gname] = group_obj
        group_map[gname]['items'].append({
            'name': row['name'],
            'url': row['url'],
            'icon': row['icon'],
            'desc': row['desc']
        })

    print("Saving grouped JSON to _data/tools_grouped.json...")
    with open('_data/tools_grouped.json', 'w', encoding='utf-8') as out_json:
        json.dump(grouped, out_json, ensure_ascii=False, indent=2)

    print("Success! Download, cleanup, and grouping completed.")

if __name__ == "__main__":
    main()
