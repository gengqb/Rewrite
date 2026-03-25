/*************************************

[rewrite_local]
^https?:\/\/((h5|api)\.xiuxiu|api-sub|api\.posters)\.meitu\.com\/.+\/(vip|user|h\d|center|home) url script-response-body https://raw.githubusercontent.com/axtyet/Luminous/main/chxm1023/Rewrite/mtxx.js

[mitm]
hostname = *.xiuxiu.meitu.com, api.posters.meitu.com, api-sub.meitu.com

*************************************/

var currentUrl = $request.url;
var responseData = {};

// 判断是否为需要拦截的请求
if (!currentUrl.startsWith('https://')) {
    return;
}

const targetHosts = ['*.xiuxiu.meitu.com', 'api.posters.meitu.com', 'api-sub.meitu.com'];
if (targetHosts.every(host => !currentUrl.endsWith(host) && !host.replace('*.', '').split('.').some(domain => currentUrl.includes(domain)))) {
    // 简单的前置判断，确保只处理美图相关域名，避免误触其他请求导致卡顿
    return; 
}

// --- 核心逻辑开始 ---

var chxm12 = JSON.parse($response.body);

// 定义需要替换的关键路径关键字 (适配 12.x 版本的常见接口)
const hysj = '/vip/prompt/query.json'; // 首页弹窗提示
const hyxx = '/vip/vip_show.json';    // 会员详情展示
const user = '/user/show.json';       // 用户基础信息
const hyzl = '/vip/new_sub_detail.json'; // 订阅详情
const hymb = '/vip/vip_navigation.json'; // 导航/权益页
const group = '/user/vip_info_by_group.json'; // 会员组信息
const vip = '/center/user_info.json';    // 中心会员中心
const sjs = '/user/info_by_entrance.json'; // 入口用户信息
const sjshf = '/home/home.json';        // 首页数据
const kta = 'https://api.posters.meitu.com/center/user_rights.json'; // 剪贴板/抠图权益
const ktb = 'https://api.posters.meitu.com/center/user_rights_consume.json'; // 权益消耗

// === 处理逻辑：针对 12.x 版本的兼容性增强 ===

// 1. 首页弹窗提示 (hysj)
if ($request.url.indexOf(hysj) != -1) {
    try {
        if (chxm12 && chxm12.data) {
            chxm12.data = {
                "home_btn_prompt": "立即查看",
                "if_transfer": 0,
                "pay_interval": 3000,
                "beautify_prompt": "",
                "home_prompt": "会员有效期至 2099/12/31", // 显示为长期有效
                "svip_bubble_text": "粉钻 SVIP：有效期至 2099/12/31\n粉钻 VIP：有效期至 2099/12/31",
                "beautify_btn_prompt": "",
                "request_time": Date.now() / 1000
            };
        } else if (chxm12 && typeof chxm12 === 'object') {
             // 兼容返回值为非 data 对象的情况
             chxm12.success = true;
             chxm12.message = "VIP Check OK";
        }
    } catch(e) {}
}

// 2. 会员展示详情 (hyxx) - 12.x 版本常在此处检查有效期
if ($request.url.indexOf(hyxx) != -1) {
    try {
        if (chxm12 && chxm12.data) {
            chxm12.data = {
                "id": "666666666666666666",
                "id_str": "666666666666666666",
                "valid_time": 4092599349, // 一个很大的未来时间戳 (2120-09-16)
                "uid": 1666666666,
                "sub_type": 3,
                "expire_days": -99999,   // 负数表示已过期天数，这里用极大负数模拟永久
                "screen_name": "",
                "avatar_url": "",
                "in_valid_time": 4092599349,
                "gid": 1234567890,
                "s": 1,
                "vip_type": 101,         // 101 通常代表高级会员或粉钻
                "platform": 2,           // iOS
                "sub_name": "包年",
                "renew": 2,
                "is_valid_user": 1,
                "create_time": Date.now() - 86400000 * 365, // 模拟已订阅一段时间
                "sub_biz_type": 1,
                "is_expire": 0,          // 未过期
                "in_valid_time": 4092599349
            };
        } else if (chxm12) {
            chxm12.success = true;
            chxm12.message = "VIP Show OK";
        }
    } catch(e) {}
}

