const dataCache = {};

let currentMoleculeData = null; // 存储当前加载的分子数据
const REGION_COLORS = { 1: '#E699A7', 2: '#FEDD9E', 3: '#A6D9C0', 4: '#71A7D2' };
const REGION_LABELS = { 1: '气相区 (Gas)', 2: '液相区 (Liquid)', 3: '相变区 (Phase Change)', 4: '临界区 (Critical)' };

document.addEventListener('DOMContentLoaded', async () => {
    // 1. 只加载菜单，速度极快
    try {
        const response = await fetch('menu.json');
        const menuData = await response.json();
        buildSidebar(menuData);
    } catch (e) {
        console.error("无法加载菜单", e);
    }

    // 监听切换事件
    document.getElementById('metric-select').addEventListener('change', () => {
        if (currentMoleculeData) renderPlots(currentMoleculeData);
    });
});

function buildSidebar(menuData) {
    const tree = document.getElementById('file-tree');
    const categories = Object.keys(menuData).sort();

    categories.forEach(cat => {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder-name';
        folderDiv.textContent = `📂 ${cat}`;

        const listDiv = document.createElement('div');
        listDiv.className = 'file-list';

        folderDiv.onclick = () => {
            listDiv.style.display = listDiv.style.display === 'block' ? 'none' : 'block';
        };

        menuData[cat].forEach(item => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-item';
            fileDiv.textContent = `📄 ${item.name}`;

            // 【关键】点击时的逻辑
            fileDiv.onclick = async () => {
                document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
                fileDiv.classList.add('active');
                await loadMoleculeProgressive(item.previewUrl, item.fullUrl, item.name, cat);
            };
            listDiv.appendChild(fileDiv);
        });

        tree.appendChild(folderDiv);
        tree.appendChild(listDiv);
    });
}

// 新增：渐进式加载数据的函数
async function loadMoleculeProgressive(previewUrl, fullUrl, name, category) {
    const titleEl = document.getElementById('current-title');
    try {
        titleEl.textContent = `${name} (加载预览中...)`;
        let previewData;
        if (dataCache[previewUrl]) previewData = dataCache[previewUrl];
        else {
            const res = await fetch(previewUrl);
            if (!res.ok) throw new Error('预览文件未找到');
            previewData = await res.json();
            dataCache[previewUrl] = previewData;
        }
        currentMoleculeData = previewData;
        renderPlots(previewData, true);
        titleEl.textContent = `${name} (预览模式 - 正在下载高清数据...)`;
    } catch (e) {
        console.error('预览加载失败', e);
    }
    try {
        let fullData;
        if (dataCache[fullUrl]) fullData = dataCache[fullUrl];
        else {
            const res = await fetch(fullUrl);
            if (!res.ok) throw new Error('完整文件未找到');
            fullData = await res.json();
            dataCache[fullUrl] = fullData;
        }
        currentMoleculeData = fullData;
        renderPlots(fullData, false);
        titleEl.textContent = `${name} (${category})`;
    } catch (e) {
        console.error('完整数据加载失败', e);
        titleEl.textContent = `${name} (加载完整版失败，仅显示预览)`;
    }
}

// 新增：加载数据的函数
async function loadMoleculeData(url, name, category) {
    try {
        // --- 新增：检查缓存 ---
        if (dataCache[url]) {
            console.log("从缓存读取数据:", name);
            currentMoleculeData = dataCache[url];
            document.getElementById('current-title').textContent = `${name} (${category})`;
            renderPlots(currentMoleculeData);
            return;
        }
        // ---------------------

        const res = await fetch(url);
        if (!res.ok) throw new Error("文件未找到");

        const data = await res.json();

        // --- 新增：写入缓存 ---
        dataCache[url] = data;
        // ---------------------

        currentMoleculeData = data;
        document.getElementById('current-title').textContent = `${name} (${category})`;
        renderPlots(data);

    } catch (err) {
        console.error(err);
        document.getElementById('current-title').textContent = `加载失败: ${err.message}`;
    }
}

function renderPlots(moleculeData, isPreview = false) {
    if (!moleculeData) return;
    const metric = document.getElementById('metric-select').value;
    const METRIC_LABELS = {
        'Z': '压缩因子 Z',
        'Phi': '逸度系数 Phi',
        'H': '摩尔焓 H (J/mol)',
        'S': '摩尔熵 S (J/mol/K)'
    };
    const metricLabel = METRIC_LABELS[metric];
    const dataPoints = moleculeData.data;
    const traces3d = [];
    [1, 2, 3, 4].forEach(regionNo => {
        const points = dataPoints.filter(d => d.no === regionNo);
        if (points.length === 0) return;
        traces3d.push({
            x: points.map(d => d.P),
            y: points.map(d => d.T),
            z: points.map(d => d[metric]),
            mode: 'markers',
            type: 'scatter3d',
            name: REGION_LABELS[regionNo],
            marker: {
                size: isPreview ? 3 : 2,
                color: REGION_COLORS[regionNo],
                opacity: isPreview ? 0.5 : 0.8
            }
        });
    });
    const layout3d = {
        title: `3D图: ${metricLabel} ${isPreview ? '(低清预览)' : ''}`,
        uirevision: 'true',
        scene: {
            xaxis: { title: '压力 P (Pa)' },
            yaxis: { title: '温度 T (K)' },
            zaxis: { title: metricLabel }
        },
        margin: { l: 0, r: 0, b: 0, t: 40 },
        legend: { x: 0, y: 1 }
    };
    Plotly.react('plot-3d', traces3d, layout3d);
    const traces2d = [];
    const allValues = dataPoints.map(d => d[metric]);
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    [1, 2, 3, 4].forEach(regionNo => {
        const points = dataPoints.filter(d => d.no === regionNo);
        if (points.length === 0) return;
        traces2d.push({
            x: points.map(d => d.T),
            y: points.map(d => d.P),
            mode: 'markers',
            type: 'scattergl',
            name: REGION_LABELS[regionNo],
            marker: {
                size: isPreview ? 8 : 6,
                color: REGION_COLORS[regionNo],
                opacity: points.map(d => {
                    const val = d[metric];
                    let norm = (val - minVal) / (maxVal - minVal);
                    if (isNaN(norm)) norm = 1;
                    return 0.2 + (0.8 * norm);
                })
            },
            text: points.map(d => `${metric}: ${d[metric].toPrecision(4)}`),
            hovertemplate:
                `<b>${REGION_LABELS[regionNo]}</b><br>` +
                `T: %{x:.2f} K<br>` +
                `P: %{y:.2e} Pa<br>` +
                `${metric}: %{text}<extra></extra>`
        });
    });
    const layout2d = {
        title: `2D投影 ${isPreview ? '(低清预览)' : ''}`,
        uirevision: 'true',
        xaxis: { title: '温度 T (K)' },
        yaxis: { title: '压力 P (Pa)' },
        hovermode: 'closest',
        margin: { l: 60, r: 20, b: 60, t: 40 }
    };
    Plotly.react('plot-2d', traces2d, layout2d);
}