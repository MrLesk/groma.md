package shop

@RestController
class InvoiceController : InvoiceApi {
    @GetMapping("/{id}")
    override fun find(@PathVariable id: String) = id
}
