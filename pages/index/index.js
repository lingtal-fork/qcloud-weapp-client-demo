/**
 * @fileOverview 演示会话服务和 WebSocket 信道服务的使用方式
 */

// 引入 QCloud 小程序增强 SDK
var qcloud = require('../../bower_components/qcloud-weapp-client-sdk/index');

// 引入配置
var config = require('../../config');

/**
 * 使用 Page 初始化页面，具体可参考微信公众平台上的文档
 */
Page({

    /**
     * 初始数据，我们把服务地址显示在页面上
     */
    data: {
        loginUrl: config.service.loginUrl,
        requestUrl: config.service.requestUrl,
        tunnelUrl: config.service.tunnelUrl,
    },

    /**
     * 点击「登录」按钮，测试登录功能
     */
    doLogin() {
        // 登录之前需要调用 qcloud.setLoginUrl() 设置登录地址，不过我们再 app.js 的入口里面已经调用过了，后面就不用再调用了
        qcloud.login({
            success: function () {
                console.log('登录成功', arguments);
            },

            fail: function () {
                console.log('登录失败', arguments);
            }
        });
    },

    /**
     * 点击「清除会话」按钮
     */
    clearSession: function () {
        // 因为会话是存放在微信的 storage 里面的，所以清除 storage 会清除会话
        wx.clearStorageSync();
    },

    /**
     * 点击「请求」按钮，测试带会话请求的功能
     */
    doRequest: function () {
        // qcloud.request() 方法和 wx.request() 方法使用是一致的，不过如果用户已经登录的情况下，会把用户的会话信息带给服务器，服务器可以跟踪用户
        qcloud.request({
            // 要请求的地址
            url: this.data.requestUrl,

            // 请求之前是否登陆，如果该项指定为 true，会在请求之前进行登录
            login: true,

            success: function () {
                console.log('request success', arguments);
            },

            fail: function () {
                console.log('request fail', arguments);
            },

            complete: function () {
                console.log('request complete');
            }
        });
    },

    /**
     * 点击「打开信道」，测试 WebSocket 信道服务
     */
    openTunnel: function () {

        // 创建信道，需要给定后台服务地址
        var tunnel = this.tunnel = new qcloud.Tunnel(this.data.tunnelUrl);

        // 打开信道
        tunnel.open();

        // 监听信道内置消息，包括 connect/close/reconnecting/reconnect/error
        tunnel.on('connect', () => console.log('WebSocket 信道已连接'));
        tunnel.on('close', () => console.log('WebSocket 信道已断开'));
        tunnel.on('reconnecting', () => console.log('WebSocket 信道正在重连...'));
        tunnel.on('reconnect', () => console.log('WebSocket 信道重连成功'));
        tunnel.on('error', error => console.error('信道发生错误：', error));

        // 监听自定义消息（服务器进行推送）
        tunnel.on('speak', speak => console.log('收到说话消息：', speak));
    },

    /**
     * 点击「发送消息」按钮，测试使用信道发送消息
     */
    sendMessage: function () {
        // 使用 tunnel.isActive() 来检测当前信道是否处于可用状态
        if (this.tunnel && this.tunnel.isActive()) {
            // 使用信道给服务器推送「speak」消息
            this.tunnel.emit('speak', {
                'word': 'I say someting at ' + new Date(),
            });
        }
    },

    /**
     * 点击「测试重连」按钮，测试重连
     * 也可以断开网络一段时间之后再连接，测试重连能力
     */
    testReconnect() {
        // 不通过 SDK 关闭连接，而是直接用微信断开来模拟连接断开的情况下，考察 SDK 自动重连的能力
        wx.closeSocket();
    },

    /**
     * 点击「关闭信道」按钮，关闭已经打开的信道
     */
    closeTunnel: function () {
        if (this.tunnel) {
            this.tunnel.close();
        }
    },

    /**
     * 点击「聊天室」按钮，跳转到聊天室综合 Demo 的页面
     */
    openChat: function () {
        // 微信只允许一个信道再运行，聊天室使用信道前，我们先把当前的关闭
        this.closeTunnel();
        wx.navigateTo({ url: '../chat/chat' });
    },
});
