import pandas as pd
import os

# 1. 动态获取脚本所在的绝对路径 (chem_viz 目录)
base_dir = os.path.dirname(os.path.abspath(__file__))

# 2. 拼接出测试文件的完整路径
# 请注意检查这里的文件夹名字是否和你电脑上的一模一样（比如空格、括号）
test_file = os.path.join(base_dir, 'raw_data', 'data-1-common alkane (17)', 'Methane.csv')

print(f"正在尝试读取文件: {test_file}")

if not os.path.exists(test_file):
    print("\n❌ 错误: 依然找不到文件！")
    print("请检查路径中 'data-1-common alkane (17)' 这个文件夹的名字是否拼写正确？")
    print("你的 raw_data 目录下实际有哪些文件夹：")
    try:
        print(os.listdir(os.path.join(base_dir, 'raw_data')))
    except:
        print("无法读取 raw_data 目录")
    exit()

try:
    print("\n=== 尝试使用 Tab (\\t) 分隔符 ===")
    df = pd.read_csv(test_file, sep='\t', engine='python')
    print("读取到的列名:", df.columns.tolist())
    print("第一行数据样例:", df.iloc[0].to_dict())
except Exception as e:
    print(f"Tab 读取失败: {e}")
    
    print("\n=== 尝试智能推断分隔符 ===")
    try:
        df = pd.read_csv(test_file, sep=None, engine='python')
        print("读取到的列名:", df.columns.tolist())
        print("第一行数据样例:", df.iloc[0].to_dict())
    except Exception as e2:
        print(f"智能读取也失败了: {e2}")