// 3. 用户基础信息 (user) - 增加粉丝数和点赞数模拟
if ($request.url.indexOf(user) != -1) {
    try {
        if (chxm12 && chxm12.data) {
            // 12.x 版本有时需要处理嵌套结构，这里做防御性赋值
            if (!chxm12.data.vip_type) chxm12.data.vip_type = 0;
            if (!chxm12.data.vip_icon) chxm12.data.vip_icon = ""; 
            
            // 注入高级会员标识
            chxm12.data.vip_type = 101; 
            // 注意：图标 URL 需要替换为有效的公开地址，这里使用示例
            chxm12.data.vip_icon = "https://xximg1.meitudata.com/6948531747980333892.png"; 
            
            if (!chxm12.data.follower_count) chxm12.data.follower_count = 10;
            if (!chxm12.data.fan_count) chxm12.data.fan_count = 10;
            if (!chxm12.data.be_like_count) chxm12.data.be_like_count = 10;

            // 强制标记为高级会员用户
            chxm12.data.is_vip_user = true;
        }
    } catch(e) {}
}

// 4. 订阅详情 (hyzl) - 处理复杂的嵌套对象，防止报错
if ($request.url.indexOf(hyzl) != -1) {
    try {
        if (chxm12 && chxm12.data) {
            // 清理可能导致问题的字段
            delete chxm12.data.materials; 
            delete chxm12.data.prices; 
            delete chxm12.data.new_version_rotograms; 
            
            // 构造永久订阅信息
            const now = Date.now();
            const farFuture = 4092599349; // 对应的时间戳

            chxm12.data.vip_sign_info = {
                "sub_type": 3,
                "renew_status": 1,
                "show_auto_renew": 1,
                "next_withhold_amount": 0, // 模拟免费或已付
                "withhold_currency_symbol": "¥",
                "next_withhold_date": "2099-12-31",
                "pay_channel": "Apple",
                "do_pop_up": false
            };

            // 核心会员数据赋值
            chxm12.data.vip_power_num = 999999;
            chxm12.data.new_power_num = 999999;
            chxm12.data.welfare_center_num = 999999;
            
            // 时间字段统一处理
            chxm12.data.valid_time = farFuture;
            chxm12.data.invalid_time = farFuture;
            chxm12.data.expire_days = -99999;

            // 确保状态字符合规
            if (!chxm12.data.is_expire) chxm12.data.is_expire = false; // 明确设为未过期
            
            chxm12.data.vip_type = 101;
            
            // 构造 hbp_vip (高级会员包)
            chxm12.data.hbp_vip = {
                "sub_type": 3,
                "valid_time": farFuture,
                "renew": 1,
                "expire_days": -99999,
                "is_expire": false,
                "in_valid_time": farFuture,
                "s": 0
            };
            
            chxm12.data.sub_biz_type = 1;
            chxm12.data.old_vip_type = 4; // 兼容旧数据判断
        }
    } catch(e) {}
}

// 5. 导航/权益页 (hymb)
if ($request.url.indexOf(hymb) != -1) {
    try {
        if (chxm12 && chxm12.data) {
            delete chxm12.data.rights; 
            delete chxm12.data.navigation_card_list; 
            delete chxm12.data.config_list; 
            delete chxm12.data.pendant; 
            
            chxm12.data.vip_type = 101;
            chxm12.data.display_vip_time = 1;
            chxm12.data.display_vip_type = 2;

            // 构造 hbp_vip 对象 (12.x 版本对此字段依赖较强)
            const farFuture = 4092599349;
            chxm12.data.hbp_vip = {
                "id": "666666666666666666",
                "id_str": "666666666666666666",
                "valid_time": farFuture,
                "uid": 1666666666,
                "sub_type": 3,
                "sub_biz_type": 1,
                "avatar_url": "",
                "is_expire": false,
                "expire_days": -99999,
                "gid": 1234567890,
                "vip_type": 101,
                "platform": 2,
                "sub_name": "包年",
                "renew": 2,
                "s": 0,
                "is_valid_user": true,
                "create_time": Date.now() - 86400000 * 365,
                "screen_name": "",
                "in_valid_time": farFuture
            };

            // 构造 xx_vip (普通 VIP)
            chxm12.data.xx_vip = {
                "id": "666666666666666666",
                "id_str": "666666666666666666",
                "valid_time": farFuture,
                "uid": 1666666666,
                "sub_type": 3,
                "sub_biz_type": 1,
                "avatar_url": "",
                "is_expire": false,
                "expire_days": -99999,
                "gid": 1234567890,
                "vip_type": 101,
                "platform": 2,
                "sub_name": "包年",
                "renew": 2,
                "s": 0,
                "is_valid_user": true,
                "create_time": Date.now() - 86400000 * 365,
                "screen_name": "",
                "in_valid_time": farFuture
            };
        }
    } catch(e) {}
}

