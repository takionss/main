import urllib.request
import csv
import io
import os
import json
import openpyxl

URL = "https://docs.google.com/spreadsheets/d/1RRpkarZGReZMb243IsGNQfP1Urzs5Fh24uWRbfkwVdM/export?format=xlsx"
LANGUAGES = ['ko', 'en', 'es', 'ja', 'zh-TW']
WALLPAPER_GROUPS = ['배경화면', 'Wallpaper', 'Wallpapers', 'Background', 'Backgrounds', 'Fondo de pantalla', '壁紙', '背景', '背景图片']

def main():
    print(f"Downloading Google Sheets Excel from {URL}...")
    temp_filename = "temp_sheets.xlsx"
    try:
        req = urllib.request.Request(
            URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            with open(temp_filename, 'wb') as f:
                f.write(response.read())
    except Exception as e:
        print(f"Error downloading Excel file: {e}")
        return

    # Load Excel file
    try:
        wb = openpyxl.load_workbook(temp_filename, data_only=True)
    except Exception as e:
        print(f"Error loading Excel workbook: {e}")
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        return

    # 1. Resolve the primary Korean (ko) sheet
    ko_sheet_name = None
    possible_ko_names = ['ko', '시트1', 'Sheet1']
    for name in possible_ko_names:
        if name in wb.sheetnames:
            ko_sheet_name = name
            break
            
    # Fallback to the first sheet if none of the above are matched
    if not ko_sheet_name and len(wb.sheetnames) > 0:
        ko_sheet_name = wb.sheetnames[0]
        
    if not ko_sheet_name:
        print("Error: No sheets found in the workbook.")
        wb.close()
        os.remove(temp_filename)
        return
        
    print(f"Resolved primary (ko) sheet as: '{ko_sheet_name}'")

    # Helper function to parse a sheet
    def parse_sheet(sheet):
        rows_data = []
        default_icon = "images/world.png"
        for row_idx, row in enumerate(sheet.iter_rows(values_only=True), 1):
            if row_idx == 1:
                continue # Skip header
            if not row or all(cell is None or str(cell).strip() == '' for cell in row):
                continue
                
            row_list = list(row)
            while len(row_list) < 5:
                row_list.append('')
                
            name = str(row_list[0] or '').strip()
            group = str(row_list[1] or '').strip()
            url = str(row_list[2] or '').strip()
            icon = str(row_list[3] or '').strip()
            desc = str(row_list[4] or '').strip()
            
            if not group:
                group = "기타"
            if not icon:
                icon = default_icon
                
            rows_data.append({
                'name': name,
                'group': group,
                'url': url,
                'icon': icon,
                'desc': desc
            })
        return rows_data

    # Parse primary data
    ko_rows = parse_sheet(wb[ko_sheet_name])
    
    multilang_data = {}
    
    for lang in LANGUAGES:
        sheet_rows = None
        if lang == 'ko':
            sheet_rows = ko_rows
        elif lang in wb.sheetnames:
            print(f"Processing language sheet: {lang}")
            sheet_rows = parse_sheet(wb[lang])
        else:
            # Fallback: copy ko rows if localized tab doesn't exist yet
            print(f"Language sheet '{lang}' not found. Falling back to primary (ko) sheet data.")
            sheet_rows = ko_rows
            
        # 1. Save language-specific CSV cache
        filepaths = [f"tools_{lang}.csv"]
        if lang == 'ko':
            filepaths.append("tools.csv")
            
        fieldnames = ['name', 'group', 'url', 'icon', 'desc']
        for filepath in filepaths:
            with open(filepath, 'w', encoding='utf-8', newline='') as out_f:
                writer = csv.DictWriter(out_f, fieldnames=fieldnames)
                writer.writeheader()
                for row in sheet_rows:
                    writer.writerow(row)
                    
        # 2. Group rows for Jekyll
        grouped = []
        group_map = {}
        for row in sheet_rows:
            gname = row['group']
            # Skip wallpapers
            if not row['url'] or gname in WALLPAPER_GROUPS:
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
            
        multilang_data[lang] = grouped

    # Save to _data/tools_multilang.json
    os.makedirs("_data", exist_ok=True)
    print("Saving combined JSON to _data/tools_multilang.json...")
    with open('_data/tools_multilang.json', 'w', encoding='utf-8') as out_json:
        json.dump(multilang_data, out_json, ensure_ascii=False, indent=2)

    # Clean up temp file
    wb.close()
    if os.path.exists(temp_filename):
        os.remove(temp_filename)
        
    print("Success! Multi-language data extraction and caching complete.")

if __name__ == "__main__":
    main()
