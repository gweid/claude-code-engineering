使用：

问题一：毛利率怎么计算？



问题二：帮我分析 data 目录中的财务数据，生成一份完整的分析报告，放到当前目录跟目录下

Claude 加载过程：

1. 扫描 Skills，发现 financial-analyzing 匹配
2. 加载 SKILL.md
3. 分析任务需要，加载所有 reference/*.md
4. 需要报告格式，加载 templates/analysis_report.md
5. 需要计算 ，执行 scripts/calculate_ratios.py