// 6. 会员组信息 (group)
if ($request.url.indexOf(group) != -1) {
    try {
        if (!chxm12.data) chxm12.data = {};
        
        chxm12.data = {
            "active_sub_type": 2,
            "account_type": 1,
            "sub_type_name": "高级会员",
            "active_sub_order_id": "666666666666666666",
            "trial_period_invalid_time": "4092599349000",
            "current_order_invalid_time": "4092599349000",
            "active_order_id": "666666666666666666",
            "limit_type": 0,
            "active_sub_type_name": "高级会员",
            "use_vip": true,
            "have_valid_contract": false,
            "derive_type_name": "高级会员",
            "derive_type": 1,
            "in_trial_period": true,
            "is_vip": true,
            "membership": {
                "id": "7",
                "display_name": "",
                "level": 3, // 提高等级
                "level_name": "高级会员"
            },
            "active_promotion_status_list": [2, 6],
            "sub_type": 3,
            "account_id": "1666666666",
            "invalid_time": "4092599349000",
            "valid_time": "4092599349000",
            "active_product_id": "0",
            "active_promotion_status": 2,
            "show_renew_flag": false
        };
    } catch(e) {}
}

// 7. 中心会员中心 (vip) - 简化的处理，避免深结构报错
if ($request.url.indexOf(vip) != -1) {
    try {
        if (chxm12 && chxm12.data) {
            // 12.x 版本此处可能直接返回 is_vip 或 vip_end_time
            if (!chxm12.data.is_vip) chxm12.data.is_vip = true;
            if (!chxm12.data.vip_end_time) chxm12.data.vip_end_time = 4092599349;
            
            // 确保返回对象包含必要的成功标识，视具体接口响应格式而定
            if (typeof chxm12 === 'object' && !chxm12.success) {
                chxm12.success = true;
            }
        }
    } catch(e) {}
}

// 8. 入口用户信息 (sjs) - 处理嵌套的 vip_info
if ($request.url.indexOf(sjs) != -1) {
    try {
        if (!chxm12.data) chxm12.data = {};
        
        const farFuture = "4092599349000";
        chxm12.data = {
            "vip_info": {
                "active_sub_type": 2,
                "account_type": 1,
                "sub_type_name": "高级会员",
                "active_sub_order_id": "666666666666666666",
                "trial_period_invalid_time": farFuture,
                "current_order_invalid_time": farFuture,
                "active_order_id": "666666666666666666",
                "limit_type": 0,
                "active_sub_type_name": "高级会员",
                "use_vip": true,
                "have_valid_contract": false,
                "derive_type_name": "高级会员",
                "derive_type": 1,
                "in_trial_period": true,
                "is_vip": true,
                "membership": {
                    "id": "7",
                    "display_name": "",
                    "level": 3,
                    "level_name": "高级会员"
                },
                "active_promotion_status_list": [2, 6],
                "sub_type": 3,
                "account_id": "1666666666",
                "invalid_time": farFuture,
                "valid_time": farFuture,
                "active_product_id": "0",
                "active_promotion_status": 2,
                "show_renew_flag": false
            },
            "account_type": 1,
            "account_id": "1666666666",
            "rights_info": [
                {
                    "show_tips": "抠图剩余张数：9999999 张 >",
                    "commodity_unit": "2",
                    "link_words": "9999999 张 >",
                    "commodity_id": "shejishi.cutout",
                    "commodity_count": 9999999
                }
            ]
        };
    } catch(e) {}
}

// 9. 首页数据 (sjshf) - 移除广告 Banner
if ($request.url.indexOf(sjshf) != -1) {
    try {
        if (chxm12 && chxm12.data) {
            delete chxm12.data.banner;
        }
    } catch(e) {}
}

// 10. 剪贴板/抠图权益 (kta)
if ($request.url.indexOf(kta) != -1) {
    try {
        if (!chxm12.data) chxm12.data = {};
        chxm12.data = {
            "cutout": {
                "num_left": 9999999
            }
        };
    } catch(e) {}
}

// 11. 权益消耗 (ktb)
if ($request.url.indexOf(ktb) != -1) {
    try {
        if (!chxm12.data) chxm12.data = {};
        chxm12.data = {
            "consume_result": true
        };
    } catch(e) {}
}

// --- 核心逻辑结束 ---

$done({body: JSON.stringify(chxm12)});
