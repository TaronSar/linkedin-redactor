package com.linkedinredactor

import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowUniversalAccessFromFileURLs = true
            settings.databaseEnabled = true
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
            addJavascriptInterface(GeminiBridge(), "GeminiBridge")
            loadUrl("file:///android_asset/index.html")
        }

        setContentView(webView)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    inner class GeminiBridge {
        @JavascriptInterface
        fun callGemini(apiKey: String, systemPrompt: String, userMessage: String): String {
            return try {
                val url = URL("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 30000
                conn.readTimeout = 30000

                val body = JSONObject().apply {
                    put("system_instruction", JSONObject().put("parts", org.json.JSONArray().put(JSONObject().put("text", systemPrompt))))
                    put("contents", org.json.JSONArray().put(JSONObject().put("parts", org.json.JSONArray().put(JSONObject().put("text", userMessage)))))
                    put("generationConfig", JSONObject().apply {
                        put("temperature", 0.9)
                        put("maxOutputTokens", 2048)
                    })
                }

                val writer = OutputStreamWriter(conn.outputStream)
                writer.write(body.toString())
                writer.flush()
                writer.close()

                val code = conn.responseCode
                val stream = if (code == 200) conn.inputStream else conn.errorStream
                val reader = BufferedReader(InputStreamReader(stream))
                val response = reader.readText()
                reader.close()

                if (code != 200) {
                    val err = JSONObject(response).optJSONObject("error")?.optString("message") ?: response
                    return JSONObject().put("error", err).toString()
                }

                val data = JSONObject(response)
                val candidates = data.optJSONArray("candidates")
                if (candidates == null || candidates.length() == 0) {
                    return JSONObject().put("error", "Content was flagged by the AI. Try rephrasing.").toString()
                }
                val text = candidates.getJSONObject(0)
                    .getJSONObject("content")
                    .getJSONArray("parts")
                    .getJSONObject(0)
                    .getString("text")

                JSONObject().put("text", text).toString()
            } catch (e: Exception) {
                JSONObject().put("error", e.message ?: "Network error").toString()
            }
        }
    }
}
