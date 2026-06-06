package com.goose.android.ble
import com.goose.android.bridge.GooseRustBridge
import org.json.JSONObject
import java.util.concurrent.LinkedBlockingQueue
import kotlin.concurrent.thread
class WhoopPacketHandler(private val bridge: GooseRustBridge) {
    private val queue = LinkedBlockingQueue<Pair<String, ByteArray>>()
    init {
        thread(start = true, name = "WhoopPacketProcessor") {
            while (true) {
                val item = queue.take()
                val frames = extractV5Frames(item.second)
                for (frame in frames) {
                    val payload = extractV5Payload(frame) ?: continue
                    val method = if (item.first.lowercase().contains("0003")) "capture.ingest_live_frame" else "capture.ingest_historical_frame"
                    bridge.request(method, JSONObject().apply { put("payload_hex", payload.joinToString("") { "%02x".format(it) }) }.toString())
                }
            }
        }
    }
    fun handlePacket(uuid: String, data: ByteArray) { queue.put(uuid to data) }
    private fun extractV5Frames(data: ByteArray): List<ByteArray> {
        val res = mutableListOf<ByteArray>()
        var i = 0
        while (i < data.size) {
            if (data[i] == 0xAA.toByte() && i + 8 <= data.size) {
                val len = (data[i + 2].toInt() and 0xFF) or (data[i + 3].toInt() and 0xFF shl 8)
                if (i + len + 8 <= data.size) { res.add(data.copyOfRange(i, i + len + 8)); i += len + 8; continue }
            }
            i++
        }
        return res
    }
    private fun extractV5Payload(f: ByteArray): ByteArray? = if (f.size < 12) null else f.copyOfRange(8, f.size - 4)
}
