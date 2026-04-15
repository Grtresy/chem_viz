import os
import pandas as pd
import json


base_dir = os.path.dirname(os.path.abspath(__file__))

SOURCE_DIR = os.path.join(base_dir, 'raw_data')
DATA_OUTPUT_DIR = os.path.join(base_dir, 'public', 'api') 
MENU_OUTPUT_FILE = os.path.join(base_dir, 'public', 'menu.json')

def process_data():
    menu_structure = {}
    if not os.path.exists(DATA_OUTPUT_DIR): os.makedirs(DATA_OUTPUT_DIR)

    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.endswith(".csv") or file.endswith(".XLS"):
                category = os.path.basename(root)
                molecule_name = os.path.splitext(file)[0]
                cat_dir = os.path.join(DATA_OUTPUT_DIR, category)
                if not os.path.exists(cat_dir): os.makedirs(cat_dir)
                file_path = os.path.join(root, file)
                
                try:
                    df = pd.read_csv(file_path, sep=',', engine='python')
                    df.columns = [c.strip() for c in df.columns]
                    data_points = []
                    
                    for index, row in df.iterrows():
                        try:
                            # 你的数据提取逻辑 (保持不变)
                            # ... (为了节省篇幅，这里省略具体的提取代码，请把之前的逻辑填回来)
                            # 假设你已经提取好放在 data_points 列表里了
                             tc = float(row['T_c (K)'])
                             pc = float(row['p_c (Pa)'])
                             data_points.append({
                                'T': float(row['T_r (-)']) * tc,
                                'P': float(row['p_r (-)']) * pc,
                                'Z': float(row.get('Z (-)', row.get('z (-)'))),
                                'Phi': float(row['phi (-)']),
                                'H': float(row['H (J/mol)']),
                                'S': float(row['S (J/mol/K)']),
                                'no': int(row['no'])
                            })
                        except: continue

                    if data_points:
                        # === 核心修改开始 ===
                        
                        # 1. 保存完整版 (Full)
                        full_name = f"{molecule_name}.json"
                        with open(os.path.join(cat_dir, full_name), 'w', encoding='utf-8') as f:
                            json.dump({'name': molecule_name, 'data': data_points}, f)

                        # 2. 保存预览版 (Preview) - 每隔 50 个点取 1 个 (约为 2% 的数据量)
                        # 这样几 MB 的文件瞬间变几十 KB
                        preview_points = data_points[::50] 
                        preview_name = f"{molecule_name}_preview.json"
                        with open(os.path.join(cat_dir, preview_name), 'w', encoding='utf-8') as f:
                            json.dump({'name': molecule_name, 'data': preview_points}, f)

                        # 3. 菜单里存两个地址
                        if category not in menu_structure: menu_structure[category] = []
                        
                        menu_structure[category].append({
                            'name': molecule_name,
                            'previewUrl': f"api/{category}/{preview_name}", # 预览地址
                            'fullUrl': f"api/{category}/{full_name}"       # 完整地址
                        })
                        print(f"Generated Full & Preview for: {molecule_name}")
                        # === 核心修改结束 ===

                except Exception as e:
                    print(f"Error: {e}")

    with open(MENU_OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(menu_structure, f)

if __name__ == "__main__":
    process_data()