package shop

@RestController
@RequestMapping("/api/orders")
class OrderController(private val prefix: String) {
    @GetMapping
    fun list() = emptyList<String>()

    @GetMapping("/{id}")
    fun find(@PathVariable id: String) = id

    @PutMapping(path = ["/{id:\\d+}/lines/line-{line}"])
    fun replace(@PathVariable id: String) {}

    @RequestMapping("/search", method = [RequestMethod.POST, GET])
    fun search() {}

    @DeleteMapping("/files/{*path}/ignored")
    fun remove() {}

    @PostMapping("/$prefix/computed")
    fun computed() {}

    @RequestMapping(ROUTE)
    fun constant() {}

    @RequestMapping("/export", method = [READ])
    fun export() {}

    fun helper() {}
}

@RequestMapping("/api/clients")
interface OrderClient {
    @GetMapping("/{id}")
    fun find(id: String): String
}

const val ROUTE = "/constant"
