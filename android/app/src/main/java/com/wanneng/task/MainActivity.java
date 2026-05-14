package com.wanneng.task;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private ValueCallback<android.net.Uri[]> mFilePathCallback;
    private boolean jsInterfaceRegistered = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 不在这里注册JS接口！此时bridge可能还没初始化完成
    }

    @Override
    public void onStart() {
        super.onStart();
        // bridge在onStart时一定已经就绪，可以安全调用
        registerJsBridge();
        setupFileChooser();
    }

    /**
     * 注册 AndroidNative JS接口（供H5调起系统浏览器）
     */
    private void registerJsBridge() {
        if (jsInterfaceRegistered) return;
        try {
            WebView webView = this.bridge.getWebView();
            if (webView != null) {
                webView.addJavascriptInterface(new WebAppInterface(this), "AndroidNative");
                jsInterfaceRegistered = true;
                android.util.Log.d("MainActivity", "AndroidNative JS接口注册成功");
            } else {
                android.util.Log.w("MainActivity", "bridge.getWebView()返回null，稍后重试");
            }
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "JS接口注册失败: " + e.getMessage());
        }
    }

    /**
     * 设置文件选择器（支持上传图片等）
     */
    private void setupFileChooser() {
        try {
            this.bridge.getWebView().setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onShowFileChooser(WebView webView, ValueCallback<android.net.Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams) {
                    mFilePathCallback = filePathCallback;
                    try {
                        Intent intent = fileChooserParams.createIntent();
                        startActivityForResult(intent, 1);
                    } catch (Exception e) {
                        mFilePathCallback.onReceiveValue(null);
                        mFilePathCallback = null;
                    }
                    return true;
                }
            });
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "WebChromeClient设置失败: " + e.getMessage());
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == 1 && mFilePathCallback != null) {
            android.net.Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new android.net.Uri[]{android.net.Uri.parse(dataString)};
                }
            }
            mFilePathCallback.onReceiveValue(results);
            mFilePathCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    /**
     * 原生JS接口 - 提供给H5页面调用的Android原生方法
     */
    public class WebAppInterface {
        private Activity mActivity;

        WebAppInterface(Activity activity) {
            mActivity = activity;
        }

        /**
         * 打开系统浏览器下载APK（或任意URL）
         * H5调用: AndroidNative.openBrowserDownload(url)
         *
         * 修复：统一用浏览器打开，不区分文件类型
         */
        @JavascriptInterface
        public void openBrowserDownload(final String url) {
            mActivity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setData(Uri.parse(url));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        mActivity.startActivity(intent);
                        android.util.Log.d("MainActivity", "已打开浏览器: " + url);
                    } catch (Exception e) {
                        android.util.Log.e("MainActivity", "打开浏览器失败: " + e.getMessage());
                        Toast.makeText(mActivity, "无法打开链接", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        /**
         * 检查是否有可处理该URL的应用
         */
        @JavascriptInterface
        public boolean canOpenUrl(String url) {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            return intent.resolveActivity(mActivity.getPackageManager()) != null;
        }
    }
}
