package md.groma.scanner

/** Output-only JSON for scan and outline responses. */
object Json {
    fun encode(value: Any?): String = when (value) {
        null -> "null"
        is String -> quote(value)
        is Int, is Boolean -> value.toString()
        is List<*> -> value.joinToString(",", "[", "]") { encode(it) }
        is Map<*, *> -> value.entries.joinToString(",", "{", "}") { "${quote(it.key as String)}:${encode(it.value)}" }
        else -> throw IllegalArgumentException("Unsupported JSON value: ${value::class}")
    }

    private fun quote(text: String): String {
        val output = StringBuilder("\"")
        for (char in text) {
            if (char == '\\' || char == '"') output.append('\\').append(char)
            else if (char < ' ') output.append("\\u%04x".format(char.code))
            else output.append(char)
        }
        return output.append('"').toString()
    }
}
