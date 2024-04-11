# 油猴脚本共享

这个项目包含三个用户脚本,用于增强FlowIn/TeacherIn网站的样式,以及在Claude AI聊天界面中实现中文符号的批量替换。

## 功能介绍

### FlowIn样式增强

- 调整页面主体宽度为100%,最大宽度不限
- 修复字体为微软雅黑
- 限制画布最大宽度为1280px,并居中显示
- 强调列表数字样式
- 注入全宽度切换按钮,可快速开启/关闭页面全宽显示

### TeacherIn样式增强 

- 去除课程文件头部和课程阅读容器的最大宽度限制

### Claude AI中文符号批量替换

- 监听复制操作,当检测到用户复制了Claude AI的回复内容时,提示用户按下'c'键将符号批量替换为中文符号
- 替换范围包括常见的标点符号如逗号、句号、问号、括号等

## 使用方法

1. 在浏览器中安装Tampermonkey扩展
   
     【edge商店】：
     
     https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd
     
     【chrome商店】：
     
     https://chromewebstore.google.com/detail/%E7%AF%A1%E6%94%B9%E7%8C%B4/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=zh-CN
  
2. 进入扩展设置，点击实用工具
   
   ![image](https://github.com/leo4stone/tmsp/assets/10969261/82356ef7-b8e4-4d21-9e62-5a4b7cf2308c)

3. 粘贴下方网址到“从URL安装”，点击安装
   
   FlowIn样式增强脚本 `https://raw.githubusercontent.com/leo4stone/tmsp/main/flowin_style_enhancer.js`
   
   TeacherIn样式增强脚本 `https://raw.githubusercontent.com/leo4stone/tmsp/main/teacherin_nbstyle_enhancer.js`
   
   Claude AI中文符号批量替换脚本 `https://raw.githubusercontent.com/leo4stone/tmsp/main/claudeai_clipboardsymbol_recn.js`

4. 继续点击安装
   
     ![image](https://github.com/leo4stone/tmsp/assets/10969261/81b8200d-7a4e-4c13-974f-2757c6a889ee)


5. 刷新FlowIn/TeacherIn页面即可看到样式变化
   在Claude AI聊天界面复制Assistant的回复,按下'c'键即可将符号替换为中文符号

## 注意事项

- 脚本仅在匹配的网站上生效,请确保Tampermonkey中正确配置了@match字段
- 若脚本不生效,请检查脚本是否被禁用,或尝试重新启用
- 脚本会不定期更新,若遇到问题欢迎反馈

希望这些小工具能给你带来更好的FlowIn/TeacherIn和Claude AI使用体验,欢迎star和提出宝贵的改进意见!
